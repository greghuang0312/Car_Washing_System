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
      throw new Error('orders should not be touched for non-admin')
    }
  }

  const res = await __test__.generateMockData({
    db,
    getWXContext: () => ({ OPENID: 'u1' }),
    event: { count: 3 },
    random: () => 0.1,
    now: () => new Date('2026-03-04T10:00:00.000Z')
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '无管理权限')
}

async function shouldGenerateRequestedCount() {
  const inserted = []
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
          add: async ({ data }) => {
            inserted.push(data)
          }
        }
      }
      throw new Error(`unexpected collection ${name}`)
    }
  }

  const randomSeq = [0.0, 0.2, 0.4, 0.6, 0.8, 0.1]
  let i = 0
  const random = () => {
    const val = randomSeq[i % randomSeq.length]
    i += 1
    return val
  }

  const res = await __test__.generateMockData({
    db,
    getWXContext: () => ({ OPENID: 'u2' }),
    event: { count: 3 },
    random,
    now: () => new Date('2026-03-04T10:00:00.000Z')
  })

  assert.equal(res.success, true)
  assert.equal(res.inserted, 3)
  assert.equal(inserted.length, 3)

  for (const order of inserted) {
    assert.ok(['station_01', 'station_02'].includes(order.stationId))
    assert.ok(['paid', 'completed'].includes(order.status))
    assert.equal(order.amount, order.duration * 100)
    assert.equal(typeof order.openid, 'string')
  }
}

async function shouldDefaultTo30WhenCountMissing() {
  let addCount = 0
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
          add: async () => {
            addCount += 1
          }
        }
      }
      throw new Error(`unexpected collection ${name}`)
    }
  }

  const res = await __test__.generateMockData({
    db,
    getWXContext: () => ({ OPENID: 'u3' }),
    event: {},
    random: () => 0.5,
    now: () => new Date('2026-03-04T10:00:00.000Z')
  })

  assert.equal(res.success, true)
  assert.equal(res.inserted, 30)
  assert.equal(addCount, 30)
}

async function run() {
  await shouldRejectNonAdmin()
  await shouldGenerateRequestedCount()
  await shouldDefaultTo30WhenCountMissing()
  console.log('generateMockData tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
