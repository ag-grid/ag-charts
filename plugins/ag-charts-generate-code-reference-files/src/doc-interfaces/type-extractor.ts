import { parseFileContents } from 'ag-shared/plugin-utils';
import prettier from 'prettier';
import * as ts from 'typescript';

export async function extractTypeMap(inputFiles: Iterable<string>) {
    const waitFor = new Map<string, Promise<string>>();

    for (const file of inputFiles) {
        parseFileContents(file).forEachChild((node: ts.Node) => {
            if (ts.isEnumDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
                waitFor.set(node.name.text, printNode(node));
            }
        });
    }

    const typeMap = new Map<string, string>();
    for (const [name, promise] of waitFor) {
        typeMap.set(name, await promise);
    }

    return typeMap;
}

const tsPrinter = ts.createPrinter({ omitTrailingSemicolon: true });
function printNode(node: ts.Node): Promise<string> {
    const rawText = tsPrinter.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
    return prettier.format(rawText, { parser: 'typescript', printWidth: 120 });
}
