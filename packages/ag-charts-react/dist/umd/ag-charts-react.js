(function (g, f) {
    if ("object" == typeof exports && "object" == typeof module) {
      module.exports = f(require('ag-charts-community'), require('react'), require('react-dom'));
    } else if ("function" == typeof define && define.amd) {
      define("AgChartsReact", ['ag-charts-community', 'react', 'react-dom'], f);
    } else if ("object" == typeof exports) {
      exports["AgChartsReact"] = f(require('ag-charts-community'), require('react'), require('react-dom'));
    } else {
      g["AgChartsReact"] = f(g["agCharts"], g["React"], g["ReactDOM"]);
    }
  }(this, (__da, __db, __dc) => {
var exports = {};
var module = { exports };
if (typeof require === 'undefined') {
    function require(name) {
        if (name === 'ag-charts-community') return __da;
        if (name === 'react') return __db;
        if (name === 'react-dom') return __dc;
        throw new Error('Unknown module: ' + name);
    }
}
        
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/prop-types/lib/ReactPropTypesSecret.js
var require_ReactPropTypesSecret = __commonJS({
  "node_modules/prop-types/lib/ReactPropTypesSecret.js"(exports, module2) {
    "use strict";
    var ReactPropTypesSecret = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
    module2.exports = ReactPropTypesSecret;
  }
});

// node_modules/prop-types/factoryWithThrowingShims.js
var require_factoryWithThrowingShims = __commonJS({
  "node_modules/prop-types/factoryWithThrowingShims.js"(exports, module2) {
    "use strict";
    var ReactPropTypesSecret = require_ReactPropTypesSecret();
    function emptyFunction() {
    }
    function emptyFunctionWithReset() {
    }
    emptyFunctionWithReset.resetWarningCache = emptyFunction;
    module2.exports = function() {
      function shim(props, propName, componentName, location, propFullName, secret) {
        if (secret === ReactPropTypesSecret) {
          return;
        }
        var err = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        err.name = "Invariant Violation";
        throw err;
      }
      ;
      shim.isRequired = shim;
      function getShim() {
        return shim;
      }
      ;
      var ReactPropTypes = {
        array: shim,
        bigint: shim,
        bool: shim,
        func: shim,
        number: shim,
        object: shim,
        string: shim,
        symbol: shim,
        any: shim,
        arrayOf: getShim,
        element: shim,
        elementType: shim,
        instanceOf: getShim,
        node: shim,
        objectOf: getShim,
        oneOf: getShim,
        oneOfType: getShim,
        shape: getShim,
        exact: getShim,
        checkPropTypes: emptyFunctionWithReset,
        resetWarningCache: emptyFunction
      };
      ReactPropTypes.PropTypes = ReactPropTypes;
      return ReactPropTypes;
    };
  }
});

// node_modules/prop-types/index.js
var require_prop_types = __commonJS({
  "node_modules/prop-types/index.js"(exports, module2) {
    "use strict";
    if (false) {
      ReactIs = null;
      throwOnDirectAccess = true;
      module2.exports = null(ReactIs.isElement, throwOnDirectAccess);
    } else {
      module2.exports = require_factoryWithThrowingShims()();
    }
    var ReactIs;
    var throwOnDirectAccess;
  }
});

// packages/ag-charts-react/dist/package/index.esm.mjs
var index_esm_exports = {};
__export(index_esm_exports, {
  AgChartsReact: () => AgChartsReact
});
module.exports = __toCommonJS(index_esm_exports);
var PropTypes = __toESM(require_prop_types(), 1);
var import_react = require("react");
var import_ag_charts_community = require("ag-charts-community");
var __defProp2 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var AgChartsReact = class extends import_react.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.chartRef = (0, import_react.createRef)();
  }
  render() {
    return (0, import_react.createElement)("div", {
      style: this.createStyleForDiv(),
      ref: this.chartRef
    });
  }
  createStyleForDiv() {
    return __spreadValues({
      height: "100%"
    }, this.props.containerStyle);
  }
  componentDidMount() {
    const options = this.applyContainerIfNotSet(this.props.options);
    const chart = import_ag_charts_community.AgCharts.create(options);
    this.chart = chart;
    chart.chart.waitForUpdate().then(() => {
      var _a, _b;
      return (_b = (_a = this.props).onChartReady) == null ? void 0 : _b.call(_a, chart);
    });
  }
  applyContainerIfNotSet(propsOptions) {
    if (propsOptions.container) {
      return propsOptions;
    }
    return __spreadProps(__spreadValues({}, propsOptions), { container: this.chartRef.current });
  }
  shouldComponentUpdate(nextProps) {
    this.processPropsChanges(this.props, nextProps);
    return false;
  }
  processPropsChanges(prevProps, nextProps) {
    if (this.chart) {
      import_ag_charts_community.AgCharts.update(this.chart, this.applyContainerIfNotSet(nextProps.options));
    }
  }
  componentWillUnmount() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = void 0;
    }
  }
};
AgChartsReact.propTypes = {
  options: PropTypes.object
};
if (typeof module.exports == "object" && typeof exports == "object") {
  var __cp = (to, from, except, desc) => {
    if ((from && typeof from === "object") || typeof from === "function") {
      for (let key of Object.getOwnPropertyNames(from)) {
        if (!Object.prototype.hasOwnProperty.call(to, key) && key !== except)
        Object.defineProperty(to, key, {
          get: () => from[key],
          enumerable: !(desc = Object.getOwnPropertyDescriptor(from, key)) || desc.enumerable,
        });
      }
    }
    return to;
  };
  module.exports = __cp(module.exports, exports);
}
return module.exports;
}))
