import fs from 'fs';

import { getFrameworkStyles } from '../styles/getFrameworkStyles';
import type { InternalFramework } from '../types';
import { getFileList } from './fileUtils';

// Relative to root
const EXAMPLE_STYLES_FILE_PATH =
    './external/ag-website-shared/src/components/example-runner/styles/example-controls.css';
const EXAMPLE_STYLE_FILE_NAME = 'ag-example-styles.css';

export const getStyleFiles = async ({
    internalFramework,
    folderPath,
    sourceFileList,
}: {
    internalFramework: InternalFramework;
    folderPath: string;
    sourceFileList: string[];
}) => {
    const exampleControlsStyles = fs.readFileSync(EXAMPLE_STYLES_FILE_PATH, 'utf-8');
    const exampleStyle = exampleControlsStyles + getFrameworkStyles(internalFramework);
    const exampleStyleContents = {
        [EXAMPLE_STYLE_FILE_NAME]: exampleStyle,
    };
    const styleFiles = sourceFileList.filter((fileName) => fileName.endsWith('.css'));

    const styleFileContents = await getFileList({
        folderPath,
        fileList: styleFiles,
    });

    const styleContents = Object.assign({}, exampleStyleContents, styleFileContents);

    return styleContents;
};
