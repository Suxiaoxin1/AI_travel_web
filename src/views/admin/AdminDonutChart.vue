<template>
  <div class="donut-wrap" role="img" :aria-label="ariaLabel">
    <div v-if="!slices.length" class="chart-empty">暂无数据</div>
    <template v-else>
      <svg viewBox="0 0 120 120" class="donut" aria-hidden="true">
        <circle cx="60" cy="60" r="42" class="donut-track" />
        <circle
          v-for="(slice, index) in slices"
          :key="slice.label"
          cx="60"
          cy="60"
          r="42"
          class="donut-slice"
          :stroke="colors[index % colors.length]"
          :stroke-dasharray="`${slice.length} ${circumference - slice.length}`"
          :stroke-dashoffset="slice.offset"
        />
        <text x="60" y="58" text-anchor="middle" class="donut-total">{{ total }}</text>
        <text x="60" y="74" text-anchor="middle" class="donut-caption">合计</text>
      </svg>
      <ul class="donut-legend">
        <li v-for="(slice, index) in slices" :key="slice.label">
          <i :style="{ background: colors[index % colors.length] }" />
          <span>{{ slice.label }}</span>
          <strong>{{ slice.value }}</strong>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, default: () => [] },
  colors: {
    type: Array,
    default: () => ['#116958', '#bc5449'],
  },
})

const circumference = 2 * Math.PI * 42

const total = computed(() =>
  (props.series || []).reduce((sum, item) => sum + (Number(item.value) || 0), 0),
)

const slices = computed(() => {
  const rows = (props.series || []).map((item) => ({
    label: item.label,
    value: Number(item.value) || 0,
  }))
  const sum = rows.reduce((acc, item) => acc + item.value, 0) || 1
  let cursor = 0
  return rows.map((item) => {
    const length = (item.value / sum) * circumference
    const offset = circumference * 0.25 - cursor
    cursor += length
    return { ...item, length, offset }
  })
})

const ariaLabel = computed(() =>
  slices.value.map((item) => `${item.label} ${item.value}`).join('，') || '空图表',
)
</script>

<style scoped>
.donut-wrap {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 16px;
  align-items: center;
  min-height: 148px;
}

.donut {
  width: 140px;
  height: 140px;
  transform: rotate(-90deg);
}

.donut-track {
  fill: none;
  stroke: #ece7dc;
  stroke-width: 14;
}

.donut-slice {
  fill: none;
  stroke-width: 14;
  stroke-linecap: butt;
  transition: stroke-dasharray 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.donut text {
  transform: rotate(90deg);
  transform-origin: 60px 60px;
}

.donut-total {
  font-size: 18px;
  font-weight: 750;
  fill: #173a32;
}

.donut-caption {
  font-size: 10px;
  fill: #7b8580;
}

.donut-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.donut-legend li {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #5f6d67;
}

.donut-legend i {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.donut-legend strong {
  font-variant-numeric: tabular-nums;
  color: #173a32;
}

.chart-empty {
  grid-column: 1 / -1;
  color: #949b98;
  font-size: 13px;
  padding: 28px 0;
  text-align: center;
}

@media (max-width: 560px) {
  .donut-wrap {
    grid-template-columns: 1fr;
    justify-items: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .donut-slice {
    transition: none;
  }
}
</style>
