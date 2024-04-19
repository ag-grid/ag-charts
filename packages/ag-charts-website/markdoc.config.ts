import { br } from '@ag-website-shared/markdoc/tags/br';
import { enterpriseIcon } from '@ag-website-shared/markdoc/tags/enterpriseIcon';
import { idea } from '@ag-website-shared/markdoc/tags/idea';
import { kbd } from '@ag-website-shared/markdoc/tags/kbd';
import { note } from '@ag-website-shared/markdoc/tags/note';
import { oneTrustCookies } from '@ag-website-shared/markdoc/tags/oneTrustCookies';
import { tabItem, tabs } from '@ag-website-shared/markdoc/tags/tabs';
import { videoSection } from '@ag-website-shared/markdoc/tags/videoSection';
import { warning } from '@ag-website-shared/markdoc/tags/warning';
import { component, defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';

import prism from './plugins/prism';
import { link } from './src/utils/markdoc/tags/link';

export default defineMarkdocConfig({
    extends: [prism()],
    nodes: {
        heading: {
            ...nodes.heading, // Preserve default anchor link generation
            render: component('./src/components/Heading.astro'),
        },
        link,
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
        kbd,
        link,
        oneTrustCookies,
        tabs,
        tabItem,
        videoSection,
        br,
        note,
        warning,
        idea,
        enterpriseIcon,
        chartExampleRunner: {
            render: component('./src/features/docs/components/DocsExampleRunner.astro'),
            attributes: {
                title: { type: String, required: true },
                name: { type: String, required: true },
                type: { type: String },
                options: { type: Object },
            },
        },
        featureComparator: {
            render: component('./src/components/featureComparator/FeatureComparator.astro'),
        },
        image: {
            render: component('./src/components/image/Image.astro'),
            attributes: {
                /**
                 * Docs page name in `src/content/[pageName]
                 *
                 * If not provided, will default to the location of the markdoc file
                 */
                pageName: { type: String },
                imagePath: { type: String, required: true },
                alt: { type: String, required: true },
                width: { type: String },
                height: { type: String },
                minWidth: { type: String },
                maxWidth: { type: String },
                margin: { type: String },
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
                filterDarkmode: { type: Boolean },
            },
        },
        apiReference: {
            render: component('./src/features/api-documentation/ApiReference.astro'),
            attributes: {
                id: { type: 'String' },
                include: { type: 'Array' },
                exclude: { type: 'Array' },
                prioritise: { type: 'Array' },
                hideHeader: { type: 'Boolean' },
                hideRequired: { type: 'Boolean' },
                specialTypes: { type: 'Object' },
            },
        },
    },
});
