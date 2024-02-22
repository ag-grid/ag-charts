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

// packages/ag-charts-react/dist/index.cjs
Object.defineProperty(exports, "__esModule", { value: true });
var react = require("react");
var agChartsCommunity = require("ag-charts-community");
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  return Constructor;
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf2(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _setPrototypeOf(o, p);
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass)
    _setPrototypeOf(subClass, superClass);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf2(o2) {
    return o2.__proto__ || Object.getPrototypeOf(o2);
  };
  return _getPrototypeOf(o);
}
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct)
    return false;
  if (Reflect.construct.sham)
    return false;
  if (typeof Proxy === "function")
    return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function() {
    }));
    return true;
  } catch (e) {
    return false;
  }
}
function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof2(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof = function _typeof2(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof(obj);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}
function _createSuper(Derived) {
  return function() {
    var Super = _getPrototypeOf(Derived), result;
    if (_isNativeReflectConstruct()) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}
var AgChartsReact = /* @__PURE__ */ function(_Component) {
  _inherits(AgChartsReact2, _Component);
  var _super = _createSuper(AgChartsReact2);
  function AgChartsReact2(props) {
    var _this;
    _classCallCheck(this, AgChartsReact2);
    _this = _super.call(this, props);
    _this.props = props;
    _this.chartRef = react.createRef();
    return _this;
  }
  _createClass(AgChartsReact2, [{
    key: "render",
    value: function render() {
      return react.createElement("div", {
        style: this.createStyleForDiv(),
        ref: this.chartRef
      });
    }
  }, {
    key: "createStyleForDiv",
    value: function createStyleForDiv() {
      return Object.assign({
        height: "100%"
      }, this.props.containerStyle);
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      var options = this.applyContainerIfNotSet(this.props.options);
      var chart = agChartsCommunity.AgCharts.create(options);
      this.chart = chart;
      chart.chart.waitForUpdate().then(function() {
        var _a, _b;
        return (_b = (_a = _this2.props).onChartReady) === null || _b === void 0 ? void 0 : _b.call(_a, chart);
      });
    }
  }, {
    key: "applyContainerIfNotSet",
    value: function applyContainerIfNotSet(propsOptions) {
      if (propsOptions.container) {
        return propsOptions;
      }
      return Object.assign(Object.assign({}, propsOptions), {
        container: this.chartRef.current
      });
    }
  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps) {
      this.processPropsChanges(this.props, nextProps);
      return false;
    }
  }, {
    key: "processPropsChanges",
    value: function processPropsChanges(prevProps, nextProps) {
      if (this.chart) {
        agChartsCommunity.AgCharts.update(this.chart, this.applyContainerIfNotSet(nextProps.options));
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = void 0;
      }
    }
  }]);
  return AgChartsReact2;
}(react.Component);
exports.AgChartsReact = AgChartsReact;
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
