import { galleryConfig } from '@museumwnf/viewer-layout/dxa'

// The whole declaration of this website: a DXA gallery, whose pages, shell,
// menu and legacy redirects are the family's (`galleryConfig`,
// @museumwnf/viewer-layout/dxa). What is this gallery's own is below.

// TODO(dataset): the source-database chip's colour, per project — one entry
// for every project id your own dataset carries in `manifest.projects`. Find
// them in
//
//   https://unpkg.com/@museumwnf/__DATASET__-data@latest/manifest.json
//
// The class names are @museumwnf/viewer-layout's fixed chip palette
// (`mwnf-chip--<name>`): `mwnf-chip--ISLandEPM` for Discover Islamic Art and
// Explore Islamic Art Collections, `mwnf-chip--DBA` for Discover Baroque Art,
// `mwnf-chip--AWE` for Sharing History, `mwnf-chip--DCA` for Discover Carpet
// Art, `mwnf-chip--DGA` for Discover Glass Art, `mwnf-chip--Galleries` for
// MWNF Galleries, or `mwnf-chip--EXH` for any exhibition-sourced project
// (including this gallery's own, if it has one). The example below is
// carpets' own map; replace it entirely.
export const projectColors = {
  'dcf7b4d2-03c8-568a-8209-2817950fe05e': 'mwnf-chip--DCA', // EXAMPLE — Discover Carpet Art (carpets' own project; replace with your own manifest.projects)
}

// TODO(dataset): the projects whose item sheets carry legacy's
// Explore-partner notice. Set this to
// `['928f5e0d-53e3-5f53-b9c2-5af389c30dd4']` (Explore Islamic Art
// Collections' fixed id) if any of this gallery's own items borrow from that
// project; check with
//
//   items.some(i => i.project_id === '928f5e0d-53e3-5f53-b9c2-5af389c30dd4')
//
// against your published `items.json`. Otherwise leave it empty.
export const noticeProjects = []

export default galleryConfig({
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@museumwnf/__DATASET__-data',

  // The name for a package that predates `manifest.site`.
  siteName: '__SITE_NAME__',

  // The address this build is deployed at, base path included, read by the
  // source credit: the GitHub Pages address, the same repository segment
  // vite.config.js's `base` puts in the build's base path, so the two change
  // together, and with the domain.
  origin: 'https://museumwithnofrontiers.github.io/__DATASET__',

  projectColors,
  noticeProjects,

  // The credits page's body.
  creditsBody: '__SITE_NAMESPACE__.credits.body',
})
