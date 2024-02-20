"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDependencies = exports.createNodes = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const generateChartThumbnails = tslib_1.__importStar(require("./generate-chart-thumbnails"));
const generateExampleFiles = tslib_1.__importStar(require("./generate-example-files"));
const PROJECTS = ['ag-charts-website'];
const NON_UNIQUE_PATH_ELEMENTS = new Set(['src', 'content', 'docs', '_examples']);
const IGNORE_THUMBNAILS = [
    // Too large to generate, isn't visible in the gallery either.
    'ag-charts-website-src_content_gallery__examples_large-datasets_main.ts',
];
function generateThumbnails(projectName) {
    return projectName.indexOf('gallery') >= 0 && !IGNORE_THUMBNAILS.includes(projectName);
}
exports.createNodes = [
    'packages/*/src/**/_examples/*/main.ts',
    (configFilePath, options, context) => {
        const parentProject = PROJECTS.find((p) => configFilePath.startsWith(`packages/${p}`));
        if (!parentProject) {
            return {};
        }
        const uniqueName = configFilePath
            .split('/')
            .slice(2)
            .filter((p) => !NON_UNIQUE_PATH_ELEMENTS.has[p])
            .join('_');
        const parentPath = `packages/${parentProject}`;
        const examplePath = (0, path_1.dirname)(configFilePath).replace(`packages/${parentProject}/`, '{projectRoot}/');
        const projectRelativeInputPath = examplePath.split('/').slice(2).join('/');
        const srcRelativeInputPath = projectRelativeInputPath.split('/').slice(1).join('/');
        const projectName = `${parentProject}-${uniqueName}`;
        const thumbnails = generateThumbnails(projectName);
        return {
            projects: {
                [projectName]: {
                    root: (0, path_1.dirname)(configFilePath),
                    name: projectName,
                    tags: [`scope:${parentProject}`, 'type:generated-example'],
                    targets: Object.assign(Object.assign(Object.assign({}, createGenerateTarget(thumbnails)), generateExampleFiles.createTask(parentProject, srcRelativeInputPath)), (thumbnails ? generateChartThumbnails.createTask(parentProject, srcRelativeInputPath) : {})),
                },
            },
        };
    },
];
const createDependencies = (opts, ctx) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return [...(yield generateExampleFiles.createDependencies(opts, ctx))];
});
exports.createDependencies = createDependencies;
function createGenerateTarget(thumbnails) {
    const dependsOn = ['generate-example'];
    if (thumbnails) {
        dependsOn.push('generate-thumbnail');
    }
    return {
        generate: {
            executor: 'nx:noop',
            dependsOn,
            inputs: [{ externalDependencies: ['npm:typescript'] }],
            cache: true,
        },
    };
}
//# sourceMappingURL=index.js.map