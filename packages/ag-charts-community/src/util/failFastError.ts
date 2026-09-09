/**
 * A `validations.throwOn` throw. Raised from inside the logging call that reported the problem, so its
 * stack points at the origin, and `cause` carries the logged Error when there was one. Catch sites that
 * log-and-continue must rethrow it; see `rethrowFailFast`.
 */
export class FailFastError extends Error {
    /** The validations instance that threw, so its own listener dispatch can tell it from another chart's. */
    readonly source: object;

    constructor(message: string, source: object, options?: ErrorOptions) {
        super(message, options);
        this.source = source;
    }
}

/** For catch sites that swallow internal errors: a fail-fast throw is owed to the caller, not the console. */
export function rethrowFailFast(error: unknown) {
    if (error instanceof FailFastError) throw error;
}
