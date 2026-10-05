# Math Studio

Interactive calculus learning and practice for Unit 1 (limits and continuity) and Unit 2 (early derivatives).

- **1,720 original practice questions:** 1,000 in Unit 1 and 720 in Unit 2.
- 43 modules, 142 graph questions, and 99 table questions.
- Lesson filters 2.1–2.7, guided solutions, quizzes, saved questions, and targeted practice across 197 question types.
- Light/dark themes, responsive layouts, and browser-local progress.

The source PDFs define the curriculum scope; they are not included. Chain rule and integration are outside the early Unit 2 scope.

## Run locally

Serve this directory with a static server, such as `python -m http.server 4173`, then open http://127.0.0.1:4173/. No build step or backend is required.

## Hosting

GitHub Pages: deploy the **main** branch from **/ (root)**. All asset paths are relative, so the site works under a repository URL.

## Progress

Progress, answers, bookmarks, and quiz history stay in the current browser. Localhost and the published site use separate browser storage; existing local progress remains on localhost.

## Validation

All 1,720 correct and incorrect answer checks pass. The content generators verified 700 symbolic calculations, and all 860 original question IDs, prompts, and answers were preserved. Targeted-practice mapping, unit isolation, calculator tolerances, and derivative-equivalence checks pass.

## Third-party assets

Math rendering uses KaTeX (MIT license): https://github.com/KaTeX/KaTeX. Interface fonts load from Google Fonts, with a system font fallback.
