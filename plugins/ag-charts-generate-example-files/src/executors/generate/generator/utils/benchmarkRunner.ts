import fs from 'fs';
import path from 'path';

/**
 * Resolve to compiled benchmarkHarness.js.
 * Handles both running from dist/ (built) and source (dev with ts-node).
 */
function getCompiledPath(): string {
    // When running from dist/, the .js is a sibling
    const distPath = path.join(__dirname, 'benchmarkHarness.js');
    if (fs.existsSync(distPath)) {
        return distPath;
    }
    // When running from source, resolve to dist/src/ folder
    const fromSourcePath = path.resolve(
        __dirname,
        '../../../../dist/src/executors/generate/generator/utils/benchmarkHarness.js'
    );
    return fromSourcePath;
}

/**
 * Transform CommonJS output to ES module format for browser consumption.
 * SWC compiles to CommonJS, but browsers need ES modules for dynamic import.
 */
function transformToESModule(code: string): string {
    // Remove CommonJS boilerplate - handle multiline Object.defineProperty calls
    let result = code
        .replace(/"use strict";\s*/g, '')
        .replace(/Object\.defineProperty\(exports,\s*"__esModule"[\s\S]*?\}\);\s*/g, '')
        .replace(/Object\.defineProperty\(exports,\s*"\w+"[\s\S]*?\}\);\s*/g, '');

    // Remove sourcemap comment for cleaner output
    result = result.replace(/\/\/# sourceMappingURL=.*$/gm, '');

    // Add ES module export at the end
    result += '\nexport { initBenchmark };\n';

    return result;
}

/**
 * Full benchmark harness implementation that gets written to benchmarkHarness.js
 * in generated examples that define getBenchmarkConfig().
 *
 * Source: benchmarkHarness.ts (compiled by Nx build)
 */
export const benchmarkRunner = transformToESModule(fs.readFileSync(getCompiledPath(), 'utf-8'));
