import type { ModuleId } from '../../config/storyFlow'
import type { ModuleDefinition } from './contract'
import { config as config0 } from '../../modules/opening/config'
import module0 from '../../modules/opening/Module.vue'
import { config as config1 } from '../../modules/memory-room/config'
import module1 from '../../modules/memory-room/Module.vue'
import { config as config2 } from '../../modules/flower-shop/config'
import module2 from '../../modules/flower-shop/Module.vue'
import { config as config3 } from '../../modules/cake-shop/config'
import module3 from '../../modules/cake-shop/Module.vue'
import { config as config4 } from '../../modules/catch-gifts/config'
import module4 from '../../modules/catch-gifts/Module.vue'
import { config as config5 } from '../../modules/couple-quiz/config'
import module5 from '../../modules/couple-quiz/Module.vue'
import { config as config6 } from '../../modules/gashapon/config'
import module6 from '../../modules/gashapon/Module.vue'
import { config as config7 } from '../../modules/meeting/config'
import module7 from '../../modules/meeting/Module.vue'
import { config as config8 } from '../../modules/ending/config'
import module8 from '../../modules/ending/Module.vue'
import { config as config9 } from '../../modules/collection/config'
import module9 from '../../modules/collection/Module.vue'

export const modules = {
  'opening': { config: config0, component: module0 },
  'memory-room': { config: config1, component: module1 },
  'flower-shop': { config: config2, component: module2 },
  'cake-shop': { config: config3, component: module3 },
  'catch-gifts': { config: config4, component: module4 },
  'couple-quiz': { config: config5, component: module5 },
  'gashapon': { config: config6, component: module6 },
  'meeting': { config: config7, component: module7 },
  'ending': { config: config8, component: module8 },
  'collection': { config: config9, component: module9 },
} satisfies Record<ModuleId, ModuleDefinition>
