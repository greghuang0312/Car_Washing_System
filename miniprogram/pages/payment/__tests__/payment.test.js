const assert = require('node:assert/strict')
const path = require('node:path')

function loadPage(wxMock) {
  const pagePath = path.resolve(__dirname, '../payment.js')
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

async function shouldParseLoadOptions() {
  const wxMock = {
    showToast() {},
    reLaunch() {},
    cloud: {
      database: () => ({
        collection: () => ({
          doc: () => ({
            update: async () => {}
          })
        }),
        serverDate: () => ({ $serverDate: true })
      })
    }
  }
  const page = loadPage(wxMock)
  const ctx = createCtx(page)
  page.onLoad.call(ctx, {
    orderId: 'o1',
    duration: '15',
    amount: '1200',
    stationId: 'station_01'
  })
  assert.equal(ctx.data.orderId, 'o1')
  assert.equal(ctx.data.duration, 15)
  assert.equal(ctx.data.amount, 1200)
  assert.equal(ctx.data.stationId, 'station_01')
  assert.equal(ctx.data.durationText, '15分钟')
  assert.equal(ctx.data.amountYuan, '12.00')
}

async function shouldUpdateOrderToPaid() {
  let updatePayload = null
  const wxMock = {
    showToast() {},
    reLaunch() {},
    cloud: {
      database: () => ({
        collection(name) {
          assert.equal(name, 'orders')
          return {
            doc(id) {
              assert.equal(id, 'o2')
              return {
                update: async (payload) => {
                  updatePayload = payload
                }
              }
            }
          }
        },
        serverDate: () => ({ $serverDate: true })
      })
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page, { orderId: 'o2' })
  await page.onPay.call(ctx)

  assert.equal(ctx.data.paid, true)
  assert.equal(ctx.data.loading, false)
  assert.deepEqual(updatePayload, {
    data: {
      status: 'paid',
      paidAt: { $serverDate: true }
    }
  })
}

async function shouldShowToastOnPayFailure() {
  const toasts = []
  const wxMock = {
    showToast(payload) {
      toasts.push(payload)
    },
    reLaunch() {},
    cloud: {
      database: () => ({
        collection: () => ({
          doc: () => ({
            update: async () => {
              throw new Error('db error')
            }
          })
        }),
        serverDate: () => ({ $serverDate: true })
      })
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page, { orderId: 'o3' })
  await page.onPay.call(ctx)

  assert.equal(ctx.data.paid, false)
  assert.equal(ctx.data.loading, false)
  assert.equal(toasts[0].title, '支付失败')
}

async function shouldGoHome() {
  const launches = []
  const wxMock = {
    showToast() {},
    reLaunch(payload) {
      launches.push(payload.url)
    },
    cloud: {
      database: () => ({
        collection: () => ({
          doc: () => ({
            update: async () => {}
          })
        }),
        serverDate: () => ({ $serverDate: true })
      })
    }
  }

  const page = loadPage(wxMock)
  const ctx = createCtx(page)
  page.goHome.call(ctx)
  assert.equal(launches[0], '/pages/index/index')
}

async function run() {
  await shouldParseLoadOptions()
  await shouldUpdateOrderToPaid()
  await shouldShowToastOnPayFailure()
  await shouldGoHome()
  console.log('payment page tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
