function loadPrivateConfig() {
  // Used by local runtime; tests can inject this value.
  if (typeof global !== 'undefined' && global.__TEST_PRIVATE_CONFIG__) {
    return global.__TEST_PRIVATE_CONFIG__
  }
  try {
    return require('./config/private')
  } catch (err) {
    return {}
  }
}

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('Please use base library >= 2.2.3 for cloud capabilities')
      return
    }

    const privateConfig = loadPrivateConfig()
    const cloudEnvId = privateConfig.CLOUDBASE_ENV_ID
    const initOptions = { traceUser: true }
    if (cloudEnvId) {
      initOptions.env = cloudEnvId
    }

    wx.cloud.init(initOptions)
  },
  globalData: {
    isAdmin: false,
    adminOpenid: ''
  }
})
