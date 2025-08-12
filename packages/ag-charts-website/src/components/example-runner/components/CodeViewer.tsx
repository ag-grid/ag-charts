import type { InternalFramework } from '@ag-grid-types';
import Code from '@ag-website-shared/components/code/Code';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { CONSOLE_LOG_REGEX, DARK_MODE_REGEX } from '@ag-website-shared/utils/extraCodeSnippets';
import type { ExampleType, FileContents } from '@components/example-generator/types';
import { doOnEnter } from '@utils/doOnEnter';
import classnames from 'classnames';
import { useEffect, useState } from 'react';

import { E2E_STYLE_END, E2E_STYLE_START } from '../constants';
import { CodeOptions } from './CodeOptions';
import styles from './CodeViewer.module.scss';

const ExtensionMap = {
    sh: 'bash',
    vue: 'html',
    tsx: 'jsx',
    json: 'js',
};

function getSnippetRegex({ startDelimiter, endDelimiter }: { startDelimiter: string; endDelimiter: string }) {
    const escapedStart = startDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedEnd = endDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\s*${escapedStart}[\\s\\S]*?${escapedEnd}\\s*`, 'g');

    return regex;
}

export function stripOutExampleGeneratorCode(files: FileContents) {
    const mainFiles = ['main.js', 'main.ts', 'index.tsx', 'index.jsx', 'app.component.ts'];
    mainFiles.forEach((mainFile) => {
        if (files[mainFile]) {
            files[mainFile] = files[mainFile].replace(DARK_MODE_REGEX, '').replace(CONSOLE_LOG_REGEX, '').trim() + '\n';
        }
    });

    const e2eStyleRegex = getSnippetRegex({ startDelimiter: E2E_STYLE_START, endDelimiter: E2E_STYLE_END });

    if (files['index.html']) {
        files['index.html'] = files['index.html']?.replace(e2eStyleRegex, '').trim();
    }
}

/**
 * This renders the code viewer in the example runner.
 */
export const CodeViewer = ({
    id,
    isActive,
    files,
    initialSelectedFile,
    exampleType,
    internalFramework,
    hideInternalFrameworkSelection,
}: {
    id: string;
    isActive?: boolean;
    files: FileContents;
    initialSelectedFile: string;
    internalFramework: InternalFramework;
    exampleType: ExampleType;
    hideInternalFrameworkSelection?: boolean;
}) => {
    const [activeFile, setActiveFile] = useState(initialSelectedFile);
    const [showFiles, setShowFiles] = useState(true);

    const [exampleFiles, setExampleFiles] = useState<FileContents>({ ...files });

    useEffect(() => {
        const newFiles = { ...files };

        stripOutExampleGeneratorCode(newFiles);
        setExampleFiles(newFiles);
    }, [files]);

    useEffect(() => {
        setActiveFile(initialSelectedFile);
    }, [initialSelectedFile]);

    return (
        <div
            className={classnames(styles.codeViewer, styles.codeViewerBorder, {
                [styles.hidden]: !isActive,
                [styles.hideFiles]: !showFiles,
            })}
        >
            <div className={styles.mobileHeader}>
                <button
                    className={'button-style-none button-as-link'}
                    onClick={() => {
                        setShowFiles((prevShowFiles) => !prevShowFiles);
                    }}
                >
                    {showFiles ? (
                        <span>
                            Hide files
                            <Icon name="arrowLeft" />
                        </span>
                    ) : (
                        <span>
                            Show files
                            <Icon name="arrowRight" />
                        </span>
                    )}
                </button>
                <span>
                    <span className="text-secondary">Viewing: </span>
                    {activeFile}
                </span>
            </div>
            <div className={styles.inner}>
                <div className={styles.files}>
                    <ul className="list-style-none">
                        {Object.keys(exampleFiles).map((path) => (
                            <FileItem
                                key={path}
                                path={path}
                                isActive={activeFile === path}
                                onClick={() => {
                                    setActiveFile(path);
                                }}
                            />
                        ))}
                    </ul>
                    {!hideInternalFrameworkSelection && (
                        <CodeOptions id={id} internalFramework={internalFramework} exampleType={exampleType} />
                    )}
                </div>
                <div className={styles.code}>
                    {!exampleFiles && <FileView path={'loading.js'} code={'// Loading...'} />}
                    {exampleFiles && activeFile && exampleFiles[activeFile] && (
                        <FileView key={activeFile} path={activeFile} code={exampleFiles[activeFile]} />
                    )}
                </div>
            </div>
        </div>
    );
};

const FileItem = ({ path, isActive, onClick }) => (
    <li>
        <button
            className={classnames('button-style-none', styles.file, { [styles.isActive]: isActive })}
            title={path}
            onClick={onClick}
            onKeyDown={(e) => doOnEnter(e, onClick)}
            tabIndex={0}
        >
            {path}
        </button>
    </li>
);

const FileView = ({ path, code }) => {
    const parts = path.split('.');
    const extension = parts[parts.length - 1];

    return <Code code={code} language={ExtensionMap[extension] || extension} lineNumbers={true} />;
};
