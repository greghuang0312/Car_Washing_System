const util = require('../../utils/util')

Page({
  data: {
    stationId: '',
    hasActiveOrder: false,
    activeOrderId: '',
    activeStartTime: '',
    elapsedTime: '0分钟',
    price: '',
    loading: false,
    timerId: null
  },

  onLoad(options) {
    const stationId = (options && options.stationId) || ''
    this.setData({ stationId })
    this.loadPrice()
    this.checkActiveOrder()
  },

  onShow() {
    this.checkActiveOrder()
  },

  onUnload() {
    this.stopTimer()
  },

  onPullDownRefresh() {
    Promise.all([this.loadPrice(), this.checkActiveOrder()]).finally(() => {
      if (wx.stopPullDownRefresh) {
        wx.stopPullDownRefresh()
      }
    })
  },

  async loadPrice() {
    try {
      const db = wx.cloud.database()
      const result = await db.collection('settings').doc('default').get()
      const pricePerMinute = result && result.data ? result.data.pricePerMinute : null
      if (typeof pricePerMinute === 'number') {
        this.setData({ price: util.fenToYuan(pricePerMinute) })
      }
    } catch (err) {
      // no-op for first-run environments without settings data
    }
  },

  async checkActiveOrder() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyOrders',
        data: { page: 1, pageSize: 20 }
      })
      const orders = (res && res.result && res.result.orders) || []
      const active = orders.find((o) => o.status === 'washing')

      if (active) {
        this.setData({
          hasActiveOrder: true,
          activeOrderId: active._id,
          activeStartTime: active.startTime
        })
        this.updateElapsedTime()
        this.startTimer()
      } else {
        this.stopTimer()
        this.setData({
          hasActiveOrder: false,
          activeOrderId: '',
          activeStartTime: '',
          elapsedTime: '0分钟'
        })
      }
    } catch (err) {
      // no-op; keep current UI state
    }
  },

  updateElapsedTime() {
    if (!this.data.activeStartTime) {
      this.setData({ elapsedTime: '0分钟' })
      return
    }
    const start = new Date(this.data.activeStartTime)
    const now = new Date()
    let minutes = Math.ceil((now - start) / 60000)
    if (minutes < 1) minutes = 1
    this.setData({ elapsedTime: util.formatDuration(minutes) })
  },

  startTimer() {
    this.stopTimer()
    const timerId = setInterval(() => {
      this.updateElapsedTime()
    }, 30000)
    this.setData({ timerId })
  },

  stopTimer() {
    if (this.data.timerId) {
      clearInterval(this.data.timerId)
      this.setData({ timerId: null })
    }
  },

  async onStartWash() {
    if (!this.data.stationId) {
      wx.showToast({ title: '请先扫码进入洗车站', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'startWash',
        data: { stationId: this.data.stationId }
      })
      const result = res && res.result ? res.result : {}

      if (result.success) {
        wx.navigateTo({
          url: `/pages/washing/washing?orderId=${result.orderId}&stationId=${this.data.stationId}`
        })
      } else {
        wx.showToast({ title: result.error || '开始洗车失败', icon: 'none' })
        await this.checkActiveOrder()
      }
    } catch (err) {
      wx.showToast({ title: '开始洗车失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onEndWash() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({ name: 'endWash', data: {} })
      const result = res && res.result ? res.result : {}
      if (result.success) {
        wx.navigateTo({
          url: `/pages/payment/payment?orderId=${result.orderId}&duration=${result.duration}&amount=${result.amount}&stationId=${result.stationId}`
        })
      } else {
        wx.showToast({ title: result.error || '结束洗车失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '结束洗车失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/login/login' })
  }
})
