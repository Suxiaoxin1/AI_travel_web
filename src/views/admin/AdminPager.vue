<template>
  <div class="pager">
    <button type="button" :disabled="!hasPrev" @click="$emit('change', page - 1)">上一页</button>
    <label class="pager-jump">
      <span>第</span>
      <input
        type="number"
        min="1"
        :max="totalPages"
        :value="draftPage"
        @input="onInput"
        @keydown.enter.prevent="commit"
        @blur="commit"
      >
      <span>页 / 共 {{ totalPages }} 页</span>
    </label>
    <button type="button" :disabled="!hasNext" @click="$emit('change', page + 1)">下一页</button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  total: { type: Number, required: true },
  size: { type: Number, required: true },
})

const emit = defineEmits(['change'])

const draftPage = ref(String(props.page))

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.size) || 1))
const hasPrev = computed(() => props.page > 1)
const hasNext = computed(() => props.page * props.size < props.total)

watch(
  () => props.page,
  (value) => {
    draftPage.value = String(value)
  },
)

function onInput(event) {
  draftPage.value = event.target.value
}

function commit() {
  const parsed = Number.parseInt(String(draftPage.value).trim(), 10)
  if (!Number.isFinite(parsed)) {
    draftPage.value = String(props.page)
    return
  }
  const next = Math.min(totalPages.value, Math.max(1, parsed))
  draftPage.value = String(next)
  if (next !== props.page) {
    emit('change', next)
  }
}
</script>
