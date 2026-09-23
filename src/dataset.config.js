import { languageLabels, loadEntities, mwnfLinks, offeredLanguages, sectionMeta, useDataPackage } from '@museumwnf/viewer-core'
import { standardRoutes } from '@museumwnf/viewer-layout/dxa'
import SiteShell from './SiteShell.vue'
import { itemFromUidPath, partnerFromKey } from './composables/gallery.js'

// The whole declaration of this website. Before it mounts, the website reads
// nothing from its package but the manifest: the languages it offers, their
// labels and its name come from `manifest.site`, and every record is loaded
// by the route that reads it.

const { manifest } = useDataPackage()

// The gallery's own UI languages (`thg_gallery_lang`, declared by the package
// as `site.languages`), kept where the item translations actually carry them.
// An item sheet may offer more — whatever languages the record itself carries
// — from its own switcher, without touching the site language.
const languages = offeredLanguages()

// Every page renders the chrome — the header title, the banner and its
// caption — off these four; a page adds what it reads on top. A route also
// says which section it belongs to, and the shell reads that for the banner
// title and the active menu entry (viewer-core's `useSection`).
const CHROME = ['gallery', 'items', 'partners', 'countries']
const meta = sectionMeta(CHROME)

// The banner title over a section page: the section the route declares,
// named — each name written out for the check. The empty-string key is the
// router's own catch-all, which carries no `meta.section` at all, so
// `useSection()` reads it as `''`; legacy still owed that page a banner
// title, so the fallback lives here rather than nowhere.
const SECTION_TITLES = {
  collection: 'gallery.section.collection',
  database: 'gallery.section.database',
  partners: 'gallery.section.partners',
  timeline: 'gallery.section.timeline',
  about: 'gallery.section.about',
  credits: 'gallery.section.credits',
  '': 'gallery.section.error',
}

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@museumwnf/__DATASET__-data',

  // English is the base language of every catalogue in the platform, so the
  // name the site is known by is the English one.
  siteName: manifest.site?.names?.en ?? '__SITE_NAME__',

  // All pages are website-specific views (below) — no generic entity pages.
  features: {
    entities: [],
  },

  languages,

  shell: SiteShell,

  // The layout's `SiteShell` (mounted from src/SiteShell.vue) reads this
  // instead of a shell rebuilding it: the switcher's labels (from the
  // package, not a translator), the menu — legacy's five site sections, each
  // entry's `section` the same string its own route's `meta.section` carries,
  // so the active one follows `useSection()` — the portal's My Collection
  // link (no section: it never highlights), the header/footer link lists,
  // the section-title map the banner falls back to, and the header search
  // box's target.
  navigation: {
    languages: languageLabels(languages),
    links: [
      { section: 'about', label: 'gallery.nav.about', to: { name: 'about' } },
      { section: 'collection', label: 'gallery.nav.collection', to: { name: 'collection' } },
      { section: 'partners', label: 'gallery.nav.partners', to: { name: 'partners' } },
      { section: 'timeline', label: 'gallery.nav.timeline', to: { name: 'timeline' } },
      { section: 'credits', label: 'gallery.nav.credits', to: { name: 'credits' } },
      { label: 'gallery.nav.myCollection', href: mwnfLinks.myCollection, external: true },
    ],
    headerLinks: [
      { label: 'core.nav.home', to: { name: 'home' } },
      { label: 'gallery.nav.allGalleries', href: `${mwnfLinks.galleries}/list/1`, external: true },
    ],
    footerLinks: [
      { label: 'gallery.footer.aboutMwnf', href: mwnfLinks.about, external: true },
      { label: 'gallery.footer.contact', href: mwnfLinks.contact, external: true },
      { label: 'gallery.footer.legalNotice', href: mwnfLinks.legalNotice, external: true },
      { label: 'gallery.footer.credits', href: mwnfLinks.credits, external: true },
      { label: 'gallery.footer.cookies', href: mwnfLinks.cookies, external: true },
    ],
    sectionTitles: SECTION_TITLES,
    search: { route: 'search-results', key: 'q', placeholder: 'gallery.search.placeholder', submitLabel: 'catalogue.search.submit', empty: 'all-objects' },
  },

  // The banner: `variant`, `eyebrow` and `enter` depend only on the section,
  // so `SiteShell` derives them here; the image and the caption depend on
  // the loaded gallery record, which no config function can read, so
  // src/SiteShell.vue still passes those two straight through.
  banner: {
    variant: ({ section }) => (section === 'home' ? 'strip' : 'section'),
    eyebrow: ({ section, t }) => (section === 'home' ? t('gallery.banner.discoverGalleries') : ''),
    captionLabel: 'gallery.banner.detailFrom',
    enter: ({ section, t }) => (section === 'home'
      ? { label: '»', href: '#/collection', ariaLabel: t('gallery.action.goToCollection') }
      : null),
  },

  // Gallery chrome images live on the legacy media server and were never
  // imported; the package ships the path, this is the host.
  media: {
    legacyHost: 'https://images.museumwnf.org',
  },

  // Every address this website links out to — the twelve portal and sibling
  // addresses every DXA config repeats.
  links: { ...mwnfLinks },

  // TODO(dataset): the source-database chip's colour, per project (epic
  // #1727 phase 4) — one entry for every project id your own dataset carries
  // in `manifest.projects`. Find them with:
  //
  //   npm pack @museumwnf/__DATASET__-data --dry-run --json | jq -r '.length'
  //   (or fetch https://unpkg.com/@museumwnf/__DATASET__-data@latest/manifest.json)
  //
  // and enumerate `manifest.projects`. The class names are
  // `@museumwnf/viewer-layout`'s own fixed chip palette
  // (`.mwnf-chip--<name>`): pick `mwnf-chip--ISLandEPM` for Discover Islamic
  // Art / Explore Islamic Art Collections, `mwnf-chip--DBA` for Discover
  // Baroque Art, `mwnf-chip--AWE` for Sharing History, `mwnf-chip--DCA` for
  // Discover Carpet Art, `mwnf-chip--DGA` for Discover Glass Art,
  // `mwnf-chip--Galleries` for MWNF Galleries, or `mwnf-chip--EXH` for any
  // exhibition-sourced project (including this gallery's own, if it has
  // one). The example below is carpets' own map — replace it entirely.
  projectColors: {
    'dcf7b4d2-03c8-568a-8209-2817950fe05e': 'mwnf-chip--DCA', // EXAMPLE — Discover Carpet Art (carpets' own project; replace with your own manifest.projects)
  },

  // TODO(dataset): the "this item has been added within ..." notice on the
  // item sheet (legacy's EPM-only note). Set this to
  // `['928f5e0d-53e3-5f53-b9c2-5af389c30dd4']` (Explore Islamic Art
  // Collections' fixed id) if any of this gallery's own items borrow from
  // that project — check with:
  //
  //   items.some(i => i.project_id === '928f5e0d-53e3-5f53-b9c2-5af389c30dd4')
  //
  // against your published `items.json` — otherwise leave it empty.
  noticeProjects: [],

  // The absolute origin this build is deployed at (base path included),
  // read by viewer-core's `sourceUrl()` for the layout's `SourceCredit`. The
  // GitHub Pages address until the domain is decided.
  site: { origin: 'https://museumwithnofrontiers.github.io/__DATASET__' },

  // The canonical routes, one view per page: a section is `/<section>`, a
  // record `/<section>/:id` with the package id, and the language, the page
  // and every filter travel in the query. The 'home' name replaces
  // viewer-core's generic home route.
  extraViews: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue'), meta: meta('home') },
    {
      path: '/item/:id',
      name: 'item',
      component: () => import('./views/ItemSheet.vue'),
      props: (route) => ({ id: route.params.id }),
      meta: meta('database', 'languages', 'dynasties', 'glossary', 'timelines', 'timeline_events'),
    },
    { path: '/timeline', name: 'timeline', component: () => import('./views/Timeline.vue'), meta: meta('timeline', 'timelines', 'timeline_events') },
    // Every other page (about/credits/partners/search/collection/timeline
    // results/gallery) is the package's shared gallery pages, spread in with
    // this site's one genuine per-site string (`Credits.vue`'s `body` entry
    // name).
    ...standardRoutes('gallery', { creditsBody: '__SITE_NAMESPACE__.credits.body' }),
  ],

  // The legacy URL shapes, redirect-only, so a legacy address pasted after
  // the `#` still lands on the right page: the item sheet's dbUid path
  // (`/database-item/mwnf3/objects/EPM/uk/Mus21/41/en`) resolves through
  // `backward_compatibility`, the partner's country and legacy id through the
  // partner record; the language segment is dropped, the page number moves
  // to the query.
  legacyRoutes: [
    {
      path: '/database-item/:uid(.*)/:language',
      async resolve({ uid }) {
        await loadEntities(['items'])
        const item = itemFromUidPath(uid)
        return item ? { name: 'item', params: { id: item.id } } : null
      },
    },
    {
      path: '/partner/:country/:id/:language',
      async resolve({ country, id }) {
        await loadEntities(['partners'])
        const partner = partnerFromKey(country, id)
        return partner ? { name: 'partner', params: { id: partner.id } } : null
      },
    },
    {
      path: '/partner-objects/:country/:id/:page',
      async resolve({ country, id, page }) {
        await loadEntities(['partners'])
        const partner = partnerFromKey(country, id)
        if (!partner) return null
        return { name: 'partner-objects', params: { id: partner.id }, query: Number(page) > 1 ? { page } : {} }
      },
    },
    {
      path: '/timeline-gallery/:country/:start/:end/:page',
      resolve({ country, start, end, page }) {
        const query = { country }
        // The path segments keep their legacy names; the query they resolve
        // to carries the platform's own key for a period bound, 'begin'.
        if (start !== 'any') query.begin = start
        if (end !== 'any') query.end = end
        if (Number(page) > 1) query.page = page
        return { name: 'timeline-gallery', query }
      },
    },
    { path: '/error', resolve: () => null },
  ],
}
