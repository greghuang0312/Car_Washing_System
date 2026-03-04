const assert = require('node:assert/strict')
const path = require('node:path')

function loadPage({ wxMock, appMock }) {
  const pagePath = path.resolve(__dirname, '../panel.js')
  delete require.cache[pagePath]

  let captured = null
  global.Page = (config) => {
    captured = config
  }
  global.wx = wxMock
  global.getApp = () => appMock

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

function createBaseWxMock() {
  return {
    showLoading() {},
    hideLoading() {},
    showToast() {},
    redirectTo() {},
    cloud: {
      database: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({ data: { pricePerMinute: 100 } })
          })
        })
      }),
      callFunction: async () => ({ result: { success: true } })
    }
  }
}

function createAdminAppMock() {
  return { globalData: { isAdmin: true } }
}

async function shouldRedirectToLoginWhenNotAdmin() {
  const redirects = []
  const wxMock = createBaseWxMock()
  wxMock.redirectTo = (payload) => {
    redirects.push(payload.url)
  }
  const appMock = { globalData: { isAdmin: false } }
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page)

  let loadPriceCalled = false
  ctx.loadPrice = () => {
    loadPriceCalled = true
  }

  page.onLoad.call(ctx)

  assert.equal(redirects[0], '/pages/admin/login/login')
  assert.equal(loadPriceCalled, false)
}

async function shouldLoadPriceOnLoadWhenAdmin() {
  const redirects = []
  const wxMock = createBaseWxMock()
  wxMock.redirectTo = (payload) => {
    redirects.push(payload.url)
  }
  const appMock = createAdminAppMock()
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page)

  let loadPriceCalled = false
  ctx.loadPrice = () => {
    loadPriceCalled = true
  }

  page.onLoad.call(ctx)

  assert.equal(redirects.length, 0)
  assert.equal(loadPriceCalled, true)
}

async function shouldLoadPriceFromSettings() {
  const wxMock = createBaseWxMock()
  wxMock.cloud.database = () => ({
    collection(name) {
      assert.equal(name, 'settings')
      return {
        doc(id) {
          assert.equal(id, 'default')
          return {
            get: async () => ({ data: { pricePerMinute: 250 } })
          }
        }
      }
    }
  })
  const appMock = createAdminAppMock()
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page)

  await page.loadPrice.call(ctx)
  assert.equal(ctx.data.priceYuan, '2.50')
}

async function shouldValidatePriceBeforeSave() {
  const toasts = []
  let called = false
  const wxMock = createBaseWxMock()
  wxMock.showToast = (payload) => {
    toasts.push(payload)
  }
  wxMock.cloud.callFunction = async () => {
    called = true
    return { result: { success: true } }
  }
  const appMock = createAdminAppMock()
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page, { priceYuan: '0' })

  await page.onSavePrice.call(ctx)

  assert.equal(toasts[0].title, '请输入有效价格')
  assert.equal(called, false)
  assert.equal(ctx.data.loading, false)
}

async function shouldSavePriceSuccessfully() {
  const toasts = []
  const calls = []
  const wxMock = createBaseWxMock()
  wxMock.showToast = (payload) => {
    toasts.push(payload)
  }
  wxMock.cloud.callFunction = async (payload) => {
    calls.push(payload)
    return { result: { success: true } }
  }
  const appMock = createAdminAppMock()
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page, { priceYuan: '1.23' })

  await page.onSavePrice.call(ctx)

  assert.deepEqual(calls[0], {
    name: 'updatePrice',
    data: { pricePerMinute: 123 }
  })
  assert.equal(toasts[0].title, '保存成功')
  assert.equal(ctx.data.loading, false)
}

async function shouldSwitchTabAndTriggerLoaders() {
  const wxMock = createBaseWxMock()
  const appMock = createAdminAppMock()
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page)

  let orderCalls = 0
  let statsCalls = 0
  ctx.loadOrders = async () => {
    orderCalls += 1
  }
  ctx.loadStats = async () => {
    statsCalls += 1
  }

  page.switchTab.call(ctx, { currentTarget: { dataset: { tab: 'orders' } } })
  assert.equal(ctx.data.activeTab, 'orders')
  assert.equal(orderCalls, 1)

  page.switchTab.call(ctx, { currentTarget: { dataset: { tab: 'stats' } } })
  assert.equal(ctx.data.activeTab, 'stats')
  assert.equal(statsCalls, 1)
}

async function shouldLoadOrdersAndMapFields() {
  const loadingCalls = []
  const wxMock = createBaseWxMock()
  wxMock.showLoading = (payload) => {
    loadingCalls.push(['show', payload])
  }
  wxMock.hideLoading = () => {
    loadingCalls.push(['hide'])
  }

  const calls = []
  wxMock.cloud.callFunction = async (payload) => {
    calls.push(payload)
    return {
      result: {
        success: true,
        orders: [
          {
            _id: 'o1',
            stationId: 'station_01',
            status: 'paid',
            startTime: '2026-03-04T10:00:00.000Z',
            duration: 15,
            amount: 1500
          }
        ]
      }
    }
  }

  const appMock = createAdminAppMock()
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page, {
    stationIndex: 1,
    stationOptions: ['全部', 'station_01', 'station_02']
  })

  await page.loadOrders.call(ctx)

  assert.deepEqual(calls[0], {
    name: 'getOrders',
    data: { stationId: 'station_01' }
  })
  assert.equal(ctx.data.orders.length, 1)
  assert.equal(ctx.data.orders[0].statusText, '已支付')
  assert.equal(ctx.data.orders[0].amountYuan, '15.00')
  assert.equal(loadingCalls[0][0], 'show')
  assert.equal(loadingCalls[1][0], 'hide')
}

async function shouldLoadStatsAndMapAmounts() {
  const wxMock = createBaseWxMock()
  wxMock.cloud.callFunction = async () => ({
    result: {
      success: true,
      stats: {
        today: { count: 1, amount: 1000 },
        week: { count: 2, totalAmount: 2100 },
        month: { count: 3, amount: 3300 },
        all: { count: 4, totalAmount: 4560 }
      }
    }
  })
  const appMock = createAdminAppMock()
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page)

  await page.loadStats.call(ctx)

  assert.equal(ctx.data.stats.today.amountYuan, '10.00')
  assert.equal(ctx.data.stats.week.amountYuan, '21.00')
  assert.equal(ctx.data.stats.month.amountYuan, '33.00')
  assert.equal(ctx.data.stats.all.amountYuan, '45.60')
}

async function shouldGenerateMockDataAndRefresh() {
  const toasts = []
  const calls = []
  const wxMock = createBaseWxMock()
  wxMock.showToast = (payload) => {
    toasts.push(payload)
  }
  wxMock.cloud.callFunction = async (payload) => {
    calls.push(payload)
    return { result: { success: true, inserted: 30 } }
  }
  const appMock = createAdminAppMock()
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page)

  let orderCalls = 0
  let statsCalls = 0
  ctx.loadOrders = async () => {
    orderCalls += 1
  }
  ctx.loadStats = async () => {
    statsCalls += 1
  }

  await page.onGenerateMock.call(ctx)

  assert.deepEqual(calls[0], {
    name: 'generateMockData',
    data: { count: 30 }
  })
  assert.equal(toasts[0].title, '已生成 30 条')
  assert.equal(orderCalls, 1)
  assert.equal(statsCalls, 1)
  assert.equal(ctx.data.mockLoading, false)
}

async function run() {
  await shouldRedirectToLoginWhenNotAdmin()
  await shouldLoadPriceOnLoadWhenAdmin()
  await shouldLoadPriceFromSettings()
  await shouldValidatePriceBeforeSave()
  await shouldSavePriceSuccessfully()
  await shouldSwitchTabAndTriggerLoaders()
  await shouldLoadOrdersAndMapFields()
  await shouldLoadStatsAndMapAmounts()
  await shouldGenerateMockDataAndRefresh()
  console.log('admin panel page tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
