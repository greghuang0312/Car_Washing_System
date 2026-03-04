let cloud = null
let db = null

try {
  cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  db = cloud.database()
} catch (err) {
  // Allow local unit tests without installing cloud runtime deps.
}

async function endWash({ db, getWXContext, now }) {
  const wxContext = getWXContext()
  const openid = wxContext.OPENID

  const orderResult = await db.collection('orders').where({ openid, status: 'washing' }).get()
  if (orderResult.data.length === 0) {
    return { success: false, error: '未找到进行中的洗车订单' }
  }

  let settings = null
  try {
    const settingsResult = await db.collection('settings').doc('default').get()
    settings = settingsResult.data
  } catch (err) {
    return { success: false, error: '系统计费配置缺失，请联系管理员' }
  }

  if (!settings || typeof settings.pricePerMinute !== 'number') {
    return { success: false, error: '系统计费配置缺失，请联系管理员' }
  }

  const order = orderResult.data[0]
  const nowTime = typeof now === 'function' ? now() : new Date()
  const startTime = new Date(order.startTime)
  let duration = Math.ceil((nowTime - startTime) / 60000)

  const maxDuration = settings.maxDuration || 120
  if (duration > maxDuration) {
    duration = maxDuration
  }
  if (duration < 1) {
    duration = 1
  }

  const amount = duration * settings.pricePerMinute

  await db.collection('orders').doc(order._id).update({
    data: {
      status: 'completed',
      endTime: db.serverDate(),
      duration,
      amount
    }
  })

  return {
    success: true,
    orderId: order._id,
    duration,
    amount,
    stationId: order.stationId
  }
}

exports.main = async () => {
  if (!cloud || !db) {
    throw new Error('wx-server-sdk is not available in current runtime')
  }
  return endWash({
    db,
    getWXContext: cloud.getWXContext,
    now: () => new Date()
  })
}

exports.__test__ = { endWash }
