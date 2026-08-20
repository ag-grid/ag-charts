import { convertTemplate, getImport } from './react-utils';

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
