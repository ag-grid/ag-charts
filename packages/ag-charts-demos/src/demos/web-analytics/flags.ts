// Flag images are bundled with the demo rather than pulled from the website's
// public assets: the demos app is built base-relative (DEMOS_BASE_PATH=./) and
// also runs standalone, so an absolute site path would not resolve in either
// case. Importing them lets Vite emit hashed copies alongside the entry chunk.
import aus from './assets/flags/aus.png';
import bra from './assets/flags/bra.png';
import can from './assets/flags/can.png';
import deu from './assets/flags/deu.png';
import esp from './assets/flags/esp.png';
import fra from './assets/flags/fra.png';
import gbr from './assets/flags/gbr.png';
import ind from './assets/flags/ind.png';
import jpn from './assets/flags/jpn.png';
import nld from './assets/flags/nld.png';
import swe from './assets/flags/swe.png';
import usa from './assets/flags/usa.png';

// Keyed by the country names used in the session data. The "Unknown" bucket has
// no flag by design and falls through to undefined.
const FLAG_BY_COUNTRY: Record<string, string> = {
    Australia: aus,
    Brazil: bra,
    Canada: can,
    France: fra,
    Germany: deu,
    India: ind,
    Japan: jpn,
    Netherlands: nld,
    Spain: esp,
    Sweden: swe,
    'United Kingdom': gbr,
    'United States': usa,
};

export function flagUrl(country: string): string | undefined {
    return FLAG_BY_COUNTRY[country];
}
