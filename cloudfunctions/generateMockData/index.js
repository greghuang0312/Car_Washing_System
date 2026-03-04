let cloud = null
let db = null

try {
  cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  db = cloud.database()
} catch (err) {
  // Allow local unit tests without installing cloud runtime deps.
}

function normalizeCount(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 30
}

function buildMockOrder({ random, now }) {
  const stations = ['station_01', 'station_02']
  const statuses = ['paid', 'paid', 'paid', 'completed']

  const current = now()
  const startDate = new Date(current)
  const daysAgo = Math.floor(random() * 30)
  startDate.setDate(startDate.getDate() - daysAgo)
  startDate.setHours(Math.floor(random() * 12) + 7)
  startDate.setMinutes(Math.floor(random() * 60))
  startDate.setSeconds(0)
  startDate.setMilliseconds(0)

  const duration = Math.floor(random() * 45) + 5
  const endDate = new Date(startDate.getTime() + duration * 60000)
  const pricePerMinute = 100
  const amount = duration * pricePerMinute
  const status = statuses[Math.floor(random() * statuses.length)]

  return {
    openid: `mock_user_${Math.floor(random() * 10)}`,
    stationId: stations[Math.floor(random() * stations.length)],
    status,
    startTime: startDate,
    endTime: endDate,
    duration,
    amount,
    paidAt: status === 'paid' ? endDate : null,
    createdAt: startDate
  }
}

async function generateMockData({ db, getWXContext, event, random = Math.random, now = () => new Date() }) {
  const wxContext = getWXContext()
  const openid = wxContext.OPENID

  const adminCheck = await db.collection('admins').where({ openid }).count()
  if (adminCheck.total === 0) {
    return { success: false, error: '无管理权限' }
  }

  const count = normalizeCount(event?.count)
  const mockOrders = []
  for (let i = 0; i < count; i += 1) {
    mockOrders.push(buildMockOrder({ random, now }))
  }

  const batchSize = 20
  for (let i = 0; i < mockOrders.length; i += batchSize) {
    const batch = mockOrders.slice(i, i + batchSize)
    await Promise.all(batch.map((order) => db.collection('orders').add({ data: order })))
  }

  return { success: true, inserted: mockOrders.length }
}

exports.main = async (event) => {
  if (!cloud || !db) {
    throw new Error('wx-server-sdk is not available in current runtime')
  }
  return generateMockData({
    db,
    getWXContext: cloud.getWXContext,
    event
  })
}

exports.__test__ = { generateMockData }
