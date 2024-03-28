export declare const toInput: (property: any) => string;
export declare const toConst: (property: any) => string;
export declare const toOutput: (event: any) => string;
export declare const toMember: (property: any) => string;
export declare const toComponent: (property: any) => string;
export declare function toAssignment(property: any): string;
export declare function getImport(filename: string, tokenReplace: any, replaceValue: any): string;
export declare function indentTemplate(template: string, spaceWidth: number, start?: number): string;
export declare function convertTemplate(template: string): string;
