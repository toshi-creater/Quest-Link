import json
import sys

fname = sys.argv[1] if len(sys.argv) > 1 else "results/phase2-discovery-0531f.json"
errors = {}
total_failed = 0

with open(fname) as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        entry = json.loads(line)
        if entry.get("type") != "Point":
            continue
        if entry["metric"] == "http_req_failed" and entry["data"]["value"] == 1:
            total_failed += 1
            tags = entry["data"].get("tags", {})
            status = tags.get("status", "0")
            url = tags.get("url", "")
            error_code = tags.get("error_code", "")
            error = tags.get("error", "")
            if "/join" in url:
                endpoint = "POST /join"
            elif "/leave" in url:
                endpoint = "POST /leave"
            elif "/rooms" in url and "rooms/" not in url:
                endpoint = "GET /rooms"
            elif "/health" in url:
                endpoint = "GET /health"
            else:
                endpoint = url[-40:]
            key = f"status={status:>3} | {endpoint:<20} | {error_code} {error[:40]}"
            errors[key] = errors.get(key, 0) + 1

print(f"総エラー数: {total_failed}")
print()
for k, v in sorted(errors.items(), key=lambda x: -x[1]):
    print(f"  {v:6d}  ({v/total_failed*100:5.1f}%)  {k}")
