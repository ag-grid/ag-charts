import { AnimationModule, type AnimationModuleOptions } from '../modules/animation';
import type { OptionModule } from '../modules/types';
import { boolean, number, required } from '../util/validation';

export const animationModule: OptionModule<AnimationModuleOptions> = {
    type: 'chart-option',
    enterprise: true,
    identifier: 'animation',
    constructor: AnimationModule,
    defaults: {
        enabled: true,
    },
    optionsDefs: {
        enabled: required(boolean),
        duration: required(number),
    },
};
