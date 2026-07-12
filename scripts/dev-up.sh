#!/usr/bin/env bash
# ============================================
# Mix Space LTS - 开发环境一键启动（幂等）
# ============================================
# 使用方法:
#   ./scripts/dev-up.sh           # 启动服务 + 首次初始化数据
#   ./scripts/dev-up.sh           # 再次运行：跳过已存在的数据
#   ./scripts/dev-up.sh --reset   # 强制清理并重新初始化数据
#
# 步骤:
#   1. 写入 .env 开发环境变量
#   2. 启动 Docker 中的 MongoDB & Redis
#   3. 等待服务就绪
#   4. 初始化测试数据（幂等：已有数据则跳过）
#   5. 提示启动开发服务器
# ============================================

set -e

RESET_FLAG=""
if [[ "${1:-}" == "--reset" ]]; then
  RESET_FLAG="--force"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Mix Space LTS - 开发环境启动"
echo "================================"
echo ""

# ---- 0. 写入 .env ----
ENV_FILE="$PROJECT_DIR/.env"
TEMPLATE="$PROJECT_DIR/.env.dev.example"
if [[ -n "$RESET_FLAG" ]]; then
  echo "⚙️  写入 .env（强制覆盖）..."
  cp "$TEMPLATE" "$ENV_FILE"
elif [[ ! -f "$ENV_FILE" ]]; then
  echo "⚙️  写入 .env..."
  cp "$TEMPLATE" "$ENV_FILE"
else
  echo "⚙️  .env 已存在，跳过写入。"
fi

# ---- 1. 启动 Docker 服务 ----
echo "🐳 启动 Docker 服务 (MongoDB + Redis)..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.dev.yml up -d

# ---- 2. 等待服务就绪 ----
echo ""
echo "⏳ 等待服务就绪..."
echo "   等待 MongoDB..."
until docker exec mx-dev-mongo mongosh --quiet --eval "db.adminCommand('ping')" &>/dev/null; do
  sleep 1
done
echo "   ✅ MongoDB 就绪"

echo "   等待 Redis..."
until docker exec mx-dev-redis redis-cli ping &>/dev/null; do
  sleep 1
done
echo "   ✅ Redis 就绪"

# ---- 3. 初始化测试数据 ----
echo ""
if [[ -n "$RESET_FLAG" ]]; then
  echo "🌱 初始化测试数据（强制模式）..."
else
  echo "🌱 初始化测试数据（如已存在则跳过）..."
fi
node "$PROJECT_DIR/scripts/seed-dev-data.mjs" $RESET_FLAG

# ---- 4. 完成 ----
echo ""
echo "================================"
echo "✅ 开发环境已就绪！"
echo ""
echo "启动后端开发服务器："
echo "  cd $PROJECT_DIR/apps/core"
echo "  pnpm dev"
echo ""
echo "或从项目根目录："
echo "  cd $PROJECT_DIR"
echo "  pnpm dev"
echo ""
echo "停止 Docker 服务："
echo "  cd $PROJECT_DIR"
echo "  docker compose -f docker-compose.dev.yml down"
echo "================================"
