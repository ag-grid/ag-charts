import { exampleRunnerAsset } from '@utils/example-modules/exampleRunnerAsset';

export const EXAMPLE_RUNNER_SCRIPT_FILE_NAME = 'example-runner.js';

const NAMESPACE = 'agExampleRunner';

/** An export is handed its own copy, so it keeps working with no request back to the site */
export const exampleRunnerScriptSrc = (isExported?: boolean) =>
    isExported ? `./${EXAMPLE_RUNNER_SCRIPT_FILE_NAME}` : exampleRunnerAsset(EXAMPLE_RUNNER_SCRIPT_FILE_NAME);

/** A file rather than inline bodies, so an export shows the example, not its machinery */
export const ExampleRunnerClient = ({ isExported }: { isExported?: boolean }) => (
    <script src={exampleRunnerScriptSrc(isExported)} crossOrigin={isExported ? undefined : 'anonymous'} />
);

/** `<` is escaped so a value containing `</script>` cannot end the element early */
const toScriptLiteral = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c');

interface CallProps {
    fn: string;
    args?: unknown[];
}

/** The only inline script left in an example page: the per-example call into the runtime */
export const ExampleRunnerCall = ({ fn, args = [] }: CallProps) => (
    <script
        dangerouslySetInnerHTML={{
            __html: `${NAMESPACE}.${fn}(${args.map(toScriptLiteral).join(', ')});`,
        }}
    />
);
