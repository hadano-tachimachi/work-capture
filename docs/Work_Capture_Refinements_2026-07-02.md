# Work Capture 微調整メモ（2026-07-02）

> **目的:** Phase 7 Dashboard MVP 以降に行った機能追加・UI 改善・配色刷新を、後から参照できるように整理したメモ。  
> **対象コミット:** `bec9471`（Phase 7 MVP）〜 `a0e3a2f`（最新）

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
