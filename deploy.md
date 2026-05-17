# 陈氏家族族谱系统 — 云服务器部署方案

## 项目技术栈

- **前端**: Vue 3 + Vite + Element Plus + Pinia
- **后端**: Node.js + Express + MySQL (mysql2)
- **数据库**: MySQL 8.0, 数据库名 family_tree, 4张表 (users, members, photos, family_intro)
- **文件上传**: multer, 照片存 backend/uploads/

## 部署架构

```
用户浏览器
    ↓
云服务器 (80端口)
    ↓
Nginx 容器 (frontend)
    ├── /          → Vue 静态文件
    ├── /api/      → 反向代理到 backend:3000/api/
    ├── /uploads/  → 反向代理到 backend:3000/uploads/
    ↓
Backend 容器 (3000端口)
    ↓
MySQL 容器 (3306端口, 仅容器内网络可访问)
```

所有服务通过 Docker Compose 编排，一个命令启动全部。

---

## 一、云服务器准备

### 1.1 购买云服务器

推荐配置：
- **腾讯云/阿里云**轻量应用服务器或CVM
- **2核4G**起步（1核2G也能跑，但数据库压力大时会卡）
- **系统**: CentOS 7/8（本文档基于 CentOS 编写）
- **磁盘**: 50GB SSD（数据库+照片会逐渐增长）
- **带宽**: 3Mbps以上

> 云服务器**无需安装 MySQL**，数据库跑在 Docker 容器内，宿主机零依赖。

### 1.2 安全组/防火墙开放端口

| 端口 | 用途 | 来源 |
|------|------|------|
| 80 | HTTP 网站访问 | 0.0.0.0/0 (全网) |
| 22 | SSH 管理 | 仅你的IP |

**3306端口不要对外开放**，数据库只在 Docker 内部网络通信。

### 1.3 安装 Docker 和 Docker Compose（CentOS）

```bash
# SSH 登录云服务器后执行

# CentOS 7 需要先更新系统
sudo yum update -y

# CentOS 8 / Rocky Linux / AlmaLinux 用 dnf
# sudo dnf update -y

# ---- 安装 Docker ----

# CentOS 7: 使用官方 yum 源安装
sudo yum install -y yum-utils
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# CentOS 8 / Rocky / Alma: 使用 dnf
# sudo dnf install -y yum-utils
# sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# sudo dnf install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker 并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# ---- 安装 Docker Compose V2 ----

# Docker Compose V2 是 docker cli 的插件，docker-ce-cli 已包含
# 验证是否可用：
docker compose version

# 如果提示 "docker compose" 不存在，手动安装插件：
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 再次验证
docker compose version

# ---- CentOS 7 防火墙设置 ----

# CentOS 7 默认用 firewalld，需开放端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload

# 查看已开放端口
sudo firewall-cmd --list-ports

# CentOS 8 用 nftables，一般云服务商安全组已处理
# 如果用的是 firewalld，同上操作
```

---

## 二、上传项目到云服务器

### 2.1 方式一：直接 SCP 上传（推荐）

在本地 WSL 中执行：

```bash
# 打包项目（排除 node_modules）
cd /mnt/d/陈氏家族族谱_dev
tar czf family_tree_project.tar.gz \
  --exclude='frontend/node_modules' \
  --exclude='backend/node_modules' \
  .

# 上传到云服务器
scp family_tree_project.tar.gz root@你的服务器IP:/root/

# SSH 登录服务器解压
ssh root@你的服务器IP
cd /root
tar xzf family_tree_project.tar.gz -C family_tree_project
mv family_tree_project /opt/chen-family-tree
```

### 2.2 方式二：Git 仓库（适合持续更新）

```bash
# 在 GitHub/Gitee 创建私有仓库，推送代码
# 在云服务器上 clone

ssh root@你的服务器IP
cd /opt
git clone https://github.com/你的用户名/陈氏家族族谱_dev.git chen-family-tree
```

---

## 三、数据库迁移

### 3.1 从本地导出数据

在本地 WSL 中执行：

```bash
# 导出本地 family_tree 数据库的数据（不含建表语句，数据由 init-db 自动建表）
mysqldump -h 172.26.96.1 -u root -pcbj625629 \
  --no-create-info \
  --complete-insert \
  --skip-add-locks \
  family_tree users members photos family_intro \
  > /mnt/d/陈氏家族族谱_dev/deploy/init-db/02_data.sql
```

**重要**: `--no-create-info` 确保不输出建表语句（01_schema.sql已包含），`--complete-insert` 写出列名避免顺序问题。

如果 mysqldump 不可用，可用 Python 脚本导出：

```bash
# 在 WSL 中用 pip 安装
pip install pymysql

# 运行导出脚本（见下方 3.2）
```

### 3.2 Python 导出脚本（备选方案）

如果本地没有 mysqldump，在 WSL 中创建并运行：

```python
import pymysql
import json

conn = pymysql.connect(
    host='172.26.96.1', port=3306,
    user='root', password='cbj625629',
    database='family_tree', charset='utf8mb4'
)

tables = ['users', 'members', 'photos', 'family_intro']
output = []

for table in tables:
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table}")
    cols = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    if rows:
        for row in rows:
            values = []
            for v in row:
                if v is None:
                    values.append('NULL')
                elif isinstance(v, (int, float)):
                    values.append(str(v))
                elif isinstance(v, bytes):
                    values.append(f"X'{v.hex()}'")
                else:
                    escaped = str(v).replace("'", "\\'").replace("\\", "\\\\")
                    values.append(f"'{escaped}'")
            
            output.append(f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(values)});")
    cursor.close()

conn.close()

with open('deploy/init-db/02_data.sql', 'w', encoding='utf-8') as f:
    f.write('-- 自动导出的数据迁移文件\n\n')
    f.write('\n'.join(output))
```

### 3.3 照片文件迁移

```bash
# 上传照片文件到服务器
scp -r /mnt/d/陈氏家族族谱_dev/backend/uploads/* \
  root@你的服务器IP:/opt/chen-family-tree/backend/uploads/
```

照片文件不随 Docker 构建打包，而是通过 volume 挂载，所以需要在首次启动前手动放到 uploads 目录。

**或者**，在 docker-compose 启动后，将照片复制到 Docker volume 中：

```bash
# 先启动服务
cd /opt/chen-family-tree
docker compose up -d

# 找到 upload_data volume 在服务器上的路径
docker volume inspect chen-family-tree_upload_data

# 复制照片到 volume
sudo cp backend/uploads/* /var/lib/docker/volumes/chen-family-tree_upload_data/_data/
```

---

## 四、配置与启动

### 4.1 创建环境变量文件

```bash
cd /opt/chen-family-tree

# 复制示例配置
cp deploy/.env.example .env

# 编辑 .env，设置强密码
nano .env
```

`.env` 内容示例：

```env
DB_ROOT_PASSWORD=ChenFamily2024!StrongPwd
JWT_SECRET=chen_family_jwt_secret_at_least_32_characters_long
```

### 4.2 启动所有服务

```bash
cd /opt/chen-family-tree
docker compose up -d --build
```

首次启动流程：
1. MySQL 容器启动 → 自动执行 `deploy/init-db/01_schema.sql`（建表）→ 自动执行 `02_data.sql`（导入数据）
2. Backend 容器启动 → 连接 MySQL → 提供API服务
3. Frontend 容器启动 → Nginx 提供静态文件 + 反向代理

### 4.3 验证部署

```bash
# 检查所有容器状态
docker compose ps

# 应看到 3 个容器都是 running/healthy

# 测试 API
curl http://你的服务器IP/api/health
# 应返回: {"status":"ok","message":"服务运行正常"}

# 浏览器访问
# 打开 http://你的服务器IP → 应看到族谱系统首页

# 测试登录
# 用户名: admin  密码: admin123
```

---

## 五、域名绑定（可选但推荐）

### 5.1 购买域名

在腾讯云/阿里云购买域名（如 `chen-family.cn`），解析到服务器IP。

### 5.2 HTTPS 配置（推荐）

```bash
# 安装 certbot（CentOS）
# CentOS 7:
sudo yum install -y certbot
# CentOS 8 / Rocky / Alma:
# sudo dnf install -y certbot

# 获取证书（Nginx 在 Docker 中，用 standalone 模式）
# 先临时停止前端容器释放80端口
docker compose stop frontend

# 获取证书
sudo certbot certonly --standalone -d chen-family.cn

# 重新启动前端
docker compose start frontend
```

然后修改 `deploy/nginx/default.conf`：

```nginx
server {
    listen 80;
    server_name chen-family.cn;
    return 301 https://$host$request_uri;  # HTTP 重定向到 HTTPS
}

server {
    listen 443 ssl;
    server_name chen-family.cn;

    ssl_certificate /etc/letsencrypt/live/chen-family.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chen-family.cn/privkey.pem;

    # ... 原有的 location 配置不变
}
```

在 `docker-compose.yml` 的 frontend 服务中挂载证书：

```yaml
volumes:
  - ./deploy/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
  - /etc/letsencrypt:/etc/letsencrypt:ro  # 挂载证书
ports:
  - "80:80"
  - "443:443"  # 新增 HTTPS 端口
```

---

## 六、日常运维

### 6.1 常用命令

```bash
# 查看日志
docker compose logs -f              # 所有服务日志
docker compose logs -f backend      # 仅后端日志
docker compose logs -f mysql        # 仅数据库日志

# 重启某个服务
docker compose restart backend

# 重新构建并部署（代码更新后）
docker compose up -d --build

# 停止所有服务
docker compose down

# 停止并清除数据（危险！会删除数据库和照片volume）
docker compose down -v

# 进入 MySQL 容器执行 SQL
docker compose exec mysql mysql -u root -pChenFamily2024!StrongPwd family_tree

# 进入 Backend 容器调试
docker compose exec backend sh
```

### 6.2 数据库备份

```bash
# 定期备份（建议每天）
docker compose exec mysql mysqldump -u root -pChenFamily2024!StrongPwd \
  family_tree > backup_$(date +%Y%m%d).sql

# 设置自动备份 cron
crontab -e
# 添加: 0 2 * * * cd /opt/chen-family-tree && docker compose exec -T mysql mysqldump -u root -pChenFamily2024!StrongPwd family_tree > /opt/backups/family_tree_$(date +\%Y\%m\%d).sql
```

### 6.3 更新代码部署

```bash
# Git 方式
cd /opt/chen-family-tree
git pull
docker compose up -d --build

# 手动更新方式
# 本地修改代码 → 重新打包上传 → 重新构建
```

---

## 七、项目文件清单

部署相关新增文件：

| 文件 | 说明 |
|------|------|
| `docker-compose.yml` | Docker Compose 主编排文件 |
| `backend/Dockerfile` | 后端容器构建文件 |
| `frontend/Dockerfile` | 前端构建+Nginx部署（两阶段） |
| `deploy/nginx/default.conf` | Nginx 反向代理配置 |
| `deploy/init-db/01_schema.sql` | 数据库建表脚本（自动执行） |
| `deploy/init-db/02_data.sql` | 数据迁移脚本（需手动导出填充） |
| `deploy/.env.example` | 环境变量示例 |

已修改的源文件：
| 文件 | 修改说明 |
|------|------|
| `frontend/src/utils/request.js` | baseURL 默认改为 `/api`，生产环境用相对路径；getServerBaseURL() 适配同源部署 |

---

## 八、完整部署步骤总结

```
1. 购买云服务器（2核4G CentOS 7/8）
2. 云服务商安全组开放 80/22 端口 + CentOS 防火墙开放 80/tcp
3. SSH 登录，安装 Docker + Docker Compose（yum/dnf 安装 docker-ce）
4. 本地导出数据库数据 → 生成 deploy/init-db/02_data.sql
5. 打包项目上传到服务器 /opt/chen-family-tree/
6. 复制照片文件到 backend/uploads/
7. 创建 .env（从 .env.example 复制，填写强密码）
8. docker compose up -d --build
9. 浏览器访问 http://服务器IP 验证
10.（可选）绑定域名 + HTTPS
```