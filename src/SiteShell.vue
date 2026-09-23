<script setup>
// The __SITE_NAME__ page chrome: the layout's own `SiteShell`, composed from
// `dataset.config.js`'s `navigation` and `banner` (the menu, the header and
// footer link lists, the section-title map, the search box, the banner
// variant/eyebrow/enter). What is left here is what only a loaded record can
// answer — the banner's own image and caption, the home page's title — and
// the MWNF mark in the header.
import { computed } from 'vue'
import { useI18n, useSection, useSiteConfig } from '@museumwnf/viewer-core'
import { SiteShell } from '@museumwnf/viewer-layout/components'
import {
  gallery, chromeImage, itemById, labelOf, tr, defaultLang, manifest,
} from './composables/gallery.js'

// `language`, `languages` and `update:language` are the shell contract of
// viewer-core: the language the application is in, the languages it offers
// (labelled, from dataset.config.js) and the event that sets it. `AppRoot`
// spreads every other `config.navigation` field onto this component the same
// way — `links`, `headerLinks`, `footerLinks`, `sectionTitles`, `search`, all
// still raw entry names, not text — since this component declares none of
// them as its own prop. Whatever of that raw set falls through onto the
// layout `SiteShell`'s root no longer matters: from 2.11.1 that component
// disables its own attribute fallthrough and binds its translated props
// explicitly, so its rendered links always win over raw entry names
// (viewer-layout#75) — nothing here needs to guard against them either.

const props = defineProps({
  language: { type: String, default: 'en' },
  languages: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:language'])

const { t, locale } = useI18n()
const { links } = useSiteConfig()

const galleryName = computed(() =>
  manifest.site?.names?.[locale.value] ?? manifest.site?.names?.en ?? gallery.value?.names?.en ?? ''
)
// The section a route declares (`meta.section` in dataset.config.js): the
// layout's `SiteShell` reads it for the active menu entry and the banner
// title fallback; the home title below still needs it directly, since the
// gallery's own name is not something `config.navigation.sectionTitles` (an
// entry name) can express.
const section = useSection()
const isHome = computed(() => section.value === 'home')
const currentYear = new Date().getFullYear()

// The banner: the gallery's own image, captioned with the banner item's sheet.
// gallery.json carries `banner_image_path` and `banner_item_id`; the image
// lives on the legacy media server, so the address is built from the host
// dataset.config.js declares. Neither is expressible as a `config.banner`
// function — those only ever see `{ section, locale, t }`, never the loaded
// record — so both stay here, on every page, the same as before.
const bannerImage = computed(() => chromeImage(gallery.value?.banner_image_path, 'hi_res'))
const bannerCaption = computed(() => {
  const item = itemById.value.get(gallery.value?.banner_item_id)
  if (!item) return ''
  const sheet = tr('items', item.id, defaultLang)
  return {
    name: labelOf('items', item.id),
    partner: labelOf('partners', item.partner_id),
    location: sheet.location ?? '',
    country: labelOf('countries', item.country_id),
  }
})
</script>

<template>
  <SiteShell
    :languages="props.languages"
    :language="props.language"
    language-placement="header"
    language-style="buttons"
    :header-home="links.portal"
    :header-eyebrow="isHome ? '' : t('core.project.galleries')"
    :header-title="isHome ? '' : galleryName"
    header-title-href="#/"
    :banner-image="bannerImage"
    :banner-caption="bannerCaption"
    :banner-title="isHome ? galleryName : undefined"
    :notice="{ title: t('gallery.notice.tip'), text: t('gallery.notice.databaseReplaced') }"
    :footer-text="`${t('gallery.footer.copyright')} 2004–${currentYear}`"
    @update:language="emit('update:language', $event)"
  >
    <template #brand><span class="logo-mark">MWNF</span></template>
    <slot />
  </SiteShell>
</template>

<style scoped>
.logo-mark {
  display: inline-block;
  border: 2px solid currentColor;
  padding: 4px 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-size: 18px;
}
</style>
