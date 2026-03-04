const assert = require('node:assert/strict')
const { __test__ } = require('../index')

async function shouldReturnErrorWhenNoWashingOrder() {
  const db = {
    collection(name) {
      assert.equal(name, 'orders')
      return {
        where(query) {
          assert.deepEqual(query, { openid: 'u1', status: 'washing' })
          return {
            get: async () => ({ data: [] })
          }
        }
      }
    }
  }

  const res = await __test__.endWash({
    db,
    getWXContext: () => ({ OPENID: 'u1' }),
    now: () => new Date('2026-03-04T10:00:00.000Z')
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '未找到进行中的洗车订单')
}

async function shouldReturnReadableErrorWhenSettingsMissing() {
  const db = {
    collection(name) {
      if (name === 'orders') {
        return {
          where() {
            return {
              get: async () => ({
                data: [{ _id: 'o1', stationId: 'station_01', startTime: '2026-03-04T09:30:00.000Z' }]
              })
            }
          }
        }
      }
      if (name === 'settings') {
        return {
          doc() {
            return {
              get: async () => {
                throw new Error('not found')
              }
            }
          }
        }
      }
      throw new Error(`Unexpected collection: ${name}`)
    }
  }

  const res = await __test__.endWash({
    db,
    getWXContext: () => ({ OPENID: 'u2' }),
    now: () => new Date('2026-03-04T10:00:00.000Z')
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '系统计费配置缺失，请联系管理员')
}

async function shouldClampToMinDurationAndUpdateOrder() {
  let updatePayload = null
  const db = {
    collection(name) {
      if (name === 'orders') {
        return {
          where() {
            return {
              get: async () => ({
                data: [{ _id: 'o2', stationId: 'station_02', startTime: '2026-03-04T09:59:40.000Z' }]
              })
            }
          },
          doc(id) {
            assert.equal(id, 'o2')
            return {
              update: async (payload) => {
                updatePayload = payload
              }
            }
          }
        }
      }
      if (name === 'settings') {
        return {
          doc(id) {
            assert.equal(id, 'default')
            return {
              get: async () => ({
                data: {
                  pricePerMinute: 200,
                  maxDuration: 120
                }
              })
            }
          }
        }
      }
      throw new Error(`Unexpected collection: ${name}`)
    },
    serverDate() {
      return { $serverDate: true }
    }
  }

  const res = await __test__.endWash({
    db,
    getWXContext: () => ({ OPENID: 'u3' }),
    now: () => new Date('2026-03-04T10:00:00.000Z')
  })

  assert.equal(res.success, true)
  assert.equal(res.duration, 1)
  assert.equal(res.amount, 200)
  assert.deepEqual(updatePayload, {
    data: {
      status: 'completed',
      endTime: { $serverDate: true },
      duration: 1,
      amount: 200
    }
  })
}

async function shouldClampToMaxDuration() {
  let updatedDuration = -1
  const db = {
    collection(name) {
      if (name === 'orders') {
        return {
          where() {
            return {
              get: async () => ({
                data: [{ _id: 'o3', stationId: 'station_01', startTime: '2026-03-04T07:00:00.000Z' }]
              })
            }
          },
          doc() {
            return {
              update: async (payload) => {
                updatedDuration = payload.data.duration
              }
            }
          }
        }
      }
      if (name === 'settings') {
        return {
          doc() {
            return {
              get: async () => ({
                data: {
                  pricePerMinute: 150,
                  maxDuration: 90
                }
              })
            }
          }
        }
      }
      throw new Error(`Unexpected collection: ${name}`)
    },
    serverDate() {
      return { $serverDate: true }
    }
  }

  const res = await __test__.endWash({
    db,
    getWXContext: () => ({ OPENID: 'u4' }),
    now: () => new Date('2026-03-04T10:00:00.000Z')
  })

  assert.equal(res.success, true)
  assert.equal(res.duration, 90)
  assert.equal(res.amount, 13500)
  assert.equal(updatedDuration, 90)
}

async function run() {
  await shouldReturnErrorWhenNoWashingOrder()
  await shouldReturnReadableErrorWhenSettingsMissing()
  await shouldClampToMinDurationAndUpdateOrder()
  await shouldClampToMaxDuration()
  console.log('endWash tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
