# School Kit

`school-kit` is a small, repeatable overlay for School Template derived
schools. It keeps lesson content, source snapshots, progress records, and the
existing profile fields intact while adding a shared teaching-mode contract.

Apply it to a generated or existing school with:

```sh
python3 scripts/apply-school-kit.py schools/example
```

The command is idempotent. It creates `school.settings.json` only when the
school does not have one, adds the `teachingMode` profile field only when it is
missing, and installs these runtime files:

When the settings file already exists, its `teachingMode` value is the
pre-enrollment and no-profile default; the overlay never rewrites it.

- `src/lib/teaching.ts` — harness-neutral teaching modes and guidance.
- `src/components/TeachingMode.astro` — mode selector and profile persistence.
- `src/pages/api/lessons/[slug].ts` — returns current mode guidance when a
  `studentId` query parameter is supplied.
- `src/pages/llms.txt.ts` — shared teacher contract, independent of Pi.
- `src/pages/harness/pi.txt.ts` — the Pi-only HTTP/bash adapter contract.

The script also wires the mode control into `Base.astro` and keeps the lesson
prompt limited to the shared contract plus the current Pi adapter URL.
It removes the template's synthetic `enrollment` completion so enrollment
cannot create a fake lesson-progress record.
The existing progress refresh emits a small browser event so a mode changed by
the teacher API updates the control without adding another polling loop.

The overlay can be reapplied after regenerating a school. It does not touch
`src/content/lessons`, `src/content/exercises`, `public/sources`, or existing
profile values. Existing progress records in `.wrangler/` and `.school-data/`
stay where they are.

The kit also owns the runtime base. `astro.config.mjs` selects the adapter from
`DEPLOY_TARGET`, progress storage, `publicOrigin`, `script/serve`, and the
dependency pins (`@astrojs/node@10.0.2`, `@astrojs/vercel`, `@vercel/blob`).
The same school directory runs as:

- local `start` with `DEPLOY_TARGET=dev`
- `./script/serve` on a self-hosted Node process
- Vercel via `./script/deploy-vercel`, which sets `DEPLOY_TARGET=vercel` and connects a private Blob store (`BLOB_STORE_ID`)
- Cloudflare Workers via `./script/deploy-cloudflare`, which sets `DEPLOY_TARGET=cloudflare` and stores progress in a private R2 bucket. If `school.settings.json` provides an optional `"customDomain": "<hostname>"`, the script sets `"workers_dev": false` and attaches custom domain `routes` in `wrangler.cloudflare.jsonc`. Pass `--config-only` to generate this config file without building or deploying.

Applying the kit merges those dependencies into the school's `package.json`,
writes `.npmrc` (`legacy-peer-deps=true`), and runs `npm install` only when the
dependency list actually changed. It does not rewrite a lockfile that is already
consistent. `node_modules` must be a real directory, not a symlink to the
template.

New schools scaffold `chrome: "island"` on `school.config.ts`. The kit reads
that field after the shared overlay steps. If it is absent or not exactly
`island`, apply stays the current overlay-only behavior: it does not install
island pages, island components, or island dependencies. Island schools take
their page shell from `school-kit/island/`, not from `school-kit/overlay/`.
Apply copies these complete files: `layouts/Base.astro`, `pages/index.astro`,
`pages/lessons/[slug].astro`, `components/TeachingMode.astro`,
`components/AgentPrompt.astro`, `components/SourceCite.astro`, the island React
components, `island.css`, and the role sprites. A second apply compares those
files and writes nothing when they already match. This documents the install
path only; it does not claim a verified teaching loop.

Island enrollment asks for a character instead of a theme color. The four
walk cycles and completion seals (warrior, wizard, priest, ranger) live in
`school-kit/island/roles/`; see `NOTICE.txt` there. Choosing a character only
changes that picture and the seal shown on a finished lesson. The lower start
button enrolls with that character. The choice is stored in this browser as
`learningRole`. The student ID, progress, course, and page colors stay as they are.

Lesson Markdown may mark a short, source-backed phrase with a plain-text
`{{cite …}}` marker (see `generation/protocol.md`). The overlay ships
`src/lib/source-cite.mjs` and wires it as a remark plugin in `astro.config.mjs`
so the self-read page renders that phrase as a dashed underline; hovering or
focusing opens a card with the exact saved sentence. Island chrome mounts
`SourceCite.astro` on the lesson page for that card. Escape closes the card
without immediately reopening it on the returned focus. `finish` / generation
checks call `assertSourceCites` so a quote must exist in the listed
`public/sources` file. Markers are optional; lessons without them stay valid.
Teachers still read the saved file over `/sources/`; the card is not a
substitute for `agentInstructions`.

Lesson Markdown may also include fenced ```predict blocks for "predict then
reveal" cards (see `generation/protocol.md`). The overlay ships
`src/lib/predict-block.mjs` (and `.d.mts`) and configures `predict` syntax in
`astro.config.mjs`. Island chrome mounts `IslandPredict` cards in place of valid
`pre[data-language="predict"]` blocks on the self-read page, allowing learners to
predict (via multiple-choice buttons or "I'm ready") before revealing the answer
and explanation with keyboard navigation and `aria-live` announcements. If parsing
fails, the raw code block is preserved without breaking the page. Generation
checks call `assertPredictBlocks` to validate required fields and choice
consistency. The block remains fully readable as plain text for AI teachers
without querying any backend or recording progress.

Lesson Markdown may also include fenced ```python run, ```javascript run (or ```js run),
and ```typescript run (or ```ts run) blocks for in-browser execution (see
`generation/protocol.md`). The overlay ships `src/lib/run-block.mjs` (and `.d.mts`),
configures a Shiki transformer in `astro.config.mjs` to tag `data-run="true"`, and
provides an Astro integration that copies Pyodide core assets from `node_modules/pyodide`
to `public/vendor/pyodide/` only when lessons in that School contain `python run` blocks
(JavaScript and TypeScript execute in a dedicated worker using client-side `sucrase`
TypeScript stripping without extra vendor files). Island chrome mounts `IslandRunBlock` in
place of `pre[data-run="true"]` for supported languages, providing an editable
textarea (with 4-space Tab indentation and line auto-resizing), execution/reset
controls, optional stdin input for Python, and separate stdout/stderr displays. Runtimes
execute inside shared Web Workers created dynamically only upon the first click of "运行",
enforcing a 10-second timeout. Generation checks call `assertRunBlocks` to ensure `run`
is only used on supported languages without `>>>` prompts in Python and without `import`,
`export`, or `require` statements in JavaScript/TypeScript.

Lesson Markdown may also include fenced ```numberline blocks for interactive number
line widgets (see `generation/protocol.md`). The overlay configures `numberline`
syntax in `astro.config.mjs` and ships parsing and validation in
`src/lib/predict-block.mjs`. Island chrome mounts `IslandNumberline` in place of valid
`pre[data-language="numberline"]` elements on the self-read page, rendering an SVG
number axis with mouse/touch pointer dragging, keyboard slider navigation (Arrow keys
step, Home/End jump to bounds), `aria-live` real-time value readouts (displaying points,
opposites, absolute values, and distances), and responsive width scaling. If parsing fails,
the raw code block is preserved without breaking the page. Generation checks validate
integer range spans, tick mark alignments, point counts (1 to 3), and option constraints.

## Website language

Fixed UI copy uses `school.settings.json.language`: `zh` (default) or `en`
(including `en-US` / `en-GB`). Natural-language values such as `English`,
`英文`, or `英语` also select English; other values fall back to Chinese.
Course content remains independently editable and is not translated by this layer.

`src/lib/ui-messages.json` is the shared text catalog. `src/lib/ui.ts` selects
server-rendered copy; `ClientUI.astro` exposes the same selected messages to
inline browser scripts, including status/error messages and completion dates.
`scripts/localize-school.py` wires inherited Template pages during overlay
application. Scaffolding applies this automatically to every new School.
Reapply the overlay to existing Schools, then restart development or rebuild
after changing their language setting. Keep internal mode values, routes,
API fields, and progress semantics unchanged when editing UI copy.

## Public and experimental courses

A school opts into the public catalog by setting `publication` on
`school.config.ts`. Schools without this field stay experimental. The kit
does not scan `schools/` to decide visibility.

A public course must set `visibility: "public"`, an `https` origin with no
username, password, path, query, or hash, one of these six `group` values,
non-empty `prerequisites` and `outcomes`, non-empty `publicName` and
`description`, and at least one lesson. Missing any of these fails the
build.

- 编程语言、后端与开发环境
- Web 前端开发
- 开发工具、云平台与部署
- AI Agent 与本地 AI
- 数据科学、测试及其他应用
- 游戏开发

Public courses emit `/catalog.json` with `name` (the public name),
`origin`, `group`, `intro` (the description), `prerequisites`, `outcomes`,
lesson titles and absolute `/lessons/{slug}` URLs in `order`, and a
fingerprint of those fields only. They also emit `/sitemap.xml` for course
HTML pages and a `robots.txt` that includes `Sitemap: {origin}/sitemap.xml`.
Each HTML page uses `{origin}{pathname}` for canonical and `og:url`.

Experimental courses add `<meta name="robots" content="noindex">`.
`/catalog.json` and `/sitemap.xml` return 404. `robots.txt` does not
advertise a sitemap. Canonical URLs may stay relative.

This documents the template. It does not claim a public deployment.

## Teachers and generators

The HTTP teaching contract (`/llms.txt`), lesson/source access, profiles, and
progress API are shared by compatible teacher Harnesses. Only Pi reads
`/harness/pi.txt`; other Harnesses use their own HTTP/terminal tools. The
website prompt is shared and the optional Pi adapter link is conditional.

Pi remains the default automated CLI generator and interactive `teach`
launcher. `create --prepare-only` prepares sources plus `GENERATION.md` for
the current Coding Agent; `finish NAME` uses the same curriculum checks and
build without calling Pi. `teach --prompt-only` returns a shared continuation
prompt rather than launching a teacher. No alternate adapter or session
format is required. See `HARNESS-VALIDATION.md` for actual verified limits.
