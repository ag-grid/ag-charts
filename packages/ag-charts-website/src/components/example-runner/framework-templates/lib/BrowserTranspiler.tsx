import {
    ASSET_REGEX,
    COMPILER_OPTION_NAMES,
    CSS_IMPORT_REGEX,
    EXTENSIONS,
    SPECIFIER_REGEX,
    STYLESHEET_LOADER_NAME,
} from '@utils/example-modules/transformExampleModule';
import ts from 'typescript';

import { ExampleRunnerCall } from './ExampleRunnerClient';

interface Props {
    /** The example's entry file, as authored -- `main.ts`, not `main.js` */
    entryFileName: string;
}

/** Pinned to the version the repository builds with, so the two transpilers cannot drift */
const TYPESCRIPT_URL = `https://cdn.jsdelivr.net/npm/typescript@${ts.version}/lib/typescript.js`;

/** Extensions to try for a specifier that names a module without saying which kind */
const MODULE_EXTENSIONS = [...EXTENSIONS, '.js'];

/** A relative specifier that already names a module the loader can fetch as-is */
const MODULE_EXTENSION_REGEX = /\.(tsx?|jsx?|mjs|cjs)$/i;

/** The per-example data the in-page transpiler needs; the code itself lives in the runtime */
export const getTranspilerOptions = (entryFileName: string) => ({
    entry: `./${entryFileName}`,
    specifierRegex: SPECIFIER_REGEX.source,
    cssImportRegex: CSS_IMPORT_REGEX.source,
    assetRegex: ASSET_REGEX.source,
    moduleExtensionRegex: MODULE_EXTENSION_REGEX.source,
    moduleExtensions: MODULE_EXTENSIONS,
    compilerOptions: COMPILER_OPTION_NAMES,
    stylesheetLoaderName: STYLESHEET_LOADER_NAME,
});

/** Transpiles the example in the page, which is what an export with no build step needs */
export const BrowserTranspiler = ({ entryFileName }: Props) => (
    <>
        <script src={TYPESCRIPT_URL} crossOrigin="anonymous" />
        <ExampleRunnerCall fn="runTranspiled" args={[getTranspilerOptions(entryFileName)]} />
    </>
);
