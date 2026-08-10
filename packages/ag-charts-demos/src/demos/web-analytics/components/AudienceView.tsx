import type { ActivityCell, Browser, ChannelDatum, CountryDatum, DeviceDatum, VisitorDatum } from '../types';
import { ActivityByDayChart } from './ActivityByDayChart';
import { ActivityHeatmapChart } from './ActivityHeatmapChart';
import { BrowserBreakdownChart } from './BrowserBreakdownChart';
import { ChannelBreakdownChart } from './ChannelBreakdownChart';
import { DeviceBreakdownChart } from './DeviceBreakdownChart';
import { EmptyState } from './EmptyState';
import { GeoMap } from './GeoMap';
import { VisitorBreakdownChart } from './VisitorBreakdownChart';

interface AudienceViewProps {
    countries: CountryDatum[];
    channels: ChannelDatum[];
    visitors: VisitorDatum[];
    devices: DeviceDatum[];
    browsers: { browser: Browser; sessions: number }[];
    activity: ActivityCell[];
    hasData: boolean;
}

export function AudienceView({
    countries,
    channels,
    visitors,
    devices,
    browsers,
    activity,
    hasData,
}: AudienceViewProps) {
    return (
        <div className="wa-view wa-view--fill">
            <div className="wa-grid-4">
                <section className="wa-card">
                    <div className="wa-card-head">
                        <h2 className="wa-card-title">New vs returning</h2>
                    </div>
                    <div className="wa-chart-box-xsm">
                        {hasData ? <VisitorBreakdownChart data={visitors} /> : <EmptyState message="No visitor data" />}
                    </div>
                </section>

                <section className="wa-card">
                    <div className="wa-card-head">
                        <h2 className="wa-card-title">Sessions by device</h2>
                    </div>
                    <div className="wa-chart-box-xsm">
                        {hasData ? <DeviceBreakdownChart data={devices} /> : <EmptyState message="No device data" />}
                    </div>
                </section>

                <section className="wa-card">
                    <div className="wa-card-head">
                        <h2 className="wa-card-title">Sessions by browser</h2>
                    </div>
                    <div className="wa-chart-box-xsm">
                        {hasData ? <BrowserBreakdownChart data={browsers} /> : <EmptyState message="No browser data" />}
                    </div>
                </section>
                <section className="wa-card">
                    <div className="wa-card-head">
                        <h2 className="wa-card-title">Sessions by channel</h2>
                    </div>
                    <div className="wa-chart-box-xsm">
                        {hasData ? <ChannelBreakdownChart data={channels} /> : <EmptyState message="No channel data" />}
                    </div>
                </section>
            </div>
            <div className="wa-grid-2">
                <section className="wa-card wa-card--fill">
                    <div className="wa-card-head">
                        <h2 className="wa-card-title">Visitors by country</h2>
                    </div>
                    {hasData ? (
                        <div className="wa-fill">
                            <GeoMap data={countries} />
                        </div>
                    ) : (
                        <div className="wa-fill">
                            <EmptyState message="No geographic data" />
                        </div>
                    )}
                </section>
                <section className="wa-card wa-card--fill">
                    <div className="wa-card-head">
                        <div>
                            <h2 className="wa-card-title">Activity by time of day</h2>
                        </div>
                    </div>
                    {hasData ? (
                        <>
                            <div className="wa-chart-box-xxsm">
                                <ActivityByDayChart data={activity} />
                            </div>
                            <div className="wa-fill">
                                <ActivityHeatmapChart data={activity} />
                            </div>
                        </>
                    ) : (
                        <div className="wa-fill">
                            <EmptyState message="No activity data" />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
