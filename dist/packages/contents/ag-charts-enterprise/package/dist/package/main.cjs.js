'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var agChartsCommunity = require('ag-charts-community');

const ANGLE_AXIS_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_AXES_DEFAULTS,
    gridLine: {
        enabled: false,
        __extends__: agChartsCommunity._Theme.EXTENDS_AXES_GRID_LINE_DEFAULTS,
    },
};

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * Loops through an array of items right (starting from 0 till the middle item)
 * and left (starting from 0, continuing with the last item till the middle item).
 * Breaks if the iterator returns a truthy value.
 * @param items Array of items.
 * @param step Step to increment.
 * @param iterator Iterator function that accepts an item and the next item.
 * @returns `true` if the `iterator` returned `true`, or `false` if it never happened.
 */
function loopSymmetrically(items, step, iterator) {
    const loop = (start, end, step, iterator) => {
        let prev = items[0];
        for (let i = start; step > 0 ? i <= end : i > end; i += step) {
            const curr = items[i];
            if (iterator(prev, curr))
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

const { ChartAxisDirection: ChartAxisDirection$f, Layers: Layers$3, NUMBER: NUMBER$l, OPTIONAL: OPTIONAL$1, OPT_ARRAY, OPT_BOOLEAN: OPT_BOOLEAN$3, OPT_COLOR_STRING: OPT_COLOR_STRING$d, OPT_FONT_STYLE: OPT_FONT_STYLE$1, OPT_FONT_WEIGHT: OPT_FONT_WEIGHT$1, OPT_NUMBER: OPT_NUMBER$f, OPT_LINE_DASH: OPT_LINE_DASH$9, OPT_STRING: OPT_STRING$d, predicateWithMessage: predicateWithMessage$1, STRING: STRING$5, Validate: Validate$t, } = agChartsCommunity._ModuleSupport;
const { Group: Group$7 } = agChartsCommunity._Scene;
const { createId: createId$1 } = agChartsCommunity._Util;
const OPT_CROSSLINE_TYPE = predicateWithMessage$1((v, ctx) => OPTIONAL$1(v, ctx, (v) => v === 'range' || v === 'line'), `expecting a crossLine type keyword such as 'range' or 'line'`);
class PolarCrossLineLabel {
    constructor() {
        this.enabled = undefined;
        this.text = undefined;
        this.fontStyle = undefined;
        this.fontWeight = undefined;
        this.fontSize = 14;
        this.fontFamily = 'Verdana, sans-serif';
        /**
         * The padding between the label and the line.
         */
        this.padding = 5;
        /**
         * The color of the labels.
         */
        this.color = 'rgba(87, 87, 87, 1)';
        this.parallel = undefined;
    }
}
__decorate([
    Validate$t(OPT_BOOLEAN$3),
    __metadata("design:type", Boolean)
], PolarCrossLineLabel.prototype, "enabled", void 0);
__decorate([
    Validate$t(OPT_STRING$d),
    __metadata("design:type", String)
], PolarCrossLineLabel.prototype, "text", void 0);
__decorate([
    Validate$t(OPT_FONT_STYLE$1),
    __metadata("design:type", String)
], PolarCrossLineLabel.prototype, "fontStyle", void 0);
__decorate([
    Validate$t(OPT_FONT_WEIGHT$1),
    __metadata("design:type", String)
], PolarCrossLineLabel.prototype, "fontWeight", void 0);
__decorate([
    Validate$t(NUMBER$l(0)),
    __metadata("design:type", Number)
], PolarCrossLineLabel.prototype, "fontSize", void 0);
__decorate([
    Validate$t(STRING$5),
    __metadata("design:type", String)
], PolarCrossLineLabel.prototype, "fontFamily", void 0);
__decorate([
    Validate$t(NUMBER$l()),
    __metadata("design:type", Number)
], PolarCrossLineLabel.prototype, "padding", void 0);
__decorate([
    Validate$t(OPT_COLOR_STRING$d),
    __metadata("design:type", String)
], PolarCrossLineLabel.prototype, "color", void 0);
__decorate([
    Validate$t(OPT_BOOLEAN$3),
    __metadata("design:type", Boolean)
], PolarCrossLineLabel.prototype, "parallel", void 0);
class PolarCrossLine {
    constructor() {
        this.id = createId$1(this);
        this.enabled = undefined;
        this.type = undefined;
        this.range = undefined;
        this.value = undefined;
        this.fill = undefined;
        this.fillOpacity = undefined;
        this.stroke = undefined;
        this.strokeWidth = undefined;
        this.strokeOpacity = undefined;
        this.lineDash = undefined;
        this.shape = 'polygon';
        this.label = new PolarCrossLineLabel();
        this.scale = undefined;
        this.clippedRange = [-Infinity, Infinity];
        this.gridLength = 0;
        this.sideFlag = -1;
        this.parallelFlipRotation = 0;
        this.regularFlipRotation = 0;
        this.direction = ChartAxisDirection$f.X;
        this.axisInnerRadius = 0;
        this.axisOuterRadius = 0;
        this.group = new Group$7({ name: `${this.id}`, layer: true, zIndex: PolarCrossLine.LINE_LAYER_ZINDEX });
    }
    calculatePadding() { }
    setLabelNodeProps(node, x, y, baseline, rotation) {
        const { label } = this;
        node.x = x;
        node.y = y;
        node.text = label.text;
        node.textAlign = 'center';
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
        return undefined;
    }
}
PolarCrossLine.LINE_LAYER_ZINDEX = Layers$3.SERIES_CROSSLINE_LINE_ZINDEX;
PolarCrossLine.RANGE_LAYER_ZINDEX = Layers$3.SERIES_CROSSLINE_RANGE_ZINDEX;
__decorate([
    Validate$t(OPT_BOOLEAN$3),
    __metadata("design:type", Boolean)
], PolarCrossLine.prototype, "enabled", void 0);
__decorate([
    Validate$t(OPT_CROSSLINE_TYPE),
    __metadata("design:type", String)
], PolarCrossLine.prototype, "type", void 0);
__decorate([
    Validate$t(OPT_ARRAY(2)),
    __metadata("design:type", Array)
], PolarCrossLine.prototype, "range", void 0);
__decorate([
    Validate$t(OPT_COLOR_STRING$d),
    __metadata("design:type", String)
], PolarCrossLine.prototype, "fill", void 0);
__decorate([
    Validate$t(OPT_NUMBER$f(0, 1)),
    __metadata("design:type", Number)
], PolarCrossLine.prototype, "fillOpacity", void 0);
__decorate([
    Validate$t(OPT_COLOR_STRING$d),
    __metadata("design:type", String)
], PolarCrossLine.prototype, "stroke", void 0);
__decorate([
    Validate$t(OPT_NUMBER$f()),
    __metadata("design:type", Number)
], PolarCrossLine.prototype, "strokeWidth", void 0);
__decorate([
    Validate$t(OPT_NUMBER$f(0, 1)),
    __metadata("design:type", Number)
], PolarCrossLine.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$t(OPT_LINE_DASH$9),
    __metadata("design:type", Array)
], PolarCrossLine.prototype, "lineDash", void 0);

const { ChartAxisDirection: ChartAxisDirection$e } = agChartsCommunity._ModuleSupport;
const { Path: Path$6, Sector: Sector$4, Text: Text$7 } = agChartsCommunity._Scene;
const { normalizeAngle360: normalizeAngle360$5, isNumberEqual: isNumberEqual$8 } = agChartsCommunity._Util;
class AngleCrossLine extends PolarCrossLine {
    constructor() {
        super();
        this.direction = ChartAxisDirection$e.X;
        this.polygonNode = new Path$6();
        this.sectorNode = new Sector$4();
        this.lineNode = new Path$6();
        this.labelNode = new Text$7();
        this.group.append(this.polygonNode);
        this.group.append(this.sectorNode);
        this.group.append(this.lineNode);
        this.group.append(this.labelNode);
    }
    update(visible) {
        this.updateLineNode(visible);
        this.updatePolygonNode(visible);
        this.updateSectorNode(visible);
        this.updateLabelNode(visible);
    }
    updateLineNode(visible) {
        var _a, _b;
        const { scale, type, value, lineNode: line } = this;
        let angle;
        if (!visible || type !== 'line' || !scale || isNaN((angle = scale.convert(value)))) {
            line.visible = false;
            return;
        }
        const { axisInnerRadius, axisOuterRadius } = this;
        line.visible = true;
        line.stroke = this.stroke;
        line.strokeOpacity = (_a = this.strokeOpacity) !== null && _a !== void 0 ? _a : 1;
        line.strokeWidth = (_b = this.strokeWidth) !== null && _b !== void 0 ? _b : 1;
        line.fill = undefined;
        line.lineDash = this.lineDash;
        const x = axisOuterRadius * Math.cos(angle);
        const y = axisOuterRadius * Math.sin(angle);
        const x0 = axisInnerRadius * Math.cos(angle);
        const y0 = axisInnerRadius * Math.sin(angle);
        line.path.clear({ trackChanges: true });
        line.path.moveTo(x0, y0);
        line.path.lineTo(x, y);
        this.group.zIndex = AngleCrossLine.LINE_LAYER_ZINDEX;
    }
    updateFill(area) {
        var _a, _b, _c;
        area.fill = this.fill;
        area.fillOpacity = (_a = this.fillOpacity) !== null && _a !== void 0 ? _a : 1;
        area.stroke = this.stroke;
        area.strokeOpacity = (_b = this.strokeOpacity) !== null && _b !== void 0 ? _b : 1;
        area.strokeWidth = (_c = this.strokeWidth) !== null && _c !== void 0 ? _c : 1;
        area.lineDash = this.lineDash;
    }
    updatePolygonNode(visible) {
        var _a;
        const { polygonNode: polygon, range, scale, shape, type } = this;
        let ticks;
        if (!visible || type !== 'range' || shape !== 'polygon' || !scale || !range || !(ticks = (_a = scale.ticks) === null || _a === void 0 ? void 0 : _a.call(scale))) {
            polygon.visible = false;
            return;
        }
        const { axisInnerRadius, axisOuterRadius } = this;
        const startIndex = ticks.indexOf(range[0]);
        const endIndex = ticks.indexOf(range[1]);
        const stops = startIndex <= endIndex
            ? ticks.slice(startIndex, endIndex + 1)
            : ticks.slice(startIndex).concat(ticks.slice(0, endIndex + 1));
        const angles = stops.map((value) => scale.convert(value));
        polygon.visible = true;
        this.updateFill(polygon);
        const { path } = polygon;
        path.clear({ trackChanges: true });
        angles.forEach((angle, index) => {
            const x = axisOuterRadius * Math.cos(angle);
            const y = axisOuterRadius * Math.sin(angle);
            if (index === 0) {
                path.moveTo(x, y);
            }
            else {
                path.lineTo(x, y);
            }
        });
        if (axisInnerRadius === 0) {
            path.lineTo(0, 0);
        }
        else {
            angles
                .slice()
                .reverse()
                .forEach((angle) => {
                const x = axisInnerRadius * Math.cos(angle);
                const y = axisInnerRadius * Math.sin(angle);
                path.lineTo(x, y);
            });
        }
        polygon.path.closePath();
        this.group.zIndex = AngleCrossLine.RANGE_LAYER_ZINDEX;
    }
    updateSectorNode(visible) {
        const { sectorNode: sector, range, scale, shape, type } = this;
        if (!visible || type !== 'range' || shape !== 'circle' || !scale || !range) {
            sector.visible = false;
            return;
        }
        const { axisInnerRadius, axisOuterRadius } = this;
        const angles = range.map((value) => scale.convert(value));
        sector.visible = true;
        this.updateFill(sector);
        sector.centerX = 0;
        sector.centerY = 0;
        sector.innerRadius = axisInnerRadius;
        sector.outerRadius = axisOuterRadius;
        sector.startAngle = angles[0];
        sector.endAngle = angles[1];
        this.group.zIndex = AngleCrossLine.RANGE_LAYER_ZINDEX;
    }
    updateLabelNode(visible) {
        var _a, _b;
        const { label, labelNode: node, range, scale, type } = this;
        if (!visible || label.enabled === false || !label.text || !scale || (type === 'range' && !range)) {
            node.visible = true;
            return;
        }
        const { axisInnerRadius, axisOuterRadius } = this;
        let labelX;
        let labelY;
        let rotation;
        let textBaseline;
        if (type === 'line') {
            const angle = normalizeAngle360$5(scale.convert(this.value));
            const angle270 = (3 * Math.PI) / 2;
            const isRightSide = isNumberEqual$8(angle, angle270) || angle > angle270 || angle < Math.PI / 2;
            const midX = ((axisInnerRadius + axisOuterRadius) / 2) * Math.cos(angle);
            const midY = ((axisInnerRadius + axisOuterRadius) / 2) * Math.sin(angle);
            labelX = midX + label.padding * Math.cos(angle + Math.PI / 2);
            labelY = midY + label.padding * Math.sin(angle + Math.PI / 2);
            textBaseline = isRightSide ? 'top' : 'bottom';
            rotation = isRightSide ? angle : angle - Math.PI;
        }
        else {
            const [startAngle, endAngle] = range.map((value) => normalizeAngle360$5(scale.convert(value)));
            let angle = (startAngle + endAngle) / 2;
            if (startAngle > endAngle) {
                angle -= Math.PI;
            }
            angle = normalizeAngle360$5(angle);
            const isBottomSide = (isNumberEqual$8(angle, 0) || angle > 0) && angle < Math.PI;
            let distance;
            const ticks = (_b = (_a = scale.ticks) === null || _a === void 0 ? void 0 : _a.call(scale)) !== null && _b !== void 0 ? _b : [];
            if (this.shape === 'circle' || ticks.length < 3) {
                distance = axisOuterRadius - label.padding;
            }
            else {
                distance = axisOuterRadius * Math.cos(Math.PI / ticks.length) - label.padding;
            }
            labelX = distance * Math.cos(angle);
            labelY = distance * Math.sin(angle);
            textBaseline = isBottomSide ? 'bottom' : 'top';
            rotation = isBottomSide ? angle - Math.PI / 2 : angle + Math.PI / 2;
        }
        this.setLabelNodeProps(node, labelX, labelY, textBaseline, rotation);
    }
}
AngleCrossLine.className = 'AngleCrossLine';

const { AND: AND$4, assignJsonApplyConstructedArray: assignJsonApplyConstructedArray$1, ChartAxisDirection: ChartAxisDirection$d, GREATER_THAN: GREATER_THAN$3, NUMBER: NUMBER$k, OPT_NUMBER: OPT_NUMBER$e, predicateWithMessage, ProxyOnWrite, Validate: Validate$s, } = agChartsCommunity._ModuleSupport;
const { Path: Path$5, Text: Text$6 } = agChartsCommunity._Scene;
const { angleBetween: angleBetween$3, isNumberEqual: isNumberEqual$7, toRadians: toRadians$2, normalizeAngle360: normalizeAngle360$4 } = agChartsCommunity._Util;
const ANGLE_LABEL_ORIENTATIONS = ['fixed', 'parallel', 'perpendicular'];
const ANGLE_LABEL_ORIENTATION = predicateWithMessage((v) => ANGLE_LABEL_ORIENTATIONS.includes(v), `expecting a label orientation keyword such as 'fixed', 'parallel' or 'perpendicular'`);
class AngleAxisLabel extends agChartsCommunity._ModuleSupport.AxisLabel {
    constructor() {
        super(...arguments);
        this.orientation = 'fixed';
    }
}
__decorate([
    Validate$s(ANGLE_LABEL_ORIENTATION),
    __metadata("design:type", String)
], AngleAxisLabel.prototype, "orientation", void 0);
class AngleAxis extends agChartsCommunity._ModuleSupport.PolarAxis {
    constructor(moduleCtx, scale) {
        super(moduleCtx, scale);
        this.startAngle = 0;
        this.endAngle = undefined;
        this.labelData = [];
        this.tickData = [];
        this.radiusLine = this.axisGroup.appendChild(new Path$5());
        this.computeRange = () => {
            const startAngle = normalizeAngle360$4(-Math.PI / 2 + toRadians$2(this.startAngle));
            let endAngle = this.endAngle == null ? startAngle + Math.PI * 2 : -Math.PI / 2 + toRadians$2(this.endAngle);
            if (endAngle < startAngle) {
                endAngle += 2 * Math.PI;
            }
            this.range = [startAngle, endAngle];
        };
        this.includeInvisibleDomains = true;
    }
    get direction() {
        return ChartAxisDirection$d.X;
    }
    assignCrossLineArrayConstructor(crossLines) {
        assignJsonApplyConstructedArray$1(crossLines, AngleCrossLine);
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
        const { range, gridLength: radius } = this;
        return angleBetween$3(range[0], range[1]) * radius;
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
        var _a;
        const { scale, shape } = this;
        const node = this.radiusLine;
        const radius = this.gridLength;
        const [startAngle, endAngle] = this.range;
        const isFullCircle = isNumberEqual$7(endAngle - startAngle, 2 * Math.PI);
        const { path } = node;
        path.clear({ trackChanges: true });
        if (shape === 'circle') {
            if (isFullCircle) {
                path.moveTo(radius, 0);
                path.arc(0, 0, radius, 0, 2 * Math.PI);
            }
            else {
                path.moveTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
                path.arc(0, 0, radius, normalizeAngle360$4(startAngle), normalizeAngle360$4(endAngle));
            }
        }
        else if (shape === 'polygon') {
            const angles = (((_a = scale.ticks) === null || _a === void 0 ? void 0 : _a.call(scale)) || []).map((value) => scale.convert(value));
            if (angles.length > 2) {
                angles.forEach((angle, i) => {
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    if (i === 0) {
                        path.moveTo(x, y);
                    }
                    else {
                        path.lineTo(x, y);
                    }
                });
            }
        }
        if (isFullCircle) {
            path.closePath();
        }
        node.stroke = this.line.color;
        node.strokeWidth = this.line.width;
        node.fill = undefined;
    }
    updateGridLines() {
        const { scale, gridLength: radius, gridLine: { enabled, style, width }, innerRadiusRatio, } = this;
        if (!(style && radius > 0)) {
            return;
        }
        const ticks = this.tickData;
        const innerRadius = radius * innerRadiusRatio;
        const styleCount = style.length;
        const idFn = (datum) => datum.value;
        this.gridLineGroupSelection.update(enabled ? ticks : [], undefined, idFn).each((line, datum, index) => {
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
            line.fill = undefined;
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
            }
            else {
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
        const tempText = new Text$6();
        const seriesLeft = seriesRect.x - this.translation.x;
        const seriesRight = seriesRect.x + seriesRect.width - this.translation.x;
        const labelData = ticks.map((datum, index) => {
            var _a;
            const { value } = datum;
            const distance = radius + label.padding + tick.size;
            const angle = scale.convert(value);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = distance * cos;
            const y = distance * sin;
            const { textAlign, textBaseline } = this.getLabelAlign(angle);
            // Hide the last tick when it appears over the first
            const isLastTickOverFirst = index === ticks.length - 1 &&
                value !== ticks[0] &&
                isNumberEqual$7(normalizeAngle360$4(angle), normalizeAngle360$4(scale.convert(ticks[0])));
            const rotation = this.getLabelRotation(angle);
            let text = String(value);
            if (label.formatter) {
                const { callbackCache } = this.moduleCtx;
                text = (_a = callbackCache.call(label.formatter, { value, index })) !== null && _a !== void 0 ? _a : '';
            }
            tempText.text = text;
            tempText.x = x;
            tempText.y = y;
            tempText.setFont(label);
            tempText.textAlign = textAlign;
            tempText.textBaseline = textBaseline;
            tempText.rotation = rotation;
            if (rotation) {
                tempText.rotationCenterX = x;
                tempText.rotationCenterY = y;
            }
            let box = rotation ? tempText.computeTransformedBBox() : tempText.computeBBox();
            if (box && options.hideWhenNecessary && !rotation) {
                const overflowLeft = seriesLeft - box.x;
                const overflowRight = box.x + box.width - seriesRight;
                const pixelError = 1;
                if (overflowLeft > pixelError || overflowRight > pixelError) {
                    const availWidth = box.width - Math.max(overflowLeft, overflowRight);
                    text = Text$6.wrap(text, availWidth, Infinity, label, 'never');
                    if (text === '\u2026') {
                        text = '';
                        box = undefined;
                    }
                    tempText.text = text;
                    box = tempText.computeBBox();
                }
            }
            return {
                text,
                x,
                y,
                textAlign,
                textBaseline,
                hidden: text === '' || datum.hidden || isLastTickOverFirst,
                rotation,
                box,
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
        return agChartsCommunity._Scene.BBox.merge(textBoxes);
    }
    getLabelOrientation() {
        const { label } = this;
        return label instanceof AngleAxisLabel ? label.orientation : 'fixed';
    }
    getLabelRotation(tickAngle) {
        var _a;
        let rotation = toRadians$2((_a = this.label.rotation) !== null && _a !== void 0 ? _a : 0);
        tickAngle = normalizeAngle360$4(tickAngle);
        const orientation = this.getLabelOrientation();
        if (orientation === 'parallel') {
            rotation += tickAngle;
            if (tickAngle >= 0 && tickAngle < Math.PI) {
                rotation -= Math.PI / 2;
            }
            else {
                rotation += Math.PI / 2;
            }
        }
        else if (orientation === 'perpendicular') {
            rotation += tickAngle;
            if (tickAngle >= Math.PI / 2 && tickAngle < (3 * Math.PI) / 2) {
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
        const isCos0 = isNumberEqual$7(cos, 0);
        const isSin0 = isNumberEqual$7(sin, 0);
        const isCos1 = isNumberEqual$7(cos, 1);
        const isSinMinus1 = isNumberEqual$7(sin, -1);
        const isCosPositive = cos > 0 && !isCos0;
        const isSinPositive = sin > 0 && !isSin0;
        if (orientation === 'parallel') {
            textAlign = 'center';
            textBaseline = (isCos1 && isSin0) || isSinPositive ? 'top' : 'bottom';
        }
        else if (orientation === 'perpendicular') {
            textAlign = isSinMinus1 || isCosPositive ? 'left' : 'right';
            textBaseline = 'middle';
        }
        else {
            textAlign = isCos0 ? 'center' : isCosPositive ? 'left' : 'right';
            textBaseline = isSin0 ? 'middle' : isSinPositive ? 'top' : 'bottom';
        }
        return { textAlign, textBaseline };
    }
    updateCrossLines() {
        var _a;
        (_a = this.crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => {
            if (crossLine instanceof AngleCrossLine) {
                const { shape, gridLength: radius, innerRadiusRatio } = this;
                crossLine.shape = shape;
                crossLine.axisOuterRadius = radius;
                crossLine.axisInnerRadius = radius * innerRadiusRatio;
            }
        });
        super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0 });
    }
}
__decorate([
    ProxyOnWrite('rotation'),
    Validate$s(NUMBER$k(0, 360)),
    __metadata("design:type", Number)
], AngleAxis.prototype, "startAngle", void 0);
__decorate([
    Validate$s(AND$4(OPT_NUMBER$e(0, 720), GREATER_THAN$3('startAngle'))),
    __metadata("design:type", Object)
], AngleAxis.prototype, "endAngle", void 0);

const { NUMBER: NUMBER$j, Validate: Validate$r } = agChartsCommunity._ModuleSupport;
const { BandScale: BandScale$4 } = agChartsCommunity._Scale;
const { isNumberEqual: isNumberEqual$6 } = agChartsCommunity._Util;
class AngleCategoryAxis extends AngleAxis {
    constructor(moduleCtx) {
        super(moduleCtx, new BandScale$4());
        this.groupPaddingInner = 0;
        this.paddingInner = 0;
    }
    generateAngleTicks() {
        var _a, _b;
        const { scale, tick, gridLength: radius } = this;
        const ticks = (_b = (_a = tick.values) !== null && _a !== void 0 ? _a : scale.ticks()) !== null && _b !== void 0 ? _b : [];
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
                // The tick spacing will not grow on the next step
                break;
            }
            const nextX = radius * Math.cos(nextAngle);
            const nextY = radius * Math.sin(nextAngle);
            const spacing = Math.sqrt(Math.pow((nextX - startX), 2) + Math.pow((nextY - startY), 2));
            if (spacing > tick.minSpacing) {
                // Filter ticks by step
                const visibleTicks = new Set([startTick]);
                loopSymmetrically(ticks, step, (_, next) => {
                    visibleTicks.add(next);
                });
                return ticks.map((value) => {
                    const visible = visibleTicks.has(value);
                    return { value, visible };
                });
            }
        }
        // If there is no matching step, return a single tick
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
        const lastLabel = labelData[labelData.length - 1];
        const visibleLabels = new Set([firstLabel]);
        const lastLabelIsOverFirst = isNumberEqual$6(firstLabel.x, lastLabel.x) && isNumberEqual$6(firstLabel.y, lastLabel.y);
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
                datum.box = undefined;
            }
        });
    }
}
AngleCategoryAxis.className = 'AngleCategoryAxis';
AngleCategoryAxis.type = 'angle-category';
__decorate([
    Validate$r(NUMBER$j(0, 1)),
    __metadata("design:type", Number)
], AngleCategoryAxis.prototype, "groupPaddingInner", void 0);
__decorate([
    Validate$r(NUMBER$j(0, 1)),
    __metadata("design:type", Number)
], AngleCategoryAxis.prototype, "paddingInner", void 0);

const AngleCategoryAxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'angle-category',
    instanceConstructor: AngleCategoryAxis,
    themeTemplate: ANGLE_AXIS_THEME,
};

const { LinearScale: LinearScale$1 } = agChartsCommunity._Scale;
const { isNumberEqual: isNumberEqual$5, range } = agChartsCommunity._Util;
class LinearAngleScale extends LinearScale$1 {
    constructor() {
        super(...arguments);
        this.arcLength = 0;
        this.niceTickStep = 0;
        this.cacheProps = [
            'domain',
            'range',
            'nice',
            'tickCount',
            'minTickCount',
            'maxTickCount',
            'arcLength',
        ];
    }
    ticks() {
        if (!this.domain || this.domain.length < 2 || this.domain.some((d) => !isFinite(d))) {
            return [];
        }
        this.refresh();
        const [d0, d1] = this.getDomain();
        const { interval } = this;
        if (interval) {
            const step = Math.abs(interval);
            if (!this.isDenseInterval({ start: d0, stop: d1, interval: step })) {
                return range(d0, d1, step);
            }
        }
        const step = this.nice && this.niceTickStep ? this.niceTickStep : this.getTickStep(d0, d1);
        return range(d0, d1, step);
    }
    hasNiceRange() {
        const range = this.range.slice().sort((a, b) => a - b);
        const niceRanges = [Math.PI, 2 * Math.PI];
        return niceRanges.some((r) => isNumberEqual$5(r, range[1] - range[0]));
    }
    getNiceStepAndTickCount() {
        const [start, stop] = this.niceDomain;
        let step = this.getTickStep(start, stop);
        const maxTickCount = isNaN(this.maxTickCount) ? Infinity : this.maxTickCount;
        const expectedTickCount = (stop - start) / step;
        let niceTickCount = Math.pow(2, Math.ceil(Math.log(expectedTickCount) / Math.log(2)));
        if (niceTickCount > maxTickCount) {
            niceTickCount /= 2;
            step *= 2;
        }
        return {
            count: niceTickCount,
            step,
        };
    }
    updateNiceDomain() {
        super.updateNiceDomain();
        if (!this.hasNiceRange()) {
            return;
        }
        const start = this.niceDomain[0];
        const { step, count } = this.getNiceStepAndTickCount();
        const s = 1 / step; // Prevent floating point error
        const stop = step >= 1 ? Math.ceil(start / step + count) * step : Math.ceil((start + count * step) * s) / s;
        this.niceDomain = [start, stop];
        this.niceTickStep = step;
    }
    getPixelRange() {
        return this.arcLength;
    }
}

const { AND: AND$3, Default: Default$2, GREATER_THAN: GREATER_THAN$2, LESS_THAN: LESS_THAN$1, NUMBER_OR_NAN: NUMBER_OR_NAN$2, Validate: Validate$q } = agChartsCommunity._ModuleSupport;
const { angleBetween: angleBetween$2, isNumberEqual: isNumberEqual$4, normalisedExtentWithMetadata: normalisedExtentWithMetadata$1 } = agChartsCommunity._Util;
class AngleNumberAxisTick extends agChartsCommunity._ModuleSupport.AxisTick {
    constructor() {
        super(...arguments);
        this.maxSpacing = NaN;
    }
}
__decorate([
    Validate$q(AND$3(NUMBER_OR_NAN$2(1), GREATER_THAN$2('minSpacing'))),
    Default$2(NaN),
    __metadata("design:type", Number)
], AngleNumberAxisTick.prototype, "maxSpacing", void 0);
class AngleNumberAxis extends AngleAxis {
    constructor(moduleCtx) {
        super(moduleCtx, new LinearAngleScale());
        this.shape = 'circle';
        this.min = NaN;
        this.max = NaN;
    }
    normaliseDataDomain(d) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata$1(d, min, max);
        return { domain: extent, clipped };
    }
    createTick() {
        return new AngleNumberAxisTick();
    }
    getRangeArcLength() {
        const { range: requestedRange } = this;
        const min = Math.min(...requestedRange);
        const max = Math.max(...requestedRange);
        const rotation = angleBetween$2(min, max) || 2 * Math.PI;
        const radius = this.gridLength;
        return rotation * radius;
    }
    generateAngleTicks() {
        var _a;
        const arcLength = this.getRangeArcLength();
        const { scale, tick, range: requestedRange } = this;
        const { minSpacing = NaN, maxSpacing = NaN } = tick;
        const minTicksCount = maxSpacing ? Math.floor(arcLength / maxSpacing) : 1;
        const maxTicksCount = minSpacing ? Math.floor(arcLength / minSpacing) : Infinity;
        const preferredTicksCount = Math.floor((4 / Math.PI) * Math.abs(requestedRange[0] - requestedRange[1]));
        scale.tickCount = Math.max(minTicksCount, Math.min(maxTicksCount, preferredTicksCount));
        scale.minTickCount = minTicksCount;
        scale.maxTickCount = maxTicksCount;
        scale.arcLength = arcLength;
        const ticks = (_a = tick.values) !== null && _a !== void 0 ? _a : scale.ticks();
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
        const lastLabel = labelData[labelData.length - 1];
        if (firstLabel !== lastLabel &&
            isNumberEqual$4(firstLabel.x, lastLabel.x) &&
            isNumberEqual$4(firstLabel.y, lastLabel.y)) {
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
                        datum.box = undefined;
                    }
                });
                return;
            }
        }
        labelData.forEach((datum, i) => {
            if (i > 0) {
                datum.hidden = true;
                datum.box = undefined;
            }
        });
    }
}
AngleNumberAxis.className = 'AngleNumberAxis';
AngleNumberAxis.type = 'angle-number';
__decorate([
    Validate$q(AND$3(NUMBER_OR_NAN$2(), LESS_THAN$1('max'))),
    Default$2(NaN),
    __metadata("design:type", Number)
], AngleNumberAxis.prototype, "min", void 0);
__decorate([
    Validate$q(AND$3(NUMBER_OR_NAN$2(), GREATER_THAN$2('min'))),
    Default$2(NaN),
    __metadata("design:type", Number)
], AngleNumberAxis.prototype, "max", void 0);

const AngleNumberAxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'angle-number',
    instanceConstructor: AngleNumberAxis,
    themeTemplate: ANGLE_AXIS_THEME,
};

const RADIUS_AXIS_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_AXES_DEFAULTS,
    line: {
        enabled: false,
        __extends__: agChartsCommunity._Theme.EXTENDS_AXES_LINE_DEFAULTS,
    },
    tick: {
        enabled: false,
        __extends__: agChartsCommunity._Theme.EXTENDS_AXES_TICK_DEFAULTS,
    },
};

const { ChartAxisDirection: ChartAxisDirection$c, Validate: Validate$p, OPT_NUMBER: OPT_NUMBER$d } = agChartsCommunity._ModuleSupport;
const { Path: Path$4, Sector: Sector$3, Text: Text$5 } = agChartsCommunity._Scene;
const { normalizeAngle360: normalizeAngle360$3, toRadians: toRadians$1, isNumberEqual: isNumberEqual$3 } = agChartsCommunity._Util;
class RadiusCrossLineLabel extends PolarCrossLineLabel {
    constructor() {
        super(...arguments);
        this.positionAngle = undefined;
    }
}
__decorate([
    Validate$p(OPT_NUMBER$d(-360, 360)),
    __metadata("design:type", Number)
], RadiusCrossLineLabel.prototype, "positionAngle", void 0);
class RadiusCrossLine extends PolarCrossLine {
    constructor() {
        super();
        this.direction = ChartAxisDirection$c.Y;
        this.label = new RadiusCrossLineLabel();
        this.polygonNode = new Path$4();
        this.sectorNode = new Sector$3();
        this.labelNode = new Text$5();
        this.group.append(this.polygonNode);
        this.group.append(this.sectorNode);
        this.group.append(this.labelNode);
    }
    update(visible) {
        const { innerRadius, outerRadius } = this.getRadii();
        visible && (visible = innerRadius >= this.axisInnerRadius && outerRadius <= this.axisOuterRadius);
        this.updatePolygonNode(visible);
        this.updateSectorNode(visible);
        this.updateLabelNode(visible);
        this.group.zIndex =
            this.type === 'line' ? RadiusCrossLine.LINE_LAYER_ZINDEX : RadiusCrossLine.RANGE_LAYER_ZINDEX;
    }
    colorizeNode(node) {
        var _a, _b, _c;
        if (this.type === 'range') {
            node.fill = this.fill;
            node.fillOpacity = (_a = this.fillOpacity) !== null && _a !== void 0 ? _a : 1;
        }
        else {
            node.fill = undefined;
        }
        node.stroke = this.stroke;
        node.strokeOpacity = (_b = this.strokeOpacity) !== null && _b !== void 0 ? _b : 1;
        node.strokeWidth = (_c = this.strokeWidth) !== null && _c !== void 0 ? _c : 1;
        node.lineDash = this.lineDash;
    }
    getRadii() {
        const { range, scale, type, axisInnerRadius, axisOuterRadius } = this;
        const getRadius = (value) => axisOuterRadius + axisInnerRadius - scale.convert(value);
        const outerRadius = getRadius(type === 'line' ? this.value : Math.max(...range));
        const innerRadius = type === 'line' ? 0 : getRadius(Math.min(...range));
        return { innerRadius, outerRadius };
    }
    drawPolygon(radius, angles, polygon) {
        angles.forEach((angle, index) => {
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            if (index === 0) {
                polygon.path.moveTo(x, y);
            }
            else {
                polygon.path.lineTo(x, y);
            }
        });
        polygon.path.closePath();
    }
    updatePolygonNode(visible) {
        const { gridAngles, polygonNode: polygon, range, scale, shape, type } = this;
        if (!visible || shape !== 'polygon' || !scale || !gridAngles || (type === 'range' && !range)) {
            polygon.visible = false;
            return;
        }
        const { innerRadius, outerRadius } = this.getRadii();
        polygon.visible = true;
        polygon.path.clear({ trackChanges: true });
        this.drawPolygon(outerRadius, gridAngles, polygon);
        if (type === 'range') {
            const reversedAngles = gridAngles.slice().reverse();
            this.drawPolygon(innerRadius, reversedAngles, polygon);
        }
        this.colorizeNode(polygon);
    }
    updateSectorNode(visible) {
        const { gridAngles, range, scale, sectorNode: sector, shape, type } = this;
        if (!visible || shape !== 'circle' || !scale || !gridAngles || (type === 'range' && !range)) {
            sector.visible = false;
            return;
        }
        const { innerRadius, outerRadius } = this.getRadii();
        sector.visible = true;
        sector.startAngle = 0;
        sector.endAngle = 2 * Math.PI;
        sector.innerRadius = innerRadius;
        sector.outerRadius = outerRadius;
        this.colorizeNode(sector);
    }
    updateLabelNode(visible) {
        var _a, _b, _c;
        const { label, labelNode: node, range, scale, type } = this;
        if (!visible || label.enabled === false || !label.text || !scale || (type === 'range' && !range)) {
            node.visible = false;
            return;
        }
        const fullRadius = (_a = scale === null || scale === void 0 ? void 0 : scale.range[0]) !== null && _a !== void 0 ? _a : 0;
        const radius = fullRadius - scale.convert(type === 'line' ? this.value : Math.max(...range));
        const angle = normalizeAngle360$3(toRadians$1(((_b = label.positionAngle) !== null && _b !== void 0 ? _b : 0) - 90));
        const isBottomSide = (isNumberEqual$3(angle, 0) || angle > 0) && angle < Math.PI;
        const rotation = isBottomSide ? angle - Math.PI / 2 : angle + Math.PI / 2;
        let distance;
        const angles = (_c = this.gridAngles) !== null && _c !== void 0 ? _c : [];
        if (type === 'line') {
            distance = radius + label.padding;
        }
        else if (this.shape === 'circle' || angles.length < 3) {
            distance = radius - label.padding;
        }
        else {
            distance = radius * Math.cos(Math.PI / angles.length) - label.padding;
        }
        const labelX = distance * Math.cos(angle);
        const labelY = distance * Math.sin(angle);
        let textBaseline;
        if (type === 'line') {
            textBaseline = isBottomSide ? 'top' : 'bottom';
        }
        else {
            textBaseline = isBottomSide ? 'bottom' : 'top';
        }
        this.setLabelNodeProps(node, labelX, labelY, textBaseline, rotation);
    }
}
RadiusCrossLine.className = 'RadiusCrossLine';

const { AND: AND$2, assignJsonApplyConstructedArray, ChartAxisDirection: ChartAxisDirection$b, Default: Default$1, GREATER_THAN: GREATER_THAN$1, Layers: Layers$2, NUMBER: NUMBER$i, NUMBER_OR_NAN: NUMBER_OR_NAN$1, OPT_BOOLEAN: OPT_BOOLEAN$2, Validate: Validate$o, } = agChartsCommunity._ModuleSupport;
const { Caption, Group: Group$6, Path: Path$3, Selection: Selection$5 } = agChartsCommunity._Scene;
const { isNumberEqual: isNumberEqual$2, normalizeAngle360: normalizeAngle360$2, toRadians } = agChartsCommunity._Util;
class RadiusAxisTick extends agChartsCommunity._ModuleSupport.AxisTick {
    constructor() {
        super(...arguments);
        this.maxSpacing = NaN;
    }
}
__decorate([
    Validate$o(AND$2(NUMBER_OR_NAN$1(1), GREATER_THAN$1('minSpacing'))),
    Default$1(NaN),
    __metadata("design:type", Number)
], RadiusAxisTick.prototype, "maxSpacing", void 0);
class RadiusAxisLabel extends agChartsCommunity._ModuleSupport.AxisLabel {
    constructor() {
        super(...arguments);
        this.autoRotateAngle = 335;
    }
}
__decorate([
    Validate$o(OPT_BOOLEAN$2),
    __metadata("design:type", Boolean)
], RadiusAxisLabel.prototype, "autoRotate", void 0);
__decorate([
    Validate$o(NUMBER$i(-360, 360)),
    __metadata("design:type", Number)
], RadiusAxisLabel.prototype, "autoRotateAngle", void 0);
class RadiusAxis extends agChartsCommunity._ModuleSupport.PolarAxis {
    constructor(moduleCtx, scale) {
        super(moduleCtx, scale);
        this.positionAngle = 0;
        this.gridPathGroup = this.gridGroup.appendChild(new Group$6({
            name: `${this.id}-gridPaths`,
            zIndex: Layers$2.AXIS_GRID_ZINDEX,
        }));
        this.gridPathSelection = Selection$5.select(this.gridPathGroup, Path$3);
    }
    get direction() {
        return ChartAxisDirection$b.Y;
    }
    assignCrossLineArrayConstructor(crossLines) {
        assignJsonApplyConstructedArray(crossLines, RadiusCrossLine);
    }
    getAxisTransform() {
        const maxRadius = this.scale.range[0];
        const { translation, positionAngle, innerRadiusRatio } = this;
        const innerRadius = maxRadius * innerRadiusRatio;
        const rotation = toRadians(positionAngle);
        return {
            translationX: translation.x,
            translationY: translation.y - maxRadius - innerRadius,
            rotation,
            rotationCenterX: 0,
            rotationCenterY: maxRadius + innerRadius,
        };
    }
    updateSelections(lineData, data, params) {
        var _a;
        super.updateSelections(lineData, data, params);
        const { gridLine: { enabled, style, width }, shape, } = this;
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
            node.fill = undefined;
        };
        const [startAngle, endAngle] = (_a = this.gridRange) !== null && _a !== void 0 ? _a : [0, 2 * Math.PI];
        const isFullCircle = isNumberEqual$2(endAngle - startAngle, 2 * Math.PI);
        const drawCircleShape = (node, value) => {
            const { path } = node;
            path.clear({ trackChanges: true });
            const radius = this.getTickRadius(value);
            if (isFullCircle) {
                path.moveTo(radius, 0);
                path.arc(0, 0, radius, 0, 2 * Math.PI);
            }
            else {
                path.moveTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
                path.arc(0, 0, radius, normalizeAngle360$2(startAngle), normalizeAngle360$2(endAngle));
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
                }
                else {
                    path.lineTo(x, y);
                }
                angles.forEach((angle, i) => {
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    if (i === 0) {
                        path.moveTo(x, y);
                    }
                    else {
                        path.lineTo(x, y);
                    }
                });
                path.closePath();
            });
            path.closePath();
        };
        this.gridPathSelection.update(enabled ? ticks : []).each((node, value, index) => {
            setStyle(node, index);
            if (shape === 'circle') {
                drawCircleShape(node, value);
            }
            else {
                drawPolygonShape(node, value);
            }
        });
    }
    updateTitle() {
        var _a;
        const identityFormatter = (params) => params.defaultValue;
        const { title, _titleCaption, range: requestedRange, moduleCtx: { callbackCache }, } = this;
        const { formatter = identityFormatter } = (_a = this.title) !== null && _a !== void 0 ? _a : {};
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
            titleNode.textAlign = 'center';
            titleNode.textBaseline = 'bottom';
            titleNode.text = callbackCache.call(formatter, this.getTitleFormatterParams());
        }
        titleNode.visible = titleVisible;
    }
    createTick() {
        return new RadiusAxisTick();
    }
    updateCrossLines() {
        var _a;
        (_a = this.crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => {
            if (crossLine instanceof RadiusCrossLine) {
                const { shape, gridAngles, range, innerRadiusRatio } = this;
                const radius = range[0];
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
}
__decorate([
    Validate$o(NUMBER$i(-360, 360)),
    Default$1(0),
    __metadata("design:type", Number)
], RadiusAxis.prototype, "positionAngle", void 0);

const { NUMBER: NUMBER$h, ProxyPropertyOnWrite, Validate: Validate$n } = agChartsCommunity._ModuleSupport;
const { BandScale: BandScale$3 } = agChartsCommunity._Scale;
class RadiusCategoryAxis extends RadiusAxis {
    constructor(moduleCtx) {
        super(moduleCtx, new BandScale$3());
        this.shape = 'circle';
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
}
RadiusCategoryAxis.className = 'RadiusCategoryAxis';
RadiusCategoryAxis.type = 'radius-category';
__decorate([
    Validate$n(NUMBER$h(0, 1)),
    __metadata("design:type", Number)
], RadiusCategoryAxis.prototype, "groupPaddingInner", void 0);
__decorate([
    ProxyPropertyOnWrite('scale', 'paddingInner'),
    Validate$n(NUMBER$h(0, 1)),
    __metadata("design:type", Number)
], RadiusCategoryAxis.prototype, "paddingInner", void 0);
__decorate([
    ProxyPropertyOnWrite('scale', 'paddingOuter'),
    Validate$n(NUMBER$h(0, 1)),
    __metadata("design:type", Number)
], RadiusCategoryAxis.prototype, "paddingOuter", void 0);

const RadiusCategoryAxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radius-category',
    instanceConstructor: RadiusCategoryAxis,
    themeTemplate: RADIUS_AXIS_THEME,
};

const { AND: AND$1, Default, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, Validate: Validate$m } = agChartsCommunity._ModuleSupport;
const { LinearScale } = agChartsCommunity._Scale;
const { normalisedExtentWithMetadata } = agChartsCommunity._Util;
class RadiusNumberAxis extends RadiusAxis {
    constructor(moduleCtx) {
        super(moduleCtx, new LinearScale());
        this.shape = 'polygon';
        this.min = NaN;
        this.max = NaN;
    }
    prepareTickData(data) {
        var _a;
        const { scale } = this;
        const domainTop = (_a = scale.getDomain) === null || _a === void 0 ? void 0 : _a.call(scale)[1];
        return data
            .filter(({ tick }) => tick !== domainTop) // Prevent outer tick being drawn behind polar line
            .sort((a, b) => b.tick - a.tick); // Apply grid styles starting from the largest arc
    }
    getTickRadius(tickDatum) {
        const { scale } = this;
        const maxRadius = scale.range[0];
        const minRadius = maxRadius * this.innerRadiusRatio;
        return maxRadius - tickDatum.translationY + minRadius;
    }
    normaliseDataDomain(d) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);
        return { domain: extent, clipped };
    }
}
RadiusNumberAxis.className = 'RadiusNumberAxis';
RadiusNumberAxis.type = 'radius-number';
__decorate([
    Validate$m(AND$1(NUMBER_OR_NAN(), LESS_THAN('max'))),
    Default(NaN),
    __metadata("design:type", Number)
], RadiusNumberAxis.prototype, "min", void 0);
__decorate([
    Validate$m(AND$1(NUMBER_OR_NAN(), GREATER_THAN('min'))),
    Default(NaN),
    __metadata("design:type", Number)
], RadiusNumberAxis.prototype, "max", void 0);

const RadiusNumberAxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radius-number',
    instanceConstructor: RadiusNumberAxis,
    themeTemplate: RADIUS_AXIS_THEME,
};

const { BOOLEAN: BOOLEAN$7, NUMBER: NUMBER$g, ActionOnSet: ActionOnSet$3, Validate: Validate$l } = agChartsCommunity._ModuleSupport;
class Animation extends agChartsCommunity._ModuleSupport.BaseModuleInstance {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.enabled = true;
        this.animationManager = ctx.animationManager;
        this.animationManager.skip(false);
    }
}
__decorate([
    ActionOnSet$3({
        newValue(value) {
            if (this.animationManager) {
                this.animationManager.skip(!value);
            }
        },
    }),
    Validate$l(BOOLEAN$7),
    __metadata("design:type", Object)
], Animation.prototype, "enabled", void 0);
__decorate([
    ActionOnSet$3({
        newValue(value) {
            if (this.animationManager) {
                this.animationManager.defaultDuration = value;
                this.animationManager.skip(value === 0);
            }
        },
    }),
    Validate$l(NUMBER$g(0)),
    __metadata("design:type", Number)
], Animation.prototype, "duration", void 0);

const AnimationModule = {
    type: 'root',
    optionsKey: 'animation',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    instanceConstructor: Animation,
    themeTemplate: {
        animation: {
            enabled: true,
        },
    },
};

const { ActionOnSet: ActionOnSet$2 } = agChartsCommunity._ModuleSupport;
class Background extends agChartsCommunity._ModuleSupport.Background {
    constructor(ctx) {
        super(ctx);
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
        this.updateService.update(agChartsCommunity._ModuleSupport.ChartUpdateType.SCENE_RENDER);
    }
}
__decorate([
    ActionOnSet$2({
        newValue(image) {
            this.node.appendChild(image.node);
            image.onload = () => this.onImageLoad();
        },
        oldValue(image) {
            this.node.removeChild(image.node);
            image.onload = undefined;
        },
    }),
    __metadata("design:type", Function)
], Background.prototype, "image", void 0);

const { Image } = agChartsCommunity._Scene;
class BackgroundImage {
    constructor() {
        this._image = document.createElement('img');
        this.loadedSynchronously = true;
        this.left = undefined;
        this.top = undefined;
        this.right = undefined;
        this.bottom = undefined;
        this.width = undefined;
        this.height = undefined;
        this.opacity = 1;
        this.containerWidth = 0;
        this.containerHeight = 0;
        this.onload = undefined;
        this.onImageLoad = () => {
            if (this.loadedSynchronously) {
                return;
            }
            this.node.visible = false; // Ensure marked dirty.
            this.performLayout(this.containerWidth, this.containerHeight);
            if (this.onload) {
                this.onload();
            }
        };
        this.node = new Image(this._image);
        this._image.onload = this.onImageLoad;
    }
    get url() {
        return this._image.src;
    }
    set url(value) {
        this._image.src = value;
        this.loadedSynchronously = this.complete;
    }
    get complete() {
        // In tests image is nodejs-canvas Image, which doesn't report its status in the 'complete' method correctly.
        return this._image.width > 0 && this._image.height > 0;
    }
    performLayout(containerWidth, containerHeight) {
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        if (!this.complete) {
            this.node.visible = false;
            return;
        }
        const position = this.calculatePosition(this._image.width, this._image.height);
        Object.assign(this.node, position);
        this.node.visible = true;
        this.node.opacity = this.opacity;
    }
    calculatePosition(naturalWidth, naturalHeight) {
        let left = this.left;
        let right = this.right;
        let width = this.width;
        let top = this.top;
        let bottom = this.bottom;
        let height = this.height;
        if (left != null) {
            if (width != null) {
                right = this.containerWidth - left + width;
            }
            else if (right != null) {
                width = this.containerWidth - left - right;
            }
        }
        else if (right != null && width != null) {
            left = this.containerWidth - right - width;
        }
        if (top != null) {
            if (height != null) {
                bottom = this.containerHeight - top - height;
            }
            else if (bottom != null) {
                height = this.containerHeight - bottom - top;
            }
        }
        else if (bottom != null && height != null) {
            top = this.containerHeight - bottom - height;
        }
        // If width and height still undetermined, derive them from natural size.
        if (width == null) {
            if (height == null) {
                width = naturalWidth;
                height = naturalHeight;
            }
            else {
                width = Math.ceil((naturalWidth * height) / naturalHeight);
            }
        }
        else if (height == null) {
            height = Math.ceil((naturalHeight * width) / naturalWidth);
        }
        if (left == null) {
            if (right == null) {
                left = Math.floor((this.containerWidth - width) / 2);
            }
            else {
                left = this.containerWidth - right - width;
            }
        }
        if (top == null) {
            if (bottom == null) {
                top = Math.floor((this.containerHeight - height) / 2);
            }
            else {
                top = this.containerHeight - height - bottom;
            }
        }
        return { x: left, y: top, width, height };
    }
}

const BackgroundModule = {
    type: 'root',
    optionsKey: 'background',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    optionConstructors: {
        'background.image': BackgroundImage,
    },
    instanceConstructor: Background,
};

const DEFAULT_CONTEXT_MENU_CLASS = 'ag-chart-context-menu';
const defaultContextMenuCss = `
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

.${DEFAULT_CONTEXT_MENU_CLASS}__item:hover {
    background: rgb(33, 150, 243, 0.1);
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item:active {
    background: rgb(33, 150, 243, 0.2);
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
`;

const { BOOLEAN: BOOLEAN$6, Validate: Validate$k } = agChartsCommunity._ModuleSupport;
const TOOLTIP_ID$1 = 'context-menu';
const PAUSE_TYPE = 'context-menu';
class ContextMenu extends agChartsCommunity._ModuleSupport.BaseModuleInstance {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.enabled = true;
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
        // Module context
        this.highlightManager = ctx.highlightManager;
        this.interactionManager = ctx.interactionManager;
        this.tooltipManager = ctx.tooltipManager;
        this.scene = ctx.scene;
        this.destroyFns.push(ctx.interactionManager.addListener('contextmenu', (event) => this.onContextMenu(event)));
        // State
        this.groups = { default: [], node: [], extra: [], extraNode: [] };
        // HTML elements
        this.canvasElement = ctx.scene.canvas.element;
        this.container = ctx.document.body;
        this.element = this.container.appendChild(ctx.document.createElement('div'));
        this.element.classList.add(DEFAULT_CONTEXT_MENU_CLASS);
        this.destroyFns.push(() => { var _a; return (_a = this.element.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.element); });
        this.coverElement = this.container.appendChild(ctx.document.createElement('div'));
        this.coverElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__cover`);
        this.hide();
        // TODO: hmmm...
        this.coverElement.onclick = () => this.hide();
        this.coverElement.oncontextmenu = (event) => {
            this.hide();
            event.preventDefault();
            this.x = event.pageX;
            this.y = event.pageY;
            this.show();
            this.reposition();
        };
        if (typeof IntersectionObserver !== 'undefined') {
            // Detect when the chart becomes invisible and hide the context menu as well.
            const observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === this.canvasElement && entry.intersectionRatio === 0) {
                        this.hide();
                    }
                }
            }, { root: this.container });
            observer.observe(this.canvasElement);
            this.intersectionObserver = observer;
        }
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                if (this.menuElement && this.element.contains(this.menuElement)) {
                    this.reposition();
                }
            });
            observer.observe(this.element, { childList: true });
            this.mutationObserver = observer;
        }
        // Global shared state
        if (ContextMenu.contextMenuDocuments.indexOf(ctx.document) < 0) {
            const styleElement = ctx.document.createElement('style');
            styleElement.innerHTML = defaultContextMenuCss;
            // Make sure the default context menu style goes before other styles so it can be overridden.
            ctx.document.head.insertBefore(styleElement, ctx.document.head.querySelector('style'));
            ContextMenu.contextMenuDocuments.push(ctx.document);
        }
        ContextMenu.registerDefaultAction({
            id: 'download',
            label: 'Download',
            action: () => {
                // TODO: chart name
                this.scene.download('chart');
            },
        });
    }
    static registerDefaultAction(action) {
        if (action.id && this.defaultActions.find(({ id }) => id === action.id)) {
            return;
        }
        this.defaultActions.push(action);
    }
    static registerNodeAction(action) {
        if (action.id && this.defaultActions.find(({ id }) => id === action.id)) {
            return;
        }
        this.nodeActions.push(action);
    }
    static enableAction(actionId) {
        this.disabledActions.delete(actionId);
    }
    static disableAction(actionId) {
        this.disabledActions.add(actionId);
    }
    onContextMenu(event) {
        if (!this.enabled)
            return;
        this.showEvent = event.sourceEvent;
        this.x = event.pageX;
        this.y = event.pageY;
        this.groups.default = [...ContextMenu.defaultActions];
        this.pickedNode = this.highlightManager.getActivePicked();
        if (this.pickedNode) {
            this.groups.node = [...ContextMenu.nodeActions];
        }
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
        var _a, _b;
        if (!this.coverElement)
            return;
        const newMenuElement = this.renderMenu();
        if (this.menuElement) {
            this.element.replaceChild(newMenuElement, this.menuElement);
        }
        else {
            this.element.appendChild(newMenuElement);
        }
        this.menuElement = newMenuElement;
        this.interactionManager.pause(PAUSE_TYPE);
        this.tooltipManager.updateTooltip(TOOLTIP_ID$1);
        this.element.style.display = 'block';
        this.coverElement.style.display = 'block';
        this.coverElement.style.left = `${(_a = this.canvasElement.parentElement) === null || _a === void 0 ? void 0 : _a.offsetLeft}px`;
        this.coverElement.style.top = `${(_b = this.canvasElement.parentElement) === null || _b === void 0 ? void 0 : _b.offsetTop}px`;
        this.coverElement.style.width = `${this.canvasElement.clientWidth}px`;
        this.coverElement.style.height = `${this.canvasElement.clientHeight}px`;
    }
    hide() {
        if (this.menuElement) {
            this.element.removeChild(this.menuElement);
            this.menuElement = undefined;
        }
        this.interactionManager.resume(PAUSE_TYPE);
        this.tooltipManager.removeTooltip(TOOLTIP_ID$1);
        this.element.style.display = 'none';
        this.coverElement.style.display = 'none';
    }
    renderMenu() {
        const menuElement = this.ctx.document.createElement('div');
        menuElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
        this.groups.default.forEach((i) => {
            const item = this.renderItem(i);
            if (item)
                menuElement.appendChild(item);
        });
        ['node', 'extra', 'extraNode'].forEach((group) => {
            if (this.groups[group].length === 0 || (['node', 'extraNode'].includes(group) && !this.pickedNode))
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
        if (item && typeof item === 'object' && item.constructor === Object) {
            return this.createActionElement(item);
        }
    }
    createDividerElement() {
        const el = this.ctx.document.createElement('div');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
        return el;
    }
    createActionElement({ id, label, action }) {
        if (id && ContextMenu.disabledActions.has(id)) {
            return this.createDisabledElement(label);
        }
        return this.createButtonElement(label, action);
    }
    createButtonElement(label, callback) {
        const el = this.ctx.document.createElement('button');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
        el.innerHTML = label;
        el.onclick = () => {
            var _a, _b, _c;
            const params = {
                event: this.showEvent,
                datum: (_a = this.pickedNode) === null || _a === void 0 ? void 0 : _a.datum,
                itemId: (_b = this.pickedNode) === null || _b === void 0 ? void 0 : _b.itemId,
                seriesId: (_c = this.pickedNode) === null || _c === void 0 ? void 0 : _c.series.id,
            };
            callback(params);
            this.hide();
        };
        return el;
    }
    createDisabledElement(label) {
        const el = this.ctx.document.createElement('button');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
        el.disabled = true;
        el.innerHTML = label;
        return el;
    }
    reposition() {
        const { x, y, ctx: { window }, } = this;
        this.element.style.top = 'unset';
        this.element.style.bottom = 'unset';
        this.element.style.left = 'unset';
        this.element.style.right = 'unset';
        if (x + this.element.offsetWidth > window.innerWidth) {
            this.element.style.right = `calc(100% - ${x - 1}px)`;
        }
        else {
            this.element.style.left = `${x + 1}px`;
        }
        if (y + this.element.offsetHeight > window.innerHeight) {
            this.element.style.bottom = `calc(100% - ${y}px - 0.5em)`;
        }
        else {
            this.element.style.top = `calc(${y}px - 0.5em)`;
        }
    }
    destroy() {
        var _a, _b;
        super.destroy();
        (_a = this.intersectionObserver) === null || _a === void 0 ? void 0 : _a.unobserve(this.canvasElement);
        (_b = this.mutationObserver) === null || _b === void 0 ? void 0 : _b.disconnect();
    }
}
// Global shared state
ContextMenu.contextMenuDocuments = [];
ContextMenu.defaultActions = [];
ContextMenu.nodeActions = [];
ContextMenu.disabledActions = new Set();
__decorate([
    Validate$k(BOOLEAN$6),
    __metadata("design:type", Object)
], ContextMenu.prototype, "enabled", void 0);

const ContextMenuModule = {
    type: 'root',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    optionsKey: 'contextMenu',
    instanceConstructor: ContextMenu,
    themeTemplate: {
        contextMenu: {
            enabled: true,
        },
    },
};

const { ActionOnSet: ActionOnSet$1, Validate: Validate$j, NUMBER: NUMBER$f, BOOLEAN: BOOLEAN$5, OPT_STRING: OPT_STRING$c, OPT_FUNCTION: OPT_FUNCTION$b } = agChartsCommunity._ModuleSupport;
const { BBox: BBox$6 } = agChartsCommunity._Scene;
const DEFAULT_LABEL_CLASS = 'ag-crosshair-label';
const defaultLabelCss = `
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
class CrosshairLabel {
    constructor(document, container) {
        this.enabled = true;
        this.className = undefined;
        this.xOffset = 0;
        this.yOffset = 0;
        this.format = undefined;
        this.renderer = undefined;
        this.labelRoot = container;
        const element = document.createElement('div');
        this.element = this.labelRoot.appendChild(element);
        this.element.classList.add(DEFAULT_LABEL_CLASS);
        if (CrosshairLabel.labelDocuments.indexOf(document) < 0) {
            const styleElement = document.createElement('style');
            styleElement.innerHTML = defaultLabelCss;
            // Make sure the default label style goes before other styles so it can be overridden.
            document.head.insertBefore(styleElement, document.head.querySelector('style'));
            CrosshairLabel.labelDocuments.push(document);
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
        if (html !== undefined) {
            this.element.innerHTML = html;
        }
    }
    computeBBox() {
        const { element } = this;
        return new agChartsCommunity._Scene.BBox(element.clientLeft, element.clientTop, element.clientWidth, element.clientHeight);
    }
    getContainerBoundingBox() {
        const { width, height } = this.labelRoot.getBoundingClientRect();
        return new BBox$6(0, 0, width, height);
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
        var _a, _b;
        if (typeof input === 'string') {
            return input;
        }
        defaults = defaults !== null && defaults !== void 0 ? defaults : {};
        const { text = (_a = defaults.text) !== null && _a !== void 0 ? _a : '', color = defaults.color, backgroundColor = defaults.backgroundColor, opacity = (_b = defaults.opacity) !== null && _b !== void 0 ? _b : 1, } = input;
        const style = `opacity: ${opacity}; background-color: ${backgroundColor === null || backgroundColor === void 0 ? void 0 : backgroundColor.toLowerCase()}; color: ${color}`;
        return `<div class="${DEFAULT_LABEL_CLASS}-content" style="${style}">
                    <span>${text}</span>
                </div>`;
    }
}
CrosshairLabel.labelDocuments = [];
__decorate([
    Validate$j(BOOLEAN$5),
    __metadata("design:type", Boolean)
], CrosshairLabel.prototype, "enabled", void 0);
__decorate([
    Validate$j(OPT_STRING$c),
    ActionOnSet$1({
        changeValue(newValue, oldValue) {
            if (newValue !== oldValue) {
                if (oldValue) {
                    this.element.classList.remove(oldValue);
                }
                if (newValue) {
                    this.element.classList.add(newValue);
                }
            }
        },
    }),
    __metadata("design:type", String)
], CrosshairLabel.prototype, "className", void 0);
__decorate([
    Validate$j(NUMBER$f()),
    __metadata("design:type", Number)
], CrosshairLabel.prototype, "xOffset", void 0);
__decorate([
    Validate$j(NUMBER$f()),
    __metadata("design:type", Number)
], CrosshairLabel.prototype, "yOffset", void 0);
__decorate([
    Validate$j(OPT_STRING$c),
    __metadata("design:type", String)
], CrosshairLabel.prototype, "format", void 0);
__decorate([
    Validate$j(OPT_FUNCTION$b),
    __metadata("design:type", Function)
], CrosshairLabel.prototype, "renderer", void 0);

const { Group: Group$5, Line, BBox: BBox$5 } = agChartsCommunity._Scene;
const { Validate: Validate$i, NUMBER: NUMBER$e, BOOLEAN: BOOLEAN$4, OPT_COLOR_STRING: OPT_COLOR_STRING$c, OPT_LINE_DASH: OPT_LINE_DASH$8, Layers: Layers$1 } = agChartsCommunity._ModuleSupport;
class Crosshair extends agChartsCommunity._ModuleSupport.BaseModuleInstance {
    constructor(ctx) {
        var _a, _b;
        super();
        this.ctx = ctx;
        this.enabled = false;
        this.stroke = 'rgb(195, 195, 195)';
        this.lineDash = [6, 3];
        this.lineDashOffset = 0;
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.snap = true;
        this.seriesRect = new BBox$5(0, 0, 0, 0);
        this.hoverRect = new BBox$5(0, 0, 0, 0);
        this.bounds = new BBox$5(0, 0, 0, 0);
        this.visible = false;
        this.crosshairGroup = new Group$5({ layer: true, zIndex: Layers$1.SERIES_CROSSHAIR_ZINDEX });
        this.lineNode = this.crosshairGroup.appendChild(new Line());
        this.activeHighlight = undefined;
        (_a = ctx.scene.root) === null || _a === void 0 ? void 0 : _a.appendChild(this.crosshairGroup);
        this.axisCtx = ctx.parent;
        this.crosshairGroup.visible = false;
        this.label = new CrosshairLabel(ctx.document, (_b = ctx.scene.canvas.container) !== null && _b !== void 0 ? _b : ctx.document.body);
        this.destroyFns.push(ctx.interactionManager.addListener('hover', (event) => this.onMouseMove(event)), ctx.interactionManager.addListener('leave', () => this.onMouseOut()), ctx.highlightManager.addListener('highlight-change', (event) => this.onHighlightChange(event)), ctx.layoutService.addListener('layout-complete', (event) => this.layout(event)), () => { var _a; return (_a = ctx.scene.root) === null || _a === void 0 ? void 0 : _a.removeChild(this.crosshairGroup); }, () => this.label.destroy());
    }
    layout({ series: { rect, paddedRect, visible }, axes }) {
        var _a;
        this.hideCrosshair();
        if (!(visible && axes && this.enabled)) {
            this.visible = false;
            return;
        }
        this.visible = true;
        this.seriesRect = rect;
        this.hoverRect = paddedRect;
        const { position: axisPosition = 'left', axisId } = this.axisCtx;
        const axisLayout = axes.find((a) => a.id === axisId);
        if (!axisLayout) {
            return;
        }
        this.axisLayout = axisLayout;
        const padding = axisLayout.gridPadding + axisLayout.seriesAreaPadding;
        this.bounds = this.buildBounds(rect, axisPosition, padding);
        const { crosshairGroup, bounds } = this;
        crosshairGroup.translationX = Math.round(bounds.x);
        crosshairGroup.translationY = Math.round(axisPosition === 'top' || axisPosition === 'bottom' ? bounds.y + bounds.height : bounds.y);
        const rotation = axisPosition === 'top' || axisPosition === 'bottom' ? -Math.PI / 2 : 0;
        crosshairGroup.rotation = rotation;
        this.updateLine();
        const format = (_a = this.label.format) !== null && _a !== void 0 ? _a : axisLayout.label.format;
        this.labelFormatter = format ? this.axisCtx.scaleValueFormatter(format) : undefined;
    }
    buildBounds(rect, axisPosition, padding) {
        const bounds = rect.clone();
        bounds.x += axisPosition === 'left' ? -padding : 0;
        bounds.y += axisPosition === 'top' ? -padding : 0;
        bounds.width += axisPosition === 'left' || axisPosition === 'right' ? padding : 0;
        bounds.height += axisPosition === 'top' || axisPosition === 'bottom' ? padding : 0;
        return bounds;
    }
    updateLine() {
        const { lineNode: line, bounds, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, axisCtx, axisLayout, } = this;
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
        line.x2 = axisCtx.direction === 'x' ? bounds.height : bounds.width;
    }
    formatValue(val) {
        var _a;
        const { labelFormatter, axisLayout, ctx: { callbackCache }, } = this;
        if (labelFormatter) {
            const result = callbackCache.call(labelFormatter, val);
            if (result !== undefined)
                return result;
        }
        const isInteger = val % 1 === 0;
        const fractionDigits = ((_a = axisLayout === null || axisLayout === void 0 ? void 0 : axisLayout.label.fractionDigits) !== null && _a !== void 0 ? _a : 0) + (isInteger ? 0 : 1);
        return typeof val === 'number' ? val.toFixed(fractionDigits) : String(val);
    }
    onMouseMove(event) {
        const { crosshairGroup, snap, seriesRect, hoverRect, axisCtx, visible, activeHighlight } = this;
        if (snap || !this.enabled) {
            return;
        }
        const { offsetX, offsetY } = event;
        if (visible && hoverRect.containsPoint(offsetX, offsetY)) {
            crosshairGroup.visible = true;
            const highlight = activeHighlight ? this.getActiveHighlight(activeHighlight) : undefined;
            let value;
            let clampedX = 0;
            let clampedY = 0;
            if (axisCtx.direction === 'x') {
                clampedX = Math.max(Math.min(seriesRect.x + seriesRect.width, offsetX), seriesRect.x);
                crosshairGroup.translationX = Math.round(clampedX);
                value = axisCtx.continuous ? axisCtx.scaleInvert(offsetX - seriesRect.x) : highlight === null || highlight === void 0 ? void 0 : highlight.value;
            }
            else {
                clampedY = Math.max(Math.min(seriesRect.y + seriesRect.height, offsetY), seriesRect.y);
                crosshairGroup.translationY = Math.round(clampedY);
                value = axisCtx.continuous ? axisCtx.scaleInvert(offsetY - seriesRect.y) : highlight === null || highlight === void 0 ? void 0 : highlight.value;
            }
            if (value && this.label.enabled) {
                this.showLabel(clampedX, clampedY, value);
            }
            else {
                this.hideLabel();
            }
        }
        else {
            this.hideCrosshair();
        }
    }
    onMouseOut() {
        this.hideLabel();
        this.hideCrosshair();
    }
    onHighlightChange(event) {
        var _a, _b;
        const { enabled, crosshairGroup, snap, seriesRect, axisCtx, visible } = this;
        if (!enabled) {
            return;
        }
        const { currentHighlight } = event;
        const hasCrosshair = (currentHighlight === null || currentHighlight === void 0 ? void 0 : currentHighlight.datum) &&
            (((_a = currentHighlight.series.axes.x) === null || _a === void 0 ? void 0 : _a.id) === axisCtx.axisId ||
                ((_b = currentHighlight.series.axes.y) === null || _b === void 0 ? void 0 : _b.id) === axisCtx.axisId);
        if (!hasCrosshair) {
            this.activeHighlight = undefined;
        }
        else {
            this.activeHighlight = currentHighlight;
        }
        if (!snap) {
            return;
        }
        if (visible && this.activeHighlight) {
            crosshairGroup.visible = true;
            const { value, position } = this.getActiveHighlight(this.activeHighlight);
            let x = 0;
            let y = 0;
            if (axisCtx.direction === 'x') {
                x = position;
                crosshairGroup.translationX = Math.round(x + seriesRect.x);
            }
            else {
                y = position;
                crosshairGroup.translationY = Math.round(y + seriesRect.y);
            }
            if (this.label.enabled) {
                this.showLabel(x + seriesRect.x, y + seriesRect.y, value);
            }
            else {
                this.hideLabel();
            }
        }
        else {
            this.hideCrosshair();
        }
    }
    getActiveHighlight(activeHighlight) {
        var _a, _b;
        const { axisCtx } = this;
        const { datum, xKey = '', yKey = '', aggregatedValue, series, cumulativeValue, midPoint } = activeHighlight;
        const halfBandwidth = axisCtx.scaleBandwidth() / 2;
        if (aggregatedValue !== undefined && ((_a = series.axes.y) === null || _a === void 0 ? void 0 : _a.id) === axisCtx.axisId) {
            return { value: aggregatedValue, position: axisCtx.scaleConvert(aggregatedValue) + halfBandwidth };
        }
        const isYValue = axisCtx.keys().indexOf(yKey) >= 0;
        if (cumulativeValue !== undefined && isYValue) {
            return { value: cumulativeValue, position: axisCtx.scaleConvert(cumulativeValue) + halfBandwidth };
        }
        const key = isYValue ? yKey : xKey;
        const position = (_b = (axisCtx.direction === 'x' ? midPoint === null || midPoint === void 0 ? void 0 : midPoint.x : midPoint === null || midPoint === void 0 ? void 0 : midPoint.y)) !== null && _b !== void 0 ? _b : 0;
        const value = axisCtx.continuous ? axisCtx.scaleInvert(position) : datum[key];
        return { value, position };
    }
    getLabelHtml(value) {
        const { label, axisLayout: { label: { fractionDigits = 0 } = {} } = {} } = this;
        const { renderer: labelRenderer } = label;
        const defaults = {
            text: this.formatValue(value),
        };
        if (labelRenderer) {
            const params = {
                value,
                fractionDigits,
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
        const { label: { padding: labelPadding }, tickSize, } = axisLayout;
        const padding = labelPadding + tickSize;
        const html = this.getLabelHtml(value);
        label.setLabelHtml(html);
        const labelBBox = label.computeBBox();
        let labelMeta;
        if (axisCtx.direction === 'x') {
            const xOffset = -labelBBox.width / 2;
            const yOffset = axisCtx.position === 'bottom' ? 0 : -labelBBox.height;
            const fixedY = axisCtx.position === 'bottom' ? bounds.y + bounds.height + padding : bounds.y - padding;
            labelMeta = {
                x: x + xOffset,
                y: fixedY + yOffset,
            };
        }
        else {
            const yOffset = -labelBBox.height / 2;
            const xOffset = axisCtx.position === 'right' ? 0 : -labelBBox.width;
            const fixedX = axisCtx.position === 'right' ? bounds.x + bounds.width + padding : bounds.x - padding;
            labelMeta = {
                x: fixedX + xOffset,
                y: y + yOffset,
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
}
__decorate([
    Validate$i(BOOLEAN$4),
    __metadata("design:type", Object)
], Crosshair.prototype, "enabled", void 0);
__decorate([
    Validate$i(OPT_COLOR_STRING$c),
    __metadata("design:type", String)
], Crosshair.prototype, "stroke", void 0);
__decorate([
    Validate$i(OPT_LINE_DASH$8),
    __metadata("design:type", Array)
], Crosshair.prototype, "lineDash", void 0);
__decorate([
    Validate$i(NUMBER$e(0)),
    __metadata("design:type", Number)
], Crosshair.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$i(NUMBER$e(0)),
    __metadata("design:type", Number)
], Crosshair.prototype, "strokeWidth", void 0);
__decorate([
    Validate$i(NUMBER$e(0, 1)),
    __metadata("design:type", Number)
], Crosshair.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$i(BOOLEAN$4),
    __metadata("design:type", Boolean)
], Crosshair.prototype, "snap", void 0);

const AXIS_CROSSHAIR_THEME = {
    crosshair: {
        enabled: true,
        snap: true,
        stroke: agChartsCommunity._Theme.DEFAULT_MUTED_LABEL_COLOUR,
        strokeWidth: 1,
        strokeOpacity: 1,
        lineDash: [5, 6],
        lineDashOffset: 0,
        label: {
            enabled: true,
        },
    },
    category: {
        crosshair: {
            enabled: false,
            snap: true,
            stroke: agChartsCommunity._Theme.DEFAULT_MUTED_LABEL_COLOUR,
            strokeWidth: 1,
            strokeOpacity: 1,
            lineDash: [5, 6],
            lineDashOffset: 0,
            label: {
                enabled: true,
            },
        },
    },
};

const CrosshairModule = {
    type: 'axis-option',
    optionsKey: 'crosshair',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    axisTypes: ['category', 'number', 'log', 'time'],
    instanceConstructor: Crosshair,
    themeTemplate: AXIS_CROSSHAIR_THEME,
};

const { partialAssign: partialAssign$1, mergeDefaults: mergeDefaults$3 } = agChartsCommunity._ModuleSupport;
const { BBox: BBox$4 } = agChartsCommunity._Scene;
class HierarchialBBox {
    constructor(components) {
        this.components = components;
        this.union = BBox$4.merge(components);
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
}
class ErrorBarNode extends agChartsCommunity._Scene.Group {
    get datum() {
        return this._datum;
    }
    set datum(datum) {
        this._datum = datum;
    }
    constructor() {
        super();
        this.capLength = NaN;
        this._datum = undefined;
        this.whiskerPath = new agChartsCommunity._Scene.Path();
        this.capsPath = new agChartsCommunity._Scene.Path();
        this.bboxes = new HierarchialBBox([]);
        this.append([this.whiskerPath, this.capsPath]);
    }
    calculateCapLength(capsTheme, capDefaults) {
        // Order of priorities for determining the length of the cap:
        // 1.  User-defined length (pixels).
        // 2.  User-defined lengthRatio.
        // 3.  Library default (defined by underlying series).
        const { lengthRatio = 1, length } = capsTheme;
        const { lengthRatioMultiplier, lengthMax } = capDefaults;
        const desiredLength = length !== null && length !== void 0 ? length : lengthRatio * lengthRatioMultiplier;
        return Math.min(desiredLength, lengthMax);
    }
    getFormatterParams(formatters, highlighted) {
        const { datum } = this;
        if (datum === undefined || (formatters.formatter === undefined && formatters.cap.formatter === undefined)) {
            return undefined;
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
            highlighted,
        };
    }
    formatStyles(style, formatters, highlighted) {
        let { cap: capsStyle } = style, whiskerStyle = __rest(style, ["cap"]);
        const params = this.getFormatterParams(formatters, highlighted);
        if (params !== undefined) {
            if (formatters.formatter !== undefined) {
                const result = formatters.formatter(params);
                whiskerStyle = mergeDefaults$3(result, whiskerStyle);
                capsStyle = mergeDefaults$3(result, capsStyle);
                capsStyle = mergeDefaults$3(result === null || result === void 0 ? void 0 : result.cap, capsStyle);
            }
            if (formatters.cap.formatter !== undefined) {
                const result = formatters.cap.formatter(params);
                capsStyle = mergeDefaults$3(result, capsStyle);
            }
        }
        return { whiskerStyle, capsStyle };
    }
    applyStyling(target, source) {
        // Style can be any object, including user data (e.g. formatter
        // result). So filter out anything that isn't styling options:
        partialAssign$1(['visible', 'stroke', 'strokeWidth', 'strokeOpacity', 'lineDash', 'lineDashOffset'], target, source);
    }
    update(style, formatters, highlighted) {
        // Note: The method always uses the RedrawType.MAJOR mode for simplicity.
        // This could be optimised to reduce a amount of unnecessary redraws.
        if (this.datum === undefined) {
            return;
        }
        const { whiskerStyle, capsStyle } = this.formatStyles(style, formatters, highlighted);
        const { xBar, yBar, capDefaults } = this.datum;
        const whisker = this.whiskerPath;
        this.applyStyling(whisker, whiskerStyle);
        whisker.path.clear();
        if (yBar !== undefined) {
            whisker.path.moveTo(yBar.lowerPoint.x, yBar.lowerPoint.y);
            whisker.path.lineTo(yBar.upperPoint.x, yBar.upperPoint.y);
        }
        if (xBar !== undefined) {
            whisker.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y);
            whisker.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y);
        }
        whisker.path.closePath();
        whisker.markDirtyTransform();
        // Errorbar caps stretch out pendicular to the whisker equally on both
        // sides, so we want the offset to be half of the total length.
        this.capLength = this.calculateCapLength(capsStyle !== null && capsStyle !== void 0 ? capsStyle : {}, capDefaults);
        const capOffset = this.capLength / 2;
        const caps = this.capsPath;
        this.applyStyling(caps, capsStyle);
        caps.path.clear();
        if (yBar !== undefined) {
            caps.path.moveTo(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y);
            caps.path.lineTo(yBar.lowerPoint.x + capOffset, yBar.lowerPoint.y);
            caps.path.moveTo(yBar.upperPoint.x - capOffset, yBar.upperPoint.y);
            caps.path.lineTo(yBar.upperPoint.x + capOffset, yBar.upperPoint.y);
        }
        if (xBar !== undefined) {
            caps.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset);
            caps.path.lineTo(xBar.lowerPoint.x, xBar.lowerPoint.y + capOffset);
            caps.path.moveTo(xBar.upperPoint.x, xBar.upperPoint.y - capOffset);
            caps.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y + capOffset);
        }
        caps.path.closePath();
        caps.markDirtyTransform();
    }
    updateBBoxes() {
        var _a;
        const { capLength, whiskerPath: whisker, capsPath: caps } = this;
        const { components } = this.bboxes;
        const { yBar, xBar } = (_a = this.datum) !== null && _a !== void 0 ? _a : {};
        const capOffset = capLength / 2;
        components.length = (xBar === undefined ? 0 : 3) + (yBar === undefined ? 0 : 3);
        let i = 0;
        if (yBar !== undefined) {
            const whiskerHeight = yBar.lowerPoint.y - yBar.upperPoint.y;
            components[i++] = new BBox$4(yBar.lowerPoint.x, yBar.upperPoint.y, whisker.strokeWidth, whiskerHeight);
            components[i++] = new BBox$4(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y, capLength, caps.strokeWidth);
            components[i++] = new BBox$4(yBar.upperPoint.x - capOffset, yBar.upperPoint.y, capLength, caps.strokeWidth);
        }
        if (xBar !== undefined) {
            const whiskerWidth = xBar.upperPoint.x - xBar.lowerPoint.x;
            components[i++] = new BBox$4(xBar.lowerPoint.x, xBar.upperPoint.y, whiskerWidth, whisker.strokeWidth);
            components[i++] = new BBox$4(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset, caps.strokeWidth, capLength);
            components[i++] = new BBox$4(xBar.upperPoint.x, xBar.upperPoint.y - capOffset, caps.strokeWidth, capLength);
        }
        this.bboxes.union = BBox$4.merge(components);
    }
    containsPoint(x, y) {
        return this.bboxes.containsPoint(x, y);
    }
    pickNode(x, y) {
        return this.containsPoint(x, y) ? this : undefined;
    }
    nearestSquared(point, maxDistance) {
        const { bboxes } = this;
        if (bboxes.union.distanceSquared(point) > maxDistance) {
            return { nearest: undefined, distanceSquared: Infinity };
        }
        const { distanceSquared } = BBox$4.nearestBox(point, bboxes.components);
        return { nearest: this, distanceSquared };
    }
}
class ErrorBarGroup extends agChartsCommunity._Scene.Group {
    get children() {
        return super.children;
    }
    nearestSquared(point) {
        const { nearest, distanceSquared } = agChartsCommunity._Scene.nearestSquaredInContainer(point, this);
        if (nearest !== undefined && !isNaN(distanceSquared)) {
            return { datum: nearest.datum, distanceSquared };
        }
    }
}

const { fixNumericExtent: fixNumericExtent$7, mergeDefaults: mergeDefaults$2, valueProperty: valueProperty$9, ChartAxisDirection: ChartAxisDirection$a, Validate: Validate$h, OPT_BOOLEAN: OPT_BOOLEAN$1, OPT_COLOR_STRING: OPT_COLOR_STRING$b, OPT_FUNCTION: OPT_FUNCTION$a, OPT_LINE_DASH: OPT_LINE_DASH$7, OPT_NUMBER: OPT_NUMBER$c, OPT_STRING: OPT_STRING$b, } = agChartsCommunity._ModuleSupport;
function toErrorBoundCartesianSeries(ctx) {
    for (const supportedType of agChartsCommunity.AgErrorBarSupportedSeriesTypes) {
        if (supportedType == ctx.series.type) {
            return ctx.series;
        }
    }
    throw new Error(`AG Charts - unsupported series type '${ctx.series.type}', error bars supported series types: ${agChartsCommunity.AgErrorBarSupportedSeriesTypes.join(', ')}`);
}
class ErrorBarCap {
    constructor() {
        this.visible = undefined;
        this.stroke = undefined;
        this.strokeWidth = undefined;
        this.strokeOpacity = undefined;
        this.length = undefined;
        this.lengthRatio = undefined;
        this.formatter = undefined;
    }
}
__decorate([
    Validate$h(OPT_BOOLEAN$1),
    __metadata("design:type", Boolean)
], ErrorBarCap.prototype, "visible", void 0);
__decorate([
    Validate$h(OPT_COLOR_STRING$b),
    __metadata("design:type", String)
], ErrorBarCap.prototype, "stroke", void 0);
__decorate([
    Validate$h(OPT_NUMBER$c(0)),
    __metadata("design:type", Number)
], ErrorBarCap.prototype, "strokeWidth", void 0);
__decorate([
    Validate$h(OPT_NUMBER$c(0, 1)),
    __metadata("design:type", Number)
], ErrorBarCap.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$h(OPT_LINE_DASH$7),
    __metadata("design:type", Array)
], ErrorBarCap.prototype, "lineDash", void 0);
__decorate([
    Validate$h(OPT_NUMBER$c(0)),
    __metadata("design:type", Number)
], ErrorBarCap.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$h(OPT_NUMBER$c()),
    __metadata("design:type", Number)
], ErrorBarCap.prototype, "length", void 0);
__decorate([
    Validate$h(OPT_NUMBER$c(0, 1)),
    __metadata("design:type", Number)
], ErrorBarCap.prototype, "lengthRatio", void 0);
__decorate([
    Validate$h(OPT_FUNCTION$a),
    __metadata("design:type", Function)
], ErrorBarCap.prototype, "formatter", void 0);
class ErrorBars extends agChartsCommunity._ModuleSupport.BaseModuleInstance {
    constructor(ctx) {
        super();
        this.yLowerKey = undefined;
        this.yLowerName = undefined;
        this.yUpperKey = undefined;
        this.yUpperName = undefined;
        this.xLowerKey = undefined;
        this.xLowerName = undefined;
        this.xUpperKey = undefined;
        this.xUpperName = undefined;
        this.visible = true;
        this.stroke = 'black';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.formatter = undefined;
        this.cap = new ErrorBarCap();
        this.cartesianSeries = toErrorBoundCartesianSeries(ctx);
        const { annotationGroup, annotationSelections } = this.cartesianSeries;
        this.groupNode = new ErrorBarGroup({
            name: `${annotationGroup.id}-errorBars`,
            zIndex: agChartsCommunity._ModuleSupport.Layers.SERIES_LAYER_ZINDEX,
            zIndexSubOrder: this.cartesianSeries.getGroupZIndexSubOrder('annotation'),
        });
        annotationGroup.appendChild(this.groupNode);
        this.selection = agChartsCommunity._Scene.Selection.select(this.groupNode, () => this.errorBarFactory());
        annotationSelections.add(this.selection);
        const series = this.cartesianSeries;
        this.destroyFns.push(series.addListener('data-prerequest', (e) => this.onPrerequestData(e)), series.addListener('data-processed', (e) => this.onDataProcessed(e)), series.addListener('data-getDomain', (e) => this.onGetDomain(e)), series.addListener('data-update', (e) => this.onDataUpdate(e)), series.addListener('tooltip-getParams', (e) => this.onTooltipGetParams(e)), series.addListener('visibility-changed', (e) => this.onToggleSeriesItem(e)), ctx.highlightManager.addListener('highlight-change', (event) => this.onHighlightChange(event)), () => annotationGroup.removeChild(this.groupNode), () => annotationSelections.delete(this.selection));
    }
    onPrerequestData(event) {
        const props = [];
        const { cartesianSeries } = this;
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
        const { isContinuousX, isContinuousY } = event;
        if (yLowerKey !== undefined && yUpperKey !== undefined) {
            props.push(valueProperty$9(cartesianSeries, yLowerKey, isContinuousY, { id: yErrorsID }), valueProperty$9(cartesianSeries, yUpperKey, isContinuousY, { id: yErrorsID }));
        }
        if (xLowerKey !== undefined && xUpperKey !== undefined) {
            props.push(valueProperty$9(cartesianSeries, xLowerKey, isContinuousX, { id: xErrorsID }), valueProperty$9(cartesianSeries, xUpperKey, isContinuousX, { id: xErrorsID }));
        }
        return props;
    }
    onDataProcessed(event) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
    }
    onGetDomain(event) {
        const { xLowerKey, xUpperKey, xErrorsID, yLowerKey, yUpperKey, yErrorsID } = this.getMaybeFlippedKeys();
        let hasAxisErrors = false;
        if (event.direction == ChartAxisDirection$a.X) {
            hasAxisErrors = xLowerKey !== undefined && xUpperKey != undefined;
        }
        else {
            hasAxisErrors = yLowerKey !== undefined && yUpperKey != undefined;
        }
        if (hasAxisErrors) {
            const { dataModel, processedData, cartesianSeries } = this;
            const axis = cartesianSeries.axes[event.direction];
            const id = { x: xErrorsID, y: yErrorsID }[event.direction];
            if (dataModel !== undefined && processedData !== undefined) {
                const domain = dataModel.getDomain(cartesianSeries, id, 'value', processedData);
                return fixNumericExtent$7(domain, axis);
            }
        }
    }
    onDataUpdate(event) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
        if (event.dataModel !== undefined && event.processedData !== undefined) {
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
        var _a, _b;
        const nodeData = this.getNodeData();
        const xScale = (_a = this.cartesianSeries.axes[ChartAxisDirection$a.X]) === null || _a === void 0 ? void 0 : _a.scale;
        const yScale = (_b = this.cartesianSeries.axes[ChartAxisDirection$a.Y]) === null || _b === void 0 ? void 0 : _b.scale;
        if (!xScale || !yScale || !nodeData) {
            return;
        }
        for (let i = 0; i < nodeData.length; i++) {
            const { midPoint, xLower, xUpper, yLower, yUpper } = this.getDatum(nodeData, i);
            if (midPoint !== undefined) {
                let xBar = undefined;
                let yBar = undefined;
                if (xLower !== undefined && xUpper !== undefined) {
                    xBar = {
                        lowerPoint: { x: this.convert(xScale, xLower), y: midPoint.y },
                        upperPoint: { x: this.convert(xScale, xUpper), y: midPoint.y },
                    };
                }
                if (yLower !== undefined && yUpper !== undefined) {
                    yBar = {
                        lowerPoint: { x: midPoint.x, y: this.convert(yScale, yLower) },
                        upperPoint: { x: midPoint.x, y: this.convert(yScale, yUpper) },
                    };
                }
                nodeData[i].xBar = xBar;
                nodeData[i].yBar = yBar;
            }
        }
    }
    getMaybeFlippedKeys() {
        let { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        let [xErrorsID, yErrorsID] = ['xValue-errors', 'yValue-errors'];
        if (this.cartesianSeries.shouldFlipXY()) {
            [xLowerKey, yLowerKey] = [yLowerKey, xLowerKey];
            [xUpperKey, yUpperKey] = [yUpperKey, xUpperKey];
            [xErrorsID, yErrorsID] = [yErrorsID, xErrorsID];
        }
        return { xLowerKey, xUpperKey, xErrorsID, yLowerKey, yUpperKey, yErrorsID };
    }
    getDatum(nodeData, datumIndex) {
        var _a, _b, _c, _d;
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.getMaybeFlippedKeys();
        const datum = nodeData[datumIndex];
        return {
            midPoint: datum.midPoint,
            xLower: (_a = datum.datum[xLowerKey !== null && xLowerKey !== void 0 ? xLowerKey : '']) !== null && _a !== void 0 ? _a : undefined,
            xUpper: (_b = datum.datum[xUpperKey !== null && xUpperKey !== void 0 ? xUpperKey : '']) !== null && _b !== void 0 ? _b : undefined,
            yLower: (_c = datum.datum[yLowerKey !== null && yLowerKey !== void 0 ? yLowerKey : '']) !== null && _c !== void 0 ? _c : undefined,
            yUpper: (_d = datum.datum[yUpperKey !== null && yUpperKey !== void 0 ? yUpperKey : '']) !== null && _d !== void 0 ? _d : undefined,
        };
    }
    convert(scale, value) {
        var _a;
        const offset = ((_a = scale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
        return scale.convert(value) + offset;
    }
    update() {
        const nodeData = this.getNodeData();
        if (nodeData !== undefined) {
            this.selection.update(nodeData, undefined, undefined);
            this.selection.each((node, datum, i) => this.updateNode(node, datum, i));
        }
    }
    updateNode(node, datum, _index) {
        const style = this.getDefaultStyle();
        node.datum = datum;
        node.update(style, this, false);
        node.updateBBoxes();
    }
    pickNodeExact(point) {
        const { x, y } = this.groupNode.transformPoint(point.x, point.y);
        const node = this.groupNode.pickNode(x, y);
        if (node !== undefined) {
            return { datum: node.datum, distanceSquared: 0 };
        }
    }
    pickNodeNearest(point) {
        return this.groupNode.nearestSquared(point);
    }
    pickNodeMainAxisFirst(point) {
        return this.groupNode.nearestSquared(point);
    }
    onTooltipGetParams(_event) {
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        let { xLowerName, xUpperName, yLowerName, yUpperName } = this;
        xLowerName !== null && xLowerName !== void 0 ? xLowerName : (xLowerName = xLowerKey);
        xUpperName !== null && xUpperName !== void 0 ? xUpperName : (xUpperName = xUpperKey);
        yLowerName !== null && yLowerName !== void 0 ? yLowerName : (yLowerName = yLowerKey);
        yUpperName !== null && yUpperName !== void 0 ? yUpperName : (yUpperName = yUpperKey);
        return {
            xLowerKey,
            xLowerName,
            xUpperKey,
            xUpperName,
            yLowerKey,
            yLowerName,
            yUpperKey,
            yUpperName,
        };
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
            cap: mergeDefaults$2(this.cap, baseStyle),
        };
    }
    getDefaultStyle() {
        return this.makeStyle(this.getWhiskerProperties());
    }
    getHighlightStyle() {
        // FIXME - at some point we should allow customising this
        return this.makeStyle(this.getWhiskerProperties());
    }
    restyleHightlightChange(highlightChange, style, highlighted) {
        const nodeData = this.getNodeData();
        if (nodeData === undefined)
            return;
        // Search for the ErrorBarNode that matches this highlight change. This
        // isn't a good solution in terms of performance. However, it's assumed
        // that the typical use case for error bars includes few data points
        // (because the chart will get cluttered very quickly if there are many
        // data points with error bars).
        for (let i = 0; i < nodeData.length; i++) {
            if (highlightChange === nodeData[i]) {
                this.selection.nodes()[i].update(style, this, highlighted);
                break;
            }
        }
    }
    onHighlightChange(event) {
        const { previousHighlight, currentHighlight } = event;
        const { cartesianSeries: thisSeries } = this;
        if ((currentHighlight === null || currentHighlight === void 0 ? void 0 : currentHighlight.series) === thisSeries) {
            // Highlight this node:
            this.restyleHightlightChange(currentHighlight, this.getHighlightStyle(), true);
        }
        if ((previousHighlight === null || previousHighlight === void 0 ? void 0 : previousHighlight.series) === thisSeries) {
            // Unhighlight this node:
            this.restyleHightlightChange(previousHighlight, this.getDefaultStyle(), false);
        }
        this.groupNode.opacity = this.cartesianSeries.getOpacity();
    }
    errorBarFactory() {
        return new ErrorBarNode();
    }
    getWhiskerProperties() {
        const { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset } = this;
        return { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset };
    }
}
__decorate([
    Validate$h(OPT_STRING$b),
    __metadata("design:type", String)
], ErrorBars.prototype, "yLowerKey", void 0);
__decorate([
    Validate$h(OPT_STRING$b),
    __metadata("design:type", String)
], ErrorBars.prototype, "yLowerName", void 0);
__decorate([
    Validate$h(OPT_STRING$b),
    __metadata("design:type", String)
], ErrorBars.prototype, "yUpperKey", void 0);
__decorate([
    Validate$h(OPT_STRING$b),
    __metadata("design:type", String)
], ErrorBars.prototype, "yUpperName", void 0);
__decorate([
    Validate$h(OPT_STRING$b),
    __metadata("design:type", String)
], ErrorBars.prototype, "xLowerKey", void 0);
__decorate([
    Validate$h(OPT_STRING$b),
    __metadata("design:type", String)
], ErrorBars.prototype, "xLowerName", void 0);
__decorate([
    Validate$h(OPT_STRING$b),
    __metadata("design:type", String)
], ErrorBars.prototype, "xUpperKey", void 0);
__decorate([
    Validate$h(OPT_STRING$b),
    __metadata("design:type", String)
], ErrorBars.prototype, "xUpperName", void 0);
__decorate([
    Validate$h(OPT_BOOLEAN$1),
    __metadata("design:type", Boolean)
], ErrorBars.prototype, "visible", void 0);
__decorate([
    Validate$h(OPT_COLOR_STRING$b),
    __metadata("design:type", Object)
], ErrorBars.prototype, "stroke", void 0);
__decorate([
    Validate$h(OPT_NUMBER$c(0)),
    __metadata("design:type", Number)
], ErrorBars.prototype, "strokeWidth", void 0);
__decorate([
    Validate$h(OPT_NUMBER$c(0, 1)),
    __metadata("design:type", Number)
], ErrorBars.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$h(OPT_LINE_DASH$7),
    __metadata("design:type", Array)
], ErrorBars.prototype, "lineDash", void 0);
__decorate([
    Validate$h(OPT_NUMBER$c(0)),
    __metadata("design:type", Number)
], ErrorBars.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$h(OPT_FUNCTION$a),
    __metadata("design:type", Function)
], ErrorBars.prototype, "formatter", void 0);

const ERROR_BARS_THEME = {
    errorBar: {
        visible: true,
        stroke: agChartsCommunity._Theme.DEFAULT_LABEL_COLOUR,
        strokeWidth: 1,
        strokeOpacity: 1,
        cap: {
            length: undefined,
            lengthRatio: undefined,
        },
    },
};

const ErrorBarsModule = {
    type: 'series-option',
    identifier: 'error-bars',
    optionsKey: 'errorBar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    seriesTypes: agChartsCommunity.AgErrorBarSupportedSeriesTypes,
    instanceConstructor: ErrorBars,
    themeTemplate: ERROR_BARS_THEME,
};

const { COLOR_STRING: COLOR_STRING$2, NUMBER: NUMBER$d, Validate: Validate$g } = agChartsCommunity._ModuleSupport;
class ZoomRect extends agChartsCommunity._Scene.Rect {
    constructor() {
        super(...arguments);
        this.fill = 'rgb(33, 150, 243)';
        this.fillOpacity = 0.2;
    }
}
ZoomRect.className = 'ZoomRect';
__decorate([
    Validate$g(COLOR_STRING$2),
    __metadata("design:type", Object)
], ZoomRect.prototype, "fill", void 0);
__decorate([
    Validate$g(NUMBER$d(0, 1)),
    __metadata("design:type", Object)
], ZoomRect.prototype, "fillOpacity", void 0);

const UNIT = { min: 0, max: 1 };
const constrain = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
function unitZoomState() {
    return { x: Object.assign({}, UNIT), y: Object.assign({}, UNIT) };
}
function definedZoomState(zoom) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return {
        x: { min: (_b = (_a = zoom === null || zoom === void 0 ? void 0 : zoom.x) === null || _a === void 0 ? void 0 : _a.min) !== null && _b !== void 0 ? _b : UNIT.min, max: (_d = (_c = zoom === null || zoom === void 0 ? void 0 : zoom.x) === null || _c === void 0 ? void 0 : _c.max) !== null && _d !== void 0 ? _d : UNIT.max },
        y: { min: (_f = (_e = zoom === null || zoom === void 0 ? void 0 : zoom.y) === null || _e === void 0 ? void 0 : _e.min) !== null && _f !== void 0 ? _f : UNIT.min, max: (_h = (_g = zoom === null || zoom === void 0 ? void 0 : zoom.y) === null || _g === void 0 ? void 0 : _g.max) !== null && _h !== void 0 ? _h : UNIT.max },
    };
}
/**
 * Calculate the position on the series rect as a ratio from the top left corner. Invert the ratio on the y-axis to
 * cater for conflicting direction between screen and chart axis systems. Constrains the point to the series
 * rect so the zoom is pinned to the edges if the point is over the legends, axes, etc.
 */
function pointToRatio(bbox, x, y) {
    if (!bbox)
        return { x: 0, y: 0 };
    const constrainedX = constrain(x - bbox.x, 0, bbox.x + bbox.width);
    const constrainedY = constrain(y - bbox.y, 0, bbox.y + bbox.height);
    const rx = (1 / bbox.width) * constrainedX;
    const ry = 1 - (1 / bbox.height) * constrainedY;
    return { x: constrain(rx), y: constrain(ry) };
}
/**
 * Translate a zoom bounding box by shifting all points by the given x & y amounts.
 */
function translateZoom(zoom, x, y) {
    return {
        x: { min: zoom.x.min + x, max: zoom.x.max + x },
        y: { min: zoom.y.min + y, max: zoom.y.max + y },
    };
}
/**
 * Scale a zoom bounding box from the top left corner.
 */
function scaleZoom(zoom, sx, sy) {
    const dx = zoom.x.max - zoom.x.min;
    const dy = zoom.y.max - zoom.y.min;
    return {
        x: { min: zoom.x.min, max: zoom.x.min + dx * sx },
        y: { min: zoom.y.min, max: zoom.y.min + dy * sy },
    };
}
/**
 * Scale a zoom bounding box from the center.
 */
function scaleZoomCenter(zoom, sx, sy) {
    const dx = zoom.x.max - zoom.x.min;
    const dy = zoom.y.max - zoom.y.min;
    const cx = zoom.x.min + dx / 2;
    const cy = zoom.y.min + dy / 2;
    return {
        x: { min: cx - (dx * sx) / 2, max: cx + (dx * sx) / 2 },
        y: { min: cy - (dy * sy) / 2, max: cy + (dy * sy) / 2 },
    };
}
/**
 * Scale a single zoom axis about its anchor.
 */
function scaleZoomAxisWithAnchor(newState, oldState, anchor, origin) {
    let { min, max } = oldState;
    const center = min + (max - min) / 2;
    const diff = newState.max - newState.min;
    if (anchor === 'start') {
        max = oldState.min + diff;
    }
    else if (anchor === 'end') {
        min = oldState.max - diff;
    }
    else if (anchor === 'middle') {
        min = center - diff / 2;
        max = center + diff / 2;
    }
    else if (anchor === 'pointer') {
        const point = scaleZoomAxisWithPoint(newState, oldState, origin !== null && origin !== void 0 ? origin : center);
        min = point.min;
        max = point.max;
    }
    return { min, max };
}
function scaleZoomAxisWithPoint(newState, oldState, origin) {
    const scaledOrigin = origin * (1 - (oldState.max - oldState.min - (newState.max - newState.min)));
    const translation = origin - scaledOrigin;
    const min = newState.min + translation;
    const max = newState.max + translation;
    return { min, max };
}
/**
 * Constrain a zoom bounding box such that no corner exceeds an edge while maintaining the same width and height.
 */
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

class ZoomAxisDragger {
    constructor() {
        this.isAxisDragging = false;
    }
    update(event, direction, anchor, bbox, zoom, axisZoom) {
        this.isAxisDragging = true;
        // Store the initial zoom state, merged with the state for this axis
        if (this.oldZoom == null) {
            if (direction === agChartsCommunity._ModuleSupport.ChartAxisDirection.X) {
                this.oldZoom = definedZoomState(Object.assign(Object.assign({}, zoom), { x: axisZoom }));
            }
            else {
                this.oldZoom = definedZoomState(Object.assign(Object.assign({}, zoom), { y: axisZoom }));
            }
        }
        this.updateCoords(event.offsetX, event.offsetY);
        return this.updateZoom(direction, anchor, bbox);
    }
    stop() {
        this.isAxisDragging = false;
        this.coords = undefined;
        this.oldZoom = undefined;
    }
    updateCoords(x, y) {
        if (!this.coords) {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
        }
        else {
            this.coords.x2 = x;
            this.coords.y2 = y;
        }
    }
    updateZoom(direction, anchor, bbox) {
        const { coords, oldZoom } = this;
        let newZoom = definedZoomState(oldZoom);
        if (!coords || !oldZoom) {
            if (direction === agChartsCommunity._ModuleSupport.ChartAxisDirection.X)
                return newZoom.x;
            return newZoom.y;
        }
        // Scale the zoom along the given axis, anchoring on the end of the axis
        const origin = pointToRatio(bbox, coords.x1, coords.y1);
        const target = pointToRatio(bbox, coords.x2, coords.y2);
        if (direction === agChartsCommunity._ModuleSupport.ChartAxisDirection.X) {
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
}

class ZoomPanner {
    constructor() {
        this.isPanning = false;
    }
    update(event, bbox, zooms) {
        this.isPanning = true;
        this.updateCoords(event.offsetX, event.offsetY);
        return this.translateZooms(bbox, zooms);
    }
    stop() {
        this.isPanning = false;
        this.coords = undefined;
    }
    updateCoords(x, y) {
        if (!this.coords) {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
        }
        else {
            this.coords.x1 = this.coords.x2;
            this.coords.y1 = this.coords.y2;
            this.coords.x2 = x;
            this.coords.y2 = y;
        }
    }
    translateZooms(bbox, currentZooms) {
        var _a;
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = (_a = this.coords) !== null && _a !== void 0 ? _a : {};
        const dx = x1 <= x2 ? x2 - x1 : x1 - x2;
        const dy = y1 <= y2 ? y2 - y1 : y1 - y2;
        const offset = pointToRatio(bbox, bbox.x + dx, bbox.y + bbox.height - dy);
        const offsetX = x1 <= x2 ? -offset.x : offset.x;
        const offsetY = y1 <= y2 ? offset.y : -offset.y;
        const newZooms = {};
        for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
            let zoom;
            if (direction === agChartsCommunity._ModuleSupport.ChartAxisDirection.X) {
                zoom = definedZoomState({ x: currentZoom });
            }
            else {
                zoom = definedZoomState({ y: currentZoom });
            }
            const scaleX = zoom.x.max - zoom.x.min;
            const scaleY = zoom.y.max - zoom.y.min;
            zoom = constrainZoom(translateZoom(zoom, offsetX * scaleX, offsetY * scaleY));
            if (direction === agChartsCommunity._ModuleSupport.ChartAxisDirection.X) {
                newZooms[axisId] = { direction, zoom: zoom.x };
            }
            else {
                newZooms[axisId] = { direction, zoom: zoom.y };
            }
        }
        return newZooms;
    }
}

class ZoomScroller {
    update(event, step, anchorPointX, anchorPointY, isScalingX, isScalingY, bbox, currentZoom) {
        const oldZoom = definedZoomState(currentZoom);
        const sourceEvent = event.sourceEvent;
        // Scale the zoom bounding box
        const dir = sourceEvent.deltaY < 0 ? -1 : 1;
        let newZoom = definedZoomState(oldZoom);
        newZoom.x.max += isScalingX ? step * dir * (oldZoom.x.max - oldZoom.x.min) : 0;
        newZoom.y.max += isScalingY ? step * dir * (oldZoom.y.max - oldZoom.y.min) : 0;
        if ((anchorPointX === 'pointer' && isScalingX) || (anchorPointY === 'pointer' && isScalingY)) {
            newZoom = this.scaleZoomToPointer(sourceEvent, isScalingX, isScalingY, bbox, oldZoom, newZoom);
        }
        else {
            if (isScalingX) {
                newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchorPointX);
            }
            if (isScalingY) {
                newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchorPointY);
            }
        }
        // Constrain the zoom bounding box to remain within the ultimate bounds of 0,0 and 1,1
        newZoom = constrainZoom(newZoom);
        return newZoom;
    }
    scaleZoomToPointer(sourceEvent, isScalingX, isScalingY, bbox, oldZoom, newZoom) {
        var _a, _b;
        // Convert the cursor position to coordinates as a ratio of 0 to 1
        const origin = pointToRatio(bbox, (_a = sourceEvent.offsetX) !== null && _a !== void 0 ? _a : sourceEvent.clientX, (_b = sourceEvent.offsetY) !== null && _b !== void 0 ? _b : sourceEvent.clientY);
        // Translate the zoom bounding box such that the cursor remains over the same position as before
        newZoom.x = isScalingX ? scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x) : newZoom.x;
        newZoom.y = isScalingY ? scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y) : newZoom.y;
        return newZoom;
    }
}

// "Re-rewind, when the crowd say..."
class ZoomSelector {
    constructor(rect) {
        this.rect = rect;
        this.rect.visible = false;
    }
    update(event, minRatioX, minRatioY, isScalingX, isScalingY, bbox, currentZoom) {
        this.rect.visible = true;
        this.updateCoords(event.offsetX, event.offsetY, minRatioX, minRatioY, isScalingX, isScalingY, bbox, currentZoom);
        this.updateRect(bbox);
    }
    stop(bbox, currentZoom) {
        let zoom = definedZoomState();
        if (!bbox)
            return zoom;
        if (this.coords) {
            zoom = this.createZoomFromCoords(bbox, currentZoom);
        }
        this.reset();
        return zoom;
    }
    reset() {
        this.coords = undefined;
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
        // Ensure the selection is always at the same aspect ratio, using the width as the source of truth for the size
        // of the selection and limit it to the minimum dimensions.
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
            }
            else {
                this.coords.x2 = this.coords.x1 + bbox.width * xRatio;
            }
        }
        // If only scaling on the y-axis, we switch to scaling using height as the source of truth, otherwise we scale
        // the height in relation to the aspect ratio
        if (isScalingY && !isScalingX) {
            if (normal.height / bbox.height < yRatio) {
                if (this.coords.y2 < this.coords.y1) {
                    this.coords.y2 = this.coords.y1 - bbox.width * xRatio;
                }
                else {
                    this.coords.y2 = this.coords.y1 + bbox.height * yRatio;
                }
            }
        }
        else if (this.coords.y2 < this.coords.y1) {
            this.coords.y2 = Math.min(this.coords.y1 - normal.width / aspectRatio, this.coords.y1 - bbox.height * yRatio);
        }
        else {
            this.coords.y2 = Math.max(this.coords.y1 + normal.width / aspectRatio, this.coords.y1 + bbox.height * yRatio);
        }
        // Finally we reset the coords to maximise if not scaling on either axis
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
        // Convert the top-left position to coordinates as a ratio of 0 to 1 of the current zoom
        const origin = pointToRatio(bbox, normal.x, normal.y + normal.height);
        // Scale the zoom bounding box
        const xFactor = normal.width / bbox.width;
        const yFactor = normal.height / bbox.height;
        let newZoom = scaleZoom(oldZoom, xFactor, yFactor);
        // Translate the zoom bounding box by an amount scaled to the old zoom
        const translateX = origin.x * (oldZoom.x.max - oldZoom.x.min);
        const translateY = origin.y * (oldZoom.y.max - oldZoom.y.min);
        newZoom = translateZoom(newZoom, translateX, translateY);
        // Constrain the zoom bounding box to remain within the ultimate bounds of 0,0 and 1,1
        newZoom = constrainZoom(newZoom);
        return newZoom;
    }
    getNormalisedDimensions() {
        var _a;
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = (_a = this.coords) !== null && _a !== void 0 ? _a : {};
        // Ensure we create a box starting at the top left corner
        const x = x1 <= x2 ? x1 : x2;
        const y = y1 <= y2 ? y1 : y2;
        const width = x1 <= x2 ? x2 - x1 : x1 - x2;
        const height = y1 <= y2 ? y2 - y1 : y1 - y2;
        return { x, y, width, height };
    }
}

const { BOOLEAN: BOOLEAN$3, NUMBER: NUMBER$c, STRING_UNION: STRING_UNION$2, ActionOnSet, ChartAxisDirection: ChartAxisDirection$9, ChartUpdateType, Validate: Validate$f } = agChartsCommunity._ModuleSupport;
const CONTEXT_ZOOM_ACTION_ID = 'zoom-action';
const CONTEXT_PAN_ACTION_ID = 'pan-action';
const CURSOR_ID = 'zoom-cursor';
const TOOLTIP_ID = 'zoom-tooltip';
const ZOOM_ID = 'zoom';
const DECIMALS = 3;
const round = (value, decimals = DECIMALS) => {
    const pow = Math.pow(10, decimals);
    return Math.round(value * pow) / pow;
};
class Zoom extends agChartsCommunity._ModuleSupport.BaseModuleInstance {
    constructor(ctx) {
        var _a;
        super();
        this.ctx = ctx;
        this.enabled = false;
        this.enableAxisDragging = true;
        this.enableDoubleClickToReset = true;
        this.enablePanning = true;
        this.enableScrolling = true;
        this.enableSelecting = false;
        this.panKey = 'alt';
        this.axes = 'x';
        this.scrollingStep = UNIT.max / 10;
        this.minVisibleItemsX = 2;
        this.minVisibleItemsY = 2;
        this.anchorPointX = 'end';
        this.anchorPointY = 'middle';
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
        this.updateService = ctx.updateService;
        const interactionOpts = { bypassPause: ['animation'] };
        this.destroyFns.push(ctx.interactionManager.addListener('dblclick', (event) => this.onDoubleClick(event), interactionOpts), ctx.interactionManager.addListener('drag', (event) => this.onDrag(event), interactionOpts), ctx.interactionManager.addListener('drag-end', () => this.onDragEnd(), interactionOpts), ctx.interactionManager.addListener('wheel', (event) => this.onWheel(event), interactionOpts), ctx.interactionManager.addListener('hover', () => this.onHover(), interactionOpts), ctx.chartEventManager.addListener('axis-hover', (event) => this.onAxisHover(event)), ctx.layoutService.addListener('layout-complete', (event) => this.onLayoutComplete(event)), ctx.updateService.addListener('update-complete', (event) => this.onUpdateComplete(event)));
        // Add selection zoom method and attach selection rect to root scene
        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect);
        (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.appendChild(selectionRect);
        this.destroyFns.push(() => { var _a; return (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.removeChild(selectionRect); });
    }
    registerContextMenuActions() {
        // Add context menu zoom actions
        ContextMenu.registerDefaultAction({
            id: CONTEXT_ZOOM_ACTION_ID,
            label: 'Zoom to here',
            action: (params) => this.onContextMenuZoomToHere(params),
        });
        ContextMenu.registerDefaultAction({
            id: CONTEXT_PAN_ACTION_ID,
            label: 'Pan to here',
            action: (params) => this.onContextMenuPanToHere(params),
        });
        const zoom = definedZoomState(this.zoomManager.getZoom());
        this.toggleContextMenuActions(zoom);
    }
    toggleContextMenuActions(zoom) {
        if (this.isMinZoom(zoom)) {
            ContextMenu.disableAction(CONTEXT_ZOOM_ACTION_ID);
        }
        else {
            ContextMenu.enableAction(CONTEXT_ZOOM_ACTION_ID);
        }
        if (this.isMaxZoom(zoom)) {
            ContextMenu.disableAction(CONTEXT_PAN_ACTION_ID);
        }
        else {
            ContextMenu.enableAction(CONTEXT_PAN_ACTION_ID);
        }
    }
    onDoubleClick(event) {
        var _a;
        if (!this.enabled || !this.enableDoubleClickToReset)
            return;
        if (this.hoveredAxis) {
            const { id, direction } = this.hoveredAxis;
            this.updateAxisZoom(id, direction, Object.assign({}, UNIT));
        }
        else if (((_a = this.seriesRect) === null || _a === void 0 ? void 0 : _a.containsPoint(event.offsetX, event.offsetY)) &&
            this.highlightManager.getActivePicked() === undefined) {
            this.updateZoom(unitZoomState());
        }
    }
    onDrag(event) {
        var _a;
        if (!this.enabled || !this.seriesRect)
            return;
        const sourceEvent = event.sourceEvent;
        const isPrimaryMouseButton = sourceEvent.button === 0;
        if (!isPrimaryMouseButton)
            return;
        this.isDragging = true;
        this.tooltipManager.updateTooltip(TOOLTIP_ID);
        const zoom = definedZoomState(this.zoomManager.getZoom());
        if (this.enableAxisDragging && this.hoveredAxis) {
            const { id: axisId, direction } = this.hoveredAxis;
            const anchor = direction === agChartsCommunity._ModuleSupport.ChartAxisDirection.X ? this.anchorPointX : this.anchorPointY;
            const axisZoom = (_a = this.zoomManager.getAxisZoom(axisId)) !== null && _a !== void 0 ? _a : Object.assign({}, UNIT);
            const newZoom = this.axisDragger.update(event, direction, anchor, this.seriesRect, zoom, axisZoom);
            this.updateAxisZoom(axisId, direction, newZoom);
            return;
        }
        // Prevent the user from dragging outside the series rect (if not on an axis)
        if (!this.seriesRect.containsPoint(event.offsetX, event.offsetY)) {
            return;
        }
        // Allow panning if either selection is disabled or the panning key is pressed.
        if (this.enablePanning && (!this.enableSelecting || this.isPanningKeyPressed(sourceEvent))) {
            const newZooms = this.panner.update(event, this.seriesRect, this.zoomManager.getAxisZooms());
            for (const [axisId, { direction, zoom: newZoom }] of Object.entries(newZooms)) {
                this.updateAxisZoom(axisId, direction, newZoom);
            }
            this.cursorManager.updateCursor(CURSOR_ID, 'grabbing');
            return;
        }
        // If the user stops pressing the panKey but continues dragging, we shouldn't go to selection until they stop
        // dragging and click to start a new drag.
        if (!this.enableSelecting ||
            this.isPanningKeyPressed(sourceEvent) ||
            this.panner.isPanning ||
            this.isMinZoom(zoom)) {
            return;
        }
        this.selector.update(event, this.minRatioX, this.minRatioY, this.isScalingX(), this.isScalingY(), this.seriesRect, zoom);
        this.updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }
    onDragEnd() {
        // Stop single clicks from triggering drag end and resetting the zoom
        if (!this.enabled || !this.isDragging)
            return;
        const zoom = definedZoomState(this.zoomManager.getZoom());
        this.cursorManager.updateCursor(CURSOR_ID);
        if (this.enableAxisDragging && this.axisDragger.isAxisDragging) {
            this.axisDragger.stop();
        }
        else if (this.enablePanning && this.panner.isPanning) {
            this.panner.stop();
        }
        else if (this.enableSelecting && !this.isMinZoom(zoom)) {
            const newZoom = this.selector.stop(this.seriesRect, zoom);
            this.updateZoom(newZoom);
        }
        this.isDragging = false;
        this.tooltipManager.removeTooltip(TOOLTIP_ID);
    }
    onWheel(event) {
        if (!this.enabled || !this.enableScrolling || !this.seriesRect)
            return;
        const currentZoom = this.zoomManager.getZoom();
        const isSeriesScrolling = this.seriesRect.containsPoint(event.offsetX, event.offsetY);
        const isAxisScrolling = this.enableAxisDragging && this.hoveredAxis != null;
        let isScalingX = this.isScalingX();
        let isScalingY = this.isScalingY();
        if (isAxisScrolling) {
            isScalingX = this.hoveredAxis.direction === agChartsCommunity._ModuleSupport.ChartAxisDirection.X;
            isScalingY = !isScalingX;
        }
        if (isSeriesScrolling || isAxisScrolling) {
            event.consume();
            event.sourceEvent.preventDefault();
            const newZoom = this.scroller.update(event, this.scrollingStep, this.getAnchorPointX(), this.getAnchorPointY(), isScalingX, isScalingY, this.seriesRect, currentZoom);
            this.updateZoom(newZoom);
        }
    }
    onHover() {
        if (!this.enabled)
            return;
        this.hoveredAxis = undefined;
        this.cursorManager.updateCursor(CURSOR_ID);
    }
    onAxisHover(event) {
        if (!this.enabled)
            return;
        this.hoveredAxis = {
            id: event.axisId,
            direction: event.direction,
        };
        if (this.enableAxisDragging) {
            this.cursorManager.updateCursor(CURSOR_ID, event.direction === ChartAxisDirection$9.X ? 'ew-resize' : 'ns-resize');
        }
    }
    onLayoutComplete(event) {
        if (!this.enabled)
            return;
        const { series: { paddedRect, shouldFlipXY }, } = event;
        this.seriesRect = paddedRect;
        this.shouldFlipXY = shouldFlipXY;
    }
    onUpdateComplete({ minRect }) {
        if (!this.enabled || !this.seriesRect || !minRect)
            return;
        const zoom = definedZoomState(this.zoomManager.getZoom());
        const minVisibleItemsWidth = this.shouldFlipXY ? this.minVisibleItemsY : this.minVisibleItemsX;
        const minVisibleItemsHeight = this.shouldFlipXY ? this.minVisibleItemsX : this.minVisibleItemsY;
        const widthRatio = (minRect.width * minVisibleItemsWidth) / this.seriesRect.width;
        const heightRatio = (minRect.height * minVisibleItemsHeight) / this.seriesRect.height;
        // We don't need to check flipping here again, as it is already built into the width & height ratios and the
        // zoom.x/y values themselves do not flip and are bound to width/height respectively.
        const ratioX = widthRatio * (zoom.x.max - zoom.x.min);
        const ratioY = heightRatio * (zoom.y.max - zoom.y.min);
        if (this.isScalingX()) {
            this.minRatioX || (this.minRatioX = Math.min(1, round(ratioX)));
        }
        if (this.isScalingY()) {
            this.minRatioY || (this.minRatioY = Math.min(1, round(ratioY)));
        }
        this.minRatioX || (this.minRatioX = this.minRatioY || 0);
        this.minRatioY || (this.minRatioY = this.minRatioX || 0);
    }
    onContextMenuZoomToHere({ event }) {
        if (!this.enabled || !this.seriesRect || !event || !event.target)
            return;
        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(this.seriesRect, event.clientX, event.clientY);
        const scaledOriginX = origin.x * (zoom.x.max - zoom.x.min);
        const scaledOriginY = origin.y * (zoom.y.max - zoom.y.min);
        const size = UNIT.max - UNIT.min;
        const halfSize = size / 2;
        let newZoom = {
            x: { min: origin.x - halfSize, max: origin.x + halfSize },
            y: { min: origin.y - halfSize, max: origin.y + halfSize },
        };
        newZoom = scaleZoomCenter(newZoom, this.isScalingX() ? this.minRatioX : size, this.isScalingY() ? this.minRatioY : size);
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);
        this.updateZoom(constrainZoom(newZoom));
    }
    onContextMenuPanToHere({ event }) {
        if (!this.enabled || !this.seriesRect || !event || !event.target)
            return;
        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(this.seriesRect, event.clientX, event.clientY);
        const scaleX = zoom.x.max - zoom.x.min;
        const scaleY = zoom.y.max - zoom.y.min;
        const scaledOriginX = origin.x * scaleX;
        const scaledOriginY = origin.y * scaleY;
        const halfSize = (UNIT.max - UNIT.min) / 2;
        let newZoom = {
            x: { min: origin.x - halfSize, max: origin.x + halfSize },
            y: { min: origin.y - halfSize, max: origin.y + halfSize },
        };
        newZoom = scaleZoomCenter(newZoom, scaleX, scaleY);
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);
        this.updateZoom(constrainZoom(newZoom));
    }
    isPanningKeyPressed(event) {
        switch (this.panKey) {
            case 'alt':
                return event.altKey;
            case 'ctrl':
                return event.ctrlKey;
            case 'shift':
                return event.shiftKey;
            case 'meta':
                return event.metaKey;
        }
    }
    isScalingX() {
        if (this.axes === 'xy')
            return true;
        return this.shouldFlipXY ? this.axes === 'y' : this.axes === 'x';
    }
    isScalingY() {
        if (this.axes === 'xy')
            return true;
        return this.shouldFlipXY ? this.axes === 'x' : this.axes === 'y';
    }
    getAnchorPointX() {
        return this.shouldFlipXY ? this.anchorPointY : this.anchorPointX;
    }
    getAnchorPointY() {
        return this.shouldFlipXY ? this.anchorPointX : this.anchorPointY;
    }
    isMinZoom(zoom) {
        const minXCheckValue = this.enableScrolling
            ? (zoom.x.max - zoom.x.min) * (1 - this.scrollingStep)
            : round(zoom.x.max - zoom.x.min);
        const minYCheckValue = this.enableScrolling
            ? (zoom.y.max - zoom.y.min) * (1 - this.scrollingStep)
            : round(zoom.y.max - zoom.y.min);
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
        // Discard the zoom update if it would take us below either min ratio
        if (dx < this.minRatioX || dy < this.minRatioY) {
            ContextMenu.disableAction(CONTEXT_ZOOM_ACTION_ID);
            ContextMenu.enableAction(CONTEXT_PAN_ACTION_ID);
            return;
        }
        this.toggleContextMenuActions(zoom);
        this.zoomManager.updateZoom(ZOOM_ID, zoom);
    }
    updateAxisZoom(axisId, direction, partialZoom) {
        if (!partialZoom)
            return;
        if (!this.enableSecondaryAxis) {
            const fullZoom = definedZoomState(this.zoomManager.getZoom());
            if (direction === ChartAxisDirection$9.X) {
                fullZoom.x = partialZoom;
            }
            else {
                fullZoom.y = partialZoom;
            }
            this.updateZoom(fullZoom);
            return;
        }
        const d = round(partialZoom.max - partialZoom.min);
        // Discard the zoom update if it would take us below either min ratio
        if ((direction === ChartAxisDirection$9.X && d < this.minRatioX) ||
            (direction === ChartAxisDirection$9.Y && d < this.minRatioY)) {
            return;
        }
        this.zoomManager.updateAxisZoom(ZOOM_ID, axisId, partialZoom);
    }
}
__decorate([
    ActionOnSet({
        changeValue(newValue) {
            if (newValue) {
                this.updateZoom(unitZoomState());
                this.registerContextMenuActions();
            }
        },
    }),
    Validate$f(BOOLEAN$3),
    __metadata("design:type", Object)
], Zoom.prototype, "enabled", void 0);
__decorate([
    Validate$f(BOOLEAN$3),
    __metadata("design:type", Object)
], Zoom.prototype, "enableAxisDragging", void 0);
__decorate([
    Validate$f(BOOLEAN$3),
    __metadata("design:type", Object)
], Zoom.prototype, "enableDoubleClickToReset", void 0);
__decorate([
    Validate$f(BOOLEAN$3),
    __metadata("design:type", Object)
], Zoom.prototype, "enablePanning", void 0);
__decorate([
    Validate$f(BOOLEAN$3),
    __metadata("design:type", Object)
], Zoom.prototype, "enableScrolling", void 0);
__decorate([
    Validate$f(BOOLEAN$3),
    __metadata("design:type", Object)
], Zoom.prototype, "enableSelecting", void 0);
__decorate([
    Validate$f(STRING_UNION$2('alt', 'ctrl', 'meta', 'shift')),
    __metadata("design:type", String)
], Zoom.prototype, "panKey", void 0);
__decorate([
    Validate$f(STRING_UNION$2('xy', 'x', 'y')),
    __metadata("design:type", String)
], Zoom.prototype, "axes", void 0);
__decorate([
    Validate$f(NUMBER$c(0, 1)),
    __metadata("design:type", Object)
], Zoom.prototype, "scrollingStep", void 0);
__decorate([
    Validate$f(NUMBER$c(1)),
    __metadata("design:type", Object)
], Zoom.prototype, "minVisibleItemsX", void 0);
__decorate([
    Validate$f(NUMBER$c(1)),
    __metadata("design:type", Object)
], Zoom.prototype, "minVisibleItemsY", void 0);
__decorate([
    Validate$f(STRING_UNION$2('pointer', 'start', 'middle', 'end')),
    __metadata("design:type", String)
], Zoom.prototype, "anchorPointX", void 0);
__decorate([
    Validate$f(STRING_UNION$2('pointer', 'start', 'middle', 'end')),
    __metadata("design:type", String)
], Zoom.prototype, "anchorPointY", void 0);

const ZoomModule = {
    type: 'root',
    optionsKey: 'zoom',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: Zoom,
    conflicts: ['navigator'],
    themeTemplate: {
        zoom: { enabled: false },
    },
};

const { Layers, Validate: Validate$e, BOOLEAN: BOOLEAN$2, COLOR_STRING: COLOR_STRING$1, NUMBER: NUMBER$b, OPT_BOOLEAN, OPT_NUMBER: OPT_NUMBER$b, OPT_FUNCTION: OPT_FUNCTION$9, OPT_FONT_STYLE, OPT_FONT_WEIGHT, POSITION, STRING: STRING$4, } = agChartsCommunity._ModuleSupport;
const { BBox: BBox$3, Group: Group$4, Rect: Rect$4, LinearGradientFill, Selection: Selection$4, Text: Text$4, Triangle } = agChartsCommunity._Scene;
const { createId } = agChartsCommunity._Util;
class GradientLegendLabel {
    constructor() {
        this.maxLength = undefined;
        this.color = 'black';
        this.fontStyle = undefined;
        this.fontWeight = undefined;
        this.fontSize = 12;
        this.fontFamily = 'Verdana, sans-serif';
        this.formatter = undefined;
    }
}
__decorate([
    Validate$e(OPT_NUMBER$b(0)),
    __metadata("design:type", Number)
], GradientLegendLabel.prototype, "maxLength", void 0);
__decorate([
    Validate$e(COLOR_STRING$1),
    __metadata("design:type", String)
], GradientLegendLabel.prototype, "color", void 0);
__decorate([
    Validate$e(OPT_FONT_STYLE),
    __metadata("design:type", String)
], GradientLegendLabel.prototype, "fontStyle", void 0);
__decorate([
    Validate$e(OPT_FONT_WEIGHT),
    __metadata("design:type", String)
], GradientLegendLabel.prototype, "fontWeight", void 0);
__decorate([
    Validate$e(NUMBER$b(0)),
    __metadata("design:type", Number)
], GradientLegendLabel.prototype, "fontSize", void 0);
__decorate([
    Validate$e(STRING$4),
    __metadata("design:type", String)
], GradientLegendLabel.prototype, "fontFamily", void 0);
__decorate([
    Validate$e(OPT_FUNCTION$9),
    __metadata("design:type", Function)
], GradientLegendLabel.prototype, "formatter", void 0);
class GradientLegendStop {
    constructor() {
        this.label = new GradientLegendLabel();
        this.padding = 8;
    }
}
__decorate([
    Validate$e(NUMBER$b(0)),
    __metadata("design:type", Object)
], GradientLegendStop.prototype, "padding", void 0);
class GradientBar {
    constructor() {
        this.thickness = 16;
        this.preferredLength = 100;
    }
}
__decorate([
    Validate$e(NUMBER$b(0)),
    __metadata("design:type", Object)
], GradientBar.prototype, "thickness", void 0);
__decorate([
    Validate$e(NUMBER$b(0)),
    __metadata("design:type", Object)
], GradientBar.prototype, "preferredLength", void 0);
class GradientLegend {
    getOrientation() {
        switch (this.position) {
            case 'right':
            case 'left':
                return 'vertical';
            case 'bottom':
            case 'top':
                return 'horizontal';
        }
    }
    constructor(ctx) {
        this.ctx = ctx;
        this.id = createId(this);
        this.group = new Group$4({ name: 'legend', layer: true, zIndex: Layers.LEGEND_ZINDEX });
        this.enabled = false;
        this.position = 'bottom';
        this.reverseOrder = undefined;
        // Placeholder
        this.pagination = undefined;
        /**
         * Spacing between the legend and the edge of the chart's element.
         */
        this.spacing = 20;
        this.gradient = new GradientBar();
        this.stop = new GradientLegendStop();
        this.data = [];
        this.listeners = {};
        this.destroyFns = [];
        this.layoutService = ctx.layoutService;
        this.destroyFns.push(this.layoutService.addListener('start-layout', (e) => this.update(e.shrinkRect)));
        this.highlightManager = ctx.highlightManager;
        this.destroyFns.push(this.highlightManager.addListener('highlight-change', () => this.onChartHoverChange()));
        this.gradientRect = new Rect$4();
        this.gradientFill = new LinearGradientFill();
        this.gradientFill.mask = this.gradientRect;
        this.group.append(this.gradientFill);
        this.arrow = new Triangle();
        this.group.append(this.arrow);
        const textContainer = new Group$4();
        this.group.append(textContainer);
        this.textSelection = Selection$4.select(textContainer, Text$4);
        this.destroyFns.push(() => this.detachLegend());
    }
    destroy() {
        this.destroyFns.forEach((f) => f());
    }
    attachLegend(node) {
        node.append(this.group);
    }
    detachLegend() {
        var _a;
        (_a = this.group.parent) === null || _a === void 0 ? void 0 : _a.removeChild(this.group);
    }
    update(shrinkRect) {
        const data = this.data[0];
        if (!this.enabled || !data || !data.enabled) {
            this.group.visible = false;
            return { shrinkRect: shrinkRect.clone() };
        }
        const { colorDomain, colorRange } = this.normalizeColorArrays(data);
        const { gradientBox, newShrinkRect, translateX, translateY } = this.getMeasurements(colorDomain, shrinkRect);
        this.updateGradientRect(colorRange, gradientBox);
        this.updateText(colorDomain, gradientBox);
        this.updateArrow(colorDomain, gradientBox);
        this.group.visible = true;
        this.group.translationX = translateX;
        this.group.translationY = translateY;
        this.latestGradientBox = gradientBox;
        this.latestColorDomain = colorDomain;
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
            return d0 + ((d1 - d0) * i) / (count - 1);
        });
        return { colorDomain, colorRange };
    }
    getMeasurements(colorDomain, shrinkRect) {
        const { preferredLength: gradientLength, thickness } = this.gradient;
        const { padding } = this.stop;
        const [textWidth, textHeight] = this.measureMaxText(colorDomain);
        let width;
        let height;
        const gradientBox = new BBox$3(0, 0, 0, 0);
        const orientation = this.getOrientation();
        if (orientation === 'vertical') {
            width = thickness + padding + textWidth;
            const maxHeight = shrinkRect.height;
            const preferredHeight = gradientLength + textHeight;
            height = Math.min(maxHeight, preferredHeight);
            gradientBox.x = 0;
            gradientBox.y = textHeight / 2;
            gradientBox.width = thickness;
            gradientBox.height = height - textWidth;
        }
        else {
            const maxWidth = shrinkRect.width;
            const preferredWidth = gradientLength + textWidth;
            const fitTextWidth = textWidth * colorDomain.length;
            width = Math.min(maxWidth, Math.max(preferredWidth, fitTextWidth));
            height = thickness + padding + textHeight;
            gradientBox.x = textWidth / 2;
            gradientBox.y = 0;
            gradientBox.width = width - textWidth;
            gradientBox.height = thickness;
        }
        const { spacing } = this;
        const newShrinkRect = shrinkRect.clone();
        let left;
        let top;
        if (this.position === 'left') {
            left = shrinkRect.x;
            top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
            newShrinkRect.shrink(width + spacing, 'left');
        }
        else if (this.position === 'right') {
            left = shrinkRect.x + shrinkRect.width - width;
            top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
            newShrinkRect.shrink(width + spacing, 'right');
        }
        else if (this.position === 'top') {
            left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
            top = shrinkRect.y;
            newShrinkRect.shrink(height + spacing, 'top');
        }
        else {
            left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
            top = shrinkRect.y + shrinkRect.height - height;
            newShrinkRect.shrink(height + spacing, 'bottom');
        }
        return {
            translateX: left,
            translateY: top,
            gradientBox,
            newShrinkRect,
        };
    }
    updateGradientRect(colorRange, gradientBox) {
        if (this.reverseOrder) {
            colorRange = colorRange.slice().reverse();
        }
        const orientation = this.getOrientation();
        this.gradientFill.stops = colorRange;
        this.gradientFill.direction = orientation === 'vertical' ? 'to-bottom' : 'to-right';
        this.gradientRect.x = gradientBox.x;
        this.gradientRect.y = gradientBox.y;
        this.gradientRect.width = gradientBox.width;
        this.gradientRect.height = gradientBox.height;
    }
    updateText(colorDomain, gradientBox) {
        const { label, padding } = this.stop;
        const orientation = this.getOrientation();
        if (this.reverseOrder) {
            colorDomain = colorDomain.slice().reverse();
        }
        const format = this.getLabelFormatter(colorDomain);
        const setTextPosition = (node, index) => {
            const t = index / (colorDomain.length - 1);
            if (orientation === 'vertical') {
                node.textAlign = 'start';
                node.textBaseline = 'middle';
                node.x = gradientBox.width + padding;
                node.y = gradientBox.y + gradientBox.height * (1 - t);
            }
            else {
                node.textAlign = 'center';
                node.textBaseline = 'top';
                node.x = gradientBox.x + gradientBox.width * t;
                node.y = gradientBox.height + padding;
            }
        };
        const tempText = new Text$4();
        tempText.fontFamily = label.fontFamily;
        tempText.fontSize = label.fontSize;
        tempText.fontStyle = label.fontStyle;
        tempText.fontWeight = label.fontWeight;
        const boxes = colorDomain.map((n, i) => {
            tempText.text = format(n);
            setTextPosition(tempText, i);
            return tempText.computeBBox();
        });
        const textsCollide = boxes.some((box) => {
            return boxes.some((other) => {
                return box !== other && box.collidesBBox(other);
            });
        });
        this.textSelection.update(colorDomain).each((node, datum, i) => {
            const t = i / (colorDomain.length - 1);
            if (textsCollide && t > 0 && t < 1) {
                node.visible = false;
                return;
            }
            node.visible = true;
            node.text = format(datum);
            node.fill = label.color;
            node.fontFamily = label.fontFamily;
            node.fontSize = label.fontSize;
            node.fontStyle = label.fontStyle;
            node.fontWeight = label.fontWeight;
            setTextPosition(node, i);
        });
    }
    updateArrow(colorDomain, gradientBox) {
        const { arrow, reverseOrder } = this;
        const highlighted = this.highlightManager.getActiveHighlight();
        const colorValue = highlighted === null || highlighted === void 0 ? void 0 : highlighted.colorValue;
        if (highlighted == null || colorValue == null) {
            arrow.visible = false;
            return;
        }
        let t;
        const i = colorDomain.findIndex((d) => colorValue < d);
        if (i === 0) {
            t = 0;
        }
        else if (i < 0) {
            t = 1;
        }
        else {
            const d0 = colorDomain[i - 1];
            const d1 = colorDomain[i];
            t = (i - 1 + (colorValue - d0) / (d1 - d0)) / (colorDomain.length - 1);
        }
        if (reverseOrder) {
            t = 1 - t;
        }
        const orientation = this.getOrientation();
        const size = this.stop.label.fontSize;
        let x;
        let y;
        let rotation;
        if (orientation === 'horizontal') {
            x = gradientBox.x + gradientBox.width * t;
            y = gradientBox.y - size / 2;
            rotation = Math.PI;
        }
        else {
            x = gradientBox.x - size / 2;
            y = gradientBox.y + gradientBox.height * (1 - t);
            rotation = Math.PI / 2;
        }
        arrow.fill = this.stop.label.color;
        arrow.size = size;
        arrow.translationX = x;
        arrow.translationY = y;
        arrow.rotation = rotation;
        arrow.visible = true;
    }
    getLabelFormatter(colorDomain) {
        const formatter = this.stop.label.formatter;
        if (formatter) {
            return (d) => this.ctx.callbackCache.call(formatter, { value: d });
        }
        const d = colorDomain;
        const step = d.length > 1 ? (d[1] - d[0]) / d.length : 0;
        const l = Math.floor(Math.log10(Math.abs(step)));
        return (x) => (typeof x === 'number' ? x.toFixed(l < 0 ? -l : 0) : String(x));
    }
    measureMaxText(colorDomain) {
        const { label } = this.stop;
        const tempText = new Text$4();
        const format = this.getLabelFormatter(colorDomain);
        const boxes = colorDomain.map((d) => {
            const text = format(d);
            tempText.text = text;
            tempText.fill = label.color;
            tempText.fontFamily = label.fontFamily;
            tempText.fontSize = label.fontSize;
            tempText.fontStyle = label.fontStyle;
            tempText.fontWeight = label.fontWeight;
            return tempText.computeBBox();
        });
        const maxWidth = Math.max(...boxes.map((b) => b.width));
        const maxHeight = Math.max(...boxes.map((b) => b.height));
        return [maxWidth, maxHeight];
    }
    computeBBox() {
        return this.group.computeBBox();
    }
    onChartHoverChange() {
        if (this.enabled && this.latestGradientBox && this.latestColorDomain) {
            this.updateArrow(this.latestColorDomain, this.latestGradientBox);
        }
    }
}
GradientLegend.className = 'GradientLegend';
__decorate([
    Validate$e(BOOLEAN$2),
    __metadata("design:type", Object)
], GradientLegend.prototype, "enabled", void 0);
__decorate([
    Validate$e(POSITION),
    __metadata("design:type", String)
], GradientLegend.prototype, "position", void 0);
__decorate([
    Validate$e(OPT_BOOLEAN),
    __metadata("design:type", Boolean)
], GradientLegend.prototype, "reverseOrder", void 0);
__decorate([
    Validate$e(NUMBER$b(0)),
    __metadata("design:type", Object)
], GradientLegend.prototype, "spacing", void 0);

const BOTTOM = 'bottom';
const GRADIENT_LEGEND_THEME = {
    position: BOTTOM,
    spacing: 20,
    stop: {
        padding: 8,
        label: {
            color: agChartsCommunity._Theme.DEFAULT_LABEL_COLOUR,
            fontStyle: undefined,
            fontWeight: undefined,
            fontSize: 12,
            fontFamily: agChartsCommunity._Theme.DEFAULT_FONT_FAMILY,
            formatter: undefined,
        },
    },
    gradient: {
        preferredLength: 100,
        thickness: 16,
    },
    reverseOrder: false,
};

const GradientLegendModule = {
    type: 'legend',
    optionsKey: 'gradientLegend',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    identifier: 'gradient',
    instanceConstructor: GradientLegend,
    themeTemplate: GRADIENT_LEGEND_THEME,
};

class MD5 {
    constructor() {
        this.ieCompatibility = false;
    }
    init() {
        this.ieCompatibility = this.md5('hello') != '5d41402abc4b2a76b9719d911017c592';
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
        return this.add32((a << s) | (a >>> (32 - s)), b);
    }
    ff(a, b, c, d, x, s, t) {
        return this.cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    gg(a, b, c, d, x, s, t) {
        return this.cmn((b & d) | (c & ~d), a, b, x, s, t);
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
        tail[i >> 2] |= 0x80 << (i % 4 << 3);
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
        /* I figured global was faster.   */
        const md5blks = [];
        /* Andy King said do it this way. */
        for (let i = 0; i < 64; i += 4) {
            md5blks[i >> 2] =
                s.charCodeAt(i) +
                    (s.charCodeAt(i + 1) << 8) +
                    (s.charCodeAt(i + 2) << 16) +
                    (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }
    rhex(n) {
        const hex_chr = '0123456789abcdef'.split('');
        let s = '', j = 0;
        for (; j < 4; j++) {
            s += hex_chr[(n >> (j * 8 + 4)) & 0x0f] + hex_chr[(n >> (j * 8)) & 0x0f];
        }
        return s;
    }
    hex(x) {
        for (let i = 0; i < x.length; i++) {
            x[i] = this.rhex(x[i]);
        }
        return x.join('');
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
        return (a + b) & 0xffffffff;
    }
    add32Compat(x, y) {
        const lsw = (x & 0xffff) + (y & 0xffff), msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xffff);
    }
}

/* eslint-disable sonarjs/no-duplicate-string */
// move to general utils
function missingOrEmpty(value) {
    return value == null || value.length === 0;
}
function exists(value, allowEmptyString = false) {
    return value != null && (value !== '' || allowEmptyString);
}
const LICENSE_TYPES = {
    '01': 'GRID',
    '02': 'CHARTS',
    '0102': 'BOTH',
};
class LicenseManager {
    constructor(document) {
        this.watermarkMessage = undefined;
        this.document = document;
        this.md5 = new MD5();
        this.md5.init();
    }
    validateLicense() {
        const licenseDetails = this.getLicenseDetails(this.licenseKey);
        if (licenseDetails.missing) {
            if (!this.isWebsiteUrl() || this.isForceWatermark()) {
                this.outputMissingLicenseKey();
            }
        }
        else if (!licenseDetails.valid) {
            this.outputInvalidLicenseKey(licenseDetails.incorrectLicenseType, licenseDetails.licenseType);
        }
        else if (licenseDetails.isTrial && licenseDetails.trialExpired) {
            this.outputExpiredTrialKey(licenseDetails.expiry);
        }
        else if (licenseDetails.expired) {
            const chartsReleaseDate = LicenseManager.getchartsReleaseDate();
            const formattedReleaseDate = LicenseManager.formatDate(chartsReleaseDate);
            this.outputIncompatibleVersion(licenseDetails.expiry, formattedReleaseDate);
        }
    }
    static extractExpiry(license) {
        const restrictionHashed = license.substring(license.lastIndexOf('_') + 1, license.length);
        return new Date(parseInt(LicenseManager.decode(restrictionHashed), 10));
    }
    static extractLicenseComponents(licenseKey) {
        // when users copy the license key from a PDF extra zero width characters are sometimes copied too
        // carriage returns and line feeds are problematic too
        // all of which causes license key validation to fail - strip these out
        let cleanedLicenseKey = licenseKey.replace(/[\u200B-\u200D\uFEFF]/g, '');
        cleanedLicenseKey = cleanedLicenseKey.replace(/\r?\n|\r/g, '');
        // the hash that follows the key is 32 chars long
        if (licenseKey.length <= 32) {
            return { md5: null, license: licenseKey, version: null, isTrial: null };
        }
        const hashStart = cleanedLicenseKey.length - 32;
        const md5 = cleanedLicenseKey.substring(hashStart);
        const license = cleanedLicenseKey.substring(0, hashStart);
        const [version, isTrial, type] = LicenseManager.extractBracketedInformation(cleanedLicenseKey);
        return { md5, license, version, isTrial, type };
    }
    getLicenseDetails(licenseKey) {
        if (missingOrEmpty(licenseKey)) {
            return {
                licenseKey,
                valid: false,
                missing: true,
            };
        }
        const chartsReleaseDate = LicenseManager.getchartsReleaseDate();
        const { md5, license, version, isTrial, type } = LicenseManager.extractLicenseComponents(licenseKey);
        let valid = md5 === this.md5.md5(license) && licenseKey.indexOf('For_Trialing_ag-Grid_Only') === -1;
        let trialExpired = undefined;
        let expired = undefined;
        let expiry = null;
        let incorrectLicenseType = undefined;
        let licenseType = undefined;
        function handleTrial() {
            const now = new Date();
            trialExpired = expiry < now;
            expired = undefined;
        }
        if (valid) {
            expiry = LicenseManager.extractExpiry(license);
            valid = !isNaN(expiry.getTime());
            if (valid) {
                expired = chartsReleaseDate > expiry;
                switch (version) {
                    case 'legacy':
                    case '2': {
                        valid = false;
                        break;
                    }
                    case '3': {
                        if (missingOrEmpty(type)) {
                            valid = false;
                        }
                        else {
                            if (type !== LICENSE_TYPES['02'] && type !== LICENSE_TYPES['0102']) {
                                valid = false;
                                incorrectLicenseType = true;
                                licenseType = type;
                            }
                            else if (isTrial) {
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
                licenseType,
            };
        }
        return {
            licenseKey,
            valid,
            expiry: LicenseManager.formatDate(expiry),
            expired,
            version,
            isTrial,
            trialExpired,
        };
    }
    isDisplayWatermark() {
        return (this.isForceWatermark() ||
            (!this.isLocalhost() && !this.isWebsiteUrl() && !missingOrEmpty(this.watermarkMessage)));
    }
    getWatermarkMessage() {
        return this.watermarkMessage || '';
    }
    getHostname() {
        if (!this.document) {
            return 'localhost';
        }
        const win = this.document.defaultView || window;
        if (!win) {
            return 'localhost';
        }
        const loc = win.location;
        const { hostname = '' } = loc;
        return hostname;
    }
    isForceWatermark() {
        var _a, _b;
        if (!this.document) {
            return false;
        }
        const win = ((_b = (_a = this.document) === null || _a === void 0 ? void 0 : _a.defaultView) !== null && _b !== void 0 ? _b : typeof window != 'undefined') ? window : undefined;
        if (!win) {
            return false;
        }
        const { pathname } = win.location;
        return pathname ? pathname.indexOf('forceWatermark') !== -1 : false;
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
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        return day + ' ' + monthNames[monthIndex] + ' ' + year;
    }
    static getchartsReleaseDate() {
        return new Date(parseInt(LicenseManager.decode(LicenseManager.RELEASE_INFORMATION), 10));
    }
    static decode(input) {
        const keystr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let t = '';
        let n, r, i;
        let s, o, u, a;
        let f = 0;
        const e = input.replace(/[^A-Za-z0-9+/=]/g, '');
        while (f < e.length) {
            s = keystr.indexOf(e.charAt(f++));
            o = keystr.indexOf(e.charAt(f++));
            u = keystr.indexOf(e.charAt(f++));
            a = keystr.indexOf(e.charAt(f++));
            n = (s << 2) | (o >> 4);
            r = ((o & 15) << 4) | (u >> 2);
            i = ((u & 3) << 6) | a;
            t = t + String.fromCharCode(n);
            if (u != 64) {
                t = t + String.fromCharCode(r);
            }
            if (a != 64) {
                t = t + String.fromCharCode(i);
            }
        }
        t = LicenseManager.utf8_decode(t);
        return t;
    }
    static utf8_decode(input) {
        input = input.replace(/rn/g, 'n');
        let t = '';
        for (let n = 0; n < input.length; n++) {
            const r = input.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
            }
            else if (r > 127 && r < 2048) {
                t += String.fromCharCode((r >> 6) | 192);
                t += String.fromCharCode((r & 63) | 128);
            }
            else {
                t += String.fromCharCode((r >> 12) | 224);
                t += String.fromCharCode(((r >> 6) & 63) | 128);
                t += String.fromCharCode((r & 63) | 128);
            }
        }
        return t;
    }
    setLicenseKey(licenseKey) {
        this.licenseKey = licenseKey;
    }
    static extractBracketedInformation(licenseKey) {
        // legacy no trial key
        if (!licenseKey.includes('[')) {
            return ['legacy', false, undefined];
        }
        const matches = licenseKey.match(/\[(.*?)\]/g).map((match) => match.replace('[', '').replace(']', ''));
        if (!matches || matches.length === 0) {
            return ['legacy', false, undefined];
        }
        const isTrial = matches.filter((match) => match === 'TRIAL').length === 1;
        const rawVersion = matches.filter((match) => match.indexOf('v') === 0)[0];
        const version = rawVersion ? rawVersion.replace('v', '') : 'legacy';
        const type = LICENSE_TYPES[matches.filter((match) => LICENSE_TYPES[match])[0]];
        return [version, isTrial, type];
    }
    outputInvalidLicenseKey(incorrectLicenseType, licenseType) {
        console.error('*****************************************************************************************************************');
        console.error('***************************************** AG Charts Enterprise License *******************************************');
        console.error('********************************************* Invalid License ***************************************************');
        if (exists(incorrectLicenseType) && incorrectLicenseType && licenseType === 'GRID') {
            console.error('* The license supplied is for AG Grid Enterprise Only and does not cover AG Charts Enterprise                    *');
        }
        console.error('* Your license for AG Charts Enterprise is not valid - please contact info@ag-grid.com to obtain a valid license. *');
        console.error('*****************************************************************************************************************');
        console.error('*****************************************************************************************************************');
        this.watermarkMessage = 'Invalid License';
    }
    outputExpiredTrialKey(formattedExpiryDate) {
        console.error('****************************************************************************************************************');
        console.error('***************************************** AG Charts Enterprise License *******************************************');
        console.error('*****************************************   Trial Period Expired.    *******************************************');
        console.error(`* Your license for AG Charts Enterprise expired on ${formattedExpiryDate}.                                                *`);
        console.error('* Please email info@ag-grid.com to purchase a license.                                                         *');
        console.error('****************************************************************************************************************');
        console.error('****************************************************************************************************************');
        this.watermarkMessage = 'Trial Period Expired';
    }
    outputMissingLicenseKey() {
        console.error('****************************************************************************************************************');
        console.error('***************************************** AG Charts Enterprise License *******************************************');
        console.error('****************************************** License Key Not Found ***********************************************');
        console.error('* All AG Charts Enterprise features are unlocked.                                                                *');
        console.error('* This is an evaluation only version, it is not licensed for development projects intended for production.     *');
        console.error('* If you want to hide the watermark, please email info@ag-grid.com for a trial license.                        *');
        console.error('****************************************************************************************************************');
        console.error('****************************************************************************************************************');
        this.watermarkMessage = 'For Trial Use Only';
    }
    outputIncompatibleVersion(formattedExpiryDate, formattedReleaseDate) {
        console.error('****************************************************************************************************************************');
        console.error('****************************************************************************************************************************');
        console.error('*                                             AG Charts Enterprise License                                                   *');
        console.error('*                           License not compatible with installed version of AG Charts Enterprise.                           *');
        console.error('*                                                                                                                          *');
        console.error(`* Your AG Charts License entitles you to all versions of AG Charts that we release within the time covered by your license     *`);
        console.error(`* - typically we provide one year licenses which entitles you to all releases / updates of AG Charts within that year.       *`);
        console.error(`* Your license has an end (expiry) date which stops the license key working with versions of AG Charts released after the    *`);
        console.error(`* license end date. The license key that you have expires on ${formattedExpiryDate}, however the version of AG Charts you    *`);
        console.error(`* are trying to use was released on ${formattedReleaseDate}.                                                               *`);
        console.error('*                                                                                                                          *');
        console.error('* Please contact info@ag-grid.com to renew your subscription to new versions and get a new license key to work with this   *');
        console.error('* version of AG Charts.                                                                                                      *');
        console.error('****************************************************************************************************************************');
        console.error('****************************************************************************************************************************');
        this.watermarkMessage = 'License Expired';
    }
}
LicenseManager.RELEASE_INFORMATION = 'MTcwMDc2MzcxODkzNg==';

const { injectStyle } = agChartsCommunity._ModuleSupport;
const watermarkStyles = `
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
function injectWatermark(document, parentElement, text) {
    injectStyle(document, watermarkStyles);
    const element = document.createElement('div');
    const textElement = document.createElement('span');
    textElement.innerText = text;
    element.addEventListener('animationend', () => parentElement.removeChild(element));
    element.classList.add('ag-watermark');
    element.appendChild(textElement);
    parentElement.appendChild(element);
}

const { CARTESIAN_AXIS_TYPES: CARTESIAN_AXIS_TYPES$5, CARTESIAN_AXIS_POSITIONS: CARTESIAN_AXIS_POSITIONS$6 } = agChartsCommunity._Theme;
const BOX_PLOT_SERIES_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES$5.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS$6.LEFT,
            crosshair: {
                snap: false,
            },
        },
        {
            type: CARTESIAN_AXIS_TYPES$5.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS$6.BOTTOM,
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: false,
                snap: false,
            },
        },
    ],
};

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

var GroupTags;
(function (GroupTags) {
    GroupTags[GroupTags["Box"] = 0] = "Box";
    GroupTags[GroupTags["Median"] = 1] = "Median";
    GroupTags[GroupTags["Outline"] = 2] = "Outline";
    GroupTags[GroupTags["Whisker"] = 3] = "Whisker";
    GroupTags[GroupTags["Cap"] = 4] = "Cap";
})(GroupTags || (GroupTags = {}));
class BoxPlotGroup extends agChartsCommunity._Scene.Group {
    constructor() {
        super();
        this.append([
            new agChartsCommunity._Scene.Rect({ tag: GroupTags.Box }),
            new agChartsCommunity._Scene.Rect({ tag: GroupTags.Box }),
            new agChartsCommunity._Scene.Rect({ tag: GroupTags.Outline }),
            new agChartsCommunity._Scene.Rect({ tag: GroupTags.Median }),
            new agChartsCommunity._Scene.Line({ tag: GroupTags.Whisker }),
            new agChartsCommunity._Scene.Line({ tag: GroupTags.Whisker }),
            new agChartsCommunity._Scene.Line({ tag: GroupTags.Cap }),
            new agChartsCommunity._Scene.Line({ tag: GroupTags.Cap }),
        ]);
    }
    updateDatumStyles(datum, activeStyles, isVertical) {
        const { bandwidth, scaledValues: { xValue: axisValue, medianValue }, } = datum;
        let { minValue, q1Value, q3Value, maxValue } = datum.scaledValues;
        if (isVertical) {
            [maxValue, q3Value, q1Value, minValue] = [minValue, q1Value, q3Value, maxValue];
        }
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker: whiskerStyles, } = activeStyles;
        const selection = agChartsCommunity._Scene.Selection.select(this, agChartsCommunity._Scene.Rect);
        const boxes = selection.selectByTag(GroupTags.Box);
        const [outline] = selection.selectByTag(GroupTags.Outline);
        const [median] = selection.selectByTag(GroupTags.Median);
        const whiskers = selection.selectByTag(GroupTags.Whisker);
        const caps = selection.selectByTag(GroupTags.Cap);
        if (whiskerStyles.strokeWidth > bandwidth) {
            whiskerStyles.strokeWidth = bandwidth;
        }
        outline.setProperties({ x: q1Value, y: axisValue, width: q3Value - q1Value, height: bandwidth });
        boxes[0].setProperties({
            x: q1Value,
            y: axisValue,
            width: Math.round(medianValue - q1Value + strokeWidth / 2),
            height: bandwidth,
        });
        boxes[1].setProperties({
            x: Math.round(medianValue - strokeWidth / 2),
            y: axisValue,
            width: Math.floor(q3Value - medianValue + strokeWidth / 2),
            height: bandwidth,
        });
        const medianStart = Math.max(Math.round(medianValue - strokeWidth / 2), q1Value + strokeWidth);
        const medianEnd = Math.min(Math.round(medianValue + strokeWidth / 2), q3Value - strokeWidth);
        median.setProperties({
            visible: medianStart < medianEnd,
            x: medianStart,
            y: axisValue + strokeWidth,
            width: medianEnd - medianStart,
            height: Math.max(0, bandwidth - strokeWidth * 2),
        });
        const capStart = Math.floor(axisValue + (bandwidth * (1 - cap.lengthRatio)) / 2);
        const capEnd = Math.ceil(axisValue + (bandwidth * (1 + cap.lengthRatio)) / 2);
        caps[0].setProperties({ x: minValue, y1: capStart, y2: capEnd });
        caps[1].setProperties({ x: maxValue, y1: capStart, y2: capEnd });
        whiskers[0].setProperties({
            x1: Math.round(minValue + whiskerStyles.strokeWidth / 2),
            x2: q1Value,
            y: Math.floor(axisValue + bandwidth / 2),
        });
        whiskers[1].setProperties({
            x1: q3Value,
            x2: Math.round(maxValue - whiskerStyles.strokeWidth / 2),
            y: Math.floor(axisValue + bandwidth / 2),
        });
        if (isVertical) {
            agChartsCommunity._ModuleSupport.invertShapeDirection(outline, median, ...boxes, ...caps, ...whiskers);
        }
        // fill only elements
        for (const element of boxes) {
            element.setProperties({ fill, fillOpacity, strokeWidth: strokeWidth * 2, strokeOpacity: 0 });
        }
        median.setProperties({ fill: stroke, fillOpacity: strokeOpacity, strokeWidth: 0 });
        // stroke only elements
        for (const element of [...whiskers, ...caps]) {
            element.setProperties(whiskerStyles);
        }
        outline.setProperties({ stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, fillOpacity: 0 });
    }
}

const { extent: extent$3, extractDecoratedProperties, fixNumericExtent: fixNumericExtent$6, keyProperty: keyProperty$6, mergeDefaults: mergeDefaults$1, NUMBER: NUMBER$a, OPT_COLOR_STRING: OPT_COLOR_STRING$a, OPT_FUNCTION: OPT_FUNCTION$8, OPT_LINE_DASH: OPT_LINE_DASH$6, OPT_STRING: OPT_STRING$a, SeriesNodePickMode: SeriesNodePickMode$4, SeriesTooltip: SeriesTooltip$2, SMALLEST_KEY_INTERVAL: SMALLEST_KEY_INTERVAL$1, Validate: Validate$d, valueProperty: valueProperty$8, diff: diff$5, animationValidation: animationValidation$7, } = agChartsCommunity._ModuleSupport;
const { motion: motion$7 } = agChartsCommunity._Scene;
class BoxPlotSeriesNodeClickEvent extends agChartsCommunity._ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.xKey;
        this.minKey = series.minKey;
        this.q1Key = series.q1Key;
        this.medianKey = series.medianKey;
        this.q3Key = series.q3Key;
        this.maxKey = series.maxKey;
    }
}
class BoxPlotSeriesCap {
    constructor() {
        this.lengthRatio = 0.5;
    }
}
__decorate([
    Validate$d(NUMBER$a(0, 1)),
    __metadata("design:type", Object)
], BoxPlotSeriesCap.prototype, "lengthRatio", void 0);
class BoxPlotSeriesWhisker {
}
__decorate([
    Validate$d(OPT_COLOR_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeriesWhisker.prototype, "stroke", void 0);
__decorate([
    Validate$d(NUMBER$a(0)),
    __metadata("design:type", Number)
], BoxPlotSeriesWhisker.prototype, "strokeWidth", void 0);
__decorate([
    Validate$d(NUMBER$a(0, 1)),
    __metadata("design:type", Number)
], BoxPlotSeriesWhisker.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$d(OPT_LINE_DASH$6),
    __metadata("design:type", Array)
], BoxPlotSeriesWhisker.prototype, "lineDash", void 0);
__decorate([
    Validate$d(NUMBER$a(0)),
    __metadata("design:type", Number)
], BoxPlotSeriesWhisker.prototype, "lineDashOffset", void 0);
class BoxPlotSeries extends agChartsCommunity._ModuleSupport.AbstractBarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode$4.EXACT_SHAPE_MATCH],
            pathsPerSeries: 1,
            hasHighlightedLabels: true,
        });
        this.xKey = undefined;
        this.xName = undefined;
        this.yName = undefined;
        this.minKey = undefined;
        this.minName = undefined;
        this.q1Key = undefined;
        this.q1Name = undefined;
        this.medianKey = undefined;
        this.medianName = undefined;
        this.q3Key = undefined;
        this.q3Name = undefined;
        this.maxKey = undefined;
        this.maxName = undefined;
        this.fill = '#c16068';
        this.fillOpacity = 1;
        this.stroke = '#333';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.formatter = undefined;
        this.NodeClickEvent = BoxPlotSeriesNodeClickEvent;
        this.cap = new BoxPlotSeriesCap();
        this.whisker = new BoxPlotSeriesWhisker();
        this.tooltip = new SeriesTooltip$2();
        /**
         * Used to get the position of items within each group.
         */
        this.groupScale = new agChartsCommunity._Scale.BandScale();
        this.smallestDataInterval = undefined;
    }
    processData(dataController) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const { xKey, minKey, q1Key, medianKey, q3Key, maxKey, data = [] } = this;
            if (!xKey || !minKey || !q1Key || !medianKey || !q3Key || !maxKey)
                return;
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const isContinuousX = ((_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale) instanceof agChartsCommunity._Scale.ContinuousScale;
            const extraProps = [];
            if (animationEnabled && this.processedData) {
                extraProps.push(diff$5(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation$7(this));
            }
            const { processedData } = yield this.requestDataModel(dataController, data, {
                props: [
                    keyProperty$6(this, xKey, isContinuousX, { id: `xValue` }),
                    valueProperty$8(this, minKey, true, { id: `minValue` }),
                    valueProperty$8(this, q1Key, true, { id: `q1Value` }),
                    valueProperty$8(this, medianKey, true, { id: `medianValue` }),
                    valueProperty$8(this, q3Key, true, { id: `q3Value` }),
                    valueProperty$8(this, maxKey, true, { id: `maxValue` }),
                    ...(isContinuousX ? [SMALLEST_KEY_INTERVAL$1] : []),
                    ...extraProps,
                ],
                dataVisible: this.visible,
            });
            this.smallestDataInterval = {
                x: (_c = (_b = processedData.reduced) === null || _b === void 0 ? void 0 : _b.smallestKeyInterval) !== null && _c !== void 0 ? _c : Infinity,
                y: Infinity,
            };
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        var _a;
        const { processedData, dataModel, smallestDataInterval } = this;
        if (!(processedData && dataModel))
            return [];
        if (direction === this.getBarDirection()) {
            const minValues = dataModel.getDomain(this, `minValue`, 'value', processedData);
            const maxValues = dataModel.getDomain(this, `maxValue`, 'value', processedData);
            return fixNumericExtent$6([Math.min(...minValues), Math.max(...maxValues)], this.getValueAxis());
        }
        const { index, def } = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const keys = processedData.domain.keys[index];
        if (def.type === 'key' && def.valueType === 'category') {
            return keys;
        }
        const keysExtent = (_a = extent$3(keys)) !== null && _a !== void 0 ? _a : [NaN, NaN];
        const scalePadding = smallestDataInterval && isFinite(smallestDataInterval.x) ? smallestDataInterval.x : 0;
        return fixNumericExtent$6([keysExtent[0] - scalePadding, keysExtent[1]], this.getCategoryAxis());
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { visible, dataModel } = this;
            const xAxis = this.getCategoryAxis();
            const yAxis = this.getValueAxis();
            if (!(dataModel && visible && xAxis && yAxis)) {
                return [];
            }
            const { xKey = '', fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker, groupScale, ctx: { seriesStateManager }, smallestDataInterval, } = this;
            const xBandWidth = xAxis.scale instanceof agChartsCommunity._Scale.ContinuousScale
                ? xAxis.scale.calcBandwidth(smallestDataInterval === null || smallestDataInterval === void 0 ? void 0 : smallestDataInterval.x)
                : xAxis.scale.bandwidth;
            const domain = [];
            const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
            for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
                domain.push(String(groupIdx));
            }
            groupScale.domain = domain;
            groupScale.range = [0, xBandWidth !== null && xBandWidth !== void 0 ? xBandWidth : 0];
            if (xAxis instanceof agChartsCommunity._ModuleSupport.CategoryAxis) {
                groupScale.paddingInner = xAxis.groupPaddingInner;
            }
            const barWidth = groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume bar charts.
                    groupScale.bandwidth
                : // Handle high-volume bar charts gracefully.
                    groupScale.rawBandwidth;
            const nodeData = [];
            const defs = dataModel.resolveProcessedDataDefsByIds(this, [
                'xValue',
                'minValue',
                'q1Value',
                `medianValue`,
                `q3Value`,
                `maxValue`,
            ]);
            (_a = this.processedData) === null || _a === void 0 ? void 0 : _a.data.forEach(({ datum, keys, values }) => {
                const { xValue, minValue, q1Value, medianValue, q3Value, maxValue } = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
                if ([minValue, q1Value, medianValue, q3Value, maxValue].some((value) => typeof value !== 'number') ||
                    minValue > q1Value ||
                    q1Value > medianValue ||
                    medianValue > q3Value ||
                    q3Value > maxValue) {
                    return;
                }
                const scaledValues = this.convertValuesToScaleByDefs(defs, {
                    xValue,
                    minValue,
                    q1Value,
                    medianValue,
                    q3Value,
                    maxValue,
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
                    lineDashOffset,
                });
            });
            return [{ itemId: xKey, nodeData, labelData: [], scales: _super.calculateScaling.call(this), visible: this.visible }];
        });
    }
    getLegendData(legendType) {
        var _a;
        const { id, data, xKey, yName, showInLegend, visible, legendItemName, fill, stroke, fillOpacity, strokeOpacity, strokeWidth, } = this;
        if (!(showInLegend && (data === null || data === void 0 ? void 0 : data.length) && xKey && legendType === 'category')) {
            return [];
        }
        return [
            {
                legendType: 'category',
                id,
                itemId: id,
                seriesId: id,
                enabled: visible,
                label: {
                    text: (_a = legendItemName !== null && legendItemName !== void 0 ? legendItemName : yName) !== null && _a !== void 0 ? _a : id,
                },
                legendItemName,
                marker: { fill, fillOpacity, stroke, strokeOpacity, strokeWidth },
            },
        ];
    }
    getTooltipHtml(nodeDatum) {
        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey, xName, yName, minName, q1Name, medianName, q3Name, maxName, id: seriesId, } = this;
        const { datum } = nodeDatum;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!xAxis || !yAxis || !xKey || !minKey || !q1Key || !medianKey || !q3Key || !maxKey)
            return '';
        const title = agChartsCommunity._Util.sanitizeHtml(yName);
        const contentData = [
            [xKey, xName, xAxis],
            [minKey, minName, yAxis],
            [q1Key, q1Name, yAxis],
            [medianKey, medianName, yAxis],
            [q3Key, q3Name, yAxis],
            [maxKey, maxName, yAxis],
        ];
        const content = contentData
            .map(([key, name, axis]) => agChartsCommunity._Util.sanitizeHtml(`${name !== null && name !== void 0 ? name : key}: ${axis.formatDatum(datum[key])}`))
            .join(title ? '<br/>' : ', ');
        const { fill } = this.getFormattedStyles(nodeDatum);
        return this.tooltip.toTooltipHtml({ title, content, backgroundColor: fill }, {
            datum,
            seriesId,
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
        });
    }
    animateEmptyUpdateReady({ datumSelections, }) {
        const isVertical = this.direction === 'vertical';
        motion$7.resetMotion(datumSelections, resetBoxPlotSelectionsScalingCenterFn(isVertical));
        const { from, to } = prepareBoxPlotFromTo(isVertical);
        motion$7.staticFromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, from, to);
    }
    isLabelEnabled() {
        return false;
    }
    updateDatumSelection(opts) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = (_a = opts.nodeData) !== null && _a !== void 0 ? _a : [];
            return opts.datumSelection.update(data);
        });
    }
    updateDatumNodes({ datumSelection, 
    // highlightedItems,
    isHighlight: highlighted, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const isVertical = this.direction === 'vertical';
            datumSelection.each((boxPlotGroup, nodeDatum) => {
                let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);
                if (highlighted) {
                    activeStyles = mergeDefaults$1(this.highlightStyle.item, activeStyles);
                }
                const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;
                activeStyles.whisker = mergeDefaults$1(activeStyles.whisker, {
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                });
                // hide duplicates of highlighted nodes
                // boxPlotGroup.opacity =
                //     highlighted || !highlightedItems?.some((datum) => datum.itemId === nodeDatum.itemId) ? 1 : 0;
                boxPlotGroup.updateDatumStyles(nodeDatum, activeStyles, isVertical);
            });
        });
    }
    updateLabelNodes(_opts) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelData, labelSelection } = opts;
            return labelSelection.update(labelData);
        });
    }
    nodeFactory() {
        return new BoxPlotGroup();
    }
    getFormattedStyles(nodeDatum, highlighted = false) {
        const { xKey = '', minKey = '', q1Key = '', medianKey = '', q3Key = '', maxKey = '', formatter, id: seriesId, ctx: { callbackCache }, } = this;
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
            whisker: extractDecoratedProperties(whisker),
        };
        if (formatter) {
            const formatStyles = callbackCache.call(formatter, Object.assign(Object.assign({ datum,
                seriesId,
                highlighted }, activeStyles), { xKey,
                minKey,
                q1Key,
                medianKey,
                q3Key,
                maxKey }));
            if (formatStyles) {
                return mergeDefaults$1(formatStyles, activeStyles);
            }
        }
        return activeStyles;
    }
    convertValuesToScaleByDefs(defs, values) {
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!(xAxis && yAxis)) {
            throw new Error('Axes must be defined');
        }
        const result = {};
        for (const [searchId, [{ def }]] of defs) {
            if (Object.prototype.hasOwnProperty.call(values, searchId)) {
                const { scale } = def.type === 'key' ? xAxis : yAxis;
                result[searchId] = Math.round(scale.convert(values[searchId]));
            }
        }
        return result;
    }
}
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "xKey", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "xName", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "yName", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "minKey", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "minName", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "q1Key", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "q1Name", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "medianKey", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "medianName", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "q3Key", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "q3Name", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "maxKey", void 0);
__decorate([
    Validate$d(OPT_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "maxName", void 0);
__decorate([
    Validate$d(OPT_COLOR_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "fill", void 0);
__decorate([
    Validate$d(NUMBER$a(0, 1)),
    __metadata("design:type", Object)
], BoxPlotSeries.prototype, "fillOpacity", void 0);
__decorate([
    Validate$d(OPT_COLOR_STRING$a),
    __metadata("design:type", String)
], BoxPlotSeries.prototype, "stroke", void 0);
__decorate([
    Validate$d(NUMBER$a(0)),
    __metadata("design:type", Number)
], BoxPlotSeries.prototype, "strokeWidth", void 0);
__decorate([
    Validate$d(NUMBER$a(0, 1)),
    __metadata("design:type", Object)
], BoxPlotSeries.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$d(OPT_LINE_DASH$6),
    __metadata("design:type", Array)
], BoxPlotSeries.prototype, "lineDash", void 0);
__decorate([
    Validate$d(NUMBER$a(0)),
    __metadata("design:type", Number)
], BoxPlotSeries.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$d(OPT_FUNCTION$8),
    __metadata("design:type", Function)
], BoxPlotSeries.prototype, "formatter", void 0);

const BOX_PLOT_SERIES_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 2,
};

const BoxPlotModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'box-plot',
    instanceConstructor: BoxPlotSeries,
    seriesDefaults: BOX_PLOT_SERIES_DEFAULTS,
    themeTemplate: BOX_PLOT_SERIES_THEME,
    groupable: true,
    paletteFactory: ({ takeColors, userPalette, themeTemplateParameters }) => {
        var _a;
        const themeBackgroundColor = themeTemplateParameters.properties.get(agChartsCommunity._Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill = (_a = (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor)) !== null && _a !== void 0 ? _a : 'white';
        const { fills: [fill], strokes: [stroke], } = takeColors(1);
        return {
            fill: userPalette ? fill : agChartsCommunity._Util.Color.interpolate(fill, backgroundFill)(0.7),
            stroke,
        };
    },
    swapDefaultAxesCondition({ direction }) {
        return direction === 'horizontal';
    },
};

const { CARTESIAN_AXIS_TYPES: CARTESIAN_AXIS_TYPES$4, CARTESIAN_AXIS_POSITIONS: CARTESIAN_AXIS_POSITIONS$5 } = agChartsCommunity._Theme;
const BULLET_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES$4.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS$5.LEFT,
            nice: false,
            max: undefined,
            crosshair: { enabled: false },
        },
        {
            type: CARTESIAN_AXIS_TYPES$4.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS$5.BOTTOM,
        },
    ],
};

const { animationValidation: animationValidation$6, collapsedStartingBarPosition: collapsedStartingBarPosition$1, diff: diff$4, keyProperty: keyProperty$5, partialAssign, prepareBarAnimationFunctions: prepareBarAnimationFunctions$2, resetBarSelectionsFn: resetBarSelectionsFn$2, seriesLabelFadeInAnimation: seriesLabelFadeInAnimation$6, valueProperty: valueProperty$7, Validate: Validate$c, COLOR_STRING, STRING: STRING$3, LINE_DASH, NUMBER: NUMBER$9, OPT_NON_EMPTY_ARRAY, OPT_NUMBER: OPT_NUMBER$a, OPT_STRING: OPT_STRING$9, } = agChartsCommunity._ModuleSupport;
const { fromToMotion: fromToMotion$1 } = agChartsCommunity._Scene.motion;
const { sanitizeHtml: sanitizeHtml$9 } = agChartsCommunity._Util;
class BulletColorRange {
    constructor() {
        this.color = 'lightgrey';
        this.stop = undefined;
    }
}
__decorate([
    Validate$c(COLOR_STRING),
    __metadata("design:type", String)
], BulletColorRange.prototype, "color", void 0);
__decorate([
    Validate$c(OPT_NUMBER$a(0)),
    __metadata("design:type", Number)
], BulletColorRange.prototype, "stop", void 0);
const STYLING_KEYS = [
    'fill',
    'fillOpacity',
    'stroke',
    'strokeWidth',
    'strokeOpacity',
    'lineDash',
    'lineDashOffset',
];
class TargetStyle {
    constructor() {
        this.fill = 'black';
        this.fillOpacity = 1;
        this.stroke = 'black';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.lengthRatio = 0.75;
    }
}
__decorate([
    Validate$c(COLOR_STRING),
    __metadata("design:type", String)
], TargetStyle.prototype, "fill", void 0);
__decorate([
    Validate$c(NUMBER$9(0, 1)),
    __metadata("design:type", Object)
], TargetStyle.prototype, "fillOpacity", void 0);
__decorate([
    Validate$c(COLOR_STRING),
    __metadata("design:type", String)
], TargetStyle.prototype, "stroke", void 0);
__decorate([
    Validate$c(NUMBER$9(0)),
    __metadata("design:type", Object)
], TargetStyle.prototype, "strokeWidth", void 0);
__decorate([
    Validate$c(NUMBER$9(0, 1)),
    __metadata("design:type", Object)
], TargetStyle.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$c(LINE_DASH),
    __metadata("design:type", Array)
], TargetStyle.prototype, "lineDash", void 0);
__decorate([
    Validate$c(NUMBER$9(0)),
    __metadata("design:type", Number)
], TargetStyle.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$c(NUMBER$9(0, 1)),
    __metadata("design:type", Number)
], TargetStyle.prototype, "lengthRatio", void 0);
class BulletScale {
    constructor() {
        this.max = undefined; // alias for AgChartOptions.axes[0].max
    }
}
__decorate([
    Validate$c(OPT_NUMBER$a(0)),
    __metadata("design:type", Number)
], BulletScale.prototype, "max", void 0);
class BulletSeries extends agChartsCommunity._ModuleSupport.AbstractBarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [agChartsCommunity._ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            animationResetFns: {
                datum: resetBarSelectionsFn$2,
            },
        });
        this.fill = 'black';
        this.fillOpacity = 1;
        this.stroke = 'black';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.widthRatio = 0.5;
        this.target = new TargetStyle();
        this.valueKey = '';
        this.valueName = undefined;
        this.targetKey = undefined;
        this.targetName = undefined;
        this.colorRanges = [new BulletColorRange()];
        this.scale = new BulletScale();
        this.tooltip = new agChartsCommunity._ModuleSupport.SeriesTooltip();
        this.normalizedColorRanges = [];
        this.colorRangesGroup = new agChartsCommunity._Scene.Group({ name: `${this.id}-colorRanges` });
        this.colorRangesSelection = agChartsCommunity._Scene.Selection.select(this.colorRangesGroup, agChartsCommunity._Scene.Rect, false);
        this.rootGroup.append(this.colorRangesGroup);
        this.targetLinesSelection = agChartsCommunity._Scene.Selection.select(this.annotationGroup, agChartsCommunity._Scene.Line, false);
    }
    destroy() {
        this.rootGroup.removeChild(this.colorRangesGroup);
        super.destroy();
    }
    processData(dataController) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { valueKey, targetKey, data = [] } = this;
            if (!valueKey || !data)
                return;
            const isContinuousX = agChartsCommunity._Scale.ContinuousScale.is((_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale);
            const isContinuousY = agChartsCommunity._Scale.ContinuousScale.is((_b = this.getValueAxis()) === null || _b === void 0 ? void 0 : _b.scale);
            const props = [
                keyProperty$5(this, valueKey, isContinuousX, { id: 'xValue' }),
                valueProperty$7(this, valueKey, isContinuousY, { id: 'value' }),
            ];
            if (targetKey !== undefined) {
                props.push(valueProperty$7(this, targetKey, isContinuousY, { id: 'target' }));
            }
            const extraProps = [];
            if (!this.ctx.animationManager.isSkipped()) {
                if (this.processedData !== undefined) {
                    extraProps.push(diff$4(this.processedData));
                }
                extraProps.push(animationValidation$6(this));
            }
            // Bullet graphs only need 1 datum, but we keep that `data` option as array for consistency with other series
            // types and future compatibility (we may decide to support multiple datums at some point).
            yield this.requestDataModel(dataController, data.slice(0, 1), {
                props: [...props, ...extraProps],
                groupByKeys: true,
                dataVisible: this.visible,
            });
            this.animationState.transition('updateData');
        });
    }
    getBandScalePadding() {
        return { inner: 0, outer: 0 };
    }
    getMaxValue() {
        var _a, _b;
        return Math.max(...((_b = (_a = this.getValueAxis()) === null || _a === void 0 ? void 0 : _a.dataDomain.domain) !== null && _b !== void 0 ? _b : [0]));
    }
    getSeriesDomain(direction) {
        var _a, _b;
        const { dataModel, processedData, targetKey } = this;
        if (!dataModel || !processedData)
            return [];
        if (direction === this.getCategoryDirection()) {
            return [(_a = this.valueName) !== null && _a !== void 0 ? _a : this.valueKey];
        }
        else if (direction == ((_b = this.getValueAxis()) === null || _b === void 0 ? void 0 : _b.direction)) {
            const valueDomain = dataModel.getDomain(this, 'value', 'value', processedData);
            const targetDomain = targetKey === undefined ? [] : dataModel.getDomain(this, 'target', 'value', processedData);
            return [0, Math.max(...valueDomain, ...targetDomain)];
        }
        else {
            throw new Error(`unknown direction ${direction}`);
        }
    }
    getKeys(direction) {
        if (direction === this.getBarDirection()) {
            return [this.valueKey];
        }
        return super.getKeys(direction);
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const { valueKey, targetKey, dataModel, processedData, widthRatio, target: { lengthRatio }, } = this;
            const xScale = (_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale;
            const yScale = (_b = this.getValueAxis()) === null || _b === void 0 ? void 0 : _b.scale;
            if (!valueKey || !dataModel || !processedData || !xScale || !yScale)
                return [];
            if (widthRatio === undefined || lengthRatio === undefined)
                return [];
            const multiplier = (_c = xScale.bandwidth) !== null && _c !== void 0 ? _c : NaN;
            const maxValue = this.getMaxValue();
            const valueIndex = dataModel.resolveProcessedDataIndexById(this, 'value').index;
            const targetIndex = targetKey === undefined ? NaN : dataModel.resolveProcessedDataIndexById(this, 'target').index;
            const context = {
                itemId: valueKey,
                nodeData: [],
                labelData: [],
                scales: _super.calculateScaling.call(this),
                visible: this.visible,
            };
            for (const { datum, values } of processedData.data) {
                if (!Array.isArray(datum) || datum.length < 1) {
                    continue;
                }
                if (values[0][valueIndex] < 0) {
                    agChartsCommunity._Util.Logger.warnOnce('negative values are not supported, clipping to 0.');
                }
                const xValue = (_d = this.valueName) !== null && _d !== void 0 ? _d : this.valueKey;
                const yValue = Math.min(maxValue, Math.max(0, values[0][valueIndex]));
                const y = yScale.convert(yValue);
                const barWidth = widthRatio * multiplier;
                const bottomY = yScale.convert(0);
                const barAlongX = this.getBarDirection() === agChartsCommunity._ModuleSupport.ChartAxisDirection.X;
                const rect = {
                    x: (multiplier * (1.0 - widthRatio)) / 2,
                    y: Math.min(y, bottomY),
                    width: barWidth,
                    height: Math.abs(bottomY - y),
                };
                if (barAlongX) {
                    [rect.x, rect.y, rect.width, rect.height] = [rect.y, rect.x, rect.height, rect.width];
                }
                let target;
                if (values[0][targetIndex] < 0) {
                    agChartsCommunity._Util.Logger.warnOnce('negative targets are not supported, ignoring.');
                }
                if (this.targetKey && values[0][targetIndex] >= 0) {
                    const targetLineLength = lengthRatio * multiplier;
                    const targetValue = Math.min(maxValue, values[0][targetIndex]);
                    if (!isNaN(targetValue) && targetValue !== undefined) {
                        const convertedY = yScale.convert(targetValue);
                        let x1 = (multiplier * (1.0 - lengthRatio)) / 2;
                        let x2 = x1 + targetLineLength;
                        let [y1, y2] = [convertedY, convertedY];
                        if (barAlongX) {
                            [x1, x2, y1, y2] = [y1, y2, x1, x2];
                        }
                        target = { value: targetValue, x1, x2, y1, y2 };
                    }
                }
                const nodeData = Object.assign(Object.assign({ series: this, datum: datum[0], xKey: valueKey, xValue, yKey: valueKey, yValue, cumulativeValue: yValue, target }, rect), { midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } });
                context.nodeData.push(nodeData);
            }
            const sortedRanges = [...this.colorRanges].sort((a, b) => (a.stop || maxValue) - (b.stop || maxValue));
            let start = 0;
            this.normalizedColorRanges = sortedRanges.map((item) => {
                var _a;
                const stop = Math.min(maxValue, (_a = item.stop) !== null && _a !== void 0 ? _a : Infinity);
                const result = { color: item.color, start, stop };
                start = stop;
                return result;
            });
            return [context];
        });
    }
    getLegendData(_legendType) {
        return [];
    }
    getTooltipHtml(nodeDatum) {
        const { valueKey, valueName, targetKey, targetName } = this;
        const axis = this.getValueAxis();
        const { yValue: valueValue, target: { value: targetValue } = { value: undefined }, datum } = nodeDatum;
        if (valueKey === undefined || valueValue === undefined || axis === undefined) {
            return '';
        }
        const makeLine = (key, name, value) => {
            const nameString = sanitizeHtml$9(name !== null && name !== void 0 ? name : key);
            const valueString = sanitizeHtml$9(axis.formatDatum(value));
            return `<b>${nameString}</b>: ${valueString}`;
        };
        const title = undefined;
        const content = targetKey === undefined || targetValue === undefined
            ? makeLine(valueKey, valueName, valueValue)
            : `${makeLine(valueKey, valueName, valueValue)}<br/>${makeLine(targetKey, targetName, targetValue)}`;
        return this.tooltip.toTooltipHtml({ title, content }, { datum, title, seriesId: this.id, valueKey, valueName, targetKey, targetName });
    }
    isLabelEnabled() {
        return false;
    }
    nodeFactory() {
        return new agChartsCommunity._Scene.Rect();
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.targetLinesSelection.update(opts.nodeData, undefined, undefined);
            return opts.datumSelection.update(opts.nodeData, undefined, undefined);
        });
    }
    updateDatumNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            // The translation of the rectangles (values) is updated by the animation manager.
            // The target lines aren't animated, therefore we must update the translation here.
            for (const { node } of opts.datumSelection) {
                const style = this;
                partialAssign(STYLING_KEYS, node, style);
            }
            for (const { node, datum } of this.targetLinesSelection) {
                if (datum.target !== undefined) {
                    const style = this.target;
                    partialAssign(['x1', 'x2', 'y1', 'y2'], node, datum.target);
                    partialAssign(STYLING_KEYS, node, style);
                }
                else {
                    node.visible = false;
                }
            }
        });
    }
    updateColorRanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const valAxis = this.getValueAxis();
            const catAxis = this.getCategoryAxis();
            if (!valAxis || !catAxis)
                return;
            const [min, max] = [0, Math.max(...catAxis.scale.range)];
            const computeRect = this.getBarDirection() === agChartsCommunity._ModuleSupport.ChartAxisDirection.Y
                ? (rect, colorRange) => {
                    rect.x = min;
                    rect.y = valAxis.scale.convert(colorRange.stop);
                    rect.height = valAxis.scale.convert(colorRange.start) - rect.y;
                    rect.width = max;
                }
                : (rect, colorRange) => {
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
        const _super = Object.create(null, {
            updateNodes: { get: () => super.updateNodes }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.updateNodes.call(this, highlightedItems, seriesHighlighted, anySeriesItemEnabled);
            yield this.updateColorRanges();
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return opts.labelSelection;
        });
    }
    updateLabelNodes(_opts) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    animateEmptyUpdateReady(data) {
        const { datumSelections, labelSelections, annotationSelections } = data;
        const fns = prepareBarAnimationFunctions$2(collapsedStartingBarPosition$1(this.direction === 'vertical', this.axes));
        fromToMotion$1(this.id, 'nodes', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation$6(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation$6(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }
    animateWaitingUpdateReady(data) {
        var _a, _b;
        const { datumSelections, labelSelections, annotationSelections } = data;
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        const diff = (_b = (_a = this.processedData) === null || _a === void 0 ? void 0 : _a.reduced) === null || _b === void 0 ? void 0 : _b.diff;
        const fns = prepareBarAnimationFunctions$2(collapsedStartingBarPosition$1(this.direction === 'vertical', this.axes));
        fromToMotion$1(this.id, 'nodes', this.ctx.animationManager, datumSelections, fns, (_, datum) => String(datum.xValue), diff);
        seriesLabelFadeInAnimation$6(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation$6(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }
}
__decorate([
    Validate$c(COLOR_STRING),
    __metadata("design:type", String)
], BulletSeries.prototype, "fill", void 0);
__decorate([
    Validate$c(NUMBER$9(0, 1)),
    __metadata("design:type", Object)
], BulletSeries.prototype, "fillOpacity", void 0);
__decorate([
    Validate$c(COLOR_STRING),
    __metadata("design:type", String)
], BulletSeries.prototype, "stroke", void 0);
__decorate([
    Validate$c(NUMBER$9(0)),
    __metadata("design:type", Object)
], BulletSeries.prototype, "strokeWidth", void 0);
__decorate([
    Validate$c(NUMBER$9(0, 1)),
    __metadata("design:type", Object)
], BulletSeries.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$c(LINE_DASH),
    __metadata("design:type", Array)
], BulletSeries.prototype, "lineDash", void 0);
__decorate([
    Validate$c(NUMBER$9(0)),
    __metadata("design:type", Number)
], BulletSeries.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$c(NUMBER$9(0, 1)),
    __metadata("design:type", Number)
], BulletSeries.prototype, "widthRatio", void 0);
__decorate([
    Validate$c(STRING$3),
    __metadata("design:type", String)
], BulletSeries.prototype, "valueKey", void 0);
__decorate([
    Validate$c(OPT_STRING$9),
    __metadata("design:type", String)
], BulletSeries.prototype, "valueName", void 0);
__decorate([
    Validate$c(OPT_STRING$9),
    __metadata("design:type", String)
], BulletSeries.prototype, "targetKey", void 0);
__decorate([
    Validate$c(OPT_STRING$9),
    __metadata("design:type", String)
], BulletSeries.prototype, "targetName", void 0);
__decorate([
    Validate$c(OPT_NON_EMPTY_ARRAY()),
    __metadata("design:type", Array)
], BulletSeries.prototype, "colorRanges", void 0);

const BULLET_SERIES_THEME = {
    stroke: 'black',
    strokeWidth: 0,
    strokeOpacity: 1,
    fill: 'black',
    fillOpacity: 1,
    widthRatio: 0.5,
    target: {
        stroke: 'black',
        strokeWidth: 3,
        strokeOpacity: 1,
        lengthRatio: 0.75,
    },
};

const { CARTESIAN_AXIS_POSITIONS: CARTESIAN_AXIS_POSITIONS$4 } = agChartsCommunity._Theme;
const BulletModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    solo: true,
    optionConstructors: { 'series[].colorRanges': BulletColorRange },
    instanceConstructor: BulletSeries,
    seriesDefaults: BULLET_DEFAULTS,
    themeTemplate: BULLET_SERIES_THEME,
    customDefaultsFunction: (series) => {
        var _a;
        const axis0 = Object.assign({}, BULLET_DEFAULTS.axes[0]);
        const axis1 = Object.assign({}, BULLET_DEFAULTS.axes[1]);
        if (series.direction === 'horizontal') {
            axis0.position = CARTESIAN_AXIS_POSITIONS$4.BOTTOM;
            axis1.position = CARTESIAN_AXIS_POSITIONS$4.LEFT;
        }
        if (((_a = series.scale) === null || _a === void 0 ? void 0 : _a.max) !== undefined) {
            axis0.max = series.scale.max;
        }
        return Object.assign(Object.assign({}, BULLET_DEFAULTS), { axes: [axis0, axis1] });
    },
};

const { CARTESIAN_AXIS_TYPES: CARTESIAN_AXIS_TYPES$3, CARTESIAN_AXIS_POSITIONS: CARTESIAN_AXIS_POSITIONS$3 } = agChartsCommunity._Theme;
const HEATMAP_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES$3.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS$3.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPES$3.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS$3.BOTTOM,
        },
    ],
    gradientLegend: {
        enabled: true,
    },
};

const { AND, Validate: Validate$b, SeriesNodePickMode: SeriesNodePickMode$3, valueProperty: valueProperty$6, ChartAxisDirection: ChartAxisDirection$8, COLOR_STRING_ARRAY, NON_EMPTY_ARRAY, OPT_NUMBER: OPT_NUMBER$9, OPT_STRING: OPT_STRING$8, OPT_FUNCTION: OPT_FUNCTION$7, OPT_COLOR_STRING: OPT_COLOR_STRING$9, } = agChartsCommunity._ModuleSupport;
const { Rect: Rect$3 } = agChartsCommunity._Scene;
const { ColorScale } = agChartsCommunity._Scale;
const { sanitizeHtml: sanitizeHtml$8, Color: Color$1, Logger: Logger$2 } = agChartsCommunity._Util;
class HeatmapSeriesNodeClickEvent extends agChartsCommunity._ModuleSupport.CartesianSeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.colorKey = series.colorKey;
    }
}
class HeatmapSeries extends agChartsCommunity._ModuleSupport.CartesianSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode$3.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasMarkers: false,
            hasHighlightedLabels: true,
        });
        this.NodeClickEvent = HeatmapSeriesNodeClickEvent;
        this.label = new agChartsCommunity._Scene.Label();
        this.title = undefined;
        this.xKey = undefined;
        this.xName = undefined;
        this.yKey = undefined;
        this.yName = undefined;
        this.colorKey = undefined;
        this.colorName = 'Color';
        this.colorRange = ['black', 'black'];
        this.stroke = 'black';
        this.strokeWidth = 0;
        this.formatter = undefined;
        this.colorScale = new ColorScale();
        this.tooltip = new agChartsCommunity._ModuleSupport.SeriesTooltip();
    }
    processData(dataController) {
        return __awaiter(this, void 0, void 0, function* () {
            const { xKey = '', yKey = '', axes } = this;
            const xAxis = axes[ChartAxisDirection$8.X];
            const yAxis = axes[ChartAxisDirection$8.Y];
            if (!xAxis || !yAxis) {
                return;
            }
            const data = xKey && yKey && this.data ? this.data : [];
            const { isContinuousX, isContinuousY } = this.isContinuous();
            const { colorScale, colorRange, colorKey } = this;
            const { dataModel, processedData } = yield this.requestDataModel(dataController, data !== null && data !== void 0 ? data : [], {
                props: [
                    valueProperty$6(this, xKey, isContinuousX, { id: 'xValue' }),
                    valueProperty$6(this, yKey, isContinuousY, { id: 'yValue' }),
                    ...(colorKey ? [valueProperty$6(this, colorKey, true, { id: 'colorValue' })] : []),
                ],
            });
            if (this.isColorScaleValid()) {
                const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
                colorScale.domain = processedData.domain.values[colorKeyIdx];
                colorScale.range = colorRange;
                colorScale.update();
            }
        });
    }
    isColorScaleValid() {
        const { colorKey } = this;
        if (!colorKey) {
            return false;
        }
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) {
            return false;
        }
        const colorDataIdx = dataModel.resolveProcessedDataIndexById(this, `colorValue`).index;
        const dataCount = processedData.data.length;
        const colorDataMissing = dataCount === 0 || dataCount === processedData.defs.values[colorDataIdx].missing;
        return !colorDataMissing;
    }
    getSeriesDomain(direction) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData)
            return [];
        if (direction === ChartAxisDirection$8.X) {
            return dataModel.getDomain(this, `xValue`, 'value', processedData);
        }
        else {
            return dataModel.getDomain(this, `yValue`, 'value', processedData);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            const { data, visible, axes, dataModel } = this;
            const xAxis = axes[ChartAxisDirection$8.X];
            const yAxis = axes[ChartAxisDirection$8.Y];
            if (!(data && dataModel && visible && xAxis && yAxis)) {
                return [];
            }
            if (xAxis.type !== 'category' || yAxis.type !== 'category') {
                Logger$2.warnOnce(`Heatmap series expected axes to have "category" type, but received "${xAxis.type}" and "${yAxis.type}" instead.`);
                return [];
            }
            const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
            const colorDataIdx = this.colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : -1;
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const xOffset = ((_a = xScale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
            const yOffset = ((_b = yScale.bandwidth) !== null && _b !== void 0 ? _b : 0) / 2;
            const { colorScale, label, xKey = '', yKey = '', colorKey = '', colorName = '' } = this;
            const colorScaleValid = this.isColorScaleValid();
            const nodeData = [];
            const width = (_c = xScale.bandwidth) !== null && _c !== void 0 ? _c : 10;
            const height = (_d = yScale.bandwidth) !== null && _d !== void 0 ? _d : 10;
            const font = label.getFont();
            for (const { values, datum } of (_f = (_e = this.processedData) === null || _e === void 0 ? void 0 : _e.data) !== null && _f !== void 0 ? _f : []) {
                const xDatum = values[xDataIdx];
                const yDatum = values[yDataIdx];
                const x = xScale.convert(xDatum) + xOffset;
                const y = yScale.convert(yDatum) + yOffset;
                const colorValue = colorKey ? values[colorDataIdx] : undefined;
                const fill = colorScaleValid ? colorScale.convert(colorValue) : this.colorRange[0];
                const labelText = this.getLabelText(this.label, {
                    value: colorValue,
                    datum,
                    colorKey,
                    colorName,
                    xKey,
                    yKey,
                    xName: this.xName,
                    yName: this.yName,
                });
                const size = agChartsCommunity._Scene.HdpiCanvas.getTextSize(labelText, font);
                nodeData.push({
                    series: this,
                    itemId: yKey,
                    yKey,
                    xKey,
                    xValue: xDatum,
                    yValue: yDatum,
                    colorValue,
                    datum,
                    point: { x, y, size: 0 },
                    width,
                    height,
                    fill,
                    label: Object.assign({ text: labelText }, size),
                    midPoint: { x, y },
                });
            }
            return [
                {
                    itemId: (_g = this.yKey) !== null && _g !== void 0 ? _g : this.id,
                    nodeData,
                    labelData: nodeData,
                    scales: _super.calculateScaling.call(this),
                    visible: this.visible,
                },
            ];
        });
    }
    getLabelData() {
        var _a;
        return (_a = this.contextNodeData) === null || _a === void 0 ? void 0 : _a.reduce((r, n) => r.concat(n.labelData), []);
    }
    nodeFactory() {
        return new Rect$3();
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nodeData, datumSelection } = opts;
            const data = nodeData !== null && nodeData !== void 0 ? nodeData : [];
            return datumSelection.update(data);
        });
    }
    updateDatumNodes(opts) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { datumSelection, isHighlight: isDatumHighlighted } = opts;
            const { xKey = '', yKey = '', colorKey, formatter, highlightStyle: { item: { fill: highlightedFill, stroke: highlightedStroke, strokeWidth: highlightedDatumStrokeWidth, fillOpacity: highlightedFillOpacity, }, }, id: seriesId, ctx: { callbackCache }, } = this;
            const xAxis = this.axes[ChartAxisDirection$8.X];
            const [visibleMin, visibleMax] = (_a = xAxis === null || xAxis === void 0 ? void 0 : xAxis.visibleRange) !== null && _a !== void 0 ? _a : [];
            const isZoomed = visibleMin !== 0 || visibleMax !== 1;
            const crisp = !isZoomed;
            datumSelection.each((rect, datum) => {
                var _a, _b, _c;
                const { point, width, height } = datum;
                const fill = isDatumHighlighted && highlightedFill !== undefined
                    ? Color$1.interpolate(datum.fill, highlightedFill)(highlightedFillOpacity !== null && highlightedFillOpacity !== void 0 ? highlightedFillOpacity : 1)
                    : datum.fill;
                const stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : this.stroke;
                const strokeWidth = isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : this.strokeWidth;
                let format;
                if (formatter) {
                    format = callbackCache.call(formatter, {
                        datum: datum.datum,
                        fill,
                        stroke,
                        strokeWidth,
                        highlighted: isDatumHighlighted,
                        xKey,
                        yKey,
                        colorKey,
                        seriesId,
                    });
                }
                rect.crisp = crisp;
                rect.x = Math.floor(point.x - width / 2);
                rect.y = Math.floor(point.y - height / 2);
                rect.width = Math.ceil(width);
                rect.height = Math.ceil(height);
                rect.fill = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill;
                rect.stroke = (_b = format === null || format === void 0 ? void 0 : format.stroke) !== null && _b !== void 0 ? _b : stroke;
                rect.strokeWidth = (_c = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _c !== void 0 ? _c : strokeWidth;
            });
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelData, labelSelection } = opts;
            const { enabled } = this.label;
            const data = enabled ? labelData : [];
            return labelSelection.update(data);
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelSelection } = opts;
            const { label } = this;
            labelSelection.each((text, datum) => {
                if (datum.label.width > datum.width || datum.label.height > datum.height) {
                    text.visible = false;
                    return;
                }
                text.visible = true;
                text.text = datum.label.text;
                text.fill = label.color;
                text.x = datum.midPoint.x;
                text.y = datum.midPoint.y;
                text.fontStyle = label.fontStyle;
                text.fontWeight = label.fontWeight;
                text.fontSize = label.fontSize;
                text.fontFamily = label.fontFamily;
                text.textAlign = 'center';
                text.textBaseline = 'middle';
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        var _a, _b, _c;
        const { xKey, yKey, axes } = this;
        const xAxis = axes[ChartAxisDirection$8.X];
        const yAxis = axes[ChartAxisDirection$8.Y];
        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }
        const { formatter, tooltip, xName, yName, id: seriesId, stroke, strokeWidth, colorKey, colorName, colorScale, ctx: { callbackCache }, } = this;
        const { datum, xValue, yValue, colorValue, label: { text: labelText }, } = nodeDatum;
        const fill = this.isColorScaleValid() ? colorScale.convert(colorValue) : this.colorRange[0];
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
                seriesId,
            });
        }
        const color = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill) !== null && _b !== void 0 ? _b : 'gray';
        const title = (_c = this.title) !== null && _c !== void 0 ? _c : yName;
        const xString = sanitizeHtml$8(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml$8(yAxis.formatDatum(yValue));
        let content = `<b>${sanitizeHtml$8(xName || xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml$8(yName || yKey)}</b>: ${yString}`;
        if (colorKey) {
            content =
                `<b>${sanitizeHtml$8(colorName || colorKey)}</b>: ${sanitizeHtml$8(labelText || colorValue)}<br>` + content;
        }
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, {
            seriesId,
            datum,
            xKey,
            yKey,
            xName,
            yName,
            title,
            color,
            colorKey,
        });
    }
    getLegendData(legendType) {
        const { data, dataModel, xKey, yKey } = this;
        if (!((data === null || data === void 0 ? void 0 : data.length) && xKey && yKey && dataModel && legendType === 'gradient' && this.isColorScaleValid())) {
            return [];
        }
        return [
            {
                legendType: 'gradient',
                enabled: this.visible,
                seriesId: this.id,
                colorName: this.colorName,
                colorDomain: this.processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, 'colorValue').index],
                colorRange: this.colorRange,
            },
        ];
    }
    isLabelEnabled() {
        return this.label.enabled && Boolean(this.colorKey);
    }
    getBandScalePadding() {
        return { inner: 0, outer: 0 };
    }
}
HeatmapSeries.className = 'HeatmapSeries';
HeatmapSeries.type = 'heatmap';
__decorate([
    Validate$b(OPT_STRING$8),
    __metadata("design:type", String)
], HeatmapSeries.prototype, "title", void 0);
__decorate([
    Validate$b(OPT_STRING$8),
    __metadata("design:type", String)
], HeatmapSeries.prototype, "xKey", void 0);
__decorate([
    Validate$b(OPT_STRING$8),
    __metadata("design:type", String)
], HeatmapSeries.prototype, "xName", void 0);
__decorate([
    Validate$b(OPT_STRING$8),
    __metadata("design:type", String)
], HeatmapSeries.prototype, "yKey", void 0);
__decorate([
    Validate$b(OPT_STRING$8),
    __metadata("design:type", String)
], HeatmapSeries.prototype, "yName", void 0);
__decorate([
    Validate$b(OPT_STRING$8),
    __metadata("design:type", String)
], HeatmapSeries.prototype, "colorKey", void 0);
__decorate([
    Validate$b(OPT_STRING$8),
    __metadata("design:type", String)
], HeatmapSeries.prototype, "colorName", void 0);
__decorate([
    Validate$b(AND(COLOR_STRING_ARRAY, NON_EMPTY_ARRAY)),
    __metadata("design:type", Array)
], HeatmapSeries.prototype, "colorRange", void 0);
__decorate([
    Validate$b(OPT_COLOR_STRING$9),
    __metadata("design:type", String)
], HeatmapSeries.prototype, "stroke", void 0);
__decorate([
    Validate$b(OPT_NUMBER$9(0)),
    __metadata("design:type", Number)
], HeatmapSeries.prototype, "strokeWidth", void 0);
__decorate([
    Validate$b(OPT_FUNCTION$7),
    __metadata("design:type", Function)
], HeatmapSeries.prototype, "formatter", void 0);

const HEATMAP_SERIES_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_SERIES_DEFAULTS,
    label: {
        enabled: false,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 12,
        fontFamily: agChartsCommunity._Theme.DEFAULT_FONT_FAMILY,
        color: agChartsCommunity._Theme.DEFAULT_LABEL_COLOUR,
        __overrides__: agChartsCommunity._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};

const HeatmapModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'heatmap',
    instanceConstructor: HeatmapSeries,
    seriesDefaults: HEATMAP_DEFAULTS,
    themeTemplate: HEATMAP_SERIES_THEME,
    paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
        var _a;
        const { properties } = themeTemplateParameters;
        const defaultColorRange = properties.get(agChartsCommunity._Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const defaultBackgroundColor = properties.get(agChartsCommunity._Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill = (_a = (Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor)) !== null && _a !== void 0 ? _a : 'white';
        const { fills, strokes } = takeColors(colorsCount);
        return {
            stroke: userPalette ? strokes[0] : backgroundFill,
            colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
        };
    },
};

const { POLAR_AXIS_TYPES: POLAR_AXIS_TYPES$3, CIRCLE: CIRCLE$1 } = agChartsCommunity._Theme;
const NIGHTINGALE_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPES$3.ANGLE_CATEGORY,
            shape: CIRCLE$1,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                padding: 10,
            },
        },
        {
            type: POLAR_AXIS_TYPES$3.RADIUS_NUMBER,
            shape: CIRCLE$1,
        },
    ],
};

const { ChartAxisDirection: ChartAxisDirection$7, HighlightStyle: HighlightStyle$4, NUMBER: NUMBER$8, OPT_COLOR_STRING: OPT_COLOR_STRING$8, OPT_FUNCTION: OPT_FUNCTION$6, OPT_LINE_DASH: OPT_LINE_DASH$5, OPT_NUMBER: OPT_NUMBER$8, OPT_STRING: OPT_STRING$7, PolarAxis: PolarAxis$3, STRING: STRING$2, Validate: Validate$a, diff: diff$3, fixNumericExtent: fixNumericExtent$5, groupAccumulativeValueProperty: groupAccumulativeValueProperty$1, keyProperty: keyProperty$4, normaliseGroupTo: normaliseGroupTo$1, resetLabelFn: resetLabelFn$4, seriesLabelFadeInAnimation: seriesLabelFadeInAnimation$5, seriesLabelFadeOutAnimation: seriesLabelFadeOutAnimation$1, valueProperty: valueProperty$5, animationValidation: animationValidation$5, } = agChartsCommunity._ModuleSupport;
const { BandScale: BandScale$2 } = agChartsCommunity._Scale;
const { motion: motion$6 } = agChartsCommunity._Scene;
const { isNumber: isNumber$5, normalizeAngle360: normalizeAngle360$1, sanitizeHtml: sanitizeHtml$7 } = agChartsCommunity._Util;
class RadialColumnSeriesNodeClickEvent extends agChartsCommunity._ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.angleKey;
        this.radiusKey = series.radiusKey;
    }
}
class RadialColumnSeriesBase extends agChartsCommunity._ModuleSupport.PolarSeries {
    constructor(moduleCtx, { animationResetFns, }) {
        super({
            moduleCtx,
            useLabelLayer: true,
            canHaveAxes: true,
            animationResetFns: Object.assign(Object.assign({}, animationResetFns), { label: resetLabelFn$4 }),
        });
        this.NodeClickEvent = RadialColumnSeriesNodeClickEvent;
        this.label = new agChartsCommunity._Scene.Label();
        this.nodeData = [];
        this.tooltip = new agChartsCommunity._ModuleSupport.SeriesTooltip();
        this.angleKey = '';
        this.angleName = undefined;
        this.radiusKey = '';
        this.radiusName = undefined;
        this.fill = 'black';
        this.fillOpacity = 1;
        this.stroke = 'black';
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.formatter = undefined;
        this.rotation = 0;
        this.strokeWidth = 1;
        this.stackGroup = undefined;
        this.highlightStyle = new HighlightStyle$4();
        this.groupScale = new BandScale$2();
        this.circleCache = { r: 0, cx: 0, cy: 0 };
    }
    addChartEventListeners() {
        var _a, _b;
        (_a = this.ctx.chartEventManager) === null || _a === void 0 ? void 0 : _a.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        (_b = this.ctx.chartEventManager) === null || _b === void 0 ? void 0 : _b.addListener('legend-item-double-click', (event) => this.onLegendItemDoubleClick(event));
    }
    getSeriesDomain(direction) {
        const { axes, dataModel, processedData } = this;
        if (!processedData || !dataModel)
            return [];
        if (direction === ChartAxisDirection$7.X) {
            return dataModel.getDomain(this, 'angleValue', 'key', processedData);
        }
        else {
            const radiusAxis = axes[ChartAxisDirection$7.Y];
            const yExtent = dataModel.getDomain(this, 'radiusValue-end', 'value', processedData);
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent$5(fixedYExtent, radiusAxis);
        }
    }
    processData(dataController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { data = [], visible } = this;
            const { angleKey, radiusKey } = this;
            if (!angleKey || !radiusKey)
                return;
            const stackGroupId = this.getStackId();
            const stackGroupTrailingId = `${stackGroupId}-trailing`;
            const normalizedToAbs = Math.abs((_a = this.normalizedTo) !== null && _a !== void 0 ? _a : NaN);
            const normaliseTo = normalizedToAbs && isFinite(normalizedToAbs) ? normalizedToAbs : undefined;
            const extraProps = [];
            if (normaliseTo) {
                extraProps.push(normaliseGroupTo$1(this, [stackGroupId, stackGroupTrailingId], normaliseTo, 'range'));
            }
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            if (animationEnabled && this.processedData) {
                extraProps.push(diff$3(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation$5(this));
            }
            const visibleProps = this.visible || !animationEnabled ? {} : { forceValue: 0 };
            yield this.requestDataModel(dataController, data, {
                props: [
                    keyProperty$4(this, angleKey, false, { id: 'angleValue' }),
                    valueProperty$5(this, radiusKey, true, Object.assign({ id: 'radiusValue-raw', invalidValue: null }, visibleProps)),
                    ...groupAccumulativeValueProperty$1(this, radiusKey, true, 'normal', 'current', Object.assign({ id: `radiusValue-end`, invalidValue: null, groupId: stackGroupId }, visibleProps)),
                    ...groupAccumulativeValueProperty$1(this, radiusKey, true, 'trailing', 'current', Object.assign({ id: `radiusValue-start`, invalidValue: null, groupId: stackGroupTrailingId }, visibleProps)),
                    ...extraProps,
                ],
                dataVisible: visible || animationEnabled,
            });
            this.animationState.transition('updateData');
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
        return __awaiter(this, void 0, void 0, function* () {
            const circleChanged = this.didCircleChange();
            if (!circleChanged && !this.nodeDataRefresh)
                return;
            const [{ nodeData = [] } = {}] = yield this.createNodeData();
            this.nodeData = nodeData;
            this.nodeDataRefresh = false;
        });
    }
    getAxisInnerRadius() {
        const radiusAxis = this.axes[ChartAxisDirection$7.Y];
        return radiusAxis instanceof PolarAxis$3 ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }
    createNodeData() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { processedData, dataModel, angleKey, radiusKey } = this;
            if (!processedData || !dataModel || !angleKey || !radiusKey) {
                return [];
            }
            const angleAxis = this.axes[ChartAxisDirection$7.X];
            const radiusAxis = this.axes[ChartAxisDirection$7.Y];
            const angleScale = angleAxis === null || angleAxis === void 0 ? void 0 : angleAxis.scale;
            const radiusScale = radiusAxis === null || radiusAxis === void 0 ? void 0 : radiusAxis.scale;
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
            const groupAngleStep = (_a = angleScale.bandwidth) !== null && _a !== void 0 ? _a : 0;
            const paddedGroupAngleStep = groupAngleStep * (1 - groupPaddingOuter);
            const { groupScale } = this;
            const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
            groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
            groupScale.range = [-paddedGroupAngleStep / 2, paddedGroupAngleStep / 2];
            groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;
            const axisInnerRadius = this.getAxisInnerRadius();
            const axisOuterRadius = this.radius;
            const axisTotalRadius = axisOuterRadius + axisInnerRadius;
            const getLabelNodeDatum = (datum, radiusDatum, x, y) => {
                const labelText = this.getLabelText(this.label, {
                    value: radiusDatum,
                    datum,
                    angleKey,
                    radiusKey,
                    angleName: this.angleName,
                    radiusName: this.radiusName,
                }, (value) => (isNumber$5(value) ? value.toFixed(2) : String(value)));
                if (labelText) {
                    return {
                        x,
                        y,
                        text: labelText,
                        textAlign: 'center',
                        textBaseline: 'middle',
                    };
                }
            };
            const nodeData = processedData.data.map((group, index) => {
                const { datum, keys, values } = group;
                const angleDatum = keys[0];
                const radiusDatum = values[radiusRawIndex];
                const innerRadiusDatum = values[radiusStartIndex];
                const outerRadiusDatum = values[radiusEndIndex];
                const groupAngle = angleScale.convert(angleDatum);
                const startAngle = normalizeAngle360$1(groupAngle + groupScale.convert(String(groupIndex)));
                const endAngle = normalizeAngle360$1(startAngle + groupScale.bandwidth);
                const angle = startAngle + groupScale.bandwidth / 2;
                const innerRadius = axisTotalRadius - radiusScale.convert(innerRadiusDatum);
                const outerRadius = axisTotalRadius - radiusScale.convert(outerRadiusDatum);
                const midRadius = (innerRadius + outerRadius) / 2;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const x = cos * midRadius;
                const y = sin * midRadius;
                const labelNodeDatum = this.label.enabled ? getLabelNodeDatum(datum, radiusDatum, x, y) : undefined;
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
                    index,
                };
            });
            return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
        });
    }
    getColumnWidth(_startAngle, _endAngle) {
        return NaN;
    }
    update({ seriesRect }) {
        return __awaiter(this, void 0, void 0, function* () {
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
                this.animationState.transition('resize');
            }
            this.animationState.transition('update');
        });
    }
    updateSectorSelection(selection, highlight) {
        var _a, _b, _c, _d, _e;
        let selectionData = [];
        if (highlight) {
            const highlighted = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight();
            if ((highlighted === null || highlighted === void 0 ? void 0 : highlighted.datum) && highlighted.series === this) {
                selectionData = [highlighted];
            }
        }
        else {
            selectionData = this.nodeData;
        }
        const highlightedStyle = highlight ? this.highlightStyle.item : undefined;
        const fill = (_b = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fill) !== null && _b !== void 0 ? _b : this.fill;
        const fillOpacity = (_c = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fillOpacity) !== null && _c !== void 0 ? _c : this.fillOpacity;
        const stroke = (_d = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.stroke) !== null && _d !== void 0 ? _d : this.stroke;
        const strokeOpacity = this.strokeOpacity;
        const strokeWidth = (_e = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.strokeWidth) !== null && _e !== void 0 ? _e : this.strokeWidth;
        const idFn = (datum) => datum.angleValue;
        selection.update(selectionData, undefined, idFn).each((node, datum) => {
            var _a, _b, _c, _d;
            const format = this.formatter
                ? this.ctx.callbackCache.call(this.formatter, {
                    datum,
                    fill,
                    stroke,
                    strokeWidth,
                    highlighted: highlight,
                    angleKey: this.angleKey,
                    radiusKey: this.radiusKey,
                    seriesId: this.id,
                })
                : undefined;
            this.updateItemPath(node, datum, highlight);
            node.fill = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill;
            node.fillOpacity = (_b = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _b !== void 0 ? _b : fillOpacity;
            node.stroke = (_c = format === null || format === void 0 ? void 0 : format.stroke) !== null && _c !== void 0 ? _c : stroke;
            node.strokeOpacity = strokeOpacity;
            node.strokeWidth = (_d = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _d !== void 0 ? _d : strokeWidth;
            node.lineDash = this.lineDash;
            node.lineJoin = 'round';
        });
    }
    updateLabels() {
        const { label, labelSelection } = this;
        labelSelection.update(this.nodeData).each((node, datum) => {
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
            }
            else {
                node.visible = false;
            }
        });
    }
    animateEmptyUpdateReady() {
        const { labelSelection } = this;
        const fns = this.getColumnTransitionFunctions();
        motion$6.fromToMotion(this.id, 'datums', this.ctx.animationManager, [this.itemSelection], fns);
        seriesLabelFadeInAnimation$5(this, 'labels', this.ctx.animationManager, [labelSelection]);
    }
    animateClearingUpdateEmpty() {
        const { itemSelection } = this;
        const { animationManager } = this.ctx;
        const fns = this.getColumnTransitionFunctions();
        motion$6.fromToMotion(this.id, 'datums', animationManager, [itemSelection], fns);
        seriesLabelFadeOutAnimation$1(this, 'labels', animationManager, [this.labelSelection]);
    }
    getTooltipHtml(nodeDatum) {
        var _a;
        const { id: seriesId, axes, angleKey, angleName, radiusKey, radiusName, fill, formatter, stroke, strokeWidth, tooltip, dataModel, } = this;
        const { angleValue, radiusValue, datum } = nodeDatum;
        const xAxis = axes[ChartAxisDirection$7.X];
        const yAxis = axes[ChartAxisDirection$7.Y];
        if (!(angleKey && radiusKey) || !(xAxis && yAxis && isNumber$5(radiusValue)) || !dataModel) {
            return '';
        }
        const angleString = xAxis.formatDatum(angleValue);
        const radiusString = yAxis.formatDatum(radiusValue);
        const title = sanitizeHtml$7(radiusName);
        const content = sanitizeHtml$7(`${angleString}: ${radiusString}`);
        const { fill: color } = (_a = (formatter &&
            this.ctx.callbackCache.call(formatter, {
                seriesId,
                datum,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                angleKey,
                radiusKey,
            }))) !== null && _a !== void 0 ? _a : { fill };
        return tooltip.toTooltipHtml({ title, backgroundColor: fill, content }, { seriesId, datum, color, title, angleKey, radiusKey, angleName, radiusName });
    }
    getLegendData(legendType) {
        var _a, _b, _c, _d;
        const { id, data, angleKey, radiusKey, radiusName, visible } = this;
        if (!((data === null || data === void 0 ? void 0 : data.length) && angleKey && radiusKey && legendType === 'category')) {
            return [];
        }
        return [
            {
                legendType: 'category',
                id,
                itemId: radiusKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: radiusName !== null && radiusName !== void 0 ? radiusName : radiusKey,
                },
                marker: {
                    fill: (_a = this.fill) !== null && _a !== void 0 ? _a : 'rgba(0, 0, 0, 0)',
                    stroke: (_b = this.stroke) !== null && _b !== void 0 ? _b : 'rgba(0, 0, 0, 0)',
                    fillOpacity: (_c = this.fillOpacity) !== null && _c !== void 0 ? _c : 1,
                    strokeOpacity: (_d = this.strokeOpacity) !== null && _d !== void 0 ? _d : 1,
                    strokeWidth: this.strokeWidth,
                },
            },
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
        const totalVisibleItems = Object.values(numVisibleItems).reduce((p, v) => p + v, 0);
        const wasClicked = series.id === this.id;
        const newEnabled = wasClicked || (enabled && totalVisibleItems === 1);
        this.toggleSeriesItem(itemId, newEnabled);
    }
    computeLabelsBBox() {
        return null;
    }
}
__decorate([
    Validate$a(STRING$2),
    __metadata("design:type", Object)
], RadialColumnSeriesBase.prototype, "angleKey", void 0);
__decorate([
    Validate$a(OPT_STRING$7),
    __metadata("design:type", String)
], RadialColumnSeriesBase.prototype, "angleName", void 0);
__decorate([
    Validate$a(STRING$2),
    __metadata("design:type", String)
], RadialColumnSeriesBase.prototype, "radiusKey", void 0);
__decorate([
    Validate$a(OPT_STRING$7),
    __metadata("design:type", String)
], RadialColumnSeriesBase.prototype, "radiusName", void 0);
__decorate([
    Validate$a(OPT_COLOR_STRING$8),
    __metadata("design:type", String)
], RadialColumnSeriesBase.prototype, "fill", void 0);
__decorate([
    Validate$a(NUMBER$8(0, 1)),
    __metadata("design:type", Object)
], RadialColumnSeriesBase.prototype, "fillOpacity", void 0);
__decorate([
    Validate$a(OPT_COLOR_STRING$8),
    __metadata("design:type", String)
], RadialColumnSeriesBase.prototype, "stroke", void 0);
__decorate([
    Validate$a(NUMBER$8(0, 1)),
    __metadata("design:type", Object)
], RadialColumnSeriesBase.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$a(OPT_LINE_DASH$5),
    __metadata("design:type", Array)
], RadialColumnSeriesBase.prototype, "lineDash", void 0);
__decorate([
    Validate$a(NUMBER$8(0)),
    __metadata("design:type", Number)
], RadialColumnSeriesBase.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$a(OPT_FUNCTION$6),
    __metadata("design:type", Function)
], RadialColumnSeriesBase.prototype, "formatter", void 0);
__decorate([
    Validate$a(NUMBER$8(-360, 360)),
    __metadata("design:type", Object)
], RadialColumnSeriesBase.prototype, "rotation", void 0);
__decorate([
    Validate$a(NUMBER$8(0)),
    __metadata("design:type", Object)
], RadialColumnSeriesBase.prototype, "strokeWidth", void 0);
__decorate([
    Validate$a(OPT_STRING$7),
    __metadata("design:type", String)
], RadialColumnSeriesBase.prototype, "stackGroup", void 0);
__decorate([
    Validate$a(OPT_NUMBER$8()),
    __metadata("design:type", Number)
], RadialColumnSeriesBase.prototype, "normalizedTo", void 0);

const { motion: motion$5 } = agChartsCommunity._Scene;
function createAngleMotionCalculator() {
    const angles = {
        startAngle: new Map(),
        endAngle: new Map(),
    };
    const angleKeys = ['startAngle', 'endAngle'];
    const calculate = (node, datum, status) => {
        angleKeys.forEach((key) => {
            var _a, _b;
            const map = angles[key];
            let from = (status === 'removed' || status === 'updated' ? node : datum)[key];
            let to = (status === 'removed' ? node : datum)[key];
            if (isNaN(to)) {
                to = (_b = (_a = node.previousDatum) === null || _a === void 0 ? void 0 : _a[key]) !== null && _b !== void 0 ? _b : NaN;
            }
            const diff = from - to;
            if (Math.abs(diff) > Math.PI) {
                from -= Math.sign(diff) * 2 * Math.PI;
            }
            map.set(datum, { from, to });
        });
    };
    const getAngles = (datum, fromToKey) => {
        return {
            startAngle: angles.startAngle.get(datum)[fromToKey],
            endAngle: angles.endAngle.get(datum)[fromToKey],
        };
    };
    const from = (datum) => getAngles(datum, 'from');
    const to = (datum) => getAngles(datum, 'to');
    return { calculate, from, to };
}
function fixRadialColumnAnimationStatus(node, datum, status) {
    if (status === 'updated') {
        if (node.previousDatum == null || isNaN(node.previousDatum.startAngle) || isNaN(node.previousDatum.endAngle)) {
            return 'added';
        }
        if (isNaN(datum.startAngle) || isNaN(datum.endAngle)) {
            return 'removed';
        }
    }
    if (status === 'added' && node.previousDatum != null) {
        return 'updated';
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
        if (status === 'removed' || status === 'updated') {
            innerRadius = node.innerRadius;
            outerRadius = node.outerRadius;
            columnWidth = node.columnWidth;
            axisInnerRadius = node.axisInnerRadius;
            axisOuterRadius = node.axisOuterRadius;
        }
        else {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            columnWidth = datum.columnWidth;
            axisInnerRadius = datum.axisInnerRadius;
            axisOuterRadius = datum.axisOuterRadius;
        }
        const mixin = motion$5.FROM_TO_MIXINS[status];
        return Object.assign({ innerRadius,
            outerRadius,
            columnWidth,
            axisInnerRadius,
            axisOuterRadius,
            startAngle,
            endAngle }, mixin);
    };
    const toFn = (node, datum, status) => {
        const { startAngle, endAngle } = angles.to(datum);
        let innerRadius;
        let outerRadius;
        let columnWidth;
        let axisInnerRadius;
        let axisOuterRadius;
        if (status === 'removed') {
            innerRadius = node.innerRadius;
            outerRadius = node.innerRadius;
            columnWidth = node.columnWidth;
            axisInnerRadius = node.axisInnerRadius;
            axisOuterRadius = node.axisOuterRadius;
        }
        else {
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
function resetRadialColumnSelectionFn(_node, { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle, }) {
    return { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle };
}

const { motion: motion$4 } = agChartsCommunity._Scene;
function prepareNightingaleAnimationFunctions(axisZeroRadius) {
    const angles = createAngleMotionCalculator();
    const fromFn = (sect, datum, status) => {
        status = fixRadialColumnAnimationStatus(sect, datum, status);
        angles.calculate(sect, datum, status);
        const { startAngle, endAngle } = angles.from(datum);
        let innerRadius;
        let outerRadius;
        if (status === 'removed' || status === 'updated') {
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
        }
        else {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
        }
        const mixin = motion$4.FROM_TO_MIXINS[status];
        return Object.assign({ innerRadius, outerRadius, startAngle, endAngle }, mixin);
    };
    const toFn = (_sect, datum, status) => {
        const { startAngle, endAngle } = angles.to(datum);
        let innerRadius;
        let outerRadius;
        if (status === 'removed') {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
        }
        else {
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

const { Sector: Sector$2 } = agChartsCommunity._Scene;
class NightingaleSeries extends RadialColumnSeriesBase {
    constructor(moduleCtx) {
        super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
    }
    getStackId() {
        var _a, _b;
        const groupIndex = (_b = (_a = this.seriesGrouping) === null || _a === void 0 ? void 0 : _a.groupIndex) !== null && _b !== void 0 ? _b : this.id;
        return `nightingale-stack-${groupIndex}-yValues`;
    }
    nodeFactory() {
        return new Sector$2();
    }
    updateItemPath(node, datum, highlight) {
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
        const axisInnerRadius = this.getAxisInnerRadius();
        return prepareNightingaleAnimationFunctions(axisInnerRadius);
    }
}
NightingaleSeries.className = 'NightingaleSeries';
NightingaleSeries.type = 'nightingale';

const NIGHTINGALE_SERIES_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 1,
    label: {
        enabled: false,
        fontSize: 12,
        fontFamily: agChartsCommunity._Theme.DEFAULT_FONT_FAMILY,
        color: agChartsCommunity._Theme.DEFAULT_LABEL_COLOUR,
        __overrides__: agChartsCommunity._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};

const NightingaleModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'nightingale',
    instanceConstructor: NightingaleSeries,
    seriesDefaults: NIGHTINGALE_DEFAULTS,
    themeTemplate: NIGHTINGALE_SERIES_THEME,
    paletteFactory: ({ takeColors, userPalette }) => {
        const { fills: [fill], strokes: [stroke], } = takeColors(1);
        return {
            fill,
            stroke: userPalette ? stroke : agChartsCommunity._Theme.DEFAULT_POLAR_SERIES_STROKE,
        };
    },
    stackable: true,
    groupable: true,
    stackedByDefault: true,
};

const { POLAR_AXIS_TYPES: POLAR_AXIS_TYPES$2 } = agChartsCommunity._Theme;
const POLAR_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPES$2.ANGLE_CATEGORY,
            label: {
                padding: 10,
            },
        },
        {
            type: POLAR_AXIS_TYPES$2.RADIUS_NUMBER,
        },
    ],
};

const { ChartAxisDirection: ChartAxisDirection$6, HighlightStyle: HighlightStyle$3, NUMBER: NUMBER$7, OPT_COLOR_STRING: OPT_COLOR_STRING$7, OPT_FUNCTION: OPT_FUNCTION$5, OPT_LINE_DASH: OPT_LINE_DASH$4, OPT_STRING: OPT_STRING$6, PolarAxis: PolarAxis$2, SeriesNodePickMode: SeriesNodePickMode$2, STRING: STRING$1, Validate: Validate$9, valueProperty: valueProperty$4, fixNumericExtent: fixNumericExtent$4, seriesLabelFadeInAnimation: seriesLabelFadeInAnimation$4, markerFadeInAnimation, resetMarkerFn: resetMarkerFn$1, animationValidation: animationValidation$4, ADD_PHASE, } = agChartsCommunity._ModuleSupport;
const { BBox: BBox$2, Group: Group$3, Path: Path$2, PointerEvents: PointerEvents$3, Selection: Selection$3, Text: Text$3, getMarker: getMarker$1 } = agChartsCommunity._Scene;
const { extent: extent$2, isNumber: isNumber$4, isNumberEqual: isNumberEqual$1, sanitizeHtml: sanitizeHtml$6, toFixed } = agChartsCommunity._Util;
class RadarSeriesNodeClickEvent extends agChartsCommunity._ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.angleKey;
        this.radiusKey = series.radiusKey;
    }
}
class RadarSeries extends agChartsCommunity._ModuleSupport.PolarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode$2.NEAREST_NODE, SeriesNodePickMode$2.EXACT_SHAPE_MATCH],
            canHaveAxes: true,
            animationResetFns: {
                item: resetMarkerFn$1,
            },
        });
        this.NodeClickEvent = RadarSeriesNodeClickEvent;
        this.marker = new agChartsCommunity._ModuleSupport.SeriesMarker();
        this.label = new agChartsCommunity._Scene.Label();
        this.nodeData = [];
        this.tooltip = new agChartsCommunity._ModuleSupport.SeriesTooltip();
        /**
         * The key of the numeric field to use to determine the angle (for example,
         * a pie sector angle).
         */
        this.angleKey = '';
        this.angleName = undefined;
        /**
         * The key of the numeric field to use to determine the radii of pie sectors.
         * The largest value will correspond to the full radius and smaller values to
         * proportionally smaller radii.
         */
        this.radiusKey = '';
        this.radiusName = undefined;
        this.stroke = 'black';
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.formatter = undefined;
        /**
         * The series rotation in degrees.
         */
        this.rotation = 0;
        this.strokeWidth = 1;
        this.highlightStyle = new HighlightStyle$3();
        this.circleCache = { r: 0, cx: 0, cy: 0 };
        const lineGroup = new Group$3();
        this.contentGroup.append(lineGroup);
        this.lineSelection = Selection$3.select(lineGroup, Path$2);
        lineGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
    }
    nodeFactory() {
        const { shape } = this.marker;
        const MarkerShape = getMarker$1(shape);
        return new MarkerShape();
    }
    addChartEventListeners() {
        var _a, _b;
        (_a = this.ctx.chartEventManager) === null || _a === void 0 ? void 0 : _a.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        (_b = this.ctx.chartEventManager) === null || _b === void 0 ? void 0 : _b.addListener('legend-item-double-click', (event) => this.onLegendItemDoubleClick(event));
    }
    getSeriesDomain(direction) {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel)
            return [];
        if (direction === ChartAxisDirection$6.X) {
            return dataModel.getDomain(this, `angleValue`, 'value', processedData);
        }
        else {
            const domain = dataModel.getDomain(this, `radiusValue`, 'value', processedData);
            const ext = extent$2(domain.length === 0 ? domain : [0].concat(domain));
            return fixNumericExtent$4(ext);
        }
    }
    processData(dataController) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data = [] } = this;
            const { angleKey, radiusKey } = this;
            if (!angleKey || !radiusKey)
                return;
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const extraProps = [];
            if (animationEnabled) {
                extraProps.push(animationValidation$4(this));
            }
            yield this.requestDataModel(dataController, data, {
                props: [
                    valueProperty$4(this, angleKey, false, { id: 'angleValue' }),
                    valueProperty$4(this, radiusKey, false, { id: 'radiusValue', invalidValue: undefined }),
                    ...extraProps,
                ],
            });
            this.animationState.transition('updateData');
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
        const radiusAxis = this.axes[ChartAxisDirection$6.Y];
        return radiusAxis instanceof PolarAxis$2 ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }
    maybeRefreshNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            const didCircleChange = this.didCircleChange();
            if (!didCircleChange && !this.nodeDataRefresh)
                return;
            const [{ nodeData = [] } = {}] = yield this.createNodeData();
            this.nodeData = nodeData;
            this.nodeDataRefresh = false;
        });
    }
    createNodeData() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { processedData, dataModel, angleKey, radiusKey } = this;
            if (!processedData || !dataModel || !angleKey || !radiusKey) {
                return [];
            }
            const angleScale = (_a = this.axes[ChartAxisDirection$6.X]) === null || _a === void 0 ? void 0 : _a.scale;
            const radiusScale = (_b = this.axes[ChartAxisDirection$6.Y]) === null || _b === void 0 ? void 0 : _b.scale;
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
                if (this.label.enabled) {
                    const labelText = this.getLabelText(this.label, {
                        value: radiusDatum,
                        datum,
                        angleKey,
                        radiusKey,
                        angleName: this.angleName,
                        radiusName: this.radiusName,
                    }, (value) => (isNumber$4(value) ? value.toFixed(2) : String(value)));
                    if (labelText) {
                        labelNodeDatum = {
                            x: x + cos * this.marker.size,
                            y: y + sin * this.marker.size,
                            text: labelText,
                            textAlign: isNumberEqual$1(cos, 0) ? 'center' : cos > 0 ? 'left' : 'right',
                            textBaseline: isNumberEqual$1(sin, 0) ? 'middle' : sin > 0 ? 'top' : 'bottom',
                        };
                    }
                }
                return {
                    series: this,
                    datum,
                    point: { x, y, size: this.marker.size },
                    midPoint: { x, y },
                    label: labelNodeDatum,
                    angleValue: angleDatum,
                    radiusValue: radiusDatum,
                };
            });
            return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
        });
    }
    update({ seriesRect }) {
        return __awaiter(this, void 0, void 0, function* () {
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
            this.updatePathSelections();
            this.updateMarkers(this.itemSelection, false);
            this.updateMarkers(this.highlightSelection, true);
            this.updateLabels();
            if (resize) {
                this.animationState.transition('resize');
            }
            this.animationState.transition('update');
        });
    }
    updatePathSelections() {
        const pathData = this.visible ? [true] : [];
        this.lineSelection.update(pathData);
    }
    getMarkerFill(highlightedStyle) {
        var _a;
        return (_a = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fill) !== null && _a !== void 0 ? _a : this.marker.fill;
    }
    updateMarkers(selection, highlight) {
        var _a;
        const { marker, visible, ctx, angleKey, radiusKey, id: seriesId } = this;
        const { shape, enabled, formatter, size } = marker;
        const { callbackCache } = ctx;
        let selectionData = [];
        if (visible && shape && enabled) {
            if (highlight) {
                const highlighted = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight();
                if (highlighted === null || highlighted === void 0 ? void 0 : highlighted.datum) {
                    selectionData = [highlighted];
                }
            }
            else {
                selectionData = this.nodeData;
            }
        }
        const highlightedStyle = highlight ? this.highlightStyle.item : undefined;
        selection.update(selectionData).each((node, datum) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            const fill = this.getMarkerFill(highlightedStyle);
            const stroke = (_b = (_a = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.stroke) !== null && _a !== void 0 ? _a : marker.stroke) !== null && _b !== void 0 ? _b : this.stroke;
            const strokeWidth = (_e = (_d = (_c = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.strokeWidth) !== null && _c !== void 0 ? _c : marker.strokeWidth) !== null && _d !== void 0 ? _d : this.strokeWidth) !== null && _e !== void 0 ? _e : 1;
            const format = formatter
                ? callbackCache.call(formatter, {
                    datum: datum.datum,
                    angleKey,
                    radiusKey,
                    fill,
                    stroke,
                    strokeWidth,
                    size,
                    highlighted: highlight,
                    seriesId,
                })
                : undefined;
            node.fill = (_f = format === null || format === void 0 ? void 0 : format.fill) !== null && _f !== void 0 ? _f : fill;
            node.stroke = (_g = format === null || format === void 0 ? void 0 : format.stroke) !== null && _g !== void 0 ? _g : stroke;
            node.strokeWidth = (_h = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _h !== void 0 ? _h : strokeWidth;
            node.fillOpacity = (_k = (_j = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fillOpacity) !== null && _j !== void 0 ? _j : marker.fillOpacity) !== null && _k !== void 0 ? _k : 1;
            node.strokeOpacity = (_m = (_l = marker.strokeOpacity) !== null && _l !== void 0 ? _l : this.strokeOpacity) !== null && _m !== void 0 ? _m : 1;
            node.size = (_o = format === null || format === void 0 ? void 0 : format.size) !== null && _o !== void 0 ? _o : marker.size;
            const { x, y } = datum.point;
            node.translationX = x;
            node.translationY = y;
            node.visible = visible && node.size > 0 && !isNaN(x) && !isNaN(y);
        });
    }
    updateLabels() {
        const { label, labelSelection } = this;
        labelSelection.update(this.nodeData).each((node, datum) => {
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
            }
            else {
                node.visible = false;
            }
        });
    }
    getTooltipHtml(nodeDatum) {
        var _a;
        const { angleKey, radiusKey } = this;
        if (!angleKey || !radiusKey) {
            return '';
        }
        const { angleName, radiusName, tooltip, marker, id: seriesId } = this;
        const { datum, angleValue, radiusValue } = nodeDatum;
        const formattedAngleValue = typeof angleValue === 'number' ? toFixed(angleValue) : String(angleValue);
        const formattedRadiusValue = typeof radiusValue === 'number' ? toFixed(radiusValue) : String(radiusValue);
        const title = sanitizeHtml$6(radiusName);
        const content = sanitizeHtml$6(`${formattedAngleValue}: ${formattedRadiusValue}`);
        const { formatter: markerFormatter, fill, stroke, strokeWidth: markerStrokeWidth, size } = marker;
        const strokeWidth = markerStrokeWidth !== null && markerStrokeWidth !== void 0 ? markerStrokeWidth : this.strokeWidth;
        const { fill: color } = (_a = (markerFormatter &&
            this.ctx.callbackCache.call(markerFormatter, {
                datum,
                angleKey,
                radiusKey,
                fill,
                stroke,
                strokeWidth,
                size,
                highlighted: false,
                seriesId,
            }))) !== null && _a !== void 0 ? _a : { fill };
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, { datum, angleKey, angleName, radiusKey, radiusName, title, color, seriesId });
    }
    getLegendData(legendType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const { id, data, angleKey, radiusKey, radiusName, visible, marker, stroke, strokeOpacity } = this;
        if (!((data === null || data === void 0 ? void 0 : data.length) && angleKey && radiusKey && legendType === 'category')) {
            return [];
        }
        return [
            {
                legendType: 'category',
                id: id,
                itemId: radiusKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: radiusName !== null && radiusName !== void 0 ? radiusName : radiusKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: (_c = (_b = (_a = this.getMarkerFill()) !== null && _a !== void 0 ? _a : marker.stroke) !== null && _b !== void 0 ? _b : stroke) !== null && _c !== void 0 ? _c : 'rgba(0, 0, 0, 0)',
                    stroke: (_e = (_d = marker.stroke) !== null && _d !== void 0 ? _d : stroke) !== null && _e !== void 0 ? _e : 'rgba(0, 0, 0, 0)',
                    fillOpacity: (_f = marker.fillOpacity) !== null && _f !== void 0 ? _f : 1,
                    strokeOpacity: (_h = (_g = marker.strokeOpacity) !== null && _g !== void 0 ? _g : strokeOpacity) !== null && _h !== void 0 ? _h : 1,
                    strokeWidth: (_j = marker.strokeWidth) !== null && _j !== void 0 ? _j : 0,
                },
            },
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
        const totalVisibleItems = Object.values(numVisibleItems).reduce((p, v) => p + v, 0);
        const wasClicked = series.id === this.id;
        const newEnabled = wasClicked || (enabled && totalVisibleItems === 1);
        this.toggleSeriesItem(itemId, newEnabled);
    }
    pickNodeClosestDatum(point) {
        var _a, _b;
        const { x, y } = point;
        const { rootGroup, nodeData, centerX: cx, centerY: cy, marker } = this;
        const hitPoint = rootGroup.transformPoint(x, y);
        const radius = this.radius;
        const distanceFromCenter = Math.sqrt(Math.pow((x - cx), 2) + Math.pow((y - cy), 2));
        if (distanceFromCenter > radius + marker.size) {
            return;
        }
        let minDistance = Infinity;
        let closestDatum;
        for (const datum of nodeData) {
            const { point: { x: datumX = NaN, y: datumY = NaN } = {} } = datum;
            if (isNaN(datumX) || isNaN(datumY)) {
                continue;
            }
            const distance = Math.sqrt(Math.pow((hitPoint.x - datumX - cx), 2) + Math.pow((hitPoint.y - datumY - cy), 2));
            if (distance < minDistance) {
                minDistance = distance;
                closestDatum = datum;
            }
        }
        if (closestDatum) {
            const distance = Math.max(minDistance - ((_b = (_a = closestDatum.point) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0), 0);
            return { datum: closestDatum, distance };
        }
    }
    computeLabelsBBox() {
        return __awaiter(this, void 0, void 0, function* () {
            const { label } = this;
            yield this.maybeRefreshNodeData();
            const textBoxes = [];
            const tempText = new Text$3();
            this.nodeData.forEach((nodeDatum) => {
                if (!label.enabled || !nodeDatum.label) {
                    return;
                }
                tempText.text = nodeDatum.label.text;
                tempText.x = nodeDatum.label.x;
                tempText.y = nodeDatum.label.y;
                tempText.setFont(label);
                tempText.setAlign(nodeDatum.label);
                const box = tempText.computeBBox();
                textBoxes.push(box);
            });
            if (textBoxes.length === 0) {
                return null;
            }
            return BBox$2.merge(textBoxes);
        });
    }
    getLineNode() {
        return this.lineSelection.nodes()[0];
    }
    beforePathAnimation() {
        const lineNode = this.getLineNode();
        lineNode.fill = undefined;
        lineNode.lineJoin = 'round';
        lineNode.lineCap = 'round';
        lineNode.pointerEvents = PointerEvents$3.None;
        lineNode.stroke = this.stroke;
        lineNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
        lineNode.strokeOpacity = this.strokeOpacity;
        lineNode.lineDash = this.lineDash;
        lineNode.lineDashOffset = this.lineDashOffset;
    }
    getLinePoints(options) {
        const { nodeData } = this;
        const { breakMissingPoints } = options;
        if (nodeData.length === 0) {
            return [];
        }
        const points = [];
        let prevPointInvalid = false;
        const invalidDatums = new Set();
        nodeData.forEach((datum, index) => {
            let { x, y } = datum.point;
            const isPointInvalid = isNaN(x) || isNaN(y);
            if (isPointInvalid) {
                prevPointInvalid = true;
                if (breakMissingPoints) {
                    invalidDatums.add(datum);
                    return;
                }
                else {
                    x = 0;
                    y = 0;
                }
            }
            const moveTo = index === 0 || (breakMissingPoints && prevPointInvalid);
            points.push({ x, y, moveTo });
            prevPointInvalid = false;
        });
        const isFirstInvalid = invalidDatums.has(nodeData[0]);
        const isLastInvalid = invalidDatums.has(nodeData[nodeData.length - 1]);
        const closed = !breakMissingPoints || (!isFirstInvalid && !isLastInvalid);
        if (closed) {
            points.push(Object.assign(Object.assign({}, points[0]), { moveTo: false }));
        }
        return points;
    }
    animateSinglePath(pathNode, points, ratio) {
        const { path } = pathNode;
        path.clear({ trackChanges: true });
        const axisInnerRadius = this.getAxisInnerRadius();
        points.forEach((point) => {
            const { x: x1, y: y1 } = point;
            const angle = Math.atan2(y1, x1);
            const x0 = axisInnerRadius * Math.cos(angle);
            const y0 = axisInnerRadius * Math.sin(angle);
            const t = ratio;
            const x = x0 * (1 - t) + x1 * t;
            const y = y0 * (1 - t) + y1 * t;
            if (point.moveTo) {
                path.moveTo(x, y);
            }
            else {
                path.lineTo(x, y);
            }
        });
        pathNode.checkPathDirty();
    }
    animatePaths(ratio) {
        const linePoints = this.getLinePoints({ breakMissingPoints: true });
        this.animateSinglePath(this.getLineNode(), linePoints, ratio);
    }
    animateEmptyUpdateReady() {
        const { itemSelection, labelSelection } = this;
        const { animationManager } = this.ctx;
        const duration = animationManager.defaultDuration * (1 - ADD_PHASE.animationDuration);
        const animationOptions = { from: 0, to: 1 };
        this.beforePathAnimation();
        animationManager.animate(Object.assign(Object.assign({ id: `${this.id}_'path`, groupId: this.id }, animationOptions), { duration, onUpdate: (ratio) => this.animatePaths(ratio), onStop: () => this.animatePaths(1) }));
        markerFadeInAnimation(this, animationManager, [itemSelection], 'added');
        seriesLabelFadeInAnimation$4(this, 'labels', animationManager, [labelSelection]);
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
            const linePoints = this.getLinePoints({ breakMissingPoints: true });
            lineNode.fill = undefined;
            lineNode.stroke = this.stroke;
            lineNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
            lineNode.strokeOpacity = this.strokeOpacity;
            lineNode.lineDash = this.lineDash;
            lineNode.lineDashOffset = this.lineDashOffset;
            linePath.clear({ trackChanges: true });
            linePoints.forEach(({ x, y, moveTo }) => {
                if (moveTo) {
                    linePath.moveTo(x, y);
                }
                else {
                    linePath.lineTo(x, y);
                }
            });
            lineNode.checkPathDirty();
        }
    }
}
RadarSeries.className = 'RadarSeries';
__decorate([
    Validate$9(STRING$1),
    __metadata("design:type", Object)
], RadarSeries.prototype, "angleKey", void 0);
__decorate([
    Validate$9(OPT_STRING$6),
    __metadata("design:type", String)
], RadarSeries.prototype, "angleName", void 0);
__decorate([
    Validate$9(STRING$1),
    __metadata("design:type", String)
], RadarSeries.prototype, "radiusKey", void 0);
__decorate([
    Validate$9(OPT_STRING$6),
    __metadata("design:type", String)
], RadarSeries.prototype, "radiusName", void 0);
__decorate([
    Validate$9(OPT_COLOR_STRING$7),
    __metadata("design:type", String)
], RadarSeries.prototype, "stroke", void 0);
__decorate([
    Validate$9(NUMBER$7(0, 1)),
    __metadata("design:type", Object)
], RadarSeries.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$9(OPT_LINE_DASH$4),
    __metadata("design:type", Array)
], RadarSeries.prototype, "lineDash", void 0);
__decorate([
    Validate$9(NUMBER$7(0)),
    __metadata("design:type", Number)
], RadarSeries.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$9(OPT_FUNCTION$5),
    __metadata("design:type", Function)
], RadarSeries.prototype, "formatter", void 0);
__decorate([
    Validate$9(NUMBER$7(-360, 360)),
    __metadata("design:type", Object)
], RadarSeries.prototype, "rotation", void 0);
__decorate([
    Validate$9(NUMBER$7(0)),
    __metadata("design:type", Object)
], RadarSeries.prototype, "strokeWidth", void 0);

const { NUMBER: NUMBER$6, OPT_COLOR_STRING: OPT_COLOR_STRING$6, Validate: Validate$8 } = agChartsCommunity._ModuleSupport;
const { Group: Group$2, Path: Path$1, PointerEvents: PointerEvents$2, Selection: Selection$2 } = agChartsCommunity._Scene;
class RadarAreaSeries extends RadarSeries {
    constructor(moduleCtx) {
        super(moduleCtx);
        this.fill = 'black';
        this.fillOpacity = 1;
        const areaGroup = new Group$2();
        areaGroup.zIndexSubOrder = [() => this._declarationOrder, 0];
        this.contentGroup.append(areaGroup);
        this.areaSelection = Selection$2.select(areaGroup, Path$1);
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
        var _a, _b;
        return (_b = (_a = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fill) !== null && _a !== void 0 ? _a : this.marker.fill) !== null && _b !== void 0 ? _b : this.fill;
    }
    beforePathAnimation() {
        super.beforePathAnimation();
        const areaNode = this.getAreaNode();
        areaNode.fill = this.fill;
        areaNode.fillOpacity = this.fillOpacity;
        areaNode.pointerEvents = PointerEvents$2.None;
        areaNode.stroke = undefined;
    }
    animatePaths(ratio) {
        super.animatePaths(ratio);
        const areaPoints = this.getLinePoints({ breakMissingPoints: false });
        this.animateSinglePath(this.getAreaNode(), areaPoints, ratio);
    }
    resetPaths() {
        super.resetPaths();
        const areaNode = this.getAreaNode();
        if (areaNode) {
            const { path: areaPath } = areaNode;
            const areaPoints = this.getLinePoints({ breakMissingPoints: false });
            areaNode.fill = this.fill;
            areaNode.fillOpacity = this.fillOpacity;
            areaNode.stroke = undefined;
            areaNode.lineDash = this.lineDash;
            areaNode.lineDashOffset = this.lineDashOffset;
            areaNode.lineJoin = areaNode.lineCap = 'round';
            areaPath.clear({ trackChanges: true });
            areaPoints.forEach(({ x, y }, index) => {
                if (index === 0) {
                    areaPath.moveTo(x, y);
                }
                else {
                    areaPath.lineTo(x, y);
                }
            });
            areaPath.closePath();
            areaNode.checkPathDirty();
        }
    }
}
RadarAreaSeries.className = 'RadarAreaSeries';
RadarAreaSeries.type = 'radar-area';
__decorate([
    Validate$8(OPT_COLOR_STRING$6),
    __metadata("design:type", String)
], RadarAreaSeries.prototype, "fill", void 0);
__decorate([
    Validate$8(NUMBER$6(0, 1)),
    __metadata("design:type", Object)
], RadarAreaSeries.prototype, "fillOpacity", void 0);

const RADAR_SERIES_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_SERIES_DEFAULTS,
    label: {
        enabled: false,
        fontSize: 12,
        fontFamily: agChartsCommunity._Theme.DEFAULT_FONT_FAMILY,
        color: agChartsCommunity._Theme.DEFAULT_LABEL_COLOUR,
        __overrides__: agChartsCommunity._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
    marker: {
        enabled: true,
        fillOpacity: 1,
        formatter: undefined,
        shape: 'circle',
        size: 6,
        strokeOpacity: 1,
        strokeWidth: 0,
    },
};

const RADAR_AREA_SERIES_THEME = Object.assign(Object.assign({}, RADAR_SERIES_THEME), { fillOpacity: 0.8, strokeWidth: 2, marker: Object.assign(Object.assign({}, RADAR_SERIES_THEME.marker), { enabled: false }) });

const { markerPaletteFactory: markerPaletteFactory$1 } = agChartsCommunity._ModuleSupport;
const RadarAreaModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radar-area',
    instanceConstructor: RadarAreaSeries,
    seriesDefaults: POLAR_DEFAULTS,
    themeTemplate: RADAR_AREA_SERIES_THEME,
    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory$1(params);
        return {
            stroke: marker.stroke,
            fill: marker.fill,
            marker,
        };
    },
};

class RadarLineSeries extends RadarSeries {
    updatePathSelections() {
        this.lineSelection.update(this.visible ? [true] : []);
    }
}
RadarLineSeries.className = 'RadarLineSeries';
RadarLineSeries.type = 'radar-line';

const RADAR_LINE_SERIES_THEME = Object.assign(Object.assign({}, RADAR_SERIES_THEME), { strokeWidth: 2 });

const RadarLineModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radar-line',
    instanceConstructor: RadarLineSeries,
    seriesDefaults: POLAR_DEFAULTS,
    themeTemplate: RADAR_LINE_SERIES_THEME,
    paletteFactory: ({ takeColors }) => {
        const { fills: [fill], strokes: [stroke], } = takeColors(1);
        return {
            stroke: fill,
            marker: { fill, stroke },
        };
    },
};

const { POLAR_AXIS_TYPES: POLAR_AXIS_TYPES$1 } = agChartsCommunity._Theme;
const RADIAL_BAR_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPES$1.ANGLE_NUMBER,
        },
        {
            type: POLAR_AXIS_TYPES$1.RADIUS_CATEGORY,
            innerRadiusRatio: 0.2,
            groupPaddingInner: 0.2,
            paddingInner: 0.2,
            paddingOuter: 0.1,
        },
    ],
};

const { motion: motion$3 } = agChartsCommunity._Scene;
const { ChartAxisDirection: ChartAxisDirection$5 } = agChartsCommunity._ModuleSupport;
function fixRadialBarAnimationStatus(node, datum, status) {
    if (status === 'updated') {
        if (node.previousDatum == null ||
            isNaN(node.previousDatum.innerRadius) ||
            isNaN(node.previousDatum.outerRadius)) {
            return 'added';
        }
        if (isNaN(datum.innerRadius) || isNaN(datum.outerRadius)) {
            return 'removed';
        }
    }
    if (status === 'added' && node.previousDatum != null) {
        return 'updated';
    }
    return status;
}
function prepareRadialBarSeriesAnimationFunctions(axes) {
    var _a;
    const angleScale = (_a = axes[ChartAxisDirection$5.X]) === null || _a === void 0 ? void 0 : _a.scale;
    let axisZeroAngle = 0;
    if (angleScale && angleScale.domain[0] <= 0 && angleScale.domain[1] >= 0) {
        axisZeroAngle = angleScale.convert(0);
    }
    const fromFn = (sect, datum, status) => {
        status = fixRadialBarAnimationStatus(sect, datum, status);
        let startAngle;
        let endAngle;
        let innerRadius;
        let outerRadius;
        if (status === 'removed' || status === 'updated') {
            startAngle = sect.startAngle;
            endAngle = sect.endAngle;
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
        }
        else {
            startAngle = axisZeroAngle;
            endAngle = axisZeroAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        }
        const mixin = motion$3.FROM_TO_MIXINS[status];
        return Object.assign({ startAngle, endAngle, innerRadius, outerRadius }, mixin);
    };
    const toFn = (sect, datum, status) => {
        let startAngle;
        let endAngle;
        let innerRadius;
        let outerRadius;
        if (status === 'removed') {
            startAngle = axisZeroAngle;
            endAngle = axisZeroAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        }
        else {
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
        endAngle: datum.endAngle,
    };
}

const { ChartAxisDirection: ChartAxisDirection$4, HighlightStyle: HighlightStyle$2, NUMBER: NUMBER$5, OPT_COLOR_STRING: OPT_COLOR_STRING$5, OPT_FUNCTION: OPT_FUNCTION$4, OPT_LINE_DASH: OPT_LINE_DASH$3, OPT_NUMBER: OPT_NUMBER$7, OPT_STRING: OPT_STRING$5, PolarAxis: PolarAxis$1, STRING, Validate: Validate$7, diff: diff$2, groupAccumulativeValueProperty, keyProperty: keyProperty$3, normaliseGroupTo, valueProperty: valueProperty$3, fixNumericExtent: fixNumericExtent$3, resetLabelFn: resetLabelFn$3, seriesLabelFadeInAnimation: seriesLabelFadeInAnimation$3, seriesLabelFadeOutAnimation, animationValidation: animationValidation$3, } = agChartsCommunity._ModuleSupport;
const { BandScale: BandScale$1 } = agChartsCommunity._Scale;
const { Sector: Sector$1, motion: motion$2 } = agChartsCommunity._Scene;
const { angleBetween: angleBetween$1, isNumber: isNumber$3, sanitizeHtml: sanitizeHtml$5 } = agChartsCommunity._Util;
class RadialBarSeriesNodeClickEvent extends agChartsCommunity._ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.angleKey;
        this.radiusKey = series.radiusKey;
    }
}
class RadialBarSeries extends agChartsCommunity._ModuleSupport.PolarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            useLabelLayer: true,
            canHaveAxes: true,
            animationResetFns: {
                item: resetRadialBarSelectionsFn,
                label: resetLabelFn$3,
            },
        });
        this.NodeClickEvent = RadialBarSeriesNodeClickEvent;
        this.label = new agChartsCommunity._Scene.Label();
        this.nodeData = [];
        this.tooltip = new agChartsCommunity._ModuleSupport.SeriesTooltip();
        this.angleKey = '';
        this.angleName = undefined;
        this.radiusKey = '';
        this.radiusName = undefined;
        this.fill = 'black';
        this.fillOpacity = 1;
        this.stroke = 'black';
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.formatter = undefined;
        this.rotation = 0;
        this.strokeWidth = 1;
        this.stackGroup = undefined;
        this.highlightStyle = new HighlightStyle$2();
        this.groupScale = new BandScale$1();
        this.circleCache = { r: 0, cx: 0, cy: 0 };
    }
    nodeFactory() {
        return new Sector$1();
    }
    addChartEventListeners() {
        var _a, _b;
        (_a = this.ctx.chartEventManager) === null || _a === void 0 ? void 0 : _a.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        (_b = this.ctx.chartEventManager) === null || _b === void 0 ? void 0 : _b.addListener('legend-item-double-click', (event) => this.onLegendItemDoubleClick(event));
    }
    getSeriesDomain(direction) {
        const { axes, dataModel, processedData } = this;
        if (!processedData || !dataModel)
            return [];
        if (direction === ChartAxisDirection$4.X) {
            const angleAxis = axes[ChartAxisDirection$4.X];
            const xExtent = dataModel.getDomain(this, 'angleValue-end', 'value', processedData);
            const fixedXExtent = [xExtent[0] > 0 ? 0 : xExtent[0], xExtent[1] < 0 ? 0 : xExtent[1]];
            return fixNumericExtent$3(fixedXExtent, angleAxis);
        }
        else {
            return dataModel.getDomain(this, 'radiusValue', 'key', processedData);
        }
    }
    processData(dataController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { data = [], visible } = this;
            const { angleKey, radiusKey } = this;
            if (!angleKey || !radiusKey)
                return;
            const stackGroupId = this.getStackId();
            const stackGroupTrailingId = `${stackGroupId}-trailing`;
            const normalizedToAbs = Math.abs((_a = this.normalizedTo) !== null && _a !== void 0 ? _a : NaN);
            const normaliseTo = normalizedToAbs && isFinite(normalizedToAbs) ? normalizedToAbs : undefined;
            const extraProps = [];
            if (normaliseTo) {
                extraProps.push(normaliseGroupTo(this, [stackGroupId, stackGroupTrailingId], normaliseTo, 'range'));
            }
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            if (animationEnabled && this.processedData) {
                extraProps.push(diff$2(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation$3(this));
            }
            const visibleProps = this.visible || !animationEnabled ? {} : { forceValue: 0 };
            yield this.requestDataModel(dataController, data, {
                props: [
                    keyProperty$3(this, radiusKey, false, { id: 'radiusValue' }),
                    valueProperty$3(this, angleKey, true, Object.assign({ id: 'angleValue-raw', invalidValue: null }, visibleProps)),
                    ...groupAccumulativeValueProperty(this, angleKey, true, 'normal', 'current', Object.assign({ id: `angleValue-end`, invalidValue: null, groupId: stackGroupId }, visibleProps)),
                    ...groupAccumulativeValueProperty(this, angleKey, true, 'trailing', 'current', Object.assign({ id: `angleValue-start`, invalidValue: null, groupId: stackGroupTrailingId }, visibleProps)),
                    ...extraProps,
                ],
                dataVisible: visible || animationEnabled,
            });
            this.animationState.transition('updateData');
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
        return __awaiter(this, void 0, void 0, function* () {
            const circleChanged = this.didCircleChange();
            if (!circleChanged && !this.nodeDataRefresh)
                return;
            const [{ nodeData = [] } = {}] = yield this.createNodeData();
            this.nodeData = nodeData;
            this.nodeDataRefresh = false;
        });
    }
    getAxisInnerRadius() {
        const radiusAxis = this.axes[ChartAxisDirection$4.Y];
        return radiusAxis instanceof PolarAxis$1 ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }
    createNodeData() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { processedData, dataModel, angleKey, radiusKey } = this;
            if (!processedData || !dataModel || !angleKey || !radiusKey) {
                return [];
            }
            const angleAxis = this.axes[ChartAxisDirection$4.X];
            const radiusAxis = this.axes[ChartAxisDirection$4.Y];
            const angleScale = angleAxis === null || angleAxis === void 0 ? void 0 : angleAxis.scale;
            const radiusScale = radiusAxis === null || radiusAxis === void 0 ? void 0 : radiusAxis.scale;
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
            groupScale.range = [0, Math.abs((_a = radiusScale.bandwidth) !== null && _a !== void 0 ? _a : 0)];
            groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;
            const barWidth = groupScale.bandwidth >= 1 ? groupScale.bandwidth : groupScale.rawBandwidth;
            const axisInnerRadius = this.getAxisInnerRadius();
            const axisOuterRadius = this.radius;
            const axisTotalRadius = axisOuterRadius + axisInnerRadius;
            const getLabelNodeDatum = (datum, angleDatum, x, y) => {
                const labelText = this.getLabelText(this.label, {
                    value: angleDatum,
                    datum,
                    angleKey,
                    radiusKey,
                    angleName: this.angleName,
                    radiusName: this.radiusName,
                }, (value) => (isNumber$3(value) ? value.toFixed(2) : String(value)));
                if (labelText) {
                    return { x, y, text: labelText, textAlign: 'center', textBaseline: 'middle' };
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
                if (angleDatum < 0) {
                    const tempAngle = startAngle;
                    startAngle = endAngle;
                    endAngle = tempAngle;
                }
                const dataRadius = axisTotalRadius - radiusScale.convert(radiusDatum);
                const innerRadius = dataRadius + groupScale.convert(String(groupIndex));
                const outerRadius = innerRadius + barWidth;
                const midRadius = (innerRadius + outerRadius) / 2;
                const midAngle = startAngle + angleBetween$1(startAngle, endAngle) / 2;
                const x = Math.cos(midAngle) * midRadius;
                const y = Math.sin(midAngle) * midRadius;
                const labelNodeDatum = this.label.enabled ? getLabelNodeDatum(datum, angleDatum, x, y) : undefined;
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
                    index,
                };
            });
            return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
        });
    }
    update({ seriesRect }) {
        return __awaiter(this, void 0, void 0, function* () {
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
                this.animationState.transition('resize');
            }
            this.animationState.transition('update');
        });
    }
    updateSectorSelection(selection, highlight) {
        var _a, _b, _c, _d, _e;
        let selectionData = [];
        if (highlight) {
            const highlighted = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight();
            if ((highlighted === null || highlighted === void 0 ? void 0 : highlighted.datum) && highlighted.series === this) {
                selectionData = [highlighted];
            }
        }
        else {
            selectionData = this.nodeData;
        }
        const highlightedStyle = highlight ? this.highlightStyle.item : undefined;
        const fill = (_b = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fill) !== null && _b !== void 0 ? _b : this.fill;
        const fillOpacity = (_c = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fillOpacity) !== null && _c !== void 0 ? _c : this.fillOpacity;
        const stroke = (_d = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.stroke) !== null && _d !== void 0 ? _d : this.stroke;
        const strokeOpacity = this.strokeOpacity;
        const strokeWidth = (_e = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.strokeWidth) !== null && _e !== void 0 ? _e : this.strokeWidth;
        const idFn = (datum) => datum.radiusValue;
        selection.update(selectionData, undefined, idFn).each((node, datum) => {
            var _a, _b, _c, _d;
            const format = this.formatter
                ? this.ctx.callbackCache.call(this.formatter, {
                    datum,
                    fill,
                    stroke,
                    strokeWidth,
                    highlighted: highlight,
                    angleKey: this.angleKey,
                    radiusKey: this.radiusKey,
                    seriesId: this.id,
                })
                : undefined;
            node.fill = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill;
            node.fillOpacity = (_b = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _b !== void 0 ? _b : fillOpacity;
            node.stroke = (_c = format === null || format === void 0 ? void 0 : format.stroke) !== null && _c !== void 0 ? _c : stroke;
            node.strokeOpacity = strokeOpacity;
            node.strokeWidth = (_d = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _d !== void 0 ? _d : strokeWidth;
            node.lineDash = this.lineDash;
            node.lineJoin = 'round';
            if (highlight) {
                node.startAngle = datum.startAngle;
                node.endAngle = datum.endAngle;
                node.innerRadius = datum.innerRadius;
                node.outerRadius = datum.outerRadius;
            }
        });
    }
    updateLabels() {
        const { label, labelSelection } = this;
        labelSelection.update(this.nodeData).each((node, datum) => {
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
            }
            else {
                node.visible = false;
            }
        });
    }
    animateEmptyUpdateReady() {
        const { labelSelection } = this;
        const fns = prepareRadialBarSeriesAnimationFunctions(this.axes);
        motion$2.fromToMotion(this.id, 'datums', this.ctx.animationManager, [this.itemSelection], fns);
        seriesLabelFadeInAnimation$3(this, 'labels', this.ctx.animationManager, [labelSelection]);
    }
    animateClearingUpdateEmpty() {
        const { itemSelection } = this;
        const { animationManager } = this.ctx;
        const fns = prepareRadialBarSeriesAnimationFunctions(this.axes);
        motion$2.fromToMotion(this.id, 'datums', animationManager, [itemSelection], fns);
        seriesLabelFadeOutAnimation(this, 'labels', animationManager, [this.labelSelection]);
    }
    getTooltipHtml(nodeDatum) {
        var _a;
        const { id: seriesId, axes, angleKey, angleName, radiusKey, radiusName, fill, formatter, stroke, strokeWidth, tooltip, dataModel, } = this;
        const { angleValue, radiusValue, datum } = nodeDatum;
        const xAxis = axes[ChartAxisDirection$4.X];
        const yAxis = axes[ChartAxisDirection$4.Y];
        if (!(angleKey && radiusKey) || !(xAxis && yAxis && isNumber$3(angleValue)) || !dataModel) {
            return '';
        }
        const angleString = xAxis.formatDatum(angleValue);
        const radiusString = yAxis.formatDatum(radiusValue);
        const title = sanitizeHtml$5(angleName);
        const content = sanitizeHtml$5(`${radiusString}: ${angleString}`);
        const { fill: color } = (_a = (formatter &&
            this.ctx.callbackCache.call(formatter, {
                datum,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                angleKey,
                radiusKey,
                seriesId,
            }))) !== null && _a !== void 0 ? _a : { fill };
        return tooltip.toTooltipHtml({ title, backgroundColor: fill, content }, { seriesId, datum, color, title, angleKey, radiusKey, angleName, radiusName });
    }
    getLegendData(legendType) {
        var _a, _b, _c, _d;
        const { id, data, angleKey, angleName, radiusKey, visible } = this;
        if (!((data === null || data === void 0 ? void 0 : data.length) && angleKey && radiusKey && legendType === 'category')) {
            return [];
        }
        return [
            {
                legendType: 'category',
                id,
                itemId: angleKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: angleName !== null && angleName !== void 0 ? angleName : angleKey,
                },
                marker: {
                    fill: (_a = this.fill) !== null && _a !== void 0 ? _a : 'rgba(0, 0, 0, 0)',
                    stroke: (_b = this.stroke) !== null && _b !== void 0 ? _b : 'rgba(0, 0, 0, 0)',
                    fillOpacity: (_c = this.fillOpacity) !== null && _c !== void 0 ? _c : 1,
                    strokeOpacity: (_d = this.strokeOpacity) !== null && _d !== void 0 ? _d : 1,
                    strokeWidth: this.strokeWidth,
                },
            },
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
        const totalVisibleItems = Object.values(numVisibleItems).reduce((p, v) => p + v, 0);
        const wasClicked = series.id === this.id;
        const newEnabled = wasClicked || (enabled && totalVisibleItems === 1);
        this.toggleSeriesItem(itemId, newEnabled);
    }
    computeLabelsBBox() {
        return null;
    }
    getStackId() {
        var _a, _b;
        const groupIndex = (_b = (_a = this.seriesGrouping) === null || _a === void 0 ? void 0 : _a.groupIndex) !== null && _b !== void 0 ? _b : this.id;
        return `radialBar-stack-${groupIndex}-xValues`;
    }
}
RadialBarSeries.className = 'RadialBarSeries';
RadialBarSeries.type = 'radial-bar';
__decorate([
    Validate$7(STRING),
    __metadata("design:type", Object)
], RadialBarSeries.prototype, "angleKey", void 0);
__decorate([
    Validate$7(OPT_STRING$5),
    __metadata("design:type", String)
], RadialBarSeries.prototype, "angleName", void 0);
__decorate([
    Validate$7(STRING),
    __metadata("design:type", String)
], RadialBarSeries.prototype, "radiusKey", void 0);
__decorate([
    Validate$7(OPT_STRING$5),
    __metadata("design:type", String)
], RadialBarSeries.prototype, "radiusName", void 0);
__decorate([
    Validate$7(OPT_COLOR_STRING$5),
    __metadata("design:type", String)
], RadialBarSeries.prototype, "fill", void 0);
__decorate([
    Validate$7(NUMBER$5(0, 1)),
    __metadata("design:type", Object)
], RadialBarSeries.prototype, "fillOpacity", void 0);
__decorate([
    Validate$7(OPT_COLOR_STRING$5),
    __metadata("design:type", String)
], RadialBarSeries.prototype, "stroke", void 0);
__decorate([
    Validate$7(NUMBER$5(0, 1)),
    __metadata("design:type", Object)
], RadialBarSeries.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$7(OPT_LINE_DASH$3),
    __metadata("design:type", Array)
], RadialBarSeries.prototype, "lineDash", void 0);
__decorate([
    Validate$7(NUMBER$5(0)),
    __metadata("design:type", Number)
], RadialBarSeries.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$7(OPT_FUNCTION$4),
    __metadata("design:type", Function)
], RadialBarSeries.prototype, "formatter", void 0);
__decorate([
    Validate$7(NUMBER$5(-360, 360)),
    __metadata("design:type", Object)
], RadialBarSeries.prototype, "rotation", void 0);
__decorate([
    Validate$7(NUMBER$5(0)),
    __metadata("design:type", Object)
], RadialBarSeries.prototype, "strokeWidth", void 0);
__decorate([
    Validate$7(OPT_STRING$5),
    __metadata("design:type", String)
], RadialBarSeries.prototype, "stackGroup", void 0);
__decorate([
    Validate$7(OPT_NUMBER$7()),
    __metadata("design:type", Number)
], RadialBarSeries.prototype, "normalizedTo", void 0);

const RADIAL_BAR_SERIES_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 0,
    label: {
        enabled: false,
        fontSize: 12,
        fontFamily: agChartsCommunity._Theme.DEFAULT_FONT_FAMILY,
        color: agChartsCommunity._Theme.DEFAULT_INVERTED_LABEL_COLOUR,
        __overrides__: agChartsCommunity._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};

const RadialBarModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radial-bar',
    instanceConstructor: RadialBarSeries,
    seriesDefaults: RADIAL_BAR_DEFAULTS,
    themeTemplate: RADIAL_BAR_SERIES_THEME,
    paletteFactory: ({ takeColors }) => {
        const { fills: [fill], strokes: [stroke], } = takeColors(1);
        return {
            fill,
            stroke,
        };
    },
    stackable: true,
    groupable: true,
};

const { POLAR_AXIS_TYPES, CIRCLE } = agChartsCommunity._Theme;
const RADIAL_COLUMN_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPES.ANGLE_CATEGORY,
            shape: CIRCLE,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                padding: 10,
            },
        },
        {
            type: POLAR_AXIS_TYPES.RADIUS_NUMBER,
            shape: CIRCLE,
            innerRadiusRatio: 0.5,
        },
    ],
};

const { Path, Path2D: Path2D$1, ScenePathChangeDetection } = agChartsCommunity._Scene;
const { angleBetween, isNumberEqual, normalizeAngle360 } = agChartsCommunity._Util;
function rotatePoint(x, y, rotation) {
    const radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    const angle = Math.atan2(y, x);
    const rotated = angle + rotation;
    return {
        x: Math.cos(rotated) * radius,
        y: Math.sin(rotated) * radius,
    };
}
class RadialColumnShape extends Path {
    constructor() {
        super(...arguments);
        this.borderPath = new Path2D$1();
        this.isBeveled = true;
        this.columnWidth = 0;
        this.startAngle = 0;
        this.endAngle = 0;
        this.outerRadius = 0;
        this.innerRadius = 0;
        this.axisInnerRadius = 0;
        this.axisOuterRadius = 0;
    }
    getRotation() {
        const { startAngle, endAngle } = this;
        const midAngle = angleBetween(startAngle, endAngle);
        return normalizeAngle360(startAngle + midAngle / 2 + Math.PI / 2);
    }
    updatePath() {
        const { isBeveled } = this;
        if (isBeveled) {
            this.updateBeveledPath();
        }
        else {
            this.updateRectangularPath();
        }
        this.checkPathDirty();
    }
    updateRectangularPath() {
        const { columnWidth, innerRadius, outerRadius, path } = this;
        const left = -columnWidth / 2;
        const right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius;
        const rotation = this.getRotation();
        const points = [
            [left, bottom],
            [left, top],
            [right, top],
            [right, bottom],
            [left, bottom],
        ].map(([x, y]) => rotatePoint(x, y, rotation));
        path.clear({ trackChanges: true });
        path.moveTo(points[0].x, points[0].y);
        path.lineTo(points[1].x, points[1].y);
        path.lineTo(points[2].x, points[2].y);
        path.lineTo(points[3].x, points[3].y);
        path.lineTo(points[0].x, points[0].y);
        path.closePath();
    }
    updateBeveledPath() {
        const { columnWidth, path, outerRadius, innerRadius, axisInnerRadius, axisOuterRadius } = this;
        const isStackBottom = isNumberEqual(innerRadius, axisInnerRadius);
        const sideRotation = Math.asin(columnWidth / 2 / innerRadius);
        const pointRotation = this.getRotation();
        const rotate = (x, y) => rotatePoint(x, y, pointRotation);
        const getTriangleHypotenuse = (leg, otherLeg) => Math.sqrt(Math.pow(leg, 2) + Math.pow(otherLeg, 2));
        const getTriangleLeg = (hypotenuse, otherLeg) => {
            if (otherLeg > hypotenuse) {
                return 0;
            }
            return Math.sqrt(Math.pow(hypotenuse, 2) - Math.pow(otherLeg, 2));
        };
        // Avoid the connecting lines to be too long
        const shouldConnectBottomCircle = isStackBottom && !isNaN(sideRotation) && sideRotation < Math.PI / 6;
        let left = -columnWidth / 2;
        let right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius * (shouldConnectBottomCircle ? Math.cos(sideRotation) : 1);
        const hasBottomIntersection = axisOuterRadius < getTriangleHypotenuse(innerRadius, columnWidth / 2);
        if (hasBottomIntersection) {
            // Crop bottom side overflowing outer radius
            const bottomIntersectionX = getTriangleLeg(axisOuterRadius, innerRadius);
            left = -bottomIntersectionX;
            right = bottomIntersectionX;
        }
        path.clear({ trackChanges: true });
        // Bottom-left point
        const bottomLeftPt = rotate(left, bottom);
        path.moveTo(bottomLeftPt.x, bottomLeftPt.y);
        // Top
        const isEmpty = isNumberEqual(innerRadius, outerRadius);
        const hasSideIntersection = axisOuterRadius < getTriangleHypotenuse(outerRadius, columnWidth / 2);
        if (isEmpty && shouldConnectBottomCircle) {
            // A single line across the axis inner radius
            path.arc(0, 0, innerRadius, normalizeAngle360(-sideRotation - Math.PI / 2) + pointRotation, normalizeAngle360(sideRotation - Math.PI / 2) + pointRotation, false);
        }
        else if (hasSideIntersection) {
            // Crop top side overflowing outer radius
            const sideIntersectionY = -getTriangleLeg(axisOuterRadius, columnWidth / 2);
            const topIntersectionX = getTriangleLeg(axisOuterRadius, outerRadius);
            if (!hasBottomIntersection) {
                const topLeftPt = rotate(left, sideIntersectionY);
                path.lineTo(topLeftPt.x, topLeftPt.y);
            }
            path.arc(0, 0, axisOuterRadius, Math.atan2(sideIntersectionY, left) + pointRotation, Math.atan2(top, -topIntersectionX) + pointRotation, false);
            if (!isNumberEqual(topIntersectionX, 0)) {
                // Connecting line between two top bevels
                const topRightBevelPt = rotate(topIntersectionX, top);
                path.lineTo(topRightBevelPt.x, topRightBevelPt.y);
            }
            path.arc(0, 0, axisOuterRadius, Math.atan2(top, topIntersectionX) + pointRotation, Math.atan2(sideIntersectionY, right) + pointRotation, false);
        }
        else {
            // Basic connecting line
            const topLeftPt = rotate(left, top);
            const topRightPt = rotate(right, top);
            path.lineTo(topLeftPt.x, topLeftPt.y);
            path.lineTo(topRightPt.x, topRightPt.y);
        }
        // Bottom
        const bottomRightPt = rotate(right, bottom);
        path.lineTo(bottomRightPt.x, bottomRightPt.y);
        if (shouldConnectBottomCircle) {
            // Connect column with inner circle
            path.arc(0, 0, innerRadius, normalizeAngle360(sideRotation - Math.PI / 2) + pointRotation, normalizeAngle360(-sideRotation - Math.PI / 2) + pointRotation, true);
        }
        else {
            const bottomLeftPt = rotate(left, bottom);
            path.lineTo(bottomLeftPt.x, bottomLeftPt.y);
        }
        path.closePath();
    }
}
RadialColumnShape.className = 'RadialColumnShape';
__decorate([
    ScenePathChangeDetection(),
    __metadata("design:type", Boolean)
], RadialColumnShape.prototype, "isBeveled", void 0);
__decorate([
    ScenePathChangeDetection(),
    __metadata("design:type", Number)
], RadialColumnShape.prototype, "columnWidth", void 0);
__decorate([
    ScenePathChangeDetection(),
    __metadata("design:type", Number)
], RadialColumnShape.prototype, "startAngle", void 0);
__decorate([
    ScenePathChangeDetection(),
    __metadata("design:type", Number)
], RadialColumnShape.prototype, "endAngle", void 0);
__decorate([
    ScenePathChangeDetection(),
    __metadata("design:type", Number)
], RadialColumnShape.prototype, "outerRadius", void 0);
__decorate([
    ScenePathChangeDetection(),
    __metadata("design:type", Number)
], RadialColumnShape.prototype, "innerRadius", void 0);
__decorate([
    ScenePathChangeDetection(),
    __metadata("design:type", Number)
], RadialColumnShape.prototype, "axisInnerRadius", void 0);
__decorate([
    ScenePathChangeDetection(),
    __metadata("design:type", Number)
], RadialColumnShape.prototype, "axisOuterRadius", void 0);
function getRadialColumnWidth(startAngle, endAngle, axisOuterRadius, columnWidthRatio, maxColumnWidthRatio) {
    const rotation = angleBetween(startAngle, endAngle);
    const pad = (rotation * (1 - columnWidthRatio)) / 2;
    startAngle += pad;
    endAngle -= pad;
    if (rotation >= 2 * Math.PI) {
        const midAngle = startAngle + rotation / 2;
        startAngle = midAngle - Math.PI;
        endAngle = midAngle + Math.PI;
    }
    const startX = axisOuterRadius * Math.cos(startAngle);
    const startY = axisOuterRadius * Math.sin(startAngle);
    const endX = axisOuterRadius * Math.cos(endAngle);
    const endY = axisOuterRadius * Math.sin(endAngle);
    const colWidth = Math.floor(Math.sqrt(Math.pow((startX - endX), 2) + Math.pow((startY - endY), 2)));
    const maxWidth = 2 * axisOuterRadius * maxColumnWidthRatio;
    return Math.max(1, Math.min(maxWidth, colWidth));
}

const { ChartAxisDirection: ChartAxisDirection$3, OPT_NUMBER: OPT_NUMBER$6, PolarAxis, Validate: Validate$6 } = agChartsCommunity._ModuleSupport;
class RadialColumnSeries extends RadialColumnSeriesBase {
    constructor(moduleCtx) {
        super(moduleCtx, {
            animationResetFns: {
                item: resetRadialColumnSelectionFn,
            },
        });
    }
    getStackId() {
        var _a, _b;
        const groupIndex = (_b = (_a = this.seriesGrouping) === null || _a === void 0 ? void 0 : _a.groupIndex) !== null && _b !== void 0 ? _b : this.id;
        return `radarColumn-stack-${groupIndex}-yValues`;
    }
    nodeFactory() {
        return new RadialColumnShape();
    }
    getColumnTransitionFunctions() {
        const axisInnerRadius = this.getAxisInnerRadius();
        return prepareRadialColumnAnimationFunctions(axisInnerRadius);
    }
    isRadiusAxisCircle() {
        const radiusAxis = this.axes[ChartAxisDirection$3.Y];
        return radiusAxis instanceof PolarAxis ? radiusAxis.shape === 'circle' : false;
    }
    updateItemPath(node, datum, highlight) {
        const axisIsCircle = this.isRadiusAxisCircle();
        node.isBeveled = axisIsCircle;
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
        const { radius, columnWidthRatio = 0.5, maxColumnWidthRatio = 0.5 } = this;
        return getRadialColumnWidth(startAngle, endAngle, radius, columnWidthRatio, maxColumnWidthRatio);
    }
}
RadialColumnSeries.className = 'RadialColumnSeries';
RadialColumnSeries.type = 'radial-column';
__decorate([
    Validate$6(OPT_NUMBER$6(0, 1)),
    __metadata("design:type", Number)
], RadialColumnSeries.prototype, "columnWidthRatio", void 0);
__decorate([
    Validate$6(OPT_NUMBER$6(0, 1)),
    __metadata("design:type", Number)
], RadialColumnSeries.prototype, "maxColumnWidthRatio", void 0);

const RADIAL_COLUMN_SERIES_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_SERIES_DEFAULTS,
    columnWidthRatio: 0.5,
    maxColumnWidthRatio: 0.5,
    strokeWidth: 0,
    label: {
        enabled: false,
        fontSize: 12,
        fontFamily: agChartsCommunity._Theme.DEFAULT_FONT_FAMILY,
        color: agChartsCommunity._Theme.DEFAULT_LABEL_COLOUR,
        __overrides__: agChartsCommunity._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};

const RadialColumnModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radial-column',
    instanceConstructor: RadialColumnSeries,
    seriesDefaults: RADIAL_COLUMN_DEFAULTS,
    themeTemplate: RADIAL_COLUMN_SERIES_THEME,
    paletteFactory: ({ takeColors }) => {
        const { fills: [fill], strokes: [stroke], } = takeColors(1);
        return {
            fill,
            stroke,
        };
    },
    stackable: true,
    groupable: true,
};

const { Validate: Validate$5, valueProperty: valueProperty$2, trailingValueProperty, keyProperty: keyProperty$2, ChartAxisDirection: ChartAxisDirection$2, NUMBER: NUMBER$4, STRING_UNION: STRING_UNION$1, OPT_NUMBER: OPT_NUMBER$5, OPT_STRING: OPT_STRING$4, OPT_COLOR_STRING: OPT_COLOR_STRING$4, OPT_LINE_DASH: OPT_LINE_DASH$2, mergeDefaults, updateLabelNode: updateLabelNode$2, fixNumericExtent: fixNumericExtent$2, AreaSeriesTag, buildResetPathFn, resetLabelFn: resetLabelFn$2, resetMarkerFn, resetMarkerPositionFn, pathSwipeInAnimation, resetMotion, markerSwipeScaleInAnimation, seriesLabelFadeInAnimation: seriesLabelFadeInAnimation$2, animationValidation: animationValidation$2, diff: diff$1, } = agChartsCommunity._ModuleSupport;
const { getMarker, PointerEvents: PointerEvents$1, Path2D } = agChartsCommunity._Scene;
const { sanitizeHtml: sanitizeHtml$4, extent: extent$1, isNumber: isNumber$2 } = agChartsCommunity._Util;
const DEFAULT_DIRECTION_KEYS$1 = {
    [agChartsCommunity._ModuleSupport.ChartAxisDirection.X]: ['xKey'],
    [agChartsCommunity._ModuleSupport.ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'],
};
const DEFAULT_DIRECTION_NAMES$1 = {
    [ChartAxisDirection$2.X]: ['xName'],
    [ChartAxisDirection$2.Y]: ['yLowName', 'yHighName', 'yName'],
};
class RangeAreaSeriesNodeClickEvent extends agChartsCommunity._ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.xKey;
        this.yLowKey = series.yLowKey;
        this.yHighKey = series.yHighKey;
    }
}
class RangeAreaSeriesLabel extends agChartsCommunity._Scene.Label {
    constructor() {
        super(...arguments);
        this.placement = 'outside';
        this.padding = 6;
    }
}
__decorate([
    Validate$5(STRING_UNION$1('inside', 'outside')),
    __metadata("design:type", String)
], RangeAreaSeriesLabel.prototype, "placement", void 0);
__decorate([
    Validate$5(OPT_NUMBER$5(0)),
    __metadata("design:type", Number)
], RangeAreaSeriesLabel.prototype, "padding", void 0);
class RangeAreaSeries extends agChartsCommunity._ModuleSupport.CartesianSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            hasHighlightedLabels: true,
            hasMarkers: true,
            pathsPerSeries: 2,
            directionKeys: DEFAULT_DIRECTION_KEYS$1,
            directionNames: DEFAULT_DIRECTION_NAMES$1,
            animationResetFns: {
                path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
                label: resetLabelFn$2,
                marker: (node, datum) => (Object.assign(Object.assign({}, resetMarkerFn(node)), resetMarkerPositionFn(node, datum))),
            },
        });
        this.NodeClickEvent = RangeAreaSeriesNodeClickEvent;
        this.marker = new agChartsCommunity._ModuleSupport.SeriesMarker();
        this.label = new RangeAreaSeriesLabel();
        this.tooltip = new agChartsCommunity._ModuleSupport.SeriesTooltip();
        this.shadow = undefined;
        this.fill = '#99CCFF';
        this.stroke = '#99CCFF';
        this.fillOpacity = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.strokeWidth = 1;
        this.xKey = undefined;
        this.xName = undefined;
        this.yLowKey = undefined;
        this.yLowName = undefined;
        this.yHighKey = undefined;
        this.yHighName = undefined;
        this.yName = undefined;
    }
    processData(dataController) {
        return __awaiter(this, void 0, void 0, function* () {
            const { xKey, yLowKey, yHighKey, data = [] } = this;
            if (!yLowKey || !yHighKey)
                return;
            const { isContinuousX, isContinuousY } = this.isContinuous();
            const extraProps = [];
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            if (!this.ctx.animationManager.isSkipped() && this.processedData) {
                extraProps.push(diff$1(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation$2(this));
            }
            yield this.requestDataModel(dataController, data, {
                props: [
                    keyProperty$2(this, xKey, isContinuousX, { id: `xValue` }),
                    valueProperty$2(this, yLowKey, isContinuousY, { id: `yLowValue`, invalidValue: undefined }),
                    valueProperty$2(this, yHighKey, isContinuousY, { id: `yHighValue`, invalidValue: undefined }),
                    trailingValueProperty(this, yLowKey, isContinuousY, {
                        id: `yLowTrailingValue`,
                        invalidValue: undefined,
                    }),
                    trailingValueProperty(this, yHighKey, isContinuousY, {
                        id: `yHighTrailingValue`,
                        invalidValue: undefined,
                    }),
                    ...extraProps,
                ],
                dataVisible: this.visible,
            });
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        const { processedData, dataModel, axes } = this;
        if (!(processedData && dataModel))
            return [];
        const { domain: { keys: [keys], values, }, } = processedData;
        if (direction === ChartAxisDirection$2.X) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const xAxis = axes[ChartAxisDirection$2.X];
            if ((keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.type) === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }
            return fixNumericExtent$2(extent$1(keys), xAxis);
        }
        else {
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, 'yLowValue').index;
            const yLowExtent = values[yLowIndex];
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, 'yHighValue').index;
            const yHighExtent = values[yHighIndex];
            const fixedYExtent = [
                yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
                yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1],
            ];
            return fixNumericExtent$2(fixedYExtent);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { data, dataModel, axes, visible } = this;
            const xAxis = axes[ChartAxisDirection$2.X];
            const yAxis = axes[ChartAxisDirection$2.Y];
            if (!(data && visible && xAxis && yAxis && dataModel)) {
                return [];
            }
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const { yLowKey = '', yHighKey = '', xKey = '', processedData } = this;
            const itemId = `${yLowKey}-${yHighKey}`;
            const xOffset = ((_a = xScale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
            const defs = dataModel.resolveProcessedDataDefsByIds(this, [
                `xValue`,
                `yHighValue`,
                `yLowValue`,
                `yHighTrailingValue`,
                `yLowTrailingValue`,
            ]);
            const createCoordinates = (xValue, yHigh, yLow) => {
                const x = xScale.convert(xValue) + xOffset;
                const yHighCoordinate = yScale.convert(yHigh);
                const yLowCoordinate = yScale.convert(yLow);
                return [
                    { point: { x, y: yHighCoordinate }, size: this.marker.size, itemId: `high`, yValue: yHigh, xValue },
                    { point: { x, y: yLowCoordinate }, size: this.marker.size, itemId: `low`, yValue: yLow, xValue },
                ];
            };
            const createMovePoint = (plainPoint) => {
                const { point } = plainPoint, stroke = __rest(plainPoint, ["point"]);
                return Object.assign(Object.assign({}, stroke), { point: Object.assign(Object.assign({}, point), { moveTo: true }) });
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
                scales: _super.calculateScaling.call(this),
                visible: this.visible,
            };
            const fillHighPoints = fillData.points;
            const fillLowPoints = [];
            const strokeHighPoints = strokeData.points;
            const strokeLowPoints = [];
            let lastXValue;
            let lastYHighDatum = -Infinity;
            let lastYLowDatum = -Infinity;
            processedData === null || processedData === void 0 ? void 0 : processedData.data.forEach(({ keys, datum, values }, datumIdx) => {
                const dataValues = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
                const { xValue, yHighValue, yLowValue } = dataValues;
                const invalidRange = yHighValue == null || yLowValue == null;
                const points = invalidRange ? [] : createCoordinates(xValue, yHighValue, yLowValue);
                const inverted = yLowValue > yHighValue;
                points.forEach(({ point: { x, y }, size, itemId = '', yValue }) => {
                    // marker data
                    markerData.push({
                        index: datumIdx,
                        series: this,
                        itemId,
                        datum,
                        midPoint: { x, y },
                        yHighValue,
                        yLowValue,
                        xValue,
                        xKey,
                        yLowKey,
                        yHighKey,
                        point: { x, y, size },
                    });
                    // label data
                    const labelDatum = this.createLabelData({
                        point: { x, y },
                        value: yValue,
                        yLowValue,
                        yHighValue,
                        itemId,
                        inverted,
                        datum,
                        series: this,
                    });
                    labelData.push(labelDatum);
                });
                // fill data
                const lastYValid = lastYHighDatum != null && lastYLowDatum != null;
                const lastValid = lastXValue != null && lastYValid;
                const xValid = xValue != null;
                const yValid = yHighValue != null && yLowValue != null;
                let [high, low] = createCoordinates(xValue, yHighValue !== null && yHighValue !== void 0 ? yHighValue : 0, yLowValue !== null && yLowValue !== void 0 ? yLowValue : 0);
                // Handle missing Y-values by 'hiding' the area by making the area height zero between
                // valid points.
                if (!yValid) {
                    const [prevHigh, prevLow] = createCoordinates(lastXValue, 0, 0);
                    fillHighPoints.push(prevHigh);
                    fillLowPoints.push(prevLow);
                }
                else if (!lastYValid) {
                    const [prevHigh, prevLow] = createCoordinates(xValue, 0, 0);
                    fillHighPoints.push(prevHigh);
                    fillLowPoints.push(prevLow);
                }
                if (xValid && yValid) {
                    fillHighPoints.push(high);
                    fillLowPoints.push(low);
                }
                // stroke data
                const move = xValid && yValid && !lastValid && datumIdx > 0;
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
    createLabelData({ point, value, itemId, inverted, datum, series, }) {
        var _a, _b, _c;
        const { placement, padding = 10 } = this.label;
        const actualItemId = inverted ? (itemId === 'low' ? 'high' : 'low') : itemId;
        const direction = (placement === 'outside' && actualItemId === 'high') || (placement === 'inside' && actualItemId === 'low')
            ? -1
            : 1;
        return {
            x: point.x,
            y: point.y + padding * direction,
            series,
            itemId,
            datum,
            text: this.getLabelText(this.label, {
                value,
                datum,
                itemId,
                xKey: (_a = this.xKey) !== null && _a !== void 0 ? _a : '',
                yLowKey: (_b = this.yLowKey) !== null && _b !== void 0 ? _b : '',
                yHighKey: (_c = this.yHighKey) !== null && _c !== void 0 ? _c : '',
                xName: this.xName,
                yLowName: this.yLowName,
                yHighName: this.yHighName,
                yName: this.yName,
            }, (value) => (isNumber$2(value) ? value.toFixed(2) : String(value))),
            textAlign: 'center',
            textBaseline: direction === -1 ? 'bottom' : 'top',
        };
    }
    isPathOrSelectionDirty() {
        return this.marker.isDirty();
    }
    markerFactory() {
        const { shape } = this.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }
    updatePathNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { opacity, visible } = opts;
            const [fill, stroke] = opts.paths;
            const { seriesRectHeight: height, seriesRectWidth: width } = this.nodeDataDependencies;
            const strokeWidth = this.getStrokeWidth(this.strokeWidth);
            stroke.setProperties({
                tag: AreaSeriesTag.Stroke,
                fill: undefined,
                lineJoin: (stroke.lineCap = 'round'),
                pointerEvents: PointerEvents$1.None,
                stroke: this.stroke,
                strokeWidth,
                strokeOpacity: this.strokeOpacity,
                lineDash: this.lineDash,
                lineDashOffset: this.lineDashOffset,
                opacity,
                visible,
            });
            fill.setProperties({
                tag: AreaSeriesTag.Fill,
                stroke: undefined,
                lineJoin: 'round',
                pointerEvents: PointerEvents$1.None,
                fill: this.fill,
                fillOpacity: this.fillOpacity,
                lineDash: this.lineDash,
                lineDashOffset: this.lineDashOffset,
                strokeOpacity: this.strokeOpacity,
                fillShadow: this.shadow,
                strokeWidth,
                opacity,
                visible,
            });
            const updateClipPath = (path) => {
                var _a, _b;
                if (path.clipPath == null) {
                    path.clipPath = new Path2D();
                    path.clipScalingX = 1;
                    path.clipScalingY = 1;
                }
                (_a = path.clipPath) === null || _a === void 0 ? void 0 : _a.clear({ trackChanges: true });
                (_b = path.clipPath) === null || _b === void 0 ? void 0 : _b.rect(-25, -25, (width !== null && width !== void 0 ? width : 0) + 50, (height !== null && height !== void 0 ? height : 0) + 50);
            };
            updateClipPath(stroke);
            updateClipPath(fill);
        });
    }
    updatePaths(opts) {
        return __awaiter(this, void 0, void 0, function* () {
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
                }
                else {
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
                }
                else {
                    strokePath.lineTo(point.x, point.y);
                }
            }
            stroke.checkPathDirty();
        });
    }
    updateMarkerSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nodeData, markerSelection } = opts;
            const { marker: { enabled }, } = this;
            const data = enabled && nodeData ? nodeData : [];
            if (this.marker.isDirty()) {
                markerSelection.clear();
                markerSelection.cleanup();
            }
            return markerSelection.update(data);
        });
    }
    updateMarkerNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { markerSelection, isHighlight: highlighted } = opts;
            const { xKey = '', yLowKey = '', yHighKey = '', marker, fill, stroke, strokeWidth, fillOpacity, strokeOpacity, } = this;
            const baseStyle = mergeDefaults(highlighted && this.highlightStyle.item, marker.getStyle(), {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
            });
            markerSelection.each((node, datum) => {
                this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yHighKey, yLowKey }, baseStyle);
            });
            if (!highlighted) {
                this.marker.markClean();
            }
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelData, labelSelection } = opts;
            return labelSelection.update(labelData, (text) => {
                text.tag = AreaSeriesTag.Label;
                text.pointerEvents = PointerEvents$1.None;
            });
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            opts.labelSelection.each((textNode, datum) => {
                updateLabelNode$2(textNode, this.label, datum);
            });
        });
    }
    getHighlightLabelData(labelData, highlightedItem) {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }
    getHighlightData(nodeData, highlightedItem) {
        const highlightItems = nodeData.filter((nodeDatum) => nodeDatum.datum === highlightedItem.datum);
        return highlightItems.length > 0 ? highlightItems : undefined;
    }
    getTooltipHtml(nodeDatum) {
        const { xKey, yLowKey, yHighKey, axes } = this;
        const xAxis = axes[ChartAxisDirection$2.X];
        const yAxis = axes[ChartAxisDirection$2.Y];
        if (!xKey || !yLowKey || !yHighKey || !xAxis || !yAxis) {
            return '';
        }
        const { xName, yLowName, yHighName, yName, id: seriesId, fill, tooltip } = this;
        const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;
        const color = fill !== null && fill !== void 0 ? fill : 'gray';
        const xString = sanitizeHtml$4(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml$4(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml$4(yAxis.formatDatum(yHighValue));
        const xSubheading = xName !== null && xName !== void 0 ? xName : xKey;
        const yLowSubheading = yLowName !== null && yLowName !== void 0 ? yLowName : yLowKey;
        const yHighSubheading = yHighName !== null && yHighName !== void 0 ? yHighName : yHighKey;
        const title = sanitizeHtml$4(yName);
        const content = yName
            ? `<b>${sanitizeHtml$4(xSubheading)}</b>: ${xString}<br>` +
                `<b>${sanitizeHtml$4(yLowSubheading)}</b>: ${yLowString}<br>` +
                `<b>${sanitizeHtml$4(yHighSubheading)}</b>: ${yHighString}<br>`
            : `${xString}: ${yLowString} - ${yHighString}`;
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, {
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
        });
    }
    getLegendData(legendType) {
        const { id, visible } = this;
        if (legendType !== 'category') {
            return [];
        }
        const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, yName, yLowName, yHighName, yLowKey, yHighKey } = this;
        const legendItemText = yName !== null && yName !== void 0 ? yName : `${yLowName !== null && yLowName !== void 0 ? yLowName : yLowKey} - ${yHighName !== null && yHighName !== void 0 ? yHighName : yHighKey}`;
        return [
            {
                legendType: 'category',
                id,
                itemId: `${yLowKey}-${yHighKey}`,
                seriesId: id,
                enabled: visible,
                label: {
                    text: `${legendItemText}`,
                },
                marker: {
                    fill,
                    stroke,
                    fillOpacity,
                    strokeOpacity,
                    strokeWidth,
                },
            },
        ];
    }
    isLabelEnabled() {
        return this.label.enabled;
    }
    onDataChange() { }
    nodeFactory() {
        return new agChartsCommunity._Scene.Group();
    }
    animateEmptyUpdateReady(animationData) {
        const { markerSelections, labelSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;
        const { seriesRectWidth: width = 0 } = this.nodeDataDependencies;
        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, paths.flat());
        resetMotion(markerSelections, resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelections, width);
        seriesLabelFadeInAnimation$2(this, 'labels', animationManager, labelSelections);
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
}
RangeAreaSeries.className = 'RangeAreaSeries';
RangeAreaSeries.type = 'range-area';
__decorate([
    Validate$5(OPT_COLOR_STRING$4),
    __metadata("design:type", String)
], RangeAreaSeries.prototype, "fill", void 0);
__decorate([
    Validate$5(OPT_COLOR_STRING$4),
    __metadata("design:type", String)
], RangeAreaSeries.prototype, "stroke", void 0);
__decorate([
    Validate$5(NUMBER$4(0, 1)),
    __metadata("design:type", Object)
], RangeAreaSeries.prototype, "fillOpacity", void 0);
__decorate([
    Validate$5(NUMBER$4(0, 1)),
    __metadata("design:type", Object)
], RangeAreaSeries.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$5(OPT_LINE_DASH$2),
    __metadata("design:type", Array)
], RangeAreaSeries.prototype, "lineDash", void 0);
__decorate([
    Validate$5(NUMBER$4(0)),
    __metadata("design:type", Number)
], RangeAreaSeries.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$5(NUMBER$4(0)),
    __metadata("design:type", Number)
], RangeAreaSeries.prototype, "strokeWidth", void 0);
__decorate([
    Validate$5(OPT_STRING$4),
    __metadata("design:type", String)
], RangeAreaSeries.prototype, "xKey", void 0);
__decorate([
    Validate$5(OPT_STRING$4),
    __metadata("design:type", String)
], RangeAreaSeries.prototype, "xName", void 0);
__decorate([
    Validate$5(OPT_STRING$4),
    __metadata("design:type", String)
], RangeAreaSeries.prototype, "yLowKey", void 0);
__decorate([
    Validate$5(OPT_STRING$4),
    __metadata("design:type", String)
], RangeAreaSeries.prototype, "yLowName", void 0);
__decorate([
    Validate$5(OPT_STRING$4),
    __metadata("design:type", String)
], RangeAreaSeries.prototype, "yHighKey", void 0);
__decorate([
    Validate$5(OPT_STRING$4),
    __metadata("design:type", String)
], RangeAreaSeries.prototype, "yHighName", void 0);
__decorate([
    Validate$5(OPT_STRING$4),
    __metadata("design:type", String)
], RangeAreaSeries.prototype, "yName", void 0);

const { CARTESIAN_AXIS_TYPES: CARTESIAN_AXIS_TYPES$2, CARTESIAN_AXIS_POSITIONS: CARTESIAN_AXIS_POSITIONS$2 } = agChartsCommunity._Theme;
const RANGE_AREA_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES$2.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS$2.LEFT,
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
        {
            type: CARTESIAN_AXIS_TYPES$2.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS$2.BOTTOM,
        },
    ],
};

const RANGE_AREA_SERIES_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_SERIES_DEFAULTS,
    xKey: '',
    yLowKey: '',
    yHighKey: '',
    fillOpacity: 0.7,
    nodeClickRange: 'nearest',
    marker: {
        enabled: false,
        fillOpacity: 1,
        strokeWidth: 2,
    },
    label: {
        enabled: false,
        placement: 'outside',
        padding: 10,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 12,
        fontFamily: agChartsCommunity._Theme.DEFAULT_FONT_FAMILY,
        color: agChartsCommunity._Theme.DEFAULT_LABEL_COLOUR,
        __overrides__: agChartsCommunity._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};

const { markerPaletteFactory } = agChartsCommunity._ModuleSupport;
const RangeAreaModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'range-area',
    instanceConstructor: RangeAreaSeries,
    seriesDefaults: RANGE_AREA_DEFAULTS,
    themeTemplate: RANGE_AREA_SERIES_THEME,
    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory(params);
        return {
            fill: marker.fill,
            stroke: marker.stroke,
            marker,
        };
    },
};

const { Validate: Validate$4, SeriesNodePickMode: SeriesNodePickMode$1, valueProperty: valueProperty$1, keyProperty: keyProperty$1, ChartAxisDirection: ChartAxisDirection$1, NUMBER: NUMBER$3, OPT_NUMBER: OPT_NUMBER$4, OPT_STRING: OPT_STRING$3, OPT_FUNCTION: OPT_FUNCTION$3, OPT_COLOR_STRING: OPT_COLOR_STRING$3, OPT_LINE_DASH: OPT_LINE_DASH$1, getRectConfig: getRectConfig$1, updateRect: updateRect$1, checkCrisp: checkCrisp$1, updateLabelNode: updateLabelNode$1, CategoryAxis, SMALLEST_KEY_INTERVAL, STRING_UNION, diff, prepareBarAnimationFunctions: prepareBarAnimationFunctions$1, midpointStartingBarPosition, resetBarSelectionsFn: resetBarSelectionsFn$1, fixNumericExtent: fixNumericExtent$1, seriesLabelFadeInAnimation: seriesLabelFadeInAnimation$1, resetLabelFn: resetLabelFn$1, animationValidation: animationValidation$1, } = agChartsCommunity._ModuleSupport;
const { ContinuousScale: ContinuousScale$1, BandScale, Rect: Rect$2, PointerEvents, motion: motion$1 } = agChartsCommunity._Scene;
const { sanitizeHtml: sanitizeHtml$3, isNumber: isNumber$1, extent } = agChartsCommunity._Util;
const DEFAULT_DIRECTION_KEYS = {
    [agChartsCommunity._ModuleSupport.ChartAxisDirection.X]: ['xKey'],
    [agChartsCommunity._ModuleSupport.ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'],
};
const DEFAULT_DIRECTION_NAMES = {
    [ChartAxisDirection$1.X]: ['xName'],
    [ChartAxisDirection$1.Y]: ['yLowName', 'yHighName', 'yName'],
};
class RangeBarSeriesNodeClickEvent extends agChartsCommunity._ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.xKey;
        this.yLowKey = series.yLowKey;
        this.yHighKey = series.yHighKey;
    }
}
class RangeBarSeriesLabel extends agChartsCommunity._Scene.Label {
    constructor() {
        super(...arguments);
        this.placement = 'inside';
        this.padding = 6;
    }
}
__decorate([
    Validate$4(STRING_UNION('inside', 'outside')),
    __metadata("design:type", String)
], RangeBarSeriesLabel.prototype, "placement", void 0);
__decorate([
    Validate$4(OPT_NUMBER$4(0)),
    __metadata("design:type", Number)
], RangeBarSeriesLabel.prototype, "padding", void 0);
class RangeBarSeries extends agChartsCommunity._ModuleSupport.AbstractBarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode$1.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            directionKeys: DEFAULT_DIRECTION_KEYS,
            directionNames: DEFAULT_DIRECTION_NAMES,
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn$1,
                label: resetLabelFn$1,
            },
        });
        this.NodeClickEvent = RangeBarSeriesNodeClickEvent;
        this.label = new RangeBarSeriesLabel();
        this.tooltip = new agChartsCommunity._ModuleSupport.SeriesTooltip();
        this.formatter = undefined;
        this.shadow = undefined;
        this.fill = '#99CCFF';
        this.stroke = '#99CCFF';
        this.fillOpacity = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.strokeWidth = 1;
        /**
         * Used to get the position of bars within each group.
         */
        this.groupScale = new BandScale();
        this.xKey = undefined;
        this.xName = undefined;
        this.yLowKey = undefined;
        this.yLowName = undefined;
        this.yHighKey = undefined;
        this.yHighName = undefined;
        this.yName = undefined;
        this.smallestDataInterval = undefined;
    }
    resolveKeyDirection(direction) {
        if (this.getBarDirection() === ChartAxisDirection$1.X) {
            if (direction === ChartAxisDirection$1.X) {
                return ChartAxisDirection$1.Y;
            }
            return ChartAxisDirection$1.X;
        }
        return direction;
    }
    processData(dataController) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const { xKey, yLowKey, yHighKey, data = [] } = this;
            if (!yLowKey || !yHighKey)
                return;
            const isContinuousX = ContinuousScale$1.is((_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale);
            const isContinuousY = ContinuousScale$1.is((_b = this.getValueAxis()) === null || _b === void 0 ? void 0 : _b.scale);
            const extraProps = [];
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            if (!this.ctx.animationManager.isSkipped() && this.processedData) {
                extraProps.push(diff(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation$1(this));
            }
            const { processedData } = yield this.requestDataModel(dataController, data, {
                props: [
                    keyProperty$1(this, xKey, isContinuousX, { id: 'xValue' }),
                    valueProperty$1(this, yLowKey, isContinuousY, { id: `yLowValue` }),
                    valueProperty$1(this, yHighKey, isContinuousY, { id: `yHighValue` }),
                    ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                    ...extraProps,
                ],
                groupByKeys: true,
                dataVisible: this.visible,
            });
            this.smallestDataInterval = {
                x: (_d = (_c = processedData.reduced) === null || _c === void 0 ? void 0 : _c.smallestKeyInterval) !== null && _d !== void 0 ? _d : Infinity,
                y: Infinity,
            };
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        var _a;
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel))
            return [];
        const { domain: { keys: [keys], values, }, } = processedData;
        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if ((keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.type) === 'key' && (keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.valueType) === 'category') {
                return keys;
            }
            const { reduced: { [SMALLEST_KEY_INTERVAL.property]: smallestX } = {} } = processedData;
            const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
            const keysExtent = (_a = extent(keys)) !== null && _a !== void 0 ? _a : [NaN, NaN];
            const categoryAxis = this.getCategoryAxis();
            if (direction === ChartAxisDirection$1.Y) {
                return fixNumericExtent$1([keysExtent[0] + -scalePadding, keysExtent[1]], categoryAxis);
            }
            return fixNumericExtent$1([keysExtent[0], keysExtent[1] + scalePadding], categoryAxis);
        }
        else {
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, 'yLowValue').index;
            const yLowExtent = values[yLowIndex];
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, 'yHighValue').index;
            const yHighExtent = values[yHighIndex];
            const fixedYExtent = [
                yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
                yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1],
            ];
            return fixNumericExtent$1(fixedYExtent);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { data, dataModel, smallestDataInterval, visible, groupScale, fill, stroke, strokeWidth, ctx: { seriesStateManager }, } = this;
            const xAxis = this.getCategoryAxis();
            const yAxis = this.getValueAxis();
            if (!(data && visible && xAxis && yAxis && dataModel)) {
                return [];
            }
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const barAlongX = this.getBarDirection() === ChartAxisDirection$1.X;
            const { yLowKey = '', yHighKey = '', xKey = '', processedData } = this;
            const itemId = `${yLowKey}-${yHighKey}`;
            const context = {
                itemId,
                nodeData: [],
                labelData: [],
                scales: _super.calculateScaling.call(this),
                visible: this.visible,
            };
            const domain = [];
            const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
            for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
                domain.push(String(groupIdx));
            }
            const xBandWidth = ContinuousScale$1.is(xScale)
                ? xScale.calcBandwidth(smallestDataInterval === null || smallestDataInterval === void 0 ? void 0 : smallestDataInterval.x)
                : xScale.bandwidth;
            groupScale.domain = domain;
            groupScale.range = [0, xBandWidth !== null && xBandWidth !== void 0 ? xBandWidth : 0];
            if (xAxis instanceof CategoryAxis) {
                groupScale.paddingInner = xAxis.groupPaddingInner;
            }
            else {
                // Number or Time axis
                groupScale.padding = 0;
            }
            // To get exactly `0` padding we need to turn off rounding
            groupScale.round = groupScale.padding !== 0;
            const barWidth = groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume range charts.
                    groupScale.bandwidth
                : // Handle high-volume range charts gracefully.
                    groupScale.rawBandwidth;
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, `yLowValue`).index;
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, `yHighValue`).index;
            const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            processedData === null || processedData === void 0 ? void 0 : processedData.data.forEach(({ keys, datum, values }, dataIndex) => {
                for (let datumIndex = 0; datumIndex < datum.length; datumIndex++) {
                    const xDatum = keys[xIndex];
                    const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex));
                    const rawLowValue = values[datumIndex][yLowIndex];
                    const rawHighValue = values[datumIndex][yHighIndex];
                    const yLowValue = Math.min(rawLowValue, rawHighValue);
                    const yHighValue = Math.max(rawLowValue, rawHighValue);
                    const yLow = Math.round(yScale.convert(yLowValue));
                    const yHigh = Math.round(yScale.convert(yHighValue));
                    const y = yHigh;
                    const bottomY = yLow;
                    const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));
                    const rect = {
                        x: barAlongX ? bottomY : x,
                        y: barAlongX ? x : y,
                        width: barAlongX ? barHeight : barWidth,
                        height: barAlongX ? barWidth : barHeight,
                    };
                    const nodeMidPoint = {
                        x: rect.x + rect.width / 2,
                        y: rect.y + rect.height / 2,
                    };
                    const labelData = this.createLabelData({
                        rect,
                        barAlongX,
                        yLowValue,
                        yHighValue,
                        datum: datum[datumIndex],
                        series: this,
                    });
                    const nodeDatum = {
                        index: dataIndex,
                        series: this,
                        itemId,
                        datum: datum[datumIndex],
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
                        labels: labelData,
                    };
                    context.nodeData.push(nodeDatum);
                    context.labelData.push(...labelData);
                }
            });
            return [context];
        });
    }
    createLabelData({ rect, barAlongX, yLowValue, yHighValue, datum, series, }) {
        var _a, _b, _c;
        const { placement, padding } = this.label;
        const paddingDirection = placement === 'outside' ? 1 : -1;
        const labelPadding = padding * paddingDirection;
        const labelParams = {
            datum,
            xKey: (_a = this.xKey) !== null && _a !== void 0 ? _a : '',
            yLowKey: (_b = this.yLowKey) !== null && _b !== void 0 ? _b : '',
            yHighKey: (_c = this.yHighKey) !== null && _c !== void 0 ? _c : '',
            xName: this.xName,
            yLowName: this.yLowName,
            yHighName: this.yHighName,
            yName: this.yName,
        };
        const yLowLabel = {
            x: rect.x + (barAlongX ? -labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : rect.height + labelPadding),
            textAlign: barAlongX ? 'left' : 'center',
            textBaseline: barAlongX ? 'middle' : 'bottom',
            text: this.getLabelText(this.label, Object.assign({ itemId: 'low', value: yLowValue }, labelParams), (value) => isNumber$1(value) ? value.toFixed(2) : ''),
            itemId: 'low',
            datum,
            series,
        };
        const yHighLabel = {
            x: rect.x + (barAlongX ? rect.width + labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : -labelPadding),
            textAlign: barAlongX ? 'right' : 'center',
            textBaseline: barAlongX ? 'middle' : 'top',
            text: this.getLabelText(this.label, Object.assign({ itemId: 'high', value: yHighValue }, labelParams), (value) => isNumber$1(value) ? value.toFixed(2) : ''),
            itemId: 'high',
            datum,
            series,
        };
        if (placement === 'outside') {
            yLowLabel.textAlign = barAlongX ? 'right' : 'center';
            yLowLabel.textBaseline = barAlongX ? 'middle' : 'top';
            yHighLabel.textAlign = barAlongX ? 'left' : 'center';
            yHighLabel.textBaseline = barAlongX ? 'middle' : 'bottom';
        }
        return [yLowLabel, yHighLabel];
    }
    nodeFactory() {
        return new Rect$2();
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nodeData, datumSelection } = opts;
            const data = nodeData !== null && nodeData !== void 0 ? nodeData : [];
            return datumSelection.update(data, undefined, (datum) => this.getDatumId(datum));
        });
    }
    updateDatumNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { datumSelection, isHighlight } = opts;
            const { yLowKey = '', yHighKey = '', highlightStyle: { item: itemHighlightStyle }, id: seriesId, ctx, } = this;
            const xAxis = this.axes[ChartAxisDirection$1.X];
            const crisp = checkCrisp$1(xAxis === null || xAxis === void 0 ? void 0 : xAxis.visibleRange);
            const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection$1.X;
            datumSelection.each((rect, datum) => {
                const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, formatter, shadow: fillShadow, } = this;
                const style = {
                    fill: datum.fill,
                    stroke: datum.stroke,
                    fillOpacity,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                    fillShadow,
                    strokeWidth: this.getStrokeWidth(strokeWidth),
                };
                const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
                const config = getRectConfig$1({
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
                    yHighKey,
                });
                config.crisp = crisp;
                config.visible = visible;
                updateRect$1({ rect, config });
            });
        });
    }
    getHighlightLabelData(labelData, highlightedItem) {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const labelData = this.label.enabled ? opts.labelData : [];
            return opts.labelSelection.update(labelData, (text) => {
                text.pointerEvents = PointerEvents.None;
            });
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            opts.labelSelection.each((textNode, datum) => {
                updateLabelNode$1(textNode, this.label, datum);
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        var _a, _b;
        const { xKey, yLowKey, yHighKey, ctx: { callbackCache }, } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!xKey || !yLowKey || !yHighKey || !xAxis || !yAxis) {
            return '';
        }
        const { xName, yLowName, yHighName, yName, id: seriesId, fill, strokeWidth, formatter, tooltip } = this;
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
                itemId,
            });
        }
        const color = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill) !== null && _b !== void 0 ? _b : 'gray';
        const xString = sanitizeHtml$3(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml$3(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml$3(yAxis.formatDatum(yHighValue));
        const xSubheading = xName !== null && xName !== void 0 ? xName : xKey;
        const yLowSubheading = yLowName !== null && yLowName !== void 0 ? yLowName : yLowKey;
        const yHighSubheading = yHighName !== null && yHighName !== void 0 ? yHighName : yHighKey;
        const title = sanitizeHtml$3(yName);
        const content = yName
            ? `<b>${sanitizeHtml$3(xSubheading)}</b>: ${xString}<br>` +
                `<b>${sanitizeHtml$3(yLowSubheading)}</b>: ${yLowString}<br>` +
                `<b>${sanitizeHtml$3(yHighSubheading)}</b>: ${yHighString}<br>`
            : `${xString}: ${yLowString} - ${yHighString}`;
        const defaults = {
            title,
            content,
            backgroundColor: color,
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
        });
    }
    getLegendData(legendType) {
        const { id, visible } = this;
        if (legendType !== 'category') {
            return [];
        }
        const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, yName, yLowName, yHighName, yLowKey, yHighKey } = this;
        const legendItemText = yName !== null && yName !== void 0 ? yName : `${yLowName !== null && yLowName !== void 0 ? yLowName : yLowKey} - ${yHighName !== null && yHighName !== void 0 ? yHighName : yHighKey}`;
        return [
            {
                legendType: 'category',
                id,
                itemId: `${yLowKey}-${yHighKey}`,
                seriesId: id,
                enabled: visible,
                label: { text: `${legendItemText}` },
                marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth },
            },
        ];
    }
    animateEmptyUpdateReady({ datumSelections, labelSelections }) {
        const fns = prepareBarAnimationFunctions$1(midpointStartingBarPosition(this.direction === 'vertical'));
        motion$1.fromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation$1(this, 'labels', this.ctx.animationManager, labelSelections);
    }
    animateWaitingUpdateReady(data) {
        var _a;
        const { datumSelections, labelSelections } = data;
        const { processedData } = this;
        const diff = (_a = processedData === null || processedData === void 0 ? void 0 : processedData.reduced) === null || _a === void 0 ? void 0 : _a.diff;
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        const fns = prepareBarAnimationFunctions$1(midpointStartingBarPosition(this.direction === 'vertical'));
        motion$1.fromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, fns, (_, datum) => String(datum.xValue), diff);
        seriesLabelFadeInAnimation$1(this, 'labels', this.ctx.animationManager, labelSelections);
    }
    getDatumId(datum) {
        return `${datum.xValue}`;
    }
    isLabelEnabled() {
        return this.label.enabled;
    }
    onDataChange() { }
}
RangeBarSeries.className = 'RangeBarSeries';
RangeBarSeries.type = 'range-bar';
__decorate([
    Validate$4(OPT_FUNCTION$3),
    __metadata("design:type", Function)
], RangeBarSeries.prototype, "formatter", void 0);
__decorate([
    Validate$4(OPT_COLOR_STRING$3),
    __metadata("design:type", String)
], RangeBarSeries.prototype, "fill", void 0);
__decorate([
    Validate$4(OPT_COLOR_STRING$3),
    __metadata("design:type", String)
], RangeBarSeries.prototype, "stroke", void 0);
__decorate([
    Validate$4(NUMBER$3(0, 1)),
    __metadata("design:type", Object)
], RangeBarSeries.prototype, "fillOpacity", void 0);
__decorate([
    Validate$4(NUMBER$3(0, 1)),
    __metadata("design:type", Object)
], RangeBarSeries.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$4(OPT_LINE_DASH$1),
    __metadata("design:type", Array)
], RangeBarSeries.prototype, "lineDash", void 0);
__decorate([
    Validate$4(NUMBER$3(0)),
    __metadata("design:type", Number)
], RangeBarSeries.prototype, "lineDashOffset", void 0);
__decorate([
    Validate$4(NUMBER$3(0)),
    __metadata("design:type", Number)
], RangeBarSeries.prototype, "strokeWidth", void 0);
__decorate([
    Validate$4(OPT_STRING$3),
    __metadata("design:type", String)
], RangeBarSeries.prototype, "xKey", void 0);
__decorate([
    Validate$4(OPT_STRING$3),
    __metadata("design:type", String)
], RangeBarSeries.prototype, "xName", void 0);
__decorate([
    Validate$4(OPT_STRING$3),
    __metadata("design:type", String)
], RangeBarSeries.prototype, "yLowKey", void 0);
__decorate([
    Validate$4(OPT_STRING$3),
    __metadata("design:type", String)
], RangeBarSeries.prototype, "yLowName", void 0);
__decorate([
    Validate$4(OPT_STRING$3),
    __metadata("design:type", String)
], RangeBarSeries.prototype, "yHighKey", void 0);
__decorate([
    Validate$4(OPT_STRING$3),
    __metadata("design:type", String)
], RangeBarSeries.prototype, "yHighName", void 0);
__decorate([
    Validate$4(OPT_STRING$3),
    __metadata("design:type", String)
], RangeBarSeries.prototype, "yName", void 0);

const { CARTESIAN_AXIS_TYPES: CARTESIAN_AXIS_TYPES$1, CARTESIAN_AXIS_POSITIONS: CARTESIAN_AXIS_POSITIONS$1 } = agChartsCommunity._Theme;
const RANGE_BAR_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES$1.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS$1.BOTTOM,
        },
        {
            type: CARTESIAN_AXIS_TYPES$1.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS$1.LEFT,
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
    ],
};

const RANGE_BAR_SERIES_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_SERIES_DEFAULTS,
    xKey: '',
    yLowKey: '',
    yHighKey: '',
    strokeWidth: 0,
    label: {
        enabled: false,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 12,
        fontFamily: agChartsCommunity._Theme.DEFAULT_FONT_FAMILY,
        color: agChartsCommunity._Theme.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        formatter: undefined,
        placement: 'inside',
        __overrides__: agChartsCommunity._Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};

const RangeBarModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'range-bar',
    instanceConstructor: RangeBarSeries,
    seriesDefaults: RANGE_BAR_DEFAULTS,
    themeTemplate: RANGE_BAR_SERIES_THEME,
    paletteFactory: ({ takeColors }) => {
        const { fills: [fill], strokes: [stroke], } = takeColors(1);
        return {
            fill,
            stroke,
        };
    },
    groupable: true,
    swapDefaultAxesCondition: ({ direction }) => direction === 'horizontal',
};

const { Validate: Validate$3, OPT_NUMBER: OPT_NUMBER$3, TEXT_WRAP, OVERFLOW_STRATEGY } = agChartsCommunity._ModuleSupport;
const { Logger: Logger$1 } = agChartsCommunity._Util;
const { Text: Text$2, Label: Label$1, BBox: BBox$1 } = agChartsCommunity._Scene;
class AutoSizeableLabel extends Label$1 {
    constructor() {
        super(...arguments);
        this.wrapping = 'on-space';
        this.overflowStrategy = 'ellipsis';
        this.minimumFontSize = undefined;
    }
}
__decorate([
    Validate$3(TEXT_WRAP),
    __metadata("design:type", String)
], AutoSizeableLabel.prototype, "wrapping", void 0);
__decorate([
    Validate$3(OVERFLOW_STRATEGY),
    __metadata("design:type", String)
], AutoSizeableLabel.prototype, "overflowStrategy", void 0);
__decorate([
    Validate$3(OPT_NUMBER$3()),
    __metadata("design:type", Number)
], AutoSizeableLabel.prototype, "minimumFontSize", void 0);
function generateLabelSecondaryLabelFontSizeCandidates(label, secondaryLabel) {
    const { fontSize: labelFontSize, minimumFontSize: labelMinimumFontSize = labelFontSize } = label;
    const { fontSize: secondaryLabelFontSize, minimumFontSize: secondaryLabelMinimumFontSize = secondaryLabelFontSize, } = secondaryLabel;
    const labelTracks = labelFontSize - labelMinimumFontSize;
    const secondaryLabelTracks = secondaryLabelFontSize - secondaryLabelMinimumFontSize;
    let currentLabelFontSize = label.fontSize;
    let currentSecondaryLabelFontSize = secondaryLabel.fontSize;
    const out = [{ labelFontSize, secondaryLabelFontSize }];
    while (currentLabelFontSize > labelMinimumFontSize ||
        currentSecondaryLabelFontSize > secondaryLabelMinimumFontSize) {
        const labelProgress = labelTracks > 0 ? (currentLabelFontSize - labelMinimumFontSize) / labelTracks : -1;
        const secondaryLabelProgress = secondaryLabelTracks > 0
            ? (currentSecondaryLabelFontSize - secondaryLabelMinimumFontSize) / secondaryLabelTracks
            : -1;
        if (labelProgress > secondaryLabelProgress) {
            currentLabelFontSize -= 1;
        }
        else {
            currentSecondaryLabelFontSize -= 1;
        }
        out.push({
            labelFontSize: currentLabelFontSize,
            secondaryLabelFontSize: currentSecondaryLabelFontSize,
        });
    }
    out.reverse();
    return out;
}
function maximumValueSatisfying(from, to, iteratee) {
    // Binary search of layouts returning the largest value
    if (from > to) {
        return undefined;
    }
    let min = from;
    let max = to;
    let found;
    while (max >= min) {
        const index = ((max + min) / 2) | 0;
        const value = iteratee(index);
        if (value != null) {
            found = value;
            min = index + 1;
        }
        else {
            max = index - 1;
        }
    }
    return found;
}
function formatStackedLabels(labelValue, labelProps, secondaryLabelValue, secondaryLabelProps, { spacing, padding }, sizeFittingHeight) {
    var _a, _b;
    const widthAdjust = 2 * padding;
    const heightAdjust = 2 * padding + spacing;
    const minimumHeight = ((_a = labelProps.minimumFontSize) !== null && _a !== void 0 ? _a : labelProps.fontSize) +
        ((_b = secondaryLabelProps.minimumFontSize) !== null && _b !== void 0 ? _b : secondaryLabelProps.fontSize);
    if (minimumHeight > sizeFittingHeight(minimumHeight + heightAdjust).height - heightAdjust) {
        return undefined;
    }
    const fontSizeCandidates = generateLabelSecondaryLabelFontSizeCandidates(labelProps, secondaryLabelProps);
    const labelTextNode = new Text$2();
    labelTextNode.setFont(labelProps);
    const labelTextSizeProps = {
        fontFamily: labelProps.fontFamily,
        fontSize: labelProps.fontSize,
        fontStyle: labelProps.fontStyle,
        fontWeight: labelProps.fontWeight,
    };
    const secondaryLabelTextNode = new Text$2();
    secondaryLabelTextNode.setFont(secondaryLabelProps);
    const secondaryLabelTextSizeProps = {
        fontFamily: secondaryLabelProps.fontFamily,
        fontSize: secondaryLabelProps.fontSize,
        fontStyle: secondaryLabelProps.fontStyle,
        fontWeight: secondaryLabelProps.fontWeight,
    };
    // The font size candidates will repeat some font sizes, so cache the results so we don't do extra text measuring
    let label;
    let secondaryLabel;
    const infiniteBBox = new BBox$1(-Infinity, -Infinity, Infinity, Infinity);
    return maximumValueSatisfying(0, fontSizeCandidates.length - 1, (index) => {
        const { labelFontSize, secondaryLabelFontSize } = fontSizeCandidates[index];
        const allowTruncation = index === 0;
        const sizeFitting = sizeFittingHeight(labelFontSize + secondaryLabelFontSize + heightAdjust);
        const availableWidth = sizeFitting.width - widthAdjust;
        const availableHeight = sizeFitting.height - heightAdjust;
        if (labelFontSize + secondaryLabelFontSize > availableHeight) {
            return undefined;
        }
        if (label == null || label.fontSize !== labelFontSize) {
            labelTextSizeProps.fontSize = labelFontSize;
            const labelText = Text$2.wrap(labelValue, availableWidth, availableHeight, labelTextSizeProps, labelProps.wrapping, allowTruncation ? labelProps.overflowStrategy : 'hide');
            const hasValidText = labelText.length !== 0 && labelText !== Text$2.ellipsis;
            labelTextNode.text = labelText;
            labelTextNode.fontSize = labelFontSize;
            const { width, height } = hasValidText ? labelTextNode.computeBBox() : infiniteBBox;
            const labelWidth = width;
            const labelHeight = Math.max(height, labelFontSize);
            label = { text: labelText, fontSize: labelFontSize, width: labelWidth, height: labelHeight };
        }
        if (label.width > availableWidth || label.height > availableHeight) {
            return undefined;
        }
        if (secondaryLabel == null || secondaryLabel.fontSize !== secondaryLabelFontSize) {
            secondaryLabelTextSizeProps.fontSize = secondaryLabelFontSize;
            const secondaryLabelText = Text$2.wrap(secondaryLabelValue, availableWidth, availableHeight, secondaryLabelTextSizeProps, secondaryLabelProps.wrapping, allowTruncation ? secondaryLabelProps.overflowStrategy : 'hide');
            const hasValidText = secondaryLabelText.length !== 0 && secondaryLabelText !== Text$2.ellipsis;
            secondaryLabelTextNode.text = secondaryLabelText;
            secondaryLabelTextNode.fontSize = secondaryLabelFontSize;
            const { width, height } = hasValidText ? secondaryLabelTextNode.computeBBox() : infiniteBBox;
            const secondaryLabelWidth = width;
            const secondaryLabelHeight = Math.max(height, secondaryLabelFontSize);
            secondaryLabel = {
                text: secondaryLabelText,
                fontSize: secondaryLabelFontSize,
                width: secondaryLabelWidth,
                height: secondaryLabelHeight,
            };
        }
        const totalLabelHeight = label.height + secondaryLabel.height;
        if (secondaryLabel.width > availableWidth || totalLabelHeight > availableHeight) {
            return undefined;
        }
        return {
            width: Math.max(label.width, secondaryLabel.width),
            height: totalLabelHeight + spacing,
            meta: sizeFitting.meta,
            label,
            secondaryLabel,
        };
    });
}
function formatSingleLabel(value, props, { padding }, sizeFittingHeight) {
    var _a;
    const sizeAdjust = 2 * padding;
    const minimumFontSize = Math.min((_a = props.minimumFontSize) !== null && _a !== void 0 ? _a : props.fontSize, props.fontSize);
    const textNode = new Text$2();
    textNode.setFont(props);
    const textSizeProps = {
        fontFamily: props.fontFamily,
        fontSize: props.fontSize,
        fontStyle: props.fontStyle,
        fontWeight: props.fontWeight,
    };
    return maximumValueSatisfying(minimumFontSize, props.fontSize, (fontSize) => {
        const sizeFitting = sizeFittingHeight(fontSize + sizeAdjust);
        const availableWidth = sizeFitting.width - sizeAdjust;
        const availableHeight = sizeFitting.height - sizeAdjust;
        if (fontSize > availableHeight) {
            return undefined;
        }
        const allowTruncation = fontSize === minimumFontSize;
        textSizeProps.fontSize = fontSize;
        const text = Text$2.wrap(value, availableWidth, availableHeight, textSizeProps, props.wrapping, allowTruncation ? props.overflowStrategy : 'hide');
        if (text.length === 0 || text === Text$2.ellipsis) {
            return undefined;
        }
        textNode.text = text;
        textNode.fontSize = fontSize;
        const size = textNode.computeBBox();
        const width = size.width;
        const height = Math.max(size.height, fontSize);
        if (size.width > availableWidth || height > availableHeight) {
            return undefined;
        }
        return [{ text, fontSize, width, height }, sizeFitting.meta];
    });
}
function hasInvalidFontSize(label) {
    return label != null && label.minimumFontSize != null && label.fontSize && label.minimumFontSize > label.fontSize;
}
function formatLabels(labelValue, labelProps, secondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight) {
    if (hasInvalidFontSize(labelProps) || hasInvalidFontSize(secondaryLabelProps)) {
        Logger$1.warnOnce(`minimumFontSize should be set to a value less than or equal to the font size`);
    }
    let value;
    if (labelValue != null && secondaryLabelValue != null) {
        value = formatStackedLabels(labelValue, labelProps, secondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight);
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
            meta: meta,
            label,
            secondaryLabel: undefined,
        };
    }
    let secondaryLabelMeta;
    // Only print secondary label on its own if the primary label was not specified
    if (value == null && labelValue == null && secondaryLabelValue != null) {
        secondaryLabelMeta = formatSingleLabel(secondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight);
    }
    if (secondaryLabelMeta != null) {
        const [secondaryLabel, meta] = secondaryLabelMeta;
        value = {
            width: secondaryLabel.width,
            height: secondaryLabel.height,
            meta,
            label: undefined,
            secondaryLabel,
        };
    }
    return value;
}

const { fromToMotion, HighlightStyle: HighlightStyle$1, NUMBER: NUMBER$2, OPT_COLOR_STRING: OPT_COLOR_STRING$2, OPT_FUNCTION: OPT_FUNCTION$2, OPT_NUMBER: OPT_NUMBER$2, OPT_STRING: OPT_STRING$2, SeriesTooltip: SeriesTooltip$1, Validate: Validate$2, } = agChartsCommunity._ModuleSupport;
const { Sector, Group: Group$1, Selection: Selection$1, Text: Text$1 } = agChartsCommunity._Scene;
const { sanitizeHtml: sanitizeHtml$2 } = agChartsCommunity._Util;
const getAngleData = (node, startAngle = 0, angleScale = (2 * Math.PI) / node.sumSize, angleData = Array.from(node, () => undefined)) => {
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
class SunburstLabel extends AutoSizeableLabel {
    constructor() {
        super(...arguments);
        this.spacing = 0;
    }
}
__decorate([
    Validate$2(NUMBER$2()),
    __metadata("design:type", Number)
], SunburstLabel.prototype, "spacing", void 0);
class SunburstSeriesTileHighlightStyle extends HighlightStyle$1 {
    constructor() {
        super(...arguments);
        this.label = new AutoSizeableLabel();
        this.secondaryLabel = new AutoSizeableLabel();
        this.fill = undefined;
        this.fillOpacity = undefined;
        this.stroke = undefined;
        this.strokeWidth = undefined;
        this.strokeOpacity = undefined;
    }
}
__decorate([
    Validate$2(OPT_STRING$2),
    __metadata("design:type", String)
], SunburstSeriesTileHighlightStyle.prototype, "fill", void 0);
__decorate([
    Validate$2(OPT_NUMBER$2(0, 1)),
    __metadata("design:type", Number)
], SunburstSeriesTileHighlightStyle.prototype, "fillOpacity", void 0);
__decorate([
    Validate$2(OPT_COLOR_STRING$2),
    __metadata("design:type", String)
], SunburstSeriesTileHighlightStyle.prototype, "stroke", void 0);
__decorate([
    Validate$2(OPT_NUMBER$2(0)),
    __metadata("design:type", Number)
], SunburstSeriesTileHighlightStyle.prototype, "strokeWidth", void 0);
__decorate([
    Validate$2(OPT_NUMBER$2(0, 1)),
    __metadata("design:type", Number)
], SunburstSeriesTileHighlightStyle.prototype, "strokeOpacity", void 0);
var CircleQuarter;
(function (CircleQuarter) {
    CircleQuarter[CircleQuarter["TopLeft"] = 1] = "TopLeft";
    CircleQuarter[CircleQuarter["TopRight"] = 2] = "TopRight";
    CircleQuarter[CircleQuarter["BottomRight"] = 4] = "BottomRight";
    CircleQuarter[CircleQuarter["BottomLeft"] = 8] = "BottomLeft";
    CircleQuarter[CircleQuarter["Top"] = 3] = "Top";
    CircleQuarter[CircleQuarter["Right"] = 6] = "Right";
    CircleQuarter[CircleQuarter["Bottom"] = 12] = "Bottom";
    CircleQuarter[CircleQuarter["Left"] = 9] = "Left";
})(CircleQuarter || (CircleQuarter = {}));
var LabelPlacement;
(function (LabelPlacement) {
    LabelPlacement[LabelPlacement["CenterCircle"] = 0] = "CenterCircle";
    LabelPlacement[LabelPlacement["Parallel"] = 1] = "Parallel";
    LabelPlacement[LabelPlacement["Perpendicular"] = 2] = "Perpendicular";
})(LabelPlacement || (LabelPlacement = {}));
var TextNodeTag$1;
(function (TextNodeTag) {
    TextNodeTag[TextNodeTag["Primary"] = 0] = "Primary";
    TextNodeTag[TextNodeTag["Secondary"] = 1] = "Secondary";
})(TextNodeTag$1 || (TextNodeTag$1 = {}));
class SunburstSeries extends agChartsCommunity._ModuleSupport.HierarchySeries {
    constructor() {
        super(...arguments);
        this.tooltip = new SeriesTooltip$1();
        this.groupSelection = Selection$1.select(this.contentGroup, Group$1);
        this.highlightSelection = Selection$1.select(this.highlightGroup, Group$1);
        this.angleData = [];
        this.highlightStyle = new SunburstSeriesTileHighlightStyle();
        this.label = new SunburstLabel();
        this.secondaryLabel = new AutoSizeableLabel();
        this.sizeName = undefined;
        this.labelKey = undefined;
        this.secondaryLabelKey = undefined;
        this.fillOpacity = 1;
        this.strokeWidth = 0;
        this.strokeOpacity = 1;
        this.sectorSpacing = undefined;
        this.padding = undefined;
        this.formatter = undefined;
    }
    processData() {
        const _super = Object.create(null, {
            processData: { get: () => super.processData }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName } = this;
            _super.processData.call(this);
            this.angleData = getAngleData(this.rootNode);
            const defaultLabelFormatter = (value) => {
                if (typeof value === 'number') {
                    // This copies what other series are doing - we should look to provide format customization
                    return value.toFixed(2);
                }
                else if (typeof value === 'string') {
                    return value;
                }
                else {
                    return '';
                }
            };
            this.labelData = Array.from(this.rootNode, ({ datum, depth }) => {
                let label;
                if (datum != null && depth != null && labelKey != null && this.label.enabled) {
                    const value = datum[labelKey];
                    label = this.getLabelText(this.label, {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }, defaultLabelFormatter);
                }
                if (label === '') {
                    label = undefined;
                }
                let secondaryLabel;
                if (datum != null && depth != null && secondaryLabelKey != null && this.secondaryLabel.enabled) {
                    const value = datum[secondaryLabelKey];
                    secondaryLabel = this.getLabelText(this.secondaryLabel, {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }, defaultLabelFormatter);
                }
                if (secondaryLabel === '') {
                    secondaryLabel = undefined;
                }
                return label != null || secondaryLabel != null ? { label, secondaryLabel } : undefined;
            });
        });
    }
    updateSelections() {
        return __awaiter(this, void 0, void 0, function* () {
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
                    new Sector(),
                    new Text$1({ tag: TextNodeTag$1.Primary }),
                    new Text$1({ tag: TextNodeTag$1.Secondary }),
                ]);
            };
            this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
            this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
        });
    }
    updateNodes() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { chart, data, maxDepth, sectorSpacing = 0, padding = 0, highlightStyle, labelData } = this;
            if (chart == null || data == null || labelData == null)
                return;
            const { width, height } = chart.seriesRect;
            this.contentGroup.translationX = width / 2;
            this.contentGroup.translationY = height / 2;
            this.highlightGroup.translationX = width / 2;
            this.highlightGroup.translationY = height / 2;
            const baseInset = sectorSpacing * 0.5;
            const radius = Math.min(width, height) / 2;
            const radiusScale = radius / (maxDepth + 1);
            const angleOffset = -Math.PI / 2;
            const highlightedNode = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight();
            const labelTextNode = new Text$1();
            labelTextNode.setFont(this.label);
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
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
                const fill = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : highlightedFill) !== null && _b !== void 0 ? _b : node.fill;
                const fillOpacity = (_d = (_c = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _c !== void 0 ? _c : highlightedFillOpacity) !== null && _d !== void 0 ? _d : this.fillOpacity;
                const stroke = (_f = (_e = format === null || format === void 0 ? void 0 : format.stroke) !== null && _e !== void 0 ? _e : highlightedStroke) !== null && _f !== void 0 ? _f : node.stroke;
                const strokeWidth = (_h = (_g = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _g !== void 0 ? _g : highlightedStrokeWidth) !== null && _h !== void 0 ? _h : this.strokeWidth;
                const strokeOpacity = (_k = (_j = format === null || format === void 0 ? void 0 : format.strokeOpacity) !== null && _j !== void 0 ? _j : highlightedStrokeOpacity) !== null && _k !== void 0 ? _k : this.strokeOpacity;
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
            this.groupSelection.selectByClass(Sector).forEach((sector) => {
                updateSector(sector.datum, sector, false);
            });
            this.highlightSelection.selectByClass(Sector).forEach((sector) => {
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
                    return undefined;
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
                const sizeFittingHeight = (height) => {
                    var _a;
                    const isCenterCircle = depth === 0 && ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.sumSize) === node.sumSize;
                    if (isCenterCircle) {
                        const width = 2 * Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((height * 0.5), 2));
                        return { width, height, meta: LabelPlacement.CenterCircle };
                    }
                    const parallelHeight = height;
                    const availableWidthUntilItHitsTheOuterRadius = 2 * Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((innerRadius + parallelHeight), 2));
                    const availableWidthUntilItHitsTheStraightEdges = deltaInnerAngle < Math.PI ? 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5) : Infinity;
                    const parallelWidth = Math.min(availableWidthUntilItHitsTheOuterRadius, availableWidthUntilItHitsTheStraightEdges);
                    let perpendicularHeight;
                    let perpendicularWidth;
                    if (depth === 0) {
                        // Wedge from center - maximize the width of a box with fixed height
                        perpendicularHeight = height;
                        perpendicularWidth =
                            Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((perpendicularHeight / 2), 2)) -
                                height / (2 * Math.tan(deltaOuterAngle * 0.5));
                    }
                    else {
                        // Outer wedge - fit the height to the sector, then fit the width
                        perpendicularHeight = 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5);
                        perpendicularWidth = Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((perpendicularHeight / 2), 2)) - innerRadius;
                    }
                    return parallelWidth >= perpendicularWidth
                        ? { width: parallelWidth, height: parallelHeight, meta: LabelPlacement.Parallel }
                        : { width: perpendicularWidth, height: perpendicularHeight, meta: LabelPlacement.Perpendicular };
                };
                const formatting = formatLabels(labelDatum === null || labelDatum === void 0 ? void 0 : labelDatum.label, this.label, labelDatum === null || labelDatum === void 0 ? void 0 : labelDatum.secondaryLabel, this.secondaryLabel, { spacing: this.label.spacing, padding }, sizeFittingHeight);
                if (formatting == null)
                    return undefined;
                const { width, height, meta: labelPlacement, label, secondaryLabel } = formatting;
                const theta = angleOffset + (angleData.start + angleData.end) / 2;
                const top = Math.sin(theta) >= 0;
                const right = Math.cos(theta) >= 0;
                const circleQuarter = (top ? CircleQuarter.Top : CircleQuarter.Bottom) & (right ? CircleQuarter.Right : CircleQuarter.Left);
                let radius;
                switch (labelPlacement) {
                    case LabelPlacement.CenterCircle:
                        radius = 0;
                        break;
                    case LabelPlacement.Parallel: {
                        const opticalCentering = 0.58; // Between 0 and 1 - there's no maths behind this, just what visually looks good
                        const idealRadius = outerRadius - (radiusScale - height) * opticalCentering;
                        const maximumRadius = Math.sqrt(Math.pow((outerRadius - padding), 2) - Math.pow((width / 2), 2));
                        radius = Math.min(idealRadius, maximumRadius);
                        break;
                    }
                    case LabelPlacement.Perpendicular:
                        if (depth === 0) {
                            const minimumRadius = height / (2 * Math.tan(deltaInnerAngle * 0.5)) + width * 0.5;
                            const maximumRadius = Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((height * 0.5), 2)) - width * 0.5;
                            radius = (minimumRadius + maximumRadius) * 0.5;
                        }
                        else {
                            radius = (innerRadius + outerRadius) * 0.5;
                        }
                        break;
                }
                return { width, height, labelPlacement, circleQuarter, radius, theta, label, secondaryLabel };
            });
            const updateText = (node, text, tag, highlighted) => {
                const { index, depth } = node;
                const meta = labelMeta === null || labelMeta === void 0 ? void 0 : labelMeta[index];
                const labelStyle = tag === TextNodeTag$1.Primary ? this.label : this.secondaryLabel;
                const label = tag === TextNodeTag$1.Primary ? meta === null || meta === void 0 ? void 0 : meta.label : meta === null || meta === void 0 ? void 0 : meta.secondaryLabel;
                if (depth == null || meta == null || label == null || meta == null) {
                    text.visible = false;
                    return;
                }
                const { height, labelPlacement, circleQuarter, radius, theta } = meta;
                let highlightedColor;
                if (highlighted) {
                    const highlightedLabelStyle = tag === TextNodeTag$1.Primary ? this.highlightStyle.label : this.highlightStyle.secondaryLabel;
                    highlightedColor = highlightedLabelStyle.color;
                }
                text.text = label.text;
                text.fontSize = label.fontSize;
                text.fontStyle = labelStyle.fontStyle;
                text.fontFamily = labelStyle.fontFamily;
                text.fontWeight = labelStyle.fontWeight;
                text.fill = highlightedColor !== null && highlightedColor !== void 0 ? highlightedColor : labelStyle.color;
                switch (labelPlacement) {
                    case LabelPlacement.CenterCircle:
                        text.textAlign = 'center';
                        text.textBaseline = 'top';
                        text.translationX = 0;
                        text.translationY = (tag === TextNodeTag$1.Primary ? 0 : height - label.height) - height * 0.5;
                        text.rotation = 0;
                        break;
                    case LabelPlacement.Parallel: {
                        const topHalf = (circleQuarter & CircleQuarter.Top) !== 0;
                        const translationRadius = (tag === TextNodeTag$1.Primary) === !topHalf ? radius : radius - (height - label.height);
                        text.textAlign = 'center';
                        text.textBaseline = topHalf ? 'bottom' : 'top';
                        text.translationX = Math.cos(theta) * translationRadius;
                        text.translationY = Math.sin(theta) * translationRadius;
                        text.rotation = topHalf ? theta - Math.PI * 0.5 : theta + Math.PI * 0.5;
                        break;
                    }
                    case LabelPlacement.Perpendicular: {
                        const rightHalf = (circleQuarter & CircleQuarter.Right) !== 0;
                        const translation = (tag === TextNodeTag$1.Primary) === !rightHalf
                            ? (height - label.height) * 0.5
                            : (label.height - height) * 0.5;
                        text.textAlign = 'center';
                        text.textBaseline = 'middle';
                        text.translationX = Math.cos(theta) * radius + Math.cos(theta + Math.PI / 2) * translation;
                        text.translationY = Math.sin(theta) * radius + Math.sin(theta + Math.PI / 2) * translation;
                        text.rotation = rightHalf ? theta : theta + Math.PI;
                        break;
                    }
                }
                text.visible = true;
            };
            this.groupSelection.selectByClass(Text$1).forEach((text) => {
                updateText(text.datum, text, text.tag, false);
            });
            this.highlightSelection.selectByClass(Text$1).forEach((text) => {
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
        const { formatter, ctx: { callbackCache }, } = this;
        if (!formatter || datum == null || depth == null) {
            return {};
        }
        const { colorKey, labelKey, sizeKey, strokeWidth } = this;
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
            highlighted: isHighlighted,
        });
        return result !== null && result !== void 0 ? result : {};
    }
    getTooltipHtml(node) {
        var _a;
        const { tooltip, colorKey, colorName = colorKey, labelKey, secondaryLabelKey, sizeKey, sizeName = sizeKey, id: seriesId, } = this;
        const { datum, depth } = node;
        if (datum == null || depth == null) {
            return '';
        }
        const title = labelKey != null ? datum[labelKey] : undefined;
        const format = this.getSectorFormat(node, false);
        const color = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : node.fill;
        if (!tooltip.renderer && !tooltip.format && !title) {
            return '';
        }
        const contentArray = [];
        const datumSecondaryLabel = secondaryLabelKey != null ? datum[secondaryLabelKey] : undefined;
        if (datumSecondaryLabel != null && secondaryLabelKey !== colorKey && secondaryLabelKey !== sizeKey) {
            contentArray.push(sanitizeHtml$2(datumSecondaryLabel));
        }
        const datumSize = sizeKey != null ? datum[sizeKey] : undefined;
        if (datumSize != null) {
            contentArray.push(`${sizeName}: ${sanitizeHtml$2(datumSize)}`);
        }
        const datumColor = colorKey != null ? datum[colorKey] : undefined;
        if (datumColor != null) {
            contentArray.push(`${colorName}: ${sanitizeHtml$2(datumColor)}`);
        }
        const content = contentArray.join('<br>');
        const defaults = {
            title,
            color: this.label.color,
            backgroundColor: color,
            content,
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
        });
    }
    createNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
    animateEmptyUpdateReady({ datumSelections, }) {
        fromToMotion(this.id, 'nodes', this.ctx.animationManager, datumSelections, {
            toFn(_group, _datum, _status) {
                return { scalingX: 1, scalingY: 1 };
            },
            fromFn(group, datum, status) {
                if (status === 'unknown' && datum != null && group.previousDatum == null) {
                    return { scalingX: 0, scalingY: 0 };
                }
                else {
                    return { scalingX: 1, scalingY: 1 };
                }
            },
        });
    }
}
SunburstSeries.className = 'SunburstSeries';
SunburstSeries.type = 'sunburst';
__decorate([
    Validate$2(OPT_STRING$2),
    __metadata("design:type", String)
], SunburstSeries.prototype, "sizeName", void 0);
__decorate([
    Validate$2(OPT_STRING$2),
    __metadata("design:type", String)
], SunburstSeries.prototype, "labelKey", void 0);
__decorate([
    Validate$2(OPT_STRING$2),
    __metadata("design:type", String)
], SunburstSeries.prototype, "secondaryLabelKey", void 0);
__decorate([
    Validate$2(NUMBER$2(0, 1)),
    __metadata("design:type", Number)
], SunburstSeries.prototype, "fillOpacity", void 0);
__decorate([
    Validate$2(NUMBER$2(0)),
    __metadata("design:type", Number)
], SunburstSeries.prototype, "strokeWidth", void 0);
__decorate([
    Validate$2(NUMBER$2(0, 1)),
    __metadata("design:type", Number)
], SunburstSeries.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$2(OPT_NUMBER$2()),
    __metadata("design:type", Number)
], SunburstSeries.prototype, "sectorSpacing", void 0);
__decorate([
    Validate$2(OPT_NUMBER$2()),
    __metadata("design:type", Number)
], SunburstSeries.prototype, "padding", void 0);
__decorate([
    Validate$2(OPT_FUNCTION$2),
    __metadata("design:type", Function)
], SunburstSeries.prototype, "formatter", void 0);

const { EXTENDS_SERIES_DEFAULTS: EXTENDS_SERIES_DEFAULTS$1, DEFAULT_INSIDE_SERIES_LABEL_COLOUR: DEFAULT_INSIDE_SERIES_LABEL_COLOUR$1 } = agChartsCommunity._Theme;
const SunburstSeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],
    identifier: 'sunburst',
    instanceConstructor: SunburstSeries,
    seriesDefaults: {
        gradientLegend: {
            enabled: true,
        },
    },
    solo: true,
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS$1,
        label: {
            fontSize: 14,
            minimumFontSize: 9,
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR$1,
            overflowStrategy: 'ellipsis',
            wrapping: 'never',
            spacing: 2,
        },
        secondaryLabel: {
            fontSize: 8,
            minimumFontSize: 7,
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR$1,
            overflowStrategy: 'ellipsis',
            wrapping: 'never',
        },
        sectorSpacing: 2,
        padding: 3,
        highlightStyle: {
            label: {
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR$1,
            },
            secondaryLabel: {
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR$1,
            },
            stroke: `rgba(0, 0, 0, 0.4)`,
            strokeWidth: 2,
        },
    },
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const { fills, strokes } = takeColors(colorsCount);
        const defaultColorRange = properties.get(agChartsCommunity._Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        return { fills, strokes, colorRange: defaultColorRange };
    },
};

const { BOOLEAN: BOOLEAN$1, HighlightStyle, NUMBER: NUMBER$1, OPT_COLOR_STRING: OPT_COLOR_STRING$1, OPT_FUNCTION: OPT_FUNCTION$1, OPT_NUMBER: OPT_NUMBER$1, OPT_STRING: OPT_STRING$1, SeriesTooltip, TEXT_ALIGN, Validate: Validate$1, VERTICAL_ALIGN, } = agChartsCommunity._ModuleSupport;
const { Rect: Rect$1, Label, Group, BBox, Selection, Text } = agChartsCommunity._Scene;
const { Color, Logger, isEqual, sanitizeHtml: sanitizeHtml$1 } = agChartsCommunity._Util;
class TreemapGroupLabel extends Label {
    constructor() {
        super(...arguments);
        this.spacing = 0;
    }
}
__decorate([
    Validate$1(NUMBER$1()),
    __metadata("design:type", Number)
], TreemapGroupLabel.prototype, "spacing", void 0);
class TreemapSeriesGroup {
    constructor() {
        this.label = new TreemapGroupLabel();
        this.gap = 0;
        this.interactive = true;
        this.textAlign = 'center';
        this.fill = undefined;
        this.fillOpacity = 1;
        this.stroke = undefined;
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.padding = 0;
    }
}
__decorate([
    Validate$1(OPT_NUMBER$1()),
    __metadata("design:type", Number)
], TreemapSeriesGroup.prototype, "gap", void 0);
__decorate([
    Validate$1(BOOLEAN$1),
    __metadata("design:type", Boolean)
], TreemapSeriesGroup.prototype, "interactive", void 0);
__decorate([
    Validate$1(TEXT_ALIGN),
    __metadata("design:type", String)
], TreemapSeriesGroup.prototype, "textAlign", void 0);
__decorate([
    Validate$1(OPT_STRING$1),
    __metadata("design:type", String)
], TreemapSeriesGroup.prototype, "fill", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0, 1)),
    __metadata("design:type", Number)
], TreemapSeriesGroup.prototype, "fillOpacity", void 0);
__decorate([
    Validate$1(OPT_COLOR_STRING$1),
    __metadata("design:type", String)
], TreemapSeriesGroup.prototype, "stroke", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0)),
    __metadata("design:type", Number)
], TreemapSeriesGroup.prototype, "strokeWidth", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0, 1)),
    __metadata("design:type", Number)
], TreemapSeriesGroup.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0)),
    __metadata("design:type", Number)
], TreemapSeriesGroup.prototype, "padding", void 0);
class TreemapTileLabel extends AutoSizeableLabel {
    constructor() {
        super(...arguments);
        this.spacing = 0;
    }
}
__decorate([
    Validate$1(NUMBER$1()),
    __metadata("design:type", Number)
], TreemapTileLabel.prototype, "spacing", void 0);
class TreemapSeriesTile {
    constructor() {
        this.label = new TreemapTileLabel();
        this.secondaryLabel = new AutoSizeableLabel();
        this.gap = 0;
        this.fill = undefined;
        this.fillOpacity = 1;
        this.stroke = undefined;
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.padding = 0;
        this.textAlign = 'center';
        this.verticalAlign = 'middle';
    }
}
__decorate([
    Validate$1(OPT_NUMBER$1()),
    __metadata("design:type", Number)
], TreemapSeriesTile.prototype, "gap", void 0);
__decorate([
    Validate$1(OPT_STRING$1),
    __metadata("design:type", String)
], TreemapSeriesTile.prototype, "fill", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0, 1)),
    __metadata("design:type", Number)
], TreemapSeriesTile.prototype, "fillOpacity", void 0);
__decorate([
    Validate$1(OPT_COLOR_STRING$1),
    __metadata("design:type", String)
], TreemapSeriesTile.prototype, "stroke", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0)),
    __metadata("design:type", Number)
], TreemapSeriesTile.prototype, "strokeWidth", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0, 1)),
    __metadata("design:type", Number)
], TreemapSeriesTile.prototype, "strokeOpacity", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0)),
    __metadata("design:type", Number)
], TreemapSeriesTile.prototype, "padding", void 0);
__decorate([
    Validate$1(TEXT_ALIGN),
    __metadata("design:type", String)
], TreemapSeriesTile.prototype, "textAlign", void 0);
__decorate([
    Validate$1(VERTICAL_ALIGN),
    __metadata("design:type", String)
], TreemapSeriesTile.prototype, "verticalAlign", void 0);
class TreemapSeriesGroupHighlightStyle {
    constructor() {
        this.label = new AutoSizeableLabel();
        this.fill = undefined;
        this.fillOpacity = undefined;
        this.stroke = undefined;
        this.strokeWidth = undefined;
        this.strokeOpacity = undefined;
    }
}
__decorate([
    Validate$1(OPT_STRING$1),
    __metadata("design:type", String)
], TreemapSeriesGroupHighlightStyle.prototype, "fill", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0, 1)),
    __metadata("design:type", Number)
], TreemapSeriesGroupHighlightStyle.prototype, "fillOpacity", void 0);
__decorate([
    Validate$1(OPT_COLOR_STRING$1),
    __metadata("design:type", String)
], TreemapSeriesGroupHighlightStyle.prototype, "stroke", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0)),
    __metadata("design:type", Number)
], TreemapSeriesGroupHighlightStyle.prototype, "strokeWidth", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0, 1)),
    __metadata("design:type", Number)
], TreemapSeriesGroupHighlightStyle.prototype, "strokeOpacity", void 0);
class TreemapSeriesTileHighlightStyle {
    constructor() {
        this.label = new AutoSizeableLabel();
        this.secondaryLabel = new AutoSizeableLabel();
        this.fill = undefined;
        this.fillOpacity = undefined;
        this.stroke = undefined;
        this.strokeWidth = undefined;
        this.strokeOpacity = undefined;
    }
}
__decorate([
    Validate$1(OPT_STRING$1),
    __metadata("design:type", String)
], TreemapSeriesTileHighlightStyle.prototype, "fill", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0, 1)),
    __metadata("design:type", Number)
], TreemapSeriesTileHighlightStyle.prototype, "fillOpacity", void 0);
__decorate([
    Validate$1(OPT_COLOR_STRING$1),
    __metadata("design:type", String)
], TreemapSeriesTileHighlightStyle.prototype, "stroke", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0)),
    __metadata("design:type", Number)
], TreemapSeriesTileHighlightStyle.prototype, "strokeWidth", void 0);
__decorate([
    Validate$1(OPT_NUMBER$1(0, 1)),
    __metadata("design:type", Number)
], TreemapSeriesTileHighlightStyle.prototype, "strokeOpacity", void 0);
class TreemapSeriesHighlightStyle extends HighlightStyle {
    constructor() {
        super(...arguments);
        this.group = new TreemapSeriesGroupHighlightStyle();
        this.tile = new TreemapSeriesTileHighlightStyle();
    }
}
var TextNodeTag;
(function (TextNodeTag) {
    TextNodeTag[TextNodeTag["Primary"] = 0] = "Primary";
    TextNodeTag[TextNodeTag["Secondary"] = 1] = "Secondary";
})(TextNodeTag || (TextNodeTag = {}));
const tempText = new Text();
function getTextSize(text, style) {
    const { fontStyle, fontWeight, fontSize, fontFamily } = style;
    tempText.setProperties({
        text,
        fontStyle,
        fontWeight,
        fontSize,
        fontFamily,
        textAlign: 'left',
        textBaseline: 'top',
    });
    const { width, height } = tempText.computeBBox();
    return { width, height };
}
function validateColor(color) {
    if (typeof color === 'string' && !Color.validColorString(color)) {
        const fallbackColor = 'black';
        Logger.warnOnce(`invalid Treemap tile colour string "${color}". Affected treemap tiles will be coloured ${fallbackColor}.`);
        return fallbackColor;
    }
    return color;
}
function nodeSize(node) {
    return node.children.length > 0 ? node.sumSize - node.size : node.size;
}
const textAlignFactors = {
    left: 0,
    center: 0.5,
    right: 1,
};
const verticalAlignFactors = {
    top: 0,
    middle: 0.5,
    bottom: 1,
};
class TreemapSeries extends agChartsCommunity._ModuleSupport.HierarchySeries {
    constructor() {
        super(...arguments);
        this.groupSelection = Selection.select(this.contentGroup, Group);
        this.highlightSelection = Selection.select(this.highlightGroup, Group);
        this.group = new TreemapSeriesGroup();
        this.tile = new TreemapSeriesTile();
        this.highlightStyle = new TreemapSeriesHighlightStyle();
        this.tooltip = new SeriesTooltip();
        this.sizeName = undefined;
        this.labelKey = undefined;
        this.secondaryLabelKey = undefined;
        this.formatter = undefined;
        // We haven't decided how to expose this yet, but we need to have this property so it can change between light and dark themes
        this.undocumentedGroupFills = [];
        // We haven't decided how to expose this yet, but we need to have this property so it can change between light and dark themes
        this.undocumentedGroupStrokes = [];
    }
    groupTitleHeight(node, bbox) {
        var _a, _b;
        const label = (_b = (_a = this.labelData) === null || _a === void 0 ? void 0 : _a[node.index]) === null || _b === void 0 ? void 0 : _b.label;
        const { label: font } = this.group;
        const heightRatioThreshold = 3;
        if (label == null) {
            return undefined;
        }
        else if (font.fontSize > bbox.width / heightRatioThreshold ||
            font.fontSize > bbox.height / heightRatioThreshold) {
            return undefined;
        }
        else {
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
                left: 0,
            };
        }
        else if (node.children.length === 0) {
            const { padding } = this.tile;
            return {
                top: padding,
                right: padding,
                bottom: padding,
                left: padding,
            };
        }
        const { label: { spacing }, padding, } = this.group;
        const fontHeight = this.groupTitleHeight(node, bbox);
        const titleHeight = fontHeight != null ? fontHeight + spacing : 0;
        return {
            top: padding + titleHeight,
            right: padding,
            bottom: padding,
            left: padding,
        };
    }
    processData() {
        const _super = Object.create(null, {
            processData: { get: () => super.processData }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.processData.call(this);
            const { data, childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName, tile, group } = this;
            if (data == null || data.length === 0) {
                this.labelData = undefined;
                return;
            }
            const defaultLabelFormatter = (value) => {
                if (typeof value === 'number') {
                    // This copies what other series are doing - we should look to provide format customization
                    return value.toFixed(2);
                }
                else if (typeof value === 'string') {
                    return value;
                }
                else {
                    return '';
                }
            };
            this.labelData = Array.from(this.rootNode, ({ datum, depth, children }) => {
                const isLeaf = children.length === 0;
                const labelStyle = isLeaf ? tile.label : group.label;
                let label;
                if (datum != null && depth != null && labelKey != null && labelStyle.enabled) {
                    const value = datum[labelKey];
                    label = this.getLabelText(labelStyle, {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }, defaultLabelFormatter);
                }
                if (label === '') {
                    label = undefined;
                }
                let secondaryLabel;
                if (isLeaf && datum != null && depth != null && secondaryLabelKey != null && tile.secondaryLabel.enabled) {
                    const value = datum[secondaryLabelKey];
                    secondaryLabel = this.getLabelText(tile.secondaryLabel, {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }, defaultLabelFormatter);
                }
                if (secondaryLabel === '') {
                    secondaryLabel = undefined;
                }
                return label != null || secondaryLabel != null ? { label, secondaryLabel } : undefined;
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
            outputBoxes[index] = undefined;
            return;
        }
        outputBoxes[index] = index !== 0 ? bbox : undefined;
        const sortedChildrenIndices = Array.from(children, (_, index) => index)
            .filter((index) => nodeSize(children[index]) > 0)
            .sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));
        const childAt = (index) => {
            const sortedIndex = sortedChildrenIndices[index];
            return children[sortedIndex];
        };
        const allLeafNodes = sortedChildrenIndices.every((index) => childAt(index).children.length === 0);
        const targetTileAspectRatio = 1; // The width and height will tend to this ratio
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
        const innerBox = new BBox(bbox.x + padding.left, bbox.y + padding.top, width, height);
        const partition = innerBox.clone();
        for (let i = 0; i < numChildren; i++) {
            const value = nodeSize(childAt(i));
            const firstValue = nodeSize(childAt(startIndex));
            const isVertical = partition.width < partition.height;
            stackSum += value;
            const partThickness = isVertical ? partition.height : partition.width;
            const partLength = isVertical ? partition.width : partition.height;
            const firstTileLength = (partLength * firstValue) / stackSum;
            let stackThickness = (partThickness * stackSum) / partitionSum;
            const ratio = Math.max(firstTileLength, stackThickness) / Math.min(firstTileLength, stackThickness);
            const diff = Math.abs(targetTileAspectRatio - ratio);
            if (diff < minRatioDiff) {
                minRatioDiff = diff;
                continue;
            }
            // Go one step back and process the best match
            stackSum -= value;
            stackThickness = (partThickness * stackSum) / partitionSum;
            let start = isVertical ? partition.x : partition.y;
            for (let j = startIndex; j < i; j++) {
                const child = childAt(j);
                const childSize = nodeSize(child);
                const x = isVertical ? start : partition.x;
                const y = isVertical ? partition.y : start;
                const length = (partLength * childSize) / stackSum;
                const width = isVertical ? length : stackThickness;
                const height = isVertical ? stackThickness : length;
                const childBbox = new BBox(x, y, width, height);
                this.applyGap(innerBox, childBbox, allLeafNodes);
                this.squarify(child, childBbox, outputBoxes);
                partitionSum -= childSize;
                start += length;
            }
            if (isVertical) {
                partition.y += stackThickness;
                partition.height -= stackThickness;
            }
            else {
                partition.x += stackThickness;
                partition.width -= stackThickness;
            }
            startIndex = i;
            stackSum = 0;
            minRatioDiff = Infinity;
            i--;
        }
        // Process remaining space
        const isVertical = partition.width < partition.height;
        let start = isVertical ? partition.x : partition.y;
        for (let i = startIndex; i < numChildren; i++) {
            const child = childAt(i);
            const x = isVertical ? start : partition.x;
            const y = isVertical ? partition.y : start;
            const part = nodeSize(child) / partitionSum;
            const width = partition.width * (isVertical ? part : 1);
            const height = partition.height * (isVertical ? 1 : part);
            const childBox = new BBox(x, y, width, height);
            this.applyGap(innerBox, childBox, allLeafNodes);
            this.squarify(child, childBox, outputBoxes);
            start += isVertical ? width : height;
        }
    }
    applyGap(innerBox, childBox, allLeafNodes) {
        const gap = allLeafNodes ? this.tile.gap * 0.5 : this.group.gap * 0.5;
        const getBounds = (box) => ({
            left: box.x,
            top: box.y,
            right: box.x + box.width,
            bottom: box.y + box.height,
        });
        const innerBounds = getBounds(innerBox);
        const childBounds = getBounds(childBox);
        const sides = ['top', 'right', 'bottom', 'left'];
        sides.forEach((side) => {
            if (!isEqual(innerBounds[side], childBounds[side])) {
                childBox.shrink(gap, side);
            }
        });
    }
    createNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
    updateSelections() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.nodeDataRefresh) {
                return;
            }
            this.nodeDataRefresh = false;
            const { seriesRect } = (_a = this.chart) !== null && _a !== void 0 ? _a : {};
            if (!seriesRect)
                return;
            const descendants = Array.from(this.rootNode);
            const updateGroup = (group) => {
                group.append([
                    new Rect$1(),
                    new Text({ tag: TextNodeTag.Primary }),
                    new Text({ tag: TextNodeTag.Secondary }),
                ]);
            };
            this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
            this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
        });
    }
    getTileFormat(node, isHighlighted) {
        var _a, _b;
        const { datum, depth, children } = node;
        const { tile, group, formatter, ctx: { callbackCache }, } = this;
        if (!formatter || datum == null || depth == null) {
            return {};
        }
        const { colorKey, labelKey, secondaryLabelKey, sizeKey } = this;
        const isLeaf = children.length === 0;
        const fill = (_a = (isLeaf ? tile.fill : group.fill)) !== null && _a !== void 0 ? _a : node.fill;
        const stroke = (_b = (isLeaf ? tile.stroke : group.stroke)) !== null && _b !== void 0 ? _b : node.stroke;
        const strokeWidth = isLeaf ? tile.strokeWidth : group.strokeWidth;
        const result = callbackCache.call(formatter, {
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
            highlighted: isHighlighted,
        });
        return result !== null && result !== void 0 ? result : {};
    }
    getNodeFill(node) {
        var _a, _b, _c;
        const isLeaf = node.children.length === 0;
        if (isLeaf) {
            return (_a = this.tile.fill) !== null && _a !== void 0 ? _a : node.fill;
        }
        else {
            const { undocumentedGroupFills } = this;
            const defaultFill = undocumentedGroupFills[Math.min((_b = node.depth) !== null && _b !== void 0 ? _b : 0, undocumentedGroupFills.length)];
            return (_c = this.group.fill) !== null && _c !== void 0 ? _c : defaultFill;
        }
    }
    getNodeStroke(node) {
        var _a, _b, _c;
        const isLeaf = node.children.length === 0;
        if (isLeaf) {
            return (_a = this.tile.stroke) !== null && _a !== void 0 ? _a : node.stroke;
        }
        else {
            const { undocumentedGroupStrokes } = this;
            const defaultStroke = undocumentedGroupStrokes[Math.min((_b = node.depth) !== null && _b !== void 0 ? _b : 0, undocumentedGroupStrokes.length)];
            return (_c = this.group.stroke) !== null && _c !== void 0 ? _c : defaultStroke;
        }
    }
    updateNodes() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { rootNode, data, highlightStyle, tile, group } = this;
            const { seriesRect } = (_a = this.chart) !== null && _a !== void 0 ? _a : {};
            if (!seriesRect || !data)
                return;
            const { width, height } = seriesRect;
            const bboxes = Array.from(this.rootNode, () => undefined);
            this.squarify(rootNode, new BBox(0, 0, width, height), bboxes);
            let highlightedNode = (_b = this.ctx.highlightManager) === null || _b === void 0 ? void 0 : _b.getActiveHighlight();
            if (highlightedNode != null && !this.group.interactive && highlightedNode.children.length !== 0) {
                highlightedNode = undefined;
            }
            this.updateNodeMidPoint(bboxes);
            const updateRectFn = (node, rect, highlighted) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
                    const { tile, group } = highlightStyle;
                    highlightedFill = isLeaf ? tile.fill : group.fill;
                    highlightedFillOpacity = isLeaf ? tile.fillOpacity : group.fillOpacity;
                    highlightedStroke = isLeaf ? tile.stroke : group.stroke;
                    highlightedStrokeWidth = isLeaf ? tile.strokeWidth : group.strokeWidth;
                    highlightedStrokeOpacity = isLeaf ? tile.strokeOpacity : group.strokeOpacity;
                }
                const format = this.getTileFormat(node, highlighted);
                const fill = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : highlightedFill) !== null && _b !== void 0 ? _b : this.getNodeFill(node);
                const fillOpacity = (_d = (_c = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _c !== void 0 ? _c : highlightedFillOpacity) !== null && _d !== void 0 ? _d : (isLeaf ? tile.fillOpacity : group.fillOpacity);
                const stroke = (_f = (_e = format === null || format === void 0 ? void 0 : format.stroke) !== null && _e !== void 0 ? _e : highlightedStroke) !== null && _f !== void 0 ? _f : this.getNodeStroke(node);
                const strokeWidth = (_h = (_g = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _g !== void 0 ? _g : highlightedStrokeWidth) !== null && _h !== void 0 ? _h : (isLeaf ? tile.strokeWidth : group.strokeWidth);
                const strokeOpacity = (_k = (_j = format === null || format === void 0 ? void 0 : format.strokeOpacity) !== null && _j !== void 0 ? _j : highlightedStrokeOpacity) !== null && _k !== void 0 ? _k : (isLeaf ? tile.strokeOpacity : group.strokeOpacity);
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
            this.groupSelection.selectByClass(Rect$1).forEach((rect) => updateRectFn(rect.datum, rect, false));
            this.highlightSelection.selectByClass(Rect$1).forEach((rect) => {
                var _a;
                const isDatumHighlighted = rect.datum === highlightedNode;
                rect.visible = isDatumHighlighted || ((_a = highlightedNode === null || highlightedNode === void 0 ? void 0 : highlightedNode.contains(rect.datum)) !== null && _a !== void 0 ? _a : false);
                if (rect.visible) {
                    updateRectFn(rect.datum, rect, isDatumHighlighted);
                }
            });
            const labelMeta = Array.from(this.rootNode, (node) => {
                var _a, _b, _c, _d;
                const { index, children } = node;
                const bbox = bboxes[index];
                const labelDatum = (_a = this.labelData) === null || _a === void 0 ? void 0 : _a[index];
                if (bbox == null || labelDatum == null)
                    return undefined;
                if (children.length === 0) {
                    const layout = {
                        width: bbox.width,
                        height: bbox.height,
                        meta: null,
                    };
                    const formatting = formatLabels(labelDatum === null || labelDatum === void 0 ? void 0 : labelDatum.label, this.tile.label, labelDatum === null || labelDatum === void 0 ? void 0 : labelDatum.secondaryLabel, this.tile.secondaryLabel, { spacing: tile.label.spacing, padding: tile.padding }, () => layout);
                    if (formatting == null)
                        return undefined;
                    const { height, label, secondaryLabel } = formatting;
                    const { textAlign, verticalAlign, padding } = tile;
                    const textAlignFactor = (_b = textAlignFactors[textAlign]) !== null && _b !== void 0 ? _b : 0.5;
                    const labelX = bbox.x + padding + (bbox.width - 2 * padding) * textAlignFactor;
                    const verticalAlignFactor = (_c = verticalAlignFactors[verticalAlign]) !== null && _c !== void 0 ? _c : 0.5;
                    const labelYStart = bbox.y + padding + height * 0.5 + (bbox.height - 2 * padding - height) * verticalAlignFactor;
                    return {
                        label: label != null
                            ? {
                                text: label.text,
                                fontSize: label.fontSize,
                                style: this.tile.label,
                                x: labelX,
                                y: labelYStart - (height - label.height) * 0.5,
                            }
                            : undefined,
                        secondaryLabel: secondaryLabel != null
                            ? {
                                text: secondaryLabel.text,
                                fontSize: secondaryLabel.fontSize,
                                style: this.tile.secondaryLabel,
                                x: labelX,
                                y: labelYStart + (height - secondaryLabel.height) * 0.5,
                            }
                            : undefined,
                        verticalAlign: 'middle',
                        textAlign,
                    };
                }
                else if ((labelDatum === null || labelDatum === void 0 ? void 0 : labelDatum.label) != null) {
                    const { padding, textAlign } = group;
                    const groupTitleHeight = this.groupTitleHeight(node, bbox);
                    if (groupTitleHeight == null)
                        return undefined;
                    const innerWidth = bbox.width - 2 * padding;
                    const text = Text.wrap(labelDatum.label, bbox.width - 2 * padding, Infinity, group.label, 'never');
                    const textAlignFactor = (_d = textAlignFactors[textAlign]) !== null && _d !== void 0 ? _d : 0.5;
                    return {
                        label: {
                            text,
                            fontSize: group.label.fontSize,
                            style: this.group.label,
                            x: bbox.x + padding + innerWidth * textAlignFactor,
                            y: bbox.y + padding + groupTitleHeight * 0.5,
                        },
                        secondaryLabel: undefined,
                        verticalAlign: 'middle',
                        textAlign,
                    };
                }
                else {
                    return undefined;
                }
            });
            const updateLabelFn = (node, text, tag, highlighted) => {
                const isLeaf = node.children.length === 0;
                const meta = labelMeta[node.index];
                const label = tag === TextNodeTag.Primary ? meta === null || meta === void 0 ? void 0 : meta.label : meta === null || meta === void 0 ? void 0 : meta.secondaryLabel;
                if (meta == null || label == null) {
                    text.visible = false;
                    return;
                }
                let highlightedColor;
                if (highlighted) {
                    const { tile, group } = highlightStyle;
                    highlightedColor = !isLeaf
                        ? group.label.color
                        : tag === TextNodeTag.Primary
                            ? tile.label.color
                            : tile.secondaryLabel.color;
                }
                text.text = label.text;
                text.fontSize = label.fontSize;
                text.fontStyle = label.style.fontStyle;
                text.fontFamily = label.style.fontFamily;
                text.fontWeight = label.style.fontWeight;
                text.fill = highlightedColor !== null && highlightedColor !== void 0 ? highlightedColor : label.style.color;
                text.textAlign = meta.textAlign;
                text.textBaseline = meta.verticalAlign;
                text.x = label.x;
                text.y = label.y;
                text.visible = true;
            };
            this.groupSelection.selectByClass(Text).forEach((text) => {
                updateLabelFn(text.datum, text, text.tag, false);
            });
            this.highlightSelection.selectByClass(Text).forEach((text) => {
                var _a;
                const isDatumHighlighted = text.datum === highlightedNode;
                text.visible = isDatumHighlighted || ((_a = highlightedNode === null || highlightedNode === void 0 ? void 0 : highlightedNode.contains(text.datum)) !== null && _a !== void 0 ? _a : false);
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
        var _a;
        const { tooltip, colorKey, colorName = colorKey, labelKey, secondaryLabelKey, sizeKey, sizeName = sizeKey, id: seriesId, } = this;
        const { datum, depth } = node;
        const isLeaf = node.children.length === 0;
        const interactive = isLeaf || this.group.interactive;
        if (datum == null || depth == null || !interactive) {
            return '';
        }
        const title = labelKey != null ? datum[labelKey] : undefined;
        const format = this.getTileFormat(node, false);
        const color = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : this.getNodeFill(node);
        if (!tooltip.renderer && !tooltip.format && !title) {
            return '';
        }
        const contentArray = [];
        const datumSecondaryLabel = secondaryLabelKey != null ? datum[secondaryLabelKey] : undefined;
        if (datumSecondaryLabel != null && secondaryLabelKey !== colorKey && secondaryLabelKey !== sizeKey) {
            contentArray.push(sanitizeHtml$1(datumSecondaryLabel));
        }
        const datumSize = sizeKey != null ? datum[sizeKey] : undefined;
        if (datumSize != null) {
            contentArray.push(`${sizeName}: ${sanitizeHtml$1(datumSize)}`);
        }
        const datumColor = colorKey != null ? datum[colorKey] : undefined;
        if (datumColor != null) {
            contentArray.push(`${colorName}: ${sanitizeHtml$1(datumColor)}`);
        }
        const content = contentArray.join('<br>');
        const defaults = {
            title,
            color: isLeaf ? this.tile.label.color : this.group.label.color,
            backgroundColor: color,
            content,
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
        });
    }
}
TreemapSeries.className = 'TreemapSeries';
TreemapSeries.type = 'treemap';
__decorate([
    Validate$1(OPT_STRING$1),
    __metadata("design:type", String)
], TreemapSeries.prototype, "sizeName", void 0);
__decorate([
    Validate$1(OPT_STRING$1),
    __metadata("design:type", String)
], TreemapSeries.prototype, "labelKey", void 0);
__decorate([
    Validate$1(OPT_STRING$1),
    __metadata("design:type", String)
], TreemapSeries.prototype, "secondaryLabelKey", void 0);
__decorate([
    Validate$1(OPT_FUNCTION$1),
    __metadata("design:type", Function)
], TreemapSeries.prototype, "formatter", void 0);

const { DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, DEFAULT_FONT_FAMILY, DEFAULT_HIERARCHY_FILLS, DEFAULT_HIERARCHY_STROKES, DEFAULT_INSIDE_SERIES_LABEL_COLOUR, EXTENDS_SERIES_DEFAULTS, DEFAULT_LABEL_COLOUR, NORMAL, } = agChartsCommunity._Theme;
const TreemapSeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],
    identifier: 'treemap',
    instanceConstructor: TreemapSeries,
    seriesDefaults: {
        gradientLegend: {
            enabled: true,
        },
    },
    solo: true,
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS,
        group: {
            label: {
                enabled: true,
                color: DEFAULT_LABEL_COLOUR,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                spacing: 4,
            },
            fill: undefined,
            stroke: undefined,
            strokeWidth: 1,
            padding: 4,
            gap: 2,
            textAlign: 'left',
        },
        tile: {
            label: {
                enabled: true,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 18,
                minimumFontSize: 10,
                fontFamily: DEFAULT_FONT_FAMILY,
                wrapping: 'on-space',
                overflowStrategy: 'ellipsis',
                spacing: 2,
            },
            secondaryLabel: {
                enabled: true,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                minimumFontSize: 10,
                fontFamily: DEFAULT_FONT_FAMILY,
                wrapping: 'never',
                overflowStrategy: 'ellipsis',
            },
            fill: undefined,
            stroke: undefined,
            strokeWidth: 0,
            padding: 3,
            gap: 1,
        },
        // Override defaults
        highlightStyle: {
            group: {
                label: {
                    color: DEFAULT_LABEL_COLOUR,
                },
                fill: undefined,
                stroke: `rgba(0, 0, 0, 0.4)`,
                strokeWidth: 2,
            },
            tile: {
                label: {
                    color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                },
                secondaryLabel: {
                    color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                },
                fill: undefined,
                stroke: `rgba(0, 0, 0, 0.4)`,
                strokeWidth: 2,
            },
        },
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
            undocumentedGroupStrokes: groupStrokes,
        };
    },
};

const { CARTESIAN_AXIS_TYPES, CARTESIAN_AXIS_POSITIONS } = agChartsCommunity._Theme;
const WATERFALL_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
        },
        {
            type: CARTESIAN_AXIS_TYPES.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS.LEFT,
        },
    ],
    legend: {
        enabled: true,
        item: {
            toggleSeriesVisible: false,
        },
    },
};

const { adjustLabelPlacement, Validate, SeriesNodePickMode, fixNumericExtent, valueProperty, keyProperty, accumulativeValueProperty, trailingAccumulatedValueProperty, ChartAxisDirection, OPTIONAL, NUMBER, OPT_NUMBER, BOOLEAN, OPT_STRING, OPT_FUNCTION, OPT_COLOR_STRING, OPT_LINE_DASH, getRectConfig, updateRect, checkCrisp, updateLabelNode, prepareBarAnimationFunctions, collapsedStartingBarPosition, resetBarSelectionsFn, seriesLabelFadeInAnimation, resetLabelFn, animationValidation, } = agChartsCommunity._ModuleSupport;
const { ContinuousScale, Rect, motion } = agChartsCommunity._Scene;
const { sanitizeHtml, isContinuous, isNumber } = agChartsCommunity._Util;
const WATERFALL_LABEL_PLACEMENTS = ['start', 'end', 'inside'];
const OPT_WATERFALL_LABEL_PLACEMENT = (v, ctx) => OPTIONAL(v, ctx, (v) => WATERFALL_LABEL_PLACEMENTS.includes(v));
class WaterfallSeriesItemTooltip {
}
__decorate([
    Validate(OPT_FUNCTION),
    __metadata("design:type", Function)
], WaterfallSeriesItemTooltip.prototype, "renderer", void 0);
class WaterfallSeriesLabel extends agChartsCommunity._Scene.Label {
    constructor() {
        super(...arguments);
        this.placement = 'end';
        this.padding = 6;
    }
}
__decorate([
    Validate(OPT_WATERFALL_LABEL_PLACEMENT),
    __metadata("design:type", String)
], WaterfallSeriesLabel.prototype, "placement", void 0);
__decorate([
    Validate(OPT_NUMBER(0)),
    __metadata("design:type", Number)
], WaterfallSeriesLabel.prototype, "padding", void 0);
class WaterfallSeriesItem {
    constructor() {
        this.label = new WaterfallSeriesLabel();
        this.tooltip = new WaterfallSeriesItemTooltip();
        this.shadow = undefined;
        this.name = undefined;
        this.fill = '#c16068';
        this.stroke = '#c16068';
        this.fillOpacity = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.strokeWidth = 1;
    }
}
__decorate([
    Validate(OPT_FUNCTION),
    __metadata("design:type", Function)
], WaterfallSeriesItem.prototype, "formatter", void 0);
__decorate([
    Validate(OPT_STRING),
    __metadata("design:type", String)
], WaterfallSeriesItem.prototype, "name", void 0);
__decorate([
    Validate(OPT_COLOR_STRING),
    __metadata("design:type", String)
], WaterfallSeriesItem.prototype, "fill", void 0);
__decorate([
    Validate(OPT_COLOR_STRING),
    __metadata("design:type", String)
], WaterfallSeriesItem.prototype, "stroke", void 0);
__decorate([
    Validate(NUMBER(0, 1)),
    __metadata("design:type", Object)
], WaterfallSeriesItem.prototype, "fillOpacity", void 0);
__decorate([
    Validate(NUMBER(0, 1)),
    __metadata("design:type", Object)
], WaterfallSeriesItem.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(OPT_LINE_DASH),
    __metadata("design:type", Array)
], WaterfallSeriesItem.prototype, "lineDash", void 0);
__decorate([
    Validate(NUMBER(0)),
    __metadata("design:type", Number)
], WaterfallSeriesItem.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(NUMBER(0)),
    __metadata("design:type", Number)
], WaterfallSeriesItem.prototype, "strokeWidth", void 0);
class WaterfallSeriesConnectorLine {
    constructor() {
        this.enabled = true;
        this.stroke = 'black';
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.strokeWidth = 2;
    }
}
__decorate([
    Validate(BOOLEAN),
    __metadata("design:type", Object)
], WaterfallSeriesConnectorLine.prototype, "enabled", void 0);
__decorate([
    Validate(OPT_COLOR_STRING),
    __metadata("design:type", String)
], WaterfallSeriesConnectorLine.prototype, "stroke", void 0);
__decorate([
    Validate(NUMBER(0, 1)),
    __metadata("design:type", Object)
], WaterfallSeriesConnectorLine.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(OPT_LINE_DASH),
    __metadata("design:type", Array)
], WaterfallSeriesConnectorLine.prototype, "lineDash", void 0);
__decorate([
    Validate(NUMBER(0)),
    __metadata("design:type", Number)
], WaterfallSeriesConnectorLine.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(NUMBER(0)),
    __metadata("design:type", Number)
], WaterfallSeriesConnectorLine.prototype, "strokeWidth", void 0);
class WaterfallSeriesItems {
    constructor() {
        this.positive = new WaterfallSeriesItem();
        this.negative = new WaterfallSeriesItem();
        this.total = new WaterfallSeriesItem();
    }
}
class WaterfallSeries extends agChartsCommunity._ModuleSupport.AbstractBarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 1,
            hasHighlightedLabels: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
        this.item = new WaterfallSeriesItems();
        this.line = new WaterfallSeriesConnectorLine();
        this.totals = [];
        this.tooltip = new agChartsCommunity._ModuleSupport.SeriesTooltip();
        this.xKey = undefined;
        this.xName = undefined;
        this.yKey = undefined;
        this.yName = undefined;
        this.seriesItemTypes = new Set(['positive', 'negative', 'total']);
    }
    resolveKeyDirection(direction) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }
    processData(dataController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { xKey = '', yKey } = this;
            const { data = [] } = this;
            if (!yKey)
                return;
            const positiveNumber = (v) => {
                return isContinuous(v) && v >= 0;
            };
            const negativeNumber = (v) => {
                return isContinuous(v) && v < 0;
            };
            const totalTypeValue = (v) => {
                return v === 'total' || v === 'subtotal';
            };
            const propertyDefinition = {
                missingValue: undefined,
                invalidValue: undefined,
            };
            const dataWithTotals = [];
            const totalsMap = this.totals.reduce((totalsMap, total) => {
                const totalsAtIndex = totalsMap.get(total.index);
                if (totalsAtIndex) {
                    totalsAtIndex.push(total);
                }
                else {
                    totalsMap.set(total.index, [total]);
                }
                return totalsMap;
            }, new Map());
            data.forEach((datum, i) => {
                dataWithTotals.push(datum);
                const totalsAtIndex = totalsMap.get(i);
                if (totalsAtIndex) {
                    // Use the `toString` method to make the axis labels unique as they're used as categories in the axis scale domain.
                    // Add random id property as there is caching for the axis label formatter result. If the label object is not unique, the axis label formatter will not be invoked.
                    totalsAtIndex.forEach((total) => dataWithTotals.push(Object.assign(Object.assign({}, total), { [xKey]: total.axisLabel })));
                }
            });
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const isContinuousX = ContinuousScale.is((_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale);
            const extraProps = [];
            if (animationEnabled) {
                extraProps.push(animationValidation(this));
            }
            yield this.requestDataModel(dataController, dataWithTotals, {
                props: [
                    keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                    accumulativeValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { id: `yCurrent` })),
                    accumulativeValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { missingValue: 0, id: `yCurrentTotal` })),
                    accumulativeValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { id: `yCurrentPositive`, validation: positiveNumber })),
                    accumulativeValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { id: `yCurrentNegative`, validation: negativeNumber })),
                    trailingAccumulatedValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { id: `yPrevious` })),
                    valueProperty(this, yKey, true, { id: `yRaw` }),
                    valueProperty(this, 'totalType', false, {
                        id: `totalTypeValue`,
                        missingValue: undefined,
                        validation: totalTypeValue,
                    }),
                    ...extraProps,
                ],
                dataVisible: this.visible,
            });
            this.updateSeriesItemTypes();
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel))
            return [];
        const { domain: { keys: [keys], values, }, } = processedData;
        if (direction === this.getCategoryDirection()) {
            return keys;
        }
        else {
            const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrent').index;
            const yExtent = values[yCurrIndex];
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent(fixedYExtent);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { data, dataModel, visible, line } = this;
            const xAxis = this.getCategoryAxis();
            const yAxis = this.getValueAxis();
            if (!(data && visible && xAxis && yAxis && dataModel)) {
                return [];
            }
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
            const barWidth = xScale.bandwidth || 10;
            const halfLineWidth = line.strokeWidth / 2;
            const offsetDirection = barAlongX ? -1 : 1;
            const offset = offsetDirection * halfLineWidth;
            const { yKey = '', xKey = '', processedData } = this;
            if ((processedData === null || processedData === void 0 ? void 0 : processedData.type) !== 'ungrouped')
                return [];
            const contexts = [];
            const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yRaw`).index;
            const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`).index;
            const contextIndexMap = new Map();
            const pointData = [];
            const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrent').index;
            const yPrevIndex = dataModel.resolveProcessedDataIndexById(this, 'yPrevious').index;
            const yCurrTotalIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentTotal').index;
            function getValues(isTotal, isSubtotal, values) {
                if (isTotal || isSubtotal) {
                    return {
                        cumulativeValue: values[yCurrTotalIndex],
                        trailingValue: isSubtotal ? trailingSubtotal : 0,
                    };
                }
                return {
                    cumulativeValue: values[yCurrIndex],
                    trailingValue: values[yPrevIndex],
                };
            }
            function getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue) {
                if (isTotal) {
                    return cumulativeValue;
                }
                if (isSubtotal) {
                    return (cumulativeValue !== null && cumulativeValue !== void 0 ? cumulativeValue : 0) - (trailingValue !== null && trailingValue !== void 0 ? trailingValue : 0);
                }
                return rawValue;
            }
            let trailingSubtotal = 0;
            processedData === null || processedData === void 0 ? void 0 : processedData.data.forEach(({ keys, datum, values }, dataIndex) => {
                var _a;
                const datumType = values[totalTypeIndex];
                const isSubtotal = this.isSubtotal(datumType);
                const isTotal = this.isTotal(datumType);
                const isTotalOrSubtotal = isTotal || isSubtotal;
                const xDatum = keys[xIndex];
                const x = Math.round(xScale.convert(xDatum));
                const rawValue = values[yRawIndex];
                const { cumulativeValue, trailingValue } = getValues(isTotal, isSubtotal, values);
                if (isTotalOrSubtotal) {
                    trailingSubtotal = cumulativeValue !== null && cumulativeValue !== void 0 ? cumulativeValue : 0;
                }
                const currY = Math.round(yScale.convert(cumulativeValue));
                const trailY = Math.round(yScale.convert(trailingValue));
                const value = getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue);
                const isPositive = (value !== null && value !== void 0 ? value : 0) >= 0;
                const seriesItemType = this.getSeriesItemType(isPositive, datumType);
                const { fill, stroke, strokeWidth, label } = this.getItemConfig(seriesItemType);
                const y = (isPositive ? currY : trailY) - offset;
                const bottomY = (isPositive ? trailY : currY) + offset;
                const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));
                const itemId = seriesItemType;
                let contextIndex = contextIndexMap.get(itemId);
                if (contextIndex === undefined) {
                    contextIndex = contexts.length;
                    contextIndexMap.set(itemId, contextIndex);
                }
                (_a = contexts[contextIndex]) !== null && _a !== void 0 ? _a : (contexts[contextIndex] = {
                    itemId,
                    nodeData: [],
                    labelData: [],
                    pointData: [],
                    scales: _super.calculateScaling.call(this),
                    visible: this.visible,
                });
                const rect = {
                    x: barAlongX ? bottomY : x,
                    y: barAlongX ? x : y,
                    width: barAlongX ? barHeight : barWidth,
                    height: barAlongX ? barWidth : barHeight,
                };
                const nodeMidPoint = {
                    x: rect.x + rect.width / 2,
                    y: rect.y + rect.height / 2,
                };
                const pointY = isTotalOrSubtotal ? currY : trailY;
                const pixelAlignmentOffset = (Math.floor(line.strokeWidth) % 2) / 2;
                const pathPoint = {
                    // lineTo
                    x: barAlongX ? pointY + pixelAlignmentOffset : rect.x,
                    y: barAlongX ? rect.y : pointY + pixelAlignmentOffset,
                    // moveTo
                    x2: barAlongX ? currY + pixelAlignmentOffset : rect.x + rect.width,
                    y2: barAlongX ? rect.y + rect.height : currY + pixelAlignmentOffset,
                    size: 0,
                };
                pointData.push(pathPoint);
                const labelText = this.getLabelText(label, {
                    itemId: itemId === 'subtotal' ? 'total' : itemId,
                    value,
                    datum,
                    xKey,
                    yKey,
                    xName: this.xName,
                    yName: this.yName,
                }, (value) => (isNumber(value) ? value.toFixed(2) : String(value)));
                const nodeDatum = {
                    index: dataIndex,
                    series: this,
                    itemId,
                    datum,
                    cumulativeValue: cumulativeValue !== null && cumulativeValue !== void 0 ? cumulativeValue : 0,
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
                    label: Object.assign({ text: labelText }, adjustLabelPlacement({
                        isPositive: (value !== null && value !== void 0 ? value : -1) >= 0,
                        isVertical: !barAlongX,
                        placement: label.placement,
                        padding: label.padding,
                        rect,
                    })),
                };
                contexts[contextIndex].nodeData.push(nodeDatum);
                contexts[contextIndex].labelData.push(nodeDatum);
            });
            const connectorLinesEnabled = this.line.enabled;
            if (contexts.length > 0 && yCurrIndex !== undefined && connectorLinesEnabled) {
                contexts[0].pointData = pointData;
            }
            return contexts;
        });
    }
    updateSeriesItemTypes() {
        var _a, _b;
        const { dataModel, seriesItemTypes, processedData } = this;
        if (!dataModel || !processedData) {
            return;
        }
        seriesItemTypes.clear();
        const yPositiveIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentPositive').index;
        const yNegativeIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentNegative').index;
        const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`).index;
        const positiveDomain = (_a = processedData.domain.values[yPositiveIndex]) !== null && _a !== void 0 ? _a : [];
        const negativeDomain = (_b = processedData.domain.values[yNegativeIndex]) !== null && _b !== void 0 ? _b : [];
        if (positiveDomain.length > 0) {
            seriesItemTypes.add('positive');
        }
        if (negativeDomain.length > 0) {
            seriesItemTypes.add('negative');
        }
        const itemTypes = processedData === null || processedData === void 0 ? void 0 : processedData.domain.values[totalTypeIndex];
        if (!itemTypes) {
            return;
        }
        itemTypes.forEach((type) => {
            if (type === 'total' || type === 'subtotal') {
                seriesItemTypes.add('total');
            }
        });
    }
    isSubtotal(datumType) {
        return datumType === 'subtotal';
    }
    isTotal(datumType) {
        return datumType === 'total';
    }
    nodeFactory() {
        return new Rect();
    }
    getSeriesItemType(isPositive, datumType) {
        return datumType !== null && datumType !== void 0 ? datumType : (isPositive ? 'positive' : 'negative');
    }
    getItemConfig(seriesItemType) {
        switch (seriesItemType) {
            case 'positive': {
                return this.item.positive;
            }
            case 'negative': {
                return this.item.negative;
            }
            case 'subtotal':
            case 'total': {
                return this.item.total;
            }
        }
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nodeData, datumSelection } = opts;
            const data = nodeData !== null && nodeData !== void 0 ? nodeData : [];
            return datumSelection.update(data);
        });
    }
    updateDatumNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { datumSelection, isHighlight } = opts;
            const { yKey = '', highlightStyle: { item: itemHighlightStyle }, id: seriesId, ctx, } = this;
            const xAxis = this.getCategoryAxis();
            const crisp = checkCrisp(xAxis === null || xAxis === void 0 ? void 0 : xAxis.visibleRange);
            const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;
            datumSelection.each((rect, datum) => {
                const seriesItemType = datum.itemId;
                const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, formatter, shadow: fillShadow, } = this.getItemConfig(seriesItemType);
                const style = {
                    fill: datum.fill,
                    stroke: datum.stroke,
                    fillOpacity,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                    fillShadow,
                    strokeWidth: this.getStrokeWidth(strokeWidth),
                };
                const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
                const config = getRectConfig({
                    datum,
                    isHighlighted: isHighlight,
                    style,
                    highlightStyle: itemHighlightStyle,
                    formatter,
                    seriesId,
                    itemId: datum.itemId,
                    ctx,
                    value: datum.yValue,
                    yKey,
                });
                config.crisp = crisp;
                config.visible = visible;
                updateRect({ rect, config });
            });
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
            opts.labelSelection.each((textNode, datum) => {
                updateLabelNode(textNode, this.getItemConfig(datum.itemId).label, datum.label);
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        var _a, _b, _c;
        const { xKey, yKey } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }
        const { xName, yName, id: seriesId } = this;
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
                itemId: nodeDatum.itemId,
            });
        }
        const color = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill) !== null && _b !== void 0 ? _b : 'gray';
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));
        const isTotal = this.isTotal(itemId);
        const isSubtotal = this.isSubtotal(itemId);
        const ySubheading = isTotal ? 'Total' : isSubtotal ? 'Subtotal' : (_c = name !== null && name !== void 0 ? name : yName) !== null && _c !== void 0 ? _c : yKey;
        const title = sanitizeHtml(yName);
        const content = `<b>${sanitizeHtml(xName !== null && xName !== void 0 ? xName : xKey)}</b>: ${xString}<br/>` +
            `<b>${sanitizeHtml(ySubheading)}</b>: ${yString}`;
        return this.tooltip.toTooltipHtml({ title, content, backgroundColor: color }, { seriesId, itemId, datum, xKey, yKey, xName, yName, color });
    }
    getLegendData(legendType) {
        if (legendType !== 'category') {
            return [];
        }
        const { id, seriesItemTypes } = this;
        const legendData = [];
        const capitalise = (text) => text.charAt(0).toUpperCase() + text.substring(1);
        seriesItemTypes.forEach((item) => {
            const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, name } = this.getItemConfig(item);
            legendData.push({
                legendType: 'category',
                id,
                itemId: item,
                seriesId: id,
                enabled: true,
                label: { text: name !== null && name !== void 0 ? name : capitalise(item) },
                marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth },
            });
        });
        return legendData;
    }
    toggleSeriesItem() { }
    animateEmptyUpdateReady({ datumSelections, labelSelections, contextData, paths }) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.direction === 'vertical', this.axes));
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        contextData.forEach(({ pointData }, contextDataIndex) => {
            if (contextDataIndex !== 0 || !pointData) {
                return;
            }
            const [lineNode] = paths[contextDataIndex];
            if (this.direction === 'vertical') {
                this.animateConnectorLinesVertical(lineNode, pointData);
            }
            else {
                this.animateConnectorLinesHorizontal(lineNode, pointData);
            }
        });
    }
    animateConnectorLinesHorizontal(lineNode, pointData) {
        const { path: linePath } = lineNode;
        this.updateLineNode(lineNode);
        const valueAxis = this.getValueAxis();
        const startX = valueAxis === null || valueAxis === void 0 ? void 0 : valueAxis.scale.convert(0);
        const endX = pointData.reduce((end, point) => {
            if (point.x > end) {
                end = point.x;
            }
            return end;
        }, 0);
        const scale = (value, start1, end1, start2, end2) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };
        this.ctx.animationManager.animate({
            id: `${this.id}_datums`,
            groupId: this.id,
            from: startX,
            to: endX,
            ease: agChartsCommunity._ModuleSupport.Motion.easeOut,
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
            },
        });
    }
    animateConnectorLinesVertical(lineNode, pointData) {
        const { path: linePath } = lineNode;
        this.updateLineNode(lineNode);
        const valueAxis = this.getValueAxis();
        const startY = valueAxis === null || valueAxis === void 0 ? void 0 : valueAxis.scale.convert(0);
        const endY = pointData.reduce((end, point) => {
            if (point.y < end) {
                end = point.y;
            }
            return end;
        }, Infinity);
        const scale = (value, start1, end1, start2, end2) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };
        this.ctx.animationManager.animate({
            id: `${this.id}_datums`,
            groupId: this.id,
            from: startY,
            to: endY,
            ease: agChartsCommunity._ModuleSupport.Motion.easeOut,
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
            },
        });
    }
    animateReadyResize(data) {
        super.animateReadyResize(data);
        this.resetConnectorLinesPath(data);
    }
    resetConnectorLinesPath({ contextData, paths, }) {
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
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.line;
        lineNode.setProperties({
            fill: undefined,
            stroke,
            strokeWidth: this.getStrokeWidth(strokeWidth),
            strokeOpacity,
            lineDash,
            lineDashOffset,
            lineJoin: 'round',
            pointerEvents: agChartsCommunity._Scene.PointerEvents.None,
        });
    }
    isLabelEnabled() {
        return this.item.positive.label.enabled || this.item.negative.label.enabled || this.item.total.label.enabled;
    }
    onDataChange() { }
}
WaterfallSeries.className = 'WaterfallSeries';
WaterfallSeries.type = 'waterfall';
__decorate([
    Validate(OPT_STRING),
    __metadata("design:type", String)
], WaterfallSeries.prototype, "xKey", void 0);
__decorate([
    Validate(OPT_STRING),
    __metadata("design:type", String)
], WaterfallSeries.prototype, "xName", void 0);
__decorate([
    Validate(OPT_STRING),
    __metadata("design:type", String)
], WaterfallSeries.prototype, "yKey", void 0);
__decorate([
    Validate(OPT_STRING),
    __metadata("design:type", String)
], WaterfallSeries.prototype, "yName", void 0);

const WATERFALL_SERIES_THEME = {
    __extends__: agChartsCommunity._Theme.EXTENDS_SERIES_DEFAULTS,
    item: {
        positive: {
            strokeWidth: 0,
            label: {
                enabled: false,
            },
        },
        negative: {
            strokeWidth: 0,
            label: {
                enabled: false,
            },
        },
        total: {
            strokeWidth: 0,
            label: {
                enabled: false,
            },
        },
    },
    line: {
        stroke: agChartsCommunity._Theme.DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
        strokeWidth: 2,
    },
};

const WaterfallModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'waterfall',
    instanceConstructor: WaterfallSeries,
    seriesDefaults: WATERFALL_DEFAULTS,
    themeTemplate: WATERFALL_SERIES_THEME,
    swapDefaultAxesCondition: ({ direction }) => direction === 'horizontal',
    paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const { fills, strokes } = takeColors(colorsCount);
        return userPalette
            ? {
                item: {
                    positive: {
                        fill: fills[0],
                        stroke: strokes[0],
                    },
                    negative: {
                        fill: fills[1],
                        stroke: strokes[1],
                    },
                    total: {
                        fill: fills[2],
                        stroke: strokes[2],
                    },
                },
            }
            : {
                item: {
                    positive: properties.get(agChartsCommunity._Theme.DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS),
                    negative: properties.get(agChartsCommunity._Theme.DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS),
                    total: properties.get(agChartsCommunity._Theme.DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS),
                },
            };
    },
};

agChartsCommunity._ModuleSupport.registerModule(AngleCategoryAxisModule);
agChartsCommunity._ModuleSupport.registerModule(AngleNumberAxisModule);
agChartsCommunity._ModuleSupport.registerModule(AnimationModule);
agChartsCommunity._ModuleSupport.registerModule(BackgroundModule);
agChartsCommunity._ModuleSupport.registerModule(BoxPlotModule);
agChartsCommunity._ModuleSupport.registerModule(BulletModule);
agChartsCommunity._ModuleSupport.registerModule(ContextMenuModule);
agChartsCommunity._ModuleSupport.registerModule(CrosshairModule);
agChartsCommunity._ModuleSupport.registerModule(ErrorBarsModule);
agChartsCommunity._ModuleSupport.registerModule(GradientLegendModule);
agChartsCommunity._ModuleSupport.registerModule(HeatmapModule);
agChartsCommunity._ModuleSupport.registerModule(NightingaleModule);
agChartsCommunity._ModuleSupport.registerModule(RadarAreaModule);
agChartsCommunity._ModuleSupport.registerModule(RadarLineModule);
agChartsCommunity._ModuleSupport.registerModule(RadialBarModule);
agChartsCommunity._ModuleSupport.registerModule(RadialColumnModule);
agChartsCommunity._ModuleSupport.registerModule(RadiusCategoryAxisModule);
agChartsCommunity._ModuleSupport.registerModule(RadiusNumberAxisModule);
agChartsCommunity._ModuleSupport.registerModule(RangeBarModule);
agChartsCommunity._ModuleSupport.registerModule(RangeAreaModule);
agChartsCommunity._ModuleSupport.registerModule(SunburstSeriesModule);
agChartsCommunity._ModuleSupport.registerModule(TreemapSeriesModule);
agChartsCommunity._ModuleSupport.registerModule(WaterfallModule);
agChartsCommunity._ModuleSupport.registerModule(ZoomModule);
agChartsCommunity._ModuleSupport.enterpriseModule.isEnterprise = true;
agChartsCommunity._ModuleSupport.enterpriseModule.licenseManager = (options) => { var _a, _b; return new LicenseManager((_b = (_a = options.container) === null || _a === void 0 ? void 0 : _a.ownerDocument) !== null && _b !== void 0 ? _b : (typeof document !== 'undefined' ? document : undefined)); };
agChartsCommunity._ModuleSupport.enterpriseModule.injectWatermark = injectWatermark;

Object.defineProperty(exports, 'AgCharts', {
    enumerable: true,
    get: function () { return agChartsCommunity.AgCharts; }
});
Object.defineProperty(exports, 'time', {
    enumerable: true,
    get: function () { return agChartsCommunity.time; }
});
Object.keys(agChartsCommunity).forEach(function (k) {
    if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
        enumerable: true,
        get: function () { return agChartsCommunity[k]; }
    });
});
