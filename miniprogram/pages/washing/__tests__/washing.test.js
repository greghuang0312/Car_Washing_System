const assert = require('node:assert/strict')
const path = require('node:path')

function loadPage(wxMock) {
  const pagePath = path.resolve(__dirname, '../washing.js')
  delete require.cache[pagePath]

  let captured = null
  global.Page = (config) => {
    captured = config
  }
  global.wx = wxMock

  require(pagePath)
  if (!captured) throw new Error('Page not captured')
  return captured
}

function createCtx(pageConfig, initData = {}) {
  const ctx = {
    data: { ...pageConfig.data, ...initData },
    setData(update) {
      this.data = { ...this.data, ...update }
    }
  }
  for (const [k, v] of Object.entries(pageConfig)) {
    if (typeof v === 'function' && !ctx[k]) {
      ctx[k] = v
    }
  }
  return ctx
}

async function shouldLoadWithGivenStartTime() {
  const originalSetInterval = global.setInterval
  const originalClearInterval = global.clearInterval
  global.setInterval = () => 123
  global.clearInterval = () => {}

  const wxMock = {
    showToast() {},
    navigateTo() {},
    cloud: {
      callFunction: async () => ({ result: { success: true, orders: [] } })
    }
  }

  try {
    const page = loadPage(wxMock)
    const ctx = createCtx(page)
    page.onLoad.call(ctx, {
      orderId: 'o1',
      stationId: 'station_01',
      startTime: '2026-03-04T10:00:00.000Z'
    })
    assert.equal(ctx.data.orderId, 'o1')
    assert.equal(ctx.data.stationId, 'station_01')
    assert.equal(ctx.data.hasActiveOrder, true)
    assert.ok(String(ctx.data.elapsedTime).length > 0)
  } finally {
    global.setInterval = originalSetInterval
    global.clearInterval = originalClearInterval
  }
}

async function shouldNavigateToPaymentAfterEndWash() {
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
            orderId: 'o2',
            duration: 15,
            amount: 1500,
            stationId: 'station_02'
          }
        }
      }
    }
  }
  const page = loadPage(wxMock)
  const ctx = createCtx(page, { hasActiveOrder: true })
  await page.onEndWash.call(ctx)
  assert.equal(navs.length, 1)
  assert.equal(
    navs[0],
    '/pages/payment/payment?orderId=o2&duration=15&amount=1500&stationId=station_02'
  )
}

async function shouldSetInactiveWhenNoWashingOrder() {
  const toasts = []
  const wxMock = {
    showToast(payload) {
      toasts.push(payload)
    },
    navigateTo() {},
    cloud: {
      callFunction: async ({ name }) => {
        assert.equal(name, 'getMyOrders')
        return { result: { success: true, orders: [{ _id: 'o3', status: 'paid' }] } }
      }
    }
  }
  const page = loadPage(wxMock)
  const ctx = createCtx(page, { orderId: 'o-missing' })
  ctx.stopTimer = () => {}
  await page.fetchActiveOrder.call(ctx)
  assert.equal(ctx.data.hasActiveOrder, false)
  assert.equal(toasts[0].title, '未找到进行中的洗车订单')
}

async function run() {
  await shouldLoadWithGivenStartTime()
  await shouldNavigateToPaymentAfterEndWash()
  await shouldSetInactiveWhenNoWashingOrder()
  console.log('washing page tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
