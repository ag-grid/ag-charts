import { Icon } from '@components/icon/Icon';
import { doOnEnter } from '@utils/doOnEnter';
import styles from './Launcher.module.scss';

interface Props {
    framework: string;
    options: {};

    fullScreen: boolean;
    setFullScreen(fullScreen: boolean): void;

    fullScreenGraph: boolean;
    setFullScreenGraph(fullScreenGraph: boolean): void;
}

export const Launcher = ({
    framework,
    options,
    fullScreen,
    setFullScreen,
    fullScreenGraph,
    setFullScreenGraph,
}: Props) => {
    const nodes = []; // TODO: Get nodes
    const exampleInfo = {}; // TODO: Get example info
    // const exampleInfo = useMemo(
    //     () => buildExampleInfo(nodes, framework, options, useFunctionalReact, useVue3, useTypescript),
    //     [nodes, framework, options, useFunctionalReact, useVue3, useTypescript]
    // );
    const isGenerated = isGeneratedExample(exampleInfo.type);

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
                    // openPlunker(exampleInfo);
                    console.log('TODO: Open plunkr');
                }}
                onKeyDown={(e) =>
                    doOnEnter(e, () => {
                        // openPlunker(exampleInfo);
                        console.log('TODO: Open plunkr');
                    })
                }
                role="button"
                tabIndex={0}
                title="Edit on Plunker"
            >
                <Icon name="plunker" />
            </button>
        </div>
    );
};

const isGeneratedExample = (type) => ['generated', 'mixed', 'typescript'].includes(type);
