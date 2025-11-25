import type { BindingImport } from './parser-utils';

const optionsDotRe = /(?<!\w)options(?:!)?\./g;
const optionsSquareRe = /(?<!\w)options(?:!)?\[/g;

export function toOptionsValue(code) {
    return code.replace(optionsDotRe, 'options.value.');
}

export function wrapOptionsUpdateCode(
    code: string,
    inputVar?: string,
    saveOptions?: string,
    localVar?: string,
    deepClone?: boolean
): string {
    inputVar ??= 'this.options';
    localVar ??= 'options';
    const after = saveOptions ?? `${inputVar} = ${localVar};`;

    let before = `const ${localVar} = {...${inputVar}};`;
    if (deepClone ?? true) {
        before = `const ${localVar} = clone(${inputVar});`;
    }

    if (!optionsDotRe.test(code) && !optionsSquareRe.test(code)) {
        return code;
    }

    return code
        .replace(optionsDotRe, localVar + '.')
        .replace(optionsSquareRe, localVar + '[')
        .replace(/(.*?)\{(.*)\}/s, `$1{\n${before}\n$2\n${after}\n}`);
}

export function getChartImports(imports: BindingImport[], usesChartApi: boolean): string {
    const enterpriseCharts = imports.find((i) => i.module.includes('ag-charts-enterprise'));

    // Collect ALL imports from both community AND enterprise packages
    const allChartsImports = imports
        .filter((i) => i.module.includes('ag-charts-community') || i.module.includes('ag-charts-enterprise'))
        .flatMap((i) => i.imports);

    if (allChartsImports.length > 0) {
        // Only included AgCharts if its api is used. Otherwise it can be removed as AgCharts.create is handled by framework components
        // But if AgCharts.download is used we mustn't remove it.
        const extraImports = [...new Set(allChartsImports)].filter((i) => usesChartApi || i !== 'AgCharts');

        if (extraImports.length > 0) {
            return `import { ${extraImports.join(', ')} } from 'ag-charts-${
                enterpriseCharts ? 'enterprise' : 'community'
            }';`;
        }
    }

    return undefined;
}
