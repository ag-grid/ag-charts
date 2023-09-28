import type { _ModuleSupport } from 'ag-charts-community';

import { Background } from './background';
import { BackgroundImage } from './backgroundImage';

export const BackgroundModule: _ModuleSupport.RootModule = {
    type: 'root',
    optionsKey: 'background',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    optionConstructors: {
        'background.image': BackgroundImage,
    },
    instanceConstructor: Background,
};
