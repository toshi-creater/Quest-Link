# API設計書 — 認証 API
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 2.0 | 2026年2月**

---

## 1. 概要

Google / X / Discord の3プロバイダに対応。複数プロバイダを同一アカウントに連携可能。募集リンク経由の部屋参加に限りゲストセッションを発行する。

### エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| POST | `/auth/{provider}/callback` | 不要 | OAuth コールバック・JWT 発行 |
| POST | `/auth/refresh` | 不要 | アクセストークンのリフレッシュ |
| POST | `/auth/logout` | 必要 | ログアウト・トークン無効化 |
| POST | `/auth/{provider}/link` | 必要 | 追加プロバイダを現アカウントに連携 |
| DELETE | `/auth/{provider}/unlink` | 必要 | プロバイダ連携の解除 |
| GET | `/auth/socket-token` | 必要（ユーザーまたはゲスト） | Socket.io 接続用短命トークン発行 |

> **注意**: ゲストセッション発行は独立したエンドポイントではなく、招待トークンによる参加 `POST /invite/{token}/join` の中でセッション発行・参加・Cookie付与を一括処理する。

**`{provider}` の値**: `google` / `x` / `discord`

### 認証フロー

取得した `accessToken` を `Authorization: Bearer <accessToken>` で送信する。有効期限は `expiresIn`（秒）で示され、期限切れ後はリフレッシュ API で再取得する。

---

## 2. OAuth コールバック

```
POST /auth/{provider}/callback
```

**認証**: 不要 ／ 初回ログイン時はユーザーが自動作成される

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `code` | string | ○ | プロバイダから発行された認可コード |

### レスポンス `200 OK`

```json
{
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "dGhpcyBp...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "isNewUser": true,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": null,
      "iconUrl": null,
      "avgRating": 0.00,
      "ratingCount": 0
    }
  }
}
```

`isNewUser: true` の場合、クライアントはプロフィール設定画面へ誘導する。`username` が `null` の間は部屋への参加・作成・チャットが利用不可。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `INVALID_CODE` | 認可コードが無効または期限切れ |
| 500 | `OAUTH_ERROR` | プロバイダとの通信に失敗 |

---

## 3. トークンリフレッシュ

```
POST /auth/refresh
```

**認証**: 不要（リフレッシュトークンを使用） ／ リフレッシュトークンの有効期限は30日

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `refreshToken` | string | ○ | リフレッシュトークン |

### レスポンス `200 OK`

```json
{
  "data": {
    "accessToken": "eyJhbGci...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 401 | `UNAUTHORIZED` | リフレッシュトークンが無効または期限切れ |

---

## 4. ログアウト

サーバー側でリフレッシュトークンを無効化する。クライアント側でもトークンを破棄すること。

```
POST /auth/logout
```

**認証**: 必要

### レスポンス `204 No Content`

---

## 4. ゲスト参加（招待トークン経由）

ゲストセッション発行・部屋参加・Cookie付与は `POST /invite/{token}/join` で一括処理する。
独立した `/auth/guest` エンドポイントは存在しない。

```
POST /invite/{token}/join
```

**認証**: 不要

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `token` | string | 64文字のhex招待トークン（`rooms.invite_token`） |

### リクエストボディ

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|-----|------|------|------|
| `displayName` | string | - | 50文字以内 | 表示名（省略時はランダムな `Guest{数字}` を自動設定） |

### レスポンス `200 OK`

```json
{
  "data": {
    "roomId": "770e8400-...",
    "guestSessionId": "guest_a3f8c2e1d4b7f09e2c5a8b3d6e1f4a7c",
    "isGuest": true,
    "joinedAt": "2026-02-20T22:05:00Z"
  }
}
```

ゲストセッション ID は `Set-Cookie: quest_link_guest_session=<id>; HttpOnly; SameSite=Lax; Max-Age=86400` でも返却される。  
ゲストセッション ID の形式: `guest_` + 32桁hex（`randomBytes(16).toString("hex")`）。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `ROOM_CLOSED` | 終了済みの部屋にはゲスト参加不可 |
| 404 | `INVITE_NOT_FOUND` | 招待トークンが無効（存在しない・閉鎖済み） |
| 409 | `ALREADY_JOINED` | 同一ゲストセッションで既に参加中 |
| 409 | `ROOM_FULL` | 定員に達している |

---

## 6. プロバイダ連携追加

ログイン済みアカウントに別プロバイダを追加連携する。

```
POST /auth/{provider}/link
```

**認証**: 必要

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `code` | string | ○ | 追加するプロバイダの認可コード |

### レスポンス `204 No Content`

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `INVALID_CODE` | 認可コードが無効 |
| 409 | `PROVIDER_ALREADY_LINKED` | そのプロバイダは既に別アカウントに紐づいている |

---

## 7. プロバイダ連携解除

```
DELETE /auth/{provider}/unlink
```

**認証**: 必要 ／ 最後の1プロバイダは解除不可

### レスポンス `204 No Content`

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `LAST_PROVIDER` | 唯一のプロバイダは解除できない |
| 404 | `PROVIDER_NOT_LINKED` | そのプロバイダは連携されていない |

---

---

## 8. Socket.io 接続用トークン発行

Socket.io のクロスドメイン接続（本番環境）向けに、60秒有効の短命 JWT を発行する。
クライアントはこのトークンを `io.connect({ auth: { token } })` に渡す。

```
GET /auth/socket-token
```

**認証**: ユーザーセッション Cookie または `quest_link_guest_session` Cookie のいずれか

### レスポンス `200 OK`

```json
{ "token": "<JWT文字列>" }
```

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 401 | `UNAUTHORIZED` | 有効なセッションもゲストセッションも存在しない |

### 備考

- トークンの有効期限は **60秒**。接続直前に取得して即座に使用すること
- ゲストの場合は現在アクティブな部屋参加（`leftAt IS NULL`）が必要
- salt: `"socket-auth"`（セッション Cookie の salt とは分離）

---

*以上*
