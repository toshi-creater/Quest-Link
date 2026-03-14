# 実装ワークフロー

## ディレクトリ構成

```
project/                          ← メインリポジトリ（develop チェックアウト済み）
├── .worktrees/
│   ├── issue-12-auth/            ← worktree: feature/issue-12-auth
│   ├── issue-15-api/             ← worktree: feature/issue-15-api
│   └── issue-18-ui/              ← worktree: feature/issue-18-ui
```

---

## フェーズ1：事前準備（バッチ開始時に1回）

### 1-1. developブランチを最新化
```bash
cd /path/to/project
git checkout develop
git pull origin develop
```

### 1-2. Issueの優先度を確認し、着手順を決定
```bash
gh issue list --label "ready" --state open --json number,title,labels \
  --jq 'sort_by(.number) | .[] | "#\(.number) \(.title)"'
```

**依存関係がある場合は先行Issueを優先する。**

---

## フェーズ2：Issue着手（各Issueごとに繰り返す）

### 2-1. worktreeを作成しブランチを切る
```bash
# developの最新から分岐
git worktree add .worktrees/issue-{番号}-{概要} -b feature/issue-{番号}-{概要} develop
cd .worktrees/issue-{番号}-{概要}
```

### 2-2. 実装
- worktreeディレクトリ内で作業する
- コミットは機能単位で細かく行い、メッセージは `feat:` / `fix:` / `refactor:` 等の Conventional Commits に従う

### 2-3. 差分のセルフレビュー
```bash
git diff develop..HEAD --stat
git log develop..HEAD --oneline
```

### 2-4. ユーザーに確認を求める
> 以下の変更をプッシュしてPRを作成してよいですか？
> - 変更ファイル一覧
> - 実装内容の要約

### 2-5. 承認後、プッシュ＆PR作成
```bash
git push -u origin feature/issue-{番号}-{概要}

gh pr create \
  --base develop \
  --title "feat: {Issueタイトル}" \
  --body "## 概要
{変更内容の説明}

Closes #{番号}"
```

### 2-7. 次のIssueへ即座に着手（並列化のポイント）
> PR #XX を作成しました。レビュー待ちの間に次のIssue #{次の番号} に着手してよいですか？

**承認を得たら、フェーズ2-1 に戻り次のworktreeを作成する。**

---

## 運用ルール

### コンフリクト予防
- **同じファイルを触るIssueは直列にする**（並列化しない）
- Issue着手前に `git diff develop..feature/issue-{他ブランチ} --name-only` で重複ファイルを確認
- 大きなリファクタリングIssueは単独で処理する