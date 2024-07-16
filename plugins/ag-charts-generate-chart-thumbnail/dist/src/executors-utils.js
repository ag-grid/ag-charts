/* eslint-disable no-console */ "use strict";
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
    batchExecutor: function() {
        return batchExecutor;
    },
    batchWorkerExecutor: function() {
        return batchWorkerExecutor;
    },
    consolePrefix: function() {
        return consolePrefix;
    },
    ensureDirectory: function() {
        return ensureDirectory;
    },
    inputGlob: function() {
        return inputGlob;
    },
    parseFile: function() {
        return parseFile;
    },
    readFile: function() {
        return readFile;
    },
    readJSONFile: function() {
        return readJSONFile;
    },
    writeFile: function() {
        return writeFile;
    },
    writeJSONFile: function() {
        return writeJSONFile;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _fs = require("fs");
const _promises = /*#__PURE__*/ _interop_require_wildcard._(require("fs/promises"));
const _glob = /*#__PURE__*/ _interop_require_wildcard._(require("glob"));
const _path = /*#__PURE__*/ _interop_require_wildcard._(require("path"));
const _typescript = /*#__PURE__*/ _interop_require_wildcard._(require("typescript"));
async function exists(filePath) {
    try {
        return (await _promises.stat(filePath))?.isFile();
    } catch (e) {
        return false;
    }
}
async function readJSONFile(filePath) {
    return await exists(filePath) ? JSON.parse(await _promises.readFile(filePath, 'utf-8')) : null;
}
async function readFile(filePath) {
    return await exists(filePath) ? await _promises.readFile(filePath, 'utf-8') : null;
}
async function writeJSONFile(filePath, data, indent = 2) {
    const dataContent = JSON.stringify(data, null, indent);
    await writeFile(filePath, dataContent);
}
async function ensureDirectory(dirPath) {
    await _promises.mkdir(dirPath, {
        recursive: true
    });
}
async function writeFile(filePath, newContent) {
    await ensureDirectory(_path.dirname(filePath));
    await _promises.writeFile(filePath, newContent);
}
function parseFile(filePath) {
    const contents = (0, _fs.readFileSync)(filePath, 'utf8');
    return _typescript.createSourceFile('tempFile.ts', contents, _typescript.ScriptTarget.Latest, true);
}
function inputGlob(fullPath) {
    return _glob.sync(`${fullPath}/**/*.ts`, {
        ignore: [
            `${fullPath}/**/*.test.ts`,
            `${fullPath}/**/*.spec.ts`
        ]
    });
}
function batchExecutor(executor) {
    return async function*(taskGraph, inputs, overrides, context) {
        const tasks = Object.keys(inputs);
        for(let taskIndex = 0; taskIndex < tasks.length; taskIndex++){
            const taskName = tasks[taskIndex++];
            const task = taskGraph.tasks[taskName];
            const inputOptions = inputs[taskName];
            let success = false;
            let terminalOutput = '';
            try {
                await executor({
                    ...inputOptions,
                    ...overrides
                }, {
                    ...context,
                    projectName: task.target.project,
                    targetName: task.target.target,
                    configurationName: task.target.configuration
                });
                success = true;
            } catch (e) {
                terminalOutput += `${e}`;
            }
            yield {
                task: taskName,
                result: {
                    success,
                    terminalOutput
                }
            };
        }
    };
}
function batchWorkerExecutor(workerModule) {
    return async function*(taskGraph, inputs, overrides, context) {
        const results = new Map();
        const { Tinypool } = await import('tinypool');
        const pool = new Tinypool({
            runtime: 'child_process',
            filename: workerModule
        });
        process.on('exit', ()=>{
            pool.cancelPendingTasks();
            pool.destroy().catch((e)=>console.error(e));
        });
        const tasks = Object.keys(inputs);
        for(let taskIndex = 0; taskIndex < tasks.length; taskIndex++){
            const taskName = tasks[taskIndex++];
            const task = taskGraph.tasks[taskName];
            const inputOptions = inputs[taskName];
            const opts = {
                options: {
                    ...inputOptions,
                    ...overrides
                },
                context: {
                    ...context,
                    projectName: task.target.project,
                    targetName: task.target.target,
                    configurationName: task.target.configuration
                },
                taskName
            };
            results.set(taskName, pool.run(opts));
        }
        // Run yield loop after dispatch to avoid serializing execution.
        for(let taskIndex = 0; taskIndex < tasks.length; taskIndex++){
            const taskName = tasks[taskIndex++];
            yield results.get(taskName);
        }
        await pool.destroy();
    };
}
async function consolePrefix(prefix, cb) {
    const fns = {};
    const fnNames = [
        'log',
        'debug',
        'info',
        'warn',
        'error'
    ];
    const timesCalled = {
        debug: 0,
        error: 0,
        info: 0,
        log: 0,
        warn: 0
    };
    for (const fn of fnNames){
        fns[fn] = console[fn];
        console[fn] = (arg, ...args)=>{
            // Filter license message.
            if (typeof arg === 'string' && arg.startsWith('*')) return;
            timesCalled[fn]++;
            fns[fn].call(console, prefix, arg, ...args);
        };
    }
    try {
        await cb();
        return timesCalled;
    } finally{
        Object.assign(console, fns);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRvcnMtdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0IHR5cGUgeyBFeGVjdXRvckNvbnRleHQsIFRhc2tHcmFwaCB9IGZyb20gJ0BueC9kZXZraXQnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0ICogYXMgZ2xvYiBmcm9tICdnbG9iJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuZXhwb3J0IHR5cGUgVGFza1Jlc3VsdCA9IHtcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICAgIHRlcm1pbmFsT3V0cHV0OiBzdHJpbmc7XG4gICAgc3RhcnRUaW1lPzogbnVtYmVyO1xuICAgIGVuZFRpbWU/OiBudW1iZXI7XG59O1xuXG5leHBvcnQgdHlwZSBCYXRjaEV4ZWN1dG9yVGFza1Jlc3VsdCA9IHtcbiAgICB0YXNrOiBzdHJpbmc7XG4gICAgcmVzdWx0OiBUYXNrUmVzdWx0O1xufTtcblxuYXN5bmMgZnVuY3Rpb24gZXhpc3RzKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gKGF3YWl0IGZzLnN0YXQoZmlsZVBhdGgpKT8uaXNGaWxlKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZEpTT05GaWxlKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gKGF3YWl0IGV4aXN0cyhmaWxlUGF0aCkpID8gSlNPTi5wYXJzZShhd2FpdCBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0Zi04JykpIDogbnVsbDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRGaWxlKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gKGF3YWl0IGV4aXN0cyhmaWxlUGF0aCkpID8gYXdhaXQgZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGYtOCcpIDogbnVsbDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlSlNPTkZpbGUoZmlsZVBhdGg6IHN0cmluZywgZGF0YTogdW5rbm93biwgaW5kZW50ID0gMikge1xuICAgIGNvbnN0IGRhdGFDb250ZW50ID0gSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgaW5kZW50KTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoZmlsZVBhdGgsIGRhdGFDb250ZW50KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZURpcmVjdG9yeShkaXJQYXRoOiBzdHJpbmcpIHtcbiAgICBhd2FpdCBmcy5ta2RpcihkaXJQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlRmlsZShmaWxlUGF0aDogc3RyaW5nLCBuZXdDb250ZW50OiBzdHJpbmcgfCBCdWZmZXIpIHtcbiAgICBhd2FpdCBlbnN1cmVEaXJlY3RvcnkocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSk7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlKGZpbGVQYXRoLCBuZXdDb250ZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRmlsZShmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgY29udGVudHMgPSByZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGY4Jyk7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVNvdXJjZUZpbGUoJ3RlbXBGaWxlLnRzJywgY29udGVudHMsIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsIHRydWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5wdXRHbG9iKGZ1bGxQYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZ2xvYi5zeW5jKGAke2Z1bGxQYXRofS8qKi8qLnRzYCwge1xuICAgICAgICBpZ25vcmU6IFtgJHtmdWxsUGF0aH0vKiovKi50ZXN0LnRzYCwgYCR7ZnVsbFBhdGh9LyoqLyouc3BlYy50c2BdLFxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmF0Y2hFeGVjdXRvcjxFeGVjdXRvck9wdGlvbnM+KFxuICAgIGV4ZWN1dG9yOiAob3B0czogRXhlY3V0b3JPcHRpb25zLCBjdHg6IEV4ZWN1dG9yQ29udGV4dCkgPT4gUHJvbWlzZTx2b2lkPlxuKSB7XG4gICAgcmV0dXJuIGFzeW5jIGZ1bmN0aW9uKiAoXG4gICAgICAgIHRhc2tHcmFwaDogVGFza0dyYXBoLFxuICAgICAgICBpbnB1dHM6IFJlY29yZDxzdHJpbmcsIEV4ZWN1dG9yT3B0aW9ucz4sXG4gICAgICAgIG92ZXJyaWRlczogRXhlY3V0b3JPcHRpb25zLFxuICAgICAgICBjb250ZXh0OiBFeGVjdXRvckNvbnRleHRcbiAgICApOiBBc3luY0dlbmVyYXRvcjxCYXRjaEV4ZWN1dG9yVGFza1Jlc3VsdCwgYW55LCB1bmtub3duPiB7XG4gICAgICAgIGNvbnN0IHRhc2tzID0gT2JqZWN0LmtleXMoaW5wdXRzKTtcblxuICAgICAgICBmb3IgKGxldCB0YXNrSW5kZXggPSAwOyB0YXNrSW5kZXggPCB0YXNrcy5sZW5ndGg7IHRhc2tJbmRleCsrKSB7XG4gICAgICAgICAgICBjb25zdCB0YXNrTmFtZSA9IHRhc2tzW3Rhc2tJbmRleCsrXTtcbiAgICAgICAgICAgIGNvbnN0IHRhc2sgPSB0YXNrR3JhcGgudGFza3NbdGFza05hbWVdO1xuICAgICAgICAgICAgY29uc3QgaW5wdXRPcHRpb25zID0gaW5wdXRzW3Rhc2tOYW1lXTtcblxuICAgICAgICAgICAgbGV0IHN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgIGxldCB0ZXJtaW5hbE91dHB1dCA9ICcnO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBleGVjdXRvcihcbiAgICAgICAgICAgICAgICAgICAgeyAuLi5pbnB1dE9wdGlvbnMsIC4uLm92ZXJyaWRlcyB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5jb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdE5hbWU6IHRhc2sudGFyZ2V0LnByb2plY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXROYW1lOiB0YXNrLnRhcmdldC50YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWd1cmF0aW9uTmFtZTogdGFzay50YXJnZXQuY29uZmlndXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgc3VjY2VzcyA9IHRydWU7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGVybWluYWxPdXRwdXQgKz0gYCR7ZX1gO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB5aWVsZCB7IHRhc2s6IHRhc2tOYW1lLCByZXN1bHQ6IHsgc3VjY2VzcywgdGVybWluYWxPdXRwdXQgfSB9O1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhdGNoV29ya2VyRXhlY3V0b3I8RXhlY3V0b3JPcHRpb25zPih3b3JrZXJNb2R1bGU6IHN0cmluZykge1xuICAgIHJldHVybiBhc3luYyBmdW5jdGlvbiogKFxuICAgICAgICB0YXNrR3JhcGg6IFRhc2tHcmFwaCxcbiAgICAgICAgaW5wdXRzOiBSZWNvcmQ8c3RyaW5nLCBFeGVjdXRvck9wdGlvbnM+LFxuICAgICAgICBvdmVycmlkZXM6IEV4ZWN1dG9yT3B0aW9ucyxcbiAgICAgICAgY29udGV4dDogRXhlY3V0b3JDb250ZXh0XG4gICAgKTogQXN5bmNHZW5lcmF0b3I8QmF0Y2hFeGVjdXRvclRhc2tSZXN1bHQsIGFueSwgdW5rbm93bj4ge1xuICAgICAgICBjb25zdCByZXN1bHRzOiBNYXA8c3RyaW5nLCBQcm9taXNlPEJhdGNoRXhlY3V0b3JUYXNrUmVzdWx0Pj4gPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgY29uc3QgeyBUaW55cG9vbCB9ID0gYXdhaXQgaW1wb3J0KCd0aW55cG9vbCcpO1xuICAgICAgICBjb25zdCBwb29sID0gbmV3IFRpbnlwb29sKHtcbiAgICAgICAgICAgIHJ1bnRpbWU6ICdjaGlsZF9wcm9jZXNzJyxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB3b3JrZXJNb2R1bGUsXG4gICAgICAgIH0pO1xuICAgICAgICBwcm9jZXNzLm9uKCdleGl0JywgKCkgPT4ge1xuICAgICAgICAgICAgcG9vbC5jYW5jZWxQZW5kaW5nVGFza3MoKTtcbiAgICAgICAgICAgIHBvb2wuZGVzdHJveSgpLmNhdGNoKChlKSA9PiBjb25zb2xlLmVycm9yKGUpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdGFza3MgPSBPYmplY3Qua2V5cyhpbnB1dHMpO1xuXG4gICAgICAgIGZvciAobGV0IHRhc2tJbmRleCA9IDA7IHRhc2tJbmRleCA8IHRhc2tzLmxlbmd0aDsgdGFza0luZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhc2tOYW1lID0gdGFza3NbdGFza0luZGV4KytdO1xuICAgICAgICAgICAgY29uc3QgdGFzayA9IHRhc2tHcmFwaC50YXNrc1t0YXNrTmFtZV07XG4gICAgICAgICAgICBjb25zdCBpbnB1dE9wdGlvbnMgPSBpbnB1dHNbdGFza05hbWVdO1xuXG4gICAgICAgICAgICBjb25zdCBvcHRzID0ge1xuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHsgLi4uaW5wdXRPcHRpb25zLCAuLi5vdmVycmlkZXMgfSxcbiAgICAgICAgICAgICAgICBjb250ZXh0OiB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgIHByb2plY3ROYW1lOiB0YXNrLnRhcmdldC5wcm9qZWN0LFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXROYW1lOiB0YXNrLnRhcmdldC50YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25OYW1lOiB0YXNrLnRhcmdldC5jb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGFza05hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVzdWx0cy5zZXQodGFza05hbWUsIHBvb2wucnVuKG9wdHMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJ1biB5aWVsZCBsb29wIGFmdGVyIGRpc3BhdGNoIHRvIGF2b2lkIHNlcmlhbGl6aW5nIGV4ZWN1dGlvbi5cbiAgICAgICAgZm9yIChsZXQgdGFza0luZGV4ID0gMDsgdGFza0luZGV4IDwgdGFza3MubGVuZ3RoOyB0YXNrSW5kZXgrKykge1xuICAgICAgICAgICAgY29uc3QgdGFza05hbWUgPSB0YXNrc1t0YXNrSW5kZXgrK107XG4gICAgICAgICAgICB5aWVsZCByZXN1bHRzLmdldCh0YXNrTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBwb29sLmRlc3Ryb3koKTtcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29uc29sZVByZWZpeChwcmVmaXg6IHN0cmluZywgY2I6ICgpID0+IFByb21pc2U8dm9pZD4pIHtcbiAgICBjb25zdCBmbnMgPSB7fTtcbiAgICBjb25zdCBmbk5hbWVzID0gWydsb2cnLCAnZGVidWcnLCAnaW5mbycsICd3YXJuJywgJ2Vycm9yJ10gYXMgY29uc3Q7XG4gICAgY29uc3QgdGltZXNDYWxsZWQ6IFJlY29yZDwodHlwZW9mIGZuTmFtZXMpW251bWJlcl0sIG51bWJlcj4gPSB7XG4gICAgICAgIGRlYnVnOiAwLFxuICAgICAgICBlcnJvcjogMCxcbiAgICAgICAgaW5mbzogMCxcbiAgICAgICAgbG9nOiAwLFxuICAgICAgICB3YXJuOiAwLFxuICAgIH07XG4gICAgZm9yIChjb25zdCBmbiBvZiBmbk5hbWVzKSB7XG4gICAgICAgIGZuc1tmbl0gPSBjb25zb2xlW2ZuXTtcblxuICAgICAgICBjb25zb2xlW2ZuXSA9IChhcmc6IGFueSwgLi4uYXJnczogYW55W10pID0+IHtcbiAgICAgICAgICAgIC8vIEZpbHRlciBsaWNlbnNlIG1lc3NhZ2UuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgJiYgYXJnLnN0YXJ0c1dpdGgoJyonKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICB0aW1lc0NhbGxlZFtmbl0rKztcbiAgICAgICAgICAgIGZuc1tmbl0uY2FsbChjb25zb2xlLCBwcmVmaXgsIGFyZywgLi4uYXJncyk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGNiKCk7XG4gICAgICAgIHJldHVybiB0aW1lc0NhbGxlZDtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBPYmplY3QuYXNzaWduKGNvbnNvbGUsIGZucyk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbImJhdGNoRXhlY3V0b3IiLCJiYXRjaFdvcmtlckV4ZWN1dG9yIiwiY29uc29sZVByZWZpeCIsImVuc3VyZURpcmVjdG9yeSIsImlucHV0R2xvYiIsInBhcnNlRmlsZSIsInJlYWRGaWxlIiwicmVhZEpTT05GaWxlIiwid3JpdGVGaWxlIiwid3JpdGVKU09ORmlsZSIsImV4aXN0cyIsImZpbGVQYXRoIiwiZnMiLCJzdGF0IiwiaXNGaWxlIiwiZSIsIkpTT04iLCJwYXJzZSIsImRhdGEiLCJpbmRlbnQiLCJkYXRhQ29udGVudCIsInN0cmluZ2lmeSIsImRpclBhdGgiLCJta2RpciIsInJlY3Vyc2l2ZSIsIm5ld0NvbnRlbnQiLCJwYXRoIiwiZGlybmFtZSIsImNvbnRlbnRzIiwicmVhZEZpbGVTeW5jIiwidHMiLCJjcmVhdGVTb3VyY2VGaWxlIiwiU2NyaXB0VGFyZ2V0IiwiTGF0ZXN0IiwiZnVsbFBhdGgiLCJnbG9iIiwic3luYyIsImlnbm9yZSIsImV4ZWN1dG9yIiwidGFza0dyYXBoIiwiaW5wdXRzIiwib3ZlcnJpZGVzIiwiY29udGV4dCIsInRhc2tzIiwiT2JqZWN0Iiwia2V5cyIsInRhc2tJbmRleCIsImxlbmd0aCIsInRhc2tOYW1lIiwidGFzayIsImlucHV0T3B0aW9ucyIsInN1Y2Nlc3MiLCJ0ZXJtaW5hbE91dHB1dCIsInByb2plY3ROYW1lIiwidGFyZ2V0IiwicHJvamVjdCIsInRhcmdldE5hbWUiLCJjb25maWd1cmF0aW9uTmFtZSIsImNvbmZpZ3VyYXRpb24iLCJyZXN1bHQiLCJ3b3JrZXJNb2R1bGUiLCJyZXN1bHRzIiwiTWFwIiwiVGlueXBvb2wiLCJwb29sIiwicnVudGltZSIsImZpbGVuYW1lIiwicHJvY2VzcyIsIm9uIiwiY2FuY2VsUGVuZGluZ1Rhc2tzIiwiZGVzdHJveSIsImNhdGNoIiwiY29uc29sZSIsImVycm9yIiwib3B0cyIsIm9wdGlvbnMiLCJzZXQiLCJydW4iLCJnZXQiLCJwcmVmaXgiLCJjYiIsImZucyIsImZuTmFtZXMiLCJ0aW1lc0NhbGxlZCIsImRlYnVnIiwiaW5mbyIsImxvZyIsIndhcm4iLCJmbiIsImFyZyIsImFyZ3MiLCJzdGFydHNXaXRoIiwiY2FsbCIsImFzc2lnbiJdLCJtYXBwaW5ncyI6IkFBQUEsNkJBQTZCOzs7Ozs7Ozs7OztJQTZEYkEsYUFBYTtlQUFiQTs7SUFzQ0FDLG1CQUFtQjtlQUFuQkE7O0lBaURNQyxhQUFhO2VBQWJBOztJQTNHQUMsZUFBZTtlQUFmQTs7SUFjTkMsU0FBUztlQUFUQTs7SUFMQUMsU0FBUztlQUFUQTs7SUFsQk1DLFFBQVE7ZUFBUkE7O0lBSkFDLFlBQVk7ZUFBWkE7O0lBaUJBQyxTQUFTO2VBQVRBOztJQVRBQyxhQUFhO2VBQWJBOzs7O29CQWxDTztvRUFDVDtnRUFDRTtnRUFDQTtzRUFDRjtBQWNwQixlQUFlQyxPQUFPQyxRQUFnQjtJQUNsQyxJQUFJO1FBQ0EsT0FBUSxDQUFBLE1BQU1DLFVBQUdDLElBQUksQ0FBQ0YsU0FBUSxHQUFJRztJQUN0QyxFQUFFLE9BQU9DLEdBQUc7UUFDUixPQUFPO0lBQ1g7QUFDSjtBQUVPLGVBQWVSLGFB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