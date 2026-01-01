#!/usr/bin/env python3
"""Static site generator for El Catecismo Bautista con Beddome."""

import json
import re
import shutil
from collections import Counter
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

# Spanish stopwords for term frequency analysis
SPANISH_STOPWORDS = {
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "de",
    "del",
    "al",
    "a",
    "en",
    "con",
    "por",
    "para",
    "que",
    "es",
    "son",
    "se",
    "su",
    "sus",
    "y",
    "o",
    "e",
    "u",
    "no",
    "si",
    "como",
    "pero",
    "mas",
    "este",
    "esta",
    "estos",
    "estas",
    "ese",
    "esa",
    "esos",
    "esas",
    "aquel",
    "aquella",
    "lo",
    "le",
    "les",
    "me",
    "te",
    "nos",
    "os",
    "mi",
    "tu",
    "ser",
    "estar",
    "haber",
    "tener",
    "hacer",
    "poder",
    "deber",
    "hay",
    "quien",
    "cual",
    "donde",
    "cuando",
    "porque",
    "sin",
    "sobre",
    "entre",
    "hasta",
    "desde",
    "ya",
    "muy",
    "bien",
    "mal",
    "todo",
    "toda",
    "todos",
    "todas",
    "otro",
    "otra",
    "otros",
    "otras",
    "mismo",
    "misma",
    "mismos",
    "mismas",
    "tal",
    "tanto",
    "tanta",
    "tantos",
    "tantas",
    "asi",
    "pues",
    "luego",
    "aunque",
    "sino",
    "tambien",
    "ademas",
    "ni",
    "oh",
    "ellos",
    "ellas",
    "ello",
    "ella",
    "nosotros",
    "vosotros",
    "ustedes",
    "ha",
    "han",
    "he",
    "sido",
    "fue",
    "fueron",
    "era",
    "eran",
    "seria",
    "seran",
    "siendo",
    "puede",
    "pueden",
    "debe",
    "deben",
    "tiene",
    "tienen",
    "hace",
    "hacen",
    "esto",
    "eso",
    "dios",
    "cuales",
    "cada",
    "segun",
    "nuestro",
    "nuestra",
    "nuestros",
    "nuestras",
}

# Bible books categorization
OLD_TESTAMENT_BOOKS = [
    "genesis",
    "exodo",
    "levitico",
    "numeros",
    "deuteronomio",
    "josue",
    "jueces",
    "rut",
    "1 samuel",
    "2 samuel",
    "1 reyes",
    "2 reyes",
    "1 cronicas",
    "2 cronicas",
    "esdras",
    "nehemias",
    "ester",
    "job",
    "salmos",
    "salmo",
    "proverbios",
    "eclesiastes",
    "cantares",
    "isaias",
    "jeremias",
    "lamentaciones",
    "ezequiel",
    "daniel",
    "oseas",
    "joel",
    "amos",
    "abdias",
    "jonas",
    "miqueas",
    "nahum",
    "habacuc",
    "sofonias",
    "hageo",
    "zacarias",
    "malaquias",
]

NEW_TESTAMENT_BOOKS = [
    "mateo",
    "marcos",
    "lucas",
    "juan",
    "hechos",
    "romanos",
    "1 corintios",
    "2 corintios",
    "galatas",
    "efesios",
    "filipenses",
    "colosenses",
    "1 tesalonicenses",
    "2 tesalonicenses",
    "1 timoteo",
    "2 timoteo",
    "tito",
    "filemon",
    "hebreos",
    "santiago",
    "1 pedro",
    "2 pedro",
    "1 juan",
    "2 juan",
    "3 juan",
    "judas",
    "apocalipsis",
]


def load_catechism_data(data_path: Path) -> dict:
    """Load and return the catechism JSON data."""
    with open(data_path, encoding="utf-8") as f:
        return json.load(f)


def build_search_index(data: dict) -> list[dict]:
    """Build a search index from the catechism data."""
    index = []

    for q in data["questions"]:
        # Add main question and answer
        index.append(
            {
                "number": q["number"],
                "type": "question",
                "question": q["question"],
                "answer": q["full_answer"],
                "url": f"/pregunta/{q['number']}.html",
            }
        )

        # Add Beddome subquestions
        for group_idx, group in enumerate(q.get("beddome_expansion", [])):
            for item in group.get("items", []):
                index.append(
                    {
                        "number": q["number"],
                        "type": "beddome",
                        "question": item.get("question", ""),
                        "answer": item.get("answer", ""),
                        "verse": item.get("verse", ""),
                        "reference": item.get("reference", ""),
                        "url": f"/pregunta/{q['number']}.html#grupo-{group_idx + 1}",
                    }
                )

    return index


def setup_jinja_env(templates_path: Path) -> Environment:
    """Set up and return Jinja2 environment."""
    env = Environment(loader=FileSystemLoader(templates_path), autoescape=True)
    return env


def copy_static_files(static_path: Path, output_path: Path) -> None:
    """Copy static files (CSS, JS, images) to output directory."""
    static_output = output_path

    # Copy CSS
    css_src = static_path / "css"
    css_dst = static_output / "css"
    if css_src.exists():
        if css_dst.exists():
            shutil.rmtree(css_dst)
        shutil.copytree(css_src, css_dst)

    # Copy JS
    js_src = static_path / "js"
    js_dst = static_output / "js"
    if js_src.exists():
        if js_dst.exists():
            shutil.rmtree(js_dst)
        shutil.copytree(js_src, js_dst)

    # Copy images
    images_src = static_path / "images"
    images_dst = static_output / "images"
    if images_src.exists():
        if images_dst.exists():
            shutil.rmtree(images_dst)
        shutil.copytree(images_src, images_dst)


def generate_sitemap(
    data: dict, output_path: Path, base_url: str = "https://catecismobautista.org"
) -> None:
    """Generate sitemap.xml for SEO."""
    today = datetime.now().strftime("%Y-%m-%d")

    urls = []

    # Homepage
    urls.append(
        {
            "loc": f"{base_url}/",
            "lastmod": today,
            "changefreq": "weekly",
            "priority": "1.0",
        }
    )

    # Search page
    urls.append(
        {
            "loc": f"{base_url}/buscar.html",
            "lastmod": today,
            "changefreq": "monthly",
            "priority": "0.5",
        }
    )

    # Statistics page
    urls.append(
        {
            "loc": f"{base_url}/estadisticas.html",
            "lastmod": today,
            "changefreq": "monthly",
            "priority": "0.6",
        }
    )

    # Question pages
    for q in data["questions"]:
        urls.append(
            {
                "loc": f"{base_url}/pregunta/{q['number']}.html",
                "lastmod": today,
                "changefreq": "yearly",
                "priority": "0.8",
            }
        )

    # Generate XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in urls:
        xml_content += "  <url>\n"
        xml_content += f"    <loc>{url['loc']}</loc>\n"
        xml_content += f"    <lastmod>{url['lastmod']}</lastmod>\n"
        xml_content += f"    <changefreq>{url['changefreq']}</changefreq>\n"
        xml_content += f"    <priority>{url['priority']}</priority>\n"
        xml_content += "  </url>\n"
    xml_content += "</urlset>\n"

    with open(output_path / "sitemap.xml", "w", encoding="utf-8") as f:
        f.write(xml_content)


def generate_robots_txt(
    output_path: Path, base_url: str = "https://catecismobautista.org"
) -> None:
    """Generate robots.txt for SEO."""
    content = f"""User-agent: *
Allow: /

Sitemap: {base_url}/sitemap.xml
"""
    with open(output_path / "robots.txt", "w", encoding="utf-8") as f:
        f.write(content)


def normalize_text(text: str) -> str:
    """Normalize text by removing accents and converting to lowercase."""
    import unicodedata

    normalized = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in normalized if unicodedata.category(c) != "Mn")


def extract_book_name(reference: str) -> str | None:
    """Extract the book name from a Bible reference."""
    if not reference:
        return None
    # Match patterns like "1 Juan 3:16" or "Salmos 23:1"
    match = re.match(r"^(\d?\s*[A-Za-záéíóúÁÉÍÓÚñÑ]+)", reference.strip())
    if match:
        return match.group(1).strip()
    return None


def categorize_book(book_name: str) -> str | None:
    """Categorize a book as Old or New Testament."""
    if not book_name:
        return None
    normalized = normalize_text(book_name)

    for ot_book in OLD_TESTAMENT_BOOKS:
        if normalized == ot_book or normalized.startswith(
            ot_book.split()[0] if " " in ot_book else ot_book[:4]
        ):
            return "old_testament"

    for nt_book in NEW_TESTAMENT_BOOKS:
        if normalized == nt_book or normalized.startswith(
            nt_book.split()[0] if " " in nt_book else nt_book[:4]
        ):
            return "new_testament"

    return None


def build_statistics(data: dict) -> dict:
    """Build comprehensive statistics from the catechism data."""
    stats = {
        "summary": {},
        "top_references": [],
        "questions_by_subquestion_count": [],
        "term_frequency": [],
        "word_cloud_data": [],
        "book_coverage": {"old_testament": {}, "new_testament": {}},
        "question_complexity": [],
        "scripture_concordance": {},
    }

    # Counters
    reference_counter = Counter()
    term_counter = Counter()
    book_counter = Counter()

    total_subquestions = 0
    total_references = 0

    questions_subq_counts = []
    questions_complexity = []

    for q in data["questions"]:
        q_subq_count = 0
        q_ref_count = 0

        # Collect text for term frequency
        texts = [q["question"], q["full_answer"]]

        for group in q.get("beddome_expansion", []):
            for item in group.get("items", []):
                q_subq_count += 1
                total_subquestions += 1

                # Add to texts
                texts.append(item.get("question", ""))
                texts.append(item.get("answer", ""))

                # Process reference
                ref = item.get("reference", "")
                if ref:
                    q_ref_count += 1
                    total_references += 1
                    reference_counter[ref] += 1

                    # Extract book name for coverage
                    book_name = extract_book_name(ref)
                    if book_name:
                        book_counter[book_name] += 1

                    # Build concordance
                    if ref not in stats["scripture_concordance"]:
                        stats["scripture_concordance"][ref] = []
                    stats["scripture_concordance"][ref].append(
                        {
                            "question": q["number"],
                            "subquestion": item.get("question", "")[:80],
                        }
                    )

        questions_subq_counts.append(
            {
                "number": q["number"],
                "question": q["question"],
                "subquestion_count": q_subq_count,
            }
        )

        questions_complexity.append(
            {
                "number": q["number"],
                "question": q["question"],
                "subquestion_count": q_subq_count,
                "reference_count": q_ref_count,
                "complexity_score": round(q_subq_count * 0.6 + q_ref_count * 0.4, 1),
            }
        )

        # Term frequency analysis
        for text in texts:
            if text:
                # Extract words with 4+ characters
                words = re.findall(r"\b[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ]{4,}\b", text.lower())
                for word in words:
                    normalized = normalize_text(word)
                    if normalized not in SPANISH_STOPWORDS and len(normalized) >= 4:
                        term_counter[normalized] += 1

    # Summary
    stats["summary"] = {
        "total_questions": data["total_questions"],
        "total_subquestions": total_subquestions,
        "total_references": total_references,
        "unique_references": len(reference_counter),
        "avg_subquestions_per_question": round(
            total_subquestions / data["total_questions"], 1
        ),
    }

    # Top 10 references
    stats["top_references"] = [
        {"reference": ref, "count": count}
        for ref, count in reference_counter.most_common(10)
    ]

    # Questions ranked by subquestion count
    stats["questions_by_subquestion_count"] = sorted(
        questions_subq_counts, key=lambda x: x["subquestion_count"], reverse=True
    )[:20]

    # Term frequency (top 50)
    stats["term_frequency"] = [
        {"term": term, "count": count} for term, count in term_counter.most_common(50)
    ]

    # Word cloud data (scaled for visualization)
    if term_counter:
        max_count = max(c for _, c in term_counter.most_common(1))
        stats["word_cloud_data"] = [
            [term, int((count / max_count) * 100) + 10]
            for term, count in term_counter.most_common(100)
        ]

    # Book coverage
    for book, count in book_counter.items():
        testament = categorize_book(book)
        if testament == "old_testament":
            stats["book_coverage"]["old_testament"][book] = count
        elif testament == "new_testament":
            stats["book_coverage"]["new_testament"][book] = count

    # Question complexity ranking
    stats["question_complexity"] = sorted(
        questions_complexity, key=lambda x: x["complexity_score"], reverse=True
    )[:20]

    return stats


def build_site(
    data_path: Path, templates_path: Path, static_path: Path, output_path: Path
) -> None:
    """Build the complete static site."""
    # Clean output directory (except .git)
    if output_path.exists():
        for item in output_path.iterdir():
            if item.name not in [".git", "CNAME"]:
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()
    else:
        output_path.mkdir(parents=True)

    # Load data
    print("Loading catechism data...")
    data = load_catechism_data(data_path)

    # Setup Jinja
    env = setup_jinja_env(templates_path)

    # Build search index
    print("Building search index...")
    search_index = build_search_index(data)
    data_output = output_path / "data"
    data_output.mkdir(exist_ok=True)
    with open(data_output / "search-index.json", "w", encoding="utf-8") as f:
        json.dump(search_index, f, ensure_ascii=False)

    # Copy static files
    print("Copying static files...")
    copy_static_files(static_path, output_path)

    # Generate homepage
    print("Generating homepage...")
    index_template = env.get_template("index.html")
    index_html = index_template.render(
        title=data["title"],
        description=data["description"],
        questions=data["questions"],
        total_questions=data["total_questions"],
    )
    with open(output_path / "index.html", "w", encoding="utf-8") as f:
        f.write(index_html)

    # Generate question pages
    print("Generating question pages...")
    question_template = env.get_template("question.html")
    questions_dir = output_path / "pregunta"
    questions_dir.mkdir(exist_ok=True)

    questions = data["questions"]
    for i, q in enumerate(questions):
        prev_q = questions[i - 1] if i > 0 else None
        next_q = questions[i + 1] if i < len(questions) - 1 else None

        question_html = question_template.render(
            title=data["title"],
            question=q,
            prev_question=prev_q,
            next_question=next_q,
            total_questions=data["total_questions"],
        )
        with open(questions_dir / f"{q['number']}.html", "w", encoding="utf-8") as f:
            f.write(question_html)

    # Generate search page
    print("Generating search page...")
    search_template = env.get_template("search.html")
    search_html = search_template.render(
        title=data["title"], total_questions=data["total_questions"]
    )
    with open(output_path / "buscar.html", "w", encoding="utf-8") as f:
        f.write(search_html)

    # Build statistics
    print("Building statistics...")
    statistics = build_statistics(data)
    with open(data_output / "statistics.json", "w", encoding="utf-8") as f:
        json.dump(statistics, f, ensure_ascii=False, indent=2)

    # Generate statistics page
    print("Generating statistics page...")
    stats_template = env.get_template("statistics.html")
    stats_html = stats_template.render(
        title=data["title"],
        total_questions=data["total_questions"],
        statistics=statistics,
    )
    with open(output_path / "estadisticas.html", "w", encoding="utf-8") as f:
        f.write(stats_html)

    # Generate sitemap and robots.txt
    print("Generating sitemap.xml...")
    generate_sitemap(data, output_path)
    print("Generating robots.txt...")
    generate_robots_txt(output_path)

    print(f"Site built successfully! Output: {output_path}")
    print(f"  - {len(questions)} question pages generated")
    print(f"  - {len(search_index)} search index entries")
    print(f"  - {statistics['summary']['total_subquestions']} subquestions indexed")
    print("  - sitemap.xml and robots.txt generated")


def main():
    """Main entry point."""
    # Determine paths relative to project root
    project_root = Path(__file__).parent.parent

    data_path = project_root / "catecismo-bautista-con-beddome-es.json"
    templates_path = project_root / "generator" / "templates"
    static_path = project_root / "static"
    output_path = project_root / "docs"

    build_site(data_path, templates_path, static_path, output_path)


if __name__ == "__main__":
    main()
