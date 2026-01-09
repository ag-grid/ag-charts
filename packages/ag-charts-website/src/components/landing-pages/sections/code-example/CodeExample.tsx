import Code from '@ag-website-shared/components/code/Code';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { useState } from 'react';

import styles from './CodeExample.module.scss';

interface Props {
    code: string;
    language?: 'js' | 'ts' | 'jsx' | 'json' | 'html' | 'css' | 'bash';
    fileName?: string;
}

export const CodeExample = ({ code, language = 'ts', fileName = 'main.tsx' }: Props) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API may fail in certain contexts (e.g., iframe restrictions)
        }
    };

    return (
        <div className={styles.codeExampleContainer}>
            {/* Window header with traffic lights and filename */}
            <div className={styles.windowHeader}>
                <div className={styles.trafficLights}>
                    <span className={styles.trafficLightRed} />
                    <span className={styles.trafficLightYellow} />
                    <span className={styles.trafficLightGreen} />
                </div>
                <span className={styles.fileName}>{fileName}</span>
                <button
                    onClick={() => void handleCopy()}
                    className={styles.copyButton}
                    aria-label={copied ? 'Copied' : 'Copy code'}
                >
                    {copied ? (
                        <>
                            <Icon name="check" className={styles.copyIcon} />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <Icon name="copy" className={styles.copyIcon} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code content */}
            <div className={styles.codeContent}>
                <Code code={code} language={language} lineNumbers={true} />
            </div>
        </div>
    );
};
