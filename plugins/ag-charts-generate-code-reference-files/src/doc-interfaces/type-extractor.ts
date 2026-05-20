import prettier from 'prettier';
import * as ts from 'typescript';

// Inlined instead of importing `parseFileContents` from `ag-shared/plugin-utils`
// because ag-shared ships its own typescript@^5.8 install; using the helper made
// the SourceFile's Node nominally different from this plugin's local ts.Node.
function parseFileContents(contents: string) {
    return ts.createSourceFile('tempFile.ts', contents, ts.ScriptTarget.Latest, true);
}

export async function extractTypeMap(inputFiles: Iterable<string>) {
    const waitFor = new Map<string, Promise<string>>();

    for (const file of inputFiles) {
        parseFileContents(file).forEachChild((node) => {
            if (ts.isEnumDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
                waitFor.set(node.name.text, printNode(node));
            }
            return undefined;
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
