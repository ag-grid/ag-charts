import { describe, expect, it } from 'vitest';

import { AnnotationDefaults } from './annotationDefaults';
import { AnnotationType } from './annotationTypes';

describe('AnnotationDefaults line style', () => {
    const type = AnnotationType.Line;
    const line = (props: object = {}) => ({ type, start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, ...props }) as any;

    it.each(['solid', 'dash', 'dot'] as const)('stores the %s dash name, not an array', (lineStyle) => {
        const defaults = new AnnotationDefaults();
        defaults.setDefaultLineStyleType(type, lineStyle);
        defaults.setDefaultLineStyleWidth(type, 3);

        expect(defaults.createMemento().lineStyles.get(type)).toEqual({ lineDash: lineStyle, strokeWidth: 3 });

        const datum = line();
        defaults.applyDefaults(datum);
        expect(datum).toMatchObject({ lineDash: lineStyle, strokeWidth: 3 });
    });

    it('restores the names from a memento and applies them to a new annotation', () => {
        const saved = new AnnotationDefaults();
        saved.setDefaultLineStyleType(type, 'dot');
        const memento = saved.createMemento();

        const restored = new AnnotationDefaults();
        restored.restoreMemento('', '', memento);

        const datum = line();
        restored.applyDefaults(datum);
        expect(datum.lineDash).toBe('dot');
    });

    it('keeps the stored name when the width default changes afterwards', () => {
        const defaults = new AnnotationDefaults();
        defaults.setDefaultLineStyleType(type, 'dash');
        defaults.setDefaultLineStyleWidth(type, 5);

        const datum = line();
        defaults.applyDefaults(datum);
        expect(datum).toMatchObject({ lineDash: 'dash', strokeWidth: 5 });
    });

    it('replaces a custom dash on the annotation with the default name, and leaves it when none is set', () => {
        const withDefault = new AnnotationDefaults();
        withDefault.setDefaultLineStyleType(type, 'dash');
        const replaced = line({ lineDash: [8, 3] });
        withDefault.applyDefaults(replaced);
        expect(replaced.lineDash).toBe('dash');

        const withoutDefault = new AnnotationDefaults();
        const kept = line({ lineDash: [8, 3] });
        withoutDefault.applyDefaults(kept);
        expect(kept.lineDash).toEqual([8, 3]);
    });
});
