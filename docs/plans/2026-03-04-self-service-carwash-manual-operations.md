# 自助洗车小程序：手工操作与手工验证清单（Task 12 / 收尾）

## 0. 基本信息
- 日期：2026-03-04
- 工作分支：`feat/task1-method1-init`
- 基线分支：`master`
- 小程序 AppID：`<YOUR_APPID>`
- 云环境 ID：`<YOUR_CLOUDBASE_ENV_ID>`

## 1. 已完成记录（手工）
- 当前会话未记录到已完成的控制台手工操作。
- 如果你已线下完成，请在下方补记：
  - [ ] 已生成 `station_01` 小程序码（时间：____）
  - [ ] 已生成 `station_02` 小程序码（时间：____）
  - [ ] 已写入 `admins` 管理员记录（时间：____）
  - [ ] 已写入 `settings/default` 配置记录（时间：____）

## 2. 待手工完成（必须）

### 2.1 生成小程序码（2 个）
1. 登录 `mp.weixin.qq.com`
2. 进入「工具」->「生成小程序码」
3. 页面路径填：`pages/index/index`
4. 分别生成：
   - 二维码 A：`stationId=station_01`
   - 二维码 B：`stationId=station_02`
5. 下载并按站点张贴

验收标准：
- 扫码后能进入小程序首页并识别对应站点参数

### 2.2 初始化管理员（`admins` 集合）
在云开发控制台数据库新增文档：

```json
{
  "openid": "业主微信OPENID",
  "password": "<ADMIN_PASSWORD_OR_HASH>",
  "name": "业主姓名"
}
```

验收标准：
- 业主端 `admin/login` 输入密码后可进入 `admin/panel`

### 2.3 初始化全局设置（`settings` 集合）
新增（或确认存在）`_id=default` 文档：

```json
{
  "_id": "default",
  "pricePerMinute": 100,
  "maxDuration": 120,
  "updatedAt": "2026-03-04T00:00:00Z"
}
```

验收标准：
- 首页/管理面板可读取单价
- `endWash` 按该单价计算金额（单位：分）

## 3. 后续必须手工验证（上线前）

### 3.1 扫码与客户主流程
- [ ] 扫 `station_01` 码进入首页，显示站点为 `station_01`
- [ ] 扫 `station_02` 码进入首页，显示站点为 `station_02`
- [ ] 点击“开始洗车”可创建进行中订单
- [ ] 同一用户重复开始洗车会被拦截（已有进行中订单）
- [ ] 点击“结束洗车”后进入支付页，时长/金额正确
- [ ] 支付后订单状态变为 `paid`
- [ ] 历史订单页可看到最新订单

### 3.2 业主流程
- [ ] 非管理员进入 `admin/panel` 会被重定向到登录页
- [ ] 管理员可登录并进入面板
- [ ] 修改单价成功后，新订单按新单价计费
- [ ] 订单列表可按站点筛选
- [ ] 统计面板（今日/本周/本月/累计）显示正确
- [ ] 点击“生成 30 条测试数据”后，订单与统计刷新

### 3.3 云函数与数据库侧验收
- [ ] 云函数日志至少保留一次成功 + 一次失败调用证据
- [ ] `orders` 字段类型正确：`amount`(分, number)、`duration`(分钟, number)、`status`(string)
- [ ] `settings/default` 字段存在且可读
- [ ] 权限路径验证：非管理员调用管理函数返回权限错误

## 4. 证据留存建议
- 小程序码截图（2 张）
- 云数据库截图：
  - `admins` 新增记录
  - `settings/default`
  - `orders` 关键样本（`washing/completed/paid`）
- 云函数日志截图：
  - `startWash/endWash/updatePrice/getOrders/getStats/generateMockData`
- 关键流程录屏（建议 1 段，覆盖扫码->洗车->支付->后台查看）

## 5. 收尾流状态（finishing-a-development-branch）
- 已执行：测试验证（通过）
- 已执行：基线分支识别（`master`）
- 待执行：按你的选择进行 merge / PR / 保留 / 丢弃

