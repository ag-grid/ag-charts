import { execSync } from 'child_process';

export async function get() {
    const buildDate = new Date();
    const hash = execSync('git rev-parse HEAD').toString().replace(/\s/gm, '');
    const shortHash = execSync('git rev-parse --short HEAD').toString().replace(/\s/gm, '');
    const gitDate = execSync('git --no-pager log -1 --format="%ai"').toString().replace(/\s/gm, '');

    const response = {
        buildDate,
        git: {
            hash,
            shortHash,
            date: gitDate,
        },
    };
    const body = JSON.stringify(response);

    return {
        body,
    };
}
