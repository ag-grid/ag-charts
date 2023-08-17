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
        note: {
            render: component('./src/components/Note'),
            attributes: {
                disableMarkdown: { type: Boolean },
            },
        },
        imageCaption: {
            render: component('./src/components/image/ImageCaption'),
            attributes: {
                pageName: { type: String, required: true },
                imageName: { type: String, required: true },
                alt: { type: String, required: true },
                centered: { type: Boolean },
                constrained: { type: Boolean },
                descriptionTop: { type: Boolean },
                width: { type: String },
                height: { type: String },
                minWidth: { type: String },
                maxWidth: { type: String },
            },
        },
        flex: {
            render: component('./src/components/flex/Flex.astro'),
            attributes: {
                direction: { type: String, matches: ['row', 'column'] },
                alignItems: {
                    type: String,
                    matches: ['center', 'start', 'end', 'self-start', 'self-end', 'flex-start', 'flex-end'],
                },
                justifyContent: {
                    type: String,
                    matches: ['center', 'start', 'end', 'self-start', 'self-end', 'flex-start', 'flex-end'],
                },
            },
        },
        apiDocumentation: {
            render: component('./src/features/api-documentation/components/ApiDocumentation.astro'),
            attributes: {
                interfaceName: { type: String },
                framework: { type: String },
                overrideSrc: { type: String },
                section: { type: String },
                names: { type: String },
                exclude: { type: String },
                wrapNamesAt: { type: String },
                config: { type: String },
            },
        },
        interfaceDocumentation: {
            render: component('./src/features/api-documentation/components/InterfaceDocumentation.astro'),
            attributes: {
                interfaceName: { type: String },
                framework: { type: String },
                names: { type: String },
                exclude: { type: String },
                wrapNamesAt: { type: String },
                config: { type: String },
            },
        },
    },
});
