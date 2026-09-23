# gallery-template

Template repository for MWNF **gallery** websites. Every new gallery repo
(`museumwithnofrontiers/<dataset>`, public) is created **once** from this
template — it is never installed as a dependency and never updated in
existing websites.

Unlike [`website-template`](https://github.com/museumwithnofrontiers/website-template)
(a bare, generic scaffold for any of the three website classes), this
template ships as a real, working gallery — carpets' own code, as it stood
on 2026-09-23 — with the dataset-specific parts turned into placeholders and
`TODO(dataset):` markers. A new gallery starts from something that already
works end to end, and needs its own data swapped in rather than built up
from nothing.

A gallery is a light, static Vue 3 front-end for one published dataset. It
combines three `@museumwnf` packages from npmjs:

| Package | Role |
| --- | --- |
| `@museumwnf/<dataset>-data` | the dataset (JSON + `manifest.json`) |
| `@museumwnf/viewer-core` | application engine (routing, data access, texts, language, shared views) |
| `@museumwnf/viewer-layout` | page structure (`PageShell` + sections, the DXA gallery pages), themed via `theme/tokens.css` |
| `@museumwnf/viewer-i18n` | the shared texts every gallery renders |

---

## Admin — creating a new gallery

This template is **self-service**: you do not need an operator with org
admin rights, unlike `website-template`'s tool-driven flow. You do need a
GitHub account and, from step 3 onward, `gh` installed and logged in
(`gh auth login`).

### 0. Before you start: the dataset package

This template does not create a dataset package — that belongs to
`inventory-app`'s own recipe, steps 1–3 of
[`docs/deployment/new-website.md`](https://github.com/museumwithnofrontiers/inventory-app/blob/main/docs/deployment/new-website.md):
look up the collection, write the instance file, and publish
`@museumwnf/<dataset>-data@latest` to npmjs with the `dxa-gallery` exporter.
Have that done and the package's version on hand before step 3 below —
this template refuses to install without it (see `scripts/check-placeholders.js`).

### 1. Use this template

On this repository's GitHub page: **Use this template → Create a new
repository**. Owner: `museumwithnofrontiers`. Name: the dataset key
(kebab-case, e.g. `islamicart`) — this becomes the repo name and the data
package's own `@museumwnf/<name>-data`. Public.

Clone your new repository.

### 2. Run the setup script

From the clone, once:

```bash
./scripts/setup-repo.sh
```

(or `.\scripts\setup-repo.ps1` on Windows). Requires `gh auth login` once,
if you have not already. This enables GitHub Pages, the `main-requires-pr`
ruleset, classic branch protection with the four required CI checks,
auto-merge, delete-branch-on-merge, Dependabot security updates, and extends
the organization's CodeQL default setup to scan this repo's JavaScript. It
is safe to re-run — it only ever tells you what it did or already found in
place — and it writes a `GALLERY_TEMPLATE_SETUP_COMPLETE` repository
variable as its last step, once everything above is confirmed.
`.github/workflows/bootstrap.yml` runs automatically on your first push and
fails loudly, with the exact command to run, if this step was skipped.

### 3. Replace the placeholders

Three tokens appear across `package.json`, `vite.config.js`, `index.html`,
`src/dataset.config.js`, `locales/en.json` and `tests/smoke.test.js`:

- `__DATASET__` — the dataset key from step 1 (e.g. `islamicart`).
- `__SITE_NAME__` — the gallery's human-readable display name (e.g.
  `"Discover Islamic Art"`), as English is the base language of every
  catalogue in the platform.
- `__SITE_NAMESPACE__` — this website's own texts namespace: one lowercase
  word, no hyphens (`carpets`, `waterInIslam`).

Then install the dataset package itself, which writes the real version
range and the lockfile in one step:

```bash
npm install @museumwnf/<dataset>-data@latest
```

`scripts/check-placeholders.js` (a `preinstall` hook) refuses to let `npm
install` proceed while any of the three tokens survive, and separately
catches the placeholder dependency version (`0.0.0-REPLACE-ME`) if step 0
was skipped.

### 4. The curatorial picks

`tests/smoke.test.js` carries a block near the top headed
`// ── TODO(dataset): curatorial picks ─────`. These five values name
specific records in carpets' own dataset and cannot be derived
generically — replace each by inspecting your own published package (fetch
`https://unpkg.com/@museumwnf/<dataset>-data@latest/items.json`,
`partners.json`, `dynasties.json`, `timeline_events.json`, and their
`translations/*.en.json`, or `npm pack --dry-run` it locally). The comment
beside each constant, and the test that uses it, names the exact selection
rule. A pick that plainly does not exist in your dataset (no item borrowed
from Explore Islamic Art Collections, no dynasty with a translated history
block) means deleting the one or two tests that need it, as each affected
test says.

`src/dataset.config.js`'s `projectColors`/`noticeProjects` need the same
kind of pass — see the `TODO(dataset):` comment above each.

**Proof:** `npm run test` and `npm run build` both pass.

### 5. Declare the catalogue and the sheet

The results and record pages read `catalogue`/`sheet` from
`src/composables/gallery.js`: `catalogue` says what the results page
filters on (which facets, what the URL carries for them, the date rule, the
page size) and how a row looks; `sheet` says which fields a record shows, in
what order, under which `sheet.field.*` labels. Adjust both to your
dataset — a facet is one line in `facets` and one in `controls`, a field is
one line — and the cards and the record on display come from `home` in
`src/dataset.config.js`. Replace `__SITE_NAMESPACE__.credits.body` in
`locales/en.json` with your own credits text once the texts PR (below)
extracts it — until then it carries a placeholder marker, which is expected.

### 6. Texts

This gallery's editorial copy — the About page body, the credits page —
comes from `scripts/site-i18n` (in the `inventory-app` checkout), not
written here. See `docs/deployment/new-website.md` step 5. The extraction
writes `locales/<lang>.json`; copy it in, keeping `__SITE_NAMESPACE__` (now
your real namespace) as the key prefix.

### 7. Theme

See "Webdesigner — theming the website" below for the palette
(`theme/tokens.css`) and, for a gallery specifically, `src/styles/site.css`
— both currently carry carpets' own olive/khaki example, marked
`TODO(webdesigner)`.

### 8. Merge, record and discover

Merge your changes to `main` — the deploy workflow publishes to
`https://museumwithnofrontiers.github.io/<dataset>/`. Then, back in
`inventory-app`: record this site as a `.new-architecture/<dataset>`
submodule (recipe step 7) and run the discovery check (step 8) — see
`docs/deployment/new-website.md`.

---

## Translator — editing the website's texts

You only need a GitHub account and a browser. The files under `locales/`
hold **this website's own texts**, one file per language — `en.json` is
English, `fr.json` French, and so on.

Texts shared with the other galleries — the labels of an item sheet, the
navigation, the buttons — are not here: they live in
[`viewer-i18n`](https://github.com/museumwithnofrontiers/viewer-i18n) and
are edited there, the same way. This website can override any of them by
writing the same entry name in its own file. The museum content itself
arrives already translated and is not edited anywhere.

1. **Open the folder.** Bookmark this link on the website's GitHub page:
   `locales/`. Click the language file you want to change.
2. **Click the pencil** (✏️, top right of the file view). The file opens
   in an editable text box. Change only the text between the second pair of
   quotation marks on a line — the part before the colon is the name of the
   entry and must stay exactly as it is.
3. **To start a new language**, open `en.json`, copy all of its content,
   then create the new file (Add file → Create new file) named with the
   two-letter language code, e.g. `ar.json`, paste, and translate the texts.
   A language does not have to be complete: anything you have not
   translated shows in English.
4. **Click "Commit changes…" then "Propose changes".** GitHub asks nothing
   else — it saves your edit as a proposal.
5. **Wait for the automatic check.** After a minute or two, the proposal
   page shows a green tick and your change goes live on the website by
   itself a few minutes later. If something is off, a comment appears
   explaining in plain language what to fix — edit again on the same page
   and the check reruns.

A text is **just text**, formatted with Markdown if you want: `**bold**`,
`*italic*`, `[a link](https://example.org)`. It may not contain HTML tags,
and it may not contain `{` or `}` — nothing is ever inserted into a text,
so a number or a date is placed next to it by the website rather than
inside it.

---

## Webdesigner — theming the website

The website's whole visual identity lives in the `theme/` folder:
`tokens.css` (colors, fonts, spacing — the normal surface), `overrides.css`
(escape hatch) and `assets/` (logo, banner, sponsor images) — plus, for a
gallery, `src/styles/site.css` for the views' own content-layer palette and
page reset. Both `theme/tokens.css` and `src/styles/site.css` currently
carry carpets' own olive/khaki palette, each marked `TODO(webdesigner)` at
the top — replace every value with your gallery's own colours.

Small changes can be made straight in the browser with the pencil button,
like the translator flow above — styling changes are reviewed, they do not
merge automatically. For real design work, use the live preview:

1. **One-time setup:**
   - Install **Docker Desktop** (docker.com) and **GitHub Desktop**
     (desktop.github.com), each with default settings.
   - In GitHub Desktop: File → Clone repository → pick this website's repo.
   - No npm login is needed: every `@museumwnf` package installs
     anonymously from npmjs. Nothing in this repository holds a token.
2. **Start the preview:** open a terminal in the folder (GitHub Desktop:
   Repository → Open in Command Prompt) and run:

   ```bash
   docker compose up
   ```

   The first start downloads everything and takes a few minutes; wait until
   a line shows `Local: http://localhost:5173/`, then open
   **http://localhost:5173** in your browser.
3. **Edit `theme/`, watch it live.** Every save refreshes the browser
   automatically. `tokens.css` lists every knob with a comment; put images
   into `theme/assets/` and reference them from `src/dataset.config.js`
   (banner, sponsor logos). Anything a token cannot express goes into
   `overrides.css`. A change to a layout component itself is a request for
   the `viewer-layout` package — open an issue there and a developer pairs
   on it.
4. **Propose your changes:** in GitHub Desktop, write a short summary
   bottom left → **Commit** → **Push origin** → **Create Pull Request**
   (opens in the browser → green **Create pull request** button). After a
   colleague approves it, the change merges and deploys by itself. Stop the
   preview with `Ctrl+C` in the terminal when done.

---

## Developer notes

The platform has one architecture, and every website follows it. These are
its rules; each one exists because a site that broke it cost something
real. The pass that imposed them is metanull/inventory-app#1683, and this
template — a real, working gallery — already obeys all eleven.

**1. `src/dataset.config.js` is the whole declaration.** Routes, languages,
shell, media host, outbound links. Before the application mounts, the
website reads nothing from its package but `manifest.json`. `src/main.js`
needs no edit after the placeholders are replaced.

### A gallery website

`@museumwnf/viewer-layout/dxa` exports every platform page already
composed, and `standardRoutes('gallery', config)` returns them as route
entries this website spreads into `extraViews`: the About page, the Credits
page, the search how-to page, the partners list, a partner's profile, the
search results page, the timeline results page, the timeline gallery, the
collection results page, the collection search form and a partner's objects
page. Only Credits needs a per-site string, passed as `config.creditsBody`.

Every route name and path the factory registers is pinned inside
viewer-layout to what every live DXA site already uses — never redeclare
one of them here, or a second declaration of the same address will drift
from the first. This website's own routes stay in `src/dataset.config.js`:
home, item, and the timeline entrance — pages that read this dataset's own
shape rather than the shape the factory already covers.

Full page, prop and slot detail: viewer-layout's README,
["DXA family pages"](https://github.com/museumwithnofrontiers/viewer-layout#dxa-family-pages).

**2. Records and translations come from viewer-core, lazily.** `entityRef`,
`byId`, `loadTranslations`, `translations`, `tr` — see
`src/composables/gallery.js`, which is derivation over those and holds no
state of its own. Nothing in `src/` imports `@inventory-data` directly, and
nothing keeps a second cache. In particular, never resolve a language with
an interpolated dynamic import: `` import(`@inventory-data/translations/items.${lang}.json`) ``
cannot be resolved statically, so a bundler pulls in every language of that
entity eagerly. On a large dataset that is a build which never finishes in
CI.

**3. Glossary highlighting is the renderer's.** Pass `[{ id, spelling }]` to
`md`/`mdInline` and viewer-core marks each occurrence while it parses.
Wrapping a `<span>` into the text beforehand puts markup where a record's
text should be, and it is escaped like any other raw HTML.

**4. One site language, negotiated once.** `offeredLanguages()` in the
config decides what the site offers: what the package declares for it, kept
where the items carry content. Never derive it from `manifest.languages`,
which lists every language the project ever touched — most with no
translation file, so the switcher would offer languages whose pages are all
English.

**5. A record's language is not the site's.** An item sheet reads
`useRecordLanguage(record, { entity: 'items' })`: the site language where
the record carries it, English where it does not, the record's first
language otherwise. The visitor may toggle it there, and that toggle never
touches the site language or the address.

**6. Every field is Markdown, escaped in one place.** `md`, `mdInline` and
`mdStrip` in the composable are viewer-core's renderers and the only place a
record becomes HTML. A tag that slipped past the importer appears on the
page as the characters it is; when that happens the fix belongs in the
importer, not in a view.

**7. The shell is `@museumwnf/viewer-layout`'s `SiteShell`, from config.**
`src/SiteShell.vue` only mounts it and fills the `#brand` slot with the
header lockup; the menu, the language switcher and the link lists are built
by `SiteShell` itself from `config.navigation` (see the package's README,
"Site shell"). A shape it cannot express is a request to
[`viewer-layout`](https://github.com/museumwithnofrontiers/viewer-layout),
not a chrome component built here.

**8. One routing convention.** Every route named, sections kebab-case, the
page and all filters in the query, `meta.entities` naming what the view
reads. Addresses the site used to publish go in `legacyRoutes`,
redirect-only. The catch-all is viewer-core's; do not declare a second one.

**9. A website owns its theme, and nothing else.** `theme/tokens.css` for
the chrome, `src/styles/site.css` for the views' own content styles. Layout
belongs to `viewer-layout`, behaviour to `viewer-core`.

**10. CI is thin and pinned.** The workflows below call
`museumwithnofrontiers/viewer-workflows` at an exact version.

**11. A page is composed of platform components, or is the site's own by
choice.** No page here carries a copy of the query state, the pagination, a
facet builder, a date predicate, a field engine, a glossary handler or a
result row: those are viewer-core's, once, and the components are
viewer-layout's.

And on rule 10, the pinned CI:

- CI (`.github/workflows/`) is a set of thin callers of
  [`museumwithnofrontiers/viewer-workflows`](https://github.com/museumwithnofrontiers/viewer-workflows);
  build, test and texts block, ESLint + `npm audit` report, text-only PRs
  validate and auto-merge, a weekly audit opens issues on findings.
- Those callers pin an **exact** `viewer-workflows` version, never a moving
  major tag. New releases arrive as a Dependabot pull request — this site's
  own CI validates a release before it is adopted, and green minor/patch
  bumps auto-merge.
- **`@museumwnf` npm packages are deliberately not managed by Dependabot.**
  They publish publicly to npmjs, which Dependabot can read without a
  token, but `.github/dependabot.yml` still ignores the scope — see the
  comment there. Dependabot still keeps third-party dependencies and GitHub
  Actions current.

## Licence

This package is Content of the MWNF Website under the
[MWNF legal notice](https://www.museumwnf.org/about/legal-notice), which
governs its use (non-commercial, personal, educational and scientific use
is permitted, with attribution and mandatory reporting — see the notice for
the full terms). The notice text also ships in this package as
`LICENSE.md`. Every website scaffolded from this template inherits both the
notice and the `license` field in `package.json`.
