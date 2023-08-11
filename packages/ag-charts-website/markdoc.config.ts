import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';
import prism from './src/astro/plugins/prism';

export default defineMarkdocConfig({
    extends: [prism()],
    tags: {
        chartExampleRunner: {
            render: component('./src/features/docs/components/DocsExampleRunner.astro'),
            attributes: {
                title: { type: String, required: true },
                name: { type: String, required: true },
                type: { type: String },
                options: { type: String },
            },
        },
    },
});
