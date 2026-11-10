import 'zone.js';
import 'zone.js/testing';

import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Angular 21 TestBed is zoneless by default; the specs assert zone behaviour.
@NgModule({ providers: [provideZoneChangeDetection()] })
class ZoneChangeDetectionTestingModule {}

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
    [BrowserDynamicTestingModule, ZoneChangeDetectionTestingModule],
    platformBrowserDynamicTesting(),
    {
        teardown: { destroyAfterEach: true },
    }
);
