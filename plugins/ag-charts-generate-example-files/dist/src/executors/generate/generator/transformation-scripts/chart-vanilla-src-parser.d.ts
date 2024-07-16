import type { ExampleSettings } from '../types';
export declare function parser({ srcFile, html, exampleSettings, }: {
    srcFile: string;
    html: string;
    exampleSettings: ExampleSettings;
}): {
    bindings: any;
    typedBindings: any;
};
export declare function internalParser(js: any, html: any, exampleSettings: any): any;
export default parser;
