import { boolean, number, optional } from '../../util/validation';
import { AnimationModule, type AnimationModuleOptions } from '../animation';
import type { OptionModule } from '../types';

export const animationModule: OptionModule<AnimationModuleOptions> = {
    type: 'chart-option',
    enterprise: true,
    identifier: 'animation',
    constructor: AnimationModule,
    defaults: {
        enabled: true,
    },
    optionsDefs: {
        enabled: optional(boolean),
        duration: optional(number),
    },
};
