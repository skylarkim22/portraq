# Wanted Design System

A distilled, agent-friendly copy of the **Wanted Design System** — the open-source design library used by Korea's recruiting-tech company **Wanted Lab** for its product family (Wanted, Wanted Space, Wanted Gigs, Wanted Agent, Wanted LaaS, Wanted OneID). Published as CC BY 4.0 by the Wanted Design team.

> Sourced from the "Wanted Design System.fig" file the user attached. The original Figma library covers Overview · Updates · Foundation · Color (Atomic & Semantic) · Typography · Grid · Theme · Icon · Logo · Element · Spacing · Decorate · Component · Guidelines · Makers Principle.

This is a **reference distillation** for design and prototyping. It is not the production Wanted codebase; it captures tokens, type styles, components, motifs and assets so an agent can mock or build interfaces that visually align with Wanted.

## Source attribution
- **Original library**: Wanted Design System, by Wanted Lab. Distributed under CC BY 4.0.
- **Designers credited in the library**: Hyungjin Kil, Chaeri Oh, Doeun Kim, Sanghyo Yee, Kyungmin Park, Sungho Cho, Jisoo Lee. Support: Shinhae Lee, Minjeong Kang, Seulgee Kim, Minju Park, Minsun Park, Miri Son, Hyunji Jeon.
- **Last source update referenced**: 2025-11-06.
- **Note on company name**: the import note listed the company as "Stamply" but the attached file is Wanted's official design library; we've treated this as the Wanted system. Please confirm if a different brand was intended.

## Products represented
The library ships logos and motifs for the full Wanted product family:
- **Wanted** — the flagship career platform (job listings, resumes, applications).
- **Wanted Space** — workspace / office network.
- **Wanted Gigs** — freelance / gig marketplace.
- **Wanted Agent** — AI agent for recruiting (newer product).
- **Wanted LaaS** — Login-as-a-Service / OneID auth.
- **Wanted Sub-services** — beta tools and partnership programs.

All share Pretendard JP typography, a single primary blue (`#0066FF`), and the same atomic palette. The product wordmarks change but the system tokens do not.

---

## CONTENT FUNDAMENTALS

Wanted's writing is **bilingual (Korean + English)**, **concise**, **utilitarian**, and **inclusive**. It treats the reader as a capable adult and prefers plain instruction over marketing fluff.

### Voice
- **Polite but matter-of-fact.** Korean copy uses the `-습니다 / -니다` formal register without being stiff: "텍스트를 편집할 수 있도록 아래 폰트를 설치하세요" ("Install the fonts below so you can edit the text"). English mirrors this — clear imperatives or simple declaratives, never breezy startup tone.
- **No exclamation marks, no emoji, no marketing slogans.** The library's own guidelines call this out: "메시지에 마침표를 찍어요" — "End messages with periods." Sentences are complete and punctuated.
- **You over we.** When addressing the user: "If you have any issues, feel free to share your feedback in the comments." When describing the team: "우리는… 믿습니다" ("We believe…") — `we` is reserved for the maker's voice, not product copy.
- **Quiet pride.** From the library's closing line: *"We believe that open source is essential in making our work environment richer and more productive."* It's earnest, not boastful.

### Tone rules from the library itself (Makers Principle)
1. **Sweat the small stuff.** "사소한 업데이트라도 빠르고 간결하게 기록합니다." → Even tiny updates get logged, quickly and concisely.
2. **Make it easy to skim.** "업데이트 내용은 빠르게, 읽기 쉽게 적습니다." → Write update notes to be fast to read.
3. **Use a consistent voice for releases**, so engineers and designers can recognise the source at a glance.

### Casing & punctuation
- **Korean**: no terminal periods inside dense UI labels; full sentences in body & toast get periods. Component names use Title Case in English ("Top Navigation", "Section Header") regardless of where they're surfaced.
- **English**: Title Case for product names, screen names, and component names; Sentence case for buttons ("Sign up", "Apply now"). Numbers use thin space for thousands in Korean copy when possible.
- **Symbols as separators**: a center-dot "∙" is used between meta facts in job-card subtitles ("서울 강남구 ∙ 신입 – 10년"). Avoid the longer middle-dot "·" — the library uses the bullet operator.
- **Em-dash range** for year/experience ranges ("신입 – 10년").

### Vocabulary samples (real strings from the source)
- Navigation tabs: 이력서 관리 (Manage Resume) · 커리어 조회 (Browse Careers) · 지원 현황 (Application Status) · 면접 코칭받기 (Get Interview Coaching) · 다음 커리어 찾기 (Find Your Next Career) · 나만의 회사 찾기 (Find Your Company) · 직군별 연봉 (Salary by Role) · 원티드 포인트 (Wanted Points).
- Section headings: 주요업무 (Key responsibilities), 자격요건 (Requirements), 마치며 (In conclusion), 사용하기 전에 (Before you use).
- Toast / inline message exemplar (used to teach period rule): "메시지에 마침표를 찍어요." ("End messages with a period.")

### Don't
- **No emoji** anywhere in product UI. The library has no emoji glyphs in any of its example screens.
- **No "let's" / "yay" / "awesome".** No exclamation marks in body copy.
- **No ALL CAPS** except inside very specific decorative slots.
- **No gradients in copy treatment** (no glowing text). Type is set in solid color.

---

## VISUAL FOUNDATIONS

### Colors
- **Primary blue: `#0066FF` (Blue-50).** The single most-distinctive brand color. Used for primary CTAs, links, focus rings, and accent surfaces.
- **Neutral grays are blue-tinted** (`#70737C` is the most common). The system has a fully separate "Common" pure-gray ramp, but the **Neutral** ramp is used in product UI.
- **Text** sits at `#171719` (Neutral-10) for primary, `#37383C` for body / labels, `rgba(55,56,60,0.61)` for assistive captions. The library frequently uses RGB-with-alpha instead of a lighter solid — preserves the warmth/cool of whatever sits behind it.
- **Status colors are direct**: red `#FF4242` (negative), green `#00BF40` (positive), orange `#FF9200` (cautionary), cyan `#0098B2` (informative). No pastel softening for state badges — they read at full saturation.
- **Violet `#6541F2`** is the secondary brand color, used sparingly for emphasis stripes on outline buttons and for the Wanted Agent product mark.
- **Surfaces are mostly white.** The system supports a dark theme (Color — Semantic / Dark) but the canonical product UI is light-on-white with `#F7F7F8` as the page-subtle background.

### Typography
- **Pretendard JP** is the system font (Medium 500 for body, SemiBold 600 for labels & buttons, Bold 700 for titles/displays). Pretendard is a Korean+English+Japanese open-source family tuned for screen.
- **Wanted Sans** is the *display/brand* font, used only for the logotype and a handful of marketing displays. Weights present in the file: Regular, Medium, SemiBold, Bold, Black.
- **SF Mono** for code/values; **SF Pro Text** for iOS native mocks.
- The scale is dense: **18 styles across 7 levels** (Display1–3 / Title1–3 / Heading1–2 / Headline1–2 / Body1n & 1r / Body2n & 2r / Label1n & 1r / Label2 / Caption1 / Caption2). "n" = normal line-height, "r" = reading line-height for longer prose.
- Letter spacing is *negative* at display sizes (down to -0.0319em at Display1) and *positive* at small sizes (up to +0.0311em at Caption2) — Korean-glyph metrics need that breathing room when small.

### Spacing & layout
- **4-px base grid.** Common steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Card padding standardises at **64px** for hero/marketing cards, **48px** for medium sections, **24px** for utility cards.
- Section gap defaults to **96–128px** in marketing surfaces; **24–32px** in product UI.
- Mobile uses a **335-wide content column** in 375 frames (so 20-px outer margins).

### Backgrounds
- **Predominantly flat white**, with `#F7F7F8` (Neutral-99) for a page-subtle wash.
- **No gradients, no noise, no patterns** in the foundation. A handful of marketing decorations use diamond-radial gradients but they are explicitly called out as "Decorate" — not the default.
- **No hand-drawn illustrations.** Imagery, when present, is real photography (job-listing cover images) or product screenshots — never illustrated mascots.

### Animation
- **Soft, fast, never bouncy in product UI.** 120–320ms durations.
- Easing: `cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out) for entrances and reveal; symmetric ease-in-out for state changes.
- A spring (`cubic-bezier(0.34, 1.42, 0.64, 1)`) is reserved for press feedback and pop-ins (toasts, popovers).
- **No long parallax**, no scroll-jacking, no auto-rotating carousels.

### Hover & press states
- **Hover** typically *darkens* primary fills by one step (Blue-50 → Blue-45), or applies a `rgba(0,0,0,0.06)` overlay on neutral surfaces. Icons gain a `1.0` → `0.88` opacity bump on hover.
- **Pressed** uses one further darker step (Blue-50 → Blue-40) plus an **8-px scale shrink** on small targets (chips, icon buttons). Larger surfaces don't scale — they just darken.
- **Focus** is a 3-px outer ring at `rgba(0,102,255,0.22)` outside any border — never replaces the border.
- **Disabled** drops opacity to `0.28` (text) / `0.16` (fills) and removes shadow.

### Borders & lines
- **Hairlines are 1-px, `rgba(112,115,124,0.22)`** — the canonical "soft divider". Section dividers between major blocks step up to **2-px or 4-px solid black** for emphasis (used on overview pages between table-of-contents sections).
- **Strokes are inside-only** (no `box-shadow: inset` blur tricks). Outline buttons keep a 1.5-px solid stroke at the same color as the text.

### Shadows / elevation
- **Subtle, near-neutral.** Five steps: xs/sm/md/lg/xl. The biggest in the system is `0 12px 40px rgba(23,23,23,0.12)` — never tinted with the primary blue.
- Cards default to `--w-shadow-sm` resting and `--w-shadow-md` on hover.
- A floating dialog uses `--w-shadow-xl`. Toasts use `--w-shadow-lg` + a 64-px backdrop blur on a dark translucent fill (`rgb(27,28,30) @ 52%` + blue tint `@ 5%`).

### Transparency & blur
- Toasts and translucent overlays use **backdrop-filter blur(64px)** on a dark fill at ~52% alpha. This is the system's *only* use of heavy blur — never on cards or panels.
- Alpha values in the system follow a curated ladder (0.05 / 0.08 / 0.12 / 0.16 / 0.22 / 0.28 / 0.35 / 0.43 / 0.52 / 0.61 / 0.74 / 0.88 / 0.97) so designers don't invent in-between opacities.

### Corner radii
- **Container-relative.** Pills use 1000px. Avatars are full circle. The radius scale:
  - 4 / 6 / 8 / 10 / 12 — sized to the button / control's *height*.
  - 16 / 24 / 32 — for cards, sections, and panels.
  - 1000 — for chips, badges, and circular avatars.
- A *single* card never mixes radius sizes. Inner elements inset their radius by `parent - padding`.

### Card pattern
- **White surface, 1-px hairline border (`rgba(112,115,124,0.22)`), 16–32-px radius, no shadow by default.** Adds `--w-shadow-md` only on hover or float.
- Hero / marketing cards: white surface, **32-px radius**, **64-px internal padding**, no border, no shadow.
- The "section" component on overview pages uses **64-px radius** for full-bleed feature blocks.

### Layout rules
- **Desktop content column 1280-px wide**, centered, with 128-px outer padding inside a 1536-frame.
- **Mobile target 375-px wide**, 16-px gutter, 335-px content column.
- Top navigation: 56–64-px height, white surface with a 1-px bottom hairline; sticky on scroll.
- The library defines explicit responsive breakpoints under `external-shared/BreakpointDesktopXl` etc., though we don't surface their pixel values here.

### Imagery
- **Real photography**, generally warm but not stylised. Job-cover images run full-bleed-square inside cards (aspect 1:1).
- Product / lifestyle photos: natural color, no aggressive filtering, no monochrome treatments.
- Profile avatars: photo or 2-character monogram, on a Neutral-90 fill, full-circle.

---

## ICONOGRAPHY

The library carries a **proprietary 24×24 line icon set** (~150+ glyphs). Icons are documented under `/Icon` in the Figma file with explicit principles:

> "단순하며 상징적인 기호를 통해 특정 개념을 빠르게 전달합니다."
> "Convey a specific concept quickly with simple, symbolic marks."

### Variants
- **Normal** (default, 24×24, 1.5-px stroke) — the vast majority of use cases.
- **Thick** (heavier stroke, ~2-px) — for emphasis or small sizes where the regular stroke would feel weak.
- **Small** (16×16) and **Thick Small** — same glyphs at 16-px.
- **Tight** chevrons — narrower variants for nav use.
- **Fill** (`Fill=True`) — boolean toggle on shapes that exist in both line and solid form (Circle, Square, Bookmark, Heart, etc.).
- **Color** — a small subset (logo-Apple/Google/Facebook/Microsoft/Kakao/Naver/X/Brunch) keep brand colors; documented separately as "Color icons".
- **Navigation** — a specialised group used only in the bottom tab bar (Recruit / Career / Social / My Page / Menu). Visually heavier than the normal set.

### Icon system characteristics
- **No emoji used anywhere** in the source library. Unicode-as-icon is rare (the centre-dot `∙` for separators is the only example).
- **No icon font.** Icons are individual SVG symbols stored in the design library and exported per-component.
- **Color is always `currentColor`** — icons inherit text color from their slot. The "Color" subset is the only exception.
- Icons sit on a 24×24 transparent bounding box; the *glyph* itself is typically 20×20 with 2-px padding all round.

### Substitution
The icons are not shipped as a public font / SDK we can pull. For prototypes:

- **CDN substitute we use here**: **[Lucide](https://lucide.dev)** (via `<script src="https://unpkg.com/lucide@latest"></script>`). Same 24×24, 1.5-px stroke, line+thick variants. Closest visual match to the Wanted style.
- Use Lucide names that map to common Wanted names: `chevron-down`, `chevron-right`, `check`, `x` (close), `search`, `bell-plus`, `bookmark`, `heart`, `share`, `more-horizontal`, `settings`, `trash-2`, `pencil` (write), `copy`, `download`, `upload`, `clock` (history), `image`, `mail`, `mail-open`, `link`, `external-link`, `quote`, `refresh-cw`, `tag`, `sparkles`, `moon`, `sun`, `info`, `triangle-alert`.
- Brand-color icons (Apple / Google / Facebook / Kakao / Naver / etc.) — use **[Simple Icons](https://simpleicons.org/)** via CDN.

**This is a substitution, not the real Wanted set.** Flagged for the user — if they have access to the source SVGs, we should swap them in.

### Decorative SVGs we *did* copy from the source
- `assets/logos/wanted-logotype.svg` — full Wanted wordmark (B&W).
- `assets/logos/wanted-symbol-vector.svg` — Wanted "W" symbol (single-color SVG path).
- `assets/logos/wanted-symbol-mask.svg` + `assets/logos/wanted-symbol-fill.png` — original treatment with a colored fill behind the mask.
- `assets/logos/laas-logotype.svg` — Wanted LaaS wordmark.
- `assets/logos/agent-logotype.svg` — Wanted Agent wordmark.
- `assets/logos/agent-symbol-mask.svg` — Wanted Agent symbol mask.
- `assets/logos/gigs-logotype.svg` — Wanted Gigs wordmark.
- `assets/logos/space-logotype.svg` — Wanted Space wordmark.

---

## File index

Root files:
- **README.md** — this file
- **SKILL.md** — agent-skill manifest (cross-compatible with Claude Code Skills)
- **colors_and_type.css** — every token (colors, type, spacing, radii, shadows, motion) plus drop-in utility classes
- **fonts/** — uploaded font files (Nanum Gothic, Noto Sans, Monomaniac One). NB these are **not** the Wanted system fonts — Pretendard is loaded from CDN. Flagged for the user.
- **assets/** — copied SVGs and PNGs from the Figma source (logos, brand marks)
- **preview/** — small HTML cards for the Design System tab (one card per token cluster or component)
- **ui_kits/** — full HTML+JSX recreations of product surfaces, one folder per product (Wanted, Wanted Agent)
- **/uploads** — user-uploaded raw files; do not edit

### UI kits available
- **ui_kits/wanted/** — the flagship career platform (job listing card, job feed, top nav, application flow)
- **ui_kits/wanted-agent/** — Wanted Agent chat surface (mock conversation with the recruiting agent)

---

## CAVEATS for the user

1. **Project label vs Figma label.** The import note said "Stamply" but the attached design file is the Wanted Design System. We built the latter. Tell us if you need a different brand.
2. **Fonts.** Pretendard JP & Wanted Sans are the *real* Wanted fonts. We're loading Pretendard from a CDN and falling back to system Korean fonts; we did **not** receive the Pretendard JP or Wanted Sans font files. The uploaded files (Nanum Gothic, Noto Sans, Monomaniac One) are unrelated and have been kept in `fonts/` as supplementary options. If you can share the official `.otf` / `.woff2` files for Pretendard JP and Wanted Sans, please upload them.
3. **Icons.** We substituted Lucide for Wanted's proprietary icon set. They share the visual language (24-px, 1.5-px stroke, line + thick variants) but names and exact shapes differ. If the project has access to Wanted's icon SVGs, drop them in `assets/icons/` and we'll wire them up.
4. **Decorative imagery.** The Figma file references a few JPEGs (~5MB each) which we did not extract — they're job-cover photos, not brand-critical assets. Tell us if you'd like specific photography pulled.
