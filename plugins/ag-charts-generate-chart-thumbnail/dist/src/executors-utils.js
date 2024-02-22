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
            pool.destroy();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRvcnMtdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0IHR5cGUgeyBFeGVjdXRvckNvbnRleHQsIFRhc2tHcmFwaCB9IGZyb20gJ0BueC9kZXZraXQnO1xuaW1wb3J0IHR5cGUgeyBDaGlsZFByb2Nlc3MgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzL3Byb21pc2VzJztcbmltcG9ydCAqIGFzIGdsb2IgZnJvbSAnZ2xvYic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmV4cG9ydCB0eXBlIFRhc2tSZXN1bHQgPSB7XG4gICAgc3VjY2VzczogYm9vbGVhbjtcbiAgICB0ZXJtaW5hbE91dHB1dDogc3RyaW5nO1xuICAgIHN0YXJ0VGltZT86IG51bWJlcjtcbiAgICBlbmRUaW1lPzogbnVtYmVyO1xufTtcblxuZXhwb3J0IHR5cGUgQmF0Y2hFeGVjdXRvclRhc2tSZXN1bHQgPSB7XG4gICAgdGFzazogc3RyaW5nO1xuICAgIHJlc3VsdDogVGFza1Jlc3VsdDtcbn07XG5cbmFzeW5jIGZ1bmN0aW9uIGV4aXN0cyhmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIChhd2FpdCBmcy5zdGF0KGZpbGVQYXRoKSk/LmlzRmlsZSgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRKU09ORmlsZShmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIChhd2FpdCBleGlzdHMoZmlsZVBhdGgpKSA/IEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGYtOCcpKSA6IG51bGw7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkRmlsZShmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIChhd2FpdCBleGlzdHMoZmlsZVBhdGgpKSA/IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmLTgnKSA6IG51bGw7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZUpTT05GaWxlKGZpbGVQYXRoOiBzdHJpbmcsIGRhdGE6IHVua25vd24sIGluZGVudCA9IDIpIHtcbiAgICBjb25zdCBkYXRhQ29udGVudCA9IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIGluZGVudCk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGZpbGVQYXRoLCBkYXRhQ29udGVudCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVEaXJlY3RvcnkoZGlyUGF0aDogc3RyaW5nKSB7XG4gICAgYXdhaXQgZnMubWtkaXIoZGlyUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZUZpbGUoZmlsZVBhdGg6IHN0cmluZywgbmV3Q29udGVudDogc3RyaW5nIHwgQnVmZmVyKSB7XG4gICAgYXdhaXQgZW5zdXJlRGlyZWN0b3J5KHBhdGguZGlybmFtZShmaWxlUGF0aCkpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZShmaWxlUGF0aCwgbmV3Q29udGVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZpbGUoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IGNvbnRlbnRzID0gcmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmOCcpO1xuICAgIHJldHVybiB0cy5jcmVhdGVTb3VyY2VGaWxlKCd0ZW1wRmlsZS50cycsIGNvbnRlbnRzLCB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0LCB0cnVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlucHV0R2xvYihmdWxsUGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGdsb2Iuc3luYyhgJHtmdWxsUGF0aH0vKiovKi50c2AsIHtcbiAgICAgICAgaWdub3JlOiBbYCR7ZnVsbFBhdGh9LyoqLyoudGVzdC50c2AsIGAke2Z1bGxQYXRofS8qKi8qLnNwZWMudHNgXSxcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhdGNoRXhlY3V0b3I8RXhlY3V0b3JPcHRpb25zPihcbiAgICBleGVjdXRvcjogKG9wdHM6IEV4ZWN1dG9yT3B0aW9ucywgY3R4OiBFeGVjdXRvckNvbnRleHQpID0+IFByb21pc2U8dm9pZD5cbikge1xuICAgIHJldHVybiBhc3luYyBmdW5jdGlvbiogKFxuICAgICAgICB0YXNrR3JhcGg6IFRhc2tHcmFwaCxcbiAgICAgICAgaW5wdXRzOiBSZWNvcmQ8c3RyaW5nLCBFeGVjdXRvck9wdGlvbnM+LFxuICAgICAgICBvdmVycmlkZXM6IEV4ZWN1dG9yT3B0aW9ucyxcbiAgICAgICAgY29udGV4dDogRXhlY3V0b3JDb250ZXh0XG4gICAgKTogQXN5bmNHZW5lcmF0b3I8QmF0Y2hFeGVjdXRvclRhc2tSZXN1bHQsIGFueSwgdW5rbm93bj4ge1xuICAgICAgICBjb25zdCB0YXNrcyA9IE9iamVjdC5rZXlzKGlucHV0cyk7XG5cbiAgICAgICAgZm9yIChsZXQgdGFza0luZGV4ID0gMDsgdGFza0luZGV4IDwgdGFza3MubGVuZ3RoOyB0YXNrSW5kZXgrKykge1xuICAgICAgICAgICAgY29uc3QgdGFza05hbWUgPSB0YXNrc1t0YXNrSW5kZXgrK107XG4gICAgICAgICAgICBjb25zdCB0YXNrID0gdGFza0dyYXBoLnRhc2tzW3Rhc2tOYW1lXTtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0T3B0aW9ucyA9IGlucHV0c1t0YXNrTmFtZV07XG5cbiAgICAgICAgICAgIGxldCBzdWNjZXNzID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgdGVybWluYWxPdXRwdXQgPSAnJztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZXhlY3V0b3IoXG4gICAgICAgICAgICAgICAgICAgIHsgLi4uaW5wdXRPcHRpb25zLCAuLi5vdmVycmlkZXMgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4uY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3ROYW1lOiB0YXNrLnRhcmdldC5wcm9qZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0TmFtZTogdGFzay50YXJnZXQudGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbk5hbWU6IHRhc2sudGFyZ2V0LmNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRlcm1pbmFsT3V0cHV0ICs9IGAke2V9YDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgeWllbGQgeyB0YXNrOiB0YXNrTmFtZSwgcmVzdWx0OiB7IHN1Y2Nlc3MsIHRlcm1pbmFsT3V0cHV0IH0gfTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXRjaFdvcmtlckV4ZWN1dG9yPEV4ZWN1dG9yT3B0aW9ucz4od29ya2VyTW9kdWxlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYXN5bmMgZnVuY3Rpb24qIChcbiAgICAgICAgdGFza0dyYXBoOiBUYXNrR3JhcGgsXG4gICAgICAgIGlucHV0czogUmVjb3JkPHN0cmluZywgRXhlY3V0b3JPcHRpb25zPixcbiAgICAgICAgb3ZlcnJpZGVzOiBFeGVjdXRvck9wdGlvbnMsXG4gICAgICAgIGNvbnRleHQ6IEV4ZWN1dG9yQ29udGV4dFxuICAgICk6IEFzeW5jR2VuZXJhdG9yPEJhdGNoRXhlY3V0b3JUYXNrUmVzdWx0LCBhbnksIHVua25vd24+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0czogTWFwPHN0cmluZywgUHJvbWlzZTxCYXRjaEV4ZWN1dG9yVGFza1Jlc3VsdD4+ID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIGNvbnN0IHsgVGlueXBvb2wgfSA9IGF3YWl0IGltcG9ydCgndGlueXBvb2wnKTtcbiAgICAgICAgY29uc3QgcG9vbCA9IG5ldyBUaW55cG9vbCh7XG4gICAgICAgICAgICBydW50aW1lOiAnY2hpbGRfcHJvY2VzcycsXG4gICAgICAgICAgICBmaWxlbmFtZTogd29ya2VyTW9kdWxlLFxuICAgICAgICB9KTtcbiAgICAgICAgcHJvY2Vzcy5vbignZXhpdCcsICgpID0+IHtcbiAgICAgICAgICAgIHBvb2wuY2FuY2VsUGVuZGluZ1Rhc2tzKCk7XG4gICAgICAgICAgICBwb29sLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdGFza3MgPSBPYmplY3Qua2V5cyhpbnB1dHMpO1xuXG4gICAgICAgIGZvciAobGV0IHRhc2tJbmRleCA9IDA7IHRhc2tJbmRleCA8IHRhc2tzLmxlbmd0aDsgdGFza0luZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhc2tOYW1lID0gdGFza3NbdGFza0luZGV4KytdO1xuICAgICAgICAgICAgY29uc3QgdGFzayA9IHRhc2tHcmFwaC50YXNrc1t0YXNrTmFtZV07XG4gICAgICAgICAgICBjb25zdCBpbnB1dE9wdGlvbnMgPSBpbnB1dHNbdGFza05hbWVdO1xuXG4gICAgICAgICAgICBjb25zdCBvcHRzID0ge1xuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHsgLi4uaW5wdXRPcHRpb25zLCAuLi5vdmVycmlkZXMgfSxcbiAgICAgICAgICAgICAgICBjb250ZXh0OiB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgIHByb2plY3ROYW1lOiB0YXNrLnRhcmdldC5wcm9qZWN0LFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXROYW1lOiB0YXNrLnRhcmdldC50YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25OYW1lOiB0YXNrLnRhcmdldC5jb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGFza05hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVzdWx0cy5zZXQodGFza05hbWUsIHBvb2wucnVuKG9wdHMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJ1biB5aWVsZCBsb29wIGFmdGVyIGRpc3BhdGNoIHRvIGF2b2lkIHNlcmlhbGl6aW5nIGV4ZWN1dGlvbi5cbiAgICAgICAgZm9yIChsZXQgdGFza0luZGV4ID0gMDsgdGFza0luZGV4IDwgdGFza3MubGVuZ3RoOyB0YXNrSW5kZXgrKykge1xuICAgICAgICAgICAgY29uc3QgdGFza05hbWUgPSB0YXNrc1t0YXNrSW5kZXgrK107XG4gICAgICAgICAgICB5aWVsZCByZXN1bHRzLmdldCh0YXNrTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBwb29sLmRlc3Ryb3koKTtcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29uc29sZVByZWZpeChwcmVmaXg6IHN0cmluZywgY2I6ICgpID0+IFByb21pc2U8dm9pZD4pIHtcbiAgICBjb25zdCBmbnMgPSB7fTtcbiAgICBjb25zdCBmbk5hbWVzID0gWydsb2cnLCAnZGVidWcnLCAnaW5mbycsICd3YXJuJywgJ2Vycm9yJ10gYXMgY29uc3Q7XG4gICAgY29uc3QgdGltZXNDYWxsZWQ6IFJlY29yZDwodHlwZW9mIGZuTmFtZXMpW251bWJlcl0sIG51bWJlcj4gPSB7XG4gICAgICAgIGRlYnVnOiAwLFxuICAgICAgICBlcnJvcjogMCxcbiAgICAgICAgaW5mbzogMCxcbiAgICAgICAgbG9nOiAwLFxuICAgICAgICB3YXJuOiAwLFxuICAgIH07XG4gICAgZm9yIChjb25zdCBmbiBvZiBmbk5hbWVzKSB7XG4gICAgICAgIGZuc1tmbl0gPSBjb25zb2xlW2ZuXTtcblxuICAgICAgICBjb25zb2xlW2ZuXSA9IChhcmc6IGFueSwgLi4uYXJnczogYW55W10pID0+IHtcbiAgICAgICAgICAgIC8vIEZpbHRlciBsaWNlbnNlIG1lc3NhZ2UuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgJiYgYXJnLnN0YXJ0c1dpdGgoJyonKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICB0aW1lc0NhbGxlZFtmbl0rKztcbiAgICAgICAgICAgIGZuc1tmbl0uY2FsbChjb25zb2xlLCBwcmVmaXgsIGFyZywgLi4uYXJncyk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGNiKCk7XG4gICAgICAgIHJldHVybiB0aW1lc0NhbGxlZDtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBPYmplY3QuYXNzaWduKGNvbnNvbGUsIGZucyk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbImJhdGNoRXhlY3V0b3IiLCJiYXRjaFdvcmtlckV4ZWN1dG9yIiwiY29uc29sZVByZWZpeCIsImVuc3VyZURpcmVjdG9yeSIsImlucHV0R2xvYiIsInBhcnNlRmlsZSIsInJlYWRGaWxlIiwicmVhZEpTT05GaWxlIiwid3JpdGVGaWxlIiwid3JpdGVKU09ORmlsZSIsImV4aXN0cyIsImZpbGVQYXRoIiwiZnMiLCJzdGF0IiwiaXNGaWxlIiwiZSIsIkpTT04iLCJwYXJzZSIsImRhdGEiLCJpbmRlbnQiLCJkYXRhQ29udGVudCIsInN0cmluZ2lmeSIsImRpclBhdGgiLCJta2RpciIsInJlY3Vyc2l2ZSIsIm5ld0NvbnRlbnQiLCJwYXRoIiwiZGlybmFtZSIsImNvbnRlbnRzIiwicmVhZEZpbGVTeW5jIiwidHMiLCJjcmVhdGVTb3VyY2VGaWxlIiwiU2NyaXB0VGFyZ2V0IiwiTGF0ZXN0IiwiZnVsbFBhdGgiLCJnbG9iIiwic3luYyIsImlnbm9yZSIsImV4ZWN1dG9yIiwidGFza0dyYXBoIiwiaW5wdXRzIiwib3ZlcnJpZGVzIiwiY29udGV4dCIsInRhc2tzIiwiT2JqZWN0Iiwia2V5cyIsInRhc2tJbmRleCIsImxlbmd0aCIsInRhc2tOYW1lIiwidGFzayIsImlucHV0T3B0aW9ucyIsInN1Y2Nlc3MiLCJ0ZXJtaW5hbE91dHB1dCIsInByb2plY3ROYW1lIiwidGFyZ2V0IiwicHJvamVjdCIsInRhcmdldE5hbWUiLCJjb25maWd1cmF0aW9uTmFtZSIsImNvbmZpZ3VyYXRpb24iLCJyZXN1bHQiLCJ3b3JrZXJNb2R1bGUiLCJyZXN1bHRzIiwiTWFwIiwiVGlueXBvb2wiLCJwb29sIiwicnVudGltZSIsImZpbGVuYW1lIiwicHJvY2VzcyIsIm9uIiwiY2FuY2VsUGVuZGluZ1Rhc2tzIiwiZGVzdHJveSIsIm9wdHMiLCJvcHRpb25zIiwic2V0IiwicnVuIiwiZ2V0IiwicHJlZml4IiwiY2IiLCJmbnMiLCJmbk5hbWVzIiwidGltZXNDYWxsZWQiLCJkZWJ1ZyIsImVycm9yIiwiaW5mbyIsImxvZyIsIndhcm4iLCJmbiIsImNvbnNvbGUiLCJhcmciLCJhcmdzIiwic3RhcnRzV2l0aCIsImNhbGwiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiJBQUFBLDZCQUE2Qjs7Ozs7Ozs7Ozs7SUE4RGJBLGFBQWE7ZUFBYkE7O0lBc0NBQyxtQkFBbUI7ZUFBbkJBOztJQWlETUMsYUFBYTtlQUFiQTs7SUEzR0FDLGVBQWU7ZUFBZkE7O0lBY05DLFNBQVM7ZUFBVEE7O0lBTEFDLFNBQVM7ZUFBVEE7O0lBbEJNQyxRQUFRO2VBQVJBOztJQUpBQyxZQUFZO2VBQVpBOztJQWlCQUMsU0FBUztlQUFUQTs7SUFUQUMsYUFBYTtlQUFiQTs7OztvQkFsQ087b0VBQ1Q7Z0VBQ0U7Z0VBQ0E7c0VBQ0Y7QUFjcEIsZUFBZUMsT0FBT0MsUUFBZ0I7SUFDbEMsSUFBSTtRQUNBLE9BQVEsQ0FBQSxNQUFNQyxVQUFHQyxJQUFJLENBQUNGLFNBQVEsR0FBSUc7SUFDdEMsRUFBRSxPQUFPQyxHQUFHO1FBQ1IsT0FBTztJQUNYO0FBQ0o7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