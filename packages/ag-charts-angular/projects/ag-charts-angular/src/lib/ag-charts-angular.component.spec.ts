import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgChartOptions } from 'ag-charts-community';

import { AgChartsAngular } from './ag-charts-angular.component';

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
    template: ` <ag-charts-angular [options]="options"></ag-charts-angular>`,
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
        axes: [
            {
                type: 'category',
                position: 'left',
            },
            {
                type: 'number',
                position: 'bottom',
                title: {
                    enabled: true,
                    text: '£/week',
                },
            },
        ],
        legend: {
            enabled: false,
        },
    };
}

describe('AgChartsAngularComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent, AgChartsAngular],
        }).compileComponents();

        fixture = TestBed.createComponent(AgChartsAngular);
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
