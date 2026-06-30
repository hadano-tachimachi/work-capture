# Work Capture

> **思考を止めずに、仕事を前へ進める。**

スマホで思考を預け、AIが構造化し、PCの Inbox Zero で仕事として確定する Web アプリケーションです。

## 技術スタック

- Next.js (App Router)
- shadcn/ui + Tailwind CSS
- Neon PostgreSQL + Drizzle ORM
- Gemini API（文字起こし・AI構造化）
- Zod バリデーション

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数（任意）

`.env.local` がなくても **開発モードで動作します**（ローカル SQLite + モックAI）。

本番同等の動作を試す場合のみ設定してください:

```bash
cp .env.example .env.local
```

- `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/) で取得
- `DATABASE_URL` — [Neon](https://neon.tech/) の PostgreSQL 接続文字列

| 設定 | 未設定時（開発） | 設定時 |
|------|------------------|--------|
| DATABASE_URL | `.data/work-capture.db`（SQLite） | Neon PostgreSQL |
| GEMINI_API_KEY | モックAI（簡易構造化） | Gemini 本番API |

### 3. データベースマイグレーション

Neon の SQL エディタで `drizzle/0000_init.sql` を実行するか:

```bash
npm run db:push
```

### 4. 開発サーバー起動

```bash
npm run dev
```

- スマホ（またはモバイルUA）: http://localhost:3000/capture
- PC: http://localhost:3000/inbox

## 主な画面

| パス | 説明 |
|------|------|
| `/capture` | SP録音画面（起動直後） |
| `/capture/review/[id]` | AI解析結果確認 |
| `/inbox` | PC Inbox Zero（2ペイン） |

## 設計原則

> **AIは候補を作る。プログラムが検証する。人間が確定する。**

詳細は親ディレクトリの設計ドキュメントを参照してください。
