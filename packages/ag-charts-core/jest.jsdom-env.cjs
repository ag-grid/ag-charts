const { TestEnvironment } = require('jest-environment-jsdom');
const { DOMMatrix, Image, Canvas } = require('skia-canvas');
const timezoneMock = require('timezone-mock');

const { ConfiguredCanvasMixin } = require('ag-charts-core');

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

        this.global.OffscreenCanvas = ConfiguredCanvasMixin(Canvas);
        this.global.DOMMatrix = DOMMatrix;
        this.global.Image = Image;
    }

    async teardown() {
        timezoneMock.unregister();

        return super.teardown();
    }
};
