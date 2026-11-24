<script setup lang="ts">
import { assets } from '../../config/assets'
import { personal } from '../../config/personal'

defineProps<{ settled: boolean }>()
defineEmits<{ landed: [] }>()

// 正式素材沿用公共配置，开发预览才读取本地参考图
const cast = (['golden', 'maltese'] as const).map((dog) => ({
  dog,
  name: dog === 'golden' ? personal.sender : personal.maltese,
  poses: (['run', 'wait'] as const).map((pose) => {
    const path = assets.dogs[dog]['meeting-' + pose]
      ?? (import.meta.env.DEV ? '__birthday_dev_meeting/' + dog + '-' + pose + '.png' : undefined)
    return { pose, src: path ? import.meta.env.BASE_URL + path : undefined }
  }),
}))
</script>

<template>
  <div class="scene" :class="{ settled }" @animationend.self="$emit('landed')">
    <svg class="landscape" viewBox="0 0 500 354" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="meeting-sky" x1="250" x2="250" y1="0" y2="354" gradientUnits="userSpaceOnUse">
          <stop stop-color="#fff3d8"/><stop offset=".51" stop-color="#fbd8af"/><stop offset="1" stop-color="#ffe6b4"/>
        </linearGradient>
        <linearGradient id="meeting-meadow" x1="250" x2="250" y1="161" y2="354" gradientUnits="userSpaceOnUse">
          <stop stop-color="#e2ddae"/><stop offset="1" stop-color="#aeb982"/>
        </linearGradient>
        <linearGradient id="meeting-wood" x2="0" y2="1">
          <stop stop-color="#f7d4a0"/><stop offset="1" stop-color="#eab584"/>
        </linearGradient>
        <pattern id="meeting-grain" width="8" height="9" patternUnits="userSpaceOnUse">
          <path d="M1 2h.7M5 7h.6" stroke="#a77654" stroke-opacity=".22" stroke-linecap="round"/>
        </pattern>
        <g id="meeting-bloom">
          <path d="M0 18C-1 11 0 4 0 0M0 12q-7-5-9-1 5 5 9 4m0 0q6-8 9-4-3 5-9 6" stroke="#718554" stroke-width="1.35" stroke-linecap="round"/>
          <path d="M0-3c-6-4-8 2-4 4-2 5 3 6 5 2 5 3 8-2 3-4 1-4-3-6-4-2Z" fill="currentColor" stroke="#a66d59" stroke-width=".65"/>
          <circle r="1.55" fill="#ffedbb"/>
        </g>
      </defs>
      <path fill="url(#meeting-sky)" d="M0 0h500v354H0z"/>
      <circle cx="249" cy="151" r="86" fill="#fff0bd" opacity=".49"/>
      <circle cx="249" cy="151" r="66" fill="#fff4c8"/>
      <path d="M94 110q15-11 29-2m234 19q18-9 36-4M163 80q7-5 16-3m154 8q8 2 15 1" stroke="#fff7df" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      <path d="M5 69q12-10 30-2c-1-12 18-16 31-8 9-8 31-1 28 7 19-2 32 4 30 10-40 6-90 8-119-1Zm375 12c17-8 30-10 42-6 1-10 15-11 24-6 10-8 30-4 33 4l21-2v21q-70 4-120-4Z" fill="#fff6df" opacity=".82"/>
      <path d="M0 168q56-71 115-47 56 20 123 74c62-34 119-62 171-65q61-6 91 15v209H0Z" fill="#e5c39b"/>
      <path d="M0 182q71-33 133-13t127 18q120-43 240-28v195H0Z" fill="#c9c196"/>
      <path d="M0 219q42-39 114-32 68 9 122 27 171-47 264-3v143H0Z" fill="url(#meeting-meadow)"/>
      <path d="M263 186c-37 21-103 29-96 50 5 20 87 27 68 49-14 16-90 45-175 69h314c35-25 52-51 18-77-28-22-111-22-139-41-26-17 19-35 30-49Z" fill="#f8d6a3" stroke="#ddb083" stroke-width="2"/>
      <path d="M267 198c-41 16-76 30-61 42 22 20 111 22 132 42 24 23-23 47-74 63" stroke="#fff1c3" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="5 11"/>
      <path d="M1 306q41-22 94-4m336 20q39-21 69-18M18 236q31-18 68-17m337 17q38-5 60 4" stroke="#849861" opacity=".62" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M32 326l-3-8m4 8 4-7m42-43 5-9m-3 9-3-7m360 67 2-10m0 10 6-5m-2-72-3-8m5 8 4-7" stroke="#7e905c" stroke-width="1.5" stroke-linecap="round"/>
      <use href="#meeting-bloom" x="22" y="277" color="#f7be98"/><use href="#meeting-bloom" x="50" y="298" color="#f9db8c"/>
      <use href="#meeting-bloom" x="72" y="314" color="#f3a698"/><use href="#meeting-bloom" x="103" y="282" color="#fff0b6"/>
      <use href="#meeting-bloom" x="432" y="285" color="#f4ac9b"/><use href="#meeting-bloom" x="464" y="308" color="#ffe393"/>
      <use href="#meeting-bloom" x="483" y="270" color="#fff0b6"/><use href="#meeting-bloom" x="402" y="315" color="#f6b19f"/>
      <path fill="url(#meeting-grain)" d="M0 0h500v354H0z" opacity=".51"/>
      <g transform="translate(249 128) rotate(-4)">
        <path d="m-10-5 4 92q10 4 19-1L9-8Z" fill="url(#meeting-wood)" stroke="#9f6846" stroke-width="2.3"/>
        <path d="m-2 34 2 45m6-40 1 23" stroke="#bf8b60" stroke-linecap="round"/>
        <path d="M-104-28q69-2 161-1l2-9 51 27-49 31-2-10q-95 5-163 3-3-19 0-41Z" fill="#b68155" stroke="#9f6846" stroke-width="2.2"/>
        <path d="M-105-33q69-2 161-1l2-9 51 27-49 31-2-10q-95 5-163 3-3-19 0-41Z" fill="url(#meeting-wood)" stroke="#9f6846" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M-97-28 57-29l3-6 40 20M-89 2l142-3" stroke="#fff0c3" stroke-width="1.65" stroke-linecap="round" opacity=".76"/>
        <circle cx="-94" cy="-12" r="2.3" fill="#9f6846"/><circle cx="80" cy="-14" r="2.3" fill="#9f6846"/>
        <text class="road-sign" x="-7" y="-5" text-anchor="middle">下一站：见面</text>
      </g>
    </svg>

    <div v-for="character in cast.filter(({ poses }) => poses.some(({ src }) => src))" :key="character.dog"
      :class="['traveler', character.dog]" role="img"
      :aria-label="character.name">
      <img v-for="{ pose, src } in character.poses" v-show="pose === (settled ? 'wait' : 'run')"
        :key="pose" :src="src" :class="pose" alt="" draggable="false" />
      <svg v-if="character.dog === 'golden'" class="bouquet" viewBox="0 0 60 68" fill="none" aria-hidden="true">
        <path d="m26 60-8-43m12 45 6-44m-9 43 20-35m-23 34L8 28" stroke="#698356" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M22 43Q10 25 7 35q1 8 15 8m11-4q11-12 15-8-3 8-15 8" fill="#8fa164" stroke="#677a4e"/>
        <path d="m10 37 44 2-25 25Z" fill="#ffdda0" stroke="#a87b50" stroke-width="2" stroke-linejoin="round"/>
        <path d="m20 46 10 17 8-18" stroke="#e8ab75" stroke-width="1.6"/>
        <path d="M18 18c-10 7-15-6-6-9-2-9 11-10 13-1 9 0 7 12-2 12-1 6-8 5-5-2Z" fill="#f4a596" stroke="#a96a5e" stroke-width="1.5"/>
        <path d="M36 16c-9 4-11-7-5-10-1-5 9-8 12 0 8-1 9 10 0 11-1 8-10 7-7-1Z" fill="#f5be85" stroke="#a96a5e" stroke-width="1.5"/>
        <path d="M44 26c-7 1-7-7 0-8 3-7 11-4 10 2 6 3 4 10-3 9-3 6-10 3-7-3Zm-36 2c-7 1-8-7-2-9-1-6 9-5 10 0 6 1 6 9 0 10 0 5-8 6-8-1Z" fill="#fff0b2" stroke="#a96a5e" stroke-width="1.5"/>
        <path d="M31 52q-15-9-13-2t13 2q14-9 14-3t-14 3Z" fill="#e9897b" stroke="#a96a5e" stroke-width="1.4"/>
        <circle cx="20" cy="12" r="3" fill="#ffeab1"/><circle cx="38" cy="10" r="3" fill="#fff1ae"/>
      </svg>
    </div>
    <svg class="heart" viewBox="0 0 36 34" aria-hidden="true">
      <path d="M18 29C14 24 2 18 5 10 7 4 15 4 18 10 22 2 31 4 32 11 34 17 22 27 18 29Z" fill="#f6afa0"
        stroke="#b97160" stroke-width="1.7" stroke-linejoin="round"/>
    </svg>
  </div>
</template>

<style scoped>
.scene { position: relative; aspect-ratio: 500 / 354; isolation: isolate; overflow: hidden; background: #ffeac4;
  border: 2px solid #c9976f; border-radius: 48% 48% 1.6rem 1.6rem / 14% 14% 1.6rem 1.6rem;
  box-shadow: 0 0 0 .32rem #fff2d9, 0 .62rem .7rem #a8734d28; animation: scene-duration 2.45s both; }
.scene.settled { animation: none; }
.landscape { display: block; width: 100%; height: 100%; }
.road-sign { fill: #74472f; font: 800 24px var(--font-heading, sans-serif); letter-spacing: 1px; }
.traveler { --travel: -220%; --lean: -9deg; position: absolute; width: 42%; height: 55%; bottom: 2%;
  animation: travel 2.42s cubic-bezier(.2,.64,.34,1) both; }
.traveler.golden { left: 17%; }
.traveler.maltese { --travel: 220%; --lean: 9deg; right: 11%; }
.traveler img { display: block; position: absolute; width: 100%; height: 100%; object-fit: contain;
  filter: drop-shadow(0 .14rem .09rem #5a493742); animation: bound .44s ease-in-out 5; }
.traveler img:not([src]) { display: none; }
.traveler.maltese .run { transform: scaleX(-1); }
.traveler.golden .wait { transform: scale(1.13); }
.bouquet { position: absolute; width: 27%; height: 37%; right: 17%; bottom: 22%; transform: rotate(14deg);
  filter: drop-shadow(0 .09rem .08rem #5a493743); }
.heart { position: absolute; left: 53%; bottom: 34%; width: 6%; transform: translateX(-50%) rotate(-9deg); opacity: 0; }
.settled .heart { animation: heart-in .36s ease-out both; }
.settled .traveler, .settled .traveler img { animation: none; }
@keyframes scene-duration { from { opacity: .98; } to { opacity: 1; } }
@keyframes travel { 0% { transform: translateX(var(--travel)) rotate(var(--lean)); } 83% { transform: translateX(2%); } 100% { transform: translateX(0); } }
@keyframes bound { 50% { translate: 0 -.48rem; } }
@keyframes heart-in { 0% { opacity: 0; scale: .5; } 100% { opacity: 1; scale: 1; } }
@media (prefers-reduced-motion: reduce) {
  .scene, .traveler, .traveler img, .settled .heart { animation: none; }
  .settled .heart { opacity: 1; }
}
</style>
