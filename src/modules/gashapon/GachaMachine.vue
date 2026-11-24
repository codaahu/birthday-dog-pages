<script setup lang="ts">
import type { Ticket } from '../../core/storage/types'
import GachaCast from './GachaCast.vue'
import type { MachinePhase, ShopMood } from './types'

defineProps<{ phase: MachinePhase; tier?: Ticket['rarity']; canPay: boolean; mood: ShopMood }>()
const emit = defineEmits<{ pay: []; open: [] }>()

// 球仓的装饰球，实际奖品只读取已持久化抽取结果
const balls = [
  { x: 204, y: 103, color: '#edd195' }, { x: 152, y: 106, color: '#c7acd6' },
  { x: 117, y: 147, color: '#e7aeb9' }, { x: 172, y: 148, color: '#b0c9d9' },
  { x: 226, y: 146, color: '#d9c2e2' }, { x: 109, y: 197, color: '#b9cfa8' },
  { x: 161, y: 198, color: '#eac58c' }, { x: 214, y: 199, color: '#e2a4ae' },
]
</script>

<template>
  <div class="machine-scene" :class="['phase-' + phase, { golden: tier === 'SSR' }]">
    <svg viewBox="0 0 360 382" role="img" aria-label="有透明球仓、旋钮和出蛋口的手绘扭蛋机">
      <defs>
        <linearGradient id="gacha-wall" x2="0" y2="1"><stop stop-color="#f2e9f4"/><stop offset="1" stop-color="#fbedd6"/></linearGradient>
        <linearGradient id="gacha-case" x2="0" y2="1"><stop stop-color="#f1d995"/><stop offset="1" stop-color="#d6a86b"/></linearGradient>
        <linearGradient id="gacha-glass" x2=".4" y2="1"><stop stop-color="#fffdf1"/><stop offset="1" stop-color="#e1d6e7"/></linearGradient>
        <radialGradient id="gacha-halo"><stop stop-color="#fff3b5" stop-opacity=".96"/><stop offset="1" stop-color="#f2ba60" stop-opacity="0"/></radialGradient>
        <clipPath id="gacha-chamber"><rect x="83" y="76" width="194" height="155" rx="47"/></clipPath>
      </defs>

      <rect width="360" height="382" fill="url(#gacha-wall)" />
      <path d="M20 305V125a160 96 0 0 1 320 0v180Z" fill="#fff7e5" stroke="#e0cdb1" stroke-width="2" />
      <path d="M33 302V126a147 86 0 0 1 294 0v176" fill="none" stroke="#eadcc7" stroke-width="2" />
      <path d="M0 321q165-13 360 0v61H0Z" fill="#e8c99e" stroke="#c9a473" stroke-width="1.8" />
      <path d="M10 350q26-7 54-7m227 7q25 3 57-2M8 374q90-14 171-12" fill="none" stroke="#be925f" stroke-width="1.5" opacity=".61" />

      <g fill="none" stroke="#d6aa69" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path d="M54 103q2 9 9 11-7 1-9 9-2-7-9-9 7-2 9-11Zm251 5q2 8 8 9-6 1-8 8-2-6-8-8 6-2 8-9ZM39 217v13m-6-6h12m266-29v13m-6-6h12" />
      </g>
      <ellipse cx="180" cy="350" rx="128" ry="14" fill="#a87c56" opacity=".31" />

      <rect x="93" y="28" width="174" height="48" rx="15" fill="#dec8e2" stroke="#977d91" stroke-width="2.3" />
      <path d="M107 38q12-3 39-2m72 0 33 2" fill="none" stroke="#fff2ea" stroke-width="2.5" stroke-linecap="round" />
      <text x="180" y="60" text-anchor="middle" fill="#705269" font-size="14" font-weight="750" letter-spacing="2" font-family="system-ui,sans-serif">LUCKY DOG</text>

      <rect x="73" y="70" width="214" height="166" rx="52" fill="#fff6db" stroke="#9e806b" stroke-width="2.6" />
      <rect x="82" y="77" width="196" height="155" rx="46" fill="url(#gacha-glass)" stroke="#a68b99" stroke-width="1.8" />
      <g clip-path="url(#gacha-chamber)">
        <g class="chamber-balls">
          <g v-for="ball in balls" :key="ball.x + ':' + ball.y" :transform="'translate(' + ball.x + ' ' + ball.y + ')'">
            <circle r="23" fill="#fff4dd" stroke="#977663" stroke-width="1.55" />
            <path d="M-23 0a23 23 0 0 1 46 0Z" :fill="ball.color" stroke="#977663" stroke-width="1.55" />
            <path d="M-14-11q5-5 11-6" stroke="#fff9ec" stroke-width="2.7" fill="none" stroke-linecap="round" opacity=".9" />
          </g>
        </g>
      </g>
      <path d="M94 121q2-24 25-32m7-3 11-4" fill="none" stroke="#fffef7" stroke-width="4" stroke-linecap="round" opacity=".84" />
      <path d="M259 133v32" fill="none" stroke="#fffef7" stroke-width="3" stroke-linecap="round" opacity=".83" />

      <path d="M64 246q0-21 23-22h185q24 0 24 22v81q0 20-16 22H82q-18-1-18-22Z" fill="url(#gacha-case)" stroke="#977356" stroke-width="2.6" />
      <rect x="75" y="235" width="210" height="102" rx="16" fill="#f7e5b1" stroke="#ae8b67" stroke-width="1.8" />
      <path d="M87 245q33-10 59-3m-61 77q3 8 13 9" fill="none" stroke="#fff3cc" stroke-width="3" stroke-linecap="round" />
      <rect x="55" y="339" width="250" height="14" rx="7" fill="#d3ac79" stroke="#947357" stroke-width="2.1" />

      <circle cx="128" cy="278" r="31" fill="#edc797" stroke="#997253" stroke-width="2.3" />
      <circle cx="128" cy="277" r="24" fill="#fff2cf" stroke="#aa8464" stroke-width="1.6" />
      <g class="machine-knob">
        <rect x="108" y="269" width="40" height="16" rx="6" fill="#d8ac76" stroke="#906c50" stroke-width="2.2" />
        <path d="M114 273h22" fill="none" stroke="#f5d5a3" stroke-width="2" stroke-linecap="round" />
      </g>

      <rect x="207" y="251" width="42" height="10" rx="5" fill="#977551" />
      <path d="M213 256h30" stroke="#634c40" stroke-width="2" stroke-linecap="round" />
      <rect x="203" y="282" width="54" height="44" rx="10" fill="#a37d5d" stroke="#8c6c55" stroke-width="2" />
      <rect x="209" y="288" width="42" height="31" rx="7" fill="#735a49" />
      <path d="M213 312q14-7 33-1" fill="none" stroke="#97755d" stroke-width="1.5" />

      <g v-if="phase === 'inserting' || phase === 'rolling'" transform="translate(228 254)">
        <g class="flying-coin">
          <circle r="12" fill="#f4cc71" stroke="#ab7949" stroke-width="2" />
          <path d="M-5 2q5-7 10 0-1 5-5 4-4 1-5-4Zm-1-4h.8m5-3h.8m5 3h.8" fill="#b3824e" stroke="#b3824e" stroke-width="2" stroke-linecap="round" />
        </g>
      </g>

      <g v-if="phase === 'rolling' || phase === 'capsule' || phase === 'opening'" transform="translate(233 336)">
        <g class="result-ball">
          <circle v-if="tier === 'SSR'" r="56" class="egg-halo" fill="url(#gacha-halo)" />
          <path class="shell-top" d="M-22 0a22 22 0 0 1 44 0Z" :fill="tier === 'SSR' ? '#efbf5d' : tier === 'SR' ? '#c7addb' : '#e8acb7'"
            stroke="#967054" stroke-width="2" />
          <path class="shell-bottom" d="M-22 0a22 22 0 0 0 44 0Z" :fill="tier === 'SSR' ? '#ffedb5' : '#fff3dd'"
            stroke="#967054" stroke-width="2" />
          <path class="shell-top" d="M-14-10q4-5 12-6" fill="none" stroke="#fff9e7" stroke-width="2.5" stroke-linecap="round" />
          <path v-if="phase === 'opening'" class="open-light" d="M0-28 5-8 23-13 12 4 25 15 6 12 0 31-6 12-25 15-12 4-23-13-5-8Z"
            :fill="tier === 'SSR' ? '#f8d077' : '#f6dba0'" />
        </g>
      </g>
    </svg>

    <GachaCast :mood="mood" />
    <button v-if="canPay && phase === 'idle'" type="button" class="machine-hit coin-hit" aria-label="投币口" @click="emit('pay')"></button>
    <button v-if="canPay && phase === 'idle'" type="button" class="machine-hit knob-hit" aria-label="转动扭蛋机旋钮" @click="emit('pay')"></button>
    <button v-if="phase === 'capsule'" type="button" class="machine-hit egg-hit" aria-label="打开出蛋口的扭蛋" @click="emit('open')"></button>
  </div>
</template>

<style scoped>
.machine-scene { position: relative; isolation: isolate; aspect-ratio: 360 / 382; overflow: hidden; border: 1px solid #e1ceae; border-radius: 1.15rem 1.28rem .84rem .93rem; box-shadow: 0 .16rem .56rem #98705036; background: #f7ecd9; }
.machine-scene > svg { display: block; width: 100%; height: 100%; }
.machine-hit { position: absolute; z-index: 3; min-width: 44px; min-height: 44px; padding: 0; border: 0; border-radius: 50%; background: transparent; transform: translate(-50%,-50%); -webkit-tap-highlight-color: transparent; }
.machine-hit:active { background: #fff8ce60; }
.coin-hit { left: 63.3%; top: 67%; width: 15%; height: 12%; }
.knob-hit { left: 35.55%; top: 72.7%; width: 17%; height: 16%; }
.egg-hit { left: 64.72%; top: 88%; width: 18%; height: 15%; }
.phase-rolling .machine-knob { transform-origin: center; transform-box: fill-box; animation: turn-knob .55s .08s ease-in-out both; }
.phase-rolling .chamber-balls { transform-origin: center; transform-box: fill-box; animation: shuffle .36s .14s ease-in-out both; }
.phase-inserting .flying-coin, .phase-rolling .flying-coin { animation: coin-flight .36s ease-in both; }
.phase-rolling .result-ball { animation: drop-ball .57s .25s cubic-bezier(.35,.02,.56,1.03) both; }
.phase-capsule .result-ball { animation: egg-ready 1s ease-in-out 2; }
.phase-opening .shell-top { animation: shell-up .43s ease-out both; }
.phase-opening .shell-bottom { animation: shell-down .43s ease-out both; }
.open-light { transform-box: fill-box; transform-origin: center; animation: spark-grow .43s ease-out both; }
.egg-halo { opacity: .88; }
@keyframes turn-knob { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
@keyframes shuffle { 28% { transform: translateY(-7px) rotate(-3deg); } 72% { transform: translateY(1px) rotate(3deg); } }
@keyframes coin-flight { from { opacity: 0; transform: translate(45px,-44px) rotate(-90deg); } 30% { opacity: 1; } to { opacity: 0; transform: translate(0,0) scale(.42); } }
@keyframes drop-ball { 0%, 12% { opacity: 0; transform: translate(-28px,-132px) rotate(-85deg) scale(.66); } 35% { opacity: 1; } 74% { transform: translate(1px,7px) rotate(13deg); } 90% { transform: translateY(-6px); } 100% { transform: none; } }
@keyframes egg-ready { 50% { transform: translateY(-3px); } }
@keyframes shell-up { to { opacity: 0; transform: translate(-18px,-28px) rotate(-17deg); } }
@keyframes shell-down { to { opacity: 0; transform: translate(20px,15px) rotate(12deg); } }
@keyframes spark-grow { from { opacity: 0; transform: scale(.35); } 44% { opacity: 1; } to { opacity: .5; transform: scale(1.8); } }
</style>
