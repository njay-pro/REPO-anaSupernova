#!/usr/bin/env python3
"""Pull live Threads engagement for a scheduled week and write <stem>.stats.json.

Usage:
    python3 tools/sync_stats.py week-01-2026-11-06.json

The plan card fetches this file on load and auto-fills the 24h tracking columns.
Run it on a schedule (e.g. every 3 hours) so numbers stay fresh; each post's
24h snapshot is simply whatever the API reports at/after the 24h mark.
"""
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

WITA = timezone(timedelta(hours=8))
BASE = "https://api.zernio.com/v1"
ENV_CANDIDATES = [
    Path.home() / ".hermes/profiles/ana-board/secrets/ana.env",
    Path("/Volumes/Ventoy/AGENT-offload-2026-10-14/AGENT-anaSupernova/.env"),
]


def load_env():
    for p in ENV_CANDIDATES:
        if p.exists():
            for line in p.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
            return


def threads_block(payload):
    """Prefer the threads-specific analytics block when present."""
    for pa in payload.get("platformAnalytics") or []:
        if pa.get("platform") == "threads":
            return pa
    return {}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    json_path = Path(args[0] if args else "week-01-2026-11-06.json").resolve()
    stem = json_path.with_suffix("")
    pm_path = Path(str(stem) + ".postmap.json")
    out_path = Path(str(stem) + ".stats.json")

    if not pm_path.exists():
        raise SystemExit(f"missing {pm_path} — run publish_week.py first")

    load_env()
    key = os.environ.get("ZERNIO_API_KEY")
    if not key:
        raise SystemExit("missing ZERNIO_API_KEY")
    headers = {"Authorization": f"Bearer {key}"}

    postmap = json.loads(pm_path.read_text(encoding="utf-8"))
    now = datetime.now(WITA)
    posts, problems = {}, []

    for ch, meta in postmap.items():
        pid = meta["zernio_id"]
        try:
            r = requests.get(f"{BASE}/analytics?postId={pid}", headers=headers, timeout=30)
        except Exception as e:
            problems.append(f"{ch}: request failed {e}")
            continue
        if r.status_code not in (200, 202):
            problems.append(f"{ch}: HTTP {r.status_code} {r.text[:120]}")
            continue

        # 202 = valid payload, just not published yet (analytics still zeroed)

        d = r.json()
        a = d.get("analytics") or {}
        th = threads_block(d)
        url = th.get("platformPostUrl") or a.get("platformPostUrl")

        sched = None
        if meta.get("scheduled_for"):
            try:
                sched = datetime.fromisoformat(meta["scheduled_for"])
            except ValueError:
                sched = None

        posts[ch] = {
            "zernio_id": pid,
            "status": d.get("status"),
            "published_at": d.get("publishedAt"),
            "scheduled_for": meta.get("scheduled_for"),
            "label": meta.get("label"),
            "likes": int(a.get("likes") or 0),
            "replies": int(a.get("comments") or 0),
            "reposts": int(a.get("reposts") or 0),
            "saves": int(a.get("saves") or 0),
            "shares": int(a.get("shares") or 0),
            "views": int(a.get("views") or a.get("impressions") or 0),
            "reach": int(a.get("reach") or 0),
            "engagement_rate": a.get("engagementRate") or 0,
            "url": url,
            "hours_since_publish": (
                round((now - datetime.fromisoformat(d["publishedAt"].replace("Z", "+00:00"))).total_seconds() / 3600, 1)
                if d.get("publishedAt") else None
            ),
        }
        p = posts[ch]
        flag = "" if p["status"] == "published" else f"  [{p['status']}]"
        print(f"  {ch}  {p['status']:9} L{p['likes']:>4} R{p['replies']:>3} "
              f"RT{p['reposts']:>3} S{p['saves']:>3}  V{p['views']:>5}{flag}")

    totals = {k: sum(p.get(k, 0) for p in posts.values())
              for k in ("likes", "replies", "reposts", "saves", "shares", "views")}
    published = [p for p in posts.values() if p["status"] == "published"]
    totals["published_count"] = len(published)
    totals["avg_likes"] = round(totals["likes"] / len(published), 1) if published else 0

    output = {
        "generated_at": now.isoformat(timespec="seconds"),
        "source": "zernio /analytics",
        "week_json": json_path.name,
        "posts": posts,
        "totals": totals,
    }
    out_path.write_text(json.dumps(output, indent=1, ensure_ascii=False), encoding="utf-8")

    print(f"\ntotals: {totals}")
    if problems:
        print("problems:")
        for x in problems:
            print("  ✗", x)
    print(f"\n→ {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
