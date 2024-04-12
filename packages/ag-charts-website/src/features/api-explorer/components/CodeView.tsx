import Code from '@components/Code';
import styles from '@legacy-design-system/modules/CodeView.module.scss';

import { formatJson } from '../utils/utils';

/**
 * This renders the code inside the Standalone Charts API Explorer.
 */
export const CodeView = ({ framework, options }) => {
    const codeMap = {
        javascript: VanillaCode,
        angular: AngularCode,
        react: ReactCode,
        vue: VueCode,
    };

    const FrameworkCode = codeMap[framework];

    return <div className={styles.code}>{FrameworkCode && <FrameworkCode options={options} />}</div>;
};

const VanillaCode = ({ options }) => (
    <>
        <Code code={['// Create new chart', `chart = AgCharts.create(${formatJson(options)});`]} />
        <Code code={['// Update existing chart', `AgCharts.update(chart, ${formatJson(options)});`]} />
    </>
);

const ReactCode = ({ options }) => (
    <Code
        code={[`const options = ${formatJson(options)};`, '', '<AgChartsReact options={options} />']}
        language="jsx"
    />
);

const AngularCode = ({ options }) => (
    <>
        <Code code={[`const options = ${formatJson(options)};`]} />
        <Code code={['<ag-charts-angular [options]="options">', '</ag-charts-angular>']} language="html" />
    </>
);

const VueCode = ({ options }) => (
    <>
        <Code code={[`const options = ${formatJson(options)};`]} />
        <Code code={['<ag-charts-vue :options="options"></ag-charts-vue>']} language="html" />
    </>
);
