const assert = require('node:assert/strict')
const path = require('node:path')

function loadApp({ wxMock, privateConfig }) {
  const appPath = path.resolve(__dirname, '../app.js')
  delete require.cache[appPath]

  let captured = null
  global.App = (config) => {
    captured = config
  }
  global.wx = wxMock
  global.__TEST_PRIVATE_CONFIG__ = privateConfig

  require(appPath)
  if (!captured) throw new Error('App config not captured')
  return captured
}

function clearGlobals() {
  delete global.App
  delete global.wx
  delete global.__TEST_PRIVATE_CONFIG__
}

async function shouldInitCloudWithEnvWhenProvided() {
  const initCalls = []
  const wxMock = {
    cloud: {
      init(payload) {
        initCalls.push(payload)
      }
    }
  }

  const app = loadApp({
    wxMock,
    privateConfig: { CLOUDBASE_ENV_ID: 'env-test-1' }
  })
  app.onLaunch()

  assert.equal(initCalls.length, 1)
  assert.deepEqual(initCalls[0], {
    env: 'env-test-1',
    traceUser: true
  })
}

async function shouldInitCloudWithoutEnvWhenNotProvided() {
  const initCalls = []
  const wxMock = {
    cloud: {
      init(payload) {
        initCalls.push(payload)
      }
    }
  }

  const app = loadApp({
    wxMock,
    privateConfig: {}
  })
  app.onLaunch()

  assert.equal(initCalls.length, 1)
  assert.deepEqual(initCalls[0], {
    traceUser: true
  })
}

async function run() {
  try {
    await shouldInitCloudWithEnvWhenProvided()
    await shouldInitCloudWithoutEnvWhenNotProvided()
    console.log('app tests passed')
  } finally {
    clearGlobals()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
