import { describe, expect, it } from 'vitest';

import { _Scene, _Theme, _Util } from './integrated-charts';
import * as scene from './integrated-charts-scene';
import * as theme from './integrated-charts-theme';
import * as util from './integrated-charts-util';

describe('Integrated Charts exports', () => {
    it.each([
        ['_Scene', _Scene, scene],
        ['_Theme', _Theme, theme],
        ['_Util', _Util, util],
    ])('%s exposes every export of its entry module', (_name, exported, module) => {
        expect(new Set(Object.keys(exported))).toEqual(new Set(Object.keys(module)));
    });
});
