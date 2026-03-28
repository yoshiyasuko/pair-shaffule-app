# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Google Apps Script (GAS) のWebアプリ。Google スプレッドシートの「Members」シートからメンバーリストを読み込み、ランダムにペアを生成してカードめくりアニメーションで発表する。

## デプロイ

**clasp** (Command Line Apps Script) を使用してローカル開発・デプロイを行う。ビルド、リンター、テストフレームワークは未導入。

```bash
clasp push          # ローカルファイルをGASにプッシュ
clasp pull          # GASからリモートの変更を取得
clasp deploy        # 新しいデプロイを作成
clasp open          # GASエディタで開く
clasp open --webapp # デプロイ済みWebアプリを開く
```

### CI/CD 自動デプロイ

GitHub Actionsにより、mainブランチへのPRマージ時に自動でproductionデプロイが実行される。手動実行（workflow_dispatch）も可能。認証にはOAuthリフレッシュトークンを使用（GitHub Secretsに `CLASPRC_JSON` と `GAS_DEPLOYMENT_ID` を設定）。

## アーキテクチャ

- **src/server/Code.js** — サーバーサイドGAS関数。`doGet()`でWebアプリを配信。`getEmployeeList()`でスプレッドシートからメンバーリストを取得（A列=チェックボックス有効、B列=名前）。`exportPairsToSpreadsheet()`でペア結果をテンプレートスプレッドシートのコピーに出力。スクリプトプロパティ: `SPREADSHEET_ID`（メンバーリスト）、`EXPORT_TEMPLATE_SPREADSHEET_ID`（エクスポート用テンプレート）。
- **src/client/Index.html** — メインHTMLテンプレート。GASの`include()`ヘルパーでCSS/JSをインライン展開。
- **src/client/Stylesheet.html** — 全CSS（`<?!= include('Stylesheet'); ?>`でインライン化）。
- **src/client/JavaScript.html** — 全クライアントサイドJS（`<?!= include('JavaScript'); ?>`でインライン化）。単一のIIFEで、状態管理・Fisher-Yatesシャッフル・ペア生成・カード描画・Web Audio API効果音・Canvas紙吹雪アニメーションを含む。
- **src/appsscript.json** — GASマニフェスト（タイムゾーン: Asia/Tokyo、ランタイム: V8、Webアプリアクセス: MYSELF、OAuthスコープ: spreadsheets・drive）。
- **.clasp.json** — clasp設定（スクリプトID、`rootDir: "src"`）。
- **.github/workflows/deploy.yml** — GitHub Actionsワークフロー。mainへのPRマージ時にclasp push→deployを自動実行。

## 設計上のポイント

- クライアントからサーバー関数の呼び出しは `google.script.run` パターンを使用。
- 奇数人数の場合、最後に「お一人様」カードが生成され、スポットライト＋ドラムロール演出が入る。
- UIは全て日本語。

## スキル（スラッシュコマンド）

`.claude/commands/` にプロジェクト固有のスキルを定義している。`/<スキル名>` で呼び出す。

| コマンド | 概要 |
|---------|------|
| `/commit` | Conventional Commits形式でコミットを作成。変更を論理単位に分割し、プッシュ・デプロイまで一気通貫で実行できる。 |
| `/deploy` | GASへのproductionデプロイを実行。未コミット変更の検出→commit→git push→clasp push→clasp deployの一連のフローを自動化。 |
| `/preview-deploy` | GASへのプレビューデプロイを作成。productionデプロイとは別に `[PREVIEW]` プレフィックス付きデプロイを作成・管理する。 |
| `/kill-all-preview` | プレビューデプロイを全て削除。`[PREVIEW]` プレフィックス付きデプロイのみを対象とし、productionデプロイには触れない。 |
| `/update-docs` | コード変更後にREADME.md/CLAUDE.mdの更新が必要かを判断し、必要なら更新する。`/commit` からも自動呼び出しされる。 |
| `/create-pr` | PRを作成・更新する。未コミット変更の処理からPR作成、プレビューデプロイまでの一連のフローを自動化。既存PRがあれば本文を更新する。 |

### スキル間の連携

```
/commit → /update-docs → (プッシュ確認) → (デプロイ確認) → /deploy
/deploy → (未コミット検出時) → /commit → デプロイ続行
/preview-deploy → (未コミット検出時) → /commit → プレビューデプロイ続行
/kill-all-preview → プレビューデプロイの一括削除
/create-pr → (未コミット検出時) → /commit → push → PR作成 → /preview-deploy
```

どちらのデプロイスキルからでも開始でき、必要に応じて `/commit` を呼び出す。
