const util = require('../../utils/util')

Page({
  data: {
    orderId: '',
    stationId: '',
    activeStartTime: '',
    hasActiveOrder: false,
    elapsedTime: '0分钟',
    loading: false,
    timerId: null
  },

  onLoad(options) {
    const orderId = (options && options.orderId) || ''
    const stationId = (options && options.stationId) || ''
    const activeStartTime = (options && options.startTime) || ''

    this.setData({ orderId, stationId, activeStartTime })

    if (activeStartTime) {
      this._orderReady = true
      this.setData({ hasActiveOrder: true })
      this.updateElapsedTime()
      this.startTimer()
    } else {
      this.fetchActiveOrder()
    }
  },

  onShow() {
    if (this._orderReady || this.data.hasActiveOrder) return
    this.fetchActiveOrder()
  },

  onUnload() {
    this.stopTimer()
  },

  async fetchActiveOrder() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyOrders',
        data: { page: 1, pageSize: 20 }
      })
      const orders = (res && res.result && res.result.orders) || []

      let active = null
      if (this.data.orderId) {
        active = orders.find((o) => o._id === this.data.orderId && o.status === 'washing')
      }
      if (!active) {
        active = orders.find((o) => o.status === 'washing')
      }

      if (!active) {
        this.stopTimer()
        this.setData({
          hasActiveOrder: false,
          activeStartTime: '',
          elapsedTime: '0分钟'
        })
        wx.showToast({ title: '未找到进行中的洗车订单', icon: 'none' })
        return
      }

      this.setData({
        hasActiveOrder: true,
        orderId: active._id,
        stationId: active.stationId || this.data.stationId,
        activeStartTime: active.startTime
      })
      this.updateElapsedTime()
      this.startTimer()
    } catch (err) {
      wx.showToast({ title: '加载订单失败', icon: 'none' })
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

  async onEndWash() {
    this.setData({ loading: true })
    let navigated = false
    try {
      const res = await wx.cloud.callFunction({
        name: 'endWash',
        data: {}
      })
      const result = res && res.result ? res.result : {}
      if (result.success) {
        this.stopTimer()
        navigated = true
        wx.redirectTo({
          url: `/pages/payment/payment?orderId=${result.orderId}&duration=${result.duration}&amount=${result.amount}&stationId=${result.stationId}`
        })
        return
      } else {
        wx.showToast({ title: result.error || '结束洗车失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '结束洗车失败', icon: 'none' })
    } finally {
      if (!navigated) {
        this.setData({ loading: false })
      }
    }
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
