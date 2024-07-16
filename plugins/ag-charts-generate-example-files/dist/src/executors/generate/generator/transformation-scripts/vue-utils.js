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
    convertTemplate: function() {
        return convertTemplate;
    },
    getImport: function() {
        return getImport;
    },
    indentTemplate: function() {
        return indentTemplate;
    },
    toAssignment: function() {
        return toAssignment;
    },
    toComponent: function() {
        return toComponent;
    },
    toConst: function() {
        return toConst;
    },
    toInput: function() {
        return toInput;
    },
    toMember: function() {
        return toMember;
    },
    toOutput: function() {
        return toOutput;
    }
});
const _parserutils = require("./parser-utils");
const _stringutils = require("./string-utils");
const toInput = (property)=>`:${property.name}="${property.name}"`;
const toConst = (property)=>`:${property.name}="${property.value}"`;
const toOutput = (event)=>`@${(0, _stringutils.toKebabCase)(event.name)}="${event.handlerName}"`;
const toMember = (property)=>`${property.name}: null`;
const toComponent = (property)=>`'${property.name}': ${property.name}`;
function toAssignment(property) {
    // convert to arrow functions
    const value = property.value.replace(/function\s*\(([^)]+)\)/, '($1) =>');
    return `this.${property.name} = ${value}`;
}
function getImport(filename, tokenReplace, replaceValue) {
    let componentName = filename.split('.')[0];
    if (tokenReplace) {
        componentName = componentName.replace(tokenReplace, replaceValue);
    }
    return `import ${(0, _stringutils.toTitleCase)(componentName)} from './${filename}';`;
}
function indentTemplate(template, spaceWidth, start = 0) {
    let indent = start;
    return template.split('\n').map((line)=>line.trim()).filter((line)=>line.length > 0).map((line)=>{
        const match = line.match(/^(<\w+)?[^/]*(\/>|<\/\w+>)?$/);
        const open = (match == null ? void 0 : match[1]) != null;
        const close = (match == null ? void 0 : match[2]) != null;
        if (!open && close) {
            indent -= 1;
        }
        const out = ' '.repeat(indent * spaceWidth) + line;
        if (open && !close) {
            indent += 1;
        }
        return out;
    }).join('\n');
}
function convertTemplate(template) {
    _parserutils.recognizedDomEvents.forEach((event)=>{
        template = template.replace(new RegExp(`on${event}=`, 'g'), `v-on:${event}=`);
    });
    template = template.replace(/\(event\)/g, '($event)');
    return indentTemplate(template, 2, 2);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvdnVlLXV0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlY29nbml6ZWREb21FdmVudHMgfSBmcm9tICcuL3BhcnNlci11dGlscyc7XG5pbXBvcnQgeyB0b0tlYmFiQ2FzZSwgdG9UaXRsZUNhc2UgfSBmcm9tICcuL3N0cmluZy11dGlscyc7XG5cbmV4cG9ydCBjb25zdCB0b0lucHV0ID0gKHByb3BlcnR5KSA9PiBgOiR7cHJvcGVydHkubmFtZX09XCIke3Byb3BlcnR5Lm5hbWV9XCJgO1xuZXhwb3J0IGNvbnN0IHRvQ29uc3QgPSAocHJvcGVydHkpID0+IGA6JHtwcm9wZXJ0eS5uYW1lfT1cIiR7cHJvcGVydHkudmFsdWV9XCJgO1xuZXhwb3J0IGNvbnN0IHRvT3V0cHV0ID0gKGV2ZW50KSA9PiBgQCR7dG9LZWJhYkNhc2UoZXZlbnQubmFtZSl9PVwiJHtldmVudC5oYW5kbGVyTmFtZX1cImA7XG5leHBvcnQgY29uc3QgdG9NZW1iZXIgPSAocHJvcGVydHkpID0+IGAke3Byb3BlcnR5Lm5hbWV9OiBudWxsYDtcbmV4cG9ydCBjb25zdCB0b0NvbXBvbmVudCA9IChwcm9wZXJ0eSkgPT4gYCcke3Byb3BlcnR5Lm5hbWV9JzogJHtwcm9wZXJ0eS5uYW1lfWA7XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0Fzc2lnbm1lbnQocHJvcGVydHk6IGFueSk6IHN0cmluZyB7XG4gICAgLy8gY29udmVydCB0byBhcnJvdyBmdW5jdGlvbnNcbiAgICBjb25zdCB2YWx1ZSA9IHByb3BlcnR5LnZhbHVlLnJlcGxhY2UoL2Z1bmN0aW9uXFxzKlxcKChbXildKylcXCkvLCAnKCQxKSA9PicpO1xuXG4gICAgcmV0dXJuIGB0aGlzLiR7cHJvcGVydHkubmFtZX0gPSAke3ZhbHVlfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbXBvcnQoZmlsZW5hbWU6IHN0cmluZywgdG9rZW5SZXBsYWNlLCByZXBsYWNlVmFsdWUpIHtcbiAgICBsZXQgY29tcG9uZW50TmFtZSA9IGZpbGVuYW1lLnNwbGl0KCcuJylbMF07XG4gICAgaWYgKHRva2VuUmVwbGFjZSkge1xuICAgICAgICBjb21wb25lbnROYW1lID0gY29tcG9uZW50TmFtZS5yZXBsYWNlKHRva2VuUmVwbGFjZSwgcmVwbGFjZVZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGBpbXBvcnQgJHt0b1RpdGxlQ2FzZShjb21wb25lbnROYW1lKX0gZnJvbSAnLi8ke2ZpbGVuYW1lfSc7YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGVudFRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcsIHNwYWNlV2lkdGg6IG51bWJlciwgc3RhcnQ6IG51bWJlciA9IDApIHtcbiAgICBsZXQgaW5kZW50ID0gc3RhcnQ7XG4gICAgcmV0dXJuIHRlbXBsYXRlXG4gICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoKGxpbmUpID0+IGxpbmUubGVuZ3RoID4gMClcbiAgICAgICAgLm1hcCgobGluZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBsaW5lLm1hdGNoKC9eKDxcXHcrKT9bXi9dKihcXC8+fDxcXC9cXHcrPik/JC8pO1xuICAgICAgICAgICAgY29uc3Qgb3BlbiA9IG1hdGNoPy5bMV0gIT0gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGNsb3NlID0gbWF0Y2g/LlsyXSAhPSBudWxsO1xuXG4gICAgICAgICAgICBpZiAoIW9wZW4gJiYgY2xvc2UpIHtcbiAgICAgICAgICAgICAgICBpbmRlbnQgLT0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgb3V0ID0gJyAnLnJlcGVhdChpbmRlbnQgKiBzcGFjZVdpZHRoKSArIGxpbmU7XG5cbiAgICAgICAgICAgIGlmIChvcGVuICYmICFjbG9zZSkge1xuICAgICAgICAgICAgICAgIGluZGVudCArPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9KVxuICAgICAgICAuam9pbignXFxuJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VGVtcGxhdGUodGVtcGxhdGU6IHN0cmluZykge1xuICAgIHJlY29nbml6ZWREb21FdmVudHMuZm9yRWFjaCgoZXZlbnQpID0+IHtcbiAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKG5ldyBSZWdFeHAoYG9uJHtldmVudH09YCwgJ2cnKSwgYHYtb246JHtldmVudH09YCk7XG4gICAgfSk7XG5cbiAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UoL1xcKGV2ZW50XFwpL2csICcoJGV2ZW50KScpO1xuXG4gICAgcmV0dXJuIGluZGVudFRlbXBsYXRlKHRlbXBsYXRlLCAyLCAyKTtcbn1cbiJdLCJuYW1lcyI6WyJjb252ZXJ0VGVtcGxhdGUiLCJnZXRJbXBvcnQiLCJpbmRlbnRUZW1wbGF0ZSIsInRvQXNzaWdubWVudCIsInRvQ29tcG9uZW50IiwidG9Db25zdCIsInRvSW5wdXQiLCJ0b01lbWJlciIsInRvT3V0cHV0IiwicHJvcGVydHkiLCJuYW1lIiwidmFsdWUiLCJldmVudCIsInRvS2ViYWJDYXNlIiwiaGFuZGxlck5hbWUiLCJyZXBsYWNlIiwiZmlsZW5hbWUiLCJ0b2tlblJlcGxhY2UiLCJyZXBsYWNlVmFsdWUiLCJjb21wb25lbnROYW1lIiwic3BsaXQiLCJ0b1RpdGxlQ2FzZSIsInRlbXBsYXRlIiwic3BhY2VXaWR0aCIsInN0YXJ0IiwiaW5kZW50IiwibWFwIiwibGluZSIsInRyaW0iLCJmaWx0ZXIiLCJsZW5ndGgiLCJtYXRjaCIsIm9wZW4iLCJjbG9zZSIsIm91dCIsInJlcGVhdCIsImpvaW4iLCJyZWNvZ25pemVkRG9tRXZlbnRzIiwiZm9yRWFjaCIsIlJlZ0V4cCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7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