import * as ts from 'typescript';

import { formatNode } from './type-utils';
import type { NodeTypes } from './types';

// Inlined instead of importing `parseFileContents` from `ag-shared/plugin-utils`
// because ag-shared ships its own typescript@^5.8 install; using the helper made
// the SourceFile's Node nominally different from this plugin's local ts.Node.
function parseFileContents(contents: string) {
    return ts.createSourceFile('tempFile.ts', contents, ts.ScriptTarget.Latest, true);
}

export class TypeMapper {
    protected nodeMap: Map<string, NodeTypes> = new Map();

    constructor(inputFiles: Iterable<string>) {
        for (const file of inputFiles) {
            parseFileContents(file).forEachChild((node) => {
                if (ts.isEnumDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
                    this.nodeMap.set(node.name.text, formatNode(node));
                }
                return undefined;
            });
        }
    }

    entries() {
        return this.nodeMap.entries();
    }

    get(key: string) {
        return this.nodeMap.get(key);
    }

    has(key: string) {
        return this.nodeMap.has(key);
    }

    toJSON() {
        return Object.fromEntries(Array.from(this.nodeMap.entries()).sort());
    }
}
