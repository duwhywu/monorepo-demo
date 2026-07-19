# Git 上传与 CI/CD 指南

## 一、本地 Git 操作

### 1. 初始化仓库

```powershell
cd D:\code\codetest\nodejs_\demo-2\monorepo

# 初始化 Git
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "feat: 初始化 monorepo 项目"
```

### 2. 关联远程仓库

在 GitHub 上创建新仓库后：

```powershell
# 添加远程仓库
git remote add origin https://github.com/duwhywu/monorepo-demo.git

# 推送
git push -u origin main
```

### 3. 后续提交流程

```powershell
# 查看状态
git status

# 添加修改
git add .

# 提交
git commit -m "feat: 添加新功能"

# 推送
git push
```

---

## 二、CI/CD 概念

| 缩写 | 全称 | 含义 |
|------|------|------|
| **CI** | Continuous Integration | 持续集成：自动构建、测试 |
| **CD** | Continuous Deployment / Delivery | 持续部署/交付：自动发布上线 |

```
代码推送 → CI（构建+测试） → CD（部署到服务器） → 用户可访问
```

---

## 三、GitHub Actions 配置

### 免费额度

| 仓库类型 | 免费额度 |
|----------|----------|
| **公开仓库** | ✅ 完全免费，无限使用 |
| **私有仓库** | ✅ 每月 2000 分钟 |

### 1. 创建工作流文件

在项目根目录创建：

```
.github/
└── workflows/
    └── ci.yml
```

### 2. CI 配置（仅构建测试）

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 11
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build all packages
        run: pnpm build:all
```

---

## 四、CD 部署方案

### 方案对比

| 方案 | 适用场景 | 难度 | 费用 |
|------|----------|------|------|
| **GitHub Pages** | 静态网站、文档 | ⭐ 简单 | 免费 |
| **Vercel/Netlify** | 前端项目 | ⭐ 简单 | 免费额度 |
| **云服务器** | 自定义部署 | ⭐⭐⭐ 复杂 | 付费 |
| **Docker** | 容器化部署 | ⭐⭐ 中等 | 服务器费用 |

---

### 方案一：GitHub Pages（推荐静态项目）

#### 1. 创建部署配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]

# 设置权限
permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 11
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build:all
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./packages/app-a/dist

  deploy:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### 2. 启用 GitHub Pages

1. 打开仓库 **Settings** → **Pages**
2. Source 选择 **GitHub Actions**
3. 推送代码后自动部署

#### 3. 访问地址

```
https://duwhywu.github.io/monorepo-demo/
```

---

### 方案二：Vercel（推荐前端项目）

#### 1. 注册 Vercel

1. 打开 https://vercel.com
2. 用 GitHub 账号登录
3. 点击 **Import Project**
4. 选择 `monorepo-demo` 仓库

#### 2. 配置项目

```
Framework Preset: Other
Root Directory: packages/app-a
Build Command: pnpm build
Output Directory: dist
```

#### 3. 自动部署

- 每次推送代码，Vercel 自动部署
- 每个 PR 自动生成预览链接

---

### 方案三：部署到云服务器

#### 1. 服务器准备

```bash
# SSH 连接服务器
ssh root@你的服务器IP

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm
```

#### 2. 创建部署脚本

```bash
#!/bin/bash
# deploy.sh

# 拉取最新代码
cd /opt/monorepo-demo
git pull origin main

# 安装依赖
pnpm install --frozen-lockfile

# 构建
pnpm build:all

# 重启服务（如果用 PM2）
pm2 restart all
```

#### 3. GitHub Actions 自动部署

```yaml
# .github/workflows/deploy-server.yml
name: Deploy to Server

on:
  push:
    branches: [main, master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/monorepo-demo
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm build:all
```

#### 4. 配置 Secrets

在仓库 Settings → Secrets 中添加：

| 名称 | 说明 |
|------|------|
| `SERVER_HOST` | 服务器 IP |
| `SERVER_USER` | SSH 用户名 |
| `SERVER_SSH_KEY` | SSH 私钥 |

---

### 方案四：Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
# Dockerfile
FROM node:22-alpine

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/app-a/package.json ./packages/app-a/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 构建
RUN pnpm build:all

# 暴露端口
EXPOSE 3000

# 启动
CMD ["pnpm", "--filter", "app-a", "start"]
```

#### 2. 构建镜像

```bash
docker build -t monorepo-demo .
docker run -p 3000:3000 monorepo-demo
```

---

## 五、完整 CI/CD 流程示例

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD

on:
  push:
    branches: [main, master]

jobs:
  # CI：构建测试
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:all
      # - run: pnpm -r test  # 如果有测试

  # CD：部署到 GitHub Pages
  deploy:
    needs: ci
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:all
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./packages/app-a/dist
      - uses: actions/deploy-pages@v4
```

---

## 六、推送代码步骤

### 第一步：本地准备

```powershell
# 1. 进入项目目录
cd D:\code\codetest\nodejs_\demo-2\monorepo

# 2. 初始化 Git
git init

# 3. 创建 .gitignore（已创建）

# 4. 添加并提交
git add .
git commit -m "feat: 初始化 monorepo 项目"
```

### 第二步：创建远程仓库

1. 打开 https://github.com/new
2. 仓库名：`monorepo-demo`
3. 选择 **Public**（免费无限 CI/CD）
4. **不要**勾选初始化 README、.gitignore、许可证
5. 点击 **Create repository**

### 第三步：推送代码

```powershell
# 关联远程仓库
git remote add origin https://github.com/duwhywu/monorepo-demo.git

# 推送
git branch -M main
git push -u origin main
```

### 第四步：启用 GitHub Actions

1. 打开仓库页面
2. 点击 **Actions** 标签
3. 点击 **I understand my workflows, go ahead and enable them**
4. 之后每次推送都会自动运行 CI

---

## 四、查看 CI/CD 状态

### 推送后查看

```powershell
# 提交并推送
git add .
git commit -m "feat: 测试 CI"
git push
```

1. 打开 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 查看构建状态：
   - 🟢 绿色：成功
   - 🔴 红色：失败
   - 🟡 黄色：进行中

### 本地查看（需要安装 gh CLI）

```powershell
# 安装 GitHub CLI
winget install GitHub.cli

# 登录
gh auth login

# 查看工作流运行状态
gh run list
gh run view
```

---

## 七、常用 Git 命令

| 命令 | 说明 |
|------|------|
| `git init` | 初始化仓库 |
| `git add .` | 添加所有文件 |
| `git commit -m "msg"` | 提交 |
| `git push` | 推送到远程 |
| `git pull` | 拉取远程更新 |
| `git status` | 查看状态 |
| `git log --oneline` | 查看提交历史 |
| `git branch` | 查看分支 |
| `git checkout -b dev` | 创建并切换分支 |
| `git merge dev` | 合并分支 |

---

## 八、分支策略

### 简单策略（推荐小项目）

```
main      ← 稳定版本，自动部署
  └─ dev  ← 开发分支
```

### Git Flow（推荐中大型项目）

```
main       ← 生产环境
  └─ release ← 发布分支
develop    ← 开发主分支
  ├─ feature/login  ← 功能分支
  └─ feature/api    ← 功能分支
hotfix/xxx ← 紧急修复
```

### 操作示例

```powershell
# 创建开发分支
git checkout -b dev

# 在 dev 上开发
# ...

# 开发完成，合并到 main
git checkout main
git merge dev
git push

# 删除已合并的分支
git branch -d dev
```

---

## 九、CI/CD 进阶配置

### 1. 环境变量

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加：

```
DEPLOY_TOKEN=xxx
API_KEY=xxx
```

在 workflow 中使用：

```yaml
- name: Use secret
  run: echo "Token is ${{ secrets.DEPLOY_TOKEN }}"
```

### 2. 缓存依赖

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

### 3. 矩阵测试

```yaml
strategy:
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest, windows-latest]
```

### 4. 条件执行

```yaml
- name: Deploy
  if: github.ref == 'refs/heads/main'
  run: echo "只在 main 分支执行"
```

---

## 十、常见问题

### Q：推送被拒绝？

```powershell
# 如果远程有内容，先拉取
git pull origin main --allow-unrelated-histories
git push
```

### Q：如何撤销提交？

```powershell
# 撤销最近一次提交，保留修改
git reset --soft HEAD~1

# 撤销最近一次提交，丢弃修改
git reset --hard HEAD~1
```

### Q：如何修改提交信息？

```powershell
# 修改最近一次提交
git commit --amend -m "新的提交信息"
git push --force
```

### Q：CI 失败了怎么排查？

1. 查看 Actions 页面的错误日志
2. 本地运行相同的命令测试
3. 检查 package.json 中的脚本
4. 确认依赖是否正确安装

### Q：Gitee 仓库如何迁移到 GitHub？

```powershell
# 1. 在 GitHub 创建空仓库

# 2. 修改远程地址
git remote set-url origin https://github.com/duwhywu/monorepo-demo.git

# 3. 推送所有分支
git push -u origin --all
git push origin --tags
```

---

## 十一、完整流程示例

```powershell
# 1. 初始化
git init
git add .
git commit -m "feat: 初始化 monorepo"

# 2. 关联远程
git remote add origin https://github.com/duwhywu/monorepo-demo.git
git branch -M main
git push -u origin main

# 3. 开发新功能
git checkout -b feature/add-login
# ... 编写代码 ...
git add .
git commit -m "feat: 添加登录功能"
git push -u origin feature/add-login

# 4. 创建 PR 并合并
# 在 GitHub 上创建 Pull Request
# 审核通过后合并

# 5. 合并后自动触发 CI/CD
git checkout main
git pull
git branch -d feature/add-login
```

---

## 十二、GitHub vs Gitee 对比

| 功能 | GitHub | Gitee |
|------|--------|-------|
| 代码托管 | ✅ | ✅ |
| CI/CD | GitHub Actions | Gitee Go |
| 私有仓库 | ✅ 免费 | ✅ 免费 |
| 公开仓库 CI/CD | ✅ **完全免费** | ❌ 需付费 |
| 访问速度 | 国内较慢 | 国内快 |
| Actions 语法 | 原生 | 兼容 GitHub Actions |
| Pages 服务 | ✅ | ✅ |

### 推荐

- **个人项目/开源** → GitHub（CI/CD 免费）
- **企业内部/国内访问** → Gitee（速度快）
