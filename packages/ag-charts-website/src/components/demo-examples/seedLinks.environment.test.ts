import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { SeedManifestEntry } from './seedLinks';
import { getDemoOpenInLinks, getSeedGithubUrl } from './seedLinks';

// The kind of build a page is rendered by, which the links read from the build's environment when
// the caller does not say.
const build = vi.hoisted(() => ({ isProduction: false, isArchive: false }));

vi.mock('@utils/env', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@utils/env')>()),
    getIsProduction: () => build.isProduction,
    getIsArchive: () => build.isArchive,
}));
vi.mock('@constants', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@constants')>()),
    agChartsVersion: '14.2.0-beta.20260920',
}));

const MANIFESTS: SeedManifestEntry[] = [{ demo: 'web-analytics', framework: 'react' }];
const FOLDER = 'ag-grid/ag-charts-demos/tree';

describe('seed links for the build they are rendered by', () => {
    beforeEach(() => {
        build.isProduction = false;
        build.isArchive = false;
    });

    const sourceHref = () => getSeedGithubUrl({ demoId: 'web-analytics', framework: 'react' });

    test('a development, staging or preview build links the staging branch', () => {
        expect(sourceHref()).toBe(`https://github.com/${FOLDER}/staging/web-analytics/react`);
    });

    test('a production build links the release tag for the site version', () => {
        build.isProduction = true;

        expect(sourceHref()).toBe(`https://github.com/${FOLDER}/release-14.2.0/web-analytics/react`);
    });

    test('an archive build links the release branch for the site version', () => {
        build.isProduction = true;
        build.isArchive = true;

        expect(sourceHref()).toBe(`https://github.com/${FOLDER}/b14.2.0/web-analytics/react`);
    });

    test('the demo page entries follow the same ref in both the StackBlitz and the GitHub link', () => {
        build.isProduction = true;
        build.isArchive = true;

        expect(getDemoOpenInLinks({ demoId: 'web-analytics', title: 'Web Analytics', manifests: MANIFESTS })).toEqual([
            {
                framework: 'React',
                href: `https://stackblitz.com/github/${FOLDER}/b14.2.0/web-analytics/react?title=AG%20Charts%20Web%20Analytics%20(React)`,
                sourceHref: `https://github.com/${FOLDER}/b14.2.0/web-analytics/react`,
            },
        ]);
    });

    test('an explicit build kind wins over the environment', () => {
        build.isProduction = true;

        expect(getSeedGithubUrl({ demoId: 'web-analytics', framework: 'react', isProduction: false })).toBe(
            `https://github.com/${FOLDER}/staging/web-analytics/react`
        );
    });
});
