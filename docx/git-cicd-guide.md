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

## 二、GitHub Actions CI/CD（免费）

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

### 2. CI 配置示例

```yaml
# .github/workflows/ci.yml
name: CI/CD

# 触发条件：推送或 PR 到 main 分支
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # 测试任务
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build all packages
        run: pnpm build:all
      
      # 如果有测试脚本，取消注释
      # - name: Run tests
      #   run: pnpm -r test

  # 部署任务（可选）
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build:all
      
      # 部署到 GitHub Pages（示例）
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/app-a/dist
```

---

## 三、操作步骤

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

## 五、常用 Git 命令

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

## 六、分支策略

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

## 七、CI/CD 进阶配置

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

## 八、常见问题

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

## 九、完整流程示例

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

## 十、GitHub vs Gitee 对比

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
