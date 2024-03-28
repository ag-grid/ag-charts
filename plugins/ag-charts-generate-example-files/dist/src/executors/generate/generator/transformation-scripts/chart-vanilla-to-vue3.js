"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "vanillaToVue3", {
    enumerable: true,
    get: function() {
        return vanillaToVue3;
    }
});
const _chartutils = require("./chart-utils");
const _parserutils = require("./parser-utils");
const _stringutils = require("./string-utils");
const _vueutils = require("./vue-utils");
function processFunction(code) {
    return (0, _chartutils.wrapOptionsUpdateCode)((0, _parserutils.removeFunctionKeyword)(code));
}
function getImports(componentFileNames, bindings) {
    const imports = [
        "import { createApp } from 'vue';",
        "import { AgChartsVue } from 'ag-charts-vue3';"
    ];
    const chartImport = (0, _chartutils.getChartImports)(bindings.imports, bindings.usesChartApi);
    if (chartImport) {
        imports.push(chartImport);
    }
    if (componentFileNames) {
        imports.push(...componentFileNames.map(_vueutils.getImport));
    }
    if (bindings.chartSettings.enterprise) {
        imports.push("import 'ag-charts-enterprise';");
    }
    return imports;
}
function getPropertyBindings(bindings, property) {
    const propertyAssignments = [];
    const propertyVars = [];
    const propertyAttributes = [];
    propertyVars.push(`${property.name}: ${property.value}`);
    propertyAttributes.push(`:options="${property.name}"`);
    return {
        propertyAssignments,
        propertyVars,
        propertyAttributes
    };
}
function getVueTag(bindings, attributes) {
    return `<ag-charts-vue\n` + (bindings.usesChartApi ? `ref="agCharts"\n` : '') + attributes.join('\n') + `\n/>`;
}
function getTemplate(bindings, attributes) {
    /* prettier-ignore */ const agChartTag = getVueTag(bindings, attributes);
    var _bindings_template;
    let template = (_bindings_template = bindings.template) != null ? _bindings_template : agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder)=>{
        template = template.replace(placeholder, agChartTag);
    });
    return (0, _vueutils.convertTemplate)(template);
}
function getAllMethods(bindings) {
    const externalEventHandlers = bindings.externalEventHandlers.map((event)=>processFunction(event.body));
    const instanceMethods = bindings.instanceMethods.map(processFunction);
    const globalMethods = bindings.globals.map((body)=>{
        const funcName = (0, _parserutils.getFunctionName)(body);
        if (funcName) {
            return `window.${funcName} = ${body}`;
        }
        // probably a var
        return body;
    });
    return [
        externalEventHandlers,
        instanceMethods,
        globalMethods
    ];
}
async function vanillaToVue3(bindings, componentFileNames) {
    const { properties } = bindings;
    const imports = getImports(componentFileNames, bindings);
    const [externalEventHandlers, instanceMethods, globalMethods] = getAllMethods(bindings);
    const placeholders = Object.keys(bindings.placeholders);
    const methods = instanceMethods.concat(externalEventHandlers);
    let mainFile;
    if (placeholders.length <= 1) {
        const options = properties.find((p)=>p.name === 'options');
        const { propertyAssignments, propertyVars, propertyAttributes } = getPropertyBindings(bindings, options);
        const template = getTemplate(bindings, propertyAttributes);
        mainFile = `
            ${imports.join('\n')}

            ${globalMethods.join('\n\n')}

            const ChartExample = {
                template: \`\n${template}\n  \`,
                components: {
                    'ag-charts-vue': AgChartsVue
                },
                data() {
                    return {
                        ${propertyVars.join(`,
                        `)}
                    }
                },
                ${propertyAssignments.length !== 0 ? `
                created() {
                    ${propertyAssignments.join(`;
                    `)}
                },` : ''}
                ${bindings.init.length !== 0 ? `
                mounted() {
                    ${bindings.init.join(`;
                    `)}
                },` : ''}
                ${methods.length !== 0 ? `
                methods: {
                    ${methods.map((snippet)=>`${snippet.trim()},`).join(`
                    `)}
                },
                ` : ''}
            }

            createApp(ChartExample).mount("#app");
        `;
    } else {
        const components = [];
        let template = bindings.template.trim();
        Object.entries(bindings.placeholders).forEach(([id, placeholder])=>{
            const selector = (0, _stringutils.toKebabCase)(id);
            const { style } = bindings.chartAttributes[id];
            template = template.replace(placeholder, `<${selector} style="${style}"></${selector}>`);
        });
        mainFile = `
            ${imports.join('\n')}

            ${globalMethods.join('\n\n')}
        `;
        placeholders.forEach((id)=>{
            const selector = (0, _stringutils.toKebabCase)(id);
            const className = (0, _stringutils.toTitleCase)(id);
            const propertyName = bindings.chartProperties[id];
            const { propertyVars, propertyAttributes } = getPropertyBindings(bindings, properties.find((p)=>p.name === propertyName));
            const template = getVueTag(bindings, propertyAttributes);
            mainFile = `${mainFile}

            const ${className} = {
                template: \`\n${(0, _vueutils.indentTemplate)(template, 2, 2)}\n  \`,
                components: {
                    'ag-charts-vue': AgChartsVue
                },
                data() {
                    return {
                        ${propertyVars.join(`,
                        `)}
                    }
                },
            }
            `;
            components.push({
                selector,
                className
            });
        });
        mainFile = `${mainFile}

        const ChartExample = {
            template: \`\n${(0, _vueutils.indentTemplate)(template, 2, 2)}\n  \`,
            components: {
                ${components.map((c)=>`'${c.selector}': ${c.className}`).join(`,
                `)}
            },
        }

        createApp(ChartExample).mount("#app");
        `;
    }
    if (bindings.usesChartApi) {
        mainFile = mainFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(this.$refs.agCharts.chart$3');
        mainFile = mainFile.replace(/\(this.\$refs.agCharts.chart, options/g, '(this.$refs.agCharts.chart, this.options');
    }
    return mainFile;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by12dWUzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldENoYXJ0SW1wb3J0cywgd3JhcE9wdGlvbnNVcGRhdGVDb2RlIH0gZnJvbSAnLi9jaGFydC11dGlscyc7XG5pbXBvcnQgeyBnZXRGdW5jdGlvbk5hbWUsIGlzSW5zdGFuY2VNZXRob2QsIHJlbW92ZUZ1bmN0aW9uS2V5d29yZCB9IGZyb20gJy4vcGFyc2VyLXV0aWxzJztcbmltcG9ydCB7IHRvS2ViYWJDYXNlLCB0b1RpdGxlQ2FzZSB9IGZyb20gJy4vc3RyaW5nLXV0aWxzJztcbmltcG9ydCB7IGNvbnZlcnRUZW1wbGF0ZSwgZ2V0SW1wb3J0LCBpbmRlbnRUZW1wbGF0ZSwgdG9Bc3NpZ25tZW50LCB0b0NvbnN0LCB0b0lucHV0LCB0b01lbWJlciB9IGZyb20gJy4vdnVlLXV0aWxzJztcblxuZnVuY3Rpb24gcHJvY2Vzc0Z1bmN0aW9uKGNvZGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHdyYXBPcHRpb25zVXBkYXRlQ29kZShyZW1vdmVGdW5jdGlvbktleXdvcmQoY29kZSkpO1xufVxuXG5mdW5jdGlvbiBnZXRJbXBvcnRzKGNvbXBvbmVudEZpbGVOYW1lczogc3RyaW5nW10sIGJpbmRpbmdzKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGltcG9ydHMgPSBbXCJpbXBvcnQgeyBjcmVhdGVBcHAgfSBmcm9tICd2dWUnO1wiLCBcImltcG9ydCB7IEFnQ2hhcnRzVnVlIH0gZnJvbSAnYWctY2hhcnRzLXZ1ZTMnO1wiXTtcblxuICAgIGNvbnN0IGNoYXJ0SW1wb3J0ID0gZ2V0Q2hhcnRJbXBvcnRzKGJpbmRpbmdzLmltcG9ydHMsIGJpbmRpbmdzLnVzZXNDaGFydEFwaSk7XG4gICAgaWYgKGNoYXJ0SW1wb3J0KSB7XG4gICAgICAgIGltcG9ydHMucHVzaChjaGFydEltcG9ydCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbXBvbmVudEZpbGVOYW1lcykge1xuICAgICAgICBpbXBvcnRzLnB1c2goLi4uY29tcG9uZW50RmlsZU5hbWVzLm1hcChnZXRJbXBvcnQpKTtcbiAgICB9XG5cbiAgICBpZiAoYmluZGluZ3MuY2hhcnRTZXR0aW5ncy5lbnRlcnByaXNlKSB7XG4gICAgICAgIGltcG9ydHMucHVzaChcImltcG9ydCAnYWctY2hhcnRzLWVudGVycHJpc2UnO1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW1wb3J0cztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcGVydHlCaW5kaW5ncyhiaW5kaW5nczogYW55LCBwcm9wZXJ0eTogYW55KSB7XG4gICAgY29uc3QgcHJvcGVydHlBc3NpZ25tZW50cyA9IFtdO1xuICAgIGNvbnN0IHByb3BlcnR5VmFycyA9IFtdO1xuICAgIGNvbnN0IHByb3BlcnR5QXR0cmlidXRlcyA9IFtdO1xuXG4gICAgcHJvcGVydHlWYXJzLnB1c2goYCR7cHJvcGVydHkubmFtZX06ICR7cHJvcGVydHkudmFsdWV9YCk7XG4gICAgcHJvcGVydHlBdHRyaWJ1dGVzLnB1c2goYDpvcHRpb25zPVwiJHtwcm9wZXJ0eS5uYW1lfVwiYCk7XG5cbiAgICByZXR1cm4geyBwcm9wZXJ0eUFzc2lnbm1lbnRzLCBwcm9wZXJ0eVZhcnMsIHByb3BlcnR5QXR0cmlidXRlcyB9O1xufVxuXG5mdW5jdGlvbiBnZXRWdWVUYWcoYmluZGluZ3M6IGFueSwgYXR0cmlidXRlczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gYDxhZy1jaGFydHMtdnVlXFxuYCArIChiaW5kaW5ncy51c2VzQ2hhcnRBcGkgPyBgcmVmPVwiYWdDaGFydHNcIlxcbmAgOiAnJykgKyBhdHRyaWJ1dGVzLmpvaW4oJ1xcbicpICsgYFxcbi8+YDtcbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGUoYmluZGluZ3M6IGFueSwgYXR0cmlidXRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIC8qIHByZXR0aWVyLWlnbm9yZSAqL1xuICAgIGNvbnN0IGFnQ2hhcnRUYWcgPSBnZXRWdWVUYWcoYmluZGluZ3MsIGF0dHJpYnV0ZXMpXG5cbiAgICBsZXQgdGVtcGxhdGUgPSBiaW5kaW5ncy50ZW1wbGF0ZSA/PyBhZ0NoYXJ0VGFnO1xuICAgIE9iamVjdC52YWx1ZXMoYmluZGluZ3MucGxhY2Vob2xkZXJzKS5mb3JFYWNoKChwbGFjZWhvbGRlcikgPT4ge1xuICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UocGxhY2Vob2xkZXIsIGFnQ2hhcnRUYWcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbnZlcnRUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGdldEFsbE1ldGhvZHMoYmluZGluZ3M6IGFueSk6IFtzdHJpbmdbXSwgc3RyaW5nW10sIHN0cmluZ1tdXSB7XG4gICAgY29uc3QgZXh0ZXJuYWxFdmVudEhhbmRsZXJzID0gYmluZGluZ3MuZXh0ZXJuYWxFdmVudEhhbmRsZXJzLm1hcCgoZXZlbnQpID0+IHByb2Nlc3NGdW5jdGlvbihldmVudC5ib2R5KSk7XG4gICAgY29uc3QgaW5zdGFuY2VNZXRob2RzID0gYmluZGluZ3MuaW5zdGFuY2VNZXRob2RzLm1hcChwcm9jZXNzRnVuY3Rpb24pO1xuXG4gICAgY29uc3QgZ2xvYmFsTWV0aG9kcyA9IGJpbmRpbmdzLmdsb2JhbHMubWFwKChib2R5KSA9PiB7XG4gICAgICAgIGNvbnN0IGZ1bmNOYW1lID0gZ2V0RnVuY3Rpb25OYW1lKGJvZHkpO1xuXG4gICAgICAgIGlmIChmdW5jTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGB3aW5kb3cuJHtmdW5jTmFtZX0gPSAke2JvZHl9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHByb2JhYmx5IGEgdmFyXG4gICAgICAgIHJldHVybiBib2R5O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIFtleHRlcm5hbEV2ZW50SGFuZGxlcnMsIGluc3RhbmNlTWV0aG9kcywgZ2xvYmFsTWV0aG9kc107XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YW5pbGxhVG9WdWUzKGJpbmRpbmdzOiBhbnksIGNvbXBvbmVudEZpbGVOYW1lczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHsgcHJvcGVydGllcyB9ID0gYmluZGluZ3M7XG4gICAgY29uc3QgaW1wb3J0cyA9IGdldEltcG9ydHMoY29tcG9uZW50RmlsZU5hbWVzLCBiaW5kaW5ncyk7XG4gICAgY29uc3QgW2V4dGVybmFsRXZlbnRIYW5kbGVycywgaW5zdGFuY2VNZXRob2RzLCBnbG9iYWxNZXRob2RzXSA9IGdldEFsbE1ldGhvZHMoYmluZGluZ3MpO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IE9iamVjdC5rZXlzKGJpbmRpbmdzLnBsYWNlaG9sZGVycyk7XG5cbiAgICBjb25zdCBtZXRob2RzID0gaW5zdGFuY2VNZXRob2RzLmNvbmNhdChleHRlcm5hbEV2ZW50SGFuZGxlcnMpO1xuXG4gICAgbGV0IG1haW5GaWxlOiBzdHJpbmc7XG5cbiAgICBpZiAocGxhY2Vob2xkZXJzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBwcm9wZXJ0aWVzLmZpbmQoKHApID0+IHAubmFtZSA9PT0gJ29wdGlvbnMnKTtcbiAgICAgICAgY29uc3QgeyBwcm9wZXJ0eUFzc2lnbm1lbnRzLCBwcm9wZXJ0eVZhcnMsIHByb3BlcnR5QXR0cmlidXRlcyB9ID0gZ2V0UHJvcGVydHlCaW5kaW5ncyhiaW5kaW5ncywgb3B0aW9ucyk7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoYmluZGluZ3MsIHByb3BlcnR5QXR0cmlidXRlcyk7XG5cbiAgICAgICAgbWFpbkZpbGUgPSBgXG4gICAgICAgICAgICAke2ltcG9ydHMuam9pbignXFxuJyl9XG5cbiAgICAgICAgICAgICR7Z2xvYmFsTWV0aG9kcy5qb2luKCdcXG5cXG4nKX1cblxuICAgICAgICAgICAgY29uc3QgQ2hhcnRFeGFtcGxlID0ge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBcXGBcXG4ke3RlbXBsYXRlfVxcbiAgXFxgLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2FnLWNoYXJ0cy12dWUnOiBBZ0NoYXJ0c1Z1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGF0YSgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR7cHJvcGVydHlWYXJzLmpvaW4oYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGApfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAke1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eUFzc2lnbm1lbnRzLmxlbmd0aCAhPT0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBgXG4gICAgICAgICAgICAgICAgY3JlYXRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHtwcm9wZXJ0eUFzc2lnbm1lbnRzLmpvaW4oYDtcbiAgICAgICAgICAgICAgICAgICAgYCl9XG4gICAgICAgICAgICAgICAgfSxgXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICcnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICR7XG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmdzLmluaXQubGVuZ3RoICE9PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGBcbiAgICAgICAgICAgICAgICBtb3VudGVkKCkge1xuICAgICAgICAgICAgICAgICAgICAke2JpbmRpbmdzLmluaXQuam9pbihgO1xuICAgICAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgICAgICB9LGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDogJydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kcy5sZW5ndGggIT09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgID8gYFxuICAgICAgICAgICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgICAgICAgICAgJHttZXRob2RzLm1hcCgoc25pcHBldCkgPT4gYCR7c25pcHBldC50cmltKCl9LGApLmpvaW4oYFxuICAgICAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDogJydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNyZWF0ZUFwcChDaGFydEV4YW1wbGUpLm1vdW50KFwiI2FwcFwiKTtcbiAgICAgICAgYDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjb21wb25lbnRzOiBBcnJheTx7IHNlbGVjdG9yOiBzdHJpbmc7IGNsYXNzTmFtZTogc3RyaW5nIH0+ID0gW107XG5cbiAgICAgICAgbGV0IHRlbXBsYXRlID0gYmluZGluZ3MudGVtcGxhdGUudHJpbSgpO1xuICAgICAgICBPYmplY3QuZW50cmllcyhiaW5kaW5ncy5wbGFjZWhvbGRlcnMpLmZvckVhY2goKFtpZCwgcGxhY2Vob2xkZXJdKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RvciA9IHRvS2ViYWJDYXNlKGlkKTtcbiAgICAgICAgICAgIGNvbnN0IHsgc3R5bGUgfSA9IGJpbmRpbmdzLmNoYXJ0QXR0cmlidXRlc1tpZF07XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UocGxhY2Vob2xkZXIsIGA8JHtzZWxlY3Rvcn0gc3R5bGU9XCIke3N0eWxlfVwiPjwvJHtzZWxlY3Rvcn0+YCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1haW5GaWxlID0gYFxuICAgICAgICAgICAgJHtpbXBvcnRzLmpvaW4oJ1xcbicpfVxuXG4gICAgICAgICAgICAke2dsb2JhbE1ldGhvZHMuam9pbignXFxuXFxuJyl9XG4gICAgICAgIGA7XG5cbiAgICAgICAgcGxhY2Vob2xkZXJzLmZvckVhY2goKGlkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RvciA9IHRvS2ViYWJDYXNlKGlkKTtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IHRvVGl0bGVDYXNlKGlkKTtcblxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gYmluZGluZ3MuY2hhcnRQcm9wZXJ0aWVzW2lkXTtcbiAgICAgICAgICAgIGNvbnN0IHsgcHJvcGVydHlWYXJzLCBwcm9wZXJ0eUF0dHJpYnV0ZXMgfSA9IGdldFByb3BlcnR5QmluZGluZ3MoXG4gICAgICAgICAgICAgICAgYmluZGluZ3MsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5maW5kKChwKSA9PiBwLm5hbWUgPT09IHByb3BlcnR5TmFtZSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGdldFZ1ZVRhZyhiaW5kaW5ncywgcHJvcGVydHlBdHRyaWJ1dGVzKTtcblxuICAgICAgICAgICAgbWFpbkZpbGUgPSBgJHttYWluRmlsZX1cblxuICAgICAgICAgICAgY29uc3QgJHtjbGFzc05hbWV9ID0ge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBcXGBcXG4ke2luZGVudFRlbXBsYXRlKHRlbXBsYXRlLCAyLCAyKX1cXG4gIFxcYCxcbiAgICAgICAgICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhZy1jaGFydHMtdnVlJzogQWdDaGFydHNWdWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGEoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAke3Byb3BlcnR5VmFycy5qb2luKGAsXG4gICAgICAgICAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBgO1xuXG4gICAgICAgICAgICBjb21wb25lbnRzLnB1c2goeyBzZWxlY3RvciwgY2xhc3NOYW1lIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBtYWluRmlsZSA9IGAke21haW5GaWxlfVxuXG4gICAgICAgIGNvbnN0IENoYXJ0RXhhbXBsZSA9IHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiBcXGBcXG4ke2luZGVudFRlbXBsYXRlKHRlbXBsYXRlLCAyLCAyKX1cXG4gIFxcYCxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgICAgICAgICAke2NvbXBvbmVudHMubWFwKChjKSA9PiBgJyR7Yy5zZWxlY3Rvcn0nOiAke2MuY2xhc3NOYW1lfWApLmpvaW4oYCxcbiAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGVBcHAoQ2hhcnRFeGFtcGxlKS5tb3VudChcIiNhcHBcIik7XG4gICAgICAgIGA7XG4gICAgfVxuXG4gICAgaWYgKGJpbmRpbmdzLnVzZXNDaGFydEFwaSkge1xuICAgICAgICBtYWluRmlsZSA9IG1haW5GaWxlLnJlcGxhY2UoL0FnQ2hhcnRzLihcXHcqKVxcKChcXHcqKSgsfFxcKSkvZywgJ0FnQ2hhcnRzLiQxKHRoaXMuJHJlZnMuYWdDaGFydHMuY2hhcnQkMycpO1xuICAgICAgICBtYWluRmlsZSA9IG1haW5GaWxlLnJlcGxhY2UoXG4gICAgICAgICAgICAvXFwodGhpcy5cXCRyZWZzLmFnQ2hhcnRzLmNoYXJ0LCBvcHRpb25zL2csXG4gICAgICAgICAgICAnKHRoaXMuJHJlZnMuYWdDaGFydHMuY2hhcnQsIHRoaXMub3B0aW9ucydcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWFpbkZpbGU7XG59XG4iXSwibmFtZXMiOlsidmFuaWxsYVRvVnVlMyIsInByb2Nlc3NGdW5jdGlvbiIsImNvZGUiLCJ3cmFwT3B0aW9uc1VwZGF0ZUNvZGUiLCJyZW1vdmVGdW5jdGlvbktleXdvcmQiLCJnZXRJbXBvcnRzIiwiY29tcG9uZW50RmlsZU5hbWVzIiwiYmluZGluZ3MiLCJpbXBvcnRzIiwiY2hhcnRJbXBvcnQiLCJnZXRDaGFydEltcG9ydHMiLCJ1c2VzQ2hhcnRBcGkiLCJwdXNoIiwibWFwIiwiZ2V0SW1wb3J0IiwiY2hhcnRTZXR0aW5ncyIsImVudGVycHJpc2UiLCJnZXRQcm9wZXJ0eUJpbmRpbmdzIiwicHJvcGVydHkiLCJwcm9wZXJ0eUFzc2lnbm1lbnRzIiwicHJvcGVydHlWYXJzIiwicHJvcGVydHlBdHRyaWJ1dGVzIiwibmFtZSIsInZhbHVlIiwiZ2V0VnVlVGFnIiwiYXR0cmlidXRlcyIsImpvaW4iLCJnZXRUZW1wbGF0ZSIsImFnQ2hhcnRUYWciLCJ0ZW1wbGF0ZSIsIk9iamVjdCIsInZhbHVlcyIsInBsYWNlaG9sZGVycyIsImZvckVhY2giLCJwbGFjZWhvbGRlciIsInJlcGxhY2UiLCJjb252ZXJ0VGVtcGxhdGUiLCJnZXRBbGxNZXRob2RzIiwiZXh0ZXJuYWxFdmVudEhhbmRsZXJzIiwiZXZlbnQiLCJib2R5IiwiaW5zdGFuY2VNZXRob2RzIiwiZ2xvYmFsTWV0aG9kcyIsImdsb2JhbHMiLCJmdW5jTmFtZSIsImdldEZ1bmN0aW9uTmFtZSIsInByb3BlcnRpZXMiLCJrZXlzIiwibWV0aG9kcyIsImNvbmNhdCIsIm1haW5GaWxlIiwibGVuZ3RoIiwib3B0aW9ucyIsImZpbmQiLCJwIiwiaW5pdCIsInNuaXBwZXQiLCJ0cmltIiwiY29tcG9uZW50cyIsImVudHJpZXMiLCJpZCIsInNlbGVjdG9yIiwidG9LZWJhYkNhc2UiLCJzdHlsZSIsImNoYXJ0QXR0cmlidXRlcyIsImNsYXNzTmFtZSIsInRvVGl0bGVDYXNlIiwicHJvcGVydHlOYW1lIiwiY2hhcnRQcm9wZXJ0aWVzIiwiaW5kZW50VGVtcGxhdGUiLCJjIl0sIm1hcHBp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