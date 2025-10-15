#!/usr/bin/env tsx

/**
 * Script to mark specific SonarCloud issues by their issue keys
 *
 * Usage:
 *   SONAR_TOKEN=<your-token> npx tsx tools/prompts/commands/sonar-fix/scripts/mark-specific-issues.ts --config path/to/config.json
 *
 *   # Dry run:
 *   DRY_RUN=true SONAR_TOKEN=<your-token> npx tsx tools/prompts/commands/sonar-fix/scripts/mark-specific-issues.ts --config path/to/config.json
 *
 * Config format:
 * {
 *   "batches": [
 *     {
 *       "name": "Batch description",
 *       "issueKeys": ["AY123...", "AY456..."],
 *       "transition": "falsepositive" | "accept",
 *       "comment": "Explanation"
 *     }
 *   ]
 * }
 */
import { readFileSync } from 'node:fs';

const SONAR_TOKEN = process.env.SONAR_TOKEN;
const SONAR_PROJECT = process.env.SONAR_PROJECT || 'ag-charts-community-latest';
const SONAR_BASE_URL = 'https://sonarcloud.io/api';
const DRY_RUN = process.env.DRY_RUN === 'true';

console.log(`Using project: ${SONAR_PROJECT}`);

if (!SONAR_TOKEN) {
    console.error('Error: SONAR_TOKEN environment variable is required');
    console.error('Generate a token at: https://sonarcloud.io/account/security');
    process.exit(1);
}

interface BatchConfig {
    name: string;
    issueKeys: string[];
    transition: 'falsepositive' | 'accept';
    comment: string;
}

/**
 * Get issue details
 */
async function getIssue(issueKey: string): Promise<any> {
    const url = `${SONAR_BASE_URL}/issues/search?issues=${issueKey}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${SONAR_TOKEN}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get issue ${issueKey}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.issues?.[0];
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
 * Mark an issue with a specific transition
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
 * Process a batch of issues
 */
async function processBatch(config: BatchConfig): Promise<void> {
    console.log(`\n=== Processing: ${config.name} ===`);
    console.log(`Issue count: ${config.issueKeys.length}`);
    console.log(`Transition: ${config.transition}`);

    if (config.issueKeys.length === 0) {
        console.log('No issues to process');
        return;
    }

    if (DRY_RUN) {
        console.log('\nDRY RUN - Would process these issues:');
        for (const key of config.issueKeys.slice(0, 5)) {
            try {
                const issue = await getIssue(key);
                if (issue) {
                    console.log(
                        `  - ${key}: ${issue.rule} at ${issue.component}:${issue.line || '?'} (status: ${issue.status})`
                    );
                } else {
                    console.log(`  - ${key}: Not found or already resolved`);
                }
                await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
                console.log(`  - ${key}: Error - ${error.message}`);
            }
        }
        if (config.issueKeys.length > 5) {
            console.log(`  ... and ${config.issueKeys.length - 5} more`);
        }
        return;
    }

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const issueKey of config.issueKeys) {
        try {
            // First check if issue exists and what status it's in
            const issue = await getIssue(issueKey);

            if (!issue) {
                console.log(`${issueKey}: Not found or already resolved - skipping`);
                skippedCount++;
                continue;
            }

            console.log(`Processing ${issueKey} (${issue.rule}, status: ${issue.status})...`);

            // Add comment first
            await addComment(issueKey, config.comment);

            // Then transition the issue
            await transitionIssue(issueKey, config.transition);

            successCount++;
            console.log(`  ✓ Marked as ${config.transition}`);

            // Rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
            failCount++;
            console.error(`  ✗ Failed: ${error.message}`);
        }
    }

    console.log(`\nResults: ${successCount} succeeded, ${failCount} failed, ${skippedCount} skipped`);
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
            '  npx tsx tools/prompts/commands/sonar-fix/scripts/mark-specific-issues.ts --config path/to/config.json'
        );
        console.error('');
        console.error('Config file format:');
        console.error('{');
        console.error('  "batches": [');
        console.error('    {');
        console.error('      "name": "Batch description",');
        console.error('      "issueKeys": ["AY123...", "AY456..."],');
        console.error('      "transition": "falsepositive" | "accept",');
        console.error('      "comment": "Explanation"');
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
            if (!batch.issueKeys || !Array.isArray(batch.issueKeys)) {
                throw new Error(`Batch "${batch.name}" must have "issueKeys" array`);
            }
            if (!batch.transition || !['falsepositive', 'accept'].includes(batch.transition)) {
                throw new Error(`Batch "${batch.name}" must have "transition" as either "falsepositive" or "accept"`);
            }
            if (!batch.comment) throw new Error(`Batch "${batch.name}" must have a "comment"`);
        }

        return config.batches;
    } catch (error) {
        console.error(`Failed to load config: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('SonarCloud Specific Issue Marker');
    console.log('=================================\n');

    if (DRY_RUN) {
        console.log('*** DRY RUN MODE ***\n');
    }

    const batches = loadBatchConfig();

    console.log(`Processing ${batches.length} batch(es)...\n`);

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
