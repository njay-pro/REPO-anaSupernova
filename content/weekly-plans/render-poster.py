#!/usr/bin/env python3
"""Render a weekly Threads plan poster (PNG) from a week JSON file.

Usage:
    python3 render-poster.py week-01-2026-11-04.json

Writes <stem>.card.html and <stem>.png next to the JSON.
Design: cream ruled paper, Noteworthy handwriting headers, checkbox column at
left of each topic, per-post 24h engagement row, auto weekly-recap block.
Requires: playwright (channel="chrome"), PIL.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;background:#f7f2e8;color:#302d28;
  font-family:"Inter","Helvetica Neue",sans-serif;-webkit-font-smoothing:antialiased}
.paper{width:1080px;position:relative;padding:54px 64px 60px 78px;background:#f7f2e8}
.paper::before{content:"";position:absolute;left:54px;top:0;bottom:0;width:1px;background:rgba(181,116,95,.3)}
header{margin-bottom:26px}
.kicker{font-size:13px;letter-spacing:.34em;text-transform:uppercase;color:#a2957f;margin-bottom:14px}
h1{font-family:"Noteworthy","MarkerFelt",serif;font-weight:400;font-size:65px;line-height:.95;color:#26231f}
h1 em{font-style:normal;color:#b5745f}
.subline{display:flex;align-items:baseline;gap:16px;margin-top:16px;font-size:17px;color:#6f665a}
.subline b{font-weight:600;color:#3b372f}
.dot{width:5px;height:5px;border-radius:50%;background:#c9bda6;display:inline-block;vertical-align:middle}
.legend{margin-top:22px;display:flex;gap:10px;flex-wrap:wrap}
.chip{font-size:12px;letter-spacing:.13em;text-transform:uppercase;border:1px solid #ddd1ba;
  border-radius:100px;padding:7px 14px;color:#7c7263;background:rgba(255,255,255,.45)}
.chip s{text-decoration:none;color:#b5745f;font-weight:600}
.week{margin-top:34px;border-top:1px solid #ded2ba;padding-top:4px;
  background:repeating-linear-gradient(to bottom,transparent 0 39px,rgba(146,128,100,.085) 39px 40px)}
.day{padding:20px 0 16px;border-bottom:1px dashed #ded2ba}
.day:last-child{border-bottom:none}
.dayhead{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.bullet{font-size:15px;color:#b5745f;line-height:1}
.dayname{font-family:"Noteworthy","MarkerFelt",serif;font-size:30px;color:#2b2822}
.daytag{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#a2957f;margin-left:2px}
.dateright{margin-left:auto;font-size:12px;letter-spacing:.18em;color:#b3a68f;text-transform:uppercase}
.post{display:flex;gap:14px;padding:8px 0;align-items:flex-start}
.box{width:19px;height:19px;border:1.6px solid #9d907a;border-radius:2px;flex:0 0 19px;
  margin-top:3px;background:rgba(255,255,255,.55)}
.body{flex:1;min-width:0}
.meta{display:flex;gap:10px;align-items:baseline;margin-bottom:2px}
.slot{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#b5745f;font-weight:600}
.slot.b{color:#6f8272}.slot.c{color:#8a7a95}
.ch{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#c4b8a0}
.topic{font-size:21px;line-height:1.3;font-weight:500;color:#2f2c26;letter-spacing:-.005em}
.track{margin-top:8px;display:flex;gap:24px;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:#b5a68b}
.track i{font-style:normal;display:inline-block;min-width:50px;border-bottom:1px dotted #c9bda6;margin-left:7px}
.recap{margin-top:32px;border:1.6px solid #2b2822;border-radius:4px;padding:28px 30px 24px;
  background:rgba(255,255,255,.46)}
.recaphead{display:flex;align-items:baseline;gap:14px;margin-bottom:20px}
.recaphead h2{font-family:"Noteworthy","MarkerFelt",serif;font-weight:400;font-size:37px}
.recaphead span{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#a2957f}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 18px;margin-bottom:22px}
.stat{border-bottom:1px dotted #c9bda6;padding-bottom:7px}
.stat .n{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#a89b84;display:block;margin-bottom:14px}
.stat .v{font-size:12px;color:#c2b296;letter-spacing:.2em}
.pick{display:flex;gap:24px;margin-bottom:18px;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:#a89b84}
.pick span{display:flex;align-items:center;gap:7px}
.pick em{width:13px;height:13px;border:1.4px solid #9d907a;border-radius:50%;display:inline-block}
.line{display:flex;align-items:baseline;gap:12px;margin-bottom:14px}
.line b{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#7c7263;font-weight:600;min-width:132px}
.line u{flex:1;border-bottom:1px dotted #c9bda6;height:15px;text-decoration:none}
footer{margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;font-size:11px;letter-spacing:.15em;
  text-transform:uppercase;color:#b3a68f}
.nextweek{margin-top:16px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a2957f}
.nextweek b{color:#b5745f}
"""

LABELS = {"take": "hot take", "card": "prompt card", "conf": "confession"}
CLS = {"take": "", "card": " b", "conf": " c"}


def build_html(d):
    days = d["days"]
    total = sum(len(x["posts"]) for x in days)
    slot_time = {s["type"]: s["time"] for s in d["slots"]}

    chips = "".join(
        f'<div class="chip"><s>{s["time"]}</s> {s["label"]}</div>' for s in d["slots"]
    )

    day_html = []
    for day in days:
        posts = []
        for p in day["posts"]:
            posts.append(f"""
      <div class="post"><div class="box"></div><div class="body">
        <div class="meta"><span class="slot{CLS[p['type']]}">{slot_time[p['type']]} · {LABELS[p['type']]}</span><span class="ch">{p['ch']}</span></div>
        <div class="topic">{p['text']}</div>
        <div class="track"><span>24h</span>
          <span>likes<i></i></span><span>replies<i></i></span><span>reposts<i></i></span><span>saves<i></i></span>
        </div>
      </div></div>""")
        day_html.append(f"""
    <div class="day">
      <div class="dayhead"><span class="bullet">●</span><span class="dayname">{day['day']}</span><span class="daytag">{day['tag']}</span><span class="dateright">{day['date']}</span></div>{''.join(posts)}
    </div>""")

    picks = "".join(f'<span><em></em>{s["label"]}</span>' for s in d["slots"])
    stats = [
        ("posted", f"___ / {total}"), ("likes", "______"), ("replies", "______"),
        ("reposts", "______"), ("saves", "______"), ("avg 24h likes", "______"),
        ("engagement %", "______"), ("followers +/-", "______"),
    ]
    stat_html = "".join(
        f'<div class="stat"><span class="n">{n}</span><span class="v">{v}</span></div>' for n, v in stats
    )
    notes = ["best post", "worst post", "keep doing", "kill next week", "test next week"]
    note_html = "".join(f'<div class="line"><b>{n}</b><u></u></div>' for n in notes)

    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="paper">
  <header>
    <div class="kicker">threads · content plan · {d['week']}</div>
    <h1>weekly plan <em>ana</em></h1>
    <div class="subline">
      <b>{d['range_label']}</b><span class="dot"></span><span>{d['span_label']}</span>
      <span class="dot"></span><span>3 post / hari · {total} total</span>
      <span class="dot"></span><span>minggu libur</span>
    </div>
    <div class="legend">{chips}<div class="chip">ebook: ai for daily life</div></div>
  </header>

  <div class="week">{''.join(day_html)}</div>

  <div class="recap">
    <div class="recaphead"><h2>weekly recap</h2><span>isi 24 jam setelah post terakhir</span></div>
    <div class="stats">{stat_html}</div>
    <div class="pick"><span>top format</span>{picks}</div>
    {note_html}
  </div>

  <footer><span>lock lowercase</span>·<span>1 post = 1 idea</span>·<span>no threading</span>·<span>hook in 2 lines</span>·<span>pin the best utility post</span></footer>
  <div class="nextweek">{d.get('footnote','')}</div>
</div></body></html>"""


def main():
    src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "week-01-2026-11-04.json")
    data = json.loads(src.read_text(encoding="utf-8"))
    html_path = src.with_suffix(".card.html")
    png_path = src.with_suffix(".png")
    html_path.write_text(build_html(data), encoding="utf-8")

    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        pg = b.new_page(viewport={"width": 1080, "height": 1400}, device_scale_factor=2)
        pg.goto(html_path.resolve().as_uri())
        pg.wait_for_timeout(1200)
        checks = pg.evaluate("""() => ({
          posts: document.querySelectorAll('.post').length,
          boxes: document.querySelectorAll('.box').length,
          overflowX: document.documentElement.scrollWidth > 1080,
          clipped: [...document.querySelectorAll('.topic')].filter(e => e.scrollWidth > e.clientWidth + 1).length,
          wrap: [...document.querySelectorAll('.topic')].filter(e => e.getBoundingClientRect().height >
                 parseFloat(getComputedStyle(e).lineHeight) * 1.5).length
        })""")
        pg.screenshot(path=str(png_path), full_page=True)
        b.close()

    print(f"html  {html_path}")
    print(f"png   {png_path}  ({png_path.stat().st_size // 1024} KB)")
    print(f"check {checks}")
    total = sum(len(x["posts"]) for x in data["days"])
    ok = (checks["posts"] == total and checks["boxes"] == total
          and not checks["overflowX"] and checks["clipped"] == 0 and checks["wrap"] == 0)
    print("VERDICT", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
