"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return processor;
    }
});
const _executor = require("./executor");
async function processor(msg) {
    const { options, context, taskName } = msg;
    let result;
    try {
        await (0, _executor.generateFiles)(options, context);
        result = {
            task: taskName,
            result: {
                success: true,
                terminalOutput: ''
            }
        };
    } catch (e) {
        result = {
            task: taskName,
            result: {
                success: false,
                terminalOutput: `${e}`
            }
        };
    }
    return result;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvYmF0Y2gtaW5zdGFuY2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBFeGVjdXRvckNvbnRleHQgfSBmcm9tICdAbngvZGV2a2l0JztcblxuaW1wb3J0IHR5cGUgeyBCYXRjaEV4ZWN1dG9yVGFza1Jlc3VsdCB9IGZyb20gJy4uLy4uL2V4ZWN1dG9ycy11dGlscyc7XG5pbXBvcnQgeyB0eXBlIEV4ZWN1dG9yT3B0aW9ucywgZ2VuZXJhdGVGaWxlcyB9IGZyb20gJy4vZXhlY3V0b3InO1xuXG5leHBvcnQgdHlwZSBNZXNzYWdlID0ge1xuICAgIHRhc2tOYW1lOiBzdHJpbmc7XG4gICAgb3B0aW9uczogRXhlY3V0b3JPcHRpb25zO1xuICAgIGNvbnRleHQ6IEV4ZWN1dG9yQ29udGV4dDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3Nvcihtc2c6IE1lc3NhZ2UpIHtcbiAgICBjb25zdCB7IG9wdGlvbnMsIGNvbnRleHQsIHRhc2tOYW1lIH0gPSBtc2c7XG5cbiAgICBsZXQgcmVzdWx0OiBCYXRjaEV4ZWN1dG9yVGFza1Jlc3VsdDtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBnZW5lcmF0ZUZpbGVzKG9wdGlvbnMsIGNvbnRleHQpO1xuICAgICAgICByZXN1bHQgPSB7IHRhc2s6IHRhc2tOYW1lLCByZXN1bHQ6IHsgc3VjY2VzczogdHJ1ZSwgdGVybWluYWxPdXRwdXQ6ICcnIH0gfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJlc3VsdCA9IHsgdGFzazogdGFza05hbWUsIHJlc3VsdDogeyBzdWNjZXNzOiBmYWxzZSwgdGVybWluYWxPdXRwdXQ6IGAke2V9YCB9IH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbiJdLCJuYW1lcyI6WyJwcm9jZXNzb3IiLCJtc2ciLCJvcHRpb25zIiwiY29udGV4dCIsInRhc2tOYW1lIiwicmVzdWx0IiwiZ2VuZXJhdGVGaWxlcyIsInRhc2siLCJzdWNjZXNzIiwidGVybWluYWxPdXRwdXQiLCJlIl0sIm1hcHBpbmdzIjoiOzs7OytCQVdBOzs7ZUFBOEJBOzs7MEJBUnNCO0FBUXJDLGVBQWVBLFVBQVVDLEdBQVk7SUFDaEQsTUFBTSxFQUFFQyxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxFQUFFLEdBQUdIO0lBRXZDLElBQUlJO0lBQ0osSUFBSTtRQUNBLE1BQU1DLElBQUFBLHVCQUFhLEVBQUNKLFNBQVNDO1FBQzdCRSxTQUFTO1lBQUVFLE1BQU1IO1lBQVVDLFFBQVE7Z0JBQUVHLFNBQVM7Z0JBQU1DLGdCQUFnQjtZQUFHO1FBQUU7SUFDN0UsRUFBRSxPQUFPQyxHQUFHO1FBQ1JMLFNBQVM7WUFBRUUsTUFBTUg7WUFBVUMsUUFBUTtnQkFBRUcsU0FBUztnQkFBT0MsZ0JBQWdCLENBQUMsRUFBRUMsRUFBRSxDQUFDO1lBQUM7UUFBRTtJQUNsRjtJQUVBLE9BQU9MO0FBQ1gifQ==