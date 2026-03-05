const app = getApp()

Page({
  data: {
    loading: false
  },

  async onLogin() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'adminLogin',
        data: {}
      })
      const result = (res && res.result) || {}
      if (result.success) {
        app.globalData.isAdmin = true
        wx.redirectTo({ url: '/pages/admin/panel/panel' })
      } else {
        wx.showToast({ title: result.error || '登录失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
    this.setData({ loading: false })
  }
})
