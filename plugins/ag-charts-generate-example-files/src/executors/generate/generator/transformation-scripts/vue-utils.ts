import { recognizedDomEvents } from './parser-utils';
import { toKebabCase, toTitleCase } from './string-utils';

export const toInput = (property) => `:${property.name}="${property.name}"`;
export const toConst = (property) => `:${property.name}="${property.value}"`;
export const toOutput = (event) => `@${toKebabCase(event.name)}="${event.handlerName}"`;
export const toMember = (property) => `${property.name}: null`;
export const toComponent = (property) => `'${property.name}': ${property.name}`;

export function toAssignment(property: any): string {
    // convert to arrow functions
    const value = property.value.replace(/function\s*\(([^)]+)\)/, '($1) =>');

    return `this.${property.name} = ${value}`;
}

export function getImport(filename: string, tokenReplace, replaceValue) {
    let componentName = filename.split('.')[0];
    if (tokenReplace) {
        componentName = componentName.replace(tokenReplace, replaceValue);
    }
    return `import ${toTitleCase(componentName)} from './${filename}';`;
}

export function convertTemplate(template: string) {
    recognizedDomEvents.forEach((event) => {
        template = template.replace(new RegExp(`on${event}=`, 'g'), `v-on:${event}=`);
    });

    template = template.replace(/\(event\)/g, '($event)');

    // re-indent
    return template
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .join('\n        ');
}
