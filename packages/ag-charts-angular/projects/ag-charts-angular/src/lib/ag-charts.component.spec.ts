import { Component, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
    AgChartOptions,
    AgContextMenuItem,
    AgContextMenuOptions,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { AgCharts } from './ag-charts.component';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const DATA_UK_LABOUR_MARKET_FEB_2020 = [
    { type: 'Managers, directors &\nsenior officials', earnings: 954 },
    { type: 'Professional occupations', earnings: 844 },
    { type: 'Associate professional & technical', earnings: 699 },
    { type: 'Skilled trades', earnings: 503 },
    { type: 'Process, plant &\nmachine operatives', earnings: 501 },
    { type: 'Administrative & secretarial', earnings: 457 },
    { type: 'Sales & customer services', earnings: 407 },
    { type: 'Elementary occupations', earnings: 380 },
    { type: 'Caring, leisure & other services', earnings: 358 },
];

@Component({
    selector: `host-component`,
    standalone: true,
    template: ` <ag-charts [options]="options"></ag-charts>`,
})
class TestHostComponent {
    options: AgChartOptions = {
        data: DATA_UK_LABOUR_MARKET_FEB_2020,
        title: {
            text: 'Gross Weekly Earnings\nby Occupation (Q4 2019)',
            fontSize: 18,
        },
        subtitle: {
            text: 'Source: Office for\nNational Statistics',
        },
        series: [
            {
                type: 'bar',
                direction: 'horizontal',
                xKey: 'type',
                yKey: 'earnings',
            },
        ],
        axes: {
            x: {
                type: 'category',
                position: 'left',
            },
            y: {
                type: 'number',
                position: 'bottom',
                title: {
                    enabled: true,
                    text: '£/week',
                },
            },
        },
        legend: {
            enabled: false,
        },
    };
}

describe('AgChartsComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent, AgCharts],
        }).compileComponents();

        fixture = TestBed.createComponent(AgCharts);
        component = fixture.componentInstance;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

interface ActionRecord {
    calls: number;
    inZone: boolean[];
}

function recordedAction(record: ActionRecord): () => void {
    return () => {
        record.calls++;
        record.inZone.push(NgZone.isInAngularZone());
    };
}

@Component({
    selector: `context-menu-host-component`,
    standalone: true,
    imports: [AgCharts],
    template: ` <ag-charts [options]="options"></ag-charts>`,
})
class ContextMenuHostComponent {
    staticAction: ActionRecord = { calls: 0, inZone: [] };
    nestedAction: ActionRecord = { calls: 0, inZone: [] };
    dynamicAction: ActionRecord = { calls: 0, inZone: [] };

    options: AgChartOptions = {
        data: [
            { type: 'A', earnings: 1 },
            { type: 'B', earnings: 2 },
        ],
        series: [{ type: 'bar', xKey: 'type', yKey: 'earnings' }],
        contextMenu: {
            items: [
                'defaults',
                { label: 'static', action: recordedAction(this.staticAction) },
                { label: 'sub', items: [{ label: 'nested', action: recordedAction(this.nestedAction) }] },
            ],
            getItems: () => ['defaults', { label: 'dynamic', action: recordedAction(this.dynamicAction) }],
        },
    };
}

describe('context menu zone patching', () => {
    let host: ContextMenuHostComponent;
    let fixture: ComponentFixture<ContextMenuHostComponent>;
    let ngZone: NgZone;
    // Captures the options the wrapper hands to the chart at creation: patchChartOptions does not mutate
    // host.options, so the wrapped callbacks live only on the copy the chart receives, not on host.options.
    let createChartSpy: jasmine.Spy;

    const objectItems = (items: AgContextMenuItem[]) =>
        items.filter((item): item is Exclude<AgContextMenuItem, string> => typeof item !== 'string');
    const createdContextMenu = () =>
        (createChartSpy.calls.argsFor(0)[0] as AgChartOptions).contextMenu as AgContextMenuOptions;
    const chartInstance = () => fixture.debugElement.query(By.directive(AgCharts)).componentInstance.chart;

    beforeEach(async () => {
        createChartSpy = spyOn(AgCharts.prototype as any, 'createChart').and.callThrough();

        await TestBed.configureTestingModule({
            imports: [ContextMenuHostComponent, AgCharts],
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuHostComponent);
        host = fixture.componentInstance;
        ngZone = TestBed.inject(NgZone);
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('runs static item actions inside the Angular zone when dispatched outside it', () => {
        const [staticItem, subItem] = objectItems(createdContextMenu().items!);

        ngZone.runOutsideAngular(() => {
            staticItem.action!({} as any);
            objectItems(subItem.items!)[0].action!({} as any);
        });

        expect(host.staticAction.calls).toBe(1);
        expect(host.staticAction.inZone).toEqual([true]);
        expect(host.nestedAction.calls).toBe(1);
        expect(host.nestedAction.inZone).toEqual([true]);
    });

    it('runs getItems-returned actions inside the Angular zone and passes literals through', () => {
        ngZone.runOutsideAngular(() => {
            const items = createdContextMenu().getItems!({ defaultItems: [] } as any)!;
            expect(items[0]).toBe('defaults');
            objectItems(items)[0].action!({} as any);
        });

        expect(host.dynamicAction.calls).toBe(1);
        expect(host.dynamicAction.inZone).toEqual([true]);
    });

    it('never mutates the consumer options and re-wraps freshly on each patch', () => {
        const original = (host.options as any).contextMenu as AgContextMenuOptions;
        const originalGetItems = original.getItems;
        const [originalStatic] = objectItems(original.items!);
        const originalStaticAction = originalStatic.action;

        // Second patch flows through ngOnChanges -> chart.update, so observe the options it receives.
        const updateSpy = spyOn(chartInstance(), 'update').and.callThrough();
        host.options = { ...host.options };
        fixture.detectChanges();

        // The consumer's own options object was never written back to.
        expect((host.options as any).contextMenu.getItems).toBe(originalGetItems);
        expect(objectItems((host.options as any).contextMenu.items)[0].action).toBe(originalStaticAction);

        // The freshly-patched options the chart received still re-enter the zone.
        const updated = updateSpy.calls.argsFor(0)[0] as AgChartOptions;
        const [staticItem] = objectItems((updated.contextMenu as AgContextMenuOptions).items!);
        ngZone.runOutsideAngular(() => staticItem.action!({} as any));

        expect(host.staticAction.calls).toBe(1);
        expect(host.staticAction.inZone).toEqual([true]);
    });
});

@Component({
    selector: `validations-host-component`,
    standalone: true,
    imports: [AgCharts],
    template: ` <ag-charts [options]="options"></ag-charts>`,
})
class ValidationsHostComponent {
    issueRaised: ActionRecord = { calls: 0, inZone: [] };

    options: AgChartOptions = {
        data: [
            { type: 'A', earnings: 1 },
            { type: 'B', earnings: 2 },
        ],
        series: [{ type: 'bar', xKey: 'type', yKey: 'earnings' }],
        validations: {
            issueRaised: recordedAction(this.issueRaised),
        },
    };
}

describe('validations.issueRaised zone patching', () => {
    let host: ValidationsHostComponent;
    let fixture: ComponentFixture<ValidationsHostComponent>;
    let ngZone: NgZone;
    let createChartSpy: jasmine.Spy;

    beforeEach(async () => {
        createChartSpy = spyOn(AgCharts.prototype as any, 'createChart').and.callThrough();

        await TestBed.configureTestingModule({
            imports: [ValidationsHostComponent, AgCharts],
        }).compileComponents();

        fixture = TestBed.createComponent(ValidationsHostComponent);
        host = fixture.componentInstance;
        ngZone = TestBed.inject(NgZone);
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('runs the callback inside the Angular zone and leaves the consumer options untouched', () => {
        const created = createChartSpy.calls.argsFor(0)[0] as AgChartOptions;
        const patched = (created as any).validations.issueRaised;

        expect(patched).not.toBe((host.options as any).validations.issueRaised);

        ngZone.runOutsideAngular(() => patched({ severity: 'error', message: 'boom' }));

        expect(host.issueRaised.calls).toBe(1);
        expect(host.issueRaised.inZone).toEqual([true]);
    });
});
