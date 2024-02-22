export declare function styleAsObject(styles: string): {};
export declare function convertStyles(code: string): string;
export declare function convertTemplate(template: string): string;
export declare function convertFunctionalTemplate(template: string): string;
export declare const getImport: (filename: string) => string;
export declare const getValueType: (value: string) => string;
export declare const convertFunctionToConstCallback: (code: string, callbackDependencies: {}) => string;
export declare const convertFunctionToConstCallbackTs: (code: string, callbackDependencies: {}) => string;
