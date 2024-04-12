const { TestEnvironment } = require('jest-environment-jsdom');
const timezoneMock = require('timezone-mock');
const { Path2D, applyPath2DToCanvasRenderingContext } = require('path2d');
const { CanvasRenderingContext2D, DOMMatrix } = require('canvas');

applyPath2DToCanvasRenderingContext(CanvasRenderingContext2D);

module.exports = class ExtendedTestEnvironment extends TestEnvironment {
    constructor(config, context) {
        // Timezone-aware jsdom Jest environment. Supports `@timezone` JSDoc pragma within test suites to set timezone.
        const tz = context.docblockPragmas.timezone ?? 'Europe/London';
        timezoneMock.register(tz);
        process.env.TZ = tz;

        super(config, context);

        this.global.DOMMatrix = DOMMatrix;
        this.global.Path2D = Path2D;
    }

    async teardown() {
        timezoneMock.unregister();

        return super.setup();
    }
};
