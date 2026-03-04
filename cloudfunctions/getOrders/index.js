let cloud = null
let db = null

try {
  cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  db = cloud.database()
} catch (err) {
  // Allow local unit tests without installing cloud runtime deps.
}

function normalizePage(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

async function getOrders({ db, getWXContext, event }) {
  const wxContext = getWXContext()
  const openid = wxContext.OPENID
  const { stationId, status } = event || {}
  const page = normalizePage(event?.page, 1)
  const pageSize = Math.min(normalizePage(event?.pageSize, 20), 100)
  const skip = (page - 1) * pageSize

  const adminCheck = await db.collection('admins').where({ openid }).count()
  if (adminCheck.total === 0) {
    return { success: false, error: '无管理权限' }
  }

  const query = {}
  if (stationId) query.stationId = stationId
  if (status) query.status = status

  const base = db.collection('orders').where(query)
  const totalResult = await base.count()
  const listResult = await base.orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get()

  return {
    success: true,
    orders: listResult.data,
    total: totalResult.total,
    page,
    pageSize
  }
}

exports.main = async (event) => {
  if (!cloud || !db) {
    throw new Error('wx-server-sdk is not available in current runtime')
  }
  return getOrders({
    db,
    getWXContext: cloud.getWXContext,
    event
  })
}

exports.__test__ = { getOrders }
