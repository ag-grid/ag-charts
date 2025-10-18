#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const glob = require('glob');
const yargs = require('yargs');
const { execSync } = require('child_process');

/**
 * Orchestration script for running documentation reviews on all AG Charts docs pages
 *
 * This script implements Option 2: Parallel Execution with Batching
 * - Phase 1 (Planning): Uses expensive model for sophisticated reasoning
 * - Phase 2 (Execution): Uses cheaper model for systematic tasks
 * - Phase 3 (Summary): Generates comprehensive summary report
 * - Runs in parallel batches to optimize performance
 *
 * Resume functionality:
 * - Checks filesystem state for existing review-plan.md and report.md files
 * - Automatically skips completed pages based on file existence
 * - No longer relies on progress.json for completion tracking
 */

// ============================================================================
// Constants
// ============================================================================

const PATHS = {
    DOCS: 'packages/ag-charts-website/src/content/docs',
    REPORTS: 'reports/docs-review',
};

const FILE_NAMES = {
    REVIEW_PLAN: 'technical-review-plan.md',
    REPORT: 'reports/technical-review-report.md',
    SUMMARY: 'summary.md',
    PROGRESS: 'progress.json',
    CURRENT_PROMPT: 'current-prompt.md',
    CURRENT_OUTPUT: 'current-prompt-output.md',
    ERRORS: 'errors.json',
    BATCH_SUMMARY: (num) => `batch-summary-${num}.json`,
};

const PHASES = {
    PLANNING: 'planning',
    EXECUTION: 'execution',
    SUMMARY: 'summary',
};

const DEFAULT_OPTIONS = {
    batchSize: 5,
    summaryBatchSize: 10,
    skipScreenshots: false,
    planningModel: 'sonnet',
    executionModel: 'haiku',
    summaryModel: 'sonnet',
    resume: false,
    resumePhase: PHASES.PLANNING,
    force: false,
    verbose: false,
    dryRun: false,
    limit: null, // No limit by default
    refreshDays: null, // Refresh pages modified in past N days
    maxRetries: 10, // Increased for 5-hour quota window
    quotaRetryDelay: 300000, // 5 minutes initial delay (more reasonable)
    maxQuotaRetryDelay: 1800000, // 30 minutes max delay (caps exponential growth)
    quotaBackoffMultiplier: 1.5, // Gentler exponential growth
    pauseOnQuotaExhaustion: true,
    quotaWindowHours: 5, // Track the quota window duration
    serverOverloadMaxRetries: 5, // Fewer retries for server overload
    serverOverloadBaseDelay: 30000, // 30 seconds base delay for server overload
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the full path for a file in the reports directory
 */
function getReportPath(...parts) {
    return path.join(PATHS.REPORTS, ...parts);
}

/**
 * Get the path for a page-specific file
 */
function getPageFilePath(pageName, fileName) {
    // New structure: files are written alongside the documentation pages
    return path.join(PATHS.DOCS, pageName, fileName);
}

/**
 * Check if a file exists (with force mode support)
 */
function fileExists(filePath, forceMode = false) {
    if (forceMode) return false;
    return fs.existsSync(filePath);
}

/**
 * Write JSON file safely
 */
function writeJsonFile(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Read JSON file safely
 */
function readJsonFile(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return null;
    }
}

/**
 * Save a file with directory creation
 */
function saveFile(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

/**
 * Clean up a file if it exists
 */
function cleanupFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error(`❌ Failed to cleanup ${path.basename(filePath)}:`, error.message);
    }
}

/**
 * Detect if an error is related to actual quota exhaustion (not server overload)
 */
function isQuotaError(stderr, stdout) {
    return hasQuotaError(stderr, stdout) != null;
}

function hasQuotaError(stderr, stdout) {
    const errorText = (stderr + stdout).toLowerCase();

    // True quota exhaustion patterns - these indicate we've hit our usage limits
    const quotaPatterns = [
        'quota exceeded',
        'usage limit exceeded',
        'daily limit exceeded',
        'monthly limit exceeded',
        'request limit exceeded',
        'rate limit exceeded',
        'quota limit',
        'usage quota',
        'billing limit',
        'account limit',
        'usage limit reached',
    ];

    return quotaPatterns.find((pattern) => errorText.includes(pattern));
}

/**
 * Detect if an error is related to server overload (429 but not quota)
 */
function isServerOverloadError(stderr, stdout) {
    const errorText = (stderr + stdout).toLowerCase();

    // Server overload patterns - temporary capacity issues
    const overloadPatterns = [
        'too many requests',
        '429',
        'server overloaded',
        'temporarily unavailable',
        'try again later',
        'service unavailable',
        'capacity exceeded',
    ];

    // Check for overload patterns but exclude true quota messages
    const hasOverloadPattern = overloadPatterns.some((pattern) => errorText.includes(pattern));
    const hasQuotaPattern = isQuotaError(stderr, stdout);

    // It's server overload if we see overload patterns but no explicit quota language
    return hasOverloadPattern && !hasQuotaPattern;
}

/**
 * Sleep utility for delays
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if enough time has passed since quota exhaustion to likely have reset
 */
function checkQuotaRecovery() {
    const quotaFile = getReportPath('quota-exhaustion.json');

    if (!fs.existsSync(quotaFile)) {
        return { recovered: true, info: null };
    }

    try {
        const quotaInfo = JSON.parse(fs.readFileSync(quotaFile, 'utf8'));
        const exhaustionTime = new Date(quotaInfo.timestamp).getTime();
        const estimatedResetTime = new Date(quotaInfo.estimatedResetTime).getTime();
        const now = Date.now();

        const hoursWaited = (now - exhaustionTime) / (1000 * 60 * 60);
        const quotaLikelyReset = now >= estimatedResetTime;

        return {
            recovered: quotaLikelyReset,
            info: {
                ...quotaInfo,
                hoursWaited: hoursWaited.toFixed(1),
                quotaLikelyReset,
                timeUntilReset: quotaLikelyReset ? 0 : Math.max(0, (estimatedResetTime - now) / (1000 * 60 * 60)),
            },
        };
    } catch (error) {
        console.warn('⚠️  Could not parse quota exhaustion info, assuming recovered');
        return { recovered: true, info: null };
    }
}

/**
 * Build phase-specific prompt instructions
 */
function buildPromptInstructions(phase, pageName, dryRun = false) {
    const baseInstructions = {
        [PHASES.PLANNING]: `
IMPORTANT: Write the review plan to: packages/ag-charts-website/src/content/docs/${pageName}/technical-review-plan.md
Do NOT write files to the root directory or any other location.`,
        [PHASES.EXECUTION]: `
IMPORTANT: When writing files during this phase:
- Write the final report to: packages/ag-charts-website/src/content/docs/${pageName}/reports/technical-review-report.md
- Save all screenshots to: packages/ag-charts-website/src/content/docs/${pageName}/reports/\${exampleName}/
- If you need to create temporary files, use: reports/docs-review/${pageName}/tmp/
- Do NOT write files to the root directory or any other location`,
        [PHASES.SUMMARY]: `
IMPORTANT: Write the complete summary to: reports/docs-review/summary.md
Do NOT write files to the root directory or any other location.`,
    };

    const dryRunInstructions = {
        [PHASES.PLANNING]: `

IMPORTANT: This is a DRY RUN. Instead of creating a full review plan:
- Create a minimal skeleton review plan with just headers and brief bullet points
- Include only 2-3 key validation targets instead of exhaustive coverage
- Keep the plan under 200 words
- This is for testing the pipeline, not actual review`,
        [PHASES.EXECUTION]: `

IMPORTANT: This is a DRY RUN. Instead of a full execution:
- Create a minimal skeleton report with just headers and brief findings
- Skip actual validation and testing
- Include only 1-2 mock findings instead of thorough testing
- Skip screenshots entirely
- Keep the report under 300 words
- This is for testing the pipeline, not actual review`,
        [PHASES.SUMMARY]: `

IMPORTANT: This is a DRY RUN. Create a minimal summary with just basic statistics.`,
    };

    const instructions = baseInstructions[phase] || '';
    const dryRunSuffix = dryRun ? dryRunInstructions[phase] || '' : '';

    return instructions + dryRunSuffix;
}

/**
 * Get pages modified within the last N days using git history
 */
async function getModifiedPagesFromGit(days) {
    try {
        // Get the date N days ago in git log format
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        const sinceDateStr = sinceDate.toISOString().split('T')[0];

        // Use git log to find modified files in the docs directory
        const gitCommand = `git log --since="${sinceDateStr}" --name-only --pretty=format: -- "${PATHS.DOCS}" | grep -E "index\\.mdoc$" | sort | uniq`;

        const modifiedFiles = execSync(gitCommand, { encoding: 'utf8' })
            .split('\n')
            .filter(Boolean)
            .map((file) => file.trim());

        // Extract page names from the file paths
        const modifiedPageNames = new Set();
        modifiedFiles.forEach((file) => {
            const match = file.match(/\/docs\/([^\/]+)\/index\.mdoc$/);
            if (match) {
                modifiedPageNames.add(match[1]);
            }
        });

        console.log(
            `📝 Found ${modifiedPageNames.size} pages modified in the last ${days} days:`,
            Array.from(modifiedPageNames).join(', ')
        );
        return modifiedPageNames;
    } catch (error) {
        console.error('❌ Failed to get git history:', error.message);
        throw new Error(`Failed to get modified pages from git: ${error.message}`);
    }
}

// ============================================================================
// Claude Execution Functions
// ============================================================================

/**
 * Execute Claude with quota-aware retry logic that resets on success
 */
async function executeClaudeCommand(prompt, model, pageName, phase, options) {
    const {
        verbose,
        sessionId,
        maxRetries = 10,
        quotaRetryDelay = 300000,
        maxQuotaRetryDelay = 1800000,
        quotaBackoffMultiplier = 1.5,
        pauseOnQuotaExhaustion = true,
        quotaWindowHours = 5,
        serverOverloadMaxRetries = 5,
        serverOverloadBaseDelay = 30000,
    } = options;

    const promptFile = getReportPath(FILE_NAMES.CURRENT_PROMPT);
    const outputFile = getReportPath(FILE_NAMES.CURRENT_OUTPUT);

    await saveCurrentPrompt(promptFile, prompt, pageName, phase, model, sessionId);

    let attempt = 0;
    let currentDelay = quotaRetryDelay;
    let quotaStartTime = null; // Track when quota issues started

    while (attempt <= maxRetries) {
        try {
            const result = await runClaudeCode(prompt, model, pageName, phase, {
                verbose,
                outputFile,
                sessionId,
            });

            // SUCCESS: Reset retry state and cleanup
            if (attempt > 0) {
                console.log(`✅ Quota recovery successful for ${pageName} after ${attempt} retries`);
            }

            cleanupFile(promptFile);
            cleanupFile(outputFile);
            return result;
        } catch (error) {
            const isQuota = isQuotaError(error.message, '');
            const isServerOverload = isServerOverloadError(error.message, '');

            if (isServerOverload && attempt < serverOverloadMaxRetries) {
                attempt++;

                // Server overload: shorter delays, let Claude CLI handle its own backoff
                const overloadDelay = Math.min(serverOverloadBaseDelay + attempt * 15000, 120000); // 30s to 2min max

                console.log(`\n⚠️  Server overload detected for ${pageName} (${phase})`);
                console.log(`   Attempt ${attempt}/${serverOverloadMaxRetries + 1}`);
                console.log(`   Brief wait for server recovery: ${Math.round(overloadDelay / 1000)}s...`);

                await sleep(overloadDelay);
                continue;
            } else if (isQuota && attempt < maxRetries) {
                attempt++;

                // Track quota start time for window awareness
                if (quotaStartTime === null) {
                    quotaStartTime = Date.now();
                }

                // Check if we're approaching the quota window limit
                const elapsedHours = (Date.now() - quotaStartTime) / (1000 * 60 * 60);
                const remainingWindowTime = quotaWindowHours - elapsedHours;

                console.log(`\n⏳ Quota limit detected for ${pageName} (${phase})`);
                console.log(`   Attempt ${attempt}/${maxRetries + 1}`);
                console.log(`   Elapsed quota time: ${elapsedHours.toFixed(1)}h / ${quotaWindowHours}h`);

                if (remainingWindowTime < currentDelay / (1000 * 60 * 60)) {
                    console.log(
                        `   ⚠️  Remaining quota window (${remainingWindowTime.toFixed(1)}h) shorter than next delay`
                    );
                    console.log(`   Reducing delay to fit within quota window...`);
                    currentDelay = Math.max(60000, remainingWindowTime * 60 * 60 * 1000 * 0.8); // 80% of remaining time, min 1 minute
                }

                console.log(`   Waiting ${Math.round(currentDelay / 60000)} minutes before retry...`);

                await sleep(currentDelay);

                // Exponential backoff, capped at max delay
                currentDelay = Math.min(currentDelay * quotaBackoffMultiplier, maxQuotaRetryDelay);
                continue;
            } else if (isQuota && attempt >= maxRetries && pauseOnQuotaExhaustion) {
                // Quota exhausted after max retries
                const elapsedHours = quotaStartTime ? (Date.now() - quotaStartTime) / (1000 * 60 * 60) : 0;

                console.log(
                    `\n🛑 Quota exhausted for ${pageName} after ${maxRetries} retries (${elapsedHours.toFixed(1)}h elapsed)`
                );
                console.log(
                    `   Quota window resets in ~${Math.max(0, quotaWindowHours - elapsedHours).toFixed(1)} hours`
                );
                console.log(`   Pausing execution. You can resume later with:`);
                console.log(`   node ${process.argv[1]} --resume`);

                // Save quota exhaustion info for resume logic
                const quotaInfo = {
                    timestamp: new Date().toISOString(),
                    page: pageName,
                    phase: phase,
                    attemptsExhausted: maxRetries,
                    quotaStartTime: quotaStartTime,
                    estimatedResetTime: new Date(quotaStartTime + quotaWindowHours * 60 * 60 * 1000).toISOString(),
                };

                saveFile(getReportPath('quota-exhaustion.json'), JSON.stringify(quotaInfo, null, 2));

                process.exit(2); // Exit code 2 for quota exhaustion
            } else if (isServerOverload && attempt >= serverOverloadMaxRetries) {
                // Server overload retries exhausted
                console.log(`\n🔥 Server overload persists for ${pageName} after ${serverOverloadMaxRetries} retries`);
                console.log(`   This appears to be a temporary server capacity issue.`);
                console.log(`   You may want to try again in a few minutes.`);

                cleanupFile(promptFile);
                cleanupFile(outputFile);
                throw new Error(`Server overload persists after ${serverOverloadMaxRetries} retries: ${error.message}`);
            } else {
                // Non-quota, non-overload error or retries exhausted for other errors
                cleanupFile(promptFile);
                cleanupFile(outputFile);
                throw error;
            }
        }
    }
}

/**
 * Save current prompt for debugging
 */
async function saveCurrentPrompt(filePath, prompt, pageName, phase, model, sessionId) {
    const content = `# Current Claude Prompt

**Page**: ${pageName}
**Phase**: ${phase}
**Model**: ${model}
**Timestamp**: ${new Date().toISOString()}
**Session ID**: ${sessionId}

---

\`\`\`
${prompt}
\`\`\`
`;

    saveFile(filePath, content);
}

/**
 * Save current output for debugging
 */
function saveCurrentOutput(filePath, content, pageName, phase, model, sessionId) {
    const header = `# Current Claude Output

**Page**: ${pageName}
**Phase**: ${phase}
**Model**: ${model}
**Timestamp**: ${new Date().toISOString()}
**Session ID**: ${sessionId}

---

`;

    saveFile(filePath, header + content);
}

/**
 * Run Claude command with consistent behavior
 */
async function runClaudeCode(prompt, model, pageName, phase, options) {
    const { verbose, outputFile, sessionId } = options;

    return new Promise((resolve, reject) => {
        const args = ['--model', model, '--permission-mode', 'bypassPermissions', '--print'];
        // Inherit environment to ensure MCP configuration is passed to spawned Claude processes
        const env = { ...process.env };

        const child = spawn('claude', args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: env,
        });

        let stdout = '';
        let stderr = '';

        // Show spinner for long-running operations (only in non-verbose mode)
        const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let spinnerIndex = 0;
        let spinnerInterval;

        const startSpinner = () => {
            if (!verbose) {
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

        // Start spinner after 1 second delay
        const spinnerTimeout = verbose ? null : setTimeout(startSpinner, 1000);

        // Initialize output file
        if (outputFile) {
            saveCurrentOutput(outputFile, '', pageName, phase, model, sessionId);
        }

        // In verbose mode, add a header
        if (verbose) {
            console.log(`\n📝 Claude output for ${pageName} (${phase}):`);
            console.log('─'.repeat(60));
        }

        child.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;

            // Stream output to console in verbose mode
            if (verbose) {
                process.stdout.write(chunk);
            }

            // Stream output to file in real-time
            if (outputFile) {
                saveCurrentOutput(outputFile, stdout, pageName, phase, model, sessionId);
            }
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();

            // Also show stderr in verbose mode
            if (verbose) {
                process.stderr.write(data);
            }
        });

        child.on('close', (code) => {
            if (spinnerTimeout) clearTimeout(spinnerTimeout);
            stopSpinner();

            if (verbose) {
                console.log('\n' + '─'.repeat(60));
            }

            if (code === 0) {
                resolve(stdout);
                return;
            }

            const quotaError = hasQuotaError(stderr, stdout);
            if (quotaError != null) {
                reject(new Error(`Quota error: ${quotaError}`));
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

// ============================================================================
// Progress Bar Functions
// ============================================================================

function createProgressBar(total, label) {
    let completed = 0;
    let startTime = Date.now();

    return {
        tick: (itemName = '') => {
            completed++;
            const percentage = Math.min(100, Math.round((completed / total) * 100));
            const filledBars = Math.min(50, Math.floor(percentage / 2));
            const emptyBars = Math.max(0, 50 - filledBars);
            const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

            // Calculate ETA
            const elapsed = Date.now() - startTime;
            const rate = completed / (elapsed / 1000);
            const remaining = total - completed;
            const eta = remaining > 0 ? Math.round(remaining / rate) : 0;
            const etaStr = eta > 0 ? ` ETA: ${formatTime(eta)}` : '';

            // Truncate item name if too long
            const displayName = itemName.length > 20 ? itemName.substring(0, 17) + '...' : itemName;
            const nameStr = displayName ? ` | ${displayName}` : '';

            process.stdout.write(`\r${label}: [${bar}] ${percentage}% (${completed}/${total})${nameStr}${etaStr}`);
        },
        terminate: () => {
            const totalTime = Date.now() - startTime;
            process.stdout.write(` | Completed in ${formatTime(totalTime / 1000)}\n`);
        },
    };
}

function formatTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

// ============================================================================
// Main Orchestrator Class
// ============================================================================

class DocsReviewOrchestrator {
    constructor(options = {}) {
        // Merge options with defaults
        this.options = { ...DEFAULT_OPTIONS, ...options };

        // Extract commonly used options
        this.batchSize = this.options.batchSize;
        this.skipScreenshots = this.options.skipScreenshots;
        this.planningModel = this.options.planningModel;
        this.executionModel = this.options.executionModel;
        this.summaryModel = this.options.summaryModel;
        this.resume = this.options.resume;
        this.pageGlob = this.options.pageGlob;
        this.verbose = this.options.verbose;
        this.dryRun = this.options.dryRun;
        this.resumePhase = this.options.resumePhase;
        this.force = this.options.force;
        this.limit = this.options.limit;
        this.refreshDays = this.options.refreshDays;
        this.maxRetries = this.options.maxRetries;
        this.quotaRetryDelay = this.options.quotaRetryDelay;
        this.maxQuotaRetryDelay = this.options.maxQuotaRetryDelay;
        this.quotaBackoffMultiplier = this.options.quotaBackoffMultiplier;
        this.pauseOnQuotaExhaustion = !this.options.disableQuotaPause; // Invert the disable flag
        this.quotaWindowHours = this.options.quotaWindowHours;
        this.serverOverloadMaxRetries = this.options.serverOverloadMaxRetries;
        this.serverOverloadBaseDelay = this.options.serverOverloadBaseDelay;

        // Initialize state
        this.results = {
            total: 0,
            completed: 0,
            failed: 0,
            errors: [],
        };
        this.completedPages = new Set();
        this.sessionId = options.sessionId || Date.now().toString();
    }

    /**
     * Build standardized options for executeClaudeCommand calls
     */
    getExecuteOptions() {
        return {
            verbose: this.verbose,
            sessionId: this.sessionId,
            maxRetries: this.maxRetries,
            quotaRetryDelay: this.quotaRetryDelay,
            maxQuotaRetryDelay: this.maxQuotaRetryDelay,
            quotaBackoffMultiplier: this.quotaBackoffMultiplier,
            pauseOnQuotaExhaustion: this.pauseOnQuotaExhaustion,
            quotaWindowHours: this.quotaWindowHours,
            serverOverloadMaxRetries: this.serverOverloadMaxRetries,
            serverOverloadBaseDelay: this.serverOverloadBaseDelay,
        };
    }

    async run() {
        // Check quota status if resuming
        if (this.resume) {
            const quotaStatus = checkQuotaRecovery();

            if (!quotaStatus.recovered && quotaStatus.info) {
                console.log(`⏳ Quota may not have reset yet:`);
                console.log(`   Last exhaustion: ${quotaStatus.info.hoursWaited}h ago`);
                console.log(`   Estimated reset: ${quotaStatus.info.timeUntilReset.toFixed(1)}h remaining`);
                console.log(`   Continue anyway? (y/N)`);

                // In a real implementation, you might want to add interactive confirmation
                // For unattended operation, you could add a --force-resume flag
            } else if (quotaStatus.info) {
                console.log(`✅ Quota likely reset (${quotaStatus.info.hoursWaited}h since exhaustion)`);
                // Clean up quota exhaustion file
                cleanupFile(getReportPath('quota-exhaustion.json'));
            }
        }

        this.logConfiguration();

        try {
            // 1. Discovery: Find all documentation pages
            const pages = await this.discoverPages();
            this.results.total = pages.length;

            console.log(`📚 Found ${pages.length} documentation pages`);

            // 2. Load existing progress if resuming
            if (this.resume) {
                await this.loadProgress();
            }

            // 3. Apply limit to remaining pages after resume processing
            const finalPages = this.applyLimit(pages);
            if (finalPages.length !== pages.length) {
                this.results.total = finalPages.length;
                console.log(`📚 Processing ${finalPages.length} pages after limit applied`);
            }

            console.log('');

            // 4. Phase 1: Run planning for all pages
            if (this.shouldRunPhase(PHASES.PLANNING)) {
                console.log('🧠 Phase 1: Creating review plans...');
                await this.runPlanningPhase(finalPages);
                console.log('');
            } else {
                console.log('⏩ Skipping Phase 1 (planning) as requested');
                console.log('');
            }

            // 5. Phase 2: Execute reviews in parallel batches
            if (this.shouldRunPhase(PHASES.EXECUTION)) {
                console.log('🔍 Phase 2: Executing reviews...');
                await this.runExecutionPhase(finalPages);
                console.log('');
            } else {
                console.log('⏩ Skipping Phase 2 (execution) as requested');
                console.log('');
            }

            // 6. Phase 3: Generate comprehensive summary
            console.log('📊 Phase 3: Generating summary report...');
            await this.runSummaryPhase(finalPages);
            console.log('');

            // 6. Generate basic summary statistics
            this.generateSummaryReport();

            // 7. Clean up temporary files
            this.cleanup();
        } catch (error) {
            console.error('❌ Orchestration failed:', error);
            await this.saveProgress();
            console.log(`💾 You can resume with: node ${process.argv[1]} --resume`);
            process.exit(1);
        }
    }

    logConfiguration() {
        console.log('🚀 Starting AG Charts Documentation Review Orchestration');
        console.log(`📋 Planning model: ${this.planningModel}`);
        console.log(`⚡ Execution model: ${this.executionModel}`);
        console.log(`📊 Summary model: ${this.summaryModel}`);
        console.log(`🔄 Batch size: ${this.batchSize}`);
        console.log(`📸 Skip screenshots: ${this.skipScreenshots}`);
        console.log(`🗣️  Verbose mode: ${this.verbose}`);
        console.log(`🧪 Dry run mode: ${this.dryRun}`);

        if (this.force) {
            console.log(`🔄 Force mode: regenerating existing files`);
        }

        if (this.pageGlob) {
            console.log(`🎯 Page filter: ${this.pageGlob}`);
        }

        if (this.refreshDays) {
            console.log(`🔄 Refresh mode: reviewing pages modified in past ${this.refreshDays} days`);
        }

        if (this.resume) {
            if (this.resumePhase === PHASES.EXECUTION) {
                console.log(`⏩ Resume phase: execution only (skipping planning)`);
            } else if (this.resumePhase === PHASES.SUMMARY) {
                console.log(`⏩ Resume phase: summary only (skipping planning and execution)`);
            }
        }

        console.log('');
    }

    shouldRunPhase(phase) {
        const phaseOrder = [PHASES.PLANNING, PHASES.EXECUTION, PHASES.SUMMARY];
        const resumeIndex = phaseOrder.indexOf(this.resumePhase);
        const phaseIndex = phaseOrder.indexOf(phase);
        return phaseIndex >= resumeIndex;
    }

    async discoverPages() {
        const pattern = path.join(PATHS.DOCS, '*/index.mdoc');

        try {
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
                        isTestPage: pageName.endsWith('-test'),
                        isBenchmarkPage: pageName === 'benchmarks',
                        isUpgradePage: pageName.startsWith('upgrade-to-'),
                    };
                })
                .filter((page) => !page.isTestPage && !page.isBenchmarkPage && !page.isUpgradePage)
                .filter((page) => {
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

            // Apply refresh-days filter if specified
            if (this.refreshDays !== null && this.refreshDays > 0) {
                const modifiedPages = await getModifiedPagesFromGit(this.refreshDays);

                // If refresh-days is specified, we need to:
                // 1. Filter to only pages that were modified
                // 2. Force regeneration of these pages
                filteredFiles = filteredFiles.filter((page) => modifiedPages.has(page.name));

                if (filteredFiles.length > 0) {
                    console.log(
                        `🔄 Will refresh ${filteredFiles.length} pages modified in the last ${this.refreshDays} days`
                    );
                    // Enable force mode for these pages
                    this.force = true;
                } else {
                    console.log(`✅ No pages modified in the last ${this.refreshDays} days`);
                }
            }

            return filteredFiles;
        } catch (error) {
            console.error('❌ Failed to discover documentation pages:', error);
            throw new Error(`Failed to discover documentation pages: ${error.message}`);
        }
    }

    /**
     * Apply limit to the list of pages, considering pages that may be filtered out by resume logic
     */
    applyLimit(pages) {
        if (this.limit === null || this.limit <= 0) {
            return pages;
        }

        // If we're resuming, we want to limit the pages that would actually be processed
        // Get the list of pages that still need work based on current resume phase
        const remainingPages = this.getRemainingPages(pages);

        // Apply limit to remaining pages
        const limitedPages = remainingPages.slice(0, this.limit);

        if (limitedPages.length < remainingPages.length) {
            console.log(`📊 Limited to ${this.limit} pages (from ${remainingPages.length} remaining)`);
            console.log(`🎯 Limited pages: ${limitedPages.map((p) => p.name).join(', ')}`);
        }

        // If we're limiting, we need to return the subset of original pages that matches our limited selection
        if (limitedPages.length < pages.length) {
            const limitedPageNames = new Set(limitedPages.map((p) => p.name));
            return pages.filter((p) => limitedPageNames.has(p.name));
        }

        return pages;
    }

    /**
     * Get the list of pages that still need work based on current resume phase and completed pages
     */
    getRemainingPages(pages) {
        if (!this.resume) {
            return pages;
        }

        // Filter pages based on what's already completed for the current resume phase
        return pages.filter((page) => {
            // Check if this page needs work based on resume phase
            switch (this.resumePhase) {
                case PHASES.PLANNING:
                    // Planning phase: skip pages that already have planning completed (unless force mode)
                    return this.force || !this.completedPages.has(`${page.name}:${PHASES.PLANNING}`);

                case PHASES.EXECUTION:
                    // Execution phase: skip pages that already have execution completed (unless force mode)
                    return this.force || !this.completedPages.has(`${page.name}:${PHASES.EXECUTION}`);

                case PHASES.SUMMARY:
                    // Summary phase: processes all pages regardless of individual completion
                    return true;

                default:
                    return true;
            }
        });
    }

    async loadProgress() {
        try {
            console.log('📂 Checking filesystem state for existing progress...');

            // Check for completed pages by looking at filesystem
            let planningCompleted = 0;
            let executionCompleted = 0;

            // Get all page directories from the docs folder
            const pagesDirs = fs.existsSync(PATHS.DOCS)
                ? fs.readdirSync(PATHS.DOCS).filter((dir) => {
                      const fullPath = path.join(PATHS.DOCS, dir);
                      // Check if it's a directory and contains index.mdoc
                      return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'index.mdoc'));
                  })
                : [];

            // Check each page directory for completed files
            for (const pageDir of pagesDirs) {
                const planPath = getPageFilePath(pageDir, FILE_NAMES.REVIEW_PLAN);
                const reportPath = getPageFilePath(pageDir, FILE_NAMES.REPORT);

                if (fs.existsSync(planPath)) {
                    this.completedPages.add(`${pageDir}:${PHASES.PLANNING}`);
                    planningCompleted++;
                }

                if (fs.existsSync(reportPath)) {
                    this.completedPages.add(`${pageDir}:${PHASES.EXECUTION}`);
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

            // Load errors from previous runs
            const summaryPath = getReportPath(FILE_NAMES.SUMMARY + '.json');
            const summary = readJsonFile(summaryPath);

            if (summary?.results?.errors) {
                // Filter out errors for pages that will be reprocessed
                this.results.errors = summary.results.errors.filter((error) => {
                    const reportPath = getPageFilePath(error.page, FILE_NAMES.REPORT);
                    const isPageComplete = fs.existsSync(reportPath);

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
        } catch (error) {
            console.error('❌ Failed to check filesystem state:', error.message);
            console.log('🔄 Starting fresh...');
        }
    }

    async saveProgress() {
        // Progress is now tracked by filesystem state
        // Only save error information if needed
        if (this.results.errors.length > 0) {
            const errorLog = {
                timestamp: new Date().toISOString(),
                errors: this.results.errors,
            };

            writeJsonFile(getReportPath(FILE_NAMES.ERRORS), errorLog);
        }
    }

    isPageCompleted(pageName, phase) {
        // Force mode always returns false to regenerate files
        if (this.force) {
            return false;
        }

        if (phase === PHASES.PLANNING) {
            return fileExists(getPageFilePath(pageName, FILE_NAMES.REVIEW_PLAN));
        } else if (phase === PHASES.EXECUTION) {
            return fileExists(getPageFilePath(pageName, FILE_NAMES.REPORT));
        } else if (phase === PHASES.SUMMARY) {
            return fileExists(getReportPath(FILE_NAMES.SUMMARY));
        }

        return false;
    }

    markPageCompleted(pageName, phase) {
        this.completedPages.add(`${pageName}:${phase}`);
    }

    addError(page, phase, errorMessage) {
        // Check if error already exists for this page and phase
        const existingError = this.results.errors.find((e) => e.page === page && e.phase === phase);

        // Ensure we only store the string message, not complex objects
        const safeErrorMessage = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);

        if (!existingError) {
            this.results.errors.push({
                page: page,
                phase: phase,
                error: safeErrorMessage,
            });
        } else {
            // Update existing error message
            existingError.error = safeErrorMessage;
        }
    }

    async runPlanningPhase(pages) {
        const remainingPages = pages.filter((page) => !this.isPageCompleted(page.name, PHASES.PLANNING));
        const progressBar = createProgressBar(pages.length, 'Planning');

        // Skip already completed pages in progress bar
        const alreadyCompleted = pages.length - remainingPages.length;
        for (let i = 0; i < alreadyCompleted; i++) {
            progressBar.tick('(skipped)');
        }

        for (const page of remainingPages) {
            try {
                progressBar.tick(`${page.name} (planning)`);
                await this.runPhase1(page);
                this.markPageCompleted(page.name, PHASES.PLANNING);
                await this.saveProgress();
            } catch (error) {
                console.error(`\n❌ Planning failed for ${page.name}:`, error.message);
                this.addError(page.name, PHASES.PLANNING, error.message);
                await this.saveProgress();
            }
        }

        progressBar.terminate();
    }

    async runExecutionPhase(pages) {
        const remainingPages = pages.filter((page) => !this.isPageCompleted(page.name, PHASES.EXECUTION));
        const progressBar = createProgressBar(pages.length, 'Execution');

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
                    this.markPageCompleted(page.name, PHASES.EXECUTION);
                    this.results.completed++;
                    await this.saveProgress();
                } catch (error) {
                    console.error(`\n❌ Execution failed for ${page.name}:`, error.message);
                    this.results.failed++;
                    this.addError(page.name, PHASES.EXECUTION, error.message);
                    await this.saveProgress();
                }
            });

            await Promise.all(promises);
        }

        progressBar.terminate();
    }

    async runPhase1(page) {
        const prompt = `I need you to run Phase 1 of the documentation review for the page: ${page.path}

EXECUTION CONTEXT: ORCHESTRATED
Session ID: ${this.sessionId}
REQUIREMENT: All MCP tools are REQUIRED - no fallbacks allowed

This is the planning phase. Create a detailed, page-specific review plan using the expensive model for sophisticated reasoning.

Please use the documentation review prompt from tools/prompts/commands/docs-review.md to create a comprehensive review plan. Focus on the Phase 1 requirements: read the documentation page, identify key validation targets, and create a structured plan with prioritized testing tasks.

IMPORTANT: Include a clear delegation plan for the example-tester agent with:
- Which examples need testing
- What documentation claims about each example
- Expected behaviors to validate
- Specific features that should be demonstrated

${buildPromptInstructions(PHASES.PLANNING, page.name, this.dryRun)}`;

        return executeClaudeCommand(prompt, this.planningModel, page.name, PHASES.PLANNING, this.getExecuteOptions());
    }

    async runPhase2(page) {
        const planPath = getPageFilePath(page.name, FILE_NAMES.REVIEW_PLAN);
        const planExists = fs.existsSync(planPath);

        const prompt = `I need you to run Phase 2 of the documentation review for the page: ${page.path}

EXECUTION CONTEXT: ORCHESTRATED
Session ID: ${this.sessionId}
REQUIREMENT: All MCP tools are REQUIRED - no fallbacks allowed

This is the execution phase. Execute the review plan systematically using the cheaper model for systematic tasks.

${planExists ? `Reference the existing review plan at: ${planPath}` : ''}
${this.skipScreenshots ? 'Skip screenshot capture for this run.' : ''}

Please use the documentation review prompt from tools/prompts/commands/docs-review.md to execute the review plan. Focus on the Phase 2 requirements: work through planned validations, document findings, and create the final report with screenshots.

IMPORTANT: For example testing, use the Task tool to delegate to the example-tester agent. Provide clear expectations extracted from documentation and include the agent's findings in your report.

Note how example paths are mapped from repo paths:
    -   \`packages/ag-charts-website/src/content/docs/${page.name}/_examples/\${exampleName}/index.html\` => \`https://localhost:4600/charts/vanilla/${page.name}/examples/\${exampleName}\`

Note how docs paths are mapped from repo paths:
    -   \`packages/ag-charts-website/src/content/docs/${page.name}/index.mdoc\` => \`https://localhost:4600/charts/javascript/${page.name}/\`

${buildPromptInstructions(PHASES.EXECUTION, page.name, this.dryRun)}`;

        return executeClaudeCommand(prompt, this.executionModel, page.name, PHASES.EXECUTION, this.getExecuteOptions());
    }

    async runSummaryPhase(pages) {
        // Check if summary already exists
        if (this.isPageCompleted('summary', PHASES.SUMMARY)) {
            console.log('✅ Summary report already exists, skipping...');
            return;
        }

        try {
            // Filter to only pages that have completed reports
            const completedPages = pages.filter((page) => {
                const reportPath = getPageFilePath(page.name, FILE_NAMES.REPORT);
                return fs.existsSync(reportPath);
            });

            console.log(`📊 Found ${completedPages.length} completed page reports to summarize`);

            if (completedPages.length === 0) {
                console.log('⚠️  No completed reports found, skipping summary generation');
                return;
            }

            // Process in batches to avoid context window limits
            const summaryBatchSize = DEFAULT_OPTIONS.summaryBatchSize;
            const batchSummaries = [];

            // Step 1: Create batch summaries
            console.log(`📦 Processing ${Math.ceil(completedPages.length / summaryBatchSize)} batches...`);
            for (let i = 0; i < completedPages.length; i += summaryBatchSize) {
                const batch = completedPages.slice(i, i + summaryBatchSize);
                const batchNum = Math.floor(i / summaryBatchSize) + 1;
                const totalBatches = Math.ceil(completedPages.length / summaryBatchSize);

                console.log(`  Processing batch ${batchNum}/${totalBatches} (${batch.length} pages)...`);

                const batchSummaryPath = getReportPath(FILE_NAMES.BATCH_SUMMARY(batchNum));

                // Skip if batch summary already exists (unless force mode)
                if (fs.existsSync(batchSummaryPath) && !this.force) {
                    console.log(`  ✅ Batch ${batchNum} summary already exists, loading...`);
                    const batchSummary = readJsonFile(batchSummaryPath);
                    batchSummaries.push(batchSummary);
                } else {
                    if (this.force && fs.existsSync(batchSummaryPath)) {
                        console.log(`  🔄 Force mode: regenerating batch ${batchNum} summary...`);
                    }
                    const batchSummary = await this.createBatchSummary(batch, batchNum);
                    writeJsonFile(batchSummaryPath, batchSummary);
                    batchSummaries.push(batchSummary);
                }
            }

            // Step 2: Create final summary from batch summaries
            console.log('📋 Creating final summary from batch results...');
            await this.createFinalSummary(batchSummaries, completedPages);

            // Step 3: Clean up batch summary files
            console.log('🧹 Cleaning up temporary batch files...');
            for (let i = 1; i <= Math.ceil(completedPages.length / summaryBatchSize); i++) {
                cleanupFile(getReportPath(FILE_NAMES.BATCH_SUMMARY(i)));
            }

            this.markPageCompleted('summary', PHASES.SUMMARY);
            console.log('✅ Summary report generated successfully');
        } catch (error) {
            console.error('❌ Summary generation failed:', error.message);
            this.addError('summary', PHASES.SUMMARY, error.message);
            throw error;
        }
    }

    async createBatchSummary(batch, batchNum) {
        const prompt = `I need you to analyze a batch of documentation review reports and create a structured summary.

EXECUTION CONTEXT: ORCHESTRATED
Session ID: ${this.sessionId}
REQUIREMENT: All MCP tools are REQUIRED - no fallbacks allowed

This is batch ${batchNum} of the summary phase. You need to:

1. Read the report.md files for these pages: ${batch.map((p) => p.name).join(', ')}
2. For each page, extract:
   - Page name
   - Status (Success/Issues Found/Failed)
   - Count of technical accuracy issues
   - Count of example consistency issues
   - Count of visual/interaction issues
   - List of specific issues with their descriptions
   - Overall priority (High/Medium/Low)

3. Create a JSON summary with this EXACT structure. IMPORTANT: Your response MUST be valid JSON only - no other text:

\`\`\`json
{
  "batchNumber": ${batchNum},
  "pages": [
    {
      "name": "page-name",
      "status": "Issues Found",
      "counts": {
        "technicalAccuracy": 3,
        "exampleConsistency": 2,
        "visualInteraction": 1,
        "contentQuality": 0
      },
      "priority": "High",
      "issues": [
        {
          "category": "Technical Accuracy",
          "description": "Brief description of the issue"
        }
      ]
    }
  ],
  "patterns": ["List any patterns you notice across pages in this batch"]
}
\`\`\`

CRITICAL: Return ONLY the JSON structure above. Do not include any explanatory text, markdown formatting, or additional content outside the JSON code block.

Read each report from: packages/ag-charts-website/src/content/docs/{pageName}/reports/technical-review-report.md${this.dryRun ? '\n\nIMPORTANT: This is a DRY RUN. Create minimal batch summary with just basic counts.' : ''}`;

        const result = await executeClaudeCommand(
            prompt,
            this.summaryModel,
            `batch-${batchNum}`,
            PHASES.SUMMARY,
            this.getExecuteOptions()
        );

        // Parse the JSON response
        const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch (parseError) {
                console.error('❌ Failed to parse JSON from code block:', parseError.message);
                console.error('JSON content:', jsonMatch[1]);
                throw new Error(`Invalid JSON in code block: ${parseError.message}`);
            }
        } else {
            // Try to parse the entire response as JSON
            try {
                return JSON.parse(result);
            } catch (parseError) {
                console.error('❌ Failed to parse response as JSON:', parseError.message);
                console.error('Response content (first 200 chars):', result.substring(0, 200));

                // Create a fallback summary structure if JSON parsing fails
                console.log('🔄 Creating fallback batch summary structure...');
                return {
                    batchNumber: batchNum,
                    pages: batch.map((page) => ({
                        name: page.name,
                        status: 'Failed',
                        counts: {
                            technicalAccuracy: 0,
                            exampleConsistency: 0,
                            visualInteraction: 0,
                            contentQuality: 0,
                        },
                        priority: 'Unknown',
                        issues: [
                            {
                                category: 'Parse Error',
                                description: 'Failed to parse batch summary response as JSON',
                            },
                        ],
                    })),
                    patterns: ['JSON parsing failed - manual review required'],
                };
            }
        }
    }

    async createFinalSummary(batchSummaries, allPages) {
        // Convert batch summaries to a readable format
        const batchSummaryText = batchSummaries
            .map((batch, idx) => `Batch ${idx + 1}:\n${JSON.stringify(batch, null, 2)}`)
            .join('\n\n');

        const prompt = `I need you to create the final comprehensive summary report from the batch summaries.

EXECUTION CONTEXT: ORCHESTRATED
Session ID: ${this.sessionId}
REQUIREMENT: All MCP tools are REQUIRED - no fallbacks allowed

You have ${batchSummaries.length} batch summaries to aggregate. Your task:

1. Aggregate all page data from the batch summaries
2. Identify common patterns across ALL pages
3. Create a comprehensive markdown summary following the Phase 3 format from tools/prompts/commands/docs-review.md

The summary MUST include:
- Executive Summary with total pages, success rate, key patterns
- Results table with ALL pages (status, issue counts, priority, report links)
- Common issues section grouping similar problems
- Prioritized recommendations
- Statistics section

Format the results table like this:
| Page Name | Status | Technical Accuracy | Example Issues | Visual/Interaction | Priority | Report |
|-----------|--------|-------------------|----------------|-------------------|----------|---------|
| page-name | ⚠️ | 3 | 2 | 1 | High | [View Report](../packages/ag-charts-website/src/content/docs/page-name/reports/technical-review-report.md) |

Here are the batch summaries to aggregate:

${batchSummaryText}

Total pages reviewed: ${allPages.length}
${buildPromptInstructions(PHASES.SUMMARY, '', this.dryRun)}`;

        return executeClaudeCommand(
            prompt,
            this.summaryModel,
            'final-summary',
            PHASES.SUMMARY,
            this.getExecuteOptions()
        );
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
        const summaryPath = getReportPath(FILE_NAMES.SUMMARY + '.json');
        writeJsonFile(summaryPath, {
            timestamp: new Date().toISOString(),
            configuration: {
                planningModel: this.planningModel,
                executionModel: this.executionModel,
                summaryModel: this.summaryModel,
                batchSize: this.batchSize,
                skipScreenshots: this.skipScreenshots,
                verbose: this.verbose,
                dryRun: this.dryRun,
            },
            results: this.results,
        });

        console.log(`📄 Summary report saved to: ${summaryPath}`);
        console.log('');
        console.log('✅ Documentation review orchestration completed!');
    }

    cleanup() {
        cleanupFile(getReportPath(FILE_NAMES.PROGRESS));
        cleanupFile(getReportPath(FILE_NAMES.CURRENT_PROMPT));
        cleanupFile(getReportPath(FILE_NAMES.CURRENT_OUTPUT));
    }
}

// ============================================================================
// CLI Interface
// ============================================================================

function parseArgs() {
    return yargs(process.argv.slice(2))
        .usage('Usage: $0 [options]')
        .option('batch-size', {
            type: 'number',
            default: 5,
            describe: 'Number of pages to process in parallel',
        })
        .option('skip-screenshots', {
            type: 'boolean',
            default: false,
            describe: 'Skip screenshot capture during execution',
        })
        .option('planning-model', {
            type: 'string',
            default: 'sonnet',
            describe: 'Model to use for Phase 1 planning',
        })
        .option('execution-model', {
            type: 'string',
            default: 'haiku',
            describe: 'Model to use for Phase 2 execution',
        })
        .option('summary-model', {
            type: 'string',
            default: 'sonnet',
            describe: 'Model to use for Phase 3 summary',
        })
        .option('page-glob', {
            type: 'string',
            describe: "Glob pattern to filter pages (e.g., 'pie-*' for pie pages)",
        })
        .option('limit', {
            type: 'number',
            describe: 'Limit the number of pages to process',
        })
        .option('verbose', {
            alias: 'v',
            type: 'boolean',
            default: false,
            describe: 'Stream Claude output as it executes (instead of spinner)',
        })
        .option('dry-run', {
            type: 'boolean',
            default: false,
            describe: 'Request skeleton reports for quick testing',
        })
        .option('resume', {
            type: 'boolean',
            default: false,
            describe: 'Resume from filesystem state (checks for existing files)',
        })
        .option('resume-phase', {
            type: 'string',
            choices: ['planning', 'execution', 'summary'],
            default: 'planning',
            describe: 'Resume from specific phase',
            implies: 'resume',
        })
        .option('force', {
            type: 'boolean',
            default: false,
            describe: 'Force regeneration of existing files (overrides resume behavior)',
        })
        .option('clean', {
            type: 'boolean',
            default: false,
            describe: 'Clean up progress file and start fresh',
        })
        .option('refresh-days', {
            type: 'number',
            describe: 'Refresh review plans for pages modified in the past N days (uses git history)',
        })
        .option('max-retries', {
            type: 'number',
            default: 10,
            describe: 'Maximum retries for quota errors',
        })
        .option('quota-retry-delay', {
            type: 'number',
            default: 300000,
            describe: 'Initial delay in ms for quota retries (default: 5 minutes)',
        })
        .option('max-quota-retry-delay', {
            type: 'number',
            default: 1800000,
            describe: 'Maximum delay in ms for quota retries (default: 30 minutes)',
        })
        .option('quota-window-hours', {
            type: 'number',
            default: 5,
            describe: 'Quota reset window in hours (default: 5)',
        })
        .option('disable-quota-pause', {
            type: 'boolean',
            default: false,
            describe: 'Disable pausing on quota exhaustion (fail fast)',
        })
        .option('server-overload-max-retries', {
            type: 'number',
            default: 5,
            describe: 'Maximum retries for server overload (429) errors',
        })
        .option('server-overload-base-delay', {
            type: 'number',
            default: 30000,
            describe: 'Base delay in ms for server overload retries (default: 30 seconds)',
        })
        .example('$0', 'Run documentation review on all pages')
        .example('$0 --batch-size=3 --skip-screenshots', 'Use smaller batch size and skip screenshots')
        .example(
            '$0 --planning-model=opus --execution-model=sonnet --summary-model=opus',
            'Use specific models for each phase'
        )
        .example("$0 --page-glob='pie-*' --batch-size=1", 'Process only pie-related pages')
        .example("$0 --page-glob='pie-series'", 'Process single page')
        .example('$0 --limit=5', 'Process only first 5 pages')
        .example('$0 --verbose --dry-run', 'Quick test with output streaming')
        .example('$0 --resume', 'Resume from filesystem state')
        .example('$0 --resume-phase=execution', 'Skip planning, run execution only')
        .example('$0 --resume-phase=summary', 'Skip to summary generation')
        .example('$0 --force', 'Regenerate all files even if they exist')
        .example("$0 --force --page-glob='pie-*'", 'Force regenerate specific pages')
        .example('$0 --clean', 'Clean up and start fresh')
        .example('$0 --refresh-days=7', 'Refresh review for pages modified in the last 7 days')
        .example('$0 --refresh-days=30 --limit=10', 'Refresh up to 10 pages modified in the last month')
        .example(
            '$0 --max-retries=5 --quota-retry-delay=120000',
            'Custom quota handling with 5 retries starting at 2 minutes'
        )
        .example('$0 --disable-quota-pause', 'Fail fast on quota exhaustion instead of pausing')
        .example('$0 --quota-window-hours=8', 'Use 8-hour quota window instead of default 5 hours')
        .help()
        .alias('help', 'h').argv;
}

// ============================================================================
// Main Execution
// ============================================================================

if (require.main === module) {
    const options = parseArgs();
    const orchestrator = new DocsReviewOrchestrator(options);

    // Handle clean option
    if (options.clean) {
        orchestrator.cleanup();
        console.log('🧹 Progress and current prompt files cleaned up');
        process.exit(0);
    }

    // Handle graceful interruption
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received interrupt signal, saving progress...');
        await orchestrator.saveProgress();
        orchestrator.cleanup();
        console.log(`💾 You can resume with: node ${process.argv[1]} --resume`);
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received termination signal, saving progress...');
        await orchestrator.saveProgress();
        orchestrator.cleanup();
        console.log(`💾 You can resume with: node ${process.argv[1]} --resume`);
        process.exit(0);
    });

    orchestrator.run().catch(console.error);
}

module.exports = { DocsReviewOrchestrator };
