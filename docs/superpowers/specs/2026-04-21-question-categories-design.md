# Question Categories — CompTIA Domain Breakdown

**Goal:** Tag all 51 questions with CompTIA exam domains. End screen shows a category breakdown bar chart so users can see which topics they need to study next.

## Data Changes

- Add `category` field to each question object in the `QUESTIONS` array
- Four categories matching official CompTIA domains:
  - `Operating Systems` — Windows, Linux, macOS, virtualization, scripting, networking OS topics
  - `Security` — wireless security, password attacks, policies, physical security, encryption, social engineering, malware, PII
  - `Software Troubleshooting` — app/OS repair, browser issues, mobile app issues
  - `Operational Procedures` — change management, backups, IT ops, training, documentation

## State Changes

- Add `categoryStats` to state: `{ "Operating Systems": { correct: 0, missed: 0 }, ... }`
- Initialize in `startGame()` and `startReview()`
- Update in `handleAnswer` — increment correct or missed for the current question's category
- Reset in `startGame()` and `startReview()`

## UI Changes

- End screen: after the grade card, render a "CATEGORY BREAKDOWN" section
- Each category gets one row with:
  - Category name (left-aligned, ~200px wide)
  - Colored bar showing correct/total ratio (e.g., `████████░░░░░░░░`)
  - Count (e.g., `10/16`)
- Color palette per category:
  - `Operating Systems` — cyan (`var(--cyan)`)
  - `Security` — pink (`var(--pink)`)
  - `Software Troubleshooting` — green (`var(--green)`)
  - `Operational Procedures` — yellow (`var(--yellow)`)
- Bar uses block characters (U+2588 FULL BLOCK / U+2591 LIGHT SHADE), 12 total width

## Question Category Mapping

| # | Category |
|---|----------|
| 1 | Operational Procedures |
| 2 | Security |
| 3 | Software Troubleshooting |
| 4 | Operating Systems |
| 5 | Software Troubleshooting |
| 6 | Operational Procedures |
| 7 | Software Troubleshooting |
| 8 | Software Troubleshooting |
| 9 | Operational Procedures |
| 10 | Operating Systems |
| 11 | Security |
| 12 | Security |
| 13 | Operating Systems |
| 14 | Operating Systems |
| 15 | Security |
| 16 | Operational Procedures |
| 17 | Operating Systems |
| 18 | Operating Systems |
| 19 | Operational Procedures |
| 20 | Operating Systems |
| 21 | Operating Systems |
| 22 | Operating Systems |
| 23 | Security |
| 24 | Operating Systems |
| 25 | Operating Systems |
| 26 | Operating Systems |
| 27 | Software Troubleshooting |
| 28 | Software Troubleshooting |
| 29 | Security |
| 30 | Software Troubleshooting |
| 31 | Operating Systems |
| 32 | Security |
| 33 | Operational Procedures |
| 34 | Operating Systems |
| 35 | Operational Procedures |
| 36 | Security |
| 37 | Security |
| 38 | Operating Systems |
| 39 | Software Troubleshooting |
| 40 | Software Troubleshooting |
| 41 | Security |
| 42 | Operating Systems |
| 43 | Security |
| 44 | Operating Systems |
| 45 | Security |
| 46 | Operating Systems |
| 47 | Security |
| 48 | Security |
| 49 | Operating Systems |
| 50 | Operating Systems |
| 51 | Operating Systems |

## Mode Handling

- **Normal mode:** Category breakdown shows all 51 questions attempted
- **Streak mode:** Breakdown shows only questions attempted (up to the miss)
- **Review mode:** Breakdown shows only the reviewed questions (missed from the original run)

## Edge Cases

- Categories with 0 attempts still display (bar shows `░░░░░░░░░░░░ 0/0`)
- Streak mode with 0 correct: all bars show 0/0
- Review mode with 0 questions to review: button hidden (already handled)
