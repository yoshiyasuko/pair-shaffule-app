# ペア抽選アプリ

[![Deploy](https://github.com/yoshiyasuko/pair-shaffule-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/yoshiyasuko/pair-shaffule-app/actions/workflows/deploy.yml)

Google スプレッドシートのメンバーリストからランダムにペアを生成し、カードめくりアニメーションで発表する Google Apps Script Webアプリ。

## 機能

- スプレッドシートからチェックボックスで有効なメンバーを読み込み
- Fisher-Yatesアルゴリズムによるランダムシャッフル＆ペア生成
- カードめくりアニメーションで順番にペアを発表
- 奇数人数時は「お一人様」カードをスポットライト＋ドラムロール演出で発表
- Web Audio APIによる効果音（フリップ音・ファンファーレ・ドラムロール）
- Canvas紙吹雪アニメーション
- サウンドON/OFF切り替え
- メンバーリストの再読み込み・再シャッフル
- 抽選結果をテンプレートベースでスプレッドシートにエクスポート

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/)
- [clasp](https://github.com/google/clasp)（`npm install -g @google/clasp`）
- `clasp login` でGoogleアカウント認証済み

### 手順

1. リポジトリをクローン

   ```bash
   git clone <repository-url>
   cd pair-shuffle-app
   ```

2. GASプロジェクトを作成し、`.clasp.json` を配置

   ```bash
   clasp create --type webapp --title "ペアリング抽選会"
   ```

   または既存のプロジェクトに紐づける場合は `.clasp.json` に `scriptId` を設定。

3. スプレッドシートを準備
   - 新規スプレッドシートを作成
   - シート名を `Members` に変更
   - A列にチェックボックス、B列に名前を入力（1行目はヘッダー）

4. スクリプトプロパティを設定
   - GASエディタ → プロジェクトの設定 → スクリプトプロパティ
   - キー: `SPREADSHEET_ID`、値: メンバーリストのスプレッドシートID
   - キー: `EXPORT_TEMPLATE_SPREADSHEET_ID`、値: エクスポート用テンプレートのスプレッドシートID

## ブランチ戦略

[GitHub Flow](https://docs.github.com/ja/get-started/using-github/github-flow) を採用。`main` ブランチが常にデプロイ可能な状態を維持し、機能追加・修正はフィーチャーブランチからPRを通じて `main` にマージする。

## デプロイ

### 手動デプロイ

```bash
clasp push          # ローカルファイルをGASにプッシュ
clasp deploy        # 新しいデプロイを作成
clasp open --webapp # デプロイ済みWebアプリを開く
```

### 自動デプロイ（GitHub Actions）

mainブランチへのPRマージ時に自動でproductionデプロイが実行される。GitHub Actionsタブから手動実行も可能。

## スプレッドシートの形式

「Members」シート:

| A列（チェックボックス） | B列（名前） |
|:---:|:---|
| ☑ | 田中太郎 |
| ☑ | 鈴木花子 |
| ☐ | 佐藤次郎（対象外） |

- 1行目はヘッダー（読み飛ばされる）
- A列のチェックボックスがONの行のみ抽選対象

## 使い方

1. Webアプリを開くとメンバーリストが自動で読み込まれる
2. 「抽選スタート！」をクリックしてカード画面へ
3. 「ペア発表！」をクリックするとカードが順番にめくられる
4. 全カードめくり完了後、「もう一度」で再シャッフル可能
5. 「抽選結果をスプレッドシートに出力」ボタンで結果をエクスポート
