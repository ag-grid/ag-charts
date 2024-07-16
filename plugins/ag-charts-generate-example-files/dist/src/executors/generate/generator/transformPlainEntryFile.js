"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "transformPlainEntryFile", {
    enumerable: true,
    get: function() {
        return transformPlainEntryFile;
    }
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _jscodeshift = /*#__PURE__*/ _interop_require_default._(require("jscodeshift"));
const _agchartscommunity = /*#__PURE__*/ _interop_require_wildcard._(require("ag-charts-community"));
const _agchartstest = require("ag-charts-test");
const _jsCodeShiftUtils = require("./jsCodeShiftUtils");
/**
 * JS Code Shift transformer to generate plain entry file
 */ function generateOptions(root, variableDeclarator, preamble) {
    const optionsExpression = variableDeclarator.find(_jscodeshift.default.ObjectExpression);
    optionsExpression.forEach((path)=>{
        path.node.properties = (0, _jsCodeShiftUtils.filterPropertyKeys)({
            removePropertyKeys: [
                'container'
            ],
            properties: path.node.properties
        });
    });
    const code = root.toSource();
    const node = variableDeclarator.getAST()[0].node;
    if (node.id.type !== 'Identifier') {
        throw new Error('Invalid options specifier');
    }
    const options = (0, _agchartstest.parseExampleOptions)(node.id.name, code, preamble, {
        agCharts: _agchartscommunity
    });
    return {
        code,
        options
    };
}
function transformer(sourceFile, preamble) {
    const root = (0, _jscodeshift.default)(sourceFile);
    let code = root.toSource();
    const optionsById = new Map();
    root.findVariableDeclarators().forEach((variableDeclaratorPath)=>{
        const variableDeclarator = (0, _jscodeshift.default)(variableDeclaratorPath);
        const containerPropertyPath = variableDeclarator.find(_jscodeshift.default.ObjectExpression).find(_jscodeshift.default.Property, {
            key: {
                type: 'Identifier',
                name: 'container'
            }
        }).find(_jscodeshift.default.CallExpression, ({ callee })=>callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && callee.object.name === 'document' && callee.property.type === 'Identifier' && callee.property.name === 'getElementById').find(_jscodeshift.default.Literal).paths()[0];
        if (containerPropertyPath != null) {
            const { code: _code, options } = generateOptions(root, variableDeclarator, preamble);
            optionsById.set(containerPropertyPath.node.value, options);
            code = _code;
        }
    });
    return {
        code,
        optionsById
    };
}
function transformPlainEntryFile(entryFile, preamble) {
    return transformer(entryFile, preamble);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybVBsYWluRW50cnlGaWxlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBqIGZyb20gJ2pzY29kZXNoaWZ0JztcblxuaW1wb3J0ICogYXMgYWdDaGFydHMgZnJvbSAnYWctY2hhcnRzLWNvbW11bml0eSc7XG5pbXBvcnQgeyBwYXJzZUV4YW1wbGVPcHRpb25zIH0gZnJvbSAnYWctY2hhcnRzLXRlc3QnO1xuXG5pbXBvcnQgeyBmaWx0ZXJQcm9wZXJ0eUtleXMgfSBmcm9tICcuL2pzQ29kZVNoaWZ0VXRpbHMnO1xuXG4vKipcbiAqIEpTIENvZGUgU2hpZnQgdHJhbnNmb3JtZXIgdG8gZ2VuZXJhdGUgcGxhaW4gZW50cnkgZmlsZVxuICovXG5cbmZ1bmN0aW9uIGdlbmVyYXRlT3B0aW9ucyhcbiAgICByb290OiBqLkNvbGxlY3Rpb248YW55PixcbiAgICB2YXJpYWJsZURlY2xhcmF0b3I6IGouQ29sbGVjdGlvbjxqLlZhcmlhYmxlRGVjbGFyYXRvcj4sXG4gICAgcHJlYW1ibGU/OiBzdHJpbmdbXVxuKSB7XG4gICAgY29uc3Qgb3B0aW9uc0V4cHJlc3Npb24gPSB2YXJpYWJsZURlY2xhcmF0b3IuZmluZChqLk9iamVjdEV4cHJlc3Npb24pO1xuXG4gICAgb3B0aW9uc0V4cHJlc3Npb24uZm9yRWFjaCgocGF0aCkgPT4ge1xuICAgICAgICBwYXRoLm5vZGUucHJvcGVydGllcyA9IGZpbHRlclByb3BlcnR5S2V5cyh7XG4gICAgICAgICAgICByZW1vdmVQcm9wZXJ0eUtleXM6IFsnY29udGFpbmVyJ10sXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBwYXRoLm5vZGUucHJvcGVydGllcyxcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBjb2RlID0gcm9vdC50b1NvdXJjZSgpO1xuXG4gICAgY29uc3Qgbm9kZSA9IHZhcmlhYmxlRGVjbGFyYXRvci5nZXRBU1QoKVswXS5ub2RlO1xuICAgIGlmIChub2RlLmlkLnR5cGUgIT09ICdJZGVudGlmaWVyJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgb3B0aW9ucyBzcGVjaWZpZXInKTtcbiAgICB9XG4gICAgY29uc3Qgb3B0aW9uczogYWdDaGFydHMuQWdDaGFydE9wdGlvbnMgPSBwYXJzZUV4YW1wbGVPcHRpb25zKG5vZGUuaWQubmFtZSwgY29kZSwgcHJlYW1ibGUsIHsgYWdDaGFydHMgfSk7XG5cbiAgICByZXR1cm4geyBjb2RlLCBvcHRpb25zIH07XG59XG5cbmZ1bmN0aW9uIHRyYW5zZm9ybWVyKHNvdXJjZUZpbGU6IHN0cmluZywgcHJlYW1ibGU/OiBzdHJpbmdbXSkge1xuICAgIGNvbnN0IHJvb3QgPSBqKHNvdXJjZUZpbGUpO1xuICAgIGxldCBjb2RlID0gcm9vdC50b1NvdXJjZSgpO1xuXG4gICAgY29uc3Qgb3B0aW9uc0J5SWQgPSBuZXcgTWFwPHN0cmluZywgYWdDaGFydHMuQWdDaGFydE9wdGlvbnM+KCk7XG4gICAgcm9vdC5maW5kVmFyaWFibGVEZWNsYXJhdG9ycygpLmZvckVhY2goKHZhcmlhYmxlRGVjbGFyYXRvclBhdGgpID0+IHtcbiAgICAgICAgY29uc3QgdmFyaWFibGVEZWNsYXJhdG9yID0gaih2YXJpYWJsZURlY2xhcmF0b3JQYXRoKTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyUHJvcGVydHlQYXRoID0gdmFyaWFibGVEZWNsYXJhdG9yXG4gICAgICAgICAgICAuZmluZChqLk9iamVjdEV4cHJlc3Npb24pXG4gICAgICAgICAgICAuZmluZChqLlByb3BlcnR5LCB7IGtleTogeyB0eXBlOiAnSWRlbnRpZmllcicsIG5hbWU6ICdjb250YWluZXInIH0gfSlcbiAgICAgICAgICAgIC5maW5kKFxuICAgICAgICAgICAgICAgIGouQ2FsbEV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgKHsgY2FsbGVlIH0pID0+XG4gICAgICAgICAgICAgICAgICAgIGNhbGxlZS50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicgJiZcbiAgICAgICAgICAgICAgICAgICAgY2FsbGVlLm9iamVjdC50eXBlID09PSAnSWRlbnRpZmllcicgJiZcbiAgICAgICAgICAgICAgICAgICAgY2FsbGVlLm9iamVjdC5uYW1lID09PSAnZG9jdW1lbnQnICYmXG4gICAgICAgICAgICAgICAgICAgIGNhbGxlZS5wcm9wZXJ0eS50eXBlID09PSAnSWRlbnRpZmllcicgJiZcbiAgICAgICAgICAgICAgICAgICAgY2FsbGVlLnByb3BlcnR5Lm5hbWUgPT09ICdnZXRFbGVtZW50QnlJZCdcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5maW5kKGouTGl0ZXJhbClcbiAgICAgICAgICAgIC5wYXRocygpWzBdO1xuXG4gICAgICAgIGlmIChjb250YWluZXJQcm9wZXJ0eVBhdGggIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3QgeyBjb2RlOiBfY29kZSwgb3B0aW9ucyB9ID0gZ2VuZXJhdGVPcHRpb25zKHJvb3QsIHZhcmlhYmxlRGVjbGFyYXRvciwgcHJlYW1ibGUpO1xuICAgICAgICAgICAgb3B0aW9uc0J5SWQuc2V0KGNvbnRhaW5lclByb3BlcnR5UGF0aC5ub2RlLnZhbHVlIGFzIGFueSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb2RlID0gX2NvZGU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB7IGNvZGUsIG9wdGlvbnNCeUlkIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1QbGFpbkVudHJ5RmlsZShcbiAgICBlbnRyeUZpbGU6IHN0cmluZyxcbiAgICBwcmVhbWJsZT86IHN0cmluZ1tdXG4pOiB7IGNvZGU6IHN0cmluZzsgb3B0aW9uc0J5SWQ6IE1hcDxzdHJpbmcsIGFnQ2hhcnRzLkFnQ2hhcnRPcHRpb25zPiB9IHtcbiAgICByZXR1cm4gdHJhbnNmb3JtZXIoZW50cnlGaWxlLCBwcmVhbWJsZSk7XG59XG4iXSwibmFtZXMiOlsidHJhbnNmb3JtUGxhaW5FbnRyeUZpbGUiLCJnZW5lcmF0ZU9wdGlvbnMiLCJyb290IiwidmFyaWFibGVEZWNsYXJhdG9yIiwicHJlYW1ibGUiLCJvcHRpb25zRXhwcmVzc2lvbiIsImZpbmQiLCJqIiwiT2JqZWN0RXhwcmVzc2lvbiIsImZvckVhY2giLCJwYXRoIiwibm9kZSIsInByb3BlcnRpZXMiLCJmaWx0ZXJQcm9wZXJ0eUtleXMiLCJyZW1vdmVQcm9wZXJ0eUtleXMiLCJjb2RlIiwidG9Tb3VyY2UiLCJnZXRBU1QiLCJpZCIsInR5cGUiLCJFcnJvciIsIm9wdGlvbnMiLCJwYXJzZUV4YW1wbGVPcHRpb25zIiwibmFtZSIsImFnQ2hhcnRzIiwidHJhbnNmb3JtZXIiLCJzb3VyY2VGaWxlIiwib3B0aW9uc0J5SWQiLCJNYXAiLCJmaW5kVmFyaWFibGVEZWNsYXJhdG9ycyIsInZhcmlhYmxlRGVjbGFyYXRvclBhdGgiLCJjb250YWluZXJQcm9wZXJ0eVBhdGgiLCJQcm9wZXJ0eSIsImtleSIsIkNhbGxFeHByZXNzaW9uIiwiY2FsbGVlIiwib2JqZWN0IiwicHJvcGVydHkiLCJMaXRlcmFsIiwicGF0aHMiLCJfY29kZSIsInNldCIsInZhbHVlIiwiZW50cnlGaWxlIl0sIm1hcHBpbmdzIjoiOzs7OytCQW9FZ0JBOzs7ZUFBQUE7Ozs7O3NFQXBFRjs2RUFFWTs4QkFDVTtrQ0FFRDtBQUVuQzs7Q0FFQyxHQUVELFNBQVNDLGdCQUNMQyxJQUF1QixFQUN2QkMsa0JBQXNELEVBQ3REQyxRQUFtQjtJQUVuQixNQUFNQyxvQkFBb0JGLG1CQUFtQkcsSUFBSSxDQUFDQyxvQkFBQyxDQUFDQyxnQkFBZ0I7SUFFcEVILGtCQUFrQkksT0FBTyxDQUFDLENBQUNDO1FBQ3ZCQSxLQUFLQyxJQUFJLENBQUNDLFVBQVUsR0FBR0MsSUFBQUEsb0NBQWtCLEVBQUM7WUFDdENDLG9CQUFvQjtnQkFBQzthQUFZO1lBQ2pDRixZQUFZRixLQUFLQyxJQUFJLENBQUNDLFVBQVU7UUFDcEM7SUFDSjtJQUVBLE1BQU1HLE9BQU9iLEtBQUtjLFFBQVE7SUFFMUIsTUFBTUwsT0FBT1IsbUJBQW1CYyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUNOLElBQUk7SUFDaEQsSUFBSUEsS0FBS08sRUFBRSxDQUFDQyxJQUFJLEtBQUssY0FBYztRQUMvQixNQUFNLElBQUlDLE1BQU07SUFDcEI7SUFDQSxNQUFNQyxVQUFtQ0MsSUFBQUEsaUNBQW1CLEVBQUNYLEtBQUtPLEVBQUUsQ0FBQ0ssSUFBSSxFQUFFUixNQUFNWCxVQUFVO1FBQUVvQixVQUFBQTtJQUFTO0lBRXRHLE9BQU87UUFBRVQ7UUFBTU07SUFBUTtBQUMzQjtBQUVBLFNBQVNJLFlBQVlDLFVBQWtCLEVBQUV0QixRQUFtQjtJQUN4RCxNQUFNRixPQUFPSyxJQUFBQSxvQkFBQyxFQUFDbUI7SUFDZixJQUFJWCxPQUFPYixLQUFLYyxRQUFRO0lBRXhCLE1BQU1XLGNBQWMsSUFBSUM7SUFDeEIxQixLQUFLMkIsdUJBQXVCLEdBQUdwQixPQUFPLENBQUMsQ0FBQ3FCO1FBQ3BDLE1BQU0zQixxQkFBcUJJLElBQUFBLG9CQUFDLEVBQUN1QjtRQUM3QixNQUFNQyx3QkFBd0I1QixtQkFDekJHLElBQUksQ0FBQ0Msb0JBQUMsQ0FBQ0MsZ0JBQWdCLEVBQ3ZCRixJQUFJLENBQUNDLG9CQUFDLENBQUN5QixRQUFRLEVBQUU7WUFBRUMsS0FBSztnQkFBRWQsTUFBTTtnQkFBY0ksTUFBTTtZQUFZO1FBQUUsR0FDbEVqQixJQUFJLENBQ0RDLG9CQUFDLENBQUMyQixjQUFjLEVBQ2hCLENBQUMsRUFBRUMsTUFBTSxFQUFFLEdBQ1BBLE9BQU9oQixJQUFJLEtBQUssc0JBQ2hCZ0IsT0FBT0MsTUFBTSxDQUFDakIsSUFBSSxLQUFLLGdCQUN2QmdCLE9BQU9DLE1BQU0sQ0FBQ2IsSUFBSSxLQUFLLGNBQ3ZCWSxPQUFPRSxRQUFRLENBQUNsQixJQUFJLEtBQUssZ0JBQ3pCZ0IsT0FBT0UsUUFBUSxDQUFDZCxJQUFJLEtBQUssa0JBRWhDakIsSUFBSSxDQUFDQyxvQkFBQyxDQUFDK0IsT0FBTyxFQUNkQyxLQUFLLEVBQUUsQ0FBQyxFQUFFO1FBRWYsSUFBSVIseUJBQXlCLE1BQU07WUFDL0IsTUFBTSxFQUFFaEIsTUFBTXlCLEtBQUssRUFBRW5CLE9BQU8sRUFBRSxHQUFHcEIsZ0JBQWdCQyxNQUFNQyxvQkFBb0JDO1lBQzNFdUIsWUFBWWMsR0FBRyxDQUFDVixzQkFBc0JwQixJQUFJLENBQUMrQixLQUFLLEVBQVNyQjtZQUN6RE4sT0FBT3lCO1FBQ1g7SUFDSjtJQUVBLE9BQU87UUFBRXpCO1FBQU1ZO0lBQVk7QUFDL0I7QUFFTyxTQUFTM0Isd0JBQ1oyQyxTQUFpQixFQUNqQnZDLFFBQW1CO0lBRW5CLE9BQU9xQixZQUFZa0IsV0FBV3ZDO0FBQ2xDIn0=