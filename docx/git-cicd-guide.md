# Git 上传与 CI/CD 指南（Gitee 版）

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

在 Gitee 上创建新仓库后：

```powershell
# 添加远程仓库
git remote add origin https://gitee.com/duwhywu/monorepo-demo.git

# 推送
git push -u origin master
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

## 二、Gitee CI/CD（Gitee Go）

Gitee 提供了 **Gitee Go** 来实现 CI/CD，配置方式类似 GitHub Actions。

### 1. 创建工作流文件

在项目根目录创建：

```
.gitee/
└── workflows/
    └── ci.yml
```

### 2. CI 配置示例

```yaml
# .gitee/workflows/ci.yml
name: CI/CD

# 触发条件：推送或 PR 到 master 分支
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  # 测试任务
  test:
    runs-on: ubuntu-latest
    
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
      
      - name: Build all packages
        run: pnpm build:all
      
      # 如果有测试脚本，取消注释
      # - name: Run tests
      #   run: pnpm -r test
```

---

## 三、操作步骤

### 第一步：本地准备

```powershell
# 1. 进入项目目录
cd D:\code\codetest\nodejs_\demo-2\monorepo

# 2. 初始化 Git（已完成）
# git init

# 3. 创建 .gitignore（已创建）

# 4. 添加并提交
git add .
git commit -m "feat: 初始化 monorepo 项目"
```

### 第二步：创建远程仓库

1. 打开 https://gitee.com/new
2. 仓库名：`monorepo-demo`
3. 选择 **公开** 或 **私有**
4. **不要**勾选初始化 README、.gitignore、许可证
5. 点击 **创建**

### 第三步：推送代码

```powershell
# 关联远程仓库
git remote add origin https://gitee.com/duwhywu/monorepo-demo.git

# 推送
git push -u origin master
```

### 第四步：启用 Gitee CI/CD

1. 打开仓库页面
2. 点击 **流水线** 或 **CI/CD** 标签
3. 点击 **启用流水线功能**
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

1. 打开 Gitee 仓库页面
2. 点击 **流水线** 标签
3. 查看构建状态：
   - 🟢 绿色：成功
   - 🔴 红色：失败
   - 🟡 黄色：进行中

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
master    ← 稳定版本，自动部署
  └─ dev  ← 开发分支
```

### Git Flow（推荐中大型项目）

```
master     ← 生产环境
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

# 开发完成，合并到 master
git checkout master
git merge dev
git push

# 删除已合并的分支
git branch -d dev
```

---

## 七、CI/CD 进阶配置

### 1. 环境变量

在 Gitee 仓库的 **设置 → 管理 → 仓库设置 → 环境变量** 中添加：

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

### 3. 条件执行

```yaml
- name: Deploy
  if: github.ref == 'refs/heads/master'
  run: echo "只在 master 分支执行"
```

---

## 八、常见问题

### Q：推送被拒绝？

```powershell
# 如果远程有内容，先拉取
git pull origin master --allow-unrelated-histories
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

1. 查看流水线页面的错误日志
2. 本地运行相同的命令测试
3. 检查 package.json 中的脚本
4. 确认依赖是否正确安装

### Q：如何删除远程分支？

```powershell
# 删除远程分支
git push origin --delete dev
```

---

## 九、完整流程示例

```powershell
# 1. 初始化
git init
git add .
git commit -m "feat: 初始化 monorepo"

# 2. 关联远程
git remote add origin https://gitee.com/duwhywu/monorepo-demo.git
git push -u origin master

# 3. 开发新功能
git checkout -b feature/add-login
# ... 编写代码 ...
git add .
git commit -m "feat: 添加登录功能"
git push -u origin feature/add-login

# 4. 创建 PR 并合并
# 在 Gitee 上创建 Pull Request
# 审核通过后合并

# 5. 合并后自动触发 CI/CD
git checkout master
git pull
git branch -d feature/add-login
```

---

## 十、Gitee vs GitHub 对比

| 功能 | Gitee | GitHub |
|------|-------|--------|
| 代码托管 | ✅ | ✅ |
| CI/CD | Gitee Go | GitHub Actions |
| 私有仓库 | ✅ 免费 | ✅ 免费 |
| 访问速度 | 国内快 | 国内较慢 |
| Actions 语法 | 兼容 GitHub Actions | 原生 |
| Pages 服务 | ✅ | ✅ |
| Packages | ❌ | ✅ |

---

## 十一、从 GitHub 迁移到 Gitee

如果你之前用 GitHub，现在想迁移到 Gitee：

```powershell
# 1. 修改远程仓库地址
git remote set-url origin https://gitee.com/duwhywu/monorepo-demo.git

# 2. 推送所有分支和标签
git push -u origin --all
git push origin --tags

# 3. 验证
git remote -v
```
