import { type FunctionComponent, useEffect, useState } from 'react';

import styles from './ExampleLogger.module.scss';

interface Log {
    type: 'console-log';
    pageName?: string;
    exampleName: string;
    data: any[];
}

interface Props {
    exampleName: string;
    bufferSize?: number;
}

const IGNORED_MESSAGES = ['Angular is running in development mode.'];

function containsIgnoredMessage(log: Log) {
    return log.data.some((message) => IGNORED_MESSAGES.some((ignoredMessage) => message.includes(ignoredMessage)));
}

export const ExampleLogger: FunctionComponent<Props> = ({ exampleName, bufferSize = 10 }) => {
    const [logs, setLogs] = useState<Log[]>([]);

    useEffect(() => {
        const updateLogs = (event: MessageEvent) => {
            const log = event.data;
            if (log?.type === 'console-log' && log.exampleName === exampleName && !containsIgnoredMessage(log)) {
                setLogs((prevLogs) => {
                    return [log, ...prevLogs].slice(0, bufferSize);
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
            {logs.length === 0 && <div className={styles.noLogs}>Console logs from the example shown here...</div>}
            {logs.map((log, i) => (
                <div key={i}>{log.data}</div>
            ))}
        </pre>
    );
};
