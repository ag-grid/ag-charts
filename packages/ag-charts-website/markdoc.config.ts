import { isFramework } from '@ag-website-shared/markdoc/functions/isFramework';
import { isNotJavascriptFramework } from '@ag-website-shared/markdoc/functions/isNotJavascriptFramework';
import { heading } from '@ag-website-shared/markdoc/nodes/heading';
import { br } from '@ag-website-shared/markdoc/tags/br';
import { enterpriseIcon } from '@ag-website-shared/markdoc/tags/enterpriseIcon';
import { idea } from '@ag-website-shared/markdoc/tags/idea';
import { image } from '@ag-website-shared/markdoc/tags/image';
import { kbd } from '@ag-website-shared/markdoc/tags/kbd';
import { note } from '@ag-website-shared/markdoc/tags/note';
import { oneTrustCookies } from '@ag-website-shared/markdoc/tags/oneTrustCookies';
import { tabItem, tabs } from '@ag-website-shared/markdoc/tags/tabs';
import { videoSection } from '@ag-website-shared/markdoc/tags/videoSection';
import { warning } from '@ag-website-shared/markdoc/tags/warning';
import { component, defineMarkdocConfig } from '@astrojs/markdoc/config';

import prism from './plugins/prism';
import { link } from './src/utils/markdoc/tags/link';

export default defineMarkdocConfig({
    extends: [prism()],
    nodes: {
        heading,
        link,
    },
    functions: {
        isFramework,
        isNotJavascriptFramework,
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
        image,
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
        embedSnippet: {
            render: component('./src/components/snippet/EmbedSnippet.astro'),
            attributes: {
                /**
                 * Source file relative to example folder
                 */
                src: { type: String },
                /**
                 * Source file url
                 */
                url: { type: String },
                language: { type: String },
                lineNumbers: { type: Boolean },
            },
        },
    },
});
