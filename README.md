# Monorepo Demo

基于 pnpm workspaces + webpack 的 monorepo 示例项目。

## 项目结构

```
monorepo/
├── packages/
│   ├── shared/          # 公共工具库
│   │   ├── package.json
│   │   └── index.js
│   ├── app-a/           # 应用 A (端口 3001)
│   │   ├── package.json
│   │   ├── webpack.config.js
│   │   └── src/
│   │       ├── index.html
│   │       └── index.js
│   └── app-b/           # 应用 B (端口 3002)
│       ├── package.json
│       ├── webpack.config.js
│       └── src/
│           ├── index.html
│           └── index.js
├── package.json
└── pnpm-workspace.yaml
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动 App A
pnpm dev:app-a

# 启动 App B
pnpm dev:app-b

# 构建所有应用
pnpm build:all
```

## 公共库 (shared)

提供以下工具函数：
- `formatDate(date)` - 格式化日期
- `formatTime(date)` - 格式化时间
- `generateId()` - 生成唯一 ID
- `deepClone(obj)` - 深拷贝
- `debounce(fn, delay)` - 防抖
- `throttle(fn, interval)` - 节流

## 应用说明

### App A (端口 3001)
- 演示 formatDate, formatTime, generateId, deepClone
- 展示日期格式化和深拷贝功能

### App B (端口 3002)
- 演示 debounce, throttle, formatTime
- 展示防抖和节流效果

## 添加新应用

1. 在 `packages/` 下创建新目录
2. 添加 `package.json`，设置依赖 `"shared": "workspace:*"`
3. 添加 `webpack.config.js`
4. 在根目录 `package.json` 添加脚本
