import { getIsDev } from '@utils/env';
import { execSync } from 'child_process';

/**
 * Gets a set of gallery example names that have been modified compared to the main branch
 */
export function getModifiedGalleryExamples(): Set<string> {
    if (!getIsDev()) {
        return new Set();
    }

    try {
        // Get list of modified gallery example files compared to main branch
        const modifiedFiles = execSync(
            'git diff latest --name-only | grep "packages/ag-charts-website/src/content/gallery/_examples"',
            { encoding: 'utf-8', cwd: process.cwd() }
        );

        // Extract unique example names from file paths
        const exampleNames = modifiedFiles
            .split('\n')
            .map((line) => line.trim())
            .map((filePath) => {
                // Extract example name from path like: packages/ag-charts-website/src/content/gallery/_examples/simple-bar/main.ts
                const match = filePath.match(/\/_examples\/([^/]+)\//);
                return match ? match[1] : null;
            })
            .filter((filePath): filePath is string => filePath !== null);

        return new Set(exampleNames);
    } catch (error) {
        // If git command fails or no modified files, return empty set
        // eslint-disable-next-line no-console
        console.warn('Could not determine modified gallery examples:', error);
        return new Set();
    }
}
