import { Component, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
    AgChartOptions,
    AgContextMenuGetItemsCallback,
    AgContextMenuItem,
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

    const contextMenu = () => (host.options as any).contextMenu;
    const objectItems = (items: AgContextMenuItem[]) =>
        items.filter((item): item is Exclude<AgContextMenuItem, string> => typeof item !== 'string');

    beforeEach(async () => {
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
        const [staticItem, subItem] = objectItems(contextMenu().items);

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
            const items = contextMenu().getItems({ defaultItems: [] })!;
            expect(items[0]).toBe('defaults');
            objectItems(items)[0].action!({} as any);
        });

        expect(host.dynamicAction.calls).toBe(1);
        expect(host.dynamicAction.inZone).toEqual([true]);
    });

    it('does not re-wrap callbacks when options are patched again', () => {
        const patchedGetItems = contextMenu().getItems as AgContextMenuGetItemsCallback;

        host.options = { ...host.options };
        fixture.detectChanges();

        expect(contextMenu().getItems).toBe(patchedGetItems);

        const [staticItem] = objectItems(contextMenu().items);
        ngZone.runOutsideAngular(() => staticItem.action!({} as any));

        expect(host.staticAction.calls).toBe(1);
        expect(host.staticAction.inZone).toEqual([true]);
    });
});
