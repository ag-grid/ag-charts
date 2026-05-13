// AG Studio product profile for the A/B smoke-test runner.
//
// Stub — Studio does not have a public examples site yet. This file exists
// to document the expected shape and allow the runner to report a clear error
// if someone attempts to use it before the profile is fleshed out.

export const PRODUCT = 'ag-studio';
export const PRODUCT_SHORT = 'studio';

export const FRAMEWORKS = [];
export const SELECTORS = {};
export const NOISE_RE = /$/;
export function isNoise() { return false; }
export function buildExampleUrl() { return ''; }

export const META_ENDPOINT = null;
export const PHASE_ORDER = [];
export const DISCOVERY = null;

export const EXAMPLE_OPTIONS = {};
export const IGNORE_PAGES = [];
export const UNSUPPORTED_GENERIC = [];
export function isUnsupportedGeneric() { return false; }
export function resolveOptions() { return { frameworks: [], status: 'ok' }; }

export async function waitForReady() { return { settled: false, reason: 'not-implemented' }; }
export async function waitForContent() { return false; }
export async function takeScreenshot() { return false; }
export async function shouldSkipPhases() { return { skip: true, reason: 'studio-not-implemented' }; }
export async function prepareState() {}

export const PHASES = [];
