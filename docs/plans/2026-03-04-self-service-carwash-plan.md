# 自助洗车小程序 — 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**目标：** 构建一个微信小程序 + 云开发的自助洗车管理系统，支持客户扫码洗车/支付（模拟），业主费用设置/订单管理。

**架构：** 微信小程序前端 + 微信云开发后端（云函数 + 云数据库）。全部在小程序开发者工具中完成开发和调试。金额以分存储、以元展示。

**技术栈：** 微信小程序原生框架（WXML + WXSS + JS）、微信云开发（云函数 Node.js + 云数据库）

---

## 第四阶段执行方式（已选方法1）

**执行方式：** subagent-driven-development

**执行顺序（强制）：**
1. 读取全量计划，提取每个 Task 的完整上下文。
2. 每个 Task 派发一个全新 implementer 子代理执行。
3. 先做规格评审（spec-reviewer），不通过则回到 implementer 修复。
4. 再做代码质量评审（code-quality-reviewer），不通过则回到 implementer 修复。
5. 双评审通过后才可标记 Task 完成并进入下一个 Task。
6. 全部 Task 完成后执行 finishing-a-development-branch。

## 阶段与 Skill 映射（强制）

| 阶段 | 目标 | 必用 Skill |
|---|---|---|
| 需求/方案确认 | 明确范围、边界、成功标准 | brainstorming |
| 实施计划编写 | 形成可执行 Task 清单 | writing-plans |
| 执行阶段（方法1） | 同会话逐 Task 实施 + 双评审 | subagent-driven-development |
| 小程序实现 | 页面、路由、调用云函数、配置 | miniprogram-development |
| 云开发后端实现 | 云函数、数据库、权限、部署 | cloudbase-guidelines + cloud-functions + cloudbase-document-database-in-wechat-miniprogram |
| 任务内开发循环 | 先测后改，红绿重构 | test-driven-development |
| 任务级代码审查 | 按严重级别找问题 | requesting-code-review |
| 缺陷处理 | 根因定位与修复闭环 | systematic-debugging |
| 完成前验证 | 先证据后结论 | verification-before-completion |
| 收尾合并 | 合并/PR/保留分支决策 | finishing-a-development-branch |

## Task 与 Skill 对应表

| Task | 主要内容 | 阶段 | 必用 Skill |
|---|---|---|---|
| Task 1 | 项目初始化（目录、app、全局样式） | 执行阶段 | subagent-driven-development + miniprogram-development + test-driven-development |
| Task 2 | 云函数 startWash | 执行阶段 | subagent-driven-development + cloudbase-guidelines + cloud-functions + test-driven-development |
| Task 3 | 云函数 endWash | 执行阶段 | 同 Task 2 |
| Task 4 | 云函数 adminLogin/updatePrice/getOrders/getMyOrders/getStats | 执行阶段 | 同 Task 2 + cloudbase-document-database-in-wechat-miniprogram |
| Task 5 | 云函数 generateMockData/hardwareControl | 执行阶段 | 同 Task 2 |
| Task 6 | 客户端首页 index | 执行阶段 | subagent-driven-development + miniprogram-development + test-driven-development |
| Task 7 | 客户端计时页 washing | 执行阶段 | 同 Task 6 |
| Task 8 | 客户端支付页 payment | 执行阶段 | 同 Task 6 | 
| Task 9 | 客户端历史页 history | 执行阶段 | 同 Task 6 |
| Task 10 | 业主登录页 admin/login | 执行阶段 | subagent-driven-development + miniprogram-development + auth-wechat-miniprogram + test-driven-development |
| Task 11 | 业主管理页 admin/panel | 执行阶段 | subagent-driven-development + miniprogram-development + cloudbase-guidelines + test-driven-development |
| Task 12 | 二维码方案 | 收尾阶段 | verification-before-completion |
## Task 1: 项目初始化

**Task Skill：** subagent-driven-development + miniprogram-development + test-driven-development

**文件：**
- 创建: `miniprogram/` 前端目录结构
- 创建: `cloudfunctions/` 云函数目录结构
- 创建: `project.config.json`
- 创建: `app.js` / `app.json` / `app.wxss`

**Step 1: 创建项目目录结构**

```
carwash/
├─ cloudfunctions/           # 云函数
│   ├─ startWash/
│   ├─ endWash/
│   ├─ getOrders/
│   ├─ getMyOrders/
│   ├─ getStats/
│   ├─ updatePrice/
│   ├─ adminLogin/
│   ├─ generateMockData/
│   └─ hardwareControl/
├─ miniprogram/              # 小程序前端
│   ├─ pages/
│   │   ├─ index/            # 首页（扫码入口）
│   │   ├─ washing/          # 洗车计时中
│   │   ├─ payment/          # 模拟支付
│   │   ├─ history/          # 客户历史订单
│   │   └─ admin/
│   │       ├─ login/        # 业主登录
│   │       └─ panel/        # 业主管理面板
│   ├─ utils/
│   │   └─ util.js           # 工具函数（分→元转换等）
│   ├─ app.js
│   ├─ app.json
│   └─ app.wxss
└─ project.config.json
```

**Step 2: 编写 `app.json` 注册所有页面和 TabBar 样式**

```json
{
  "pages": [
    "pages/index/index",
    "pages/washing/washing",
    "pages/payment/payment",
    "pages/history/history",
    "pages/admin/login/login",
    "pages/admin/panel/panel"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#1890ff",
    "navigationBarTitleText": "自助洗车",
    "navigationBarTextStyle": "white"
  },
  "cloud": true
}
```

**Step 3: 编写 `app.js` 初始化云开发**

```javascript
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: 'your-env-id', // 替换为实际云环境 ID
      traceUser: true
    })
  },
  globalData: {
    isAdmin: false,
    adminOpenid: ''
  }
})
```

**Step 4: 编写 `utils/util.js` 工具函数**

```javascript
// 分转元（整数分 → 字符串 "X.XX 元"）
function fenToYuan(fen) {
  return (fen / 100).toFixed(2)
}

// 元转分（输入字符串/数字 → 整数分）
function yuanToFen(yuan) {
  return Math.round(parseFloat(yuan) * 100)
}

// 格式化时间
function formatTime(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

// 格式化时长（分钟 → "X小时Y分钟"）
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

module.exports = { fenToYuan, yuanToFen, formatTime, formatDuration }
```

**Step 5: 编写 `app.wxss` 全局样式**

```css
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  font-size: 28rpx;
}

.container {
  padding: 30rpx;
}

.btn-primary {
  background-color: #1890ff;
  color: #fff;
  border-radius: 12rpx;
  padding: 24rpx 0;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
}

.btn-danger {
  background-color: #ff4d4f;
  color: #fff;
  border-radius: 12rpx;
  padding: 24rpx 0;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
}

.btn-success {
  background-color: #52c41a;
  color: #fff;
  border-radius: 12rpx;
  padding: 24rpx 0;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #222;
}
```

---

## 云开发后端详细执行文本（Task 2 ~ Task 5）

### 0) 执行前准备
1. 在微信开发者工具中确认当前项目已开通云开发并绑定正确环境 ID。
2. 在 miniprogram/app.js 的 wx.cloud.init({ env }) 中写入目标 env。
3. 确认数据库集合已创建：orders、settings、admins。
4. 手工初始化 settings/default 文档，至少包含：
   - pricePerMinute（单位分，整数）
   - maxDuration（单位分钟，整数）
5. 在 admins 集合写入至少一条管理员数据（含 openid、password 或哈希、name）。

### 1) 云函数目录与依赖统一规则
1. 每个函数目录必须包含：index.js、package.json。
2. package.json 统一依赖 wx-server-sdk。
3. 每个函数文件固定初始化模板：

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
```

4. 输入参数先校验，再访问数据库；返回结构统一：{ success, error?, data? }。
5. 所有金额字段统一“分”为存储单位，前端仅负责显示层转换“元”。

### 2) Task 2 startWash 详细步骤
1. 校验 stationId 非空，不合法直接返回。
2. 通过 OPENID + status=washing 查询进行中订单，存在则拒绝重复开单并返回原订单 ID。
3. 创建新订单（status=washing，写入 startTime/serverDate）。
4. 预留硬件控制调用点（仅注释，不接真实硬件）。
5. 部署并在开发者工具调用测试：同一用户连续调用两次，第二次应返回“有未完成订单”。

### 3) Task 3 endWash 详细步骤
1. 按 OPENID 查询进行中订单，不存在则返回错误。
2. 读取 settings/default，缺失配置时返回可读错误（不要静默失败）。
3. 计算时长：ceil((now-startTime)/60000)，并执行边界保护：
   - 最小 1 分钟
   - 最大不超过 maxDuration
4. 计算金额：amount = duration * pricePerMinute（单位分）。
5. 更新订单为 completed，写入 endTime/duration/amount。
6. 部署后做边界验证：0~1 分钟场景、超过 maxDuration 场景。

### 4) Task 4 管理类函数详细步骤
1. adminLogin：用 OPENID 验证管理员身份，再校验密码。
2. updatePrice：
   - 先做管理员鉴权
   - 校验 pricePerMinute 为正整数
   - 更新 settings/default，不存在则创建
3. getOrders：管理员按站点、状态、时间分页查询。
4. getMyOrders：按当前 OPENID 分页查个人订单。
5. getStats：按今日/本周/本月/累计聚合订单数与金额。
6. 每个函数都必须补充最少 1 个失败路径（权限不足/参数错误/无数据）验证记录。

### 5) Task 5 辅助函数详细步骤
1. generateMockData：
   - 仅管理员可调用
   - 支持一次生成多站点、多状态订单
   - 输出生成数量统计
2. hardwareControl：
   - 保留统一入参 action/stationId
   - 仅打印日志并返回 mock 成功，不接入真实设备

### 6) 云开发部署与验证清单（每个后端 Task 都执行）
1. 在微信开发者工具中对改动函数执行“上传并部署（云端安装依赖）”。
2. 打开云函数日志，保留一次成功调用与一次失败调用日志证据。
3. 在数据库中核对写入结果与字段类型（尤其 amount/duration/status）。
4. 将验证结论记录到当前 Task 的验收结果中，再进入下一 Task。


## Task 2: 云函数 — startWash

**Task Skill：** subagent-driven-development + cloudbase-guidelines + cloud-functions + test-driven-development

**文件：**
- 创建: `cloudfunctions/startWash/index.js`
- 创建: `cloudfunctions/startWash/package.json`

**Step 1: 编写 startWash 云函数**

```javascript
// cloudfunctions/startWash/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { stationId } = event

  if (!stationId) {
    return { success: false, error: '缺少洗车站编号' }
  }

  // 检查是否有进行中的订单
  const existingOrder = await db.collection('orders')
    .where({ openid, status: 'washing' })
    .get()

  if (existingOrder.data.length > 0) {
    return { success: false, error: '您有未完成的洗车订单', orderId: existingOrder.data[0]._id }
  }

  // 创建新订单
  const result = await db.collection('orders').add({
    data: {
      openid,
      stationId,
      status: 'washing',
      startTime: db.serverDate(),
      endTime: null,
      duration: 0,
      amount: 0,
      paidAt: null,
      createdAt: db.serverDate()
    }
  })

  // 预留：硬件控制 - 开门
  // await hardwareControl('open_door', stationId)

  return { success: true, orderId: result._id }
}
```

**Step 2: 编写 package.json**

```json
{
  "name": "startWash",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

---

## Task 3: 云函数 — endWash

**Task Skill：** subagent-driven-development + cloudbase-guidelines + cloud-functions + test-driven-development

**文件：**
- 创建: `cloudfunctions/endWash/index.js`
- 创建: `cloudfunctions/endWash/package.json`

**Step 1: 编写 endWash 云函数**

```javascript
// cloudfunctions/endWash/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 查找进行中的订单
  const orderResult = await db.collection('orders')
    .where({ openid, status: 'washing' })
    .get()

  if (orderResult.data.length === 0) {
    return { success: false, error: '未找到进行中的洗车订单' }
  }

  const order = orderResult.data[0]
  const now = new Date()
  const startTime = new Date(order.startTime)
  let duration = Math.ceil((now - startTime) / 60000) // 向上取整到分钟

  // 获取设置（单价和最大时长）
  const settingsResult = await db.collection('settings').doc('default').get()
  const settings = settingsResult.data
  const maxDuration = settings.maxDuration || 120

  // 超时保护
  if (duration > maxDuration) {
    duration = maxDuration
  }

  // 最少 1 分钟
  if (duration < 1) {
    duration = 1
  }

  const amount = duration * settings.pricePerMinute // 单位：分

  // 更新订单
  await db.collection('orders').doc(order._id).update({
    data: {
      status: 'completed',
      endTime: db.serverDate(),
      duration,
      amount
    }
  })

  // 预留：硬件控制 - 关门
  // await hardwareControl('close_door', order.stationId)

  return {
    success: true,
    orderId: order._id,
    duration,
    amount,
    stationId: order.stationId
  }
}
```

---

## Task 4: 云函数 — adminLogin / updatePrice / getOrders / getMyOrders / getStats

**Task Skill：** subagent-driven-development + cloudbase-guidelines + cloud-functions + cloudbase-document-database-in-wechat-miniprogram + test-driven-development

**文件：**
- 创建: `cloudfunctions/adminLogin/index.js`
- 创建: `cloudfunctions/updatePrice/index.js`
- 创建: `cloudfunctions/getOrders/index.js`
- 创建: `cloudfunctions/getMyOrders/index.js`
- 创建: `cloudfunctions/getStats/index.js`
- 每个云函数均创建对应的 `package.json`

**Step 1: adminLogin**

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { password } = event

  const result = await db.collection('admins')
    .where({ openid })
    .get()

  if (result.data.length === 0) {
    return { success: false, error: '无管理权限' }
  }

  const admin = result.data[0]
  // MVP 简化：明文比较，正式版应改为哈希比较
  if (admin.password !== password) {
    return { success: false, error: '密码错误' }
  }

  return { success: true, name: admin.name }
}
```

**Step 2: updatePrice**

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { pricePerMinute } = event // 单位：分

  // 验证是否为管理员
  const adminCheck = await db.collection('admins').where({ openid }).count()
  if (adminCheck.total === 0) {
    return { success: false, error: '无管理权限' }
  }

  // 更新或创建设置
  try {
    await db.collection('settings').doc('default').update({
      data: { pricePerMinute, updatedAt: db.serverDate() }
    })
  } catch (e) {
    await db.collection('settings').add({
      data: { _id: 'default', pricePerMinute, maxDuration: 120, updatedAt: db.serverDate() }
    })
  }

  return { success: true }
}
```

**Step 3: getOrders（业主查看所有订单）**

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { stationId, page = 1, pageSize = 20 } = event

  // 验证管理员
  const adminCheck = await db.collection('admins').where({ openid }).count()
  if (adminCheck.total === 0) {
    return { success: false, error: '无管理权限' }
  }

  let query = db.collection('orders')
  if (stationId) {
    query = query.where({ stationId })
  }

  const result = await query
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return { success: true, orders: result.data }
}
```

**Step 4: getMyOrders（客户查看自己的订单）**

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const result = await db.collection('orders')
    .where({ openid })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  return { success: true, orders: result.data }
}
```

**Step 5: getStats（业主查看统计数据）**

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 验证管理员
  const adminCheck = await db.collection('admins').where({ openid }).count()
  if (adminCheck.total === 0) {
    return { success: false, error: '无管理权限' }
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // 统计函数
  async function getStatsByTimeRange(startDate) {
    const result = await db.collection('orders')
      .where({
        status: _.in(['completed', 'paid']),
        createdAt: _.gte(startDate)
      })
      .get()

    const orders = result.data
    const totalAmount = orders.reduce((sum, o) => sum + (o.amount || 0), 0)
    return { count: orders.length, totalAmount }
  }

  // 累计统计
  const allOrders = await db.collection('orders')
    .where({ status: _.in(['completed', 'paid']) })
    .get()
  const allTotal = allOrders.data.reduce((sum, o) => sum + (o.amount || 0), 0)

  const [today, week, month] = await Promise.all([
    getStatsByTimeRange(todayStart),
    getStatsByTimeRange(weekStart),
    getStatsByTimeRange(monthStart)
  ])

  return {
    success: true,
    stats: {
      today,
      week,
      month,
      all: { count: allOrders.data.length, totalAmount: allTotal }
    }
  }
}
```

---

## Task 5: 云函数 — generateMockData / hardwareControl

**Task Skill：** subagent-driven-development + cloudbase-guidelines + cloud-functions + test-driven-development

**文件：**
- 创建: `cloudfunctions/generateMockData/index.js`
- 创建: `cloudfunctions/hardwareControl/index.js`

**Step 1: generateMockData**

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 验证管理员
  const adminCheck = await db.collection('admins').where({ openid }).count()
  if (adminCheck.total === 0) {
    return { success: false, error: '无管理权限' }
  }

  const { count = 30 } = event
  const stations = ['station_01', 'station_02']
  const statuses = ['paid', 'paid', 'paid', 'completed'] // 75% 已支付
  const mockOrders = []

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    startDate.setHours(Math.floor(Math.random() * 12) + 7) // 7:00-19:00
    startDate.setMinutes(Math.floor(Math.random() * 60))

    const duration = Math.floor(Math.random() * 45) + 5 // 5-50 分钟
    const endDate = new Date(startDate.getTime() + duration * 60000)
    const pricePerMinute = 100 // 1 元/分钟
    const amount = duration * pricePerMinute
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    mockOrders.push({
      openid: `mock_user_${Math.floor(Math.random() * 10)}`,
      stationId: stations[Math.floor(Math.random() * stations.length)],
      status,
      startTime: startDate,
      endTime: endDate,
      duration,
      amount,
      paidAt: status === 'paid' ? endDate : null,
      createdAt: startDate
    })
  }

  // 批量插入（每次最多20条）
  const batchSize = 20
  for (let i = 0; i < mockOrders.length; i += batchSize) {
    const batch = mockOrders.slice(i, i + batchSize)
    const tasks = batch.map(order => db.collection('orders').add({ data: order }))
    await Promise.all(tasks)
  }

  return { success: true, inserted: mockOrders.length }
}
```

**Step 2: hardwareControl（预留）**

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { action, stationId } = event
  // action: "open_door" | "close_door"
  console.log(`[预留] 硬件控制: ${action} - 站点 ${stationId}`)
  return { success: true, mock: true, action, stationId }
}
```

---

## Task 6: 客户端页面 — 首页（index）

**Task Skill：** subagent-driven-development + miniprogram-development + test-driven-development

**文件：**
- 创建: `miniprogram/pages/index/index.wxml`
- 创建: `miniprogram/pages/index/index.wxss`
- 创建: `miniprogram/pages/index/index.js`
- 创建: `miniprogram/pages/index/index.json`

**Step 1: index.wxml**

```xml
<view class="container">
  <view class="card hero-card">
    <image class="hero-icon" src="/images/car-wash.png" mode="aspectFit"></image>
    <text class="hero-title">自助洗车</text>
    <text class="hero-station" wx:if="{{stationId}}">站点：{{stationId}}</text>
  </view>

  <!-- 无进行中订单：显示开始洗车 -->
  <view wx:if="{{!hasActiveOrder}}" class="card action-card">
    <text class="action-hint">扫码开始洗车</text>
    <view class="price-info" wx:if="{{price}}">
      <text>当前费率：{{price}} 元/分钟</text>
    </view>
    <button class="btn-primary" bindtap="onStartWash" loading="{{loading}}">开始洗车</button>
  </view>

  <!-- 有进行中订单：显示结束洗车 -->
  <view wx:if="{{hasActiveOrder}}" class="card action-card">
    <text class="action-hint">洗车进行中……</text>
    <text class="timer">已用时：{{elapsedTime}}</text>
    <button class="btn-danger" bindtap="onEndWash" loading="{{loading}}">结束洗车</button>
  </view>

  <!-- 底部导航 -->
  <view class="bottom-links">
    <text class="link" bindtap="goHistory">我的订单</text>
    <text class="link-divider">|</text>
    <text class="link" bindtap="goAdmin">管理入口</text>
  </view>
</view>
```

**Step 2: index.js**

```javascript
const util = require('../../utils/util')

Page({
  data: {
    stationId: '',
    hasActiveOrder: false,
    activeOrderId: '',
    elapsedTime: '',
    price: '',
    loading: false
  },

  timer: null,
  activeOrder: null,

  onLoad(options) {
    // 从二维码或 URL 获取 stationId
    const stationId = options.stationId || options.scene || 'station_01'
    this.setData({ stationId })
    this.checkActiveOrder()
    this.loadPrice()
  },

  onShow() {
    this.checkActiveOrder()
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },

  async loadPrice() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getSettings' })
      if (res.result && res.result.pricePerMinute) {
        this.setData({ price: util.fenToYuan(res.result.pricePerMinute) })
      }
    } catch (e) {
      console.log('获取价格失败', e)
    }
  },

  async checkActiveOrder() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getMyOrders' })
      if (res.result.success) {
        const activeOrder = res.result.orders.find(o => o.status === 'washing')
        if (activeOrder) {
          this.activeOrder = activeOrder
          this.setData({ hasActiveOrder: true, activeOrderId: activeOrder._id })
          this.startTimer(activeOrder.startTime)
        } else {
          this.setData({ hasActiveOrder: false })
          if (this.timer) clearInterval(this.timer)
        }
      }
    } catch (e) {
      console.error('检查订单失败', e)
    }
  },

  startTimer(startTime) {
    if (this.timer) clearInterval(this.timer)
    const start = new Date(startTime).getTime()
    this.timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 60000)
      this.setData({ elapsedTime: util.formatDuration(elapsed) })
    }, 1000)
  },

  async onStartWash() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'startWash',
        data: { stationId: this.data.stationId }
      })
      if (res.result.success) {
        wx.showToast({ title: '洗车开始！', icon: 'success' })
        this.checkActiveOrder()
      } else {
        wx.showToast({ title: res.result.error, icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
    this.setData({ loading: false })
  },

  async onEndWash() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({ name: 'endWash' })
      if (res.result.success) {
        if (this.timer) clearInterval(this.timer)
        wx.navigateTo({
          url: `/pages/payment/payment?orderId=${res.result.orderId}&duration=${res.result.duration}&amount=${res.result.amount}&stationId=${res.result.stationId}`
        })
      } else {
        wx.showToast({ title: res.result.error, icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
    this.setData({ loading: false })
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/login/login' })
  }
})
```

**Step 3: index.wxss**

```css
.hero-card {
  text-align: center;
  padding: 60rpx 30rpx;
}

.hero-icon {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 20rpx;
}

.hero-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 10rpx;
}

.hero-station {
  display: block;
  font-size: 26rpx;
  color: #999;
}

.action-card {
  text-align: center;
  padding: 40rpx 30rpx;
}

.action-hint {
  display: block;
  font-size: 32rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.price-info {
  margin-bottom: 30rpx;
  color: #ff9800;
  font-size: 28rpx;
}

.timer {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  color: #ff4d4f;
  margin-bottom: 30rpx;
}

.bottom-links {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40rpx 0;
}

.link {
  color: #1890ff;
  font-size: 28rpx;
}

.link-divider {
  margin: 0 20rpx;
  color: #ddd;
}
```

**Step 4: index.json**

```json
{
  "navigationBarTitleText": "自助洗车"
}
```

---

## Task 7: 客户端页面 — 洗车计时（washing）

**Task Skill：** subagent-driven-development + miniprogram-development + test-driven-development

**文件：**
- 创建: `miniprogram/pages/washing/washing.wxml`
- 创建: `miniprogram/pages/washing/washing.js`
- 创建: `miniprogram/pages/washing/washing.wxss`
- 创建: `miniprogram/pages/washing/washing.json`

> 注意：在 MVP 中，计时功能已集成在首页的"有进行中订单"状态中。
> `washing` 页面作为备用独立页面，如客户从微信消息通知跳转使用。
> 可选实现，优先完成首页即可。

---

## Task 8: 客户端页面 — 模拟支付（payment）

**Task Skill：** subagent-driven-development + miniprogram-development + test-driven-development

**文件：**
- 创建: `miniprogram/pages/payment/payment.wxml`
- 创建: `miniprogram/pages/payment/payment.js`
- 创建: `miniprogram/pages/payment/payment.wxss`
- 创建: `miniprogram/pages/payment/payment.json`

**Step 1: payment.wxml**

```xml
<view class="container">
  <view class="card payment-card" wx:if="{{!paid}}">
    <text class="section-title">洗车费用</text>
    <view class="info-row">
      <text class="label">站点</text>
      <text class="value">{{stationId}}</text>
    </view>
    <view class="info-row">
      <text class="label">用时</text>
      <text class="value">{{durationText}}</text>
    </view>
    <view class="info-row amount-row">
      <text class="label">应付</text>
      <text class="amount">¥ {{amountYuan}}</text>
    </view>
    <button class="btn-primary" bindtap="onPay" loading="{{loading}}">确认支付（模拟）</button>
  </view>

  <view class="card success-card" wx:if="{{paid}}">
    <text class="success-icon">✓</text>
    <text class="success-text">支付成功</text>
    <text class="success-hint">感谢使用自助洗车服务</text>
    <button class="btn-primary" bindtap="goHome">返回首页</button>
  </view>
</view>
```

**Step 2: payment.js**

```javascript
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
    const { orderId, duration, amount, stationId } = options
    this.setData({
      orderId,
      duration: parseInt(duration),
      amount: parseInt(amount),
      stationId,
      durationText: util.formatDuration(parseInt(duration)),
      amountYuan: util.fenToYuan(parseInt(amount))
    })
  },

  async onPay() {
    this.setData({ loading: true })
    // 模拟支付：直接更新订单状态
    try {
      const db = wx.cloud.database()
      await db.collection('orders').doc(this.data.orderId).update({
        data: {
          status: 'paid',
          paidAt: db.serverDate()
        }
      })
      this.setData({ paid: true })
    } catch (e) {
      wx.showToast({ title: '支付失败', icon: 'none' })
    }
    this.setData({ loading: false })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
```

**Step 3: payment.wxss**

```css
.payment-card {
  text-align: center;
  padding: 40rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.label { color: #999; }
.value { color: #333; font-weight: 500; }

.amount-row {
  margin: 20rpx 0 30rpx;
  border-bottom: none;
}

.amount {
  color: #ff4d4f;
  font-size: 48rpx;
  font-weight: bold;
}

.success-card {
  text-align: center;
  padding: 60rpx 40rpx;
}

.success-icon {
  display: block;
  font-size: 100rpx;
  color: #52c41a;
  margin-bottom: 20rpx;
}

.success-text {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.success-hint {
  display: block;
  color: #999;
  margin-bottom: 40rpx;
}
```

---

## Task 9: 客户端页面 — 历史订单（history）

**Task Skill：** subagent-driven-development + miniprogram-development + test-driven-development

**文件：**
- 创建: `miniprogram/pages/history/history.wxml`
- 创建: `miniprogram/pages/history/history.js`
- 创建: `miniprogram/pages/history/history.wxss`
- 创建: `miniprogram/pages/history/history.json`

**Step 1: history.wxml**

```xml
<view class="container">
  <text class="section-title">我的洗车记录</text>

  <view wx:if="{{orders.length === 0}}" class="empty-hint">
    <text>暂无洗车记录</text>
  </view>

  <view wx:for="{{orders}}" wx:key="_id" class="card order-item">
    <view class="order-header">
      <text class="order-station">{{item.stationId}}</text>
      <text class="order-status status-{{item.status}}">{{item.statusText}}</text>
    </view>
    <view class="order-info">
      <text>时间：{{item.startTimeText}}</text>
    </view>
    <view class="order-info" wx:if="{{item.duration}}">
      <text>时长：{{item.durationText}}</text>
    </view>
    <view class="order-info" wx:if="{{item.amount}}">
      <text>费用：¥{{item.amountYuan}}</text>
    </view>
  </view>
</view>
```

**Step 2: history.js**

```javascript
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
      if (res.result.success) {
        const statusMap = { washing: '洗车中', completed: '待支付', paid: '已支付' }
        const orders = res.result.orders.map(order => ({
          ...order,
          statusText: statusMap[order.status] || order.status,
          startTimeText: util.formatTime(order.startTime),
          durationText: util.formatDuration(order.duration),
          amountYuan: util.fenToYuan(order.amount)
        }))
        this.setData({ orders })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  }
})
```

**Step 3: history.wxss**

```css
.empty-hint {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
}

.order-item { padding: 24rpx 30rpx; }

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.order-station { font-weight: bold; font-size: 30rpx; }

.status-washing { color: #1890ff; }
.status-completed { color: #ff9800; }
.status-paid { color: #52c41a; }

.order-info {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 4rpx;
}
```

---

## Task 10: 业主端页面 — 登录（admin/login）

**Task Skill：** subagent-driven-development + miniprogram-development + auth-wechat-miniprogram + test-driven-development

**文件：**
- 创建: `miniprogram/pages/admin/login/login.wxml`
- 创建: `miniprogram/pages/admin/login/login.js`
- 创建: `miniprogram/pages/admin/login/login.wxss`
- 创建: `miniprogram/pages/admin/login/login.json`

**Step 1: login.wxml**

```xml
<view class="container">
  <view class="card login-card">
    <text class="section-title">业主登录</text>
    <input class="input" type="text" password placeholder="请输入管理密码"
           bindinput="onPasswordInput" value="{{password}}" />
    <button class="btn-primary" bindtap="onLogin" loading="{{loading}}">登录</button>
  </view>
</view>
```

**Step 2: login.js**

```javascript
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
      if (res.result.success) {
        app.globalData.isAdmin = true
        wx.redirectTo({ url: '/pages/admin/panel/panel' })
      } else {
        wx.showToast({ title: res.result.error, icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
    this.setData({ loading: false })
  }
})
```

**Step 3: login.wxss**

```css
.login-card {
  margin-top: 100rpx;
  padding: 40rpx;
  text-align: center;
}

.input {
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin: 30rpx 0;
  font-size: 30rpx;
}
```

---

## Task 11: 业主端页面 — 管理面板（admin/panel）

**Task Skill：** subagent-driven-development + miniprogram-development + cloudbase-guidelines + test-driven-development

**文件：**
- 创建: `miniprogram/pages/admin/panel/panel.wxml`
- 创建: `miniprogram/pages/admin/panel/panel.js`
- 创建: `miniprogram/pages/admin/panel/panel.wxss`
- 创建: `miniprogram/pages/admin/panel/panel.json`

**Step 1: panel.wxml**

```xml
<view class="container">
  <!-- Tab 切换 -->
  <view class="tabs">
    <view class="tab {{activeTab === 'price' ? 'active' : ''}}" bindtap="switchTab" data-tab="price">费用设置</view>
    <view class="tab {{activeTab === 'orders' ? 'active' : ''}}" bindtap="switchTab" data-tab="orders">订单列表</view>
    <view class="tab {{activeTab === 'stats' ? 'active' : ''}}" bindtap="switchTab" data-tab="stats">数据统计</view>
  </view>

  <!-- 费用设置 -->
  <view wx:if="{{activeTab === 'price'}}" class="card">
    <text class="section-title">费用设置</text>
    <view class="price-form">
      <text class="form-label">单价（元/分钟）</text>
      <input class="input" type="digit" placeholder="请输入单价"
             bindinput="onPriceInput" value="{{priceYuan}}" />
      <button class="btn-primary" bindtap="onSavePrice" loading="{{loading}}">保存</button>
    </view>
  </view>

  <!-- 订单列表 -->
  <view wx:if="{{activeTab === 'orders'}}">
    <!-- 站点筛选 -->
    <view class="filter-bar">
      <picker bindchange="onStationFilter" value="{{stationIndex}}" range="{{stationOptions}}">
        <view class="picker-btn">站点：{{stationOptions[stationIndex]}}</view>
      </picker>
    </view>

    <view wx:if="{{orders.length === 0}}" class="empty-hint">
      <text>暂无订单</text>
    </view>

    <view wx:for="{{orders}}" wx:key="_id" class="card order-item">
      <view class="order-header">
        <text class="order-station">{{item.stationId}}</text>
        <text class="order-status status-{{item.status}}">{{item.statusText}}</text>
      </view>
      <view class="order-info"><text>时间：{{item.startTimeText}}</text></view>
      <view class="order-info"><text>时长：{{item.durationText}}</text></view>
      <view class="order-info"><text>费用：¥{{item.amountYuan}}</text></view>
    </view>
  </view>

  <!-- 数据统计 -->
  <view wx:if="{{activeTab === 'stats'}}">
    <view class="card stat-card">
      <text class="stat-title">今日</text>
      <text class="stat-number">¥{{stats.today.amountYuan}}</text>
      <text class="stat-count">{{stats.today.count}} 单</text>
    </view>
    <view class="card stat-card">
      <text class="stat-title">本周</text>
      <text class="stat-number">¥{{stats.week.amountYuan}}</text>
      <text class="stat-count">{{stats.week.count}} 单</text>
    </view>
    <view class="card stat-card">
      <text class="stat-title">本月</text>
      <text class="stat-number">¥{{stats.month.amountYuan}}</text>
      <text class="stat-count">{{stats.month.count}} 单</text>
    </view>
    <view class="card stat-card">
      <text class="stat-title">累计</text>
      <text class="stat-number">¥{{stats.all.amountYuan}}</text>
      <text class="stat-count">{{stats.all.count}} 单</text>
    </view>

    <button class="btn-mock" bindtap="onGenerateMock" loading="{{mockLoading}}">
      生成 30 条测试数据
    </button>
  </view>
</view>
```

**Step 2: panel.js**

```javascript
const util = require('../../../utils/util')
const app = getApp()

Page({
  data: {
    activeTab: 'price',
    priceYuan: '',
    loading: false,
    // 订单
    orders: [],
    stationOptions: ['全部', 'station_01', 'station_02'],
    stationIndex: 0,
    // 统计
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

  // ---- 费用设置 ----
  async loadPrice() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('settings').doc('default').get()
      this.setData({ priceYuan: util.fenToYuan(res.data.pricePerMinute) })
    } catch (e) {
      this.setData({ priceYuan: '' })
    }
  },

  onPriceInput(e) {
    this.setData({ priceYuan: e.detail.value })
  },

  async onSavePrice() {
    const yuan = parseFloat(this.data.priceYuan)
    if (isNaN(yuan) || yuan <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      await wx.cloud.callFunction({
        name: 'updatePrice',
        data: { pricePerMinute: util.yuanToFen(yuan) }
      })
      wx.showToast({ title: '保存成功', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
    this.setData({ loading: false })
  },

  // ---- 订单列表 ----
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
      if (res.result.success) {
        const statusMap = { washing: '洗车中', completed: '待支付', paid: '已支付' }
        const orders = res.result.orders.map(order => ({
          ...order,
          statusText: statusMap[order.status] || order.status,
          startTimeText: util.formatTime(order.startTime),
          durationText: util.formatDuration(order.duration),
          amountYuan: util.fenToYuan(order.amount)
        }))
        this.setData({ orders })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  onStationFilter(e) {
    this.setData({ stationIndex: parseInt(e.detail.value) })
    this.loadOrders()
  },

  // ---- 数据统计 ----
  async loadStats() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'getStats' })
      if (res.result.success) {
        const s = res.result.stats
        this.setData({
          stats: {
            today: { count: s.today.count, amountYuan: util.fenToYuan(s.today.totalAmount) },
            week: { count: s.week.count, amountYuan: util.fenToYuan(s.week.totalAmount) },
            month: { count: s.month.count, amountYuan: util.fenToYuan(s.month.totalAmount) },
            all: { count: s.all.count, amountYuan: util.fenToYuan(s.all.totalAmount) }
          }
        })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  // ---- 假数据 ----
  async onGenerateMock() {
    this.setData({ mockLoading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'generateMockData',
        data: { count: 30 }
      })
      if (res.result.success) {
        wx.showToast({ title: `已生成 ${res.result.inserted} 条`, icon: 'success' })
        this.loadOrders()
        this.loadStats()
      }
    } catch (e) {
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
    this.setData({ mockLoading: false })
  }
})
```

**Step 3: panel.wxss**

```css
.tabs {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  border-bottom: 4rpx solid transparent;
}

.tab.active {
  color: #1890ff;
  font-weight: bold;
  border-bottom-color: #1890ff;
}

.price-form { margin-top: 20rpx; }
.form-label { display: block; color: #666; margin-bottom: 10rpx; }

.input {
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  font-size: 30rpx;
}

.filter-bar {
  margin-bottom: 20rpx;
}

.picker-btn {
  background: #fff;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
}

.empty-hint { text-align: center; color: #999; padding: 80rpx 0; }

.order-item { padding: 24rpx 30rpx; }
.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.order-station { font-weight: bold; font-size: 30rpx; }
.status-washing { color: #1890ff; }
.status-completed { color: #ff9800; }
.status-paid { color: #52c41a; }
.order-info { font-size: 26rpx; color: #666; margin-bottom: 4rpx; }

.stat-card {
  text-align: center;
  padding: 30rpx;
}

.stat-title {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.stat-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.stat-count {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}

.btn-mock {
  margin-top: 30rpx;
  background: #f5f5f5;
  color: #666;
  border-radius: 12rpx;
  font-size: 28rpx;
}
```

---

## Task 12: 二维码生成方案

**Task Skill：** verification-before-completion

**说明：** 无需代码开发，只需在微信小程序管理后台手动生成。

**Step 1: 生成两个测试二维码**

1. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com)
2. 进入「工具」→「生成小程序码」
3. 页面路径填：`pages/index/index`
4. 启动参数：
   - 二维码 1：`stationId=station_01`
   - 二维码 2：`stationId=station_02`
5. 下载二维码图片，打印贴在对应洗车点

**Step 2: 手动创建管理员记录**

在微信云开发控制台 → 数据库 → `admins` 集合 → 添加记录：

```json
{
  "openid": "业主微信的openid",
  "password": "admin123",
  "name": "业主姓名"
}
```

**Step 3: 初始化设置记录**

在 `settings` 集合 → 添加记录：

```json
{
  "_id": "default",
  "pricePerMinute": 100,
  "maxDuration": 120,
  "updatedAt": "2026-03-04T00:00:00Z"
}
```

---

**计划完成，保存于 `docs/plans/2026-03-04-self-service-carwash-plan.md`。**

**两种执行方式：**

1. **Subagent-Driven（当前会话）** — 我逐个任务分派子代理执行，任务间进行审查，快速迭代
2. **Parallel Session（新会话）** — 在新会话中使用 executing-plans 技能，分批执行并设置人工检查点

**你选择哪种方式？**

