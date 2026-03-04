const util = require('../../../utils/util')
const app = getApp()

function getAmountValue(stat) {
  if (!stat || typeof stat !== 'object') return 0
  if (Number.isFinite(stat.totalAmount)) return stat.totalAmount
  if (Number.isFinite(stat.amount)) return stat.amount
  return 0
}

Page({
  data: {
    activeTab: 'price',
    priceYuan: '',
    loading: false,
    orders: [],
    stationOptions: ['全部', 'station_01', 'station_02'],
    stationIndex: 0,
    stats: {
      today: { count: 0, amountYuan: '0.00' },
      week: { count: 0, amountYuan: '0.00' },
      month: { count: 0, amountYuan: '0.00' },
      all: { count: 0, amountYuan: '0.00' }
    },
    mockLoading: false
  },

  onLoad() {
    if (!app.globalData.isAdmin) {
      wx.redirectTo({ url: '/pages/admin/login/login' })
      return
    }
    this.loadPrice()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    if (tab === 'orders') this.loadOrders()
    if (tab === 'stats') this.loadStats()
  },

  async loadPrice() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('settings').doc('default').get()
      const pricePerMinute = res && res.data ? res.data.pricePerMinute : null
      if (typeof pricePerMinute === 'number') {
        this.setData({ priceYuan: util.fenToYuan(pricePerMinute) })
      } else {
        this.setData({ priceYuan: '' })
      }
    } catch (err) {
      this.setData({ priceYuan: '' })
    }
  },

  onPriceInput(e) {
    this.setData({ priceYuan: e.detail.value })
  },

  async onSavePrice() {
    const yuan = Number.parseFloat(this.data.priceYuan)
    if (!Number.isFinite(yuan) || yuan <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'updatePrice',
        data: { pricePerMinute: util.yuanToFen(yuan) }
      })
      const result = (res && res.result) || {}
      if (result.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        wx.showToast({ title: result.error || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
    this.setData({ loading: false })
  },

  async loadOrders() {
    wx.showLoading({ title: '加载中' })
    try {
      const stationId = this.data.stationIndex === 0
        ? undefined
        : this.data.stationOptions[this.data.stationIndex]
      const res = await wx.cloud.callFunction({
        name: 'getOrders',
        data: { stationId }
      })
      const result = (res && res.result) || {}
      if (result.success) {
        const statusMap = {
          washing: '洗车中',
          completed: '待支付',
          paid: '已支付'
        }
        const orders = (result.orders || []).map((order) => ({
          ...order,
          statusText: statusMap[order.status] || order.status,
          startTimeText: util.formatTime(order.startTime),
          durationText: util.formatDuration(order.duration || 0),
          amountYuan: util.fenToYuan(order.amount || 0)
        }))
        this.setData({ orders })
      } else {
        wx.showToast({ title: result.error || '加载失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  onStationFilter(e) {
    this.setData({ stationIndex: Number.parseInt(e.detail.value, 10) || 0 })
    this.loadOrders()
  },

  async loadStats() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'getStats' })
      const result = (res && res.result) || {}
      if (result.success) {
        const stats = result.stats || {}
        this.setData({
          stats: {
            today: {
              count: (stats.today && stats.today.count) || 0,
              amountYuan: util.fenToYuan(getAmountValue(stats.today))
            },
            week: {
              count: (stats.week && stats.week.count) || 0,
              amountYuan: util.fenToYuan(getAmountValue(stats.week))
            },
            month: {
              count: (stats.month && stats.month.count) || 0,
              amountYuan: util.fenToYuan(getAmountValue(stats.month))
            },
            all: {
              count: (stats.all && stats.all.count) || 0,
              amountYuan: util.fenToYuan(getAmountValue(stats.all))
            }
          }
        })
      } else {
        wx.showToast({ title: result.error || '加载失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  async onGenerateMock() {
    this.setData({ mockLoading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'generateMockData',
        data: { count: 30 }
      })
      const result = (res && res.result) || {}
      if (result.success) {
        wx.showToast({ title: `已生成 ${result.inserted || 0} 条`, icon: 'success' })
        await this.loadOrders()
        await this.loadStats()
      } else {
        wx.showToast({ title: result.error || '生成失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
    this.setData({ mockLoading: false })
  }
})
