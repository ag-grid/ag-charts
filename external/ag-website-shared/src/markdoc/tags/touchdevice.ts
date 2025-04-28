import { component } from '@astrojs/markdoc/config';
import type { Render } from '@astrojs/markdoc/config';
import type { Config, Schema } from '@markdoc/markdoc';

export const touchDevice: Schema<Config, Render> = {
    render: component('../../external/ag-website-shared/src/components/touch-device/TouchDevice.astro'),
    attributes: {
        title: { type: String },
        playlist: { type: String },
        videoPath: { type: String },
    },
};
