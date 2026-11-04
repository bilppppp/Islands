# School Kit

`school-kit` is a repeatable, idempotent overlay for School Template derived schools. It keeps lesson content, source snapshots, progress records, and existing profile fields intact while installing the shared teaching-mode contract, multi-target runtime base, and optional island chrome.

Apply it to a generated or existing school from the repository root:

```sh
python3 scripts/apply-school-kit.py schools/example
```

## Shared overlay (`school-kit/overlay/`)

Applying the kit creates `school.settings.json` only when missing (never rewriting an existing `teachingMode` pre-enrollment/no-profile default or `customDomain`), adds the `teachingMode` profile field when absent, removes the template's synthetic `enrollment` completion record, and installs:

- `src/lib/teaching.ts` — harness-neutral teaching modes (`simple` / `immersive`) and guidance.
- `src/components/TeachingMode.astro` — mode selector and profile persistence (wired into `Base.astro`; progress refresh emits a browser event so mode changes via the teacher API update the control without adding another polling loop).
- `src/pages/api/lessons/[slug].ts` — returns current mode guidance when a `studentId` query parameter is supplied, and reduces `{{cite …}}` markers to plain text for teacher consumption.
- `src/pages/llms.txt.ts` — shared teacher contract, independent of Pi.
- `src/pages/harness/pi.txt.ts` — Pi-only HTTP/bash adapter contract (the lesson prompt stays limited to the shared contract plus the conditional Pi adapter URL).
- `astro.config.mjs`, `src/lib/deploy-target.ts`, `src/lib/store*.ts`, `src/lib/public-origin.ts` — adapter selection from `DEPLOY_TARGET` (`dev`, `node`, `vercel`, `cloudflare`), progress storage (`.wrangler/`, `.school-data/`, private Vercel Blob via `BLOB_STORE_ID`, private Cloudflare R2), and `publicOrigin`.
- `script/serve`, `script/deploy-vercel`, `script/deploy-cloudflare`, `DEPLOYMENT.md`, `.env.example` — runtime and deployment scripts. See [overlay/DEPLOYMENT.md](overlay/DEPLOYMENT.md) for target commands, `school.settings.json.customDomain` (`"workers_dev": false` + `routes` in `wrangler.cloudflare.jsonc`), `--config-only`, and environment variables.

The kit merges the dependency pins (`@astrojs/node@10.0.2`, `@astrojs/vercel`, `@vercel/blob`) into the school's `package.json`, writes `.npmrc` (`legacy-peer-deps=true`), and runs `npm install` only when the dependency list actually changed (or `node_modules` is missing/symlinked). It does not rewrite a lockfile that is already consistent. `node_modules` must be a real directory, not a symlink to the template. It does not touch `src/content/lessons`, `src/content/exercises`, `public/sources`, `.wrangler/`, or `.school-data/`.

## Island chrome (`school-kit/island/`)

New schools scaffold `chrome: "island"` on `school.config.ts`. The kit reads that field after the shared overlay steps: if absent or not `"island"`, apply keeps overlay-only behavior without installing island pages, components, or dependencies. Island schools take their page shell from `school-kit/island/`: `layouts/Base.astro`, `pages/index.astro`, `pages/lessons/[slug].astro`, `components/TeachingMode.astro`, `components/AgentPrompt.astro`, `components/SourceCite.astro`, the island React components, `island.css`, and role sprites. A second apply compares those files and writes nothing when they already match. This documents the install path only; it does not claim a verified teaching loop.

Island enrollment asks for a character (`warrior`, `wizard`, `priest`, `ranger`; sprites and completion seals live in `school-kit/island/roles/`, see [island/roles/NOTICE.txt](island/roles/NOTICE.txt)) instead of a theme color. The choice is stored in the browser as `learningRole` and only changes the identity card sprite and completion seal; student ID, progress, course, and page colors stay as they are.

## Lesson Markdown extensions and validation

Authoring rules for citations and interactive fences live in [generation/protocol.md](../generation/protocol.md). The kit ships the remark/Shiki pipeline, vendor asset bundlers, island components, and validation helpers used by `finish` and `scripts/verify-lesson-blocks.mjs`:

- **`{{cite …}}` inline source citation** (`src/lib/source-cite.mjs` remark plugin + `SourceCite.astro`): renders the marked phrase as a dashed underline on the self-read page; hovering or focusing opens a card with the exact saved sentence (`url` may be omitted for sources without a web page; `Escape` closes the card without reopening on returned focus). `assertSourceCites` checks that each cited quote exists in the listed `public/sources` file. Teachers still read `/sources/`.
- **```` ```predict ```` and ```` ```numberline ```` blocks** (`src/lib/predict-block.mjs` + `IslandPredict` / `IslandNumberline`): mount on `pre[data-language="predict"]` (multiple-choice or "I'm ready" reveal with keyboard navigation and `aria-live`) and `pre[data-language="numberline"]` (SVG number axis with pointer dragging, Arrow/Home/End slider navigation, and `aria-live` readouts for points, opposites, absolute values, and distances). If parsing fails, the raw code block is preserved. `assertPredictBlocks` / `assertNumberlineBlocks` validate fields, integer ranges, tick alignments, and 1–3 points.
- **```` ```<python|js|ts> run ```` blocks** (`src/lib/run-block.mjs` + `IslandRunBlock` on `pre[data-run="true"]`): provides a lazy-loaded CodeMirror 6 editor (syntax highlighting, line numbers, indent guides, 4-space Tab, active line highlight, bracket matching, and a `textarea` fallback if loading fails) and executes inside shared Web Workers created on first click of "运行" with a 10-second timeout. An Astro integration copies Pyodide core assets from `node_modules/pyodide` to `public/vendor/pyodide/` only when lessons contain `python run`; JS/TS run in a worker with client-side `sucrase` type stripping. `assertRunBlocks` and `verify-lesson-blocks.mjs` reject disallowed imports/prompts and execute every block.
- **```` ```<html|jsx|tsx> preview [demo] ```` blocks** (`src/lib/run-block.mjs`, `src/lib/three-bundle.mjs` + `IslandRunBlock` on `pre[data-preview="true"]`): renders a CodeMirror 6 editor alongside an `<iframe sandbox="allow-scripts">` (without `allow-same-origin`, populated via `srcdoc`, ~500ms debounce, forwarding `console`, unhandled errors, height, and truncated `innerText` via `postMessage`). Each new preview document mounts a fresh iframe because Chrome can drop a large `srcdoc` update on an iframe whose first load is still pending. JSX/TSX transform in-browser via `sucrase` and render with Preact (default, UMD loaded via Vite `?raw`) or React 19 (for React courses, bundled on demand via `esbuild` to `/vendor/react-preview/runtime.js`). Adding `demo` opens the block expanded with code hidden behind a toggle and auto-sizes inline demo height from `preview-metrics` between 200–720px (defaulting to 380px until first metrics; taller content scrolls inside). When a lesson imports `three` or `three/addons/controls/OrbitControls.js`, `src/lib/three-bundle.mjs` bundles the school's pinned `three` with `esbuild` into `public/vendor/three-preview/` and passes those modules to the sandboxed iframe as `data:` URLs in an import map (no network fetch, `allow-same-origin` stays off). Generation checks execute run blocks and, when local Chrome/Chromium is available, load `html preview` documents in headless Chrome to reject runtime errors (skipping with a notice if Chrome is absent).
- **Heading and code normalization** (`src/lib/render-guard.mjs`): `remarkNormalizeLessonH1` drops a leading H1 that repeats the frontmatter title; TOC and section tabs follow the shallowest heading level in the body; inline code renders without backticks, code blocks get a non-overlapping language/copy toolbar, and the monospace stack includes box-drawing glyphs.

All interactive blocks remain readable as plain text in the lesson Markdown for AI teachers without querying any backend or recording progress.

## Website language

Fixed UI copy uses `school.settings.json.language`: `zh` (default) or `en` (including `en-US` / `en-GB`; natural-language values such as `English`, `英文`, or `英语` also select English; other values fall back to Chinese). Course content is not translated by this layer.

`src/lib/ui-messages.json` is the shared text catalog. `src/lib/ui.ts` selects server-rendered copy; `ClientUI.astro` exposes the same selected messages to inline browser scripts, including status/error messages and completion dates. `scripts/localize-school.py` wires inherited template pages during overlay application. Reapply the overlay to existing schools and restart or rebuild after changing `language`. Keep internal mode values, routes, API fields, and progress semantics unchanged when editing UI copy.

## Public and experimental courses

A school opts into the public catalog by setting `publication` on `school.config.ts`. Schools without this field stay experimental (`<meta name="robots" content="noindex">`, `/catalog.json` and `/sitemap.xml` return 404, `robots.txt` does not advertise a sitemap, canonical URLs may stay relative). The kit does not scan `schools/` to decide visibility.

A public course must set `visibility: "public"`, an `https` origin with no username, password, path, query, or hash, one of these six `group` values, non-empty `prerequisites` and `outcomes`, non-empty `publicName` and `description`, and at least one lesson (missing any fails the build):

- 编程语言、后端与开发环境
- Web 前端开发
- 开发工具、云平台与部署
- AI Agent 与本地 AI
- 数据科学、测试及其他应用
- 游戏开发

Public courses emit `/catalog.json` (with `name`, `origin`, `group`, `intro`, `prerequisites`, `outcomes`, ordered lesson titles and absolute `/lessons/{slug}` URLs, and a fingerprint of those fields only), `/sitemap.xml` for course HTML pages, a `robots.txt` with `Sitemap: {origin}/sitemap.xml`, and `{origin}{pathname}` for canonical and `og:url`. This documents the template; it does not claim a public deployment.

## Teachers and generators

The HTTP teaching contract (`/llms.txt`), lesson/source access, profiles, and progress API are shared by compatible teacher harnesses. Only Pi reads `/harness/pi.txt`; other harnesses use their own HTTP/terminal tools. The website prompt is shared and the optional Pi adapter link is conditional.

Pi remains the default automated CLI generator and interactive `teach` launcher. `create --prepare-only` prepares sources plus `GENERATION.md` for the current Coding Agent; `finish NAME` uses the same curriculum checks and build without calling Pi. `teach --prompt-only` returns a shared continuation prompt rather than launching a teacher. No alternate adapter or session format is required.
