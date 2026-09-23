<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n, useSiteConfig } from '@museumwnf/viewer-core'
import { FeaturedPartners, SiblingGalleries } from '@museumwnf/viewer-layout/content'
import {
  partners, partnerRoute, labelOf, tr, defaultLang, mdStrip,
  pickSiblings, siblingUrl, chromeImage,
} from '../composables/gallery.js'

// The banner is rendered by SiteShell, in PageShell's banner section (legacy
// put it in a named router-view of its own, above the nav). What is left is
// what legacy stacked below: the featured-partners carousel and the
// sibling-galleries strip, now the layout's content components — the
// carousel rotation, the bullet controls and the two-block sibling layout
// are theirs; what stays here is this gallery's own picture:
//
// - which partners are "featured" (legacy's server-side random draw off
//   `showOnPortal`, reproduced client-side since a static package cannot
//   replay it — decision already recorded where the local component used
//   to live), truncated to a carousel-sized blurb;
// - which siblings this gallery's roster carries and whether each one
//   resolved to an address (decision Q3, composables/gallery.js: reference
//   objects, not resolved links — an unresolved one still renders, just not
//   as a link).
//
// The logos slot legacy also stacked here is deliberately absent: it was fed
// by a table with one row in total across every DXA site, so it renders
// nothing on the live __DATASET__ instance either and the package carries none.
const { t, locale } = useI18n()
const { links } = useSiteConfig()

const CAROUSEL_SIZE = 8

function shuffle(list) {
  const pool = [...list]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
}

function truncate(text, chars) {
  if (!text || text.length <= chars) return text
  const cut = text.lastIndexOf(' ', chars)
  return `${text.slice(0, cut > 0 ? cut : chars)}...`
}

const featuredPartners = computed(() =>
  shuffle(partners.value.filter((p) => p.featured)).slice(0, CAROUSEL_SIZE).map((p) => {
    const text = tr('partners', p.id, defaultLang)
    return {
      id: p.id,
      name: labelOf('partners', p.id),
      city: text.city ?? '',
      country: labelOf('countries', p.country_id),
      description: truncate(mdStrip(text.description ?? ''), 420),
      logo: p.images?.[0]?.url ?? null,
      route: partnerRoute(p),
    }
  })
)

const siblings = ref([])
onMounted(() => { siblings.value = pickSiblings(4) })

const siblingRecords = computed(() =>
  siblings.value.map((sibling) => ({
    id: sibling.id,
    name: sibling.names?.[locale.value] ?? sibling.names?.en ?? sibling.slug,
    image: sibling.image_path ? chromeImage(sibling.image_path, 'lo_res') : null,
    route: siblingUrl(sibling),
  }))
)

const museums = computed(() => [
  { name: t('core.project.islamicArt'), href: `${links.islamicArt}/`, accent: 'var(--dia-yellow)', textColor: '#222' },
  { name: t('core.project.baroqueArt'), href: `${links.baroqueArt}/`, accent: 'var(--dba-blue)', textColor: '#fff' },
  { name: t('core.project.sharingHistory'), href: `${links.sharingHistory}/`, accent: 'var(--sh-red)', textColor: '#fff' },
])

const seeMoreGalleriesHref = computed(() => `${links.galleries}/list`)
</script>

<template>
  <div>
    <FeaturedPartners :records="featuredPartners" heading-entry="gallery.partner.featured" />
    <SiblingGalleries
      :galleries="siblingRecords"
      :museums="museums"
      galleries-heading-entry="gallery.action.visitGalleries"
      see-more-galleries-entry="gallery.action.seeMoreGalleries"
      :see-more-galleries-href="seeMoreGalleriesHref"
      museums-heading-entry="gallery.siblings.otherVirtualMuseums"
    />
  </div>
</template>
