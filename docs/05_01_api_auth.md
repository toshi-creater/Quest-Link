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
| POST | `/auth/guest` | 不要 | ゲストセッション発行 |
| POST | `/auth/{provider}/link` | 必要 | 追加プロバイダを現アカウントに連携 |
| DELETE | `/auth/{provider}/unlink` | 必要 | プロバイダ連携の解除 |

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

## 4. ゲストセッション発行

募集リンク経由で部屋に参加する際にゲストセッションを発行する。発行されたセッション ID は Cookie（HttpOnly）に保存され、有効期限は24時間。

```
POST /auth/guest
```

**認証**: 不要

### リクエストボディ

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|-----|------|------|------|
| `roomId` | string (UUID) | ○ | - | 参加対象の部屋 ID |
| `displayName` | string | - | 1〜50文字 | 表示名（省略時はサーバーが `guest_xxxxxxxx` を自動設定） |

### レスポンス `200 OK`

```json
{
  "data": {
    "guestId": "guest_a1b2c3d4",
    "displayName": "ゲスト参加者",
    "expiresAt": "2026-02-21T22:00:00Z"
  }
}
```

セッション ID は `Set-Cookie: guest_session=<token>; HttpOnly; Secure` でも返却される。以降のリクエストでは Cookie が自動送信されるため、追加のヘッダー設定は不要。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `ROOM_CLOSED` | 終了済みの部屋にはゲスト参加不可 |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |
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

*以上*
