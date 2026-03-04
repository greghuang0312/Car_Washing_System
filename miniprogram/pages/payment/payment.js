const util = require('../../utils/util')

Page({
  data: {
    orderId: '',
    duration: 0,
    amount: 0,
    stationId: '',
    durationText: '',
    amountYuan: '',
    paid: false,
    loading: false
  },

  onLoad(options) {
    const { orderId, duration, amount, stationId } = options || {}
    const durationNum = parseInt(duration, 10) || 0
    const amountNum = parseInt(amount, 10) || 0

    this.setData({
      orderId: orderId || '',
      duration: durationNum,
      amount: amountNum,
      stationId: stationId || '',
      durationText: util.formatDuration(durationNum),
      amountYuan: util.fenToYuan(amountNum)
    })
  },

  async onPay() {
    this.setData({ loading: true })
    try {
      const db = wx.cloud.database()
      await db.collection('orders').doc(this.data.orderId).update({
        data: {
          status: 'paid',
          paidAt: db.serverDate()
        }
      })
      this.setData({ paid: true })
    } catch (err) {
      wx.showToast({ title: '支付失败', icon: 'none' })
    }
    this.setData({ loading: false })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
