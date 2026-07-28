/**
 * The emitter surface of {@link ambientLogger}, for chart-less code that logs a message rather than
 * holding a Logger. Re-exported as the `ambientLog` namespace; deliberately excludes the `Logger`
 * class so the namespace cannot be used to construct one.
 */
export { error, errorOnce, log, logGroup, reset, table, warn, warnOnce } from './logger';
