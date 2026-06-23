import { dirname, resolve } from 'path';
import * as ts from 'typescript';

import { formatNode } from './type-utils';
import type { NodeTypes } from './types';

const DEFAULT_COMPILER_OPTIONS: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    skipLibCheck: true,
    noEmit: true,
};

// Resolve the compiler options from the nearest tsconfig.json above the input files so the
// Program resolves the package's internal imports; fall back to permissive defaults.
function resolveCompilerOptions(filePaths: string[]): ts.CompilerOptions {
    const configPath = filePaths.length ? ts.findConfigFile(dirname(filePaths[0]), ts.sys.fileExists) : undefined;
    if (!configPath) {
        return DEFAULT_COMPILER_OPTIONS;
    }
    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    const { options } = ts.parseJsonConfigFileContent(config, ts.sys, dirname(configPath));
    return { ...options, skipLibCheck: true, noEmit: true };
}

export class TypeMapper {
    protected nodeMap: Map<string, NodeTypes> = new Map();

    constructor(inputFiles: Iterable<string>) {
        const filePaths = Array.from(inputFiles, (filePath) => resolve(filePath));
        const program = ts.createProgram(filePaths, resolveCompilerOptions(filePaths));
        const checker = program.getTypeChecker();

        // Iterate the inputs in their original order so declaration insertion order — which the
        // downstream resolver's generics handling is sensitive to — matches the prior per-file walk.
        for (const filePath of filePaths) {
            program.getSourceFile(filePath)?.forEachChild((node) => {
                if (ts.isEnumDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
                    this.nodeMap.set(node.name.text, formatNode(node, checker));
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
