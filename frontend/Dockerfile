# 阶段1: 构建前端
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# 构建时传入 API 地址
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# 阶段2: Nginx 部署
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 配置通过 docker-compose volumes 挂载，不在此处 COPY
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]