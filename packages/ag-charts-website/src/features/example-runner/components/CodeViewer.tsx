import classnames from 'classnames';
import { useEffect, useState } from 'react';
import Code from '@components/Code';
import { doOnEnter } from '@utils/doOnEnter';
import { Icon } from '@components/icon/Icon';
import { CodeOptions } from './CodeOptions';
import styles from './CodeViewer.module.scss';
import type { InternalFramework } from '@ag-grid-types';
import type { ExampleType, FileContents } from '@features/examples-generator/types';

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

    const exampleFiles = Object.keys(files);

    useEffect(() => {
        setActiveFile(initialSelectedFile);
    }, [initialSelectedFile]);

    return (
        <div className={classnames(styles.codeViewer, { [styles.hidden]: !isActive, [styles.hideFiles]: !showFiles })}>
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
                        {exampleFiles.map((path) => (
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
                    {!files && <FileView path={'loading.js'} code={'// Loading...'} />}
                    {files && activeFile && files[activeFile] && (
                        <FileView key={activeFile} path={activeFile} code={files[activeFile]} />
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
            tabIndex="0"
        >
            {path}
        </button>
    </li>
);

const ExtensionMap = {
    sh: 'bash',
    vue: 'html',
    tsx: 'jsx',
    json: 'js',
};

const FileView = ({ path, code }) => {
    const parts = path.split('.');
    const extension = parts[parts.length - 1];

    return <Code code={code} language={ExtensionMap[extension] || extension} lineNumbers={true} />;
};
