/* eslint-disable no-console */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _typescript = /*#__PURE__*/ _interop_require_wildcard._(require("typescript"));
const _executorsutils = require("../../executors-utils");
const _typesutils = require("./types-utils");
async function _default(options) {
    try {
        console.log('-'.repeat(80));
        console.log('Generate docs reference files...');
        console.log('Using Typescript version: ', _typescript.version);
        await generateFile(options);
        console.log(`Generation completed - written to ${options.output}.`);
        console.log('-'.repeat(80));
        return {
            success: true
        };
    } catch (e) {
        console.error(e, {
            options
        });
        return {
            success: false
        };
    }
}
async function generateFile(options) {
    const typeMapper = new _typesutils.TypeMapper(options.inputs);
    switch(options.mode){
        // flat version of the interfaces file, without resolving
        case 'debug-interfaces':
            return await (0, _executorsutils.writeJSONFile)(options.output, typeMapper.entries());
        case 'docs-interfaces':
            return await (0, _executorsutils.writeJSONFile)(options.output, typeMapper.resolvedEntries());
        default:
            throw new Error(`Unsupported mode "${options.mode}"`);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZXhlY3V0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7IHdyaXRlSlNPTkZpbGUgfSBmcm9tICcuLi8uLi9leGVjdXRvcnMtdXRpbHMnO1xuaW1wb3J0IHsgVHlwZU1hcHBlciB9IGZyb20gJy4vdHlwZXMtdXRpbHMnO1xuXG50eXBlIE9wdGlvbnNNb2RlID0gJ2RlYnVnLWludGVyZmFjZXMnIHwgJ2RvY3MtaW50ZXJmYWNlcyc7XG50eXBlIEV4ZWN1dG9yT3B0aW9ucyA9IHsgbW9kZTogT3B0aW9uc01vZGU7IGlucHV0czogc3RyaW5nW107IG91dHB1dDogc3RyaW5nIH07XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIChvcHRpb25zOiBFeGVjdXRvck9wdGlvbnMpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZygnLScucmVwZWF0KDgwKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdHZW5lcmF0ZSBkb2NzIHJlZmVyZW5jZSBmaWxlcy4uLicpO1xuICAgICAgICBjb25zb2xlLmxvZygnVXNpbmcgVHlwZXNjcmlwdCB2ZXJzaW9uOiAnLCB0cy52ZXJzaW9uKTtcblxuICAgICAgICBhd2FpdCBnZW5lcmF0ZUZpbGUob3B0aW9ucyk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYEdlbmVyYXRpb24gY29tcGxldGVkIC0gd3JpdHRlbiB0byAke29wdGlvbnMub3V0cHV0fS5gKTtcbiAgICAgICAgY29uc29sZS5sb2coJy0nLnJlcGVhdCg4MCkpO1xuXG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSwgeyBvcHRpb25zIH0pO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSB9O1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVGaWxlKG9wdGlvbnM6IEV4ZWN1dG9yT3B0aW9ucykge1xuICAgIGNvbnN0IHR5cGVNYXBwZXIgPSBuZXcgVHlwZU1hcHBlcihvcHRpb25zLmlucHV0cyk7XG5cbiAgICBzd2l0Y2ggKG9wdGlvbnMubW9kZSkge1xuICAgICAgICAvLyBmbGF0IHZlcnNpb24gb2YgdGhlIGludGVyZmFjZXMgZmlsZSwgd2l0aG91dCByZXNvbHZpbmdcbiAgICAgICAgY2FzZSAnZGVidWctaW50ZXJmYWNlcyc6XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgd3JpdGVKU09ORmlsZShvcHRpb25zLm91dHB1dCwgdHlwZU1hcHBlci5lbnRyaWVzKCkpO1xuXG4gICAgICAgIGNhc2UgJ2RvY3MtaW50ZXJmYWNlcyc6XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgd3JpdGVKU09ORmlsZShvcHRpb25zLm91dHB1dCwgdHlwZU1hcHBlci5yZXNvbHZlZEVudHJpZXMoKSk7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgbW9kZSBcIiR7b3B0aW9ucy5tb2RlfVwiYCk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbIm9wdGlvbnMiLCJjb25zb2xlIiwibG9nIiwicmVwZWF0IiwidHMiLCJ2ZXJzaW9uIiwiZ2VuZXJhdGVGaWxlIiwib3V0cHV0Iiwic3VjY2VzcyIsImUiLCJlcnJvciIsInR5cGVNYXBwZXIiLCJUeXBlTWFwcGVyIiwiaW5wdXRzIiwibW9kZSIsIndyaXRlSlNPTkZpbGUiLCJlbnRyaWVzIiwicmVzb2x2ZWRFbnRyaWVzIiwiRXJyb3IiXSwibWFwcGluZ3MiOiJBQUFBLDZCQUE2Qjs7OzsrQkFTN0I7OztlQUFBOzs7O3NFQVJvQjtnQ0FFVTs0QkFDSDtBQUtaLGVBQWYsU0FBK0JBLE9BQXdCO0lBQ25ELElBQUk7UUFDQUMsUUFBUUMsR0FBRyxDQUFDLElBQUlDLE1BQU0sQ0FBQztRQUN2QkYsUUFBUUMsR0FBRyxDQUFDO1FBQ1pELFFBQVFDLEdBQUcsQ0FBQyw4QkFBOEJFLFlBQUdDLE9BQU87UUFFcEQsTUFBTUMsYUFBYU47UUFFbkJDLFFBQVFDLEdBQUcsQ0FBQyxDQUFDLGtDQUFrQyxFQUFFRixRQUFRTyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2xFTixRQUFRQyxHQUFHLENBQUMsSUFBSUMsTUFBTSxDQUFDO1FBRXZCLE9BQU87WUFBRUssU0FBUztRQUFLO0lBQzNCLEVBQUUsT0FBT0MsR0FBRztRQUNSUixRQUFRUyxLQUFLLENBQUNELEdBQUc7WUFBRVQ7UUFBUTtRQUMzQixPQUFPO1lBQUVRLFNBQVM7UUFBTTtJQUM1QjtBQUNKO0FBRUEsZUFBZUYsYUFBYU4sT0FBd0I7SUFDaEQsTUFBTVcsYUFBYSxJQUFJQyxzQkFBVSxDQUFDWixRQUFRYSxNQUFNO0lBRWhELE9BQVFiLFFBQVFjLElBQUk7UUFDaEIseURBQXlEO1FBQ3pELEtBQUs7WUFDRCxPQUFPLE1BQU1DLElBQUFBLDZCQUFhLEVBQUNmLFFBQVFPLE1BQU0sRUFBRUksV0FBV0ssT0FBTztRQUVqRSxLQUFLO1lBQ0QsT0FBTyxNQUFNRCxJQUFBQSw2QkFBYSxFQUFDZixRQUFRTyxNQUFNLEVBQUVJLFdBQVdNLGVBQWU7UUFFekU7WUFDSSxNQUFNLElBQUlDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRWxCLFFBQVFjLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDNUQ7QUFDSiJ9