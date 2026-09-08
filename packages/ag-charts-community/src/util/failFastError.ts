/**
 * A `validations.throwOn` throw. Raised from inside the logging call that reported the problem, so its
 * stack points at the origin, and `cause` carries the logged Error when there was one. Catch sites that
 * log-and-continue must rethrow it; see `rethrowFailFast`.
 */
export class FailFastError extends Error {}

/** For catch sites that swallow internal errors: a fail-fast throw is owed to the caller, not the console. */
export function rethrowFailFast(error: unknown) {
    if (error instanceof FailFastError) throw error;
}
