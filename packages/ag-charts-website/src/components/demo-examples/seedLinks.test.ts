import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { SeedManifestEntry } from './seedLinks';
import {
    SEED_DEVELOPMENT_REF,
    getAvailableSeedFrameworks,
    getDemoOpenInLinks,
    getSeedGitRef,
    getSeedGithubUrl,
    getSeedReleaseTag,
    getSeedStackBlitzUrl,
    readSeedManifests,
} from './seedLinks';

/** Seeds as they might be committed: every port of one demo, React only for another. */
const MANIFESTS: SeedManifestEntry[] = [
    { demo: 'financial', framework: 'angular' },
    { demo: 'financial', framework: 'react' },
    { demo: 'financial', framework: 'typescript' },
    { demo: 'financial', framework: 'vue' },
    { demo: 'web-analytics', framework: 'react' },
];

describe('seedLinks', () => {
    describe('getSeedReleaseTag', () => {
        test.each`
            version                     | expected
            ${'14.2.0'}                 | ${'release-14.2.0'}
            ${'14.2.1'}                 | ${'release-14.2.1'}
            ${'14.2.0-beta.20260920'}   | ${'release-14.2.0'}
            ${'15.0.0-beta.20260920.9'} | ${'release-15.0.0'}
        `('maps $version to $expected', ({ version, expected }) => {
            expect(getSeedReleaseTag(version)).toBe(expected);
        });

        test('rejects a version it cannot parse', () => {
            expect(() => getSeedReleaseTag('unknown')).toThrow('unknown');
        });
    });

    describe('getSeedGitRef', () => {
        test('production links the release tag for the version', () => {
            expect(getSeedGitRef({ version: '14.2.0-beta.20260920', isProduction: true })).toBe('release-14.2.0');
        });

        test('every other build links the latest branch, whatever the version', () => {
            expect(getSeedGitRef({ version: '14.2.0-beta.20260920', isProduction: false })).toBe('latest');
            expect(getSeedGitRef({ version: '14.2.0', isProduction: false })).toBe(SEED_DEVELOPMENT_REF);
        });

        test('a non-production build never needs a parseable version', () => {
            expect(getSeedGitRef({ version: 'unknown', isProduction: false })).toBe('latest');
        });
    });

    test('getSeedGithubUrl points at the seed folder at the release tag in production', () => {
        expect(
            getSeedGithubUrl({ demoId: 'financial', framework: 'react', version: '14.2.0', isProduction: true })
        ).toBe(
            'https://github.com/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/financial/react'
        );
    });

    test('getSeedGithubUrl points at the seed folder on latest outside production', () => {
        expect(
            getSeedGithubUrl({ demoId: 'financial', framework: 'react', version: '14.2.0', isProduction: false })
        ).toBe('https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-demos/seeds/financial/react');
    });

    test('getSeedStackBlitzUrl opens the same folder with an encoded project title', () => {
        expect(
            getSeedStackBlitzUrl({
                demoId: 'web-analytics',
                framework: 'react',
                title: 'Web Analytics',
                version: '14.2.0-beta.20260920',
                isProduction: true,
            })
        ).toBe(
            'https://stackblitz.com/github/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/web-analytics/react?title=AG%20Charts%20Web%20Analytics%20(React)'
        );
    });

    describe('getAvailableSeedFrameworks', () => {
        test('lists every framework the demo has a manifest for, in display order', () => {
            expect(getAvailableSeedFrameworks('financial', MANIFESTS)).toEqual([
                'react',
                'angular',
                'vue',
                'typescript',
            ]);
        });

        test('keeps display order whatever order the manifests were read in', () => {
            const reversed = [...MANIFESTS].reverse();
            expect(getAvailableSeedFrameworks('financial', reversed)).toEqual([
                'react',
                'angular',
                'vue',
                'typescript',
            ]);
        });

        test('offers only the frameworks the demo itself has a seed for', () => {
            expect(getAvailableSeedFrameworks('web-analytics', MANIFESTS)).toEqual(['react']);
        });

        test('is empty for a demo with no seeds', () => {
            expect(getAvailableSeedFrameworks('procurement', MANIFESTS)).toEqual([]);
        });
    });

    describe('getDemoOpenInLinks', () => {
        test('offers one entry per seed, in display order, at the release tag in production', () => {
            const links = getDemoOpenInLinks({
                demoId: 'financial',
                title: 'Trading Terminal',
                version: '14.2.0',
                isProduction: true,
                manifests: MANIFESTS,
            });
            expect(links.map((link) => link.framework)).toEqual(['React', 'Angular', 'Vue', 'TypeScript']);
            expect(links[0]).toEqual({
                framework: 'React',
                href: 'https://stackblitz.com/github/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/financial/react?title=AG%20Charts%20Trading%20Terminal%20(React)',
                sourceHref:
                    'https://github.com/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/financial/react',
            });
            expect(links[3]).toEqual({
                framework: 'TypeScript',
                href: 'https://stackblitz.com/github/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/financial/typescript?title=AG%20Charts%20Trading%20Terminal%20(TypeScript)',
                sourceHref:
                    'https://github.com/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/financial/typescript',
            });
        });

        test('offers the React seed alone for a demo with no ports', () => {
            expect(
                getDemoOpenInLinks({
                    demoId: 'web-analytics',
                    title: 'Web Analytics',
                    version: '14.2.0',
                    isProduction: true,
                    manifests: MANIFESTS,
                })
            ).toEqual([
                {
                    framework: 'React',
                    href: 'https://stackblitz.com/github/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/web-analytics/react?title=AG%20Charts%20Web%20Analytics%20(React)',
                    sourceHref:
                        'https://github.com/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/web-analytics/react',
                },
            ]);
        });

        test('offers nothing for a demo with no seeds, so the page omits the links', () => {
            expect(
                getDemoOpenInLinks({
                    demoId: 'procurement',
                    title: 'Procurement',
                    version: '14.2.0',
                    isProduction: true,
                    manifests: MANIFESTS,
                })
            ).toEqual([]);
        });

        test('follows latest on a staging build', () => {
            const [react] = getDemoOpenInLinks({
                demoId: 'web-analytics',
                title: 'Web Analytics',
                version: '14.2.0-beta.20260920',
                isProduction: false,
                manifests: MANIFESTS,
            });
            expect(react.href).toBe(
                'https://stackblitz.com/github/ag-grid/ag-charts/tree/latest/packages/ag-charts-demos/seeds/web-analytics/react?title=AG%20Charts%20Web%20Analytics%20(React)'
            );
            expect(react.sourceHref).toBe(
                'https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-demos/seeds/web-analytics/react'
            );
        });
    });

    describe('readSeedManifests', () => {
        let seedsDir: string;

        const writeManifest = (demo: string, framework: string, content: string) => {
            mkdirSync(join(seedsDir, demo, framework), { recursive: true });
            writeFileSync(join(seedsDir, demo, framework, '.seed-manifest.json'), content);
        };
        const manifest = (demo: string, framework: string) =>
            JSON.stringify({ demo, framework, sourceHash: 'sha256-0', pinnedVersion: '14.2.0' });

        beforeEach(() => {
            seedsDir = mkdtempSync(join(tmpdir(), 'seed-manifests-'));
        });

        afterEach(() => {
            rmSync(seedsDir, { recursive: true, force: true });
        });

        test('finds every folder with a manifest and skips folders without one', () => {
            writeManifest('financial', 'react', manifest('financial', 'react'));
            writeManifest('financial', 'vue', manifest('financial', 'vue'));
            writeManifest('web-analytics', 'react', manifest('web-analytics', 'react'));
            // A port in progress, or the shared `project.json`: not seeds.
            mkdirSync(join(seedsDir, 'web-analytics', 'angular'), { recursive: true });
            writeFileSync(join(seedsDir, 'project.json'), '{}');

            expect(readSeedManifests(seedsDir)).toEqual([
                { demo: 'financial', framework: 'react' },
                { demo: 'financial', framework: 'vue' },
                { demo: 'web-analytics', framework: 'react' },
            ]);
        });

        test('is empty when no folder carries a manifest', () => {
            mkdirSync(join(seedsDir, 'financial', 'react'), { recursive: true });
            expect(readSeedManifests(seedsDir)).toEqual([]);
        });

        test('fails when the seeds folder itself is missing', () => {
            const missing = join(seedsDir, 'missing');
            expect(() => readSeedManifests(missing)).toThrow(missing);
        });

        test('fails on a manifest that is not JSON', () => {
            writeManifest('financial', 'react', '{ not json');
            expect(() => readSeedManifests(seedsDir)).toThrow(
                /financial\/react\/\.seed-manifest\.json is not valid JSON/
            );
        });

        test('fails on a manifest that names a different demo or framework from its folder', () => {
            writeManifest('financial', 'vue', manifest('financial', 'react'));
            expect(() => readSeedManifests(seedsDir)).toThrow('names financial/react but lives at financial/vue');
        });

        test('fails on a framework the site has no label for', () => {
            writeManifest('financial', 'svelte', manifest('financial', 'svelte'));
            expect(() => readSeedManifests(seedsDir)).toThrow('"svelte" is not a seed framework the site can link');
        });
    });
});
