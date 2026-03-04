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

async function getMyOrders({ db, getWXContext, event }) {
  const wxContext = getWXContext()
  const openid = wxContext.OPENID
  const page = normalizePage(event?.page, 1)
  const pageSize = Math.min(normalizePage(event?.pageSize, 20), 100)
  const skip = (page - 1) * pageSize

  const base = db.collection('orders').where({ openid })
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
  return getMyOrders({
    db,
    getWXContext: cloud.getWXContext,
    event
  })
}

exports.__test__ = { getMyOrders }
