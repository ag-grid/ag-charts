// Suspense fallback for a lazily loaded demo, shown before the demo's own stylesheet exists.
// Greys with alpha rather than themed colours: the demos range from a near-black trading
// terminal to a near-white dashboard, and embedded in the website the surrounding card follows
// the site theme, so this has to read on any of them.
const TRACK = 'rgba(128, 128, 128, 0.25)';
const INDICATOR = 'rgba(128, 128, 128, 0.9)';

const STYLES = `
@keyframes agDemoSpin { to { transform: rotate(1turn); } }

.agDemoSpinner {
    width: 28px;
    height: 28px;
    border: 3px solid ${TRACK};
    border-top-color: ${INDICATOR};
    border-radius: 50%;
    animation: agDemoSpin 0.7s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
    .agDemoSpinner { animation-duration: 2.4s; }
}
`;

export function LoadingDemo() {
    return (
        <>
            {/* Outside the status region: its text content is what assistive tech announces. */}
            <style>{STYLES}</style>
            <div
                role="status"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    height: '100%',
                    minHeight: '100vh',
                    // Offset from the left: embedded, the card clips the overflow, so the viewport middle can be out of view.
                    paddingLeft: 64,
                    boxSizing: 'border-box',
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                <div className="agDemoSpinner" />
                <span style={{ fontSize: 14, color: INDICATOR }}>Loading demo…</span>
            </div>
        </>
    );
}
