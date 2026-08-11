#!/usr/bin/env bash
# Neon に work-loop ブランチを作り、接続文字列を表示する。
# 使い方:
#   export NEON_API_KEY='...'
#   ./scripts/create-work-loop-neon-branch.sh
#
# 接続文字列は画面に出すだけ。.env には自動書き込みしない（誤上書き防止）。

set -euo pipefail

PROJECT_ID="${NEON_PROJECT_ID:-rough-paper-90336948}"
BRANCH_NAME="${NEON_WORK_LOOP_BRANCH:-work-loop}"

if [[ -z "${NEON_API_KEY:-}" ]]; then
  echo "NEON_API_KEY が未設定です。"
  echo "https://console.neon.tech/app/settings/api-keys で作成し、export してから再実行してください。"
  exit 1
fi

echo "Project: $PROJECT_ID"
echo "Creating branch: $BRANCH_NAME (if missing)"

EXISTING="$(npx --yes neonctl branches list --project-id "$PROJECT_ID" -o json 2>/dev/null || true)"
if echo "$EXISTING" | grep -q "\"name\"[[:space:]]*:[[:space:]]*\"$BRANCH_NAME\""; then
  echo "Branch '$BRANCH_NAME' already exists."
else
  npx --yes neonctl branches create \
    --project-id "$PROJECT_ID" \
    --name "$BRANCH_NAME" \
    -o json
  echo "Branch created."
fi

echo
echo "=== Connection URI (pooled) ==="
npx --yes neonctl connection-string "$BRANCH_NAME" \
  --project-id "$PROJECT_ID" \
  --pooled

echo
echo "=== Connection URI (direct / unpooled) ==="
npx --yes neonctl connection-string "$BRANCH_NAME" \
  --project-id "$PROJECT_ID" || true

echo
echo "次:"
echo "1) 上記 URI を Vercel work-loop の DATABASE_URL に設定"
echo "2) ローカル .env.local の DATABASE_URL を work-loop ブランチへ切替"
echo "3) npm run db:push"
