#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const glob = require('glob');

/**
 * Orchestration script for running documentation reviews on all AG Charts docs pages
 *
 * This script implements Option 2: Parallel Execution with Batching
 * - Phase 1 (Planning): Uses expensive model for sophisticated reasoning
 * - Phase 2 (Execution): Uses cheaper model for systematic tasks
 * - Runs in parallel batches to optimize performance
 *
 * Resume functionality:
 * - Checks filesystem state for existing review-plan.md and report.md files
 * - Automatically skips completed pages based on file existence
 * - No longer relies on progress.json for completion tracking
 */

class DocsReviewOrchestrator {
    constructor(options = {}) {
        this.batchSize = options.batchSize || 5;
        this.skipScreenshots = options.skipScreenshots || false;
        this.planningModel = options.planningModel || 'opus'; // Expensive model for planning
        this.executionModel = options.executionModel || 'sonnet'; // Cheaper model for execution
        this.docsPath = 'packages/ag-charts-website/src/content/docs';
        this.reportsPath = 'reports/docs-review';
        this.resume = options.resume || false;
        this.pageGlob = options.pageGlob || null; // Optional glob pattern to filter pages
        this.verbose = options.verbose || false; // Stream Claude output when true
        this.dryRun = options.dryRun || false; // Request skeleton reports for quick testing
        this.progressFile = path.join(this.reportsPath, 'progress.json');
        this.currentPromptFile = path.join(this.reportsPath, 'current-prompt.md');
        this.currentOutputFile = path.join(this.reportsPath, 'current-prompt-output.md');
        this.results = {
            total: 0,
            completed: 0,
            failed: 0,
            errors: [],
        };
        this.completedPages = new Set();
        this.sessionId = options.sessionId || Date.now().toString();
    }

    async run() {
        console.log('🚀 Starting AG Charts Documentation Review Orchestration');
        console.log(`📋 Planning model: ${this.planningModel}`);
        console.log(`⚡ Execution model: ${this.executionModel}`);
        console.log(`🔄 Batch size: ${this.batchSize}`);
        console.log(`📸 Skip screenshots: ${this.skipScreenshots}`);
        console.log(`🗣️  Verbose mode: ${this.verbose}`);
        console.log(`🧪 Dry run mode: ${this.dryRun}`);
        if (this.pageGlob) {
            console.log(`🎯 Page filter: ${this.pageGlob}`);
        }
        console.log('');

        try {
            // 1. Discovery: Find all documentation pages
            const pages = await this.discoverPages();
            this.results.total = pages.length;

            console.log(`📚 Found ${pages.length} documentation pages`);

            // 2. Load existing progress if resuming
            if (this.resume) {
                await this.loadProgress();
            }

            console.log('');

            // 3. Phase 1: Run planning for all pages (sequential for now)
            console.log('🧠 Phase 1: Creating review plans...');
            await this.runPlanningPhase(pages);
            console.log('');

            // 4. Phase 2: Execute reviews in parallel batches
            console.log('🔍 Phase 2: Executing reviews...');
            await this.runExecutionPhase(pages);
            console.log('');

            // 5. Generate summary report
            this.generateSummaryReport();

            // 6. Clean up progress and current prompt files on successful completion
            this.cleanupProgress();
            this.cleanupCurrentPrompt();
            this.cleanupCurrentOutput();
        } catch (error) {
            console.error('❌ Orchestration failed:', error);
            await this.saveProgress();
            console.log(`💾 You can resume with: node ${process.argv[1]} --resume`);
            process.exit(1);
        }
    }

    async discoverPages() {
        const pattern = path.join(this.docsPath, '*/index.mdoc');

        try {
            // Use glob package with callback-style API wrapped in Promise
            const files = await new Promise((resolve, reject) => {
                glob(pattern, (err, matches) => {
                    if (err) reject(err);
                    else resolve(matches);
                });
            });

            console.log(`🔍 Found ${files.length} files matching pattern: ${pattern}`);

            let filteredFiles = files
                .map((file) => {
                    const pageName = path.basename(path.dirname(file));
                    return {
                        name: pageName,
                        path: file,
                        isTestPage: pageName.includes('-test'),
                        isBenchmarkPage: pageName.includes('benchmarks'),
                    };
                })
                .filter((page) => !page.isTestPage && !page.isBenchmarkPage) // Skip test and benchmark pages
                .filter((page) => {
                    // Apply glob filter if specified
                    if (this.pageGlob) {
                        const minimatch = require('minimatch');
                        return minimatch(page.name, this.pageGlob);
                    }
                    return true;
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            if (this.pageGlob) {
                console.log(`📚 After filtering: ${filteredFiles.length} pages matching '${this.pageGlob}'`);
                console.log(`🎯 Filtered pages: ${filteredFiles.map((p) => p.name).join(', ')}`);
            }

            return filteredFiles;
        } catch (error) {
            console.error('❌ Failed to discover documentation pages:', error);
            throw new Error(`Failed to discover documentation pages: ${error.message}`);
        }
    }

    async loadProgress() {
        try {
            console.log('📂 Checking filesystem state for existing progress...');

            // Check for completed pages by looking at filesystem
            let planningCompleted = 0;
            let executionCompleted = 0;

            // Get all page directories
            const pagesDirs = fs.existsSync(this.reportsPath)
                ? fs.readdirSync(this.reportsPath).filter((dir) => {
                      const fullPath = path.join(this.reportsPath, dir);
                      return (
                          fs.statSync(fullPath).isDirectory() &&
                          !['progress.json', 'summary.json', 'current-prompt.md', 'current-prompt-output.md'].includes(
                              dir
                          )
                      );
                  })
                : [];

            // Check each page directory for completed files
            for (const pageDir of pagesDirs) {
                const pagePath = path.join(this.reportsPath, pageDir);
                const planPath = path.join(pagePath, 'review-plan.md');
                const reportPath = path.join(pagePath, 'report.md');

                if (fs.existsSync(planPath)) {
                    this.completedPages.add(`${pageDir}:planning`);
                    planningCompleted++;
                }

                if (fs.existsSync(reportPath)) {
                    this.completedPages.add(`${pageDir}:execution`);
                    executionCompleted++;
                    this.results.completed++;
                }
            }

            if (planningCompleted > 0 || executionCompleted > 0) {
                console.log(`✅ Found existing progress:`);
                console.log(`   - Planning completed: ${planningCompleted} pages`);
                console.log(`   - Execution completed: ${executionCompleted} pages`);
                console.log(`🔄 Will resume from filesystem state`);
            } else {
                console.log('📝 No previous progress found in filesystem, starting fresh');
            }

            // Optionally load errors from previous runs, but only for completed pages
            const summaryPath = path.join(this.reportsPath, 'summary.json');
            if (fs.existsSync(summaryPath)) {
                try {
                    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
                    if (summary.results && summary.results.errors) {
                        // Filter out errors for pages that will be reprocessed
                        this.results.errors = summary.results.errors.filter((error) => {
                            // Keep error only if the page won't be reprocessed
                            const pageReportPath = path.join(this.reportsPath, error.page, 'report.md');
                            const isPageComplete = fs.existsSync(pageReportPath);

                            if (!isPageComplete) {
                                console.log(`   🔄 Clearing previous error for ${error.page} (will be reprocessed)`);
                                return false;
                            }
                            return true;
                        });

                        if (this.results.errors.length > 0) {
                            console.log(`   ⚠️  Keeping ${this.results.errors.length} errors from completed pages`);
                        }
                    }
                } catch (e) {
                    // Ignore errors reading summary file
                }
            }
        } catch (error) {
            console.error('❌ Failed to check filesystem state:', error.message);
            console.log('🔄 Starting fresh...');
        }
    }

    async saveProgress() {
        // Progress is now tracked by filesystem state (review-plan.md and report.md files)
        // This method is kept for compatibility but does minimal work
        try {
            // Only save error information if needed
            if (this.results.errors.length > 0) {
                const errorLog = {
                    timestamp: new Date().toISOString(),
                    errors: this.results.errors,
                };

                fs.mkdirSync(path.dirname(this.progressFile), { recursive: true });
                fs.writeFileSync(path.join(this.reportsPath, 'errors.json'), JSON.stringify(errorLog, null, 2));
            }
        } catch (error) {
            console.error('❌ Failed to save error log:', error.message);
        }
    }

    cleanupProgress() {
        try {
            if (fs.existsSync(this.progressFile)) {
                fs.unlinkSync(this.progressFile);
            }
        } catch (error) {
            console.error('❌ Failed to cleanup progress file:', error.message);
        }
    }

    isPageCompleted(pageName, phase) {
        // Check filesystem state instead of memory
        const pageDir = path.join(this.reportsPath, pageName);

        if (phase === 'planning') {
            const planPath = path.join(pageDir, 'review-plan.md');
            return fs.existsSync(planPath);
        } else if (phase === 'execution') {
            const reportPath = path.join(pageDir, 'report.md');
            return fs.existsSync(reportPath);
        }

        return false;
    }

    markPageCompleted(pageName, phase) {
        this.completedPages.add(`${pageName}:${phase}`);
    }

    addError(page, phase, errorMessage) {
        // Check if error already exists for this page and phase
        const existingError = this.results.errors.find((e) => e.page === page && e.phase === phase);

        if (!existingError) {
            this.results.errors.push({
                page: page,
                phase: phase,
                error: errorMessage,
            });
        } else {
            // Update existing error message
            existingError.error = errorMessage;
        }
    }

    async saveCurrentPrompt(prompt, pageName, phase, model) {
        try {
            const content = `# Current Claude Prompt

**Page**: ${pageName}
**Phase**: ${phase}
**Model**: ${model}
**Timestamp**: ${new Date().toISOString()}
**Session ID**: ${this.sessionId}

---

\`\`\`
${prompt}
\`\`\`
`;

            fs.mkdirSync(path.dirname(this.currentPromptFile), { recursive: true });
            fs.writeFileSync(this.currentPromptFile, content);
        } catch (error) {
            console.error('❌ Failed to save current prompt:', error.message);
        }
    }

    cleanupCurrentPrompt() {
        try {
            if (fs.existsSync(this.currentPromptFile)) {
                fs.unlinkSync(this.currentPromptFile);
            }
        } catch (error) {
            console.error('❌ Failed to cleanup current prompt file:', error.message);
        }
    }

    async saveCurrentOutput(content, pageName, phase, model) {
        try {
            const header = `# Current Claude Output\n\n**Page**: ${pageName}\n**Phase**: ${phase}\n**Model**: ${model}\n**Timestamp**: ${new Date().toISOString()}\n**Session ID**: ${this.sessionId}\n\n---\n\n`;

            fs.mkdirSync(path.dirname(this.currentOutputFile), { recursive: true });
            fs.writeFileSync(this.currentOutputFile, header + content);
        } catch (error) {
            console.error('❌ Failed to save current output:', error.message);
        }
    }

    cleanupCurrentOutput() {
        try {
            if (fs.existsSync(this.currentOutputFile)) {
                fs.unlinkSync(this.currentOutputFile);
            }
        } catch (error) {
            console.error('❌ Failed to cleanup current output file:', error.message);
        }
    }

    async runPlanningPhase(pages) {
        const remainingPages = pages.filter((page) => !this.isPageCompleted(page.name, 'planning'));
        const progressBar = this.createProgressBar(pages.length, 'Planning');

        // Skip already completed pages in progress bar
        const alreadyCompleted = pages.length - remainingPages.length;
        for (let i = 0; i < alreadyCompleted; i++) {
            progressBar.tick('(skipped)');
        }

        for (const page of remainingPages) {
            try {
                progressBar.tick(`${page.name} (planning)`);
                await this.runPhase1(page);
                this.markPageCompleted(page.name, 'planning');
                await this.saveProgress(); // Save progress after each page
            } catch (error) {
                console.error(`\n❌ Planning failed for ${page.name}:`, error.message);
                this.addError(page.name, 'planning', error.message);
                await this.saveProgress(); // Save progress even on error
            }
        }

        progressBar.terminate();
    }

    async runExecutionPhase(pages) {
        const remainingPages = pages.filter((page) => !this.isPageCompleted(page.name, 'execution'));
        const progressBar = this.createProgressBar(pages.length, 'Execution');

        // Skip already completed pages in progress bar
        const alreadyCompleted = pages.length - remainingPages.length;
        for (let i = 0; i < alreadyCompleted; i++) {
            progressBar.tick('(skipped)');
        }

        // Process remaining pages in batches
        for (let i = 0; i < remainingPages.length; i += this.batchSize) {
            const batch = remainingPages.slice(i, i + this.batchSize);

            const promises = batch.map(async (page) => {
                try {
                    await this.runPhase2(page);
                    progressBar.tick(`${page.name} (executing)`);
                    this.markPageCompleted(page.name, 'execution');
                    this.results.completed++;
                    await this.saveProgress(); // Save progress after each page
                } catch (error) {
                    console.error(`\n❌ Execution failed for ${page.name}:`, error.message);
                    this.results.failed++;
                    this.addError(page.name, 'execution', error.message);
                    await this.saveProgress(); // Save progress even on error
                }
            });

            await Promise.all(promises);
        }

        progressBar.terminate();
    }

    async runPhase1(page) {
        const dryRunInstructions = this.dryRun
            ? `

IMPORTANT: This is a DRY RUN. Instead of creating a full review plan:
- Create a minimal skeleton review plan with just headers and brief bullet points
- Include only 2-3 key validation targets instead of exhaustive coverage
- Keep the plan under 200 words
- This is for testing the pipeline, not actual review`
            : '';

        const prompt = `I need you to run Phase 1 of the documentation review for the page: ${page.path}

This is the planning phase. Create a detailed, page-specific review plan using the expensive model for sophisticated reasoning.

Please use the documentation review prompt from tools/prompts/docs-review.md to create a comprehensive review plan. Focus on the Phase 1 requirements: read the documentation page, identify key validation targets, and create a structured plan with prioritized testing tasks.${dryRunInstructions}`;

        await this.saveCurrentPrompt(prompt, page.name, 'planning', this.planningModel);

        try {
            const result = await this.runClaudeCode(prompt, this.planningModel, page.name, 'planning');
            this.cleanupCurrentPrompt();
            this.cleanupCurrentOutput();
            return result;
        } catch (error) {
            this.cleanupCurrentPrompt();
            this.cleanupCurrentOutput();
            throw error;
        }
    }

    async runPhase2(page) {
        const planPath = path.join(this.reportsPath, page.name, 'review-plan.md');
        const planExists = fs.existsSync(planPath);

        const dryRunInstructions = this.dryRun
            ? `

IMPORTANT: This is a DRY RUN. Instead of a full execution:
- Create a minimal skeleton report with just headers and brief findings
- Skip actual validation and testing
- Include only 1-2 mock findings instead of thorough testing
- Skip screenshots entirely
- Keep the report under 300 words
- This is for testing the pipeline, not actual review`
            : '';

        const prompt = `I need you to run Phase 2 of the documentation review for the page: ${page.path}

This is the execution phase. Execute the review plan systematically using the cheaper model for systematic tasks.

${planExists ? `Reference the existing review plan at: ${planPath}` : ''}
${this.skipScreenshots ? 'Skip screenshot capture for this run.' : ''}

Please use the documentation review prompt from tools/prompts/docs-review.md to execute the review plan. Focus on the Phase 2 requirements: work through planned validations, document findings, and create the final report with screenshots.${dryRunInstructions}`;

        await this.saveCurrentPrompt(prompt, page.name, 'execution', this.executionModel);

        try {
            const result = await this.runClaudeCode(prompt, this.executionModel, page.name, 'execution');
            this.cleanupCurrentPrompt();
            this.cleanupCurrentOutput();
            return result;
        } catch (error) {
            this.cleanupCurrentPrompt();
            this.cleanupCurrentOutput();
            throw error;
        }
    }

    async runClaudeCode(prompt, model, pageName, phase) {
        return new Promise((resolve, reject) => {
            const args = ['--model', model, '--permission-mode', 'bypassPermissions', '--print'];
            const child = spawn('claude', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            let stdout = '';
            let stderr = '';

            // Show spinner for long-running operations (only in non-verbose mode)
            const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            let spinnerIndex = 0;
            let spinnerInterval;

            const startSpinner = () => {
                if (!this.verbose) {
                    spinnerInterval = setInterval(() => {
                        process.stdout.write(`\r${spinnerChars[spinnerIndex]} Claude is thinking...`);
                        spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
                    }, 100);
                }
            };

            const stopSpinner = () => {
                if (spinnerInterval) {
                    clearInterval(spinnerInterval);
                    process.stdout.write('\r' + ' '.repeat(30) + '\r'); // Clear spinner line
                }
            };

            // Start spinner after 1 second delay (only in non-verbose mode)
            const spinnerTimeout = this.verbose ? null : setTimeout(startSpinner, 1000);

            // Initialize output file
            this.saveCurrentOutput('', pageName, phase, model);

            // In verbose mode, add a header
            if (this.verbose) {
                console.log(`\n📝 Claude output for ${pageName} (${phase}):`);
                console.log('─'.repeat(60));
            }

            child.stdout.on('data', (data) => {
                const chunk = data.toString();
                stdout += chunk;

                // Stream output to console in verbose mode
                if (this.verbose) {
                    process.stdout.write(chunk);
                }

                // Stream output to file in real-time
                this.saveCurrentOutput(stdout, pageName, phase, model);
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();

                // Also show stderr in verbose mode
                if (this.verbose) {
                    process.stderr.write(data);
                }
            });

            child.on('close', (code) => {
                if (spinnerTimeout) clearTimeout(spinnerTimeout);
                stopSpinner();

                if (this.verbose) {
                    console.log('\n' + '─'.repeat(60));
                }

                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(`Claude exited with code ${code}: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                if (spinnerTimeout) clearTimeout(spinnerTimeout);
                stopSpinner();
                reject(error);
            });

            // Send the prompt
            child.stdin.write(prompt);
            child.stdin.end();
        });
    }

    createProgressBar(total, label) {
        let completed = 0;
        let startTime = Date.now();

        return {
            tick: (itemName = '') => {
                completed++;
                const percentage = Math.min(100, Math.round((completed / total) * 100)); // Cap at 100%
                const filledBars = Math.min(50, Math.floor(percentage / 2)); // Cap at 50
                const emptyBars = Math.max(0, 50 - filledBars); // Ensure non-negative
                const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

                // Calculate ETA
                const elapsed = Date.now() - startTime;
                const rate = completed / (elapsed / 1000);
                const remaining = total - completed;
                const eta = remaining > 0 ? Math.round(remaining / rate) : 0;
                const etaStr = eta > 0 ? ` ETA: ${this.formatTime(eta)}` : '';

                // Truncate item name if too long
                const displayName = itemName.length > 20 ? itemName.substring(0, 17) + '...' : itemName;
                const nameStr = displayName ? ` | ${displayName}` : '';

                process.stdout.write(`\r${label}: [${bar}] ${percentage}% (${completed}/${total})${nameStr}${etaStr}`);
            },
            terminate: () => {
                const totalTime = Date.now() - startTime;
                process.stdout.write(` | Completed in ${this.formatTime(totalTime / 1000)}\n`);
            },
        };
    }

    formatTime(seconds) {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
        return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
    }

    generateSummaryReport() {
        console.log('\n📊 Documentation Review Summary');
        console.log('================================');
        console.log(`Total pages: ${this.results.total}`);
        console.log(`Completed: ${this.results.completed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success rate: ${Math.round((this.results.completed / this.results.total) * 100)}%`);
        console.log('');

        if (this.results.errors.length > 0) {
            console.log('❌ Errors:');
            this.results.errors.forEach((error) => {
                console.log(`  - ${error.page} (${error.phase}): ${error.error}`);
            });
            console.log('');
        }

        // Write summary to file
        const summaryPath = path.join(this.reportsPath, 'summary.json');
        fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
        fs.writeFileSync(
            summaryPath,
            JSON.stringify(
                {
                    timestamp: new Date().toISOString(),
                    configuration: {
                        planningModel: this.planningModel,
                        executionModel: this.executionModel,
                        batchSize: this.batchSize,
                        skipScreenshots: this.skipScreenshots,
                        verbose: this.verbose,
                        dryRun: this.dryRun,
                    },
                    results: this.results,
                },
                null,
                2
            )
        );

        console.log(`📄 Summary report saved to: ${summaryPath}`);
        console.log('');
        console.log('✅ Documentation review orchestration completed!');
    }
}

// CLI interface
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg.startsWith('--batch-size=')) {
            options.batchSize = parseInt(arg.split('=')[1]);
        } else if (arg === '--batch-size' && i + 1 < args.length) {
            options.batchSize = parseInt(args[i + 1]);
            i++;
        } else if (arg === '--skip-screenshots') {
            options.skipScreenshots = true;
        } else if (arg.startsWith('--planning-model=')) {
            options.planningModel = arg.split('=')[1];
        } else if (arg === '--planning-model' && i + 1 < args.length) {
            options.planningModel = args[i + 1];
            i++;
        } else if (arg.startsWith('--execution-model=')) {
            options.executionModel = arg.split('=')[1];
        } else if (arg === '--execution-model' && i + 1 < args.length) {
            options.executionModel = args[i + 1];
            i++;
        } else if (arg.startsWith('--page-glob=')) {
            options.pageGlob = arg.split('=')[1].replace(/^['"]|['"]$/g, ''); // Remove quotes
        } else if (arg === '--page-glob' && i + 1 < args.length) {
            options.pageGlob = args[i + 1].replace(/^['"]|['"]$/g, ''); // Remove quotes
            i++;
        } else if (arg === '--resume') {
            options.resume = true;
        } else if (arg === '--clean') {
            options.clean = true;
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Usage: node run-docs-review.js [options]

Options:
  --batch-size <number>       Number of pages to process in parallel (default: 5)
  --skip-screenshots          Skip screenshot capture during execution
  --planning-model <model>    Model to use for Phase 1 planning (default: opus)
  --execution-model <model>   Model to use for Phase 2 execution (default: sonnet)
  --page-glob <pattern>       Glob pattern to filter pages (e.g., 'pie-*' for pie pages)
  --verbose, -v               Stream Claude output as it executes (instead of spinner)
  --dry-run                   Request skeleton reports for quick testing
  --resume                    Resume from filesystem state (checks for existing review-plan.md and report.md files)
  --clean                     Clean up progress file and start fresh
  --help, -h                  Show this help message

Examples:
  node run-docs-review.js
  node run-docs-review.js --batch-size=3 --skip-screenshots
  node run-docs-review.js --planning-model=opus --execution-model=sonnet
  node run-docs-review.js --page-glob='pie-*' --batch-size=1
  node run-docs-review.js --page-glob='pie-series' (single page)
  node run-docs-review.js --verbose --dry-run  (quick test with output)
  node run-docs-review.js --resume
  node run-docs-review.js --clean
`);
            process.exit(0);
        }
    }

    return options;
}

// Main execution
if (require.main === module) {
    const options = parseArgs();
    const orchestrator = new DocsReviewOrchestrator(options);

    // Handle clean option
    if (options.clean) {
        orchestrator.cleanupProgress();
        orchestrator.cleanupCurrentPrompt();
        orchestrator.cleanupCurrentOutput();
        console.log('🧹 Progress and current prompt files cleaned up');
        process.exit(0);
    }

    // Handle graceful interruption
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received interrupt signal, saving progress...');
        await orchestrator.saveProgress();
        orchestrator.cleanupCurrentPrompt();
        orchestrator.cleanupCurrentOutput();
        console.log(`💾 Progress saved. Resume with: node ${process.argv[1]} --resume`);
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received termination signal, saving progress...');
        await orchestrator.saveProgress();
        orchestrator.cleanupCurrentPrompt();
        orchestrator.cleanupCurrentOutput();
        console.log(`💾 Progress saved. Resume with: node ${process.argv[1]} --resume`);
        process.exit(0);
    });

    orchestrator.run().catch(console.error);
}

module.exports = { DocsReviewOrchestrator };
