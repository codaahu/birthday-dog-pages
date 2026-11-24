<script setup lang="ts">
defineProps<{ unsealing: boolean; small?: boolean }>()
</script>

<template>
  <svg class="envelope" :class="{ 'is-unsealing': unsealing, 'envelope-small': small }"
    viewBox="0 0 350 220" aria-hidden="true" focusable="false">
    <ellipse class="cast-shadow" cx="176" cy="184" rx="117" ry="12" fill="#997749" opacity=".18" />
    <g transform="rotate(-6 176 114)" stroke-linecap="round" stroke-linejoin="round">
      <rect x="55" y="49" width="240" height="128" rx="10" fill="#b99260" opacity=".29" transform="translate(2 5)" />
      <rect x="53" y="48" width="242" height="128" rx="10" fill="#eed3a1" stroke="#674e37" stroke-width="2.8" />
      <path d="M56 56 173 139 292 56" fill="#dfbd87" stroke="#a58156" stroke-width="1.6" />

      <g class="letter">
        <rect x="91" y="72" width="168" height="101" rx="7" fill="#fffbec" stroke="#947650" stroke-width="2" />
        <path d="M99 145h151m-151 10h151m-151 10h151" stroke="#e6d6b6" stroke-width="1.1" />
        <path d="M122 101c-8-12-23 4 0 18 23-14 8-30 0-18Z" fill="#dfa3a6" stroke="#b9797e" stroke-width="1.2" />
        <path d="M150 107h83m-83 12h66" stroke="#d8ba86" stroke-width="1.8" />
      </g>

      <path d="M53 62 173 127 295 61v104q0 11-11 11H64q-11 0-11-11Z" fill="#f2dbaf" stroke="#674e37" stroke-width="2.6" />
      <path d="m59 169 106-69m124 68-108-68" fill="none" stroke="#aa8960" stroke-width="1.75" />
      <path d="M63 172h220" fill="none" stroke="#fff1d3" stroke-width="1.5" />
      <path class="flap" d="M56 53q3-5 8-5h220q5 0 8 5L177 131q-4 3-8 0Z"
        fill="#fae8c8" stroke="#674e37" stroke-width="2.55" />
      <path class="flap stroke" d="M68 53h211" fill="none" stroke="#fff3dc" stroke-width="1.9" />

      <g class="seal">
        <path d="M195 128c0 12-10 20-22 20-11 0-21-8-21-20 0-11 10-20 22-20s21 9 21 20Z"
          fill="#dfa0a5" stroke="#9e676a" stroke-width="2.15" />
        <path d="M173 123c-6-8-17 2 0 12 17-10 6-20 0-12Z" fill="#fff3dc" />
        <path d="M158 123q2-5 8-8" fill="none" stroke="#f0bcb9" stroke-width="1.6" />
      </g>
      <text x="174" y="160" fill="#775c45" text-anchor="middle" font-family="Georgia, serif"
        font-size="12.2" letter-spacing="2">TO MY LOVE</text>

      <g fill="none" stroke="#b59163" stroke-width="1.3" opacity=".7">
        <path d="M269 61h15m-16 4h15m-15 4h13" />
        <path d="m71 152 5 3-3-5m-3 12 7-1" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.envelope { display: block; width: 100%; height: auto; overflow: visible; }
.letter { transform: translateY(0); }
.flap { transform-box: view-box; transform-origin: 173px 49px; }
.seal { transform-box: fill-box; transform-origin: center; }
.is-unsealing .seal { animation: break-seal 1.55s ease-out both; }
.is-unsealing .flap { animation: open-flap 1.55s ease-in-out both; }
.is-unsealing .letter { animation: draw-letter 1.55s cubic-bezier(.18,.75,.24,1) both; }
.envelope-small .letter { transform: translateY(-63px) rotate(-3deg); }
.envelope-small .flap { transform: scaleY(-.38); }
.envelope-small .seal { opacity: 0; }
@keyframes break-seal {
  0% { transform: scale(1); opacity: 1; }
  13% { transform: scale(1.14) rotate(6deg); opacity: 1; }
  30%, 100% { transform: translateY(10px) scale(.4) rotate(22deg); opacity: 0; }
}
@keyframes open-flap {
  0%, 17% { transform: scaleY(1); }
  48%, 100% { transform: scaleY(-.42); }
}
@keyframes draw-letter {
  0%, 18% { transform: translateY(0); }
  65% { transform: translateY(-84px) rotate(-2deg); }
  100% { transform: translateY(-69px) rotate(-2deg); }
}
</style>
