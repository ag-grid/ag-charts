import { batchExecutor, batchWorkerExecutor } from 'ag-shared/plugin-utils';
import { versions } from 'process';

import { generateFiles } from './executor';

let executor;
if (versions.node < '18.18') {
    // eslint-disable-next-line no-console
    console.warn('Upgrade Node.js to v18.18.0 for multi-threaded thumbnail generation; found: ' + versions.node);
    executor = batchExecutor(generateFiles);
} else {
    // Generous per-task budget: a task renders every theme x DPI variant, and tail tasks on
    // contended CI runners have been observed stalling well past the worker's 60s default.
    executor = batchWorkerExecutor(`${module.path}/batch-instance.js`, undefined, 120_000);
}

export default executor;
