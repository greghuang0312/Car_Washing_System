let cloud = null
let db = null

try {
  cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  db = cloud.database()
} catch (err) {
  // Allow local unit tests without installing cloud runtime deps.
}

async function startWash({ db, getWXContext, event }) {
  const wxContext = getWXContext()
  const openid = wxContext.OPENID
  const { stationId } = event || {}

  if (!stationId) {
    return { success: false, error: '缺少洗车站编号' }
  }

  const existingOrder = await db
    .collection('orders')
    .where({ openid, status: 'washing' })
    .get()

  if (existingOrder.data.length > 0) {
    return {
      success: false,
      error: '您有未完成的洗车订单',
      orderId: existingOrder.data[0]._id
    }
  }

  const result = await db.collection('orders').add({
    data: {
      openid,
      stationId,
      status: 'washing',
      startTime: db.serverDate(),
      endTime: null,
      duration: 0,
      amount: 0,
      paidAt: null,
      createdAt: db.serverDate()
    }
  })

  return { success: true, orderId: result._id }
}

exports.main = async (event) => {
  if (!cloud || !db) {
    throw new Error('wx-server-sdk is not available in current runtime')
  }
  return startWash({
    db,
    getWXContext: cloud.getWXContext,
    event
  })
}

exports.__test__ = { startWash }
