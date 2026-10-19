# -*- coding: utf-8 -*-
"""探查 docx 比赛分块：提取全名、比分、简称，输出待建映射信息。"""
import re
import zipfile
import collections
from pathlib import Path

DOCX = Path(r"C:\Users\34602\OneDrive\Documents\项目2.0\26-22赛事纪录\26赛事纪录.docx")


def docx_text(p):
    with zipfile.ZipFile(p) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="replace")
    xml = xml.replace("</w:p>", "\n")
    return re.sub(r"<[^>]+>", "", xml)


def main():
    text = docx_text(DOCX)

    # 按【 分块
    parts = re.split(r"(?=【)", text)
    blocks = [p for p in parts if p.startswith("【")]
    print("blocks starting with 【:", len(blocks))

    score_pat = re.compile(r"\d{1,2}\s*[:：]\s*\d{1,2}")
    full_names = set()
    results = []

    for b in blocks:
        title = b.split("】", 1)[0] + "】"
        inner = title[1:-1]
        body = b.split("】", 1)[1]
        # 尝试 vs 拆分
        m = re.match(r"^(.*?)\s*vs\s*(.*)$", inner, re.I)
        if m:
            a, b_side = m.group(1).strip(), m.group(2).strip()
            # 比分可能在 A 内或 B 内或】外
            sc = score_pat.search(b_side)
            if sc:
                b_side = (b_side[:sc.start()] + b_side[sc.end():]).strip()
            sc2 = score_pat.search(a)
            if sc2:
                a = (a[:sc2.start()] + a[sc2.end():]).strip()
            if not score_pat.search(b_side) and not score_pat.search(a):
                outside = score_pat.search(body)
            results.append((a, b_side))
        else:
            # A 比分 B 或 A B
            sc = score_pat.search(inner)
            if sc:
                a = inner[:sc.start()].strip()
                b_side = inner[sc.end():].strip()
                results.append((a, b_side))
            else:
                # 无比分：尝试空格拆
                a, _, b_side = inner.partition(" ")
                results.append((a.strip(), b_side.strip()))

    print("parsed pairs:", len(results))
    for a, b_side in results:
        full_names.add(a)
        full_names.add(b_side)
    print("\nunique full names:", len(full_names))
    for n in sorted(full_names):
        print("  ", n)

    # 简称提取（正文）：X院 / X队 / X研究生
    abbr_pat = re.compile(r"([\u4e00-\u9fa5]{1,6})(?:学院|院|学部|队|研究生)")
    abbrs = collections.Counter()
    for a, b_side in results:
        pass
    for m in abbr_pat.finditer(text):
        abbrs[m.group(0)] += 1
    print("\nall abbreviations (top 60):")
    for ab, cnt in abbrs.most_common(60):
        print(f"  {ab}: {cnt}")


if __name__ == "__main__":
    main()
