<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ticket } from '../../core/storage/types'
import { ticketCopy, ticketDate, ticketStatus } from './tickets'

const props = defineProps<{ ticket: Ticket; now: number }>()
const artwork = ref<SVGSVGElement>()
const copy = computed(() => ticketCopy(props.ticket.type))
const status = computed(() => ticketStatus(props.ticket, props.now))
const colors = {
  R: { paper: '#fff2e4', band: '#ecd0c9', ink: '#98636a', rim: '#cca292' },
  SR: { paper: '#f7f1fb', band: '#ddd0e6', ink: '#745c8a', rim: '#ab93b9' },
  SSR: { paper: '#fff1c7', band: '#f7d98d', ink: '#996638', rim: '#c99b58' },
}
const shade = computed(() => colors[props.ticket.rarity])
defineExpose({ artwork })
</script>

<template>
  <svg ref="artwork" class="ticket-art" viewBox="0 0 386 238" role="img" :aria-label="copy.name + ' · ' + status">
    <rect x="3" y="4" width="380" height="229" rx="17" :fill="shade.paper" :stroke="shade.rim" stroke-width="2.6" />
    <rect x="12" y="13" width="362" height="211" rx="12" fill="none" :stroke="shade.rim" stroke-width="1.3" stroke-dasharray="4 4" />
    <path d="M26 180h334m-334 2h334" :stroke="shade.rim" stroke-width="1.15" stroke-dasharray="4 4" opacity=".62" />

    <g :stroke="shade.ink" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round">
      <path d="M34 53q2 7 8 8-6 1-8 8-2-6-8-8 6-1 8-8Zm319 21q2 6 8 8-6 1-8 8-2-6-8-8 6-1 8-8Z" opacity=".78" />
      <path d="M44 141v11m-5-5h10m295-21v11m-5-5h10" opacity=".67" />
      <path v-if="ticket.rarity === 'SSR'" d="M27 96q39-28 74-40m245 41q-22-19-53-30M102 141q10 10 24 11m137-9q-10 11-22 14" opacity=".44" />
    </g>

    <rect x="150" y="29" width="86" height="31" rx="14" :fill="shade.band" :stroke="shade.rim" stroke-width="1.4" />
    <text x="193" y="51" text-anchor="middle" font-size="18" font-family="sans-serif" font-weight="800" :fill="shade.ink"
      letter-spacing="1.8">{{ ticket.rarity }}</text>

    <text x="193" y="108" text-anchor="middle" font-size="28" font-weight="700"
      font-family="'Kaiti SC', STKaiti, KaiTi, serif" fill="#614631">{{ copy.name }}</text>
    <text x="193" y="144" text-anchor="middle" font-size="14"
      font-family="'Microsoft YaHei','Noto Sans CJK SC',sans-serif" fill="#745540">{{ copy.description }}</text>

    <g v-if="status !== '可兑现'" transform="translate(322 159) rotate(-10)">
      <rect x="-35" y="-12" width="70" height="24" rx="4.5" :fill="shade.paper" stroke="#a15c5a" stroke-width="1.5" />
      <text y="4.5" text-anchor="middle" font-size="13" font-weight="700" font-family="sans-serif" fill="#a15c5a">{{ status }}</text>
    </g>

    <text x="25" y="199" font-family="sans-serif" font-size="10.5" fill="#745b47">小狗扭蛋铺</text>
    <text x="361" y="199" text-anchor="end" font-family="sans-serif" font-size="10.5" fill="#745b47">{{ ticket.id.slice(-8).toUpperCase() }}</text>
    <text v-if="ticket.validUntil" x="193" y="218" text-anchor="middle" font-family="sans-serif" font-size="10.4" fill="#745b47">
      有效至 {{ ticketDate(ticket.validUntil) }}（北京时间）
    </text>
  </svg>
</template>

<style scoped>
.ticket-art { display: block; width: 100%; height: auto; }
</style>
