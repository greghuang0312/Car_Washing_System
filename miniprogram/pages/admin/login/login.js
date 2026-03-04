const app = getApp()

Page({
  data: {
    password: '',
    loading: false
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  async onLogin() {
    if (!this.data.password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'adminLogin',
        data: { password: this.data.password }
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
