const assert = require('node:assert/strict')
const path = require('node:path')

function loadPage(wxMock) {
  const pagePath = path.resolve(__dirname, '../index.js')
  delete require.cache[pagePath]

  let capturedPage = null
  global.Page = (config) => {
    capturedPage = config
  }
  global.getApp = () => ({ globalData: {} })
  global.wx = wxMock

  require(pagePath)
  if (!capturedPage) {
    throw new Error('Page config not captured')
  }
  return capturedPage
}

function createCtx(pageConfig, initData = {}) {
  return {
    data: { ...pageConfig.data, ...initData },
    setData(update) {
      this.data = { ...this.data, ...update }
    }
  }
}

async function testStartWashRequiresStationId() {
  const toasts = []
  let cloudCalled = false
  const wxMock = {
    showToast(payload) {
      toasts.push(payload)
    },
    navigateTo() {},
    cloud: {
      callFunction: async () => {
        cloudCalled = true
      },
      database: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({ data: { pricePerMinute: 100 } })
          })
        })
      })
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page, { stationId: '' })
  await page.onStartWash.call(ctx)

  assert.equal(cloudCalled, false)
  assert.equal(toasts[0].title, '请先扫码进入洗车站')
}

async function testStartWashNavigateToWashing() {
  const navs = []
  const wxMock = {
    showToast() {},
    navigateTo(payload) {
      navs.push(payload.url)
    },
    cloud: {
      callFunction: async ({ name, data }) => {
        assert.equal(name, 'startWash')
        assert.deepEqual(data, { stationId: 'station_01' })
        return { result: { success: true, orderId: 'o-1' } }
      },
      database: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({ data: { pricePerMinute: 100 } })
          })
        })
      })
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page, { stationId: 'station_01' })
  await page.onStartWash.call(ctx)

  assert.equal(navs.length, 1)
  assert.equal(navs[0], '/pages/washing/washing?orderId=o-1&stationId=station_01')
}

async function testEndWashNavigateToPayment() {
  const navs = []
  const wxMock = {
    showToast() {},
    navigateTo(payload) {
      navs.push(payload.url)
    },
    cloud: {
      callFunction: async ({ name }) => {
        assert.equal(name, 'endWash')
        return {
          result: {
            success: true,
            orderId: 'o-2',
            duration: 12,
            amount: 1200,
            stationId: 'station_02'
          }
        }
      },
      database: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({ data: { pricePerMinute: 100 } })
          })
        })
      })
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page, { hasActiveOrder: true })
  await page.onEndWash.call(ctx)

  assert.equal(navs.length, 1)
  assert.equal(
    navs[0],
    '/pages/payment/payment?orderId=o-2&duration=12&amount=1200&stationId=station_02'
  )
}

async function testCheckActiveOrderPickWashingOrder() {
  const wxMock = {
    showToast() {},
    navigateTo() {},
    cloud: {
      callFunction: async ({ name }) => {
        assert.equal(name, 'getMyOrders')
        return {
          result: {
            success: true,
            orders: [
              { _id: 'o-history', status: 'paid', startTime: '2026-03-04T09:00:00.000Z' },
              { _id: 'o-active', status: 'washing', startTime: '2026-03-04T10:00:00.000Z' }
            ]
          }
        }
      },
      database: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({ data: { pricePerMinute: 100 } })
          })
        })
      })
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page)
  ctx.startTimer = () => {}
  ctx.stopTimer = () => {}
  await page.checkActiveOrder.call(ctx)

  assert.equal(ctx.data.hasActiveOrder, true)
  assert.equal(ctx.data.activeOrderId, 'o-active')
}

async function run() {
  await testStartWashRequiresStationId()
  await testStartWashNavigateToWashing()
  await testEndWashNavigateToPayment()
  await testCheckActiveOrderPickWashingOrder()
  console.log('index page tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
