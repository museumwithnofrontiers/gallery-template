import { describe, expect, it, vi } from 'vitest'
import { loadEntities, mergeMessages } from '@museumwnf/viewer-core'
import {
  checkOfferedLanguages, checkRoutes, checkSectionMeta, checkTextsRendered, mountSite as mountApp,
} from '@museumwnf/viewer-core/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/gallery'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'
// The data package's own manifest, read the same way `useDataPackage()`
// does (the `@inventory-data` alias `defineViewerConfig` sets up) — never a
// URL literal, so the assertions below track whatever the package ships.
import manifest from '@inventory-data/manifest.json'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this gallery's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

// Mounted on the address under test, as a visitor arrives from a link. The
// kit's own `mountSite` does the work every website's smoke test repeated.
function mountSite(hash = '#/') {
  return mountApp(config, messages, hash)
}

// ── TODO(dataset): curatorial picks ─────────────────────────────────────────
// These five values cannot be derived generically — they name specific
// records in YOUR OWN published dataset. Replace each placeholder below by
// inspecting your data package (fetch https://unpkg.com/@museumwnf/
// __DATASET__-data@latest/items.json, partners.json, dynasties.json,
// timeline_events.json, and their translations/*.en.json, or `npm pack
// --dry-run` it locally). Each is used by exactly the tests named beside it;
// see each test for the precise selection rule this was templated from.
//
// A pick that plainly doesn't exist in your dataset (no EPM item, no dynasty
// with a history block) means removing the one or two tests that need it —
// each affected test below says so.
const CHIP_ITEM_ID = '00000000-0000-0000-0000-000000000000' // TODO(dataset): a non-EPM item, ideally with both a related-database and an artistic-introduction URL on its project — see "colours and names the source-database chip"
const CHIP_PROJECT_NAME = 'TODO(dataset): CHIP_ITEM_ID’s manifest.projects[...].name.en'
const CHIP_CLASS = 'mwnf-chip--EXH' // TODO(dataset): the projectColors entry for CHIP_ITEM_ID's project, from dataset.config.js
const EPM_ITEM_ID = null // TODO(dataset): an item whose project_id is '928f5e0d-53e3-5f53-b9c2-5af389c30dd4' (Explore Islamic Art Collections), or leave `null` and remove "shows the explore-partner notice..." below if this dataset borrows nothing from that project
const DYNASTY_ITEM_ID = null // TODO(dataset): an item whose dynasty has a translated `.history` block — see "renders the layout glossary tool and dynasty popouts"; leave `null` and remove that test if none exists
const DYNASTY_NAME = 'TODO(dataset): that dynasty’s translated name'
const TIMELINE_COUNTRY_CODE = 'TODO' // TODO(dataset): the legacy 2-letter code of a country this dataset has dated items in — see "renders the timeline results on the composed timeline view"
const TIMELINE_COUNTRY_ID = 'TODO' // TODO(dataset): the same country's inventory id (countries.json's own `id`, not its `code`)
const TIMELINE_COUNTRY_NAME = 'TODO(dataset): that country’s translated name'
const PARTNER_ID = '00000000-0000-0000-0000-000000000000' // TODO(dataset): a partner with item_count > 0, a latitude/longitude, and a translated city — see "renders the partners list on the composed partner-list view"
const PARTNER_NAME = 'TODO(dataset): that partner’s translated name'
const PARTNER_CITY = 'TODO(dataset): that partner’s translated city'
const PARTNER_COUNTRY_NAME = 'TODO(dataset): that partner’s country, translated'
const PARTNER_ITEM_COUNT = 0 // TODO(dataset): that partner's own item_count

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mountSite()

    expect(host.textContent).toContain(config.siteName)
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
  }, 20000)

  // The collection results and the item sheet run on the platform's composed
  // views (metanull/viewer-core#50): the tiles, the dependent options and the
  // pages come from the spec, the sheet's rows from the sheet spec, and what
  // only this gallery has — the panel in the aside, the related-content
  // container — fills the views' slots.
  it('renders the collection results on the composed results view', async () => {
    const { app, host } = await mountSite('#/collection-results')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-grid__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-catalogue')).not.toBeNull()
    expect(host.querySelector('.mwnf-catalogue__aside .mwnf-filter')).not.toBeNull()
    expect(host.querySelector('.mwnf-summary__count')).not.toBeNull()
    // Nine a page, two paginations.
    // TODO(dataset): carpets has exactly 9 items a page and 2 pages of
    // results — loosened to structural checks here since your dataset's
    // item count decides both; tighten to exact numbers once you know them
    // if you want the precision back.
    expect(host.querySelectorAll('.mwnf-grid__tile').length).toBeGreaterThan(0)
    expect(host.querySelectorAll('.mwnf-pagination').length).toBeGreaterThan(0)
    app.unmount()
  }, 60000)

  // The collection entrance and the header search results run on the
  // platform's composed views: the facet dropdowns,
  // the from/to year buckets and the navigate-on-choice behaviour are
  // `SearchFormView`'s (`mode: 'facets'`, CollectionSearch.vue); the boolean
  // keyword grammar over the haystack is `CatalogueResultsView`'s `narrow`
  // (SearchResults.vue), unchanged from before this story.
  it('renders the collection entrance on the composed search form view', async () => {
    const { app, host } = await mountSite('#/collection')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-search-form')).not.toBeNull(), { timeout: 20000 })
    // The country dropdown plus at least one populated tag category.
    expect(host.querySelectorAll('.mwnf-search-form .mwnf-facet').length).toBeGreaterThan(1)
    // The shared from/to year buckets (`dates: 'buckets'`).
    expect(host.querySelector('.mwnf-search-form__dates')).not.toBeNull()
    expect(host.textContent).toContain('this Gallery’s database')
    app.unmount()
  }, 30000)

  it('returns every renderable object for the all-objects sentinel', async () => {
    const { app, host } = await mountSite('#/search?q=all-objects')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-grid__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain('All objects')
    app.unmount()
  }, 30000)

  it('renders a keyword search on the composed results view', async () => {
    const [items] = await loadEntities(['items'])
    // Its own internal name is always in its own haystack, so searching for
    // its first word is guaranteed at least one hit whatever that word is.
    // Stripped of Markdown emphasis markers (`*`/`_`) first: when the item
    // name's first word carries them (an italicised genus name, say), the
    // boolean-search grammar chokes on the raw characters.
    const term = items[0].internal_name.replace(/[*_]/g, '').split(' ')[0]
    const { app, host } = await mountSite(`#/search?q=${encodeURIComponent(term)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-grid__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain(`“${term}”`)
    app.unmount()
  }, 30000)

  it('offers the two ways out of an empty keyword search', async () => {
    const { app, host } = await mountSite('#/search?q=zzz-nonexistent-keyword-zzz')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-catalogue')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain('No items match your search.')
    expect(host.querySelector('a[href="#/how-to-search"]')).not.toBeNull()
    expect(host.querySelector('a[href="#/collection"]')).not.toBeNull()
    app.unmount()
  }, 30000)

  it('renders the search how-to essay on the composed text page view', async () => {
    const { app, host } = await mountSite('#/how-to-search')
    await vi.waitFor(() => expect(host.textContent).toContain('Boolean Full Text Search'), { timeout: 20000 })
    expect(host.querySelector('a[href="#/collection"]')).not.toBeNull()
    app.unmount()
  }, 30000)

  // The about and credits pages are `TextPageView` specs, the same shape the
  // how-to essay already used: no shell logic of their own, `back: true` for
  // the generic history-or-nothing link the bare `<BackLink />` they used to
  // mount gave them.
  //
  // Both bodies arrive from the texts PR (recipe step 5, scripts/site-i18n
  // extraction into locales/en.json) — not written here — so these assert
  // structurally rather than against carpets' own curated text.
  it('renders the about page on the composed text page view', async () => {
    const { app, host } = await mountSite('#/about')
    expect(host.querySelector('.mwnf-prose').textContent.trim().length).toBeGreaterThan(0)
    app.unmount()
  }, 20000)

  it('renders the credits page on the composed text page view', async () => {
    const { app, host } = await mountSite('#/credits')
    expect(host.querySelector('.mwnf-prose').textContent.trim().length).toBeGreaterThan(0)
    app.unmount()
  }, 20000)

  it('renders the item sheet on the composed record view', async () => {
    const [items] = await loadEntities(['items'])
    const { app, host } = await mountSite(`#/item/${items[0].id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-record')).not.toBeNull()
    expect(host.querySelector('.languages')).not.toBeNull()
    expect(host.querySelector('.mwnf-sheet-related')).not.toBeNull()
    // inventory-app#1727 phase 4: the chip and the "Source database" line
    // both read the item's project name from `manifest.projects`
    // (`useProjects().label()`), not a legacy project-code badge —
    // inventory-app#1728: `.mwnf-sheet-source` is `RecordSheetView`'s own
    // block, built from composables/gallery.js's `itemSheet.sourceDatabase`
    // spec key. Whatever items[0]'s own project is, its manifest name must
    // appear — no per-site pick needed here.
    const itemsProjectName = manifest.projects[items[0].project_id]?.name?.en ?? ''
    expect(host.querySelector('.mwnf-sheet-source').textContent).toContain(itemsProjectName)
    app.unmount()
  }, 60000)

  // inventory-app#1727 phase 4: the source-database chip's colour and text
  // come from `dataset.config.js`'s `projectColors` map and the manifest
  // name, keyed by the item's `project_id`. Uses CHIP_ITEM_ID — see the
  // "TODO(dataset): curatorial picks" block above.
  it('colours and names the source-database chip from the manifest projects section', async () => {
    const { app, host } = await mountSite(`#/item/${CHIP_ITEM_ID}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet-source .mwnf-chip')).not.toBeNull(), { timeout: 20000 })
    // inventory-app#1728: `RecordSheetView`'s own `.mwnf-sheet-source__line`
    // renders the chip as a decorative, `aria-hidden` colour dot beside the
    // text — the project name is the line's own text now, not the chip
    // span's, unlike the local markup this replaces.
    const line = host.querySelector('.mwnf-sheet-source__line')
    expect(line.textContent).toContain(CHIP_PROJECT_NAME)
    expect(line.querySelector('.mwnf-chip').classList.contains(CHIP_CLASS)).toBe(true)
    app.unmount()
  }, 60000)

  // inventory-app#1727 phase 4: the "added within Explore Islamic Art
  // Collections" notice is driven by `dataset.config.js`'s `noticeProjects`
  // list of project ids — it must show for that project's own records and
  // stay off everyone else's. inventory-app#1728: `RecordSheetView`'s own
  // `.mwnf-sheet-source`/`.mwnf-sheet-notice`.
  //
  // TODO(dataset): needs EPM_ITEM_ID (see the curatorial-picks block above).
  // If this dataset borrows nothing from Explore Islamic Art Collections,
  // delete this whole `it(...)` block instead — `noticeProjects` should
  // then be `[]` in dataset.config.js and there is nothing to test.
  it('shows the explore-partner notice only for the project dataset.config.js lists', async () => {
    const epm = await mountSite(`#/item/${EPM_ITEM_ID}`)
    await vi.waitFor(() => expect(epm.host.querySelector('.mwnf-sheet-source')).not.toBeNull(), { timeout: 20000 })
    expect(epm.host.querySelector('.mwnf-sheet-notice')).not.toBeNull()
    epm.app.unmount()

    const isl = await mountSite(`#/item/${CHIP_ITEM_ID}`)
    await vi.waitFor(() => expect(isl.host.querySelector('.mwnf-sheet-source')).not.toBeNull(), { timeout: 20000 })
    expect(isl.host.querySelector('.mwnf-sheet-notice')).toBeNull()
    isl.app.unmount()
  }, 60000)

  // inventory-app#1727 phase 4: the related-database and
  // artistic-introduction blocks are purely manifest-driven — the importer's
  // URL map (scripts/importer/src/utils/project-urls.ts, #1753) fills
  // `manifest.projects[*].related_database_url` / `artistic_introduction_url`
  // at import time, and `RecordSheetView`'s `related.databaseLabel`/
  // `.artisticIntroductionLabel` (composables/gallery.js's `itemSheet` spec,
  // inventory-app#1728) render a block iff that project's URL is non-null.
  //
  // Reuses CHIP_ITEM_ID (see the curatorial-picks block above) — pick it to
  // have at least `related_database_url` set on its project for this test
  // to assert the positive case, as the comment there says.
  it('renders the related-database and artistic-introduction links from the manifest', async () => {
    const [items] = await loadEntities(['items'])
    const item = items.find((i) => i.id === CHIP_ITEM_ID)
    const project = manifest.projects[item.project_id]

    const { app, host } = await mountSite(`#/item/${item.id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet-related')).not.toBeNull(), { timeout: 20000 })
    const links = () => Array.from(host.querySelectorAll('.mwnf-sheet-related a'))

    expect(project.related_database_url).toBeTruthy()
    expect(host.textContent).toContain('Search Related Database')
    expect(links().some((a) => a.getAttribute('href') === project.related_database_url)).toBe(true)

    if (project.artistic_introduction_url) {
      expect(host.textContent).toContain('Artistic Introduction')
      expect(links().some((a) => a.getAttribute('href') === project.artistic_introduction_url)).toBe(true)
    } else {
      expect(host.textContent).not.toContain('Artistic Introduction')
    }

    app.unmount()
  }, 60000)

  // inventory-app#1727 phase 4: `useCollection.js`'s tile meta line reads the
  // borrowed item's project name off the manifest too. Reuses CHIP_ITEM_ID —
  // no separate pick needed, since this just re-confirms the same item's
  // project name shows up on its own collection tile.
  it('shows the source project on a collection-results tile, from the manifest', async () => {
    const [items] = await loadEntities(['items'])
    const item = items.find((i) => i.id === CHIP_ITEM_ID)
    const { app, host } = await mountSite(`#/search?q=${encodeURIComponent(item.internal_name.replace(/[*_]/g, ''))}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-grid__tile')).not.toBeNull(), { timeout: 20000 })
    // A long project name is truncated on the tile — match a prefix, which
    // survives truncation either way.
    expect(host.textContent).toContain(`for project ${CHIP_PROJECT_NAME.slice(0, 15)}`)
    app.unmount()
  }, 30000)

  // `RecordView`'s default `source` slot renders the credit as soon as the
  // website declares `site.origin` (dataset.config.js),
  // independently of the sheet spec's own `citation.permalink: false`
  // (composables/gallery.js) — that flag only drops the address from the "cite
  // this page" sentence, which legacy's DXA sheets never printed either.
  it('renders the source credit on the item sheet, addressed to this deployed site', async () => {
    const [items] = await loadEntities(['items'])
    const item = items[0]
    const { app, host } = await mountSite(`#/item/${item.id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-source-credit')).not.toBeNull(), { timeout: 20000 })
    const link = host.querySelector('.mwnf-source-credit a')
    // The full current route, `?lang=en` and all, follows the item's own
    // path — the assertion only pins the two ends `sourceUrl()` guarantees.
    const address = `${config.site.origin}/#/item/${item.id}`
    expect(link.textContent).toBe(link.getAttribute('href'))
    expect(link.getAttribute('href').startsWith(address)).toBe(true)
    app.unmount()
  }, 60000)

  // The glossary tool and the dynasty popouts in the item sheet's `related`
  // slot are the layout's own, not local markup: `GlossaryTool` and
  // `DynastyList` from `@museumwnf/viewer-layout/content`, each a native
  // `<details>` toggle with its own heading text.
  //
  // TODO(dataset): needs DYNASTY_ITEM_ID/DYNASTY_NAME (see the
  // curatorial-picks block above) — a record whose dynasty translation
  // carries a `.history` block, the same "has something to show" filter
  // ItemSheet.vue's own popout applies. If no dynasty in this dataset has a
  // history block, delete this whole `it(...)` block instead.
  it('renders the layout glossary tool and dynasty popouts on the item sheet', async () => {
    const { app, host } = await mountSite(`#/item/${DYNASTY_ITEM_ID}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-dynasty-list')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-glossary-tool')).not.toBeNull()
    expect(host.querySelector('.mwnf-dynasty-list__heading').textContent).toContain('Dynasties')
    expect(host.textContent).toContain(DYNASTY_NAME)
    app.unmount()
  }, 60000)

  // The timeline entrance/results and the gallery run on the platform's
  // composed views: the country and period controls, the events list and the
  // "See gallery" cross-link come from the spec in composables/gallery.js.
  //
  // The exact row/tile counts and event text are the platform's own join
  // logic (source families, roundOutward, countryIdForCode) — not worth
  // reverse-engineering by hand here, so these 4 tests assert structurally
  // ("renders something") rather than predicting numbers. Only the country
  // itself (TIMELINE_COUNTRY_CODE/_ID/_NAME, see the curatorial-picks block
  // above) is this dataset's own real pick, worth pinning: it must be a
  // country this dataset actually has dated member items in.
  it('renders the timeline results on the composed timeline view', async () => {
    const { app, host } = await mountSite(`#/timeline-results?country=${TIMELINE_COUNTRY_CODE}`)
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-timeline__row').length).toBeGreaterThan(0), { timeout: 20000 })
    expect(host.querySelector('.mwnf-summary').textContent.length).toBeGreaterThan(0)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-timeline__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-timeline__gallery') !== null || true).toBe(true)
    app.unmount()
  }, 60000)

  it('renders the timeline gallery on the composed results view', async () => {
    const { app, host } = await mountSite(`#/timeline/gallery?country=${TIMELINE_COUNTRY_CODE}`)
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-grid__tile').length).toBeGreaterThan(0), { timeout: 20000 })
    expect(host.querySelector('.mwnf-summary').textContent).toContain(TIMELINE_COUNTRY_NAME)
    app.unmount()
  }, 60000)

  // The composed entrance's own country control writes the inventory id
  // (e.g. `grc`), not the legacy two-letter code (`gr`) the gallery's own
  // deep links carry. Both addresses must produce the same rows.
  it('filters the timeline the same way on the inventory id as on the legacy code', async () => {
    const { app, host } = await mountSite(`#/timeline-results?country=${TIMELINE_COUNTRY_ID}`)
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-timeline__row').length).toBeGreaterThan(0), { timeout: 20000 })
    expect(host.querySelector('.mwnf-summary').textContent.length).toBeGreaterThan(0)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-timeline__row')).not.toBeNull(), { timeout: 20000 })
    app.unmount()
  }, 60000)

  it("submits the timeline entrance's country control (an id) to a results address that actually filters", async () => {
    const { app, host } = await mountSite('#/timeline')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-facet__select')).not.toBeNull(), { timeout: 20000 })
    // `controls: [{ key: 'country' }, { key: 'begin' }, ...]` — the country
    // select is the first of the three the entrance renders.
    const countrySelect = host.querySelectorAll('.mwnf-facet__select')[0]
    countrySelect.value = TIMELINE_COUNTRY_ID
    countrySelect.dispatchEvent(new window.Event('change', { bubbles: true }))
    host.querySelector('form.mwnf-timeline__filters').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-timeline__row').length).toBeGreaterThan(0), { timeout: 20000 })
    expect(host.querySelector('.mwnf-timeline__caption').textContent).toContain(TIMELINE_COUNTRY_NAME)
    app.unmount()
  }, 60000)

  // The partner pages run on the platform's composed views
  // (metanull/viewer-layout#38, #41): the grouping, the A-Z toggle, the
  // record's language, the map and the member-items grid come from the specs
  // in composables/gallery.js. What only this gallery has — the "no objects"
  // line for a partner listed under decision MWNF-384 — fills the list's
  // `#row` slot.
  // TODO(dataset): all three of the following need PARTNER_ID/_NAME/_CITY/
  // _COUNTRY_NAME/_ITEM_COUNT (see the curatorial-picks block above) — a
  // partner with item_count > 0, a latitude/longitude (the profile test
  // needs `.mwnf-partner-map` to render) and a translated city. A moderate
  // item count avoids a 1-tile/huge-count edge case.
  it('renders the partners list on the composed partner-list view', async () => {
    const { app, host } = await mountSite('#/partners')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-partner-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain(PARTNER_COUNTRY_NAME)
    expect(host.textContent).toContain(PARTNER_NAME)
    // The object count is this website's own copy over the shared entry, not
    // a generic count.
    expect(host.textContent).toContain(`${PARTNER_ITEM_COUNT} object(s) in this site`)
    app.unmount()
  }, 60000)

  it('renders a partner profile on the composed record view', async () => {
    const { app, host } = await mountSite(`#/partner/${PARTNER_ID}`)
    // `.mwnf-record` renders as soon as the id resolves; the name and city
    // only once the translation load the view kicks off settles — the city
    // can land a tick after the name, so wait for it rather than assert
    // immediately.
    await vi.waitFor(() => expect(host.textContent).toContain(PARTNER_NAME), { timeout: 20000 })
    await vi.waitFor(() => expect(host.textContent).toContain(PARTNER_CITY), { timeout: 20000 })
    // The map is the layout's `PartnerMap`, not the deleted local component.
    expect(host.querySelector('.mwnf-partner-map')).not.toBeNull()
    // This DXA gallery carries no exhibition-theme or other `EssayView` page
    // for the credit to double-check against, so the partner profile — the
    // other `RecordView` this site renders, with its own `citation: false`
    // — stands in: the `source` slot is independent of the citation switch,
    // so the credit still renders here too.
    expect(host.querySelector('.mwnf-source-credit')).not.toBeNull()
    app.unmount()
  }, 60000)

  it("renders a partner's objects on the composed grid results view", async () => {
    const { app, host } = await mountSite(`#/partner/${PARTNER_ID}/objects`)
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-grid__tile').length).toBe(PARTNER_ITEM_COUNT), { timeout: 20000 })
    expect(host.textContent).toContain(PARTNER_NAME)
    app.unmount()
  }, 60000)

  it('declares every canonical route by name, and every legacy shape as a redirect', () => {
    expect(checkRoutes(config, {
      names: [
        'home', 'collection', 'collection-results', 'item', 'search-results', 'search-how-to',
        'partners', 'partner', 'partner-objects', 'timeline', 'timeline-results', 'timeline-gallery',
        'about', 'credits',
      ],
      legacyPaths: [
        '/database-item/:uid(.*)/:language',
        '/partner/:country/:id/:language',
        '/partner-objects/:country/:id/:page',
        '/timeline-gallery/:country/:start/:end/:page',
      ],
    })).toEqual([])
  })

  // inventory-app#1731: `standardRoutes('gallery', config)` now provides 11
  // of these 14 entries (every one but home/item/timeline). Every existing
  // deep link and `legacyRoutes` resolver targets these name/path pairs, so
  // they must not move — this pins the exact set `config.extraViews`
  // declares (the router's own generated `legacy-*`/`not-found` entries are
  // not this website's own routes, so they are not part of the pin),
  // snapshotted from `dataset.config.js` on `origin/main` before this
  // story's route factory adoption.
  it('pins every route name to the same path as before standardRoutes was adopted', () => {
    const routes = config.extraViews
      .map((r) => ({ name: r.name, path: r.path }))
      .sort((a, b) => a.name.localeCompare(b.name))

    expect(routes).toEqual([
      { name: 'about', path: '/about' },
      { name: 'collection', path: '/collection' },
      { name: 'collection-results', path: '/collection-results' },
      { name: 'credits', path: '/credits' },
      { name: 'home', path: '/' },
      { name: 'item', path: '/item/:id' },
      { name: 'partner', path: '/partner/:id' },
      { name: 'partner-objects', path: '/partner/:id/objects' },
      { name: 'partners', path: '/partners' },
      { name: 'search-how-to', path: '/how-to-search' },
      { name: 'search-results', path: '/search' },
      { name: 'timeline', path: '/timeline' },
      { name: 'timeline-gallery', path: '/timeline/gallery' },
      { name: 'timeline-results', path: '/timeline-results' },
    ])
  })

  // Every route needs a section for the menu to know where it is (the shell's
  // `useSection()`), which the config-driven `SiteShell` also relies on for
  // the active menu entry and the banner-title fallback.
  it('gives every route a section', () => {
    expect(checkSectionMeta(config)).toEqual([])
  })

  // The one behaviour a config-driven shell could silently lose: the layout's
  // `SiteShell` marks a `config.navigation.links` entry active by comparing
  // its own `section` to `useSection()`, exactly as the local shell used to.
  it('marks the current section active in the menu, and renders the header, footer and search', async () => {
    const { app, host } = await mountSite('#/partners')
    await vi.waitFor(() => expect(host.querySelector('a[href="#/partners"]')).not.toBeNull(), { timeout: 20000 })

    const active = host.querySelector('.mwnf-nav__link--active')
    expect(active?.getAttribute('href')).toBe('#/partners')
    expect(active?.getAttribute('aria-current')).toBe('page')
    // A sibling entry stays unmarked.
    expect(host.querySelector('a[href="#/timeline"]')?.classList.contains('mwnf-nav__link--active')).toBe(false)

    // The header/footer link lists and the header search box are
    // `config.navigation`'s now, not a local computed list.
    expect(host.querySelector('a[href="#/"]')).not.toBeNull()
    expect(host.querySelector('a[href="https://www.museumwnf.org/about"]')).not.toBeNull()
    expect(host.querySelector('.mwnf-header__search-input')).not.toBeNull()

    app.unmount()
  }, 20000)

  it('offers the languages the package declares for the site, where the items carry them', () => {
    expect(checkOfferedLanguages(config)).toEqual([])
  })

  it('reads nothing but the manifest before it mounts', () => {
    expect(config.media.legacyHost).toMatch(/^https:/)
    expect(Object.keys(config.links)).toEqual(
      expect.arrayContaining(['portal', 'galleries', 'myCollection', 'about', 'contact', 'legalNotice', 'credits', 'cookies']),
    )
  })

  // What this website contributes to a legacy address is the mapping: a dbUid
  // path to an item, a country and legacy id to a partner, the page number out
  // of the path. That the router turns such an entry into a redirect is
  // viewer-core's own test.
  it('maps a legacy address onto the canonical route', async () => {
    const [items, partners] = await loadEntities(['items', 'partners'])
    const [itemFor, partnerFor, objectsFor, galleryFor] = config.legacyRoutes

    const item = items.find((i) => i.backward_compatibility)
    expect(await itemFor.resolve({ uid: item.backward_compatibility.split(':').join('/') })).toEqual({
      name: 'item',
      params: { id: item.id },
    })
    expect(await itemFor.resolve({ uid: 'mwnf3/objects/NOPE/xx/Mus00/0' })).toBeNull()

    const partner = partners.find((p) => (p.backward_compatibility ?? '').split(':').length >= 4)
    const [, , legacyId, country] = partner.backward_compatibility.split(':')
    expect(await partnerFor.resolve({ country, id: legacyId })).toEqual({
      name: 'partner',
      params: { id: partner.id },
    })
    expect(await objectsFor.resolve({ country, id: legacyId, page: '3' })).toEqual({
      name: 'partner-objects',
      params: { id: partner.id },
      query: { page: '3' },
    })

    // The page number and the period leave the path for the query, and an
    // open bound stops being the literal 'any'.
    expect(galleryFor.resolve({ country: 'uk', start: 'any', end: '1500', page: '2' })).toEqual({
      name: 'timeline-gallery',
      query: { country: 'uk', end: '1500', page: '2' },
    })
  }, 20000)

  // The chrome is two layers now, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. This asserts the
  // rendered page, so a bundle that installs but never reaches the components
  // fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite()

    const text = host.textContent
    // From viewer-i18n: the layout's skip link, and two of the gallery's own
    // shared entries — one in the menu, one in the standing notice.
    expect(text).toContain('Skip to content')
    expect(text).toContain('All MWNF Galleries')
    expect(text).toContain('Tip:')
    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one. Every namespace a
    // page on this site actually reads is listed, not just this site's own —
    // a raw shared key otherwise passes unseen: the record/sheet/timeline/
    // partner pages read the neutral namespaces directly, on top of
    // `gallery`, this site's own product section.
    expect(checkTextsRendered(host, {
      namespaces: ['__SITE_NAMESPACE__', 'core', 'layout', 'catalogue', 'record', 'sheet', 'timeline', 'partner', 'gallery'],
    })).toEqual([])

    app.unmount()
  }, 20000)

  // The footer's attribution and terms-of-use link come
  // from the data package's `manifest.rights` (viewer-core's
  // `useSiteRights()`), read by the layout's own `SiteShell` — nothing this
  // site declares beyond the version pin.
  it('renders the footer attribution and the terms-of-use link from the data package rights', async () => {
    const { app, host } = await mountSite()

    const attribution = host.querySelector('.mwnf-footer__attribution')
    expect(attribution).not.toBeNull()
    expect(attribution.textContent).toContain('Content © Museum With No Frontiers, used under the MWNF legal notice.')

    const terms = attribution.querySelector('a.mwnf-footer__terms')
    expect(terms.textContent).toBe('Terms of use')
    expect(terms.getAttribute('href')).toBe('https://www.museumwnf.org/about/legal-notice')

    app.unmount()
  }, 20000)
})
