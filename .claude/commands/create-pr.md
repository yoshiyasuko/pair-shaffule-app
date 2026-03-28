PRを作成・更新する。未コミット変更の処理からPR作成、プレビューデプロイまでの一連のフローを自動化する。同じブランチから既存PRがある場合はpull→push→本文更新で対応する。

## 手順

### 1. 現在の状態を把握

以下を並列で実行：
- `git status` — 未コミットの変更を確認
- `git branch --show-current` — 現在のブランチ名を取得
- `git log --oneline -20` — 直近のコミット履歴を確認

### 2. mainブランチチェック

現在のブランチが `main` の場合、PRは作成できない。警告を表示して処理を終了する。

### 3. 未コミット変更の処理

未コミットの変更がある場合、AskUserQuestionツールで確認する：
- 質問文: 「未コミットの変更があります。コミットしてからPRを作成しますか？」
- 選択肢: ["コミットしてPR作成", "PR作成を中止"]
- 「コミットしてPR作成」→ Skillツールで `commit` スキルを実行。ただしプッシュ・デプロイの確認ステップ（commit スキルの手順7・8）はスキップするよう指示する。
- 「PR作成を中止」→ 処理を終了

変更がなければそのまま次へ進む。

### 4. ベースブランチの確認

AskUserQuestionツールで確認する：
- 質問文: 「ベースブランチはどれにしますか？」
- 選択肢: ["main（推奨）", "その他"]

### 5. 既存PRの確認

同じブランチから同じベースブランチへのオープンなPRがあるか確認する：
```bash
gh pr list --head <現在のブランチ> --base <ベースブランチ> --state open --json number,title,url
```

- **既存PRがある場合** → 手順6（既存PR更新）へ
- **既存PRがない場合** → 手順7（新規PR作成）へ

### 6. 既存PRの更新

まずベースブランチの最新を取得する。fetchすることで `origin/<ベースブランチ>` が最新になり、差分分析が正確になる。

```bash
git fetch origin <ベースブランチ>
```

次に、ベースブランチが自分のブランチより先に進んでいるかを確認する：
```bash
git merge-base --is-ancestor origin/<ベースブランチ> HEAD
```

- **終了コード0（ベースが祖先＝追いついている）** → rebase不要。通常の `git push` でプッシュする。
- **終了コード1（ベースが先に進んでいる）** → rebaseが必要。rebase後に `git push --force-with-lease` でプッシュする。rebaseでコンフリクトが発生した場合は状況を表示してユーザーに判断を委ねる。

```bash
# rebaseが必要な場合のみ
git rebase origin/<ベースブランチ>
git push --force-with-lease

# rebase不要の場合
git push
```

次に、ベースブランチとの差分を分析してPRのタイトルと本文を再生成する：
```bash
git log origin/<ベースブランチ>...HEAD --oneline
git diff origin/<ベースブランチ>...HEAD
```

差分の分析結果からPRを更新する：
```bash
gh pr edit <PR番号> --title "<新しいタイトル>" --body "$(cat <<'EOF'
## 変更概要
- ...
EOF
)"
```

次に、assigneeが設定されていなければ自分をassignする：
```bash
# assigneesが空の場合のみ設定
gh pr view <PR番号> --json assignees --jq '.assignees[].login' | head -1
# 出力が空なら:
gh pr edit <PR番号> --add-assignee @me
```

更新後、手順9へ進む。

### 7. リモートへのプッシュ

まずベースブランチの最新を取得してrebaseし、最新の差分でPRを作成できるようにする。

```bash
git fetch origin <ベースブランチ>
git rebase origin/<ベースブランチ>
git push -u origin <現在のブランチ>
```

rebaseでコンフリクトが発生した場合は状況を表示してユーザーに判断を委ねる。プッシュに失敗した場合はエラーを表示して処理を終了する。

### 8. PR作成

ベースブランチからの全変更を分析し、PRタイトルと本文を生成する：
```bash
git log origin/<ベースブランチ>...HEAD --oneline
git diff origin/<ベースブランチ>...HEAD
```

PRのタイトルはConventional Commits形式（`<type>(<scope>): <subject>`）で英語で記述する。70文字以内に収める。本文は日本語で、変更の「何を」ではなく「なぜ」「何のために」を重視する。

本文フォーマット：
```markdown
## 変更概要
- 変更点1
- 変更点2
```

```bash
gh pr create --base <ベースブランチ> --assignee @me --title "<タイトル>" --body "$(cat <<'EOF'
## 変更概要
- ...
EOF
)"
```

### 9. プレビューデプロイの確認

AskUserQuestionツールで確認する：
- 質問文: 「プレビューデプロイしますか？」
- 選択肢: ["デプロイする", "スキップ"]
- 「デプロイする」→ Skillツールで `preview-deploy` スキルを実行

### 10. 結果の表示

PR作成・更新の結果を表示する：
- PR番号とURL
- PRタイトル
- 新規作成か更新かの区別
