# Work Capture 開発フローまとめ

> **思考を止めずに、仕事を前へ進める。**

このドキュメントは、設計フェーズから現在の実装・UI Brush UP までの流れを一括で整理したものです。

---

## 1. プロジェクト概要

Work Capture は ToDo アプリではなく、**思考を構造化し、仕事へ変換するシステム**です。

| 役割 | 担当 |
|------|------|
| スマホ | **Capture** — 思考を3秒で預ける |
| AI | **構造化** — 候補を作る（判断しない） |
| プログラム | **検証** — JSON / Zod で形式を保証 |
| PC | **Organize** — Inbox Zero で仕事として確定 |
| 人間 | **確定** — 優先度・担当・実行判断 |

### 設計の核心

> **AIは候補を作る。プログラムが検証する。人間が確定する。**

### 判断基準

新機能・UI を追加する際は必ず問う:

> **この機能は「迷う時間」を減らすか？**

---

## 2. 関連ドキュメント

| ファイル | 内容 |
|---------|------|
| [Work_Capture_Concept.md](./Work_Capture_Concept.md) | コンセプト・設計思想 |
| [Work_Capture_UI_Design.md](./Work_Capture_UI_Design.md) | 画面ワイヤー・SP/PC 役割分担 |
| [Work_Capture_AI_Architecture_Design.md](./Work_Capture_AI_Architecture_Design.md) | DB・安心設計フロー |
| [Work_Capture_AI_Prompt_API_Integration.md](./Work_Capture_AI_Prompt_API_Integration.md) | プロンプト・API・Zod |
| [Work_Capture_Architecture_Notes.md](./Work_Capture_Architecture_Notes.md) | 技術スタック・PoC ロードマップ |
| [work-capture/README.md](../work-capture/README.md) | アプリ本体のセットアップ手順 |

---

## 3. 開発の経緯（タイムライン）

### Phase 0 — 設計（完了）

- コンセプト・UI 設計・アーキテクチャ・AI 方針の 5 ドキュメント整備
- 技術検証（別環境）: 録音 → Gemini 文字起こし 成功済み
- 実装方針: **フル MVP 一気通貫**（SP 録音 → PC Inbox Zero）

### Phase 1 — MVP 実装（完了）

- Next.js + shadcn/ui + Tailwind プロジェクト作成（`work-capture/`）
- Drizzle ORM + 4 テーブル（`work_captures`, `ai_parse_results`, `structured_items`, `tasks`）
- Gemini API 連携（文字起こし + Structured Output 構造化）
- Zod バリデーション + raw 保存（安心設計）
- SP 録音キャプチャ → AI 解析 → 確認 → PC Inbox Zero の一連フロー

### Phase 2 — 開発環境整備（完了）

- `.env.local` 未設定でも動作する **開発フォールバック**
  - DB: ローカル SQLite（`.data/work-capture.db`）
  - AI: モック AI（簡易構造化）
- `/api/health` で動作モード確認
- 画面上部に開発モードバナー表示

### Phase 3 — UI Brush UP（完了）

- パープルブランドカラー適用
- Lucide アイコン化（絵文字廃止）
- カード型解析結果 + Edit Sheet 編集
- PC Inbox Zero の 2 ペイン Brush UP
- 録音波形・タイマー・録音終了画面の追加

### Phase 4 — 録音 UX 改善（完了）

- **中央マイク 1 タップ**で録音開始・終了（カメラアプリ型）
- 録音中は同一画面内で波形 + ライブ文字起こし表示
- 画面遷移を削減し Capture 体験を単純化

---

## 4. 技術スタック

| レイヤ | 技術 |
|--------|------|
| Frontend | Next.js 16 (App Router), shadcn/ui, Tailwind CSS v4 |
| Hosting（想定） | Vercel |
| DB（本番） | Neon PostgreSQL + Drizzle ORM |
| DB（開発） | better-sqlite3（自動フォールバック） |
| AI（本番） | Gemini API（`gemini-2.0-flash`） |
| AI（開発） | モック AI（キーワードベース簡易構造化） |
| 検証 | Zod + JSON Schema（Structured Output） |
| 音声 | MediaRecorder → API → Gemini 文字起こし |

---

## 5. ディレクトリ構成

```
【課題】 Work Capture application/
├── docs/                      # 設計ドキュメント群
│   ├── Work_Capture_Concept.md
│   ├── Work_Capture_UI_Design.md
│   ├── Work_Capture_AI_Architecture_Design.md
│   ├── Work_Capture_AI_Prompt_API_Integration.md
│   ├── Work_Capture_Architecture_Notes.md
│   └── Work_Capture_Development_Flow.md  # 本ファイル
└── work-capture/              # Next.js アプリ本体
    ├── src/app/
    │   ├── capture/           # SP Capture フロー
    │   ├── inbox/             # PC Inbox Zero
    │   └── api/               # API Routes
    ├── src/components/
    │   ├── mobile/            # SP 専用 UI
    │   ├── shared/            # SP/PC 共通（SectionCard 等）
    │   └── ui/                # shadcn/ui
    ├── src/lib/
    │   ├── ai/                # Gemini, プロンプト, モック
    │   ├── db/                # Drizzle スキーマ
    │   ├── services/          # ビジネスロジック
    │   └── validation/        # Zod スキーマ
    └── drizzle/               # マイグレーション SQL
```

---

## 6. データモデル

### work_captures（親データ・入力 1 回 = 1 件）

| カラム | 説明 |
|--------|------|
| id | UUID |
| audio_url | 音声 URL（将来用、現状は transcript のみ） |
| transcript_text | 文字起こし本文 |
| input_type | `audio` \| `text` |
| status | 下記参照 |
| created_at | 作成日時 |

**status 遷移:**

```
transcribed → ready_for_review / validation_failed → confirmed
```

### ai_parse_results（AI 出力の証拠）

- raw_output, parsed_json, validation_status, validation_errors
- model_name, prompt_version

### structured_items（AI 候補・未確定）

- type: purpose, background, task, action, note, decision, due_date, next_action 等
- content, sort_order

### tasks（人間確定後の正式データ）

- title, description, due_date, priority, status, project, context, assigned_to

---

## 7. API 一覧

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/capture` | POST | 音声/テキスト受付 → 文字起こし → AI 構造化 → DB 保存 |
| `/api/captures` | GET | 一覧 or 詳細取得 |
| `/api/captures` | PATCH | 更新・確定・削除 |
| `/api/transcribe` | POST | 文字起こしのみ |
| `/api/structure` | POST | 構造化のみ |
| `/api/inbox/count` | GET | 未整理件数 |
| `/api/health` | GET | 動作モード確認 |

---

## 8. 画面一覧と URL

| パス | デバイス | 説明 |
|------|---------|------|
| `/` | 自動 | SP → `/capture`、PC → `/inbox` にリダイレクト |
| `/capture` | SP | 録音ホーム（マイク 1 タップ操作） |
| `/capture/processing?id=` | SP | AI 解析中 |
| `/capture/review/[id]` | SP | AI 解析結果確認（カード + Sheet 編集） |
| `/capture/complete` | SP | 登録完了 |
| `/capture/menu` | SP | 簡易メニュー |
| `/inbox` | PC | Inbox Zero（2 ペイン） |

---

## 9. ユーザーフロー

### 9-1. スマホ — Capture フロー

```text
/capture（待機）
  │
  │ 中央マイクをタップ
  ▼
録音中（同一画面）
  │ ・波形表示
  │ ・ライブ文字起こし
  │ ・タイマー
  │
  │ 中央マイクを再タップ
  ▼
録音終了画面（1〜2秒）
  │ 「録音を終了しました」
  │ 自動で API 送信
  ▼
/capture/processing
  │ AI 解析ステップ表示
  ▼
/capture/review/[id]
  │ カード型で AI 分解結果を確認
  │ タップで Sheet 編集（タスク/期限/メモ/次の一歩）
  │
  │ 「この内容で登録」
  ▼
/capture/complete
  │ PC で Inbox Zero へ
```

**代替動線:** テキスト入力ボトムシート → 直接 AI 構造化 → processing へ

**録音操作の要点:**

- 開始: 中央マイク タップ
- 終了: **同じ中央マイク** タップ
- キャンセル: 録音中のみ下部に控えめ表示

### 9-2. PC — Inbox Zero フロー

```text
/inbox
  │
  │ 左: 未整理一覧（カード）
  │ 右: 元入力 + 構造化結果
  │
  │ 担当・優先度・Project・Context・期限を設定
  │
  │ 「保存して次へ」
  ▼
tasks テーブルへ昇格
work_captures.status → confirmed
  │
  │ 次の未整理へ
```

### 9-3. 全体データフロー

```text
[SP] 音声/テキスト入力
        ↓
[API] 文字起こし（Gemini or テキストそのまま）
        ↓
[API] AI 構造化（固定プロンプト + JSON Schema）
        ↓
[API] Zod 検証
        ↓
[DB] work_captures + ai_parse_results + structured_items
        ↓
[SP] 解析結果確認 → ready_for_review
        ↓
[PC] Inbox Zero → 人間が確定
        ↓
[DB] tasks へ昇格 → confirmed
```

---

## 10. AI 処理の安心設計

```text
AIは候補を作る
  ↓
プログラムが検証する（Zod）
  ↓
raw_output を必ず保存（ai_parse_results）
  ↓
検証失敗 → validation_failed（アプリは止めない）
  ↓
人間が Inbox Zero / 確認画面で確定
```

**AI 禁止事項:**

- 入力にない人名・期限・担当者を追加しない
- 曖昧な内容を断定しない
- タスクを勝手に増やさない

---

## 11. UI / UX 設計（現行）

### ブランド

- プライマリカラー: パープル（`oklch(0.55 0.22 300)`）
- 録音中: 赤（`--capture-recording`）
- 角丸: iOS 風（`--radius: 1rem`）
- アイコン: Lucide React

### SP Capture 画面

| 要素 | 設計意図 |
|------|---------|
| 中央マイク | 唯一の主操作。開始も終了もここ |
| 波形 | 認識されている安心感 |
| ライブ文字起こし | 言い間違いに気づける |
| テキスト入力 | 下部控えめ。録音中は非表示 |
| メニュー / Inbox | ヘッダー左右。Capture を邪魔しない |

### SP 解析結果

| セクション | 表示 | 編集 |
|-----------|------|------|
| 文字起こし | Collapsible | 読み取り専用 |
| タスク | チェックリスト | EditTasksSheet |
| 期限 | 選択値 | EditDeadlineSheet |
| メモ | プレビュー | EditMemoSheet |
| 次の一歩 | 選択値 | EditNextStepSheet（Radio） |
| 判断事項 | プレビュー | 読み取り専用 |

### PC Inbox Zero

- 2 ペイン: 左 = 元入力 / 右 = 構造化結果 + 確定フォーム
- 左サイドバー: 未整理一覧（選択中 = 紫左ボーダー）
- SectionCard スタイルを SP と共通化

---

## 12. 開発環境セットアップ

```bash
cd "【課題】 Work Capture application/work-capture"
npm install
npm run dev
```

| URL | 用途 |
|-----|------|
| http://localhost:3000/capture | SP 録音画面 |
| http://localhost:3000/inbox | PC Inbox Zero |
| http://localhost:3000/api/health | 動作モード確認 |

### 環境変数（本番同等を試す場合）

`.env.local`:

```env
GEMINI_API_KEY=your_key
DATABASE_URL=postgresql://...
```

---

## 13. PoC ロードマップと到達状況

| Phase | 内容 | 状態 |
|-------|------|------|
| 0 | Concept | ✅ |
| 1 | 録音体験 | ✅ |
| 2 | 文字起こし | ✅ |
| 3 | AI 構造化 | ✅ |
| 4 | 確認画面 | ✅ |
| 5 | DB 保存 | ✅ |
| 6 | Inbox Zero | ✅ |
| 7 | Dashboard | ⬜ 次フェーズ |

---

## 14. スコープ外（今後）

| 機能 | 理由 |
|------|------|
| Dashboard（実行画面） | MVP は Inbox Zero まで |
| 認証・マルチユーザー | 個人 PoC |
| 音声ファイル永続ストレージ | transcript 優先 |
| ボトムタブ / タスク一覧 / カレンダー | Capture 優先の設計思想 |
| PWA / ネイティブ | Web のみで開始 |

---

## 15. 今後検討の UX 改善（メモ）

優先度順:

1. **最短録音時間ガード** — 誤タップで 0 秒録音を防ぐ
2. **「修正する」ボタンのラベル整理** — 録音し直し vs 項目編集の明確化
3. **Processing 進捗の実 API 同期** — 演出ではなく実状態表示
4. **PC Inbox の編集 UI 統一** — SP と同じ Sheet 方式
5. **触覚フィードバック** — 録音開始/終了時の vibrate（対応端末のみ）

---

## 16. 変更履歴（概要）

| 日付 | 内容 |
|------|------|
| 設計フェーズ | 5 ドキュメント整備、PoC 方針決定 |
| MVP 実装 | Next.js アプリ構築、API/DB/AI パイプライン完成 |
| 開発フォールバック | SQLite + モック AI で env 不要起動 |
| UI Brush UP | パープルブランド、カード型 UI、Edit Sheet |
| 録音 UX | マイク 1 タップで開始/終了、1 画面 Capture |

---

*最終更新: 2026年7月*
