export type Dog = 'maltese' | 'golden'
export type MusicScene = 'gentle' | 'play' | 'wish'

export const assets: {
  dogs: Record<Dog, Partial<Record<string, string>>>
  music: Partial<Record<MusicScene, string>>
  sounds: Partial<Record<string, string>>
  room: string | null
} = {
  // 网页版使用已确认可用于本生日网站的角色图
  dogs: {
    maltese: {
      happy: 'assets/dogs/opening/maltese.png',
      'flower-browse': 'assets/dogs/flower-shop/maltese-browse.png',
      'flower-arrange': 'assets/dogs/flower-shop/maltese-arrange.png',
      'flower-wrap': 'assets/dogs/flower-shop/maltese-wrap.png',
      'flower-gift': 'assets/dogs/flower-shop/maltese-gift.png',
      'cake-make': 'assets/dogs/cake-shop/maltese-make.png',
      'cake-ready': 'assets/dogs/cake-shop/maltese-ready.png',
      'cake-wish': 'assets/dogs/cake-shop/maltese-wish.png',
      'cake-cheer': 'assets/dogs/cake-shop/maltese-cheer.png',
      'catch-idle': 'assets/dogs/catch-gifts/maltese-idle.png',
      'catch-play': 'assets/dogs/catch-gifts/maltese-play.png',
      'catch-warn': 'assets/dogs/catch-gifts/maltese-warn.png',
      'catch-result': 'assets/dogs/catch-gifts/maltese-result.png',
      'quiz-host': 'assets/dogs/couple-quiz/maltese-host.png',
      'quiz-think': 'assets/dogs/couple-quiz/maltese-think.png',
      'quiz-play-pair': 'assets/dogs/couple-quiz/pair-play.png',
      'quiz-warm-pair': 'assets/dogs/couple-quiz/pair-warm.png',
      'gacha-idle': 'assets/dogs/gashapon/maltese-idle.png',
      'gacha-open-pair': 'assets/dogs/gashapon/pair-open.png',
      'meeting-run': 'assets/dogs/meeting/maltese-run.png',
      'meeting-wait': 'assets/dogs/meeting/maltese-wait.png',
      'ending-celebrate-pair': 'assets/dogs/ending/pair-celebrate.png',
      'collection-welcome-pair': 'assets/dogs/collection/pair-welcome.png',
    },
    golden: {
      happy: 'assets/dogs/opening/golden.png',
      'flower-browse': 'assets/dogs/flower-shop/golden-browse.png',
      'flower-arrange': 'assets/dogs/flower-shop/golden-arrange.png',
      'flower-wrap': 'assets/dogs/flower-shop/golden-wrap.png',
      'flower-gift': 'assets/dogs/flower-shop/golden-gift.png',
      'cake-make': 'assets/dogs/cake-shop/golden-make.png',
      'cake-ready': 'assets/dogs/cake-shop/golden-ready.png',
      'cake-wish': 'assets/dogs/cake-shop/golden-wish.png',
      'cake-cheer': 'assets/dogs/cake-shop/golden-cheer.png',
      'cake-topper': 'assets/dogs/cake-shop/golden-cheer.png',
      'catch-idle': 'assets/dogs/catch-gifts/golden-idle.png',
      'catch-play': 'assets/dogs/catch-gifts/golden-play.png',
      'catch-warn': 'assets/dogs/catch-gifts/golden-warn.png',
      'catch-result': 'assets/dogs/catch-gifts/golden-result.png',
      'quiz-host': 'assets/dogs/couple-quiz/golden-host.png',
      'quiz-think': 'assets/dogs/couple-quiz/golden-think.png',
      'quiz-result-pair': 'assets/dogs/couple-quiz/pair-result.png',
      'gacha-idle': 'assets/dogs/gashapon/golden-idle.png',
      'gacha-spin-pair': 'assets/dogs/gashapon/pair-spin.png',
      'gacha-ssr-pair': 'assets/dogs/gashapon/pair-ssr.png',
      'meeting-run': 'assets/dogs/meeting/golden-run.png',
      'meeting-wait': 'assets/dogs/meeting/golden-wait.png',
    },
  },
  music: {},
  sounds: {},
  room: 'assets/room/memory-room-scene.webp',
}
