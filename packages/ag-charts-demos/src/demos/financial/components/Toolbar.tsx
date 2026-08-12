import { useEffect, useState } from 'react';

import { fmtTime } from '../format';

// A fixed demo balance. Static on purpose: nothing in the demo places a trade, so a
// drifting balance would imply state that does not exist.
const DEMO_FUNDS = '$1,000.00';

function useClock() {
    const [clock, setClock] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setClock(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);
    return clock;
}

export function Toolbar() {
    const clock = useClock();

    return (
        <div className="fin-toolbar">
            <span className="fin-brand">AG Trade</span>

            <div className="fin-toolbar-spacer" />

            <span className="fin-clock">{fmtTime(clock)}</span>

            <span className="fin-account">
                <span className="fin-account-label">Funds</span>
                <span className="fin-account-value">{DEMO_FUNDS}</span>
            </span>

            <span className="fin-demo-badge">Demo account</span>
        </div>
    );
}
