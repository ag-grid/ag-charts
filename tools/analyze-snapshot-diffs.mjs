#!/usr/bin/env node
/**
 * Analyze git-modified PNG snapshots to identify visually significant changes.
 *
 * Usage:
 *   node tools/analyze-snapshot-diffs.mjs [options]
 *
 * Options:
 *   --color-threshold=N    Per-pixel color sensitivity (default: 0.3, higher = less sensitive)
 *   --pixel-threshold=N    % of pixels that must differ to be "significant" (default: 1.0)
 *   --no-html              Skip HTML report generation
 *   --verbose              Show all files, not just significant ones
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? parseFloat(arg.split('=')[1]) : defaultValue;
};
const hasFlag = (name) => args.includes(`--${name}`);

const COLOR_THRESHOLD = getArg('color-threshold', 0.3);
const PIXEL_PERCENT_THRESHOLD = getArg('pixel-threshold', 1.0);
const GENERATE_HTML = !hasFlag('no-html');
const VERBOSE = hasFlag('verbose');
const QUIET = hasFlag('quiet') || !process.stdout.isTTY;

console.log(`Configuration:`);
console.log(`  Color threshold: ${COLOR_THRESHOLD} (higher = less sensitive to color changes)`);
console.log(`  Pixel threshold: ${PIXEL_PERCENT_THRESHOLD}% (files with more diff pixels are "significant")`);
console.log('');

// Get list of modified PNG files from git
function getModifiedPngs() {
    try {
        const output = execSync('git status --porcelain', { encoding: 'utf-8' });
        return output
            .split('\n')
            .filter((line) => line.match(/\.png$/i))
            .map((line) => line.slice(3).trim())
            .filter(Boolean);
    } catch {
        console.error('Failed to get git status');
        return [];
    }
}

// Load PNG from file
function loadPng(filePath) {
    const buffer = fs.readFileSync(filePath);
    return PNG.sync.read(buffer);
}

// Load PNG from git HEAD
function loadPngFromHead(filePath) {
    try {
        const buffer = execSync(`git show HEAD:${filePath}`, { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 });
        return PNG.sync.read(buffer);
    } catch {
        return null;
    }
}

// Compare two PNGs
function comparePngs(current, baseline, colorThreshold) {
    const width = Math.max(current.width, baseline.width);
    const height = Math.max(current.height, baseline.height);

    // Handle size mismatch
    if (current.width !== baseline.width || current.height !== baseline.height) {
        return {
            diffPixels: width * height,
            totalPixels: width * height,
            diffPercent: 100,
            sizeChanged: true,
            diff: null,
        };
    }

    const diff = new PNG({ width, height });
    const diffPixels = pixelmatch(current.data, baseline.data, diff.data, width, height, {
        threshold: colorThreshold,
        includeAA: false, // Ignore anti-aliasing differences
    });

    const totalPixels = width * height;
    const diffPercent = (diffPixels * 100) / totalPixels;

    return {
        diffPixels,
        totalPixels,
        diffPercent,
        sizeChanged: false,
        diff,
    };
}

// Categorize by severity
function categorize(diffPercent) {
    if (diffPercent === 0) return 'identical';
    if (diffPercent < 0.1) return 'negligible';
    if (diffPercent < 1.0) return 'minor';
    return 'significant';
}

// Main analysis
async function analyze() {
    const modifiedPngs = getModifiedPngs();
    console.log(`Found ${modifiedPngs.length} modified PNG files\n`);

    if (modifiedPngs.length === 0) {
        console.log('No modified PNG files to analyze.');
        return;
    }

    const results = [];
    const categories = { identical: 0, negligible: 0, minor: 0, significant: 0 };

    for (const filePath of modifiedPngs) {
        if (!QUIET) {
            process.stdout.write(`\rAnalyzing: ${filePath.slice(0, 60).padEnd(60)}...`);
        }

        if (!fs.existsSync(filePath)) {
            continue; // File deleted
        }

        const current = loadPng(filePath);
        const baseline = loadPngFromHead(filePath);

        if (!baseline) {
            // New file
            results.push({
                file: filePath,
                diffPercent: 100,
                diffPixels: current.width * current.height,
                category: 'significant',
                isNew: true,
            });
            categories.significant++;
            continue;
        }

        const comparison = comparePngs(current, baseline, COLOR_THRESHOLD);
        const category = categorize(comparison.diffPercent);
        categories[category]++;

        const result = {
            file: filePath,
            diffPercent: comparison.diffPercent,
            diffPixels: comparison.diffPixels,
            totalPixels: comparison.totalPixels,
            category,
            sizeChanged: comparison.sizeChanged,
            diff: comparison.diff,
        };

        results.push(result);
    }

    if (!QUIET) {
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
    }

    // Sort by diff percentage (most different first)
    results.sort((a, b) => b.diffPercent - a.diffPercent);

    // Print summary
    console.log('=== Summary ===');
    console.log(`  Identical:   ${categories.identical}`);
    console.log(`  Negligible:  ${categories.negligible} (<0.1%)`);
    console.log(`  Minor:       ${categories.minor} (0.1-1%)`);
    console.log(`  Significant: ${categories.significant} (>1%)`);
    console.log('');

    // Print significant files
    const significant = results.filter((r) => r.diffPercent >= PIXEL_PERCENT_THRESHOLD);
    if (significant.length > 0) {
        console.log(`=== Significant Changes (>${PIXEL_PERCENT_THRESHOLD}%) ===`);
        for (const r of significant) {
            const suffix = r.isNew ? ' (NEW)' : r.sizeChanged ? ' (SIZE CHANGED)' : '';
            console.log(`  ${r.diffPercent.toFixed(2).padStart(6)}%  ${r.file}${suffix}`);
        }
        console.log('');
    } else {
        console.log(`No files with >${PIXEL_PERCENT_THRESHOLD}% difference found.`);
        console.log('Try lowering --pixel-threshold or --color-threshold\n');
    }

    // Generate HTML report
    if (GENERATE_HTML && significant.length > 0) {
        generateHtmlReport(significant, results);
    }

    // Print verbose output if requested
    if (VERBOSE) {
        console.log('=== All Files ===');
        for (const r of results) {
            console.log(`  [${r.category.padEnd(11)}] ${r.diffPercent.toFixed(2).padStart(6)}%  ${r.file}`);
        }
    }
}

function generateHtmlReport(significant, allResults) {
    const outputPath = '/tmp/snapshot-analysis.html';
    const diffDir = '/tmp/snapshot-diffs';

    // Create diff directory
    if (!fs.existsSync(diffDir)) {
        fs.mkdirSync(diffDir, { recursive: true });
    }

    let html = `<!DOCTYPE html>
<html>
<head>
    <title>Snapshot Diff Analysis</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; background: #1a1a1a; color: #eee; }
        h1 { color: #fff; }
        .summary { background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .file-card { background: #2a2a2a; border-radius: 8px; margin-bottom: 20px; padding: 15px; }
        .file-header { font-weight: bold; margin-bottom: 10px; display: flex; justify-content: space-between; }
        .diff-percent { color: #ff6b6b; font-size: 1.2em; }
        .images { display: flex; gap: 10px; flex-wrap: wrap; }
        .image-container { text-align: center; }
        .image-container img { max-width: 400px; max-height: 300px; border: 1px solid #444; background: #333; }
        .image-label { font-size: 0.9em; color: #888; margin-top: 5px; }
        .category-identical { color: #4ade80; }
        .category-negligible { color: #a3e635; }
        .category-minor { color: #fbbf24; }
        .category-significant { color: #f87171; }
    </style>
</head>
<body>
    <h1>Snapshot Diff Analysis</h1>
    <div class="summary">
        <p><strong>Configuration:</strong> Color threshold: ${COLOR_THRESHOLD}, Pixel threshold: ${PIXEL_PERCENT_THRESHOLD}%</p>
        <p><strong>Total files:</strong> ${allResults.length}</p>
        <p><strong>Significant (>${PIXEL_PERCENT_THRESHOLD}%):</strong> ${significant.length}</p>
    </div>
`;

    for (const result of significant) {
        const fileName = path.basename(result.file);
        const diffFileName = `${fileName.replace('.png', '')}-diff.png`;
        const diffPath = path.join(diffDir, diffFileName);

        // Save diff image
        if (result.diff) {
            fs.writeFileSync(diffPath, PNG.sync.write(result.diff));
        }

        // Encode images as base64 for embedding
        const currentBase64 = fs.existsSync(result.file) ? fs.readFileSync(result.file).toString('base64') : null;

        let baselineBase64 = null;
        try {
            const baselineBuffer = execSync(`git show HEAD:${result.file}`, {
                encoding: 'buffer',
                maxBuffer: 50 * 1024 * 1024,
            });
            baselineBase64 = baselineBuffer.toString('base64');
        } catch {
            // File is new
        }

        const diffBase64 = result.diff ? PNG.sync.write(result.diff).toString('base64') : null;

        html += `
    <div class="file-card">
        <div class="file-header">
            <span>${result.file}</span>
            <span class="diff-percent">${result.diffPercent.toFixed(2)}% different</span>
        </div>
        <div class="images">
`;

        if (baselineBase64) {
            html += `
            <div class="image-container">
                <img src="data:image/png;base64,${baselineBase64}" />
                <div class="image-label">Before (HEAD)</div>
            </div>
`;
        }

        if (currentBase64) {
            html += `
            <div class="image-container">
                <img src="data:image/png;base64,${currentBase64}" />
                <div class="image-label">After (Working)</div>
            </div>
`;
        }

        if (diffBase64) {
            html += `
            <div class="image-container">
                <img src="data:image/png;base64,${diffBase64}" />
                <div class="image-label">Diff (red = changed)</div>
            </div>
`;
        }

        html += `
        </div>
    </div>
`;
    }

    html += `
</body>
</html>`;

    fs.writeFileSync(outputPath, html);
    console.log(`HTML report generated: ${outputPath}`);

    // Try to open in browser
    try {
        if (process.platform === 'darwin') {
            execSync(`open "${outputPath}"`, { stdio: 'ignore' });
        } else if (process.platform === 'linux') {
            execSync(`xdg-open "${outputPath}"`, { stdio: 'ignore' });
        }
    } catch {
        // Ignore open errors
    }
}

analyze().catch(console.error);
