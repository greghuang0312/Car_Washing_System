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

  const res = await __test__.getOrders({
    db,
    getWXContext: () => ({ OPENID: 'u1' }),
    event: {}
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '无管理权限')
}

async function shouldReturnPaginatedOrdersWithFilters() {
  let capturedQuery = null
  let capturedSkip = -1
  let capturedLimit = -1
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
          where(query) {
            capturedQuery = query
            return {
              count: async () => ({ total: 12 }),
              orderBy(field, order) {
                assert.equal(field, 'createdAt')
                assert.equal(order, 'desc')
                return {
                  skip(n) {
                    capturedSkip = n
                    return {
                      limit(m) {
                        capturedLimit = m
                        return {
                          get: async () => ({
                            data: [{ _id: 'o1' }, { _id: 'o2' }]
                          })
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      throw new Error(`unexpected collection ${name}`)
    }
  }

  const res = await __test__.getOrders({
    db,
    getWXContext: () => ({ OPENID: 'u2' }),
    event: {
      stationId: 'station_01',
      status: 'completed',
      page: 2,
      pageSize: 5
    }
  })

  assert.equal(res.success, true)
  assert.equal(res.total, 12)
  assert.equal(res.page, 2)
  assert.equal(res.pageSize, 5)
  assert.deepEqual(res.orders, [{ _id: 'o1' }, { _id: 'o2' }])
  assert.deepEqual(capturedQuery, { stationId: 'station_01', status: 'completed' })
  assert.equal(capturedSkip, 5)
  assert.equal(capturedLimit, 5)
}

async function run() {
  await shouldRejectNonAdmin()
  await shouldReturnPaginatedOrdersWithFilters()
  console.log('getOrders tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
