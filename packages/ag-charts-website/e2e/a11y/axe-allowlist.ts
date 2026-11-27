import { readFileSync } from 'fs';
import { resolve } from 'path';

import { type AxeAllowlistEntry, parseAxeAllowlist } from '../../scripts/a11y/axe-allowlist';

/** Loads and validates the committed allowlist; throws on an invalid file so the run fails closed. */
export function loadAxeAllowlist(): AxeAllowlistEntry[] {
    return parseAxeAllowlist(JSON.parse(readFileSync(resolve(__dirname, 'axe-allowlist.json'), 'utf-8')));
}
