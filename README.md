# MyEMS PV 光伏管理系统 - 若依Vue3 实现版

基于 **RuoYi-Vue3** 框架的分布式光伏电站管理系统全栈实现。

**状态**: ✅ MVP 完成 | 📦 1713 行代码 | 🚀 可部署

---

## 📋 项目概述

### 核心功能

| 模块 | 状态 | 说明 |
|------|------|------|
| **监控大屏** | ✅ | 实时功率 + 24h 功率曲线 + 活动告警 |
| **电站管理** | ✅ | 增删改查 + 标签关联 + 后端删除校验 |
| **接入设备** | ✅ | 网关/DTU 管理、MQTT/轮询配置 |
| **逆变器管理** | ✅ | 逆变器 CRUD + 所属网关关联 |
| **数据分析** | ✅ | 24小时发电量统计表格 + Excel导出 |
| **系统告警** | ✅ | 告警列表 + 级别过滤 + 一键处理 |
| **基础资料** | ✅ | 品牌型号 + 电站标签管理 |

### 技术栈

```
前端框架:    Vue 3 + Composition API
UI 组件库:   Element Plus 2.13.1
路由:        Vue Router 4.6.4
状态管理:    Pinia 3.0.4
表格/图表:   ECharts 5.6.0
构建工具:    Vite 6.4.1
样式:        SCSS (原生CSS变量支持)
```

### 文件结构

```
src/
├── views/pv/                 # 光伏业务页面
│   ├── dashboard/            # 监控大屏
│   ├── station/              # 电站管理
│   ├── gateway/              # 接入设备
│   ├── inverter/             # 逆变器管理
│   ├── alert/                # 系统告警
│   ├── analysis/             # 数据分析
│   ├── model/                # 品牌型号
│   └── stationTag/           # 电站标签
├── api/pv/                   # API 调用层
│   ├── dashboard.js          # 仪表盘接口
│   ├── station.js            # 电站接口
│   ├── gateway.js            # 接入设备接口
│   ├── inverter.js           # 逆变器接口
│   ├── alert.js              # 告警接口
│   ├── analysis.js           # 数据分析接口
│   └── catalog.js            # 基础资料接口（电站标签+型号）
├── layout/                   # 应用布局
├── router/                   # 路由配置
└── store/                    # Pinia 状态管理
```

---

## 🚀 快速开始

### 1. 环装环境

```bash
# Node.js 18+
node -v

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问：http://localhost:5173
```

### 2. 后端 API 集成

所有 API 调用已通过 `src/api/pv/*.js` 模块化定义，无需修改前端代码，仅需后端实现对应接口：

```
POST   /pv/dashboard/summary           获取仪表盘汇总
POST   /pv/dashboard/power-series      获取24h功率曲线
POST   /pv/dashboard/simulate          触发模拟数据（用于演示）

GET    /pv/station/list                查询电站列表（分页）
POST   /pv/station                     新增电站
PUT    /pv/station                     编辑电站
DELETE /pv/station/:stationId          删除电站

GET    /pv/gateway/list                查询接入设备列表
POST   /pv/gateway                     新增接入设备
PUT    /pv/gateway                     编辑接入设备
DELETE /pv/gateway/:gatewayId          删除接入设备

GET    /pv/inverter/list               查询逆变器列表
POST   /pv/inverter                    新增逆变器
PUT    /pv/inverter                    编辑逆变器
DELETE /pv/inverter/:inverterId        删除逆变器

GET    /pv/alert/list                  查询告警列表
POST   /pv/alert/resolve/:alertId      处理单个告警
POST   /pv/alert/resolve-all           一键处理所有告警

GET    /pv/analysis/hourly-yield       查询发电量统计（可按时间范围/分组）
GET    /pv/analysis/hourly-yield/export 导出 Excel

GET    /pv/stationTag/list             查询电站标签列表
POST   /pv/stationTag                  新增标签
PUT    /pv/stationTag                  编辑标签
DELETE /pv/stationTag/:tagId           删除标签

GET    /pv/model/list                  查询品牌型号列表
POST   /pv/model                       新增型号
PUT    /pv/model                       编辑型号
DELETE /pv/model/:modelId              删除型号
```

### 3. 环境变量配置

`.env.local`:
```env
VITE_APP_TITLE=MyEMS PV 光伏管理
VITE_APP_BASE_API=http://localhost:8080  # 后端 API 地址
```

---

## 🔑 核心特性

### 权限管理

所有列表/编辑/删除操作通过 `@/plugins/auth` 进行权限检查：

```javascript
import auth from '@/plugins/auth'

// 权限判断
const canAdd = auth.hasPermi(['pv:station:add'])
const canEdit = auth.hasPermi(['pv:station:edit'])
const canRemove = auth.hasPermi(['pv:station:remove'])
```

### 响应式设计

- 兼容 Element Plus 响应式栅栏系统
- 移动端友好的表格设计
- 智能列宽自适应

### 数据加载

所有列表页面均支持：
- ✅ 分页加载
- ✅ 搜索过滤
- ✅ 排序
- ✅ 加载状态指示

### 表单验证

所有新增/编辑表单使用 Element Plus Form 的规则验证：

```javascript
const rules = {
  stationName: [
    { required: true, message: '电站名称不能为空', trigger: 'blur' }
  ]
}
```

---

## 📊 数据模型

### 电站 (Station)
```typescript
{
  stationId: number,
  stationName: string,        // 必填
  location: string,           // 地理位置
  tagId: number,             // 关联电站标签
  capacityMw: number,        // 装机容量(MW)
  createTime: string,        // 创建时间
  updateTime?: string
}
```

### 接入设备 (Gateway)
```typescript
{
  gatewayId: string,
  name: string,
  type: 'DTU' | 'EdgeGateway' | 'SmartDongle',
  stationId: string,         // 所属电站
  serialNumber: string,      // SN码
  communicationType: 'MQTT' | 'Polling',
  config: {
    brokerUrl?: string,      // MQTT broker
    topic?: string,
    pollingInterval?: number, // 轮询间隔(秒)
    protocol: 'ModbusTCP' | 'ModbusRTU' | 'IEC60870'
  },
  status: 'online' | 'offline' | 'fault',
  lastSeen: string
}
```

### 逆变器 (Inverter)
```typescript
{
  inverterId: string,
  inverterNumber: string,
  serialNumber: string,      // 必填
  model: string,            // 品牌型号，关联 Model
  gatewayId: string,        // 所属网关
  status: 'online' | 'offline' | 'fault',
  currentPower?: number,    // 当前功率(kW)
  lastSeen: string
}
```

### 告警 (Alert)
```typescript
{
  alertId: string,
  content: string,
  level: 'critical' | 'warning' | 'info',
  source: string,           // 告警来源
  status: 'active' | 'resolved',
  occurTime: string,
  resolvedTime?: string,
  resolvedBy?: string
}
```

### 发电量统计行 (HourlyYieldRow)
```typescript
{
  stationId: string,
  stationName: string,
  group: string,            // 分组标签名
  h0: number,              // 0点发电量(kWh)
  h1: number,              // 1点发电量
  ...
  h23: number,             // 23点发电量
  total: number            // 日总发电量
}
```

---

## 🛠️ 开发指南

### 添加新的数据管理模块

以 `stationTag`（电站标签）为例：

1. **创建 API 模块** (`src/api/pv/catalog.js`):
```javascript
export function listStationTag(params) {
  return request({
    url: '/pv/stationTag/list',
    method: 'get',
    params
  })
}
```

2. **创建 Vue 页面** (`src/views/pv/stationTag/index.vue`):
```vue
<template>
  <div class="app-container">
    <!-- 搜索工具栏 -->
    <!-- 数据表格 -->
    <!-- 新增/编辑对话框 -->
  </div>
</template>

<script setup>
import { listStationTag, addStationTag, updateStationTag, delStationTag } from '@/api/pv/catalog'
// 组件逻辑
</script>
```

3. **样式** — 所有通用样式在 `src/assets/styles/pv.scss` 中定义，组件可直接使用预定义的 CSS 类：
   - `.pv-toolbar` — 顶部工具栏
   - `.pv-table-card` — 表格卡片容器
   - `.pv-metric-card` — 统计卡片
   - 等等

### 修改样式主题

所有 PV 模块样式集中在 `src/assets/styles/pv.scss`，支持：
- 浅色/深色主题 (CSS 变量)
- 响应式栅栏
- 统一的间距和排版

---

## 🧪 测试与构建

### 开发阶段
```bash
npm run dev          # 启动开发服务器（HMR 热更新）
```

### 生产构建
```bash
npm run build:prod   # 生产环境构建
npm run build:stage  # 预发布构建
npm run preview      # 预览构建结果
```

### 构建输出
```
dist/
├── index.html       # 入口 HTML
├── assets/          # 静态资源（JS/CSS/字体）
└── ...
```

---

## 📱 浏览器兼容性

- ✅ Chrome / Edge (最新版)
- ✅ Firefox (最新版)
- ✅ Safari (13+)
- ⚠️ IE11 (不支持)

---

## 🔐 安全性

### 前端权限控制

所有操作按钮通过 `auth.hasPermi()` 进行权限检查，无权限用户无法看到按钮。

**⚠️ 重要**: 后端 API **必须** 也进行权限验证，不要依赖前端控制。

### API 认证

所有请求会自动带上 JWT Token（`Authorization: Bearer <token>`），由 `src/utils/request.js` 拦截器处理。

---

## 📚 相关文档

- [若依框架文档](https://doc.ruoyi.vip/ruoyi-vue/)
- [Element Plus 官方文档](https://element-plus.org/)
- [Vue 3 官方文档](https://vuejs.org/)
- [ECharts 文档](https://echarts.apache.org/)

---

## 📝 提交规范

遵循 RuoYi 约定的 Commit 规范：

```
feat: 新增功能
fix: 修复 bug
refactor: 代码重构
style: 样式调整
docs: 文档更新
chore: 构建工具/依赖更新
```

例子：
```
git commit -m "feat(pv): 新增监控大屏告警图表展示"
```

---

## 🎯 下一步优化方向

### 短期 (1-2 周)
- [ ] 完整的后端 API 实现 (Java/Spring Boot)
- [ ] 单元测试覆盖核心业务
- [ ] 错误边界 & 异常处理完善
- [ ] 国际化 (i18n) 支持

### 中期 (1-2 月)
- [ ] 实时数据推送 (WebSocket)
- [ ] 大屏展示模式 (全屏仪表盘)
- [ ] 告警推送 (短信/邮件)
- [ ] 数据导入 (Excel 批量导入)
- [ ] 权限细粒度控制

### 长期 (2-3 月+)
- [ ] 移动端 APP (基于 uni-app)
- [ ] 多租户支持
- [ ] 大数据分析 (时间序列图表优化)
- [ ] 智能预警 (基于 ML 模型)

---

## 📞 支持

遇到问题？

1. 检查 `/src/views/pv/` 中的类似模块实现
2. 查看 Element Plus / Vue 3 官方文档
3. 查看浏览器控制台 Network / Console 标签
4. 提交 Issue 或联系开发团队

---

**Last Updated**: 2024-12
**License**: MIT

