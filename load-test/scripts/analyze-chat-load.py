#!/usr/bin/env python3
"""
phase5-chat-load.json / phase6-chat-max-room.json の結果を解析して
WebSocket メトリクスを分単位で集計する

使い方:
  python3 load-test/scripts/analyze-chat-load.py load-test/results/phase5-chat-load.json
  python3 load-test/scripts/analyze-chat-load.py load-test/results/phase6-chat-max-room.json
"""
import json
import sys
from collections import defaultdict

if len(sys.argv) < 2:
    print("Usage: python3 analyze-chat-load.py <result.json>")
    sys.exit(1)

vus_by_min = defaultdict(list)
ws_conn_by_min = defaultdict(list)
sent_by_min = defaultdict(list)
recv_by_min = defaultdict(list)
http_err_by_min = defaultdict(list)

with open(sys.argv[1]) as f:
    for line in f:
        try:
            rec = json.loads(line.strip())
        except Exception:
            continue
        if rec.get("type") != "Point":
            continue
        t = rec["data"]["time"][:16]  # 分単位バケット
        v = rec["data"]["value"]
        m = rec["metric"]

        if m == "vus":
            vus_by_min[t].append(v)
        elif m == "ws_connect_success":
            ws_conn_by_min[t].append(v)
        elif m == "chat_sent":
            sent_by_min[t].append(v)
        elif m == "chat_received":
            recv_by_min[t].append(v)
        elif m == "http_req_failed":
            http_err_by_min[t].append(v)

all_minutes = sorted(
    set(vus_by_min) | set(ws_conn_by_min) | set(sent_by_min) | set(recv_by_min) | set(http_err_by_min)
)

print(
    f"{'Time':<18} {'VUs':>5} {'ws_conn_rate':>12} {'sent/s':>7} {'recv/s':>7} {'recv/sent':>10} {'http_err':>9} {'Status'}"
)
print("-" * 85)

for minute in all_minutes:
    vus = vus_by_min.get(minute, [0])
    ws_conn = ws_conn_by_min.get(minute, [])
    sent = sent_by_min.get(minute, [])
    recv = recv_by_min.get(minute, [])
    http_err = http_err_by_min.get(minute, [])

    avg_vus = sum(vus) / len(vus) if vus else 0
    ws_conn_rate = sum(ws_conn) / len(ws_conn) if ws_conn else 0
    sent_per_s = sum(sent) / 60 if sent else 0
    recv_per_s = sum(recv) / 60 if recv else 0
    recv_sent_ratio = (sum(recv) / sum(sent)) if sent and sum(sent) > 0 else 0
    http_err_rate = sum(http_err) / len(http_err) if http_err else 0

    ok = ws_conn_rate > 0.99 and http_err_rate < 0.01
    status = "OK" if ok else "FAIL"

    print(
        f"{minute:<18} {avg_vus:>5.0f} {ws_conn_rate:>12.2%} {sent_per_s:>7.2f} "
        f"{recv_per_s:>7.2f} {recv_sent_ratio:>10.1f} {http_err_rate:>9.2%} {status}"
    )
