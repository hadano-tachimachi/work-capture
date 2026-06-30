# Work Capture AI構造化プロンプト/API組み込み方針

> **思考を止めずに、仕事を前へ進める。**

---

# 1. このメモの目的

このドキュメントは、Work Capture における **AI構造化処理** を、実際のアプリへ組み込むための設計メモです。

想定するAI APIは以下のいずれかです。

- Gemini API
- OpenAI API
- Claude API

今後 Cursor で開発を進める際の、プロンプト設計・API接続・安全設計の判断軸として使います。

---

# 2. 基本方針

AIに任せるのは「判断」ではなく **構造化** です。

```text
文字起こし本文
↓
固定プロンプト
↓
AI構造化
↓
JSON Schemaに沿った出力
↓
サーバー側で検証
↓
DBへ保存
```

AIの出力をそのまま正式データとして信用しない。

必ず以下の流れにします。

```text
AIは候補を作る
↓
プログラムが検証する
↓
人間が確定する
```

---

# 3. 固定プロンプトは組み込めるか

結論として、組み込めます。

Next.js 側の API Route / Server Action などで、毎回同じ System Prompt を付与します。

```text
固定System Prompt
+
ユーザーの文字起こし本文
+
出力スキーマ指定
```

という形で、Gemini / OpenAI / Claude のいずれにも渡せます。

---

# 4. モデル別の考え方

## Gemini API

Gemini は Structured Output に対応しており、JSON Schema に沿ったレスポンスを返す設計が可能。

Work Capture では、すでに以下は検証済み。

```text
スマートフォン録音
↓
録音データをGeminiへ送信
↓
文字起こし
↓
成功
```

そのため、Geminiは第一候補として現実的です。

---

## OpenAI API

OpenAI も Structured Outputs に対応しており、JSON Schema に従った出力を求める設計が可能。

構造化JSONを扱う用途には向いています。

---

## Claude API

Claude でも固定プロンプトによる構造化は可能。

ただし、JSON Schemaでどこまで厳格に固定できるかは、実装時に仕様確認が必要。

PoC段階では、Gemini または OpenAI を優先した方が実装しやすい可能性があります。

---

# 5. プロンプト設計の基本思想

AIには、次の役割を与えます。

```text
あなたは Work Capture の情報整理担当です。
あなたの役割は判断ではなく、入力文を仕事として扱える形へ構造化することです。
```

## 禁止事項

AIに以下を禁止します。

- 入力にない人名を追加しない
- 入力にない期限を作らない
- 入力にない担当者を決めない
- 入力にないタスクを勝手に増やさない
- 曖昧な内容を断定しない
- 「〜した方が良いよね」を確定タスクにしない
- 不明な内容を補完しない

---

# 6. AIが抽出する項目

AIに抽出させる項目は以下。

```text
目的
背景
タスク
期限
アクションプラン
メモ
判断事項
次の一歩
不明点・確認事項
Project候補
Context候補
```

---

# 7. 分類ルール

## タスク

実際に行う作業。

例：

```text
見積を作る
原価を調べる
田中さんに確認する
```

---

## メモ

補足情報。  
実行アクションではないもの。

例：

```text
山田さんから依頼があった
一旦粗で作って共有予定
```

---

## 判断事項

まだ決める必要があるもの。

例：

```text
粗利を知らせるか判断する
```

「〜した方が良いよね」は、原則として判断事項に入れる。

---

## アクションプラン

作業を進める順番。

例：

```text
1. 見積項目を入力する
2. 原価を調べる
3. 出し値を想定で入力する
4. 内容を確認する
5. 共有する
```

---

## 次の一歩

最初に着手する具体行動。  
1つだけにする。

例：

```text
見積項目を先に入力する
```

---

# 8. 出力形式の考え方

プロンプトだけでJSONを安定させようとしない。

必ず以下の組み合わせにする。

```text
固定プロンプト
+
Structured Output / JSON Schema
+
サーバー側バリデーション
```

## サーバー側で検証する内容

- JSONとして正しいか
- 必須項目があるか
- 型が正しいか
- enumが正しいか
- 配列であるべき項目が配列か
- nullであるべき箇所に文字列が入っていないか

検証には Zod などを使う想定。

---

# 9. 安心設計

AI構造化結果は、正式タスクではなく「候補」です。

```text
文字起こし本文
↓
AI構造化
↓
raw_output として保存
↓
バリデーション
↓
structured_items として保存
↓
PCのInbox Zeroで人間が確認
↓
tasks に昇格
```

---

# 10. 保存の考え方

## work_captures

元データ。

- 音声ファイルURL
- 文字起こし本文
- 作成日時
- ステータス

---

## ai_parse_results

AI出力の記録。

- raw_output
- parsed_json
- validation_status
- validation_errors
- model_name
- prompt_version

---

## structured_items

AIが抽出した候補。

- purpose
- background
- task
- action
- note
- decision
- due_date
- next_action

---

## tasks

人間が確認して正式化したタスク。

---

# 11. 失敗時の扱い

AI出力の検証に失敗しても、アプリ全体を止めない。

```text
validation_failed
```

として保存し、PC側の Inbox Zero に「要確認」として表示する。

元データである

- 音声
- 文字起こし
- AI raw output

が残っていれば復旧できる。

---

# 12. Cursorでの最初の開発指示イメージ

まずは小さく作る。

## PoC 1

```text
Next.jsで、スマホから録音した音声ファイルをアップロードし、Gemini APIへ送信して文字起こし結果を画面に表示する機能を作ってください。
DB保存はまだ不要です。
```

---

## PoC 2

```text
文字起こし結果を固定プロンプトでAIへ送り、目的・タスク・期限・メモ・判断事項・次の一歩に構造化してください。
出力はJSON Schemaに沿った形にし、サーバー側でZod検証してください。
検証に失敗した場合は、raw outputとvalidation errorsを画面に表示してください。
```

---

## PoC 3

```text
検証済みのAI構造化結果をNeon PostgreSQLに保存してください。
work_captures、ai_parse_results、structured_itemsの3テーブルを使ってください。
tasksへの正式化はまだ不要です。
```

---

# 13. 現時点の結論

Work Capture のAI構造化は、以下の設計で進める。

```text
固定プロンプト
+
Structured Output / JSON Schema
+
Zodバリデーション
+
raw保存
+
人間による確定
```

AIに任せるのは意味の分類。

プログラムに任せるのは形式の保証。

人間に任せるのは最終判断。

> **AIは候補を作る。プログラムが検証する。人間が確定する。**
