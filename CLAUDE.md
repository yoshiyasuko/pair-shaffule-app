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

## アーキテクチャ

- **src/server/Code.js** — サーバーサイドGAS関数。`doGet()`でWebアプリを配信。`getEmployeeList()`でスプレッドシートからメンバーリストを取得（A列=チェックボックス有効、B列=名前）。スプレッドシートIDはスクリプトプロパティ（`SPREADSHEET_ID`）から取得。
- **src/client/Index.html** — メインHTMLテンプレート。GASの`include()`ヘルパーでCSS/JSをインライン展開。
- **src/client/Stylesheet.html** — 全CSS（`<?!= include('Stylesheet'); ?>`でインライン化）。
- **src/client/JavaScript.html** — 全クライアントサイドJS（`<?!= include('JavaScript'); ?>`でインライン化）。単一のIIFEで、状態管理・Fisher-Yatesシャッフル・ペア生成・カード描画・Web Audio API効果音・Canvas紙吹雪アニメーションを含む。
- **src/appsscript.json** — GASマニフェスト（タイムゾーン: Asia/Tokyo、ランタイム: V8、Webアプリアクセス: MYSELF）。
- **.clasp.json** — clasp設定（スクリプトID、`rootDir: "src"`）。

## 設計上のポイント

- クライアントからサーバー関数の呼び出しは `google.script.run` パターンを使用。
- 奇数人数の場合、最後に「お一人様」カードが生成され、スポットライト＋ドラムロール演出が入る。
- UIは全て日本語。
