import { DemoInfo } from './DemoInfo';

// A fixed demo balance. Static on purpose: nothing in the demo places a trade, so a
// drifting balance would imply state that does not exist.
const DEMO_FUNDS = '$1,000.00';

// The 20-unit viewBox maps 1:1 to the rendered size, so every edge lands on a device pixel.
function AppIcon() {
    return (
        <svg className="fin-brand-mark" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <rect className="fin-brand-mark-badge" width="20" height="20" />
            <g className="fin-brand-mark-glyph">
                <rect x="5" y="4" width="2" height="14" />
                <rect x="3" y="8" width="6" height="6" />
                <rect x="13" y="2" width="2" height="14" />
                <rect x="11" y="5" width="6" height="6" />
            </g>
        </svg>
    );
}

export function Toolbar() {
    return (
        <div className="fin-toolbar">
            <span className="fin-brand">
                <AppIcon />
                AG Trade
            </span>

            <div className="fin-toolbar-spacer" />

            <span className="fin-account">
                <span className="fin-account-label">Funds</span>
                <span className="fin-account-value">{DEMO_FUNDS}</span>
            </span>
            <DemoInfo />
        </div>
    );
}
