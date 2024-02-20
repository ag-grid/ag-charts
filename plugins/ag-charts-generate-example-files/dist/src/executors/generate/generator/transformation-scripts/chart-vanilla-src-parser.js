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
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _object_without_properties_loose = require("@swc/helpers/_/_object_without_properties_loose");
const _cheerio = /*#__PURE__*/ _interop_require_wildcard._(require("cheerio"));
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
            node.initializer.properties.forEach((prop)=>{
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS1zcmMtcGFyc2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5pbXBvcnQgdHlwZSB7IFNpZ25hdHVyZURlY2xhcmF0aW9uIH0gZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB0eXBlIHsgRXhhbXBsZVNldHRpbmdzIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHtcbiAgICBleHRyYWN0RXZlbnRIYW5kbGVycyxcbiAgICBleHRyYWN0SW1wb3J0U3RhdGVtZW50cyxcbiAgICBleHRyYWN0VHlwZUluZm9Gb3JWYXJpYWJsZSxcbiAgICBleHRyYWN0VW5ib3VuZEluc3RhbmNlTWV0aG9kcyxcbiAgICBmaW5kQWxsQWNjZXNzZWRQcm9wZXJ0aWVzLFxuICAgIGZpbmRBbGxWYXJpYWJsZXMsXG4gICAgcGFyc2VGaWxlLFxuICAgIHJlYWRBc0pzRmlsZSxcbiAgICByZWNvZ25pemVkRG9tRXZlbnRzLFxuICAgIHJlbW92ZUluU2NvcGVKc0RvYyxcbiAgICB0c0NvbGxlY3QsXG4gICAgdHNHZW5lcmF0ZSxcbiAgICB0c05vZGVJc0Z1bmN0aW9uQ2FsbCxcbiAgICB0c05vZGVJc0Z1bmN0aW9uV2l0aE5hbWUsXG4gICAgdHNOb2RlSXNHbG9iYWxGdW5jdGlvbkNhbGwsXG4gICAgdHNOb2RlSXNHbG9iYWxWYXIsXG4gICAgdHNOb2RlSXNHbG9iYWxWYXJXaXRoTmFtZSxcbiAgICB0c05vZGVJc0luU2NvcGUsXG4gICAgdHNOb2RlSXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb25PZixcbiAgICB0c05vZGVJc1Byb3BlcnR5V2l0aE5hbWUsXG4gICAgdHNOb2RlSXNUb3BMZXZlbEZ1bmN0aW9uLFxuICAgIHRzTm9kZUlzVG9wTGV2ZWxWYXJpYWJsZSxcbiAgICB0c05vZGVJc1R5cGVEZWNsYXJhdGlvbixcbiAgICB0c05vZGVJc1VudXNlZEZ1bmN0aW9uLFxuICAgIHVzZXNDaGFydEFwaSxcbn0gZnJvbSAnLi9wYXJzZXItdXRpbHMnO1xuXG5jb25zdCBjaGFydFZhcmlhYmxlTmFtZSA9ICdjaGFydCc7XG5jb25zdCBvcHRpb25zVmFyaWFibGVOYW1lID0gJ29wdGlvbnMnO1xuY29uc3QgUkVNT1ZFX01FID0gW1xuICAgIG9wdGlvbnNWYXJpYWJsZU5hbWUsXG4gICAgJ2NoYXJ0T3B0aW9uczEnLFxuICAgICdjaGFydE9wdGlvbnMyJyxcbiAgICAnY2hhcnRPcHRpb25zMycsXG4gICAgJ2NoYXJ0T3B0aW9uczQnLFxuICAgICdjaGFydE9wdGlvbnM1Jyxcbl07XG5jb25zdCBQUk9QRVJUSUVTID0gUkVNT1ZFX01FO1xuXG5mdW5jdGlvbiB0c0dlbmVyYXRlV2l0aE9wdGlvblJlZmVyZW5jZXMobm9kZSwgc3JjRmlsZSkge1xuICAgIHJldHVybiB0c0dlbmVyYXRlKG5vZGUsIHNyY0ZpbGUpLnJlcGxhY2UobmV3IFJlZ0V4cChgQWdDaGFydHNcXFxcLnVwZGF0ZVxcXFwoY2hhcnQsIG9wdGlvbnNcXFxcKTs/YCwgJ2cnKSwgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VyKHtcbiAgICBzcmNGaWxlLFxuICAgIGh0bWwsXG4gICAgZXhhbXBsZVNldHRpbmdzLFxufToge1xuICAgIHNyY0ZpbGU6IHN0cmluZztcbiAgICBodG1sOiBzdHJpbmc7XG4gICAgZXhhbXBsZVNldHRpbmdzOiBFeGFtcGxlU2V0dGluZ3M7XG59KSB7XG4gICAgY29uc3QgYmluZGluZ3MgPSBpbnRlcm5hbFBhcnNlcihyZWFkQXNKc0ZpbGUoc3JjRmlsZSwgeyBpbmNsdWRlSW1wb3J0czogdHJ1ZSB9KSwgaHRtbCwgZXhhbXBsZVNldHRpbmdzKTtcbiAgICBjb25zdCB0eXBlZEJpbmRpbmdzID0gaW50ZXJuYWxQYXJzZXIoc3JjRmlsZSwgaHRtbCwgZXhhbXBsZVNldHRpbmdzKTtcbiAgICByZXR1cm4geyBiaW5kaW5ncywgdHlwZWRCaW5kaW5ncyB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJuYWxQYXJzZXIoanMsIGh0bWwsIGV4YW1wbGVTZXR0aW5ncykge1xuICAgIGNvbnN0IGRvbVRyZWUgPSBjaGVlcmlvLmxvYWQoaHRtbCwgbnVsbCwgZmFsc2UpO1xuICAgIGRvbVRyZWUoJ3N0eWxlJykucmVtb3ZlKCk7XG5cbiAgICBjb25zdCBkb21FdmVudEhhbmRsZXJzID0gZXh0cmFjdEV2ZW50SGFuZGxlcnMoZG9tVHJlZSwgcmVjb2duaXplZERvbUV2ZW50cyk7XG4gICAgY29uc3QgdHNUcmVlID0gcGFyc2VGaWxlKGpzKTtcbiAgICBjb25zdCB0c0NvbGxlY3RvcnMgPSBbXTtcbiAgICBjb25zdCB0c09wdGlvbnNDb2xsZWN0b3JzID0gW107XG4gICAgY29uc3QgcmVnaXN0ZXJlZCA9IFtjaGFydFZhcmlhYmxlTmFtZSwgb3B0aW9uc1ZhcmlhYmxlTmFtZV07XG5cbiAgICAvLyBoYW5kbGVyIGlzIHRoZSBmdW5jdGlvbiBuYW1lLCBwYXJhbXMgYXJlIGFueSBmdW5jdGlvbiBwYXJhbWV0ZXJzXG4gICAgZG9tRXZlbnRIYW5kbGVycy5mb3JFYWNoKChbXywgaGFuZGxlciwgcGFyYW1zXSkgPT4ge1xuICAgICAgICBpZiAocmVnaXN0ZXJlZC5pbmRleE9mKGhhbmRsZXIpID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlZ2lzdGVyZWQucHVzaChoYW5kbGVyKTtcblxuICAgICAgICAvLyBvbmUgb2YgdGhlIGV2ZW50IGhhbmRsZXJzIGV4dHJhY3RlZCBlYXJsaWVyIChvbmNsaWNrLCBvbmNoYW5nZSBldGMpXG4gICAgICAgIHRzQ29sbGVjdG9ycy5wdXNoKHtcbiAgICAgICAgICAgIG1hdGNoZXM6IChub2RlKSA9PiB0c05vZGVJc0Z1bmN0aW9uV2l0aE5hbWUobm9kZSwgaGFuZGxlciksXG4gICAgICAgICAgICBhcHBseTogKGJpbmRpbmdzLCBub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgYmluZGluZ3MuZXh0ZXJuYWxFdmVudEhhbmRsZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBoYW5kbGVyLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgICAgICAgYm9keTogdHNHZW5lcmF0ZVdpdGhPcHRpb25SZWZlcmVuY2VzKG5vZGUsIHRzVHJlZSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHVuYm91bmRJbnN0YW5jZU1ldGhvZHMgPSBleHRyYWN0VW5ib3VuZEluc3RhbmNlTWV0aG9kcyh0c1RyZWUpO1xuICAgIC8vIGZ1bmN0aW9ucyBtYXJrZWQgYXMgXCJpblNjb3BlXCIgd2lsbCBiZSBhZGRlZCB0byBcImluc3RhbmNlXCIgbWV0aG9kcywgYXMgb3Bwb3NlZCB0byBcImdsb2JhbFwiIG9uZXNcbiAgICB0c0NvbGxlY3RvcnMucHVzaCh7XG4gICAgICAgIG1hdGNoZXM6IChub2RlKSA9PiB0c05vZGVJc0luU2NvcGUobm9kZSwgdW5ib3VuZEluc3RhbmNlTWV0aG9kcyksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGUpID0+XG4gICAgICAgICAgICBiaW5kaW5ncy5pbnN0YW5jZU1ldGhvZHMucHVzaChyZW1vdmVJblNjb3BlSnNEb2ModHNHZW5lcmF0ZVdpdGhPcHRpb25SZWZlcmVuY2VzKG5vZGUsIHRzVHJlZSkpKSxcbiAgICB9KTtcblxuICAgIC8vIGFueXRoaW5nIG5vdCBtYXJrZWQgYXMgXCJpblNjb3BlXCIgaXMgY29uc2lkZXJlZCBhIFwiZ2xvYmFsXCIgbWV0aG9kXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNVbnVzZWRGdW5jdGlvbihub2RlLCByZWdpc3RlcmVkLCB1bmJvdW5kSW5zdGFuY2VNZXRob2RzKSxcbiAgICAgICAgYXBwbHk6IChiaW5kaW5ncywgbm9kZSkgPT4gYmluZGluZ3MuZ2xvYmFscy5wdXNoKHRzR2VuZXJhdGUobm9kZSwgdHNUcmVlKSksXG4gICAgfSk7XG5cbiAgICB0c0NvbGxlY3RvcnMucHVzaCh7XG4gICAgICAgIG1hdGNoZXM6IChub2RlKSA9PiB0c05vZGVJc1Byb3BlcnR5V2l0aE5hbWUobm9kZSwgJ2NvbnRhaW5lcicpLFxuICAgICAgICBhcHBseTogKGJpbmRpbmdzLCBub2RlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IGluaXRpYWxpemVyIH0gPSBub2RlO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICF0c05vZGVJc0Z1bmN0aW9uQ2FsbChpbml0aWFsaXplcikgfHxcbiAgICAgICAgICAgICAgICAhdHNOb2RlSXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb25PZihpbml0aWFsaXplci5leHByZXNzaW9uLCBbJ2RvY3VtZW50JywgJ2dldEVsZW1lbnRCeUlkJ10pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29udGFpbmVyIGRlZmluaXRpb24gKG11c3QgYmUgaW4gZm9ybSBvZiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCknKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHByb3BlcnR5QXNzaWdubWVudCA9IG5vZGU7XG4gICAgICAgICAgICB3aGlsZSAocHJvcGVydHlBc3NpZ25tZW50ICE9IG51bGwgJiYgIXRzTm9kZUlzR2xvYmFsVmFyKHByb3BlcnR5QXNzaWdubWVudCkpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUFzc2lnbm1lbnQgPSBwcm9wZXJ0eUFzc2lnbm1lbnQucGFyZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByb3BlcnR5QXNzaWdubWVudCA9PSBudWxsIHx8ICF0c05vZGVJc0dsb2JhbFZhcihwcm9wZXJ0eUFzc2lnbm1lbnQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBZ0NoYXJ0T3B0aW9ucyB3YXMgbm90IGFzc2lnbmVkIHRvIHZhcmlhYmxlJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHByb3BlcnR5QXNzaWdubWVudC5uYW1lLmVzY2FwZWRUZXh0O1xuICAgICAgICAgICAgY29uc3QgaWQgPSBpbml0aWFsaXplci5hcmd1bWVudHNbMF0udGV4dDtcblxuICAgICAgICAgICAgbGV0IGNvZGUgPSB0c0dlbmVyYXRlKHByb3BlcnR5QXNzaWdubWVudC5pbml0aWFsaXplciwgdHNUcmVlKTtcbiAgICAgICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoL2NvbnRhaW5lcjouKi8sICcnKTtcblxuICAgICAgICAgICAgcmVnaXN0ZXJlZC5wdXNoKHByb3BlcnR5TmFtZSk7XG4gICAgICAgICAgICBiaW5kaW5ncy5jaGFydFByb3BlcnRpZXNbaWRdID0gcHJvcGVydHlOYW1lO1xuICAgICAgICAgICAgYmluZGluZ3MucHJvcGVydGllcy5wdXNoKHsgbmFtZTogcHJvcGVydHlOYW1lLCB2YWx1ZTogY29kZSB9KTtcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIGFueXRoaW5nIHZhcnMgaXMgY29uc2lkZXJlZCBhbiBcImdsb2JhbFwiIHZhclxuICAgIHRzQ29sbGVjdG9ycy5wdXNoKHtcbiAgICAgICAgbWF0Y2hlczogKG5vZGUpID0+IHRzTm9kZUlzVG9wTGV2ZWxWYXJpYWJsZShub2RlLCByZWdpc3RlcmVkKSxcbiAgICAgICAgYXBwbHk6IChiaW5kaW5ncywgbm9kZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29kZSA9IHRzR2VuZXJhdGUobm9kZSwgdHNUcmVlKTtcblxuICAgICAgICAgICAgLy8gRklYTUUgLSByZW1vdmVzIEFnQ2hhcnRPcHRpb25zLiBUaGVyZSdzIGdvdCB0byBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcy4uLlxuICAgICAgICAgICAgaWYgKGNvZGUuaW5jbHVkZXMoJ2RvY3VtZW50LmdldEVsZW1lbnRCeUlkJykpIHJldHVybjtcblxuICAgICAgICAgICAgYmluZGluZ3MuZ2xvYmFscy5wdXNoKGNvZGUpO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gb3B0aW9uc0NvbGxlY3RvcnMgY2FwdHVyZXMgYWxsIGV2ZW50cywgcHJvcGVydGllcyBldGMgdGhhdCBhcmUgcmVsYXRlZCB0byBvcHRpb25zXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNHbG9iYWxWYXJXaXRoTmFtZShub2RlLCBvcHRpb25zVmFyaWFibGVOYW1lKSxcbiAgICAgICAgYXBwbHk6IChiaW5kaW5ncywgbm9kZSkgPT4ge1xuICAgICAgICAgICAgbm9kZS5pbml0aWFsaXplci5wcm9wZXJ0aWVzLmZvckVhY2goKHByb3ApID0+IHtcbiAgICAgICAgICAgICAgICBiaW5kaW5ncyA9IHRzQ29sbGVjdChwcm9wLCBiaW5kaW5ncywgdHNPcHRpb25zQ29sbGVjdG9ycywgZmFsc2UpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBiaW5kaW5ncztcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRzQ29sbGVjdG9ycy5wdXNoKHtcbiAgICAgICAgbWF0Y2hlczogKG5vZGUpID0+IHRzTm9kZUlzR2xvYmFsRnVuY3Rpb25DYWxsKG5vZGUpLFxuICAgICAgICBhcHBseTogKGJpbmRpbmdzLCBub2RlKSA9PiBiaW5kaW5ncy5pbml0LnB1c2godHNHZW5lcmF0ZShub2RlLCB0c1RyZWUpKSxcbiAgICB9KTtcblxuICAgIHRzQ29sbGVjdG9ycy5wdXNoKHtcbiAgICAgICAgbWF0Y2hlczogKG5vZGUpID0+IHRzTm9kZUlzVHlwZURlY2xhcmF0aW9uKG5vZGUpLFxuICAgICAgICBhcHBseTogKGJpbmRpbmdzLCBub2RlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkZWNsYXJhdGlvbiA9IHRzR2VuZXJhdGUobm9kZSwgdHNUcmVlKTtcbiAgICAgICAgICAgIGJpbmRpbmdzLmRlY2xhcmF0aW9ucy5wdXNoKGRlY2xhcmF0aW9uKTtcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEZvciBSZWFjdCB3ZSBuZWVkIHRvIGlkZW50aWZ5IHRoZSBleHRlcm5hbCBkZXBlbmRlbmNpZXMgZm9yIGNhbGxiYWNrcyB0byBwcmV2ZW50IHN0YWxlIGNsb3N1cmVzXG4gICAgY29uc3QgR0xPQkFMX0RFUFMgPSBuZXcgU2V0KFtcbiAgICAgICAgJ2NvbnNvbGUnLFxuICAgICAgICAnZG9jdW1lbnQnLFxuICAgICAgICAnRXJyb3InLFxuICAgICAgICAnQWdDaGFydHMnLFxuICAgICAgICAnY2hhcnQnLFxuICAgICAgICAnd2luZG93JyxcbiAgICAgICAgJ0ltYWdlJyxcbiAgICAgICAgJ0RhdGUnLFxuICAgICAgICAndGhpcycsXG4gICAgXSk7XG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNUb3BMZXZlbEZ1bmN0aW9uKG5vZGUpLFxuICAgICAgICBhcHBseTogKGJpbmRpbmdzLCBub2RlOiBTaWduYXR1cmVEZWNsYXJhdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IChub2RlIGFzIGFueSkuYm9keTtcblxuICAgICAgICAgICAgY29uc3QgYWxsVmFyaWFibGVzID0gbmV3IFNldChib2R5ID8gZmluZEFsbFZhcmlhYmxlcyhib2R5KSA6IFtdKTtcbiAgICAgICAgICAgIGlmIChub2RlLnBhcmFtZXRlcnMgJiYgbm9kZS5wYXJhbWV0ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBub2RlLnBhcmFtZXRlcnMuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhbGxWYXJpYWJsZXMuYWRkKHAubmFtZS5nZXRUZXh0KCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkZXBzID0gYm9keSA/IGZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMoYm9keSkgOiBbXTtcbiAgICAgICAgICAgIGNvbnN0IGFsbERlcHMgPSBkZXBzLmZpbHRlcigoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIElnbm9yZSBsb2NhbGx5IGRlZmluZWQgdmFyaWFibGVzXG4gICAgICAgICAgICAgICAgY29uc3QgaXNWYXJpYWJsZSA9IGFsbFZhcmlhYmxlcy5oYXMoaWQpO1xuICAgICAgICAgICAgICAgIC8vIExldCdzIGFzc3VtZSB0aGF0IGFsbCBjYXBzIGFyZSBjb25zdGFudHMgc28gc2hvdWxkIGJlIGlnbm9yZWQsIGkuZSBLRVlfVVBcbiAgICAgICAgICAgICAgICBjb25zdCBpc0NhcHNDb25zdCA9IGlkID09PSBpZC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiAhaXNWYXJpYWJsZSAmJiAhaXNDYXBzQ29uc3QgJiYgIUdMT0JBTF9ERVBTLmhhcyhpZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChhbGxEZXBzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBiaW5kaW5ncy5jYWxsYmFja0RlcGVuZGVuY2llc1tub2RlLm5hbWUuZ2V0VGV4dCgpXSA9IFsuLi5uZXcgU2V0KGFsbERlcHMpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8qXG4gICAgICogcHJvcGVydGllcyAtPiBjaGFydCByZWxhdGVkIHByb3BlcnRpZXNcbiAgICAgKiBnbG9iYWxzIC0+IG5vbmUgY2hhcnQgcmVsYXRlZCBtZXRob2RzL3ZhcmlhYmxlcyAoaS5lLiBub24taW5zdGFuY2UpXG4gICAgICovXG4gICAgY29uc3QgdHNCaW5kaW5ncyA9IHRzQ29sbGVjdChcbiAgICAgICAgdHNUcmVlLFxuICAgICAgICB7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBbXSxcbiAgICAgICAgICAgIGNoYXJ0UHJvcGVydGllczoge30sXG4gICAgICAgICAgICBleHRlcm5hbEV2ZW50SGFuZGxlcnM6IFtdLFxuICAgICAgICAgICAgaW5zdGFuY2VNZXRob2RzOiBbXSxcbiAgICAgICAgICAgIGdsb2JhbHM6IFtdLFxuICAgICAgICAgICAgaW5pdDogW10sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IFtdLFxuICAgICAgICAgICAgY2FsbGJhY2tEZXBlbmRlbmNpZXM6IHt9LFxuICAgICAgICB9LFxuICAgICAgICB0c0NvbGxlY3RvcnNcbiAgICApO1xuXG4gICAgLy8gTXVzdCBiZSByZWNvcmQgZm9yIHNlcmlhbGl6YXRpb25cbiAgICBjb25zdCBwbGFjZWhvbGRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBjb25zdCBjaGFydEF0dHJpYnV0ZXM6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHN0cmluZz4+ID0ge307XG5cbiAgICBkb21UcmVlKCdkaXZbaWRdJykuZWFjaCgoaW5kZXgsIGVsZW0pID0+IHtcbiAgICAgICAgY29uc3QgeyBpZCwgLi4ucmVzdCB9ID0gZWxlbS5hdHRyaWJzO1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZVBsYWNlaG9sZGVyID0gYCQkQ0hBUlQke2luZGV4fSQkYDtcbiAgICAgICAgcGxhY2Vob2xkZXJzW2lkXSA9IHRlbXBsYXRlUGxhY2Vob2xkZXI7XG4gICAgICAgIGNoYXJ0QXR0cmlidXRlc1tpZF0gPSByZXN0O1xuICAgICAgICBkb21UcmVlKGVsZW0pLnJlcGxhY2VXaXRoKHRlbXBsYXRlUGxhY2Vob2xkZXIpO1xuICAgIH0pO1xuXG4gICAgdHNCaW5kaW5ncy5wbGFjZWhvbGRlcnMgPSBwbGFjZWhvbGRlcnM7XG4gICAgdHNCaW5kaW5ncy5jaGFydEF0dHJpYnV0ZXMgPSBjaGFydEF0dHJpYnV0ZXM7XG4gICAgdHNCaW5kaW5ncy50ZW1wbGF0ZSA9IGRvbVRyZWUuaHRtbCgpO1xuICAgIHRzQmluZGluZ3MuaW1wb3J0cyA9IGV4dHJhY3RJbXBvcnRTdGF0ZW1lbnRzKHRzVHJlZSk7XG4gICAgdHNCaW5kaW5ncy5vcHRpb25zVHlwZUluZm8gPSBleHRyYWN0VHlwZUluZm9Gb3JWYXJpYWJsZSh0c1RyZWUsICdvcHRpb25zJyk7XG4gICAgdHNCaW5kaW5ncy51c2VzQ2hhcnRBcGkgPSB1c2VzQ2hhcnRBcGkodHNUcmVlKTtcbiAgICB0c0JpbmRpbmdzLmNoYXJ0U2V0dGluZ3MgPSBleGFtcGxlU2V0dGluZ3M7XG5cbiAgICByZXR1cm4gdHNCaW5kaW5ncztcbn1cblxuZXhwb3J0IGRlZmF1bHQgcGFyc2VyO1xuIl0sIm5hbWVzIjpbImludGVybmFsUGFyc2VyIiwicGFyc2VyIiwiY2hhcnRWYXJpYWJsZU5hbWUiLCJvcHRpb25zVmFyaWFibGVOYW1lIiwiUkVNT1ZFX01FIiwiUFJPUEVSVElFUyIsInRzR2VuZXJhdGVXaXRoT3B0aW9uUmVmZXJlbmNlcyIsIm5vZGUiLCJzcmNGaWxlIiwidHNHZW5lcmF0ZSIsInJlcGxhY2UiLCJSZWdFeHAiLCJodG1sIiwiZXhhbXBsZVNldHRpbmdzIiwiYmluZGluZ3MiLCJyZWFkQXNKc0ZpbGUiLCJpbmNsdWRlSW1wb3J0cyIsInR5cGVkQmluZGluZ3MiLCJqcyIsImRvbVRyZWUiLCJjaGVlcmlvIiwibG9hZCIsInJlbW92ZSIsImRvbUV2ZW50SGFuZGxlcnMiLCJleHRyYWN0RXZlbnRIYW5kbGVycyIsInJlY29nbml6ZWREb21FdmVudHMiLCJ0c1RyZWUiLCJwYXJzZUZpbGUiLCJ0c0NvbGxlY3RvcnMiLCJ0c09wdGlvbnNDb2xsZWN0b3JzIiwicmVnaXN0ZXJlZCIsImZvckVhY2giLCJfIiwiaGFuZGxlciIsInBhcmFtcyIsImluZGV4T2YiLCJwdXNoIiwibWF0Y2hlcyIsInRzTm9kZUlzRnVuY3Rpb25XaXRoTmFtZSIsImFwcGx5IiwiZXh0ZXJuYWxFdmVudEhhbmRsZXJzIiwibmFtZSIsImJvZHkiLCJ1bmJvdW5kSW5zdGFuY2VNZXRob2RzIiwiZXh0cmFjdFVuYm91bmRJbnN0YW5jZU1ldGhvZHMiLCJ0c05vZGVJc0luU2NvcGUiLCJpbnN0YW5jZU1ldGhvZHMiLCJyZW1vdmVJblNjb3BlSnNEb2MiLCJ0c05vZGVJc1VudXNlZEZ1bmN0aW9uIiwiZ2xvYmFscyIsInRzTm9kZUlzUHJvcGVydHlXaXRoTmFtZSIsImluaXRpYWxpemVyIiwidHNOb2RlSXNGdW5jdGlvbkNhbGwiLCJ0c05vZGVJc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbk9mIiwiZXhwcmVzc2lvbiIsIkVycm9yIiwicHJvcGVydHlBc3NpZ25tZW50IiwidHNOb2RlSXNHbG9iYWxWYXIiLCJwYXJlbnQiLCJwcm9wZXJ0eU5hbWUiLCJlc2NhcGVkVGV4dCIsImlkIiwiYXJndW1lbnRzIiwidGV4dCIsImNvZGUiLCJjaGFydFByb3BlcnRpZXMiLCJwcm9wZXJ0aWVzIiwidmFsdWUiLCJ0c05vZGVJc1RvcExldmVsVmFyaWFibGUiLCJpbmNsdWRlcyIsInRzTm9kZUlzR2xvYmFsVmFyV2l0aE5hbWUiLCJwcm9wIiwidHNDb2xsZWN0IiwidHNOb2RlSXNHbG9iYWxGdW5jdGlvbkNhbGwiLCJpbml0IiwidHNOb2RlSXNUeXBlRGVjbGFyYXRpb24iLCJkZWNsYXJhdGlvbiIsImRlY2xhcmF0aW9ucyIsIkdMT0JBTF9ERVBTIiwiU2V0IiwidHNOb2RlSXNUb3BMZXZlbEZ1bmN0aW9uIiwiYWxsVmFyaWFibGVzIiwiZmluZEFsbFZhcmlhYmxlcyIsInBhcmFtZXRlcnMiLCJsZW5ndGgiLCJwIiwiYWRkIiwiZ2V0VGV4dCIsImRlcHMiLCJmaW5kQWxsQWNjZXNzZWRQcm9wZXJ0aWVzIiwiYWxsRGVwcyIsImZpbHRlciIsImlzVmFyaWFibGUiLCJoYXMiLCJpc0NhcHNDb25zdCIsInRvVXBwZXJDYXNlIiwiY2FsbGJhY2tEZXBlbmRlbmNpZXMiLCJ0c0JpbmRpbmdzIiwicGxhY2Vob2xkZXJzIiwiY2hhcnRBdHRyaWJ1dGVzIiwiZWFjaCIsImluZGV4IiwiZWxlbSIsImF0dHJpYnMiLCJyZXN0IiwidGVtcGxhdGVQbGFjZWhvbGRlciIsInJlcGxhY2VXaXRoIiwidGVtcGxhdGUiLCJpbXBvcnRzIiwiZXh0cmFjdEltcG9ydFN0YXRlbWVudHMiLCJvcHRpb25zVHlwZUluZm8iLCJleHRyYWN0VHlwZUluZm9Gb3JWYXJpYWJsZSIsInVzZXNDaGFydEFwaSIsImNoYXJ0U2V0dGluZ3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBZ1FBLE9BQXNCO2VBQXRCOztJQWxNZ0JBLGNBQWM7ZUFBZEE7O0lBZEFDLE1BQU07ZUFBTkE7Ozs7O21FQWhEUzs2QkE4QmxCO0FBRVAsTUFBTUMsb0JBQW9CO0FBQzFCLE1BQU1DLHNCQUFzQjtBQUM1QixNQUFNQyxZQUFZO0lBQ2REO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtDQUNIO0FBQ0QsTUFBTUUsYUFBYUQ7QUFFbkIsU0FBU0UsK0JBQStCQyxJQUFJLEVBQUVDLE9BQU87SUFDakQsT0FBT0MsSUFBQUEsdUJBQVUsRUFBQ0YsTUFBTUMsU0FBU0UsT0FBTyxDQUFDLElBQUlDLE9BQU8sQ0FBQyx1Q0FBdUMsQ0FBQyxFQUFFLE1BQU07QUFDekc7QUFFTyxTQUFTVixPQUFPLEVBQ25CTyxPQUFPLEVBQ1BJLElBQUksRUFDSkMsZUFBZSxFQUtsQjtJQUNHLE1BQU1DLFdBQVdkLGVBQWVlLElBQUFBLHlCQUFZLEVBQUNQLFNBQVM7UUFBRVEsZ0JBQWdCO0lBQUssSUFBSUosTUFBTUM7SUFDdkYsTUFBTUksZ0JBQWdCakIsZUFBZVEsU0FBU0ksTUFBTUM7SUFDcEQsT0FBTztRQUFFQztRQUFVRztJQUFjO0FBQ3JDO0FBRU8sU0FBU2pCLGVBQWVrQixFQUFFLEVBQUVOLElBQUksRUFBRUMsZUFBZTtJQUNwRCxNQUFNTSxVQUFVQyxTQUFRQyxJQUFJLENBQUNULE1BQU0sTUFBTTtJQUN6Q08sUUFBUSxTQUFTRyxNQUFNO0lBRXZCLE1BQU1DLG1CQUFtQkMsSUFBQUEsaUNBQW9CLEVBQUNM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