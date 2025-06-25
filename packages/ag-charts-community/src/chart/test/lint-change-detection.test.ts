import { execSync } from 'child_process';
import path from 'path';

describe('aglint/change-detection', () => {
    const lintDataFile = path.resolve(__dirname, 'lint-change-detection.data.ts');
    const eslintConfigFile = path.resolve(__dirname, 'lint-change-detection-eslint-config.mjs');

    it('should match the expected linting errors snapshot', () => {
        let stdout: string | undefined;
        let stderr: string | undefined;

        try {
            // eslint-disable-next-line sonarjs/os-command
            stdout = execSync(`npx eslint -c ${eslintConfigFile} ${lintDataFile}`, { encoding: 'utf-8', stdio: 'pipe' });
            stderr = '';
        } catch (error: any) {
            stdout = error.stdout;
            stderr = error.stderr;
        }
        expect({ stdout, stderr }).toMatchSnapshot();
    });
});
