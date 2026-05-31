#!/usr/bin/env python3
"""
phase2-discovery.json の結果を解析してVU別エラー率・レイテンシを集計する

使い方:
  python3 load-test/scripts/analyze-discovery.py load-test/results/phase2-discovery.json
"""
import json
import sys
from collections import defaultdict

if len(sys.argv) < 2:
    print("Usage: python3 analyze-discovery.py <result.json>")
    sys.exit(1)

points_by_time = defaultdict(dict)
vus_timeline = []
durations = []
failures = []

with open(sys.argv[1]) as f:
    for line in f:
        try:
            rec = json.loads(line.strip())
        except Exception:
            continue
        if rec.get("type") != "Point":
            continue
        t = rec["data"]["time"][:16]  # minute-level bucket
        v = rec["data"]["value"]
        m = rec["metric"]
        if m == "vus":
            vus_timeline.append((t, v))
        elif m == "http_req_duration":
            durations.append((t, v))
        elif m == "http_req_failed":
            failures.append((t, v))

# Bucket by minute
from collections import defaultdict

bucket_dur = defaultdict(list)
bucket_fail = defaultdict(list)
bucket_vus = defaultdict(list)

for t, v in durations:
    bucket_dur[t].append(v)
for t, v in failures:
    bucket_fail[t].append(v)
for t, v in vus_timeline:
    bucket_vus[t].append(v)

print(f"{'Time':<18} {'VUs':>5} {'Reqs':>6} {'ErrRate':>8} {'P50ms':>7} {'P95ms':>7} {'P99ms':>7} {'Status'}")
print("-" * 75)

for minute in sorted(bucket_dur.keys()):
    durs = sorted(bucket_dur[minute])
    fails = bucket_fail.get(minute, [])
    vus = bucket_vus.get(minute, [0])
    n = len(durs)
    if n == 0:
        continue
    p50 = durs[int(n * 0.50)]
    p95 = durs[int(n * 0.95)]
    p99 = durs[int(n * 0.99)]
    err_rate = sum(fails) / len(fails) if fails else 0
    avg_vus = sum(vus) / len(vus)

    ok = err_rate < 0.01 and p95 < 500
    status = "OK" if ok else "FAIL"

    print(f"{minute:<18} {avg_vus:>5.0f} {n:>6} {err_rate:>8.2%} {p50:>7.0f} {p95:>7.0f} {p99:>7.0f} {status}")
