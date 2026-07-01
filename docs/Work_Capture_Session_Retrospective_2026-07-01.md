# Work Capture 実装セッション振り返り（2026-07-01）

> **目的:** この日に行った実装・UI 改善・デプロイ作業の流れを、後から振り返れるように整理したメモ。  
> **対象:** MVP 完成後〜本番デプロイ〜 UI Brush UP までの一連の作業。

---

## 1. このセッションでやったこと（概要）

| カテゴリ | 内容 |
|---------|------|
| **本番環境** | Vercel + Neon PostgreSQL 連携、GitHub push による自動デプロイ |
| **AI** | マルチプロバイダー抽象化（Gemini / OpenAI / Claude）、Gemini モデル変更 |
| **SP UI** | Capture 画面レイアウト、Bottom Sheet 余白、音声入力、日付ピッカー |
| **Inbox UI** | SP 2 画面構成、PC 2 カラム化、確定フォーム改善 |
| **共通 UI** | Button / Input / Select のタップ領域を一括拡大 |
| **デプロイ** | Root Directory 未設定によるビルド失敗を特定・手順化 |

---

## 2. タイムライン

```text
Phase A — 本番・AI 基盤
  ├─ Vercel + Neon 連携
  ├─ 環境変数（GEMINI_API_KEY 等）を Vercel CLI で登録
  └─ AI プロバイダー抽象化 + ブラウザ文字起こしパイプライン
       commit: e823cf3

Phase B — UI / UX 改善（大きな塊）
  ├─ SP Inbox: 一覧 → 詳細の 2 画面（案 A）
  ├─ PC Inbox: 3 カラム → 2 カラム（左一覧 + 右詳細）
  ├─ 日付ピッカー（DeadlinePicker, calendar.tsx）
  ├─ 音声入力（SpeechInput / SpeechTextarea）
  ├─ 検証失敗バナーの dismiss（localStorage）
  ├─ Edit Sheet 共通レイアウト（edit-sheet-layout.tsx）
  └─ Gemini モデル → gemini-3.1-flash-lite
       commit: b73a3bb

Phase C — 細部 UI + 全体統一
  ├─ Inbox 説明 Bottom Sheet の余白修正
  ├─ Capture 画面: マイク中央配置、フッター太さ
  ├─ Button / Input / Select デフォルト高さの一括変更
  └─ push → Vercel 自動デプロイ（Root Directory 要確認）
       commit: 9cde41d
```

---

## 3. Git コミット履歴（本セッション分）

| コミット | 内容 |
|---------|------|
| `62892c7` | 初回コミット |
| `e823cf3` | AI プロバイダー抽象化とブラウザ文字起こしパイプライン |
| `b73a3bb` | Inbox・Capture UI 改善と Gemini 3.1 Flash Lite への更新 |
| `9cde41d` | Button・Input・Select のデフォルト高さを一括で拡大 |

**リポジトリ:** https://github.com/hadano-tachimachi/work-capture  
**本番 URL:** https://work-capture.vercel.app

---

## 4. リポジトリ構成（デプロイでハマったポイント）

GitHub 上の構成:

```text
（リポジトリ root）
├── docs/
└── work-capture/     ← Next.js アプリ本体（src/app など）
```

ローカル開発は `work-capture/` で `npm run dev` するが、  
Vercel が **リポジトリ root** で `next build` すると `app` ディレクトリが見つからず失敗する。

**エラーメッセージ:**

```text
Error: Couldn't find any `pages` or `app` directory.
Please create one under the project root
```

---

## 5. 作業別の詳細

### 5-1. 本番デプロイ（Vercel + Neon）

#### 手順（実施済み）

1. GitHub に `hadano-tachimachi/work-capture` を push
2. Vercel でプロジェクト作成・GitHub 連携
3. Neon PostgreSQL を Vercel Integration で接続 → `DATABASE_URL` 自動注入
4. Vercel CLI で API キーを Production / Development に登録
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY`（任意）
5. push → 自動デプロイ

#### 注意点

- `.env.local` は Vercel と**自動同期されない**（ローカル専用）
- `.gitignore` に `.env*.local` を追加済み

---

### 5-2. AI プロバイダー抽象化

#### やったこと

- `src/lib/ai/providers/` に Gemini / OpenAI / Claude を分離
- UI でプロバイダー切替（アイコン付きセレクター）
- ブラウザ側 Web Speech API でライブ文字起こし → サーバーへ transcript 送信
- `/api/ai/providers` で利用可能プロバイダー一覧を返却

#### モデル設定（`config.ts`）

| プロバイダー | モデル ID |
|-------------|-----------|
| Gemini | `gemini-3.1-flash-lite` |
| OpenAI | `gpt-4o-mini` |
| Claude | `claude-3-5-haiku-latest` |

#### 悩んだこと: Gemini モデル名

- 希望: `gemini-3.5-flash-lite`
- **Google API には存在しない**（2026-07 時点）
- Lite 系の公式 ID は `gemini-3.1-flash-lite`
- 高性能 3.5 系なら `gemini-3.5-flash`（Lite ではない）

**教訓:** モデル名は公式ドキュメントで ID を確認してから `config.ts` に書く。

---

### 5-3. Inbox UI 改善

#### SP（案 A: 2 画面）

```text
一覧画面（カードリスト）
  │ タップ
  ▼
詳細画面（確定フォーム）
  │ ← 戻る
  ▼
一覧画面
```

- `use-is-mobile.ts` で SP / PC 分岐
- コンポーネント: `inbox-capture-card.tsx`, `inbox-detail-content.tsx` 等

#### PC（案 3 → 2 カラム）

```text
┌──────────────┬─────────────────────────┐
│  左: 一覧     │  右: 詳細 + 確定フォーム   │
│  （sticky）   │  （原文折りたたみ可）      │
└──────────────┴─────────────────────────┘
```

- 3 カラムは情報過多 → 2 カラムに整理
- 「保存して次へ / 保留 / 削除」ボタンを大きく

---

### 5-4. Capture 画面 UI

#### マイク中央配置

- **待機中:** ヘッダーとフッター間の残りスペースで `justify-center`
- **録音中:** 従来どおり上から波形・文字起こしが広がる

#### フッター（AI 選択 + テキスト入力）

- 個別に `min-h-12` を足していた → 後に共通コンポーネント化へ

---

### 5-5. Bottom Sheet（Inbox 説明パネル）

#### 用語

| 呼び方 | 説明 |
|--------|------|
| **Bottom Sheet（ボトムシート）** | 下からスライドする UI（一般的な呼び方） |
| **Sheet** | shadcn/ui のコンポーネント名（`side="bottom"`） |

ファイル: `src/components/mobile/inbox-info-sheet.tsx`

#### 問題と修正

| 症状 | 原因 | 修正 |
|------|------|------|
| 番号リストが左端に張り付く | 本文に `px` がない | `px-4` を追加 |
| 数字と本文が詰まる | `list-inside` | `list-outside` + `pl-5` |
| 下が切れる | safe-area 未考慮 | `pb-[max(1.5rem,env(safe-area-inset-bottom))]` |

#### padding vs margin

- **padding（内側余白）** → 今回の主因。要素の中身と枠の距離
- **margin（外側余白）** → 要素と要素の距離。今回は副次的

---

### 5-6. ボタン・フォームの「細さ」問題

#### 最初のアプローチ（個別修正）

各画面で `min-h-11` / `min-h-12` を足していった。

- Inbox 確定フォーム
- Edit Sheet フッター
- Capture フッター
- AI プロバイダーセレクター

→ **画面が増えるたびに同じ修正が必要**で、メンテしづらい。

#### 最終アプローチ（共通コンポーネント一括変更）

| コンポーネント | 変更前 | 変更後 |
|-------------|--------|--------|
| Button（default） | h-8 (32px) | min-h-11 (44px) |
| Button（lg） | h-9 (36px) | min-h-12 (48px) |
| Button（icon） | 32px | 44px |
| Select（default） | h-8 | min-h-11 |
| Select（lg） | — | min-h-12 |
| Input | h-10 | min-h-11 |

**教訓:** モバイル向けタップ領域は **shadcn のデフォルト（desktop 寄り）をそのまま使わず、プロジェクト初期に上書き** するのが効率的。

#### サイズの使い分け（方針）

| size | 用途 |
|------|------|
| `default` | 通常ボタン・フォーム |
| `lg` | 主要 CTA（保存して次へ、AIで整理する 等） |
| `sm` / `icon-sm` | ヘッダー内、× ボタン、入力欄内マイク |

---

### 5-7. その他の UI 機能

| 機能 | 主要ファイル |
|------|-------------|
| 日付ピッカー | `deadline-picker.tsx`, `calendar.tsx`, `date-helpers.ts` |
| 音声入力（フォーム） | `use-speech-dictation.ts`, `speech-input.tsx` |
| 検証失敗 dismiss | `validation-failed-alert.tsx`, `use-validation-alert-dismiss.ts` |
| Edit Sheet 共通 | `edit-sheet-layout.tsx` |
| 抽象期限の具体化 | `resolveAbstractDueDate()` in `date-helpers.ts` |

---

## 6. Vercel デプロイトラブルと解決

### 症状

- push 後、GitHub Deployments に **failure**
- 本番 URL は動くが **古いバージョン**のまま
- 確認方法: `/api/ai/providers` の `model` が `gemini-2.0-flash` のまま

### 原因

Vercel の **Root Directory が未設定**（または空）で、リポジトリ root からビルドしていた。

### 解決手順

1. Vercel Dashboard → **work-capture** プロジェクト
2. **Settings** → 左サイドバー **Build and Deployment**
   - ※ **General には Root Directory はない**
3. 下にスクロール → **Root Directory** に `work-capture` を入力 → **Save**
4. **Deployments** → 失敗デプロイ → **Redeploy**

### デプロイ成功の確認

```bash
curl -s https://work-capture.vercel.app/api/ai/providers
```

`"model":"gemini-3.1-flash-lite"` になっていれば最新反映済み。

---

## 7. 悩んだこと・判断ログ

### Q. SP で Inbox 確定までやるべき？

**判断:** SP は Capture 専用。Organize（確定）は PC の Inbox Zero。  
SP Inbox は「確認・閲覧」程度に留め、確定 UI は PC 主役。

→ 右上 Inbox アイコン → Bottom Sheet で「PC で整理」を案内。

### Q. PC Inbox は 2 カラム vs 3 カラム？

**判断:** 3 カラムは情報過多。2 カラム（一覧 + 詳細）に整理。  
原文は折りたたみ可能にして、確定フォームを sticky で常に見える位置に。

### Q. ボタン細さは画面ごと vs 全体？

**判断:** 後者。`button.tsx` / `input.tsx` / `select.tsx` のデフォルトを変更。  
主要 CTA だけ `size="lg"` を明示。

### Q. Gemini モデルは 3.5-flash-lite でいい？

**判断:** API に存在しないため `gemini-3.1-flash-lite` に変更。  
コスト重視の Lite 用途として妥当。

---

## 8. 環境変数チェックリスト

| 変数 | 用途 | 設定場所 |
|------|------|---------|
| `DATABASE_URL` | Neon PostgreSQL | Vercel Integration / `.env.local` |
| `GEMINI_API_KEY` | 文字起こし・構造化 | Vercel / `.env.local` |
| `OPENAI_API_KEY` | OpenAI 利用時 | 同上（任意） |
| `ANTHROPIC_API_KEY` | Claude 利用時 | 同上（任意） |

---

## 9. ローカル開発の基本コマンド

```bash
cd work-capture
cp .env.example .env.local   # 初回のみ
npm install
npm run dev                  # http://localhost:3000
npm run build                # 本番ビルド確認
```

DB 未設定時は SQLite + モック AI に自動フォールバック。

---

## 10. 未完了・次のステップ

| 項目 | 状態 |
|------|------|
| Vercel Root Directory = `work-capture` | 要確認（設定後 Redeploy） |
| 本番への最新 UI 反映 | Root Directory 設定後 |
| Phase 2: Inbox 俯瞰カレンダー | 未着手 |
| Phase 7: Dashboard | 設計済（[UI 設計](./Work_Capture_UI_Design.md) §3-2, §2-9）・未実装 |
| `Work_Capture_Development_Flow.md` の AI モデル表記 | `gemini-2.0-flash` → 要更新 |

---

## 11. 主要ファイル早見表

| パス | 用途 |
|------|------|
| `src/app/capture/page.tsx` | SP 録音ホーム |
| `src/app/inbox/page.tsx` | Inbox（SP/PC 分岐） |
| `src/components/mobile/capture-home.tsx` | 録音 UI 本体 |
| `src/components/mobile/inbox-info-sheet.tsx` | Inbox 説明 Bottom Sheet |
| `src/components/inbox/inbox-detail-content.tsx` | Inbox 詳細・確定フォーム |
| `src/components/mobile/edit-sheet-layout.tsx` | Edit Sheet 共通レイアウト |
| `src/components/ui/button.tsx` | ボタンサイズ定義（全体に効く） |
| `src/lib/ai/providers/config.ts` | AI モデル名・プロバイダー設定 |
| `src/lib/ai/prompts.ts` | 構造化プロンプト v1.1.0 |

---

## 12. 関連ドキュメント

- [Work_Capture_Development_Flow.md](./Work_Capture_Development_Flow.md) — プロジェクト全体の開発フロー
- [Work_Capture_UI_Design.md](./Work_Capture_UI_Design.md) — 画面設計
- [Work_Capture_AI_Architecture_Design.md](./Work_Capture_AI_Architecture_Design.md) — AI・DB 設計
- [work-capture/README.md](../work-capture/README.md) — セットアップ手順

---

*最終更新: 2026-07-01*
