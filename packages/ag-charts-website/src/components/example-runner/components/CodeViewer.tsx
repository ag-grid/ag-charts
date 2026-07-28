import type { InternalFramework } from '@ag-grid-types';
import Code from '@ag-website-shared/components/code/Code';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import type { ExampleType, FileContents } from '@components/example-generator/types';
import { doOnEnter } from '@utils/doOnEnter';
import classnames from 'classnames';
import { useEffect, useState } from 'react';

import { CodeOptions } from './CodeOptions';
import styles from './CodeViewer.module.scss';
import { stripOutExampleGeneratorCode } from './stripOutExampleGeneratorCode';

const ExtensionMap = {
    sh: 'bash',
    vue: 'html',
    tsx: 'jsx',
    json: 'js',
};

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

    return <Code code={code} language={ExtensionMap[extension] ?? extension} lineNumbers={true} />;
};
