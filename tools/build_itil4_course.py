from __future__ import annotations

import json
import re
from pathlib import Path
from random import Random

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "courses" / "ITIL4"
PDF_ROOT = SOURCE_ROOT / "PDFs"
RAG_ROOT = SOURCE_ROOT / "rag"
COURSE_PATH = ROOT / "courses" / "itil4.json"
FALLBACK_PATH = ROOT / "js" / "course-data.js"

COURSE_ID = "itil4"
RNG = Random(20260617)

SECTIONS = [
    "Key Concepts",
    "Guiding Principles",
    "Four Dimensions",
    "Service Value System",
    "Service Value Chain",
    "Practice Purposes",
    "Detailed Practices",
    "Glossary Terms",
]

FOUNDATION_TERMS = [
    "service", "product", "service offering", "utility", "warranty", "value",
    "outcome", "output", "cost", "risk", "customer", "user", "sponsor",
    "service relationship", "service provision", "service consumption",
]

GUIDING_PRINCIPLES = [
    "Focus on value",
    "Start where you are",
    "Progress iteratively with feedback",
    "Collaborate and promote visibility",
    "Think and work holistically",
    "Keep it simple and practical",
    "Optimize and automate",
]

DIMENSIONS = [
    "Organizations and people",
    "Information and technology",
    "Partners and suppliers",
    "Value streams and processes",
]

SVC_ACTIVITIES = [
    "Plan",
    "Improve",
    "Engage",
    "Design and transition",
    "Obtain/build",
    "Deliver and support",
]

SVS_COMPONENTS = [
    "Guiding principles",
    "Governance",
    "Service value chain",
    "Practices",
    "Continual improvement",
]

PRACTICES = [
    "Information security management",
    "Relationship management",
    "Supplier management",
    "IT asset management",
    "Monitoring and event management",
    "Release management",
    "Service configuration management",
    "Deployment management",
    "Continual improvement",
    "Change enablement",
    "Incident management",
    "Problem management",
    "Service request management",
    "Service desk",
    "Service level management",
]

SEVEN_PRACTICES = [
    "Continual improvement",
    "Change enablement",
    "Incident management",
    "Problem management",
    "Service request management",
    "Service desk",
    "Service level management",
]

CATEGORY_FOCUS_TAGS = {
    "Key Concepts": "focus-key-concepts",
    "Guiding Principles": "focus-guiding-principles",
    "Four Dimensions": "focus-four-dimensions",
    "Service Value System": "focus-svs",
    "Service Value Chain": "focus-svc",
    "Practice Purposes": "focus-practice-purposes",
    "Detailed Practices": "focus-detailed-practices",
}

PRACTICE_FOCUS_MATCHERS = {
    "focus-continual-improvement": [
        "continual improvement",
        "improvement model",
        "what is the vision",
        "where are we now",
        "where do we want to be",
        "how do we get there",
        "take action",
        "did we get there",
        "keep the momentum",
    ],
    "focus-change-enablement": [
        "change enablement",
        "change authority",
        "change schedule",
        "standard change",
        "normal change",
        "emergency change",
        "change model",
        "authorize changes",
        "authorizing changes",
    ],
    "focus-incident-management": [
        "incident management",
        "incident",
        "major incident",
        "restore normal service",
        "restore service",
        "negative impact of incidents",
    ],
    "focus-problem-management": [
        "problem management",
        "problem",
        "known error",
        "workaround",
        "root cause",
        "problem control",
        "error control",
        "likelihood and impact of incidents",
    ],
    "focus-service-request-management": [
        "service request management",
        "service request",
        "user-initiated",
        "request fulfilment",
        "standard application",
        "standard service action",
    ],
    "focus-service-desk": [
        "service desk",
        "single point of contact",
        "entry point",
        "user-facing",
        "capture demand",
        "communication with users",
    ],
    "focus-service-level-management": [
        "service level management",
        "service level",
        "service level agreement",
        "sla",
        "business-based targets",
        "service performance targets",
    ],
}

INSTRUCTOR_FOCUS_DECKS = [
    {
        "id": "focus-key-concepts",
        "label": "Key Concepts",
        "hint": "Service, value, outcomes, roles, cost, risk",
        "group": "Short Topic Drills",
    },
    {
        "id": "focus-guiding-principles",
        "label": "Guiding Principles",
        "hint": "Recall and scenario mapping for the 7 principles",
        "group": "Short Topic Drills",
    },
    {
        "id": "focus-four-dimensions",
        "label": "Four Dimensions",
        "hint": "Name each dimension and map scenarios",
        "group": "Short Topic Drills",
    },
    {
        "id": "focus-svs",
        "label": "Service Value System",
        "hint": "SVS purpose, components, and relationships",
        "group": "Short Topic Drills",
    },
    {
        "id": "focus-svc",
        "label": "Service Value Chain",
        "hint": "Plan, improve, engage, design/transition, obtain/build, deliver/support",
        "group": "Short Topic Drills",
    },
    {
        "id": "focus-practice-purposes",
        "label": "15 Practice Purposes",
        "hint": "One-sentence purpose checks for the tested practices",
        "group": "Short Topic Drills",
    },
    {
        "id": "focus-continual-improvement",
        "label": "Continual Improvement",
        "hint": "Purpose, improvement model, and momentum",
        "group": "7 Practices Micro-Drills",
    },
    {
        "id": "focus-change-enablement",
        "label": "Change Enablement",
        "hint": "Standard, normal, emergency changes and authorization",
        "group": "7 Practices Micro-Drills",
    },
    {
        "id": "focus-incident-management",
        "label": "Incident Management",
        "hint": "Restore service quickly, major incidents, user impact",
        "group": "7 Practices Micro-Drills",
    },
    {
        "id": "focus-problem-management",
        "label": "Problem Management",
        "hint": "Problems, known errors, workarounds, cause reduction",
        "group": "7 Practices Micro-Drills",
    },
    {
        "id": "focus-service-request-management",
        "label": "Service Request Mgmt",
        "hint": "Predefined user requests and service actions",
        "group": "7 Practices Micro-Drills",
    },
    {
        "id": "focus-service-desk",
        "label": "Service Desk",
        "hint": "Single point of contact and user communication",
        "group": "7 Practices Micro-Drills",
    },
    {
        "id": "focus-service-level-management",
        "label": "Service Level Mgmt",
        "hint": "Business-based targets and service performance",
        "group": "7 Practices Micro-Drills",
    },
    {
        "id": "mock-40",
        "label": "40Q Mock",
        "hint": "Weighted: 17 practice questions, 13 Sections 3-5, 10 foundations",
        "group": "Exam Simulation",
    },
]

KEY_TERM_GROUPS = {
    "Key Concepts": FOUNDATION_TERMS,
    "Guiding Principles": GUIDING_PRINCIPLES,
    "Four Dimensions": DIMENSIONS,
    "Service Value System": SVS_COMPONENTS,
    "Service Value Chain": SVC_ACTIVITIES,
    "Practice Purposes": PRACTICES,
    "Detailed Practices": SEVEN_PRACTICES + [
        "standard change", "normal change", "emergency change", "incident",
        "problem", "known error", "workaround", "major incident",
    ],
}

DEFINITION_DISTRACTORS = {
    "Key Concepts": [
        "A formal description of one or more services designed for a target consumer group",
        "The assurance that a product or service will meet agreed requirements",
        "The functionality offered by a product or service to meet a particular need",
        "A tangible or intangible deliverable created by carrying out an activity",
        "A result for a stakeholder enabled by one or more outputs",
    ],
    "Guiding Principles": [
        "Assess the current state and reuse what is already useful",
        "Use smaller steps and feedback loops instead of trying to do everything at once",
        "Make work visible and involve the right stakeholders",
        "Consider the whole service system rather than optimizing isolated parts",
        "Simplify work by removing steps that do not contribute to outcomes",
        "Optimize work before automating it where appropriate",
    ],
    "Four Dimensions": [
        "The dimension that covers roles, responsibilities, culture, skills, and communication",
        "The dimension that covers information, knowledge, applications, and supporting technology",
        "The dimension that covers relationships with external organizations involved in service delivery",
        "The dimension that covers activities, workflows, controls, and procedures",
    ],
    "Service Value System": [
        "The component that evaluates, directs, and monitors the organization",
        "The central operating model that uses activities to respond to demand and create value",
        "The component made of organizational resources designed for performing work",
        "The component that recommends how decisions should be made in all circumstances",
    ],
    "Service Value Chain": [
        "The activity that provides a shared understanding of vision, current status, and direction",
        "The activity that provides stakeholder understanding, transparency, and good relationships",
        "The activity that ensures service components are available when and where needed",
        "The activity that ensures services are delivered and supported according to specifications",
    ],
    "Practice Purposes": [
        "To align practices and services with changing business needs through ongoing improvement",
        "To minimize the negative impact of incidents by restoring normal service operation quickly",
        "To reduce the likelihood and impact of incidents by managing causes and known errors",
        "To set clear business-based targets for service performance",
        "To ensure accurate information about configuration items is available when needed",
    ],
    "Detailed Practices": [
        "To restore normal service operation as quickly as possible",
        "To reduce the likelihood and impact of incidents by managing causes and known errors",
        "To handle predefined, user-initiated service requests effectively",
        "To capture demand for incident resolution and service requests",
        "To ensure risks are assessed, changes are authorized, and a change schedule is managed",
    ],
}

TERM_DISTRACTOR_MAP = {
    "service": ["Product", "Service offering", "Service relationship"],
    "product": ["Service", "Service offering", "Output"],
    "service offering": ["Service", "Product", "Service relationship"],
    "utility": ["Warranty", "Outcome", "Service offering"],
    "warranty": ["Utility", "Service level agreement", "Availability"],
    "outcome": ["Output", "Value", "Utility"],
    "output": ["Outcome", "Deliverable", "Value"],
    "cost": ["Risk", "Value", "Warranty"],
    "risk": ["Cost", "Issue", "Control"],
    "customer": ["User", "Sponsor", "Service consumer"],
    "user": ["Customer", "Sponsor", "Service provider"],
    "sponsor": ["Customer", "User", "Business relationship manager"],
    "release management": ["Deployment management", "Change enablement", "Service configuration management"],
    "deployment management": ["Release management", "Change enablement", "Service configuration management"],
    "incident management": ["Problem management", "Service request management", "Service desk"],
    "problem management": ["Incident management", "Continual improvement", "Monitoring and event management"],
    "service request management": ["Service desk", "Incident management", "Change enablement"],
    "service desk": ["Service request management", "Incident management", "Relationship management"],
    "service level management": ["Relationship management", "Supplier management", "Service desk"],
    "change enablement": ["Release management", "Deployment management", "Service configuration management"],
    "standard change": ["Normal change", "Emergency change", "Service request"],
    "normal change": ["Standard change", "Emergency change", "Change model"],
    "emergency change": ["Normal change", "Standard change", "Major incident"],
    "known error": ["Problem", "Incident", "Workaround"],
    "workaround": ["Known error", "Problem control", "Error control"],
}


def clean_text(value: str) -> str:
    value = value.replace("\u2013", "-").replace("\u2014", "-")
    value = value.replace("\u2018", "'").replace("\u2019", "'")
    value = value.replace("\u201c", '"').replace("\u201d", '"')
    return re.sub(r"\s+", " ", value).strip()


def read_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n\n".join(page.extract_text() or "" for page in reader.pages)


def write_rag_sources() -> list[dict]:
    sources_dir = RAG_ROOT / "sources"
    sources_dir.mkdir(parents=True, exist_ok=True)
    sources: list[dict] = []

    for path in sorted(PDF_ROOT.rglob("*")):
      if not path.is_file() or path.suffix.lower() not in {".pdf", ".md"}:
          continue
      rel = path.relative_to(SOURCE_ROOT).as_posix()
      if path.suffix.lower() == ".pdf":
          text = read_pdf_text(path)
      else:
          text = path.read_text(encoding="utf-8")
      text = text.replace("\r\n", "\n").replace("\r", "\n")
      out_name = re.sub(r"[^A-Za-z0-9]+", "_", rel).strip("_") + ".txt"
      out_path = sources_dir / out_name
      out_path.write_text(text, encoding="utf-8")
      sources.append({"source": rel, "textFile": out_path.relative_to(SOURCE_ROOT).as_posix(), "chars": len(text)})

    chunks: list[dict] = []
    chunk_size = 1200
    overlap = 180
    for source in sources:
        text = (SOURCE_ROOT / source["textFile"]).read_text(encoding="utf-8")
        normalized = clean_text(text)
        start = 0
        chunk_no = 1
        while start < len(normalized):
            end = min(len(normalized), start + chunk_size)
            chunk = normalized[start:end].strip()
            if chunk:
                chunks.append({
                    "id": f"{Path(source['source']).stem.lower().replace(' ', '-')}-{chunk_no:03d}",
                    "source": source["source"],
                    "text": chunk,
                })
            if end == len(normalized):
                break
            start = max(0, end - overlap)
            chunk_no += 1

    (RAG_ROOT / "chunks.jsonl").write_text(
        "\n".join(json.dumps(c, ensure_ascii=False) for c in chunks) + "\n",
        encoding="utf-8",
    )
    (RAG_ROOT / "manifest.json").write_text(
        json.dumps({"sources": sources, "chunkCount": len(chunks)}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return sources


def extract_glossary() -> list[dict]:
    path = PDF_ROOT / "Study" / "ITIL-4-Foundation_Glossary_Digital.pdf"
    reader = PdfReader(str(path))
    entries: list[dict] = []

    for page in reader.pages:
        parts: list[dict] = []

        def visitor(text, cm, tm, font_dict, font_size):
            text = clean_text(text)
            if not text:
                return
            font = str(font_dict.get("/BaseFont", "")) if font_dict else ""
            x = float(tm[4])
            y = float(tm[5])
            if y < 40 or y > 790:
                return
            if "Copyright" in text or text in {"Glossary", "ITIL", "Official Training Materials"}:
                return
            if re.fullmatch(r"\d+(\s+\d+)?", text):
                return
            parts.append({"x": x, "y": y, "font": font, "text": text})

        page.extract_text(visitor_text=visitor)
        if not parts:
            continue

        cols: list[float] = []
        for x in sorted(p["x"] for p in parts):
            if not cols or abs(x - cols[-1]) > 20:
                cols.append(x)

        for col in cols:
            items = [p for p in parts if abs(p["x"] - col) < 20]
            items.sort(key=lambda p: -p["y"])
            current = None
            for item in items:
                is_term = "SemiBold" in item["font"]
                if is_term:
                    if current and not current["definition"]:
                        current["term"] += " " + item["text"]
                    else:
                        if current and current["definition"]:
                            entries.append(current)
                        current = {"term": item["text"], "definition": []}
                elif current:
                    current["definition"].append(item["text"])
            if current and current["definition"]:
                entries.append(current)

    seen = set()
    clean_entries = []
    for entry in entries:
        term = clean_text(entry["term"])
        definition = clean_text(" ".join(entry["definition"])).replace("cost- effective", "cost-effective")
        key = term.lower()
        if key in seen or len(term) < 2 or len(definition) < 8:
            continue
        seen.add(key)
        clean_entries.append({"term": term, "definition": definition})
    return clean_entries


def parse_official_sample() -> list[dict]:
    question_pdf = PDF_ROOT / "Study" / "ITIL 4 Question Bank.pdf"
    rationale_pdf = PDF_ROOT / "Study" / "ITIL 4 Question Bank Rationale.pdf"

    q_text = "\n".join((page.extract_text() or "") for page in PdfReader(str(question_pdf)).pages[1:])
    q_lines = []
    for line in q_text.splitlines():
        s = line.strip()
        if not s:
            q_lines.append("")
            continue
        if s.startswith(("The ITIL", "AXELOS", "Reproduction", "All rights reserved.", "EN_ITIL4")):
            continue
        if s.startswith("Page ") or s.startswith("©"):
            continue
        q_lines.append(s)
    clean = "\n".join(q_lines)
    parts = re.split(r"(?m)^\s*(\d+)\)\s*", clean)

    answer_text = "\n".join((page.extract_text() or "") for page in PdfReader(str(rationale_pdf)).pages[1:])
    answers = {int(n): letter for n, letter in re.findall(r"(?m)^\s*(\d+)\s+([A-D])\b", answer_text)}

    questions = []
    for i in range(1, len(parts), 2):
        number = int(parts[i])
        body = parts[i + 1].strip()
        marker = re.search(r"(?m)^A\.\s*", body)
        if not marker:
            continue
        stem = clean_text(body[: marker.start()])
        rest = body[marker.start() :]
        opt_parts = re.split(r"(?m)^([A-D])\.\s*", rest)
        options = {}
        for j in range(1, len(opt_parts), 2):
            options[opt_parts[j]] = clean_text(opt_parts[j + 1])
        correct_letter = answers[number]
        correct = options[correct_letter]
        distractors = [options[l] for l in "ABCD" if l != correct_letter]
        questions.append(make_question(
            category=category_for_official(stem + " " + correct),
            prompt=stem,
            correct=correct,
            distractors=distractors,
            explain=f"Official sample paper answer {correct_letter}: {correct}.",
            source="Official ITIL 4 Foundation sample paper 2",
            qtype="official-sample",
        ))
    return questions


def category_for_official(text: str) -> str:
    low = text.lower()
    if "guiding principle" in low or "start where you are" in low or "focus on value" in low:
        return "Guiding Principles"
    if "dimension" in low or "organizations and people" in low:
        return "Four Dimensions"
    if "service value system" in low:
        return "Service Value System"
    if "value chain" in low or "engage" in low or "obtain/build" in low or "deliver" in low:
        return "Service Value Chain"
    if any(k in low for k in ["incident", "problem", "service desk", "service request", "service level", "supplier", "relationship", "asset", "release", "deployment", "configuration", "monitoring"]):
        return "Detailed Practices"
    return "Key Concepts"


def make_question(category, prompt, correct, distractors, explain, source, qtype="coach", include=True, **extra):
    return {
        "q": clean_text(prompt),
        "category": category,
        "correct": clean_text(correct),
        "distractors": [clean_text(d) for d in distractors],
        "explain": clean_text(explain),
        "source": source,
        "type": qtype,
        "includeInFullDeck": include,
        "isBoss": False,
        **extra,
    }


def q(category, prompt, correct, distractors, explain, **extra):
    return make_question(category, prompt, correct, distractors, explain, "ITIL 4 PDFs and study guide", **extra)


def token_set(value: str) -> set[str]:
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "into", "are",
        "its", "their", "when", "where", "which", "what", "how", "why",
        "service", "services", "management", "practice", "activity",
    }
    return {t for t in re.findall(r"[a-z0-9]+", value.lower()) if len(t) > 2 and t not in stop}


def similarity(a: str, b: str) -> float:
    left = token_set(a)
    right = token_set(b)
    if not left or not right:
        return 0
    return len(left & right) / len(left | right)


def nearest_entries(entry: dict, entries: list[dict], limit: int = 3) -> list[dict]:
    ranked = []
    for other in entries:
        if other["term"] == entry["term"]:
            continue
        score = similarity(entry["term"] + " " + entry["definition"], other["term"] + " " + other["definition"])
        ranked.append((score, other))
    ranked.sort(key=lambda item: item[0], reverse=True)
    chosen = [other for score, other in ranked[:limit] if score > 0]
    if len(chosen) < limit:
        pool = [e for e in entries if e["term"] != entry["term"] and e not in chosen]
        chosen += RNG.sample(pool, limit - len(chosen))
    return chosen[:limit]


def related_distractors(question: dict) -> list[str] | None:
    if question["type"] == "official-sample":
        return None
    correct = question["correct"].lower()
    if correct in TERM_DISTRACTOR_MAP:
        return TERM_DISTRACTOR_MAP[correct]
    group = KEY_TERM_GROUPS.get(question["category"], [])
    if any(correct == term.lower() for term in group):
        return [term for term in group if term.lower() != correct][:3]
    is_list_answer = ";" in question["correct"] or question["q"].lower().startswith(("which list", "which set"))
    if len(question["correct"]) > 70 and not is_list_answer and question["category"] in DEFINITION_DISTRACTORS:
        candidates = [
            text for text in DEFINITION_DISTRACTORS[question["category"]]
            if text.lower() != correct
        ]
        return candidates[:3]
    return None


def improve_question_distractors(questions: list[dict]) -> None:
    bad_markers = ["always ", "only ", "alphabetical", "all user questions", "technology teams"]
    for question in questions:
        improved = related_distractors(question)
        if improved:
            question["distractors"] = [clean_text(item) for item in improved]
            continue
        if any(marker in " ".join(question["distractors"]).lower() for marker in bad_markers):
            candidates = DEFINITION_DISTRACTORS.get(question["category"], [])
            replacements = [c for c in candidates if c.lower() != question["correct"].lower()]
            if len(replacements) >= 3:
                question["distractors"] = replacements[:3]


def coach_questions() -> list[dict]:
    questions = [
        q("Key Concepts", "In ITIL terms, what is a service?", "A means of enabling value co-creation by facilitating outcomes customers want without the customer managing specific costs and risks", ["A tangible deliverable created by an activity", "A configured set of resources that may be valuable to customers", "A contract that defines service targets and penalties"], "A service helps customers achieve outcomes while the provider manages specific costs and risks."),
        q("Key Concepts", "Which term means what a service does and whether it is fit for purpose?", "Utility", ["Warranty", "Outcome", "Service offering"], "Utility is the functionality of the service: what it does."),
        q("Key Concepts", "Which term means how a service performs and whether it is fit for use?", "Warranty", ["Utility", "Output", "Value stream"], "Warranty is assurance that agreed requirements such as availability, capacity, security, or continuity are met."),
        q("Key Concepts", "A report is generated by a monitoring tool. In ITIL terms, what is the report?", "Output", ["Outcome", "Value", "Warranty"], "An output is a tangible or intangible deliverable of an activity."),
        q("Key Concepts", "A sales team closes work faster because a CRM is available on mobile devices. What is this result?", "Outcome", ["Output", "Configuration item", "Service request"], "An outcome is a result for a stakeholder enabled by one or more outputs."),
        q("Key Concepts", "Who defines requirements for a service and takes responsibility for the outcomes of service consumption?", "Customer", ["User", "Sponsor", "Supplier"], "The customer role defines requirements and owns outcomes."),
        q("Key Concepts", "Who authorizes the budget for service consumption?", "Sponsor", ["User", "Customer", "Service desk"], "The sponsor authorizes budget for service consumption."),
        q("Key Concepts", "What is value in ITIL?", "The perceived benefits, usefulness, and importance of something", ["The money spent on a resource", "A deliverable created by an activity", "A possible event that could cause harm"], "Value is based on perception of benefits, usefulness, and importance."),
        q("Key Concepts", "Which term means uncertainty of outcome?", "Risk", ["Cost", "Warranty", "Demand"], "Risk is uncertainty of outcome and may cause harm or make objectives harder to achieve."),
        q("Key Concepts", "A formal description of services designed for a target consumer group is a:", "Service offering", ["Service provision", "Service consumption", "Service relationship"], "A service offering may include goods, access to resources, and service actions."),
        q("Key Concepts", "Which pair best distinguishes product and service offering?", "A product is a configuration of resources; a service offering is a formal description presented to consumers", ["A product is always intangible; a service offering is always physical", "A product is consumed only by users; a service offering is consumed only by sponsors", "A product is a practice; a service offering is a value chain activity"], "Products are resource configurations. Offerings describe one or more services for a target group."),
        q("Key Concepts", "Which statement best distinguishes customer and user?", "The customer defines requirements and outcomes; the user uses the service", ["The user funds the service; the customer only opens incidents", "The customer operates the service desk; the user manages risks", "The user owns the SLA; the customer only receives outputs"], "Customer, user, and sponsor are separate service consumer roles."),

        q("Guiding Principles", "Which list contains all seven ITIL guiding principles?", "Focus on value; start where you are; progress iteratively with feedback; collaborate and promote visibility; think and work holistically; keep it simple and practical; optimize and automate", ["Plan; improve; engage; design and transition; obtain/build; deliver and support; govern", "Incident; problem; change; request; release; deployment; service desk", "Organizations and people; information and technology; partners and suppliers; value streams and processes; governance; practices; continual improvement"], "These seven recommendations guide decisions in all circumstances."),
        q("Guiding Principles", "A team wants to remove steps from a process that no longer create useful outcomes. Which guiding principle fits best?", "Keep it simple and practical", ["Optimize and automate", "Start where you are", "Collaborate and promote visibility"], "Keep it simple and practical eliminates unnecessary work and focuses on value."),
        q("Guiding Principles", "Before replacing a process, a manager observes the current process and identifies what can be reused. Which principle is this?", "Start where you are", ["Focus on value", "Progress iteratively with feedback", "Think and work holistically"], "Start where you are means assess and use what already exists when it is useful."),
        q("Guiding Principles", "A team releases a small improvement, checks results, and adjusts the next step. Which principle is this?", "Progress iteratively with feedback", ["Optimize and automate", "Focus on value", "Keep it simple and practical"], "Iterative progress uses small steps and feedback loops."),
        q("Guiding Principles", "A workflow improvement includes service desk, development, suppliers, and users so work is visible and understood. Which principle fits best?", "Collaborate and promote visibility", ["Start where you are", "Optimize and automate", "Focus on value"], "The principle emphasizes involving the right people and making work visible."),
        q("Guiding Principles", "A team reviews process, people, suppliers, and technology before changing a service. Which principle fits best?", "Think and work holistically", ["Keep it simple and practical", "Start where you are", "Progress iteratively with feedback"], "Holistic work considers the whole service system, not isolated parts."),
        q("Guiding Principles", "Which principle says automation should usually come after the work has been improved?", "Optimize and automate", ["Collaborate and promote visibility", "Focus on value", "Start where you are"], "Optimize first so automation does not lock in waste."),
        q("Guiding Principles", "A service team asks, 'How does this activity help the customer or organization?' Which guiding principle are they applying?", "Focus on value", ["Think and work holistically", "Progress iteratively with feedback", "Optimize and automate"], "Focus on value links activities directly or indirectly to value."),

        q("Four Dimensions", "Which list names the four dimensions of service management?", "Organizations and people; information and technology; partners and suppliers; value streams and processes", ["Plan; improve; engage; design and transition", "Utility; warranty; cost; risk", "Governance; practices; service value chain; continual improvement"], "The four dimensions must be considered to support value creation."),
        q("Four Dimensions", "A service design issue is mostly about roles, skills, communication, and culture. Which dimension is in focus?", "Organizations and people", ["Information and technology", "Partners and suppliers", "Value streams and processes"], "This dimension covers structure, responsibilities, culture, skills, and communication."),
        q("Four Dimensions", "A team is selecting databases, monitoring tools, and knowledge repositories. Which dimension is in focus?", "Information and technology", ["Organizations and people", "Partners and suppliers", "Value streams and processes"], "This dimension covers information, knowledge, and technology used for services."),
        q("Four Dimensions", "A service depends heavily on a cloud provider and a hardware vendor. Which dimension is most directly involved?", "Partners and suppliers", ["Value streams and processes", "Organizations and people", "Information and technology"], "This dimension covers relationships with external organizations involved in service delivery."),
        q("Four Dimensions", "A team maps activities, handoffs, controls, and workflow bottlenecks. Which dimension is in focus?", "Value streams and processes", ["Information and technology", "Partners and suppliers", "Organizations and people"], "This dimension covers workflows, controls, activities, and procedures."),
        q("Four Dimensions", "Why should all four dimensions be considered?", "Ignoring one can weaken the service and reduce value", ["They replace the service value chain", "They are used only for supplier contracts", "They apply only to technology teams"], "The dimensions work together; a weakness in one can affect the whole service."),

        q("Service Value System", "What is the purpose of the Service Value System?", "To show how the organization's components and activities work together to create value", ["To list only the ITIL practices in alphabetical order", "To define a single fixed workflow for all services", "To replace governance with automation"], "The SVS is the high-level model for turning demand and opportunities into value."),
        q("Service Value System", "Which set lists the main components of the SVS?", "Guiding principles, governance, service value chain, practices, continual improvement", ["Utility, warranty, cost, risk, output", "Incident, problem, change, release, deployment", "Plan, improve, engage, obtain/build, support"], "These are the core SVS components in ITIL 4."),
        q("Service Value System", "Which SVS component directs and controls the organization?", "Governance", ["Practices", "Service value chain", "Service offering"], "Governance evaluates, directs, and monitors the organization."),
        q("Service Value System", "Which SVS component is the operating model made of activities such as Plan and Engage?", "Service value chain", ["Guiding principles", "Practices", "Continual improvement"], "The service value chain is the central operating model of the SVS."),
        q("Service Value System", "Which SVS component provides organizational resources designed for work or objectives?", "Practices", ["Governance", "Guiding principles", "Demand"], "Practices are sets of resources for performing work or accomplishing objectives."),
        q("Service Value System", "Which input to the SVS represents needs or possibilities from stakeholders?", "Demand and opportunity", ["Warranty and utility", "Known errors", "Configuration records"], "The SVS converts demand and opportunity into value."),

        q("Service Value Chain", "Which list contains all six service value chain activities?", "Plan; improve; engage; design and transition; obtain/build; deliver and support", ["Focus; start; progress; collaborate; think; optimize", "Incident; problem; change; request; release; deployment", "Governance; practices; principles; dimensions; value; outcomes"], "These six activities combine in different ways to form value streams."),
        q("Service Value Chain", "What is the main purpose of Engage?", "Provide a good understanding of stakeholder needs, transparency, continual engagement, and good relationships", ["Ensure service components are available when needed", "Restore normal service operation quickly", "Authorize changes based on risk"], "Engage focuses on stakeholders and relationships."),
        q("Service Value Chain", "Which activity ensures products and services meet expectations for quality, cost, and time to market?", "Design and transition", ["Plan", "Obtain/build", "Deliver and support"], "Design and transition moves products and services toward useful live operation."),
        q("Service Value Chain", "Which activity ensures service components are available when and where needed?", "Obtain/build", ["Improve", "Engage", "Plan"], "Obtain/build covers acquiring or building components that meet specifications."),
        q("Service Value Chain", "Which activity ensures services are delivered and supported according to agreed specifications?", "Deliver and support", ["Design and transition", "Improve", "Engage"], "Deliver and support handles actual delivery and support of services."),
        q("Service Value Chain", "Which activity gives a shared understanding of vision, current status, and improvement direction?", "Plan", ["Improve", "Engage", "Obtain/build"], "Plan aligns direction across products, services, and dimensions."),
        q("Service Value Chain", "Which activity ensures continual improvement across all value chain activities?", "Improve", ["Plan", "Deliver and support", "Engage"], "Improve applies across the value chain and practices."),
        q("Service Value Chain", "A value stream for a new service starts with understanding demand, designs the service, builds components, then supports it. Which activities are likely involved?", "Engage, design and transition, obtain/build, deliver and support", ["Incident, problem, change, release", "Focus, start, progress, optimize", "Utility, warranty, output, outcome"], "Value streams use value chain activities in combinations and sequences."),

        q("Practice Purposes", "What is the purpose of information security management?", "Protect the information needed by the organization to conduct its business", ["Move new or changed components to live environments", "Capture demand for incident resolution and service requests", "Manage suppliers and their performance"], "Information security management protects confidentiality, integrity, and availability."),
        q("Practice Purposes", "What is the purpose of relationship management?", "Establish and nurture links between the organization and stakeholders at strategic and tactical levels", ["Restore normal service operation quickly", "Ensure service components are available when needed", "Observe services and report selected state changes"], "Relationship management focuses on stakeholder relationships."),
        q("Practice Purposes", "What is the purpose of supplier management?", "Ensure suppliers and their performance are managed appropriately", ["Authorize changes based on risk", "Handle user-initiated service requests", "Manage the lifecycle of IT assets"], "Supplier management supports quality supplier relationships and performance."),
        q("Practice Purposes", "What is the purpose of IT asset management?", "Plan and manage the full lifecycle of all IT assets", ["Protect information used by the organization", "Capture demand through a single point of contact", "Move new service components to live environments"], "IT asset management focuses on financially valuable components."),
        q("Practice Purposes", "What is the purpose of monitoring and event management?", "Systematically observe services and service components, then record and report selected changes of state", ["Resolve every incident permanently", "Authorize emergency changes", "Define service requirements and outcomes"], "Monitoring and event management identifies meaningful events."),
        q("Practice Purposes", "What is the purpose of release management?", "Make new and changed services and features available for use", ["Move components into live environments", "Ensure configuration information is accurate", "Handle all user questions"], "Release management makes features available; deployment moves components."),
        q("Practice Purposes", "What is the purpose of service configuration management?", "Ensure accurate and reliable information about services and configuration items is available when needed", ["Manage budgets for service consumption", "Protect business information", "Assess supplier culture"], "Configuration management maintains information about CIs and relationships."),
        q("Practice Purposes", "What is the purpose of deployment management?", "Move new or changed hardware, software, documentation, processes, or other components to live environments", ["Make features available to users", "Prioritize problems by impact", "Set business-based service targets"], "Deployment physically or logically moves components."),
        q("Practice Purposes", "A team needs to make a new version available to users. Which practice is most directly involved?", "Release management", ["Problem management", "Service desk", "Information security management"], "Release management makes new and changed services/features available."),
        q("Practice Purposes", "A team needs records showing which servers support a service and how they relate. Which practice fits?", "Service configuration management", ["Supplier management", "Relationship management", "Continual improvement"], "Configuration management provides reliable CI and service configuration information."),

        q("Detailed Practices", "What is the main goal of incident management?", "Restore normal service operation as quickly as possible and minimize negative impact", ["Identify root causes and prevent future incidents", "Authorize all changes to proceed", "Create service level targets"], "Incident management focuses on restoring service quickly."),
        q("Detailed Practices", "What is the main goal of problem management?", "Reduce the likelihood and impact of incidents by managing causes, workarounds, and known errors", ["Restore service as quickly as possible", "Capture all user contacts", "Move releases into live environments"], "Problem management focuses on causes and prevention."),
        q("Detailed Practices", "Which statement best compares incident and problem management?", "Incident management restores service; problem management manages causes and reduces future impact", ["Incident management owns suppliers; problem management owns budgets", "Incident management handles only normal changes; problem management handles standard changes", "Incident management creates service offerings; problem management consumes services"], "Incident and problem management are related but have different goals."),
        q("Detailed Practices", "What is a known error?", "A problem that has been analyzed but has not been resolved", ["A change that has been pre-authorized", "An event that has no significance", "A service request that failed validation"], "Known errors are managed through error control in problem management."),
        q("Detailed Practices", "What is a workaround?", "A solution that reduces or eliminates the impact of an incident or problem where full resolution is not yet available", ["A change model for standard changes", "A supplier contract clause", "A metric baseline"], "Workarounds reduce impact while a permanent solution is unavailable."),
        q("Detailed Practices", "Which change type is usually pre-authorized, low risk, and follows an established procedure?", "Standard change", ["Emergency change", "Normal change", "Major incident"], "Standard changes are typically low risk and pre-authorized."),
        q("Detailed Practices", "Which change type requires rapid action and may use a separate change authority?", "Emergency change", ["Standard change", "Service request", "Known error"], "Emergency changes are expedited because delay would increase risk or impact."),
        q("Detailed Practices", "A user asks for access to a standard application from an approved catalog. Which practice usually handles it?", "Service request management", ["Problem management", "Incident management", "Monitoring and event management"], "Service request management handles predefined, user-initiated requests."),
        q("Detailed Practices", "Which practice is the entry point and single point of contact for users?", "Service desk", ["Supplier management", "Deployment management", "IT asset management"], "The service desk captures demand for incident resolution and service requests."),
        q("Detailed Practices", "Which practice sets clear business-based targets for service performance?", "Service level management", ["Service configuration management", "Release management", "Problem management"], "Service level management defines and manages service performance targets."),
        q("Detailed Practices", "A production outage affects many users and needs a special process and high visibility. What is this?", "Major incident", ["Standard change", "Service offering", "Configuration item"], "Major incidents often require separate procedures and focused communication."),
        q("Detailed Practices", "Which practice typically owns communication with users during incidents and requests?", "Service desk", ["IT asset management", "Supplier management", "Release management"], "The service desk is the user-facing communication point."),
        q("Detailed Practices", "A recurring login failure is restored each time by restarting a service, but the cause is unknown. Which practice should investigate the cause?", "Problem management", ["Service request management", "Service level management", "Release management"], "Repeated incidents often lead to problem management investigation."),
        q("Detailed Practices", "Which continual improvement step asks for the starting point?", "Where are we now?", ["What is the vision?", "How do we keep the momentum going?", "Did we get there?"], "The improvement model establishes current state before planning movement."),
        q("Detailed Practices", "What should every problem be prioritized by?", "Potential impact and probability", ["Alphabetical order of affected service", "Date the workaround was written", "Number of configuration records"], "Problem prioritization should reflect risk: potential impact and probability."),
    ]
    return questions


def glossary_questions(glossary: list[dict]) -> list[dict]:
    questions = []
    term_prompts = [
        "Which ITIL glossary term fits this definition? {definition}",
        "Name the term: {definition}",
        "This definition is describing which term? {definition}",
        "Pick the glossary term that best matches: {definition}",
    ]
    definition_prompts = [
        "What does '{term}' mean in ITIL 4?",
        "Which definition best matches '{term}'?",
        "Choose the most accurate definition of '{term}'.",
        "In the glossary, '{term}' means:",
    ]
    for idx, entry in enumerate(glossary):
        neighbors = nearest_entries(entry, glossary, 3)
        if idx % 2 == 0:
            prompt = term_prompts[idx % len(term_prompts)].format(definition=entry["definition"])
            correct = entry["term"]
            distractors = [item["term"] for item in neighbors]
            qtype = "glossary-term"
        else:
            prompt = definition_prompts[idx % len(definition_prompts)].format(term=entry["term"])
            correct = entry["definition"]
            distractors = [item["definition"] for item in neighbors]
            qtype = "glossary-definition"
        questions.append(make_question(
            category="Glossary Terms",
            prompt=prompt,
            correct=correct,
            distractors=distractors,
            explain=f"{entry['term']}: {entry['definition']}",
            source="ITIL 4 Foundation glossary PDF",
            qtype=qtype,
            include=False,
            instructorFocus=["glossary"],
        ))
    return questions


def assign_ids(questions: list[dict]) -> list[dict]:
    for idx, question in enumerate(questions, 1):
        question["id"] = idx
        if idx in {8, 22, 39, 54, 71, 89} and question.get("includeInFullDeck", True):
            question["isBoss"] = True
    return questions


def add_instructor_focus(questions: list[dict]) -> None:
    sections_3_to_5 = {
        "Four Dimensions",
        "Service Value System",
        "Service Value Chain",
        "Guiding Principles",
        "Practice Purposes",
        "Detailed Practices",
    }
    seven_terms = [term.lower() for term in SEVEN_PRACTICES]
    seven_related = seven_terms + [
        "incident", "problem", "known error", "workaround", "major incident",
        "standard change", "normal change", "emergency change", "service request",
        "service desk", "service level",
    ]
    for question in questions:
        focus = set(question.get("instructorFocus", []))
        if question.get("includeInFullDeck", True):
            focus.add("lessons-1-5")
            category_focus = CATEGORY_FOCUS_TAGS.get(question["category"])
            if category_focus:
                focus.add(category_focus)
        if question["category"] in sections_3_to_5 and question.get("includeInFullDeck", True):
            focus.add("sections-3-5")
        haystack = " ".join([
            question.get("q", ""),
            question.get("correct", ""),
            question.get("explain", ""),
            question.get("category", ""),
        ]).lower()
        if question.get("includeInFullDeck", True) and (
            question["category"] == "Detailed Practices"
            or any(term in haystack for term in seven_related)
        ):
            focus.add("seven-practices")
            focus.add("sections-3-5")
        if question.get("includeInFullDeck", True):
            for tag, matchers in PRACTICE_FOCUS_MATCHERS.items():
                if any(matcher in haystack for matcher in matchers):
                    focus.add(tag)
        question["instructorFocus"] = sorted(focus)


def main() -> None:
    sources = write_rag_sources()
    glossary = extract_glossary()
    questions = parse_official_sample() + coach_questions() + glossary_questions(glossary)
    improve_question_distractors(questions)
    add_instructor_focus(questions)
    assign_ids(questions)
    course = {
        "id": COURSE_ID,
        "name": "ITIL 4 Foundation",
        "categories": SECTIONS,
        "fullDeckCategories": [s for s in SECTIONS if s != "Glossary Terms"],
        "instructorFocusDecks": INSTRUCTOR_FOCUS_DECKS,
        "shortStudySize": 25,
        "glossaryDrillSize": 25,
        "sourceSummary": {
            "sourceFolder": "courses/ITIL4/PDFs",
            "ragManifest": "courses/ITIL4/rag/manifest.json",
            "pdfSourceCount": len([s for s in sources if s["source"].lower().endswith(".pdf")]),
            "glossaryTermCount": len(glossary),
        },
        "glossary": glossary,
        "questions": questions,
    }
    COURSE_PATH.write_text(json.dumps(course, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    fallback = (
        "// Generated fallback course data for direct file:// play.\n"
        "window.COURSE_DATA = window.COURSE_DATA || {};\n"
        f"window.COURSE_DATA.{COURSE_ID} = "
        + json.dumps(course, indent=2, ensure_ascii=False)
        + ";\n"
    )
    FALLBACK_PATH.write_text(fallback, encoding="utf-8")
    print(json.dumps({
        "course": str(COURSE_PATH.relative_to(ROOT)),
        "questions": len(questions),
        "fullDeckQuestions": sum(1 for q in questions if q.get("includeInFullDeck", True)),
        "glossaryTerms": len(glossary),
        "ragSources": len(sources),
    }, indent=2))


if __name__ == "__main__":
    main()
