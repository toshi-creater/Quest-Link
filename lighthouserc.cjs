// @ts-check
'use strict';

// ローカル実行時に .env.local / .env を読み込む（CI では process.env に直接注入済み）
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const BASE_URL = process.env.LHCI_COLLECT_URL ?? 'http://localhost:3000';
// prisma/seed.ts の TEST_ROOM_ID に合わせた固定 UUID
const ROOM_ID = process.env.LHCI_ROOM_ID ?? '00000000-0000-0000-0000-000000000001';
// ゲーム ID は DB 依存のため環境変数で注入（未設定時はそのページをスキップ）
const GAME_ID = process.env.LHCI_GAME_ID ?? '';

/** @type {import('@lhci/cli').LighthouseRcConfig} */
module.exports = {
  ci: {
    collect: {
      url: [
        `${BASE_URL}/`,
        `${BASE_URL}/games`,
        ...(GAME_ID ? [`${BASE_URL}/games/${GAME_ID}/rooms`] : []),
        `${BASE_URL}/rooms/${ROOM_ID}`,
        // WebSocket を使うチャット画面は pre-join（入室前）の静的状態で計測する
        `${BASE_URL}/rooms/${ROOM_ID}/chat`,
      ],
      numberOfRuns: 3,
      puppeteerScript: './lhci-auth.cjs',
      puppeteerLaunchOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      settings: {
        formFactor: 'mobile',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 4,
        },
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interaction-to-next-paint': ['warn', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
