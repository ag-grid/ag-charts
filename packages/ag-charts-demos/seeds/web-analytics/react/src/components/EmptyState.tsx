interface EmptyStateProps {
    message: string;
    hint?: string;
}

// Per-widget empty state, so one data-less chart doesn't render a broken axis.
export function EmptyState({ message, hint }: EmptyStateProps) {
    return (
        <div className="wa-empty">
            <span className="wa-empty-icon" aria-hidden="true">
                ◔
            </span>
            <span>{message}</span>
            {hint && <span className="wa-card-sub">{hint}</span>}
        </div>
    );
}
