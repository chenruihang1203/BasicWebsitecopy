# 1. 将基础镜像从 18 改为 20 (或者 22)
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制其余的应用代码
COPY . .

# 构建时的环境变量（用于公钥等）
ARG NEXT_PUBLIC_PUSHER_KEY=3b43f68c976d7b71fa42
ARG NEXT_PUBLIC_PUSHER_CLUSTER=ap3

# 设置为环境变量，以便 Next.js 构建时可以访问
ENV NEXT_PUBLIC_PUSHER_KEY=${NEXT_PUBLIC_PUSHER_KEY}
ENV NEXT_PUBLIC_PUSHER_CLUSTER=${NEXT_PUBLIC_PUSHER_CLUSTER}

# 2. 现在运行 build 就不会再报 Node 版本错误了
RUN npm run build

# 暴露 ModelScope 要求的端口
EXPOSE 7860

# 设置端口环境变量
ENV PORT=7860

# 启动应用
CMD ["npm", "start"]