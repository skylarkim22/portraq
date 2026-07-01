---
name: wanted-design
description: Use this skill to generate well-branded interfaces and assets for Wanted (the Korean recruiting platform), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files. The skill is a distilled copy of the Wanted Design System (CC BY 4.0), covering the Wanted, Wanted Agent, Wanted Space, Wanted Gigs, Wanted LaaS, and Wanted OneID products.

Where to start:
- `README.md` — full overview, content fundamentals (voice, casing, vocab), visual foundations (colors, type, spacing, shadows, motion, hover/press states), iconography rules.
- `colors_and_type.css` — every token as CSS custom properties (`--w-color-*`, `--w-type-*`, `--w-space-*`, `--w-radius-*`, `--w-shadow-*`), plus utility classes (`.w-display1`, `.w-body1`, `.w-fg-accent`, etc.). Load this first.
- `assets/logos/` — Wanted, LaaS, Agent, Gigs, Space wordmarks and the Wanted "W" symbol as SVG (with PNG fill for the original treatment).
- `preview/` — small specimen HTML cards for every cluster of the system (palettes, type, components, brand). Look here first when you need to copy a tested mark-up pattern.
- `ui_kits/wanted/` — pixel-recreated careers platform (job feed, detail, apply modal, toast). Components in `components.jsx` and `screens.jsx`; sample data in `data.js`. Reuse these patterns for any Wanted-flagship mock.
- `ui_kits/wanted-agent/` — AI chat surface (sidebar, header, landing, streaming message, inline job carousel, composer). Reuse for any agentic / conversational Wanted product.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy the assets you need (logos, icons via Lucide CDN, the css file) and create static HTML files for the user to view. The css file links Pretendard from a CDN; no other setup needed.

If working on production code, import the token CSS and lift the values into your codebase — the variables are the source of truth. Wanted's proprietary icons are NOT shipped here; substitute Lucide at 1.5–1.6-px stroke weight and flag the substitution to the user.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (which product surface? mobile or desktop? Korean or English copy? light or dark?), and act as an expert designer who outputs HTML artifacts or production code, depending on the need.

### Quick-reference for the most common tasks
- **Primary CTA**: `background:#0066FF; color:#FFF; padding:14px 22px; border-radius:10px; font:700 16px/1.4 Pretendard;`
- **Body text**: `font:500 16px/24px Pretendard; letter-spacing:0.0057em; color:#171719;` (use `--w-fg-primary`)
- **Card surface**: white, 12–16-px radius, 1-px hairline `rgba(112,115,124,.22)`, no shadow at rest. Add `--w-shadow-md` on hover.
- **Toast**: dark blurred surface — `background:#1B1C1E @ 52%; backdrop-filter:blur(64px); border-radius:12px; padding:14px 18px;` with white text at 88% alpha.
- **Status colors**: red `#FF4242`, green `#00BF40`, orange `#FF9200`, cyan `#0098B2`.

### Voice cheat-sheet
- Polite, matter-of-fact. Korean uses formal `-습니다` register. English uses simple imperatives.
- No emoji. No exclamation marks in product copy. Periods on full-sentence messages.
- Center-dot `∙` (bullet operator) for inline meta separators, em-dash `–` for ranges.
- Title Case for product names; sentence case for buttons.
