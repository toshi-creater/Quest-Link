# k6 負荷テスト — Quest Link

## 前提条件

- [k6](https://k6.io/docs/get-started/installation/) インストール済み（`brew install k6`）
- Node.js 18+ / `npx tsx` が使える環境
- テストデータ 200 部屋・500 ユーザーが投入済みであること（`pnpm db:seed:load` シード投入）

## ディレクトリ構成

```
load-test/
├── tests/
│   ├── config.js                # BASE_URL / WS_URL / THRESHOLDS 共通設定
│   ├── phase1-baseline.js       # Phase 1: ベースライン（VU 10→50→100→0）
│   ├── phase2-peak.js           # Phase 2: ピーク（VU 500、10分維持）
│   ├── phase3-spike.js          # Phase 3: スパイク（30秒で VU 10→500）
│   ├── phase4-websocket.js      # Phase 4: WS 耐久（VU 100、60分）
│   ├── phase5-chat-load.js      # Phase 5: チャット同時送信（VU 100、25部屋分散、6分）
│   └── phase6-chat-max-room.js  # Phase 6: 満員16人部屋 fan-out（VU 80、5部屋、6分）
├── scripts/
│   ├── get-cookies.ts           # staging から session-token cookie を CSV 取得
│   └── analyze-chat-load.py     # Phase 5/6 結果を分単位で集計・表示
└── results/                     # k6 出力先（.gitignore 済み）
```

## 事前準備: Cookie の取得

k6 スクリプトはすべて `load-test/cookies.csv` を参照する。テスト前に以下を実行して生成すること。

```bash
# テストアカウント 50 件分を環境変数で指定する場合
export STAGING_URL=https://quest-link.up.railway.app
export TEST_ACCOUNTS_FILE=./test-accounts.txt  # 1行に "email:password" の形式

npx tsx load-test/scripts/get-cookies.ts
```

`cookies.csv` のフォーマット:

```
email,token
test1@example.com,<authjs.session-token>
test2@example.com,<authjs.session-token>
...
```

> **注意**: `cookies.csv` は `.gitignore` に追加されており、リポジトリにはコミットされない。

## 実行順序

環境変数でエンドポイントを指定できる（省略時は staging のデフォルト URL を使用）:

```bash
export BASE_URL=https://quest-link.up.railway.app
export WS_URL=wss://quest-link-socket.up.railway.app
```

### Phase 1 — ベースライン（所要時間: 約 15 分）

```bash
k6 run load-test/tests/phase1-baseline.js \
  --out json=load-test/results/phase1.json
```

**判定基準**: エラー率 0%、P95 < 500ms

### Phase 2 — ピーク負荷（所要時間: 約 20 分）

```bash
k6 run load-test/tests/phase2-peak.js \
  --out json=load-test/results/phase2.json
```

**判定基準**: VU 500 / RPS ≈ 50 を 10 分維持、エラー率 < 1%、P95 < 500ms

### Phase 3 — スパイク（所要時間: 約 10 分）

```bash
k6 run load-test/tests/phase3-spike.js \
  --out json=load-test/results/phase3.json
```

**判定基準**: スパイク後 30 秒以内に P95 < 1000ms に回復

### Phase 4 — WebSocket 耐久（所要時間: 約 60 分）

```bash
k6 run load-test/tests/phase4-websocket.js \
  --out json=load-test/results/phase4.json
```

**判定基準**:
- WS 接続成功率 > 99%
- 60 分維持後にメモリリーク・接続枯渇がない（Railway コンソールのメモリグラフで確認）
- `chat:message` が 2 ノード双方のクライアントに届くことを別 WS クライアントで確認

### Phase 5 — チャット同時送信スモークテスト（所要時間: 約 6 分）

100 VU を 25 部屋（4 VU/部屋）に分散し、10 秒間隔でチャット送信を継続。
現実的ピーク負荷での socket-server / Redis / DB の健全性を検証する。

```bash
# シードデータ投入（200 部屋・500 ユーザー）
pnpm db:seed:load

cd load-test
k6 run tests/phase5-chat-load.js \
  --out json=results/phase5-chat-load.json
```

**判定基準**:
- WS 接続成功率 > 99%
- `http_req_failed` < 1%（socket-token 取得エラー）
- `recv/sent` 比が 4 前後（25 部屋 × 4 VU/部屋の fan-out ロストがないこと）

結果の分析:

```bash
python3 scripts/analyze-chat-load.py results/phase5-chat-load.json
```

### Phase 6 — 満員16人部屋 fan-out スモークテスト（所要時間: 約 6 分）

80 VU を `maxPlayers=16` の waiting 部屋 5 室（16 VU/部屋）に分散し、
満員部屋が複数同時並行する際の fan-out コストを検証する。

```bash
# シードデータ投入（末尾 5 件が maxPlayers=16 の waiting 部屋として投入される）
pnpm db:seed:load

cd load-test
k6 run tests/phase6-chat-max-room.js \
  --out json=results/phase6-chat-max-room.json
```

**判定基準**:
- WS 接続成功率 > 99%
- `http_req_failed` < 1%
- `recv/sent` 比が 16 前後（満員 fan-out ロストがないこと）

結果の分析:

```bash
python3 scripts/analyze-chat-load.py results/phase6-chat-max-room.json
```

## レポート出力

JSON 出力を k6 の [Web Dashboard](https://grafana.com/docs/k6/latest/results-output/web-dashboard/) や Grafana で可視化する場合:

```bash
k6 run --out web-dashboard load-test/tests/phase2-peak.js
```

## 注意事項

- `cookies.csv` が古い場合（セッション期限切れ）は `get-cookies.ts` を再実行すること。

## クリーンアップ

```bash
# 結果ファイルの削除
rm -rf load-test/results/*

# cookie の削除
rm -f load-test/cookies.csv
```
