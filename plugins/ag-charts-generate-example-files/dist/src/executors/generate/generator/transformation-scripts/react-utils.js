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
    convertFunctionToConstCallback: function() {
        return convertFunctionToConstCallback;
    },
    convertFunctionToConstCallbackTs: function() {
        return convertFunctionToConstCallbackTs;
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
const convertFunctionToConstCallback = (code, callbackDependencies)=>{
    const functionName = (0, _parserutils.getFunctionName)(code);
    return `${code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)/, 'const $1 = useCallback(($2) =>')}, [${callbackDependencies[functionName] || ''}])`;
};
const convertFunctionToConstCallbackTs = (code, callbackDependencies)=>{
    const functionName = (0, _parserutils.getFunctionName)(code); //:(\s+[^\{]*)
    return `${code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)(:?\s+[^{]*)/, 'const $1 = useCallback(($2) $3 =>')}, [${callbackDependencies[functionName] || ''}])`;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvcmVhY3QtdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgSlNPTjUgZnJvbSAnanNvbjUnO1xuXG5pbXBvcnQgeyBnZXRGdW5jdGlvbk5hbWUsIHJlY29nbml6ZWREb21FdmVudHMgfSBmcm9tICcuL3BhcnNlci11dGlscyc7XG5cbmNvbnN0IHRvVGl0bGVDYXNlID0gKHZhbHVlOiBzdHJpbmcpID0+IHZhbHVlWzBdLnRvVXBwZXJDYXNlKCkgKyB2YWx1ZS5zbGljZSgxKTtcbmNvbnN0IHRvQ2FtZWxDYXNlID0gKHZhbHVlOiBzdHJpbmcpID0+IHZhbHVlLnJlcGxhY2UoLyg/Oi0pKFxcdykvZywgKF8sIGM6IHN0cmluZykgPT4gKGMgPyBjLnRvVXBwZXJDYXNlKCkgOiAnJykpO1xuXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVBc09iamVjdChzdHlsZXM6IHN0cmluZykge1xuICAgIHJldHVybiBzdHlsZXMuc3BsaXQoJzsnKS5yZWR1Y2UoKG9iaiwgZGVjbGFyYXRpb24pID0+IHtcbiAgICAgICAgY29uc3QgW3Byb3BlcnR5LCB2YWx1ZV0gPSBkZWNsYXJhdGlvbi5zcGxpdCgnOicpO1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIG9ialt0b0NhbWVsQ2FzZShwcm9wZXJ0eS50cmltKCkpXSA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH0sIHt9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRTdHlsZXMoY29kZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGNvZGUucmVwbGFjZSgvc3R5bGU9WydcIl0oLis/KTs/WydcIl0vZywgKF8sIHN0eWxlcykgPT4ge1xuICAgICAgICByZXR1cm4gYHN0eWxlPXske0pTT04uc3RyaW5naWZ5KHN0eWxlQXNPYmplY3Qoc3R5bGVzKSl9fWA7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VGVtcGxhdGUodGVtcGxhdGU6IHN0cmluZykge1xuICAgIC8vIFJlYWN0IGV2ZW50cyBhcmUgY2FzZSBzZW5zaXRpdmUsIHNvIG5lZWQgdG8gZW5zdXJlIGNhc2luZyBpcyBjb3JyZWN0XG4gICAgY29uc3QgY2FzZVNlbnNpdGl2ZUV2ZW50cyA9IHtcbiAgICAgICAgZHJhZ292ZXI6ICdvbkRyYWdPdmVyJyxcbiAgICAgICAgZHJhZ3N0YXJ0OiAnb25EcmFnU3RhcnQnLFxuICAgIH07XG5cbiAgICByZWNvZ25pemVkRG9tRXZlbnRzLmZvckVhY2goKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGpzRXZlbnQgPSBjYXNlU2Vuc2l0aXZlRXZlbnRzW2V2ZW50XSB8fCBgb24ke3RvVGl0bGVDYXNlKGV2ZW50KX1gO1xuICAgICAgICBjb25zdCBtYXRjaGVyID0gbmV3IFJlZ0V4cChgb24ke2V2ZW50fT1cIihcXFxcdyspXFxcXCgoLio/KVxcXFwpXCJgLCAnZycpO1xuXG4gICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZShtYXRjaGVyLCBgJHtqc0V2ZW50fT17KCkgPT4gdGhpcy4kMSgkMil9YCk7XG4gICAgfSk7XG5cbiAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlXG4gICAgICAgIC5yZXBsYWNlKC8sXFxzK2V2ZW50KFspLF0pL2csICckMScpXG4gICAgICAgIC5yZXBsYWNlKC88aW5wdXQgKC4rP1tePV0pPi9nLCAnPGlucHV0ICQxIC8+JylcbiAgICAgICAgLnJlcGxhY2UoLzxpbnB1dCAoLiopdmFsdWU9L2csICc8aW5wdXQgJDFkZWZhdWx0VmFsdWU9JylcbiAgICAgICAgLnJlcGxhY2UoLyBjbGFzcz0vZywgJyBjbGFzc05hbWU9JylcbiAgICAgICAgLnJlcGxhY2UoLyBmb3I9L2csICcgaHRtbEZvcj0nKVxuICAgICAgICAucmVwbGFjZSgvIDxvcHRpb24gKC4qKXNlbGVjdGVkPVwiXCIvZywgJzxvcHRpb24gJDFzZWxlY3RlZD17dHJ1ZX0nKTtcblxuICAgIGlmIChBcnJheS5mcm9tKHRlbXBsYXRlLm1hdGNoQWxsKC88QWdDaGFydHNSZWFjdC9nKSkubGVuZ3RoID4gMSkge1xuICAgICAgICB0ZW1wbGF0ZSA9IGA8RnJhZ21lbnQ+XFxuJHt0ZW1wbGF0ZX1cXG48L0ZyYWdtZW50PmA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnZlcnRTdHlsZXModGVtcGxhdGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydEZ1bmN0aW9uYWxUZW1wbGF0ZSh0ZW1wbGF0ZTogc3RyaW5nKSB7XG4gICAgLy8gUmVhY3QgZXZlbnRzIGFyZSBjYXNlIHNlbnNpdGl2ZSwgc28gbmVlZCB0byBlbnN1cmUgY2FzaW5nIGlzIGNvcnJlY3RcbiAgICBjb25zdCBjYXNlU2Vuc2l0aXZlRXZlbnRzID0ge1xuICAgICAgICBkcmFnb3ZlcjogJ29uRHJhZ092ZXInLFxuICAgICAgICBkcmFnc3RhcnQ6ICdvbkRyYWdTdGFydCcsXG4gICAgfTtcblxuICAgIHJlY29nbml6ZWREb21FdmVudHMuZm9yRWFjaCgoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QganNFdmVudCA9IGNhc2VTZW5zaXRpdmVFdmVudHNbZXZlbnRdIHx8IGBvbiR7dG9UaXRsZUNhc2UoZXZlbnQpfWA7XG4gICAgICAgIGNvbnN0IG1hdGNoZXIgPSBuZXcgUmVnRXhwKGBvbiR7ZXZlbnR9PVwiKFxcXFx3KylcXFxcKCguKj8pXFxcXClcImApO1xuXG4gICAgICAgIC8vIGlmIGFuIGFjdGlvbiB0YWtlcyBwYXJhbXMgdGhlbiB3ZSdsbCBjb252ZXJ0IGl0IC0gaWUgb25DbGljaz17KCkgPT4gYWN0aW9uKHBhcmFtcyl9XG4gICAgICAgIC8vIG90aGVyd2lzZSB3ZSBzaW1wbGlmeSBpdCB0byBvbkNsaWNrPXthY3Rpb259XG4gICAgICAgIGxldCBtZXRhO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBtZXRhID0gbWF0Y2hlci5leGVjKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIGlmIChtZXRhKSB7XG4gICAgICAgICAgICAgICAgLy8gMCBvcmlnaW5hbCBjYWxsLCAxIGZ1bmN0aW9uIG5hbWUsIDIgYXJndW1lbnRzXG4gICAgICAgICAgICAgICAgaWYgKG1ldGFbMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKG1hdGNoZXIsIGAke2pzRXZlbnR9PXsoKSA9PiAkMSgkMil9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKG1hdGNoZXIsIGAke2pzRXZlbnR9PXskMX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gd2hpbGUgKG1ldGEpO1xuXG4gICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZShtYXRjaGVyLCBgJHtqc0V2ZW50fT17KCkgPT4gJDEoJDIpfWApO1xuICAgIH0pO1xuXG4gICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZVxuICAgICAgICAucmVwbGFjZSgvLFxccytldmVudChbKSxdKS9nLCAnJDEnKVxuICAgICAgICAucmVwbGFjZSgvPGlucHV0ICguKz9bXj1dKT4vZywgJzxpbnB1dCAkMSAvPicpXG4gICAgICAgIC5yZXBsYWNlKC88aW5wdXQgKC4qKXZhbHVlPS9nLCAnPGlucHV0ICQxZGVmYXVsdFZhbHVlPScpXG4gICAgICAgIC5yZXBsYWNlKC8gY2xhc3M9L2csICcgY2xhc3NOYW1lPScpXG4gICAgICAgIC5yZXBsYWNlKC8gZm9yPS9nLCAnIGh0bWxGb3I9JylcbiAgICAgICAgLy8gd2hlbiB1c2luZyBmb250YXdlc29tZSBqdXN0IHVzZSBcImNsYXNzXCIgaW5zdGVhZCAtIGl0J3MgYWx3YXlzIHRoZSBjYXNlIHRoYXQgd2UncmUgdHJlYXRpbmcgaXQgYXMgYSByYXcgdmFsdWVcbiAgICAgICAgLy8gSSBoYWQgc29tZSBmYW5jeSByZWdleCBoZXJlIHRvIGV4Y2x1ZGUgcm93cyB3aXRoIDxpIGNsYXNzIGJ1dCBJIHRob3VnaHQgdGhpcyB3YXMgZWFzaWVyIHRvIGdyb2sgYW5kIG1haW50YWluXG4gICAgICAgIC5yZXBsYWNlKC88aSBjbGFzc05hbWU9L2csICc8aSBjbGFzcz0nKVxuICAgICAgICAucmVwbGFjZSgvIDxvcHRpb24gKC4qKXNlbGVjdGVkPVwiXCIvZywgJzxvcHRpb24gJDFzZWxlY3RlZD17dHJ1ZX0nKTtcblxuICAgIGlmIChBcnJheS5mcm9tKHRlbXBsYXRlLm1hdGNoQWxsKC88QWdDaGFydHNSZWFjdC9nKSkubGVuZ3RoID4gMSkge1xuICAgICAgICB0ZW1wbGF0ZSA9IGA8RnJhZ21lbnQ+XFxuJHt0ZW1wbGF0ZX1cXG48L0ZyYWdtZW50PmA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnZlcnRTdHlsZXModGVtcGxhdGUpO1xufVxuXG5leHBvcnQgY29uc3QgZ2V0SW1wb3J0ID0gKGZpbGVuYW1lOiBzdHJpbmcpID0+IGBpbXBvcnQgJHt0b1RpdGxlQ2FzZShmaWxlbmFtZS5zcGxpdCgnLicpWzBdKX0gZnJvbSAnLi8ke2ZpbGVuYW1lfSc7YDtcblxuZXhwb3J0IGNvbnN0IGdldFZhbHVlVHlwZSA9ICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgbGV0IHR5cGUgPSAnb2JqZWN0JztcbiAgICB0cnkge1xuICAgICAgICB0eXBlID0gdHlwZW9mIEpTT041LnBhcnNlKHZhbHVlKTtcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8vIGlmIGl0J3Mgc29tZXRoaW5nIHdlIGNhbid0IHBhcnNlIHdlJ2xsIGFzc3VtZSBhbiBvYmplY3RcbiAgICB9XG4gICAgcmV0dXJuIHR5cGU7XG59O1xuXG5leHBvcnQgY29uc3QgY29udmVydEZ1bmN0aW9uVG9Db25zdENhbGxiYWNrID0gKGNvZGU6IHN0cmluZywgY2FsbGJhY2tEZXBlbmRlbmNpZXM6IHt9KSA9PiB7XG4gICAgY29uc3QgZnVuY3Rpb25OYW1lID0gZ2V0RnVuY3Rpb25OYW1lKGNvZGUpO1xuICAgIHJldHVybiBgJHtjb2RlLnJlcGxhY2UoL2Z1bmN0aW9uXFxzKyhbXihcXHNdKylcXHMqXFwoKFteKV0qKVxcKS8sICdjb25zdCAkMSA9IHVzZUNhbGxiYWNrKCgkMikgPT4nKX0sIFske1xuICAgICAgICBjYWxsYmFja0RlcGVuZGVuY2llc1tmdW5jdGlvbk5hbWVdIHx8ICcnXG4gICAgfV0pYDtcbn07XG5leHBvcnQgY29uc3QgY29udmVydEZ1bmN0aW9uVG9Db25zdENhbGxiYWNrVHMgPSAoY29kZTogc3RyaW5nLCBjYWxsYmFja0RlcGVuZGVuY2llczoge30pID0+IHtcbiAgICBjb25zdCBmdW5jdGlvbk5hbWUgPSBnZXRGdW5jdGlvbk5hbWUoY29kZSk7IC8vOihcXHMrW15cXHtdKilcbiAgICByZXR1cm4gYCR7Y29kZS5yZXBsYWNlKC9mdW5jdGlvblxccysoW14oXFxzXSspXFxzKlxcKChbXildKilcXCkoOj9cXHMrW157XSopLywgJ2NvbnN0ICQxID0gdXNlQ2FsbGJhY2soKCQyKSAkMyA9PicpfSwgWyR7XG4gICAgICAgIGNhbGxiYWNrRGVwZW5kZW5jaWVzW2Z1bmN0aW9uTmFtZV0gfHwgJydcbiAgICB9XSlgO1xufTtcbiJdLCJuYW1lcyI6WyJjb252ZXJ0RnVuY3Rpb25Ub0NvbnN0Q2FsbGJhY2siLCJjb252ZXJ0RnVuY3Rpb25Ub0NvbnN0Q2FsbGJhY2tUcyIsImNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUiLCJjb252ZXJ0U3R5bGVzIiwiY29udmVydFRlbXBsYXRlIiwiZ2V0SW1wb3J0IiwiZ2V0VmFsdWVUeXBlIiwic3R5bGVBc09iamVjdCIsInRvVGl0bGVDYXNlIiwidmFsdWUiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwidG9DYW1lbENhc2UiLCJyZXBsYWNlIiwiXyIsImMiLCJzdHlsZXMiLCJzcGxpdCIsInJlZHVjZSIsIm9iaiIsImRlY2xhcmF0aW9uIiwicHJvcGVydHkiLCJ0cmltIiwiY29kZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0ZW1wbGF0ZSIsImNhc2VTZW5zaXRpdmVFdmVudHMiLCJkcmFnb3ZlciIsImRyYWdzdGFydCIsInJlY29nbml6ZWREb21FdmVudHMiLCJmb3JFYWNoIiwiZXZlbnQiLCJqc0V2ZW50IiwibWF0Y2hlciIsIlJlZ0V4cCIsIkFycmF5IiwiZnJvbSIsIm1hdGNoQWxsIiwibGVuZ3RoIiwibWV0YSIsImV4ZWMiLCJmaWxlbmFtZSIsInR5cGUiLCJKU09ONSIsInBhcnNlIiwiY2FsbGJhY2tEZXBlbmRlbmNpZXMiLCJmdW5jdGlvbk5hbWUiLCJnZXRGdW5jdGlvbk5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBK0dhQSw4QkFBOEI7ZUFBOUJBOztJQU1BQyxnQ0FBZ0M7ZUFBaENBOztJQWpFR0MseUJBQXlCO2VBQXpCQTs7SUFuQ0FDLGFBQWE7ZUFBYkE7O0lBTUFDLGVBQWU7ZUFBZkE7O0lBNEVIQyxTQUFTO2VBQVRBOztJQUVBQyxZQUFZO2VBQVpBOztJQTlGR0MsYUFBYTtlQUFiQTs7OztpRUFQTzs2QkFFOEI7QUFFckQsTUFBTUMsY0FBYyxDQUFDQyxRQUFrQkEsS0FBSyxDQUFDLEVBQUUsQ0FBQ0MsV0FBVyxLQUFLRCxNQUFNRSxLQUFLLENBQUM7QUFDNUUsTUFBTUMsY0FBYyxDQUFDSCxRQUFrQkEsTUFBTUksT0FBTyxDQUFDLGNBQWMsQ0FBQ0MsR0FBR0MsSUFBZUEsSUFBSUEsRUFBRUwsV0FBVyxLQUFLO0FBRXJHLFNBQVNILGNBQWNTLE1BQWM7SUFDeEMsT0FBT0EsT0FBT0MsS0FBSyxDQUFDLEtBQUtDLE1BQU0sQ0FBQyxDQUFDQyxLQUFLQztRQUNsQyxNQUFNLENBQUNDLFVBQVVaLE1BQU0sR0FBR1csWUFBWUgsS0FBSyxDQUFDO1FBQzVDLElBQUlSLE9BQU87WUFDUFUsR0FBRyxDQUFDUCxZQUFZUyxTQUFTQyxJQUFJLElBQUksR0FBR2IsTUFBTWEsSUFBSTtRQUNsRDtRQUNBLE9BQU9IO0lBQ1gsR0FBRyxDQUFDO0FBQ1I7QUFFTyxTQUFT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