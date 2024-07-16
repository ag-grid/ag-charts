var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
import { AgCharts, time } from "ag-charts-community";

// packages/ag-charts-enterprise/src/setup.ts
import { _ModuleSupport as _ModuleSupport99 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/axes/angle/angleAxisThemes.ts
import { _Theme } from "ag-charts-community";
var ANGLE_AXIS_THEME = {
  __extends__: _Theme.EXTENDS_AXES_DEFAULTS,
  gridLine: {
    enabled: false,
    __extends__: _Theme.EXTENDS_AXES_GRID_LINE_DEFAULTS
  }
};

// packages/ag-charts-enterprise/src/axes/angle-category/angleCategoryAxis.ts
import { _ModuleSupport as _ModuleSupport4, _Scale as _Scale2, _Util as _Util4 } from "ag-charts-community";

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
import { _ModuleSupport as _ModuleSupport3, _Scene as _Scene3, _Util as _Util3 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/axes/polar-crosslines/angleCrossLine.ts
import { _ModuleSupport as _ModuleSupport2, _Scale, _Scene as _Scene2, _Util as _Util2 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/axes/polar-crosslines/polarCrossLine.ts
import { _ModuleSupport, _Scene, _Util } from "ag-charts-community";
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
} = _ModuleSupport;
var { Group } = _Scene;
var { createId } = _Util;
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
var { ChartAxisDirection: ChartAxisDirection2, validateCrossLineValues } = _ModuleSupport2;
var { Path, Sector, Text } = _Scene2;
var { normalizeAngle360, isNumberEqual } = _Util2;
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
    if (type === "line" && shape === "circle" && scale instanceof _Scale.BandScale) {
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
    line.path.clear(true);
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
    path.clear(true);
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
    const padding = scale instanceof _Scale.BandScale ? step / 2 : 0;
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
      const angle270 = 1.5 * Math.PI;
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
} = _ModuleSupport3;
var { Path: Path2, Text: Text2 } = _Scene3;
var { angleBetween, isNumberEqual: isNumberEqual2, toRadians, normalizeAngle360: normalizeAngle3602 } = _Util3;
var AngleAxisLabel = class extends _ModuleSupport3.AxisLabel {
  constructor() {
    super(...arguments);
    this.orientation = "fixed";
  }
};
__decorateClass([
  Validate2(UNION2(["fixed", "parallel", "perpendicular"], "a label orientation"))
], AngleAxisLabel.prototype, "orientation", 2);
var AngleAxis = class extends _ModuleSupport3.PolarAxis {
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
    path.clear(true);
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
    return _Scene3.BBox.merge(textBoxes);
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
      if (tickAngle >= Math.PI / 2 && tickAngle < 1.5 * Math.PI) {
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
var { RATIO: RATIO2, OR, POSITIVE_NUMBER: POSITIVE_NUMBER2, NAN, Validate: Validate3 } = _ModuleSupport4;
var { BandScale } = _Scale2;
var { isNumberEqual: isNumberEqual3 } = _Util4;
var AngleCategoryAxisTick = class extends _ModuleSupport4.AxisTick {
  constructor() {
    super(...arguments);
    this.minSpacing = NaN;
  }
};
__decorateClass([
  Validate3(OR(POSITIVE_NUMBER2, NAN))
], AngleCategoryAxisTick.prototype, "minSpacing", 2);
var AngleCategoryAxis = class extends AngleAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new BandScale());
    this.groupPaddingInner = 0;
    this.paddingInner = 0;
  }
  createTick() {
    return new AngleCategoryAxisTick();
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
import { _ModuleSupport as _ModuleSupport5, _Util as _Util6 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/axes/angle-number/linearAngleScale.ts
import { _Scale as _Scale3, _Util as _Util5 } from "ag-charts-community";
var { LinearScale, Invalidating } = _Scale3;
var { isNumberEqual: isNumberEqual4, range, isDenseInterval } = _Util5;
var LinearAngleScale = class extends LinearScale {
  constructor() {
    super(...arguments);
    this.arcLength = 0;
    this.niceTickStep = 0;
  }
  ticks() {
    if (!this.domain || this.domain.length < 2 || this.domain.some((d) => !isFinite(d)) || this.arcLength <= 0) {
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
var { AND: AND3, Default, GREATER_THAN: GREATER_THAN2, LESS_THAN, OR: OR2, POSITIVE_NUMBER: POSITIVE_NUMBER3, NAN: NAN2, NUMBER_OR_NAN, MIN_SPACING, Validate: Validate4 } = _ModuleSupport5;
var { angleBetween: angleBetween2, isNumberEqual: isNumberEqual5, normalisedExtentWithMetadata } = _Util6;
var AngleNumberAxisTick = class extends _ModuleSupport5.AxisTick {
  constructor() {
    super(...arguments);
    this.minSpacing = NaN;
    this.maxSpacing = NaN;
  }
};
__decorateClass([
  Validate4(OR2(POSITIVE_NUMBER3, NAN2))
], AngleNumberAxisTick.prototype, "minSpacing", 2);
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
import { _ModuleSupport as _ModuleSupport6, _Scale as _Scale4 } from "ag-charts-community";
var { OrdinalTimeScale } = _Scale4;
var { dateToNumber, Validate: Validate5, Default: Default2, MAX_SPACING, MIN_SPACING: MIN_SPACING2 } = _ModuleSupport6;
var OrdinalTimeAxisTick = class extends _ModuleSupport6.AxisTick {
  constructor() {
    super(...arguments);
    this.minSpacing = NaN;
    this.maxSpacing = NaN;
  }
};
__decorateClass([
  Validate5(MIN_SPACING2)
], OrdinalTimeAxisTick.prototype, "minSpacing", 2);
__decorateClass([
  Validate5(MAX_SPACING),
  Default2(NaN)
], OrdinalTimeAxisTick.prototype, "maxSpacing", 2);
var OrdinalTimeAxis = class extends _ModuleSupport6.CategoryAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new OrdinalTimeScale());
  }
  createTick() {
    return new OrdinalTimeAxisTick();
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
  onLabelFormatChange(ticks, domain, format) {
    if (format) {
      super.onLabelFormatChange(ticks, domain, format);
    } else {
      this.labelFormatter = this.scale.tickFormat({ ticks, domain });
    }
  }
};
OrdinalTimeAxis.className = "OrdinalTimeAxis";
OrdinalTimeAxis.type = "ordinal-time";

// packages/ag-charts-enterprise/src/axes/ordinal/ordinalTimeAxisThemes.ts
import { _Theme as _Theme2 } from "ag-charts-community";
var ORDINAL_TIME_AXIS_THEME = {
  __extends__: _Theme2.EXTENDS_AXES_DEFAULTS,
  groupPaddingInner: 0,
  label: {
    autoRotate: false
  },
  gridLine: {
    __extends__: _Theme2.EXTENDS_AXES_GRID_LINE_DEFAULTS,
    enabled: false
  },
  crosshair: {
    enabled: true,
    snap: true,
    stroke: _Theme2.DEFAULT_MUTED_LABEL_COLOUR,
    strokeWidth: 1,
    strokeOpacity: 1,
    lineDash: [5, 6],
    lineDashOffset: 0,
    label: {
      enabled: true
    }
  }
};

// packages/ag-charts-enterprise/src/axes/ordinal/ordinalTimeAxisModule.ts
var OrdinalTimeAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "ordinal-time",
  instanceConstructor: OrdinalTimeAxis,
  themeTemplate: ORDINAL_TIME_AXIS_THEME
};

// packages/ag-charts-enterprise/src/axes/radius/radiusAxisThemes.ts
import { _Theme as _Theme3 } from "ag-charts-community";
var RADIUS_AXIS_THEME = {
  __extends__: _Theme3.EXTENDS_AXES_DEFAULTS,
  line: {
    enabled: false,
    __extends__: _Theme3.EXTENDS_AXES_LINE_DEFAULTS
  },
  tick: {
    enabled: false,
    __extends__: _Theme3.EXTENDS_AXES_TICK_DEFAULTS
  }
};

// packages/ag-charts-enterprise/src/axes/radius-category/radiusCategoryAxis.ts
import { _ModuleSupport as _ModuleSupport9, _Scale as _Scale6 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/axes/radius/radiusAxis.ts
import { _ModuleSupport as _ModuleSupport8, _Scene as _Scene6, _Util as _Util9 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/axes/polar-crosslines/radiusCrossLine.ts
import { _ModuleSupport as _ModuleSupport7, _Scale as _Scale5, _Scene as _Scene5, _Util as _Util8 } from "ag-charts-community";
var { ChartAxisDirection: ChartAxisDirection4, Validate: Validate6, DEGREE, validateCrossLineValues: validateCrossLineValues2 } = _ModuleSupport7;
var { Path: Path3, Sector: Sector2, Text: Text3 } = _Scene5;
var { normalizeAngle360: normalizeAngle3603, toRadians: toRadians2, isNumberEqual: isNumberEqual6 } = _Util8;
var RadiusCrossLineLabel = class extends PolarCrossLineLabel {
  constructor() {
    super(...arguments);
    this.positionAngle = void 0;
  }
};
__decorateClass([
  Validate6(DEGREE, { optional: true })
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
    if (type === "line" && scale instanceof _Scale5.BandScale) {
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
    polygon.path.clear(true);
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
    sector.innerRadius = _Util8.clamp(axisInnerRadius, innerRadius + padding, axisOuterRadius);
    sector.outerRadius = _Util8.clamp(axisInnerRadius, outerRadius - padding, axisOuterRadius);
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
    return scale instanceof _Scale5.BandScale ? (step - bandwidth) / 2 : 0;
  }
};
_RadiusCrossLine.className = "RadiusCrossLine";
var RadiusCrossLine = _RadiusCrossLine;

// packages/ag-charts-enterprise/src/axes/radius/radiusAxis.ts
var {
  assignJsonApplyConstructedArray: assignJsonApplyConstructedArray2,
  ChartAxisDirection: ChartAxisDirection5,
  Default: Default3,
  Layers: Layers2,
  DEGREE: DEGREE2,
  MIN_SPACING: MIN_SPACING3,
  MAX_SPACING: MAX_SPACING2,
  BOOLEAN: BOOLEAN2,
  Validate: Validate7
} = _ModuleSupport8;
var { Caption, Group: Group2, Path: Path4, Selection } = _Scene6;
var { isNumberEqual: isNumberEqual7, normalizeAngle360: normalizeAngle3604, toRadians: toRadians3 } = _Util9;
var RadiusAxisTick = class extends _ModuleSupport8.AxisTick {
  constructor() {
    super(...arguments);
    this.minSpacing = NaN;
    this.maxSpacing = NaN;
  }
};
__decorateClass([
  Validate7(MIN_SPACING3),
  Default3(NaN)
], RadiusAxisTick.prototype, "minSpacing", 2);
__decorateClass([
  Validate7(MAX_SPACING2),
  Default3(NaN)
], RadiusAxisTick.prototype, "maxSpacing", 2);
var RadiusAxisLabel = class extends _ModuleSupport8.AxisLabel {
  constructor() {
    super(...arguments);
    this.autoRotateAngle = 335;
  }
};
__decorateClass([
  Validate7(BOOLEAN2, { optional: true })
], RadiusAxisLabel.prototype, "autoRotate", 2);
__decorateClass([
  Validate7(DEGREE2)
], RadiusAxisLabel.prototype, "autoRotateAngle", 2);
var RadiusAxis = class extends _ModuleSupport8.PolarAxis {
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
      path.clear(true);
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
      path.clear(true);
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
  Validate7(DEGREE2),
  Default3(0)
], RadiusAxis.prototype, "positionAngle", 2);

// packages/ag-charts-enterprise/src/axes/radius-category/radiusCategoryAxis.ts
var { RATIO: RATIO3, ProxyPropertyOnWrite, Validate: Validate8 } = _ModuleSupport9;
var { BandScale: BandScale2 } = _Scale6;
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
  Validate8(RATIO3)
], RadiusCategoryAxis.prototype, "groupPaddingInner", 2);
__decorateClass([
  ProxyPropertyOnWrite("scale", "paddingInner"),
  Validate8(RATIO3)
], RadiusCategoryAxis.prototype, "paddingInner", 2);
__decorateClass([
  ProxyPropertyOnWrite("scale", "paddingOuter"),
  Validate8(RATIO3)
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
import { _ModuleSupport as _ModuleSupport10, _Scale as _Scale7, _Util as _Util10 } from "ag-charts-community";
var { AND: AND4, Default: Default4, GREATER_THAN: GREATER_THAN3, LESS_THAN: LESS_THAN2, NUMBER_OR_NAN: NUMBER_OR_NAN2, Validate: Validate9 } = _ModuleSupport10;
var { LinearScale: LinearScale2 } = _Scale7;
var { normalisedExtentWithMetadata: normalisedExtentWithMetadata2 } = _Util10;
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
  Validate9(AND4(NUMBER_OR_NAN2, LESS_THAN2("max"))),
  Default4(NaN)
], RadiusNumberAxis.prototype, "min", 2);
__decorateClass([
  Validate9(AND4(NUMBER_OR_NAN2, GREATER_THAN3("min"))),
  Default4(NaN)
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
import { _ModuleSupport as _ModuleSupport11 } from "ag-charts-community";
var { BOOLEAN: BOOLEAN3, POSITIVE_NUMBER: POSITIVE_NUMBER4, ObserveChanges, Validate: Validate10 } = _ModuleSupport11;
var Animation = class extends _ModuleSupport11.BaseModuleInstance {
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
  Validate10(BOOLEAN3)
], Animation.prototype, "enabled", 2);
__decorateClass([
  ObserveChanges((target, newValue) => {
    target.ctx.animationManager.defaultDuration = newValue;
  }),
  Validate10(POSITIVE_NUMBER4, { optional: true })
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

// packages/ag-charts-enterprise/src/features/annotations/annotationsModule.ts
import { _Theme as _Theme4 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/annotations/annotations.ts
import { _ModuleSupport as _ModuleSupport14, _Scene as _Scene11, _Util as _Util11 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/annotations/annotationProperties.ts
import { _ModuleSupport as _ModuleSupport12 } from "ag-charts-community";
var { BOOLEAN: BOOLEAN4, COLOR_STRING: COLOR_STRING2, DATE, LINE_DASH: LINE_DASH2, NUMBER: NUMBER3, RATIO: RATIO4, STRING: STRING2, OBJECT, OR: OR3, UNION: UNION3, BaseProperties, Validate: Validate11 } = _ModuleSupport12;
var LineAnnotationStylesProperties = class extends BaseProperties {
};
__decorateClass([
  Validate11(COLOR_STRING2, { optional: true })
], LineAnnotationStylesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate11(RATIO4, { optional: true })
], LineAnnotationStylesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate11(NUMBER3, { optional: true })
], LineAnnotationStylesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate11(LINE_DASH2, { optional: true })
], LineAnnotationStylesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate11(NUMBER3, { optional: true })
], LineAnnotationStylesProperties.prototype, "lineDashOffset", 2);
var ChannelAnnotationStylesProperties = class extends LineAnnotationStylesProperties {
  constructor() {
    super(...arguments);
    this.middle = new LineAnnotationStylesProperties();
    this.background = new AnnotationFillProperties();
  }
};
__decorateClass([
  Validate11(OBJECT, { optional: true })
], ChannelAnnotationStylesProperties.prototype, "middle", 2);
__decorateClass([
  Validate11(OBJECT, { optional: true })
], ChannelAnnotationStylesProperties.prototype, "background", 2);
var AnnotationProperties = class extends LineAnnotationStylesProperties {
  constructor() {
    super(...arguments);
    this.type = "line";
    this.handle = new AnnotationHandleProperties();
    this.start = new AnnotationPointProperties();
    this.end = new AnnotationPointProperties();
    this.top = new AnnotationLinePointsProperties();
    this.bottom = new AnnotationLinePointsProperties();
    this.middle = new LineAnnotationStylesProperties();
    this.background = new AnnotationFillProperties();
  }
};
__decorateClass([
  Validate11(UNION3(["line", "parallel-channel"]))
], AnnotationProperties.prototype, "type", 2);
__decorateClass([
  Validate11(BOOLEAN4, { optional: true })
], AnnotationProperties.prototype, "locked", 2);
__decorateClass([
  Validate11(BOOLEAN4, { optional: true })
], AnnotationProperties.prototype, "visible", 2);
__decorateClass([
  Validate11(OBJECT, { optional: true })
], AnnotationProperties.prototype, "handle", 2);
__decorateClass([
  Validate11(OBJECT, { optional: true })
], AnnotationProperties.prototype, "start", 2);
__decorateClass([
  Validate11(OBJECT, { optional: true })
], AnnotationProperties.prototype, "end", 2);
__decorateClass([
  Validate11(OBJECT, { optional: true })
], AnnotationProperties.prototype, "top", 2);
__decorateClass([
  Validate11(OBJECT, { optional: true })
], AnnotationProperties.prototype, "bottom", 2);
__decorateClass([
  Validate11(OBJECT, { optional: true })
], AnnotationProperties.prototype, "middle", 2);
__decorateClass([
  Validate11(OBJECT, { optional: true })
], AnnotationProperties.prototype, "background", 2);
var AnnotationLinePointsProperties = class extends BaseProperties {
  constructor() {
    super(...arguments);
    this.start = new AnnotationPointProperties();
    this.end = new AnnotationPointProperties();
  }
};
__decorateClass([
  Validate11(OBJECT, { optional: true })
], AnnotationLinePointsProperties.prototype, "start", 2);
__decorateClass([
  Validate11(OBJECT, { optional: true })
], AnnotationLinePointsProperties.prototype, "end", 2);
var AnnotationHandleProperties = class extends BaseProperties {
};
__decorateClass([
  Validate11(COLOR_STRING2, { optional: true })
], AnnotationHandleProperties.prototype, "fill", 2);
__decorateClass([
  Validate11(COLOR_STRING2, { optional: true })
], AnnotationHandleProperties.prototype, "stroke", 2);
__decorateClass([
  Validate11(RATIO4, { optional: true })
], AnnotationHandleProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate11(LINE_DASH2, { optional: true })
], AnnotationHandleProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate11(NUMBER3, { optional: true })
], AnnotationHandleProperties.prototype, "lineDashOffset", 2);
var AnnotationPointProperties = class extends BaseProperties {
};
__decorateClass([
  Validate11(OR3(STRING2, NUMBER3, DATE))
], AnnotationPointProperties.prototype, "x", 2);
__decorateClass([
  Validate11(OR3(STRING2, NUMBER3, DATE))
], AnnotationPointProperties.prototype, "y", 2);
var AnnotationFillProperties = class extends BaseProperties {
};
__decorateClass([
  Validate11(COLOR_STRING2, { optional: true })
], AnnotationFillProperties.prototype, "fill", 2);
__decorateClass([
  Validate11(RATIO4, { optional: true })
], AnnotationFillProperties.prototype, "fillOpacity", 2);

// packages/ag-charts-enterprise/src/features/annotations/annotationTypes.ts
var AnnotationType = /* @__PURE__ */ ((AnnotationType2) => {
  AnnotationType2["Line"] = "line";
  AnnotationType2["ParallelChannel"] = "parallel-channel";
  return AnnotationType2;
})(AnnotationType || {});

// packages/ag-charts-enterprise/src/features/annotations/scenes/channel.ts
import { _Scene as _Scene10 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/annotations/scenes/annotation.ts
import { _Scene as _Scene7 } from "ag-charts-community";
var Annotation = class extends _Scene7.Group {
  constructor() {
    super(...arguments);
    this.locked = false;
  }
};

// packages/ag-charts-enterprise/src/features/annotations/scenes/handle.ts
import { _Scene as _Scene8 } from "ag-charts-community";
var Handle = class extends _Scene8.Group {
  constructor() {
    super(...arguments);
    this.visible = false;
  }
  drag(target) {
    return {
      point: target,
      offset: { x: target.x - this.handle.x, y: target.y - this.handle.y }
    };
  }
  toggleActive(active) {
    this.handle.strokeWidth = active ? 1.5 : 1;
    this.handle.dirtyPath = true;
  }
  toggleHovered(hovered) {
    this.glow.visible = hovered;
    this.glow.dirtyPath = true;
  }
  toggleDragging(dragging) {
    this.handle.visible = !dragging;
    this.glow.visible = this.glow.visible && !dragging;
    this.handle.dirtyPath = true;
    this.glow.dirtyPath = true;
  }
  getCursor() {
    return "default";
  }
  containsPoint(x, y) {
    return this.handle.containsPoint(x, y);
  }
};
var UnivariantHandle = class extends Handle {
  constructor() {
    super();
    this.handle = new _Scene8.Rect();
    this.glow = new _Scene8.Rect();
    this.gradient = "horizontal";
    this.append([this.glow, this.handle]);
    this.handle.cornerRadius = 4;
    this.handle.width = 12;
    this.handle.height = 12;
    this.handle.strokeWidth = 1;
    this.handle.zIndex = 2;
    this.glow.cornerRadius = 4;
    this.glow.width = 16;
    this.glow.height = 16;
    this.glow.strokeWidth = 0;
    this.glow.fillOpacity = 0.2;
    this.glow.zIndex = 1;
    this.glow.visible = false;
  }
  update(styles) {
    var _a2, _b, _c;
    this.handle.setProperties(styles);
    this.glow.setProperties(__spreadProps(__spreadValues({}, styles), {
      x: ((_a2 = styles.x) != null ? _a2 : this.glow.x) - 2,
      y: ((_b = styles.y) != null ? _b : this.glow.y) - 2,
      fill: (_c = styles.stroke) != null ? _c : styles.fill
    }));
  }
  drag(target) {
    if (this.gradient === "vertical") {
      return {
        point: { x: target.x, y: this.handle.y },
        offset: { x: target.x - this.handle.x, y: 0 }
      };
    }
    return {
      point: { x: this.handle.x, y: target.y },
      offset: { x: 0, y: target.y - this.handle.y }
    };
  }
  getCursor() {
    return this.gradient === "vertical" ? "col-resize" : "row-resize";
  }
};
var DivariantHandle = class extends Handle {
  constructor() {
    super();
    this.handle = new _Scene8.Circle();
    this.glow = new _Scene8.Circle();
    this.append([this.glow, this.handle]);
    this.handle.size = 11;
    this.handle.strokeWidth = 1;
    this.handle.zIndex = 2;
    this.glow.size = 17;
    this.glow.strokeWidth = 0;
    this.glow.fillOpacity = 0.2;
    this.glow.zIndex = 1;
    this.glow.visible = false;
  }
  update(styles) {
    this.handle.setProperties(styles);
    this.glow.setProperties(__spreadProps(__spreadValues({}, styles), { fill: styles.stroke }));
  }
};

// packages/ag-charts-enterprise/src/features/annotations/scenes/shapes.ts
import { _Scene as _Scene9 } from "ag-charts-community";
var magnitude = (x, y) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
var CollidableLine = class extends _Scene9.Line {
  constructor() {
    super(...arguments);
    this.growCollisionBox = 2;
  }
  updateCollisionBBox() {
    const x = this.x1;
    const height = this.strokeWidth + this.growCollisionBox;
    const y = this.y1 - Math.floor(height / 2);
    const width = magnitude(this.x2 - x, this.y2 - y);
    this.collisionBBox = new _Scene9.BBox(x, y, width, height);
  }
  isPointInPath(pointX, pointY) {
    var _a2, _b;
    const { collisionBBox, x1, y1, x2, y2 } = this;
    if (!collisionBBox)
      return false;
    pointX -= x1;
    pointY -= y1;
    const endX = x2 - x1;
    const endY = y2 - y1;
    const angle = Math.atan2(pointY, pointX) - Math.atan2(endY, endX);
    const mag = magnitude(pointX, pointY);
    const x = x1 + mag * Math.cos(angle);
    const y = y1 + mag * Math.sin(angle);
    return (_b = (_a2 = this.collisionBBox) == null ? void 0 : _a2.containsPoint(x, y)) != null ? _b : false;
  }
};

// packages/ag-charts-enterprise/src/features/annotations/scenes/channel.ts
var Channel = class extends Annotation {
  constructor() {
    super();
    this.type = "channel";
    this.topLine = new CollidableLine();
    this.middleLine = new _Scene10.Line();
    this.bottomLine = new CollidableLine();
    this.background = new _Scene10.Path();
    this.handles = {
      topLeft: new DivariantHandle(),
      topMiddle: new UnivariantHandle(),
      topRight: new DivariantHandle(),
      bottomLeft: new DivariantHandle(),
      bottomMiddle: new UnivariantHandle(),
      bottomRight: new DivariantHandle()
    };
    this.append([this.background, this.topLine, this.middleLine, this.bottomLine, ...Object.values(this.handles)]);
  }
  update(datum, seriesRect, top, bottom) {
    const { locked, visible } = datum;
    this.locked = locked != null ? locked : false;
    this.seriesRect = seriesRect;
    if (top == null || bottom == null) {
      this.visible = false;
      return;
    } else {
      this.visible = visible != null ? visible : true;
    }
    this.updateLines(datum, top, bottom);
    this.updateHandles(datum, top, bottom);
    this.updateBackground(datum, top, bottom);
  }
  toggleHandles(show) {
    var _a2;
    if (typeof show === "boolean") {
      show = {
        topLeft: show,
        topMiddle: show,
        topRight: show,
        bottomLeft: show,
        bottomMiddle: show,
        bottomRight: show
      };
    }
    for (const [handle, node] of Object.entries(this.handles)) {
      node.visible = (_a2 = show[handle]) != null ? _a2 : true;
      node.toggleHovered(this.activeHandle === handle);
    }
  }
  toggleActive(active) {
    this.toggleHandles(active);
    for (const node of Object.values(this.handles)) {
      node.toggleActive(active);
    }
  }
  dragHandle(datum, target, invertPoint) {
    const { activeHandle, handles } = this;
    if (activeHandle == null)
      return;
    const { offset } = handles[activeHandle].drag(target);
    handles[activeHandle].toggleDragging(true);
    let moves = [];
    switch (activeHandle) {
      case "topLeft":
      case "bottomLeft":
        moves = ["topLeft", "bottomLeft"];
        break;
      case "topMiddle":
        moves = ["topLeft", "topRight"];
        offset.y -= 6;
        break;
      case "topRight":
      case "bottomRight":
        moves = ["topRight", "bottomRight"];
        break;
      case "bottomMiddle":
        moves = ["bottomLeft", "bottomRight"];
        offset.y -= 6;
        break;
    }
    const invertedMoves = moves.map(
      (move) => invertPoint({
        x: handles[move].handle.x + offset.x,
        y: handles[move].handle.y + offset.y
      })
    );
    if (invertedMoves.some((invertedMove) => invertedMove === void 0)) {
      return;
    }
    for (const [index, invertedMove] of invertedMoves.entries()) {
      const datumPoint = this.getHandleDatumPoint(moves[index], datum);
      datumPoint.x = invertedMove.x;
      datumPoint.y = invertedMove.y;
    }
  }
  stopDragging() {
    const { activeHandle, handles } = this;
    if (activeHandle == null)
      return;
    handles[activeHandle].toggleDragging(false);
  }
  getCursor() {
    if (this.activeHandle == null)
      return "pointer";
    return this.handles[this.activeHandle].getCursor();
  }
  containsPoint(x, y) {
    var _a2, _b;
    const { handles, seriesRect, topLine, bottomLine } = this;
    this.activeHandle = void 0;
    for (const [handle, child] of Object.entries(handles)) {
      if (child.containsPoint(x, y)) {
        this.activeHandle = handle;
        return true;
      }
    }
    x -= (_a2 = seriesRect == null ? void 0 : seriesRect.x) != null ? _a2 : 0;
    y -= (_b = seriesRect == null ? void 0 : seriesRect.y) != null ? _b : 0;
    return topLine.containsPoint(x, y) || bottomLine.containsPoint(x, y);
  }
  updateLines(datum, top, bottom) {
    var _a2, _b, _c, _d, _e;
    const { topLine, middleLine, bottomLine } = this;
    const { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = datum;
    const lineStyles = { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth };
    topLine.setProperties(__spreadValues({
      x1: top.x1,
      y1: top.y1,
      x2: top.x2,
      y2: top.y2
    }, lineStyles));
    bottomLine.setProperties(__spreadValues({
      x1: bottom.x1,
      y1: bottom.y1,
      x2: bottom.x2,
      y2: bottom.y2
    }, lineStyles));
    topLine.updateCollisionBBox();
    bottomLine.updateCollisionBBox();
    if (datum.type === "parallel-channel" /* ParallelChannel */) {
      middleLine.setProperties({
        x1: top.x1,
        y1: bottom.y1 + (top.y1 - bottom.y1) / 2,
        x2: top.x2,
        y2: bottom.y2 + (top.y2 - bottom.y2) / 2,
        lineDash: (_a2 = datum.middle.lineDash) != null ? _a2 : lineDash,
        lineDashOffset: (_b = datum.middle.lineDashOffset) != null ? _b : lineDashOffset,
        stroke: (_c = datum.middle.stroke) != null ? _c : stroke,
        strokeOpacity: (_d = datum.middle.strokeOpacity) != null ? _d : strokeOpacity,
        strokeWidth: (_e = datum.middle.strokeWidth) != null ? _e : strokeWidth
      });
    } else {
      middleLine.visible = false;
    }
  }
  updateHandles(datum, top, bottom) {
    var _a2, _b;
    const {
      handles: { topLeft, topMiddle, topRight, bottomLeft, bottomMiddle, bottomRight }
    } = this;
    const handleStyles = {
      fill: datum.handle.fill,
      stroke: (_a2 = datum.handle.stroke) != null ? _a2 : datum.stroke,
      strokeOpacity: (_b = datum.handle.strokeOpacity) != null ? _b : datum.strokeOpacity
    };
    topLeft.update(__spreadProps(__spreadValues({}, handleStyles), { x: top.x1, y: top.y1 }));
    topRight.update(__spreadProps(__spreadValues({}, handleStyles), { x: top.x2, y: top.y2 }));
    bottomLeft.update(__spreadProps(__spreadValues({}, handleStyles), { x: bottom.x1, y: bottom.y1 }));
    bottomRight.update(__spreadProps(__spreadValues({}, handleStyles), { x: bottom.x2, y: bottom.y2 }));
    topMiddle.update(__spreadProps(__spreadValues({}, handleStyles), {
      x: top.x1 + (top.x2 - top.x1) / 2 - topMiddle.handle.width / 2,
      y: top.y1 + (top.y2 - top.y1) / 2 - topMiddle.handle.height / 2
    }));
    bottomMiddle.update(__spreadProps(__spreadValues({}, handleStyles), {
      x: bottom.x1 + (bottom.x2 - bottom.x1) / 2 - bottomMiddle.handle.width / 2,
      y: bottom.y1 + (bottom.y2 - bottom.y1) / 2 - bottomMiddle.handle.height / 2
    }));
  }
  updateBackground(datum, top, bottom) {
    const { background } = this;
    background.path.clear();
    background.path.moveTo(top.x1, top.y1);
    background.path.lineTo(top.x2, top.y2);
    background.path.lineTo(bottom.x2, bottom.y2);
    background.path.lineTo(bottom.x1, bottom.y1);
    background.path.closePath();
    background.checkPathDirty();
    background.setProperties({
      fill: datum.background.fill,
      fillOpacity: datum.background.fillOpacity
    });
  }
  getHandleDatumPoint(handle, datum) {
    switch (handle) {
      case "topLeft":
        return datum.top.start;
      case "topRight":
        return datum.top.end;
      case "bottomLeft":
        return datum.bottom.start;
      case "bottomRight":
      default:
        return datum.bottom.end;
    }
  }
};

// packages/ag-charts-enterprise/src/features/annotations/scenes/line.ts
var Line = class extends Annotation {
  constructor() {
    super();
    this.type = "line";
    this.line = new CollidableLine();
    this.start = new DivariantHandle();
    this.end = new DivariantHandle();
    this.append([this.line, this.start, this.end]);
  }
  update(datum, seriesRect, coords) {
    var _a2, _b;
    const { line, start, end } = this;
    const { locked, visible, lineDash, lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
    this.locked = locked != null ? locked : false;
    this.seriesRect = seriesRect;
    if (coords == null) {
      this.visible = false;
      return;
    } else {
      this.visible = visible != null ? visible : true;
    }
    const { x1, y1, x2, y2 } = coords;
    line.setProperties({
      x1,
      y1,
      x2,
      y2,
      lineDash,
      lineDashOffset,
      stroke,
      strokeWidth,
      strokeOpacity,
      fillOpacity: 0
    });
    line.updateCollisionBBox();
    const handleStyles = {
      fill: datum.handle.fill,
      stroke: (_a2 = datum.handle.stroke) != null ? _a2 : stroke,
      strokeOpacity: (_b = datum.handle.strokeOpacity) != null ? _b : strokeOpacity
    };
    start.update(__spreadProps(__spreadValues({}, handleStyles), { x: x1, y: y1 }));
    end.update(__spreadProps(__spreadValues({}, handleStyles), { x: x2, y: y2 }));
  }
  toggleHandles(show) {
    var _a2, _b;
    if (typeof show === "boolean") {
      show = { start: show, end: show };
    }
    this.start.visible = (_a2 = show.start) != null ? _a2 : true;
    this.end.visible = (_b = show.end) != null ? _b : true;
    this.start.toggleHovered(this.activeHandle === "start");
    this.end.toggleHovered(this.activeHandle === "end");
  }
  toggleActive(active) {
    this.toggleHandles(active);
    this.start.toggleActive(active);
    this.end.toggleActive(active);
  }
  dragHandle(datum, target, invertPoint) {
    const { activeHandle } = this;
    if (!activeHandle || datum.start == null || datum.end == null)
      return;
    this[activeHandle].toggleDragging(true);
    const point = invertPoint(this[activeHandle].drag(target).point);
    if (!point)
      return;
    datum[activeHandle].x = point.x;
    datum[activeHandle].y = point.y;
  }
  stopDragging() {
    this.start.toggleDragging(false);
    this.end.toggleDragging(false);
  }
  getCursor() {
    if (this.activeHandle == null)
      return "pointer";
    return "default";
  }
  containsPoint(x, y) {
    var _a2, _b;
    const { start, end, seriesRect, line } = this;
    this.activeHandle = void 0;
    if (start.containsPoint(x, y)) {
      this.activeHandle = "start";
      return true;
    }
    if (end.containsPoint(x, y)) {
      this.activeHandle = "end";
      return true;
    }
    x -= (_a2 = seriesRect == null ? void 0 : seriesRect.x) != null ? _a2 : 0;
    y -= (_b = seriesRect == null ? void 0 : seriesRect.y) != null ? _b : 0;
    return line.isPointInPath(x, y);
  }
};

// packages/ag-charts-enterprise/src/features/annotations/annotations.ts
var { BOOLEAN: BOOLEAN5, OBJECT_ARRAY, InteractionState, PropertiesArray, Validate: Validate12 } = _ModuleSupport14;
var Annotations = class extends _ModuleSupport14.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = true;
    this.initial = new PropertiesArray(AnnotationProperties);
    this.container = new _Scene11.Group({ name: "static-annotations" });
    this.annotations = new _Scene11.Selection(
      this.container,
      this.createAnnotation.bind(this)
    );
    this.hoverAddingFns = {
      ["line" /* Line */]: {
        ["end" /* End */]: (datum, node, point) => {
          datum.set({ end: point });
          node.toggleHandles({ end: false });
        }
      },
      ["parallel-channel" /* ParallelChannel */]: {
        ["end" /* End */]: (datum, node, point) => {
          datum.set({ top: { end: point }, bottom: { end: point } });
          node.toggleHandles(false);
        },
        ["height" /* Height */]: (datum, node, point, offset) => {
          const start = this.convertPoint(datum.bottom.start);
          const end = this.convertPoint(datum.bottom.end);
          if (!start || !end)
            return;
          const height = offset.y - end.y;
          const startY = this.invertY(start.y + height);
          const endY = point.y;
          if (!this.validateDatumPoint({ x: start.x, y: startY }) || !this.validateDatumPoint({ x: end.x, y: endY })) {
            return;
          }
          node.toggleHandles({ topMiddle: false, bottomMiddle: false });
          datum.set({
            bottom: { start: { y: startY }, end: { y: endY } }
          });
        }
      }
    };
    this.clickAddingFns = {
      ["line" /* Line */]: {
        ["start" /* Start */]: (_node, point) => {
          var _a2;
          const datum = this.createDatum("line" /* Line */, point);
          (_a2 = this.annotationData) == null ? void 0 : _a2.push(datum);
          this.addingStep = "end" /* End */;
        },
        ["end" /* End */]: (node, point) => {
          var _a2, _b;
          (_b = (_a2 = this.annotationData) == null ? void 0 : _a2.at(-1)) == null ? void 0 : _b.set({ end: point });
          node == null ? void 0 : node.toggleHandles(true);
          this.addingStep = void 0;
          this.ctx.cursorManager.updateCursor("annotations");
          this.ctx.interactionManager.popState(InteractionState.Annotations);
        }
      },
      ["parallel-channel" /* ParallelChannel */]: {
        ["start" /* Start */]: (_node, point) => {
          var _a2;
          const datum = this.createDatum("parallel-channel" /* ParallelChannel */, point);
          (_a2 = this.annotationData) == null ? void 0 : _a2.push(datum);
          this.addingStep = "end" /* End */;
        },
        ["end" /* End */]: (node, point) => {
          var _a2, _b;
          (_b = (_a2 = this.annotationData) == null ? void 0 : _a2.at(-1)) == null ? void 0 : _b.set({
            top: { end: point },
            bottom: { end: point }
          });
          node == null ? void 0 : node.toggleHandles({ topMiddle: false, bottomMiddle: false });
          this.addingStep = "height" /* Height */;
        },
        ["height" /* Height */]: (node, point, offset) => {
          var _a2;
          const datum = (_a2 = this.annotationData) == null ? void 0 : _a2.at(-1);
          const start = this.convertPoint(datum.bottom.start);
          const end = this.convertPoint(datum.bottom.end);
          if (!start || !end)
            return;
          const height = offset.y - end.y;
          const startY = this.invertY(start.y + height);
          const endY = point.y;
          if (datum && this.validateDatumPoint({ x: start.x, y: startY }) && this.validateDatumPoint({ x: end.x, y: endY })) {
            datum.set({
              bottom: { start: { y: startY }, end: { y: endY } }
            });
          }
          node == null ? void 0 : node.toggleHandles(true);
          this.addingStep = void 0;
          this.ctx.cursorManager.updateCursor("annotations");
          this.ctx.interactionManager.popState(InteractionState.Annotations);
        }
      }
    };
    const { All, Default: Default6, Annotations: AnnotationsState, ZoomDrag } = InteractionState;
    const region = ctx.regionManager.getRegion("series");
    this.destroyFns.push(
      ctx.annotationManager.attachNode(this.container),
      region.addListener("hover", this.onHover.bind(this), All),
      region.addListener("click", this.onClick.bind(this), All),
      region.addListener("drag", this.onDrag.bind(this), Default6 | ZoomDrag | AnnotationsState),
      region.addListener("drag-end", this.onDragEnd.bind(this), All),
      ctx.toolbarManager.addListener("button-pressed", (event) => this.onToolbarButtonPress(event)),
      ctx.layoutService.addListener("layout-complete", this.onLayoutComplete.bind(this))
    );
  }
  onToolbarButtonPress(event) {
    if (this.active != null) {
      this.annotations.nodes()[this.active].toggleActive(false);
      this.active = void 0;
    }
    if (event.group !== "annotations" || !Object.values(AnnotationType).includes(event.value))
      return;
    this.ctx.interactionManager.pushState(InteractionState.Annotations);
    this.addingStep = "start" /* Start */;
    this.addingType = event.value;
  }
  createAnnotation(datum) {
    switch (datum.type) {
      case "parallel-channel" /* ParallelChannel */:
        return new Channel();
      case "line" /* Line */:
      default:
        return new Line();
    }
  }
  createDatum(type, point) {
    const datum = new AnnotationProperties();
    datum.set(_ModuleSupport14.mergeDefaults({ type }, this.ctx.annotationManager.getAnnotationTypeStyles(type)));
    switch (type) {
      case "line" /* Line */:
        datum.set({ start: point, end: point });
        break;
      case "parallel-channel" /* ParallelChannel */:
        datum.set({
          top: { start: point, end: point },
          bottom: { start: point, end: point }
        });
        break;
    }
    return datum;
  }
  onLayoutComplete(event) {
    var _a2, _b, _c, _d, _e;
    const { annotationData, annotations } = this;
    this.seriesRect = event.series.rect;
    for (const axis of (_a2 = event.axes) != null ? _a2 : []) {
      if (axis.direction === _ModuleSupport14.ChartAxisDirection.X) {
        (_b = this.scaleX) != null ? _b : this.scaleX = axis.scale;
        (_c = this.domainX) != null ? _c : this.domainX = axis.domain;
      } else {
        (_d = this.scaleY) != null ? _d : this.scaleY = axis.scale;
        (_e = this.domainY) != null ? _e : this.domainY = axis.domain;
      }
    }
    annotations.update(annotationData != null ? annotationData : []).each((node, datum) => {
      if (!this.validateDatum(datum)) {
        return;
      }
      switch (datum.type) {
        case "line" /* Line */:
          node.update(datum, event.series.rect, this.convertLine(datum));
          break;
        case "parallel-channel" /* ParallelChannel */:
          node.update(
            datum,
            event.series.rect,
            this.convertLine(datum.top),
            this.convertLine(datum.bottom)
          );
          break;
      }
    });
  }
  // Validation of the options beyond the scope of the @Validate decorator
  validateDatum(datum) {
    let valid = true;
    switch (datum.type) {
      case "line" /* Line */:
        valid = this.validateDatumLine(datum, `Annotation [${datum.type}]`);
        break;
      case "parallel-channel" /* ParallelChannel */:
        valid = this.validateDatumLine(datum.top, `Annotation [${datum.type}] [top]`);
        valid && (valid = this.validateDatumLine(datum.bottom, `Annotation [${datum.type}] [bottom]`));
        break;
    }
    return valid;
  }
  validateDatumLine(datum, prefix) {
    let valid = true;
    if (datum.start == null || datum.end == null) {
      _Util11.Logger.warnOnce(`${prefix} requires both a [start] and [end] property, ignoring.`);
      valid = false;
    } else {
      valid && (valid = this.validateDatumPoint(datum.start, `${prefix} [start]`));
      valid && (valid = this.validateDatumPoint(datum.end, `${prefix} [end]`));
    }
    return valid;
  }
  validateDatumPoint(point, loggerPrefix) {
    const { domainX, domainY, scaleX, scaleY } = this;
    if (point.x == null || point.y == null) {
      if (loggerPrefix) {
        _Util11.Logger.warnOnce(`${loggerPrefix} requires both an [x] and [y] property, ignoring.`);
      }
      return false;
    }
    if (!domainX || !domainY || !scaleX || !scaleY)
      return true;
    const validX = this.validateDatumPointDirection(domainX, scaleX, point.x);
    const validY = this.validateDatumPointDirection(domainY, scaleY, point.y);
    if (!validX || !validY) {
      let text = "x & y domains";
      if (validX)
        text = "y domain";
      if (validY)
        text = "x domain";
      if (loggerPrefix) {
        _Util11.Logger.warnOnce(
          `${loggerPrefix} is outside the ${text}, ignoring. - x: [${point.x}], y: ${point.y}]`
        );
      }
      return false;
    }
    return true;
  }
  validateDatumPointDirection(domain, scale, value) {
    if (_Scene11.ContinuousScale.is(scale)) {
      return value >= domain[0] && value <= domain[1];
    }
    return true;
  }
  onHover(event) {
    const { addingStep } = this;
    if (addingStep == null) {
      this.onHoverSelecting(event);
    } else {
      this.onHoverEditing(event);
    }
  }
  onHoverSelecting(event) {
    const {
      active,
      annotations,
      ctx: { cursorManager }
    } = this;
    this.hovered = void 0;
    annotations.each((annotation, _, index) => {
      var _a2;
      if (annotation.locked)
        return;
      const contains = annotation.containsPoint(event.offsetX, event.offsetY);
      if (contains)
        (_a2 = this.hovered) != null ? _a2 : this.hovered = index;
      annotation.toggleHandles(contains || active === index);
    });
    cursorManager.updateCursor(
      "annotations",
      this.hovered == null ? void 0 : annotations.nodes()[this.hovered].getCursor()
    );
  }
  onHoverEditing(event) {
    var _a2, _b, _c, _d, _e;
    const {
      annotationData,
      annotations,
      addingStep,
      addingType,
      ctx: { cursorManager, updateService }
    } = this;
    if (!annotationData || !addingType || !addingStep)
      return;
    const offset = {
      x: event.offsetX - ((_b = (_a2 = this.seriesRect) == null ? void 0 : _a2.x) != null ? _b : 0),
      y: event.offsetY - ((_d = (_c = this.seriesRect) == null ? void 0 : _c.y) != null ? _d : 0)
    };
    const point = this.invertPoint(offset);
    const valid = this.validateDatumPoint(point);
    cursorManager.updateCursor("annotations", valid ? void 0 : "not-allowed");
    if (!valid || addingStep === "start" /* Start */)
      return;
    const datum = annotationData.at(-1);
    this.active = annotationData.length - 1;
    const node = annotations.nodes()[this.active];
    if (!datum || !node)
      return;
    node.toggleActive(true);
    const hoverAddingFn = (_e = this.hoverAddingFns[addingType]) == null ? void 0 : _e[addingStep];
    if (hoverAddingFn) {
      hoverAddingFn(datum, node, point, offset);
    }
    updateService.update();
  }
  onClick(event) {
    if (this.addingStep == null) {
      this.onClickSelecting();
    } else {
      this.onClickAdding(event);
    }
  }
  onClickSelecting() {
    if (this.active != null) {
      this.annotations.nodes()[this.active].toggleActive(false);
    }
    this.active = this.hovered;
    if (this.active == null)
      return;
    this.annotations.nodes()[this.active].toggleActive(true);
  }
  onClickAdding(event) {
    var _a2, _b, _c, _d, _e;
    const {
      active,
      annotationData,
      annotations,
      addingStep,
      addingType,
      ctx: { updateService }
    } = this;
    if (!annotationData || !addingStep || !addingType)
      return;
    const offset = {
      x: event.offsetX - ((_b = (_a2 = this.seriesRect) == null ? void 0 : _a2.x) != null ? _b : 0),
      y: event.offsetY - ((_d = (_c = this.seriesRect) == null ? void 0 : _c.y) != null ? _d : 0)
    };
    const point = this.invertPoint(offset);
    const node = active ? annotations.nodes()[active] : void 0;
    if (!this.validateDatumPoint(point)) {
      return;
    }
    const clickAddingFn = (_e = this.clickAddingFns[addingType]) == null ? void 0 : _e[addingStep];
    if (clickAddingFn) {
      clickAddingFn(node, point, offset);
    }
    updateService.update(_ModuleSupport14.ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
  }
  onDrag(event) {
    var _a2, _b;
    const {
      active,
      annotationData,
      annotations,
      addingStep,
      seriesRect,
      ctx: { cursorManager, interactionManager, updateService }
    } = this;
    if (active == null || annotationData == null || addingStep != null)
      return;
    interactionManager.pushState(InteractionState.Annotations);
    const { offsetX, offsetY } = event;
    const datum = annotationData[active];
    const node = annotations.nodes()[active];
    const offset = {
      x: offsetX - ((_a2 = seriesRect == null ? void 0 : seriesRect.x) != null ? _a2 : 0),
      y: offsetY - ((_b = seriesRect == null ? void 0 : seriesRect.y) != null ? _b : 0)
    };
    cursorManager.updateCursor("annotations");
    node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
    updateService.update(_ModuleSupport14.ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
  }
  onDragNodeHandle(handleOffset) {
    const point = this.invertPoint(handleOffset);
    const valid = this.validateDatumPoint(point);
    if (!valid) {
      this.ctx.cursorManager.updateCursor("annotations", "not-allowed");
      return;
    }
    return point;
  }
  onDragEnd(_event) {
    const {
      active,
      annotations,
      addingStep,
      ctx: { cursorManager, interactionManager, updateService }
    } = this;
    if (addingStep != null)
      return;
    interactionManager.popState(InteractionState.Annotations);
    cursorManager.updateCursor("annotations");
    if (active == null)
      return;
    annotations.nodes()[active].stopDragging();
    updateService.update(_ModuleSupport14.ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
  }
  convertLine(datum) {
    if (datum.start == null || datum.end == null)
      return;
    const start = this.convertPoint(datum.start);
    const end = this.convertPoint(datum.end);
    if (start == null || end == null)
      return;
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  }
  convertPoint(point) {
    const { scaleX, scaleY } = this;
    let x = 0;
    let y = 0;
    if (!scaleX || !scaleY || point.x == null || point.y == null)
      return { x, y };
    x = scaleX.convert(point.x);
    y = scaleY.convert(point.y);
    return { x, y };
  }
  invertPoint(point) {
    return {
      x: this.invertX(point.x),
      y: this.invertY(point.y)
    };
  }
  invertX(x) {
    const { scaleX } = this;
    if (_Scene11.ContinuousScale.is(scaleX)) {
      x = scaleX.invert(x);
    } else if (_Scene11.BandScale.is(scaleX)) {
      x = scaleX.invertNearest(x);
    }
    return x;
  }
  invertY(y) {
    const { scaleY } = this;
    if (_Scene11.ContinuousScale.is(scaleY)) {
      y = scaleY.invert(y);
    } else if (_Scene11.BandScale.is(scaleY)) {
      y = scaleY.invertNearest(y);
    }
    return y;
  }
};
__decorateClass([
  _ModuleSupport14.ObserveChanges((target, enabled) => {
    target.ctx.toolbarManager.toggleGroup("annotations", Boolean(enabled));
  }),
  Validate12(BOOLEAN5)
], Annotations.prototype, "enabled", 2);
__decorateClass([
  _ModuleSupport14.ObserveChanges((target, newValue) => {
    var _a2;
    (_a2 = target.annotationData) != null ? _a2 : target.annotationData = newValue;
  }),
  Validate12(OBJECT_ARRAY, { optional: true })
], Annotations.prototype, "initial", 2);

// packages/ag-charts-enterprise/src/features/annotations/annotationsModule.ts
var AnnotationsModule = {
  type: "root",
  optionsKey: "annotations",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  dependencies: ["toolbar"],
  instanceConstructor: Annotations,
  themeTemplate: {
    annotations: {
      line: {
        stroke: _Theme4.DEFAULT_ANNOTATION_STROKE,
        strokeWidth: 2,
        strokeOpacity: 1,
        handle: {
          fill: _Theme4.DEFAULT_ANNOTATION_HANDLE_FILL
        }
      },
      "parallel-channel": {
        stroke: _Theme4.DEFAULT_ANNOTATION_STROKE,
        strokeWidth: 2,
        strokeOpacity: 1,
        middle: {
          lineDash: [6, 5],
          strokeWidth: 1
        },
        background: {
          fill: _Theme4.DEFAULT_ANNOTATION_BACKGROUND_FILL,
          fillOpacity: 0.2
        },
        handle: {
          fill: _Theme4.DEFAULT_ANNOTATION_HANDLE_FILL
        }
      }
    }
  }
};

// packages/ag-charts-enterprise/src/features/background/background.ts
import { _ModuleSupport as _ModuleSupport16 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/background/backgroundImage.ts
import { _ModuleSupport as _ModuleSupport15, _Scene as _Scene12 } from "ag-charts-community";
var { Image } = _Scene12;
var {
  BaseProperties: BaseProperties2,
  ObserveChanges: ObserveChanges2,
  ProxyProperty,
  Validate: Validate13,
  NUMBER: NUMBER4,
  POSITIVE_NUMBER: POSITIVE_NUMBER5,
  RATIO: RATIO5,
  createElement,
  calculatePlacement
} = _ModuleSupport15;
var BackgroundImage = class extends BaseProperties2 {
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
  Validate13(NUMBER4, { optional: true })
], BackgroundImage.prototype, "top", 2);
__decorateClass([
  Validate13(NUMBER4, { optional: true })
], BackgroundImage.prototype, "right", 2);
__decorateClass([
  Validate13(NUMBER4, { optional: true })
], BackgroundImage.prototype, "bottom", 2);
__decorateClass([
  Validate13(NUMBER4, { optional: true })
], BackgroundImage.prototype, "left", 2);
__decorateClass([
  Validate13(POSITIVE_NUMBER5, { optional: true })
], BackgroundImage.prototype, "width", 2);
__decorateClass([
  Validate13(POSITIVE_NUMBER5, { optional: true })
], BackgroundImage.prototype, "height", 2);
__decorateClass([
  Validate13(RATIO5)
], BackgroundImage.prototype, "opacity", 2);
__decorateClass([
  ProxyProperty("imageElement.src"),
  ObserveChanges2((target) => target.loadedSynchronously = target.complete)
], BackgroundImage.prototype, "url", 2);

// packages/ag-charts-enterprise/src/features/background/background.ts
var { ActionOnSet, OBJECT: OBJECT2, Validate: Validate14 } = _ModuleSupport16;
var Background = class extends _ModuleSupport16.Background {
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
    this.ctx.updateService.update(_ModuleSupport16.ChartUpdateType.SCENE_RENDER);
  }
};
__decorateClass([
  Validate14(OBJECT2, { optional: true }),
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
import { _Theme as _Theme5 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/context-menu/contextMenu.ts
import { _ModuleSupport as _ModuleSupport17, _Util as _Util12 } from "ag-charts-community";

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
var { BOOLEAN: BOOLEAN6, Validate: Validate15, createElement: createElement2, getDocument, getWindow, injectStyle } = _ModuleSupport17;
var ContextMenu = class extends _ModuleSupport17.BaseModuleInstance {
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
    const { Default: Default6, ContextMenu: ContextMenuState, All } = _ModuleSupport17.InteractionState;
    const contextState = Default6 | ContextMenuState;
    this.destroyFns.push(
      ctx.interactionManager.addListener("contextmenu", (event) => this.onContextMenu(event), contextState),
      ctx.interactionManager.addListener("click", () => this.onClick(), All)
    );
    this.groups = { default: [], node: [], extra: [], extraNode: [] };
    this.canvasElement = ctx.scene.canvas.element;
    this.container = getDocument("body");
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
    this.interactionManager.pushState(_ModuleSupport17.InteractionState.ContextMenu);
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
    this.interactionManager.popState(_ModuleSupport17.InteractionState.ContextMenu);
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
            _Util12.Logger.warnOnce(
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
  Validate15(BOOLEAN6)
], ContextMenu.prototype, "enabled", 2);
__decorateClass([
  Validate15(BOOLEAN6)
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
      darkTheme: _Theme5.IS_DARK_THEME
    }
  }
};

// packages/ag-charts-enterprise/src/features/crosshair/crosshair.ts
import { _ModuleSupport as _ModuleSupport19, _Scene as _Scene14, _Util as _Util14 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/crosshair/crosshairLabel.ts
import { _ModuleSupport as _ModuleSupport18, _Scene as _Scene13, _Util as _Util13 } from "ag-charts-community";
var { ActionOnSet: ActionOnSet2, BaseProperties: BaseProperties3, BOOLEAN: BOOLEAN7, FUNCTION, NUMBER: NUMBER5, STRING: STRING3, Validate: Validate16, createElement: createElement3, injectStyle: injectStyle2 } = _ModuleSupport18;
var { setAttribute } = _Util13;
var { BBox } = _Scene13;
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
var CrosshairLabelProperties = class extends _Scene13.ChangeDetectableProperties {
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
  Validate16(BOOLEAN7)
], CrosshairLabelProperties.prototype, "enabled", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], CrosshairLabelProperties.prototype, "className", 2);
__decorateClass([
  Validate16(NUMBER5)
], CrosshairLabelProperties.prototype, "xOffset", 2);
__decorateClass([
  Validate16(NUMBER5)
], CrosshairLabelProperties.prototype, "yOffset", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], CrosshairLabelProperties.prototype, "format", 2);
__decorateClass([
  Validate16(FUNCTION, { optional: true })
], CrosshairLabelProperties.prototype, "renderer", 2);
var CrosshairLabel = class extends BaseProperties3 {
  constructor(labelRoot) {
    super();
    this.labelRoot = labelRoot;
    this.enabled = true;
    this.xOffset = 0;
    this.yOffset = 0;
    this.renderer = void 0;
    this.element = createElement3("div");
    this.element.classList.add(DEFAULT_LABEL_CLASS);
    setAttribute(this.element, "aria-hidden", true);
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
    element.style.top = `${Math.round(top)}px`;
    element.style.left = `${Math.round(left)}px`;
    this.toggle(true);
  }
  setLabelHtml(html) {
    if (html !== void 0) {
      this.element.innerHTML = html;
    }
  }
  computeBBox() {
    const { element } = this;
    return new _Scene13.BBox(element.clientLeft, element.clientTop, element.clientWidth, element.clientHeight);
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
  Validate16(BOOLEAN7)
], CrosshairLabel.prototype, "enabled", 2);
__decorateClass([
  Validate16(STRING3, { optional: true }),
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
  Validate16(NUMBER5)
], CrosshairLabel.prototype, "xOffset", 2);
__decorateClass([
  Validate16(NUMBER5)
], CrosshairLabel.prototype, "yOffset", 2);
__decorateClass([
  Validate16(STRING3, { optional: true })
], CrosshairLabel.prototype, "format", 2);
__decorateClass([
  Validate16(FUNCTION, { optional: true })
], CrosshairLabel.prototype, "renderer", 2);

// packages/ag-charts-enterprise/src/features/crosshair/crosshair.ts
var { Group: Group3, Line: Line2, BBox: BBox2 } = _Scene14;
var { createId: createId2 } = _Util14;
var { POSITIVE_NUMBER: POSITIVE_NUMBER6, RATIO: RATIO6, BOOLEAN: BOOLEAN8, COLOR_STRING: COLOR_STRING3, LINE_DASH: LINE_DASH3, OBJECT: OBJECT3, Validate: Validate17, Layers: Layers3, getDocument: getDocument2 } = _ModuleSupport19;
var Crosshair = class extends _ModuleSupport19.BaseModuleInstance {
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
    this.lineGroupSelection = _Scene14.Selection.select(this.lineGroup, Line2, false);
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
      (group) => group.append(new Line2()),
      (key) => key
    );
  }
  updateLabels(keys) {
    var _a2;
    const { labels, ctx, axisLayout } = this;
    keys.forEach((key) => {
      var _a3, _b;
      (_b = labels[key]) != null ? _b : labels[key] = new CrosshairLabel((_a3 = ctx.scene.canvas.container) != null ? _a3 : getDocument2("body"));
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
  Validate17(BOOLEAN8)
], Crosshair.prototype, "enabled", 2);
__decorateClass([
  Validate17(COLOR_STRING3, { optional: true })
], Crosshair.prototype, "stroke", 2);
__decorateClass([
  Validate17(LINE_DASH3, { optional: true })
], Crosshair.prototype, "lineDash", 2);
__decorateClass([
  Validate17(POSITIVE_NUMBER6)
], Crosshair.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate17(POSITIVE_NUMBER6)
], Crosshair.prototype, "strokeWidth", 2);
__decorateClass([
  Validate17(RATIO6)
], Crosshair.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate17(BOOLEAN8)
], Crosshair.prototype, "snap", 2);
__decorateClass([
  Validate17(OBJECT3)
], Crosshair.prototype, "label", 2);

// packages/ag-charts-enterprise/src/features/crosshair/crosshairTheme.ts
import { _Theme as _Theme6 } from "ag-charts-community";
var AXIS_CROSSHAIR_THEME = {
  crosshair: {
    enabled: true,
    snap: true,
    stroke: _Theme6.DEFAULT_MUTED_LABEL_COLOUR,
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
      stroke: _Theme6.DEFAULT_MUTED_LABEL_COLOUR,
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
import { _ModuleSupport as _ModuleSupport20 } from "ag-charts-community";
var { BOOLEAN: BOOLEAN9, FUNCTION: FUNCTION2, ActionOnSet: ActionOnSet3, Validate: Validate18 } = _ModuleSupport20;
var DataSource = class extends _ModuleSupport20.BaseModuleInstance {
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
  Validate18(BOOLEAN9)
], DataSource.prototype, "enabled", 2);
__decorateClass([
  ActionOnSet3({
    newValue(getData) {
      this.updateCallback(this.enabled, getData);
    }
  }),
  Validate18(FUNCTION2)
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
import { AgErrorBarSupportedSeriesTypes as AgErrorBarSupportedSeriesTypes2 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/error-bar/errorBar.ts
import { AgErrorBarSupportedSeriesTypes, _ModuleSupport as _ModuleSupport23, _Scene as _Scene16, _Util as _Util15 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/error-bar/errorBarNode.ts
import { _ModuleSupport as _ModuleSupport21, _Scene as _Scene15 } from "ag-charts-community";
var { partialAssign, mergeDefaults } = _ModuleSupport21;
var { BBox: BBox3 } = _Scene15;
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
var ErrorBarNode = class extends _Scene15.Group {
  constructor() {
    super();
    this.capLength = NaN;
    this._datum = void 0;
    this.whiskerPath = new _Scene15.Path();
    this.capsPath = new _Scene15.Path();
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
var ErrorBarGroup = class extends _Scene15.Group {
  get children() {
    return super.children;
  }
  nearestSquared(x, y) {
    const { nearest, distanceSquared } = _Scene15.nearestSquaredInContainer(x, y, this);
    if (nearest !== void 0 && !isNaN(distanceSquared)) {
      return { datum: nearest.datum, distanceSquared };
    }
  }
};

// packages/ag-charts-enterprise/src/features/error-bar/errorBarProperties.ts
import { _ModuleSupport as _ModuleSupport22 } from "ag-charts-community";
var {
  BaseProperties: BaseProperties4,
  Validate: Validate19,
  BOOLEAN: BOOLEAN10,
  COLOR_STRING: COLOR_STRING4,
  FUNCTION: FUNCTION3,
  LINE_DASH: LINE_DASH4,
  NUMBER: NUMBER6,
  OBJECT: OBJECT4,
  POSITIVE_NUMBER: POSITIVE_NUMBER7,
  RATIO: RATIO7,
  STRING: STRING4
} = _ModuleSupport22;
var ErrorBarCap = class extends BaseProperties4 {
};
__decorateClass([
  Validate19(BOOLEAN10, { optional: true })
], ErrorBarCap.prototype, "visible", 2);
__decorateClass([
  Validate19(COLOR_STRING4, { optional: true })
], ErrorBarCap.prototype, "stroke", 2);
__decorateClass([
  Validate19(POSITIVE_NUMBER7, { optional: true })
], ErrorBarCap.prototype, "strokeWidth", 2);
__decorateClass([
  Validate19(RATIO7, { optional: true })
], ErrorBarCap.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate19(LINE_DASH4, { optional: true })
], ErrorBarCap.prototype, "lineDash", 2);
__decorateClass([
  Validate19(POSITIVE_NUMBER7, { optional: true })
], ErrorBarCap.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate19(NUMBER6, { optional: true })
], ErrorBarCap.prototype, "length", 2);
__decorateClass([
  Validate19(RATIO7, { optional: true })
], ErrorBarCap.prototype, "lengthRatio", 2);
__decorateClass([
  Validate19(FUNCTION3, { optional: true })
], ErrorBarCap.prototype, "formatter", 2);
var ErrorBarProperties = class extends BaseProperties4 {
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
  Validate19(STRING4, { optional: true })
], ErrorBarProperties.prototype, "yLowerKey", 2);
__decorateClass([
  Validate19(STRING4, { optional: true })
], ErrorBarProperties.prototype, "yLowerName", 2);
__decorateClass([
  Validate19(STRING4, { optional: true })
], ErrorBarProperties.prototype, "yUpperKey", 2);
__decorateClass([
  Validate19(STRING4, { optional: true })
], ErrorBarProperties.prototype, "yUpperName", 2);
__decorateClass([
  Validate19(STRING4, { optional: true })
], ErrorBarProperties.prototype, "xLowerKey", 2);
__decorateClass([
  Validate19(STRING4, { optional: true })
], ErrorBarProperties.prototype, "xLowerName", 2);
__decorateClass([
  Validate19(STRING4, { optional: true })
], ErrorBarProperties.prototype, "xUpperKey", 2);
__decorateClass([
  Validate19(STRING4, { optional: true })
], ErrorBarProperties.prototype, "xUpperName", 2);
__decorateClass([
  Validate19(BOOLEAN10, { optional: true })
], ErrorBarProperties.prototype, "visible", 2);
__decorateClass([
  Validate19(COLOR_STRING4, { optional: true })
], ErrorBarProperties.prototype, "stroke", 2);
__decorateClass([
  Validate19(POSITIVE_NUMBER7, { optional: true })
], ErrorBarProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate19(RATIO7, { optional: true })
], ErrorBarProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate19(LINE_DASH4, { optional: true })
], ErrorBarProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate19(POSITIVE_NUMBER7, { optional: true })
], ErrorBarProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate19(FUNCTION3, { optional: true })
], ErrorBarProperties.prototype, "formatter", 2);
__decorateClass([
  Validate19(OBJECT4)
], ErrorBarProperties.prototype, "cap", 2);

// packages/ag-charts-enterprise/src/features/error-bar/errorBar.ts
var {
  fixNumericExtent,
  groupAccumulativeValueProperty,
  isDefined,
  mergeDefaults: mergeDefaults2,
  valueProperty,
  ChartAxisDirection: ChartAxisDirection6
} = _ModuleSupport23;
function toErrorBoundCartesianSeries(ctx) {
  for (const supportedType of AgErrorBarSupportedSeriesTypes) {
    if (supportedType === ctx.series.type) {
      return ctx.series;
    }
  }
  throw new Error(
    `AG Charts - unsupported series type '${ctx.series.type}', error bars supported series types: ${AgErrorBarSupportedSeriesTypes.join(", ")}`
  );
}
var ErrorBars = class _ErrorBars extends _ModuleSupport23.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.properties = new ErrorBarProperties();
    const series = toErrorBoundCartesianSeries(ctx);
    const { annotationGroup, annotationSelections } = series;
    this.cartesianSeries = series;
    this.groupNode = new ErrorBarGroup({
      name: `${annotationGroup.id}-errorBars`,
      zIndex: _ModuleSupport23.Layers.SERIES_LAYER_ZINDEX,
      zIndexSubOrder: series.getGroupZIndexSubOrder("annotation")
    });
    annotationGroup.appendChild(this.groupNode);
    this.selection = _Scene16.Selection.select(this.groupNode, () => this.errorBarFactory());
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
    return stackCount == null ? false : stackCount > 0;
  }
  getUnstackPropertyDefinition(opts) {
    const props = [];
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
    const { xScaleType, yScaleType } = opts;
    if (yLowerKey != null && yUpperKey != null) {
      props.push(
        valueProperty(yLowerKey, yScaleType, { id: `${yErrorsID}-lower` }),
        valueProperty(yUpperKey, yScaleType, { id: `${yErrorsID}-upper` })
      );
    }
    if (xLowerKey != null && xUpperKey != null) {
      props.push(
        valueProperty(xLowerKey, xScaleType, { id: `${xErrorsID}-lower` }),
        valueProperty(xUpperKey, xScaleType, { id: `${xErrorsID}-upper` })
      );
    }
    return props;
  }
  getStackPropertyDefinition(opts) {
    var _a2, _b;
    const props = [];
    const { cartesianSeries } = this;
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
    const { xScaleType, yScaleType } = opts;
    const groupIndex = (_b = (_a2 = cartesianSeries.seriesGrouping) == null ? void 0 : _a2.groupIndex) != null ? _b : cartesianSeries.id;
    const groupOpts = __spreadValues({
      invalidValue: null,
      missingValue: 0,
      separateNegative: true
    }, cartesianSeries.visible ? {} : { forceValue: 0 });
    const makeErrorProperty = (key, id, type, scaleType) => {
      return groupAccumulativeValueProperty(
        key,
        "normal",
        "current",
        __spreadValues({
          id: `${id}-${type}`,
          groupId: `errorGroup-${groupIndex}-${type}`
        }, groupOpts),
        scaleType
      );
    };
    const pushErrorProperties = (lowerKey, upperKey, id, scaleType) => {
      props.push(
        ...makeErrorProperty(lowerKey, id, "lower", scaleType),
        ...makeErrorProperty(upperKey, id, "upper", scaleType)
      );
    };
    if (yLowerKey != null && yUpperKey != null) {
      pushErrorProperties(yLowerKey, yUpperKey, yErrorsID, yScaleType);
    }
    if (xLowerKey != null && xUpperKey != null) {
      pushErrorProperties(xLowerKey, xUpperKey, xErrorsID, xScaleType);
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
      if (dataModel != null && processedData != null) {
        const axis = series.axes[direction];
        const id = { x: xErrorsID, y: yErrorsID }[direction];
        const lowerDomain = dataModel.getDomain(series, `${id}-lower`, "value", processedData);
        const upperDomain = dataModel.getDomain(series, `${id}-upper`, "value", processedData);
        const domain = [Math.min(...lowerDomain, ...upperDomain), Math.max(...lowerDomain, ...upperDomain)];
        return fixNumericExtent(domain, axis);
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
    var _a2;
    return (_a2 = this.cartesianSeries.contextNodeData) == null ? void 0 : _a2.nodeData;
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
      if (midPoint != null) {
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
    if (key == null) {
      return;
    }
    const value = datum.datum[key];
    if (value == null) {
      return;
    }
    if (typeof value !== "number") {
      _Util15.Logger.warnOnce(`Found [${key}] error value of type ${typeof value}. Expected number type`);
      return;
    }
    return value + offset;
  }
  getDatum(nodeData, datumIndex) {
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.getMaybeFlippedKeys();
    const datum = nodeData[datumIndex];
    const d = datum.cumulativeValue == null || !this.isStacked() ? 0 : datum.cumulativeValue - datum.yValue;
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
    if (nodeData != null) {
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
    if (node != null) {
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
    if (nodeData == null)
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
import { _Theme as _Theme7 } from "ag-charts-community";
var ERROR_BARS_THEME = {
  series: {
    errorBar: {
      visible: true,
      stroke: _Theme7.DEFAULT_LABEL_COLOUR,
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
  seriesTypes: AgErrorBarSupportedSeriesTypes2,
  instanceConstructor: ErrorBars,
  themeTemplate: ERROR_BARS_THEME
};

// packages/ag-charts-enterprise/src/features/navigator/navigatorModule.ts
import { _ModuleSupport as _ModuleSupport26, _Theme as _Theme8 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/navigator/navigator.ts
import { _ModuleSupport as _ModuleSupport25 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/navigator/miniChart.ts
import { _ModuleSupport as _ModuleSupport24, _Scene as _Scene17, _Util as _Util16 } from "ag-charts-community";
var { Validate: Validate20, BOOLEAN: BOOLEAN11, POSITIVE_NUMBER: POSITIVE_NUMBER8, Layers: Layers4, ActionOnSet: ActionOnSet4, CategoryAxis, GroupedCategoryAxis } = _ModuleSupport24;
var { toRadians: toRadians4, Padding, Logger } = _Util16;
var { Text: Text4, Group: Group4, BBox: BBox4 } = _Scene17;
var MiniChartPadding = class {
  constructor() {
    this.top = 0;
    this.bottom = 0;
  }
};
__decorateClass([
  Validate20(POSITIVE_NUMBER8)
], MiniChartPadding.prototype, "top", 2);
__decorateClass([
  Validate20(POSITIVE_NUMBER8)
], MiniChartPadding.prototype, "bottom", 2);
var MiniChart = class extends _ModuleSupport24.BaseModuleInstance {
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
  Validate20(BOOLEAN11)
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
var { ObserveChanges: ObserveChanges3 } = _ModuleSupport25;
var _Navigator = class _Navigator extends _ModuleSupport25.Navigator {
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
  themeTemplate: __spreadProps(__spreadValues({}, _ModuleSupport26.NavigatorModule.themeTemplate), {
    navigator: __spreadProps(__spreadValues({}, (_a = _ModuleSupport26.NavigatorModule.themeTemplate) == null ? void 0 : _a.navigator), {
      miniChart: {
        enabled: false,
        label: {
          color: _Theme8.DEFAULT_LABEL_COLOUR,
          fontStyle: void 0,
          fontWeight: void 0,
          fontSize: 10,
          fontFamily: _Theme8.DEFAULT_FONT_FAMILY,
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

// packages/ag-charts-enterprise/src/features/sync/chartSync.ts
import { _ModuleSupport as _ModuleSupport27, _Util as _Util17 } from "ag-charts-community";
var {
  BOOLEAN: BOOLEAN12,
  STRING: STRING5,
  UNION: UNION4,
  BaseProperties: BaseProperties5,
  CartesianAxis,
  ChartUpdateType,
  arraysEqual,
  isDate,
  isDefined: isDefined2,
  isFiniteNumber,
  ObserveChanges: ObserveChanges4,
  TooltipManager,
  Validate: Validate21
} = _ModuleSupport27;
var { Logger: Logger2 } = _Util17;
var ChartSync = class extends BaseProperties5 {
  constructor(moduleContext) {
    super();
    this.moduleContext = moduleContext;
    this.enabled = false;
    this.axes = "x";
    this.nodeInteraction = true;
    this.zoom = true;
  }
  updateChart(chart, updateType = ChartUpdateType.UPDATE_DATA) {
    chart.ctx.updateService.update(updateType, { skipSync: true });
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
          chart.ctx.zoomManager.updateZoom("sync", this.mergeZoom(chart));
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
          chart.ctx.highlightManager.updateHighlight(chart.id);
          chart.ctx.tooltipManager.removeTooltip(chart.id);
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
            const { nodeData } = series.contextNodeData;
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
          if (matchingNodes.length < 2 && ((_c = matchingNodes[0]) == null ? void 0 : _c.nodeDatum) !== chart.ctx.highlightManager.getActiveHighlight()) {
            const { series, nodeDatum } = (_d = matchingNodes[0]) != null ? _d : {};
            chart.ctx.highlightManager.updateHighlight(chart.id, nodeDatum);
            if (nodeDatum) {
              const offsetX = (_h = (_g = (_e = nodeDatum.midPoint) == null ? void 0 : _e.x) != null ? _g : (_f = nodeDatum.point) == null ? void 0 : _f.x) != null ? _h : 0;
              const offsetY = (_l = (_k = (_i = nodeDatum.midPoint) == null ? void 0 : _i.y) != null ? _k : (_j = nodeDatum.point) == null ? void 0 : _j.y) != null ? _l : 0;
              const tooltipMeta = TooltipManager.makeTooltipMeta(
                { type: "hover", offsetX, offsetY },
                nodeDatum
              );
              delete tooltipMeta.lastPointerEvent;
              chart.ctx.tooltipManager.updateTooltip(
                chart.id,
                tooltipMeta,
                series.getTooltipHtml(nodeDatum)
              );
            } else {
              chart.ctx.tooltipManager.removeTooltip(chart.id);
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
  Validate21(BOOLEAN12),
  ObserveChanges4((target) => target.onEnabledChange())
], ChartSync.prototype, "enabled", 2);
__decorateClass([
  Validate21(STRING5, { optional: true }),
  ObserveChanges4((target, newValue, oldValue) => target.onGroupIdChange(newValue, oldValue))
], ChartSync.prototype, "groupId", 2);
__decorateClass([
  Validate21(UNION4(["x", "y", "xy"], "an axis")),
  ObserveChanges4((target) => target.onAxesChange())
], ChartSync.prototype, "axes", 2);
__decorateClass([
  Validate21(BOOLEAN12),
  ObserveChanges4((target) => target.onNodeInteractionChange())
], ChartSync.prototype, "nodeInteraction", 2);
__decorateClass([
  Validate21(BOOLEAN12),
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
import { _ModuleSupport as _ModuleSupport36, _Util as _Util21 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/zoom/scenes/zoomRect.ts
import { _ModuleSupport as _ModuleSupport28, _Scene as _Scene19 } from "ag-charts-community";
var { COLOR_STRING: COLOR_STRING5, RATIO: RATIO8, Validate: Validate22 } = _ModuleSupport28;
var ZoomRect = class extends _Scene19.Rect {
  constructor() {
    super(...arguments);
    this.fill = "rgb(33, 150, 243)";
    this.fillOpacity = 0.2;
  }
};
ZoomRect.className = "ZoomRect";
__decorateClass([
  Validate22(COLOR_STRING5)
], ZoomRect.prototype, "fill", 2);
__decorateClass([
  Validate22(RATIO8)
], ZoomRect.prototype, "fillOpacity", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomAxisDragger.ts
import { _ModuleSupport as _ModuleSupport30 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/zoom/zoomUtils.ts
import { _ModuleSupport as _ModuleSupport29 } from "ag-charts-community";
var { clamp, isEqual, round } = _ModuleSupport29;
var UNIT = { min: 0, max: 1 };
var DEFAULT_ANCHOR_POINT_X = "end";
var DEFAULT_ANCHOR_POINT_Y = "middle";
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
function isZoomEqual(left, right, epsilon = 1e-10) {
  return isEqual(left.x.min, right.x.min, epsilon) && isEqual(left.x.max, right.x.max, epsilon) && isEqual(left.y.min, right.y.min, epsilon) && isEqual(left.y.max, right.y.max, epsilon);
}
function isZoomLess(zoom, minRatioX, minRatioY) {
  const isMinXZoom = round(dx(zoom), 10) <= minRatioX;
  const isMinYZoom = round(dy(zoom), 10) <= minRatioY;
  return isMinXZoom || isMinYZoom;
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
      direction === _ModuleSupport30.ChartAxisDirection.X ? __spreadProps(__spreadValues({}, zoom), { x: axisZoom }) : __spreadProps(__spreadValues({}, zoom), { y: axisZoom })
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
      if (direction === _ModuleSupport30.ChartAxisDirection.X)
        return newZoom.x;
      return newZoom.y;
    }
    const origin = pointToRatio(bbox, coords.x1, coords.y1);
    const target = pointToRatio(bbox, coords.x2, coords.y2);
    if (direction === _ModuleSupport30.ChartAxisDirection.X) {
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

// packages/ag-charts-enterprise/src/features/zoom/zoomContextMenu.ts
var CONTEXT_ZOOM_ACTION_ID = "zoom-action";
var CONTEXT_PAN_ACTION_ID = "pan-action";
var ZoomContextMenu = class {
  constructor(contextMenuRegistry, zoomManager, updateZoom) {
    this.contextMenuRegistry = contextMenuRegistry;
    this.zoomManager = zoomManager;
    this.updateZoom = updateZoom;
  }
  registerActions(enabled, zoom, props) {
    if (!enabled)
      return;
    const { contextMenuRegistry } = this;
    contextMenuRegistry.registerDefaultAction({
      id: CONTEXT_ZOOM_ACTION_ID,
      label: "Zoom to here",
      action: (params) => this.onZoomToHere(params, props)
    });
    contextMenuRegistry.registerDefaultAction({
      id: CONTEXT_PAN_ACTION_ID,
      label: "Pan to here",
      action: (params) => this.onPanToHere(params, props)
    });
    this.toggleActions(zoom, props);
  }
  toggleActions(zoom, props) {
    const { contextMenuRegistry } = this;
    if (isZoomLess(zoom, props.minRatioX, props.minRatioY)) {
      contextMenuRegistry.disableAction(CONTEXT_ZOOM_ACTION_ID);
    } else {
      contextMenuRegistry.enableAction(CONTEXT_ZOOM_ACTION_ID);
    }
    if (isZoomEqual(zoom, unitZoomState())) {
      contextMenuRegistry.disableAction(CONTEXT_PAN_ACTION_ID);
    } else {
      contextMenuRegistry.enableAction(CONTEXT_PAN_ACTION_ID);
    }
  }
  onZoomToHere({ event }, props) {
    const { rect } = this;
    const { enabled, isScalingX, isScalingY, minRatioX, minRatioY } = props;
    if (!enabled || !rect || !event || !event.target)
      return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const origin = pointToRatio(rect, event.clientX, event.clientY);
    const scaledOriginX = origin.x * dx(zoom);
    const scaledOriginY = origin.y * dy(zoom);
    const size = UNIT.max - UNIT.min;
    const halfSize = size / 2;
    let newZoom = {
      x: { min: origin.x - halfSize, max: origin.x + halfSize },
      y: { min: origin.y - halfSize, max: origin.y + halfSize }
    };
    newZoom = scaleZoomCenter(newZoom, isScalingX ? minRatioX : size, isScalingY ? minRatioY : size);
    newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);
    this.updateZoom(constrainZoom(newZoom));
  }
  onPanToHere({ event }, props) {
    const { rect } = this;
    const { enabled } = props;
    if (!enabled || !rect || !event || !event.target)
      return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const origin = pointToRatio(rect, event.clientX, event.clientY);
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
};

// packages/ag-charts-enterprise/src/features/zoom/zoomPanner.ts
import { _ModuleSupport as _ModuleSupport31 } from "ag-charts-community";
var maxZoomCoords = 16;
var ZoomPanner = class {
  constructor() {
    this.deceleration = 1;
    this.zoomCoordsHistoryIndex = 0;
    this.coordsHistory = [];
  }
  addListener(_type, fn) {
    this.onUpdate = fn;
    return () => {
      this.onUpdate = void 0;
    };
  }
  stopInteractions() {
    if (this.inertiaHandle != null) {
      cancelAnimationFrame(this.inertiaHandle);
      this.inertiaHandle = void 0;
    }
  }
  update(event) {
    var _a2, _b;
    this.updateCoords(event.offsetX, event.offsetY);
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = (_a2 = this.coords) != null ? _a2 : {};
    (_b = this.onUpdate) == null ? void 0 : _b.call(this, {
      type: "update",
      deltaX: x1 - x2,
      deltaY: y1 - y2
    });
  }
  start() {
    this.coordsMonitorTimeout = setInterval(this.recordCurrentZoomCoords.bind(this), 16);
  }
  stop() {
    const { coordsHistory } = this;
    let deltaX = 0;
    let deltaY = 0;
    let deltaT = 0;
    if (coordsHistory.length > 0) {
      const arrayIndex = this.zoomCoordsHistoryIndex % maxZoomCoords;
      let index1 = arrayIndex - 1;
      if (index1 < 0)
        index1 = coordsHistory.length - 1;
      let index0 = arrayIndex;
      if (index0 >= coordsHistory.length)
        index0 = 0;
      const coords1 = coordsHistory[index1];
      const coords0 = coordsHistory[index0];
      deltaX = coords1.x - coords0.x;
      deltaY = coords1.y - coords0.y;
      deltaT = coords1.t - coords0.t;
    }
    this.coords = void 0;
    clearInterval(this.coordsMonitorTimeout);
    this.coordsMonitorTimeout = void 0;
    this.zoomCoordsHistoryIndex = 0;
    this.coordsHistory.length = 0;
    if (deltaT > 0 && this.deceleration < 1) {
      const xVelocity = deltaX / deltaT;
      const yVelocity = deltaY / deltaT;
      const velocity = Math.hypot(xVelocity, yVelocity);
      const angle = Math.atan2(yVelocity, xVelocity);
      const t0 = performance.now();
      this.inertiaHandle = requestAnimationFrame((t) => {
        this.animateInertia(t, t, t0, velocity, angle);
      });
    }
  }
  recordCurrentZoomCoords() {
    const { coords, coordsHistory, zoomCoordsHistoryIndex } = this;
    if (!coords)
      return;
    const { x2: x, y2: y } = coords;
    const t = Date.now();
    coordsHistory[zoomCoordsHistoryIndex % maxZoomCoords] = { x, y, t };
    this.zoomCoordsHistoryIndex += 1;
  }
  animateInertia(t, prevT, t0, velocity, angle) {
    var _a2;
    const friction = 1 - this.deceleration;
    const maxS = -velocity / Math.log(friction);
    const s0 = velocity * (__pow(friction, prevT - t0) - 1) / Math.log(friction);
    const s1 = velocity * (__pow(friction, t - t0) - 1) / Math.log(friction);
    (_a2 = this.onUpdate) == null ? void 0 : _a2.call(this, {
      type: "update",
      deltaX: -Math.cos(angle) * (s1 - s0),
      deltaY: -Math.sin(angle) * (s1 - s0)
    });
    if (s1 >= maxS - 1)
      return;
    this.inertiaHandle = requestAnimationFrame((nextT) => {
      this.animateInertia(nextT, t, t0, velocity, angle);
    });
  }
  updateCoords(x, y) {
    if (this.coords) {
      this.coords = { x1: this.coords.x2, y1: this.coords.y2, x2: x, y2: y };
    } else {
      this.coords = { x1: x, y1: y, x2: x, y2: y };
    }
  }
  translateZooms(bbox, currentZooms, deltaX, deltaY) {
    const offset = pointToRatio(bbox, bbox.x + Math.abs(deltaX), bbox.y + bbox.height - Math.abs(deltaY));
    const offsetX = Math.sign(deltaX) * offset.x;
    const offsetY = -Math.sign(deltaY) * offset.y;
    const newZooms = {};
    for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
      let zoom;
      if (direction === _ModuleSupport31.ChartAxisDirection.X) {
        zoom = definedZoomState({ x: currentZoom });
      } else {
        zoom = definedZoomState({ y: currentZoom });
      }
      zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), offsetY * dy(zoom)));
      if (direction === _ModuleSupport31.ChartAxisDirection.X) {
        newZooms[axisId] = { direction, zoom: zoom.x };
      } else {
        newZooms[axisId] = { direction, zoom: zoom.y };
      }
    }
    return newZooms;
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoomRange.ts
import { _ModuleSupport as _ModuleSupport32, _Util as _Util19 } from "ag-charts-community";
var { AND: AND5, DATE: DATE2, NUMBER: NUMBER7, OR: OR4, ActionOnSet: ActionOnSet5, isFiniteNumber: isFiniteNumber2, isValidDate, Validate: Validate23 } = _ModuleSupport32;
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
    const [, end] = this.domain;
    if (end == null)
      return;
    const start = fn(end);
    const changed = this.start !== start || this.end !== end;
    this.end = end;
    this.start = start;
    if (!changed)
      (_a2 = this.onChange) == null ? void 0 : _a2.call(this, this.getRange());
  }
  updateWith(fn) {
    var _a2;
    if (!this.domain)
      return;
    let [start, end] = this.domain;
    [start, end] = fn(start, end);
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
    const [start, end] = this.domain;
    const changed = this.start !== start || this.end !== end;
    this.start = start;
    this.end = end;
    if (!changed)
      (_a2 = this.onChange) == null ? void 0 : _a2.call(this, this.getRange());
  }
  updateAxis(axes) {
    const validAxis = axes.find(({ domain }) => {
      const isNumberAxis = !isFiniteNumber2(domain[0]) || !isFiniteNumber2(domain.at(-1));
      const isDateAxis = !isValidDate(domain[0]) || !isValidDate(domain.at(-1));
      return isNumberAxis || isDateAxis;
    });
    if (!validAxis)
      return this.domain != null;
    let validAxisDomain = validAxis.domain;
    if (validAxisDomain != null) {
      validAxisDomain = [validAxisDomain[0], validAxisDomain.at(-1)];
      if (validAxisDomain[0] instanceof Date && validAxisDomain[1] instanceof Date) {
        validAxisDomain = [validAxisDomain[0].getTime(), validAxisDomain[1].getTime()];
      }
    }
    const changed = this.domain == null || !_Util19.areArrayItemsStrictlyEqual(this.domain, validAxisDomain);
    if (changed) {
      this.domain = validAxisDomain;
    }
    return changed;
  }
  getRangeWithValues(start, end) {
    var _a2;
    let [d0, d1] = (_a2 = this.domain) != null ? _a2 : [];
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
  ActionOnSet5({
    changeValue(start) {
      var _a2, _b;
      (_a2 = this.initialStart) != null ? _a2 : this.initialStart = start;
      (_b = this.onChange) == null ? void 0 : _b.call(this, this.getRangeWithValues(start, this.end));
    }
  }),
  Validate23(AND5(
    OR4(DATE2, NUMBER7)
    /* LESS_THAN('end') */
  ), { optional: true })
], ZoomRange.prototype, "start", 2);
__decorateClass([
  ActionOnSet5({
    changeValue(end) {
      var _a2, _b;
      (_a2 = this.initialEnd) != null ? _a2 : this.initialEnd = end;
      (_b = this.onChange) == null ? void 0 : _b.call(this, this.getRangeWithValues(this.start, end));
    }
  }),
  Validate23(AND5(
    OR4(DATE2, NUMBER7)
    /* GREATER_THAN('start') */
  ), { optional: true })
], ZoomRange.prototype, "end", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomRatio.ts
import { _ModuleSupport as _ModuleSupport33 } from "ag-charts-community";
var { AND: AND6, GREATER_THAN: GREATER_THAN4, LESS_THAN: LESS_THAN3, RATIO: RATIO9, ActionOnSet: ActionOnSet6, Validate: Validate24 } = _ModuleSupport33;
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
  ActionOnSet6({
    changeValue(start) {
      var _a2, _b;
      (_a2 = this.initialStart) != null ? _a2 : this.initialStart = start;
      (_b = this.onChange) == null ? void 0 : _b.call(this, this.getRatioWithValues(start, this.end));
    }
  }),
  Validate24(AND6(RATIO9, LESS_THAN3("end")), { optional: true })
], ZoomRatio.prototype, "start", 2);
__decorateClass([
  ActionOnSet6({
    changeValue(end) {
      var _a2, _b;
      (_a2 = this.initialEnd) != null ? _a2 : this.initialEnd = end;
      (_b = this.onChange) == null ? void 0 : _b.call(this, this.getRatioWithValues(this.start, end));
    }
  }),
  Validate24(AND6(RATIO9, GREATER_THAN4("start")), { optional: true })
], ZoomRatio.prototype, "end", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomScrollPanner.ts
import { _ModuleSupport as _ModuleSupport34 } from "ag-charts-community";
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
      if (direction !== _ModuleSupport34.ChartAxisDirection.X)
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
  update(event, props, bbox, oldZoom) {
    const sourceEvent = event.sourceEvent;
    const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;
    const dir = event.deltaY;
    let newZoom = definedZoomState(oldZoom);
    newZoom.x.max += isScalingX ? scrollingStep * dir * dx(oldZoom) : 0;
    newZoom.y.max += isScalingY ? scrollingStep * dir * dy(oldZoom) : 0;
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
  update(event, props, bbox, currentZoom) {
    this.rect.visible = true;
    this.updateCoords(event.offsetX, event.offsetY, props, bbox, currentZoom);
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
  updateCoords(x, y, props, bbox, currentZoom) {
    if (!this.coords) {
      this.coords = { x1: x, y1: y, x2: x, y2: y };
      return;
    }
    this.coords.x2 = x;
    this.coords.y2 = y;
    if (!bbox)
      return;
    const { isScalingX, isScalingY, minRatioX, minRatioY } = props;
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

// packages/ag-charts-enterprise/src/features/zoom/zoomToolbar.ts
import { _ModuleSupport as _ModuleSupport35 } from "ag-charts-community";
var { ToolbarManager } = _ModuleSupport35;
var ZoomToolbar = class {
  constructor(toolbarManager, zoomManager, getResetZoom, updateZoom) {
    this.toolbarManager = toolbarManager;
    this.zoomManager = zoomManager;
    this.getResetZoom = getResetZoom;
    this.updateZoom = updateZoom;
  }
  toggle(enabled, zoom, props) {
    this.toggleGroups(enabled);
    if (enabled) {
      this.toggleButtons(zoom, props);
    }
  }
  toggleButtons(zoom, props) {
    const { toolbarManager } = this;
    const isMaxZoom = isZoomEqual(zoom, unitZoomState());
    const isMinZoom = isZoomLess(zoom, props.minRatioX, props.minRatioY);
    const isResetZoom = isZoomEqual(zoom, this.getResetZoom());
    toolbarManager.toggleButton("zoom", "pan-start", zoom.x.min > UNIT.min);
    toolbarManager.toggleButton("zoom", "pan-end", zoom.x.max < UNIT.max);
    toolbarManager.toggleButton("zoom", "pan-left", zoom.x.min > UNIT.min);
    toolbarManager.toggleButton("zoom", "pan-right", zoom.x.max < UNIT.max);
    toolbarManager.toggleButton("zoom", "zoom-out", !isMaxZoom);
    toolbarManager.toggleButton("zoom", "zoom-in", !isMinZoom);
    toolbarManager.toggleButton("zoom", "reset", !isResetZoom);
  }
  onButtonPress(event, props) {
    this.onButtonPressRanges(event, props);
    this.onButtonPressZoom(event, props);
  }
  toggleGroups(enabled) {
    var _a2, _b;
    (_a2 = this.toolbarManager) == null ? void 0 : _a2.toggleGroup("ranges", Boolean(enabled));
    (_b = this.toolbarManager) == null ? void 0 : _b.toggleGroup("zoom", Boolean(enabled));
  }
  onButtonPressRanges(event, props) {
    if (!ToolbarManager.isGroup("ranges", event))
      return;
    const { rangeX } = props;
    const time2 = event.value;
    if (typeof time2 === "number") {
      rangeX.extendToEnd(time2);
    } else if (Array.isArray(time2)) {
      rangeX.updateWith(() => time2);
    } else if (typeof time2 === "function") {
      rangeX.updateWith(time2);
    }
  }
  onButtonPressZoom(event, props) {
    if (!ToolbarManager.isGroup("zoom", event))
      return;
    const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;
    const oldZoom = definedZoomState(this.zoomManager.getZoom());
    let zoom = definedZoomState(oldZoom);
    switch (event.value) {
      case "reset":
        zoom = this.getResetZoom();
        break;
      case "pan-start":
        zoom.x.max = dx(zoom);
        zoom.x.min = 0;
        break;
      case "pan-end":
        zoom.x.min = UNIT.max - dx(zoom);
        zoom.x.max = UNIT.max;
        break;
      case "pan-left":
      case "pan-right":
        zoom = translateZoom(zoom, event.value === "pan-left" ? -dx(zoom) : dx(zoom), 0);
        break;
      case "zoom-in":
      case "zoom-out":
        const scale = event.value === "zoom-in" ? 1 - scrollingStep : 1 + scrollingStep;
        const useAnchorPointX = anchorPointX === "pointer" ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
        const useAnchorPointY = anchorPointY === "pointer" ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;
        zoom = scaleZoom(zoom, isScalingX ? scale : 1, isScalingY ? scale : 1);
        zoom.x = scaleZoomAxisWithAnchor(zoom.x, oldZoom.x, useAnchorPointX);
        zoom.y = scaleZoomAxisWithAnchor(zoom.y, oldZoom.y, useAnchorPointY);
        break;
    }
    this.updateZoom(constrainZoom(zoom));
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoom.ts
var {
  ARRAY: ARRAY2,
  BOOLEAN: BOOLEAN13,
  NUMBER: NUMBER8,
  RATIO: RATIO10,
  STRING: STRING6,
  UNION: UNION5,
  ActionOnSet: ActionOnSet7,
  ChartAxisDirection: ChartAxisDirection7,
  ChartUpdateType: ChartUpdateType2,
  Validate: Validate25,
  ProxyProperty: ProxyProperty2,
  round: sharedRound
} = _ModuleSupport36;
var round2 = (value) => sharedRound(value, 10);
var ANCHOR_POINT = UNION5(["pointer", "start", "middle", "end"], "an anchor cord");
var CURSOR_ID = "zoom-cursor";
var TOOLTIP_ID = "zoom-tooltip";
var ZoomButtonsProperties = class extends _ModuleSupport36.BaseProperties {
  constructor(onChange) {
    super();
    this.onChange = onChange;
    this.enabled = false;
    this.position = "floating-bottom";
    this.align = "center";
  }
};
__decorateClass([
  _ModuleSupport36.ObserveChanges((target) => {
    target.onChange();
  }),
  Validate25(BOOLEAN13)
], ZoomButtonsProperties.prototype, "enabled", 2);
__decorateClass([
  _ModuleSupport36.ObserveChanges((target) => {
    target.onChange();
  }),
  Validate25(ARRAY2, { optional: true })
], ZoomButtonsProperties.prototype, "buttons", 2);
__decorateClass([
  Validate25(STRING6)
], ZoomButtonsProperties.prototype, "position", 2);
__decorateClass([
  Validate25(STRING6)
], ZoomButtonsProperties.prototype, "align", 2);
var Zoom = class extends _ModuleSupport36.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = false;
    this.enableAxisDragging = true;
    this.buttons = new ZoomButtonsProperties(() => this.onZoomButtonsChange(this.enabled));
    this.enableDoubleClickToReset = true;
    this.enablePanning = true;
    this.enableScrolling = true;
    this.enableSelecting = false;
    this.panKey = "alt";
    this.axes = "x";
    this.scrollingStep = (UNIT.max - UNIT.min) / 10;
    this.minVisibleItemsX = 2;
    this.minVisibleItemsY = 2;
    this.anchorPointX = DEFAULT_ANCHOR_POINT_X;
    this.anchorPointY = DEFAULT_ANCHOR_POINT_Y;
    this.rangeX = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection7.X));
    this.rangeY = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection7.Y));
    this.ratioX = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection7.X));
    this.ratioY = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection7.Y));
    // Zoom methods
    this.axisDragger = new ZoomAxisDragger();
    this.contextMenu = new ZoomContextMenu(
      this.ctx.contextMenuRegistry,
      this.ctx.zoomManager,
      this.updateZoom.bind(this)
    );
    this.panner = new ZoomPanner();
    this.scroller = new ZoomScroller();
    this.scrollPanner = new ZoomScrollPanner();
    this.toolbar = new ZoomToolbar(
      this.ctx.toolbarManager,
      this.ctx.zoomManager,
      this.getResetZoom.bind(this),
      this.updateZoom.bind(this)
    );
    this.deceleration = 1;
    // State
    this.dragState = 0 /* None */;
    this.minRatioX = 0;
    this.minRatioY = 0;
    const selectionRect = new ZoomRect();
    this.selector = new ZoomSelector(selectionRect);
    const { Default: Default6, ZoomDrag, Animation: Animation2 } = _ModuleSupport36.InteractionState;
    const draggableState = Default6 | Animation2 | ZoomDrag;
    const clickableState = Default6 | Animation2;
    const region = ctx.regionManager.getRegion("series");
    this.destroyFns.push(
      ctx.scene.attachNode(selectionRect),
      region.addListener("dblclick", (event) => this.onDoubleClick(event), clickableState),
      region.addListener("drag", (event) => this.onDrag(event), draggableState),
      region.addListener("drag-start", (event) => this.onDragStart(event), draggableState),
      region.addListener("drag-end", () => this.onDragEnd(), draggableState),
      region.addListener("wheel", (event) => this.onWheel(event), clickableState),
      region.addListener("hover", () => this.onAxisLeave(), clickableState),
      region.addListener("leave", () => this.onAxisLeave(), clickableState),
      ctx.chartEventManager.addListener("axis-hover", (event) => this.onAxisHover(event)),
      ctx.gestureDetector.addListener("pinch-move", (event) => this.onPinchMove(event)),
      ctx.toolbarManager.addListener(
        "button-pressed",
        (event) => this.toolbar.onButtonPress(event, this.getModuleProperties())
      ),
      ctx.layoutService.addListener("layout-complete", (event) => this.onLayoutComplete(event)),
      ctx.updateService.addListener("update-complete", (event) => this.onUpdateComplete(event)),
      ctx.zoomManager.addListener("zoom-change", (event) => this.onZoomChange(event)),
      ctx.zoomManager.addListener("zoom-pan-start", (event) => this.onZoomPanStart(event)),
      this.panner.addListener("update", (event) => this.onPanUpdate(event))
    );
  }
  onEnabledChange(enabled) {
    if (!this.contextMenu || !this.toolbar)
      return;
    const zoom = this.getZoom();
    const props = this.getModuleProperties({ enabled });
    this.contextMenu.registerActions(enabled, zoom, props);
    this.onZoomButtonsChange(enabled);
    this.toolbar.toggle(enabled, zoom, props);
  }
  onZoomButtonsChange(zoomEnabled) {
    if (!this.buttons)
      return;
    const buttonsJson = this.buttons.toJson();
    buttonsJson.enabled && (buttonsJson.enabled = zoomEnabled);
    this.ctx.toolbarManager.proxyGroupOptions("zoom", buttonsJson);
  }
  onRangeChange(direction, rangeZoom) {
    if (!rangeZoom)
      return;
    const zoom = this.getZoom();
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
    const {
      enabled,
      enableDoubleClickToReset,
      hoveredAxis,
      paddedRect,
      ctx: { highlightManager }
    } = this;
    if (!enabled || !enableDoubleClickToReset)
      return;
    const { x, y } = this.getResetZoom();
    if (hoveredAxis) {
      const { direction } = hoveredAxis;
      const axisZoom = direction === ChartAxisDirection7.X ? x : y;
      this.updateAxisZoom(direction, axisZoom);
    } else if ((paddedRect == null ? void 0 : paddedRect.containsPoint(event.offsetX, event.offsetY)) && highlightManager.getActivePicked() == null) {
      this.updateZoom({ x, y });
    }
  }
  onDragStart(event) {
    const {
      enabled,
      enableAxisDragging,
      enablePanning,
      enableSelecting,
      hoveredAxis,
      paddedRect,
      ctx: { cursorManager, zoomManager }
    } = this;
    if (!enabled || !paddedRect)
      return;
    this.panner.stopInteractions();
    let newDragState = 0 /* None */;
    if (enableAxisDragging && hoveredAxis) {
      newDragState = 1 /* Axis */;
    } else if (paddedRect.containsPoint(event.offsetX, event.offsetY)) {
      const panKeyPressed = this.isPanningKeyPressed(event.sourceEvent);
      if (enablePanning && (!enableSelecting || panKeyPressed)) {
        cursorManager.updateCursor(CURSOR_ID, "grabbing");
        newDragState = 2 /* Pan */;
        this.panner.start();
      } else if (enableSelecting) {
        const fullyZoomedIn = this.isMinZoom(this.getZoom());
        if (!fullyZoomedIn && !panKeyPressed) {
          newDragState = 3 /* Select */;
        }
      }
    }
    if ((this.dragState = newDragState) !== 0 /* None */) {
      zoomManager.fireZoomPanStartEvent("zoom");
    }
  }
  onDrag(event) {
    const {
      anchorPointX,
      anchorPointY,
      axisDragger,
      dragState,
      enabled,
      paddedRect,
      panner,
      selector,
      seriesRect,
      hoveredAxis,
      ctx: { interactionManager, tooltipManager, updateService, zoomManager }
    } = this;
    if (!enabled || !paddedRect || !seriesRect)
      return;
    interactionManager.pushState(_ModuleSupport36.InteractionState.ZoomDrag);
    const zoom = this.getZoom();
    switch (dragState) {
      case 1 /* Axis */:
        if (!hoveredAxis)
          break;
        const { id: axisId, direction } = hoveredAxis;
        const anchor = direction === _ModuleSupport36.ChartAxisDirection.X ? anchorPointX : anchorPointY;
        const axisZoom = zoomManager.getAxisZoom(axisId);
        const newZoom = axisDragger.update(event, direction, anchor, seriesRect, zoom, axisZoom);
        this.updateAxisZoom(direction, newZoom);
        break;
      case 2 /* Pan */:
        panner.update(event);
        break;
      case 3 /* Select */:
        selector.update(event, this.getModuleProperties(), paddedRect, zoom);
        break;
      case 0 /* None */:
        return;
    }
    tooltipManager.updateTooltip(TOOLTIP_ID);
    updateService.update(ChartUpdateType2.PERFORM_LAYOUT, { skipAnimations: true });
  }
  onDragEnd() {
    const {
      axisDragger,
      dragState,
      enabled,
      panner,
      selector,
      ctx: { cursorManager, interactionManager, tooltipManager }
    } = this;
    interactionManager.popState(_ModuleSupport36.InteractionState.ZoomDrag);
    if (!enabled || dragState === 0 /* None */)
      return;
    switch (dragState) {
      case 1 /* Axis */:
        axisDragger.stop();
        break;
      case 2 /* Pan */:
        panner.stop();
        break;
      case 3 /* Select */:
        if (!selector.didUpdate())
          break;
        const zoom = this.getZoom();
        if (this.isMinZoom(zoom))
          break;
        const newZoom = selector.stop(this.seriesRect, this.paddedRect, zoom);
        this.updateZoom(newZoom);
        break;
    }
    this.dragState = 0 /* None */;
    cursorManager.updateCursor(CURSOR_ID);
    tooltipManager.removeTooltip(TOOLTIP_ID);
  }
  onWheel(event) {
    const {
      enabled,
      enableAxisDragging,
      enablePanning,
      enableScrolling,
      hoveredAxis,
      paddedRect,
      scroller,
      scrollingStep,
      scrollPanner,
      seriesRect,
      ctx: { zoomManager }
    } = this;
    if (!enabled || !enableScrolling || !paddedRect || !seriesRect)
      return;
    const isSeriesScrolling = paddedRect.containsPoint(event.offsetX, event.offsetY);
    const isAxisScrolling = enableAxisDragging && hoveredAxis != null;
    let isScalingX = this.isScalingX();
    let isScalingY = this.isScalingY();
    if (isAxisScrolling) {
      isScalingX = hoveredAxis.direction === _ModuleSupport36.ChartAxisDirection.X;
      isScalingY = !isScalingX;
    }
    const sourceEvent = event.sourceEvent;
    const { deltaX, deltaY } = sourceEvent;
    const isHorizontalScrolling = deltaX != null && deltaY != null && Math.abs(deltaX) > Math.abs(deltaY);
    if (enablePanning && isHorizontalScrolling) {
      event.consume();
      event.sourceEvent.preventDefault();
      const newZooms = scrollPanner.update(event, scrollingStep, seriesRect, zoomManager.getAxisZooms());
      for (const { direction, zoom: newZoom2 } of Object.values(newZooms)) {
        this.updateAxisZoom(direction, newZoom2);
      }
      return;
    }
    if (!isSeriesScrolling && !isAxisScrolling)
      return;
    event.consume();
    event.sourceEvent.preventDefault();
    const newZoom = scroller.update(
      event,
      this.getModuleProperties({ isScalingX, isScalingY }),
      seriesRect,
      this.getZoom()
    );
    this.updateZoom(newZoom);
  }
  onAxisLeave() {
    const {
      enabled,
      ctx: { cursorManager }
    } = this;
    if (!enabled)
      return;
    this.hoveredAxis = void 0;
    cursorManager.updateCursor(CURSOR_ID);
  }
  onAxisHover(event) {
    const {
      enabled,
      enableAxisDragging,
      ctx: { cursorManager }
    } = this;
    if (!enabled)
      return;
    this.hoveredAxis = {
      id: event.axisId,
      direction: event.direction
    };
    if (enableAxisDragging) {
      cursorManager.updateCursor(CURSOR_ID, event.direction === ChartAxisDirection7.X ? "ew-resize" : "ns-resize");
    }
  }
  onPinchMove(event) {
    const { enabled, enableScrolling, paddedRect, seriesRect } = this;
    if (!enabled || !enableScrolling || !paddedRect || !seriesRect)
      return;
    const oldZoom = this.getZoom();
    const newZoom = this.getZoom();
    const delta3 = event.deltaDistance * -0.01;
    const origin = pointToRatio(seriesRect, event.origin.x, event.origin.y);
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
  onLayoutComplete(event) {
    const { enabled, rangeX, rangeY } = this;
    if (!enabled)
      return;
    const {
      series: { rect, paddedRect, shouldFlipXY },
      axes
    } = event;
    this.seriesRect = rect;
    this.paddedRect = paddedRect;
    this.contextMenu.rect = paddedRect;
    this.shouldFlipXY = shouldFlipXY;
    if (!axes)
      return;
    const [axesX, axesY] = _Util21.bifurcate((axis) => axis.direction === ChartAxisDirection7.X, axes);
    const rangeXAxisChanged = rangeX.updateAxis(axesX);
    const rangeYAxisChanged = rangeY.updateAxis(axesY);
    if (!rangeXAxisChanged && !rangeYAxisChanged)
      return;
    const newZoom = {};
    newZoom.x = rangeX.getRange();
    newZoom.y = rangeY.getRange();
    if (newZoom.x != null || newZoom.y != null) {
      this.updateZoom(constrainZoom(definedZoomState(newZoom)));
    }
  }
  onUpdateComplete({ minRect, minVisibleRect }) {
    const { enabled, minVisibleItemsX, minVisibleItemsY, paddedRect, shouldFlipXY } = this;
    if (!enabled || !paddedRect || !minRect || !minVisibleRect)
      return;
    const zoom = this.getZoom();
    const minVisibleItemsWidth = shouldFlipXY ? minVisibleItemsY : minVisibleItemsX;
    const minVisibleItemsHeight = shouldFlipXY ? minVisibleItemsX : minVisibleItemsY;
    const widthRatio = minVisibleRect.width * minVisibleItemsWidth / paddedRect.width;
    const heightRatio = minVisibleRect.height * minVisibleItemsHeight / paddedRect.height;
    const ratioX = round2(widthRatio * dx(zoom));
    const ratioY = round2(heightRatio * dy(zoom));
    if (this.isScalingX()) {
      this.minRatioX = Math.min(1, ratioX);
    }
    if (this.isScalingY()) {
      this.minRatioY = Math.min(1, ratioY);
    }
    this.minRatioX || (this.minRatioX = this.minRatioY || 0);
    this.minRatioY || (this.minRatioY = this.minRatioX || 0);
  }
  onZoomChange(event) {
    if (event.callerId !== "zoom") {
      this.panner.stopInteractions();
    }
    const zoom = this.getZoom();
    const props = this.getModuleProperties();
    this.contextMenu.toggleActions(zoom, props);
    this.toolbar.toggleButtons(zoom, props);
  }
  onZoomPanStart(event) {
    if (event.callerId === "zoom") {
      this.panner.stopInteractions();
    }
  }
  onPanUpdate(event) {
    const {
      panner,
      seriesRect,
      ctx: { tooltipManager, updateService, zoomManager }
    } = this;
    if (!seriesRect)
      return;
    const newZooms = panner.translateZooms(seriesRect, zoomManager.getAxisZooms(), event.deltaX, event.deltaY);
    for (const { direction: panDirection, zoom: panZoom } of Object.values(newZooms)) {
      this.updateAxisZoom(panDirection, panZoom);
    }
    tooltipManager.updateTooltip(TOOLTIP_ID);
    updateService.update(ChartUpdateType2.PERFORM_LAYOUT, { skipAnimations: true });
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
    return isZoomLess(zoom, this.minRatioX, this.minRatioY);
  }
  updateZoom(zoom) {
    const {
      minRatioX,
      minRatioY,
      ctx: { zoomManager }
    } = this;
    const dx_ = dx(zoom);
    const dy_ = dy(zoom);
    const oldZoom = this.getZoom();
    const zoomedInTooFarX = dx_ <= dx(oldZoom) && dx_ < minRatioX;
    const zoomedInTooFarY = dy_ <= dy(oldZoom) && dy_ < minRatioY;
    if (zoomedInTooFarX) {
      zoom.x = constrainAxisWithOld(zoom.x, oldZoom.x, minRatioX);
    }
    if (zoomedInTooFarY) {
      zoom.y = constrainAxisWithOld(zoom.y, oldZoom.y, minRatioY);
    }
    zoomManager.updateZoom("zoom", zoom);
  }
  updateAxisZoom(direction, partialZoom) {
    if (!partialZoom)
      return;
    const fullZoom = this.getZoom();
    fullZoom[direction] = partialZoom;
    this.updateZoom(fullZoom);
  }
  getZoom() {
    return definedZoomState(this.ctx.zoomManager.getZoom());
  }
  getResetZoom() {
    var _a2, _b, _c, _d;
    const x = (_b = (_a2 = this.rangeX.getInitialRange()) != null ? _a2 : this.ratioX.getInitialRatio()) != null ? _b : UNIT;
    const y = (_d = (_c = this.rangeY.getInitialRange()) != null ? _c : this.ratioY.getInitialRatio()) != null ? _d : UNIT;
    return { x, y };
  }
  getModuleProperties(overrides) {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i;
    return {
      anchorPointX: (_a2 = overrides == null ? void 0 : overrides.anchorPointX) != null ? _a2 : this.getAnchorPointX(),
      anchorPointY: (_b = overrides == null ? void 0 : overrides.anchorPointY) != null ? _b : this.getAnchorPointY(),
      enabled: (_c = overrides == null ? void 0 : overrides.enabled) != null ? _c : this.enabled,
      isScalingX: (_d = overrides == null ? void 0 : overrides.isScalingX) != null ? _d : this.isScalingX(),
      isScalingY: (_e = overrides == null ? void 0 : overrides.isScalingY) != null ? _e : this.isScalingY(),
      minRatioX: (_f = overrides == null ? void 0 : overrides.minRatioX) != null ? _f : this.minRatioX,
      minRatioY: (_g = overrides == null ? void 0 : overrides.minRatioY) != null ? _g : this.minRatioY,
      rangeX: (_h = overrides == null ? void 0 : overrides.rangeX) != null ? _h : this.rangeX,
      scrollingStep: (_i = overrides == null ? void 0 : overrides.scrollingStep) != null ? _i : this.scrollingStep
    };
  }
};
__decorateClass([
  ActionOnSet7({
    newValue(enabled) {
      this.onEnabledChange(enabled);
    }
  }),
  Validate25(BOOLEAN13)
], Zoom.prototype, "enabled", 2);
__decorateClass([
  Validate25(BOOLEAN13)
], Zoom.prototype, "enableAxisDragging", 2);
__decorateClass([
  Validate25(BOOLEAN13)
], Zoom.prototype, "enableDoubleClickToReset", 2);
__decorateClass([
  Validate25(BOOLEAN13)
], Zoom.prototype, "enablePanning", 2);
__decorateClass([
  Validate25(BOOLEAN13)
], Zoom.prototype, "enableScrolling", 2);
__decorateClass([
  Validate25(BOOLEAN13)
], Zoom.prototype, "enableSelecting", 2);
__decorateClass([
  Validate25(UNION5(["alt", "ctrl", "meta", "shift"], "a pan key"))
], Zoom.prototype, "panKey", 2);
__decorateClass([
  Validate25(UNION5(["x", "y", "xy"], "an axis"))
], Zoom.prototype, "axes", 2);
__decorateClass([
  Validate25(RATIO10)
], Zoom.prototype, "scrollingStep", 2);
__decorateClass([
  Validate25(NUMBER8.restrict({ min: 1 }))
], Zoom.prototype, "minVisibleItemsX", 2);
__decorateClass([
  Validate25(NUMBER8.restrict({ min: 1 }))
], Zoom.prototype, "minVisibleItemsY", 2);
__decorateClass([
  Validate25(ANCHOR_POINT)
], Zoom.prototype, "anchorPointX", 2);
__decorateClass([
  Validate25(ANCHOR_POINT)
], Zoom.prototype, "anchorPointY", 2);
__decorateClass([
  ProxyProperty2("panner.deceleration"),
  Validate25(NUMBER8.restrict({ min: 1e-4, max: 1 }))
], Zoom.prototype, "deceleration", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomModule.ts
var ZoomModule = {
  type: "root",
  optionsKey: "zoom",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  dependencies: ["toolbar"],
  instanceConstructor: Zoom,
  themeTemplate: {
    zoom: {
      anchorPointX: "end",
      anchorPointY: "middle",
      axes: "x",
      buttons: {
        enabled: true,
        buttons: [
          {
            icon: "zoom-out",
            tooltip: "Zoom out",
            value: "zoom-out"
          },
          {
            icon: "zoom-in",
            tooltip: "Zoom in",
            value: "zoom-in"
          },
          {
            icon: "pan-left",
            tooltip: "Pan left",
            value: "pan-left"
          },
          {
            icon: "pan-right",
            tooltip: "Pan right",
            value: "pan-right"
          },
          {
            icon: "reset",
            tooltip: "Reset the zoom",
            value: "reset"
          }
        ]
      },
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
import { _Theme as _Theme9 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/gradient-legend/gradientLegend.ts
import {
  _ModuleSupport as _ModuleSupport37,
  _Scale as _Scale8,
  _Scene as _Scene21,
  _Util as _Util22
} from "ag-charts-community";
var {
  BOOLEAN: BOOLEAN14,
  Layers: Layers5,
  POSITION,
  Validate: Validate26,
  Default: Default5,
  MIN_SPACING: MIN_SPACING4,
  MAX_SPACING: MAX_SPACING3,
  POSITIVE_NUMBER: POSITIVE_NUMBER9,
  ProxyProperty: ProxyProperty3,
  DeprecatedAndRenamedTo
} = _ModuleSupport37;
var { BBox: BBox5, Group: Group5, Rect, LinearGradientFill, Triangle } = _Scene21;
var { createId: createId3 } = _Util22;
var GradientBar = class {
  constructor() {
    this.thickness = 16;
    this.preferredLength = 100;
  }
};
__decorateClass([
  Validate26(POSITIVE_NUMBER9)
], GradientBar.prototype, "thickness", 2);
__decorateClass([
  Validate26(POSITIVE_NUMBER9)
], GradientBar.prototype, "preferredLength", 2);
var GradientLegendAxisTick = class extends _ModuleSupport37.AxisTick {
  constructor() {
    super(...arguments);
    this.enabled = false;
    this.size = 0;
    this.minSpacing = NaN;
    this.maxSpacing = NaN;
  }
};
__decorateClass([
  Validate26(MIN_SPACING4),
  Default5(NaN)
], GradientLegendAxisTick.prototype, "minSpacing", 2);
__decorateClass([
  Validate26(MAX_SPACING3),
  Default5(NaN)
], GradientLegendAxisTick.prototype, "maxSpacing", 2);
var GradientLegendAxis = class extends _ModuleSupport37.CartesianAxis {
  constructor(ctx) {
    super(ctx, new _Scale8.LinearScale(), { respondsToZoom: false });
    this.colorDomain = [];
    this.nice = false;
    this.line.enabled = false;
  }
  calculateDomain() {
    this.setDomain(this.colorDomain);
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
  ProxyProperty3("label.fontStyle")
], GradientLegendLabel.prototype, "fontStyle", 2);
__decorateClass([
  ProxyProperty3("label.fontWeight")
], GradientLegendLabel.prototype, "fontWeight", 2);
__decorateClass([
  ProxyProperty3("label.fontSize")
], GradientLegendLabel.prototype, "fontSize", 2);
__decorateClass([
  ProxyProperty3("label.fontFamily")
], GradientLegendLabel.prototype, "fontFamily", 2);
__decorateClass([
  ProxyProperty3("label.color")
], GradientLegendLabel.prototype, "color", 2);
__decorateClass([
  ProxyProperty3("label.format")
], GradientLegendLabel.prototype, "format", 2);
__decorateClass([
  ProxyProperty3("label.formatter")
], GradientLegendLabel.prototype, "formatter", 2);
var GradientLegendInterval = class {
  constructor(tick) {
    this.tick = tick;
  }
};
__decorateClass([
  ProxyProperty3("tick.values")
], GradientLegendInterval.prototype, "values", 2);
__decorateClass([
  ProxyProperty3("tick.minSpacing")
], GradientLegendInterval.prototype, "minSpacing", 2);
__decorateClass([
  ProxyProperty3("tick.maxSpacing")
], GradientLegendInterval.prototype, "maxSpacing", 2);
__decorateClass([
  ProxyProperty3("tick.interval")
], GradientLegendInterval.prototype, "step", 2);
var GradientLegendScale = class {
  constructor(axis) {
    this.axis = axis;
    this.label = new GradientLegendLabel(axis.label);
    this.interval = new GradientLegendInterval(axis.tick);
  }
};
__decorateClass([
  ProxyProperty3("axis.seriesAreaPadding")
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
  Validate26(BOOLEAN14)
], GradientLegend.prototype, "enabled", 2);
__decorateClass([
  Validate26(POSITION)
], GradientLegend.prototype, "position", 2);
__decorateClass([
  Validate26(BOOLEAN14, { optional: true })
], GradientLegend.prototype, "reverseOrder", 2);
__decorateClass([
  Validate26(POSITIVE_NUMBER9)
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
        color: _Theme9.DEFAULT_LABEL_COLOUR,
        fontStyle: void 0,
        fontWeight: void 0,
        fontSize: 12,
        fontFamily: _Theme9.DEFAULT_FONT_FAMILY,
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
_LicenseManager.RELEASE_INFORMATION = "MTcyMTExNTk3ODAyNA==";
var LicenseManager = _LicenseManager;

// packages/ag-charts-enterprise/src/license/watermark.ts
import { _ModuleSupport as _ModuleSupport38 } from "ag-charts-community";
var { createElement: createElement4, injectStyle: injectStyle3 } = _ModuleSupport38;
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
import { _Theme as _Theme11, _Util as _Util25 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeries.ts
import { _ModuleSupport as _ModuleSupport41, _Scale as _Scale9, _Scene as _Scene23, _Util as _Util24 } from "ag-charts-community";

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
import { _Scene as _Scene22, _Util as _Util23 } from "ag-charts-community";
var { Group: Group6, Rect: Rect2, Line: Line3, BBox: BBox6, Selection: Selection2 } = _Scene22;
var { Logger: Logger3 } = _Util23;
var BoxPlotGroup = class extends Group6 {
  constructor() {
    super();
    this.append([
      new Rect2({ tag: 0 /* Box */ }),
      new Rect2({ tag: 0 /* Box */ }),
      new Rect2({ tag: 2 /* Outline */ }),
      new Rect2({ tag: 1 /* Median */ }),
      new Line3({ tag: 3 /* Whisker */ }),
      new Line3({ tag: 3 /* Whisker */ }),
      new Line3({ tag: 4 /* Cap */ }),
      new Line3({ tag: 4 /* Cap */ })
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
    const position = (x, y, width, height) => isVertical ? { y: x, x: y, width: height, height: width } : { x, y, width, height };
    const hPosition = (x1, x2, y) => isVertical ? { y1: x1, y2: x2, x: y } : { x1, x2, y };
    const vPosition = (x, y1, y2) => isVertical ? { x1: y1, x2: y2, y: x } : { x, y1, y2 };
    const bbox = (x, y, width, height) => {
      ({ x, y, width, height } = position(x, y, width, height));
      return new BBox6(x, y, width, height);
    };
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
    const boxesPosition = position(q1Value, axisValue, q3Value - q1Value, bandwidth);
    outline.setProperties(boxesPosition);
    boxes[0].setProperties(boxesPosition);
    boxes[0].setProperties({
      cornerRadius,
      clipBBox: bbox(q1Value, axisValue, Math.round(medianValue - q1Value + strokeWidth / 2), bandwidth)
    });
    boxes[1].setProperties(boxesPosition);
    boxes[1].setProperties({
      cornerRadius,
      clipBBox: bbox(
        Math.round(medianValue - strokeWidth / 2),
        axisValue,
        Math.floor(q3Value - medianValue + strokeWidth / 2),
        bandwidth
      )
    });
    const medianStart = Math.max(Math.round(medianValue - strokeWidth / 2), q1Value + strokeWidth);
    const medianEnd = Math.min(Math.round(medianValue + strokeWidth / 2), q3Value - strokeWidth);
    median.setProperties(boxesPosition);
    median.setProperties({
      visible: medianStart < medianEnd,
      cornerRadius,
      clipBBox: bbox(
        medianStart,
        axisValue + strokeWidth,
        medianEnd - medianStart,
        Math.max(0, bandwidth - strokeWidth * 2)
      )
    });
    const capStart = Math.floor(axisValue + bandwidth * (1 - cap.lengthRatio) / 2);
    const capEnd = Math.ceil(axisValue + bandwidth * (1 + cap.lengthRatio) / 2);
    caps[0].setProperties(vPosition(minValue, capStart, capEnd));
    caps[1].setProperties(vPosition(maxValue, capStart, capEnd));
    whiskers[0].setProperties(
      hPosition(
        Math.round(minValue + whiskerStyles.strokeWidth / 2),
        q1Value,
        Math.floor(axisValue + bandwidth / 2)
      )
    );
    whiskers[1].setProperties(
      hPosition(
        q3Value,
        Math.round(maxValue - whiskerStyles.strokeWidth / 2),
        Math.floor(axisValue + bandwidth / 2)
      )
    );
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
  distanceSquared(x, y) {
    const nodes = Selection2.selectByClass(this, Rect2, Line3);
    return _Scene22.nearestSquared(x, y, nodes).distanceSquared;
  }
  get midPoint() {
    const datum = this.datum;
    if (datum.midPoint === void 0) {
      Logger3.error("BoxPlotGroup.datum.midPoint is undefined");
      return { x: NaN, y: NaN };
    }
    return datum.midPoint;
  }
};

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport40 } from "ag-charts-community";
var {
  BaseProperties: BaseProperties6,
  AbstractBarSeriesProperties,
  SeriesTooltip,
  Validate: Validate27,
  COLOR_STRING: COLOR_STRING6,
  FUNCTION: FUNCTION4,
  LINE_DASH: LINE_DASH5,
  OBJECT: OBJECT5,
  POSITIVE_NUMBER: POSITIVE_NUMBER10,
  RATIO: RATIO11,
  STRING: STRING7,
  mergeDefaults: mergeDefaults3
} = _ModuleSupport40;
var BoxPlotSeriesCap = class extends BaseProperties6 {
  constructor() {
    super(...arguments);
    this.lengthRatio = 0.5;
  }
};
__decorateClass([
  Validate27(RATIO11)
], BoxPlotSeriesCap.prototype, "lengthRatio", 2);
var BoxPlotSeriesWhisker = class extends BaseProperties6 {
};
__decorateClass([
  Validate27(COLOR_STRING6, { optional: true })
], BoxPlotSeriesWhisker.prototype, "stroke", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
], BoxPlotSeriesWhisker.prototype, "strokeWidth", 2);
__decorateClass([
  Validate27(RATIO11)
], BoxPlotSeriesWhisker.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate27(LINE_DASH5, { optional: true })
], BoxPlotSeriesWhisker.prototype, "lineDash", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
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
  Validate27(STRING7)
], BoxPlotSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate27(STRING7)
], BoxPlotSeriesProperties.prototype, "minKey", 2);
__decorateClass([
  Validate27(STRING7)
], BoxPlotSeriesProperties.prototype, "q1Key", 2);
__decorateClass([
  Validate27(STRING7)
], BoxPlotSeriesProperties.prototype, "medianKey", 2);
__decorateClass([
  Validate27(STRING7)
], BoxPlotSeriesProperties.prototype, "q3Key", 2);
__decorateClass([
  Validate27(STRING7)
], BoxPlotSeriesProperties.prototype, "maxKey", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], BoxPlotSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], BoxPlotSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], BoxPlotSeriesProperties.prototype, "minName", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], BoxPlotSeriesProperties.prototype, "q1Name", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], BoxPlotSeriesProperties.prototype, "medianName", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], BoxPlotSeriesProperties.prototype, "q3Name", 2);
__decorateClass([
  Validate27(STRING7, { optional: true })
], BoxPlotSeriesProperties.prototype, "maxName", 2);
__decorateClass([
  Validate27(COLOR_STRING6, { optional: true })
], BoxPlotSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate27(RATIO11)
], BoxPlotSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate27(COLOR_STRING6)
], BoxPlotSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
], BoxPlotSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate27(RATIO11)
], BoxPlotSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate27(LINE_DASH5)
], BoxPlotSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
], BoxPlotSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER10)
], BoxPlotSeriesProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate27(FUNCTION4, { optional: true })
], BoxPlotSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate27(OBJECT5)
], BoxPlotSeriesProperties.prototype, "cap", 2);
__decorateClass([
  Validate27(OBJECT5)
], BoxPlotSeriesProperties.prototype, "whisker", 2);
__decorateClass([
  Validate27(OBJECT5)
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
  convertValuesToScaleByDefs,
  isFiniteNumber: isFiniteNumber3,
  computeBarFocusBounds
} = _ModuleSupport41;
var { motion } = _Scene23;
var { ContinuousScale } = _Scale9;
var BoxPlotSeriesNodeEvent = class extends _ModuleSupport41.SeriesNodeEvent {
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
var BoxPlotSeries = class extends _ModuleSupport41.AbstractBarSeries {
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
      var _a2, _b, _c;
      if (!this.properties.isValid() || !this.visible)
        return;
      const { xKey, minKey, q1Key, medianKey, q3Key, maxKey } = this.properties;
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const yScale = (_b = this.getValueAxis()) == null ? void 0 : _b.scale;
      const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
      const extraProps = [];
      if (animationEnabled && this.processedData) {
        extraProps.push(diff(this.processedData));
      }
      if (animationEnabled) {
        extraProps.push(animationValidation());
      }
      const { processedData } = yield this.requestDataModel(dataController, this.data, {
        props: [
          keyProperty(xKey, xScaleType, { id: `xValue` }),
          valueProperty2(minKey, yScaleType, { id: `minValue` }),
          valueProperty2(q1Key, yScaleType, { id: `q1Value` }),
          valueProperty2(medianKey, yScaleType, { id: `medianValue` }),
          valueProperty2(q3Key, yScaleType, { id: `q3Value` }),
          valueProperty2(maxKey, yScaleType, { id: `maxValue` }),
          ...isContinuousX ? [SMALLEST_KEY_INTERVAL] : [],
          ...extraProps
        ]
      });
      this.smallestDataInterval = (_c = processedData.reduced) == null ? void 0 : _c.smallestKeyInterval;
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
    const { index, def } = dataModel.resolveProcessedDataDefById(this, `xValue`);
    const keys = processedData.domain.keys[index];
    if (def.type === "key" && def.valueType === "category") {
      return keys;
    }
    const categoryAxis = this.getCategoryAxis();
    const keysExtent = (_a2 = extent(keys)) != null ? _a2 : [NaN, NaN];
    const scalePadding = isFiniteNumber3(smallestDataInterval) ? smallestDataInterval * 0.5 : 0;
    const d0 = keysExtent[0] + -scalePadding;
    const d1 = keysExtent[1] + scalePadding;
    return fixNumericExtent2([d0, d1], categoryAxis);
  }
  createNodeData() {
    return __async(this, null, function* () {
      const { visible, dataModel } = this;
      const xAxis = this.getCategoryAxis();
      const yAxis = this.getValueAxis();
      if (!(dataModel && xAxis && yAxis)) {
        return;
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
      const barOffset = ContinuousScale.is(xAxis.scale) ? barWidth * -0.5 : 0;
      const { groupScale, processedData } = this;
      const isVertical = this.isVertical();
      const context = {
        itemId: xKey,
        nodeData,
        labelData: [],
        scales: this.calculateScaling(),
        visible: this.visible
      };
      if (!visible)
        return context;
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
        scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex))) + barOffset;
        const bandwidth = Math.round(barWidth);
        const height = Math.abs(scaledValues.q3Value - scaledValues.q1Value);
        const midX = scaledValues.xValue + bandwidth / 2;
        const midY = Math.min(scaledValues.q3Value, scaledValues.q1Value) + height / 2;
        const midPoint = {
          x: isVertical ? midX : midY,
          y: isVertical ? midY : midX
        };
        const focusRectWidth = isVertical ? bandwidth : height;
        const focusRectHeight = isVertical ? height : bandwidth;
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
          midPoint,
          focusRect: {
            x: midPoint.x - focusRectWidth / 2,
            y: midPoint.y - focusRectHeight / 2,
            width: focusRectWidth,
            height: focusRectHeight
          }
        });
      });
      return context;
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
      tooltip,
      fill
    } = this.properties;
    const { datum, itemId } = nodeDatum;
    const xAxis = this.getCategoryAxis();
    const yAxis = this.getValueAxis();
    if (!xAxis || !yAxis || !this.properties.isValid())
      return _ModuleSupport41.EMPTY_TOOLTIP_CONTENT;
    const title = _Util24.sanitizeHtml(yName);
    const contentData = [
      [xKey, xName, xAxis],
      [minKey, minName, yAxis],
      [q1Key, q1Name, yAxis],
      [medianKey, medianName, yAxis],
      [q3Key, q3Name, yAxis],
      [maxKey, maxName, yAxis]
    ];
    const content = contentData.map(([key, name, axis]) => _Util24.sanitizeHtml(`${name != null ? name : key}: ${axis.formatDatum(datum[key])}`)).join(title ? "<br/>" : ", ");
    const { fill: formatFill } = this.getFormattedStyles(nodeDatum);
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: fill },
      {
        seriesId: this.id,
        itemId,
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
        maxName,
        yName,
        title,
        color: fill != null ? fill : formatFill
      }
    );
  }
  animateEmptyUpdateReady({
    datumSelection
  }) {
    const isVertical = this.isVertical();
    const { from, to } = prepareBoxPlotFromTo(isVertical);
    motion.resetMotion([datumSelection], resetBoxPlotSelectionsScalingCenterFn(isVertical));
    motion.staticFromToMotion(this.id, "datums", this.ctx.animationManager, [datumSelection], from, to, {
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
  computeFocusBounds({ datumIndex, seriesRect }) {
    var _a2;
    return computeBarFocusBounds(
      (_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData[datumIndex].focusRect,
      this.contentGroup,
      seriesRect
    );
  }
};
BoxPlotSeries.className = "BoxPlotSeries";
BoxPlotSeries.type = "box-plot";

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotThemes.ts
import { _Theme as _Theme10 } from "ag-charts-community";
var BOX_PLOT_SERIES_THEME = {
  series: {
    __extends__: _Theme10.EXTENDS_SERIES_DEFAULTS,
    direction: "vertical",
    strokeWidth: 2
  },
  axes: {
    [_Theme10.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        snap: false
      }
    },
    [_Theme10.CARTESIAN_AXIS_TYPE.CATEGORY]: {
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
      type: _Theme11.CARTESIAN_AXIS_TYPE.NUMBER,
      position: _Theme11.POSITION.LEFT
    },
    {
      type: _Theme11.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: _Theme11.POSITION.BOTTOM
    }
  ],
  themeTemplate: BOX_PLOT_SERIES_THEME,
  groupable: true,
  paletteFactory: ({ takeColors, userPalette, themeTemplateParameters }) => {
    var _a2;
    const themeBackgroundColor = themeTemplateParameters.properties.get(_Theme11.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (_a2 = Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) != null ? _a2 : "white";
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      fill: userPalette ? fill : _Util25.Color.interpolate(fill, backgroundFill)(0.7),
      stroke
    };
  },
  swapDefaultAxesCondition: ({ direction }) => direction === "horizontal"
};

// packages/ag-charts-enterprise/src/series/bullet/bulletModule.ts
import { _Theme as _Theme13 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/bullet/bulletSeries.ts
import { _ModuleSupport as _ModuleSupport43, _Scene as _Scene24, _Util as _Util26 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/bullet/bulletSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport42 } from "ag-charts-community";
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties2,
  BaseProperties: BaseProperties7,
  PropertiesArray: PropertiesArray2,
  SeriesTooltip: SeriesTooltip2,
  Validate: Validate28,
  ARRAY: ARRAY3,
  COLOR_STRING: COLOR_STRING7,
  LINE_DASH: LINE_DASH6,
  OBJECT: OBJECT6,
  POSITIVE_NUMBER: POSITIVE_NUMBER11,
  RATIO: RATIO12,
  STRING: STRING8
} = _ModuleSupport42;
var TargetStyle = class extends BaseProperties7 {
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
  Validate28(COLOR_STRING7)
], TargetStyle.prototype, "fill", 2);
__decorateClass([
  Validate28(RATIO12)
], TargetStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate28(COLOR_STRING7)
], TargetStyle.prototype, "stroke", 2);
__decorateClass([
  Validate28(POSITIVE_NUMBER11)
], TargetStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate28(RATIO12)
], TargetStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate28(LINE_DASH6)
], TargetStyle.prototype, "lineDash", 2);
__decorateClass([
  Validate28(POSITIVE_NUMBER11)
], TargetStyle.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate28(RATIO12)
], TargetStyle.prototype, "lengthRatio", 2);
var BulletScale = class extends BaseProperties7 {
};
__decorateClass([
  Validate28(POSITIVE_NUMBER11, { optional: true })
], BulletScale.prototype, "max", 2);
var BulletColorRange = class extends BaseProperties7 {
  constructor() {
    super(...arguments);
    this.color = "lightgrey";
  }
};
__decorateClass([
  Validate28(COLOR_STRING7)
], BulletColorRange.prototype, "color", 2);
__decorateClass([
  Validate28(POSITIVE_NUMBER11, { optional: true })
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
    this.colorRanges = new PropertiesArray2(BulletColorRange);
    this.target = new TargetStyle();
    this.scale = new BulletScale();
    this.tooltip = new SeriesTooltip2();
    // Internal: Set by paletteFactory.
    this.backgroundFill = "white";
  }
};
__decorateClass([
  Validate28(STRING8)
], BulletSeriesProperties.prototype, "valueKey", 2);
__decorateClass([
  Validate28(STRING8, { optional: true })
], BulletSeriesProperties.prototype, "valueName", 2);
__decorateClass([
  Validate28(STRING8, { optional: true })
], BulletSeriesProperties.prototype, "targetKey", 2);
__decorateClass([
  Validate28(STRING8, { optional: true })
], BulletSeriesProperties.prototype, "targetName", 2);
__decorateClass([
  Validate28(COLOR_STRING7)
], BulletSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate28(RATIO12)
], BulletSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate28(COLOR_STRING7)
], BulletSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate28(POSITIVE_NUMBER11)
], BulletSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate28(RATIO12)
], BulletSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate28(LINE_DASH6)
], BulletSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate28(POSITIVE_NUMBER11)
], BulletSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate28(RATIO12)
], BulletSeriesProperties.prototype, "widthRatio", 2);
__decorateClass([
  Validate28(ARRAY3.restrict({ minLength: 0 }))
], BulletSeriesProperties.prototype, "colorRanges", 2);
__decorateClass([
  Validate28(OBJECT6)
], BulletSeriesProperties.prototype, "target", 2);
__decorateClass([
  Validate28(OBJECT6)
], BulletSeriesProperties.prototype, "scale", 2);
__decorateClass([
  Validate28(OBJECT6)
], BulletSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate28(COLOR_STRING7)
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
  createDatumId,
  computeBarFocusBounds: computeBarFocusBounds2
} = _ModuleSupport43;
var { fromToMotion } = _Scene24.motion;
var { sanitizeHtml } = _Util26;
var STYLING_KEYS = [
  "fill",
  "fillOpacity",
  "stroke",
  "strokeWidth",
  "strokeOpacity",
  "lineDash",
  "lineDashOffset"
];
var BulletSeries = class _BulletSeries extends _ModuleSupport43.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      directionKeys: { y: ["targetKey", "valueKey"] },
      directionNames: { y: ["targetName", "valueName"] },
      pickModes: [_ModuleSupport43.SeriesNodePickMode.EXACT_SHAPE_MATCH],
      hasHighlightedLabels: true,
      animationResetFns: {
        datum: resetBarSelectionsFn
      }
    });
    this.properties = new BulletSeriesProperties();
    this.normalizedColorRanges = [];
    this.colorRangesGroup = new _Scene24.Group({ name: `${this.id}-colorRanges` });
    this.colorRangesSelection = _Scene24.Selection.select(this.colorRangesGroup, _Scene24.Rect, false);
    this.rootGroup.append(this.colorRangesGroup);
    this.targetLinesSelection = _Scene24.Selection.select(this.annotationGroup, _Scene24.Line, false);
  }
  destroy() {
    this.rootGroup.removeChild(this.colorRangesGroup);
    super.destroy();
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b;
      if (!this.properties.isValid() || !this.data || !this.visible)
        return;
      const { valueKey, targetKey } = this.properties;
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const yScale = (_b = this.getValueAxis()) == null ? void 0 : _b.scale;
      const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
      const extraProps = [];
      if (targetKey !== void 0) {
        extraProps.push(valueProperty3(targetKey, yScaleType, { id: "target" }));
      }
      if (!this.ctx.animationManager.isSkipped()) {
        if (this.processedData !== void 0) {
          extraProps.push(diff2(this.processedData));
        }
        extraProps.push(animationValidation2());
      }
      yield this.requestDataModel(dataController, this.data.slice(0, 1), {
        props: [
          keyProperty2(valueKey, xScaleType, { id: "xValue" }),
          valueProperty3(valueKey, yScaleType, { id: "value" }),
          ...extraProps
        ],
        groupByKeys: true
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
        return;
      if (widthRatio === void 0 || lengthRatio === void 0)
        return;
      const multiplier = (_c = xScale.bandwidth) != null ? _c : NaN;
      const maxValue = this.getMaxValue();
      const valueIndex = dataModel.resolveProcessedDataIndexById(this, "value");
      const targetIndex = targetKey === void 0 ? NaN : dataModel.resolveProcessedDataIndexById(this, "target");
      const context = {
        itemId: valueKey,
        nodeData: [],
        labelData: [],
        scales: this.calculateScaling(),
        visible: this.visible
      };
      if (!this.visible)
        return context;
      for (const { datum, values } of processedData.data) {
        if (!Array.isArray(datum) || datum.length < 1) {
          continue;
        }
        if (values[0][valueIndex] < 0) {
          _Util26.Logger.warnOnce("negative values are not supported, clipping to 0.");
        }
        const xValue = (_d = this.properties.valueName) != null ? _d : this.properties.valueKey;
        const yValue = Math.min(maxValue, Math.max(0, values[0][valueIndex]));
        const y = yScale.convert(yValue);
        const barWidth = widthRatio * multiplier;
        const bottomY = yScale.convert(0);
        const barAlongX = this.getBarDirection() === _ModuleSupport43.ChartAxisDirection.X;
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
          _Util26.Logger.warnOnce("negative targets are not supported, ignoring.");
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
      return context;
    });
  }
  getColorRanges() {
    const { colorRanges, fill, backgroundFill } = this.properties;
    if (colorRanges !== void 0 && colorRanges.length > 0) {
      return colorRanges;
    }
    const defaultColorRange = new BulletColorRange();
    defaultColorRange.color = _Util26.Color.interpolate(fill, backgroundFill)(0.7);
    return [defaultColorRange];
  }
  getLegendData(_legendType) {
    return [];
  }
  getTooltipHtml(nodeDatum) {
    const { valueKey, valueName, targetKey, targetName } = this.properties;
    const axis = this.getValueAxis();
    const { yValue: valueValue, target: { value: targetValue } = { value: void 0 }, datum, itemId } = nodeDatum;
    if (valueKey === void 0 || valueValue === void 0 || axis === void 0) {
      return _ModuleSupport43.EMPTY_TOOLTIP_CONTENT;
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
      { datum, itemId, title, seriesId: this.id, valueKey, valueName, targetKey, targetName, color: void 0 }
    );
  }
  isLabelEnabled() {
    return false;
  }
  nodeFactory() {
    return new _Scene24.Rect();
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
      const computeRect = this.getBarDirection() === _ModuleSupport43.ChartAxisDirection.Y ? (rect, colorRange) => {
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
    const { datumSelection, annotationSelections } = data;
    const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, "normal"));
    fromToMotion(this.id, "nodes", this.ctx.animationManager, [datumSelection], fns);
    seriesLabelFadeInAnimation(this, "annotations", this.ctx.animationManager, ...annotationSelections);
  }
  animateWaitingUpdateReady(data) {
    var _a2, _b, _c;
    const { datumSelection, annotationSelections } = data;
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    const dataDiff = (_b = (_a2 = this.processedData) == null ? void 0 : _a2.reduced) == null ? void 0 : _b.diff;
    const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, "normal"));
    fromToMotion(
      this.id,
      "nodes",
      this.ctx.animationManager,
      [datumSelection],
      fns,
      (_, datum) => createDatumId(datum.xValue),
      dataDiff
    );
    const hasMotion = (_c = dataDiff == null ? void 0 : dataDiff.changed) != null ? _c : true;
    if (hasMotion) {
      seriesLabelFadeInAnimation(this, "annotations", this.ctx.animationManager, ...annotationSelections);
    }
  }
  computeFocusBounds({ datumIndex, seriesRect }) {
    var _a2;
    return computeBarFocusBounds2((_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData[datumIndex], this.contentGroup, seriesRect);
  }
};

// packages/ag-charts-enterprise/src/series/bullet/bulletThemes.ts
import { _Theme as _Theme12 } from "ag-charts-community";
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
    [_Theme12.CARTESIAN_AXIS_TYPE.NUMBER]: {
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
      type: _Theme13.CARTESIAN_AXIS_TYPE.NUMBER,
      position: _Theme13.POSITION.LEFT
    },
    {
      type: _Theme13.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: _Theme13.POSITION.BOTTOM
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
    const themeBackgroundColor = themeTemplateParameters.properties.get(_Theme13.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (_a2 = Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) != null ? _a2 : "white";
    const targetStroke = properties.get(_Theme13.DEFAULT_CROSS_LINES_COLOUR);
    return {
      fill,
      stroke,
      target: { stroke: targetStroke },
      backgroundFill
    };
  }
};

// packages/ag-charts-enterprise/src/series/candlestick/candlestickModule.ts
import { _Theme as _Theme15 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeries.ts
import {
  _ModuleSupport as _ModuleSupport49
} from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/candlestick/candlestickGroup.ts
import { _Scene as _Scene25, _Util as _Util27 } from "ag-charts-community";
var { SceneChangeDetection, BBox: BBox7, RedrawType } = _Scene25;
var CandlestickBaseGroup = class extends _Scene25.Group {
  constructor() {
    super(...arguments);
    this.x = 0;
    this.y = 0;
    this.yBottom = 0;
    this.yHigh = 0;
    this.yLow = 0;
    this.width = 0;
    this.height = 0;
  }
  distanceSquared(x, y) {
    const nodes = _Scene25.Selection.selectByClass(this, _Scene25.Rect, _Scene25.Line);
    return _Scene25.nearestSquared(x, y, nodes).distanceSquared;
  }
  get midPoint() {
    const datum = this.datum;
    if (datum.midPoint === void 0) {
      _Util27.Logger.error("CandlestickBaseGroup.datum.midPoint is undefined");
      return { x: NaN, y: NaN };
    }
    return datum.midPoint;
  }
  render(renderCtx) {
    this.updateCoordinates();
    super.render(renderCtx);
  }
};
__decorateClass([
  SceneChangeDetection({ redraw: RedrawType.MAJOR })
], CandlestickBaseGroup.prototype, "x", 2);
__decorateClass([
  SceneChangeDetection({ redraw: RedrawType.MAJOR })
], CandlestickBaseGroup.prototype, "y", 2);
__decorateClass([
  SceneChangeDetection({ redraw: RedrawType.MAJOR })
], CandlestickBaseGroup.prototype, "yBottom", 2);
__decorateClass([
  SceneChangeDetection({ redraw: RedrawType.MAJOR })
], CandlestickBaseGroup.prototype, "yHigh", 2);
__decorateClass([
  SceneChangeDetection({ redraw: RedrawType.MAJOR })
], CandlestickBaseGroup.prototype, "yLow", 2);
__decorateClass([
  SceneChangeDetection({ redraw: RedrawType.MAJOR })
], CandlestickBaseGroup.prototype, "width", 2);
__decorateClass([
  SceneChangeDetection({ redraw: RedrawType.MAJOR })
], CandlestickBaseGroup.prototype, "height", 2);
var CandlestickGroup = class extends CandlestickBaseGroup {
  constructor() {
    super();
    this.append([
      new _Scene25.Rect({ tag: 0 /* Body */ }),
      new _Scene25.Line({ tag: 1 /* LowWick */ }),
      new _Scene25.Line({ tag: 2 /* HighWick */ })
    ]);
  }
  updateCoordinates() {
    const { x, y, yBottom, yHigh, yLow, width, height } = this;
    const selection = _Scene25.Selection.select(this, _Scene25.Rect);
    const [body] = selection.selectByTag(0 /* Body */);
    const [lowWick] = selection.selectByTag(1 /* LowWick */);
    const [highWick] = selection.selectByTag(2 /* HighWick */);
    if (width === 0 || height === 0) {
      body.visible = false;
      lowWick.visible = false;
      highWick.visible = false;
      return;
    }
    body.visible = true;
    lowWick.visible = true;
    highWick.visible = true;
    body.setProperties({
      x,
      y,
      width,
      height,
      crisp: true,
      clipBBox: new BBox7(x, y, width, height)
    });
    const halfWidth = width / 2;
    lowWick.setProperties({
      y1: Math.round(yLow + lowWick.strokeWidth / 2),
      y2: yBottom,
      x: x + halfWidth
    });
    highWick.setProperties({
      y1: Math.round(yHigh + highWick.strokeWidth / 2),
      y2: y,
      x: x + halfWidth
    });
  }
  updateDatumStyles(datum, activeStyles) {
    var _a2;
    const { bandwidth } = datum;
    const {
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      wick: wickStyles = {},
      cornerRadius
    } = activeStyles;
    (_a2 = wickStyles.strokeWidth) != null ? _a2 : wickStyles.strokeWidth = 1;
    const selection = _Scene25.Selection.select(this, _Scene25.Rect);
    const [body] = selection.selectByTag(0 /* Body */);
    const [lowWick] = selection.selectByTag(1 /* LowWick */);
    const [highWick] = selection.selectByTag(2 /* HighWick */);
    if (wickStyles.strokeWidth > bandwidth) {
      wickStyles.strokeWidth = bandwidth;
    }
    body.setProperties({
      fill,
      fillOpacity,
      strokeWidth,
      strokeOpacity,
      stroke,
      lineDash,
      lineDashOffset,
      cornerRadius
    });
    lowWick.setProperties(wickStyles);
    highWick.setProperties(wickStyles);
  }
};

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeriesBase.ts
import {
  _ModuleSupport as _ModuleSupport47,
  _Scale as _Scale11,
  _Scene as _Scene26,
  _Util as _Util28
} from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/candlestick/candlestickUtil.ts
import { _ModuleSupport as _ModuleSupport46 } from "ag-charts-community";
var { computeBarFocusBounds: computeBarFocusBounds3, NODE_UPDATE_STATE_TO_PHASE_MAPPING } = _ModuleSupport46;
function resetCandlestickSelectionsFn(_node, datum) {
  return getCoordinates(datum);
}
function prepareCandlestickAnimationFunctions(initial) {
  const fromFn = (candlestickGroup, datum, status) => {
    const phase = initial ? "initial" : NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
    if (status === "unknown" || status === "added" && datum != null) {
      const { x, y, yLow, yHigh, width, height } = getCoordinates(datum);
      let collapsedY = datum.itemId === "up" ? yLow : yHigh;
      if (status === "unknown") {
        collapsedY = y + height / 2;
      }
      return {
        x,
        y: collapsedY,
        yBottom: collapsedY,
        yHigh: collapsedY,
        yLow: collapsedY,
        width,
        height: 0,
        phase
      };
    }
    return {
      x: candlestickGroup.x,
      y: candlestickGroup.y,
      yBottom: candlestickGroup.yBottom,
      yHigh: candlestickGroup.yHigh,
      yLow: candlestickGroup.yLow,
      width: candlestickGroup.width,
      height: candlestickGroup.height,
      phase
    };
  };
  const toFn = (_, datum, status) => {
    if (status === "removed") {
      const { x, yLow, yHigh, width } = getCoordinates(datum);
      const collapsedY = datum.itemId === "up" ? yLow : yHigh;
      return { x, y: collapsedY, yBottom: collapsedY, yHigh: collapsedY, yLow: collapsedY, width, height: 0 };
    }
    return getCoordinates(datum);
  };
  return { toFn, fromFn };
}
function getCoordinates(datum) {
  const {
    bandwidth,
    scaledValues: { xValue: x, openValue, closeValue, highValue, lowValue }
  } = datum;
  const y = Math.min(openValue, closeValue);
  const yBottom = isNaN(openValue) ? closeValue : Math.max(openValue, closeValue);
  const yHigh = Math.min(highValue, lowValue);
  const yLow = Math.max(highValue, lowValue);
  return {
    x,
    y,
    yBottom,
    yHigh,
    yLow,
    width: bandwidth,
    height: Math.max(yBottom - y, 1e-3)
    // This is to differentiate between animation setting height 0 and data values resulting in height 0
  };
}
function computeCandleFocusBounds(series, opts) {
  var _a2;
  const candleDatum = (_a2 = series.getNodeData()) == null ? void 0 : _a2.at(opts.datumIndex);
  const datum = !candleDatum ? void 0 : {
    x: candleDatum.scaledValues.xValue,
    y: candleDatum.scaledValues.highValue,
    width: candleDatum.bandwidth,
    height: candleDatum.scaledValues.lowValue - candleDatum.scaledValues.highValue
  };
  return computeBarFocusBounds3(datum, series.contentGroup, opts.seriesRect);
}

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeriesBase.ts
var { motion: motion2 } = _Scene26;
var {
  extent: extent2,
  fixNumericExtent: fixNumericExtent3,
  keyProperty: keyProperty3,
  SeriesNodePickMode: SeriesNodePickMode2,
  SMALLEST_KEY_INTERVAL: SMALLEST_KEY_INTERVAL2,
  valueProperty: valueProperty4,
  diff: diff3,
  animationValidation: animationValidation3,
  convertValuesToScaleByDefs: convertValuesToScaleByDefs2,
  mergeDefaults: mergeDefaults5,
  isFiniteNumber: isFiniteNumber4
} = _ModuleSupport47;
var { sanitizeHtml: sanitizeHtml2, Logger: Logger4 } = _Util28;
var { ContinuousScale: ContinuousScale2 } = _Scale11;
var CandlestickSeriesNodeEvent = class extends _ModuleSupport47.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.openKey = series.properties.openKey;
    this.closeKey = series.properties.closeKey;
    this.highKey = series.properties.highKey;
    this.lowKey = series.properties.lowKey;
  }
};
var CandlestickSeriesBase = class extends _ModuleSupport47.AbstractBarSeries {
  constructor(moduleCtx, datumAnimationResetFnc) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode2.NEAREST_BY_MAIN_AXIS_FIRST, SeriesNodePickMode2.EXACT_SHAPE_MATCH],
      directionKeys: {
        x: ["xKey"],
        y: ["lowKey", "highKey", "openKey", "closeKey"]
      },
      directionNames: {
        x: ["xName"],
        y: ["lowName", "highName", "openName", "closeName"]
      },
      pathsPerSeries: 1,
      datumSelectionGarbageCollection: false,
      animationAlwaysUpdateSelections: true,
      animationResetFns: {
        datum: datumAnimationResetFnc
      }
    });
    this.NodeEvent = CandlestickSeriesNodeEvent;
  }
  animateEmptyUpdateReady({
    datumSelection
  }) {
    const animationFns = prepareCandlestickAnimationFunctions(true);
    motion2.fromToMotion(this.id, "datums", this.ctx.animationManager, [datumSelection], animationFns);
  }
  animateWaitingUpdateReady({
    datumSelection
  }) {
    var _a2;
    const { processedData } = this;
    const difference = (_a2 = processedData == null ? void 0 : processedData.reduced) == null ? void 0 : _a2.diff;
    const animationFns = prepareCandlestickAnimationFunctions(false);
    motion2.fromToMotion(
      this.id,
      "datums",
      this.ctx.animationManager,
      [datumSelection],
      animationFns,
      (_, datum) => String(datum.xValue),
      difference
    );
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b, _c;
      if (!this.properties.isValid() || !this.visible)
        return;
      const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const yScale = (_b = this.getValueAxis()) == null ? void 0 : _b.scale;
      const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
      const extraProps = [];
      if (animationEnabled) {
        if (this.processedData) {
          extraProps.push(diff3(this.processedData));
        }
        extraProps.push(animationValidation3());
      }
      if (openKey) {
        extraProps.push(
          valueProperty4(openKey, yScaleType, {
            id: `openValue`,
            invalidValue: void 0,
            missingValue: void 0
          })
        );
      }
      const { processedData } = yield this.requestDataModel(dataController, this.data, {
        props: [
          keyProperty3(xKey, xScaleType, { id: `xValue` }),
          valueProperty4(closeKey, yScaleType, { id: `closeValue` }),
          valueProperty4(highKey, yScaleType, { id: `highValue` }),
          valueProperty4(lowKey, yScaleType, { id: `lowValue` }),
          ...isContinuousX ? [SMALLEST_KEY_INTERVAL2] : [],
          ...extraProps
        ]
      });
      this.smallestDataInterval = (_c = processedData.reduced) == null ? void 0 : _c.smallestKeyInterval;
      this.animationState.transition("updateData");
    });
  }
  getSeriesDomain(direction) {
    var _a2;
    const { processedData, dataModel, smallestDataInterval } = this;
    if (!(processedData && dataModel))
      return [];
    const { openKey } = this.properties;
    if (direction === this.getBarDirection()) {
      const lowValues = dataModel.getDomain(this, `lowValue`, "value", processedData);
      const highValues = dataModel.getDomain(this, `highValue`, "value", processedData);
      const openValues = openKey ? dataModel.getDomain(this, `openValue`, "value", processedData) : [];
      const closeValues = dataModel.getDomain(this, `closeValue`, "value", processedData);
      return fixNumericExtent3(
        [
          Math.min(...lowValues, ...highValues, ...openValues, ...closeValues),
          Math.max(...highValues, ...lowValues, ...openValues, ...closeValues)
        ],
        this.getValueAxis()
      );
    }
    const { index, def } = dataModel.resolveProcessedDataDefById(this, `xValue`);
    const keys = processedData.domain.keys[index];
    if (def.type === "key" && def.valueType === "category") {
      return keys;
    }
    const categoryAxis = this.getCategoryAxis();
    const keysExtent = (_a2 = extent2(keys)) != null ? _a2 : [NaN, NaN];
    const scalePadding = isFiniteNumber4(smallestDataInterval) ? smallestDataInterval : 0;
    const d0 = keysExtent[0] + -scalePadding;
    const d1 = keysExtent[1] + scalePadding;
    return fixNumericExtent3([d0, d1], categoryAxis);
  }
  createBaseNodeData() {
    const { visible, dataModel } = this;
    const xAxis = this.getCategoryAxis();
    const yAxis = this.getValueAxis();
    if (!(dataModel && xAxis && yAxis)) {
      return;
    }
    const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;
    const nodeData = [];
    const ids = ["xValue", "closeValue", "highValue", "lowValue"];
    if (openKey) {
      ids.push("openValue");
    }
    const defs = dataModel.resolveProcessedDataDefsByIds(this, ids);
    const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
    const barOffset = ContinuousScale2.is(xAxis.scale) ? barWidth * -0.5 : 0;
    const { groupScale, processedData } = this;
    const context = {
      itemId: xKey,
      nodeData,
      labelData: [],
      scales: this.calculateScaling(),
      visible: this.visible
    };
    if (!visible)
      return context;
    processedData == null ? void 0 : processedData.data.forEach(({ datum, keys, values }) => {
      const { xValue, openValue, closeValue, highValue, lowValue } = dataModel.resolveProcessedDataDefsValues(
        defs,
        { keys, values }
      );
      const hasOpenValue = openValue !== void 0;
      const validLowValue = lowValue !== void 0 && (!hasOpenValue || lowValue <= openValue) && lowValue <= closeValue;
      const validHighValue = highValue !== void 0 && (!hasOpenValue || highValue >= openValue) && highValue >= closeValue;
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
      scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex))) + barOffset;
      const isRising = !hasOpenValue || closeValue > openValue;
      const itemId = this.getSeriesItemType(isRising);
      const [y1, y2] = hasOpenValue ? [scaledValues.openValue, scaledValues.closeValue] : [scaledValues.lowValue, scaledValues.highValue];
      const y = Math.min(y1, y2);
      const yBottom = Math.max(y1, y2);
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
        midPoint,
        aggregatedValue: closeValue
      });
    });
    return context;
  }
  getSeriesItemType(isRising) {
    return isRising ? "up" : "down";
  }
  getItemConfig(seriesItemType) {
    return this.properties.item[seriesItemType];
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
    const { datum, itemId } = nodeDatum;
    const xAxis = this.getCategoryAxis();
    const yAxis = this.getValueAxis();
    if (!xAxis || !yAxis || !this.properties.isValid())
      return _ModuleSupport47.EMPTY_TOOLTIP_CONTENT;
    const capitalise = (text) => text.charAt(0).toUpperCase() + text.substring(1);
    const title = sanitizeHtml2(yName);
    const contentData = [
      [xKey, xName, xAxis],
      [highKey, highName, yAxis],
      [lowKey, lowName, yAxis],
      [closeKey, closeName, yAxis]
    ];
    if (openKey) {
      contentData.splice(1, 0, [openKey, openName, yAxis]);
    }
    const content = contentData.map(([key, name, axis]) => sanitizeHtml2(`${name != null ? name : capitalise(key)}: ${axis.formatDatum(datum[key])}`)).join("<br/>");
    const styles = this.getFormattedStyles(nodeDatum);
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: styles.stroke },
      __spreadProps(__spreadValues({
        seriesId: this.id,
        datum
      }, styles), {
        xKey,
        openKey: openKey != null ? openKey : "",
        closeKey,
        highKey,
        lowKey,
        xName,
        yName,
        openName,
        closeName,
        highName,
        lowName,
        title,
        color: styles.fill,
        fill: styles.fill,
        itemId
      })
    );
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
      datumSelection.each((group, nodeDatum) => {
        const activeStyles = this.getActiveStyles(nodeDatum, highlighted);
        group.updateDatumStyles(nodeDatum, activeStyles);
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
  getFormattedStyles(nodeDatum, highlighted = false) {
    const {
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const { xKey, openKey = "", closeKey, highKey, lowKey, formatter } = this.properties;
    if (formatter) {
      const formatStyles = callbackCache.call(
        formatter,
        this.getFormatterParams(__spreadProps(__spreadValues({}, nodeDatum), {
          seriesId,
          highlighted,
          xKey,
          openKey,
          closeKey,
          highKey,
          lowKey
        }))
      );
      if (formatStyles) {
        return mergeDefaults5(formatStyles, this.getSeriesStyles(nodeDatum));
      }
    }
    return this.getSeriesStyles(nodeDatum);
  }
};

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport48 } from "ag-charts-community";
var {
  BaseProperties: BaseProperties8,
  AbstractBarSeriesProperties: AbstractBarSeriesProperties3,
  SeriesTooltip: SeriesTooltip3,
  Validate: Validate29,
  COLOR_STRING: COLOR_STRING8,
  FUNCTION: FUNCTION5,
  LINE_DASH: LINE_DASH7,
  OBJECT: OBJECT7,
  POSITIVE_NUMBER: POSITIVE_NUMBER12,
  RATIO: RATIO13,
  STRING: STRING9
} = _ModuleSupport48;
var CandlestickSeriesWick = class extends BaseProperties8 {
};
__decorateClass([
  Validate29(COLOR_STRING8, { optional: true })
], CandlestickSeriesWick.prototype, "stroke", 2);
__decorateClass([
  Validate29(POSITIVE_NUMBER12)
], CandlestickSeriesWick.prototype, "strokeWidth", 2);
__decorateClass([
  Validate29(RATIO13)
], CandlestickSeriesWick.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate29(LINE_DASH7, { optional: true })
], CandlestickSeriesWick.prototype, "lineDash", 2);
__decorateClass([
  Validate29(POSITIVE_NUMBER12)
], CandlestickSeriesWick.prototype, "lineDashOffset", 2);
var CandlestickSeriesItem = class extends BaseProperties8 {
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
  Validate29(COLOR_STRING8, { optional: true })
], CandlestickSeriesItem.prototype, "fill", 2);
__decorateClass([
  Validate29(RATIO13)
], CandlestickSeriesItem.prototype, "fillOpacity", 2);
__decorateClass([
  Validate29(COLOR_STRING8)
], CandlestickSeriesItem.prototype, "stroke", 2);
__decorateClass([
  Validate29(POSITIVE_NUMBER12)
], CandlestickSeriesItem.prototype, "strokeWidth", 2);
__decorateClass([
  Validate29(RATIO13)
], CandlestickSeriesItem.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate29(LINE_DASH7)
], CandlestickSeriesItem.prototype, "lineDash", 2);
__decorateClass([
  Validate29(POSITIVE_NUMBER12)
], CandlestickSeriesItem.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate29(POSITIVE_NUMBER12)
], CandlestickSeriesItem.prototype, "cornerRadius", 2);
__decorateClass([
  Validate29(FUNCTION5, { optional: true })
], CandlestickSeriesItem.prototype, "formatter", 2);
__decorateClass([
  Validate29(OBJECT7)
], CandlestickSeriesItem.prototype, "wick", 2);
var CandlestickSeriesItems = class extends BaseProperties8 {
  constructor() {
    super(...arguments);
    this.up = new CandlestickSeriesItem();
    this.down = new CandlestickSeriesItem();
  }
};
__decorateClass([
  Validate29(OBJECT7)
], CandlestickSeriesItems.prototype, "up", 2);
__decorateClass([
  Validate29(OBJECT7)
], CandlestickSeriesItems.prototype, "down", 2);
var CandlestickSeriesBaseProperties = class extends AbstractBarSeriesProperties3 {
  constructor(item, formatter) {
    super();
    this.tooltip = new SeriesTooltip3();
    this.item = item;
    this.formatter = formatter;
  }
};
__decorateClass([
  Validate29(STRING9)
], CandlestickSeriesBaseProperties.prototype, "xKey", 2);
__decorateClass([
  Validate29(STRING9)
], CandlestickSeriesBaseProperties.prototype, "openKey", 2);
__decorateClass([
  Validate29(STRING9)
], CandlestickSeriesBaseProperties.prototype, "closeKey", 2);
__decorateClass([
  Validate29(STRING9)
], CandlestickSeriesBaseProperties.prototype, "highKey", 2);
__decorateClass([
  Validate29(STRING9)
], CandlestickSeriesBaseProperties.prototype, "lowKey", 2);
__decorateClass([
  Validate29(STRING9, { optional: true })
], CandlestickSeriesBaseProperties.prototype, "xName", 2);
__decorateClass([
  Validate29(STRING9, { optional: true })
], CandlestickSeriesBaseProperties.prototype, "yName", 2);
__decorateClass([
  Validate29(STRING9, { optional: true })
], CandlestickSeriesBaseProperties.prototype, "openName", 2);
__decorateClass([
  Validate29(STRING9, { optional: true })
], CandlestickSeriesBaseProperties.prototype, "closeName", 2);
__decorateClass([
  Validate29(STRING9, { optional: true })
], CandlestickSeriesBaseProperties.prototype, "highName", 2);
__decorateClass([
  Validate29(STRING9, { optional: true })
], CandlestickSeriesBaseProperties.prototype, "lowName", 2);
__decorateClass([
  Validate29(OBJECT7)
], CandlestickSeriesBaseProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate29(OBJECT7)
], CandlestickSeriesBaseProperties.prototype, "item", 2);
__decorateClass([
  Validate29(FUNCTION5, { optional: true })
], CandlestickSeriesBaseProperties.prototype, "formatter", 2);
var CandlestickSeriesProperties = class extends CandlestickSeriesBaseProperties {
  constructor() {
    super(new CandlestickSeriesItems());
  }
};
__decorateClass([
  Validate29(STRING9)
], CandlestickSeriesProperties.prototype, "openKey", 2);

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeries.ts
var { extractDecoratedProperties: extractDecoratedProperties2, mergeDefaults: mergeDefaults6 } = _ModuleSupport49;
var CandlestickSeries = class extends CandlestickSeriesBase {
  constructor(moduleCtx) {
    super(moduleCtx, resetCandlestickSelectionsFn);
    this.properties = new CandlestickSeriesProperties();
  }
  createNodeData() {
    return __async(this, null, function* () {
      const baseNodeData = this.createBaseNodeData();
      if (!baseNodeData) {
        return;
      }
      const nodeData = baseNodeData.nodeData.map((datum) => {
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
        } = this.getItemConfig(datum.itemId);
        return __spreadProps(__spreadValues({}, datum), {
          fill,
          fillOpacity,
          stroke,
          strokeWidth,
          strokeOpacity,
          lineDash,
          lineDashOffset,
          wick,
          cornerRadius
        });
      });
      return __spreadProps(__spreadValues({}, baseNodeData), { nodeData });
    });
  }
  nodeFactory() {
    return new CandlestickGroup();
  }
  getSeriesStyles(nodeDatum) {
    const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, wick, cornerRadius } = nodeDatum;
    return {
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
  }
  getActiveStyles(nodeDatum, highlighted) {
    let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);
    if (highlighted) {
      activeStyles = mergeDefaults6(this.properties.highlightStyle.item, activeStyles);
    }
    const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;
    activeStyles.wick = mergeDefaults6(activeStyles.wick, {
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset
    });
    return activeStyles;
  }
  getFormatterParams(params) {
    return params;
  }
  computeFocusBounds(opts) {
    return computeCandleFocusBounds(this, opts);
  }
};
CandlestickSeries.className = "CandleStickSeries";
CandlestickSeries.type = "candlestick";

// packages/ag-charts-enterprise/src/series/candlestick/candlestickThemes.ts
import { _Theme as _Theme14 } from "ag-charts-community";
var CANDLESTICK_SERIES_THEME = {
  series: {
    __extends__: _Theme14.EXTENDS_SERIES_DEFAULTS,
    highlightStyle: {
      item: {
        strokeWidth: 3
      }
    },
    direction: "vertical"
  },
  animation: { enabled: false },
  axes: {
    [_Theme14.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        snap: false
      }
    },
    [_Theme14.CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
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
  defaultAxes: [
    {
      type: _Theme15.CARTESIAN_AXIS_TYPE.NUMBER,
      position: _Theme15.POSITION.LEFT
    },
    {
      type: _Theme15.CARTESIAN_AXIS_TYPE.ORDINAL_TIME,
      position: _Theme15.POSITION.BOTTOM
    }
  ],
  themeTemplate: CANDLESTICK_SERIES_THEME,
  groupable: false,
  paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
    const { properties } = themeTemplateParameters;
    const { fills, strokes } = takeColors(colorsCount);
    const { fills: DEFAULT_FILLS, strokes: DEFAULT_STROKES } = properties.get(
      _Theme15.DEFAULT_COLOURS
    );
    return {
      item: {
        up: {
          fill: userPalette ? "transparent" : DEFAULT_FILLS.GREEN,
          stroke: userPalette ? strokes[0] : DEFAULT_STROKES.GREEN
        },
        down: {
          fill: userPalette ? fills[0] : DEFAULT_FILLS.RED,
          stroke: userPalette ? strokes[0] : DEFAULT_STROKES.RED
        }
      }
    };
  }
};

// packages/ag-charts-enterprise/src/series/heatmap/heatmapModule.ts
import { _Theme as _Theme17 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/heatmap/heatmapSeries.ts
import { _ModuleSupport as _ModuleSupport52, _Scale as _Scale12, _Scene as _Scene30, _Util as _Util30 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/util/labelFormatter.ts
import { _ModuleSupport as _ModuleSupport50, _Scene as _Scene29, _Util as _Util29 } from "ag-charts-community";
var { Validate: Validate30, NUMBER: NUMBER9, TEXT_WRAP, OVERFLOW_STRATEGY } = _ModuleSupport50;
var { Logger: Logger5 } = _Util29;
var { Text: Text5, Label } = _Scene29;
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
  Validate30(TEXT_WRAP)
], BaseAutoSizedLabel.prototype, "wrapping", 2);
__decorateClass([
  Validate30(OVERFLOW_STRATEGY)
], BaseAutoSizedLabel.prototype, "overflowStrategy", 2);
__decorateClass([
  Validate30(NUMBER9, { optional: true })
], BaseAutoSizedLabel.prototype, "minimumFontSize", 2);
var AutoSizedLabel = class extends BaseAutoSizedLabel {
  constructor() {
    super(...arguments);
    this.spacing = 0;
  }
};
__decorateClass([
  Validate30(NUMBER9)
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
import { _ModuleSupport as _ModuleSupport51 } from "ag-charts-community";
var {
  CartesianSeriesProperties,
  SeriesTooltip: SeriesTooltip4,
  Validate: Validate31,
  AND: AND7,
  ARRAY: ARRAY4,
  COLOR_STRING: COLOR_STRING9,
  COLOR_STRING_ARRAY,
  FUNCTION: FUNCTION6,
  OBJECT: OBJECT8,
  POSITIVE_NUMBER: POSITIVE_NUMBER13,
  RATIO: RATIO14,
  STRING: STRING10,
  TEXT_ALIGN,
  VERTICAL_ALIGN
} = _ModuleSupport51;
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
  Validate31(STRING10, { optional: true })
], HeatmapSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate31(STRING10)
], HeatmapSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate31(STRING10)
], HeatmapSeriesProperties.prototype, "yKey", 2);
__decorateClass([
  Validate31(STRING10, { optional: true })
], HeatmapSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate31(STRING10, { optional: true })
], HeatmapSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate31(STRING10, { optional: true })
], HeatmapSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate31(STRING10, { optional: true })
], HeatmapSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate31(AND7(COLOR_STRING_ARRAY, ARRAY4.restrict({ minLength: 1 })))
], HeatmapSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate31(COLOR_STRING9, { optional: true })
], HeatmapSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate31(RATIO14, { optional: true })
], HeatmapSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate31(POSITIVE_NUMBER13, { optional: true })
], HeatmapSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate31(TEXT_ALIGN)
], HeatmapSeriesProperties.prototype, "textAlign", 2);
__decorateClass([
  Validate31(VERTICAL_ALIGN)
], HeatmapSeriesProperties.prototype, "verticalAlign", 2);
__decorateClass([
  Validate31(POSITIVE_NUMBER13)
], HeatmapSeriesProperties.prototype, "itemPadding", 2);
__decorateClass([
  Validate31(FUNCTION6, { optional: true })
], HeatmapSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate31(OBJECT8)
], HeatmapSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate31(OBJECT8)
], HeatmapSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/heatmap/heatmapSeries.ts
var {
  SeriesNodePickMode: SeriesNodePickMode3,
  computeBarFocusBounds: computeBarFocusBounds4,
  getMissCount,
  valueProperty: valueProperty5,
  ChartAxisDirection: ChartAxisDirection8,
  DEFAULT_CARTESIAN_DIRECTION_KEYS,
  DEFAULT_CARTESIAN_DIRECTION_NAMES
} = _ModuleSupport52;
var { Rect: Rect3, PointerEvents } = _Scene30;
var { ColorScale } = _Scale12;
var { sanitizeHtml: sanitizeHtml3, Color, Logger: Logger6 } = _Util30;
var HeatmapSeriesNodeEvent = class extends _ModuleSupport52.CartesianSeriesNodeEvent {
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
var HeatmapSeries = class extends _ModuleSupport52.CartesianSeries {
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
    this.seriesItemEnabled = [];
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b, _c;
      const xAxis = this.axes[ChartAxisDirection8.X];
      const yAxis = this.axes[ChartAxisDirection8.Y];
      if (!xAxis || !yAxis || !this.properties.isValid() || !((_a2 = this.data) == null ? void 0 : _a2.length)) {
        return;
      }
      const { xKey, yKey, colorRange, colorKey } = this.properties;
      const xScale = (_b = this.axes[ChartAxisDirection8.X]) == null ? void 0 : _b.scale;
      const yScale = (_c = this.axes[ChartAxisDirection8.Y]) == null ? void 0 : _c.scale;
      const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
      const colorScaleType = this.colorScale.type;
      const { dataModel, processedData } = yield this.requestDataModel(dataController, this.data, {
        props: [
          valueProperty5(xKey, xScaleType, { id: "xValue" }),
          valueProperty5(yKey, yScaleType, { id: "yValue" }),
          ...colorKey ? [valueProperty5(colorKey, colorScaleType, { id: "colorValue" })] : []
        ]
      });
      if (this.isColorScaleValid()) {
        const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
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
    const colorDataIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
    const dataCount = processedData.data.length;
    const missCount = getMissCount(this, processedData.defs.values[colorDataIdx].missing);
    const colorDataMissing = dataCount === 0 || dataCount === missCount;
    return !colorDataMissing;
  }
  getSeriesDomain(direction) {
    const { dataModel, processedData } = this;
    if (!dataModel || !processedData)
      return [];
    if (direction === ChartAxisDirection8.X) {
      return dataModel.getDomain(this, `xValue`, "value", processedData);
    } else {
      return dataModel.getDomain(this, `yValue`, "value", processedData);
    }
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d, _e, _f, _g;
      const { data, visible, axes, dataModel } = this;
      const xAxis = axes[ChartAxisDirection8.X];
      const yAxis = axes[ChartAxisDirection8.Y];
      if (!(data && dataModel && visible && xAxis && yAxis)) {
        return;
      }
      if (xAxis.type !== "category" || yAxis.type !== "category") {
        Logger6.warnOnce(
          `Heatmap series expected axes to have "category" type, but received "${xAxis.type}" and "${yAxis.type}" instead.`
        );
        return;
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
      const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`);
      const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`);
      const colorDataIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`) : void 0;
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
      const { seriesItemEnabled } = this;
      seriesItemEnabled.length = 0;
      for (const { values, datum } of (_f = (_e = this.processedData) == null ? void 0 : _e.data) != null ? _f : []) {
        const xDatum = values[xDataIdx];
        const yDatum = values[yDataIdx];
        const x = xScale.convert(xDatum) + xOffset;
        const y = yScale.convert(yDatum) + yOffset;
        const colorValue = values[colorDataIdx != null ? colorDataIdx : -1];
        const fill = colorScaleValid && colorValue != null ? this.colorScale.convert(colorValue) : colorRange[0];
        seriesItemEnabled.push(colorValue != null);
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
      return {
        itemId: (_g = this.properties.yKey) != null ? _g : this.id,
        nodeData,
        labelData,
        scales: this.calculateScaling(),
        visible: this.visible
      };
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
      const xAxis = this.axes[ChartAxisDirection8.X];
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
    const xAxis = this.axes[ChartAxisDirection8.X];
    const yAxis = this.axes[ChartAxisDirection8.Y];
    if (!this.properties.isValid() || !xAxis || !yAxis) {
      return _ModuleSupport52.EMPTY_TOOLTIP_CONTENT;
    }
    const { xKey, yKey, colorKey, xName, yName, colorName, stroke, strokeWidth, colorRange, formatter, tooltip } = this.properties;
    const {
      colorScale,
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const { datum, xValue, yValue, colorValue, itemId } = nodeDatum;
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
        colorKey,
        colorName,
        itemId
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
        colorDomain: this.processedData.domain.values[this.dataModel.resolveProcessedDataIndexById(this, "colorValue")],
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
  computeFocusBounds({ datumIndex, seriesRect }) {
    var _a2;
    const datum = (_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData[datumIndex];
    if (datum === void 0)
      return void 0;
    const { width, height, midPoint } = datum;
    const focusRect = { x: midPoint.x - width / 2, y: midPoint.y - height / 2, width, height };
    return computeBarFocusBounds4(focusRect, this.contentGroup, seriesRect);
  }
};
HeatmapSeries.className = "HeatmapSeries";
HeatmapSeries.type = "heatmap";

// packages/ag-charts-enterprise/src/series/heatmap/heatmapThemes.ts
import { _Theme as _Theme16 } from "ag-charts-community";
var HEATMAP_SERIES_THEME = {
  series: {
    __extends__: _Theme16.EXTENDS_SERIES_DEFAULTS,
    label: {
      enabled: false,
      color: _Theme16.DEFAULT_LABEL_COLOUR,
      fontSize: _Theme16.FONT_SIZE.SMALL,
      fontFamily: _Theme16.DEFAULT_FONT_FAMILY,
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
      type: _Theme17.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: _Theme17.POSITION.LEFT
    },
    {
      type: _Theme17.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: _Theme17.POSITION.BOTTOM
    }
  ],
  themeTemplate: HEATMAP_SERIES_THEME,
  paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
    var _a2;
    const { properties } = themeTemplateParameters;
    const defaultColorRange = properties.get(_Theme17.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    const defaultBackgroundColor = properties.get(_Theme17.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (_a2 = Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor) != null ? _a2 : "white";
    const { fills, strokes } = takeColors(colorsCount);
    return {
      stroke: userPalette ? strokes[0] : backgroundFill,
      colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundModule.ts
import { _Theme as _Theme18 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/map-util/mapThemeDefaults.ts
var MAP_THEME_DEFAULTS = {
  // zoom: {
  //     axes: 'xy',
  //     anchorPointX: 'pointer',
  //     anchorPointY: 'pointer',
  //     deceleration: 0.01,
  // },
  legend: {
    enabled: false
  },
  gradientLegend: {
    enabled: false
  },
  tooltip: {
    range: "exact"
  }
};

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundSeries.ts
import { _ModuleSupport as _ModuleSupport57, _Scene as _Scene32, _Util as _Util31 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/map-util/geoGeometry.ts
import { _Scene as _Scene31 } from "ag-charts-community";

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
import { _ModuleSupport as _ModuleSupport53 } from "ag-charts-community";
var { LonLatBBox } = _ModuleSupport53;
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
var { Path: Path5, ExtendedPath2D, BBox: BBox8, ScenePathChangeDetection } = _Scene31;
var GeoGeometry = class extends Path5 {
  constructor() {
    super(...arguments);
    this.projectedGeometry = void 0;
    this.renderMode = 3 /* All */;
    // Keep non-filled shapes separate so we don't fill them
    this.strokePath = new ExtendedPath2D();
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
    this.renderStroke(ctx, this.strokePath.getPath2D());
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
        bbox = new BBox8(x, y, 0, 0);
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
import { _ModuleSupport as _ModuleSupport55 } from "ag-charts-community";
function isValidCoordinate(v) {
  return Array.isArray(v) && v.length >= 2 && v.every(_ModuleSupport55.isFiniteNumber);
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
var GEOJSON_OBJECT = _ModuleSupport55.predicateWithMessage(isValidFeatureCollection, "a GeoJSON object");

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport56 } from "ag-charts-community";
var { COLOR_STRING: COLOR_STRING10, LINE_DASH: LINE_DASH8, OBJECT: OBJECT9, POSITIVE_NUMBER: POSITIVE_NUMBER14, RATIO: RATIO15, Validate: Validate32, SeriesProperties, SeriesTooltip: SeriesTooltip5 } = _ModuleSupport56;
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
  Validate32(GEOJSON_OBJECT, { optional: true })
], MapLineBackgroundSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate32(COLOR_STRING10)
], MapLineBackgroundSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate32(RATIO15)
], MapLineBackgroundSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER14)
], MapLineBackgroundSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate32(LINE_DASH8)
], MapLineBackgroundSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER14)
], MapLineBackgroundSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate32(OBJECT9)
], MapLineBackgroundSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundSeries.ts
var { createDatumId: createDatumId2, DataModelSeries, SeriesNodePickMode: SeriesNodePickMode4, Validate: Validate33 } = _ModuleSupport57;
var { Group: Group7, Selection: Selection3, PointerEvents: PointerEvents2 } = _Scene32;
var { Logger: Logger7 } = _Util31;
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
  }
  getNodeData() {
    var _a2;
    return (_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData;
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
        return;
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
      return {
        itemId: seriesId,
        nodeData,
        labelData
      };
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
      var _a2;
      const { datumSelection } = this;
      yield this.updateSelections();
      this.contentGroup.visible = this.visible;
      const { nodeData = [] } = (_a2 = this.contextNodeData) != null ? _a2 : {};
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
    return _ModuleSupport57.EMPTY_TOOLTIP_CONTENT;
  }
  computeFocusBounds(_opts) {
    return void 0;
  }
};
MapLineBackgroundSeries.className = "MapLineBackgroundSeries";
MapLineBackgroundSeries.type = "map-line-background";
__decorateClass([
  Validate33(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapLineBackgroundSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundModule.ts
var { EXTENDS_SERIES_DEFAULTS, DEFAULT_HIERARCHY_STROKES } = _Theme18;
var MapLineBackgroundModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-line-background",
  instanceConstructor: MapLineBackgroundSeries,
  themeTemplate: __spreadProps(__spreadValues({}, MAP_THEME_DEFAULTS), {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS,
      strokeWidth: 1,
      lineDash: [0],
      lineDashOffset: 0
    }
  }),
  paletteFactory: ({ themeTemplateParameters }) => {
    var _a2;
    const { properties } = themeTemplateParameters;
    return {
      stroke: (_a2 = properties.get(DEFAULT_HIERARCHY_STROKES)) == null ? void 0 : _a2[1]
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-line/mapLineModule.ts
import { _Theme as _Theme19 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/map-line/mapLineSeries.ts
import {
  _ModuleSupport as _ModuleSupport60,
  _Scale as _Scale13,
  _Scene as _Scene34,
  _Util as _Util33
} from "ag-charts-community";

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
function computeGeoFocusBounds(series, opts) {
  var _a2;
  const datum = (_a2 = series.contextNodeData) == null ? void 0 : _a2.nodeData[opts.datumIndex];
  if (datum === void 0)
    return void 0;
  for (const node of series.datumSelection.nodes()) {
    if (node.datum === datum) {
      return node.computeTransformedBBox();
    }
  }
  return void 0;
}

// packages/ag-charts-enterprise/src/series/map-line/mapLineSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport59, _Scene as _Scene33 } from "ag-charts-community";
var {
  AND: AND8,
  ARRAY: ARRAY5,
  COLOR_STRING: COLOR_STRING11,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY2,
  FUNCTION: FUNCTION7,
  LINE_DASH: LINE_DASH9,
  NUMBER_ARRAY,
  OBJECT: OBJECT10,
  POSITIVE_NUMBER: POSITIVE_NUMBER15,
  RATIO: RATIO16,
  STRING: STRING11,
  Validate: Validate34,
  SeriesProperties: SeriesProperties2,
  SeriesTooltip: SeriesTooltip6
} = _ModuleSupport59;
var { Label: Label2 } = _Scene33;
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
  Validate34(GEOJSON_OBJECT, { optional: true })
], MapLineSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate34(STRING11, { optional: true })
], MapLineSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate34(STRING11, { optional: true })
], MapLineSeriesProperties.prototype, "legendItemName", 2);
__decorateClass([
  Validate34(STRING11)
], MapLineSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate34(STRING11)
], MapLineSeriesProperties.prototype, "topologyIdKey", 2);
__decorateClass([
  Validate34(STRING11, { optional: true })
], MapLineSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate34(STRING11, { optional: true })
], MapLineSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate34(STRING11, { optional: true })
], MapLineSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate34(STRING11, { optional: true })
], MapLineSeriesProperties.prototype, "sizeKey", 2);
__decorateClass([
  Validate34(STRING11, { optional: true })
], MapLineSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate34(STRING11, { optional: true })
], MapLineSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate34(STRING11, { optional: true })
], MapLineSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate34(NUMBER_ARRAY, { optional: true })
], MapLineSeriesProperties.prototype, "sizeDomain", 2);
__decorateClass([
  Validate34(AND8(COLOR_STRING_ARRAY2, ARRAY5.restrict({ minLength: 1 })), { optional: true })
], MapLineSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER15, { optional: true })
], MapLineSeriesProperties.prototype, "maxStrokeWidth", 2);
__decorateClass([
  Validate34(COLOR_STRING11)
], MapLineSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate34(RATIO16)
], MapLineSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER15)
], MapLineSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate34(LINE_DASH9)
], MapLineSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER15)
], MapLineSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate34(FUNCTION7, { optional: true })
], MapLineSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate34(OBJECT10)
], MapLineSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate34(OBJECT10)
], MapLineSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-line/mapLineSeries.ts
var { getMissCount: getMissCount2, createDatumId: createDatumId3, DataModelSeries: DataModelSeries2, SeriesNodePickMode: SeriesNodePickMode5, valueProperty: valueProperty6, Validate: Validate35 } = _ModuleSupport60;
var { ColorScale: ColorScale2, LinearScale: LinearScale3 } = _Scale13;
var { Selection: Selection4, Text: Text6 } = _Scene34;
var { sanitizeHtml: sanitizeHtml4, Logger: Logger8 } = _Util33;
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
    this.datumSelection = Selection4.select(
      this.contentGroup,
      () => this.nodeFactory()
    );
    this.labelSelection = Selection4.select(
      this.labelGroup,
      Text6
    );
    this.highlightDatumSelection = Selection4.select(
      this.highlightNode,
      () => this.nodeFactory()
    );
    this._previousDatumMidPoint = void 0;
  }
  getNodeData() {
    var _a2;
    return (_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData;
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
      var _a2, _b;
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
      const sizeScaleType = this.sizeScale.type;
      const colorScaleType = this.colorScale.type;
      const mercatorScaleType = (_a2 = this.scale) == null ? void 0 : _a2.type;
      const { dataModel, processedData } = yield this.requestDataModel(dataController, data, {
        props: [
          valueProperty6(idKey, mercatorScaleType, { id: "idValue", includeProperty: false }),
          valueProperty6(idKey, mercatorScaleType, {
            id: "featureValue",
            includeProperty: false,
            processor: () => (datum) => featureById.get(datum)
          }),
          ...labelKey != null ? [valueProperty6(labelKey, "band", { id: "labelValue" })] : [],
          ...sizeKey != null ? [valueProperty6(sizeKey, sizeScaleType, { id: "sizeValue" })] : [],
          ...colorKey != null ? [valueProperty6(colorKey, colorScaleType, { id: "colorValue" })] : []
        ]
      });
      const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`);
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
        const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`);
        const processedSize = (_b = processedData.domain.values[sizeIdx]) != null ? _b : [];
        sizeScale.domain = sizeDomain != null ? sizeDomain : processedSize;
      }
      if (colorRange != null && this.isColorScaleValid()) {
        const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
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
    const colorIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
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
        return;
      const colorScaleValid = this.isColorScaleValid();
      const idIdx = dataModel.resolveProcessedDataIndexById(this, `idValue`);
      const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`);
      const labelIdx = labelKey != null ? dataModel.resolveProcessedDataIndexById(this, `labelValue`) : void 0;
      const sizeIdx = sizeKey != null ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`) : void 0;
      const colorIdx = colorKey != null ? dataModel.resolveProcessedDataIndexById(this, `colorValue`) : void 0;
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
      return {
        itemId: seriesId,
        nodeData,
        labelData
      };
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
      const nodeData = (_c = (_b = this.contextNodeData) == null ? void 0 : _b.nodeData) != null ? _c : [];
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
    var _a2, _b;
    return (_b = (_a2 = this.contextNodeData) == null ? void 0 : _a2.labelData) != null ? _b : [];
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
      const colorDomain = processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, "colorValue")];
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
      return _ModuleSupport60.EMPTY_TOOLTIP_CONTENT;
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
    const { datum, stroke, idValue, colorValue, sizeValue, labelValue, itemId } = nodeDatum;
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
        color,
        itemId,
        sizeKey,
        colorKey,
        colorName,
        idName,
        labelKey,
        labelName,
        sizeName
      }, this.getModuleTooltipParams())
    );
  }
  computeFocusBounds(opts) {
    return computeGeoFocusBounds(this, opts);
  }
};
MapLineSeries.className = "MapLineSeries";
MapLineSeries.type = "map-line";
__decorateClass([
  Validate35(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapLineSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-line/mapLineModule.ts
var {
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
  EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS2,
  DEFAULT_FONT_FAMILY,
  DEFAULT_LABEL_COLOUR,
  singleSeriesPaletteFactory
} = _Theme19;
var MapLineModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-line",
  instanceConstructor: MapLineSeries,
  themeTemplate: __spreadProps(__spreadValues({}, MAP_THEME_DEFAULTS), {
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
    }
  }),
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
import { _Theme as _Theme20 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerSeries.ts
import {
  _ModuleSupport as _ModuleSupport63,
  _Scale as _Scale14,
  _Scene as _Scene36,
  _Util as _Util35
} from "ag-charts-community";

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
import { _ModuleSupport as _ModuleSupport62, _Scene as _Scene35, _Util as _Util34 } from "ag-charts-community";
var {
  AND: AND9,
  ARRAY: ARRAY6,
  COLOR_STRING: COLOR_STRING12,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY3,
  FUNCTION: FUNCTION8,
  NUMBER_ARRAY: NUMBER_ARRAY2,
  OBJECT: OBJECT11,
  POSITIVE_NUMBER: POSITIVE_NUMBER16,
  RATIO: RATIO17,
  STRING: STRING12,
  MARKER_SHAPE,
  Validate: Validate36,
  SeriesProperties: SeriesProperties3,
  SeriesTooltip: SeriesTooltip7
} = _ModuleSupport62;
var { Label: Label3, Circle } = _Scene35;
var { Logger: Logger9 } = _Util34;
var MapMarkerSeriesLabel = class extends Label3 {
  constructor() {
    super(...arguments);
    this.placement = "bottom";
  }
};
__decorateClass([
  Validate36(STRING12)
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
  Validate36(GEOJSON_OBJECT, { optional: true })
], MapMarkerSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "legendItemName", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate36(STRING12)
], MapMarkerSeriesProperties.prototype, "topologyIdKey", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "latitudeKey", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "latitudeName", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "longitudeKey", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "longitudeName", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "sizeKey", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate36(STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate36(AND9(COLOR_STRING_ARRAY3, ARRAY6.restrict({ minLength: 1 })), { optional: true })
], MapMarkerSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate36(MARKER_SHAPE)
], MapMarkerSeriesProperties.prototype, "shape", 2);
__decorateClass([
  Validate36(POSITIVE_NUMBER16)
], MapMarkerSeriesProperties.prototype, "size", 2);
__decorateClass([
  Validate36(POSITIVE_NUMBER16, { optional: true })
], MapMarkerSeriesProperties.prototype, "maxSize", 2);
__decorateClass([
  Validate36(NUMBER_ARRAY2, { optional: true })
], MapMarkerSeriesProperties.prototype, "sizeDomain", 2);
__decorateClass([
  Validate36(COLOR_STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate36(RATIO17)
], MapMarkerSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate36(COLOR_STRING12, { optional: true })
], MapMarkerSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate36(POSITIVE_NUMBER16)
], MapMarkerSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate36(RATIO17)
], MapMarkerSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate36(FUNCTION8, { optional: true })
], MapMarkerSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate36(OBJECT11)
], MapMarkerSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate36(OBJECT11)
], MapMarkerSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerSeries.ts
var {
  Validate: Validate37,
  fromToMotion: fromToMotion2,
  StateMachine,
  getMissCount: getMissCount3,
  createDatumId: createDatumId4,
  DataModelSeries: DataModelSeries3,
  SeriesNodePickMode: SeriesNodePickMode6,
  Layers: Layers6,
  valueProperty: valueProperty7,
  computeMarkerFocusBounds
} = _ModuleSupport63;
var { ColorScale: ColorScale3, LinearScale: LinearScale4 } = _Scale14;
var { Group: Group8, Selection: Selection5, Text: Text7, getMarker } = _Scene36;
var { sanitizeHtml: sanitizeHtml5, Logger: Logger10 } = _Util35;
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
      new Group8({
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
      this.highlightNode,
      () => this.markerFactory()
    );
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
  getNodeData() {
    var _a2;
    return (_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData;
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
      var _a2, _b;
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
      const sizeScaleType = this.sizeScale.type;
      const colorScaleType = this.colorScale.type;
      const mercatorScaleType = (_a2 = this.scale) == null ? void 0 : _a2.type;
      const hasLatLon = latitudeKey != null && longitudeKey != null;
      const { dataModel, processedData } = yield this.requestDataModel(dataController, data, {
        props: [
          ...idKey != null ? [
            valueProperty7(idKey, mercatorScaleType, { id: "idValue", includeProperty: false }),
            valueProperty7(idKey, mercatorScaleType, {
              id: "featureValue",
              includeProperty: false,
              processor: () => (datum) => featureById.get(datum)
            })
          ] : [],
          ...hasLatLon ? [
            valueProperty7(latitudeKey, mercatorScaleType, { id: "latValue" }),
            valueProperty7(longitudeKey, mercatorScaleType, { id: "lonValue" })
          ] : [],
          ...labelKey ? [valueProperty7(labelKey, "band", { id: "labelValue" })] : [],
          ...sizeKey ? [valueProperty7(sizeKey, sizeScaleType, { id: "sizeValue" })] : [],
          ...colorKey ? [valueProperty7(colorKey, colorScaleType, { id: "colorValue" })] : []
        ]
      });
      const featureIdx = idKey != null ? dataModel.resolveProcessedDataIndexById(this, `featureValue`) : void 0;
      const latIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `latValue`) : void 0;
      const lonIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `lonValue`) : void 0;
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
        const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`);
        const processedSize = (_b = processedData.domain.values[sizeIdx]) != null ? _b : [];
        sizeScale.domain = sizeDomain != null ? sizeDomain : processedSize;
      }
      if (colorRange != null && this.isColorScaleValid()) {
        const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
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
    const colorIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
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
        return;
      const colorScaleValid = this.isColorScaleValid();
      const hasLatLon = latitudeKey != null && longitudeKey != null;
      const idIdx = idKey != null ? dataModel.resolveProcessedDataIndexById(this, `idValue`) : void 0;
      const featureIdx = idKey != null ? dataModel.resolveProcessedDataIndexById(this, `featureValue`) : void 0;
      const latIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `latValue`) : void 0;
      const lonIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `lonValue`) : void 0;
      const labelIdx = labelKey != null ? dataModel.resolveProcessedDataIndexById(this, `labelValue`) : void 0;
      const sizeIdx = sizeKey != null ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`) : void 0;
      const colorIdx = colorKey != null ? dataModel.resolveProcessedDataIndexById(this, `colorValue`) : void 0;
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
      return {
        itemId: seriesId,
        nodeData,
        labelData
      };
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
      const nodeData = (_c = (_b = this.contextNodeData) == null ? void 0 : _b.nodeData) != null ? _c : [];
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
    var _a2, _b;
    return (_b = (_a2 = this.contextNodeData) == null ? void 0 : _a2.labelData) != null ? _b : [];
  }
  getSeriesDomain() {
    return [NaN, NaN];
  }
  pickNodeClosestDatum(p) {
    var _a2;
    const { x: x0, y: y0 } = this.rootGroup.transformPoint(p.x, p.y);
    let minDistanceSquared = Infinity;
    let minDatum;
    (_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData.forEach((datum) => {
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
      const colorDomain = processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, "colorValue")];
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
      return _ModuleSupport63.EMPTY_TOOLTIP_CONTENT;
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
      tooltip,
      latitudeName,
      longitudeName
    } = properties;
    const { datum, fill, idValue, latValue, lonValue, sizeValue, colorValue, labelValue, itemId } = nodeDatum;
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
        color,
        colorKey,
        colorName,
        idName,
        itemId,
        labelKey,
        labelName,
        latitudeName,
        longitudeName,
        sizeKey,
        sizeName
      }, this.getModuleTooltipParams())
    );
  }
  getFormattedMarkerStyle(markerDatum) {
    const {
      id: seriesId,
      properties,
      ctx: { callbackCache }
    } = this;
    const { datum, point } = markerDatum;
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
    const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
    const params = {
      seriesId,
      datum: datum.datum,
      itemId: datum.itemId,
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
      highlighted: true
    };
    if (formatter !== void 0) {
      const style = callbackCache.call(
        formatter,
        params
      );
      if ((style == null ? void 0 : style.size) !== void 0) {
        return { size: style.size };
      }
    }
    return { size: markerDatum.point.size };
  }
  computeFocusBounds(opts) {
    return computeMarkerFocusBounds(this, opts);
  }
};
MapMarkerSeries.className = "MapMarkerSeries";
MapMarkerSeries.type = "map-marker";
__decorateClass([
  Validate37(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapMarkerSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerModule.ts
var {
  EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS3,
  DEFAULT_LABEL_COLOUR: DEFAULT_LABEL_COLOUR2,
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE: DEFAULT_DIVERGING_SERIES_COLOUR_RANGE2,
  singleSeriesPaletteFactory: singleSeriesPaletteFactory2
} = _Theme20;
var MapMarkerModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-marker",
  instanceConstructor: MapMarkerSeries,
  themeTemplate: __spreadProps(__spreadValues({}, MAP_THEME_DEFAULTS), {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS3,
      maxSize: 30,
      fillOpacity: 0.5,
      label: {
        color: DEFAULT_LABEL_COLOUR2
      }
    }
  }),
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
import { _Theme as _Theme21 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundSeries.ts
import { _ModuleSupport as _ModuleSupport66, _Scene as _Scene37, _Util as _Util36 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport65 } from "ag-charts-community";
var { COLOR_STRING: COLOR_STRING13, LINE_DASH: LINE_DASH10, OBJECT: OBJECT12, POSITIVE_NUMBER: POSITIVE_NUMBER17, RATIO: RATIO18, Validate: Validate38, SeriesProperties: SeriesProperties4, SeriesTooltip: SeriesTooltip8 } = _ModuleSupport65;
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
  Validate38(GEOJSON_OBJECT, { optional: true })
], MapShapeBackgroundSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate38(COLOR_STRING13)
], MapShapeBackgroundSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate38(RATIO18)
], MapShapeBackgroundSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate38(COLOR_STRING13)
], MapShapeBackgroundSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate38(RATIO18)
], MapShapeBackgroundSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate38(POSITIVE_NUMBER17)
], MapShapeBackgroundSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate38(LINE_DASH10)
], MapShapeBackgroundSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate38(POSITIVE_NUMBER17)
], MapShapeBackgroundSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate38(OBJECT12)
], MapShapeBackgroundSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundSeries.ts
var { createDatumId: createDatumId5, Series, SeriesNodePickMode: SeriesNodePickMode7, Validate: Validate39 } = _ModuleSupport66;
var { Selection: Selection6, Group: Group9, PointerEvents: PointerEvents3 } = _Scene37;
var { Logger: Logger11 } = _Util36;
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
    this.itemGroup = this.contentGroup.appendChild(new Group9({ name: "itemGroup" }));
    this.datumSelection = Selection6.select(
      this.itemGroup,
      () => this.nodeFactory()
    );
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
        return;
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
      return {
        itemId: seriesId,
        nodeData,
        labelData
      };
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
      var _a2;
      const { datumSelection } = this;
      yield this.updateSelections();
      this.contentGroup.visible = this.visible;
      const { nodeData = [] } = (_a2 = this.contextNodeData) != null ? _a2 : {};
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
    return _ModuleSupport66.EMPTY_TOOLTIP_CONTENT;
  }
  pickFocus(_opts) {
    return void 0;
  }
};
MapShapeBackgroundSeries.className = "MapShapeBackgroundSeries";
MapShapeBackgroundSeries.type = "map-shape-background";
__decorateClass([
  Validate39(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapShapeBackgroundSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundModule.ts
var { DEFAULT_BACKGROUND_COLOUR, DEFAULT_HIERARCHY_FILLS } = _Theme21;
var MapShapeBackgroundModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-shape-background",
  instanceConstructor: MapShapeBackgroundSeries,
  themeTemplate: __spreadProps(__spreadValues({}, MAP_THEME_DEFAULTS), {
    series: {
      stroke: DEFAULT_BACKGROUND_COLOUR,
      strokeWidth: 1
    }
  }),
  paletteFactory: ({ themeTemplateParameters }) => {
    var _a2;
    const { properties } = themeTemplateParameters;
    return {
      fill: (_a2 = properties.get(DEFAULT_HIERARCHY_FILLS)) == null ? void 0 : _a2[1]
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeModule.ts
import { _Theme as _Theme22 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeSeries.ts
import {
  _ModuleSupport as _ModuleSupport69,
  _Scale as _Scale16,
  _Scene as _Scene39,
  _Util as _Util38
} from "ag-charts-community";

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
import { _ModuleSupport as _ModuleSupport68 } from "ag-charts-community";
var {
  AND: AND10,
  ARRAY: ARRAY7,
  COLOR_STRING: COLOR_STRING14,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY4,
  FUNCTION: FUNCTION9,
  LINE_DASH: LINE_DASH11,
  OBJECT: OBJECT13,
  POSITIVE_NUMBER: POSITIVE_NUMBER18,
  RATIO: RATIO19,
  STRING: STRING13,
  Validate: Validate40,
  SeriesProperties: SeriesProperties5,
  SeriesTooltip: SeriesTooltip9
} = _ModuleSupport68;
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
  Validate40(GEOJSON_OBJECT, { optional: true })
], MapShapeSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate40(STRING13, { optional: true })
], MapShapeSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate40(STRING13, { optional: true })
], MapShapeSeriesProperties.prototype, "legendItemName", 2);
__decorateClass([
  Validate40(STRING13)
], MapShapeSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate40(STRING13, { optional: true })
], MapShapeSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate40(STRING13)
], MapShapeSeriesProperties.prototype, "topologyIdKey", 2);
__decorateClass([
  Validate40(STRING13, { optional: true })
], MapShapeSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate40(STRING13, { optional: true })
], MapShapeSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate40(STRING13, { optional: true })
], MapShapeSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate40(STRING13, { optional: true })
], MapShapeSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate40(AND10(COLOR_STRING_ARRAY4, ARRAY7.restrict({ minLength: 1 })), { optional: true })
], MapShapeSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate40(COLOR_STRING14)
], MapShapeSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate40(RATIO19)
], MapShapeSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate40(COLOR_STRING14)
], MapShapeSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate40(RATIO19)
], MapShapeSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate40(POSITIVE_NUMBER18)
], MapShapeSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate40(LINE_DASH11)
], MapShapeSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate40(POSITIVE_NUMBER18)
], MapShapeSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate40(POSITIVE_NUMBER18)
], MapShapeSeriesProperties.prototype, "padding", 2);
__decorateClass([
  Validate40(FUNCTION9, { optional: true })
], MapShapeSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate40(OBJECT13)
], MapShapeSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate40(OBJECT13)
], MapShapeSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeSeries.ts
var { getMissCount: getMissCount4, createDatumId: createDatumId6, DataModelSeries: DataModelSeries4, SeriesNodePickMode: SeriesNodePickMode8, valueProperty: valueProperty8, Validate: Validate41 } = _ModuleSupport69;
var { ColorScale: ColorScale4 } = _Scale16;
var { Group: Group10, Selection: Selection7, Text: Text8, PointerEvents: PointerEvents4 } = _Scene39;
var { sanitizeHtml: sanitizeHtml6, Logger: Logger12 } = _Util38;
var fixedScale = _ModuleSupport69.MercatorScale.fixedScale();
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
    this.itemGroup = this.contentGroup.appendChild(new Group10({ name: "itemGroup" }));
    this.itemLabelGroup = this.contentGroup.appendChild(new Group10({ name: "itemLabelGroup" }));
    this.datumSelection = Selection7.select(
      this.itemGroup,
      () => this.nodeFactory()
    );
    this.labelSelection = Selection7.select(
      this.itemLabelGroup,
      Text8
    );
    this.highlightDatumSelection = Selection7.select(
      this.highlightNode,
      () => this.nodeFactory()
    );
    this.previousLabelLayouts = void 0;
    this._previousDatumMidPoint = void 0;
    this.itemLabelGroup.pointerEvents = PointerEvents4.None;
    this.showFocusBox = false;
  }
  getNodeData() {
    var _a2;
    return (_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData;
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
      var _a2;
      if (this.data == null || !this.properties.isValid()) {
        return;
      }
      const { data, topology, colorScale } = this;
      const { topologyIdKey, idKey, colorKey, labelKey, colorRange } = this.properties;
      const featureById = /* @__PURE__ */ new Map();
      topology == null ? void 0 : topology.features.forEach((feature) => {
        var _a3;
        const property = (_a3 = feature.properties) == null ? void 0 : _a3[topologyIdKey];
        if (property == null || !containsType(feature.geometry, 1 /* Polygon */))
          return;
        featureById.set(property, feature);
      });
      const colorScaleType = this.colorScale.type;
      const mercatorScaleType = (_a2 = this.scale) == null ? void 0 : _a2.type;
      const { dataModel, processedData } = yield this.requestDataModel(dataController, data, {
        props: [
          valueProperty8(idKey, mercatorScaleType, { id: "idValue", includeProperty: false }),
          valueProperty8(idKey, mercatorScaleType, {
            id: "featureValue",
            includeProperty: false,
            processor: () => (datum) => featureById.get(datum)
          }),
          ...labelKey ? [valueProperty8(labelKey, "band", { id: "labelValue" })] : [],
          ...colorKey ? [valueProperty8(colorKey, colorScaleType, { id: "colorValue" })] : []
        ]
      });
      const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`);
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
        const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
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
    const colorIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
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
  getLabelDatum(labelLayout, scaling) {
    const { scale } = this;
    if (scale == null)
      return;
    const { padding, label } = this.properties;
    const { labelText, aspectRatio, x: untruncatedX, y, maxWidth, fixedPolygon } = labelLayout;
    const maxSizeWithoutTruncation = {
      width: Math.ceil(maxWidth * scaling),
      height: Math.ceil(maxWidth * scaling / aspectRatio),
      meta: untruncatedX
    };
    const labelFormatting = formatSingleLabel(
      labelText,
      label,
      { padding },
      (height, allowTruncation) => {
        if (!allowTruncation)
          return maxSizeWithoutTruncation;
        const result = maxWidthInPolygonForRectOfHeight(fixedPolygon, untruncatedX, y, height / scaling);
        return {
          width: result.width * scaling,
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
    const x = width < maxSizeWithoutTruncation.width ? untruncatedX : formattingX;
    const position = this.scale.convert(fixedScale.invert([x, y]));
    return {
      x: position[0],
      y: position[1],
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
        return;
      const scaling = scale != null ? (scale.range[1][0] - scale.range[0][0]) / scale.bounds.width : NaN;
      const colorScaleValid = this.isColorScaleValid();
      const idIdx = dataModel.resolveProcessedDataIndexById(this, `idValue`);
      const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`);
      const labelIdx = labelKey != null ? dataModel.resolveProcessedDataIndexById(this, `labelValue`) : void 0;
      const colorIdx = colorKey != null ? dataModel.resolveProcessedDataIndexById(this, `colorValue`) : void 0;
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
        const labelDatum = labelLayout != null && scale != null ? this.getLabelDatum(labelLayout, scaling) : void 0;
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
      return {
        itemId: seriesId,
        nodeData,
        labelData
      };
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
      const nodeData = (_c = (_b = this.contextNodeData) == null ? void 0 : _b.nodeData) != null ? _c : [];
      const labelData = (_e = (_d = this.contextNodeData) == null ? void 0 : _d.labelData) != null ? _e : [];
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
      const colorDomain = processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, "colorValue")];
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
      return _ModuleSupport69.EMPTY_TOOLTIP_CONTENT;
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
    const { datum, fill, idValue, colorValue, labelValue, itemId } = nodeDatum;
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
        color,
        colorKey,
        colorName,
        idName,
        itemId,
        labelKey,
        labelName
      }, this.getModuleTooltipParams())
    );
  }
  computeFocusBounds(opts) {
    return computeGeoFocusBounds(this, opts);
  }
};
MapShapeSeries.className = "MapShapeSeries";
MapShapeSeries.type = "map-shape";
__decorateClass([
  Validate41(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapShapeSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeModule.ts
var {
  EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS4,
  DEFAULT_INVERTED_LABEL_COLOUR,
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE: DEFAULT_DIVERGING_SERIES_COLOUR_RANGE3,
  DEFAULT_BACKGROUND_COLOUR: DEFAULT_BACKGROUND_COLOUR2,
  singleSeriesPaletteFactory: singleSeriesPaletteFactory3
} = _Theme22;
var MapShapeModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-shape",
  instanceConstructor: MapShapeSeries,
  themeTemplate: __spreadProps(__spreadValues({}, MAP_THEME_DEFAULTS), {
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
    }
  }),
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
import { _Theme as _Theme24 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleSeries.ts
import { _Scene as _Scene44 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesBase.ts
import { _ModuleSupport as _ModuleSupport71, _Scale as _Scale17, _Scene as _Scene40, _Util as _Util39 } from "ag-charts-community";
var {
  isDefined: isDefined3,
  ChartAxisDirection: ChartAxisDirection9,
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
  animationValidation: animationValidation4,
  isFiniteNumber: isFiniteNumber5,
  SeriesNodePickMode: SeriesNodePickMode9,
  computeSectorFocusBounds
} = _ModuleSupport71;
var { BandScale: BandScale3 } = _Scale17;
var { motion: motion3 } = _Scene40;
var { isNumber, normalizeAngle360: normalizeAngle3605, sanitizeHtml: sanitizeHtml7 } = _Util39;
var RadialColumnSeriesNodeEvent = class extends _ModuleSupport71.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadialColumnSeriesBase = class extends _ModuleSupport71.PolarSeries {
  constructor(moduleCtx, {
    animationResetFns
  }) {
    super({
      moduleCtx,
      useLabelLayer: true,
      canHaveAxes: true,
      pickModes: [SeriesNodePickMode9.EXACT_SHAPE_MATCH],
      animationResetFns: __spreadProps(__spreadValues({}, animationResetFns), {
        label: resetLabelFn
      })
    });
    this.NodeEvent = RadialColumnSeriesNodeEvent;
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
    if (direction === ChartAxisDirection9.X) {
      return dataModel.getDomain(this, "angleValue", "key", processedData);
    } else {
      const radiusAxis = axes[ChartAxisDirection9.Y];
      const yExtent = dataModel.getDomain(this, "radiusValue-end", "value", processedData);
      const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
      return fixNumericExtent4(fixedYExtent, radiusAxis);
    }
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b;
      const { angleKey, radiusKey, normalizedTo, visible } = this.properties;
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      if (!this.properties.isValid() || !(visible || animationEnabled))
        return;
      const stackGroupId = this.getStackId();
      const stackGroupTrailingId = `${stackGroupId}-trailing`;
      const extraProps = [];
      if (isDefined3(normalizedTo)) {
        extraProps.push(normaliseGroupTo([stackGroupId, stackGroupTrailingId], Math.abs(normalizedTo), "range"));
      }
      if (animationEnabled && this.processedData) {
        extraProps.push(diff4(this.processedData));
      }
      if (animationEnabled) {
        extraProps.push(animationValidation4());
      }
      const visibleProps = visible || !animationEnabled ? {} : { forceValue: 0 };
      const radiusScaleType = (_a2 = this.axes[ChartAxisDirection9.Y]) == null ? void 0 : _a2.scale.type;
      const angleScaleType = (_b = this.axes[ChartAxisDirection9.X]) == null ? void 0 : _b.scale.type;
      yield this.requestDataModel(dataController, this.data, {
        props: [
          keyProperty4(angleKey, angleScaleType, { id: "angleValue" }),
          valueProperty9(radiusKey, radiusScaleType, __spreadValues({
            id: "radiusValue-raw",
            invalidValue: null
          }, visibleProps)),
          ...groupAccumulativeValueProperty2(
            radiusKey,
            "normal",
            "current",
            __spreadValues({
              id: `radiusValue-end`,
              rangeId: `radiusValue-range`,
              invalidValue: null,
              groupId: stackGroupId,
              separateNegative: true
            }, visibleProps),
            radiusScaleType
          ),
          ...groupAccumulativeValueProperty2(
            radiusKey,
            "trailing",
            "current",
            __spreadValues({
              id: `radiusValue-start`,
              invalidValue: null,
              groupId: stackGroupTrailingId,
              separateNegative: true
            }, visibleProps),
            radiusScaleType
          ),
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
  isRadiusAxisReversed() {
    var _a2;
    return (_a2 = this.axes[ChartAxisDirection9.Y]) == null ? void 0 : _a2.isReversed();
  }
  maybeRefreshNodeData() {
    return __async(this, null, function* () {
      var _a2;
      const circleChanged = this.didCircleChange();
      if (!circleChanged && !this.nodeDataRefresh)
        return;
      const { nodeData = [] } = (_a2 = yield this.createNodeData()) != null ? _a2 : {};
      this.nodeData = nodeData;
      this.nodeDataRefresh = false;
    });
  }
  getAxisInnerRadius() {
    const radiusAxis = this.axes[ChartAxisDirection9.Y];
    return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2;
      const { processedData, dataModel, groupScale } = this;
      if (!processedData || !dataModel || !this.properties.isValid()) {
        return;
      }
      const angleAxis = this.axes[ChartAxisDirection9.X];
      const radiusAxis = this.axes[ChartAxisDirection9.Y];
      const angleScale = angleAxis == null ? void 0 : angleAxis.scale;
      const radiusScale = radiusAxis == null ? void 0 : radiusAxis.scale;
      if (!angleScale || !radiusScale) {
        return;
      }
      const radiusStartIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-start`);
      const radiusEndIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-end`);
      const radiusRangeIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-range`);
      const radiusRawIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-raw`);
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
          (value) => isFiniteNumber5(value) ? value.toFixed(2) : String(value)
        );
        if (labelText) {
          return { x, y, text: labelText, textAlign: "center", textBaseline: "middle" };
        }
      };
      const nodeData = [];
      const context = { itemId: radiusKey, nodeData, labelData: nodeData };
      if (!this.visible)
        return context;
      processedData.data.forEach((group, index, data) => {
        var _a3;
        const { datum, keys, values, aggValues } = group;
        const angleDatum = keys[0];
        const radiusDatum = values[radiusRawIndex];
        const isPositive = radiusDatum >= 0 && !Object.is(radiusDatum, -0);
        const innerRadiusDatum = values[radiusStartIndex];
        const outerRadiusDatum = values[radiusEndIndex];
        const radiusRange = (_a3 = aggValues == null ? void 0 : aggValues[radiusRangeIndex][isPositive ? 1 : 0]) != null ? _a3 : 0;
        const negative = isPositive === radiusAxisReversed;
        if (innerRadiusDatum === void 0 || outerRadiusDatum === void 0) {
          return;
        }
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
        const stackInnerRadius = axisTotalRadius - radiusScale.convert(0);
        const stackOuterRadius = axisTotalRadius - radiusScale.convert(radiusRange);
        const x = Math.cos(angle) * midRadius;
        const y = Math.sin(angle) * midRadius;
        const labelNodeDatum = this.properties.label.enabled ? getLabelNodeDatum(datum, radiusDatum, x, y) : void 0;
        const columnWidth = this.getColumnWidth(startAngle, endAngle);
        nodeData.push({
          series: this,
          datum,
          point: { x, y, size: 0 },
          midPoint: { x, y },
          label: labelNodeDatum,
          angleValue: angleDatum,
          radiusValue: radiusDatum,
          negative,
          innerRadius,
          outerRadius,
          stackInnerRadius,
          stackOuterRadius,
          startAngle,
          endAngle,
          axisInnerRadius,
          axisOuterRadius,
          columnWidth,
          index
        });
      });
      return { itemId: radiusKey, nodeData, labelData: nodeData };
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
    seriesLabelFadeInAnimation2(this, "labels", this.ctx.animationManager, labelSelection);
  }
  animateClearingUpdateEmpty() {
    const { itemSelection } = this;
    const { animationManager } = this.ctx;
    const fns = this.getColumnTransitionFunctions();
    motion3.fromToMotion(this.id, "datums", animationManager, [itemSelection], fns);
    seriesLabelFadeOutAnimation(this, "labels", animationManager, this.labelSelection);
  }
  getTooltipHtml(nodeDatum) {
    var _a2;
    const { id: seriesId, axes, dataModel } = this;
    const { angleKey, radiusKey, angleName, radiusName, fill, stroke, strokeWidth, formatter, tooltip } = this.properties;
    const { angleValue, radiusValue, datum, itemId } = nodeDatum;
    const xAxis = axes[ChartAxisDirection9.X];
    const yAxis = axes[ChartAxisDirection9.Y];
    if (!this.properties.isValid() || !(xAxis && yAxis && isNumber(radiusValue)) || !dataModel) {
      return _ModuleSupport71.EMPTY_TOOLTIP_CONTENT;
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
      {
        seriesId,
        datum,
        color,
        title,
        angleKey,
        radiusKey,
        angleName,
        radiusName,
        angleValue,
        itemId,
        radiusValue
      }
    );
  }
  pickNodeClosestDatum(point) {
    return this.pickNodeNearestDistantObject(point, this.itemSelection.nodes());
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
  computeFocusBounds(opts) {
    return computeSectorFocusBounds(this, opts);
  }
};

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport73 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesBaseProperties.ts
import { _ModuleSupport as _ModuleSupport72, _Scene as _Scene41 } from "ag-charts-community";
var { Label: Label4 } = _Scene41;
var {
  SeriesProperties: SeriesProperties6,
  SeriesTooltip: SeriesTooltip10,
  Validate: Validate42,
  COLOR_STRING: COLOR_STRING15,
  DEGREE: DEGREE3,
  FUNCTION: FUNCTION10,
  LINE_DASH: LINE_DASH12,
  NUMBER: NUMBER10,
  OBJECT: OBJECT14,
  POSITIVE_NUMBER: POSITIVE_NUMBER19,
  RATIO: RATIO20,
  STRING: STRING14
} = _ModuleSupport72;
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
  Validate42(STRING14)
], RadialColumnSeriesBaseProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate42(STRING14, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "angleName", 2);
__decorateClass([
  Validate42(STRING14)
], RadialColumnSeriesBaseProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate42(STRING14, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate42(COLOR_STRING15)
], RadialColumnSeriesBaseProperties.prototype, "fill", 2);
__decorateClass([
  Validate42(RATIO20)
], RadialColumnSeriesBaseProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate42(COLOR_STRING15)
], RadialColumnSeriesBaseProperties.prototype, "stroke", 2);
__decorateClass([
  Validate42(POSITIVE_NUMBER19)
], RadialColumnSeriesBaseProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate42(RATIO20)
], RadialColumnSeriesBaseProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate42(LINE_DASH12)
], RadialColumnSeriesBaseProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate42(POSITIVE_NUMBER19)
], RadialColumnSeriesBaseProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate42(FUNCTION10, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "formatter", 2);
__decorateClass([
  Validate42(DEGREE3)
], RadialColumnSeriesBaseProperties.prototype, "rotation", 2);
__decorateClass([
  Validate42(STRING14, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "stackGroup", 2);
__decorateClass([
  Validate42(NUMBER10, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "normalizedTo", 2);
__decorateClass([
  Validate42(OBJECT14)
], RadialColumnSeriesBaseProperties.prototype, "label", 2);
__decorateClass([
  Validate42(OBJECT14)
], RadialColumnSeriesBaseProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleSeriesProperties.ts
var { Validate: Validate43, POSITIVE_NUMBER: POSITIVE_NUMBER20 } = _ModuleSupport73;
var NightingaleSeriesProperties = class extends RadialColumnSeriesBaseProperties {
  constructor() {
    super(...arguments);
    this.cornerRadius = 0;
  }
};
__decorateClass([
  Validate43(POSITIVE_NUMBER20)
], NightingaleSeriesProperties.prototype, "cornerRadius", 2);

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleUtil.ts
import { _Scene as _Scene43 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnUtil.ts
import { _Scene as _Scene42 } from "ag-charts-community";
var { motion: motion4 } = _Scene42;
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
var { SectorBox, motion: motion5 } = _Scene43;
function getRadii(datum) {
  const { negative, innerRadius, outerRadius, stackInnerRadius, stackOuterRadius } = datum;
  return {
    innerRadius: negative ? stackOuterRadius : stackInnerRadius,
    outerRadius: negative ? stackInnerRadius : stackOuterRadius,
    clipInnerRadius: negative ? outerRadius : innerRadius,
    clipOuterRadius: negative ? innerRadius : outerRadius
  };
}
function prepareNightingaleAnimationFunctions(axisZeroRadius) {
  const angles = createAngleMotionCalculator();
  const fromFn = (sect, datum, status) => {
    status = fixRadialColumnAnimationStatus(sect, datum, status);
    angles.calculate(sect, datum, status);
    const { startAngle, endAngle } = angles.from(datum);
    let innerRadius;
    let outerRadius;
    let clipSector;
    if (status === "removed" || status === "updated") {
      innerRadius = sect.innerRadius;
      outerRadius = sect.outerRadius;
      clipSector = sect.clipSector;
    } else {
      innerRadius = axisZeroRadius;
      outerRadius = axisZeroRadius;
    }
    clipSector != null ? clipSector : clipSector = new SectorBox(startAngle, endAngle, innerRadius, outerRadius);
    const phase = motion5.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
    return { innerRadius, outerRadius, startAngle, endAngle, clipSector, phase };
  };
  const toFn = (_sect, datum, status) => {
    const { startAngle, endAngle } = angles.to(datum);
    let innerRadius;
    let outerRadius;
    let clipSector;
    if (status === "removed") {
      innerRadius = axisZeroRadius;
      outerRadius = axisZeroRadius;
      clipSector = new SectorBox(startAngle, endAngle, innerRadius, outerRadius);
    } else {
      let clipInnerRadius, clipOuterRadius;
      ({ innerRadius, outerRadius, clipInnerRadius, clipOuterRadius } = getRadii(datum));
      if (isNaN(innerRadius))
        innerRadius = axisZeroRadius;
      if (isNaN(outerRadius))
        outerRadius = axisZeroRadius;
      if (isNaN(clipInnerRadius))
        clipInnerRadius = axisZeroRadius;
      if (isNaN(clipOuterRadius))
        clipOuterRadius = axisZeroRadius;
      clipSector = new SectorBox(startAngle, endAngle, clipInnerRadius, clipOuterRadius);
    }
    return { innerRadius, outerRadius, startAngle, endAngle, clipSector };
  };
  return { toFn, fromFn };
}
function resetNightingaleSelectionFn(_sect, datum) {
  const { startAngle, endAngle } = datum;
  const { innerRadius, outerRadius, clipInnerRadius, clipOuterRadius } = getRadii(datum);
  const clipSector = new SectorBox(startAngle, endAngle, clipInnerRadius, clipOuterRadius);
  return { innerRadius, outerRadius, startAngle, endAngle, clipSector };
}

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleSeries.ts
var { Sector: Sector3, SectorBox: SectorBox2 } = _Scene44;
var NightingaleSeries = class extends RadialColumnSeriesBase {
  // TODO: Enable once the options contract has been revisited
  // @Validate(POSITIVE_NUMBER)
  // sectorSpacing = 1;
  constructor(moduleCtx) {
    super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
    this.properties = new NightingaleSeriesProperties();
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
    const { negative } = datum;
    node.centerX = 0;
    node.centerY = 0;
    node.startOuterCornerRadius = !negative ? this.properties.cornerRadius : 0;
    node.endOuterCornerRadius = !negative ? this.properties.cornerRadius : 0;
    node.startInnerCornerRadius = negative ? this.properties.cornerRadius : 0;
    node.endInnerCornerRadius = negative ? this.properties.cornerRadius : 0;
    if (highlight) {
      const { startAngle, endAngle } = datum;
      const { innerRadius, outerRadius, clipInnerRadius, clipOuterRadius } = getRadii(datum);
      node.innerRadius = innerRadius;
      node.outerRadius = outerRadius;
      node.startAngle = startAngle;
      node.endAngle = endAngle;
      node.clipSector = new SectorBox2(startAngle, endAngle, clipInnerRadius, clipOuterRadius);
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
import { _Theme as _Theme23 } from "ag-charts-community";
var NIGHTINGALE_SERIES_THEME = {
  series: {
    __extends__: _Theme23.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 1,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme23.DEFAULT_FONT_FAMILY,
      color: _Theme23.DEFAULT_LABEL_COLOUR
    }
  },
  axes: {
    [_Theme23.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      shape: _Theme23.POLAR_AXIS_SHAPE.CIRCLE,
      groupPaddingInner: 0,
      paddingInner: 0,
      label: {
        padding: 10
      }
    },
    [_Theme23.POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
      shape: _Theme23.POLAR_AXIS_SHAPE.CIRCLE
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
      type: _Theme24.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: _Theme24.POLAR_AXIS_TYPE.RADIUS_NUMBER
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
      stroke: userPalette ? stroke : _Theme24.DEFAULT_POLAR_SERIES_STROKE
    };
  },
  stackable: true,
  groupable: true,
  stackedByDefault: true
};

// packages/ag-charts-enterprise/src/series/ohlc/ohlcModule.ts
import { _Theme as _Theme26 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/ohlc/ohlcSeries.ts
import {
  _ModuleSupport as _ModuleSupport77
} from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/ohlc/ohlcGroup.ts
import { _Scene as _Scene45 } from "ag-charts-community";
var OhlcGroup = class extends CandlestickBaseGroup {
  constructor() {
    super();
    this.append([
      new _Scene45.Line({ tag: 0 /* Body */ }),
      new _Scene45.Line({ tag: 1 /* Open */ }),
      new _Scene45.Line({ tag: 2 /* Close */ })
    ]);
  }
  updateCoordinates() {
    const {
      x,
      y,
      yBottom,
      yHigh,
      yLow,
      width,
      height,
      datum: { itemId }
    } = this;
    const selection = _Scene45.Selection.select(this, _Scene45.Rect);
    const [body] = selection.selectByTag(0 /* Body */);
    const [open] = selection.selectByTag(1 /* Open */);
    const [close] = selection.selectByTag(2 /* Close */);
    if (width === 0 || height === 0) {
      body.visible = false;
      open.visible = false;
      close.visible = false;
      return;
    }
    body.visible = true;
    open.visible = true;
    close.visible = true;
    const halfWidth = width / 2;
    body.setProperties({
      x1: Math.floor(x + halfWidth),
      x2: Math.floor(x + halfWidth),
      y1: yHigh,
      y2: yLow
    });
    const isRising = itemId === "up";
    const openY = isRising ? yBottom : y;
    const closeY = isRising ? y : yBottom;
    open.setProperties({
      x1: Math.floor(x),
      x2: Math.floor(x + halfWidth),
      y: Math.round(openY)
    });
    close.setProperties({
      x1: Math.floor(x + halfWidth),
      x2: Math.floor(x + width),
      y: Math.round(closeY)
    });
  }
  updateDatumStyles(_datum, activeStyles) {
    const selection = _Scene45.Selection.select(this, _Scene45.Rect);
    const [body] = selection.selectByTag(0 /* Body */);
    const [open] = selection.selectByTag(1 /* Open */);
    const [close] = selection.selectByTag(2 /* Close */);
    body.setProperties(activeStyles);
    open.setProperties(activeStyles);
    close.setProperties(activeStyles);
  }
};

// packages/ag-charts-enterprise/src/series/ohlc/ohlcSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport76 } from "ag-charts-community";
var { BaseProperties: BaseProperties9, Validate: Validate44, COLOR_STRING: COLOR_STRING16, FUNCTION: FUNCTION11, LINE_DASH: LINE_DASH13, OBJECT: OBJECT15, POSITIVE_NUMBER: POSITIVE_NUMBER21, RATIO: RATIO21 } = _ModuleSupport76;
var OhlcSeriesItem = class extends BaseProperties9 {
  constructor() {
    super(...arguments);
    this.stroke = "#333";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
  }
};
__decorateClass([
  Validate44(COLOR_STRING16)
], OhlcSeriesItem.prototype, "stroke", 2);
__decorateClass([
  Validate44(POSITIVE_NUMBER21)
], OhlcSeriesItem.prototype, "strokeWidth", 2);
__decorateClass([
  Validate44(RATIO21)
], OhlcSeriesItem.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate44(LINE_DASH13)
], OhlcSeriesItem.prototype, "lineDash", 2);
__decorateClass([
  Validate44(POSITIVE_NUMBER21)
], OhlcSeriesItem.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate44(FUNCTION11, { optional: true })
], OhlcSeriesItem.prototype, "formatter", 2);
var OhlcSeriesItems = class extends BaseProperties9 {
  constructor() {
    super(...arguments);
    this.up = new OhlcSeriesItem();
    this.down = new OhlcSeriesItem();
  }
};
__decorateClass([
  Validate44(OBJECT15)
], OhlcSeriesItems.prototype, "up", 2);
__decorateClass([
  Validate44(OBJECT15)
], OhlcSeriesItems.prototype, "down", 2);
var OhlcSeriesProperties = class extends CandlestickSeriesBaseProperties {
  constructor() {
    super(new OhlcSeriesItems());
  }
};

// packages/ag-charts-enterprise/src/series/ohlc/ohlcSeries.ts
var { mergeDefaults: mergeDefaults7 } = _ModuleSupport77;
var OhlcSeries = class extends CandlestickSeriesBase {
  constructor(moduleCtx) {
    super(moduleCtx, resetCandlestickSelectionsFn);
    this.properties = new OhlcSeriesProperties();
  }
  createNodeData() {
    return __async(this, null, function* () {
      const baseNodeData = this.createBaseNodeData();
      if (!baseNodeData) {
        return;
      }
      const nodeData = baseNodeData.nodeData.map((datum) => {
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.getItemConfig(datum.itemId);
        return __spreadProps(__spreadValues({}, datum), {
          stroke,
          strokeWidth,
          strokeOpacity,
          lineDash,
          lineDashOffset
        });
      });
      return __spreadProps(__spreadValues({}, baseNodeData), { nodeData });
    });
  }
  nodeFactory() {
    return new OhlcGroup();
  }
  getFormatterParams(params) {
    return params;
  }
  getSeriesStyles(nodeDatum) {
    const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = nodeDatum;
    return {
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset
    };
  }
  getActiveStyles(nodeDatum, highlighted) {
    const activeStyles = this.getFormattedStyles(nodeDatum, highlighted);
    return highlighted ? mergeDefaults7(this.properties.highlightStyle.item, activeStyles) : activeStyles;
  }
  computeFocusBounds(opts) {
    return computeCandleFocusBounds(this, opts);
  }
};
OhlcSeries.className = "ohlc";
OhlcSeries.type = "ohlc";

// packages/ag-charts-enterprise/src/series/ohlc/ohlcThemes.ts
import { _Theme as _Theme25 } from "ag-charts-community";
var OHLC_SERIES_THEME = {
  series: {
    __extends__: _Theme25.EXTENDS_SERIES_DEFAULTS,
    direction: "vertical"
  },
  animation: { enabled: false },
  axes: {
    [_Theme25.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        snap: false
      }
    },
    [_Theme25.CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
      groupPaddingInner: 0,
      crosshair: {
        enabled: true
      }
    }
  }
};

// packages/ag-charts-enterprise/src/series/ohlc/ohlcModule.ts
var OhlcModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "ohlc",
  instanceConstructor: OhlcSeries,
  defaultAxes: [
    {
      type: _Theme26.CARTESIAN_AXIS_TYPE.NUMBER,
      position: _Theme26.POSITION.LEFT
    },
    {
      type: _Theme26.CARTESIAN_AXIS_TYPE.ORDINAL_TIME,
      position: _Theme26.POSITION.BOTTOM
    }
  ],
  themeTemplate: OHLC_SERIES_THEME,
  groupable: false,
  paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
    const {
      strokes: [stroke]
    } = takeColors(colorsCount);
    const { strokes: DEFAULT_STROKES } = themeTemplateParameters.properties.get(
      _Theme26.DEFAULT_COLOURS
    );
    return {
      item: {
        up: {
          stroke: userPalette ? stroke : DEFAULT_STROKES.GREEN
        },
        down: {
          stroke: userPalette ? stroke : DEFAULT_STROKES.RED
        }
      }
    };
  }
};

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaModule.ts
import { _ModuleSupport as _ModuleSupport83, _Theme as _Theme28 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radar/radarThemes.ts
import { _ModuleSupport as _ModuleSupport78, _Theme as _Theme27 } from "ag-charts-community";
var BASE_RADAR_SERIES_THEME = {
  series: {
    __extends__: _Theme27.EXTENDS_SERIES_DEFAULTS,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme27.DEFAULT_FONT_FAMILY,
      color: _Theme27.DEFAULT_LABEL_COLOUR
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
    [_Theme27.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      label: {
        padding: 10
      }
    }
  }
};
var RADAR_LINE_SERIES_THEME = _ModuleSupport78.mergeDefaults(
  {
    series: {
      strokeWidth: 2
    }
  },
  BASE_RADAR_SERIES_THEME
);
var RADAR_AREA_SERIES_THEME = _ModuleSupport78.mergeDefaults(
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
import { _ModuleSupport as _ModuleSupport82, _Scene as _Scene50 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radar/radarSeries.ts
import { _ModuleSupport as _ModuleSupport80, _Scene as _Scene49, _Util as _Util41 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radar/radarSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport79, _Scene as _Scene48 } from "ag-charts-community";
var { Label: Label5 } = _Scene48;
var {
  SeriesMarker,
  SeriesProperties: SeriesProperties7,
  SeriesTooltip: SeriesTooltip11,
  Validate: Validate45,
  BOOLEAN: BOOLEAN15,
  COLOR_STRING: COLOR_STRING17,
  DEGREE: DEGREE4,
  FUNCTION: FUNCTION12,
  LINE_DASH: LINE_DASH14,
  OBJECT: OBJECT16,
  POSITIVE_NUMBER: POSITIVE_NUMBER22,
  RATIO: RATIO22,
  STRING: STRING15
} = _ModuleSupport79;
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
  Validate45(STRING15)
], RadarSeriesProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate45(STRING15)
], RadarSeriesProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate45(STRING15, { optional: true })
], RadarSeriesProperties.prototype, "angleName", 2);
__decorateClass([
  Validate45(STRING15, { optional: true })
], RadarSeriesProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate45(COLOR_STRING17)
], RadarSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate45(POSITIVE_NUMBER22)
], RadarSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate45(RATIO22)
], RadarSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate45(LINE_DASH14)
], RadarSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate45(POSITIVE_NUMBER22)
], RadarSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate45(FUNCTION12, { optional: true })
], RadarSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate45(DEGREE4)
], RadarSeriesProperties.prototype, "rotation", 2);
__decorateClass([
  Validate45(OBJECT16)
], RadarSeriesProperties.prototype, "marker", 2);
__decorateClass([
  Validate45(OBJECT16)
], RadarSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate45(OBJECT16)
], RadarSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate45(BOOLEAN15)
], RadarSeriesProperties.prototype, "connectMissingData", 2);

// packages/ag-charts-enterprise/src/series/radar/radarSeries.ts
var {
  ChartAxisDirection: ChartAxisDirection10,
  PolarAxis: PolarAxis2,
  SeriesNodePickMode: SeriesNodePickMode10,
  valueProperty: valueProperty10,
  fixNumericExtent: fixNumericExtent5,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation3,
  markerFadeInAnimation,
  resetMarkerFn,
  animationValidation: animationValidation5,
  isFiniteNumber: isFiniteNumber6,
  computeMarkerFocusBounds: computeMarkerFocusBounds2
} = _ModuleSupport80;
var { BBox: BBox9, Group: Group11, Path: Path6, PointerEvents: PointerEvents5, Selection: Selection8, Text: Text9, getMarker: getMarker2 } = _Scene49;
var { extent: extent3, isNumberEqual: isNumberEqual8, sanitizeHtml: sanitizeHtml8, toFixed } = _Util41;
var RadarSeriesNodeEvent = class extends _ModuleSupport80.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadarSeries = class extends _ModuleSupport80.PolarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode10.NEAREST_NODE, SeriesNodePickMode10.EXACT_SHAPE_MATCH],
      canHaveAxes: true,
      animationResetFns: {
        item: resetMarkerFn
      }
    });
    this.properties = new RadarSeriesProperties();
    this.NodeEvent = RadarSeriesNodeEvent;
    this.resetInvalidToZero = false;
    this.seriesItemEnabled = [];
    this.circleCache = { r: 0, cx: 0, cy: 0 };
    const lineGroup = new Group11();
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
    if (direction === ChartAxisDirection10.X) {
      return dataModel.getDomain(this, `angleValue`, "value", processedData);
    } else {
      const domain = dataModel.getDomain(this, `radiusValue`, "value", processedData);
      const ext = extent3(domain.length === 0 ? domain : [0].concat(domain));
      return fixNumericExtent5(ext);
    }
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b;
      if (!this.properties.isValid()) {
        return;
      }
      const { angleKey, radiusKey } = this.properties;
      const extraProps = [];
      if (!this.ctx.animationManager.isSkipped()) {
        extraProps.push(animationValidation5());
      }
      const radiusScaleType = (_a2 = this.axes[ChartAxisDirection10.Y]) == null ? void 0 : _a2.scale.type;
      const angleScaleType = (_b = this.axes[ChartAxisDirection10.X]) == null ? void 0 : _b.scale.type;
      yield this.requestDataModel(dataController, this.data, {
        props: [
          valueProperty10(angleKey, angleScaleType, { id: "angleValue" }),
          valueProperty10(radiusKey, radiusScaleType, { id: "radiusValue", invalidValue: void 0 }),
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
    const radiusAxis = this.axes[ChartAxisDirection10.Y];
    return radiusAxis instanceof PolarAxis2 ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  maybeRefreshNodeData() {
    return __async(this, null, function* () {
      var _a2;
      const didCircleChange = this.didCircleChange();
      if (!didCircleChange && !this.nodeDataRefresh)
        return;
      const { nodeData = [] } = (_a2 = yield this.createNodeData()) != null ? _a2 : {};
      this.nodeData = nodeData;
      this.nodeDataRefresh = false;
    });
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b;
      const { processedData, dataModel } = this;
      if (!processedData || !dataModel || !this.properties.isValid()) {
        return;
      }
      const { angleKey, radiusKey, angleName, radiusName, marker, label } = this.properties;
      const angleScale = (_a2 = this.axes[ChartAxisDirection10.X]) == null ? void 0 : _a2.scale;
      const radiusScale = (_b = this.axes[ChartAxisDirection10.Y]) == null ? void 0 : _b.scale;
      if (!angleScale || !radiusScale) {
        return;
      }
      const angleIdx = dataModel.resolveProcessedDataIndexById(this, `angleValue`);
      const radiusIdx = dataModel.resolveProcessedDataIndexById(this, `radiusValue`);
      const axisInnerRadius = this.getAxisInnerRadius();
      const { seriesItemEnabled } = this;
      seriesItemEnabled.length = 0;
      const nodeData = processedData.data.map((group) => {
        const { datum, values } = group;
        const angleDatum = values[angleIdx];
        const radiusDatum = values[radiusIdx];
        const angle = angleScale.convert(angleDatum);
        const radius = this.radius + axisInnerRadius - radiusScale.convert(radiusDatum);
        if (_Util41.isNumber(angle) && _Util41.isNumber(radius)) {
          seriesItemEnabled.push(true);
        } else {
          seriesItemEnabled.push(false);
        }
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = cos * radius;
        const y = sin * radius;
        let labelNodeDatum;
        if (label.enabled) {
          const labelText = this.getLabelText(
            label,
            { value: radiusDatum, datum, angleKey, radiusKey, angleName, radiusName },
            (value) => isFiniteNumber6(value) ? value.toFixed(2) : String(value)
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
      return { itemId: radiusKey, nodeData, labelData: nodeData };
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
      return _ModuleSupport80.EMPTY_TOOLTIP_CONTENT;
    }
    const { id: seriesId } = this;
    const { angleKey, radiusKey, angleName, radiusName, marker, tooltip } = this.properties;
    const { datum, angleValue, radiusValue, itemId } = nodeDatum;
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
      {
        datum,
        angleKey,
        angleName,
        radiusKey,
        radiusName,
        title,
        color,
        seriesId,
        itemId
      }
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
      return BBox9.merge(textBoxes);
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
    const radiusAxis = this.axes[ChartAxisDirection10.Y];
    const angleAxis = this.axes[ChartAxisDirection10.X];
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
    path.clear(true);
    const axisInnerRadius = this.getAxisInnerRadius();
    const radiusAxis = this.axes[ChartAxisDirection10.Y];
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
    markerFadeInAnimation(this, animationManager, "added", itemSelection);
    seriesLabelFadeInAnimation3(this, "labels", animationManager, labelSelection);
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
      linePath.clear(true);
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
  getFormattedMarkerStyle(datum) {
    const { angleKey, radiusKey } = this.properties;
    return this.getMarkerStyle(this.properties.marker, { datum, angleKey, radiusKey, highlighted: true });
  }
  computeFocusBounds(opts) {
    return computeMarkerFocusBounds2(this, opts);
  }
};
RadarSeries.className = "RadarSeries";

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport81 } from "ag-charts-community";
var { RATIO: RATIO23, COLOR_STRING: COLOR_STRING18, Validate: Validate46 } = _ModuleSupport81;
var RadarAreaSeriesProperties = class extends RadarSeriesProperties {
  constructor() {
    super(...arguments);
    this.fill = "black";
    this.fillOpacity = 1;
  }
};
__decorateClass([
  Validate46(COLOR_STRING18)
], RadarAreaSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate46(RATIO23)
], RadarAreaSeriesProperties.prototype, "fillOpacity", 2);

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaSeries.ts
var { Group: Group12, Path: Path7, PointerEvents: PointerEvents6, Selection: Selection9 } = _Scene50;
var { ChartAxisDirection: ChartAxisDirection11 } = _ModuleSupport82;
var RadarAreaSeries = class extends RadarSeries {
  constructor(moduleCtx) {
    super(moduleCtx);
    this.properties = new RadarAreaSeriesProperties();
    this.resetInvalidToZero = true;
    const areaGroup = new Group12();
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
      return axis instanceof _ModuleSupport82.PolarAxis ? axis : void 0;
    };
    const radiusAxis = getPolarAxis(ChartAxisDirection11.Y);
    const angleAxis = getPolarAxis(ChartAxisDirection11.X);
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
      areaPath.clear(true);
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
var { markerPaletteFactory } = _ModuleSupport83;
var RadarAreaModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radar-area",
  instanceConstructor: RadarAreaSeries,
  defaultAxes: [
    {
      type: _Theme28.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: _Theme28.POLAR_AXIS_TYPE.RADIUS_NUMBER
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
import { _Theme as _Theme29 } from "ag-charts-community";

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
      type: _Theme29.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: _Theme29.POLAR_AXIS_TYPE.RADIUS_NUMBER
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
import { _Theme as _Theme31 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeries.ts
import { _ModuleSupport as _ModuleSupport85, _Scale as _Scale18, _Scene as _Scene53, _Util as _Util42 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport84, _Scene as _Scene51 } from "ag-charts-community";
var { Label: Label6 } = _Scene51;
var {
  SeriesProperties: SeriesProperties8,
  SeriesTooltip: SeriesTooltip12,
  Validate: Validate47,
  COLOR_STRING: COLOR_STRING19,
  DEGREE: DEGREE5,
  FUNCTION: FUNCTION13,
  LINE_DASH: LINE_DASH15,
  NUMBER: NUMBER11,
  OBJECT: OBJECT17,
  POSITIVE_NUMBER: POSITIVE_NUMBER23,
  RATIO: RATIO24,
  STRING: STRING16
} = _ModuleSupport84;
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
    this.cornerRadius = 0;
    this.rotation = 0;
    this.label = new Label6();
    this.tooltip = new SeriesTooltip12();
  }
};
__decorateClass([
  Validate47(STRING16)
], RadialBarSeriesProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate47(STRING16)
], RadialBarSeriesProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate47(STRING16, { optional: true })
], RadialBarSeriesProperties.prototype, "angleName", 2);
__decorateClass([
  Validate47(STRING16, { optional: true })
], RadialBarSeriesProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate47(COLOR_STRING19)
], RadialBarSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate47(RATIO24)
], RadialBarSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate47(COLOR_STRING19)
], RadialBarSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate47(POSITIVE_NUMBER23)
], RadialBarSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate47(RATIO24)
], RadialBarSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate47(LINE_DASH15)
], RadialBarSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate47(POSITIVE_NUMBER23)
], RadialBarSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate47(POSITIVE_NUMBER23)
], RadialBarSeriesProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate47(FUNCTION13, { optional: true })
], RadialBarSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate47(DEGREE5)
], RadialBarSeriesProperties.prototype, "rotation", 2);
__decorateClass([
  Validate47(STRING16, { optional: true })
], RadialBarSeriesProperties.prototype, "stackGroup", 2);
__decorateClass([
  Validate47(NUMBER11, { optional: true })
], RadialBarSeriesProperties.prototype, "normalizedTo", 2);
__decorateClass([
  Validate47(OBJECT17)
], RadialBarSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate47(OBJECT17)
], RadialBarSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarUtil.ts
import { _Scene as _Scene52 } from "ag-charts-community";
var { SectorBox: SectorBox3, motion: motion6 } = _Scene52;
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
    let clipSector;
    if (status === "removed" || status === "updated") {
      startAngle = sect.startAngle;
      endAngle = sect.endAngle;
      innerRadius = sect.innerRadius;
      outerRadius = sect.outerRadius;
      clipSector = sect.clipSector;
    } else {
      startAngle = axisZeroAngle;
      endAngle = axisZeroAngle;
      innerRadius = datum.innerRadius;
      outerRadius = datum.outerRadius;
    }
    clipSector != null ? clipSector : clipSector = new SectorBox3(startAngle, endAngle, innerRadius, outerRadius);
    const phase = motion6.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
    return { startAngle, endAngle, innerRadius, outerRadius, clipSector, phase };
  };
  const toFn = (sect, datum, status) => {
    let startAngle;
    let endAngle;
    let innerRadius;
    let outerRadius;
    let clipSector;
    if (status === "removed") {
      startAngle = axisZeroAngle;
      endAngle = axisZeroAngle;
      innerRadius = datum.innerRadius;
      outerRadius = datum.outerRadius;
      clipSector = new SectorBox3(startAngle, endAngle, innerRadius, outerRadius);
    } else {
      startAngle = datum.startAngle;
      endAngle = datum.endAngle;
      innerRadius = isNaN(datum.innerRadius) ? sect.innerRadius : datum.innerRadius;
      outerRadius = isNaN(datum.outerRadius) ? sect.outerRadius : datum.outerRadius;
      clipSector = datum.clipSector;
    }
    return { startAngle, endAngle, innerRadius, outerRadius, clipSector };
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
    endAngle: datum.endAngle,
    clipSector: datum.clipSector
  };
}

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeries.ts
var {
  ChartAxisDirection: ChartAxisDirection12,
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
  animationValidation: animationValidation6,
  isFiniteNumber: isFiniteNumber7,
  computeSectorFocusBounds: computeSectorFocusBounds2
} = _ModuleSupport85;
var { BandScale: BandScale4 } = _Scale18;
var { Sector: Sector4, SectorBox: SectorBox4, motion: motion7 } = _Scene53;
var { angleBetween: angleBetween3, isNumber: isNumber2, sanitizeHtml: sanitizeHtml9 } = _Util42;
var RadialBarSeriesNodeEvent = class extends _ModuleSupport85.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadialBarSeries = class extends _ModuleSupport85.PolarSeries {
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
    if (direction === ChartAxisDirection12.X) {
      const angleAxis = axes[ChartAxisDirection12.X];
      const xExtent = dataModel.getDomain(this, "angleValue-end", "value", processedData);
      const fixedXExtent = [xExtent[0] > 0 ? 0 : xExtent[0], xExtent[1] < 0 ? 0 : xExtent[1]];
      return fixNumericExtent6(fixedXExtent, angleAxis);
    } else {
      return dataModel.getDomain(this, "radiusValue", "key", processedData);
    }
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b;
      const { angleKey, radiusKey, normalizedTo, visible } = this.properties;
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      if (!this.properties.isValid() || !(visible || animationEnabled))
        return;
      const stackGroupId = this.getStackId();
      const stackGroupTrailingId = `${stackGroupId}-trailing`;
      const extraProps = [];
      if (isDefined4(normalizedTo)) {
        extraProps.push(normaliseGroupTo2([stackGroupId, stackGroupTrailingId], Math.abs(normalizedTo), "range"));
      }
      if (animationEnabled) {
        if (this.processedData) {
          extraProps.push(diff5(this.processedData));
        }
        extraProps.push(animationValidation6());
      }
      const visibleProps = this.visible || !animationEnabled ? {} : { forceValue: 0 };
      const radiusScaleType = (_a2 = this.axes[ChartAxisDirection12.Y]) == null ? void 0 : _a2.scale.type;
      const angleScaleType = (_b = this.axes[ChartAxisDirection12.X]) == null ? void 0 : _b.scale.type;
      yield this.requestDataModel(dataController, this.data, {
        props: [
          keyProperty5(radiusKey, radiusScaleType, { id: "radiusValue" }),
          valueProperty11(angleKey, angleScaleType, __spreadValues({
            id: "angleValue-raw",
            invalidValue: null
          }, visibleProps)),
          ...groupAccumulativeValueProperty3(
            angleKey,
            "normal",
            "current",
            __spreadValues({
              id: `angleValue-end`,
              rangeId: `angleValue-range`,
              invalidValue: null,
              groupId: stackGroupId,
              separateNegative: true
            }, visibleProps),
            angleScaleType
          ),
          ...groupAccumulativeValueProperty3(
            angleKey,
            "trailing",
            "current",
            __spreadValues({
              id: `angleValue-start`,
              invalidValue: null,
              groupId: stackGroupTrailingId,
              separateNegative: true
            }, visibleProps),
            angleScaleType
          ),
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
  maybeRefreshNodeData() {
    return __async(this, null, function* () {
      var _a2;
      const circleChanged = this.didCircleChange();
      if (!circleChanged && !this.nodeDataRefresh)
        return;
      const { nodeData = [] } = (_a2 = yield this.createNodeData()) != null ? _a2 : {};
      this.nodeData = nodeData;
      this.nodeDataRefresh = false;
    });
  }
  getAxisInnerRadius() {
    const radiusAxis = this.axes[ChartAxisDirection12.Y];
    return radiusAxis instanceof PolarAxis3 ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2;
      const { processedData, dataModel } = this;
      if (!processedData || !dataModel || !this.properties.isValid()) {
        return;
      }
      const angleAxis = this.axes[ChartAxisDirection12.X];
      const radiusAxis = this.axes[ChartAxisDirection12.Y];
      const angleScale = angleAxis == null ? void 0 : angleAxis.scale;
      const radiusScale = radiusAxis == null ? void 0 : radiusAxis.scale;
      if (!angleScale || !radiusScale) {
        return;
      }
      const angleStartIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-start`);
      const angleEndIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-end`);
      const angleRangeIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-range`);
      const angleRawIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-raw`);
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
      const angleAxisReversed = angleAxis.isReversed();
      const radiusAxisReversed = radiusAxis.isReversed();
      const axisInnerRadius = radiusAxisReversed ? this.radius : this.getAxisInnerRadius();
      const axisOuterRadius = radiusAxisReversed ? this.getAxisInnerRadius() : this.radius;
      const axisTotalRadius = axisOuterRadius + axisInnerRadius;
      const { angleKey, radiusKey, angleName, radiusName, label } = this.properties;
      const getLabelNodeDatum = (datum, angleDatum, x, y) => {
        const labelText = this.getLabelText(
          label,
          { value: angleDatum, datum, angleKey, radiusKey, angleName, radiusName },
          (value) => isFiniteNumber7(value) ? value.toFixed(2) : String(value)
        );
        if (labelText) {
          return { x, y, text: labelText, textAlign: "center", textBaseline: "middle" };
        }
      };
      const nodeData = [];
      const context = { itemId: radiusKey, nodeData, labelData: nodeData };
      if (!this.visible)
        return context;
      processedData.data.forEach((group, index) => {
        var _a3;
        const { datum, keys, values, aggValues } = group;
        const radiusDatum = keys[0];
        const angleDatum = values[angleRawIndex];
        const isPositive = angleDatum >= 0 && !Object.is(angleDatum, -0);
        const angleStartDatum = values[angleStartIndex];
        const angleEndDatum = values[angleEndIndex];
        const angleRange = (_a3 = aggValues == null ? void 0 : aggValues[angleRangeIndex][isPositive ? 1 : 0]) != null ? _a3 : 0;
        const reversed = isPositive === angleAxisReversed;
        let startAngle = angleScale.convert(angleStartDatum, { clampMode: "clamped" });
        let endAngle = angleScale.convert(angleEndDatum, { clampMode: "clamped" });
        let rangeStartAngle = angleScale.convert(0, { clampMode: "clamped" });
        let rangeEndAngle = angleScale.convert(angleRange, { clampMode: "clamped" });
        if (reversed) {
          [rangeStartAngle, rangeEndAngle] = [rangeEndAngle, rangeStartAngle];
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
        const clipSector = new SectorBox4(startAngle, endAngle, innerRadius, outerRadius);
        nodeData.push({
          series: this,
          datum,
          point: { x, y, size: 0 },
          midPoint: { x, y },
          label: labelNodeDatum,
          angleValue: angleDatum,
          radiusValue: radiusDatum,
          innerRadius,
          outerRadius,
          startAngle: rangeStartAngle,
          endAngle: rangeEndAngle,
          clipSector,
          reversed,
          index
        });
      });
      return context;
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
    const cornerRadius = this.properties.cornerRadius;
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
      node.startInnerCornerRadius = datum.reversed ? cornerRadius : 0;
      node.startOuterCornerRadius = datum.reversed ? cornerRadius : 0;
      node.endInnerCornerRadius = datum.reversed ? 0 : cornerRadius;
      node.endOuterCornerRadius = datum.reversed ? 0 : cornerRadius;
      if (highlight) {
        node.startAngle = datum.startAngle;
        node.endAngle = datum.endAngle;
        node.clipSector = datum.clipSector;
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
    const angleScale = (_a2 = this.axes[ChartAxisDirection12.X]) == null ? void 0 : _a2.scale;
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
    seriesLabelFadeInAnimation4(this, "labels", this.ctx.animationManager, labelSelection);
  }
  animateClearingUpdateEmpty() {
    const { itemSelection } = this;
    const { animationManager } = this.ctx;
    const fns = this.getBarTransitionFunctions();
    motion7.fromToMotion(this.id, "datums", animationManager, [itemSelection], fns);
    seriesLabelFadeOutAnimation2(this, "labels", animationManager, this.labelSelection);
  }
  getTooltipHtml(nodeDatum) {
    var _a2;
    const { id: seriesId, axes, dataModel } = this;
    const { angleKey, angleName, radiusKey, radiusName, fill, stroke, strokeWidth, formatter, tooltip } = this.properties;
    const { angleValue, radiusValue, datum, itemId } = nodeDatum;
    const xAxis = axes[ChartAxisDirection12.X];
    const yAxis = axes[ChartAxisDirection12.Y];
    if (!this.properties.isValid() || !(xAxis && yAxis && isNumber2(angleValue)) || !dataModel) {
      return _ModuleSupport85.EMPTY_TOOLTIP_CONTENT;
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
      {
        seriesId,
        datum,
        color,
        title,
        angleKey,
        radiusKey,
        angleName,
        radiusName,
        angleValue,
        itemId,
        radiusValue
      }
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
  computeFocusBounds(opts) {
    return computeSectorFocusBounds2(this, opts);
  }
};
RadialBarSeries.className = "RadialBarSeries";
RadialBarSeries.type = "radial-bar";

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarThemes.ts
import { _Theme as _Theme30 } from "ag-charts-community";
var RADIAL_BAR_SERIES_THEME = {
  series: {
    __extends__: _Theme30.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme30.DEFAULT_FONT_FAMILY,
      color: _Theme30.DEFAULT_INVERTED_LABEL_COLOUR
    }
  },
  axes: {
    [_Theme30.POLAR_AXIS_TYPE.RADIUS_CATEGORY]: {
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
      type: _Theme31.POLAR_AXIS_TYPE.ANGLE_NUMBER
    },
    {
      type: _Theme31.POLAR_AXIS_TYPE.RADIUS_CATEGORY
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
import { _Theme as _Theme33 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeries.ts
import { _ModuleSupport as _ModuleSupport87, _Scene as _Scene54 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport86 } from "ag-charts-community";
var { Validate: Validate48, RATIO: RATIO25 } = _ModuleSupport86;
var RadialColumnSeriesProperties = class extends RadialColumnSeriesBaseProperties {
};
__decorateClass([
  Validate48(RATIO25, { optional: true })
], RadialColumnSeriesProperties.prototype, "columnWidthRatio", 2);
__decorateClass([
  Validate48(RATIO25, { optional: true })
], RadialColumnSeriesProperties.prototype, "maxColumnWidthRatio", 2);

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeries.ts
var { ChartAxisDirection: ChartAxisDirection13, PolarAxis: PolarAxis4 } = _ModuleSupport87;
var { RadialColumnShape, getRadialColumnWidth } = _Scene54;
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
    const radiusAxis = this.axes[ChartAxisDirection13.Y];
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
import { _Theme as _Theme32 } from "ag-charts-community";
var RADIAL_COLUMN_SERIES_THEME = {
  series: {
    __extends__: _Theme32.EXTENDS_SERIES_DEFAULTS,
    columnWidthRatio: 0.5,
    maxColumnWidthRatio: 0.5,
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme32.DEFAULT_FONT_FAMILY,
      color: _Theme32.DEFAULT_LABEL_COLOUR
    }
  },
  axes: {
    [_Theme32.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      shape: _Theme32.POLAR_AXIS_SHAPE.CIRCLE,
      groupPaddingInner: 0,
      paddingInner: 0,
      label: {
        padding: 10
      }
    },
    [_Theme32.POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
      shape: _Theme32.POLAR_AXIS_SHAPE.CIRCLE,
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
      type: _Theme33.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: _Theme33.POLAR_AXIS_TYPE.RADIUS_NUMBER
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
import { _ModuleSupport as _ModuleSupport90, _Theme as _Theme35 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/range-area/rangeArea.ts
import { _ModuleSupport as _ModuleSupport89, _Scene as _Scene56, _Util as _Util43 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaProperties.ts
import { _ModuleSupport as _ModuleSupport88, _Scene as _Scene55 } from "ag-charts-community";
var { DropShadow, Label: Label7 } = _Scene55;
var {
  CartesianSeriesProperties: CartesianSeriesProperties2,
  SeriesMarker: SeriesMarker2,
  SeriesTooltip: SeriesTooltip13,
  Validate: Validate49,
  BOOLEAN: BOOLEAN16,
  COLOR_STRING: COLOR_STRING20,
  LINE_DASH: LINE_DASH16,
  OBJECT: OBJECT18,
  PLACEMENT,
  POSITIVE_NUMBER: POSITIVE_NUMBER24,
  RATIO: RATIO26,
  STRING: STRING17
} = _ModuleSupport88;
var RangeAreaSeriesLabel = class extends Label7 {
  constructor() {
    super(...arguments);
    this.placement = "outside";
    this.padding = 6;
  }
};
__decorateClass([
  Validate49(PLACEMENT)
], RangeAreaSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate49(POSITIVE_NUMBER24)
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
  Validate49(STRING17)
], RangeAreaProperties.prototype, "xKey", 2);
__decorateClass([
  Validate49(STRING17)
], RangeAreaProperties.prototype, "yLowKey", 2);
__decorateClass([
  Validate49(STRING17)
], RangeAreaProperties.prototype, "yHighKey", 2);
__decorateClass([
  Validate49(STRING17, { optional: true })
], RangeAreaProperties.prototype, "xName", 2);
__decorateClass([
  Validate49(STRING17, { optional: true })
], RangeAreaProperties.prototype, "yName", 2);
__decorateClass([
  Validate49(STRING17, { optional: true })
], RangeAreaProperties.prototype, "yLowName", 2);
__decorateClass([
  Validate49(STRING17, { optional: true })
], RangeAreaProperties.prototype, "yHighName", 2);
__decorateClass([
  Validate49(COLOR_STRING20)
], RangeAreaProperties.prototype, "fill", 2);
__decorateClass([
  Validate49(RATIO26)
], RangeAreaProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate49(COLOR_STRING20)
], RangeAreaProperties.prototype, "stroke", 2);
__decorateClass([
  Validate49(POSITIVE_NUMBER24)
], RangeAreaProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate49(RATIO26)
], RangeAreaProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate49(LINE_DASH16)
], RangeAreaProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate49(POSITIVE_NUMBER24)
], RangeAreaProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate49(OBJECT18)
], RangeAreaProperties.prototype, "shadow", 2);
__decorateClass([
  Validate49(OBJECT18)
], RangeAreaProperties.prototype, "marker", 2);
__decorateClass([
  Validate49(OBJECT18)
], RangeAreaProperties.prototype, "label", 2);
__decorateClass([
  Validate49(OBJECT18)
], RangeAreaProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate49(BOOLEAN16)
], RangeAreaProperties.prototype, "connectMissingData", 2);

// packages/ag-charts-enterprise/src/series/range-area/rangeArea.ts
var {
  valueProperty: valueProperty12,
  keyProperty: keyProperty6,
  ChartAxisDirection: ChartAxisDirection14,
  mergeDefaults: mergeDefaults8,
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
  updateClipPath,
  isFiniteNumber: isFiniteNumber8,
  computeMarkerFocusBounds: computeMarkerFocusBounds3
} = _ModuleSupport89;
var { getMarker: getMarker3, PointerEvents: PointerEvents7 } = _Scene56;
var { sanitizeHtml: sanitizeHtml10, extent: extent4 } = _Util43;
var RangeAreaSeriesNodeEvent = class extends _ModuleSupport89.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.yLowKey = series.properties.yLowKey;
    this.yHighKey = series.properties.yHighKey;
  }
};
var RangeAreaSeries = class extends _ModuleSupport89.CartesianSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      hasMarkers: true,
      pathsPerSeries: 2,
      directionKeys: {
        [ChartAxisDirection14.X]: ["xKey"],
        [ChartAxisDirection14.Y]: ["yLowKey", "yHighKey"]
      },
      directionNames: {
        [ChartAxisDirection14.X]: ["xName"],
        [ChartAxisDirection14.Y]: ["yLowName", "yHighName", "yName"]
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
      var _a2, _b;
      if (!this.properties.isValid() || !this.visible)
        return;
      const { xKey, yLowKey, yHighKey } = this.properties;
      const xScale = (_a2 = this.axes[ChartAxisDirection14.X]) == null ? void 0 : _a2.scale;
      const yScale = (_b = this.axes[ChartAxisDirection14.Y]) == null ? void 0 : _b.scale;
      const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
      const extraProps = [];
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      if (!this.ctx.animationManager.isSkipped() && this.processedData) {
        extraProps.push(diff6(this.processedData));
      }
      if (animationEnabled) {
        extraProps.push(animationValidation7());
      }
      yield this.requestDataModel(dataController, this.data, {
        props: [
          keyProperty6(xKey, xScaleType, { id: `xValue` }),
          valueProperty12(yLowKey, yScaleType, { id: `yLowValue`, invalidValue: void 0 }),
          valueProperty12(yHighKey, yScaleType, { id: `yHighValue`, invalidValue: void 0 }),
          ...extraProps
        ]
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
    if (direction === ChartAxisDirection14.X) {
      const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
      const xAxis = axes[ChartAxisDirection14.X];
      if ((keyDef == null ? void 0 : keyDef.def.type) === "key" && keyDef.def.valueType === "category") {
        return keys;
      }
      return fixNumericExtent7(extent4(keys), xAxis);
    } else {
      const yLowIndex = dataModel.resolveProcessedDataIndexById(this, "yLowValue");
      const yLowExtent = values[yLowIndex];
      const yHighIndex = dataModel.resolveProcessedDataIndexById(this, "yHighValue");
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
      const xAxis = axes[ChartAxisDirection14.X];
      const yAxis = axes[ChartAxisDirection14.Y];
      if (!(data && visible && xAxis && yAxis && dataModel)) {
        return;
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
        scales: this.calculateScaling(),
        visible: this.visible
      };
      if (!this.visible)
        return context;
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
      return context;
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
        (v) => isFiniteNumber8(v) ? v.toFixed(2) : String(v)
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
      this.updateAreaPaths(opts.paths, opts.contextData);
    });
  }
  updateAreaPaths(paths, contextData) {
    this.updateFillPath(paths, contextData);
    this.updateStrokePath(paths, contextData);
  }
  updateFillPath(paths, contextData) {
    const { fillData } = contextData;
    const [fill] = paths;
    const { path: fillPath } = fill;
    fillPath.clear(true);
    for (const { point } of fillData.points) {
      if (point.moveTo) {
        fillPath.moveTo(point.x, point.y);
      } else {
        fillPath.lineTo(point.x, point.y);
      }
    }
    fillPath.closePath();
    fill.checkPathDirty();
  }
  updateStrokePath(paths, contextData) {
    const { strokeData } = contextData;
    const [, stroke] = paths;
    const { path: strokePath } = stroke;
    strokePath.clear(true);
    for (const { point } of strokeData.points) {
      if (point.moveTo) {
        strokePath.moveTo(point.x, point.y);
      } else {
        strokePath.lineTo(point.x, point.y);
      }
    }
    stroke.checkPathDirty();
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
      const baseStyle = mergeDefaults8(highlighted && this.properties.highlightStyle.item, marker.getStyle(), {
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
    const xAxis = this.axes[ChartAxisDirection14.X];
    const yAxis = this.axes[ChartAxisDirection14.Y];
    if (!this.properties.isValid() || !xAxis || !yAxis) {
      return _ModuleSupport89.EMPTY_TOOLTIP_CONTENT;
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
      {
        seriesId,
        itemId,
        datum,
        xKey,
        yLowKey,
        yHighKey,
        xName,
        yLowName,
        yHighName,
        yName,
        color,
        title,
        yHighValue,
        yLowValue
      }
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
    return new _Scene56.Group();
  }
  animateEmptyUpdateReady(animationData) {
    const { markerSelection, labelSelection, contextData, paths } = animationData;
    const { animationManager } = this.ctx;
    this.updateAreaPaths(paths, contextData);
    pathSwipeInAnimation(this, animationManager, ...paths);
    resetMotion([markerSelection], resetMarkerPositionFn);
    markerSwipeScaleInAnimation(this, animationManager, markerSelection);
    seriesLabelFadeInAnimation5(this, "labels", animationManager, labelSelection);
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
  getFormattedMarkerStyle(datum) {
    const { xKey, yLowKey, yHighKey } = this.properties;
    return this.getMarkerStyle(this.properties.marker, { datum, xKey, yLowKey, yHighKey, highlighted: true });
  }
  computeFocusBounds(opts) {
    return computeMarkerFocusBounds3(this, opts);
  }
};
RangeAreaSeries.className = "RangeAreaSeries";
RangeAreaSeries.type = "range-area";

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaThemes.ts
import { _Theme as _Theme34 } from "ag-charts-community";
var RANGE_AREA_SERIES_THEME = {
  series: {
    __extends__: _Theme34.EXTENDS_SERIES_DEFAULTS,
    fillOpacity: 0.7,
    nodeClickRange: "nearest",
    marker: {
      __extends__: _Theme34.EXTENDS_CARTESIAN_MARKER_DEFAULTS,
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
      fontFamily: _Theme34.DEFAULT_FONT_FAMILY,
      color: _Theme34.DEFAULT_LABEL_COLOUR
    }
  },
  axes: {
    [_Theme34.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        enabled: true,
        snap: false
      }
    }
  }
};

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaModule.ts
var { markerPaletteFactory: markerPaletteFactory2 } = _ModuleSupport90;
var RangeAreaModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "range-area",
  instanceConstructor: RangeAreaSeries,
  defaultAxes: [
    {
      type: _Theme35.CARTESIAN_AXIS_TYPE.NUMBER,
      position: _Theme35.POSITION.LEFT
    },
    {
      type: _Theme35.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: _Theme35.POSITION.BOTTOM
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
import { _Theme as _Theme37 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/range-bar/rangeBar.ts
import { _ModuleSupport as _ModuleSupport92, _Scale as _Scale19, _Scene as _Scene58, _Util as _Util44 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarProperties.ts
import { _ModuleSupport as _ModuleSupport91, _Scene as _Scene57 } from "ag-charts-community";
var { DropShadow: DropShadow2, Label: Label8 } = _Scene57;
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties4,
  SeriesTooltip: SeriesTooltip14,
  Validate: Validate50,
  COLOR_STRING: COLOR_STRING21,
  FUNCTION: FUNCTION14,
  LINE_DASH: LINE_DASH17,
  OBJECT: OBJECT19,
  PLACEMENT: PLACEMENT2,
  POSITIVE_NUMBER: POSITIVE_NUMBER25,
  RATIO: RATIO27,
  STRING: STRING18
} = _ModuleSupport91;
var RangeBarSeriesLabel = class extends Label8 {
  constructor() {
    super(...arguments);
    this.placement = "inside";
    this.padding = 6;
  }
};
__decorateClass([
  Validate50(PLACEMENT2)
], RangeBarSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate50(POSITIVE_NUMBER25)
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
  Validate50(STRING18)
], RangeBarProperties.prototype, "xKey", 2);
__decorateClass([
  Validate50(STRING18)
], RangeBarProperties.prototype, "yLowKey", 2);
__decorateClass([
  Validate50(STRING18)
], RangeBarProperties.prototype, "yHighKey", 2);
__decorateClass([
  Validate50(STRING18, { optional: true })
], RangeBarProperties.prototype, "xName", 2);
__decorateClass([
  Validate50(STRING18, { optional: true })
], RangeBarProperties.prototype, "yName", 2);
__decorateClass([
  Validate50(STRING18, { optional: true })
], RangeBarProperties.prototype, "yLowName", 2);
__decorateClass([
  Validate50(STRING18, { optional: true })
], RangeBarProperties.prototype, "yHighName", 2);
__decorateClass([
  Validate50(COLOR_STRING21)
], RangeBarProperties.prototype, "fill", 2);
__decorateClass([
  Validate50(RATIO27)
], RangeBarProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate50(COLOR_STRING21)
], RangeBarProperties.prototype, "stroke", 2);
__decorateClass([
  Validate50(POSITIVE_NUMBER25)
], RangeBarProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate50(RATIO27)
], RangeBarProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate50(LINE_DASH17)
], RangeBarProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate50(POSITIVE_NUMBER25)
], RangeBarProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate50(POSITIVE_NUMBER25)
], RangeBarProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate50(FUNCTION14, { optional: true })
], RangeBarProperties.prototype, "formatter", 2);
__decorateClass([
  Validate50(OBJECT19)
], RangeBarProperties.prototype, "shadow", 2);
__decorateClass([
  Validate50(OBJECT19)
], RangeBarProperties.prototype, "label", 2);
__decorateClass([
  Validate50(OBJECT19)
], RangeBarProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/range-bar/rangeBar.ts
var {
  SeriesNodePickMode: SeriesNodePickMode11,
  valueProperty: valueProperty13,
  keyProperty: keyProperty7,
  ChartAxisDirection: ChartAxisDirection15,
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
  createDatumId: createDatumId7,
  isFiniteNumber: isFiniteNumber9,
  computeBarFocusBounds: computeBarFocusBounds5
} = _ModuleSupport92;
var { Rect: Rect4, PointerEvents: PointerEvents8, motion: motion8 } = _Scene58;
var { sanitizeHtml: sanitizeHtml11, isNumber: isNumber3, extent: extent5 } = _Util44;
var { ContinuousScale: ContinuousScale3 } = _Scale19;
var RangeBarSeriesNodeEvent = class extends _ModuleSupport92.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.yLowKey = series.properties.yLowKey;
    this.yHighKey = series.properties.yHighKey;
  }
};
var RangeBarSeries = class extends _ModuleSupport92.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode11.EXACT_SHAPE_MATCH],
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
      var _a2, _b, _c;
      if (!this.properties.isValid()) {
        return;
      }
      const { xKey, yLowKey, yHighKey } = this.properties;
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const yScale = (_b = this.getValueAxis()) == null ? void 0 : _b.scale;
      const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
      const extraProps = [];
      if (!this.ctx.animationManager.isSkipped()) {
        if (this.processedData) {
          extraProps.push(diff7(this.processedData));
        }
        extraProps.push(animationValidation8());
      }
      const visibleProps = this.visible ? {} : { forceValue: 0 };
      const { processedData } = yield this.requestDataModel(dataController, this.data, {
        props: [
          keyProperty7(xKey, xScaleType, { id: "xValue" }),
          valueProperty13(yLowKey, yScaleType, __spreadValues({ id: `yLowValue` }, visibleProps)),
          valueProperty13(yHighKey, yScaleType, __spreadValues({ id: `yHighValue` }, visibleProps)),
          ...isContinuousX ? [SMALLEST_KEY_INTERVAL3] : [],
          ...extraProps
        ],
        groupByKeys: true
      });
      this.smallestDataInterval = (_c = processedData.reduced) == null ? void 0 : _c.smallestKeyInterval;
      this.animationState.transition("updateData");
    });
  }
  getSeriesDomain(direction) {
    var _a2;
    const { processedData, dataModel, smallestDataInterval } = this;
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
      const scalePadding = isFiniteNumber9(smallestDataInterval) ? smallestDataInterval : 0;
      const keysExtent = (_a2 = extent5(keys)) != null ? _a2 : [NaN, NaN];
      const categoryAxis = this.getCategoryAxis();
      const d0 = keysExtent[0] + -scalePadding;
      const d1 = keysExtent[1] + scalePadding;
      return fixNumericExtent8([d0, d1], categoryAxis);
    } else {
      const yLowIndex = dataModel.resolveProcessedDataIndexById(this, "yLowValue");
      const yLowExtent = values[yLowIndex];
      const yHighIndex = dataModel.resolveProcessedDataIndexById(this, "yHighValue");
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
      if (!(data && xAxis && yAxis && dataModel)) {
        return;
      }
      const xScale = xAxis.scale;
      const yScale = yAxis.scale;
      const barAlongX = this.getBarDirection() === ChartAxisDirection15.X;
      const { xKey, yLowKey, yHighKey, fill, stroke, strokeWidth } = this.properties;
      const itemId = `${yLowKey}-${yHighKey}`;
      const context = {
        itemId,
        nodeData: [],
        labelData: [],
        scales: this.calculateScaling(),
        visible: this.visible
      };
      if (!visible)
        return context;
      const yLowIndex = dataModel.resolveProcessedDataIndexById(this, `yLowValue`);
      const yHighIndex = dataModel.resolveProcessedDataIndexById(this, `yHighValue`);
      const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`);
      const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
      const barOffset = ContinuousScale3.is(xScale) ? barWidth * -0.5 : 0;
      processedData == null ? void 0 : processedData.data.forEach(({ keys, datum, values }, dataIndex) => {
        values.forEach((value, valueIndex) => {
          const xDatum = keys[xIndex];
          const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex)) + barOffset;
          const rawLowValue = value[yLowIndex];
          const rawHighValue = value[yHighIndex];
          if (!_Util44.isNumber(rawHighValue) || !_Util44.isNumber(rawLowValue)) {
            return;
          }
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
            datum: datum[valueIndex],
            series: this
          });
          const nodeDatum = {
            index: dataIndex,
            valueIndex,
            series: this,
            itemId,
            datum: datum[valueIndex],
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
          context.nodeData.push(nodeDatum);
          context.labelData.push(...labelData);
        });
      });
      return context;
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
        (v) => isFiniteNumber9(v) ? v.toFixed(2) : String(v)
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
        (value) => isNumber3(value) ? value.toFixed(2) : ""
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
      const xAxis = this.axes[ChartAxisDirection15.X];
      const crisp = checkCrisp(xAxis == null ? void 0 : xAxis.visibleRange);
      const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection15.X;
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
      return _ModuleSupport92.EMPTY_TOOLTIP_CONTENT;
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
      itemId,
      title,
      yHighValue,
      yLowValue
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
  animateEmptyUpdateReady({ datumSelection, labelSelection }) {
    const fns = prepareBarAnimationFunctions2(midpointStartingBarPosition(this.isVertical(), "normal"));
    motion8.fromToMotion(this.id, "datums", this.ctx.animationManager, [datumSelection], fns);
    seriesLabelFadeInAnimation6(this, "labels", this.ctx.animationManager, labelSelection);
  }
  animateWaitingUpdateReady(data) {
    var _a2;
    const { datumSelection: datumSelections, labelSelection: labelSelections } = data;
    const { processedData } = this;
    const dataDiff = (_a2 = processedData == null ? void 0 : processedData.reduced) == null ? void 0 : _a2.diff;
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    const fns = prepareBarAnimationFunctions2(midpointStartingBarPosition(this.isVertical(), "fade"));
    motion8.fromToMotion(
      this.id,
      "datums",
      this.ctx.animationManager,
      [datumSelections],
      fns,
      (_, datum) => createDatumId7(datum.xValue, datum.valueIndex),
      dataDiff
    );
    seriesLabelFadeInAnimation6(this, "labels", this.ctx.animationManager, labelSelections);
  }
  getDatumId(datum) {
    return `${datum.xValue}-${datum.valueIndex}`;
  }
  isLabelEnabled() {
    return this.properties.label.enabled;
  }
  onDataChange() {
  }
  computeFocusBounds({ datumIndex, seriesRect }) {
    var _a2;
    return computeBarFocusBounds5((_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData[datumIndex], this.contentGroup, seriesRect);
  }
};
RangeBarSeries.className = "RangeBarSeries";
RangeBarSeries.type = "range-bar";

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarThemes.ts
import { _Theme as _Theme36 } from "ag-charts-community";
var RANGE_BAR_SERIES_THEME = {
  series: {
    __extends__: _Theme36.EXTENDS_SERIES_DEFAULTS,
    direction: "vertical",
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme36.DEFAULT_FONT_FAMILY,
      color: _Theme36.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
      placement: "inside"
    }
  },
  axes: {
    [_Theme36.CARTESIAN_AXIS_TYPE.NUMBER]: {
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
      type: _Theme37.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: _Theme37.POSITION.BOTTOM
    },
    {
      type: _Theme37.CARTESIAN_AXIS_TYPE.NUMBER,
      position: _Theme37.POSITION.LEFT
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
import { _Theme as _Theme38 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeries.ts
import {
  _ModuleSupport as _ModuleSupport94,
  _Scene as _Scene59,
  _Util as _Util45
} from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport93 } from "ag-charts-community";
var {
  HierarchySeriesProperties,
  HighlightStyle,
  SeriesTooltip: SeriesTooltip15,
  Validate: Validate51,
  COLOR_STRING: COLOR_STRING22,
  FUNCTION: FUNCTION15,
  NUMBER: NUMBER12,
  OBJECT: OBJECT20,
  POSITIVE_NUMBER: POSITIVE_NUMBER26,
  RATIO: RATIO28,
  STRING: STRING19
} = _ModuleSupport93;
var SunburstSeriesTileHighlightStyle = class extends HighlightStyle {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizedLabel();
  }
};
__decorateClass([
  Validate51(STRING19, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate51(RATIO28, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate51(COLOR_STRING22, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate51(POSITIVE_NUMBER26, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate51(RATIO28, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate51(OBJECT20)
], SunburstSeriesTileHighlightStyle.prototype, "label", 2);
__decorateClass([
  Validate51(OBJECT20)
], SunburstSeriesTileHighlightStyle.prototype, "secondaryLabel", 2);
var SunburstSeriesProperties = class extends HierarchySeriesProperties {
  constructor() {
    super(...arguments);
    this.fillOpacity = 1;
    this.strokeWidth = 0;
    this.strokeOpacity = 1;
    this.cornerRadius = 0;
    this.highlightStyle = new SunburstSeriesTileHighlightStyle();
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
    this.tooltip = new SeriesTooltip15();
  }
};
__decorateClass([
  Validate51(STRING19, { optional: true })
], SunburstSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate51(STRING19, { optional: true })
], SunburstSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate51(STRING19, { optional: true })
], SunburstSeriesProperties.prototype, "secondaryLabelKey", 2);
__decorateClass([
  Validate51(RATIO28)
], SunburstSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate51(POSITIVE_NUMBER26)
], SunburstSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate51(RATIO28)
], SunburstSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate51(POSITIVE_NUMBER26)
], SunburstSeriesProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate51(NUMBER12, { optional: true })
], SunburstSeriesProperties.prototype, "sectorSpacing", 2);
__decorateClass([
  Validate51(NUMBER12, { optional: true })
], SunburstSeriesProperties.prototype, "padding", 2);
__decorateClass([
  Validate51(FUNCTION15, { optional: true })
], SunburstSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate51(OBJECT20)
], SunburstSeriesProperties.prototype, "highlightStyle", 2);
__decorateClass([
  Validate51(OBJECT20)
], SunburstSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate51(OBJECT20)
], SunburstSeriesProperties.prototype, "secondaryLabel", 2);
__decorateClass([
  Validate51(OBJECT20)
], SunburstSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeries.ts
var { fromToMotion: fromToMotion3 } = _ModuleSupport94;
var { Sector: Sector5, Group: Group13, Selection: Selection10, Text: Text10 } = _Scene59;
var { sanitizeHtml: sanitizeHtml12 } = _Util45;
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
var _SunburstSeries = class _SunburstSeries extends _ModuleSupport94.HierarchySeries {
  constructor() {
    super(...arguments);
    this.properties = new SunburstSeriesProperties();
    this.groupSelection = Selection10.select(this.contentGroup, Group13);
    this.highlightSelection = Selection10.select(
      this.highlightGroup,
      Group13
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
      const { sectorSpacing = 0, padding = 0, cornerRadius, highlightStyle } = this.properties;
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
        sector.startAngle = angleDatum.start + angleOffset;
        sector.endAngle = angleDatum.end + angleOffset;
        sector.inset = baseInset + strokeWidth * 0.5;
        sector.cornerRadius = cornerRadius;
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
      sizeName = sizeKey,
      childrenKey
    } = this.properties;
    const { datum, depth } = node;
    if (datum == null || depth == null) {
      return _ModuleSupport94.EMPTY_TOOLTIP_CONTENT;
    }
    const title = labelKey != null ? datum[labelKey] : void 0;
    const format = this.getSectorFormat(node, false);
    const color = (_a2 = format == null ? void 0 : format.fill) != null ? _a2 : node.fill;
    if (!tooltip.renderer && !title) {
      return _ModuleSupport94.EMPTY_TOOLTIP_CONTENT;
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
      seriesId,
      childrenKey,
      colorName,
      itemId: void 0,
      sizeName
    });
  }
  createNodeData() {
    return __async(this, null, function* () {
      return void 0;
    });
  }
  pickNodeClosestDatum(point) {
    return this.pickNodeNearestDistantObject(point, this.groupSelection.selectByClass(Sector5));
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
var { EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS5, DEFAULT_INSIDE_SERIES_LABEL_COLOUR } = _Theme38;
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
    const defaultColorRange = properties.get(_Theme38.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    return { fills, strokes, colorRange: defaultColorRange };
  }
};

// packages/ag-charts-enterprise/src/series/treemap/treemapModule.ts
import { _Theme as _Theme39 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts
import {
  _ModuleSupport as _ModuleSupport96,
  _Scene as _Scene61,
  _Util as _Util46
} from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/treemap/treemapSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport95, _Scene as _Scene60 } from "ag-charts-community";
var { Label: Label9 } = _Scene60;
var {
  BaseProperties: BaseProperties10,
  HierarchySeriesProperties: HierarchySeriesProperties2,
  HighlightStyle: HighlightStyle2,
  SeriesTooltip: SeriesTooltip16,
  Validate: Validate52,
  BOOLEAN: BOOLEAN17,
  COLOR_STRING: COLOR_STRING23,
  FUNCTION: FUNCTION16,
  NUMBER: NUMBER13,
  OBJECT: OBJECT21,
  POSITIVE_NUMBER: POSITIVE_NUMBER27,
  RATIO: RATIO29,
  STRING: STRING20,
  STRING_ARRAY,
  TEXT_ALIGN: TEXT_ALIGN2,
  VERTICAL_ALIGN: VERTICAL_ALIGN2
} = _ModuleSupport95;
var TreemapGroupLabel = class extends Label9 {
  constructor() {
    super(...arguments);
    this.spacing = 0;
  }
};
__decorateClass([
  Validate52(NUMBER13)
], TreemapGroupLabel.prototype, "spacing", 2);
var TreemapSeriesGroup = class extends BaseProperties10 {
  constructor() {
    super(...arguments);
    this.fillOpacity = 1;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.cornerRadius = 0;
    this.textAlign = "center";
    this.gap = 0;
    this.padding = 0;
    this.interactive = true;
    this.label = new TreemapGroupLabel();
  }
};
__decorateClass([
  Validate52(STRING20, { optional: true })
], TreemapSeriesGroup.prototype, "fill", 2);
__decorateClass([
  Validate52(RATIO29)
], TreemapSeriesGroup.prototype, "fillOpacity", 2);
__decorateClass([
  Validate52(COLOR_STRING23, { optional: true })
], TreemapSeriesGroup.prototype, "stroke", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27)
], TreemapSeriesGroup.prototype, "strokeWidth", 2);
__decorateClass([
  Validate52(RATIO29)
], TreemapSeriesGroup.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27)
], TreemapSeriesGroup.prototype, "cornerRadius", 2);
__decorateClass([
  Validate52(TEXT_ALIGN2)
], TreemapSeriesGroup.prototype, "textAlign", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27)
], TreemapSeriesGroup.prototype, "gap", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27)
], TreemapSeriesGroup.prototype, "padding", 2);
__decorateClass([
  Validate52(BOOLEAN17)
], TreemapSeriesGroup.prototype, "interactive", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesGroup.prototype, "label", 2);
var TreemapSeriesTile = class extends BaseProperties10 {
  constructor() {
    super(...arguments);
    this.fillOpacity = 1;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.cornerRadius = 0;
    this.textAlign = "center";
    this.verticalAlign = "middle";
    this.gap = 0;
    this.padding = 0;
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
  }
};
__decorateClass([
  Validate52(STRING20, { optional: true })
], TreemapSeriesTile.prototype, "fill", 2);
__decorateClass([
  Validate52(RATIO29)
], TreemapSeriesTile.prototype, "fillOpacity", 2);
__decorateClass([
  Validate52(COLOR_STRING23, { optional: true })
], TreemapSeriesTile.prototype, "stroke", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27, { optional: true })
], TreemapSeriesTile.prototype, "strokeWidth", 2);
__decorateClass([
  Validate52(RATIO29)
], TreemapSeriesTile.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27)
], TreemapSeriesTile.prototype, "cornerRadius", 2);
__decorateClass([
  Validate52(TEXT_ALIGN2)
], TreemapSeriesTile.prototype, "textAlign", 2);
__decorateClass([
  Validate52(VERTICAL_ALIGN2)
], TreemapSeriesTile.prototype, "verticalAlign", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27)
], TreemapSeriesTile.prototype, "gap", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27)
], TreemapSeriesTile.prototype, "padding", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesTile.prototype, "label", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesTile.prototype, "secondaryLabel", 2);
var TreemapSeriesGroupHighlightStyle = class extends BaseProperties10 {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
  }
};
__decorateClass([
  Validate52(STRING20, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate52(RATIO29, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate52(COLOR_STRING23, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate52(RATIO29, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesGroupHighlightStyle.prototype, "label", 2);
var TreemapSeriesTileHighlightStyle = class extends BaseProperties10 {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
  }
};
__decorateClass([
  Validate52(STRING20, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate52(RATIO29, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate52(COLOR_STRING23, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER27, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate52(RATIO29, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesTileHighlightStyle.prototype, "label", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesTileHighlightStyle.prototype, "secondaryLabel", 2);
var TreemapSeriesHighlightStyle = class extends HighlightStyle2 {
  constructor() {
    super(...arguments);
    this.group = new TreemapSeriesGroupHighlightStyle();
    this.tile = new TreemapSeriesTileHighlightStyle();
  }
};
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesHighlightStyle.prototype, "group", 2);
__decorateClass([
  Validate52(OBJECT21)
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
  Validate52(STRING20, { optional: true })
], TreemapSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate52(STRING20, { optional: true })
], TreemapSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate52(STRING20, { optional: true })
], TreemapSeriesProperties.prototype, "secondaryLabelKey", 2);
__decorateClass([
  Validate52(FUNCTION16, { optional: true })
], TreemapSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesProperties.prototype, "highlightStyle", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesProperties.prototype, "group", 2);
__decorateClass([
  Validate52(OBJECT21)
], TreemapSeriesProperties.prototype, "tile", 2);
__decorateClass([
  Validate52(STRING_ARRAY)
], TreemapSeriesProperties.prototype, "undocumentedGroupFills", 2);
__decorateClass([
  Validate52(STRING_ARRAY)
], TreemapSeriesProperties.prototype, "undocumentedGroupStrokes", 2);

// packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts
var { Rect: Rect5, Group: Group14, BBox: BBox10, Selection: Selection11, Text: Text11 } = _Scene61;
var { Color: Color2, Logger: Logger13, isEqual: isEqual2, sanitizeHtml: sanitizeHtml13 } = _Util46;
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
var DistantGroup = class extends _Scene61.Group {
  distanceSquared(x, y) {
    return this.computeBBox().distanceSquared(x, y);
  }
};
var _TreemapSeries = class _TreemapSeries extends _ModuleSupport96.HierarchySeries {
  constructor() {
    super(...arguments);
    this.properties = new TreemapSeriesProperties();
    this.groupSelection = Selection11.select(this.contentGroup, DistantGroup);
    this.highlightSelection = Selection11.select(
      this.highlightGroup,
      Group14
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
  squarify(node, bbox, outputBoxes, outputPadding) {
    const { index, datum, children } = node;
    if (bbox.width <= 0 || bbox.height <= 0) {
      outputBoxes[index] = void 0;
      outputPadding[index] = void 0;
      return;
    }
    const padding = datum != null ? this.getNodePadding(node, bbox) : { top: 0, right: 0, bottom: 0, left: 0 };
    outputBoxes[index] = index === 0 ? void 0 : bbox;
    outputPadding[index] = index === 0 ? void 0 : padding;
    const sortedChildrenIndices = Array.from(children, (_, i2) => i2).filter((i2) => nodeSize(children[i2]) > 0).sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));
    const childAt = (i2) => {
      const sortedIndex = sortedChildrenIndices[i2];
      return children[sortedIndex];
    };
    const allLeafNodes = sortedChildrenIndices.every((sortedIndex) => children[sortedIndex].children.length === 0);
    const targetTileAspectRatio = 1;
    const width = bbox.width - padding.left - padding.right;
    const height = bbox.height - padding.top - padding.bottom;
    if (width <= 0 || height <= 0)
      return;
    const numChildren = sortedChildrenIndices.length;
    let stackSum = 0;
    let startIndex = 0;
    let minRatioDiff = Infinity;
    let partitionSum = sortedChildrenIndices.reduce((sum, sortedIndex) => sum + nodeSize(children[sortedIndex]), 0);
    const innerBox = new BBox10(bbox.x + padding.left, bbox.y + padding.top, width, height);
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
        const childBbox = new BBox10(x, y, stackWidth, stackHeight);
        this.applyGap(innerBox, childBbox, allLeafNodes);
        this.squarify(child, childBbox, outputBoxes, outputPadding);
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
      const childBox = new BBox10(x, y, childWidth, childHeight);
      this.applyGap(innerBox, childBox, allLeafNodes);
      this.squarify(child, childBox, outputBoxes, outputPadding);
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
      if (!isEqual2(innerBounds[side], childBounds[side])) {
        childBox.shrink(gap, side);
      }
    });
  }
  createNodeData() {
    return __async(this, null, function* () {
      return void 0;
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
    const { datum, depth, children } = node;
    const { colorKey, labelKey, secondaryLabelKey, sizeKey, tile, group, formatter } = this.properties;
    if (!formatter || datum == null || depth == null) {
      return {};
    }
    const isLeaf = children.length === 0;
    const fill = this.getNodeFill(node);
    const stroke = this.getNodeStroke(node);
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
      const paddings = Array.from(this.rootNode, () => void 0);
      this.squarify(rootNode, new BBox10(0, 0, width, height), bboxes, paddings);
      let highlightedNode = (_b = this.ctx.highlightManager) == null ? void 0 : _b.getActiveHighlight();
      if (highlightedNode != null && !this.properties.group.interactive && highlightedNode.children.length !== 0) {
        highlightedNode = void 0;
      }
      this.updateNodeMidPoint(bboxes);
      const updateRectFn = (node, rect, highlighted) => {
        var _a3, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k;
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
        rect.crisp = true;
        rect.fill = validateColor(fill);
        rect.fillOpacity = fillOpacity;
        rect.stroke = validateColor(stroke);
        rect.strokeWidth = strokeWidth;
        rect.strokeOpacity = strokeOpacity;
        rect.cornerRadius = isLeaf ? tile.cornerRadius : group.cornerRadius;
        const onlyLeaves = (_k = node.parent) == null ? void 0 : _k.children.every((n) => n.children.length === 0);
        const parentBbox = node.parent != null ? bboxes[node.parent.index] : void 0;
        const parentPadding = node.parent != null ? paddings[node.parent.index] : void 0;
        if (onlyLeaves === true && parentBbox != null && parentPadding != null) {
          rect.clipBBox = bbox;
          rect.x = parentBbox.x + parentPadding.left;
          rect.y = parentBbox.y + parentPadding.top;
          rect.width = parentBbox.width - (parentPadding.left + parentPadding.right);
          rect.height = parentBbox.height - (parentPadding.top + parentPadding.bottom);
        } else {
          rect.clipBBox = void 0;
          rect.x = bbox.x;
          rect.y = bbox.y;
          rect.width = bbox.width;
          rect.height = bbox.height;
        }
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
  pickNodeClosestDatum(point) {
    return this.pickNodeNearestDistantObject(point, this.groupSelection.nodes());
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
      sizeName = sizeKey,
      childrenKey
    } = this.properties;
    const isLeaf = node.children.length === 0;
    const interactive = isLeaf || this.properties.group.interactive;
    if (datum == null || depth == null || !interactive) {
      return _ModuleSupport96.EMPTY_TOOLTIP_CONTENT;
    }
    const title = labelKey != null ? datum[labelKey] : void 0;
    const format = this.getTileFormat(node, false);
    const color = (_a2 = format == null ? void 0 : format.fill) != null ? _a2 : this.getNodeFill(node);
    if (!tooltip.renderer && !title) {
      return _ModuleSupport96.EMPTY_TOOLTIP_CONTENT;
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
      seriesId,
      childrenKey,
      colorName,
      itemId: void 0,
      sizeName
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
} = _Theme39;
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
import { _Theme as _Theme41 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeries.ts
import { _ModuleSupport as _ModuleSupport98, _Scale as _Scale20, _Scene as _Scene63, _Util as _Util47 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport97, _Scene as _Scene62 } from "ag-charts-community";
var { DropShadow: DropShadow3, Label: Label10 } = _Scene62;
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties5,
  BaseProperties: BaseProperties11,
  PropertiesArray: PropertiesArray3,
  SeriesTooltip: SeriesTooltip17,
  Validate: Validate53,
  BOOLEAN: BOOLEAN18,
  COLOR_STRING: COLOR_STRING24,
  FUNCTION: FUNCTION17,
  LINE_DASH: LINE_DASH18,
  NUMBER: NUMBER14,
  OBJECT: OBJECT22,
  OBJECT_ARRAY: OBJECT_ARRAY2,
  POSITIVE_NUMBER: POSITIVE_NUMBER28,
  RATIO: RATIO30,
  STRING: STRING21,
  UNION: UNION6
} = _ModuleSupport97;
var WaterfallSeriesTotal = class extends BaseProperties11 {
};
__decorateClass([
  Validate53(UNION6(["subtotal", "total"], "a total type"))
], WaterfallSeriesTotal.prototype, "totalType", 2);
__decorateClass([
  Validate53(NUMBER14)
], WaterfallSeriesTotal.prototype, "index", 2);
__decorateClass([
  Validate53(STRING21)
], WaterfallSeriesTotal.prototype, "axisLabel", 2);
var WaterfallSeriesItemTooltip = class extends BaseProperties11 {
};
__decorateClass([
  Validate53(FUNCTION17, { optional: true })
], WaterfallSeriesItemTooltip.prototype, "renderer", 2);
var WaterfallSeriesLabel = class extends Label10 {
  constructor() {
    super(...arguments);
    this.placement = "end";
    this.padding = 6;
  }
};
__decorateClass([
  Validate53(UNION6(["start", "end", "inside"], "a placement"))
], WaterfallSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate53(POSITIVE_NUMBER28)
], WaterfallSeriesLabel.prototype, "padding", 2);
var WaterfallSeriesItem = class extends BaseProperties11 {
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
  Validate53(STRING21, { optional: true })
], WaterfallSeriesItem.prototype, "name", 2);
__decorateClass([
  Validate53(COLOR_STRING24)
], WaterfallSeriesItem.prototype, "fill", 2);
__decorateClass([
  Validate53(COLOR_STRING24)
], WaterfallSeriesItem.prototype, "stroke", 2);
__decorateClass([
  Validate53(RATIO30)
], WaterfallSeriesItem.prototype, "fillOpacity", 2);
__decorateClass([
  Validate53(RATIO30)
], WaterfallSeriesItem.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate53(LINE_DASH18)
], WaterfallSeriesItem.prototype, "lineDash", 2);
__decorateClass([
  Validate53(POSITIVE_NUMBER28)
], WaterfallSeriesItem.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate53(POSITIVE_NUMBER28)
], WaterfallSeriesItem.prototype, "strokeWidth", 2);
__decorateClass([
  Validate53(POSITIVE_NUMBER28)
], WaterfallSeriesItem.prototype, "cornerRadius", 2);
__decorateClass([
  Validate53(FUNCTION17, { optional: true })
], WaterfallSeriesItem.prototype, "formatter", 2);
__decorateClass([
  Validate53(OBJECT22)
], WaterfallSeriesItem.prototype, "shadow", 2);
__decorateClass([
  Validate53(OBJECT22)
], WaterfallSeriesItem.prototype, "label", 2);
__decorateClass([
  Validate53(OBJECT22)
], WaterfallSeriesItem.prototype, "tooltip", 2);
var WaterfallSeriesConnectorLine = class extends BaseProperties11 {
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
  Validate53(BOOLEAN18)
], WaterfallSeriesConnectorLine.prototype, "enabled", 2);
__decorateClass([
  Validate53(COLOR_STRING24)
], WaterfallSeriesConnectorLine.prototype, "stroke", 2);
__decorateClass([
  Validate53(RATIO30)
], WaterfallSeriesConnectorLine.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate53(LINE_DASH18)
], WaterfallSeriesConnectorLine.prototype, "lineDash", 2);
__decorateClass([
  Validate53(POSITIVE_NUMBER28)
], WaterfallSeriesConnectorLine.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate53(POSITIVE_NUMBER28)
], WaterfallSeriesConnectorLine.prototype, "strokeWidth", 2);
var WaterfallSeriesItems = class extends BaseProperties11 {
  constructor() {
    super(...arguments);
    this.positive = new WaterfallSeriesItem();
    this.negative = new WaterfallSeriesItem();
    this.total = new WaterfallSeriesItem();
  }
};
__decorateClass([
  Validate53(OBJECT22)
], WaterfallSeriesItems.prototype, "positive", 2);
__decorateClass([
  Validate53(OBJECT22)
], WaterfallSeriesItems.prototype, "negative", 2);
__decorateClass([
  Validate53(OBJECT22)
], WaterfallSeriesItems.prototype, "total", 2);
var WaterfallSeriesProperties = class extends AbstractBarSeriesProperties5 {
  constructor() {
    super(...arguments);
    this.item = new WaterfallSeriesItems();
    this.totals = new PropertiesArray3(WaterfallSeriesTotal);
    this.line = new WaterfallSeriesConnectorLine();
    this.tooltip = new SeriesTooltip17();
  }
};
__decorateClass([
  Validate53(STRING21)
], WaterfallSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate53(STRING21)
], WaterfallSeriesProperties.prototype, "yKey", 2);
__decorateClass([
  Validate53(STRING21, { optional: true })
], WaterfallSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate53(STRING21, { optional: true })
], WaterfallSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate53(OBJECT22)
], WaterfallSeriesProperties.prototype, "item", 2);
__decorateClass([
  Validate53(OBJECT_ARRAY2)
], WaterfallSeriesProperties.prototype, "totals", 2);
__decorateClass([
  Validate53(OBJECT22)
], WaterfallSeriesProperties.prototype, "line", 2);
__decorateClass([
  Validate53(OBJECT22)
], WaterfallSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeries.ts
var {
  adjustLabelPlacement,
  SeriesNodePickMode: SeriesNodePickMode12,
  fixNumericExtent: fixNumericExtent9,
  valueProperty: valueProperty14,
  keyProperty: keyProperty8,
  accumulativeValueProperty,
  trailingAccumulatedValueProperty,
  ChartAxisDirection: ChartAxisDirection16,
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
  DEFAULT_CARTESIAN_DIRECTION_NAMES: DEFAULT_CARTESIAN_DIRECTION_NAMES2,
  isFiniteNumber: isFiniteNumber10,
  computeBarFocusBounds: computeBarFocusBounds6
} = _ModuleSupport98;
var { Rect: Rect6, motion: motion9 } = _Scene63;
var { sanitizeHtml: sanitizeHtml14, isContinuous } = _Util47;
var { ContinuousScale: ContinuousScale4 } = _Scale20;
var WaterfallSeries = class extends _ModuleSupport98.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS2,
      directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES2,
      pickModes: [SeriesNodePickMode12.EXACT_SHAPE_MATCH],
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
      if (!this.properties.isValid() || !this.visible)
        return;
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
      const extraProps = [];
      if (!this.ctx.animationManager.isSkipped()) {
        extraProps.push(animationValidation9());
      }
      const xScale = (_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale;
      const yScale = (_b = this.getValueAxis()) == null ? void 0 : _b.scale;
      const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
      const { processedData } = yield this.requestDataModel(dataController, dataWithTotals, {
        props: [
          keyProperty8(xKey, xScaleType, { id: `xValue` }),
          accumulativeValueProperty(yKey, yScaleType, __spreadProps(__spreadValues({}, propertyDefinition), {
            id: `yCurrent`
          })),
          accumulativeValueProperty(yKey, yScaleType, __spreadProps(__spreadValues({}, propertyDefinition), {
            missingValue: 0,
            id: `yCurrentTotal`
          })),
          accumulativeValueProperty(yKey, yScaleType, __spreadProps(__spreadValues({}, propertyDefinition), {
            id: `yCurrentPositive`,
            validation: positiveNumber
          })),
          accumulativeValueProperty(yKey, yScaleType, __spreadProps(__spreadValues({}, propertyDefinition), {
            id: `yCurrentNegative`,
            validation: negativeNumber
          })),
          trailingAccumulatedValueProperty(yKey, yScaleType, __spreadProps(__spreadValues({}, propertyDefinition), {
            id: `yPrevious`
          })),
          valueProperty14(yKey, yScaleType, { id: `yRaw` }),
          // Raw value pass-through.
          valueProperty14("totalType", "band", {
            id: `totalTypeValue`,
            missingValue: void 0,
            validation: totalTypeValue
          }),
          ...isContinuousX ? [_ModuleSupport98.SMALLEST_KEY_INTERVAL] : [],
          ...extraProps
        ]
      });
      this.smallestDataInterval = (_c = processedData.reduced) == null ? void 0 : _c.smallestKeyInterval;
      this.updateSeriesItemTypes();
      this.animationState.transition("updateData");
    });
  }
  getSeriesDomain(direction) {
    var _a2;
    const { processedData, dataModel, smallestDataInterval } = this;
    if (!processedData || !dataModel)
      return [];
    const {
      keys: [keys],
      values
    } = processedData.domain;
    const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
    if (direction === this.getCategoryDirection()) {
      if ((keyDef == null ? void 0 : keyDef.def.type) === "key" && (keyDef == null ? void 0 : keyDef.def.valueType) === "category") {
        return keys;
      }
      const scalePadding = isFiniteNumber10(smallestDataInterval) ? smallestDataInterval : 0;
      const keysExtent = (_a2 = _ModuleSupport98.extent(keys)) != null ? _a2 : [NaN, NaN];
      const categoryAxis = this.getCategoryAxis();
      const isReversed = Boolean(categoryAxis == null ? void 0 : categoryAxis.isReversed());
      const isDirectionY = direction === ChartAxisDirection16.Y;
      const padding0 = isReversed === isDirectionY ? 0 : -scalePadding;
      const padding1 = isReversed === isDirectionY ? scalePadding : 0;
      const d0 = keysExtent[0] + padding0;
      const d1 = keysExtent[1] + padding1;
      return fixNumericExtent9([d0, d1], categoryAxis);
    } else {
      const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrent");
      const yExtent = values[yCurrIndex];
      const fixedYExtent = [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])];
      return fixNumericExtent9(fixedYExtent);
    }
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b, _c;
      const { data, dataModel, smallestDataInterval } = this;
      const { line } = this.properties;
      const categoryAxis = this.getCategoryAxis();
      const valueAxis = this.getValueAxis();
      if (!(data && categoryAxis && valueAxis && dataModel)) {
        return;
      }
      const xScale = categoryAxis.scale;
      const yScale = valueAxis.scale;
      const categoryAxisReversed = categoryAxis.isReversed();
      const barAlongX = this.getBarDirection() === ChartAxisDirection16.X;
      const barWidth = (_a2 = ContinuousScale4.is(xScale) ? xScale.calcBandwidth(smallestDataInterval) : xScale.bandwidth) != null ? _a2 : 10;
      if (((_b = this.processedData) == null ? void 0 : _b.type) !== "ungrouped") {
        return;
      }
      const context = {
        itemId: this.properties.yKey,
        nodeData: [],
        labelData: [],
        pointData: [],
        scales: this.calculateScaling(),
        visible: this.visible
      };
      if (!this.visible)
        return context;
      const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yRaw`);
      const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`);
      const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`);
      const pointData = [];
      const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrent");
      const yPrevIndex = dataModel.resolveProcessedDataIndexById(this, "yPrevious");
      const yCurrTotalIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrentTotal");
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
            itemId: seriesItemType === "subtotal" ? "total" : seriesItemType,
            value,
            datum,
            xKey,
            yKey,
            xName,
            yName
          },
          (v) => isFiniteNumber10(v) ? v.toFixed(2) : String(v)
        );
        const nodeDatum = {
          index: dataIndex,
          series: this,
          itemId: seriesItemType,
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
        context.nodeData.push(nodeDatum);
        context.labelData.push(nodeDatum);
      });
      const connectorLinesEnabled = this.properties.line.enabled;
      if (yCurrIndex !== void 0 && connectorLinesEnabled) {
        context.pointData = pointData;
      }
      return context;
    });
  }
  updateSeriesItemTypes() {
    var _a2, _b;
    const { dataModel, seriesItemTypes, processedData } = this;
    if (!dataModel || !processedData) {
      return;
    }
    seriesItemTypes.clear();
    const yPositiveIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrentPositive");
    const yNegativeIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrentNegative");
    const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`);
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
      const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection16.X;
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
      return _ModuleSupport98.EMPTY_TOOLTIP_CONTENT;
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
      { seriesId, itemId, datum, xKey, yKey, xName, yName, color, title }
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
  animateEmptyUpdateReady({ datumSelection, labelSelection, contextData, paths }) {
    const fns = prepareBarAnimationFunctions3(collapsedStartingBarPosition2(this.isVertical(), this.axes, "normal"));
    motion9.fromToMotion(this.id, "datums", this.ctx.animationManager, [datumSelection], fns);
    seriesLabelFadeInAnimation7(this, "labels", this.ctx.animationManager, labelSelection);
    const { pointData } = contextData;
    if (!pointData)
      return;
    const [lineNode] = paths;
    if (this.isVertical()) {
      this.animateConnectorLinesVertical(lineNode, pointData);
    } else {
      this.animateConnectorLinesHorizontal(lineNode, pointData);
    }
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
      ease: _ModuleSupport98.Motion.easeOut,
      collapsable: false,
      onUpdate(pointX) {
        linePath.clear(true);
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
      ease: _ModuleSupport98.Motion.easeOut,
      collapsable: false,
      onUpdate(pointY) {
        linePath.clear(true);
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
      this.resetConnectorLinesPath({ contextData: opts.contextData, paths: opts.paths });
    });
  }
  resetConnectorLinesPath({ contextData, paths }) {
    if (paths.length === 0) {
      return;
    }
    const [lineNode] = paths;
    this.updateLineNode(lineNode);
    const { path: linePath } = lineNode;
    linePath.clear(true);
    const { pointData } = contextData;
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
      pointerEvents: _Scene63.PointerEvents.None
    });
  }
  isLabelEnabled() {
    const { positive, negative, total } = this.properties.item;
    return positive.label.enabled || negative.label.enabled || total.label.enabled;
  }
  onDataChange() {
  }
  computeFocusBounds({ datumIndex, seriesRect }) {
    var _a2;
    return computeBarFocusBounds6((_a2 = this.contextNodeData) == null ? void 0 : _a2.nodeData[datumIndex], this.contentGroup, seriesRect);
  }
};
WaterfallSeries.className = "WaterfallSeries";
WaterfallSeries.type = "waterfall";

// packages/ag-charts-enterprise/src/series/waterfall/waterfallThemes.ts
import { _Theme as _Theme40 } from "ag-charts-community";
var itemTheme = {
  strokeWidth: 0,
  label: {
    enabled: false,
    fontStyle: void 0,
    fontWeight: _Theme40.FONT_WEIGHT.NORMAL,
    fontSize: 12,
    fontFamily: _Theme40.DEFAULT_FONT_FAMILY,
    color: _Theme40.DEFAULT_LABEL_COLOUR,
    formatter: void 0,
    placement: "end"
  }
};
var WATERFALL_SERIES_THEME = {
  series: {
    __extends__: _Theme40.EXTENDS_SERIES_DEFAULTS,
    item: {
      positive: itemTheme,
      negative: itemTheme,
      total: itemTheme
    },
    line: {
      stroke: _Theme40.DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
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
      type: _Theme41.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: _Theme41.POSITION.BOTTOM
    },
    {
      type: _Theme41.CARTESIAN_AXIS_TYPE.NUMBER,
      position: _Theme41.POSITION.LEFT
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
        positive: properties.get(_Theme41.DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS),
        negative: properties.get(_Theme41.DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS),
        total: properties.get(_Theme41.DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS)
      }
    };
  }
};

// packages/ag-charts-enterprise/src/setup.ts
function setupEnterpriseModules() {
  _ModuleSupport99.moduleRegistry.register(
    AngleCategoryAxisModule,
    AngleNumberAxisModule,
    AnimationModule,
    AnnotationsModule,
    BackgroundModule,
    BoxPlotModule,
    CandlestickModule,
    OhlcModule,
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
    RangeAreaModule,
    SunburstModule,
    SyncModule,
    TreemapModule,
    WaterfallModule,
    ZoomModule
  );
  _ModuleSupport99.enterpriseModule.isEnterprise = true;
  _ModuleSupport99.enterpriseModule.licenseManager = (options) => {
    var _a2, _b;
    return new LicenseManager(
      (_b = (_a2 = options.container) == null ? void 0 : _a2.ownerDocument) != null ? _b : typeof document === "undefined" ? void 0 : document
    );
  };
  _ModuleSupport99.enterpriseModule.injectWatermark = injectWatermark;
}

// packages/ag-charts-enterprise/src/main.ts
export * from "ag-charts-community";
setupEnterpriseModules();
export {
  AgCharts,
  time
};
