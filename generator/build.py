#!/usr/bin/env python3
"""Static site generator for El Catecismo Bautista con Beddome."""

import json
import shutil
from pathlib import Path

from jinja2 import Environment, FileSystemLoader


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
    """Copy static files (CSS, JS) to output directory."""
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

    print(f"Site built successfully! Output: {output_path}")
    print(f"  - {len(questions)} question pages generated")
    print(f"  - {len(search_index)} search index entries")


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
