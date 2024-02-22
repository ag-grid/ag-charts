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
import "ag-charts-community";
import { AgCharts, time } from "ag-charts-community";

// packages/ag-charts-enterprise/src/setup.ts
import { _ModuleSupport as _ModuleSupport66 } from "ag-charts-community";

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
  const loop = (start, end, step2, iterator2) => {
    let prev = items[0];
    for (let i = start; step2 > 0 ? i <= end : i > end; i += step2) {
      const curr = items[i];
      if (iterator2(prev, curr))
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
  calculatePadding() {
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
    return void 0;
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
    var _a2;
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
      const angles = (((_a2 = scale.ticks) == null ? void 0 : _a2.call(scale)) || []).map((value) => scale.convert(value));
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
      textAlign = isCos0 ? "center" : isCosPositive ? "left" : "right";
      textBaseline = isSin0 ? "middle" : isSinPositive ? "top" : "bottom";
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
var { RATIO: RATIO2, Validate: Validate3 } = _ModuleSupport4;
var { BandScale } = _Scale2;
var { isNumberEqual: isNumberEqual3 } = _Util4;
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
import { _ModuleSupport as _ModuleSupport5, _Util as _Util6 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/axes/angle-number/linearAngleScale.ts
import { _Scale as _Scale3, _Util as _Util5 } from "ag-charts-community";
var { LinearScale, Invalidating } = _Scale3;
var { isNumberEqual: isNumberEqual4, range } = _Util5;
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
      if (!this.isDenseInterval({ start: d0, stop: d1, interval: step2 })) {
        return range(d0, d1, step2);
      }
    }
    const step = this.nice && this.niceTickStep ? this.niceTickStep : this.getTickStep(d0, d1);
    return range(d0, d1, step);
  }
  hasNiceRange() {
    const range2 = this.range.slice().sort((a, b) => a - b);
    const niceRanges = [Math.PI, 2 * Math.PI];
    return niceRanges.some((r) => isNumberEqual4(r, range2[1] - range2[0]));
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
var { AND: AND3, Default, GREATER_THAN: GREATER_THAN2, LESS_THAN, NUMBER_OR_NAN, MIN_SPACING, Validate: Validate4 } = _ModuleSupport5;
var { angleBetween: angleBetween2, isNumberEqual: isNumberEqual5, normalisedExtentWithMetadata } = _Util6;
var AngleNumberAxisTick = class extends _ModuleSupport5.AxisTick {
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
    const { extent: extent5, clipped } = normalisedExtentWithMetadata(d, min, max);
    return { domain: extent5, clipped };
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

// packages/ag-charts-enterprise/src/axes/radius/radiusAxisThemes.ts
import { _Theme as _Theme2 } from "ag-charts-community";
var RADIUS_AXIS_THEME = {
  __extends__: _Theme2.EXTENDS_AXES_DEFAULTS,
  line: {
    enabled: false,
    __extends__: _Theme2.EXTENDS_AXES_LINE_DEFAULTS
  },
  tick: {
    enabled: false,
    __extends__: _Theme2.EXTENDS_AXES_TICK_DEFAULTS
  }
};

// packages/ag-charts-enterprise/src/axes/radius-category/radiusCategoryAxis.ts
import { _ModuleSupport as _ModuleSupport8, _Scale as _Scale5 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/axes/radius/radiusAxis.ts
import { _ModuleSupport as _ModuleSupport7, _Scene as _Scene5, _Util as _Util8 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/axes/polar-crosslines/radiusCrossLine.ts
import { _ModuleSupport as _ModuleSupport6, _Scale as _Scale4, _Scene as _Scene4, _Util as _Util7 } from "ag-charts-community";
var { ChartAxisDirection: ChartAxisDirection4, Validate: Validate5, DEGREE, validateCrossLineValues: validateCrossLineValues2 } = _ModuleSupport6;
var { Path: Path3, Sector: Sector2, Text: Text3 } = _Scene4;
var { normalizeAngle360: normalizeAngle3603, toRadians: toRadians2, isNumberEqual: isNumberEqual6 } = _Util7;
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
    if (type === "line" && scale instanceof _Scale4.BandScale) {
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
    sector.innerRadius = _Util7.clamp(axisInnerRadius, innerRadius + padding, axisOuterRadius);
    sector.outerRadius = _Util7.clamp(axisInnerRadius, outerRadius - padding, axisOuterRadius);
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
    return scale instanceof _Scale4.BandScale ? (step - bandwidth) / 2 : 0;
  }
};
_RadiusCrossLine.className = "RadiusCrossLine";
var RadiusCrossLine = _RadiusCrossLine;

// packages/ag-charts-enterprise/src/axes/radius/radiusAxis.ts
var { assignJsonApplyConstructedArray: assignJsonApplyConstructedArray2, ChartAxisDirection: ChartAxisDirection5, Default: Default2, Layers: Layers2, DEGREE: DEGREE2, MIN_SPACING: MIN_SPACING2, BOOLEAN: BOOLEAN2, Validate: Validate6 } = _ModuleSupport7;
var { Caption, Group: Group2, Path: Path4, Selection } = _Scene5;
var { isNumberEqual: isNumberEqual7, normalizeAngle360: normalizeAngle3604, toRadians: toRadians3 } = _Util8;
var RadiusAxisTick = class extends _ModuleSupport7.AxisTick {
  constructor() {
    super(...arguments);
    this.maxSpacing = NaN;
  }
};
__decorateClass([
  Validate6(MIN_SPACING2),
  Default2(NaN)
], RadiusAxisTick.prototype, "maxSpacing", 2);
var RadiusAxisLabel = class extends _ModuleSupport7.AxisLabel {
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
var RadiusAxis = class extends _ModuleSupport7.PolarAxis {
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
      angles.forEach((angle, i) => {
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
        angles.forEach((angle2, i2) => {
          const x2 = radius * Math.cos(angle2);
          const y2 = radius * Math.sin(angle2);
          if (i2 === 0) {
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
var { RATIO: RATIO3, ProxyPropertyOnWrite, Validate: Validate7 } = _ModuleSupport8;
var { BandScale: BandScale2 } = _Scale5;
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
import { _ModuleSupport as _ModuleSupport9, _Scale as _Scale6, _Util as _Util9 } from "ag-charts-community";
var { AND: AND4, Default: Default3, GREATER_THAN: GREATER_THAN3, LESS_THAN: LESS_THAN2, NUMBER_OR_NAN: NUMBER_OR_NAN2, Validate: Validate8 } = _ModuleSupport9;
var { LinearScale: LinearScale2 } = _Scale6;
var { normalisedExtentWithMetadata: normalisedExtentWithMetadata2 } = _Util9;
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
    const { extent: extent5, clipped } = normalisedExtentWithMetadata2(d, min, max);
    return { domain: extent5, clipped };
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
import { _ModuleSupport as _ModuleSupport10 } from "ag-charts-community";
var { BOOLEAN: BOOLEAN3, POSITIVE_NUMBER: POSITIVE_NUMBER2, ActionOnSet, Validate: Validate9 } = _ModuleSupport10;
var Animation = class extends _ModuleSupport10.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.enabled = true;
    this.animationManager = ctx.animationManager;
    this.animationManager.skip(false);
  }
};
__decorateClass([
  ActionOnSet({
    newValue(value) {
      if (this.animationManager) {
        this.animationManager.skip(!value);
      }
    }
  }),
  Validate9(BOOLEAN3)
], Animation.prototype, "enabled", 2);
__decorateClass([
  ActionOnSet({
    newValue(value) {
      if (this.animationManager) {
        this.animationManager.defaultDuration = value;
      }
    }
  }),
  Validate9(POSITIVE_NUMBER2)
], Animation.prototype, "duration", 2);

// packages/ag-charts-enterprise/src/features/animation/animationModule.ts
var AnimationModule = {
  type: "root",
  optionsKey: "animation",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy"],
  instanceConstructor: Animation,
  themeTemplate: {
    animation: {
      enabled: true
    }
  }
};

// packages/ag-charts-enterprise/src/features/background/background.ts
import { _ModuleSupport as _ModuleSupport12 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/background/backgroundImage.ts
import { _ModuleSupport as _ModuleSupport11, _Scene as _Scene6 } from "ag-charts-community";
var { Image } = _Scene6;
var { BaseProperties, ObserveChanges, ProxyProperty, Validate: Validate10, NUMBER: NUMBER3, POSITIVE_NUMBER: POSITIVE_NUMBER3, RATIO: RATIO4 } = _ModuleSupport11;
var BackgroundImage = class extends BaseProperties {
  constructor(ctx) {
    super();
    this.loadedSynchronously = true;
    this.opacity = 1;
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
    this.imageElement = ctx.document.createElement("img");
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
      }, this.calculatePosition(this.imageElement.width, this.imageElement.height)) : { visible: false }
    );
  }
  calculatePosition(naturalWidth, naturalHeight) {
    let { top, right, bottom, left, width, height } = this;
    if (left != null) {
      if (width != null) {
        right = this.containerWidth - left + width;
      } else if (right != null) {
        width = this.containerWidth - left - right;
      }
    } else if (right != null && width != null) {
      left = this.containerWidth - right - width;
    }
    if (top != null) {
      if (height != null) {
        bottom = this.containerHeight - top - height;
      } else if (bottom != null) {
        height = this.containerHeight - bottom - top;
      }
    } else if (bottom != null && height != null) {
      top = this.containerHeight - bottom - height;
    }
    if (width == null) {
      if (height == null) {
        width = naturalWidth;
        height = naturalHeight;
      } else {
        width = Math.ceil(naturalWidth * height / naturalHeight);
      }
    } else if (height == null) {
      height = Math.ceil(naturalHeight * width / naturalWidth);
    }
    if (left == null) {
      if (right == null) {
        left = Math.floor((this.containerWidth - width) / 2);
      } else {
        left = this.containerWidth - right - width;
      }
    }
    if (top == null) {
      if (bottom == null) {
        top = Math.floor((this.containerHeight - height) / 2);
      } else {
        top = this.containerHeight - height - bottom;
      }
    }
    return { x: left, y: top, width, height };
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
  ObserveChanges((target) => target.loadedSynchronously = target.complete)
], BackgroundImage.prototype, "url", 2);

// packages/ag-charts-enterprise/src/features/background/background.ts
var { ActionOnSet: ActionOnSet2, OBJECT, Validate: Validate11 } = _ModuleSupport12;
var Background = class extends _ModuleSupport12.Background {
  constructor(ctx) {
    super(ctx);
    this.image = new BackgroundImage(ctx);
    this.updateService = ctx.updateService;
  }
  onLayoutComplete(event) {
    super.onLayoutComplete(event);
    if (this.image) {
      const { width, height } = event.chart;
      this.image.performLayout(width, height);
    }
  }
  onImageLoad() {
    this.updateService.update(_ModuleSupport12.ChartUpdateType.SCENE_RENDER);
  }
};
__decorateClass([
  Validate11(OBJECT, { optional: true }),
  ActionOnSet2({
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
  chartTypes: ["cartesian", "polar", "hierarchy"],
  instanceConstructor: Background
};

// packages/ag-charts-enterprise/src/features/context-menu/contextMenuModule.ts
import { _Theme as _Theme3 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/context-menu/contextMenu.ts
import { _ModuleSupport as _ModuleSupport13 } from "ag-charts-community";

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
var { BOOLEAN: BOOLEAN4, Validate: Validate12 } = _ModuleSupport13;
var _ContextMenu = class _ContextMenu extends _ModuleSupport13.BaseModuleInstance {
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
    const { Default: Default5, ContextMenu: ContextMenuState, All } = _ModuleSupport13.InteractionState;
    const contextState = Default5 | ContextMenuState;
    this.destroyFns.push(
      ctx.interactionManager.addListener("contextmenu", (event) => this.onContextMenu(event), contextState),
      ctx.interactionManager.addListener("click", () => this.onClick(), All)
    );
    this.groups = { default: [], node: [], extra: [], extraNode: [] };
    this.canvasElement = ctx.scene.canvas.element;
    this.container = ctx.document.body;
    this.element = this.container.appendChild(ctx.document.createElement("div"));
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
    if (_ContextMenu.contextMenuDocuments.indexOf(ctx.document) < 0) {
      const styleElement = ctx.document.createElement("style");
      styleElement.innerHTML = defaultContextMenuCss;
      ctx.document.head.insertBefore(styleElement, ctx.document.head.querySelector("style"));
      _ContextMenu.contextMenuDocuments.push(ctx.document);
    }
    this.registry.registerDefaultAction({
      id: "download",
      label: "Download",
      action: () => {
        const title = ctx.chartService.title;
        let fileName = "image";
        if (title !== void 0 && title.enabled && title.text !== void 0) {
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
    this.groups.default = this.registry.copyDefaultAction();
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
    this.interactionManager.pushState(_ModuleSupport13.InteractionState.ContextMenu);
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
    this.interactionManager.popState(_ModuleSupport13.InteractionState.ContextMenu);
    if (this.menuElement) {
      this.element.removeChild(this.menuElement);
      this.menuElement = void 0;
    }
    this.element.style.display = "none";
  }
  renderMenu() {
    const menuElement = this.ctx.document.createElement("div");
    menuElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
    menuElement.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    this.groups.default.forEach((i) => {
      const item = this.renderItem(i);
      if (item)
        menuElement.appendChild(item);
    });
    ["node", "extra", "extraNode"].forEach((group) => {
      if (this.groups[group].length === 0 || ["node", "extraNode"].includes(group) && !this.pickedNode)
        return;
      menuElement.appendChild(this.createDividerElement());
      this.groups[group].forEach((i) => {
        const item = this.renderItem(i);
        if (item)
          menuElement.appendChild(item);
      });
    });
    return menuElement;
  }
  renderItem(item) {
    if (item && typeof item === "object" && item.constructor === Object) {
      return this.createActionElement(item);
    }
  }
  createDividerElement() {
    const el = this.ctx.document.createElement("div");
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
    const el = this.ctx.document.createElement("button");
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
    el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    el.innerHTML = label;
    el.onclick = () => {
      var _a2, _b, _c;
      const params = {
        event: this.showEvent,
        datum: (_a2 = this.pickedNode) == null ? void 0 : _a2.datum,
        itemId: (_b = this.pickedNode) == null ? void 0 : _b.itemId,
        seriesId: (_c = this.pickedNode) == null ? void 0 : _c.series.id
      };
      callback(params);
      this.hide();
    };
    return el;
  }
  createDisabledElement(label) {
    const el = this.ctx.document.createElement("button");
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
    el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    el.disabled = true;
    el.innerHTML = label;
    return el;
  }
  reposition() {
    const {
      x,
      y,
      ctx: { window: window2 }
    } = this;
    this.element.style.top = "unset";
    this.element.style.bottom = "unset";
    this.element.style.left = "unset";
    this.element.style.right = "unset";
    if (x + this.element.offsetWidth > window2.innerWidth) {
      this.element.style.right = `calc(100% - ${x - 1}px)`;
    } else {
      this.element.style.left = `${x + 1}px`;
    }
    if (y + this.element.offsetHeight > window2.innerHeight) {
      this.element.style.bottom = `calc(100% - ${y}px - 0.5em)`;
    } else {
      this.element.style.top = `calc(${y}px - 0.5em)`;
    }
  }
  destroy() {
    var _a2, _b;
    super.destroy();
    this.destroyFns.forEach((f) => f());
    (_a2 = this.intersectionObserver) == null ? void 0 : _a2.unobserve(this.canvasElement);
    (_b = this.mutationObserver) == null ? void 0 : _b.disconnect();
  }
};
// Global shared state
_ContextMenu.contextMenuDocuments = [];
__decorateClass([
  Validate12(BOOLEAN4)
], _ContextMenu.prototype, "enabled", 2);
__decorateClass([
  Validate12(BOOLEAN4)
], _ContextMenu.prototype, "darkTheme", 2);
var ContextMenu = _ContextMenu;

// packages/ag-charts-enterprise/src/features/context-menu/contextMenuModule.ts
var ContextMenuModule = {
  type: "root",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy"],
  optionsKey: "contextMenu",
  instanceConstructor: ContextMenu,
  themeTemplate: {
    contextMenu: {
      enabled: true,
      darkTheme: _Theme3.IS_DARK_THEME
    }
  }
};

// packages/ag-charts-enterprise/src/features/crosshair/crosshair.ts
import { _ModuleSupport as _ModuleSupport15, _Scene as _Scene8 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/crosshair/crosshairLabel.ts
import { _ModuleSupport as _ModuleSupport14, _Scene as _Scene7 } from "ag-charts-community";
var { ActionOnSet: ActionOnSet3, BaseProperties: BaseProperties2, BOOLEAN: BOOLEAN5, FUNCTION, NUMBER: NUMBER4, STRING: STRING2, Validate: Validate13 } = _ModuleSupport14;
var { BBox } = _Scene7;
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
var _CrosshairLabel = class _CrosshairLabel extends BaseProperties2 {
  constructor(document2, container) {
    super();
    this.enabled = true;
    this.xOffset = 0;
    this.yOffset = 0;
    this.format = void 0;
    this.renderer = void 0;
    this.element = container.appendChild(document2.createElement("div"));
    this.element.classList.add(DEFAULT_LABEL_CLASS);
    this.labelRoot = container;
    if (_CrosshairLabel.labelDocuments.indexOf(document2) < 0) {
      const styleElement = document2.createElement("style");
      styleElement.innerHTML = defaultLabelCss;
      document2.head.insertBefore(styleElement, document2.head.querySelector("style"));
      _CrosshairLabel.labelDocuments.push(document2);
    }
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
    return new _Scene7.BBox(element.clientLeft, element.clientTop, element.clientWidth, element.clientHeight);
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
_CrosshairLabel.labelDocuments = [];
__decorateClass([
  Validate13(BOOLEAN5)
], _CrosshairLabel.prototype, "enabled", 2);
__decorateClass([
  Validate13(STRING2, { optional: true }),
  ActionOnSet3({
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
], _CrosshairLabel.prototype, "className", 2);
__decorateClass([
  Validate13(NUMBER4)
], _CrosshairLabel.prototype, "xOffset", 2);
__decorateClass([
  Validate13(NUMBER4)
], _CrosshairLabel.prototype, "yOffset", 2);
__decorateClass([
  Validate13(STRING2, { optional: true })
], _CrosshairLabel.prototype, "format", 2);
__decorateClass([
  Validate13(FUNCTION, { optional: true })
], _CrosshairLabel.prototype, "renderer", 2);
var CrosshairLabel = _CrosshairLabel;

// packages/ag-charts-enterprise/src/features/crosshair/crosshair.ts
var { Group: Group3, Line, BBox: BBox2 } = _Scene8;
var { POSITIVE_NUMBER: POSITIVE_NUMBER4, RATIO: RATIO5, BOOLEAN: BOOLEAN6, COLOR_STRING: COLOR_STRING2, LINE_DASH: LINE_DASH2, OBJECT: OBJECT2, Validate: Validate14, Layers: Layers3 } = _ModuleSupport15;
var Crosshair = class extends _ModuleSupport15.BaseModuleInstance {
  constructor(ctx) {
    var _a2, _b;
    super();
    this.ctx = ctx;
    this.enabled = false;
    this.stroke = "rgb(195, 195, 195)";
    this.lineDash = [6, 3];
    this.lineDashOffset = 0;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.snap = true;
    this.seriesRect = new BBox2(0, 0, 0, 0);
    this.hoverRect = new BBox2(0, 0, 0, 0);
    this.bounds = new BBox2(0, 0, 0, 0);
    this.visible = false;
    this.crosshairGroup = new Group3({ layer: true, zIndex: Layers3.SERIES_CROSSHAIR_ZINDEX });
    this.lineNode = this.crosshairGroup.appendChild(new Line());
    this.activeHighlight = void 0;
    (_a2 = ctx.scene.root) == null ? void 0 : _a2.appendChild(this.crosshairGroup);
    this.axisCtx = ctx.parent;
    this.crosshairGroup.visible = false;
    this.label = new CrosshairLabel(ctx.document, (_b = ctx.scene.canvas.container) != null ? _b : ctx.document.body);
    this.destroyFns.push(
      ctx.interactionManager.addListener("hover", (event) => this.onMouseMove(event)),
      ctx.interactionManager.addListener("leave", () => this.onMouseOut()),
      ctx.highlightManager.addListener("highlight-change", (event) => this.onHighlightChange(event)),
      ctx.layoutService.addListener("layout-complete", (event) => this.layout(event)),
      () => {
        var _a3;
        return (_a3 = ctx.scene.root) == null ? void 0 : _a3.removeChild(this.crosshairGroup);
      },
      () => this.label.destroy()
    );
  }
  layout({ series: { rect, paddedRect, visible }, axes }) {
    var _a2;
    this.hideCrosshair();
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
    crosshairGroup.translationY = Math.round(
      axisPosition === "top" || axisPosition === "bottom" ? bounds.y + bounds.height : bounds.y
    );
    const rotation = axisPosition === "top" || axisPosition === "bottom" ? -Math.PI / 2 : 0;
    crosshairGroup.rotation = rotation;
    this.updateLine();
    const format = (_a2 = this.label.format) != null ? _a2 : axisLayout.label.format;
    this.labelFormatter = format ? this.axisCtx.scaleValueFormatter(format) : void 0;
  }
  buildBounds(rect, axisPosition, padding) {
    const bounds = rect.clone();
    bounds.x += axisPosition === "left" ? -padding : 0;
    bounds.y += axisPosition === "top" ? -padding : 0;
    bounds.width += axisPosition === "left" || axisPosition === "right" ? padding : 0;
    bounds.height += axisPosition === "top" || axisPosition === "bottom" ? padding : 0;
    return bounds;
  }
  updateLine() {
    const {
      lineNode: line,
      bounds,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      axisCtx,
      axisLayout
    } = this;
    if (!axisLayout) {
      return;
    }
    line.stroke = stroke;
    line.strokeWidth = strokeWidth;
    line.strokeOpacity = strokeOpacity;
    line.lineDash = lineDash;
    line.lineDashOffset = lineDashOffset;
    line.y1 = line.y2 = 0;
    line.x1 = 0;
    line.x2 = axisCtx.direction === "x" ? bounds.height : bounds.width;
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
    const { crosshairGroup, seriesRect, hoverRect, axisCtx, activeHighlight } = this;
    const { offsetX, offsetY } = event;
    if (this.visible && hoverRect.containsPoint(offsetX, offsetY)) {
      crosshairGroup.visible = true;
      const highlight = activeHighlight ? this.getActiveHighlight(activeHighlight) : void 0;
      let value;
      let clampedX = 0;
      let clampedY = 0;
      if (axisCtx.direction === "x") {
        clampedX = Math.max(Math.min(seriesRect.x + seriesRect.width, offsetX), seriesRect.x);
        crosshairGroup.translationX = Math.round(clampedX);
        value = axisCtx.continuous ? axisCtx.scaleInvert(offsetX - seriesRect.x) : highlight == null ? void 0 : highlight.value;
      } else {
        clampedY = Math.max(Math.min(seriesRect.y + seriesRect.height, offsetY), seriesRect.y);
        crosshairGroup.translationY = Math.round(clampedY);
        value = axisCtx.continuous ? axisCtx.scaleInvert(offsetY - seriesRect.y) : highlight == null ? void 0 : highlight.value;
      }
      if (value && this.label.enabled) {
        this.showLabel(clampedX, clampedY, value);
      } else {
        this.hideLabel();
      }
    } else {
      this.hideCrosshair();
    }
  }
  onMouseOut() {
    this.hideCrosshair();
  }
  onHighlightChange(event) {
    var _a2, _b, _c;
    if (!this.enabled) {
      return;
    }
    const { crosshairGroup, seriesRect, axisCtx } = this;
    const { datum, series } = (_a2 = event.currentHighlight) != null ? _a2 : {};
    const hasCrosshair = datum && (((_b = series == null ? void 0 : series.axes.x) == null ? void 0 : _b.id) === axisCtx.axisId || ((_c = series == null ? void 0 : series.axes.y) == null ? void 0 : _c.id) === axisCtx.axisId);
    this.activeHighlight = hasCrosshair ? event.currentHighlight : void 0;
    if (this.snap) {
      if (!this.visible || !this.activeHighlight) {
        this.hideCrosshair();
        return;
      }
      const { value, position } = this.getActiveHighlight(this.activeHighlight);
      crosshairGroup.visible = true;
      let x = 0;
      let y = 0;
      if (axisCtx.direction === "x") {
        x = position;
        crosshairGroup.translationX = Math.round(x + seriesRect.x);
      } else {
        y = position;
        crosshairGroup.translationY = Math.round(y + seriesRect.y);
      }
      if (this.label.enabled) {
        this.showLabel(x + seriesRect.x, y + seriesRect.y, value);
      } else {
        this.hideLabel();
      }
    }
  }
  getActiveHighlight(activeHighlight) {
    var _a2, _b;
    const { axisCtx } = this;
    const { datum, xKey = "", yKey = "", aggregatedValue, series, cumulativeValue, midPoint } = activeHighlight;
    const halfBandwidth = axisCtx.scaleBandwidth() / 2;
    if (aggregatedValue !== void 0 && ((_a2 = series.axes.y) == null ? void 0 : _a2.id) === axisCtx.axisId) {
      return { value: aggregatedValue, position: axisCtx.scaleConvert(aggregatedValue) + halfBandwidth };
    }
    const isYValue = axisCtx.keys().indexOf(yKey) >= 0;
    if (cumulativeValue !== void 0 && isYValue) {
      return { value: cumulativeValue, position: axisCtx.scaleConvert(cumulativeValue) + halfBandwidth };
    }
    const key = isYValue ? yKey : xKey;
    const position = (_b = axisCtx.direction === "x" ? midPoint == null ? void 0 : midPoint.x : midPoint == null ? void 0 : midPoint.y) != null ? _b : 0;
    const value = axisCtx.continuous ? axisCtx.scaleInvert(position) : datum[key];
    return { value, position };
  }
  getLabelHtml(value) {
    const { label, axisLayout: { label: { fractionDigits = 0 } = {} } = {} } = this;
    const { renderer: labelRenderer } = label;
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
  showLabel(x, y, value) {
    const { axisCtx, bounds, label, axisLayout } = this;
    if (!axisLayout) {
      return;
    }
    const {
      label: { padding: labelPadding },
      tickSize
    } = axisLayout;
    const padding = labelPadding + tickSize;
    const html = this.getLabelHtml(value);
    label.setLabelHtml(html);
    const labelBBox = label.computeBBox();
    let labelMeta;
    if (axisCtx.direction === "x") {
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
  hideCrosshair() {
    this.crosshairGroup.visible = false;
    this.hideLabel();
  }
  hideLabel() {
    this.label.toggle(false);
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
import { _Theme as _Theme4 } from "ag-charts-community";
var AXIS_CROSSHAIR_THEME = {
  crosshair: {
    enabled: true,
    snap: true,
    stroke: _Theme4.DEFAULT_MUTED_LABEL_COLOUR,
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
      stroke: _Theme4.DEFAULT_MUTED_LABEL_COLOUR,
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
  axisTypes: ["category", "number", "log", "time"],
  instanceConstructor: Crosshair,
  themeTemplate: AXIS_CROSSHAIR_THEME
};

// packages/ag-charts-enterprise/src/features/data-source/dataSource.ts
import { _ModuleSupport as _ModuleSupport16 } from "ag-charts-community";
var { BOOLEAN: BOOLEAN7, FUNCTION: FUNCTION2, ActionOnSet: ActionOnSet4, Validate: Validate15 } = _ModuleSupport16;
var DataSource = class extends _ModuleSupport16.BaseModuleInstance {
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
  ActionOnSet4({
    newValue(enabled) {
      this.updateCallback(enabled, this.getData);
    }
  }),
  Validate15(BOOLEAN7)
], DataSource.prototype, "enabled", 2);
__decorateClass([
  ActionOnSet4({
    newValue(getData) {
      this.updateCallback(this.enabled, getData);
    }
  }),
  Validate15(FUNCTION2)
], DataSource.prototype, "getData", 2);
__decorateClass([
  ActionOnSet4({
    newValue(requestThrottle) {
      this.dataService.requestThrottle = requestThrottle;
    }
  })
], DataSource.prototype, "requestThrottle", 2);
__decorateClass([
  ActionOnSet4({
    newValue(updateThrottle) {
      this.dataService.dispatchThrottle = updateThrottle;
    }
  })
], DataSource.prototype, "updateThrottle", 2);
__decorateClass([
  ActionOnSet4({
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
  chartTypes: ["cartesian", "hierarchy", "polar"],
  instanceConstructor: DataSource,
  themeTemplate: {
    dataSource: { enabled: false }
  }
};

// packages/ag-charts-enterprise/src/features/error-bar/errorBarModule.ts
import { AgErrorBarSupportedSeriesTypes as AgErrorBarSupportedSeriesTypes2 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/error-bar/errorBar.ts
import { AgErrorBarSupportedSeriesTypes, _ModuleSupport as _ModuleSupport19, _Scene as _Scene10, _Util as _Util11 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/error-bar/errorBarNode.ts
import { _ModuleSupport as _ModuleSupport17, _Scene as _Scene9 } from "ag-charts-community";
var { partialAssign, mergeDefaults } = _ModuleSupport17;
var { BBox: BBox3 } = _Scene9;
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
var ErrorBarNode = class extends _Scene9.Group {
  constructor() {
    super();
    this.capLength = NaN;
    this._datum = void 0;
    this.whiskerPath = new _Scene9.Path();
    this.capsPath = new _Scene9.Path();
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
      return void 0;
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
  nearestSquared(point, maxDistance) {
    const { bboxes } = this;
    if (bboxes.union.distanceSquared(point) > maxDistance) {
      return { nearest: void 0, distanceSquared: Infinity };
    }
    const { distanceSquared } = BBox3.nearestBox(point, bboxes.components);
    return { nearest: this, distanceSquared };
  }
};
var ErrorBarGroup = class extends _Scene9.Group {
  get children() {
    return super.children;
  }
  nearestSquared(point) {
    const { nearest, distanceSquared } = _Scene9.nearestSquaredInContainer(point, this);
    if (nearest !== void 0 && !isNaN(distanceSquared)) {
      return { datum: nearest.datum, distanceSquared };
    }
  }
};

// packages/ag-charts-enterprise/src/features/error-bar/errorBarProperties.ts
import { _ModuleSupport as _ModuleSupport18 } from "ag-charts-community";
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
} = _ModuleSupport18;
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
} = _ModuleSupport19;
function toErrorBoundCartesianSeries(ctx) {
  for (const supportedType of AgErrorBarSupportedSeriesTypes) {
    if (supportedType == ctx.series.type) {
      return ctx.series;
    }
  }
  throw new Error(
    `AG Charts - unsupported series type '${ctx.series.type}', error bars supported series types: ${AgErrorBarSupportedSeriesTypes.join(", ")}`
  );
}
var ErrorBars = class _ErrorBars extends _ModuleSupport19.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.properties = new ErrorBarProperties();
    const series = toErrorBoundCartesianSeries(ctx);
    const { annotationGroup, annotationSelections } = series;
    this.cartesianSeries = series;
    this.groupNode = new ErrorBarGroup({
      name: `${annotationGroup.id}-errorBars`,
      zIndex: _ModuleSupport19.Layers.SERIES_LAYER_ZINDEX,
      zIndexSubOrder: series.getGroupZIndexSubOrder("annotation")
    });
    annotationGroup.appendChild(this.groupNode);
    this.selection = _Scene10.Selection.select(this.groupNode, () => this.errorBarFactory());
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
    }, !cartesianSeries.visible ? { forceValue: 0 } : {});
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
      return void 0;
    }
    const value = datum.datum[key];
    if (value === void 0) {
      return void 0;
    }
    if (typeof value !== "number") {
      _Util11.Logger.warnOnce(`Found [${key}] error value of type ${typeof value}. Expected number type`);
      return void 0;
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
    return this.groupNode.nearestSquared(point);
  }
  pickNodeMainAxisFirst(point) {
    return this.groupNode.nearestSquared(point);
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
import { _Theme as _Theme5 } from "ag-charts-community";
var ERROR_BARS_THEME = {
  series: {
    errorBar: {
      visible: true,
      stroke: _Theme5.DEFAULT_LABEL_COLOUR,
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
import { _ModuleSupport as _ModuleSupport22, _Theme as _Theme6 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/navigator/navigator.ts
import { _ModuleSupport as _ModuleSupport21 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/navigator/miniChart.ts
import { _ModuleSupport as _ModuleSupport20, _Scene as _Scene11, _Util as _Util12 } from "ag-charts-community";
var { Validate: Validate17, BOOLEAN: BOOLEAN9, POSITIVE_NUMBER: POSITIVE_NUMBER6, Layers: Layers4, ActionOnSet: ActionOnSet5, CategoryAxis, GroupedCategoryAxis } = _ModuleSupport20;
var { toRadians: toRadians4, Padding, Logger } = _Util12;
var { Text: Text4, Group: Group4, BBox: BBox4 } = _Scene11;
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
var MiniChart = class extends _ModuleSupport20.BaseModuleInstance {
  constructor() {
    super(...arguments);
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
      series.resetAnimation("initial");
    }
  }
  destroySeries(series) {
    series == null ? void 0 : series.forEach((series2) => {
      series2.destroy();
      if (series2.rootGroup != null) {
        this.seriesRoot.removeChild(series2.rootGroup);
      }
      series2.chart = void 0;
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
  ActionOnSet5({
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
  ActionOnSet5({
    changeValue(newValue, oldValue) {
      this.onSeriesChange(newValue, oldValue);
    }
  })
], MiniChart.prototype, "series", 2);

// packages/ag-charts-enterprise/src/features/navigator/navigator.ts
var { ObserveChanges: ObserveChanges2 } = _ModuleSupport21;
var _Navigator = class _Navigator extends _ModuleSupport21.Navigator {
  constructor() {
    super(...arguments);
    this.miniChart = new MiniChart();
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
  ObserveChanges2((target, value, oldValue) => {
    if (oldValue != null) {
      target.rs.background.removeChild(oldValue.root);
    }
    if (value != null) {
      target.rs.background.appendChild(value.root);
    }
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
  themeTemplate: __spreadProps(__spreadValues({}, _ModuleSupport22.NavigatorModule.themeTemplate), {
    navigator: __spreadProps(__spreadValues({}, (_a = _ModuleSupport22.NavigatorModule.themeTemplate) == null ? void 0 : _a.navigator), {
      miniChart: {
        enabled: false,
        label: {
          color: _Theme6.DEFAULT_LABEL_COLOUR,
          fontStyle: void 0,
          fontWeight: void 0,
          fontSize: 10,
          fontFamily: _Theme6.DEFAULT_FONT_FAMILY,
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
import { _ModuleSupport as _ModuleSupport23, _Util as _Util13 } from "ag-charts-community";
var {
  BOOLEAN: BOOLEAN10,
  STRING: STRING4,
  UNION: UNION3,
  BaseProperties: BaseProperties4,
  CartesianAxis,
  ChartUpdateType,
  isDate,
  isFiniteNumber,
  ObserveChanges: ObserveChanges3,
  Validate: Validate18
} = _ModuleSupport23;
var { Logger: Logger2 } = _Util13;
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
    for (const chart of syncManager.getGroupSiblings(groupId)) {
      this.updateChart(chart);
    }
  }
  enabledZoomSync() {
    const { syncManager, zoomManager } = this.moduleContext;
    this.disableZoomSync = zoomManager.addListener("zoom-change", () => {
      var _a2;
      for (const chart of syncManager.getGroupSiblings(this.groupId)) {
        if ((_a2 = chart.modules.get("sync")) == null ? void 0 : _a2.zoom) {
          chart.zoomManager.updateZoom(this.mergeZoom(chart));
        }
      }
    });
  }
  enabledNodeInteractionSync() {
    const { highlightManager, syncManager } = this.moduleContext;
    this.disableNodeInteractionSync = highlightManager.addListener("highlight-change", (event) => {
      var _a2, _b;
      for (const chart of syncManager.getGroupSiblings(this.groupId)) {
        if (!((_a2 = chart.modules.get("sync")) == null ? void 0 : _a2.nodeInteraction))
          continue;
        if (!((_b = event.currentHighlight) == null ? void 0 : _b.datum)) {
          chart.highlightManager.updateHighlight(chart.id);
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
            return nodeData.find((nodeDatum) => {
              const nodeValue = nodeDatum.datum[valueKey];
              return valueIsDate ? nodeValue.getTime() === eventValue : nodeValue === eventValue;
            });
          }).filter(Boolean);
          if (matchingNodes.length < 2 && matchingNodes[0] !== chart.highlightManager.getActiveHighlight()) {
            chart.highlightManager.updateHighlight(chart.id, matchingNodes[0]);
            this.updateChart(chart, ChartUpdateType.SERIES_UPDATE);
          }
        }
      }
    });
  }
  syncAxes(stopPropagation = false) {
    const { syncManager } = this.moduleContext;
    const chart = syncManager.getChart();
    const syncSeries = syncManager.getGroup(this.groupId).flatMap((chart2) => chart2.series);
    const syncAxes = syncManager.getGroupSiblings(this.groupId).flatMap((chart2) => chart2.axes);
    chart.axes.forEach((axis) => {
      if (!CartesianAxis.is(axis) || this.axes !== "xy" && this.axes !== axis.direction)
        return;
      const { direction, min, max, nice, reverse } = axis;
      for (const siblingAxis of syncAxes) {
        if (direction !== siblingAxis.direction)
          continue;
        if (nice !== siblingAxis.nice || reverse !== siblingAxis.reverse || min !== siblingAxis.min && (isFiniteNumber(min) || isFiniteNumber(siblingAxis.min)) || max !== siblingAxis.max && (isFiniteNumber(max) || isFiniteNumber(siblingAxis.max))) {
          Logger2.warnOnce("For axes sync, ensure matching `min`, `max`, `nice`, and `reverse` properties.");
          return;
        }
      }
      axis.boundSeries = syncSeries.filter((series) => {
        const seriesKeys = series.getKeys(axis.direction);
        return axis.keys.length ? axis.keys.some((key) => seriesKeys.includes(key)) : true;
      });
    });
    if (!stopPropagation) {
      setTimeout(() => this.updateSiblings(this.groupId));
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
  Validate18(BOOLEAN10),
  ObserveChanges3((target) => target.onEnabledChange())
], ChartSync.prototype, "enabled", 2);
__decorateClass([
  Validate18(STRING4, { optional: true }),
  ObserveChanges3((target, newValue, oldValue) => target.onGroupIdChange(newValue, oldValue))
], ChartSync.prototype, "groupId", 2);
__decorateClass([
  Validate18(UNION3(["x", "y", "xy"], "an axis")),
  ObserveChanges3((target) => target.onAxesChange())
], ChartSync.prototype, "axes", 2);
__decorateClass([
  Validate18(BOOLEAN10),
  ObserveChanges3((target) => target.onNodeInteractionChange())
], ChartSync.prototype, "nodeInteraction", 2);
__decorateClass([
  Validate18(BOOLEAN10),
  ObserveChanges3((target) => target.onZoomChange())
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
import { _ModuleSupport as _ModuleSupport28 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/zoom/scenes/zoomRect.ts
import { _ModuleSupport as _ModuleSupport24, _Scene as _Scene13 } from "ag-charts-community";
var { COLOR_STRING: COLOR_STRING4, RATIO: RATIO7, Validate: Validate19 } = _ModuleSupport24;
var ZoomRect = class extends _Scene13.Rect {
  constructor() {
    super(...arguments);
    this.fill = "rgb(33, 150, 243)";
    this.fillOpacity = 0.2;
  }
};
ZoomRect.className = "ZoomRect";
__decorateClass([
  Validate19(COLOR_STRING4)
], ZoomRect.prototype, "fill", 2);
__decorateClass([
  Validate19(RATIO7)
], ZoomRect.prototype, "fillOpacity", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomAxisDragger.ts
import { _ModuleSupport as _ModuleSupport26 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/features/zoom/zoomTransformers.ts
import { _ModuleSupport as _ModuleSupport25 } from "ag-charts-community";
var { clamp } = _ModuleSupport25;
var UNIT = { min: 0, max: 1 };
var constrain = (value, min = UNIT.min, max = UNIT.max) => clamp(min, value, max);
function unitZoomState() {
  return { x: __spreadValues({}, UNIT), y: __spreadValues({}, UNIT) };
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
  const dx = zoom.x.max - zoom.x.min;
  const dy = zoom.y.max - zoom.y.min;
  return {
    x: { min: zoom.x.min, max: zoom.x.min + dx * sx },
    y: { min: zoom.y.min, max: zoom.y.min + dy * sy }
  };
}
function scaleZoomCenter(zoom, sx, sy) {
  const dx = zoom.x.max - zoom.x.min;
  const dy = zoom.y.max - zoom.y.min;
  const cx = zoom.x.min + dx / 2;
  const cy = zoom.y.min + dy / 2;
  return {
    x: { min: cx - dx * sx / 2, max: cx + dx * sx / 2 },
    y: { min: cy - dy * sy / 2, max: cy + dy * sy / 2 }
  };
}
function scaleZoomAxisWithAnchor(newState, oldState, anchor, origin) {
  const { min, max } = oldState;
  const center = min + (max - min) / 2;
  const diff7 = newState.max - newState.min;
  switch (anchor) {
    case "start":
      return { min, max: oldState.min + diff7 };
    case "end":
      return { min: oldState.max - diff7, max };
    case "middle":
      return { min: center - diff7 / 2, max: center + diff7 / 2 };
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

// packages/ag-charts-enterprise/src/features/zoom/zoomAxisDragger.ts
var ZoomAxisDragger = class {
  constructor() {
    this.isAxisDragging = false;
  }
  update(event, direction, anchor, bbox, zoom, axisZoom) {
    var _a2;
    this.isAxisDragging = true;
    (_a2 = this.oldZoom) != null ? _a2 : this.oldZoom = definedZoomState(
      direction === _ModuleSupport26.ChartAxisDirection.X ? __spreadProps(__spreadValues({}, zoom), { x: axisZoom }) : __spreadProps(__spreadValues({}, zoom), { y: axisZoom })
    );
    this.updateCoords(event.offsetX, event.offsetY);
    return this.updateZoom(direction, anchor, bbox);
  }
  stop() {
    this.isAxisDragging = false;
    this.coords = void 0;
    this.oldZoom = void 0;
  }
  updateCoords(x, y) {
    if (!this.coords) {
      this.coords = { x1: x, y1: y, x2: x, y2: y };
    } else {
      this.coords.x2 = x;
      this.coords.y2 = y;
    }
  }
  updateZoom(direction, anchor, bbox) {
    const { coords, oldZoom } = this;
    let newZoom = definedZoomState(oldZoom);
    if (!coords || !oldZoom) {
      if (direction === _ModuleSupport26.ChartAxisDirection.X)
        return newZoom.x;
      return newZoom.y;
    }
    const origin = pointToRatio(bbox, coords.x1, coords.y1);
    const target = pointToRatio(bbox, coords.x2, coords.y2);
    if (direction === _ModuleSupport26.ChartAxisDirection.X) {
      const scaleX = (target.x - origin.x) * (oldZoom.x.max - oldZoom.x.min);
      newZoom.x.max += scaleX;
      newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchor, origin.x);
      newZoom = constrainZoom(newZoom);
      return newZoom.x;
    }
    const scaleY = (target.y - origin.y) * (oldZoom.y.max - oldZoom.y.min);
    newZoom.y.max -= scaleY;
    newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchor, origin.y);
    newZoom = constrainZoom(newZoom);
    return newZoom.y;
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoomPanner.ts
import { _ModuleSupport as _ModuleSupport27 } from "ag-charts-community";
var ZoomPanner = class {
  constructor() {
    this.isPanning = false;
    // Horizontal scrolling however does not have a 'start' and 'stop' event, it simply pans
    // by a fixed deltaX value whenever an event is fired.
    this.hscrollCoords = { x1: 0, x2: 0, y1: 0, y2: 0 };
  }
  updateDrag(event, bbox, zooms) {
    this.isPanning = true;
    const { offsetX: x, offsetY: y } = event;
    if (!this.dragCoords) {
      this.dragCoords = { x1: x, y1: y, x2: x, y2: y };
    } else {
      this.dragCoords.x1 = this.dragCoords.x2;
      this.dragCoords.y1 = this.dragCoords.y2;
      this.dragCoords.x2 = x;
      this.dragCoords.y2 = y;
    }
    return this.translateZooms(bbox, zooms, this.dragCoords);
  }
  updateHScroll(deltaX, bbox, zooms) {
    this.isPanning = true;
    this.hscrollCoords.x1 = deltaX * 5;
    return this.translateZooms(bbox, zooms, this.hscrollCoords);
  }
  stop() {
    this.isPanning = false;
    this.dragCoords = void 0;
  }
  translateZooms(bbox, currentZooms, coords) {
    const { x1, y1, x2, y2 } = coords;
    const dx = x1 <= x2 ? x2 - x1 : x1 - x2;
    const dy = y1 <= y2 ? y2 - y1 : y1 - y2;
    const offset = pointToRatio(bbox, bbox.x + dx, bbox.y + bbox.height - dy);
    const offsetX = x1 <= x2 ? -offset.x : offset.x;
    const offsetY = y1 <= y2 ? offset.y : -offset.y;
    const newZooms = {};
    for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
      let zoom;
      if (direction === _ModuleSupport27.ChartAxisDirection.X) {
        zoom = definedZoomState({ x: currentZoom });
      } else {
        zoom = definedZoomState({ y: currentZoom });
      }
      const scaleX = zoom.x.max - zoom.x.min;
      const scaleY = zoom.y.max - zoom.y.min;
      zoom = constrainZoom(translateZoom(zoom, offsetX * scaleX, offsetY * scaleY));
      if (direction === _ModuleSupport27.ChartAxisDirection.X) {
        newZooms[axisId] = { direction, zoom: zoom.x };
      } else {
        newZooms[axisId] = { direction, zoom: zoom.y };
      }
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
    newZoom.x.max += isScalingX ? step * dir * (oldZoom.x.max - oldZoom.x.min) : 0;
    newZoom.y.max += isScalingY ? step * dir * (oldZoom.y.max - oldZoom.y.min) : 0;
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
  BOOLEAN: BOOLEAN11,
  NUMBER: NUMBER6,
  RATIO: RATIO8,
  UNION: UNION4,
  ActionOnSet: ActionOnSet6,
  ChartAxisDirection: ChartAxisDirection7,
  ChartUpdateType: ChartUpdateType2,
  Validate: Validate20,
  round: sharedRound
} = _ModuleSupport28;
var ANCHOR_CORD = UNION4(["pointer", "start", "middle", "end"], "an anchor cord");
var CONTEXT_ZOOM_ACTION_ID = "zoom-action";
var CONTEXT_PAN_ACTION_ID = "pan-action";
var CURSOR_ID = "zoom-cursor";
var TOOLTIP_ID = "zoom-tooltip";
var DECIMALS = 3;
var round = (value) => sharedRound(value, DECIMALS);
var Zoom = class extends _ModuleSupport28.BaseModuleInstance {
  constructor(ctx) {
    var _a2;
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
    // Zoom methods
    this.axisDragger = new ZoomAxisDragger();
    this.panner = new ZoomPanner();
    this.scroller = new ZoomScroller();
    // State
    this.isDragging = false;
    this.minRatioX = 0;
    this.minRatioY = 0;
    // TODO: This will become an option soon, and I don't want to delete my code in the meantime
    this.enableSecondaryAxis = false;
    this.scene = ctx.scene;
    this.cursorManager = ctx.cursorManager;
    this.highlightManager = ctx.highlightManager;
    this.tooltipManager = ctx.tooltipManager;
    this.zoomManager = ctx.zoomManager;
    this.dataService = ctx.dataService;
    this.updateService = ctx.updateService;
    this.contextMenuRegistry = ctx.contextMenuRegistry;
    const { Default: Default5, ZoomDrag, Animation: Animation2 } = _ModuleSupport28.InteractionState;
    const draggableState = Default5 | Animation2 | ZoomDrag;
    const clickableState = Default5 | Animation2;
    this.destroyFns.push(
      ctx.interactionManager.addListener("dblclick", (event) => this.onDoubleClick(event), clickableState),
      ctx.interactionManager.addListener("drag", (event) => this.onDrag(event), draggableState),
      ctx.interactionManager.addListener("drag-start", (event) => this.onDragStart(event), draggableState),
      ctx.interactionManager.addListener("drag-end", () => this.onDragEnd(), draggableState),
      ctx.interactionManager.addListener("wheel", (event) => this.onWheel(event), clickableState),
      ctx.interactionManager.addListener("hover", () => this.onHover(), clickableState),
      ctx.chartEventManager.addListener("axis-hover", (event) => this.onAxisHover(event)),
      ctx.gestureDetector.addListener("pinch-move", (event) => this.onPinchMove(event)),
      ctx.layoutService.addListener("layout-complete", (event) => this.onLayoutComplete(event)),
      ctx.updateService.addListener("update-complete", (event) => this.onUpdateComplete(event))
    );
    const selectionRect = new ZoomRect();
    this.selector = new ZoomSelector(selectionRect);
    (_a2 = this.scene.root) == null ? void 0 : _a2.appendChild(selectionRect);
    this.destroyFns.push(() => {
      var _a3;
      return (_a3 = this.scene.root) == null ? void 0 : _a3.removeChild(selectionRect);
    });
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
  onDoubleClick(event) {
    var _a2;
    if (!this.enabled || !this.enableDoubleClickToReset)
      return;
    if (this.hoveredAxis) {
      const { id, direction } = this.hoveredAxis;
      this.updateAxisZoom(id, direction, __spreadValues({}, UNIT));
    } else if (((_a2 = this.paddedRect) == null ? void 0 : _a2.containsPoint(event.offsetX, event.offsetY)) && this.highlightManager.getActivePicked() === void 0) {
      this.updateZoom(unitZoomState());
    }
  }
  onDragStart(event) {
    var _a2;
    this.canDragSelection = (_a2 = this.paddedRect) == null ? void 0 : _a2.containsPoint(event.offsetX, event.offsetY);
  }
  onDrag(event) {
    if (!this.enabled || !this.paddedRect || !this.seriesRect)
      return;
    this.ctx.interactionManager.pushState(_ModuleSupport28.InteractionState.ZoomDrag);
    const sourceEvent = event.sourceEvent;
    const isPrimaryMouseButton = sourceEvent.button === 0;
    if (!isPrimaryMouseButton)
      return;
    this.isDragging = true;
    this.tooltipManager.updateTooltip(TOOLTIP_ID);
    const zoom = definedZoomState(this.zoomManager.getZoom());
    if (this.enableAxisDragging && this.hoveredAxis) {
      const { id: axisId, direction } = this.hoveredAxis;
      const anchor = direction === _ModuleSupport28.ChartAxisDirection.X ? this.anchorPointX : this.anchorPointY;
      const axisZoom = this.zoomManager.getAxisZoom(axisId);
      const newZoom = this.axisDragger.update(event, direction, anchor, this.seriesRect, zoom, axisZoom);
      this.updateAxisZoom(axisId, direction, newZoom);
      return;
    }
    if (!this.paddedRect.containsPoint(event.offsetX, event.offsetY)) {
      return;
    }
    if (this.enablePanning && (!this.enableSelecting || this.isPanningKeyPressed(sourceEvent))) {
      const newZooms = this.panner.updateDrag(event, this.seriesRect, this.zoomManager.getAxisZooms());
      for (const [axisId, { direction, zoom: newZoom }] of Object.entries(newZooms)) {
        this.updateAxisZoom(axisId, direction, newZoom);
      }
      this.cursorManager.updateCursor(CURSOR_ID, "grabbing");
      return;
    }
    if (!this.enableSelecting || !this.canDragSelection || this.isPanningKeyPressed(sourceEvent) || this.panner.isPanning || this.isMinZoom(zoom)) {
      return;
    }
    this.selector.update(
      event,
      this.minRatioX,
      this.minRatioY,
      this.isScalingX(),
      this.isScalingY(),
      this.paddedRect,
      zoom
    );
    this.updateService.update(ChartUpdateType2.PERFORM_LAYOUT, { skipAnimations: true });
  }
  onDragEnd() {
    this.ctx.interactionManager.popState(_ModuleSupport28.InteractionState.ZoomDrag);
    if (!this.enabled || !this.isDragging)
      return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    this.cursorManager.updateCursor(CURSOR_ID);
    if (this.enableAxisDragging && this.axisDragger.isAxisDragging) {
      this.axisDragger.stop();
    } else if (this.enablePanning && this.panner.isPanning) {
      this.panner.stop();
    } else if (this.enableSelecting && !this.isMinZoom(zoom) && this.canDragSelection) {
      const newZoom = this.selector.stop(this.seriesRect, this.paddedRect, zoom);
      this.updateZoom(newZoom);
    }
    this.isDragging = false;
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
      isScalingX = this.hoveredAxis.direction === _ModuleSupport28.ChartAxisDirection.X;
      isScalingY = !isScalingX;
    }
    const sourceEvent = event.sourceEvent;
    const { deltaX, deltaY } = sourceEvent;
    if (this.enablePanning && deltaX !== void 0 && deltaY !== void 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.consume();
      event.sourceEvent.preventDefault();
      const newZooms = this.panner.updateHScroll(event.deltaX, this.seriesRect, this.zoomManager.getAxisZooms());
      for (const [axisId, { direction, zoom: newZoom }] of Object.entries(newZooms)) {
        this.updateAxisZoom(axisId, direction, newZoom);
      }
      return;
    }
    if (isSeriesScrolling || isAxisScrolling) {
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
  }
  onHover() {
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
    const delta = event.deltaDistance * -0.01;
    const origin = pointToRatio(this.seriesRect, event.origin.x, event.origin.y);
    if (this.isScalingX()) {
      newZoom.x.max += delta * (oldZoom.x.max - oldZoom.x.min);
      newZoom.x = scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x);
    }
    if (this.isScalingY()) {
      newZoom.y.max += delta * (oldZoom.y.max - oldZoom.y.min);
      newZoom.y = scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y);
    }
    this.updateZoom(constrainZoom(newZoom));
  }
  onLayoutComplete(event) {
    if (!this.enabled)
      return;
    const {
      series: { rect, paddedRect, shouldFlipXY }
    } = event;
    this.seriesRect = rect;
    this.paddedRect = paddedRect;
    this.shouldFlipXY = shouldFlipXY;
  }
  onUpdateComplete({ minRect }) {
    if (!this.enabled || !this.paddedRect || !minRect)
      return;
    if (this.dataService.isLazy()) {
      this.minRatioX = 0;
      this.minRatioY = 0;
      return;
    }
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const minVisibleItemsWidth = this.shouldFlipXY ? this.minVisibleItemsY : this.minVisibleItemsX;
    const minVisibleItemsHeight = this.shouldFlipXY ? this.minVisibleItemsX : this.minVisibleItemsY;
    const widthRatio = minRect.width * minVisibleItemsWidth / this.paddedRect.width;
    const heightRatio = minRect.height * minVisibleItemsHeight / this.paddedRect.height;
    const ratioX = widthRatio * (zoom.x.max - zoom.x.min);
    const ratioY = heightRatio * (zoom.y.max - zoom.y.min);
    if (this.isScalingX()) {
      this.minRatioX = Math.min(1, round(ratioX));
    }
    if (this.isScalingY()) {
      this.minRatioY = Math.min(1, round(ratioY));
    }
    this.minRatioX || (this.minRatioX = this.minRatioY || 0);
    this.minRatioY || (this.minRatioY = this.minRatioX || 0);
  }
  onContextMenuZoomToHere({ event }) {
    if (!this.enabled || !this.paddedRect || !event || !event.target)
      return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const origin = pointToRatio(this.paddedRect, event.clientX, event.clientY);
    const scaledOriginX = origin.x * (zoom.x.max - zoom.x.min);
    const scaledOriginY = origin.y * (zoom.y.max - zoom.y.min);
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
    const scaleX = zoom.x.max - zoom.x.min;
    const scaleY = zoom.y.max - zoom.y.min;
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
    const minXCheckValue = this.enableScrolling ? (zoom.x.max - zoom.x.min) * (1 - this.scrollingStep) : round(zoom.x.max - zoom.x.min);
    const minYCheckValue = this.enableScrolling ? (zoom.y.max - zoom.y.min) * (1 - this.scrollingStep) : round(zoom.y.max - zoom.y.min);
    const isMinXZoom = !this.isScalingX() || minXCheckValue <= this.minRatioX;
    const isMinYZoom = !this.isScalingY() || minYCheckValue <= this.minRatioX;
    return isMinXZoom && isMinYZoom;
  }
  isMaxZoom(zoom) {
    return zoom.x.min === UNIT.min && zoom.x.max === UNIT.max && zoom.y.min === UNIT.min && zoom.y.max === UNIT.max;
  }
  updateZoom(zoom) {
    const dx = round(zoom.x.max - zoom.x.min);
    const dy = round(zoom.y.max - zoom.y.min);
    if (dx < this.minRatioX || dy < this.minRatioY) {
      this.contextMenuRegistry.disableAction(CONTEXT_ZOOM_ACTION_ID);
      this.contextMenuRegistry.enableAction(CONTEXT_PAN_ACTION_ID);
      return;
    }
    this.toggleContextMenuActions(zoom);
    this.zoomManager.updateZoom(zoom);
  }
  updateAxisZoom(axisId, direction, partialZoom) {
    if (!partialZoom)
      return;
    if (!this.enableSecondaryAxis) {
      const fullZoom = definedZoomState(this.zoomManager.getZoom());
      if (direction === ChartAxisDirection7.X) {
        fullZoom.x = partialZoom;
      } else {
        fullZoom.y = partialZoom;
      }
      this.updateZoom(fullZoom);
      return;
    }
    const d = round(partialZoom.max - partialZoom.min);
    if (direction === ChartAxisDirection7.X && d < this.minRatioX || direction === ChartAxisDirection7.Y && d < this.minRatioY) {
      return;
    }
    this.zoomManager.updateAxisZoom(axisId, partialZoom);
  }
};
__decorateClass([
  ActionOnSet6({
    newValue(newValue) {
      if (newValue) {
        this.registerContextMenuActions();
      }
    }
  }),
  Validate20(BOOLEAN11)
], Zoom.prototype, "enabled", 2);
__decorateClass([
  Validate20(BOOLEAN11)
], Zoom.prototype, "enableAxisDragging", 2);
__decorateClass([
  Validate20(BOOLEAN11)
], Zoom.prototype, "enableDoubleClickToReset", 2);
__decorateClass([
  Validate20(BOOLEAN11)
], Zoom.prototype, "enablePanning", 2);
__decorateClass([
  Validate20(BOOLEAN11)
], Zoom.prototype, "enableScrolling", 2);
__decorateClass([
  Validate20(BOOLEAN11)
], Zoom.prototype, "enableSelecting", 2);
__decorateClass([
  Validate20(UNION4(["alt", "ctrl", "meta", "shift"], "a pan key"))
], Zoom.prototype, "panKey", 2);
__decorateClass([
  Validate20(UNION4(["x", "y", "xy"], "an axis"))
], Zoom.prototype, "axes", 2);
__decorateClass([
  Validate20(RATIO8)
], Zoom.prototype, "scrollingStep", 2);
__decorateClass([
  Validate20(NUMBER6.restrict({ min: 1 }))
], Zoom.prototype, "minVisibleItemsX", 2);
__decorateClass([
  Validate20(NUMBER6.restrict({ min: 1 }))
], Zoom.prototype, "minVisibleItemsY", 2);
__decorateClass([
  Validate20(ANCHOR_CORD)
], Zoom.prototype, "anchorPointX", 2);
__decorateClass([
  Validate20(ANCHOR_CORD)
], Zoom.prototype, "anchorPointY", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomModule.ts
var ZoomModule = {
  type: "root",
  optionsKey: "zoom",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  instanceConstructor: Zoom,
  themeTemplate: {
    zoom: { enabled: false }
  }
};

// packages/ag-charts-enterprise/src/gradient-legend/gradientLegend.ts
import {
  _ModuleSupport as _ModuleSupport29,
  _Scale as _Scale7,
  _Scene as _Scene15,
  _Util as _Util14
} from "ag-charts-community";
var {
  BOOLEAN: BOOLEAN12,
  Layers: Layers5,
  POSITION,
  Validate: Validate21,
  Default: Default4,
  MIN_SPACING: MIN_SPACING3,
  POSITIVE_NUMBER: POSITIVE_NUMBER7,
  ProxyProperty: ProxyProperty2,
  DeprecatedAndRenamedTo
} = _ModuleSupport29;
var { BBox: BBox5, Group: Group5, Rect, LinearGradientFill, Triangle } = _Scene15;
var { createId: createId2, Logger: Logger3 } = _Util14;
var GradientBar = class {
  constructor() {
    this.thickness = 16;
    this.preferredLength = 100;
  }
};
__decorateClass([
  Validate21(POSITIVE_NUMBER7)
], GradientBar.prototype, "thickness", 2);
__decorateClass([
  Validate21(POSITIVE_NUMBER7)
], GradientBar.prototype, "preferredLength", 2);
var GradientLegendAxisTick = class extends _ModuleSupport29.AxisTick {
  constructor() {
    super(...arguments);
    this.enabled = false;
    this.size = 0;
    this.maxSpacing = NaN;
  }
};
__decorateClass([
  Validate21(MIN_SPACING3),
  Default4(NaN)
], GradientLegendAxisTick.prototype, "maxSpacing", 2);
var GradientLegendAxis = class extends _ModuleSupport29.CartesianAxis {
  constructor(ctx) {
    super(ctx, new _Scale7.LinearScale(), { respondsToZoom: false });
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
    this.id = createId2(this);
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
  attachLegend(node) {
    node.append(this.group);
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
  Validate21(BOOLEAN12)
], GradientLegend.prototype, "enabled", 2);
__decorateClass([
  Validate21(POSITION)
], GradientLegend.prototype, "position", 2);
__decorateClass([
  Validate21(BOOLEAN12, { optional: true })
], GradientLegend.prototype, "reverseOrder", 2);
__decorateClass([
  Validate21(POSITIVE_NUMBER7)
], GradientLegend.prototype, "spacing", 2);
__decorateClass([
  DeprecatedAndRenamedTo("scale")
], GradientLegend.prototype, "stop", 2);

// packages/ag-charts-enterprise/src/gradient-legend/gradientLegendThemes.ts
import { _Theme as _Theme7 } from "ag-charts-community";
var BOTTOM = "bottom";
var GRADIENT_LEGEND_THEME = {
  position: BOTTOM,
  spacing: 20,
  scale: {
    padding: 8,
    label: {
      color: _Theme7.DEFAULT_LABEL_COLOUR,
      fontStyle: void 0,
      fontWeight: void 0,
      fontSize: 12,
      fontFamily: _Theme7.DEFAULT_FONT_FAMILY,
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
};

// packages/ag-charts-enterprise/src/gradient-legend/main.ts
var GradientLegendModule = {
  type: "legend",
  optionsKey: "gradientLegend",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy"],
  identifier: "gradient",
  instanceConstructor: GradientLegend,
  themeTemplate: GRADIENT_LEGEND_THEME
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
_LicenseManager.RELEASE_INFORMATION = "MTcwODMyOTU2Mjk0OA==";
var LicenseManager = _LicenseManager;

// packages/ag-charts-enterprise/src/license/watermark.ts
import { _ModuleSupport as _ModuleSupport31 } from "ag-charts-community";
var { injectStyle } = _ModuleSupport31;
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
function injectWatermark(document2, parentElement, text) {
  injectStyle(document2, watermarkStyles);
  const element = document2.createElement("div");
  const textElement = document2.createElement("span");
  textElement.innerText = text;
  element.addEventListener("animationend", () => parentElement.removeChild(element));
  element.classList.add("ag-watermark");
  element.appendChild(textElement);
  parentElement.appendChild(element);
}

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotModule.ts
import { _Theme as _Theme9, _Util as _Util16 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeries.ts
import { _ModuleSupport as _ModuleSupport34, _Scale as _Scale8, _Scene as _Scene17, _Util as _Util15 } from "ag-charts-community";

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
import { _ModuleSupport as _ModuleSupport32, _Scene as _Scene16 } from "ag-charts-community";
var BoxPlotGroup = class extends _Scene16.Group {
  constructor() {
    super();
    this.append([
      new _Scene16.Rect({ tag: 0 /* Box */ }),
      new _Scene16.Rect({ tag: 0 /* Box */ }),
      new _Scene16.Rect({ tag: 2 /* Outline */ }),
      new _Scene16.Rect({ tag: 1 /* Median */ }),
      new _Scene16.Line({ tag: 3 /* Whisker */ }),
      new _Scene16.Line({ tag: 3 /* Whisker */ }),
      new _Scene16.Line({ tag: 4 /* Cap */ }),
      new _Scene16.Line({ tag: 4 /* Cap */ })
    ]);
  }
  updateDatumStyles(datum, activeStyles, isVertical, isReversedValueAxis) {
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
    const selection = _Scene16.Selection.select(this, _Scene16.Rect);
    const boxes = selection.selectByTag(0 /* Box */);
    const [outline] = selection.selectByTag(2 /* Outline */);
    const [median] = selection.selectByTag(1 /* Median */);
    const whiskers = selection.selectByTag(3 /* Whisker */);
    const caps = selection.selectByTag(4 /* Cap */);
    if (whiskerStyles.strokeWidth > bandwidth) {
      whiskerStyles.strokeWidth = bandwidth;
    }
    outline.setProperties({ x: q1Value, y: axisValue, width: q3Value - q1Value, height: bandwidth });
    boxes[0].setProperties({
      x: q1Value,
      y: axisValue,
      width: Math.round(medianValue - q1Value + strokeWidth / 2),
      height: bandwidth
    });
    boxes[1].setProperties({
      x: Math.round(medianValue - strokeWidth / 2),
      y: axisValue,
      width: Math.floor(q3Value - medianValue + strokeWidth / 2),
      height: bandwidth
    });
    const medianStart = Math.max(Math.round(medianValue - strokeWidth / 2), q1Value + strokeWidth);
    const medianEnd = Math.min(Math.round(medianValue + strokeWidth / 2), q3Value - strokeWidth);
    median.setProperties({
      visible: medianStart < medianEnd,
      x: medianStart,
      y: axisValue + strokeWidth,
      width: medianEnd - medianStart,
      height: Math.max(0, bandwidth - strokeWidth * 2)
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
      _ModuleSupport32.invertShapeDirection(outline, median, ...boxes, ...caps, ...whiskers);
    }
    for (const element of boxes) {
      element.setProperties({ fill, fillOpacity, strokeWidth: strokeWidth * 2, strokeOpacity: 0 });
    }
    median.setProperties({ fill: stroke, fillOpacity: strokeOpacity, strokeWidth: 0 });
    for (const element of [...whiskers, ...caps]) {
      element.setProperties(whiskerStyles);
    }
    outline.setProperties({ stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, fillOpacity: 0 });
  }
};

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport33 } from "ag-charts-community";
var {
  BaseProperties: BaseProperties5,
  AbstractBarSeriesProperties,
  SeriesTooltip,
  Validate: Validate22,
  COLOR_STRING: COLOR_STRING5,
  FUNCTION: FUNCTION4,
  LINE_DASH: LINE_DASH4,
  OBJECT: OBJECT4,
  POSITIVE_NUMBER: POSITIVE_NUMBER8,
  RATIO: RATIO9,
  STRING: STRING5,
  mergeDefaults: mergeDefaults3
} = _ModuleSupport33;
var BoxPlotSeriesCap = class extends BaseProperties5 {
  constructor() {
    super(...arguments);
    this.lengthRatio = 0.5;
  }
};
__decorateClass([
  Validate22(RATIO9)
], BoxPlotSeriesCap.prototype, "lengthRatio", 2);
var BoxPlotSeriesWhisker = class extends BaseProperties5 {
};
__decorateClass([
  Validate22(COLOR_STRING5, { optional: true })
], BoxPlotSeriesWhisker.prototype, "stroke", 2);
__decorateClass([
  Validate22(POSITIVE_NUMBER8)
], BoxPlotSeriesWhisker.prototype, "strokeWidth", 2);
__decorateClass([
  Validate22(RATIO9)
], BoxPlotSeriesWhisker.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate22(LINE_DASH4, { optional: true })
], BoxPlotSeriesWhisker.prototype, "lineDash", 2);
__decorateClass([
  Validate22(POSITIVE_NUMBER8)
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
  Validate22(STRING5)
], BoxPlotSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate22(STRING5)
], BoxPlotSeriesProperties.prototype, "minKey", 2);
__decorateClass([
  Validate22(STRING5)
], BoxPlotSeriesProperties.prototype, "q1Key", 2);
__decorateClass([
  Validate22(STRING5)
], BoxPlotSeriesProperties.prototype, "medianKey", 2);
__decorateClass([
  Validate22(STRING5)
], BoxPlotSeriesProperties.prototype, "q3Key", 2);
__decorateClass([
  Validate22(STRING5)
], BoxPlotSeriesProperties.prototype, "maxKey", 2);
__decorateClass([
  Validate22(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate22(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate22(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "minName", 2);
__decorateClass([
  Validate22(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "q1Name", 2);
__decorateClass([
  Validate22(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "medianName", 2);
__decorateClass([
  Validate22(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "q3Name", 2);
__decorateClass([
  Validate22(STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "maxName", 2);
__decorateClass([
  Validate22(COLOR_STRING5, { optional: true })
], BoxPlotSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate22(RATIO9)
], BoxPlotSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate22(COLOR_STRING5)
], BoxPlotSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate22(POSITIVE_NUMBER8)
], BoxPlotSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate22(RATIO9)
], BoxPlotSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate22(LINE_DASH4)
], BoxPlotSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate22(POSITIVE_NUMBER8)
], BoxPlotSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate22(FUNCTION4, { optional: true })
], BoxPlotSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate22(OBJECT4)
], BoxPlotSeriesProperties.prototype, "cap", 2);
__decorateClass([
  Validate22(OBJECT4)
], BoxPlotSeriesProperties.prototype, "whisker", 2);
__decorateClass([
  Validate22(OBJECT4)
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
  ChartAxisDirection: ChartAxisDirection8
} = _ModuleSupport34;
var { motion } = _Scene17;
var BoxPlotSeriesNodeClickEvent = class extends _ModuleSupport34.SeriesNodeClickEvent {
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
var _BoxPlotSeries = class _BoxPlotSeries extends _ModuleSupport34.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
      pathsPerSeries: 1,
      hasHighlightedLabels: true
    });
    this.properties = new BoxPlotSeriesProperties();
    this.NodeClickEvent = BoxPlotSeriesNodeClickEvent;
    /**
     * Used to get the position of items within each group.
     */
    this.groupScale = new _Scale8.BandScale();
    this.smallestDataInterval = void 0;
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d;
      if (!this.properties.isValid()) {
        return;
      }
      const { xKey, minKey, q1Key, medianKey, q3Key, maxKey } = this.properties;
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      const isContinuousX = ((_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale) instanceof _Scale8.ContinuousScale;
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
      var _a2;
      const { visible, dataModel } = this;
      const xAxis = this.getCategoryAxis();
      const yAxis = this.getValueAxis();
      if (!(dataModel && visible && xAxis && yAxis)) {
        return [];
      }
      const { xKey, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } = this.properties;
      const {
        groupScale,
        smallestDataInterval,
        ctx: { seriesStateManager }
      } = this;
      const xBandWidth = xAxis.scale instanceof _Scale8.ContinuousScale ? xAxis.scale.calcBandwidth(smallestDataInterval == null ? void 0 : smallestDataInterval.x) : xAxis.scale.bandwidth;
      const domain = [];
      const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
      for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
        domain.push(String(groupIdx));
      }
      groupScale.domain = domain;
      groupScale.range = [0, xBandWidth != null ? xBandWidth : 0];
      if (xAxis instanceof _ModuleSupport34.CategoryAxis) {
        groupScale.paddingInner = xAxis.groupPaddingInner;
      }
      const barWidth = groupScale.bandwidth >= 1 ? (
        // Pixel-rounded value for low-volume bar charts.
        groupScale.bandwidth
      ) : (
        // Handle high-volume bar charts gracefully.
        groupScale.rawBandwidth
      );
      const nodeData = [];
      const defs = dataModel.resolveProcessedDataDefsByIds(this, [
        "xValue",
        "minValue",
        "q1Value",
        `medianValue`,
        `q3Value`,
        `maxValue`
      ]);
      (_a2 = this.processedData) == null ? void 0 : _a2.data.forEach(({ datum, keys, values }) => {
        const { xValue, minValue, q1Value, medianValue, q3Value, maxValue } = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
        if ([minValue, q1Value, medianValue, q3Value, maxValue].some((value) => typeof value !== "number") || minValue > q1Value || q1Value > medianValue || medianValue > q3Value || q3Value > maxValue) {
          return;
        }
        const scaledValues = this.convertValuesToScaleByDefs(defs, {
          xValue,
          minValue,
          q1Value,
          medianValue,
          q3Value,
          maxValue
        });
        scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex)));
        nodeData.push({
          series: this,
          itemId: xValue,
          datum,
          xKey,
          bandwidth: Math.round(barWidth),
          scaledValues,
          cap,
          whisker,
          fill,
          fillOpacity,
          stroke,
          strokeWidth,
          strokeOpacity,
          lineDash,
          lineDashOffset
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
    const title = _Util15.sanitizeHtml(yName);
    const contentData = [
      [xKey, xName, xAxis],
      [minKey, minName, yAxis],
      [q1Key, q1Name, yAxis],
      [medianKey, medianName, yAxis],
      [q3Key, q3Name, yAxis],
      [maxKey, maxName, yAxis]
    ];
    const content = contentData.map(([key, name, axis]) => _Util15.sanitizeHtml(`${name != null ? name : key}: ${axis.formatDatum(datum[key])}`)).join(title ? "<br/>" : ", ");
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
          isReversedValueAxis
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
  convertValuesToScaleByDefs(defs, values) {
    const xAxis = this.getCategoryAxis();
    const yAxis = this.getValueAxis();
    if (!(xAxis && yAxis)) {
      throw new Error("Axes must be defined");
    }
    const result = {};
    for (const [searchId, [{ def }]] of defs) {
      if (Object.hasOwn(values, searchId)) {
        const { scale } = def.type === "key" ? xAxis : yAxis;
        result[searchId] = Math.round(scale.convert(values[searchId]));
      }
    }
    return result;
  }
};
_BoxPlotSeries.type = "box-plot";
var BoxPlotSeries = _BoxPlotSeries;

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotThemes.ts
import { _Theme as _Theme8 } from "ag-charts-community";
var BOX_PLOT_SERIES_THEME = {
  series: {
    __extends__: _Theme8.EXTENDS_SERIES_DEFAULTS,
    direction: "vertical",
    strokeWidth: 2
  },
  axes: {
    [_Theme8.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        snap: false
      }
    },
    [_Theme8.CARTESIAN_AXIS_TYPE.CATEGORY]: {
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
  seriesDefaults: {
    axes: [
      {
        type: _Theme9.CARTESIAN_AXIS_TYPE.NUMBER,
        position: _Theme9.POSITION.LEFT
      },
      {
        type: _Theme9.CARTESIAN_AXIS_TYPE.CATEGORY,
        position: _Theme9.POSITION.BOTTOM
      }
    ]
  },
  themeTemplate: BOX_PLOT_SERIES_THEME,
  groupable: true,
  paletteFactory: ({ takeColors, userPalette, themeTemplateParameters }) => {
    var _a2;
    const themeBackgroundColor = themeTemplateParameters.properties.get(_Theme9.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (_a2 = Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) != null ? _a2 : "white";
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      fill: userPalette ? fill : _Util16.Color.interpolate(fill, backgroundFill)(0.7),
      stroke
    };
  },
  swapDefaultAxesCondition: ({ direction }) => direction === "horizontal"
};

// packages/ag-charts-enterprise/src/series/bullet/bulletModule.ts
import { _Theme as _Theme11 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/bullet/bulletSeries.ts
import { _ModuleSupport as _ModuleSupport36, _Scale as _Scale9, _Scene as _Scene18, _Util as _Util17 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/bullet/bulletSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport35 } from "ag-charts-community";
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties2,
  BaseProperties: BaseProperties6,
  PropertiesArray,
  SeriesTooltip: SeriesTooltip2,
  Validate: Validate23,
  ARRAY: ARRAY2,
  COLOR_STRING: COLOR_STRING6,
  LINE_DASH: LINE_DASH5,
  OBJECT: OBJECT5,
  POSITIVE_NUMBER: POSITIVE_NUMBER9,
  RATIO: RATIO10,
  STRING: STRING6
} = _ModuleSupport35;
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
  Validate23(COLOR_STRING6)
], TargetStyle.prototype, "fill", 2);
__decorateClass([
  Validate23(RATIO10)
], TargetStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate23(COLOR_STRING6)
], TargetStyle.prototype, "stroke", 2);
__decorateClass([
  Validate23(POSITIVE_NUMBER9)
], TargetStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate23(RATIO10)
], TargetStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate23(LINE_DASH5)
], TargetStyle.prototype, "lineDash", 2);
__decorateClass([
  Validate23(POSITIVE_NUMBER9)
], TargetStyle.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate23(RATIO10)
], TargetStyle.prototype, "lengthRatio", 2);
var BulletScale = class extends BaseProperties6 {
};
__decorateClass([
  Validate23(POSITIVE_NUMBER9, { optional: true })
], BulletScale.prototype, "max", 2);
var BulletColorRange = class extends BaseProperties6 {
  constructor() {
    super(...arguments);
    this.color = "lightgrey";
  }
};
__decorateClass([
  Validate23(COLOR_STRING6)
], BulletColorRange.prototype, "color", 2);
__decorateClass([
  Validate23(POSITIVE_NUMBER9, { optional: true })
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
  Validate23(STRING6)
], BulletSeriesProperties.prototype, "valueKey", 2);
__decorateClass([
  Validate23(STRING6, { optional: true })
], BulletSeriesProperties.prototype, "valueName", 2);
__decorateClass([
  Validate23(STRING6, { optional: true })
], BulletSeriesProperties.prototype, "targetKey", 2);
__decorateClass([
  Validate23(STRING6, { optional: true })
], BulletSeriesProperties.prototype, "targetName", 2);
__decorateClass([
  Validate23(COLOR_STRING6)
], BulletSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate23(RATIO10)
], BulletSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate23(COLOR_STRING6)
], BulletSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate23(POSITIVE_NUMBER9)
], BulletSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate23(RATIO10)
], BulletSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate23(LINE_DASH5)
], BulletSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate23(POSITIVE_NUMBER9)
], BulletSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate23(RATIO10)
], BulletSeriesProperties.prototype, "widthRatio", 2);
__decorateClass([
  Validate23(ARRAY2.restrict({ minLength: 0 }))
], BulletSeriesProperties.prototype, "colorRanges", 2);
__decorateClass([
  Validate23(OBJECT5)
], BulletSeriesProperties.prototype, "target", 2);
__decorateClass([
  Validate23(OBJECT5)
], BulletSeriesProperties.prototype, "scale", 2);
__decorateClass([
  Validate23(OBJECT5)
], BulletSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate23(COLOR_STRING6)
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
} = _ModuleSupport36;
var { fromToMotion } = _Scene18.motion;
var { sanitizeHtml } = _Util17;
var STYLING_KEYS = [
  "fill",
  "fillOpacity",
  "stroke",
  "strokeWidth",
  "strokeOpacity",
  "lineDash",
  "lineDashOffset"
];
var BulletSeries = class _BulletSeries extends _ModuleSupport36.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [_ModuleSupport36.SeriesNodePickMode.EXACT_SHAPE_MATCH],
      hasHighlightedLabels: true,
      animationResetFns: {
        datum: resetBarSelectionsFn
      }
    });
    this.properties = new BulletSeriesProperties();
    this.normalizedColorRanges = [];
    this.colorRangesGroup = new _Scene18.Group({ name: `${this.id}-colorRanges` });
    this.colorRangesSelection = _Scene18.Selection.select(this.colorRangesGroup, _Scene18.Rect, false);
    this.rootGroup.append(this.colorRangesGroup);
    this.targetLinesSelection = _Scene18.Selection.select(this.annotationGroup, _Scene18.Line, false);
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
      const isContinuousX = _Scale9.ContinuousScale.is((_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale);
      const isContinuousY = _Scale9.ContinuousScale.is((_b = this.getValueAxis()) == null ? void 0 : _b.scale);
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
          keyProperty2(this, valueKey, isContinuousX, { id: "xValue" }),
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
          _Util17.Logger.warnOnce("negative values are not supported, clipping to 0.");
        }
        const xValue = (_d = this.properties.valueName) != null ? _d : this.properties.valueKey;
        const yValue = Math.min(maxValue, Math.max(0, values[0][valueIndex]));
        const y = yScale.convert(yValue);
        const barWidth = widthRatio * multiplier;
        const bottomY = yScale.convert(0);
        const barAlongX = this.getBarDirection() === _ModuleSupport36.ChartAxisDirection.X;
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
          _Util17.Logger.warnOnce("negative targets are not supported, ignoring.");
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
      const sortedRanges = [...this.getColorRanges()].sort((a, b) => (a.stop || maxValue) - (b.stop || maxValue));
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
    defaultColorRange.color = _Util17.Color.interpolate(fill, backgroundFill)(0.7);
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
    return new _Scene18.Rect();
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
        if (datum.target !== void 0) {
          const style = this.properties.target;
          partialAssign2(["x1", "x2", "y1", "y2"], node, datum.target);
          partialAssign2(STYLING_KEYS, node, style);
        } else {
          node.visible = false;
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
      const computeRect = this.getBarDirection() === _ModuleSupport36.ChartAxisDirection.Y ? (rect, colorRange) => {
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
      __superGet(_BulletSeries.prototype, this, "updateNodes").call(this, highlightedItems, seriesHighlighted, anySeriesItemEnabled);
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
    const { datumSelections, labelSelections, annotationSelections } = data;
    const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, "normal"));
    fromToMotion(this.id, "nodes", this.ctx.animationManager, datumSelections, fns);
    seriesLabelFadeInAnimation(this, "labels", this.ctx.animationManager, labelSelections);
    seriesLabelFadeInAnimation(this, "annotations", this.ctx.animationManager, annotationSelections);
  }
  animateWaitingUpdateReady(data) {
    var _a2, _b, _c;
    const { datumSelections, labelSelections, annotationSelections } = data;
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    const diff7 = (_b = (_a2 = this.processedData) == null ? void 0 : _a2.reduced) == null ? void 0 : _b.diff;
    const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, "normal"));
    fromToMotion(
      this.id,
      "nodes",
      this.ctx.animationManager,
      datumSelections,
      fns,
      (_, datum) => createDatumId(datum.xValue),
      diff7
    );
    const hasMotion = (_c = diff7 == null ? void 0 : diff7.changed) != null ? _c : true;
    if (hasMotion) {
      seriesLabelFadeInAnimation(this, "labels", this.ctx.animationManager, labelSelections);
      seriesLabelFadeInAnimation(this, "annotations", this.ctx.animationManager, annotationSelections);
    }
  }
};

// packages/ag-charts-enterprise/src/series/bullet/bulletThemes.ts
import { _Theme as _Theme10 } from "ag-charts-community";
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
    [_Theme10.CARTESIAN_AXIS_TYPE.NUMBER]: {
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
  seriesDefaults: {
    axes: [
      {
        type: _Theme11.CARTESIAN_AXIS_TYPE.NUMBER,
        position: _Theme11.POSITION.LEFT
      },
      {
        type: _Theme11.CARTESIAN_AXIS_TYPE.CATEGORY,
        position: _Theme11.POSITION.BOTTOM
      }
    ]
  },
  themeTemplate: BULLET_SERIES_THEME,
  swapDefaultAxesCondition: (series) => (series == null ? void 0 : series.direction) === "horizontal",
  paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
    var _a2;
    const { properties } = themeTemplateParameters;
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(colorsCount);
    const themeBackgroundColor = themeTemplateParameters.properties.get(_Theme11.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (_a2 = Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) != null ? _a2 : "white";
    const targetStroke = properties.get(_Theme11.DEFAULT_CROSS_LINES_COLOUR);
    return {
      fill,
      stroke,
      target: { stroke: targetStroke },
      backgroundFill
    };
  }
};

// packages/ag-charts-enterprise/src/series/heatmap/heatmapModule.ts
import { _Theme as _Theme13 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/heatmap/heatmapSeries.ts
import { _ModuleSupport as _ModuleSupport40, _Scale as _Scale10, _Scene as _Scene20, _Util as _Util19 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/util/labelFormatter.ts
import { _ModuleSupport as _ModuleSupport38, _Scene as _Scene19, _Util as _Util18 } from "ag-charts-community";
var { Validate: Validate24, NUMBER: NUMBER7, TEXT_WRAP, OVERFLOW_STRATEGY } = _ModuleSupport38;
var { Logger: Logger4 } = _Util18;
var { Text: Text5, Label } = _Scene19;
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
  Validate24(TEXT_WRAP)
], BaseAutoSizedLabel.prototype, "wrapping", 2);
__decorateClass([
  Validate24(OVERFLOW_STRATEGY)
], BaseAutoSizedLabel.prototype, "overflowStrategy", 2);
__decorateClass([
  Validate24(NUMBER7, { optional: true })
], BaseAutoSizedLabel.prototype, "minimumFontSize", 2);
var AutoSizedLabel = class extends BaseAutoSizedLabel {
  constructor() {
    super(...arguments);
    this.spacing = 0;
  }
};
__decorateClass([
  Validate24(NUMBER7)
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
    return void 0;
  }
  let min = from;
  let max = to;
  let found;
  while (max >= min) {
    const index = (max + min) / 2 | 0;
    const value = iteratee(index);
    if (value != null) {
      found = value;
      min = index + 1;
    } else {
      max = index - 1;
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
  if (minimumHeight > sizeFittingHeight(minimumHeight + heightAdjust).height - heightAdjust) {
    return void 0;
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
    const sizeFitting = sizeFittingHeight(labelLineHeight + secondaryLabelLineHeight + heightAdjust);
    const availableWidth = sizeFitting.width - widthAdjust;
    const availableHeight = sizeFitting.height - heightAdjust;
    if (labelLineHeight + secondaryLabelLineHeight > availableHeight) {
      return void 0;
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
      if (labelLines != null) {
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
      } else {
        label = void 0;
      }
    }
    if (label == null || label.width > availableWidth || label.height > availableHeight) {
      return void 0;
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
      if (secondaryLabelLines != null) {
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
      } else {
        secondaryLabel = void 0;
      }
    }
    if (secondaryLabel == null) {
      return void 0;
    }
    const totalLabelHeight = label.height + secondaryLabel.height;
    if (secondaryLabel.width > availableWidth || totalLabelHeight > availableHeight) {
      return void 0;
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
    const sizeFitting = sizeFittingHeight(lineHeight + sizeAdjust);
    const availableWidth = sizeFitting.width - sizeAdjust;
    const availableHeight = sizeFitting.height - sizeAdjust;
    if (lineHeight > availableHeight) {
      return void 0;
    }
    const allowTruncation = fontSize === minimumFontSize;
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
      return void 0;
    }
    const text = lines.join("\n");
    textNode.text = text;
    textNode.fontSize = fontSize;
    textNode.lineHeight = lineHeight;
    const size = textNode.computeBBox();
    const width = textNode.computeBBox().width;
    const height = lineHeight * lines.length;
    if (size.width > availableWidth || height > availableHeight) {
      return void 0;
    }
    return [{ text, fontSize, lineHeight, width, height }, sizeFitting.meta];
  });
}
function hasInvalidFontSize(label) {
  return label != null && label.minimumFontSize != null && label.fontSize && label.minimumFontSize > label.fontSize;
}
function formatLabels(baseLabelValue, labelProps, baseSecondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight) {
  const labelValue = labelProps.enabled ? baseLabelValue : void 0;
  const secondaryLabelValue = secondaryLabelProps.enabled ? baseSecondaryLabelValue : void 0;
  if (hasInvalidFontSize(labelProps) || hasInvalidFontSize(secondaryLabelProps)) {
    Logger4.warnOnce(`minimumFontSize should be set to a value less than or equal to the font size`);
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
import { _ModuleSupport as _ModuleSupport39 } from "ag-charts-community";
var {
  CartesianSeriesProperties,
  SeriesTooltip: SeriesTooltip3,
  Validate: Validate25,
  AND: AND5,
  ARRAY: ARRAY3,
  COLOR_STRING: COLOR_STRING7,
  COLOR_STRING_ARRAY,
  FUNCTION: FUNCTION5,
  OBJECT: OBJECT6,
  POSITIVE_NUMBER: POSITIVE_NUMBER10,
  RATIO: RATIO11,
  STRING: STRING7,
  TEXT_ALIGN,
  VERTICAL_ALIGN
} = _ModuleSupport39;
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
    this.tooltip = new SeriesTooltip3();
  }
};
__decorateClass([
  Validate25(STRING7, { optional: true })
], HeatmapSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate25(STRING7)
], HeatmapSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate25(STRING7)
], HeatmapSeriesProperties.prototype, "yKey", 2);
__decorateClass([
  Validate25(STRING7, { optional: true })
], HeatmapSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate25(STRING7, { optional: true })
], HeatmapSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate25(STRING7, { optional: true })
], HeatmapSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate25(STRING7, { optional: true })
], HeatmapSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate25(AND5(COLOR_STRING_ARRAY, ARRAY3.restrict({ minLength: 1 })))
], HeatmapSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate25(COLOR_STRING7, { optional: true })
], HeatmapSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate25(RATIO11, { optional: true })
], HeatmapSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate25(POSITIVE_NUMBER10, { optional: true })
], HeatmapSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate25(TEXT_ALIGN)
], HeatmapSeriesProperties.prototype, "textAlign", 2);
__decorateClass([
  Validate25(VERTICAL_ALIGN)
], HeatmapSeriesProperties.prototype, "verticalAlign", 2);
__decorateClass([
  Validate25(POSITIVE_NUMBER10)
], HeatmapSeriesProperties.prototype, "itemPadding", 2);
__decorateClass([
  Validate25(FUNCTION5, { optional: true })
], HeatmapSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate25(OBJECT6)
], HeatmapSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate25(OBJECT6)
], HeatmapSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/heatmap/heatmapSeries.ts
var { SeriesNodePickMode: SeriesNodePickMode2, getMissCount, valueProperty: valueProperty4, ChartAxisDirection: ChartAxisDirection9 } = _ModuleSupport40;
var { Rect: Rect2, PointerEvents } = _Scene20;
var { ColorScale } = _Scale10;
var { sanitizeHtml: sanitizeHtml2, Color, Logger: Logger5 } = _Util19;
var HeatmapSeriesNodeClickEvent = class extends _ModuleSupport40.CartesianSeriesNodeClickEvent {
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
var _HeatmapSeries = class _HeatmapSeries extends _ModuleSupport40.CartesianSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode2.EXACT_SHAPE_MATCH],
      pathsPerSeries: 0,
      hasMarkers: false,
      hasHighlightedLabels: true
    });
    this.properties = new HeatmapSeriesProperties();
    this.NodeClickEvent = HeatmapSeriesNodeClickEvent;
    this.colorScale = new ColorScale();
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2;
      const xAxis = this.axes[ChartAxisDirection9.X];
      const yAxis = this.axes[ChartAxisDirection9.Y];
      if (!xAxis || !yAxis || !this.properties.isValid() || !((_a2 = this.data) == null ? void 0 : _a2.length)) {
        return;
      }
      const { xKey, yKey, colorRange, colorKey } = this.properties;
      const { isContinuousX, isContinuousY } = this.isContinuous();
      const { dataModel, processedData } = yield this.requestDataModel(dataController, this.data, {
        props: [
          valueProperty4(this, xKey, isContinuousX, { id: "xValue" }),
          valueProperty4(this, yKey, isContinuousY, { id: "yValue" }),
          ...colorKey ? [valueProperty4(this, colorKey, true, { id: "colorValue" })] : []
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
    if (direction === ChartAxisDirection9.X) {
      return dataModel.getDomain(this, `xValue`, "value", processedData);
    } else {
      return dataModel.getDomain(this, `yValue`, "value", processedData);
    }
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d, _e, _f, _g;
      const { data, visible, axes, dataModel } = this;
      const xAxis = axes[ChartAxisDirection9.X];
      const yAxis = axes[ChartAxisDirection9.Y];
      if (!(data && dataModel && visible && xAxis && yAxis)) {
        return [];
      }
      if (xAxis.type !== "category" || yAxis.type !== "category") {
        Logger5.warnOnce(
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
        const colorValue = colorDataIdx != null ? values[colorDataIdx] : void 0;
        const fill = colorScaleValid && colorValue != null ? this.colorScale.convert(colorValue) : colorRange[0];
        const labelText = colorValue != null ? this.getLabelText(label, {
          value: colorValue,
          datum,
          colorKey,
          colorName,
          xKey,
          yKey,
          xName,
          yName
        }) : void 0;
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
          const x2 = point.x + textAlignFactor * (width - 2 * itemPadding);
          const y2 = point.y + verticalAlignFactor * (height - 2 * itemPadding) - (labels.height - labelHeight) * 0.5;
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
            x: x2,
            y: y2
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
    return new Rect2();
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
      const xAxis = this.axes[ChartAxisDirection9.X];
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
    const xAxis = this.axes[ChartAxisDirection9.X];
    const yAxis = this.axes[ChartAxisDirection9.Y];
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
    const xString = sanitizeHtml2(xAxis.formatDatum(xValue));
    const yString = sanitizeHtml2(yAxis.formatDatum(yValue));
    let content = `<b>${sanitizeHtml2(xName || xKey)}</b>: ${xString}<br><b>${sanitizeHtml2(yName || yKey)}</b>: ${yString}`;
    if (colorKey) {
      content = `<b>${sanitizeHtml2(colorName || colorKey)}</b>: ${sanitizeHtml2(colorValue)}<br>` + content;
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
import { _Theme as _Theme12 } from "ag-charts-community";
var HEATMAP_SERIES_THEME = {
  series: {
    __extends__: _Theme12.EXTENDS_SERIES_DEFAULTS,
    label: {
      __overrides__: _Theme12.OVERRIDE_SERIES_LABEL_DEFAULTS,
      enabled: false,
      color: _Theme12.DEFAULT_LABEL_COLOUR,
      fontSize: _Theme12.FONT_SIZE.SMALL,
      fontFamily: _Theme12.DEFAULT_FONT_FAMILY,
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
  seriesDefaults: {
    axes: [
      {
        type: _Theme13.CARTESIAN_AXIS_TYPE.CATEGORY,
        position: _Theme13.POSITION.LEFT
      },
      {
        type: _Theme13.CARTESIAN_AXIS_TYPE.CATEGORY,
        position: _Theme13.POSITION.BOTTOM
      }
    ]
  },
  themeTemplate: HEATMAP_SERIES_THEME,
  paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
    var _a2;
    const { properties } = themeTemplateParameters;
    const defaultColorRange = properties.get(_Theme13.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    const defaultBackgroundColor = properties.get(_Theme13.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (_a2 = Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor) != null ? _a2 : "white";
    const { fills, strokes } = takeColors(colorsCount);
    return {
      stroke: userPalette ? strokes[0] : backgroundFill,
      colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange
    };
  }
};

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleModule.ts
import { _Theme as _Theme15 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleSeries.ts
import {
  _Scene as _Scene25
} from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesBase.ts
import { _ModuleSupport as _ModuleSupport41, _Scale as _Scale11, _Scene as _Scene21, _Util as _Util20 } from "ag-charts-community";
var {
  isDefined: isDefined2,
  ChartAxisDirection: ChartAxisDirection10,
  PolarAxis,
  diff: diff3,
  fixNumericExtent: fixNumericExtent3,
  groupAccumulativeValueProperty: groupAccumulativeValueProperty2,
  keyProperty: keyProperty3,
  normaliseGroupTo,
  resetLabelFn,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation2,
  seriesLabelFadeOutAnimation,
  valueProperty: valueProperty5,
  animationValidation: animationValidation3
} = _ModuleSupport41;
var { BandScale: BandScale3 } = _Scale11;
var { motion: motion2 } = _Scene21;
var { isNumber, normalizeAngle360: normalizeAngle3605, sanitizeHtml: sanitizeHtml3 } = _Util20;
var RadialColumnSeriesNodeClickEvent = class extends _ModuleSupport41.SeriesNodeClickEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadialColumnSeriesBase = class extends _ModuleSupport41.PolarSeries {
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
    this.NodeClickEvent = RadialColumnSeriesNodeClickEvent;
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
    if (direction === ChartAxisDirection10.X) {
      return dataModel.getDomain(this, "angleValue", "key", processedData);
    } else {
      const radiusAxis = axes[ChartAxisDirection10.Y];
      const yExtent = dataModel.getDomain(this, "radiusValue-end", "value", processedData);
      const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
      return fixNumericExtent3(fixedYExtent, radiusAxis);
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
      if (isDefined2(normalizedTo)) {
        extraProps.push(
          normaliseGroupTo(this, [stackGroupId, stackGroupTrailingId], Math.abs(normalizedTo), "range")
        );
      }
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      if (animationEnabled && this.processedData) {
        extraProps.push(diff3(this.processedData));
      }
      if (animationEnabled) {
        extraProps.push(animationValidation3(this));
      }
      const visibleProps = visible || !animationEnabled ? {} : { forceValue: 0 };
      yield this.requestDataModel(dataController, (_a2 = this.data) != null ? _a2 : [], {
        props: [
          keyProperty3(this, angleKey, false, { id: "angleValue" }),
          valueProperty5(this, radiusKey, true, __spreadValues({
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
    return (_a2 = this.axes[ChartAxisDirection10.Y]) == null ? void 0 : _a2.isReversed();
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
    const radiusAxis = this.axes[ChartAxisDirection10.Y];
    return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2;
      const { processedData, dataModel, groupScale } = this;
      if (!processedData || !dataModel || !this.properties.isValid()) {
        return [];
      }
      const angleAxis = this.axes[ChartAxisDirection10.X];
      const radiusAxis = this.axes[ChartAxisDirection10.Y];
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
    motion2.fromToMotion(this.id, "datums", this.ctx.animationManager, [this.itemSelection], fns);
    seriesLabelFadeInAnimation2(this, "labels", this.ctx.animationManager, [labelSelection]);
  }
  animateClearingUpdateEmpty() {
    const { itemSelection } = this;
    const { animationManager } = this.ctx;
    const fns = this.getColumnTransitionFunctions();
    motion2.fromToMotion(this.id, "datums", animationManager, [itemSelection], fns);
    seriesLabelFadeOutAnimation(this, "labels", animationManager, [this.labelSelection]);
  }
  getTooltipHtml(nodeDatum) {
    var _a2;
    const { id: seriesId, axes, dataModel } = this;
    const { angleKey, radiusKey, angleName, radiusName, fill, stroke, strokeWidth, formatter, tooltip } = this.properties;
    const { angleValue, radiusValue, datum } = nodeDatum;
    const xAxis = axes[ChartAxisDirection10.X];
    const yAxis = axes[ChartAxisDirection10.Y];
    if (!this.properties.isValid() || !(xAxis && yAxis && isNumber(radiusValue)) || !dataModel) {
      return "";
    }
    const angleString = xAxis.formatDatum(angleValue);
    const radiusString = yAxis.formatDatum(radiusValue);
    const title = sanitizeHtml3(radiusName);
    const content = sanitizeHtml3(`${angleString}: ${radiusString}`);
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
import { _ModuleSupport as _ModuleSupport42, _Scene as _Scene22 } from "ag-charts-community";
var { Label: Label2 } = _Scene22;
var {
  SeriesProperties,
  SeriesTooltip: SeriesTooltip4,
  Validate: Validate26,
  COLOR_STRING: COLOR_STRING8,
  DEGREE: DEGREE3,
  FUNCTION: FUNCTION6,
  LINE_DASH: LINE_DASH6,
  NUMBER: NUMBER8,
  OBJECT: OBJECT7,
  POSITIVE_NUMBER: POSITIVE_NUMBER11,
  RATIO: RATIO12,
  STRING: STRING8
} = _ModuleSupport42;
var RadialColumnSeriesBaseProperties = class extends SeriesProperties {
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
    this.label = new Label2();
    this.tooltip = new SeriesTooltip4();
  }
};
__decorateClass([
  Validate26(STRING8)
], RadialColumnSeriesBaseProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate26(STRING8, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "angleName", 2);
__decorateClass([
  Validate26(STRING8)
], RadialColumnSeriesBaseProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate26(STRING8, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate26(COLOR_STRING8)
], RadialColumnSeriesBaseProperties.prototype, "fill", 2);
__decorateClass([
  Validate26(RATIO12)
], RadialColumnSeriesBaseProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate26(COLOR_STRING8)
], RadialColumnSeriesBaseProperties.prototype, "stroke", 2);
__decorateClass([
  Validate26(POSITIVE_NUMBER11)
], RadialColumnSeriesBaseProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate26(RATIO12)
], RadialColumnSeriesBaseProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate26(LINE_DASH6)
], RadialColumnSeriesBaseProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate26(POSITIVE_NUMBER11)
], RadialColumnSeriesBaseProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate26(FUNCTION6, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "formatter", 2);
__decorateClass([
  Validate26(DEGREE3)
], RadialColumnSeriesBaseProperties.prototype, "rotation", 2);
__decorateClass([
  Validate26(STRING8, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "stackGroup", 2);
__decorateClass([
  Validate26(NUMBER8, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "normalizedTo", 2);
__decorateClass([
  Validate26(OBJECT7)
], RadialColumnSeriesBaseProperties.prototype, "label", 2);
__decorateClass([
  Validate26(OBJECT7)
], RadialColumnSeriesBaseProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleUtil.ts
import { _Scene as _Scene24 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnUtil.ts
import { _Scene as _Scene23 } from "ag-charts-community";
var { motion: motion3 } = _Scene23;
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
      const diff7 = from2 - to2;
      if (Math.abs(diff7) > Math.PI) {
        from2 -= Math.sign(diff7) * 2 * Math.PI;
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
    const phase = motion3.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
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
var { motion: motion4 } = _Scene24;
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
    const phase = motion4.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
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
var { Sector: Sector3 } = _Scene25;
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
import { _Theme as _Theme14 } from "ag-charts-community";
var NIGHTINGALE_SERIES_THEME = {
  series: {
    __extends__: _Theme14.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 1,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme14.DEFAULT_FONT_FAMILY,
      color: _Theme14.DEFAULT_LABEL_COLOUR,
      __overrides__: _Theme14.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [_Theme14.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      shape: _Theme14.POLAR_AXIS_SHAPE.CIRCLE,
      groupPaddingInner: 0,
      paddingInner: 0,
      label: {
        padding: 10
      }
    },
    [_Theme14.POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
      shape: _Theme14.POLAR_AXIS_SHAPE.CIRCLE
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
  seriesDefaults: {
    axes: [
      {
        type: _Theme15.POLAR_AXIS_TYPE.ANGLE_CATEGORY
      },
      {
        type: _Theme15.POLAR_AXIS_TYPE.RADIUS_NUMBER
      }
    ]
  },
  themeTemplate: NIGHTINGALE_SERIES_THEME,
  paletteFactory({ takeColors, userPalette }) {
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      fill,
      stroke: userPalette ? stroke : _Theme15.DEFAULT_POLAR_SERIES_STROKE
    };
  },
  stackable: true,
  groupable: true,
  stackedByDefault: true
};

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaModule.ts
import { _ModuleSupport as _ModuleSupport49, _Theme as _Theme17 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radar/radarThemes.ts
import { _ModuleSupport as _ModuleSupport44, _Theme as _Theme16 } from "ag-charts-community";
var BASE_RADAR_SERIES_THEME = {
  series: {
    __extends__: _Theme16.EXTENDS_SERIES_DEFAULTS,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme16.DEFAULT_FONT_FAMILY,
      color: _Theme16.DEFAULT_LABEL_COLOUR,
      __overrides__: _Theme16.OVERRIDE_SERIES_LABEL_DEFAULTS
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
    [_Theme16.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      label: {
        padding: 10
      }
    }
  }
};
var RADAR_LINE_SERIES_THEME = _ModuleSupport44.mergeDefaults(
  {
    series: {
      strokeWidth: 2
    }
  },
  BASE_RADAR_SERIES_THEME
);
var RADAR_AREA_SERIES_THEME = _ModuleSupport44.mergeDefaults(
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
import { _ModuleSupport as _ModuleSupport48, _Scene as _Scene29 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radar/radarSeries.ts
import { _ModuleSupport as _ModuleSupport46, _Scene as _Scene27, _Util as _Util21 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radar/radarSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport45, _Scene as _Scene26 } from "ag-charts-community";
var { Label: Label3 } = _Scene26;
var {
  SeriesMarker,
  SeriesProperties: SeriesProperties2,
  SeriesTooltip: SeriesTooltip5,
  Validate: Validate27,
  BOOLEAN: BOOLEAN13,
  COLOR_STRING: COLOR_STRING9,
  DEGREE: DEGREE4,
  FUNCTION: FUNCTION7,
  LINE_DASH: LINE_DASH7,
  OBJECT: OBJECT8,
  POSITIVE_NUMBER: POSITIVE_NUMBER12,
  RATIO: RATIO13,
  STRING: STRING9
} = _ModuleSupport45;
var RadarSeriesProperties = class extends SeriesProperties2 {
  constructor() {
    super(...arguments);
    this.stroke = "black";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.rotation = 0;
    this.marker = new SeriesMarker();
    this.label = new Label3();
    this.tooltip = new SeriesTooltip5();
    this.connectMissingData = false;
  }
};
__decorateClass([
  Validate27(STRING9)
], RadarSeriesProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate27(STRING9)
], RadarSeriesProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate27(STRING9, { optional: true })
], RadarSeriesProperties.prototype, "angleName", 2);
__decorateClass([
  Validate27(STRING9, { optional: true })
], RadarSeriesProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate27(COLOR_STRING9)
], RadarSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER12)
], RadarSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate27(RATIO13)
], RadarSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate27(LINE_DASH7)
], RadarSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate27(POSITIVE_NUMBER12)
], RadarSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate27(FUNCTION7, { optional: true })
], RadarSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate27(DEGREE4)
], RadarSeriesProperties.prototype, "rotation", 2);
__decorateClass([
  Validate27(OBJECT8)
], RadarSeriesProperties.prototype, "marker", 2);
__decorateClass([
  Validate27(OBJECT8)
], RadarSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate27(OBJECT8)
], RadarSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate27(BOOLEAN13)
], RadarSeriesProperties.prototype, "connectMissingData", 2);

// packages/ag-charts-enterprise/src/series/radar/radarSeries.ts
var {
  ChartAxisDirection: ChartAxisDirection11,
  PolarAxis: PolarAxis2,
  SeriesNodePickMode: SeriesNodePickMode3,
  valueProperty: valueProperty6,
  fixNumericExtent: fixNumericExtent4,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation3,
  markerFadeInAnimation,
  resetMarkerFn,
  animationValidation: animationValidation4
} = _ModuleSupport46;
var { BBox: BBox6, Group: Group6, Path: Path5, PointerEvents: PointerEvents2, Selection: Selection2, Text: Text6, getMarker } = _Scene27;
var { extent: extent2, isNumber: isNumber2, isNumberEqual: isNumberEqual8, sanitizeHtml: sanitizeHtml4, toFixed } = _Util21;
var RadarSeriesNodeClickEvent = class extends _ModuleSupport46.SeriesNodeClickEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadarSeries = class extends _ModuleSupport46.PolarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode3.NEAREST_NODE, SeriesNodePickMode3.EXACT_SHAPE_MATCH],
      canHaveAxes: true,
      animationResetFns: {
        item: resetMarkerFn
      }
    });
    this.properties = new RadarSeriesProperties();
    this.NodeClickEvent = RadarSeriesNodeClickEvent;
    this.nodeData = [];
    this.resetInvalidToZero = false;
    this.circleCache = { r: 0, cx: 0, cy: 0 };
    const lineGroup = new Group6();
    this.contentGroup.append(lineGroup);
    this.lineSelection = Selection2.select(lineGroup, Path5);
    lineGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
  }
  nodeFactory() {
    const { shape } = this.properties.marker;
    const MarkerShape = getMarker(shape);
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
    if (direction === ChartAxisDirection11.X) {
      return dataModel.getDomain(this, `angleValue`, "value", processedData);
    } else {
      const domain = dataModel.getDomain(this, `radiusValue`, "value", processedData);
      const ext = extent2(domain.length === 0 ? domain : [0].concat(domain));
      return fixNumericExtent4(ext);
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
        extraProps.push(animationValidation4(this));
      }
      yield this.requestDataModel(dataController, (_a2 = this.data) != null ? _a2 : [], {
        props: [
          valueProperty6(this, angleKey, false, { id: "angleValue" }),
          valueProperty6(this, radiusKey, false, { id: "radiusValue", invalidValue: void 0 }),
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
    const radiusAxis = this.axes[ChartAxisDirection11.Y];
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
      const angleScale = (_a2 = this.axes[ChartAxisDirection11.X]) == null ? void 0 : _a2.scale;
      const radiusScale = (_b = this.axes[ChartAxisDirection11.Y]) == null ? void 0 : _b.scale;
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
            labelNodeDatum = {
              x: x + cos * marker.size,
              y: y + sin * marker.size,
              text: labelText,
              textAlign: isNumberEqual8(cos, 0) ? "center" : cos > 0 ? "left" : "right",
              textBaseline: isNumberEqual8(sin, 0) ? "middle" : sin > 0 ? "top" : "bottom"
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
      this.itemSelection = Selection2.select(this.itemGroup, () => this.nodeFactory(), false);
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
    const title = sanitizeHtml4(radiusName);
    const content = sanitizeHtml4(`${formattedAngleValue}: ${formattedRadiusValue}`);
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
      const tempText2 = new Text6();
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
      return BBox6.merge(textBoxes);
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
    lineNode.pointerEvents = PointerEvents2.None;
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
    const radiusAxis = this.axes[ChartAxisDirection11.Y];
    const angleAxis = this.axes[ChartAxisDirection11.X];
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
    const radiusAxis = this.axes[ChartAxisDirection11.Y];
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
import { _ModuleSupport as _ModuleSupport47 } from "ag-charts-community";
var { RATIO: RATIO14, COLOR_STRING: COLOR_STRING10, Validate: Validate28 } = _ModuleSupport47;
var RadarAreaSeriesProperties = class extends RadarSeriesProperties {
  constructor() {
    super(...arguments);
    this.fill = "black";
    this.fillOpacity = 1;
  }
};
__decorateClass([
  Validate28(COLOR_STRING10)
], RadarAreaSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate28(RATIO14)
], RadarAreaSeriesProperties.prototype, "fillOpacity", 2);

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaSeries.ts
var { Group: Group7, Path: Path6, PointerEvents: PointerEvents3, Selection: Selection3 } = _Scene29;
var { ChartAxisDirection: ChartAxisDirection12 } = _ModuleSupport48;
var RadarAreaSeries = class extends RadarSeries {
  constructor(moduleCtx) {
    super(moduleCtx);
    this.properties = new RadarAreaSeriesProperties();
    this.resetInvalidToZero = true;
    const areaGroup = new Group7();
    areaGroup.zIndexSubOrder = [() => this._declarationOrder, 0];
    this.contentGroup.append(areaGroup);
    this.areaSelection = Selection3.select(areaGroup, Path6);
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
    areaNode.pointerEvents = PointerEvents3.None;
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
      return axis instanceof _ModuleSupport48.PolarAxis ? axis : void 0;
    };
    const radiusAxis = getPolarAxis(ChartAxisDirection12.Y);
    const angleAxis = getPolarAxis(ChartAxisDirection12.X);
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
var { markerPaletteFactory } = _ModuleSupport49;
var RadarAreaModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radar-area",
  instanceConstructor: RadarAreaSeries,
  seriesDefaults: {
    axes: [
      {
        type: _Theme17.POLAR_AXIS_TYPE.ANGLE_CATEGORY
      },
      {
        type: _Theme17.POLAR_AXIS_TYPE.RADIUS_NUMBER
      }
    ]
  },
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
import { _Theme as _Theme18 } from "ag-charts-community";

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
  seriesDefaults: {
    axes: [
      {
        type: _Theme18.POLAR_AXIS_TYPE.ANGLE_CATEGORY
      },
      {
        type: _Theme18.POLAR_AXIS_TYPE.RADIUS_NUMBER
      }
    ]
  },
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
import { _Theme as _Theme20 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeries.ts
import { _ModuleSupport as _ModuleSupport52, _Scale as _Scale12, _Scene as _Scene32, _Util as _Util22 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport50, _Scene as _Scene30 } from "ag-charts-community";
var { Label: Label4 } = _Scene30;
var {
  SeriesProperties: SeriesProperties3,
  SeriesTooltip: SeriesTooltip6,
  Validate: Validate29,
  COLOR_STRING: COLOR_STRING11,
  DEGREE: DEGREE5,
  FUNCTION: FUNCTION8,
  LINE_DASH: LINE_DASH8,
  NUMBER: NUMBER9,
  OBJECT: OBJECT9,
  POSITIVE_NUMBER: POSITIVE_NUMBER13,
  RATIO: RATIO15,
  STRING: STRING10
} = _ModuleSupport50;
var RadialBarSeriesProperties = class extends SeriesProperties3 {
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
    this.tooltip = new SeriesTooltip6();
  }
};
__decorateClass([
  Validate29(STRING10)
], RadialBarSeriesProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate29(STRING10)
], RadialBarSeriesProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate29(STRING10, { optional: true })
], RadialBarSeriesProperties.prototype, "angleName", 2);
__decorateClass([
  Validate29(STRING10, { optional: true })
], RadialBarSeriesProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate29(COLOR_STRING11)
], RadialBarSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate29(RATIO15)
], RadialBarSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate29(COLOR_STRING11)
], RadialBarSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate29(POSITIVE_NUMBER13)
], RadialBarSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate29(RATIO15)
], RadialBarSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate29(LINE_DASH8)
], RadialBarSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate29(POSITIVE_NUMBER13)
], RadialBarSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate29(FUNCTION8, { optional: true })
], RadialBarSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate29(DEGREE5)
], RadialBarSeriesProperties.prototype, "rotation", 2);
__decorateClass([
  Validate29(STRING10, { optional: true })
], RadialBarSeriesProperties.prototype, "stackGroup", 2);
__decorateClass([
  Validate29(NUMBER9, { optional: true })
], RadialBarSeriesProperties.prototype, "normalizedTo", 2);
__decorateClass([
  Validate29(OBJECT9)
], RadialBarSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate29(OBJECT9)
], RadialBarSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarUtil.ts
import { _Scene as _Scene31 } from "ag-charts-community";
var { motion: motion5 } = _Scene31;
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
    const phase = motion5.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
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
  ChartAxisDirection: ChartAxisDirection13,
  PolarAxis: PolarAxis3,
  diff: diff4,
  isDefined: isDefined3,
  groupAccumulativeValueProperty: groupAccumulativeValueProperty3,
  keyProperty: keyProperty4,
  normaliseGroupTo: normaliseGroupTo2,
  valueProperty: valueProperty7,
  fixNumericExtent: fixNumericExtent5,
  resetLabelFn: resetLabelFn2,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation4,
  seriesLabelFadeOutAnimation: seriesLabelFadeOutAnimation2,
  animationValidation: animationValidation5
} = _ModuleSupport52;
var { BandScale: BandScale4 } = _Scale12;
var { Sector: Sector4, motion: motion6 } = _Scene32;
var { angleBetween: angleBetween3, isNumber: isNumber3, sanitizeHtml: sanitizeHtml5 } = _Util22;
var RadialBarSeriesNodeClickEvent = class extends _ModuleSupport52.SeriesNodeClickEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadialBarSeries = class extends _ModuleSupport52.PolarSeries {
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
    this.NodeClickEvent = RadialBarSeriesNodeClickEvent;
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
    if (direction === ChartAxisDirection13.X) {
      const angleAxis = axes[ChartAxisDirection13.X];
      const xExtent = dataModel.getDomain(this, "angleValue-end", "value", processedData);
      const fixedXExtent = [xExtent[0] > 0 ? 0 : xExtent[0], xExtent[1] < 0 ? 0 : xExtent[1]];
      return fixNumericExtent5(fixedXExtent, angleAxis);
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
      if (isDefined3(normalizedTo)) {
        extraProps.push(
          normaliseGroupTo2(this, [stackGroupId, stackGroupTrailingId], Math.abs(normalizedTo), "range")
        );
      }
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      if (animationEnabled) {
        if (this.processedData) {
          extraProps.push(diff4(this.processedData));
        }
        extraProps.push(animationValidation5(this));
      }
      const visibleProps = this.visible || !animationEnabled ? {} : { forceValue: 0 };
      yield this.requestDataModel(dataController, (_a2 = this.data) != null ? _a2 : [], {
        props: [
          keyProperty4(this, radiusKey, false, { id: "radiusValue" }),
          valueProperty7(this, angleKey, true, __spreadValues({
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
    const radiusAxis = this.axes[ChartAxisDirection13.Y];
    return radiusAxis instanceof PolarAxis3 ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b;
      const { processedData, dataModel } = this;
      if (!processedData || !dataModel || !this.properties.isValid()) {
        return [];
      }
      const angleAxis = this.axes[ChartAxisDirection13.X];
      const radiusAxis = this.axes[ChartAxisDirection13.Y];
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
      const radiusAxisReversed = (_b = this.axes[ChartAxisDirection13.Y]) == null ? void 0 : _b.isReversed();
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
    const angleScale = (_a2 = this.axes[ChartAxisDirection13.X]) == null ? void 0 : _a2.scale;
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
    motion6.fromToMotion(this.id, "datums", this.ctx.animationManager, [this.itemSelection], fns);
    seriesLabelFadeInAnimation4(this, "labels", this.ctx.animationManager, [labelSelection]);
  }
  animateClearingUpdateEmpty() {
    const { itemSelection } = this;
    const { animationManager } = this.ctx;
    const fns = this.getBarTransitionFunctions();
    motion6.fromToMotion(this.id, "datums", animationManager, [itemSelection], fns);
    seriesLabelFadeOutAnimation2(this, "labels", animationManager, [this.labelSelection]);
  }
  getTooltipHtml(nodeDatum) {
    var _a2;
    const { id: seriesId, axes, dataModel } = this;
    const { angleKey, angleName, radiusKey, radiusName, fill, stroke, strokeWidth, formatter, tooltip } = this.properties;
    const { angleValue, radiusValue, datum } = nodeDatum;
    const xAxis = axes[ChartAxisDirection13.X];
    const yAxis = axes[ChartAxisDirection13.Y];
    if (!this.properties.isValid() || !(xAxis && yAxis && isNumber3(angleValue)) || !dataModel) {
      return "";
    }
    const angleString = xAxis.formatDatum(angleValue);
    const radiusString = yAxis.formatDatum(radiusValue);
    const title = sanitizeHtml5(angleName);
    const content = sanitizeHtml5(`${radiusString}: ${angleString}`);
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
import { _Theme as _Theme19 } from "ag-charts-community";
var RADIAL_BAR_SERIES_THEME = {
  series: {
    __extends__: _Theme19.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme19.DEFAULT_FONT_FAMILY,
      color: _Theme19.DEFAULT_INVERTED_LABEL_COLOUR,
      __overrides__: _Theme19.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [_Theme19.POLAR_AXIS_TYPE.RADIUS_CATEGORY]: {
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
  seriesDefaults: {
    axes: [
      {
        type: _Theme20.POLAR_AXIS_TYPE.ANGLE_NUMBER
      },
      {
        type: _Theme20.POLAR_AXIS_TYPE.RADIUS_CATEGORY
      }
    ]
  },
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
import { _Theme as _Theme22 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeries.ts
import { _ModuleSupport as _ModuleSupport54, _Scene as _Scene33 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport53 } from "ag-charts-community";
var { Validate: Validate30, RATIO: RATIO16 } = _ModuleSupport53;
var RadialColumnSeriesProperties = class extends RadialColumnSeriesBaseProperties {
};
__decorateClass([
  Validate30(RATIO16, { optional: true })
], RadialColumnSeriesProperties.prototype, "columnWidthRatio", 2);
__decorateClass([
  Validate30(RATIO16, { optional: true })
], RadialColumnSeriesProperties.prototype, "maxColumnWidthRatio", 2);

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeries.ts
var { ChartAxisDirection: ChartAxisDirection14, PolarAxis: PolarAxis4 } = _ModuleSupport54;
var { RadialColumnShape, getRadialColumnWidth } = _Scene33;
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
    const radiusAxis = this.axes[ChartAxisDirection14.Y];
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
import { _Theme as _Theme21 } from "ag-charts-community";
var RADIAL_COLUMN_SERIES_THEME = {
  series: {
    __extends__: _Theme21.EXTENDS_SERIES_DEFAULTS,
    columnWidthRatio: 0.5,
    maxColumnWidthRatio: 0.5,
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme21.DEFAULT_FONT_FAMILY,
      color: _Theme21.DEFAULT_LABEL_COLOUR,
      __overrides__: _Theme21.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [_Theme21.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      shape: _Theme21.POLAR_AXIS_SHAPE.CIRCLE,
      groupPaddingInner: 0,
      paddingInner: 0,
      label: {
        padding: 10
      }
    },
    [_Theme21.POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
      shape: _Theme21.POLAR_AXIS_SHAPE.CIRCLE,
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
  seriesDefaults: {
    axes: [
      {
        type: _Theme22.POLAR_AXIS_TYPE.ANGLE_CATEGORY
      },
      {
        type: _Theme22.POLAR_AXIS_TYPE.RADIUS_NUMBER
      }
    ]
  },
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
import { _ModuleSupport as _ModuleSupport57, _Theme as _Theme24 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/range-area/rangeArea.ts
import { _ModuleSupport as _ModuleSupport56, _Scene as _Scene35, _Util as _Util23 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaProperties.ts
import { _ModuleSupport as _ModuleSupport55, _Scene as _Scene34 } from "ag-charts-community";
var { DropShadow, Label: Label5 } = _Scene34;
var {
  CartesianSeriesProperties: CartesianSeriesProperties2,
  SeriesMarker: SeriesMarker2,
  SeriesTooltip: SeriesTooltip7,
  Validate: Validate31,
  BOOLEAN: BOOLEAN14,
  COLOR_STRING: COLOR_STRING12,
  LINE_DASH: LINE_DASH9,
  OBJECT: OBJECT10,
  PLACEMENT,
  POSITIVE_NUMBER: POSITIVE_NUMBER14,
  RATIO: RATIO17,
  STRING: STRING11
} = _ModuleSupport55;
var RangeAreaSeriesLabel = class extends Label5 {
  constructor() {
    super(...arguments);
    this.placement = "outside";
    this.padding = 6;
  }
};
__decorateClass([
  Validate31(PLACEMENT)
], RangeAreaSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate31(POSITIVE_NUMBER14)
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
    this.tooltip = new SeriesTooltip7();
    this.connectMissingData = false;
  }
};
__decorateClass([
  Validate31(STRING11)
], RangeAreaProperties.prototype, "xKey", 2);
__decorateClass([
  Validate31(STRING11)
], RangeAreaProperties.prototype, "yLowKey", 2);
__decorateClass([
  Validate31(STRING11)
], RangeAreaProperties.prototype, "yHighKey", 2);
__decorateClass([
  Validate31(STRING11, { optional: true })
], RangeAreaProperties.prototype, "xName", 2);
__decorateClass([
  Validate31(STRING11, { optional: true })
], RangeAreaProperties.prototype, "yName", 2);
__decorateClass([
  Validate31(STRING11, { optional: true })
], RangeAreaProperties.prototype, "yLowName", 2);
__decorateClass([
  Validate31(STRING11, { optional: true })
], RangeAreaProperties.prototype, "yHighName", 2);
__decorateClass([
  Validate31(COLOR_STRING12)
], RangeAreaProperties.prototype, "fill", 2);
__decorateClass([
  Validate31(RATIO17)
], RangeAreaProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate31(COLOR_STRING12)
], RangeAreaProperties.prototype, "stroke", 2);
__decorateClass([
  Validate31(POSITIVE_NUMBER14)
], RangeAreaProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate31(RATIO17)
], RangeAreaProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate31(LINE_DASH9)
], RangeAreaProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate31(POSITIVE_NUMBER14)
], RangeAreaProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate31(OBJECT10)
], RangeAreaProperties.prototype, "shadow", 2);
__decorateClass([
  Validate31(OBJECT10)
], RangeAreaProperties.prototype, "marker", 2);
__decorateClass([
  Validate31(OBJECT10)
], RangeAreaProperties.prototype, "label", 2);
__decorateClass([
  Validate31(OBJECT10)
], RangeAreaProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate31(BOOLEAN14)
], RangeAreaProperties.prototype, "connectMissingData", 2);

// packages/ag-charts-enterprise/src/series/range-area/rangeArea.ts
var {
  valueProperty: valueProperty8,
  trailingValueProperty,
  keyProperty: keyProperty5,
  ChartAxisDirection: ChartAxisDirection15,
  mergeDefaults: mergeDefaults5,
  updateLabelNode,
  fixNumericExtent: fixNumericExtent6,
  AreaSeriesTag,
  buildResetPathFn,
  resetLabelFn: resetLabelFn3,
  resetMarkerFn: resetMarkerFn2,
  resetMarkerPositionFn,
  pathSwipeInAnimation,
  resetMotion,
  markerSwipeScaleInAnimation,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation5,
  animationValidation: animationValidation6,
  diff: diff5,
  updateClipPath
} = _ModuleSupport56;
var { getMarker: getMarker2, PointerEvents: PointerEvents4 } = _Scene35;
var { sanitizeHtml: sanitizeHtml6, extent: extent3, isNumber: isNumber4 } = _Util23;
var DEFAULT_DIRECTION_KEYS = {
  [_ModuleSupport56.ChartAxisDirection.X]: ["xKey"],
  [_ModuleSupport56.ChartAxisDirection.Y]: ["yLowKey", "yHighKey"]
};
var DEFAULT_DIRECTION_NAMES = {
  [ChartAxisDirection15.X]: ["xName"],
  [ChartAxisDirection15.Y]: ["yLowName", "yHighName", "yName"]
};
var RangeAreaSeriesNodeClickEvent = class extends _ModuleSupport56.SeriesNodeClickEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.yLowKey = series.properties.yLowKey;
    this.yHighKey = series.properties.yHighKey;
  }
};
var _RangeAreaSeries = class _RangeAreaSeries extends _ModuleSupport56.CartesianSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      hasMarkers: true,
      pathsPerSeries: 2,
      directionKeys: DEFAULT_DIRECTION_KEYS,
      directionNames: DEFAULT_DIRECTION_NAMES,
      animationResetFns: {
        path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
        label: resetLabelFn3,
        marker: (node, datum) => __spreadValues(__spreadValues({}, resetMarkerFn2(node)), resetMarkerPositionFn(node, datum))
      }
    });
    this.properties = new RangeAreaProperties();
    this.NodeClickEvent = RangeAreaSeriesNodeClickEvent;
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
        extraProps.push(diff5(this.processedData));
      }
      if (animationEnabled) {
        extraProps.push(animationValidation6(this));
      }
      yield this.requestDataModel(dataController, (_a2 = this.data) != null ? _a2 : [], {
        props: [
          keyProperty5(this, xKey, isContinuousX, { id: `xValue` }),
          valueProperty8(this, yLowKey, isContinuousY, { id: `yLowValue`, invalidValue: void 0 }),
          valueProperty8(this, yHighKey, isContinuousY, { id: `yHighValue`, invalidValue: void 0 }),
          trailingValueProperty(this, yLowKey, isContinuousY, {
            id: `yLowTrailingValue`,
            invalidValue: void 0
          }),
          trailingValueProperty(this, yHighKey, isContinuousY, {
            id: `yHighTrailingValue`,
            invalidValue: void 0
          }),
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
    if (direction === ChartAxisDirection15.X) {
      const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
      const xAxis = axes[ChartAxisDirection15.X];
      if ((keyDef == null ? void 0 : keyDef.def.type) === "key" && keyDef.def.valueType === "category") {
        return keys;
      }
      return fixNumericExtent6(extent3(keys), xAxis);
    } else {
      const yLowIndex = dataModel.resolveProcessedDataIndexById(this, "yLowValue").index;
      const yLowExtent = values[yLowIndex];
      const yHighIndex = dataModel.resolveProcessedDataIndexById(this, "yHighValue").index;
      const yHighExtent = values[yHighIndex];
      const fixedYExtent = [
        yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
        yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1]
      ];
      return fixNumericExtent6(fixedYExtent);
    }
  }
  createNodeData() {
    return __async(this, null, function* () {
      var _a2, _b;
      const { data, dataModel, axes, visible } = this;
      const xAxis = axes[ChartAxisDirection15.X];
      const yAxis = axes[ChartAxisDirection15.Y];
      if (!(data && visible && xAxis && yAxis && dataModel)) {
        return [];
      }
      const xScale = xAxis.scale;
      const yScale = yAxis.scale;
      const { xKey, yLowKey, yHighKey, connectMissingData, marker } = this.properties;
      const itemId = `${yLowKey}-${yHighKey}`;
      const xOffset = ((_a2 = xScale.bandwidth) != null ? _a2 : 0) / 2;
      const defs = dataModel.resolveProcessedDataDefsByIds(this, [
        `xValue`,
        `yHighValue`,
        `yLowValue`,
        `yHighTrailingValue`,
        `yLowTrailingValue`
      ]);
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
        points.forEach(({ point: { x, y }, size, itemId: itemId2 = "", yValue }) => {
          markerData.push({
            index: datumIdx,
            series: this,
            itemId: itemId2,
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
            itemId: itemId2,
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
    const actualItemId = inverted ? itemId === "low" ? "high" : "low" : itemId;
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
        (value2) => isNumber4(value2) ? value2.toFixed(2) : String(value2)
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
    const MarkerShape = getMarker2(shape);
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
        pointerEvents: PointerEvents4.None,
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
        pointerEvents: PointerEvents4.None,
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
      const baseStyle = mergeDefaults5(highlighted && this.properties.highlightStyle.item, marker.getStyle(), {
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
        text.pointerEvents = PointerEvents4.None;
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
    const xAxis = this.axes[ChartAxisDirection15.X];
    const yAxis = this.axes[ChartAxisDirection15.Y];
    if (!this.properties.isValid() || !xAxis || !yAxis) {
      return "";
    }
    const { id: seriesId } = this;
    const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, fill, tooltip } = this.properties;
    const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;
    const color = fill != null ? fill : "gray";
    const xString = sanitizeHtml6(xAxis.formatDatum(xValue));
    const yLowString = sanitizeHtml6(yAxis.formatDatum(yLowValue));
    const yHighString = sanitizeHtml6(yAxis.formatDatum(yHighValue));
    const xSubheading = xName != null ? xName : xKey;
    const yLowSubheading = yLowName != null ? yLowName : yLowKey;
    const yHighSubheading = yHighName != null ? yHighName : yHighKey;
    const title = sanitizeHtml6(yName);
    const content = yName ? `<b>${sanitizeHtml6(xSubheading)}</b>: ${xString}<br><b>${sanitizeHtml6(yLowSubheading)}</b>: ${yLowString}<br><b>${sanitizeHtml6(yHighSubheading)}</b>: ${yHighString}<br>` : `${xString}: ${yLowString} - ${yHighString}`;
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
    return new _Scene35.Group();
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
import { _Theme as _Theme23 } from "ag-charts-community";
var RANGE_AREA_SERIES_THEME = {
  series: {
    __extends__: _Theme23.EXTENDS_SERIES_DEFAULTS,
    fillOpacity: 0.7,
    nodeClickRange: "nearest",
    marker: {
      __extends__: _Theme23.EXTENDS_CARTESIAN_MARKER_DEFAULTS,
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
      fontFamily: _Theme23.DEFAULT_FONT_FAMILY,
      color: _Theme23.DEFAULT_LABEL_COLOUR,
      __overrides__: _Theme23.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [_Theme23.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        enabled: true,
        snap: false
      }
    }
  }
};

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaModule.ts
var { markerPaletteFactory: markerPaletteFactory2 } = _ModuleSupport57;
var RangeAreaModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "range-area",
  instanceConstructor: RangeAreaSeries,
  seriesDefaults: {
    axes: [
      {
        type: _Theme24.CARTESIAN_AXIS_TYPE.NUMBER,
        position: _Theme24.POSITION.LEFT,
        crosshair: {
          enabled: true,
          snap: false
        }
      },
      {
        type: _Theme24.CARTESIAN_AXIS_TYPE.CATEGORY,
        position: _Theme24.POSITION.BOTTOM
      }
    ]
  },
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
import { _Theme as _Theme26 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/range-bar/rangeBar.ts
import { _ModuleSupport as _ModuleSupport59, _Scene as _Scene37, _Util as _Util24 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarProperties.ts
import { _ModuleSupport as _ModuleSupport58, _Scene as _Scene36 } from "ag-charts-community";
var { DropShadow: DropShadow2, Label: Label6 } = _Scene36;
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties3,
  SeriesTooltip: SeriesTooltip8,
  Validate: Validate32,
  COLOR_STRING: COLOR_STRING13,
  FUNCTION: FUNCTION9,
  LINE_DASH: LINE_DASH10,
  OBJECT: OBJECT11,
  PLACEMENT: PLACEMENT2,
  POSITIVE_NUMBER: POSITIVE_NUMBER15,
  RATIO: RATIO18,
  STRING: STRING12
} = _ModuleSupport58;
var RangeBarSeriesLabel = class extends Label6 {
  constructor() {
    super(...arguments);
    this.placement = "inside";
    this.padding = 6;
  }
};
__decorateClass([
  Validate32(PLACEMENT2)
], RangeBarSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER15)
], RangeBarSeriesLabel.prototype, "padding", 2);
var RangeBarProperties = class extends AbstractBarSeriesProperties3 {
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
    this.tooltip = new SeriesTooltip8();
  }
};
__decorateClass([
  Validate32(STRING12)
], RangeBarProperties.prototype, "xKey", 2);
__decorateClass([
  Validate32(STRING12)
], RangeBarProperties.prototype, "yLowKey", 2);
__decorateClass([
  Validate32(STRING12)
], RangeBarProperties.prototype, "yHighKey", 2);
__decorateClass([
  Validate32(STRING12, { optional: true })
], RangeBarProperties.prototype, "xName", 2);
__decorateClass([
  Validate32(STRING12, { optional: true })
], RangeBarProperties.prototype, "yName", 2);
__decorateClass([
  Validate32(STRING12, { optional: true })
], RangeBarProperties.prototype, "yLowName", 2);
__decorateClass([
  Validate32(STRING12, { optional: true })
], RangeBarProperties.prototype, "yHighName", 2);
__decorateClass([
  Validate32(COLOR_STRING13)
], RangeBarProperties.prototype, "fill", 2);
__decorateClass([
  Validate32(RATIO18)
], RangeBarProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate32(COLOR_STRING13)
], RangeBarProperties.prototype, "stroke", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER15)
], RangeBarProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate32(RATIO18)
], RangeBarProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate32(LINE_DASH10)
], RangeBarProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER15)
], RangeBarProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER15)
], RangeBarProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate32(FUNCTION9, { optional: true })
], RangeBarProperties.prototype, "formatter", 2);
__decorateClass([
  Validate32(OBJECT11)
], RangeBarProperties.prototype, "shadow", 2);
__decorateClass([
  Validate32(OBJECT11)
], RangeBarProperties.prototype, "label", 2);
__decorateClass([
  Validate32(OBJECT11)
], RangeBarProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/range-bar/rangeBar.ts
var {
  SeriesNodePickMode: SeriesNodePickMode4,
  valueProperty: valueProperty9,
  keyProperty: keyProperty6,
  ChartAxisDirection: ChartAxisDirection16,
  getRectConfig,
  updateRect,
  checkCrisp,
  updateLabelNode: updateLabelNode2,
  CategoryAxis: CategoryAxis2,
  SMALLEST_KEY_INTERVAL: SMALLEST_KEY_INTERVAL2,
  diff: diff6,
  prepareBarAnimationFunctions: prepareBarAnimationFunctions2,
  midpointStartingBarPosition,
  resetBarSelectionsFn: resetBarSelectionsFn2,
  fixNumericExtent: fixNumericExtent7,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation6,
  resetLabelFn: resetLabelFn4,
  animationValidation: animationValidation7,
  createDatumId: createDatumId2
} = _ModuleSupport59;
var { ContinuousScale, BandScale: BandScale5, Rect: Rect3, PointerEvents: PointerEvents5, motion: motion7 } = _Scene37;
var { sanitizeHtml: sanitizeHtml7, isNumber: isNumber5, extent: extent4 } = _Util24;
var DEFAULT_DIRECTION_KEYS2 = {
  [_ModuleSupport59.ChartAxisDirection.X]: ["xKey"],
  [_ModuleSupport59.ChartAxisDirection.Y]: ["yLowKey", "yHighKey"]
};
var DEFAULT_DIRECTION_NAMES2 = {
  [ChartAxisDirection16.X]: ["xName"],
  [ChartAxisDirection16.Y]: ["yLowName", "yHighName", "yName"]
};
var RangeBarSeriesNodeClickEvent = class extends _ModuleSupport59.SeriesNodeClickEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.yLowKey = series.properties.yLowKey;
    this.yHighKey = series.properties.yHighKey;
  }
};
var _RangeBarSeries = class _RangeBarSeries extends _ModuleSupport59.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode4.EXACT_SHAPE_MATCH],
      hasHighlightedLabels: true,
      directionKeys: DEFAULT_DIRECTION_KEYS2,
      directionNames: DEFAULT_DIRECTION_NAMES2,
      datumSelectionGarbageCollection: false,
      animationResetFns: {
        datum: resetBarSelectionsFn2,
        label: resetLabelFn4
      }
    });
    this.properties = new RangeBarProperties();
    this.NodeClickEvent = RangeBarSeriesNodeClickEvent;
    /**
     * Used to get the position of bars within each group.
     */
    this.groupScale = new BandScale5();
    this.smallestDataInterval = void 0;
  }
  resolveKeyDirection(direction) {
    if (this.getBarDirection() === ChartAxisDirection16.X) {
      if (direction === ChartAxisDirection16.X) {
        return ChartAxisDirection16.Y;
      }
      return ChartAxisDirection16.X;
    }
    return direction;
  }
  processData(dataController) {
    return __async(this, null, function* () {
      var _a2, _b, _c, _d, _e;
      if (!this.properties.isValid()) {
        return;
      }
      const { xKey, yLowKey, yHighKey } = this.properties;
      const isContinuousX = ContinuousScale.is((_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale);
      const isContinuousY = ContinuousScale.is((_b = this.getValueAxis()) == null ? void 0 : _b.scale);
      const extraProps = [];
      if (!this.ctx.animationManager.isSkipped()) {
        if (this.processedData) {
          extraProps.push(diff6(this.processedData));
        }
        extraProps.push(animationValidation7(this));
      }
      const visibleProps = !this.visible ? { forceValue: 0 } : {};
      const { processedData } = yield this.requestDataModel(dataController, (_c = this.data) != null ? _c : [], {
        props: [
          keyProperty6(this, xKey, isContinuousX, { id: "xValue" }),
          valueProperty9(this, yLowKey, isContinuousY, __spreadValues({ id: `yLowValue` }, visibleProps)),
          valueProperty9(this, yHighKey, isContinuousY, __spreadValues({ id: `yHighValue` }, visibleProps)),
          ...isContinuousX ? [SMALLEST_KEY_INTERVAL2] : [],
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
      const { reduced: { [SMALLEST_KEY_INTERVAL2.property]: smallestX } = {} } = processedData;
      const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
      const keysExtent = (_a2 = extent4(keys)) != null ? _a2 : [NaN, NaN];
      const categoryAxis = this.getCategoryAxis();
      const isReversed = categoryAxis == null ? void 0 : categoryAxis.isReversed();
      if (direction === ChartAxisDirection16.Y) {
        const d02 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
        const d12 = keysExtent[1] + (isReversed ? scalePadding : 0);
        return fixNumericExtent7([d02, d12], categoryAxis);
      }
      const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
      const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
      return fixNumericExtent7([d0, d1], categoryAxis);
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
      const {
        data,
        dataModel,
        groupScale,
        processedData,
        smallestDataInterval,
        ctx: { seriesStateManager },
        properties: { visible }
      } = this;
      const xAxis = this.getCategoryAxis();
      const yAxis = this.getValueAxis();
      if (!(data && visible && xAxis && yAxis && dataModel)) {
        return [];
      }
      const xScale = xAxis.scale;
      const yScale = yAxis.scale;
      const barAlongX = this.getBarDirection() === ChartAxisDirection16.X;
      const { xKey, yLowKey, yHighKey, fill, stroke, strokeWidth } = this.properties;
      const itemId = `${yLowKey}-${yHighKey}`;
      const contexts = [];
      const domain = [];
      const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
      for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
        domain.push(String(groupIdx));
      }
      const xBandWidth = ContinuousScale.is(xScale) ? xScale.calcBandwidth(smallestDataInterval == null ? void 0 : smallestDataInterval.x) : xScale.bandwidth;
      groupScale.domain = domain;
      groupScale.range = [0, xBandWidth != null ? xBandWidth : 0];
      if (xAxis instanceof CategoryAxis2) {
        groupScale.paddingInner = xAxis.groupPaddingInner;
      } else {
        groupScale.padding = 0;
      }
      groupScale.round = groupScale.padding !== 0;
      const barWidth = groupScale.bandwidth >= 1 ? (
        // Pixel-rounded value for low-volume range charts.
        groupScale.bandwidth
      ) : (
        // Handle high-volume range charts gracefully.
        groupScale.rawBandwidth
      );
      const yLowIndex = dataModel.resolveProcessedDataIndexById(this, `yLowValue`).index;
      const yHighIndex = dataModel.resolveProcessedDataIndexById(this, `yHighValue`).index;
      const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
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
    return new Rect3();
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
      const xAxis = this.axes[ChartAxisDirection16.X];
      const crisp = checkCrisp(xAxis == null ? void 0 : xAxis.visibleRange);
      const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection16.X;
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
          cornerRadius: this.properties.cornerRadius,
          cornerRadiusBbox: void 0
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
        text.pointerEvents = PointerEvents5.None;
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
    const xString = sanitizeHtml7(xAxis.formatDatum(xValue));
    const yLowString = sanitizeHtml7(yAxis.formatDatum(yLowValue));
    const yHighString = sanitizeHtml7(yAxis.formatDatum(yHighValue));
    const xSubheading = xName != null ? xName : xKey;
    const yLowSubheading = yLowName != null ? yLowName : yLowKey;
    const yHighSubheading = yHighName != null ? yHighName : yHighKey;
    const title = sanitizeHtml7(yName);
    const content = yName ? `<b>${sanitizeHtml7(xSubheading)}</b>: ${xString}<br><b>${sanitizeHtml7(yLowSubheading)}</b>: ${yLowString}<br><b>${sanitizeHtml7(yHighSubheading)}</b>: ${yHighString}<br>` : `${xString}: ${yLowString} - ${yHighString}`;
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
    motion7.fromToMotion(this.id, "datums", this.ctx.animationManager, datumSelections, fns);
    seriesLabelFadeInAnimation6(this, "labels", this.ctx.animationManager, labelSelections);
  }
  animateWaitingUpdateReady(data) {
    var _a2;
    const { datumSelections, labelSelections } = data;
    const { processedData } = this;
    const diff7 = (_a2 = processedData == null ? void 0 : processedData.reduced) == null ? void 0 : _a2.diff;
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    const fns = prepareBarAnimationFunctions2(midpointStartingBarPosition(this.isVertical(), "fade"));
    motion7.fromToMotion(
      this.id,
      "datums",
      this.ctx.animationManager,
      datumSelections,
      fns,
      (_, datum) => createDatumId2(datum.xValue),
      diff7
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
import { _Theme as _Theme25 } from "ag-charts-community";
var RANGE_BAR_SERIES_THEME = {
  series: {
    __extends__: _Theme25.EXTENDS_SERIES_DEFAULTS,
    direction: "vertical",
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: _Theme25.DEFAULT_FONT_FAMILY,
      color: _Theme25.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
      placement: "inside",
      __overrides__: _Theme25.OVERRIDE_SERIES_LABEL_DEFAULTS
    }
  },
  axes: {
    [_Theme25.CARTESIAN_AXIS_TYPE.NUMBER]: {
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
  seriesDefaults: {
    axes: [
      {
        type: _Theme26.CARTESIAN_AXIS_TYPE.CATEGORY,
        position: _Theme26.POSITION.BOTTOM
      },
      {
        type: _Theme26.CARTESIAN_AXIS_TYPE.NUMBER,
        position: _Theme26.POSITION.LEFT
      }
    ]
  },
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

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeriesModule.ts
import { _Theme as _Theme27 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeries.ts
import {
  _ModuleSupport as _ModuleSupport61,
  _Scene as _Scene38,
  _Util as _Util25
} from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport60 } from "ag-charts-community";
var {
  HierarchySeriesProperties,
  HighlightStyle,
  SeriesTooltip: SeriesTooltip9,
  Validate: Validate33,
  COLOR_STRING: COLOR_STRING14,
  FUNCTION: FUNCTION10,
  NUMBER: NUMBER10,
  OBJECT: OBJECT12,
  POSITIVE_NUMBER: POSITIVE_NUMBER16,
  RATIO: RATIO19,
  STRING: STRING13
} = _ModuleSupport60;
var SunburstSeriesTileHighlightStyle = class extends HighlightStyle {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizedLabel();
  }
};
__decorateClass([
  Validate33(STRING13, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate33(RATIO19, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate33(COLOR_STRING14, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate33(POSITIVE_NUMBER16, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate33(RATIO19, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate33(OBJECT12)
], SunburstSeriesTileHighlightStyle.prototype, "label", 2);
__decorateClass([
  Validate33(OBJECT12)
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
    this.tooltip = new SeriesTooltip9();
  }
};
__decorateClass([
  Validate33(STRING13, { optional: true })
], SunburstSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate33(STRING13, { optional: true })
], SunburstSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate33(STRING13, { optional: true })
], SunburstSeriesProperties.prototype, "secondaryLabelKey", 2);
__decorateClass([
  Validate33(RATIO19)
], SunburstSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate33(POSITIVE_NUMBER16)
], SunburstSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate33(RATIO19)
], SunburstSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate33(NUMBER10, { optional: true })
], SunburstSeriesProperties.prototype, "sectorSpacing", 2);
__decorateClass([
  Validate33(NUMBER10, { optional: true })
], SunburstSeriesProperties.prototype, "padding", 2);
__decorateClass([
  Validate33(FUNCTION10, { optional: true })
], SunburstSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate33(OBJECT12)
], SunburstSeriesProperties.prototype, "highlightStyle", 2);
__decorateClass([
  Validate33(OBJECT12)
], SunburstSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate33(OBJECT12)
], SunburstSeriesProperties.prototype, "secondaryLabel", 2);
__decorateClass([
  Validate33(OBJECT12)
], SunburstSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeries.ts
var { fromToMotion: fromToMotion2 } = _ModuleSupport61;
var { Sector: Sector5, Group: Group8, Selection: Selection4, Text: Text7 } = _Scene38;
var { sanitizeHtml: sanitizeHtml8 } = _Util25;
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
var _SunburstSeries = class _SunburstSeries extends _ModuleSupport61.HierarchySeries {
  constructor() {
    super(...arguments);
    this.properties = new SunburstSeriesProperties();
    this.groupSelection = Selection4.select(this.contentGroup, Group8);
    this.highlightSelection = Selection4.select(
      this.highlightGroup,
      Group8
    );
    this.angleData = [];
  }
  processData() {
    return __async(this, null, function* () {
      const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName } = this.properties;
      __superGet(_SunburstSeries.prototype, this, "processData").call(this);
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
          new Text7({ tag: 0 /* Primary */ }),
          new Text7({ tag: 1 /* Secondary */ })
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
      const labelTextNode = new Text7();
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
        if (depth == null || angleData == null)
          return void 0;
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
        const sizeFittingHeight = (height3) => {
          var _a3;
          const isCenterCircle = depth === 0 && ((_a3 = node.parent) == null ? void 0 : _a3.sumSize) === node.sumSize;
          if (isCenterCircle) {
            const width3 = 2 * Math.sqrt(__pow(outerRadius, 2) - __pow(height3 * 0.5, 2));
            return { width: width3, height: height3, meta: 0 /* CenterCircle */ };
          }
          const parallelHeight = height3;
          const availableWidthUntilItHitsTheOuterRadius = 2 * Math.sqrt(__pow(outerRadius, 2) - __pow(innerRadius + parallelHeight, 2));
          const availableWidthUntilItHitsTheStraightEdges = deltaInnerAngle < Math.PI ? 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5) : Infinity;
          const parallelWidth = Math.min(
            availableWidthUntilItHitsTheOuterRadius,
            availableWidthUntilItHitsTheStraightEdges
          );
          let perpendicularHeight;
          let perpendicularWidth;
          if (depth === 0) {
            perpendicularHeight = height3;
            perpendicularWidth = Math.sqrt(__pow(outerRadius, 2) - __pow(perpendicularHeight / 2, 2)) - height3 / (2 * Math.tan(deltaOuterAngle * 0.5));
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
        if (formatting == null)
          return void 0;
        const { width: width2, height: height2, meta: labelPlacement, label, secondaryLabel } = formatting;
        const theta = angleOffset + (angleData.start + angleData.end) / 2;
        const top = Math.sin(theta) >= 0;
        const right = Math.cos(theta) >= 0;
        const circleQuarter = (top ? 3 /* Top */ : 12 /* Bottom */) & (right ? 6 /* Right */ : 9 /* Left */);
        let radius2;
        switch (labelPlacement) {
          case 0 /* CenterCircle */:
            radius2 = 0;
            break;
          case 1 /* Parallel */: {
            const opticalCentering = 0.58;
            const idealRadius = outerRadius - (radiusScale - height2) * opticalCentering;
            const maximumRadius = Math.sqrt(__pow(outerRadius - padding, 2) - __pow(width2 / 2, 2));
            radius2 = Math.min(idealRadius, maximumRadius);
            break;
          }
          case 2 /* Perpendicular */:
            if (depth === 0) {
              const minimumRadius = height2 / (2 * Math.tan(deltaInnerAngle * 0.5)) + width2 * 0.5;
              const maximumRadius = Math.sqrt(__pow(outerRadius, 2) - __pow(height2 * 0.5, 2)) - width2 * 0.5;
              radius2 = (minimumRadius + maximumRadius) * 0.5;
            } else {
              radius2 = (innerRadius + outerRadius) * 0.5;
            }
            break;
        }
        return { width: width2, height: height2, labelPlacement, circleQuarter, radius: radius2, theta, label, secondaryLabel };
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
        const { height: height2, labelPlacement, circleQuarter, radius: radius2, theta } = meta;
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
            text.translationY = (tag === 0 /* Primary */ ? 0 : height2 - label.height) - height2 * 0.5;
            text.rotation = 0;
            break;
          case 1 /* Parallel */: {
            const topHalf = (circleQuarter & 3 /* Top */) !== 0;
            const translationRadius = tag === 0 /* Primary */ === !topHalf ? radius2 : radius2 - (height2 - label.height);
            text.textAlign = "center";
            text.textBaseline = topHalf ? "bottom" : "top";
            text.translationX = Math.cos(theta) * translationRadius;
            text.translationY = Math.sin(theta) * translationRadius;
            text.rotation = topHalf ? theta - Math.PI * 0.5 : theta + Math.PI * 0.5;
            break;
          }
          case 2 /* Perpendicular */: {
            const rightHalf = (circleQuarter & 6 /* Right */) !== 0;
            const translation = tag === 0 /* Primary */ === !rightHalf ? (height2 - label.height) * 0.5 : (label.height - height2) * 0.5;
            text.textAlign = "center";
            text.textBaseline = "middle";
            text.translationX = Math.cos(theta) * radius2 + Math.cos(theta + Math.PI / 2) * translation;
            text.translationY = Math.sin(theta) * radius2 + Math.sin(theta + Math.PI / 2) * translation;
            text.rotation = rightHalf ? theta : theta + Math.PI;
            break;
          }
        }
        text.visible = true;
      };
      this.groupSelection.selectByClass(Text7).forEach((text) => {
        updateText(text.datum, text, text.tag, false);
      });
      this.highlightSelection.selectByClass(Text7).forEach((text) => {
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
      contentArray.push(sanitizeHtml8(datumSecondaryLabel));
    }
    const datumSize = sizeKey != null ? datum[sizeKey] : void 0;
    if (datumSize != null) {
      contentArray.push(`${sizeName}: ${sanitizeHtml8(datumSize)}`);
    }
    const datumColor = colorKey != null ? datum[colorKey] : void 0;
    if (datumColor != null) {
      contentArray.push(`${colorName}: ${sanitizeHtml8(datumColor)}`);
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
    fromToMotion2(this.id, "nodes", this.ctx.animationManager, datumSelections, {
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

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeriesModule.ts
var { EXTENDS_SERIES_DEFAULTS, DEFAULT_INSIDE_SERIES_LABEL_COLOUR } = _Theme27;
var SunburstSeriesModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["hierarchy"],
  identifier: "sunburst",
  instanceConstructor: SunburstSeries,
  seriesDefaults: {},
  solo: true,
  themeTemplate: {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS,
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
    const defaultColorRange = properties.get(_Theme27.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    return { fills, strokes, colorRange: defaultColorRange };
  }
};

// packages/ag-charts-enterprise/src/series/treemap/treemapSeriesModule.ts
import { _Theme as _Theme28 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts
import {
  _ModuleSupport as _ModuleSupport63,
  _Scene as _Scene40,
  _Util as _Util26
} from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/treemap/treemapSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport62, _Scene as _Scene39 } from "ag-charts-community";
var { Label: Label7 } = _Scene39;
var {
  BaseProperties: BaseProperties7,
  HierarchySeriesProperties: HierarchySeriesProperties2,
  HighlightStyle: HighlightStyle2,
  SeriesTooltip: SeriesTooltip10,
  Validate: Validate34,
  BOOLEAN: BOOLEAN15,
  COLOR_STRING: COLOR_STRING15,
  FUNCTION: FUNCTION11,
  NUMBER: NUMBER11,
  OBJECT: OBJECT13,
  POSITIVE_NUMBER: POSITIVE_NUMBER17,
  RATIO: RATIO20,
  STRING: STRING14,
  STRING_ARRAY,
  TEXT_ALIGN: TEXT_ALIGN2,
  VERTICAL_ALIGN: VERTICAL_ALIGN2
} = _ModuleSupport62;
var TreemapGroupLabel = class extends Label7 {
  constructor() {
    super(...arguments);
    this.spacing = 0;
  }
};
__decorateClass([
  Validate34(NUMBER11)
], TreemapGroupLabel.prototype, "spacing", 2);
var TreemapSeriesGroup = class extends BaseProperties7 {
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
  Validate34(STRING14, { optional: true })
], TreemapSeriesGroup.prototype, "fill", 2);
__decorateClass([
  Validate34(RATIO20)
], TreemapSeriesGroup.prototype, "fillOpacity", 2);
__decorateClass([
  Validate34(COLOR_STRING15, { optional: true })
], TreemapSeriesGroup.prototype, "stroke", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER17)
], TreemapSeriesGroup.prototype, "strokeWidth", 2);
__decorateClass([
  Validate34(RATIO20)
], TreemapSeriesGroup.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate34(TEXT_ALIGN2)
], TreemapSeriesGroup.prototype, "textAlign", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER17)
], TreemapSeriesGroup.prototype, "gap", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER17)
], TreemapSeriesGroup.prototype, "padding", 2);
__decorateClass([
  Validate34(BOOLEAN15)
], TreemapSeriesGroup.prototype, "interactive", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesGroup.prototype, "label", 2);
var TreemapSeriesTile = class extends BaseProperties7 {
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
  Validate34(STRING14, { optional: true })
], TreemapSeriesTile.prototype, "fill", 2);
__decorateClass([
  Validate34(RATIO20)
], TreemapSeriesTile.prototype, "fillOpacity", 2);
__decorateClass([
  Validate34(COLOR_STRING15, { optional: true })
], TreemapSeriesTile.prototype, "stroke", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER17, { optional: true })
], TreemapSeriesTile.prototype, "strokeWidth", 2);
__decorateClass([
  Validate34(RATIO20)
], TreemapSeriesTile.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate34(TEXT_ALIGN2)
], TreemapSeriesTile.prototype, "textAlign", 2);
__decorateClass([
  Validate34(VERTICAL_ALIGN2)
], TreemapSeriesTile.prototype, "verticalAlign", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER17)
], TreemapSeriesTile.prototype, "gap", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER17)
], TreemapSeriesTile.prototype, "padding", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesTile.prototype, "label", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesTile.prototype, "secondaryLabel", 2);
var TreemapSeriesGroupHighlightStyle = class extends BaseProperties7 {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
  }
};
__decorateClass([
  Validate34(STRING14, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate34(RATIO20, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate34(COLOR_STRING15, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER17, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate34(RATIO20, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesGroupHighlightStyle.prototype, "label", 2);
var TreemapSeriesTileHighlightStyle = class extends BaseProperties7 {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
  }
};
__decorateClass([
  Validate34(STRING14, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate34(RATIO20, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate34(COLOR_STRING15, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER17, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate34(RATIO20, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesTileHighlightStyle.prototype, "label", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesTileHighlightStyle.prototype, "secondaryLabel", 2);
var TreemapSeriesHighlightStyle = class extends HighlightStyle2 {
  constructor() {
    super(...arguments);
    this.group = new TreemapSeriesGroupHighlightStyle();
    this.tile = new TreemapSeriesTileHighlightStyle();
  }
};
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesHighlightStyle.prototype, "group", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesHighlightStyle.prototype, "tile", 2);
var TreemapSeriesProperties = class extends HierarchySeriesProperties2 {
  constructor() {
    super(...arguments);
    this.highlightStyle = new TreemapSeriesHighlightStyle();
    this.tooltip = new SeriesTooltip10();
    this.group = new TreemapSeriesGroup();
    this.tile = new TreemapSeriesTile();
    this.undocumentedGroupFills = [];
    this.undocumentedGroupStrokes = [];
  }
};
__decorateClass([
  Validate34(STRING14, { optional: true })
], TreemapSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate34(STRING14, { optional: true })
], TreemapSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate34(STRING14, { optional: true })
], TreemapSeriesProperties.prototype, "secondaryLabelKey", 2);
__decorateClass([
  Validate34(FUNCTION11, { optional: true })
], TreemapSeriesProperties.prototype, "formatter", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesProperties.prototype, "highlightStyle", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesProperties.prototype, "group", 2);
__decorateClass([
  Validate34(OBJECT13)
], TreemapSeriesProperties.prototype, "tile", 2);
__decorateClass([
  Validate34(STRING_ARRAY)
], TreemapSeriesProperties.prototype, "undocumentedGroupFills", 2);
__decorateClass([
  Validate34(STRING_ARRAY)
], TreemapSeriesProperties.prototype, "undocumentedGroupStrokes", 2);

// packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts
var { Rect: Rect4, Group: Group9, BBox: BBox7, Selection: Selection5, Text: Text8 } = _Scene40;
var { Color: Color2, Logger: Logger6, isEqual, sanitizeHtml: sanitizeHtml9 } = _Util26;
var tempText = new Text8();
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
    Logger6.warnOnce(
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
var _TreemapSeries = class _TreemapSeries extends _ModuleSupport63.HierarchySeries {
  constructor() {
    super(...arguments);
    this.properties = new TreemapSeriesProperties();
    this.groupSelection = Selection5.select(this.contentGroup, Group9);
    this.highlightSelection = Selection5.select(
      this.highlightGroup,
      Group9
    );
  }
  groupTitleHeight(node, bbox) {
    var _a2, _b;
    const label = (_b = (_a2 = this.labelData) == null ? void 0 : _a2[node.index]) == null ? void 0 : _b.label;
    const { label: font } = this.properties.group;
    const heightRatioThreshold = 3;
    if (label == null) {
      return void 0;
    } else if (font.fontSize > bbox.width / heightRatioThreshold || font.fontSize > bbox.height / heightRatioThreshold) {
      return void 0;
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
    outputBoxes[index] = index !== 0 ? bbox : void 0;
    const sortedChildrenIndices = Array.from(children, (_, index2) => index2).filter((index2) => nodeSize(children[index2]) > 0).sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));
    const childAt = (index2) => {
      const sortedIndex = sortedChildrenIndices[index2];
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
    const innerBox = new BBox7(bbox.x + padding.left, bbox.y + padding.top, width, height);
    const partition = innerBox.clone();
    for (let i = 0; i < numChildren; i++) {
      const value = nodeSize(childAt(i));
      const firstValue = nodeSize(childAt(startIndex));
      const isVertical2 = partition.width < partition.height;
      stackSum += value;
      const partThickness = isVertical2 ? partition.height : partition.width;
      const partLength = isVertical2 ? partition.width : partition.height;
      const firstTileLength = partLength * firstValue / stackSum;
      let stackThickness = partThickness * stackSum / partitionSum;
      const ratio = Math.max(firstTileLength, stackThickness) / Math.min(firstTileLength, stackThickness);
      const diff7 = Math.abs(targetTileAspectRatio - ratio);
      if (diff7 < minRatioDiff) {
        minRatioDiff = diff7;
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
        const width2 = isVertical2 ? length : stackThickness;
        const height2 = isVertical2 ? stackThickness : length;
        const childBbox = new BBox7(x, y, width2, height2);
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
      i--;
    }
    const isVertical = partition.width < partition.height;
    let start = isVertical ? partition.x : partition.y;
    for (let i = startIndex; i < numChildren; i++) {
      const child = childAt(i);
      const x = isVertical ? start : partition.x;
      const y = isVertical ? partition.y : start;
      const part = nodeSize(child) / partitionSum;
      const width2 = partition.width * (isVertical ? part : 1);
      const height2 = partition.height * (isVertical ? 1 : part);
      const childBox = new BBox7(x, y, width2, height2);
      this.applyGap(innerBox, childBox, allLeafNodes);
      this.squarify(child, childBox, outputBoxes);
      start += isVertical ? width2 : height2;
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
          new Rect4(),
          new Text8({ tag: 0 /* Primary */ }),
          new Text8({ tag: 1 /* Secondary */ })
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
      this.squarify(rootNode, new BBox7(0, 0, width, height), bboxes);
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
          const { tile: tile2, group: group2 } = highlightStyle;
          highlightedFill = isLeaf ? tile2.fill : group2.fill;
          highlightedFillOpacity = isLeaf ? tile2.fillOpacity : group2.fillOpacity;
          highlightedStroke = isLeaf ? tile2.stroke : group2.stroke;
          highlightedStrokeWidth = isLeaf ? tile2.strokeWidth : group2.strokeWidth;
          highlightedStrokeOpacity = isLeaf ? tile2.strokeOpacity : group2.strokeOpacity;
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
      this.groupSelection.selectByClass(Rect4).forEach((rect) => updateRectFn(rect.datum, rect, false));
      this.highlightSelection.selectByClass(Rect4).forEach((rect) => {
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
        if (bbox == null || labelDatum == null)
          return void 0;
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
          if (formatting == null)
            return void 0;
          const { height: height2, label, secondaryLabel } = formatting;
          const { textAlign, verticalAlign, padding } = tile;
          const textAlignFactor = (_b2 = textAlignFactors2[textAlign]) != null ? _b2 : 0.5;
          const labelX = bbox.x + padding + (bbox.width - 2 * padding) * textAlignFactor;
          const verticalAlignFactor = (_c = verticalAlignFactors2[verticalAlign]) != null ? _c : 0.5;
          const labelYStart = bbox.y + padding + height2 * 0.5 + (bbox.height - 2 * padding - height2) * verticalAlignFactor;
          return {
            label: label != null ? {
              text: label.text,
              fontSize: label.fontSize,
              lineHeight: label.lineHeight,
              style: this.properties.tile.label,
              x: labelX,
              y: labelYStart - (height2 - label.height) * 0.5
            } : void 0,
            secondaryLabel: secondaryLabel != null ? {
              text: secondaryLabel.text,
              fontSize: secondaryLabel.fontSize,
              lineHeight: secondaryLabel.fontSize,
              style: this.properties.tile.secondaryLabel,
              x: labelX,
              y: labelYStart + (height2 - secondaryLabel.height) * 0.5
            } : void 0,
            verticalAlign: "middle",
            textAlign
          };
        } else if ((labelDatum == null ? void 0 : labelDatum.label) != null) {
          const { padding, textAlign } = group;
          const groupTitleHeight = this.groupTitleHeight(node, bbox);
          if (groupTitleHeight == null)
            return void 0;
          const innerWidth = bbox.width - 2 * padding;
          const { text } = Text8.wrap(labelDatum.label, bbox.width - 2 * padding, Infinity, group.label, "never");
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
        } else {
          return void 0;
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
          const { tile: tile2, group: group2 } = highlightStyle;
          highlightedColor = !isLeaf ? group2.label.color : tag === 0 /* Primary */ ? tile2.label.color : tile2.secondaryLabel.color;
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
      this.groupSelection.selectByClass(Text8).forEach((text) => {
        updateLabelFn(text.datum, text, text.tag, false);
      });
      this.highlightSelection.selectByClass(Text8).forEach((text) => {
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
      contentArray.push(sanitizeHtml9(datumSecondaryLabel));
    }
    const datumSize = sizeKey != null ? datum[sizeKey] : void 0;
    if (datumSize != null) {
      contentArray.push(`${sizeName}: ${sanitizeHtml9(datumSize)}`);
    }
    const datumColor = colorKey != null ? datum[colorKey] : void 0;
    if (datumColor != null) {
      contentArray.push(`${colorName}: ${sanitizeHtml9(datumColor)}`);
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

// packages/ag-charts-enterprise/src/series/treemap/treemapSeriesModule.ts
var {
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
  DEFAULT_FONT_FAMILY,
  DEFAULT_HIERARCHY_FILLS,
  DEFAULT_HIERARCHY_STROKES,
  DEFAULT_INSIDE_SERIES_LABEL_COLOUR: DEFAULT_INSIDE_SERIES_LABEL_COLOUR2,
  EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS2,
  DEFAULT_LABEL_COLOUR,
  FONT_WEIGHT: FONT_WEIGHT2
} = _Theme28;
var TreemapSeriesModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["hierarchy"],
  identifier: "treemap",
  instanceConstructor: TreemapSeries,
  seriesDefaults: {},
  solo: true,
  themeTemplate: {
    series: {
      __extends__: EXTENDS_SERIES_DEFAULTS2,
      group: {
        label: {
          enabled: true,
          color: DEFAULT_LABEL_COLOUR,
          fontStyle: void 0,
          fontWeight: FONT_WEIGHT2.NORMAL,
          fontSize: 12,
          fontFamily: DEFAULT_FONT_FAMILY,
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
          fontFamily: DEFAULT_FONT_FAMILY,
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
          fontFamily: DEFAULT_FONT_FAMILY,
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
            color: DEFAULT_LABEL_COLOUR
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
    const defaultColorRange = properties.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    const groupFills = properties.get(DEFAULT_HIERARCHY_FILLS);
    const groupStrokes = properties.get(DEFAULT_HIERARCHY_STROKES);
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
import { _Theme as _Theme30 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeries.ts
import { _ModuleSupport as _ModuleSupport65, _Scene as _Scene42, _Util as _Util27 } from "ag-charts-community";

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeriesProperties.ts
import { _ModuleSupport as _ModuleSupport64, _Scene as _Scene41 } from "ag-charts-community";
var { DropShadow: DropShadow3, Label: Label8 } = _Scene41;
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties4,
  BaseProperties: BaseProperties8,
  PropertiesArray: PropertiesArray2,
  SeriesTooltip: SeriesTooltip11,
  Validate: Validate35,
  BOOLEAN: BOOLEAN16,
  COLOR_STRING: COLOR_STRING16,
  FUNCTION: FUNCTION12,
  LINE_DASH: LINE_DASH11,
  NUMBER: NUMBER12,
  OBJECT: OBJECT14,
  OBJECT_ARRAY,
  POSITIVE_NUMBER: POSITIVE_NUMBER18,
  RATIO: RATIO21,
  STRING: STRING15,
  UNION: UNION5
} = _ModuleSupport64;
var WaterfallSeriesTotal = class extends BaseProperties8 {
};
__decorateClass([
  Validate35(UNION5(["subtotal", "total"], "a total type"))
], WaterfallSeriesTotal.prototype, "totalType", 2);
__decorateClass([
  Validate35(NUMBER12)
], WaterfallSeriesTotal.prototype, "index", 2);
__decorateClass([
  Validate35(STRING15)
], WaterfallSeriesTotal.prototype, "axisLabel", 2);
var WaterfallSeriesItemTooltip = class extends BaseProperties8 {
};
__decorateClass([
  Validate35(FUNCTION12, { optional: true })
], WaterfallSeriesItemTooltip.prototype, "renderer", 2);
var WaterfallSeriesLabel = class extends Label8 {
  constructor() {
    super(...arguments);
    this.placement = "end";
    this.padding = 6;
  }
};
__decorateClass([
  Validate35(UNION5(["start", "end", "inside"], "a placement"))
], WaterfallSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER18)
], WaterfallSeriesLabel.prototype, "padding", 2);
var WaterfallSeriesItem = class extends BaseProperties8 {
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
  Validate35(STRING15, { optional: true })
], WaterfallSeriesItem.prototype, "name", 2);
__decorateClass([
  Validate35(COLOR_STRING16)
], WaterfallSeriesItem.prototype, "fill", 2);
__decorateClass([
  Validate35(COLOR_STRING16)
], WaterfallSeriesItem.prototype, "stroke", 2);
__decorateClass([
  Validate35(RATIO21)
], WaterfallSeriesItem.prototype, "fillOpacity", 2);
__decorateClass([
  Validate35(RATIO21)
], WaterfallSeriesItem.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate35(LINE_DASH11)
], WaterfallSeriesItem.prototype, "lineDash", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER18)
], WaterfallSeriesItem.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER18)
], WaterfallSeriesItem.prototype, "strokeWidth", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER18)
], WaterfallSeriesItem.prototype, "cornerRadius", 2);
__decorateClass([
  Validate35(FUNCTION12, { optional: true })
], WaterfallSeriesItem.prototype, "formatter", 2);
__decorateClass([
  Validate35(OBJECT14)
], WaterfallSeriesItem.prototype, "shadow", 2);
__decorateClass([
  Validate35(OBJECT14)
], WaterfallSeriesItem.prototype, "label", 2);
__decorateClass([
  Validate35(OBJECT14)
], WaterfallSeriesItem.prototype, "tooltip", 2);
var WaterfallSeriesConnectorLine = class extends BaseProperties8 {
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
  Validate35(BOOLEAN16)
], WaterfallSeriesConnectorLine.prototype, "enabled", 2);
__decorateClass([
  Validate35(COLOR_STRING16)
], WaterfallSeriesConnectorLine.prototype, "stroke", 2);
__decorateClass([
  Validate35(RATIO21)
], WaterfallSeriesConnectorLine.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate35(LINE_DASH11)
], WaterfallSeriesConnectorLine.prototype, "lineDash", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER18)
], WaterfallSeriesConnectorLine.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER18)
], WaterfallSeriesConnectorLine.prototype, "strokeWidth", 2);
var WaterfallSeriesItems = class extends BaseProperties8 {
  constructor() {
    super(...arguments);
    this.positive = new WaterfallSeriesItem();
    this.negative = new WaterfallSeriesItem();
    this.total = new WaterfallSeriesItem();
  }
};
__decorateClass([
  Validate35(OBJECT14)
], WaterfallSeriesItems.prototype, "positive", 2);
__decorateClass([
  Validate35(OBJECT14)
], WaterfallSeriesItems.prototype, "negative", 2);
__decorateClass([
  Validate35(OBJECT14)
], WaterfallSeriesItems.prototype, "total", 2);
var WaterfallSeriesProperties = class extends AbstractBarSeriesProperties4 {
  constructor() {
    super(...arguments);
    this.item = new WaterfallSeriesItems();
    this.totals = new PropertiesArray2(WaterfallSeriesTotal);
    this.line = new WaterfallSeriesConnectorLine();
    this.tooltip = new SeriesTooltip11();
  }
};
__decorateClass([
  Validate35(STRING15)
], WaterfallSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate35(STRING15)
], WaterfallSeriesProperties.prototype, "yKey", 2);
__decorateClass([
  Validate35(STRING15, { optional: true })
], WaterfallSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate35(STRING15, { optional: true })
], WaterfallSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate35(OBJECT14)
], WaterfallSeriesProperties.prototype, "item", 2);
__decorateClass([
  Validate35(OBJECT_ARRAY)
], WaterfallSeriesProperties.prototype, "totals", 2);
__decorateClass([
  Validate35(OBJECT14)
], WaterfallSeriesProperties.prototype, "line", 2);
__decorateClass([
  Validate35(OBJECT14)
], WaterfallSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeries.ts
var {
  adjustLabelPlacement,
  SeriesNodePickMode: SeriesNodePickMode5,
  fixNumericExtent: fixNumericExtent8,
  valueProperty: valueProperty10,
  keyProperty: keyProperty7,
  accumulativeValueProperty,
  trailingAccumulatedValueProperty,
  ChartAxisDirection: ChartAxisDirection17,
  getRectConfig: getRectConfig2,
  updateRect: updateRect2,
  checkCrisp: checkCrisp2,
  updateLabelNode: updateLabelNode3,
  prepareBarAnimationFunctions: prepareBarAnimationFunctions3,
  collapsedStartingBarPosition: collapsedStartingBarPosition2,
  resetBarSelectionsFn: resetBarSelectionsFn3,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation7,
  resetLabelFn: resetLabelFn5,
  animationValidation: animationValidation8
} = _ModuleSupport65;
var { ContinuousScale: ContinuousScale2, Rect: Rect5, motion: motion8 } = _Scene42;
var { sanitizeHtml: sanitizeHtml10, isContinuous, isNumber: isNumber6 } = _Util27;
var _WaterfallSeries = class _WaterfallSeries extends _ModuleSupport65.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode5.EXACT_SHAPE_MATCH],
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
    this.smallestDataInterval = void 0;
  }
  resolveKeyDirection(direction) {
    if (this.getBarDirection() === ChartAxisDirection17.X) {
      if (direction === ChartAxisDirection17.X) {
        return ChartAxisDirection17.Y;
      }
      return ChartAxisDirection17.X;
    }
    return direction;
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
        return isContinuous(v) && v >= 0;
      };
      const negativeNumber = (v) => {
        return isContinuous(v) && v < 0;
      };
      const totalTypeValue = (v) => {
        return v === "total" || v === "subtotal";
      };
      const propertyDefinition = {
        missingValue: void 0,
        invalidValue: void 0
      };
      const dataWithTotals = [];
      const totalsMap = totals.reduce((totalsMap2, total) => {
        const totalsAtIndex = totalsMap2.get(total.index);
        if (totalsAtIndex) {
          totalsAtIndex.push(total);
        } else {
          totalsMap2.set(total.index, [total]);
        }
        return totalsMap2;
      }, /* @__PURE__ */ new Map());
      data.forEach((datum, i) => {
        var _a3;
        dataWithTotals.push(datum);
        (_a3 = totalsMap.get(i)) == null ? void 0 : _a3.forEach((total) => dataWithTotals.push(__spreadProps(__spreadValues({}, total.toJson()), { [xKey]: total.axisLabel })));
      });
      const isContinuousX = ContinuousScale2.is((_a2 = this.getCategoryAxis()) == null ? void 0 : _a2.scale);
      const extraProps = [];
      if (!this.ctx.animationManager.isSkipped()) {
        extraProps.push(animationValidation8(this));
      }
      const { processedData } = yield this.requestDataModel(dataController, dataWithTotals, {
        props: [
          keyProperty7(this, xKey, isContinuousX, { id: `xValue` }),
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
          valueProperty10(this, yKey, true, { id: `yRaw` }),
          // Raw value pass-through.
          valueProperty10(this, "totalType", false, {
            id: `totalTypeValue`,
            missingValue: void 0,
            validation: totalTypeValue
          }),
          ...isContinuousX ? [_ModuleSupport65.SMALLEST_KEY_INTERVAL] : [],
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
    if (!(processedData && dataModel))
      return [];
    const {
      domain: {
        keys: [keys],
        values
      },
      reduced: { [_ModuleSupport65.SMALLEST_KEY_INTERVAL.property]: smallestX } = {}
    } = processedData;
    const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
    if (direction === this.getCategoryDirection()) {
      if ((keyDef == null ? void 0 : keyDef.def.type) === "key" && (keyDef == null ? void 0 : keyDef.def.valueType) === "category") {
        return keys;
      }
      const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
      const keysExtent = (_a2 = _ModuleSupport65.extent(keys)) != null ? _a2 : [NaN, NaN];
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
      const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrent").index;
      const yExtent = values[yCurrIndex];
      const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
      return fixNumericExtent8(fixedYExtent);
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
      const barAlongX = this.getBarDirection() === ChartAxisDirection17.X;
      const barWidth = (_a2 = ContinuousScale2.is(xScale) ? xScale.calcBandwidth(smallestDataInterval == null ? void 0 : smallestDataInterval.x) : xScale.bandwidth) != null ? _a2 : 10;
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
          (value2) => isNumber6(value2) ? value2.toFixed(2) : String(value2)
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
    return new Rect5();
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
      const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection17.X;
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
          cornerRadius,
          cornerRadiusBbox: void 0
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
    const xString = sanitizeHtml10(categoryAxis.formatDatum(xValue));
    const yString = sanitizeHtml10(valueAxis.formatDatum(yValue));
    const isTotal = this.isTotal(itemId);
    const isSubtotal = this.isSubtotal(itemId);
    const ySubheading = isTotal ? "Total" : isSubtotal ? "Subtotal" : (_c = name != null ? name : yName) != null ? _c : yKey;
    const title = sanitizeHtml10(yName);
    const content = `<b>${sanitizeHtml10(xName != null ? xName : xKey)}</b>: ${xString}<br/><b>${sanitizeHtml10(ySubheading)}</b>: ${yString}`;
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
    motion8.fromToMotion(this.id, "datums", this.ctx.animationManager, datumSelections, fns);
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
      id: `${this.id}_datums`,
      groupId: this.id,
      phase: "initial",
      from: startX,
      to: endX,
      ease: _ModuleSupport65.Motion.easeOut,
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
      id: `${this.id}_datums`,
      groupId: this.id,
      phase: "initial",
      from: startY,
      to: endY,
      ease: _ModuleSupport65.Motion.easeOut,
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
      pointerEvents: _Scene42.PointerEvents.None
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
import { _Theme as _Theme29 } from "ag-charts-community";
var WATERFALL_SERIES_THEME = {
  series: {
    __extends__: _Theme29.EXTENDS_SERIES_DEFAULTS,
    item: {
      positive: {
        strokeWidth: 0,
        label: {
          enabled: false
        }
      },
      negative: {
        strokeWidth: 0,
        label: {
          enabled: false
        }
      },
      total: {
        strokeWidth: 0,
        label: {
          enabled: false
        }
      }
    },
    line: {
      stroke: _Theme29.DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
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
  seriesDefaults: {
    axes: [
      {
        type: _Theme30.CARTESIAN_AXIS_TYPE.CATEGORY,
        position: _Theme30.POSITION.BOTTOM
      },
      {
        type: _Theme30.CARTESIAN_AXIS_TYPE.NUMBER,
        position: _Theme30.POSITION.LEFT
      }
    ]
  },
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
        positive: properties.get(_Theme30.DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS),
        negative: properties.get(_Theme30.DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS),
        total: properties.get(_Theme30.DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS)
      }
    };
  }
};

// packages/ag-charts-enterprise/src/setup.ts
function setupEnterpriseModules() {
  _ModuleSupport66.registerModule(AngleCategoryAxisModule);
  _ModuleSupport66.registerModule(AngleNumberAxisModule);
  _ModuleSupport66.registerModule(AnimationModule);
  _ModuleSupport66.registerModule(BackgroundModule);
  _ModuleSupport66.registerModule(BoxPlotModule);
  _ModuleSupport66.registerModule(BulletModule);
  _ModuleSupport66.registerModule(ContextMenuModule);
  _ModuleSupport66.registerModule(CrosshairModule);
  _ModuleSupport66.registerModule(DataSourceModule);
  _ModuleSupport66.registerModule(ErrorBarsModule);
  _ModuleSupport66.registerModule(NavigatorModule);
  _ModuleSupport66.registerModule(GradientLegendModule);
  _ModuleSupport66.registerModule(HeatmapModule);
  _ModuleSupport66.registerModule(NightingaleModule);
  _ModuleSupport66.registerModule(RadarAreaModule);
  _ModuleSupport66.registerModule(RadarLineModule);
  _ModuleSupport66.registerModule(RadialBarModule);
  _ModuleSupport66.registerModule(RadialColumnModule);
  _ModuleSupport66.registerModule(RadiusCategoryAxisModule);
  _ModuleSupport66.registerModule(RadiusNumberAxisModule);
  _ModuleSupport66.registerModule(RangeBarModule);
  _ModuleSupport66.registerModule(RangeAreaModule);
  _ModuleSupport66.registerModule(SunburstSeriesModule);
  _ModuleSupport66.registerModule(SyncModule);
  _ModuleSupport66.registerModule(TreemapSeriesModule);
  _ModuleSupport66.registerModule(WaterfallModule);
  _ModuleSupport66.registerModule(ZoomModule);
  _ModuleSupport66.enterpriseModule.isEnterprise = true;
  _ModuleSupport66.enterpriseModule.licenseManager = (options) => {
    var _a2, _b;
    return new LicenseManager(
      (_b = (_a2 = options.container) == null ? void 0 : _a2.ownerDocument) != null ? _b : typeof document !== "undefined" ? document : void 0
    );
  };
  _ModuleSupport66.enterpriseModule.injectWatermark = injectWatermark;
}

// packages/ag-charts-enterprise/src/main.ts
export * from "ag-charts-community";
setupEnterpriseModules();
export {
  AgCharts,
  time
};
