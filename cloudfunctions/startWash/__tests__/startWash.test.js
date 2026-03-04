const assert = require('node:assert/strict')
const { __test__ } = require('../index')

async function shouldRejectWhenStationIdMissing() {
  let whereCalled = false
  const db = {
    collection() {
      return {
        where() {
          whereCalled = true
          return { get: async () => ({ data: [] }) }
        }
      }
    },
    serverDate() {
      return { $date: true }
    }
  }

  const res = await __test__.startWash({
    db,
    getWXContext: () => ({ OPENID: 'u1' }),
    event: {}
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '缺少洗车站编号')
  assert.equal(whereCalled, false)
}

async function shouldRejectWhenExistingOrderExists() {
  let addCalled = false
  const db = {
    collection(name) {
      assert.equal(name, 'orders')
      return {
        where(query) {
          assert.deepEqual(query, { openid: 'u2', status: 'washing' })
          return {
            get: async () => ({ data: [{ _id: 'o-existing' }] })
          }
        },
        add: async () => {
          addCalled = true
          return { _id: 'o-new' }
        }
      }
    },
    serverDate() {
      return { $date: true }
    }
  }

  const res = await __test__.startWash({
    db,
    getWXContext: () => ({ OPENID: 'u2' }),
    event: { stationId: 'station_01' }
  })

  assert.equal(res.success, false)
  assert.equal(res.orderId, 'o-existing')
  assert.equal(addCalled, false)
}

async function shouldCreateOrderWhenNoActiveOrder() {
  let addPayload = null
  const db = {
    collection(name) {
      assert.equal(name, 'orders')
      return {
        where(query) {
          assert.deepEqual(query, { openid: 'u3', status: 'washing' })
          return {
            get: async () => ({ data: [] })
          }
        },
        add: async (payload) => {
          addPayload = payload
          return { _id: 'o-new-1' }
        }
      }
    },
    serverDate() {
      return { $serverDate: true }
    }
  }

  const res = await __test__.startWash({
    db,
    getWXContext: () => ({ OPENID: 'u3' }),
    event: { stationId: 'station_02' }
  })

  assert.equal(res.success, true)
  assert.equal(res.orderId, 'o-new-1')
  assert.deepEqual(addPayload, {
    data: {
      openid: 'u3',
      stationId: 'station_02',
      status: 'washing',
      startTime: { $serverDate: true },
      endTime: null,
      duration: 0,
      amount: 0,
      paidAt: null,
      createdAt: { $serverDate: true }
    }
  })
}

async function run() {
  await shouldRejectWhenStationIdMissing()
  await shouldRejectWhenExistingOrderExists()
  await shouldCreateOrderWhenNoActiveOrder()
  console.log('startWash tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
