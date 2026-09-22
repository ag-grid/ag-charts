import { Component, signal } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

/** The `cellRendererParams` an `IconCell` column passes: how to find a value's icon, and its class. */
export interface IconCellParams {
    iconUrl: (value: string) => string | undefined;
    imgClass?: string;
}

/**
 * A cell showing a value beside its icon. The icon is decorative: the name beside it carries the
 * meaning. Buckets with no icon ("Unknown" country, "Other" browser) render as text alone. The React
 * version renders nothing at all for an empty value; here the host span is always present, empty.
 */
@Component({
    selector: 'span[waIconCell]',
    host: { class: 'wa-icon-cell' },
    template: `
        @if (src(); as src) {
            <img [class]="imgClass()" [src]="src" alt="" aria-hidden="true" loading="lazy" />
        }
        {{ value() }}
    `,
})
export class IconCell implements ICellRendererAngularComp {
    protected readonly value = signal('');
    protected readonly src = signal<string | undefined>(undefined);
    protected readonly imgClass = signal('wa-cell-icon');

    agInit(params: ICellRendererParams & IconCellParams): void {
        this.read(params);
    }

    refresh(params: ICellRendererParams & IconCellParams): boolean {
        this.read(params);
        return true;
    }

    private read({ value, iconUrl, imgClass = 'wa-cell-icon' }: ICellRendererParams & IconCellParams): void {
        const text = typeof value === 'string' ? value : '';
        this.value.set(text);
        this.src.set(text ? iconUrl(text) : undefined);
        this.imgClass.set(imgClass);
    }
}
