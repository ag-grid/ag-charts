import { describe, expect, it } from '@jest/globals';

import { EventEmitter, getDocument } from 'ag-charts-core';

import { EventsHub } from '../core/eventsHub';
import { DOMManager } from './domManager';

describe('DOMManager', () => {
    beforeEach(() => {
        // Prevent bleed of state between tests.
        getDocument().head.innerHTML = '';
    });

    const eventsHub: EventsHub = new EventEmitter();

    describe('for normal container cases', () => {
        it('should initialize the expected DOM', () => {
            const doc = getDocument();
            const container = doc.createElement('div');
            doc.body.append(container);

            const dm = new DOMManager(eventsHub, { styleNonce: '416d1177' }, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchInlineSnapshot(`
<div>
  <div
    class="ag-charts-wrapper ag-charts-styles"
    data-ag-charts=""
    style="width: 300px; height: 300px;"
  >
    
    
    <div
      class="ag-charts-tab-guard"
    />
    <div
      class="ag-charts-canvas-center"
      role="presentation"
      style="visibility: hidden;"
    >
      
        
      <div
        class="ag-charts-canvas-container"
        role="presentation"
      >
        
            
        <div
          aria-hidden="true"
          class="ag-charts-canvas-background"
          role="presentation"
        />
        
            
        <div
          aria-hidden="true"
          class="ag-charts-canvas"
          role="presentation"
        />
        
            
        <div
          class="ag-charts-canvas-proxy"
          role="figure"
        >
          
                
          <div
            class="ag-charts-series-area"
            role="presentation"
          />
          
            
        </div>
        
            
        <div
          class="ag-charts-canvas-overlay ag-charts-tooltip-container"
          role="presentation"
        />
        
        
      </div>
      
    
    </div>
    <div
      class="ag-charts-tab-guard"
    />
    

  </div>
</div>
`);
            expect(doc.head).toMatchInlineSnapshot(`
<head>
  <style
    data-ag-charts="ag-charts-community"
    nonce="416d1177"
  >
    @import url(./dom/domStyles.css);
@import url(./dom/proxyInteractionStyles.css);
@import url(./dom/focusStyles.css);
@import url(./chart/update/overlaysProcessor.css);
@import url(./chart/interaction/tooltipManager.css);
@import url(./components/popover/popover.css);
@import url(./components/menu/menu.css);
@import url(./components/toolbar/toolbar.css);

  </style>
  <style
    data-ag-charts="test"
    nonce="416d1177"
  >
    .test { width: 100% }
  </style>
</head>
`);
        });
    });

    describe('for disconnected container cases', () => {
        it('should initialize the expected DOM', () => {
            const doc = getDocument();
            const container = doc.createElement('div');
            // doc.body.append(container);

            const dm = new DOMManager(eventsHub, { styleNonce: '416d1171' }, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchInlineSnapshot(`
<div>
  <div
    class="ag-charts-wrapper ag-charts-styles"
    data-ag-charts=""
    style="width: 300px; height: 300px;"
  >
    
    
    <div
      class="ag-charts-tab-guard"
    />
    <div
      class="ag-charts-canvas-center"
      role="presentation"
      style="visibility: hidden;"
    >
      
        
      <div
        class="ag-charts-canvas-container"
        role="presentation"
      >
        
            
        <div
          aria-hidden="true"
          class="ag-charts-canvas-background"
          role="presentation"
        />
        
            
        <div
          aria-hidden="true"
          class="ag-charts-canvas"
          role="presentation"
        />
        
            
        <div
          class="ag-charts-canvas-proxy"
          role="figure"
        >
          
                
          <div
            class="ag-charts-series-area"
            role="presentation"
          />
          
            
        </div>
        
            
        <div
          class="ag-charts-canvas-overlay ag-charts-tooltip-container"
          role="presentation"
        />
        
        
      </div>
      
    
    </div>
    <div
      class="ag-charts-tab-guard"
    />
    

    <style
      data-ag-charts="ag-charts-community"
      nonce="416d1171"
    >
      @import url(./dom/domStyles.css);
@import url(./dom/proxyInteractionStyles.css);
@import url(./dom/focusStyles.css);
@import url(./chart/update/overlaysProcessor.css);
@import url(./chart/interaction/tooltipManager.css);
@import url(./components/popover/popover.css);
@import url(./components/menu/menu.css);
@import url(./components/toolbar/toolbar.css);

    </style>
    <style
      data-ag-charts="test"
      nonce="416d1171"
    >
      .test { width: 100% }
    </style>
  </div>
</div>
`);
            expect(doc.head).toMatchInlineSnapshot(`<head />`);
        });
    });

    describe('for shadow-DOM container cases', () => {
        it('should initialize the expected DOM', () => {
            const doc = getDocument();
            const component = doc.createElement('div');
            const container = doc.createElement('div');
            doc.body.append(component);
            const shadow = component.attachShadow({ mode: 'open' });
            shadow.appendChild(container);

            const dm = new DOMManager(eventsHub, { styleNonce: '416d1177' }, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchInlineSnapshot(`
<div>
  <div
    class="ag-charts-wrapper ag-charts-styles"
    data-ag-charts=""
    style="width: 300px; height: 300px;"
  >
    
    
    <div
      class="ag-charts-tab-guard"
    />
    <div
      class="ag-charts-canvas-center"
      role="presentation"
      style="visibility: hidden;"
    >
      
        
      <div
        class="ag-charts-canvas-container"
        role="presentation"
      >
        
            
        <div
          aria-hidden="true"
          class="ag-charts-canvas-background"
          role="presentation"
        />
        
            
        <div
          aria-hidden="true"
          class="ag-charts-canvas"
          role="presentation"
        />
        
            
        <div
          class="ag-charts-canvas-proxy"
          role="figure"
        >
          
                
          <div
            class="ag-charts-series-area"
            role="presentation"
          />
          
            
        </div>
        
            
        <div
          class="ag-charts-canvas-overlay ag-charts-tooltip-container"
          role="presentation"
        />
        
        
      </div>
      
    
    </div>
    <div
      class="ag-charts-tab-guard"
    />
    

    <style
      data-ag-charts="ag-charts-community"
      nonce="416d1177"
    >
      @import url(./dom/domStyles.css);
@import url(./dom/proxyInteractionStyles.css);
@import url(./dom/focusStyles.css);
@import url(./chart/update/overlaysProcessor.css);
@import url(./chart/interaction/tooltipManager.css);
@import url(./components/popover/popover.css);
@import url(./components/menu/menu.css);
@import url(./components/toolbar/toolbar.css);

    </style>
    <style
      data-ag-charts="test"
      nonce="416d1177"
    >
      .test { width: 100% }
    </style>
  </div>
</div>
`);
            expect(doc.head).toMatchInlineSnapshot(`<head />`);
        });
    });
});
