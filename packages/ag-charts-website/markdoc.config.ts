import { isFramework } from '@ag-website-shared/markdoc/functions/isFramework';
import { isNotJavascriptFramework } from '@ag-website-shared/markdoc/functions/isNotJavascriptFramework';
import { getMigrationVersionPatch, migrationVersion } from '@ag-website-shared/markdoc/functions/migrationVersion';
import { heading } from '@ag-website-shared/markdoc/nodes/heading';
import { br } from '@ag-website-shared/markdoc/tags/br';
import { embedSnippet } from '@ag-website-shared/markdoc/tags/embedSnippet';
import { enterpriseIcon } from '@ag-website-shared/markdoc/tags/enterpriseIcon';
import { expandingSection } from '@ag-website-shared/markdoc/tags/expandingSection';
import { featuresSection } from '@ag-website-shared/markdoc/tags/featuresSection';
import { getChangelogSection } from '@ag-website-shared/markdoc/tags/getChangelogSection';
import { getDocumentationArchiveSection } from '@ag-website-shared/markdoc/tags/getDocumentationArchiveSection';
import { gettingStarted } from '@ag-website-shared/markdoc/tags/getting-started';
import { idea } from '@ag-website-shared/markdoc/tags/idea';
import { image } from '@ag-website-shared/markdoc/tags/image';
import { imageCaption } from '@ag-website-shared/markdoc/tags/imageCaption';
import { kbd } from '@ag-website-shared/markdoc/tags/kbd';
import { majorTable } from '@ag-website-shared/markdoc/tags/majorTable';
import { note } from '@ag-website-shared/markdoc/tags/note';
import { oneTrustCookies } from '@ag-website-shared/markdoc/tags/oneTrustCookies';
import { tabItem, tabs } from '@ag-website-shared/markdoc/tags/tabs';
import { touchImage } from '@ag-website-shared/markdoc/tags/touchimage';
import { trialLicenceForm } from '@ag-website-shared/markdoc/tags/trialLicenceForm';
import { video } from '@ag-website-shared/markdoc/tags/video';
import { videoSection } from '@ag-website-shared/markdoc/tags/videoSection';
import { warning } from '@ag-website-shared/markdoc/tags/warning';
import { component, defineMarkdocConfig } from '@astrojs/markdoc/config';
import {
    chartsVersion,
    chartsVersionPatch,
    gridVersion,
    gridVersionPatch,
} from '@utils/markdoc/functions/libraryVersions';

import prism from './plugins/prism';
import versionsData from './src/content/versions/ag-charts-versions.json';
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
        migrationVersion,
        migrationVersionPatch: getMigrationVersionPatch(versionsData),
        gridVersion,
        gridVersionPatch,
        chartsVersion,
        chartsVersionPatch,
    },
    tags: {
        kbd,
        link,
        oneTrustCookies,
        tabs,
        tabItem,
        videoSection,
        touchImage,
        br,
        note,
        warning,
        idea,
        expandingSection,
        documentationArchiveSection: getDocumentationArchiveSection('charts'),
        changelogSection: getChangelogSection('charts'),
        trialLicenceForm,
        enterpriseIcon,
        embedSnippet,
        video,
        gettingStarted,
        featuresSection,
        licenseSetup: {
            render: component('./src/components/license-setup/LicenseSetup.astro'),
        },
        chartExampleRunner: {
            render: component('./src/components/docs/components/DocsExampleRunner.astro'),
            attributes: {
                title: { type: String, required: true },
                name: { type: String, required: true },
                type: { type: String },
                isInline: { type: Boolean, default: true },
                initialLoadDeferred: { type: Boolean, default: false },
                options: { type: Object },
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
        imageCaption,
        apiReference: {
            render: component('./src/components/api-documentation/ApiReference.astro'),
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
        moduleMappings: {
            render: component('./src/components/module-mappings/ModuleMappings.astro'),
        },
        majorTable,
    },
});
