// Bundled rather than served from the website's public assets: the demos app builds
// base-relative (DEMOS_BASE_PATH=./) and also runs standalone, so a site path resolves in neither.
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

// Keyed by the country names in the session data; the "Unknown" bucket has no flag.
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
