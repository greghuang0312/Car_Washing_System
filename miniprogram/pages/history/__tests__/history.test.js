const assert = require('node:assert/strict')
const path = require('node:path')

function loadPage(wxMock) {
  const pagePath = path.resolve(__dirname, '../history.js')
  delete require.cache[pagePath]

  let captured = null
  global.Page = (config) => {
    captured = config
  }
  global.wx = wxMock

  require(pagePath)
  if (!captured) throw new Error('Page config not captured')
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

async function shouldLoadOrdersAndMapFields() {
  const loadingCalls = []
  const toastCalls = []
  const wxMock = {
    showLoading(payload) {
      loadingCalls.push(['show', payload])
    },
    hideLoading() {
      loadingCalls.push(['hide'])
    },
    showToast(payload) {
      toastCalls.push(payload)
    },
    cloud: {
      callFunction: async ({ name }) => {
        assert.equal(name, 'getMyOrders')
        return {
          result: {
            success: true,
            orders: [
              {
                _id: 'o1',
                stationId: 'station_01',
                status: 'paid',
                startTime: '2026-03-04T10:00:00.000Z',
                duration: 10,
                amount: 1000
              }
            ]
          }
        }
      }
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page)
  await page.loadOrders.call(ctx)

  assert.equal(ctx.data.orders.length, 1)
  assert.equal(ctx.data.orders[0].statusText, '已支付')
  assert.equal(ctx.data.orders[0].durationText, '10分钟')
  assert.equal(ctx.data.orders[0].amountYuan, '10.00')
  assert.equal(loadingCalls[0][0], 'show')
  assert.equal(loadingCalls[1][0], 'hide')
  assert.equal(toastCalls.length, 0)
}

async function shouldShowToastWhenLoadFails() {
  const toastCalls = []
  const wxMock = {
    showLoading() {},
    hideLoading() {},
    showToast(payload) {
      toastCalls.push(payload)
    },
    cloud: {
      callFunction: async () => {
        throw new Error('network error')
      }
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page)
  await page.loadOrders.call(ctx)
  assert.equal(toastCalls[0].title, '加载失败')
}

async function shouldCallLoadOrdersOnShow() {
  const wxMock = {
    showLoading() {},
    hideLoading() {},
    showToast() {},
    cloud: {
      callFunction: async () => ({ result: { success: true, orders: [] } })
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page)
  let called = false
  ctx.loadOrders = async () => {
    called = true
  }
  page.onShow.call(ctx)
  assert.equal(called, true)
}

async function run() {
  await shouldLoadOrdersAndMapFields()
  await shouldShowToastWhenLoadFails()
  await shouldCallLoadOrdersOnShow()
  console.log('history page tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
