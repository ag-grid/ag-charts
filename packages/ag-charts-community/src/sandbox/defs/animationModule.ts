import { boolean, number } from '../../util/validate';
import { AnimationModule, type AnimationModuleOptions } from '../modules/animation';
import type { OptionModule } from '../modules/modulesTypes';

export const animationModule: OptionModule<AnimationModuleOptions> = {
    type: 'chart-option',
    enterprise: true,
    identifier: 'animation',
    constructor: AnimationModule,
    defaults: {
        enabled: true,
    },
    optionsDefs: {
        enabled: boolean,
        duration: number,
    },
};
