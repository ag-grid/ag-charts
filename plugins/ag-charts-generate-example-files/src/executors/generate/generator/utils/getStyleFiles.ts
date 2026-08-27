import fs from 'fs';

import { getFrameworkStyles } from '../styles/getFrameworkStyles';
import type { InternalFramework } from '../types';
import { getFileList } from './fileUtils';

// Relative to root
const EXAMPLE_STYLES_FILE_PATHS = [
    './external/ag-website-shared/src/components/example-runner/styles/example-chart-theme.css',
    './external/ag-website-shared/src/components/example-runner/styles/example-controls.css',
];
const EXAMPLE_STYLE_FILE_NAME = 'ag-example-styles.css';

export const filterStyleFiles = (fileList: string[]) => {
    const styleFiles = fileList.filter((fileName) => fileName.endsWith('.css'));
    return styleFiles;
};

export const getStyleFiles = async ({
    internalFramework,
    folderPath,
    sourceFileList,
}: {
    internalFramework: InternalFramework;
    folderPath: string;
    sourceFileList: string[];
}) => {
    const sharedStyles = EXAMPLE_STYLES_FILE_PATHS.map((filePath) => fs.readFileSync(filePath, 'utf-8')).join('\n');
    const exampleStyle = sharedStyles + getFrameworkStyles(internalFramework);
    const exampleStyleContents = {
        [EXAMPLE_STYLE_FILE_NAME]: exampleStyle,
    };
    const styleFiles = filterStyleFiles(sourceFileList);

    const styleFileContents = await getFileList({
        folderPath,
        fileList: styleFiles,
    });

    const styleContents = Object.assign({}, exampleStyleContents, styleFileContents);

    return styleContents;
};
