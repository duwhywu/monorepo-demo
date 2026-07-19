# Monorepo 详解

## 一、什么是 Monorepo

**Monorepo（单一代码库）** 是一种代码管理策略：多个相关项目共享同一个 Git 仓库。

| 对比 | Monorepo | Multirepo |
|------|----------|-----------|
| 代码位置 | 同一仓库 | 多个独立仓库 |
| 依赖管理 | 统一管理 | 各自管理 |
| 代码复用 | 直接引用 | npm 发包或 git submodule |
| 版本协调 | 统一版本 | 各自版本 |

### Monorepo 的优势

- **代码复用**：公共代码直接引用，无需发包
- **依赖统一**：所有项目使用相同版本的依赖
- **原子提交**：一个提交可以同时修改多个项目
- **简化协作**：团队在同一个仓库工作
- **统一配置**：lint、tsconfig 等配置可以共享

---

## 二、项目结构

```
monorepo/
├── packages/
│   ├── shared/          # 公共工具库
│   │   ├── package.json
│   │   └── index.js
│   ├── app-a/           # 应用 A（端口 3001）
│   │   ├── package.json
│   │   ├── webpack.config.js
│   │   └── src/
│   │       ├── index.html
│   │       └── index.js
│   └── app-b/           # 应用 B（端口 3002）
│       ├── package.json
│       ├── webpack.config.js
│       └── src/
│           ├── index.html
│           └── index.js
├── package.json         # 根配置
├── pnpm-workspace.yaml  # 工作区声明
└── README.md
```

---

## 三、核心配置文件

### 1. pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'    # 声明哪些目录是子包
```

告诉 pnpm：`packages/` 下的每个文件夹都是一个独立的包。

### 2. 根 package.json

```json
{
  "name": "monorepo-demo",
  "private": true,           // 整个仓库不发布到 npm
  "scripts": {
    "build:shared": "pnpm --filter shared build",
    "build:app-a": "pnpm --filter app-a build",
    "build:all": "pnpm -r build",
    "dev:app-a": "pnpm --filter app-a dev",
    "dev:app-b": "pnpm --filter app-b dev"
  }
}
```

### 3. 子包 package.json

```json
{
  "name": "app-a",
  "dependencies": {
    "shared": "workspace:*"   // 关键：引用本地的 shared 包
  }
}
```

`workspace:*` 表示引用工作区内的 `shared` 包，不从 npm 下载。

---

## 四、核心命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装所有包的依赖，自动链接 workspace 包 |
| `pnpm --filter <包名> <命令>` | 在指定包中执行命令 |
| `pnpm -r <命令>` | 递归执行所有包 |
| `pnpm -r build` | 按依赖顺序构建所有包 |
| `pnpm run dev:app-a` | 启动 app-a 的开发服务器 |

### 常用命令示例

```bash
# 安装依赖
pnpm install

# 启动某个应用
pnpm dev:app-a

# 只构建某个包
pnpm --filter app-a build

# 构建所有包
pnpm build:all

# 清理所有 node_modules
pnpm -r exec rm -rf node_modules
```

---

## 五、依赖关系

### 依赖图

```
app-a ──┬──> shared
app-b ──┘
```

### 符号链接（Symlink）

```bash
# pnpm install 后，node_modules/shared 指向 packages/shared
node_modules/shared -> ../../packages/shared
```

所以 `require('shared')` 实际上是引用本地的 `packages/shared/index.js`。

### 依赖提升

```
packages/app-a/node_modules/   # 只有版本冲突的包才会在这里
packages/app-b/node_modules/   # 同上
node_modules/                  # 公共依赖都在这里
```

pnpm 的优势：依赖会提升到根目录，避免重复安装，节省磁盘空间。

---

## 六、实际使用流程

```bash
# 1. 安装依赖
cd monorepo
pnpm install

# 2. 启动开发（两个终端）
pnpm dev:app-a    # http://localhost:3001
pnpm dev:app-b    # http://localhost:3002

# 3. 构建所有包
pnpm build:all

# 4. 只构建某个包
pnpm --filter app-a build
```

---

## 七、Monorepo 工具对比

| 工具 | 特点 | 适用场景 |
|------|------|----------|
| **pnpm workspaces** | 轻量、高效、符号链接 | 推荐，大多数场景 |
| npm workspaces | npm 7+ 自带 | 已在用 npm 的项目 |
| lerna | 经典方案，版本管理 | 需要发包到 npm |
| turborepo | 构建缓存、并行执行 | 大型项目、CI 优化 |
| nx | 完整的构建系统 | 企业级项目 |

---

## 八、适合 Monorepo 的场景

### ✅ 适合

- 前端多应用（PC端 + 移动端 + 管理后台）
- 组件库 + 示例应用
- 微服务架构
- 共享工具库
- 同一产品的多个模块

### ❌ 不适合

- 项目间完全独立
- 技术栈差异大
- 团队规模极小且项目简单
- 需要独立部署和版本管理

---

## 九、常见问题

### Q：子包之间怎么互相引用？

```json
// app-a/package.json
"dependencies": {
  "shared": "workspace:*"
}
```

```javascript
// app-a/src/index.js
const { formatDate } = require('shared')
```

### Q：怎么只构建/测试某个包？

```bash
pnpm --filter app-a build
pnpm --filter app-a test
```

### Q：怎么添加新的子包？

1. 在 `packages/` 下创建新目录
2. 添加 `package.json`
3. 其他包如需依赖，添加 `"xxx": "workspace:*"`
4. 运行 `pnpm install`

### Q：workspace 协议有哪些版本？

```json
{
  "dependencies": {
    "shared": "workspace:*"      // 任意版本
    "shared": "workspace:~"      // ~1.0.0
    "shared": "workspace:^"      // ^1.0.0
    "shared": "workspace:1.0.0"  // 精确版本
  }
}
```

### Q：如何发布到 npm？

```json
{
  "dependencies": {
    "shared": "1.0.0"  // 发布时会替换 workspace:* 为实际版本
  }
}
```

---

## 十、进阶配置

### 1. 共享 tsconfig

```json
// tsconfig.base.json（根目录）
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true
  }
}
```

```json
// packages/app-a/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### 2. 共享 ESLint 配置

```json
// .eslintrc.js（根目录）
module.exports = {
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'warn'
  }
}
```

### 3. 使用 turborepo 加速构建

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false
    }
  }
}
```

```bash
# 安装 turborepo
pnpm add -Dw turbo

# 使用 turborepo 构建
pnpm turbo build
```

---

## 十一、CI/CD 集成

### GitHub Actions 示例

```yaml
# .github/workflows/build.yml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:all
      - run: pnpm -r test
```

---

## 十二、最佳实践

1. **保持依赖干净**：只在需要的包中添加依赖
2. **使用 workspace 协议**：本地引用使用 `workspace:*`
3. **共享配置**：tsconfig、eslint 等放在根目录
4. **明确的包边界**：每个包职责单一
5. **版本管理**：使用 changesets 或 lerna 管理版本
6. **CI 优化**：使用 turborepo 或 nx 的缓存功能
