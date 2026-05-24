#!/bin/bash
# Mix Space Core 开发启动脚本

cd "$(dirname "$0")"

# 加载 dotenv 并启动
node -e "require('C:/Users/User/Documents/Projects/mix-space/core/node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/main.js').config(); const { startMain } = require('./apps/core/out/main.mjs'); startMain()"