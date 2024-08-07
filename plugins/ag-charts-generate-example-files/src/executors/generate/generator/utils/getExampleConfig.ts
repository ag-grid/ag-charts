import fs from 'fs/promises';
import path from 'path';

import type { ExampleConfig } from '../types';

const EXAMPLE_CONFIG_FILENAME = 'exampleConfig.json';

export const getExampleConfig = async ({
    folderPath,
    sourceFileList,
}: {
    folderPath: string;
    sourceFileList: string[];
}): Promise<ExampleConfig> => {
    const exampleConfigFiles = sourceFileList.filter((fileName) => fileName === EXAMPLE_CONFIG_FILENAME);

    if (!exampleConfigFiles.length) {
        return {};
    }

    const contents = await fs.readFile(path.join(folderPath, EXAMPLE_CONFIG_FILENAME));

    return JSON.parse(contents.toString());
};
