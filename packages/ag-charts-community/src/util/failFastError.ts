/**
 * A `validations.throwOn` throw. Constructed inside the logging call that reported the problem, so its
 * stack points at the origin, and `cause` carries the logged Error when there was one. It is thrown from
 * a timer, never from the logging call, so the pass that raised it completes as it would without `throwOn`.
 */
export class FailFastError extends Error {}
