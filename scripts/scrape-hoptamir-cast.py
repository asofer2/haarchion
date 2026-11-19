#!/usr/bin/env python3
"""Scrape Hop Tamir Google Sites אישים pages into haarchion cast JSON."""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; IshimArchiveBot/1.0; +https://haarchion.vercel.app)"
}

KIND_MAP = {
    "סדרת טלוויזיה זרה מדובבת": "series_dubbed_foreign",
    "סדרה זרה מדובבת": "series_dubbed_foreign",
    "סרט זר מדובב": "film_dubbed_foreign",
    "סדרת טלוויזיה": "tv_series",
    "תוכנית טלוויזיה": "tv_program",
    "סרט טלוויזיה": "film_tv",
    "סרט קולנוע": "film_cinema",
    "משחק מחשב ישראלי": "game_israeli",
    "משחק מחשב מדובב זר": "game_dubbed_foreign",
    "משחק מחשב זר מדובב": "game_dubbed_foreign",
    "משחק מחשב": "game_israeli",
    "קלטת ילדים": "cassette_kids",
    "מחזמר": "musical",
}

# Stable ids for productions that already exist in haarchion seeds
KNOWN_IDS = {
    ("גן המפלצות", 2017): "ht-gn-hmpltsvvt",
}

CREW_HEADINGS = {
    "בימוי דיבוב": "dub_director",
    "בימוי": "director",
    "הפקת דיבוב": "producer",
    "הפקה": "producer",
    "מדבבים": "dubber",
    "מדבבים אורחים": "dubber",
    "שחקנים": "actor",
    "משתתפים": "actor",
    "מוזיקה": "singer",
    "שירה": "singer",
    "תסריט": "writer",
    "תסריטאים": "writer",
    "יוצרים": "writer",
}

META_HEADINGS = {
    "עלילה",
    "אורך",
    "פרקים",
    "סוג",
    "מפתחות",
    "ז'אנר",
    "ז׳אנר",
    "ערוץ שידור",
    "שם מקורי",
    "כותרת מקורית",
    "במקור",
}
SKIP_HEADINGS = {"קישורים", "ראה גם", "כללי", "טריוויה", "מאחורי הקלעים"}
ROLE_WORDS = {"מנחה", "קריין", "קריינות", "ביצוע"}

URLS = [
    "https://sites.google.com/view/hoptamir/גן-המפלצות-2017-אישים",
    "https://sites.google.com/view/hoptamir/גן-עדן-לכלבים-1994-אישים",
    "https://sites.google.com/view/hoptamir/גשם-של-פלאפל-2009-אישים",
    "https://sites.google.com/view/hoptamir/דוח-דלעת-2015-2016-אישים",
    "https://sites.google.com/view/hoptamir/דובוני-אכפת-לי-1986-1989-אישים",
    "https://sites.google.com/view/hoptamir/דובוני-אכפת-לי-2009-אישים",
    "https://sites.google.com/view/hoptamir/דורה-והפיראטים-2009-אישים",
    "https://sites.google.com/view/hoptamir/דורה-והפיראטים-המחזמר-2006-אישים",
    "https://sites.google.com/view/hoptamir/דרקוני-2005-אישים",
    "https://sites.google.com/view/hoptamir/בריינפופ-2005-אישים",
    "https://sites.google.com/view/hoptamir/גוליה-גולשת-בזמן-תעלומה-בפריז-1999-אישים-משחק-מחשב",
    "https://sites.google.com/view/hoptamir/גוליה-ילדי-הפרחים-1999-אישים-משחק-מחשב",
    "https://sites.google.com/view/hoptamir/גדולים-מהחיים-1998-אישים",
    "https://sites.google.com/view/hoptamir/גוגו-פחות-או-יותר-2002-אישים-משחק-מחשב",
    "https://sites.google.com/view/hoptamir/גוגו-מחפש-את-שלומפי-2002-אישים-משחק-מחשב",
    "https://sites.google.com/view/hoptamir/גורדי-בהרפתקה-מהסרטים-1997-אישים-משחק-מחשב",
    "https://sites.google.com/view/hoptamir/גיא-גיא-מטוס-הסילון-2005-אישים",
    "https://sites.google.com/view/hoptamir/גן-החברים-1999-אישים",
]


def fetch(url: str) -> str:
    parts = urllib.parse.urlsplit(url.split("?")[0])
    path = urllib.parse.quote(urllib.parse.unquote(parts.path))
    encoded = urllib.parse.urlunsplit((parts.scheme, parts.netloc, path, "", ""))
    req = urllib.request.Request(encoded, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", "ignore")


def clean_title(title: str) -> str:
    title = title.replace("ערוץ הופ תמיר - ", "").strip()
    title = re.sub(r"\s*אישים(?:\s*=\s*משחק מחשב)?\s*$", "", title).strip()
    title = re.sub(r"\s*\(\s*-?\s*\d{4}(?:\s*[-–—]\s*\d{4})?\s*\)\s*$", "", title).strip()
    title = re.sub(r"\s*אישים(?:\s*=\s*משחק מחשב)?\s*$", "", title).strip()
    return title


def parse_years_from_title(title: str) -> tuple[int | None, int | None]:
    m = re.search(r"\(\s*-?\s*(\d{4})\s*[-–—]\s*(\d{4})\s*\)", title)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.search(r"\(\s*-?\s*(\d{4})\s*\)", title)
    if m:
        return int(m.group(1)), None
    return None, None


def parse_runtime(text: str) -> int | None:
    m = re.search(r"(\d+)\s*דק", text)
    if m:
        return int(m.group(1))
    if text.strip() in {"דקה", "דק'"}:
        return 1
    return None


HEBREW_MAP = {
    "א": "a", "ב": "b", "ג": "g", "ד": "d", "ה": "h", "ו": "v", "ז": "z",
    "ח": "ch", "ט": "t", "י": "y", "כ": "k", "ך": "k", "ל": "l", "מ": "m",
    "ם": "m", "נ": "n", "ן": "n", "ס": "s", "ע": "a", "פ": "p", "ף": "f",
    "צ": "ts", "ץ": "ts", "ק": "k", "ר": "r", "ש": "sh", "ת": "t",
    "׳": "", "'": "", "״": "", '"': "", "־": "-", "-": "-", " ": "-",
}


def slugify(text: str) -> str:
    out = []
    for ch in text.strip().lower():
        if ch in HEBREW_MAP:
            out.append(HEBREW_MAP[ch])
        elif "a" <= ch <= "z" or "0" <= ch <= "9":
            out.append(ch)
        elif ch in "–—_/":
            out.append("-")
    return re.sub(r"-+", "-", "".join(out)).strip("-")[:60] or "show"


def ascii_id(title: str, year: int | None, end_year: int | None) -> str:
    base = slugify(title)
    y = str(year or "")
    if end_year:
        y = f"{year}-{end_year}"
    return f"ht-{base}-{y}" if y else f"ht-{base}"


def normalize_heading(text: str) -> str | None:
    t = text.strip().rstrip(":")
    if t in CREW_HEADINGS or t in META_HEADINGS or t in SKIP_HEADINGS:
        return t
    return None


def extract_year_suffix(text: str) -> tuple[str, int | None, int | None]:
    m = re.search(r"\[(\d{4})(?:\s*[-–—]\s*(\d{4}))?\]\s*$", text.strip())
    if not m:
        return text.strip(), None, None
    return text[: m.start()].strip(), int(m.group(1)), int(m.group(2)) if m.group(2) else None


def strip_perf(text: str) -> tuple[str, bool]:
    singing = False
    for marker in ["(שירה)", "(ביצוע)"]:
        if marker in text:
            singing = True
            text = text.replace(marker, "").strip()
    return text, singing


def split_colon(text: str) -> tuple[str, str] | None:
    if " : " in text:
        a, b = text.split(" : ", 1)
        return a.strip(), b.strip()
    if re.search(r"\s:\s", text):
        a, b = re.split(r"\s:\s", text, 1)
        return a.strip(), b.strip()
    return None


def looks_like_person(name: str) -> bool:
    name = name.strip()
    if not name or name in META_HEADINGS or name in CREW_HEADINGS or name in SKIP_HEADINGS:
        return False
    if name in ROLE_WORDS:
        return False
    if name.startswith("*"):
        return False
    if name in {"===="}:
        return False
    return bool(re.search(r"[\u0590-\u05FFA-Za-z]", name))


def cleanup_glued_background(name: str, character: str | None) -> tuple[str, str | None]:
    """Fix 'ג׳וי וינו אלעד קולות רקע' → person + קולות רקע."""
    for marker in ["קולות רקע", "דמויות שונות"]:
        if name.endswith(marker) and len(name) > len(marker) + 2:
            person = name[: -len(marker)].strip(" -–—/")
            if looks_like_person(person):
                return person, character or marker
        if character is None and f" {marker}" in name:
            person, _, rest = name.partition(f" {marker}")
            if looks_like_person(person.strip()):
                return person.strip(), marker if not rest.strip() else f"{marker} {rest.strip()}".strip()
    # 'הדר שחף-מעיין אירמה דווריאוקס' — known pattern: person then character words
    return name, character


def parse_page(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    og = soup.find("meta", property="og:title")
    page_title = (og.get("content") if og else "") or (
        soup.title.get_text(strip=True) if soup.title else ""
    )
    title = clean_title(page_title)
    year, end_year = parse_years_from_title(page_title)
    if year is None:
        m = re.search(r"(\d{4})(?:-(\d{4}))?", urllib.parse.unquote(url))
        if m:
            year = int(m.group(1))
            if m.group(2):
                end_year = int(m.group(2))

    summary = ""
    runtime = None
    episodes = None
    kind_he = ""
    channel = None
    original_title = None
    genres: list[str] = []
    keys: list[str] = []
    notes: list[dict] = []
    credits: list[dict] = []

    current: str | None = None
    pending_character: str | None = None
    pending_role_hint: str | None = None  # e.g. מנחה
    orphan_value: str | None = None  # value line awaiting a trailing "label:" 

    def add_note(heading: str, item: str):
        for block in notes:
            if block["heading"] == heading:
                if item not in block["items"]:
                    block["items"].append(item)
                return
        notes.append({"heading": heading, "items": [item]})

    def add_credit(person: str, role: str, heading: str, character: str | None = None):
        person, y1, y2 = extract_year_suffix(person)
        if character:
            character, cy1, cy2 = extract_year_suffix(character)
            y1 = y1 or cy1
            y2 = y2 or cy2
        person, singing = strip_perf(person)
        if character:
            character, singing2 = strip_perf(character)
            singing = singing or singing2
        if singing and role == "dubber":
            role = "singer"
            heading = "מוזיקה"
        person, character = cleanup_glued_background(person, character)
        person = person.strip(" -–—/")
        if not looks_like_person(person):
            return
        if person in {"מאחורי הקלעים", "קישורים", "כללי", "קולות רקע"}:
            return
        row = {"personName": person, "role": role, "heading": heading}
        if character:
            row["character"] = character
        if y1:
            row["year"] = y1
        if y2:
            row["endYear"] = y2
        credits.append(row)

    def handle_crew_line(text: str, has_person_link: bool):
        nonlocal pending_character, pending_role_hint, current, orphan_value
        orphan_value = None
        role = CREW_HEADINGS.get(current or "")
        if role is None:
            return

        colon = split_colon(text)
        if colon:
            left, right = colon
            if role in {"dubber", "actor"}:
                if left in ROLE_WORDS:
                    pending_role_hint = left
                    if looks_like_person(right):
                        add_credit(
                            right,
                            "host" if left == "מנחה" else role,
                            current or "",
                            left if left == "מנחה" else None,
                        )
                    return
                add_credit(left, role, current or "מדבבים", right)
                pending_character = None
                return
            if role == "director":
                if "בימוי קולות" in right or "קולות" in right:
                    add_credit(left, "dub_director", "בימוי", right)
                else:
                    add_credit(left, "director", "בימוי", right)
                return
            if role == "singer":
                if "מילים" in right:
                    add_credit(left, "writer", "מוזיקה", right)
                elif "לחן" in right:
                    add_credit(left, "composer", "מוזיקה", right)
                else:
                    add_credit(left, "singer", "מוזיקה", right)
                return
            add_credit(left, role, current or "", right)
            return

        if text in ROLE_WORDS:
            pending_role_hint = text
            pending_character = None
            return

        if role in {"dub_director", "producer", "director", "writer"}:
            add_credit(text, role, current or "", None)
            return

        if role == "singer":
            if pending_character and CREW_HEADINGS.get(
                # if pending was from מדבבים, pair as dubber first
                "x",
                "singer",
            ):
                pass
            if pending_character:
                # If pending looks like dubbing characters and we just entered מוזיקה,
                # still allow singer song titles; dubber pending handled before heading switch.
                add_credit(text, "singer", "מוזיקה", pending_character)
                pending_character = None
                return
            if has_person_link:
                add_credit(text, "singer", "מוזיקה", None)
            else:
                pending_character = text
            return

        if pending_role_hint == "מנחה" and looks_like_person(text):
            add_credit(text, "host", current or "משתתפים", "מנחה")
            pending_role_hint = None
            return

        if pending_character is not None:
            if has_person_link:
                # Classic אישים layout: character line, then linked person
                add_credit(text, role, current or "מדבבים", pending_character)
                pending_character = None
                return
            # Neither line linked (common on game pages) → two solo people
            add_credit(pending_character, role, current or "מדבבים", None)
            pending_character = None
            add_credit(text, role, current or "מדבבים", None)
            return

        if has_person_link:
            add_credit(text, role, current or "מדבבים", None)
            return

        pending_character = text

    def handle_meta(label: str, value: str):
        nonlocal summary, runtime, episodes, kind_he, channel, original_title, genres, keys
        value = value.strip()
        if not value or value == "====":
            return
        if label == "עלילה":
            summary = value
        elif label == "אורך":
            runtime = parse_runtime(value) or runtime
        elif label == "פרקים":
            m = re.search(r"\d+", value)
            if m:
                episodes = int(m.group(0))
        elif label == "סוג":
            kind_he = value
        elif label == "ערוץ שידור":
            channel = value
        elif label in {"ז'אנר", "ז׳אנר"}:
            raw = (
                value.replace("מדובב - זר", "מדובב_-_זר")
                .replace("מדע בדיוני", "מדע_בדיוני")
                .replace("מדע־בדיוני", "מדע_בדיוני")
            )
            for p in raw.split():
                p = p.replace("מדובב_-_זר", "מדובב - זר").replace("מדע_בדיוני", "מדע בדיוני")
                if p and p not in genres:
                    genres.append(p)
        elif label == "מפתחות":
            for p in value.split():
                if p and p not in keys:
                    keys.append(p)
        elif label in {"שם מקורי", "כותרת מקורית", "במקור"}:
            original_title = value

    # Flatten events in DOM order
    events: list[tuple[str, str, bool]] = []
    for sec in soup.select("section.yaqOZd"):
        for el in sec.find_all(["h1", "h2", "h3", "h4", "p"]):
            text = el.get_text(" ", strip=True)
            if not text:
                continue
            has_person_link = any(
                "p.php" in urllib.parse.unquote(a.get("href") or "")
                or "ishim.co.il/p" in urllib.parse.unquote(a.get("href") or "")
                for a in el.find_all("a")
            )
            if el.name in {"h1", "h2", "h3", "h4"}:
                events.append(("h", text, has_person_link))
            else:
                events.append(("p", text, has_person_link))

    for kind, text, has_person_link in events:
        bare = text.strip().rstrip(":")
        heading = normalize_heading(text)

        if kind == "h":
            if "אישים" in text and re.search(r"\d{4}", text):
                continue
            if heading:
                if pending_character and current in {
                    "מדבבים",
                    "מדבבים אורחים",
                    "שחקנים",
                    "משתתפים",
                }:
                    keep_for_music = heading == "מוזיקה" and (
                        "/" in pending_character or "קריינ" in pending_character
                    )
                    if not keep_for_music:
                        add_credit(
                            pending_character,
                            CREW_HEADINGS[current],
                            current,
                            None,
                        )
                        pending_character = None
                current = heading
                orphan_value = None
            continue

        # Trailing label after a value: "אנימציה …" then "ז'אנר:"
        if heading and bare == heading and not split_colon(text):
            if heading in META_HEADINGS and orphan_value:
                handle_meta(heading, orphan_value)
                orphan_value = None
                current = None
                continue
            if heading in CREW_HEADINGS or heading in SKIP_HEADINGS or heading in META_HEADINGS:
                current = heading
                orphan_value = None
                continue

        # "עלילה: value" on one line
        m = re.match(
            r"^(עלילה|אורך|פרקים|סוג|מפתחות|ז'אנר|ז׳אנר|ערוץ שידור|שם מקורי|כותרת מקורית|במקור)\s*:\s*(.*)$",
            text,
        )
        if m:
            handle_meta(m.group(1), m.group(2))
            orphan_value = None
            current = None  # do not let following chip lines overwrite
            continue

        if text.startswith("*"):
            add_note("כללי", text)
            orphan_value = None
            continue

        if current in SKIP_HEADINGS:
            if text and text not in SKIP_HEADINGS:
                add_note(current or "כללי", text)
            continue

        if current in CREW_HEADINGS:
            # Special: character pending from מדבבים, then מוזיקה heading already set,
            # first line under מוזיקה is actually the dubber person.
            if (
                current == "מוזיקה"
                and pending_character
                and has_person_link
                and "/" in pending_character
            ):
                add_credit(text, "dubber", "מדבבים", pending_character)
                pending_character = None
                continue
            handle_crew_line(text, has_person_link)
            continue

        # Orphan content before a trailing meta label (genres / channel / keys)
        if current is None and not has_person_link:
            orphan_value = text
            continue

    if pending_character and current in CREW_HEADINGS:
        add_credit(pending_character, CREW_HEADINGS[current], current, None)
        pending_character = None

    kind = KIND_MAP.get(kind_he)
    if not kind:
        u = urllib.parse.unquote(url)
        if "משחק-מחשב" in u or "משחק מחשב" in u:
            kind = "game_dubbed_foreign" if "מדובב" in (kind_he or "") or "זר" in (kind_he or "") else "game_israeli"
        elif "מחזמר" in u or "מחזמר" in page_title:
            kind = "musical"
        elif "סרט" in kind_he:
            kind = "film_dubbed_foreign"
        elif "סדר" in kind_he:
            kind = "series_dubbed_foreign"
        elif "תוכנית" in kind_he:
            kind = "tv_program"
        else:
            kind = "tv_series"

    pid = KNOWN_IDS.get((title, year or 0)) or ascii_id(title, year, end_year)

    def uniq(xs: list[str]) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for x in xs:
            if x and x not in seen and x not in META_HEADINGS and x not in {":", "בימוי"}:
                # filter garbage tokens from bad parses
                if len(x) == 1:
                    continue
                seen.add(x)
                out.append(x)
        return out

    show: dict = {
        "id": pid,
        "title": title,
        "year": year or 0,
        "kind": kind,
        "summary": summary,
        "genres": uniq(genres),
        "ishimKeys": uniq(keys),
        "ishimNotes": notes,
        "credits": credits,
        "sourceUrl": url.split("?")[0]
        if "://" in url
        else "https://sites.google.com" + urllib.parse.quote(urllib.parse.unquote(url if url.startswith("/") else url)),
    }
    # Prefer canonical sites URL from input list when relative
    if not show["sourceUrl"].startswith("http"):
        show["sourceUrl"] = next((u for u in URLS if clean_title(u) or True), show["sourceUrl"])

    if end_year:
        show["endYear"] = end_year
    if runtime:
        show["runtimeMinutes"] = runtime
    if episodes:
        show["episodeCount"] = episodes
    if channel:
        show["channel"] = channel
    if original_title:
        show["originalTitle"] = original_title
    return show


def main():
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("src/data/ht-cast-nov19.json")
    shows = []
    for i, url in enumerate(URLS):
        print(f"[{i+1}/{len(URLS)}] {urllib.parse.unquote(urllib.parse.urlsplit(url).path)}", flush=True)
        try:
            html = fetch(url)
            show = parse_page(url, html)
            # fix sourceUrl to the clean input URL
            show["sourceUrl"] = url.split("?")[0]
            print(
                f"  -> {show['title']} ({show['year']}"
                f"{'-'+str(show['endYear']) if show.get('endYear') else ''})"
                f" credits={len(show['credits'])} kind={show['kind']}",
                flush=True,
            )
            shows.append(show)
        except Exception as exc:
            print(f"  ERROR {exc}", flush=True)
        time.sleep(0.35)
    out_path.write_text(json.dumps(shows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(shows)} shows to {out_path}")


if __name__ == "__main__":
    main()
