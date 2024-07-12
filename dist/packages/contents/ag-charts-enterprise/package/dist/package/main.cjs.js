"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// packages/ag-charts-enterprise/src/main.ts
var main_exports = {};
__export(main_exports, {
  AgCharts: () => import_ag_charts_community167.AgCharts,
  time: () => import_ag_charts_community167.time
});
module.exports = __toCommonJS(main_exports);
var import_ag_charts_community167 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/setup.ts
var import_ag_charts_community166 = require("ag-charts-community");

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

// packages/ag-charts-enterprise/src/axes/angle-number/angleAxisInterval.ts
var import_ag_charts_community = require("ag-charts-community");
var { OR, POSITIVE_NUMBER, NAN, AxisInterval, Validate } = import_ag_charts_community._ModuleSupport;
var AngleAxisInterval = class extends AxisInterval {
  constructor() {
    super(...arguments);
    this.minSpacing = NaN;
  }
};
__decorateClass([
  Validate(OR(POSITIVE_NUMBER, NAN))
], AngleAxisInterval.prototype, "minSpacing", 2);

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
  POSITIVE_NUMBER: POSITIVE_NUMBER2,
  RATIO,
  STRING,
  UNION,
  AND,
  Validate: Validate2,
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
  Validate2(BOOLEAN, { optional: true })
], PolarCrossLineLabel.prototype, "enabled", 2);
__decorateClass([
  Validate2(STRING, { optional: true })
], PolarCrossLineLabel.prototype, "text", 2);
__decorateClass([
  Validate2(FONT_STYLE, { optional: true })
], PolarCrossLineLabel.prototype, "fontStyle", 2);
__decorateClass([
  Validate2(FONT_WEIGHT, { optional: true })
], PolarCrossLineLabel.prototype, "fontWeight", 2);
__decorateClass([
  Validate2(POSITIVE_NUMBER2)
], PolarCrossLineLabel.prototype, "fontSize", 2);
__decorateClass([
  Validate2(STRING)
], PolarCrossLineLabel.prototype, "fontFamily", 2);
__decorateClass([
  Validate2(NUMBER)
], PolarCrossLineLabel.prototype, "padding", 2);
__decorateClass([
  Validate2(COLOR_STRING, { optional: true })
], PolarCrossLineLabel.prototype, "color", 2);
__decorateClass([
  Validate2(BOOLEAN, { optional: true })
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
    node.fill = this.fill;
    node.fillOpacity = this.fillOpacity ?? 1;
    node.stroke = this.stroke;
    node.strokeOpacity = this.strokeOpacity ?? 1;
    node.strokeWidth = this.strokeWidth ?? 1;
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
  Validate2(BOOLEAN, { optional: true })
], _PolarCrossLine.prototype, "enabled", 2);
__decorateClass([
  Validate2(UNION(["range", "line"], "a crossLine type"), { optional: true })
], _PolarCrossLine.prototype, "type", 2);
__decorateClass([
  Validate2(AND(MATCHING_CROSSLINE_TYPE("range"), ARRAY.restrict({ length: 2 })), {
    optional: true
  })
], _PolarCrossLine.prototype, "range", 2);
__decorateClass([
  Validate2(MATCHING_CROSSLINE_TYPE("value"), { optional: true })
], _PolarCrossLine.prototype, "value", 2);
__decorateClass([
  Validate2(COLOR_STRING, { optional: true })
], _PolarCrossLine.prototype, "fill", 2);
__decorateClass([
  Validate2(RATIO, { optional: true })
], _PolarCrossLine.prototype, "fillOpacity", 2);
__decorateClass([
  Validate2(COLOR_STRING, { optional: true })
], _PolarCrossLine.prototype, "stroke", 2);
__decorateClass([
  Validate2(NUMBER, { optional: true })
], _PolarCrossLine.prototype, "strokeWidth", 2);
__decorateClass([
  Validate2(RATIO, { optional: true })
], _PolarCrossLine.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate2(LINE_DASH, { optional: true })
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
    const { scale, type, value, lineNode: line } = this;
    let angle;
    if (!visible || type !== "line" || !scale || isNaN(angle = scale.convert(value))) {
      line.visible = false;
      return;
    }
    const { axisInnerRadius, axisOuterRadius } = this;
    line.visible = true;
    line.stroke = this.stroke;
    line.strokeOpacity = this.strokeOpacity ?? 1;
    line.strokeWidth = this.strokeWidth ?? 1;
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
    const { polygonNode: polygon, range: range2, scale, shape, type } = this;
    let ticks;
    if (!visible || type !== "range" || shape !== "polygon" || !scale || !range2 || !(ticks = scale.ticks?.())) {
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
    const { sectorNode: sector, range: range2, scale, shape, type } = this;
    if (!visible || type !== "range" || shape !== "circle" || !scale || !range2) {
      sector.visible = false;
      return;
    }
    const { axisInnerRadius, axisOuterRadius } = this;
    const angles = range2.map((value) => scale.convert(value));
    const step = scale.step ?? 0;
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
      const ticks = scale.ticks?.() ?? [];
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
  Validate: Validate3
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
  Validate3(UNION2(["fixed", "parallel", "perpendicular"], "a label orientation"))
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
    node.stroke = this.line.stroke;
    node.strokeWidth = this.line.width;
    node.fill = void 0;
  }
  getAxisLinePoints() {
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
      const angles = (scale.ticks?.() ?? []).map((value) => scale.convert(value));
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
      line.stroke = tick.stroke;
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
        text = callbackCache.call(label.formatter, { value, index }) ?? "";
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
          text = Text2.wrap(text, availWidth, Infinity, label, "never");
          if (text === "\u2026") {
            text = "";
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
    let rotation = toRadians(this.label.rotation ?? 0);
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
    this.crossLines?.forEach((crossLine) => {
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
  Validate3(NUMBER2.restrict({ min: 0, max: 360 }))
], AngleAxis.prototype, "startAngle", 2);
__decorateClass([
  Validate3(AND2(NUMBER2.restrict({ min: 0, max: 720 }), GREATER_THAN("startAngle")), { optional: true })
], AngleAxis.prototype, "endAngle", 2);

// packages/ag-charts-enterprise/src/axes/angle-category/angleCategoryAxis.ts
var { RATIO: RATIO2, OBJECT, Validate: Validate4 } = import_ag_charts_community5._ModuleSupport;
var { BandScale } = import_ag_charts_community5._Scale;
var { isNumberEqual: isNumberEqual3 } = import_ag_charts_community5._Util;
var AngleCategoryAxis = class extends AngleAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new BandScale());
    this.groupPaddingInner = 0;
    this.paddingInner = 0;
    this.interval = new AngleAxisInterval();
  }
  generateAngleTicks() {
    const { scale, gridLength: radius } = this;
    const { values, minSpacing } = this.interval;
    const ticks = values ?? scale.ticks() ?? [];
    if (ticks.length < 2 || isNaN(minSpacing)) {
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
      const spacing = Math.sqrt((nextX - startX) ** 2 + (nextY - startY) ** 2);
      if (spacing > minSpacing) {
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
  Validate4(RATIO2)
], AngleCategoryAxis.prototype, "groupPaddingInner", 2);
__decorateClass([
  Validate4(RATIO2)
], AngleCategoryAxis.prototype, "paddingInner", 2);
__decorateClass([
  Validate4(OBJECT)
], AngleCategoryAxis.prototype, "interval", 2);

// packages/ag-charts-enterprise/src/axes/angle-category/angleCategoryAxisModule.ts
var AngleCategoryAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "angle-category",
  instanceConstructor: AngleCategoryAxis
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
    if (!this.domain || this.domain.length < 2 || this.domain.some((d) => !isFinite(d)) || this.arcLength <= 0) {
      return [];
    }
    this.refresh();
    const { interval } = this;
    const [d0, d1] = this.getDomain();
    if (interval) {
      const step2 = Math.abs(interval);
      const availableRange = this.getPixelRange();
      if (!isDenseInterval((d1 - d0) / step2, availableRange)) {
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
var { AND: AND3, Default, GREATER_THAN: GREATER_THAN2, LESS_THAN, NUMBER_OR_NAN, OBJECT: OBJECT2, Validate: Validate5 } = import_ag_charts_community7._ModuleSupport;
var { angleBetween: angleBetween2, isNumberEqual: isNumberEqual5, normalisedExtentWithMetadata } = import_ag_charts_community7._Util;
var AngleNumberAxis = class extends AngleAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new LinearAngleScale());
    this.shape = "circle";
    this.min = NaN;
    this.max = NaN;
    this.interval = new AngleAxisInterval();
  }
  normaliseDataDomain(d) {
    const { min, max } = this;
    const { extent: extent6, clipped } = normalisedExtentWithMetadata(d, min, max);
    return { domain: extent6, clipped };
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
    const arcLength = this.getRangeArcLength();
    const { scale, range: requestedRange } = this;
    const { values, minSpacing, maxSpacing } = this.interval;
    const minTicksCount = maxSpacing ? Math.floor(arcLength / maxSpacing) : 1;
    const maxTicksCount = minSpacing ? Math.floor(arcLength / minSpacing) : Infinity;
    const preferredTicksCount = Math.floor(4 / Math.PI * Math.abs(requestedRange[0] - requestedRange[1]));
    scale.tickCount = Math.max(minTicksCount, Math.min(maxTicksCount, preferredTicksCount));
    scale.minTickCount = minTicksCount;
    scale.maxTickCount = maxTicksCount;
    scale.arcLength = arcLength;
    const ticks = values ?? scale.ticks();
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
  Validate5(AND3(NUMBER_OR_NAN, LESS_THAN("max"))),
  Default(NaN)
], AngleNumberAxis.prototype, "min", 2);
__decorateClass([
  Validate5(AND3(NUMBER_OR_NAN, GREATER_THAN2("min"))),
  Default(NaN)
], AngleNumberAxis.prototype, "max", 2);
__decorateClass([
  Validate5(OBJECT2)
], AngleNumberAxis.prototype, "interval", 2);

// packages/ag-charts-enterprise/src/axes/angle-number/angleNumberAxisModule.ts
var AngleNumberAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "angle-number",
  instanceConstructor: AngleNumberAxis
};

// packages/ag-charts-enterprise/src/axes/ordinal/ordinalTimeAxis.ts
var import_ag_charts_community8 = require("ag-charts-community");
var { OrdinalTimeScale } = import_ag_charts_community8._Scale;
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
  onFormatChange(ticks, fractionDigits, domain, format) {
    if (format) {
      super.onFormatChange(ticks, fractionDigits, domain, format);
    } else {
      this.labelFormatter = this.scale.tickFormat({ ticks, domain });
    }
  }
};
OrdinalTimeAxis.className = "OrdinalTimeAxis";
OrdinalTimeAxis.type = "ordinal-time";

// packages/ag-charts-enterprise/src/axes/ordinal/ordinalTimeAxisModule.ts
var OrdinalTimeAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "ordinal-time",
  instanceConstructor: OrdinalTimeAxis
};

// packages/ag-charts-enterprise/src/axes/radius-category/radiusCategoryAxis.ts
var import_ag_charts_community11 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/axes/radius/radiusAxis.ts
var import_ag_charts_community10 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/axes/polar-crosslines/radiusCrossLine.ts
var import_ag_charts_community9 = require("ag-charts-community");
var { ChartAxisDirection: ChartAxisDirection4, Validate: Validate6, DEGREE, validateCrossLineValues: validateCrossLineValues2 } = import_ag_charts_community9._ModuleSupport;
var { Path: Path3, Sector: Sector2, Text: Text3 } = import_ag_charts_community9._Scene;
var { normalizeAngle360: normalizeAngle3603, toRadians: toRadians2, isNumberEqual: isNumberEqual6 } = import_ag_charts_community9._Util;
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
    if (type === "line" && scale instanceof import_ag_charts_community9._Scale.BandScale) {
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
      const bandwidth = Math.abs(scale?.bandwidth ?? 0);
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
    sector.innerRadius = import_ag_charts_community9._Util.clamp(axisInnerRadius, innerRadius + padding, axisOuterRadius);
    sector.outerRadius = import_ag_charts_community9._Util.clamp(axisInnerRadius, outerRadius - padding, axisOuterRadius);
    this.setSectorNodeProps(sector);
  }
  updateLabelNode(visible) {
    const { innerRadius, label, labelNode: node, scale, shape, type } = this;
    if (!visible || label.enabled === false || !label.text || !scale) {
      node.visible = false;
      return;
    }
    const angle = normalizeAngle3603(toRadians2((label.positionAngle ?? 0) - 90));
    const isBottomSide = (isNumberEqual6(angle, 0) || angle > 0) && angle < Math.PI;
    const rotation = isBottomSide ? angle - Math.PI / 2 : angle + Math.PI / 2;
    let distance = 0;
    const angles = this.gridAngles ?? [];
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
    const { scale } = this;
    if (!scale)
      return 0;
    const bandwidth = Math.abs(scale.bandwidth ?? 0);
    const step = Math.abs(scale.step ?? 0);
    return scale instanceof import_ag_charts_community9._Scale.BandScale ? (step - bandwidth) / 2 : 0;
  }
};
_RadiusCrossLine.className = "RadiusCrossLine";
var RadiusCrossLine = _RadiusCrossLine;

// packages/ag-charts-enterprise/src/axes/radius/radiusAxis.ts
var { assignJsonApplyConstructedArray: assignJsonApplyConstructedArray2, ChartAxisDirection: ChartAxisDirection5, Default: Default2, Layers: Layers2, DEGREE: DEGREE2, BOOLEAN: BOOLEAN2, Validate: Validate7 } = import_ag_charts_community10._ModuleSupport;
var { Caption, Group: Group2, Path: Path4, Selection } = import_ag_charts_community10._Scene;
var { isNumberEqual: isNumberEqual7, normalizeAngle360: normalizeAngle3604, toRadians: toRadians3 } = import_ag_charts_community10._Util;
var RadiusAxisLabel = class extends import_ag_charts_community10._ModuleSupport.AxisLabel {
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
var RadiusAxis = class extends import_ag_charts_community10._ModuleSupport.PolarAxis {
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
    const [startAngle, endAngle] = this.gridRange ?? [0, 2 * Math.PI];
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
    const identityFormatter = (params) => params.defaultValue;
    const {
      title,
      _titleCaption,
      range: requestedRange,
      moduleCtx: { callbackCache }
    } = this;
    const { formatter = identityFormatter } = this.title ?? {};
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
  updateCrossLines() {
    this.crossLines?.forEach((crossLine) => {
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
  Default2(0)
], RadiusAxis.prototype, "positionAngle", 2);

// packages/ag-charts-enterprise/src/axes/radius-category/radiusCategoryAxis.ts
var { RATIO: RATIO3, ProxyPropertyOnWrite, Validate: Validate8 } = import_ag_charts_community11._ModuleSupport;
var { BandScale: BandScale2 } = import_ag_charts_community11._Scale;
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
    const { scale, innerRadiusRatio } = this;
    const maxRadius = scale.range[0];
    const minRadius = maxRadius * innerRadiusRatio;
    if (scale instanceof BandScale2) {
      const ticks = scale.ticks();
      const index = ticks.length - 1 - ticks.indexOf(tickDatum.tickId);
      return index === 0 ? minRadius : scale.inset + scale.step * (index - 0.5) + scale.bandwidth / 2;
    } else {
      const tickRange = (maxRadius - minRadius) / scale.domain.length;
      return maxRadius - tickDatum.translationY + minRadius - tickRange / 2;
    }
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
  instanceConstructor: RadiusCategoryAxis
};

// packages/ag-charts-enterprise/src/axes/radius-number/radiusNumberAxis.ts
var import_ag_charts_community12 = require("ag-charts-community");
var { AND: AND4, Default: Default3, GREATER_THAN: GREATER_THAN3, LESS_THAN: LESS_THAN2, NUMBER_OR_NAN: NUMBER_OR_NAN2, Validate: Validate9 } = import_ag_charts_community12._ModuleSupport;
var { LinearScale: LinearScale2 } = import_ag_charts_community12._Scale;
var { normalisedExtentWithMetadata: normalisedExtentWithMetadata2 } = import_ag_charts_community12._Util;
var RadiusNumberAxis = class extends RadiusAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new LinearScale2());
    this.shape = "polygon";
    this.min = NaN;
    this.max = NaN;
  }
  prepareTickData(data) {
    const { scale } = this;
    const domainTop = scale.getDomain?.()[1];
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
  Default3(NaN)
], RadiusNumberAxis.prototype, "min", 2);
__decorateClass([
  Validate9(AND4(NUMBER_OR_NAN2, GREATER_THAN3("min"))),
  Default3(NaN)
], RadiusNumberAxis.prototype, "max", 2);

// packages/ag-charts-enterprise/src/axes/radius-number/radiusNumberAxisModule.ts
var RadiusNumberAxisModule = {
  type: "axis",
  optionsKey: "axes[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radius-number",
  instanceConstructor: RadiusNumberAxis
};

// packages/ag-charts-enterprise/src/features/animation/animation.ts
var import_ag_charts_community13 = require("ag-charts-community");
var { BOOLEAN: BOOLEAN3, POSITIVE_NUMBER: POSITIVE_NUMBER3, ObserveChanges, Validate: Validate10 } = import_ag_charts_community13._ModuleSupport;
var Animation = class extends import_ag_charts_community13._ModuleSupport.BaseModuleInstance {
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
  Validate10(POSITIVE_NUMBER3, { optional: true })
], Animation.prototype, "duration", 2);

// packages/ag-charts-enterprise/src/features/animation/animationModule.ts
var AnimationModule = {
  type: "root",
  optionsKey: "animation",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy", "topology", "flow-proportion"],
  instanceConstructor: Animation,
  themeTemplate: {
    animation: {
      enabled: true
    }
  }
};

// packages/ag-charts-enterprise/src/features/annotations/annotationsModule.ts
var import_ag_charts_community39 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/annotations/annotations.ts
var import_ag_charts_community38 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/utils/position.ts
var import_ag_charts_community14 = require("ag-charts-community");
var { ChartAxisDirection: ChartAxisDirection6 } = import_ag_charts_community14._ModuleSupport;
function calculateAxisLabelPosition({
  x,
  y,
  labelBBox,
  bounds,
  axisPosition,
  axisDirection,
  padding
}) {
  let coordinates;
  if (axisDirection === ChartAxisDirection6.X) {
    const alignmentShift = 4;
    const xOffset = -labelBBox.width / 2;
    const yOffset = axisPosition === "bottom" ? -alignmentShift : -labelBBox.height + alignmentShift;
    const fixedY = axisPosition === "bottom" ? bounds.y + bounds.height + padding : bounds.y - padding;
    coordinates = {
      x: x + xOffset,
      y: fixedY + yOffset
    };
  } else {
    const alignmentShift = 8;
    const yOffset = -labelBBox.height / 2;
    const xOffset = axisPosition === "right" ? -alignmentShift : -labelBBox.width + alignmentShift;
    const fixedX = axisPosition === "right" ? bounds.x + bounds.width + padding : bounds.x - padding;
    coordinates = {
      x: fixedX + xOffset,
      y: y + yOffset
    };
  }
  return coordinates;
}
function buildBounds(rect, axisPosition, padding) {
  const bounds = rect.clone();
  bounds.x += axisPosition === "left" ? -padding : 0;
  bounds.y += axisPosition === "top" ? -padding : 0;
  bounds.width += axisPosition === "left" || axisPosition === "right" ? padding : 0;
  bounds.height += axisPosition === "top" || axisPosition === "bottom" ? padding : 0;
  return bounds;
}

// packages/ag-charts-enterprise/src/features/color-picker/colorPicker.ts
var import_ag_charts_community15 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/color-picker/colorPickerStyles.css
var colorPickerStyles_default = `.ag-charts-color-picker{position:absolute;display:flex;flex-direction:column;width:190px;padding:8px;border:var(--ag-charts-toolbar-border);color:var(--ag-charts-toolbar-foreground-color);background:var(--ag-charts-toolbar-background-color);border-radius:4px;z-index:99999;--h:0;--s:0;--v:0;--a:0;--color:#000;--color-a:#000;--thumb-size:18px;--inner-width:172px;--track-height:12px;--palette-height:136px;--checker:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect x="0" y="0" width="4" height="4" fill="%23fff"/><path d="M0 0H2V4H4V2H0Z" fill="%23b2b2b2"/></svg>')}.ag-charts-color-picker__palette{position:relative;width:100%;height:var(--palette-height);margin-bottom:8px;background:linear-gradient(to bottom,#0000,#000),linear-gradient(to right,#fff,#fff0) hsl(var(--h),100%,50%);border-radius:6px;box-shadow:inset 0 0 0 1px #0003}.ag-charts-color-picker__palette::after{content:'';position:absolute;display:block;top:calc(var(--thumb-size) * -0.5 + (1 - var(--v)) * 100%);left:calc(var(--thumb-size) * -0.5 + var(--s) * 100%);background:var(--color);width:var(--thumb-size);height:var(--thumb-size);border-radius:99px;box-shadow:var(--box-shadow);--box-shadow:inset 0 0 0 3px white,inset 0 0 1px 3px #0006,0 0 5px #00000038}.ag-charts-color-picker__palette:focus-visible::after{outline:var(--ag-charts-focus-border);box-shadow:var(--box-shadow),0 0 0 2px #fff8,var(--ag-charts-focus-border-shadow)}.ag-charts-color-picker__hue-input,
.ag-charts-color-picker__alpha-input{-webkit-appearance:none;display:block;position:relative;padding:0;margin:0 calc(var(--inset) * -1);border:0;height:var(--thumb-size);width:auto;background:transparent;--inset:calc((var(--thumb-size) - var(--track-height)) / 2)}.ag-charts-color-picker__hue-input::-webkit-slider-thumb,
.ag-charts-color-picker__alpha-input::-webkit-slider-thumb{-webkit-appearance:none;width:var(--thumb-size);height:var(--thumb-size);border-radius:99px;box-shadow:var(--box-shadow);--box-shadow:inset 0 0 0 3px white,inset 0 0 1px 3px #0006,0 0 5px #00000038;transform:translate3d(0,0,0)}.ag-charts-color-picker__hue-input::-webkit-slider-thumb{background:hsl(var(--h),100%,50%)}.ag-charts-color-picker__alpha-input::-webkit-slider-thumb{background:transparent}.ag-charts-color-picker__alpha-input--opaque::-webkit-slider-thumb{background:var(--color)}.ag-charts-color-picker__hue-input:focus-visible::-webkit-slider-thumb,
.ag-charts-color-picker__alpha-input:focus-visible::-webkit-slider-thumb{outline:var(--ag-charts-focus-border);box-shadow:var(--box-shadow),var(--ag-charts-focus-border-shadow)}.ag-charts-color-picker__hue-input::before,
.ag-charts-color-picker__alpha-input::before{position:absolute;content:'';display:block;top:calc(50% - var(--track-height) / 2);left:var(--inset);right:var(--inset);height:var(--track-height);border-radius:99px;box-shadow:inset 0 0 0 1px #0003}.ag-charts-color-picker__hue-input{margin-bottom:4px}.ag-charts-color-picker__hue-input::before{background:linear-gradient(to right,#f00,#f00 calc((100% - var(--track-height)) * 0 / 6 + var(--track-height) / 2),#ff0 calc((100% - var(--track-height)) * 1 / 6 + var(--track-height) / 2),#0f0 calc((100% - var(--track-height)) * 2 / 6 + var(--track-height) / 2),#0ff calc((100% - var(--track-height)) * 3 / 6 + var(--track-height) / 2),#00f calc((100% - var(--track-height)) * 4 / 6 + var(--track-height) / 2),#f0f calc((100% - var(--track-height)) * 5 / 6 + var(--track-height) / 2),#f00 calc((100% - var(--track-height)) * 6 / 6 + var(--track-height) / 2))}.ag-charts-color-picker__alpha-input{margin-bottom:7px}.ag-charts-color-picker__alpha-input::before{background:linear-gradient(to right,transparent,var(--color)),var(--checker) top left /4px 4px}.ag-charts-color-picker__color-field{display:flex;border:var(--ag-charts-border);background:var(--ag-charts-background-color);border-radius:4px;overflow:hidden}.ag-charts-color-picker__color-field:has(:focus-visible){border-color:var(--ag-charts-active-color);box-shadow:var(--ag-charts-focus-border-shadow)}.ag-charts-color-picker__color-label{width:16px;height:16px;margin:7px 0px 7px 7px;color:transparent;background:linear-gradient(to right,var(--color-a),var(--color-a)),var(--checker) top left /4px 4px;border-radius:2px;box-shadow:inset 0 0 0 1px #0003}.ag-charts-color-picker__color-input{flex:1;min-width:0;padding:7px 7px 7px 8px;border:0;margin:0;color:inherit;background:transparent;font-variant:tabular-nums}.ag-charts-color-picker__color-input:focus-visible{border:none;outline:none}`;

// packages/ag-charts-enterprise/src/features/color-picker/colorPickerTemplate.html
var colorPickerTemplate_default = '<div class="ag-charts-color-picker"><div class="ag-charts-color-picker__palette" tabindex="0"></div><input class="ag-charts-color-picker__hue-input" tabindex="0" type="range" min="0" max="360" value="0"> <input class="ag-charts-color-picker__alpha-input" tabindex="0" type="range" min="0" max="1" value="1" step="0.01"> <label class="ag-charts-color-picker__color-field"><span class="ag-charts-color-picker__color-label">Color</span> <input class="ag-charts-color-picker__color-input" tabindex="0" value="#000"></label></div>';

// packages/ag-charts-enterprise/src/features/color-picker/colorPicker.ts
var { clamp, createElement } = import_ag_charts_community15._ModuleSupport;
var { Color } = import_ag_charts_community15._Util;
var moduleId = "color-picker";
var canvasOverlay = "canvas-overlay";
var getHsva = (input) => {
  try {
    const color = Color.fromString(input);
    const [h, s, v] = color.toHSB();
    return [h, s, v, color.a];
  } catch {
    return;
  }
};
var ColorPicker = class extends import_ag_charts_community15._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    ctx.domManager.addStyles(moduleId, colorPickerStyles_default);
    this.element = ctx.domManager.addChild(canvasOverlay, moduleId);
    this.destroyFns.push(() => ctx.domManager.removeChild(canvasOverlay, moduleId));
  }
  show(opts) {
    let [h, s, v, a] = getHsva(opts.color ?? "#f00") ?? [0, 1, 0.5, 1];
    const colorPickerContainer = createElement("div");
    colorPickerContainer.innerHTML = colorPickerTemplate_default;
    this.element.replaceChildren(colorPickerContainer);
    const colorPicker = colorPickerContainer.firstElementChild;
    const paletteInput = colorPicker.querySelector(".ag-charts-color-picker__palette");
    const hueInput = colorPicker.querySelector(".ag-charts-color-picker__hue-input");
    const alphaInput = colorPicker.querySelector(".ag-charts-color-picker__alpha-input");
    const colorInput = colorPicker.querySelector(".ag-charts-color-picker__color-input");
    if (this.anchor) {
      this.setAnchor(this.anchor, this.fallbackAnchor);
    }
    const update = () => {
      const color = Color.fromHSB(h, s, v, a);
      const colorString = color.toHexString();
      colorPicker.style.setProperty("--h", `${h}`);
      colorPicker.style.setProperty("--s", `${s}`);
      colorPicker.style.setProperty("--v", `${v}`);
      colorPicker.style.setProperty("--a", `${a}`);
      colorPicker.style.setProperty("--color", colorString.slice(0, 7));
      colorPicker.style.setProperty("--color-a", colorString);
      hueInput.value = `${h}`;
      alphaInput.value = `${a}`;
      alphaInput.classList.toggle("ag-charts-color-picker__alpha-input--opaque", a === 1);
      if (document.activeElement !== colorInput) {
        colorInput.value = colorString.toUpperCase();
      }
      opts.onChange?.(colorString);
    };
    update();
    const beginPaletteInteraction = (e) => {
      e.preventDefault();
      const currentTarget = e.currentTarget;
      currentTarget.focus();
      const rect = currentTarget.getBoundingClientRect();
      const mouseMove = ({ pageX, pageY }) => {
        s = Math.min(Math.max((pageX - rect.left) / rect.width, 0), 1);
        v = 1 - Math.min(Math.max((pageY - rect.top) / rect.height, 0), 1);
        update();
      };
      mouseMove(e);
      window.addEventListener("mousemove", mouseMove);
      window.addEventListener("mouseup", () => window.removeEventListener("mousemove", mouseMove), {
        once: true
      });
    };
    colorPicker.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    colorPicker.addEventListener("keydown", (e) => {
      e.stopPropagation();
      switch (e.key) {
        case "Enter":
        case "Escape":
          opts.onClose?.();
          break;
        default:
          return;
      }
      e.preventDefault();
    });
    paletteInput.addEventListener("mousedown", beginPaletteInteraction);
    paletteInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        s = Math.min(Math.max(s - 0.01), 1);
      } else if (e.key === "ArrowRight") {
        s = Math.min(Math.max(s + 0.01), 1);
      } else if (e.key === "ArrowUp") {
        v = Math.min(Math.max(v + 0.01), 1);
      } else if (e.key === "ArrowDown") {
        v = Math.min(Math.max(v - 0.01), 1);
      } else {
        return;
      }
      e.preventDefault();
      update();
    });
    hueInput.addEventListener("input", (e) => {
      h = e.currentTarget.valueAsNumber ?? 0;
      update();
    });
    alphaInput.addEventListener("input", (e) => {
      a = e.currentTarget.valueAsNumber ?? 0;
      update();
    });
    colorInput.addEventListener("input", (e) => {
      const hsva = getHsva(e.currentTarget.value);
      if (hsva == null)
        return;
      [h, s, v, a] = hsva;
      update();
    });
    colorInput.addEventListener("blur", () => update());
    colorInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
        update();
      }
    });
  }
  setAnchor(anchor, fallbackAnchor) {
    this.anchor = anchor;
    this.fallbackAnchor = fallbackAnchor;
    const colorPicker = this.element.firstElementChild?.firstElementChild;
    if (!colorPicker)
      return;
    this.updatePosition(colorPicker, anchor.x, anchor.y);
    this.repositionWithinBounds(colorPicker, anchor, fallbackAnchor);
  }
  hide() {
    this.element.replaceChildren();
  }
  isChildElement(element) {
    return this.ctx.domManager.isManagedChildDOMElement(element, canvasOverlay, moduleId);
  }
  updatePosition(colorPicker, x, y) {
    colorPicker.style.setProperty("top", "unset");
    colorPicker.style.setProperty("bottom", "unset");
    colorPicker.style.setProperty("left", `${x}px`);
    colorPicker.style.setProperty("top", `${y}px`);
  }
  repositionWithinBounds(colorPicker, anchor, fallbackAnchor) {
    const canvasRect = this.ctx.domManager.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = colorPicker;
    let x = clamp(0, anchor.x, canvasRect.width - width);
    let y = clamp(0, anchor.y, canvasRect.height - height);
    if (x !== anchor.x && fallbackAnchor?.x != null) {
      x = clamp(0, fallbackAnchor.x - width, canvasRect.width - width);
    }
    if (y !== anchor.y && fallbackAnchor?.y != null) {
      y = clamp(0, fallbackAnchor.y - height, canvasRect.height - height);
    }
    this.updatePosition(colorPicker, x, y);
  }
};

// packages/ag-charts-enterprise/src/features/annotations/annotationTypes.ts
var import_ag_charts_community16 = require("ag-charts-community");
var AnnotationType = /* @__PURE__ */ ((AnnotationType2) => {
  AnnotationType2["Line"] = "line";
  AnnotationType2["DisjointChannel"] = "disjoint-channel";
  AnnotationType2["ParallelChannel"] = "parallel-channel";
  AnnotationType2["HorizontalLine"] = "horizontal-line";
  AnnotationType2["VerticalLine"] = "vertical-line";
  return AnnotationType2;
})(AnnotationType || {});
var ANNOTATION_TYPES = Object.values(AnnotationType);
var ANNOTATION_BUTTONS = [
  "line" /* Line */,
  "disjoint-channel" /* DisjointChannel */,
  "parallel-channel" /* ParallelChannel */,
  "horizontal-line" /* HorizontalLine */,
  "vertical-line" /* VerticalLine */
];
function stringToAnnotationType(value) {
  switch (value) {
    case "line":
      return "line" /* Line */;
    case "horizontal-line":
      return "horizontal-line" /* HorizontalLine */;
    case "vertical-line":
      return "vertical-line" /* VerticalLine */;
    case "disjoint-channel":
      return "disjoint-channel" /* DisjointChannel */;
    case "parallel-channel":
      return "parallel-channel" /* ParallelChannel */;
  }
}

// packages/ag-charts-enterprise/src/features/annotations/annotationUtils.ts
var import_ag_charts_community17 = require("ag-charts-community");
var { Logger } = import_ag_charts_community17._Util;
function validateDatumLine(context, datum, warningPrefix) {
  let valid = true;
  valid && (valid = validateDatumPoint(context, datum.start, warningPrefix && `${warningPrefix}[start] `));
  valid && (valid = validateDatumPoint(context, datum.end, warningPrefix && `${warningPrefix}[end] `));
  return valid;
}
function validateDatumValue(context, datum, warningPrefix) {
  const axis = datum.direction === "horizontal" ? context.yAxis : context.xAxis;
  const valid = validateDatumPointDirection(datum.value, axis);
  if (!valid && warningPrefix) {
    Logger.warnOnce(`${warningPrefix}is outside the axis domain, ignoring. - value: [${datum.value}]]`);
  }
  return valid;
}
function validateDatumPoint(context, point, warningPrefix) {
  if (point.x == null || point.y == null) {
    if (warningPrefix) {
      Logger.warnOnce(`${warningPrefix}requires both an [x] and [y] property, ignoring.`);
    }
    return false;
  }
  const validX = validateDatumPointDirection(point.x, context.xAxis);
  const validY = validateDatumPointDirection(point.y, context.yAxis);
  if (!validX || !validY) {
    let text = "x & y domains";
    if (validX)
      text = "y domain";
    if (validY)
      text = "x domain";
    if (warningPrefix) {
      Logger.warnOnce(`${warningPrefix}is outside the ${text}, ignoring. - x: [${point.x}], y: ${point.y}]`);
    }
    return false;
  }
  return true;
}
function validateDatumPointDirection(value, context) {
  const domain = context.scaleDomain();
  if (domain && context.continuous) {
    return value >= domain[0] && value <= domain.at(-1);
  }
  return true;
}
function convertLine(datum, context) {
  if (datum.start == null || datum.end == null)
    return;
  const start = convertPoint(datum.start, context);
  const end = convertPoint(datum.end, context);
  if (start == null || end == null)
    return;
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}
function convertPoint(point, context) {
  const x = convert(point.x, context.xAxis);
  const y = convert(point.y, context.yAxis);
  return { x, y };
}
function convert(p, context) {
  if (p == null)
    return 0;
  const halfBandwidth = (context.scaleBandwidth() ?? 0) / 2;
  return context.scaleConvert(p) + halfBandwidth;
}
function invertCoords(coords, context) {
  const x = invert(coords.x, context.xAxis);
  const y = invert(coords.y, context.yAxis);
  return { x, y };
}
function invert(n, context) {
  const halfBandwidth = (context.scaleBandwidth() ?? 0) / 2;
  if (context.continuous) {
    return context.scaleInvert(n - halfBandwidth);
  }
  return context.scaleInvertNearest(n - halfBandwidth);
}
function calculateAxisLabelPadding(axisLayout) {
  return axisLayout.gridPadding + axisLayout.seriesAreaPadding + axisLayout.tickSize + axisLayout.label.padding;
}

// packages/ag-charts-enterprise/src/features/annotations/axisButton.ts
var import_ag_charts_community18 = require("ag-charts-community");
var { BaseModuleInstance, InteractionState, Validate: Validate11, BOOLEAN: BOOLEAN4, createElement: createElement2, REGIONS, ChartAxisDirection: ChartAxisDirection7 } = import_ag_charts_community18._ModuleSupport;
var DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS = `ag-charts-annotations__axis-button`;
var AxisButton = class extends BaseModuleInstance {
  constructor(ctx, axisCtx, onButtonClick, seriesRect) {
    super();
    this.ctx = ctx;
    this.axisCtx = axisCtx;
    this.onButtonClick = onButtonClick;
    this.seriesRect = seriesRect;
    this.enabled = true;
    this.snap = false;
    this.padding = 0;
    const { button, wrapper } = this.setup();
    this.wrapper = wrapper;
    this.button = button;
    this.toggleVisibility(false);
    this.updateButtonElement();
    this.snap = axisCtx.scaleBandwidth() > 0;
    const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
    const mouseMoveStates = InteractionState.Default | InteractionState.Annotations;
    this.destroyFns.push(
      seriesRegion.addListener("hover", (event) => this.onMouseMove(event), mouseMoveStates),
      seriesRegion.addListener("drag", (event) => this.onMouseMove(event), mouseMoveStates),
      seriesRegion.addListener("leave", () => this.onLeave()),
      () => this.destroyElements(),
      () => this.wrapper.remove(),
      () => this.button.remove()
    );
  }
  update(seriesRect, padding) {
    this.seriesRect = seriesRect;
    this.padding = padding;
  }
  setup() {
    const wrapper = this.ctx.domManager.addChild(
      "canvas-overlay",
      `${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-${this.axisCtx.axisId}`
    );
    wrapper.classList.add(`${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-wrapper`);
    const button = createElement2("button");
    button.classList.add(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
    wrapper.appendChild(button);
    return {
      wrapper,
      button
    };
  }
  destroyElements() {
    this.ctx.domManager.removeChild("canvas-overlay", DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
  }
  onMouseMove(event) {
    if (!this.enabled)
      return;
    this.toggleVisibility(true);
    const buttonCoords = this.getButtonCoordinates({ x: event.offsetX, y: event.offsetY });
    this.coords = this.getAxisCoordinates(buttonCoords);
    this.updatePosition(buttonCoords);
  }
  onLeave() {
    this.toggleVisibility(false);
  }
  getButtonCoordinates({ x, y }) {
    const {
      axisCtx: { direction, position },
      seriesRect,
      snap,
      axisCtx,
      padding
    } = this;
    const { clientWidth: buttonWidth, clientHeight: buttonHeight } = this.button;
    const [minY, maxY] = [seriesRect.y, seriesRect.y + seriesRect.height];
    const [minX, maxX] = [seriesRect.x, seriesRect.x + seriesRect.width];
    if (snap) {
      x = convert(invert(x - seriesRect.x, axisCtx), axisCtx) + seriesRect.x;
      y = convert(invert(y - seriesRect.y, axisCtx), axisCtx) + seriesRect.y;
    }
    if (direction === ChartAxisDirection7.X) {
      const crosshairLabelPadding = 5;
      const offset = buttonHeight - Math.max(0, padding - crosshairLabelPadding);
      x = x - buttonWidth / 2;
      y = position === "top" ? minY - buttonHeight + offset : maxY - offset;
    } else {
      const crosshairLabelPadding = 9;
      const offset = buttonWidth - Math.max(0, padding - crosshairLabelPadding);
      x = position === "left" ? minX - buttonWidth + offset : maxX - offset;
      y = y - buttonHeight / 2;
    }
    return { x, y };
  }
  getAxisCoordinates(coords) {
    const { seriesRect } = this;
    const { clientWidth: buttonWidth, clientHeight: buttonHeight } = this.button;
    const x = coords.x - seriesRect.x + buttonWidth / 2;
    const y = coords.y - seriesRect.y + buttonHeight / 2;
    return {
      x,
      y
    };
  }
  toggleVisibility(visible) {
    const { button } = this;
    if (button == null)
      return;
    const isVisible = this.enabled && visible;
    this.toggleClass("-hidden", !isVisible);
  }
  toggleClass(name, include) {
    this.wrapper.classList.toggle(`${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-wrapper-${name}`, include);
  }
  updatePosition({ x, y }) {
    this.wrapper.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
  updateButtonElement() {
    const { button } = this;
    button.onclick = import_ag_charts_community18._ModuleSupport.makeAccessibleClickListener(button, () => this.onButtonClick(this.coords));
    button.innerHTML = `<span class="ag-charts-icon-crossline-add-line ${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-icon"></span>`;
  }
};
__decorateClass([
  Validate11(BOOLEAN4)
], AxisButton.prototype, "enabled", 2);

// packages/ag-charts-enterprise/src/features/annotations/axisButton.css
var axisButton_default = ".ag-charts-annotations__axis-button-wrapper{position:absolute;left:0px;top:0px;user-select:none;font:16px Verdana,sans-serif;overflow:hidden;white-space:nowrap;z-index:var(--ag-charts-layer-annotations);box-sizing:border-box}.ag-charts-annotations__axis-button-wrapper--hidden{display:none}.ag-charts-annotations__axis-button{cursor:pointer;padding:2px;border:none;border-radius:2px;line-height:16px;background-color:var(--ag-charts-axis-label-background-color);color:var(--ag-charts-axis-label-color)}.ag-charts-annotations__axis-button-icon{height:1.2em;width:1.2em}.ag-charts-annotations__axis-button:hover{opacity:0.8;color:var(--ag-charts-axis-label-color)}";

// packages/ag-charts-enterprise/src/features/annotations/cross-line/crossLineProperties.ts
var import_ag_charts_community20 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/annotations/annotationProperties.ts
var import_ag_charts_community19 = require("ag-charts-community");
var {
  BOOLEAN: BOOLEAN5,
  COLOR_STRING: COLOR_STRING2,
  DATE,
  LINE_DASH: LINE_DASH2,
  NUMBER: NUMBER3,
  RATIO: RATIO4,
  STRING: STRING2,
  OBJECT: OBJECT3,
  FUNCTION,
  TEXT_ALIGN,
  FONT_STYLE: FONT_STYLE2,
  FONT_WEIGHT: FONT_WEIGHT2,
  POSITIVE_NUMBER: POSITIVE_NUMBER4,
  OR: OR2,
  UNION: UNION3,
  BaseProperties,
  Validate: Validate12
} = import_ag_charts_community19._ModuleSupport;
var AnnotationPoint = class extends BaseProperties {
};
__decorateClass([
  Validate12(OR2(STRING2, NUMBER3, DATE))
], AnnotationPoint.prototype, "x", 2);
__decorateClass([
  Validate12(NUMBER3)
], AnnotationPoint.prototype, "y", 2);
var ChannelAnnotationBackground = class extends Fill(BaseProperties) {
};
var ChannelAnnotationMiddle = class extends Stroke(LineDash(Visible(BaseProperties))) {
};
var AnnotationHandleProperties = class extends Stroke(LineDash(Fill(BaseProperties))) {
};
var AnnotationAxisLabelProperties = class extends Stroke(LineDash(Fill(Label(BaseProperties)))) {
  constructor() {
    super(...arguments);
    this.cornerRadius = 2;
  }
};
__decorateClass([
  Validate12(BOOLEAN5)
], AnnotationAxisLabelProperties.prototype, "enabled", 2);
__decorateClass([
  Validate12(POSITIVE_NUMBER4)
], AnnotationAxisLabelProperties.prototype, "cornerRadius", 2);
function Annotation(_type, Parent) {
  class AnnotationProperties extends Lockable(Visible(Parent)) {
    constructor() {
      super(...arguments);
      // A uuid is required, over the usual incrementing index, as annotations can be restored from external databases
      this.id = import_ag_charts_community19._Util.uuid();
    }
    isValidWithContext(_context, warningPrefix) {
      return super.isValid(warningPrefix);
    }
  }
  return AnnotationProperties;
}
function AnnotationLine(Parent) {
  class AnnotationLinePoints extends Parent {
    constructor() {
      super(...arguments);
      this.start = new AnnotationPoint();
      this.end = new AnnotationPoint();
    }
  }
  __decorateClass([
    Validate12(OBJECT3)
  ], AnnotationLinePoints.prototype, "start", 2);
  __decorateClass([
    Validate12(OBJECT3)
  ], AnnotationLinePoints.prototype, "end", 2);
  return AnnotationLinePoints;
}
function AnnotationCrossLine(Parent) {
  class AnnotationCrossLineOptions extends Parent {
  }
  __decorateClass([
    Validate12(OR2(STRING2, NUMBER3, DATE))
  ], AnnotationCrossLineOptions.prototype, "value", 2);
  return AnnotationCrossLineOptions;
}
function ChannelAnnotation(Parent) {
  class ChannelAnnotationStyles extends Parent {
    constructor() {
      super(...arguments);
      this.background = new ChannelAnnotationBackground();
    }
  }
  __decorateClass([
    Validate12(OBJECT3, { optional: true })
  ], ChannelAnnotationStyles.prototype, "background", 2);
  return ChannelAnnotationStyles;
}
function AnnotationHandle(Parent) {
  class WithAnnotationHandle extends Parent {
    constructor() {
      super(...arguments);
      this.handle = new AnnotationHandleProperties();
    }
  }
  __decorateClass([
    Validate12(OBJECT3, { optional: true })
  ], WithAnnotationHandle.prototype, "handle", 2);
  return WithAnnotationHandle;
}
function AnnotationAxisLabel(Parent) {
  class WithAxisLabel extends Parent {
    constructor() {
      super(...arguments);
      this.axisLabel = new AnnotationAxisLabelProperties();
    }
  }
  __decorateClass([
    Validate12(OBJECT3, { optional: true })
  ], WithAxisLabel.prototype, "axisLabel", 2);
  return WithAxisLabel;
}
function Cappable(Parent) {
  class CappableOptions extends Parent {
  }
  __decorateClass([
    Validate12(UNION3(["arrow", "circle"]), { optional: true })
  ], CappableOptions.prototype, "startCap", 2);
  __decorateClass([
    Validate12(UNION3(["arrow", "circle"]), { optional: true })
  ], CappableOptions.prototype, "endCap", 2);
  return CappableOptions;
}
function Extendable(Parent) {
  class ExtendableOptions extends Parent {
  }
  __decorateClass([
    Validate12(BOOLEAN5, { optional: true })
  ], ExtendableOptions.prototype, "extendLeft", 2);
  __decorateClass([
    Validate12(BOOLEAN5, { optional: true })
  ], ExtendableOptions.prototype, "extendRight", 2);
  return ExtendableOptions;
}
function Lockable(Parent) {
  class LockableOptions extends Parent {
  }
  __decorateClass([
    Validate12(BOOLEAN5, { optional: true })
  ], LockableOptions.prototype, "locked", 2);
  return LockableOptions;
}
function Visible(Parent) {
  class VisibleOptions extends Parent {
  }
  __decorateClass([
    Validate12(BOOLEAN5, { optional: true })
  ], VisibleOptions.prototype, "visible", 2);
  return VisibleOptions;
}
function Fill(Parent) {
  class FillOptions extends Parent {
  }
  __decorateClass([
    Validate12(COLOR_STRING2, { optional: true })
  ], FillOptions.prototype, "fill", 2);
  __decorateClass([
    Validate12(RATIO4, { optional: true })
  ], FillOptions.prototype, "fillOpacity", 2);
  return FillOptions;
}
function Stroke(Parent) {
  class StrokeOptions extends Parent {
  }
  __decorateClass([
    Validate12(COLOR_STRING2, { optional: true })
  ], StrokeOptions.prototype, "stroke", 2);
  __decorateClass([
    Validate12(RATIO4, { optional: true })
  ], StrokeOptions.prototype, "strokeOpacity", 2);
  __decorateClass([
    Validate12(NUMBER3, { optional: true })
  ], StrokeOptions.prototype, "strokeWidth", 2);
  return StrokeOptions;
}
function Label(Parent) {
  class LabelOptions extends Parent {
    constructor() {
      super(...arguments);
      this.textAlign = "center";
      this.fontSize = 12;
      this.fontFamily = "Verdana, sans-serif";
    }
  }
  __decorateClass([
    Validate12(POSITIVE_NUMBER4, { optional: true })
  ], LabelOptions.prototype, "padding", 2);
  __decorateClass([
    Validate12(TEXT_ALIGN, { optional: true })
  ], LabelOptions.prototype, "textAlign", 2);
  __decorateClass([
    Validate12(FONT_STYLE2, { optional: true })
  ], LabelOptions.prototype, "fontStyle", 2);
  __decorateClass([
    Validate12(FONT_WEIGHT2, { optional: true })
  ], LabelOptions.prototype, "fontWeight", 2);
  __decorateClass([
    Validate12(POSITIVE_NUMBER4)
  ], LabelOptions.prototype, "fontSize", 2);
  __decorateClass([
    Validate12(STRING2)
  ], LabelOptions.prototype, "fontFamily", 2);
  __decorateClass([
    Validate12(COLOR_STRING2, { optional: true })
  ], LabelOptions.prototype, "color", 2);
  __decorateClass([
    Validate12(FUNCTION, { optional: true })
  ], LabelOptions.prototype, "formatter", 2);
  return LabelOptions;
}
function LineDash(Parent) {
  class LineDashOptions extends Parent {
  }
  __decorateClass([
    Validate12(LINE_DASH2, { optional: true })
  ], LineDashOptions.prototype, "lineDash", 2);
  __decorateClass([
    Validate12(NUMBER3, { optional: true })
  ], LineDashOptions.prototype, "lineDashOffset", 2);
  return LineDashOptions;
}

// packages/ag-charts-enterprise/src/features/annotations/cross-line/crossLineProperties.ts
var { STRING: STRING3, BaseProperties: BaseProperties2, Validate: Validate13, isObject } = import_ag_charts_community20._ModuleSupport;
var HorizontalLineAnnotation = class extends Annotation(
  "horizontal-line" /* HorizontalLine */,
  AnnotationCrossLine(AnnotationHandle(AnnotationAxisLabel(Cappable(Stroke(LineDash(BaseProperties2))))))
) {
  constructor() {
    super(...arguments);
    this.direction = "horizontal";
    this.type = "horizontal-line" /* HorizontalLine */;
  }
  static is(value) {
    return isObject(value) && value.type === "horizontal-line" /* HorizontalLine */;
  }
  isValidWithContext(context, warningPrefix) {
    return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
  }
};
__decorateClass([
  Validate13(STRING3)
], HorizontalLineAnnotation.prototype, "type", 2);
var VerticalLineAnnotation = class extends Annotation(
  "vertical-line" /* VerticalLine */,
  AnnotationCrossLine(AnnotationHandle(AnnotationAxisLabel(Cappable(Stroke(LineDash(BaseProperties2))))))
) {
  constructor() {
    super(...arguments);
    this.direction = "vertical";
    this.type = "vertical-line" /* VerticalLine */;
  }
  static is(value) {
    return isObject(value) && value.type === "vertical-line" /* VerticalLine */;
  }
  isValidWithContext(context, warningPrefix) {
    return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
  }
};
__decorateClass([
  Validate13(STRING3)
], VerticalLineAnnotation.prototype, "type", 2);

// packages/ag-charts-enterprise/src/features/annotations/cross-line/crossLineScene.ts
var import_ag_charts_community25 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/annotations/scenes/annotation.ts
var import_ag_charts_community22 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/annotations/scenes/handle.ts
var import_ag_charts_community21 = require("ag-charts-community");
var _Handle = class _Handle extends import_ag_charts_community21._Scene.Group {
  constructor() {
    super(...arguments);
    this.active = false;
    this.locked = false;
    this.visible = false;
  }
  drag(target) {
    const { handle, locked } = this;
    if (locked) {
      return { point: { x: handle.x, y: handle.y }, offset: { x: 0, y: 0 } };
    }
    return {
      point: target,
      offset: { x: target.x - handle.x, y: target.y - handle.y }
    };
  }
  toggleActive(active) {
    this.active = active;
    if (!active) {
      this.handle.strokeWidth = _Handle.INACTIVE_STROKE_WIDTH;
    }
  }
  toggleHovered(hovered) {
    this.glow.visible = !this.locked && hovered;
    this.glow.dirtyPath = true;
  }
  toggleDragging(dragging) {
    if (this.locked)
      return;
    this.handle.visible = !dragging;
    this.glow.visible = this.glow.visible && !dragging;
    this.handle.dirtyPath = true;
    this.glow.dirtyPath = true;
  }
  toggleLocked(locked) {
    this.locked = locked;
  }
  getCursor() {
    return "default";
  }
  containsPoint(x, y) {
    return this.handle.containsPoint(x, y);
  }
};
_Handle.INACTIVE_STROKE_WIDTH = 1;
var Handle = _Handle;
var _InvariantHandle = class _InvariantHandle extends Handle {
  constructor() {
    super();
    this.handle = new import_ag_charts_community21._Scene.Circle();
    this.glow = new import_ag_charts_community21._Scene.Circle();
    this.append([this.handle]);
    this.handle.size = _InvariantHandle.HANDLE_SIZE;
    this.handle.strokeWidth = Handle.INACTIVE_STROKE_WIDTH;
    this.handle.zIndex = 2;
  }
  update(styles) {
    this.handle.setProperties({ ...styles, strokeWidth: Handle.INACTIVE_STROKE_WIDTH });
  }
  drag(target) {
    return { point: target, offset: { x: 0, y: 0 } };
  }
};
_InvariantHandle.HANDLE_SIZE = 7;
_InvariantHandle.GLOW_SIZE = 9;
var InvariantHandle = _InvariantHandle;
var _UnivariantHandle = class _UnivariantHandle extends Handle {
  constructor() {
    super();
    this.handle = new import_ag_charts_community21._Scene.Rect();
    this.glow = new import_ag_charts_community21._Scene.Rect();
    this.gradient = "horizontal";
    this.append([this.glow, this.handle]);
    this.handle.cornerRadius = _UnivariantHandle.CORNER_RADIUS;
    this.handle.width = _UnivariantHandle.HANDLE_SIZE;
    this.handle.height = _UnivariantHandle.HANDLE_SIZE;
    this.handle.strokeWidth = Handle.INACTIVE_STROKE_WIDTH;
    this.handle.zIndex = 2;
    this.glow.cornerRadius = _UnivariantHandle.CORNER_RADIUS;
    this.glow.width = _UnivariantHandle.GLOW_SIZE;
    this.glow.height = _UnivariantHandle.GLOW_SIZE;
    this.glow.strokeWidth = 0;
    this.glow.fillOpacity = 0.2;
    this.glow.zIndex = 1;
    this.glow.visible = false;
  }
  toggleLocked(locked) {
    super.toggleLocked(locked);
    if (locked) {
      const offset = (_UnivariantHandle.HANDLE_SIZE - InvariantHandle.HANDLE_SIZE) / 2;
      this.handle.cornerRadius = 1;
      this.handle.fill = this.handle.stroke;
      this.handle.strokeWidth = 0;
      this.handle.x += offset;
      this.handle.y += offset;
      this.handle.width = InvariantHandle.HANDLE_SIZE;
      this.handle.height = InvariantHandle.HANDLE_SIZE;
      this.glow.width = InvariantHandle.GLOW_SIZE;
      this.glow.height = InvariantHandle.GLOW_SIZE;
    } else {
      this.handle.cornerRadius = _UnivariantHandle.CORNER_RADIUS;
      this.handle.width = _UnivariantHandle.HANDLE_SIZE;
      this.handle.height = _UnivariantHandle.HANDLE_SIZE;
      this.glow.width = _UnivariantHandle.GLOW_SIZE;
      this.glow.height = _UnivariantHandle.GLOW_SIZE;
      if (this.cachedStyles) {
        this.handle.setProperties(this.cachedStyles);
      }
    }
  }
  update(styles) {
    this.cachedStyles = { ...styles };
    if (!this.active) {
      delete styles.strokeWidth;
    }
    if (this.locked) {
      delete styles.fill;
      delete styles.strokeWidth;
      const offset = (_UnivariantHandle.HANDLE_SIZE - InvariantHandle.HANDLE_SIZE) / 2;
      styles.x -= offset;
      styles.y -= offset;
      this.cachedStyles.x -= offset;
      this.cachedStyles.y -= offset;
    }
    this.handle.setProperties(styles);
    this.glow.setProperties({
      ...styles,
      x: (styles.x ?? this.glow.x) - 2,
      y: (styles.y ?? this.glow.y) - 2,
      strokeWidth: 0,
      fill: styles.stroke
    });
  }
  drag(target) {
    if (this.locked) {
      return { point: target, offset: { x: 0, y: 0 } };
    }
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
    if (this.locked)
      return "default";
    return this.gradient === "vertical" ? "col-resize" : "row-resize";
  }
};
_UnivariantHandle.HANDLE_SIZE = 12;
_UnivariantHandle.GLOW_SIZE = 16;
_UnivariantHandle.CORNER_RADIUS = 4;
var UnivariantHandle = _UnivariantHandle;
var _DivariantHandle = class _DivariantHandle extends Handle {
  constructor() {
    super();
    this.handle = new import_ag_charts_community21._Scene.Circle();
    this.glow = new import_ag_charts_community21._Scene.Circle();
    this.append([this.glow, this.handle]);
    this.handle.size = _DivariantHandle.HANDLE_SIZE;
    this.handle.strokeWidth = Handle.INACTIVE_STROKE_WIDTH;
    this.handle.zIndex = 2;
    this.glow.size = _DivariantHandle.GLOW_SIZE;
    this.glow.strokeWidth = 0;
    this.glow.fillOpacity = 0.2;
    this.glow.zIndex = 1;
    this.glow.visible = false;
  }
  toggleLocked(locked) {
    super.toggleLocked(locked);
    if (locked) {
      this.handle.fill = this.handle.stroke;
      this.handle.strokeWidth = 0;
      this.handle.size = InvariantHandle.HANDLE_SIZE;
      this.glow.size = InvariantHandle.GLOW_SIZE;
    } else {
      this.handle.size = _DivariantHandle.HANDLE_SIZE;
      this.glow.size = _DivariantHandle.GLOW_SIZE;
      if (this.cachedStyles) {
        this.handle.setProperties(this.cachedStyles);
      }
    }
  }
  update(styles) {
    this.cachedStyles = { ...styles };
    if (!this.active) {
      delete styles.strokeWidth;
    }
    if (this.locked) {
      delete styles.fill;
      delete styles.strokeWidth;
    }
    this.handle.setProperties(styles);
    this.glow.setProperties({ ...styles, strokeWidth: 0, fill: styles.stroke });
  }
};
_DivariantHandle.HANDLE_SIZE = 11;
_DivariantHandle.GLOW_SIZE = 17;
var DivariantHandle = _DivariantHandle;

// packages/ag-charts-enterprise/src/features/annotations/scenes/annotation.ts
var { isObject: isObject2 } = import_ag_charts_community22._ModuleSupport;
var Annotation2 = class extends import_ag_charts_community22._Scene.Group {
  constructor() {
    super(...arguments);
    this.locked = false;
  }
  static isCheck(value, type) {
    return isObject2(value) && Object.hasOwn(value, "type") && value.type === type;
  }
  getCachedBBoxWithoutHandles() {
    return this.cachedBBoxWithoutHandles ?? import_ag_charts_community22._Scene.BBox.zero;
  }
  computeBBoxWithoutHandles() {
    this.computeTransformMatrix();
    return import_ag_charts_community22._Scene.Group.computeBBox(this.children.filter((node) => !(node instanceof Handle)));
  }
  render(renderCtx) {
    super.render(renderCtx);
    this.cachedBBoxWithoutHandles = this.computeBBoxWithoutHandles();
  }
};

// packages/ag-charts-enterprise/src/features/annotations/scenes/axisLabel.ts
var import_ag_charts_community23 = require("ag-charts-community");
var { calculateLabelTranslation, ChartAxisDirection: ChartAxisDirection8 } = import_ag_charts_community23._ModuleSupport;
var AxisLabel = class extends import_ag_charts_community23._Scene.Group {
  constructor() {
    super({ name: "AnnotationAxisLabelGroup" });
    this.label = new import_ag_charts_community23._Scene.Text({ zIndex: 1 });
    this.rect = new import_ag_charts_community23._Scene.Rect();
    const { label } = this;
    label.fontSize = 12;
    label.fontFamily = "Verdana, sans-serif";
    label.fill = "black";
    label.textBaseline = "middle";
    label.textAlign = "center";
    this.append([this.rect, this.label]);
  }
  update(opts) {
    this.updateLabel(opts);
    this.updateRect(opts);
    this.updatePosition(opts);
  }
  updateLabel({ value, styles, context }) {
    const { label } = this;
    const { fontWeight, fontSize, fontStyle, fontFamily, textAlign, color = "white", formatter } = styles;
    label.setProperties({ fontWeight, fontSize, fontStyle, fontFamily, textAlign, fill: color });
    label.text = this.getFormattedValue(value, formatter ?? context.scaleValueFormatter());
  }
  updateRect({ styles }) {
    const { rect } = this;
    const { cornerRadius, fill, fillOpacity, stroke, strokeOpacity } = styles;
    rect.setProperties({ cornerRadius, fill, fillOpacity, stroke, strokeOpacity });
  }
  updatePosition({ x, y, context, styles: { padding } }) {
    const { label, rect } = this;
    const labelBBox = label.computeBBox();
    const horizontalPadding = 8;
    const verticalPadding = 5;
    labelBBox.grow(padding ?? horizontalPadding, "horizontal");
    labelBBox.grow(padding ?? verticalPadding, "vertical");
    const shift = context.direction === ChartAxisDirection8.X ? verticalPadding / 2 : horizontalPadding;
    const { xTranslation, yTranslation } = calculateLabelTranslation({
      yDirection: true,
      padding: context.labelPadding - shift,
      position: context.position ?? "left",
      bbox: labelBBox
    });
    const translationX = x + xTranslation;
    const translationY = y + yTranslation;
    label.translationX = translationX;
    label.translationY = translationY;
    rect.x = translationX - labelBBox.width / 2;
    rect.y = translationY - labelBBox.height / 2;
    rect.height = labelBBox.height;
    rect.width = labelBBox.width;
  }
  getFormattedValue(value, formatter) {
    return formatter?.(value) ?? String(value);
  }
};
AxisLabel.className = "AxisLabel";

// packages/ag-charts-enterprise/src/features/annotations/scenes/shapes.ts
var import_ag_charts_community24 = require("ag-charts-community");
var { Vec2 } = import_ag_charts_community24._Util;
var CollidableLine = class extends import_ag_charts_community24._Scene.Line {
  constructor() {
    super(...arguments);
    this.growCollisionBox = 9;
  }
  updateCollisionBBox() {
    const { growCollisionBox, strokeWidth, x1, y1, x2, y2 } = this;
    let height = strokeWidth + growCollisionBox;
    if (height % 2 === 0)
      height += 1;
    const topLeft = Vec2.from(x1, y1 - Math.floor(height / 2));
    const bottomRight = Vec2.from(x2, y2);
    const width = Vec2.distance(topLeft, bottomRight);
    this.collisionBBox = new import_ag_charts_community24._Scene.BBox(topLeft.x, topLeft.y, width, height);
  }
  isPointInPath(pointX, pointY) {
    const { collisionBBox, x1, y1, x2, y2 } = this;
    if (!collisionBBox)
      return false;
    const v1 = Vec2.from(x1, y1);
    const v2 = Vec2.from(x2, y2);
    const point = Vec2.sub(Vec2.from(pointX, pointY), v1);
    const end = Vec2.sub(v2, v1);
    const rotated = Vec2.rotate(point, Vec2.angle(point, end), v1);
    return collisionBBox.containsPoint(rotated.x, rotated.y) ?? false;
  }
};

// packages/ag-charts-enterprise/src/features/annotations/cross-line/crossLineScene.ts
var { Vec2: Vec22 } = import_ag_charts_community25._Util;
var { ChartAxisDirection: ChartAxisDirection9 } = import_ag_charts_community25._ModuleSupport;
var CrossLine = class extends Annotation2 {
  constructor() {
    super();
    this.type = "cross-line";
    this.line = new CollidableLine();
    this.middle = new UnivariantHandle();
    this.isHorizontal = false;
    this.append([this.line, this.middle]);
  }
  static is(value) {
    return Annotation2.isCheck(value, "cross-line");
  }
  update(datum, context) {
    const { line, middle } = this;
    const { locked, visible, lineDash, lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
    const { seriesRect } = context;
    this.locked = locked ?? false;
    this.seriesRect = seriesRect;
    this.isHorizontal = HorizontalLineAnnotation.is(datum);
    const axisContext = this.isHorizontal ? context.yAxis : context.xAxis;
    const coords = this.convertCrossLine(datum, axisContext);
    if (coords == null) {
      this.visible = false;
      return;
    } else {
      this.visible = visible ?? true;
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
      stroke: datum.handle.stroke ?? stroke,
      strokeOpacity: datum.handle.strokeOpacity ?? strokeOpacity,
      strokeWidth: datum.handle.strokeWidth ?? strokeWidth
    };
    const x = x1 + (x2 - x1) / 2;
    const y = y1 + (y2 - y1) / 2;
    const { width: handleWidth, height: handleHeight } = middle.handle;
    middle.gradient = this.isHorizontal ? "horizontal" : "vertical";
    middle.update({ ...handleStyles, x: x - handleWidth / 2, y: y - handleHeight / 2 });
    middle.toggleLocked(this.locked);
    this.updateAxisLabel(datum, axisContext, coords);
  }
  createAxisLabel(context) {
    const axisLabel = new AxisLabel();
    context.attachLabel(axisLabel);
    return axisLabel;
  }
  updateAxisLabel(datum, axisContext, { x1, y1, x2, y2 }) {
    if (!this.axisLabel) {
      this.axisLabel = this.createAxisLabel(axisContext);
    }
    const { axisLabel, seriesRect } = this;
    if (datum.axisLabel.enabled) {
      axisLabel.visible = this.visible;
      const [labelX, labelY] = axisContext.position === "left" || axisContext.position === "top" ? [x1, y1] : [x2, y2];
      const labelPosition = axisContext.direction === ChartAxisDirection9.X ? labelX : labelY;
      if (!axisContext.inRange(labelPosition)) {
        axisLabel.visible = false;
        return;
      }
      axisLabel.update({
        x: labelX + (seriesRect?.x ?? 0),
        y: labelY + (seriesRect?.y ?? 0),
        value: datum.value,
        styles: datum.axisLabel,
        context: axisContext
      });
    } else {
      axisLabel.visible = false;
    }
  }
  toggleHandles(show) {
    this.middle.visible = show;
    this.middle.toggleHovered(this.activeHandle === "middle");
  }
  destroy() {
    super.destroy();
    this.axisLabel?.destroy();
  }
  toggleActive(active) {
    this.toggleHandles(active);
    this.middle.toggleActive(active);
  }
  dragStart(datum, target, context) {
    const middle = HorizontalLineAnnotation.is(datum) ? { x: target.x, y: convert(datum.value, context.yAxis) } : { x: convert(datum.value, context.xAxis), y: target.y };
    this.dragState = {
      offset: target,
      middle
    };
  }
  drag(datum, target, context, onInvalid) {
    const { activeHandle, dragState, locked } = this;
    if (locked)
      return;
    let coords;
    if (activeHandle) {
      this[activeHandle].toggleDragging(true);
      coords = this[activeHandle].drag(target).point;
    } else if (dragState) {
      coords = Vec22.add(dragState.middle, Vec22.sub(target, dragState.offset));
    } else {
      return;
    }
    const point = invertCoords(coords, context);
    if (!validateDatumPoint(context, point)) {
      onInvalid();
      return;
    }
    const isHorizontal = HorizontalLineAnnotation.is(datum);
    datum.set({ value: isHorizontal ? point.y : point.x });
  }
  stopDragging() {
    this.middle.toggleDragging(false);
  }
  getCursor() {
    if (this.activeHandle == null)
      return "pointer";
    return this[this.activeHandle].getCursor();
  }
  containsPoint(x, y) {
    const { middle, seriesRect, line } = this;
    this.activeHandle = void 0;
    if (middle.containsPoint(x, y)) {
      this.activeHandle = "middle";
      return true;
    }
    x -= seriesRect?.x ?? 0;
    y -= seriesRect?.y ?? 0;
    return line.isPointInPath(x, y);
  }
  getAnchor() {
    let bbox = this.getCachedBBoxWithoutHandles();
    if (bbox.width === 0 && bbox.height === 0) {
      bbox = this.computeBBoxWithoutHandles();
    }
    if (this.isHorizontal) {
      return { x: bbox.x + bbox.width / 2, y: bbox.y };
    }
    return { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2, position: "above" };
  }
  convertCrossLine(datum, context) {
    if (datum.value == null)
      return;
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    const { bounds, scaleConvert, scaleBandwidth } = context;
    const halfBandwidth = (scaleBandwidth() ?? 0) / 2;
    if (HorizontalLineAnnotation.is(datum)) {
      const scaledValue = scaleConvert(datum.value) + halfBandwidth;
      x2 = bounds.width;
      y1 = scaledValue;
      y2 = scaledValue;
    } else {
      const scaledValue = scaleConvert(datum.value) + halfBandwidth;
      x1 = scaledValue;
      x2 = scaledValue;
      y2 = bounds.height;
    }
    return { x1, y1, x2, y2 };
  }
};

// packages/ag-charts-enterprise/src/features/annotations/cross-line/crossLineState.ts
var import_ag_charts_community26 = require("ag-charts-community");
var CrossLineStateMachine = class extends import_ag_charts_community26._ModuleSupport.StateMachine {
  constructor(direction, appendDatum, onExit) {
    const onClick = ({ point }) => {
      const isHorizontal = direction === "horizontal";
      const datum = isHorizontal ? new HorizontalLineAnnotation() : new VerticalLineAnnotation();
      datum.set({ value: isHorizontal ? point.y : point.x });
      appendDatum(datum);
    };
    super("start", {
      start: {
        click: {
          target: "__parent",
          action: onClick
        },
        cancel: "__parent",
        onExit
      }
    });
    this.debug = import_ag_charts_community26._Util.Debug.create(true, "annotations");
  }
};

// packages/ag-charts-enterprise/src/features/annotations/disjoint-channel/disjointChannelProperties.ts
var import_ag_charts_community27 = require("ag-charts-community");
var { NUMBER: NUMBER4, STRING: STRING4, BaseProperties: BaseProperties3, Validate: Validate14, isObject: isObject3 } = import_ag_charts_community27._ModuleSupport;
var DisjointChannelAnnotation = class extends Annotation(
  "disjoint-channel" /* DisjointChannel */,
  ChannelAnnotation(AnnotationLine(AnnotationHandle(Stroke(LineDash(BaseProperties3)))))
) {
  constructor() {
    super(...arguments);
    this.type = "disjoint-channel" /* DisjointChannel */;
  }
  static is(value) {
    return isObject3(value) && value.type === "disjoint-channel" /* DisjointChannel */;
  }
  get bottom() {
    const bottom = {
      start: { x: this.start.x, y: this.start.y },
      end: { x: this.end.x, y: this.end.y }
    };
    if (typeof bottom.start.y === "number" && typeof bottom.end.y === "number") {
      bottom.start.y -= this.startHeight;
      bottom.end.y -= this.endHeight;
    } else {
      import_ag_charts_community27._Util.Logger.warnOnce(`Annotation [${this.type}] can only be used with a numeric y-axis.`);
    }
    return bottom;
  }
  isValidWithContext(context, warningPrefix) {
    return super.isValid(warningPrefix) && validateDatumLine(context, this, warningPrefix) && validateDatumLine(context, this.bottom, warningPrefix);
  }
};
__decorateClass([
  Validate14(STRING4)
], DisjointChannelAnnotation.prototype, "type", 2);
__decorateClass([
  Validate14(NUMBER4)
], DisjointChannelAnnotation.prototype, "startHeight", 2);
__decorateClass([
  Validate14(NUMBER4)
], DisjointChannelAnnotation.prototype, "endHeight", 2);

// packages/ag-charts-enterprise/src/features/annotations/disjoint-channel/disjointChannelScene.ts
var import_ag_charts_community30 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/annotations/scenes/channelScene.ts
var import_ag_charts_community29 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/annotations/scenes/linearScene.ts
var import_ag_charts_community28 = require("ag-charts-community");
var { Vec2: Vec23 } = import_ag_charts_community28._Util;
var LinearScene = class extends Annotation2 {
  dragStart(datum, target, context) {
    this.dragState = {
      offset: target,
      start: convertPoint(datum.start, context),
      end: convertPoint(datum.end, context)
    };
  }
  drag(datum, target, context, onInvalid) {
    if (datum.locked)
      return;
    if (this.activeHandle) {
      this.dragHandle(datum, target, context, onInvalid);
    } else {
      this.dragAll(datum, target, context);
    }
  }
  dragAll(datum, target, context) {
    const { dragState } = this;
    if (!dragState)
      return;
    const { xAxis, yAxis } = context;
    const topLeft = Vec23.add(dragState.start, Vec23.sub(target, dragState.offset));
    const topRight = Vec23.add(dragState.end, Vec23.sub(target, dragState.offset));
    const startPoint = invertCoords(topLeft, context);
    const endPoint = invertCoords(topRight, context);
    const within = (min, value, max) => value >= min && value <= max;
    const coords = [topLeft, topRight].concat(...this.getOtherCoords(datum, topLeft, topRight, context));
    if (coords.every((coord) => within(xAxis.bounds.x, coord.x, xAxis.bounds.x + xAxis.bounds.width))) {
      datum.start.x = startPoint.x;
      datum.end.x = endPoint.x;
    }
    if (coords.every((coord) => within(yAxis.bounds.y, coord.y, yAxis.bounds.y + yAxis.bounds.height))) {
      datum.start.y = startPoint.y;
      datum.end.y = endPoint.y;
    }
  }
  getOtherCoords(_datum, _topLeft, _topRight, _context) {
    return [];
  }
};

// packages/ag-charts-enterprise/src/features/annotations/scenes/channelScene.ts
var ChannelScene = class extends LinearScene {
  constructor() {
    super(...arguments);
    this.handles = {};
    this.topLine = new CollidableLine();
    this.bottomLine = new CollidableLine();
    this.background = new import_ag_charts_community29._Scene.Path({ zIndex: -1 });
  }
  update(datum, context) {
    const { locked, visible } = datum;
    this.locked = locked ?? false;
    this.seriesRect = context.seriesRect;
    const top = convertLine(datum, context);
    const bottom = convertLine(datum.bottom, context);
    if (top == null || bottom == null) {
      this.visible = false;
      return;
    } else {
      this.visible = visible ?? true;
    }
    this.updateLines(datum, top, bottom);
    this.updateHandles(datum, top, bottom);
    this.updateBackground(datum, top, bottom);
    for (const handle of Object.values(this.handles)) {
      handle.toggleLocked(this.locked);
    }
  }
  toggleActive(active) {
    this.toggleHandles(active);
    for (const node of Object.values(this.handles)) {
      node.toggleActive(active);
    }
  }
  stopDragging() {
    const { activeHandle, handles } = this;
    if (activeHandle == null)
      return;
    handles[activeHandle].toggleDragging(false);
  }
  getAnchor() {
    const bbox = this.getCachedBBoxWithoutHandles();
    return { x: bbox.x + bbox.width / 2, y: bbox.y };
  }
  getCursor() {
    if (this.activeHandle == null)
      return "pointer";
    return this.handles[this.activeHandle].getCursor();
  }
  containsPoint(x, y) {
    const { handles, seriesRect, topLine, bottomLine } = this;
    this.activeHandle = void 0;
    for (const [handle, child] of Object.entries(handles)) {
      if (child.containsPoint(x, y)) {
        this.activeHandle = handle;
        return true;
      }
    }
    x -= seriesRect?.x ?? 0;
    y -= seriesRect?.y ?? 0;
    return topLine.containsPoint(x, y) || bottomLine.containsPoint(x, y);
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
};

// packages/ag-charts-enterprise/src/features/annotations/disjoint-channel/disjointChannelScene.ts
var { Vec2: Vec24 } = import_ag_charts_community30._Util;
var DisjointChannel = class extends ChannelScene {
  constructor() {
    super();
    this.type = "disjoint-channel";
    this.handles = {
      topLeft: new DivariantHandle(),
      topRight: new DivariantHandle(),
      bottomLeft: new DivariantHandle(),
      bottomRight: new UnivariantHandle()
    };
    this.append([this.background, this.topLine, this.bottomLine, ...Object.values(this.handles)]);
  }
  static is(value) {
    return Annotation2.isCheck(value, "disjoint-channel");
  }
  toggleHandles(show) {
    if (typeof show === "boolean") {
      show = {
        topLeft: show,
        topRight: show,
        bottomLeft: show,
        bottomRight: show
      };
    }
    for (const [handle, node] of Object.entries(this.handles)) {
      node.visible = show[handle] ?? true;
      node.toggleHovered(this.activeHandle === handle);
    }
  }
  toggleActive(active) {
    this.toggleHandles(active);
    for (const node of Object.values(this.handles)) {
      node.toggleActive(active);
    }
  }
  dragHandle(datum, target, context, onInvalid) {
    const { activeHandle, handles } = this;
    if (activeHandle == null)
      return;
    const { offset } = handles[activeHandle].drag(target);
    handles[activeHandle].toggleDragging(true);
    const invert2 = (coords) => invertCoords(coords, context);
    const prev = datum.toJson();
    switch (activeHandle) {
      case "topLeft":
      case "bottomLeft": {
        const direction = activeHandle === "topLeft" ? 1 : -1;
        const start = invert2({
          x: handles.topLeft.handle.x + offset.x,
          y: handles.topLeft.handle.y + offset.y * direction
        });
        const bottomStart = invert2({
          x: handles.bottomLeft.handle.x + offset.x,
          y: handles.bottomLeft.handle.y + offset.y * -direction
        });
        if (!start || !bottomStart || datum.start.y == null)
          return;
        const startHeight = datum.startHeight + (start.y - datum.start.y) * 2;
        datum.start.x = start.x;
        datum.start.y = start.y;
        datum.startHeight = startHeight;
        break;
      }
      case "topRight": {
        const end = invert2({
          x: handles.topRight.handle.x + offset.x,
          y: handles.topRight.handle.y + offset.y
        });
        if (!end || datum.end.y == null)
          return;
        const endHeight = datum.endHeight + (end.y - datum.end.y) * 2;
        datum.end.x = end.x;
        datum.end.y = end.y;
        datum.endHeight = endHeight;
        break;
      }
      case "bottomRight": {
        const bottomStart = invert2({
          x: handles.bottomLeft.handle.x + offset.x,
          y: handles.bottomLeft.handle.y + offset.y
        });
        const bottomEnd = invert2({
          x: handles.bottomRight.handle.x + offset.x,
          y: handles.bottomRight.handle.y + offset.y
        });
        if (!bottomStart || !bottomEnd || datum.start.y == null || datum.end.y == null)
          return;
        const endHeight = datum.end.y - bottomEnd.y;
        const startHeight = datum.startHeight - (datum.endHeight - endHeight);
        datum.startHeight = startHeight;
        datum.endHeight = endHeight;
      }
    }
    if (!datum.isValidWithContext(context)) {
      datum.set(prev);
      onInvalid();
    }
  }
  getOtherCoords(datum, topLeft, topRight, context) {
    const { dragState } = this;
    if (!dragState)
      return [];
    const startHeight = convertPoint(datum.bottom.start, context).y - convertPoint(datum.start, context).y;
    const endHeight = convertPoint(datum.bottom.end, context).y - convertPoint(datum.end, context).y;
    const bottomLeft = Vec24.add(topLeft, Vec24.from(0, startHeight));
    const bottomRight = Vec24.add(topRight, Vec24.from(0, endHeight));
    return [bottomLeft, bottomRight];
  }
  updateLines(datum, top, bottom) {
    const { topLine, bottomLine } = this;
    const { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = datum;
    const lineStyles = { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth };
    topLine.setProperties({
      x1: top.x1,
      y1: top.y1,
      x2: top.x2,
      y2: top.y2,
      ...lineStyles
    });
    bottomLine.setProperties({
      x1: bottom.x1,
      y1: bottom.y1,
      x2: bottom.x2,
      y2: bottom.y2,
      ...lineStyles
    });
    topLine.updateCollisionBBox();
    bottomLine.updateCollisionBBox();
  }
  updateHandles(datum, top, bottom) {
    const {
      handles: { topLeft, topRight, bottomLeft, bottomRight }
    } = this;
    const handleStyles = {
      fill: datum.handle.fill,
      stroke: datum.handle.stroke ?? datum.stroke,
      strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
      strokeWidth: datum.handle.strokeWidth ?? datum.strokeWidth
    };
    topLeft.update({ ...handleStyles, x: top.x1, y: top.y1 });
    topRight.update({ ...handleStyles, x: top.x2, y: top.y2 });
    bottomLeft.update({ ...handleStyles, x: bottom.x1, y: bottom.y1 });
    bottomRight.update({
      ...handleStyles,
      x: bottom.x2 - bottomRight.handle.width / 2,
      y: bottom.y2 - bottomRight.handle.height / 2
    });
  }
};

// packages/ag-charts-enterprise/src/features/annotations/disjoint-channel/disjointChannelState.ts
var import_ag_charts_community31 = require("ag-charts-community");
var DisjointChannelStateMachine = class extends import_ag_charts_community31._ModuleSupport.StateMachine {
  constructor(appendDatum, validateDatumPoint2) {
    const onStartClick = ({ point }) => {
      const datum = new DisjointChannelAnnotation();
      datum.set({ start: point, end: point, startHeight: 0, endHeight: 0 });
      appendDatum(datum);
    };
    const onEndHover = ({ datum, node, point }) => {
      datum?.set({ end: point });
      node?.toggleHandles({ topRight: false, bottomLeft: false, bottomRight: false });
    };
    const onEndClick = ({ datum, point }) => {
      datum?.set({ end: point });
    };
    const onHeightHover = ({ datum, node, point }) => {
      if (datum.start.y == null || datum.end.y == null)
        return;
      const endHeight = datum.end.y - point.y;
      const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;
      const bottomStart = { x: datum.start.x, y: datum.start.y - startHeight };
      const bottomEnd = { x: datum.end.x, y: point.y };
      node.toggleHandles({ bottomLeft: false });
      if (!validateDatumPoint2(bottomStart) || !validateDatumPoint2(bottomEnd)) {
        return;
      }
      datum.set({ startHeight, endHeight });
    };
    const onHeightClick = ({ datum, node, point }) => {
      if (!datum || !node || datum.start.y == null || datum.end.y == null)
        return;
      const endHeight = datum.end.y - point.y;
      const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;
      const bottomStart = { x: datum.start.x, y: datum.start.y - endHeight };
      const bottomEnd = { x: datum.end.x, y: point.y };
      node.toggleHandles(true);
      if (validateDatumPoint2(bottomStart) && validateDatumPoint2(bottomEnd)) {
        datum.set({ startHeight, endHeight });
      }
    };
    super("start", {
      start: {
        click: {
          target: "end",
          action: onStartClick
        },
        drag: {
          target: "end",
          action: onStartClick
        },
        cancel: "__parent"
      },
      end: {
        hover: onEndHover,
        click: {
          target: "height",
          action: onEndClick
        },
        drag: onEndHover,
        cancel: "__parent"
      },
      height: {
        hover: onHeightHover,
        click: {
          target: "__parent",
          action: onHeightClick
        },
        cancel: "__parent"
      }
    });
    this.debug = import_ag_charts_community31._Util.Debug.create(true, "annotations");
  }
};

// packages/ag-charts-enterprise/src/features/annotations/line/lineProperties.ts
var import_ag_charts_community32 = require("ag-charts-community");
var { STRING: STRING5, BaseProperties: BaseProperties4, Validate: Validate15, isObject: isObject4 } = import_ag_charts_community32._ModuleSupport;
var LineAnnotation = class extends Annotation(
  "line" /* Line */,
  AnnotationLine(AnnotationHandle(Cappable(Extendable(Stroke(LineDash(BaseProperties4))))))
) {
  constructor() {
    super(...arguments);
    this.type = "line" /* Line */;
  }
  static is(value) {
    return isObject4(value) && value.type === "line" /* Line */;
  }
  isValidWithContext(context, warningPrefix) {
    return super.isValid(warningPrefix) && validateDatumLine(context, this, warningPrefix);
  }
};
__decorateClass([
  Validate15(STRING5)
], LineAnnotation.prototype, "type", 2);

// packages/ag-charts-enterprise/src/features/annotations/line/lineScene.ts
var import_ag_charts_community33 = require("ag-charts-community");
var Line = class extends LinearScene {
  constructor() {
    super();
    this.type = "line";
    this.line = new CollidableLine();
    this.start = new DivariantHandle();
    this.end = new DivariantHandle();
    this.append([this.line, this.start, this.end]);
  }
  static is(value) {
    return Annotation2.isCheck(value, "line");
  }
  update(datum, context) {
    const { line, start, end } = this;
    const { locked, visible, lineDash, lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
    this.locked = locked ?? false;
    this.seriesRect = context.seriesRect;
    const coords = convertLine(datum, context);
    if (coords == null) {
      this.visible = false;
      return;
    } else {
      this.visible = visible ?? true;
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
      stroke: datum.handle.stroke ?? stroke,
      strokeOpacity: datum.handle.strokeOpacity ?? strokeOpacity,
      strokeWidth: datum.handle.strokeWidth ?? strokeWidth
    };
    start.update({ ...handleStyles, x: x1, y: y1 });
    end.update({ ...handleStyles, x: x2, y: y2 });
    start.toggleLocked(this.locked);
    end.toggleLocked(this.locked);
  }
  toggleHandles(show) {
    if (typeof show === "boolean") {
      show = { start: show, end: show };
    }
    this.start.visible = show.start ?? true;
    this.end.visible = show.end ?? true;
    this.start.toggleHovered(this.activeHandle === "start");
    this.end.toggleHovered(this.activeHandle === "end");
  }
  toggleActive(active) {
    this.toggleHandles(active);
    this.start.toggleActive(active);
    this.end.toggleActive(active);
  }
  dragHandle(datum, target, context, onInvalid) {
    const { activeHandle } = this;
    if (!activeHandle)
      return;
    this[activeHandle].toggleDragging(true);
    const point = invertCoords(this[activeHandle].drag(target).point, context);
    if (!validateDatumPoint(context, point)) {
      onInvalid();
      return;
    }
    datum[activeHandle].x = point.x;
    datum[activeHandle].y = point.y;
  }
  stopDragging() {
    this.start.toggleDragging(false);
    this.end.toggleDragging(false);
  }
  getAnchor() {
    const bbox = this.getCachedBBoxWithoutHandles();
    return { x: bbox.x + bbox.width / 2, y: bbox.y };
  }
  getCursor() {
    if (this.activeHandle == null)
      return "pointer";
    return "default";
  }
  containsPoint(x, y) {
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
    x -= seriesRect?.x ?? 0;
    y -= seriesRect?.y ?? 0;
    return line.isPointInPath(x, y);
  }
};

// packages/ag-charts-enterprise/src/features/annotations/line/lineState.ts
var import_ag_charts_community34 = require("ag-charts-community");
var LineStateMachine = class extends import_ag_charts_community34._ModuleSupport.StateMachine {
  constructor(appendDatum) {
    const onStartClick = ({ point }) => {
      const datum = new LineAnnotation();
      datum.set({ start: point, end: point });
      appendDatum(datum);
    };
    const onEndHover = ({ datum, node, point }) => {
      datum?.set({ end: point });
      node?.toggleHandles({ end: false });
    };
    const onEndClick = ({ datum, node, point }) => {
      datum?.set({ end: point });
      node?.toggleHandles(true);
    };
    super("start", {
      start: {
        click: {
          target: "end",
          action: onStartClick
        },
        drag: {
          target: "end",
          action: onStartClick
        },
        cancel: "__parent"
      },
      end: {
        hover: onEndHover,
        click: {
          target: "__parent",
          action: onEndClick
        },
        drag: onEndHover,
        cancel: "__parent"
      }
    });
    this.debug = import_ag_charts_community34._Util.Debug.create(true, "annotations");
  }
};

// packages/ag-charts-enterprise/src/features/annotations/parallel-channel/parallelChannelProperties.ts
var import_ag_charts_community35 = require("ag-charts-community");
var { NUMBER: NUMBER5, STRING: STRING6, OBJECT: OBJECT4, BaseProperties: BaseProperties5, Validate: Validate16, isObject: isObject5 } = import_ag_charts_community35._ModuleSupport;
var ParallelChannelAnnotation = class extends Annotation(
  "parallel-channel" /* ParallelChannel */,
  ChannelAnnotation(AnnotationLine(AnnotationHandle(Extendable(Stroke(LineDash(BaseProperties5))))))
) {
  constructor() {
    super(...arguments);
    this.type = "parallel-channel" /* ParallelChannel */;
    this.middle = new ChannelAnnotationMiddle();
  }
  static is(value) {
    return isObject5(value) && value.type === "parallel-channel" /* ParallelChannel */;
  }
  get bottom() {
    const bottom = {
      start: { x: this.start.x, y: this.start.y },
      end: { x: this.end.x, y: this.end.y }
    };
    if (typeof bottom.start.y === "number" && typeof bottom.end.y === "number") {
      bottom.start.y -= this.height;
      bottom.end.y -= this.height;
    } else {
      import_ag_charts_community35._Util.Logger.warnOnce(`Annotation [${this.type}] can only be used with a numeric y-axis.`);
    }
    return bottom;
  }
  isValidWithContext(context, warningPrefix) {
    return super.isValid(warningPrefix) && validateDatumLine(context, this, warningPrefix) && validateDatumLine(context, this.bottom, warningPrefix);
  }
};
__decorateClass([
  Validate16(STRING6)
], ParallelChannelAnnotation.prototype, "type", 2);
__decorateClass([
  Validate16(NUMBER5)
], ParallelChannelAnnotation.prototype, "height", 2);
__decorateClass([
  Validate16(OBJECT4, { optional: true })
], ParallelChannelAnnotation.prototype, "middle", 2);

// packages/ag-charts-enterprise/src/features/annotations/parallel-channel/parallelChannelScene.ts
var import_ag_charts_community36 = require("ag-charts-community");
var { Vec2: Vec25 } = import_ag_charts_community36._Util;
var ParallelChannel = class extends ChannelScene {
  constructor() {
    super();
    this.type = "parallel-channel";
    this.handles = {
      topLeft: new DivariantHandle(),
      topMiddle: new UnivariantHandle(),
      topRight: new DivariantHandle(),
      bottomLeft: new DivariantHandle(),
      bottomMiddle: new UnivariantHandle(),
      bottomRight: new DivariantHandle()
    };
    this.middleLine = new import_ag_charts_community36._Scene.Line();
    this.append([this.background, this.topLine, this.middleLine, this.bottomLine, ...Object.values(this.handles)]);
  }
  static is(value) {
    return Annotation2.isCheck(value, "parallel-channel");
  }
  toggleHandles(show) {
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
      node.visible = show[handle] ?? true;
      node.toggleHovered(this.activeHandle === handle);
    }
  }
  toggleActive(active) {
    this.toggleHandles(active);
    for (const node of Object.values(this.handles)) {
      node.toggleActive(active);
    }
  }
  dragHandle(datum, target, context, onInvalid) {
    const { activeHandle, handles } = this;
    if (activeHandle == null)
      return;
    const { offset } = handles[activeHandle].drag(target);
    handles[activeHandle].toggleDragging(true);
    const prev = datum.toJson();
    let moves = [];
    switch (activeHandle) {
      case "topLeft":
      case "bottomLeft":
        moves = ["topLeft", "bottomLeft"];
        break;
      case "topMiddle":
        moves = ["topLeft", "topRight"];
        offset.y -= UnivariantHandle.HANDLE_SIZE / 2;
        break;
      case "topRight":
      case "bottomRight":
        moves = ["topRight", "bottomRight"];
        break;
      case "bottomMiddle":
        moves = ["bottomLeft", "bottomRight"];
        offset.y -= UnivariantHandle.HANDLE_SIZE / 2;
        break;
    }
    const invertedMoves = moves.map((move) => invertCoords(Vec25.add(handles[move].handle, offset), context));
    if (invertedMoves.some((invertedMove) => !validateDatumPoint(context, invertedMove))) {
      onInvalid();
      return;
    }
    if ((activeHandle === "topMiddle" || activeHandle === "bottomMiddle") && datum.start.y != null) {
      const topLeft = invertCoords(Vec25.add(handles.topLeft.handle, offset), context);
      if (validateDatumPoint(context, topLeft)) {
        if (activeHandle === "topMiddle") {
          datum.height += topLeft.y - datum.start.y;
        } else {
          datum.height -= topLeft.y - datum.start.y;
        }
      }
    }
    for (const [index, invertedMove] of invertedMoves.entries()) {
      switch (moves[index]) {
        case "topLeft":
          datum.start.x = invertedMove.x;
          datum.start.y = invertedMove.y;
          break;
        case "topRight":
          datum.end.x = invertedMove.x;
          datum.end.y = invertedMove.y;
          break;
      }
    }
    if (!datum.isValidWithContext(context)) {
      datum.set(prev);
      onInvalid();
    }
  }
  getOtherCoords(datum, topLeft, topRight, context) {
    const { dragState } = this;
    if (!dragState)
      return [];
    const height = convertPoint(datum.bottom.start, context).y - convertPoint(datum.start, context).y;
    const bottomLeft = Vec25.add(topLeft, Vec25.from(0, height));
    const bottomRight = Vec25.add(topRight, Vec25.from(0, height));
    return [bottomLeft, bottomRight];
  }
  updateLines(datum, top, bottom) {
    const { topLine, middleLine, bottomLine } = this;
    const { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = datum;
    const lineStyles = { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth };
    topLine.setProperties({
      x1: top.x1,
      y1: top.y1,
      x2: top.x2,
      y2: top.y2,
      ...lineStyles
    });
    bottomLine.setProperties({
      x1: bottom.x1,
      y1: bottom.y1,
      x2: bottom.x2,
      y2: bottom.y2,
      ...lineStyles
    });
    topLine.updateCollisionBBox();
    bottomLine.updateCollisionBBox();
    middleLine.setProperties({
      x1: top.x1,
      y1: bottom.y1 + (top.y1 - bottom.y1) / 2,
      x2: top.x2,
      y2: bottom.y2 + (top.y2 - bottom.y2) / 2,
      lineDash: datum.middle.lineDash ?? lineDash,
      lineDashOffset: datum.middle.lineDashOffset ?? lineDashOffset,
      stroke: datum.middle.stroke ?? stroke,
      strokeOpacity: datum.middle.strokeOpacity ?? strokeOpacity,
      strokeWidth: datum.middle.strokeWidth ?? strokeWidth,
      visible: datum.middle.visible ?? true
    });
  }
  updateHandles(datum, top, bottom) {
    const {
      handles: { topLeft, topMiddle, topRight, bottomLeft, bottomMiddle, bottomRight }
    } = this;
    const handleStyles = {
      fill: datum.handle.fill,
      stroke: datum.handle.stroke ?? datum.stroke,
      strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
      strokeWidth: datum.handle.strokeWidth ?? datum.strokeWidth
    };
    topLeft.update({ ...handleStyles, x: top.x1, y: top.y1 });
    topRight.update({ ...handleStyles, x: top.x2, y: top.y2 });
    bottomLeft.update({ ...handleStyles, x: bottom.x1, y: bottom.y1 });
    bottomRight.update({ ...handleStyles, x: bottom.x2, y: bottom.y2 });
    topMiddle.update({
      ...handleStyles,
      x: top.x1 + (top.x2 - top.x1) / 2 - topMiddle.handle.width / 2,
      y: top.y1 + (top.y2 - top.y1) / 2 - topMiddle.handle.height / 2
    });
    bottomMiddle.update({
      ...handleStyles,
      x: bottom.x1 + (bottom.x2 - bottom.x1) / 2 - bottomMiddle.handle.width / 2,
      y: bottom.y1 + (bottom.y2 - bottom.y1) / 2 - bottomMiddle.handle.height / 2
    });
  }
};

// packages/ag-charts-enterprise/src/features/annotations/parallel-channel/parallelChannelState.ts
var import_ag_charts_community37 = require("ag-charts-community");
var ParallelChannelStateMachine = class extends import_ag_charts_community37._ModuleSupport.StateMachine {
  constructor(appendDatum, validateDatumPoint2) {
    const onStartClick = ({ point }) => {
      const datum = new ParallelChannelAnnotation();
      datum.set({ start: point, end: point, height: 0 });
      appendDatum(datum);
    };
    const onEndHover = ({ datum, node, point }) => {
      datum?.set({ end: point, height: 0 });
      node?.toggleHandles({
        topMiddle: false,
        topRight: false,
        bottomLeft: false,
        bottomMiddle: false,
        bottomRight: false
      });
    };
    const onEndClick = ({ datum, node, point }) => {
      datum?.set({ end: point });
      node?.toggleHandles({ topMiddle: false, bottomMiddle: false });
    };
    const onHeightHover = ({ datum, node, point }) => {
      if (datum.start.y == null || datum.end.y == null)
        return;
      const height = datum.end.y - point.y;
      const bottomStartY = datum.start.y - height;
      node.toggleHandles({ topMiddle: false, bottomMiddle: false });
      if (!validateDatumPoint2({ x: datum.start.x, y: bottomStartY }) || !validateDatumPoint2({ x: datum.end.x, y: point.y })) {
        return;
      }
      datum.set({ height });
    };
    const onHeightClick = ({ datum, node, point }) => {
      if (!datum || !node || datum.start.y == null || datum.end.y == null)
        return;
      const height = datum.end.y - point.y;
      const bottomStartY = datum.start.y - height;
      node.toggleHandles(true);
      if (validateDatumPoint2({ x: datum.start.x, y: bottomStartY }) && validateDatumPoint2({ x: datum.end.x, y: point.y })) {
        datum.set({ height });
      }
    };
    super("start", {
      start: {
        click: {
          target: "end",
          action: onStartClick
        },
        drag: {
          target: "end",
          action: onStartClick
        },
        cancel: "__parent"
      },
      end: {
        hover: onEndHover,
        click: {
          target: "height",
          action: onEndClick
        },
        drag: onEndHover,
        cancel: "__parent"
      },
      height: {
        hover: onHeightHover,
        click: {
          target: "__parent",
          action: onHeightClick
        },
        cancel: "__parent"
      }
    });
    this.debug = import_ag_charts_community37._Util.Debug.create(true, "annotations");
  }
};

// packages/ag-charts-enterprise/src/features/annotations/annotations.ts
var {
  BOOLEAN: BOOLEAN6,
  ChartUpdateType,
  Cursor,
  InteractionState: InteractionState2,
  PropertiesArray,
  StateMachine,
  ToolbarManager,
  Validate: Validate17,
  REGIONS: REGIONS2,
  UNION: UNION4,
  ChartAxisDirection: ChartAxisDirection10
} = import_ag_charts_community38._ModuleSupport;
var { Vec2: Vec26 } = import_ag_charts_community38._Util;
var annotationDatums = {
  ["line" /* Line */]: LineAnnotation,
  ["horizontal-line" /* HorizontalLine */]: HorizontalLineAnnotation,
  ["vertical-line" /* VerticalLine */]: VerticalLineAnnotation,
  ["parallel-channel" /* ParallelChannel */]: ParallelChannelAnnotation,
  ["disjoint-channel" /* DisjointChannel */]: DisjointChannelAnnotation
};
var annotationScenes = {
  ["line" /* Line */]: Line,
  ["horizontal-line" /* HorizontalLine */]: CrossLine,
  ["vertical-line" /* VerticalLine */]: CrossLine,
  ["disjoint-channel" /* DisjointChannel */]: DisjointChannel,
  ["parallel-channel" /* ParallelChannel */]: ParallelChannel
};
var AnnotationsStateMachine = class extends StateMachine {
  constructor(onEnterIdle, appendDatum, onExitCrossLine, validateChildStateDatumPoint) {
    super("idle", {
      idle: {
        onEnter: () => onEnterIdle(),
        ["line" /* Line */]: new LineStateMachine((datum) => appendDatum("line" /* Line */, datum)),
        ["horizontal-line" /* HorizontalLine */]: new CrossLineStateMachine(
          "horizontal",
          (datum) => appendDatum("horizontal-line" /* HorizontalLine */, datum),
          onExitCrossLine
        ),
        ["vertical-line" /* VerticalLine */]: new CrossLineStateMachine(
          "vertical",
          (datum) => appendDatum("vertical-line" /* VerticalLine */, datum),
          onExitCrossLine
        ),
        ["disjoint-channel" /* DisjointChannel */]: new DisjointChannelStateMachine(
          (datum) => appendDatum("disjoint-channel" /* DisjointChannel */, datum),
          validateChildStateDatumPoint
        ),
        ["parallel-channel" /* ParallelChannel */]: new ParallelChannelStateMachine(
          (datum) => appendDatum("parallel-channel" /* ParallelChannel */, datum),
          validateChildStateDatumPoint
        )
      }
    });
    this.debug = import_ag_charts_community38._Util.Debug.create(true, "annotations");
  }
};
var AXIS_TYPE = UNION4(["x", "y", "xy"], "an axis type");
var AxesButtons = class {
  constructor() {
    this.enabled = true;
    this.axes = "y";
  }
};
__decorateClass([
  Validate17(BOOLEAN6)
], AxesButtons.prototype, "enabled", 2);
__decorateClass([
  Validate17(AXIS_TYPE, { optional: true })
], AxesButtons.prototype, "axes", 2);
var Annotations = class extends import_ag_charts_community38._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    // TODO: When the 'restore-annotations' event is triggered from `ActionsOnSet.newValue()`, the module is still
    // disabled when `onRestoreAnnotations()` is called, preventing the state from being restored. However,
    // when `ObserveChanges()` is first called `target.enabled === false`, rather than `undefined`. So
    // there is no way to detect if the module was actively disabled. This flag simulates a combined
    // behaviour of both and is toggled when the module is actively disabled and enabled.
    this.__hackWasDisabled = false;
    this.enabled = true;
    this.axesButtons = new AxesButtons();
    this.annotationData = new PropertiesArray(this.createAnnotationDatum);
    this.container = new import_ag_charts_community38._Scene.Group({ name: "static-annotations" });
    this.annotations = new import_ag_charts_community38._Scene.Selection(
      this.container,
      this.createAnnotationScene.bind(this)
    );
    this.colorPicker = new ColorPicker(this.ctx);
    this.state = new AnnotationsStateMachine(
      () => {
        ctx.cursorManager.updateCursor("annotations");
        ctx.interactionManager.popState(InteractionState2.Annotations);
        ctx.toolbarManager.toggleGroup("annotations", "annotationOptions", this.active != null);
        ctx.tooltipManager.unsuppressTooltip("annotations");
        for (const annotationType of ANNOTATION_BUTTONS) {
          ctx.toolbarManager.toggleButton("annotations", annotationType, { active: false });
        }
        this.toggleAnnotationOptionsButtons();
      },
      this.appendDatum.bind(this),
      () => {
        this.active = this.annotationData.length - 1;
      },
      this.validateChildStateDatumPoint.bind(this)
    );
    const { All, Default: Default4, Annotations: AnnotationsState, ZoomDrag } = InteractionState2;
    const seriesRegion = ctx.regionManager.getRegion(REGIONS2.SERIES);
    const otherRegions = Object.values(REGIONS2).filter(
      (region) => ![
        REGIONS2.SERIES,
        // TODO: Navigator wrongly enchroaches on the top of the chart, even if it is disabled. We
        // have to ignore it to prevent it immediately calling `onCancel()` when the top-left
        // annotations toolbar button is clicked.
        REGIONS2.NAVIGATOR
      ].includes(region)
    ).map((region) => ctx.regionManager.getRegion(region));
    ctx.domManager.addStyles(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS, axisButton_default);
    this.destroyFns.push(
      ctx.annotationManager.attachNode(this.container),
      () => this.colorPicker.destroy(),
      seriesRegion.addListener("hover", (event) => this.onHover(event), All),
      seriesRegion.addListener("click", (event) => this.onClick(event), All),
      seriesRegion.addListener("drag-start", this.onDragStart.bind(this), Default4 | ZoomDrag | AnnotationsState),
      seriesRegion.addListener("drag", this.onDrag.bind(this), Default4 | ZoomDrag | AnnotationsState),
      seriesRegion.addListener("drag-end", this.onDragEnd.bind(this), All),
      seriesRegion.addListener("cancel", this.onCancel.bind(this), All),
      seriesRegion.addListener("delete", this.onDelete.bind(this), All),
      ...otherRegions.map((region) => region.addListener("click", this.onCancel.bind(this), All)),
      ctx.annotationManager.addListener("restore-annotations", this.onRestoreAnnotations.bind(this)),
      ctx.toolbarManager.addListener("button-pressed", this.onToolbarButtonPress.bind(this)),
      ctx.toolbarManager.addListener("button-moved", this.onToolbarButtonMoved.bind(this)),
      ctx.toolbarManager.addListener("cancelled", this.onToolbarCancelled.bind(this)),
      ctx.layoutService.addListener("layout-complete", this.onLayoutComplete.bind(this)),
      () => ctx.domManager.removeStyles(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS)
    );
  }
  createAnnotationScene(datum) {
    return new annotationScenes[datum.type]();
  }
  createAnnotationDatum(params) {
    if (params.type in annotationDatums) {
      return new annotationDatums[params.type]().set(params);
    }
    throw new Error(
      `AG Charts - Cannot set property of unknown type [${params.type}], expected one of [${Object.keys(annotationDatums)}], ignoring.`
    );
  }
  appendDatum(type, datum) {
    this.annotationData.push(datum);
    const styles = this.ctx.annotationManager.getAnnotationTypeStyles(type);
    if (styles)
      datum.set(styles);
    if (this.defaultColor) {
      this.colorDatum(datum, this.defaultColor);
    }
  }
  onRestoreAnnotations(event) {
    if (!this.enabled)
      return;
    this.clear();
    this.annotationData.set(event.annotations);
    this.update();
  }
  onToolbarButtonPress(event) {
    const {
      state,
      ctx: { interactionManager, toolbarManager, tooltipManager }
    } = this;
    if (ToolbarManager.isGroup("annotationOptions", event)) {
      this.onToolbarAnnotationOptionButtonPress(event);
      return;
    }
    if (!ToolbarManager.isGroup("annotations", event)) {
      this.reset();
      this.update();
      return;
    }
    if (event.value === "clear") {
      this.clear();
      this.update();
      return;
    }
    tooltipManager.suppressTooltip("annotations");
    const annotation = stringToAnnotationType(event.value);
    if (!annotation) {
      import_ag_charts_community38._Util.Logger.errorOnce(`Can not create unknown annotation type [${event.value}], ignoring.`);
      this.update();
      return;
    }
    if (!state.is("idle")) {
      this.cancel();
    }
    interactionManager.pushState(InteractionState2.Annotations);
    for (const annotationType of ANNOTATION_BUTTONS) {
      toolbarManager.toggleButton("annotations", annotationType, { active: annotationType === event.value });
    }
    state.transition(annotation);
    this.reset();
    this.update();
  }
  onToolbarAnnotationOptionButtonPress(event) {
    if (!ToolbarManager.isGroup("annotationOptions", event))
      return;
    const { active, annotationData } = this;
    if (active == null)
      return;
    switch (event.value) {
      case "line-color":
        this.colorPicker.show({
          color: this.getTypedDatum(annotationData[active])?.stroke,
          onChange: this.onColorPickerChange.bind(this),
          onClose: this.onColorPickerClose.bind(this)
        });
        break;
      case "delete":
        annotationData.splice(active, 1);
        this.reset();
        break;
      case "lock":
        annotationData[active].locked = true;
        this.toggleAnnotationOptionsButtons();
        this.colorPicker.hide();
        break;
      case "unlock":
        annotationData[active].locked = false;
        this.toggleAnnotationOptionsButtons();
        break;
    }
    this.update();
  }
  onToolbarButtonMoved(event) {
    const { rect } = event;
    const anchor = Vec26.add(rect, Vec26.from(0, rect.height + 4));
    const fallback = { y: rect.y - 4 };
    this.colorPicker.setAnchor(anchor, fallback);
  }
  onColorPickerChange(color) {
    const { active, annotationData } = this;
    if (active == null)
      return;
    this.colorDatum(annotationData[active], color);
    this.defaultColor = color;
    this.update();
  }
  onColorPickerClose() {
    this.colorPicker.hide();
  }
  onToolbarCancelled(event) {
    if (event.group !== "annotations")
      return;
    this.onCancel();
    for (const annotationType of ANNOTATION_BUTTONS) {
      this.ctx.toolbarManager.toggleButton("annotations", annotationType, { active: false });
    }
  }
  onLayoutComplete(event) {
    const seriesRect = event.series.paddedRect;
    this.seriesRect = seriesRect;
    for (const axisLayout of event.axes ?? []) {
      if (axisLayout.direction === import_ag_charts_community38._ModuleSupport.ChartAxisDirection.X) {
        this.xAxis = this.getAxis(axisLayout, seriesRect, this.xAxis?.button);
      } else {
        this.yAxis = this.getAxis(axisLayout, seriesRect, this.yAxis?.button);
      }
    }
    this.updateAnnotations();
  }
  getAxis(axisLayout, seriesRect, button) {
    const axisCtx = this.ctx.axisManager.getAxisContext(axisLayout.direction)[0];
    const { position: axisPosition = "bottom", direction } = axisCtx;
    const padding = axisLayout.gridPadding + axisLayout.seriesAreaPadding;
    const bounds = buildBounds(new import_ag_charts_community38._Scene.BBox(0, 0, seriesRect.width, seriesRect.height), axisPosition, padding);
    const lineDirection = axisCtx.direction === ChartAxisDirection10.X ? "vertical" : "horizontal";
    const { axesButtons } = this;
    const buttonEnabled = this.enabled && axesButtons.enabled && (axesButtons.axes === "xy" || axesButtons.axes === direction);
    if (buttonEnabled) {
      button ?? (button = new AxisButton(
        this.ctx,
        axisCtx,
        (coords) => this.onAxisButtonClick(coords, lineDirection),
        seriesRect
      ));
      const axisLabelPadding = calculateAxisLabelPadding(axisLayout);
      button.update(seriesRect, axisLabelPadding);
    } else {
      button?.destroy();
      button = void 0;
    }
    return { layout: axisLayout, context: axisCtx, bounds, button };
  }
  updateAnnotations() {
    const {
      active,
      seriesRect,
      annotationData,
      annotations,
      ctx: { annotationManager, toolbarManager }
    } = this;
    const context = this.getAnnotationContext();
    if (!seriesRect || !context) {
      return;
    }
    annotationManager.updateData(annotationData.toJson());
    annotations.update(annotationData ?? [], void 0, (datum) => datum.id).each((node, datum, index) => {
      if (!this.validateDatum(datum)) {
        node.visible = false;
        return;
      }
      if (LineAnnotation.is(datum) && Line.is(node)) {
        node.update(datum, context);
      }
      if (DisjointChannelAnnotation.is(datum) && DisjointChannel.is(node)) {
        node.update(datum, context);
      }
      if ((HorizontalLineAnnotation.is(datum) || VerticalLineAnnotation.is(datum)) && CrossLine.is(node)) {
        node.update(datum, context);
      }
      if (ParallelChannelAnnotation.is(datum) && ParallelChannel.is(node)) {
        node.update(datum, context);
      }
      if (active === index) {
        toolbarManager.changeFloatingAnchor("annotationOptions", node.getAnchor());
      }
    });
  }
  // Validation of the options beyond the scope of the @Validate decorator
  validateDatum(datum) {
    const context = this.getAnnotationContext();
    return context ? datum.isValidWithContext(context, `Annotation [${datum.type}] `) : true;
  }
  validateChildStateDatumPoint(point) {
    const context = this.getAnnotationContext();
    const valid = context ? validateDatumPoint(context, point) : true;
    if (!valid) {
      this.ctx.cursorManager.updateCursor("annotations", Cursor.NotAllowed);
    }
    return valid;
  }
  getAnnotationContext() {
    const { seriesRect, xAxis, yAxis } = this;
    if (!(seriesRect && xAxis && yAxis)) {
      return;
    }
    return {
      seriesRect,
      xAxis: {
        ...xAxis.context,
        bounds: xAxis.bounds,
        labelPadding: calculateAxisLabelPadding(xAxis.layout)
      },
      yAxis: {
        ...yAxis.context,
        bounds: yAxis.bounds,
        labelPadding: calculateAxisLabelPadding(xAxis.layout)
      }
    };
  }
  onHover(event) {
    if (this.state.is("idle")) {
      this.onHoverSelecting(event);
    } else {
      this.onHoverAdding(event);
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
      const contains = annotation.containsPoint(event.offsetX, event.offsetY);
      if (contains)
        this.hovered ?? (this.hovered = index);
      annotation.toggleHandles(contains || active === index);
    });
    cursorManager.updateCursor(
      "annotations",
      this.hovered == null ? void 0 : annotations.nodes()[this.hovered].getCursor()
    );
  }
  onHoverAdding(event) {
    const {
      annotationData,
      annotations,
      seriesRect,
      state,
      ctx: { cursorManager }
    } = this;
    const context = this.getAnnotationContext();
    if (!context)
      return;
    const offset = Vec26.sub(Vec26.fromOffset(event), Vec26.required(seriesRect));
    const point = invertCoords(offset, context);
    const valid = validateDatumPoint(context, point);
    cursorManager.updateCursor("annotations", valid ? void 0 : Cursor.NotAllowed);
    if (!valid || state.is("start"))
      return;
    const datum = annotationData.at(-1);
    this.active = annotationData.length - 1;
    const node = annotations.nodes()[this.active];
    if (!datum || !node)
      return;
    node.toggleActive(true);
    const data = { datum, node, point };
    this.state.transition("hover", data);
    this.update();
  }
  onClick(event) {
    const { dragOffset, state } = this;
    if (state.is("end") && dragOffset && dragOffset.x === event.offsetX && dragOffset.y === event.offsetY) {
      this.dragOffset = void 0;
      return;
    }
    if (state.is("idle")) {
      this.onClickSelecting();
    } else {
      this.onClickAdding(event);
    }
  }
  onAxisButtonClick(coords, direction) {
    this.onCancel();
    const context = this.getAnnotationContext();
    if (!this.annotationData || !context)
      return;
    const {
      state,
      ctx: { toolbarManager, interactionManager }
    } = this;
    interactionManager.pushState(InteractionState2.Annotations);
    const isHorizontal = direction === "horizontal";
    state.transition(isHorizontal ? "horizontal-line" /* HorizontalLine */ : "vertical-line" /* VerticalLine */);
    toolbarManager.toggleGroup("annotations", "annotationOptions", false);
    if (!coords) {
      return;
    }
    const point = invertCoords(coords, context);
    if (!validateDatumPoint(context, point)) {
      return;
    }
    const data = { point };
    state.transition("click", data);
    this.update();
  }
  onClickSelecting() {
    const {
      annotations,
      colorPicker,
      hovered,
      ctx: { toolbarManager, tooltipManager }
    } = this;
    colorPicker.hide();
    if (this.active != null) {
      annotations.nodes()[this.active].toggleActive(false);
    }
    this.active = hovered;
    toolbarManager.toggleGroup("annotations", "annotationOptions", this.active != null);
    if (this.active == null) {
      tooltipManager.unsuppressTooltip("annotations");
    } else {
      const node = annotations.nodes()[this.active];
      node.toggleActive(true);
      tooltipManager.suppressTooltip("annotations");
      this.toggleAnnotationOptionsButtons();
    }
    this.update();
  }
  onClickAdding(event) {
    const {
      active,
      annotationData,
      annotations,
      seriesRect,
      state,
      ctx: { toolbarManager }
    } = this;
    toolbarManager.toggleGroup("annotations", "annotationOptions", false);
    const context = this.getAnnotationContext();
    if (!context)
      return;
    const datum = annotationData.at(-1);
    const offset = Vec26.sub(Vec26.fromOffset(event), Vec26.required(seriesRect));
    const point = invertCoords(offset, context);
    const node = active != null ? annotations.nodes()[active] : void 0;
    if (!validateDatumPoint(context, point)) {
      return;
    }
    const data = { datum, node, point };
    state.transition("click", data);
    this.update();
  }
  onDragStart(event) {
    const { annotationData, annotations, hovered, seriesRect } = this;
    if (this.isOtherElement(event)) {
      return;
    }
    const context = this.getAnnotationContext();
    if (hovered == null || annotationData == null || !this.state.is("idle") || context == null)
      return;
    const datum = annotationData[hovered];
    const node = annotations.nodes()[hovered];
    const offset = Vec26.sub(Vec26.fromOffset(event), Vec26.required(seriesRect));
    if (Line.is(node)) {
      node.dragStart(datum, offset, context);
    }
    if (CrossLine.is(node)) {
      node.dragStart(datum, offset, context);
    }
    if (DisjointChannel.is(node)) {
      node.dragStart(datum, offset, context);
    }
    if (ParallelChannel.is(node)) {
      node.dragStart(datum, offset, context);
    }
  }
  onDrag(event) {
    const { state } = this;
    if (this.isOtherElement(event)) {
      return;
    }
    if (state.is("start")) {
      this.dragOffset = Vec26.fromOffset(event);
    }
    if (state.is("idle")) {
      this.onClickSelecting();
      this.onDragAnnotation(event);
    } else {
      this.onDragAdding(event);
    }
  }
  onDragAnnotation(event) {
    const {
      annotationData,
      annotations,
      hovered,
      seriesRect,
      ctx: { cursorManager, interactionManager }
    } = this;
    const context = this.getAnnotationContext();
    if (hovered == null || annotationData == null || !this.state.is("idle") || context == null)
      return;
    interactionManager.pushState(InteractionState2.Annotations);
    const datum = annotationData[hovered];
    const node = annotations.nodes()[hovered];
    const offset = Vec26.sub(Vec26.fromOffset(event), Vec26.required(seriesRect));
    cursorManager.updateCursor("annotations");
    const onDragInvalid = () => cursorManager.updateCursor("annotations", Cursor.NotAllowed);
    if (LineAnnotation.is(datum) && Line.is(node)) {
      node.drag(datum, offset, context, onDragInvalid);
    }
    if ((HorizontalLineAnnotation.is(datum) || VerticalLineAnnotation.is(datum)) && CrossLine.is(node)) {
      node.drag(datum, offset, context, onDragInvalid);
    }
    if (DisjointChannelAnnotation.is(datum) && DisjointChannel.is(node)) {
      node.drag(datum, offset, context, onDragInvalid);
    }
    if (ParallelChannelAnnotation.is(datum) && ParallelChannel.is(node)) {
      node.drag(datum, offset, context, onDragInvalid);
    }
    this.update();
  }
  onDragAdding(event) {
    const {
      active,
      annotationData,
      annotations,
      seriesRect,
      state,
      ctx: { interactionManager }
    } = this;
    const context = this.getAnnotationContext();
    if (annotationData == null || context == null)
      return;
    const datum = active != null ? annotationData[active] : void 0;
    const node = active != null ? annotations.nodes()[active] : void 0;
    const offset = Vec26.sub(Vec26.fromOffset(event), Vec26.required(seriesRect));
    interactionManager.pushState(InteractionState2.Annotations);
    const point = invertCoords(offset, context);
    const data = { datum, node, point };
    state.transition("drag", data);
    this.active = annotationData.length - 1;
    this.update();
  }
  onDragEnd(_event) {
    const {
      active,
      annotations,
      ctx: { cursorManager, interactionManager }
    } = this;
    if (!this.state.is("idle"))
      return;
    interactionManager.popState(InteractionState2.Annotations);
    cursorManager.updateCursor("annotations");
    if (active == null)
      return;
    annotations.nodes()[active].stopDragging();
    this.update();
  }
  onCancel() {
    if (!this.state.is("idle")) {
      this.cancel();
    }
    this.reset();
    this.update();
  }
  onDelete() {
    const { active, annotationData, state } = this;
    if (active == null)
      return;
    if (!state.is("idle")) {
      state.transition("cancel");
    }
    annotationData.splice(active, 1);
    this.reset();
    this.update();
  }
  toggleAnnotationOptionsButtons() {
    const {
      active,
      annotationData,
      ctx: { toolbarManager }
    } = this;
    if (active == null)
      return;
    const locked = annotationData.at(active)?.locked ?? false;
    toolbarManager.toggleButton("annotationOptions", "line-color", { enabled: !locked });
    toolbarManager.toggleButton("annotationOptions", "delete", { enabled: !locked });
    toolbarManager.toggleButton("annotationOptions", "lock", { visible: !locked });
    toolbarManager.toggleButton("annotationOptions", "unlock", { visible: locked });
  }
  getTypedDatum(datum) {
    if (LineAnnotation.is(datum) || HorizontalLineAnnotation.is(datum) || VerticalLineAnnotation.is(datum) || DisjointChannelAnnotation.is(datum) || ParallelChannelAnnotation.is(datum)) {
      return datum;
    }
  }
  colorDatum(datum, color) {
    datum.stroke = color;
    if ("axisLabel" in datum) {
      datum.axisLabel.fill = color;
      datum.axisLabel.stroke = color;
    }
    if ("background" in datum)
      datum.background.fill = color;
  }
  isOtherElement({ targetElement }) {
    const {
      colorPicker,
      ctx: { domManager }
    } = this;
    if (!targetElement)
      return false;
    return ToolbarManager.isChildElement(domManager, targetElement) || colorPicker.isChildElement(targetElement);
  }
  clear() {
    this.annotationData.splice(0, this.annotationData.length);
    this.reset();
  }
  reset() {
    if (this.active != null) {
      this.annotations.nodes().at(this.active)?.toggleActive(false);
    }
    this.hovered = void 0;
    this.active = void 0;
    this.ctx.toolbarManager.toggleGroup("annotations", "annotationOptions", false);
    this.colorPicker.hide();
  }
  cancel() {
    const { active, annotationData, state } = this;
    state.transition("cancel");
    if (active != null && annotationData) {
      annotationData.splice(active, 1);
    }
  }
  update() {
    this.ctx.updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
  }
};
__decorateClass([
  import_ag_charts_community38._ModuleSupport.ObserveChanges((target, enabled) => {
    const {
      ctx: { annotationManager, stateManager, toolbarManager }
    } = target;
    toolbarManager.toggleGroup("annotations", "annotations", Boolean(enabled));
    if (target.__hackWasDisabled && enabled) {
      stateManager.restoreState(annotationManager);
      target.__hackWasDisabled = false;
    } else if (enabled === false) {
      target.__hackWasDisabled = true;
      target.clear();
    }
  }),
  Validate17(BOOLEAN6)
], Annotations.prototype, "enabled", 2);

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
        stroke: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_STROKE,
        strokeWidth: 2,
        strokeOpacity: 1,
        handle: {
          fill: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_HANDLE_FILL
        }
      },
      "horizontal-line": {
        stroke: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_STROKE,
        strokeWidth: 2,
        strokeOpacity: 1,
        handle: {
          fill: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_HANDLE_FILL
        },
        axisLabel: {
          enabled: true,
          color: "white",
          fill: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_STROKE,
          fontSize: 12,
          fontFamily: import_ag_charts_community39._Theme.DEFAULT_FONT_FAMILY
        }
      },
      "vertical-line": {
        stroke: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_STROKE,
        strokeWidth: 2,
        strokeOpacity: 1,
        handle: {
          fill: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_HANDLE_FILL
        },
        axisLabel: {
          enabled: true,
          color: "white",
          fill: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_STROKE,
          fontSize: 12,
          fontFamily: import_ag_charts_community39._Theme.DEFAULT_FONT_FAMILY
        }
      },
      "disjoint-channel": {
        stroke: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_STROKE,
        strokeWidth: 2,
        strokeOpacity: 1,
        background: {
          fill: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_BACKGROUND_FILL,
          fillOpacity: 0.2
        },
        handle: {
          fill: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_HANDLE_FILL
        }
      },
      "parallel-channel": {
        stroke: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_STROKE,
        strokeWidth: 2,
        strokeOpacity: 1,
        middle: {
          lineDash: [6, 5],
          strokeWidth: 1
        },
        background: {
          fill: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_BACKGROUND_FILL,
          fillOpacity: 0.2
        },
        handle: {
          fill: import_ag_charts_community39._Theme.DEFAULT_ANNOTATION_HANDLE_FILL
        }
      }
    }
  }
};

// packages/ag-charts-enterprise/src/features/background/background.ts
var import_ag_charts_community41 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/background/backgroundImage.ts
var import_ag_charts_community40 = require("ag-charts-community");
var { Image } = import_ag_charts_community40._Scene;
var {
  BaseProperties: BaseProperties6,
  ObserveChanges: ObserveChanges2,
  ProxyProperty,
  Validate: Validate18,
  NUMBER: NUMBER6,
  POSITIVE_NUMBER: POSITIVE_NUMBER5,
  RATIO: RATIO5,
  createElement: createElement3,
  calculatePlacement
} = import_ag_charts_community40._ModuleSupport;
var BackgroundImage = class extends BaseProperties6 {
  constructor() {
    super();
    this.opacity = 1;
    this.loadedSynchronously = true;
    this.containerWidth = 0;
    this.containerHeight = 0;
    this.onLoad = void 0;
    this.onImageLoad = () => {
      if (this.loadedSynchronously) {
        return;
      }
      this.node.visible = false;
      this.performLayout(this.containerWidth, this.containerHeight);
      this.onLoad?.();
    };
    this.imageElement = createElement3("img");
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
      this.complete ? {
        visible: true,
        opacity: this.opacity,
        ...calculatePlacement(
          this.imageElement.width,
          this.imageElement.height,
          this.containerWidth,
          this.containerHeight,
          this
        )
      } : { visible: false }
    );
  }
};
__decorateClass([
  Validate18(NUMBER6, { optional: true })
], BackgroundImage.prototype, "top", 2);
__decorateClass([
  Validate18(NUMBER6, { optional: true })
], BackgroundImage.prototype, "right", 2);
__decorateClass([
  Validate18(NUMBER6, { optional: true })
], BackgroundImage.prototype, "bottom", 2);
__decorateClass([
  Validate18(NUMBER6, { optional: true })
], BackgroundImage.prototype, "left", 2);
__decorateClass([
  Validate18(POSITIVE_NUMBER5, { optional: true })
], BackgroundImage.prototype, "width", 2);
__decorateClass([
  Validate18(POSITIVE_NUMBER5, { optional: true })
], BackgroundImage.prototype, "height", 2);
__decorateClass([
  Validate18(RATIO5)
], BackgroundImage.prototype, "opacity", 2);
__decorateClass([
  ProxyProperty("imageElement.src"),
  ObserveChanges2((target) => target.loadedSynchronously = target.complete)
], BackgroundImage.prototype, "url", 2);

// packages/ag-charts-enterprise/src/features/background/background.ts
var { ActionOnSet, OBJECT: OBJECT5, Validate: Validate19 } = import_ag_charts_community41._ModuleSupport;
var Background = class extends import_ag_charts_community41._ModuleSupport.Background {
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
    this.ctx.updateService.update(import_ag_charts_community41._ModuleSupport.ChartUpdateType.SCENE_RENDER);
  }
};
__decorateClass([
  Validate19(OBJECT5, { optional: true }),
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
  chartTypes: ["cartesian", "polar", "hierarchy", "topology", "flow-proportion"],
  instanceConstructor: Background
};

// packages/ag-charts-enterprise/src/features/context-menu/contextMenuModule.ts
var import_ag_charts_community43 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/context-menu/contextMenu.ts
var import_ag_charts_community42 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/context-menu/contextMenuStyles.css
var contextMenuStyles_default = ".ag-chart-context-menu{background:rgb(248,248,248);border:1px solid #babfc7;border-radius:5px;box-shadow:0 1px 4px 1px rgba(186,191,199,0.4);color:rgb(24,29,31);font:13px Verdana,sans-serif;transition:transform 0.1s ease;white-space:nowrap;z-index:var(--ag-charts-layer-context-menu)}.ag-chart-context-menu.ag-charts-dark-context-menu{color:white;background:#15181c}.ag-chart-context-menu__cover{position:fixed;left:0px;top:0px}.ag-chart-context-menu__menu{display:flex;flex-direction:column;padding:0.5em 0}.ag-chart-context-menu__menu:focus{outline:none}.ag-chart-context-menu__item{background:none;border:none;box-sizing:border-box;font:inherit;padding:0.5em 1em;text-align:left;-webkit-appearance:none;-moz-appearance:none}.ag-chart-context-menu__item.ag-charts-dark-context-menu{color:white}.ag-chart-context-menu__item:hover{background:rgb(33,150,243,0.1)}.ag-chart-context-menu__item:hover.ag-charts-dark-context-menu{background:rgb(33,150,243,0.1)}.ag-chart-context-menu__item:active{background:rgb(33,150,243,0.2)}.ag-chart-context-menu__item:active.ag-charts-dark-context-menu{background:rgb(33,150,243,0.1)}.ag-chart-context-menu__item[aria-disabled='true']{border:none;opacity:0.5;text-align:left}.ag-chart-context-menu__item[aria-disabled='true']:hover{background:inherit;cursor:inherit}.ag-chart-context-menu__divider{margin:5px 0;background:#babfc7;height:1px}.ag-chart-context-menu__divider.ag-charts-dark-context-menu{background:rgb(33,150,243,0.1)}";

// packages/ag-charts-enterprise/src/features/context-menu/contextMenuStyles.ts
var DEFAULT_CONTEXT_MENU_CLASS = "ag-chart-context-menu";
var DEFAULT_CONTEXT_MENU_DARK_CLASS = "ag-charts-dark-context-menu";

// packages/ag-charts-enterprise/src/features/context-menu/contextMenu.ts
var { BOOLEAN: BOOLEAN7, Validate: Validate20, createElement: createElement4, initMenuKeyNav, makeAccessibleClickListener, ContextMenuRegistry } = import_ag_charts_community42._ModuleSupport;
var moduleId2 = "context-menu";
function getChildrenOfType(parent, ctor) {
  const { children } = parent ?? {};
  if (!children)
    return [];
  const result = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof ctor) {
      result.push(child);
    }
  }
  return result;
}
var ContextMenu = class extends import_ag_charts_community42._ModuleSupport.BaseModuleInstance {
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
    /**
     * Extra menu actions that only appear when clicking on a legend item
     */
    this.extraLegendItemActions = [];
    this.x = 0;
    this.y = 0;
    this.menuElementDestroyFns = [];
    this.interactionManager = ctx.interactionManager;
    this.registry = ctx.contextMenuRegistry;
    this.scene = ctx.scene;
    const { All } = import_ag_charts_community42._ModuleSupport.InteractionState;
    this.destroyFns.push(ctx.regionManager.listenAll("click", (_region) => this.onClick(), All));
    this.groups = { default: [], extra: [], extraSeries: [], extraNode: [], extraLegendItem: [] };
    this.element = ctx.domManager.addChild("canvas-overlay", moduleId2);
    this.element.classList.add(DEFAULT_CONTEXT_MENU_CLASS);
    this.element.addEventListener("contextmenu", (event) => event.preventDefault());
    this.destroyFns.push(() => this.element.parentNode?.removeChild(this.element));
    this.hide();
    this.destroyFns.push(ctx.domManager.addListener("hidden", () => this.hide()));
    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(() => {
        if (this.menuElement && this.element.contains(this.menuElement)) {
          this.reposition();
        }
      });
      observer.observe(this.element, { childList: true });
      this.mutationObserver = observer;
      this.destroyFns.push(() => observer.disconnect());
    }
    ctx.domManager.addStyles(moduleId2, contextMenuStyles_default);
    this.registry.registerDefaultAction({
      id: "download",
      type: "all",
      label: "contextMenuDownload",
      action: () => {
        const title = ctx.chartService.title;
        let fileName = "image";
        if (title?.enabled && title?.text !== void 0) {
          fileName = title.text;
        }
        this.scene.download(fileName);
      }
    });
    this.destroyFns.push(this.registry.addListener((e) => this.onContext(e)));
  }
  isShown() {
    return this.menuElement !== void 0;
  }
  onClick() {
    if (this.isShown()) {
      this.hide();
    }
  }
  onContext(event) {
    if (!this.enabled)
      return;
    event.preventDefault();
    this.showEvent = event.sourceEvent;
    this.x = event.x;
    this.y = event.y;
    this.groups.default = this.registry.filterActions(event.type);
    this.pickedNode = void 0;
    this.pickedLegendItem = void 0;
    this.groups.extra = this.extraActions.map(({ label, action }) => {
      return { type: "all", label, action };
    });
    if (ContextMenuRegistry.check("series", event)) {
      this.pickedNode = event.context.pickedNode;
      if (this.pickedNode) {
        this.groups.extraNode = this.extraNodeActions.map(({ label, action }) => {
          return { type: "node", label, action };
        });
      }
    }
    if (ContextMenuRegistry.check("legend", event)) {
      this.pickedLegendItem = event.context.legendItem;
      if (this.pickedLegendItem) {
        this.groups.extraLegendItem = this.extraLegendItemActions.map(({ label, action }) => {
          return { type: "legend", label, action };
        });
      }
    }
    const { default: def, extra, extraNode, extraLegendItem } = this.groups;
    const groupCount = [def, extra, extraNode, extraLegendItem].reduce((count, e) => {
      return e.length + count;
    }, 0);
    if (groupCount === 0)
      return;
    this.lastFocus = this.getLastFocus(event);
    this.show();
  }
  getLastFocus(event) {
    if (event.sourceEvent.target instanceof HTMLElement && "tabindex" in event.sourceEvent.target.attributes) {
      return event.sourceEvent.target;
    }
    return void 0;
  }
  show() {
    this.interactionManager.pushState(import_ag_charts_community42._ModuleSupport.InteractionState.ContextMenu);
    this.element.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    const newMenuElement = this.renderMenu();
    if (this.menuElement) {
      this.element.replaceChild(newMenuElement, this.menuElement);
      this.menuElementDestroyFns.forEach((d) => d());
    } else {
      this.element.appendChild(newMenuElement);
    }
    this.menuElement = newMenuElement;
    this.element.style.display = "block";
    const buttons2 = getChildrenOfType(newMenuElement, HTMLButtonElement);
    this.menuElementDestroyFns = initMenuKeyNav({
      menu: newMenuElement,
      buttons: buttons2,
      orientation: "vertical",
      onEscape: () => this.hide()
    });
    newMenuElement.focus();
  }
  hide() {
    this.interactionManager.popState(import_ag_charts_community42._ModuleSupport.InteractionState.ContextMenu);
    if (this.menuElement) {
      this.element.removeChild(this.menuElement);
      this.menuElement = void 0;
      this.menuElementDestroyFns.forEach((d) => d());
      this.menuElementDestroyFns.length = 0;
    }
    this.element.style.display = "none";
    this.lastFocus?.focus();
    this.lastFocus = void 0;
  }
  renderMenu() {
    const menuElement = createElement4("div");
    menuElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
    menuElement.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    menuElement.role = "menu";
    this.appendMenuGroup(menuElement, this.groups.default, false);
    this.appendMenuGroup(menuElement, this.groups.extra);
    if (this.pickedNode) {
      this.appendMenuGroup(menuElement, this.groups.extraNode);
    }
    if (this.pickedLegendItem) {
      this.appendMenuGroup(menuElement, this.groups.extraLegendItem);
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
    const el = createElement4("div");
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
    el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    el.role = "separator";
    return el;
  }
  createActionElement({ id, label, type, action }) {
    const disabled = !!(id && this.registry.isDisabled(id));
    return this.createButtonElement(type, label, action, disabled);
  }
  createButtonOnClick(type, callback) {
    if (ContextMenuRegistry.checkCallback("legend", type, callback)) {
      return () => {
        if (this.pickedLegendItem) {
          const { seriesId, itemId, enabled } = this.pickedLegendItem;
          callback({ type: "contextmenu", seriesId, itemId, enabled });
          this.hide();
        }
      };
    } else if (ContextMenuRegistry.checkCallback("node", type, callback)) {
      return () => {
        const { pickedNode, showEvent } = this;
        const event = pickedNode?.series.createNodeContextMenuActionEvent(showEvent, pickedNode);
        if (event) {
          callback(event);
        } else {
          import_ag_charts_community42._Util.Logger.error("series node not found");
        }
        this.hide();
      };
    }
    return () => {
      callback({ type: "contextMenuEvent", event: this.showEvent });
      this.hide();
    };
  }
  createButtonElement(type, label, callback, disabled) {
    const el = createElement4("button");
    el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
    el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
    el.ariaDisabled = disabled.toString();
    el.textContent = this.ctx.localeManager.t(label);
    el.role = "menuitem";
    el.onclick = makeAccessibleClickListener(el, this.createButtonOnClick(type, callback));
    return el;
  }
  reposition() {
    let { x, y } = this;
    this.element.style.top = "unset";
    this.element.style.bottom = "unset";
    const canvasRect = this.ctx.domManager.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = this.element;
    x = import_ag_charts_community42._ModuleSupport.clamp(0, x, canvasRect.width - width);
    y = import_ag_charts_community42._ModuleSupport.clamp(0, y, canvasRect.height - height);
    this.element.style.left = `${x}px`;
    this.element.style.top = `calc(${y}px - 0.5em)`;
  }
  destroy() {
    super.destroy();
    this.mutationObserver?.disconnect();
    this.ctx.domManager.removeStyles(moduleId2);
    this.ctx.domManager.removeChild("canvas-overlay", moduleId2);
  }
};
__decorateClass([
  Validate20(BOOLEAN7)
], ContextMenu.prototype, "enabled", 2);
__decorateClass([
  Validate20(BOOLEAN7)
], ContextMenu.prototype, "darkTheme", 2);

// packages/ag-charts-enterprise/src/features/context-menu/contextMenuModule.ts
var ContextMenuModule = {
  type: "root",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy", "topology", "flow-proportion"],
  optionsKey: "contextMenu",
  instanceConstructor: ContextMenu,
  themeTemplate: {
    contextMenu: {
      enabled: true,
      darkTheme: import_ag_charts_community43._Theme.IS_DARK_THEME
    }
  }
};

// packages/ag-charts-enterprise/src/features/crosshair/crosshair.ts
var import_ag_charts_community45 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/crosshair/crosshairLabel.ts
var import_ag_charts_community44 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/crosshair/crosshairLabel.css
var crosshairLabel_default = ".ag-crosshair-label{position:absolute;left:0px;top:0px;user-select:none;pointer-events:none;font:12px Verdana,sans-serif;overflow:hidden;white-space:nowrap;z-index:var(--ag-charts-layer-crosshair);box-sizing:border-box}.ag-crosshair-label-content{padding:0 8px;border-radius:2px;line-height:20px;background-color:var(--ag-charts-axis-label-background-color);color:var(--ag-charts-axis-label-color)}.ag-crosshair-label-hidden{top:-10000px!important}";

// packages/ag-charts-enterprise/src/features/crosshair/crosshairLabel.ts
var { ActionOnSet: ActionOnSet2, BaseProperties: BaseProperties7, BOOLEAN: BOOLEAN8, FUNCTION: FUNCTION2, NUMBER: NUMBER7, STRING: STRING7, Validate: Validate21 } = import_ag_charts_community44._ModuleSupport;
var { setAttribute } = import_ag_charts_community44._Util;
var DEFAULT_LABEL_CLASS = "ag-crosshair-label";
var CrosshairLabelProperties = class extends import_ag_charts_community44._Scene.ChangeDetectableProperties {
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
  Validate21(BOOLEAN8)
], CrosshairLabelProperties.prototype, "enabled", 2);
__decorateClass([
  Validate21(STRING7, { optional: true })
], CrosshairLabelProperties.prototype, "className", 2);
__decorateClass([
  Validate21(NUMBER7)
], CrosshairLabelProperties.prototype, "xOffset", 2);
__decorateClass([
  Validate21(NUMBER7)
], CrosshairLabelProperties.prototype, "yOffset", 2);
__decorateClass([
  Validate21(STRING7, { optional: true })
], CrosshairLabelProperties.prototype, "format", 2);
__decorateClass([
  Validate21(FUNCTION2, { optional: true })
], CrosshairLabelProperties.prototype, "renderer", 2);
var CrosshairLabel = class extends BaseProperties7 {
  constructor(domManager) {
    super();
    this.domManager = domManager;
    this.id = import_ag_charts_community44._Util.createId(this);
    this.enabled = true;
    this.xOffset = 0;
    this.yOffset = 0;
    this.renderer = void 0;
    this.element = domManager.addChild("canvas-overlay", `crosshair-label-${this.id}`);
    this.element.classList.add(DEFAULT_LABEL_CLASS);
    setAttribute(this.element, "aria-hidden", true);
    this.domManager.addStyles("crosshair-labels", crosshairLabel_default);
  }
  show(meta) {
    const { element } = this;
    const left = meta.x + this.xOffset;
    const top = meta.y + this.yOffset;
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
    return new import_ag_charts_community44._Scene.BBox(element.clientLeft, element.clientTop, element.clientWidth, element.clientHeight);
  }
  toggle(visible) {
    this.element.classList.toggle(`ag-crosshair-label-hidden`, !visible);
  }
  destroy() {
    this.domManager.removeChild("canvas-overlay", `crosshair-label-${this.id}`);
  }
  toLabelHtml(input, defaults) {
    if (typeof input === "string") {
      return input;
    }
    defaults = defaults ?? {};
    const {
      text = defaults.text ?? "",
      color = defaults.color,
      backgroundColor = defaults.backgroundColor,
      opacity = defaults.opacity ?? 1
    } = input;
    const style = `opacity: ${opacity}; background-color: ${backgroundColor?.toLowerCase()}; color: ${color}`;
    return `<div class="ag-crosshair-label-content" style="${style}">
                    <span>${text}</span>
                </div>`;
  }
};
__decorateClass([
  Validate21(BOOLEAN8)
], CrosshairLabel.prototype, "enabled", 2);
__decorateClass([
  Validate21(STRING7, { optional: true }),
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
  Validate21(NUMBER7)
], CrosshairLabel.prototype, "xOffset", 2);
__decorateClass([
  Validate21(NUMBER7)
], CrosshairLabel.prototype, "yOffset", 2);
__decorateClass([
  Validate21(STRING7, { optional: true })
], CrosshairLabel.prototype, "format", 2);
__decorateClass([
  Validate21(FUNCTION2, { optional: true })
], CrosshairLabel.prototype, "renderer", 2);

// packages/ag-charts-enterprise/src/features/crosshair/crosshair.ts
var { Group: Group3, Line: Line2, BBox } = import_ag_charts_community45._Scene;
var { createId: createId2 } = import_ag_charts_community45._Util;
var { POSITIVE_NUMBER: POSITIVE_NUMBER6, RATIO: RATIO6, BOOLEAN: BOOLEAN9, COLOR_STRING: COLOR_STRING3, LINE_DASH: LINE_DASH3, OBJECT: OBJECT6, InteractionState: InteractionState3, Validate: Validate22, Layers: Layers3 } = import_ag_charts_community45._ModuleSupport;
var Crosshair = class extends import_ag_charts_community45._ModuleSupport.BaseModuleInstance {
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
    this.seriesRect = new BBox(0, 0, 0, 0);
    this.hoverRect = new BBox(0, 0, 0, 0);
    this.bounds = new BBox(0, 0, 0, 0);
    this.visible = false;
    this.crosshairGroup = new Group3({ layer: true, zIndex: Layers3.SERIES_CROSSHAIR_ZINDEX });
    this.lineGroup = this.crosshairGroup.appendChild(
      new Group3({
        name: `${this.id}-crosshair-lines`,
        zIndex: Layers3.SERIES_CROSSHAIR_ZINDEX
      })
    );
    this.lineGroupSelection = import_ag_charts_community45._Scene.Selection.select(this.lineGroup, Line2, false);
    this.activeHighlight = void 0;
    this.axisCtx = ctx.parent;
    this.crosshairGroup.visible = false;
    this.labels = {};
    const region = ctx.regionManager.getRegion("series");
    const mouseMoveStates = InteractionState3.Default | InteractionState3.Annotations;
    this.destroyFns.push(
      ctx.scene.attachNode(this.crosshairGroup),
      region.addListener("hover", (event) => this.onMouseMove(event), mouseMoveStates),
      region.addListener("drag", (event) => this.onMouseMove(event), mouseMoveStates),
      region.addListener("leave", () => this.onMouseOut(), mouseMoveStates),
      ctx.highlightManager.addListener("highlight-change", (event) => this.onHighlightChange(event)),
      ctx.layoutService.addListener("layout-complete", (event) => this.layout(event)),
      () => Object.entries(this.labels).forEach(([_, label]) => label.destroy())
    );
  }
  layout({ series: { rect, paddedRect, visible }, axes }) {
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
    this.bounds = buildBounds(rect, axisPosition, padding);
    const { crosshairGroup, bounds } = this;
    crosshairGroup.translationX = Math.round(bounds.x);
    crosshairGroup.translationY = Math.round(bounds.y);
    const crosshairKeys = ["pointer", ...this.axisCtx.seriesKeyProperties()];
    this.updateSelections(crosshairKeys);
    this.updateLines();
    this.updateLabels(crosshairKeys);
  }
  updateSelections(data) {
    this.lineGroupSelection.update(
      data,
      (group) => group.append(new Line2()),
      (key) => key
    );
  }
  updateLabels(keys) {
    const { labels, ctx } = this;
    keys.forEach((key) => {
      labels[key] ?? (labels[key] = new CrosshairLabel(ctx.domManager));
      this.updateLabel(labels[key]);
    });
    this.labelFormatter = this.axisCtx.scaleValueFormatter(this.label.format);
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
    const fractionDigits = (axisLayout?.label.fractionDigits ?? 0) + (isInteger ? 0 : 1);
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
    if (!this.enabled) {
      return;
    }
    const { crosshairGroup, axisCtx } = this;
    const { datum, series } = event.currentHighlight ?? {};
    const hasCrosshair = datum && (series?.axes.x?.id === axisCtx.axisId || series?.axes.y?.id === axisCtx.axisId);
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
    const { seriesRect, axisCtx } = this;
    const key = "pointer";
    const { datum, xKey = "", yKey = "" } = this.activeHighlight ?? {};
    const { offsetX, offsetY } = event;
    const x = offsetX - seriesRect.x;
    const y = offsetY - seriesRect.y;
    const isVertical = this.isVertical();
    const position = isVertical ? x : y;
    return {
      [key]: {
        position,
        value: axisCtx.continuous ? axisCtx.scaleInvert(position) : datum?.[isVertical ? xKey : yKey] ?? ""
      }
    };
  }
  getActiveHighlightData(activeHighlight) {
    const { axisCtx } = this;
    const { datum, series, xKey = "", aggregatedValue, cumulativeValue, midPoint } = activeHighlight;
    const seriesKeyProperties = series.getKeyProperties(axisCtx.direction);
    const halfBandwidth = axisCtx.scaleBandwidth() / 2;
    const matchingAxisId = series.axes[axisCtx.direction]?.id === axisCtx.axisId;
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
      const position = (this.isVertical() ? midPoint?.x : midPoint?.y) ?? 0;
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
    const {
      axisCtx: { position: axisPosition, direction: axisDirection },
      bounds,
      axisLayout
    } = this;
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
    const labelMeta = calculateAxisLabelPosition({
      x,
      y,
      labelBBox,
      bounds,
      axisPosition,
      axisDirection,
      padding
    });
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
  Validate22(BOOLEAN9)
], Crosshair.prototype, "enabled", 2);
__decorateClass([
  Validate22(COLOR_STRING3, { optional: true })
], Crosshair.prototype, "stroke", 2);
__decorateClass([
  Validate22(LINE_DASH3, { optional: true })
], Crosshair.prototype, "lineDash", 2);
__decorateClass([
  Validate22(POSITIVE_NUMBER6)
], Crosshair.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate22(POSITIVE_NUMBER6)
], Crosshair.prototype, "strokeWidth", 2);
__decorateClass([
  Validate22(RATIO6)
], Crosshair.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate22(BOOLEAN9)
], Crosshair.prototype, "snap", 2);
__decorateClass([
  Validate22(OBJECT6)
], Crosshair.prototype, "label", 2);

// packages/ag-charts-enterprise/src/features/crosshair/crosshairTheme.ts
var import_ag_charts_community46 = require("ag-charts-community");
var AXIS_CROSSHAIR_THEME = {
  crosshair: {
    enabled: true,
    snap: true,
    stroke: import_ag_charts_community46._Theme.DEFAULT_MUTED_LABEL_COLOUR,
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
      stroke: import_ag_charts_community46._Theme.DEFAULT_MUTED_LABEL_COLOUR,
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
var import_ag_charts_community47 = require("ag-charts-community");
var { BOOLEAN: BOOLEAN10, FUNCTION: FUNCTION3, ActionOnSet: ActionOnSet3, Validate: Validate23 } = import_ag_charts_community47._ModuleSupport;
var DataSource = class extends import_ag_charts_community47._ModuleSupport.BaseModuleInstance {
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
  Validate23(BOOLEAN10)
], DataSource.prototype, "enabled", 2);
__decorateClass([
  ActionOnSet3({
    newValue(getData) {
      this.updateCallback(this.enabled, getData);
    }
  }),
  Validate23(FUNCTION3)
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
  chartTypes: ["cartesian", "hierarchy", "polar", "topology", "flow-proportion"],
  instanceConstructor: DataSource,
  themeTemplate: {
    dataSource: { enabled: false }
  }
};

// packages/ag-charts-enterprise/src/features/error-bar/errorBarModule.ts
var import_ag_charts_community52 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/error-bar/errorBar.ts
var import_ag_charts_community50 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/error-bar/errorBarNode.ts
var import_ag_charts_community48 = require("ag-charts-community");
var { nearestSquaredInContainer, partialAssign, mergeDefaults } = import_ag_charts_community48._ModuleSupport;
var { BBox: BBox2 } = import_ag_charts_community48._Scene;
var HierarchicalBBox = class {
  constructor(components) {
    this.components = components;
    this.union = BBox2.merge(components);
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
var ErrorBarNode = class extends import_ag_charts_community48._Scene.Group {
  constructor() {
    super();
    this.capLength = NaN;
    this._datum = void 0;
    this.whiskerPath = new import_ag_charts_community48._Scene.Path();
    this.capsPath = new import_ag_charts_community48._Scene.Path();
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
    const desiredLength = length ?? lengthRatio * lengthRatioMultiplier;
    return Math.min(desiredLength, lengthMax);
  }
  getItemStylerParams(options, style, highlighted) {
    const { datum } = this;
    if (datum == null || options.itemStyler == null)
      return;
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = options;
    return {
      ...style,
      datum: datum.datum,
      seriesId: datum.datum.seriesId,
      xKey: datum.xKey,
      yKey: datum.yKey,
      xLowerKey,
      xUpperKey,
      yLowerKey,
      yUpperKey,
      highlighted
    };
  }
  formatStyles(style, options, highlighted) {
    let { cap: capsStyle, ...whiskerStyle } = style;
    const params = this.getItemStylerParams(options, style, highlighted);
    if (params != null && options.itemStyler != null) {
      const result = options.itemStyler(params);
      whiskerStyle = mergeDefaults(result, whiskerStyle);
      capsStyle = mergeDefaults(result?.cap, result, capsStyle);
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
    this.capLength = this.calculateCapLength(capsStyle ?? {}, capDefaults);
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
    const { capLength, whiskerPath: whisker, capsPath: caps } = this;
    const { yBar, xBar } = this.datum ?? {};
    const capOffset = capLength / 2;
    const components = [];
    if (yBar !== void 0) {
      const whiskerHeight = yBar.lowerPoint.y - yBar.upperPoint.y;
      components.push(
        new BBox2(yBar.lowerPoint.x, yBar.upperPoint.y, whisker.strokeWidth, whiskerHeight),
        new BBox2(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y, capLength, caps.strokeWidth),
        new BBox2(yBar.upperPoint.x - capOffset, yBar.upperPoint.y, capLength, caps.strokeWidth)
      );
    }
    if (xBar !== void 0) {
      const whiskerWidth = xBar.upperPoint.x - xBar.lowerPoint.x;
      components.push(
        new BBox2(xBar.lowerPoint.x, xBar.upperPoint.y, whiskerWidth, whisker.strokeWidth),
        new BBox2(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset, caps.strokeWidth, capLength),
        new BBox2(xBar.upperPoint.x, xBar.upperPoint.y - capOffset, caps.strokeWidth, capLength)
      );
    }
    this.bboxes.components = components;
    this.bboxes.union = BBox2.merge(components);
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
    const { distanceSquared } = BBox2.nearestBox(x, y, bboxes.components);
    return { nearest: this, distanceSquared };
  }
};
var ErrorBarGroup = class extends import_ag_charts_community48._Scene.Group {
  get children() {
    return super.children;
  }
  nearestSquared(x, y) {
    const { nearest, distanceSquared } = nearestSquaredInContainer(x, y, this);
    if (nearest !== void 0 && !isNaN(distanceSquared)) {
      return { datum: nearest.datum, distanceSquared };
    }
  }
};

// packages/ag-charts-enterprise/src/features/error-bar/errorBarProperties.ts
var import_ag_charts_community49 = require("ag-charts-community");
var {
  BaseProperties: BaseProperties8,
  Validate: Validate24,
  BOOLEAN: BOOLEAN11,
  COLOR_STRING: COLOR_STRING4,
  FUNCTION: FUNCTION4,
  LINE_DASH: LINE_DASH4,
  NUMBER: NUMBER8,
  OBJECT: OBJECT7,
  POSITIVE_NUMBER: POSITIVE_NUMBER7,
  RATIO: RATIO7,
  STRING: STRING8
} = import_ag_charts_community49._ModuleSupport;
var ErrorBarCap = class extends BaseProperties8 {
};
__decorateClass([
  Validate24(BOOLEAN11, { optional: true })
], ErrorBarCap.prototype, "visible", 2);
__decorateClass([
  Validate24(COLOR_STRING4, { optional: true })
], ErrorBarCap.prototype, "stroke", 2);
__decorateClass([
  Validate24(POSITIVE_NUMBER7, { optional: true })
], ErrorBarCap.prototype, "strokeWidth", 2);
__decorateClass([
  Validate24(RATIO7, { optional: true })
], ErrorBarCap.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate24(LINE_DASH4, { optional: true })
], ErrorBarCap.prototype, "lineDash", 2);
__decorateClass([
  Validate24(POSITIVE_NUMBER7, { optional: true })
], ErrorBarCap.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate24(NUMBER8, { optional: true })
], ErrorBarCap.prototype, "length", 2);
__decorateClass([
  Validate24(RATIO7, { optional: true })
], ErrorBarCap.prototype, "lengthRatio", 2);
var ErrorBarProperties = class extends BaseProperties8 {
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
  Validate24(STRING8, { optional: true })
], ErrorBarProperties.prototype, "yLowerKey", 2);
__decorateClass([
  Validate24(STRING8, { optional: true })
], ErrorBarProperties.prototype, "yLowerName", 2);
__decorateClass([
  Validate24(STRING8, { optional: true })
], ErrorBarProperties.prototype, "yUpperKey", 2);
__decorateClass([
  Validate24(STRING8, { optional: true })
], ErrorBarProperties.prototype, "yUpperName", 2);
__decorateClass([
  Validate24(STRING8, { optional: true })
], ErrorBarProperties.prototype, "xLowerKey", 2);
__decorateClass([
  Validate24(STRING8, { optional: true })
], ErrorBarProperties.prototype, "xLowerName", 2);
__decorateClass([
  Validate24(STRING8, { optional: true })
], ErrorBarProperties.prototype, "xUpperKey", 2);
__decorateClass([
  Validate24(STRING8, { optional: true })
], ErrorBarProperties.prototype, "xUpperName", 2);
__decorateClass([
  Validate24(BOOLEAN11, { optional: true })
], ErrorBarProperties.prototype, "visible", 2);
__decorateClass([
  Validate24(COLOR_STRING4, { optional: true })
], ErrorBarProperties.prototype, "stroke", 2);
__decorateClass([
  Validate24(POSITIVE_NUMBER7, { optional: true })
], ErrorBarProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate24(RATIO7, { optional: true })
], ErrorBarProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate24(LINE_DASH4, { optional: true })
], ErrorBarProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate24(POSITIVE_NUMBER7, { optional: true })
], ErrorBarProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate24(FUNCTION4, { optional: true })
], ErrorBarProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate24(OBJECT7)
], ErrorBarProperties.prototype, "cap", 2);

// packages/ag-charts-enterprise/src/features/error-bar/errorBar.ts
var {
  fixNumericExtent,
  groupAccumulativeValueProperty,
  isDefined,
  mergeDefaults: mergeDefaults2,
  valueProperty,
  ChartAxisDirection: ChartAxisDirection11
} = import_ag_charts_community50._ModuleSupport;
function toErrorBoundCartesianSeries(ctx) {
  for (const supportedType of import_ag_charts_community50.AgErrorBarSupportedSeriesTypes) {
    if (supportedType === ctx.series.type) {
      return ctx.series;
    }
  }
  throw new Error(
    `AG Charts - unsupported series type '${ctx.series.type}', error bars supported series types: ${import_ag_charts_community50.AgErrorBarSupportedSeriesTypes.join(", ")}`
  );
}
var ErrorBars = class _ErrorBars extends import_ag_charts_community50._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.properties = new ErrorBarProperties();
    const series = toErrorBoundCartesianSeries(ctx);
    const { annotationGroup, annotationSelections } = series;
    this.cartesianSeries = series;
    this.groupNode = new ErrorBarGroup({
      name: `${annotationGroup.id}-errorBars`,
      zIndex: import_ag_charts_community50._ModuleSupport.Layers.SERIES_LAYER_ZINDEX,
      zIndexSubOrder: series.getGroupZIndexSubOrder("annotation")
    });
    annotationGroup.appendChild(this.groupNode);
    this.selection = import_ag_charts_community50._Scene.Selection.select(this.groupNode, () => this.errorBarFactory());
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
    const stackCount = this.cartesianSeries.seriesGrouping?.stackCount;
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
    const props = [];
    const { cartesianSeries } = this;
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
    const { xScaleType, yScaleType } = opts;
    const groupIndex = cartesianSeries.seriesGrouping?.groupIndex ?? cartesianSeries.id;
    const groupOpts = {
      invalidValue: null,
      missingValue: 0,
      separateNegative: true,
      ...cartesianSeries.visible ? {} : { forceValue: 0 }
    };
    const makeErrorProperty = (key, id, type, scaleType) => {
      return groupAccumulativeValueProperty(
        key,
        "normal",
        "current",
        {
          id: `${id}-${type}`,
          groupId: `errorGroup-${groupIndex}-${type}`,
          ...groupOpts
        },
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
    const hasAxisErrors = direction === ChartAxisDirection11.X ? isDefined(xLowerKey) && isDefined(xUpperKey) : isDefined(yLowerKey) && isDefined(yUpperKey);
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
    return this.cartesianSeries.contextNodeData?.nodeData;
  }
  createNodeData() {
    const nodeData = this.getNodeData();
    const xScale = this.cartesianSeries.axes[ChartAxisDirection11.X]?.scale;
    const yScale = this.cartesianSeries.axes[ChartAxisDirection11.Y]?.scale;
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
      import_ag_charts_community50._Util.Logger.warnOnce(`Found [${key}] error value of type ${typeof value}. Expected number type`);
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
    const offset = (scale.bandwidth ?? 0) / 2;
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
    if (currentHighlight?.series === this.cartesianSeries) {
      this.restyleHighlightChange(currentHighlight, this.getHighlightStyle(), true);
    }
    if (previousHighlight?.series === this.cartesianSeries) {
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
var import_ag_charts_community51 = require("ag-charts-community");
var ERROR_BARS_THEME = {
  series: {
    errorBar: {
      visible: true,
      stroke: import_ag_charts_community51._Theme.DEFAULT_LABEL_COLOUR,
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
  seriesTypes: import_ag_charts_community52.AgErrorBarSupportedSeriesTypes,
  instanceConstructor: ErrorBars,
  themeTemplate: ERROR_BARS_THEME
};

// packages/ag-charts-enterprise/src/features/navigator/navigatorModule.ts
var import_ag_charts_community55 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/navigator/navigator.ts
var import_ag_charts_community54 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/navigator/miniChart.ts
var import_ag_charts_community53 = require("ag-charts-community");
var { Validate: Validate25, BOOLEAN: BOOLEAN12, POSITIVE_NUMBER: POSITIVE_NUMBER8, Layers: Layers4, ActionOnSet: ActionOnSet4, CategoryAxis, GroupedCategoryAxis } = import_ag_charts_community53._ModuleSupport;
var { Padding, Logger: Logger2 } = import_ag_charts_community53._Util;
var { Text: Text4, Group: Group4, BBox: BBox3 } = import_ag_charts_community53._Scene;
var MiniChartPadding = class {
  constructor() {
    this.top = 0;
    this.bottom = 0;
  }
};
__decorateClass([
  Validate25(POSITIVE_NUMBER8)
], MiniChartPadding.prototype, "top", 2);
__decorateClass([
  Validate25(POSITIVE_NUMBER8)
], MiniChartPadding.prototype, "bottom", 2);
var MiniChart = class extends import_ag_charts_community53._ModuleSupport.BaseModuleInstance {
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
    const seriesToDestroy = oldValue?.filter((series) => !newValue.includes(series)) ?? [];
    this.destroySeries(seriesToDestroy);
    for (const series of newValue) {
      if (oldValue?.includes(series))
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
    allSeries?.forEach((series) => {
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
      const direction = axis.direction;
      const directionAxes = directionToAxesMap[direction] ?? (directionToAxesMap[direction] = []);
      directionAxes.push(axis);
    });
    this.series.forEach((series) => {
      series.directions.forEach((direction) => {
        const directionAxes = directionToAxesMap[direction];
        if (!directionAxes) {
          Logger2.warnOnce(
            `no available axis for direction [${direction}]; check series and axes configuration.`
          );
          return;
        }
        const seriesKeys = series.getKeys(direction);
        const newAxis = this.findMatchingAxis(directionAxes, seriesKeys);
        if (!newAxis) {
          Logger2.warnOnce(
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
  async updateData(opts) {
    this.series.forEach((s) => s.setChartData(opts.data));
    if (this.miniChartAnimationPhase === "initial") {
      this.ctx.animationManager.onBatchStop(() => {
        this.miniChartAnimationPhase = "ready";
        this.series.forEach((s) => s.resetAnimation("disabled"));
      });
    }
  }
  async processData(opts) {
    if (this.series.some((s) => s.canHaveAxes)) {
      this.assignAxesToSeries();
      this.assignSeriesToAxes();
    }
    const seriesPromises = this.series.map((s) => s.processData(opts.dataController));
    await Promise.all(seriesPromises);
  }
  computeAxisPadding() {
    const padding = new Padding();
    if (!this.enabled) {
      return padding;
    }
    this.axes.forEach((axis) => {
      const { position, thickness = 0, line, label } = axis;
      if (position == null)
        return;
      let size;
      if (thickness > 0) {
        size = thickness;
      } else {
        size = (line.enabled ? line.width : 0) + (label.enabled ? (label.fontSize ?? 0) * Text4.defaultLineHeightRatio + label.padding : 0);
      }
      padding[position] = Math.ceil(size);
    });
    return padding;
  }
  async layout(width, height) {
    const { padding } = this;
    const animated = this.seriesRect != null;
    const seriesRect = new BBox3(0, 0, width, height - (padding.top + padding.bottom));
    this.seriesRect = seriesRect;
    this.seriesRoot.translationY = padding.top;
    this.seriesRoot.setClipRectInGroupCoordinateSpace(
      this.seriesRoot.inverseTransformBBox(new BBox3(0, -padding.top, width, height))
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
      axis.updatePosition();
      axis.update(void 0, animated);
    });
    await Promise.all(this.series.map((series) => series.update({ seriesRect })));
  }
};
__decorateClass([
  Validate25(BOOLEAN12)
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
        if (oldValue?.includes(axis))
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
var { ObserveChanges: ObserveChanges3 } = import_ag_charts_community54._ModuleSupport;
var Navigator = class extends import_ag_charts_community54._ModuleSupport.Navigator {
  constructor(ctx) {
    super(ctx);
    this.miniChart = new MiniChart(ctx);
  }
  async updateData(opts) {
    await this.miniChart.updateData(opts);
  }
  async processData(opts) {
    await this.miniChart.processData(opts);
  }
  async performLayout(opts) {
    const { shrinkRect } = await super.performLayout(opts);
    if (this.enabled) {
      const { top, bottom } = this.miniChart.computeAxisPadding();
      shrinkRect.shrink(top + bottom, "bottom");
      this.y -= bottom;
    }
    return { ...opts, shrinkRect };
  }
  async performCartesianLayout(opts) {
    await super.performCartesianLayout(opts);
    await this.miniChart.layout(this.width, this.height);
  }
};
__decorateClass([
  ObserveChanges3((target, value, oldValue) => {
    target.updateBackground(oldValue?.root, value?.root);
  })
], Navigator.prototype, "miniChart", 2);

// packages/ag-charts-enterprise/src/features/navigator/navigatorModule.ts
var NavigatorModule = {
  type: "root",
  optionsKey: "navigator",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  instanceConstructor: Navigator,
  themeTemplate: {
    ...import_ag_charts_community55._ModuleSupport.NavigatorModule.themeTemplate,
    navigator: {
      ...import_ag_charts_community55._ModuleSupport.NavigatorModule.themeTemplate?.navigator,
      miniChart: {
        enabled: false,
        label: {
          color: import_ag_charts_community55._Theme.DEFAULT_LABEL_COLOUR,
          fontStyle: void 0,
          fontWeight: void 0,
          fontSize: 10,
          fontFamily: import_ag_charts_community55._Theme.DEFAULT_FONT_FAMILY,
          formatter: void 0,
          padding: 0
        },
        padding: {
          top: 0,
          bottom: 0
        }
      }
    }
  }
};

// packages/ag-charts-enterprise/src/features/status-bar/statusBarModule.ts
var import_ag_charts_community57 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/status-bar/statusBar.ts
var import_ag_charts_community56 = require("ag-charts-community");
var { Validate: Validate26, OBJECT: OBJECT8, BOOLEAN: BOOLEAN13, STRING: STRING9, valueProperty: valueProperty2 } = import_ag_charts_community56._ModuleSupport;
var { Label: Label2, Text: Text5, Group: Group5 } = import_ag_charts_community56._Scene;
var StatusBarLabel = class extends Label2 {
};
var StatusBar = class extends import_ag_charts_community56._ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    super();
    this.enabled = false;
    this.openKey = void 0;
    this.highKey = void 0;
    this.lowKey = void 0;
    this.closeKey = void 0;
    this.volumeKey = void 0;
    this.title = new StatusBarLabel();
    this.positive = new StatusBarLabel();
    this.negative = new StatusBarLabel();
    this.layoutStyle = "block";
    this.id = "status-bar";
    this.data = void 0;
    this.labelGroup = new Group5({ name: "StatusBar" });
    this.labels = [
      {
        label: "O",
        title: this.labelGroup.appendChild(new Text5()),
        value: this.labelGroup.appendChild(new Text5()),
        id: "openValue",
        key: "openKey",
        domain: void 0,
        formatter: new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      },
      {
        label: "H",
        title: this.labelGroup.appendChild(new Text5()),
        value: this.labelGroup.appendChild(new Text5()),
        id: "highValue",
        key: "highKey",
        domain: void 0,
        formatter: new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      },
      {
        label: "L",
        title: this.labelGroup.appendChild(new Text5()),
        value: this.labelGroup.appendChild(new Text5()),
        id: "lowValue",
        key: "lowKey",
        domain: void 0,
        formatter: new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      },
      {
        label: "C",
        title: this.labelGroup.appendChild(new Text5()),
        value: this.labelGroup.appendChild(new Text5()),
        id: "closeValue",
        key: "closeKey",
        domain: void 0,
        formatter: new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      },
      {
        label: "Vol",
        title: this.labelGroup.appendChild(new Text5()),
        value: this.labelGroup.appendChild(new Text5()),
        id: "volumeValue",
        key: "volumeKey",
        domain: void 0,
        formatter: new Intl.NumberFormat("en-US", {
          notation: "compact",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      }
    ];
    this.highlightManager = ctx.highlightManager;
    this.labelGroup.visible = false;
    this.destroyFns.push(
      ctx.scene.attachNode(this.labelGroup, "titles"),
      ctx.layoutService.addListener("before-series", (e) => this.startPerformLayout(e)),
      ctx.highlightManager.addListener("highlight-change", () => this.updateHighlight())
    );
  }
  async processData(opts) {
    if (!this.enabled)
      return;
    const props = [];
    for (const label of this.labels) {
      const { id, key } = label;
      const datumKey = this[key];
      if (datumKey == null) {
        label.domain = void 0;
      } else {
        props.push(valueProperty2(datumKey, "number", { id }));
      }
    }
    if (props.length === 0 || this.data == null)
      return;
    const { dataController } = opts;
    const { processedData, dataModel } = await dataController.request(this.id, this.data, {
      props
    });
    for (const label of this.labels) {
      const { id, key } = label;
      const datumKey = this[key];
      if (datumKey != null) {
        label.domain = dataModel.getDomain(this, id, "value", processedData);
      }
    }
  }
  startPerformLayout(opts) {
    const { shrinkRect } = opts;
    const innerSpacing = 4;
    const outerSpacing = 12;
    const spacingAbove = 0;
    const spacingBelow = 8;
    this.labelGroup.translationX = 0;
    this.labelGroup.translationY = 0;
    if (!this.enabled)
      return { ...opts, shrinkRect };
    this.labelGroup.translationY = shrinkRect.y + spacingAbove;
    const maxFontSize = Math.max(this.title.fontSize, this.positive.fontSize, this.negative.fontSize);
    const lineHeight = maxFontSize * Text5.defaultLineHeightRatio;
    let left = 0;
    let offsetTop = 0;
    let textVAlign = "alphabetic";
    if (this.layoutStyle === "block") {
      shrinkRect.shrink(spacingAbove + lineHeight + spacingBelow, "top");
      offsetTop = maxFontSize + (lineHeight - maxFontSize) / 2;
    } else {
      const { title } = opts.positions;
      const { title: padding = 0 } = opts.padding;
      left = (title?.x ?? 0) + (title?.width ?? 0) + (title ? outerSpacing : padding);
      textVAlign = "top";
      offsetTop = spacingAbove + padding;
    }
    for (const { label, title, value, domain, formatter } of this.labels) {
      if (domain == null) {
        title.visible = false;
        value.visible = false;
        continue;
      }
      const maxValueWidth = Math.max(
        Text5.measureText(formatter.format(domain[0]), this.positive.getFont(), textVAlign, "left").width,
        Text5.measureText(formatter.format(domain[1]), this.positive.getFont(), textVAlign, "left").width,
        Text5.measureText(formatter.format(domain[0]), this.negative.getFont(), textVAlign, "left").width,
        Text5.measureText(formatter.format(domain[1]), this.negative.getFont(), textVAlign, "left").width
      );
      title.visible = true;
      value.visible = true;
      const titleMetrics = Text5.measureText(label, this.title.getFont(), textVAlign, "left");
      title.setFont(this.title);
      title.fill = this.title.color;
      title.text = label;
      title.textBaseline = textVAlign;
      title.translationY = offsetTop;
      title.translationX = left;
      left += titleMetrics.width + innerSpacing;
      value.textBaseline = textVAlign;
      value.translationY = offsetTop;
      value.translationX = left;
      left += maxValueWidth + outerSpacing;
    }
    return { ...opts, shrinkRect };
  }
  async performCartesianLayout(opts) {
    this.labelGroup.translationX = opts.seriesRect.x;
  }
  updateHighlight() {
    if (!this.enabled)
      return;
    const activeHighlight = this.highlightManager.getActiveHighlight();
    if (activeHighlight == null) {
      this.labelGroup.visible = false;
      return;
    }
    this.labelGroup.visible = true;
    const datum = activeHighlight.datum;
    const label = activeHighlight.itemId === "up" ? this.positive : this.negative;
    for (const { domain, value, key, formatter } of this.labels) {
      if (domain == null)
        continue;
      const datumKey = this[key];
      const datumValue = datumKey != null ? datum?.[datumKey] : void 0;
      value.setFont(label);
      value.fill = label.color;
      value.text = typeof datumValue === "number" ? formatter.format(datumValue) : "";
    }
  }
};
__decorateClass([
  Validate26(BOOLEAN13)
], StatusBar.prototype, "enabled", 2);
__decorateClass([
  Validate26(STRING9, { optional: true })
], StatusBar.prototype, "openKey", 2);
__decorateClass([
  Validate26(STRING9, { optional: true })
], StatusBar.prototype, "highKey", 2);
__decorateClass([
  Validate26(STRING9, { optional: true })
], StatusBar.prototype, "lowKey", 2);
__decorateClass([
  Validate26(STRING9, { optional: true })
], StatusBar.prototype, "closeKey", 2);
__decorateClass([
  Validate26(STRING9, { optional: true })
], StatusBar.prototype, "volumeKey", 2);
__decorateClass([
  Validate26(OBJECT8)
], StatusBar.prototype, "title", 2);
__decorateClass([
  Validate26(OBJECT8)
], StatusBar.prototype, "positive", 2);
__decorateClass([
  Validate26(OBJECT8)
], StatusBar.prototype, "negative", 2);
__decorateClass([
  Validate26(STRING9)
], StatusBar.prototype, "layoutStyle", 2);

// packages/ag-charts-enterprise/src/features/status-bar/statusBarModule.ts
var StatusBarModule = {
  type: "root",
  identifier: "status-bar",
  optionsKey: "statusBar",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  instanceConstructor: StatusBar,
  themeTemplate: {
    statusBar: {
      enabled: false,
      openKey: void 0,
      highKey: void 0,
      lowKey: void 0,
      closeKey: void 0,
      volumeKey: void 0,
      layoutStyle: import_ag_charts_community57._Theme.DEFAULT_CAPTION_LAYOUT_STYLE,
      title: {
        color: import_ag_charts_community57._Theme.DEFAULT_LABEL_COLOUR
      },
      positive: {
        color: import_ag_charts_community57._Theme.PALETTE_UP_STROKE
      },
      negative: {
        color: import_ag_charts_community57._Theme.PALETTE_DOWN_STROKE
      }
    }
  }
};

// packages/ag-charts-enterprise/src/features/sync/chartSync.ts
var import_ag_charts_community58 = require("ag-charts-community");
var {
  BOOLEAN: BOOLEAN14,
  STRING: STRING10,
  UNION: UNION5,
  BaseProperties: BaseProperties9,
  CartesianAxis,
  ChartUpdateType: ChartUpdateType2,
  arraysEqual,
  isDate,
  isDefined: isDefined2,
  isFiniteNumber,
  ObserveChanges: ObserveChanges4,
  TooltipManager,
  Validate: Validate27
} = import_ag_charts_community58._ModuleSupport;
var { Logger: Logger3 } = import_ag_charts_community58._Util;
var ChartSync = class extends BaseProperties9 {
  constructor(moduleContext) {
    super();
    this.moduleContext = moduleContext;
    this.enabled = false;
    this.axes = "x";
    this.nodeInteraction = true;
    this.zoom = true;
  }
  updateChart(chart, updateType = ChartUpdateType2.UPDATE_DATA) {
    chart.ctx.updateService.update(updateType, { skipSync: true });
  }
  updateSiblings(groupId) {
    const { syncManager } = this.moduleContext;
    const updateFn = async () => {
      for (const chart of syncManager.getGroupSiblings(groupId)) {
        await chart.waitForDataProcess(120);
        this.updateChart(chart);
      }
    };
    updateFn().catch((e) => {
      Logger3.warnOnce("Error updating sibling chart", e);
    });
  }
  enabledZoomSync() {
    const { syncManager, zoomManager } = this.moduleContext;
    this.disableZoomSync = zoomManager.addListener("zoom-change", () => {
      for (const chart of syncManager.getGroupSiblings(this.groupId)) {
        if (chart.modulesManager.getModule("sync")?.zoom) {
          chart.ctx.zoomManager.updateZoom("sync", this.mergeZoom(chart));
        }
      }
    });
  }
  enabledNodeInteractionSync() {
    const { highlightManager, syncManager } = this.moduleContext;
    this.disableNodeInteractionSync = highlightManager.addListener("highlight-change", (event) => {
      for (const chart of syncManager.getGroupSiblings(this.groupId)) {
        if (!chart.modulesManager.getModule("sync")?.nodeInteraction)
          continue;
        if (!event.currentHighlight?.datum) {
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
            if (!nodeData?.length)
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
          if (matchingNodes.length < 2 && matchingNodes[0]?.nodeDatum !== chart.ctx.highlightManager.getActiveHighlight()) {
            const { series, nodeDatum } = matchingNodes[0] ?? {};
            chart.ctx.highlightManager.updateHighlight(chart.id, nodeDatum);
            if (nodeDatum) {
              const offsetX = nodeDatum.midPoint?.x ?? nodeDatum.point?.x ?? 0;
              const offsetY = nodeDatum.midPoint?.y ?? nodeDatum.point?.y ?? 0;
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
            this.updateChart(chart, ChartUpdateType2.SERIES_UPDATE);
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
          Logger3.warnOnce(
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
    const { zoomManager } = this.moduleContext;
    if (this.axes === "xy") {
      return zoomManager.getZoom();
    }
    const combinedZoom = chart.zoomManager.getZoom() ?? {};
    combinedZoom[this.axes] = zoomManager.getZoom()?.[this.axes];
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
    if (this.enabled && this.nodeInteraction) {
      this.enabledNodeInteractionSync();
    } else {
      this.disableNodeInteractionSync?.();
    }
  }
  onZoomChange() {
    if (this.enabled && this.zoom) {
      this.enabledZoomSync();
    } else {
      this.disableZoomSync?.();
    }
  }
  destroy() {
    const { syncManager } = this.moduleContext;
    syncManager.unsubscribe(this.groupId);
    this.updateSiblings(this.groupId);
    this.disableZoomSync?.();
  }
};
ChartSync.className = "Sync";
__decorateClass([
  Validate27(BOOLEAN14),
  ObserveChanges4((target) => target.onEnabledChange())
], ChartSync.prototype, "enabled", 2);
__decorateClass([
  Validate27(STRING10, { optional: true }),
  ObserveChanges4((target, newValue, oldValue) => target.onGroupIdChange(newValue, oldValue))
], ChartSync.prototype, "groupId", 2);
__decorateClass([
  Validate27(UNION5(["x", "y", "xy"], "an axis")),
  ObserveChanges4((target) => target.onAxesChange())
], ChartSync.prototype, "axes", 2);
__decorateClass([
  Validate27(BOOLEAN14),
  ObserveChanges4((target) => target.onNodeInteractionChange())
], ChartSync.prototype, "nodeInteraction", 2);
__decorateClass([
  Validate27(BOOLEAN14),
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
var import_ag_charts_community68 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/zoom/scenes/zoomRect.ts
var import_ag_charts_community59 = require("ag-charts-community");
var { COLOR_STRING: COLOR_STRING5, RATIO: RATIO8, Validate: Validate28 } = import_ag_charts_community59._ModuleSupport;
var ZoomRect = class extends import_ag_charts_community59._Scene.Rect {
  constructor() {
    super(...arguments);
    this.fill = "rgb(33, 150, 243)";
    this.fillOpacity = 0.2;
  }
};
ZoomRect.className = "ZoomRect";
__decorateClass([
  Validate28(COLOR_STRING5)
], ZoomRect.prototype, "fill", 2);
__decorateClass([
  Validate28(RATIO8)
], ZoomRect.prototype, "fillOpacity", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomAxisDragger.ts
var import_ag_charts_community61 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/features/zoom/zoomUtils.ts
var import_ag_charts_community60 = require("ag-charts-community");
var { clamp: clamp2, isEqual, round } = import_ag_charts_community60._ModuleSupport;
var UNIT = { min: 0, max: 1 };
var DEFAULT_ANCHOR_POINT_X = "end";
var DEFAULT_ANCHOR_POINT_Y = "middle";
var constrain = (value, min = UNIT.min, max = UNIT.max) => clamp2(min, value, max);
function unitZoomState() {
  return { x: { ...UNIT }, y: { ...UNIT } };
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
  return {
    x: { min: zoom?.x?.min ?? UNIT.min, max: zoom?.x?.max ?? UNIT.max },
    y: { min: zoom?.y?.min ?? UNIT.min, max: zoom?.y?.max ?? UNIT.max }
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
      return scaleZoomAxisWithPoint(newState, oldState, origin ?? center);
    default:
      return { min, max };
  }
}
function scaleZoomAxisWithPoint(newState, oldState, origin) {
  const newDelta = newState.max - newState.min;
  const oldDelta = oldState.max - oldState.min;
  const scaledOrigin = origin * (1 - (oldDelta - newDelta));
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
    this.oldZoom ?? (this.oldZoom = definedZoomState(
      direction === import_ag_charts_community61._ModuleSupport.ChartAxisDirection.X ? { ...zoom, x: axisZoom } : { ...zoom, y: axisZoom }
    ));
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
      if (direction === import_ag_charts_community61._ModuleSupport.ChartAxisDirection.X)
        return newZoom.x;
      return newZoom.y;
    }
    const origin = pointToRatio(bbox, coords.x1, coords.y1);
    const target = pointToRatio(bbox, coords.x2, coords.y2);
    if (direction === import_ag_charts_community61._ModuleSupport.ChartAxisDirection.X) {
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
      type: "series",
      label: "contextMenuZoomToCursor",
      action: (params) => this.onZoomToHere(params, props)
    });
    contextMenuRegistry.registerDefaultAction({
      id: CONTEXT_PAN_ACTION_ID,
      type: "series",
      label: "contextMenuPanToCursor",
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
    if (!enabled || !rect || !event || !event.target || !(event instanceof MouseEvent))
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
    if (!enabled || !rect || !event || !event.target || !(event instanceof MouseEvent))
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
var import_ag_charts_community62 = require("ag-charts-community");
var maxZoomCoords = 16;
var decelerationValues = {
  off: 1,
  short: 0.01,
  long: 2e-3
};
var ZoomPanner = class {
  constructor() {
    this.deceleration = 1;
    this.zoomCoordsHistoryIndex = 0;
    this.coordsHistory = [];
  }
  get decelerationValue() {
    const { deceleration } = this;
    return Math.max(
      typeof deceleration === "number" ? deceleration : decelerationValues[deceleration] ?? 1,
      1e-4
    );
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
    this.updateCoords(event.offsetX, event.offsetY);
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.coords ?? {};
    this.onUpdate?.({
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
    if (deltaT > 0 && this.decelerationValue < 1) {
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
    const friction = 1 - this.decelerationValue;
    const maxS = -velocity / Math.log(friction);
    const s0 = velocity * (friction ** (prevT - t0) - 1) / Math.log(friction);
    const s1 = velocity * (friction ** (t - t0) - 1) / Math.log(friction);
    this.onUpdate?.({
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
      if (direction === import_ag_charts_community62._ModuleSupport.ChartAxisDirection.X) {
        zoom = definedZoomState({ x: currentZoom });
      } else {
        zoom = definedZoomState({ y: currentZoom });
      }
      zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), offsetY * dy(zoom)));
      if (direction === import_ag_charts_community62._ModuleSupport.ChartAxisDirection.X) {
        newZooms[axisId] = { direction, zoom: zoom.x };
      } else {
        newZooms[axisId] = { direction, zoom: zoom.y };
      }
    }
    return newZooms;
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoomRange.ts
var import_ag_charts_community63 = require("ag-charts-community");
var { AND: AND5, DATE: DATE2, NUMBER: NUMBER9, OR: OR3, ActionOnSet: ActionOnSet5, isFiniteNumber: isFiniteNumber2, isValidDate, Validate: Validate29 } = import_ag_charts_community63._ModuleSupport;
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
      this.onChange?.(this.getRange());
  }
  updateWith(fn) {
    if (!this.domain)
      return;
    let [start, end] = this.domain;
    [start, end] = fn(start, end);
    const changed = this.start !== start || this.end !== end;
    this.end = end;
    this.start = start;
    if (!changed)
      this.onChange?.(this.getRange());
  }
  extendAll() {
    if (!this.domain)
      return;
    const [start, end] = this.domain;
    const changed = this.start !== start || this.end !== end;
    this.start = start;
    this.end = end;
    if (!changed)
      this.onChange?.(this.getRange());
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
    const changed = this.domain == null || !import_ag_charts_community63._Util.areArrayItemsStrictlyEqual(this.domain, validAxisDomain);
    if (changed) {
      this.domain = validAxisDomain;
    }
    return changed;
  }
  getRangeWithValues(start, end) {
    let [d0, d1] = this.domain ?? [];
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
      this.initialStart ?? (this.initialStart = start);
      this.onChange?.(this.getRangeWithValues(start, this.end));
    }
  }),
  Validate29(AND5(
    OR3(DATE2, NUMBER9)
    /* LESS_THAN('end') */
  ), { optional: true })
], ZoomRange.prototype, "start", 2);
__decorateClass([
  ActionOnSet5({
    changeValue(end) {
      this.initialEnd ?? (this.initialEnd = end);
      this.onChange?.(this.getRangeWithValues(this.start, end));
    }
  }),
  Validate29(AND5(
    OR3(DATE2, NUMBER9)
    /* GREATER_THAN('start') */
  ), { optional: true })
], ZoomRange.prototype, "end", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomRatio.ts
var import_ag_charts_community64 = require("ag-charts-community");
var { AND: AND6, GREATER_THAN: GREATER_THAN4, LESS_THAN: LESS_THAN3, RATIO: RATIO9, ActionOnSet: ActionOnSet6, Validate: Validate30 } = import_ag_charts_community64._ModuleSupport;
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
      min: start ?? UNIT.min,
      max: end ?? UNIT.max
    };
  }
};
__decorateClass([
  ActionOnSet6({
    changeValue(start) {
      this.initialStart ?? (this.initialStart = start);
      this.onChange?.(this.getRatioWithValues(start, this.end));
    }
  }),
  Validate30(AND6(RATIO9, LESS_THAN3("end")), { optional: true })
], ZoomRatio.prototype, "start", 2);
__decorateClass([
  ActionOnSet6({
    changeValue(end) {
      this.initialEnd ?? (this.initialEnd = end);
      this.onChange?.(this.getRatioWithValues(this.start, end));
    }
  }),
  Validate30(AND6(RATIO9, GREATER_THAN4("start")), { optional: true })
], ZoomRatio.prototype, "end", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomScrollPanner.ts
var import_ag_charts_community65 = require("ag-charts-community");
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
      if (direction !== import_ag_charts_community65._ModuleSupport.ChartAxisDirection.X)
        continue;
      let zoom = definedZoomState({ x: currentZoom });
      zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), 0));
      newZooms[axisId] = { direction, zoom: zoom.x };
    }
    return newZooms;
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoomScroller.ts
var import_ag_charts_community66 = require("ag-charts-community");
var ZoomScroller = class {
  updateAxes(event, props, bbox, zooms) {
    const sourceEvent = event.sourceEvent;
    const newZooms = {};
    const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;
    const origin = pointToRatio(
      bbox,
      sourceEvent.offsetX ?? sourceEvent.clientX,
      sourceEvent.offsetY ?? sourceEvent.clientY
    );
    for (const [axisId, { direction, zoom }] of Object.entries(zooms)) {
      if (zoom == null)
        continue;
      let newZoom = { ...zoom };
      const delta3 = scrollingStep * event.deltaY * (zoom.max - zoom.min);
      if (direction === import_ag_charts_community66._ModuleSupport.ChartAxisDirection.X && isScalingX) {
        newZoom.max += delta3;
        newZoom = scaleZoomAxisWithAnchor(newZoom, zoom, anchorPointX, origin.x);
      } else if (direction === import_ag_charts_community66._ModuleSupport.ChartAxisDirection.Y && isScalingY) {
        newZoom.max += delta3;
        newZoom = scaleZoomAxisWithAnchor(newZoom, zoom, anchorPointY, origin.y);
      } else {
        continue;
      }
      newZooms[axisId] = { direction, zoom: constrainAxis(newZoom) };
    }
    return newZooms;
  }
  update(event, props, bbox, oldZoom) {
    const sourceEvent = event.sourceEvent;
    const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;
    const origin = pointToRatio(
      bbox,
      sourceEvent.offsetX ?? sourceEvent.clientX,
      sourceEvent.offsetY ?? sourceEvent.clientY
    );
    const dir = event.deltaY;
    let newZoom = definedZoomState(oldZoom);
    newZoom.x.max += isScalingX ? scrollingStep * dir * dx(oldZoom) : 0;
    newZoom.y.max += isScalingY ? scrollingStep * dir * dy(oldZoom) : 0;
    if (isScalingX) {
      newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchorPointX, origin.x);
    }
    if (isScalingY) {
      newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchorPointY, origin.y);
    }
    newZoom = constrainZoom(newZoom);
    return newZoom;
  }
  updateDelta(delta3, props, oldZoom) {
    const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;
    let newZoom = definedZoomState(oldZoom);
    newZoom.x.max += isScalingX ? scrollingStep * -delta3 * dx(oldZoom) : 0;
    newZoom.y.max += isScalingY ? scrollingStep * -delta3 * dy(oldZoom) : 0;
    if (isScalingX) {
      newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchorPointX);
    }
    if (isScalingY) {
      newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchorPointY);
    }
    newZoom = constrainZoom(newZoom);
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
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.coords ?? {};
    const x = x1 <= x2 ? x1 : x2;
    const y = y1 <= y2 ? y1 : y2;
    const width = x1 <= x2 ? x2 - x1 : x1 - x2;
    const height = y1 <= y2 ? y2 - y1 : y1 - y2;
    return { x, y, width, height };
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoomToolbar.ts
var import_ag_charts_community67 = require("ag-charts-community");
var { ChartAxisDirection: ChartAxisDirection12, ToolbarManager: ToolbarManager2 } = import_ag_charts_community67._ModuleSupport;
var ZoomToolbar = class {
  constructor(toolbarManager, zoomManager, getResetZoom, updateZoom, updateAxisZoom) {
    this.toolbarManager = toolbarManager;
    this.zoomManager = zoomManager;
    this.getResetZoom = getResetZoom;
    this.updateZoom = updateZoom;
    this.updateAxisZoom = updateAxisZoom;
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
    toolbarManager.toggleButton("zoom", "pan-start", { enabled: zoom.x.min > UNIT.min });
    toolbarManager.toggleButton("zoom", "pan-end", { enabled: zoom.x.max < UNIT.max });
    toolbarManager.toggleButton("zoom", "pan-left", { enabled: zoom.x.min > UNIT.min });
    toolbarManager.toggleButton("zoom", "pan-right", { enabled: zoom.x.max < UNIT.max });
    toolbarManager.toggleButton("zoom", "zoom-out", { enabled: !isMaxZoom });
    toolbarManager.toggleButton("zoom", "zoom-in", { enabled: !isMinZoom });
    toolbarManager.toggleButton("zoom", "reset", { enabled: !isResetZoom });
  }
  onButtonPress(event, props) {
    this.onButtonPressRanges(event, props);
    this.onButtonPressZoom(event, props);
  }
  toggleGroups(enabled) {
    this.toolbarManager?.toggleGroup("zoom", "ranges", Boolean(enabled));
    this.toolbarManager?.toggleGroup("zoom", "zoom", Boolean(enabled));
  }
  onButtonPressRanges(event, props) {
    if (!ToolbarManager2.isGroup("ranges", event))
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
    if (!ToolbarManager2.isGroup("zoom", event))
      return;
    if (props.independentAxes && event.value !== "reset") {
      const axisZooms = this.zoomManager.getAxisZooms();
      for (const [axisId, { direction, zoom }] of Object.entries(axisZooms)) {
        if (zoom == null)
          continue;
        this.onButtonPressZoomAxis(event, props, axisId, direction, zoom);
      }
    } else {
      this.onButtonPressZoomUnified(event, props);
    }
  }
  onButtonPressZoomAxis(event, props, axisId, direction, zoom) {
    if (!ToolbarManager2.isGroup("zoom", event))
      return;
    const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;
    let newZoom = { ...zoom };
    const delta3 = zoom.max - zoom.min;
    switch (event.value) {
      case "pan-start":
        newZoom.max = delta3;
        newZoom.min = 0;
        break;
      case "pan-end":
        newZoom.min = newZoom.max - delta3;
        newZoom.max = UNIT.max;
        break;
      case "pan-left":
        newZoom.min -= delta3 * scrollingStep;
        newZoom.max -= delta3 * scrollingStep;
        break;
      case "pan-right":
        newZoom.min += delta3 * scrollingStep;
        newZoom.max += delta3 * scrollingStep;
        break;
      case "zoom-in":
      case "zoom-out": {
        const isDirectionX = direction === ChartAxisDirection12.X;
        const isScalingDirection = isDirectionX && isScalingX || !isDirectionX && isScalingY;
        let scale = event.value === "zoom-in" ? 1 - scrollingStep : 1 + scrollingStep;
        if (!isScalingDirection)
          scale = 1;
        const useAnchorPointX = anchorPointX === "pointer" ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
        const useAnchorPointY = anchorPointY === "pointer" ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;
        const useAnchorPoint = isDirectionX ? useAnchorPointX : useAnchorPointY;
        newZoom.max = newZoom.min + (newZoom.max - newZoom.min) * scale;
        newZoom = scaleZoomAxisWithAnchor(newZoom, zoom, useAnchorPoint);
        break;
      }
    }
    this.updateAxisZoom(axisId, direction, constrainAxis(newZoom));
  }
  onButtonPressZoomUnified(event, props) {
    if (!ToolbarManager2.isGroup("zoom", event))
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
        zoom = translateZoom(zoom, -dx(zoom) * scrollingStep, 0);
        break;
      case "pan-right":
        zoom = translateZoom(zoom, dx(zoom) * scrollingStep, 0);
        break;
      case "zoom-in":
      case "zoom-out": {
        const scale = event.value === "zoom-in" ? 1 - scrollingStep : 1 + scrollingStep;
        const useAnchorPointX = anchorPointX === "pointer" ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
        const useAnchorPointY = anchorPointY === "pointer" ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;
        zoom = scaleZoom(zoom, isScalingX ? scale : 1, isScalingY ? scale : 1);
        zoom.x = scaleZoomAxisWithAnchor(zoom.x, oldZoom.x, useAnchorPointX);
        zoom.y = scaleZoomAxisWithAnchor(zoom.y, oldZoom.y, useAnchorPointY);
        break;
      }
    }
    this.updateZoom(constrainZoom(zoom));
  }
};

// packages/ag-charts-enterprise/src/features/zoom/zoom.ts
var {
  ARRAY: ARRAY2,
  BOOLEAN: BOOLEAN15,
  NUMBER: NUMBER10,
  RATIO: RATIO10,
  STRING: STRING11,
  UNION: UNION6,
  OR: OR4,
  ActionOnSet: ActionOnSet7,
  ChartAxisDirection: ChartAxisDirection13,
  ChartUpdateType: ChartUpdateType3,
  Validate: Validate31,
  ProxyProperty: ProxyProperty2,
  round: sharedRound,
  REGIONS: REGIONS3
} = import_ag_charts_community68._ModuleSupport;
var round2 = (value) => sharedRound(value, 10);
var ANCHOR_POINT = UNION6(["pointer", "start", "middle", "end"], "an anchor cord");
var CURSOR_ID = "zoom-cursor";
var TOOLTIP_ID = "zoom-tooltip";
var ZoomButtonsProperties = class extends import_ag_charts_community68._ModuleSupport.BaseProperties {
  constructor(onChange) {
    super();
    this.onChange = onChange;
    this.enabled = false;
    this.position = "floating-bottom";
    this.size = "small";
    this.align = "center";
  }
};
__decorateClass([
  import_ag_charts_community68._ModuleSupport.ObserveChanges((target) => {
    target.onChange();
  }),
  Validate31(BOOLEAN15)
], ZoomButtonsProperties.prototype, "enabled", 2);
__decorateClass([
  import_ag_charts_community68._ModuleSupport.ObserveChanges((target) => {
    target.onChange();
  }),
  Validate31(ARRAY2, { optional: true })
], ZoomButtonsProperties.prototype, "buttons", 2);
__decorateClass([
  Validate31(STRING11)
], ZoomButtonsProperties.prototype, "position", 2);
__decorateClass([
  Validate31(STRING11)
], ZoomButtonsProperties.prototype, "size", 2);
__decorateClass([
  Validate31(STRING11)
], ZoomButtonsProperties.prototype, "align", 2);
var Zoom = class extends import_ag_charts_community68._ModuleSupport.BaseModuleInstance {
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
    this.rangeX = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection13.X));
    this.rangeY = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection13.Y));
    this.ratioX = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection13.X));
    this.ratioY = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection13.Y));
    // Zoom methods
    this.axisDragger = new ZoomAxisDragger();
    this.panner = new ZoomPanner();
    this.scroller = new ZoomScroller();
    this.scrollPanner = new ZoomScrollPanner();
    this.deceleration = "short";
    // State
    this.dragState = 0 /* None */;
    this.minRatioX = 0;
    this.minRatioY = 0;
    const selectionRect = new ZoomRect();
    this.selector = new ZoomSelector(selectionRect);
    this.contextMenu = new ZoomContextMenu(ctx.contextMenuRegistry, ctx.zoomManager, this.updateZoom.bind(this));
    this.toolbar = new ZoomToolbar(
      ctx.toolbarManager,
      ctx.zoomManager,
      this.getResetZoom.bind(this),
      this.updateZoom.bind(this),
      this.updateAxisZoom.bind(this)
    );
    const { Default: Default4, ZoomDrag, Animation: Animation2 } = import_ag_charts_community68._ModuleSupport.InteractionState;
    const draggableState = Default4 | Animation2 | ZoomDrag;
    const clickableState = Default4 | Animation2;
    const region = ctx.regionManager.getRegion(REGIONS3.SERIES);
    const horizontalAxesRegion = ctx.regionManager.getRegion(REGIONS3.HORIZONTAL_AXES);
    const verticalAxesRegion = ctx.regionManager.getRegion(REGIONS3.VERTICAL_AXES);
    const dragStartEventType = "drag-start";
    this.destroyFns.push(
      ctx.scene.attachNode(selectionRect),
      ctx.regionManager.listenAll("dblclick", (event) => this.onDoubleClick(event), clickableState),
      ctx.regionManager.listenAll("nav-zoom", (event) => this.onNavZoom(event)),
      region.addListener("drag", (event) => this.onDrag(event), draggableState),
      region.addListener(dragStartEventType, (event) => this.onDragStart(event), draggableState),
      region.addListener("drag-end", (event) => this.onDragEnd(event), draggableState),
      verticalAxesRegion.addListener("drag", (event) => this.onDrag(event), draggableState),
      verticalAxesRegion.addListener(dragStartEventType, (event) => this.onDragStart(event), draggableState),
      verticalAxesRegion.addListener("drag-end", (event) => this.onDragEnd(event), draggableState),
      verticalAxesRegion.addListener("leave", () => this.onAxisLeave(), clickableState),
      horizontalAxesRegion.addListener("drag", (event) => this.onDrag(event), draggableState),
      horizontalAxesRegion.addListener(dragStartEventType, (event) => this.onDragStart(event), draggableState),
      horizontalAxesRegion.addListener("drag-end", (event) => this.onDragEnd(event), draggableState),
      horizontalAxesRegion.addListener("leave", () => this.onAxisLeave(), clickableState),
      region.addListener("wheel", (event) => this.onWheel(event), clickableState),
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
    this.ctx.toolbarManager.proxyGroupOptions("zoom", "zoom", buttonsJson);
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
    if (direction === ChartAxisDirection13.X) {
      x = ratioZoom;
    } else {
      y = ratioZoom;
    }
    const newZoom = constrainZoom(definedZoomState({ x, y }));
    this.updateZoom(newZoom);
  }
  onDoubleClick(event) {
    const { enabled, enableDoubleClickToReset, hoveredAxis, paddedRect } = this;
    if (!enabled || !enableDoubleClickToReset)
      return;
    const { x, y } = this.getResetZoom();
    if (hoveredAxis) {
      const { id, direction } = hoveredAxis;
      const axisZoom = direction === ChartAxisDirection13.X ? x : y;
      this.updateAxisZoom(id, direction, axisZoom);
    } else if (paddedRect?.containsPoint(event.offsetX, event.offsetY) && !event.preventZoomDblClick) {
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
    interactionManager.pushState(import_ag_charts_community68._ModuleSupport.InteractionState.ZoomDrag);
    const zoom = this.getZoom();
    switch (dragState) {
      case 1 /* Axis */:
        if (!hoveredAxis)
          break;
        const { id: axisId, direction } = hoveredAxis;
        const anchor = direction === import_ag_charts_community68._ModuleSupport.ChartAxisDirection.X ? anchorPointX : anchorPointY;
        const axisZoom = zoomManager.getAxisZoom(axisId);
        const newZoom = axisDragger.update(event, direction, anchor, seriesRect, zoom, axisZoom);
        this.updateAxisZoom(axisId, direction, newZoom);
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
    updateService.update(ChartUpdateType3.PERFORM_LAYOUT, { skipAnimations: true });
  }
  onDragEnd(_event) {
    const {
      axisDragger,
      dragState,
      enabled,
      panner,
      selector,
      ctx: { cursorManager, interactionManager, tooltipManager }
    } = this;
    interactionManager.popState(import_ag_charts_community68._ModuleSupport.InteractionState.ZoomDrag);
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
  onNavZoom(event) {
    const { enabled, enableScrolling, scroller } = this;
    if (!enabled || !enableScrolling)
      return;
    event.preventDefault();
    this.updateZoom(scroller.updateDelta(event.delta, this.getModuleProperties(), this.getZoom()));
  }
  onWheel(event) {
    const { enabled, enableAxisDragging, enablePanning, enableScrolling, hoveredAxis, paddedRect } = this;
    if (!enabled || !enableScrolling || !paddedRect)
      return;
    const isSeriesScrolling = paddedRect.containsPoint(event.offsetX, event.offsetY);
    const isAxisScrolling = enableAxisDragging && hoveredAxis != null;
    const sourceEvent = event.sourceEvent;
    const { deltaX, deltaY } = sourceEvent;
    const isHorizontalScrolling = deltaX != null && deltaY != null && Math.abs(deltaX) > Math.abs(deltaY);
    if (enablePanning && isHorizontalScrolling) {
      this.onWheelPanning(event);
    } else if (isSeriesScrolling || isAxisScrolling) {
      this.onWheelScrolling(event);
    }
  }
  onWheelPanning(event) {
    const {
      scrollingStep,
      scrollPanner,
      seriesRect,
      ctx: { zoomManager }
    } = this;
    if (!seriesRect)
      return;
    event.preventDefault();
    const newZooms = scrollPanner.update(event, scrollingStep, seriesRect, zoomManager.getAxisZooms());
    for (const [axisId, { direction, zoom }] of Object.entries(newZooms)) {
      this.updateAxisZoom(axisId, direction, zoom);
    }
  }
  onWheelScrolling(event) {
    const {
      enableAxisDragging,
      enableIndependentAxes,
      hoveredAxis,
      scroller,
      seriesRect,
      ctx: { zoomManager }
    } = this;
    if (!seriesRect)
      return;
    event.preventDefault();
    const isAxisScrolling = enableAxisDragging && hoveredAxis != null;
    let isScalingX = this.isScalingX();
    let isScalingY = this.isScalingY();
    if (isAxisScrolling) {
      isScalingX = hoveredAxis.direction === import_ag_charts_community68._ModuleSupport.ChartAxisDirection.X;
      isScalingY = !isScalingX;
    }
    const props = this.getModuleProperties({ isScalingX, isScalingY });
    if (enableIndependentAxes === true) {
      const newZooms = scroller.updateAxes(event, props, seriesRect, zoomManager.getAxisZooms());
      for (const [axisId, { direction, zoom }] of Object.entries(newZooms)) {
        if (isAxisScrolling && hoveredAxis.id !== axisId)
          continue;
        this.updateAxisZoom(axisId, direction, zoom);
      }
    } else {
      const newZoom = scroller.update(event, props, seriesRect, this.getZoom());
      this.updateZoom(newZoom);
    }
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
      cursorManager.updateCursor(CURSOR_ID, event.direction === ChartAxisDirection13.X ? "ew-resize" : "ns-resize");
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
    event.preventDefault();
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
    const [axesX, axesY] = import_ag_charts_community68._Util.bifurcate((axis) => axis.direction === ChartAxisDirection13.X, axes);
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
    for (const [axisId, { direction, zoom }] of Object.entries(newZooms)) {
      this.updateAxisZoom(axisId, direction, zoom);
    }
    tooltipManager.updateTooltip(TOOLTIP_ID);
    updateService.update(ChartUpdateType3.PERFORM_LAYOUT, { skipAnimations: true });
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
  updateAxisZoom(axisId, direction, axisZoom) {
    const {
      enableIndependentAxes,
      minRatioX,
      minRatioY,
      ctx: { zoomManager }
    } = this;
    if (!axisZoom)
      return;
    const zoom = this.getZoom();
    if (enableIndependentAxes !== true) {
      zoom[direction] = axisZoom;
      this.updateZoom(zoom);
      return;
    }
    const deltaAxis = axisZoom.max - axisZoom.min;
    const deltaOld = zoom[direction].max - zoom[direction].min;
    const minRatio = direction === ChartAxisDirection13.X ? minRatioX : minRatioY;
    if (deltaAxis <= deltaOld && deltaAxis < minRatio) {
      return;
    }
    zoomManager.updateAxisZoom("zoom", axisId, axisZoom);
  }
  getZoom() {
    return definedZoomState(this.ctx.zoomManager.getZoom());
  }
  getResetZoom() {
    const x = this.rangeX.getInitialRange() ?? this.ratioX.getInitialRatio() ?? UNIT;
    const y = this.rangeY.getInitialRange() ?? this.ratioY.getInitialRatio() ?? UNIT;
    return { x, y };
  }
  getModuleProperties(overrides) {
    return {
      anchorPointX: overrides?.anchorPointX ?? this.getAnchorPointX(),
      anchorPointY: overrides?.anchorPointY ?? this.getAnchorPointY(),
      enabled: overrides?.enabled ?? this.enabled,
      independentAxes: overrides?.independentAxes ?? this.enableIndependentAxes === true,
      isScalingX: overrides?.isScalingX ?? this.isScalingX(),
      isScalingY: overrides?.isScalingY ?? this.isScalingY(),
      minRatioX: overrides?.minRatioX ?? this.minRatioX,
      minRatioY: overrides?.minRatioY ?? this.minRatioY,
      rangeX: overrides?.rangeX ?? this.rangeX,
      scrollingStep: overrides?.scrollingStep ?? this.scrollingStep
    };
  }
};
__decorateClass([
  ActionOnSet7({
    newValue(enabled) {
      this.onEnabledChange(enabled);
    }
  }),
  Validate31(BOOLEAN15)
], Zoom.prototype, "enabled", 2);
__decorateClass([
  Validate31(BOOLEAN15)
], Zoom.prototype, "enableAxisDragging", 2);
__decorateClass([
  Validate31(BOOLEAN15)
], Zoom.prototype, "enableDoubleClickToReset", 2);
__decorateClass([
  Validate31(BOOLEAN15, { optional: true })
], Zoom.prototype, "enableIndependentAxes", 2);
__decorateClass([
  Validate31(BOOLEAN15)
], Zoom.prototype, "enablePanning", 2);
__decorateClass([
  Validate31(BOOLEAN15)
], Zoom.prototype, "enableScrolling", 2);
__decorateClass([
  Validate31(BOOLEAN15)
], Zoom.prototype, "enableSelecting", 2);
__decorateClass([
  Validate31(UNION6(["alt", "ctrl", "meta", "shift"], "a pan key"))
], Zoom.prototype, "panKey", 2);
__decorateClass([
  Validate31(UNION6(["x", "y", "xy"], "an axis"))
], Zoom.prototype, "axes", 2);
__decorateClass([
  Validate31(RATIO10)
], Zoom.prototype, "scrollingStep", 2);
__decorateClass([
  Validate31(NUMBER10.restrict({ min: 1 }))
], Zoom.prototype, "minVisibleItemsX", 2);
__decorateClass([
  Validate31(NUMBER10.restrict({ min: 1 }))
], Zoom.prototype, "minVisibleItemsY", 2);
__decorateClass([
  Validate31(ANCHOR_POINT)
], Zoom.prototype, "anchorPointX", 2);
__decorateClass([
  Validate31(ANCHOR_POINT)
], Zoom.prototype, "anchorPointY", 2);
__decorateClass([
  ProxyProperty2("panner.deceleration"),
  Validate31(OR4(RATIO10, UNION6(["off", "short", "long"], "a deceleration")))
], Zoom.prototype, "deceleration", 2);

// packages/ag-charts-enterprise/src/features/zoom/zoomModule.ts
var buttons = {
  enabled: true,
  buttons: [
    {
      icon: "zoom-out",
      tooltip: "toolbarZoomZoomOut",
      value: "zoom-out",
      section: "scale"
    },
    {
      icon: "zoom-in",
      tooltip: "toolbarZoomZoomIn",
      value: "zoom-in",
      section: "scale"
    },
    {
      icon: "pan-left",
      tooltip: "toolbarZoomPanLeft",
      value: "pan-left",
      section: "pan"
    },
    {
      icon: "pan-right",
      tooltip: "toolbarZoomPanRight",
      value: "pan-right",
      section: "pan"
    },
    {
      icon: "reset",
      tooltip: "toolbarZoomReset",
      value: "reset",
      section: "reset"
    }
  ]
};
var ZoomModule = {
  type: "root",
  optionsKey: "zoom",
  packageType: "enterprise",
  chartTypes: ["cartesian", "topology"],
  dependencies: ["toolbar"],
  instanceConstructor: Zoom,
  themeTemplate: {
    zoom: {
      anchorPointX: "end",
      anchorPointY: "middle",
      axes: "x",
      buttons,
      enabled: false,
      enableAxisDragging: true,
      enableDoubleClickToReset: true,
      enablePanning: true,
      enableScrolling: true,
      enableSelecting: false,
      deceleration: "short",
      minVisibleItemsX: 2,
      minVisibleItemsY: 2,
      panKey: "alt",
      scrollingStep: 0.1
    }
  }
};

// packages/ag-charts-enterprise/src/gradient-legend/gradientLegendModule.ts
var import_ag_charts_community70 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/gradient-legend/gradientLegend.ts
var import_ag_charts_community69 = require("ag-charts-community");
var { BOOLEAN: BOOLEAN16, OBJECT: OBJECT9, Layers: Layers5, POSITION, Validate: Validate32, POSITIVE_NUMBER: POSITIVE_NUMBER9, ProxyProperty: ProxyProperty3 } = import_ag_charts_community69._ModuleSupport;
var { BBox: BBox4, Group: Group6, Rect, LinearGradientFill, Triangle } = import_ag_charts_community69._Scene;
var { createId: createId3 } = import_ag_charts_community69._Util;
var GradientBar = class {
  constructor() {
    this.thickness = 16;
    this.preferredLength = 100;
  }
};
__decorateClass([
  Validate32(POSITIVE_NUMBER9)
], GradientBar.prototype, "thickness", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER9)
], GradientBar.prototype, "preferredLength", 2);
var GradientLegendAxis = class extends import_ag_charts_community69._ModuleSupport.CartesianAxis {
  constructor(ctx) {
    super(ctx, new import_ag_charts_community69._Scale.LinearScale(), { respondsToZoom: false });
    this.colorDomain = [];
    this.nice = false;
    this.line.enabled = false;
  }
  calculateDomain() {
    this.setDomain(this.colorDomain);
  }
  getTickSize() {
    return 0;
  }
};
var GradientLegendScale = class {
  constructor(axis) {
    this.axis = axis;
  }
};
__decorateClass([
  Validate32(OBJECT9),
  ProxyProperty3("axis.label")
], GradientLegendScale.prototype, "label", 2);
__decorateClass([
  Validate32(OBJECT9),
  ProxyProperty3("axis.interval")
], GradientLegendScale.prototype, "interval", 2);
__decorateClass([
  ProxyProperty3("axis.seriesAreaPadding")
], GradientLegendScale.prototype, "padding", 2);
var GradientLegend = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.id = createId3(this);
    this.group = new Group6({ name: "legend", layer: true, zIndex: Layers5.LEGEND_ZINDEX });
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
    this.destroyFns.push(this.layoutService.addListener("start-layout", (e) => this.update(e)));
    this.highlightManager = ctx.highlightManager;
    this.destroyFns.push(this.highlightManager.addListener("highlight-change", () => this.onChartHoverChange()));
    this.gradientRect = new Rect();
    this.gradientFill = new LinearGradientFill();
    this.gradientFill.mask = this.gradientRect;
    this.group.append(this.gradientFill);
    this.arrow = new Triangle();
    this.group.append(this.arrow);
    this.axisGridGroup = new Group6({ name: "legend-axis-grid-group" });
    this.group.append(this.axisGridGroup);
    this.axisGroup = new Group6({ name: "legend-axis-group" });
    this.group.append(this.axisGroup);
    this.axis = new GradientLegendAxis(ctx);
    this.axis.attachAxis(this.axisGroup, this.axisGridGroup);
    this.scale = new GradientLegendScale(this.axis);
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
    this.group.parent?.removeChild(this.group);
  }
  update(ctx) {
    const { shrinkRect } = ctx;
    const data = this.data[0];
    if (!this.enabled || !data || !data.enabled) {
      this.group.visible = false;
      return { ...ctx, shrinkRect: shrinkRect.clone() };
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
    return { ...ctx, shrinkRect: newShrinkRect };
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
    const { reverseOrder, gradientFill, gradientRect } = this;
    const { preferredLength: gradientLength, thickness } = this.gradient;
    const gradientBox = new BBox4(0, 0, 0, 0);
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
    gradientFill.stops = colorRange;
    if (vertical) {
      gradientFill.direction = reverseOrder ? "to-bottom" : "to-top";
    } else {
      gradientFill.direction = reverseOrder ? "to-left" : "to-right";
    }
    gradientRect.x = gradientBox.x;
    gradientRect.y = gradientBox.y;
    gradientRect.width = gradientBox.width;
    gradientRect.height = gradientBox.height;
    return gradientBox;
  }
  updateAxis(data, gradientBox) {
    const { reverseOrder, axis } = this;
    const vertical = this.getOrientation() === "vertical";
    const positiveAxis = reverseOrder !== vertical;
    axis.position = vertical ? "right" : "bottom";
    axis.colorDomain = positiveAxis ? data.colorDomain.slice().reverse() : data.colorDomain;
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
    const {
      arrow,
      axis: { label, scale }
    } = this;
    const highlighted = this.highlightManager.getActiveHighlight();
    const colorValue = highlighted?.colorValue;
    if (highlighted == null || colorValue == null) {
      arrow.visible = false;
      return;
    }
    const vertical = this.getOrientation() === "vertical";
    const size = label.fontSize ?? 0;
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
  Validate32(BOOLEAN16)
], GradientLegend.prototype, "enabled", 2);
__decorateClass([
  Validate32(POSITION)
], GradientLegend.prototype, "position", 2);
__decorateClass([
  Validate32(BOOLEAN16, { optional: true })
], GradientLegend.prototype, "reverseOrder", 2);
__decorateClass([
  Validate32(POSITIVE_NUMBER9)
], GradientLegend.prototype, "spacing", 2);

// packages/ag-charts-enterprise/src/gradient-legend/gradientLegendModule.ts
var GradientLegendModule = {
  type: "legend",
  optionsKey: "gradientLegend",
  packageType: "enterprise",
  chartTypes: ["cartesian", "polar", "hierarchy", "topology", "flow-proportion"],
  identifier: "gradient",
  instanceConstructor: GradientLegend,
  themeTemplate: {
    enabled: false,
    position: "bottom",
    spacing: 20,
    scale: {
      padding: 8,
      label: {
        color: import_ag_charts_community70._Theme.DEFAULT_LABEL_COLOUR,
        fontStyle: void 0,
        fontWeight: void 0,
        fontSize: 12,
        fontFamily: import_ag_charts_community70._Theme.DEFAULT_FONT_FAMILY,
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
    if (!this.document) {
      return false;
    }
    const win = this.document?.defaultView ?? typeof window != "undefined" ? window : void 0;
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
_LicenseManager.RELEASE_INFORMATION = "MTcyMDAyMjAyNTIyOQ==";
var LicenseManager = _LicenseManager;

// packages/ag-charts-enterprise/src/license/watermark.ts
var import_ag_charts_community71 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/license/watermark.css
var watermark_default = ".ag-watermark{position:absolute;bottom:20px;right:25px;font-weight:bold;font-family:Impact,sans-serif;font-size:19px;opacity:0.7;animation:1s ease-out 3s ag-watermark-fadeout;color:#9b9b9b;pointer-events:none;&::before{content:'';display:block;height:40px;width:170px;background-image:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU4IiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMjU4IDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMjUuNzc5IDI4LjY1N0gxMy4zNTlMMTEuMTczIDM0LjAxMkg1LjY3Mjk3TDE3LjE4MiA3LjA1OTk5SDIxLjk1M0wzMy40NjIgMzQuMDEySDI3Ljk2MkwyNS43NzYgMjguNjU3SDI1Ljc3OVpNMjQuMDY4IDI0LjM5N0wxOS41ODggMTMuNDM0TDE1LjEwNyAyNC4zOTdIMjQuMDY4Wk02Mi4wOTIgMTguODIzSDQ5LjgxN1YyMy4wODZINTYuNzc1QzU2LjU1NSAyNS4yMjIgNTUuNzU1IDI2LjkyNyA1NC4zNzIgMjguMjAyQzUyLjk4OSAyOS40NzYgNTEuMTY2IDMwLjExNSA0OC45MDkgMzAuMTE1QzQ3LjYyMiAzMC4xMTUgNDYuNDUgMjkuODg1IDQ1LjM5MyAyOS40MjNDNDQuMzU4MyAyOC45NzgxIDQzLjQzMjYgMjguMzEzOCA0Mi42OCAyNy40NzZDNDEuOTI3IDI2LjYzOSA0MS4zNDQgMjUuNjMxIDQwLjkzMSAyNC40NTNDNDAuNTE5IDIzLjI3NSA0MC4zMTEgMjEuOTcgNDAuMzExIDIwLjUzN0M0MC4zMTEgMTkuMTA1IDQwLjUxNiAxNy44IDQwLjkzMSAxNi42MjFDNDEuMzQ0IDE1LjQ0MyA0MS45MjcgMTQuNDM2IDQyLjY4IDEzLjU5OEM0My40Mzc2IDEyLjc1NzcgNDQuMzY5NiAxMi4wOTMyIDQ1LjQxMSAxMS42NTFDNDYuNDc4IDExLjE4OSA0Ny42NTYgMTAuOTYgNDguOTQ2IDEwLjk2QzUxLjYxMiAxMC45NiA1My42MzcgMTEuNjAyIDU1LjAyIDEyLjg4NUw1OC4zIDkuNjA0OTlDNTUuODE3IDcuNjY5OTkgNTIuNjc2IDYuNjk5OTkgNDguODcyIDYuNjk5OTlDNDYuNzYgNi42OTk5OSA0NC44NTMgNy4wMzQ5OSA0My4xNTQgNy43MDA5OUM0MS40NTUgOC4zNjc5OSAzOS45OTggOS4zMDM5OSAzOC43ODMgMTAuNTA0QzM3LjU2NyAxMS43MDcgMzYuNjM0IDEzLjE1OCAzNS45NzcgMTQuODU3QzM1LjMxOSAxNi41NTYgMzQuOTk0IDE4LjQ1MSAzNC45OTQgMjAuNTRDMzQuOTk0IDIyLjYzIDM1LjMyOSAyNC40OTQgMzUuOTk1IDI2LjIwNUMzNi42NjIgMjcuOTE2IDM3LjYwNSAyOS4zNzQgMzguODE3IDMwLjU3N0M0MC4wMzIgMzEuNzggNDEuNDg2IDMyLjcxMyA0My4xODggMzMuMzgzQzQ0Ljg4OCAzNC4wNDkgNDYuNzgyIDM0LjM4NCA0OC44NzIgMzQuMzg0QzUwLjk2MSAzNC4zODQgNTIuNzUgMzQuMDQ5IDU0LjM5IDMzLjM4M0M1Ni4wMzEgMzIuNzE2IDU3LjQyNiAzMS43OCA1OC41NzkgMzAuNTc3QzU5LjczMyAyOS4zNzQgNjAuNjE5IDI3LjkxNiA2MS4yMzkgMjYuMjA1QzYxLjg2IDI0LjQ5NCA2Mi4xNyAyMi42MDUgNjIuMTcgMjAuNTRDNjIuMTY5NiAxOS45Njg4IDYyLjE0NDUgMTkuMzk4IDYyLjA5NSAxOC44MjlMNjIuMDkyIDE4LjgyM1pNMTUxLjgxIDE2Ljk4MUMxNTMuNDEgMTQuNjA5IDE1Ny40MTkgMTQuMzU4IDE1OS4wMjIgMTQuMzU4VjE4LjkxQzE1Ni45NTcgMTguOTEgMTU0Ljk4NSAxOC45OTYgMTUzLjc1NyAxOS44OTJDMTUyLjUyOSAyMC43OTIgMTUxLjkxOSAyMS45ODIgMTUxLjkxOSAyMy40NjRWMzMuOTlIMTQ2Ljk2NFYxNC4zNThIMTUxLjczNkwxNTEuODEgMTYuOTgxWk0xNDMuMDExIDE0LjM2MVYzNC4wMzFIMTM4LjI0TDEzOC4xMzEgMzEuMDQ1QzEzNy40NjYgMzIuMDc2IDEzNi41NTEgMzIuOTIxOSAxMzUuNDcxIDMzLjUwNEMxMzQuMzc2IDM0LjA5OSAxMzMuMDY4IDM0LjM5NiAxMzEuNTM2IDM0LjM5NkMxMzAuMiAzNC4zOTYgMTI4Ljk2MyAzNC4xNTIgMTI3LjgyMiAzMy42NjhDMTI2LjcgMzMuMTk2NCAxMjUuNjg5IDMyLjQ5NSAxMjQuODU1IDMxLjYwOUMxMjQuMDE4IDMwLjcyMiAxMjMuMzU0IDI5LjY2MiAxMjIuODcxIDI4LjQyMkMxMjIuMzg0IDI3LjE4NSAxMjIuMTQyIDI1LjgxMSAxMjIuMTQyIDI0LjMwNEMxMjIuMTQyIDIyLjc5OCAxMjIuMzg0IDIxLjM3OCAxMjIuODcxIDIwLjExNkMxMjMuMzU3IDE4Ljg1NCAxMjQuMDE4IDE3Ljc3MiAxMjQuODU1IDE2Ljg3M0MxMjUuNjg4IDE1Ljk3NjQgMTI2LjY5OCAxNS4yNjM2IDEyNy44MjIgMTQuNzhDMTI4Ljk2MyAxNC4yODEgMTMwLjIwMyAxNC4wMzMgMTMxLjUzNiAxNC4wMzNDMTMzLjA0MyAxNC4wMzMgMTM0LjMzIDE0LjMxOCAxMzUuMzk3IDE0Ljg4OEMxMzYuNDYyIDE1LjQ1ODkgMTM3LjM3NSAxNi4yNzggMTM4LjA1NyAxNy4yNzZWMTQuMzYxSDE0My4wMTFaTTEzMi42MzEgMzAuMTMzQzEzNC4yNTYgMzAuMTMzIDEzNS41NjcgMjkuNTk0IDEzNi41NjUgMjguNTEyQzEzNy41NjEgMjcuNDMgMTM4LjA2IDI1Ljk5MSAxMzguMDYgMjQuMTk2QzEzOC4wNiAyMi40MDEgMTM3LjU2MSAyMC45OSAxMzYuNTY1IDE5Ljg5OUMxMzUuNTcgMTguODA3IDEzNC4yNTkgMTguMjU4IDEzMi42MzEgMTguMjU4QzEzMS4wMDMgMTguMjU4IDEyOS43MjkgMTguODA0IDEyOC43MzQgMTkuODk5QzEyNy43MzggMjAuOTkzIDEyNy4yMzkgMjIuNDM4IDEyNy4yMzkgMjQuMjMzQzEyNy4yMzkgMjYuMDI4IDEyNy43MzUgMjcuNDMzIDEyOC43MzQgMjguNTE1QzEyOS43MjkgMjkuNTk0IDEzMS4wMjggMzAuMTM2IDEzMi42MzEgMzAuMTM2VjMwLjEzM1pNOTMuNjk4IDI3Ljg3NkM5My41Nzk1IDI4LjAwMjUgOTMuNDU2NCAyOC4xMjQ2IDkzLjMyOSAyOC4yNDJDOTEuOTQ3IDI5LjUxNiA5MC4xMjMgMzAuMTU1IDg3Ljg2NiAzMC4xNTVDODYuNTggMzAuMTU1IDg1LjQwOCAyOS45MjYgODQuMzUgMjkuNDY0QzgzLjMxNTUgMjkuMDE4OSA4Mi4zODk4IDI4LjM1NDYgODEuNjM3IDI3LjUxN0M4MC44ODQgMjYuNjc5IDgwLjMwMSAyNS42NzIgNzkuODg5IDI0LjQ5NEM3OS40NzYgMjMuMzE1IDc5LjI2OSAyMi4wMSA3OS4yNjkgMjAuNTc4Qzc5LjI2OSAxOS4xNDUgNzkuNDczIDE3Ljg0IDc5Ljg4OSAxNi42NjJDODAuMzAxIDE1LjQ4NCA4MC44ODQgMTQuNDc2IDgxLjYzNyAxMy42MzlDODIuMzk0OSAxMi43OTg3IDgzLjMyNzMgMTIuMTM0MiA4NC4zNjkgMTEuNjkyQzg1LjQzNiAxMS4yMyA4Ni42MTQgMTEgODcuOTAzIDExQzkwLjU3IDExIDkyLjU5NSAxMS42NDIgOTMuOTc3IDEyLjkyNkw5Ny4yNTggOS42NDQ5OUM5NC43NzQgNy43MTA5OSA5MS42MzMgNi43Mzk5OSA4Ny44MjkgNi43Mzk5OUM4NS43MTggNi43Mzk5OSA4My44MTEgNy4wNzQ5OSA4Mi4xMTIgNy43NDE5OUM4MC40MTMgOC40MDc5OSA3OC45NTYgOS4zNDQ5OSA3Ny43NCAxMC41NDVDNzYuNTI1IDExLjc0NyA3NS41OTIgMTMuMTk5IDc0LjkzNCAxNC44OThDNzQuMjc3IDE2LjU5NyA3My45NTEgMTguNDkxIDczLjk1MSAyMC41ODFDNzMuOTUxIDIyLjY3IDc0LjI4NiAyNC41MzQgNzQuOTUzIDI2LjI0NUM3NS42MTkgMjcuOTU3IDc2LjU2MiAyOS40MTQgNzcuNzc0IDMwLjYxN0M3OC45OSAzMS44MiA4MC40NDQgMzIuNzUzIDgyLjE0NiAzMy40MjNDODMuODQ1IDM0LjA5IDg1LjczOSAzNC40MjQgODcuODI5IDM0LjQyNEM4OS45MTkgMzQuNDI0IDkxLjcwOCAzNC4wOSA5My4zNDggMzMuNDIzQzk0LjcxOCAzMi44NjUgOTUuOTE4IDMyLjEyMSA5Ni45NDggMzEuMTkxQzk3LjE0OSAzMS4wMDggOTcuMzQ4IDMwLjgxNSA5Ny41MzcgMzAuNjJMOTMuNzAxIDI3Ljg4NUw5My42OTggMjcuODc2Wk0xMTAuODAyIDE0LjAxNUMxMDkuMTk5IDE0LjAxNSAxMDYuODM2IDE0LjQ3MSAxMDUuNjExIDE2LjE1OEwxMDUuNTM3IDYuMDE1OTlIMTAwLjc2NVYzMy45MzlIMTA1LjcyVjIyLjY0MUMxMDUuNzcxIDIxLjQ2MDcgMTA2LjI4OCAyMC4zNDg4IDEwNy4xNTcgMTkuNTQ4OUMxMDguMDI3IDE4Ljc0OTEgMTA5LjE3OCAxOC4zMjY2IDExMC4zNTggMTguMzc0QzExMy4zOTcgMTguMzc0IDExNC4yNjggMjEuMTU5IDExNC4yNjggMjIuNjQxVjMzLjkzOUgxMTkuMjIzVjIxLjA1OUMxMTkuMjIzIDIxLjA1OSAxMTkuMTQyIDE0LjAxNSAxMTAuODAyIDE0LjAxNVpNMTczLjc2MyAxNC4zNThIMTY5Ljk5OVY4LjcxNDk5SDE2NS4wNDhWMTQuMzU4SDE2MS4yODRWMTguOTE2SDE2NS4wNDhWMzQuMDAzSDE2OS45OTlWMTguOTE2SDE3My43NjNWMTQuMzU4Wk0xOTAuNzg3IDI1LjI2MkMxOTAuMTI5IDI0LjUwMTQgMTg5LjMwNyAyMy44OTk0IDE4OC4zODQgMjMuNTAxQzE4Ny40ODggMjMuMTE3IDE4Ni4zMzEgMjIuNzMyIDE4NC45NDggMjIuMzY0QzE4NC4xNjUgMjIuMTQzOSAxODMuMzkgMjEuODk3OCAxODIuNjIzIDIxLjYyNkMxODIuMTYzIDIxLjQ2MjEgMTgxLjc0MSAyMS4yMDY2IDE4MS4zODMgMjAuODc1QzE4MS4yMzUgMjAuNzQyMSAxODEuMTE4IDIwLjU3ODkgMTgxLjAzOSAyMC4zOTY0QzE4MC45NjEgMjAuMjE0IDE4MC45MjIgMjAuMDE2NiAxODAuOTI3IDE5LjgxOEMxODAuOTI3IDE5LjI3MiAxODEuMTU2IDE4Ljg0NCAxODEuNjI1IDE4LjUxQzE4Mi4xMjEgMTguMTU2IDE4Mi44NjIgMTcuOTc2IDE4My44MjYgMTcuOTc2QzE4NC43OSAxNy45NzYgMTg1LjU4NyAxOC4yMDkgMTg2LjE0OCAxOC42NjhDMTg2LjcwNiAxOS4xMjQgMTg3LjAwNyAxOS43MjUgMTg3LjA3MiAyMC41TDE4Ny4wOTQgMjAuNzgySDE5MS42MzNMMTkxLjYxNyAyMC40NkMxOTEuNTIxIDE4LjQ4NSAxOTAuNzcxIDE2LjkgMTg5LjM4NSAxNS43NUMxODguMDEyIDE0LjYxMiAxODYuMTg1IDE0LjAzMyAxODMuOTYyIDE0LjAzM0MxODIuNDc3IDE0LjAzMyAxODEuMTQxIDE0LjI4NyAxNzkuOTk0IDE0Ljc4NkMxNzguODMxIDE1LjI5MSAxNzcuOTI2IDE1Ljk5NSAxNzcuMjk2IDE2Ljg4MkMxNzYuNjczIDE3Ljc0NTUgMTc2LjMzOCAxOC43ODQgMTc2LjM0MSAxOS44NDlDMTc2LjM0MSAyMS4xNjcgMTc2LjY5OCAyMi4yNDkgMTc3LjM5OSAyMy4wNjRDMTc4LjA2IDIzLjg0MzIgMTc4Ljg5OCAyNC40NTM0IDE3OS44NDIgMjQuODQ0QzE4MC43NDQgMjUuMjE2IDE4MS45MjggMjUuNjA3IDE4My4zNjEgMjZDMTg0LjgwNiAyNi40MSAxODUuODcyIDI2Ljc4NSAxODYuNTMgMjcuMTIzQzE4Ny4xIDI3LjQxNCAxODcuMzc5IDI3Ljg0NSAxODcuMzc5IDI4LjQ0NEMxODcuMzc5IDI5LjA0MiAxODcuMTIyIDI5LjQ2NyAxODYuNTk1IDI5LjgzOUMxODYuMDQzIDMwLjIyNiAxODUuMjM3IDMwLjQyNSAxODQuMjAxIDMwLjQyNUMxODMuMTY2IDMwLjQyNSAxODIuMzk0IDMwLjE3NCAxODEuNzQ5IDI5LjY3NEMxODEuMTEzIDI5LjE4MSAxODAuNzcyIDI4LjU4OSAxODAuNzEgMjcuODY0TDE4MC42ODUgMjcuNTgySDE3Ni4wMTNMMTc2LjAyNSAyNy45MDFDMTc2LjA2NyAyOS4wOTU1IDE3Ni40NzIgMzAuMjQ4NyAxNzcuMTg4IDMxLjIwNkMxNzcuOTA3IDMyLjE4IDE3OC44OTMgMzIuOTU4IDE4MC4xMTggMzMuNTE5QzE4MS4zMzYgMzQuMDc3IDE4Mi43MzIgMzQuMzYyIDE4NC4yNjYgMzQuMzYyQzE4NS44MDEgMzQuMzYyIDE4Ny4xMDkgMzQuMTA4IDE4OC4yMzggMzMuNjA5QzE4OS4zNzYgMzMuMTA0IDE5MC4yNzIgMzIuMzk0IDE5MC45MDEgMzEuNDk0QzE5MS41MzQgMzAuNTkyIDE5MS44NTMgMjkuNTU0IDE5MS44NTMgMjguNDAzQzE5MS44MjggMjcuMTEgMTkxLjQ2NiAyNi4wNTMgMTkwLjc3NyAyNS4yNjJIMTkwLjc4N1oiIGZpbGw9IiM5QjlCOUIiLz4KPHBhdGggZD0iTTI0MS45ODIgMjUuNjU4MlYxNy43MTE3SDIyOC40NDFMMjIwLjQ5NCAyNS42NTgySDI0MS45ODJaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yNTcuMjM5IDUuOTUwODFIMjQwLjI2NUwyMzIuMjU1IDEzLjg5NzNIMjU3LjIzOVY1Ljk1MDgxWiIgZmlsbD0iIzlCOUI5QiIvPgo8cGF0aCBkPSJNMjEyLjYxMSAzMy42MDQ4TDIxNi42OCAyOS41MzYxSDIzMC40MTJWMzcuNDgyN0gyMTIuNjExVjMzLjYwNDhaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yMTUuNTk5IDIxLjc4MDNIMjI0LjM3MkwyMzIuMzgyIDEzLjgzMzdIMjE1LjU5OVYyMS43ODAzWiIgZmlsbD0iIzlCOUI5QiIvPgo8cGF0aCBkPSJNMjA2IDMzLjYwNDdIMjEyLjYxMUwyMjAuNDk0IDI1LjY1ODJIMjA2VjMzLjYwNDdaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yNDAuMjY1IDUuOTUwODFMMjM2LjE5NyAxMC4wMTk0SDIxMC4yNTlWMi4wNzI4OEgyNDAuMjY1VjUuOTUwODFaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=);background-repeat:no-repeat;background-size:170px 40px}> span{padding-left:0.7rem}}@keyframes ag-watermark-fadeout{from{opacity:0.5}to{opacity:0}}";

// packages/ag-charts-enterprise/src/license/watermark.ts
var { createElement: createElement5 } = import_ag_charts_community71._ModuleSupport;
function injectWatermark(domManager, text) {
  domManager.addStyles("watermark", watermark_default);
  const element = domManager.addChild("canvas-overlay", "watermark");
  const textElement = createElement5("span");
  textElement.innerText = text;
  element.addEventListener("animationend", () => {
    domManager.removeChild("canvas-overlay", "watermark");
    domManager.removeStyles("watermark");
  });
  element.classList.add("ag-watermark");
  element.appendChild(textElement);
}

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotModule.ts
var import_ag_charts_community76 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeries.ts
var import_ag_charts_community74 = require("ag-charts-community");

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
var import_ag_charts_community72 = require("ag-charts-community");
var { Group: Group7, Rect: Rect2, Line: Line3, BBox: BBox5, Selection: Selection2 } = import_ag_charts_community72._Scene;
var { Logger: Logger4 } = import_ag_charts_community72._Util;
var BoxPlotGroup = class extends Group7 {
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
  updateDatumStyles(datum, activeStyles, isVertical, isReversedValueAxis) {
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
      return new BBox5(x, y, width, height);
    };
    const {
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cornerRadius,
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
    return import_ag_charts_community72._ModuleSupport.nearestSquared(x, y, nodes).distanceSquared;
  }
  get midPoint() {
    const datum = this.datum;
    if (datum.midPoint === void 0) {
      Logger4.error("BoxPlotGroup.datum.midPoint is undefined");
      return { x: NaN, y: NaN };
    }
    return datum.midPoint;
  }
};

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeriesProperties.ts
var import_ag_charts_community73 = require("ag-charts-community");
var {
  BaseProperties: BaseProperties10,
  AbstractBarSeriesProperties,
  SeriesTooltip,
  Validate: Validate33,
  COLOR_STRING: COLOR_STRING6,
  FUNCTION: FUNCTION5,
  LINE_DASH: LINE_DASH5,
  OBJECT: OBJECT10,
  POSITIVE_NUMBER: POSITIVE_NUMBER10,
  RATIO: RATIO11,
  STRING: STRING12,
  mergeDefaults: mergeDefaults3
} = import_ag_charts_community73._ModuleSupport;
var BoxPlotSeriesCap = class extends BaseProperties10 {
  constructor() {
    super(...arguments);
    this.lengthRatio = 0.5;
  }
};
__decorateClass([
  Validate33(RATIO11)
], BoxPlotSeriesCap.prototype, "lengthRatio", 2);
var BoxPlotSeriesWhisker = class extends BaseProperties10 {
};
__decorateClass([
  Validate33(COLOR_STRING6, { optional: true })
], BoxPlotSeriesWhisker.prototype, "stroke", 2);
__decorateClass([
  Validate33(POSITIVE_NUMBER10)
], BoxPlotSeriesWhisker.prototype, "strokeWidth", 2);
__decorateClass([
  Validate33(RATIO11)
], BoxPlotSeriesWhisker.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate33(LINE_DASH5, { optional: true })
], BoxPlotSeriesWhisker.prototype, "lineDash", 2);
__decorateClass([
  Validate33(POSITIVE_NUMBER10)
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
    // Internal: Set by paletteFactory.
    this.backgroundFill = "white";
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
  Validate33(STRING12)
], BoxPlotSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate33(STRING12)
], BoxPlotSeriesProperties.prototype, "minKey", 2);
__decorateClass([
  Validate33(STRING12)
], BoxPlotSeriesProperties.prototype, "q1Key", 2);
__decorateClass([
  Validate33(STRING12)
], BoxPlotSeriesProperties.prototype, "medianKey", 2);
__decorateClass([
  Validate33(STRING12)
], BoxPlotSeriesProperties.prototype, "q3Key", 2);
__decorateClass([
  Validate33(STRING12)
], BoxPlotSeriesProperties.prototype, "maxKey", 2);
__decorateClass([
  Validate33(STRING12, { optional: true })
], BoxPlotSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate33(STRING12, { optional: true })
], BoxPlotSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate33(STRING12, { optional: true })
], BoxPlotSeriesProperties.prototype, "minName", 2);
__decorateClass([
  Validate33(STRING12, { optional: true })
], BoxPlotSeriesProperties.prototype, "q1Name", 2);
__decorateClass([
  Validate33(STRING12, { optional: true })
], BoxPlotSeriesProperties.prototype, "medianName", 2);
__decorateClass([
  Validate33(STRING12, { optional: true })
], BoxPlotSeriesProperties.prototype, "q3Name", 2);
__decorateClass([
  Validate33(STRING12, { optional: true })
], BoxPlotSeriesProperties.prototype, "maxName", 2);
__decorateClass([
  Validate33(COLOR_STRING6, { optional: true })
], BoxPlotSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate33(RATIO11)
], BoxPlotSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate33(COLOR_STRING6)
], BoxPlotSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate33(POSITIVE_NUMBER10)
], BoxPlotSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate33(RATIO11)
], BoxPlotSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate33(LINE_DASH5)
], BoxPlotSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate33(POSITIVE_NUMBER10)
], BoxPlotSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate33(POSITIVE_NUMBER10)
], BoxPlotSeriesProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate33(FUNCTION5, { optional: true })
], BoxPlotSeriesProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate33(OBJECT10)
], BoxPlotSeriesProperties.prototype, "cap", 2);
__decorateClass([
  Validate33(OBJECT10)
], BoxPlotSeriesProperties.prototype, "whisker", 2);
__decorateClass([
  Validate33(OBJECT10)
], BoxPlotSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate33(COLOR_STRING6)
], BoxPlotSeriesProperties.prototype, "backgroundFill", 2);

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeries.ts
var {
  extent,
  extractDecoratedProperties,
  fixNumericExtent: fixNumericExtent2,
  keyProperty,
  mergeDefaults: mergeDefaults4,
  SeriesNodePickMode,
  SMALLEST_KEY_INTERVAL,
  valueProperty: valueProperty3,
  diff,
  animationValidation,
  convertValuesToScaleByDefs,
  isFiniteNumber: isFiniteNumber3,
  computeBarFocusBounds
} = import_ag_charts_community74._ModuleSupport;
var { motion } = import_ag_charts_community74._Scene;
var { ContinuousScale } = import_ag_charts_community74._Scale;
var { Color: Color2 } = import_ag_charts_community74._Util;
var BoxPlotSeriesNodeEvent = class extends import_ag_charts_community74._ModuleSupport.SeriesNodeEvent {
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
var BoxPlotSeries = class extends import_ag_charts_community74._ModuleSupport.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
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
  async processData(dataController) {
    if (!this.properties.isValid() || !this.visible)
      return;
    const { xKey, minKey, q1Key, medianKey, q3Key, maxKey } = this.properties;
    const animationEnabled = !this.ctx.animationManager.isSkipped();
    const xScale = this.getCategoryAxis()?.scale;
    const yScale = this.getValueAxis()?.scale;
    const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
    const extraProps = [];
    if (animationEnabled && this.processedData) {
      extraProps.push(diff(this.processedData));
    }
    if (animationEnabled) {
      extraProps.push(animationValidation());
    }
    const { processedData } = await this.requestDataModel(dataController, this.data, {
      props: [
        keyProperty(xKey, xScaleType, { id: `xValue` }),
        valueProperty3(minKey, yScaleType, { id: `minValue` }),
        valueProperty3(q1Key, yScaleType, { id: `q1Value` }),
        valueProperty3(medianKey, yScaleType, { id: `medianValue` }),
        valueProperty3(q3Key, yScaleType, { id: `q3Value` }),
        valueProperty3(maxKey, yScaleType, { id: `maxValue` }),
        ...isContinuousX ? [SMALLEST_KEY_INTERVAL] : [],
        ...extraProps
      ]
    });
    this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
    this.animationState.transition("updateData");
  }
  getSeriesDomain(direction) {
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
    const keysExtent = extent(keys) ?? [NaN, NaN];
    const scalePadding = isFiniteNumber3(smallestDataInterval) ? smallestDataInterval * 0.5 : 0;
    const d0 = keysExtent[0] + -scalePadding;
    const d1 = keysExtent[1] + scalePadding;
    return fixNumericExtent2([d0, d1], categoryAxis);
  }
  async createNodeData() {
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
    processedData?.data.forEach(({ datum, keys, values }) => {
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
      let focusRect;
      if (isVertical) {
        focusRect = {
          x: midPoint.x - bandwidth / 2,
          y: scaledValues.minValue,
          width: bandwidth,
          height: scaledValues.maxValue - scaledValues.minValue
        };
      } else {
        focusRect = {
          x: scaledValues.minValue,
          y: midPoint.y - bandwidth / 2,
          width: scaledValues.maxValue - scaledValues.minValue,
          height: bandwidth
        };
      }
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
        focusRect
      });
    });
    return context;
  }
  getLegendData(legendType) {
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
    if (!showInLegend || !data?.length || !xKey || legendType !== "category") {
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
          text: legendItemName ?? yName ?? id
        },
        symbols: [{ marker: { fill, fillOpacity, stroke, strokeOpacity, strokeWidth } }],
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
      return import_ag_charts_community74._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    const title = import_ag_charts_community74._Util.sanitizeHtml(yName);
    const contentData = [
      [xKey, xName, xAxis],
      [minKey, minName, yAxis],
      [q1Key, q1Name, yAxis],
      [medianKey, medianName, yAxis],
      [q3Key, q3Name, yAxis],
      [maxKey, maxName, yAxis]
    ];
    const content = contentData.map(([key, name, axis]) => import_ag_charts_community74._Util.sanitizeHtml(`${name ?? key}: ${axis.formatDatum(datum[key])}`)).join(title ? "<br/>" : ", ");
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
        color: fill ?? formatFill
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
  async updateDatumSelection(opts) {
    const data = opts.nodeData ?? [];
    return opts.datumSelection.update(data);
  }
  async updateDatumNodes({
    datumSelection,
    isHighlight: highlighted
  }) {
    const isVertical = this.isVertical();
    const isReversedValueAxis = this.getValueAxis()?.isReversed();
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
  }
  async updateLabelNodes(_opts) {
  }
  async updateLabelSelection(opts) {
    const { labelData, labelSelection } = opts;
    return labelSelection.update(labelData);
  }
  nodeFactory() {
    return new BoxPlotGroup();
  }
  getFormattedStyles(nodeDatum, highlighted = false) {
    const {
      id: seriesId,
      ctx: { callbackCache },
      properties
    } = this;
    const { xKey, minKey, q1Key, medianKey, q3Key, maxKey, itemStyler, backgroundFill, cornerRadius } = properties;
    const { datum, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } = nodeDatum;
    let fill;
    let fillOpacity;
    const useFakeFill = true;
    if (useFakeFill) {
      fill = nodeDatum.fill;
      fillOpacity = properties.fillOpacity;
    } else {
      try {
        fill = Color2.mix(
          Color2.fromString(backgroundFill),
          Color2.fromString(nodeDatum.fill),
          properties.fillOpacity
        ).toString();
      } catch {
        fill = nodeDatum.fill;
      }
      fillOpacity = void 0;
    }
    const activeStyles = {
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cornerRadius,
      cap: extractDecoratedProperties(cap),
      whisker: extractDecoratedProperties(whisker)
    };
    if (itemStyler) {
      const formatStyles = callbackCache.call(itemStyler, {
        datum,
        seriesId,
        highlighted,
        ...activeStyles,
        xKey,
        minKey,
        q1Key,
        medianKey,
        q3Key,
        maxKey
      });
      if (formatStyles) {
        return mergeDefaults4(formatStyles, activeStyles);
      }
    }
    return activeStyles;
  }
  computeFocusBounds({ datumIndex, seriesRect }) {
    return computeBarFocusBounds(
      this.contextNodeData?.nodeData[datumIndex].focusRect,
      this.contentGroup,
      seriesRect
    );
  }
};
BoxPlotSeries.className = "BoxPlotSeries";
BoxPlotSeries.type = "box-plot";

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotThemes.ts
var import_ag_charts_community75 = require("ag-charts-community");
var BOX_PLOT_SERIES_THEME = {
  series: {
    direction: "vertical",
    // @todo(AG-11876) Use fillOpacity to match area, range area, radar area, chord, and sankey series
    // fillOpacity: 0.3,
    strokeWidth: 2
  },
  axes: {
    [import_ag_charts_community75._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        snap: false
      }
    },
    [import_ag_charts_community75._Theme.CARTESIAN_AXIS_TYPE.CATEGORY]: {
      groupPaddingInner: 0.2,
      crosshair: {
        enabled: false,
        snap: false
      }
    }
  }
};

// packages/ag-charts-enterprise/src/series/box-plot/boxPlotModule.ts
var { Color: Color3 } = import_ag_charts_community76._Util;
var BoxPlotModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "box-plot",
  instanceConstructor: BoxPlotSeries,
  tooltipDefaults: { range: "exact" },
  defaultAxes: [
    {
      type: import_ag_charts_community76._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community76._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community76._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community76._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: BOX_PLOT_SERIES_THEME,
  groupable: true,
  paletteFactory: ({ takeColors, themeTemplateParameters }) => {
    const themeBackgroundColor = themeTemplateParameters.get(import_ag_charts_community76._Theme.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? "white";
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    let fakeFill;
    try {
      fakeFill = Color3.mix(Color3.fromString(backgroundFill), Color3.fromString(fill), 0.3).toString();
    } catch {
      fakeFill = fill;
    }
    return {
      fill: fakeFill,
      stroke,
      backgroundFill
    };
  },
  swapDefaultAxesCondition: ({ direction }) => direction === "horizontal"
};

// packages/ag-charts-enterprise/src/series/bullet/bulletModule.ts
var import_ag_charts_community80 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/bullet/bulletSeries.ts
var import_ag_charts_community78 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/bullet/bulletSeriesProperties.ts
var import_ag_charts_community77 = require("ag-charts-community");
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties2,
  BaseProperties: BaseProperties11,
  PropertiesArray: PropertiesArray2,
  SeriesTooltip: SeriesTooltip2,
  Validate: Validate34,
  ARRAY: ARRAY3,
  COLOR_STRING: COLOR_STRING7,
  LINE_DASH: LINE_DASH6,
  OBJECT: OBJECT11,
  POSITIVE_NUMBER: POSITIVE_NUMBER11,
  RATIO: RATIO12,
  STRING: STRING13
} = import_ag_charts_community77._ModuleSupport;
var TargetStyle = class extends BaseProperties11 {
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
  Validate34(COLOR_STRING7)
], TargetStyle.prototype, "fill", 2);
__decorateClass([
  Validate34(RATIO12)
], TargetStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate34(COLOR_STRING7)
], TargetStyle.prototype, "stroke", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER11)
], TargetStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate34(RATIO12)
], TargetStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate34(LINE_DASH6)
], TargetStyle.prototype, "lineDash", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER11)
], TargetStyle.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate34(RATIO12)
], TargetStyle.prototype, "lengthRatio", 2);
var BulletScale = class extends BaseProperties11 {
};
__decorateClass([
  Validate34(POSITIVE_NUMBER11, { optional: true })
], BulletScale.prototype, "max", 2);
var BulletColorRange = class extends BaseProperties11 {
  constructor() {
    super(...arguments);
    this.color = "lightgrey";
  }
};
__decorateClass([
  Validate34(COLOR_STRING7)
], BulletColorRange.prototype, "color", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER11, { optional: true })
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
  Validate34(STRING13)
], BulletSeriesProperties.prototype, "valueKey", 2);
__decorateClass([
  Validate34(STRING13, { optional: true })
], BulletSeriesProperties.prototype, "valueName", 2);
__decorateClass([
  Validate34(STRING13, { optional: true })
], BulletSeriesProperties.prototype, "targetKey", 2);
__decorateClass([
  Validate34(STRING13, { optional: true })
], BulletSeriesProperties.prototype, "targetName", 2);
__decorateClass([
  Validate34(COLOR_STRING7)
], BulletSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate34(RATIO12)
], BulletSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate34(COLOR_STRING7)
], BulletSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER11)
], BulletSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate34(RATIO12)
], BulletSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate34(LINE_DASH6)
], BulletSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate34(POSITIVE_NUMBER11)
], BulletSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate34(RATIO12)
], BulletSeriesProperties.prototype, "widthRatio", 2);
__decorateClass([
  Validate34(ARRAY3.restrict({ minLength: 0 }))
], BulletSeriesProperties.prototype, "colorRanges", 2);
__decorateClass([
  Validate34(OBJECT11)
], BulletSeriesProperties.prototype, "target", 2);
__decorateClass([
  Validate34(OBJECT11)
], BulletSeriesProperties.prototype, "scale", 2);
__decorateClass([
  Validate34(OBJECT11)
], BulletSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate34(COLOR_STRING7)
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
  valueProperty: valueProperty4,
  createDatumId,
  computeBarFocusBounds: computeBarFocusBounds2
} = import_ag_charts_community78._ModuleSupport;
var { fromToMotion } = import_ag_charts_community78._Scene.motion;
var { sanitizeHtml, Color: Color4 } = import_ag_charts_community78._Util;
var STYLING_KEYS = [
  "fill",
  "fillOpacity",
  "stroke",
  "strokeWidth",
  "strokeOpacity",
  "lineDash",
  "lineDashOffset"
];
var BulletSeries = class extends import_ag_charts_community78._ModuleSupport.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      directionKeys: { y: ["targetKey", "valueKey"] },
      directionNames: { y: ["targetName", "valueName"] },
      pickModes: [
        import_ag_charts_community78._ModuleSupport.SeriesNodePickMode.NEAREST_NODE,
        import_ag_charts_community78._ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH
      ],
      hasHighlightedLabels: true,
      animationResetFns: {
        datum: resetBarSelectionsFn
      }
    });
    this.properties = new BulletSeriesProperties();
    this.normalizedColorRanges = [];
    this.colorRangesGroup = new import_ag_charts_community78._Scene.Group({ name: `${this.id}-colorRanges` });
    this.colorRangesSelection = import_ag_charts_community78._Scene.Selection.select(this.colorRangesGroup, import_ag_charts_community78._Scene.Rect, false);
    this.rootGroup.append(this.colorRangesGroup);
    this.targetLinesSelection = import_ag_charts_community78._Scene.Selection.select(this.annotationGroup, import_ag_charts_community78._Scene.Line, false);
  }
  destroy() {
    this.rootGroup.removeChild(this.colorRangesGroup);
    super.destroy();
  }
  async processData(dataController) {
    if (!this.properties.isValid() || !this.data || !this.visible)
      return;
    const { valueKey, targetKey } = this.properties;
    const xScale = this.getCategoryAxis()?.scale;
    const yScale = this.getValueAxis()?.scale;
    const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
    const extraProps = [];
    if (targetKey !== void 0) {
      extraProps.push(valueProperty4(targetKey, yScaleType, { id: "target" }));
    }
    if (!this.ctx.animationManager.isSkipped()) {
      if (this.processedData !== void 0) {
        extraProps.push(diff2(this.processedData));
      }
      extraProps.push(animationValidation2());
    }
    await this.requestDataModel(dataController, this.data.slice(0, 1), {
      props: [
        keyProperty2(valueKey, xScaleType, { id: "xValue" }),
        valueProperty4(valueKey, yScaleType, { id: "value" }),
        ...extraProps
      ],
      groupByKeys: true
    });
    this.animationState.transition("updateData");
  }
  getBandScalePadding() {
    return { inner: 0, outer: 0 };
  }
  getMaxValue() {
    return Math.max(...this.getValueAxis()?.dataDomain.domain ?? [0]);
  }
  getSeriesDomain(direction) {
    const { dataModel, processedData } = this;
    if (!dataModel || !processedData) {
      return [];
    }
    const { valueKey, targetKey, valueName, scale } = this.properties;
    if (direction === this.getCategoryDirection()) {
      return [valueName ?? valueKey];
    }
    if (direction == this.getValueAxis()?.direction) {
      const valueDomain = dataModel.getDomain(this, "value", "value", processedData);
      const targetDomain = targetKey === void 0 ? [] : dataModel.getDomain(this, "target", "value", processedData);
      return [0, scale.max ?? Math.max(...valueDomain, ...targetDomain)];
    }
    throw new Error(`unknown direction ${direction}`);
  }
  getKeys(direction) {
    if (direction === this.getBarDirection()) {
      return [this.properties.valueKey];
    }
    return super.getKeys(direction);
  }
  async createNodeData() {
    const { dataModel, processedData } = this;
    const {
      valueKey,
      targetKey,
      widthRatio,
      target: { lengthRatio }
    } = this.properties;
    const xScale = this.getCategoryAxis()?.scale;
    const yScale = this.getValueAxis()?.scale;
    if (!valueKey || !dataModel || !processedData || !xScale || !yScale)
      return;
    if (widthRatio === void 0 || lengthRatio === void 0)
      return;
    const multiplier = xScale.bandwidth ?? NaN;
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
        import_ag_charts_community78._Util.Logger.warnOnce("negative values are not supported, clipping to 0.");
      }
      const xValue = this.properties.valueName ?? this.properties.valueKey;
      const yValue = Math.min(maxValue, Math.max(0, values[0][valueIndex]));
      const y = yScale.convert(yValue);
      const barWidth = widthRatio * multiplier;
      const bottomY = yScale.convert(0);
      const barAlongX = this.getBarDirection() === import_ag_charts_community78._ModuleSupport.ChartAxisDirection.X;
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
        import_ag_charts_community78._Util.Logger.warnOnce("negative targets are not supported, ignoring.");
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
      const nodeData = {
        series: this,
        datum: datum[0],
        xKey: valueKey,
        xValue,
        yKey: valueKey,
        yValue,
        cumulativeValue: yValue,
        target,
        ...rect,
        midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
        opacity: 1
      };
      context.nodeData.push(nodeData);
    }
    const sortedRanges = [...this.getColorRanges()].sort((a, b) => (a.stop ?? maxValue) - (b.stop ?? maxValue));
    let start = 0;
    this.normalizedColorRanges = sortedRanges.map((item) => {
      const stop = Math.min(maxValue, item.stop ?? Infinity);
      const result = { color: item.color, start, stop };
      start = stop;
      return result;
    });
    return context;
  }
  getColorRanges() {
    const { colorRanges, fill, backgroundFill } = this.properties;
    if (colorRanges !== void 0 && colorRanges.length > 0) {
      return colorRanges;
    }
    const defaultColorRange = new BulletColorRange();
    try {
      defaultColorRange.color = Color4.mix(
        Color4.fromString(fill),
        Color4.fromString(backgroundFill),
        0.7
      ).toString();
    } catch {
      defaultColorRange.color = fill;
    }
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
      return import_ag_charts_community78._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const makeLine = (key, name, value) => {
      const nameString = sanitizeHtml(name ?? key);
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
    return new import_ag_charts_community78._Scene.Rect();
  }
  async updateDatumSelection(opts) {
    this.targetLinesSelection.update(opts.nodeData, void 0, void 0);
    return opts.datumSelection.update(opts.nodeData, void 0, void 0);
  }
  async updateDatumNodes(opts) {
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
  }
  async updateColorRanges() {
    const valAxis = this.getValueAxis();
    const catAxis = this.getCategoryAxis();
    if (!valAxis || !catAxis)
      return;
    const [min, max] = [0, Math.max(...catAxis.scale.range)];
    const computeRect = this.getBarDirection() === import_ag_charts_community78._ModuleSupport.ChartAxisDirection.Y ? (rect, colorRange) => {
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
  }
  async updateNodes(highlightedItems, seriesHighlighted, anySeriesItemEnabled) {
    await super.updateNodes(highlightedItems, seriesHighlighted, anySeriesItemEnabled);
    await this.updateColorRanges();
  }
  async updateLabelSelection(opts) {
    return opts.labelSelection;
  }
  async updateLabelNodes(_opts) {
  }
  animateEmptyUpdateReady(data) {
    const { datumSelection, annotationSelections } = data;
    const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, "normal"));
    fromToMotion(this.id, "nodes", this.ctx.animationManager, [datumSelection], fns);
    seriesLabelFadeInAnimation(this, "annotations", this.ctx.animationManager, ...annotationSelections);
  }
  animateWaitingUpdateReady(data) {
    const { datumSelection, annotationSelections } = data;
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    const dataDiff = this.processedData?.reduced?.diff;
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
    const hasMotion = dataDiff?.changed ?? true;
    if (hasMotion) {
      seriesLabelFadeInAnimation(this, "annotations", this.ctx.animationManager, ...annotationSelections);
    }
  }
  computeFocusBounds({ datumIndex, seriesRect }) {
    return computeBarFocusBounds2(this.contextNodeData?.nodeData[datumIndex], this.contentGroup, seriesRect);
  }
};

// packages/ag-charts-enterprise/src/series/bullet/bulletThemes.ts
var import_ag_charts_community79 = require("ag-charts-community");
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
    [import_ag_charts_community79._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
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
  tooltipDefaults: { range: "exact" },
  defaultAxes: [
    {
      type: import_ag_charts_community80._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community80._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community80._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community80._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: BULLET_SERIES_THEME,
  swapDefaultAxesCondition: (series) => series?.direction === "horizontal",
  paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(colorsCount);
    const themeBackgroundColor = themeTemplateParameters.get(import_ag_charts_community80._Theme.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? "white";
    const targetStroke = themeTemplateParameters.get(import_ag_charts_community80._Theme.DEFAULT_CROSS_LINES_COLOUR);
    return {
      fill,
      stroke,
      target: { stroke: targetStroke },
      backgroundFill
    };
  }
};

// packages/ag-charts-enterprise/src/series/candlestick/candlestickModule.ts
var import_ag_charts_community87 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeries.ts
var import_ag_charts_community85 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/ohlc/ohlcSeriesBase.ts
var import_ag_charts_community82 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/candlestick/candlestickUtil.ts
var import_ag_charts_community81 = require("ag-charts-community");
var { computeBarFocusBounds: computeBarFocusBounds3, NODE_UPDATE_STATE_TO_PHASE_MAPPING } = import_ag_charts_community81._ModuleSupport;
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
  const candleDatum = series.getNodeData()?.at(opts.datumIndex);
  const datum = !candleDatum ? void 0 : {
    x: candleDatum.scaledValues.xValue,
    y: candleDatum.scaledValues.highValue,
    width: candleDatum.bandwidth,
    height: candleDatum.scaledValues.lowValue - candleDatum.scaledValues.highValue
  };
  return computeBarFocusBounds3(datum, series.contentGroup, opts.seriesRect);
}

// packages/ag-charts-enterprise/src/series/ohlc/ohlcSeriesBase.ts
var { motion: motion2 } = import_ag_charts_community82._Scene;
var {
  extent: extent2,
  fixNumericExtent: fixNumericExtent3,
  keyProperty: keyProperty3,
  SeriesNodePickMode: SeriesNodePickMode2,
  SMALLEST_KEY_INTERVAL: SMALLEST_KEY_INTERVAL2,
  valueProperty: valueProperty5,
  diff: diff3,
  animationValidation: animationValidation3,
  convertValuesToScaleByDefs: convertValuesToScaleByDefs2,
  isFiniteNumber: isFiniteNumber4
} = import_ag_charts_community82._ModuleSupport;
var { sanitizeHtml: sanitizeHtml2, Logger: Logger5 } = import_ag_charts_community82._Util;
var { ContinuousScale: ContinuousScale2 } = import_ag_charts_community82._Scale;
var CandlestickSeriesNodeEvent = class extends import_ag_charts_community82._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.openKey = series.properties.openKey;
    this.closeKey = series.properties.closeKey;
    this.highKey = series.properties.highKey;
    this.lowKey = series.properties.lowKey;
  }
};
var OhlcSeriesBase = class extends import_ag_charts_community82._ModuleSupport.AbstractBarSeries {
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
    const { processedData } = this;
    const difference = processedData?.reduced?.diff;
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
  async processData(dataController) {
    if (!this.properties.isValid() || !this.visible)
      return;
    const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;
    const animationEnabled = !this.ctx.animationManager.isSkipped();
    const xScale = this.getCategoryAxis()?.scale;
    const yScale = this.getValueAxis()?.scale;
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
        valueProperty5(openKey, yScaleType, {
          id: `openValue`,
          invalidValue: void 0,
          missingValue: void 0
        })
      );
    }
    const { processedData } = await this.requestDataModel(dataController, this.data, {
      props: [
        keyProperty3(xKey, xScaleType, { id: `xValue` }),
        valueProperty5(closeKey, yScaleType, { id: `closeValue` }),
        valueProperty5(highKey, yScaleType, { id: `highValue` }),
        valueProperty5(lowKey, yScaleType, { id: `lowValue` }),
        ...isContinuousX ? [SMALLEST_KEY_INTERVAL2] : [],
        ...extraProps
      ]
    });
    this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
    this.animationState.transition("updateData");
  }
  getSeriesDomain(direction) {
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
    const keysExtent = extent2(keys) ?? [NaN, NaN];
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
    const nodeData = [];
    const { xKey, highKey, lowKey } = this.properties;
    const defs = dataModel.resolveProcessedDataDefsByIds(this, [
      "xValue",
      "openValue",
      "closeValue",
      "highValue",
      "lowValue"
    ]);
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
    processedData?.data.forEach(({ datum, keys, values }) => {
      const { xValue, openValue, closeValue, highValue, lowValue } = dataModel.resolveProcessedDataDefsValues(
        defs,
        { keys, values }
      );
      const validLowValue = lowValue != null && lowValue <= openValue && lowValue <= closeValue;
      const validHighValue = highValue != null && highValue >= openValue && highValue >= closeValue;
      if (!validLowValue) {
        Logger5.warnOnce(
          `invalid low value for key [${lowKey}] in data element, low value cannot be higher than datum open or close values`
        );
        return;
      }
      if (!validHighValue) {
        Logger5.warnOnce(
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
      const isRising = closeValue > openValue;
      const itemId = this.getSeriesItemType(isRising);
      const [y, yBottom] = isRising ? [scaledValues.openValue, scaledValues.closeValue] : [scaledValues.closeValue, scaledValues.openValue];
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
        openValue,
        closeValue,
        highValue,
        lowValue,
        // CRT-340 Use atleast 1px width to prevent nothing being drawn.
        bandwidth: barWidth >= 1 ? barWidth : groupScale.rawBandwidth,
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
  getLegendData(legendType) {
    const { id, data } = this;
    const {
      xKey,
      yName,
      item: { up, down },
      showInLegend,
      legendItemName,
      visible
    } = this.properties;
    if (!showInLegend || !data?.length || !xKey || legendType !== "category") {
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
          text: legendItemName ?? yName ?? id
        },
        symbols: [
          {
            marker: {
              fill: up.fill ?? up.stroke,
              fillOpacity: up.fillOpacity ?? 1,
              stroke: up.stroke,
              strokeWidth: up.strokeWidth ?? 1,
              strokeOpacity: up.strokeOpacity ?? 1,
              padding: 0
            }
          },
          {
            marker: {
              fill: down.fill ?? down.stroke,
              fillOpacity: down.fillOpacity ?? 1,
              stroke: down.stroke,
              strokeWidth: down.strokeWidth ?? 1,
              strokeOpacity: down.strokeOpacity ?? 1
            }
          }
        ],
        legendItemName
      }
    ];
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
      return import_ag_charts_community82._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    const capitalise = (text) => text.charAt(0).toUpperCase() + text.substring(1);
    const title = sanitizeHtml2(yName);
    const contentData = [
      [xKey, xName, xAxis],
      [openKey, openName, yAxis],
      [highKey, highName, yAxis],
      [lowKey, lowName, yAxis],
      [closeKey, closeName, yAxis]
    ];
    const content = contentData.map(([key, name, axis]) => sanitizeHtml2(`${name ?? capitalise(key)}: ${axis.formatDatum(datum[key])}`)).join("<br/>");
    const styles = this.getFormattedStyles(nodeDatum);
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: styles.stroke },
      {
        seriesId: this.id,
        highlighted: false,
        datum,
        ...styles,
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
        title,
        color: styles.fill,
        fill: styles.fill,
        itemId
      }
    );
  }
  isVertical() {
    return true;
  }
  isLabelEnabled() {
    return false;
  }
  async updateDatumSelection(opts) {
    const data = opts.nodeData ?? [];
    return opts.datumSelection.update(data);
  }
  async updateDatumNodes({
    datumSelection,
    isHighlight: highlighted
  }) {
    datumSelection.each((group, nodeDatum) => {
      const activeStyles = this.getActiveStyles(nodeDatum, highlighted);
      group.updateDatumStyles(nodeDatum, activeStyles);
    });
  }
  async updateLabelNodes(_opts) {
  }
  async updateLabelSelection(opts) {
    const { labelData, labelSelection } = opts;
    return labelSelection.update(labelData);
  }
};

// packages/ag-charts-enterprise/src/series/candlestick/candlestickGroup.ts
var import_ag_charts_community83 = require("ag-charts-community");
var { SceneChangeDetection, BBox: BBox6, RedrawType } = import_ag_charts_community83._Scene;
var CandlestickBaseGroup = class extends import_ag_charts_community83._Scene.Group {
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
    const nodes = import_ag_charts_community83._Scene.Selection.selectByClass(this, import_ag_charts_community83._Scene.Rect, import_ag_charts_community83._Scene.Line);
    return import_ag_charts_community83._ModuleSupport.nearestSquared(x, y, nodes).distanceSquared;
  }
  get midPoint() {
    const datum = this.datum;
    if (datum.midPoint === void 0) {
      import_ag_charts_community83._Util.Logger.error("CandlestickBaseGroup.datum.midPoint is undefined");
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
      new import_ag_charts_community83._Scene.Rect({ tag: 0 /* Body */ }),
      new import_ag_charts_community83._Scene.Line({ tag: 1 /* LowWick */ }),
      new import_ag_charts_community83._Scene.Line({ tag: 2 /* HighWick */ })
    ]);
  }
  updateCoordinates() {
    const { x, y, yBottom, yHigh, yLow, width, height } = this;
    const selection = import_ag_charts_community83._Scene.Selection.select(this, import_ag_charts_community83._Scene.Rect);
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
      clipBBox: new BBox6(x, y, width, height)
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
    wickStyles.strokeWidth ?? (wickStyles.strokeWidth = 1);
    const selection = import_ag_charts_community83._Scene.Selection.select(this, import_ag_charts_community83._Scene.Rect);
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

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeriesProperties.ts
var import_ag_charts_community84 = require("ag-charts-community");
var {
  BaseProperties: BaseProperties12,
  AbstractBarSeriesProperties: AbstractBarSeriesProperties3,
  SeriesTooltip: SeriesTooltip3,
  Validate: Validate35,
  COLOR_STRING: COLOR_STRING8,
  FUNCTION: FUNCTION6,
  LINE_DASH: LINE_DASH7,
  OBJECT: OBJECT12,
  POSITIVE_NUMBER: POSITIVE_NUMBER12,
  RATIO: RATIO13,
  STRING: STRING14
} = import_ag_charts_community84._ModuleSupport;
var CandlestickSeriesWick = class extends BaseProperties12 {
};
__decorateClass([
  Validate35(COLOR_STRING8, { optional: true })
], CandlestickSeriesWick.prototype, "stroke", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER12)
], CandlestickSeriesWick.prototype, "strokeWidth", 2);
__decorateClass([
  Validate35(RATIO13)
], CandlestickSeriesWick.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate35(LINE_DASH7, { optional: true })
], CandlestickSeriesWick.prototype, "lineDash", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER12)
], CandlestickSeriesWick.prototype, "lineDashOffset", 2);
var CandlestickSeriesItem = class extends BaseProperties12 {
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
  Validate35(COLOR_STRING8, { optional: true })
], CandlestickSeriesItem.prototype, "fill", 2);
__decorateClass([
  Validate35(RATIO13)
], CandlestickSeriesItem.prototype, "fillOpacity", 2);
__decorateClass([
  Validate35(COLOR_STRING8)
], CandlestickSeriesItem.prototype, "stroke", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER12)
], CandlestickSeriesItem.prototype, "strokeWidth", 2);
__decorateClass([
  Validate35(RATIO13)
], CandlestickSeriesItem.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate35(LINE_DASH7)
], CandlestickSeriesItem.prototype, "lineDash", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER12)
], CandlestickSeriesItem.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate35(POSITIVE_NUMBER12)
], CandlestickSeriesItem.prototype, "cornerRadius", 2);
__decorateClass([
  Validate35(OBJECT12)
], CandlestickSeriesItem.prototype, "wick", 2);
var CandlestickSeriesItems = class extends BaseProperties12 {
  constructor() {
    super(...arguments);
    this.up = new CandlestickSeriesItem();
    this.down = new CandlestickSeriesItem();
  }
};
__decorateClass([
  Validate35(OBJECT12)
], CandlestickSeriesItems.prototype, "up", 2);
__decorateClass([
  Validate35(OBJECT12)
], CandlestickSeriesItems.prototype, "down", 2);
var CandlestickSeriesProperties = class extends AbstractBarSeriesProperties3 {
  constructor() {
    super(...arguments);
    this.tooltip = new SeriesTooltip3();
    this.item = new CandlestickSeriesItems();
  }
};
__decorateClass([
  Validate35(STRING14)
], CandlestickSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate35(STRING14)
], CandlestickSeriesProperties.prototype, "openKey", 2);
__decorateClass([
  Validate35(STRING14)
], CandlestickSeriesProperties.prototype, "closeKey", 2);
__decorateClass([
  Validate35(STRING14)
], CandlestickSeriesProperties.prototype, "highKey", 2);
__decorateClass([
  Validate35(STRING14)
], CandlestickSeriesProperties.prototype, "lowKey", 2);
__decorateClass([
  Validate35(STRING14, { optional: true })
], CandlestickSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate35(STRING14, { optional: true })
], CandlestickSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate35(STRING14, { optional: true })
], CandlestickSeriesProperties.prototype, "openName", 2);
__decorateClass([
  Validate35(STRING14, { optional: true })
], CandlestickSeriesProperties.prototype, "closeName", 2);
__decorateClass([
  Validate35(STRING14, { optional: true })
], CandlestickSeriesProperties.prototype, "highName", 2);
__decorateClass([
  Validate35(STRING14, { optional: true })
], CandlestickSeriesProperties.prototype, "lowName", 2);
__decorateClass([
  Validate35(OBJECT12)
], CandlestickSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate35(OBJECT12)
], CandlestickSeriesProperties.prototype, "item", 2);
__decorateClass([
  Validate35(FUNCTION6, { optional: true })
], CandlestickSeriesProperties.prototype, "itemStyler", 2);

// packages/ag-charts-enterprise/src/series/candlestick/candlestickSeries.ts
var { extractDecoratedProperties: extractDecoratedProperties2, mergeDefaults: mergeDefaults5 } = import_ag_charts_community85._ModuleSupport;
var CandlestickSeries = class extends OhlcSeriesBase {
  constructor(moduleCtx) {
    super(moduleCtx, resetCandlestickSelectionsFn);
    this.properties = new CandlestickSeriesProperties();
  }
  async createNodeData() {
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
      return {
        ...datum,
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset,
        wick,
        cornerRadius
      };
    });
    return { ...baseNodeData, nodeData };
  }
  getFormattedStyles(nodeDatum, highlighted = false) {
    const {
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const { xKey, openKey, closeKey, highKey, lowKey, itemStyler } = this.properties;
    const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.getItemConfig(
      nodeDatum.itemId
    );
    if (itemStyler) {
      const formatStyles = callbackCache.call(itemStyler, {
        datum: nodeDatum.datum,
        itemId: nodeDatum.itemId,
        seriesId,
        highlighted,
        xKey,
        openKey,
        closeKey,
        highKey,
        lowKey,
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset
      });
      if (formatStyles) {
        return mergeDefaults5(formatStyles, this.getSeriesStyles(nodeDatum));
      }
    }
    return this.getSeriesStyles(nodeDatum);
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
    return activeStyles;
  }
  computeFocusBounds(opts) {
    return computeCandleFocusBounds(this, opts);
  }
};
CandlestickSeries.className = "CandleStickSeries";
CandlestickSeries.type = "candlestick";

// packages/ag-charts-enterprise/src/series/candlestick/candlestickThemes.ts
var import_ag_charts_community86 = require("ag-charts-community");
var CANDLESTICK_SERIES_THEME = {
  series: {
    highlightStyle: {
      item: { strokeWidth: 3 }
    }
  },
  animation: { enabled: false },
  axes: {
    [import_ag_charts_community86._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: {
        snap: false
      }
    },
    [import_ag_charts_community86._Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
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
  tooltipDefaults: { range: "nearest" },
  defaultAxes: [
    {
      type: import_ag_charts_community87._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community87._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community87._Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME,
      position: import_ag_charts_community87._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: CANDLESTICK_SERIES_THEME,
  groupable: false,
  paletteFactory: ({ takeColors, colorsCount, userPalette, palette }) => {
    if (userPalette === "user-indexed") {
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
    return {
      item: {
        up: palette.up,
        down: palette.down
      }
    };
  }
};

// packages/ag-charts-enterprise/src/series/chord/chordModule.ts
var import_ag_charts_community93 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/chord/chordSeries.ts
var import_ag_charts_community92 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/flow-proportion/flowProportionSeries.ts
var import_ag_charts_community89 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/flow-proportion/flowProportionUtil.ts
var import_ag_charts_community88 = require("ag-charts-community");
var { Logger: Logger6 } = import_ag_charts_community88._Util;
function computeNodeGraph(nodes, links, includeCircularReferences) {
  if (!includeCircularReferences) {
    links = removeCircularLinks(links);
  }
  const nodeGraph = /* @__PURE__ */ new Map();
  for (const datum of nodes) {
    nodeGraph.set(datum.id, {
      datum,
      linksBefore: [],
      linksAfter: [],
      maxPathLengthBefore: -1,
      maxPathLengthAfter: -1
    });
  }
  let maxPathLength = 0;
  nodeGraph.forEach((node, id) => {
    maxPathLength = Math.max(
      maxPathLength,
      computePathLength(nodeGraph, links, node, id, -1, []) + computePathLength(nodeGraph, links, node, id, 1, []) + 1
    );
  });
  return { links, nodeGraph, maxPathLength };
}
function findCircularLinks(links, link, into, stack) {
  const stackIndex = stack.indexOf(link);
  if (stackIndex !== -1) {
    for (let i = stackIndex; i < stack.length; i += 1) {
      into.add(stack[i]);
    }
    return;
  }
  stack.push(link);
  const { toNode } = link;
  for (const next of links) {
    if (next.fromNode === toNode) {
      findCircularLinks(links, next, into, stack);
    }
  }
  stack.pop();
}
function removeCircularLinks(links) {
  const circularLinks = /* @__PURE__ */ new Set();
  for (const link of links) {
    findCircularLinks(links, link, circularLinks, []);
  }
  if (circularLinks.size !== 0) {
    Logger6.warnOnce("Some links formed circular references. These will be removed from the output.");
  }
  return circularLinks.size === 0 ? links : links.filter((link) => !circularLinks.has(link));
}
function computePathLength(nodeGraph, links, node, id, direction, stack) {
  if (stack.includes(id)) {
    return Infinity;
  }
  let maxPathLength = direction === -1 ? node.maxPathLengthBefore : node.maxPathLengthAfter;
  if (maxPathLength === -1) {
    maxPathLength = 0;
    const connectedLinks = direction === -1 ? node.linksBefore : node.linksAfter;
    for (const link of links) {
      const { fromNode, toNode } = link;
      const linkId = direction === -1 ? toNode.id : fromNode.id;
      const nextNodeId = direction === -1 ? fromNode.id : toNode.id;
      const nextNode = id === linkId ? nodeGraph.get(nextNodeId) : void 0;
      if (nextNode == null)
        continue;
      connectedLinks.push({ node: nextNode, link });
      stack?.push(id);
      maxPathLength = Math.max(
        maxPathLength,
        computePathLength(nodeGraph, links, nextNode, nextNodeId, direction, stack) + 1
      );
      stack?.pop();
    }
    if (direction === -1) {
      node.maxPathLengthBefore = maxPathLength;
    } else {
      node.maxPathLengthAfter = maxPathLength;
    }
  }
  return maxPathLength;
}

// packages/ag-charts-enterprise/src/series/flow-proportion/flowProportionSeries.ts
var { DataModelSeries, DataController, Validate: Validate36, ARRAY: ARRAY4, keyProperty: keyProperty4, valueProperty: valueProperty6 } = import_ag_charts_community89._ModuleSupport;
var { Selection: Selection3, Group: Group8, Text: Text6 } = import_ag_charts_community89._Scene;
var FlowProportionSeries = class extends DataModelSeries {
  constructor() {
    super(...arguments);
    this._chartNodes = void 0;
    this.nodeCount = 0;
    this.linkCount = 0;
    this.nodesDataController = new DataController("standalone");
    this.nodesDataModel = void 0;
    this.nodesProcessedData = void 0;
    this.processedNodes = /* @__PURE__ */ new Map();
    this.linkGroup = this.contentGroup.appendChild(new Group8({ name: "linkGroup" }));
    this.nodeGroup = this.contentGroup.appendChild(new Group8({ name: "nodeGroup" }));
    this.focusLinkGroup = this.highlightNode.appendChild(new Group8({ name: "linkGroup" }));
    this.focusNodeGroup = this.highlightNode.appendChild(new Group8({ name: "nodeGroup" }));
    this.highlightLinkGroup = this.highlightNode.appendChild(new Group8({ name: "linkGroup" }));
    this.highlightNodeGroup = this.highlightNode.appendChild(new Group8({ name: "nodeGroup" }));
    this.labelSelection = Selection3.select(this.labelGroup, Text6);
    this.linkSelection = Selection3.select(
      this.linkGroup,
      () => this.linkFactory()
    );
    this.nodeSelection = Selection3.select(
      this.nodeGroup,
      () => this.nodeFactory()
    );
    this.focusLinkSelection = Selection3.select(
      this.focusLinkGroup,
      () => this.linkFactory()
    );
    this.focusNodeSelection = Selection3.select(
      this.focusNodeGroup,
      () => this.nodeFactory()
    );
    this.highlightLinkSelection = Selection3.select(
      this.highlightLinkGroup,
      () => this.linkFactory()
    );
    this.highlightNodeSelection = Selection3.select(
      this.highlightNodeGroup,
      () => this.nodeFactory()
    );
  }
  get nodes() {
    return this.properties.nodes ?? this._chartNodes;
  }
  setChartNodes(nodes) {
    this._chartNodes = nodes;
    if (this.nodes === nodes) {
      this.nodeDataRefresh = true;
    }
  }
  getNodeData() {
    return this.contextNodeData?.nodeData;
  }
  async processData(dataController) {
    const { nodesDataController, data, nodes } = this;
    if (data == null || !this.properties.isValid()) {
      return;
    }
    const { fromKey, toKey, sizeKey, idKey, labelKey } = this.properties;
    const nodesDataModelPromise = nodes != null ? nodesDataController.request(this.id, nodes, {
      props: [
        keyProperty4(idKey, void 0, { id: "idValue", includeProperty: false }),
        ...labelKey != null ? [valueProperty6(labelKey, void 0, { id: "labelValue", includeProperty: false })] : []
      ],
      groupByKeys: true
    }) : null;
    const linksDataModelPromise = this.requestDataModel(dataController, data, {
      props: [
        valueProperty6(fromKey, void 0, { id: "fromValue", includeProperty: false }),
        valueProperty6(toKey, void 0, { id: "toValue", includeProperty: false }),
        ...sizeKey != null ? [valueProperty6(sizeKey, void 0, { id: "sizeValue", includeProperty: false, missingValue: 0 })] : []
      ],
      groupByKeys: false
    });
    if (nodes != null) {
      nodesDataController.execute();
    }
    const [nodesDataModel, linksDataModel] = await Promise.all([nodesDataModelPromise, linksDataModelPromise]);
    this.nodesDataModel = nodesDataModel?.dataModel;
    this.nodesProcessedData = nodesDataModel?.processedData;
    const { fills, strokes } = this.properties;
    const processedNodes = /* @__PURE__ */ new Map();
    if (nodesDataModel == null) {
      const fromIdIdx = linksDataModel.dataModel.resolveProcessedDataIndexById(this, "fromValue");
      const toIdIdx = linksDataModel.dataModel.resolveProcessedDataIndexById(this, "toValue");
      const createImplicitNode = (id) => {
        const index = processedNodes.size;
        const label = id;
        const fill = fills[index % fills.length];
        const stroke = strokes[index % strokes.length];
        return {
          series: this,
          itemId: void 0,
          datum: {},
          // Must be a referential object for tooltips
          type: 1 /* Node */,
          index,
          id,
          label,
          fill,
          stroke
        };
      };
      linksDataModel.processedData.data.forEach(({ values }) => {
        const fromId = values[fromIdIdx];
        const toId = values[toIdIdx];
        if (fromId == null || toId == null)
          return;
        if (!processedNodes.has(fromId)) {
          processedNodes.set(fromId, createImplicitNode(fromId));
        }
        if (!processedNodes.has(toId)) {
          processedNodes.set(toId, createImplicitNode(toId));
        }
      });
    } else {
      const nodeIdIdx = nodesDataModel.dataModel.resolveProcessedDataIndexById(this, "idValue");
      const labelIdx = labelKey != null ? nodesDataModel.dataModel.resolveProcessedDataIndexById(this, "labelValue") : void 0;
      nodesDataModel.processedData.data.forEach(({ datum, keys, values }, index) => {
        const value = values[0];
        const id = keys[nodeIdIdx];
        const label = labelIdx != null ? value[labelIdx] : void 0;
        const fill = fills[index % fills.length];
        const stroke = strokes[index % strokes.length];
        processedNodes.set(id, {
          series: this,
          itemId: void 0,
          datum,
          type: 1 /* Node */,
          index,
          id,
          label,
          fill,
          stroke
        });
      });
    }
    this.processedNodes = processedNodes;
  }
  getNodeGraph(createNode, createLink, { includeCircularReferences }) {
    const { dataModel: linksDataModel, processedData: linksProcessedData } = this;
    if (linksDataModel == null || linksProcessedData == null) {
      const { links: links2, nodeGraph: nodeGraph2, maxPathLength: maxPathLength2 } = computeNodeGraph(
        (/* @__PURE__ */ new Map()).values(),
        [],
        includeCircularReferences
      );
      this.nodeCount = 0;
      this.linkCount = 0;
      return { nodeGraph: nodeGraph2, links: links2, maxPathLength: maxPathLength2 };
    }
    const { sizeKey } = this.properties;
    const fromIdIdx = linksDataModel.resolveProcessedDataIndexById(this, "fromValue");
    const toIdIdx = linksDataModel.resolveProcessedDataIndexById(this, "toValue");
    const sizeIdx = sizeKey != null ? linksDataModel.resolveProcessedDataIndexById(this, "sizeValue") : void 0;
    const nodesById = /* @__PURE__ */ new Map();
    this.processedNodes.forEach((datum) => {
      const node = createNode(datum);
      nodesById.set(datum.id, node);
    });
    const baseLinks = [];
    linksProcessedData.data.forEach(({ datum, values }, index) => {
      const fromId = values[fromIdIdx];
      const toId = values[toIdIdx];
      const size = sizeIdx != null ? values[sizeIdx] : 1;
      const fromNode = nodesById.get(fromId);
      const toNode = nodesById.get(toId);
      if (size <= 0 || fromNode == null || toNode == null)
        return;
      const link = createLink({
        series: this,
        itemId: void 0,
        datum,
        type: 0 /* Link */,
        index,
        fromNode,
        toNode,
        size
      });
      baseLinks.push(link);
    });
    const { links, nodeGraph, maxPathLength } = computeNodeGraph(
      nodesById.values(),
      baseLinks,
      includeCircularReferences
    );
    this.nodeCount = nodeGraph.size;
    this.linkCount = links.length;
    return { nodeGraph, links, maxPathLength };
  }
  async updateSelections() {
    if (this.nodeDataRefresh) {
      this.contextNodeData = await this.createNodeData();
      this.nodeDataRefresh = false;
    }
  }
  async update(opts) {
    const { seriesRect } = opts;
    const newNodeDataDependencies = {
      seriesRectWidth: seriesRect?.width ?? 0,
      seriesRectHeight: seriesRect?.height ?? 0
    };
    if (this._nodeDataDependencies == null || this._nodeDataDependencies.seriesRectWidth !== newNodeDataDependencies.seriesRectWidth || this._nodeDataDependencies.seriesRectHeight !== newNodeDataDependencies.seriesRectHeight) {
      this._nodeDataDependencies = newNodeDataDependencies;
    }
    await this.updateSelections();
    const nodeData = this.contextNodeData?.nodeData ?? [];
    const labelData = this.contextNodeData?.labelData ?? [];
    let highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
    if (highlightedDatum?.series === this && highlightedDatum.type == null) {
      const { itemId } = highlightedDatum;
      highlightedDatum = itemId != null ? nodeData.find((node) => node.type === 1 /* Node */ && node.id === itemId) : void 0;
    } else if (highlightedDatum?.series !== this) {
      highlightedDatum = void 0;
    }
    this.contentGroup.visible = this.visible;
    this.contentGroup.opacity = highlightedDatum != null ? this.properties.highlightStyle.series.dimOpacity ?? 1 : 1;
    this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection: this.labelSelection });
    await this.updateLabelNodes({ labelSelection: this.labelSelection });
    this.linkSelection = await this.updateLinkSelection({
      nodeData: nodeData.filter((d) => d.type === 0 /* Link */),
      datumSelection: this.linkSelection
    });
    await this.updateLinkNodes({ datumSelection: this.linkSelection, isHighlight: false });
    this.nodeSelection = await this.updateNodeSelection({
      nodeData: nodeData.filter((d) => d.type === 1 /* Node */),
      datumSelection: this.nodeSelection
    });
    await this.updateNodeNodes({ datumSelection: this.nodeSelection, isHighlight: false });
    let focusLinkSelection;
    let focusNodeSelection;
    let highlightLinkSelection;
    let highlightNodeSelection;
    if (highlightedDatum?.type === 1 /* Node */) {
      focusLinkSelection = nodeData.filter((node) => {
        return node.type === 0 /* Link */ && (node.toNode === highlightedDatum || node.fromNode === highlightedDatum);
      });
      focusNodeSelection = focusLinkSelection.map((link) => {
        return link.fromNode === highlightedDatum ? link.toNode : link.fromNode;
      });
      focusNodeSelection.push(highlightedDatum);
      highlightLinkSelection = [];
      highlightNodeSelection = [highlightedDatum];
    } else if (highlightedDatum?.type === 0 /* Link */) {
      focusLinkSelection = [highlightedDatum];
      focusNodeSelection = [highlightedDatum.fromNode, highlightedDatum.toNode];
      highlightLinkSelection = [highlightedDatum];
      highlightNodeSelection = [];
    } else {
      focusLinkSelection = [];
      focusNodeSelection = [];
      highlightLinkSelection = [];
      highlightNodeSelection = [];
    }
    this.focusLinkSelection = await this.updateLinkSelection({
      nodeData: focusLinkSelection,
      datumSelection: this.focusLinkSelection
    });
    await this.updateLinkNodes({ datumSelection: this.focusLinkSelection, isHighlight: false });
    this.focusNodeSelection = await this.updateNodeSelection({
      nodeData: focusNodeSelection,
      datumSelection: this.focusNodeSelection
    });
    await this.updateNodeNodes({ datumSelection: this.focusNodeSelection, isHighlight: false });
    this.highlightLinkSelection = await this.updateLinkSelection({
      nodeData: highlightLinkSelection,
      datumSelection: this.highlightLinkSelection
    });
    await this.updateLinkNodes({ datumSelection: this.highlightLinkSelection, isHighlight: true });
    this.highlightNodeSelection = await this.updateNodeSelection({
      nodeData: highlightNodeSelection,
      datumSelection: this.highlightNodeSelection
    });
    await this.updateNodeNodes({ datumSelection: this.highlightNodeSelection, isHighlight: true });
  }
  resetAnimation(_chartAnimationPhase) {
  }
  getSeriesDomain(_direction) {
    return [];
  }
  getLegendData(legendType) {
    if (legendType !== "category")
      return [];
    return Array.from(
      this.processedNodes.values(),
      ({ id, label, fill, stroke }) => ({
        legendType: "category",
        id: this.id,
        itemId: id,
        seriesId: this.id,
        enabled: true,
        label: { text: label ?? id },
        symbols: [
          {
            marker: {
              fill,
              fillOpacity: 1,
              stroke,
              strokeWidth: 0,
              strokeOpacity: 1
            }
          }
        ]
      })
    );
  }
  pickNodeClosestDatum({ x, y }) {
    let minDistanceSquared = Infinity;
    let minDatum;
    this.linkSelection.each((node, datum) => {
      const distanceSquared = node.containsPoint(x, y) ? 0 : Infinity;
      if (distanceSquared < minDistanceSquared) {
        minDistanceSquared = distanceSquared;
        minDatum = datum;
      }
    });
    this.nodeSelection.each((node, datum) => {
      const distanceSquared = node.distanceSquared(x, y);
      if (distanceSquared < minDistanceSquared) {
        minDistanceSquared = distanceSquared;
        minDatum = datum;
      }
    });
    return minDatum != null ? { datum: minDatum, distance: Math.sqrt(minDistanceSquared) } : void 0;
  }
  getDatumAriaText(datum, description) {
    if (datum.type === 0 /* Link */) {
      return this.ctx.localeManager.t("ariaAnnounceFlowProportionLink", {
        index: datum.index + 1,
        count: this.linkCount,
        from: datum.fromNode.id,
        to: datum.toNode.id,
        size: datum.size,
        sizeName: this.properties.sizeName ?? this.properties.sizeKey
      });
    } else if (datum.type === 1 /* Node */) {
      return this.ctx.localeManager.t("ariaAnnounceFlowProportionNode", {
        index: datum.index + 1,
        count: this.nodeCount,
        description
      });
    }
  }
};
__decorateClass([
  Validate36(ARRAY4, { optional: true, property: "nodes" })
], FlowProportionSeries.prototype, "_chartNodes", 2);

// packages/ag-charts-enterprise/src/series/chord/chordLink.ts
var import_ag_charts_community90 = require("ag-charts-community");
var { Path: Path5, ScenePathChangeDetection } = import_ag_charts_community90._Scene;
var ChordLink = class extends Path5 {
  constructor() {
    super(...arguments);
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 0;
    this.startAngle1 = 0;
    this.endAngle1 = 0;
    this.startAngle2 = 0;
    this.endAngle2 = 0;
    this.tension = 1;
  }
  tensionedCurveTo(cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cp3x, cp3y) {
    const { path, tension } = this;
    const scale = 1 - tension;
    path.cubicCurveTo(
      (cp1x - cp0x) * scale + cp0x,
      (cp1y - cp0y) * scale + cp0y,
      (cp2x - cp3x) * scale + cp3x,
      (cp2y - cp3y) * scale + cp3y,
      cp3x,
      cp3y
    );
  }
  updatePath() {
    const { path, centerX, centerY, radius } = this;
    let { startAngle1, endAngle1, startAngle2, endAngle2 } = this;
    if (startAngle1 > startAngle2) {
      [startAngle1, startAngle2] = [startAngle2, startAngle1];
      [endAngle1, endAngle2] = [endAngle2, endAngle1];
    }
    path.clear();
    const startX = centerX + radius * Math.cos(startAngle1);
    const startY = centerY + radius * Math.sin(startAngle1);
    path.moveTo(startX, startY);
    this.tensionedCurveTo(
      startX,
      startY,
      centerX,
      centerY,
      centerX,
      centerY,
      centerX + radius * Math.cos(endAngle2),
      centerY + radius * Math.sin(endAngle2)
    );
    path.arc(centerX, centerY, radius, endAngle2, startAngle2, true);
    this.tensionedCurveTo(
      centerX + radius * Math.cos(startAngle2),
      centerY + radius * Math.sin(startAngle2),
      centerX,
      centerY,
      centerX,
      centerY,
      centerX + radius * Math.cos(endAngle1),
      centerY + radius * Math.sin(endAngle1)
    );
    path.arc(centerX, centerY, radius, endAngle1, startAngle1, true);
    path.closePath();
  }
};
__decorateClass([
  ScenePathChangeDetection()
], ChordLink.prototype, "centerX", 2);
__decorateClass([
  ScenePathChangeDetection()
], ChordLink.prototype, "centerY", 2);
__decorateClass([
  ScenePathChangeDetection()
], ChordLink.prototype, "radius", 2);
__decorateClass([
  ScenePathChangeDetection()
], ChordLink.prototype, "startAngle1", 2);
__decorateClass([
  ScenePathChangeDetection()
], ChordLink.prototype, "endAngle1", 2);
__decorateClass([
  ScenePathChangeDetection()
], ChordLink.prototype, "startAngle2", 2);
__decorateClass([
  ScenePathChangeDetection()
], ChordLink.prototype, "endAngle2", 2);
__decorateClass([
  ScenePathChangeDetection()
], ChordLink.prototype, "tension", 2);

// packages/ag-charts-enterprise/src/series/chord/chordSeriesProperties.ts
var import_ag_charts_community91 = require("ag-charts-community");
var {
  BaseProperties: BaseProperties13,
  SeriesTooltip: SeriesTooltip4,
  SeriesProperties,
  ARRAY: ARRAY5,
  COLOR_STRING: COLOR_STRING9,
  COLOR_STRING_ARRAY,
  FUNCTION: FUNCTION7,
  LINE_DASH: LINE_DASH8,
  OBJECT: OBJECT13,
  POSITIVE_NUMBER: POSITIVE_NUMBER13,
  RATIO: RATIO14,
  STRING: STRING15,
  Validate: Validate37
} = import_ag_charts_community91._ModuleSupport;
var { Label: Label3 } = import_ag_charts_community91._Scene;
var ChordSeriesLabelProperties = class extends Label3 {
  constructor() {
    super(...arguments);
    this.spacing = 1;
    this.maxWidth = 1;
  }
};
__decorateClass([
  Validate37(POSITIVE_NUMBER13)
], ChordSeriesLabelProperties.prototype, "spacing", 2);
__decorateClass([
  Validate37(POSITIVE_NUMBER13)
], ChordSeriesLabelProperties.prototype, "maxWidth", 2);
var ChordSeriesLinkProperties = class extends BaseProperties13 {
  constructor() {
    super(...arguments);
    this.fill = void 0;
    this.fillOpacity = 1;
    this.stroke = void 0;
    this.strokeOpacity = 1;
    this.strokeWidth = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.tension = 0;
  }
};
__decorateClass([
  Validate37(COLOR_STRING9, { optional: true })
], ChordSeriesLinkProperties.prototype, "fill", 2);
__decorateClass([
  Validate37(RATIO14)
], ChordSeriesLinkProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate37(COLOR_STRING9, { optional: true })
], ChordSeriesLinkProperties.prototype, "stroke", 2);
__decorateClass([
  Validate37(RATIO14)
], ChordSeriesLinkProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate37(POSITIVE_NUMBER13)
], ChordSeriesLinkProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate37(LINE_DASH8)
], ChordSeriesLinkProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate37(POSITIVE_NUMBER13)
], ChordSeriesLinkProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate37(RATIO14)
], ChordSeriesLinkProperties.prototype, "tension", 2);
__decorateClass([
  Validate37(FUNCTION7, { optional: true })
], ChordSeriesLinkProperties.prototype, "itemStyler", 2);
var ChordSeriesNodeProperties = class extends BaseProperties13 {
  constructor() {
    super(...arguments);
    this.spacing = 1;
    this.width = 1;
    this.fill = void 0;
    this.fillOpacity = 1;
    this.stroke = void 0;
    this.strokeOpacity = 1;
    this.strokeWidth = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
  }
};
__decorateClass([
  Validate37(POSITIVE_NUMBER13)
], ChordSeriesNodeProperties.prototype, "spacing", 2);
__decorateClass([
  Validate37(POSITIVE_NUMBER13)
], ChordSeriesNodeProperties.prototype, "width", 2);
__decorateClass([
  Validate37(COLOR_STRING9, { optional: true })
], ChordSeriesNodeProperties.prototype, "fill", 2);
__decorateClass([
  Validate37(RATIO14)
], ChordSeriesNodeProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate37(COLOR_STRING9, { optional: true })
], ChordSeriesNodeProperties.prototype, "stroke", 2);
__decorateClass([
  Validate37(RATIO14)
], ChordSeriesNodeProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate37(POSITIVE_NUMBER13)
], ChordSeriesNodeProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate37(LINE_DASH8)
], ChordSeriesNodeProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate37(POSITIVE_NUMBER13)
], ChordSeriesNodeProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate37(FUNCTION7, { optional: true })
], ChordSeriesNodeProperties.prototype, "itemStyler", 2);
var ChordSeriesProperties = class extends SeriesProperties {
  constructor() {
    super(...arguments);
    this.idKey = "";
    this.idName = void 0;
    this.labelKey = void 0;
    this.labelName = void 0;
    this.sizeKey = void 0;
    this.sizeName = void 0;
    this.nodes = void 0;
    this.fills = [];
    this.strokes = [];
    this.label = new ChordSeriesLabelProperties();
    this.link = new ChordSeriesLinkProperties();
    this.node = new ChordSeriesNodeProperties();
    this.tooltip = new SeriesTooltip4();
  }
};
__decorateClass([
  Validate37(STRING15)
], ChordSeriesProperties.prototype, "fromKey", 2);
__decorateClass([
  Validate37(STRING15)
], ChordSeriesProperties.prototype, "toKey", 2);
__decorateClass([
  Validate37(STRING15)
], ChordSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate37(STRING15, { optional: true })
], ChordSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate37(STRING15, { optional: true })
], ChordSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate37(STRING15, { optional: true })
], ChordSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate37(STRING15, { optional: true })
], ChordSeriesProperties.prototype, "sizeKey", 2);
__decorateClass([
  Validate37(STRING15, { optional: true })
], ChordSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate37(ARRAY5, { optional: true })
], ChordSeriesProperties.prototype, "nodes", 2);
__decorateClass([
  Validate37(COLOR_STRING_ARRAY)
], ChordSeriesProperties.prototype, "fills", 2);
__decorateClass([
  Validate37(COLOR_STRING_ARRAY)
], ChordSeriesProperties.prototype, "strokes", 2);
__decorateClass([
  Validate37(OBJECT13)
], ChordSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate37(OBJECT13)
], ChordSeriesProperties.prototype, "link", 2);
__decorateClass([
  Validate37(OBJECT13)
], ChordSeriesProperties.prototype, "node", 2);
__decorateClass([
  Validate37(OBJECT13)
], ChordSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/chord/chordSeries.ts
var { SeriesNodePickMode: SeriesNodePickMode3, createDatumId: createDatumId2, EMPTY_TOOLTIP_CONTENT } = import_ag_charts_community92._ModuleSupport;
var { angleBetween: angleBetween3, normalizeAngle360: normalizeAngle3605, isBetweenAngles, sanitizeHtml: sanitizeHtml3, Logger: Logger7 } = import_ag_charts_community92._Util;
var { Sector: Sector3, Text: Text7 } = import_ag_charts_community92._Scene;
var nodeMidAngle = (node) => node.startAngle + angleBetween3(node.startAngle, node.endAngle) / 2;
var ChordSeries = class extends FlowProportionSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      pickModes: [SeriesNodePickMode3.NEAREST_NODE, SeriesNodePickMode3.EXACT_SHAPE_MATCH]
    });
    this.properties = new ChordSeriesProperties();
  }
  isLabelEnabled() {
    return (this.properties.labelKey != null || this.nodes == null) && this.properties.label.enabled;
  }
  linkFactory() {
    return new ChordLink();
  }
  nodeFactory() {
    return new Sector3();
  }
  async createNodeData() {
    const {
      id: seriesId,
      _nodeDataDependencies: { seriesRectWidth, seriesRectHeight } = { seriesRectWidth: 0, seriesRectHeight: 0 }
    } = this;
    const {
      fromKey,
      toKey,
      sizeKey,
      label: { spacing: labelSpacing, maxWidth: labelMaxWidth, fontSize },
      node: { width: nodeWidth, spacing: nodeSpacing }
    } = this.properties;
    const centerX = seriesRectWidth / 2;
    const centerY = seriesRectHeight / 2;
    let labelData = [];
    const defaultLabelFormatter = (v) => String(v);
    const { nodeGraph, links } = this.getNodeGraph(
      (node) => {
        const label = this.getLabelText(
          this.properties.label,
          {
            datum: node.datum,
            value: node.label,
            fromKey,
            toKey,
            sizeKey
          },
          defaultLabelFormatter
        );
        return {
          ...node,
          label,
          size: 0,
          centerX,
          centerY,
          innerRadius: NaN,
          outerRadius: NaN,
          startAngle: NaN,
          endAngle: NaN
        };
      },
      (link) => ({
        ...link,
        centerX,
        centerY,
        radius: NaN,
        startAngle1: NaN,
        endAngle1: NaN,
        startAngle2: NaN,
        endAngle2: NaN
      }),
      { includeCircularReferences: true }
    );
    let totalSize = 0;
    nodeGraph.forEach(({ datum: node, linksBefore, linksAfter }, id) => {
      const size = linksBefore.reduce((acc, { link }) => acc + link.size, 0) + linksAfter.reduce((acc, { link }) => acc + link.size, 0);
      if (size === 0) {
        nodeGraph.delete(id);
      } else {
        node.size = size;
        totalSize += node.size;
      }
    });
    let labelInset = 0;
    if (this.isLabelEnabled()) {
      const canvasFont = this.properties.label.getFont();
      let maxMeasuredLabelWidth = 0;
      nodeGraph.forEach(({ datum: node }) => {
        const { id, label } = node;
        if (label == null)
          return;
        const text = Text7.wrap(label, labelMaxWidth, Infinity, this.properties.label, "never", "ellipsis");
        const { width } = Text7.measureText(text, canvasFont, "middle", "left");
        maxMeasuredLabelWidth = Math.max(width, maxMeasuredLabelWidth);
        labelData.push({
          id,
          text,
          centerX,
          centerY,
          angle: NaN,
          radius: NaN
        });
      });
      labelInset = maxMeasuredLabelWidth + labelSpacing;
    }
    const nodeCount = nodeGraph.size;
    let radius = Math.min(seriesRectWidth, seriesRectHeight) / 2 - nodeWidth - labelInset;
    let spacingSweep = nodeSpacing / radius;
    if (labelInset !== 0 && (nodeCount * spacingSweep >= 1.5 * Math.PI || radius <= 0)) {
      labelData = [];
      radius = Math.min(seriesRectWidth, seriesRectHeight) / 2 - nodeWidth;
      spacingSweep = nodeSpacing / radius;
    }
    if (nodeCount * spacingSweep >= 2 * Math.PI || radius <= 0) {
      Logger7.warnOnce("There was insufficient space to display the Chord Series.");
      return {
        itemId: this.id,
        nodeData: [],
        labelData: []
      };
    }
    const innerRadius = radius;
    const outerRadius = radius + nodeWidth;
    const sizeScale = Math.max((2 * Math.PI - nodeCount * spacingSweep) / totalSize, 0);
    let nodeAngle = 0;
    nodeGraph.forEach(({ datum: node }) => {
      node.innerRadius = innerRadius;
      node.outerRadius = outerRadius;
      node.startAngle = nodeAngle;
      node.endAngle = nodeAngle + node.size * sizeScale;
      nodeAngle = node.endAngle + spacingSweep;
      const midR = (node.innerRadius + node.outerRadius) / 2;
      const midAngle = nodeMidAngle(node);
      node.midPoint = {
        x: node.centerX + midR * Math.cos(midAngle),
        y: node.centerY + midR * Math.sin(midAngle)
      };
    });
    const nodeData = [];
    nodeGraph.forEach(({ datum: node, linksBefore, linksAfter }) => {
      const midAngle = nodeMidAngle(node);
      const combinedLinks = [
        ...linksBefore.map((l) => ({
          link: l.link,
          distance: angleBetween3(nodeMidAngle(l.node.datum), midAngle),
          after: false
        })),
        ...linksAfter.map((l) => ({
          link: l.link,
          distance: angleBetween3(nodeMidAngle(l.node.datum), midAngle),
          after: true
        }))
      ];
      let linkAngle = node.startAngle;
      combinedLinks.sort((a, b) => a.distance - b.distance).forEach(({ link, after }) => {
        const linkSweep = link.size * sizeScale;
        if (after) {
          link.startAngle1 = linkAngle;
          link.endAngle1 = linkAngle + linkSweep;
        } else {
          link.startAngle2 = linkAngle;
          link.endAngle2 = linkAngle + linkSweep;
        }
        linkAngle += link.size * sizeScale;
      });
      nodeData.push(node);
    });
    links.forEach((link) => {
      link.radius = radius;
      const cpa0 = link.startAngle1 + angleBetween3(link.startAngle1, link.endAngle1) / 2;
      const cpa3 = link.startAngle2 + angleBetween3(link.startAngle2, link.endAngle2) / 2;
      const cp0x = radius * Math.cos(cpa0);
      const cp0y = radius * Math.sin(cpa0);
      const cp3x = radius * Math.cos(cpa3);
      const cp3y = radius * Math.sin(cpa3);
      link.midPoint = {
        x: link.centerX + (cp0x + cp3x) * 0.125,
        y: link.centerY + (cp0y + cp3y) * 0.125
      };
      nodeData.push(link);
    });
    labelData.forEach((label) => {
      const node = nodeGraph.get(label.id)?.datum;
      if (node == null)
        return;
      label.radius = outerRadius + labelSpacing;
      label.angle = normalizeAngle3605(node.startAngle + angleBetween3(node.startAngle, node.endAngle) / 2);
    });
    labelData.sort((a, b) => a.angle - b.angle);
    let minAngle = Infinity;
    let maxAngle = -Infinity;
    labelData = labelData.filter((label) => {
      const labelHeight = fontSize * Text7.defaultLineHeightRatio;
      const da = Math.atan2(labelHeight / 2, label.radius);
      const a0 = label.angle - da;
      const a1 = label.angle + da;
      if (isBetweenAngles(minAngle, a0, a1))
        return false;
      if (isBetweenAngles(maxAngle, a0, a1))
        return false;
      minAngle = Math.min(a0, minAngle);
      maxAngle = Math.max(a1, maxAngle);
      return true;
    });
    return {
      itemId: seriesId,
      nodeData,
      labelData
    };
  }
  async updateLabelSelection(opts) {
    const labels = this.isLabelEnabled() ? opts.labelData : [];
    return opts.labelSelection.update(labels);
  }
  async updateLabelNodes(opts) {
    const { labelSelection } = opts;
    const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;
    labelSelection.each((label, { text, centerX, centerY, radius, angle }) => {
      label.visible = true;
      label.translationX = centerX + radius * Math.cos(angle);
      label.translationY = centerY + radius * Math.sin(angle);
      label.text = text;
      label.fill = fill;
      label.fontStyle = fontStyle;
      label.fontWeight = fontWeight;
      label.fontSize = fontSize;
      label.fontFamily = fontFamily;
      label.textBaseline = "middle";
      if (Math.cos(angle) >= 0) {
        label.textAlign = "left";
        label.rotation = angle;
      } else {
        label.textAlign = "right";
        label.rotation = angle - Math.PI;
      }
    });
  }
  async updateNodeSelection(opts) {
    return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId2([datum.type, datum.id]));
  }
  async updateNodeNodes(opts) {
    const { datumSelection, isHighlight } = opts;
    const {
      id: seriesId,
      properties,
      ctx: { callbackCache }
    } = this;
    const { fromKey, toKey, sizeKey } = this.properties;
    const {
      fill: baseFill,
      fillOpacity,
      stroke: baseStroke,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      itemStyler
    } = properties.node;
    const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
    const strokeWidth = this.getStrokeWidth(properties.node.strokeWidth);
    datumSelection.each((sector, datum) => {
      const fill = baseFill ?? datum.fill;
      const stroke = baseStroke ?? datum.stroke;
      let format;
      if (itemStyler != null) {
        const { label, size } = datum;
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
          label,
          size,
          fromKey,
          toKey,
          sizeKey,
          fill,
          fillOpacity,
          strokeOpacity,
          stroke,
          strokeWidth,
          lineDash,
          lineDashOffset,
          highlighted: isHighlight
        });
      }
      sector.centerX = datum.centerX;
      sector.centerY = datum.centerY;
      sector.innerRadius = datum.innerRadius;
      sector.outerRadius = datum.outerRadius;
      sector.startAngle = datum.startAngle;
      sector.endAngle = datum.endAngle;
      sector.fill = highlightStyle?.fill ?? format?.fill ?? fill;
      sector.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
      sector.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
      sector.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
      sector.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
      sector.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
      sector.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
      sector.inset = sector.strokeWidth / 2;
    });
  }
  async updateLinkSelection(opts) {
    return opts.datumSelection.update(
      opts.nodeData,
      void 0,
      (datum) => createDatumId2([datum.type, datum.index, datum.fromNode.id, datum.toNode.id])
    );
  }
  async updateLinkNodes(opts) {
    const { datumSelection, isHighlight } = opts;
    const {
      id: seriesId,
      properties,
      ctx: { callbackCache }
    } = this;
    const { fromKey, toKey, sizeKey } = properties;
    const {
      fill: baseFill,
      fillOpacity,
      stroke: baseStroke,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      tension,
      itemStyler
    } = properties.link;
    const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
    const strokeWidth = this.getStrokeWidth(properties.link.strokeWidth);
    datumSelection.each((link, datum) => {
      const fill = baseFill ?? datum.fromNode.fill;
      const stroke = baseStroke ?? datum.fromNode.stroke;
      let format;
      if (itemStyler != null) {
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
          fromKey,
          toKey,
          sizeKey,
          fill,
          fillOpacity,
          strokeOpacity,
          stroke,
          strokeWidth,
          lineDash,
          lineDashOffset,
          tension,
          highlighted: isHighlight
        });
      }
      link.centerX = datum.centerX;
      link.centerY = datum.centerY;
      link.radius = datum.radius;
      link.startAngle1 = datum.startAngle1;
      link.endAngle1 = datum.endAngle1;
      link.startAngle2 = datum.startAngle2;
      link.endAngle2 = datum.endAngle2;
      link.fill = highlightStyle?.fill ?? format?.fill ?? fill;
      link.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
      link.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
      link.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
      link.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
      link.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
      link.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
      link.tension = format?.tension ?? tension;
    });
  }
  resetAnimation(_chartAnimationPhase) {
  }
  getTooltipHtml(nodeDatum) {
    const {
      id: seriesId,
      processedData,
      ctx: { callbackCache },
      properties
    } = this;
    if (!processedData || !properties.isValid()) {
      return EMPTY_TOOLTIP_CONTENT;
    }
    const { fromKey, toKey, sizeKey, sizeName, tooltip } = properties;
    const { datum, itemId } = nodeDatum;
    let title;
    const contentLines = [];
    let fill;
    if (nodeDatum.type === 0 /* Link */) {
      const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, tension, itemStyler } = properties.link;
      const { fromNode, toNode, size } = nodeDatum;
      title = `${fromNode.label ?? fromNode.id} - ${toNode.label ?? toNode.id}`;
      if (sizeKey != null) {
        contentLines.push(sanitizeHtml3(`${sizeName ?? sizeKey}: ` + size));
      }
      fill = properties.link.fill ?? fromNode.fill;
      const stroke = properties.link.stroke ?? fromNode.stroke;
      let format;
      if (itemStyler != null) {
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
          fromKey,
          toKey,
          sizeKey,
          fill,
          fillOpacity,
          strokeOpacity,
          stroke,
          strokeWidth,
          lineDash,
          lineDashOffset,
          tension,
          highlighted: true
        });
      }
      fill = format?.fill ?? fill;
    } else {
      const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, itemStyler } = properties.node;
      const { id, label, size } = nodeDatum;
      title = label ?? id;
      if (sizeKey != null) {
        contentLines.push(sanitizeHtml3(`${sizeName ?? sizeKey}: ` + size));
      }
      fill = properties.link.fill ?? nodeDatum.fill;
      const stroke = properties.link.stroke ?? nodeDatum.stroke;
      let format;
      if (itemStyler != null) {
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
          label,
          size,
          fromKey,
          toKey,
          sizeKey,
          fill,
          fillOpacity,
          strokeOpacity,
          stroke,
          strokeWidth,
          lineDash,
          lineDashOffset,
          highlighted: true
        });
      }
      fill = format?.fill ?? nodeDatum.fill;
    }
    const content = contentLines.join("<br>");
    const color = fill;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      {
        seriesId,
        datum,
        title,
        color,
        itemId,
        fromKey,
        toKey,
        sizeKey,
        sizeName,
        ...this.getModuleTooltipParams()
      }
    );
  }
  getLabelData() {
    return [];
  }
  computeFocusBounds({
    datumIndex
  }) {
    const datum = this.contextNodeData?.nodeData[datumIndex];
    if (datum?.type === 1 /* Node */) {
      for (const node of this.nodeSelection) {
        if (node.datum === datum) {
          return node.node;
        }
      }
      return void 0;
    } else if (datum?.type === 0 /* Link */) {
      for (const link of this.linkSelection) {
        if (link.datum === datum) {
          return link.node;
        }
      }
      return void 0;
    }
  }
};
ChordSeries.className = "ChordSeries";
ChordSeries.type = "chord";

// packages/ag-charts-enterprise/src/series/chord/chordModule.ts
var { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR } = import_ag_charts_community93._Theme;
var ChordModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["flow-proportion"],
  solo: true,
  identifier: "chord",
  tooltipDefaults: { range: "exact" },
  instanceConstructor: ChordSeries,
  themeTemplate: {
    series: {
      highlightStyle: {
        series: {
          dimOpacity: 0.2
        }
      },
      label: {
        fontFamily: DEFAULT_FONT_FAMILY,
        color: DEFAULT_LABEL_COLOUR,
        spacing: 5,
        maxWidth: 100
      },
      node: {
        spacing: 8,
        width: 10,
        strokeWidth: 0
      },
      link: {
        fillOpacity: 0.5,
        strokeWidth: 0,
        tension: 0.4
      }
    },
    legend: {
      enabled: false,
      toggleSeries: false
    }
  },
  paletteFactory({ takeColors, colorsCount }) {
    const { fills, strokes } = takeColors(colorsCount);
    return {
      fills,
      strokes
    };
  }
};

// packages/ag-charts-enterprise/src/series/heatmap/heatmapModule.ts
var import_ag_charts_community98 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/heatmap/heatmapSeries.ts
var import_ag_charts_community96 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/util/labelFormatter.ts
var import_ag_charts_community94 = require("ag-charts-community");
var { Validate: Validate38, NUMBER: NUMBER11, TEXT_WRAP, OVERFLOW_STRATEGY } = import_ag_charts_community94._ModuleSupport;
var { Logger: Logger8 } = import_ag_charts_community94._Util;
var { Text: Text8, Label: Label4 } = import_ag_charts_community94._Scene;
var BaseAutoSizedLabel = class extends Label4 {
  constructor() {
    super(...arguments);
    this.wrapping = "on-space";
    this.overflowStrategy = "ellipsis";
  }
  static lineHeight(fontSize) {
    return Math.ceil(fontSize * Text8.defaultLineHeightRatio);
  }
};
__decorateClass([
  Validate38(TEXT_WRAP)
], BaseAutoSizedLabel.prototype, "wrapping", 2);
__decorateClass([
  Validate38(OVERFLOW_STRATEGY)
], BaseAutoSizedLabel.prototype, "overflowStrategy", 2);
__decorateClass([
  Validate38(NUMBER11, { optional: true })
], BaseAutoSizedLabel.prototype, "minimumFontSize", 2);
var AutoSizedLabel = class extends BaseAutoSizedLabel {
  constructor() {
    super(...arguments);
    this.spacing = 0;
  }
};
__decorateClass([
  Validate38(NUMBER11)
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
  const { spacing } = labelProps;
  const widthAdjust = 2 * padding;
  const heightAdjust = 2 * padding + spacing;
  const minimumHeight = (labelProps.minimumFontSize ?? labelProps.fontSize) + (secondaryLabelProps.minimumFontSize ?? secondaryLabelProps.fontSize);
  if (minimumHeight > sizeFittingHeight(minimumHeight + heightAdjust, false).height - heightAdjust) {
    return;
  }
  const fontSizeCandidates = generateLabelSecondaryLabelFontSizeCandidates(labelProps, secondaryLabelProps);
  const labelTextNode = new Text8();
  labelTextNode.setFont(labelProps);
  const labelTextSizeProps = {
    fontFamily: labelProps.fontFamily,
    fontSize: labelProps.fontSize,
    fontStyle: labelProps.fontStyle,
    fontWeight: labelProps.fontWeight
  };
  const secondaryLabelTextNode = new Text8();
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
      const labelLines = Text8.wrapLines(
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
      const secondaryLabelLines = Text8.wrapLines(
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
  const sizeAdjust = 2 * padding;
  const minimumFontSize = Math.min(props.minimumFontSize ?? props.fontSize, props.fontSize);
  const textNode = new Text8();
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
    const lines = Text8.wrapLines(
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
  return label?.minimumFontSize != null && label?.fontSize && label?.minimumFontSize > label?.fontSize;
}
function formatLabels(baseLabelValue, labelProps, baseSecondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight) {
  const labelValue = labelProps.enabled ? baseLabelValue : void 0;
  const secondaryLabelValue = secondaryLabelProps.enabled ? baseSecondaryLabelValue : void 0;
  if (hasInvalidFontSize(labelProps) || hasInvalidFontSize(secondaryLabelProps)) {
    Logger8.warnOnce(`minimumFontSize should be set to a value less than or equal to the font size`);
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
var import_ag_charts_community95 = require("ag-charts-community");
var {
  CartesianSeriesProperties,
  SeriesTooltip: SeriesTooltip5,
  Validate: Validate39,
  AND: AND7,
  ARRAY: ARRAY6,
  COLOR_STRING: COLOR_STRING10,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY2,
  FUNCTION: FUNCTION8,
  OBJECT: OBJECT14,
  POSITIVE_NUMBER: POSITIVE_NUMBER14,
  RATIO: RATIO15,
  STRING: STRING16,
  TEXT_ALIGN: TEXT_ALIGN2,
  VERTICAL_ALIGN
} = import_ag_charts_community95._ModuleSupport;
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
    this.tooltip = new SeriesTooltip5();
  }
};
__decorateClass([
  Validate39(STRING16, { optional: true })
], HeatmapSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate39(STRING16)
], HeatmapSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate39(STRING16)
], HeatmapSeriesProperties.prototype, "yKey", 2);
__decorateClass([
  Validate39(STRING16, { optional: true })
], HeatmapSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate39(STRING16, { optional: true })
], HeatmapSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate39(STRING16, { optional: true })
], HeatmapSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate39(STRING16, { optional: true })
], HeatmapSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate39(AND7(COLOR_STRING_ARRAY2, ARRAY6.restrict({ minLength: 1 })))
], HeatmapSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate39(COLOR_STRING10, { optional: true })
], HeatmapSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate39(RATIO15, { optional: true })
], HeatmapSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate39(POSITIVE_NUMBER14, { optional: true })
], HeatmapSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate39(TEXT_ALIGN2)
], HeatmapSeriesProperties.prototype, "textAlign", 2);
__decorateClass([
  Validate39(VERTICAL_ALIGN)
], HeatmapSeriesProperties.prototype, "verticalAlign", 2);
__decorateClass([
  Validate39(POSITIVE_NUMBER14)
], HeatmapSeriesProperties.prototype, "itemPadding", 2);
__decorateClass([
  Validate39(FUNCTION8, { optional: true })
], HeatmapSeriesProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate39(OBJECT14)
], HeatmapSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate39(OBJECT14)
], HeatmapSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/heatmap/heatmapSeries.ts
var {
  SeriesNodePickMode: SeriesNodePickMode4,
  computeBarFocusBounds: computeBarFocusBounds4,
  getMissCount,
  valueProperty: valueProperty7,
  ChartAxisDirection: ChartAxisDirection14,
  DEFAULT_CARTESIAN_DIRECTION_KEYS,
  DEFAULT_CARTESIAN_DIRECTION_NAMES
} = import_ag_charts_community96._ModuleSupport;
var { Rect: Rect3, PointerEvents } = import_ag_charts_community96._Scene;
var { ColorScale } = import_ag_charts_community96._Scale;
var { sanitizeHtml: sanitizeHtml4, Logger: Logger9 } = import_ag_charts_community96._Util;
var HeatmapSeriesNodeEvent = class extends import_ag_charts_community96._ModuleSupport.CartesianSeriesNodeEvent {
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
var HeatmapSeries = class extends import_ag_charts_community96._ModuleSupport.CartesianSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
      directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
      pickModes: [SeriesNodePickMode4.NEAREST_NODE, SeriesNodePickMode4.EXACT_SHAPE_MATCH],
      pathsPerSeries: 0,
      hasMarkers: false,
      hasHighlightedLabels: true
    });
    this.properties = new HeatmapSeriesProperties();
    this.NodeEvent = HeatmapSeriesNodeEvent;
    this.colorScale = new ColorScale();
  }
  async processData(dataController) {
    const xAxis = this.axes[ChartAxisDirection14.X];
    const yAxis = this.axes[ChartAxisDirection14.Y];
    if (!xAxis || !yAxis || !this.properties.isValid() || !this.data?.length) {
      return;
    }
    const { xKey, yKey, colorRange, colorKey } = this.properties;
    const xScale = this.axes[ChartAxisDirection14.X]?.scale;
    const yScale = this.axes[ChartAxisDirection14.Y]?.scale;
    const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
    const colorScaleType = this.colorScale.type;
    const { dataModel, processedData } = await this.requestDataModel(dataController, this.data, {
      props: [
        valueProperty7(xKey, xScaleType, { id: "xValue" }),
        valueProperty7(yKey, yScaleType, { id: "yValue" }),
        ...colorKey ? [valueProperty7(colorKey, colorScaleType, { id: "colorValue" })] : []
      ]
    });
    if (this.isColorScaleValid()) {
      const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
      this.colorScale.domain = processedData.domain.values[colorKeyIdx];
      this.colorScale.range = colorRange;
      this.colorScale.update();
    }
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
    if (direction === ChartAxisDirection14.X) {
      return dataModel.getDomain(this, `xValue`, "value", processedData);
    } else {
      return dataModel.getDomain(this, `yValue`, "value", processedData);
    }
  }
  async createNodeData() {
    const { data, visible, axes, dataModel } = this;
    const xAxis = axes[ChartAxisDirection14.X];
    const yAxis = axes[ChartAxisDirection14.Y];
    if (!(data && dataModel && visible && xAxis && yAxis)) {
      return;
    }
    if (xAxis.type !== "category" || yAxis.type !== "category") {
      Logger9.warnOnce(
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
    const xOffset = (xScale.bandwidth ?? 0) / 2;
    const yOffset = (yScale.bandwidth ?? 0) / 2;
    const colorScaleValid = this.isColorScaleValid();
    const nodeData = [];
    const labelData = [];
    const width = xScale.bandwidth ?? 10;
    const height = yScale.bandwidth ?? 10;
    const textAlignFactor = (width - 2 * itemPadding) * textAlignFactors[textAlign];
    const verticalAlignFactor = (height - 2 * itemPadding) * verticalAlignFactors[verticalAlign];
    const sizeFittingHeight = () => ({ width, height, meta: null });
    for (const { values, datum } of this.processedData?.data ?? []) {
      const xDatum = values[xDataIdx];
      const yDatum = values[yDataIdx];
      const x = xScale.convert(xDatum) + xOffset;
      const y = yScale.convert(yDatum) + yOffset;
      const colorValue = values[colorDataIdx ?? -1];
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
        midPoint: { x, y },
        missing: colorValue == null
      });
      if (labels?.label != null) {
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
      itemId: this.properties.yKey ?? this.id,
      nodeData,
      labelData,
      scales: this.calculateScaling(),
      visible: this.visible
    };
  }
  nodeFactory() {
    return new Rect3();
  }
  async updateDatumSelection(opts) {
    const { nodeData, datumSelection } = opts;
    const data = nodeData ?? [];
    return datumSelection.update(data);
  }
  async updateDatumNodes(opts) {
    const { isHighlight: isDatumHighlighted } = opts;
    const {
      id: seriesId,
      ctx: { callbackCache },
      properties
    } = this;
    const { xKey, yKey, colorKey, itemStyler } = properties;
    const highlightStyle = isDatumHighlighted ? properties.highlightStyle.item : void 0;
    const fillOpacity = highlightStyle?.fillOpacity ?? 1;
    const stroke = highlightStyle?.stroke ?? properties.stroke;
    const strokeWidth = highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth);
    const strokeOpacity = highlightStyle?.strokeOpacity ?? properties.strokeOpacity ?? 1;
    const xAxis = this.axes[ChartAxisDirection14.X];
    const [visibleMin, visibleMax] = xAxis?.visibleRange ?? [];
    const isZoomed = visibleMin !== 0 || visibleMax !== 1;
    const crisp = !isZoomed;
    opts.datumSelection.each((rect, nodeDatum) => {
      const { datum, point, width, height } = nodeDatum;
      const fill = highlightStyle?.fill ?? nodeDatum.fill;
      let format;
      if (itemStyler) {
        format = callbackCache.call(itemStyler, {
          datum,
          fill,
          fillOpacity,
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
      rect.fill = format?.fill ?? fill;
      rect.fillOpacity = format?.fillOpacity ?? fillOpacity;
      rect.stroke = format?.stroke ?? stroke;
      rect.strokeWidth = format?.strokeWidth ?? strokeWidth;
      rect.strokeOpacity = format?.strokeOpacity ?? strokeOpacity;
    });
  }
  async updateLabelSelection(opts) {
    const { labelData, labelSelection } = opts;
    const { enabled } = this.properties.label;
    const data = enabled ? labelData : [];
    return labelSelection.update(data);
  }
  async updateLabelNodes(opts) {
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
  }
  getTooltipHtml(nodeDatum) {
    const xAxis = this.axes[ChartAxisDirection14.X];
    const yAxis = this.axes[ChartAxisDirection14.Y];
    if (!this.properties.isValid() || !xAxis || !yAxis) {
      return import_ag_charts_community96._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const {
      xKey,
      yKey,
      colorKey,
      xName,
      yName,
      colorName,
      stroke,
      strokeWidth,
      strokeOpacity = 1,
      colorRange,
      itemStyler,
      tooltip
    } = this.properties;
    const {
      colorScale,
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const { datum, xValue, yValue, colorValue, itemId } = nodeDatum;
    const fill = this.isColorScaleValid() ? colorScale.convert(colorValue) : colorRange[0];
    let format;
    if (itemStyler) {
      format = callbackCache.call(itemStyler, {
        datum,
        xKey,
        yKey,
        colorKey,
        fill,
        fillOpacity: 1,
        stroke,
        strokeWidth,
        strokeOpacity,
        highlighted: false,
        seriesId
      });
    }
    const color = format?.fill ?? fill ?? "gray";
    const title = this.properties.title ?? yName;
    const xString = sanitizeHtml4(xAxis.formatDatum(xValue));
    const yString = sanitizeHtml4(yAxis.formatDatum(yValue));
    let content = `<b>${sanitizeHtml4(xName ?? xKey)}</b>: ${xString}<br><b>${sanitizeHtml4(yName ?? yKey)}</b>: ${yString}`;
    if (colorKey) {
      content = `<b>${sanitizeHtml4(colorName ?? colorKey)}</b>: ${sanitizeHtml4(colorValue)}<br>` + content;
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
    if (legendType !== "gradient" || !this.data?.length || !this.properties.isValid() || !this.isColorScaleValid() || !this.dataModel) {
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
    const datum = this.contextNodeData?.nodeData[datumIndex];
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
var import_ag_charts_community97 = require("ag-charts-community");
var HEATMAP_SERIES_THEME = {
  series: {
    label: {
      enabled: false,
      color: import_ag_charts_community97._Theme.DEFAULT_LABEL_COLOUR,
      fontSize: import_ag_charts_community97._Theme.FONT_SIZE.SMALL,
      fontFamily: import_ag_charts_community97._Theme.DEFAULT_FONT_FAMILY,
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
  tooltipDefaults: { range: "exact" },
  defaultAxes: [
    {
      type: import_ag_charts_community98._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community98._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community98._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community98._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: HEATMAP_SERIES_THEME,
  paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
    const defaultColorRange = themeTemplateParameters.get(import_ag_charts_community98._Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    const defaultBackgroundColor = themeTemplateParameters.get(import_ag_charts_community98._Theme.DEFAULT_BACKGROUND_COLOUR);
    const backgroundFill = (Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor) ?? "white";
    const { fills, strokes } = takeColors(colorsCount);
    return {
      stroke: userPalette === "inbuilt" ? backgroundFill : strokes[0],
      colorRange: userPalette === "inbuilt" ? defaultColorRange : [fills[0], fills[1]]
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundModule.ts
var import_ag_charts_community104 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-util/mapThemeDefaults.ts
var MAP_THEME_DEFAULTS = {
  zoom: {
    axes: "xy",
    anchorPointX: "pointer",
    anchorPointY: "pointer"
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
};

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundSeries.ts
var import_ag_charts_community103 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-util/geoGeometry.ts
var import_ag_charts_community100 = require("ag-charts-community");

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
var import_ag_charts_community99 = require("ag-charts-community");
var { LonLatBBox } = import_ag_charts_community99._ModuleSupport;
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
var { Path: Path6, ExtendedPath2D, BBox: BBox7, ScenePathChangeDetection: ScenePathChangeDetection2 } = import_ag_charts_community100._Scene;
var GeoGeometry = class extends Path6 {
  constructor() {
    super(...arguments);
    this.projectedGeometry = void 0;
    this.renderMode = 3 /* All */;
    // Keep non-filled shapes separate so we don't fill them
    this.strokePath = new ExtendedPath2D();
  }
  computeBBox() {
    if (this.dirtyPath || this.isDirtyPath()) {
      this.updatePath();
      this.dirtyPath = false;
    }
    return this.bbox?.clone();
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
  ScenePathChangeDetection2()
], GeoGeometry.prototype, "projectedGeometry", 2);
__decorateClass([
  ScenePathChangeDetection2()
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
var import_ag_charts_community101 = require("ag-charts-community");
function isValidCoordinate(v) {
  return Array.isArray(v) && v.length >= 2 && v.every(import_ag_charts_community101._ModuleSupport.isFiniteNumber);
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
var GEOJSON_OBJECT = import_ag_charts_community101._ModuleSupport.predicateWithMessage(isValidFeatureCollection, "a GeoJSON object");

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundSeriesProperties.ts
var import_ag_charts_community102 = require("ag-charts-community");
var { COLOR_STRING: COLOR_STRING11, LINE_DASH: LINE_DASH9, OBJECT: OBJECT15, POSITIVE_NUMBER: POSITIVE_NUMBER15, RATIO: RATIO16, Validate: Validate40, SeriesProperties: SeriesProperties2, SeriesTooltip: SeriesTooltip6 } = import_ag_charts_community102._ModuleSupport;
var MapLineBackgroundSeriesProperties = class extends SeriesProperties2 {
  constructor() {
    super(...arguments);
    this.topology = void 0;
    this.stroke = "black";
    this.strokeOpacity = 1;
    this.strokeWidth = 0;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.tooltip = new SeriesTooltip6();
  }
};
__decorateClass([
  Validate40(GEOJSON_OBJECT, { optional: true })
], MapLineBackgroundSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate40(COLOR_STRING11)
], MapLineBackgroundSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate40(RATIO16)
], MapLineBackgroundSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate40(POSITIVE_NUMBER15)
], MapLineBackgroundSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate40(LINE_DASH9)
], MapLineBackgroundSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate40(POSITIVE_NUMBER15)
], MapLineBackgroundSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate40(OBJECT15)
], MapLineBackgroundSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundSeries.ts
var { createDatumId: createDatumId3, DataModelSeries: DataModelSeries2, SeriesNodePickMode: SeriesNodePickMode5, Validate: Validate41 } = import_ag_charts_community103._ModuleSupport;
var { Group: Group9, Selection: Selection4, PointerEvents: PointerEvents2 } = import_ag_charts_community103._Scene;
var { Logger: Logger10 } = import_ag_charts_community103._Util;
var MapLineBackgroundSeries = class extends DataModelSeries2 {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode5.EXACT_SHAPE_MATCH]
    });
    this.properties = new MapLineBackgroundSeriesProperties();
    this._chartTopology = void 0;
    this.itemGroup = this.contentGroup.appendChild(new Group9({ name: "itemGroup" }));
    this.datumSelection = Selection4.select(
      this.itemGroup,
      () => this.nodeFactory()
    );
  }
  getNodeData() {
    return this.contextNodeData?.nodeData;
  }
  get topology() {
    return this.properties.topology ?? this._chartTopology;
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
  async processData() {
    const { topology } = this;
    this.topologyBounds = topology?.features.reduce((current, feature) => {
      const geometry = feature.geometry;
      if (geometry == null)
        return current;
      return geometryBbox(geometry, current);
    }, void 0);
    if (topology == null) {
      Logger10.warnOnce(`no topology was provided for [MapShapeBackgroundSeries]; nothing will be rendered.`);
    }
  }
  async createNodeData() {
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
  }
  async updateSelections() {
    if (this.nodeDataRefresh) {
      this.contextNodeData = await this.createNodeData();
      this.nodeDataRefresh = false;
    }
  }
  async update() {
    const { datumSelection } = this;
    await this.updateSelections();
    this.contentGroup.visible = this.visible;
    const { nodeData = [] } = this.contextNodeData ?? {};
    this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
    await this.updateDatumNodes({ datumSelection });
  }
  async updateDatumSelection(opts) {
    return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId3(datum.index));
  }
  async updateDatumNodes(opts) {
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
    return import_ag_charts_community103._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
  }
  computeFocusBounds(_opts) {
    return void 0;
  }
};
MapLineBackgroundSeries.className = "MapLineBackgroundSeries";
MapLineBackgroundSeries.type = "map-line-background";
__decorateClass([
  Validate41(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapLineBackgroundSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-line-background/mapLineBackgroundModule.ts
var { DEFAULT_HIERARCHY_STROKES } = import_ag_charts_community104._Theme;
var MapLineBackgroundModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-line-background",
  instanceConstructor: MapLineBackgroundSeries,
  tooltipDefaults: { range: "exact" },
  themeTemplate: {
    ...MAP_THEME_DEFAULTS,
    series: {
      strokeWidth: 1,
      lineDash: [0],
      lineDashOffset: 0
    }
  },
  paletteFactory: ({ themeTemplateParameters }) => {
    return {
      stroke: themeTemplateParameters.get(DEFAULT_HIERARCHY_STROKES)?.[1]
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-line/mapLineModule.ts
var import_ag_charts_community107 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-line/mapLineSeries.ts
var import_ag_charts_community106 = require("ag-charts-community");

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
function findFocusedGeoGeometry(series, opts) {
  const datum = series.contextNodeData?.nodeData[opts.datumIndex];
  if (datum === void 0)
    return void 0;
  for (const node of series.datumSelection.nodes()) {
    if (node.datum === datum) {
      return node;
    }
  }
  return void 0;
}

// packages/ag-charts-enterprise/src/series/map-line/mapLineSeriesProperties.ts
var import_ag_charts_community105 = require("ag-charts-community");
var {
  AND: AND8,
  ARRAY: ARRAY7,
  COLOR_STRING: COLOR_STRING12,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY3,
  FUNCTION: FUNCTION9,
  LINE_DASH: LINE_DASH10,
  NUMBER_ARRAY,
  OBJECT: OBJECT16,
  POSITIVE_NUMBER: POSITIVE_NUMBER16,
  RATIO: RATIO17,
  STRING: STRING17,
  Validate: Validate42,
  SeriesProperties: SeriesProperties3,
  SeriesTooltip: SeriesTooltip7
} = import_ag_charts_community105._ModuleSupport;
var { Label: Label5 } = import_ag_charts_community105._Scene;
var MapLineSeriesProperties = class extends SeriesProperties3 {
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
    this.label = new Label5();
    this.tooltip = new SeriesTooltip7();
  }
};
__decorateClass([
  Validate42(GEOJSON_OBJECT, { optional: true })
], MapLineSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate42(STRING17, { optional: true })
], MapLineSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate42(STRING17, { optional: true })
], MapLineSeriesProperties.prototype, "legendItemName", 2);
__decorateClass([
  Validate42(STRING17)
], MapLineSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate42(STRING17)
], MapLineSeriesProperties.prototype, "topologyIdKey", 2);
__decorateClass([
  Validate42(STRING17, { optional: true })
], MapLineSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate42(STRING17, { optional: true })
], MapLineSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate42(STRING17, { optional: true })
], MapLineSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate42(STRING17, { optional: true })
], MapLineSeriesProperties.prototype, "sizeKey", 2);
__decorateClass([
  Validate42(STRING17, { optional: true })
], MapLineSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate42(STRING17, { optional: true })
], MapLineSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate42(STRING17, { optional: true })
], MapLineSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate42(NUMBER_ARRAY, { optional: true })
], MapLineSeriesProperties.prototype, "sizeDomain", 2);
__decorateClass([
  Validate42(AND8(COLOR_STRING_ARRAY3, ARRAY7.restrict({ minLength: 1 })), { optional: true })
], MapLineSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate42(POSITIVE_NUMBER16, { optional: true })
], MapLineSeriesProperties.prototype, "maxStrokeWidth", 2);
__decorateClass([
  Validate42(COLOR_STRING12)
], MapLineSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate42(RATIO17)
], MapLineSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate42(POSITIVE_NUMBER16)
], MapLineSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate42(LINE_DASH10)
], MapLineSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate42(POSITIVE_NUMBER16)
], MapLineSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate42(FUNCTION9, { optional: true })
], MapLineSeriesProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate42(OBJECT16)
], MapLineSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate42(OBJECT16)
], MapLineSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-line/mapLineSeries.ts
var { getMissCount: getMissCount2, createDatumId: createDatumId4, DataModelSeries: DataModelSeries3, SeriesNodePickMode: SeriesNodePickMode6, valueProperty: valueProperty8, Validate: Validate43 } = import_ag_charts_community106._ModuleSupport;
var { ColorScale: ColorScale2, LinearScale: LinearScale3 } = import_ag_charts_community106._Scale;
var { Selection: Selection5, Text: Text9 } = import_ag_charts_community106._Scene;
var { sanitizeHtml: sanitizeHtml5, Logger: Logger11 } = import_ag_charts_community106._Util;
var MapLineSeries = class extends DataModelSeries3 {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode6.EXACT_SHAPE_MATCH, SeriesNodePickMode6.NEAREST_NODE]
    });
    this.properties = new MapLineSeriesProperties();
    this._chartTopology = void 0;
    this.colorScale = new ColorScale2();
    this.sizeScale = new LinearScale3();
    this.datumSelection = Selection5.select(
      this.contentGroup,
      () => this.nodeFactory()
    );
    this.labelSelection = Selection5.select(
      this.labelGroup,
      Text9
    );
    this.highlightDatumSelection = Selection5.select(
      this.highlightNode,
      () => this.nodeFactory()
    );
    this._previousDatumMidPoint = void 0;
  }
  getNodeData() {
    return this.contextNodeData?.nodeData;
  }
  get topology() {
    return this.properties.topology ?? this._chartTopology;
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
  async processData(dataController) {
    if (this.data == null || !this.properties.isValid()) {
      return;
    }
    const { data, topology, sizeScale, colorScale } = this;
    const { topologyIdKey, idKey, sizeKey, colorKey, labelKey, sizeDomain, colorRange } = this.properties;
    const featureById = /* @__PURE__ */ new Map();
    topology?.features.forEach((feature) => {
      const property = feature.properties?.[topologyIdKey];
      if (property == null || !containsType(feature.geometry, 2 /* LineString */))
        return;
      featureById.set(property, feature);
    });
    const sizeScaleType = this.sizeScale.type;
    const colorScaleType = this.colorScale.type;
    const mercatorScaleType = this.scale?.type;
    const { dataModel, processedData } = await this.requestDataModel(dataController, data, {
      props: [
        valueProperty8(idKey, mercatorScaleType, { id: "idValue", includeProperty: false }),
        valueProperty8(idKey, mercatorScaleType, {
          id: "featureValue",
          includeProperty: false,
          processor: () => (datum) => featureById.get(datum)
        }),
        ...labelKey != null ? [valueProperty8(labelKey, "band", { id: "labelValue" })] : [],
        ...sizeKey != null ? [valueProperty8(sizeKey, sizeScaleType, { id: "sizeValue" })] : [],
        ...colorKey != null ? [valueProperty8(colorKey, colorScaleType, { id: "colorValue" })] : []
      ]
    });
    const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`);
    this.topologyBounds = processedData.data.reduce(
      (current, { values }) => {
        const feature = values[featureIdx];
        const geometry = feature?.geometry;
        if (geometry == null)
          return current;
        return geometryBbox(geometry, current);
      },
      void 0
    );
    if (sizeKey != null) {
      const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`);
      const processedSize = processedData.domain.values[sizeIdx] ?? [];
      sizeScale.domain = sizeDomain ?? processedSize;
    }
    if (colorRange != null && this.isColorScaleValid()) {
      const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
      colorScale.domain = processedData.domain.values[colorKeyIdx];
      colorScale.range = colorRange;
      colorScale.update();
    }
    if (topology == null) {
      Logger11.warnOnce(`no topology was provided for [MapLineSeries]; nothing will be rendered.`);
    }
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
    const labelSize = Text9.getTextSize(String(labelText), font);
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
  async createNodeData() {
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
    const maxStrokeWidth = properties.maxStrokeWidth ?? properties.strokeWidth;
    sizeScale.range = [Math.min(properties.strokeWidth, maxStrokeWidth), maxStrokeWidth];
    const font = label.getFont();
    const projectedGeometries = /* @__PURE__ */ new Map();
    processedData.data.forEach(({ values }) => {
      const id = values[idIdx];
      const geometry = values[featureIdx]?.geometry;
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
      Logger11.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
    }
    return {
      itemId: seriesId,
      nodeData,
      labelData
    };
  }
  async updateSelections() {
    if (this.nodeDataRefresh) {
      this.contextNodeData = await this.createNodeData();
      this.nodeDataRefresh = false;
    }
  }
  async update() {
    const { datumSelection, labelSelection, highlightDatumSelection } = this;
    await this.updateSelections();
    this.contentGroup.visible = this.visible;
    this.contentGroup.opacity = this.getOpacity();
    let highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
    if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
      highlightedDatum = void 0;
    }
    const nodeData = this.contextNodeData?.nodeData ?? [];
    this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
    await this.updateDatumNodes({ datumSelection, isHighlight: false });
    this.labelSelection = await this.updateLabelSelection({ labelSelection });
    await this.updateLabelNodes({ labelSelection });
    this.highlightDatumSelection = await this.updateDatumSelection({
      nodeData: highlightedDatum != null ? [highlightedDatum] : [],
      datumSelection: highlightDatumSelection
    });
    await this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
  }
  async updateDatumSelection(opts) {
    return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId4(datum.idValue));
  }
  async updateDatumNodes(opts) {
    const {
      id: seriesId,
      properties,
      ctx: { callbackCache }
    } = this;
    const { datumSelection, isHighlight } = opts;
    const { idKey, labelKey, sizeKey, colorKey, stroke, strokeOpacity, lineDash, lineDashOffset, itemStyler } = properties;
    const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
    const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
    datumSelection.each((geoGeometry, datum) => {
      const { projectedGeometry } = datum;
      if (projectedGeometry == null) {
        geoGeometry.visible = false;
        geoGeometry.projectedGeometry = void 0;
        return;
      }
      let format;
      if (itemStyler != null) {
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
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
        });
      }
      geoGeometry.visible = true;
      geoGeometry.projectedGeometry = projectedGeometry;
      geoGeometry.stroke = highlightStyle?.stroke ?? format?.stroke ?? datum.stroke ?? stroke;
      geoGeometry.strokeWidth = Math.max(
        highlightStyle?.strokeWidth ?? 0,
        format?.strokeWidth ?? datum.strokeWidth ?? strokeWidth
      );
      geoGeometry.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
      geoGeometry.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
      geoGeometry.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
    });
  }
  async updateLabelSelection(opts) {
    const placedLabels = (this.isLabelEnabled() ? this.chart?.placeLabels().get(this) : void 0) ?? [];
    return opts.labelSelection.update(placedLabels);
  }
  async updateLabelNodes(opts) {
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
    return this.contextNodeData?.labelData ?? [];
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
    if (_previousDatumMidPoint?.datum === datum) {
      return _previousDatumMidPoint.point;
    }
    const projectedGeometry = datum.projectedGeometry;
    const lineString = projectedGeometry != null ? largestLineString(projectedGeometry) : void 0;
    const center = lineString != null ? lineStringCenter(lineString)?.point : void 0;
    const point = center != null ? { x: center[0], y: center[1] } : void 0;
    this._previousDatumMidPoint = { datum, point };
    return point;
  }
  getLegendData(legendType) {
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
        itemId: legendItemName ?? title ?? idName ?? idKey,
        seriesId: this.id,
        enabled: visible,
        label: { text: legendItemName ?? title ?? idName ?? idKey },
        symbols: [
          {
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
            }
          }
        ],
        legendItemName
      };
      return [legendDatum];
    } else {
      return [];
    }
  }
  getTooltipHtml(nodeDatum) {
    const {
      id: seriesId,
      processedData,
      properties,
      ctx: { callbackCache }
    } = this;
    if (!processedData || !properties.isValid()) {
      return import_ag_charts_community106._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
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
      itemStyler,
      tooltip,
      strokeOpacity,
      lineDash,
      lineDashOffset
    } = properties;
    const { datum, stroke, idValue, colorValue, sizeValue, labelValue, itemId } = nodeDatum;
    const title = sanitizeHtml5(properties.title ?? legendItemName) ?? "";
    const contentLines = [];
    contentLines.push(sanitizeHtml5((idName != null ? `${idName}: ` : "") + idValue));
    if (colorValue != null) {
      contentLines.push(sanitizeHtml5((colorName ?? colorKey) + ": " + colorValue));
    }
    if (sizeValue != null) {
      contentLines.push(sanitizeHtml5((sizeName ?? sizeKey) + ": " + sizeValue));
    }
    if (labelValue != null && labelKey !== idKey) {
      contentLines.push(sanitizeHtml5((labelName ?? labelKey) + ": " + labelValue));
    }
    const content = contentLines.join("<br>");
    let format;
    if (itemStyler) {
      format = callbackCache.call(itemStyler, {
        highlighted: false,
        seriesId,
        datum,
        idKey,
        sizeKey,
        colorKey,
        labelKey,
        stroke,
        strokeWidth: this.getStrokeWidth(nodeDatum.strokeWidth ?? properties.strokeWidth),
        strokeOpacity,
        lineDash,
        lineDashOffset
      });
    }
    const color = format?.stroke ?? stroke ?? properties.stroke;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      {
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
        sizeName,
        ...this.getModuleTooltipParams()
      }
    );
  }
  computeFocusBounds(opts) {
    return findFocusedGeoGeometry(this, opts)?.computeTransformedBBox();
  }
};
MapLineSeries.className = "MapLineSeries";
MapLineSeries.type = "map-line";
__decorateClass([
  Validate43(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapLineSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-line/mapLineModule.ts
var { DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, DEFAULT_FONT_FAMILY: DEFAULT_FONT_FAMILY2, DEFAULT_LABEL_COLOUR: DEFAULT_LABEL_COLOUR2, singleSeriesPaletteFactory } = import_ag_charts_community107._Theme;
var MapLineModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-line",
  instanceConstructor: MapLineSeries,
  tooltipDefaults: { range: "exact" },
  themeTemplate: {
    ...MAP_THEME_DEFAULTS,
    series: {
      strokeWidth: 1,
      maxStrokeWidth: 3,
      lineDash: [0],
      lineDashOffset: 0,
      label: {
        enabled: true,
        fontStyle: void 0,
        fontWeight: void 0,
        fontSize: 12,
        fontFamily: DEFAULT_FONT_FAMILY2,
        color: DEFAULT_LABEL_COLOUR2
      }
    }
  },
  paletteFactory: (opts) => {
    const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
    const { fill } = singleSeriesPaletteFactory(opts);
    const defaultColorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    const { fills } = takeColors(colorsCount);
    return {
      colorRange: userPalette === "inbuilt" ? defaultColorRange : [fills[0], fills[1]],
      stroke: fill
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerModule.ts
var import_ag_charts_community110 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerSeries.ts
var import_ag_charts_community109 = require("ag-charts-community");

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
      center = lineString != null ? lineStringCenter(lineString)?.point : void 0;
      break;
    }
    case "LineString": {
      const lineString = geometry.coordinates;
      center = lineStringCenter(lineString)?.point;
      break;
    }
  }
  return center != null ? [center] : [];
}

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerSeriesProperties.ts
var import_ag_charts_community108 = require("ag-charts-community");
var {
  AND: AND9,
  ARRAY: ARRAY8,
  COLOR_STRING: COLOR_STRING13,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY4,
  FUNCTION: FUNCTION10,
  NUMBER_ARRAY: NUMBER_ARRAY2,
  OBJECT: OBJECT17,
  POSITIVE_NUMBER: POSITIVE_NUMBER17,
  RATIO: RATIO18,
  STRING: STRING18,
  MARKER_SHAPE,
  Validate: Validate44,
  SeriesProperties: SeriesProperties4,
  SeriesTooltip: SeriesTooltip8
} = import_ag_charts_community108._ModuleSupport;
var { Label: Label6, Circle } = import_ag_charts_community108._Scene;
var { Logger: Logger12 } = import_ag_charts_community108._Util;
var MapMarkerSeriesLabel = class extends Label6 {
  constructor() {
    super(...arguments);
    this.placement = "bottom";
  }
};
__decorateClass([
  Validate44(STRING18)
], MapMarkerSeriesLabel.prototype, "placement", 2);
var MapMarkerSeriesProperties = class extends SeriesProperties4 {
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
    this.tooltip = new SeriesTooltip8();
  }
  isValid() {
    const superIsValid = super.isValid();
    const hasTopology = this.idKey != null;
    const hasLatLon = this.latitudeKey != null && this.longitudeKey != null;
    if (!hasTopology && !hasLatLon) {
      Logger12.warnOnce(
        "Either both [topology] and [idKey] or both [latitudeKey] and [longitudeKey] must be set to render a map marker series."
      );
      return false;
    }
    return superIsValid;
  }
};
__decorateClass([
  Validate44(GEOJSON_OBJECT, { optional: true })
], MapMarkerSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "legendItemName", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate44(STRING18)
], MapMarkerSeriesProperties.prototype, "topologyIdKey", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "latitudeKey", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "latitudeName", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "longitudeKey", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "longitudeName", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "sizeKey", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate44(STRING18, { optional: true })
], MapMarkerSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate44(AND9(COLOR_STRING_ARRAY4, ARRAY8.restrict({ minLength: 1 })), { optional: true })
], MapMarkerSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate44(MARKER_SHAPE)
], MapMarkerSeriesProperties.prototype, "shape", 2);
__decorateClass([
  Validate44(POSITIVE_NUMBER17)
], MapMarkerSeriesProperties.prototype, "size", 2);
__decorateClass([
  Validate44(POSITIVE_NUMBER17, { optional: true })
], MapMarkerSeriesProperties.prototype, "maxSize", 2);
__decorateClass([
  Validate44(NUMBER_ARRAY2, { optional: true })
], MapMarkerSeriesProperties.prototype, "sizeDomain", 2);
__decorateClass([
  Validate44(COLOR_STRING13, { optional: true })
], MapMarkerSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate44(RATIO18)
], MapMarkerSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate44(COLOR_STRING13, { optional: true })
], MapMarkerSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate44(POSITIVE_NUMBER17)
], MapMarkerSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate44(RATIO18)
], MapMarkerSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate44(FUNCTION10, { optional: true })
], MapMarkerSeriesProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate44(OBJECT17)
], MapMarkerSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate44(OBJECT17)
], MapMarkerSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerSeries.ts
var {
  Validate: Validate45,
  fromToMotion: fromToMotion2,
  StateMachine: StateMachine2,
  getMissCount: getMissCount3,
  createDatumId: createDatumId5,
  DataModelSeries: DataModelSeries4,
  SeriesNodePickMode: SeriesNodePickMode7,
  Layers: Layers6,
  valueProperty: valueProperty9,
  computeMarkerFocusBounds
} = import_ag_charts_community109._ModuleSupport;
var { ColorScale: ColorScale3, LinearScale: LinearScale4 } = import_ag_charts_community109._Scale;
var { Group: Group10, Selection: Selection6, Text: Text10, getMarker } = import_ag_charts_community109._Scene;
var { sanitizeHtml: sanitizeHtml6, Logger: Logger13 } = import_ag_charts_community109._Util;
var MapMarkerSeries = class extends DataModelSeries4 {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: true,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode7.EXACT_SHAPE_MATCH, SeriesNodePickMode7.NEAREST_NODE]
    });
    this.properties = new MapMarkerSeriesProperties();
    this._chartTopology = void 0;
    this.colorScale = new ColorScale3();
    this.sizeScale = new LinearScale4();
    this.markerGroup = this.contentGroup.appendChild(
      new Group10({
        name: "markerGroup",
        layer: true,
        isVirtual: false,
        zIndex: Layers6.SERIES_LAYER_ZINDEX,
        zIndexSubOrder: this.getGroupZIndexSubOrder("marker")
      })
    );
    this.labelSelection = Selection6.select(
      this.labelGroup,
      Text10,
      false
    );
    this.markerSelection = Selection6.select(
      this.markerGroup,
      () => this.markerFactory(),
      false
    );
    this.highlightMarkerSelection = Selection6.select(
      this.highlightNode,
      () => this.markerFactory()
    );
    this.animationState = new StateMachine2(
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
          // chart.ts transitions to updateData on zoom change
          resize: {
            target: "ready",
            action: () => this.resetAllAnimation()
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
    return this.contextNodeData?.nodeData;
  }
  get topology() {
    return this.properties.topology ?? this._chartTopology;
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
  async processData(dataController) {
    if (this.data == null || !this.properties.isValid()) {
      return;
    }
    const { data, topology, sizeScale, colorScale } = this;
    const { topologyIdKey, idKey, latitudeKey, longitudeKey, sizeKey, colorKey, labelKey, sizeDomain, colorRange } = this.properties;
    const featureById = /* @__PURE__ */ new Map();
    topology?.features.forEach((feature) => {
      const property = feature.properties?.[topologyIdKey];
      if (property == null)
        return;
      featureById.set(property, feature);
    });
    const sizeScaleType = this.sizeScale.type;
    const colorScaleType = this.colorScale.type;
    const mercatorScaleType = this.scale?.type;
    const hasLatLon = latitudeKey != null && longitudeKey != null;
    const { dataModel, processedData } = await this.requestDataModel(dataController, data, {
      props: [
        ...idKey != null ? [
          valueProperty9(idKey, mercatorScaleType, { id: "idValue", includeProperty: false }),
          valueProperty9(idKey, mercatorScaleType, {
            id: "featureValue",
            includeProperty: false,
            processor: () => (datum) => featureById.get(datum)
          })
        ] : [],
        ...hasLatLon ? [
          valueProperty9(latitudeKey, mercatorScaleType, { id: "latValue" }),
          valueProperty9(longitudeKey, mercatorScaleType, { id: "lonValue" })
        ] : [],
        ...labelKey ? [valueProperty9(labelKey, "band", { id: "labelValue" })] : [],
        ...sizeKey ? [valueProperty9(sizeKey, sizeScaleType, { id: "sizeValue" })] : [],
        ...colorKey ? [valueProperty9(colorKey, colorScaleType, { id: "colorValue" })] : []
      ]
    });
    const featureIdx = idKey != null ? dataModel.resolveProcessedDataIndexById(this, `featureValue`) : void 0;
    const latIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `latValue`) : void 0;
    const lonIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `lonValue`) : void 0;
    this.topologyBounds = processedData.data.reduce(
      (current, { values }) => {
        const feature = featureIdx != null ? values[featureIdx] : void 0;
        const geometry = feature?.geometry;
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
      const processedSize = processedData.domain.values[sizeIdx] ?? [];
      sizeScale.domain = sizeDomain ?? processedSize;
    }
    if (colorRange != null && this.isColorScaleValid()) {
      const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, "colorValue");
      colorScale.domain = processedData.domain.values[colorKeyIdx];
      colorScale.range = colorRange;
      colorScale.update();
    }
    this.animationState.transition("updateData");
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
    const { width, height } = Text10.getTextSize(String(labelText), font);
    return {
      point: { x, y, size },
      label: { width, height, text: labelText },
      marker: getMarker(this.properties.shape),
      placement
    };
  }
  async createNodeData() {
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
    const markerMaxSize = properties.maxSize ?? properties.size;
    sizeScale.range = [Math.min(properties.size, markerMaxSize), markerMaxSize];
    const font = label.getFont();
    let projectedGeometries;
    if (idIdx != null && featureIdx != null) {
      projectedGeometries = /* @__PURE__ */ new Map();
      processedData.data.forEach(({ values }) => {
        const id = values[idIdx];
        const geometry = values[featureIdx]?.geometry;
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
      const projectedGeometry = idValue != null ? projectedGeometries?.get(idValue) : void 0;
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
      Logger13.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
    }
    return {
      itemId: seriesId,
      nodeData,
      labelData
    };
  }
  async updateSelections() {
    if (this.nodeDataRefresh) {
      this.contextNodeData = await this.createNodeData();
      this.nodeDataRefresh = false;
    }
  }
  checkScaleChange() {
    if (this.previousScale === this.scale)
      return false;
    this.previousScale = this.scale;
    return true;
  }
  async update({ seriesRect }) {
    const resize = this.checkResize(seriesRect);
    const scaleChange = this.checkScaleChange();
    const { labelSelection, markerSelection, highlightMarkerSelection } = this;
    await this.updateSelections();
    this.contentGroup.visible = this.visible;
    this.contentGroup.opacity = this.getOpacity();
    let highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
    if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
      highlightedDatum = void 0;
    }
    const nodeData = this.contextNodeData?.nodeData ?? [];
    this.labelSelection = await this.updateLabelSelection({ labelSelection });
    await this.updateLabelNodes({ labelSelection });
    this.markerSelection = await this.updateMarkerSelection({ markerData: nodeData, markerSelection });
    await this.updateMarkerNodes({ markerSelection, isHighlight: false, highlightedDatum });
    this.highlightMarkerSelection = await this.updateMarkerSelection({
      markerData: highlightedDatum != null ? [highlightedDatum] : [],
      markerSelection: highlightMarkerSelection
    });
    await this.updateMarkerNodes({
      markerSelection: highlightMarkerSelection,
      isHighlight: true,
      highlightedDatum
    });
    if (scaleChange || resize) {
      this.animationState.transition("resize");
    }
    this.animationState.transition("update");
  }
  async updateLabelSelection(opts) {
    const placedLabels = (this.isLabelEnabled() ? this.chart?.placeLabels().get(this) : void 0) ?? [];
    return opts.labelSelection.update(placedLabels);
  }
  async updateLabelNodes(opts) {
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
  }
  async updateMarkerSelection(opts) {
    const { markerData, markerSelection } = opts;
    return markerSelection.update(
      markerData,
      void 0,
      (datum) => createDatumId5([datum.index, datum.idValue, datum.lonValue, datum.latValue])
    );
  }
  async updateMarkerNodes(opts) {
    const { properties } = this;
    const { markerSelection, isHighlight, highlightedDatum } = opts;
    const { fill, fillOpacity, stroke, strokeOpacity } = properties;
    const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
    const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
    markerSelection.each((marker, markerDatum) => {
      const { datum, point } = markerDatum;
      const format = this.getMapMarkerStyle(markerDatum, isHighlight);
      marker.size = format?.size ?? point.size;
      marker.fill = highlightStyle?.fill ?? format?.fill ?? markerDatum.fill ?? fill;
      marker.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
      marker.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
      marker.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
      marker.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
      marker.translationX = point.x;
      marker.translationY = point.y;
      marker.zIndex = !isHighlight && highlightedDatum != null && datum === highlightedDatum.datum ? 1 : 0;
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
    return this.contextNodeData?.labelData ?? [];
  }
  getSeriesDomain() {
    return [NaN, NaN];
  }
  pickNodeClosestDatum(p) {
    const { x: x0, y: y0 } = this.rootGroup.transformPoint(p.x, p.y);
    let minDistanceSquared = Infinity;
    let minDatum;
    this.contextNodeData?.nodeData.forEach((datum) => {
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
        itemId: legendItemName ?? title ?? idName ?? idKey ?? this.id,
        seriesId: this.id,
        enabled: visible,
        label: { text: legendItemName ?? title ?? idName ?? idKey ?? this.id },
        symbols: [
          {
            marker: {
              shape,
              fill,
              fillOpacity,
              stroke,
              strokeWidth,
              strokeOpacity
            }
          }
        ],
        legendItemName
      };
      return [legendDatum];
    } else {
      return [];
    }
  }
  getTooltipHtml(nodeDatum) {
    const {
      id: seriesId,
      processedData,
      ctx: { callbackCache },
      properties
    } = this;
    if (!processedData || !this.properties.isValid()) {
      return import_ag_charts_community109._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
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
      itemStyler,
      tooltip,
      latitudeName,
      longitudeName,
      shape,
      size,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity
    } = properties;
    const { datum, fill, idValue, latValue, lonValue, sizeValue, colorValue, labelValue, itemId } = nodeDatum;
    const title = sanitizeHtml6(properties.title ?? legendItemName) ?? "";
    const contentLines = [];
    if (idValue != null) {
      contentLines.push(sanitizeHtml6((idName != null ? `${idName}: ` : "") + idValue));
    }
    if (colorValue != null) {
      contentLines.push(sanitizeHtml6((colorName ?? colorKey) + ": " + colorValue));
    }
    if (sizeValue != null) {
      contentLines.push(sanitizeHtml6((sizeName ?? sizeKey) + ": " + sizeValue));
    }
    if (labelValue != null && (idKey == null || idKey !== labelKey)) {
      contentLines.push(sanitizeHtml6((labelName ?? labelKey) + ": " + labelValue));
    }
    if (latValue != null && lonValue != null) {
      contentLines.push(
        sanitizeHtml6(
          `${Math.abs(latValue).toFixed(4)}\xB0 ${latValue >= 0 ? "N" : "S"}, ${Math.abs(lonValue).toFixed(4)}\xB0 ${latValue >= 0 ? "W" : "E"}`
        )
      );
    }
    const content = contentLines.join("<br>");
    let format;
    if (itemStyler) {
      format = callbackCache.call(itemStyler, {
        highlighted: false,
        seriesId,
        datum,
        idKey,
        sizeKey,
        colorKey,
        labelKey,
        latitudeKey,
        longitudeKey,
        shape,
        size,
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity
      });
    }
    const color = format?.fill ?? fill ?? properties.fill;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      {
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
        sizeName,
        ...this.getModuleTooltipParams()
      }
    );
  }
  getMapMarkerStyle(markerDatum, highlighted) {
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
      shape,
      itemStyler
    } = properties;
    const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
    if (itemStyler !== void 0) {
      return callbackCache.call(itemStyler, {
        seriesId,
        datum,
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
        shape,
        highlighted
      });
    }
  }
  getFormattedMarkerStyle(markerDatum) {
    const style = this.getMapMarkerStyle(markerDatum, true);
    return { size: style?.size ?? markerDatum.point.size };
  }
  computeFocusBounds(opts) {
    return computeMarkerFocusBounds(this, opts);
  }
};
MapMarkerSeries.className = "MapMarkerSeries";
MapMarkerSeries.type = "map-marker";
__decorateClass([
  Validate45(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapMarkerSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-marker/mapMarkerModule.ts
var { DEFAULT_LABEL_COLOUR: DEFAULT_LABEL_COLOUR3, DEFAULT_DIVERGING_SERIES_COLOUR_RANGE: DEFAULT_DIVERGING_SERIES_COLOUR_RANGE2, singleSeriesPaletteFactory: singleSeriesPaletteFactory2 } = import_ag_charts_community110._Theme;
var MapMarkerModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-marker",
  instanceConstructor: MapMarkerSeries,
  tooltipDefaults: { range: "exact" },
  themeTemplate: {
    ...MAP_THEME_DEFAULTS,
    series: {
      shape: "circle",
      maxSize: 30,
      fillOpacity: 0.5,
      label: {
        color: DEFAULT_LABEL_COLOUR3
      }
    }
  },
  paletteFactory: (opts) => {
    const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
    const { fill, stroke } = singleSeriesPaletteFactory2(opts);
    const defaultColorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE2);
    const { fills } = takeColors(colorsCount);
    return {
      fill,
      stroke,
      colorRange: userPalette === "inbuilt" ? defaultColorRange : [fills[0], fills[1]]
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundModule.ts
var import_ag_charts_community113 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundSeries.ts
var import_ag_charts_community112 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundSeriesProperties.ts
var import_ag_charts_community111 = require("ag-charts-community");
var { COLOR_STRING: COLOR_STRING14, LINE_DASH: LINE_DASH11, OBJECT: OBJECT18, POSITIVE_NUMBER: POSITIVE_NUMBER18, RATIO: RATIO19, Validate: Validate46, SeriesProperties: SeriesProperties5, SeriesTooltip: SeriesTooltip9 } = import_ag_charts_community111._ModuleSupport;
var MapShapeBackgroundSeriesProperties = class extends SeriesProperties5 {
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
    this.tooltip = new SeriesTooltip9();
  }
};
__decorateClass([
  Validate46(GEOJSON_OBJECT, { optional: true })
], MapShapeBackgroundSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate46(COLOR_STRING14)
], MapShapeBackgroundSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate46(RATIO19)
], MapShapeBackgroundSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate46(COLOR_STRING14)
], MapShapeBackgroundSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate46(RATIO19)
], MapShapeBackgroundSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate46(POSITIVE_NUMBER18)
], MapShapeBackgroundSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate46(LINE_DASH11)
], MapShapeBackgroundSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate46(POSITIVE_NUMBER18)
], MapShapeBackgroundSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate46(OBJECT18)
], MapShapeBackgroundSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundSeries.ts
var { createDatumId: createDatumId6, Series, SeriesNodePickMode: SeriesNodePickMode8, Validate: Validate47 } = import_ag_charts_community112._ModuleSupport;
var { Selection: Selection7, Group: Group11, PointerEvents: PointerEvents3 } = import_ag_charts_community112._Scene;
var { Logger: Logger14 } = import_ag_charts_community112._Util;
var MapShapeBackgroundSeries = class extends Series {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode8.EXACT_SHAPE_MATCH]
    });
    this.properties = new MapShapeBackgroundSeriesProperties();
    this._chartTopology = void 0;
    this.itemGroup = this.contentGroup.appendChild(new Group11({ name: "itemGroup" }));
    this.datumSelection = Selection7.select(
      this.itemGroup,
      () => this.nodeFactory()
    );
  }
  get topology() {
    return this.properties.topology ?? this._chartTopology;
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
  async processData() {
    const { topology } = this;
    this.topologyBounds = topology?.features.reduce((current, feature) => {
      const geometry = feature.geometry;
      if (geometry == null)
        return current;
      return geometryBbox(geometry, current);
    }, void 0);
    if (topology == null) {
      Logger14.warnOnce(`no topology was provided for [MapShapeBackgroundSeries]; nothing will be rendered.`);
    }
  }
  async createNodeData() {
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
  }
  async updateSelections() {
    if (this.nodeDataRefresh) {
      this.contextNodeData = await this.createNodeData();
      this.nodeDataRefresh = false;
    }
  }
  async update() {
    const { datumSelection } = this;
    await this.updateSelections();
    this.contentGroup.visible = this.visible;
    const { nodeData = [] } = this.contextNodeData ?? {};
    this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
    await this.updateDatumNodes({ datumSelection });
  }
  async updateDatumSelection(opts) {
    return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId6(datum.index));
  }
  async updateDatumNodes(opts) {
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
    return import_ag_charts_community112._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
  }
  pickFocus(_opts) {
    return void 0;
  }
};
MapShapeBackgroundSeries.className = "MapShapeBackgroundSeries";
MapShapeBackgroundSeries.type = "map-shape-background";
__decorateClass([
  Validate47(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapShapeBackgroundSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-shape-background/mapShapeBackgroundModule.ts
var { DEFAULT_BACKGROUND_COLOUR, DEFAULT_HIERARCHY_FILLS } = import_ag_charts_community113._Theme;
var MapShapeBackgroundModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-shape-background",
  instanceConstructor: MapShapeBackgroundSeries,
  tooltipDefaults: { range: "exact" },
  themeTemplate: {
    ...MAP_THEME_DEFAULTS,
    series: {
      stroke: DEFAULT_BACKGROUND_COLOUR,
      strokeWidth: 1
    }
  },
  paletteFactory: ({ themeTemplateParameters }) => {
    return {
      fill: themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS)?.[1]
    };
  }
};

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeModule.ts
var import_ag_charts_community116 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeSeries.ts
var import_ag_charts_community115 = require("ag-charts-community");

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
var import_ag_charts_community114 = require("ag-charts-community");
var {
  AND: AND10,
  ARRAY: ARRAY9,
  COLOR_STRING: COLOR_STRING15,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY5,
  FUNCTION: FUNCTION11,
  LINE_DASH: LINE_DASH12,
  OBJECT: OBJECT19,
  POSITIVE_NUMBER: POSITIVE_NUMBER19,
  RATIO: RATIO20,
  STRING: STRING19,
  Validate: Validate48,
  SeriesProperties: SeriesProperties6,
  SeriesTooltip: SeriesTooltip10
} = import_ag_charts_community114._ModuleSupport;
var MapShapeSeriesProperties = class extends SeriesProperties6 {
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
    this.tooltip = new SeriesTooltip10();
  }
};
__decorateClass([
  Validate48(GEOJSON_OBJECT, { optional: true })
], MapShapeSeriesProperties.prototype, "topology", 2);
__decorateClass([
  Validate48(STRING19, { optional: true })
], MapShapeSeriesProperties.prototype, "title", 2);
__decorateClass([
  Validate48(STRING19, { optional: true })
], MapShapeSeriesProperties.prototype, "legendItemName", 2);
__decorateClass([
  Validate48(STRING19)
], MapShapeSeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate48(STRING19, { optional: true })
], MapShapeSeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate48(STRING19)
], MapShapeSeriesProperties.prototype, "topologyIdKey", 2);
__decorateClass([
  Validate48(STRING19, { optional: true })
], MapShapeSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate48(STRING19, { optional: true })
], MapShapeSeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate48(STRING19, { optional: true })
], MapShapeSeriesProperties.prototype, "colorKey", 2);
__decorateClass([
  Validate48(STRING19, { optional: true })
], MapShapeSeriesProperties.prototype, "colorName", 2);
__decorateClass([
  Validate48(AND10(COLOR_STRING_ARRAY5, ARRAY9.restrict({ minLength: 1 })), { optional: true })
], MapShapeSeriesProperties.prototype, "colorRange", 2);
__decorateClass([
  Validate48(COLOR_STRING15)
], MapShapeSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate48(RATIO20)
], MapShapeSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate48(COLOR_STRING15)
], MapShapeSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate48(RATIO20)
], MapShapeSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER19)
], MapShapeSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate48(LINE_DASH12)
], MapShapeSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER19)
], MapShapeSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate48(POSITIVE_NUMBER19)
], MapShapeSeriesProperties.prototype, "padding", 2);
__decorateClass([
  Validate48(FUNCTION11, { optional: true })
], MapShapeSeriesProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate48(OBJECT19)
], MapShapeSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate48(OBJECT19)
], MapShapeSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeSeries.ts
var { getMissCount: getMissCount4, createDatumId: createDatumId7, DataModelSeries: DataModelSeries5, SeriesNodePickMode: SeriesNodePickMode9, valueProperty: valueProperty10, Validate: Validate49 } = import_ag_charts_community115._ModuleSupport;
var { ColorScale: ColorScale4 } = import_ag_charts_community115._Scale;
var { Group: Group12, Selection: Selection8, Text: Text11, PointerEvents: PointerEvents4 } = import_ag_charts_community115._Scene;
var { sanitizeHtml: sanitizeHtml7, Logger: Logger15 } = import_ag_charts_community115._Util;
var fixedScale = import_ag_charts_community115._ModuleSupport.MercatorScale.fixedScale();
var MapShapeSeries = class extends DataModelSeries5 {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode9.EXACT_SHAPE_MATCH, SeriesNodePickMode9.NEAREST_NODE]
    });
    this.properties = new MapShapeSeriesProperties();
    this._chartTopology = void 0;
    this.colorScale = new ColorScale4();
    this.itemGroup = this.contentGroup.appendChild(new Group12({ name: "itemGroup" }));
    this.itemLabelGroup = this.contentGroup.appendChild(new Group12({ name: "itemLabelGroup" }));
    this.datumSelection = Selection8.select(
      this.itemGroup,
      () => this.nodeFactory()
    );
    this.labelSelection = Selection8.select(
      this.itemLabelGroup,
      Text11
    );
    this.highlightDatumSelection = Selection8.select(
      this.highlightNode,
      () => this.nodeFactory()
    );
    this.previousLabelLayouts = void 0;
    this._previousDatumMidPoint = void 0;
    this.itemLabelGroup.pointerEvents = PointerEvents4.None;
  }
  getNodeData() {
    return this.contextNodeData?.nodeData;
  }
  get topology() {
    return this.properties.topology ?? this._chartTopology;
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
  async processData(dataController) {
    if (this.data == null || !this.properties.isValid()) {
      return;
    }
    const { data, topology, colorScale } = this;
    const { topologyIdKey, idKey, colorKey, labelKey, colorRange } = this.properties;
    const featureById = /* @__PURE__ */ new Map();
    topology?.features.forEach((feature) => {
      const property = feature.properties?.[topologyIdKey];
      if (property == null || !containsType(feature.geometry, 1 /* Polygon */))
        return;
      featureById.set(property, feature);
    });
    const colorScaleType = this.colorScale.type;
    const mercatorScaleType = this.scale?.type;
    const { dataModel, processedData } = await this.requestDataModel(dataController, data, {
      props: [
        valueProperty10(idKey, mercatorScaleType, { id: "idValue", includeProperty: false }),
        valueProperty10(idKey, mercatorScaleType, {
          id: "featureValue",
          includeProperty: false,
          processor: () => (datum) => featureById.get(datum)
        }),
        ...labelKey ? [valueProperty10(labelKey, "band", { id: "labelValue" })] : [],
        ...colorKey ? [valueProperty10(colorKey, colorScaleType, { id: "colorValue" })] : []
      ]
    });
    const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`);
    this.topologyBounds = processedData.data.reduce(
      (current, { values }) => {
        const feature = values[featureIdx];
        const geometry = feature?.geometry;
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
      Logger15.warnOnce(`no topology was provided for [MapShapeSeries]; nothing will be rendered.`);
    }
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
    const baseSize = Text11.getTextSize(String(labelText), font);
    const numLines = labelText.split("\n").length;
    const aspectRatio = (baseSize.width + 2 * padding) / (numLines * AutoSizedLabel.lineHeight(label.fontSize) + 2 * padding);
    if (previousLabelLayout?.geometry === geometry && previousLabelLayout?.labelText === labelText && previousLabelLayout?.aspectRatio === aspectRatio) {
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
    if (text === Text11.ellipsis)
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
  async createNodeData() {
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
      const idValue = values[idIdx];
      const colorValue = colorIdx != null ? values[colorIdx] : void 0;
      const labelValue = labelIdx != null ? values[labelIdx] : void 0;
      const geometry = values[featureIdx]?.geometry;
      if (geometry == null) {
        missingGeometries.push(idValue);
      }
      const color = colorScaleValid && colorValue != null ? colorScale.convert(colorValue) : void 0;
      const labelLayout = this.getLabelLayout(
        datum,
        labelValue,
        font,
        geometry,
        previousLabelLayouts?.get(idValue)
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
        fill: color ?? fillProperty,
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
      Logger15.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
    }
    return {
      itemId: seriesId,
      nodeData,
      labelData
    };
  }
  async updateSelections() {
    if (this.nodeDataRefresh) {
      this.contextNodeData = await this.createNodeData();
      this.nodeDataRefresh = false;
    }
  }
  async update() {
    const { datumSelection, labelSelection, highlightDatumSelection } = this;
    await this.updateSelections();
    this.contentGroup.visible = this.visible;
    this.contentGroup.opacity = this.getOpacity();
    let highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
    if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
      highlightedDatum = void 0;
    }
    const nodeData = this.contextNodeData?.nodeData ?? [];
    const labelData = this.contextNodeData?.labelData ?? [];
    this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
    await this.updateDatumNodes({ datumSelection, isHighlight: false });
    this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection });
    await this.updateLabelNodes({ labelSelection });
    this.highlightDatumSelection = await this.updateDatumSelection({
      nodeData: highlightedDatum != null ? [highlightedDatum] : [],
      datumSelection: highlightDatumSelection
    });
    await this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
  }
  async updateDatumSelection(opts) {
    return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId7(datum.idValue));
  }
  async updateDatumNodes(opts) {
    const {
      id: seriesId,
      properties,
      ctx: { callbackCache }
    } = this;
    const { datumSelection, isHighlight } = opts;
    const { idKey, colorKey, labelKey, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset, itemStyler } = properties;
    const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
    const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
    datumSelection.each((geoGeometry, datum) => {
      const { projectedGeometry } = datum;
      if (projectedGeometry == null) {
        geoGeometry.visible = false;
        geoGeometry.projectedGeometry = void 0;
        return;
      }
      let format;
      if (itemStyler != null) {
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
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
        });
      }
      geoGeometry.visible = true;
      geoGeometry.projectedGeometry = projectedGeometry;
      geoGeometry.fill = highlightStyle?.fill ?? format?.fill ?? datum.fill;
      geoGeometry.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
      geoGeometry.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
      geoGeometry.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
      geoGeometry.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
      geoGeometry.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
      geoGeometry.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
    });
  }
  async updateLabelSelection(opts) {
    const labels = this.isLabelEnabled() ? opts.labelData : [];
    return opts.labelSelection.update(labels);
  }
  async updateLabelNodes(opts) {
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
    if (_previousDatumMidPoint?.datum === datum) {
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
        itemId: legendItemName ?? title ?? idName ?? idKey,
        seriesId: this.id,
        enabled: visible,
        label: { text: legendItemName ?? title ?? idName ?? idKey },
        symbols: [
          {
            marker: {
              fill,
              fillOpacity,
              stroke,
              strokeWidth,
              strokeOpacity
            }
          }
        ],
        legendItemName
      };
      return [legendDatum];
    } else {
      return [];
    }
  }
  getTooltipHtml(nodeDatum) {
    const {
      id: seriesId,
      processedData,
      ctx: { callbackCache },
      properties
    } = this;
    if (!processedData || !properties.isValid()) {
      return import_ag_charts_community115._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
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
      strokeOpacity,
      fillOpacity,
      lineDash,
      lineDashOffset,
      itemStyler,
      tooltip
    } = properties;
    const { datum, fill, idValue, colorValue, labelValue, itemId } = nodeDatum;
    const title = sanitizeHtml7(properties.title ?? legendItemName) ?? "";
    const contentLines = [];
    contentLines.push(sanitizeHtml7((idName != null ? `${idName}: ` : "") + idValue));
    if (colorValue != null) {
      contentLines.push(sanitizeHtml7((colorName ?? colorKey) + ": " + colorValue));
    }
    if (labelValue != null && labelKey !== idKey) {
      contentLines.push(sanitizeHtml7((labelName ?? labelKey) + ": " + labelValue));
    }
    const content = contentLines.join("<br>");
    let format;
    if (itemStyler) {
      format = callbackCache.call(itemStyler, {
        seriesId,
        datum,
        idKey,
        colorKey,
        labelKey,
        fill,
        stroke,
        strokeWidth: this.getStrokeWidth(strokeWidth),
        highlighted: false,
        fillOpacity,
        strokeOpacity,
        lineDash,
        lineDashOffset
      });
    }
    const color = format?.fill ?? fill;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      {
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
        labelName,
        ...this.getModuleTooltipParams()
      }
    );
  }
  computeFocusBounds(opts) {
    return findFocusedGeoGeometry(this, opts);
  }
};
MapShapeSeries.className = "MapShapeSeries";
MapShapeSeries.type = "map-shape";
__decorateClass([
  Validate49(GEOJSON_OBJECT, { optional: true, property: "topology" })
], MapShapeSeries.prototype, "_chartTopology", 2);

// packages/ag-charts-enterprise/src/series/map-shape/mapShapeModule.ts
var {
  DEFAULT_INVERTED_LABEL_COLOUR,
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE: DEFAULT_DIVERGING_SERIES_COLOUR_RANGE3,
  DEFAULT_BACKGROUND_COLOUR: DEFAULT_BACKGROUND_COLOUR2,
  singleSeriesPaletteFactory: singleSeriesPaletteFactory3
} = import_ag_charts_community116._Theme;
var MapShapeModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["topology"],
  identifier: "map-shape",
  instanceConstructor: MapShapeSeries,
  tooltipDefaults: { range: "exact" },
  themeTemplate: {
    ...MAP_THEME_DEFAULTS,
    series: {
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
  },
  paletteFactory: (opts) => {
    const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
    const { fill } = singleSeriesPaletteFactory3(opts);
    const defaultColorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE3);
    const { fills } = takeColors(colorsCount);
    return {
      fill,
      stroke: themeTemplateParameters.get(DEFAULT_BACKGROUND_COLOUR2),
      colorRange: userPalette === "inbuilt" ? defaultColorRange : [fills[0], fills[1]]
    };
  }
};

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleModule.ts
var import_ag_charts_community123 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleSeries.ts
var import_ag_charts_community121 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesBase.ts
var import_ag_charts_community117 = require("ag-charts-community");
var {
  isDefined: isDefined3,
  ChartAxisDirection: ChartAxisDirection15,
  PolarAxis,
  diff: diff4,
  fixNumericExtent: fixNumericExtent4,
  groupAccumulativeValueProperty: groupAccumulativeValueProperty2,
  keyProperty: keyProperty5,
  mergeDefaults: mergeDefaults6,
  normaliseGroupTo,
  resetLabelFn,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation2,
  seriesLabelFadeOutAnimation,
  valueProperty: valueProperty11,
  animationValidation: animationValidation4,
  isFiniteNumber: isFiniteNumber5,
  SeriesNodePickMode: SeriesNodePickMode10
} = import_ag_charts_community117._ModuleSupport;
var { BandScale: BandScale3 } = import_ag_charts_community117._Scale;
var { motion: motion3 } = import_ag_charts_community117._Scene;
var { isNumber, normalizeAngle360: normalizeAngle3606, sanitizeHtml: sanitizeHtml8 } = import_ag_charts_community117._Util;
var RadialColumnSeriesNodeEvent = class extends import_ag_charts_community117._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadialColumnSeriesBase = class extends import_ag_charts_community117._ModuleSupport.PolarSeries {
  constructor(moduleCtx, {
    animationResetFns
  }) {
    super({
      moduleCtx,
      useLabelLayer: true,
      canHaveAxes: true,
      pickModes: [SeriesNodePickMode10.NEAREST_NODE, SeriesNodePickMode10.EXACT_SHAPE_MATCH],
      animationResetFns: {
        ...animationResetFns,
        label: resetLabelFn
      }
    });
    this.NodeEvent = RadialColumnSeriesNodeEvent;
    this.groupScale = new BandScale3();
    this.circleCache = { r: 0, cx: 0, cy: 0 };
  }
  addChartEventListeners() {
    this.destroyFns.push(
      this.ctx.chartEventManager?.addListener("legend-item-click", (event) => this.onLegendItemClick(event)),
      this.ctx.chartEventManager?.addListener(
        "legend-item-double-click",
        (event) => this.onLegendItemDoubleClick(event)
      )
    );
  }
  getSeriesDomain(direction) {
    const { axes, dataModel, processedData } = this;
    if (!processedData || !dataModel)
      return [];
    if (direction === ChartAxisDirection15.X) {
      return dataModel.getDomain(this, "angleValue", "key", processedData);
    } else {
      const radiusAxis = axes[ChartAxisDirection15.Y];
      const yExtent = dataModel.getDomain(this, "radiusValue-end", "value", processedData);
      const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
      return fixNumericExtent4(fixedYExtent, radiusAxis);
    }
  }
  async processData(dataController) {
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
    const radiusScaleType = this.axes[ChartAxisDirection15.Y]?.scale.type;
    const angleScaleType = this.axes[ChartAxisDirection15.X]?.scale.type;
    await this.requestDataModel(dataController, this.data, {
      props: [
        keyProperty5(angleKey, angleScaleType, { id: "angleValue" }),
        valueProperty11(radiusKey, radiusScaleType, {
          id: "radiusValue-raw",
          invalidValue: null,
          ...visibleProps
        }),
        ...groupAccumulativeValueProperty2(
          radiusKey,
          "normal",
          "current",
          {
            id: `radiusValue-end`,
            rangeId: `radiusValue-range`,
            invalidValue: null,
            groupId: stackGroupId,
            separateNegative: true,
            ...visibleProps
          },
          radiusScaleType
        ),
        ...groupAccumulativeValueProperty2(
          radiusKey,
          "trailing",
          "current",
          {
            id: `radiusValue-start`,
            invalidValue: null,
            groupId: stackGroupTrailingId,
            separateNegative: true,
            ...visibleProps
          },
          radiusScaleType
        ),
        ...extraProps
      ]
    });
    this.animationState.transition("updateData");
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
    return this.axes[ChartAxisDirection15.Y]?.isReversed();
  }
  async maybeRefreshNodeData() {
    const circleChanged = this.didCircleChange();
    if (!circleChanged && !this.nodeDataRefresh)
      return;
    const { nodeData = [] } = await this.createNodeData() ?? {};
    this.nodeData = nodeData;
    this.nodeDataRefresh = false;
  }
  getAxisInnerRadius() {
    const radiusAxis = this.axes[ChartAxisDirection15.Y];
    return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  async createNodeData() {
    const { processedData, dataModel, groupScale } = this;
    if (!processedData || !dataModel || !this.properties.isValid()) {
      return;
    }
    const angleAxis = this.axes[ChartAxisDirection15.X];
    const radiusAxis = this.axes[ChartAxisDirection15.Y];
    const angleScale = angleAxis?.scale;
    const radiusScale = radiusAxis?.scale;
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
    const groupAngleStep = angleScale.bandwidth ?? 0;
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
      const { datum, keys, values, aggValues } = group;
      const angleDatum = keys[0];
      const radiusDatum = values[radiusRawIndex];
      const isPositive = radiusDatum >= 0 && !Object.is(radiusDatum, -0);
      const innerRadiusDatum = values[radiusStartIndex];
      const outerRadiusDatum = values[radiusEndIndex];
      const radiusRange = aggValues?.[radiusRangeIndex][isPositive ? 1 : 0] ?? 0;
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
        let groupAngle = angleScale.convert(angleDatum);
        if (visibleGroupCount === 1) {
          groupAngle -= groupScale.bandwidth / 2;
        }
        startAngle = normalizeAngle3606(groupAngle + groupScale.convert(String(groupIndex)));
        endAngle = normalizeAngle3606(startAngle + groupScale.bandwidth);
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
  }
  getColumnWidth(_startAngle, _endAngle) {
    return NaN;
  }
  async update({ seriesRect }) {
    const resize = this.checkResize(seriesRect);
    await this.maybeRefreshNodeData();
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
  }
  updateSectorSelection(selection, highlighted) {
    let selectionData = [];
    if (highlighted) {
      const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
      if (activeHighlight?.datum && activeHighlight.series === this) {
        selectionData = [activeHighlight];
      }
    } else {
      selectionData = this.nodeData;
    }
    const {
      fill,
      fillOpacity,
      stroke,
      strokeOpacity,
      strokeWidth,
      lineDash,
      lineDashOffset,
      cornerRadius,
      angleKey,
      radiusKey
    } = mergeDefaults6(highlighted ? this.properties.highlightStyle.item : null, this.properties);
    const idFn = (datum) => datum.angleValue;
    selection.update(selectionData, void 0, idFn).each((node, datum) => {
      const format = this.properties.itemStyler ? this.ctx.callbackCache.call(this.properties.itemStyler, {
        datum: datum.datum,
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset,
        cornerRadius,
        highlighted,
        angleKey,
        radiusKey,
        seriesId: this.id
      }) : void 0;
      this.updateItemPath(node, datum, highlighted, format);
      node.fill = format?.fill ?? fill;
      node.fillOpacity = format?.fillOpacity ?? fillOpacity;
      node.stroke = format?.stroke ?? stroke;
      node.strokeWidth = format?.strokeWidth ?? strokeWidth;
      node.strokeOpacity = format?.strokeOpacity ?? strokeOpacity;
      node.lineDash = format?.lineDash ?? lineDash;
      node.lineDashOffset = format?.lineDashOffset ?? lineDashOffset;
      node.cornerRadius = format?.cornerRadius ?? cornerRadius;
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
    const { id: seriesId, axes, dataModel } = this;
    const {
      angleKey,
      radiusKey,
      angleName,
      radiusName,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cornerRadius,
      itemStyler,
      tooltip
    } = this.properties;
    const { angleValue, radiusValue, datum, itemId } = nodeDatum;
    const xAxis = axes[ChartAxisDirection15.X];
    const yAxis = axes[ChartAxisDirection15.Y];
    if (!this.properties.isValid() || !(xAxis && yAxis && isNumber(radiusValue)) || !dataModel) {
      return import_ag_charts_community117._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const angleString = xAxis.formatDatum(angleValue);
    const radiusString = yAxis.formatDatum(radiusValue);
    const title = sanitizeHtml8(radiusName);
    const content = sanitizeHtml8(`${angleString}: ${radiusString}`);
    const { fill: color } = (itemStyler && this.ctx.callbackCache.call(itemStyler, {
      highlighted: false,
      seriesId,
      datum,
      angleKey,
      radiusKey,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cornerRadius
    })) ?? { fill };
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
    if (!this.data?.length || !this.properties.isValid() || legendType !== "category") {
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
          text: radiusName ?? radiusKey
        },
        symbols: [
          {
            marker: {
              fill: fill ?? "rgba(0, 0, 0, 0)",
              stroke: stroke ?? "rgba(0, 0, 0, 0)",
              fillOpacity: fillOpacity ?? 1,
              strokeOpacity: strokeOpacity ?? 1,
              strokeWidth
            }
          }
        ]
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
var import_ag_charts_community118 = require("ag-charts-community");
var { Label: Label7 } = import_ag_charts_community118._Scene;
var {
  SeriesProperties: SeriesProperties7,
  SeriesTooltip: SeriesTooltip11,
  Validate: Validate50,
  COLOR_STRING: COLOR_STRING16,
  DEGREE: DEGREE3,
  FUNCTION: FUNCTION12,
  LINE_DASH: LINE_DASH13,
  NUMBER: NUMBER12,
  OBJECT: OBJECT20,
  POSITIVE_NUMBER: POSITIVE_NUMBER20,
  RATIO: RATIO21,
  STRING: STRING20
} = import_ag_charts_community118._ModuleSupport;
var RadialColumnSeriesBaseProperties = class extends SeriesProperties7 {
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
    this.label = new Label7();
    this.tooltip = new SeriesTooltip11();
  }
};
__decorateClass([
  Validate50(STRING20)
], RadialColumnSeriesBaseProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate50(STRING20, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "angleName", 2);
__decorateClass([
  Validate50(STRING20)
], RadialColumnSeriesBaseProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate50(STRING20, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate50(COLOR_STRING16)
], RadialColumnSeriesBaseProperties.prototype, "fill", 2);
__decorateClass([
  Validate50(RATIO21)
], RadialColumnSeriesBaseProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate50(COLOR_STRING16)
], RadialColumnSeriesBaseProperties.prototype, "stroke", 2);
__decorateClass([
  Validate50(POSITIVE_NUMBER20)
], RadialColumnSeriesBaseProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate50(RATIO21)
], RadialColumnSeriesBaseProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate50(LINE_DASH13)
], RadialColumnSeriesBaseProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate50(POSITIVE_NUMBER20)
], RadialColumnSeriesBaseProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate50(POSITIVE_NUMBER20)
], RadialColumnSeriesBaseProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate50(FUNCTION12, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate50(DEGREE3)
], RadialColumnSeriesBaseProperties.prototype, "rotation", 2);
__decorateClass([
  Validate50(STRING20, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "stackGroup", 2);
__decorateClass([
  Validate50(NUMBER12, { optional: true })
], RadialColumnSeriesBaseProperties.prototype, "normalizedTo", 2);
__decorateClass([
  Validate50(OBJECT20)
], RadialColumnSeriesBaseProperties.prototype, "label", 2);
__decorateClass([
  Validate50(OBJECT20)
], RadialColumnSeriesBaseProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/nightingale/nightingaleUtil.ts
var import_ag_charts_community120 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnUtil.ts
var import_ag_charts_community119 = require("ag-charts-community");
var { motion: motion4 } = import_ag_charts_community119._Scene;
function createAngleMotionCalculator() {
  const angles = {
    startAngle: /* @__PURE__ */ new Map(),
    endAngle: /* @__PURE__ */ new Map()
  };
  const angleKeys = ["startAngle", "endAngle"];
  const calculate = (node, datum, status) => {
    angleKeys.forEach((key) => {
      const map = angles[key];
      let from2 = (status === "removed" || status === "updated" ? node : datum)[key];
      let to2 = (status === "removed" ? node : datum)[key];
      if (isNaN(to2)) {
        to2 = node.previousDatum?.[key] ?? NaN;
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
var { SectorBox, motion: motion5 } = import_ag_charts_community120._Scene;
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
    clipSector ?? (clipSector = new SectorBox(startAngle, endAngle, innerRadius, outerRadius));
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
var { Sector: Sector4, SectorBox: SectorBox2 } = import_ag_charts_community121._Scene;
var NightingaleSeries = class extends RadialColumnSeriesBase {
  // TODO: Enable once the options contract has been revisited
  // @Validate(POSITIVE_NUMBER)
  // sectorSpacing = 1;
  constructor(moduleCtx) {
    super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
    this.properties = new RadialColumnSeriesBaseProperties();
  }
  getStackId() {
    const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
    return `nightingale-stack-${groupIndex}-yValues`;
  }
  nodeFactory() {
    return new Sector4();
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
var import_ag_charts_community122 = require("ag-charts-community");
var NIGHTINGALE_SERIES_THEME = {
  series: {
    strokeWidth: 1,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community122._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community122._Theme.DEFAULT_LABEL_COLOUR
    }
  },
  axes: {
    [import_ag_charts_community122._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      shape: import_ag_charts_community122._Theme.POLAR_AXIS_SHAPE.CIRCLE,
      groupPaddingInner: 0,
      paddingInner: 0,
      label: {
        padding: 10
      }
    },
    [import_ag_charts_community122._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
      shape: import_ag_charts_community122._Theme.POLAR_AXIS_SHAPE.CIRCLE
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
  tooltipDefaults: { range: "exact" },
  defaultAxes: [
    {
      type: import_ag_charts_community123._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: import_ag_charts_community123._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER
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
      stroke: userPalette !== "inbuilt" ? stroke : import_ag_charts_community123._Theme.DEFAULT_POLAR_SERIES_STROKE
    };
  },
  stackable: true,
  groupable: true,
  stackedByDefault: true
};

// packages/ag-charts-enterprise/src/series/ohlc/ohlcModule.ts
var import_ag_charts_community127 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/ohlc/ohlcSeries.ts
var import_ag_charts_community126 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/ohlc/ohlcGroup.ts
var import_ag_charts_community124 = require("ag-charts-community");
var OhlcGroup = class extends CandlestickBaseGroup {
  constructor() {
    super();
    this.append([
      new import_ag_charts_community124._Scene.Line({ tag: 0 /* Body */ }),
      new import_ag_charts_community124._Scene.Line({ tag: 1 /* Open */ }),
      new import_ag_charts_community124._Scene.Line({ tag: 2 /* Close */ })
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
    const selection = import_ag_charts_community124._Scene.Selection.select(this, import_ag_charts_community124._Scene.Rect);
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
    const selection = import_ag_charts_community124._Scene.Selection.select(this, import_ag_charts_community124._Scene.Rect);
    const [body] = selection.selectByTag(0 /* Body */);
    const [open] = selection.selectByTag(1 /* Open */);
    const [close] = selection.selectByTag(2 /* Close */);
    body.setProperties(activeStyles);
    open.setProperties(activeStyles);
    close.setProperties(activeStyles);
  }
};

// packages/ag-charts-enterprise/src/series/ohlc/ohlcSeriesProperties.ts
var import_ag_charts_community125 = require("ag-charts-community");
var { BaseProperties: BaseProperties14, Validate: Validate51, COLOR_STRING: COLOR_STRING17, FUNCTION: FUNCTION13, LINE_DASH: LINE_DASH14, OBJECT: OBJECT21, POSITIVE_NUMBER: POSITIVE_NUMBER21, RATIO: RATIO22 } = import_ag_charts_community125._ModuleSupport;
var OhlcSeriesItem = class extends BaseProperties14 {
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
  Validate51(COLOR_STRING17)
], OhlcSeriesItem.prototype, "stroke", 2);
__decorateClass([
  Validate51(POSITIVE_NUMBER21)
], OhlcSeriesItem.prototype, "strokeWidth", 2);
__decorateClass([
  Validate51(RATIO22)
], OhlcSeriesItem.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate51(LINE_DASH14)
], OhlcSeriesItem.prototype, "lineDash", 2);
__decorateClass([
  Validate51(POSITIVE_NUMBER21)
], OhlcSeriesItem.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate51(FUNCTION13, { optional: true })
], OhlcSeriesItem.prototype, "itemStyler", 2);
var OhlcSeriesItems = class extends BaseProperties14 {
  constructor() {
    super(...arguments);
    this.up = new OhlcSeriesItem();
    this.down = new OhlcSeriesItem();
  }
};
__decorateClass([
  Validate51(OBJECT21)
], OhlcSeriesItems.prototype, "up", 2);
__decorateClass([
  Validate51(OBJECT21)
], OhlcSeriesItems.prototype, "down", 2);
var OhlcSeriesProperties = class extends CandlestickSeriesProperties {
  constructor() {
    super(...arguments);
    this.item = new OhlcSeriesItems();
  }
};
__decorateClass([
  Validate51(OBJECT21)
], OhlcSeriesProperties.prototype, "item", 2);
__decorateClass([
  Validate51(FUNCTION13, { optional: true })
], OhlcSeriesProperties.prototype, "itemStyler", 2);

// packages/ag-charts-enterprise/src/series/ohlc/ohlcSeries.ts
var { mergeDefaults: mergeDefaults7 } = import_ag_charts_community126._ModuleSupport;
var OhlcSeries = class extends OhlcSeriesBase {
  constructor(moduleCtx) {
    super(moduleCtx, resetCandlestickSelectionsFn);
    this.properties = new OhlcSeriesProperties();
  }
  async createNodeData() {
    const baseNodeData = this.createBaseNodeData();
    if (!baseNodeData) {
      return;
    }
    const nodeData = baseNodeData.nodeData.map((datum) => {
      const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.getItemConfig(datum.itemId);
      return {
        ...datum,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset
      };
    });
    return { ...baseNodeData, nodeData };
  }
  getFormattedStyles(nodeDatum, highlighted = false) {
    const {
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const { xKey, openKey, closeKey, highKey, lowKey, itemStyler } = this.properties;
    const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.getItemConfig(nodeDatum.itemId);
    if (itemStyler) {
      const formatStyles = callbackCache.call(itemStyler, {
        datum: nodeDatum.datum,
        itemId: nodeDatum.itemId,
        seriesId,
        highlighted,
        xKey,
        openKey,
        closeKey,
        highKey,
        lowKey,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset
      });
      if (formatStyles) {
        return mergeDefaults7(formatStyles, this.getSeriesStyles(nodeDatum));
      }
    }
    return this.getSeriesStyles(nodeDatum);
  }
  nodeFactory() {
    return new OhlcGroup();
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

// packages/ag-charts-enterprise/src/series/ohlc/ohlcModule.ts
var OhlcModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "ohlc",
  instanceConstructor: OhlcSeries,
  tooltipDefaults: { range: "nearest" },
  defaultAxes: [
    {
      type: import_ag_charts_community127._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community127._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community127._Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME,
      position: import_ag_charts_community127._Theme.POSITION.BOTTOM
    }
  ],
  themeTemplate: {
    animation: { enabled: false },
    axes: {
      [import_ag_charts_community127._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
        crosshair: {
          snap: false
        }
      },
      [import_ag_charts_community127._Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
        groupPaddingInner: 0,
        crosshair: {
          enabled: true
        }
      }
    }
  },
  groupable: false,
  paletteFactory: ({ takeColors, colorsCount, userPalette, palette }) => {
    if (userPalette === "user-indexed") {
      const {
        strokes: [stroke]
      } = takeColors(colorsCount);
      return {
        item: {
          up: {
            stroke
          },
          down: {
            stroke
          }
        }
      };
    }
    return {
      item: {
        up: { stroke: palette.up.stroke },
        down: { stroke: palette.down.stroke }
      }
    };
  }
};

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaModule.ts
var import_ag_charts_community133 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radar/radarThemes.ts
var import_ag_charts_community128 = require("ag-charts-community");
var BASE_RADAR_SERIES_THEME = {
  series: {
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community128._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community128._Theme.DEFAULT_LABEL_COLOUR
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
    [import_ag_charts_community128._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      label: {
        padding: 10
      }
    }
  }
};
var RADAR_LINE_SERIES_THEME = import_ag_charts_community128._ModuleSupport.mergeDefaults(
  {
    series: {
      strokeWidth: 2
    }
  },
  BASE_RADAR_SERIES_THEME
);
var RADAR_AREA_SERIES_THEME = import_ag_charts_community128._ModuleSupport.mergeDefaults(
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
var import_ag_charts_community132 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radar/radarSeries.ts
var import_ag_charts_community130 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radar/radarSeriesProperties.ts
var import_ag_charts_community129 = require("ag-charts-community");
var { Label: Label8 } = import_ag_charts_community129._Scene;
var {
  SeriesMarker,
  SeriesProperties: SeriesProperties8,
  SeriesTooltip: SeriesTooltip12,
  Validate: Validate52,
  BOOLEAN: BOOLEAN17,
  COLOR_STRING: COLOR_STRING18,
  DEGREE: DEGREE4,
  FUNCTION: FUNCTION14,
  LINE_DASH: LINE_DASH15,
  OBJECT: OBJECT22,
  POSITIVE_NUMBER: POSITIVE_NUMBER22,
  RATIO: RATIO23,
  STRING: STRING21
} = import_ag_charts_community129._ModuleSupport;
var RadarSeriesProperties = class extends SeriesProperties8 {
  constructor() {
    super(...arguments);
    this.stroke = "black";
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.rotation = 0;
    this.marker = new SeriesMarker();
    this.label = new Label8();
    this.tooltip = new SeriesTooltip12();
    this.connectMissingData = false;
  }
};
__decorateClass([
  Validate52(STRING21)
], RadarSeriesProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate52(STRING21)
], RadarSeriesProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate52(STRING21, { optional: true })
], RadarSeriesProperties.prototype, "angleName", 2);
__decorateClass([
  Validate52(STRING21, { optional: true })
], RadarSeriesProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate52(COLOR_STRING18)
], RadarSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER22)
], RadarSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate52(RATIO23)
], RadarSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate52(LINE_DASH15)
], RadarSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate52(POSITIVE_NUMBER22)
], RadarSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate52(FUNCTION14, { optional: true })
], RadarSeriesProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate52(DEGREE4)
], RadarSeriesProperties.prototype, "rotation", 2);
__decorateClass([
  Validate52(OBJECT22)
], RadarSeriesProperties.prototype, "marker", 2);
__decorateClass([
  Validate52(OBJECT22)
], RadarSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate52(OBJECT22)
], RadarSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate52(BOOLEAN17)
], RadarSeriesProperties.prototype, "connectMissingData", 2);

// packages/ag-charts-enterprise/src/series/radar/radarSeries.ts
var {
  ChartAxisDirection: ChartAxisDirection16,
  PolarAxis: PolarAxis2,
  SeriesNodePickMode: SeriesNodePickMode11,
  valueProperty: valueProperty12,
  fixNumericExtent: fixNumericExtent5,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation3,
  markerFadeInAnimation,
  resetMarkerFn,
  animationValidation: animationValidation5,
  isFiniteNumber: isFiniteNumber6,
  computeMarkerFocusBounds: computeMarkerFocusBounds2
} = import_ag_charts_community130._ModuleSupport;
var { BBox: BBox8, Group: Group13, Path: Path7, PointerEvents: PointerEvents5, Selection: Selection9, Text: Text12, getMarker: getMarker2 } = import_ag_charts_community130._Scene;
var { extent: extent3, isNumberEqual: isNumberEqual8, sanitizeHtml: sanitizeHtml9, toFixed } = import_ag_charts_community130._Util;
var RadarSeriesNodeEvent = class extends import_ag_charts_community130._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadarSeries = class extends import_ag_charts_community130._ModuleSupport.PolarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      useLabelLayer: true,
      pickModes: [SeriesNodePickMode11.NEAREST_NODE, SeriesNodePickMode11.EXACT_SHAPE_MATCH],
      canHaveAxes: true,
      animationResetFns: {
        item: resetMarkerFn
      }
    });
    this.properties = new RadarSeriesProperties();
    this.NodeEvent = RadarSeriesNodeEvent;
    this.resetInvalidToZero = false;
    this.circleCache = { r: 0, cx: 0, cy: 0 };
    const lineGroup = new Group13();
    this.contentGroup.append(lineGroup);
    this.lineSelection = Selection9.select(lineGroup, Path7);
    lineGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
  }
  nodeFactory() {
    const { shape } = this.properties.marker;
    const MarkerShape = getMarker2(shape);
    return new MarkerShape();
  }
  addChartEventListeners() {
    this.destroyFns.push(
      this.ctx.chartEventManager?.addListener("legend-item-click", (event) => this.onLegendItemClick(event)),
      this.ctx.chartEventManager?.addListener(
        "legend-item-double-click",
        (event) => this.onLegendItemDoubleClick(event)
      )
    );
  }
  getSeriesDomain(direction) {
    const { dataModel, processedData } = this;
    if (!processedData || !dataModel)
      return [];
    if (direction === ChartAxisDirection16.X) {
      return dataModel.getDomain(this, `angleValue`, "value", processedData);
    } else {
      const domain = dataModel.getDomain(this, `radiusValue`, "value", processedData);
      const ext = extent3(domain.length === 0 ? domain : [0].concat(domain));
      return fixNumericExtent5(ext);
    }
  }
  async processData(dataController) {
    if (!this.properties.isValid()) {
      return;
    }
    const { angleKey, radiusKey } = this.properties;
    const extraProps = [];
    if (!this.ctx.animationManager.isSkipped()) {
      extraProps.push(animationValidation5());
    }
    const radiusScaleType = this.axes[ChartAxisDirection16.Y]?.scale.type;
    const angleScaleType = this.axes[ChartAxisDirection16.X]?.scale.type;
    await this.requestDataModel(dataController, this.data, {
      props: [
        valueProperty12(angleKey, angleScaleType, { id: "angleValue" }),
        valueProperty12(radiusKey, radiusScaleType, { id: "radiusValue", invalidValue: void 0 }),
        ...extraProps
      ]
    });
    this.animationState.transition("updateData");
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
    const radiusAxis = this.axes[ChartAxisDirection16.Y];
    return radiusAxis instanceof PolarAxis2 ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  async maybeRefreshNodeData() {
    const didCircleChange = this.didCircleChange();
    if (!didCircleChange && !this.nodeDataRefresh)
      return;
    const { nodeData = [] } = await this.createNodeData() ?? {};
    this.nodeData = nodeData;
    this.nodeDataRefresh = false;
  }
  async createNodeData() {
    const { processedData, dataModel } = this;
    if (!processedData || !dataModel || !this.properties.isValid()) {
      return;
    }
    const { angleKey, radiusKey, angleName, radiusName, marker, label } = this.properties;
    const angleScale = this.axes[ChartAxisDirection16.X]?.scale;
    const radiusScale = this.axes[ChartAxisDirection16.Y]?.scale;
    if (!angleScale || !radiusScale) {
      return;
    }
    const angleIdx = dataModel.resolveProcessedDataIndexById(this, `angleValue`);
    const radiusIdx = dataModel.resolveProcessedDataIndexById(this, `radiusValue`);
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
        radiusValue: radiusDatum,
        missing: !import_ag_charts_community130._Util.isNumber(angle) || !import_ag_charts_community130._Util.isNumber(radius)
      };
    });
    return { itemId: radiusKey, nodeData, labelData: nodeData };
  }
  async update({ seriesRect }) {
    const resize = this.checkResize(seriesRect);
    const animationEnabled = !this.ctx.animationManager.isSkipped();
    const { series } = this.ctx.highlightManager?.getActiveHighlight() ?? {};
    this.highlightGroup.visible = (animationEnabled || this.visible) && !!(series === this);
    await this.maybeRefreshNodeData();
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
  }
  updatePathSelections() {
    const pathData = this.visible ? [true] : [];
    this.lineSelection.update(pathData);
  }
  updateMarkerSelection() {
    if (this.properties.marker.isDirty()) {
      this.itemSelection.clear();
      this.itemSelection.cleanup();
      this.itemSelection = Selection9.select(this.itemGroup, () => this.nodeFactory(), false);
    }
    this.itemSelection.update(this.properties.marker.enabled ? this.nodeData : []);
  }
  getMarkerFill(highlightedStyle) {
    return highlightedStyle?.fill ?? this.properties.marker.fill;
  }
  updateMarkers(selection, highlight) {
    const { angleKey, radiusKey, marker, visible } = this.properties;
    let selectionData = [];
    if (visible && marker.shape && marker.enabled) {
      if (highlight) {
        const highlighted = this.ctx.highlightManager?.getActiveHighlight();
        if (highlighted?.datum) {
          selectionData = [highlighted];
        }
      } else {
        selectionData = this.nodeData;
      }
    }
    const highlightedStyle = highlight ? this.properties.highlightStyle.item : void 0;
    selection.update(selectionData).each((node, datum) => {
      const fill = this.getMarkerFill(highlightedStyle);
      const fillOpacity = highlightedStyle?.fillOpacity ?? this.properties.marker.fillOpacity;
      const stroke = highlightedStyle?.stroke ?? marker.stroke ?? this.properties.stroke;
      const strokeWidth = highlightedStyle?.strokeWidth ?? marker.strokeWidth ?? this.properties.strokeWidth ?? 1;
      const strokeOpacity = highlightedStyle?.strokeOpacity ?? this.properties.marker.strokeOpacity;
      const format = marker.itemStyler ? this.ctx.callbackCache.call(marker.itemStyler, {
        datum: datum.datum,
        angleKey,
        radiusKey,
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        shape: marker.shape,
        size: marker.size,
        highlighted: highlight,
        seriesId: this.id
      }) : void 0;
      node.fill = format?.fill ?? fill;
      node.stroke = format?.stroke ?? stroke;
      node.strokeWidth = format?.strokeWidth ?? strokeWidth;
      node.fillOpacity = highlightedStyle?.fillOpacity ?? marker.fillOpacity ?? 1;
      node.strokeOpacity = marker.strokeOpacity ?? this.properties.strokeOpacity ?? 1;
      node.size = format?.size ?? marker.size;
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
    if (!this.properties.isValid()) {
      return import_ag_charts_community130._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const { id: seriesId } = this;
    const { angleKey, radiusKey, angleName, radiusName, marker, tooltip } = this.properties;
    const { datum, angleValue, radiusValue, itemId } = nodeDatum;
    const formattedAngleValue = typeof angleValue === "number" ? toFixed(angleValue) : String(angleValue);
    const formattedRadiusValue = typeof radiusValue === "number" ? toFixed(radiusValue) : String(radiusValue);
    const title = sanitizeHtml9(radiusName);
    const content = sanitizeHtml9(`${formattedAngleValue}: ${formattedRadiusValue}`);
    const {
      itemStyler,
      fill,
      fillOpacity,
      stroke,
      strokeWidth = this.properties.strokeWidth,
      strokeOpacity,
      shape,
      size
    } = marker;
    const { fill: color } = (itemStyler && this.ctx.callbackCache.call(itemStyler, {
      datum,
      angleKey,
      radiusKey,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      shape,
      size,
      highlighted: false,
      seriesId
    })) ?? { fill };
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
    if (!this.data?.length || !this.properties.isValid() || legendType !== "category") {
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
          text: radiusName ?? radiusKey
        },
        symbols: [
          {
            marker: {
              shape: marker.shape,
              fill: this.getMarkerFill() ?? marker.stroke ?? stroke ?? "rgba(0, 0, 0, 0)",
              stroke: marker.stroke ?? stroke ?? "rgba(0, 0, 0, 0)",
              fillOpacity: marker.fillOpacity ?? 1,
              strokeOpacity: marker.strokeOpacity ?? strokeOpacity ?? 1,
              strokeWidth: marker.strokeWidth ?? 0,
              enabled: marker.enabled || strokeWidth <= 0
            },
            line: {
              stroke,
              strokeOpacity,
              strokeWidth,
              lineDash
            }
          }
        ]
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
    const { x, y } = point;
    const { rootGroup, nodeData, centerX: cx, centerY: cy } = this;
    const hitPoint = rootGroup.transformPoint(x, y);
    const radius = this.radius;
    const distanceFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
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
      const distance = Math.sqrt((hitPoint.x - datumX - cx) ** 2 + (hitPoint.y - datumY - cy) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestDatum = datum;
      }
    }
    if (closestDatum) {
      const distance = Math.max(minDistance - (closestDatum.point?.size ?? 0), 0);
      return { datum: closestDatum, distance };
    }
  }
  async computeLabelsBBox() {
    const { label } = this.properties;
    await this.maybeRefreshNodeData();
    const textBoxes = [];
    const tempText2 = new Text12();
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
    const radiusAxis = this.axes[ChartAxisDirection16.Y];
    const angleAxis = this.axes[ChartAxisDirection16.X];
    const reversedAngleAxis = angleAxis?.isReversed();
    const reversedRadiusAxis = radiusAxis?.isReversed();
    const data = reversedRadiusAxis && !reversedAngleAxis ? [...nodeData].reverse() : nodeData;
    const points = [];
    let prevPointInvalid = false;
    let firstValid;
    data.forEach((datum, index) => {
      let { x, y } = datum.point;
      const isPointInvalid = isNaN(x) || isNaN(y);
      if (!isPointInvalid) {
        firstValid ?? (firstValid = datum);
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
    const radiusAxis = this.axes[ChartAxisDirection16.Y];
    const reversedRadiusAxis = radiusAxis?.isReversed();
    const radiusZero = reversedRadiusAxis ? this.radius + axisInnerRadius - radiusAxis?.scale.convert(0) : axisInnerRadius;
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
var import_ag_charts_community131 = require("ag-charts-community");
var { RATIO: RATIO24, COLOR_STRING: COLOR_STRING19, Validate: Validate53 } = import_ag_charts_community131._ModuleSupport;
var RadarAreaSeriesProperties = class extends RadarSeriesProperties {
  constructor() {
    super(...arguments);
    this.fill = "black";
    this.fillOpacity = 1;
  }
};
__decorateClass([
  Validate53(COLOR_STRING19)
], RadarAreaSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate53(RATIO24)
], RadarAreaSeriesProperties.prototype, "fillOpacity", 2);

// packages/ag-charts-enterprise/src/series/radar-area/radarAreaSeries.ts
var { Group: Group14, Path: Path8, PointerEvents: PointerEvents6, Selection: Selection10 } = import_ag_charts_community132._Scene;
var { ChartAxisDirection: ChartAxisDirection17 } = import_ag_charts_community132._ModuleSupport;
var RadarAreaSeries = class extends RadarSeries {
  constructor(moduleCtx) {
    super(moduleCtx);
    this.properties = new RadarAreaSeriesProperties();
    this.resetInvalidToZero = true;
    const areaGroup = new Group14();
    areaGroup.zIndexSubOrder = [() => this._declarationOrder, 0];
    this.contentGroup.append(areaGroup);
    this.areaSelection = Selection10.select(areaGroup, Path8);
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
    return highlightedStyle?.fill ?? this.properties.marker.fill ?? this.properties.fill;
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
    const points = this.getLinePoints();
    const getPolarAxis = (direction) => {
      const axis = this.axes[direction];
      return axis instanceof import_ag_charts_community132._ModuleSupport.PolarAxis ? axis : void 0;
    };
    const radiusAxis = getPolarAxis(ChartAxisDirection17.Y);
    const angleAxis = getPolarAxis(ChartAxisDirection17.X);
    const reversedRadiusAxis = radiusAxis?.isReversed();
    if (!reversedRadiusAxis) {
      return points;
    }
    const { points: zeroLinePoints = [] } = angleAxis?.getAxisLinePoints?.() ?? {};
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
var { markerPaletteFactory } = import_ag_charts_community133._ModuleSupport;
var RadarAreaModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["polar"],
  identifier: "radar-area",
  instanceConstructor: RadarAreaSeries,
  tooltipDefaults: { range: "nearest" },
  defaultAxes: [
    {
      type: import_ag_charts_community133._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: import_ag_charts_community133._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER
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
var import_ag_charts_community134 = require("ag-charts-community");

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
  tooltipDefaults: { range: "nearest" },
  defaultAxes: [
    {
      type: import_ag_charts_community134._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: import_ag_charts_community134._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER
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
var import_ag_charts_community139 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeries.ts
var import_ag_charts_community137 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarSeriesProperties.ts
var import_ag_charts_community135 = require("ag-charts-community");
var { Label: Label9 } = import_ag_charts_community135._Scene;
var {
  SeriesProperties: SeriesProperties9,
  SeriesTooltip: SeriesTooltip13,
  Validate: Validate54,
  COLOR_STRING: COLOR_STRING20,
  DEGREE: DEGREE5,
  FUNCTION: FUNCTION15,
  LINE_DASH: LINE_DASH16,
  NUMBER: NUMBER13,
  OBJECT: OBJECT23,
  POSITIVE_NUMBER: POSITIVE_NUMBER23,
  RATIO: RATIO25,
  STRING: STRING22
} = import_ag_charts_community135._ModuleSupport;
var RadialBarSeriesProperties = class extends SeriesProperties9 {
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
    this.label = new Label9();
    this.tooltip = new SeriesTooltip13();
  }
};
__decorateClass([
  Validate54(STRING22)
], RadialBarSeriesProperties.prototype, "angleKey", 2);
__decorateClass([
  Validate54(STRING22)
], RadialBarSeriesProperties.prototype, "radiusKey", 2);
__decorateClass([
  Validate54(STRING22, { optional: true })
], RadialBarSeriesProperties.prototype, "angleName", 2);
__decorateClass([
  Validate54(STRING22, { optional: true })
], RadialBarSeriesProperties.prototype, "radiusName", 2);
__decorateClass([
  Validate54(COLOR_STRING20)
], RadialBarSeriesProperties.prototype, "fill", 2);
__decorateClass([
  Validate54(RATIO25)
], RadialBarSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate54(COLOR_STRING20)
], RadialBarSeriesProperties.prototype, "stroke", 2);
__decorateClass([
  Validate54(POSITIVE_NUMBER23)
], RadialBarSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate54(RATIO25)
], RadialBarSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate54(LINE_DASH16)
], RadialBarSeriesProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate54(POSITIVE_NUMBER23)
], RadialBarSeriesProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate54(POSITIVE_NUMBER23)
], RadialBarSeriesProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate54(FUNCTION15, { optional: true })
], RadialBarSeriesProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate54(DEGREE5)
], RadialBarSeriesProperties.prototype, "rotation", 2);
__decorateClass([
  Validate54(STRING22, { optional: true })
], RadialBarSeriesProperties.prototype, "stackGroup", 2);
__decorateClass([
  Validate54(NUMBER13, { optional: true })
], RadialBarSeriesProperties.prototype, "normalizedTo", 2);
__decorateClass([
  Validate54(OBJECT23)
], RadialBarSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate54(OBJECT23)
], RadialBarSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarUtil.ts
var import_ag_charts_community136 = require("ag-charts-community");
var { SectorBox: SectorBox3, motion: motion6 } = import_ag_charts_community136._Scene;
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
    clipSector ?? (clipSector = new SectorBox3(startAngle, endAngle, innerRadius, outerRadius));
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
  ChartAxisDirection: ChartAxisDirection18,
  PolarAxis: PolarAxis3,
  diff: diff5,
  isDefined: isDefined4,
  groupAccumulativeValueProperty: groupAccumulativeValueProperty3,
  keyProperty: keyProperty6,
  mergeDefaults: mergeDefaults8,
  normaliseGroupTo: normaliseGroupTo2,
  valueProperty: valueProperty13,
  fixNumericExtent: fixNumericExtent6,
  resetLabelFn: resetLabelFn2,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation4,
  seriesLabelFadeOutAnimation: seriesLabelFadeOutAnimation2,
  animationValidation: animationValidation6,
  isFiniteNumber: isFiniteNumber7
} = import_ag_charts_community137._ModuleSupport;
var { BandScale: BandScale4 } = import_ag_charts_community137._Scale;
var { Sector: Sector5, SectorBox: SectorBox4, motion: motion7 } = import_ag_charts_community137._Scene;
var { angleBetween: angleBetween4, isNumber: isNumber2, sanitizeHtml: sanitizeHtml10 } = import_ag_charts_community137._Util;
var RadialBarSeriesNodeEvent = class extends import_ag_charts_community137._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.angleKey = series.properties.angleKey;
    this.radiusKey = series.properties.radiusKey;
  }
};
var RadialBarSeries = class extends import_ag_charts_community137._ModuleSupport.PolarSeries {
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
    return new Sector5();
  }
  addChartEventListeners() {
    this.destroyFns.push(
      this.ctx.chartEventManager?.addListener("legend-item-click", (event) => this.onLegendItemClick(event)),
      this.ctx.chartEventManager?.addListener(
        "legend-item-double-click",
        (event) => this.onLegendItemDoubleClick(event)
      )
    );
  }
  getSeriesDomain(direction) {
    const { axes, dataModel, processedData } = this;
    if (!processedData || !dataModel)
      return [];
    if (direction === ChartAxisDirection18.X) {
      const angleAxis = axes[ChartAxisDirection18.X];
      const xExtent = dataModel.getDomain(this, "angleValue-end", "value", processedData);
      const fixedXExtent = [xExtent[0] > 0 ? 0 : xExtent[0], xExtent[1] < 0 ? 0 : xExtent[1]];
      return fixNumericExtent6(fixedXExtent, angleAxis);
    } else {
      return dataModel.getDomain(this, "radiusValue", "key", processedData);
    }
  }
  async processData(dataController) {
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
    const radiusScaleType = this.axes[ChartAxisDirection18.Y]?.scale.type;
    const angleScaleType = this.axes[ChartAxisDirection18.X]?.scale.type;
    await this.requestDataModel(dataController, this.data, {
      props: [
        keyProperty6(radiusKey, radiusScaleType, { id: "radiusValue" }),
        valueProperty13(angleKey, angleScaleType, {
          id: "angleValue-raw",
          invalidValue: null,
          ...visibleProps
        }),
        ...groupAccumulativeValueProperty3(
          angleKey,
          "normal",
          "current",
          {
            id: `angleValue-end`,
            rangeId: `angleValue-range`,
            invalidValue: null,
            groupId: stackGroupId,
            separateNegative: true,
            ...visibleProps
          },
          angleScaleType
        ),
        ...groupAccumulativeValueProperty3(
          angleKey,
          "trailing",
          "current",
          {
            id: `angleValue-start`,
            invalidValue: null,
            groupId: stackGroupTrailingId,
            separateNegative: true,
            ...visibleProps
          },
          angleScaleType
        ),
        ...extraProps
      ]
    });
    this.animationState.transition("updateData");
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
  async maybeRefreshNodeData() {
    const circleChanged = this.didCircleChange();
    if (!circleChanged && !this.nodeDataRefresh)
      return;
    const { nodeData = [] } = await this.createNodeData() ?? {};
    this.nodeData = nodeData;
    this.nodeDataRefresh = false;
  }
  getAxisInnerRadius() {
    const radiusAxis = this.axes[ChartAxisDirection18.Y];
    return radiusAxis instanceof PolarAxis3 ? this.radius * radiusAxis.innerRadiusRatio : 0;
  }
  async createNodeData() {
    const { processedData, dataModel } = this;
    if (!processedData || !dataModel || !this.properties.isValid()) {
      return;
    }
    const angleAxis = this.axes[ChartAxisDirection18.X];
    const radiusAxis = this.axes[ChartAxisDirection18.Y];
    const angleScale = angleAxis?.scale;
    const radiusScale = radiusAxis?.scale;
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
    groupScale.range = [0, Math.abs(radiusScale.bandwidth ?? 0)];
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
      const { datum, keys, values, aggValues } = group;
      const radiusDatum = keys[0];
      const angleDatum = values[angleRawIndex];
      const isPositive = angleDatum >= 0 && !Object.is(angleDatum, -0);
      const angleStartDatum = values[angleStartIndex];
      const angleEndDatum = values[angleEndIndex];
      const angleRange = aggValues?.[angleRangeIndex][isPositive ? 1 : 0] ?? 0;
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
      const midAngle = startAngle + angleBetween4(startAngle, endAngle) / 2;
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
  }
  async update({ seriesRect }) {
    const resize = this.checkResize(seriesRect);
    await this.maybeRefreshNodeData();
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
  }
  updateSectorSelection(selection, highlighted) {
    let selectionData = [];
    if (highlighted) {
      const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
      if (activeHighlight?.datum && activeHighlight.series === this) {
        selectionData = [activeHighlight];
      }
    } else {
      selectionData = this.nodeData;
    }
    const {
      fill,
      fillOpacity,
      stroke,
      strokeOpacity,
      strokeWidth,
      lineDash,
      lineDashOffset,
      cornerRadius,
      angleKey,
      radiusKey
    } = mergeDefaults8(highlighted ? this.properties.highlightStyle.item : null, this.properties);
    const idFn = (datum) => datum.radiusValue;
    selection.update(selectionData, void 0, idFn).each((node, datum) => {
      const format = this.properties.itemStyler ? this.ctx.callbackCache.call(this.properties.itemStyler, {
        seriesId: this.id,
        datum: datum.datum,
        highlighted,
        angleKey,
        radiusKey,
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset,
        cornerRadius
      }) : void 0;
      node.fill = format?.fill ?? fill;
      node.fillOpacity = format?.fillOpacity ?? fillOpacity;
      node.stroke = format?.stroke ?? stroke;
      node.strokeWidth = format?.strokeWidth ?? strokeWidth;
      node.strokeOpacity = format?.strokeOpacity ?? strokeOpacity;
      node.lineDash = format?.lineDash ?? lineDash;
      node.lineDashOffset = format?.lineDashOffset ?? lineDashOffset;
      node.lineJoin = "round";
      node.inset = stroke != null ? (format?.strokeWidth ?? strokeWidth) / 2 : 0;
      node.startInnerCornerRadius = datum.reversed ? format?.cornerRadius ?? cornerRadius : 0;
      node.startOuterCornerRadius = datum.reversed ? format?.cornerRadius ?? cornerRadius : 0;
      node.endInnerCornerRadius = datum.reversed ? 0 : format?.cornerRadius ?? cornerRadius;
      node.endOuterCornerRadius = datum.reversed ? 0 : format?.cornerRadius ?? cornerRadius;
      if (highlighted) {
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
    const angleScale = this.axes[ChartAxisDirection18.X]?.scale;
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
    const { id: seriesId, axes, dataModel } = this;
    const {
      angleKey,
      angleName,
      radiusKey,
      radiusName,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cornerRadius,
      itemStyler,
      tooltip
    } = this.properties;
    const { angleValue, radiusValue, datum, itemId } = nodeDatum;
    const xAxis = axes[ChartAxisDirection18.X];
    const yAxis = axes[ChartAxisDirection18.Y];
    if (!this.properties.isValid() || !(xAxis && yAxis && isNumber2(angleValue)) || !dataModel) {
      return import_ag_charts_community137._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const angleString = xAxis.formatDatum(angleValue);
    const radiusString = yAxis.formatDatum(radiusValue);
    const title = sanitizeHtml10(angleName);
    const content = sanitizeHtml10(`${radiusString}: ${angleString}`);
    const { fill: color } = (itemStyler && this.ctx.callbackCache.call(itemStyler, {
      highlighted: false,
      seriesId,
      datum,
      angleKey,
      radiusKey,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cornerRadius
    })) ?? { fill };
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
    if (!this.data?.length || !this.properties.isValid() || legendType !== "category") {
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
          text: angleName ?? angleKey
        },
        symbols: [
          {
            marker: {
              fill: fill ?? "rgba(0, 0, 0, 0)",
              stroke: stroke ?? "rgba(0, 0, 0, 0)",
              fillOpacity: fillOpacity ?? 1,
              strokeOpacity: strokeOpacity ?? 1,
              strokeWidth
            }
          }
        ]
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
    const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
    return `radialBar-stack-${groupIndex}-xValues`;
  }
};
RadialBarSeries.className = "RadialBarSeries";
RadialBarSeries.type = "radial-bar";

// packages/ag-charts-enterprise/src/series/radial-bar/radialBarThemes.ts
var import_ag_charts_community138 = require("ag-charts-community");
var RADIAL_BAR_SERIES_THEME = {
  series: {
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community138._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community138._Theme.DEFAULT_INVERTED_LABEL_COLOUR
    }
  },
  axes: {
    [import_ag_charts_community138._Theme.POLAR_AXIS_TYPE.RADIUS_CATEGORY]: {
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
  tooltipDefaults: { range: "exact" },
  defaultAxes: [
    {
      type: import_ag_charts_community139._Theme.POLAR_AXIS_TYPE.ANGLE_NUMBER
    },
    {
      type: import_ag_charts_community139._Theme.POLAR_AXIS_TYPE.RADIUS_CATEGORY
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
var import_ag_charts_community143 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeries.ts
var import_ag_charts_community141 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeriesProperties.ts
var import_ag_charts_community140 = require("ag-charts-community");
var { Validate: Validate55, RATIO: RATIO26 } = import_ag_charts_community140._ModuleSupport;
var RadialColumnSeriesProperties = class extends RadialColumnSeriesBaseProperties {
};
__decorateClass([
  Validate55(RATIO26, { optional: true })
], RadialColumnSeriesProperties.prototype, "columnWidthRatio", 2);
__decorateClass([
  Validate55(RATIO26, { optional: true })
], RadialColumnSeriesProperties.prototype, "maxColumnWidthRatio", 2);

// packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeries.ts
var { ChartAxisDirection: ChartAxisDirection19, PolarAxis: PolarAxis4 } = import_ag_charts_community141._ModuleSupport;
var { RadialColumnShape, getRadialColumnWidth } = import_ag_charts_community141._Scene;
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
    const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
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
    const radiusAxis = this.axes[ChartAxisDirection19.Y];
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
var import_ag_charts_community142 = require("ag-charts-community");
var RADIAL_COLUMN_SERIES_THEME = {
  series: {
    columnWidthRatio: 0.5,
    maxColumnWidthRatio: 0.5,
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community142._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community142._Theme.DEFAULT_LABEL_COLOUR
    }
  },
  axes: {
    [import_ag_charts_community142._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
      shape: import_ag_charts_community142._Theme.POLAR_AXIS_SHAPE.CIRCLE,
      groupPaddingInner: 0,
      paddingInner: 0,
      label: {
        padding: 10
      }
    },
    [import_ag_charts_community142._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
      shape: import_ag_charts_community142._Theme.POLAR_AXIS_SHAPE.CIRCLE,
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
  tooltipDefaults: { range: "exact" },
  defaultAxes: [
    {
      type: import_ag_charts_community143._Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY
    },
    {
      type: import_ag_charts_community143._Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER
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
var import_ag_charts_community147 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/range-area/rangeArea.ts
var import_ag_charts_community145 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaProperties.ts
var import_ag_charts_community144 = require("ag-charts-community");
var { DropShadow, Label: Label10 } = import_ag_charts_community144._Scene;
var {
  CartesianSeriesProperties: CartesianSeriesProperties2,
  InterpolationProperties,
  SeriesMarker: SeriesMarker2,
  SeriesTooltip: SeriesTooltip14,
  Validate: Validate56,
  BOOLEAN: BOOLEAN18,
  COLOR_STRING: COLOR_STRING21,
  LINE_DASH: LINE_DASH17,
  OBJECT: OBJECT24,
  PLACEMENT,
  POSITIVE_NUMBER: POSITIVE_NUMBER24,
  RATIO: RATIO27,
  STRING: STRING23
} = import_ag_charts_community144._ModuleSupport;
var RangeAreaSeriesLabel = class extends Label10 {
  constructor() {
    super(...arguments);
    this.placement = "outside";
    this.padding = 6;
  }
};
__decorateClass([
  Validate56(PLACEMENT)
], RangeAreaSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate56(POSITIVE_NUMBER24)
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
    this.interpolation = new InterpolationProperties();
    this.shadow = new DropShadow().set({ enabled: false });
    this.marker = new SeriesMarker2();
    this.label = new RangeAreaSeriesLabel();
    this.tooltip = new SeriesTooltip14();
    this.connectMissingData = false;
  }
};
__decorateClass([
  Validate56(STRING23)
], RangeAreaProperties.prototype, "xKey", 2);
__decorateClass([
  Validate56(STRING23)
], RangeAreaProperties.prototype, "yLowKey", 2);
__decorateClass([
  Validate56(STRING23)
], RangeAreaProperties.prototype, "yHighKey", 2);
__decorateClass([
  Validate56(STRING23, { optional: true })
], RangeAreaProperties.prototype, "xName", 2);
__decorateClass([
  Validate56(STRING23, { optional: true })
], RangeAreaProperties.prototype, "yName", 2);
__decorateClass([
  Validate56(STRING23, { optional: true })
], RangeAreaProperties.prototype, "yLowName", 2);
__decorateClass([
  Validate56(STRING23, { optional: true })
], RangeAreaProperties.prototype, "yHighName", 2);
__decorateClass([
  Validate56(COLOR_STRING21)
], RangeAreaProperties.prototype, "fill", 2);
__decorateClass([
  Validate56(RATIO27)
], RangeAreaProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate56(COLOR_STRING21)
], RangeAreaProperties.prototype, "stroke", 2);
__decorateClass([
  Validate56(POSITIVE_NUMBER24)
], RangeAreaProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate56(RATIO27)
], RangeAreaProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate56(LINE_DASH17)
], RangeAreaProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate56(POSITIVE_NUMBER24)
], RangeAreaProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate56(OBJECT24)
], RangeAreaProperties.prototype, "interpolation", 2);
__decorateClass([
  Validate56(OBJECT24)
], RangeAreaProperties.prototype, "shadow", 2);
__decorateClass([
  Validate56(OBJECT24)
], RangeAreaProperties.prototype, "marker", 2);
__decorateClass([
  Validate56(OBJECT24)
], RangeAreaProperties.prototype, "label", 2);
__decorateClass([
  Validate56(OBJECT24)
], RangeAreaProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate56(BOOLEAN18)
], RangeAreaProperties.prototype, "connectMissingData", 2);

// packages/ag-charts-enterprise/src/series/range-area/rangeArea.ts
var {
  valueProperty: valueProperty14,
  keyProperty: keyProperty7,
  ChartAxisDirection: ChartAxisDirection20,
  mergeDefaults: mergeDefaults9,
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
  computeMarkerFocusBounds: computeMarkerFocusBounds3,
  plotPath,
  pathRanges,
  pathRangePoints,
  pathRangePointsReverse
} = import_ag_charts_community145._ModuleSupport;
var { getMarker: getMarker3, PointerEvents: PointerEvents7 } = import_ag_charts_community145._Scene;
var { sanitizeHtml: sanitizeHtml11, extent: extent4 } = import_ag_charts_community145._Util;
var RangeAreaSeriesNodeEvent = class extends import_ag_charts_community145._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.yLowKey = series.properties.yLowKey;
    this.yHighKey = series.properties.yHighKey;
  }
};
var RangeAreaSeries = class extends import_ag_charts_community145._ModuleSupport.CartesianSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      hasMarkers: true,
      pathsPerSeries: 2,
      directionKeys: {
        [ChartAxisDirection20.X]: ["xKey"],
        [ChartAxisDirection20.Y]: ["yLowKey", "yHighKey"]
      },
      directionNames: {
        [ChartAxisDirection20.X]: ["xName"],
        [ChartAxisDirection20.Y]: ["yLowName", "yHighName", "yName"]
      },
      animationResetFns: {
        path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
        label: resetLabelFn3,
        marker: (node, datum) => ({ ...resetMarkerFn2(node), ...resetMarkerPositionFn(node, datum) })
      }
    });
    this.properties = new RangeAreaProperties();
    this.NodeEvent = RangeAreaSeriesNodeEvent;
  }
  async processData(dataController) {
    if (!this.properties.isValid() || !this.visible)
      return;
    const { xKey, yLowKey, yHighKey } = this.properties;
    const xScale = this.axes[ChartAxisDirection20.X]?.scale;
    const yScale = this.axes[ChartAxisDirection20.Y]?.scale;
    const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
    const extraProps = [];
    const animationEnabled = !this.ctx.animationManager.isSkipped();
    if (!this.ctx.animationManager.isSkipped() && this.processedData) {
      extraProps.push(diff6(this.processedData));
    }
    if (animationEnabled) {
      extraProps.push(animationValidation7());
    }
    await this.requestDataModel(dataController, this.data, {
      props: [
        keyProperty7(xKey, xScaleType, { id: `xValue` }),
        valueProperty14(yLowKey, yScaleType, { id: `yLowValue`, invalidValue: void 0 }),
        valueProperty14(yHighKey, yScaleType, { id: `yHighValue`, invalidValue: void 0 }),
        ...extraProps
      ]
    });
    this.animationState.transition("updateData");
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
    if (direction === ChartAxisDirection20.X) {
      const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
      const xAxis = axes[ChartAxisDirection20.X];
      if (keyDef?.def.type === "key" && keyDef.def.valueType === "category") {
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
  async createNodeData() {
    const { data, dataModel, axes, visible } = this;
    const xAxis = axes[ChartAxisDirection20.X];
    const yAxis = axes[ChartAxisDirection20.Y];
    if (!(data && visible && xAxis && yAxis && dataModel)) {
      return;
    }
    const xScale = xAxis.scale;
    const yScale = yAxis.scale;
    const { xKey, yLowKey, yHighKey, connectMissingData, marker } = this.properties;
    const itemId = `${yLowKey}-${yHighKey}`;
    const xOffset = (xScale.bandwidth ?? 0) / 2;
    const defs = dataModel.resolveProcessedDataDefsByIds(this, [`xValue`, `yHighValue`, `yLowValue`]);
    const createCoordinates = (xValue, yHigh, yLow, moveTo2) => {
      const x = xScale.convert(xValue) + xOffset;
      const yHighCoordinate = yScale.convert(yHigh);
      const yLowCoordinate = yScale.convert(yLow);
      const { size } = marker;
      return [
        {
          point: { x, y: yHighCoordinate, moveTo: moveTo2 },
          size,
          itemId: `high`,
          yValue: yHigh,
          xValue,
          enabled: true
        },
        {
          point: { x, y: yLowCoordinate, moveTo: moveTo2 },
          size,
          itemId: `low`,
          yValue: yLow,
          xValue,
          enabled: false
        }
      ];
    };
    const labelData = [];
    const markerData = [];
    const strokeData = { itemId, highPoints: [], lowPoints: [] };
    const fillData = { itemId, highPoints: [], lowPoints: [] };
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
    const fillHighPoints = fillData.highPoints;
    const fillLowPoints = fillData.lowPoints;
    const strokeHighPoints = strokeData.highPoints;
    const strokeLowPoints = strokeData.lowPoints;
    let moveTo = true;
    this.processedData?.data.forEach(({ keys, datum, values }, datumIdx) => {
      const dataValues = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
      const { xValue, yHighValue, yLowValue } = dataValues;
      const invalidRange = yHighValue == null || yLowValue == null;
      const points = invalidRange ? [] : createCoordinates(xValue, yHighValue, yLowValue, false);
      const inverted = yLowValue > yHighValue;
      points.forEach(({ point: { x, y }, enabled, size, itemId: datumItemId = "", yValue }) => {
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
          point: { x, y, size },
          enabled
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
      const xValid = xValue != null;
      const yValid = yHighValue != null && yLowValue != null;
      const [high, low] = createCoordinates(xValue, yHighValue ?? 0, yLowValue ?? 0, moveTo);
      if (xValid && yValid) {
        fillHighPoints.push(high);
        fillLowPoints.push(low);
        strokeHighPoints.push(high);
        strokeLowPoints.push(low);
        moveTo = false;
      } else if (!connectMissingData) {
        moveTo = true;
      }
    });
    return context;
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
  async updatePathNodes(opts) {
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
  }
  async updatePaths(opts) {
    this.updateAreaPaths(opts.paths, opts.contextData);
  }
  updateAreaPaths(paths, contextData) {
    this.updateFillPath(paths, contextData);
    this.updateStrokePath(paths, contextData);
  }
  updateFillPath(paths, contextData) {
    const { interpolation } = this.properties;
    const { fillData } = contextData;
    const [fill] = paths;
    fill.path.clear();
    for (const range2 of pathRanges(fillData.highPoints)) {
      plotPath(pathRangePoints(fillData.highPoints, range2), fill, interpolation);
      plotPath(pathRangePointsReverse(fillData.lowPoints, range2), fill, interpolation, true);
      fill.path.closePath();
    }
    fill.checkPathDirty();
  }
  updateStrokePath(paths, contextData) {
    const { interpolation } = this.properties;
    const { strokeData } = contextData;
    const [, stroke] = paths;
    stroke.path.clear(true);
    for (const range2 of pathRanges(strokeData.highPoints)) {
      plotPath(pathRangePoints(strokeData.highPoints, range2), stroke, interpolation);
      plotPath(pathRangePoints(strokeData.lowPoints, range2), stroke, interpolation);
    }
    stroke.checkPathDirty();
  }
  async updateMarkerSelection(opts) {
    const { nodeData, markerSelection } = opts;
    if (this.properties.marker.isDirty()) {
      markerSelection.clear();
      markerSelection.cleanup();
    }
    return markerSelection.update(this.properties.marker.enabled ? nodeData : []);
  }
  async updateMarkerNodes(opts) {
    const { markerSelection, isHighlight: highlighted } = opts;
    const { xKey, yLowKey, yHighKey, marker, fill, stroke, strokeWidth, fillOpacity, strokeOpacity } = this.properties;
    const baseStyle = mergeDefaults9(highlighted && this.properties.highlightStyle.item, marker.getStyle(), {
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
  }
  async updateLabelSelection(opts) {
    const { labelData, labelSelection } = opts;
    return labelSelection.update(labelData, (text) => {
      text.tag = AreaSeriesTag.Label;
      text.pointerEvents = PointerEvents7.None;
    });
  }
  async updateLabelNodes(opts) {
    opts.labelSelection.each((textNode, datum) => {
      updateLabelNode(textNode, this.properties.label, datum);
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
    const xAxis = this.axes[ChartAxisDirection20.X];
    const yAxis = this.axes[ChartAxisDirection20.Y];
    if (!this.properties.isValid() || !xAxis || !yAxis) {
      return import_ag_charts_community145._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const { id: seriesId } = this;
    const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, fill, tooltip } = this.properties;
    const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;
    const color = fill ?? "gray";
    const xString = sanitizeHtml11(xAxis.formatDatum(xValue));
    const yLowString = sanitizeHtml11(yAxis.formatDatum(yLowValue));
    const yHighString = sanitizeHtml11(yAxis.formatDatum(yHighValue));
    const xSubheading = xName ?? xKey;
    const yLowSubheading = yLowName ?? yLowKey;
    const yHighSubheading = yHighName ?? yHighKey;
    const title = sanitizeHtml11(yName);
    const content = yName ? `<b>${sanitizeHtml11(xSubheading)}</b>: ${xString}<br><b>${sanitizeHtml11(yLowSubheading)}</b>: ${yLowString}<br><b>${sanitizeHtml11(yHighSubheading)}</b>: ${yHighString}<br>` : `${xString}: ${yLowString} - ${yHighString}`;
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
    const legendItemText = yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;
    return [
      {
        legendType: "category",
        id: this.id,
        itemId: `${yLowKey}-${yHighKey}`,
        seriesId: this.id,
        enabled: visible,
        label: { text: `${legendItemText}` },
        symbols: [
          {
            marker: {
              shape: marker.shape,
              fill: marker.fill ?? fill,
              stroke: marker.stroke ?? stroke,
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
        ]
      }
    ];
  }
  isLabelEnabled() {
    return this.properties.label.enabled;
  }
  onDataChange() {
  }
  nodeFactory() {
    return new import_ag_charts_community145._Scene.Group();
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
    const hiBox = computeMarkerFocusBounds3(this, opts);
    const loBox = computeMarkerFocusBounds3(this, { ...opts, datumIndex: opts.datumIndex + 1 });
    if (hiBox && loBox) {
      return import_ag_charts_community145._Scene.BBox.merge([hiBox, loBox]);
    }
    return void 0;
  }
};
RangeAreaSeries.className = "RangeAreaSeries";
RangeAreaSeries.type = "range-area";

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaThemes.ts
var import_ag_charts_community146 = require("ag-charts-community");
var RANGE_AREA_SERIES_THEME = {
  series: {
    fillOpacity: 0.7,
    nodeClickRange: "nearest",
    marker: {
      enabled: false,
      size: 6,
      strokeWidth: 2
    },
    label: {
      enabled: false,
      placement: "outside",
      padding: 10,
      fontSize: 12,
      fontFamily: import_ag_charts_community146._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community146._Theme.DEFAULT_LABEL_COLOUR
    },
    interpolation: {
      type: "linear",
      // @ts-expect-error - users shouldn't specify all options, but we have to for theming to work
      tension: 1,
      position: "end"
    }
  },
  axes: {
    [import_ag_charts_community146._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: { enabled: true }
    }
  }
};

// packages/ag-charts-enterprise/src/series/range-area/rangeAreaModule.ts
var { markerPaletteFactory: markerPaletteFactory2 } = import_ag_charts_community147._ModuleSupport;
var RangeAreaModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["cartesian"],
  identifier: "range-area",
  instanceConstructor: RangeAreaSeries,
  tooltipDefaults: { range: "nearest" },
  defaultAxes: [
    {
      type: import_ag_charts_community147._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community147._Theme.POSITION.LEFT
    },
    {
      type: import_ag_charts_community147._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community147._Theme.POSITION.BOTTOM
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
var import_ag_charts_community151 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarSeries.ts
var import_ag_charts_community149 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarProperties.ts
var import_ag_charts_community148 = require("ag-charts-community");
var { DropShadow: DropShadow2, Label: Label11 } = import_ag_charts_community148._Scene;
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties4,
  SeriesTooltip: SeriesTooltip15,
  Validate: Validate57,
  COLOR_STRING: COLOR_STRING22,
  FUNCTION: FUNCTION16,
  LINE_DASH: LINE_DASH18,
  OBJECT: OBJECT25,
  PLACEMENT: PLACEMENT2,
  POSITIVE_NUMBER: POSITIVE_NUMBER25,
  RATIO: RATIO28,
  STRING: STRING24
} = import_ag_charts_community148._ModuleSupport;
var RangeBarSeriesLabel = class extends Label11 {
  constructor() {
    super(...arguments);
    this.placement = "inside";
    this.padding = 6;
  }
};
__decorateClass([
  Validate57(PLACEMENT2)
], RangeBarSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate57(POSITIVE_NUMBER25)
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
    this.tooltip = new SeriesTooltip15();
  }
};
__decorateClass([
  Validate57(STRING24)
], RangeBarProperties.prototype, "xKey", 2);
__decorateClass([
  Validate57(STRING24)
], RangeBarProperties.prototype, "yLowKey", 2);
__decorateClass([
  Validate57(STRING24)
], RangeBarProperties.prototype, "yHighKey", 2);
__decorateClass([
  Validate57(STRING24, { optional: true })
], RangeBarProperties.prototype, "xName", 2);
__decorateClass([
  Validate57(STRING24, { optional: true })
], RangeBarProperties.prototype, "yName", 2);
__decorateClass([
  Validate57(STRING24, { optional: true })
], RangeBarProperties.prototype, "yLowName", 2);
__decorateClass([
  Validate57(STRING24, { optional: true })
], RangeBarProperties.prototype, "yHighName", 2);
__decorateClass([
  Validate57(COLOR_STRING22)
], RangeBarProperties.prototype, "fill", 2);
__decorateClass([
  Validate57(RATIO28)
], RangeBarProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate57(COLOR_STRING22)
], RangeBarProperties.prototype, "stroke", 2);
__decorateClass([
  Validate57(POSITIVE_NUMBER25)
], RangeBarProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate57(RATIO28)
], RangeBarProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate57(LINE_DASH18)
], RangeBarProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate57(POSITIVE_NUMBER25)
], RangeBarProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate57(POSITIVE_NUMBER25)
], RangeBarProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate57(FUNCTION16, { optional: true })
], RangeBarProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate57(OBJECT25)
], RangeBarProperties.prototype, "shadow", 2);
__decorateClass([
  Validate57(OBJECT25)
], RangeBarProperties.prototype, "label", 2);
__decorateClass([
  Validate57(OBJECT25)
], RangeBarProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarSeries.ts
var {
  SeriesNodePickMode: SeriesNodePickMode12,
  valueProperty: valueProperty15,
  keyProperty: keyProperty8,
  ChartAxisDirection: ChartAxisDirection21,
  getRectConfig,
  updateRect,
  checkCrisp,
  updateLabelNode: updateLabelNode2,
  SMALLEST_KEY_INTERVAL: SMALLEST_KEY_INTERVAL3,
  LARGEST_KEY_INTERVAL,
  diff: diff7,
  prepareBarAnimationFunctions: prepareBarAnimationFunctions2,
  midpointStartingBarPosition,
  resetBarSelectionsFn: resetBarSelectionsFn2,
  fixNumericExtent: fixNumericExtent8,
  seriesLabelFadeInAnimation: seriesLabelFadeInAnimation6,
  resetLabelFn: resetLabelFn4,
  animationValidation: animationValidation8,
  createDatumId: createDatumId8,
  isFiniteNumber: isFiniteNumber9,
  computeBarFocusBounds: computeBarFocusBounds5
} = import_ag_charts_community149._ModuleSupport;
var { Rect: Rect4, PointerEvents: PointerEvents8, motion: motion8 } = import_ag_charts_community149._Scene;
var { sanitizeHtml: sanitizeHtml12, isNumber: isNumber3, extent: extent5 } = import_ag_charts_community149._Util;
var { ContinuousScale: ContinuousScale3 } = import_ag_charts_community149._Scale;
var RangeBarSeriesNodeEvent = class extends import_ag_charts_community149._ModuleSupport.SeriesNodeEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.yLowKey = series.properties.yLowKey;
    this.yHighKey = series.properties.yHighKey;
  }
};
var RangeBarSeries = class extends import_ag_charts_community149._ModuleSupport.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      pickModes: [SeriesNodePickMode12.NEAREST_NODE, SeriesNodePickMode12.EXACT_SHAPE_MATCH],
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
  async processData(dataController) {
    if (!this.properties.isValid()) {
      return;
    }
    const { xKey, yLowKey, yHighKey } = this.properties;
    const xScale = this.getCategoryAxis()?.scale;
    const yScale = this.getValueAxis()?.scale;
    const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
    const extraProps = [];
    if (!this.ctx.animationManager.isSkipped()) {
      if (this.processedData) {
        extraProps.push(diff7(this.processedData));
      }
      extraProps.push(animationValidation8());
    }
    const visibleProps = this.visible ? {} : { forceValue: 0 };
    const { processedData } = await this.requestDataModel(dataController, this.data, {
      props: [
        keyProperty8(xKey, xScaleType, { id: "xValue" }),
        valueProperty15(yLowKey, yScaleType, { id: `yLowValue`, ...visibleProps }),
        valueProperty15(yHighKey, yScaleType, { id: `yHighValue`, ...visibleProps }),
        ...isContinuousX ? [SMALLEST_KEY_INTERVAL3, LARGEST_KEY_INTERVAL] : [],
        ...extraProps
      ],
      groupByKeys: true
    });
    this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
    this.largestDataInterval = processedData.reduced?.largestKeyInterval;
    this.animationState.transition("updateData");
  }
  getSeriesDomain(direction) {
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
      if (keyDef?.def.type === "key" && keyDef?.def.valueType === "category") {
        return keys;
      }
      const scalePadding = isFiniteNumber9(smallestDataInterval) ? smallestDataInterval : 0;
      const keysExtent = extent5(keys) ?? [NaN, NaN];
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
  async createNodeData() {
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
    const barAlongX = this.getBarDirection() === ChartAxisDirection21.X;
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
    processedData?.data.forEach(({ keys, datum, values }, dataIndex) => {
      values.forEach((value, valueIndex) => {
        const xDatum = keys[xIndex];
        const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex)) + barOffset;
        const rawLowValue = value[yLowIndex];
        const rawHighValue = value[yHighIndex];
        if (!import_ag_charts_community149._Util.isNumber(rawHighValue) || !import_ag_charts_community149._Util.isNumber(rawLowValue)) {
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
        { itemId: "low", value: yLowValue, ...labelParams },
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
        { itemId: "high", value: yHighValue, ...labelParams },
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
  async updateDatumSelection(opts) {
    const { nodeData, datumSelection } = opts;
    const data = nodeData ?? [];
    return datumSelection.update(data, void 0, (datum) => this.getDatumId(datum));
  }
  async updateDatumNodes(opts) {
    const { datumSelection, isHighlight } = opts;
    const { id: seriesId, ctx } = this;
    const {
      yLowKey,
      yHighKey,
      highlightStyle: { item: itemHighlightStyle }
    } = this.properties;
    const xAxis = this.axes[ChartAxisDirection21.X];
    const crisp = checkCrisp(
      xAxis?.scale,
      xAxis?.visibleRange,
      this.smallestDataInterval,
      this.largestDataInterval
    );
    const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection21.X;
    datumSelection.each((rect, datum) => {
      const {
        fillOpacity,
        strokeOpacity,
        strokeWidth,
        lineDash,
        lineDashOffset,
        itemStyler,
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
        isHighlighted: isHighlight,
        style,
        highlightStyle: itemHighlightStyle,
        itemStyler,
        seriesId,
        ctx,
        yLowKey,
        yHighKey
      });
      config.crisp = crisp;
      config.visible = visible;
      updateRect({ rect, config });
    });
  }
  getHighlightLabelData(labelData, highlightedItem) {
    const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
    return labelItems.length > 0 ? labelItems : void 0;
  }
  async updateLabelSelection(opts) {
    const labelData = this.properties.label.enabled ? opts.labelData : [];
    return opts.labelSelection.update(labelData, (text) => {
      text.pointerEvents = PointerEvents8.None;
    });
  }
  async updateLabelNodes(opts) {
    opts.labelSelection.each((textNode, datum) => {
      updateLabelNode2(textNode, this.properties.label, datum);
    });
  }
  getTooltipHtml(nodeDatum) {
    const {
      id: seriesId,
      ctx: { callbackCache }
    } = this;
    const xAxis = this.getCategoryAxis();
    const yAxis = this.getValueAxis();
    if (!this.properties.isValid() || !xAxis || !yAxis) {
      return import_ag_charts_community149._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const {
      xKey,
      yLowKey,
      yHighKey,
      xName,
      yLowName,
      yHighName,
      yName,
      fill,
      strokeWidth,
      itemStyler,
      tooltip,
      fillOpacity,
      stroke,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      cornerRadius
    } = this.properties;
    const { datum, xValue, yLowValue, yHighValue } = nodeDatum;
    let format;
    if (itemStyler) {
      format = callbackCache.call(itemStyler, {
        highlighted: false,
        seriesId,
        datum,
        xKey,
        yLowKey,
        yHighKey,
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset,
        cornerRadius
      });
    }
    const color = format?.fill ?? fill ?? "gray";
    const xString = sanitizeHtml12(xAxis.formatDatum(xValue));
    const yLowString = sanitizeHtml12(yAxis.formatDatum(yLowValue));
    const yHighString = sanitizeHtml12(yAxis.formatDatum(yHighValue));
    const xSubheading = xName ?? xKey;
    const yLowSubheading = yLowName ?? yLowKey;
    const yHighSubheading = yHighName ?? yHighKey;
    const title = sanitizeHtml12(yName);
    const content = yName ? `<b>${sanitizeHtml12(xSubheading)}</b>: ${xString}<br><b>${sanitizeHtml12(yLowSubheading)}</b>: ${yLowString}<br><b>${sanitizeHtml12(yHighSubheading)}</b>: ${yHighString}<br>` : `${xString}: ${yLowString} - ${yHighString}`;
    const defaults = {
      title,
      content,
      backgroundColor: color
    };
    return tooltip.toTooltipHtml(defaults, {
      itemId: void 0,
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
      title
    });
  }
  getLegendData(legendType) {
    const { id, visible } = this;
    if (legendType !== "category") {
      return [];
    }
    const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, yName, yLowName, yHighName, yLowKey, yHighKey } = this.properties;
    const legendItemText = yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;
    return [
      {
        legendType: "category",
        id,
        itemId: `${yLowKey}-${yHighKey}`,
        seriesId: id,
        enabled: visible,
        label: { text: `${legendItemText}` },
        symbols: [{ marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } }]
      }
    ];
  }
  animateEmptyUpdateReady({ datumSelection, labelSelection }) {
    const fns = prepareBarAnimationFunctions2(midpointStartingBarPosition(this.isVertical(), "normal"));
    motion8.fromToMotion(this.id, "datums", this.ctx.animationManager, [datumSelection], fns);
    seriesLabelFadeInAnimation6(this, "labels", this.ctx.animationManager, labelSelection);
  }
  animateWaitingUpdateReady(data) {
    const { datumSelection: datumSelections, labelSelection: labelSelections } = data;
    const { processedData } = this;
    const dataDiff = processedData?.reduced?.diff;
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    const fns = prepareBarAnimationFunctions2(midpointStartingBarPosition(this.isVertical(), "fade"));
    motion8.fromToMotion(
      this.id,
      "datums",
      this.ctx.animationManager,
      [datumSelections],
      fns,
      (_, datum) => createDatumId8(datum.xValue, datum.valueIndex),
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
    return computeBarFocusBounds5(this.contextNodeData?.nodeData[datumIndex], this.contentGroup, seriesRect);
  }
};
RangeBarSeries.className = "RangeBarSeries";
RangeBarSeries.type = "range-bar";

// packages/ag-charts-enterprise/src/series/range-bar/rangeBarThemes.ts
var import_ag_charts_community150 = require("ag-charts-community");
var RANGE_BAR_SERIES_THEME = {
  series: {
    direction: "vertical",
    strokeWidth: 0,
    label: {
      enabled: false,
      fontSize: 12,
      fontFamily: import_ag_charts_community150._Theme.DEFAULT_FONT_FAMILY,
      color: import_ag_charts_community150._Theme.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
      placement: "inside"
    }
  },
  axes: {
    [import_ag_charts_community150._Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
      crosshair: { enabled: true }
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
  tooltipDefaults: { range: "exact" },
  defaultAxes: [
    {
      type: import_ag_charts_community151._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community151._Theme.POSITION.BOTTOM
    },
    {
      type: import_ag_charts_community151._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community151._Theme.POSITION.LEFT
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

// packages/ag-charts-enterprise/src/series/sankey/sankeyModule.ts
var import_ag_charts_community155 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/sankey/sankeySeries.ts
var import_ag_charts_community154 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/sankey/sankeyLayout.ts
function sortNodesByY(column) {
  column.nodes.sort((a, b) => Math.round((a.datum.y - b.datum.y) * 100) / 100 || -(a.datum.size - b.datum.size));
}
function justifyNodesAcrossColumn({ nodes, size }, { seriesRectHeight, nodeSpacing, sizeScale }) {
  const nodesHeight = seriesRectHeight * size * sizeScale;
  const outerPadding = (seriesRectHeight - (nodesHeight + nodeSpacing * (nodes.length - 1))) / 2;
  let y = outerPadding;
  nodes.forEach(({ datum: node }) => {
    const height = seriesRectHeight * node.size * sizeScale;
    node.y = y;
    node.height = height;
    y += height + nodeSpacing;
  });
}
function separateNodesInColumn(column, layout) {
  const { nodes } = column;
  const { seriesRectHeight, nodeSpacing } = layout;
  sortNodesByY(column);
  let totalShift = 0;
  let currentTop = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    const { datum: node } = nodes[i];
    const shift = Math.max(currentTop - node.y, 0);
    node.y += shift;
    totalShift += shift;
    currentTop = node.y + node.height + nodeSpacing;
  }
  const lastNodeBottom = currentTop - nodeSpacing;
  if (lastNodeBottom < seriesRectHeight) {
    return totalShift > 0;
  }
  let currentBottom = seriesRectHeight;
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const { datum: node } = nodes[i];
    const nodeBottom = node.y + node.height;
    const shift = Math.min(currentBottom - nodeBottom, 0);
    node.y += shift;
    totalShift += shift;
    currentBottom = node.y - nodeSpacing;
  }
  return true;
}
function hasCrossOver(x00, y00, x01, y01, x10, y10, x11, y11) {
  const recM0 = (x01 - x00) / (y01 - y00);
  const recM1 = (x11 - x10) / (y11 - y10);
  const x = ((y10 - y00) * (recM0 * recM1) + x00 * recM1 - x10 * recM0) / (recM1 - recM0);
  if (x00 < x01) {
    return x > x00 && x < Math.min(x01, x11);
  } else {
    return x < x00 && x > Math.max(x01, x11);
  }
}
function removeColumnCrossoversInDirection(column, getLinks) {
  let didShift = false;
  const singleCrossoverColumns = column.nodes.filter((node) => getLinks(node).length === 1);
  let didRemoveCrossover = true;
  for (let runs = 0; didRemoveCrossover && runs < singleCrossoverColumns.length; runs += 1) {
    didRemoveCrossover = false;
    for (let i = 0; i < singleCrossoverColumns.length - 1; i += 1) {
      const { datum: node } = singleCrossoverColumns[i];
      const nodeAfter = getLinks(singleCrossoverColumns[i])[0].node.datum;
      const { datum: otherNode } = singleCrossoverColumns[i + 1];
      const otherNodeAfter = getLinks(singleCrossoverColumns[i + 1])[0].node.datum;
      const crossover = hasCrossOver(
        node.x,
        node.y,
        nodeAfter.x,
        nodeAfter.y,
        otherNode.x,
        otherNode.y,
        otherNodeAfter.x,
        otherNodeAfter.y
      ) || hasCrossOver(
        node.x,
        node.y + node.height / 2,
        nodeAfter.x,
        nodeAfter.y + nodeAfter.height / 2,
        otherNode.x,
        otherNode.y + otherNode.height / 2,
        otherNodeAfter.x,
        otherNodeAfter.y + otherNodeAfter.height / 2
      ) || hasCrossOver(
        node.x,
        node.y + node.height,
        nodeAfter.x,
        nodeAfter.y + nodeAfter.height,
        otherNode.x,
        otherNode.y + otherNode.height,
        otherNodeAfter.x,
        otherNodeAfter.y + otherNodeAfter.height
      );
      if (!crossover)
        continue;
      const current = singleCrossoverColumns[i];
      singleCrossoverColumns[i] = singleCrossoverColumns[i + 1];
      singleCrossoverColumns[i + 1] = current;
      const y = node.y;
      node.y = otherNode.y + otherNode.height - node.height;
      otherNode.y = y;
      didShift = true;
      didRemoveCrossover = true;
    }
  }
  return didShift;
}
function removeColumnCrossovers(column) {
  let didShift = false;
  sortNodesByY(column);
  didShift = removeColumnCrossoversInDirection(column, (node) => node.linksBefore) || didShift;
  didShift = removeColumnCrossoversInDirection(column, (node) => node.linksAfter) || didShift;
  return didShift;
}
function weightedNodeY(links) {
  if (links.length === 0)
    return;
  let totalYValues = 0;
  let totalSize = 0;
  for (const {
    node: { datum: node }
  } of links) {
    totalYValues += node.y * node.size;
    totalSize += node.size;
  }
  return totalYValues / totalSize;
}
function layoutColumn(column, layout, weight, direction) {
  column.nodes.forEach(({ datum: node, linksBefore, linksAfter }) => {
    const forwardLinks = direction === 1 ? linksBefore : linksAfter;
    const backwardsLinks = direction === 1 ? linksAfter : linksBefore;
    const nextY = weightedNodeY(forwardLinks);
    if (nextY != null) {
      const nodeWeight = backwardsLinks.length !== 0 ? weight : 1;
      node.y = node.y + (nextY - node.y) * nodeWeight;
    }
  });
  return separateNodesInColumn(column, layout);
}
function layoutColumnsForward(columns, layout, weight) {
  let didShift = false;
  for (let i = 0; i < columns.length; i += 1) {
    didShift = layoutColumn(columns[i], layout, weight, 1) || didShift;
  }
  return didShift;
}
function layoutColumnsBackwards(columns, layout, weight) {
  let didShift = false;
  for (let i = columns.length - 1; i >= 0; i -= 1) {
    didShift = layoutColumn(columns[i], layout, weight, -1) || didShift;
  }
  return didShift;
}
function removeColumnsCrossovers(columns) {
  let didShift = false;
  for (let i = columns.length - 1; i >= 0; i -= 1) {
    didShift = removeColumnCrossovers(columns[i]) || didShift;
  }
  return didShift;
}
function layoutColumns(columns, layout) {
  columns.forEach((column) => {
    justifyNodesAcrossColumn(column, layout);
  });
  let didLayoutColumnsBackwards = false;
  for (let i = 0; i < 6; i += 1) {
    const didLayoutColumnsForward = layoutColumnsForward(columns, layout, 1);
    didLayoutColumnsBackwards = layoutColumnsBackwards(columns, layout, 0.5);
    const didRemoveColumnCrossovers = removeColumnsCrossovers(columns);
    if (!didLayoutColumnsForward && !didLayoutColumnsBackwards && !didRemoveColumnCrossovers) {
      break;
    }
  }
  if (didLayoutColumnsBackwards) {
    layoutColumnsForward(columns, layout, 1);
    removeColumnsCrossovers(columns);
  }
}

// packages/ag-charts-enterprise/src/series/sankey/sankeyLink.ts
var import_ag_charts_community152 = require("ag-charts-community");
var { BBox: BBox9, Path: Path9, ScenePathChangeDetection: ScenePathChangeDetection3 } = import_ag_charts_community152._Scene;
function offsetTrivialCubicBezier(path, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, offset) {
  let tx, ty;
  if (p1y !== p0y && p3y !== p2y) {
    const slope1 = -(p1x - p0x) / (p1y - p0y);
    const slope2 = -(p3x - p2x) / (p3y - p2y);
    tx = (p2y - p0y + slope1 * p0x - slope2 * p2x) / (slope1 - slope2);
    ty = slope1 * (tx - p0x) + p0y;
  } else if (p1y === p0y && p3y !== p2y) {
    tx = p0x;
    const slope2 = -(p3x - p2x) / (p3y - p2y);
    ty = slope2 * (tx - p3x) + p3y;
  } else if (p1y !== p0y && p3y === p2y) {
    tx = p3x;
    const slope1 = -(p1x - p0x) / (p1y - p0y);
    ty = slope1 * (tx - p0x) + p0y;
  } else {
    throw new Error("Offsetting flat bezier curve");
  }
  const d0 = Math.hypot(p0y - ty, p0x - tx);
  const s0 = (d0 + offset) / d0;
  const d1 = Math.hypot(p3y - ty, p3x - tx);
  const s1 = (d1 + offset) / d1;
  const q1x = tx + (p1x - tx) * s0;
  const q1y = ty + (p1y - ty) * s0;
  const q2x = tx + (p2x - tx) * s1;
  const q2y = ty + (p2y - ty) * s1;
  const q3x = tx + (p3x - tx) * s1;
  const q3y = ty + (p3y - ty) * s1;
  path.cubicCurveTo(q1x, q1y, q2x, q2y, q3x, q3y);
}
var SankeyLink = class extends Path9 {
  constructor() {
    super(...arguments);
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
    this.height = 0;
    this.inset = 0;
  }
  computeBBox() {
    const x = Math.min(this.x1, this.x2);
    const width = Math.max(this.x1, this.x2) - x;
    const y = Math.min(this.y1, this.y2);
    const height = Math.max(this.y1, this.y2) - y + this.height;
    return new BBox9(x, y, width, height);
  }
  updatePath() {
    const { path, inset } = this;
    path.clear();
    const x1 = this.x1 + inset;
    const x2 = this.x2 - inset;
    const y1 = this.y1 + inset;
    const y2 = this.y2 + inset;
    const height = this.height - 2 * inset;
    if (height < 0 || x1 > x2)
      return;
    const p0x = x1;
    const p0y = y1 + height / 2;
    const p1x = (x1 + x2) / 2;
    const p1y = y1 + height / 2;
    const p2x = (x1 + x2) / 2;
    const p2y = y2 + height / 2;
    const p3x = x2;
    const p3y = y2 + height / 2;
    path.moveTo(p0x, p0y - height / 2);
    if (Math.abs(this.y2 - this.y1) < 1 || this.x2 - this.x1 < this.height * Math.SQRT2) {
      path.cubicCurveTo(p1x, p1y - height / 2, p2x, p2y - height / 2, p3x, p3y - height / 2);
      path.lineTo(p3x, p3y + height / 2);
      path.cubicCurveTo(p2x, p2y + height / 2, p1x, p1y + height / 2, p0x, p0y + height / 2);
    } else {
      const x01 = 0.5 * p0x + 0.5 * p1x;
      const y01 = 0.5 * p0y + 0.5 * p1y;
      const x12 = 0.5 * p1x + 0.5 * p2x;
      const y12 = 0.5 * p1y + 0.5 * p2y;
      const x23 = 0.5 * p2x + 0.5 * p3x;
      const y23 = 0.5 * p2y + 0.5 * p3y;
      const x012 = 0.5 * x01 + 0.5 * x12;
      const y012 = 0.5 * y01 + 0.5 * y12;
      const x123 = 0.5 * x12 + 0.5 * x23;
      const y123 = 0.5 * y12 + 0.5 * y23;
      const x0123 = 0.5 * x012 + 0.5 * x123;
      const y0123 = 0.5 * y012 + 0.5 * y123;
      const ap0x = p0x;
      const ap0y = p0y;
      const ap1x = x01;
      const ap1y = y01;
      const ap2x = x012;
      const ap2y = y012;
      const ap3x = x0123;
      const ap3y = y0123;
      const bp0x = x0123;
      const bp0y = y0123;
      const bp1x = x123;
      const bp1y = y123;
      const bp2x = x23;
      const bp2y = y23;
      const bp3x = p3x;
      const bp3y = p3y;
      const offset = (y2 > y1 ? 1 : -1) * height / 2;
      offsetTrivialCubicBezier(path, ap0x, ap0y, ap1x, ap1y, ap2x, ap2y, ap3x, ap3y, offset);
      offsetTrivialCubicBezier(path, bp0x, bp0y, bp1x, bp1y, bp2x, bp2y, bp3x, bp3y, -offset);
      path.lineTo(p3x, p3y + height / 2);
      offsetTrivialCubicBezier(path, bp3x, bp3y, bp2x, bp2y, bp1x, bp1y, bp0x, bp0y, offset);
      offsetTrivialCubicBezier(path, ap3x, ap3y, ap2x, ap2y, ap1x, ap1y, ap0x, ap0y, -offset);
    }
    path.closePath();
  }
};
__decorateClass([
  ScenePathChangeDetection3()
], SankeyLink.prototype, "x1", 2);
__decorateClass([
  ScenePathChangeDetection3()
], SankeyLink.prototype, "x2", 2);
__decorateClass([
  ScenePathChangeDetection3()
], SankeyLink.prototype, "y1", 2);
__decorateClass([
  ScenePathChangeDetection3()
], SankeyLink.prototype, "y2", 2);
__decorateClass([
  ScenePathChangeDetection3()
], SankeyLink.prototype, "height", 2);
__decorateClass([
  ScenePathChangeDetection3()
], SankeyLink.prototype, "inset", 2);

// packages/ag-charts-enterprise/src/series/sankey/sankeySeriesProperties.ts
var import_ag_charts_community153 = require("ag-charts-community");
var {
  BaseProperties: BaseProperties15,
  SeriesTooltip: SeriesTooltip16,
  SeriesProperties: SeriesProperties10,
  ARRAY: ARRAY10,
  COLOR_STRING: COLOR_STRING23,
  COLOR_STRING_ARRAY: COLOR_STRING_ARRAY6,
  FUNCTION: FUNCTION17,
  LINE_DASH: LINE_DASH19,
  OBJECT: OBJECT26,
  POSITIVE_NUMBER: POSITIVE_NUMBER26,
  RATIO: RATIO29,
  STRING: STRING25,
  UNION: UNION7,
  Validate: Validate58
} = import_ag_charts_community153._ModuleSupport;
var { Label: Label12 } = import_ag_charts_community153._Scene;
var ALIGNMENT = UNION7(["left", "right", "center", "justify"], "a justification value");
var SankeySeriesLabelProperties = class extends Label12 {
  constructor() {
    super(...arguments);
    this.spacing = 1;
  }
};
__decorateClass([
  Validate58(POSITIVE_NUMBER26)
], SankeySeriesLabelProperties.prototype, "spacing", 2);
var SankeySeriesLinkProperties = class extends BaseProperties15 {
  constructor() {
    super(...arguments);
    this.fill = void 0;
    this.fillOpacity = 1;
    this.stroke = void 0;
    this.strokeOpacity = 1;
    this.strokeWidth = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
  }
};
__decorateClass([
  Validate58(COLOR_STRING23, { optional: true })
], SankeySeriesLinkProperties.prototype, "fill", 2);
__decorateClass([
  Validate58(RATIO29)
], SankeySeriesLinkProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate58(COLOR_STRING23, { optional: true })
], SankeySeriesLinkProperties.prototype, "stroke", 2);
__decorateClass([
  Validate58(RATIO29)
], SankeySeriesLinkProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate58(POSITIVE_NUMBER26)
], SankeySeriesLinkProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate58(LINE_DASH19)
], SankeySeriesLinkProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate58(POSITIVE_NUMBER26)
], SankeySeriesLinkProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate58(FUNCTION17, { optional: true })
], SankeySeriesLinkProperties.prototype, "itemStyler", 2);
var SankeySeriesNodeProperties = class extends BaseProperties15 {
  constructor() {
    super(...arguments);
    this.spacing = 1;
    this.width = 1;
    this.alignment = "justify";
    this.fill = void 0;
    this.fillOpacity = 1;
    this.stroke = void 0;
    this.strokeOpacity = 1;
    this.strokeWidth = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
  }
};
__decorateClass([
  Validate58(POSITIVE_NUMBER26)
], SankeySeriesNodeProperties.prototype, "spacing", 2);
__decorateClass([
  Validate58(POSITIVE_NUMBER26)
], SankeySeriesNodeProperties.prototype, "width", 2);
__decorateClass([
  Validate58(ALIGNMENT)
], SankeySeriesNodeProperties.prototype, "alignment", 2);
__decorateClass([
  Validate58(COLOR_STRING23, { optional: true })
], SankeySeriesNodeProperties.prototype, "fill", 2);
__decorateClass([
  Validate58(RATIO29)
], SankeySeriesNodeProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate58(COLOR_STRING23, { optional: true })
], SankeySeriesNodeProperties.prototype, "stroke", 2);
__decorateClass([
  Validate58(RATIO29)
], SankeySeriesNodeProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate58(POSITIVE_NUMBER26)
], SankeySeriesNodeProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate58(LINE_DASH19)
], SankeySeriesNodeProperties.prototype, "lineDash", 2);
__decorateClass([
  Validate58(POSITIVE_NUMBER26)
], SankeySeriesNodeProperties.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate58(FUNCTION17, { optional: true })
], SankeySeriesNodeProperties.prototype, "itemStyler", 2);
var SankeySeriesProperties = class extends SeriesProperties10 {
  constructor() {
    super(...arguments);
    this.nodes = void 0;
    this.idKey = "";
    this.idName = void 0;
    this.labelKey = void 0;
    this.labelName = void 0;
    this.sizeKey = void 0;
    this.sizeName = void 0;
    this.fills = [];
    this.strokes = [];
    this.label = new SankeySeriesLabelProperties();
    this.link = new SankeySeriesLinkProperties();
    this.node = new SankeySeriesNodeProperties();
    this.tooltip = new SeriesTooltip16();
  }
};
__decorateClass([
  Validate58(ARRAY10, { optional: true })
], SankeySeriesProperties.prototype, "nodes", 2);
__decorateClass([
  Validate58(STRING25)
], SankeySeriesProperties.prototype, "fromKey", 2);
__decorateClass([
  Validate58(STRING25)
], SankeySeriesProperties.prototype, "toKey", 2);
__decorateClass([
  Validate58(STRING25)
], SankeySeriesProperties.prototype, "idKey", 2);
__decorateClass([
  Validate58(STRING25, { optional: true })
], SankeySeriesProperties.prototype, "idName", 2);
__decorateClass([
  Validate58(STRING25, { optional: true })
], SankeySeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate58(STRING25, { optional: true })
], SankeySeriesProperties.prototype, "labelName", 2);
__decorateClass([
  Validate58(STRING25, { optional: true })
], SankeySeriesProperties.prototype, "sizeKey", 2);
__decorateClass([
  Validate58(STRING25, { optional: true })
], SankeySeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate58(COLOR_STRING_ARRAY6)
], SankeySeriesProperties.prototype, "fills", 2);
__decorateClass([
  Validate58(COLOR_STRING_ARRAY6)
], SankeySeriesProperties.prototype, "strokes", 2);
__decorateClass([
  Validate58(OBJECT26)
], SankeySeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate58(OBJECT26)
], SankeySeriesProperties.prototype, "link", 2);
__decorateClass([
  Validate58(OBJECT26)
], SankeySeriesProperties.prototype, "node", 2);
__decorateClass([
  Validate58(OBJECT26)
], SankeySeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/sankey/sankeySeries.ts
var { SeriesNodePickMode: SeriesNodePickMode13, createDatumId: createDatumId9, EMPTY_TOOLTIP_CONTENT: EMPTY_TOOLTIP_CONTENT2 } = import_ag_charts_community154._ModuleSupport;
var { sanitizeHtml: sanitizeHtml13 } = import_ag_charts_community154._Util;
var { Rect: Rect5, Text: Text13, BBox: BBox10 } = import_ag_charts_community154._Scene;
var SankeySeries = class extends FlowProportionSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      contentGroupVirtual: false,
      pickModes: [SeriesNodePickMode13.NEAREST_NODE, SeriesNodePickMode13.EXACT_SHAPE_MATCH]
    });
    this.properties = new SankeySeriesProperties();
  }
  isLabelEnabled() {
    return (this.properties.labelKey != null || this.nodes == null) && this.properties.label.enabled;
  }
  linkFactory() {
    return new SankeyLink();
  }
  nodeFactory() {
    return new Rect5();
  }
  async createNodeData() {
    const {
      id: seriesId,
      _nodeDataDependencies: { seriesRectWidth, seriesRectHeight } = { seriesRectWidth: 0, seriesRectHeight: 0 }
    } = this;
    const {
      fromKey,
      toKey,
      sizeKey,
      label: { spacing: labelSpacing },
      node: { spacing: nodeSpacing, width: nodeWidth, alignment }
    } = this.properties;
    const defaultLabelFormatter = (v) => String(v);
    const {
      nodeGraph: baseNodeGraph,
      links,
      maxPathLength
    } = this.getNodeGraph(
      (node) => {
        const label = this.getLabelText(
          this.properties.label,
          {
            datum: node.datum,
            value: node.label,
            fromKey,
            toKey,
            sizeKey
          },
          defaultLabelFormatter
        );
        return {
          ...node,
          label,
          size: 0,
          x: NaN,
          y: NaN,
          width: nodeWidth,
          height: NaN
        };
      },
      (link) => ({
        ...link,
        x1: NaN,
        x2: NaN,
        y1: NaN,
        y2: NaN,
        height: NaN
      }),
      { includeCircularReferences: false }
    );
    const nodeGraph = baseNodeGraph;
    const inset = this.isLabelEnabled() ? (seriesRectWidth - nodeWidth) * (1 - maxPathLength / (maxPathLength + 1)) : 0;
    const columnWidth = (seriesRectWidth - nodeWidth - 2 * inset) / (maxPathLength - 1);
    const columns = [];
    for (let index = 0; index < maxPathLength; index += 1) {
      const x = inset + index * columnWidth;
      columns.push({ index, size: 0, nodes: [], x });
    }
    nodeGraph.forEach((graphNode) => {
      const { datum: node, linksBefore, linksAfter, maxPathLengthBefore, maxPathLengthAfter } = graphNode;
      const size = Math.max(
        linksBefore.reduce((acc, { link }) => acc + link.size, 0),
        linksAfter.reduce((acc, { link }) => acc + link.size, 0)
      );
      if (linksBefore.length === 0 && linksAfter.length === 0 || size === 0) {
        graphNode.columnIndex = -1;
        return;
      }
      let column;
      switch (alignment) {
        case "left":
          column = columns[maxPathLengthBefore];
          break;
        case "right":
          column = columns[maxPathLength - 1 - maxPathLengthAfter];
          break;
        case "center": {
          if (linksBefore.length !== 0) {
            column = columns[maxPathLengthBefore];
          } else if (linksAfter.length !== 0) {
            const columnIndex = linksAfter.reduce(
              (acc, link) => Math.min(acc, link.node.maxPathLengthBefore),
              maxPathLength
            ) - 1;
            column = columns[columnIndex];
          } else {
            column = columns[0];
          }
          break;
        }
        case "justify": {
          column = linksAfter.length === 0 ? columns[maxPathLength - 1] : columns[maxPathLengthBefore];
          break;
        }
      }
      node.x = column.x;
      node.size = size;
      column.nodes.push(graphNode);
      column.size += size;
      graphNode.columnIndex = column.index;
    });
    nodeGraph.forEach((graphNode) => {
      let closestColumnIndex = Infinity;
      let maxSizeOfClosestNodesAfter = 0;
      graphNode.linksAfter.forEach((link) => {
        const node = link.node;
        const { columnIndex } = node;
        if (columnIndex < closestColumnIndex) {
          closestColumnIndex = columnIndex;
          maxSizeOfClosestNodesAfter = node.datum.size;
        } else if (columnIndex === closestColumnIndex) {
          maxSizeOfClosestNodesAfter = Math.max(maxSizeOfClosestNodesAfter, node.datum.size);
        }
      });
      graphNode.closestColumnIndex = closestColumnIndex;
      graphNode.maxSizeOfClosestNodesAfter = maxSizeOfClosestNodesAfter;
    });
    const sizeScale = columns.reduce((acc, { size, nodes }) => {
      const columnSizeScale = (1 - (nodes.length - 1) * (nodeSpacing / seriesRectHeight)) / size;
      return Math.min(acc, columnSizeScale);
    }, Infinity);
    for (let i = columns.length - 1; i >= 0; i -= 1) {
      const nodes = columns[i].nodes;
      nodes.sort(
        (a, b) => a.closestColumnIndex - b.closestColumnIndex || a.maxSizeOfClosestNodesAfter - b.maxSizeOfClosestNodesAfter || a.datum.size - b.datum.size
      );
    }
    layoutColumns(columns, {
      seriesRectHeight,
      nodeSpacing,
      sizeScale
    });
    nodeGraph.forEach(({ datum: node, linksBefore, linksAfter }) => {
      const bottom = node.y + node.height;
      const sortNodes = (l) => {
        return l.sort((a, b) => {
          const aNode = a.node.datum;
          const bNode = b.node.datum;
          const aBottom = aNode.y + aNode.height;
          const bBottom = bNode.y + bNode.height;
          const dAngleTop = Math.atan2(aNode.y - node.y, Math.abs(aNode.x - node.x)) - Math.atan2(bNode.y - node.y, Math.abs(bNode.x - node.x));
          const dAngleBottom = Math.atan2(aBottom - bottom, Math.abs(aNode.x - node.x)) - Math.atan2(bBottom - bottom, Math.abs(bNode.x - node.x));
          return dAngleTop + dAngleBottom;
        });
      };
      let y2 = node.y;
      sortNodes(linksBefore).forEach(({ link }) => {
        link.y2 = y2;
        y2 += link.size * seriesRectHeight * sizeScale;
      });
      let y1 = node.y;
      sortNodes(linksAfter).forEach(({ link }) => {
        link.y1 = y1;
        y1 += link.size * seriesRectHeight * sizeScale;
      });
    });
    const nodeData = [];
    const labelData = [];
    const { fontSize } = this.properties.label;
    const canvasFont = this.properties.label.getFont();
    columns.forEach((column, index) => {
      const leading = index === 0;
      const trailing = index === columns.length - 1;
      let bottom = -Infinity;
      column.nodes.sort((a, b) => a.datum.y - b.datum.y);
      column.nodes.forEach(({ datum: node }) => {
        node.midPoint = {
          x: node.x + node.width / 2,
          y: node.y + node.height / 2
        };
        nodeData.push(node);
        if (node.label == null)
          return;
        const x = leading ? node.x - labelSpacing : node.x + node.width + labelSpacing;
        const y = node.y + node.height / 2;
        let text;
        if (!leading && !trailing) {
          const y12 = y - fontSize * Text13.defaultLineHeightRatio;
          const y2 = y + fontSize * Text13.defaultLineHeightRatio;
          let maxX = seriesRectWidth;
          nodeGraph.forEach(({ datum }) => {
            const intersectsLabel = datum.x > node.x && Math.max(datum.y, y12) <= Math.min(datum.y + datum.height, y2);
            if (intersectsLabel) {
              maxX = Math.min(maxX, datum.x - labelSpacing);
            }
          });
          const maxWidth = maxX - node.x - 2 * labelSpacing;
          text = Text13.wrap(node.label, maxWidth, node.height, this.properties.label, "never", "hide");
        }
        if (text == null || text === "") {
          const labelInset = leading || trailing ? labelSpacing : labelSpacing * 2;
          text = Text13.wrap(node.label, columnWidth - labelInset, node.height, this.properties.label, "never");
        }
        if (text === "")
          return;
        const { height } = Text13.measureText(text, canvasFont, "middle", "left");
        const y0 = y - height / 2;
        const y1 = y + height / 2;
        if (y0 >= bottom) {
          labelData.push({ x, y, leading, text });
          bottom = y1;
        }
      });
    });
    links.forEach((link) => {
      const { fromNode, toNode, size } = link;
      link.height = seriesRectHeight * size * sizeScale;
      link.x1 = fromNode.x + nodeWidth;
      link.x2 = toNode.x;
      link.midPoint = {
        x: (link.x1 + link.x2) / 2,
        y: (link.y1 + link.y2) / 2 + link.height / 2
      };
      nodeData.push(link);
    });
    return {
      itemId: seriesId,
      nodeData,
      labelData
    };
  }
  async updateLabelSelection(opts) {
    const labels = this.isLabelEnabled() ? opts.labelData : [];
    return opts.labelSelection.update(labels);
  }
  async updateLabelNodes(opts) {
    const { labelSelection } = opts;
    const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;
    labelSelection.each((label, { x, y, leading, text }) => {
      label.visible = true;
      label.x = x;
      label.y = y;
      label.text = text;
      label.fill = fill;
      label.fontStyle = fontStyle;
      label.fontWeight = fontWeight;
      label.fontSize = fontSize;
      label.fontFamily = fontFamily;
      label.textAlign = leading ? "right" : "left";
      label.textBaseline = "middle";
    });
  }
  async updateNodeSelection(opts) {
    return opts.datumSelection.update(opts.nodeData, void 0, (datum) => createDatumId9([datum.type, datum.id]));
  }
  async updateNodeNodes(opts) {
    const { datumSelection, isHighlight } = opts;
    const {
      id: seriesId,
      properties,
      ctx: { callbackCache }
    } = this;
    const { fromKey, toKey, sizeKey } = this.properties;
    const {
      fill: baseFill,
      fillOpacity,
      stroke: baseStroke,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      itemStyler
    } = this.properties.node;
    const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
    const strokeWidth = this.getStrokeWidth(properties.node.strokeWidth);
    datumSelection.each((rect, datum) => {
      const fill = baseFill ?? datum.fill;
      const stroke = baseStroke ?? datum.stroke;
      let format;
      if (itemStyler != null) {
        const { label, size } = datum;
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
          label,
          size,
          fromKey,
          toKey,
          sizeKey,
          fill,
          fillOpacity,
          strokeOpacity,
          stroke,
          strokeWidth,
          lineDash,
          lineDashOffset,
          highlighted: isHighlight
        });
      }
      rect.x = datum.x;
      rect.y = datum.y;
      rect.width = datum.width;
      rect.height = datum.height;
      rect.fill = highlightStyle?.fill ?? format?.fill ?? fill;
      rect.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
      rect.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
      rect.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
      rect.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
      rect.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
      rect.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
    });
  }
  async updateLinkSelection(opts) {
    return opts.datumSelection.update(
      opts.nodeData,
      void 0,
      (datum) => createDatumId9([datum.type, datum.index, datum.fromNode.id, datum.toNode.id])
    );
  }
  async updateLinkNodes(opts) {
    const { datumSelection, isHighlight } = opts;
    const {
      id: seriesId,
      properties,
      ctx: { callbackCache }
    } = this;
    const { fromKey, toKey, sizeKey } = properties;
    const {
      fill: baseFill,
      fillOpacity,
      stroke: baseStroke,
      strokeOpacity,
      lineDash,
      lineDashOffset,
      itemStyler
    } = properties.link;
    const highlightStyle = isHighlight ? properties.highlightStyle.item : void 0;
    const strokeWidth = this.getStrokeWidth(properties.link.strokeWidth);
    datumSelection.each((link, datum) => {
      const fill = baseFill ?? datum.fromNode.fill;
      const stroke = baseStroke ?? datum.fromNode.stroke;
      let format;
      if (itemStyler != null) {
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
          fromKey,
          toKey,
          sizeKey,
          fill,
          fillOpacity,
          strokeOpacity,
          stroke,
          strokeWidth,
          lineDash,
          lineDashOffset,
          highlighted: isHighlight
        });
      }
      link.x1 = datum.x1;
      link.y1 = datum.y1;
      link.x2 = datum.x2;
      link.y2 = datum.y2;
      link.height = datum.height;
      link.fill = highlightStyle?.fill ?? format?.fill ?? fill;
      link.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
      link.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
      link.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
      link.strokeWidth = Math.min(
        highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth,
        datum.height / 2
      );
      link.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
      link.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
      link.inset = link.strokeWidth / 2;
    });
  }
  getTooltipHtml(nodeDatum) {
    const {
      id: seriesId,
      processedData,
      ctx: { callbackCache },
      properties
    } = this;
    if (!processedData || !properties.isValid()) {
      return EMPTY_TOOLTIP_CONTENT2;
    }
    const { fromKey, toKey, sizeKey, sizeName, tooltip } = properties;
    const { datum, itemId } = nodeDatum;
    let title;
    const contentLines = [];
    let fill;
    if (nodeDatum.type === 0 /* Link */) {
      const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, itemStyler } = properties.link;
      const { fromNode, toNode, size } = nodeDatum;
      title = `${fromNode.label ?? fromNode.id} - ${toNode.label ?? toNode.id}`;
      if (sizeKey != null) {
        contentLines.push(sanitizeHtml13(`${sizeName ?? sizeKey}: ` + size));
      }
      fill = properties.link.fill ?? fromNode.fill;
      const stroke = properties.link.stroke ?? fromNode.stroke;
      let format;
      if (itemStyler != null) {
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
          fromKey,
          toKey,
          sizeKey,
          fill,
          fillOpacity,
          strokeOpacity,
          stroke,
          strokeWidth,
          lineDash,
          lineDashOffset,
          highlighted: true
        });
      }
      fill = format?.fill ?? fill;
    } else {
      const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, itemStyler } = properties.node;
      const { id, label, size } = nodeDatum;
      title = label ?? id;
      if (sizeKey != null) {
        contentLines.push(sanitizeHtml13(`${sizeName ?? sizeKey}: ` + size));
      }
      fill = properties.link.fill ?? datum.fill;
      const stroke = properties.link.stroke ?? datum.stroke;
      let format;
      if (itemStyler != null) {
        format = callbackCache.call(itemStyler, {
          seriesId,
          datum: datum.datum,
          label,
          size,
          fromKey,
          toKey,
          sizeKey,
          fill,
          fillOpacity,
          strokeOpacity,
          stroke,
          strokeWidth,
          lineDash,
          lineDashOffset,
          highlighted: true
        });
      }
      fill = format?.fill ?? fill;
    }
    const content = contentLines.join("<br>");
    const color = fill;
    return tooltip.toTooltipHtml(
      { title, content, backgroundColor: color },
      {
        seriesId,
        datum,
        title,
        color,
        itemId,
        fromKey,
        toKey,
        sizeKey,
        sizeName,
        ...this.getModuleTooltipParams()
      }
    );
  }
  getLabelData() {
    return [];
  }
  computeFocusBounds({
    datumIndex,
    seriesRect
  }) {
    const datum = this.contextNodeData?.nodeData[datumIndex];
    if (datum?.type === 1 /* Node */) {
      const { x, y, width, height } = datum;
      const bbox = new BBox10(x, y, width, height);
      return this.contentGroup.inverseTransformBBox(bbox).clip(seriesRect);
    } else if (datum?.type === 0 /* Link */) {
      for (const link of this.linkSelection) {
        if (link.datum === datum) {
          return link.node;
        }
      }
      return void 0;
    }
  }
};
SankeySeries.className = "SankeySeries";
SankeySeries.type = "sankey";

// packages/ag-charts-enterprise/src/series/sankey/sankeyModule.ts
var { DEFAULT_FONT_FAMILY: DEFAULT_FONT_FAMILY3, DEFAULT_LABEL_COLOUR: DEFAULT_LABEL_COLOUR4 } = import_ag_charts_community155._Theme;
var SankeyModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["flow-proportion"],
  solo: true,
  identifier: "sankey",
  instanceConstructor: SankeySeries,
  tooltipDefaults: { range: "exact" },
  themeTemplate: {
    seriesArea: {
      padding: {
        top: 10,
        bottom: 10
      }
    },
    series: {
      highlightStyle: {
        series: {
          dimOpacity: 0.2
        }
      },
      label: {
        fontFamily: DEFAULT_FONT_FAMILY3,
        color: DEFAULT_LABEL_COLOUR4,
        fontSize: 12,
        spacing: 10
      },
      node: {
        spacing: 20,
        width: 10,
        strokeWidth: 0
      },
      link: {
        fillOpacity: 0.5,
        strokeWidth: 0
      }
    },
    legend: {
      enabled: false,
      toggleSeries: false
    }
  },
  paletteFactory({ takeColors, colorsCount }) {
    return takeColors(colorsCount);
  }
};

// packages/ag-charts-enterprise/src/series/sunburst/sunburstModule.ts
var import_ag_charts_community158 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeries.ts
var import_ag_charts_community157 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeriesProperties.ts
var import_ag_charts_community156 = require("ag-charts-community");
var {
  HierarchySeriesProperties,
  HighlightStyle,
  SeriesTooltip: SeriesTooltip17,
  Validate: Validate59,
  COLOR_STRING: COLOR_STRING24,
  FUNCTION: FUNCTION18,
  NUMBER: NUMBER14,
  OBJECT: OBJECT27,
  POSITIVE_NUMBER: POSITIVE_NUMBER27,
  RATIO: RATIO30,
  STRING: STRING26
} = import_ag_charts_community156._ModuleSupport;
var SunburstSeriesTileHighlightStyle = class extends HighlightStyle {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizedLabel();
  }
};
__decorateClass([
  Validate59(STRING26, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate59(RATIO30, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate59(COLOR_STRING24, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate59(POSITIVE_NUMBER27, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate59(RATIO30, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate59(OBJECT27)
], SunburstSeriesTileHighlightStyle.prototype, "label", 2);
__decorateClass([
  Validate59(OBJECT27)
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
    this.tooltip = new SeriesTooltip17();
  }
};
__decorateClass([
  Validate59(STRING26, { optional: true })
], SunburstSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate59(STRING26, { optional: true })
], SunburstSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate59(STRING26, { optional: true })
], SunburstSeriesProperties.prototype, "secondaryLabelKey", 2);
__decorateClass([
  Validate59(RATIO30)
], SunburstSeriesProperties.prototype, "fillOpacity", 2);
__decorateClass([
  Validate59(POSITIVE_NUMBER27)
], SunburstSeriesProperties.prototype, "strokeWidth", 2);
__decorateClass([
  Validate59(RATIO30)
], SunburstSeriesProperties.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate59(POSITIVE_NUMBER27)
], SunburstSeriesProperties.prototype, "cornerRadius", 2);
__decorateClass([
  Validate59(NUMBER14, { optional: true })
], SunburstSeriesProperties.prototype, "sectorSpacing", 2);
__decorateClass([
  Validate59(NUMBER14, { optional: true })
], SunburstSeriesProperties.prototype, "padding", 2);
__decorateClass([
  Validate59(FUNCTION18, { optional: true })
], SunburstSeriesProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate59(OBJECT27)
], SunburstSeriesProperties.prototype, "highlightStyle", 2);
__decorateClass([
  Validate59(OBJECT27)
], SunburstSeriesProperties.prototype, "label", 2);
__decorateClass([
  Validate59(OBJECT27)
], SunburstSeriesProperties.prototype, "secondaryLabel", 2);
__decorateClass([
  Validate59(OBJECT27)
], SunburstSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/sunburst/sunburstSeries.ts
var { fromToMotion: fromToMotion3 } = import_ag_charts_community157._ModuleSupport;
var { Sector: Sector6, Group: Group15, Selection: Selection11, Text: Text14 } = import_ag_charts_community157._Scene;
var { sanitizeHtml: sanitizeHtml14 } = import_ag_charts_community157._Util;
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
var SunburstSeries = class extends import_ag_charts_community157._ModuleSupport.HierarchySeries {
  constructor() {
    super(...arguments);
    this.properties = new SunburstSeriesProperties();
    this.groupSelection = Selection11.select(this.contentGroup, Group15);
    this.highlightSelection = Selection11.select(this.highlightGroup, Group15);
    this.angleData = [];
  }
  async processData() {
    const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName } = this.properties;
    await super.processData();
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
  }
  async updateSelections() {
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
        new Sector6(),
        new Text14({ tag: 0 /* Primary */ }),
        new Text14({ tag: 1 /* Secondary */ })
      ]);
    };
    this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
  }
  async updateNodes() {
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
    const highlightedNode = this.ctx.highlightManager?.getActiveHighlight();
    const labelTextNode = new Text14();
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
      const fill = format?.fill ?? highlightedFill ?? node.fill;
      const fillOpacity = format?.fillOpacity ?? highlightedFillOpacity ?? this.properties.fillOpacity;
      const stroke = format?.stroke ?? highlightedStroke ?? node.stroke;
      const strokeWidth = format?.strokeWidth ?? highlightedStrokeWidth ?? this.properties.strokeWidth;
      const strokeOpacity = format?.strokeOpacity ?? highlightedStrokeOpacity ?? this.properties.strokeOpacity;
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
    this.groupSelection.selectByClass(Sector6).forEach((sector) => {
      updateSector(sector.datum, sector, false);
    });
    this.highlightSelection.selectByClass(Sector6).forEach((sector) => {
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
        const isCenterCircle = depth === 0 && node.parent?.sumSize === node.sumSize;
        if (isCenterCircle) {
          const labelWidth2 = 2 * Math.sqrt(outerRadius ** 2 - (labelHeight2 * 0.5) ** 2);
          return { width: labelWidth2, height: labelHeight2, meta: 0 /* CenterCircle */ };
        }
        const parallelHeight = labelHeight2;
        const availableWidthUntilItHitsTheOuterRadius = 2 * Math.sqrt(outerRadius ** 2 - (innerRadius + parallelHeight) ** 2);
        const availableWidthUntilItHitsTheStraightEdges = deltaInnerAngle < Math.PI ? 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5) : Infinity;
        const parallelWidth = Math.min(
          availableWidthUntilItHitsTheOuterRadius,
          availableWidthUntilItHitsTheStraightEdges
        );
        const maxPerpendicularAngle = Math.PI / 4;
        let perpendicularHeight;
        let perpendicularWidth;
        if (depth === 0) {
          perpendicularHeight = labelHeight2;
          perpendicularWidth = Math.sqrt(outerRadius ** 2 - (perpendicularHeight / 2) ** 2) - labelHeight2 / (2 * Math.tan(deltaOuterAngle * 0.5));
        } else if (import_ag_charts_community157._Util.normalizeAngle360(deltaInnerAngle) < maxPerpendicularAngle) {
          perpendicularHeight = 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5);
          perpendicularWidth = Math.sqrt(outerRadius ** 2 - (perpendicularHeight / 2) ** 2) - innerRadius;
        } else {
          perpendicularWidth = 0;
          perpendicularHeight = 0;
        }
        return parallelWidth >= perpendicularWidth ? { width: parallelWidth, height: parallelHeight, meta: 1 /* Parallel */ } : { width: perpendicularWidth, height: perpendicularHeight, meta: 2 /* Perpendicular */ };
      };
      const formatting = formatLabels(
        labelDatum?.label,
        this.properties.label,
        labelDatum?.secondaryLabel,
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
          const maximumRadius = Math.sqrt((outerRadius - padding) ** 2 - (labelWidth / 2) ** 2);
          labelRadius = Math.min(idealRadius, maximumRadius);
          break;
        }
        case 2 /* Perpendicular */:
          if (depth === 0) {
            const minimumRadius = labelHeight / (2 * Math.tan(deltaInnerAngle * 0.5)) + labelWidth * 0.5;
            const maximumRadius = Math.sqrt(outerRadius ** 2 - (labelHeight * 0.5) ** 2) - labelWidth * 0.5;
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
      const meta = labelMeta?.[index];
      const labelStyle = tag === 0 /* Primary */ ? this.properties.label : this.properties.secondaryLabel;
      const label = tag === 0 /* Primary */ ? meta?.label : meta?.secondaryLabel;
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
      text.fill = highlightedColor ?? labelStyle.color;
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
    this.groupSelection.selectByClass(Text14).forEach((text) => {
      updateText(text.datum, text, text.tag, false);
    });
    this.highlightSelection.selectByClass(Text14).forEach((text) => {
      const node = text.datum;
      const isHighlighted = highlightedNode === node;
      text.visible = isHighlighted;
      if (text.visible) {
        updateText(text.datum, text, text.tag, isHighlighted);
      }
    });
  }
  getSectorFormat(node, isHighlighted) {
    const { datum, fill, stroke, depth } = node;
    const {
      ctx: { callbackCache },
      properties: { itemStyler }
    } = this;
    if (!itemStyler || datum == null || depth == null) {
      return {};
    }
    const { colorKey, childrenKey, labelKey, secondaryLabelKey, sizeKey, strokeWidth, fillOpacity, strokeOpacity } = this.properties;
    return callbackCache.call(itemStyler, {
      seriesId: this.id,
      highlighted: isHighlighted,
      datum,
      depth,
      colorKey,
      childrenKey,
      labelKey,
      secondaryLabelKey,
      sizeKey,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity
    });
  }
  getTooltipHtml(node) {
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
      return import_ag_charts_community157._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const title = labelKey != null ? datum[labelKey] : void 0;
    const format = this.getSectorFormat(node, false);
    const color = format?.fill ?? node.fill;
    if (!tooltip.renderer && !title) {
      return import_ag_charts_community157._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const contentArray = [];
    const datumSecondaryLabel = secondaryLabelKey != null ? datum[secondaryLabelKey] : void 0;
    if (datumSecondaryLabel != null && secondaryLabelKey !== colorKey && secondaryLabelKey !== sizeKey) {
      contentArray.push(sanitizeHtml14(datumSecondaryLabel));
    }
    const datumSize = sizeKey != null ? datum[sizeKey] : void 0;
    if (datumSize != null) {
      contentArray.push(`${sizeName}: ${sanitizeHtml14(datumSize)}`);
    }
    const datumColor = colorKey != null ? datum[colorKey] : void 0;
    if (datumColor != null) {
      contentArray.push(`${colorName}: ${sanitizeHtml14(datumColor)}`);
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
  async createNodeData() {
    return void 0;
  }
  pickNodeClosestDatum(point) {
    return this.pickNodeNearestDistantObject(point, this.groupSelection.selectByClass(Sector6));
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
  computeFocusBounds(nodeDatum) {
    let match;
    for (const { node, datum } of this.groupSelection) {
      if (datum === nodeDatum) {
        match = import_ag_charts_community157._Scene.Selection.selectByClass(node, import_ag_charts_community157._Scene.Sector)[0];
      }
    }
    return match;
  }
};
SunburstSeries.className = "SunburstSeries";
SunburstSeries.type = "sunburst";

// packages/ag-charts-enterprise/src/series/sunburst/sunburstModule.ts
var { DEFAULT_INSIDE_SERIES_LABEL_COLOUR } = import_ag_charts_community158._Theme;
var SunburstModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["hierarchy"],
  identifier: "sunburst",
  instanceConstructor: SunburstSeries,
  tooltipDefaults: { range: "exact" },
  solo: true,
  themeTemplate: {
    series: {
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
    const { fills, strokes } = takeColors(colorsCount);
    const defaultColorRange = themeTemplateParameters.get(import_ag_charts_community158._Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    return { fills, strokes, colorRange: defaultColorRange };
  }
};

// packages/ag-charts-enterprise/src/series/treemap/treemapModule.ts
var import_ag_charts_community161 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts
var import_ag_charts_community160 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/treemap/treemapSeriesProperties.ts
var import_ag_charts_community159 = require("ag-charts-community");
var { Label: Label13 } = import_ag_charts_community159._Scene;
var {
  BaseProperties: BaseProperties16,
  HierarchySeriesProperties: HierarchySeriesProperties2,
  HighlightStyle: HighlightStyle2,
  SeriesTooltip: SeriesTooltip18,
  Validate: Validate60,
  BOOLEAN: BOOLEAN19,
  COLOR_STRING: COLOR_STRING25,
  FUNCTION: FUNCTION19,
  NUMBER: NUMBER15,
  OBJECT: OBJECT28,
  POSITIVE_NUMBER: POSITIVE_NUMBER28,
  RATIO: RATIO31,
  STRING: STRING27,
  STRING_ARRAY,
  TEXT_ALIGN: TEXT_ALIGN3,
  VERTICAL_ALIGN: VERTICAL_ALIGN2
} = import_ag_charts_community159._ModuleSupport;
var TreemapGroupLabel = class extends Label13 {
  constructor() {
    super(...arguments);
    this.spacing = 0;
  }
};
__decorateClass([
  Validate60(NUMBER15)
], TreemapGroupLabel.prototype, "spacing", 2);
var TreemapSeriesGroup = class extends BaseProperties16 {
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
  Validate60(STRING27, { optional: true })
], TreemapSeriesGroup.prototype, "fill", 2);
__decorateClass([
  Validate60(RATIO31)
], TreemapSeriesGroup.prototype, "fillOpacity", 2);
__decorateClass([
  Validate60(COLOR_STRING25, { optional: true })
], TreemapSeriesGroup.prototype, "stroke", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28)
], TreemapSeriesGroup.prototype, "strokeWidth", 2);
__decorateClass([
  Validate60(RATIO31)
], TreemapSeriesGroup.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28)
], TreemapSeriesGroup.prototype, "cornerRadius", 2);
__decorateClass([
  Validate60(TEXT_ALIGN3)
], TreemapSeriesGroup.prototype, "textAlign", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28)
], TreemapSeriesGroup.prototype, "gap", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28)
], TreemapSeriesGroup.prototype, "padding", 2);
__decorateClass([
  Validate60(BOOLEAN19)
], TreemapSeriesGroup.prototype, "interactive", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesGroup.prototype, "label", 2);
var TreemapSeriesTile = class extends BaseProperties16 {
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
  Validate60(STRING27, { optional: true })
], TreemapSeriesTile.prototype, "fill", 2);
__decorateClass([
  Validate60(RATIO31)
], TreemapSeriesTile.prototype, "fillOpacity", 2);
__decorateClass([
  Validate60(COLOR_STRING25, { optional: true })
], TreemapSeriesTile.prototype, "stroke", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28, { optional: true })
], TreemapSeriesTile.prototype, "strokeWidth", 2);
__decorateClass([
  Validate60(RATIO31)
], TreemapSeriesTile.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28)
], TreemapSeriesTile.prototype, "cornerRadius", 2);
__decorateClass([
  Validate60(TEXT_ALIGN3)
], TreemapSeriesTile.prototype, "textAlign", 2);
__decorateClass([
  Validate60(VERTICAL_ALIGN2)
], TreemapSeriesTile.prototype, "verticalAlign", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28)
], TreemapSeriesTile.prototype, "gap", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28)
], TreemapSeriesTile.prototype, "padding", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesTile.prototype, "label", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesTile.prototype, "secondaryLabel", 2);
var TreemapSeriesGroupHighlightStyle = class extends BaseProperties16 {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
  }
};
__decorateClass([
  Validate60(STRING27, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate60(RATIO31, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate60(COLOR_STRING25, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate60(RATIO31, { optional: true })
], TreemapSeriesGroupHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesGroupHighlightStyle.prototype, "label", 2);
var TreemapSeriesTileHighlightStyle = class extends BaseProperties16 {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
  }
};
__decorateClass([
  Validate60(STRING27, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "fill", 2);
__decorateClass([
  Validate60(RATIO31, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "fillOpacity", 2);
__decorateClass([
  Validate60(COLOR_STRING25, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "stroke", 2);
__decorateClass([
  Validate60(POSITIVE_NUMBER28, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "strokeWidth", 2);
__decorateClass([
  Validate60(RATIO31, { optional: true })
], TreemapSeriesTileHighlightStyle.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesTileHighlightStyle.prototype, "label", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesTileHighlightStyle.prototype, "secondaryLabel", 2);
var TreemapSeriesHighlightStyle = class extends HighlightStyle2 {
  constructor() {
    super(...arguments);
    this.group = new TreemapSeriesGroupHighlightStyle();
    this.tile = new TreemapSeriesTileHighlightStyle();
  }
};
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesHighlightStyle.prototype, "group", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesHighlightStyle.prototype, "tile", 2);
var TreemapSeriesProperties = class extends HierarchySeriesProperties2 {
  constructor() {
    super(...arguments);
    this.highlightStyle = new TreemapSeriesHighlightStyle();
    this.tooltip = new SeriesTooltip18();
    this.group = new TreemapSeriesGroup();
    this.tile = new TreemapSeriesTile();
    this.undocumentedGroupFills = [];
    this.undocumentedGroupStrokes = [];
  }
};
__decorateClass([
  Validate60(STRING27, { optional: true })
], TreemapSeriesProperties.prototype, "sizeName", 2);
__decorateClass([
  Validate60(STRING27, { optional: true })
], TreemapSeriesProperties.prototype, "labelKey", 2);
__decorateClass([
  Validate60(STRING27, { optional: true })
], TreemapSeriesProperties.prototype, "secondaryLabelKey", 2);
__decorateClass([
  Validate60(FUNCTION19, { optional: true })
], TreemapSeriesProperties.prototype, "itemStyler", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesProperties.prototype, "highlightStyle", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesProperties.prototype, "tooltip", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesProperties.prototype, "group", 2);
__decorateClass([
  Validate60(OBJECT28)
], TreemapSeriesProperties.prototype, "tile", 2);
__decorateClass([
  Validate60(STRING_ARRAY)
], TreemapSeriesProperties.prototype, "undocumentedGroupFills", 2);
__decorateClass([
  Validate60(STRING_ARRAY)
], TreemapSeriesProperties.prototype, "undocumentedGroupStrokes", 2);

// packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts
var { Rect: Rect6, Group: Group16, BBox: BBox11, Selection: Selection12, Text: Text15 } = import_ag_charts_community160._Scene;
var { Color: Color5, Logger: Logger16, clamp: clamp3, isEqual: isEqual2, sanitizeHtml: sanitizeHtml15 } = import_ag_charts_community160._Util;
var tempText = new Text15();
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
  if (typeof color === "string" && !Color5.validColorString(color)) {
    const fallbackColor = "black";
    Logger16.warnOnce(
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
var DistantGroup = class extends import_ag_charts_community160._Scene.Group {
  distanceSquared(x, y) {
    return this.computeBBox().distanceSquared(x, y);
  }
};
var TreemapSeries = class extends import_ag_charts_community160._ModuleSupport.HierarchySeries {
  constructor() {
    super(...arguments);
    this.properties = new TreemapSeriesProperties();
    this.groupSelection = Selection12.select(this.contentGroup, DistantGroup);
    this.highlightSelection = Selection12.select(this.highlightGroup, Group16);
  }
  groupTitleHeight(node, bbox) {
    const label = this.labelData?.[node.index]?.label;
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
  async processData() {
    await super.processData();
    const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName, tile, group } = this.properties;
    if (!this.data?.length) {
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
  }
  sortChildren({ children }) {
    const sortedChildrenIndices = Array.from(children, (_, i) => i).filter((i) => nodeSize(children[i]) > 0).sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));
    const childAt = (i) => {
      const sortedIndex = sortedChildrenIndices[i];
      return children[sortedIndex];
    };
    return { sortedChildrenIndices, childAt };
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
    const { sortedChildrenIndices, childAt } = this.sortChildren(node);
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
    const innerBox = new BBox11(bbox.x + padding.left, bbox.y + padding.top, width, height);
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
        const childBbox = new BBox11(x, y, stackWidth, stackHeight);
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
      const childBox = new BBox11(x, y, childWidth, childHeight);
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
  async createNodeData() {
    return void 0;
  }
  async updateSelections() {
    if (!this.nodeDataRefresh) {
      return;
    }
    this.nodeDataRefresh = false;
    const { seriesRect } = this.chart ?? {};
    if (!seriesRect)
      return;
    const descendants = Array.from(this.rootNode);
    const updateGroup = (group) => {
      group.append([
        new Rect6(),
        new Text15({ tag: 0 /* Primary */ }),
        new Text15({ tag: 1 /* Secondary */ })
      ]);
    };
    this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
  }
  getTileFormat(node, highlighted) {
    const { datum, depth, children } = node;
    const { colorKey, childrenKey, labelKey, secondaryLabelKey, sizeKey, tile, group, itemStyler } = this.properties;
    if (!itemStyler || datum == null || depth == null) {
      return {};
    }
    const isLeaf = children.length === 0;
    const fill = this.getNodeFill(node);
    const stroke = this.getNodeStroke(node);
    const strokeWidth = isLeaf ? tile.strokeWidth : group.strokeWidth;
    return this.ctx.callbackCache.call(itemStyler, {
      seriesId: this.id,
      highlighted,
      datum,
      depth,
      colorKey,
      childrenKey,
      labelKey,
      secondaryLabelKey,
      sizeKey,
      fill,
      fillOpacity: 1,
      stroke,
      strokeWidth,
      strokeOpacity: 1
    });
  }
  getNodeFill(node) {
    const isLeaf = node.children.length === 0;
    if (isLeaf) {
      return this.properties.tile.fill ?? node.fill;
    }
    const { undocumentedGroupFills } = this.properties;
    const defaultFill = undocumentedGroupFills[Math.min(node.depth ?? 0, undocumentedGroupFills.length)];
    return this.properties.group.fill ?? defaultFill;
  }
  getNodeStroke(node) {
    const isLeaf = node.children.length === 0;
    if (isLeaf) {
      return this.properties.tile.stroke ?? node.stroke;
    }
    const { undocumentedGroupStrokes } = this.properties;
    const defaultStroke = undocumentedGroupStrokes[Math.min(node.depth ?? 0, undocumentedGroupStrokes.length)];
    return this.properties.group.stroke ?? defaultStroke;
  }
  async updateNodes() {
    const { rootNode, data } = this;
    const { highlightStyle, tile, group } = this.properties;
    const { seriesRect } = this.chart ?? {};
    if (!seriesRect || !data)
      return;
    const { width, height } = seriesRect;
    const bboxes = Array.from(this.rootNode, () => void 0);
    const paddings = Array.from(this.rootNode, () => void 0);
    this.squarify(rootNode, new BBox11(0, 0, width, height), bboxes, paddings);
    let highlightedNode = this.ctx.highlightManager?.getActiveHighlight();
    if (highlightedNode != null && !this.properties.group.interactive && highlightedNode.children.length !== 0) {
      highlightedNode = void 0;
    }
    this.updateNodeMidPoint(bboxes);
    const updateRectFn = (node, rect, highlighted) => {
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
      const fill = format?.fill ?? highlightedFill ?? this.getNodeFill(node);
      const fillOpacity = format?.fillOpacity ?? highlightedFillOpacity ?? (isLeaf ? tile.fillOpacity : group.fillOpacity);
      const stroke = format?.stroke ?? highlightedStroke ?? this.getNodeStroke(node);
      const strokeWidth = format?.strokeWidth ?? highlightedStrokeWidth ?? (isLeaf ? tile.strokeWidth : group.strokeWidth);
      const strokeOpacity = format?.strokeOpacity ?? highlightedStrokeOpacity ?? (isLeaf ? tile.strokeOpacity : group.strokeOpacity);
      rect.crisp = true;
      rect.fill = validateColor(fill);
      rect.fillOpacity = fillOpacity;
      rect.stroke = validateColor(stroke);
      rect.strokeWidth = strokeWidth;
      rect.strokeOpacity = strokeOpacity;
      rect.cornerRadius = isLeaf ? tile.cornerRadius : group.cornerRadius;
      const onlyLeaves = node.parent?.children.every((n) => n.children.length === 0);
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
    this.groupSelection.selectByClass(Rect6).forEach((rect) => updateRectFn(rect.datum, rect, false));
    this.highlightSelection.selectByClass(Rect6).forEach((rect) => {
      const isDatumHighlighted = rect.datum === highlightedNode;
      rect.visible = isDatumHighlighted || (highlightedNode?.contains(rect.datum) ?? false);
      if (rect.visible) {
        updateRectFn(rect.datum, rect, isDatumHighlighted);
      }
    });
    const labelMeta = Array.from(this.rootNode, (node) => {
      const { index, children } = node;
      const bbox = bboxes[index];
      const labelDatum = this.labelData?.[index];
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
        const textAlignFactor = textAlignFactors2[textAlign] ?? 0.5;
        const labelX = bbox.x + padding + (bbox.width - 2 * padding) * textAlignFactor;
        const verticalAlignFactor = verticalAlignFactors2[verticalAlign] ?? 0.5;
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
      } else if (labelDatum?.label == null) {
        return;
      } else {
        const { padding, textAlign } = group;
        const groupTitleHeight = this.groupTitleHeight(node, bbox);
        if (groupTitleHeight == null) {
          return;
        }
        const innerWidth = bbox.width - 2 * padding;
        const text = Text15.wrap(labelDatum.label, bbox.width - 2 * padding, Infinity, group.label, "never");
        const textAlignFactor = textAlignFactors2[textAlign] ?? 0.5;
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
      const label = tag === 0 /* Primary */ ? meta?.label : meta?.secondaryLabel;
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
      text.fill = highlightedColor ?? label.style.color;
      text.textAlign = meta.textAlign;
      text.textBaseline = meta.verticalAlign;
      text.x = label.x;
      text.y = label.y;
      text.visible = true;
    };
    this.groupSelection.selectByClass(Text15).forEach((text) => {
      updateLabelFn(text.datum, text, text.tag, false);
    });
    this.highlightSelection.selectByClass(Text15).forEach((text) => {
      const isDatumHighlighted = text.datum === highlightedNode;
      text.visible = isDatumHighlighted || (highlightedNode?.contains(text.datum) ?? false);
      if (text.visible) {
        updateLabelFn(text.datum, text, text.tag, isDatumHighlighted);
      }
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
    const exactMatch = this.pickNodeExactShape(point);
    if (exactMatch !== void 0) {
      return exactMatch;
    }
    return this.pickNodeNearestDistantObject(point, this.groupSelection.nodes());
  }
  getTooltipHtml(node) {
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
      return import_ag_charts_community160._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const title = labelKey != null ? datum[labelKey] : void 0;
    const format = this.getTileFormat(node, false);
    const color = format?.fill ?? this.getNodeFill(node);
    if (!tooltip.renderer && !title) {
      return import_ag_charts_community160._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const contentArray = [];
    const datumSecondaryLabel = secondaryLabelKey != null ? datum[secondaryLabelKey] : void 0;
    if (datumSecondaryLabel != null && secondaryLabelKey !== colorKey && secondaryLabelKey !== sizeKey) {
      contentArray.push(sanitizeHtml15(datumSecondaryLabel));
    }
    const datumSize = sizeKey != null ? datum[sizeKey] : void 0;
    if (datumSize != null) {
      contentArray.push(`${sizeName}: ${sanitizeHtml15(datumSize)}`);
    }
    const datumColor = colorKey != null ? datum[colorKey] : void 0;
    if (datumColor != null) {
      contentArray.push(`${colorName}: ${sanitizeHtml15(datumColor)}`);
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
  pickFocus(opts) {
    const { focusPath: path } = this;
    if (path.length < 2 || this.focusSorted == null) {
      path.length = 1;
      this.focusSorted = this.sortChildren(path[0].nodeDatum);
      path.push({ nodeDatum: this.focusSorted.childAt(0), childIndex: 0 });
    }
    const { datumIndexDelta: childDelta, otherIndexDelta: depthDelta } = opts;
    const current = path[path.length - 1];
    if (depthDelta === 1) {
      if (current.nodeDatum.children.length > 0) {
        this.focusSorted = this.sortChildren(current.nodeDatum);
        const newFocus = { nodeDatum: this.focusSorted.childAt(0), childIndex: 0 };
        path.push(newFocus);
        return this.computeFocusOutputs(newFocus);
      }
    } else if (childDelta !== 0) {
      const targetIndex = current.childIndex + childDelta;
      const maxIndex = (current.nodeDatum.parent?.children.length ?? 1) - 1;
      current.childIndex = clamp3(0, targetIndex, maxIndex);
      current.nodeDatum = this.focusSorted.childAt(current.childIndex);
      return this.computeFocusOutputs(current);
    }
    const result = super.pickFocus(opts);
    if (depthDelta < 0) {
      this.focusSorted = this.sortChildren(path[path.length - 1].nodeDatum.parent);
    }
    return result;
  }
  computeFocusBounds(node) {
    const rects = this.groupSelection.selectByClass(Rect6);
    return rects[node.index]?.computeTransformedBBox();
  }
};
TreemapSeries.className = "TreemapSeries";
TreemapSeries.type = "treemap";

// packages/ag-charts-enterprise/src/series/treemap/treemapModule.ts
var {
  DEFAULT_DIVERGING_SERIES_COLOUR_RANGE: DEFAULT_DIVERGING_SERIES_COLOUR_RANGE4,
  DEFAULT_FONT_FAMILY: DEFAULT_FONT_FAMILY4,
  DEFAULT_HIERARCHY_FILLS: DEFAULT_HIERARCHY_FILLS2,
  DEFAULT_HIERARCHY_STROKES: DEFAULT_HIERARCHY_STROKES2,
  DEFAULT_INSIDE_SERIES_LABEL_COLOUR: DEFAULT_INSIDE_SERIES_LABEL_COLOUR2,
  DEFAULT_LABEL_COLOUR: DEFAULT_LABEL_COLOUR5,
  FONT_WEIGHT: FONT_WEIGHT3
} = import_ag_charts_community161._Theme;
var TreemapModule = {
  type: "series",
  optionsKey: "series[]",
  packageType: "enterprise",
  chartTypes: ["hierarchy"],
  identifier: "treemap",
  instanceConstructor: TreemapSeries,
  tooltipDefaults: { range: "exact" },
  solo: true,
  themeTemplate: {
    series: {
      group: {
        label: {
          enabled: true,
          color: DEFAULT_LABEL_COLOUR5,
          fontStyle: void 0,
          fontWeight: FONT_WEIGHT3.NORMAL,
          fontSize: 12,
          fontFamily: DEFAULT_FONT_FAMILY4,
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
          fontWeight: FONT_WEIGHT3.NORMAL,
          fontSize: 18,
          minimumFontSize: 10,
          fontFamily: DEFAULT_FONT_FAMILY4,
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
          fontFamily: DEFAULT_FONT_FAMILY4,
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
            color: DEFAULT_LABEL_COLOUR5
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
    const { fills, strokes } = takeColors(colorsCount);
    const defaultColorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE4);
    const groupFills = themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS2);
    const groupStrokes = themeTemplateParameters.get(DEFAULT_HIERARCHY_STROKES2);
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
var import_ag_charts_community165 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeries.ts
var import_ag_charts_community163 = require("ag-charts-community");

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeriesProperties.ts
var import_ag_charts_community162 = require("ag-charts-community");
var { DropShadow: DropShadow3, Label: Label14 } = import_ag_charts_community162._Scene;
var {
  AbstractBarSeriesProperties: AbstractBarSeriesProperties5,
  BaseProperties: BaseProperties17,
  PropertiesArray: PropertiesArray3,
  SeriesTooltip: SeriesTooltip19,
  Validate: Validate61,
  BOOLEAN: BOOLEAN20,
  COLOR_STRING: COLOR_STRING26,
  FUNCTION: FUNCTION20,
  LINE_DASH: LINE_DASH20,
  NUMBER: NUMBER16,
  OBJECT: OBJECT29,
  OBJECT_ARRAY,
  POSITIVE_NUMBER: POSITIVE_NUMBER29,
  RATIO: RATIO32,
  STRING: STRING28,
  UNION: UNION8
} = import_ag_charts_community162._ModuleSupport;
var WaterfallSeriesTotal = class extends BaseProperties17 {
};
__decorateClass([
  Validate61(UNION8(["subtotal", "total"], "a total type"))
], WaterfallSeriesTotal.prototype, "totalType", 2);
__decorateClass([
  Validate61(NUMBER16)
], WaterfallSeriesTotal.prototype, "index", 2);
__decorateClass([
  Validate61(STRING28)
], WaterfallSeriesTotal.prototype, "axisLabel", 2);
var WaterfallSeriesItemTooltip = class extends BaseProperties17 {
};
__decorateClass([
  Validate61(FUNCTION20, { optional: true })
], WaterfallSeriesItemTooltip.prototype, "renderer", 2);
var WaterfallSeriesLabel = class extends Label14 {
  constructor() {
    super(...arguments);
    this.placement = "end";
    this.padding = 6;
  }
};
__decorateClass([
  Validate61(UNION8(["start", "end", "inside"], "a placement"))
], WaterfallSeriesLabel.prototype, "placement", 2);
__decorateClass([
  Validate61(POSITIVE_NUMBER29)
], WaterfallSeriesLabel.prototype, "padding", 2);
var WaterfallSeriesItem = class extends BaseProperties17 {
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
  Validate61(STRING28, { optional: true })
], WaterfallSeriesItem.prototype, "name", 2);
__decorateClass([
  Validate61(COLOR_STRING26)
], WaterfallSeriesItem.prototype, "fill", 2);
__decorateClass([
  Validate61(COLOR_STRING26)
], WaterfallSeriesItem.prototype, "stroke", 2);
__decorateClass([
  Validate61(RATIO32)
], WaterfallSeriesItem.prototype, "fillOpacity", 2);
__decorateClass([
  Validate61(RATIO32)
], WaterfallSeriesItem.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate61(LINE_DASH20)
], WaterfallSeriesItem.prototype, "lineDash", 2);
__decorateClass([
  Validate61(POSITIVE_NUMBER29)
], WaterfallSeriesItem.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate61(POSITIVE_NUMBER29)
], WaterfallSeriesItem.prototype, "strokeWidth", 2);
__decorateClass([
  Validate61(POSITIVE_NUMBER29)
], WaterfallSeriesItem.prototype, "cornerRadius", 2);
__decorateClass([
  Validate61(FUNCTION20, { optional: true })
], WaterfallSeriesItem.prototype, "itemStyler", 2);
__decorateClass([
  Validate61(OBJECT29)
], WaterfallSeriesItem.prototype, "shadow", 2);
__decorateClass([
  Validate61(OBJECT29)
], WaterfallSeriesItem.prototype, "label", 2);
__decorateClass([
  Validate61(OBJECT29)
], WaterfallSeriesItem.prototype, "tooltip", 2);
var WaterfallSeriesConnectorLine = class extends BaseProperties17 {
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
  Validate61(BOOLEAN20)
], WaterfallSeriesConnectorLine.prototype, "enabled", 2);
__decorateClass([
  Validate61(COLOR_STRING26)
], WaterfallSeriesConnectorLine.prototype, "stroke", 2);
__decorateClass([
  Validate61(RATIO32)
], WaterfallSeriesConnectorLine.prototype, "strokeOpacity", 2);
__decorateClass([
  Validate61(LINE_DASH20)
], WaterfallSeriesConnectorLine.prototype, "lineDash", 2);
__decorateClass([
  Validate61(POSITIVE_NUMBER29)
], WaterfallSeriesConnectorLine.prototype, "lineDashOffset", 2);
__decorateClass([
  Validate61(POSITIVE_NUMBER29)
], WaterfallSeriesConnectorLine.prototype, "strokeWidth", 2);
var WaterfallSeriesItems = class extends BaseProperties17 {
  constructor() {
    super(...arguments);
    this.positive = new WaterfallSeriesItem();
    this.negative = new WaterfallSeriesItem();
    this.total = new WaterfallSeriesItem();
  }
};
__decorateClass([
  Validate61(OBJECT29)
], WaterfallSeriesItems.prototype, "positive", 2);
__decorateClass([
  Validate61(OBJECT29)
], WaterfallSeriesItems.prototype, "negative", 2);
__decorateClass([
  Validate61(OBJECT29)
], WaterfallSeriesItems.prototype, "total", 2);
var WaterfallSeriesProperties = class extends AbstractBarSeriesProperties5 {
  constructor() {
    super(...arguments);
    this.item = new WaterfallSeriesItems();
    this.totals = new PropertiesArray3(WaterfallSeriesTotal);
    this.line = new WaterfallSeriesConnectorLine();
    this.tooltip = new SeriesTooltip19();
  }
};
__decorateClass([
  Validate61(STRING28)
], WaterfallSeriesProperties.prototype, "xKey", 2);
__decorateClass([
  Validate61(STRING28)
], WaterfallSeriesProperties.prototype, "yKey", 2);
__decorateClass([
  Validate61(STRING28, { optional: true })
], WaterfallSeriesProperties.prototype, "xName", 2);
__decorateClass([
  Validate61(STRING28, { optional: true })
], WaterfallSeriesProperties.prototype, "yName", 2);
__decorateClass([
  Validate61(OBJECT29)
], WaterfallSeriesProperties.prototype, "item", 2);
__decorateClass([
  Validate61(OBJECT_ARRAY)
], WaterfallSeriesProperties.prototype, "totals", 2);
__decorateClass([
  Validate61(OBJECT29)
], WaterfallSeriesProperties.prototype, "line", 2);
__decorateClass([
  Validate61(OBJECT29)
], WaterfallSeriesProperties.prototype, "tooltip", 2);

// packages/ag-charts-enterprise/src/series/waterfall/waterfallSeries.ts
var {
  adjustLabelPlacement,
  SeriesNodePickMode: SeriesNodePickMode14,
  fixNumericExtent: fixNumericExtent9,
  valueProperty: valueProperty16,
  keyProperty: keyProperty9,
  accumulativeValueProperty,
  trailingAccumulatedValueProperty,
  ChartAxisDirection: ChartAxisDirection22,
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
} = import_ag_charts_community163._ModuleSupport;
var { Rect: Rect7, motion: motion9 } = import_ag_charts_community163._Scene;
var { sanitizeHtml: sanitizeHtml16, isContinuous } = import_ag_charts_community163._Util;
var { ContinuousScale: ContinuousScale4 } = import_ag_charts_community163._Scale;
var WaterfallSeries = class extends import_ag_charts_community163._ModuleSupport.AbstractBarSeries {
  constructor(moduleCtx) {
    super({
      moduleCtx,
      directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS2,
      directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES2,
      pickModes: [SeriesNodePickMode14.NEAREST_NODE, SeriesNodePickMode14.EXACT_SHAPE_MATCH],
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
  async processData(dataController) {
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
      dataWithTotals.push(datum);
      totalsMap.get(i)?.forEach((total) => dataWithTotals.push({ ...total.toJson(), [xKey]: total.axisLabel }));
    });
    const extraProps = [];
    if (!this.ctx.animationManager.isSkipped()) {
      extraProps.push(animationValidation9());
    }
    const xScale = this.getCategoryAxis()?.scale;
    const yScale = this.getValueAxis()?.scale;
    const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
    const { processedData } = await this.requestDataModel(dataController, dataWithTotals, {
      props: [
        keyProperty9(xKey, xScaleType, { id: `xValue` }),
        accumulativeValueProperty(yKey, yScaleType, {
          ...propertyDefinition,
          id: `yCurrent`
        }),
        accumulativeValueProperty(yKey, yScaleType, {
          ...propertyDefinition,
          missingValue: 0,
          id: `yCurrentTotal`
        }),
        accumulativeValueProperty(yKey, yScaleType, {
          ...propertyDefinition,
          id: `yCurrentPositive`,
          validation: positiveNumber
        }),
        accumulativeValueProperty(yKey, yScaleType, {
          ...propertyDefinition,
          id: `yCurrentNegative`,
          validation: negativeNumber
        }),
        trailingAccumulatedValueProperty(yKey, yScaleType, {
          ...propertyDefinition,
          id: `yPrevious`
        }),
        valueProperty16(yKey, yScaleType, { id: `yRaw` }),
        // Raw value pass-through.
        valueProperty16("totalType", "band", {
          id: `totalTypeValue`,
          missingValue: void 0,
          validation: totalTypeValue
        }),
        ...isContinuousX ? [import_ag_charts_community163._ModuleSupport.SMALLEST_KEY_INTERVAL, import_ag_charts_community163._ModuleSupport.LARGEST_KEY_INTERVAL] : [],
        ...extraProps
      ]
    });
    this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
    this.largestDataInterval = processedData.reduced?.largestKeyInterval;
    this.updateSeriesItemTypes();
    this.animationState.transition("updateData");
  }
  getSeriesDomain(direction) {
    const { processedData, dataModel, smallestDataInterval } = this;
    if (!processedData || !dataModel)
      return [];
    const {
      keys: [keys],
      values
    } = processedData.domain;
    const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
    if (direction === this.getCategoryDirection()) {
      if (keyDef?.def.type === "key" && keyDef?.def.valueType === "category") {
        return keys;
      }
      const scalePadding = isFiniteNumber10(smallestDataInterval) ? smallestDataInterval : 0;
      const keysExtent = import_ag_charts_community163._ModuleSupport.extent(keys) ?? [NaN, NaN];
      const categoryAxis = this.getCategoryAxis();
      const isReversed = Boolean(categoryAxis?.isReversed());
      const isDirectionY = direction === ChartAxisDirection22.Y;
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
  async createNodeData() {
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
    const barAlongX = this.getBarDirection() === ChartAxisDirection22.X;
    const barWidth = (ContinuousScale4.is(xScale) ? xScale.calcBandwidth(smallestDataInterval) : xScale.bandwidth) ?? 10;
    if (this.processedData?.type !== "ungrouped") {
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
        return (cumulativeValue ?? 0) - (trailingValue ?? 0);
      }
      return rawValue;
    }
    let trailingSubtotal = 0;
    const { xKey, yKey, xName, yName } = this.properties;
    this.processedData?.data.forEach(({ keys, datum, values }, dataIndex) => {
      const datumType = values[totalTypeIndex];
      const isSubtotal = this.isSubtotal(datumType);
      const isTotal = this.isTotal(datumType);
      const isTotalOrSubtotal = isTotal || isSubtotal;
      const xDatum = keys[xIndex];
      const x = Math.round(xScale.convert(xDatum));
      const rawValue = values[yRawIndex];
      const { cumulativeValue, trailingValue } = getValues(isTotal, isSubtotal, values);
      if (isTotalOrSubtotal) {
        trailingSubtotal = cumulativeValue ?? 0;
      }
      const currY = Math.round(yScale.convert(cumulativeValue));
      const trailY = Math.round(yScale.convert(trailingValue));
      const value = getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue);
      const isPositive = (value ?? 0) >= 0;
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
        cumulativeValue: cumulativeValue ?? 0,
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
        label: {
          text: labelText,
          ...adjustLabelPlacement({
            isPositive: (value ?? -1) >= 0,
            isVertical: !barAlongX,
            placement: label.placement,
            padding: label.padding,
            rect
          })
        }
      };
      context.nodeData.push(nodeDatum);
      context.labelData.push(nodeDatum);
    });
    const connectorLinesEnabled = this.properties.line.enabled;
    if (yCurrIndex !== void 0 && connectorLinesEnabled) {
      context.pointData = pointData;
    }
    return context;
  }
  updateSeriesItemTypes() {
    const { dataModel, seriesItemTypes, processedData } = this;
    if (!dataModel || !processedData) {
      return;
    }
    seriesItemTypes.clear();
    const yPositiveIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrentPositive");
    const yNegativeIndex = dataModel.resolveProcessedDataIndexById(this, "yCurrentNegative");
    const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`);
    const positiveDomain = processedData.domain.values[yPositiveIndex] ?? [];
    const negativeDomain = processedData.domain.values[yNegativeIndex] ?? [];
    if (positiveDomain.length > 0) {
      seriesItemTypes.add("positive");
    }
    if (negativeDomain.length > 0) {
      seriesItemTypes.add("negative");
    }
    const itemTypes = processedData?.domain.values[totalTypeIndex];
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
    return new Rect7();
  }
  getSeriesItemType(isPositive, datumType) {
    return datumType ?? (isPositive ? "positive" : "negative");
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
  async updateDatumSelection(opts) {
    const { nodeData, datumSelection } = opts;
    const data = nodeData ?? [];
    return datumSelection.update(data);
  }
  async updateDatumNodes(opts) {
    const { datumSelection, isHighlight } = opts;
    const { id: seriesId, ctx } = this;
    const {
      yKey,
      highlightStyle: { item: itemHighlightStyle }
    } = this.properties;
    const categoryAxis = this.getCategoryAxis();
    const crisp = checkCrisp2(
      categoryAxis?.scale,
      categoryAxis?.visibleRange,
      this.smallestDataInterval,
      this.largestDataInterval
    );
    const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection22.X;
    datumSelection.each((rect, datum) => {
      const seriesItemType = datum.itemId;
      const {
        fillOpacity,
        strokeOpacity,
        strokeWidth,
        lineDash,
        lineDashOffset,
        cornerRadius,
        itemStyler,
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
        itemStyler,
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
  }
  async updateLabelSelection(opts) {
    const { labelData, labelSelection } = opts;
    if (labelData.length === 0) {
      return labelSelection.update([]);
    }
    const itemId = labelData[0].itemId;
    const { label } = this.getItemConfig(itemId);
    const data = label.enabled ? labelData : [];
    return labelSelection.update(data);
  }
  async updateLabelNodes(opts) {
    opts.labelSelection.each((textNode, datum) => {
      updateLabelNode3(textNode, this.getItemConfig(datum.itemId).label, datum.label);
    });
  }
  getTooltipHtml(nodeDatum) {
    const categoryAxis = this.getCategoryAxis();
    const valueAxis = this.getValueAxis();
    if (!this.properties.isValid() || !categoryAxis || !valueAxis) {
      return import_ag_charts_community163._ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }
    const { id: seriesId } = this;
    const { xKey, yKey, xName, yName, tooltip } = this.properties;
    const { datum, itemId, xValue, yValue } = nodeDatum;
    const {
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      lineDash = [],
      lineDashOffset,
      cornerRadius,
      name,
      itemStyler
    } = this.getItemConfig(itemId);
    let format;
    if (itemStyler) {
      format = this.ctx.callbackCache.call(itemStyler, {
        datum,
        xKey,
        yKey,
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset,
        cornerRadius,
        highlighted: false,
        seriesId,
        itemId: nodeDatum.itemId
      });
    }
    const color = format?.fill ?? fill ?? "gray";
    const xString = sanitizeHtml16(categoryAxis.formatDatum(xValue));
    const yString = sanitizeHtml16(valueAxis.formatDatum(yValue));
    const isTotal = this.isTotal(itemId);
    const isSubtotal = this.isSubtotal(itemId);
    let ySubheading;
    if (isTotal) {
      ySubheading = "Total";
    } else if (isSubtotal) {
      ySubheading = "Subtotal";
    } else {
      ySubheading = name ?? yName ?? yKey;
    }
    const title = sanitizeHtml16(yName);
    const content = `<b>${sanitizeHtml16(xName ?? xKey)}</b>: ${xString}<br/><b>${sanitizeHtml16(ySubheading)}</b>: ${yString}`;
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
        label: { text: name ?? capitalise(item) },
        symbols: [{ marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } }]
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
    const valueAxisReversed = valueAxis?.isReversed();
    const compare = valueAxisReversed ? (v, v2) => v < v2 : (v, v2) => v > v2;
    const startX = valueAxis?.scale.convert(0);
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
      ease: import_ag_charts_community163._ModuleSupport.Motion.easeOut,
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
    const valueAxisReversed = valueAxis?.isReversed();
    const compare = valueAxisReversed ? (v, v2) => v > v2 : (v, v2) => v < v2;
    const startY = valueAxis?.scale.convert(0);
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
      ease: import_ag_charts_community163._ModuleSupport.Motion.easeOut,
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
  async updatePaths(opts) {
    this.resetConnectorLinesPath({ contextData: opts.contextData, paths: opts.paths });
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
      pointerEvents: import_ag_charts_community163._Scene.PointerEvents.None
    });
  }
  isLabelEnabled() {
    const { positive, negative, total } = this.properties.item;
    return positive.label.enabled || negative.label.enabled || total.label.enabled;
  }
  onDataChange() {
  }
  computeFocusBounds({ datumIndex, seriesRect }) {
    return computeBarFocusBounds6(this.contextNodeData?.nodeData[datumIndex], this.contentGroup, seriesRect);
  }
};
WaterfallSeries.className = "WaterfallSeries";
WaterfallSeries.type = "waterfall";

// packages/ag-charts-enterprise/src/series/waterfall/waterfallThemes.ts
var import_ag_charts_community164 = require("ag-charts-community");
var itemTheme = {
  strokeWidth: 0,
  label: {
    enabled: false,
    fontStyle: void 0,
    fontWeight: import_ag_charts_community164._Theme.FONT_WEIGHT.NORMAL,
    fontSize: 12,
    fontFamily: import_ag_charts_community164._Theme.DEFAULT_FONT_FAMILY,
    color: import_ag_charts_community164._Theme.DEFAULT_LABEL_COLOUR,
    formatter: void 0,
    placement: "end"
  }
};
var WATERFALL_SERIES_THEME = {
  series: {
    item: {
      positive: itemTheme,
      negative: itemTheme,
      total: itemTheme
    },
    line: {
      stroke: import_ag_charts_community164._Theme.PALETTE_NEUTRAL_STROKE,
      strokeOpacity: 1,
      lineDash: [0],
      lineDashOffset: 0,
      strokeWidth: 2
    }
  },
  legend: {
    enabled: true,
    toggleSeries: false
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
  tooltipDefaults: { range: "exact" },
  defaultAxes: [
    {
      type: import_ag_charts_community165._Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
      position: import_ag_charts_community165._Theme.POSITION.BOTTOM
    },
    {
      type: import_ag_charts_community165._Theme.CARTESIAN_AXIS_TYPE.NUMBER,
      position: import_ag_charts_community165._Theme.POSITION.LEFT
    }
  ],
  themeTemplate: WATERFALL_SERIES_THEME,
  swapDefaultAxesCondition: ({ direction }) => direction === "horizontal",
  paletteFactory: ({ takeColors, colorsCount, userPalette, palette }) => {
    if (userPalette === "user-indexed") {
      const { fills, strokes } = takeColors(colorsCount);
      return {
        line: { stroke: palette.neutral.stroke },
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
      };
    }
    return {
      line: { stroke: palette.neutral.stroke },
      item: {
        positive: {
          fill: palette.up.fill,
          stroke: palette.up.stroke,
          label: {
            color: import_ag_charts_community165._Theme.DEFAULT_LABEL_COLOUR
          }
        },
        negative: {
          fill: palette.down.fill,
          stroke: palette.down.stroke,
          label: {
            color: import_ag_charts_community165._Theme.DEFAULT_LABEL_COLOUR
          }
        },
        total: {
          fill: palette.neutral.fill,
          stroke: palette.neutral.stroke,
          label: {
            color: import_ag_charts_community165._Theme.DEFAULT_LABEL_COLOUR
          }
        }
      }
    };
  }
};

// packages/ag-charts-enterprise/src/setup.ts
function setupEnterpriseModules() {
  import_ag_charts_community166._ModuleSupport.moduleRegistry.register(
    AngleCategoryAxisModule,
    AngleNumberAxisModule,
    AnimationModule,
    AnnotationsModule,
    BackgroundModule,
    BoxPlotModule,
    CandlestickModule,
    ChordModule,
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
    StatusBarModule,
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
    SankeyModule,
    SunburstModule,
    SyncModule,
    TreemapModule,
    WaterfallModule,
    ZoomModule
  );
  import_ag_charts_community166._ModuleSupport.enterpriseModule.isEnterprise = true;
  import_ag_charts_community166._ModuleSupport.enterpriseModule.licenseManager = (options) => new LicenseManager(
    options.container?.ownerDocument ?? (typeof document === "undefined" ? void 0 : document)
  );
  import_ag_charts_community166._ModuleSupport.enterpriseModule.injectWatermark = injectWatermark;
}

// packages/ag-charts-enterprise/src/main.ts
__reExport(main_exports, require("ag-charts-community"), module.exports);
setupEnterpriseModules();
