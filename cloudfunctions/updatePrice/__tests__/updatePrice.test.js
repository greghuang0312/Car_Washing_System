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
      throw new Error('settings should not be accessed')
    },
    serverDate() {
      return { $serverDate: true }
    }
  }

  const res = await __test__.updatePrice({
    db,
    getWXContext: () => ({ OPENID: 'u1' }),
    event: { pricePerMinute: 200 }
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '无管理权限')
}

async function shouldValidatePriceAsPositiveInteger() {
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
      throw new Error('settings should not be accessed')
    },
    serverDate() {
      return { $serverDate: true }
    }
  }

  const res = await __test__.updatePrice({
    db,
    getWXContext: () => ({ OPENID: 'u2' }),
    event: { pricePerMinute: -1 }
  })

  assert.equal(res.success, false)
  assert.equal(res.error, '价格必须为正整数（单位：分）')
}

async function shouldUpdateExistingSettings() {
  let updatePayload = null
  let addCalled = false
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
      if (name === 'settings') {
        return {
          doc(id) {
            assert.equal(id, 'default')
            return {
              update: async (payload) => {
                updatePayload = payload
              }
            }
          },
          add: async () => {
            addCalled = true
          }
        }
      }
      throw new Error(`unexpected collection ${name}`)
    },
    serverDate() {
      return { $serverDate: true }
    }
  }

  const res = await __test__.updatePrice({
    db,
    getWXContext: () => ({ OPENID: 'u3' }),
    event: { pricePerMinute: 300 }
  })

  assert.equal(res.success, true)
  assert.equal(res.pricePerMinute, 300)
  assert.equal(addCalled, false)
  assert.deepEqual(updatePayload, {
    data: { pricePerMinute: 300, updatedAt: { $serverDate: true } }
  })
}

async function shouldCreateSettingsWhenMissing() {
  let addPayload = null
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
      if (name === 'settings') {
        return {
          doc() {
            return {
              update: async () => {
                throw new Error('not found')
              }
            }
          },
          add: async (payload) => {
            addPayload = payload
          }
        }
      }
      throw new Error(`unexpected collection ${name}`)
    },
    serverDate() {
      return { $serverDate: true }
    }
  }

  const res = await __test__.updatePrice({
    db,
    getWXContext: () => ({ OPENID: 'u4' }),
    event: { pricePerMinute: 500 }
  })

  assert.equal(res.success, true)
  assert.deepEqual(addPayload, {
    data: {
      _id: 'default',
      pricePerMinute: 500,
      maxDuration: 120,
      updatedAt: { $serverDate: true }
    }
  })
}

async function run() {
  await shouldRejectNonAdmin()
  await shouldValidatePriceAsPositiveInteger()
  await shouldUpdateExistingSettings()
  await shouldCreateSettingsWhenMissing()
  console.log('updatePrice tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
