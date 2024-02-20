import { createRef, createElement, Component } from 'react';
import { AgCharts } from 'ag-charts-community';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

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
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
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
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
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
  return function () {
    var Super = _getPrototypeOf(Derived),
        result;

    if (_isNativeReflectConstruct()) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

var AgChartsReact = /*#__PURE__*/function (_Component) {
  _inherits(AgChartsReact, _Component);
  var _super = _createSuper(AgChartsReact);
  function AgChartsReact(props) {
    var _this;
    _classCallCheck(this, AgChartsReact);
    _this = _super.call(this, props);
    _this.props = props;
    _this.chart = void 0;
    _this.chartRef = void 0;
    _this.chartRef = createRef();
    return _this;
  }
  _createClass(AgChartsReact, [{
    key: "render",
    value: function render() {
      return createElement('div', {
        style: this.createStyleForDiv(),
        ref: this.chartRef
      });
    }
  }, {
    key: "createStyleForDiv",
    value: function createStyleForDiv() {
      return _objectSpread2({
        height: '100%'
      }, this.props.containerStyle);
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      var options = this.applyContainerIfNotSet(this.props.options);
      var chart = AgCharts.create(options);
      this.chart = chart;
      chart.chart.waitForUpdate().then(function () {
        var _this2$props$onChartR, _this2$props;
        return (_this2$props$onChartR = (_this2$props = _this2.props).onChartReady) === null || _this2$props$onChartR === void 0 ? void 0 : _this2$props$onChartR.call(_this2$props, chart);
      });
    }
  }, {
    key: "applyContainerIfNotSet",
    value: function applyContainerIfNotSet(propsOptions) {
      if (propsOptions.container) {
        return propsOptions;
      }
      return _objectSpread2(_objectSpread2({}, propsOptions), {}, {
        container: this.chartRef.current
      });
    }
  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps) {
      this.processPropsChanges(this.props, nextProps);

      // we want full control of the dom, as AG Charts doesn't use React internally,
      // so for performance reasons we tell React we don't need render called after
      // property changes.
      return false;
    }
  }, {
    key: "processPropsChanges",
    value: function processPropsChanges(prevProps, nextProps) {
      if (this.chart) {
        AgCharts.update(this.chart, this.applyContainerIfNotSet(nextProps.options));
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = undefined;
      }
    }
  }]);
  return AgChartsReact;
}(Component);

export { AgChartsReact };
