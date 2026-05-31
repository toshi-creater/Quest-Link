import json
import sys

fnames = sys.argv[1:] if len(sys.argv) > 1 else [
    'results/phase2-discovery-after2.json',
    'results/phase2-discovery-0531.json',
]

for fname in fnames:
    print(f'\n=== {fname} ===')
    buckets = {}
    try:
        with open(fname) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                entry = json.loads(line)
                if entry.get('type') != 'Point':
                    continue
                t = entry['data']['time'][:16]
                metric = entry['metric']
                val = entry['data']['value']
                if t not in buckets:
                    buckets[t] = {'vus': 0, 'failed': [], 'duration': []}
                if metric == 'vus':
                    buckets[t]['vus'] = max(buckets[t]['vus'], val)
                elif metric == 'http_req_failed':
                    buckets[t]['failed'].append(val)
                elif metric == 'http_req_duration':
                    buckets[t]['duration'].append(val)
    except FileNotFoundError:
        print(f'  ファイルが見つかりません: {fname}')
        continue

    prev_vus = -1
    for t in sorted(buckets.keys()):
        b = buckets[t]
        vus = b['vus']
        failed = b['failed']
        durations = b['duration']
        err = sum(failed)/len(failed)*100 if failed else 0
        p95 = sorted(durations)[int(len(durations)*0.95)] if durations else 0
        if vus != prev_vus:
            print(f'  {t}  VU={vus:3d}  error={err:5.1f}%  p95={p95:7.1f}ms')
            prev_vus = vus
