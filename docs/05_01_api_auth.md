# API設計書 — 認証 API
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 1.0 | 2026年2月**

---

## 目次

1. [概要](#1-概要)
2. [Google OAuth コールバック](#2-google-oauth-コールバック)
3. [トークンリフレッシュ](#3-トークンリフレッシュ)
4. [ログアウト](#4-ログアウト)

---

## 1. 概要

### 1.1 認証フロー

```
クライアント
    │
    ├─① Google OAuth 認証画面へリダイレクト（クライアント側処理）
    │
    ├─② 認可コード（code）を受け取る
    │
    └─③ POST /auth/google/callback へ code を送信
            │
            └─ サーバーが Google と通信し JWT を発行して返却
```

### 1.2 JWT の利用

取得した `accessToken` はすべての認証必須エンドポイントで `Authorization` ヘッダーに付与する。

```
Authorization: Bearer <accessToken>
```

`accessToken` の有効期限は `expiresIn`（秒）で示される。期限切れ後は **トークンリフレッシュ** API で再取得する。

### 1.3 エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| POST | `/auth/google/callback` | 不要 | Google OAuth コールバック・JWT 発行 |
| POST | `/auth/refresh` | 不要 | アクセストークンのリフレッシュ |
| POST | `/auth/logout` | 必要 | ログアウト・トークン無効化 |

---

## 2. Google OAuth コールバック

Google 認証後に発行された認可コードを受け取り、JWT を発行する。

```
POST /auth/google/callback
```

**認証**: 不要

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `code` | string | ○ | Google から発行された認可コード |

```json
{
  "code": "4/0AfgeXvs..."
}
```

### レスポンス `200 OK`

初回ログイン時はユーザーが自動作成される。

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "gamer123",
      "iconUrl": "https://example.com/icon.png",
      "avgRating": 0.00,
      "ratingCount": 0
    }
  }
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `accessToken` | string | API アクセス用 JWT |
| `refreshToken` | string | トークン再取得用（有効期限: 30日） |
| `tokenType` | string | 常に `"Bearer"` |
| `expiresIn` | integer | アクセストークンの有効期限（秒） |
| `user` | object | ログインユーザーの基本情報 |

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 400 | `INVALID_CODE` | 認可コードが無効または期限切れ |
| 500 | `OAUTH_ERROR` | Google との通信に失敗 |

---

## 3. トークンリフレッシュ

アクセストークンの有効期限が切れた際に、リフレッシュトークンを使って新しいアクセストークンを取得する。

```
POST /auth/refresh
```

**認証**: 不要（リフレッシュトークンを使用）

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `refreshToken` | string | ○ | リフレッシュトークン |

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

### レスポンス `200 OK`

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

> リフレッシュトークン自体は更新されない。リフレッシュトークンの有効期限（30日）が切れた場合は再度ログインが必要。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 401 | `UNAUTHORIZED` | リフレッシュトークンが無効または期限切れ |

---

## 4. ログアウト

サーバー側でリフレッシュトークンを無効化する。

```
POST /auth/logout
```

**認証**: 必要

### リクエストボディ

なし

### レスポンス `204 No Content`

> クライアント側でもアクセストークンおよびリフレッシュトークンを破棄すること。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 401 | `UNAUTHORIZED` | トークンが無効または期限切れ |
