"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    convertFunctionToCallback: function() {
        return convertFunctionToCallback;
    },
    convertFunctionToCallbackTs: function() {
        return convertFunctionToCallbackTs;
    },
    convertFunctionalTemplate: function() {
        return convertFunctionalTemplate;
    },
    convertStyles: function() {
        return convertStyles;
    },
    convertTemplate: function() {
        return convertTemplate;
    },
    getImport: function() {
        return getImport;
    },
    getValueType: function() {
        return getValueType;
    },
    styleAsObject: function() {
        return styleAsObject;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _json5 = /*#__PURE__*/ _interop_require_wildcard._(require("json5"));
const _parserutils = require("./parser-utils");
const toTitleCase = (value)=>value[0].toUpperCase() + value.slice(1);
const toCamelCase = (value)=>value.replace(/(?:-)(\w)/g, (_, c)=>c ? c.toUpperCase() : '');
function styleAsObject(styles) {
    return styles.split(';').reduce((obj, declaration)=>{
        const [property, value] = declaration.split(':');
        if (value) {
            obj[toCamelCase(property.trim())] = value.trim();
        }
        return obj;
    }, {});
}
function convertStyles(code) {
    return code.replace(/style=['"](.+?);?['"]/g, (_, styles)=>{
        return `style={${JSON.stringify(styleAsObject(styles))}}`;
    });
}
function convertTemplate(template) {
    // React events are case sensitive, so need to ensure casing is correct
    const caseSensitiveEvents = {
        dragover: 'onDragOver',
        dragstart: 'onDragStart'
    };
    _parserutils.recognizedDomEvents.forEach((event)=>{
        const jsEvent = caseSensitiveEvents[event] || `on${toTitleCase(event)}`;
        const matcher = new RegExp(`on${event}="(\\w+)\\((.*?)\\)"`, 'g');
        template = template.replace(matcher, `${jsEvent}={() => this.$1($2)}`);
    });
    template = template.replace(/,\s+event([),])/g, '$1').replace(/<input (.+?[^=])>/g, '<input $1 />').replace(/<input (.*)value=/g, '<input $1defaultValue=').replace(/ class=/g, ' className=').replace(/ for=/g, ' htmlFor=').replace(/ <option (.*)selected=""/g, '<option $1selected={true}');
    if (Array.from(template.matchAll(/<AgChartsReact/g)).length > 1) {
        template = `<Fragment>\n${template}\n</Fragment>`;
    }
    return convertStyles(template);
}
function convertFunctionalTemplate(template) {
    // React events are case sensitive, so need to ensure casing is correct
    const caseSensitiveEvents = {
        dragover: 'onDragOver',
        dragstart: 'onDragStart'
    };
    _parserutils.recognizedDomEvents.forEach((event)=>{
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
        }while (meta)
        template = template.replace(matcher, `${jsEvent}={() => $1($2)}`);
    });
    template = template.replace(/,\s+event([),])/g, '$1').replace(/<input (.+?[^=])>/g, '<input $1 />').replace(/<input (.*)value=/g, '<input $1defaultValue=').replace(/ class=/g, ' className=').replace(/ for=/g, ' htmlFor=')// when using fontawesome just use "class" instead - it's always the case that we're treating it as a raw value
    // I had some fancy regex here to exclude rows with <i class but I thought this was easier to grok and maintain
    .replace(/<i className=/g, '<i class=').replace(/ <option (.*)selected=""/g, '<option $1selected={true}');
    if (Array.from(template.matchAll(/<AgChartsReact/g)).length > 1) {
        template = `<Fragment>\n${template}\n</Fragment>`;
    }
    return convertStyles(template);
}
const getImport = (filename)=>`import ${toTitleCase(filename.split('.')[0])} from './${filename}';`;
const getValueType = (value)=>{
    let type = 'object';
    try {
        type = typeof _json5.parse(value);
    } catch (_) {
    // if it's something we can't parse we'll assume an object
    }
    return type;
};
const convertFunctionToCallback = (code)=>{
    return code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)/, 'const $1 = ($2) =>');
};
const convertFunctionToCallbackTs = (code)=>{
    return code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)(:?\s+[^{]*)/, 'const $1 = ($2) $3 =>');
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvcmVhY3QtdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgSlNPTjUgZnJvbSAnanNvbjUnO1xuXG5pbXBvcnQgeyByZWNvZ25pemVkRG9tRXZlbnRzIH0gZnJvbSAnLi9wYXJzZXItdXRpbHMnO1xuXG5jb25zdCB0b1RpdGxlQ2FzZSA9ICh2YWx1ZTogc3RyaW5nKSA9PiB2YWx1ZVswXS50b1VwcGVyQ2FzZSgpICsgdmFsdWUuc2xpY2UoMSk7XG5jb25zdCB0b0NhbWVsQ2FzZSA9ICh2YWx1ZTogc3RyaW5nKSA9PiB2YWx1ZS5yZXBsYWNlKC8oPzotKShcXHcpL2csIChfLCBjOiBzdHJpbmcpID0+IChjID8gYy50b1VwcGVyQ2FzZSgpIDogJycpKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlQXNPYmplY3Qoc3R5bGVzOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gc3R5bGVzLnNwbGl0KCc7JykucmVkdWNlKChvYmosIGRlY2xhcmF0aW9uKSA9PiB7XG4gICAgICAgIGNvbnN0IFtwcm9wZXJ0eSwgdmFsdWVdID0gZGVjbGFyYXRpb24uc3BsaXQoJzonKTtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBvYmpbdG9DYW1lbENhc2UocHJvcGVydHkudHJpbSgpKV0gPSB2YWx1ZS50cmltKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9LCB7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0U3R5bGVzKGNvZGU6IHN0cmluZykge1xuICAgIHJldHVybiBjb2RlLnJlcGxhY2UoL3N0eWxlPVsnXCJdKC4rPyk7P1snXCJdL2csIChfLCBzdHlsZXMpID0+IHtcbiAgICAgICAgcmV0dXJuIGBzdHlsZT17JHtKU09OLnN0cmluZ2lmeShzdHlsZUFzT2JqZWN0KHN0eWxlcykpfX1gO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydFRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcpIHtcbiAgICAvLyBSZWFjdCBldmVudHMgYXJlIGNhc2Ugc2Vuc2l0aXZlLCBzbyBuZWVkIHRvIGVuc3VyZSBjYXNpbmcgaXMgY29ycmVjdFxuICAgIGNvbnN0IGNhc2VTZW5zaXRpdmVFdmVudHMgPSB7XG4gICAgICAgIGRyYWdvdmVyOiAnb25EcmFnT3ZlcicsXG4gICAgICAgIGRyYWdzdGFydDogJ29uRHJhZ1N0YXJ0JyxcbiAgICB9O1xuXG4gICAgcmVjb2duaXplZERvbUV2ZW50cy5mb3JFYWNoKChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBqc0V2ZW50ID0gY2FzZVNlbnNpdGl2ZUV2ZW50c1tldmVudF0gfHwgYG9uJHt0b1RpdGxlQ2FzZShldmVudCl9YDtcbiAgICAgICAgY29uc3QgbWF0Y2hlciA9IG5ldyBSZWdFeHAoYG9uJHtldmVudH09XCIoXFxcXHcrKVxcXFwoKC4qPylcXFxcKVwiYCwgJ2cnKTtcblxuICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UobWF0Y2hlciwgYCR7anNFdmVudH09eygpID0+IHRoaXMuJDEoJDIpfWApO1xuICAgIH0pO1xuXG4gICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZVxuICAgICAgICAucmVwbGFjZSgvLFxccytldmVudChbKSxdKS9nLCAnJDEnKVxuICAgICAgICAucmVwbGFjZSgvPGlucHV0ICguKz9bXj1dKT4vZywgJzxpbnB1dCAkMSAvPicpXG4gICAgICAgIC5yZXBsYWNlKC88aW5wdXQgKC4qKXZhbHVlPS9nLCAnPGlucHV0ICQxZGVmYXVsdFZhbHVlPScpXG4gICAgICAgIC5yZXBsYWNlKC8gY2xhc3M9L2csICcgY2xhc3NOYW1lPScpXG4gICAgICAgIC5yZXBsYWNlKC8gZm9yPS9nLCAnIGh0bWxGb3I9JylcbiAgICAgICAgLnJlcGxhY2UoLyA8b3B0aW9uICguKilzZWxlY3RlZD1cIlwiL2csICc8b3B0aW9uICQxc2VsZWN0ZWQ9e3RydWV9Jyk7XG5cbiAgICBpZiAoQXJyYXkuZnJvbSh0ZW1wbGF0ZS5tYXRjaEFsbCgvPEFnQ2hhcnRzUmVhY3QvZykpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGVtcGxhdGUgPSBgPEZyYWdtZW50PlxcbiR7dGVtcGxhdGV9XFxuPC9GcmFnbWVudD5gO1xuICAgIH1cblxuICAgIHJldHVybiBjb252ZXJ0U3R5bGVzKHRlbXBsYXRlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUodGVtcGxhdGU6IHN0cmluZykge1xuICAgIC8vIFJlYWN0IGV2ZW50cyBhcmUgY2FzZSBzZW5zaXRpdmUsIHNvIG5lZWQgdG8gZW5zdXJlIGNhc2luZyBpcyBjb3JyZWN0XG4gICAgY29uc3QgY2FzZVNlbnNpdGl2ZUV2ZW50cyA9IHtcbiAgICAgICAgZHJhZ292ZXI6ICdvbkRyYWdPdmVyJyxcbiAgICAgICAgZHJhZ3N0YXJ0OiAnb25EcmFnU3RhcnQnLFxuICAgIH07XG5cbiAgICByZWNvZ25pemVkRG9tRXZlbnRzLmZvckVhY2goKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGpzRXZlbnQgPSBjYXNlU2Vuc2l0aXZlRXZlbnRzW2V2ZW50XSB8fCBgb24ke3RvVGl0bGVDYXNlKGV2ZW50KX1gO1xuICAgICAgICBjb25zdCBtYXRjaGVyID0gbmV3IFJlZ0V4cChgb24ke2V2ZW50fT1cIihcXFxcdyspXFxcXCgoLio/KVxcXFwpXCJgKTtcblxuICAgICAgICAvLyBpZiBhbiBhY3Rpb24gdGFrZXMgcGFyYW1zIHRoZW4gd2UnbGwgY29udmVydCBpdCAtIGllIG9uQ2xpY2s9eygpID0+IGFjdGlvbihwYXJhbXMpfVxuICAgICAgICAvLyBvdGhlcndpc2Ugd2Ugc2ltcGxpZnkgaXQgdG8gb25DbGljaz17YWN0aW9ufVxuICAgICAgICBsZXQgbWV0YTtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgbWV0YSA9IG1hdGNoZXIuZXhlYyh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgICAgIC8vIDAgb3JpZ2luYWwgY2FsbCwgMSBmdW5jdGlvbiBuYW1lLCAyIGFyZ3VtZW50c1xuICAgICAgICAgICAgICAgIGlmIChtZXRhWzJdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZShtYXRjaGVyLCBgJHtqc0V2ZW50fT17KCkgPT4gJDEoJDIpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZShtYXRjaGVyLCBgJHtqc0V2ZW50fT17JDF9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IHdoaWxlIChtZXRhKTtcblxuICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UobWF0Y2hlciwgYCR7anNFdmVudH09eygpID0+ICQxKCQyKX1gKTtcbiAgICB9KTtcblxuICAgIHRlbXBsYXRlID0gdGVtcGxhdGVcbiAgICAgICAgLnJlcGxhY2UoLyxcXHMrZXZlbnQoWyksXSkvZywgJyQxJylcbiAgICAgICAgLnJlcGxhY2UoLzxpbnB1dCAoLis/W149XSk+L2csICc8aW5wdXQgJDEgLz4nKVxuICAgICAgICAucmVwbGFjZSgvPGlucHV0ICguKil2YWx1ZT0vZywgJzxpbnB1dCAkMWRlZmF1bHRWYWx1ZT0nKVxuICAgICAgICAucmVwbGFjZSgvIGNsYXNzPS9nLCAnIGNsYXNzTmFtZT0nKVxuICAgICAgICAucmVwbGFjZSgvIGZvcj0vZywgJyBodG1sRm9yPScpXG4gICAgICAgIC8vIHdoZW4gdXNpbmcgZm9udGF3ZXNvbWUganVzdCB1c2UgXCJjbGFzc1wiIGluc3RlYWQgLSBpdCdzIGFsd2F5cyB0aGUgY2FzZSB0aGF0IHdlJ3JlIHRyZWF0aW5nIGl0IGFzIGEgcmF3IHZhbHVlXG4gICAgICAgIC8vIEkgaGFkIHNvbWUgZmFuY3kgcmVnZXggaGVyZSB0byBleGNsdWRlIHJvd3Mgd2l0aCA8aSBjbGFzcyBidXQgSSB0aG91Z2h0IHRoaXMgd2FzIGVhc2llciB0byBncm9rIGFuZCBtYWludGFpblxuICAgICAgICAucmVwbGFjZSgvPGkgY2xhc3NOYW1lPS9nLCAnPGkgY2xhc3M9JylcbiAgICAgICAgLnJlcGxhY2UoLyA8b3B0aW9uICguKilzZWxlY3RlZD1cIlwiL2csICc8b3B0aW9uICQxc2VsZWN0ZWQ9e3RydWV9Jyk7XG5cbiAgICBpZiAoQXJyYXkuZnJvbSh0ZW1wbGF0ZS5tYXRjaEFsbCgvPEFnQ2hhcnRzUmVhY3QvZykpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGVtcGxhdGUgPSBgPEZyYWdtZW50PlxcbiR7dGVtcGxhdGV9XFxuPC9GcmFnbWVudD5gO1xuICAgIH1cblxuICAgIHJldHVybiBjb252ZXJ0U3R5bGVzKHRlbXBsYXRlKTtcbn1cblxuZXhwb3J0IGNvbnN0IGdldEltcG9ydCA9IChmaWxlbmFtZTogc3RyaW5nKSA9PiBgaW1wb3J0ICR7dG9UaXRsZUNhc2UoZmlsZW5hbWUuc3BsaXQoJy4nKVswXSl9IGZyb20gJy4vJHtmaWxlbmFtZX0nO2A7XG5cbmV4cG9ydCBjb25zdCBnZXRWYWx1ZVR5cGUgPSAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgIGxldCB0eXBlID0gJ29iamVjdCc7XG4gICAgdHJ5IHtcbiAgICAgICAgdHlwZSA9IHR5cGVvZiBKU09ONS5wYXJzZSh2YWx1ZSk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvLyBpZiBpdCdzIHNvbWV0aGluZyB3ZSBjYW4ndCBwYXJzZSB3ZSdsbCBhc3N1bWUgYW4gb2JqZWN0XG4gICAgfVxuICAgIHJldHVybiB0eXBlO1xufTtcblxuZXhwb3J0IGNvbnN0IGNvbnZlcnRGdW5jdGlvblRvQ2FsbGJhY2sgPSAoY29kZTogc3RyaW5nKSA9PiB7XG4gICAgcmV0dXJuIGNvZGUucmVwbGFjZSgvZnVuY3Rpb25cXHMrKFteKFxcc10rKVxccypcXCgoW14pXSopXFwpLywgJ2NvbnN0ICQxID0gKCQyKSA9PicpO1xufTtcbmV4cG9ydCBjb25zdCBjb252ZXJ0RnVuY3Rpb25Ub0NhbGxiYWNrVHMgPSAoY29kZTogc3RyaW5nKSA9PiB7XG4gICAgcmV0dXJuIGNvZGUucmVwbGFjZSgvZnVuY3Rpb25cXHMrKFteKFxcc10rKVxccypcXCgoW14pXSopXFwpKDo/XFxzK1tee10qKS8sICdjb25zdCAkMSA9ICgkMikgJDMgPT4nKTtcbn07XG4iXSwibmFtZXMiOlsiY29udmVydEZ1bmN0aW9uVG9DYWxsYmFjayIsImNvbnZlcnRGdW5jdGlvblRvQ2FsbGJhY2tUcyIsImNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUiLCJjb252ZXJ0U3R5bGVzIiwiY29udmVydFRlbXBsYXRlIiwiZ2V0SW1wb3J0IiwiZ2V0VmFsdWVUeXBlIiwic3R5bGVBc09iamVjdCIsInRvVGl0bGVDYXNlIiwidmFsdWUiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwidG9DYW1lbENhc2UiLCJyZXBsYWNlIiwiXyIsImMiLCJzdHlsZXMiLCJzcGxpdCIsInJlZHVjZSIsIm9iaiIsImRlY2xhcmF0aW9uIiwicHJvcGVydHkiLCJ0cmltIiwiY29kZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0ZW1wbGF0ZSIsImNhc2VTZW5zaXRpdmVFdmVudHMiLCJkcmFnb3ZlciIsImRyYWdzdGFydCIsInJlY29nbml6ZWREb21FdmVudHMiLCJmb3JFYWNoIiwiZXZlbnQiLCJqc0V2ZW50IiwibWF0Y2hlciIsIlJlZ0V4cCIsIkFycmF5IiwiZnJvbSIsIm1hdGNoQWxsIiwibGVuZ3RoIiwibWV0YSIsImV4ZWMiLCJmaWxlbmFtZSIsInR5cGUiLCJKU09ONSIsInBhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQStHYUEseUJBQXlCO2VBQXpCQTs7SUFHQUMsMkJBQTJCO2VBQTNCQTs7SUE5REdDLHlCQUF5QjtlQUF6QkE7O0lBbkNBQyxhQUFhO2VBQWJBOztJQU1BQyxlQUFlO2VBQWZBOztJQTRFSEMsU0FB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