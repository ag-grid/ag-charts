import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
    tags: {
        chartExampleRunner: {
            render: component('./src/features/example-runner/ExampleRunner.astro'),
            attributes: {
                title: { type: String, required: true },
                name: { type: String, required: true },
                type: { type: String },
                options: { type: String },
            },
        },
    },
});
