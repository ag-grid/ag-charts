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

// Steps over whole attributes, so a word inside an attribute value (`placeholder="a disabled input"`) is not matched.
const attributesBefore = (tag: string) => `(<${tag}(?:\\s+[\\w:-]+(?:="[^"]*"|='[^']*')?)*?\\s+)`;

/** Boolean attributes become JSX expressions and uncontrolled inputs use default* props. */
function convertBooleanAttributes(template: string) {
    return template
        .replace(new RegExp(`${attributesBefore('input')}checked(?:="[^"]*")?(?=[\\s/>])`, 'g'), '$1defaultChecked')
        .replace(
            new RegExp(`${attributesBefore('[a-z][\\w-]*')}disabled(?:="[^"]*")?(?=[\\s/>])`, 'g'),
            '$1disabled={true}'
        );
}

export function convertTemplate(template: string) {
    template = convertBooleanAttributes(template);

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

// Handler arguments are untyped HTML attributes, so assert each to the type the handler declares.
function typeHandlerArgs(handler: string, args: string): string {
    return (
        args
            .split(',')
            // `target` is an `EventTarget`; the element the handler is on is what `this` was in the HTML attribute
            .map((arg, index) =>
                /^\s*event\.currentTarget\.(value|selectedOptions\[0\]\.text)\s*$/.test(arg)
                    ? `${arg.trim()} as Parameters<typeof ${handler}>[${index}]`
                    : arg.trim()
            )
            .join(', ')
    );
}

export function convertFunctionalTemplate(template: string, { typed = false } = {}) {
    template = convertBooleanAttributes(template);
    // Before the handlers become JSX expressions, whose generics (`Parameters<typeof fn>`) contain a `>`
    template = template.replace(/<input (.+?[^=])>/g, '<input $1 />');

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
                    // `this` in an inline handler attribute is the element, which an arrow function cannot see
                    const withElement = meta[2].replace(/(?<![.\w])this\./g, 'event.currentTarget.');
                    const containsEventKeyword = withElement.includes('event');
                    const args = containsEventKeyword ? '(event)' : '()';
                    // Handlers are written against the DOM `Event`, not React's `SyntheticEvent`.
                    let handlerArgs = withElement.replace(/(?<![.\w])event(?![\w.])/g, 'event.nativeEvent');
                    if (typed) handlerArgs = handlerArgs.replace(/event\.target\./g, 'event.currentTarget.');
                    if (typed) handlerArgs = typeHandlerArgs(meta[1], handlerArgs);
                    template = template.replace(matcher, `${jsEvent}={${args} => $1(${handlerArgs})}`);
                } else {
                    template = template.replace(matcher, `${jsEvent}={$1}`);
                }
            }
        } while (meta);

        template = template.replace(matcher, `${jsEvent}={() => $1($2)}`);
    });

    template = template
        .replace(/,\s+event([),])/g, '$1')
        .replace(/<input (.*)value=/g, '<input $1defaultValue=')
        .replace(/ class=/g, ' className=')
        .replace(/ for=/g, ' htmlFor=')
        // when using fontawesome just use "class" instead - it's always the case that we're treating it as a raw value
        // I had some fancy regex here to exclude rows with <i class but I thought this was easier to grok and maintain
        .replace(/<i className=/g, '<i class=')
        .replace(/ <option (.*)selected=""/g, '<option $1');

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
