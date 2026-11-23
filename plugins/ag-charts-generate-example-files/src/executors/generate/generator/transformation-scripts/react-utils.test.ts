import { convertFunctionalTemplate, convertTemplate, getImport } from './react-utils';

describe('convertTemplate', () => {
    it('converts event handlers', () => {
        const template = '<button onclick="foo(true)">Hello!</button>';
        const converted = convertTemplate(template);

        expect(converted).toBe('<button onClick={() => this.foo(true)}>Hello!</button>');
    });

    it('removes trailing event parameter from handler calls', () => {
        const converted = convertTemplate('<button onchange="foo(true, event)">Hello!</button>');

        expect(converted).toBe('<button onChange={() => this.foo(true)}>Hello!</button>');
    });

    it('removes non-first event parameter from handler calls', () => {
        const converted = convertTemplate('<button oninput="foo(true, event, false)">Hello!</button>');

        expect(converted).toBe('<button onInput={() => this.foo(true, false)}>Hello!</button>');
    });

    it('leaves first event parameter from handler calls', () => {
        const converted = convertTemplate('<button onclick="foo(event)">Hello!</button>');

        expect(converted).toBe('<button onClick={() => this.foo(event)}>Hello!</button>');
    });

    it('handles multiple event handlers', () => {
        const template = '<div onclick="foo(true)" ondrop="bar(false)">Hello!</div>';
        const converted = convertTemplate(template);

        expect(converted).toBe('<div onClick={() => this.foo(true)} onDrop={() => this.bar(false)}>Hello!</div>');
    });

    it('fixes casing for dragover', () => {
        const template = '<div ondragover="foo(true)">Hello!</div>';
        const converted = convertTemplate(template);

        expect(converted).toBe('<div onDragOver={() => this.foo(true)}>Hello!</div>');
    });

    it('fixes casing for dragstart', () => {
        const template = '<div ondragstart="foo(true)">Hello!</div>';
        const converted = convertTemplate(template);

        expect(converted).toBe('<div onDragStart={() => this.foo(true)}>Hello!</div>');
    });

    it('ensures input tags are closed', () => {
        const template = '<input type="checkbox">';
        const converted = convertTemplate(template);

        expect(converted).toBe('<input type="checkbox" />');
    });

    it('ensures input value attributes are renamed', () => {
        const template = '<input type="text" value="foo" maxLength="20">';
        const converted = convertTemplate(template);

        expect(converted).toBe('<input type="text" defaultValue="foo" maxLength="20" />');
    });

    it('ensures input checked attributes are renamed', () => {
        const template = '<input type="radio" name="group" value="foo" checked>';
        const converted = convertTemplate(template);

        expect(converted).toBe('<input type="radio" name="group" defaultValue="foo" defaultChecked />');
    });

    it('ensures explicit input checked attributes are renamed', () => {
        const template = '<input type="checkbox" checked="true">';
        const converted = convertTemplate(template);

        expect(converted).toBe('<input type="checkbox" defaultChecked />');
    });

    it('converts boolean disabled attributes', () => {
        const template = '<fieldset class="control-group" disabled=""><button disabled="">Go</button></fieldset>';
        const converted = convertTemplate(template);

        expect(converted).toBe(
            '<fieldset className="control-group" disabled={true}><button disabled={true}>Go</button></fieldset>'
        );
    });

    it('converts checked after an event handler', () => {
        const template = '<input type="radio" onchange="f(event)" checked>';
        const converted = convertTemplate(template);

        expect(converted).toBe('<input type="radio" onChange={() => this.f(event)} defaultChecked />');
    });

    it('leaves standalone-looking words in text content alone', () => {
        const converted = convertTemplate('<label>the checked one is disabled </label>');

        expect(converted).toBe('<label>the checked one is disabled </label>');
    });

    it('leaves checked alone unless it is a standalone attribute', () => {
        const template =
            '<input type="radio" onchange="checkedChange(event)" aria-checked="true" data-checked="1" checked>';
        const converted = convertTemplate(template);

        expect(converted).toBe(
            '<input type="radio" onChange={() => this.checkedChange(event)} aria-checked="true" data-checked="1" defaultChecked />'
        );
    });

    it('leaves disabled alone unless it is a standalone attribute', () => {
        const template = '<button aria-disabled="true" data-disabled="1" disabled>Go</button>';
        const converted = convertTemplate(template);

        expect(converted).toBe('<button aria-disabled="true" data-disabled="1" disabled={true}>Go</button>');
    });

    it('does not change value attributes for other elements', () => {
        const template = '<option value="bob">';
        const converted = convertTemplate(template);

        expect(converted).toBe('<option value="bob">');
    });

    it('replaces class with className', () => {
        const template = '<div class="foo">Hello!</div>';
        const converted = convertTemplate(template);

        expect(converted).toBe('<div className="foo">Hello!</div>');
    });

    it('converts styles', () => {
        const template = '<div style="background-color: #ff0000; height: 80%">Hello!</div>';
        const converted = convertTemplate(template);

        expect(converted).toBe('<div style={{"backgroundColor":"#ff0000","height":"80%"}}>Hello!</div>');
    });
});

describe('getImport', () => {
    it('returns import statement', () => {
        const name = 'myComponent.jsx';
        const importStatement = getImport(name);

        expect(importStatement).toBe("import MyComponent from './myComponent.jsx';");
    });
});

describe('convertFunctionalTemplate', () => {
    describe('event handlers', () => {
        it('passes the DOM event, which handlers are written against, not the React SyntheticEvent', () => {
            const converted = convertFunctionalTemplate('<select onchange="onChange(event)"></select>');

            expect(converted).toBe('<select onChange={(event) => onChange(event.nativeEvent)}></select>');
        });

        it('passes the DOM event in the position the handler takes it', () => {
            const converted = convertFunctionalTemplate('<button onclick="foo(1, event)">Go</button>');

            expect(converted).toBe('<button onClick={(event) => foo(1, event.nativeEvent)}>Go</button>');
        });

        it('keeps an event member access as it is', () => {
            const converted = convertFunctionalTemplate('<button onclick="foo(event.shiftKey)">Go</button>');

            expect(converted).toBe('<button onClick={(event) => foo(event.shiftKey)}>Go</button>');
        });

        it('reads `this` in an inline handler from the element, which an arrow function cannot see as `this`', () => {
            const converted = convertFunctionalTemplate('<input type="range" oninput="setSize(this.value)">');

            expect(converted).toBe('<input type="range" onInput={(event) => setSize(event.currentTarget.value)} />');
        });

        it('closes the input tag before its handler arguments are converted', () => {
            const converted = convertFunctionalTemplate('<input type="text" oninput="set(this.value)">', {
                typed: true,
            });

            expect(converted).toMatch(/ \/>$/);
            expect(converted.match(/\/>/g)).toHaveLength(1);
        });
    });

    describe('typed handlers', () => {
        it('asserts a value read from the element to the type the handler declares', () => {
            const converted = convertFunctionalTemplate('<select onchange="setMode(this.value)"></select>', {
                typed: true,
            });

            expect(converted).toBe(
                '<select onChange={(event) => setMode(event.currentTarget.value as Parameters<typeof setMode>[0])}></select>'
            );
        });

        it('asserts the right parameter of the handler to each argument', () => {
            const converted = convertFunctionalTemplate('<select onchange="set(1, this.value)"></select>', {
                typed: true,
            });

            expect(converted).toContain('set(1, event.currentTarget.value as Parameters<typeof set>[1])');
        });

        it('asserts the selected option text too', () => {
            const converted = convertFunctionalTemplate(
                '<select onchange="set(event.currentTarget.selectedOptions[0].text)"></select>',
                { typed: true }
            );

            expect(converted).toContain('as Parameters<typeof set>[0]');
        });

        it('reads from the element the handler is on, not event.target, which is an EventTarget', () => {
            const converted = convertFunctionalTemplate('<input type="text" oninput="set(event.target.value)">', {
                typed: true,
            });

            expect(converted).toContain('set(event.currentTarget.value as Parameters<typeof set>[0])');
            expect(converted).not.toContain('event.target');
        });

        it('leaves arguments that are not read from the element', () => {
            const converted = convertFunctionalTemplate('<button onclick="set(\'a\', 2)">Go</button>', { typed: true });

            expect(converted).toBe(`<button onClick={() => set('a', 2)}>Go</button>`);
        });

        it('does not assert types unless asked to', () => {
            const converted = convertFunctionalTemplate('<select onchange="setMode(this.value)"></select>');

            expect(converted).not.toContain('Parameters');
        });
    });

    describe('boolean attributes', () => {
        it('does not mistake a word inside another attribute value for the attribute', () => {
            const converted = convertFunctionalTemplate('<input type="text" placeholder="a disabled input">');

            expect(converted).toBe('<input type="text" placeholder="a disabled input" />');
        });

        it('still converts the attribute after one whose value contains it', () => {
            const converted = convertFunctionalTemplate('<button title="not disabled" disabled>Go</button>');

            expect(converted).toBe('<button title="not disabled" disabled={true}>Go</button>');
        });

        it('does not mistake checked inside an attribute value', () => {
            const converted = convertFunctionalTemplate(`<input type="checkbox" aria-label='is checked' checked>`);

            expect(converted).toBe(`<input type="checkbox" aria-label='is checked' defaultChecked />`);
        });

        it('converts a disabled attribute on a hyphenated element', () => {
            const converted = convertFunctionalTemplate('<my-button disabled></my-button>');

            expect(converted).toBe('<my-button disabled={true}></my-button>');
        });
    });
});
