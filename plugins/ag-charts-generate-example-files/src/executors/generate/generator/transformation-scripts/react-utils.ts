import * as JSON5 from 'json5';

import { recognizedDomEvents } from './parser-utils';

const toTitleCase = (value: string) => value[0].toUpperCase() + value.slice(1);
const toCamelCase = (value: string) => value.replace(/(?:-)(\w)/g, (_, c: string) => (c ? c.toUpperCase() : ''));

export function styleAsObject(styles: string) {
    return styles.split(';').reduce((obj, declaration) => {
        const [property, value] = declaration.split(':');
        if (value) {
            obj[toCamelCase(property.trim())] = value.trim();
        }
        return obj;
    }, {});
}

export function convertStyles(code: string) {
    return code.replace(/style=['"](.+?);?['"]/g, (_, styles) => {
        return `style={${JSON.stringify(styleAsObject(styles))}}`;
    });
}

export function convertTemplate(template: string) {
    // React events are case sensitive, so need to ensure casing is correct
    const caseSensitiveEvents = {
        dragover: 'onDragOver',
        dragstart: 'onDragStart',
    };

    recognizedDomEvents.forEach((event) => {
        const jsEvent = caseSensitiveEvents[event] || `on${toTitleCase(event)}`;
        const matcher = new RegExp(`on${event}="(\\w+)\\((.*?)\\)"`, 'g');

        template = template.replace(matcher, `${jsEvent}={() => this.$1($2)}`);
    });

    template = template
        .replace(/,\s+event([),])/g, '$1')
        .replace(/<input (.+?[^=])>/g, '<input $1 />')
        .replace(/<input (.*)value=/g, '<input $1defaultValue=')
        .replace(/ class=/g, ' className=')
        .replace(/ for=/g, ' htmlFor=')
        .replace(/ <option (.*)selected=""/g, '<option $1selected={true}');

    if (Array.from(template.matchAll(/<AgCharts/g)).length > 1) {
        template = `<Fragment>\n${template}\n</Fragment>`;
    }

    return convertStyles(template);
}

export function convertFunctionalTemplate(template: string) {
    // React events are case sensitive, so need to ensure casing is correct
    const caseSensitiveEvents = {
        dragover: 'onDragOver',
        dragstart: 'onDragStart',
    };

    recognizedDomEvents.forEach((event) => {
        const jsEvent = caseSensitiveEvents[event] || `on${toTitleCase(event)}`;
        const matcher = new RegExp(`on${event}="(\\w+)\\((.*?)\\)"`);

        // if an action takes params then we'll convert it - ie onClick={() => action(params)}
        // otherwise we simplify it to onClick={action}
        let meta;
        do {
            meta = matcher.exec(template);
            if (meta) {
                // 0 original call, 1 function name, 2 arguments
                if (meta[2]) {
                    template = template.replace(matcher, `${jsEvent}={() => $1($2)}`);
                } else {
                    template = template.replace(matcher, `${jsEvent}={$1}`);
                }
            }
        } while (meta);

        template = template.replace(matcher, `${jsEvent}={() => $1($2)}`);
    });

    template = template
        .replace(/,\s+event([),])/g, '$1')
        .replace(/<input (.+?[^=])>/g, '<input $1 />')
        .replace(/<input (.*)value=/g, '<input $1defaultValue=')
        .replace(/ class=/g, ' className=')
        .replace(/ for=/g, ' htmlFor=')
        // when using fontawesome just use "class" instead - it's always the case that we're treating it as a raw value
        // I had some fancy regex here to exclude rows with <i class but I thought this was easier to grok and maintain
        .replace(/<i className=/g, '<i class=')
        .replace(/ <option (.*)selected=""/g, '<option $1selected={true}');

    if (Array.from(template.matchAll(/<AgCharts/g)).length > 1) {
        template = `<Fragment>\n${template}\n</Fragment>`;
    }

    return convertStyles(template);
}

export const getImport = (filename: string) => `import ${toTitleCase(filename.split('.')[0])} from './${filename}';`;

export const getValueType = (value: string) => {
    let type = 'object';
    try {
        type = typeof JSON5.parse(value);
    } catch (_) {
        // if it's something we can't parse we'll assume an object
    }
    return type;
};
