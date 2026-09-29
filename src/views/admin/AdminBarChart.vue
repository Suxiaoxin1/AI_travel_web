<template>
  <div class="chart" role="img" :aria-label="ariaLabel">
    <div v-if="!normalized.length" class="chart-empty">暂无数据</div>
    <div v-else class="bars">
      <div v-for="(item, index) in normalized" :key="item.label" class="bar-row">
        <span class="bar-label">{{ item.label }}</span>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{
              width: item.pct + '%',
              background: colors[index % colors.length],
            }"
          />
        </div>
        <span class="bar-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, default: () => [] },
  colors: {
    type: Array,
    default: () => ['#116958', '#3d8f7c', '#a47a2e', '#6f7c77'],
  },
})

const normalized = computed(() => {
  const rows = (props.series || []).map((item) => ({
    label: item.label,
    value: Number(item.value) || 0,
  }))
  const max = Math.max(...rows.map((item) => item.value), 1)
  return rows.map((item) => ({
    ...item,
    pct: Math.round((item.value / max) * 100),
  }))
})

const ariaLabel = computed(() =>
  normalized.value.map((item) => `${item.label} ${item.value}`).join('，') || '空图表',
)
</script>

<style scoped>
.chart {
  min-height: 148px;
}

.chart-empty {
  color: #949b98;
  font-size: 13px;
  padding: 28px 0;
  text-align: center;
}

.bars {
  display: grid;
  gap: 10px;
}

.bar-row {
  display: grid;
  grid-template-columns: 72px 1fr 40px;
  gap: 10px;
  align-items: center;
}

.bar-label {
  font-size: 12px;
  color: #5f6d67;
}

.bar-track {
  height: 10px;
  border-radius: 999px;
  background: transparent;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 0;
  transition: width 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.bar-value {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #173a32;
  text-align: right;
  font-weight: 650;
}

@media (prefers-reduced-motion: reduce) {
  .bar-fill {
    transition: none;
  }
}
</style>
