"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _process = require("process");
const _executorsutils = require("../../executors-utils");
const _executor = require("./executor");
let executor;
if (_process.versions.node < '18.18') {
    // eslint-disable-next-line no-console
    console.warn('Upgrade Node.js to v18.18.0 for multi-threaded thumbnail generation; found: ' + _process.versions.node);
    executor = (0, _executorsutils.batchExecutor)(_executor.generateFiles);
} else {
    executor = (0, _executorsutils.batchWorkerExecutor)(`${module.path}/batch-instance.js`);
}
const _default = executor;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvYmF0Y2gtZXhlY3V0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdmVyc2lvbnMgfSBmcm9tICdwcm9jZXNzJztcblxuaW1wb3J0IHsgYmF0Y2hFeGVjdXRvciwgYmF0Y2hXb3JrZXJFeGVjdXRvciB9IGZyb20gJy4uLy4uL2V4ZWN1dG9ycy11dGlscyc7XG5pbXBvcnQgeyBnZW5lcmF0ZUZpbGVzIH0gZnJvbSAnLi9leGVjdXRvcic7XG5cbmxldCBleGVjdXRvcjtcbmlmICh2ZXJzaW9ucy5ub2RlIDwgJzE4LjE4Jykge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS53YXJuKCdVcGdyYWRlIE5vZGUuanMgdG8gdjE4LjE4LjAgZm9yIG11bHRpLXRocmVhZGVkIHRodW1ibmFpbCBnZW5lcmF0aW9uOyBmb3VuZDogJyArIHZlcnNpb25zLm5vZGUpO1xuICAgIGV4ZWN1dG9yID0gYmF0Y2hFeGVjdXRvcihnZW5lcmF0ZUZpbGVzKTtcbn0gZWxzZSB7XG4gICAgZXhlY3V0b3IgPSBiYXRjaFdvcmtlckV4ZWN1dG9yKGAke21vZHVsZS5wYXRofS9iYXRjaC1pbnN0YW5jZS5qc2ApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBleGVjdXRvcjtcbiJdLCJuYW1lcyI6WyJleGVjdXRvciIsInZlcnNpb25zIiwibm9kZSIsImNvbnNvbGUiLCJ3YXJuIiwiYmF0Y2hFeGVjdXRvciIsImdlbmVyYXRlRmlsZXMiLCJiYXRjaFdvcmtlckV4ZWN1dG9yIiwibW9kdWxlIiwicGF0aCJdLCJtYXBwaW5ncyI6Ijs7OzsrQkFjQTs7O2VBQUE7Ozt5QkFkeUI7Z0NBRTBCOzBCQUNyQjtBQUU5QixJQUFJQTtBQUNKLElBQUlDLGlCQUFRLENBQUNDLElBQUksR0FBRyxTQUFTO0lBQ3pCLHNDQUFzQztJQUN0Q0MsUUFBUUMsSUFBSSxDQUFDLGlGQUFpRkgsaUJBQVEsQ0FBQ0MsSUFBSTtJQUMzR0YsV0FBV0ssSUFBQUEsNkJBQWEsRUFBQ0MsdUJBQWE7QUFDMUMsT0FBTztJQUNITixXQUFXTyxJQUFBQSxtQ0FBbUIsRUFBQyxDQUFDLEVBQUVDLE9BQU9DLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztBQUNyRTtNQUVBLFdBQWVUIn0=