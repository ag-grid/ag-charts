import { Icon } from '../../../components/icon/Icon';
import React from 'react';
import styles from './CodeOptions.module.scss';
import { isGeneratedExample } from '../../examples-generator/utils/isGeneratedExample';
import { isReactInternalFramework, isVueInternalFramework } from '../../../utils/framework';

type SelectorType = 'typescript' | 'react' | 'vue';
interface SelectorConfig {
    label: string;
    labelValues: Record<string, string>;
}

const SELECTOR_CONFIG: Record<SelectorType, SelectorConfig> = {
    typescript: {
        label: 'Language',
        labelValues: {
            Javascript: 'vanilla',
            Typescript: 'typescript',
        },
    },
    react: {
        label: 'Language',
        labelValues: {
            Classes: 'react',
            Hooks: 'reactFunctional',
            'Hooks TS': 'reactFunctionalTs',
        },
    },
    vue: {
        label: 'Version',
        labelValues: {
            'Vue 2': 'vue',
            'Vue 3': 'vue3',
        },
    },
};

function CodeOptionSelector({
    id,
    type,
    internalFramework,
    setInternalFramework,
    tracking,
}: {
    id: string;
    type: SelectorType;
    internalFramework: InternalFramework;
    setInternalFramework: (internalFramework: InternalFramework) => void;
    tracking?: (value: string) => void;
}) {
    const formId = `${id}-${type}-style-selector`;
    const config = SELECTOR_CONFIG[type];
    const onChange = (event) => {
        const value = event.target.value;
        if (value === internalFramework) {
            return;
        }
        setInternalFramework(value);
    };

    return (
        <div>
            <label className="font-size-small" htmlFor={formId}>
                {config.label}:
            </label>{' '}
            <select
                className={styles.simpleSelect}
                id={formId}
                value={internalFramework}
                onChange={(event) => {
                    onChange(event);
                    tracking && tracking(event.target.value);
                }}
                onBlur={onChange}
            >
                {Object.keys(config.labelValues).map((label) => {
                    return (
                        <option key={label} value={config.labelValues[label]}>
                            {label}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}

export const CodeOptions = ({ id, internalFramework, setInternalFramework, exampleType }) => {
    const isGenerated = isGeneratedExample(exampleType);

    const showTypescriptSelector =
        (isGenerated || exampleType === 'multi') &&
        (internalFramework === 'vanilla' || internalFramework === 'typescript');
    const showReactSelector = isReactInternalFramework(internalFramework);
    const showVueSelector = isVueInternalFramework(internalFramework);
    const nothingToShow = !(showTypescriptSelector || showReactSelector || showVueSelector);

    return nothingToShow ? null : (
        <div className={styles.outer}>
            {showTypescriptSelector && (
                <CodeOptionSelector
                    id={id}
                    type="typescript"
                    internalFramework={internalFramework}
                    setInternalFramework={setInternalFramework}
                />
            )}
            {showReactSelector && (
                <CodeOptionSelector
                    id={id}
                    type="react"
                    internalFramework={internalFramework}
                    setInternalFramework={setInternalFramework}
                />
            )}

            {showVueSelector && (
                <CodeOptionSelector
                    id={id}
                    type="vue"
                    internalFramework={internalFramework}
                    setInternalFramework={setInternalFramework}
                />
            )}
        </div>
    );
};
