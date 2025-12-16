import type { ChartExplorerExample } from '@ag-website-shared/components/landing-pages/types';
import Code from '@ag-website-shared/components/code/Code';
import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';

import { getExampleContentsUrl, getExampleRunnerExampleUrl } from '@components/gallery/utils/urlPaths';
import styles from './ChartExplorer.module.scss';

interface Props {
    examples: ChartExplorerExample[];
    height?: number;
    analyticsPrefix: string;
}

const queryClient = new QueryClient();

const queryOptions = {
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
};

const ChartExplorerInner = ({ examples, height = 500, analyticsPrefix }: Props) => {
    const [selectedExample, setSelectedExample] = useState(examples[0]);
    const [mainCode, setMainCode] = useState<string>('// Loading...');
    const [codeWidth, setCodeWidth] = useState(50); // percentage
    const resizeRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    // Fetch example contents
    const { data: contents, isLoading } = useQuery(
        ['chartExplorerContents', selectedExample.exampleName],
        () =>
            fetch(getExampleContentsUrl({ exampleName: selectedExample.exampleName }))
                .then((res) => res.json()),
        queryOptions
    );

    // Extract main code file when contents load
    useEffect(() => {
        if (contents?.files && contents?.mainFileName) {
            const code = contents.files[contents.mainFileName] || '// No code available';
            setMainCode(code);
        }
    }, [contents]);

    const iframeUrl = getExampleRunnerExampleUrl({ exampleName: selectedExample.exampleName });

    // Handle resize
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !resizeRef.current) return;
        const container = resizeRef.current.parentElement;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const sidebarWidth = 200; // Fixed sidebar width
        const availableWidth = containerRect.width - sidebarWidth;
        const mouseX = e.clientX - containerRect.left - sidebarWidth;
        const newWidth = Math.min(Math.max((mouseX / availableWidth) * 100, 20), 80);
        setCodeWidth(newWidth);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className={styles.chartExplorer} style={{ '--chart-height': `${height}px` } as React.CSSProperties}>
            {/* Sidebar with chart list */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>Charts</div>
                <ul className={styles.chartList}>
                    {examples.map((example) => (
                        <li key={example.exampleName}>
                            <button
                                className={`${styles.chartButton} ${
                                    selectedExample.exampleName === example.exampleName ? styles.active : ''
                                } plausible-event-name=${analyticsPrefix}-explorer-${example.exampleName}`}
                                onClick={() => setSelectedExample(example)}
                            >
                                {example.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main content area with code and preview */}
            <div className={styles.mainContent} ref={resizeRef}>
                {/* Code panel */}
                <div className={styles.codePanel} style={{ width: `${codeWidth}%` }}>
                    <div className={styles.codePanelHeader}>
                        <span className={styles.fileName}>{contents?.mainFileName || 'main.ts'}</span>
                    </div>
                    <div className={styles.codeContent}>
                        {isLoading ? (
                            <div className={styles.loading}>Loading...</div>
                        ) : (
                            <Code code={mainCode} language="ts" lineNumbers={true} />
                        )}
                    </div>
                </div>

                {/* Resize handle */}
                <div className={styles.resizeHandle} onMouseDown={handleMouseDown}>
                    <div className={styles.resizeHandleBar} />
                </div>

                {/* Chart preview */}
                <div className={styles.chartPanel} style={{ width: `${100 - codeWidth}%` }}>
                    <div className={styles.chartPanelHeader}>Preview</div>
                    <div className={styles.chartContent}>
                        <iframe
                            title={`${selectedExample.name} Chart Preview`}
                            src={iframeUrl}
                            className={`${styles.chartIframe} exampleRunner`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ChartExplorer = (props: Props) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ChartExplorerInner {...props} />
        </QueryClientProvider>
    );
};
