const assert = require('node:assert/strict')
const path = require('node:path')

function loadPage({ wxMock, appMock }) {
  const pagePath = path.resolve(__dirname, '../login.js')
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

async function shouldUpdatePasswordOnInput() {
  const wxMock = {
    showToast() {},
    redirectTo() {},
    cloud: {
      callFunction: async () => ({ result: { success: true } })
    }
  }
  const appMock = { globalData: { isAdmin: false } }
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page)

  page.onPasswordInput.call(ctx, { detail: { value: 'secret' } })
  assert.equal(ctx.data.password, 'secret')
}

async function shouldRejectEmptyPassword() {
  const toasts = []
  let cloudCalled = false
  const wxMock = {
    showToast(payload) {
      toasts.push(payload)
    },
    redirectTo() {},
    cloud: {
      callFunction: async () => {
        cloudCalled = true
        return { result: { success: true } }
      }
    }
  }
  const appMock = { globalData: { isAdmin: false } }
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page, { password: '' })

  await page.onLogin.call(ctx)

  assert.equal(toasts[0].title, '请输入密码')
  assert.equal(toasts[0].icon, 'none')
  assert.equal(cloudCalled, false)
  assert.equal(ctx.data.loading, false)
}

async function shouldLoginAndRedirectWhenCloudFunctionReturnsSuccess() {
  const redirects = []
  const calls = []
  const wxMock = {
    showToast() {},
    redirectTo(payload) {
      redirects.push(payload)
    },
    cloud: {
      callFunction: async (payload) => {
        calls.push(payload)
        return { result: { success: true } }
      }
    }
  }
  const appMock = { globalData: { isAdmin: false } }
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page, { password: 'admin-pass' })

  await page.onLogin.call(ctx)

  assert.deepEqual(calls[0], {
    name: 'adminLogin',
    data: { password: 'admin-pass' }
  })
  assert.equal(appMock.globalData.isAdmin, true)
  assert.equal(redirects[0].url, '/pages/admin/panel/panel')
  assert.equal(ctx.data.loading, false)
}

async function shouldShowCloudErrorWhenLoginFails() {
  const toasts = []
  const wxMock = {
    showToast(payload) {
      toasts.push(payload)
    },
    redirectTo() {
      throw new Error('redirect should not be called')
    },
    cloud: {
      callFunction: async () => ({
        result: {
          success: false,
          error: '密码错误'
        }
      })
    }
  }
  const appMock = { globalData: { isAdmin: false } }
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page, { password: 'wrong-pass' })

  await page.onLogin.call(ctx)

  assert.equal(toasts[0].title, '密码错误')
  assert.equal(toasts[0].icon, 'none')
  assert.equal(appMock.globalData.isAdmin, false)
  assert.equal(ctx.data.loading, false)
}

async function shouldShowGenericErrorWhenCallFunctionThrows() {
  const toasts = []
  const wxMock = {
    showToast(payload) {
      toasts.push(payload)
    },
    redirectTo() {
      throw new Error('redirect should not be called')
    },
    cloud: {
      callFunction: async () => {
        throw new Error('network error')
      }
    }
  }
  const appMock = { globalData: { isAdmin: false } }
  const page = loadPage({ wxMock, appMock })
  const ctx = createCtx(page, { password: 'admin-pass' })

  await page.onLogin.call(ctx)

  assert.equal(toasts[0].title, '登录失败')
  assert.equal(toasts[0].icon, 'none')
  assert.equal(appMock.globalData.isAdmin, false)
  assert.equal(ctx.data.loading, false)
}

async function run() {
  await shouldUpdatePasswordOnInput()
  await shouldRejectEmptyPassword()
  await shouldLoginAndRedirectWhenCloudFunctionReturnsSuccess()
  await shouldShowCloudErrorWhenLoginFails()
  await shouldShowGenericErrorWhenCallFunctionThrows()
  console.log('admin login page tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
