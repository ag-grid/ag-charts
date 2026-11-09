// Angular entry point file
import '@angular/compiler';
import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, { providers: [provideZoneChangeDetection()] });
