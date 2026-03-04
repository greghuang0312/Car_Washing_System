const assert = require('node:assert/strict')
const { __test__ } = require('../index')

async function shouldReturnCurrentUserOrdersWithPaging() {
  let capturedQuery = null
  let capturedSkip = -1
  let capturedLimit = -1
  const db = {
    collection(name) {
      assert.equal(name, 'orders')
      return {
        where(query) {
          capturedQuery = query
          return {
            count: async () => ({ total: 7 }),
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
                          data: [{ _id: 'm1' }, { _id: 'm2' }]
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
  }

  const res = await __test__.getMyOrders({
    db,
    getWXContext: () => ({ OPENID: 'my-openid' }),
    event: { page: 3, pageSize: 2 }
  })

  assert.equal(res.success, true)
  assert.equal(res.total, 7)
  assert.equal(res.page, 3)
  assert.equal(res.pageSize, 2)
  assert.deepEqual(res.orders, [{ _id: 'm1' }, { _id: 'm2' }])
  assert.deepEqual(capturedQuery, { openid: 'my-openid' })
  assert.equal(capturedSkip, 4)
  assert.equal(capturedLimit, 2)
}

async function run() {
  await shouldReturnCurrentUserOrdersWithPaging()
  console.log('getMyOrders tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
