import { describeGallerySmoke } from '@museumwnf/viewer-layout/dxa/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/gallery'
import manifest from '@inventory-data/manifest.json'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'

// The gallery family's smoke test, run against this gallery's own dataset.
// The picks are records of that dataset the tests look for; each is described
// in the suite's own documentation (@museumwnf/viewer-layout/dxa/testing).
//
// ── TODO(dataset): curatorial picks ─────────────────────────────────────────
// They name specific records of YOUR OWN published dataset and cannot be
// derived generically. Find each in your data package (fetch
// https://unpkg.com/@museumwnf/__DATASET__-data@latest/items.json,
// partners.json, dynasties.json, timeline_events.json, and their
// translations/*.en.json, or `npm pack --dry-run` it locally).
describeGallerySmoke({
  config,
  sharedTexts,
  ownTexts,
  manifest,
  namespace: '__SITE_NAMESPACE__',
  picks: {
    // An item borrowed from another project whose project carries a
    // related-database address (`manifest.projects[…].related_database_url`):
    // its id, that project's English name, and its `projectColors` class
    // from dataset.config.js.
    chip: {
      item: '00000000-0000-0000-0000-000000000000', // TODO(dataset)
      project: 'TODO(dataset): the project’s manifest.projects[…].name.en',
      className: 'mwnf-chip--EXH', // TODO(dataset)
    },
    // An item whose project_id is '928f5e0d-53e3-5f53-b9c2-5af389c30dd4'
    // (Explore Islamic Art Collections), or null if this gallery borrows none.
    noticeItem: null, // TODO(dataset)
    // An item whose dynasty has a translated `history`, and that dynasty's
    // translated name; null if no dynasty of this gallery has one.
    dynasty: null, // TODO(dataset)
    // A country this gallery has dated items in: its legacy two-letter code,
    // its inventory id (countries.json's own `id`), its translated name.
    timeline: {
      code: 'TODO', // TODO(dataset)
      id: 'TODO', // TODO(dataset)
      country: 'TODO(dataset): that country’s translated name',
    },
    // A partner with objects, a latitude/longitude and a translated city:
    // its id, translated name and city, its country's translated name, and
    // its item_count.
    partner: {
      id: '00000000-0000-0000-0000-000000000000', // TODO(dataset)
      name: 'TODO(dataset): that partner’s translated name',
      city: 'TODO(dataset): that partner’s translated city',
      country: 'TODO(dataset): that partner’s country, translated',
      objects: 0, // TODO(dataset)
    },
  },
})
