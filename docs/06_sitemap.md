# サイトマップ
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 1.0 | 2026年2月**

---

## 画面一覧

```
/
├── /login                          # ログイン画面
│   └── /auth/callback              # Google OAuth コールバック（リダイレクト先）
│
├── /rooms                          # 部屋一覧画面（メインページ）
│   ├── /rooms/new                  # 部屋作成画面
│   └── /rooms/[roomId]             # 部屋詳細画面
│       ├── /rooms/[roomId]/chat    # チャット画面（部屋詳細内タブ or ページ）
│       └── /rooms/[roomId]/ratings # セッション終了後の評価画面
│
└── /users
    ├── /users/me                   # 自分のプロフィール画面
    │   ├── /users/me/edit          # プロフィール編集画面
    │   ├── /users/me/rooms         # 参加中の部屋画面（最大1件・空の場合はメッセージ表示）
    │   └── /users/me/history       # 部屋参加履歴画面
    └── /users/[userId]             # 他ユーザーのプロフィール画面
```

---

## 画面詳細

### 認証

| パス | 画面名 | 主な機能 | 使用 API |
|------|--------|---------|---------|
| `/login` | ログイン | Google ログインボタン表示 | - |
| `/auth/callback` | OAuthコールバック | 認可コードを受け取り JWT を取得・保存し `/rooms` へリダイレクト | `POST /auth/google/callback` |

---

### 部屋

| パス | 画面名 | 主な機能 | 使用 API |
|------|--------|---------|---------|
| `/rooms` | 部屋一覧 | 募集中の部屋を一覧表示、ゲームタイトル・タグで絞り込み、ページネーション | `GET /rooms` |
| `/rooms/new` | 部屋作成 | タイトル・ゲームタイトル・最大人数・説明・タグを入力して部屋を作成 | `GET /play-style-tags`、`POST /rooms` |
| `/rooms/[roomId]` | 部屋詳細 | 部屋情報・参加者一覧表示、参加 / 退室 / 解散、ホストによる部屋情報編集、リアルタイム参加者更新（WebSocket） | `GET /rooms/{roomId}`、`POST /rooms/{roomId}/join`、`POST /rooms/{roomId}/leave`、`POST /rooms/{roomId}/close`、`PATCH /rooms/{roomId}` |
| `/rooms/[roomId]/chat` | チャット | リアルタイムチャット送受信（WebSocket）、過去ログのスクロール読み込み（カーソルページネーション） | `GET /rooms/{roomId}/messages`、WebSocket `chat:send` / `chat:message` |
| `/rooms/[roomId]/ratings` | セッション評価 | 部屋クローズ後に同室メンバーを評価（スコア・コメント）、評価期限（24時間）表示 | `GET /rooms/{roomId}/pending-ratings`、`POST /ratings` |

---

### ユーザー

| パス | 画面名 | 主な機能 | 使用 API |
|------|--------|---------|---------|
| `/users/me` | 自分のプロフィール | 自分のユーザー名・アイコン・自己紹介・平均評価・プレイスタイルタグ・受け取った評価一覧を表示 | `GET /users/me`、`GET /users/{userId}/ratings` |
| `/users/me/edit` | プロフィール編集 | ユーザー名・アイコン URL・自己紹介・プレイスタイルタグを編集 | `GET /play-style-tags`、`PATCH /users/me` |
| `/users/me/rooms` | 参加中の部屋 | 現在参加中の部屋（最大1件）を表示。参加中がなければ空状態メッセージを表示。部屋詳細へ遷移可能 | `GET /users/me/rooms?active=true` |
| `/users/me/history` | 参加履歴 | 過去に参加した部屋の一覧をページネーション付きで表示 | `GET /users/me/rooms` |
| `/users/[userId]` | 他ユーザープロフィール | 他ユーザーのプロフィール情報・受け取った評価一覧を表示 | `GET /users/{userId}`、`GET /users/{userId}/ratings` |

---

## 画面遷移フロー

```
未ログイン
    └─→ /login
            └─→ Google 認証
                    └─→ /auth/callback（JWT取得）
                            └─→ /rooms（メインページ）

/rooms（部屋一覧）
    ├─→ /rooms/new（部屋作成）
    │       └─→ 作成成功 → /rooms/[roomId]（部屋詳細）
    │
    └─→ /rooms/[roomId]（部屋詳細）
            ├─→ /rooms/[roomId]/chat（チャット）
            └─→ 部屋クローズ後 → /rooms/[roomId]/ratings（評価画面）
                    └─→ 評価完了 → /rooms（部屋一覧）

/rooms（部屋一覧）
    └─→ /users/[userId]（他ユーザープロフィール）

ヘッダーナビゲーション（全画面共通）
    ├─→ /rooms（部屋一覧）
    ├─→ /users/me/rooms（参加中の部屋）
    ├─→ /users/me（自分のプロフィール）
    │       ├─→ /users/me/edit（編集）
    │       ├─→ /users/me/rooms（参加中の部屋）
    │       └─→ /users/me/history（参加履歴）
    └─→ ログアウト（POST /auth/logout → /login）
```

---

## WebSocket 接続タイミング

| タイミング | イベント |
|-----------|---------|
| 部屋詳細画面を開く | `room:join` で部屋チャンネルに参加 |
| チャットメッセージ送信 | `chat:send` |
| チャットメッセージ受信 | `chat:message` |
| 他ユーザーの入退室 | `room:user_joined` / `room:user_left` |
| ホスト変更 | `room:host_changed` |
| 部屋解散 | `room:closed` → 評価画面へ遷移 |
| 部屋詳細画面を離れる | `room:leave` で部屋チャンネルから退出 |

---

*以上*
