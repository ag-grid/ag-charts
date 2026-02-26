#!/usr/bin/env tsx
/* eslint-disable no-console */
import { glob } from 'glob';
import * as path from 'path';
import { promisify } from 'util';

import { checkMdocFile, formatMdocFile } from './format-mdoc-codeblocks/formatter';

const globAsync = promisify(glob);

/**
 * This utility attempts to perform prettier-like formatting of embedded codeblocks within
 * .mdoc files.
 *
 * This was the most viable approach given the constraints of the project and the currently
 * installed package versions. Other options tried:
 * - Monkey-patching of nx format - this was a red herring, see next point.
 * - Plain configuration of prettier - doesn't work due to 'malformed' code blocks being silently
 *   ignored.
 * - Prettier plugin - the codeblock formatting is a special case in the markdown prettier
 *   formatter, which cannot be easily extended or monkey-patched.
 */

interface CliOptions {
    write: boolean;
    check: boolean;
    files: string[];
}

function parseArgs(): CliOptions {
    const args = process.argv.slice(2);
    const options: CliOptions = {
        write: false,
        check: false,
        files: [],
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--write' || arg === '-w') {
            options.write = true;
        } else if (arg === '--check' || arg === '-c') {
            options.check = true;
        } else if (!arg.startsWith('-')) {
            options.files.push(arg);
        }
    }

    // Default to checking all mdoc files if no files specified
    if (options.files.length === 0) {
        options.files = ['src/**/*.mdoc'];
    }

    // Default to check mode if neither write nor check specified
    if (!options.write && !options.check) {
        options.check = true;
    }

    return options;
}

async function findFiles(patterns: string[]): Promise<string[]> {
    const files = new Set<string>();

    for (const pattern of patterns) {
        const matches = await globAsync(pattern, {
            ignore: ['**/node_modules/**', '**/dist/**'],
            absolute: true,
        });

        if (Array.isArray(matches)) {
            for (const match of matches) {
                files.add(match);
            }
        }
    }

    return Array.from(files).sort();
}

async function main() {
    const options = parseArgs();

    if (options.write && options.check) {
        console.error('Error: Cannot use both --write and --check flags');
        process.exit(1);
    }

    console.log(`Running mdoc code block formatter in ${options.write ? 'write' : 'check'} mode...`);

    const files = await findFiles(options.files);

    if (files.length === 0) {
        console.log('No .mdoc files found matching the patterns');
        process.exit(0);
    }

    console.log(`Found ${files.length} .mdoc file(s) to process`);

    let filesChanged = 0;
    let filesWithErrors = 0;
    const errors: Array<{ file: string; error: Error }> = [];

    for (const file of files) {
        try {
            const relativePath = path.relative(process.cwd(), file);

            if (options.write) {
                const changed = await formatMdocFile(file);
                if (changed) {
                    filesChanged++;
                    console.log(`✓ Formatted: ${relativePath}`);
                }
            } else {
                const needsFormatting = await checkMdocFile(file);
                if (needsFormatting) {
                    filesChanged++;
                    console.log(`✗ Needs formatting: ${relativePath}`);
                }
            }
        } catch (error) {
            filesWithErrors++;
            errors.push({
                file: path.relative(process.cwd(), file),
                error: error as Error,
            });
        }
    }

    console.log('\n' + '='.repeat(60));

    if (errors.length > 0) {
        console.error(`\nErrors encountered in ${errors.length} file(s):`);
        for (const { file, error } of errors) {
            // If error message already contains file path with line number, use it directly
            if (error.message.includes(file)) {
                console.error(`  ${error.message}`);
            } else {
                console.error(`  ${file}: ${error.message}`);
            }
        }
    }

    if (options.write) {
        if (filesChanged === 0 && filesWithErrors === 0) {
            console.log('✓ All files are already formatted correctly');
        } else if (filesChanged > 0) {
            console.log(`✓ Formatted ${filesChanged} file(s)`);
        }

        if (filesWithErrors > 0) {
            console.error(`✗ Failed to format ${filesWithErrors} file(s)`);
            process.exit(1);
        }
    } else {
        if (filesChanged === 0 && filesWithErrors === 0) {
            console.log('✓ All files are formatted correctly');
        } else if (filesChanged > 0) {
            console.log(`✗ ${filesChanged} file(s) need formatting`);
            console.log('\nRun with --write flag to fix formatting');
            process.exit(1);
        }

        if (filesWithErrors > 0) {
            console.error(`✗ Failed to check ${filesWithErrors} file(s)`);
            process.exit(1);
        }
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
