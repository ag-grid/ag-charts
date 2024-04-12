const { TestEnvironment } = require('jest-environment-jsdom');
const timezoneMock = require('timezone-mock');
const { DOMMatrix } = require('./src/chart/test/domMatrix-polyfill');
const { Path2D, applyPath2DToCanvasRenderingContext } = require('path2d');
const { CanvasRenderingContext2D } = require('canvas');

/**
 * Timezone-aware jsdom Jest environment. Supports `@timezone` JSDoc
 * pragma within test suites to set timezone.
 */
module.exports = class TimezoneAwareJSDOMEnvironment extends TestEnvironment {
    constructor(config, context) {
        const tz = context.docblockPragmas.timezone ?? 'Europe/London';
        process.env.TZ = tz;
        timezoneMock.register(tz);

        super(config, context);

        this.global.DOMMatrix = DOMMatrix;
        this.global.Path2D = Path2D;

        applyPath2DToCanvasRenderingContext(CanvasRenderingContext2D);
    }

    async teardown() {
        timezoneMock.unregister();

        return super.setup();
    }
};
