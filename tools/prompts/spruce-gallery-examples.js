#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const StreamJsonProcessor = require('./shared/stream-json-processor');
const { spawn } = require('child_process');
const readline = require('readline');

/**
 * Script to run the spruce-example.md command on each gallery example individually
 * with options to skip examples that have been touched in the last N days
 */

class GalleryExampleSprucer {
    constructor() {
        this.repoRoot = this.findRepoRoot();
        this.galleryDataPath = path.join(this.repoRoot, 'packages/ag-charts-website/src/content/gallery/data.json');
        this.galleryExamplesDir = path.join(this.repoRoot, 'packages/ag-charts-website/src/content/gallery/_examples');
    }

    findRepoRoot() {
        let currentDir = __dirname;
        while (currentDir !== '/' && !fs.existsSync(path.join(currentDir, '.git'))) {
            currentDir = path.dirname(currentDir);
        }
        if (currentDir === '/') {
            throw new Error('Could not find repository root');
        }
        return currentDir;
    }

    /**
     * Get all gallery examples from the data.json file
     * @returns {Array<{name: string, enterprise: boolean, seriesName?: string, order: number}>}
     */
    getAllGalleryExamples() {
        const galleryData = JSON.parse(fs.readFileSync(this.galleryDataPath, 'utf8'));
        const examples = [];
        let orderIndex = 0;

        // Extract examples from homepage first (in order)
        if (galleryData.homepage) {
            galleryData.homepage.forEach((item) => {
                examples.push({
                    name: item.seriesExampleName,
                    enterprise: false, // Homepage examples are typically community
                    source: 'homepage',
                    order: orderIndex++,
                });
            });
        }

        // Extract examples from series (in order they appear in data.json)
        if (galleryData.series) {
            galleryData.series.forEach((seriesGroup) => {
                seriesGroup.forEach((series) => {
                    if (series.examples) {
                        series.examples.forEach((example) => {
                            // Skip hidden examples unless explicitly requested
                            if (!example.hidden) {
                                examples.push({
                                    name: example.name,
                                    title: example.title,
                                    enterprise: series.enterprise || false,
                                    seriesName: series.seriesName,
                                    source: 'series',
                                    order: orderIndex++,
                                });
                            }
                        });
                    }
                });
            });
        }

        // Remove duplicates by name, keeping the first occurrence (homepage takes precedence)
        const uniqueExamples = [];
        const seenNames = new Set();

        for (const example of examples) {
            if (!seenNames.has(example.name)) {
                seenNames.add(example.name);
                uniqueExamples.push(example);
            }
        }

        // Return in the order they appear in data.json (not alphabetically)
        return uniqueExamples.sort((a, b) => a.order - b.order);
    }

    /**
     * Get the last modified time of an example directory
     * @param {string} exampleName
     * @returns {Date|null}
     */
    getExampleLastModified(exampleName) {
        const examplePath = path.join(this.galleryExamplesDir, exampleName);

        if (!fs.existsSync(examplePath)) {
            return null;
        }

        try {
            // Get the most recent modification time of any file in the example directory
            const files = fs.readdirSync(examplePath);
            let mostRecent = new Date(0);

            for (const file of files) {
                const filePath = path.join(examplePath, file);
                const stat = fs.statSync(filePath);
                if (stat.mtime > mostRecent) {
                    mostRecent = stat.mtime;
                }
            }

            return mostRecent;
        } catch (error) {
            console.warn(`Warning: Could not get modification time for ${exampleName}: ${error.message}`);
            return null;
        }
    }

    /**
     * Filter examples based on modification time
     * @param {Array} examples
     * @param {number} maxDaysOld - Skip examples modified within this many days
     * @returns {Array}
     */
    filterExamplesByAge(examples, maxDaysOld) {
        if (maxDaysOld <= 0) {
            return examples;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxDaysOld);

        return examples.filter((example) => {
            const lastModified = this.getExampleLastModified(example.name);
            if (!lastModified) {
                // If we can't determine the modification time, include it
                return true;
            }
            return lastModified <= cutoffDate;
        });
    }

    /**
     * Run the spruce command on a single example
     * @param {Object} example
     * @param {Object} options
     * @returns {Promise<{success: boolean, output?: string, error?: string}>}
     */
    async spruceExample(example, options = {}) {
        const examplePath = `packages/ag-charts-website/src/content/gallery/_examples/${example.name}`;
        const sprucePrompt = fs.readFileSync(path.join(__dirname, 'commands', 'spruce-example.md'), 'utf8');

        console.log(`\n🌲 Sprucing up: ${example.name} (${example.enterprise ? 'Enterprise' : 'Community'})`);
        console.log(`   Path: ${examplePath}`);
        if (example.title) {
            console.log(`   Title: ${example.title}`);
        }

        return new Promise((resolve) => {
            try {
                // Build the command with streaming JSON output for progress tracking
                const claudeArgs = [
                    '--print',
                    '--model',
                    options.model || 'opus',
                    '--permission-mode',
                    'bypassPermissions',
                    '--verbose',
                    '--output-format',
                    'stream-json',
                ];

                const promptMessage = `Running the following instructions against ${examplePath}\n\n${sprucePrompt}`;

                // Spawn claude process
                const claudeProcess = spawn('claude', claudeArgs, {
                    cwd: this.repoRoot,
                    timeout: 900000, // 15 minute timeout
                });

                let outputBuffer = '';
                let errorBuffer = '';
                let lastOutputLines = []; // Store lines from the last output
                let previousNonToolLines = []; // Store the previous non-tool message
                let spinnerInterval;
                let spinnerIndex = 0;
                let lastLinesDisplayed = 0; // Track how many lines we displayed last time
                const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

                // Create stream processor for handling JSON output
                const processor = new StreamJsonProcessor({
                    showDebug: false, // Set to true for debugging
                    showToolIds: false, // Don't show tool IDs by default
                    indentPrefix: '   ',
                });

                // Create a stream handler for processing incomplete lines
                const streamHandler = processor.createStreamHandler();

                // Function to update the spinner display
                const updateSpinner = () => {
                    const allLinesToShow = [...previousNonToolLines, ...lastOutputLines];

                    if (allLinesToShow.length > 0) {
                        // Clear previous lines
                        for (let i = 0; i < lastLinesDisplayed; i++) {
                            if (i > 0) {
                                readline.moveCursor(process.stdout, 0, -1); // Move up one line
                            }
                            readline.clearLine(process.stdout, 0);
                        }
                        readline.cursorTo(process.stdout, 0);

                        const spinner = spinnerChars[spinnerIndex % spinnerChars.length];
                        const maxWidth = (process.stdout.columns || 80) - 10;

                        // Display all lines (previous non-tool + current)
                        allLinesToShow.forEach((line, index) => {
                            const isFirst = index === 0;
                            const displayLine = line.length > maxWidth ? line.substring(0, maxWidth - 3) + '...' : line;

                            if (isFirst) {
                                // Show spinner on first line
                                process.stdout.write(`   ${spinner} ${displayLine}`);
                            } else {
                                // Indent subsequent lines
                                process.stdout.write(`\n     ${displayLine}`);
                            }
                        });

                        lastLinesDisplayed = allLinesToShow.length;
                        spinnerIndex++;
                    }
                };

                // Start the spinner
                spinnerInterval = setInterval(updateSpinner, 100);

                // Send the prompt to stdin
                claudeProcess.stdin.write(promptMessage);
                claudeProcess.stdin.end();

                // Handle stdout (streaming JSON)
                claudeProcess.stdout.on('data', (data) => {
                    outputBuffer += data.toString();

                    // Process the stream data
                    streamHandler.write(data.toString(), (message) => {
                        // Use the messageCategory from the processor for more accurate detection
                        if (message.output && message.output.length > 0) {
                            // Get all non-empty lines from the output
                            const meaningfulLines = message.output.filter((line) => line.trim().length > 0);
                            if (meaningfulLines.length > 0) {
                                const trimmedLines = meaningfulLines.map((line) => line.trim());

                                // Use messageCategory to determine how to handle the output
                                if (message.messageCategory === 'tool') {
                                    // For tool uses and tool results, just update lastOutputLines
                                    lastOutputLines = trimmedLines;
                                } else if (message.messageCategory === 'content') {
                                    // For content messages, save to previous and clear current
                                    previousNonToolLines = trimmedLines;
                                    lastOutputLines = [];
                                } else if (
                                    message.messageCategory === 'system' ||
                                    message.messageCategory === 'result'
                                ) {
                                    // For system and result messages, show them alongside previous content
                                    lastOutputLines = trimmedLines;
                                }
                            }
                        }
                    });
                });

                // Handle stderr
                claudeProcess.stderr.on('data', (data) => {
                    errorBuffer += data.toString();
                });

                // Handle process completion
                claudeProcess.on('close', (code) => {
                    // Stop the spinner
                    clearInterval(spinnerInterval);

                    // Clear the spinner line
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);

                    // Process any remaining buffered data
                    streamHandler.end((message) => {
                        // Silent - we've already captured what we need
                    });

                    // Get final stats from the processor
                    const stats = processor.getStats();

                    if (code === 0) {
                        console.log(`   ✅ Successfully spruced: ${example.name}`);
                        if (stats.toolsInvoked > 0) {
                            console.log(`   📊 Tools invoked: ${stats.toolsInvoked}`);
                        }
                        resolve({
                            success: true,
                            output: outputBuffer,
                            stats: stats,
                        });
                    } else {
                        console.log(`   ❌ Failed to spruce: ${example.name}`);
                        console.log(`   Exit code: ${code}`);
                        if (errorBuffer) {
                            console.log(`   Error: ${errorBuffer}`);
                        }
                        if (stats.errors > 0) {
                            console.log(`   ⚠️ Processing errors: ${stats.errors}`);
                        }
                        resolve({
                            success: false,
                            error: errorBuffer || `Process exited with code ${code}`,
                            stats: stats,
                        });
                    }
                });

                // Handle errors
                claudeProcess.on('error', (error) => {
                    // Stop the spinner
                    clearInterval(spinnerInterval);
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);

                    console.log(`   ❌ Failed to spruce: ${example.name}`);
                    console.log(`   Error: ${error.message}`);
                    resolve({
                        success: false,
                        error: error.message,
                    });
                });
            } catch (error) {
                console.log(`   ❌ Failed to spruce: ${example.name}`);
                console.log(`   Error: ${error.message}`);

                resolve({
                    success: false,
                    error: error.message,
                });
            }
        });
    }

    /**
     * Run the spruce command on multiple examples
     * @param {Object} options
     */
    async spruceExamples(options = {}) {
        const {
            maxDaysOld = 0,
            includeEnterprise = true,
            includeCommunity = true,
            includePattern = null,
            excludePattern = null,
            dryRun = false,
            continueOnError = true,
            maxExamples = null,
            startFrom = null,
        } = options;

        console.log('🌲 AG Charts Gallery Example Sprucer');
        console.log('=====================================\n');

        console.log(`📁 Repo root: ${this.repoRoot}`);
        console.log(`📋 Gallery data: ${this.galleryDataPath}`);
        console.log(`📂 Examples directory: ${this.galleryExamplesDir}`);
        console.log(`🎯 Using: /spruce-example slash command`);
        console.log(`🤖 Model: ${options.model || 'opus'}\n`);

        // Get all examples
        let examples = this.getAllGalleryExamples();
        console.log(`📊 Found ${examples.length} total gallery examples`);

        // Filter by enterprise/community
        examples = examples.filter((example) => {
            if (!includeEnterprise && example.enterprise) return false;
            if (!includeCommunity && !example.enterprise) return false;
            return true;
        });
        console.log(`📊 After enterprise/community filter: ${examples.length} examples`);

        // Filter by age
        if (maxDaysOld > 0) {
            const beforeFilter = examples.length;
            examples = this.filterExamplesByAge(examples, maxDaysOld);
            console.log(
                `📊 After age filter (skip examples modified in last ${maxDaysOld} days): ${examples.length} examples`
            );
            console.log(`   Skipped ${beforeFilter - examples.length} recently modified examples`);
        }

        // Filter by include pattern
        if (includePattern) {
            const regex = new RegExp(includePattern, 'i');
            examples = examples.filter((example) => regex.test(example.name));
            console.log(`📊 After include pattern '${includePattern}': ${examples.length} examples`);
        }

        // Filter by exclude pattern
        if (excludePattern) {
            const regex = new RegExp(excludePattern, 'i');
            examples = examples.filter((example) => !regex.test(example.name));
            console.log(`📊 After exclude pattern '${excludePattern}': ${examples.length} examples`);
        }

        // Handle startFrom
        if (startFrom) {
            const startIndex = examples.findIndex((ex) => ex.name === startFrom);
            if (startIndex >= 0) {
                examples = examples.slice(startIndex);
                console.log(`📊 Starting from '${startFrom}': ${examples.length} examples remaining`);
            } else {
                console.warn(`⚠️  Start example '${startFrom}' not found, starting from beginning`);
            }
        }

        // Limit number of examples
        if (maxExamples && maxExamples > 0) {
            examples = examples.slice(0, maxExamples);
            console.log(`📊 Limited to first ${maxExamples} examples: ${examples.length} examples`);
        }

        if (examples.length === 0) {
            console.log('❌ No examples match the specified criteria');
            return;
        }

        console.log('\n📋 Examples to process:');
        examples.forEach((example, index) => {
            const lastModified = this.getExampleLastModified(example.name);
            const modifiedStr = lastModified ? lastModified.toISOString().split('T')[0] : 'unknown';
            console.log(
                `   ${index + 1}. ${example.name} (${example.enterprise ? 'Enterprise' : 'Community'}) - modified: ${modifiedStr}`
            );
        });

        if (dryRun) {
            console.log('\n🧪 Dry run mode - no commands will be executed');
            return;
        }

        console.log('\n🚀 Starting to spruce examples...\n');

        const results = {
            total: examples.length,
            success: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < examples.length; i++) {
            const example = examples[i];
            const progress = `[${i + 1}/${examples.length}]`;

            console.log(`${progress} Processing: ${example.name}`);

            try {
                const result = await this.spruceExample(example, options);

                if (result.success) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push({
                        example: example.name,
                        error: result.error,
                    });

                    if (!continueOnError) {
                        console.log(`\n❌ Stopping due to error in ${example.name}`);
                        break;
                    }
                }
            } catch (error) {
                console.log(`❌ Unexpected error processing ${example.name}: ${error.message}`);
                results.failed++;
                results.errors.push({
                    example: example.name,
                    error: error.message,
                });

                if (!continueOnError) {
                    console.log(`\n❌ Stopping due to unexpected error`);
                    break;
                }
            }

            // Small delay between examples to avoid overwhelming the system
            if (i < examples.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        // Summary
        console.log('\n🎯 Summary');
        console.log('===========');
        console.log(`✅ Successful: ${results.success}/${results.total}`);
        console.log(`❌ Failed: ${results.failed}/${results.total}`);

        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach((error) => {
                console.log(`   ${error.example}: ${error.error}`);
            });
        }

        console.log(`\n🏁 Completed processing ${results.total} gallery examples`);
    }

    /**
     * Display help information
     */
    showHelp() {
        console.log(`
🌲 AG Charts Gallery Example Sprucer
=====================================

This script runs the /spruce-example slash command on gallery examples to improve their visual appeal.

Usage:
    node spruce-gallery-examples.js [options]

Options:
    --help                    Show this help message
    --dry-run                 Show what would be processed without executing commands
    --model MODEL             Claude model to use (default: opus, can be sonnet, etc.)
    --max-days-old N          Skip examples modified in the last N days (default: 0 = process all)
    --no-enterprise          Skip enterprise examples
    --no-community           Skip community examples
    --include-pattern REGEX   Only include examples matching this pattern (case-insensitive)
    --exclude-pattern REGEX   Exclude examples matching this pattern (case-insensitive)
    --max-examples N          Limit to processing first N examples
    --start-from NAME         Start processing from the specified example name
    --stop-on-error          Stop processing when an error occurs (default: continue)

Examples:
    # Process all examples
    node spruce-gallery-examples.js

    # Dry run to see what would be processed
    node spruce-gallery-examples.js --dry-run

    # Skip examples modified in the last 7 days
    node spruce-gallery-examples.js --max-days-old 7

    # Only process bar chart examples
    node spruce-gallery-examples.js --include-pattern "bar"

    # Process only community examples
    node spruce-gallery-examples.js --no-enterprise

    # Process only the first 5 examples
    node spruce-gallery-examples.js --max-examples 5

    # Start from a specific example
    node spruce-gallery-examples.js --start-from "simple-bar"

    # Exclude scatter examples, skip recently modified ones
    node spruce-gallery-examples.js --exclude-pattern "scatter" --max-days-old 3

Notes:
    - Each example is processed individually with the /spruce-example slash command
    - The script respects the gallery data.json file structure
    - Hidden examples are automatically excluded
    - Enterprise vs Community examples are detected from the gallery data
    - File modification times are used to determine "recently touched" examples
    - Use --dry-run to preview what will be processed before running for real

Requirements:
    - Claude Code CLI must be installed and accessible as 'claude' command
    - packages/ag-charts-website/src/content/gallery/data.json must exist
        `);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        new GalleryExampleSprucer().showHelp();
        process.exit(0);
    }

    // Parse command line arguments
    const options = {
        maxDaysOld: 0,
        includeEnterprise: true,
        includeCommunity: true,
        includePattern: null,
        excludePattern: null,
        dryRun: false,
        continueOnError: true,
        maxExamples: null,
        startFrom: null,
        model: 'opus',
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--model':
                options.model = args[++i];
                break;
            case '--max-days-old':
                options.maxDaysOld = parseInt(args[++i]) || 0;
                break;
            case '--no-enterprise':
                options.includeEnterprise = false;
                break;
            case '--no-community':
                options.includeCommunity = false;
                break;
            case '--include-pattern':
                options.includePattern = args[++i];
                break;
            case '--exclude-pattern':
                options.excludePattern = args[++i];
                break;
            case '--max-examples':
                options.maxExamples = parseInt(args[++i]) || null;
                break;
            case '--start-from':
                options.startFrom = args[++i];
                break;
            case '--stop-on-error':
                options.continueOnError = false;
                break;
            default:
                if (arg.startsWith('--')) {
                    console.error(`Unknown option: ${arg}`);
                    console.log('Use --help for available options');
                    process.exit(1);
                }
        }
    }

    try {
        const sprucer = new GalleryExampleSprucer();
        await sprucer.spruceExamples(options);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Interrupted by user');
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n\n⚠️  Terminated');
    process.exit(143);
});

if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = GalleryExampleSprucer;
