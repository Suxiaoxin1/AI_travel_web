<template>
  <section class="page-hero" :class="`theme-${theme}`">
    <div class="hero-copy">
      <p class="hero-eyebrow"><span class="eyebrow-mark"></span>{{ eyebrow }}</p>
      <h1 class="hero-title">{{ title }}</h1>
      <p class="hero-description">{{ description }}</p>
      <div class="hero-actions">
        <router-link v-if="primaryTo.startsWith('/')" class="hero-action" :to="primaryTo">
          {{ primaryLabel }} <span aria-hidden="true">↗</span>
        </router-link>
        <a v-else class="hero-action" :href="primaryTo" @click="handlePrimaryClick">
          {{ primaryLabel }} <span aria-hidden="true">↘</span>
        </a>
        <span class="hero-note">{{ note }}</span>
      </div>
    </div>

    <div class="hero-orbit" aria-hidden="true">
      <span class="orbit-ring ring-one"></span>
      <span class="orbit-ring ring-two"></span>
      <span class="orbit-dot dot-one"></span>
      <span class="orbit-dot dot-two"></span>
      <span class="hero-glyph">✦</span>
      <span class="hero-index">{{ theme === 'journal' ? '04' : theme === 'share' ? '03' : theme === 'routes' ? '02' : '01' }}</span>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  primaryLabel: { type: String, required: true },
  primaryTo: { type: String, required: true },
  note: { type: String, default: '' },
  theme: { type: String, default: 'default' }
})
const emit = defineEmits(['action'])

function handlePrimaryClick(event) {
  if (!props.primaryTo.startsWith('#')) return
  event.preventDefault()
  document.querySelector(props.primaryTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  emit('action')
}
</script>

<style scoped>
.page-hero {
  --hero-accent: #d4a84b;
  --hero-ink: #f8fbf6;
  position: relative; isolation: isolate; overflow: hidden;
  display: flex; align-items: center; justify-content: space-between;
  min-height: 245px; padding: 42px 56px; margin-bottom: 30px;
  border-radius: 28px; color: var(--hero-ink);
  background: linear-gradient(120deg, #063932 0%, #0c5148 62%, #3c8878 100%);
  box-shadow: 0 22px 44px rgba(12, 81, 72, .18);
}
.page-hero::before {
  content: ''; position: absolute; inset: 0; z-index: -2; opacity: .35;
  background-image: radial-gradient(rgba(255,255,255,.24) 1px, transparent 1px);
  background-size: 28px 28px; mask-image: linear-gradient(90deg, #000, transparent 82%);
}
.page-hero::after {
  content: ''; position: absolute; width: 420px; height: 420px; right: -100px; top: -150px;
  z-index: -1; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.22), transparent 66%);
}
.theme-routes { --hero-accent: #f0bf49; background: linear-gradient(120deg, #142d35, #1e5961 68%, #76a5a0); }
.theme-share { --hero-accent: #f2bd69; background: linear-gradient(120deg, #213b38, #276b60 64%, #c69a63); }
.theme-journal { --hero-accent: #edb65f; background: linear-gradient(120deg, #3b2e33, #6d514a 62%, #bd9871); }
.theme-preference { --hero-accent: #f0c45d; background: linear-gradient(120deg, #132f3c, #2f6377 62%, #8eb8b0); }
.hero-copy { position: relative; z-index: 2; max-width: 690px; }
.hero-eyebrow { display: flex; align-items: center; gap: 11px; margin-bottom: 14px; color: rgba(248,251,246,.76); font-size: 11px; font-weight: 800; letter-spacing: .16em; }
.eyebrow-mark { width: 31px; height: 2px; border-radius: 99px; background: var(--hero-accent); box-shadow: 0 0 12px rgba(212,168,75,.5); }
.hero-title { max-width: 650px; margin: 0 0 12px; color: #fff; font-family: Georgia, 'Noto Serif SC', serif; font-size: clamp(30px, 4vw, 52px); line-height: 1.12; letter-spacing: .02em; }
.hero-description { max-width: 600px; color: rgba(248,251,246,.76); font-size: 15px; line-height: 1.8; }
.hero-actions { display: flex; align-items: center; gap: 18px; margin-top: 24px; }
.hero-action { display: inline-flex; align-items: center; gap: 14px; padding: 12px 18px; border-radius: 999px; color: #173d35; background: var(--hero-accent); font-size: 14px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 22px rgba(0,0,0,.15); transition: transform .25s ease, box-shadow .25s ease; }
.hero-action:hover { transform: translateY(-2px); box-shadow: 0 14px 26px rgba(0,0,0,.22); }
.hero-action span { font-size: 18px; line-height: 1; }
.hero-note { color: rgba(248,251,246,.62); font-size: 12px; }
.hero-orbit { position: relative; flex: 0 0 245px; width: 245px; height: 170px; margin-right: 6%; }
.orbit-ring { position: absolute; border: 1px solid rgba(255,255,255,.25); border-radius: 50%; transform: rotate(-24deg); }
.ring-one { inset: 9px -2px 21px 2px; }
.ring-two { inset: 27px 21px 5px -18px; transform: rotate(30deg); }
.orbit-dot { position: absolute; width: 8px; height: 8px; border-radius: 50%; background: var(--hero-accent); box-shadow: 0 0 0 7px rgba(255,255,255,.1), 0 0 18px var(--hero-accent); }
.dot-one { top: 23px; right: 23px; }
.dot-two { bottom: 18px; left: 29px; background: #a8dfd0; }
.hero-glyph { position: absolute; inset: 0; display: grid; place-items: center; color: var(--hero-accent); font-size: 68px; text-shadow: 0 0 30px rgba(255,255,255,.28); animation: hero-float 5s ease-in-out infinite; }
.hero-index { position: absolute; right: 20px; bottom: 5px; color: rgba(255,255,255,.48); font-size: 12px; font-weight: 800; letter-spacing: .12em; }
@keyframes hero-float { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-7px) rotate(5deg); } }
@media (max-width: 760px) {
  .page-hero { min-height: 290px; padding: 30px 24px; border-radius: 22px; }
  .hero-title { font-size: 34px; }
  .hero-description { font-size: 14px; }
  .hero-actions { align-items: flex-start; flex-direction: column; gap: 10px; margin-top: 20px; }
  .hero-orbit { position: absolute; right: -48px; bottom: 8px; width: 190px; height: 135px; opacity: .58; transform: scale(.75); transform-origin: right bottom; }
}
@media (prefers-reduced-motion: reduce) { .hero-glyph, .hero-action { animation: none; transition: none; } }
</style>
