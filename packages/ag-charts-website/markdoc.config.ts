import { defineMarkdocConfig, nodes, component } from '@astrojs/markdoc/config';
import prism from './src/astro/plugins/prism';

export default defineMarkdocConfig({
    extends: [prism()],
    nodes: {
        heading: {
            ...nodes.heading, // Preserve default anchor link generation
            render: component('./src/components/Heading.astro'),
        },
    },
    functions: {
        isFramework: {
            transform(parameters, context) {
                const pageFramework = context.variables?.framework;
                const [framework] = Object.values(parameters);
                return framework === pageFramework;
            },
        },
        isNotJavascriptFramework: {
            transform(_, context) {
                const pageFramework = context.variables?.framework;
                return pageFramework !== 'javascript';
            },
        },
    },
    tags: {
        /**
         * External link that opens in a new tab
         */
        externalLink: {
            render: component('./src/components/ExternalLink.astro'),
            attributes: {
                href: { type: String, required: true },
            },
        },
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
            render: component('./src/components/alert/Note'),
        },
        warning: {
            render: component('./src/components/alert/Warning'),
            attributes: {
                title: { type: String },
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
        jsObjectPropertiesView: {
            render: component('./src/features/api-documentation/components/JsObjectPropertiesView.astro'),
            attributes: {
                interfaceName: { type: String },
                breadcrumbs: { type: String },
                config: { type: String },
            },
        },
    },
});
