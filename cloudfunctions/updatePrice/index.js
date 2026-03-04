let cloud = null
let db = null

try {
  cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  db = cloud.database()
} catch (err) {
  // Allow local unit tests without installing cloud runtime deps.
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0
}

async function updatePrice({ db, getWXContext, event }) {
  const wxContext = getWXContext()
  const openid = wxContext.OPENID
  const { pricePerMinute } = event || {}

  const adminCheck = await db.collection('admins').where({ openid }).count()
  if (adminCheck.total === 0) {
    return { success: false, error: '无管理权限' }
  }

  if (!isPositiveInteger(pricePerMinute)) {
    return { success: false, error: '价格必须为正整数（单位：分）' }
  }

  try {
    await db.collection('settings').doc('default').update({
      data: {
        pricePerMinute,
        updatedAt: db.serverDate()
      }
    })
  } catch (err) {
    await db.collection('settings').add({
      data: {
        _id: 'default',
        pricePerMinute,
        maxDuration: 120,
        updatedAt: db.serverDate()
      }
    })
  }

  return { success: true, pricePerMinute }
}

exports.main = async (event) => {
  if (!cloud || !db) {
    throw new Error('wx-server-sdk is not available in current runtime')
  }
  return updatePrice({
    db,
    getWXContext: cloud.getWXContext,
    event
  })
}

exports.__test__ = { updatePrice }
