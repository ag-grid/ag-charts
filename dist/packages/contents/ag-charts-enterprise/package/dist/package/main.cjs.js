"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __reflectGet = Reflect.get;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
var __superGet = (cls, obj, key) => __reflectGet(__getProtoOf(cls), key, obj);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// packages/ag-charts-enterprise/src/main.ts
var main_exports = {};
__export(main_exports, {
  AgCharts: () => import_ag_charts_community124.AgCharts,
  time: () => import_ag_charts_community124.time
});
module.exports = __toCommonJS(main_exports);
var import_ag_charts_community124 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/setup.ts
var import_ag_charts_community123 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/axes/angle/angleAxisThemes.ts
var import_ag_charts_community = require("ag-charts-community");
var ANGLE_AXIS_THEME = {
  __extends__: import_ag_charts_community._Theme.EXTENDS_AXES_DEFAULTS,
  gridLine: {
    enabled: false,
    __extends__: import_ag_charts_community._Theme.EXTENDS_AXES_GRID_LINE_DEFAULTS
  }
};

// packages/ag-charts-enterprise/src/axes/angle-category/angleCategoryAxis.ts
var import_ag_charts_community5 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/utils/polar.ts
function loopSymmetrically(items, step, iterator) {
  const loop = (start, end, loopStep, loopIterator) => {
    let prev = items[0];
    for (let i = start; loopStep > 0 ? i <= end : i > end; i += loopStep) {
      const curr = items[i];
      if (loopIterator(prev, curr))
        return true;
      prev = curr;
    }
    return false;
  };
  const midIndex = Math.floor(items.length / 2);
  if (loop(step, midIndex, step, iterator))
    return true;
  return loop(items.length - step, midIndex, -step, iterator);
}

// packages/ag-charts-enterprise/src/axes/angle/angleAxis.ts
var import_ag_charts_community4 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/axes/polar-crosslines/angleCrossLine.ts
var import_ag_charts_community3 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/axes/polar-crosslines/polarCrossLine.ts
var import_ag_charts_community2 = require("ag-charts-community");
var {
  ChartAxisDirection,
  Layers,
  ARRAY,
  BOOLEAN,
  COLOR_STRING,
  FONT_STYLE,
  FONT_WEIGHT,
  LINE_DASH,
  NUMBER,
  POSITIVE_NUMBER,
  RATIO,
  STRING,
  UNION,
  AND,
  Validate,
  MATCHING_CROSSLINE_TYPE
} = import_ag_charts_community2._ModuleSupport;
var { Group } = import_ag_charts_community2._Scene;
var { createId } = import_ag_charts_community2._Util;
var PolarCrossLineLabel = class {
  constructor() {
    this.enabled = void 0;
    this.text = void 0;
    this.fontStyle = void 0;
    this.fontWeight = void 0;
    this.fontSize = 14;
    this.fontFamily = "Verdana, sans-serif";
    this.padding = 5;
    this.color = "rgba(87, 87, 87, 1)";
    this.parallel = void 0;
  }
};
__decorateClass([
  Validate(BOOLEAN, { optional: true })
], PolarCrossLineLabel.prototype, "enabled", 2);
__decorateClass([
  Validate(STRING, { optional: true })
], PolarCrossLineLabel.prototype, "text", 2);
__decorateClass([
  Validate(FONT_STYLE, { optional: true })
], PolarCrossLineLabel.prototype, "fontStyle", 2);
__decorateClass([
  Validate(FONT_WEIGHT, { optional: true })
], PolarCrossLineLabel.prototype, "fontWeight", 2);
__decorateClass([
  Validate(POSITIVE_NUMBER)
], PolarCrossLineLabel.prototype, "fontSize", 2);
__decorateClass([
  Validate(STRING)
], PolarCrossLineLabel.prototype, "fontFamily", 2);
__decorateClass([
  Validate(NUMBER)
], PolarCrossLineLabel.prototype, "padding", 2);
__decorateClass([
  Validate(COLOR_STRING, { optional: true })
], PolarCrossLineLabel.prototype, "color", 2);
__decorateClass([
  Validate(BOOLEAN, { optional: true })
], PolarCrossLineLabel.prototype, "parallel", 2);
var _PolarCrossLine = class _PolarCrossLine {
  constructor() {
    this.id = createId(this);
    this.enabled = void 0;
    this.type = void 0;
    this.range = void 0;
    this.value = void 0;
    this.fill = void 0;
    this.fillOpacity = void 0;
    this.stroke = void 0;
    this.strokeWidth = void 0;
    this.strokeOpacity = void 0;
    this.lineDash = void 0;
    this.shape = "polygon";
    this.label = new PolarCrossLineLabel();
    this.scale = void 0;
    this.clippedRange = [-Infinity, Infinity];
    this.gridLength = 0;
    this.sideFlag = -1;
    this.parallelFlipRotation = 0;
    this.regularFlipRotation = 0;
    this.direction = ChartAxisDirection.X;
    this.axisInnerRadius = 0;
    this.axisOuterRadius = 0;
    this.group = new Group({ name: `${this.id}`, layer: true, zIndex: _PolarCrossLine.LINE_LAYER_ZINDEX });
    this.labelGroup = new Group({ name: `${this.id}`, layer: true, zIndex: _PolarCrossLine.LABEL_LAYER_ZINDEX });
  }
  setSectorNodeProps(node) {
    var _a2, _b, _c;
    node.fill = this.fill;
    node.fillOpacity = (_a2 = this.fillOpacity) != null ? _a2 : 1;
    node.stroke = this.stroke;
    node.strokeOpacity = (_b = this.strokeOpacity) != null ? _b : 1;
    node.strokeWidth = (_c = this.strokeWidth) != null ? _c : 1;
    node.lineDash = this.lineDash;
  }
  setLabelNodeProps(node, x, y, baseline, rotation) {
    const { label } = this;
    node.x = x;
    node.y = y;
    node.text = label.text;
    node.textAlign = "center";
    node.textBaseline = baseline;
    node.rotation = rotation;
    node.rotationCenterX = x;
    node.rotationCenterY = y;
    node.fill = label.color;
    node.fontFamily = label.fontFamily;
    node.fontSize = label.fontSize;
    node.fontStyle = label.fontStyle;
    node.visible = true;
  }
  calculateLayout(_visible) {
    return;
  }
};
_PolarCrossLine.LINE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_LINE_ZINDEX;
_PolarCrossLine.RANGE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_RANGE_ZINDEX;
_PolarCrossLine.LABEL_LAYER_ZINDEX = Layers.SERIES_LABEL_ZINDEX;
__decorateClass([
  Validate(BOOLEAN, { optional: true })
], _PolarCrossLine.prototype, "enabled", 2);
__decorateClass([
  Validate(UNION(["range", "line"], "a crossLine type"), { optional: true })
], _PolarCrossLine.prototype, "type", 2);
__decorateClass([
  Validate(AND(MATCHING_CROSSLINE_TYPE("range"), ARRAY.restrict({ length: 2 })), {
    optional: true
  })
], _PolarCrossLine.prototype, "range", 2);
__decorateClass([
  Validate(MATCHING_CROSSLINE_TYPE("value"), { optional: true })
], _PolarCrossLine.prototype, "value", 2);
__decorateClass([
  Validate(COLOR_STRING, { optional: true })
], _PolarCrossLine.prototype, "fill", 2);
__decorateClass([
  Validate(RATIO, { optional: true })
], _PolarCrossLine.prototype, "fillOpacity", 2);
__decorateClass([
  Validate(COLOR_STRING, { optional: true })
], _PolarCrossLine.prototype, "stroke", 2);
__decorateClass([
  Validate(NUMBER, { optional: true })
], _PolarCrossLine.prototype, "strokeWidth", 2);
__decorateClass([
  Validate(RATIO, { optional: true })
], _PolarCrossLine.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate(LINE_DASH, { optional: true })
], _PolarCrossLine.prototype, "lineDash", 2);
var PolarCrossLine = _PolarCrossLine;

// packages/ag-charts-enterprise/src/axes/polar-crosslines/angleCrossLine.ts
var { ChartAxisDirection: ChartAxisDirection2, validateCrossLineValues } = import_ag_charts_community3._ModuleSupport;
var { Path, Sector, Text } = import_ag_charts_community3._Scene;
var { normalizeAngle360, isNumberEqual } = import_ag_charts_community3._Util;
var _AngleCrossLine = class _AngleCrossLine extends PolarCrossLine {
  constructor() {
    super();
    this.direction = ChartAxisDirection2.X;
    this.polygonNode = new Path();
    this.sectorNode = new Sector();
    this.lineNode = new Path();
    this.labelNode = new Text();
    this.group.append(this.polygonNode);
    this.group.append(this.sectorNode);
    this.group.append(this.lineNode);
    this.labelGroup.append(this.labelNode);
  }
  update(visible) {
    const { scale, shape, type, value, range: range2 } = this;
    if (!scale || !type || !validateCrossLineValues(type, value, range2, scale)) {
      this.group.visible = false;
      this.labelGroup.visible = false;
      return;
    }
    this.group.visible = visible;
    this.labelGroup.visible = visible;
    if (type === "line" && shape === "circle" && scale instanceof import_ag_charts_community3._Scale.BandScale) {
      this.type = "range";
      this.range = [value, value];
    }
    this.updateLineNode(visible);
    this.updatePolygonNode(visible);
    this.updateSectorNode(visible);
    this.updateLabelNode(visible);
  }
  updateLineNode(visible) {
    var _a2, _b;
    const { scale, type, value, lineNode: line } = this;
    let angle;
    if (!visible || type !== "line" || !scale || isNaN(angle = scale.convert(value))) {
      line.visible = false;
      return;
    }
    const { axisInnerRadius, axisOuterRadius } = this;
    line.visible = true;
    line.stroke = this.stroke;
    line.strokeOpacity = (_a2 = this.strokeOpacity) != null ? _a2 : 1;
    line.strokeWidth = (_b = this.strokeWidth) != null ? _b : 1;
    line.fill = void 0;
    line.lineDash = this.lineDash;
    const x = axisOuterRadius * Math.cos(angle);
    const y = axisOuterRadius * Math.sin(angle);
    const x0 = axisInnerRadius * Math.cos(angle);
    const y0 = axisInnerRadius * Math.sin(angle);
    line.path.clear({ trackChanges: true });
    line.path.moveTo(x0, y0);
    line.path.lineTo(x, y);
    this.group.zIndex = _AngleCrossLine.LINE_LAYER_ZINDEX;
  }
  updatePolygonNode(visible) {
    var _a2;
    const { polygonNode: polygon, range: range2, scale, shape, type } = this;
    let ticks;
    if (!visible || type !== "range" || shape !== "polygon" || !scale || !range2 || !(ticks = (_a2 = scale.ticks) == null ? void 0 : _a2.call(scale))) {
      polygon.visible = false;
      return;
    }
    const { axisInnerRadius, axisOuterRadius } = this;
    const startIndex = ticks.indexOf(range2[0]);
    const endIndex = ticks.indexOf(range2[1]);
    const stops = startIndex <= endIndex ? ticks.slice(startIndex, endIndex + 1) : ticks.slice(startIndex).concat(ticks.slice(0, endIndex + 1));
    const angles = stops.map((value) => scale.convert(value));
    polygon.visible = true;
    this.setSectorNodeProps(polygon);
    const { path } = polygon;
    path.clear({ trackChanges: true });
    angles.forEach((angle, index) => {
      const x = axisOuterRadius * Math.cos(angle);
      const y = axisOuterRadius * Math.sin(angle);
      if (index === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    });
    if (axisInnerRadius === 0) {
      path.lineTo(0, 0);
    } else {
      angles.slice().reverse().forEach((angle) => {
        const x = axisInnerRadius * Math.cos(angle);
        const y = axisInnerRadius * Math.sin(angle);
        path.lineTo(x, y);
      });
    }
    polygon.path.closePath();
    this.group.zIndex = _AngleCrossLine.RANGE_LAYER_ZINDEX;
  }
  updateSectorNode(visible) {
    var _a2;
    const { sectorNode: sector, range: range2, scale, shape, type } = this;
    if (!visible || type !== "range" || shape !== "circle" || !scale || !range2) {
      sector.visible = false;
      return;
    }
    const { axisInnerRadius, axisOuterRadius } = this;
    const angles = range2.map((value) => scale.convert(value));
    const step = (_a2 = scale.step) != null ? _a2 : 0;
    const padding = scale instanceof import_ag_charts_community3._Scale.BandScale ? step / 2 : 0;
    sector.visible = true;
    this.setSectorNodeProps(sector);
    sector.centerX = 0;
    sector.centerY = 0;
    sector.innerRadius = axisInnerRadius;
    sector.outerRadius = axisOuterRadius;
    sector.startAngle = angles[0] - padding;
    sector.endAngle = angles[1] + padding;
    this.group.zIndex = _AngleCrossLine.RANGE_LAYER_ZINDEX;
  }
  updateLabelNode(visible) {
    var _a2, _b;
    const { label, labelNode: node, range: range2, scale, type } = this;
    if (!visible || label.enabled === false || !label.text || !scale || type === "range" && !range2) {
      node.visible = true;
      return;
    }
    const { axisInnerRadius, axisOuterRadius } = this;
    let labelX;
    let labelY;
    let rotation;
    let textBaseline;
    if (type === "line") {
      const angle = normalizeAngle360(scale.convert(this.value));
      const angle270 = 3 * Math.PI / 2;
      const isRightSide = isNumberEqual(angle, angle270) || angle > angle270 || angle < Math.PI / 2;
      const midX = (axisInnerRadius + axisOuterRadius) / 2 * Math.cos(angle);
      const midY = (axisInnerRadius + axisOuterRadius) / 2 * Math.sin(angle);
      labelX = midX + label.padding * Math.cos(angle + Math.PI / 2);
      labelY = midY + label.padding * Math.sin(angle + Math.PI / 2);
      textBaseline = isRightSide ? "top" : "bottom";
      rotation = isRightSide ? angle : angle - Math.PI;
    } else {
      const [startAngle, endAngle] = range2.map((value) => normalizeAngle360(scale.convert(value)));
      let angle = (startAngle + endAngle) / 2;
      if (startAngle > endAngle) {
        angle -= Math.PI;
      }
      angle = normalizeAngle360(angle);
      const isBottomSide = (isNumberEqual(angle, 0) || angle > 0) && angle < Math.PI;
      let distance;
      const ticks = (_b = (_a2 = scale.ticks) == null ? void 0 : _a2.call(scale)) != null ? _b : [];
      if (this.shape === "circle" || ticks.length < 3) {
        distance = axisOuterRadius - label.padding;
      } else {
        distance = axisOuterRadius * Math.cos(Math.PI / ticks.length) - label.padding;
      }
      labelX = distance * Math.cos(angle);
      labelY = distance * Math.sin(angle);
      textBaseline = isBottomSide ? "bottom" : "top";
      rotation = isBottomSide ? angle - Math.PI / 2 : angle + Math.PI / 2;
    }
    this.setLabelNodeProps(node, labelX, labelY, textBaseline, rotation);
  }
};
_AngleCrossLine.className = "AngleCrossLine";
var AngleCrossLine = _AngleCrossLine;

// packages/ag-charts-enterprise/src/axes/angle/angleAxis.ts
var {
  AND: AND2,
  assignJsonApplyConstructedArray,
  ChartAxisDirection: ChartAxisDirection3,
  GREATER_THAN,
  NUMBER: NUMBER2,
  UNION: UNION2,
  ProxyOnWrite,
  Validate: Validate2
} = import_ag_charts_community4._ModuleSupport;
var { Path: Path2, Text: Text2 } = import_ag_charts_community4._Scene;
var { angleBetween, isNumberEqual: isNumberEqual2, toRadians, normalizeAngle360: normalizeAngle3602 } = import_ag_charts_community4._Util;
var AngleAxisLabel = class extends import_ag_charts_community4._ModuleSupport.AxisLabel {
  constructor() {
    super(...arguments);
    this.orientation = "fixed";
  }
};
__decorateClass([
  Validate2(UNION2(["fixed", "parallel", "perpendicular"], "a label orientation"))
], AngleAxisLabel.prototype, "orientation", 2);
var AngleAxis = class extends import_ag_charts_community4._ModuleSupport.PolarAxis {
  constructor(moduleCtx, scale) {
    super(moduleCtx, scale);
    this.startAngle = 0;
    this.endAngle = void 0;
    this.labelData = [];
    this.tickData = [];
    this.radiusLine = this.axisGroup.appendChild(new Path2());
    this.computeRange = () => {
      const startAngle = normalizeAngle3602(-Math.PI / 2 + toRadians(this.startAngle));
      let endAngle = this.endAngle == null ? startAngle + Math.PI * 2 : -Math.PI / 2 + toRadians(this.endAngle);
      if (endAngle < startAngle) {
        endAngle += 2 * Math.PI;
      }
      this.range = [startAngle, endAngle];
    };
    this.includeInvisibleDomains = true;
  }
  get direction() {
    return ChartAxisDirection3.X;
  }
  assignCrossLineArrayConstructor(crossLines) {
    assignJsonApplyConstructedArray(crossLines, AngleCrossLine);
  }
  createLabel() {
    return new AngleAxisLabel();
  }
  update() {
    this.updateScale();
    this.updatePosition();
    this.updateGridLines();
    this.updateTickLines();
    this.updateLabels();
    this.updateRadiusLine();
    this.updateCrossLines();
    return this.tickData.length;
  }
  calculateAvailableRange() {
    const { range: range2, gridLength: radius } = this;
    return angleBetween(range2[0], range2[1]) * radius;
  }
  updatePosition() {
    const { translation, axisGroup, gridGroup, crossLineGroup } = this;
    const translationX = Math.floor(translation.x);
    const translationY = Math.floor(translation.y);
    axisGroup.translationX = translationX;
    axisGroup.translationY = translationY;
    gridGroup.translationX = translationX;
    gridGroup.translationY = translationY;
    crossLineGroup.translationX = translationX;
    crossLineGroup.translationY = translationY;
  }
  updateRadiusLine() {
    const node = this.radiusLine;
    const { path } = node;
    path.clear({ trackChanges: true });
    const { points, closePath } = this.getAxisLinePoints();
    points.forEach(({ x, y, moveTo, arc, radius = 0, startAngle = 0, endAngle = 0 }) => {
      if (arc) {
        path.arc(x, y, radius, startAngle, endAngle);
      } else if (moveTo) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    });
    if (closePath) {
      path.closePath();
    }
    node.visible = this.line.enabled;
    node.stroke = this.line.color;
    node.strokeWidth = this.line.width;
    node.fill = void 0;
  }
  getAxisLinePoints() {
    var _a2, _b;
    const { scale, shape, gridLength: radius } = this;
    const [startAngle, endAngle] = this.range;
    const isFullCircle = isNumberEqual2(endAngle - startAngle, 2 * Math.PI);
    const points = [];
    if (shape === "circle") {
      if (isFullCircle) {
        points.push({ x: radius, y: 0, moveTo: true });
        points.push({
          x: 0,
          y: 0,
          radius,
          startAngle: 0,
          endAngle: 2 * Math.PI,
          arc: true,
          moveTo: false
        });
      } else {
        points.push({
          x: radius * Math.cos(startAngle),
          y: radius * Math.sin(startAngle),
          moveTo: true
        });
        points.push({
          x: 0,
          y: 0,
          radius,
          startAngle: normalizeAngle3602(startAngle),
          endAngle: normalizeAngle3602(endAngle),
          arc: true,
          moveTo: false
        });
      }
    } else if (shape === "polygon") {
      const angles = ((_b = (_a2 = scale.ticks) == null ? void 0 : _a2.call(scale)) != null ? _b : []).map((value) => scale.convert(value));
      if (angles.length > 2) {
        angles.forEach((angle, i) => {
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          const moveTo = i === 0;
          points.push({ x, y, moveTo });
        });
      }
    }
    return { points, closePath: isFullCircle };
  }
  updateGridLines() {
    const {
      scale,
      gridLength: radius,
      gridLine: { enabled, style, width },
      innerRadiusRatio
    } = this;
    if (!(style && radius > 0)) {
      return;
    }
    const ticks = this.tickData;
    const innerRadius = radius * innerRadiusRatio;
    const styleCount = style.length;
    const idFn = (datum) => datum.value;
    this.gridLineGroupSelection.update(enabled ? ticks : [], void 0, idFn).each((line, datum, index) => {
      const { value } = datum;
      const { stroke, lineDash } = style[index % styleCount];
      const angle = scale.convert(value);
      line.x1 = innerRadius * Math.cos(angle);
      line.y1 = innerRadius * Math.sin(angle);
      line.x2 = radius * Math.cos(angle);
      line.y2 = radius * Math.sin(angle);
      line.stroke = stroke;
      line.strokeWidth = width;
      line.lineDash = lineDash;
      line.fill = void 0;
    });
    this.gridLineGroupSelection.cleanup();
  }
  updateLabels() {
    const { label, tickLabelGroupSelection } = this;
    const ticks = this.tickData;
    tickLabelGroupSelection.update(label.enabled ? ticks : []).each((node, _, index) => {
      const labelDatum = this.labelData[index];
      if (!labelDatum || labelDatum.hidden) {
        node.visible = false;
        return;
      }
      node.text = labelDatum.text;
      node.setFont(label);
      node.fill = label.color;
      node.x = labelDatum.x;
      node.y = labelDatum.y;
      node.textAlign = labelDatum.textAlign;
      node.textBaseline = labelDatum.textBaseline;
      node.visible = true;
      if (labelDatum.rotation) {
        node.rotation = labelDatum.rotation;
        node.rotationCenterX = labelDatum.x;
        node.rotationCenterY = labelDatum.y;
      } else {
        node.rotation = 0;
      }
    });
  }
  updateTickLines() {
    const { scale, gridLength: radius, tick, tickLineGroupSelection } = this;
    const ticks = this.tickData;
    tickLineGroupSelection.update(tick.enabled ? ticks : []).each((line, datum) => {
      const { value } = datum;
      const angle = scale.convert(value);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      line.x1 = radius * cos;
      line.y1 = radius * sin;
      line.x2 = (radius + tick.size) * cos;
      line.y2 = (radius + tick.size) * sin;
      line.stroke = tick.color;
      line.strokeWidth = tick.width;
    });
  }
  createLabelNodeData(ticks, options, seriesRect) {
    const { label, gridLength: radius, scale, tick } = this;
    if (!label.enabled) {
      return [];
    }
    const tempText2 = new Text2();
    const seriesLeft = seriesRect.x - this.translation.x;
    const seriesRight = seriesRect.x + seriesRect.width - this.translation.x;
    const labelData = ticks.map((datum, index) => {
      var _a2;
      const { value } = datum;
      const distance = radius + label.padding + tick.size;
      const angle = scale.convert(value);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = distance * cos;
      const y = distance * sin;
      const { textAlign, textBaseline } = this.getLabelAlign(angle);
      const isLastTickOverFirst = index === ticks.length - 1 && value !== ticks[0] && isNumberEqual2(normalizeAngle3602(angle), normalizeAngle3602(scale.convert(ticks[0])));
      const rotation = this.getLabelRotation(angle);
      let text = String(value);
      if (label.formatter) {
        const { callbackCache } = this.moduleCtx;
        text = (_a2 = callbackCache.call(label.formatter, { value, index })) != null ? _a2 : "";
      }
      tempText2.text = text;
      tempText2.x = x;
      tempText2.y = y;
      tempText2.setFont(label);
      tempText2.textAlign = textAlign;
      tempText2.textBaseline = textBaseline;
      tempText2.rotation = rotation;
      if (rotation) {
        tempText2.rotationCenterX = x;
        tempText2.rotationCenterY = y;
      }
      let box = rotation ? tempText2.computeTransformedBBox() : tempText2.computeBBox();
      if (box && options.hideWhenNecessary && !rotation) {
        const overflowLeft = seriesLeft - box.x;
        const overflowRight = box.x + box.width - seriesRight;
        const pixelError = 1;
        if (overflowLeft > pixelError || overflowRight > pixelError) {
          const availWidth = box.width - Math.max(overflowLeft, overflowRight);
          ({ text } = Text2.wrap(text, availWidth, Infinity, label, "never"));
          if (text === "\u2026") {
            text = "";
            box = void 0;
          }
          tempText2.text = text;
          box = tempText2.computeBBox();
        }
      }
      return {
        text,
        x,
        y,
        textAlign,
        textBaseline,
        hidden: text === "" || datum.hidden || isLastTickOverFirst,
        rotation,
        box
      };
    });
    if (label.avoidCollisions) {
      this.avoidLabelCollisions(labelData);
    }
    return labelData;
  }
  computeLabelsBBox(options, seriesRect) {
    this.tickData = this.generateAngleTicks();
    this.labelData = this.createLabelNodeData(this.tickData, options, seriesRect);
    const textBoxes = this.labelData.map(({ box }) => box).filter((box) => box != null);
    if (!this.label.enabled || textBoxes.length === 0) {
      return null;
    }
    return import_ag_charts_community4._Scene.BBox.merge(textBoxes);
  }
  getLabelOrientation() {
    const { label } = this;
    return label instanceof AngleAxisLabel ? label.orientation : "fixed";
  }
  getLabelRotation(tickAngle) {
    var _a2;
    let rotation = toRadians((_a2 = this.label.rotation) != null ? _a2 : 0);
    tickAngle = normalizeAngle3602(tickAngle);
    const orientation = this.getLabelOrientation();
    if (orientation === "parallel") {
      rotation += tickAngle;
      if (tickAngle >= 0 && tickAngle < Math.PI) {
        rotation -= Math.PI / 2;
      } else {
        rotation += Math.PI / 2;
      }
    } else if (orientation === "perpendicular") {
      rotation += tickAngle;
      if (tickAngle >= Math.PI / 2 && tickAngle < 3 * Math.PI / 2) {
        rotation += Math.PI;
      }
    }
    return rotation;
  }
  getLabelAlign(tickAngle) {
    const cos = Math.cos(tickAngle);
    const sin = Math.sin(tickAngle);
    let textAlign;
    let textBaseline;
    const orientation = this.getLabelOrientation();
    const isCos0 = isNumberEqual2(cos, 0);
    const isSin0 = isNumberEqual2(sin, 0);
    const isCos1 = isNumberEqual2(cos, 1);
    const isSinMinus1 = isNumberEqual2(sin, -1);
    const isCosPositive = cos > 0 && !isCos0;
    const isSinPositive = sin > 0 && !isSin0;
    if (orientation === "parallel") {
      textAlign = "center";
      textBaseline = isCos1 && isSin0 || isSinPositive ? "top" : "bottom";
    } else if (orientation === "perpendicular") {
      textAlign = isSinMinus1 || isCosPositive ? "left" : "right";
      textBaseline = "middle";
    } else {
      textAlign = "right";
      if (isCos0) {
        textAlign = "center";
      } else if (isCosPositive) {
        textAlign = "left";
      }
      textBaseline = "bottom";
      if (isSin0) {
        textBaseline = "middle";
      } else if (isSinPositive) {
        textBaseline = "top";
      }
    }
    return { textAlign, textBaseline };
  }
  updateCrossLines() {
    var _a2;
    (_a2 = this.crossLines) == null ? void 0 : _a2.forEach((crossLine) => {
      if (crossLine instanceof AngleCrossLine) {
        const { shape, gridLength: radius, innerRadiusRatio } = this;
        crossLine.shape = shape;
        crossLine.axisOuterRadius = radius;
        crossLine.axisInnerRadius = radius * innerRadiusRatio;
      }
    });
    super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0 });
  }
};
__decorateClass([
  ProxyOnWrite("rotation"),
  Validate2(NUMBER2.restrict({ min: 0, max: 360 }))
], AngleAxis.prototype, "startAngle", 2);
__decorateClass([
  Validate2(AND2(NUMBER2.restrict({ min: 0, max: 720 }), GREATER_THAN("startAngle")), { optional: true })
], AngleAxis.prototype, "endAngle", 2);

// packages/ag-charts-enterprise/src/axes/angle-category/angleCategoryAxis.ts
var { RATIO: RATIO2, Validate: Validate3 } = import_ag_charts_community5._ModuleSupport;
var { BandScale } = import_ag_charts_community5._Scale;
var { isNumberEqual: isNumberEqual3 } = import_ag_charts_community5._Util;
var AngleCategoryAxis = class extends AngleAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new BandScale());
    this.groupPaddingInner = 0;
    this.paddingInner = 0;
  }
  generateAngleTicks() {
    var _a2, _b;
    const { scale, tick, gridLength: radius } = this;
    const ticks = (_b = (_a2 = tick.values) != null ? _a2 : scale.ticks()) != null ? _b : [];
    if (ticks.length < 2 || isNaN(tick.minSpacing)) {
      return ticks.map((value) => {
        return { value, visible: true };
      });
    }
    const startTick = ticks[0];
    const startAngle = scale.convert(startTick);
    const startX = radius * Math.cos(startAngle);
    const startY = radius * Math.sin(startAngle);
    for (let step = 1; step < ticks.length - 1; step++) {
      const nextTick = ticks[step];
      const nextAngle = scale.convert(nextTick);
      if (nextAngle - startAngle > Math.PI) {
        break;
      }
      const nextX = radius * Math.cos(nextAngle);
      const nextY = radius * Math.sin(nextAngle);
      const spacing = Math.sqrt(__pow(nextX - startX, 2) + __pow(nextY - startY, 2));
      if (spacing > tick.minSpacing) {
        const visibleTicks = /* @__PURE__ */ new Set([startTick]);
        loopSymmetrically(ticks, step, (_, next) => {
          visibleTicks.add(next);
        });
        return ticks.map((value) => {
          const visible = visibleTicks.has(value);
          return { value, visible };
        });
      }
    }
    return [{ value: startTick, visible: true }];
  }
  avoidLabelCollisions(labelData) {
    let { minSpacing } = this.label;
    if (!Number.isFinite(minSpacing)) {
      minSpacing = 0;
    }
    if (labelData.length < 3) {
      return;
    }
    const labelsCollide = (prev, next) => {
      if (prev.hidden || next.hidden) {
        return false;
      }
      const prevBox = prev.box.clone().grow(minSpacing / 2);
      const nextBox = next.box.clone().grow(minSpacing / 2);
      return prevBox.collidesBBox(nextBox);
    };
    const firstLabel = labelData[0];
    const lastLabel = labelData.at(-1);
    const visibleLabels = /* @__PURE__ */ new Set([firstLabel]);
    const lastLabelIsOverFirst = isNumberEqual3(firstLabel.x, lastLabel.x) && isNumberEqual3(firstLabel.y, lastLabel.y);
    const maxStep = Math.floor(labelData.length / 2);
    for (let step = 1; step <= maxStep; step++) {
      const labels = lastLabelIsOverFirst ? labelData.slice(0, -1) : labelData;
      const collisionDetected = loopSymmetrically(labels, step, labelsCollide);
      if (!collisionDetected) {
        loopSymmetrically(labels, step, (_, next) => {
          visibleLabels.add(next);
        });
        break;
      }
    }
    labelData.forEach((datum) => {
      if (!visibleLabels.has(datum)) {
        datum.hidden = true;
        datum.box = void 0;
      }
    });
  }
};
AngleCategoryAxis.className = "AngleCategoryAxis";
AngleCategoryAxis.type = "angle-category";
__decorateClass([
  Validate3(RATIO2)
], AngleCategoryAxis.prototype, "groupPaddingInner", 2);
__decorateClass([
  Validate3(RATIO2)
], AngleCategoryAxis.prototype, "paddingInner", 2);

// packages/ag-charts-enterprise/src/axes/angle-category/angleCategoryAxisModule.ts
var AngleCategoryAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "angle-category",
  instanceConstructor: AngleCategoryAxis,
  themeTemplate: ANGLE_AXIS_THEME
};

// packages/ag-charts-enterprise/src/axes/angle-number/angleNumberAxis.ts
var import_ag_charts_community7 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/axes/angle-number/linearAngleScale.ts
var import_ag_charts_community6 = require("ag-charts-community");
var { LinearScale, Invalidating } = import_ag_charts_community6._Scale;
var { isNumberEqual: isNumberEqual4, range, isDenseInterval } = import_ag_charts_community6._Util;
var LinearAngleScale = class extends LinearScale {
  constructor() {
    super(...arguments);
    this.arcLength = 0;
    this.niceTickStep = 0;
  }
  ticks() {
    if (!this.domain || this.domain.length < 2 || this.domain.some((d) => !isFinite(d))) {
      return [];
    }
    this.refresh();
    const [d0, d1] = this.getDomain();
    const { interval } = this;
    if (interval) {
      const step2 = Math.abs(interval);
      const availableRange = this.getPixelRange();
      if (!isDenseInterval({ start: d0, stop: d1, interval: step2, availableRange })) {
        return range(d0, d1, step2);
      }
    }
    const step = this.nice && this.niceTickStep ? this.niceTickStep : this.getTickStep(d0, d1);
    return range(d0, d1, step);
  }
  hasNiceRange() {
    const sortedRange = this.range.slice().sort((a, b) => a - b);
    const niceRanges = [Math.PI, 2 * Math.PI];
    return niceRanges.some((r) => isNumberEqual4(r, sortedRange[1] - sortedRange[0]));
  }
  getNiceStepAndTickCount() {
    const [start, stop] = this.niceDomain;
    let step = this.getTickStep(start, stop);
    const maxTickCount = isNaN(this.maxTickCount) ? Infinity : this.maxTickCount;
    const expectedTickCount = Math.abs(stop - start) / step;
    let niceTickCount = Math.pow(2, Math.ceil(Math.log(expectedTickCount) / Math.log(2)));
    if (niceTickCount > maxTickCount) {
      niceTickCount /= 2;
      step *= 2;
    }
    return {
      count: niceTickCount,
      step
    };
  }
  updateNiceDomain() {
    super.updateNiceDomain();
    if (!this.hasNiceRange()) {
      return;
    }
    const reversed = this.niceDomain[0] > this.niceDomain[1];
    const start = reversed ? this.niceDomain[1] : this.niceDomain[0];
    const { step, count } = this.getNiceStepAndTickCount();
    const s = 1 / step;
    const stop = step >= 1 ? Math.ceil(start / step + count) * step : Math.ceil((start + count * step) * s) / s;
    this.niceDomain = reversed ? [stop, start] : [start, stop];
    this.niceTickStep = step;
  }
  getPixelRange() {
    return this.arcLength;
  }
};
__decorateClass([
  Invalidating
], LinearAngleScale.prototype, "arcLength", 2);

// packages/ag-charts-enterprise/src/axes/angle-number/angleNumberAxis.ts
var { AND: AND3, Default, GREATER_THAN: GREATER_THAN2, LESS_THAN, NUMBER_OR_NAN, MIN_SPACING, Validate: Validate4 } = import_ag_charts_community7._ModuleSupport;
var { angleBetween: angleBetween2, isNumberEqual: isNumberEqual5, normalisedExtentWithMetadata } = import_ag_charts_community7._Util;
var AngleNumberAxisTick = class extends import_ag_charts_community7._ModuleSupport.AxisTick {
  constructor() {
    super(...arguments);
    this.maxSpacing = NaN;
  }
};
__decorateClass([
  Validate4(MIN_SPACING),
  Default(NaN)
], AngleNumberAxisTick.prototype, "maxSpacing", 2);
var AngleNumberAxis = class extends AngleAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new LinearAngleScale());
    this.shape = "circle";
    this.min = NaN;
    this.max = NaN;
  }
  normaliseDataDomain(d) {
    const { min, max } = this;
    const { extent: extent6, clipped } = normalisedExtentWithMetadata(d, min, max);
    return { domain: extent6, clipped };
  }
  createTick() {
    return new AngleNumberAxisTick();
  }
  getRangeArcLength() {
    const { range: requestedRange } = this;
    const min = Math.min(...requestedRange);
    const max = Math.max(...requestedRange);
    const rotation = angleBetween2(min, max) || 2 * Math.PI;
    const radius = this.gridLength;
    return rotation * radius;
  }
  generateAngleTicks() {
    var _a2;
    const arcLength = this.getRangeArcLength();
    const { scale, tick, range: requestedRange } = this;
    const { minSpacing = NaN, maxSpacing = NaN } = tick;
    const minTicksCount = maxSpacing ? Math.floor(arcLength / maxSpacing) : 1;
    const maxTicksCount = minSpacing ? Math.floor(arcLength / minSpacing) : Infinity;
    const preferredTicksCount = Math.floor(4 / Math.PI * Math.abs(requestedRange[0] - requestedRange[1]));
    scale.tickCount = Math.max(minTicksCount, Math.min(maxTicksCount, preferredTicksCount));
    scale.minTickCount = minTicksCount;
    scale.maxTickCount = maxTicksCount;
    scale.arcLength = arcLength;
    const ticks = (_a2 = tick.values) != null ? _a2 : scale.ticks();
    return ticks.map((value) => {
      return { value, visible: true };
    });
  }
  avoidLabelCollisions(labelData) {
    let { minSpacing } = this.label;
    if (!Number.isFinite(minSpacing)) {
      minSpacing = 0;
    }
    const labelsCollide = (prev, next) => {
      if (prev.hidden || next.hidden) {
        return false;
      }
      const prevBox = prev.box.clone().grow(minSpacing / 2);
      const nextBox = next.box.clone().grow(minSpacing / 2);
      return prevBox.collidesBBox(nextBox);
    };
    const firstLabel = labelData[0];
    const lastLabel = labelData.at(-1);
    if (firstLabel !== lastLabel && isNumberEqual5(firstLabel.x, lastLabel.x) && isNumberEqual5(firstLabel.y, lastLabel.y)) {
      lastLabel.hidden = true;
    }
    for (let step = 1; step < labelData.length; step *= 2) {
      let collisionDetected = false;
      for (let i = step; i < labelData.length; i += step) {
        const next = labelData[i];
        const prev = labelData[i - step];
        if (labelsCollide(prev, next)) {
          collisionDetected = true;
          break;
        }
      }
      if (!collisionDetected) {
        labelData.forEach((datum, i) => {
          if (i % step > 0) {
            datum.hidden = true;
            datum.box = void 0;
          }
        });
        return;
      }
    }
    labelData.forEach((datum, i) => {
      if (i > 0) {
        datum.hidden = true;
        datum.box = void 0;
      }
    });
  }
};
AngleNumberAxis.className = "AngleNumberAxis";
AngleNumberAxis.type = "angle-number";
__decorateClass([
  Validate4(AND3(NUMBER_OR_NAN, LESS_THAN("max"))),
  Default(NaN)
], AngleNumberAxis.prototype, "min", 2);
__decorateClass([
  Validate4(AND3(NUMBER_OR_NAN, GREATER_THAN2("min"))),
  Default(NaN)
], AngleNumberAxis.prototype, "max", 2);

// packages/ag-charts-enterprise/src/axes/angle-number/angleNumberAxisModule.ts
var AngleNumberAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "angle-number",
  instanceConstructor: AngleNumberAxis,
  themeTemplate: ANGLE_AXIS_THEME
};

// packages/ag-charts-enterprise/src/axes/ordinal/ordinalTimeAxis.ts
var import_ag_charts_community8 = require("ag-charts-community");
var { OrdinalTimeScale } = import_ag_charts_community8._Scene;
var { dateToNumber } = import_ag_charts_community8._ModuleSupport;
var OrdinalTimeAxis = class extends import_ag_charts_community8._ModuleSupport.CategoryAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new OrdinalTimeScale());
  }
  normaliseDataDomain(d) {
    const domain = [];
    const uniqueValues = /* @__PURE__ */ new Set();
    for (let v of d) {
      if (typeof v === "number") {
        v = new Date(v);
      }
      const key = dateToNumber(v);
      if (!uniqueValues.has(key)) {
        uniqueValues.add(key);
        domain.push(v);
      }
    }
    domain.sort((a, b) => dateToNumber(a) - dateToNumber(b));
    return { domain, clipped: false };
  }
  onLabelFormatChange(ticks, format) {
    if (format) {
      super.onLabelFormatChange(ticks, format);
    } else {
      this.labelFormatter = this.scale.tickFormat({ ticks });
    }
  }
};
OrdinalTimeAxis.className = "OrdinalTimeAxis";
OrdinalTimeAxis.type = "ordinal-time";

// packages/ag-charts-enterprise/src/axes/ordinal/ordinalTimeAxisThemes.ts
var import_ag_charts_community9 = require("ag-charts-community");
var ORDINAL_TIME_AXIS_THEME = {
  __extends__: import_ag_charts_community9._Theme.EXTENDS_AXES_DEFAULTS,
  groupPaddingInner: 0,
  label: {
    autoRotate: false
  },
  gridLine: {
    __extends__: import_ag_charts_community9._Theme.EXTENDS_AXES_GRID_LINE_DEFAULTS,
    enabled: false
  }
};

// packages/ag-charts-enterprise/src/axes/ordinal/ordinalTimeAxisModule.ts
var OrdinalTimeAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  hidden: true,
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "ordinal-time",
  instanceConstructor: OrdinalTimeAxis,
  themeTemplate: ORDINAL_TIME_AXIS_THEME
};

// packages/ag-charts-enterprise/src/axes/radius/radiusAxisThemes.ts
var import_ag_charts_community10 = require("ag-charts-community");
var RADIUS_AXIS_THEME = {
  __extends__: import_ag_charts_community10._Theme.EXTENDS_AXES_DEFAULTS,
  line: {
    enabled: false,
    __extends__: import_ag_charts_community10._Theme.EXTENDS_AXES_LINE_DEFAULTS
  },
  tick: {
    enabled: false,
    __extends__: import_ag_charts_community10._Theme.EXTENDS_AXES_TICK_DEFAULTS
  }
};

// packages/ag-charts-enterprise/src/axes/radius-category/radiusCategoryAxis.ts
var import_ag_charts_community13 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/axes/radius/radiusAxis.ts
var import_ag_charts_community12 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/axes/polar-crosslines/radiusCrossLine.ts
var import_ag_charts_community11 = require("ag-charts-community");
var { ChartAxisDirection: ChartAxisDirection4, Validate: Validate5, DEGREE, validateCrossLineValues: validateCrossLineValues2 } = import_ag_charts_community11._ModuleSupport;
var { Path: Path3, Sector: Sector2, Text: Text3 } = import_ag_charts_community11._Scene;
var { normalizeAngle360: normalizeAngle3603, toRadians: toRadians2, isNumberEqual: isNumberEqual6 } = import_ag_charts_community11._Util;
var RadiusCrossLineLabel = class extends PolarCrossLineLabel {
  constructor() {
    super(...arguments);
    this.positionAngle = void 0;
  }
};
__decorateClass([
  Validate5(DEGREE, { optional: true })
], RadiusCrossLineLabel.prototype, "positionAngle", 2);
var _RadiusCrossLine = class _RadiusCrossLine extends PolarCrossLine {
  constructor() {
    super();
    this.direction = ChartAxisDirection4.Y;
    this.label = new RadiusCrossLineLabel();
    this.polygonNode = new Path3();
    this.sectorNode = new Sector2();
    this.labelNode = new Text3();
    this.outerRadius = 0;
    this.innerRadius = 0;
    this.group.append(this.polygonNode);
    this.group.append(this.sectorNode);
    this.labelGroup.append(this.labelNode);
  }
  update(visible) {
    const { scale, type, value, range: range2 } = this;
    if (!scale || !type || !validateCrossLineValues2(type, value, range2, scale)) {
      this.group.visible = false;
      this.labelGroup.visible = false;
      return;
    }
    if (type === "line" && scale instanceof import_ag_charts_community11._Scale.BandScale) {
      this.type = "range";
      this.range = [value, value];
    }
    this.updateRadii();
    const { innerRadius, outerRadius } = this;
    visible && (visible = innerRadius >= this.axisInnerRadius && outerRadius <= this.axisOuterRadius);
    this.group.visible = visible;
    this.labelGroup.visible = visible;
    this.updatePolygonNode(visible);
    this.updateSectorNode(visible);
    this.updateLabelNode(visible);
    this.group.zIndex = this.type === "line" ? _RadiusCrossLine.LINE_LAYER_ZINDEX : _RadiusCrossLine.RANGE_LAYER_ZINDEX;
  }
  updateRadii() {
    var _a2;
    const { range: range2, scale, type, axisInnerRadius, axisOuterRadius } = this;
    if (!scale)
      return { innerRadius: 0, outerRadius: 0 };
    const getRadius = (value) => axisOuterRadius + axisInnerRadius - value;
    let outerRadius = 0;
    let innerRadius = 0;
    if (type === "line") {
      outerRadius = getRadius(scale.convert(this.value));
      innerRadius = outerRadius;
    } else {
      const bandwidth = Math.abs((_a2 = scale == null ? void 0 : scale.bandwidth) != null ? _a2 : 0);
      const convertedRange = range2.map((r) => scale.convert(r));
      outerRadius = getRadius(Math.max(...convertedRange));
      innerRadius = getRadius(Math.min(...convertedRange)) + bandwidth;
    }
    this.outerRadius = outerRadius;
    this.innerRadius = innerRadius;
  }
  drawPolygon(radius, angles, polygon) {
    angles.forEach((angle, index) => {
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (index === 0) {
        polygon.path.moveTo(x, y);
      } else {
        polygon.path.lineTo(x, y);
      }
    });
    polygon.path.closePath();
  }
  updatePolygonNode(visible) {
    const { gridAngles, polygonNode: polygon, scale, shape, type, innerRadius, outerRadius } = this;
    if (!visible || shape !== "polygon" || !scale || !gridAngles) {
      polygon.visible = false;
      return;
    }
    polygon.visible = true;
    const padding = this.getPadding();
    polygon.path.clear({ trackChanges: true });
    this.drawPolygon(outerRadius - padding, gridAngles, polygon);
    const reversedAngles = gridAngles.slice().reverse();
    const innerPolygonRadius = type === "line" ? outerRadius - padding : innerRadius + padding;
    this.drawPolygon(innerPolygonRadius, reversedAngles, polygon);
    this.setSectorNodeProps(polygon);
  }
  updateSectorNode(visible) {
    const { axisInnerRadius, axisOuterRadius, scale, sectorNode: sector, shape, innerRadius, outerRadius } = this;
    if (!visible || shape !== "circle" || !scale) {
      sector.visible = false;
      return;
    }
    sector.visible = true;
    sector.startAngle = 0;
    sector.endAngle = 2 * Math.PI;
    const padding = this.getPadding();
    sector.innerRadius = import_ag_charts_community11._Util.clamp(axisInnerRadius, innerRadius + padding, axisOuterRadius);
    sector.outerRadius = import_ag_charts_community11._Util.clamp(axisInnerRadius, outerRadius - padding, axisOuterRadius);
    this.setSectorNodeProps(sector);
  }
  updateLabelNode(visible) {
    var _a2, _b;
    const { innerRadius, label, labelNode: node, scale, shape, type } = this;
    if (!visible || label.enabled === false || !label.text || !scale) {
      node.visible = false;
      return;
    }
    const angle = normalizeAngle3603(toRadians2(((_a2 = label.positionAngle) != null ? _a2 : 0) - 90));
    const isBottomSide = (isNumberEqual6(angle, 0) || angle > 0) && angle < Math.PI;
    const rotation = isBottomSide ? angle - Math.PI / 2 : angle + Math.PI / 2;
    let distance = 0;
    const angles = (_b = this.gridAngles) != null ? _b : [];
    if (type === "line") {
      distance = innerRadius + label.padding;
    } else if (shape === "circle" || angles.length < 3) {
      distance = innerRadius - label.padding;
    } else {
      distance = innerRadius * Math.cos(Math.PI / angles.length) - label.padding;
    }
    const labelX = distance * Math.cos(angle);
    const labelY = distance * Math.sin(angle);
    let textBaseline;
    if (type === "line") {
      textBaseline = isBottomSide ? "top" : "bottom";
    } else {
      textBaseline = isBottomSide ? "bottom" : "top";
    }
    this.setLabelNodeProps(node, labelX, labelY, textBaseline, rotation);
  }
  getPadding() {
    var _a2, _b;
    const { scale } = this;
    if (!scale)
      return 0;
    const bandwidth = Math.abs((_a2 = scale.bandwidth) != null ? _a2 : 0);
    const step = Math.abs((_b = scale.step) != null ? _b : 0);
    return scale instanceof import_ag_charts_community11._Scale.BandScale ? (step - bandwidth) / 2 : 0;
  }
};
_RadiusCrossLine.className = "RadiusCrossLine";
var RadiusCrossLine = _RadiusCrossLine;

// packages/ag-charts-enterprise/src/axes/radius/radiusAxis.ts
var { assignJsonApplyConstructedArray: assignJsonApplyConstructedArray2, ChartAxisDirection: ChartAxisDirection5, Default: Default2, Layers: Layers2, DEGREE: DEGREE2, MIN_SPACING: MIN_SPACING2, BOOLEAN: BOOLEAN2, Validate: Validate6 } = import_ag_charts_community12._ModuleSupport;
var { Caption, Group: Group2, Path: Path4, Selection } = import_ag_charts_community12._Scene;
var { isNumberEqual: isNumberEqual7, normalizeAngle360: normalizeAngle3604, toRadians: toRadians3 } = import_ag_charts_community12._Util;
var RadiusAxisTick = class extends import_ag_charts_community12._ModuleSupport.AxisTick {
  constructor() {
    super(...arguments);
    this.maxSpacing = NaN;
  }
};
__decorateClass([
  Validate6(MIN_SPACING2),
  Default2(NaN)
], RadiusAxisTick.prototype, "maxSpacing", 2);
var RadiusAxisLabel = class extends import_ag_charts_community12._ModuleSupport.AxisLabel {
  constructor() {
    super(...arguments);
    this.autoRotateAngle = 335;
  }
};
__decorateClass([
  Validate6(BOOLEAN2, { optional: true })
], RadiusAxisLabel.prototype, "autoRotate", 2);
__decorateClass([
  Validate6(DEGREE2)
], RadiusAxisLabel.prototype, "autoRotateAngle", 2);
var RadiusAxis = class extends import_ag_charts_community12._ModuleSupport.PolarAxis {
  constructor(moduleCtx, scale) {
    super(moduleCtx, scale);
    this.positionAngle = 0;
    this.gridPathGroup = this.gridGroup.appendChild(
      new Group2({
        name: `${this.id}-gridPaths`,
        zIndex: Layers2.AXIS_GRID_ZINDEX
      })
    );
    this.gridPathSelection = Selection.select(this.gridPathGroup, Path4);
  }
  get direction() {
    return ChartAxisDirection5.Y;
  }
  assignCrossLineArrayConstructor(crossLines) {
    assignJsonApplyConstructedArray2(crossLines, RadiusCrossLine);
  }
  getAxisTransform() {
    const maxRadius = this.scale.range[0];
    const { translation, positionAngle, innerRadiusRatio } = this;
    const innerRadius = maxRadius * innerRadiusRatio;
    const rotation = toRadians3(positionAngle);
    return {
      translationX: translation.x,
      translationY: translation.y - maxRadius - innerRadius,
      rotation,
      rotationCenterX: 0,
      rotationCenterY: maxRadius + innerRadius
    };
  }
  updateSelections(lineData, data, params) {
    var _a2;
    super.updateSelections(lineData, data, params);
    const {
      gridLine: { enabled, style, width },
      shape
    } = this;
    if (!style) {
      return;
    }
    const ticks = this.prepareTickData(data);
    const styleCount = style.length;
    const setStyle = (node, index) => {
      const { stroke, lineDash } = style[index % styleCount];
      node.stroke = stroke;
      node.strokeWidth = width;
      node.lineDash = lineDash;
      node.fill = void 0;
    };
    const [startAngle, endAngle] = (_a2 = this.gridRange) != null ? _a2 : [0, 2 * Math.PI];
    const isFullCircle = isNumberEqual7(endAngle - startAngle, 2 * Math.PI);
    const drawCircleShape = (node, value) => {
      const { path } = node;
      path.clear({ trackChanges: true });
      const radius = this.getTickRadius(value);
      if (isFullCircle) {
        path.moveTo(radius, 0);
        path.arc(0, 0, radius, 0, 2 * Math.PI);
      } else {
        path.moveTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
        path.arc(0, 0, radius, normalizeAngle3604(startAngle), normalizeAngle3604(endAngle));
      }
      if (isFullCircle) {
        path.closePath();
      }
    };
    const drawPolygonShape = (node, value) => {
      const { path } = node;
      const angles = this.gridAngles;
      path.clear({ trackChanges: true });
      if (!angles || angles.length < 3) {
        return;
      }
      const radius = this.getTickRadius(value);
      angles.forEach((angle, idx) => {
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (idx === 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
        angles.forEach((innerAngle, innerIdx) => {
          const x2 = radius * Math.cos(innerAngle);
          const y2 = radius * Math.sin(innerAngle);
          if (innerIdx === 0) {
            path.moveTo(x2, y2);
          } else {
            path.lineTo(x2, y2);
          }
        });
        path.closePath();
      });
      path.closePath();
    };
    this.gridPathSelection.update(enabled ? ticks : []).each((node, value, index) => {
      setStyle(node, index);
      if (shape === "circle") {
        drawCircleShape(node, value);
      } else {
        drawPolygonShape(node, value);
      }
    });
  }
  updateTitle() {
    var _a2;
    const identityFormatter = (params) => params.defaultValue;
    const {
      title,
      _titleCaption,
      range: requestedRange,
      moduleCtx: { callbackCache }
    } = this;
    const { formatter = identityFormatter } = (_a2 = this.title) != null ? _a2 : {};
    if (!title) {
      _titleCaption.enabled = false;
      return;
    }
    _titleCaption.enabled = title.enabled;
    _titleCaption.fontFamily = title.fontFamily;
    _titleCaption.fontSize = title.fontSize;
    _titleCaption.fontStyle = title.fontStyle;
    _titleCaption.fontWeight = title.fontWeight;
    _titleCaption.color = title.color;
    _titleCaption.wrapping = title.wrapping;
    let titleVisible = false;
    const titleNode = _titleCaption.node;
    if (title.enabled) {
      titleVisible = true;
      titleNode.rotation = Math.PI / 2;
      titleNode.x = Math.floor((requestedRange[0] + requestedRange[1]) / 2);
      titleNode.y = -Caption.SMALL_PADDING;
      titleNode.textAlign = "center";
      titleNode.textBaseline = "bottom";
      titleNode.text = callbackCache.call(formatter, this.getTitleFormatterParams());
    }
    titleNode.visible = titleVisible;
  }
  createTick() {
    return new RadiusAxisTick();
  }
  updateCrossLines() {
    var _a2;
    (_a2 = this.crossLines) == null ? void 0 : _a2.forEach((crossLine) => {
      if (crossLine instanceof RadiusCrossLine) {
        const { shape, gridAngles, range: range2, innerRadiusRatio } = this;
        const radius = range2[0];
        crossLine.shape = shape;
        crossLine.gridAngles = gridAngles;
        crossLine.axisOuterRadius = radius;
        crossLine.axisInnerRadius = radius * innerRadiusRatio;
      }
    });
    super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0 });
  }
  createLabel() {
    return new RadiusAxisLabel();
  }
};
__decorateClass([
  Validate6(DEGREE2),
  Default2(0)
], RadiusAxis.prototype, "positionAngle", 2);

// packages/ag-charts-enterprise/src/axes/radius-category/radiusCategoryAxis.ts
var { RATIO: RATIO3, ProxyPropertyOnWrite, Validate: Validate7 } = import_ag_charts_community13._ModuleSupport;
var { BandScale: BandScale2 } = import_ag_charts_community13._Scale;
var RadiusCategoryAxis = class extends RadiusAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new BandScale2());
    this.shape = "circle";
    this.groupPaddingInner = 0;
    this.paddingInner = 0;
    this.paddingOuter = 0;
  }
  prepareTickData(data) {
    return data.slice().reverse();
  }
  getTickRadius(tickDatum) {
    const { scale } = this;
    const maxRadius = scale.range[0];
    const minRadius = maxRadius * this.innerRadiusRatio;
    const tickRange = (maxRadius - minRadius) / scale.domain.length;
    return maxRadius - tickDatum.translationY + minRadius - tickRange / 2;
  }
};
RadiusCategoryAxis.className = "RadiusCategoryAxis";
RadiusCategoryAxis.type = "radius-category";
__decorateClass([
  Validate7(RATIO3)
], RadiusCategoryAxis.prototype, "groupPaddingInner", 2);
__decorateClass([
  ProxyPropertyOnWrite("scale", "paddingInner"),
  Validate7(RATIO3)
], RadiusCategoryAxis.prototype, "paddingInner", 2);
__decorateClass([
  ProxyPropertyOnWrite("scale", "paddingOuter"),
  Validate7(RATIO3)
], RadiusCategoryAxis.prototype, "paddingOuter", 2);

// packages/ag-charts-enterprise/src/axes/radius-category/radiusCategoryAxisModule.ts
var RadiusCategoryAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radius-category",
  instanceConstructor: RadiusCategoryAxis,
  themeTemplate: RADIUS_AXIS_THEME
};

// packages/ag-charts-enterprise/src/axes/radius-number/radiusNumberAxis.ts
var import_ag_charts_community14 = require("ag-charts-community");
var { AND: AND4, Default: Default3, GREATER_THAN: GREATER_THAN3, LESS_THAN: LESS_THAN2, NUMBER_OR_NAN: NUMBER_OR_NAN2, Validate: Validate8 } = import_ag_charts_community14._ModuleSupport;
var { LinearScale: LinearScale2 } = import_ag_charts_community14._Scale;
var { normalisedExtentWithMetadata: normalisedExtentWithMetadata2 } = import_ag_charts_community14._Util;
var RadiusNumberAxis = class extends RadiusAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new LinearScale2());
    this.shape = "polygon";
    this.min = NaN;
    this.max = NaN;
  }
  prepareTickData(data) {
    var _a2;
    const { scale } = this;
    const domainTop = (_a2 = scale.getDomain) == null ? void 0 : _a2.call(scale)[1];
    return data.filter(({ tick }) => tick !== domainTop).sort((a, b) => b.tick - a.tick);
  }
  getTickRadius(tickDatum) {
    const { scale } = this;
    const maxRadius = scale.range[0];
    const minRadius = maxRadius * this.innerRadiusRatio;
    return maxRadius - tickDatum.translationY + minRadius;
  }
  normaliseDataDomain(d) {
    const { min, max } = this;
    const { extent: extent6, clipped } = normalisedExtentWithMetadata2(d, min, max);
    return { domain: extent6, clipped };
  }
};
RadiusNumberAxis.className = "RadiusNumberAxis";
RadiusNumberAxis.type = "radius-number";
__decorateClass([
  Validate8(AND4(NUMBER_OR_NAN2, LESS_THAN2("max"))),
  Default3(NaN)
], RadiusNumberAxis.prototype, "min", 2);
__decorateClass([
  Validate8(AND4(NUMBER_OR_NAN2, GREATER_THAN3("min"))),
  Default3(NaN)
], RadiusNumberAxis.prototype, "max", 2);

// packages/ag-charts-enterprise/src/axes/radius-number/radiusNumberAxisModule.ts
var RadiusNumberAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radius-number",
  instanceConstructor: RadiusNumberAxis,
  themeTemplate: RADIUS_AXIS_THEME
};

// packages/ag-charts-enterprise/src/features/animation/animation.ts
var import_ag_charts_community15 = require("ag-charts-community");
var { BOOLEAN: BOOLEAN3, POSITIVE_NUMBER: POSITIVE_NUMBER2, ObserveChanges, Validate: Validate9 } = import_ag_charts_community15._ModuleSupport;
var Animation = class extends import_ag_charts_community15._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = true;
    ctx.animationManager.skip(false);
  }
};
__decorateClass([
  ObserveChanges((target, newValue) => {
    target.ctx.animationManager.skip(!newValue);
  }),
  Validate9(BOOLEAN3)
], Animation.prototype, "enabled", 2);
__decorateClass([
  ObserveChanges((target, newValue) => {
    target.ctx.animationManager.defaultDuration = newValue;
  }),
  Validate9(POSITIVE_NUMBER2, { optional: true })
], Animation.prototype, "duration", 2);

// packages/ag-charts-enterprise/src/features/animation/animationModule.ts
var AnimationModule = {
  type: "root",
  optionsKey: "animation",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy", "topology"],
  instanceConstructor: Animation,
  themeTemplate: {
    animation: {
      enabled: true
    }
  }
};

// packages/ag-charts-enterprise/src/features/background/background.ts
var import_ag_charts_community17 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/background/backgroundImage.ts
var import_ag_charts_community16 = require("ag-charts-community");
var { Image } = import_ag_charts_community16._Scene;
var {
  BaseProperties,
  ObserveChanges: ObserveChanges2,
  ProxyProperty,
  Validate: Validate10,
  NUMBER: NUMBER3,
  POSITIVE_NUMBER: POSITIVE_NUMBER3,
  RATIO: RATIO4,
  createElement,
  calculatePlacement
} = import_ag_charts_community16._ModuleSupport;
var BackgroundImage = class extends BaseProperties {
  constructor() {
    super();
    this.opacity = 1;
    this.loadedSynchronously = true;
    this.containerWidth = 0;
    this.containerHeight = 0;
    this.onLoad = void 0;
    this.onImageLoad = () => {
      var _a2;
      if (this.loadedSynchronously) {
        return;
      }
      this.node.visible = false;
      this.performLayout(this.containerWidth, this.containerHeight);
      (_a2 = this.onLoad) == null ? void 0 : _a2.call(this);
    };
    this.imageElement = createElement("img");
    this.imageElement.onload = this.onImageLoad;
    this.node = new Image(this.imageElement);
  }
  get complete() {
    return this.imageElement.width > 0 && this.imageElement.height > 0;
  }
  performLayout(containerWidth, containerHeight) {
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
    this.node.setProperties(
      this.complete ? __spreadValues({
        visible: true,
        opacity: this.opacity
      }, calculatePlacement(
        this.imageElement.width,
        this.imageElement.height,
        this.containerWidth,
        this.containerHeight,
        this
      )) : { visible: false }
    );
  }
};
__decorateClass([
  Validate10(NUMBER3, { optional: true })
], BackgroundImage.prototype, "top", 2);
__decorateClass([
  Validate10(NUMBER3, { optional: true })
], BackgroundImage.prototype, "right", 2);
__decorateClass([
  Validate10(NUMBER3, { optional: true })
], BackgroundImage.prototype, "bottom", 2);
__decorateClass([
  Validate10(NUMBER3, { optional: true })
], BackgroundImage.prototype, "left", 2);
__decorateClass([
  Validate10(POSITIVE_NUMBER3, { optional: true })
], BackgroundImage.prototype, "width", 2);
__decorateClass([
  Validate10(POSITIVE_NUMBER3, { optional: true })
], BackgroundImage.prototype, "height", 2);
__decorateClass([
  Validate10(RATIO4)
], BackgroundImage.prototype, "opacity", 2);
__decorateClass([
  ProxyProperty("imageElement.src"),
  ObserveChanges2((target) => target.loadedSynchronously = target.complete)
], BackgroundImage.prototype, "url", 2);

// packages/ag-charts-enterprise/src/features/background/background.ts
var { ActionOnSet, OBJECT, Validate: Validate11 } = import_ag_charts_community17._ModuleSupport;
var Background = class extends import_ag_charts_community17._ModuleSupport.Background {
  constructor(ctx) {
    super(ctx);
    this.ctx = ctx;
    this.image = new BackgroundImage();
  }
  onLayoutComplete(event) {
    super.onLayoutComplete(event);
    if (this.image) {
      const { width, height } = event.chart;
      this.image.performLayout(width, height);
    }
  }
  onImageLoad() {
    this.ctx.updateService.update(import_ag_charts_community17._ModuleSupport.ChartUpdateType.SCENE_RENDER);
  }
};
__decorateClass([
  Validate11(OBJECT, { optional: true }),
  ActionOnSet({
    newValue(image) {
      this.node.appendChild(image.node);
      image.onLoad = () => this.onImageLoad();
    },
    oldValue(image) {
      this.node.removeChild(image.node);
      image.onLoad = void 0;
    }
  })
], Background.prototype, "image", 2);

// packages/ag-charts-enterprise/src/features/background/backgroundModule.ts
var BackgroundModule = {
  type: "root",
  optionsKey: "background",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy", "topology"],
  instanceConstructor: Background
};

// packages/ag-charts-enterprise/src/features/context-menu/contextMenuModule.ts
var import_ag_charts_community19 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/context-menu/contextMenu.ts
var import_ag_charts_community18 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/context-menu/contextMenuStyles.ts
var DEFAULT_CONTEXT_MENU_CLASS = "ag-chart-context-menu";
var DEFAULT_CONTEXT_MENU_DARK_CLASS = `ag-charts-dark-context-menu`;
var defaultContextMenuCss = `
.${DEFAULT_CONTEXT_MENU_CLASS} {
    background: rgb(248, 248, 248);
    border: 1px solid #babfc7;
    border-radius: 5px;
    box-shadow: 0 1px 4px 1px rgba(186, 191, 199, 0.4);
    color: rgb(24, 29, 31);
    font: 13px Verdana, sans-serif;
    position: fixed;
    transition: transform 0.1s ease;
    white-space: nowrap;
    z-index: 99999;
}

.${DEFAULT_CONTEXT_MENU_CLASS}.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    color: white;
    background: #15181c;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__cover {
    position: fixed;
    left: 0px;
    top: 0px;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__menu {
    display: flex;
    flex-direction: column;
    padding: 0.5em 0;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item {
    background: none;
    border: none;
    box-sizing: border-box;
    font: inherit;
    padding: 0.5em 1em;
    text-align: left;
    -webkit-appearance: none;
    -moz-appearance: none;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    color: white;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item:hover {
    background: rgb(33, 150, 243, 0.1);
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item:hover.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    background: rgb(33, 150, 243, 0.1);
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item:active {
    background: rgb(33, 150, 243, 0.2);
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item:active.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    background: rgb(33, 150, 243, 0.1);
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item[disabled] {
    border: none;
    opacity: 0.5;
    text-align: left;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item[disabled]:hover {
    background: inherit;
    cursor: inherit;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__divider {
    margin: 5px 0;
    background: #babfc7;
    height: 1px;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__divider.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    background: rgb(33, 150, 243, 0.1);
}
`;

// packages/ag-charts-enterprise/src/features/context-menu/contextMenu.ts
var { BOOLEAN: BOOLEAN4, Validate: Validate12, createElement: createElement2, getDocument, getWindow, injectStyle } = import_ag_charts_community18._ModuleSupport;
var ContextMenu = class extends import_ag_charts_community18._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = true;
    this.darkTheme = false;
    /**
     * Extra menu actions with a label and callback.
     */
    this.extraActions = [];
    /**
     * Extra menu actions that only appear when clicking on a node.
     */
    this.extraNodeActions = [];
    this.x = 0;
    this.y = 0;
    this.highlightManager = ctx.highlightManager;
    this.interactionManager = ctx.interactionManager;
    this.registry = ctx.contextMenuRegistry;
    this.scene = ctx.scene;
    const { Default: Default5, ContextMenu: ContextMenuState, All } = import_ag_charts_community18._ModuleSupport.InteractionState;
    const contextState = Default5 | ContextMenuState;
    this.destroyFns.push(
      ctx.interactionManager.addListener("contextmenu", (event) => this.onContextMenu(event), contextState),
      ctx.interactionManager.addListener("click", () => this.onClick(), All)
    );
    this.groups = { default: [], node: [], extra: [], extraNode: [] };
    this.canvasElement = ctx.scene.canvas.element;
    this.container = getDocument().body;
    this.element = this.container.appendChild(createElement2("div"));
    this.element.classList.add(DEFAULT_CONTEXT_MENU_CLASS);
    this.element.addEventListener("contextmenu", (event) => event.preventDefault());
    this.destroyFns.push(() => {
      var _a2;
      return (_a2 = this.element.parentNode) == null ? void 0 : _a2.removeChild(this.element);
    });
    this.hide();
    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === this.canvasElement && entry.intersectionRatio === 0) {
              this.hide();
            }
          }
        },
        { root: this.container }
      );
      observer.observe(this.canvasElement);
      this.intersectionObserver = observer;
    }
    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(() => {
        if (this.menuElement && this.element.contains(this.menuElement)) {
          this.reposition();
        }
      });
      observer.observe(this.element, { childList: true });
      this.mutationObserver = observer;
    }
    injectStyle(defaultContextMenuCss, "contextMenu");
    this.registry.registerDefaultAction({
      id: "download",
      label: "Download",
      action: () => {
        const title = ctx.chartService.title;
        let fileName = "image";
        if ((title == null ? void 0 : title.enabled) && (title == null ? void 0 : title.text) !== void 0) {
          fileName = title.text;
        }
        this.scene.download(fileName);
      }
    });
  }
  isShown() {
    return this.menuElement !== void 0;
  }
  onClick() {
    if (this.isShown()) {
      this.hide();
    }
  }
  onContextMenu(event) {
    if (!this.enabled)
      return;
    this.showEvent = event.sourceEvent;
    this.x = event.pageX;
    this.y = event.pageY;
    this.groups.default = this.registry.copyDefaultActions();
    this.pickedNode = this.highlightManager.getActivePicked();
    if (this.extraActions.length > 0) {
      this.groups.extra = [...this.extraActions];
    }
    if (this.extraNodeActions.length > 0 && this.pickedNode) {
      this.groups.extraNode = [...this.extraNodeActions];
    }
    const { default: def, node, extra, extraNode } = this.groups;
    const groupCount = def.length + node.length + extra.length + extraNode.length;
    if (groupCount === 0)
      return;
    event.consume();
    event.sourceEvent.preventDefault();
    this.show();
  }
  show() {
    this.interactionManager.pushState(import_ag_charts_community18._ModuleSupport.InteractionState.ContextMenu);
    this.element.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    const newMenuElement = this.renderMenu();
    if (this.menuElement) {
      this.element.replaceChild(newMenuElement, this.menuElement);
    } else {
      this.element.appendChild(newMenuElement);
    }
    this.menuElement = newMenuElement;
    this.element.style.display = "block";
  }
  hide() {
    this.interactionManager.popState(import_ag_charts_community18._ModuleSupport.InteractionState.ContextMenu);
    if (this.menuElement) {
      this.element.removeChild(this.menuElement);
      this.menuElement = void 0;
    }
    this.element.style.display = "none";
  }
  renderMenu() {
    const menuElement = createElement2("div");
    menuElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
    menuElement.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    this.appendMenuGroup(menuElement, this.groups.default, false);
    if (this.pickedNode) {
      this.appendMenuGroup(menuElement, this.groups.node);
    }
    this.appendMenuGroup(menuElement, this.groups.extra);
    if (this.pickedNode) {
      this.appendMenuGroup(menuElement, this.groups.extraNode);
    }
    return menuElement;
  }
  appendMenuGroup(menuElement, group, divider = true) {
    if (group.length === 0)
      return;
    if (divider)
      menuElement.appendChild(this.createDividerElement());
    group.forEach((i) => {
      const item = this.renderItem(i);
      if (item)
        menuElement.appendChild(item);
    });
  }
  renderItem(item) {
    if (item && typeof item === "object" && item.constructor === Object) {
      return this.createActionElement(item);
    }
  }
  createDividerElement() {
    const el = createElement2("div");
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
    el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    return el;
  }
  createActionElement({ id, label, action }) {
    if (id && this.registry.isDisabled(id)) {
      return this.createDisabledElement(label);
    }
    return this.createButtonElement(label, action);
  }
  createButtonElement(label, callback) {
    const el = createElement2("button");
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
    el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    el.innerHTML = label;
    el.onclick = () => {
      var _a2;
      const event = (_a2 = this.pickedNode) == null ? void 0 : _a2.series.createNodeContextMenuActionEvent(this.showEvent, this.pickedNode);
      if (event) {
        Object.defineProperty(event, "itemId", {
          enumerable: false,
          get: () => {
            var _a3;
            import_ag_charts_community18._Util.Logger.warnOnce(
              `Property [AgNodeContextMenuActionEvent.itemId] is deprecated. Use [yKey], [angleKey] and others instead.`
            );
            return (_a3 = this.pickedNode) == null ? void 0 : _a3.itemId;
          }
        });
        callback(event);
      } else {
        callback({ event: this.showEvent });
      }
      this.hide();
    };
    return el;
  }
  createDisabledElement(label) {
    const el = createElement2("button");
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
    el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    el.disabled = true;
    el.innerHTML = label;
    return el;
  }
  reposition() {
    const { x, y } = this;
    this.element.style.top = "unset";
    this.element.style.bottom = "unset";
    this.element.style.left = "unset";
    this.element.style.right = "unset";
    if (x + this.element.offsetWidth > getWindow("innerWidth")) {
      this.element.style.right = `calc(100% - ${x - 1}px)`;
    } else {
      this.element.style.left = `${x + 1}px`;
    }
    if (y + this.element.offsetHeight > getWindow("innerHeight")) {
      this.element.style.bottom = `calc(100% - ${y}px - 0.5em)`;
    } else {
      this.element.style.top = `calc(${y}px - 0.5em)`;
    }
  }
  destroy() {
    var _a2, _b;
    super.destroy();
    (_a2 = this.intersectionObserver) == null ? void 0 : _a2.unobserve(this.canvasElement);
    (_b = this.mutationObserver) == null ? void 0 : _b.disconnect();
  }
};
__decorateClass([
  Validate12(BOOLEAN4)
], ContextMenu.prototype, "enabled", 2);
__decorateClass([
  Validate12(BOOLEAN4)
], ContextMenu.prototype, "darkTheme", 2);

// packages/ag-charts-enterprise/src/features/context-menu/contextMenuModule.ts
var ContextMenuModule = {
  type: "root",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy", "topology"],
  optionsKey: "contextMenu",
  instanceConstructor: ContextMenu,
  themeTemplate: {
    contextMenu: {
      enabled: true,
      darkTheme: import_ag_charts_community19._Theme.IS_DARK_THEME
    }
  }
};

// packages/ag-charts-enterprise/src/features/crosshair/crosshair.ts
var import_ag_charts_community21 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/crosshair/crosshairLabel.ts
var import_ag_charts_community20 = require("ag-charts-community");
var { ActionOnSet: ActionOnSet2, BaseProperties: BaseProperties2, BOOLEAN: BOOLEAN5, FUNCTION, NUMBER: NUMBER4, STRING: STRING2, Validate: Validate13, createElement: createElement3, injectStyle: injectStyle2 } = import_ag_charts_community20._ModuleSupport;
var { BBox } = import_ag_charts_community20._Scene;
var DEFAULT_LABEL_CLASS = "ag-crosshair-label";
var defaultLabelCss = `
.${DEFAULT_LABEL_CLASS} {
    position: absolute;
    left: 0px;
    top: 0px;
    user-select: none;
    pointer-events: none;
    font: 12px Verdana, sans-serif;
    overflow: hidden;
    white-space: nowrap;
    z-index: 99999;
    box-sizing: border-box;
}

.${DEFAULT_LABEL_CLASS}-content {
    padding: 0 7px;
    border-radius: 2px;
    line-height: 1.7em;
    background-color: rgb(71,71,71);
    color: rgb(255, 255, 255);
}

.${DEFAULT_LABEL_CLASS}-hidden {
    top: -10000px !important;
}
`;
var CrosshairLabelProperties = class extends import_ag_charts_community20._Scene.ChangeDetectableProperties {
  constructor() {
    super(...arguments);
    this.enabled = true;
    this.xOffset = 0;
    this.yOffset = 0;
    this.format = void 0;
    this.renderer = void 0;
  }
};
__decorateClass([
  Validate13(BOOLEAN5)
], CrosshairLabelProperties.prototype, "enabled", 2);
__decorateClass([
  Validate13(STRING2, { optional: true })
], CrosshairLabelProperties.prototype, "className", 2);
__decorateClass([
  Validate13(NUMBER4)
], CrosshairLabelProperties.prototype, "xOffset", 2);
__decorateClass([
  Validate13(NUMBER4)
], CrosshairLabelProperties.prototype, "yOffset", 2);
__decorateClass([
  Validate13(STRING2, { optional: true })
], CrosshairLabelProperties.prototype, "format", 2);
__decorateClass([
  Validate13(FUNCTION, { optional: true })
], CrosshairLabelProperties.prototype, "renderer", 2);
var CrosshairLabel = class extends BaseProperties2 {
  constructor(labelRoot) {
    super();
    this.labelRoot = labelRoot;
    this.enabled = true;
    this.xOffset = 0;
    this.yOffset = 0;
    this.renderer = void 0;
    this.element = createElement3("div");
    this.element.classList.add(DEFAULT_LABEL_CLASS);
    labelRoot.appendChild(this.element);
    injectStyle2(defaultLabelCss, "crosshairLabel");
  }
  show(meta) {
    const { element } = this;
    let left = meta.x + this.xOffset;
    let top = meta.y + this.yOffset;
    const limit = (low, actual, high) => {
      return Math.max(Math.min(actual, high), low);
    };
    const containerBounds = this.getContainerBoundingBox();
    const maxLeft = containerBounds.x + containerBounds.width - element.clientWidth - 1;
    const maxTop = containerBounds.y + containerBounds.height - element.clientHeight;
    left = limit(containerBounds.x + 1, left, maxLeft);
    top = limit(containerBounds.y, top, maxTop);
    element.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    this.toggle(true);
  }
  setLabelHtml(html) {
    if (html !== void 0) {
      this.element.innerHTML = html;
    }
  }
  computeBBox() {
    const { element } = this;
    return new import_ag_charts_community20._Scene.BBox(element.clientLeft, element.clientTop, element.clientWidth, element.clientHeight);
  }
  getContainerBoundingBox() {
    const { width, height } = this.labelRoot.getBoundingClientRect();
    return new BBox(0, 0, width, height);
  }
  toggle(visible) {
    this.element.classList.toggle(`${DEFAULT_LABEL_CLASS}-hidden`, !visible);
  }
  destroy() {
    const { parentNode } = this.element;
    if (parentNode) {
      parentNode.removeChild(this.element);
    }
  }
  toLabelHtml(input, defaults) {
    var _a2, _b;
    if (typeof input === "string") {
      return input;
    }
    defaults = defaults != null ? defaults : {};
    const {
      text = (_a2 = defaults.text) != null ? _a2 : "",
      color = defaults.color,
      backgroundColor = defaults.backgroundColor,
      opacity = (_b = defaults.opacity) != null ? _b : 1
    } = input;
    const style = `opacity: ${opacity}; background-color: ${backgroundColor == null ? void 0 : backgroundColor.toLowerCase()}; color: ${color}`;
    return `<div class="${DEFAULT_LABEL_CLASS}-content" style="${style}">
                    <span>${text}</span>
                </div>`;
  }
};
__decorateClass([
  Validate13(BOOLEAN5)
], CrosshairLabel.prototype, "enabled", 2);
__decorateClass([
  Validate13(STRING2, { optional: true }),
  ActionOnSet2({
    changeValue(newValue, oldValue) {
      if (newValue !== oldValue) {
        if (oldValue) {
          this.element.classList.remove(oldValue);
        }
        if (newValue) {
          this.element.classList.add(newValue);
        }
      }
    }
  })
], CrosshairLabel.prototype, "className", 2);
__decorateClass([
  Validate13(NUMBER4)
], CrosshairLabel.prototype, "xOffset", 2);
__decorateClass([
  Validate13(NUMBER4)
], CrosshairLabel.prototype, "yOffset", 2);
__decorateClass([
  Validate13(STRING2, { optional: true })
], CrosshairLabel.prototype, "format", 2);
__decorateClass([
  Validate13(FUNCTION, { optional: true })
], CrosshairLabel.prototype, "renderer", 2);

// packages/ag-charts-enterprise/src/features/crosshair/crosshair.ts
var { Group: Group3, Line, BBox: BBox2 } = import_ag_charts_community21._Scene;
var { createId: createId2 } = import_ag_charts_community21._Util;
var { POSITIVE_NUMBER: POSITIVE_NUMBER4, RATIO: RATIO5, BOOLEAN: BOOLEAN6, COLOR_STRING: COLOR_STRING2, LINE_DASH: LINE_DASH2, OBJECT: OBJECT2, Validate: Validate14, Layers: Layers3, getDocument: getDocument2 } = import_ag_charts_community21._ModuleSupport;
var Crosshair = class extends import_ag_charts_community21._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.id = createId2(this);
    this.enabled = false;
    this.stroke = "rgb(195, 195, 195)";
    this.lineDash = [6, 3];
    this.lineDashOffset = 0;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.snap = true;
    this.label = new CrosshairLabelProperties();
    this.seriesRect = new BBox2(0, 0, 0, 0);
    this.hoverRect = new BBox2(0, 0, 0, 0);
    this.bounds = new BBox2(0, 0, 0, 0);
    this.visible = false;
    this.crosshairGroup = new Group3({ layer: true, zIndex: Layers3.SERIES_CROSSHAIR_ZINDEX });
    this.lineGroup = this.crosshairGroup.appendChild(
      new Group3({
        name: `${this.id}-crosshair-lines`,
        zIndex: Layers3.SERIES_CROSSHAIR_ZINDEX
      })
    );
    this.lineGroupSelection = import_ag_charts_community21._Scene.Selection.select(this.lineGroup, Line, false);
    this.activeHighlight = void 0;
    this.axisCtx = ctx.parent;
    this.crosshairGroup.visible = false;
    this.labels = {};
    const region = ctx.regionManager.getRegion("series");
    this.destroyFns.push(
      ctx.scene.attachNode(this.crosshairGroup),
      region.addListener("hover", (event) => this.onMouseMove(event)),
      region.addListener("leave", () => this.onMouseOut()),
      ctx.highlightManager.addListener("highlight-change", (event) => this.onHighlightChange(event)),
      ctx.layoutService.addListener("layout-complete", (event) => this.layout(event)),
      () => Object.entries(this.labels).forEach(([_, label]) => label.destroy())
    );
  }
  layout({ series: { rect, paddedRect, visible }, axes }) {
    this.hideCrosshairs();
    if (!(visible && axes && this.enabled)) {
      this.visible = false;
      return;
    }
    this.visible = true;
    this.seriesRect = rect;
    this.hoverRect = paddedRect;
    const { position: axisPosition = "left", axisId } = this.axisCtx;
    const axisLayout = axes.find((a) => a.id === axisId);
    if (!axisLayout) {
      return;
    }
    this.axisLayout = axisLayout;
    const padding = axisLayout.gridPadding + axisLayout.seriesAreaPadding;
    this.bounds = this.buildBounds(rect, axisPosition, padding);
    const { crosshairGroup, bounds } = this;
    crosshairGroup.translationX = Math.round(bounds.x);
    crosshairGroup.translationY = Math.round(bounds.y);
    const crosshairKeys = ["pointer", ...this.axisCtx.seriesKeyProperties()];
    this.updateSelections(crosshairKeys);
    this.updateLines();
    this.updateLabels(crosshairKeys);
  }
  buildBounds(rect, axisPosition, padding) {
    const bounds = rect.clone();
    bounds.x += axisPosition === "left" ? -padding : 0;
    bounds.y += axisPosition === "top" ? -padding : 0;
    bounds.width += axisPosition === "left" || axisPosition === "right" ? padding : 0;
    bounds.height += axisPosition === "top" || axisPosition === "bottom" ? padding : 0;
    return bounds;
  }
  updateSelections(data) {
    this.lineGroupSelection.update(
      data,
      (group) => group.append(new Line()),
      (key) => key
    );
  }
  updateLabels(keys) {
    var _a2;
    const { labels, ctx, axisLayout } = this;
    keys.forEach((key) => {
      var _a3, _b;
      (_b = labels[key]) != null ? _b : labels[key] = new CrosshairLabel((_a3 = ctx.scene.canvas.container) != null ? _a3 : getDocument2().body);
      this.updateLabel(labels[key]);
    });
    const format = (_a2 = this.label.format) != null ? _a2 : axisLayout == null ? void 0 : axisLayout.label.format;
    this.labelFormatter = format ? this.axisCtx.scaleValueFormatter(format) : void 0;
  }
  updateLabel(label) {
    const { enabled, className, xOffset, yOffset, format, renderer } = this.label;
    label.enabled = enabled;
    label.className = className;
    label.xOffset = xOffset;
    label.yOffset = yOffset;
    label.format = format;
    label.renderer = renderer;
  }
  updateLines() {
    const { lineGroupSelection, bounds, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, axisLayout } = this;
    if (!axisLayout) {
      return;
    }
    const isVertical = this.isVertical();
    lineGroupSelection.each((line) => {
      line.stroke = stroke;
      line.strokeWidth = strokeWidth;
      line.strokeOpacity = strokeOpacity;
      line.lineDash = lineDash;
      line.lineDashOffset = lineDashOffset;
      line.y1 = 0;
      line.y2 = isVertical ? bounds.height : 0;
      line.x1 = 0;
      line.x2 = isVertical ? 0 : bounds.width;
    });
  }
  isVertical() {
    return this.axisCtx.direction === "x";
  }
  formatValue(val) {
    var _a2;
    const {
      labelFormatter,
      axisLayout,
      ctx: { callbackCache }
    } = this;
    if (labelFormatter) {
      const result = callbackCache.call(labelFormatter, val);
      if (result !== void 0)
        return result;
    }
    const isInteger = val % 1 === 0;
    const fractionDigits = ((_a2 = axisLayout == null ? void 0 : axisLayout.label.fractionDigits) != null ? _a2 : 0) + (isInteger ? 0 : 1);
    return typeof val === "number" ? val.toFixed(fractionDigits) : String(val);
  }
  onMouseMove(event) {
    if (!this.enabled || this.snap) {
      return;
    }
    const { crosshairGroup, hoverRect } = this;
    const { offsetX, offsetY } = event;
    if (this.visible && hoverRect.containsPoint(offsetX, offsetY)) {
      crosshairGroup.visible = true;
      const lineData = this.getData(event);
      this.updatePositions(lineData);
    } else {
      this.hideCrosshairs();
    }
  }
  onMouseOut() {
    this.hideCrosshairs();
  }
  onHighlightChange(event) {
    var _a2, _b, _c;
    if (!this.enabled) {
      return;
    }
    const { crosshairGroup, axisCtx } = this;
    const { datum, series } = (_a2 = event.currentHighlight) != null ? _a2 : {};
    const hasCrosshair = datum && (((_b = series == null ? void 0 : series.axes.x) == null ? void 0 : _b.id) === axisCtx.axisId || ((_c = series == null ? void 0 : series.axes.y) == null ? void 0 : _c.id) === axisCtx.axisId);
    this.activeHighlight = hasCrosshair ? event.currentHighlight : void 0;
    if (this.snap) {
      if (!this.visible || !this.activeHighlight) {
        this.hideCrosshairs();
        return;
      }
      const activeHighlightData = this.getActiveHighlightData(this.activeHighlight);
      this.updatePositions(activeHighlightData);
      crosshairGroup.visible = true;
    }
  }
  updatePositions(data) {
    const { seriesRect, lineGroupSelection } = this;
    lineGroupSelection.each((line, key) => {
      const lineData = data[key];
      if (!lineData) {
        line.visible = false;
        return;
      }
      line.visible = true;
      const { value, position } = lineData;
      let x = 0;
      let y = 0;
      if (this.isVertical()) {
        x = position;
        line.translationX = Math.round(x);
      } else {
        y = position;
        line.translationY = Math.round(y);
      }
      if (this.label.enabled) {
        this.showLabel(x + seriesRect.x, y + seriesRect.y, value, key);
      } else {
        this.hideLabel(key);
      }
    });
  }
  getData(event) {
    var _a2, _b;
    const { seriesRect, axisCtx } = this;
    const key = "pointer";
    const { datum, xKey = "", yKey = "" } = (_a2 = this.activeHighlight) != null ? _a2 : {};
    const { offsetX, offsetY } = event;
    const x = offsetX - seriesRect.x;
    const y = offsetY - seriesRect.y;
    const isVertical = this.isVertical();
    return {
      [key]: {
        position: isVertical ? x : y,
        value: axisCtx.continuous ? axisCtx.scaleInvert(isVertical ? x : y) : (_b = datum == null ? void 0 : datum[isVertical ? xKey : yKey]) != null ? _b : ""
      }
    };
  }
  getActiveHighlightData(activeHighlight) {
    var _a2, _b;
    const { axisCtx } = this;
    const { datum, series, xKey = "", aggregatedValue, cumulativeValue, midPoint } = activeHighlight;
    const seriesKeyProperties = series.getKeyProperties(axisCtx.direction);
    const halfBandwidth = axisCtx.scaleBandwidth() / 2;
    const matchingAxisId = ((_a2 = series.axes[axisCtx.direction]) == null ? void 0 : _a2.id) === axisCtx.axisId;
    const isYKey = seriesKeyProperties.indexOf("yKey") > -1 && matchingAxisId;
    const isXKey = seriesKeyProperties.indexOf("xKey") > -1 && matchingAxisId;
    if (isYKey && aggregatedValue !== void 0) {
      return {
        yKey: { value: aggregatedValue, position: axisCtx.scaleConvert(aggregatedValue) + halfBandwidth }
      };
    }
    if (isYKey && cumulativeValue !== void 0) {
      return {
        yKey: { value: cumulativeValue, position: axisCtx.scaleConvert(cumulativeValue) + halfBandwidth }
      };
    }
    if (isXKey) {
      const position = (_b = this.isVertical() ? midPoint == null ? void 0 : midPoint.x : midPoint == null ? void 0 : midPoint.y) != null ? _b : 0;
      return {
        xKey: {
          value: axisCtx.continuous ? axisCtx.scaleInvert(position) : datum[xKey],
          position
        }
      };
    }
    const activeHighlightData = {};
    seriesKeyProperties.forEach((key) => {
      const keyValue = series.properties[key];
      const value = datum[keyValue];
      const position = axisCtx.scaleConvert(value) + halfBandwidth;
      activeHighlightData[key] = { value, position };
    });
    return activeHighlightData;
  }
  getLabelHtml(value, label) {
    const {
      label: { renderer: labelRenderer },
      axisLayout: { label: { fractionDigits = 0 } = {} } = {}
    } = this;
    const defaults = {
      text: this.formatValue(value)
    };
    if (labelRenderer) {
      const params = {
        value,
        fractionDigits
      };
      return label.toLabelHtml(labelRenderer(params), defaults);
    }
    return label.toLabelHtml(defaults);
  }
  showLabel(x, y, value, key) {
    const { axisCtx, bounds, axisLayout } = this;
    if (!axisLayout) {
      return;
    }
    const {
      label: { padding: labelPadding },
      tickSize
    } = axisLayout;
    const padding = labelPadding + tickSize;
    const label = this.labels[key];
    const html = this.getLabelHtml(value, label);
    label.setLabelHtml(html);
    const labelBBox = label.computeBBox();
    let labelMeta;
    if (this.isVertical()) {
      const xOffset = -labelBBox.width / 2;
      const yOffset = axisCtx.position === "bottom" ? 0 : -labelBBox.height;
      const fixedY = axisCtx.position === "bottom" ? bounds.y + bounds.height + padding : bounds.y - padding;
      labelMeta = {
        x: x + xOffset,
        y: fixedY + yOffset
      };
    } else {
      const yOffset = -labelBBox.height / 2;
      const xOffset = axisCtx.position === "right" ? 0 : -labelBBox.width;
      const fixedX = axisCtx.position === "right" ? bounds.x + bounds.width + padding : bounds.x - padding;
      labelMeta = {
        x: fixedX + xOffset,
        y: y + yOffset
      };
    }
    label.show(labelMeta);
  }
  hideCrosshairs() {
    this.crosshairGroup.visible = false;
    for (const key in this.labels) {
      this.hideLabel(key);
    }
  }
  hideLabel(key) {
    this.labels[key].toggle(false);
  }
};
__decorateClass([
  Validate14(BOOLEAN6)
], Crosshair.prototype, "enabled", 2);
__decorateClass([
  Validate14(COLOR_STRING2, { optional: true })
], Crosshair.prototype, "stroke", 2);
__decorateClass([
  Validate14(LINE_DASH2, { optional: true })
], Crosshair.prototype, "lineDash", 2);
__decorateClass([
  Validate14(POSITIVE_NUMBER4)
], Crosshair.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate14(POSITIVE_NUMBER4)
], Crosshair.prototype, "strokeWidth", 2);
__decorateClass([
  Validate14(RATIO5)
], Crosshair.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate14(BOOLEAN6)
], Crosshair.prototype, "snap", 2);
__decorateClass([
  Validate14(OBJECT2)
], Crosshair.prototype, "label", 2);

// packages/ag-charts-enterprise/src/features/crosshair/crosshairTheme.ts
var import_ag_charts_community22 = require("ag-charts-community");
var AXIS_CROSSHAIR_THEME = {
  crosshair: {
    enabled: true,
    snap: true,
    stroke: import_ag_charts_community22._Theme.DEFAULT_MUTED_LABEL_COLOUR,
    strokeWidth: 1,
    strokeOpacity: 1,
    lineDash: [5, 6],
    lineDashOffset: 0,
    label: {
      enabled: true
    }
  },
  category: {
    crosshair: {
      enabled: false,
      snap: true,
      stroke: import_ag_charts_community22._Theme.DEFAULT_MUTED_LABEL_COLOUR,
      strokeWidth: 1,
      strokeOpacity: 1,
      lineDash: [5, 6],
      lineDashOffset: 0,
      label: {
        enabled: true
      }
    }
  }
};

// packages/ag-charts-enterprise/src/features/crosshair/crosshairModule.ts
var CrosshairModule = {
  type: "axis-option",
  optionsKey: "crosshair",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  axisTypes: ["category", "ordinal-time", "number", "log", "time"],
  instanceConstructor: Crosshair,
  themeTemplate: AXIS_CROSSHAIR_THEME
};

// packages/ag-charts-enterprise/src/features/data-source/dataSource.ts
var import_ag_charts_community23 = require("ag-charts-community");
var { BOOLEAN: BOOLEAN7, FUNCTION: FUNCTION2, ActionOnSet: ActionOnSet3, Validate: Validate15 } = import_ag_charts_community23._ModuleSupport;
var DataSource = class extends import_ag_charts_community23._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.enabled = false;
    this.getData = () => Promise.resolve();
    this.dataService = ctx.dataService;
  }
  updateCallback(enabled, getData) {
    if (!this.dataService)
      return;
    if (enabled && getData != null) {
      this.dataService.updateCallback(getData);
    } else {
      this.dataService.clearCallback();
    }
  }
};
__decorateClass([
  ActionOnSet3({
    newValue(enabled) {
      this.updateCallback(enabled, this.getData);
    }
  }),
  Validate15(BOOLEAN7)
], DataSource.prototype, "enabled", 2);
__decorateClass([
  ActionOnSet3({
    newValue(getData) {
      this.updateCallback(this.enabled, getData);
    }
  }),
  Validate15(FUNCTION2)
], DataSource.prototype, "getData", 2);
__decorateClass([
  ActionOnSet3({
    newValue(requestThrottle) {
      this.dataService.requestThrottle = requestThrottle;
    }
  })
], DataSource.prototype, "requestThrottle", 2);
__decorateClass([
  ActionOnSet3({
    newValue(updateThrottle) {
      this.dataService.dispatchThrottle = updateThrottle;
    }
  })
], DataSource.prototype, "updateThrottle", 2);
__decorateClass([
  ActionOnSet3({
    newValue(updateDuringInteraction) {
      this.dataService.dispatchOnlyLatest = !updateDuringInteraction;
    }
  })
], DataSource.prototype, "updateDuringInteraction", 2);

// packages/ag-charts-enterprise/src/features/data-source/dataSourceModule.ts
var DataSourceModule = {
  type: "root",
  optionsKey: "dataSource",
  packageType: "enterprise",
  chartTypes: ["cartesian", "hierarchy", "polar", "topology"],
  instanceConstructor: DataSource,
  themeTemplate: {
    dataSource: { enabled: false }
  }
};

// packages/ag-charts-enterprise/src/features/error-bar/errorBarModule.ts
var import_ag_charts_community28 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/error-bar/errorBar.ts
var import_ag_charts_community26 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/error-bar/errorBarNode.ts
var import_ag_charts_community24 = require("ag-charts-community");
var { partialAssign, mergeDefaults } = import_ag_charts_community24._ModuleSupport;
var { BBox: BBox3 } = import_ag_charts_community24._Scene;
var HierarchicalBBox = class {
  constructor(components) {
    this.components = components;
    this.union = BBox3.merge(components);
  }
  containsPoint(x, y) {
    if (!this.union.containsPoint(x, y)) {
      return false;
    }
    for (const bbox of this.components) {
      if (bbox.containsPoint(x, y)) {
        return true;
      }
    }
    return false;
  }
};
var ErrorBarNode = class extends import_ag_charts_community24._Scene.Group {
  constructor() {
    super();
    this.capLength = NaN;
    this._datum = void 0;
    this.whiskerPath = new import_ag_charts_community24._Scene.Path();
    this.capsPath = new import_ag_charts_community24._Scene.Path();
    this.bboxes = new HierarchicalBBox([]);
    this.append([this.whiskerPath, this.capsPath]);
  }
  get datum() {
    return this._datum;
  }
  set datum(datum) {
    this._datum = datum;
  }
  calculateCapLength(capsTheme, capDefaults) {
    const { lengthRatio = 1, length } = capsTheme;
    const { lengthRatioMultiplier, lengthMax } = capDefaults;
    const desiredLength = length != null ? length : lengthRatio * lengthRatioMultiplier;
    return Math.min(desiredLength, lengthMax);
  }
  getFormatterParams(formatters, highlighted) {
    const { datum } = this;
    if (datum === void 0 || formatters.formatter === void 0 && formatters.cap.formatter === void 0) {
      return;
    }
    const { xLowerKey, xLowerName, xUpperKey, xUpperName, yLowerKey, yLowerName, yUpperKey, yUpperName } = formatters;
    return {
      datum: datum.datum,
      seriesId: datum.datum.seriesId,
      xKey: datum.xKey,
      yKey: datum.yKey,
      xLowerKey,
      xLowerName,
      xUpperKey,
      xUpperName,
      yLowerKey,
      yLowerName,
      yUpperKey,
      yUpperName,
      highlighted
    };
  }
  formatStyles(style, formatters, highlighted) {
    let _a2 = style, { cap: capsStyle } = _a2, whiskerStyle = __objRest(_a2, ["cap"]);
    const params = this.getFormatterParams(formatters, highlighted);
    if (params !== void 0) {
      if (formatters.formatter !== void 0) {
        const result = formatters.formatter(params);
        whiskerStyle = mergeDefaults(result, whiskerStyle);
        capsStyle = mergeDefaults(result, capsStyle);
        capsStyle = mergeDefaults(result == null ? void 0 : result.cap, capsStyle);
      }
      if (formatters.cap.formatter !== void 0) {
        const result = formatters.cap.formatter(params);
        capsStyle = mergeDefaults(result, capsStyle);
      }
    }
    return { whiskerStyle, capsStyle };
  }
  applyStyling(target, source) {
    partialAssign(
      ["visible", "stroke", "strokeWidth", "strokeOpacity", "lineDash", "lineDashOffset"],
      target,
      source
    );
  }
  update(style, formatters, highlighted) {
    if (this.datum === void 0) {
      return;
    }
    const { whiskerStyle, capsStyle } = this.formatStyles(style, formatters, highlighted);
    const { xBar, yBar, capDefaults } = this.datum;
    const whisker = this.whiskerPath;
    this.applyStyling(whisker, whiskerStyle);
    whisker.path.clear();
    if (yBar !== void 0) {
      whisker.path.moveTo(yBar.lowerPoint.x, yBar.lowerPoint.y);
      whisker.path.lineTo(yBar.upperPoint.x, yBar.upperPoint.y);
    }
    if (xBar !== void 0) {
      whisker.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y);
      whisker.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y);
    }
    whisker.path.closePath();
    whisker.markDirtyTransform();
    this.capLength = this.calculateCapLength(capsStyle != null ? capsStyle : {}, capDefaults);
    const capOffset = this.capLength / 2;
    const caps = this.capsPath;
    this.applyStyling(caps, capsStyle);
    caps.path.clear();
    if (yBar !== void 0) {
      caps.path.moveTo(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y);
      caps.path.lineTo(yBar.lowerPoint.x + capOffset, yBar.lowerPoint.y);
      caps.path.moveTo(yBar.upperPoint.x - capOffset, yBar.upperPoint.y);
      caps.path.lineTo(yBar.upperPoint.x + capOffset, yBar.upperPoint.y);
    }
    if (xBar !== void 0) {
      caps.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset);
      caps.path.lineTo(xBar.lowerPoint.x, xBar.lowerPoint.y + capOffset);
      caps.path.moveTo(xBar.upperPoint.x, xBar.upperPoint.y - capOffset);
      caps.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y + capOffset);
    }
    caps.path.closePath();
    caps.markDirtyTransform();
  }
  updateBBoxes() {
    var _a2;
    const { capLength, whiskerPath: whisker, capsPath: caps } = this;
    const { yBar, xBar } = (_a2 = this.datum) != null ? _a2 : {};
    const capOffset = capLength / 2;
    const components = [];
    if (yBar !== void 0) {
      const whiskerHeight = yBar.lowerPoint.y - yBar.upperPoint.y;
      components.push(
        new BBox3(yBar.lowerPoint.x, yBar.upperPoint.y, whisker.strokeWidth, whiskerHeight),
        new BBox3(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y, capLength, caps.strokeWidth),
        new BBox3(yBar.upperPoint.x - capOffset, yBar.upperPoint.y, capLength, caps.strokeWidth)
      );
    }
    if (xBar !== void 0) {
      const whiskerWidth = xBar.upperPoint.x - xBar.lowerPoint.x;
      components.push(
        new BBox3(xBar.lowerPoint.x, xBar.upperPoint.y, whiskerWidth, whisker.strokeWidth),
        new BBox3(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset, caps.strokeWidth, capLength),
        new BBox3(xBar.upperPoint.x, xBar.upperPoint.y - capOffset, caps.strokeWidth, capLength)
      );
    }
    this.bboxes.components = components;
    this.bboxes.union = BBox3.merge(components);
  }
  containsPoint(x, y) {
    return this.bboxes.containsPoint(x, y);
  }
  pickNode(x, y) {
    return this.containsPoint(x, y) ? this : void 0;
  }
  nearestSquared(x, y, maxDistance) {
    const { bboxes } = this;
    if (bboxes.union.distanceSquared(x, y) > maxDistance) {
      return { nearest: void 0, distanceSquared: Infinity };
    }
    const { distanceSquared } = BBox3.nearestBox(x, y, bboxes.components);
    return { nearest: this, distanceSquared };
  }
};
var ErrorBarGroup = class extends import_ag_charts_community24._Scene.Group {
  get children() {
    return super.children;
  }
  nearestSquared(x, y) {
    const { nearest, distanceSquared } = import_ag_charts_community24._Scene.nearestSquaredInContainer(x, y, this);
    if (nearest !== void 0 && !isNaN(distanceSquared)) {
      return { datum: nearest.datum, distanceSquared };
    }
  }
};

// packages/ag-charts-enterprise/src/features/error-bar/errorBarProperties.ts
var import_ag_charts_community25 = require("ag-charts-community");
var {
  BaseProperties: BaseProperties3,
  Validate: Validate16,
  BOOLEAN: BOOLEAN8,
  COLOR_STRING: COLOR_STRING3,
  FUNCTION: FUNCTION3,
  LINE_DASH: LINE_DASH3,
  NUMBER: NUMBER5,
  OBJECT: OBJECT3,
  POSITIVE_NUMBER: POSITIVE_NUMBER5,
  RATIO: RATIO6,
  STRING: STRING3
} = import_ag_charts_community25._ModuleSupport;
var ErrorBarCap = class extends BaseProperties3 {
};
__decorateClass([
  Validate16(BOOLEAN8, { optional: true })
], ErrorBarCap.prototype, "visible", 2);
__decorateClass([
  Validate16(COLOR_STRING3, { optional: true })
], ErrorBarCap.prototype, "stroke", 2);
__decorateClass([
  Validate16(POSITIVE_NUMBER5, { optional: true })
], ErrorBarCap.prototype, "strokeWidth", 2);
__decorateClass([
  Validate16(RATIO6, { optional: true })
], ErrorBarCap.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate16(LINE_DASH3, { optional: true })
], ErrorBarCap.prototype, "lineDash", 2);
__decorateClass([
  Validate16(POSITIVE_NUMBER5, { optional: true })
], ErrorBarCap.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate16(NUMBER5, { optional: true })
], ErrorBarCap.prototype, "length", 2);
__decorateClass([
  Validate16(RATIO6, { optional: true })
], ErrorBarCap.prototype, "lengthRatio", 2);
__decorateClass([
  Validate16(FUNCTION3, { optional: true })
], ErrorBarCap.prototype, "formatter", 2);
var ErrorBarProperties = class extends BaseProperties3 {
  constructor() {
    super(...arguments);
    this.visible = true;
    this.stroke = "black";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.cap = new ErrorBarCap();
  }
};
__decorateClass([
  Validate16(STRING3, { optional: true })
], ErrorBarProperties.prototype, "yLowerKey", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], ErrorBarProperties.prototype, "yLowerName", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], ErrorBarProperties.prototype, "yUpperKey", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], ErrorBarProperties.prototype, "yUpperName", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], ErrorBarProperties.prototype, "xLowerKey", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], ErrorBarProperties.prototype, "xLowerName", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], ErrorBarProperties.prototype, "xUpperKey", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], ErrorBarProperties.prototype, "xUpperName", 2);
__decorateClass([
  Validate16(BOOLEAN8, { optional: true })
], ErrorBarProperties.prototype, "visible", 2);
__decorateClass([
  Validate16(COLOR_STRING3, { optional: true })
], ErrorBarProperties.prototype, "stroke", 2);
__decorateClass([
  Validate16(POSITIVE_NUMBER5, { optional: true })
], ErrorBarProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate16(RATIO6, { optional: true })
], ErrorBarProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate16(LINE_DASH3, { optional: true })
], ErrorBarProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate16(POSITIVE_NUMBER5, { optional: true })
], ErrorBarProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate16(FUNCTION3, { optional: true })
], ErrorBarProperties.prototype, "formatter", 2);
__decorateClass([
  Validate16(OBJECT3)
], ErrorBarProperties.prototype, "cap", 2);

// packages/ag-charts-enterprise/src/features/error-bar/errorBar.ts
var {
  fixNumericExtent,
  groupAccumulativeValueProperty,
  isDefined,
  mergeDefaults: mergeDefaults2,
  valueProperty,
  ChartAxisDirection: ChartAxisDirection6
} = import_ag_charts_community26._ModuleSupport;
function toErrorBoundCartesianSeries(ctx) {
  for (const supportedType of import_ag_charts_community26.AgErrorBarSupportedSeriesTypes) {
    if (supportedType == ctx.series.type) {
      return ctx.series;
    }
  }
  throw new Error(
    `AG Charts - unsupported series type '${ctx.series.type}', error bars supported series types: ${import_ag_charts_community26.AgErrorBarSupportedSeriesTypes.join(", ")}`
  );
}
var ErrorBars = class _ErrorBars extends import_ag_charts_community26._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.properties = new ErrorBarProperties();
    const series = toErrorBoundCartesianSeries(ctx);
    const { annotationGroup, annotationSelections } = series;
    this.cartesianSeries = series;
    this.groupNode = new ErrorBarGroup({
      name: `${annotationGroup.id}-errorBars`,
      zIndex: import_ag_charts_community26._ModuleSupport.Layers.SERIES_LAYER_ZINDEX,
      zIndexSubOrder: series.getGroupZIndexSubOrder("annotation")
    });
    annotationGroup.appendChild(this.groupNode);
    this.selection = import_ag_charts_community26._Scene.Selection.select(this.groupNode, () => this.errorBarFactory());
    annotationSelections.add(this.selection);
    this.destroyFns.push(
      series.addListener("data-processed", (e) => this.onDataProcessed(e)),
      series.addListener("data-update", (e) => this.onDataUpdate(e)),
      series.addListener("visibility-changed", (e) => this.onToggleSeriesItem(e)),
      ctx.highlightManager.addListener("highlight-change", (event) => this.onHighlightChange(event)),
      () => annotationGroup.removeChild(this.groupNode),
      () => annotationSelections.delete(this.selection)
    );
  }
  hasErrorBars() {
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.properties;
    return isDefined(xLowerKey) && isDefined(xUpperKey) || isDefined(yLowerKey) && isDefined(yUpperKey);
  }
  isStacked() {
    var _a2;
    const stackCount = (_a2 = this.cartesianSeries.seriesGrouping) == null ? void 0 : _a2.stackCount;
    return stackCount === void 0 ? false : stackCount > 0;
  }
  getUnstackPropertyDefinition(opts) {
    const props = [];
    const { cartesianSeries } = this;
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
    const { isContinuousX, isContinuousY } = opts;
    if (yLowerKey !== void 0 && yUpperKey !== void 0) {
      props.push(
        valueProperty(cartesianSeries, yLowerKey, isContinuousY, { id: yErrorsID }),
        valueProperty(cartesianSeries, yUpperKey, isContinuousY, { id: yErrorsID })
      );
    }
    if (xLowerKey !== void 0 && xUpperKey !== void 0) {
      props.push(
        valueProperty(cartesianSeries, xLowerKey, isContinuousX, { id: xErrorsID }),
        valueProperty(cartesianSeries, xUpperKey, isContinuousX, { id: xErrorsID })
      );
    }
    return props;
  }
  getStackPropertyDefinition(opts) {
    var _a2, _b;
    const props = [];
    const { cartesianSeries } = this;
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
    const { isContinuousX, isContinuousY } = opts;
    const groupIndex = (_b = (_a2 = cartesianSeries.seriesGrouping) == null ? void 0 : _a2.groupIndex) != null ? _b : cartesianSeries.id;
    const groupOpts = __spreadValues({
      invalidValue: null,
      missingValue: 0,
      separateNegative: true
    }, cartesianSeries.visible ? {} : { forceValue: 0 });
    const makeErrorProperty = (key, continuous, id, type) => {
      return groupAccumulativeValueProperty(cartesianSeries, key, continuous, "normal", "current", __spreadValues({
        id: `${id}-${type}`,
        groupId: `errorGroup-${groupIndex}-${type}`
      }, groupOpts));
    };
    const pushErrorProperties = (lowerKey, upperKey, continuous, id) => {
      props.push(
        ...makeErrorProperty(lowerKey, continuous, id, "lower"),
        ...makeErrorProperty(upperKey, continuous, id, "upper")
      );
    };
    if (yLowerKey !== void 0 && yUpperKey !== void 0) {
      pushErrorProperties(yLowerKey, yUpperKey, isContinuousY, yErrorsID);
    }
    if (xLowerKey !== void 0 && xUpperKey !== void 0) {
      pushErrorProperties(xLowerKey, xUpperKey, isContinuousX, xErrorsID);
    }
    return props;
  }
  getPropertyDefinitions(opts) {
    if (this.isStacked()) {
      return this.getStackPropertyDefinition(opts);
    } else {
      return this.getUnstackPropertyDefinition(opts);
    }
  }
  onDataProcessed(event) {
    this.dataModel = event.dataModel;
    this.processedData = event.processedData;
  }
  getDomain(direction) {
    const { xLowerKey, xUpperKey, xErrorsID, yLowerKey, yUpperKey, yErrorsID } = this.getMaybeFlippedKeys();
    const hasAxisErrors = direction === ChartAxisDirection6.X ? isDefined(xLowerKey) && isDefined(xUpperKey) : isDefined(yLowerKey) && isDefined(yUpperKey);
    if (hasAxisErrors) {
      const { dataModel, processedData, cartesianSeries: series } = this;
      const axis = series.axes[direction];
      const id = { x: xErrorsID, y: yErrorsID }[direction];
      if (dataModel !== void 0 && processedData !== void 0) {
        if (this.isStacked()) {
          const lowerDomain = dataModel.getDomain(series, `${id}-lower`, "value", processedData);
          const upperDomain = dataModel.getDomain(series, `${id}-upper`, "value", processedData);
          const domain = [Math.min(...lowerDomain, ...upperDomain), Math.max(...lowerDomain, ...upperDomain)];
          return fixNumericExtent(domain, axis);
        } else {
          const domain = dataModel.getDomain(series, id, "value", processedData);
          return fixNumericExtent(domain, axis);
        }
      }
    }
    return [];
  }
  onDataUpdate(event) {
    this.dataModel = event.dataModel;
    this.processedData = event.processedData;
    if (isDefined(event.dataModel) && isDefined(event.processedData)) {
      this.createNodeData();
      this.update();
    }
  }
  getNodeData() {
    const { contextNodeData } = this.cartesianSeries;
    if (contextNodeData.length > 0) {
      return contextNodeData[0].nodeData;
    }
  }
  createNodeData() {
    var _a2, _b;
    const nodeData = this.getNodeData();
    const xScale = (_a2 = this.cartesianSeries.axes[ChartAxisDirection6.X]) == null ? void 0 : _a2.scale;
    const yScale = (_b = this.cartesianSeries.axes[ChartAxisDirection6.Y]) == null ? void 0 : _b.scale;
    if (!this.hasErrorBars() || !xScale || !yScale || !nodeData) {
      return;
    }
    for (let i = 0; i < nodeData.length; i++) {
      const { midPoint, xLower, xUpper, yLower, yUpper } = this.getDatum(nodeData, i);
      if (midPoint !== void 0) {
        let xBar, yBar;
        if (isDefined(xLower) && isDefined(xUpper)) {
          xBar = {
            lowerPoint: { x: this.convert(xScale, xLower), y: midPoint.y },
            upperPoint: { x: this.convert(xScale, xUpper), y: midPoint.y }
          };
        }
        if (isDefined(yLower) && isDefined(yUpper)) {
          yBar = {
            lowerPoint: { x: midPoint.x, y: this.convert(yScale, yLower) },
            upperPoint: { x: midPoint.x, y: this.convert(yScale, yUpper) }
          };
        }
        nodeData[i].xBar = xBar;
        nodeData[i].yBar = yBar;
      }
    }
  }
  getMaybeFlippedKeys() {
    let { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.properties;
    let [xErrorsID, yErrorsID] = ["xValue-errors", "yValue-errors"];
    if (this.cartesianSeries.shouldFlipXY()) {
      [xLowerKey, yLowerKey] = [yLowerKey, xLowerKey];
      [xUpperKey, yUpperKey] = [yUpperKey, xUpperKey];
      [xErrorsID, yErrorsID] = [yErrorsID, xErrorsID];
    }
    return { xLowerKey, xUpperKey, xErrorsID, yLowerKey, yUpperKey, yErrorsID };
  }
  static getDatumKey(datum, key, offset) {
    if (key === void 0) {
      return;
    }
    const value = datum.datum[key];
    if (value === void 0) {
      return;
    }
    if (typeof value !== "number") {
      import_ag_charts_community26._Util.Logger.warnOnce(`Found [${key}] error value of type ${typeof value}. Expected number type`);
      return;
    }
    return value + offset;
  }
  getDatum(nodeData, datumIndex) {
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.getMaybeFlippedKeys();
    const datum = nodeData[datumIndex];
    const d = datum.cumulativeValue === void 0 || !this.isStacked() ? 0 : datum.cumulativeValue - datum.yValue;
    const [xOffset, yOffset] = this.cartesianSeries.shouldFlipXY() ? [d, 0] : [0, d];
    return {
      midPoint: datum.midPoint,
      xLower: _ErrorBars.getDatumKey(datum, xLowerKey, xOffset),
      xUpper: _ErrorBars.getDatumKey(datum, xUpperKey, xOffset),
      yLower: _ErrorBars.getDatumKey(datum, yLowerKey, yOffset),
      yUpper: _ErrorBars.getDatumKey(datum, yUpperKey, yOffset)
    };
  }
  convert(scale, value) {
    var _a2;
    const offset = ((_a2 = scale.bandwidth) != null ? _a2 : 0) / 2;
    return scale.convert(value) + offset;
  }
  update() {
    const nodeData = this.getNodeData();
    if (nodeData !== void 0) {
      this.selection.update(nodeData);
      this.selection.each((node, datum, i) => this.updateNode(node, datum, i));
    }
  }
  updateNode(node, datum, _index) {
    node.datum = datum;
    node.update(this.getDefaultStyle(), this.properties, false);
    node.updateBBoxes();
  }
  pickNodeExact(point) {
    const { x, y } = this.groupNode.transformPoint(point.x, point.y);
    const node = this.groupNode.pickNode(x, y);
    if (node !== void 0) {
      return { datum: node.datum, distanceSquared: 0 };
    }
  }
  pickNodeNearest(point) {
    return this.groupNode.nearestSquared(point.x, point.y);
  }
  pickNodeMainAxisFirst(point) {
    return this.groupNode.nearestSquared(point.x, point.y);
  }
  getTooltipParams() {
    const {
      xLowerKey,
      xUpperKey,
      yLowerKey,
      yUpperKey,
      xLowerName = xLowerKey,
      xUpperName = xUpperKey,
      yLowerName = yLowerKey,
      yUpperName = yUpperKey
    } = this.properties;
    return { xLowerKey, xLowerName, xUpperKey, xUpperName, yLowerKey, yLowerName, yUpperKey, yUpperName };
  }
  onToggleSeriesItem(event) {
    this.groupNode.visible = event.enabled;
  }
  makeStyle(baseStyle) {
    return {
      visible: baseStyle.visible,
      lineDash: baseStyle.lineDash,
      lineDashOffset: baseStyle.lineDashOffset,
      stroke: baseStyle.stroke,
      strokeWidth: baseStyle.strokeWidth,
      strokeOpacity: baseStyle.strokeOpacity,
      cap: mergeDefaults2(this.properties.cap, baseStyle)
    };
  }
  getDefaultStyle() {
    return this.makeStyle(this.getWhiskerProperties());
  }
  getHighlightStyle() {
    return this.makeStyle(this.getWhiskerProperties());
  }
  restyleHighlightChange(highlightChange, style, highlighted) {
    const nodeData = this.getNodeData();
    if (nodeData === void 0)
      return;
    for (let i = 0; i < nodeData.length; i++) {
      if (highlightChange === nodeData[i]) {
        this.selection.nodes()[i].update(style, this.properties, highlighted);
        break;
      }
    }
  }
  onHighlightChange(event) {
    const { previousHighlight, currentHighlight } = event;
    if ((currentHighlight == null ? void 0 : currentHighlight.series) === this.cartesianSeries) {
      this.restyleHighlightChange(currentHighlight, this.getHighlightStyle(), true);
    }
    if ((previousHighlight == null ? void 0 : previousHighlight.series) === this.cartesianSeries) {
      this.restyleHighlightChange(previousHighlight, this.getDefaultStyle(), false);
    }
    this.groupNode.opacity = this.cartesianSeries.getOpacity();
  }
  errorBarFactory() {
    return new ErrorBarNode();
  }
  getWhiskerProperties() {
    const { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset } = this.properties;
    return { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset };
  }
};

// packages/ag-charts-enterprise/src/features/error-bar/errorBarTheme.ts
var import_ag_charts_community27 = require("ag-charts-community");
var ERROR_BARS_THEME = {
  series: {
    errorBar: {
      visible: true,
      stroke: import_ag_charts_community27._Theme.DEFAULT_LABEL_COLOUR,
      strokeWidth: 1,
      strokeOpacity: 1,
      cap: {
        length: void 0,
        lengthRatio: void 0
      }
    }
  }
};

// packages/ag-charts-enterprise/src/features/error-bar/errorBarModule.ts
var ErrorBarsModule = {
  type: "series-option",
  identifier: "error-bars",
  optionsKey: "errorBar",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  seriesTypes: import_ag_charts_community28.AgErrorBarSupportedSeriesTypes,
  instanceConstructor: ErrorBars,
  themeTemplate: ERROR_BARS_THEME
};

// packages/ag-charts-enterprise/src/features/navigator/navigatorModule.ts
var import_ag_charts_community31 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/navigator/navigator.ts
var import_ag_charts_community30 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/navigator/miniChart.ts
var import_ag_charts_community29 = require("ag-charts-community");
var { Validate: Validate17, BOOLEAN: BOOLEAN9, POSITIVE_NUMBER: POSITIVE_NUMBER6, Layers: Layers4, ActionOnSet: ActionOnSet4, CategoryAxis, GroupedCategoryAxis } = import_ag_charts_community29._ModuleSupport;
var { toRadians: toRadians4, Padding, Logger } = import_ag_charts_community29._Util;
var { Text: Text4, Group: Group4, BBox: BBox4 } = import_ag_charts_community29._Scene;
var MiniChartPadding = class {
  constructor() {
    this.top = 0;
    this.bottom = 0;
  }
};
__decorateClass([
  Validate17(POSITIVE_NUMBER6)
], MiniChartPadding.prototype, "top", 2);
__decorateClass([
  Validate17(POSITIVE_NUMBER6)
], MiniChartPadding.prototype, "bottom", 2);
var MiniChart = class extends import_ag_charts_community29._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = false;
    this.padding = new MiniChartPadding();
    this.root = new Group4({ name: "root" });
    this.seriesRoot = this.root.appendChild(
      new Group4({ name: "Series-root", layer: true, zIndex: Layers4.SERIES_LAYER_ZINDEX })
    );
    this.axisGridGroup = this.root.appendChild(
      new Group4({ name: "Axes-Grids", layer: true, zIndex: Layers4.AXIS_GRID_ZINDEX })
    );
    this.axisGroup = this.root.appendChild(
      new Group4({ name: "Axes-Grids", layer: true, zIndex: Layers4.AXIS_GRID_ZINDEX })
    );
    this.data = [];
    this._destroyed = false;
    this.miniChartAnimationPhase = "initial";
    this.axes = [];
    this.series = [];
  }
  destroy() {
    if (this._destroyed) {
      return;
    }
    this.destroySeries(this.series);
    this.axes.forEach((a) => a.destroy());
    this.axes = [];
    this._destroyed = true;
  }
  onSeriesChange(newValue, oldValue) {
    var _a2;
    const seriesToDestroy = (_a2 = oldValue == null ? void 0 : oldValue.filter((series) => !newValue.includes(series))) != null ? _a2 : [];
    this.destroySeries(seriesToDestroy);
    for (const series of newValue) {
      if (oldValue == null ? void 0 : oldValue.includes(series))
        continue;
      if (series.rootGroup.parent == null) {
        this.seriesRoot.appendChild(series.rootGroup);
      }
      const chart = this;
      series.chart = {
        get mode() {
          return "standalone";
        },
        get isMiniChart() {
          return true;
        },
        get seriesRect() {
          return chart.seriesRect;
        },
        placeLabels() {
          return /* @__PURE__ */ new Map();
        }
      };
      series.resetAnimation(this.miniChartAnimationPhase === "initial" ? "initial" : "disabled");
    }
  }
  destroySeries(allSeries) {
    allSeries == null ? void 0 : allSeries.forEach((series) => {
      series.destroy();
      if (series.rootGroup != null) {
        this.seriesRoot.removeChild(series.rootGroup);
      }
      series.chart = void 0;
    });
  }
  assignSeriesToAxes() {
    this.axes.forEach((axis) => {
      axis.boundSeries = this.series.filter((s) => {
        const seriesAxis = s.axes[axis.direction];
        return seriesAxis === axis;
      });
    });
  }
  assignAxesToSeries() {
    const directionToAxesMap = {};
    this.axes.forEach((axis) => {
      var _a2;
      const direction = axis.direction;
      const directionAxes = (_a2 = directionToAxesMap[direction]) != null ? _a2 : directionToAxesMap[direction] = [];
      directionAxes.push(axis);
    });
    this.series.forEach((series) => {
      series.directions.forEach((direction) => {
        const directionAxes = directionToAxesMap[direction];
        if (!directionAxes) {
          Logger.warnOnce(
            `no available axis for direction [${direction}]; check series and axes configuration.`
          );
          return;
        }
        const seriesKeys = series.getKeys(direction);
        const newAxis = this.findMatchingAxis(directionAxes, seriesKeys);
        if (!newAxis) {
          Logger.warnOnce(
            `no matching axis for direction [${direction}] and keys [${seriesKeys}]; check series and axes configuration.`
          );
          return;
        }
        series.axes[direction] = newAxis;
      });
    });
  }
  findMatchingAxis(directionAxes, directionKeys) {
    for (const axis of directionAxes) {
      if (!axis.keys.length) {
        return axis;
      }
      if (!directionKeys) {
        continue;
      }
      for (const directionKey of directionKeys) {
        if (axis.keys.includes(directionKey)) {
          return axis;
        }
      }
    }
  }
  updateData(opts) {
    return __async(this, null, function* () {
      this.series.forEach((s) => s.setChartData(opts.data));
      if (this.miniChartAnimationPhase === "initial") {
        this.ctx.animationManager.onBatchStop(() => {
          this.miniChartAnimationPhase = "ready";
          this.series.forEach((s) => s.resetAnimation("disabled"));
        });
      }
    });
  }
  processData(opts) {
    return __async(this, null, function* () {
      if (this.series.some((s) => s.canHaveAxes)) {
        this.assignAxesToSeries();
        this.assignSeriesToAxes();
      }
      const seriesPromises = this.series.map((s) => s.processData(opts.dataController));
      yield Promise.all(seriesPromises);
    });
  }
  computeAxisPadding() {
    const padding = new Padding();
    if (!this.enabled) {
      return padding;
    }
    this.axes.forEach((axis) => {
      var _a2;
      const { position, thickness = 0, line, label } = axis;
      if (position == null)
        return;
      let size;
      if (thickness > 0) {
        size = thickness;
      } else {
        size = (line.enabled ? line.width : 0) + (label.enabled ? ((_a2 = label.fontSize) != null ? _a2 : 0) * Text4.defaultLineHeightRatio + label.padding : 0);
      }
      padding[position] = Math.ceil(size);
    });
    return padding;
  }
  layout(width, height) {
    return __async(this, null, function* () {
      const { padding } = this;
      const animated = this.seriesRect != null;
      const seriesRect = new BBox4(0, 0, width, height - (padding.top + padding.bottom));
      this.seriesRect = seriesRect;
      this.seriesRoot.translationY = padding.top;
      this.seriesRoot.setClipRectInGroupCoordinateSpace(
        this.seriesRoot.inverseTransformBBox(new BBox4(0, -padding.top, width, height))
      );
      const axisLeftRightRange = (axis) => {
        if (axis instanceof CategoryAxis || axis instanceof GroupedCategoryAxis) {
          return [0, seriesRect.height];
        }
        return [seriesRect.height, 0];
      };
      this.axes.forEach((axis) => {
        const { position = "left" } = axis;
        switch (position) {
          case "top":
          case "bottom":
            axis.range = [0, seriesRect.width];
            axis.gridLength = seriesRect.height;
            break;
          case "right":
          case "left":
            axis.range = axisLeftRightRange(axis);
            axis.gridLength = seriesRect.width;
            break;
        }
        switch (position) {
          case "top":
          case "left":
            axis.translation.x = 0;
            axis.translation.y = 0;
            break;
          case "bottom":
            axis.translation.x = 0;
            axis.translation.y = height;
            break;
          case "right":
            axis.translation.x = width;
            axis.translation.y = 0;
            break;
        }
        axis.gridPadding = 0;
        axis.calculateLayout();
        axis.updatePosition({ rotation: toRadians4(axis.rotation), sideFlag: axis.label.getSideFlag() });
        axis.update(void 0, animated);
      });
      yield Promise.all(this.series.map((series) => series.update({ seriesRect })));
    });
  }
};
__decorateClass([
  Validate17(BOOLEAN9)
], MiniChart.prototype, "enabled", 2);
__decorateClass([
  ActionOnSet4({
    changeValue(newValue, oldValue = []) {
      for (const axis of oldValue) {
        if (newValue.includes(axis))
          continue;
        axis.detachAxis(this.axisGroup, this.axisGridGroup);
        axis.destroy();
      }
      for (const axis of newValue) {
        if (oldValue == null ? void 0 : oldValue.includes(axis))
          continue;
        axis.attachAxis(this.axisGroup, this.axisGridGroup);
      }
    }
  })
], MiniChart.prototype, "axes", 2);
__decorateClass([
  ActionOnSet4({
    changeValue(newValue, oldValue) {
      this.onSeriesChange(newValue, oldValue);
    }
  })
], MiniChart.prototype, "series", 2);

// packages/ag-charts-enterprise/src/features/navigator/navigator.ts
var { ObserveChanges: ObserveChanges3 } = import_ag_charts_community30._ModuleSupport;
var _Navigator = class _Navigator extends import_ag_charts_community30._ModuleSupport.Navigator {
  constructor(ctx) {
    super(ctx);
    this.miniChart = new MiniChart(ctx);
  }
  updateData(opts) {
    return __async(this, null, function* () {
      yield this.miniChart.updateData(opts);
    });
  }
  processData(opts) {
    return __async(this, null, function* () {
      yield this.miniChart.processData(opts);
    });
  }
  performLayout(opts) {
    return __async(this, null, function* () {
      const { shrinkRect } = yield __superGet(_Navigator.prototype, this, "performLayout").call(this, opts);
      if (this.enabled) {
        const { top, bottom } = this.miniChart.computeAxisPadding();
        shrinkRect.shrink(top + bottom, "bottom");
        this.y -= bottom;
      }
      return { shrinkRect };
    });
  }
  performCartesianLayout(opts) {
    return __async(this, null, function* () {
      yield __superGet(_Navigator.prototype, this, "performCartesianLayout").call(this, opts);
      yield this.miniChart.layout(this.width, this.height);
    });
  }
};
__decorateClass([
  ObserveChanges3((target, value, oldValue) => {
    target.updateBackground(oldValue == null ? void 0 : oldValue.root, value == null ? void 0 : value.root);
  })
], _Navigator.prototype, "miniChart", 2);
var Navigator = _Navigator;

// packages/ag-charts-enterprise/src/features/navigator/navigatorModule.ts
var _a;
var NavigatorModule = {
  type: "root",
  optionsKey: "navigator",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  instanceConstructor: Navigator,
  themeTemplate: __spreadProps(__spreadValues({}, import_ag_charts_community31._ModuleSupport.NavigatorModule.themeTemplate), {
    navigator: __spreadProps(__spreadValues({}, (_a = import_ag_charts_community31._ModuleSupport.NavigatorModule.themeTemplate) == null ? void 0 : _a.navigator), {
      miniChart: {
        enabled: false,
        label: {
          color: import_ag_charts_community31._Theme.DEFAULT_LABEL_COLOUR,
          fontStyle: void 0,
          fontWeight: void 0,
          fontSize: 10,
          fontFamily: import_ag_charts_community31._Theme.DEFAULT_FONT_FAMILY,
          formatter: void 0,
          padding: 0
        },
        padding: {
          top: 0,
          bottom: 0
        }
      }
    })
  })
};

// packages/ag-charts-enterprise/src/features/range-buttons/rangeButtons.ts
var import_ag_charts_community32 = require("ag-charts-community");
var { BOOLEAN: BOOLEAN10, ActionOnSet: ActionOnSet5, Validate: Validate18 } = import_ag_charts_community32._ModuleSupport;
var RangeButtons = class extends import_ag_charts_community32._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = false;
  }
};
__decorateClass([
  ActionOnSet5({
    changeValue(enabled) {
      this.ctx.toolbarManager.toggleVisibility("range-buttons", enabled);
    }
  }),
  Validate18(BOOLEAN10)
], RangeButtons.prototype, "enabled", 2);

// packages/ag-charts-enterprise/src/features/range-buttons/rangeButtonsModule.ts
var RangeButtonsModule = {
  type: "root",
  optionsKey: "rangeButtons",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  instanceConstructor: RangeButtons,
  themeTemplate: {
    rangeButtons: { enabled: false }
  }
};

// packages/ag-charts-enterprise/src/features/sync/chartSync.ts
var import_ag_charts_community33 = require("ag-charts-community");
var {
  BOOLEAN: BOOLEAN11,
  STRING: STRING4,
  UNION: UNION3,
  BaseProperties: BaseProperties4,
  CartesianAxis,
  ChartUpdateType,
  arraysEqual,
  isDate,
  isDefined: isDefined2,
  isFiniteNumber,
  ObserveChanges: ObserveChanges4,
  TooltipManager,
  Validate: Validate19
} = import_ag_charts_community33._ModuleSupport;
var { Logger: Logger2 } = import_ag_charts_community33._Util;
var ChartSync = class extends BaseProperties4 {
  constructor(moduleContext) {
    super();
    this.moduleContext = moduleContext;
    this.enabled = false;
    this.axes = "x";
    this.nodeInteraction = true;
    this.zoom = true;
  }
  updateChart(chart, updateType = ChartUpdateType.UPDATE_DATA) {
    chart.updateService.update(updateType, { skipSync: true });
  }
  updateSiblings(groupId) {
    const { syncManager } = this.moduleContext;
    const updateFn = () => __async(this, null, function* () {
      for (const chart of syncManager.getGroupSiblings(groupId)) {
        yield chart.waitForDataProcess(120);
        this.updateChart(chart);
      }
    });
    updateFn().catch((e) => {
      Logger2.warnOnce("Error updating sibling chart", e);
    });
  }
  enabledZoomSync() {
    const { syncManager, zoomManager } = this.moduleContext;
    this.disableZoomSync = zoomManager.addListener("zoom-change", () => {
      var _a2;
      for (const chart of syncManager.getGroupSiblings(this.groupId)) {
        if ((_a2 = chart.modulesManager.getModule("sync")) == null ? void 0 : _a2.zoom) {
          chart.zoomManager.updateZoom("sync", this.mergeZoom(chart));
        }
      }
    });
  }
  enabledNodeInteractionSync() {
    const { highlightManager, syncManager } = this.moduleContext;
    this.disableNodeInteractionSync = highlightManager.addListener("highlight-change", (event) => {
      var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      for (const chart of syncManager.getGroupSiblings(this.groupId)) {
        if (!((_a2 = chart.modulesManager.getModule("sync")) == null ? void 0 : _a2.nodeInteraction))
          continue;
        if (!((_b = event.currentHighlight) == null ? void 0 : _b.datum)) {
          chart.highlightManager.updateHighlight(chart.id);
          chart.tooltipManager.removeTooltip(chart.id);
          continue;
        }
        for (const axis of chart.axes) {
          const validDirection = this.axes === "xy" ? "x" : this.axes;
          if (!CartesianAxis.is(axis) || axis.direction !== validDirection)
            continue;
          const matchingNodes = chart.series.map((series) => {
            const seriesKeys = series.getKeys(axis.direction);
            if (axis.keys.length && !axis.keys.some((key) => seriesKeys.includes(key)))
              return;
            const [{ nodeData }] = series.contextNodeData;
            if (!(nodeData == null ? void 0 : nodeData.length))
              return;
            const valueKey = nodeData[0][`${axis.direction}Key`];
            let eventValue = event.currentHighlight.datum[valueKey];
            const valueIsDate = isDate(eventValue);
            if (valueIsDate) {
              eventValue = eventValue.getTime();
            }
            const nodeDatum = nodeData.find((datum) => {
              const nodeValue = datum.datum[valueKey];
              return valueIsDate ? nodeValue.getTime() === eventValue : nodeValue === eventValue;
            });
            return nodeDatum ? { series, nodeDatum } : null;
          }).filter(isDefined2);
          if (matchingNodes.length < 2 && ((_c = matchingNodes[0]) == null ? void 0 : _c.nodeDatum) !== chart.highlightManager.getActiveHighlight()) {
            const { series, nodeDatum } = (_d = matchingNodes[0]) != null ? _d : {};
            chart.highlightManager.updateHighlight(chart.id, nodeDatum);
            if (nodeDatum) {
              const offsetX = (_h = (_g = (_e = nodeDatum.midPoint) == null ? void 0 : _e.x) != null ? _g : (_f = nodeDatum.point) == null ? void 0 : _f.x) != null ? _h : 0;
              const offsetY = (_l = (_k = (_i = nodeDatum.midPoint) == null ? void 0 : _i.y) != null ? _k : (_j = nodeDatum.point) == null ? void 0 : _j.y) != null ? _l : 0;
              const tooltipMeta = TooltipManager.makeTooltipMeta({ offsetX, offsetY }, nodeDatum);
              delete tooltipMeta.lastPointerEvent;
              chart.tooltipManager.updateTooltip(chart.id, tooltipMeta, series.getTooltipHtml(nodeDatum));
            } else {
              chart.tooltipManager.removeTooltip(chart.id);
            }
            this.updateChart(chart, ChartUpdateType.SERIES_UPDATE);
          }
        }
      }
    });
  }
  syncAxes(stopPropagation = false) {
    const { syncManager } = this.moduleContext;
    const chart = syncManager.getChart();
    const syncGroup = syncManager.getGroup(this.groupId);
    const syncSeries = syncGroup.flatMap((c) => c.series);
    const syncAxes = syncGroup[0].axes;
    let hasUpdated = false;
    chart.axes.forEach((axis) => {
      if (!CartesianAxis.is(axis) || this.axes !== "xy" && this.axes !== axis.direction) {
        axis.boundSeries = chart.series.filter((s) => s.axes[axis.direction] === axis);
        return;
      }
      const { direction, min, max, nice, reverse } = axis;
      for (const mainAxis of syncAxes) {
        if (direction !== mainAxis.direction)
          continue;
        if (nice !== mainAxis.nice || reverse !== mainAxis.reverse || min !== mainAxis.min && (isFiniteNumber(min) || isFiniteNumber(mainAxis.min)) || max !== mainAxis.max && (isFiniteNumber(max) || isFiniteNumber(mainAxis.max))) {
          Logger2.warnOnce(
            "To allow synchronization, ensure that all charts have matching min, max, nice, and reverse properties on the synchronized axes."
          );
          axis.boundSeries = chart.series.filter((s) => s.axes[axis.direction] === axis);
          this.enabled = false;
          return;
        }
      }
      const boundSeries = syncSeries.filter((series) => {
        if (series.visible) {
          const seriesKeys = series.getKeys(axis.direction);
          return axis.keys.length ? axis.keys.some((key) => seriesKeys.includes(key)) : true;
        }
      });
      if (!arraysEqual(axis.boundSeries, boundSeries)) {
        axis.boundSeries = boundSeries;
        hasUpdated = true;
      }
    });
    if (hasUpdated && !stopPropagation) {
      this.updateSiblings(this.groupId);
    }
  }
  mergeZoom(chart) {
    var _a2, _b;
    const { zoomManager } = this.moduleContext;
    if (this.axes === "xy") {
      return zoomManager.getZoom();
    }
    const combinedZoom = (_a2 = chart.zoomManager.getZoom()) != null ? _a2 : {};
    combinedZoom[this.axes] = (_b = zoomManager.getZoom()) == null ? void 0 : _b[this.axes];
    return combinedZoom;
  }
  onEnabledChange() {
    const { syncManager } = this.moduleContext;
    if (this.enabled) {
      syncManager.subscribe(this.groupId);
    } else {
      syncManager.unsubscribe(this.groupId);
    }
    this.updateSiblings(this.groupId);
    this.onNodeInteractionChange();
    this.onZoomChange();
  }
  onGroupIdChange(newValue, oldValue) {
    if (!this.enabled || newValue === oldValue)
      return;
    const { syncManager } = this.moduleContext;
    syncManager.unsubscribe(oldValue);
    syncManager.subscribe(newValue);
    this.updateSiblings(oldValue);
    this.updateSiblings(newValue);
  }
  onAxesChange() {
    if (!this.enabled)
      return;
    const { syncManager } = this.moduleContext;
    this.updateChart(syncManager.getChart());
  }
  onNodeInteractionChange() {
    var _a2;
    if (this.enabled && this.nodeInteraction) {
      this.enabledNodeInteractionSync();
    } else {
      (_a2 = this.disableNodeInteractionSync) == null ? void 0 : _a2.call(this);
    }
  }
  onZoomChange() {
    var _a2;
    if (this.enabled && this.zoom) {
      this.enabledZoomSync();
    } else {
      (_a2 = this.disableZoomSync) == null ? void 0 : _a2.call(this);
    }
  }
  destroy() {
    var _a2;
    const { syncManager } = this.moduleContext;
    syncManager.unsubscribe(this.groupId);
    this.updateSiblings(this.groupId);
    (_a2 = this.disableZoomSync) == null ? void 0 : _a2.call(this);
  }
};
ChartSync.className = "Sync";
__decorateClass([
  Validate19(BOOLEAN11),
  ObserveChanges4((target) => target.onEnabledChange())
], ChartSync.prototype, "enabled", 2);
__decorateClass([
  Validate19(STRING4, { optional: true }),
  ObserveChanges4((target, newValue, oldValue) => target.onGroupIdChange(newValue, oldValue))
], ChartSync.prototype, "groupId", 2);
__decorateClass([
  Validate19(UNION3(["x", "y", "xy"], "an axis")),
  ObserveChanges4((target) => target.onAxesChange())
], ChartSync.prototype, "axes", 2);
__decorateClass([
  Validate19(BOOLEAN11),
  ObserveChanges4((target) => target.onNodeInteractionChange())
], ChartSync.prototype, "nodeInteraction", 2);
__decorateClass([
  Validate19(BOOLEAN11),
  ObserveChanges4((target) => target.onZoomChange())
], ChartSync.prototype, "zoom", 2);

// packages/ag-charts-enterprise/src/features/sync/syncModule.ts
var SyncModule = {
  type: "root",
  optionsKey: "sync",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  instanceConstructor: ChartSync,
  themeTemplate: {
    sync: { enabled: false }
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoom.ts
var import_ag_charts_community41 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/range-buttons/rangeTypes.ts
var DAY = 1e3 * 60 * 60 * 24;
var MONTH = DAY * 30;
var YEAR = DAY * 365;
var RANGES = /* @__PURE__ */ new Map([
  ["1m" /* MONTH */, MONTH],
  ["3m" /* THREE_MONTHS */, MONTH * 3],
  ["6m" /* SIX_MONTHS */, MONTH * 6],
  ["YTD" /* YTD */, (end) => (/* @__PURE__ */ new Date(`${new Date(end).getFullYear()}-01-01`)).getTime()],
  ["1y" /* ONE_YEAR */, YEAR],
  ["All" /* ALL */, null]
]);

// packages/ag-charts-enterprise/src/features/zoom/scenes/zoomRect.ts
var import_ag_charts_community34 = require("ag-charts-community");
var { COLOR_STRING: COLOR_STRING4, RATIO: RATIO7, Validate: Validate20 } = import_ag_charts_community34._ModuleSupport;
var ZoomRect = class extends import_ag_charts_community34._Scene.Rect {
  constructor() {
    super(...arguments);
    this.fill = "rgb(33, 150, 243)";
    this.fillOpacity = 0.2;
  }
};
ZoomRect.className = "ZoomRect";
__decorateClass([
  Validate20(COLOR_STRING4)
], ZoomRect.prototype, "fill", 2);
__decorateClass([
  Validate20(RATIO7)
], ZoomRect.prototype, "fillOpacity", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomAxisDragger.ts
var import_ag_charts_community36 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/zoom/zoomUtils.ts
var import_ag_charts_community35 = require("ag-charts-community");
var { clamp } = import_ag_charts_community35._ModuleSupport;
var UNIT = { min: 0, max: 1 };
var constrain = (value, min = UNIT.min, max = UNIT.max) => clamp(min, value, max);
function unitZoomState() {
  return { x: __spreadValues({}, UNIT), y: __spreadValues({}, UNIT) };
}
function dx(zoom) {
  return zoom.x.max - zoom.x.min;
}
function dy(zoom) {
  return zoom.y.max - zoom.y.min;
}
function definedZoomState(zoom) {
  var _a2, _b, _c, _d, _e, _f, _g, _h;
  return {
    x: { min: (_b = (_a2 = zoom == null ? void 0 : zoom.x) == null ? void 0 : _a2.min) != null ? _b : UNIT.min, max: (_d = (_c = zoom == null ? void 0 : zoom.x) == null ? void 0 : _c.max) != null ? _d : UNIT.max },
    y: { min: (_f = (_e = zoom == null ? void 0 : zoom.y) == null ? void 0 : _e.min) != null ? _f : UNIT.min, max: (_h = (_g = zoom == null ? void 0 : zoom.y) == null ? void 0 : _g.max) != null ? _h : UNIT.max }
  };
}
function pointToRatio(bbox, x, y) {
  if (!bbox)
    return { x: 0, y: 0 };
  const constrainedX = constrain(x - bbox.x, 0, bbox.x + bbox.width);
  const constrainedY = constrain(y - bbox.y, 0, bbox.y + bbox.height);
  const rx = 1 / bbox.width * constrainedX;
  const ry = 1 - 1 / bbox.height * constrainedY;
  return { x: constrain(rx), y: constrain(ry) };
}
function translateZoom(zoom, x, y) {
  return {
    x: { min: zoom.x.min + x, max: zoom.x.max + x },
    y: { min: zoom.y.min + y, max: zoom.y.max + y }
  };
}
function scaleZoom(zoom, sx, sy) {
  return {
    x: { min: zoom.x.min, max: zoom.x.min + dx(zoom) * sx },
    y: { min: zoom.y.min, max: zoom.y.min + dy(zoom) * sy }
  };
}
function scaleZoomCenter(zoom, sx, sy) {
  const dx_ = dx(zoom);
  const dy_ = dy(zoom);
  const cx = zoom.x.min + dx_ / 2;
  const cy = zoom.y.min + dy_ / 2;
  return {
    x: { min: cx - dx_ * sx / 2, max: cx + dx_ * sx / 2 },
    y: { min: cy - dy_ * sy / 2, max: cy + dy_ * sy / 2 }
  };
}
function scaleZoomAxisWithAnchor(newState, oldState, anchor, origin) {
  const { min, max } = oldState;
  const center = min + (max - min) / 2;
  const diff8 = newState.max - newState.min;
  switch (anchor) {
    case "start":
      return { min, max: oldState.min + diff8 };
    case "end":
      return { min: oldState.max - diff8, max };
    case "middle":
      return { min: center - diff8 / 2, max: center + diff8 / 2 };
    case "pointer":
      return scaleZoomAxisWithPoint(newState, oldState, origin != null ? origin : center);
    default:
      return { min, max };
  }
}
function scaleZoomAxisWithPoint(newState, oldState, origin) {
  const scaledOrigin = origin * (1 - (oldState.max - oldState.min - (newState.max - newState.min)));
  const translation = origin - scaledOrigin;
  const min = newState.min + translation;
  const max = newState.max + translation;
  return { min, max };
}
function multiplyZoom(zoom, nx, ny) {
  return {
    x: { min: zoom.x.min * nx, max: zoom.x.max * nx },
    y: { min: zoom.y.min * ny, max: zoom.y.max * ny }
  };
}
function constrainZoom(zoom) {
  const after = unitZoomState();
  after.x = constrainAxis(zoom.x);
  after.y = constrainAxis(zoom.y);
  return after;
}
function constrainAxis(axis) {
  const size = axis.max - axis.min;
  let min = axis.max > UNIT.max ? UNIT.max - size : axis.min;
  let max = axis.min < UNIT.min ? size : axis.max;
  min = Math.max(UNIT.min, min);
  max = Math.min(UNIT.max, max);
  return { min, max };
}
function constrainAxisWithOld({ min, max }, old, minRatio) {
  if (max === old.max) {
    min = max - minRatio;
  } else if (min === old.min) {
    max = min + minRatio;
  } else {
    const cx = old.min + (old.max - old.min) / 2;
    min = cx - minRatio / 2;
    max = cx + minRatio / 2;
  }
  return { min, max };
}

// packages/ag-charts-enterprise/src/features/zoom/zoomAxisDragger.ts
var ZoomAxisDragger = class {
  update(event, direction, anchor, bbox, zoom, axisZoom) {
    var _a2;
    (_a2 = this.oldZoom) != null ? _a2 : this.oldZoom = definedZoomState(
      direction === import_ag_charts_community36._ModuleSupport.ChartAxisDirection.X ? __spreadProps(__spreadValues({}, zoom), { x: axisZoom }) : __spreadProps(__spreadValues({}, zoom), { y: axisZoom })
    );
    this.updateCoords(event.offsetX, event.offsetY);
    return this.updateZoom(direction, anchor, bbox);
  }
  stop() {
    this.coords = void 0;
    this.oldZoom = void 0;
  }
  updateCoords(x, y) {
    if (this.coords) {
      this.coords.x2 = x;
      this.coords.y2 = y;
    } else {
      this.coords = { x1: x, y1: y, x2: x, y2: y };
    }
  }
  updateZoom(direction, anchor, bbox) {
    const { coords, oldZoom } = this;
    let newZoom = definedZoomState(oldZoom);
    if (!coords || !oldZoom) {
      if (direction === import_ag_charts_community36._ModuleSupport.ChartAxisDirection.X)
        return newZoom.x;
      return newZoom.y;
    }
    const origin = pointToRatio(bbox, coords.x1, coords.y1);
    const target = pointToRatio(bbox, coords.x2, coords.y2);
    if (direction === import_ag_charts_community36._ModuleSupport.ChartAxisDirection.X) {
      const scaleX = (target.x - origin.x) * dx(oldZoom);
      newZoom.x.max += scaleX;
      newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchor, origin.x);
      newZoom = constrainZoom(newZoom);
      return newZoom.x;
    }
    const scaleY = (target.y - origin.y) * dy(oldZoom);
    newZoom.y.max -= scaleY;
    newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchor, origin.y);
    newZoom = constrainZoom(newZoom);
    return newZoom.y;
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoomPanner.ts
var import_ag_charts_community37 = require("ag-charts-community");
var ZoomPanner = class {
  update(event, bbox, zooms) {
    this.updateCoords(event.offsetX, event.offsetY);
    return this.translateZooms(bbox, zooms);
  }
  stop() {
    this.coords = void 0;
  }
  updateCoords(x, y) {
    if (!this.coords) {
      this.coords = { x1: x, y1: y, x2: x, y2: y };
    } else {
      this.coords = { x1: this.coords.x2, y1: this.coords.y2, x2: x, y2: y };
    }
  }
  translateZooms(bbox, currentZooms) {
    var _a2;
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = (_a2 = this.coords) != null ? _a2 : {};
    const dx_ = x1 <= x2 ? x2 - x1 : x1 - x2;
    const dy_ = y1 <= y2 ? y2 - y1 : y1 - y2;
    const offset = pointToRatio(bbox, bbox.x + dx_, bbox.y + bbox.height - dy_);
    const offsetX = x1 <= x2 ? -offset.x : offset.x;
    const offsetY = y1 <= y2 ? offset.y : -offset.y;
    const newZooms = {};
    for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
      let zoom;
      if (direction === import_ag_charts_community37._ModuleSupport.ChartAxisDirection.X) {
        zoom = definedZoomState({ x: currentZoom });
      } else {
        zoom = definedZoomState({ y: currentZoom });
      }
      zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), offsetY * dy(zoom)));
      if (direction === import_ag_charts_community37._ModuleSupport.ChartAxisDirection.X) {
        newZooms[axisId] = { direction, zoom: zoom.x };
      } else {
        newZooms[axisId] = { direction, zoom: zoom.y };
      }
    }
    return newZooms;
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoomRange.ts
var import_ag_charts_community38 = require("ag-charts-community");
var { AND: AND5, DATE, NUMBER: NUMBER6, OR, ActionOnSet: ActionOnSet6, isFiniteNumber: isFiniteNumber2, isValidDate, Validate: Validate21 } = import_ag_charts_community38._ModuleSupport;
var ZoomRange = class {
  constructor(onChange) {
    this.onChange = onChange;
  }
  getRange() {
    return this.getRangeWithValues(this.start, this.end);
  }
  getInitialRange() {
    return this.getRangeWithValues(this.initialStart, this.initialEnd);
  }
  extendToEnd(extent6) {
    return this.extendWith((end) => Number(end) - extent6);
  }
  extendWith(fn) {
    var _a2;
    if (!this.domain)
      return;
    const end = this.domain.at(-1);
    if (end == null)
      return;
    const start = fn(end);
    const changed = this.start !== start || this.end !== end;
    this.end = end;
    this.start = start;
    if (!changed)
      (_a2 = this.onChange) == null ? void 0 : _a2.call(this, this.getRange());
  }
  extendAll() {
    var _a2;
    if (!this.domain)
      return;
    const start = this.domain[0];
    const end = this.domain.at(-1);
    const changed = this.start !== start || this.end !== end;
    this.start = start;
    this.end = end;
    if (!changed)
      (_a2 = this.onChange) == null ? void 0 : _a2.call(this, this.getRange());
  }
  updateAxis(axes) {
    const validAxis = axes.find(({ domain: domain2 }) => {
      const isNumberAxis = !isFiniteNumber2(domain2[0]) || !isFiniteNumber2(domain2.at(-1));
      const isDateAxis = !isValidDate(domain2[0]) || !isValidDate(domain2.at(-1));
      return isNumberAxis || isDateAxis;
    });
    let domain = this.domain;
    if (!validAxis)
      return domain != null;
    let validAxisDomain = validAxis.domain;
    if (domain != null && domain[0] instanceof Date) {
      domain = domain.map((d) => d instanceof Date ? d.getTime() : d);
      validAxisDomain = validAxisDomain.map((d) => d instanceof Date ? d.getTime() : d);
    }
    const changed = domain == null || !import_ag_charts_community38._Util.areArrayItemsStrictlyEqual(domain, validAxisDomain);
    if (changed) {
      this.domain = validAxis.domain;
    }
    return changed;
  }
  getRangeWithValues(start, end) {
    const { domain } = this;
    let d0 = domain == null ? void 0 : domain[0];
    let d1 = domain == null ? void 0 : domain.at(-1);
    if (start == null && end == null || d0 == null || d1 == null)
      return;
    d0 = Number(d0);
    d1 = Number(d1);
    let min = 0;
    let max = 1;
    if (start != null)
      min = (Number(start) - d0) / (d1 - d0);
    if (end != null)
      max = (Number(end) - d0) / (d1 - d0);
    return { min, max };
  }
};
__decorateClass([
  ActionOnSet6({
    changeValue(start) {
      var _a2, _b;
      (_a2 = this.initialStart) != null ? _a2 : this.initialStart = start;
      (_b = this.onChange) == null ? void 0 : _b.call(this, this.getRangeWithValues(start, this.end));
    }
  }),
  Validate21(AND5(
    OR(DATE, NUMBER6)
    /* LESS_THAN('end') */
  ), { optional: true })
], ZoomRange.prototype, "start", 2);
__decorateClass([
  ActionOnSet6({
    changeValue(end) {
      var _a2, _b;
      (_a2 = this.initialEnd) != null ? _a2 : this.initialEnd = end;
      (_b = this.onChange) == null ? void 0 : _b.call(this, this.getRangeWithValues(this.start, end));
    }
  }),
  Validate21(AND5(
    OR(DATE, NUMBER6)
    /* GREATER_THAN('start') */
  ), { optional: true })
], ZoomRange.prototype, "end", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomRatio.ts
var import_ag_charts_community39 = require("ag-charts-community");
var { AND: AND6, GREATER_THAN: GREATER_THAN4, LESS_THAN: LESS_THAN3, RATIO: RATIO8, ActionOnSet: ActionOnSet7, Validate: Validate22 } = import_ag_charts_community39._ModuleSupport;
var ZoomRatio = class {
  constructor(onChange) {
    this.onChange = onChange;
  }
  getRatio() {
    return this.getRatioWithValues(this.start, this.end);
  }
  getInitialRatio() {
    return this.getRatioWithValues(this.initialStart, this.initialEnd);
  }
  getRatioWithValues(start, end) {
    if (start == null && end == null)
      return;
    return {
      min: start != null ? start : UNIT.min,
      max: end != null ? end : UNIT.max
    };
  }
};
__decorateClass([
  ActionOnSet7({
    changeValue(start) {
      var _a2, _b;
      (_a2 = this.initialStart) != null ? _a2 : this.initialStart = start;
      (_b = this.onChange) == null ? void 0 : _b.call(this, this.getRatioWithValues(start, this.end));
    }
  }),
  Validate22(AND6(RATIO8, LESS_THAN3("end")), { optional: true })
], ZoomRatio.prototype, "start", 2);
__decorateClass([
  ActionOnSet7({
    changeValue(end) {
      var _a2, _b;
      (_a2 = this.initialEnd) != null ? _a2 : this.initialEnd = end;
      (_b = this.onChange) == null ? void 0 : _b.call(this, this.getRatioWithValues(this.start, end));
    }
  }),
  Validate22(AND6(RATIO8, GREATER_THAN4("start")), { optional: true })
], ZoomRatio.prototype, "end", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomScrollPanner.ts
var import_ag_charts_community40 = require("ag-charts-community");
var DELTA_SCALE = 200;
var ZoomScrollPanner = class {
  update(event, step, bbox, zooms) {
    const deltaX = event.deltaX * step * DELTA_SCALE;
    return this.translateZooms(bbox, zooms, deltaX);
  }
  translateZooms(bbox, currentZooms, deltaX) {
    const newZooms = {};
    const offset = pointToRatio(bbox, bbox.x + Math.abs(deltaX), 0);
    const offsetX = deltaX < 0 ? -offset.x : offset.x;
    for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
      if (direction !== import_ag_charts_community40._ModuleSupport.ChartAxisDirection.X)
        continue;
      let zoom = definedZoomState({ x: currentZoom });
      zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), 0));
      newZooms[axisId] = { direction, zoom: zoom.x };
    }
    return newZooms;
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoomScroller.ts
var ZoomScroller = class {
  update(event, step, anchorPointX, anchorPointY, isScalingX, isScalingY, bbox, currentZoom) {
    const oldZoom = definedZoomState(currentZoom);
    const sourceEvent = event.sourceEvent;
    const dir = event.deltaY;
    let newZoom = definedZoomState(oldZoom);
    newZoom.x.max += isScalingX ? step * dir * dx(oldZoom) : 0;
    newZoom.y.max += isScalingY ? step * dir * dy(oldZoom) : 0;
    if (anchorPointX === "pointer" && isScalingX || anchorPointY === "pointer" && isScalingY) {
      newZoom = this.scaleZoomToPointer(sourceEvent, isScalingX, isScalingY, bbox, oldZoom, newZoom);
    } else {
      if (isScalingX) {
        newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchorPointX);
      }
      if (isScalingY) {
        newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchorPointY);
      }
    }
    newZoom = constrainZoom(newZoom);
    return newZoom;
  }
  scaleZoomToPointer(sourceEvent, isScalingX, isScalingY, bbox, oldZoom, newZoom) {
    var _a2, _b;
    const origin = pointToRatio(
      bbox,
      (_a2 = sourceEvent.offsetX) != null ? _a2 : sourceEvent.clientX,
      (_b = sourceEvent.offsetY) != null ? _b : sourceEvent.clientY
    );
    newZoom.x = isScalingX ? scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x) : newZoom.x;
    newZoom.y = isScalingY ? scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y) : newZoom.y;
    return newZoom;
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoomSelector.ts
var ZoomSelector = class {
  constructor(rect) {
    this.rect = rect;
    this.rect.visible = false;
  }
  update(event, minRatioX, minRatioY, isScalingX, isScalingY, bbox, currentZoom) {
    this.rect.visible = true;
    this.updateCoords(
      event.offsetX,
      event.offsetY,
      minRatioX,
      minRatioY,
      isScalingX,
      isScalingY,
      bbox,
      currentZoom
    );
    this.updateRect(bbox);
  }
  stop(innerBBox, bbox, currentZoom) {
    let zoom = definedZoomState();
    if (!innerBBox || !bbox)
      return zoom;
    if (this.coords) {
      zoom = this.createZoomFromCoords(bbox, currentZoom);
    }
    const multiplyX = bbox.width / innerBBox.width;
    const multiplyY = bbox.height / innerBBox.height;
    zoom = constrainZoom(multiplyZoom(zoom, multiplyX, multiplyY));
    this.reset();
    return zoom;
  }
  reset() {
    this.coords = void 0;
    this.rect.visible = false;
  }
  didUpdate() {
    return this.rect.visible;
  }
  updateCoords(x, y, minRatioX, minRatioY, isScalingX, isScalingY, bbox, currentZoom) {
    if (!this.coords) {
      this.coords = { x1: x, y1: y, x2: x, y2: y };
      return;
    }
    this.coords.x2 = x;
    this.coords.y2 = y;
    if (!bbox)
      return;
    const zoom = definedZoomState(currentZoom);
    const normal = this.getNormalisedDimensions();
    const aspectRatio = bbox.width / bbox.height;
    const scaleX = zoom.x.max - zoom.x.min;
    const scaleY = zoom.y.max - zoom.y.min;
    const xRatio = minRatioX / scaleX;
    const yRatio = minRatioY / scaleY;
    if (normal.width / bbox.width < xRatio) {
      if (this.coords.x2 < this.coords.x1) {
        this.coords.x2 = this.coords.x1 - bbox.width * xRatio;
      } else {
        this.coords.x2 = this.coords.x1 + bbox.width * xRatio;
      }
    }
    if (isScalingY && !isScalingX) {
      if (normal.height / bbox.height < yRatio) {
        if (this.coords.y2 < this.coords.y1) {
          this.coords.y2 = this.coords.y1 - bbox.width * xRatio;
        } else {
          this.coords.y2 = this.coords.y1 + bbox.height * yRatio;
        }
      }
    } else if (this.coords.y2 < this.coords.y1) {
      this.coords.y2 = Math.min(
        this.coords.y1 - normal.width / aspectRatio,
        this.coords.y1 - bbox.height * yRatio
      );
    } else {
      this.coords.y2 = Math.max(
        this.coords.y1 + normal.width / aspectRatio,
        this.coords.y1 + bbox.height * yRatio
      );
    }
    if (!isScalingX) {
      this.coords.x1 = bbox.x;
      this.coords.x2 = bbox.x + bbox.width;
    }
    if (!isScalingY) {
      this.coords.y1 = bbox.y;
      this.coords.y2 = bbox.y + bbox.height;
    }
  }
  updateRect(bbox) {
    if (!bbox)
      return;
    const { rect } = this;
    const normal = this.getNormalisedDimensions();
    const { width, height } = normal;
    let { x, y } = normal;
    x = Math.max(x, bbox.x);
    x -= Math.max(0, x + width - (bbox.x + bbox.width));
    y = Math.max(y, bbox.y);
    y -= Math.max(0, y + height - (bbox.y + bbox.height));
    rect.x = x;
    rect.y = y;
    rect.width = width;
    rect.height = height;
  }
  createZoomFromCoords(bbox, currentZoom) {
    const oldZoom = definedZoomState(currentZoom);
    const normal = this.getNormalisedDimensions();
    const origin = pointToRatio(bbox, normal.x, normal.y + normal.height);
    const xFactor = normal.width / bbox.width;
    const yFactor = normal.height / bbox.height;
    let newZoom = scaleZoom(oldZoom, xFactor, yFactor);
    const translateX = origin.x * (oldZoom.x.max - oldZoom.x.min);
    const translateY = origin.y * (oldZoom.y.max - oldZoom.y.min);
    newZoom = translateZoom(newZoom, translateX, translateY);
    newZoom = constrainZoom(newZoom);
    return newZoom;
  }
  getNormalisedDimensions() {
    var _a2;
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = (_a2 = this.coords) != null ? _a2 : {};
    const x = x1 <= x2 ? x1 : x2;
    const y = y1 <= y2 ? y1 : y2;
    const width = x1 <= x2 ? x2 - x1 : x1 - x2;
    const height = y1 <= y2 ? y2 - y1 : y1 - y2;
    return { x, y, width, height };
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoom.ts
var {
  BOOLEAN: BOOLEAN12,
  NUMBER: NUMBER7,
  RATIO: RATIO9,
  UNION: UNION4,
  ActionOnSet: ActionOnSet8,
  ChartAxisDirection: ChartAxisDirection7,
  ChartUpdateType: ChartUpdateType2,
  Validate: Validate23,
  round: sharedRound
} = import_ag_charts_community41._ModuleSupport;
var round = (value) => sharedRound(value, 10);
var ANCHOR_CORD = UNION4(["pointer", "start", "middle", "end"], "an anchor cord");
var CONTEXT_ZOOM_ACTION_ID = "zoom-action";
var CONTEXT_PAN_ACTION_ID = "pan-action";
var CURSOR_ID = "zoom-cursor";
var TOOLTIP_ID = "zoom-tooltip";
var Zoom = class extends import_ag_charts_community41._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = false;
    this.enableAxisDragging = true;
    this.enableDoubleClickToReset = true;
    this.enablePanning = true;
    this.enableScrolling = true;
    this.enableSelecting = false;
    this.panKey = "alt";
    this.axes = "x";
    this.scrollingStep = (UNIT.max - UNIT.min) / 10;
    this.minVisibleItemsX = 2;
    this.minVisibleItemsY = 2;
    this.anchorPointX = "end";
    this.anchorPointY = "middle";
    this.rangeX = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection7.X));
    this.rangeY = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection7.Y));
    this.ratioX = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection7.X));
    this.ratioY = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection7.Y));
    // Zoom methods
    this.axisDragger = new ZoomAxisDragger();
    this.panner = new ZoomPanner();
    this.scroller = new ZoomScroller();
    this.scrollPanner = new ZoomScrollPanner();
    // State
    this.dragState = 0 /* None */;
    this.minRatioX = 0;
    this.minRatioY = 0;
    // TODO: This will become an option soon, and I don't want to delete my code in the meantime
    this.enableSecondaryAxis = false;
    this.scene = ctx.scene;
    this.cursorManager = ctx.cursorManager;
    this.highlightManager = ctx.highlightManager;
    this.tooltipManager = ctx.tooltipManager;
    this.zoomManager = ctx.zoomManager;
    this.updateService = ctx.updateService;
    this.contextMenuRegistry = ctx.contextMenuRegistry;
    this.toolbarManager = ctx.toolbarManager;
    const selectionRect = new ZoomRect();
    this.selector = new ZoomSelector(selectionRect);
    const { Default: Default5, ZoomDrag, Animation: Animation2 } = import_ag_charts_community41._ModuleSupport.InteractionState;
    const draggableState = Default5 | Animation2 | ZoomDrag;
    const clickableState = Default5 | Animation2;
    const region = ctx.regionManager.getRegion("series");
    this.destroyFns.push(
      this.scene.attachNode(selectionRect),
      region.addListener("dblclick", (event) => this.onDoubleClick(event), clickableState),
      region.addListener("drag", (event) => this.onDrag(event), draggableState),
      region.addListener("drag-start", (event) => this.onDragStart(event), draggableState),
      region.addListener("drag-end", () => this.onDragEnd(), draggableState),
      region.addListener("wheel", (event) => this.onWheel(event), clickableState),
      region.addListener("hover", () => this.onAxisLeave(), clickableState),
      region.addListener("leave", () => this.onAxisLeave(), clickableState),
      ctx.chartEventManager.addListener("axis-hover", (event) => this.onAxisHover(event)),
      ctx.gestureDetector.addListener("pinch-move", (event) => this.onPinchMove(event)),
      ctx.toolbarManager.addListener("button-pressed", (event) => this.onToolbarButtonPress(event)),
      ctx.layoutService.addListener("layout-complete", (event) => this.onLayoutComplete(event)),
      ctx.updateService.addListener("update-complete", (event) => this.onUpdateComplete(event)),
      ctx.zoomManager.addListener("zoom-change", () => this.onZoomChange())
    );
  }
  registerContextMenuActions() {
    this.contextMenuRegistry.registerDefaultAction({
      id: CONTEXT_ZOOM_ACTION_ID,
      label: "Zoom to here",
      action: (params) => this.onContextMenuZoomToHere(params)
    });
    this.contextMenuRegistry.registerDefaultAction({
      id: CONTEXT_PAN_ACTION_ID,
      label: "Pan to here",
      action: (params) => this.onContextMenuPanToHere(params)
    });
    const zoom = definedZoomState(this.zoomManager.getZoom());
    this.toggleContextMenuActions(zoom);
  }
  addToolbarButtons() {
    for (const [range2] of RANGES.entries()) {
      this.toolbarManager.addButton(range2, {
        label: range2
      });
    }
  }
  removeToolbarButtons() {
    for (const [range2] of RANGES.entries()) {
      this.toolbarManager.removeButton(range2);
    }
  }
  toggleContextMenuActions(zoom) {
    if (this.isMinZoom(zoom)) {
      this.contextMenuRegistry.disableAction(CONTEXT_ZOOM_ACTION_ID);
    } else {
      this.contextMenuRegistry.enableAction(CONTEXT_ZOOM_ACTION_ID);
    }
    if (this.isMaxZoom(zoom)) {
      this.contextMenuRegistry.disableAction(CONTEXT_PAN_ACTION_ID);
    } else {
      this.contextMenuRegistry.enableAction(CONTEXT_PAN_ACTION_ID);
    }
  }
  onRangeChange(direction, rangeZoom) {
    if (!rangeZoom)
      return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    zoom[direction] = rangeZoom;
    this.updateZoom(constrainZoom(zoom));
  }
  onRatioChange(direction, ratioZoom) {
    if (!ratioZoom)
      return;
    let x = this.ratioX.getRatio();
    let y = this.ratioY.getRatio();
    if (direction === ChartAxisDirection7.X) {
      x = ratioZoom;
    } else {
      y = ratioZoom;
    }
    const newZoom = constrainZoom(definedZoomState({ x, y }));
    this.updateZoom(newZoom);
  }
  onDoubleClick(event) {
    var _a2, _b, _c, _d, _e;
    if (!this.enabled || !this.enableDoubleClickToReset)
      return;
    const x = (_b = (_a2 = this.rangeX.getInitialRange()) != null ? _a2 : this.ratioX.getInitialRatio()) != null ? _b : UNIT;
    const y = (_d = (_c = this.rangeY.getInitialRange()) != null ? _c : this.ratioY.getInitialRatio()) != null ? _d : UNIT;
    const { min: minX, max: maxX } = x;
    const { min: minY, max: maxY } = y;
    if (this.hoveredAxis) {
      const { id, direction } = this.hoveredAxis;
      const axisZoom = direction === ChartAxisDirection7.X ? { min: minX, max: maxX } : { min: minY, max: maxY };
      this.updateAxisZoom(id, direction, axisZoom);
    } else if (((_e = this.paddedRect) == null ? void 0 : _e.containsPoint(event.offsetX, event.offsetY)) && this.highlightManager.getActivePicked() == null) {
      this.updateZoom({
        x: { min: minX, max: maxX },
        y: { min: minY, max: maxY }
      });
    }
  }
  onDragStart(event) {
    if (!this.enabled || !this.paddedRect)
      return;
    let newDragState = 0 /* None */;
    if (this.enableAxisDragging && this.hoveredAxis) {
      newDragState = 1 /* Axis */;
    } else if (this.paddedRect.containsPoint(event.offsetX, event.offsetY)) {
      const panKeyPressed = this.isPanningKeyPressed(event.sourceEvent);
      if (this.enablePanning && (!this.enableSelecting || panKeyPressed)) {
        this.cursorManager.updateCursor(CURSOR_ID, "grabbing");
        newDragState = 2 /* Pan */;
      } else {
        const fullyZoomedIn = this.isMinZoom(definedZoomState(this.zoomManager.getZoom()));
        if (!fullyZoomedIn && !panKeyPressed) {
          newDragState = 3 /* Select */;
        }
      }
    }
    if ((this.dragState = newDragState) !== 0 /* None */) {
      this.zoomManager.fireZoomPanStartEvent();
    }
  }
  onDrag(event) {
    if (!this.enabled || !this.paddedRect || !this.seriesRect)
      return;
    this.ctx.interactionManager.pushState(import_ag_charts_community41._ModuleSupport.InteractionState.ZoomDrag);
    const zoom = definedZoomState(this.zoomManager.getZoom());
    switch (this.dragState) {
      case 1 /* Axis */:
        if (!this.hoveredAxis)
          break;
        const { id: axisId, direction } = this.hoveredAxis;
        const anchor = direction === import_ag_charts_community41._ModuleSupport.ChartAxisDirection.X ? this.anchorPointX : this.anchorPointY;
        const axisZoom = this.zoomManager.getAxisZoom(axisId);
        const newZoom = this.axisDragger.update(event, direction, anchor, this.seriesRect, zoom, axisZoom);
        this.updateAxisZoom(axisId, direction, newZoom);
        break;
      case 2 /* Pan */:
        const newZooms = this.panner.update(event, this.seriesRect, this.zoomManager.getAxisZooms());
        for (const [panAxisId, { direction: panDirection, zoom: panZoom }] of Object.entries(newZooms)) {
          this.updateAxisZoom(panAxisId, panDirection, panZoom);
        }
        break;
      case 3 /* Select */:
        this.selector.update(
          event,
          this.minRatioX,
          this.minRatioY,
          this.isScalingX(),
          this.isScalingY(),
          this.paddedRect,
          zoom
        );
        break;
      case 0 /* None */:
        return;
    }
    this.tooltipManager.updateTooltip(TOOLTIP_ID);
    this.updateService.update(ChartUpdateType2.PERFORM_LAYOUT, { skipAnimations: true });
  }
  onDragEnd() {
    this.ctx.interactionManager.popState(import_ag_charts_community41._ModuleSupport.InteractionState.ZoomDrag);
    if (!this.enabled || this.dragState === 0 /* None */)
      return;
    switch (this.dragState) {
      case 1 /* Axis */:
        this.axisDragger.stop();
        break;
      case 2 /* Pan */:
        this.panner.stop();
        break;
      case 3 /* Select */:
        if (!this.selector.didUpdate())
          break;
        const zoom = definedZoomState(this.zoomManager.getZoom());
        if (!this.isMinZoom(zoom)) {
          const newZoom = this.selector.stop(this.seriesRect, this.paddedRect, zoom);
          this.updateZoom(newZoom);
        }
        break;
    }
    this.dragState = 0 /* None */;
    this.cursorManager.updateCursor(CURSOR_ID);
    this.tooltipManager.removeTooltip(TOOLTIP_ID);
  }
  onWheel(event) {
    if (!this.enabled || !this.enableScrolling || !this.paddedRect || !this.seriesRect)
      return;
    const currentZoom = this.zoomManager.getZoom();
    const isSeriesScrolling = this.paddedRect.containsPoint(event.offsetX, event.offsetY);
    const isAxisScrolling = this.enableAxisDragging && this.hoveredAxis != null;
    let isScalingX = this.isScalingX();
    let isScalingY = this.isScalingY();
    if (isAxisScrolling) {
      isScalingX = this.hoveredAxis.direction === import_ag_charts_community41._ModuleSupport.ChartAxisDirection.X;
      isScalingY = !isScalingX;
    }
    const sourceEvent = event.sourceEvent;
    const { deltaX, deltaY } = sourceEvent;
    const isHorizontalScrolling = deltaX != null && deltaY != null && Math.abs(deltaX) > Math.abs(deltaY);
    if (this.enablePanning && isHorizontalScrolling) {
      event.consume();
      event.sourceEvent.preventDefault();
      const newZooms = this.scrollPanner.update(
        event,
        this.scrollingStep,
        this.seriesRect,
        this.zoomManager.getAxisZooms()
      );
      for (const [axisId, { direction, zoom: newZoom2 }] of Object.entries(newZooms)) {
        this.updateAxisZoom(axisId, direction, newZoom2);
      }
      return;
    }
    if (!isSeriesScrolling && !isAxisScrolling)
      return;
    event.consume();
    event.sourceEvent.preventDefault();
    const newZoom = this.scroller.update(
      event,
      this.scrollingStep,
      this.getAnchorPointX(),
      this.getAnchorPointY(),
      isScalingX,
      isScalingY,
      this.seriesRect,
      currentZoom
    );
    this.updateZoom(newZoom);
  }
  onAxisLeave() {
    if (!this.enabled)
      return;
    this.hoveredAxis = void 0;
    this.cursorManager.updateCursor(CURSOR_ID);
  }
  onAxisHover(event) {
    if (!this.enabled)
      return;
    this.hoveredAxis = {
      id: event.axisId,
      direction: event.direction
    };
    if (this.enableAxisDragging) {
      this.cursorManager.updateCursor(
        CURSOR_ID,
        event.direction === ChartAxisDirection7.X ? "ew-resize" : "ns-resize"
      );
    }
  }
  onPinchMove(event) {
    if (!this.enabled || !this.enableScrolling || !this.paddedRect || !this.seriesRect)
      return;
    const currentZoom = this.zoomManager.getZoom();
    const oldZoom = definedZoomState(currentZoom);
    const newZoom = definedZoomState(currentZoom);
    const delta3 = event.deltaDistance * -0.01;
    const origin = pointToRatio(this.seriesRect, event.origin.x, event.origin.y);
    if (this.isScalingX()) {
      newZoom.x.max += delta3 * dx(oldZoom);
      newZoom.x = scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x);
    }
    if (this.isScalingY()) {
      newZoom.y.max += delta3 * (oldZoom.y.max - oldZoom.y.min);
      newZoom.y = scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y);
    }
    this.updateZoom(constrainZoom(newZoom));
  }
  onToolbarButtonPress(event) {
    if (!RANGES.has(event.id))
      return;
    const time2 = RANGES.get(event.id);
    if (typeof time2 === "function") {
      this.rangeX.extendWith(time2);
    } else if (time2 == null) {
      this.rangeX.extendAll();
    } else {
      this.rangeX.extendToEnd(time2);
    }
  }
  onLayoutComplete(event) {
    if (!this.enabled)
      return;
    const {
      series: { rect, paddedRect, shouldFlipXY },
      axes
    } = event;
    this.seriesRect = rect;
    this.paddedRect = paddedRect;
    this.shouldFlipXY = shouldFlipXY;
    if (!axes)
      return;
    const [axesX, axesY] = import_ag_charts_community41._Util.bifurcate((axis) => axis.direction === ChartAxisDirection7.X, axes);
    const rangeXAxisChanged = this.rangeX.updateAxis(axesX);
    const rangeYAxisChanged = this.rangeY.updateAxis(axesY);
    if (!rangeXAxisChanged && !rangeYAxisChanged)
      return;
    const newZoom = {};
    newZoom.x = this.rangeX.getRange();
    newZoom.y = this.rangeY.getRange();
    if (newZoom.x != null || newZoom.y != null) {
      this.updateZoom(constrainZoom(definedZoomState(newZoom)));
    }
  }
  onUpdateComplete({ minRect, minVisibleRect }) {
    if (!this.enabled || !this.paddedRect || !minRect || !minVisibleRect)
      return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const minVisibleItemsWidth = this.shouldFlipXY ? this.minVisibleItemsY : this.minVisibleItemsX;
    const minVisibleItemsHeight = this.shouldFlipXY ? this.minVisibleItemsX : this.minVisibleItemsY;
    const widthRatio = minVisibleRect.width * minVisibleItemsWidth / this.paddedRect.width;
    const heightRatio = minVisibleRect.height * minVisibleItemsHeight / this.paddedRect.height;
    const ratioX = round(widthRatio * dx(zoom));
    const ratioY = round(heightRatio * dy(zoom));
    if (this.isScalingX()) {
      this.minRatioX = Math.min(1, ratioX);
    }
    if (this.isScalingY()) {
      this.minRatioY = Math.min(1, ratioY);
    }
    this.minRatioX || (this.minRatioX = this.minRatioY || 0);
    this.minRatioY || (this.minRatioY = this.minRatioX || 0);
  }
  onContextMenuZoomToHere({ event }) {
    if (!this.enabled || !this.paddedRect || !event || !event.target)
      return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const origin = pointToRatio(this.paddedRect, event.clientX, event.clientY);
    const scaledOriginX = origin.x * dx(zoom);
    const scaledOriginY = origin.y * dy(zoom);
    const size = UNIT.max - UNIT.min;
    const halfSize = size / 2;
    let newZoom = {
      x: { min: origin.x - halfSize, max: origin.x + halfSize },
      y: { min: origin.y - halfSize, max: origin.y + halfSize }
    };
    newZoom = scaleZoomCenter(
      newZoom,
      this.isScalingX() ? this.minRatioX : size,
      this.isScalingY() ? this.minRatioY : size
    );
    newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);
    this.updateZoom(constrainZoom(newZoom));
  }
  onContextMenuPanToHere({ event }) {
    if (!this.enabled || !this.paddedRect || !event || !event.target)
      return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const origin = pointToRatio(this.paddedRect, event.clientX, event.clientY);
    const scaleX = dx(zoom);
    const scaleY = dy(zoom);
    const scaledOriginX = origin.x * scaleX;
    const scaledOriginY = origin.y * scaleY;
    const halfSize = (UNIT.max - UNIT.min) / 2;
    let newZoom = {
      x: { min: origin.x - halfSize, max: origin.x + halfSize },
      y: { min: origin.y - halfSize, max: origin.y + halfSize }
    };
    newZoom = scaleZoomCenter(newZoom, scaleX, scaleY);
    newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);
    this.updateZoom(constrainZoom(newZoom));
  }
  onZoomChange() {
    this.toggleContextMenuActions(definedZoomState(this.zoomManager.getZoom()));
  }
  isPanningKeyPressed(event) {
    switch (this.panKey) {
      case "alt":
        return event.altKey;
      case "ctrl":
        return event.ctrlKey;
      case "shift":
        return event.shiftKey;
      case "meta":
        return event.metaKey;
    }
  }
  isScalingX() {
    if (this.axes === "xy")
      return true;
    return this.shouldFlipXY ? this.axes === "y" : this.axes === "x";
  }
  isScalingY() {
    if (this.axes === "xy")
      return true;
    return this.shouldFlipXY ? this.axes === "x" : this.axes === "y";
  }
  getAnchorPointX() {
    return this.shouldFlipXY ? this.anchorPointY : this.anchorPointX;
  }
  getAnchorPointY() {
    return this.shouldFlipXY ? this.anchorPointX : this.anchorPointY;
  }
  isMinZoom(zoom) {
    const isMinXZoom = round(dx(zoom)) <= this.minRatioX;
    const isMinYZoom = round(dy(zoom)) <= this.minRatioY;
    return isMinXZoom || isMinYZoom;
  }
  isMaxZoom(zoom) {
    return zoom.x.min === UNIT.min && zoom.x.max === UNIT.max && zoom.y.min === UNIT.min && zoom.y.max === UNIT.max;
  }
  updateZoom(zoom) {
    const dx_ = dx(zoom);
    const dy_ = dy(zoom);
    const oldZoom = definedZoomState(this.zoomManager.getZoom());
    const zoomedInTooFarX = dx_ <= dx(oldZoom) && dx_ < this.minRatioX;
    const zoomedInTooFarY = dy_ <= dy(oldZoom) && dy_ < this.minRatioY;
    if (zoomedInTooFarX) {
      zoom.x = constrainAxisWithOld(zoom.x, oldZoom.x, this.minRatioX);
    }
    if (zoomedInTooFarY) {
      zoom.y = constrainAxisWithOld(zoom.y, oldZoom.y, this.minRatioY);
    }
    this.zoomManager.updateZoom("zoom", zoom);
  }
  updateAxisZoom(axisId, direction, partialZoom) {
    if (!partialZoom)
      return;
    if (!this.enableSecondaryAxis) {
      const fullZoom = definedZoomState(this.zoomManager.getZoom());
      fullZoom[direction] = partialZoom;
      this.updateZoom(fullZoom);
      return;
    }
    const d = partialZoom.max - partialZoom.min;
    const minRatio = direction === ChartAxisDirection7.X ? this.minRatioX : this.minRatioY;
    if (d < minRatio)
      return;
    this.zoomManager.updateAxisZoom("zoom", axisId, partialZoom);
  }
};
__decorateClass([
  ActionOnSet8({
    newValue(newValue) {
      if (newValue) {
        this.registerContextMenuActions();
        this.addToolbarButtons();
      } else if (this.enabled) {
        this.removeToolbarButtons();
      }
    }
  }),
  Validate23(BOOLEAN12)
], Zoom.prototype, "enabled", 2);
__decorateClass([
  Validate23(BOOLEAN12)
], Zoom.prototype, "enableAxisDragging", 2);
__decorateClass([
  Validate23(BOOLEAN12)
], Zoom.prototype, "enableDoubleClickToReset", 2);
__decorateClass([
  Validate23(BOOLEAN12)
], Zoom.prototype, "enablePanning", 2);
__decorateClass([
  Validate23(BOOLEAN12)
], Zoom.prototype, "enableScrolling", 2);
__decorateClass([
  Validate23(BOOLEAN12)
], Zoom.prototype, "enableSelecting", 2);
__decorateClass([
  Validate23(UNION4(["alt", "ctrl", "meta", "shift"], "a pan key"))
], Zoom.prototype, "panKey", 2);
__decorateClass([
  Validate23(UNION4(["x", "y", "xy"], "an axis"))
], Zoom.prototype, "axes", 2);
__decorateClass([
  Validate23(RATIO9)
], Zoom.prototype, "scrollingStep", 2);
__decorateClass([
  Validate23(NUMBER7.restrict({ min: 1 }))
], Zoom.prototype, "minVisibleItemsX", 2);
__decorateClass([
  Validate23(NUMBER7.restrict({ min: 1 }))
], Zoom.prototype, "minVisibleItemsY", 2);
__decorateClass([
  Validate23(ANCHOR_CORD)
], Zoom.prototype, "anchorPointX", 2);
__decorateClass([
  Validate23(ANCHOR_CORD)
], Zoom.prototype, "anchorPointY", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomModule.ts
var ZoomModule = {
  type: "root",
  optionsKey: "zoom",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  instanceConstructor: Zoom,
  themeTemplate: {
    zoom: {
      anchorPointX: "end",
      anchorPointY: "middle",
      axes: "x",
      enabled: false,
      enableAxisDragging: true,
      enableDoubleClickToReset: true,
      enablePanning: true,
      enableScrolling: true,
      enableSelecting: false,
      minVisibleItemsX: 2,
      minVisibleItemsY: 2,
      panKey: "alt",
      scrollingStep: 0.1
    }
  }
};

// packages/ag-charts-enterprise/src/gradient-legend/gradientLegendModule.ts
var import_ag_charts_community43 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/gradient-legend/gradientLegend.ts
var import_ag_charts_community42 = require("ag-charts-community");
var {
  BOOLEAN: BOOLEAN13,
  Layers: Layers5,
  POSITION,
  Validate: Validate24,
  Default: Default4,
  MIN_SPACING: MIN_SPACING3,
  POSITIVE_NUMBER: POSITIVE_NUMBER7,
  ProxyProperty: ProxyProperty2,
  DeprecatedAndRenamedTo
} = import_ag_charts_community42._ModuleSupport;
var { BBox: BBox5, Group: Group5, Rect, LinearGradientFill, Triangle } = import_ag_charts_community42._Scene;
var { createId: createId3, Logger: Logger3 } = import_ag_charts_community42._Util;
var GradientBar = class {
  constructor() {
    this.thickness = 16;
    this.preferredLength = 100;
  }
};
__decorateClass([
  Validate24(POSITIVE_NUMBER7)
], GradientBar.prototype, "thickness", 2);
__decorateClass([
  Validate24(POSITIVE_NUMBER7)
], GradientBar.prototype, "preferredLength", 2);
var GradientLegendAxisTick = class extends import_ag_charts_community42._ModuleSupport.AxisTick {
  constructor() {
    super(...arguments);
    this.enabled = false;
    this.size = 0;
    this.maxSpacing = NaN;
  }
};
__decorateClass([
  Validate24(MIN_SPACING3),
  Default4(NaN)
], GradientLegendAxisTick.prototype, "maxSpacing", 2);
var GradientLegendAxis = class extends import_ag_charts_community42._ModuleSupport.CartesianAxis {
  constructor(ctx) {
    super(ctx, new import_ag_charts_community42._Scale.LinearScale(), { respondsToZoom: false });
    this.colorDomain = [];
    this.nice = false;
    this.line.enabled = false;
  }
  calculateDomain() {
    this.setDomain(this.colorDomain);
  }
  formatDatum(datum) {
    if (typeof datum === "number") {
      return datum.toFixed(2);
    } else {
      Logger3.warnOnce(
        "data contains Date objects which are being plotted against a number axis, please only use a number axis for numbers."
      );
      return String(datum);
    }
  }
  createTick() {
    return new GradientLegendAxisTick();
  }
};
var GradientLegendLabel = class {
  constructor(label) {
    this.label = label;
  }
};
__decorateClass([
  ProxyProperty2("label.fontStyle")
], GradientLegendLabel.prototype, "fontStyle", 2);
__decorateClass([
  ProxyProperty2("label.fontWeight")
], GradientLegendLabel.prototype, "fontWeight", 2);
__decorateClass([
  ProxyProperty2("label.fontSize")
], GradientLegendLabel.prototype, "fontSize", 2);
__decorateClass([
  ProxyProperty2("label.fontFamily")
], GradientLegendLabel.prototype, "fontFamily", 2);
__decorateClass([
  ProxyProperty2("label.color")
], GradientLegendLabel.prototype, "color", 2);
__decorateClass([
  ProxyProperty2("label.format")
], GradientLegendLabel.prototype, "format", 2);
__decorateClass([
  ProxyProperty2("label.formatter")
], GradientLegendLabel.prototype, "formatter", 2);
var GradientLegendInterval = class {
  constructor(tick) {
    this.tick = tick;
  }
};
__decorateClass([
  ProxyProperty2("tick.values")
], GradientLegendInterval.prototype, "values", 2);
__decorateClass([
  ProxyProperty2("tick.minSpacing")
], GradientLegendInterval.prototype, "minSpacing", 2);
__decorateClass([
  ProxyProperty2("tick.maxSpacing")
], GradientLegendInterval.prototype, "maxSpacing", 2);
__decorateClass([
  ProxyProperty2("tick.interval")
], GradientLegendInterval.prototype, "step", 2);
var GradientLegendScale = class {
  constructor(axis) {
    this.axis = axis;
    this.label = new GradientLegendLabel(axis.label);
    this.interval = new GradientLegendInterval(axis.tick);
  }
};
__decorateClass([
  ProxyProperty2("axis.seriesAreaPadding")
], GradientLegendScale.prototype, "padding", 2);
var GradientLegend = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.id = createId3(this);
    this.group = new Group5({ name: "legend", layer: true, zIndex: Layers5.LEGEND_ZINDEX });
    this.gradient = new GradientBar();
    this.destroyFns = [];
    this.enabled = false;
    this.position = "bottom";
    this.reverseOrder = void 0;
    // Placeholder
    this.pagination = void 0;
    this.spacing = 20;
    this.data = [];
    this.listeners = {};
    this.latestGradientBox = void 0;
    this.layoutService = ctx.layoutService;
    this.destroyFns.push(this.layoutService.addListener("start-layout", (e) => this.update(e.shrinkRect)));
    this.highlightManager = ctx.highlightManager;
    this.destroyFns.push(this.highlightManager.addListener("highlight-change", () => this.onChartHoverChange()));
    this.gradientRect = new Rect();
    this.gradientFill = new LinearGradientFill();
    this.gradientFill.mask = this.gradientRect;
    this.group.append(this.gradientFill);
    this.arrow = new Triangle();
    this.group.append(this.arrow);
    this.axisGridGroup = new Group5({ name: "legend-axis-grid-group" });
    this.group.append(this.axisGridGroup);
    this.axisGroup = new Group5({ name: "legend-axis-group" });
    this.group.append(this.axisGroup);
    this.axis = new GradientLegendAxis(ctx);
    this.axis.attachAxis(this.axisGroup, this.axisGridGroup);
    this.scale = new GradientLegendScale(this.axis);
    this.stop = this.scale;
    this.destroyFns.push(() => this.detachLegend());
  }
  getOrientation() {
    switch (this.position) {
      case "right":
      case "left":
        return "vertical";
      case "bottom":
      case "top":
        return "horizontal";
    }
  }
  destroy() {
    this.destroyFns.forEach((f) => f());
  }
  attachLegend(scene) {
    scene.appendChild(this.group);
  }
  detachLegend() {
    var _a2;
    (_a2 = this.group.parent) == null ? void 0 : _a2.removeChild(this.group);
  }
  update(shrinkRect) {
    const data = this.data[0];
    if (!this.enabled || !data || !data.enabled) {
      this.group.visible = false;
      return { shrinkRect: shrinkRect.clone() };
    }
    const { colorRange } = this.normalizeColorArrays(data);
    const gradientBox = this.updateGradientRect(shrinkRect, colorRange);
    const axisBox = this.updateAxis(data, gradientBox);
    const { newShrinkRect, translateX, translateY } = this.getMeasurements(shrinkRect, gradientBox, axisBox);
    this.updateArrow(gradientBox);
    this.group.visible = true;
    this.group.translationX = translateX;
    this.group.translationY = translateY;
    this.latestGradientBox = gradientBox;
    return { shrinkRect: newShrinkRect };
  }
  normalizeColorArrays(data) {
    let colorDomain = data.colorDomain.slice();
    const colorRange = data.colorRange.slice();
    if (colorDomain.length === colorRange.length) {
      return { colorDomain, colorRange };
    }
    if (colorDomain.length > colorRange.length) {
      colorRange.splice(colorDomain.length);
    }
    const count = colorRange.length;
    colorDomain = colorRange.map((_, i) => {
      const [d0, d1] = colorDomain;
      if (i === 0)
        return d0;
      if (i === count - 1)
        return d1;
      return d0 + (d1 - d0) * i / (count - 1);
    });
    return { colorDomain, colorRange };
  }
  updateGradientRect(shrinkRect, colorRange) {
    const { preferredLength: gradientLength, thickness } = this.gradient;
    const gradientBox = new BBox5(0, 0, 0, 0);
    const vertical = this.getOrientation() === "vertical";
    if (vertical) {
      const maxHeight = shrinkRect.height;
      const preferredHeight = gradientLength;
      gradientBox.x = 0;
      gradientBox.y = 0;
      gradientBox.width = thickness;
      gradientBox.height = Math.min(maxHeight, preferredHeight);
    } else {
      const maxWidth = shrinkRect.width;
      const preferredWidth = gradientLength;
      gradientBox.x = 0;
      gradientBox.y = 0;
      gradientBox.width = Math.min(maxWidth, preferredWidth);
      gradientBox.height = thickness;
    }
    if (this.reverseOrder) {
      colorRange = colorRange.slice().reverse();
    }
    this.gradientFill.stops = colorRange;
    this.gradientFill.direction = vertical ? "to-bottom" : "to-right";
    this.gradientRect.x = gradientBox.x;
    this.gradientRect.y = gradientBox.y;
    this.gradientRect.width = gradientBox.width;
    this.gradientRect.height = gradientBox.height;
    return gradientBox;
  }
  updateAxis(data, gradientBox) {
    const { reverseOrder, axis } = this;
    const vertical = this.getOrientation() === "vertical";
    axis.position = vertical ? "right" : "bottom";
    axis.colorDomain = reverseOrder ? data.colorDomain.slice().reverse() : data.colorDomain;
    axis.calculateDomain();
    axis.range = vertical ? [0, gradientBox.height] : [0, gradientBox.width];
    axis.gridLength = 0;
    axis.translation.x = gradientBox.x + (vertical ? gradientBox.width : 0);
    axis.translation.y = gradientBox.y + (vertical ? 0 : gradientBox.height);
    const axisBox = axis.calculateLayout().bbox;
    axis.update();
    return axisBox;
  }
  updateArrow(gradientBox) {
    var _a2;
    const {
      arrow,
      axis: { label, scale }
    } = this;
    const highlighted = this.highlightManager.getActiveHighlight();
    const colorValue = highlighted == null ? void 0 : highlighted.colorValue;
    if (highlighted == null || colorValue == null) {
      arrow.visible = false;
      return;
    }
    const vertical = this.getOrientation() === "vertical";
    const size = (_a2 = label.fontSize) != null ? _a2 : 0;
    const t = scale.convert(colorValue);
    let x;
    let y;
    let rotation;
    if (vertical) {
      x = gradientBox.x - size / 2;
      y = gradientBox.y + t;
      rotation = Math.PI / 2;
    } else {
      x = gradientBox.x + t;
      y = gradientBox.y - size / 2;
      rotation = Math.PI;
    }
    arrow.fill = label.color;
    arrow.size = size;
    arrow.translationX = x;
    arrow.translationY = y;
    arrow.rotation = rotation;
    arrow.visible = true;
  }
  getMeasurements(shrinkRect, gradientBox, axisBox) {
    let width;
    let height;
    const vertical = this.getOrientation() === "vertical";
    if (vertical) {
      width = gradientBox.width + axisBox.width;
      height = gradientBox.height;
    } else {
      width = gradientBox.width;
      height = gradientBox.height + axisBox.height;
    }
    const { spacing } = this;
    const newShrinkRect = shrinkRect.clone();
    let left;
    let top;
    if (this.position === "left") {
      left = shrinkRect.x;
      top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
      newShrinkRect.shrink(width + spacing, "left");
    } else if (this.position === "right") {
      left = shrinkRect.x + shrinkRect.width - width;
      top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
      newShrinkRect.shrink(width + spacing, "right");
    } else if (this.position === "top") {
      left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
      top = shrinkRect.y;
      newShrinkRect.shrink(height + spacing, "top");
    } else {
      left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
      top = shrinkRect.y + shrinkRect.height - height;
      newShrinkRect.shrink(height + spacing, "bottom");
    }
    return {
      translateX: left,
      translateY: top,
      gradientBox,
      newShrinkRect
    };
  }
  computeBBox() {
    return this.group.computeBBox();
  }
  onChartHoverChange() {
    if (this.enabled && this.latestGradientBox != null) {
      this.updateArrow(this.latestGradientBox);
    }
  }
};
GradientLegend.className = "GradientLegend";
__decorateClass([
  Validate24(BOOLEAN13)
], GradientLegend.prototype, "enabled", 2);
__decorateClass([
  Validate24(POSITION)
], GradientLegend.prototype, "position", 2);
__decorateClass([
  Validate24(BOOLEAN13, { optional: true })
], GradientLegend.prototype, "reverseOrder", 2);
__decorateClass([
  Validate24(POSITIVE_NUMBER7)
], GradientLegend.prototype, "spacing", 2);
__decorateClass([
  DeprecatedAndRenamedTo("scale")
], GradientLegend.prototype, "stop", 2);

// packages/ag-charts-enterprise/src/gradient-legend/gradientLegendModule.ts
var GradientLegendModule = {
  type: "legend",
  optionsKey: "gradientLegend",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy", "topology"],
  identifier: "gradient",
  instanceConstructor: GradientLegend,
  themeTemplate: {
    enabled: false,
    position: "bottom",
    spacing: 20,
    scale: {
      padding: 8,
      label: {
        color: import_ag_charts_community43._Theme.DEFAULT_LABEL_COLOUR,
        fontStyle: void 0,
        fontWeight: void 0,
        fontSize: 12,
        fontFamily: import_ag_charts_community43._Theme.DEFAULT_FONT_FAMILY,
        formatter: void 0
      },
      interval: {
        minSpacing: 1
      }
    },
    gradient: {
      preferredLength: 100,
      thickness: 16
    },
    reverseOrder: false
  }
};

// packages/ag-charts-enterprise/src/license/md5.ts
var MD5 = class {
  constructor() {
    this.ieCompatibility = false;
  }
  init() {
    this.ieCompatibility = this.md5("hello") != "5d41402abc4b2a76b9719d911017c592";
  }
  md5cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = this.ff(a, b, c, d, k[0], 7, -680876936);
    d = this.ff(d, a, b, c, k[1], 12, -389564586);
    c = this.ff(c, d, a, b, k[2], 17, 606105819);
    b = this.ff(b, c, d, a, k[3], 22, -1044525330);
    a = this.ff(a, b, c, d, k[4], 7, -176418897);
    d = this.ff(d, a, b, c, k[5], 12, 1200080426);
    c = this.ff(c, d, a, b, k[6], 17, -1473231341);
    b = this.ff(b, c, d, a, k[7], 22, -45705983);
    a = this.ff(a, b, c, d, k[8], 7, 1770035416);
    d = this.ff(d, a, b, c, k[9], 12, -1958414417);
    c = this.ff(c, d, a, b, k[10], 17, -42063);
    b = this.ff(b, c, d, a, k[11], 22, -1990404162);
    a = this.ff(a, b, c, d, k[12], 7, 1804603682);
    d = this.ff(d, a, b, c, k[13], 12, -40341101);
    c = this.ff(c, d, a, b, k[14], 17, -1502002290);
    b = this.ff(b, c, d, a, k[15], 22, 1236535329);
    a = this.gg(a, b, c, d, k[1], 5, -165796510);
    d = this.gg(d, a, b, c, k[6], 9, -1069501632);
    c = this.gg(c, d, a, b, k[11], 14, 643717713);
    b = this.gg(b, c, d, a, k[0], 20, -373897302);
    a = this.gg(a, b, c, d, k[5], 5, -701558691);
    d = this.gg(d, a, b, c, k[10], 9, 38016083);
    c = this.gg(c, d, a, b, k[15], 14, -660478335);
    b = this.gg(b, c, d, a, k[4], 20, -405537848);
    a = this.gg(a, b, c, d, k[9], 5, 568446438);
    d = this.gg(d, a, b, c, k[14], 9, -1019803690);
    c = this.gg(c, d, a, b, k[3], 14, -187363961);
    b = this.gg(b, c, d, a, k[8], 20, 1163531501);
    a = this.gg(a, b, c, d, k[13], 5, -1444681467);
    d = this.gg(d, a, b, c, k[2], 9, -51403784);
    c = this.gg(c, d, a, b, k[7], 14, 1735328473);
    b = this.gg(b, c, d, a, k[12], 20, -1926607734);
    a = this.hh(a, b, c, d, k[5], 4, -378558);
    d = this.hh(d, a, b, c, k[8], 11, -2022574463);
    c = this.hh(c, d, a, b, k[11], 16, 1839030562);
    b = this.hh(b, c, d, a, k[14], 23, -35309556);
    a = this.hh(a, b, c, d, k[1], 4, -1530992060);
    d = this.hh(d, a, b, c, k[4], 11, 1272893353);
    c = this.hh(c, d, a, b, k[7], 16, -155497632);
    b = this.hh(b, c, d, a, k[10], 23, -1094730640);
    a = this.hh(a, b, c, d, k[13], 4, 681279174);
    d = this.hh(d, a, b, c, k[0], 11, -358537222);
    c = this.hh(c, d, a, b, k[3], 16, -722521979);
    b = this.hh(b, c, d, a, k[6], 23, 76029189);
    a = this.hh(a, b, c, d, k[9], 4, -640364487);
    d = this.hh(d, a, b, c, k[12], 11, -421815835);
    c = this.hh(c, d, a, b, k[15], 16, 530742520);
    b = this.hh(b, c, d, a, k[2], 23, -995338651);
    a = this.ii(a, b, c, d, k[0], 6, -198630844);
    d = this.ii(d, a, b, c, k[7], 10, 1126891415);
    c = this.ii(c, d, a, b, k[14], 15, -1416354905);
    b = this.ii(b, c, d, a, k[5], 21, -57434055);
    a = this.ii(a, b, c, d, k[12], 6, 1700485571);
    d = this.ii(d, a, b, c, k[3], 10, -1894986606);
    c = this.ii(c, d, a, b, k[10], 15, -1051523);
    b = this.ii(b, c, d, a, k[1], 21, -2054922799);
    a = this.ii(a, b, c, d, k[8], 6, 1873313359);
    d = this.ii(d, a, b, c, k[15], 10, -30611744);
    c = this.ii(c, d, a, b, k[6], 15, -1560198380);
    b = this.ii(b, c, d, a, k[13], 21, 1309151649);
    a = this.ii(a, b, c, d, k[4], 6, -145523070);
    d = this.ii(d, a, b, c, k[11], 10, -1120210379);
    c = this.ii(c, d, a, b, k[2], 15, 718787259);
    b = this.ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = this.add32(a, x[0]);
    x[1] = this.add32(b, x[1]);
    x[2] = this.add32(c, x[2]);
    x[3] = this.add32(d, x[3]);
  }
  cmn(q, a, b, x, s, t) {
    a = this.add32(this.add32(a, q), this.add32(x, t));
    return this.add32(a << s | a >>> 32 - s, b);
  }
  ff(a, b, c, d, x, s, t) {
    return this.cmn(b & c | ~b & d, a, b, x, s, t);
  }
  gg(a, b, c, d, x, s, t) {
    return this.cmn(b & d | c & ~d, a, b, x, s, t);
  }
  hh(a, b, c, d, x, s, t) {
    return this.cmn(b ^ c ^ d, a, b, x, s, t);
  }
  ii(a, b, c, d, x, s, t) {
    return this.cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  md51(s) {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i;
    for (i = 64; i <= s.length; i += 64) {
      this.md5cycle(state, this.md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
    }
    tail[i >> 2] |= 128 << (i % 4 << 3);
    if (i > 55) {
      this.md5cycle(state, tail);
      for (i = 0; i < 16; i++) {
        tail[i] = 0;
      }
    }
    tail[14] = n * 8;
    this.md5cycle(state, tail);
    return state;
  }
  /* there needs to be support for Unicode here, * unless we pretend that we can redefine the MD-5
   * algorithm for multi-byte characters (perhaps by adding every four 16-bit characters and
   * shortening the sum to 32 bits). Otherwise I suthis.ggest performing MD-5 as if every character
   * was two bytes--e.g., 0040 0025 = @%--but then how will an ordinary MD-5 sum be matched?
   * There is no way to standardize text to something like UTF-8 before transformation; speed cost is
   * utterly prohibitive. The JavaScript standard itself needs to look at this: it should start
   * providing access to strings as preformed UTF-8 8-bit unsigned value arrays.
   */
  md5blk(s) {
    const md5blks = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  rhex(n) {
    const hex_chr = "0123456789abcdef".split("");
    let s = "", j = 0;
    for (; j < 4; j++) {
      s += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
    }
    return s;
  }
  hex(x) {
    for (let i = 0; i < x.length; i++) {
      x[i] = this.rhex(x[i]);
    }
    return x.join("");
  }
  md5(s) {
    return this.hex(this.md51(s));
  }
  add32(a, b) {
    return this.ieCompatibility ? this.add32Compat(a, b) : this.add32Std(a, b);
  }
  /* this function is much faster, so if possible we use it. Some IEs are the only ones I know of that
   need the idiotic second function, generated by an if clause.  */
  add32Std(a, b) {
    return a + b & 4294967295;
  }
  add32Compat(x, y) {
    const lsw = (x & 65535) + (y & 65535), msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return msw << 16 | lsw & 65535;
  }
};

// packages/ag-charts-enterprise/src/license/licenseManager.ts
function missingOrEmpty(value) {
  return value == null || value.length === 0;
}
var LICENSE_TYPES = {
  "01": "GRID",
  "02": "CHARTS",
  "0102": "BOTH"
};
var _LicenseManager = class _LicenseManager {
  constructor(document2) {
    this.gridContext = false;
    this.watermarkMessage = void 0;
    this.totalMessageLength = 124;
    this.document = document2;
    this.md5 = new MD5();
    this.md5.init();
  }
  validateLicense() {
    const licenseDetails = this.getLicenseDetails(this.licenseKey, this.gridContext);
    const currentLicenseName = `AG ${licenseDetails.currentLicenseType === "BOTH" ? "Grid and " : ""}Charts Enterprise`;
    const suppliedLicenseName = licenseDetails.suppliedLicenseType === void 0 ? "" : `AG ${licenseDetails.suppliedLicenseType === "BOTH" ? "Grid and AG Charts" : licenseDetails.suppliedLicenseType === "GRID" ? "Grid" : "Charts"} Enterprise`;
    if (licenseDetails.missing) {
      if (!this.isWebsiteUrl() || this.isForceWatermark()) {
        this.outputMissingLicenseKey(currentLicenseName);
      }
    } else if (licenseDetails.expired) {
      const gridReleaseDate = _LicenseManager.getChartsReleaseDate();
      const formattedReleaseDate = _LicenseManager.formatDate(gridReleaseDate);
      this.outputExpiredKey(licenseDetails.expiry, formattedReleaseDate, suppliedLicenseName);
    } else if (!licenseDetails.valid) {
      this.outputInvalidLicenseKey(
        !!licenseDetails.incorrectLicenseType,
        currentLicenseName,
        suppliedLicenseName
      );
    } else if (licenseDetails.isTrial && licenseDetails.trialExpired) {
      this.outputExpiredTrialKey(licenseDetails.expiry, currentLicenseName, suppliedLicenseName);
    }
  }
  static extractExpiry(license) {
    const restrictionHashed = license.substring(license.lastIndexOf("_") + 1, license.length);
    return new Date(parseInt(_LicenseManager.decode(restrictionHashed), 10));
  }
  static extractLicenseComponents(licenseKey) {
    let cleanedLicenseKey = licenseKey.replace(/[\u200B-\u200D\uFEFF]/g, "");
    cleanedLicenseKey = cleanedLicenseKey.replace(/\r?\n|\r/g, "");
    if (licenseKey.length <= 32) {
      return { md5: null, license: licenseKey, version: null, isTrial: null };
    }
    const hashStart = cleanedLicenseKey.length - 32;
    const md5 = cleanedLicenseKey.substring(hashStart);
    const license = cleanedLicenseKey.substring(0, hashStart);
    const [version, isTrial, type] = _LicenseManager.extractBracketedInformation(cleanedLicenseKey);
    return { md5, license, version, isTrial, type };
  }
  getLicenseDetails(licenseKey, gridContext = false) {
    const currentLicenseType = "CHARTS";
    if (missingOrEmpty(licenseKey)) {
      return {
        licenseKey,
        valid: false,
        missing: true,
        currentLicenseType
      };
    }
    const chartsReleaseDate = _LicenseManager.getChartsReleaseDate();
    const { md5, license, version, isTrial, type } = _LicenseManager.extractLicenseComponents(licenseKey);
    let valid = md5 === this.md5.md5(license) && licenseKey.indexOf("For_Trialing_ag-Grid_Only") === -1;
    let trialExpired = void 0;
    let expired = void 0;
    let expiry = null;
    let incorrectLicenseType = false;
    let suppliedLicenseType = void 0;
    function handleTrial() {
      const now = /* @__PURE__ */ new Date();
      trialExpired = expiry < now;
      expired = void 0;
    }
    if (valid) {
      expiry = _LicenseManager.extractExpiry(license);
      valid = !isNaN(expiry.getTime());
      if (valid) {
        expired = chartsReleaseDate > expiry;
        switch (version) {
          case "legacy":
          case "2": {
            valid = false;
            break;
          }
          case "3": {
            if (missingOrEmpty(type)) {
              valid = false;
            } else {
              suppliedLicenseType = type;
              if (type !== LICENSE_TYPES["02"] && type !== LICENSE_TYPES["0102"]) {
                valid = false;
                incorrectLicenseType = true;
              } else if (isTrial) {
                handleTrial();
              }
            }
          }
        }
      }
    }
    if (!valid) {
      return {
        licenseKey,
        valid,
        incorrectLicenseType,
        currentLicenseType,
        suppliedLicenseType
      };
    }
    return {
      licenseKey,
      valid,
      expiry: _LicenseManager.formatDate(expiry),
      expired,
      version,
      isTrial,
      trialExpired,
      invalidLicenseTypeForCombo: gridContext ? suppliedLicenseType !== "BOTH" : void 0,
      incorrectLicenseType,
      currentLicenseType,
      suppliedLicenseType
    };
  }
  isDisplayWatermark() {
    return this.isForceWatermark() || !this.isLocalhost() && !this.isWebsiteUrl() && !missingOrEmpty(this.watermarkMessage);
  }
  getWatermarkMessage() {
    return this.watermarkMessage || "";
  }
  getHostname() {
    if (!this.document) {
      return "localhost";
    }
    const win = this.document.defaultView || window;
    if (!win) {
      return "localhost";
    }
    const loc = win.location;
    const { hostname = "" } = loc;
    return hostname;
  }
  isForceWatermark() {
    var _a2, _b;
    if (!this.document) {
      return false;
    }
    const win = ((_b = (_a2 = this.document) == null ? void 0 : _a2.defaultView) != null ? _b : typeof window != "undefined") ? window : void 0;
    if (!win) {
      return false;
    }
    const { pathname } = win.location;
    return pathname ? pathname.indexOf("forceWatermark") !== -1 : false;
  }
  isWebsiteUrl() {
    const hostname = this.getHostname();
    return hostname.match(/^((?:[\w-]+\.)?ag-grid\.com)$/) !== null;
  }
  isLocalhost() {
    const hostname = this.getHostname();
    return hostname.match(/^(?:127\.0\.0\.1|localhost)$/) !== null;
  }
  static formatDate(date) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    return day + " " + monthNames[monthIndex] + " " + year;
  }
  static getChartsReleaseDate() {
    return new Date(parseInt(_LicenseManager.decode(_LicenseManager.RELEASE_INFORMATION), 10));
  }
  static decode(input) {
    const keystr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let t = "";
    let n, r, i;
    let s, o, u, a;
    let f = 0;
    const e = input.replace(/[^A-Za-z0-9+/=]/g, "");
    while (f < e.length) {
      s = keystr.indexOf(e.charAt(f++));
      o = keystr.indexOf(e.charAt(f++));
      u = keystr.indexOf(e.charAt(f++));
      a = keystr.indexOf(e.charAt(f++));
      n = s << 2 | o >> 4;
      r = (o & 15) << 4 | u >> 2;
      i = (u & 3) << 6 | a;
      t = t + String.fromCharCode(n);
      if (u != 64) {
        t = t + String.fromCharCode(r);
      }
      if (a != 64) {
        t = t + String.fromCharCode(i);
      }
    }
    t = _LicenseManager.utf8_decode(t);
    return t;
  }
  static utf8_decode(input) {
    input = input.replace(/rn/g, "n");
    let t = "";
    for (let n = 0; n < input.length; n++) {
      const r = input.charCodeAt(n);
      if (r < 128) {
        t += String.fromCharCode(r);
      } else if (r > 127 && r < 2048) {
        t += String.fromCharCode(r >> 6 | 192);
        t += String.fromCharCode(r & 63 | 128);
      } else {
        t += String.fromCharCode(r >> 12 | 224);
        t += String.fromCharCode(r >> 6 & 63 | 128);
        t += String.fromCharCode(r & 63 | 128);
      }
    }
    return t;
  }
  setLicenseKey(licenseKey, gridContext = false) {
    this.gridContext = gridContext;
    this.licenseKey = licenseKey;
  }
  static extractBracketedInformation(licenseKey) {
    if (!licenseKey.includes("[")) {
      return ["legacy", false, void 0];
    }
    const matches = licenseKey.match(/\[(.*?)\]/g).map((match) => match.replace("[", "").replace("]", ""));
    if (!matches || matches.length === 0) {
      return ["legacy", false, void 0];
    }
    const isTrial = matches.filter((match) => match === "TRIAL").length === 1;
    const rawVersion = matches.filter((match) => match.indexOf("v") === 0)[0];
    const version = rawVersion ? rawVersion.replace("v", "") : "legacy";
    const type = LICENSE_TYPES[matches.filter((match) => LICENSE_TYPES[match])[0]];
    return [version, isTrial, type];
  }
  centerPadAndOutput(input) {
    const paddingRequired = this.totalMessageLength - input.length;
    console.error(input.padStart(paddingRequired / 2 + input.length, "*").padEnd(this.totalMessageLength, "*"));
  }
  padAndOutput(input, padding = "*", terminateWithPadding = "") {
    console.error(
      input.padEnd(this.totalMessageLength - terminateWithPadding.length, padding) + terminateWithPadding
    );
  }
  outputInvalidLicenseKey(incorrectLicenseType, currentLicenseName, suppliedLicenseName) {
    if (!this.gridContext) {
      if (incorrectLicenseType) {
        this.centerPadAndOutput("");
        this.centerPadAndOutput(` ${currentLicenseName} License `);
        this.centerPadAndOutput(" Incompatible License Key ");
        this.padAndOutput(
          `* Your license key is for ${suppliedLicenseName} only and does not cover you for ${currentLicenseName}.`,
          " ",
          "*"
        );
        this.padAndOutput("* Please contact info@ag-grid.com to obtain a combined license key.", " ", "*");
        this.centerPadAndOutput("");
        this.centerPadAndOutput("");
      } else {
        this.centerPadAndOutput("");
        this.centerPadAndOutput(` ${currentLicenseName} License `);
        this.centerPadAndOutput(" Invalid License Key ");
        this.padAndOutput(
          `* Your license key is not valid - please contact info@ag-grid.com to obtain a valid license.`,
          " ",
          "*"
        );
        this.centerPadAndOutput("");
        this.centerPadAndOutput("");
      }
    }
    this.watermarkMessage = "Invalid License";
  }
  outputExpiredTrialKey(formattedExpiryDate, currentLicenseName, suppliedLicenseName) {
    if (!this.gridContext) {
      this.centerPadAndOutput("");
      this.centerPadAndOutput(` ${currentLicenseName} License `);
      this.centerPadAndOutput(" Trial Period Expired. ");
      this.padAndOutput(
        `* Your trial only license for ${suppliedLicenseName} expired on ${formattedExpiryDate}.`,
        " ",
        "*"
      );
      this.padAndOutput("* Please email info@ag-grid.com to purchase a license.", " ", "*");
      this.centerPadAndOutput("");
      this.centerPadAndOutput("");
    }
    this.watermarkMessage = "Trial Period Expired";
  }
  outputMissingLicenseKey(currentLicenseName) {
    if (!this.gridContext) {
      this.centerPadAndOutput("");
      this.centerPadAndOutput(` ${currentLicenseName} License `);
      this.centerPadAndOutput(" License Key Not Found ");
      this.padAndOutput(`* All ${currentLicenseName} features are unlocked for trial.`, " ", "*");
      this.padAndOutput(
        "* If you want to hide the watermark please email info@ag-grid.com for a trial license key.",
        " ",
        "*"
      );
      this.centerPadAndOutput("");
      this.centerPadAndOutput("");
    }
    this.watermarkMessage = "For Trial Use Only";
  }
  outputExpiredKey(formattedExpiryDate, formattedReleaseDate, currentLicenseName) {
    if (!this.gridContext) {
      this.centerPadAndOutput("");
      this.centerPadAndOutput(` ${currentLicenseName} License `);
      this.centerPadAndOutput(" Incompatible Software Version ");
      this.padAndOutput(
        `* Your license key works with versions of ${currentLicenseName} released before ${formattedExpiryDate}.`,
        " ",
        "*"
      );
      this.padAndOutput(`* The version you are trying to use was released on ${formattedReleaseDate}.`, " ", "*");
      this.padAndOutput("* Please contact info@ag-grid.com to renew your license key.", " ", "*");
      this.centerPadAndOutput("");
      this.centerPadAndOutput("");
    }
    this.watermarkMessage = "License Expired";
  }
};
_LicenseManager.RELEASE_INFORMATION = "MTcxMDc0ODYyMTYzMg==";
var LicenseManager = _LicenseManager;

// packages/ag-charts-enterprise/src/license/watermark.ts
var import_ag_charts_community44 = require("ag-charts-community");
var { createElement: createElement4, injectStyle: injectStyle3 } = import_ag_charts_community44._ModuleSupport;
var watermarkStyles = `
.ag-watermark {
    position: absolute;
    bottom: 20px;
    right: 25px;
    font-weight: bold;
    font-family: Impact, sans-serif;
    font-size: 19px;
    opacity: 0.7;
    animation: 1s ease-out 3s ag-watermark-fadeout;
    color: #9B9B9B;
    pointer-events: none;

    &::before {
        content: '';
        display: block;
        height: 40px;
        width: 170px;
        background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU4IiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMjU4IDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMjUuNzc5IDI4LjY1N0gxMy4zNTlMMTEuMTczIDM0LjAxMkg1LjY3Mjk3TDE3LjE4MiA3LjA1OTk5SDIxLjk1M0wzMy40NjIgMzQuMDEySDI3Ljk2MkwyNS43NzYgMjguNjU3SDI1Ljc3OVpNMjQuMDY4IDI0LjM5N0wxOS41ODggMTMuNDM0TDE1LjEwNyAyNC4zOTdIMjQuMDY4Wk02Mi4wOTIgMTguODIzSDQ5LjgxN1YyMy4wODZINTYuNzc1QzU2LjU1NSAyNS4yMjIgNTUuNzU1IDI2LjkyNyA1NC4zNzIgMjguMjAyQzUyLjk4OSAyOS40NzYgNTEuMTY2IDMwLjExNSA0OC45MDkgMzAuMTE1QzQ3LjYyMiAzMC4xMTUgNDYuNDUgMjkuODg1IDQ1LjM5MyAyOS40MjNDNDQuMzU4MyAyOC45NzgxIDQzLjQzMjYgMjguMzEzOCA0Mi42OCAyNy40NzZDNDEuOTI3IDI2LjYzOSA0MS4zNDQgMjUuNjMxIDQwLjkzMSAyNC40NTNDNDAuNTE5IDIzLjI3NSA0MC4zMTEgMjEuOTcgNDAuMzExIDIwLjUzN0M0MC4zMTEgMTkuMTA1IDQwLjUxNiAxNy44IDQwLjkzMSAxNi42MjFDNDEuMzQ0IDE1LjQ0MyA0MS45MjcgMTQuNDM2IDQyLjY4IDEzLjU5OEM0My40Mzc2IDEyLjc1NzcgNDQuMzY5NiAxMi4wOTMyIDQ1LjQxMSAxMS42NTFDNDYuNDc4IDExLjE4OSA0Ny42NTYgMTAuOTYgNDguOTQ2IDEwLjk2QzUxLjYxMiAxMC45NiA1My42MzcgMTEuNjAyIDU1LjAyIDEyLjg4NUw1OC4zIDkuNjA0OTlDNTUuODE3IDcuNjY5OTkgNTIuNjc2IDYuNjk5OTkgNDguODcyIDYuNjk5OTlDNDYuNzYgNi42OTk5OSA0NC44NTMgNy4wMzQ5OSA0My4xNTQgNy43MDA5OUM0MS40NTUgOC4zNjc5OSAzOS45OTggOS4zMDM5OSAzOC43ODMgMTAuNTA0QzM3LjU2NyAxMS43MDcgMzYuNjM0IDEzLjE1OCAzNS45NzcgMTQuODU3QzM1LjMxOSAxNi41NTYgMzQuOTk0IDE4LjQ1MSAzNC45OTQgMjAuNTRDMzQuOTk0IDIyLjYzIDM1LjMyOSAyNC40OTQgMzUuOTk1IDI2LjIwNUMzNi42NjIgMjcuOTE2IDM3LjYwNSAyOS4zNzQgMzguODE3IDMwLjU3N0M0MC4wMzIgMzEuNzggNDEuNDg2IDMyLjcxMyA0My4xODggMzMuMzgzQzQ0Ljg4OCAzNC4wNDkgNDYuNzgyIDM0LjM4NCA0OC44NzIgMzQuMzg0QzUwLjk2MSAzNC4zODQgNTIuNzUgMzQuMDQ5IDU0LjM5IDMzLjM4M0M1Ni4wMzEgMzIuNzE2IDU3LjQyNiAzMS43OCA1OC41NzkgMzAuNTc3QzU5LjczMyAyOS4zNzQgNjAuNjE5IDI3LjkxNiA2MS4yMzkgMjYuMjA1QzYxLjg2IDI0LjQ5NCA2Mi4xNyAyMi42MDUgNjIuMTcgMjAuNTRDNjIuMTY5NiAxOS45Njg4IDYyLjE0NDUgMTkuMzk4IDYyLjA5NSAxOC44MjlMNjIuMDkyIDE4LjgyM1pNMTUxLjgxIDE2Ljk4MUMxNTMuNDEgMTQuNjA5IDE1Ny40MTkgMTQuMzU4IDE1OS4wMjIgMTQuMzU4VjE4LjkxQzE1Ni45NTcgMTguOTEgMTU0Ljk4NSAxOC45OTYgMTUzLjc1NyAxOS44OTJDMTUyLjUyOSAyMC43OTIgMTUxLjkxOSAyMS45ODIgMTUxLjkxOSAyMy40NjRWMzMuOTlIMTQ2Ljk2NFYxNC4zNThIMTUxLjczNkwxNTEuODEgMTYuOTgxWk0xNDMuMDExIDE0LjM2MVYzNC4wMzFIMTM4LjI0TDEzOC4xMzEgMzEuMDQ1QzEzNy40NjYgMzIuMDc2IDEzNi41NTEgMzIuOTIxOSAxMzUuNDcxIDMzLjUwNEMxMzQuMzc2IDM0LjA5OSAxMzMuMDY4IDM0LjM5NiAxMzEuNTM2IDM0LjM5NkMxMzAuMiAzNC4zOTYgMTI4Ljk2MyAzNC4xNTIgMTI3LjgyMiAzMy42NjhDMTI2LjcgMzMuMTk2NCAxMjUuNjg5IDMyLjQ5NSAxMjQuODU1IDMxLjYwOUMxMjQuMDE4IDMwLjcyMiAxMjMuMzU0IDI5LjY2MiAxMjIuODcxIDI4LjQyMkMxMjIuMzg0IDI3LjE4NSAxMjIuMTQyIDI1LjgxMSAxMjIuMTQyIDI0LjMwNEMxMjIuMTQyIDIyLjc5OCAxMjIuMzg0IDIxLjM3OCAxMjIuODcxIDIwLjExNkMxMjMuMzU3IDE4Ljg1NCAxMjQuMDE4IDE3Ljc3MiAxMjQuODU1IDE2Ljg3M0MxMjUuNjg4IDE1Ljk3NjQgMTI2LjY5OCAxNS4yNjM2IDEyNy44MjIgMTQuNzhDMTI4Ljk2MyAxNC4yODEgMTMwLjIwMyAxNC4wMzMgMTMxLjUzNiAxNC4wMzNDMTMzLjA0MyAxNC4wMzMgMTM0LjMzIDE0LjMxOCAxMzUuMzk3IDE0Ljg4OEMxMzYuNDYyIDE1LjQ1ODkgMTM3LjM3NSAxNi4yNzggMTM4LjA1NyAxNy4yNzZWMTQuMzYxSDE0My4wMTFaTTEzMi42MzEgMzAuMTMzQzEzNC4yNTYgMzAuMTMzIDEzNS41NjcgMjkuNTk0IDEzNi41NjUgMjguNTEyQzEzNy41NjEgMjcuNDMgMTM4LjA2IDI1Ljk5MSAxMzguMDYgMjQuMTk2QzEzOC4wNiAyMi40MDEgMTM3LjU2MSAyMC45OSAxMzYuNTY1IDE5Ljg5OUMxMzUuNTcgMTguODA3IDEzNC4yNTkgMTguMjU4IDEzMi42MzEgMTguMjU4QzEzMS4wMDMgMTguMjU4IDEyOS43MjkgMTguODA0IDEyOC43MzQgMTkuODk5QzEyNy43MzggMjAuOTkzIDEyNy4yMzkgMjIuNDM4IDEyNy4yMzkgMjQuMjMzQzEyNy4yMzkgMjYuMDI4IDEyNy43MzUgMjcuNDMzIDEyOC43MzQgMjguNTE1QzEyOS43MjkgMjkuNTk0IDEzMS4wMjggMzAuMTM2IDEzMi42MzEgMzAuMTM2VjMwLjEzM1pNOTMuNjk4IDI3Ljg3NkM5My41Nzk1IDI4LjAwMjUgOTMuNDU2NCAyOC4xMjQ2IDkzLjMyOSAyOC4yNDJDOTEuOTQ3IDI5LjUxNiA5MC4xMjMgMzAuMTU1IDg3Ljg2NiAzMC4xNTVDODYuNTggMzAuMTU1IDg1LjQwOCAyOS45MjYgODQuMzUgMjkuNDY0QzgzLjMxNTUgMjkuMDE4OSA4Mi4zODk4IDI4LjM1NDYgODEuNjM3IDI3LjUxN0M4MC44ODQgMjYuNjc5IDgwLjMwMSAyNS42NzIgNzkuODg5IDI0LjQ5NEM3OS40NzYgMjMuMzE1IDc5LjI2OSAyMi4wMSA3OS4yNjkgMjAuNTc4Qzc5LjI2OSAxOS4xNDUgNzkuNDczIDE3Ljg0IDc5Ljg4OSAxNi42NjJDODAuMzAxIDE1LjQ4NCA4MC44ODQgMTQuNDc2IDgxLjYzNyAxMy42MzlDODIuMzk0OSAxMi43OTg3IDgzLjMyNzMgMTIuMTM0MiA4NC4zNjkgMTEuNjkyQzg1LjQzNiAxMS4yMyA4Ni42MTQgMTEgODcuOTAzIDExQzkwLjU3IDExIDkyLjU5NSAxMS42NDIgOTMuOTc3IDEyLjkyNkw5Ny4yNTggOS42NDQ5OUM5NC43NzQgNy43MTA5OSA5MS42MzMgNi43Mzk5OSA4Ny44MjkgNi43Mzk5OUM4NS43MTggNi43Mzk5OSA4My44MTEgNy4wNzQ5OSA4Mi4xMTIgNy43NDE5OUM4MC40MTMgOC40MDc5OSA3OC45NTYgOS4zNDQ5OSA3Ny43NCAxMC41NDVDNzYuNTI1IDExLjc0NyA3NS41OTIgMTMuMTk5IDc0LjkzNCAxNC44OThDNzQuMjc3IDE2LjU5NyA3My45NTEgMTguNDkxIDczLjk1MSAyMC41ODFDNzMuOTUxIDIyLjY3IDc0LjI4NiAyNC41MzQgNzQuOTUzIDI2LjI0NUM3NS42MTkgMjcuOTU3IDc2LjU2MiAyOS40MTQgNzcuNzc0IDMwLjYxN0M3OC45OSAzMS44MiA4MC40NDQgMzIuNzUzIDgyLjE0NiAzMy40MjNDODMuODQ1IDM0LjA5IDg1LjczOSAzNC40MjQgODcuODI5IDM0LjQyNEM4OS45MTkgMzQuNDI0IDkxLjcwOCAzNC4wOSA5My4zNDggMzMuNDIzQzk0LjcxOCAzMi44NjUgOTUuOTE4IDMyLjEyMSA5Ni45NDggMzEuMTkxQzk3LjE0OSAzMS4wMDggOTcuMzQ4IDMwLjgxNSA5Ny41MzcgMzAuNjJMOTMuNzAxIDI3Ljg4NUw5My42OTggMjcuODc2Wk0xMTAuODAyIDE0LjAxNUMxMDkuMTk5IDE0LjAxNSAxMDYuODM2IDE0LjQ3MSAxMDUuNjExIDE2LjE1OEwxMDUuNTM3IDYuMDE1OTlIMTAwLjc2NVYzMy45MzlIMTA1LjcyVjIyLjY0MUMxMDUuNzcxIDIxLjQ2MDcgMTA2LjI4OCAyMC4zNDg4IDEwNy4xNTcgMTkuNTQ4OUMxMDguMDI3IDE4Ljc0OTEgMTA5LjE3OCAxOC4zMjY2IDExMC4zNTggMTguMzc0QzExMy4zOTcgMTguMzc0IDExNC4yNjggMjEuMTU5IDExNC4yNjggMjIuNjQxVjMzLjkzOUgxMTkuMjIzVjIxLjA1OUMxMTkuMjIzIDIxLjA1OSAxMTkuMTQyIDE0LjAxNSAxMTAuODAyIDE0LjAxNVpNMTczLjc2MyAxNC4zNThIMTY5Ljk5OVY4LjcxNDk5SDE2NS4wNDhWMTQuMzU4SDE2MS4yODRWMTguOTE2SDE2NS4wNDhWMzQuMDAzSDE2OS45OTlWMTguOTE2SDE3My43NjNWMTQuMzU4Wk0xOTAuNzg3IDI1LjI2MkMxOTAuMTI5IDI0LjUwMTQgMTg5LjMwNyAyMy44OTk0IDE4OC4zODQgMjMuNTAxQzE4Ny40ODggMjMuMTE3IDE4Ni4zMzEgMjIuNzMyIDE4NC45NDggMjIuMzY0QzE4NC4xNjUgMjIuMTQzOSAxODMuMzkgMjEuODk3OCAxODIuNjIzIDIxLjYyNkMxODIuMTYzIDIxLjQ2MjEgMTgxLjc0MSAyMS4yMDY2IDE4MS4zODMgMjAuODc1QzE4MS4yMzUgMjAuNzQyMSAxODEuMTE4IDIwLjU3ODkgMTgxLjAzOSAyMC4zOTY0QzE4MC45NjEgMjAuMjE0IDE4MC45MjIgMjAuMDE2NiAxODAuOTI3IDE5LjgxOEMxODAuOTI3IDE5LjI3MiAxODEuMTU2IDE4Ljg0NCAxODEuNjI1IDE4LjUxQzE4Mi4xMjEgMTguMTU2IDE4Mi44NjIgMTcuOTc2IDE4My44MjYgMTcuOTc2QzE4NC43OSAxNy45NzYgMTg1LjU4NyAxOC4yMDkgMTg2LjE0OCAxOC42NjhDMTg2LjcwNiAxOS4xMjQgMTg3LjAwNyAxOS43MjUgMTg3LjA3MiAyMC41TDE4Ny4wOTQgMjAuNzgySDE5MS42MzNMMTkxLjYxNyAyMC40NkMxOTEuNTIxIDE4LjQ4NSAxOTAuNzcxIDE2LjkgMTg5LjM4NSAxNS43NUMxODguMDEyIDE0LjYxMiAxODYuMTg1IDE0LjAzMyAxODMuOTYyIDE0LjAzM0MxODIuNDc3IDE0LjAzMyAxODEuMTQxIDE0LjI4NyAxNzkuOTk0IDE0Ljc4NkMxNzguODMxIDE1LjI5MSAxNzcuOTI2IDE1Ljk5NSAxNzcuMjk2IDE2Ljg4MkMxNzYuNjczIDE3Ljc0NTUgMTc2LjMzOCAxOC43ODQgMTc2LjM0MSAxOS44NDlDMTc2LjM0MSAyMS4xNjcgMTc2LjY5OCAyMi4yNDkgMTc3LjM5OSAyMy4wNjRDMTc4LjA2IDIzLjg0MzIgMTc4Ljg5OCAyNC40NTM0IDE3OS44NDIgMjQuODQ0QzE4MC43NDQgMjUuMjE2IDE4MS45MjggMjUuNjA3IDE4My4zNjEgMjZDMTg0LjgwNiAyNi40MSAxODUuODcyIDI2Ljc4NSAxODYuNTMgMjcuMTIzQzE4Ny4xIDI3LjQxNCAxODcuMzc5IDI3Ljg0NSAxODcuMzc5IDI4LjQ0NEMxODcuMzc5IDI5LjA0MiAxODcuMTIyIDI5LjQ2NyAxODYuNTk1IDI5LjgzOUMxODYuMDQzIDMwLjIyNiAxODUuMjM3IDMwLjQyNSAxODQuMjAxIDMwLjQyNUMxODMuMTY2IDMwLjQyNSAxODIuMzk0IDMwLjE3NCAxODEuNzQ5IDI5LjY3NEMxODEuMTEzIDI5LjE4MSAxODAuNzcyIDI4LjU4OSAxODAuNzEgMjcuODY0TDE4MC42ODUgMjcuNTgySDE3Ni4wMTNMMTc2LjAyNSAyNy45MDFDMTc2LjA2NyAyOS4wOTU1IDE3Ni40NzIgMzAuMjQ4NyAxNzcuMTg4IDMxLjIwNkMxNzcuOTA3IDMyLjE4IDE3OC44OTMgMzIuOTU4IDE4MC4xMTggMzMuNTE5QzE4MS4zMzYgMzQuMDc3IDE4Mi43MzIgMzQuMzYyIDE4NC4yNjYgMzQuMzYyQzE4NS44MDEgMzQuMzYyIDE4Ny4xMDkgMzQuMTA4IDE4OC4yMzggMzMuNjA5QzE4OS4zNzYgMzMuMTA0IDE5MC4yNzIgMzIuMzk0IDE5MC45MDEgMzEuNDk0QzE5MS41MzQgMzAuNTkyIDE5MS44NTMgMjkuNTU0IDE5MS44NTMgMjguNDAzQzE5MS44MjggMjcuMTEgMTkxLjQ2NiAyNi4wNTMgMTkwLjc3NyAyNS4yNjJIMTkwLjc4N1oiIGZpbGw9IiM5QjlCOUIiLz4KPHBhdGggZD0iTTI0MS45ODIgMjUuNjU4MlYxNy43MTE3SDIyOC40NDFMMjIwLjQ5NCAyNS42NTgySDI0MS45ODJaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yNTcuMjM5IDUuOTUwODFIMjQwLjI2NUwyMzIuMjU1IDEzLjg5NzNIMjU3LjIzOVY1Ljk1MDgxWiIgZmlsbD0iIzlCOUI5QiIvPgo8cGF0aCBkPSJNMjEyLjYxMSAzMy42MDQ4TDIxNi42OCAyOS41MzYxSDIzMC40MTJWMzcuNDgyN0gyMTIuNjExVjMzLjYwNDhaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yMTUuNTk5IDIxLjc4MDNIMjI0LjM3MkwyMzIuMzgyIDEzLjgzMzdIMjE1LjU5OVYyMS43ODAzWiIgZmlsbD0iIzlCOUI5QiIvPgo8cGF0aCBkPSJNMjA2IDMzLjYwNDdIMjEyLjYxMUwyMjAuNDk0IDI1LjY1ODJIMjA2VjMzLjYwNDdaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yNDAuMjY1IDUuOTUwODFMMjM2LjE5NyAxMC4wMTk0SDIxMC4yNTlWMi4wNzI4OEgyNDAuMjY1VjUuOTUwODFaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=);
        background-repeat: no-repeat;
        background-size: 170px 40px;
    }

    > span {
        padding-left: 0.7rem;
    }
}

@keyframes ag-watermark-fadeout {
    from { opacity: 0.5; }
    to { opacity: 0; }
}
`;
function injectWatermark(parentElement, text) {
  injectStyle3(watermarkStyles, "watermark");
  const element = createElement4("div");
  const textElement = createElement4("span");
  textElement.innerText = text;
  element.addEventListener("animationend", () => parentElement.removeChild(element));
  element.classList.add("ag-watermark");
  element.appendChild(textElement);
  parentElement.appendChild(element);
}

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotModule.ts
var import_ag_charts_community49 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeries.ts
var import_ag_charts_community47 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/box-plot/blotPlotUtil.ts
function prepareBoxPlotFromTo(isVertical) {
  const from = isVertical ? { scalingX: 1, scalingY: 0 } : { scalingX: 0, scalingY: 1 };
  const to = { scalingX: 1, scalingY: 1 };
  return { from, to };
}
function resetBoxPlotSelectionsScalingCenterFn(isVertical) {
  return (_node, datum) => {
    if (isVertical) {
      return { scalingCenterY: datum.scaledValues.medianValue };
    }
    return { scalingCenterX: datum.scaledValues.medianValue };
  };
}

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotGroup.ts
var import_ag_charts_community45 = require("ag-charts-community");
var { Group: Group6, Rect: Rect2, Line: Line2, BBox: BBox6, Selection: Selection2 } = import_ag_charts_community45._Scene;
var BoxPlotGroup = class extends Group6 {
  constructor() {
    super();
    this.append([
      new Rect2({ tag: 0 /* Box */ }),
      new Rect2({ tag: 0 /* Box */ }),
      new Rect2({ tag: 2 /* Outline */ }),
      new Rect2({ tag: 1 /* Median */ }),
      new Line2({ tag: 3 /* Whisker */ }),
      new Line2({ tag: 3 /* Whisker */ }),
      new Line2({ tag: 4 /* Cap */ }),
      new Line2({ tag: 4 /* Cap */ })
    ]);
  }
  updateDatumStyles(datum, activeStyles, isVertical, isReversedValueAxis, cornerRadius) {
    const {
      bandwidth,
      scaledValues: { xValue: axisValue, medianValue }
    } = datum;
    let { minValue, q1Value, q3Value, maxValue } = datum.scaledValues;
    if (isVertical && !isReversedValueAxis || !isVertical && isReversedValueAxis) {
      [maxValue, q3Value, q1Value, minValue] = [minValue, q1Value, q3Value, maxValue];
    }
    const {
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cap,
      whisker: whiskerStyles
    } = activeStyles;
    const selection = Selection2.select(this, Rect2);
    const boxes = selection.selectByTag(0 /* Box */);
    const [outline] = selection.selectByTag(2 /* Outline */);
    const [median] = selection.selectByTag(1 /* Median */);
    const whiskers = selection.selectByTag(3 /* Whisker */);
    const caps = selection.selectByTag(4 /* Cap */);
    if (whiskerStyles.strokeWidth > bandwidth) {
      whiskerStyles.strokeWidth = bandwidth;
    }
    outline.setProperties({ x: q1Value, y: axisValue, width: q3Value - q1Value, height: bandwidth });
    const cornerRadiusBbox = isVertical ? new BBox6(axisValue, q1Value, bandwidth, q3Value - q1Value) : new BBox6(q1Value, axisValue, q3Value - q1Value, bandwidth);
    boxes[0].setProperties({
      x: q1Value,
      y: axisValue,
      width: Math.round(medianValue - q1Value + strokeWidth / 2),
      height: bandwidth,
      cornerRadius,
      cornerRadiusBbox
    });
    boxes[1].setProperties({
      x: Math.round(medianValue - strokeWidth / 2),
      y: axisValue,
      width: Math.floor(q3Value - medianValue + strokeWidth / 2),
      height: bandwidth,
      cornerRadius,
      cornerRadiusBbox
    });
    const medianStart = Math.max(Math.round(medianValue - strokeWidth / 2), q1Value + strokeWidth);
    const medianEnd = Math.min(Math.round(medianValue + strokeWidth / 2), q3Value - strokeWidth);
    median.setProperties({
      visible: medianStart < medianEnd,
      x: medianStart,
      y: axisValue + strokeWidth,
      width: medianEnd - medianStart,
      height: Math.max(0, bandwidth - strokeWidth * 2),
      cornerRadius,
      cornerRadiusBbox
    });
    const capStart = Math.floor(axisValue + bandwidth * (1 - cap.lengthRatio) / 2);
    const capEnd = Math.ceil(axisValue + bandwidth * (1 + cap.lengthRatio) / 2);
    caps[0].setProperties({ x: minValue, y1: capStart, y2: capEnd });
    caps[1].setProperties({ x: maxValue, y1: capStart, y2: capEnd });
    whiskers[0].setProperties({
      x1: Math.round(minValue + whiskerStyles.strokeWidth / 2),
      x2: q1Value,
      y: Math.floor(axisValue + bandwidth / 2)
    });
    whiskers[1].setProperties({
      x1: q3Value,
      x2: Math.round(maxValue - whiskerStyles.strokeWidth / 2),
      y: Math.floor(axisValue + bandwidth / 2)
    });
    if (isVertical) {
      import_ag_charts_community45._ModuleSupport.invertShapeDirection(outline, median, ...boxes, ...caps, ...whiskers);
    }
    for (const element of boxes) {
      element.setProperties({ fill, fillOpacity, strokeWidth: strokeWidth * 2, strokeOpacity: 0 });
    }
    median.setProperties({ fill: stroke, fillOpacity: strokeOpacity, strokeWidth: 0 });
    for (const element of [...whiskers, ...caps]) {
      element.setProperties(whiskerStyles);
    }
    outline.setProperties({
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cornerRadius,
      fillOpacity: 0
    });
  }
};

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeriesProperties.ts
var import_ag_charts_community46 = require("ag-charts-community");
var {
  BaseProperties: BaseProperties5,
  AbstractBarSeriesProperties,
  SeriesTooltip,
  Validate: Validate25,
  COLOR_STRING: COLOR_STRING5,
  FUNCTION: FUNCTION4,
  LINE_DASH: LINE_DASH4,
  OBJECT: OBJECT4,
  POSITIVE_NUMBER: POSITIVE_NUMBER8,
  RATIO: RATIO10,
  STRING: STRING5,
  mergeDefaults: mergeDefaults3
} = import_ag_charts_community46._ModuleSupport;
var BoxPlotSeriesCap = class extends BaseProperties5 {
  constructor() {
    super(...arguments);
    this.lengthRatio = 0.5;
  }
};
__decorateClass([
  Validate25(RATIO10)
], BoxPlotSeriesCap.prototype, "lengthRatio", 2);
var BoxPlotSeriesWhisker = class extends BaseProperties5 {
};
__decorateClass([
  Validate25(COLOR_STRING5, { optional: true })
], BoxPlotSeriesWhisker.prototype, "stroke", 2);
__decorateClass([
  Validate25(POSITIVE_NUMBER8)
], BoxPlotSeriesWhisker.prototype, "strokeWidth", 2);
__decorateClass([
  Validate25(RATIO10)
], BoxPlotSeriesWhisker.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate25(LINE_DASH4, { optional: true })
], BoxPlotSeriesWhisker.prototype, "lineDash", 2);
__decorateClass([
  Validate25(POSITIVE_NUMBER8)
], BoxPlotSeriesWhisker.prototype, "lineDashOffset", 2);
var BoxPlotSeriesProperties = class extends AbstractBarSeriesProperties {
  constructor() {
    super(...arguments);
    this.fill = "#c16068";
    this.fillOpacity = 1;
    this.stroke = "#333";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.cornerRadius = 0;
    this.cap = new BoxPlotSeriesCap();
    this.whisker = new BoxPlotSeriesWhisker();
    this.tooltip = new SeriesTooltip();
  }
  toJson() {
    const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
    const properties = super.toJson();
    properties.whisker = mergeDefaults3(properties.whisker, {
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset
    });
    return properties;
  }
};
__decorateClass([
  Validate25(STRING5)
], BoxPlotSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate25(STRING5)
], BoxPlotSeriesProperties.prototype, "minKey", 2);
__decorateClass([
  Validate25(STRING5)
], BoxPlotSeriesProperties.prototype, "q1Key", 2);
__decorateClass([
  Validate25(STRING5)
], BoxPlotSeriesProperties.prototype, "medianKey", 2);
__decorateClass([
  Validate25(STRING5)
], BoxPlotSeriesProperties.prototype, "q3Key", 2);
__decorateClass([
  Validate25(STRING5)
], BoxPlotSeriesProperties.prototype, "maxKey", 2);
__decorateClass([
  Validate25(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate25(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate25(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "minName", 2);
__decorateClass([
  Validate25(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "q1Name", 2);
__decorateClass([
  Validate25(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "medianName", 2);
__decorateClass([
  Validate25(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "q3Name", 2);
__decorateClass([
  Validate25(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "maxName", 2);
__decorateClass([
  Validate25(COLOR_STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate25(RATIO10)
], BoxPlotSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate25(COLOR_STRING5)
], BoxPlotSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate25(POSITIVE_NUMBER8)
], BoxPlotSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate25(RATIO10)
], BoxPlotSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate25(LINE_DASH4)
], BoxPlotSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate25(POSITIVE_NUMBER8)
], BoxPlotSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate25(POSITIVE_NUMBER8)
], BoxPlotSeriesProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate25(FUNCTION4, { optional: true })
], BoxPlotSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate25(OBJECT4)
], BoxPlotSeriesProperties.prototype, "cap", 2);
__decorateClass([
  Validate25(OBJECT4)
], BoxPlotSeriesProperties.prototype, "whisker", 2);
__decorateClass([
  Validate25(OBJECT4)
], BoxPlotSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeries.ts
var {
  extent,
  extractDecoratedProperties,
  fixNumericExtent: fixNumericExtent2,
  keyProperty,
  mergeDefaults: mergeDefaults4,
  SeriesNodePickMode,
  SMALLEST_KEY_INTERVAL,
  valueProperty: valueProperty2,
  diff,
  animationValidation,
  ChartAxisDirection: ChartAxisDirection8,
  convertValuesToScaleByDefs
} = import_ag_charts_community47._ModuleSupport;
var { motion } = import_ag_charts_community47._Scene;
var BoxPlotSeriesNodeEvent = class extends import_ag_charts_community47._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.minKey = series.properties.minKey;
    this.q1Key = series.properties.q1Key;
    this.medianKey = series.properties.medianKey;
    this.q3Key = series.properties.q3Key;
    this.maxKey = series.properties.maxKey;
  }
};
var _BoxPlotSeries = class _BoxPlotSeries extends import_ag_charts_community47._ModuleSupport.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
      directionKeys: {
        x: ["xKey"],
        y: ["medianKey", "q1Key", "q3Key", "minKey", "maxKey"]
      },
      directionNames: {
        x: ["xName"],
        y: ["medianName", "q1Name", "q3Name", "minName", "maxName"]
      },
      pathsPerSeries: 1,
      hasHighlightedLabels: true
    });
    this.properties = new BoxPlotSeriesProperties();
    this.NodeEvent = BoxPlotSeriesNodeEvent;
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d;
      if (!this.properties.isValid()) {
        return;
      }
      const { xKey, minKey, q1Key, medianKey, q3Key, maxKey } = this.properties;
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      const isContinuousX = ((_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale) instanceof import_ag_charts_community47._Scale.ContinuousScale;
      const extraProps = [];
      if (animationEnabled && this.processedData) {
        extraProps.push(diff(this.processedData));
      }
      if (animationEnabled) {
        extraProps.push(animationValidation(this));
      }
      const { processedData } = yield this.requestDataModel(dataController, (_b = this.data) != null ? _b : [], {
        props: [
          keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
          valueProperty2(this, minKey, true, { id: `minValue` }),
          valueProperty2(this, q1Key, true, { id: `q1Value` }),
          valueProperty2(this, medianKey, true, { id: `medianValue` }),
          valueProperty2(this, q3Key, true, { id: `q3Value` }),
          valueProperty2(this, maxKey, true, { id: `maxValue` }),
          ...isContinuousX ? [SMALLEST_KEY_INTERVAL] : [],
          ...extraProps
        ],
        dataVisible: this.visible
      });
      this.smallestDataInterval = {
        x: (_d = (_c = processedData.reduced) == null ? void 0 : _c.smallestKeyInterval) != null ? _d : Infinity,
        y: Infinity
      };
      this.animationState.transition("updateData");
    });
  }
  getSeriesDomain(direction) {
    var _a2;
    const { processedData, dataModel, smallestDataInterval } = this;
    if (!(processedData && dataModel))
      return [];
    if (direction === this.getBarDirection()) {
      const minValues = dataModel.getDomain(this, `minValue`, "value", processedData);
      const maxValues = dataModel.getDomain(this, `maxValue`, "value", processedData);
      return fixNumericExtent2([Math.min(...minValues), Math.max(...maxValues)], this.getValueAxis());
    }
    const { index, def } = dataModel.resolveProcessedDataIndexById(this, `xValue`);
    const keys = processedData.domain.keys[index];
    if (def.type === "key" && def.valueType === "category") {
      return keys;
    }
    const categoryAxis = this.getCategoryAxis();
    const isReversed = categoryAxis == null ? void 0 : categoryAxis.isReversed();
    const keysExtent = (_a2 = extent(keys)) != null ? _a2 : [NaN, NaN];
    const scalePadding = smallestDataInterval && isFinite(smallestDataInterval.x) ? smallestDataInterval.x : 0;
    if (direction === ChartAxisDirection8.Y) {
      const d02 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
      const d12 = keysExtent[1] + (isReversed ? scalePadding : 0);
      return fixNumericExtent2([d02, d12], categoryAxis);
    }
    const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
    const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
    return fixNumericExtent2([d0, d1], categoryAxis);
  }
  createNodeData() {
    return __async(this, null, function* () {
      const { visible, dataModel } = this;
      const xAxis = this.getCategoryAxis();
      const yAxis = this.getValueAxis();
      if (!(dataModel && visible && xAxis && yAxis)) {
        return [];
      }
      const { xKey, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } = this.properties;
      const nodeData = [];
      const defs = dataModel.resolveProcessedDataDefsByIds(this, [
        "xValue",
        "minValue",
        "q1Value",
        `medianValue`,
        `q3Value`,
        `maxValue`
      ]);
      const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
      const { groupScale, processedData } = this;
      const isVertical = this.isVertical();
      processedData == null ? void 0 : processedData.data.forEach(({ datum, keys, values }) => {
        const { xValue, minValue, q1Value, medianValue, q3Value, maxValue } = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
        if ([minValue, q1Value, medianValue, q3Value, maxValue].some((value) => typeof value !== "number") || minValue > q1Value || q1Value > medianValue || medianValue > q3Value || q3Value > maxValue) {
          return;
        }
        const scaledValues = convertValuesToScaleByDefs({
          defs,
          values: {
            xValue,
            minValue,
            q1Value,
            medianValue,
            q3Value,
            maxValue
          },
          xAxis,
          yAxis
        });
        scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex)));
        const bandwidth = Math.round(barWidth);
        const height = Math.abs(scaledValues.q3Value - scaledValues.q1Value);
        const midX = scaledValues.xValue + bandwidth / 2;
        const midY = Math.min(scaledValues.q3Value, scaledValues.q1Value) + height / 2;
        const midPoint = {
          x: isVertical ? midX : midY,
          y: isVertical ? midY : midX
        };
        nodeData.push({
          series: this,
          itemId: xValue,
          datum,
          xKey,
          bandwidth,
          scaledValues,
          cap,
          whisker,
          fill,
          fillOpacity,
          stroke,
          strokeWidth,
          strokeOpacity,
          lineDash,
          lineDashOffset,
          midPoint
        });
      });
      return [{ itemId: xKey, nodeData, labelData: [], scales: __superGet(_BoxPlotSeries.prototype, this, "calculateScaling").call(this), visible: this.visible }];
    });
  }
  getLegendData(legendType) {
    var _a2;
    const { id, data } = this;
    const {
      xKey,
      yName,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      showInLegend,
      legendItemName,
      visible
    } = this.properties;
    if (!showInLegend || !(data == null ? void 0 : data.length) || !xKey || legendType !== "category") {
      return [];
    }
    return [
      {
        legendType: "category",
        id,
        itemId: id,
        seriesId: id,
        enabled: visible,
        label: {
          text: (_a2 = legendItemName != null ? legendItemName : yName) != null ? _a2 : id
        },
        marker: { fill, fillOpacity, stroke, strokeOpacity, strokeWidth },
        legendItemName
      }
    ];
  }
  getTooltipHtml(nodeDatum) {
    const {
      xKey,
      minKey,
      q1Key,
      medianKey,
      q3Key,
      maxKey,
      xName,
      yName,
      minName,
      q1Name,
      medianName,
      q3Name,
      maxName,
      tooltip
    } = this.properties;
    const { datum } = nodeDatum;
    const xAxis = this.getCategoryAxis();
    const yAxis = this.getValueAxis();
    if (!xAxis || !yAxis || !this.properties.isValid())
      return "";
    const title = import_ag_charts_community47._Util.sanitizeHtml(yName);
    const contentData = [
      [xKey, xName, xAxis],
      [minKey, minName, yAxis],
      [q1Key, q1Name, yAxis],
      [medianKey, medianName, yAxis],
      [q3Key, q3Name, yAxis],
      [maxKey, maxName, yAxis]
    ];
    const content = contentData.map(([key, name, axis]) => import_ag_charts_community47._Util.sanitizeHtml(`${name != null ? name : key}: ${axis.formatDatum(datum[key])}`)).join(title ? "<br/>" : ", ");
    const { fill } = this.getFormattedStyles(nodeDatum);
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: fill },
      {
        seriesId: this.id,
        datum,
        fill,
        xKey,
        minKey,
        q1Key,
        medianKey,
        q3Key,
        maxKey,
        xName,
        minName,
        q1Name,
        medianName,
        q3Name,
        maxName
      }
    );
  }
  animateEmptyUpdateReady({
    datumSelections
  }) {
    const isVertical = this.isVertical();
    const { from, to } = prepareBoxPlotFromTo(isVertical);
    motion.resetMotion(datumSelections, resetBoxPlotSelectionsScalingCenterFn(isVertical));
    motion.staticFromToMotion(this.id, "datums", this.ctx.animationManager, datumSelections, from, to, {
      phase: "initial"
    });
  }
  isLabelEnabled() {
    return false;
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      var _a2;
      const data = (_a2 = opts.nodeData) != null ? _a2 : [];
      return opts.datumSelection.update(data);
    });
  }
  updateDatumNodes(_0) {
    return __async(this, arguments, function* ({
      datumSelection,
      isHighlight: highlighted
    }) {
      var _a2;
      const isVertical = this.isVertical();
      const isReversedValueAxis = (_a2 = this.getValueAxis()) == null ? void 0 : _a2.isReversed();
      const { cornerRadius } = this.properties;
      datumSelection.each((boxPlotGroup, nodeDatum) => {
        let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);
        if (highlighted) {
          activeStyles = mergeDefaults4(this.properties.highlightStyle.item, activeStyles);
        }
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;
        activeStyles.whisker = mergeDefaults4(activeStyles.whisker, {
          stroke,
          strokeWidth,
          strokeOpacity,
          lineDash,
          lineDashOffset
        });
        boxPlotGroup.updateDatumStyles(
          nodeDatum,
          activeStyles,
          isVertical,
          isReversedValueAxis,
          cornerRadius
        );
      });
    });
  }
  updateLabelNodes(_opts) {
    return __async(this, null, function* () {
    });
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      const { labelData, labelSelection } = opts;
      return labelSelection.update(labelData);
    });
  }
  nodeFactory() {
    return new BoxPlotGroup();
  }
  getFormattedStyles(nodeDatum, highlighted = false) {
    const {
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const { xKey, minKey, q1Key, medianKey, q3Key, maxKey, formatter } = this.properties;
    const { datum, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } = nodeDatum;
    const activeStyles = {
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cap: extractDecoratedProperties(cap),
      whisker: extractDecoratedProperties(whisker)
    };
    if (formatter) {
      const formatStyles = callbackCache.call(formatter, __spreadProps(__spreadValues({
        datum,
        seriesId,
        highlighted
      }, activeStyles), {
        xKey,
        minKey,
        q1Key,
        medianKey,
        q3Key,
        maxKey
      }));
      if (formatStyles) {
        return mergeDefaults4(formatStyles, activeStyles);
      }
    }
    return activeStyles;
  }
};
_BoxPlotSeries.className = "BoxPlotSeries";
_BoxPlotSeries.type = "box-plot";
var BoxPlotSeries = _BoxPlotSeries;

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotThemes.ts
var import_ag_charts_community48 = require("ag-charts-community");
var BOX_PLOT_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community48._Theme.EXTENDS_SERIES_DEFAULTS,
    direction: "vertical",
    strokeWidth: 2
  },
  axes: {
    [import_ag_charts_community48._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        snap: false
      }
    },
    [import_ag_charts_community48._Theme.CARTESIAN_AXIS_TYPE.CATEGORY]: {
      groupPaddingInner: 0.2,
      crosshair: {
        enabled: false,
        snap: false
      }
    }
  }
};

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotModule.ts
var BoxPlotModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "box-plot",
  instanceConstructor: BoxPlotSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community49._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community49._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community49._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community49._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: BOX_PLOT_SERIES_THEME,
  groupable: true,
  paletteFactory: ({ takeColors, userPalette, themeTemplateParameters }) => {
    var _a2;
    const themeBackgroundColor = themeTemplateParameters.properties.get(import_ag_charts_community49._Theme.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (_a2 = Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) != null ? _a2 : "white";
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      fill: userPalette ? fill : import_ag_charts_community49._Util.Color.interpolate(fill, backgroundFill)(0.7),
      stroke
    };
  },
  swapDefaultAxesCondition: ({ direction }) => direction === "horizontal"
};

// packages/ag-charts-enterprise/src/series/bullet/bulletModule.ts
var import_ag_charts_community53 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/bullet/bulletSeries.ts
var import_ag_charts_community51 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/bullet/bulletSeriesProperties.ts
var import_ag_charts_community50 = require("ag-charts-community");
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties2,
  BaseProperties: BaseProperties6,
  PropertiesArray,
  SeriesTooltip: SeriesTooltip2,
  Validate: Validate26,
  ARRAY: ARRAY2,
  COLOR_STRING: COLOR_STRING6,
  LINE_DASH: LINE_DASH5,
  OBJECT: OBJECT5,
  POSITIVE_NUMBER: POSITIVE_NUMBER9,
  RATIO: RATIO11,
  STRING: STRING6
} = import_ag_charts_community50._ModuleSupport;
var TargetStyle = class extends BaseProperties6 {
  constructor() {
    super(...arguments);
    this.fill = "black";
    this.fillOpacity = 1;
    this.stroke = "black";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.lengthRatio = 0.75;
  }
};
__decorateClass([
  Validate26(COLOR_STRING6)
], TargetStyle.prototype, "fill", 2);
__decorateClass([
  Validate26(RATIO11)
], TargetStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate26(COLOR_STRING6)
], TargetStyle.prototype, "stroke", 2);
__decorateClass([
  Validate26(POSITIVE_NUMBER9)
], TargetStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate26(RATIO11)
], TargetStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate26(LINE_DASH5)
], TargetStyle.prototype, "lineDash", 2);
__decorateClass([
  Validate26(POSITIVE_NUMBER9)
], TargetStyle.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate26(RATIO11)
], TargetStyle.prototype, "lengthRatio", 2);
var BulletScale = class extends BaseProperties6 {
};
__decorateClass([
  Validate26(POSITIVE_NUMBER9, { optional: true })
], BulletScale.prototype, "max", 2);
var BulletColorRange = class extends BaseProperties6 {
  constructor() {
    super(...arguments);
    this.color = "lightgrey";
  }
};
__decorateClass([
  Validate26(COLOR_STRING6)
], BulletColorRange.prototype, "color", 2);
__decorateClass([
  Validate26(POSITIVE_NUMBER9, { optional: true })
], BulletColorRange.prototype, "stop", 2);
var BulletSeriesProperties = class extends AbstractBarSeriesProperties2 {
  constructor() {
    super(...arguments);
    this.fill = "black";
    this.fillOpacity = 1;
    this.stroke = "black";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.widthRatio = 0.5;
    this.colorRanges = new PropertiesArray(BulletColorRange);
    this.target = new TargetStyle();
    this.scale = new BulletScale();
    this.tooltip = new SeriesTooltip2();
    // Internal: Set by paletteFactory.
    this.backgroundFill = "white";
  }
};
__decorateClass([
  Validate26(STRING6)
], BulletSeriesProperties.prototype, "valueKey", 2);
__decorateClass([
  Validate26(STRING6, { optional: true })
], BulletSeriesProperties.prototype, "valueName", 2);
__decorateClass([
  Validate26(STRING6, { optional: true })
], BulletSeriesProperties.prototype, "targetKey", 2);
__decorateClass([
  Validate26(STRING6, { optional: true })
], BulletSeriesProperties.prototype, "targetName", 2);
__decorateClass([
  Validate26(COLOR_STRING6)
], BulletSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate26(RATIO11)
], BulletSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate26(COLOR_STRING6)
], BulletSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate26(POSITIVE_NUMBER9)
], BulletSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate26(RATIO11)
], BulletSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate26(LINE_DASH5)
], BulletSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate26(POSITIVE_NUMBER9)
], BulletSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate26(RATIO11)
], BulletSeriesProperties.prototype, "widthRatio", 2);
__decorateClass([
  Validate26(ARRAY2.restrict({ minLength: 0 }))
], BulletSeriesProperties.prototype, "colorRanges", 2);
__decorateClass([
  Validate26(OBJECT5)
], BulletSeriesProperties.prototype, "target", 2);
__decorateClass([
  Validate26(OBJECT5)
], BulletSeriesProperties.prototype, "scale", 2);
__decorateClass([
  Validate26(OBJECT5)
], BulletSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate26(COLOR_STRING6)
], BulletSeriesProperties.prototype, "backgroundFill", 2);

// packages/ag-charts-enterprise/src/series/bullet/bulletSeries.ts
var {
  animationValidation: animationValidation2,
  collapsedStartingBarPosition,
  diff: diff2,
  keyProperty: keyProperty2,
  partialAssign: partialAssign2,
  prepareBarAnimationFunctions,
  resetBarSelectionsFn,
  seriesLabelFadeInAnimation,
  valueProperty: valueProperty3,
  createDatumId
} = import_ag_charts_community51._ModuleSupport;
var { fromToMotion } = import_ag_charts_community51._Scene.motion;
var { ContinuousScale, OrdinalTimeScale: OrdinalTimeScale2 } = import_ag_charts_community51._Scale;
var { sanitizeHtml } = import_ag_charts_community51._Util;
var STYLING_KEYS = [
  "fill",
  "fillOpacity",
  "stroke",
  "strokeWidth",
  "strokeOpacity",
  "lineDash",
  "lineDashOffset"
];
var BulletSeries = class _BulletSeries extends import_ag_charts_community51._ModuleSupport.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      directionKeys: { y: ["targetKey", "valueKey"] },
      directionNames: { y: ["targetName", "valueName"] },
      pickModes: [import_ag_charts_community51._ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH],
      hasHighlightedLabels: true,
      animationResetFns: {
        datum: resetBarSelectionsFn
      }
    });
    this.properties = new BulletSeriesProperties();
    this.normalizedColorRanges = [];
    this.colorRangesGroup = new import_ag_charts_community51._Scene.Group({ name: `${this.id}-colorRanges` });
    this.colorRangesSelection = import_ag_charts_community51._Scene.Selection.select(this.colorRangesGroup, import_ag_charts_community51._Scene.Rect, false);
    this.rootGroup.append(this.colorRangesGroup);
    this.targetLinesSelection = import_ag_charts_community51._Scene.Selection.select(this.annotationGroup, import_ag_charts_community51._Scene.Line, false);
  }
  destroy() {
    this.rootGroup.removeChild(this.colorRangesGroup);
    super.destroy();
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b;
      if (!this.properties.isValid() || !this.data) {
        return;
      }
      const { valueKey, targetKey } = this.properties;
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const yScale = (_b = this.getValueAxis()) == null ? void 0 : _b.scale;
      const isContinuousX = ContinuousScale.is(xScale) || OrdinalTimeScale2.is(xScale);
      const isContinuousY = ContinuousScale.is(yScale) || OrdinalTimeScale2.is(yScale);
      const xValueType = ContinuousScale.is(xScale) ? "range" : "category";
      const extraProps = [];
      if (targetKey !== void 0) {
        extraProps.push(valueProperty3(this, targetKey, isContinuousY, { id: "target" }));
      }
      if (!this.ctx.animationManager.isSkipped()) {
        if (this.processedData !== void 0) {
          extraProps.push(diff2(this.processedData));
        }
        extraProps.push(animationValidation2(this));
      }
      yield this.requestDataModel(dataController, this.data.slice(0, 1), {
        props: [
          keyProperty2(this, valueKey, isContinuousX, { id: "xValue", valueType: xValueType }),
          valueProperty3(this, valueKey, isContinuousY, { id: "value" }),
          ...extraProps
        ],
        groupByKeys: true,
        dataVisible: this.visible
      });
      this.animationState.transition("updateData");
    });
  }
  getBandScalePadding() {
    return { inner: 0, outer: 0 };
  }
  getMaxValue() {
    var _a2, _b;
    return Math.max(...(_b = (_a2 = this.getValueAxis()) == null ? void 0 : _a2.dataDomain.domain) != null ? _b : [0]);
  }
  getSeriesDomain(direction) {
    var _a2, _b;
    const { dataModel, processedData } = this;
    if (!dataModel || !processedData) {
      return [];
    }
    const { valueKey, targetKey, valueName, scale } = this.properties;
    if (direction === this.getCategoryDirection()) {
      return [valueName != null ? valueName : valueKey];
    }
    if (direction == ((_a2 = this.getValueAxis()) == null ? void 0 : _a2.direction)) {
      const valueDomain = dataModel.getDomain(this, "value", "value", processedData);
      const targetDomain = targetKey === void 0 ? [] : dataModel.getDomain(this, "target", "value", processedData);
      return [0, (_b = scale.max) != null ? _b : Math.max(...valueDomain, ...targetDomain)];
    }
    throw new Error(`unknown direction ${direction}`);
  }
  getKeys(direction) {
    if (direction === this.getBarDirection()) {
      return [this.properties.valueKey];
    }
    return super.getKeys(direction);
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d;
      const { dataModel, processedData } = this;
      const {
        valueKey,
        targetKey,
        widthRatio,
        target: { lengthRatio }
      } = this.properties;
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const yScale = (_b = this.getValueAxis()) == null ? void 0 : _b.scale;
      if (!valueKey || !dataModel || !processedData || !xScale || !yScale)
        return [];
      if (widthRatio === void 0 || lengthRatio === void 0)
        return [];
      const multiplier = (_c = xScale.bandwidth) != null ? _c : NaN;
      const maxValue = this.getMaxValue();
      const valueIndex = dataModel.resolveProcessedDataIndexById(this, "value").index;
      const targetIndex = targetKey === void 0 ? NaN : dataModel.resolveProcessedDataIndexById(this, "target").index;
      const context = {
        itemId: valueKey,
        nodeData: [],
        labelData: [],
        scales: __superGet(_BulletSeries.prototype, this, "calculateScaling").call(this),
        visible: this.visible
      };
      for (const { datum, values } of processedData.data) {
        if (!Array.isArray(datum) || datum.length < 1) {
          continue;
        }
        if (values[0][valueIndex] < 0) {
          import_ag_charts_community51._Util.Logger.warnOnce("negative values are not supported, clipping to 0.");
        }
        const xValue = (_d = this.properties.valueName) != null ? _d : this.properties.valueKey;
        const yValue = Math.min(maxValue, Math.max(0, values[0][valueIndex]));
        const y = yScale.convert(yValue);
        const barWidth = widthRatio * multiplier;
        const bottomY = yScale.convert(0);
        const barAlongX = this.getBarDirection() === import_ag_charts_community51._ModuleSupport.ChartAxisDirection.X;
        const rect = {
          x: multiplier * (1 - widthRatio) / 2,
          y: Math.min(y, bottomY),
          width: barWidth,
          height: Math.abs(bottomY - y)
        };
        if (barAlongX) {
          [rect.x, rect.y, rect.width, rect.height] = [rect.y, rect.x, rect.height, rect.width];
        }
        let target;
        if (values[0][targetIndex] < 0) {
          import_ag_charts_community51._Util.Logger.warnOnce("negative targets are not supported, ignoring.");
        }
        if (this.properties.targetKey && values[0][targetIndex] >= 0) {
          const targetLineLength = lengthRatio * multiplier;
          const targetValue = Math.min(maxValue, values[0][targetIndex]);
          if (!isNaN(targetValue) && targetValue !== void 0) {
            const convertedY = yScale.convert(targetValue);
            let x1 = multiplier * (1 - lengthRatio) / 2;
            let x2 = x1 + targetLineLength;
            let [y1, y2] = [convertedY, convertedY];
            if (barAlongX) {
              [x1, x2, y1, y2] = [y1, y2, x1, x2];
            }
            target = { value: targetValue, x1, x2, y1, y2 };
          }
        }
        const nodeData = __spreadProps(__spreadValues({
          series: this,
          datum: datum[0],
          xKey: valueKey,
          xValue,
          yKey: valueKey,
          yValue,
          cumulativeValue: yValue,
          target
        }, rect), {
          midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
          opacity: 1
        });
        context.nodeData.push(nodeData);
      }
      const sortedRanges = [...this.getColorRanges()].sort((a, b) => {
        var _a3, _b2;
        return ((_a3 = a.stop) != null ? _a3 : maxValue) - ((_b2 = b.stop) != null ? _b2 : maxValue);
      });
      let start = 0;
      this.normalizedColorRanges = sortedRanges.map((item) => {
        var _a3;
        const stop = Math.min(maxValue, (_a3 = item.stop) != null ? _a3 : Infinity);
        const result = { color: item.color, start, stop };
        start = stop;
        return result;
      });
      return [context];
    });
  }
  getColorRanges() {
    const { colorRanges, fill, backgroundFill } = this.properties;
    if (colorRanges !== void 0 && colorRanges.length > 0) {
      return colorRanges;
    }
    const defaultColorRange = new BulletColorRange();
    defaultColorRange.color = import_ag_charts_community51._Util.Color.interpolate(fill, backgroundFill)(0.7);
    return [defaultColorRange];
  }
  getLegendData(_legendType) {
    return [];
  }
  getTooltipHtml(nodeDatum) {
    const { valueKey, valueName, targetKey, targetName } = this.properties;
    const axis = this.getValueAxis();
    const { yValue: valueValue, target: { value: targetValue } = { value: void 0 }, datum } = nodeDatum;
    if (valueKey === void 0 || valueValue === void 0 || axis === void 0) {
      return "";
    }
    const makeLine = (key, name, value) => {
      const nameString = sanitizeHtml(name != null ? name : key);
      const valueString = sanitizeHtml(axis.formatDatum(value));
      return `<b>${nameString}</b>: ${valueString}`;
    };
    const title = void 0;
    const content = targetKey === void 0 || targetValue === void 0 ? makeLine(valueKey, valueName, valueValue) : `${makeLine(valueKey, valueName, valueValue)}<br/>${makeLine(targetKey, targetName, targetValue)}`;
    return this.properties.tooltip.toTooltipHtml(
      { title, content, backgroundColor: this.properties.fill },
      { datum, title, seriesId: this.id, valueKey, valueName, targetKey, targetName }
    );
  }
  isLabelEnabled() {
    return false;
  }
  nodeFactory() {
    return new import_ag_charts_community51._Scene.Rect();
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      this.targetLinesSelection.update(opts.nodeData, void 0, void 0);
      return opts.datumSelection.update(opts.nodeData, void 0, void 0);
    });
  }
  updateDatumNodes(opts) {
    return __async(this, null, function* () {
      for (const { node } of opts.datumSelection) {
        const style = this.properties;
        partialAssign2(STYLING_KEYS, node, style);
      }
      for (const { node, datum } of this.targetLinesSelection) {
        if (datum.target === void 0) {
          node.visible = false;
        } else {
          const style = this.properties.target;
          partialAssign2(["x1", "x2", "y1", "y2"], node, datum.target);
          partialAssign2(STYLING_KEYS, node, style);
        }
      }
    });
  }
  updateColorRanges() {
    return __async(this, null, function* () {
      const valAxis = this.getValueAxis();
      const catAxis = this.getCategoryAxis();
      if (!valAxis || !catAxis)
        return;
      const [min, max] = [0, Math.max(...catAxis.scale.range)];
      const computeRect = this.getBarDirection() === import_ag_charts_community51._ModuleSupport.ChartAxisDirection.Y ? (rect, colorRange) => {
        rect.x = min;
        rect.y = valAxis.scale.convert(colorRange.stop);
        rect.height = valAxis.scale.convert(colorRange.start) - rect.y;
        rect.width = max;
      } : (rect, colorRange) => {
        rect.x = valAxis.scale.convert(colorRange.start);
        rect.y = min;
        rect.height = max;
        rect.width = valAxis.scale.convert(colorRange.stop) - rect.x;
      };
      this.colorRangesSelection.update(this.normalizedColorRanges);
      for (const { node, datum } of this.colorRangesSelection) {
        computeRect(node, datum);
        node.fill = datum.color;
      }
    });
  }
  updateNodes(highlightedItems, seriesHighlighted, anySeriesItemEnabled) {
    return __async(this, null, function* () {
      yield __superGet(_BulletSeries.prototype, this, "updateNodes").call(this, highlightedItems, seriesHighlighted, anySeriesItemEnabled);
      yield this.updateColorRanges();
    });
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      return opts.labelSelection;
    });
  }
  updateLabelNodes(_opts) {
    return __async(this, null, function* () {
    });
  }
  animateEmptyUpdateReady(data) {
    const { datumSelections, annotationSelections } = data;
    const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, "normal"));
    fromToMotion(this.id, "nodes", this.ctx.animationManager, datumSelections, fns);
    seriesLabelFadeInAnimation(this, "annotations", this.ctx.animationManager, annotationSelections);
  }
  animateWaitingUpdateReady(data) {
    var _a2, _b, _c;
    const { datumSelections, annotationSelections } = data;
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    const dataDiff = (_b = (_a2 = this.processedData) == null ? void 0 : _a2.reduced) == null ? void 0 : _b.diff;
    const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, "normal"));
    fromToMotion(
      this.id,
      "nodes",
      this.ctx.animationManager,
      datumSelections,
      fns,
      (_, datum) => createDatumId(datum.xValue),
      dataDiff
    );
    const hasMotion = (_c = dataDiff == null ? void 0 : dataDiff.changed) != null ? _c : true;
    if (hasMotion) {
      seriesLabelFadeInAnimation(this, "annotations", this.ctx.animationManager, annotationSelections);
    }
  }
};

// packages/ag-charts-enterprise/src/series/bullet/bulletThemes.ts
var import_ag_charts_community52 = require("ag-charts-community");
var BULLET_SERIES_THEME = {
  series: {
    direction: "vertical",
    strokeWidth: 0,
    strokeOpacity: 1,
    fillOpacity: 1,
    widthRatio: 0.5,
    target: {
      strokeWidth: 3,
      strokeOpacity: 1,
      lengthRatio: 0.75
    }
  },
  axes: {
    [import_ag_charts_community52._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
      nice: false,
      crosshair: {
        enabled: false
      }
    }
  }
};

// packages/ag-charts-enterprise/src/series/bullet/bulletModule.ts
var BulletModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "bullet",
  solo: true,
  instanceConstructor: BulletSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community53._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community53._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community53._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community53._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: BULLET_SERIES_THEME,
  swapDefaultAxesCondition: (series) => (series == null ? void 0 : series.direction) === "horizontal",
  paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
    var _a2;
    const { properties } = themeTemplateParameters;
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(colorsCount);
    const themeBackgroundColor = themeTemplateParameters.properties.get(import_ag_charts_community53._Theme.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (_a2 = Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) != null ? _a2 : "white";
    const targetStroke = properties.get(import_ag_charts_community53._Theme.DEFAULT_CROSS_LINES_COLOUR);
    return {
      fill,
      stroke,
      target: { stroke: targetStroke },
      backgroundFill
    };
  }
};

// packages/ag-charts-enterprise/src/series/candlestick/candlestickModule.ts
var import_ag_charts_community58 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeries.ts
var import_ag_charts_community56 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/candlestick/candlestickGroup.ts
var import_ag_charts_community54 = require("ag-charts-community");
var CandlestickGroup = class extends import_ag_charts_community54._Scene.Group {
  constructor() {
    super();
    this.append([
      new import_ag_charts_community54._Scene.Rect({ tag: 0 /* Rect */ }),
      new import_ag_charts_community54._Scene.Line({ tag: 2 /* Wick */ }),
      new import_ag_charts_community54._Scene.Line({ tag: 2 /* Wick */ })
    ]);
  }
  updateDatumStyles(datum, activeStyles) {
    const {
      bandwidth,
      scaledValues: { xValue: axisValue }
    } = datum;
    const { openValue, closeValue, highValue, lowValue } = datum.scaledValues;
    const {
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      wick: wickStyles,
      cornerRadius
    } = activeStyles;
    const selection = import_ag_charts_community54._Scene.Selection.select(this, import_ag_charts_community54._Scene.Rect);
    const [rect] = selection.selectByTag(0 /* Rect */);
    const wicks = selection.selectByTag(2 /* Wick */);
    if (wickStyles.strokeWidth > bandwidth) {
      wickStyles.strokeWidth = bandwidth;
    }
    const y = Math.min(openValue, closeValue);
    const yBottom = Math.max(openValue, closeValue);
    const yHigh = Math.min(highValue, lowValue);
    const yLow = Math.max(highValue, lowValue);
    rect.setProperties({
      x: axisValue,
      y,
      width: bandwidth,
      height: yBottom - y
    });
    rect.setProperties({
      fill,
      fillOpacity,
      strokeWidth,
      strokeOpacity,
      stroke,
      lineDash,
      lineDashOffset,
      cornerRadius
    });
    wicks[0].setProperties({
      y1: Math.round(yLow + wickStyles.strokeWidth / 2),
      y2: yBottom,
      x: Math.floor(axisValue + bandwidth / 2)
    });
    wicks[0].setProperties(wickStyles);
    wicks[1].setProperties({
      y1: Math.round(yHigh - wickStyles.strokeWidth / 2),
      y2: y,
      x: Math.floor(axisValue + bandwidth / 2)
    });
    wicks[1].setProperties(wickStyles);
  }
};

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeriesProperties.ts
var import_ag_charts_community55 = require("ag-charts-community");
var {
  BaseProperties: BaseProperties7,
  AbstractBarSeriesProperties: AbstractBarSeriesProperties3,
  SeriesTooltip: SeriesTooltip3,
  Validate: Validate27,
  COLOR_STRING: COLOR_STRING7,
  FUNCTION: FUNCTION5,
  LINE_DASH: LINE_DASH6,
  OBJECT: OBJECT6,
  POSITIVE_NUMBER: POSITIVE_NUMBER10,
  RATIO: RATIO12,
  STRING: STRING7
} = import_ag_charts_community55._ModuleSupport;
var CandlestickSeriesWick = class extends BaseProperties7 {
};
__decorateClass([
  Validate27(COLOR_STRING7, { optional: true })
], CandlestickSeriesWick.prototype, "stroke", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
], CandlestickSeriesWick.prototype, "strokeWidth", 2);
__decorateClass([
  Validate27(RATIO12)
], CandlestickSeriesWick.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate27(LINE_DASH6, { optional: true })
], CandlestickSeriesWick.prototype, "lineDash", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
], CandlestickSeriesWick.prototype, "lineDashOffset", 2);
var CandlestickSeriesItem = class extends BaseProperties7 {
  constructor() {
    super(...arguments);
    this.fill = "#c16068";
    this.fillOpacity = 1;
    this.stroke = "#333";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.cornerRadius = 0;
    this.wick = new CandlestickSeriesWick();
  }
};
__decorateClass([
  Validate27(COLOR_STRING7, { optional: true })
], CandlestickSeriesItem.prototype, "fill", 2);
__decorateClass([
  Validate27(RATIO12)
], CandlestickSeriesItem.prototype, "fillOpacity", 2);
__decorateClass([
  Validate27(COLOR_STRING7)
], CandlestickSeriesItem.prototype, "stroke", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
], CandlestickSeriesItem.prototype, "strokeWidth", 2);
__decorateClass([
  Validate27(RATIO12)
], CandlestickSeriesItem.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate27(LINE_DASH6)
], CandlestickSeriesItem.prototype, "lineDash", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
], CandlestickSeriesItem.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
], CandlestickSeriesItem.prototype, "cornerRadius", 2);
__decorateClass([
  Validate27(FUNCTION5, { optional: true })
], CandlestickSeriesItem.prototype, "formatter", 2);
__decorateClass([
  Validate27(OBJECT6)
], CandlestickSeriesItem.prototype, "wick", 2);
var CandlestickSeriesItems = class extends BaseProperties7 {
  constructor() {
    super(...arguments);
    this.up = new CandlestickSeriesItem();
    this.down = new CandlestickSeriesItem();
  }
};
__decorateClass([
  Validate27(OBJECT6)
], CandlestickSeriesItems.prototype, "up", 2);
__decorateClass([
  Validate27(OBJECT6)
], CandlestickSeriesItems.prototype, "down", 2);
var CandlestickSeriesProperties = class extends AbstractBarSeriesProperties3 {
  constructor() {
    super(...arguments);
    this.item = new CandlestickSeriesItems();
    this.tooltip = new SeriesTooltip3();
  }
};
__decorateClass([
  Validate27(STRING7)
], CandlestickSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate27(STRING7)
], CandlestickSeriesProperties.prototype, "openKey", 2);
__decorateClass([
  Validate27(STRING7)
], CandlestickSeriesProperties.prototype, "closeKey", 2);
__decorateClass([
  Validate27(STRING7)
], CandlestickSeriesProperties.prototype, "highKey", 2);
__decorateClass([
  Validate27(STRING7)
], CandlestickSeriesProperties.prototype, "lowKey", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], CandlestickSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], CandlestickSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], CandlestickSeriesProperties.prototype, "openName", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], CandlestickSeriesProperties.prototype, "closeName", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], CandlestickSeriesProperties.prototype, "highName", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], CandlestickSeriesProperties.prototype, "lowName", 2);
__decorateClass([
  Validate27(FUNCTION5, { optional: true })
], CandlestickSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate27(OBJECT6)
], CandlestickSeriesProperties.prototype, "item", 2);
__decorateClass([
  Validate27(OBJECT6)
], CandlestickSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/candlestick/candlestickUtil.ts
function prepareCandlestickFromTo(isVertical) {
  const from = isVertical ? { scalingX: 1, scalingY: 0 } : { scalingX: 0, scalingY: 1 };
  const to = { scalingX: 1, scalingY: 1 };
  return { from, to };
}
function resetCandlestickSelectionsScalingStartFn(isVertical) {
  return (_node, datum) => {
    if (isVertical) {
      const maxOrMin = datum.itemId === "up" ? Math.max : Math.min;
      return { scalingCenterY: maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue) };
    }
    return { scalingCenterX: datum.scaledValues.highValue };
  };
}

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeries.ts
var {
  extent: extent2,
  extractDecoratedProperties: extractDecoratedProperties2,
  fixNumericExtent: fixNumericExtent3,
  keyProperty: keyProperty3,
  mergeDefaults: mergeDefaults5,
  SeriesNodePickMode: SeriesNodePickMode2,
  SMALLEST_KEY_INTERVAL: SMALLEST_KEY_INTERVAL2,
  valueProperty: valueProperty4,
  diff: diff3,
  animationValidation: animationValidation3,
  ChartAxisDirection: ChartAxisDirection9,
  convertValuesToScaleByDefs: convertValuesToScaleByDefs2
} = import_ag_charts_community56._ModuleSupport;
var { motion: motion2 } = import_ag_charts_community56._Scene;
var { sanitizeHtml: sanitizeHtml2, Logger: Logger4 } = import_ag_charts_community56._Util;
var { ContinuousScale: ContinuousScale2, OrdinalTimeScale: OrdinalTimeScale3 } = import_ag_charts_community56._Scale;
var CandlestickSeriesNodeEvent = class extends import_ag_charts_community56._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.openKey = series.properties.openKey;
    this.closeKey = series.properties.closeKey;
    this.highKey = series.properties.highKey;
    this.lowKey = series.properties.lowKey;
  }
};
var _CandlestickSeries = class _CandlestickSeries extends import_ag_charts_community56._ModuleSupport.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode2.EXACT_SHAPE_MATCH],
      directionKeys: {
        x: ["xKey"],
        y: ["lowKey", "highKey", "openKey", "closeKey"]
      },
      directionNames: {
        x: ["xName"],
        y: ["lowName", "highName", "openName", "closeName"]
      },
      pathsPerSeries: 1
    });
    this.properties = new CandlestickSeriesProperties();
    this.NodeEvent = CandlestickSeriesNodeEvent;
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d;
      if (!this.properties.isValid()) {
        return;
      }
      const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const isContinuousX = ContinuousScale2.is(xScale) || OrdinalTimeScale3.is(xScale);
      const xValueType = ContinuousScale2.is(xScale) ? "range" : "category";
      const extraProps = [];
      if (animationEnabled && this.processedData) {
        extraProps.push(diff3(this.processedData));
      }
      if (animationEnabled) {
        extraProps.push(animationValidation3(this));
      }
      const { processedData } = yield this.requestDataModel(dataController, (_b = this.data) != null ? _b : [], {
        props: [
          keyProperty3(this, xKey, isContinuousX, { id: `xValue`, valueType: xValueType }),
          valueProperty4(this, openKey, true, { id: `openValue` }),
          valueProperty4(this, closeKey, true, { id: `closeValue` }),
          valueProperty4(this, highKey, true, { id: `highValue` }),
          valueProperty4(this, lowKey, true, { id: `lowValue` }),
          ...isContinuousX ? [SMALLEST_KEY_INTERVAL2] : [],
          ...extraProps
        ],
        dataVisible: this.visible
      });
      this.smallestDataInterval = {
        x: (_d = (_c = processedData.reduced) == null ? void 0 : _c.smallestKeyInterval) != null ? _d : Infinity,
        y: Infinity
      };
      this.animationState.transition("updateData");
    });
  }
  getSeriesDomain(direction) {
    var _a2;
    const { processedData, dataModel, smallestDataInterval } = this;
    if (!(processedData && dataModel))
      return [];
    if (direction === this.getBarDirection()) {
      const lowValues = dataModel.getDomain(this, `lowValue`, "value", processedData);
      const highValues = dataModel.getDomain(this, `highValue`, "value", processedData);
      const openValues = dataModel.getDomain(this, `openValue`, "value", processedData);
      const closeValues = dataModel.getDomain(this, `closeValue`, "value", processedData);
      return fixNumericExtent3(
        [
          Math.min(...lowValues, ...highValues, ...openValues, ...closeValues),
          Math.max(...highValues, ...lowValues, ...openValues, ...closeValues)
        ],
        this.getValueAxis()
      );
    }
    const { index, def } = dataModel.resolveProcessedDataIndexById(this, `xValue`);
    const keys = processedData.domain.keys[index];
    if (def.type === "key" && def.valueType === "category") {
      return keys;
    }
    const categoryAxis = this.getCategoryAxis();
    const isReversed = categoryAxis == null ? void 0 : categoryAxis.isReversed();
    const keysExtent = (_a2 = extent2(keys)) != null ? _a2 : [NaN, NaN];
    const scalePadding = smallestDataInterval && isFinite(smallestDataInterval.x) ? smallestDataInterval.x : 0;
    if (direction === ChartAxisDirection9.Y) {
      const d02 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
      const d12 = keysExtent[1] + (isReversed ? scalePadding : 0);
      return fixNumericExtent3([d02, d12], categoryAxis);
    }
    const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
    const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
    return fixNumericExtent3([d0, d1], categoryAxis);
  }
  createNodeData() {
    return __async(this, null, function* () {
      const { visible, dataModel } = this;
      const xAxis = this.getCategoryAxis();
      const yAxis = this.getValueAxis();
      if (!(dataModel && visible && xAxis && yAxis)) {
        return [];
      }
      const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;
      const nodeData = [];
      const defs = dataModel.resolveProcessedDataDefsByIds(this, [
        "xValue",
        "openValue",
        "closeValue",
        "highValue",
        "lowValue"
      ]);
      const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
      const { groupScale, processedData } = this;
      processedData == null ? void 0 : processedData.data.forEach(({ datum, keys, values }) => {
        const { xValue, openValue, closeValue, highValue, lowValue } = dataModel.resolveProcessedDataDefsValues(
          defs,
          { keys, values }
        );
        const validLowValue = lowValue !== void 0 && lowValue <= openValue && lowValue <= closeValue;
        const validHighValue = highValue !== void 0 && highValue >= openValue && highValue >= closeValue;
        if (!validLowValue) {
          Logger4.warnOnce(
            `invalid low value for key [${lowKey}] in data element, low value cannot be higher than datum open or close values`
          );
          return;
        }
        if (!validHighValue) {
          Logger4.warnOnce(
            `invalid high value for key [${highKey}] in data element, high value cannot be lower than datum open or close values.`
          );
          return;
        }
        const scaledValues = convertValuesToScaleByDefs2({
          defs,
          values: {
            xValue,
            openValue,
            closeValue,
            highValue,
            lowValue
          },
          xAxis,
          yAxis
        });
        scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex)));
        const isRising = closeValue > openValue;
        const itemId = this.getSeriesItemType(isRising);
        const {
          fill,
          fillOpacity,
          stroke,
          strokeWidth,
          strokeOpacity,
          lineDash,
          lineDashOffset,
          wick,
          cornerRadius
        } = this.getItemConfig(itemId);
        const y = Math.min(scaledValues.openValue, scaledValues.closeValue);
        const yBottom = Math.max(scaledValues.openValue, scaledValues.closeValue);
        const height = yBottom - y;
        const midPoint = {
          x: scaledValues.xValue + Math.round(barWidth) / 2,
          y: y + height / 2
        };
        nodeData.push({
          series: this,
          itemId,
          datum,
          xKey,
          xValue,
          openKey,
          closeKey,
          highKey,
          lowKey,
          openValue,
          closeValue,
          highValue,
          lowValue,
          bandwidth: Math.round(barWidth),
          scaledValues,
          wick,
          fill,
          fillOpacity,
          stroke,
          strokeWidth,
          strokeOpacity,
          lineDash,
          lineDashOffset,
          cornerRadius,
          midPoint,
          aggregatedValue: closeValue
        });
      });
      return [{ itemId: xKey, nodeData, labelData: [], scales: __superGet(_CandlestickSeries.prototype, this, "calculateScaling").call(this), visible: this.visible }];
    });
  }
  getSeriesItemType(isRising) {
    return isRising ? "up" : "down";
  }
  getItemConfig(seriesItemType) {
    switch (seriesItemType) {
      case "up": {
        return this.properties.item.up;
      }
      case "down": {
        return this.properties.item.down;
      }
    }
  }
  getLegendData(_legendType) {
    return [];
  }
  getTooltipHtml(nodeDatum) {
    const {
      xKey,
      openKey,
      closeKey,
      highKey,
      lowKey,
      xName,
      yName,
      openName,
      closeName,
      highName,
      lowName,
      tooltip
    } = this.properties;
    const { datum } = nodeDatum;
    const xAxis = this.getCategoryAxis();
    const yAxis = this.getValueAxis();
    if (!xAxis || !yAxis || !this.properties.isValid())
      return "";
    const capitalise = (text) => text.charAt(0).toUpperCase() + text.substring(1);
    const title = sanitizeHtml2(yName);
    const contentData = [
      [xKey, xName, xAxis],
      [openKey, openName, yAxis],
      [highKey, highName, yAxis],
      [lowKey, lowName, yAxis],
      [closeKey, closeName, yAxis]
    ];
    const content = contentData.map(([key, name, axis]) => sanitizeHtml2(`${name != null ? name : capitalise(key)}: ${axis.formatDatum(datum[key])}`)).join("<br/>");
    let { fill } = this.getFormattedStyles(nodeDatum);
    if (fill === "transparent") {
      fill = this.properties.item.down.fill;
    }
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: fill },
      {
        seriesId: this.id,
        datum,
        fill,
        xKey,
        openKey,
        closeKey,
        highKey,
        lowKey,
        xName,
        yName,
        openName,
        closeName,
        highName,
        lowName
      }
    );
  }
  animateEmptyUpdateReady({
    datumSelections
  }) {
    const isVertical = this.isVertical();
    const { from, to } = prepareCandlestickFromTo(isVertical);
    motion2.resetMotion(datumSelections, resetCandlestickSelectionsScalingStartFn(isVertical));
    motion2.staticFromToMotion(this.id, "datums", this.ctx.animationManager, datumSelections, from, to, {
      phase: "initial"
    });
  }
  isVertical() {
    return true;
  }
  isLabelEnabled() {
    return false;
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      var _a2;
      const data = (_a2 = opts.nodeData) != null ? _a2 : [];
      return opts.datumSelection.update(data);
    });
  }
  updateDatumNodes(_0) {
    return __async(this, arguments, function* ({
      datumSelection,
      isHighlight: highlighted
    }) {
      datumSelection.each((candlestickGroup, nodeDatum) => {
        let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);
        if (highlighted) {
          activeStyles = mergeDefaults5(this.properties.highlightStyle.item, activeStyles);
        }
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;
        activeStyles.wick = mergeDefaults5(activeStyles.wick, {
          stroke,
          strokeWidth,
          strokeOpacity,
          lineDash,
          lineDashOffset
        });
        candlestickGroup.updateDatumStyles(
          nodeDatum,
          activeStyles
        );
      });
    });
  }
  updateLabelNodes(_opts) {
    return __async(this, null, function* () {
    });
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      const { labelData, labelSelection } = opts;
      return labelSelection.update(labelData);
    });
  }
  nodeFactory() {
    return new CandlestickGroup();
  }
  getFormattedStyles(nodeDatum, highlighted = false) {
    const {
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const { xKey, openKey, closeKey, highKey, lowKey, formatter } = this.properties;
    const {
      datum,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      wick,
      itemId,
      cornerRadius
    } = nodeDatum;
    const activeStyles = {
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      wick: extractDecoratedProperties2(wick),
      cornerRadius
    };
    if (formatter) {
      const formatStyles = callbackCache.call(formatter, __spreadProps(__spreadValues({
        datum,
        seriesId,
        itemId,
        highlighted
      }, activeStyles), {
        xKey,
        openKey,
        closeKey,
        highKey,
        lowKey
      }));
      if (formatStyles) {
        return mergeDefaults5(formatStyles, activeStyles);
      }
    }
    return activeStyles;
  }
};
_CandlestickSeries.className = "CandleStickSeries";
_CandlestickSeries.type = "candlestick";
var CandlestickSeries = _CandlestickSeries;

// packages/ag-charts-enterprise/src/series/candlestick/candlestickThemes.ts
var import_ag_charts_community57 = require("ag-charts-community");
var CANDLESTICK_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community57._Theme.EXTENDS_SERIES_DEFAULTS
  },
  axes: {
    [import_ag_charts_community57._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        snap: false
      }
    },
    [import_ag_charts_community57._Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
      groupPaddingInner: 0,
      crosshair: {
        enabled: true
      }
    }
  }
};

// packages/ag-charts-enterprise/src/series/candlestick/candlestickModule.ts
var CandlestickModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "candlestick",
  instanceConstructor: CandlestickSeries,
  hidden: true,
  defaultAxes: [
    {
      type: import_ag_charts_community58._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community58._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community58._Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME,
      position: import_ag_charts_community58._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: CANDLESTICK_SERIES_THEME,
  groupable: false,
  paletteFactory: ({ takeColors, colorsCount }) => {
    const { fills, strokes } = takeColors(colorsCount);
    return {
      item: {
        up: {
          fill: "transparent",
          stroke: strokes[0]
        },
        down: {
          fill: fills[0],
          stroke: strokes[0]
        }
      }
    };
  }
};

// packages/ag-charts-enterprise/src/series/heatmap/heatmapModule.ts
var import_ag_charts_community63 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/heatmap/heatmapSeries.ts
var import_ag_charts_community61 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/util/labelFormatter.ts
var import_ag_charts_community59 = require("ag-charts-community");
var { Validate: Validate28, NUMBER: NUMBER8, TEXT_WRAP, OVERFLOW_STRATEGY } = import_ag_charts_community59._ModuleSupport;
var { Logger: Logger5 } = import_ag_charts_community59._Util;
var { Text: Text5, Label } = import_ag_charts_community59._Scene;
var BaseAutoSizedLabel = class extends Label {
  constructor() {
    super(...arguments);
    this.wrapping = "on-space";
    this.overflowStrategy = "ellipsis";
  }
  static lineHeight(fontSize) {
    return Math.ceil(fontSize * Text5.defaultLineHeightRatio);
  }
};
__decorateClass([
  Validate28(TEXT_WRAP)
], BaseAutoSizedLabel.prototype, "wrapping", 2);
__decorateClass([
  Validate28(OVERFLOW_STRATEGY)
], BaseAutoSizedLabel.prototype, "overflowStrategy", 2);
__decorateClass([
  Validate28(NUMBER8, { optional: true })
], BaseAutoSizedLabel.prototype, "minimumFontSize", 2);
var AutoSizedLabel = class extends BaseAutoSizedLabel {
  constructor() {
    super(...arguments);
    this.spacing = 0;
  }
};
__decorateClass([
  Validate28(NUMBER8)
], AutoSizedLabel.prototype, "spacing", 2);
var AutoSizeableSecondaryLabel = class extends BaseAutoSizedLabel {
};
function generateLabelSecondaryLabelFontSizeCandidates(label, secondaryLabel) {
  const { fontSize: labelFontSize, minimumFontSize: labelMinimumFontSize = labelFontSize } = label;
  const {
    fontSize: secondaryLabelFontSize,
    minimumFontSize: secondaryLabelMinimumFontSize = secondaryLabelFontSize
  } = secondaryLabel;
  const labelTracks = labelFontSize - labelMinimumFontSize;
  const secondaryLabelTracks = secondaryLabelFontSize - secondaryLabelMinimumFontSize;
  let currentLabelFontSize = label.fontSize;
  let currentSecondaryLabelFontSize = secondaryLabel.fontSize;
  const out = [{ labelFontSize, secondaryLabelFontSize }];
  while (currentLabelFontSize > labelMinimumFontSize || currentSecondaryLabelFontSize > secondaryLabelMinimumFontSize) {
    const labelProgress = labelTracks > 0 ? (currentLabelFontSize - labelMinimumFontSize) / labelTracks : -1;
    const secondaryLabelProgress = secondaryLabelTracks > 0 ? (currentSecondaryLabelFontSize - secondaryLabelMinimumFontSize) / secondaryLabelTracks : -1;
    if (labelProgress > secondaryLabelProgress) {
      currentLabelFontSize--;
    } else {
      currentSecondaryLabelFontSize--;
    }
    out.push({
      labelFontSize: currentLabelFontSize,
      secondaryLabelFontSize: currentSecondaryLabelFontSize
    });
  }
  out.reverse();
  return out;
}
function maximumValueSatisfying(from, to, iteratee) {
  if (from > to) {
    return;
  }
  let min = from;
  let max = to;
  let found;
  while (max >= min) {
    const index = (max + min) / 2 | 0;
    const value = iteratee(index);
    if (value == null) {
      max = index - 1;
    } else {
      found = value;
      min = index + 1;
    }
  }
  return found;
}
function formatStackedLabels(labelValue, labelProps, secondaryLabelValue, secondaryLabelProps, { padding }, sizeFittingHeight) {
  var _a2, _b;
  const { spacing } = labelProps;
  const widthAdjust = 2 * padding;
  const heightAdjust = 2 * padding + spacing;
  const minimumHeight = ((_a2 = labelProps.minimumFontSize) != null ? _a2 : labelProps.fontSize) + ((_b = secondaryLabelProps.minimumFontSize) != null ? _b : secondaryLabelProps.fontSize);
  if (minimumHeight > sizeFittingHeight(minimumHeight + heightAdjust, false).height - heightAdjust) {
    return;
  }
  const fontSizeCandidates = generateLabelSecondaryLabelFontSizeCandidates(labelProps, secondaryLabelProps);
  const labelTextNode = new Text5();
  labelTextNode.setFont(labelProps);
  const labelTextSizeProps = {
    fontFamily: labelProps.fontFamily,
    fontSize: labelProps.fontSize,
    fontStyle: labelProps.fontStyle,
    fontWeight: labelProps.fontWeight
  };
  const secondaryLabelTextNode = new Text5();
  secondaryLabelTextNode.setFont(secondaryLabelProps);
  const secondaryLabelTextSizeProps = {
    fontFamily: secondaryLabelProps.fontFamily,
    fontSize: secondaryLabelProps.fontSize,
    fontStyle: secondaryLabelProps.fontStyle,
    fontWeight: secondaryLabelProps.fontWeight
  };
  let label;
  let secondaryLabel;
  return maximumValueSatisfying(0, fontSizeCandidates.length - 1, (index) => {
    const { labelFontSize, secondaryLabelFontSize } = fontSizeCandidates[index];
    const allowTruncation = index === 0;
    const labelLineHeight = AutoSizedLabel.lineHeight(labelFontSize);
    const secondaryLabelLineHeight = AutoSizeableSecondaryLabel.lineHeight(secondaryLabelFontSize);
    const sizeFitting = sizeFittingHeight(
      labelLineHeight + secondaryLabelLineHeight + heightAdjust,
      allowTruncation
    );
    const availableWidth = sizeFitting.width - widthAdjust;
    const availableHeight = sizeFitting.height - heightAdjust;
    if (labelLineHeight + secondaryLabelLineHeight > availableHeight) {
      return;
    }
    if (label == null || label.fontSize !== labelFontSize) {
      labelTextSizeProps.fontSize = labelFontSize;
      const { lines: labelLines } = Text5.wrapLines(
        labelValue,
        availableWidth,
        availableHeight,
        labelTextSizeProps,
        labelProps.wrapping,
        allowTruncation ? labelProps.overflowStrategy : "hide"
      );
      if (labelLines == null) {
        label = void 0;
      } else {
        const labelText = labelLines.join("\n");
        labelTextNode.text = labelText;
        labelTextNode.fontSize = labelFontSize;
        labelTextNode.lineHeight = labelFontSize;
        const labelWidth = labelTextNode.computeBBox().width;
        const labelHeight = labelLines.length * labelLineHeight;
        label = {
          text: labelText,
          fontSize: labelFontSize,
          lineHeight: labelLineHeight,
          width: labelWidth,
          height: labelHeight
        };
      }
    }
    if (label == null || label.width > availableWidth || label.height > availableHeight) {
      return;
    }
    if (secondaryLabel == null || secondaryLabel.fontSize !== secondaryLabelFontSize) {
      secondaryLabelTextSizeProps.fontSize = secondaryLabelFontSize;
      const { lines: secondaryLabelLines } = Text5.wrapLines(
        secondaryLabelValue,
        availableWidth,
        availableHeight,
        secondaryLabelTextSizeProps,
        secondaryLabelProps.wrapping,
        allowTruncation ? secondaryLabelProps.overflowStrategy : "hide"
      );
      if (secondaryLabelLines == null) {
        secondaryLabel = void 0;
      } else {
        const secondaryLabelText = secondaryLabelLines.join("\n");
        secondaryLabelTextNode.text = secondaryLabelText;
        secondaryLabelTextNode.fontSize = secondaryLabelFontSize;
        secondaryLabelTextNode.lineHeight = secondaryLabelLineHeight;
        const secondaryLabelWidth = secondaryLabelTextNode.computeBBox().width;
        const secondaryLabelHeight = secondaryLabelLines.length * secondaryLabelLineHeight;
        secondaryLabel = {
          text: secondaryLabelText,
          fontSize: secondaryLabelFontSize,
          lineHeight: secondaryLabelLineHeight,
          width: secondaryLabelWidth,
          height: secondaryLabelHeight
        };
      }
    }
    if (secondaryLabel == null) {
      return;
    }
    const totalLabelHeight = label.height + secondaryLabel.height;
    if (secondaryLabel.width > availableWidth || totalLabelHeight > availableHeight) {
      return;
    }
    return {
      width: Math.max(label.width, secondaryLabel.width),
      height: totalLabelHeight + spacing,
      meta: sizeFitting.meta,
      label,
      secondaryLabel
    };
  });
}
function formatSingleLabel(value, props, { padding }, sizeFittingHeight) {
  var _a2;
  const sizeAdjust = 2 * padding;
  const minimumFontSize = Math.min((_a2 = props.minimumFontSize) != null ? _a2 : props.fontSize, props.fontSize);
  const textNode = new Text5();
  textNode.setFont(props);
  const textSizeProps = {
    fontFamily: props.fontFamily,
    fontSize: props.fontSize,
    fontStyle: props.fontStyle,
    fontWeight: props.fontWeight
  };
  return maximumValueSatisfying(minimumFontSize, props.fontSize, (fontSize) => {
    const lineHeight = AutoSizedLabel.lineHeight(fontSize);
    const allowTruncation = fontSize === minimumFontSize;
    const sizeFitting = sizeFittingHeight(lineHeight + sizeAdjust, allowTruncation);
    const availableWidth = sizeFitting.width - sizeAdjust;
    const availableHeight = sizeFitting.height - sizeAdjust;
    if (lineHeight > availableHeight) {
      return;
    }
    textSizeProps.fontSize = fontSize;
    const { lines } = Text5.wrapLines(
      value,
      availableWidth,
      availableHeight,
      textSizeProps,
      props.wrapping,
      allowTruncation ? props.overflowStrategy : "hide"
    );
    if (lines == null) {
      return;
    }
    const text = lines.join("\n");
    textNode.text = text;
    textNode.fontSize = fontSize;
    textNode.lineHeight = lineHeight;
    const size = textNode.computeBBox();
    const width = textNode.computeBBox().width;
    const height = lineHeight * lines.length;
    if (size.width > availableWidth || height > availableHeight) {
      return;
    }
    return [{ text, fontSize, lineHeight, width, height }, sizeFitting.meta];
  });
}
function hasInvalidFontSize(label) {
  return (label == null ? void 0 : label.minimumFontSize) != null && (label == null ? void 0 : label.fontSize) && (label == null ? void 0 : label.minimumFontSize) > (label == null ? void 0 : label.fontSize);
}
function formatLabels(baseLabelValue, labelProps, baseSecondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight) {
  const labelValue = labelProps.enabled ? baseLabelValue : void 0;
  const secondaryLabelValue = secondaryLabelProps.enabled ? baseSecondaryLabelValue : void 0;
  if (hasInvalidFontSize(labelProps) || hasInvalidFontSize(secondaryLabelProps)) {
    Logger5.warnOnce(`minimumFontSize should be set to a value less than or equal to the font size`);
  }
  let value;
  if (labelValue != null && secondaryLabelValue != null) {
    value = formatStackedLabels(
      labelValue,
      labelProps,
      secondaryLabelValue,
      secondaryLabelProps,
      layoutParams,
      sizeFittingHeight
    );
  }
  let labelMeta;
  if (value == null && labelValue != null) {
    labelMeta = formatSingleLabel(labelValue, labelProps, layoutParams, sizeFittingHeight);
  }
  if (labelMeta != null) {
    const [label, meta] = labelMeta;
    value = {
      width: label.width,
      height: label.height,
      meta,
      label,
      secondaryLabel: void 0
    };
  }
  let secondaryLabelMeta;
  if (value == null && labelValue == null && secondaryLabelValue != null) {
    secondaryLabelMeta = formatSingleLabel(
      secondaryLabelValue,
      secondaryLabelProps,
      layoutParams,
      sizeFittingHeight
    );
  }
  if (secondaryLabelMeta != null) {
    const [secondaryLabel, meta] = secondaryLabelMeta;
    value = {
      width: secondaryLabel.width,
      height: secondaryLabel.height,
      meta,
      label: void 0,
      secondaryLabel
    };
  }
  return value;
}

// packages/ag-charts-enterprise/src/series/heatmap/heatmapSeriesProperties.ts
var import_ag_charts_community60 = require("ag-charts-community");
var {
  CartesianSeriesProperties,
  SeriesTooltip: SeriesTooltip4,
  Validate: Validate29,
  AND: AND7,
  ARRAY: ARRAY3,
  COLOR_STRING: COLOR_STRING8,
  COLOR_STRING_ARRAY,
  FUNCTION: FUNCTION6,
  OBJECT: OBJECT7,
  POSITIVE_NUMBER: POSITIVE_NUMBER11,
  RATIO: RATIO13,
  STRING: STRING8,
  TEXT_ALIGN,
  VERTICAL_ALIGN
} = import_ag_charts_community60._ModuleSupport;
var HeatmapSeriesProperties = class extends CartesianSeriesProperties {
  constructor() {
    super(...arguments);
    this.colorRange = ["black", "black"];
    this.stroke = "black";
    this.strokeWidth = 0;
    this.textAlign = "center";
    this.verticalAlign = "middle";
    this.itemPadding = 0;
    this.label = new AutoSizedLabel();
    this.tooltip = new SeriesTooltip4();
  }
};
__decorateClass([
  Validate29(STRING8, { optional: true })
], HeatmapSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate29(STRING8)
], HeatmapSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate29(STRING8)
], HeatmapSeriesProperties.prototype, "yKey", 2);
__decorateClass([
  Validate29(STRING8, { optional: true })
], HeatmapSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate29(STRING8, { optional: true })
], HeatmapSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate29(STRING8, { optional: true })
], HeatmapSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate29(STRING8, { optional: true })
], HeatmapSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate29(AND7(COLOR_STRING_ARRAY, ARRAY3.restrict({ minLength: 1 })))
], HeatmapSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate29(COLOR_STRING8, { optional: true })
], HeatmapSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate29(RATIO13, { optional: true })
], HeatmapSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate29(POSITIVE_NUMBER11, { optional: true })
], HeatmapSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate29(TEXT_ALIGN)
], HeatmapSeriesProperties.prototype, "textAlign", 2);
__decorateClass([
  Validate29(VERTICAL_ALIGN)
], HeatmapSeriesProperties.prototype, "verticalAlign", 2);
__decorateClass([
  Validate29(POSITIVE_NUMBER11)
], HeatmapSeriesProperties.prototype, "itemPadding", 2);
__decorateClass([
  Validate29(FUNCTION6, { optional: true })
], HeatmapSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate29(OBJECT7)
], HeatmapSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate29(OBJECT7)
], HeatmapSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/heatmap/heatmapSeries.ts
var {
  SeriesNodePickMode: SeriesNodePickMode3,
  getMissCount,
  valueProperty: valueProperty5,
  ChartAxisDirection: ChartAxisDirection10,
  DEFAULT_CARTESIAN_DIRECTION_KEYS,
  DEFAULT_CARTESIAN_DIRECTION_NAMES
} = import_ag_charts_community61._ModuleSupport;
var { Rect: Rect3, PointerEvents } = import_ag_charts_community61._Scene;
var { ColorScale } = import_ag_charts_community61._Scale;
var { sanitizeHtml: sanitizeHtml3, Color, Logger: Logger6 } = import_ag_charts_community61._Util;
var HeatmapSeriesNodeEvent = class extends import_ag_charts_community61._ModuleSupport.CartesianSeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.colorKey = series.properties.colorKey;
  }
};
var textAlignFactors = {
  left: -0.5,
  center: 0,
  right: -0.5
};
var verticalAlignFactors = {
  top: -0.5,
  middle: 0,
  bottom: -0.5
};
var _HeatmapSeries = class _HeatmapSeries extends import_ag_charts_community61._ModuleSupport.CartesianSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
      directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
      pickModes: [SeriesNodePickMode3.EXACT_SHAPE_MATCH],
      pathsPerSeries: 0,
      hasMarkers: false,
      hasHighlightedLabels: true
    });
    this.properties = new HeatmapSeriesProperties();
    this.NodeEvent = HeatmapSeriesNodeEvent;
    this.colorScale = new ColorScale();
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2;
      const xAxis = this.axes[ChartAxisDirection10.X];
      const yAxis = this.axes[ChartAxisDirection10.Y];
      if (!xAxis || !yAxis || !this.properties.isValid() || !((_a2 = this.data) == null ? void 0 : _a2.length)) {
        return;
      }
      const { xKey, yKey, colorRange, colorKey } = this.properties;
      const { isContinuousX, isContinuousY } = this.isContinuous();
      const { dataModel, processedData } = yield this.requestDataModel(dataController, this.data, {
        props: [
          valueProperty5(this, xKey, isContinuousX, { id: "xValue" }),
          valueProperty5(this, yKey, isContinuousY, { id: "yValue" }),
          ...colorKey ? [valueProperty5(this, colorKey, true, { id: "colorValue" })] : []
        ]
      });
      if (this.isColorScaleValid()) {
        const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue").index;
        this.colorScale.domain = processedData.domain.values[colorKeyIdx];
        this.colorScale.range = colorRange;
        this.colorScale.update();
      }
    });
  }
  isColorScaleValid() {
    const { colorKey } = this.properties;
    if (!colorKey) {
      return false;
    }
    const { dataModel, processedData } = this;
    if (!dataModel || !processedData) {
      return false;
    }
    const colorDataIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue").index;
    const dataCount = processedData.data.length;
    const missCount = getMissCount(this, processedData.defs.values[colorDataIdx].missing);
    const colorDataMissing = dataCount === 0 || dataCount === missCount;
    return !colorDataMissing;
  }
  getSeriesDomain(direction) {
    const { dataModel, processedData } = this;
    if (!dataModel || !processedData)
      return [];
    if (direction === ChartAxisDirection10.X) {
      return dataModel.getDomain(this, `xValue`, "value", processedData);
    } else {
      return dataModel.getDomain(this, `yValue`, "value", processedData);
    }
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d, _e, _f, _g;
      const { data, visible, axes, dataModel } = this;
      const xAxis = axes[ChartAxisDirection10.X];
      const yAxis = axes[ChartAxisDirection10.Y];
      if (!(data && dataModel && visible && xAxis && yAxis)) {
        return [];
      }
      if (xAxis.type !== "category" || yAxis.type !== "category") {
        Logger6.warnOnce(
          `Heatmap series expected axes to have "category" type, but received "${xAxis.type}" and "${yAxis.type}" instead.`
        );
        return [];
      }
      const {
        xKey,
        xName,
        yKey,
        yName,
        colorKey,
        colorName,
        textAlign,
        verticalAlign,
        itemPadding,
        colorRange,
        label
      } = this.properties;
      const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
      const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
      const colorDataIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : void 0;
      const xScale = xAxis.scale;
      const yScale = yAxis.scale;
      const xOffset = ((_a2 = xScale.bandwidth) != null ? _a2 : 0) / 2;
      const yOffset = ((_b = yScale.bandwidth) != null ? _b : 0) / 2;
      const colorScaleValid = this.isColorScaleValid();
      const nodeData = [];
      const labelData = [];
      const width = (_c = xScale.bandwidth) != null ? _c : 10;
      const height = (_d = yScale.bandwidth) != null ? _d : 10;
      const textAlignFactor = (width - 2 * itemPadding) * textAlignFactors[textAlign];
      const verticalAlignFactor = (height - 2 * itemPadding) * verticalAlignFactors[verticalAlign];
      const sizeFittingHeight = () => ({ width, height, meta: null });
      for (const { values, datum } of (_f = (_e = this.processedData) == null ? void 0 : _e.data) != null ? _f : []) {
        const xDatum = values[xDataIdx];
        const yDatum = values[yDataIdx];
        const x = xScale.convert(xDatum) + xOffset;
        const y = yScale.convert(yDatum) + yOffset;
        const colorValue = values[colorDataIdx != null ? colorDataIdx : -1];
        const fill = colorScaleValid && colorValue != null ? this.colorScale.convert(colorValue) : colorRange[0];
        const labelText = colorValue == null ? void 0 : this.getLabelText(label, {
          value: colorValue,
          datum,
          colorKey,
          colorName,
          xKey,
          yKey,
          xName,
          yName
        });
        const labels = formatLabels(
          labelText,
          this.properties.label,
          void 0,
          this.properties.label,
          { padding: itemPadding },
          sizeFittingHeight
        );
        const point = { x, y, size: 0 };
        nodeData.push({
          series: this,
          itemId: yKey,
          yKey,
          xKey,
          xValue: xDatum,
          yValue: yDatum,
          colorValue,
          datum,
          point,
          width,
          height,
          fill,
          midPoint: { x, y }
        });
        if ((labels == null ? void 0 : labels.label) != null) {
          const { text, fontSize, lineHeight, height: labelHeight } = labels.label;
          const { fontStyle, fontFamily, fontWeight, color } = this.properties.label;
          const lx = point.x + textAlignFactor * (width - 2 * itemPadding);
          const ly = point.y + verticalAlignFactor * (height - 2 * itemPadding) - (labels.height - labelHeight) * 0.5;
          labelData.push({
            series: this,
            itemId: yKey,
            datum,
            text,
            fontSize,
            lineHeight,
            fontStyle,
            fontFamily,
            fontWeight,
            color,
            textAlign,
            verticalAlign,
            x: lx,
            y: ly
          });
        }
      }
      return [
        {
          itemId: (_g = this.properties.yKey) != null ? _g : this.id,
          nodeData,
          labelData,
          scales: __superGet(_HeatmapSeries.prototype, this, "calculateScaling").call(this),
          visible: this.visible
        }
      ];
    });
  }
  nodeFactory() {
    return new Rect3();
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      const { nodeData, datumSelection } = opts;
      const data = nodeData != null ? nodeData : [];
      return datumSelection.update(data);
    });
  }
  updateDatumNodes(opts) {
    return __async(this, null, function* () {
      var _a2;
      const { isHighlight: isDatumHighlighted } = opts;
      const {
        id: seriesId,
        ctx: { callbackCache }
      } = this;
      const {
        xKey,
        yKey,
        colorKey,
        formatter,
        highlightStyle: {
          item: {
            fill: highlightedFill,
            stroke: highlightedStroke,
            strokeWidth: highlightedDatumStrokeWidth,
            strokeOpacity: highlightedDatumStrokeOpacity,
            fillOpacity: highlightedFillOpacity
          }
        }
      } = this.properties;
      const xAxis = this.axes[ChartAxisDirection10.X];
      const [visibleMin, visibleMax] = (_a2 = xAxis == null ? void 0 : xAxis.visibleRange) != null ? _a2 : [];
      const isZoomed = visibleMin !== 0 || visibleMax !== 1;
      const crisp = !isZoomed;
      opts.datumSelection.each((rect, datum) => {
        var _a3, _b, _c, _d, _e;
        const { point, width, height } = datum;
        const fill = isDatumHighlighted && highlightedFill !== void 0 ? Color.interpolate(datum.fill, highlightedFill)(highlightedFillOpacity != null ? highlightedFillOpacity : 1) : datum.fill;
        const stroke = isDatumHighlighted && highlightedStroke !== void 0 ? highlightedStroke : this.properties.stroke;
        const strokeOpacity = isDatumHighlighted && highlightedDatumStrokeOpacity !== void 0 ? highlightedDatumStrokeOpacity : this.properties.strokeOpacity;
        const strokeWidth = isDatumHighlighted && highlightedDatumStrokeWidth !== void 0 ? highlightedDatumStrokeWidth : this.properties.strokeWidth;
        let format;
        if (formatter) {
          format = callbackCache.call(formatter, {
            datum: datum.datum,
            fill,
            stroke,
            strokeOpacity,
            strokeWidth,
            highlighted: isDatumHighlighted,
            xKey,
            yKey,
            colorKey,
            seriesId
          });
        }
        rect.crisp = crisp;
        rect.x = Math.floor(point.x - width / 2);
        rect.y = Math.floor(point.y - height / 2);
        rect.width = Math.ceil(width);
        rect.height = Math.ceil(height);
        rect.fill = (_a3 = format == null ? void 0 : format.fill) != null ? _a3 : fill;
        rect.stroke = (_b = format == null ? void 0 : format.stroke) != null ? _b : stroke;
        rect.strokeOpacity = (_d = (_c = format == null ? void 0 : format.strokeOpacity) != null ? _c : strokeOpacity) != null ? _d : 1;
        rect.strokeWidth = (_e = format == null ? void 0 : format.strokeWidth) != null ? _e : strokeWidth;
      });
    });
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      const { labelData, labelSelection } = opts;
      const { enabled } = this.properties.label;
      const data = enabled ? labelData : [];
      return labelSelection.update(data);
    });
  }
  updateLabelNodes(opts) {
    return __async(this, null, function* () {
      opts.labelSelection.each((text, datum) => {
        text.text = datum.text;
        text.fontSize = datum.fontSize;
        text.lineHeight = datum.lineHeight;
        text.fontStyle = datum.fontStyle;
        text.fontFamily = datum.fontFamily;
        text.fontWeight = datum.fontWeight;
        text.fill = datum.color;
        text.textAlign = datum.textAlign;
        text.textBaseline = datum.verticalAlign;
        text.x = datum.x;
        text.y = datum.y;
        text.pointerEvents = PointerEvents.None;
      });
    });
  }
  getTooltipHtml(nodeDatum) {
    var _a2, _b, _c;
    const xAxis = this.axes[ChartAxisDirection10.X];
    const yAxis = this.axes[ChartAxisDirection10.Y];
    if (!this.properties.isValid() || !xAxis || !yAxis) {
      return "";
    }
    const { xKey, yKey, colorKey, xName, yName, colorName, stroke, strokeWidth, colorRange, formatter, tooltip } = this.properties;
    const {
      colorScale,
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const { datum, xValue, yValue, colorValue } = nodeDatum;
    const fill = this.isColorScaleValid() ? colorScale.convert(colorValue) : colorRange[0];
    let format;
    if (formatter) {
      format = callbackCache.call(formatter, {
        datum: nodeDatum,
        xKey,
        yKey,
        colorKey,
        fill,
        stroke,
        strokeWidth,
        highlighted: false,
        seriesId
      });
    }
    const color = (_b = (_a2 = format == null ? void 0 : format.fill) != null ? _a2 : fill) != null ? _b : "gray";
    const title = (_c = this.properties.title) != null ? _c : yName;
    const xString = sanitizeHtml3(xAxis.formatDatum(xValue));
    const yString = sanitizeHtml3(yAxis.formatDatum(yValue));
    let content = `<b>${sanitizeHtml3(xName != null ? xName : xKey)}</b>: ${xString}<br><b>${sanitizeHtml3(yName != null ? yName : yKey)}</b>: ${yString}`;
    if (colorKey) {
      content = `<b>${sanitizeHtml3(colorName != null ? colorName : colorKey)}</b>: ${sanitizeHtml3(colorValue)}<br>` + content;
    }
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      {
        seriesId,
        datum,
        xKey,
        yKey,
        xName,
        yName,
        title,
        color,
        colorKey
      }
    );
  }
  getLegendData(legendType) {
    var _a2;
    if (legendType !== "gradient" || !((_a2 = this.data) == null ? void 0 : _a2.length) || !this.properties.isValid() || !this.isColorScaleValid() || !this.dataModel) {
      return [];
    }
    return [
      {
        legendType: "gradient",
        enabled: this.visible,
        seriesId: this.id,
        colorName: this.properties.colorName,
        colorDomain: this.processedData.domain.values[this.dataModel.resolveProcessedDataIndexById(this, "colorValue").index],
        colorRange: this.properties.colorRange
      }
    ];
  }
  isLabelEnabled() {
    return this.properties.label.enabled && Boolean(this.properties.colorKey);
  }
  getBandScalePadding() {
    return { inner: 0, outer: 0 };
  }
};
_HeatmapSeries.className = "HeatmapSeries";
_HeatmapSeries.type = "heatmap";
var HeatmapSeries = _HeatmapSeries;

// packages/ag-charts-enterprise/src/series/heatmap/heatmapThemes.ts
var import_ag_charts_community62 = require("ag-charts-community");
var HEATMAP_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community62._Theme.EXTENDS_SERIES_DEFAULTS,
    label: {
      __overrides__: import_ag_charts_community62._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
      enabled: false,
      color: import_ag_charts_community62._Theme.DEFAULT_LABEL_COLOUR,
      fontSize: import_ag_charts_community62._Theme.FONT_SIZE.SMALL,
      fontFamily: import_ag_charts_community62._Theme.DEFAULT_FONT_FAMILY,
      wrapping: "on-space",
      overflowStrategy: "ellipsis"
    },
    itemPadding: 3
  },
  gradientLegend: {
    enabled: true
  }
};

// packages/ag-charts-enterprise/src/series/heatmap/heatmapModule.ts
var HeatmapModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "heatmap",
  instanceConstructor: HeatmapSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community63._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community63._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community63._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community63._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: HEATMAP_SERIES_THEME,
  paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
    var _a2;
    const { properties } = themeTemplateParameters;
    const defaultColorRange = properties.get(import_ag_charts_community63._Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    const defaultBackgroundColor = properties.get(import_ag_charts_community63._Theme.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (_a2 = Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor) != null ? _a2 : "white";
    const { fills, strokes } = takeColors(colorsCount);
    return {
      stroke: userPalette ? strokes[0] : backgroundFill,
      colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundModule.ts
var import_ag_charts_community69 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundSeries.ts
var import_ag_charts_community68 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-util/geoGeometry.ts
var import_ag_charts_community65 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-util/lineStringUtil.ts
var delta = 1e-9;
function lineSegmentDistanceToPointSquared(a, b, x, y) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const abx = bx - ax;
  const aby = by - ay;
  const l = abx * abx + aby * aby;
  let x0;
  let y0;
  if (Math.abs(l) < delta) {
    x0 = ax;
    y0 = ay;
  } else {
    let t = ((x - ax) * abx + (y - ay) * aby) / l;
    t = Math.max(0, Math.min(1, t));
    x0 = ax + t * (bx - ax);
    y0 = ay + t * (by - ay);
  }
  const dx2 = x - x0;
  const dy2 = y - y0;
  return dx2 * dx2 + dy2 * dy2;
}
function lineStringDistance(lineString, x, y) {
  let minDistanceSquared = Infinity;
  let p0 = lineString[lineString.length - 1];
  for (const p1 of lineString) {
    minDistanceSquared = Math.min(minDistanceSquared, lineSegmentDistanceToPointSquared(p0, p1, x, y));
    p0 = p1;
  }
  return Math.sqrt(minDistanceSquared);
}
function lineStringLength(lineSegment) {
  let [x0, y0] = lineSegment[0];
  let totalDistance = 0;
  for (let i = 1; i < lineSegment.length; i += 1) {
    const [x1, y1] = lineSegment[i];
    const distance = Math.hypot(x1 - x0, y1 - y0);
    totalDistance += distance;
    x0 = x1;
    y0 = y1;
  }
  return totalDistance;
}
function lineStringCenter(lineSegment) {
  if (lineSegment.length === 0)
    return;
  const targetDistance = lineStringLength(lineSegment) / 2;
  let [x0, y0] = lineSegment[0];
  let totalDistance = 0;
  for (let i = 1; i < lineSegment.length; i += 1) {
    const [x1, y1] = lineSegment[i];
    const segmentDistance = Math.hypot(x1 - x0, y1 - y0);
    const nextDistance = totalDistance + segmentDistance;
    if (nextDistance > targetDistance) {
      const ratio = (targetDistance - totalDistance) / segmentDistance;
      const point = [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio];
      const angle = Math.atan2(y1 - y0, x1 - x0);
      return { point, angle };
    }
    totalDistance = nextDistance;
    x0 = x1;
    y0 = y1;
  }
}

// packages/ag-charts-enterprise/src/series/map-util/bboxUtil.ts
var import_ag_charts_community64 = require("ag-charts-community");
var { LonLatBBox } = import_ag_charts_community64._ModuleSupport;
function extendBbox(into, lon0, lat0, lon1, lat1) {
  if (into == null) {
    into = new LonLatBBox(lon0, lat0, lon1, lat1);
  } else {
    into.lon0 = Math.min(into.lon0, lon0);
    into.lat0 = Math.min(into.lat0, lat0);
    into.lon1 = Math.max(into.lon1, lon1);
    into.lat1 = Math.max(into.lat1, lat1);
  }
  return into;
}

// packages/ag-charts-enterprise/src/series/map-util/linkedList.ts
var insertManySorted = (list, items, cmp) => {
  let head = list;
  let current = head;
  for (const value of items) {
    if (head == null || cmp(head.value, value) > 0) {
      head = { value, next: head };
      current = head;
    } else {
      current = current;
      while (current.next != null && cmp(current.next.value, value) <= 0) {
        current = current.next;
      }
      current.next = { value, next: current.next };
    }
  }
  return head;
};

// packages/ag-charts-enterprise/src/series/map-util/polygonUtil.ts
function polygonBbox(polygon, into) {
  polygon.forEach((coordinates) => {
    const [lon, lat] = coordinates;
    into = extendBbox(into, lon, lat, lon, lat);
  });
  return into;
}
function polygonCentroid(polygon) {
  if (polygon.length === 0)
    return;
  let x = 0;
  let y = 0;
  let k = 0;
  let [x0, y0] = polygon[polygon.length - 1];
  for (const [x1, y1] of polygon) {
    const c = x0 * y1 - x1 * y0;
    k += c;
    x += (x0 + x1) * c;
    y += (y0 + y1) * c;
    x0 = x1;
    y0 = y1;
  }
  k *= 3;
  return [x / k, y / k];
}
function polygonDistance(polygons, x, y) {
  let inside = false;
  let minDistanceSquared = Infinity;
  for (const polygon of polygons) {
    let p0 = polygon[polygon.length - 1];
    let [x0, y0] = p0;
    for (const p1 of polygon) {
      const [x1, y1] = p1;
      if (y1 > y !== y0 > y && x < (x0 - x1) * (y - y1) / (y0 - y1) + x1) {
        inside = !inside;
      }
      minDistanceSquared = Math.min(minDistanceSquared, lineSegmentDistanceToPointSquared(p0, p1, x, y));
      p0 = p1;
      x0 = x1;
      y0 = y1;
    }
  }
  return (inside ? -1 : 1) * Math.sqrt(minDistanceSquared);
}

// packages/ag-charts-enterprise/src/series/map-util/geoGeometry.ts
var { Path: Path5, Path2D, BBox: BBox7, ScenePathChangeDetection } = import_ag_charts_community65._Scene;
var GeoGeometry = class extends Path5 {
  constructor() {
    super(...arguments);
    this.projectedGeometry = void 0;
    this.renderMode = 3 /* All */;
    // Keep non-filled shapes separate so we don't fill them
    this.strokePath = new Path2D();
  }
  computeBBox() {
    var _a2;
    if (this.dirtyPath || this.isDirtyPath()) {
      this.updatePath();
      this.dirtyPath = false;
    }
    return (_a2 = this.bbox) == null ? void 0 : _a2.clone();
  }
  updatePath() {
    const { projectedGeometry } = this;
    this.strokePath.clear();
    this.path.clear();
    this.bbox = projectedGeometry != null ? this.drawGeometry(projectedGeometry, void 0) : void 0;
  }
  drawPath(ctx) {
    super.drawPath(ctx);
    this.strokePath.draw(ctx);
    this.renderStroke(ctx);
  }
  containsPoint(x, y) {
    const { projectedGeometry } = this;
    if (projectedGeometry == null)
      return false;
    ({ x, y } = this.transformPoint(x, y));
    if (!this.getCachedBBox().containsPoint(x, y))
      return false;
    return this.geometryDistance(projectedGeometry, x, y) <= 0;
  }
  distanceToPoint(x, y) {
    const { projectedGeometry } = this;
    ({ x, y } = this.transformPoint(x, y));
    return projectedGeometry != null ? this.geometryDistance(projectedGeometry, x, y) : Infinity;
  }
  geometryDistance(geometry, x, y) {
    const { renderMode, strokeWidth } = this;
    const drawPolygons = (renderMode & 1 /* Polygons */) !== 0;
    const drawLines = (renderMode & 2 /* Lines */) !== 0;
    const minStrokeDistance = Math.max(strokeWidth / 2, 1) + 1;
    switch (geometry.type) {
      case "GeometryCollection":
        return geometry.geometries.reduce(
          (minDistance, g) => Math.min(minDistance, this.geometryDistance(g, x, y)),
          Infinity
        );
      case "MultiPolygon":
        return drawPolygons ? geometry.coordinates.reduce(
          (minDistance, polygon) => Math.min(minDistance, Math.max(polygonDistance(polygon, x, y), 0)),
          Infinity
        ) : Infinity;
      case "Polygon":
        return drawPolygons ? Math.max(polygonDistance(geometry.coordinates, x, y), 0) : Infinity;
      case "MultiLineString":
        return drawLines ? geometry.coordinates.reduce((minDistance, lineString) => {
          return Math.min(
            minDistance,
            Math.max(lineStringDistance(lineString, x, y) - minStrokeDistance, 0)
          );
        }, Infinity) : Infinity;
      case "LineString":
        return drawLines ? Math.max(lineStringDistance(geometry.coordinates, x, y) - minStrokeDistance, 0) : Infinity;
      case "MultiPoint":
      case "Point":
      default:
        return Infinity;
    }
  }
  drawGeometry(geometry, bbox) {
    const { renderMode, path, strokePath } = this;
    const drawPolygons = (renderMode & 1 /* Polygons */) !== 0;
    const drawLines = (renderMode & 2 /* Lines */) !== 0;
    switch (geometry.type) {
      case "GeometryCollection":
        geometry.geometries.forEach((g) => {
          bbox = this.drawGeometry(g, bbox);
        });
        break;
      case "MultiPolygon":
        if (drawPolygons) {
          geometry.coordinates.forEach((coordinates) => {
            bbox = this.drawPolygon(path, coordinates, bbox);
          });
        }
        break;
      case "Polygon":
        if (drawPolygons) {
          bbox = this.drawPolygon(path, geometry.coordinates, bbox);
        }
        break;
      case "LineString":
        if (drawLines) {
          bbox = this.drawLineString(strokePath, geometry.coordinates, bbox, false);
        }
        break;
      case "MultiLineString":
        if (drawLines) {
          geometry.coordinates.forEach((coordinates) => {
            bbox = this.drawLineString(strokePath, coordinates, bbox, false);
          });
        }
        break;
      case "Point":
      case "MultiPoint":
        break;
    }
    return bbox;
  }
  drawPolygon(path, polygons, bbox) {
    if (polygons.length < 1)
      return bbox;
    bbox = this.drawLineString(path, polygons[0], bbox, true);
    for (let i = 1; i < polygons.length; i += 1) {
      const enclave = polygons[i];
      this.drawLineString(path, enclave, void 0, true);
    }
    return bbox;
  }
  drawLineString(path, coordinates, bbox, isClosed) {
    if (coordinates.length < 2)
      return bbox;
    const end = isClosed ? coordinates.length - 1 : coordinates.length;
    for (let i = 0; i < end; i += 1) {
      const [x, y] = coordinates[i];
      if (i === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
      if (bbox == null) {
        bbox = new BBox7(x, y, 0, 0);
      } else {
        const { x: x0, y: y0 } = bbox;
        const x1 = x0 + bbox.width;
        const y1 = y0 + bbox.height;
        bbox.x = Math.min(x0, x);
        bbox.y = Math.min(y0, y);
        bbox.width = Math.max(x1, x) - bbox.x;
        bbox.height = Math.max(y1, y) - bbox.y;
      }
    }
    if (isClosed) {
      path.closePath();
    }
    return bbox;
  }
};
__decorateClass([
  ScenePathChangeDetection()
], GeoGeometry.prototype, "projectedGeometry", 2);
__decorateClass([
  ScenePathChangeDetection()
], GeoGeometry.prototype, "renderMode", 2);

// packages/ag-charts-enterprise/src/series/map-util/geometryUtil.ts
function geometryBbox(geometry, into) {
  if (geometry.bbox != null) {
    const [lon0, lat0, lon1, lat1] = geometry.bbox;
    into = extendBbox(into, lon0, lat0, lon1, lat1);
    return into;
  }
  switch (geometry.type) {
    case "GeometryCollection":
      geometry.geometries.forEach((g) => {
        into = geometryBbox(g, into);
      });
      break;
    case "MultiPolygon":
      geometry.coordinates.forEach((c) => {
        if (c.length > 0) {
          into = polygonBbox(c[0], into);
        }
      });
      break;
    case "Polygon":
      if (geometry.coordinates.length > 0) {
        into = polygonBbox(geometry.coordinates[0], into);
      }
      break;
    case "MultiLineString":
      geometry.coordinates.forEach((c) => {
        into = polygonBbox(c, into);
      });
      break;
    case "LineString":
      into = polygonBbox(geometry.coordinates, into);
      break;
    case "MultiPoint":
      geometry.coordinates.forEach((p) => {
        const [lon, lat] = p;
        into = extendBbox(into, lon, lat, lon, lat);
      });
      break;
    case "Point": {
      const [lon, lat] = geometry.coordinates;
      into = extendBbox(into, lon, lat, lon, lat);
      break;
    }
  }
  return into;
}
function largestPolygon(geometry) {
  switch (geometry.type) {
    case "GeometryCollection": {
      let maxArea;
      let maxPolygon;
      geometry.geometries.map((g) => {
        const polygon = largestPolygon(g);
        if (polygon == null)
          return;
        const bbox = polygonBbox(polygon[0], void 0);
        if (bbox == null)
          return;
        const area = Math.abs(bbox.lat1 - bbox.lat0) * Math.abs(bbox.lon1 - bbox.lon0);
        if (maxArea == null || area > maxArea) {
          maxArea = area;
          maxPolygon = polygon;
        }
      });
      return maxPolygon;
    }
    case "MultiPolygon": {
      let maxArea;
      let maxPolygon;
      geometry.coordinates.forEach((polygon) => {
        const bbox = polygonBbox(polygon[0], void 0);
        if (bbox == null)
          return;
        const area = Math.abs(bbox.lat1 - bbox.lat0) * Math.abs(bbox.lon1 - bbox.lon0);
        if (maxArea == null || area > maxArea) {
          maxArea = area;
          maxPolygon = polygon;
        }
      });
      return maxPolygon;
    }
    case "Polygon":
      return geometry.coordinates;
    case "MultiLineString":
    case "LineString":
    case "MultiPoint":
    case "Point":
      return;
  }
}
function largestLineString(geometry) {
  switch (geometry.type) {
    case "GeometryCollection": {
      let maxLength;
      let maxLineString;
      geometry.geometries.map((g) => {
        const lineString = largestLineString(g);
        if (lineString == null)
          return;
        const length = lineStringLength(lineString);
        if (length == null)
          return;
        if (maxLength == null || length > maxLength) {
          maxLength = length;
          maxLineString = lineString;
        }
      });
      return maxLineString;
    }
    case "MultiLineString": {
      let maxLength = 0;
      let maxLineString;
      geometry.coordinates.forEach((lineString) => {
        const length = lineStringLength(lineString);
        if (length > maxLength) {
          maxLength = length;
          maxLineString = lineString;
        }
      });
      return maxLineString;
    }
    case "LineString":
      return geometry.coordinates;
    case "MultiPolygon":
    case "Polygon":
    case "MultiPoint":
    case "Point":
      return;
  }
}
function containsType(geometry, type) {
  if (geometry == null)
    return false;
  switch (geometry.type) {
    case "GeometryCollection":
      return geometry.geometries.some((g) => containsType(g, type));
    case "MultiPolygon":
    case "Polygon":
      return (type & 1 /* Polygon */) !== 0;
    case "MultiLineString":
    case "LineString":
      return (type & 2 /* LineString */) !== 0;
    case "MultiPoint":
    case "Point":
      return (type & 4 /* Point */) !== 0;
  }
}
function projectGeometry(geometry, scale) {
  switch (geometry.type) {
    case "GeometryCollection":
      return {
        type: "GeometryCollection",
        geometries: geometry.geometries.map((g) => projectGeometry(g, scale))
      };
    case "Polygon":
      return {
        type: "Polygon",
        coordinates: projectPolygon(geometry.coordinates, scale)
      };
    case "MultiPolygon":
      return {
        type: "MultiPolygon",
        coordinates: projectMultiPolygon(geometry.coordinates, scale)
      };
    case "MultiLineString":
      return {
        type: "MultiLineString",
        coordinates: projectPolygon(geometry.coordinates, scale)
      };
    case "LineString":
      return {
        type: "LineString",
        coordinates: projectLineString(geometry.coordinates, scale)
      };
    case "MultiPoint":
      return {
        type: "MultiPoint",
        coordinates: projectLineString(geometry.coordinates, scale)
      };
    case "Point":
      return {
        type: "Point",
        coordinates: scale.convert(geometry.coordinates)
      };
  }
}
function projectMultiPolygon(multiPolygon, scale) {
  return multiPolygon.map((polygon) => projectPolygon(polygon, scale));
}
function projectPolygon(polygon, scale) {
  return polygon.map((lineString) => projectLineString(lineString, scale));
}
function projectLineString(lineString, scale) {
  return lineString.map((lonLat) => scale.convert(lonLat));
}

// packages/ag-charts-enterprise/src/series/map-util/validation.ts
var import_ag_charts_community66 = require("ag-charts-community");
function isValidCoordinate(v) {
  return Array.isArray(v) && v.length >= 2 && v.every(import_ag_charts_community66._ModuleSupport.isFiniteNumber);
}
function isValidCoordinates(v) {
  return Array.isArray(v) && v.length >= 2 && v.every(isValidCoordinate);
}
var delta2 = 1e-3;
function hasSameStartEndPoint(c) {
  return Math.abs(c[0][0] - c[c.length - 1][0]) < delta2 && Math.abs(c[0][1] - c[c.length - 1][1]) < delta2;
}
function isValidPolygon(v) {
  return Array.isArray(v) && v.every(isValidCoordinates) && v.every(hasSameStartEndPoint);
}
function isValidGeometry(v) {
  if (v === null)
    return true;
  if (typeof v !== "object" || v.type == null)
    return false;
  const { type, coordinates } = v;
  switch (type) {
    case "GeometryCollection":
      return Array.isArray(v.geometries) && v.geometries.every(isValidGeometry);
    case "MultiPolygon":
      return Array.isArray(coordinates) && coordinates.every(isValidPolygon);
    case "Polygon":
      return isValidPolygon(coordinates);
    case "MultiLineString":
      return Array.isArray(coordinates) && coordinates.every(isValidCoordinates);
    case "LineString":
      return isValidCoordinates(coordinates);
    case "MultiPoint":
      return isValidCoordinates(coordinates);
    case "Point":
      return isValidCoordinate(coordinates);
  }
}
function isValidFeature(v) {
  return v !== null && typeof v === "object" && v.type === "Feature" && isValidGeometry(v.geometry);
}
function isValidFeatureCollection(v) {
  return v !== null && typeof v === "object" && v.type === "FeatureCollection" && Array.isArray(v.features) && v.features.every(isValidFeature);
}
var GEOJSON_OBJECT = import_ag_charts_community66._ModuleSupport.predicateWithMessage(isValidFeatureCollection, "a GeoJSON object");

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundSeriesProperties.ts
var import_ag_charts_community67 = require("ag-charts-community");
var { COLOR_STRING: COLOR_STRING9, LINE_DASH: LINE_DASH7, OBJECT: OBJECT8, POSITIVE_NUMBER: POSITIVE_NUMBER12, RATIO: RATIO14, Validate: Validate30, SeriesProperties, SeriesTooltip: SeriesTooltip5 } = import_ag_charts_community67._ModuleSupport;
var MapLineBackgroundSeriesProperties = class extends SeriesProperties {
  constructor() {
    super(...arguments);
    this.topology = void 0;
    this.stroke = "black";
    this.strokeOpacity = 1;
    this.strokeWidth = 0;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.tooltip = new SeriesTooltip5();
  }
};
__decorateClass([
  Validate30(GEOJSON_OBJECT, { optional: true })
], MapLineBackgroundSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate30(COLOR_STRING9)
], MapLineBackgroundSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate30(RATIO14)
], MapLineBackgroundSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate30(POSITIVE_NUMBER12)
], MapLineBackgroundSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate30(LINE_DASH7)
], MapLineBackgroundSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate30(POSITIVE_NUMBER12)
], MapLineBackgroundSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate30(OBJECT8)
], MapLineBackgroundSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundSeries.ts
var { createDatumId: createDatumId2, DataModelSeries, SeriesNodePickMode: SeriesNodePickMode4, Validate: Validate31 } = import_ag_charts_community68._ModuleSupport;
var { Group: Group7, Selection: Selection3, PointerEvents: PointerEvents2 } = import_ag_charts_community68._Scene;
var { Logger: Logger7 } = import_ag_charts_community68._Util;
var MapLineBackgroundSeries = class extends DataModelSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode4.EXACT_SHAPE_MATCH]
    });
    this.properties = new MapLineBackgroundSeriesProperties();
    this._chartTopology = void 0;
    this.itemGroup = this.contentGroup.appendChild(new Group7({ name: "itemGroup" }));
    this.datumSelection = Selection3.select(
      this.itemGroup,
      () => this.nodeFactory()
    );
    this.contextNodeData = [];
  }
  get topology() {
    var _a2;
    return (_a2 = this.properties.topology) != null ? _a2 : this._chartTopology;
  }
  setOptionsData() {
  }
  setChartData() {
  }
  get hasData() {
    return false;
  }
  setChartTopology(topology) {
    this._chartTopology = topology;
    if (this.topology === topology) {
      this.nodeDataRefresh = true;
    }
  }
  nodeFactory() {
    const geoGeometry = new GeoGeometry();
    geoGeometry.renderMode = 2 /* Lines */;
    geoGeometry.lineJoin = "round";
    geoGeometry.lineCap = "round";
    geoGeometry.pointerEvents = PointerEvents2.None;
    return geoGeometry;
  }
  processData() {
    return __async(this, null, function* () {
      const { topology } = this;
      this.topologyBounds = topology == null ? void 0 : topology.features.reduce((current, feature) => {
        const geometry = feature.geometry;
        if (geometry == null)
          return current;
        return geometryBbox(geometry, current);
      }, void 0);
      if (topology == null) {
        Logger7.warnOnce(`no topology was provided for [MapShapeBackgroundSeries]; nothing will be rendered.`);
      }
    });
  }
  createNodeData() {
    return __async(this, null, function* () {
      const { id: seriesId, topology, scale } = this;
      if (topology == null)
        return [];
      const nodeData = [];
      const labelData = [];
      topology.features.forEach((feature, index) => {
        const { geometry } = feature;
        const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : void 0;
        if (projectedGeometry == null)
          return;
        nodeData.push({
          series: this,
          itemId: index,
          datum: feature,
          index,
          projectedGeometry
        });
      });
      return [
        {
          itemId: seriesId,
          nodeData,
          labelData
        }
      ];
    });
  }
  updateSelections() {
    return __async(this, null, function* () {
      if (this.nodeDataRefresh) {
        this.contextNodeData = yield this.createNodeData();
        this.nodeDataRefresh = false;
      }
    });
  }
  update() {
    return __async(this, null, function* () {
      const { datumSelection } = this;
      yield this.updateSelections();
      this.contentGroup.visible = this.visible;
      const { nodeData } = this.contextNodeData[0];
      this.datumSelection = yield this.updateDatumSelection({ nodeData, datumSelection });
      yield this.updateDatumNodes({ datumSelection });
    });
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId2(datum.index));
    });
  }
  updateDatumNodes(opts) {
    return __async(this, null, function* () {
      const { properties } = this;
      const { datumSelection } = opts;
      const { stroke, strokeOpacity, lineDash, lineDashOffset } = properties;
      const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
      datumSelection.each((geoGeometry, datum) => {
        const { projectedGeometry } = datum;
        if (projectedGeometry == null) {
          geoGeometry.visible = false;
          geoGeometry.projectedGeometry = void 0;
          return;
        }
        geoGeometry.visible = true;
        geoGeometry.projectedGeometry = projectedGeometry;
        geoGeometry.stroke = stroke;
        geoGeometry.strokeWidth = strokeWidth;
        geoGeometry.strokeOpacity = strokeOpacity;
        geoGeometry.lineDash = lineDash;
        geoGeometry.lineDashOffset = lineDashOffset;
      });
    });
  }
  resetAnimation() {
  }
  getLabelData() {
    return [];
  }
  getSeriesDomain() {
    return [NaN, NaN];
  }
  getLegendData() {
    return [];
  }
  getTooltipHtml() {
    return "";
  }
};
MapLineBackgroundSeries.className = "MapLineBackgroundSeries";
MapLineBackgroundSeries.type = "map-line-background";
__decorateClass([
  Validate31(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapLineBackgroundSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundModule.ts
var { EXTENDS_SERIES_DEFAULTS, DEFAULT_HIERARCHY_STROKES } = import_ag_charts_community69._Theme;
var MapLineBackgroundModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-line-background",
  instanceConstructor: MapLineBackgroundSeries,
  themeTemplate: {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS,
      strokeWidth: 1,
      lineDash: [0],
      lineDashOffset: 0
    },
    legend: {
      enabled: false
    },
    gradientLegend: {
      enabled: false
    },
    tooltip: {
      range: "exact"
    }
  },
  paletteFactory: ({ themeTemplateParameters }) => {
    var _a2;
    const { properties } = themeTemplateParameters;
    return {
      stroke: (_a2 = properties.get(DEFAULT_HIERARCHY_STROKES)) == null ? void 0 : _a2[1]
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-line/mapLineModule.ts
var import_ag_charts_community72 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-line/mapLineSeries.ts
var import_ag_charts_community71 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-line/mapLineSeriesProperties.ts
var import_ag_charts_community70 = require("ag-charts-community");
var {
  AND: AND8,
  ARRAY: ARRAY4,
  COLOR_STRING: COLOR_STRING10,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY2,
  FUNCTION: FUNCTION7,
  LINE_DASH: LINE_DASH8,
  NUMBER_ARRAY,
  OBJECT: OBJECT9,
  POSITIVE_NUMBER: POSITIVE_NUMBER13,
  RATIO: RATIO15,
  STRING: STRING9,
  Validate: Validate32,
  SeriesProperties: SeriesProperties2,
  SeriesTooltip: SeriesTooltip6
} = import_ag_charts_community70._ModuleSupport;
var { Label: Label2 } = import_ag_charts_community70._Scene;
var MapLineSeriesProperties = class extends SeriesProperties2 {
  constructor() {
    super(...arguments);
    this.topology = void 0;
    this.idKey = "";
    this.topologyIdKey = "name";
    this.idName = void 0;
    this.labelKey = void 0;
    this.labelName = void 0;
    this.colorRange = void 0;
    this.maxStrokeWidth = void 0;
    this.stroke = "black";
    this.strokeOpacity = 1;
    this.strokeWidth = 0;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.label = new Label2();
    this.tooltip = new SeriesTooltip6();
  }
};
__decorateClass([
  Validate32(GEOJSON_OBJECT, { optional: true })
], MapLineSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate32(STRING9, { optional: true })
], MapLineSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate32(STRING9, { optional: true })
], MapLineSeriesProperties.prototype, "legendItemName", 2);
__decorateClass([
  Validate32(STRING9)
], MapLineSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate32(STRING9)
], MapLineSeriesProperties.prototype, "topologyIdKey", 2);
__decorateClass([
  Validate32(STRING9, { optional: true })
], MapLineSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate32(STRING9, { optional: true })
], MapLineSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate32(STRING9, { optional: true })
], MapLineSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate32(STRING9, { optional: true })
], MapLineSeriesProperties.prototype, "sizeKey", 2);
__decorateClass([
  Validate32(STRING9, { optional: true })
], MapLineSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate32(STRING9, { optional: true })
], MapLineSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate32(STRING9, { optional: true })
], MapLineSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate32(NUMBER_ARRAY, { optional: true })
], MapLineSeriesProperties.prototype, "sizeDomain", 2);
__decorateClass([
  Validate32(AND8(COLOR_STRING_ARRAY2, ARRAY4.restrict({ minLength: 1 })), { optional: true })
], MapLineSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER13, { optional: true })
], MapLineSeriesProperties.prototype, "maxStrokeWidth", 2);
__decorateClass([
  Validate32(COLOR_STRING10)
], MapLineSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate32(RATIO15)
], MapLineSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER13)
], MapLineSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate32(LINE_DASH8)
], MapLineSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER13)
], MapLineSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate32(FUNCTION7, { optional: true })
], MapLineSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate32(OBJECT9)
], MapLineSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate32(OBJECT9)
], MapLineSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-line/mapLineSeries.ts
var { getMissCount: getMissCount2, createDatumId: createDatumId3, DataModelSeries: DataModelSeries2, SeriesNodePickMode: SeriesNodePickMode5, valueProperty: valueProperty6, Validate: Validate33 } = import_ag_charts_community71._ModuleSupport;
var { ColorScale: ColorScale2, LinearScale: LinearScale3 } = import_ag_charts_community71._Scale;
var { Group: Group8, Selection: Selection4, Text: Text6 } = import_ag_charts_community71._Scene;
var { sanitizeHtml: sanitizeHtml4, Logger: Logger8 } = import_ag_charts_community71._Util;
var MapLineSeries = class extends DataModelSeries2 {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode5.EXACT_SHAPE_MATCH, SeriesNodePickMode5.NEAREST_NODE]
    });
    this.properties = new MapLineSeriesProperties();
    this._chartTopology = void 0;
    this.colorScale = new ColorScale2();
    this.sizeScale = new LinearScale3();
    this.itemGroup = this.contentGroup.appendChild(new Group8({ name: "itemGroup" }));
    this.datumSelection = Selection4.select(
      this.itemGroup,
      () => this.nodeFactory()
    );
    this.labelSelection = Selection4.select(
      this.labelGroup,
      Text6
    );
    this.highlightDatumSelection = Selection4.select(
      this.highlightGroup,
      () => this.nodeFactory()
    );
    this.contextNodeData = [];
    this._previousDatumMidPoint = void 0;
  }
  get topology() {
    var _a2;
    return (_a2 = this.properties.topology) != null ? _a2 : this._chartTopology;
  }
  get hasData() {
    return super.hasData && this.topology != null;
  }
  setChartTopology(topology) {
    this._chartTopology = topology;
    if (this.topology === topology) {
      this.nodeDataRefresh = true;
    }
  }
  addChartEventListeners() {
    this.destroyFns.push(
      this.ctx.chartEventManager.addListener("legend-item-click", (event) => {
        this.onLegendItemClick(event);
      }),
      this.ctx.chartEventManager.addListener("legend-item-double-click", (event) => {
        this.onLegendItemDoubleClick(event);
      })
    );
  }
  isLabelEnabled() {
    return this.properties.labelKey != null && this.properties.label.enabled;
  }
  nodeFactory() {
    const geoGeometry = new GeoGeometry();
    geoGeometry.renderMode = 2 /* Lines */;
    geoGeometry.lineJoin = "round";
    geoGeometry.lineCap = "round";
    return geoGeometry;
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2;
      if (this.data == null || !this.properties.isValid()) {
        return;
      }
      const { data, topology, sizeScale, colorScale } = this;
      const { topologyIdKey, idKey, sizeKey, colorKey, labelKey, sizeDomain, colorRange } = this.properties;
      const featureById = /* @__PURE__ */ new Map();
      topology == null ? void 0 : topology.features.forEach((feature) => {
        var _a3;
        const property = (_a3 = feature.properties) == null ? void 0 : _a3[topologyIdKey];
        if (property == null || !containsType(feature.geometry, 2 /* LineString */))
          return;
        featureById.set(property, feature);
      });
      const { dataModel, processedData } = yield this.requestDataModel(dataController, data, {
        props: [
          valueProperty6(this, idKey, false, { id: "idValue", includeProperty: false }),
          valueProperty6(this, idKey, false, {
            id: "featureValue",
            includeProperty: false,
            processor: () => (datum) => featureById.get(datum)
          }),
          ...labelKey != null ? [valueProperty6(this, labelKey, false, { id: "labelValue" })] : [],
          ...sizeKey != null ? [valueProperty6(this, sizeKey, true, { id: "sizeValue" })] : [],
          ...colorKey != null ? [valueProperty6(this, colorKey, true, { id: "colorValue" })] : []
        ]
      });
      const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`).index;
      this.topologyBounds = processedData.data.reduce(
        (current, { values }) => {
          const feature = values[featureIdx];
          const geometry = feature == null ? void 0 : feature.geometry;
          if (geometry == null)
            return current;
          return geometryBbox(geometry, current);
        },
        void 0
      );
      if (sizeKey != null) {
        const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index;
        const processedSize = (_a2 = processedData.domain.values[sizeIdx]) != null ? _a2 : [];
        sizeScale.domain = sizeDomain != null ? sizeDomain : processedSize;
      }
      if (colorRange != null && this.isColorScaleValid()) {
        const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue").index;
        colorScale.domain = processedData.domain.values[colorKeyIdx];
        colorScale.range = colorRange;
        colorScale.update();
      }
      if (topology == null) {
        Logger8.warnOnce(`no topology was provided for [MapLineSeries]; nothing will be rendered.`);
      }
    });
  }
  isColorScaleValid() {
    const { colorKey } = this.properties;
    if (!colorKey) {
      return false;
    }
    const { dataModel, processedData } = this;
    if (!dataModel || !processedData) {
      return false;
    }
    const colorIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue").index;
    const dataCount = processedData.data.length;
    const missCount = getMissCount2(this, processedData.defs.values[colorIdx].missing);
    const colorDataMissing = dataCount === 0 || dataCount === missCount;
    return !colorDataMissing;
  }
  getLabelDatum(datum, labelValue, projectedGeometry, font) {
    if (labelValue == null || projectedGeometry == null)
      return;
    const lineString = largestLineString(projectedGeometry);
    if (lineString == null)
      return;
    const { idKey, idName, sizeKey, sizeName, colorKey, colorName, labelKey, labelName, label } = this.properties;
    const labelText = this.getLabelText(label, {
      value: labelValue,
      datum,
      idKey,
      idName,
      sizeKey,
      sizeName,
      colorKey,
      colorName,
      labelKey,
      labelName
    });
    if (labelText == null)
      return;
    const labelSize = Text6.getTextSize(String(labelText), font);
    const labelCenter = lineStringCenter(lineString);
    if (labelCenter == null)
      return;
    const [x, y] = labelCenter.point;
    const { width, height } = labelSize;
    return {
      point: { x, y, size: 0 },
      label: { width, height, text: labelText },
      marker: void 0,
      placement: void 0
    };
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2;
      const { id: seriesId, dataModel, processedData, sizeScale, colorScale, properties, scale } = this;
      const { idKey, sizeKey, colorKey, labelKey, label } = properties;
      if (dataModel == null || processedData == null)
        return [];
      const colorScaleValid = this.isColorScaleValid();
      const idIdx = dataModel.resolveProcessedDataIndexById(this, `idValue`).index;
      const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`).index;
      const labelIdx = labelKey != null ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : void 0;
      const sizeIdx = sizeKey != null ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index : void 0;
      const colorIdx = colorKey != null ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : void 0;
      const maxStrokeWidth = (_a2 = properties.maxStrokeWidth) != null ? _a2 : properties.strokeWidth;
      sizeScale.range = [Math.min(properties.strokeWidth, maxStrokeWidth), maxStrokeWidth];
      const font = label.getFont();
      const projectedGeometries = /* @__PURE__ */ new Map();
      processedData.data.forEach(({ values }) => {
        var _a3;
        const id = values[idIdx];
        const geometry = (_a3 = values[featureIdx]) == null ? void 0 : _a3.geometry;
        const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : void 0;
        if (id != null && projectedGeometry != null) {
          projectedGeometries.set(id, projectedGeometry);
        }
      });
      const nodeData = [];
      const labelData = [];
      const missingGeometries = [];
      processedData.data.forEach(({ datum, values }) => {
        const idValue = values[idIdx];
        const colorValue = colorIdx != null ? values[colorIdx] : void 0;
        const sizeValue = sizeIdx != null ? values[sizeIdx] : void 0;
        const labelValue = labelIdx != null ? values[labelIdx] : void 0;
        const color = colorScaleValid && colorValue != null ? colorScale.convert(colorValue) : void 0;
        const size = sizeValue != null ? sizeScale.convert(sizeValue, { clampMode: "clamped" }) : void 0;
        const projectedGeometry = projectedGeometries.get(idValue);
        if (projectedGeometry == null) {
          missingGeometries.push(idValue);
        }
        const labelDatum = this.getLabelDatum(datum, labelValue, projectedGeometry, font);
        if (labelDatum != null) {
          labelData.push(labelDatum);
        }
        nodeData.push({
          series: this,
          itemId: idKey,
          datum,
          stroke: color,
          strokeWidth: size,
          idValue,
          labelValue,
          colorValue,
          sizeValue,
          projectedGeometry
        });
      });
      const missingGeometriesCap = 10;
      if (missingGeometries.length > missingGeometriesCap) {
        const excessItems = missingGeometries.length - missingGeometriesCap;
        missingGeometries.length = missingGeometriesCap;
        missingGeometries.push(`(+${excessItems} more)`);
      }
      if (missingGeometries.length > 0) {
        Logger8.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
      }
      return [
        {
          itemId: seriesId,
          nodeData,
          labelData
        }
      ];
    });
  }
  updateSelections() {
    return __async(this, null, function* () {
      if (this.nodeDataRefresh) {
        this.contextNodeData = yield this.createNodeData();
        this.nodeDataRefresh = false;
      }
    });
  }
  update() {
    return __async(this, null, function* () {
      var _a2, _b, _c;
      const { datumSelection, labelSelection, highlightDatumSelection } = this;
      yield this.updateSelections();
      this.contentGroup.visible = this.visible;
      this.contentGroup.opacity = this.getOpacity();
      let highlightedDatum = (_a2 = this.ctx.highlightManager) == null ? void 0 : _a2.getActiveHighlight();
      if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
        highlightedDatum = void 0;
      }
      const nodeData = (_c = (_b = this.contextNodeData[0]) == null ? void 0 : _b.nodeData) != null ? _c : [];
      this.datumSelection = yield this.updateDatumSelection({ nodeData, datumSelection });
      yield this.updateDatumNodes({ datumSelection, isHighlight: false });
      this.labelSelection = yield this.updateLabelSelection({ labelSelection });
      yield this.updateLabelNodes({ labelSelection });
      this.highlightDatumSelection = yield this.updateDatumSelection({
        nodeData: highlightedDatum != null ? [highlightedDatum] : [],
        datumSelection: highlightDatumSelection
      });
      yield this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
    });
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId3(datum.idValue));
    });
  }
  updateDatumNodes(opts) {
    return __async(this, null, function* () {
      const {
        id: seriesId,
        properties,
        ctx: { callbackCache }
      } = this;
      const { datumSelection, isHighlight } = opts;
      const { idKey, labelKey, sizeKey, colorKey, stroke, strokeOpacity, lineDash, lineDashOffset, formatter } = properties;
      const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
      const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
      datumSelection.each((geoGeometry, datum) => {
        var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
        const { projectedGeometry } = datum;
        if (projectedGeometry == null) {
          geoGeometry.visible = false;
          geoGeometry.projectedGeometry = void 0;
          return;
        }
        let format;
        if (formatter != null) {
          const params = {
            seriesId,
            datum: datum.datum,
            itemId: datum.itemId,
            idKey,
            labelKey,
            sizeKey,
            colorKey,
            strokeOpacity,
            stroke,
            strokeWidth,
            lineDash,
            lineDashOffset,
            highlighted: isHighlight
          };
          format = callbackCache.call(formatter, params);
        }
        geoGeometry.visible = true;
        geoGeometry.projectedGeometry = projectedGeometry;
        geoGeometry.stroke = (_c = (_b = (_a2 = highlightStyle == null ? void 0 : highlightStyle.stroke) != null ? _a2 : format == null ? void 0 : format.stroke) != null ? _b : datum.stroke) != null ? _c : stroke;
        geoGeometry.strokeWidth = Math.max(
          (_d = highlightStyle == null ? void 0 : highlightStyle.strokeWidth) != null ? _d : 0,
          (_f = (_e = format == null ? void 0 : format.strokeWidth) != null ? _e : datum.strokeWidth) != null ? _f : strokeWidth
        );
        geoGeometry.strokeOpacity = (_h = (_g = highlightStyle == null ? void 0 : highlightStyle.strokeOpacity) != null ? _g : format == null ? void 0 : format.strokeOpacity) != null ? _h : strokeOpacity;
        geoGeometry.lineDash = (_j = (_i = highlightStyle == null ? void 0 : highlightStyle.lineDash) != null ? _i : format == null ? void 0 : format.lineDash) != null ? _j : lineDash;
        geoGeometry.lineDashOffset = (_l = (_k = highlightStyle == null ? void 0 : highlightStyle.lineDashOffset) != null ? _k : format == null ? void 0 : format.lineDashOffset) != null ? _l : lineDashOffset;
      });
    });
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      var _a2, _b;
      const placedLabels = (_b = this.isLabelEnabled() ? (_a2 = this.chart) == null ? void 0 : _a2.placeLabels().get(this) : void 0) != null ? _b : [];
      return opts.labelSelection.update(placedLabels);
    });
  }
  updateLabelNodes(opts) {
    return __async(this, null, function* () {
      const { labelSelection } = opts;
      const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;
      labelSelection.each((label, { x, y, width, height, text }) => {
        label.visible = true;
        label.x = x + width / 2;
        label.y = y + height / 2;
        label.text = text;
        label.fill = fill;
        label.fontStyle = fontStyle;
        label.fontWeight = fontWeight;
        label.fontSize = fontSize;
        label.fontFamily = fontFamily;
        label.textAlign = "center";
        label.textBaseline = "middle";
      });
    });
  }
  onLegendItemClick(event) {
    const { legendItemName } = this.properties;
    const { enabled, itemId, series } = event;
    const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
    if (series.id === this.id || matchedLegendItemName) {
      this.toggleSeriesItem(itemId, enabled);
    }
  }
  onLegendItemDoubleClick(event) {
    const { enabled, itemId, series, numVisibleItems } = event;
    const { legendItemName } = this.properties;
    const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
    if (series.id === this.id || matchedLegendItemName) {
      this.toggleSeriesItem(itemId, true);
    } else if (enabled && numVisibleItems === 1) {
      this.toggleSeriesItem(itemId, true);
    } else {
      this.toggleSeriesItem(itemId, false);
    }
  }
  resetAnimation() {
  }
  getLabelData() {
    return this.contextNodeData.flatMap(({ labelData }) => labelData);
  }
  getSeriesDomain() {
    return [NaN, NaN];
  }
  pickNodeClosestDatum({ x, y }) {
    let minDistance = Infinity;
    let minDatum;
    this.datumSelection.each((node, datum) => {
      const distance = node.distanceToPoint(x, y);
      if (distance < minDistance) {
        minDistance = distance;
        minDatum = datum;
      }
    });
    return minDatum != null ? { datum: minDatum, distance: minDistance } : void 0;
  }
  datumMidPoint(datum) {
    var _a2;
    const { _previousDatumMidPoint } = this;
    if ((_previousDatumMidPoint == null ? void 0 : _previousDatumMidPoint.datum) === datum) {
      return _previousDatumMidPoint.point;
    }
    const projectedGeometry = datum.projectedGeometry;
    const lineString = projectedGeometry != null ? largestLineString(projectedGeometry) : void 0;
    const center = lineString != null ? (_a2 = lineStringCenter(lineString)) == null ? void 0 : _a2.point : void 0;
    const point = center != null ? { x: center[0], y: center[1] } : void 0;
    this._previousDatumMidPoint = { datum, point };
    return point;
  }
  getLegendData(legendType) {
    var _a2, _b, _c, _d;
    const { processedData, dataModel } = this;
    if (processedData == null || dataModel == null)
      return [];
    const {
      title,
      legendItemName,
      idKey,
      idName,
      colorKey,
      colorName,
      colorRange,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      visible
    } = this.properties;
    if (legendType === "gradient" && colorKey != null && colorRange != null) {
      const colorDomain = processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, "colorValue").index];
      const legendDatum = {
        legendType: "gradient",
        enabled: visible,
        seriesId: this.id,
        colorName,
        colorRange,
        colorDomain
      };
      return [legendDatum];
    } else if (legendType === "category") {
      const legendDatum = {
        legendType: "category",
        id: this.id,
        itemId: (_b = (_a2 = legendItemName != null ? legendItemName : title) != null ? _a2 : idName) != null ? _b : idKey,
        seriesId: this.id,
        enabled: visible,
        label: { text: (_d = (_c = legendItemName != null ? legendItemName : title) != null ? _c : idName) != null ? _d : idKey },
        marker: {
          fill: stroke,
          fillOpacity: strokeOpacity,
          stroke: void 0,
          strokeWidth: 0,
          strokeOpacity: 0,
          enabled: false
        },
        line: {
          stroke,
          strokeOpacity,
          strokeWidth,
          lineDash
        },
        legendItemName
      };
      return [legendDatum];
    } else {
      return [];
    }
  }
  getTooltipHtml(nodeDatum) {
    var _a2, _b, _c, _d, _e;
    const {
      id: seriesId,
      processedData,
      properties,
      ctx: { callbackCache }
    } = this;
    if (!processedData || !properties.isValid()) {
      return "";
    }
    const {
      legendItemName,
      idKey,
      idName,
      colorKey,
      colorName,
      sizeKey,
      sizeName,
      labelKey,
      labelName,
      formatter,
      tooltip
    } = properties;
    const { datum, stroke, idValue, colorValue, sizeValue, labelValue } = nodeDatum;
    const title = (_b = sanitizeHtml4((_a2 = properties.title) != null ? _a2 : legendItemName)) != null ? _b : "";
    const contentLines = [];
    contentLines.push(sanitizeHtml4((idName != null ? `${idName}: ` : "") + idValue));
    if (colorValue != null) {
      contentLines.push(sanitizeHtml4((colorName != null ? colorName : colorKey) + ": " + colorValue));
    }
    if (sizeValue != null) {
      contentLines.push(sanitizeHtml4((sizeName != null ? sizeName : sizeKey) + ": " + sizeValue));
    }
    if (labelValue != null && labelKey !== idKey) {
      contentLines.push(sanitizeHtml4((labelName != null ? labelName : labelKey) + ": " + labelValue));
    }
    const content = contentLines.join("<br>");
    let format;
    if (formatter) {
      format = callbackCache.call(formatter, {
        seriesId,
        datum,
        idKey,
        stroke,
        strokeWidth: this.getStrokeWidth((_c = nodeDatum.strokeWidth) != null ? _c : properties.strokeWidth),
        highlighted: false
      });
    }
    const color = (_e = (_d = format == null ? void 0 : format.stroke) != null ? _d : stroke) != null ? _e : properties.stroke;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      __spreadValues({
        seriesId,
        datum,
        idKey,
        title,
        color
      }, this.getModuleTooltipParams())
    );
  }
};
MapLineSeries.className = "MapLineSeries";
MapLineSeries.type = "map-line";
__decorateClass([
  Validate33(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapLineSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-line/mapLineModule.ts
var {
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
  EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS2,
  DEFAULT_FONT_FAMILY,
  DEFAULT_LABEL_COLOUR,
  singleSeriesPaletteFactory
} = import_ag_charts_community72._Theme;
var MapLineModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-line",
  instanceConstructor: MapLineSeries,
  themeTemplate: {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS2,
      strokeWidth: 1,
      maxStrokeWidth: 3,
      lineDash: [0],
      lineDashOffset: 0,
      label: {
        enabled: true,
        fontStyle: void 0,
        fontWeight: void 0,
        fontSize: 12,
        fontFamily: DEFAULT_FONT_FAMILY,
        color: DEFAULT_LABEL_COLOUR
      }
    },
    legend: {
      enabled: false
    },
    gradientLegend: {
      enabled: false
    },
    tooltip: {
      range: "exact"
    }
  },
  paletteFactory: (opts) => {
    const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
    const { fill } = singleSeriesPaletteFactory(opts);
    const { properties } = themeTemplateParameters;
    const defaultColorRange = properties.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    const { fills } = takeColors(colorsCount);
    return {
      colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
      stroke: fill
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerModule.ts
var import_ag_charts_community75 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerSeries.ts
var import_ag_charts_community74 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-util/mapUtil.ts
function prepareMapMarkerAnimationFunctions() {
  const fromFn = (marker, _datum, status) => {
    if (status === "removed") {
      return { scalingX: 1, scalingY: 1 };
    } else if (marker.previousDatum == null) {
      return { scalingX: 0, scalingY: 0 };
    }
    return { scalingX: marker.scalingX, scalingY: marker.scalingY };
  };
  const toFn = (_marker, _datum, status) => {
    if (status === "removed") {
      return { scalingX: 0, scalingY: 0 };
    }
    return { scalingX: 1, scalingY: 1 };
  };
  return { fromFn, toFn };
}

// packages/ag-charts-enterprise/src/series/map-util/polygonPointSearch.ts
function polygonPointSearch(polygons, precision, valueFn) {
  const bbox = polygonBbox(polygons[0], void 0);
  if (bbox == null)
    return;
  const boundingXCenter = (bbox.lon0 + bbox.lon1) / 2;
  const boundingYCenter = (bbox.lat0 + bbox.lat1) / 2;
  const boundingWidth = Math.abs(bbox.lon1 - bbox.lon0);
  const boundingHeight = Math.abs(bbox.lat1 - bbox.lat0);
  const centroid = polygonCentroid(polygons[0]);
  const [cx, cy] = centroid;
  const centroidDistanceToPolygon = -polygonDistance(polygons, cx, cy);
  let bestResult;
  const cellValue = (distanceToPolygon, distanceToCentroid) => {
    const centroidDriftFactor = 0.5;
    const centroidDrift = Math.max(distanceToCentroid - centroidDistanceToPolygon, 0);
    return distanceToPolygon - centroidDriftFactor * centroidDrift;
  };
  const createLabelPlacement = (x2, y2, stride) => {
    const { distance: distance2, maxDistance } = valueFn(polygons, x2, y2, stride);
    const distanceToCentroid = Math.hypot(cx - x2, cy - y2);
    const maxXTowardsCentroid = Math.min(Math.max(cx, x2 - stride / 2), x2 + stride / 2);
    const maxYTowardsCentroid = Math.min(Math.max(cy, y2 - stride / 2), y2 + stride / 2);
    const minDistanceToCentroid = Math.hypot(cx - maxXTowardsCentroid, cy - maxYTowardsCentroid);
    const value = cellValue(distance2, distanceToCentroid);
    const maxValue = cellValue(maxDistance, minDistanceToCentroid);
    return { distance: distance2, maxDistance, value, maxValue, x: x2, y: y2, stride };
  };
  const appendLabelPlacement = (into, x2, y2, stride) => {
    const labelPlacement = createLabelPlacement(x2, y2, stride);
    if (labelPlacement.maxDistance >= 0) {
      into.push(labelPlacement);
    }
  };
  const initialStride = Math.min(boundingWidth, boundingHeight) / 2;
  let queue = {
    value: createLabelPlacement(boundingXCenter, boundingYCenter, initialStride),
    next: null
  };
  while (queue != null) {
    const item = queue.value;
    const { distance: distance2, value, maxValue, x: x2, y: y2, stride } = item;
    queue = queue.next;
    if (distance2 > 0 && (bestResult == null || value > bestResult.value)) {
      bestResult = item;
    }
    if (bestResult != null && maxValue - bestResult.value <= precision) {
      continue;
    }
    const nextStride = stride / 2;
    const newLabelPlacements = [];
    appendLabelPlacement(newLabelPlacements, x2 - nextStride, y2 - nextStride, nextStride);
    appendLabelPlacement(newLabelPlacements, x2 + nextStride, y2 - nextStride, nextStride);
    appendLabelPlacement(newLabelPlacements, x2 - nextStride, y2 + nextStride, nextStride);
    appendLabelPlacement(newLabelPlacements, x2 + nextStride, y2 + nextStride, nextStride);
    newLabelPlacements.sort(labelPlacementCmp);
    queue = insertManySorted(queue, newLabelPlacements, labelPlacementCmp);
  }
  if (bestResult == null)
    return;
  const { distance, x, y } = bestResult;
  return { x, y, distance };
}
var labelPlacementCmp = (a, b) => b.maxValue - a.maxValue;

// packages/ag-charts-enterprise/src/series/map-util/markerUtil.ts
function polygonMarkerCenter(polygons, precision) {
  const result = polygonPointSearch(polygons, precision, (p, x2, y2, stride) => {
    const distance = -polygonDistance(p, x2, y2);
    const maxDistance = distance + stride * Math.SQRT2;
    return { distance, maxDistance };
  });
  if (result == null)
    return;
  const { x, y } = result;
  return [x, y];
}
function markerPositions(geometry, precision) {
  var _a2, _b;
  let center;
  switch (geometry.type) {
    case "GeometryCollection":
      return geometry.geometries.flatMap((g) => markerPositions(g, precision));
    case "MultiPoint":
      return geometry.coordinates;
    case "Point":
      return [geometry.coordinates];
    case "MultiPolygon": {
      const polygon = largestPolygon(geometry);
      center = polygon != null ? polygonMarkerCenter(polygon, precision) : void 0;
      break;
    }
    case "Polygon": {
      const polygon = geometry.coordinates;
      center = polygon != null ? polygonMarkerCenter(polygon, precision) : void 0;
      break;
    }
    case "MultiLineString": {
      const lineString = largestLineString(geometry);
      center = lineString != null ? (_a2 = lineStringCenter(lineString)) == null ? void 0 : _a2.point : void 0;
      break;
    }
    case "LineString": {
      const lineString = geometry.coordinates;
      center = (_b = lineStringCenter(lineString)) == null ? void 0 : _b.point;
      break;
    }
  }
  return center != null ? [center] : [];
}

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerSeriesProperties.ts
var import_ag_charts_community73 = require("ag-charts-community");
var {
  AND: AND9,
  ARRAY: ARRAY5,
  COLOR_STRING: COLOR_STRING11,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY3,
  FUNCTION: FUNCTION8,
  NUMBER_ARRAY: NUMBER_ARRAY2,
  OBJECT: OBJECT10,
  POSITIVE_NUMBER: POSITIVE_NUMBER14,
  RATIO: RATIO16,
  STRING: STRING10,
  MARKER_SHAPE,
  Validate: Validate34,
  SeriesProperties: SeriesProperties3,
  SeriesTooltip: SeriesTooltip7
} = import_ag_charts_community73._ModuleSupport;
var { Label: Label3, Circle } = import_ag_charts_community73._Scene;
var { Logger: Logger9 } = import_ag_charts_community73._Util;
var MapMarkerSeriesLabel = class extends Label3 {
  constructor() {
    super(...arguments);
    this.placement = "bottom";
  }
};
__decorateClass([
  Validate34(STRING10)
], MapMarkerSeriesLabel.prototype, "placement", 2);
var MapMarkerSeriesProperties = class extends SeriesProperties3 {
  constructor() {
    super(...arguments);
    this.topology = void 0;
    this.idKey = void 0;
    this.topologyIdKey = "name";
    this.idName = void 0;
    this.latitudeKey = void 0;
    this.latitudeName = void 0;
    this.longitudeKey = void 0;
    this.longitudeName = void 0;
    this.labelKey = void 0;
    this.labelName = void 0;
    this.colorRange = void 0;
    this.shape = Circle;
    this.size = 6;
    this.fillOpacity = 1;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.label = new MapMarkerSeriesLabel();
    this.tooltip = new SeriesTooltip7();
  }
  isValid() {
    const superIsValid = super.isValid();
    const hasTopology = this.idKey != null;
    const hasLatLon = this.latitudeKey != null && this.longitudeKey != null;
    if (!hasTopology && !hasLatLon) {
      Logger9.warnOnce(
        "Either both [topology] and [idKey] or both [latitudeKey] and [longitudeKey] must be set to render a map marker series."
      );
      return false;
    }
    return superIsValid;
  }
};
__decorateClass([
  Validate34(GEOJSON_OBJECT, { optional: true })
], MapMarkerSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "legendItemName", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate34(STRING10)
], MapMarkerSeriesProperties.prototype, "topologyIdKey", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "latitudeKey", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "latitudeName", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "longitudeKey", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "longitudeName", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "sizeKey", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate34(STRING10, { optional: true })
], MapMarkerSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate34(AND9(COLOR_STRING_ARRAY3, ARRAY5.restrict({ minLength: 1 })), { optional: true })
], MapMarkerSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate34(MARKER_SHAPE)
], MapMarkerSeriesProperties.prototype, "shape", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER14)
], MapMarkerSeriesProperties.prototype, "size", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER14, { optional: true })
], MapMarkerSeriesProperties.prototype, "maxSize", 2);
__decorateClass([
  Validate34(NUMBER_ARRAY2, { optional: true })
], MapMarkerSeriesProperties.prototype, "sizeDomain", 2);
__decorateClass([
  Validate34(COLOR_STRING11, { optional: true })
], MapMarkerSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate34(RATIO16)
], MapMarkerSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate34(COLOR_STRING11, { optional: true })
], MapMarkerSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER14)
], MapMarkerSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate34(RATIO16)
], MapMarkerSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate34(FUNCTION8, { optional: true })
], MapMarkerSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate34(OBJECT10)
], MapMarkerSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate34(OBJECT10)
], MapMarkerSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerSeries.ts
var {
  Validate: Validate35,
  fromToMotion: fromToMotion2,
  StateMachine,
  getMissCount: getMissCount3,
  createDatumId: createDatumId4,
  DataModelSeries: DataModelSeries3,
  SeriesNodePickMode: SeriesNodePickMode6,
  Layers: Layers6,
  valueProperty: valueProperty7
} = import_ag_charts_community74._ModuleSupport;
var { ColorScale: ColorScale3, LinearScale: LinearScale4 } = import_ag_charts_community74._Scale;
var { Group: Group9, Selection: Selection5, Text: Text7, getMarker } = import_ag_charts_community74._Scene;
var { sanitizeHtml: sanitizeHtml5, Logger: Logger10 } = import_ag_charts_community74._Util;
var MapMarkerSeries = class extends DataModelSeries3 {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: true,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode6.EXACT_SHAPE_MATCH, SeriesNodePickMode6.NEAREST_NODE]
    });
    this.properties = new MapMarkerSeriesProperties();
    this._chartTopology = void 0;
    this.colorScale = new ColorScale3();
    this.sizeScale = new LinearScale4();
    this.markerGroup = this.contentGroup.appendChild(
      new Group9({
        name: "markerGroup",
        layer: true,
        isVirtual: false,
        zIndex: Layers6.SERIES_LAYER_ZINDEX,
        zIndexSubOrder: this.getGroupZIndexSubOrder("marker")
      })
    );
    this.labelSelection = Selection5.select(
      this.labelGroup,
      Text7,
      false
    );
    this.markerSelection = Selection5.select(
      this.markerGroup,
      () => this.markerFactory(),
      false
    );
    this.highlightMarkerSelection = Selection5.select(
      this.highlightGroup,
      () => this.markerFactory()
    );
    this.contextNodeData = [];
    this.animationState = new StateMachine(
      "empty",
      {
        empty: {
          update: {
            target: "ready",
            action: () => this.animateMarkers()
          },
          reset: "empty",
          skip: "ready"
        },
        ready: {
          updateData: "waiting",
          clear: "clearing",
          resize: () => this.resetAllAnimation(),
          reset: "empty",
          skip: "ready"
        },
        waiting: {
          update: {
            target: "ready",
            action: () => this.animateMarkers()
          },
          reset: "empty",
          skip: "ready"
        },
        clearing: {
          update: {
            target: "empty",
            action: () => this.resetAllAnimation()
          },
          reset: "empty",
          skip: "ready"
        }
      },
      () => this.checkProcessedDataAnimatable()
    );
  }
  get topology() {
    var _a2;
    return (_a2 = this.properties.topology) != null ? _a2 : this._chartTopology;
  }
  get hasData() {
    const hasLatLon = this.properties.latitudeKey != null && this.properties.longitudeKey != null;
    return super.hasData && (this.topology != null || hasLatLon);
  }
  setChartTopology(topology) {
    this._chartTopology = topology;
    if (this.topology === topology) {
      this.nodeDataRefresh = true;
    }
  }
  addChartEventListeners() {
    this.destroyFns.push(
      this.ctx.chartEventManager.addListener("legend-item-click", (event) => {
        this.onLegendItemClick(event);
      }),
      this.ctx.chartEventManager.addListener("legend-item-double-click", (event) => {
        this.onLegendItemDoubleClick(event);
      })
    );
  }
  isLabelEnabled() {
    return this.properties.labelKey != null && this.properties.label.enabled;
  }
  markerFactory() {
    const { shape } = this.properties;
    const MarkerShape = getMarker(shape);
    return new MarkerShape();
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2;
      if (this.data == null || !this.properties.isValid()) {
        return;
      }
      const { data, topology, sizeScale, colorScale } = this;
      const { topologyIdKey, idKey, latitudeKey, longitudeKey, sizeKey, colorKey, labelKey, sizeDomain, colorRange } = this.properties;
      const featureById = /* @__PURE__ */ new Map();
      topology == null ? void 0 : topology.features.forEach((feature) => {
        var _a3;
        const property = (_a3 = feature.properties) == null ? void 0 : _a3[topologyIdKey];
        if (property == null)
          return;
        featureById.set(property, feature);
      });
      const hasLatLon = latitudeKey != null && longitudeKey != null;
      const { dataModel, processedData } = yield this.requestDataModel(dataController, data, {
        props: [
          ...idKey != null ? [
            valueProperty7(this, idKey, false, { id: "idValue", includeProperty: false }),
            valueProperty7(this, idKey, false, {
              id: "featureValue",
              includeProperty: false,
              processor: () => (datum) => featureById.get(datum)
            })
          ] : [],
          ...hasLatLon ? [
            valueProperty7(this, latitudeKey, false, { id: "latValue" }),
            valueProperty7(this, longitudeKey, false, { id: "lonValue" })
          ] : [],
          ...labelKey ? [valueProperty7(this, labelKey, false, { id: "labelValue" })] : [],
          ...sizeKey ? [valueProperty7(this, sizeKey, true, { id: "sizeValue" })] : [],
          ...colorKey ? [valueProperty7(this, colorKey, true, { id: "colorValue" })] : []
        ]
      });
      const featureIdx = idKey != null ? dataModel.resolveProcessedDataIndexById(this, `featureValue`).index : void 0;
      const latIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `latValue`).index : void 0;
      const lonIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `lonValue`).index : void 0;
      this.topologyBounds = processedData.data.reduce(
        (current, { values }) => {
          const feature = featureIdx != null ? values[featureIdx] : void 0;
          const geometry = feature == null ? void 0 : feature.geometry;
          if (geometry != null) {
            current = geometryBbox(geometry, current);
          }
          if (latIdx != null && lonIdx != null) {
            const lon = values[lonIdx];
            const lat = values[latIdx];
            current = extendBbox(current, lon, lat, lon, lat);
          }
          return current;
        },
        void 0
      );
      if (sizeKey != null) {
        const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index;
        const processedSize = (_a2 = processedData.domain.values[sizeIdx]) != null ? _a2 : [];
        sizeScale.domain = sizeDomain != null ? sizeDomain : processedSize;
      }
      if (colorRange != null && this.isColorScaleValid()) {
        const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue").index;
        colorScale.domain = processedData.domain.values[colorKeyIdx];
        colorScale.range = colorRange;
        colorScale.update();
      }
      this.animationState.transition("updateData");
    });
  }
  isColorScaleValid() {
    const { colorKey } = this.properties;
    if (!colorKey) {
      return false;
    }
    const { dataModel, processedData } = this;
    if (!dataModel || !processedData) {
      return false;
    }
    const colorIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue").index;
    const dataCount = processedData.data.length;
    const missCount = getMissCount3(this, processedData.defs.values[colorIdx].missing);
    const colorDataMissing = dataCount === 0 || dataCount === missCount;
    return !colorDataMissing;
  }
  getLabelDatum(datum, labelValue, x, y, size, font) {
    if (labelValue == null)
      return;
    const {
      idKey,
      idName,
      latitudeKey,
      latitudeName,
      longitudeKey,
      longitudeName,
      sizeKey,
      sizeName,
      colorKey,
      colorName,
      labelKey,
      labelName,
      label
    } = this.properties;
    const { placement } = label;
    const labelText = this.getLabelText(label, {
      value: labelValue,
      datum,
      idKey,
      idName,
      latitudeKey,
      latitudeName,
      longitudeKey,
      longitudeName,
      sizeKey,
      sizeName,
      colorKey,
      colorName,
      labelKey,
      labelName
    });
    if (labelText == null)
      return;
    const { width, height } = Text7.getTextSize(String(labelText), font);
    return {
      point: { x, y, size },
      label: { width, height, text: labelText },
      marker: getMarker(this.properties.shape),
      placement
    };
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2;
      const { id: seriesId, dataModel, processedData, colorScale, sizeScale, properties, scale } = this;
      const { idKey, latitudeKey, longitudeKey, sizeKey, colorKey, labelKey, label } = properties;
      if (dataModel == null || processedData == null || scale == null)
        return [];
      const colorScaleValid = this.isColorScaleValid();
      const hasLatLon = latitudeKey != null && longitudeKey != null;
      const idIdx = idKey != null ? dataModel.resolveProcessedDataIndexById(this, `idValue`).index : void 0;
      const featureIdx = idKey != null ? dataModel.resolveProcessedDataIndexById(this, `featureValue`).index : void 0;
      const latIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `latValue`).index : void 0;
      const lonIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `lonValue`).index : void 0;
      const labelIdx = labelKey != null ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : void 0;
      const sizeIdx = sizeKey != null ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index : void 0;
      const colorIdx = colorKey != null ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : void 0;
      const markerMaxSize = (_a2 = properties.maxSize) != null ? _a2 : properties.size;
      sizeScale.range = [Math.min(properties.size, markerMaxSize), markerMaxSize];
      const font = label.getFont();
      let projectedGeometries;
      if (idIdx != null && featureIdx != null) {
        projectedGeometries = /* @__PURE__ */ new Map();
        processedData.data.forEach(({ values }) => {
          var _a3;
          const id = values[idIdx];
          const geometry = (_a3 = values[featureIdx]) == null ? void 0 : _a3.geometry;
          const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : void 0;
          if (id != null && projectedGeometry != null) {
            projectedGeometries.set(id, projectedGeometry);
          }
        });
      }
      const nodeData = [];
      const labelData = [];
      const missingGeometries = [];
      processedData.data.forEach(({ datum, values }) => {
        const idValue = idIdx != null ? values[idIdx] : void 0;
        const lonValue = lonIdx != null ? values[lonIdx] : void 0;
        const latValue = latIdx != null ? values[latIdx] : void 0;
        const colorValue = colorIdx != null ? values[colorIdx] : void 0;
        const sizeValue = sizeIdx != null ? values[sizeIdx] : void 0;
        const labelValue = labelIdx != null ? values[labelIdx] : void 0;
        const color = colorScaleValid && colorValue != null ? colorScale.convert(colorValue) : void 0;
        const size = sizeValue != null ? sizeScale.convert(sizeValue, { clampMode: "clamped" }) : properties.size;
        const projectedGeometry = idValue != null ? projectedGeometries == null ? void 0 : projectedGeometries.get(idValue) : void 0;
        if (idValue != null && projectGeometry == null) {
          missingGeometries.push(idValue);
        }
        if (lonValue != null && latValue != null) {
          const [x, y] = scale.convert([lonValue, latValue]);
          const labelDatum = this.getLabelDatum(datum, labelValue, x, y, size, font);
          if (labelDatum) {
            labelData.push(labelDatum);
          }
          nodeData.push({
            series: this,
            itemId: latitudeKey,
            datum,
            index: -1,
            fill: color,
            idValue,
            lonValue,
            latValue,
            labelValue,
            sizeValue,
            colorValue,
            point: { x, y, size },
            midPoint: { x, y }
          });
        } else if (projectedGeometry != null) {
          markerPositions(projectedGeometry, 1).forEach(([x, y], index) => {
            const labelDatum = this.getLabelDatum(datum, labelValue, x, y, size, font);
            if (labelDatum) {
              labelData.push(labelDatum);
            }
            nodeData.push({
              series: this,
              itemId: latitudeKey,
              datum,
              index,
              fill: color,
              idValue,
              lonValue,
              latValue,
              labelValue,
              sizeValue,
              colorValue,
              point: { x, y, size },
              midPoint: { x, y }
            });
          });
        }
      });
      const missingGeometriesCap = 10;
      if (missingGeometries.length > missingGeometriesCap) {
        const excessItems = missingGeometries.length - missingGeometriesCap;
        missingGeometries.length = missingGeometriesCap;
        missingGeometries.push(`(+${excessItems} more)`);
      }
      if (missingGeometries.length > 0) {
        Logger10.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
      }
      return [
        {
          itemId: seriesId,
          nodeData,
          labelData
        }
      ];
    });
  }
  updateSelections() {
    return __async(this, null, function* () {
      if (this.nodeDataRefresh) {
        this.contextNodeData = yield this.createNodeData();
        this.nodeDataRefresh = false;
      }
    });
  }
  update(_0) {
    return __async(this, arguments, function* ({ seriesRect }) {
      var _a2, _b, _c;
      const { labelSelection, markerSelection, highlightMarkerSelection } = this;
      yield this.updateSelections();
      this.contentGroup.visible = this.visible;
      this.contentGroup.opacity = this.getOpacity();
      let highlightedDatum = (_a2 = this.ctx.highlightManager) == null ? void 0 : _a2.getActiveHighlight();
      if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
        highlightedDatum = void 0;
      }
      const nodeData = (_c = (_b = this.contextNodeData[0]) == null ? void 0 : _b.nodeData) != null ? _c : [];
      this.labelSelection = yield this.updateLabelSelection({ labelSelection });
      yield this.updateLabelNodes({ labelSelection });
      this.markerSelection = yield this.updateMarkerSelection({ markerData: nodeData, markerSelection });
      yield this.updateMarkerNodes({ markerSelection, isHighlight: false, highlightedDatum });
      this.highlightMarkerSelection = yield this.updateMarkerSelection({
        markerData: highlightedDatum != null ? [highlightedDatum] : [],
        markerSelection: highlightMarkerSelection
      });
      yield this.updateMarkerNodes({
        markerSelection: highlightMarkerSelection,
        isHighlight: true,
        highlightedDatum
      });
      const resize = this.checkResize(seriesRect);
      if (resize) {
        this.animationState.transition("resize");
      }
      this.animationState.transition("update");
    });
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      var _a2, _b;
      const placedLabels = (_b = this.isLabelEnabled() ? (_a2 = this.chart) == null ? void 0 : _a2.placeLabels().get(this) : void 0) != null ? _b : [];
      return opts.labelSelection.update(placedLabels);
    });
  }
  updateLabelNodes(opts) {
    return __async(this, null, function* () {
      const { labelSelection } = opts;
      const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;
      labelSelection.each((label, { x, y, width, height, text }) => {
        label.visible = true;
        label.x = x + width / 2;
        label.y = y + height / 2;
        label.text = text;
        label.fill = fill;
        label.fontStyle = fontStyle;
        label.fontWeight = fontWeight;
        label.fontSize = fontSize;
        label.fontFamily = fontFamily;
        label.textAlign = "center";
        label.textBaseline = "middle";
      });
    });
  }
  updateMarkerSelection(opts) {
    return __async(this, null, function* () {
      const { markerData, markerSelection } = opts;
      return markerSelection.update(
        markerData,
        void 0,
        (datum) => createDatumId4([datum.index, datum.idValue, datum.lonValue, datum.latValue])
      );
    });
  }
  updateMarkerNodes(opts) {
    return __async(this, null, function* () {
      const {
        id: seriesId,
        properties,
        ctx: { callbackCache }
      } = this;
      const { markerSelection, isHighlight, highlightedDatum } = opts;
      const {
        idKey,
        latitudeKey,
        longitudeKey,
        labelKey,
        sizeKey,
        colorKey,
        fill,
        fillOpacity,
        stroke,
        strokeOpacity,
        formatter
      } = properties;
      const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
      const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
      markerSelection.each((marker, markerDatum) => {
        var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
        const { datum, point } = markerDatum;
        let format;
        if (formatter != null) {
          const params = {
            seriesId,
            datum: markerDatum.datum,
            itemId: markerDatum.itemId,
            size: point.size,
            idKey,
            latitudeKey,
            longitudeKey,
            labelKey,
            sizeKey,
            colorKey,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            highlighted: isHighlight
          };
          format = callbackCache.call(
            formatter,
            params
          );
        }
        marker.size = point.size;
        marker.fill = (_c = (_b = (_a2 = highlightStyle == null ? void 0 : highlightStyle.fill) != null ? _a2 : format == null ? void 0 : format.fill) != null ? _b : markerDatum.fill) != null ? _c : fill;
        marker.fillOpacity = (_e = (_d = highlightStyle == null ? void 0 : highlightStyle.fillOpacity) != null ? _d : format == null ? void 0 : format.fillOpacity) != null ? _e : fillOpacity;
        marker.stroke = (_g = (_f = highlightStyle == null ? void 0 : highlightStyle.stroke) != null ? _f : format == null ? void 0 : format.stroke) != null ? _g : stroke;
        marker.strokeWidth = (_i = (_h = highlightStyle == null ? void 0 : highlightStyle.strokeWidth) != null ? _h : format == null ? void 0 : format.strokeWidth) != null ? _i : strokeWidth;
        marker.strokeOpacity = (_k = (_j = highlightStyle == null ? void 0 : highlightStyle.strokeOpacity) != null ? _j : format == null ? void 0 : format.strokeOpacity) != null ? _k : strokeOpacity;
        marker.translationX = point.x;
        marker.translationY = point.y;
        marker.zIndex = !isHighlight && highlightedDatum != null && datum === highlightedDatum.datum ? 1 : 0;
      });
    });
  }
  onLegendItemClick(event) {
    const { legendItemName } = this.properties;
    const { enabled, itemId, series } = event;
    const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
    if (series.id === this.id || matchedLegendItemName) {
      this.toggleSeriesItem(itemId, enabled);
    }
  }
  onLegendItemDoubleClick(event) {
    const { enabled, itemId, series, numVisibleItems } = event;
    const { legendItemName } = this.properties;
    const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
    if (series.id === this.id || matchedLegendItemName) {
      this.toggleSeriesItem(itemId, true);
    } else if (enabled && numVisibleItems === 1) {
      this.toggleSeriesItem(itemId, true);
    } else {
      this.toggleSeriesItem(itemId, false);
    }
  }
  isProcessedDataAnimatable() {
    return true;
  }
  resetAnimation(phase) {
    if (phase === "initial") {
      this.animationState.transition("reset");
    } else if (phase === "ready") {
      this.animationState.transition("skip");
    }
  }
  resetAllAnimation() {
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    this.ctx.animationManager.skipCurrentBatch();
    this.labelSelection.cleanup();
    this.markerSelection.cleanup();
    this.highlightMarkerSelection.cleanup();
  }
  animateMarkers() {
    const { animationManager } = this.ctx;
    const fns = prepareMapMarkerAnimationFunctions();
    fromToMotion2(this.id, "markers", animationManager, [this.markerSelection, this.highlightMarkerSelection], fns);
  }
  getLabelData() {
    return this.contextNodeData.flatMap(({ labelData }) => labelData);
  }
  getSeriesDomain() {
    return [NaN, NaN];
  }
  pickNodeClosestDatum(p) {
    const { x: x0, y: y0 } = this.rootGroup.transformPoint(p.x, p.y);
    let minDistanceSquared = Infinity;
    let minDatum;
    this.contextNodeData[0].nodeData.forEach((datum) => {
      const { x, y, size } = datum.point;
      const dx2 = Math.max(Math.abs(x - x0) - size, 0);
      const dy2 = Math.max(Math.abs(y - y0) - size, 0);
      const distanceSquared = dx2 * dx2 + dy2 * dy2;
      if (distanceSquared < minDistanceSquared) {
        minDistanceSquared = distanceSquared;
        minDatum = datum;
      }
    });
    return minDatum != null ? { datum: minDatum, distance: Math.sqrt(minDistanceSquared) } : void 0;
  }
  getLegendData(legendType) {
    var _a2, _b, _c, _d, _e, _f;
    const { processedData, dataModel } = this;
    if (processedData == null || dataModel == null)
      return [];
    const {
      title,
      legendItemName,
      idName,
      idKey,
      colorKey,
      colorName,
      colorRange,
      visible,
      shape,
      fill,
      stroke,
      fillOpacity,
      strokeOpacity,
      strokeWidth
    } = this.properties;
    if (legendType === "gradient" && colorKey != null && colorRange != null) {
      const colorDomain = processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, "colorValue").index];
      const legendDatum = {
        legendType: "gradient",
        enabled: visible,
        seriesId: this.id,
        colorName,
        colorRange,
        colorDomain
      };
      return [legendDatum];
    } else if (legendType === "category") {
      const legendDatum = {
        legendType: "category",
        id: this.id,
        itemId: (_c = (_b = (_a2 = legendItemName != null ? legendItemName : title) != null ? _a2 : idName) != null ? _b : idKey) != null ? _c : this.id,
        seriesId: this.id,
        enabled: visible,
        label: { text: (_f = (_e = (_d = legendItemName != null ? legendItemName : title) != null ? _d : idName) != null ? _e : idKey) != null ? _f : this.id },
        marker: {
          shape,
          fill,
          fillOpacity,
          stroke,
          strokeWidth,
          strokeOpacity
        },
        legendItemName
      };
      return [legendDatum];
    } else {
      return [];
    }
  }
  getTooltipHtml(nodeDatum) {
    var _a2, _b, _c, _d;
    const {
      id: seriesId,
      processedData,
      ctx: { callbackCache },
      properties
    } = this;
    if (!processedData || !this.properties.isValid()) {
      return "";
    }
    const {
      legendItemName,
      idKey,
      idName,
      latitudeKey,
      longitudeKey,
      sizeKey,
      sizeName,
      colorKey,
      colorName,
      labelKey,
      labelName,
      formatter,
      tooltip
    } = properties;
    const { datum, fill, idValue, latValue, lonValue, sizeValue, colorValue, labelValue } = nodeDatum;
    const title = (_b = sanitizeHtml5((_a2 = properties.title) != null ? _a2 : legendItemName)) != null ? _b : "";
    const contentLines = [];
    if (idValue != null) {
      contentLines.push(sanitizeHtml5((idName != null ? `${idName}: ` : "") + idValue));
    }
    if (colorValue != null) {
      contentLines.push(sanitizeHtml5((colorName != null ? colorName : colorKey) + ": " + colorValue));
    }
    if (sizeValue != null) {
      contentLines.push(sanitizeHtml5((sizeName != null ? sizeName : sizeKey) + ": " + sizeValue));
    }
    if (labelValue != null && (idKey == null || idKey !== labelKey)) {
      contentLines.push(sanitizeHtml5((labelName != null ? labelName : labelKey) + ": " + labelValue));
    }
    if (latValue != null && lonValue != null) {
      contentLines.push(
        sanitizeHtml5(
          `${Math.abs(latValue).toFixed(4)}\xB0 ${latValue >= 0 ? "N" : "S"}, ${Math.abs(lonValue).toFixed(4)}\xB0 ${latValue >= 0 ? "W" : "E"}`
        )
      );
    }
    const content = contentLines.join("<br>");
    let format;
    if (formatter) {
      format = callbackCache.call(formatter, {
        seriesId,
        datum,
        latitudeKey,
        longitudeKey,
        fill,
        highlighted: false
      });
    }
    const color = (_d = (_c = format == null ? void 0 : format.fill) != null ? _c : fill) != null ? _d : properties.fill;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      __spreadValues({
        seriesId,
        datum,
        idKey,
        latitudeKey,
        longitudeKey,
        title,
        color
      }, this.getModuleTooltipParams())
    );
  }
};
MapMarkerSeries.className = "MapMarkerSeries";
MapMarkerSeries.type = "map-marker";
__decorateClass([
  Validate35(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapMarkerSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerModule.ts
var {
  EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS3,
  DEFAULT_LABEL_COLOUR: DEFAULT_LABEL_COLOUR2,
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE: DEFAULT_DIVERGING_SERIES_COLOUR_RANGE2,
  singleSeriesPaletteFactory: singleSeriesPaletteFactory2
} = import_ag_charts_community75._Theme;
var MapMarkerModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-marker",
  instanceConstructor: MapMarkerSeries,
  themeTemplate: {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS3,
      maxSize: 30,
      fillOpacity: 0.5,
      label: {
        color: DEFAULT_LABEL_COLOUR2
      }
    },
    legend: {
      enabled: false
    },
    gradientLegend: {
      enabled: false
    },
    tooltip: {
      range: "exact"
    }
  },
  paletteFactory: (opts) => {
    const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
    const { fill, stroke } = singleSeriesPaletteFactory2(opts);
    const { properties } = themeTemplateParameters;
    const defaultColorRange = properties.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE2);
    const { fills } = takeColors(colorsCount);
    return {
      fill,
      stroke,
      colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundModule.ts
var import_ag_charts_community78 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundSeries.ts
var import_ag_charts_community77 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundSeriesProperties.ts
var import_ag_charts_community76 = require("ag-charts-community");
var { COLOR_STRING: COLOR_STRING12, LINE_DASH: LINE_DASH9, OBJECT: OBJECT11, POSITIVE_NUMBER: POSITIVE_NUMBER15, RATIO: RATIO17, Validate: Validate36, SeriesProperties: SeriesProperties4, SeriesTooltip: SeriesTooltip8 } = import_ag_charts_community76._ModuleSupport;
var MapShapeBackgroundSeriesProperties = class extends SeriesProperties4 {
  constructor() {
    super(...arguments);
    this.topology = void 0;
    this.fill = "black";
    this.fillOpacity = 1;
    this.stroke = "black";
    this.strokeOpacity = 1;
    this.strokeWidth = 0;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.tooltip = new SeriesTooltip8();
  }
};
__decorateClass([
  Validate36(GEOJSON_OBJECT, { optional: true })
], MapShapeBackgroundSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate36(COLOR_STRING12)
], MapShapeBackgroundSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate36(RATIO17)
], MapShapeBackgroundSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate36(COLOR_STRING12)
], MapShapeBackgroundSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate36(RATIO17)
], MapShapeBackgroundSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate36(POSITIVE_NUMBER15)
], MapShapeBackgroundSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate36(LINE_DASH9)
], MapShapeBackgroundSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate36(POSITIVE_NUMBER15)
], MapShapeBackgroundSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate36(OBJECT11)
], MapShapeBackgroundSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundSeries.ts
var { createDatumId: createDatumId5, Series, SeriesNodePickMode: SeriesNodePickMode7, Validate: Validate37 } = import_ag_charts_community77._ModuleSupport;
var { Selection: Selection6, Group: Group10, PointerEvents: PointerEvents3 } = import_ag_charts_community77._Scene;
var { Logger: Logger11 } = import_ag_charts_community77._Util;
var MapShapeBackgroundSeries = class extends Series {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode7.EXACT_SHAPE_MATCH]
    });
    this.properties = new MapShapeBackgroundSeriesProperties();
    this._chartTopology = void 0;
    this.itemGroup = this.contentGroup.appendChild(new Group10({ name: "itemGroup" }));
    this.datumSelection = Selection6.select(
      this.itemGroup,
      () => this.nodeFactory()
    );
    this.contextNodeData = [];
  }
  get topology() {
    var _a2;
    return (_a2 = this.properties.topology) != null ? _a2 : this._chartTopology;
  }
  setOptionsData() {
  }
  setChartData() {
  }
  get hasData() {
    return false;
  }
  setChartTopology(topology) {
    this._chartTopology = topology;
    if (this.topology === topology) {
      this.nodeDataRefresh = true;
    }
  }
  nodeFactory() {
    const geoGeometry = new GeoGeometry();
    geoGeometry.renderMode = 1 /* Polygons */;
    geoGeometry.lineJoin = "round";
    geoGeometry.pointerEvents = PointerEvents3.None;
    return geoGeometry;
  }
  processData() {
    return __async(this, null, function* () {
      const { topology } = this;
      this.topologyBounds = topology == null ? void 0 : topology.features.reduce((current, feature) => {
        const geometry = feature.geometry;
        if (geometry == null)
          return current;
        return geometryBbox(geometry, current);
      }, void 0);
      if (topology == null) {
        Logger11.warnOnce(`no topology was provided for [MapShapeBackgroundSeries]; nothing will be rendered.`);
      }
    });
  }
  createNodeData() {
    return __async(this, null, function* () {
      const { id: seriesId, topology, scale } = this;
      if (topology == null)
        return [];
      const nodeData = [];
      const labelData = [];
      topology.features.forEach((feature, index) => {
        const { geometry } = feature;
        const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : void 0;
        if (projectedGeometry == null)
          return;
        nodeData.push({
          series: this,
          itemId: index,
          datum: feature,
          index,
          projectedGeometry
        });
      });
      return [
        {
          itemId: seriesId,
          nodeData,
          labelData
        }
      ];
    });
  }
  updateSelections() {
    return __async(this, null, function* () {
      if (this.nodeDataRefresh) {
        this.contextNodeData = yield this.createNodeData();
        this.nodeDataRefresh = false;
      }
    });
  }
  update() {
    return __async(this, null, function* () {
      const { datumSelection } = this;
      yield this.updateSelections();
      this.contentGroup.visible = this.visible;
      const { nodeData } = this.contextNodeData[0];
      this.datumSelection = yield this.updateDatumSelection({ nodeData, datumSelection });
      yield this.updateDatumNodes({ datumSelection });
    });
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId5(datum.index));
    });
  }
  updateDatumNodes(opts) {
    return __async(this, null, function* () {
      const { properties } = this;
      const { datumSelection } = opts;
      const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = properties;
      const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
      datumSelection.each((geoGeometry, datum) => {
        const { projectedGeometry } = datum;
        if (projectedGeometry == null) {
          geoGeometry.visible = false;
          geoGeometry.projectedGeometry = void 0;
          return;
        }
        geoGeometry.visible = true;
        geoGeometry.projectedGeometry = projectedGeometry;
        geoGeometry.fill = fill;
        geoGeometry.fillOpacity = fillOpacity;
        geoGeometry.stroke = stroke;
        geoGeometry.strokeWidth = strokeWidth;
        geoGeometry.strokeOpacity = strokeOpacity;
        geoGeometry.lineDash = lineDash;
        geoGeometry.lineDashOffset = lineDashOffset;
      });
    });
  }
  resetAnimation() {
  }
  getLabelData() {
    return [];
  }
  getSeriesDomain() {
    return [NaN, NaN];
  }
  getLegendData() {
    return [];
  }
  getTooltipHtml() {
    return "";
  }
};
MapShapeBackgroundSeries.className = "MapShapeBackgroundSeries";
MapShapeBackgroundSeries.type = "map-shape-background";
__decorateClass([
  Validate37(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapShapeBackgroundSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundModule.ts
var { DEFAULT_BACKGROUND_COLOUR, DEFAULT_HIERARCHY_FILLS } = import_ag_charts_community78._Theme;
var MapShapeBackgroundModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-shape-background",
  instanceConstructor: MapShapeBackgroundSeries,
  themeTemplate: {
    series: {
      stroke: DEFAULT_BACKGROUND_COLOUR,
      strokeWidth: 1
    },
    legend: {
      enabled: false
    },
    gradientLegend: {
      enabled: false
    },
    tooltip: {
      range: "exact"
    }
  },
  paletteFactory: ({ themeTemplateParameters }) => {
    var _a2;
    const { properties } = themeTemplateParameters;
    return {
      fill: (_a2 = properties.get(DEFAULT_HIERARCHY_FILLS)) == null ? void 0 : _a2[1]
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeModule.ts
var import_ag_charts_community81 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeSeries.ts
var import_ag_charts_community80 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-util/polygonLabelUtil.ts
function preferredLabelCenter(polygons, { aspectRatio, precision }) {
  const result = polygonPointSearch(polygons, precision, (p, cx, cy, stride) => {
    const width = maxWidthOfRectConstrainedByCenterAndAspectRatioToPolygon(p, cx, cy, aspectRatio);
    const maxWidth2 = width + 2 * stride * aspectRatio;
    const distance2 = width * Math.SQRT2;
    const maxDistance = maxWidth2 * Math.SQRT2;
    return { distance: distance2, maxDistance };
  });
  if (result == null)
    return;
  const { x, y, distance } = result;
  const maxWidth = distance / Math.SQRT2;
  return { x, y, maxWidth };
}
function maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment(a, b, cx, cy, aspectRatio) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const positiveM = 1 / aspectRatio;
  const abx = bx - ax;
  const aby = by - ay;
  const [topPointX, topPointY] = ay <= by ? a : b;
  const [leftPointX, leftPointY] = ax <= bx ? a : b;
  const [bottomPointX, bottomPointY] = ay <= by ? b : a;
  const [rightPointX, rightPointY] = ax <= bx ? b : a;
  let maxWidth = Infinity;
  if (abx !== 0) {
    const abm = aby / abx;
    for (let i = 0; i <= 1; i += 1) {
      const m = i === 0 ? positiveM : -positiveM;
      const x = (abm * ax - ay - m * cx + cy) / (abm - m);
      if (x >= leftPointX && x <= rightPointX) {
        const width = Math.abs(cx - x) * 2;
        maxWidth = Math.min(maxWidth, width);
      }
    }
  } else {
    for (let i = 0; i <= 1; i += 1) {
      const m = i === 0 ? positiveM : -positiveM;
      const y = m * (ax - cx) + cy;
      if (y >= topPointY && y <= bottomPointY) {
        const height = Math.abs(cy - y) * 2;
        const width = height * aspectRatio;
        maxWidth = Math.min(maxWidth, width);
      }
    }
  }
  const positiveMRecip = aspectRatio;
  const centerToTopMRecip = Math.abs((topPointX - cx) / (topPointY - cy));
  const centerToBottomMRecip = Math.abs((bottomPointX - cx) / (bottomPointY - cy));
  if (bottomPointY < cy && centerToBottomMRecip < positiveMRecip) {
    const height = Math.abs(cy - bottomPointY) * 2;
    const width = height * aspectRatio;
    maxWidth = Math.min(maxWidth, width);
  } else if (topPointY > cy && centerToTopMRecip < positiveMRecip) {
    const height = Math.abs(cy - topPointY) * 2;
    const width = height * aspectRatio;
    maxWidth = Math.min(maxWidth, width);
  }
  const centerToLeftM = Math.abs((leftPointY - cy) / (leftPointX - cx));
  const centerToRightM = Math.abs((rightPointY - cy) / (rightPointX - cx));
  if (rightPointX < cx && centerToRightM < positiveM) {
    const width = Math.abs(cx - rightPointX) * 2;
    maxWidth = Math.min(maxWidth, width);
  } else if (leftPointX > cx && centerToLeftM < positiveM) {
    const width = Math.abs(cx - leftPointX) * 2;
    maxWidth = Math.min(maxWidth, width);
  }
  return maxWidth;
}
function maxWidthOfRectConstrainedByCenterAndAspectRatioToPolygon(polygons, cx, cy, aspectRatio) {
  let inside = false;
  let minWidth = Infinity;
  for (const polygon of polygons) {
    let p0 = polygon[polygon.length - 1];
    let [x0, y0] = p0;
    for (const p1 of polygon) {
      const [x1, y1] = p1;
      if (y1 > cy !== y0 > cy && cx < (x0 - x1) * (cy - y1) / (y0 - y1) + x1) {
        inside = !inside;
      }
      const width = maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment(p0, p1, cx, cy, aspectRatio);
      minWidth = Math.min(minWidth, width);
      p0 = p1;
      x0 = x1;
      y0 = y1;
    }
  }
  return (inside ? 1 : -1) * minWidth;
}
function applyX(into, cx, x) {
  if (x >= cx) {
    into.maxX = Math.min(into.maxX, x - cx);
  }
  if (x <= cx) {
    into.minX = Math.max(into.minX, x - cx);
  }
}
function xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(into, a, b, cx, cy, height) {
  const ry0 = cy - height / 2;
  const ry1 = cy + height / 2;
  const [ax, ay] = a;
  const [bx, by] = b;
  const abx = bx - ax;
  const aby = by - ay;
  const [leftPointX, leftPointY] = ax <= bx ? a : b;
  const [rightPointX, rightPointY] = ax <= bx ? b : a;
  if (abx !== 0) {
    const abm = aby / abx;
    for (let i = 0; i <= 1; i += 1) {
      const y = i === 0 ? ry0 : ry1;
      const x = (y - ay) / abm + ax;
      if (x >= leftPointX && x <= rightPointX) {
        applyX(into, cx, x);
      }
    }
  } else if (Math.max(ry0, Math.min(ay, by)) <= Math.min(ry1, Math.max(ay, by))) {
    applyX(into, cx, ax);
  }
  if (rightPointX < cx && rightPointY >= ry0 && rightPointY <= ry1) {
    applyX(into, cx, rightPointX);
  } else if (leftPointX > cx && leftPointY >= ry0 && leftPointY <= ry1) {
    applyX(into, cx, leftPointX);
  }
  return into;
}
function maxWidthInPolygonForRectOfHeight(polygons, cx, cy, height) {
  const result = {
    minX: -Infinity,
    maxX: Infinity
  };
  for (const polygon of polygons) {
    let p0 = polygon[polygon.length - 1];
    for (const p1 of polygon) {
      xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(result, p0, p1, cx, cy, height);
      p0 = p1;
    }
  }
  const { minX, maxX } = result;
  if (Number.isFinite(minX) && Number.isFinite(maxX)) {
    return { x: cx + (minX + maxX) / 2, width: maxX - minX };
  } else {
    return { x: cx, width: 0 };
  }
}

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeSeriesProperties.ts
var import_ag_charts_community79 = require("ag-charts-community");
var {
  AND: AND10,
  ARRAY: ARRAY6,
  COLOR_STRING: COLOR_STRING13,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY4,
  FUNCTION: FUNCTION9,
  LINE_DASH: LINE_DASH10,
  OBJECT: OBJECT12,
  POSITIVE_NUMBER: POSITIVE_NUMBER16,
  RATIO: RATIO18,
  STRING: STRING11,
  Validate: Validate38,
  SeriesProperties: SeriesProperties5,
  SeriesTooltip: SeriesTooltip9
} = import_ag_charts_community79._ModuleSupport;
var MapShapeSeriesProperties = class extends SeriesProperties5 {
  constructor() {
    super(...arguments);
    this.topology = void 0;
    this.idKey = "";
    this.idName = void 0;
    this.topologyIdKey = "name";
    this.labelKey = void 0;
    this.labelName = void 0;
    this.colorRange = void 0;
    this.fill = "black";
    this.fillOpacity = 1;
    this.stroke = "black";
    this.strokeOpacity = 1;
    this.strokeWidth = 0;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.padding = 0;
    this.label = new AutoSizeableSecondaryLabel();
    this.tooltip = new SeriesTooltip9();
  }
};
__decorateClass([
  Validate38(GEOJSON_OBJECT, { optional: true })
], MapShapeSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate38(STRING11, { optional: true })
], MapShapeSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate38(STRING11, { optional: true })
], MapShapeSeriesProperties.prototype, "legendItemName", 2);
__decorateClass([
  Validate38(STRING11)
], MapShapeSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate38(STRING11, { optional: true })
], MapShapeSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate38(STRING11)
], MapShapeSeriesProperties.prototype, "topologyIdKey", 2);
__decorateClass([
  Validate38(STRING11, { optional: true })
], MapShapeSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate38(STRING11, { optional: true })
], MapShapeSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate38(STRING11, { optional: true })
], MapShapeSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate38(STRING11, { optional: true })
], MapShapeSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate38(AND10(COLOR_STRING_ARRAY4, ARRAY6.restrict({ minLength: 1 })), { optional: true })
], MapShapeSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate38(COLOR_STRING13)
], MapShapeSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate38(RATIO18)
], MapShapeSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate38(COLOR_STRING13)
], MapShapeSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate38(RATIO18)
], MapShapeSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate38(POSITIVE_NUMBER16)
], MapShapeSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate38(LINE_DASH10)
], MapShapeSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate38(POSITIVE_NUMBER16)
], MapShapeSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate38(POSITIVE_NUMBER16)
], MapShapeSeriesProperties.prototype, "padding", 2);
__decorateClass([
  Validate38(FUNCTION9, { optional: true })
], MapShapeSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate38(OBJECT12)
], MapShapeSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate38(OBJECT12)
], MapShapeSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeSeries.ts
var { getMissCount: getMissCount4, createDatumId: createDatumId6, DataModelSeries: DataModelSeries4, SeriesNodePickMode: SeriesNodePickMode8, valueProperty: valueProperty8, Validate: Validate39 } = import_ag_charts_community80._ModuleSupport;
var { ColorScale: ColorScale4 } = import_ag_charts_community80._Scale;
var { Group: Group11, Selection: Selection7, Text: Text8, PointerEvents: PointerEvents4 } = import_ag_charts_community80._Scene;
var { sanitizeHtml: sanitizeHtml6, Logger: Logger12 } = import_ag_charts_community80._Util;
var fixedScale = import_ag_charts_community80._ModuleSupport.MercatorScale.fixedScale();
var MapShapeSeries = class extends DataModelSeries4 {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode8.EXACT_SHAPE_MATCH, SeriesNodePickMode8.NEAREST_NODE]
    });
    this.properties = new MapShapeSeriesProperties();
    this._chartTopology = void 0;
    this.colorScale = new ColorScale4();
    this.itemGroup = this.contentGroup.appendChild(new Group11({ name: "itemGroup" }));
    this.itemLabelGroup = this.contentGroup.appendChild(new Group11({ name: "itemLabelGroup" }));
    this.datumSelection = Selection7.select(
      this.itemGroup,
      () => this.nodeFactory()
    );
    this.labelSelection = Selection7.select(
      this.itemLabelGroup,
      Text8
    );
    this.highlightDatumSelection = Selection7.select(
      this.highlightGroup,
      () => this.nodeFactory()
    );
    this.contextNodeData = [];
    this.previousLabelLayouts = void 0;
    this._previousDatumMidPoint = void 0;
    this.itemLabelGroup.pointerEvents = PointerEvents4.None;
  }
  get topology() {
    var _a2;
    return (_a2 = this.properties.topology) != null ? _a2 : this._chartTopology;
  }
  get hasData() {
    return super.hasData && this.topology != null;
  }
  setChartTopology(topology) {
    this._chartTopology = topology;
    if (this.topology === topology) {
      this.nodeDataRefresh = true;
    }
  }
  addChartEventListeners() {
    this.destroyFns.push(
      this.ctx.chartEventManager.addListener("legend-item-click", (event) => {
        this.onLegendItemClick(event);
      }),
      this.ctx.chartEventManager.addListener("legend-item-double-click", (event) => {
        this.onLegendItemDoubleClick(event);
      })
    );
  }
  isLabelEnabled() {
    return this.properties.labelKey != null && this.properties.label.enabled;
  }
  nodeFactory() {
    const geoGeometry = new GeoGeometry();
    geoGeometry.renderMode = 1 /* Polygons */;
    geoGeometry.lineJoin = "round";
    return geoGeometry;
  }
  processData(dataController) {
    return __async(this, null, function* () {
      if (this.data == null || !this.properties.isValid()) {
        return;
      }
      const { data, topology, colorScale } = this;
      const { topologyIdKey, idKey, colorKey, labelKey, colorRange } = this.properties;
      const featureById = /* @__PURE__ */ new Map();
      topology == null ? void 0 : topology.features.forEach((feature) => {
        var _a2;
        const property = (_a2 = feature.properties) == null ? void 0 : _a2[topologyIdKey];
        if (property == null || !containsType(feature.geometry, 1 /* Polygon */))
          return;
        featureById.set(property, feature);
      });
      const { dataModel, processedData } = yield this.requestDataModel(dataController, data, {
        props: [
          valueProperty8(this, idKey, false, { id: "idValue", includeProperty: false }),
          valueProperty8(this, idKey, false, {
            id: "featureValue",
            includeProperty: false,
            processor: () => (datum) => featureById.get(datum)
          }),
          ...labelKey ? [valueProperty8(this, labelKey, false, { id: "labelValue" })] : [],
          ...colorKey ? [valueProperty8(this, colorKey, true, { id: "colorValue" })] : []
        ]
      });
      const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`).index;
      this.topologyBounds = processedData.data.reduce(
        (current, { values }) => {
          const feature = values[featureIdx];
          const geometry = feature == null ? void 0 : feature.geometry;
          if (geometry == null)
            return current;
          return geometryBbox(geometry, current);
        },
        void 0
      );
      if (colorRange != null && this.isColorScaleValid()) {
        const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue").index;
        colorScale.domain = processedData.domain.values[colorKeyIdx];
        colorScale.range = colorRange;
        colorScale.update();
      }
      if (topology == null) {
        Logger12.warnOnce(`no topology was provided for [MapShapeSeries]; nothing will be rendered.`);
      }
    });
  }
  isColorScaleValid() {
    const { colorKey } = this.properties;
    if (!colorKey) {
      return false;
    }
    const { dataModel, processedData } = this;
    if (!dataModel || !processedData) {
      return false;
    }
    const colorIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue").index;
    const dataCount = processedData.data.length;
    const missCount = getMissCount4(this, processedData.defs.values[colorIdx].missing);
    const colorDataMissing = dataCount === 0 || dataCount === missCount;
    return !colorDataMissing;
  }
  getLabelLayout(datum, labelValue, font, geometry, previousLabelLayout) {
    if (labelValue == null || geometry == null)
      return;
    const { idKey, idName, colorKey, colorName, labelKey, labelName, padding, label } = this.properties;
    const labelText = this.getLabelText(label, {
      value: labelValue,
      datum,
      idKey,
      idName,
      colorKey,
      colorName,
      labelKey,
      labelName
    });
    if (labelText == null)
      return;
    const baseSize = Text8.getTextSize(String(labelText), font);
    const numLines = labelText.split("\n").length;
    const aspectRatio = (baseSize.width + 2 * padding) / (numLines * AutoSizedLabel.lineHeight(label.fontSize) + 2 * padding);
    if ((previousLabelLayout == null ? void 0 : previousLabelLayout.geometry) === geometry && (previousLabelLayout == null ? void 0 : previousLabelLayout.labelText) === labelText && (previousLabelLayout == null ? void 0 : previousLabelLayout.aspectRatio) === aspectRatio) {
      return previousLabelLayout;
    }
    const fixedGeometry = projectGeometry(geometry, fixedScale);
    const fixedPolygon = largestPolygon(fixedGeometry);
    if (fixedPolygon == null)
      return;
    const labelPlacement = preferredLabelCenter(fixedPolygon, {
      aspectRatio,
      precision: 1e-3
    });
    if (labelPlacement == null)
      return;
    const { x, y, maxWidth } = labelPlacement;
    return { geometry, labelText, aspectRatio, x, y, maxWidth, fixedPolygon };
  }
  getLabelDatum(labelLayout, scale, originX, originY) {
    const { padding, label } = this.properties;
    const { labelText, aspectRatio, x: untruncatedX, y, maxWidth, fixedPolygon } = labelLayout;
    const maxSizeWithoutTruncation = {
      width: Math.ceil(maxWidth * scale),
      height: Math.ceil(maxWidth * scale / aspectRatio),
      meta: untruncatedX
    };
    const labelFormatting = formatSingleLabel(
      labelText,
      label,
      { padding },
      (height, allowTruncation) => {
        if (!allowTruncation)
          return maxSizeWithoutTruncation;
        const result = maxWidthInPolygonForRectOfHeight(fixedPolygon, untruncatedX, y, height / scale);
        return {
          width: result.width * scale,
          height,
          meta: result.x
        };
      }
    );
    if (labelFormatting == null)
      return;
    const [{ text, fontSize, lineHeight, width }, formattingX] = labelFormatting;
    if (text === Text8.ellipsis)
      return;
    const x = width > maxSizeWithoutTruncation.width ? untruncatedX : formattingX;
    return {
      x: x * scale - originX,
      y: y * scale - originY,
      text,
      fontSize,
      lineHeight
    };
  }
  createNodeData() {
    return __async(this, null, function* () {
      const { id: seriesId, dataModel, processedData, colorScale, properties, scale, previousLabelLayouts } = this;
      const { idKey, colorKey, labelKey, label, fill: fillProperty } = properties;
      if (dataModel == null || processedData == null)
        return [];
      const colorScaleValid = this.isColorScaleValid();
      const idIdx = dataModel.resolveProcessedDataIndexById(this, `idValue`).index;
      const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`).index;
      const labelIdx = labelKey != null ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : void 0;
      const colorIdx = colorKey != null ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : void 0;
      const font = label.getFont();
      const labelLayouts = /* @__PURE__ */ new Map();
      this.previousLabelLayouts = labelLayouts;
      const nodeData = [];
      const labelData = [];
      const missingGeometries = [];
      processedData.data.forEach(({ datum, values }) => {
        var _a2;
        const idValue = values[idIdx];
        const colorValue = colorIdx != null ? values[colorIdx] : void 0;
        const labelValue = labelIdx != null ? values[labelIdx] : void 0;
        const geometry = (_a2 = values[featureIdx]) == null ? void 0 : _a2.geometry;
        if (geometry == null) {
          missingGeometries.push(idValue);
        }
        const color = colorScaleValid && colorValue != null ? colorScale.convert(colorValue) : void 0;
        const labelLayout = this.getLabelLayout(
          datum,
          labelValue,
          font,
          geometry,
          previousLabelLayouts == null ? void 0 : previousLabelLayouts.get(idValue)
        );
        if (labelLayout != null) {
          labelLayouts.set(idValue, labelLayout);
        }
        const labelDatum = labelLayout != null && scale != null ? this.getLabelDatum(labelLayout, scale.scale / fixedScale.scale, scale.originX, scale.originY) : void 0;
        if (labelDatum != null) {
          labelData.push(labelDatum);
        }
        const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : void 0;
        nodeData.push({
          series: this,
          itemId: idKey,
          datum,
          idValue,
          colorValue,
          labelValue,
          fill: color != null ? color : fillProperty,
          projectedGeometry
        });
      });
      const missingGeometriesCap = 10;
      if (missingGeometries.length > missingGeometriesCap) {
        const excessItems = missingGeometries.length - missingGeometriesCap;
        missingGeometries.length = missingGeometriesCap;
        missingGeometries.push(`(+${excessItems} more)`);
      }
      if (missingGeometries.length > 0) {
        Logger12.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
      }
      return [
        {
          itemId: seriesId,
          nodeData,
          labelData
        }
      ];
    });
  }
  updateSelections() {
    return __async(this, null, function* () {
      if (this.nodeDataRefresh) {
        this.contextNodeData = yield this.createNodeData();
        this.nodeDataRefresh = false;
      }
    });
  }
  update() {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d, _e;
      const { datumSelection, labelSelection, highlightDatumSelection } = this;
      yield this.updateSelections();
      this.contentGroup.visible = this.visible;
      this.contentGroup.opacity = this.getOpacity();
      let highlightedDatum = (_a2 = this.ctx.highlightManager) == null ? void 0 : _a2.getActiveHighlight();
      if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
        highlightedDatum = void 0;
      }
      const nodeData = (_c = (_b = this.contextNodeData[0]) == null ? void 0 : _b.nodeData) != null ? _c : [];
      const labelData = (_e = (_d = this.contextNodeData[0]) == null ? void 0 : _d.labelData) != null ? _e : [];
      this.datumSelection = yield this.updateDatumSelection({ nodeData, datumSelection });
      yield this.updateDatumNodes({ datumSelection, isHighlight: false });
      this.labelSelection = yield this.updateLabelSelection({ labelData, labelSelection });
      yield this.updateLabelNodes({ labelSelection });
      this.highlightDatumSelection = yield this.updateDatumSelection({
        nodeData: highlightedDatum != null ? [highlightedDatum] : [],
        datumSelection: highlightDatumSelection
      });
      yield this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
    });
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId6(datum.idValue));
    });
  }
  updateDatumNodes(opts) {
    return __async(this, null, function* () {
      const {
        id: seriesId,
        properties,
        ctx: { callbackCache }
      } = this;
      const { datumSelection, isHighlight } = opts;
      const { idKey, colorKey, labelKey, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset, formatter } = properties;
      const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
      const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
      datumSelection.each((geoGeometry, datum) => {
        var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
        const { projectedGeometry } = datum;
        if (projectedGeometry == null) {
          geoGeometry.visible = false;
          geoGeometry.projectedGeometry = void 0;
          return;
        }
        let format;
        if (formatter != null) {
          const params = {
            seriesId,
            datum: datum.datum,
            itemId: datum.itemId,
            idKey,
            colorKey,
            labelKey,
            fill: datum.fill,
            fillOpacity,
            strokeOpacity,
            stroke,
            strokeWidth,
            lineDash,
            lineDashOffset,
            highlighted: isHighlight
          };
          format = callbackCache.call(formatter, params);
        }
        geoGeometry.visible = true;
        geoGeometry.projectedGeometry = projectedGeometry;
        geoGeometry.fill = (_b = (_a2 = highlightStyle == null ? void 0 : highlightStyle.fill) != null ? _a2 : format == null ? void 0 : format.fill) != null ? _b : datum.fill;
        geoGeometry.fillOpacity = (_d = (_c = highlightStyle == null ? void 0 : highlightStyle.fillOpacity) != null ? _c : format == null ? void 0 : format.fillOpacity) != null ? _d : fillOpacity;
        geoGeometry.stroke = (_f = (_e = highlightStyle == null ? void 0 : highlightStyle.stroke) != null ? _e : format == null ? void 0 : format.stroke) != null ? _f : stroke;
        geoGeometry.strokeWidth = (_h = (_g = highlightStyle == null ? void 0 : highlightStyle.strokeWidth) != null ? _g : format == null ? void 0 : format.strokeWidth) != null ? _h : strokeWidth;
        geoGeometry.strokeOpacity = (_j = (_i = highlightStyle == null ? void 0 : highlightStyle.strokeOpacity) != null ? _i : format == null ? void 0 : format.strokeOpacity) != null ? _j : strokeOpacity;
        geoGeometry.lineDash = (_l = (_k = highlightStyle == null ? void 0 : highlightStyle.lineDash) != null ? _k : format == null ? void 0 : format.lineDash) != null ? _l : lineDash;
        geoGeometry.lineDashOffset = (_n = (_m = highlightStyle == null ? void 0 : highlightStyle.lineDashOffset) != null ? _m : format == null ? void 0 : format.lineDashOffset) != null ? _n : lineDashOffset;
      });
    });
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      const labels = this.isLabelEnabled() ? opts.labelData : [];
      return opts.labelSelection.update(labels);
    });
  }
  updateLabelNodes(opts) {
    return __async(this, null, function* () {
      const { labelSelection } = opts;
      const { color: fill, fontStyle, fontWeight, fontFamily } = this.properties.label;
      labelSelection.each((label, { x, y, text, fontSize, lineHeight }) => {
        label.visible = true;
        label.x = x;
        label.y = y;
        label.text = text;
        label.fill = fill;
        label.fontStyle = fontStyle;
        label.fontWeight = fontWeight;
        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.fontFamily = fontFamily;
        label.textAlign = "center";
        label.textBaseline = "middle";
      });
    });
  }
  onLegendItemClick(event) {
    const { legendItemName } = this.properties;
    const { enabled, itemId, series } = event;
    const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
    if (series.id === this.id || matchedLegendItemName) {
      this.toggleSeriesItem(itemId, enabled);
    }
  }
  onLegendItemDoubleClick(event) {
    const { enabled, itemId, series, numVisibleItems } = event;
    const { legendItemName } = this.properties;
    const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
    if (series.id === this.id || matchedLegendItemName) {
      this.toggleSeriesItem(itemId, true);
    } else if (enabled && numVisibleItems === 1) {
      this.toggleSeriesItem(itemId, true);
    } else {
      this.toggleSeriesItem(itemId, false);
    }
  }
  resetAnimation() {
  }
  getLabelData() {
    return [];
  }
  getSeriesDomain() {
    return [NaN, NaN];
  }
  pickNodeClosestDatum({ x, y }) {
    let minDistance = Infinity;
    let minDatum;
    this.datumSelection.each((node, datum) => {
      const distance = node.distanceToPoint(x, y);
      if (distance < minDistance) {
        minDistance = distance;
        minDatum = datum;
      }
    });
    return minDatum != null ? { datum: minDatum, distance: minDistance } : void 0;
  }
  datumMidPoint(datum) {
    const { _previousDatumMidPoint } = this;
    if ((_previousDatumMidPoint == null ? void 0 : _previousDatumMidPoint.datum) === datum) {
      return _previousDatumMidPoint.point;
    }
    const projectedGeometry = datum.projectedGeometry;
    const polygon = projectedGeometry != null ? largestPolygon(projectedGeometry) : void 0;
    const center = polygon != null ? polygonMarkerCenter(polygon, 2) : void 0;
    const point = center != null ? { x: center[0], y: center[1] } : void 0;
    this._previousDatumMidPoint = { datum, point };
    return point;
  }
  getLegendData(legendType) {
    var _a2, _b, _c, _d;
    const { processedData, dataModel } = this;
    if (processedData == null || dataModel == null)
      return [];
    const {
      title,
      legendItemName,
      idKey,
      idName,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      colorKey,
      colorName,
      colorRange,
      visible
    } = this.properties;
    if (legendType === "gradient" && colorKey != null && colorRange != null) {
      const colorDomain = processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, "colorValue").index];
      const legendDatum = {
        legendType: "gradient",
        enabled: visible,
        seriesId: this.id,
        colorName,
        colorRange,
        colorDomain
      };
      return [legendDatum];
    } else if (legendType === "category") {
      const legendDatum = {
        legendType: "category",
        id: this.id,
        itemId: (_b = (_a2 = legendItemName != null ? legendItemName : title) != null ? _a2 : idName) != null ? _b : idKey,
        seriesId: this.id,
        enabled: visible,
        label: { text: (_d = (_c = legendItemName != null ? legendItemName : title) != null ? _c : idName) != null ? _d : idKey },
        marker: {
          fill,
          fillOpacity,
          stroke,
          strokeWidth,
          strokeOpacity
        },
        legendItemName
      };
      return [legendDatum];
    } else {
      return [];
    }
  }
  getTooltipHtml(nodeDatum) {
    var _a2, _b, _c;
    const {
      id: seriesId,
      processedData,
      ctx: { callbackCache },
      properties
    } = this;
    if (!processedData || !properties.isValid()) {
      return "";
    }
    const {
      legendItemName,
      idKey,
      idName,
      colorKey,
      colorName,
      labelKey,
      labelName,
      stroke,
      strokeWidth,
      formatter,
      tooltip
    } = properties;
    const { datum, fill, idValue, colorValue, labelValue } = nodeDatum;
    const title = (_b = sanitizeHtml6((_a2 = properties.title) != null ? _a2 : legendItemName)) != null ? _b : "";
    const contentLines = [];
    contentLines.push(sanitizeHtml6((idName != null ? `${idName}: ` : "") + idValue));
    if (colorValue != null) {
      contentLines.push(sanitizeHtml6((colorName != null ? colorName : colorKey) + ": " + colorValue));
    }
    if (labelValue != null && labelKey !== idKey) {
      contentLines.push(sanitizeHtml6((labelName != null ? labelName : labelKey) + ": " + labelValue));
    }
    const content = contentLines.join("<br>");
    let format;
    if (formatter) {
      format = callbackCache.call(formatter, {
        seriesId,
        datum,
        idKey,
        fill,
        stroke,
        strokeWidth: this.getStrokeWidth(strokeWidth),
        highlighted: false
      });
    }
    const color = (_c = format == null ? void 0 : format.fill) != null ? _c : fill;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      __spreadValues({
        seriesId,
        datum,
        idKey,
        title,
        color
      }, this.getModuleTooltipParams())
    );
  }
};
MapShapeSeries.className = "MapShapeSeries";
MapShapeSeries.type = "map-shape";
__decorateClass([
  Validate39(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapShapeSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeModule.ts
var {
  EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS4,
  DEFAULT_INVERTED_LABEL_COLOUR,
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE: DEFAULT_DIVERGING_SERIES_COLOUR_RANGE3,
  DEFAULT_BACKGROUND_COLOUR: DEFAULT_BACKGROUND_COLOUR2,
  singleSeriesPaletteFactory: singleSeriesPaletteFactory3
} = import_ag_charts_community81._Theme;
var MapShapeModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-shape",
  instanceConstructor: MapShapeSeries,
  themeTemplate: {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS4,
      fillOpacity: 1,
      strokeWidth: 1,
      lineDash: [0],
      lineDashOffset: 0,
      padding: 2,
      label: {
        color: DEFAULT_INVERTED_LABEL_COLOUR,
        fontWeight: "bold",
        overflowStrategy: "hide"
      }
    },
    legend: {
      enabled: false
    },
    gradientLegend: {
      enabled: false
    },
    tooltip: {
      range: "exact"
    }
  },
  paletteFactory: (opts) => {
    const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
    const { fill } = singleSeriesPaletteFactory3(opts);
    const { properties } = themeTemplateParameters;
    const defaultColorRange = properties.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE3);
    const { fills } = takeColors(colorsCount);
    return {
      fill,
      stroke: properties.get(DEFAULT_BACKGROUND_COLOUR2),
      colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange
    };
  }
};

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleModule.ts
var import_ag_charts_community88 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleSeries.ts
var import_ag_charts_community86 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesBase.ts
var import_ag_charts_community82 = require("ag-charts-community");
var {
  isDefined: isDefined3,
  ChartAxisDirection: ChartAxisDirection11,
  PolarAxis,
  diff: diff4,
  fixNumericExtent: fixNumericExtent4,
  groupAccumulativeValueProperty: groupAccumulativeValueProperty2,
  keyProperty: keyProperty4,
  normaliseGroupTo,
  resetLabelFn,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation2,
  seriesLabelFadeOutAnimation,
  valueProperty: valueProperty9,
  animationValidation: animationValidation4
} = import_ag_charts_community82._ModuleSupport;
var { BandScale: BandScale3 } = import_ag_charts_community82._Scale;
var { motion: motion3 } = import_ag_charts_community82._Scene;
var { isNumber, normalizeAngle360: normalizeAngle3605, sanitizeHtml: sanitizeHtml7 } = import_ag_charts_community82._Util;
var RadialColumnSeriesNodeEvent = class extends import_ag_charts_community82._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadialColumnSeriesBase = class extends import_ag_charts_community82._ModuleSupport.PolarSeries {
  constructor(moduleCtx, {
    animationResetFns
  }) {
    super({
      moduleCtx,
      useLabelLayer: true,
      canHaveAxes: true,
      animationResetFns: __spreadProps(__spreadValues({}, animationResetFns), {
        label: resetLabelFn
      })
    });
    this.NodeEvent = RadialColumnSeriesNodeEvent;
    this.nodeData = [];
    this.groupScale = new BandScale3();
    this.circleCache = { r: 0, cx: 0, cy: 0 };
  }
  addChartEventListeners() {
    var _a2, _b;
    this.destroyFns.push(
      (_a2 = this.ctx.chartEventManager) == null ? void 0 : _a2.addListener("legend-item-click", (event) => this.onLegendItemClick(event)),
      (_b = this.ctx.chartEventManager) == null ? void 0 : _b.addListener(
        "legend-item-double-click",
        (event) => this.onLegendItemDoubleClick(event)
      )
    );
  }
  getSeriesDomain(direction) {
    const { axes, dataModel, processedData } = this;
    if (!processedData || !dataModel)
      return [];
    if (direction === ChartAxisDirection11.X) {
      return dataModel.getDomain(this, "angleValue", "key", processedData);
    } else {
      const radiusAxis = axes[ChartAxisDirection11.Y];
      const yExtent = dataModel.getDomain(this, "radiusValue-end", "value", processedData);
      const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
      return fixNumericExtent4(fixedYExtent, radiusAxis);
    }
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2;
      if (!this.properties.isValid()) {
        return;
      }
      const stackGroupId = this.getStackId();
      const stackGroupTrailingId = `${stackGroupId}-trailing`;
      const { angleKey, radiusKey, normalizedTo, visible } = this.properties;
      const extraProps = [];
      if (isDefined3(normalizedTo)) {
        extraProps.push(
          normaliseGroupTo(this, [stackGroupId, stackGroupTrailingId], Math.abs(normalizedTo), "range")
        );
      }
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      if (animationEnabled && this.processedData) {
        extraProps.push(diff4(this.processedData));
      }
      if (animationEnabled) {
        extraProps.push(animationValidation4(this));
      }
      const visibleProps = visible || !animationEnabled ? {} : { forceValue: 0 };
      yield this.requestDataModel(dataController, (_a2 = this.data) != null ? _a2 : [], {
        props: [
          keyProperty4(this, angleKey, false, { id: "angleValue" }),
          valueProperty9(this, radiusKey, true, __spreadValues({
            id: "radiusValue-raw",
            invalidValue: null
          }, visibleProps)),
          ...groupAccumulativeValueProperty2(this, radiusKey, true, "normal", "current", __spreadValues({
            id: `radiusValue-end`,
            invalidValue: null,
            groupId: stackGroupId
          }, visibleProps)),
          ...groupAccumulativeValueProperty2(this, radiusKey, true, "trailing", "current", __spreadValues({
            id: `radiusValue-start`,
            invalidValue: null,
            groupId: stackGroupTrailingId
          }, visibleProps)),
          ...extraProps
        ],
        dataVisible: visible || animationEnabled
      });
      this.animationState.transition("updateData");
    });
  }
  didCircleChange() {
    const r = this.radius;
    const cx = this.centerX;
    const cy = this.centerY;
    const cache = this.circleCache;
    if (!(r === cache.r && cx === cache.cx && cy === cache.cy)) {
      this.circleCache = { r, cx, cy };
      return true;
    }
    return false;
  }
  isRadiusAxisReversed() {
    var _a2;
    return (_a2 = this.axes[ChartAxisDirection11.Y]) == null ? void 0 : _a2.isReversed();
  }
  maybeRefreshNodeData() {
    return __async(this, null, function* () {
      const circleChanged = this.didCircleChange();
      if (!circleChanged && !this.nodeDataRefresh)
        return;
      const [{ nodeData = [] } = {}] = yield this.createNodeData();
      this.nodeData = nodeData;
      this.nodeDataRefresh = false;
    });
  }
  getAxisInnerRadius() {
    const radiusAxis = this.axes[ChartAxisDirection11.Y];
    return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2;
      const { processedData, dataModel, groupScale } = this;
      if (!processedData || !dataModel || !this.properties.isValid()) {
        return [];
      }
      const angleAxis = this.axes[ChartAxisDirection11.X];
      const radiusAxis = this.axes[ChartAxisDirection11.Y];
      const angleScale = angleAxis == null ? void 0 : angleAxis.scale;
      const radiusScale = radiusAxis == null ? void 0 : radiusAxis.scale;
      if (!angleScale || !radiusScale) {
        return [];
      }
      const radiusStartIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-start`).index;
      const radiusEndIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-end`).index;
      const radiusRawIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-raw`).index;
      let groupPaddingInner = 0;
      let groupPaddingOuter = 0;
      if (angleAxis instanceof AngleCategoryAxis) {
        groupPaddingInner = angleAxis.groupPaddingInner;
        groupPaddingOuter = angleAxis.paddingInner;
      }
      const groupAngleStep = (_a2 = angleScale.bandwidth) != null ? _a2 : 0;
      const paddedGroupAngleStep = groupAngleStep * (1 - groupPaddingOuter);
      const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
      groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
      groupScale.range = [-paddedGroupAngleStep / 2, paddedGroupAngleStep / 2];
      groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;
      const radiusAxisReversed = this.isRadiusAxisReversed();
      const axisInnerRadius = radiusAxisReversed ? this.radius : this.getAxisInnerRadius();
      const axisOuterRadius = radiusAxisReversed ? this.getAxisInnerRadius() : this.radius;
      const axisTotalRadius = axisOuterRadius + axisInnerRadius;
      const { angleKey, radiusKey, angleName, radiusName, label } = this.properties;
      const getLabelNodeDatum = (datum, radiusDatum, x, y) => {
        const labelText = this.getLabelText(
          label,
          { value: radiusDatum, datum, angleKey, radiusKey, angleName, radiusName },
          (value) => isNumber(value) ? value.toFixed(2) : String(value)
        );
        if (labelText) {
          return { x, y, text: labelText, textAlign: "center", textBaseline: "middle" };
        }
      };
      const nodeData = processedData.data.map((group, index, data) => {
        const { datum, keys, values } = group;
        const angleDatum = keys[0];
        const radiusDatum = values[radiusRawIndex];
        const innerRadiusDatum = values[radiusStartIndex];
        const outerRadiusDatum = values[radiusEndIndex];
        let startAngle;
        let endAngle;
        if (data.length === 1) {
          startAngle = -0.5 * Math.PI;
          endAngle = 1.5 * Math.PI;
        } else {
          const groupAngle = angleScale.convert(angleDatum);
          startAngle = normalizeAngle3605(groupAngle + groupScale.convert(String(groupIndex)));
          endAngle = normalizeAngle3605(startAngle + groupScale.bandwidth);
        }
        const angle = startAngle + groupScale.bandwidth / 2;
        const innerRadius = axisTotalRadius - radiusScale.convert(innerRadiusDatum);
        const outerRadius = axisTotalRadius - radiusScale.convert(outerRadiusDatum);
        const midRadius = (innerRadius + outerRadius) / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = cos * midRadius;
        const y = sin * midRadius;
        const labelNodeDatum = this.properties.label.enabled ? getLabelNodeDatum(datum, radiusDatum, x, y) : void 0;
        const columnWidth = this.getColumnWidth(startAngle, endAngle);
        return {
          series: this,
          datum,
          point: { x, y, size: 0 },
          midPoint: { x, y },
          label: labelNodeDatum,
          angleValue: angleDatum,
          radiusValue: radiusDatum,
          innerRadius,
          outerRadius,
          startAngle,
          endAngle,
          axisInnerRadius,
          axisOuterRadius,
          columnWidth,
          index
        };
      });
      return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
    });
  }
  getColumnWidth(_startAngle, _endAngle) {
    return NaN;
  }
  update(_0) {
    return __async(this, arguments, function* ({ seriesRect }) {
      const resize = this.checkResize(seriesRect);
      yield this.maybeRefreshNodeData();
      this.contentGroup.translationX = this.centerX;
      this.contentGroup.translationY = this.centerY;
      this.highlightGroup.translationX = this.centerX;
      this.highlightGroup.translationY = this.centerY;
      if (this.labelGroup) {
        this.labelGroup.translationX = this.centerX;
        this.labelGroup.translationY = this.centerY;
      }
      this.updateSectorSelection(this.itemSelection, false);
      this.updateSectorSelection(this.highlightSelection, true);
      this.updateLabels();
      if (resize) {
        this.animationState.transition("resize");
      }
      this.animationState.transition("update");
    });
  }
  updateSectorSelection(selection, highlight) {
    var _a2, _b, _c, _d, _e;
    let selectionData = [];
    if (highlight) {
      const highlighted = (_a2 = this.ctx.highlightManager) == null ? void 0 : _a2.getActiveHighlight();
      if ((highlighted == null ? void 0 : highlighted.datum) && highlighted.series === this) {
        selectionData = [highlighted];
      }
    } else {
      selectionData = this.nodeData;
    }
    const highlightedStyle = highlight ? this.properties.highlightStyle.item : void 0;
    const fill = (_b = highlightedStyle == null ? void 0 : highlightedStyle.fill) != null ? _b : this.properties.fill;
    const fillOpacity = (_c = highlightedStyle == null ? void 0 : highlightedStyle.fillOpacity) != null ? _c : this.properties.fillOpacity;
    const stroke = (_d = highlightedStyle == null ? void 0 : highlightedStyle.stroke) != null ? _d : this.properties.stroke;
    const strokeOpacity = this.properties.strokeOpacity;
    const strokeWidth = (_e = highlightedStyle == null ? void 0 : highlightedStyle.strokeWidth) != null ? _e : this.properties.strokeWidth;
    const idFn = (datum) => datum.angleValue;
    selection.update(selectionData, void 0, idFn).each((node, datum) => {
      var _a3, _b2, _c2, _d2;
      const format = this.properties.formatter ? this.ctx.callbackCache.call(this.properties.formatter, {
        datum,
        fill,
        stroke,
        strokeWidth,
        highlighted: highlight,
        angleKey: this.properties.angleKey,
        radiusKey: this.properties.radiusKey,
        seriesId: this.id
      }) : void 0;
      this.updateItemPath(node, datum, highlight, format);
      node.fill = (_a3 = format == null ? void 0 : format.fill) != null ? _a3 : fill;
      node.fillOpacity = (_b2 = format == null ? void 0 : format.fillOpacity) != null ? _b2 : fillOpacity;
      node.stroke = (_c2 = format == null ? void 0 : format.stroke) != null ? _c2 : stroke;
      node.strokeOpacity = strokeOpacity;
      node.strokeWidth = (_d2 = format == null ? void 0 : format.strokeWidth) != null ? _d2 : strokeWidth;
      node.lineDash = this.properties.lineDash;
      node.lineJoin = "round";
    });
  }
  updateLabels() {
    const { label } = this.properties;
    this.labelSelection.update(this.nodeData).each((node, datum) => {
      if (label.enabled && datum.label) {
        node.x = datum.label.x;
        node.y = datum.label.y;
        node.fill = label.color;
        node.fontFamily = label.fontFamily;
        node.fontSize = label.fontSize;
        node.fontStyle = label.fontStyle;
        node.fontWeight = label.fontWeight;
        node.text = datum.label.text;
        node.textAlign = datum.label.textAlign;
        node.textBaseline = datum.label.textBaseline;
        node.visible = true;
      } else {
        node.visible = false;
      }
    });
  }
  animateEmptyUpdateReady() {
    const { labelSelection } = this;
    const fns = this.getColumnTransitionFunctions();
    motion3.fromToMotion(this.id, "datums", this.ctx.animationManager, [this.itemSelection], fns);
    seriesLabelFadeInAnimation2(this, "labels", this.ctx.animationManager, [labelSelection]);
  }
  animateClearingUpdateEmpty() {
    const { itemSelection } = this;
    const { animationManager } = this.ctx;
    const fns = this.getColumnTransitionFunctions();
    motion3.fromToMotion(this.id, "datums", animationManager, [itemSelection], fns);
    seriesLabelFadeOutAnimation(this, "labels", animationManager, [this.labelSelection]);
  }
  getTooltipHtml(nodeDatum) {
    var _a2;
    const { id: seriesId, axes, dataModel } = this;
    const { angleKey, radiusKey, angleName, radiusName, fill, stroke, strokeWidth, formatter, tooltip } = this.properties;
    const { angleValue, radiusValue, datum } = nodeDatum;
    const xAxis = axes[ChartAxisDirection11.X];
    const yAxis = axes[ChartAxisDirection11.Y];
    if (!this.properties.isValid() || !(xAxis && yAxis && isNumber(radiusValue)) || !dataModel) {
      return "";
    }
    const angleString = xAxis.formatDatum(angleValue);
    const radiusString = yAxis.formatDatum(radiusValue);
    const title = sanitizeHtml7(radiusName);
    const content = sanitizeHtml7(`${angleString}: ${radiusString}`);
    const { fill: color } = (_a2 = formatter && this.ctx.callbackCache.call(formatter, {
      seriesId,
      datum,
      fill,
      stroke,
      strokeWidth,
      highlighted: false,
      angleKey,
      radiusKey
    })) != null ? _a2 : { fill };
    return tooltip.toTooltipHtml(
      { title, backgroundColor: fill, content },
      { seriesId, datum, color, title, angleKey, radiusKey, angleName, radiusName }
    );
  }
  getLegendData(legendType) {
    var _a2;
    if (!((_a2 = this.data) == null ? void 0 : _a2.length) || !this.properties.isValid() || legendType !== "category") {
      return [];
    }
    const { radiusKey, radiusName, fill, stroke, fillOpacity, strokeOpacity, strokeWidth, visible } = this.properties;
    return [
      {
        legendType: "category",
        id: this.id,
        itemId: radiusKey,
        seriesId: this.id,
        enabled: visible,
        label: {
          text: radiusName != null ? radiusName : radiusKey
        },
        marker: {
          fill: fill != null ? fill : "rgba(0, 0, 0, 0)",
          stroke: stroke != null ? stroke : "rgba(0, 0, 0, 0)",
          fillOpacity: fillOpacity != null ? fillOpacity : 1,
          strokeOpacity: strokeOpacity != null ? strokeOpacity : 1,
          strokeWidth
        }
      }
    ];
  }
  onLegendItemClick(event) {
    const { enabled, itemId, series } = event;
    if (series.id === this.id) {
      this.toggleSeriesItem(itemId, enabled);
    }
  }
  onLegendItemDoubleClick(event) {
    const { enabled, itemId, series, numVisibleItems } = event;
    const wasClicked = series.id === this.id;
    const newEnabled = wasClicked || enabled && numVisibleItems === 1;
    this.toggleSeriesItem(itemId, newEnabled);
  }
  computeLabelsBBox() {
    return null;
  }
};

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesBaseProperties.ts
var import_ag_charts_community83 = require("ag-charts-community");
var { Label: Label4 } = import_ag_charts_community83._Scene;
var {
  SeriesProperties: SeriesProperties6,
  SeriesTooltip: SeriesTooltip10,
  Validate: Validate40,
  COLOR_STRING: COLOR_STRING14,
  DEGREE: DEGREE3,
  FUNCTION: FUNCTION10,
  LINE_DASH: LINE_DASH11,
  NUMBER: NUMBER9,
  OBJECT: OBJECT13,
  POSITIVE_NUMBER: POSITIVE_NUMBER17,
  RATIO: RATIO19,
  STRING: STRING12
} = import_ag_charts_community83._ModuleSupport;
var RadialColumnSeriesBaseProperties = class extends SeriesProperties6 {
  constructor() {
    super(...arguments);
    this.fill = "black";
    this.fillOpacity = 1;
    this.stroke = "black";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.rotation = 0;
    this.label = new Label4();
    this.tooltip = new SeriesTooltip10();
  }
};
__decorateClass([
  Validate40(STRING12)
], RadialColumnSeriesBaseProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate40(STRING12, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "angleName", 2);
__decorateClass([
  Validate40(STRING12)
], RadialColumnSeriesBaseProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate40(STRING12, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate40(COLOR_STRING14)
], RadialColumnSeriesBaseProperties.prototype, "fill", 2);
__decorateClass([
  Validate40(RATIO19)
], RadialColumnSeriesBaseProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate40(COLOR_STRING14)
], RadialColumnSeriesBaseProperties.prototype, "stroke", 2);
__decorateClass([
  Validate40(POSITIVE_NUMBER17)
], RadialColumnSeriesBaseProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate40(RATIO19)
], RadialColumnSeriesBaseProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate40(LINE_DASH11)
], RadialColumnSeriesBaseProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate40(POSITIVE_NUMBER17)
], RadialColumnSeriesBaseProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate40(FUNCTION10, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "formatter", 2);
__decorateClass([
  Validate40(DEGREE3)
], RadialColumnSeriesBaseProperties.prototype, "rotation", 2);
__decorateClass([
  Validate40(STRING12, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "stackGroup", 2);
__decorateClass([
  Validate40(NUMBER9, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "normalizedTo", 2);
__decorateClass([
  Validate40(OBJECT13)
], RadialColumnSeriesBaseProperties.prototype, "label", 2);
__decorateClass([
  Validate40(OBJECT13)
], RadialColumnSeriesBaseProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleUtil.ts
var import_ag_charts_community85 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnUtil.ts
var import_ag_charts_community84 = require("ag-charts-community");
var { motion: motion4 } = import_ag_charts_community84._Scene;
function createAngleMotionCalculator() {
  const angles = {
    startAngle: /* @__PURE__ */ new Map(),
    endAngle: /* @__PURE__ */ new Map()
  };
  const angleKeys = ["startAngle", "endAngle"];
  const calculate = (node, datum, status) => {
    angleKeys.forEach((key) => {
      var _a2, _b;
      const map = angles[key];
      let from2 = (status === "removed" || status === "updated" ? node : datum)[key];
      let to2 = (status === "removed" ? node : datum)[key];
      if (isNaN(to2)) {
        to2 = (_b = (_a2 = node.previousDatum) == null ? void 0 : _a2[key]) != null ? _b : NaN;
      }
      const diff8 = from2 - to2;
      if (Math.abs(diff8) > Math.PI) {
        from2 -= Math.sign(diff8) * 2 * Math.PI;
      }
      map.set(datum, { from: from2, to: to2 });
    });
  };
  const getAngles = (datum, fromToKey) => {
    return {
      startAngle: angles.startAngle.get(datum)[fromToKey],
      endAngle: angles.endAngle.get(datum)[fromToKey]
    };
  };
  const from = (datum) => getAngles(datum, "from");
  const to = (datum) => getAngles(datum, "to");
  return { calculate, from, to };
}
function fixRadialColumnAnimationStatus(node, datum, status) {
  if (status === "updated") {
    if (node.previousDatum == null || isNaN(node.previousDatum.startAngle) || isNaN(node.previousDatum.endAngle)) {
      return "added";
    }
    if (isNaN(datum.startAngle) || isNaN(datum.endAngle)) {
      return "removed";
    }
  }
  if (status === "added" && node.previousDatum != null) {
    return "updated";
  }
  return status;
}
function prepareRadialColumnAnimationFunctions(axisZeroRadius) {
  const angles = createAngleMotionCalculator();
  const fromFn = (node, datum, status) => {
    status = fixRadialColumnAnimationStatus(node, datum, status);
    angles.calculate(node, datum, status);
    const { startAngle, endAngle } = angles.from(datum);
    let innerRadius;
    let outerRadius;
    let columnWidth;
    let axisInnerRadius;
    let axisOuterRadius;
    if (status === "removed" || status === "updated") {
      innerRadius = node.innerRadius;
      outerRadius = node.outerRadius;
      columnWidth = node.columnWidth;
      axisInnerRadius = node.axisInnerRadius;
      axisOuterRadius = node.axisOuterRadius;
    } else {
      innerRadius = axisZeroRadius;
      outerRadius = axisZeroRadius;
      columnWidth = datum.columnWidth;
      axisInnerRadius = datum.axisInnerRadius;
      axisOuterRadius = datum.axisOuterRadius;
    }
    const phase = motion4.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
    return {
      innerRadius,
      outerRadius,
      columnWidth,
      axisInnerRadius,
      axisOuterRadius,
      startAngle,
      endAngle,
      phase
    };
  };
  const toFn = (node, datum, status) => {
    const { startAngle, endAngle } = angles.to(datum);
    let innerRadius;
    let outerRadius;
    let columnWidth;
    let axisInnerRadius;
    let axisOuterRadius;
    if (status === "removed") {
      innerRadius = node.innerRadius;
      outerRadius = node.innerRadius;
      columnWidth = node.columnWidth;
      axisInnerRadius = node.axisInnerRadius;
      axisOuterRadius = node.axisOuterRadius;
    } else {
      innerRadius = isNaN(datum.innerRadius) ? axisZeroRadius : datum.innerRadius;
      outerRadius = isNaN(datum.outerRadius) ? axisZeroRadius : datum.outerRadius;
      columnWidth = isNaN(datum.columnWidth) ? node.columnWidth : datum.columnWidth;
      axisInnerRadius = datum.axisInnerRadius;
      axisOuterRadius = datum.axisOuterRadius;
    }
    return { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle };
  };
  return { toFn, fromFn };
}
function resetRadialColumnSelectionFn(_node, {
  innerRadius,
  outerRadius,
  columnWidth,
  axisInnerRadius,
  axisOuterRadius,
  startAngle,
  endAngle
}) {
  return { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle };
}

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleUtil.ts
var { motion: motion5 } = import_ag_charts_community85._Scene;
function prepareNightingaleAnimationFunctions(axisZeroRadius) {
  const angles = createAngleMotionCalculator();
  const fromFn = (sect, datum, status) => {
    status = fixRadialColumnAnimationStatus(sect, datum, status);
    angles.calculate(sect, datum, status);
    const { startAngle, endAngle } = angles.from(datum);
    let innerRadius;
    let outerRadius;
    if (status === "removed" || status === "updated") {
      innerRadius = sect.innerRadius;
      outerRadius = sect.outerRadius;
    } else {
      innerRadius = axisZeroRadius;
      outerRadius = axisZeroRadius;
    }
    const phase = motion5.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
    return { innerRadius, outerRadius, startAngle, endAngle, phase };
  };
  const toFn = (_sect, datum, status) => {
    const { startAngle, endAngle } = angles.to(datum);
    let innerRadius;
    let outerRadius;
    if (status === "removed") {
      innerRadius = axisZeroRadius;
      outerRadius = axisZeroRadius;
    } else {
      innerRadius = isNaN(datum.innerRadius) ? axisZeroRadius : datum.innerRadius;
      outerRadius = isNaN(datum.outerRadius) ? axisZeroRadius : datum.outerRadius;
    }
    return { innerRadius, outerRadius, startAngle, endAngle };
  };
  return { toFn, fromFn };
}
function resetNightingaleSelectionFn(_sect, { innerRadius, outerRadius, startAngle, endAngle }) {
  return { innerRadius, outerRadius, startAngle, endAngle };
}

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleSeries.ts
var { Sector: Sector3 } = import_ag_charts_community86._Scene;
var NightingaleSeries = class extends RadialColumnSeriesBase {
  // TODO: Enable once the options contract has been revisited
  // @Validate(POSITIVE_NUMBER)
  // sectorSpacing = 1;
  constructor(moduleCtx) {
    super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
    this.properties = new RadialColumnSeriesBaseProperties();
  }
  getStackId() {
    var _a2, _b;
    const groupIndex = (_b = (_a2 = this.seriesGrouping) == null ? void 0 : _a2.groupIndex) != null ? _b : this.id;
    return `nightingale-stack-${groupIndex}-yValues`;
  }
  nodeFactory() {
    return new Sector3();
  }
  updateItemPath(node, datum, highlight, _format) {
    node.centerX = 0;
    node.centerY = 0;
    if (highlight) {
      node.innerRadius = datum.innerRadius;
      node.outerRadius = datum.outerRadius;
      node.startAngle = datum.startAngle;
      node.endAngle = datum.endAngle;
    }
  }
  getColumnTransitionFunctions() {
    const axisZeroRadius = this.isRadiusAxisReversed() ? this.radius : this.getAxisInnerRadius();
    return prepareNightingaleAnimationFunctions(axisZeroRadius);
  }
};
NightingaleSeries.className = "NightingaleSeries";
NightingaleSeries.type = "nightingale";

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleThemes.ts
var import_ag_charts_community87 = require("ag-charts-community");
var NIGHTINGALE_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community87._Theme.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 1,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community87._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community87._Theme.DEFAULT_LABEL_COLOUR,
      __overrides__: import_ag_charts_community87._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [import_ag_charts_community87._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      shape: import_ag_charts_community87._Theme.POLAR_AXIS_SHAPE.CIRCLE,
      groupPaddingInner: 0,
      paddingInner: 0,
      label: {
        padding: 10
      }
    },
    [import_ag_charts_community87._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
      shape: import_ag_charts_community87._Theme.POLAR_AXIS_SHAPE.CIRCLE
    }
  }
};

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleModule.ts
var NightingaleModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "nightingale",
  instanceConstructor: NightingaleSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community88._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: import_ag_charts_community88._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER
    }
  ],
  themeTemplate: NIGHTINGALE_SERIES_THEME,
  paletteFactory({ takeColors, userPalette }) {
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      fill,
      stroke: userPalette ? stroke : import_ag_charts_community88._Theme.DEFAULT_POLAR_SERIES_STROKE
    };
  },
  stackable: true,
  groupable: true,
  stackedByDefault: true
};

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaModule.ts
var import_ag_charts_community94 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radar/radarThemes.ts
var import_ag_charts_community89 = require("ag-charts-community");
var BASE_RADAR_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community89._Theme.EXTENDS_SERIES_DEFAULTS,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community89._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community89._Theme.DEFAULT_LABEL_COLOUR,
      __overrides__: import_ag_charts_community89._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS
    },
    marker: {
      enabled: true,
      fillOpacity: 1,
      shape: "circle",
      size: 6,
      strokeOpacity: 1,
      strokeWidth: 0
    }
  },
  axes: {
    [import_ag_charts_community89._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      label: {
        padding: 10
      }
    }
  }
};
var RADAR_LINE_SERIES_THEME = import_ag_charts_community89._ModuleSupport.mergeDefaults(
  {
    series: {
      strokeWidth: 2
    }
  },
  BASE_RADAR_SERIES_THEME
);
var RADAR_AREA_SERIES_THEME = import_ag_charts_community89._ModuleSupport.mergeDefaults(
  {
    series: {
      fillOpacity: 0.8,
      strokeWidth: 2,
      marker: {
        enabled: false
      }
    }
  },
  BASE_RADAR_SERIES_THEME
);

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaSeries.ts
var import_ag_charts_community93 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radar/radarSeries.ts
var import_ag_charts_community91 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radar/radarSeriesProperties.ts
var import_ag_charts_community90 = require("ag-charts-community");
var { Label: Label5 } = import_ag_charts_community90._Scene;
var {
  SeriesMarker,
  SeriesProperties: SeriesProperties7,
  SeriesTooltip: SeriesTooltip11,
  Validate: Validate41,
  BOOLEAN: BOOLEAN14,
  COLOR_STRING: COLOR_STRING15,
  DEGREE: DEGREE4,
  FUNCTION: FUNCTION11,
  LINE_DASH: LINE_DASH12,
  OBJECT: OBJECT14,
  POSITIVE_NUMBER: POSITIVE_NUMBER18,
  RATIO: RATIO20,
  STRING: STRING13
} = import_ag_charts_community90._ModuleSupport;
var RadarSeriesProperties = class extends SeriesProperties7 {
  constructor() {
    super(...arguments);
    this.stroke = "black";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.rotation = 0;
    this.marker = new SeriesMarker();
    this.label = new Label5();
    this.tooltip = new SeriesTooltip11();
    this.connectMissingData = false;
  }
};
__decorateClass([
  Validate41(STRING13)
], RadarSeriesProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate41(STRING13)
], RadarSeriesProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate41(STRING13, { optional: true })
], RadarSeriesProperties.prototype, "angleName", 2);
__decorateClass([
  Validate41(STRING13, { optional: true })
], RadarSeriesProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate41(COLOR_STRING15)
], RadarSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate41(POSITIVE_NUMBER18)
], RadarSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate41(RATIO20)
], RadarSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate41(LINE_DASH12)
], RadarSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate41(POSITIVE_NUMBER18)
], RadarSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate41(FUNCTION11, { optional: true })
], RadarSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate41(DEGREE4)
], RadarSeriesProperties.prototype, "rotation", 2);
__decorateClass([
  Validate41(OBJECT14)
], RadarSeriesProperties.prototype, "marker", 2);
__decorateClass([
  Validate41(OBJECT14)
], RadarSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate41(OBJECT14)
], RadarSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate41(BOOLEAN14)
], RadarSeriesProperties.prototype, "connectMissingData", 2);

// packages/ag-charts-enterprise/src/series/radar/radarSeries.ts
var {
  ChartAxisDirection: ChartAxisDirection12,
  PolarAxis: PolarAxis2,
  SeriesNodePickMode: SeriesNodePickMode9,
  valueProperty: valueProperty10,
  fixNumericExtent: fixNumericExtent5,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation3,
  markerFadeInAnimation,
  resetMarkerFn,
  animationValidation: animationValidation5
} = import_ag_charts_community91._ModuleSupport;
var { BBox: BBox8, Group: Group12, Path: Path6, PointerEvents: PointerEvents5, Selection: Selection8, Text: Text9, getMarker: getMarker2 } = import_ag_charts_community91._Scene;
var { extent: extent3, isNumber: isNumber2, isNumberEqual: isNumberEqual8, sanitizeHtml: sanitizeHtml8, toFixed } = import_ag_charts_community91._Util;
var RadarSeriesNodeEvent = class extends import_ag_charts_community91._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadarSeries = class extends import_ag_charts_community91._ModuleSupport.PolarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode9.NEAREST_NODE, SeriesNodePickMode9.EXACT_SHAPE_MATCH],
      canHaveAxes: true,
      animationResetFns: {
        item: resetMarkerFn
      }
    });
    this.properties = new RadarSeriesProperties();
    this.NodeEvent = RadarSeriesNodeEvent;
    this.nodeData = [];
    this.resetInvalidToZero = false;
    this.circleCache = { r: 0, cx: 0, cy: 0 };
    const lineGroup = new Group12();
    this.contentGroup.append(lineGroup);
    this.lineSelection = Selection8.select(lineGroup, Path6);
    lineGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
  }
  nodeFactory() {
    const { shape } = this.properties.marker;
    const MarkerShape = getMarker2(shape);
    return new MarkerShape();
  }
  addChartEventListeners() {
    var _a2, _b;
    this.destroyFns.push(
      (_a2 = this.ctx.chartEventManager) == null ? void 0 : _a2.addListener("legend-item-click", (event) => this.onLegendItemClick(event)),
      (_b = this.ctx.chartEventManager) == null ? void 0 : _b.addListener(
        "legend-item-double-click",
        (event) => this.onLegendItemDoubleClick(event)
      )
    );
  }
  getSeriesDomain(direction) {
    const { dataModel, processedData } = this;
    if (!processedData || !dataModel)
      return [];
    if (direction === ChartAxisDirection12.X) {
      return dataModel.getDomain(this, `angleValue`, "value", processedData);
    } else {
      const domain = dataModel.getDomain(this, `radiusValue`, "value", processedData);
      const ext = extent3(domain.length === 0 ? domain : [0].concat(domain));
      return fixNumericExtent5(ext);
    }
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2;
      if (!this.properties.isValid()) {
        return;
      }
      const { angleKey, radiusKey } = this.properties;
      const extraProps = [];
      if (!this.ctx.animationManager.isSkipped()) {
        extraProps.push(animationValidation5(this));
      }
      yield this.requestDataModel(dataController, (_a2 = this.data) != null ? _a2 : [], {
        props: [
          valueProperty10(this, angleKey, false, { id: "angleValue" }),
          valueProperty10(this, radiusKey, false, { id: "radiusValue", invalidValue: void 0 }),
          ...extraProps
        ]
      });
      this.animationState.transition("updateData");
    });
  }
  didCircleChange() {
    const r = this.radius;
    const cx = this.centerX;
    const cy = this.centerY;
    const cache = this.circleCache;
    if (!(r === cache.r && cx === cache.cx && cy === cache.cy)) {
      this.circleCache = { r, cx, cy };
      return true;
    }
    return false;
  }
  getAxisInnerRadius() {
    const radiusAxis = this.axes[ChartAxisDirection12.Y];
    return radiusAxis instanceof PolarAxis2 ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  maybeRefreshNodeData() {
    return __async(this, null, function* () {
      const didCircleChange = this.didCircleChange();
      if (!didCircleChange && !this.nodeDataRefresh)
        return;
      const [{ nodeData = [] } = {}] = yield this.createNodeData();
      this.nodeData = nodeData;
      this.nodeDataRefresh = false;
    });
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b;
      const { processedData, dataModel } = this;
      if (!processedData || !dataModel || !this.properties.isValid()) {
        return [];
      }
      const { angleKey, radiusKey, angleName, radiusName, marker, label } = this.properties;
      const angleScale = (_a2 = this.axes[ChartAxisDirection12.X]) == null ? void 0 : _a2.scale;
      const radiusScale = (_b = this.axes[ChartAxisDirection12.Y]) == null ? void 0 : _b.scale;
      if (!angleScale || !radiusScale) {
        return [];
      }
      const angleIdx = dataModel.resolveProcessedDataIndexById(this, `angleValue`).index;
      const radiusIdx = dataModel.resolveProcessedDataIndexById(this, `radiusValue`).index;
      const axisInnerRadius = this.getAxisInnerRadius();
      const nodeData = processedData.data.map((group) => {
        const { datum, values } = group;
        const angleDatum = values[angleIdx];
        const radiusDatum = values[radiusIdx];
        const angle = angleScale.convert(angleDatum);
        const radius = this.radius + axisInnerRadius - radiusScale.convert(radiusDatum);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = cos * radius;
        const y = sin * radius;
        let labelNodeDatum;
        if (label.enabled) {
          const labelText = this.getLabelText(
            label,
            { value: radiusDatum, datum, angleKey, radiusKey, angleName, radiusName },
            (value) => isNumber2(value) ? value.toFixed(2) : String(value)
          );
          if (labelText) {
            let textAlign = "right";
            if (isNumberEqual8(cos, 0)) {
              textAlign = "center";
            } else if (cos > 0) {
              textAlign = "left";
            }
            let textBaseline = "bottom";
            if (isNumberEqual8(sin, 0)) {
              textBaseline = "middle";
            } else if (sin > 0) {
              textBaseline = "top";
            }
            labelNodeDatum = {
              x: x + cos * marker.size,
              y: y + sin * marker.size,
              text: labelText,
              textAlign,
              textBaseline
            };
          }
        }
        return {
          series: this,
          datum,
          point: { x, y, size: marker.size },
          midPoint: { x, y },
          label: labelNodeDatum,
          angleValue: angleDatum,
          radiusValue: radiusDatum
        };
      });
      return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
    });
  }
  update(_0) {
    return __async(this, arguments, function* ({ seriesRect }) {
      var _a2, _b;
      const resize = this.checkResize(seriesRect);
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      const { series } = (_b = (_a2 = this.ctx.highlightManager) == null ? void 0 : _a2.getActiveHighlight()) != null ? _b : {};
      this.highlightGroup.visible = (animationEnabled || this.visible) && !!(series === this);
      yield this.maybeRefreshNodeData();
      this.contentGroup.translationX = this.centerX;
      this.contentGroup.translationY = this.centerY;
      this.highlightGroup.translationX = this.centerX;
      this.highlightGroup.translationY = this.centerY;
      if (this.labelGroup) {
        this.labelGroup.translationX = this.centerX;
        this.labelGroup.translationY = this.centerY;
      }
      this.updatePathSelections();
      this.updateMarkerSelection();
      this.updateMarkers(this.itemSelection, false);
      this.updateMarkers(this.highlightSelection, true);
      this.updateLabels();
      if (resize) {
        this.animationState.transition("resize");
      }
      this.animationState.transition("update");
    });
  }
  updatePathSelections() {
    const pathData = this.visible ? [true] : [];
    this.lineSelection.update(pathData);
  }
  updateMarkerSelection() {
    if (this.properties.marker.isDirty()) {
      this.itemSelection.clear();
      this.itemSelection.cleanup();
      this.itemSelection = Selection8.select(this.itemGroup, () => this.nodeFactory(), false);
    }
    this.itemSelection.update(this.properties.marker.enabled ? this.nodeData : []);
  }
  getMarkerFill(highlightedStyle) {
    var _a2;
    return (_a2 = highlightedStyle == null ? void 0 : highlightedStyle.fill) != null ? _a2 : this.properties.marker.fill;
  }
  updateMarkers(selection, highlight) {
    var _a2;
    const { angleKey, radiusKey, marker, visible } = this.properties;
    let selectionData = [];
    if (visible && marker.shape && marker.enabled) {
      if (highlight) {
        const highlighted = (_a2 = this.ctx.highlightManager) == null ? void 0 : _a2.getActiveHighlight();
        if (highlighted == null ? void 0 : highlighted.datum) {
          selectionData = [highlighted];
        }
      } else {
        selectionData = this.nodeData;
      }
    }
    const highlightedStyle = highlight ? this.properties.highlightStyle.item : void 0;
    selection.update(selectionData).each((node, datum) => {
      var _a3, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
      const fill = this.getMarkerFill(highlightedStyle);
      const stroke = (_b = (_a3 = highlightedStyle == null ? void 0 : highlightedStyle.stroke) != null ? _a3 : marker.stroke) != null ? _b : this.properties.stroke;
      const strokeWidth = (_e = (_d = (_c = highlightedStyle == null ? void 0 : highlightedStyle.strokeWidth) != null ? _c : marker.strokeWidth) != null ? _d : this.properties.strokeWidth) != null ? _e : 1;
      const format = marker.formatter ? this.ctx.callbackCache.call(marker.formatter, {
        datum: datum.datum,
        angleKey,
        radiusKey,
        fill,
        stroke,
        strokeWidth,
        size: marker.size,
        highlighted: highlight,
        seriesId: this.id
      }) : void 0;
      node.fill = (_f = format == null ? void 0 : format.fill) != null ? _f : fill;
      node.stroke = (_g = format == null ? void 0 : format.stroke) != null ? _g : stroke;
      node.strokeWidth = (_h = format == null ? void 0 : format.strokeWidth) != null ? _h : strokeWidth;
      node.fillOpacity = (_j = (_i = highlightedStyle == null ? void 0 : highlightedStyle.fillOpacity) != null ? _i : marker.fillOpacity) != null ? _j : 1;
      node.strokeOpacity = (_l = (_k = marker.strokeOpacity) != null ? _k : this.properties.strokeOpacity) != null ? _l : 1;
      node.size = (_m = format == null ? void 0 : format.size) != null ? _m : marker.size;
      const { x, y } = datum.point;
      node.translationX = x;
      node.translationY = y;
      node.visible = visible && node.size > 0 && !isNaN(x) && !isNaN(y);
    });
  }
  updateLabels() {
    const { label } = this.properties;
    this.labelSelection.update(this.nodeData).each((node, datum) => {
      if (label.enabled && datum.label) {
        node.x = datum.label.x;
        node.y = datum.label.y;
        node.fill = label.color;
        node.fontFamily = label.fontFamily;
        node.fontSize = label.fontSize;
        node.fontStyle = label.fontStyle;
        node.fontWeight = label.fontWeight;
        node.text = datum.label.text;
        node.textAlign = datum.label.textAlign;
        node.textBaseline = datum.label.textBaseline;
        node.visible = true;
      } else {
        node.visible = false;
      }
    });
  }
  getTooltipHtml(nodeDatum) {
    var _a2;
    if (!this.properties.isValid()) {
      return "";
    }
    const { id: seriesId } = this;
    const { angleKey, radiusKey, angleName, radiusName, marker, tooltip } = this.properties;
    const { datum, angleValue, radiusValue } = nodeDatum;
    const formattedAngleValue = typeof angleValue === "number" ? toFixed(angleValue) : String(angleValue);
    const formattedRadiusValue = typeof radiusValue === "number" ? toFixed(radiusValue) : String(radiusValue);
    const title = sanitizeHtml8(radiusName);
    const content = sanitizeHtml8(`${formattedAngleValue}: ${formattedRadiusValue}`);
    const { formatter: markerFormatter, fill, stroke, strokeWidth: markerStrokeWidth, size } = marker;
    const strokeWidth = markerStrokeWidth != null ? markerStrokeWidth : this.properties.strokeWidth;
    const { fill: color } = (_a2 = markerFormatter && this.ctx.callbackCache.call(markerFormatter, {
      datum,
      angleKey,
      radiusKey,
      fill,
      stroke,
      strokeWidth,
      size,
      highlighted: false,
      seriesId
    })) != null ? _a2 : { fill };
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      { datum, angleKey, angleName, radiusKey, radiusName, title, color, seriesId }
    );
  }
  getLegendData(legendType) {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    if (!((_a2 = this.data) == null ? void 0 : _a2.length) || !this.properties.isValid() || legendType !== "category") {
      return [];
    }
    const { radiusKey, radiusName, stroke, strokeWidth, strokeOpacity, lineDash, visible, marker } = this.properties;
    return [
      {
        legendType: "category",
        id: this.id,
        itemId: radiusKey,
        seriesId: this.id,
        enabled: visible,
        label: {
          text: radiusName != null ? radiusName : radiusKey
        },
        marker: {
          shape: marker.shape,
          fill: (_d = (_c = (_b = this.getMarkerFill()) != null ? _b : marker.stroke) != null ? _c : stroke) != null ? _d : "rgba(0, 0, 0, 0)",
          stroke: (_f = (_e = marker.stroke) != null ? _e : stroke) != null ? _f : "rgba(0, 0, 0, 0)",
          fillOpacity: (_g = marker.fillOpacity) != null ? _g : 1,
          strokeOpacity: (_i = (_h = marker.strokeOpacity) != null ? _h : strokeOpacity) != null ? _i : 1,
          strokeWidth: (_j = marker.strokeWidth) != null ? _j : 0,
          enabled: marker.enabled || strokeWidth <= 0
        },
        line: {
          stroke,
          strokeOpacity,
          strokeWidth,
          lineDash
        }
      }
    ];
  }
  onLegendItemClick(event) {
    const { enabled, itemId, series } = event;
    if (series.id === this.id) {
      this.toggleSeriesItem(itemId, enabled);
    }
  }
  onLegendItemDoubleClick(event) {
    const { enabled, itemId, series, numVisibleItems } = event;
    const wasClicked = series.id === this.id;
    const newEnabled = wasClicked || enabled && numVisibleItems === 1;
    this.toggleSeriesItem(itemId, newEnabled);
  }
  pickNodeClosestDatum(point) {
    var _a2, _b;
    const { x, y } = point;
    const { rootGroup, nodeData, centerX: cx, centerY: cy } = this;
    const hitPoint = rootGroup.transformPoint(x, y);
    const radius = this.radius;
    const distanceFromCenter = Math.sqrt(__pow(x - cx, 2) + __pow(y - cy, 2));
    if (distanceFromCenter > radius + this.properties.marker.size) {
      return;
    }
    let minDistance = Infinity;
    let closestDatum;
    for (const datum of nodeData) {
      const { point: { x: datumX = NaN, y: datumY = NaN } = {} } = datum;
      if (isNaN(datumX) || isNaN(datumY)) {
        continue;
      }
      const distance = Math.sqrt(__pow(hitPoint.x - datumX - cx, 2) + __pow(hitPoint.y - datumY - cy, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestDatum = datum;
      }
    }
    if (closestDatum) {
      const distance = Math.max(minDistance - ((_b = (_a2 = closestDatum.point) == null ? void 0 : _a2.size) != null ? _b : 0), 0);
      return { datum: closestDatum, distance };
    }
  }
  computeLabelsBBox() {
    return __async(this, null, function* () {
      const { label } = this.properties;
      yield this.maybeRefreshNodeData();
      const textBoxes = [];
      const tempText2 = new Text9();
      this.nodeData.forEach((nodeDatum) => {
        if (!label.enabled || !nodeDatum.label) {
          return;
        }
        tempText2.text = nodeDatum.label.text;
        tempText2.x = nodeDatum.label.x;
        tempText2.y = nodeDatum.label.y;
        tempText2.setFont(label);
        tempText2.setAlign(nodeDatum.label);
        const box = tempText2.computeBBox();
        textBoxes.push(box);
      });
      if (textBoxes.length === 0) {
        return null;
      }
      return BBox8.merge(textBoxes);
    });
  }
  getLineNode() {
    return this.lineSelection.nodes()[0];
  }
  beforePathAnimation() {
    const lineNode = this.getLineNode();
    lineNode.fill = void 0;
    lineNode.lineJoin = "round";
    lineNode.lineCap = "round";
    lineNode.pointerEvents = PointerEvents5.None;
    lineNode.stroke = this.properties.stroke;
    lineNode.strokeWidth = this.getStrokeWidth(this.properties.strokeWidth);
    lineNode.strokeOpacity = this.properties.strokeOpacity;
    lineNode.lineDash = this.properties.lineDash;
    lineNode.lineDashOffset = this.properties.lineDashOffset;
  }
  getLinePoints() {
    const { nodeData, resetInvalidToZero } = this;
    const { connectMissingData } = this.properties;
    if (nodeData.length === 0) {
      return [];
    }
    const radiusAxis = this.axes[ChartAxisDirection12.Y];
    const angleAxis = this.axes[ChartAxisDirection12.X];
    const reversedAngleAxis = angleAxis == null ? void 0 : angleAxis.isReversed();
    const reversedRadiusAxis = radiusAxis == null ? void 0 : radiusAxis.isReversed();
    const data = reversedRadiusAxis && !reversedAngleAxis ? [...nodeData].reverse() : nodeData;
    const points = [];
    let prevPointInvalid = false;
    let firstValid;
    data.forEach((datum, index) => {
      let { x, y } = datum.point;
      const isPointInvalid = isNaN(x) || isNaN(y);
      if (!isPointInvalid) {
        firstValid != null ? firstValid : firstValid = datum;
      }
      if (isPointInvalid && !connectMissingData) {
        x = 0;
        y = 0;
      }
      const moveTo = index === 0 || !resetInvalidToZero && !connectMissingData && (isPointInvalid || prevPointInvalid);
      points.push({ x, y, moveTo });
      prevPointInvalid = isPointInvalid;
    });
    if (firstValid !== void 0) {
      points.push({ x: firstValid.point.x, y: firstValid.point.y, moveTo: false });
    }
    return points;
  }
  animateSinglePath(pathNode, points, ratio) {
    const { path } = pathNode;
    path.clear({ trackChanges: true });
    const axisInnerRadius = this.getAxisInnerRadius();
    const radiusAxis = this.axes[ChartAxisDirection12.Y];
    const reversedRadiusAxis = radiusAxis == null ? void 0 : radiusAxis.isReversed();
    const radiusZero = reversedRadiusAxis ? this.radius + axisInnerRadius - (radiusAxis == null ? void 0 : radiusAxis.scale.convert(0)) : axisInnerRadius;
    points.forEach((point) => {
      const { x: x1, y: y1, arc, radius = 0, startAngle = 0, endAngle = 0, moveTo } = point;
      const angle = Math.atan2(y1, x1);
      const x0 = radiusZero * Math.cos(angle);
      const y0 = radiusZero * Math.sin(angle);
      const t = ratio;
      const x = x0 * (1 - t) + x1 * t;
      const y = y0 * (1 - t) + y1 * t;
      if (arc) {
        path.arc(x1, y1, radius, startAngle, endAngle);
      } else if (moveTo) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    });
    pathNode.checkPathDirty();
  }
  animatePaths(ratio) {
    const linePoints = this.getLinePoints();
    this.animateSinglePath(this.getLineNode(), linePoints, ratio);
  }
  animateEmptyUpdateReady() {
    const { itemSelection, labelSelection } = this;
    const { animationManager } = this.ctx;
    this.beforePathAnimation();
    animationManager.animate({
      id: `${this.id}_'path`,
      groupId: this.id,
      from: 0,
      to: 1,
      phase: "initial",
      collapsable: false,
      onUpdate: (ratio) => this.animatePaths(ratio),
      onStop: () => this.animatePaths(1)
    });
    markerFadeInAnimation(this, animationManager, [itemSelection], "added");
    seriesLabelFadeInAnimation3(this, "labels", animationManager, [labelSelection]);
  }
  animateWaitingUpdateReady(data) {
    super.animateWaitingUpdateReady(data);
    this.resetPaths();
  }
  animateReadyResize(data) {
    super.animateReadyResize(data);
    this.resetPaths();
  }
  resetPaths() {
    const lineNode = this.getLineNode();
    if (lineNode) {
      const { path: linePath } = lineNode;
      const linePoints = this.getLinePoints();
      lineNode.fill = void 0;
      lineNode.stroke = this.properties.stroke;
      lineNode.strokeWidth = this.getStrokeWidth(this.properties.strokeWidth);
      lineNode.strokeOpacity = this.properties.strokeOpacity;
      lineNode.lineDash = this.properties.lineDash;
      lineNode.lineDashOffset = this.properties.lineDashOffset;
      linePath.clear({ trackChanges: true });
      linePoints.forEach(({ x, y, moveTo }) => {
        if (moveTo) {
          linePath.moveTo(x, y);
        } else {
          linePath.lineTo(x, y);
        }
      });
      lineNode.checkPathDirty();
    }
  }
};
RadarSeries.className = "RadarSeries";

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaSeriesProperties.ts
var import_ag_charts_community92 = require("ag-charts-community");
var { RATIO: RATIO21, COLOR_STRING: COLOR_STRING16, Validate: Validate42 } = import_ag_charts_community92._ModuleSupport;
var RadarAreaSeriesProperties = class extends RadarSeriesProperties {
  constructor() {
    super(...arguments);
    this.fill = "black";
    this.fillOpacity = 1;
  }
};
__decorateClass([
  Validate42(COLOR_STRING16)
], RadarAreaSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate42(RATIO21)
], RadarAreaSeriesProperties.prototype, "fillOpacity", 2);

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaSeries.ts
var { Group: Group13, Path: Path7, PointerEvents: PointerEvents6, Selection: Selection9 } = import_ag_charts_community93._Scene;
var { ChartAxisDirection: ChartAxisDirection13 } = import_ag_charts_community93._ModuleSupport;
var RadarAreaSeries = class extends RadarSeries {
  constructor(moduleCtx) {
    super(moduleCtx);
    this.properties = new RadarAreaSeriesProperties();
    this.resetInvalidToZero = true;
    const areaGroup = new Group13();
    areaGroup.zIndexSubOrder = [() => this._declarationOrder, 0];
    this.contentGroup.append(areaGroup);
    this.areaSelection = Selection9.select(areaGroup, Path7);
  }
  updatePathSelections() {
    const pathData = this.visible ? [true] : [];
    this.areaSelection.update(pathData);
    super.updatePathSelections();
  }
  getAreaNode() {
    return this.areaSelection.nodes()[0];
  }
  getMarkerFill(highlightedStyle) {
    var _a2, _b;
    return (_b = (_a2 = highlightedStyle == null ? void 0 : highlightedStyle.fill) != null ? _a2 : this.properties.marker.fill) != null ? _b : this.properties.fill;
  }
  beforePathAnimation() {
    super.beforePathAnimation();
    const areaNode = this.getAreaNode();
    areaNode.fill = this.properties.fill;
    areaNode.fillOpacity = this.properties.fillOpacity;
    areaNode.pointerEvents = PointerEvents6.None;
    areaNode.stroke = void 0;
  }
  animatePaths(ratio) {
    super.animatePaths(ratio);
    this.animateSinglePath(this.getAreaNode(), this.getAreaPoints(), ratio);
  }
  getAreaPoints() {
    var _a2, _b;
    const points = this.getLinePoints();
    const getPolarAxis = (direction) => {
      const axis = this.axes[direction];
      return axis instanceof import_ag_charts_community93._ModuleSupport.PolarAxis ? axis : void 0;
    };
    const radiusAxis = getPolarAxis(ChartAxisDirection13.Y);
    const angleAxis = getPolarAxis(ChartAxisDirection13.X);
    const reversedRadiusAxis = radiusAxis == null ? void 0 : radiusAxis.isReversed();
    if (!reversedRadiusAxis) {
      return points;
    }
    const { points: zeroLinePoints = [] } = (_b = (_a2 = angleAxis == null ? void 0 : angleAxis.getAxisLinePoints) == null ? void 0 : _a2.call(angleAxis)) != null ? _b : {};
    return points.concat(...zeroLinePoints);
  }
  resetPaths() {
    super.resetPaths();
    const areaNode = this.getAreaNode();
    if (areaNode) {
      const { path: areaPath } = areaNode;
      const areaPoints = this.getAreaPoints();
      areaNode.fill = this.properties.fill;
      areaNode.fillOpacity = this.properties.fillOpacity;
      areaNode.stroke = void 0;
      areaNode.lineDash = this.properties.lineDash;
      areaNode.lineDashOffset = this.properties.lineDashOffset;
      areaNode.lineJoin = areaNode.lineCap = "round";
      areaPath.clear({ trackChanges: true });
      areaPoints.forEach(({ x, y, moveTo, arc, radius = 0, startAngle = 0, endAngle = 0 }) => {
        if (arc) {
          areaPath.arc(x, y, radius, startAngle, endAngle);
        } else if (moveTo) {
          areaPath.moveTo(x, y);
        } else {
          areaPath.lineTo(x, y);
        }
      });
      areaPath.closePath();
      areaNode.checkPathDirty();
    }
  }
};
RadarAreaSeries.className = "RadarAreaSeries";
RadarAreaSeries.type = "radar-area";

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaModule.ts
var { markerPaletteFactory } = import_ag_charts_community94._ModuleSupport;
var RadarAreaModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radar-area",
  instanceConstructor: RadarAreaSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community94._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: import_ag_charts_community94._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER
    }
  ],
  themeTemplate: RADAR_AREA_SERIES_THEME,
  paletteFactory: (params) => {
    const { marker } = markerPaletteFactory(params);
    return {
      stroke: marker.stroke,
      fill: marker.fill,
      marker
    };
  }
};

// packages/ag-charts-enterprise/src/series/radar-line/radarLineModule.ts
var import_ag_charts_community95 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radar-line/radarLineSeries.ts
var RadarLineSeries = class extends RadarSeries {
  updatePathSelections() {
    this.lineSelection.update(this.visible ? [true] : []);
  }
};
RadarLineSeries.className = "RadarLineSeries";
RadarLineSeries.type = "radar-line";

// packages/ag-charts-enterprise/src/series/radar-line/radarLineModule.ts
var RadarLineModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radar-line",
  instanceConstructor: RadarLineSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community95._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: import_ag_charts_community95._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER
    }
  ],
  themeTemplate: RADAR_LINE_SERIES_THEME,
  paletteFactory: ({ takeColors }) => {
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      stroke: fill,
      marker: { fill, stroke }
    };
  }
};

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarModule.ts
var import_ag_charts_community100 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeries.ts
var import_ag_charts_community98 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeriesProperties.ts
var import_ag_charts_community96 = require("ag-charts-community");
var { Label: Label6 } = import_ag_charts_community96._Scene;
var {
  SeriesProperties: SeriesProperties8,
  SeriesTooltip: SeriesTooltip12,
  Validate: Validate43,
  COLOR_STRING: COLOR_STRING17,
  DEGREE: DEGREE5,
  FUNCTION: FUNCTION12,
  LINE_DASH: LINE_DASH13,
  NUMBER: NUMBER10,
  OBJECT: OBJECT15,
  POSITIVE_NUMBER: POSITIVE_NUMBER19,
  RATIO: RATIO22,
  STRING: STRING14
} = import_ag_charts_community96._ModuleSupport;
var RadialBarSeriesProperties = class extends SeriesProperties8 {
  constructor() {
    super(...arguments);
    this.fill = "black";
    this.fillOpacity = 1;
    this.stroke = "black";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.rotation = 0;
    this.label = new Label6();
    this.tooltip = new SeriesTooltip12();
  }
};
__decorateClass([
  Validate43(STRING14)
], RadialBarSeriesProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate43(STRING14)
], RadialBarSeriesProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate43(STRING14, { optional: true })
], RadialBarSeriesProperties.prototype, "angleName", 2);
__decorateClass([
  Validate43(STRING14, { optional: true })
], RadialBarSeriesProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate43(COLOR_STRING17)
], RadialBarSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate43(RATIO22)
], RadialBarSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate43(COLOR_STRING17)
], RadialBarSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate43(POSITIVE_NUMBER19)
], RadialBarSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate43(RATIO22)
], RadialBarSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate43(LINE_DASH13)
], RadialBarSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate43(POSITIVE_NUMBER19)
], RadialBarSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate43(FUNCTION12, { optional: true })
], RadialBarSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate43(DEGREE5)
], RadialBarSeriesProperties.prototype, "rotation", 2);
__decorateClass([
  Validate43(STRING14, { optional: true })
], RadialBarSeriesProperties.prototype, "stackGroup", 2);
__decorateClass([
  Validate43(NUMBER10, { optional: true })
], RadialBarSeriesProperties.prototype, "normalizedTo", 2);
__decorateClass([
  Validate43(OBJECT15)
], RadialBarSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate43(OBJECT15)
], RadialBarSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarUtil.ts
var import_ag_charts_community97 = require("ag-charts-community");
var { motion: motion6 } = import_ag_charts_community97._Scene;
function fixRadialBarAnimationStatus(node, datum, status) {
  if (status === "updated") {
    if (node.previousDatum == null || isNaN(node.previousDatum.innerRadius) || isNaN(node.previousDatum.outerRadius)) {
      return "added";
    }
    if (isNaN(datum.innerRadius) || isNaN(datum.outerRadius)) {
      return "removed";
    }
  }
  if (status === "added" && node.previousDatum != null) {
    return "updated";
  }
  return status;
}
function prepareRadialBarSeriesAnimationFunctions(axisZeroAngle) {
  const fromFn = (sect, datum, status) => {
    status = fixRadialBarAnimationStatus(sect, datum, status);
    let startAngle;
    let endAngle;
    let innerRadius;
    let outerRadius;
    if (status === "removed" || status === "updated") {
      startAngle = sect.startAngle;
      endAngle = sect.endAngle;
      innerRadius = sect.innerRadius;
      outerRadius = sect.outerRadius;
    } else {
      startAngle = axisZeroAngle;
      endAngle = axisZeroAngle;
      innerRadius = datum.innerRadius;
      outerRadius = datum.outerRadius;
    }
    const phase = motion6.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
    return { startAngle, endAngle, innerRadius, outerRadius, phase };
  };
  const toFn = (sect, datum, status) => {
    let startAngle;
    let endAngle;
    let innerRadius;
    let outerRadius;
    if (status === "removed") {
      startAngle = axisZeroAngle;
      endAngle = axisZeroAngle;
      innerRadius = datum.innerRadius;
      outerRadius = datum.outerRadius;
    } else {
      startAngle = datum.startAngle;
      endAngle = datum.endAngle;
      innerRadius = isNaN(datum.innerRadius) ? sect.innerRadius : datum.innerRadius;
      outerRadius = isNaN(datum.outerRadius) ? sect.outerRadius : datum.outerRadius;
    }
    return { startAngle, endAngle, innerRadius, outerRadius };
  };
  return { toFn, fromFn };
}
function resetRadialBarSelectionsFn(_node, datum) {
  return {
    centerX: 0,
    centerY: 0,
    innerRadius: datum.innerRadius,
    outerRadius: datum.outerRadius,
    startAngle: datum.startAngle,
    endAngle: datum.endAngle
  };
}

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeries.ts
var {
  ChartAxisDirection: ChartAxisDirection14,
  PolarAxis: PolarAxis3,
  diff: diff5,
  isDefined: isDefined4,
  groupAccumulativeValueProperty: groupAccumulativeValueProperty3,
  keyProperty: keyProperty5,
  normaliseGroupTo: normaliseGroupTo2,
  valueProperty: valueProperty11,
  fixNumericExtent: fixNumericExtent6,
  resetLabelFn: resetLabelFn2,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation4,
  seriesLabelFadeOutAnimation: seriesLabelFadeOutAnimation2,
  animationValidation: animationValidation6
} = import_ag_charts_community98._ModuleSupport;
var { BandScale: BandScale4 } = import_ag_charts_community98._Scale;
var { Sector: Sector4, motion: motion7 } = import_ag_charts_community98._Scene;
var { angleBetween: angleBetween3, isNumber: isNumber3, sanitizeHtml: sanitizeHtml9 } = import_ag_charts_community98._Util;
var RadialBarSeriesNodeEvent = class extends import_ag_charts_community98._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadialBarSeries = class extends import_ag_charts_community98._ModuleSupport.PolarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      useLabelLayer: true,
      canHaveAxes: true,
      animationResetFns: {
        item: resetRadialBarSelectionsFn,
        label: resetLabelFn2
      }
    });
    this.properties = new RadialBarSeriesProperties();
    this.NodeEvent = RadialBarSeriesNodeEvent;
    this.nodeData = [];
    this.groupScale = new BandScale4();
    this.circleCache = { r: 0, cx: 0, cy: 0 };
  }
  nodeFactory() {
    return new Sector4();
  }
  addChartEventListeners() {
    var _a2, _b;
    this.destroyFns.push(
      (_a2 = this.ctx.chartEventManager) == null ? void 0 : _a2.addListener("legend-item-click", (event) => this.onLegendItemClick(event)),
      (_b = this.ctx.chartEventManager) == null ? void 0 : _b.addListener(
        "legend-item-double-click",
        (event) => this.onLegendItemDoubleClick(event)
      )
    );
  }
  getSeriesDomain(direction) {
    const { axes, dataModel, processedData } = this;
    if (!processedData || !dataModel)
      return [];
    if (direction === ChartAxisDirection14.X) {
      const angleAxis = axes[ChartAxisDirection14.X];
      const xExtent = dataModel.getDomain(this, "angleValue-end", "value", processedData);
      const fixedXExtent = [xExtent[0] > 0 ? 0 : xExtent[0], xExtent[1] < 0 ? 0 : xExtent[1]];
      return fixNumericExtent6(fixedXExtent, angleAxis);
    } else {
      return dataModel.getDomain(this, "radiusValue", "key", processedData);
    }
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2;
      if (!this.properties.isValid()) {
        return;
      }
      const stackGroupId = this.getStackId();
      const stackGroupTrailingId = `${stackGroupId}-trailing`;
      const { angleKey, radiusKey, normalizedTo, visible } = this.properties;
      const extraProps = [];
      if (isDefined4(normalizedTo)) {
        extraProps.push(
          normaliseGroupTo2(this, [stackGroupId, stackGroupTrailingId], Math.abs(normalizedTo), "range")
        );
      }
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      if (animationEnabled) {
        if (this.processedData) {
          extraProps.push(diff5(this.processedData));
        }
        extraProps.push(animationValidation6(this));
      }
      const visibleProps = this.visible || !animationEnabled ? {} : { forceValue: 0 };
      yield this.requestDataModel(dataController, (_a2 = this.data) != null ? _a2 : [], {
        props: [
          keyProperty5(this, radiusKey, false, { id: "radiusValue" }),
          valueProperty11(this, angleKey, true, __spreadValues({
            id: "angleValue-raw",
            invalidValue: null
          }, visibleProps)),
          ...groupAccumulativeValueProperty3(this, angleKey, true, "normal", "current", __spreadValues({
            id: `angleValue-end`,
            invalidValue: null,
            groupId: stackGroupId
          }, visibleProps)),
          ...groupAccumulativeValueProperty3(this, angleKey, true, "trailing", "current", __spreadValues({
            id: `angleValue-start`,
            invalidValue: null,
            groupId: stackGroupTrailingId
          }, visibleProps)),
          ...extraProps
        ],
        dataVisible: visible || animationEnabled
      });
      this.animationState.transition("updateData");
    });
  }
  didCircleChange() {
    const r = this.radius;
    const cx = this.centerX;
    const cy = this.centerY;
    const cache = this.circleCache;
    if (!(r === cache.r && cx === cache.cx && cy === cache.cy)) {
      this.circleCache = { r, cx, cy };
      return true;
    }
    return false;
  }
  maybeRefreshNodeData() {
    return __async(this, null, function* () {
      const circleChanged = this.didCircleChange();
      if (!circleChanged && !this.nodeDataRefresh)
        return;
      const [{ nodeData = [] } = {}] = yield this.createNodeData();
      this.nodeData = nodeData;
      this.nodeDataRefresh = false;
    });
  }
  getAxisInnerRadius() {
    const radiusAxis = this.axes[ChartAxisDirection14.Y];
    return radiusAxis instanceof PolarAxis3 ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b;
      const { processedData, dataModel } = this;
      if (!processedData || !dataModel || !this.properties.isValid()) {
        return [];
      }
      const angleAxis = this.axes[ChartAxisDirection14.X];
      const radiusAxis = this.axes[ChartAxisDirection14.Y];
      const angleScale = angleAxis == null ? void 0 : angleAxis.scale;
      const radiusScale = radiusAxis == null ? void 0 : radiusAxis.scale;
      if (!angleScale || !radiusScale) {
        return [];
      }
      const angleStartIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-start`).index;
      const angleEndIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-end`).index;
      const angleRawIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-raw`).index;
      let groupPaddingInner = 0;
      if (radiusAxis instanceof RadiusCategoryAxis) {
        groupPaddingInner = radiusAxis.groupPaddingInner;
      }
      const { groupScale } = this;
      const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
      groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
      groupScale.range = [0, Math.abs((_a2 = radiusScale.bandwidth) != null ? _a2 : 0)];
      groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;
      const barWidth = groupScale.bandwidth >= 1 ? groupScale.bandwidth : groupScale.rawBandwidth;
      const radiusAxisReversed = (_b = this.axes[ChartAxisDirection14.Y]) == null ? void 0 : _b.isReversed();
      const axisInnerRadius = radiusAxisReversed ? this.radius : this.getAxisInnerRadius();
      const axisOuterRadius = radiusAxisReversed ? this.getAxisInnerRadius() : this.radius;
      const axisTotalRadius = axisOuterRadius + axisInnerRadius;
      const { angleKey, radiusKey, angleName, radiusName, label } = this.properties;
      const getLabelNodeDatum = (datum, angleDatum, x, y) => {
        const labelText = this.getLabelText(
          label,
          { value: angleDatum, datum, angleKey, radiusKey, angleName, radiusName },
          (value) => isNumber3(value) ? value.toFixed(2) : String(value)
        );
        if (labelText) {
          return { x, y, text: labelText, textAlign: "center", textBaseline: "middle" };
        }
      };
      const nodeData = processedData.data.map((group, index) => {
        const { datum, keys, values } = group;
        const radiusDatum = keys[0];
        const angleDatum = values[angleRawIndex];
        const angleStartDatum = values[angleStartIndex];
        const angleEndDatum = values[angleEndIndex];
        let startAngle = Math.max(angleScale.convert(angleStartDatum), angleScale.range[0]);
        let endAngle = Math.min(angleScale.convert(angleEndDatum), angleScale.range[1]);
        if (startAngle > endAngle) {
          [startAngle, endAngle] = [endAngle, startAngle];
        }
        if (angleDatum < 0) {
          [startAngle, endAngle] = [endAngle, startAngle];
        }
        const dataRadius = axisTotalRadius - radiusScale.convert(radiusDatum);
        const innerRadius = dataRadius + groupScale.convert(String(groupIndex));
        const outerRadius = innerRadius + barWidth;
        const midRadius = (innerRadius + outerRadius) / 2;
        const midAngle = startAngle + angleBetween3(startAngle, endAngle) / 2;
        const x = Math.cos(midAngle) * midRadius;
        const y = Math.sin(midAngle) * midRadius;
        const labelNodeDatum = this.properties.label.enabled ? getLabelNodeDatum(datum, angleDatum, x, y) : void 0;
        return {
          series: this,
          datum,
          point: { x, y, size: 0 },
          midPoint: { x, y },
          label: labelNodeDatum,
          angleValue: angleDatum,
          radiusValue: radiusDatum,
          innerRadius,
          outerRadius,
          startAngle,
          endAngle,
          index
        };
      });
      return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
    });
  }
  update(_0) {
    return __async(this, arguments, function* ({ seriesRect }) {
      const resize = this.checkResize(seriesRect);
      yield this.maybeRefreshNodeData();
      this.contentGroup.translationX = this.centerX;
      this.contentGroup.translationY = this.centerY;
      this.highlightGroup.translationX = this.centerX;
      this.highlightGroup.translationY = this.centerY;
      if (this.labelGroup) {
        this.labelGroup.translationX = this.centerX;
        this.labelGroup.translationY = this.centerY;
      }
      this.updateSectorSelection(this.itemSelection, false);
      this.updateSectorSelection(this.highlightSelection, true);
      this.updateLabels();
      if (resize) {
        this.animationState.transition("resize");
      }
      this.animationState.transition("update");
    });
  }
  updateSectorSelection(selection, highlight) {
    var _a2, _b, _c, _d, _e;
    let selectionData = [];
    if (highlight) {
      const highlighted = (_a2 = this.ctx.highlightManager) == null ? void 0 : _a2.getActiveHighlight();
      if ((highlighted == null ? void 0 : highlighted.datum) && highlighted.series === this) {
        selectionData = [highlighted];
      }
    } else {
      selectionData = this.nodeData;
    }
    const highlightedStyle = highlight ? this.properties.highlightStyle.item : void 0;
    const fill = (_b = highlightedStyle == null ? void 0 : highlightedStyle.fill) != null ? _b : this.properties.fill;
    const fillOpacity = (_c = highlightedStyle == null ? void 0 : highlightedStyle.fillOpacity) != null ? _c : this.properties.fillOpacity;
    const stroke = (_d = highlightedStyle == null ? void 0 : highlightedStyle.stroke) != null ? _d : this.properties.stroke;
    const strokeOpacity = this.properties.strokeOpacity;
    const strokeWidth = (_e = highlightedStyle == null ? void 0 : highlightedStyle.strokeWidth) != null ? _e : this.properties.strokeWidth;
    const idFn = (datum) => datum.radiusValue;
    selection.update(selectionData, void 0, idFn).each((node, datum) => {
      var _a3, _b2, _c2, _d2, _e2;
      const format = this.properties.formatter ? this.ctx.callbackCache.call(this.properties.formatter, {
        datum,
        fill,
        stroke,
        strokeWidth,
        highlighted: highlight,
        angleKey: this.properties.angleKey,
        radiusKey: this.properties.radiusKey,
        seriesId: this.id
      }) : void 0;
      node.fill = (_a3 = format == null ? void 0 : format.fill) != null ? _a3 : fill;
      node.fillOpacity = (_b2 = format == null ? void 0 : format.fillOpacity) != null ? _b2 : fillOpacity;
      node.stroke = (_c2 = format == null ? void 0 : format.stroke) != null ? _c2 : stroke;
      node.strokeOpacity = strokeOpacity;
      node.strokeWidth = (_d2 = format == null ? void 0 : format.strokeWidth) != null ? _d2 : strokeWidth;
      node.lineDash = this.properties.lineDash;
      node.lineJoin = "round";
      node.inset = stroke != null ? ((_e2 = format == null ? void 0 : format.strokeWidth) != null ? _e2 : strokeWidth) / 2 : 0;
      if (highlight) {
        node.startAngle = datum.startAngle;
        node.endAngle = datum.endAngle;
        node.innerRadius = datum.innerRadius;
        node.outerRadius = datum.outerRadius;
      }
    });
  }
  updateLabels() {
    const { label } = this.properties;
    this.labelSelection.update(this.nodeData).each((node, datum) => {
      if (label.enabled && datum.label) {
        node.x = datum.label.x;
        node.y = datum.label.y;
        node.fill = label.color;
        node.fontFamily = label.fontFamily;
        node.fontSize = label.fontSize;
        node.fontStyle = label.fontStyle;
        node.fontWeight = label.fontWeight;
        node.text = datum.label.text;
        node.textAlign = datum.label.textAlign;
        node.textBaseline = datum.label.textBaseline;
        node.visible = true;
      } else {
        node.visible = false;
      }
    });
  }
  getBarTransitionFunctions() {
    var _a2;
    const angleScale = (_a2 = this.axes[ChartAxisDirection14.X]) == null ? void 0 : _a2.scale;
    let axisZeroAngle = 0;
    if (!angleScale) {
      return prepareRadialBarSeriesAnimationFunctions(axisZeroAngle);
    }
    const d0 = Math.min(angleScale.domain[0], angleScale.domain[1]);
    const d1 = Math.max(angleScale.domain[0], angleScale.domain[1]);
    if (d0 <= 0 && d1 >= 0) {
      axisZeroAngle = angleScale.convert(0);
    }
    return prepareRadialBarSeriesAnimationFunctions(axisZeroAngle);
  }
  animateEmptyUpdateReady() {
    const { labelSelection } = this;
    const fns = this.getBarTransitionFunctions();
    motion7.fromToMotion(this.id, "datums", this.ctx.animationManager, [this.itemSelection], fns);
    seriesLabelFadeInAnimation4(this, "labels", this.ctx.animationManager, [labelSelection]);
  }
  animateClearingUpdateEmpty() {
    const { itemSelection } = this;
    const { animationManager } = this.ctx;
    const fns = this.getBarTransitionFunctions();
    motion7.fromToMotion(this.id, "datums", animationManager, [itemSelection], fns);
    seriesLabelFadeOutAnimation2(this, "labels", animationManager, [this.labelSelection]);
  }
  getTooltipHtml(nodeDatum) {
    var _a2;
    const { id: seriesId, axes, dataModel } = this;
    const { angleKey, angleName, radiusKey, radiusName, fill, stroke, strokeWidth, formatter, tooltip } = this.properties;
    const { angleValue, radiusValue, datum } = nodeDatum;
    const xAxis = axes[ChartAxisDirection14.X];
    const yAxis = axes[ChartAxisDirection14.Y];
    if (!this.properties.isValid() || !(xAxis && yAxis && isNumber3(angleValue)) || !dataModel) {
      return "";
    }
    const angleString = xAxis.formatDatum(angleValue);
    const radiusString = yAxis.formatDatum(radiusValue);
    const title = sanitizeHtml9(angleName);
    const content = sanitizeHtml9(`${radiusString}: ${angleString}`);
    const { fill: color } = (_a2 = formatter && this.ctx.callbackCache.call(formatter, {
      datum,
      fill,
      stroke,
      strokeWidth,
      highlighted: false,
      angleKey,
      radiusKey,
      seriesId
    })) != null ? _a2 : { fill };
    return tooltip.toTooltipHtml(
      { title, backgroundColor: fill, content },
      { seriesId, datum, color, title, angleKey, radiusKey, angleName, radiusName }
    );
  }
  getLegendData(legendType) {
    var _a2;
    if (!((_a2 = this.data) == null ? void 0 : _a2.length) || !this.properties.isValid() || legendType !== "category") {
      return [];
    }
    const { angleKey, angleName, fill, stroke, fillOpacity, strokeOpacity, strokeWidth, visible } = this.properties;
    return [
      {
        legendType: "category",
        id: this.id,
        itemId: angleKey,
        seriesId: this.id,
        enabled: visible,
        label: {
          text: angleName != null ? angleName : angleKey
        },
        marker: {
          fill: fill != null ? fill : "rgba(0, 0, 0, 0)",
          stroke: stroke != null ? stroke : "rgba(0, 0, 0, 0)",
          fillOpacity: fillOpacity != null ? fillOpacity : 1,
          strokeOpacity: strokeOpacity != null ? strokeOpacity : 1,
          strokeWidth
        }
      }
    ];
  }
  onLegendItemClick(event) {
    const { enabled, itemId, series } = event;
    if (series.id === this.id) {
      this.toggleSeriesItem(itemId, enabled);
    }
  }
  onLegendItemDoubleClick(event) {
    const { enabled, itemId, series, numVisibleItems } = event;
    const wasClicked = series.id === this.id;
    const newEnabled = wasClicked || enabled && numVisibleItems === 1;
    this.toggleSeriesItem(itemId, newEnabled);
  }
  computeLabelsBBox() {
    return null;
  }
  getStackId() {
    var _a2, _b;
    const groupIndex = (_b = (_a2 = this.seriesGrouping) == null ? void 0 : _a2.groupIndex) != null ? _b : this.id;
    return `radialBar-stack-${groupIndex}-xValues`;
  }
};
RadialBarSeries.className = "RadialBarSeries";
RadialBarSeries.type = "radial-bar";

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarThemes.ts
var import_ag_charts_community99 = require("ag-charts-community");
var RADIAL_BAR_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community99._Theme.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community99._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community99._Theme.DEFAULT_INVERTED_LABEL_COLOUR,
      __overrides__: import_ag_charts_community99._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [import_ag_charts_community99._Theme.POLAR_AXIS_TYPE.RADIUS_CATEGORY]: {
      innerRadiusRatio: 0.2,
      groupPaddingInner: 0.2,
      paddingInner: 0.2,
      paddingOuter: 0.1
    }
  }
};

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarModule.ts
var RadialBarModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radial-bar",
  instanceConstructor: RadialBarSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community100._Theme.POLAR_AXIS_TYPE.ANGLE_NUMBER
    },
    {
      type: import_ag_charts_community100._Theme.POLAR_AXIS_TYPE.RADIUS_CATEGORY
    }
  ],
  themeTemplate: RADIAL_BAR_SERIES_THEME,
  paletteFactory: ({ takeColors }) => {
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      fill,
      stroke
    };
  },
  stackable: true,
  groupable: true
};

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnModule.ts
var import_ag_charts_community104 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeries.ts
var import_ag_charts_community102 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesProperties.ts
var import_ag_charts_community101 = require("ag-charts-community");
var { Validate: Validate44, RATIO: RATIO23 } = import_ag_charts_community101._ModuleSupport;
var RadialColumnSeriesProperties = class extends RadialColumnSeriesBaseProperties {
};
__decorateClass([
  Validate44(RATIO23, { optional: true })
], RadialColumnSeriesProperties.prototype, "columnWidthRatio", 2);
__decorateClass([
  Validate44(RATIO23, { optional: true })
], RadialColumnSeriesProperties.prototype, "maxColumnWidthRatio", 2);

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeries.ts
var { ChartAxisDirection: ChartAxisDirection15, PolarAxis: PolarAxis4 } = import_ag_charts_community102._ModuleSupport;
var { RadialColumnShape, getRadialColumnWidth } = import_ag_charts_community102._Scene;
var RadialColumnSeries = class extends RadialColumnSeriesBase {
  constructor(moduleCtx) {
    super(moduleCtx, {
      animationResetFns: {
        item: resetRadialColumnSelectionFn
      }
    });
    this.properties = new RadialColumnSeriesProperties();
  }
  getStackId() {
    var _a2, _b;
    const groupIndex = (_b = (_a2 = this.seriesGrouping) == null ? void 0 : _a2.groupIndex) != null ? _b : this.id;
    return `radarColumn-stack-${groupIndex}-yValues`;
  }
  nodeFactory() {
    return new RadialColumnShape();
  }
  getColumnTransitionFunctions() {
    const axisZeroRadius = this.isRadiusAxisReversed() ? this.radius : this.getAxisInnerRadius();
    return prepareRadialColumnAnimationFunctions(axisZeroRadius);
  }
  isRadiusAxisCircle() {
    const radiusAxis = this.axes[ChartAxisDirection15.Y];
    return radiusAxis instanceof PolarAxis4 ? radiusAxis.shape === "circle" : false;
  }
  updateItemPath(node, datum, highlight) {
    node.isBeveled = this.isRadiusAxisCircle();
    node.isRadiusAxisReversed = this.isRadiusAxisReversed();
    if (highlight) {
      node.innerRadius = datum.innerRadius;
      node.outerRadius = datum.outerRadius;
      node.startAngle = datum.startAngle;
      node.endAngle = datum.endAngle;
      node.columnWidth = datum.columnWidth;
      node.axisInnerRadius = datum.axisInnerRadius;
      node.axisOuterRadius = datum.axisOuterRadius;
    }
  }
  getColumnWidth(startAngle, endAngle) {
    const { columnWidthRatio = 0.5, maxColumnWidthRatio = 0.5 } = this.properties;
    return getRadialColumnWidth(startAngle, endAngle, this.radius, columnWidthRatio, maxColumnWidthRatio);
  }
};
RadialColumnSeries.className = "RadialColumnSeries";
RadialColumnSeries.type = "radial-column";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnThemes.ts
var import_ag_charts_community103 = require("ag-charts-community");
var RADIAL_COLUMN_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community103._Theme.EXTENDS_SERIES_DEFAULTS,
    columnWidthRatio: 0.5,
    maxColumnWidthRatio: 0.5,
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community103._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community103._Theme.DEFAULT_LABEL_COLOUR,
      __overrides__: import_ag_charts_community103._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [import_ag_charts_community103._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      shape: import_ag_charts_community103._Theme.POLAR_AXIS_SHAPE.CIRCLE,
      groupPaddingInner: 0,
      paddingInner: 0,
      label: {
        padding: 10
      }
    },
    [import_ag_charts_community103._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
      shape: import_ag_charts_community103._Theme.POLAR_AXIS_SHAPE.CIRCLE,
      innerRadiusRatio: 0.5
    }
  }
};

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnModule.ts
var RadialColumnModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radial-column",
  instanceConstructor: RadialColumnSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community104._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: import_ag_charts_community104._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER
    }
  ],
  themeTemplate: RADIAL_COLUMN_SERIES_THEME,
  paletteFactory: ({ takeColors }) => {
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      fill,
      stroke
    };
  },
  stackable: true,
  groupable: true
};

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaModule.ts
var import_ag_charts_community108 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/range-area/rangeArea.ts
var import_ag_charts_community106 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaProperties.ts
var import_ag_charts_community105 = require("ag-charts-community");
var { DropShadow, Label: Label7 } = import_ag_charts_community105._Scene;
var {
  CartesianSeriesProperties: CartesianSeriesProperties2,
  SeriesMarker: SeriesMarker2,
  SeriesTooltip: SeriesTooltip13,
  Validate: Validate45,
  BOOLEAN: BOOLEAN15,
  COLOR_STRING: COLOR_STRING18,
  LINE_DASH: LINE_DASH14,
  OBJECT: OBJECT16,
  PLACEMENT,
  POSITIVE_NUMBER: POSITIVE_NUMBER20,
  RATIO: RATIO24,
  STRING: STRING15
} = import_ag_charts_community105._ModuleSupport;
var RangeAreaSeriesLabel = class extends Label7 {
  constructor() {
    super(...arguments);
    this.placement = "outside";
    this.padding = 6;
  }
};
__decorateClass([
  Validate45(PLACEMENT)
], RangeAreaSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate45(POSITIVE_NUMBER20)
], RangeAreaSeriesLabel.prototype, "padding", 2);
var RangeAreaProperties = class extends CartesianSeriesProperties2 {
  constructor() {
    super(...arguments);
    this.fill = "#99CCFF";
    this.fillOpacity = 1;
    this.stroke = "#99CCFF";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.shadow = new DropShadow().set({ enabled: false });
    this.marker = new SeriesMarker2();
    this.label = new RangeAreaSeriesLabel();
    this.tooltip = new SeriesTooltip13();
    this.connectMissingData = false;
  }
};
__decorateClass([
  Validate45(STRING15)
], RangeAreaProperties.prototype, "xKey", 2);
__decorateClass([
  Validate45(STRING15)
], RangeAreaProperties.prototype, "yLowKey", 2);
__decorateClass([
  Validate45(STRING15)
], RangeAreaProperties.prototype, "yHighKey", 2);
__decorateClass([
  Validate45(STRING15, { optional: true })
], RangeAreaProperties.prototype, "xName", 2);
__decorateClass([
  Validate45(STRING15, { optional: true })
], RangeAreaProperties.prototype, "yName", 2);
__decorateClass([
  Validate45(STRING15, { optional: true })
], RangeAreaProperties.prototype, "yLowName", 2);
__decorateClass([
  Validate45(STRING15, { optional: true })
], RangeAreaProperties.prototype, "yHighName", 2);
__decorateClass([
  Validate45(COLOR_STRING18)
], RangeAreaProperties.prototype, "fill", 2);
__decorateClass([
  Validate45(RATIO24)
], RangeAreaProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate45(COLOR_STRING18)
], RangeAreaProperties.prototype, "stroke", 2);
__decorateClass([
  Validate45(POSITIVE_NUMBER20)
], RangeAreaProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate45(RATIO24)
], RangeAreaProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate45(LINE_DASH14)
], RangeAreaProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate45(POSITIVE_NUMBER20)
], RangeAreaProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate45(OBJECT16)
], RangeAreaProperties.prototype, "shadow", 2);
__decorateClass([
  Validate45(OBJECT16)
], RangeAreaProperties.prototype, "marker", 2);
__decorateClass([
  Validate45(OBJECT16)
], RangeAreaProperties.prototype, "label", 2);
__decorateClass([
  Validate45(OBJECT16)
], RangeAreaProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate45(BOOLEAN15)
], RangeAreaProperties.prototype, "connectMissingData", 2);

// packages/ag-charts-enterprise/src/series/range-area/rangeArea.ts
var {
  valueProperty: valueProperty12,
  keyProperty: keyProperty6,
  ChartAxisDirection: ChartAxisDirection16,
  mergeDefaults: mergeDefaults6,
  updateLabelNode,
  fixNumericExtent: fixNumericExtent7,
  AreaSeriesTag,
  buildResetPathFn,
  resetLabelFn: resetLabelFn3,
  resetMarkerFn: resetMarkerFn2,
  resetMarkerPositionFn,
  pathSwipeInAnimation,
  resetMotion,
  markerSwipeScaleInAnimation,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation5,
  animationValidation: animationValidation7,
  diff: diff6,
  updateClipPath
} = import_ag_charts_community106._ModuleSupport;
var { getMarker: getMarker3, PointerEvents: PointerEvents7 } = import_ag_charts_community106._Scene;
var { sanitizeHtml: sanitizeHtml10, extent: extent4, isNumber: isNumber4 } = import_ag_charts_community106._Util;
var RangeAreaSeriesNodeEvent = class extends import_ag_charts_community106._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.yLowKey = series.properties.yLowKey;
    this.yHighKey = series.properties.yHighKey;
  }
};
var _RangeAreaSeries = class _RangeAreaSeries extends import_ag_charts_community106._ModuleSupport.CartesianSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      hasMarkers: true,
      pathsPerSeries: 2,
      directionKeys: {
        [ChartAxisDirection16.X]: ["xKey"],
        [ChartAxisDirection16.Y]: ["yLowKey", "yHighKey"]
      },
      directionNames: {
        [ChartAxisDirection16.X]: ["xName"],
        [ChartAxisDirection16.Y]: ["yLowName", "yHighName", "yName"]
      },
      animationResetFns: {
        path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
        label: resetLabelFn3,
        marker: (node, datum) => __spreadValues(__spreadValues({}, resetMarkerFn2(node)), resetMarkerPositionFn(node, datum))
      }
    });
    this.properties = new RangeAreaProperties();
    this.NodeEvent = RangeAreaSeriesNodeEvent;
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2;
      if (!this.properties.isValid()) {
        return;
      }
      const { xKey, yLowKey, yHighKey } = this.properties;
      const { isContinuousX, isContinuousY } = this.isContinuous();
      const extraProps = [];
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      if (!this.ctx.animationManager.isSkipped() && this.processedData) {
        extraProps.push(diff6(this.processedData));
      }
      if (animationEnabled) {
        extraProps.push(animationValidation7(this));
      }
      yield this.requestDataModel(dataController, (_a2 = this.data) != null ? _a2 : [], {
        props: [
          keyProperty6(this, xKey, isContinuousX, { id: `xValue` }),
          valueProperty12(this, yLowKey, isContinuousY, { id: `yLowValue`, invalidValue: void 0 }),
          valueProperty12(this, yHighKey, isContinuousY, { id: `yHighValue`, invalidValue: void 0 }),
          ...extraProps
        ],
        dataVisible: this.visible
      });
      this.animationState.transition("updateData");
    });
  }
  getSeriesDomain(direction) {
    const { processedData, dataModel, axes } = this;
    if (!(processedData && dataModel))
      return [];
    const {
      domain: {
        keys: [keys],
        values
      }
    } = processedData;
    if (direction === ChartAxisDirection16.X) {
      const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
      const xAxis = axes[ChartAxisDirection16.X];
      if ((keyDef == null ? void 0 : keyDef.def.type) === "key" && keyDef.def.valueType === "category") {
        return keys;
      }
      return fixNumericExtent7(extent4(keys), xAxis);
    } else {
      const yLowIndex = dataModel.resolveProcessedDataIndexById(this, "yLowValue").index;
      const yLowExtent = values[yLowIndex];
      const yHighIndex = dataModel.resolveProcessedDataIndexById(this, "yHighValue").index;
      const yHighExtent = values[yHighIndex];
      const fixedYExtent = [
        yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
        yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1]
      ];
      return fixNumericExtent7(fixedYExtent);
    }
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b;
      const { data, dataModel, axes, visible } = this;
      const xAxis = axes[ChartAxisDirection16.X];
      const yAxis = axes[ChartAxisDirection16.Y];
      if (!(data && visible && xAxis && yAxis && dataModel)) {
        return [];
      }
      const xScale = xAxis.scale;
      const yScale = yAxis.scale;
      const { xKey, yLowKey, yHighKey, connectMissingData, marker } = this.properties;
      const itemId = `${yLowKey}-${yHighKey}`;
      const xOffset = ((_a2 = xScale.bandwidth) != null ? _a2 : 0) / 2;
      const defs = dataModel.resolveProcessedDataDefsByIds(this, [`xValue`, `yHighValue`, `yLowValue`]);
      const createCoordinates = (xValue, yHigh, yLow) => {
        const x = xScale.convert(xValue) + xOffset;
        const yHighCoordinate = yScale.convert(yHigh);
        const yLowCoordinate = yScale.convert(yLow);
        return [
          { point: { x, y: yHighCoordinate }, size: marker.size, itemId: `high`, yValue: yHigh, xValue },
          { point: { x, y: yLowCoordinate }, size: marker.size, itemId: `low`, yValue: yLow, xValue }
        ];
      };
      const createMovePoint = (plainPoint) => {
        const _a3 = plainPoint, { point } = _a3, stroke = __objRest(_a3, ["point"]);
        return __spreadProps(__spreadValues({}, stroke), { point: __spreadProps(__spreadValues({}, point), { moveTo: true }) });
      };
      const labelData = [];
      const markerData = [];
      const strokeData = { itemId, points: [] };
      const fillData = { itemId, points: [] };
      const context = {
        itemId,
        labelData,
        nodeData: markerData,
        fillData,
        strokeData,
        scales: __superGet(_RangeAreaSeries.prototype, this, "calculateScaling").call(this),
        visible: this.visible
      };
      const fillHighPoints = fillData.points;
      const fillLowPoints = [];
      const strokeHighPoints = strokeData.points;
      const strokeLowPoints = [];
      let lastXValue;
      let lastYHighDatum = -Infinity;
      let lastYLowDatum = -Infinity;
      (_b = this.processedData) == null ? void 0 : _b.data.forEach(({ keys, datum, values }, datumIdx) => {
        const dataValues = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
        const { xValue, yHighValue, yLowValue } = dataValues;
        const invalidRange = yHighValue == null || yLowValue == null;
        const points = invalidRange ? [] : createCoordinates(xValue, yHighValue, yLowValue);
        const inverted = yLowValue > yHighValue;
        points.forEach(({ point: { x, y }, size, itemId: datumItemId = "", yValue }) => {
          markerData.push({
            index: datumIdx,
            series: this,
            itemId: datumItemId,
            datum,
            midPoint: { x, y },
            yHighValue,
            yLowValue,
            xValue,
            xKey,
            yLowKey,
            yHighKey,
            point: { x, y, size }
          });
          const labelDatum = this.createLabelData({
            point: { x, y },
            value: yValue,
            yLowValue,
            yHighValue,
            itemId: datumItemId,
            inverted,
            datum,
            series: this
          });
          labelData.push(labelDatum);
        });
        const lastYValid = lastYHighDatum != null && lastYLowDatum != null;
        const lastValid = lastXValue != null && lastYValid;
        const xValid = xValue != null;
        const yValid = yHighValue != null && yLowValue != null;
        let [high, low] = createCoordinates(xValue, yHighValue != null ? yHighValue : 0, yLowValue != null ? yLowValue : 0);
        if (!connectMissingData) {
          if (!yValid) {
            const [prevHigh, prevLow] = createCoordinates(lastXValue, 0, 0);
            fillHighPoints.push(prevHigh);
            fillLowPoints.push(prevLow);
          } else if (!lastYValid) {
            const [prevHigh, prevLow] = createCoordinates(xValue, 0, 0);
            fillHighPoints.push(prevHigh);
            fillLowPoints.push(prevLow);
          }
        }
        if (xValid && yValid) {
          fillHighPoints.push(high);
          fillLowPoints.push(low);
        }
        const move = xValid && yValid && !lastValid && !connectMissingData && datumIdx > 0;
        if (move) {
          high = createMovePoint(high);
          low = createMovePoint(low);
        }
        if (xValid && yValid) {
          strokeHighPoints.push(high);
          strokeLowPoints.push(low);
        }
        lastXValue = xValue;
        lastYHighDatum = yHighValue;
        lastYLowDatum = yLowValue;
      });
      if (fillHighPoints.length > 0) {
        fillHighPoints[0] = createMovePoint(fillHighPoints[0]);
      }
      fillHighPoints.push(...fillLowPoints.reverse());
      if (strokeLowPoints.length > 0) {
        strokeLowPoints[0] = createMovePoint(strokeLowPoints[0]);
      }
      strokeHighPoints.push(...strokeLowPoints);
      return [context];
    });
  }
  createLabelData({
    point,
    value,
    itemId,
    inverted,
    datum,
    series
  }) {
    const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, label } = this.properties;
    const { placement, padding = 10 } = label;
    let actualItemId = itemId;
    if (inverted) {
      actualItemId = itemId === "low" ? "high" : "low";
    }
    const direction = placement === "outside" && actualItemId === "high" || placement === "inside" && actualItemId === "low" ? -1 : 1;
    return {
      x: point.x,
      y: point.y + padding * direction,
      series,
      itemId,
      datum,
      text: this.getLabelText(
        label,
        { value, datum, itemId, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName },
        (v) => isNumber4(v) ? v.toFixed(2) : String(v)
      ),
      textAlign: "center",
      textBaseline: direction === -1 ? "bottom" : "top"
    };
  }
  isPathOrSelectionDirty() {
    return this.properties.marker.isDirty();
  }
  markerFactory() {
    const { shape } = this.properties.marker;
    const MarkerShape = getMarker3(shape);
    return new MarkerShape();
  }
  updatePathNodes(opts) {
    return __async(this, null, function* () {
      const { opacity, visible } = opts;
      const [fill, stroke] = opts.paths;
      const strokeWidth = this.getStrokeWidth(this.properties.strokeWidth);
      stroke.setProperties({
        tag: AreaSeriesTag.Stroke,
        fill: void 0,
        lineJoin: stroke.lineCap = "round",
        pointerEvents: PointerEvents7.None,
        stroke: this.properties.stroke,
        strokeWidth,
        strokeOpacity: this.properties.strokeOpacity,
        lineDash: this.properties.lineDash,
        lineDashOffset: this.properties.lineDashOffset,
        opacity,
        visible
      });
      fill.setProperties({
        tag: AreaSeriesTag.Fill,
        stroke: void 0,
        lineJoin: "round",
        pointerEvents: PointerEvents7.None,
        fill: this.properties.fill,
        fillOpacity: this.properties.fillOpacity,
        lineDash: this.properties.lineDash,
        lineDashOffset: this.properties.lineDashOffset,
        strokeOpacity: this.properties.strokeOpacity,
        fillShadow: this.properties.shadow,
        strokeWidth,
        opacity,
        visible
      });
      updateClipPath(this, stroke);
      updateClipPath(this, fill);
    });
  }
  updatePaths(opts) {
    return __async(this, null, function* () {
      this.updateAreaPaths([opts.paths], [opts.contextData]);
    });
  }
  updateAreaPaths(paths, contextData) {
    this.updateFillPath(paths, contextData);
    this.updateStrokePath(paths, contextData);
  }
  updateFillPath(paths, contextData) {
    contextData.forEach(({ fillData }, contextDataIndex) => {
      const [fill] = paths[contextDataIndex];
      const { path: fillPath } = fill;
      fillPath.clear({ trackChanges: true });
      for (const { point } of fillData.points) {
        if (point.moveTo) {
          fillPath.moveTo(point.x, point.y);
        } else {
          fillPath.lineTo(point.x, point.y);
        }
      }
      fillPath.closePath();
      fill.checkPathDirty();
    });
  }
  updateStrokePath(paths, contextData) {
    contextData.forEach(({ strokeData }, contextDataIndex) => {
      const [, stroke] = paths[contextDataIndex];
      const { path: strokePath } = stroke;
      strokePath.clear({ trackChanges: true });
      for (const { point } of strokeData.points) {
        if (point.moveTo) {
          strokePath.moveTo(point.x, point.y);
        } else {
          strokePath.lineTo(point.x, point.y);
        }
      }
      stroke.checkPathDirty();
    });
  }
  updateMarkerSelection(opts) {
    return __async(this, null, function* () {
      const { nodeData, markerSelection } = opts;
      if (this.properties.marker.isDirty()) {
        markerSelection.clear();
        markerSelection.cleanup();
      }
      return markerSelection.update(this.properties.marker.enabled ? nodeData : []);
    });
  }
  updateMarkerNodes(opts) {
    return __async(this, null, function* () {
      const { markerSelection, isHighlight: highlighted } = opts;
      const { xKey, yLowKey, yHighKey, marker, fill, stroke, strokeWidth, fillOpacity, strokeOpacity } = this.properties;
      const baseStyle = mergeDefaults6(highlighted && this.properties.highlightStyle.item, marker.getStyle(), {
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity
      });
      markerSelection.each((node, datum) => {
        this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yHighKey, yLowKey }, baseStyle);
      });
      if (!highlighted) {
        this.properties.marker.markClean();
      }
    });
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      const { labelData, labelSelection } = opts;
      return labelSelection.update(labelData, (text) => {
        text.tag = AreaSeriesTag.Label;
        text.pointerEvents = PointerEvents7.None;
      });
    });
  }
  updateLabelNodes(opts) {
    return __async(this, null, function* () {
      opts.labelSelection.each((textNode, datum) => {
        updateLabelNode(textNode, this.properties.label, datum);
      });
    });
  }
  getHighlightLabelData(labelData, highlightedItem) {
    const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
    return labelItems.length > 0 ? labelItems : void 0;
  }
  getHighlightData(nodeData, highlightedItem) {
    const highlightItems = nodeData.filter((nodeDatum) => nodeDatum.datum === highlightedItem.datum);
    return highlightItems.length > 0 ? highlightItems : void 0;
  }
  getTooltipHtml(nodeDatum) {
    const xAxis = this.axes[ChartAxisDirection16.X];
    const yAxis = this.axes[ChartAxisDirection16.Y];
    if (!this.properties.isValid() || !xAxis || !yAxis) {
      return "";
    }
    const { id: seriesId } = this;
    const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, fill, tooltip } = this.properties;
    const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;
    const color = fill != null ? fill : "gray";
    const xString = sanitizeHtml10(xAxis.formatDatum(xValue));
    const yLowString = sanitizeHtml10(yAxis.formatDatum(yLowValue));
    const yHighString = sanitizeHtml10(yAxis.formatDatum(yHighValue));
    const xSubheading = xName != null ? xName : xKey;
    const yLowSubheading = yLowName != null ? yLowName : yLowKey;
    const yHighSubheading = yHighName != null ? yHighName : yHighKey;
    const title = sanitizeHtml10(yName);
    const content = yName ? `<b>${sanitizeHtml10(xSubheading)}</b>: ${xString}<br><b>${sanitizeHtml10(yLowSubheading)}</b>: ${yLowString}<br><b>${sanitizeHtml10(yHighSubheading)}</b>: ${yHighString}<br>` : `${xString}: ${yLowString} - ${yHighString}`;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      { seriesId, itemId, datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, color }
    );
  }
  getLegendData(legendType) {
    var _a2, _b;
    if (legendType !== "category") {
      return [];
    }
    const {
      yLowKey,
      yHighKey,
      yName,
      yLowName,
      yHighName,
      fill,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      visible,
      marker
    } = this.properties;
    const legendItemText = yName != null ? yName : `${yLowName != null ? yLowName : yLowKey} - ${yHighName != null ? yHighName : yHighKey}`;
    return [
      {
        legendType: "category",
        id: this.id,
        itemId: `${yLowKey}-${yHighKey}`,
        seriesId: this.id,
        enabled: visible,
        label: { text: `${legendItemText}` },
        marker: {
          shape: marker.shape,
          fill: (_a2 = marker.fill) != null ? _a2 : fill,
          stroke: (_b = marker.stroke) != null ? _b : stroke,
          fillOpacity: marker.fillOpacity,
          strokeOpacity: marker.strokeOpacity,
          strokeWidth: marker.strokeWidth
        },
        line: {
          stroke,
          strokeOpacity,
          strokeWidth,
          lineDash
        }
      }
    ];
  }
  isLabelEnabled() {
    return this.properties.label.enabled;
  }
  onDataChange() {
  }
  nodeFactory() {
    return new import_ag_charts_community106._Scene.Group();
  }
  animateEmptyUpdateReady(animationData) {
    const { markerSelections, labelSelections, contextData, paths } = animationData;
    const { animationManager } = this.ctx;
    this.updateAreaPaths(paths, contextData);
    pathSwipeInAnimation(this, animationManager, paths.flat());
    resetMotion(markerSelections, resetMarkerPositionFn);
    markerSwipeScaleInAnimation(this, animationManager, markerSelections);
    seriesLabelFadeInAnimation5(this, "labels", animationManager, labelSelections);
  }
  animateReadyResize(animationData) {
    const { contextData, paths } = animationData;
    this.updateAreaPaths(paths, contextData);
    super.animateReadyResize(animationData);
  }
  animateWaitingUpdateReady(animationData) {
    const { contextData, paths } = animationData;
    super.animateWaitingUpdateReady(animationData);
    this.updateAreaPaths(paths, contextData);
  }
};
_RangeAreaSeries.className = "RangeAreaSeries";
_RangeAreaSeries.type = "range-area";
var RangeAreaSeries = _RangeAreaSeries;

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaThemes.ts
var import_ag_charts_community107 = require("ag-charts-community");
var RANGE_AREA_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community107._Theme.EXTENDS_SERIES_DEFAULTS,
    fillOpacity: 0.7,
    nodeClickRange: "nearest",
    marker: {
      __extends__: import_ag_charts_community107._Theme.EXTENDS_CARTESIAN_MARKER_DEFAULTS,
      enabled: false,
      fillOpacity: 1,
      strokeWidth: 2,
      size: 6
    },
    label: {
      enabled: false,
      placement: "outside",
      padding: 10,
      fontSize: 12,
      fontFamily: import_ag_charts_community107._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community107._Theme.DEFAULT_LABEL_COLOUR,
      __overrides__: import_ag_charts_community107._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [import_ag_charts_community107._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        enabled: true,
        snap: false
      }
    }
  }
};

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaModule.ts
var { markerPaletteFactory: markerPaletteFactory2 } = import_ag_charts_community108._ModuleSupport;
var RangeAreaModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "range-area",
  instanceConstructor: RangeAreaSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community108._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community108._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community108._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community108._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: RANGE_AREA_SERIES_THEME,
  paletteFactory: (params) => {
    const { marker } = markerPaletteFactory2(params);
    return {
      fill: marker.fill,
      stroke: marker.stroke,
      marker
    };
  }
};

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarModule.ts
var import_ag_charts_community112 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/range-bar/rangeBar.ts
var import_ag_charts_community110 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarProperties.ts
var import_ag_charts_community109 = require("ag-charts-community");
var { DropShadow: DropShadow2, Label: Label8 } = import_ag_charts_community109._Scene;
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties4,
  SeriesTooltip: SeriesTooltip14,
  Validate: Validate46,
  COLOR_STRING: COLOR_STRING19,
  FUNCTION: FUNCTION13,
  LINE_DASH: LINE_DASH15,
  OBJECT: OBJECT17,
  PLACEMENT: PLACEMENT2,
  POSITIVE_NUMBER: POSITIVE_NUMBER21,
  RATIO: RATIO25,
  STRING: STRING16
} = import_ag_charts_community109._ModuleSupport;
var RangeBarSeriesLabel = class extends Label8 {
  constructor() {
    super(...arguments);
    this.placement = "inside";
    this.padding = 6;
  }
};
__decorateClass([
  Validate46(PLACEMENT2)
], RangeBarSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate46(POSITIVE_NUMBER21)
], RangeBarSeriesLabel.prototype, "padding", 2);
var RangeBarProperties = class extends AbstractBarSeriesProperties4 {
  constructor() {
    super(...arguments);
    this.fill = "#99CCFF";
    this.fillOpacity = 1;
    this.stroke = "#99CCFF";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.cornerRadius = 0;
    this.shadow = new DropShadow2().set({ enabled: false });
    this.label = new RangeBarSeriesLabel();
    this.tooltip = new SeriesTooltip14();
  }
};
__decorateClass([
  Validate46(STRING16)
], RangeBarProperties.prototype, "xKey", 2);
__decorateClass([
  Validate46(STRING16)
], RangeBarProperties.prototype, "yLowKey", 2);
__decorateClass([
  Validate46(STRING16)
], RangeBarProperties.prototype, "yHighKey", 2);
__decorateClass([
  Validate46(STRING16, { optional: true })
], RangeBarProperties.prototype, "xName", 2);
__decorateClass([
  Validate46(STRING16, { optional: true })
], RangeBarProperties.prototype, "yName", 2);
__decorateClass([
  Validate46(STRING16, { optional: true })
], RangeBarProperties.prototype, "yLowName", 2);
__decorateClass([
  Validate46(STRING16, { optional: true })
], RangeBarProperties.prototype, "yHighName", 2);
__decorateClass([
  Validate46(COLOR_STRING19)
], RangeBarProperties.prototype, "fill", 2);
__decorateClass([
  Validate46(RATIO25)
], RangeBarProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate46(COLOR_STRING19)
], RangeBarProperties.prototype, "stroke", 2);
__decorateClass([
  Validate46(POSITIVE_NUMBER21)
], RangeBarProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate46(RATIO25)
], RangeBarProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate46(LINE_DASH15)
], RangeBarProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate46(POSITIVE_NUMBER21)
], RangeBarProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate46(POSITIVE_NUMBER21)
], RangeBarProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate46(FUNCTION13, { optional: true })
], RangeBarProperties.prototype, "formatter", 2);
__decorateClass([
  Validate46(OBJECT17)
], RangeBarProperties.prototype, "shadow", 2);
__decorateClass([
  Validate46(OBJECT17)
], RangeBarProperties.prototype, "label", 2);
__decorateClass([
  Validate46(OBJECT17)
], RangeBarProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/range-bar/rangeBar.ts
var {
  SeriesNodePickMode: SeriesNodePickMode10,
  valueProperty: valueProperty13,
  keyProperty: keyProperty7,
  ChartAxisDirection: ChartAxisDirection17,
  getRectConfig,
  updateRect,
  checkCrisp,
  updateLabelNode: updateLabelNode2,
  SMALLEST_KEY_INTERVAL: SMALLEST_KEY_INTERVAL3,
  diff: diff7,
  prepareBarAnimationFunctions: prepareBarAnimationFunctions2,
  midpointStartingBarPosition,
  resetBarSelectionsFn: resetBarSelectionsFn2,
  fixNumericExtent: fixNumericExtent8,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation6,
  resetLabelFn: resetLabelFn4,
  animationValidation: animationValidation8,
  createDatumId: createDatumId7
} = import_ag_charts_community110._ModuleSupport;
var { Rect: Rect4, PointerEvents: PointerEvents8, motion: motion8 } = import_ag_charts_community110._Scene;
var { sanitizeHtml: sanitizeHtml11, isNumber: isNumber5, extent: extent5 } = import_ag_charts_community110._Util;
var { ContinuousScale: ContinuousScale3, OrdinalTimeScale: OrdinalTimeScale4 } = import_ag_charts_community110._Scale;
var RangeBarSeriesNodeEvent = class extends import_ag_charts_community110._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.yLowKey = series.properties.yLowKey;
    this.yHighKey = series.properties.yHighKey;
  }
};
var _RangeBarSeries = class _RangeBarSeries extends import_ag_charts_community110._ModuleSupport.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode10.EXACT_SHAPE_MATCH],
      hasHighlightedLabels: true,
      directionKeys: {
        x: ["xKey"],
        y: ["yLowKey", "yHighKey"]
      },
      directionNames: {
        x: ["xName"],
        y: ["yLowName", "yHighName", "yName"]
      },
      datumSelectionGarbageCollection: false,
      animationResetFns: {
        datum: resetBarSelectionsFn2,
        label: resetLabelFn4
      }
    });
    this.properties = new RangeBarProperties();
    this.NodeEvent = RangeBarSeriesNodeEvent;
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d, _e;
      if (!this.properties.isValid()) {
        return;
      }
      const { xKey, yLowKey, yHighKey } = this.properties;
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const yScale = (_b = this.getValueAxis()) == null ? void 0 : _b.scale;
      const isContinuousX = ContinuousScale3.is(xScale) || OrdinalTimeScale4.is(xScale);
      const isContinuousY = ContinuousScale3.is(yScale) || OrdinalTimeScale4.is(yScale);
      const xValueType = ContinuousScale3.is(xScale) ? "range" : "category";
      const extraProps = [];
      if (!this.ctx.animationManager.isSkipped()) {
        if (this.processedData) {
          extraProps.push(diff7(this.processedData));
        }
        extraProps.push(animationValidation8(this));
      }
      const visibleProps = this.visible ? {} : { forceValue: 0 };
      const { processedData } = yield this.requestDataModel(dataController, (_c = this.data) != null ? _c : [], {
        props: [
          keyProperty7(this, xKey, isContinuousX, { id: "xValue", valueType: xValueType }),
          valueProperty13(this, yLowKey, isContinuousY, __spreadValues({ id: `yLowValue` }, visibleProps)),
          valueProperty13(this, yHighKey, isContinuousY, __spreadValues({ id: `yHighValue` }, visibleProps)),
          ...isContinuousX ? [SMALLEST_KEY_INTERVAL3] : [],
          ...extraProps
        ],
        groupByKeys: true
      });
      this.smallestDataInterval = {
        x: (_e = (_d = processedData.reduced) == null ? void 0 : _d.smallestKeyInterval) != null ? _e : Infinity,
        y: Infinity
      };
      this.animationState.transition("updateData");
    });
  }
  getSeriesDomain(direction) {
    var _a2;
    const { processedData, dataModel } = this;
    if (!(processedData && dataModel))
      return [];
    const {
      domain: {
        keys: [keys],
        values
      }
    } = processedData;
    if (direction === this.getCategoryDirection()) {
      const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
      if ((keyDef == null ? void 0 : keyDef.def.type) === "key" && (keyDef == null ? void 0 : keyDef.def.valueType) === "category") {
        return keys;
      }
      const { reduced: { [SMALLEST_KEY_INTERVAL3.property]: smallestX } = {} } = processedData;
      const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
      const keysExtent = (_a2 = extent5(keys)) != null ? _a2 : [NaN, NaN];
      const categoryAxis = this.getCategoryAxis();
      const isReversed = categoryAxis == null ? void 0 : categoryAxis.isReversed();
      if (direction === ChartAxisDirection17.Y) {
        const d02 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
        const d12 = keysExtent[1] + (isReversed ? scalePadding : 0);
        return fixNumericExtent8([d02, d12], categoryAxis);
      }
      const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
      const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
      return fixNumericExtent8([d0, d1], categoryAxis);
    } else {
      const yLowIndex = dataModel.resolveProcessedDataIndexById(this, "yLowValue").index;
      const yLowExtent = values[yLowIndex];
      const yHighIndex = dataModel.resolveProcessedDataIndexById(this, "yHighValue").index;
      const yHighExtent = values[yHighIndex];
      const fixedYExtent = [
        yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
        yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1]
      ];
      return fixNumericExtent8(fixedYExtent);
    }
  }
  createNodeData() {
    return __async(this, null, function* () {
      const {
        data,
        dataModel,
        groupScale,
        processedData,
        properties: { visible }
      } = this;
      const xAxis = this.getCategoryAxis();
      const yAxis = this.getValueAxis();
      if (!(data && visible && xAxis && yAxis && dataModel)) {
        return [];
      }
      const xScale = xAxis.scale;
      const yScale = yAxis.scale;
      const barAlongX = this.getBarDirection() === ChartAxisDirection17.X;
      const { xKey, yLowKey, yHighKey, fill, stroke, strokeWidth } = this.properties;
      const itemId = `${yLowKey}-${yHighKey}`;
      const contexts = [];
      const yLowIndex = dataModel.resolveProcessedDataIndexById(this, `yLowValue`).index;
      const yHighIndex = dataModel.resolveProcessedDataIndexById(this, `yHighValue`).index;
      const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
      const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
      processedData == null ? void 0 : processedData.data.forEach(({ keys, datum, values }, dataIndex) => {
        values.forEach((value, contextIndex) => {
          var _a2;
          (_a2 = contexts[contextIndex]) != null ? _a2 : contexts[contextIndex] = {
            itemId,
            nodeData: [],
            labelData: [],
            scales: __superGet(_RangeBarSeries.prototype, this, "calculateScaling").call(this),
            visible: this.visible
          };
          const xDatum = keys[xIndex];
          const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex));
          const rawLowValue = value[yLowIndex];
          const rawHighValue = value[yHighIndex];
          const yLowValue = Math.min(rawLowValue, rawHighValue);
          const yHighValue = Math.max(rawLowValue, rawHighValue);
          const yLow = Math.round(yScale.convert(yLowValue));
          const yHigh = Math.round(yScale.convert(yHighValue));
          const y = yHigh;
          const bottomY = yLow;
          const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));
          const rect = {
            x: barAlongX ? Math.min(y, bottomY) : x,
            y: barAlongX ? x : Math.min(y, bottomY),
            width: barAlongX ? barHeight : barWidth,
            height: barAlongX ? barWidth : barHeight
          };
          const nodeMidPoint = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
          };
          const labelData = this.createLabelData({
            rect,
            barAlongX,
            yLowValue,
            yHighValue,
            datum: datum[contextIndex],
            series: this
          });
          const nodeDatum = {
            index: dataIndex,
            series: this,
            itemId,
            datum: datum[contextIndex],
            xValue: xDatum,
            yLowValue: rawLowValue,
            yHighValue: rawHighValue,
            yLowKey,
            yHighKey,
            xKey,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            midPoint: nodeMidPoint,
            fill,
            stroke,
            strokeWidth,
            opacity: 1,
            labels: labelData
          };
          contexts[contextIndex].nodeData.push(nodeDatum);
          contexts[contextIndex].labelData.push(...labelData);
        });
      });
      return contexts;
    });
  }
  createLabelData({
    rect,
    barAlongX,
    yLowValue,
    yHighValue,
    datum,
    series
  }) {
    const { xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, label } = this.properties;
    const labelParams = { datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName };
    const { placement, padding } = label;
    const paddingDirection = placement === "outside" ? 1 : -1;
    const labelPadding = padding * paddingDirection;
    const yLowLabel = {
      x: rect.x + (barAlongX ? -labelPadding : rect.width / 2),
      y: rect.y + (barAlongX ? rect.height / 2 : rect.height + labelPadding),
      textAlign: barAlongX ? "left" : "center",
      textBaseline: barAlongX ? "middle" : "bottom",
      text: this.getLabelText(
        label,
        __spreadValues({ itemId: "low", value: yLowValue }, labelParams),
        (value) => isNumber5(value) ? value.toFixed(2) : ""
      ),
      itemId: "low",
      datum,
      series
    };
    const yHighLabel = {
      x: rect.x + (barAlongX ? rect.width + labelPadding : rect.width / 2),
      y: rect.y + (barAlongX ? rect.height / 2 : -labelPadding),
      textAlign: barAlongX ? "right" : "center",
      textBaseline: barAlongX ? "middle" : "top",
      text: this.getLabelText(
        label,
        __spreadValues({ itemId: "high", value: yHighValue }, labelParams),
        (value) => isNumber5(value) ? value.toFixed(2) : ""
      ),
      itemId: "high",
      datum,
      series
    };
    if (placement === "outside") {
      yLowLabel.textAlign = barAlongX ? "right" : "center";
      yLowLabel.textBaseline = barAlongX ? "middle" : "top";
      yHighLabel.textAlign = barAlongX ? "left" : "center";
      yHighLabel.textBaseline = barAlongX ? "middle" : "bottom";
    }
    return [yLowLabel, yHighLabel];
  }
  nodeFactory() {
    return new Rect4();
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      const { nodeData, datumSelection } = opts;
      const data = nodeData != null ? nodeData : [];
      return datumSelection.update(data, void 0, (datum) => this.getDatumId(datum));
    });
  }
  updateDatumNodes(opts) {
    return __async(this, null, function* () {
      const { datumSelection, isHighlight } = opts;
      const { id: seriesId, ctx } = this;
      const {
        yLowKey,
        yHighKey,
        highlightStyle: { item: itemHighlightStyle }
      } = this.properties;
      const xAxis = this.axes[ChartAxisDirection17.X];
      const crisp = checkCrisp(xAxis == null ? void 0 : xAxis.visibleRange);
      const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection17.X;
      datumSelection.each((rect, datum) => {
        const {
          fillOpacity,
          strokeOpacity,
          strokeWidth,
          lineDash,
          lineDashOffset,
          formatter,
          shadow: fillShadow
        } = this.properties;
        const style = {
          fill: datum.fill,
          stroke: datum.stroke,
          fillOpacity,
          strokeOpacity,
          lineDash,
          lineDashOffset,
          fillShadow,
          strokeWidth: this.getStrokeWidth(strokeWidth),
          cornerRadius: this.properties.cornerRadius
        };
        const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
        const config = getRectConfig({
          datum,
          lowValue: datum.yLowValue,
          highValue: datum.yHighValue,
          isHighlighted: isHighlight,
          style,
          highlightStyle: itemHighlightStyle,
          formatter,
          seriesId,
          itemId: datum.itemId,
          ctx,
          yLowKey,
          yHighKey
        });
        config.crisp = crisp;
        config.visible = visible;
        updateRect({ rect, config });
      });
    });
  }
  getHighlightLabelData(labelData, highlightedItem) {
    const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
    return labelItems.length > 0 ? labelItems : void 0;
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      const labelData = this.properties.label.enabled ? opts.labelData : [];
      return opts.labelSelection.update(labelData, (text) => {
        text.pointerEvents = PointerEvents8.None;
      });
    });
  }
  updateLabelNodes(opts) {
    return __async(this, null, function* () {
      opts.labelSelection.each((textNode, datum) => {
        updateLabelNode2(textNode, this.properties.label, datum);
      });
    });
  }
  getTooltipHtml(nodeDatum) {
    var _a2, _b;
    const {
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const xAxis = this.getCategoryAxis();
    const yAxis = this.getValueAxis();
    if (!this.properties.isValid() || !xAxis || !yAxis) {
      return "";
    }
    const { xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, fill, strokeWidth, formatter, tooltip } = this.properties;
    const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;
    let format;
    if (formatter) {
      format = callbackCache.call(formatter, {
        datum,
        xKey,
        yLowKey,
        yHighKey,
        fill,
        strokeWidth,
        highlighted: false,
        seriesId,
        itemId
      });
    }
    const color = (_b = (_a2 = format == null ? void 0 : format.fill) != null ? _a2 : fill) != null ? _b : "gray";
    const xString = sanitizeHtml11(xAxis.formatDatum(xValue));
    const yLowString = sanitizeHtml11(yAxis.formatDatum(yLowValue));
    const yHighString = sanitizeHtml11(yAxis.formatDatum(yHighValue));
    const xSubheading = xName != null ? xName : xKey;
    const yLowSubheading = yLowName != null ? yLowName : yLowKey;
    const yHighSubheading = yHighName != null ? yHighName : yHighKey;
    const title = sanitizeHtml11(yName);
    const content = yName ? `<b>${sanitizeHtml11(xSubheading)}</b>: ${xString}<br><b>${sanitizeHtml11(yLowSubheading)}</b>: ${yLowString}<br><b>${sanitizeHtml11(yHighSubheading)}</b>: ${yHighString}<br>` : `${xString}: ${yLowString} - ${yHighString}`;
    const defaults = {
      title,
      content,
      backgroundColor: color
    };
    return tooltip.toTooltipHtml(defaults, {
      datum,
      xKey,
      xName,
      yLowKey,
      yLowName,
      yHighKey,
      yHighName,
      yName,
      color,
      seriesId,
      itemId
    });
  }
  getLegendData(legendType) {
    const { id, visible } = this;
    if (legendType !== "category") {
      return [];
    }
    const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, yName, yLowName, yHighName, yLowKey, yHighKey } = this.properties;
    const legendItemText = yName != null ? yName : `${yLowName != null ? yLowName : yLowKey} - ${yHighName != null ? yHighName : yHighKey}`;
    return [
      {
        legendType: "category",
        id,
        itemId: `${yLowKey}-${yHighKey}`,
        seriesId: id,
        enabled: visible,
        label: { text: `${legendItemText}` },
        marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth }
      }
    ];
  }
  animateEmptyUpdateReady({ datumSelections, labelSelections }) {
    const fns = prepareBarAnimationFunctions2(midpointStartingBarPosition(this.isVertical(), "normal"));
    motion8.fromToMotion(this.id, "datums", this.ctx.animationManager, datumSelections, fns);
    seriesLabelFadeInAnimation6(this, "labels", this.ctx.animationManager, labelSelections);
  }
  animateWaitingUpdateReady(data) {
    var _a2;
    const { datumSelections, labelSelections } = data;
    const { processedData } = this;
    const dataDiff = (_a2 = processedData == null ? void 0 : processedData.reduced) == null ? void 0 : _a2.diff;
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    const fns = prepareBarAnimationFunctions2(midpointStartingBarPosition(this.isVertical(), "fade"));
    motion8.fromToMotion(
      this.id,
      "datums",
      this.ctx.animationManager,
      datumSelections,
      fns,
      (_, datum) => createDatumId7(datum.xValue),
      dataDiff
    );
    seriesLabelFadeInAnimation6(this, "labels", this.ctx.animationManager, labelSelections);
  }
  getDatumId(datum) {
    return `${datum.xValue}`;
  }
  isLabelEnabled() {
    return this.properties.label.enabled;
  }
  onDataChange() {
  }
};
_RangeBarSeries.className = "RangeBarSeries";
_RangeBarSeries.type = "range-bar";
var RangeBarSeries = _RangeBarSeries;

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarThemes.ts
var import_ag_charts_community111 = require("ag-charts-community");
var RANGE_BAR_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community111._Theme.EXTENDS_SERIES_DEFAULTS,
    direction: "vertical",
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community111._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community111._Theme.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
      placement: "inside",
      __overrides__: import_ag_charts_community111._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [import_ag_charts_community111._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        enabled: true,
        snap: false
      }
    }
  }
};

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarModule.ts
var RangeBarModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "range-bar",
  instanceConstructor: RangeBarSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community112._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community112._Theme.POSITION.BOTTOM
    },
    {
      type: import_ag_charts_community112._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community112._Theme.POSITION.LEFT
    }
  ],
  themeTemplate: RANGE_BAR_SERIES_THEME,
  paletteFactory: ({ takeColors }) => {
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      fill,
      stroke
    };
  },
  groupable: true,
  swapDefaultAxesCondition: ({ direction }) => direction === "horizontal"
};

// packages/ag-charts-enterprise/src/series/sunburst/sunburstModule.ts
var import_ag_charts_community115 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeries.ts
var import_ag_charts_community114 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeriesProperties.ts
var import_ag_charts_community113 = require("ag-charts-community");
var {
  HierarchySeriesProperties,
  HighlightStyle,
  SeriesTooltip: SeriesTooltip15,
  Validate: Validate47,
  COLOR_STRING: COLOR_STRING20,
  FUNCTION: FUNCTION14,
  NUMBER: NUMBER11,
  OBJECT: OBJECT18,
  POSITIVE_NUMBER: POSITIVE_NUMBER22,
  RATIO: RATIO26,
  STRING: STRING17
} = import_ag_charts_community113._ModuleSupport;
var SunburstSeriesTileHighlightStyle = class extends HighlightStyle {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizedLabel();
  }
};
__decorateClass([
  Validate47(STRING17, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate47(RATIO26, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate47(COLOR_STRING20, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate47(POSITIVE_NUMBER22, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate47(RATIO26, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate47(OBJECT18)
], SunburstSeriesTileHighlightStyle.prototype, "label", 2);
__decorateClass([
  Validate47(OBJECT18)
], SunburstSeriesTileHighlightStyle.prototype, "secondaryLabel", 2);
var SunburstSeriesProperties = class extends HierarchySeriesProperties {
  constructor() {
    super(...arguments);
    this.fillOpacity = 1;
    this.strokeWidth = 0;
    this.strokeOpacity = 1;
    this.highlightStyle = new SunburstSeriesTileHighlightStyle();
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
    this.tooltip = new SeriesTooltip15();
  }
};
__decorateClass([
  Validate47(STRING17, { optional: true })
], SunburstSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate47(STRING17, { optional: true })
], SunburstSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate47(STRING17, { optional: true })
], SunburstSeriesProperties.prototype, "secondaryLabelKey", 2);
__decorateClass([
  Validate47(RATIO26)
], SunburstSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate47(POSITIVE_NUMBER22)
], SunburstSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate47(RATIO26)
], SunburstSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate47(NUMBER11, { optional: true })
], SunburstSeriesProperties.prototype, "sectorSpacing", 2);
__decorateClass([
  Validate47(NUMBER11, { optional: true })
], SunburstSeriesProperties.prototype, "padding", 2);
__decorateClass([
  Validate47(FUNCTION14, { optional: true })
], SunburstSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate47(OBJECT18)
], SunburstSeriesProperties.prototype, "highlightStyle", 2);
__decorateClass([
  Validate47(OBJECT18)
], SunburstSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate47(OBJECT18)
], SunburstSeriesProperties.prototype, "secondaryLabel", 2);
__decorateClass([
  Validate47(OBJECT18)
], SunburstSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeries.ts
var { fromToMotion: fromToMotion3 } = import_ag_charts_community114._ModuleSupport;
var { Sector: Sector5, Group: Group14, Selection: Selection10, Text: Text10 } = import_ag_charts_community114._Scene;
var { sanitizeHtml: sanitizeHtml12 } = import_ag_charts_community114._Util;
var getAngleData = (node, startAngle = 0, angleScale = 2 * Math.PI / node.sumSize, angleData = Array.from(node, () => void 0)) => {
  let currentAngle = startAngle;
  for (const child of node.children) {
    const start = currentAngle;
    const end = currentAngle + child.sumSize * angleScale;
    angleData[child.index] = { start, end };
    getAngleData(child, start, angleScale, angleData);
    currentAngle = end;
  }
  return angleData;
};
var _SunburstSeries = class _SunburstSeries extends import_ag_charts_community114._ModuleSupport.HierarchySeries {
  constructor() {
    super(...arguments);
    this.properties = new SunburstSeriesProperties();
    this.groupSelection = Selection10.select(this.contentGroup, Group14);
    this.highlightSelection = Selection10.select(
      this.highlightGroup,
      Group14
    );
    this.angleData = [];
  }
  processData() {
    return __async(this, null, function* () {
      const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName } = this.properties;
      yield __superGet(_SunburstSeries.prototype, this, "processData").call(this);
      this.angleData = getAngleData(this.rootNode);
      const defaultLabelFormatter = (value) => {
        if (typeof value === "number") {
          return value.toFixed(2);
        } else if (typeof value === "string") {
          return value;
        } else {
          return "";
        }
      };
      this.labelData = Array.from(this.rootNode, ({ datum, depth }) => {
        let label;
        if (datum != null && depth != null && labelKey != null) {
          const value = datum[labelKey];
          label = this.getLabelText(
            this.properties.label,
            {
              depth,
              datum,
              childrenKey,
              colorKey,
              colorName,
              labelKey,
              secondaryLabelKey,
              sizeKey,
              sizeName,
              value
            },
            defaultLabelFormatter
          );
        }
        if (label === "") {
          label = void 0;
        }
        let secondaryLabel;
        if (datum != null && depth != null && secondaryLabelKey != null) {
          const value = datum[secondaryLabelKey];
          secondaryLabel = this.getLabelText(
            this.properties.secondaryLabel,
            {
              depth,
              datum,
              childrenKey,
              colorKey,
              colorName,
              labelKey,
              secondaryLabelKey,
              sizeKey,
              sizeName,
              value
            },
            defaultLabelFormatter
          );
        }
        if (secondaryLabel === "") {
          secondaryLabel = void 0;
        }
        return label != null || secondaryLabel != null ? { label, secondaryLabel } : void 0;
      });
    });
  }
  updateSelections() {
    return __async(this, null, function* () {
      if (!this.nodeDataRefresh)
        return;
      this.nodeDataRefresh = false;
      const { chart } = this;
      if (chart == null)
        return;
      const seriesRect = chart.seriesRect;
      if (seriesRect == null)
        return;
      const descendants = Array.from(this.rootNode);
      const updateGroup = (group) => {
        group.append([
          new Sector5(),
          new Text10({ tag: 0 /* Primary */ }),
          new Text10({ tag: 1 /* Secondary */ })
        ]);
      };
      this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
      this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    });
  }
  updateNodes() {
    return __async(this, null, function* () {
      var _a2;
      const { chart, data, maxDepth, labelData } = this;
      if (chart == null || data == null || labelData == null) {
        return;
      }
      const { width, height } = chart.seriesRect;
      const { sectorSpacing = 0, padding = 0, highlightStyle } = this.properties;
      this.contentGroup.translationX = width / 2;
      this.contentGroup.translationY = height / 2;
      this.highlightGroup.translationX = width / 2;
      this.highlightGroup.translationY = height / 2;
      const baseInset = sectorSpacing * 0.5;
      const radius = Math.min(width, height) / 2;
      const radiusScale = radius / (maxDepth + 1);
      const angleOffset = -Math.PI / 2;
      const highlightedNode = (_a2 = this.ctx.highlightManager) == null ? void 0 : _a2.getActiveHighlight();
      const labelTextNode = new Text10();
      labelTextNode.setFont(this.properties.label);
      this.rootNode.walk((node) => {
        const angleDatum = this.angleData[node.index];
        if (node.depth != null && angleDatum != null) {
          const midAngle = angleDatum.end - angleDatum.start;
          const midRadius = (node.depth + 0.5) * radiusScale;
          node.midPoint.x = Math.cos(midAngle) * midRadius;
          node.midPoint.y = Math.sin(midAngle) * midRadius;
        }
      });
      const updateSector = (node, sector, highlighted) => {
        var _a3, _b, _c, _d, _e, _f, _g, _h, _i, _j;
        const { depth } = node;
        const angleDatum = this.angleData[node.index];
        if (depth == null || angleDatum == null) {
          sector.visible = false;
          return;
        }
        sector.visible = true;
        let highlightedFill;
        let highlightedFillOpacity;
        let highlightedStroke;
        let highlightedStrokeWidth;
        let highlightedStrokeOpacity;
        if (highlighted) {
          highlightedFill = highlightStyle.fill;
          highlightedFillOpacity = highlightStyle.fillOpacity;
          highlightedStroke = highlightStyle.stroke;
          highlightedStrokeWidth = highlightStyle.strokeWidth;
          highlightedStrokeOpacity = highlightStyle.strokeOpacity;
        }
        const format = this.getSectorFormat(node, highlighted);
        const fill = (_b = (_a3 = format == null ? void 0 : format.fill) != null ? _a3 : highlightedFill) != null ? _b : node.fill;
        const fillOpacity = (_d = (_c = format == null ? void 0 : format.fillOpacity) != null ? _c : highlightedFillOpacity) != null ? _d : this.properties.fillOpacity;
        const stroke = (_f = (_e = format == null ? void 0 : format.stroke) != null ? _e : highlightedStroke) != null ? _f : node.stroke;
        const strokeWidth = (_h = (_g = format == null ? void 0 : format.strokeWidth) != null ? _g : highlightedStrokeWidth) != null ? _h : this.properties.strokeWidth;
        const strokeOpacity = (_j = (_i = format == null ? void 0 : format.strokeOpacity) != null ? _i : highlightedStrokeOpacity) != null ? _j : this.properties.strokeOpacity;
        sector.fill = fill;
        sector.fillOpacity = fillOpacity;
        sector.stroke = stroke;
        sector.strokeWidth = strokeWidth;
        sector.strokeOpacity = strokeOpacity;
        sector.centerX = 0;
        sector.centerY = 0;
        sector.innerRadius = depth * radiusScale;
        sector.outerRadius = (depth + 1) * radiusScale;
        sector.angleOffset = angleOffset;
        sector.startAngle = angleDatum.start;
        sector.endAngle = angleDatum.end;
        sector.inset = baseInset + strokeWidth * 0.5;
      };
      this.groupSelection.selectByClass(Sector5).forEach((sector) => {
        updateSector(sector.datum, sector, false);
      });
      this.highlightSelection.selectByClass(Sector5).forEach((sector) => {
        const node = sector.datum;
        const isHighlighted = highlightedNode === node;
        sector.visible = isHighlighted;
        if (sector.visible) {
          updateSector(sector.datum, sector, isHighlighted);
        }
      });
      const labelMeta = Array.from(this.rootNode, (node, index) => {
        const { depth } = node;
        const labelDatum = labelData[index];
        const angleData = this.angleData[index];
        if (depth == null || angleData == null) {
          return;
        }
        const innerRadius = depth * radiusScale + baseInset;
        const outerRadius = (depth + 1) * radiusScale - baseInset;
        const innerAngleOffset = innerRadius > baseInset ? baseInset / innerRadius : baseInset;
        const outerAngleOffset = outerRadius > baseInset ? baseInset / outerRadius : baseInset;
        const innerStartAngle = angleData.start + innerAngleOffset;
        const innerEndAngle = angleData.end + innerAngleOffset;
        const deltaInnerAngle = innerEndAngle - innerStartAngle;
        const outerStartAngle = angleData.start + outerAngleOffset;
        const outerEndAngle = angleData.end + outerAngleOffset;
        const deltaOuterAngle = outerEndAngle - outerStartAngle;
        const sizeFittingHeight = (labelHeight2) => {
          var _a3;
          const isCenterCircle = depth === 0 && ((_a3 = node.parent) == null ? void 0 : _a3.sumSize) === node.sumSize;
          if (isCenterCircle) {
            const labelWidth2 = 2 * Math.sqrt(__pow(outerRadius, 2) - __pow(labelHeight2 * 0.5, 2));
            return { width: labelWidth2, height: labelHeight2, meta: 0 /* CenterCircle */ };
          }
          const parallelHeight = labelHeight2;
          const availableWidthUntilItHitsTheOuterRadius = 2 * Math.sqrt(__pow(outerRadius, 2) - __pow(innerRadius + parallelHeight, 2));
          const availableWidthUntilItHitsTheStraightEdges = deltaInnerAngle < Math.PI ? 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5) : Infinity;
          const parallelWidth = Math.min(
            availableWidthUntilItHitsTheOuterRadius,
            availableWidthUntilItHitsTheStraightEdges
          );
          let perpendicularHeight;
          let perpendicularWidth;
          if (depth === 0) {
            perpendicularHeight = labelHeight2;
            perpendicularWidth = Math.sqrt(__pow(outerRadius, 2) - __pow(perpendicularHeight / 2, 2)) - labelHeight2 / (2 * Math.tan(deltaOuterAngle * 0.5));
          } else {
            perpendicularHeight = 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5);
            perpendicularWidth = Math.sqrt(__pow(outerRadius, 2) - __pow(perpendicularHeight / 2, 2)) - innerRadius;
          }
          return parallelWidth >= perpendicularWidth ? { width: parallelWidth, height: parallelHeight, meta: 1 /* Parallel */ } : { width: perpendicularWidth, height: perpendicularHeight, meta: 2 /* Perpendicular */ };
        };
        const formatting = formatLabels(
          labelDatum == null ? void 0 : labelDatum.label,
          this.properties.label,
          labelDatum == null ? void 0 : labelDatum.secondaryLabel,
          this.properties.secondaryLabel,
          { padding },
          sizeFittingHeight
        );
        if (formatting == null) {
          return;
        }
        const { width: labelWidth, height: labelHeight, meta: labelPlacement, label, secondaryLabel } = formatting;
        const theta = angleOffset + (angleData.start + angleData.end) / 2;
        const top = Math.sin(theta) >= 0;
        const right = Math.cos(theta) >= 0;
        const circleQuarter = (top ? 3 /* Top */ : 12 /* Bottom */) & (right ? 6 /* Right */ : 9 /* Left */);
        let labelRadius;
        switch (labelPlacement) {
          case 0 /* CenterCircle */:
            labelRadius = 0;
            break;
          case 1 /* Parallel */: {
            const opticalCentering = 0.58;
            const idealRadius = outerRadius - (radiusScale - labelHeight) * opticalCentering;
            const maximumRadius = Math.sqrt(__pow(outerRadius - padding, 2) - __pow(labelWidth / 2, 2));
            labelRadius = Math.min(idealRadius, maximumRadius);
            break;
          }
          case 2 /* Perpendicular */:
            if (depth === 0) {
              const minimumRadius = labelHeight / (2 * Math.tan(deltaInnerAngle * 0.5)) + labelWidth * 0.5;
              const maximumRadius = Math.sqrt(__pow(outerRadius, 2) - __pow(labelHeight * 0.5, 2)) - labelWidth * 0.5;
              labelRadius = (minimumRadius + maximumRadius) * 0.5;
            } else {
              labelRadius = (innerRadius + outerRadius) * 0.5;
            }
            break;
        }
        return {
          width: labelWidth,
          height: labelHeight,
          labelPlacement,
          circleQuarter,
          radius: labelRadius,
          theta,
          label,
          secondaryLabel
        };
      });
      const updateText = (node, text, tag, highlighted) => {
        const { index, depth } = node;
        const meta = labelMeta == null ? void 0 : labelMeta[index];
        const labelStyle = tag === 0 /* Primary */ ? this.properties.label : this.properties.secondaryLabel;
        const label = tag === 0 /* Primary */ ? meta == null ? void 0 : meta.label : meta == null ? void 0 : meta.secondaryLabel;
        if (depth == null || meta == null || label == null) {
          text.visible = false;
          return;
        }
        const { height: textHeight, labelPlacement, circleQuarter, radius: textRadius, theta } = meta;
        let highlightedColor;
        if (highlighted) {
          const highlightedLabelStyle = tag === 0 /* Primary */ ? this.properties.highlightStyle.label : this.properties.highlightStyle.secondaryLabel;
          highlightedColor = highlightedLabelStyle.color;
        }
        text.text = label.text;
        text.fontSize = label.fontSize;
        text.lineHeight = label.lineHeight;
        text.fontStyle = labelStyle.fontStyle;
        text.fontFamily = labelStyle.fontFamily;
        text.fontWeight = labelStyle.fontWeight;
        text.fill = highlightedColor != null ? highlightedColor : labelStyle.color;
        switch (labelPlacement) {
          case 0 /* CenterCircle */:
            text.textAlign = "center";
            text.textBaseline = "top";
            text.translationX = 0;
            text.translationY = (tag === 0 /* Primary */ ? 0 : textHeight - label.height) - textHeight * 0.5;
            text.rotation = 0;
            break;
          case 1 /* Parallel */: {
            const topHalf = (circleQuarter & 3 /* Top */) !== 0;
            const translationRadius = tag === 0 /* Primary */ === !topHalf ? textRadius : textRadius - (textHeight - label.height);
            text.textAlign = "center";
            text.textBaseline = topHalf ? "bottom" : "top";
            text.translationX = Math.cos(theta) * translationRadius;
            text.translationY = Math.sin(theta) * translationRadius;
            text.rotation = topHalf ? theta - Math.PI * 0.5 : theta + Math.PI * 0.5;
            break;
          }
          case 2 /* Perpendicular */: {
            const rightHalf = (circleQuarter & 6 /* Right */) !== 0;
            const translation = tag === 0 /* Primary */ === !rightHalf ? (textHeight - label.height) * 0.5 : (label.height - textHeight) * 0.5;
            text.textAlign = "center";
            text.textBaseline = "middle";
            text.translationX = Math.cos(theta) * textRadius + Math.cos(theta + Math.PI / 2) * translation;
            text.translationY = Math.sin(theta) * textRadius + Math.sin(theta + Math.PI / 2) * translation;
            text.rotation = rightHalf ? theta : theta + Math.PI;
            break;
          }
        }
        text.visible = true;
      };
      this.groupSelection.selectByClass(Text10).forEach((text) => {
        updateText(text.datum, text, text.tag, false);
      });
      this.highlightSelection.selectByClass(Text10).forEach((text) => {
        const node = text.datum;
        const isHighlighted = highlightedNode === node;
        text.visible = isHighlighted;
        if (text.visible) {
          updateText(text.datum, text, text.tag, isHighlighted);
        }
      });
    });
  }
  getSectorFormat(node, isHighlighted) {
    const { datum, fill, stroke, depth } = node;
    const {
      ctx: { callbackCache },
      properties: { formatter }
    } = this;
    if (!formatter || datum == null || depth == null) {
      return {};
    }
    const { colorKey, labelKey, sizeKey, strokeWidth } = this.properties;
    const result = callbackCache.call(formatter, {
      seriesId: this.id,
      depth,
      datum,
      colorKey,
      labelKey,
      sizeKey,
      fill,
      stroke,
      strokeWidth,
      highlighted: isHighlighted
    });
    return result != null ? result : {};
  }
  getTooltipHtml(node) {
    var _a2;
    const { id: seriesId } = this;
    const {
      tooltip,
      colorKey,
      colorName = colorKey,
      labelKey,
      secondaryLabelKey,
      sizeKey,
      sizeName = sizeKey
    } = this.properties;
    const { datum, depth } = node;
    if (datum == null || depth == null) {
      return "";
    }
    const title = labelKey != null ? datum[labelKey] : void 0;
    const format = this.getSectorFormat(node, false);
    const color = (_a2 = format == null ? void 0 : format.fill) != null ? _a2 : node.fill;
    if (!tooltip.renderer && !title) {
      return "";
    }
    const contentArray = [];
    const datumSecondaryLabel = secondaryLabelKey != null ? datum[secondaryLabelKey] : void 0;
    if (datumSecondaryLabel != null && secondaryLabelKey !== colorKey && secondaryLabelKey !== sizeKey) {
      contentArray.push(sanitizeHtml12(datumSecondaryLabel));
    }
    const datumSize = sizeKey != null ? datum[sizeKey] : void 0;
    if (datumSize != null) {
      contentArray.push(`${sizeName}: ${sanitizeHtml12(datumSize)}`);
    }
    const datumColor = colorKey != null ? datum[colorKey] : void 0;
    if (datumColor != null) {
      contentArray.push(`${colorName}: ${sanitizeHtml12(datumColor)}`);
    }
    const content = contentArray.join("<br>");
    const defaults = {
      title,
      color: this.properties.label.color,
      backgroundColor: color,
      content
    };
    return tooltip.toTooltipHtml(defaults, {
      depth,
      datum,
      colorKey,
      labelKey,
      secondaryLabelKey,
      sizeKey,
      title,
      color,
      seriesId
    });
  }
  createNodeData() {
    return __async(this, null, function* () {
      return [];
    });
  }
  animateEmptyUpdateReady({
    datumSelections
  }) {
    fromToMotion3(this.id, "nodes", this.ctx.animationManager, datumSelections, {
      toFn(_group, _datum, _status) {
        return { scalingX: 1, scalingY: 1 };
      },
      fromFn(group, datum, status) {
        if (status === "unknown" && datum != null && group.previousDatum == null) {
          return { scalingX: 0, scalingY: 0 };
        } else {
          return { scalingX: 1, scalingY: 1 };
        }
      }
    });
  }
};
_SunburstSeries.className = "SunburstSeries";
_SunburstSeries.type = "sunburst";
var SunburstSeries = _SunburstSeries;

// packages/ag-charts-enterprise/src/series/sunburst/sunburstModule.ts
var { EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS5, DEFAULT_INSIDE_SERIES_LABEL_COLOUR } = import_ag_charts_community115._Theme;
var SunburstModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["hierarchy"],
  identifier: "sunburst",
  instanceConstructor: SunburstSeries,
  solo: true,
  themeTemplate: {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS5,
      label: {
        fontSize: 14,
        minimumFontSize: 9,
        color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        overflowStrategy: "ellipsis",
        wrapping: "never",
        spacing: 2
      },
      secondaryLabel: {
        fontSize: 8,
        minimumFontSize: 7,
        color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        overflowStrategy: "ellipsis",
        wrapping: "never"
      },
      sectorSpacing: 2,
      padding: 3,
      highlightStyle: {
        label: {
          color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR
        },
        secondaryLabel: {
          color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR
        },
        stroke: `rgba(0, 0, 0, 0.4)`,
        strokeWidth: 2
      }
    },
    gradientLegend: {
      enabled: true
    }
  },
  paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
    const { properties } = themeTemplateParameters;
    const { fills, strokes } = takeColors(colorsCount);
    const defaultColorRange = properties.get(import_ag_charts_community115._Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    return { fills, strokes, colorRange: defaultColorRange };
  }
};

// packages/ag-charts-enterprise/src/series/treemap/treemapModule.ts
var import_ag_charts_community118 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts
var import_ag_charts_community117 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/treemap/treemapSeriesProperties.ts
var import_ag_charts_community116 = require("ag-charts-community");
var { Label: Label9 } = import_ag_charts_community116._Scene;
var {
  BaseProperties: BaseProperties8,
  HierarchySeriesProperties: HierarchySeriesProperties2,
  HighlightStyle: HighlightStyle2,
  SeriesTooltip: SeriesTooltip16,
  Validate: Validate48,
  BOOLEAN: BOOLEAN16,
  COLOR_STRING: COLOR_STRING21,
  FUNCTION: FUNCTION15,
  NUMBER: NUMBER12,
  OBJECT: OBJECT19,
  POSITIVE_NUMBER: POSITIVE_NUMBER23,
  RATIO: RATIO27,
  STRING: STRING18,
  STRING_ARRAY,
  TEXT_ALIGN: TEXT_ALIGN2,
  VERTICAL_ALIGN: VERTICAL_ALIGN2
} = import_ag_charts_community116._ModuleSupport;
var TreemapGroupLabel = class extends Label9 {
  constructor() {
    super(...arguments);
    this.spacing = 0;
  }
};
__decorateClass([
  Validate48(NUMBER12)
], TreemapGroupLabel.prototype, "spacing", 2);
var TreemapSeriesGroup = class extends BaseProperties8 {
  constructor() {
    super(...arguments);
    this.fillOpacity = 1;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.textAlign = "center";
    this.gap = 0;
    this.padding = 0;
    this.interactive = true;
    this.label = new TreemapGroupLabel();
  }
};
__decorateClass([
  Validate48(STRING18, { optional: true })
], TreemapSeriesGroup.prototype, "fill", 2);
__decorateClass([
  Validate48(RATIO27)
], TreemapSeriesGroup.prototype, "fillOpacity", 2);
__decorateClass([
  Validate48(COLOR_STRING21, { optional: true })
], TreemapSeriesGroup.prototype, "stroke", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER23)
], TreemapSeriesGroup.prototype, "strokeWidth", 2);
__decorateClass([
  Validate48(RATIO27)
], TreemapSeriesGroup.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate48(TEXT_ALIGN2)
], TreemapSeriesGroup.prototype, "textAlign", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER23)
], TreemapSeriesGroup.prototype, "gap", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER23)
], TreemapSeriesGroup.prototype, "padding", 2);
__decorateClass([
  Validate48(BOOLEAN16)
], TreemapSeriesGroup.prototype, "interactive", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesGroup.prototype, "label", 2);
var TreemapSeriesTile = class extends BaseProperties8 {
  constructor() {
    super(...arguments);
    this.fillOpacity = 1;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.textAlign = "center";
    this.verticalAlign = "middle";
    this.gap = 0;
    this.padding = 0;
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
  }
};
__decorateClass([
  Validate48(STRING18, { optional: true })
], TreemapSeriesTile.prototype, "fill", 2);
__decorateClass([
  Validate48(RATIO27)
], TreemapSeriesTile.prototype, "fillOpacity", 2);
__decorateClass([
  Validate48(COLOR_STRING21, { optional: true })
], TreemapSeriesTile.prototype, "stroke", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER23, { optional: true })
], TreemapSeriesTile.prototype, "strokeWidth", 2);
__decorateClass([
  Validate48(RATIO27)
], TreemapSeriesTile.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate48(TEXT_ALIGN2)
], TreemapSeriesTile.prototype, "textAlign", 2);
__decorateClass([
  Validate48(VERTICAL_ALIGN2)
], TreemapSeriesTile.prototype, "verticalAlign", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER23)
], TreemapSeriesTile.prototype, "gap", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER23)
], TreemapSeriesTile.prototype, "padding", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesTile.prototype, "label", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesTile.prototype, "secondaryLabel", 2);
var TreemapSeriesGroupHighlightStyle = class extends BaseProperties8 {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
  }
};
__decorateClass([
  Validate48(STRING18, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate48(RATIO27, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate48(COLOR_STRING21, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER23, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate48(RATIO27, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesGroupHighlightStyle.prototype, "label", 2);
var TreemapSeriesTileHighlightStyle = class extends BaseProperties8 {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
  }
};
__decorateClass([
  Validate48(STRING18, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate48(RATIO27, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate48(COLOR_STRING21, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER23, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate48(RATIO27, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesTileHighlightStyle.prototype, "label", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesTileHighlightStyle.prototype, "secondaryLabel", 2);
var TreemapSeriesHighlightStyle = class extends HighlightStyle2 {
  constructor() {
    super(...arguments);
    this.group = new TreemapSeriesGroupHighlightStyle();
    this.tile = new TreemapSeriesTileHighlightStyle();
  }
};
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesHighlightStyle.prototype, "group", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesHighlightStyle.prototype, "tile", 2);
var TreemapSeriesProperties = class extends HierarchySeriesProperties2 {
  constructor() {
    super(...arguments);
    this.highlightStyle = new TreemapSeriesHighlightStyle();
    this.tooltip = new SeriesTooltip16();
    this.group = new TreemapSeriesGroup();
    this.tile = new TreemapSeriesTile();
    this.undocumentedGroupFills = [];
    this.undocumentedGroupStrokes = [];
  }
};
__decorateClass([
  Validate48(STRING18, { optional: true })
], TreemapSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate48(STRING18, { optional: true })
], TreemapSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate48(STRING18, { optional: true })
], TreemapSeriesProperties.prototype, "secondaryLabelKey", 2);
__decorateClass([
  Validate48(FUNCTION15, { optional: true })
], TreemapSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesProperties.prototype, "highlightStyle", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesProperties.prototype, "group", 2);
__decorateClass([
  Validate48(OBJECT19)
], TreemapSeriesProperties.prototype, "tile", 2);
__decorateClass([
  Validate48(STRING_ARRAY)
], TreemapSeriesProperties.prototype, "undocumentedGroupFills", 2);
__decorateClass([
  Validate48(STRING_ARRAY)
], TreemapSeriesProperties.prototype, "undocumentedGroupStrokes", 2);

// packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts
var { Rect: Rect5, Group: Group15, BBox: BBox9, Selection: Selection11, Text: Text11 } = import_ag_charts_community117._Scene;
var { Color: Color2, Logger: Logger13, isEqual, sanitizeHtml: sanitizeHtml13 } = import_ag_charts_community117._Util;
var tempText = new Text11();
function getTextSize(text, style) {
  const { fontStyle, fontWeight, fontSize, fontFamily } = style;
  tempText.setProperties({
    text,
    fontStyle,
    fontWeight,
    fontSize,
    fontFamily,
    textAlign: "left",
    textBaseline: "top"
  });
  const { width, height } = tempText.computeBBox();
  return { width, height };
}
function validateColor(color) {
  if (typeof color === "string" && !Color2.validColorString(color)) {
    const fallbackColor = "black";
    Logger13.warnOnce(
      `invalid Treemap tile colour string "${color}". Affected treemap tiles will be coloured ${fallbackColor}.`
    );
    return fallbackColor;
  }
  return color;
}
function nodeSize(node) {
  return node.children.length > 0 ? node.sumSize - node.size : node.size;
}
var textAlignFactors2 = {
  left: 0,
  center: 0.5,
  right: 1
};
var verticalAlignFactors2 = {
  top: 0,
  middle: 0.5,
  bottom: 1
};
var _TreemapSeries = class _TreemapSeries extends import_ag_charts_community117._ModuleSupport.HierarchySeries {
  constructor() {
    super(...arguments);
    this.properties = new TreemapSeriesProperties();
    this.groupSelection = Selection11.select(this.contentGroup, Group15);
    this.highlightSelection = Selection11.select(
      this.highlightGroup,
      Group15
    );
  }
  groupTitleHeight(node, bbox) {
    var _a2, _b;
    const label = (_b = (_a2 = this.labelData) == null ? void 0 : _a2[node.index]) == null ? void 0 : _b.label;
    const { label: font } = this.properties.group;
    const heightRatioThreshold = 3;
    if (label == null) {
      return;
    } else if (font.fontSize > bbox.width / heightRatioThreshold || font.fontSize > bbox.height / heightRatioThreshold) {
      return;
    } else {
      const { height: fontHeight } = getTextSize(label, font);
      return Math.max(fontHeight, font.fontSize);
    }
  }
  getNodePadding(node, bbox) {
    if (node.index === 0) {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    } else if (node.children.length === 0) {
      const { padding: padding2 } = this.properties.tile;
      return {
        top: padding2,
        right: padding2,
        bottom: padding2,
        left: padding2
      };
    }
    const {
      label: { spacing },
      padding
    } = this.properties.group;
    const fontHeight = this.groupTitleHeight(node, bbox);
    const titleHeight = fontHeight != null ? fontHeight + spacing : 0;
    return {
      top: padding + titleHeight,
      right: padding,
      bottom: padding,
      left: padding
    };
  }
  processData() {
    return __async(this, null, function* () {
      var _a2;
      yield __superGet(_TreemapSeries.prototype, this, "processData").call(this);
      const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName, tile, group } = this.properties;
      if (!((_a2 = this.data) == null ? void 0 : _a2.length)) {
        this.labelData = void 0;
        return;
      }
      const defaultLabelFormatter = (value) => {
        if (typeof value === "number") {
          return value.toFixed(2);
        } else if (typeof value === "string") {
          return value;
        } else {
          return "";
        }
      };
      this.labelData = Array.from(this.rootNode, ({ datum, depth, children }) => {
        const isLeaf = children.length === 0;
        const labelStyle = isLeaf ? tile.label : group.label;
        let label;
        if (datum != null && depth != null && labelKey != null) {
          const value = datum[labelKey];
          label = this.getLabelText(
            labelStyle,
            {
              depth,
              datum,
              childrenKey,
              colorKey,
              colorName,
              labelKey,
              secondaryLabelKey,
              sizeKey,
              sizeName,
              value
            },
            defaultLabelFormatter
          );
        }
        if (label === "") {
          label = void 0;
        }
        let secondaryLabel;
        if (isLeaf && datum != null && depth != null && secondaryLabelKey != null) {
          const value = datum[secondaryLabelKey];
          secondaryLabel = this.getLabelText(
            tile.secondaryLabel,
            {
              depth,
              datum,
              childrenKey,
              colorKey,
              colorName,
              labelKey,
              secondaryLabelKey,
              sizeKey,
              sizeName,
              value
            },
            defaultLabelFormatter
          );
        }
        if (secondaryLabel === "") {
          secondaryLabel = void 0;
        }
        return label != null || secondaryLabel != null ? { label, secondaryLabel } : void 0;
      });
    });
  }
  /**
   * Squarified Treemap algorithm
   * https://www.win.tue.nl/~vanwijk/stm.pdf
   */
  squarify(node, bbox, outputBoxes) {
    const { index, datum, children } = node;
    if (bbox.width <= 0 || bbox.height <= 0) {
      outputBoxes[index] = void 0;
      return;
    }
    outputBoxes[index] = index === 0 ? void 0 : bbox;
    const sortedChildrenIndices = Array.from(children, (_, i2) => i2).filter((i2) => nodeSize(children[i2]) > 0).sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));
    const childAt = (i2) => {
      const sortedIndex = sortedChildrenIndices[i2];
      return children[sortedIndex];
    };
    const allLeafNodes = sortedChildrenIndices.every((sortedIndex) => children[sortedIndex].children.length === 0);
    const targetTileAspectRatio = 1;
    const padding = datum != null ? this.getNodePadding(node, bbox) : { top: 0, right: 0, bottom: 0, left: 0 };
    const width = bbox.width - padding.left - padding.right;
    const height = bbox.height - padding.top - padding.bottom;
    if (width <= 0 || height <= 0)
      return;
    const numChildren = sortedChildrenIndices.length;
    let stackSum = 0;
    let startIndex = 0;
    let minRatioDiff = Infinity;
    let partitionSum = sortedChildrenIndices.reduce((sum, sortedIndex) => sum + nodeSize(children[sortedIndex]), 0);
    const innerBox = new BBox9(bbox.x + padding.left, bbox.y + padding.top, width, height);
    const partition = innerBox.clone();
    let i = 0;
    while (i < numChildren) {
      const value = nodeSize(childAt(i));
      const firstValue = nodeSize(childAt(startIndex));
      const isVertical2 = partition.width < partition.height;
      stackSum += value;
      const partThickness = isVertical2 ? partition.height : partition.width;
      const partLength = isVertical2 ? partition.width : partition.height;
      const firstTileLength = partLength * firstValue / stackSum;
      let stackThickness = partThickness * stackSum / partitionSum;
      const ratio = Math.max(firstTileLength, stackThickness) / Math.min(firstTileLength, stackThickness);
      const diff8 = Math.abs(targetTileAspectRatio - ratio);
      if (diff8 < minRatioDiff) {
        minRatioDiff = diff8;
        i++;
        continue;
      }
      stackSum -= value;
      stackThickness = partThickness * stackSum / partitionSum;
      let start2 = isVertical2 ? partition.x : partition.y;
      for (let j = startIndex; j < i; j++) {
        const child = childAt(j);
        const childSize = nodeSize(child);
        const x = isVertical2 ? start2 : partition.x;
        const y = isVertical2 ? partition.y : start2;
        const length = partLength * childSize / stackSum;
        const stackWidth = isVertical2 ? length : stackThickness;
        const stackHeight = isVertical2 ? stackThickness : length;
        const childBbox = new BBox9(x, y, stackWidth, stackHeight);
        this.applyGap(innerBox, childBbox, allLeafNodes);
        this.squarify(child, childBbox, outputBoxes);
        partitionSum -= childSize;
        start2 += length;
      }
      if (isVertical2) {
        partition.y += stackThickness;
        partition.height -= stackThickness;
      } else {
        partition.x += stackThickness;
        partition.width -= stackThickness;
      }
      startIndex = i;
      stackSum = 0;
      minRatioDiff = Infinity;
    }
    const isVertical = partition.width < partition.height;
    let start = isVertical ? partition.x : partition.y;
    for (let childIdx = startIndex; childIdx < numChildren; childIdx++) {
      const child = childAt(childIdx);
      const x = isVertical ? start : partition.x;
      const y = isVertical ? partition.y : start;
      const part = nodeSize(child) / partitionSum;
      const childWidth = partition.width * (isVertical ? part : 1);
      const childHeight = partition.height * (isVertical ? 1 : part);
      const childBox = new BBox9(x, y, childWidth, childHeight);
      this.applyGap(innerBox, childBox, allLeafNodes);
      this.squarify(child, childBox, outputBoxes);
      start += isVertical ? childWidth : childHeight;
    }
  }
  applyGap(innerBox, childBox, allLeafNodes) {
    const gap = allLeafNodes ? this.properties.tile.gap * 0.5 : this.properties.group.gap * 0.5;
    const getBounds = (box) => ({
      left: box.x,
      top: box.y,
      right: box.x + box.width,
      bottom: box.y + box.height
    });
    const innerBounds = getBounds(innerBox);
    const childBounds = getBounds(childBox);
    const sides = ["top", "right", "bottom", "left"];
    sides.forEach((side) => {
      if (!isEqual(innerBounds[side], childBounds[side])) {
        childBox.shrink(gap, side);
      }
    });
  }
  createNodeData() {
    return __async(this, null, function* () {
      return [];
    });
  }
  updateSelections() {
    return __async(this, null, function* () {
      var _a2;
      if (!this.nodeDataRefresh) {
        return;
      }
      this.nodeDataRefresh = false;
      const { seriesRect } = (_a2 = this.chart) != null ? _a2 : {};
      if (!seriesRect)
        return;
      const descendants = Array.from(this.rootNode);
      const updateGroup = (group) => {
        group.append([
          new Rect5(),
          new Text11({ tag: 0 /* Primary */ }),
          new Text11({ tag: 1 /* Secondary */ })
        ]);
      };
      this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
      this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    });
  }
  getTileFormat(node, isHighlighted) {
    var _a2, _b;
    const { datum, depth, children } = node;
    const { colorKey, labelKey, secondaryLabelKey, sizeKey, tile, group, formatter } = this.properties;
    if (!formatter || datum == null || depth == null) {
      return {};
    }
    const isLeaf = children.length === 0;
    const fill = (_a2 = isLeaf ? tile.fill : group.fill) != null ? _a2 : node.fill;
    const stroke = (_b = isLeaf ? tile.stroke : group.stroke) != null ? _b : node.stroke;
    const strokeWidth = isLeaf ? tile.strokeWidth : group.strokeWidth;
    const result = this.ctx.callbackCache.call(formatter, {
      seriesId: this.id,
      depth,
      datum,
      colorKey,
      labelKey,
      secondaryLabelKey,
      sizeKey,
      fill,
      stroke,
      strokeWidth,
      highlighted: isHighlighted
    });
    return result != null ? result : {};
  }
  getNodeFill(node) {
    var _a2, _b, _c;
    const isLeaf = node.children.length === 0;
    if (isLeaf) {
      return (_a2 = this.properties.tile.fill) != null ? _a2 : node.fill;
    }
    const { undocumentedGroupFills } = this.properties;
    const defaultFill = undocumentedGroupFills[Math.min((_b = node.depth) != null ? _b : 0, undocumentedGroupFills.length)];
    return (_c = this.properties.group.fill) != null ? _c : defaultFill;
  }
  getNodeStroke(node) {
    var _a2, _b, _c;
    const isLeaf = node.children.length === 0;
    if (isLeaf) {
      return (_a2 = this.properties.tile.stroke) != null ? _a2 : node.stroke;
    }
    const { undocumentedGroupStrokes } = this.properties;
    const defaultStroke = undocumentedGroupStrokes[Math.min((_b = node.depth) != null ? _b : 0, undocumentedGroupStrokes.length)];
    return (_c = this.properties.group.stroke) != null ? _c : defaultStroke;
  }
  updateNodes() {
    return __async(this, null, function* () {
      var _a2, _b;
      const { rootNode, data } = this;
      const { highlightStyle, tile, group } = this.properties;
      const { seriesRect } = (_a2 = this.chart) != null ? _a2 : {};
      if (!seriesRect || !data)
        return;
      const { width, height } = seriesRect;
      const bboxes = Array.from(this.rootNode, () => void 0);
      this.squarify(rootNode, new BBox9(0, 0, width, height), bboxes);
      let highlightedNode = (_b = this.ctx.highlightManager) == null ? void 0 : _b.getActiveHighlight();
      if (highlightedNode != null && !this.properties.group.interactive && highlightedNode.children.length !== 0) {
        highlightedNode = void 0;
      }
      this.updateNodeMidPoint(bboxes);
      const updateRectFn = (node, rect, highlighted) => {
        var _a3, _b2, _c, _d, _e, _f, _g, _h, _i, _j;
        const bbox = bboxes[node.index];
        if (bbox == null) {
          rect.visible = false;
          return;
        }
        const isLeaf = node.children.length === 0;
        let highlightedFill;
        let highlightedFillOpacity;
        let highlightedStroke;
        let highlightedStrokeWidth;
        let highlightedStrokeOpacity;
        if (highlighted) {
          const { tile: hTitle, group: hGroup } = highlightStyle;
          highlightedFill = isLeaf ? hTitle.fill : hGroup.fill;
          highlightedFillOpacity = isLeaf ? hTitle.fillOpacity : hGroup.fillOpacity;
          highlightedStroke = isLeaf ? hTitle.stroke : hGroup.stroke;
          highlightedStrokeWidth = isLeaf ? hTitle.strokeWidth : hGroup.strokeWidth;
          highlightedStrokeOpacity = isLeaf ? hTitle.strokeOpacity : hGroup.strokeOpacity;
        }
        const format = this.getTileFormat(node, highlighted);
        const fill = (_b2 = (_a3 = format == null ? void 0 : format.fill) != null ? _a3 : highlightedFill) != null ? _b2 : this.getNodeFill(node);
        const fillOpacity = (_d = (_c = format == null ? void 0 : format.fillOpacity) != null ? _c : highlightedFillOpacity) != null ? _d : isLeaf ? tile.fillOpacity : group.fillOpacity;
        const stroke = (_f = (_e = format == null ? void 0 : format.stroke) != null ? _e : highlightedStroke) != null ? _f : this.getNodeStroke(node);
        const strokeWidth = (_h = (_g = format == null ? void 0 : format.strokeWidth) != null ? _g : highlightedStrokeWidth) != null ? _h : isLeaf ? tile.strokeWidth : group.strokeWidth;
        const strokeOpacity = (_j = (_i = format == null ? void 0 : format.strokeOpacity) != null ? _i : highlightedStrokeOpacity) != null ? _j : isLeaf ? tile.strokeOpacity : group.strokeOpacity;
        rect.fill = validateColor(fill);
        rect.fillOpacity = fillOpacity;
        rect.stroke = validateColor(stroke);
        rect.strokeWidth = strokeWidth;
        rect.strokeOpacity = strokeOpacity;
        rect.crisp = true;
        rect.x = bbox.x;
        rect.y = bbox.y;
        rect.width = bbox.width;
        rect.height = bbox.height;
        rect.visible = true;
      };
      this.groupSelection.selectByClass(Rect5).forEach((rect) => updateRectFn(rect.datum, rect, false));
      this.highlightSelection.selectByClass(Rect5).forEach((rect) => {
        var _a3;
        const isDatumHighlighted = rect.datum === highlightedNode;
        rect.visible = isDatumHighlighted || ((_a3 = highlightedNode == null ? void 0 : highlightedNode.contains(rect.datum)) != null ? _a3 : false);
        if (rect.visible) {
          updateRectFn(rect.datum, rect, isDatumHighlighted);
        }
      });
      const labelMeta = Array.from(this.rootNode, (node) => {
        var _a3, _b2, _c, _d;
        const { index, children } = node;
        const bbox = bboxes[index];
        const labelDatum = (_a3 = this.labelData) == null ? void 0 : _a3[index];
        if (bbox == null || labelDatum == null) {
          return;
        }
        if (children.length === 0) {
          const layout = {
            width: bbox.width,
            height: bbox.height,
            meta: null
          };
          const formatting = formatLabels(
            labelDatum.label,
            this.properties.tile.label,
            labelDatum.secondaryLabel,
            this.properties.tile.secondaryLabel,
            { padding: tile.padding },
            () => layout
          );
          if (formatting == null) {
            return;
          }
          const { height: labelHeight, label, secondaryLabel } = formatting;
          const { textAlign, verticalAlign, padding } = tile;
          const textAlignFactor = (_b2 = textAlignFactors2[textAlign]) != null ? _b2 : 0.5;
          const labelX = bbox.x + padding + (bbox.width - 2 * padding) * textAlignFactor;
          const verticalAlignFactor = (_c = verticalAlignFactors2[verticalAlign]) != null ? _c : 0.5;
          const labelYStart = bbox.y + padding + labelHeight * 0.5 + (bbox.height - 2 * padding - labelHeight) * verticalAlignFactor;
          return {
            label: label != null ? {
              text: label.text,
              fontSize: label.fontSize,
              lineHeight: label.lineHeight,
              style: this.properties.tile.label,
              x: labelX,
              y: labelYStart - (labelHeight - label.height) * 0.5
            } : void 0,
            secondaryLabel: secondaryLabel != null ? {
              text: secondaryLabel.text,
              fontSize: secondaryLabel.fontSize,
              lineHeight: secondaryLabel.fontSize,
              style: this.properties.tile.secondaryLabel,
              x: labelX,
              y: labelYStart + (labelHeight - secondaryLabel.height) * 0.5
            } : void 0,
            verticalAlign: "middle",
            textAlign
          };
        } else if ((labelDatum == null ? void 0 : labelDatum.label) == null) {
          return;
        } else {
          const { padding, textAlign } = group;
          const groupTitleHeight = this.groupTitleHeight(node, bbox);
          if (groupTitleHeight == null) {
            return;
          }
          const innerWidth = bbox.width - 2 * padding;
          const { text } = Text11.wrap(labelDatum.label, bbox.width - 2 * padding, Infinity, group.label, "never");
          const textAlignFactor = (_d = textAlignFactors2[textAlign]) != null ? _d : 0.5;
          return {
            label: {
              text,
              fontSize: group.label.fontSize,
              lineHeight: AutoSizedLabel.lineHeight(group.label.fontSize),
              style: this.properties.group.label,
              x: bbox.x + padding + innerWidth * textAlignFactor,
              y: bbox.y + padding + groupTitleHeight * 0.5
            },
            secondaryLabel: void 0,
            verticalAlign: "middle",
            textAlign
          };
        }
      });
      const updateLabelFn = (node, text, tag, highlighted) => {
        const isLeaf = node.children.length === 0;
        const meta = labelMeta[node.index];
        const label = tag === 0 /* Primary */ ? meta == null ? void 0 : meta.label : meta == null ? void 0 : meta.secondaryLabel;
        if (meta == null || label == null) {
          text.visible = false;
          return;
        }
        let highlightedColor;
        if (highlighted) {
          const { tile: hTitle, group: hGroup } = highlightStyle;
          highlightedColor = hTitle.secondaryLabel.color;
          if (!isLeaf) {
            highlightedColor = hGroup.label.color;
          } else if (tag === 0 /* Primary */) {
            highlightedColor = hTitle.label.color;
          }
        }
        text.text = label.text;
        text.fontSize = label.fontSize;
        text.lineHeight = label.lineHeight;
        text.fontStyle = label.style.fontStyle;
        text.fontFamily = label.style.fontFamily;
        text.fontWeight = label.style.fontWeight;
        text.fill = highlightedColor != null ? highlightedColor : label.style.color;
        text.textAlign = meta.textAlign;
        text.textBaseline = meta.verticalAlign;
        text.x = label.x;
        text.y = label.y;
        text.visible = true;
      };
      this.groupSelection.selectByClass(Text11).forEach((text) => {
        updateLabelFn(text.datum, text, text.tag, false);
      });
      this.highlightSelection.selectByClass(Text11).forEach((text) => {
        var _a3;
        const isDatumHighlighted = text.datum === highlightedNode;
        text.visible = isDatumHighlighted || ((_a3 = highlightedNode == null ? void 0 : highlightedNode.contains(text.datum)) != null ? _a3 : false);
        if (text.visible) {
          updateLabelFn(text.datum, text, text.tag, isDatumHighlighted);
        }
      });
    });
  }
  updateNodeMidPoint(bboxes) {
    this.rootNode.walk((node) => {
      const bbox = bboxes[node.index];
      if (bbox != null) {
        node.midPoint.x = bbox.x + bbox.width / 2;
        node.midPoint.y = bbox.y;
      }
    });
  }
  getTooltipHtml(node) {
    var _a2;
    const { datum, depth } = node;
    const { id: seriesId } = this;
    const {
      tooltip,
      colorKey,
      colorName = colorKey,
      labelKey,
      secondaryLabelKey,
      sizeKey,
      sizeName = sizeKey
    } = this.properties;
    const isLeaf = node.children.length === 0;
    const interactive = isLeaf || this.properties.group.interactive;
    if (datum == null || depth == null || !interactive) {
      return "";
    }
    const title = labelKey != null ? datum[labelKey] : void 0;
    const format = this.getTileFormat(node, false);
    const color = (_a2 = format == null ? void 0 : format.fill) != null ? _a2 : this.getNodeFill(node);
    if (!tooltip.renderer && !title) {
      return "";
    }
    const contentArray = [];
    const datumSecondaryLabel = secondaryLabelKey != null ? datum[secondaryLabelKey] : void 0;
    if (datumSecondaryLabel != null && secondaryLabelKey !== colorKey && secondaryLabelKey !== sizeKey) {
      contentArray.push(sanitizeHtml13(datumSecondaryLabel));
    }
    const datumSize = sizeKey != null ? datum[sizeKey] : void 0;
    if (datumSize != null) {
      contentArray.push(`${sizeName}: ${sanitizeHtml13(datumSize)}`);
    }
    const datumColor = colorKey != null ? datum[colorKey] : void 0;
    if (datumColor != null) {
      contentArray.push(`${colorName}: ${sanitizeHtml13(datumColor)}`);
    }
    const content = contentArray.join("<br>");
    const defaults = {
      title,
      color: isLeaf ? this.properties.tile.label.color : this.properties.group.label.color,
      backgroundColor: color,
      content
    };
    return tooltip.toTooltipHtml(defaults, {
      depth,
      datum,
      colorKey,
      labelKey,
      secondaryLabelKey,
      sizeKey,
      title,
      color,
      seriesId
    });
  }
};
_TreemapSeries.className = "TreemapSeries";
_TreemapSeries.type = "treemap";
var TreemapSeries = _TreemapSeries;

// packages/ag-charts-enterprise/src/series/treemap/treemapModule.ts
var {
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE: DEFAULT_DIVERGING_SERIES_COLOUR_RANGE4,
  DEFAULT_FONT_FAMILY: DEFAULT_FONT_FAMILY2,
  DEFAULT_HIERARCHY_FILLS: DEFAULT_HIERARCHY_FILLS2,
  DEFAULT_HIERARCHY_STROKES: DEFAULT_HIERARCHY_STROKES2,
  DEFAULT_INSIDE_SERIES_LABEL_COLOUR: DEFAULT_INSIDE_SERIES_LABEL_COLOUR2,
  EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS6,
  DEFAULT_LABEL_COLOUR: DEFAULT_LABEL_COLOUR3,
  FONT_WEIGHT: FONT_WEIGHT2
} = import_ag_charts_community118._Theme;
var TreemapModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["hierarchy"],
  identifier: "treemap",
  instanceConstructor: TreemapSeries,
  solo: true,
  themeTemplate: {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS6,
      group: {
        label: {
          enabled: true,
          color: DEFAULT_LABEL_COLOUR3,
          fontStyle: void 0,
          fontWeight: FONT_WEIGHT2.NORMAL,
          fontSize: 12,
          fontFamily: DEFAULT_FONT_FAMILY2,
          spacing: 4
        },
        fill: void 0,
        // Override default fill
        stroke: void 0,
        // Override default stroke
        strokeWidth: 1,
        padding: 4,
        gap: 2,
        textAlign: "left"
      },
      tile: {
        label: {
          enabled: true,
          color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR2,
          fontStyle: void 0,
          fontWeight: FONT_WEIGHT2.NORMAL,
          fontSize: 18,
          minimumFontSize: 10,
          fontFamily: DEFAULT_FONT_FAMILY2,
          wrapping: "on-space",
          overflowStrategy: "ellipsis",
          spacing: 2
        },
        secondaryLabel: {
          enabled: true,
          color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR2,
          fontStyle: void 0,
          fontWeight: void 0,
          fontSize: 12,
          minimumFontSize: 10,
          fontFamily: DEFAULT_FONT_FAMILY2,
          wrapping: "never",
          overflowStrategy: "ellipsis"
        },
        fill: void 0,
        // Override default fill
        stroke: void 0,
        // Override default stroke
        strokeWidth: 0,
        padding: 3,
        gap: 1
      },
      // Override defaults
      highlightStyle: {
        group: {
          label: {
            color: DEFAULT_LABEL_COLOUR3
          },
          fill: void 0,
          stroke: `rgba(0, 0, 0, 0.4)`,
          strokeWidth: 2
        },
        tile: {
          label: {
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR2
          },
          secondaryLabel: {
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR2
          },
          fill: void 0,
          stroke: `rgba(0, 0, 0, 0.4)`,
          strokeWidth: 2
        }
      }
    },
    gradientLegend: {
      enabled: true
    }
  },
  paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
    const { properties } = themeTemplateParameters;
    const { fills, strokes } = takeColors(colorsCount);
    const defaultColorRange = properties.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE4);
    const groupFills = properties.get(DEFAULT_HIERARCHY_FILLS2);
    const groupStrokes = properties.get(DEFAULT_HIERARCHY_STROKES2);
    return {
      fills,
      strokes,
      colorRange: defaultColorRange,
      undocumentedGroupFills: groupFills,
      undocumentedGroupStrokes: groupStrokes
    };
  }
};

// packages/ag-charts-enterprise/src/series/waterfall/waterfallModule.ts
var import_ag_charts_community122 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeries.ts
var import_ag_charts_community120 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeriesProperties.ts
var import_ag_charts_community119 = require("ag-charts-community");
var { DropShadow: DropShadow3, Label: Label10 } = import_ag_charts_community119._Scene;
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties5,
  BaseProperties: BaseProperties9,
  PropertiesArray: PropertiesArray2,
  SeriesTooltip: SeriesTooltip17,
  Validate: Validate49,
  BOOLEAN: BOOLEAN17,
  COLOR_STRING: COLOR_STRING22,
  FUNCTION: FUNCTION16,
  LINE_DASH: LINE_DASH16,
  NUMBER: NUMBER13,
  OBJECT: OBJECT20,
  OBJECT_ARRAY,
  POSITIVE_NUMBER: POSITIVE_NUMBER24,
  RATIO: RATIO28,
  STRING: STRING19,
  UNION: UNION5
} = import_ag_charts_community119._ModuleSupport;
var WaterfallSeriesTotal = class extends BaseProperties9 {
};
__decorateClass([
  Validate49(UNION5(["subtotal", "total"], "a total type"))
], WaterfallSeriesTotal.prototype, "totalType", 2);
__decorateClass([
  Validate49(NUMBER13)
], WaterfallSeriesTotal.prototype, "index", 2);
__decorateClass([
  Validate49(STRING19)
], WaterfallSeriesTotal.prototype, "axisLabel", 2);
var WaterfallSeriesItemTooltip = class extends BaseProperties9 {
};
__decorateClass([
  Validate49(FUNCTION16, { optional: true })
], WaterfallSeriesItemTooltip.prototype, "renderer", 2);
var WaterfallSeriesLabel = class extends Label10 {
  constructor() {
    super(...arguments);
    this.placement = "end";
    this.padding = 6;
  }
};
__decorateClass([
  Validate49(UNION5(["start", "end", "inside"], "a placement"))
], WaterfallSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate49(POSITIVE_NUMBER24)
], WaterfallSeriesLabel.prototype, "padding", 2);
var WaterfallSeriesItem = class extends BaseProperties9 {
  constructor() {
    super(...arguments);
    this.fill = "#c16068";
    this.stroke = "#c16068";
    this.fillOpacity = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.strokeWidth = 1;
    this.cornerRadius = 0;
    this.shadow = new DropShadow3().set({ enabled: false });
    this.label = new WaterfallSeriesLabel();
    this.tooltip = new WaterfallSeriesItemTooltip();
  }
};
__decorateClass([
  Validate49(STRING19, { optional: true })
], WaterfallSeriesItem.prototype, "name", 2);
__decorateClass([
  Validate49(COLOR_STRING22)
], WaterfallSeriesItem.prototype, "fill", 2);
__decorateClass([
  Validate49(COLOR_STRING22)
], WaterfallSeriesItem.prototype, "stroke", 2);
__decorateClass([
  Validate49(RATIO28)
], WaterfallSeriesItem.prototype, "fillOpacity", 2);
__decorateClass([
  Validate49(RATIO28)
], WaterfallSeriesItem.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate49(LINE_DASH16)
], WaterfallSeriesItem.prototype, "lineDash", 2);
__decorateClass([
  Validate49(POSITIVE_NUMBER24)
], WaterfallSeriesItem.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate49(POSITIVE_NUMBER24)
], WaterfallSeriesItem.prototype, "strokeWidth", 2);
__decorateClass([
  Validate49(POSITIVE_NUMBER24)
], WaterfallSeriesItem.prototype, "cornerRadius", 2);
__decorateClass([
  Validate49(FUNCTION16, { optional: true })
], WaterfallSeriesItem.prototype, "formatter", 2);
__decorateClass([
  Validate49(OBJECT20)
], WaterfallSeriesItem.prototype, "shadow", 2);
__decorateClass([
  Validate49(OBJECT20)
], WaterfallSeriesItem.prototype, "label", 2);
__decorateClass([
  Validate49(OBJECT20)
], WaterfallSeriesItem.prototype, "tooltip", 2);
var WaterfallSeriesConnectorLine = class extends BaseProperties9 {
  constructor() {
    super(...arguments);
    this.enabled = true;
    this.stroke = "black";
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.strokeWidth = 2;
  }
};
__decorateClass([
  Validate49(BOOLEAN17)
], WaterfallSeriesConnectorLine.prototype, "enabled", 2);
__decorateClass([
  Validate49(COLOR_STRING22)
], WaterfallSeriesConnectorLine.prototype, "stroke", 2);
__decorateClass([
  Validate49(RATIO28)
], WaterfallSeriesConnectorLine.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate49(LINE_DASH16)
], WaterfallSeriesConnectorLine.prototype, "lineDash", 2);
__decorateClass([
  Validate49(POSITIVE_NUMBER24)
], WaterfallSeriesConnectorLine.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate49(POSITIVE_NUMBER24)
], WaterfallSeriesConnectorLine.prototype, "strokeWidth", 2);
var WaterfallSeriesItems = class extends BaseProperties9 {
  constructor() {
    super(...arguments);
    this.positive = new WaterfallSeriesItem();
    this.negative = new WaterfallSeriesItem();
    this.total = new WaterfallSeriesItem();
  }
};
__decorateClass([
  Validate49(OBJECT20)
], WaterfallSeriesItems.prototype, "positive", 2);
__decorateClass([
  Validate49(OBJECT20)
], WaterfallSeriesItems.prototype, "negative", 2);
__decorateClass([
  Validate49(OBJECT20)
], WaterfallSeriesItems.prototype, "total", 2);
var WaterfallSeriesProperties = class extends AbstractBarSeriesProperties5 {
  constructor() {
    super(...arguments);
    this.item = new WaterfallSeriesItems();
    this.totals = new PropertiesArray2(WaterfallSeriesTotal);
    this.line = new WaterfallSeriesConnectorLine();
    this.tooltip = new SeriesTooltip17();
  }
};
__decorateClass([
  Validate49(STRING19)
], WaterfallSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate49(STRING19)
], WaterfallSeriesProperties.prototype, "yKey", 2);
__decorateClass([
  Validate49(STRING19, { optional: true })
], WaterfallSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate49(STRING19, { optional: true })
], WaterfallSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate49(OBJECT20)
], WaterfallSeriesProperties.prototype, "item", 2);
__decorateClass([
  Validate49(OBJECT_ARRAY)
], WaterfallSeriesProperties.prototype, "totals", 2);
__decorateClass([
  Validate49(OBJECT20)
], WaterfallSeriesProperties.prototype, "line", 2);
__decorateClass([
  Validate49(OBJECT20)
], WaterfallSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeries.ts
var {
  adjustLabelPlacement,
  SeriesNodePickMode: SeriesNodePickMode11,
  fixNumericExtent: fixNumericExtent9,
  valueProperty: valueProperty14,
  keyProperty: keyProperty8,
  accumulativeValueProperty,
  trailingAccumulatedValueProperty,
  ChartAxisDirection: ChartAxisDirection18,
  getRectConfig: getRectConfig2,
  updateRect: updateRect2,
  checkCrisp: checkCrisp2,
  updateLabelNode: updateLabelNode3,
  prepareBarAnimationFunctions: prepareBarAnimationFunctions3,
  collapsedStartingBarPosition: collapsedStartingBarPosition2,
  resetBarSelectionsFn: resetBarSelectionsFn3,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation7,
  resetLabelFn: resetLabelFn5,
  animationValidation: animationValidation9,
  DEFAULT_CARTESIAN_DIRECTION_KEYS: DEFAULT_CARTESIAN_DIRECTION_KEYS2,
  DEFAULT_CARTESIAN_DIRECTION_NAMES: DEFAULT_CARTESIAN_DIRECTION_NAMES2
} = import_ag_charts_community120._ModuleSupport;
var { Rect: Rect6, motion: motion9 } = import_ag_charts_community120._Scene;
var { sanitizeHtml: sanitizeHtml14, isContinuous, isNumber: isNumber6 } = import_ag_charts_community120._Util;
var { ContinuousScale: ContinuousScale4, OrdinalTimeScale: OrdinalTimeScale5 } = import_ag_charts_community120._Scale;
var _WaterfallSeries = class _WaterfallSeries extends import_ag_charts_community120._ModuleSupport.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS2,
      directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES2,
      pickModes: [SeriesNodePickMode11.EXACT_SHAPE_MATCH],
      pathsPerSeries: 1,
      hasHighlightedLabels: true,
      pathsZIndexSubOrderOffset: [-1, -1],
      animationResetFns: {
        datum: resetBarSelectionsFn3,
        label: resetLabelFn5
      }
    });
    this.properties = new WaterfallSeriesProperties();
    this.seriesItemTypes = /* @__PURE__ */ new Set(["positive", "negative", "total"]);
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b, _c;
      const { xKey, yKey, totals } = this.properties;
      const { data = [] } = this;
      if (!this.properties.isValid()) {
        return;
      }
      const positiveNumber = (v) => {
        return isContinuous(v) && Number(v) >= 0;
      };
      const negativeNumber = (v) => {
        return isContinuous(v) && Number(v) < 0;
      };
      const totalTypeValue = (v) => {
        return v === "total" || v === "subtotal";
      };
      const propertyDefinition = {
        missingValue: void 0,
        invalidValue: void 0
      };
      const dataWithTotals = [];
      const totalsMap = totals.reduce((result, total) => {
        const totalsAtIndex = result.get(total.index);
        if (totalsAtIndex) {
          totalsAtIndex.push(total);
        } else {
          result.set(total.index, [total]);
        }
        return result;
      }, /* @__PURE__ */ new Map());
      data.forEach((datum, i) => {
        var _a3;
        dataWithTotals.push(datum);
        (_a3 = totalsMap.get(i)) == null ? void 0 : _a3.forEach((total) => dataWithTotals.push(__spreadProps(__spreadValues({}, total.toJson()), { [xKey]: total.axisLabel })));
      });
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const isContinuousX = ContinuousScale4.is(xScale) || OrdinalTimeScale5.is(xScale);
      const xValueType = ContinuousScale4.is(xScale) ? "range" : "category";
      const extraProps = [];
      if (!this.ctx.animationManager.isSkipped()) {
        extraProps.push(animationValidation9(this));
      }
      const { processedData } = yield this.requestDataModel(dataController, dataWithTotals, {
        props: [
          keyProperty8(this, xKey, isContinuousX, { id: `xValue`, valueType: xValueType }),
          accumulativeValueProperty(this, yKey, true, __spreadProps(__spreadValues({}, propertyDefinition), {
            id: `yCurrent`
          })),
          accumulativeValueProperty(this, yKey, true, __spreadProps(__spreadValues({}, propertyDefinition), {
            missingValue: 0,
            id: `yCurrentTotal`
          })),
          accumulativeValueProperty(this, yKey, true, __spreadProps(__spreadValues({}, propertyDefinition), {
            id: `yCurrentPositive`,
            validation: positiveNumber
          })),
          accumulativeValueProperty(this, yKey, true, __spreadProps(__spreadValues({}, propertyDefinition), {
            id: `yCurrentNegative`,
            validation: negativeNumber
          })),
          trailingAccumulatedValueProperty(this, yKey, true, __spreadProps(__spreadValues({}, propertyDefinition), {
            id: `yPrevious`
          })),
          valueProperty14(this, yKey, true, { id: `yRaw` }),
          // Raw value pass-through.
          valueProperty14(this, "totalType", false, {
            id: `totalTypeValue`,
            missingValue: void 0,
            validation: totalTypeValue
          }),
          ...isContinuousX ? [import_ag_charts_community120._ModuleSupport.SMALLEST_KEY_INTERVAL] : [],
          ...extraProps
        ],
        dataVisible: this.visible
      });
      this.smallestDataInterval = {
        x: (_c = (_b = processedData.reduced) == null ? void 0 : _b.smallestKeyInterval) != null ? _c : Infinity,
        y: Infinity
      };
      this.updateSeriesItemTypes();
      this.animationState.transition("updateData");
    });
  }
  getSeriesDomain(direction) {
    var _a2;
    const { processedData, dataModel } = this;
    if (!processedData || !dataModel)
      return [];
    const {
      domain: {
        keys: [keys],
        values
      },
      reduced: { [import_ag_charts_community120._ModuleSupport.SMALLEST_KEY_INTERVAL.property]: smallestX } = {}
    } = processedData;
    const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
    if (direction === this.getCategoryDirection()) {
      if ((keyDef == null ? void 0 : keyDef.def.type) === "key" && (keyDef == null ? void 0 : keyDef.def.valueType) === "category") {
        return keys;
      }
      const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
      const keysExtent = (_a2 = import_ag_charts_community120._ModuleSupport.extent(keys)) != null ? _a2 : [NaN, NaN];
      const categoryAxis = this.getCategoryAxis();
      const isReversed = Boolean(categoryAxis == null ? void 0 : categoryAxis.isReversed());
      const isDirectionY = direction === ChartAxisDirection18.Y;
      const padding0 = isReversed === isDirectionY ? 0 : -scalePadding;
      const padding1 = isReversed === isDirectionY ? scalePadding : 0;
      const d0 = keysExtent[0] + padding0;
      const d1 = keysExtent[1] + padding1;
      return fixNumericExtent9([d0, d1], categoryAxis);
    } else {
      const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrent").index;
      const yExtent = values[yCurrIndex];
      const fixedYExtent = [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])];
      return fixNumericExtent9(fixedYExtent);
    }
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b, _c;
      const { data, dataModel, smallestDataInterval } = this;
      const { visible, line } = this.properties;
      const categoryAxis = this.getCategoryAxis();
      const valueAxis = this.getValueAxis();
      if (!(data && visible && categoryAxis && valueAxis && dataModel)) {
        return [];
      }
      const xScale = categoryAxis.scale;
      const yScale = valueAxis.scale;
      const categoryAxisReversed = categoryAxis.isReversed();
      const barAlongX = this.getBarDirection() === ChartAxisDirection18.X;
      const barWidth = (_a2 = ContinuousScale4.is(xScale) ? xScale.calcBandwidth(smallestDataInterval == null ? void 0 : smallestDataInterval.x) : xScale.bandwidth) != null ? _a2 : 10;
      if (((_b = this.processedData) == null ? void 0 : _b.type) !== "ungrouped") {
        return [];
      }
      const contexts = [];
      const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yRaw`).index;
      const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
      const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`).index;
      const contextIndexMap = /* @__PURE__ */ new Map();
      const pointData = [];
      const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrent").index;
      const yPrevIndex = dataModel.resolveProcessedDataIndexById(this, "yPrevious").index;
      const yCurrTotalIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrentTotal").index;
      function getValues(isTotal, isSubtotal, values) {
        if (isTotal || isSubtotal) {
          return {
            cumulativeValue: values[yCurrTotalIndex],
            trailingValue: isSubtotal ? trailingSubtotal : 0
          };
        }
        return {
          cumulativeValue: values[yCurrIndex],
          trailingValue: values[yPrevIndex]
        };
      }
      function getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue) {
        if (isTotal) {
          return cumulativeValue;
        }
        if (isSubtotal) {
          return (cumulativeValue != null ? cumulativeValue : 0) - (trailingValue != null ? trailingValue : 0);
        }
        return rawValue;
      }
      let trailingSubtotal = 0;
      const { xKey, yKey, xName, yName } = this.properties;
      (_c = this.processedData) == null ? void 0 : _c.data.forEach(({ keys, datum, values }, dataIndex) => {
        var _a3;
        const datumType = values[totalTypeIndex];
        const isSubtotal = this.isSubtotal(datumType);
        const isTotal = this.isTotal(datumType);
        const isTotalOrSubtotal = isTotal || isSubtotal;
        const xDatum = keys[xIndex];
        const x = Math.round(xScale.convert(xDatum));
        const rawValue = values[yRawIndex];
        const { cumulativeValue, trailingValue } = getValues(isTotal, isSubtotal, values);
        if (isTotalOrSubtotal) {
          trailingSubtotal = cumulativeValue != null ? cumulativeValue : 0;
        }
        const currY = Math.round(yScale.convert(cumulativeValue));
        const trailY = Math.round(yScale.convert(trailingValue));
        const value = getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue);
        const isPositive = (value != null ? value : 0) >= 0;
        const seriesItemType = this.getSeriesItemType(isPositive, datumType);
        const { fill, stroke, strokeWidth, label } = this.getItemConfig(seriesItemType);
        const y = isPositive ? currY : trailY;
        const bottomY = isPositive ? trailY : currY;
        const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));
        const itemId = seriesItemType;
        let contextIndex = contextIndexMap.get(itemId);
        if (contextIndex === void 0) {
          contextIndex = contexts.length;
          contextIndexMap.set(itemId, contextIndex);
        }
        (_a3 = contexts[contextIndex]) != null ? _a3 : contexts[contextIndex] = {
          itemId,
          nodeData: [],
          labelData: [],
          pointData: [],
          scales: __superGet(_WaterfallSeries.prototype, this, "calculateScaling").call(this),
          visible: this.visible
        };
        const rect = {
          x: barAlongX ? Math.min(y, bottomY) : x,
          y: barAlongX ? x : Math.min(y, bottomY),
          width: barAlongX ? barHeight : barWidth,
          height: barAlongX ? barWidth : barHeight
        };
        const nodeMidPoint = {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2
        };
        const pointY = isTotalOrSubtotal ? currY : trailY;
        const pixelAlignmentOffset = Math.floor(line.strokeWidth) % 2 / 2;
        const startY = categoryAxisReversed ? currY : pointY;
        const stopY = categoryAxisReversed ? pointY : currY;
        let startCoordinates;
        let stopCoordinates;
        if (barAlongX) {
          startCoordinates = {
            x: startY + pixelAlignmentOffset,
            y: rect.y
          };
          stopCoordinates = {
            x: stopY + pixelAlignmentOffset,
            y: rect.y + rect.height
          };
        } else {
          startCoordinates = {
            x: rect.x,
            y: startY + pixelAlignmentOffset
          };
          stopCoordinates = {
            x: rect.x + rect.width,
            y: stopY + pixelAlignmentOffset
          };
        }
        const pathPoint = {
          // lineTo
          x: categoryAxisReversed ? stopCoordinates.x : startCoordinates.x,
          y: categoryAxisReversed ? stopCoordinates.y : startCoordinates.y,
          // moveTo
          x2: categoryAxisReversed ? startCoordinates.x : stopCoordinates.x,
          y2: categoryAxisReversed ? startCoordinates.y : stopCoordinates.y,
          size: 0
        };
        pointData.push(pathPoint);
        const labelText = this.getLabelText(
          label,
          {
            itemId: itemId === "subtotal" ? "total" : itemId,
            value,
            datum,
            xKey,
            yKey,
            xName,
            yName
          },
          (v) => isNumber6(v) ? v.toFixed(2) : String(v)
        );
        const nodeDatum = {
          index: dataIndex,
          series: this,
          itemId,
          datum,
          cumulativeValue: cumulativeValue != null ? cumulativeValue : 0,
          xValue: xDatum,
          yValue: value,
          yKey,
          xKey,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          midPoint: nodeMidPoint,
          fill,
          stroke,
          strokeWidth,
          opacity: 1,
          label: __spreadValues({
            text: labelText
          }, adjustLabelPlacement({
            isPositive: (value != null ? value : -1) >= 0,
            isVertical: !barAlongX,
            placement: label.placement,
            padding: label.padding,
            rect
          }))
        };
        contexts[contextIndex].nodeData.push(nodeDatum);
        contexts[contextIndex].labelData.push(nodeDatum);
      });
      const connectorLinesEnabled = this.properties.line.enabled;
      if (contexts.length > 0 && yCurrIndex !== void 0 && connectorLinesEnabled) {
        contexts[0].pointData = pointData;
      }
      return contexts;
    });
  }
  updateSeriesItemTypes() {
    var _a2, _b;
    const { dataModel, seriesItemTypes, processedData } = this;
    if (!dataModel || !processedData) {
      return;
    }
    seriesItemTypes.clear();
    const yPositiveIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrentPositive").index;
    const yNegativeIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrentNegative").index;
    const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`).index;
    const positiveDomain = (_a2 = processedData.domain.values[yPositiveIndex]) != null ? _a2 : [];
    const negativeDomain = (_b = processedData.domain.values[yNegativeIndex]) != null ? _b : [];
    if (positiveDomain.length > 0) {
      seriesItemTypes.add("positive");
    }
    if (negativeDomain.length > 0) {
      seriesItemTypes.add("negative");
    }
    const itemTypes = processedData == null ? void 0 : processedData.domain.values[totalTypeIndex];
    if (!itemTypes) {
      return;
    }
    itemTypes.forEach((type) => {
      if (type === "total" || type === "subtotal") {
        seriesItemTypes.add("total");
      }
    });
  }
  isSubtotal(datumType) {
    return datumType === "subtotal";
  }
  isTotal(datumType) {
    return datumType === "total";
  }
  nodeFactory() {
    return new Rect6();
  }
  getSeriesItemType(isPositive, datumType) {
    return datumType != null ? datumType : isPositive ? "positive" : "negative";
  }
  getItemConfig(seriesItemType) {
    switch (seriesItemType) {
      case "positive": {
        return this.properties.item.positive;
      }
      case "negative": {
        return this.properties.item.negative;
      }
      case "subtotal":
      case "total": {
        return this.properties.item.total;
      }
    }
  }
  updateDatumSelection(opts) {
    return __async(this, null, function* () {
      const { nodeData, datumSelection } = opts;
      const data = nodeData != null ? nodeData : [];
      return datumSelection.update(data);
    });
  }
  updateDatumNodes(opts) {
    return __async(this, null, function* () {
      const { datumSelection, isHighlight } = opts;
      const { id: seriesId, ctx } = this;
      const {
        yKey,
        highlightStyle: { item: itemHighlightStyle }
      } = this.properties;
      const categoryAxis = this.getCategoryAxis();
      const crisp = checkCrisp2(categoryAxis == null ? void 0 : categoryAxis.visibleRange);
      const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection18.X;
      datumSelection.each((rect, datum) => {
        const seriesItemType = datum.itemId;
        const {
          fillOpacity,
          strokeOpacity,
          strokeWidth,
          lineDash,
          lineDashOffset,
          cornerRadius,
          formatter,
          shadow: fillShadow
        } = this.getItemConfig(seriesItemType);
        const style = {
          fill: datum.fill,
          stroke: datum.stroke,
          fillOpacity,
          strokeOpacity,
          lineDash,
          lineDashOffset,
          fillShadow,
          strokeWidth: this.getStrokeWidth(strokeWidth),
          cornerRadius
        };
        const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
        const config = getRectConfig2({
          datum,
          isHighlighted: isHighlight,
          style,
          highlightStyle: itemHighlightStyle,
          formatter,
          seriesId,
          itemId: datum.itemId,
          ctx,
          value: datum.yValue,
          yKey
        });
        config.crisp = crisp;
        config.visible = visible;
        updateRect2({ rect, config });
      });
    });
  }
  updateLabelSelection(opts) {
    return __async(this, null, function* () {
      const { labelData, labelSelection } = opts;
      if (labelData.length === 0) {
        return labelSelection.update([]);
      }
      const itemId = labelData[0].itemId;
      const { label } = this.getItemConfig(itemId);
      const data = label.enabled ? labelData : [];
      return labelSelection.update(data);
    });
  }
  updateLabelNodes(opts) {
    return __async(this, null, function* () {
      opts.labelSelection.each((textNode, datum) => {
        updateLabelNode3(textNode, this.getItemConfig(datum.itemId).label, datum.label);
      });
    });
  }
  getTooltipHtml(nodeDatum) {
    var _a2, _b, _c;
    const categoryAxis = this.getCategoryAxis();
    const valueAxis = this.getValueAxis();
    if (!this.properties.isValid() || !categoryAxis || !valueAxis) {
      return "";
    }
    const { id: seriesId } = this;
    const { xKey, yKey, xName, yName, tooltip } = this.properties;
    const { datum, itemId, xValue, yValue } = nodeDatum;
    const { fill, strokeWidth, name, formatter } = this.getItemConfig(itemId);
    let format;
    if (formatter) {
      format = this.ctx.callbackCache.call(formatter, {
        datum,
        value: yValue,
        xKey,
        yKey,
        fill,
        strokeWidth,
        highlighted: false,
        seriesId,
        itemId: nodeDatum.itemId
      });
    }
    const color = (_b = (_a2 = format == null ? void 0 : format.fill) != null ? _a2 : fill) != null ? _b : "gray";
    const xString = sanitizeHtml14(categoryAxis.formatDatum(xValue));
    const yString = sanitizeHtml14(valueAxis.formatDatum(yValue));
    const isTotal = this.isTotal(itemId);
    const isSubtotal = this.isSubtotal(itemId);
    let ySubheading;
    if (isTotal) {
      ySubheading = "Total";
    } else if (isSubtotal) {
      ySubheading = "Subtotal";
    } else {
      ySubheading = (_c = name != null ? name : yName) != null ? _c : yKey;
    }
    const title = sanitizeHtml14(yName);
    const content = `<b>${sanitizeHtml14(xName != null ? xName : xKey)}</b>: ${xString}<br/><b>${sanitizeHtml14(ySubheading)}</b>: ${yString}`;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      { seriesId, itemId, datum, xKey, yKey, xName, yName, color }
    );
  }
  getLegendData(legendType) {
    if (legendType !== "category") {
      return [];
    }
    const { id, seriesItemTypes } = this;
    const legendData = [];
    const capitalise = (text) => text.charAt(0).toUpperCase() + text.substring(1);
    seriesItemTypes.forEach((item) => {
      const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, name } = this.getItemConfig(item);
      legendData.push({
        legendType: "category",
        id,
        itemId: item,
        seriesId: id,
        enabled: true,
        label: { text: name != null ? name : capitalise(item) },
        marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth }
      });
    });
    return legendData;
  }
  toggleSeriesItem() {
  }
  animateEmptyUpdateReady({ datumSelections, labelSelections, contextData, paths }) {
    const fns = prepareBarAnimationFunctions3(collapsedStartingBarPosition2(this.isVertical(), this.axes, "normal"));
    motion9.fromToMotion(this.id, "datums", this.ctx.animationManager, datumSelections, fns);
    seriesLabelFadeInAnimation7(this, "labels", this.ctx.animationManager, labelSelections);
    contextData.forEach(({ pointData }, contextDataIndex) => {
      if (contextDataIndex !== 0 || !pointData) {
        return;
      }
      const [lineNode] = paths[contextDataIndex];
      if (this.isVertical()) {
        this.animateConnectorLinesVertical(lineNode, pointData);
      } else {
        this.animateConnectorLinesHorizontal(lineNode, pointData);
      }
    });
  }
  animateConnectorLinesHorizontal(lineNode, pointData) {
    const { path: linePath } = lineNode;
    this.updateLineNode(lineNode);
    const valueAxis = this.getValueAxis();
    const valueAxisReversed = valueAxis == null ? void 0 : valueAxis.isReversed();
    const compare = valueAxisReversed ? (v, v2) => v < v2 : (v, v2) => v > v2;
    const startX = valueAxis == null ? void 0 : valueAxis.scale.convert(0);
    const endX = pointData.reduce(
      (end, point) => {
        if (compare(point.x, end)) {
          end = point.x;
        }
        return end;
      },
      valueAxisReversed ? Infinity : 0
    );
    const scale = (value, start1, end1, start2, end2) => {
      return (value - start1) / (end1 - start1) * (end2 - start2) + start2;
    };
    this.ctx.animationManager.animate({
      id: `${this.id}_connectors`,
      groupId: this.id,
      phase: "initial",
      from: startX,
      to: endX,
      ease: import_ag_charts_community120._ModuleSupport.Motion.easeOut,
      collapsable: false,
      onUpdate(pointX) {
        linePath.clear({ trackChanges: true });
        pointData.forEach((point, index) => {
          const x = scale(pointX, startX, endX, startX, point.x);
          const x2 = scale(pointX, startX, endX, startX, point.x2);
          if (index !== 0) {
            linePath.lineTo(x, point.y);
          }
          linePath.moveTo(x2, point.y2);
        });
        lineNode.checkPathDirty();
      }
    });
  }
  animateConnectorLinesVertical(lineNode, pointData) {
    const { path: linePath } = lineNode;
    this.updateLineNode(lineNode);
    const valueAxis = this.getValueAxis();
    const valueAxisReversed = valueAxis == null ? void 0 : valueAxis.isReversed();
    const compare = valueAxisReversed ? (v, v2) => v > v2 : (v, v2) => v < v2;
    const startY = valueAxis == null ? void 0 : valueAxis.scale.convert(0);
    const endY = pointData.reduce(
      (end, point) => {
        if (compare(point.y, end)) {
          end = point.y;
        }
        return end;
      },
      valueAxisReversed ? 0 : Infinity
    );
    const scale = (value, start1, end1, start2, end2) => {
      return (value - start1) / (end1 - start1) * (end2 - start2) + start2;
    };
    this.ctx.animationManager.animate({
      id: `${this.id}_connectors`,
      groupId: this.id,
      phase: "initial",
      from: startY,
      to: endY,
      ease: import_ag_charts_community120._ModuleSupport.Motion.easeOut,
      collapsable: false,
      onUpdate(pointY) {
        linePath.clear({ trackChanges: true });
        pointData.forEach((point, index) => {
          const y = scale(pointY, startY, endY, startY, point.y);
          const y2 = scale(pointY, startY, endY, startY, point.y2);
          if (index !== 0) {
            linePath.lineTo(point.x, y);
          }
          linePath.moveTo(point.x2, y2);
        });
        lineNode.checkPathDirty();
      }
    });
  }
  animateReadyResize(data) {
    super.animateReadyResize(data);
    this.resetConnectorLinesPath(data);
  }
  updatePaths(opts) {
    return __async(this, null, function* () {
      this.resetConnectorLinesPath({ contextData: [opts.contextData], paths: [opts.paths] });
    });
  }
  resetConnectorLinesPath({
    contextData,
    paths
  }) {
    if (paths.length === 0) {
      return;
    }
    const [lineNode] = paths[0];
    this.updateLineNode(lineNode);
    const { path: linePath } = lineNode;
    linePath.clear({ trackChanges: true });
    const { pointData } = contextData[0];
    if (!pointData) {
      return;
    }
    pointData.forEach((point, index) => {
      if (index !== 0) {
        linePath.lineTo(point.x, point.y);
      }
      linePath.moveTo(point.x2, point.y2);
    });
    lineNode.checkPathDirty();
  }
  updateLineNode(lineNode) {
    const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.properties.line;
    lineNode.setProperties({
      fill: void 0,
      stroke,
      strokeWidth: this.getStrokeWidth(strokeWidth),
      strokeOpacity,
      lineDash,
      lineDashOffset,
      lineJoin: "round",
      pointerEvents: import_ag_charts_community120._Scene.PointerEvents.None
    });
  }
  isLabelEnabled() {
    const { positive, negative, total } = this.properties.item;
    return positive.label.enabled || negative.label.enabled || total.label.enabled;
  }
  onDataChange() {
  }
};
_WaterfallSeries.className = "WaterfallSeries";
_WaterfallSeries.type = "waterfall";
var WaterfallSeries = _WaterfallSeries;

// packages/ag-charts-enterprise/src/series/waterfall/waterfallThemes.ts
var import_ag_charts_community121 = require("ag-charts-community");
var itemTheme = {
  strokeWidth: 0,
  label: {
    enabled: false,
    fontStyle: void 0,
    fontWeight: import_ag_charts_community121._Theme.FONT_WEIGHT.NORMAL,
    fontSize: 12,
    fontFamily: import_ag_charts_community121._Theme.DEFAULT_FONT_FAMILY,
    color: import_ag_charts_community121._Theme.DEFAULT_LABEL_COLOUR,
    formatter: void 0,
    placement: "inside"
  }
};
var WATERFALL_SERIES_THEME = {
  series: {
    __extends__: import_ag_charts_community121._Theme.EXTENDS_SERIES_DEFAULTS,
    item: {
      positive: itemTheme,
      negative: itemTheme,
      total: itemTheme
    },
    line: {
      stroke: import_ag_charts_community121._Theme.DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
      strokeOpacity: 1,
      lineDash: [0],
      lineDashOffset: 0,
      strokeWidth: 2
    }
  },
  legend: {
    enabled: true,
    item: {
      toggleSeriesVisible: false
    }
  }
};

// packages/ag-charts-enterprise/src/series/waterfall/waterfallModule.ts
var WaterfallModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "waterfall",
  solo: true,
  instanceConstructor: WaterfallSeries,
  defaultAxes: [
    {
      type: import_ag_charts_community122._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community122._Theme.POSITION.BOTTOM
    },
    {
      type: import_ag_charts_community122._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community122._Theme.POSITION.LEFT
    }
  ],
  themeTemplate: WATERFALL_SERIES_THEME,
  swapDefaultAxesCondition: ({ direction }) => direction === "horizontal",
  paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
    const { properties } = themeTemplateParameters;
    const { fills, strokes } = takeColors(colorsCount);
    return userPalette ? {
      item: {
        positive: {
          fill: fills[0],
          stroke: strokes[0]
        },
        negative: {
          fill: fills[1],
          stroke: strokes[1]
        },
        total: {
          fill: fills[2],
          stroke: strokes[2]
        }
      }
    } : {
      item: {
        positive: properties.get(import_ag_charts_community122._Theme.DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS),
        negative: properties.get(import_ag_charts_community122._Theme.DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS),
        total: properties.get(import_ag_charts_community122._Theme.DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS)
      }
    };
  }
};

// packages/ag-charts-enterprise/src/setup.ts
function setupEnterpriseModules() {
  import_ag_charts_community123._ModuleSupport.moduleRegistry.register(
    AngleCategoryAxisModule,
    AngleNumberAxisModule,
    AnimationModule,
    BackgroundModule,
    BoxPlotModule,
    CandlestickModule,
    BulletModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    ErrorBarsModule,
    MapLineModule,
    MapLineBackgroundModule,
    MapMarkerModule,
    MapShapeModule,
    MapShapeBackgroundModule,
    NavigatorModule,
    GradientLegendModule,
    HeatmapModule,
    NightingaleModule,
    OrdinalTimeAxisModule,
    RadarAreaModule,
    RadarLineModule,
    RadialBarModule,
    RadialColumnModule,
    RadiusCategoryAxisModule,
    RadiusNumberAxisModule,
    RangeBarModule,
    RangeButtonsModule,
    RangeAreaModule,
    SunburstModule,
    SyncModule,
    TreemapModule,
    WaterfallModule,
    ZoomModule
  );
  import_ag_charts_community123._ModuleSupport.enterpriseModule.isEnterprise = true;
  import_ag_charts_community123._ModuleSupport.enterpriseModule.licenseManager = (options) => {
    var _a2, _b;
    return new LicenseManager(
      (_b = (_a2 = options.container) == null ? void 0 : _a2.ownerDocument) != null ? _b : typeof document === "undefined" ? void 0 : document
    );
  };
  import_ag_charts_community123._ModuleSupport.enterpriseModule.injectWatermark = injectWatermark;
}

// packages/ag-charts-enterprise/src/main.ts
__reExport(main_exports, require("ag-charts-community"), module.exports);
setupEnterpriseModules();
