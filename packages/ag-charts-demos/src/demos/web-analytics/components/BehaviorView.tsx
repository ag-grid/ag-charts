import type { FunnelStep, PageRow, PathLink, Session } from '../types';
import { DurationHistogramChart } from './DurationHistogramChart';
import { EmptyState } from './EmptyState';
import { FunnelChart } from './FunnelChart';
import { PageGrid } from './PageGrid';
import { PagePerformanceChart } from './PagePerformanceChart';
import { PathFlowChart } from './PathFlowChart';

interface BehaviorViewProps {
    funnelData: FunnelStep[];
    pathData: PathLink[];
    pageData: PageRow[];
    sessions: Session[];
    hasData: boolean;
}

export function BehaviorView({ funnelData, pathData, pageData, sessions, hasData }: BehaviorViewProps) {
    return (
        <div className="wa-view">
            <section className="wa-card">
                <div className="wa-card-head">
                    <div>
                        <h2 className="wa-card-title">User paths</h2>
                    </div>
                </div>
                <div className="wa-chart-box-lg">
                    {hasData && pathData.length > 0 ? (
                        <PathFlowChart data={pathData} />
                    ) : (
                        <EmptyState message="No path data in this range" />
                    )}
                </div>
            </section>
            <div className="wa-grid-3">
                <section className="wa-card">
                    <div className="wa-card-head">
                        <div>
                            <h2 className="wa-card-title">Conversion funnel</h2>
                        </div>
                    </div>
                    <div className="wa-chart-box">
                        {hasData ? (
                            <FunnelChart data={funnelData} />
                        ) : (
                            <EmptyState message="No funnel data in this range" />
                        )}
                    </div>
                </section>
                <section className="wa-card">
                    <div className="wa-card-head">
                        <div>
                            <h2 className="wa-card-title">Session duration distribution</h2>
                        </div>
                    </div>
                    <div className="wa-chart-box">
                        {hasData ? (
                            <DurationHistogramChart sessions={sessions} />
                        ) : (
                            <EmptyState message="No session data in this range" />
                        )}
                    </div>
                </section>

                <section className="wa-card">
                    <div className="wa-card-head">
                        <div>
                            <h2 className="wa-card-title">Pageviews vs conversion rate</h2>
                        </div>
                    </div>
                    <div className="wa-chart-box">
                        {hasData ? (
                            <PagePerformanceChart data={pageData} />
                        ) : (
                            <EmptyState message="No page data in this range" />
                        )}
                    </div>
                </section>
            </div>

            <section className="wa-card">
                <div className="wa-card-head">
                    <div>
                        <h2 className="wa-card-title">Page performance</h2>
                    </div>
                </div>
                {hasData ? <PageGrid rows={pageData} /> : <EmptyState message="No page data in this range" />}
            </section>
        </div>
    );
}
