import { SharedArray } from "k6/data";

export const BASE_URL = __ENV.BASE_URL || "https://quest-link.up.railway.app";
export const WS_URL = __ENV.WS_URL || "wss://quest-link-socket.up.railway.app";

export const COOKIES = new SharedArray("cookies", function () {
  const raw = open("../cookies.csv");
  return raw
    .trim()
    .split("\n")
    .slice(1) // skip header row
    .map((line) => {
      const [email, token] = line.split(",");
      return { email: email.trim(), token: token.trim() };
    });
});

export const THRESHOLDS = {
  http_req_failed: [{ threshold: "rate<0.01", abortOnFail: false }],
  http_req_duration: [
    { threshold: "p(95)<500", abortOnFail: false },
    { threshold: "p(99)<1000", abortOnFail: false },
  ],
};

// Pick a cookie for the current VU (round-robin)
export function getCookieForVU() {
  const idx = (__VU - 1) % COOKIES.length;
  return COOKIES[idx];
}

export function authHeaders(token) {
  return {
    Cookie: `authjs.session-token=${token}`,
    "Content-Type": "application/json",
  };
}
