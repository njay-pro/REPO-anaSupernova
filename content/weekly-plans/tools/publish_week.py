#!/usr/bin/env python3
"""Publish a week's Threads posts through the Zernio API at their scheduled times.

Usage:
    python3 tools/publish_week.py week-01-2026-11-06.json --dry-run
    python3 tools/publish_week.py week-01-2026-11-06.json

Reads captions from <stem>.captions.md (blocks headed `## ... · ch.NN · ...`),
schedules each post to the Threads account, and writes <stem>.postmap.json so the
stats sync can find them later.

Gates (do not remove — see zernio-post-lifecycle pitfalls):
  * Threads hard limit 500 chars           -> abort that post
  * scheduledFor must be > now + 10 min    -> abort (past dates publish INSTANTLY)
  * duplicate content within 24h           -> skip
  * post-create id is result["post"]["_id"], never result["id"]
"""
import json
import os
import re
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
THREADS_CHAR_LIMIT = 500
MIN_LEAD = timedelta(minutes=10)


def load_env():
    for p in ENV_CANDIDATES:
        if p.exists():
            for line in p.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
            return p
    raise SystemExit("no .env found")


def parse_captions(md_path):
    """Return {ch: caption} from blocks that look like:  ## ... · ch.07 · ..."""
    text = md_path.read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r"^##\s+(.+?)\n\n```\n(.*?)```", text, re.S | re.M):
        head, body = m.group(1), m.group(2).strip()
        ch = re.search(r"ch\.(\d+)", head)
        if ch:
            out[f"ch.{ch.group(1)}"] = body
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    json_path = Path(args[0] if args else "week-01-2026-11-06.json").resolve()
    stem = json_path.with_suffix("")

    load_env()
    key = os.environ.get("ZERNIO_API_KEY")
    acct = os.environ.get("ZERNIO_ACCOUNT_ID_THREADS")
    if not key or not acct:
        raise SystemExit("missing ZERNIO_API_KEY / ZERNIO_ACCOUNT_ID_THREADS")

    week = json.loads(json_path.read_text(encoding="utf-8"))
    captions = parse_captions(Path(str(stem) + ".captions.md"))
    slot_time = {s["type"]: s["time"] for s in week["slots"]}
    now = datetime.now(WITA)

    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    # existing content in the last 24h, to respect the duplicate guard
    try:
        recent = requests.get(f"{BASE}/posts?limit=100", headers=headers, timeout=30).json()
        recent_contents = {(p.get("content") or "").strip() for p in recent.get("posts", [])}
    except Exception:
        recent_contents = set()

    postmap, planned, errors = {}, [], []

    for day in week["days"]:
        for post in day["posts"]:
            ch, ptype = post["ch"], post["type"]
            caption = captions.get(ch)
            when = datetime.fromisoformat(f"{day['iso']}T{slot_time[ptype]}:00").replace(tzinfo=WITA)
            label = f"{day['day']} {day['date']} {slot_time[ptype]} {ch}"

            if not caption:
                errors.append(f"{label}: no caption found for {ch}")
                continue
            if len(caption) > THREADS_CHAR_LIMIT:
                errors.append(f"{label}: caption {len(caption)}c > {THREADS_CHAR_LIMIT} (Threads hard limit)")
                continue
            if when - now < MIN_LEAD:
                errors.append(f"{label}: scheduledFor {when:%Y-%m-%d %H:%M} is <10min ahead "
                              f"(now {now:%H:%M}) — Zernio would publish instantly")
                continue
            if caption.strip() in recent_contents:
                errors.append(f"{label}: duplicate content already in Zernio (24h guard)")
                continue

            planned.append({"label": label, "ch": ch, "when": when, "caption": caption})
            print(f"{'[dry] ' if dry else ''}{label:34} {len(caption):3}c  →  {when:%a %d %b %H:%M} WITA")

    if errors:
        print("\nBLOCKED:")
        for e in errors:
            print("  ✗", e)
    if dry:
        print(f"\ndry run: {len(planned)} post(s) would be scheduled, {len(errors)} blocked")
        return 1 if errors else 0

    print()
    for item in planned:
        payload = {
            "content": item["caption"],
            "scheduledFor": item["when"].isoformat(),
            "timezone": "Asia/Makassar",
            "platforms": [{"platform": "threads", "accountId": acct}],
        }
        try:
            r = requests.post(f"{BASE}/posts", headers=headers, json=payload, timeout=60)
        except Exception as e:
            errors.append(f"{item['label']}: request failed {e}")
            continue

        if r.status_code not in (200, 201):
            errors.append(f"{item['label']}: HTTP {r.status_code} {r.text[:200]}")
            continue

        body = r.json()
        pid = (body.get("post") or {}).get("_id")
        if not pid:
            errors.append(f"{item['label']}: no post._id in response {str(body)[:200]}")
            continue

        postmap[item["ch"]] = {
            "zernio_id": pid,
            "scheduled_for": item["when"].isoformat(),
            "label": item["label"],
            "type": item["type"] if "type" in item else None,
            "caption": item["caption"],
        }
        print(f"  ✅ {item['label']:34} zernio={pid}")

    pm_path = Path(str(stem) + ".postmap.json")
    pm_path.write_text(json.dumps(postmap, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"\npostmap → {pm_path}  ({len(postmap)} post)")

    if errors:
        print("\nERRORS:")
        for e in errors:
            print("  ✗", e)
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
