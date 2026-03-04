let cloud = null
let db = null

try {
  cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  db = cloud.database()
} catch (err) {
  // Allow local unit tests without installing cloud runtime deps.
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeekMonday(date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const offset = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - offset)
  return d
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addOrder(acc, orderDate, amount, todayStart, weekStart, monthStart) {
  acc.all.count += 1
  acc.all.amount += amount

  if (orderDate >= monthStart) {
    acc.month.count += 1
    acc.month.amount += amount
  }
  if (orderDate >= weekStart) {
    acc.week.count += 1
    acc.week.amount += amount
  }
  if (orderDate >= todayStart) {
    acc.today.count += 1
    acc.today.amount += amount
  }
}

async function getStats({ db, getWXContext, now }) {
  const wxContext = getWXContext()
  const openid = wxContext.OPENID

  const adminCheck = await db.collection('admins').where({ openid }).count()
  if (adminCheck.total === 0) {
    return { success: false, error: '无管理权限' }
  }

  const current = typeof now === 'function' ? now() : new Date()
  const todayStart = startOfDay(current)
  const weekStart = startOfWeekMonday(current)
  const monthStart = startOfMonth(current)

  const result = await db.collection('orders').get()
  const stats = {
    today: { count: 0, amount: 0 },
    week: { count: 0, amount: 0 },
    month: { count: 0, amount: 0 },
    all: { count: 0, amount: 0 }
  }

  for (const order of result.data || []) {
    const orderDate = new Date(order.createdAt)
    const amount = Number.isFinite(order.amount) ? order.amount : 0
    if (Number.isNaN(orderDate.getTime())) {
      continue
    }
    addOrder(stats, orderDate, amount, todayStart, weekStart, monthStart)
  }

  return { success: true, stats }
}

exports.main = async () => {
  if (!cloud || !db) {
    throw new Error('wx-server-sdk is not available in current runtime')
  }
  return getStats({
    db,
    getWXContext: cloud.getWXContext,
    now: () => new Date()
  })
}

exports.__test__ = { getStats }
