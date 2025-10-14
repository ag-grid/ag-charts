#!/usr/bin/env tsx

/**
 * Script to mark SonarCloud issues as false positive or accepted
 *
 * Usage:
 *   SONAR_TOKEN=<your-token> npx tsx tools/prompts/commands/sonar-fix/scripts/mark-sonar-issues.ts --config path/to/config.json
 *
 *   # Dry run:
 *   DRY_RUN=true SONAR_TOKEN=<your-token> npx tsx tools/prompts/commands/sonar-fix/scripts/mark-sonar-issues.ts --config path/to/config.json
 *
 * Prerequisites:
 *   1. Generate a SonarCloud token at: https://sonarcloud.io/account/security
 *   2. Ensure you have "Administer Issues" permission on the project
 *   3. Create a config file with batch definitions (see README for format)
 */
import { readFileSync } from 'node:fs';

const SONAR_TOKEN = process.env.SONAR_TOKEN;
const SONAR_ORG = 'ag-grid';
const SONAR_PROJECT = 'ag-grid_ag-charts';
const SONAR_BASE_URL = 'https://sonarcloud.io/api';

if (!SONAR_TOKEN) {
    console.error('Error: SONAR_TOKEN environment variable is required');
    console.error('Generate a token at: https://sonarcloud.io/account/security');
    process.exit(1);
}

interface Issue {
    key: string;
    rule: string;
    component: string;
    line?: number;
    message: string;
}

interface BatchConfig {
    name: string;
    ruleKeys: string[];
    transition: 'falsepositive' | 'accept';
    comment: string;
    dryRun?: boolean;
}

/**
 * Search for issues matching specific criteria
 * Only searches for OPEN issues (not CONFIRMED, ACCEPTED, FALSE_POSITIVE, etc.)
 */
async function searchIssues(ruleKeys: string[]): Promise<Issue[]> {
    const rules = ruleKeys.join(',');
    const url = `${SONAR_BASE_URL}/issues/search?componentKeys=${SONAR_PROJECT}&rules=${rules}&issueStatuses=OPEN&ps=500`;

    console.log(`Searching for OPEN issues with rules: ${rules}`);

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${SONAR_TOKEN}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to search issues: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.issues || [];
}

/**
 * Mark an issue with a specific transition (falsepositive or accept)
 */
async function transitionIssue(issueKey: string, transition: string): Promise<void> {
    const url = `${SONAR_BASE_URL}/issues/do_transition`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${SONAR_TOKEN}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            issue: issueKey,
            transition: transition,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to transition issue ${issueKey}: ${response.status} ${text}`);
    }
}

/**
 * Add a comment to an issue
 */
async function addComment(issueKey: string, comment: string): Promise<void> {
    const url = `${SONAR_BASE_URL}/issues/add_comment`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${SONAR_TOKEN}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            issue: issueKey,
            text: comment,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to add comment to ${issueKey}: ${response.status} ${text}`);
    }
}

/**
 * Process a batch of issues
 */
async function processBatch(config: BatchConfig): Promise<void> {
    console.log(`\n=== Processing: ${config.name} ===`);

    const issues = await searchIssues(config.ruleKeys);

    if (issues.length === 0) {
        console.log('No issues found matching criteria');
        return;
    }

    console.log(`Found ${issues.length} issues to process`);

    if (config.dryRun) {
        console.log('DRY RUN - Would process:');
        issues.forEach((issue) => {
            console.log(`  - ${issue.key}: ${issue.rule} at ${issue.component}:${issue.line || '?'}`);
        });
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const issue of issues) {
        try {
            console.log(`Processing ${issue.key} (${issue.rule})...`);

            // Add comment first (provides context before transition)
            await addComment(issue.key, config.comment);

            // Then transition the issue
            await transitionIssue(issue.key, config.transition);

            successCount++;
            console.log(`  ✓ Marked as ${config.transition}`);

            // Rate limiting - be nice to the API
            await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
            failCount++;
            console.error(`  ✗ Failed: ${error.message}`);
        }
    }

    console.log(`\nResults: ${successCount} succeeded, ${failCount} failed`);
}

/**
 * Load batches from config file
 */
function loadBatchConfig(): BatchConfig[] {
    const args = process.argv.slice(2);
    const configIndex = args.indexOf('--config');

    if (configIndex < 0 || !args[configIndex + 1]) {
        console.error('Error: --config parameter is required');
        console.error('');
        console.error('Usage:');
        console.error(
            '  npx tsx tools/prompts/commands/sonar-fix/scripts/mark-sonar-issues.ts --config path/to/config.json'
        );
        console.error('');
        console.error('Config file format:');
        console.error('{');
        console.error('  "batches": [');
        console.error('    {');
        console.error('      "name": "Batch description",');
        console.error('      "ruleKeys": ["typescript:S1234"],');
        console.error('      "transition": "falsepositive" | "accept",');
        console.error('      "comment": "Explanation for marking these issues"');
        console.error('    }');
        console.error('  ]');
        console.error('}');
        process.exit(1);
    }

    const configPath = args[configIndex + 1];
    console.log(`Loading config from: ${configPath}`);

    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        if (!config.batches || !Array.isArray(config.batches)) {
            throw new Error('Config must have a "batches" array');
        }

        if (config.batches.length === 0) {
            throw new Error('Config must contain at least one batch');
        }

        // Validate each batch
        for (const batch of config.batches) {
            if (!batch.name) throw new Error('Each batch must have a "name"');
            if (!batch.ruleKeys || !Array.isArray(batch.ruleKeys) || batch.ruleKeys.length === 0) {
                throw new Error(`Batch "${batch.name}" must have "ruleKeys" array with at least one rule`);
            }
            if (!batch.transition || !['falsepositive', 'accept'].includes(batch.transition)) {
                throw new Error(`Batch "${batch.name}" must have "transition" as either "falsepositive" or "accept"`);
            }
            if (!batch.comment) throw new Error(`Batch "${batch.name}" must have a "comment"`);
        }

        // Add dryRun flag to each batch
        return config.batches.map((batch: any) => ({
            ...batch,
            dryRun: process.env.DRY_RUN === 'true',
        }));
    } catch (error) {
        console.error(`Failed to load config: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('SonarCloud Issue Marker');
    console.log('=======================\n');
    console.log(`Organization: ${SONAR_ORG}`);
    console.log(`Project: ${SONAR_PROJECT}`);

    // Load batches from config or use defaults
    const batches = loadBatchConfig();

    if (batches.length === 0) {
        console.log('No batches to process');
        return;
    }

    console.log(`\nProcessing ${batches.length} batch(es)...\n`);

    // Process each batch
    for (const batch of batches) {
        try {
            await processBatch(batch);
        } catch (error) {
            console.error(`\nError processing ${batch.name}:`, error);
        }
    }

    console.log('\n✓ Complete');
}

// Run the script
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
