import * as RPopover from '@radix-ui/react-popover';

function InfoIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
        </svg>
    );
}

export function DemoNotice() {
    return (
        <RPopover.Root>
            <RPopover.Trigger className="wa-notice-trigger" aria-label="About this demo">
                <InfoIcon />
            </RPopover.Trigger>
            <RPopover.Portal>
                <RPopover.Content className="wa-portal wa-notice-tip" side="bottom" align="end" sideOffset={6}>
                    This is a sample application showcasing AG Charts and AG Grid features. All data shown is synthetic
                    and randomly generated for demonstration purposes only.
                    <RPopover.Arrow className="wa-notice-arrow" width={10} height={5} />
                </RPopover.Content>
            </RPopover.Portal>
        </RPopover.Root>
    );
}
