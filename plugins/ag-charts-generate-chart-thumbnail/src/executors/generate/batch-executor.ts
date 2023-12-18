import { versions } from 'process';

import { batchExecutor, batchWorkerExecutor } from '../../executors-utils';
import { generateFiles } from './executor';

let executor;
if (versions.node < '18.18') {
    // eslint-disable-next-line no-console
    console.warn('Upgrade Node.js to v18.18.0 for multi-threaded thumbnail generation; found: ' + versions.node);
    executor = batchExecutor(generateFiles);
} else {
    executor = batchWorkerExecutor(`${module.path}/batch-instance.js`);
}

export default executor;
