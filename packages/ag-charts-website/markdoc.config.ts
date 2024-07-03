import { isFramework } from '@ag-website-shared/markdoc/functions/isFramework';
import { isNotJavascriptFramework } from '@ag-website-shared/markdoc/functions/isNotJavascriptFramework';
import { heading } from '@ag-website-shared/markdoc/nodes/heading';
import { br } from '@ag-website-shared/markdoc/tags/br';
import { embedSnippet } from '@ag-website-shared/markdoc/tags/embedSnippet';
import { enterpriseIcon } from '@ag-website-shared/markdoc/tags/enterpriseIcon';
import { idea } from '@ag-website-shared/markdoc/tags/idea';
import { image } from '@ag-website-shared/markdoc/tags/image';
import { kbd } from '@ag-website-shared/markdoc/tags/kbd';
import { note } from '@ag-website-shared/markdoc/tags/note';
import { oneTrustCookies } from '@ag-website-shared/markdoc/tags/oneTrustCookies';
import { tabItem, tabs } from '@ag-website-shared/markdoc/tags/tabs';
import { video } from '@ag-website-shared/markdoc/tags/video';
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
        embedSnippet,
        video,
        licenseSetup: {
            render: component('./src/components/license-setup/LicenseSetup.astro'),
        },
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
                gap: {
                    type: String,
                    matches: ['size-6', 'size-10'],
                },
                mobileWrap: {
                    type: Boolean,
                },
            },
        },
        image,
        imageCaptionNew: {
            render: component('./src/components/image/ImageCaption.astro'),
            attributes: {
                /**
                 * Docs page name in `src/content/[pageName]
                 *
                 * If not provided, will default to the location of the markdoc file
                 */
                pageName: { type: String },
                /**
                 * Relative path within markdoc page folder
                 */
                imagePath: { type: String, required: true },
                alt: { type: String, required: true },
                centered: { type: Boolean },
                constrained: { type: Boolean },
                descriptionTop: { type: Boolean },
                width: { type: String },
                height: { type: String },
                minWidth: { type: String },
                maxWidth: { type: String },
                /**
                 * Enable dark mode CSS filter for image
                 *
                 * Alternatively, add `-dark` suffixed image in `imagePath` to add
                 * dark mode image manually
                 */
                enableDarkModeFilter: { type: Boolean },
                /**
                 * Autoplay gif
                 */
                autoPlay: { type: Boolean },
            },
        },
        /**
         * @deprecated Replace with `imageCaptionNew`
         */
        imageCaption: {
            render: component('./src/components/image/ImageCaptionLegacy'),
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
