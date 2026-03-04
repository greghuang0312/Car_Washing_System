const util = require('../../utils/util')

Page({
  data: {
    orders: []
  },

  onShow() {
    this.loadOrders()
  },

  async loadOrders() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'getMyOrders' })
      if (res.result && res.result.success) {
        const statusMap = {
          washing: '洗车中',
          completed: '待支付',
          paid: '已支付'
        }
        const orders = (res.result.orders || []).map((order) => ({
          ...order,
          statusText: statusMap[order.status] || order.status,
          startTimeText: util.formatTime(order.startTime),
          durationText: util.formatDuration(order.duration || 0),
          amountYuan: util.fenToYuan(order.amount || 0)
        }))
        this.setData({ orders })
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  }
})
