# Second Chance - ITIL 4

## Project Overview

A static, single-page arcade-style quiz game for ITIL 4 Foundation study.

## Current Source Material

ITIL 4 PDFs and notes are stored under `courses/ITIL4/PDFs/`.

## Active Course

The active course id is `itil4`. The generated bank contains 105 exam-pool questions plus a 219-card glossary drill generated from the ITIL PDFs.

## Study Modes

- Normal, Study, Streak, and Review remain available.
- Study tools include Category, Weakness, Cram, Review Due, Interleave Weakness, Confidence, Red Flag, Pretest, Quickfire, Short Mix, Glossary Drill, and Instructor Focus.
- Short Mix pulls 25 random questions from the full non-glossary exam pool for shorter sessions.
- Glossary Drill pulls 25 random glossary cards and mixes term-to-definition with definition-to-term prompts.
- Instructor Focus is split into short drills: key concepts, guiding principles, four dimensions, SVS, SVC, 15 practice purposes, each of the seven high-weight practices, and a 40-question weighted mock.

## Development Notes

- No build step.
- Open `game.html` directly in a modern browser.
- Course data loads from `courses/itil4.json`.
- `js/course-data.js` contains bundled fallback data for direct `file://` play.
- Regenerate course/RAG artifacts with `python tools/build_itil4_course.py`.
