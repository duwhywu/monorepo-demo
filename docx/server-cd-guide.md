# 云服务器 CD 部署配置指南

## 一、流程图

```
你推送代码 → GitHub Actions（免费）→ SSH 连接服务器 → 自动部署
```

---

## 二、服务器端配置

### 1. 连接服务器

用 XShell 连接你的服务器：

```bash
ssh root@你的服务器IP
```

### 2. 安装 Node.js 22

```bash
# 安装 Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v    # 应显示 v22.x.x
npm -v     # 应显示版本号
```

### 3. 安装 pnpm

```bash
# 安装 pnpm
npm install -g pnpm

# 验证
pnpm -v    # 应显示版本号
```

### 4. 创建项目目录

```bash
# 创建目录
mkdir -p /opt/monorepo-demo
cd /opt/monorepo-demo

# 初始化 Git（克隆仓库）
git clone https://github.com/duwhywu/monorepo-demo.git .

# 安装依赖
pnpm install

# 构建测试
pnpm build:all
```

### 5. 创建部署脚本

```bash
# 创建脚本文件
cat > /opt/monorepo-demo/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "=== 开始部署 ==="

cd /opt/monorepo-demo

# 拉取最新代码
echo "拉取代码..."
git pull origin main

# 安装依赖
echo "安装依赖..."
pnpm install --frozen-lockfile

# 构建
echo "构建项目..."
pnpm build:all

echo "=== 部署完成 ==="
EOF

# 添加执行权限
chmod +x /opt/monorepo-demo/deploy.sh
```

### 6. 测试部署脚本

```bash
# 手动运行一次测试
/opt/monorepo-demo/deploy.sh
```

---

## 三、GitHub 配置

### 1. 生成 SSH 密钥（在服务器上）

```bash
# 在服务器上生成密钥
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy -N ""

# 查看公钥（需要添加到服务器的 known_hosts）
cat ~/.ssh/github_deploy.pub

# 查看私钥（需要添加到 GitHub Secrets）
cat ~/.ssh/github_deploy
```

### 2. 配置服务器 SSH

```bash
# 将公钥添加到 authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# 设置权限
chmod 600 ~/.ssh/authorized_keys
```

### 3. 获取服务器 IP

```bash
# 查看服务器公网 IP
curl ifconfig.me
```

### 4. 在 GitHub 添加 Secrets

打开仓库 **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

添加以下 Secrets：

| 名称 | 值 | 说明 |
|------|-----|------|
| `SERVER_HOST` | `你的服务器IP` | 如 `123.45.67.89` |
| `SERVER_USER` | `root` | SSH 用户名 |
| `SERVER_SSH_KEY` | 私钥内容 | 用 `cat ~/.ssh/github_deploy` 获取的完整内容 |

**注意**：SSH_KEY 需要包含完整的私钥，包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`

---

## 四、创建 GitHub Actions 工作流

在项目根目录创建：

```
.github/
└── workflows/
    └── deploy.yml
```

### deploy.yml 内容

```yaml
name: Deploy to Server

# 触发条件：推送到 master 分支
on:
  push:
    branches: [master]

jobs:
  # CI：构建测试
  ci:
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

  # CD：部署到服务器
  deploy:
    needs: ci
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
            
            # 拉取最新代码
            echo "拉取代码..."
            git pull origin master
            
            # 安装依赖
            echo "安装依赖..."
            pnpm install --frozen-lockfile
            
            # 构建
            echo "构建项目..."
            pnpm build:all
            
            echo "部署完成！"
```

---

## 五、完整操作步骤

### 步骤 1：服务器端

```bash
# 连接服务器
ssh root@你的服务器IP

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 创建项目目录
mkdir -p /opt/monorepo-demo
cd /opt/monorepo-demo

# 克隆仓库
git clone https://github.com/duwhywu/monorepo-demo.git .

# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy -N ""

# 配置 SSH
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 测试安装
pnpm install
pnpm build:all
```

### 步骤 2：GitHub 网页

1. 打开仓库 **Settings** → **Secrets** → **Actions**
2. 添加三个 Secret：
   - `SERVER_HOST`：你的服务器 IP
   - `SERVER_USER`：`root`
   - `SERVER_SSH_KEY`：用 `cat ~/.ssh/github_deploy` 获取的私钥内容

### 步骤 3：本地推送代码

```powershell
# 创建 deploy.yml 文件后
git add .
git commit -m "ci: 添加服务器部署配置"
git push
```

---

## 六、验证部署

### 推送后查看

1. 打开 GitHub 仓库 **Actions** 标签
2. 查看工作流是否运行成功
3. 绿色 ✅ 表示部署成功

### 服务器验证

```bash
# SSH 连接服务器
ssh root@你的服务器IP

# 查看项目状态
cd /opt/monorepo-demo
git log --oneline -1    # 查看最新提交
ls dist/                # 查看构建产物
```

---

## 七、常见问题

### Q：SSH 连接失败？

```bash
# 检查 SSH 配置
cat ~/.ssh/authorized_keys

# 检查 SSH 服务
sudo systemctl status sshd

# 测试本地 SSH
ssh -i ~/.ssh/github_deploy root@localhost
```

### Q：Git pull 失败？

```bash
# 手动拉取测试
cd /opt/monorepo-demo
git pull origin master

# 如果报错，检查 Git 配置
git config --global --add safe.directory /opt/monorepo-demo
```

### Q：权限错误？

```bash
# 设置目录权限
chmod -R 755 /opt/monorepo-demo
chown -R root:root /opt/monorepo-demo
```

### Q：如何回滚？

```bash
# SSH 到服务器
ssh root@你的服务器IP

cd /opt/monorepo-demo

# 查看历史提交
git log --oneline -10

# 回滚到指定版本
git checkout <commit-id>
pnpm install
pnpm build:all
```

---

## 八、流程总结

```
本地修改代码
    ↓
git push 推送到 GitHub
    ↓
GitHub Actions 自动运行
    ↓
┌─────────────────────────────────┐
│  CI 阶段（免费）                 │
│  1. 下载代码                    │
│  2. 安装 Node.js + pnpm         │
│  3. 安装依赖                    │
│  4. 构建项目                    │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  CD 阶段（免费）                 │
│  1. SSH 连接你的服务器           │
│  2. git pull 拉取最新代码        │
│  3. pnpm install 安装依赖        │
│  4. pnpm build:all 构建          │
└─────────────────────────────────┘
    ↓
部署完成，服务器运行最新代码
```
