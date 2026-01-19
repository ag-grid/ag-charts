import { parseFileContents } from 'ag-shared/plugin-utils';
import * as ts from 'typescript';

import { formatNode } from './type-utils';
import type { NodeTypes } from './types';

export class TypeMapper {
    protected nodeMap: Map<string, NodeTypes> = new Map();

    constructor(inputFiles: Iterable<string>) {
        for (const file of inputFiles) {
            parseFileContents(file).forEachChild((node: ts.Node) => {
                if (ts.isEnumDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
                    this.nodeMap.set(node.name.text, formatNode(node));
                }
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
