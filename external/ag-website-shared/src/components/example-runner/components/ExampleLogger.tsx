import { type FunctionComponent, useEffect, useState } from 'react';

import styles from './ExampleLogger.module.scss';

interface Log {
    type: 'console-log';
    pageName: string;
    exampleName: string;
    data: any[];
}

interface Props {
    exampleName: string;
    bufferSize?: number;
}

export const ExampleLogger: FunctionComponent<Props> = ({ exampleName, bufferSize = 10 }) => {
    const [logs, setLogs] = useState<Log[]>([]);

    useEffect(() => {
        const updateLogs = (event: MessageEvent) => {
            if (event.data?.type === 'console-log' && event.data.exampleName === exampleName) {
                setLogs((prevLogs) => {
                    return [event.data, ...prevLogs].slice(0, bufferSize);
                });
            }
        };

        window.addEventListener('message', updateLogs);

        return () => {
            window.removeEventListener('message', updateLogs);
        };
    }, []);

    return (
        <pre className={styles.logger}>
            {logs.map((log, i) => (
                <div key={i}>{log.data}</div>
            ))}
        </pre>
    );
};
