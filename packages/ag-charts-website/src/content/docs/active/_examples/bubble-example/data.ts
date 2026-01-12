export type DatumType = {
    name: string;
    sessionMinutes: number;
    crashRate: number;
    dau: number;
};

export function getData1(): DatumType[] {
    return [
        { name: 'Search', sessionMinutes: 5.1, crashRate: 0.8, dau: 420 },
        { name: 'Home Feed', sessionMinutes: 5.4, crashRate: 0.9, dau: 480 },
        { name: 'Notifications', sessionMinutes: 4.9, crashRate: 0.7, dau: 390 },
        { name: 'Profile', sessionMinutes: 5.0, crashRate: 0.85, dau: 360 },
        { name: 'Messaging', sessionMinutes: 5.3, crashRate: 1.1, dau: 510 },
        { name: 'Bookmarks', sessionMinutes: 5.2, crashRate: 0.95, dau: 300 },
        { name: 'Settings', sessionMinutes: 4.8, crashRate: 0.6, dau: 280 },
        { name: 'Onboarding', sessionMinutes: 5.5, crashRate: 1.3, dau: 250 },
        { name: 'Recommendations', sessionMinutes: 5.6, crashRate: 1.0, dau: 460 },
        { name: 'Offline Mode', sessionMinutes: 5.1, crashRate: 0.75, dau: 220 },
    ];
}

export function getData2(): DatumType[] {
    return [
        { name: 'Search', sessionMinutes: 5.0, crashRate: 1.0, dau: 610 },
        { name: 'Home Feed', sessionMinutes: 5.3, crashRate: 1.1, dau: 680 },
        { name: 'Notifications', sessionMinutes: 4.7, crashRate: 0.9, dau: 540 },
        { name: 'Profile', sessionMinutes: 4.9, crashRate: 1.0, dau: 500 },
        { name: 'Messaging', sessionMinutes: 5.2, crashRate: 1.4, dau: 720 },
        { name: 'Bookmarks', sessionMinutes: 5.1, crashRate: 1.2, dau: 410 },
        { name: 'Settings', sessionMinutes: 4.6, crashRate: 0.8, dau: 390 },
        { name: 'Onboarding', sessionMinutes: 5.4, crashRate: 1.6, dau: 330 },
        { name: 'Recommendations', sessionMinutes: 5.5, crashRate: 1.3, dau: 640 },
        { name: 'Offline Mode', sessionMinutes: 5.0, crashRate: 0.95, dau: 360 },
    ];
}
