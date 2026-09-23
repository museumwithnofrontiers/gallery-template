<script setup>
import { BackLink, RecordLanguages } from '@museumwnf/viewer-layout/content'
import { RecordSheetView } from '@museumwnf/viewer-layout/views'
import { itemSheet } from '../composables/gallery.js'

// The gallery shape (inventory-app#1728): no `dataGetter`, since __DATASET__
// ships every item it lists in one build. `composables/gallery.js`'s
// `itemSheet` spec carries every block `RecordSheetView` renders; the one
// slot no DXA gallery/exhibition shares is the header — a language switcher
// and a back link, no title of its own, as legacy's was.

defineProps({ id: { type: String, required: true } })
</script>

<template>
  <RecordSheetView :spec="itemSheet" :id="id" class="database-page">
    <template #header="{ languages, language, select }">
      <div class="languages">
        <RecordLanguages :languages="languages" :language="language" @select="select" />
      </div>
      <BackLink />
    </template>
  </RecordSheetView>
</template>
