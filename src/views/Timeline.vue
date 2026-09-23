<script setup>
import { I18nText } from '@museumwnf/viewer-core'
import { TimelineResultsView } from '@museumwnf/viewer-layout/views'
import { timelineResults } from '../composables/gallery.js'

// The timeline entrance, on the platform's composed timeline view: the
// country and period controls, the validation and the navigation to the
// results page are the view's, over the spec in
// composables/gallery.js — the same spec the results page renders,
// `entrance: true` here.
const spec = { ...timelineResults, entrance: true }
</script>

<template>
  <div id="timeline-page">
    <TimelineResultsView :spec="spec" id="timeline-form" />

    <!-- Legacy hardcoded this copy in English; it is a shared entry now, with
         the three project links and the contact address written as Markdown
         links inside it. -->
    <I18nText id="timeline-description" class="mwnf-prose" dir="auto" keypath="gallery.timeline.intro" />
  </div>
</template>

<style scoped>
#timeline-page { display: flex; background: #fff; width: 100%; min-height: 400px; }
#timeline-form { width: 40%; padding: 50px; max-width: 350px; }
#timeline-description { width: 60%; padding: 50px 75px 50px 0; line-height: 1.55; }
#timeline-description a { color: var(--link-blue); }

@media only screen and (max-width: 849px) {
  #timeline-page { flex-direction: column; }
  #timeline-form, #timeline-description { width: 100%; max-width: none; padding: 30px; }
}
</style>
