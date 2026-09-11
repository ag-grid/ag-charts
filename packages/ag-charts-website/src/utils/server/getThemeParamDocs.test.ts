import { describe, expect, it } from 'vitest';

import { themeParamDocs } from './getThemeParamDocs';

const member = (name: string, docs?: string[]) => ({ kind: 'member' as const, name, type: 'string', docs });
const iface = (name: string, members: any[], heritage?: any[]) => ({
    kind: 'interface' as const,
    name,
    members,
    ...(heritage ? { heritage } : {}),
});
const makeReference = (nodes: Record<string, unknown>) => new Map<string, any>(Object.entries(nodes)) as any;

/** The real shape: the charts interface extends the one whose params grid shares. */
const reference = (chartsMembers: any[], baseMembers: any[] = []) =>
    makeReference({
        AgBaseChartThemeParams: iface('AgBaseChartThemeParams', baseMembers),
        AgChartThemeParams: iface('AgChartThemeParams', chartsMembers, ['AgBaseChartThemeParams']),
    });

describe('themeParamDocs', () => {
    it('reads the comment on each parameter', () => {
        const docs = themeParamDocs(reference([member('gridLineColor', ['Default colour for grid lines.'])]));

        expect(docs).toEqual({ gridLineColor: 'Default colour for grid lines.' });
    });

    it('reads the parameters of the interfaces the root extends', () => {
        const docs = themeParamDocs(
            reference([member('axisLineColor', ['Axis lines and ticks.'])], [member('borderWidth', ['Border width.'])])
        );

        expect(docs).toEqual({ borderWidth: 'Border width.', axisLineColor: 'Axis lines and ticks.' });
    });

    it('prefers the nearer comment when a parameter is redeclared', () => {
        const docs = themeParamDocs(
            reference([member('fontSize', ['The charts one.'])], [member('fontSize', ['The shared one.'])])
        );

        expect(docs.fontSize).toBe('The charts one.');
    });

    it('drops the sentence that describes the accepted value, which the editor decides', () => {
        const docs = themeParamDocs(
            reference([
                member('accentColor', ['The brand colour. A colour string, or a theme-colour reference object.']),
                member('fontFamily', [
                    'Font for all text. A single family name, or an array of names used as fallbacks.',
                ]),
                member('menuBorder', [
                    'Border around menus. `true` for the default border, `false` to disable, or an object to customise it.',
                ]),
                member('focusShadow', ['Shadow around focused controls. The value must be a valid CSS box-shadow.']),
            ])
        );

        expect(docs).toEqual({
            accentColor: 'The brand colour.',
            fontFamily: 'Font for all text.',
            menuBorder: 'Border around menus.',
            focusShadow: 'Shadow around focused controls.',
        });
    });

    it('reads a wrapped comment as one line, a tooltip having no use for the source layout', () => {
        const docs = themeParamDocs(
            reference([member('backgroundColor', ['Background colour of the chart.', 'Most text is blended onto it.'])])
        );

        expect(docs.backgroundColor).toBe('Background colour of the chart. Most text is blended onto it.');
    });

    it('leaves out a parameter with nothing to say rather than offering an empty tooltip', () => {
        const docs = themeParamDocs(reference([member('focusColor'), member('gridLineColor', ['  '])]));

        expect(docs).toEqual({});
    });

    it('returns nothing when the reference does not carry the interface', () => {
        expect(themeParamDocs(makeReference({}))).toEqual({});
    });
});
