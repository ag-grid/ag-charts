import { Icon } from '@components/icon/Icon';
import { openPlunker } from '@features/plunkr/utils/plunkr';
import { doOnEnter } from '@utils/doOnEnter';

import styles from './Launcher.module.scss';
import { getJavascriptContent, getPlunkrHtml } from './templates';

interface Props {
    options: {};

    fullScreen: boolean;
    setFullScreen(fullScreen: boolean): void;

    fullScreenGraph: boolean;
    setFullScreenGraph(fullScreenGraph: boolean): void;

    siteUrl: string;
}

export const Launcher = ({
    options,
    fullScreen,
    setFullScreen,
    fullScreenGraph,
    setFullScreenGraph,
    siteUrl,
}: Props) => {
    return (
        <div className={styles.launcher}>
            <button
                className="button-style-none"
                onClick={() => setFullScreenGraph(!fullScreenGraph)}
                onKeyDown={(e) => doOnEnter(e, () => setFullScreenGraph(!fullScreenGraph))}
                role="button"
                tabIndex={0}
                title="Open chart preview fullscreen"
            >
                <Icon name="docs-integrated-charts" />
            </button>
            <button
                className="button-style-none"
                onClick={() => setFullScreen(!fullScreen)}
                onKeyDown={(e) => doOnEnter(e, () => setFullScreen(!fullScreen))}
                role="button"
                tabIndex={0}
                title={fullScreen ? 'Exit fullscreen' : 'Open fullscreen'}
            >
                {fullScreen ? <Icon name="minimize" /> : <Icon name="maximize" />}
            </button>
            <button
                className="button-style-none"
                onClick={() => {
                    const contents = getJavascriptContent({ options });
                    const plunkrHtml = getPlunkrHtml({ contents, siteUrl, modifiedTimeMs: Date.now() });
                    const plunkrExampleFiles = {
                        ...contents.files,
                        'index.html': plunkrHtml,
                    };
                    openPlunker({
                        title: 'API Explorer Example',
                        files: plunkrExampleFiles,
                        fileToOpen: 'main.js',
                    });
                }}
                role="button"
                tabIndex={0}
                title="Edit on Plunker"
            >
                <Icon name="plunker" />
            </button>
        </div>
    );
};
