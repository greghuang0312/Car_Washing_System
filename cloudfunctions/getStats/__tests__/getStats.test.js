const assert = require('node:assert/strict')
const { __test__ } = require('../index')

async function shouldRejectNonAdmin() {
  const db = {
    collection(name) {
      if (name === 'admins') {
        return {
          where() {
            return {
              count: async () => ({ total: 0 })
            }
          }
        }
      }
      throw new Error('orders should not be accessed')
    }
  }

  const res = await __test__.getStats({
    db,
    getWXContext: () => ({ OPENID: 'u1' }),
    now: () => new Date('2026-03-04T12:00:00.000Z')
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '无管理权限')
}

async function shouldAggregateTodayWeekMonthAndAll() {
  const db = {
    collection(name) {
      if (name === 'admins') {
        return {
          where() {
            return {
              count: async () => ({ total: 1 })
            }
          }
        }
      }
      if (name === 'orders') {
        return {
          get: async () => ({
            data: [
              { createdAt: '2026-03-04T08:00:00.000Z', amount: 100 },
              { createdAt: '2026-03-03T10:00:00.000Z', amount: 200 },
              { createdAt: '2026-03-01T11:00:00.000Z', amount: 300 },
              { createdAt: '2026-02-15T11:00:00.000Z', amount: 400 }
            ]
          })
        }
      }
      throw new Error(`unexpected collection ${name}`)
    }
  }

  const res = await __test__.getStats({
    db,
    getWXContext: () => ({ OPENID: 'u2' }),
    now: () => new Date('2026-03-04T12:00:00.000Z')
  })

  assert.equal(res.success, true)
  assert.deepEqual(res.stats, {
    today: { count: 1, amount: 100 },
    week: { count: 2, amount: 300 },
    month: { count: 3, amount: 600 },
    all: { count: 4, amount: 1000 }
  })
}

async function run() {
  await shouldRejectNonAdmin()
  await shouldAggregateTodayWeekMonthAndAll()
  console.log('getStats tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
