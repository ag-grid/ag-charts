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
    default: function() {
        return _default;
    },
    internalParser: function() {
        return internalParser;
    },
    parser: function() {
        return parser;
    }
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _object_without_properties_loose = require("@swc/helpers/_/_object_without_properties_loose");
const _cheerio = /*#__PURE__*/ _interop_require_wildcard._(require("cheerio"));
const _typescript = /*#__PURE__*/ _interop_require_default._(require("typescript"));
const _parserutils = require("./parser-utils");
const chartVariableName = 'chart';
const optionsVariableName = 'options';
const REMOVE_ME = [
    optionsVariableName,
    'chartOptions1',
    'chartOptions2',
    'chartOptions3',
    'chartOptions4',
    'chartOptions5'
];
const PROPERTIES = REMOVE_ME;
function tsGenerateWithOptionReferences(node, srcFile) {
    return (0, _parserutils.tsGenerate)(node, srcFile).replace(new RegExp(`AgCharts\\.update\\(chart, options\\);?`, 'g'), '');
}
function parser({ srcFile, html, exampleSettings }) {
    const bindings = internalParser((0, _parserutils.readAsJsFile)(srcFile, {
        includeImports: true
    }), html, exampleSettings);
    const typedBindings = internalParser(srcFile, html, exampleSettings);
    return {
        bindings,
        typedBindings
    };
}
function internalParser(js, html, exampleSettings) {
    const domTree = _cheerio.load(html, null, false);
    domTree('style').remove();
    const domEventHandlers = (0, _parserutils.extractEventHandlers)(domTree, _parserutils.recognizedDomEvents);
    const tsTree = (0, _parserutils.parseFile)(js);
    const tsCollectors = [];
    const tsOptionsCollectors = [];
    const registered = [
        chartVariableName,
        optionsVariableName
    ];
    // handler is the function name, params are any function parameters
    domEventHandlers.forEach(([_, handler, params])=>{
        if (registered.indexOf(handler) > -1) {
            return;
        }
        registered.push(handler);
        // one of the event handlers extracted earlier (onclick, onchange etc)
        tsCollectors.push({
            matches: (node)=>(0, _parserutils.tsNodeIsFunctionWithName)(node, handler),
            apply: (bindings, node)=>{
                bindings.externalEventHandlers.push({
                    name: handler,
                    params: params,
                    body: tsGenerateWithOptionReferences(node, tsTree)
                });
            }
        });
    });
    const unboundInstanceMethods = (0, _parserutils.extractUnboundInstanceMethods)(tsTree);
    // functions marked as "inScope" will be added to "instance" methods, as opposed to "global" ones
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsInScope)(node, unboundInstanceMethods),
        apply: (bindings, node)=>bindings.instanceMethods.push((0, _parserutils.removeInScopeJsDoc)(tsGenerateWithOptionReferences(node, tsTree)))
    });
    // anything not marked as "inScope" is considered a "global" method
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsUnusedFunction)(node, registered, unboundInstanceMethods),
        apply: (bindings, node)=>bindings.globals.push((0, _parserutils.tsGenerate)(node, tsTree))
    });
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsPropertyWithName)(node, 'container'),
        apply: (bindings, node)=>{
            const { initializer } = node;
            if (!(0, _parserutils.tsNodeIsFunctionCall)(initializer) || !(0, _parserutils.tsNodeIsPropertyAccessExpressionOf)(initializer.expression, [
                'document',
                'getElementById'
            ])) {
                throw new Error('Invalid container definition (must be in form of document.getElementById)');
            }
            let propertyAssignment = node;
            while(propertyAssignment != null && !(0, _parserutils.tsNodeIsGlobalVar)(propertyAssignment)){
                propertyAssignment = propertyAssignment.parent;
            }
            if (propertyAssignment == null || !(0, _parserutils.tsNodeIsGlobalVar)(propertyAssignment)) {
                throw new Error('AgChartOptions was not assigned to variable');
            }
            const propertyName = propertyAssignment.name.escapedText;
            const id = initializer.arguments[0].text;
            let code = (0, _parserutils.tsGenerate)(propertyAssignment.initializer, tsTree);
            code = code.replace(/container:.*/, '');
            registered.push(propertyName);
            bindings.chartProperties[id] = propertyName;
            bindings.properties.push({
                name: propertyName,
                value: code
            });
        }
    });
    // anything vars is considered an "global" var
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsTopLevelVariable)(node, registered),
        apply: (bindings, node)=>{
            const code = (0, _parserutils.tsGenerate)(node, tsTree);
            // FIXME - removes AgChartOptions. There's got to be a better way to do this...
            if (code.includes('document.getElementById')) return;
            bindings.globals.push(code);
        }
    });
    // optionsCollectors captures all events, properties etc that are related to options
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsGlobalVarWithName)(node, optionsVariableName),
        apply: (bindings, node)=>{
            const initializer = node.initializer;
            if ((initializer == null ? void 0 : initializer.kind) !== _typescript.default.SyntaxKind.ObjectLiteralExpression) return bindings;
            initializer.properties.forEach((prop)=>{
                bindings = (0, _parserutils.tsCollect)(prop, bindings, tsOptionsCollectors, false);
            });
            return bindings;
        }
    });
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsGlobalFunctionCall)(node),
        apply: (bindings, node)=>bindings.init.push((0, _parserutils.tsGenerate)(node, tsTree))
    });
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsTypeDeclaration)(node),
        apply: (bindings, node)=>{
            const declaration = (0, _parserutils.tsGenerate)(node, tsTree);
            bindings.declarations.push(declaration);
        }
    });
    // For React we need to identify the external dependencies for callbacks to prevent stale closures
    const GLOBAL_DEPS = new Set([
        'console',
        'document',
        'Error',
        'AgCharts',
        'chart',
        'window',
        'Image',
        'Date',
        'this'
    ]);
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsTopLevelFunction)(node),
        apply: (bindings, node)=>{
            const body = node.body;
            const allVariables = new Set(body ? (0, _parserutils.findAllVariables)(body) : []);
            if (node.parameters && node.parameters.length > 0) {
                node.parameters.forEach((p)=>{
                    allVariables.add(p.name.getText());
                });
            }
            const deps = body ? (0, _parserutils.findAllAccessedProperties)(body) : [];
            const allDeps = deps.filter((id)=>{
                // Ignore locally defined variables
                const isVariable = allVariables.has(id);
                // Let's assume that all caps are constants so should be ignored, i.e KEY_UP
                const isCapsConst = id === id.toUpperCase();
                return !isVariable && !isCapsConst && !GLOBAL_DEPS.has(id);
            });
            if (allDeps.length > 0) {
                bindings.callbackDependencies[node.name.getText()] = [
                    ...new Set(allDeps)
                ];
            }
        }
    });
    /*
     * properties -> chart related properties
     * globals -> none chart related methods/variables (i.e. non-instance)
     */ const tsBindings = (0, _parserutils.tsCollect)(tsTree, {
        properties: [],
        chartProperties: {},
        externalEventHandlers: [],
        instanceMethods: [],
        globals: [],
        init: [],
        declarations: [],
        callbackDependencies: {}
    }, tsCollectors);
    // Must be record for serialization
    const placeholders = {};
    const chartAttributes = {};
    domTree('div[id]').each((index, elem)=>{
        const _elem_attribs = elem.attribs, { id } = _elem_attribs, rest = _object_without_properties_loose._(_elem_attribs, [
            "id"
        ]);
        const templatePlaceholder = `$$CHART${index}$$`;
        placeholders[id] = templatePlaceholder;
        chartAttributes[id] = rest;
        domTree(elem).replaceWith(templatePlaceholder);
    });
    tsBindings.placeholders = placeholders;
    tsBindings.chartAttributes = chartAttributes;
    tsBindings.template = domTree.html();
    tsBindings.imports = (0, _parserutils.extractImportStatements)(tsTree);
    tsBindings.optionsTypeInfo = (0, _parserutils.extractTypeInfoForVariable)(tsTree, 'options');
    tsBindings.usesChartApi = (0, _parserutils.usesChartApi)(tsTree);
    tsBindings.chartSettings = exampleSettings;
    return tsBindings;
}
const _default = parser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS1zcmMtcGFyc2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5pbXBvcnQgdHlwZSB7IE9iamVjdExpdGVyYWxFeHByZXNzaW9uLCBTaWduYXR1cmVEZWNsYXJhdGlvbiB9IGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQgdHlwZSB7IEV4YW1wbGVTZXR0aW5ncyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7XG4gICAgZXh0cmFjdEV2ZW50SGFuZGxlcnMsXG4gICAgZXh0cmFjdEltcG9ydFN0YXRlbWVudHMsXG4gICAgZXh0cmFjdFR5cGVJbmZvRm9yVmFyaWFibGUsXG4gICAgZXh0cmFjdFVuYm91bmRJbnN0YW5jZU1ldGhvZHMsXG4gICAgZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyxcbiAgICBmaW5kQWxsVmFyaWFibGVzLFxuICAgIHBhcnNlRmlsZSxcbiAgICByZWFkQXNKc0ZpbGUsXG4gICAgcmVjb2duaXplZERvbUV2ZW50cyxcbiAgICByZW1vdmVJblNjb3BlSnNEb2MsXG4gICAgdHNDb2xsZWN0LFxuICAgIHRzR2VuZXJhdGUsXG4gICAgdHNOb2RlSXNGdW5jdGlvbkNhbGwsXG4gICAgdHNOb2RlSXNGdW5jdGlvbldpdGhOYW1lLFxuICAgIHRzTm9kZUlzR2xvYmFsRnVuY3Rpb25DYWxsLFxuICAgIHRzTm9kZUlzR2xvYmFsVmFyLFxuICAgIHRzTm9kZUlzR2xvYmFsVmFyV2l0aE5hbWUsXG4gICAgdHNOb2RlSXNJblNjb3BlLFxuICAgIHRzTm9kZUlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uT2YsXG4gICAgdHNOb2RlSXNQcm9wZXJ0eVdpdGhOYW1lLFxuICAgIHRzTm9kZUlzVG9wTGV2ZWxGdW5jdGlvbixcbiAgICB0c05vZGVJc1RvcExldmVsVmFyaWFibGUsXG4gICAgdHNOb2RlSXNUeXBlRGVjbGFyYXRpb24sXG4gICAgdHNOb2RlSXNVbnVzZWRGdW5jdGlvbixcbiAgICB1c2VzQ2hhcnRBcGksXG59IGZyb20gJy4vcGFyc2VyLXV0aWxzJztcblxuY29uc3QgY2hhcnRWYXJpYWJsZU5hbWUgPSAnY2hhcnQnO1xuY29uc3Qgb3B0aW9uc1ZhcmlhYmxlTmFtZSA9ICdvcHRpb25zJztcbmNvbnN0IFJFTU9WRV9NRSA9IFtcbiAgICBvcHRpb25zVmFyaWFibGVOYW1lLFxuICAgICdjaGFydE9wdGlvbnMxJyxcbiAgICAnY2hhcnRPcHRpb25zMicsXG4gICAgJ2NoYXJ0T3B0aW9uczMnLFxuICAgICdjaGFydE9wdGlvbnM0JyxcbiAgICAnY2hhcnRPcHRpb25zNScsXG5dO1xuY29uc3QgUFJPUEVSVElFUyA9IFJFTU9WRV9NRTtcblxuZnVuY3Rpb24gdHNHZW5lcmF0ZVdpdGhPcHRpb25SZWZlcmVuY2VzKG5vZGUsIHNyY0ZpbGUpIHtcbiAgICByZXR1cm4gdHNHZW5lcmF0ZShub2RlLCBzcmNGaWxlKS5yZXBsYWNlKG5ldyBSZWdFeHAoYEFnQ2hhcnRzXFxcXC51cGRhdGVcXFxcKGNoYXJ0LCBvcHRpb25zXFxcXCk7P2AsICdnJyksICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlcih7XG4gICAgc3JjRmlsZSxcbiAgICBodG1sLFxuICAgIGV4YW1wbGVTZXR0aW5ncyxcbn06IHtcbiAgICBzcmNGaWxlOiBzdHJpbmc7XG4gICAgaHRtbDogc3RyaW5nO1xuICAgIGV4YW1wbGVTZXR0aW5nczogRXhhbXBsZVNldHRpbmdzO1xufSkge1xuICAgIGNvbnN0IGJpbmRpbmdzID0gaW50ZXJuYWxQYXJzZXIocmVhZEFzSnNGaWxlKHNyY0ZpbGUsIHsgaW5jbHVkZUltcG9ydHM6IHRydWUgfSksIGh0bWwsIGV4YW1wbGVTZXR0aW5ncyk7XG4gICAgY29uc3QgdHlwZWRCaW5kaW5ncyA9IGludGVybmFsUGFyc2VyKHNyY0ZpbGUsIGh0bWwsIGV4YW1wbGVTZXR0aW5ncyk7XG4gICAgcmV0dXJuIHsgYmluZGluZ3MsIHR5cGVkQmluZGluZ3MgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsUGFyc2VyKGpzLCBodG1sLCBleGFtcGxlU2V0dGluZ3MpIHtcbiAgICBjb25zdCBkb21UcmVlID0gY2hlZXJpby5sb2FkKGh0bWwsIG51bGwsIGZhbHNlKTtcbiAgICBkb21UcmVlKCdzdHlsZScpLnJlbW92ZSgpO1xuXG4gICAgY29uc3QgZG9tRXZlbnRIYW5kbGVycyA9IGV4dHJhY3RFdmVudEhhbmRsZXJzKGRvbVRyZWUsIHJlY29nbml6ZWREb21FdmVudHMpO1xuICAgIGNvbnN0IHRzVHJlZSA9IHBhcnNlRmlsZShqcyk7XG4gICAgY29uc3QgdHNDb2xsZWN0b3JzID0gW107XG4gICAgY29uc3QgdHNPcHRpb25zQ29sbGVjdG9ycyA9IFtdO1xuICAgIGNvbnN0IHJlZ2lzdGVyZWQgPSBbY2hhcnRWYXJpYWJsZU5hbWUsIG9wdGlvbnNWYXJpYWJsZU5hbWVdO1xuXG4gICAgLy8gaGFuZGxlciBpcyB0aGUgZnVuY3Rpb24gbmFtZSwgcGFyYW1zIGFyZSBhbnkgZnVuY3Rpb24gcGFyYW1ldGVyc1xuICAgIGRvbUV2ZW50SGFuZGxlcnMuZm9yRWFjaCgoW18sIGhhbmRsZXIsIHBhcmFtc10pID0+IHtcbiAgICAgICAgaWYgKHJlZ2lzdGVyZWQuaW5kZXhPZihoYW5kbGVyKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZWdpc3RlcmVkLnB1c2goaGFuZGxlcik7XG5cbiAgICAgICAgLy8gb25lIG9mIHRoZSBldmVudCBoYW5kbGVycyBleHRyYWN0ZWQgZWFybGllciAob25jbGljaywgb25jaGFuZ2UgZXRjKVxuICAgICAgICB0c0NvbGxlY3RvcnMucHVzaCh7XG4gICAgICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNGdW5jdGlvbldpdGhOYW1lKG5vZGUsIGhhbmRsZXIpLFxuICAgICAgICAgICAgYXBwbHk6IChiaW5kaW5ncywgbm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIGJpbmRpbmdzLmV4dGVybmFsRXZlbnRIYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogaGFuZGxlcixcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IHRzR2VuZXJhdGVXaXRoT3B0aW9uUmVmZXJlbmNlcyhub2RlLCB0c1RyZWUpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB1bmJvdW5kSW5zdGFuY2VNZXRob2RzID0gZXh0cmFjdFVuYm91bmRJbnN0YW5jZU1ldGhvZHModHNUcmVlKTtcbiAgICAvLyBmdW5jdGlvbnMgbWFya2VkIGFzIFwiaW5TY29wZVwiIHdpbGwgYmUgYWRkZWQgdG8gXCJpbnN0YW5jZVwiIG1ldGhvZHMsIGFzIG9wcG9zZWQgdG8gXCJnbG9iYWxcIiBvbmVzXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNJblNjb3BlKG5vZGUsIHVuYm91bmRJbnN0YW5jZU1ldGhvZHMpLFxuICAgICAgICBhcHBseTogKGJpbmRpbmdzLCBub2RlKSA9PlxuICAgICAgICAgICAgYmluZGluZ3MuaW5zdGFuY2VNZXRob2RzLnB1c2gocmVtb3ZlSW5TY29wZUpzRG9jKHRzR2VuZXJhdGVXaXRoT3B0aW9uUmVmZXJlbmNlcyhub2RlLCB0c1RyZWUpKSksXG4gICAgfSk7XG5cbiAgICAvLyBhbnl0aGluZyBub3QgbWFya2VkIGFzIFwiaW5TY29wZVwiIGlzIGNvbnNpZGVyZWQgYSBcImdsb2JhbFwiIG1ldGhvZFxuICAgIHRzQ29sbGVjdG9ycy5wdXNoKHtcbiAgICAgICAgbWF0Y2hlczogKG5vZGUpID0+IHRzTm9kZUlzVW51c2VkRnVuY3Rpb24obm9kZSwgcmVnaXN0ZXJlZCwgdW5ib3VuZEluc3RhbmNlTWV0aG9kcyksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGUpID0+IGJpbmRpbmdzLmdsb2JhbHMucHVzaCh0c0dlbmVyYXRlKG5vZGUsIHRzVHJlZSkpLFxuICAgIH0pO1xuXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNQcm9wZXJ0eVdpdGhOYW1lKG5vZGUsICdjb250YWluZXInKSxcbiAgICAgICAgYXBwbHk6IChiaW5kaW5ncywgbm9kZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBpbml0aWFsaXplciB9ID0gbm9kZTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAhdHNOb2RlSXNGdW5jdGlvbkNhbGwoaW5pdGlhbGl6ZXIpIHx8XG4gICAgICAgICAgICAgICAgIXRzTm9kZUlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uT2YoaW5pdGlhbGl6ZXIuZXhwcmVzc2lvbiwgWydkb2N1bWVudCcsICdnZXRFbGVtZW50QnlJZCddKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbnRhaW5lciBkZWZpbml0aW9uIChtdXN0IGJlIGluIGZvcm0gb2YgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQpJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBwcm9wZXJ0eUFzc2lnbm1lbnQgPSBub2RlO1xuICAgICAgICAgICAgd2hpbGUgKHByb3BlcnR5QXNzaWdubWVudCAhPSBudWxsICYmICF0c05vZGVJc0dsb2JhbFZhcihwcm9wZXJ0eUFzc2lnbm1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlBc3NpZ25tZW50ID0gcHJvcGVydHlBc3NpZ25tZW50LnBhcmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eUFzc2lnbm1lbnQgPT0gbnVsbCB8fCAhdHNOb2RlSXNHbG9iYWxWYXIocHJvcGVydHlBc3NpZ25tZW50KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQWdDaGFydE9wdGlvbnMgd2FzIG5vdCBhc3NpZ25lZCB0byB2YXJpYWJsZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eUFzc2lnbm1lbnQubmFtZS5lc2NhcGVkVGV4dDtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gaW5pdGlhbGl6ZXIuYXJndW1lbnRzWzBdLnRleHQ7XG5cbiAgICAgICAgICAgIGxldCBjb2RlID0gdHNHZW5lcmF0ZShwcm9wZXJ0eUFzc2lnbm1lbnQuaW5pdGlhbGl6ZXIsIHRzVHJlZSk7XG4gICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9jb250YWluZXI6LiovLCAnJyk7XG5cbiAgICAgICAgICAgIHJlZ2lzdGVyZWQucHVzaChwcm9wZXJ0eU5hbWUpO1xuICAgICAgICAgICAgYmluZGluZ3MuY2hhcnRQcm9wZXJ0aWVzW2lkXSA9IHByb3BlcnR5TmFtZTtcbiAgICAgICAgICAgIGJpbmRpbmdzLnByb3BlcnRpZXMucHVzaCh7IG5hbWU6IHByb3BlcnR5TmFtZSwgdmFsdWU6IGNvZGUgfSk7XG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBhbnl0aGluZyB2YXJzIGlzIGNvbnNpZGVyZWQgYW4gXCJnbG9iYWxcIiB2YXJcbiAgICB0c0NvbGxlY3RvcnMucHVzaCh7XG4gICAgICAgIG1hdGNoZXM6IChub2RlKSA9PiB0c05vZGVJc1RvcExldmVsVmFyaWFibGUobm9kZSwgcmVnaXN0ZXJlZCksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvZGUgPSB0c0dlbmVyYXRlKG5vZGUsIHRzVHJlZSk7XG5cbiAgICAgICAgICAgIC8vIEZJWE1FIC0gcmVtb3ZlcyBBZ0NoYXJ0T3B0aW9ucy4gVGhlcmUncyBnb3QgdG8gYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXMuLi5cbiAgICAgICAgICAgIGlmIChjb2RlLmluY2x1ZGVzKCdkb2N1bWVudC5nZXRFbGVtZW50QnlJZCcpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGJpbmRpbmdzLmdsb2JhbHMucHVzaChjb2RlKTtcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIG9wdGlvbnNDb2xsZWN0b3JzIGNhcHR1cmVzIGFsbCBldmVudHMsIHByb3BlcnRpZXMgZXRjIHRoYXQgYXJlIHJlbGF0ZWQgdG8gb3B0aW9uc1xuICAgIHRzQ29sbGVjdG9ycy5wdXNoKHtcbiAgICAgICAgbWF0Y2hlczogKG5vZGUpID0+IHRzTm9kZUlzR2xvYmFsVmFyV2l0aE5hbWUobm9kZSwgb3B0aW9uc1ZhcmlhYmxlTmFtZSksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGU6IHRzLlZhcmlhYmxlRGVjbGFyYXRpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluaXRpYWxpemVyID0gbm9kZS5pbml0aWFsaXplcjtcbiAgICAgICAgICAgIGlmIChpbml0aWFsaXplcj8ua2luZCAhPT0gdHMuU3ludGF4S2luZC5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikgcmV0dXJuIGJpbmRpbmdzO1xuXG4gICAgICAgICAgICAoaW5pdGlhbGl6ZXIgYXMgT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24pLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgICAgICAgICAgIGJpbmRpbmdzID0gdHNDb2xsZWN0KHByb3AsIGJpbmRpbmdzLCB0c09wdGlvbnNDb2xsZWN0b3JzLCBmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmdzO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNHbG9iYWxGdW5jdGlvbkNhbGwobm9kZSksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGUpID0+IGJpbmRpbmdzLmluaXQucHVzaCh0c0dlbmVyYXRlKG5vZGUsIHRzVHJlZSkpLFxuICAgIH0pO1xuXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNUeXBlRGVjbGFyYXRpb24obm9kZSksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uID0gdHNHZW5lcmF0ZShub2RlLCB0c1RyZWUpO1xuICAgICAgICAgICAgYmluZGluZ3MuZGVjbGFyYXRpb25zLnB1c2goZGVjbGFyYXRpb24pO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gRm9yIFJlYWN0IHdlIG5lZWQgdG8gaWRlbnRpZnkgdGhlIGV4dGVybmFsIGRlcGVuZGVuY2llcyBmb3IgY2FsbGJhY2tzIHRvIHByZXZlbnQgc3RhbGUgY2xvc3VyZXNcbiAgICBjb25zdCBHTE9CQUxfREVQUyA9IG5ldyBTZXQoW1xuICAgICAgICAnY29uc29sZScsXG4gICAgICAgICdkb2N1bWVudCcsXG4gICAgICAgICdFcnJvcicsXG4gICAgICAgICdBZ0NoYXJ0cycsXG4gICAgICAgICdjaGFydCcsXG4gICAgICAgICd3aW5kb3cnLFxuICAgICAgICAnSW1hZ2UnLFxuICAgICAgICAnRGF0ZScsXG4gICAgICAgICd0aGlzJyxcbiAgICBdKTtcbiAgICB0c0NvbGxlY3RvcnMucHVzaCh7XG4gICAgICAgIG1hdGNoZXM6IChub2RlKSA9PiB0c05vZGVJc1RvcExldmVsRnVuY3Rpb24obm9kZSksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGU6IFNpZ25hdHVyZURlY2xhcmF0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gKG5vZGUgYXMgYW55KS5ib2R5O1xuXG4gICAgICAgICAgICBjb25zdCBhbGxWYXJpYWJsZXMgPSBuZXcgU2V0KGJvZHkgPyBmaW5kQWxsVmFyaWFibGVzKGJvZHkpIDogW10pO1xuICAgICAgICAgICAgaWYgKG5vZGUucGFyYW1ldGVycyAmJiBub2RlLnBhcmFtZXRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIG5vZGUucGFyYW1ldGVycy5mb3JFYWNoKChwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFsbFZhcmlhYmxlcy5hZGQocC5uYW1lLmdldFRleHQoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRlcHMgPSBib2R5ID8gZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyhib2R5KSA6IFtdO1xuICAgICAgICAgICAgY29uc3QgYWxsRGVwcyA9IGRlcHMuZmlsdGVyKChpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSWdub3JlIGxvY2FsbHkgZGVmaW5lZCB2YXJpYWJsZXNcbiAgICAgICAgICAgICAgICBjb25zdCBpc1ZhcmlhYmxlID0gYWxsVmFyaWFibGVzLmhhcyhpZCk7XG4gICAgICAgICAgICAgICAgLy8gTGV0J3MgYXNzdW1lIHRoYXQgYWxsIGNhcHMgYXJlIGNvbnN0YW50cyBzbyBzaG91bGQgYmUgaWdub3JlZCwgaS5lIEtFWV9VUFxuICAgICAgICAgICAgICAgIGNvbnN0IGlzQ2Fwc0NvbnN0ID0gaWQgPT09IGlkLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFpc1ZhcmlhYmxlICYmICFpc0NhcHNDb25zdCAmJiAhR0xPQkFMX0RFUFMuaGFzKGlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGFsbERlcHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGJpbmRpbmdzLmNhbGxiYWNrRGVwZW5kZW5jaWVzW25vZGUubmFtZS5nZXRUZXh0KCldID0gWy4uLm5ldyBTZXQoYWxsRGVwcyldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgLypcbiAgICAgKiBwcm9wZXJ0aWVzIC0+IGNoYXJ0IHJlbGF0ZWQgcHJvcGVydGllc1xuICAgICAqIGdsb2JhbHMgLT4gbm9uZSBjaGFydCByZWxhdGVkIG1ldGhvZHMvdmFyaWFibGVzIChpLmUuIG5vbi1pbnN0YW5jZSlcbiAgICAgKi9cbiAgICBjb25zdCB0c0JpbmRpbmdzID0gdHNDb2xsZWN0KFxuICAgICAgICB0c1RyZWUsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxuICAgICAgICAgICAgY2hhcnRQcm9wZXJ0aWVzOiB7fSxcbiAgICAgICAgICAgIGV4dGVybmFsRXZlbnRIYW5kbGVyczogW10sXG4gICAgICAgICAgICBpbnN0YW5jZU1ldGhvZHM6IFtdLFxuICAgICAgICAgICAgZ2xvYmFsczogW10sXG4gICAgICAgICAgICBpbml0OiBbXSxcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uczogW10sXG4gICAgICAgICAgICBjYWxsYmFja0RlcGVuZGVuY2llczoge30sXG4gICAgICAgIH0sXG4gICAgICAgIHRzQ29sbGVjdG9yc1xuICAgICk7XG5cbiAgICAvLyBNdXN0IGJlIHJlY29yZCBmb3Igc2VyaWFsaXphdGlvblxuICAgIGNvbnN0IHBsYWNlaG9sZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGNvbnN0IGNoYXJ0QXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4gPSB7fTtcblxuICAgIGRvbVRyZWUoJ2RpdltpZF0nKS5lYWNoKChpbmRleCwgZWxlbSkgPT4ge1xuICAgICAgICBjb25zdCB7IGlkLCAuLi5yZXN0IH0gPSBlbGVtLmF0dHJpYnM7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlUGxhY2Vob2xkZXIgPSBgJCRDSEFSVCR7aW5kZXh9JCRgO1xuICAgICAgICBwbGFjZWhvbGRlcnNbaWRdID0gdGVtcGxhdGVQbGFjZWhvbGRlcjtcbiAgICAgICAgY2hhcnRBdHRyaWJ1dGVzW2lkXSA9IHJlc3Q7XG4gICAgICAgIGRvbVRyZWUoZWxlbSkucmVwbGFjZVdpdGgodGVtcGxhdGVQbGFjZWhvbGRlcik7XG4gICAgfSk7XG5cbiAgICB0c0JpbmRpbmdzLnBsYWNlaG9sZGVycyA9IHBsYWNlaG9sZGVycztcbiAgICB0c0JpbmRpbmdzLmNoYXJ0QXR0cmlidXRlcyA9IGNoYXJ0QXR0cmlidXRlcztcbiAgICB0c0JpbmRpbmdzLnRlbXBsYXRlID0gZG9tVHJlZS5odG1sKCk7XG4gICAgdHNCaW5kaW5ncy5pbXBvcnRzID0gZXh0cmFjdEltcG9ydFN0YXRlbWVudHModHNUcmVlKTtcbiAgICB0c0JpbmRpbmdzLm9wdGlvbnNUeXBlSW5mbyA9IGV4dHJhY3RUeXBlSW5mb0ZvclZhcmlhYmxlKHRzVHJlZSwgJ29wdGlvbnMnKTtcbiAgICB0c0JpbmRpbmdzLnVzZXNDaGFydEFwaSA9IHVzZXNDaGFydEFwaSh0c1RyZWUpO1xuICAgIHRzQmluZGluZ3MuY2hhcnRTZXR0aW5ncyA9IGV4YW1wbGVTZXR0aW5ncztcblxuICAgIHJldHVybiB0c0JpbmRpbmdzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBwYXJzZXI7XG4iXSwibmFtZXMiOlsiaW50ZXJuYWxQYXJzZXIiLCJwYXJzZXIiLCJjaGFydFZhcmlhYmxlTmFtZSIsIm9wdGlvbnNWYXJpYWJsZU5hbWUiLCJSRU1PVkVfTUUiLCJQUk9QRVJUSUVTIiwidHNHZW5lcmF0ZVdpdGhPcHRpb25SZWZlcmVuY2VzIiwibm9kZSIsInNyY0ZpbGUiLCJ0c0dlbmVyYXRlIiwicmVwbGFjZSIsIlJlZ0V4cCIsImh0bWwiLCJleGFtcGxlU2V0dGluZ3MiLCJiaW5kaW5ncyIsInJlYWRBc0pzRmlsZSIsImluY2x1ZGVJbXBvcnRzIiwidHlwZWRCaW5kaW5ncyIsImpzIiwiZG9tVHJlZSIsImNoZWVyaW8iLCJsb2FkIiwicmVtb3ZlIiwiZG9tRXZlbnRIYW5kbGVycyIsImV4dHJhY3RFdmVudEhhbmRsZXJzIiwicmVjb2duaXplZERvbUV2ZW50cyIsInRzVHJlZSIsInBhcnNlRmlsZSIsInRzQ29sbGVjdG9ycyIsInRzT3B0aW9uc0NvbGxlY3RvcnMiLCJyZWdpc3RlcmVkIiwiZm9yRWFjaCIsIl8iLCJoYW5kbGVyIiwicGFyYW1zIiwiaW5kZXhPZiIsInB1c2giLCJtYXRjaGVzIiwidHNOb2RlSXNGdW5jdGlvbldpdGhOYW1lIiwiYXBwbHkiLCJleHRlcm5hbEV2ZW50SGFuZGxlcnMiLCJuYW1lIiwiYm9keSIsInVuYm91bmRJbnN0YW5jZU1ldGhvZHMiLCJleHRyYWN0VW5ib3VuZEluc3RhbmNlTWV0aG9kcyIsInRzTm9kZUlzSW5TY29wZSIsImluc3RhbmNlTWV0aG9kcyIsInJlbW92ZUluU2NvcGVKc0RvYyIsInRzTm9kZUlzVW51c2VkRnVuY3Rpb24iLCJnbG9iYWxzIiwidHNOb2RlSXNQcm9wZXJ0eVdpdGhOYW1lIiwiaW5pdGlhbGl6ZXIiLCJ0c05vZGVJc0Z1bmN0aW9uQ2FsbCIsInRzTm9kZUlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uT2YiLCJleHByZXNzaW9uIiwiRXJyb3IiLCJwcm9wZXJ0eUFzc2lnbm1lbnQiLCJ0c05vZGVJc0dsb2JhbFZhciIsInBhcmVudCIsInByb3BlcnR5TmFtZSIsImVzY2FwZWRUZXh0IiwiaWQiLCJhcmd1bWVudHMiLCJ0ZXh0IiwiY29kZSIsImNoYXJ0UHJvcGVydGllcyIsInByb3BlcnRpZXMiLCJ2YWx1ZSIsInRzTm9kZUlzVG9wTGV2ZWxWYXJpYWJsZSIsImluY2x1ZGVzIiwidHNOb2RlSXNHbG9iYWxWYXJXaXRoTmFtZSIsImtpbmQiLCJ0cyIsIlN5bnRheEtpbmQiLCJPYmplY3RMaXRlcmFsRXhwcmVzc2lvbiIsInByb3AiLCJ0c0NvbGxlY3QiLCJ0c05vZGVJc0dsb2JhbEZ1bmN0aW9uQ2FsbCIsImluaXQiLCJ0c05vZGVJc1R5cGVEZWNsYXJhdGlvbiIsImRlY2xhcmF0aW9uIiwiZGVjbGFyYXRpb25zIiwiR0xPQkFMX0RFUFMiLCJTZXQiLCJ0c05vZGVJc1RvcExldmVsRnVuY3Rpb24iLCJhbGxWYXJpYWJsZXMiLCJmaW5kQWxsVmFyaWFibGVzIiwicGFyYW1ldGVycyIsImxlbmd0aCIsInAiLCJhZGQiLCJnZXRUZXh0IiwiZGVwcyIsImZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMiLCJhbGxEZXBzIiwiZmlsdGVyIiwiaXNWYXJpYWJsZSIsImhhcyIsImlzQ2Fwc0NvbnN0IiwidG9VcHBlckNhc2UiLCJjYWxsYmFja0RlcGVuZGVuY2llcyIsInRzQmluZGluZ3MiLCJwbGFjZWhvbGRlcnMiLCJjaGFydEF0dHJpYnV0ZXMiLCJlYWNoIiwiaW5kZXgiLCJlbGVtIiwiYXR0cmlicyIsInJlc3QiLCJ0ZW1wbGF0ZVBsYWNlaG9sZGVyIiwicmVwbGFjZVdpdGgiLCJ0ZW1wbGF0ZSIsImltcG9ydHMiLCJleHRyYWN0SW1wb3J0U3RhdGVtZW50cyIsIm9wdGlvbnNUeXBlSW5mbyIsImV4dHJhY3RUeXBlSW5mb0ZvclZhcmlhYmxlIiwidXNlc0NoYXJ0QXBpIiwiY2hhcnRTZXR0aW5ncyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFvUUEsT0FBc0I7ZUFBdEI7O0lBck1nQkEsY0FBYztlQUFkQTs7SUFkQUMsTUFBTTtlQUFOQTs7Ozs7O21FQWpEUztxRUFFVjs2QkE2QlI7QUFFUCxNQUFNQyxvQkFBb0I7QUFDMUIsTUFBTUMsc0JBQXNCO0FBQzVCLE1BQU1DLFlBQVk7SUFDZEQ7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0NBQ0g7QUFDRCxNQUFNRSxhQUFhRDtBQUVuQixTQUFTRSwrQkFBK0JDLElBQUksRUFBRUMsT0FBTztJQUNqRCxPQUFPQyxJQUFBQSx1QkFBVSxFQUFDRixNQUFNQyxTQUFTRSxPQUFPLENBQUMsSUFBSUMsT0FBTyxDQUFDLHVDQUF1QyxDQUFDLEVBQUUsTUFBTTtBQUN6RztBQUVPLFNBQVNWLE9BQU8sRUFDbkJPLE9BQU8sRUFDUEksSUFBSSxFQUNKQyxlQUFl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