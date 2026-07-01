# Work Capture 微調整メモ（2026-07-02）

> **目的:** Phase 7 Dashboard MVP 以降に行った機能追加・UI 改善・配色刷新を、後から参照できるように整理したメモ。  
> **対象コミット:** `bec9471`（Phase 7 MVP）〜 `067a797`（最新）

---

## 1. 概要

| カテゴリ | 内容 |
|---------|------|
| **Dashboard 機能** | タスク削除（DB 物理削除）、完了済み一覧 |
| **配色** | トライアド（紫 / ティール / アンバー）によるフェーズ別強調 |
| **文言** | デバイス名（PC・スマホ）を UI から除去 |
| **SP メニュー** | Capture → Inbox → 今日やること のフロー順 UI |
| **デプロイ** | `main` push → Vercel 自動デプロイ |

**本番 URL:** https://work-capture.vercel.app  
**リポジトリ:** https://github.com/hadano-tachimachi/work-capture

---

## 2. コミット履歴

| コミット | 内容 |
|---------|------|
| `bec9471` | Phase 7 Dashboard MVP（PC 2 ペイン + SP 今日やること） |
| `e072bfa` | UI 文言からデバイス名を除去しラベルを統一 |
| `a0e3a2f` | タスク削除・完了済み一覧とトライアド配色を追加 |
| `067a797` | Execute 画面の Tertiary 配色を統一（本ドキュメント追記分） |

---

## 3. タスク操作の整理

Phase 7 MVP 時点では「完了」「保留」のみ。今回、削除と完了済み閲覧を追加した。

| 操作 | 動作 | 実装 |
|------|------|------|
| **完了** | `status → done`、やること一覧から消える | 既存（PATCH） |
| **保留** | `status → on_hold`、保留セクションへ | 既存（PATCH） |
| **やることに戻す** | `on_hold → todo` または `done → todo` | 既存（PATCH） |
| **削除** | DB から物理削除（確認ダイアログあり） | **新規** DELETE |
| **完了済み閲覧** | `status: done` のタスクを見返す | **新規** GET + タブ UI |

### API

| メソッド | パス | 用途 |
|---------|------|------|
| `GET` | `/api/tasks` | 未完了（`todo` + `on_hold`） |
| `GET` | `/api/tasks?status=done` | 完了済み（作成日降順） |
| `PATCH` | `/api/tasks/[id]` | ステータス更新 |
| `DELETE` | `/api/tasks/[id]` | 物理削除 |
| `GET` | `/api/tasks/count` | `active` / `done` 件数 |

### UI

- **SP:** `/capture/tasks` — 「やること | 完了済み」タブ
- **PC:** `/dashboard` — 同タブ + 左ペイン一覧
- 詳細フッター:
  - 未完了: `[完了] [保留/やることに戻す]` + 下段 `[削除]`
  - 完了済み: `[未完了に戻す] [削除]`

---

## 4. トライアド配色

### 課題

- 紫（Primary）だけで全体を強調していた
- `bg-primary/10` の多用でコントラストが弱く、全体的に薄く見えた

### 方針

色環上 120° ずつ離れた3色を、製品の3フェーズに対応させる。

| トークン | 色相 | フェーズ | 主な用途 |
|---------|------|---------|---------|
| **Primary** | 紫 300° | Capture（預ける） | マイク、メイン CTA、ブランド |
| **Secondary** | ティール 195° | Organize（整理） | Inbox Zero、整理 UI |
| **Tertiary** | アンバー 72° | Execute（実行） | Dashboard、タスク完了 |

```text
        紫 Primary (300°)
           /\
          /  \
         /    \
   ティール    アンバー
 Secondary   Tertiary
  (195°)      (72°)
```

### 調整内容

| 項目 | 変更前（目安） | 変更後（目安） |
|------|--------------|--------------|
| Primary | `oklch(0.55 0.22 300)` | `oklch(0.48 0.26 300)` — 濃く・鮮やかに |
| Secondary | 紫系の薄い背景 | ティール系の独立トークン |
| Tertiary | なし | アンバー系を新規追加 |
| ボーダー | 薄い | コントラスト強化 |

### 画面別の色当て

| 画面 / コンポーネント | 色 |
|---------------------|-----|
| 録音マイク | Primary（グラデーション強化） |
| SP メニュー ①②③ | 紫 → ティール → アンバー |
| Inbox カード・進捗・空状態 | Secondary |
| Dashboard タブ・タスクカード | Tertiary |
| PC ヘッダー Inbox / Dashboard バッジ | Secondary / Tertiary |

### 関連ファイル

- `work-capture/src/app/globals.css` — CSS 変数定義
- `work-capture/src/lib/utils/phase-colors.ts` — フェーズ別クラスマップ

---

## 5. 文言統一（`e072bfa`）

デバイス名を UI から除去し、操作の本質でラベルを統一した。

| 変更前 | 変更後 |
|--------|--------|
| スマホで追加 | **音声で追加** |
| 未整理 inbox（PC） | **未整理 Inbox** |
| ワイドレイアウト向け… | そのまま（SP 向け案内として残す） |

---

## 6. SP メニュー（`/capture/menu`）

Capture → Organize → Execute の順番を UI で明示。

```text
① 録音画面        （紫）
      ▼
② 未整理 Inbox    （ティール）+ 件数バッジ
      ▼
③ 今日やること    （アンバー）+ 件数バッジ
```

- 閉じるボタン: `X` アイコン + `size="icon-lg"`
- 下部「使い方（30秒）」は削除
- ステップ番号バッジ + ChevronDown 区切り

---

## 7. 追加・変更ファイル一覧

### 新規

| ファイル | 役割 |
|---------|------|
| `src/lib/hooks/use-task-workspace.ts` | タスク一覧・詳細・削除の共通フック |
| `src/lib/utils/phase-colors.ts` | フェーズ別アクセントクラス |
| `src/components/dashboard/task-view-tabs.tsx` | やること / 完了済みタブ |
| `src/components/dashboard/task-list-panel.tsx` | 左ペイン・SP 一覧 |
| `src/components/dashboard/task-completed-empty-state.tsx` | 完了済み空状態 |

### 主要変更

| ファイル | 変更内容 |
|---------|---------|
| `src/lib/services/tasks.ts` | `deleteTask()`、`getTaskCounts()` に `done` 追加 |
| `src/app/api/tasks/[id]/route.ts` | `DELETE` ハンドラ |
| `src/app/capture/tasks/page.tsx` | タブ + 削除 + フック利用 |
| `src/app/dashboard/page.tsx` | タブ + 削除 + 配色 |
| `src/app/globals.css` | トライアドトークン |
| `src/components/dashboard/task-detail-content.tsx` | 削除・未完了に戻す |
| `src/components/shared/pc-work-header.tsx` | フェーズ別ナビ強調 |

---

## 8. 操作の流れ（ユーザー視点）

```text
Capture（紫）
  音声 / テキストで預ける
    ↓
Inbox Zero（ティール）
  AI 結果を確認し、タスクとして確定
    ↓
Dashboard / 今日やること（アンバー）
  完了 · 保留 · 削除
  完了済みタブで見返し · 未完了に戻す
```

---

## 9. 未着手（Phase 7 後半以降）

| 項目 | 備考 |
|------|------|
| タスク詳細の編集 | MVP では閲覧 + ステータス変更のみ |
| Dashboard 3 ペイン | MVP は 2 ペイン |
| カレンダー / アクションプラン UI | Development_Flow 参照 |
| ダークモード配色の微調整 | トライアドは定義済み、実機確認余地あり |

---

## 10. 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| `Work_Capture_UI_Design.md` | §3-2 Dashboard、§2-9 SP 今日やること |
| `Work_Capture_Development_Flow.md` | Phase 7 チェックリスト |
| `Work_Capture_Session_Retrospective_2026-07-01.md` | 本番デプロイ〜 UI Brush UP まで |

---

## 11. 追加セッション：Execute 配色の見直し（`067a797`）

トライアド導入（`a0e3a2f`）後、実機スクリーンショット（`/capture/tasks`）を UI デザイナー視点で評価し、Execute 画面の色混在を修正した。

### 11-1. セッションの流れ

```text
Phase D — トライアド初回適用（a0e3a2f）
  ├─ タスク削除 API + 完了済みタブ
  ├─ Primary / Secondary / Tertiary トークン定義
  ├─ フェーズ別 phase-colors.ts 導入
  └─ push → Vercel デプロイ

Phase E — 実機評価 → 配色修正（067a797）
  ├─ SP「今日やること」画面のスクリーンショットを評価
  ├─ 課題3点を特定（紫混在・薄さ・タブ不統一）
  ├─ Execute 画面を Tertiary に統一
  ├─ 本ドキュメント（§11）追記
  └─ push → Vercel デプロイ
```

---

### 11-2. 実機評価で見えた課題

| # | 課題 | 画面での症状 | 原因（実装） |
|---|------|------------|-------------|
| 1 | **色の意味が混在** | タブはアンバー、選択カード背景は薄い紫 | 選択カードに `capture-surface`（hue 300°）を使用 |
| 2 | **全体的に薄い** | アクセントが muted 中心で視線誘導が弱い | `primary/10`・`tertiary-muted/60` 等の低コントラスト |
| 3 | **完了済みタブだけ色体系外** | 「完了済み」選択時に白背景 + グレーリング | `task-view-tabs.tsx` で Execute 色を未適用 |

**評価の結論:** トライアドの設計思想は正しいが、Execute 画面で Capture 系サーフェスが漏れていた。

---

### 11-3. 修正内容（3点 + 追加）

| 優先 | 修正 | 変更ファイル |
|------|------|-------------|
| ① | 選択カード背景を `capture-surface` → `tertiary-muted` 系に統一 | `task-card.tsx`, `phase-colors.ts`（`execute.selected` 追加） |
| ② | アクティブタブに solid 強調（`ring-tertiary` + `font-semibold`） | `task-view-tabs.tsx`, `phase-colors.ts` |
| ③ | 完了済みタブのアクティブ状態も `execute.navActive` | `task-view-tabs.tsx` |
| ＋ | 完了ボタンを Tertiary solid（`bg-tertiary`） | `task-detail-content.tsx` |
| ＋ | ヘッダータイトル・件数表示を Execute テキスト色に | `capture/tasks/page.tsx`, `dashboard/page.tsx` |
| ＋ | `tertiary-muted` の彩度を微増 | `globals.css` |

#### 修正前後（選択カード）

```text
【修正前】
  タブ背景     … アンバー（Tertiary）✓
  選択カード背景 … 薄紫（capture-surface）✗
  選択左ボーダー … アンバー（Tertiary）✓
  → 1枚のカードに紫 + オレンジが同居

【修正後】
  タブ・カード・ボタン … すべて Tertiary 系で統一
  完了ボタン … bg-tertiary（solid アクセント）
```

#### `phase-colors.ts` への追加

```typescript
execute: {
  navActive: "... ring-tertiary/35 font-semibold",
  selected:  "border-l-4 border-l-tertiary bg-tertiary-muted/55 ring-1 ring-tertiary/25",
}
```

---

### 11-4. 変更ファイル（`067a797`）

| ファイル | 変更内容 |
|---------|---------|
| `src/lib/utils/phase-colors.ts` | `execute.selected` 追加、`navActive` 強化 |
| `src/components/dashboard/task-card.tsx` | 選択・ホバーを Tertiary 系に |
| `src/components/dashboard/task-view-tabs.tsx` | タブ容器リング、完了済みタブ統一 |
| `src/components/dashboard/task-detail-content.tsx` | 完了ボタン Tertiary solid |
| `src/app/capture/tasks/page.tsx` | タイトル・件数の Execute 色 |
| `src/app/dashboard/page.tsx` | 件数・左ペイン見出しの Execute 色 |
| `src/app/globals.css` | `tertiary-muted` 彩度調整 |
| `docs/Work_Capture_Refinements_2026-07-02.md` | 本追記 |

---

### 11-5. フェーズ別配色ルール（確定版）

今後 UI を追加するときの指針。

| フェーズ | 色 | 使う場面 | 使わない場面 |
|---------|-----|---------|-------------|
| Capture | Primary（紫） | マイク、録音、メイン CTA | Execute 画面のカード背景 |
| Organize | Secondary（ティール） | Inbox カード、進捗、整理 UI | Dashboard タブ |
| Execute | Tertiary（アンバー） | タスク一覧、完了ボタン、件数 | Inbox 左ボーダー |

**原則:** 1画面 = 1フェーズ色。他フェーズの `capture-surface` 等を流用しない。

---

### 11-6. 残課題（配色まわり）

| 項目 | 備考 |
|------|------|
| 優先度バッジの色分け | 高優先度だけ Tertiary 等 — 未着手 |
| ダークモード実機確認 | トークン定義済み、Execute 画面の目視確認余地あり |
| Inbox 選択カード | Secondary で統一済み — 問題なし |

---

## 12. 全体タイムライン（Phase 7 以降）

```text
bec9471  Phase 7 Dashboard MVP
   ↓
e072bfa  文言統一（デバイス名除去）
   ↓
a0e3a2f  タスク削除 + 完了済み一覧 + トライアド初回
   ↓
067a797  Execute 配色統一 + 本ドキュメント
   ↓
（次）   Phase 7 後半 — タスク編集 / 3 ペイン 等
```
