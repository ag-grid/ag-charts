var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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

// packages/ag-charts-core/src/types/axisDirection.ts
var ChartAxisDirection = /* @__PURE__ */ /*#__PURE__*/ ((ChartAxisDirection2) => {
  ChartAxisDirection2["X"] = "x";
  ChartAxisDirection2["Y"] = "y";
  ChartAxisDirection2["Angle"] = "angle";
  ChartAxisDirection2["Radius"] = "radius";
  return ChartAxisDirection2;
})(ChartAxisDirection || {});

// packages/ag-charts-core/src/types/scales.ts
var ScaleAlignment = /* @__PURE__ */ /*#__PURE__*/ ((ScaleAlignment2) => {
  ScaleAlignment2[ScaleAlignment2["Leading"] = 0] = "Leading";
  ScaleAlignment2[ScaleAlignment2["Trailing"] = 1] = "Trailing";
  ScaleAlignment2[ScaleAlignment2["Interpolate"] = 2] = "Interpolate";
  return ScaleAlignment2;
})(ScaleAlignment || {});

// packages/ag-charts-core/src/types/text.ts
var EllipsisChar = "\u2026";
var LineSplitter = /\r?\n/g;
var TrimEdgeGuard = "\u200B";
var TrimCharsRegex = /[\s.,;:-]{1,5}$/;
var LtrEmbedding = "\u202A";
var PopDirectionalFormatting = "\u202C";

// packages/ag-charts-core/src/types/themeConstants.ts
var FONT_SIZE = /* @__PURE__ */ /*#__PURE__*/ ((FONT_SIZE2) => {
  FONT_SIZE2[FONT_SIZE2["SMALLEST"] = 8] = "SMALLEST";
  FONT_SIZE2[FONT_SIZE2["SMALLER"] = 10] = "SMALLER";
  FONT_SIZE2[FONT_SIZE2["SMALL"] = 12] = "SMALL";
  FONT_SIZE2[FONT_SIZE2["MEDIUM"] = 13] = "MEDIUM";
  FONT_SIZE2[FONT_SIZE2["LARGE"] = 14] = "LARGE";
  FONT_SIZE2[FONT_SIZE2["LARGEST"] = 17] = "LARGEST";
  return FONT_SIZE2;
})(FONT_SIZE || {});
var BASE_FONT_SIZE = 12 /* SMALL */;
var FONT_SIZE_RATIO = {
  SMALLEST: 8 /* SMALLEST */ / BASE_FONT_SIZE,
  SMALLER: 10 /* SMALLER */ / BASE_FONT_SIZE,
  SMALL: 12 /* SMALL */ / BASE_FONT_SIZE,
  MEDIUM: 13 /* MEDIUM */ / BASE_FONT_SIZE,
  LARGE: 14 /* LARGE */ / BASE_FONT_SIZE,
  LARGEST: 17 /* LARGEST */ / BASE_FONT_SIZE
};
var CARTESIAN_POSITION = /* @__PURE__ */ /*#__PURE__*/ ((CARTESIAN_POSITION2) => {
  CARTESIAN_POSITION2["TOP"] = "top";
  CARTESIAN_POSITION2["TOP_RIGHT"] = "top-right";
  CARTESIAN_POSITION2["TOP_LEFT"] = "top-left";
  CARTESIAN_POSITION2["RIGHT"] = "right";
  CARTESIAN_POSITION2["RIGHT_TOP"] = "right-top";
  CARTESIAN_POSITION2["RIGHT_BOTTOM"] = "right-bottom";
  CARTESIAN_POSITION2["BOTTOM"] = "bottom";
  CARTESIAN_POSITION2["BOTTOM_RIGHT"] = "bottom-right";
  CARTESIAN_POSITION2["BOTTOM_LEFT"] = "bottom-left";
  CARTESIAN_POSITION2["LEFT"] = "left";
  CARTESIAN_POSITION2["LEFT_TOP"] = "left-top";
  CARTESIAN_POSITION2["LEFT_BOTTOM"] = "left-bottom";
  return CARTESIAN_POSITION2;
})(CARTESIAN_POSITION || {});
var CARTESIAN_AXIS_TYPE = /* @__PURE__ */ /*#__PURE__*/ ((CARTESIAN_AXIS_TYPE2) => {
  CARTESIAN_AXIS_TYPE2["CATEGORY"] = "category";
  CARTESIAN_AXIS_TYPE2["GROUPED_CATEGORY"] = "grouped-category";
  CARTESIAN_AXIS_TYPE2["ORDINAL_TIME"] = "ordinal-time";
  CARTESIAN_AXIS_TYPE2["UNIT_TIME"] = "unit-time";
  CARTESIAN_AXIS_TYPE2["TIME"] = "time";
  CARTESIAN_AXIS_TYPE2["NUMBER"] = "number";
  CARTESIAN_AXIS_TYPE2["LOG"] = "log";
  return CARTESIAN_AXIS_TYPE2;
})(CARTESIAN_AXIS_TYPE || {});
var POLAR_AXIS_TYPE = /* @__PURE__ */ /*#__PURE__*/ ((POLAR_AXIS_TYPE2) => {
  POLAR_AXIS_TYPE2["ANGLE_CATEGORY"] = "angle-category";
  POLAR_AXIS_TYPE2["ANGLE_NUMBER"] = "angle-number";
  POLAR_AXIS_TYPE2["RADIUS_CATEGORY"] = "radius-category";
  POLAR_AXIS_TYPE2["RADIUS_NUMBER"] = "radius-number";
  return POLAR_AXIS_TYPE2;
})(POLAR_AXIS_TYPE || {});
var POLAR_AXIS_SHAPE = /* @__PURE__ */ /*#__PURE__*/ ((POLAR_AXIS_SHAPE2) => {
  POLAR_AXIS_SHAPE2["CIRCLE"] = "circle";
  POLAR_AXIS_SHAPE2["POLYGON"] = "polygon";
  return POLAR_AXIS_SHAPE2;
})(POLAR_AXIS_SHAPE || {});

// packages/ag-charts-core/src/types/updateType.ts
var ChartUpdateType = /* @__PURE__ */ /*#__PURE__*/ ((ChartUpdateType2) => {
  ChartUpdateType2[ChartUpdateType2["FULL"] = 0] = "FULL";
  ChartUpdateType2[ChartUpdateType2["UPDATE_DATA"] = 1] = "UPDATE_DATA";
  ChartUpdateType2[ChartUpdateType2["PROCESS_DATA"] = 2] = "PROCESS_DATA";
  ChartUpdateType2[ChartUpdateType2["PROCESS_DOMAIN"] = 3] = "PROCESS_DOMAIN";
  ChartUpdateType2[ChartUpdateType2["PROCESS_RANGE"] = 4] = "PROCESS_RANGE";
  ChartUpdateType2[ChartUpdateType2["PERFORM_LAYOUT"] = 5] = "PERFORM_LAYOUT";
  ChartUpdateType2[ChartUpdateType2["PRE_SERIES_UPDATE"] = 6] = "PRE_SERIES_UPDATE";
  ChartUpdateType2[ChartUpdateType2["SERIES_UPDATE"] = 7] = "SERIES_UPDATE";
  ChartUpdateType2[ChartUpdateType2["PRE_SCENE_RENDER"] = 8] = "PRE_SCENE_RENDER";
  ChartUpdateType2[ChartUpdateType2["SCENE_RENDER"] = 9] = "SCENE_RENDER";
  ChartUpdateType2[ChartUpdateType2["NONE"] = 10] = "NONE";
  return ChartUpdateType2;
})(ChartUpdateType || {});

// packages/ag-charts-core/src/types/zIndexMap.ts
var ZIndexMap = /* @__PURE__ */ /*#__PURE__*/ ((ZIndexMap2) => {
  ZIndexMap2[ZIndexMap2["CHART_BACKGROUND"] = 0] = "CHART_BACKGROUND";
  ZIndexMap2[ZIndexMap2["SERIES_AREA_UNDERLAY"] = 1] = "SERIES_AREA_UNDERLAY";
  ZIndexMap2[ZIndexMap2["AXIS_BAND_HIGHLIGHT"] = 2] = "AXIS_BAND_HIGHLIGHT";
  ZIndexMap2[ZIndexMap2["AXIS_GRID"] = 3] = "AXIS_GRID";
  ZIndexMap2[ZIndexMap2["AXIS"] = 4] = "AXIS";
  ZIndexMap2[ZIndexMap2["SERIES_AREA_CONTAINER"] = 5] = "SERIES_AREA_CONTAINER";
  ZIndexMap2[ZIndexMap2["ZOOM_SELECTION"] = 6] = "ZOOM_SELECTION";
  ZIndexMap2[ZIndexMap2["SERIES_CROSSLINE_RANGE"] = 7] = "SERIES_CROSSLINE_RANGE";
  ZIndexMap2[ZIndexMap2["SERIES_LAYER"] = 8] = "SERIES_LAYER";
  ZIndexMap2[ZIndexMap2["AXIS_FOREGROUND"] = 9] = "AXIS_FOREGROUND";
  ZIndexMap2[ZIndexMap2["SERIES_CROSSHAIR"] = 10] = "SERIES_CROSSHAIR";
  ZIndexMap2[ZIndexMap2["SERIES_CROSSLINE_LINE"] = 11] = "SERIES_CROSSLINE_LINE";
  ZIndexMap2[ZIndexMap2["SERIES_ANNOTATION"] = 12] = "SERIES_ANNOTATION";
  ZIndexMap2[ZIndexMap2["CHART_ANNOTATION"] = 13] = "CHART_ANNOTATION";
  ZIndexMap2[ZIndexMap2["CHART_ANNOTATION_FOCUSED"] = 14] = "CHART_ANNOTATION_FOCUSED";
  ZIndexMap2[ZIndexMap2["STATUS_BAR"] = 15] = "STATUS_BAR";
  ZIndexMap2[ZIndexMap2["SERIES_LABEL"] = 16] = "SERIES_LABEL";
  ZIndexMap2[ZIndexMap2["LEGEND"] = 17] = "LEGEND";
  ZIndexMap2[ZIndexMap2["NAVIGATOR"] = 18] = "NAVIGATOR";
  ZIndexMap2[ZIndexMap2["FOREGROUND"] = 19] = "FOREGROUND";
  return ZIndexMap2;
})(ZIndexMap || {});
var SeriesZIndexMap = /* @__PURE__ */ /*#__PURE__*/ ((SeriesZIndexMap2) => {
  SeriesZIndexMap2[SeriesZIndexMap2["BACKGROUND"] = 0] = "BACKGROUND";
  SeriesZIndexMap2[SeriesZIndexMap2["ANY_CONTENT"] = 1] = "ANY_CONTENT";
  return SeriesZIndexMap2;
})(SeriesZIndexMap || {});
var SeriesContentZIndexMap = /* @__PURE__ */ /*#__PURE__*/ ((SeriesContentZIndexMap2) => {
  SeriesContentZIndexMap2[SeriesContentZIndexMap2["FOREGROUND"] = 0] = "FOREGROUND";
  SeriesContentZIndexMap2[SeriesContentZIndexMap2["HIGHLIGHT"] = 1] = "HIGHLIGHT";
  SeriesContentZIndexMap2[SeriesContentZIndexMap2["LABEL"] = 2] = "LABEL";
  return SeriesContentZIndexMap2;
})(SeriesContentZIndexMap || {});
var PolarZIndexMap = /* @__PURE__ */ /*#__PURE__*/ ((PolarZIndexMap2) => {
  PolarZIndexMap2[PolarZIndexMap2["BACKGROUND"] = 0] = "BACKGROUND";
  PolarZIndexMap2[PolarZIndexMap2["FOREGROUND"] = 1] = "FOREGROUND";
  PolarZIndexMap2[PolarZIndexMap2["HIGHLIGHT"] = 2] = "HIGHLIGHT";
  PolarZIndexMap2[PolarZIndexMap2["LABEL"] = 3] = "LABEL";
  return PolarZIndexMap2;
})(PolarZIndexMap || {});

// packages/ag-charts-core/src/logging/debugLogger.ts
var debugLogger_exports = {};
__export(debugLogger_exports, {
  Time: () => Time,
  check: () => check,
  create: () => create,
  inDevelopmentMode: () => inDevelopmentMode
});

// packages/ag-charts-core/src/data/arrays.ts
function toArray(value) {
  if (value === void 0) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
function firstCandidate(value) {
  return Array.isArray(value) ? value[0] : value;
}
function unique(array2) {
  return Array.from(new Set(array2));
}
function groupBy(array2, iteratee) {
  return array2.reduce((result, item) => {
    const groupKey = iteratee(item);
    result[groupKey] ?? (result[groupKey] = []);
    result[groupKey].push(item);
    return result;
  }, {});
}
function arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (Array.isArray(a[i]) && Array.isArray(b[i])) {
      if (!arraysEqual(a[i], b[i])) {
        return false;
      }
    } else if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
function circularSliceArray(data, size, offset = 0) {
  if (data.length === 0) {
    return [];
  }
  const result = [];
  for (let i = 0; i < size; i++) {
    result.push(data.at((i + offset) % data.length));
  }
  return result;
}
function sortBasedOnArray(baseArray, orderArray) {
  const orderMap = /* @__PURE__ */ new Map();
  for (const [index, item] of orderArray.entries()) {
    orderMap.set(item, index);
  }
  return baseArray.sort((a, b) => {
    const indexA = orderMap.get(a) ?? Infinity;
    const indexB = orderMap.get(b) ?? Infinity;
    return indexA - indexB;
  });
}
function dropFirstWhile(array2, cond) {
  let i = 0;
  while (i < array2.length && cond(array2[i])) {
    i += 1;
  }
  const deleteCount = i;
  if (deleteCount !== 0)
    array2.splice(0, deleteCount);
}
function dropLastWhile(array2, cond) {
  let i = array2.length - 1;
  while (i >= 0 && cond(array2[i])) {
    i -= 1;
  }
  const deleteCount = array2.length - 1 - i;
  if (deleteCount !== 0)
    array2.splice(array2.length - deleteCount, deleteCount);
}
function distribute(min, max, maxCount) {
  const values = [min];
  const step = Math.round((max - min) / (maxCount - 1));
  if (step > 0) {
    for (let i = min + step; i < max; i += step) {
      const length2 = values.push(i);
      if (length2 >= maxCount - 1)
        break;
    }
  }
  values.push(max);
  return values;
}
function reversePush(target, newElements) {
  for (let i = newElements.length - 1; i >= 0; i--) {
    target.push(newElements[i]);
  }
  return target;
}

// packages/ag-charts-core/src/dom/globalsProxy.ts
var verifiedGlobals = {};
if (typeof globalThis.window !== "undefined") {
  verifiedGlobals.window = globalThis.window;
}
if (typeof document !== "undefined") {
  verifiedGlobals.document = document;
} else if (typeof globalThis.global !== "undefined") {
  verifiedGlobals.document = globalThis.document;
}
function getDocument(propertyName) {
  return propertyName == null ? verifiedGlobals.document : verifiedGlobals.document?.[propertyName];
}
function getWindow(propertyName) {
  return propertyName == null ? verifiedGlobals.window : verifiedGlobals.window?.[propertyName];
}
function setDocument(document2) {
  verifiedGlobals.document = document2;
}
function setWindow(window) {
  verifiedGlobals.window = window;
}
function getOffscreenCanvas() {
  return verifiedGlobals.window?.OffscreenCanvas ?? globalThis.OffscreenCanvas;
}
function getPath2D() {
  return verifiedGlobals.window?.Path2D ?? globalThis.Path2D;
}
function getDOMMatrix() {
  return verifiedGlobals.window?.DOMMatrix ?? globalThis.DOMMatrix;
}
function getImage() {
  return verifiedGlobals.window?.Image ?? globalThis.Image;
}
function getResizeObserver() {
  return verifiedGlobals.window?.ResizeObserver ?? globalThis.ResizeObserver;
}
var ELEMENT_NODE = 1;
var DOCUMENT_FRAGMENT_NODE = 11;
function isNode(obj) {
  return obj != null && typeof obj.nodeType === "number";
}
function isElement(obj) {
  return obj != null && obj.nodeType === ELEMENT_NODE;
}
function isDocumentFragment(obj) {
  return obj != null && obj.nodeType === DOCUMENT_FRAGMENT_NODE;
}
function isHTMLElement(obj) {
  return obj != null && obj.nodeType === ELEMENT_NODE && "style" in obj;
}

// packages/ag-charts-core/src/structures/eventEmitter.ts
var EventEmitter = class {
  constructor() {
    this.events = /* @__PURE__ */ new Map();
  }
  /**
   * Registers an event listener.
   * @param eventName The event name to listen for.
   * @param listener The callback to be invoked on the event.
   * @returns A function to unregister the listener.
   */
  on(eventName, listener) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, /* @__PURE__ */ new Set());
    }
    this.events.get(eventName)?.add(listener);
    return () => this.off(eventName, listener);
  }
  /**
   * Unregisters an event listener.
   * @param eventName The event name to stop listening for.
   * @param listener The callback to be removed.
   */
  off(eventName, listener) {
    const eventListeners = this.events.get(eventName);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.events.delete(eventName);
      }
    }
  }
  hasListeners(eventName) {
    return this.events.has(eventName);
  }
  /**
   * Emits an event to all registered listeners.
   * @param eventName The name of the event to emit.
   * @param event The event payload.
   */
  emit(eventName, event) {
    const listeners = this.events.get(eventName);
    if (listeners) {
      for (const callback2 of listeners) {
        callback2(event);
      }
    }
  }
  /**
   * Clears all listeners for a specific event or all events if no event name is provided.
   * @param eventName (Optional) The name of the event to clear listeners for. If not provided, all listeners for all events are cleared.
   */
  clear(eventName) {
    if (eventName == null) {
      this.events.clear();
    } else {
      this.events.delete(eventName);
    }
  }
};

// packages/ag-charts-core/src/logging/logger.ts
var LOG_LEVELS = ["error", "warning", "deprecation"];
function isLogLevel(value) {
  return typeof value === "string" && LOG_LEVELS.includes(value);
}
function stringifyLogContent(value) {
  if (value instanceof Error || typeof value !== "object" || value == null)
    return String(value);
  const customToString = typeof value.toString === "function" && value.toString !== Object.prototype.toString;
  try {
    return customToString ? String(value) : JSON.stringify(value);
  } catch {
    return "[object Object]";
  }
}
var Logger = class {
  constructor() {
    this.doOnceCache = /* @__PURE__ */ new Set();
    this.onceIssues = /* @__PURE__ */ new Map();
    // Groups this logger is inside, outermost first. An entry is only `opened` on the console once a
    // message has actually been emitted within it.
    this.groups = [];
    // OPTIMIZATION: one flag per level rather than a Set or a per-call `includes`, since `error()`,
    // `warn()` and `deprecation()` are called from option-application paths.
    this.errorEnabled = true;
    this.warningEnabled = true;
    this.deprecationEnabled = true;
    this.issues = new EventEmitter();
  }
  /**
   * Subscribes to every `error`, `warn` and `deprecation` call, whether or not the console showed it:
   * `setEnabledLevels` and the `*Once` caches gate the console only. A subscriber may throw, and the
   * throw unwinds out of the logging call itself.
   */
  onIssue(listener) {
    return this.issues.on("issue", listener);
  }
  /** Replaces the enabled severities on a live Logger, which the chart's options lifecycle drives. */
  setEnabledLevels(levels) {
    this.errorEnabled = levels.includes("error");
    this.warningEnabled = levels.includes("warning");
    this.deprecationEnabled = levels.includes("deprecation");
  }
  log(...logContent) {
    this.openGroups();
    console.log(...logContent);
  }
  /**
   * Deprecation notices. Emitted on the same console channel as `warn`, but a tier of its own that
   * is enabled and disabled independently of it.
   */
  deprecation(message, ...logContent) {
    if (this.deprecationEnabled) {
      this.openGroups();
      console.warn(`AG Charts - ${message}`, ...logContent);
    }
    this.emitIssue("deprecation", message, logContent);
  }
  warn(message, ...logContent) {
    if (this.warningEnabled) {
      this.openGroups();
      console.warn(`AG Charts - ${message}`, ...logContent);
    }
    this.emitIssue("warning", message, logContent);
  }
  error(message, ...logContent) {
    if (this.errorEnabled) {
      this.openGroups();
      if (typeof message === "object") {
        console.error(`AG Charts error`, message, ...logContent);
      } else {
        console.error(`AG Charts - ${message}`, ...logContent);
      }
    }
    this.emitIssue("error", message, logContent);
  }
  // Console first, then subscribers: a subscriber that throws must not lose the console record.
  emitIssue(severity, message, logContent, cacheKey) {
    if (!this.issues.hasListeners("issue"))
      return;
    const memoised = cacheKey == null ? void 0 : this.onceIssues.get(cacheKey);
    if (memoised) {
      this.issues.emit("issue", memoised);
      return;
    }
    const details = logContent.map(stringifyLogContent);
    const issue = message instanceof Error ? { severity, message: message.message, cause: message } : { severity, message: stringifyLogContent(message) };
    if (message instanceof Error && message.stack != null && message.stack !== "")
      details.unshift(message.stack);
    const detail = details.filter((part) => part !== "").join("\n");
    if (detail !== "")
      issue.detail = detail;
    if (cacheKey != null)
      this.onceIssues.set(cacheKey, issue);
    this.issues.emit("issue", issue);
  }
  table(...logContent) {
    this.openGroups();
    console.table(...logContent);
  }
  guardOnce(messageOrError, severity, logContent, cb) {
    let message;
    if (messageOrError instanceof Error) {
      message = messageOrError.message;
    } else if (typeof messageOrError === "string") {
      message = messageOrError;
    } else if (typeof messageOrError === "object") {
      message = stringifyLogContent(messageOrError);
    } else {
      message = String(messageOrError);
    }
    const cacheKey = `${severity}: ${message}`;
    if (this.doOnceCache.has(cacheKey)) {
      this.emitIssue(severity, messageOrError, logContent, cacheKey);
      return;
    }
    if (this.isEnabled(severity)) {
      this.doOnceCache.add(cacheKey);
    }
    cb(messageOrError);
  }
  isEnabled(severity) {
    if (severity === "error")
      return this.errorEnabled;
    if (severity === "warning")
      return this.warningEnabled;
    return this.deprecationEnabled;
  }
  deprecationOnce(messageOrError, ...logContent) {
    this.guardOnce(
      messageOrError,
      "deprecation",
      logContent,
      (message) => this.deprecation(message, ...logContent)
    );
  }
  warnOnce(messageOrError, ...logContent) {
    this.guardOnce(messageOrError, "warning", logContent, (message) => this.warn(message, ...logContent));
  }
  errorOnce(messageOrError, ...logContent) {
    this.guardOnce(messageOrError, "error", logContent, (message) => this.error(message, ...logContent));
  }
  reset() {
    this.doOnceCache.clear();
    this.onceIssues.clear();
  }
  destroy() {
    this.reset();
    this.issues.clear();
  }
  logGroup(name, cb) {
    const group = { name, opened: false };
    this.groups.push(group);
    let syncCleanup = true;
    try {
      const result = cb();
      if (isPromise(result)) {
        syncCleanup = false;
        return result.finally(() => {
          this.closeGroup(group);
        });
      }
      return result;
    } finally {
      if (syncCleanup) {
        this.closeGroup(group);
      }
    }
  }
  /**
   * Opens the enclosing groups on the console, outermost first. Deferred to the first emission so a
   * group that logs nothing leaves the console's grouping state untouched.
   */
  openGroups() {
    for (const group of this.groups) {
      if (!group.opened) {
        group.opened = true;
        console.groupCollapsed(group.name);
      }
    }
  }
  closeGroup(group) {
    const index = this.groups.lastIndexOf(group);
    if (index === -1)
      return;
    for (let i = this.groups.length - 1; i >= index; i--) {
      if (this.groups[i].opened) {
        console.groupEnd();
      }
    }
    this.groups.length = index;
  }
};
function isPromise(value) {
  return typeof value === "object" && value !== null && "then" in value;
}
var ambientLogger = /*#__PURE__*/ new Logger();
var log = (...logContent) => ambientLogger.log(...logContent);
var warn = (message, ...logContent) => ambientLogger.warn(message, ...logContent);
var error = (message, ...logContent) => ambientLogger.error(message, ...logContent);
var table = (...logContent) => ambientLogger.table(...logContent);
var warnOnce = (messageOrError, ...logContent) => ambientLogger.warnOnce(messageOrError, ...logContent);
var errorOnce = (messageOrError, ...logContent) => ambientLogger.errorOnce(messageOrError, ...logContent);
var reset = () => ambientLogger.reset();
var logGroup = (name, cb) => ambientLogger.logGroup(name, cb);

// packages/ag-charts-core/src/logging/debugLogger.ts
var LongTimePeriodThreshold = 2e3;
var timeOfLastLog = /*#__PURE__*/ Date.now();
function logTimeGap() {
  const timeSinceLastLog = Date.now() - timeOfLastLog;
  if (timeSinceLastLog > LongTimePeriodThreshold) {
    const prettyDuration = (Math.floor(timeSinceLastLog / 100) / 10).toFixed(1);
    log(`**** ${prettyDuration}s since last log message ****`);
  }
  timeOfLastLog = Date.now();
}
function create(...debugSelectors) {
  const resultFn = (...logContent) => {
    if (check(...debugSelectors)) {
      if (typeof logContent[0] === "function") {
        logContent = toArray(logContent[0]());
      }
      logTimeGap();
      log(...logContent);
    }
  };
  return Object.assign(resultFn, {
    check: () => check(...debugSelectors),
    group: (name, cb) => {
      if (check(...debugSelectors)) {
        return logGroup(name, cb);
      }
      return cb();
    }
  });
}
function check(...debugSelectors) {
  if (debugSelectors.length === 0) {
    debugSelectors.push(true);
  }
  const chartDebug = getWindow("agChartsDebug");
  if (chartDebug == null) {
    return false;
  }
  return toArray(chartDebug).some((selector) => debugSelectors.includes(selector));
}
function inDevelopmentMode(fn) {
  if (check("dev")) {
    return fn();
  }
}
function Time(name, opts = {}) {
  const { logResult = true, logStack = false, logArgs = false, logData } = opts;
  return function(_target, _propertyKey, descriptor) {
    const method = descriptor.value;
    descriptor.value = function(...args) {
      const start2 = performance.now();
      const result = method.apply(this, args);
      const duration = performance.now() - start2;
      const logMessage = { duration };
      if (logResult)
        logMessage.result = result;
      if (logArgs)
        logMessage.args = args;
      if (logStack)
        logMessage.stack = new Error("Stack trace for timing debug").stack;
      if (logData)
        logMessage.logData = logData(this);
      log(name, logMessage);
      return result;
    };
  };
}

// packages/ag-charts-core/src/identity/id.ts
var ID_MAP = /* @__PURE__ */ /*#__PURE__*/ new Map();
var nextElementID = 1;
function resetIds() {
  ID_MAP.clear();
  nextElementID = 1;
}
function createId(instance) {
  const constructor = instance.constructor;
  let className = Object.hasOwn(constructor, "className") ? constructor.className : constructor.name;
  inDevelopmentMode(() => {
    if (className == null || className === "") {
      throw new Error(`The ${String(constructor)} is missing the 'className' property.`);
    }
  });
  className ?? (className = "Unknown");
  const nextId = (ID_MAP.get(className) ?? 0) + 1;
  ID_MAP.set(className, nextId);
  return `${className}-${nextId}`;
}
function createElementId() {
  return `ag-charts-${nextElementID++}`;
}
function generateUUID() {
  return crypto.randomUUID?.() ?? generateUUIDv4();
}
function generateUUIDv4() {
  const uuidArray = new Uint8Array(16);
  crypto.getRandomValues(uuidArray);
  uuidArray[6] = uuidArray[6] & 15 | 64;
  uuidArray[8] = uuidArray[8] & 63 | 128;
  let uuid = "";
  for (let i = 0; i < uuidArray.length; i++) {
    if (i === 4 || i === 6 || i === 8 || i === 10) {
      uuid += "-";
    }
    uuid += uuidArray[i].toString(16).padStart(2, "0");
  }
  return uuid;
}

// packages/ag-charts-core/src/identity/idGenerator.ts
function createIdsGenerator() {
  const idsCounter = /* @__PURE__ */ new Map();
  return (name) => {
    const counter = idsCounter.get(name);
    if (counter != null) {
      idsCounter.set(name, counter + 1);
      return `${name}_${counter}`;
    }
    idsCounter.set(name, 1);
    return name;
  };
}

// packages/ag-charts-core/src/logging/ambientLog.ts
var ambientLog_exports = {};
__export(ambientLog_exports, {
  error: () => error,
  errorOnce: () => errorOnce,
  log: () => log,
  logGroup: () => logGroup,
  reset: () => reset,
  table: () => table,
  warn: () => warn,
  warnOnce: () => warnOnce
});

// packages/ag-charts-core/src/logging/debugMetrics.ts
var debugMetrics_exports = {};
__export(debugMetrics_exports, {
  flush: () => flush,
  record: () => record
});
var metrics = /* @__PURE__ */ /*#__PURE__*/ new Map();
function record(key, value) {
  if (!check("scene:stats:verbose"))
    return;
  metrics.set(key, value);
}
function flush() {
  const result = Object.fromEntries(metrics);
  metrics.clear();
  return result;
}

// packages/ag-charts-core/src/structures/bandedStructure.ts
function adjustBandForInsertion(band, insertIndex, insertCount, isLastBand) {
  if (insertIndex < band.startIndex) {
    band.startIndex += insertCount;
    band.endIndex += insertCount;
    return false;
  } else if (insertIndex < band.endIndex || insertIndex === band.endIndex && isLastBand) {
    band.endIndex += insertCount;
    return true;
  }
  return false;
}
function adjustBandForRemoval(band, removeIndex, removeCount) {
  const removeEnd = removeIndex + removeCount;
  if (removeEnd <= band.startIndex) {
    band.startIndex = Math.max(0, band.startIndex - removeCount);
    band.endIndex = Math.max(band.startIndex, band.endIndex - removeCount);
    return false;
  } else if (removeIndex >= band.endIndex) {
    return false;
  } else {
    if (removeIndex <= band.startIndex && removeEnd >= band.endIndex) {
      band.startIndex = removeIndex;
      band.endIndex = removeIndex;
    } else if (removeIndex <= band.startIndex) {
      const deletedFromBand = removeEnd - band.startIndex;
      const oldBandSize = band.endIndex - band.startIndex;
      band.startIndex = removeIndex;
      band.endIndex = band.startIndex + Math.max(0, oldBandSize - deletedFromBand);
    } else if (removeEnd >= band.endIndex) {
      band.endIndex = Math.max(band.startIndex, removeIndex);
    } else {
      band.endIndex = Math.max(band.startIndex, band.endIndex - removeCount);
    }
    return true;
  }
}
function calculateTargetBandCount(dataSize, minBandCount) {
  const derivedCount = Math.ceil(dataSize / 1e3);
  return Math.max(minBandCount, derivedCount);
}
function calculateIdealBandSize(dataSize, targetBandCount) {
  return Math.max(1, Math.ceil(dataSize / targetBandCount));
}
function filterEmptyBands(bands) {
  return bands.filter((band) => band.endIndex > band.startIndex);
}
function initializeBandArray(dataSize, config, bandFactory) {
  if (!config.enableBanding || dataSize < config.minDataSizeForBanding) {
    return [bandFactory(0, dataSize)];
  }
  const targetBandCount = calculateTargetBandCount(dataSize, config.targetBandCount);
  const bandSize = calculateIdealBandSize(dataSize, targetBandCount);
  const bands = [];
  for (let startIndex = 0; startIndex < dataSize; startIndex += bandSize) {
    const endIndex = Math.min(startIndex + bandSize, dataSize);
    bands.push(bandFactory(startIndex, endIndex));
  }
  return bands;
}
function markBandDirtyAtIndex(bands, index) {
  for (const band of bands) {
    if (index >= band.startIndex && index < band.endIndex) {
      band.isDirty = true;
      return;
    }
  }
}
function applySpliceOperations(bandHandler, spliceOps) {
  for (const op of spliceOps) {
    if (op.insertCount > 0) {
      bandHandler.handleInsertion(op.index, op.insertCount);
    }
    if (op.deleteCount > 0) {
      bandHandler.handleRemoval(op.index, op.deleteCount);
    }
  }
}
function markUpdatedIndices(bandHandler, updatedIndices) {
  for (const index of updatedIndices) {
    bandHandler.handleInsertion(index, 0);
  }
}
function applyIndexMapToBandHandler(bandHandler, indexMap) {
  applySpliceOperations(bandHandler, indexMap.spliceOps);
  if (indexMap.updatedIndices.size > 0) {
    markUpdatedIndices(bandHandler, indexMap.updatedIndices);
  }
}
var DEFAULT_MIN_DATA_SIZE_FOR_BANDING = 1e3;
var DEFAULT_TARGET_BAND_COUNT = 10;
var BandedStructure = class {
  constructor(config = {}) {
    this.bands = [];
    this.dataSize = 0;
    this.config = {
      minDataSizeForBanding: config.minDataSizeForBanding ?? DEFAULT_MIN_DATA_SIZE_FOR_BANDING,
      targetBandCount: config.targetBandCount ?? DEFAULT_TARGET_BAND_COUNT,
      maxBandSize: config.maxBandSize ?? Infinity,
      enableBanding: config.enableBanding ?? true
    };
  }
  applyIndexMap(indexMap) {
    applyIndexMapToBandHandler(this, indexMap);
  }
  /**
   * Initializes or rebalances bands based on current data size.
   */
  initializeBands(dataSize) {
    this.dataSize = Math.max(0, dataSize);
    this.bands = initializeBandArray(
      this.dataSize,
      this.config,
      (startIndex, endIndex) => this.createBand(startIndex, endIndex)
    );
  }
  /**
   * Returns the number of bands currently in this structure.
   * Useful for checking if bands need initialization.
   */
  getBandCount() {
    return this.bands.length;
  }
  /**
   * Handles insertion of new data by adjusting band indices.
   * Uses proactive band splitting to maintain optimal band sizes.
   */
  handleInsertion(insertIndex, insertCount) {
    this.dataSize += insertCount;
    if (this.bands.length === 0) {
      this.initializeBands(this.dataSize);
      return;
    }
    const targetBandCount = calculateTargetBandCount(this.dataSize, this.config.targetBandCount);
    const idealBandSize = calculateIdealBandSize(this.dataSize, targetBandCount);
    const maxBandSize = Math.ceil(idealBandSize * 1.1);
    for (let i = 0; i < this.bands.length; i++) {
      const band = this.bands[i];
      const isLastBand = i === this.bands.length - 1;
      if (insertIndex === band.endIndex && isLastBand && insertCount > 0) {
        const currentBandSize = band.endIndex - band.startIndex;
        if (currentBandSize >= idealBandSize) {
          this.bands.push(this.createBand(insertIndex, insertIndex + insertCount));
        } else {
          band.endIndex += insertCount;
          band.isDirty = true;
        }
        break;
      }
      const wasDirty = adjustBandForInsertion(band, insertIndex, insertCount, isLastBand);
      if (wasDirty) {
        band.isDirty = true;
        if (insertCount > 0 && insertIndex < band.endIndex) {
          const bandSize = band.endIndex - band.startIndex;
          if (bandSize > maxBandSize) {
            this.splitBand(i, idealBandSize);
          }
        }
      }
    }
  }
  /**
   * Handles removal of data by adjusting band indices.
   * Uses shared utilities for consistent band manipulation.
   */
  handleRemoval(removeIndex, removeCount) {
    if (removeCount <= 0 || this.bands.length === 0)
      return;
    const effectiveRemoveCount = Math.min(removeCount, Math.max(0, this.dataSize - removeIndex));
    if (effectiveRemoveCount <= 0)
      return;
    this.dataSize = Math.max(0, this.dataSize - effectiveRemoveCount);
    for (const band of this.bands) {
      const wasDirty = adjustBandForRemoval(band, removeIndex, effectiveRemoveCount);
      if (wasDirty) {
        band.isDirty = true;
      }
    }
    this.bands = filterEmptyBands(this.bands);
  }
  /**
   * Split an oversized band into two smaller bands.
   * Called when a band exceeds maxBandSize during insertion.
   *
   * Strategy:
   * - Split the band as evenly as possible
   * - Both halves marked as dirty (need recalculation)
   * - No cache preservation (splitting indicates data changed)
   */
  splitBand(bandIndex, idealSize) {
    const band = this.bands[bandIndex];
    const bandSize = band.endIndex - band.startIndex;
    const firstHalfSize = Math.min(idealSize, Math.floor(bandSize / 2));
    const splitPoint = band.startIndex + firstHalfSize;
    const band1 = this.createBand(band.startIndex, splitPoint);
    const band2 = this.createBand(splitPoint, band.endIndex);
    this.bands.splice(bandIndex, 1, band1, band2);
  }
  /**
   * Returns statistics about the banded structure for debugging.
   * Subclasses can override to add domain-specific stats.
   */
  getStats() {
    const dirtyBands = this.bands.filter((band) => band.isDirty);
    return {
      totalBands: this.bands.length,
      dirtyBands: dirtyBands.length,
      dataSize: this.dataSize
    };
  }
  markRangeDirty(startIndex, endIndex) {
    for (const band of this.bands) {
      if (startIndex < band.endIndex && endIndex > band.startIndex) {
        band.isDirty = true;
      }
    }
  }
};

// packages/ag-charts-core/src/structures/bitfield.ts
var Bitfield = class {
  constructor(length2) {
    this.length = length2;
    this.buffer = new Uint32Array(Math.ceil(length2 / 32));
  }
  clear() {
    this.buffer.fill(0);
  }
  getBit(index) {
    return this.buffer[index >>> 5] >>> (index & 31) & 1;
  }
  setBit(index) {
    this.buffer[index >>> 5] |= 1 << (index & 31);
  }
  unsetBit(index) {
    this.buffer[index >>> 5] &= ~(1 << (index & 31));
  }
  toggleBit(index) {
    this.buffer[index >>> 5] ^= 1 << (index & 31);
  }
  fill(value, startIndex, endIndex) {
    if (startIndex >= endIndex)
      return;
    const startWord = startIndex >>> 5;
    const startBit = startIndex & 31;
    const endWord = endIndex >>> 5;
    const endBit = endIndex & 31;
    if (startWord === endWord) {
      const mask = (1 << endBit - startBit) - 1 << startBit;
      if (value === 1) {
        this.buffer[startWord] |= mask;
      } else {
        this.buffer[startWord] &= ~mask;
      }
      return;
    }
    const startMask = 4294967295 << startBit;
    if (value === 1) {
      this.buffer[startWord] |= startMask;
    } else {
      this.buffer[startWord] &= ~startMask;
    }
    this.buffer.fill(4294967295 * value, startWord + 1, endWord);
    const endMask = (1 << endBit) - 1;
    if (value === 1) {
      this.buffer[endWord] |= endMask;
    } else {
      this.buffer[endWord] &= ~endMask;
    }
  }
};

// packages/ag-charts-core/src/structures/graph.ts
var Graph = class {
  constructor(options) {
    this._vertexCount = 0;
    this._edgeCount = 0;
    this.pendingProcessingEdgesFrom = [];
    this.pendingProcessingEdgesTo = [];
    this.cachedNeighboursEdge = options?.cachedNeighboursEdge;
    this.processedEdge = options?.processedEdge;
    this.singleValueEdges = options?.singleValueEdges;
  }
  clear() {
    this._vertexCount = 0;
    this._edgeCount = 0;
    this.pendingProcessingEdgesFrom = [];
    this.pendingProcessingEdgesTo = [];
    this.singleValueEdges?.clear();
  }
  getVertexCount() {
    return this._vertexCount;
  }
  getEdgeCount() {
    return this._edgeCount;
  }
  addVertex(value) {
    const vertex = new Vertex(value);
    this._vertexCount++;
    return vertex;
  }
  addEdge(from3, to, edge) {
    if (edge === this.cachedNeighboursEdge) {
      from3.updateCachedNeighbours().set(to.value, to);
    } else if (edge === this.processedEdge) {
      this.pendingProcessingEdgesFrom.push(from3);
      this.pendingProcessingEdgesTo.push(to);
    }
    const { edges } = from3;
    const vertices = edges.get(edge);
    if (!vertices) {
      edges.set(edge, [to]);
      this._edgeCount++;
    } else if (!vertices.includes(to)) {
      if (this.singleValueEdges?.has(edge)) {
        edges.set(edge, [to]);
      } else {
        vertices.push(to);
        this._edgeCount++;
      }
    }
  }
  removeVertex(vertex) {
    this._vertexCount--;
    const edges = vertex.edges;
    if (edges == null)
      return;
    for (const [, adjacentVertices] of edges) {
      this._vertexCount -= adjacentVertices.length;
    }
    vertex.clear();
  }
  removeEdge(from3, to, edge) {
    const neighbours = from3.edges.get(edge);
    if (!neighbours)
      return;
    const index = neighbours.indexOf(to);
    if (index === -1)
      return;
    neighbours.splice(index, 1);
    if (neighbours.length === 0) {
      from3.edges.delete(edge);
    }
    this._edgeCount--;
    if (edge === this.cachedNeighboursEdge) {
      from3.readCachedNeighbours()?.delete(to.value);
    }
  }
  removeEdges(from3, edgeValue) {
    this._edgeCount -= from3.edges.get(edgeValue)?.length ?? 0;
    from3.edges.delete(edgeValue);
  }
  getVertexValue(vertex) {
    return vertex.value;
  }
  // Iterate all the neighbours of a given vertex.
  *neighbours(from3) {
    for (const [, adjacentVertices] of from3.edges) {
      for (const adjacentVertex of adjacentVertices) {
        yield adjacentVertex;
      }
    }
  }
  // Iterate all the neighbours and their edges of a given vertex
  *neighboursAndEdges(from3) {
    for (const [edge, adjacentVertices] of from3.edges) {
      for (const adjacentVertex of adjacentVertices) {
        yield [adjacentVertex, edge];
      }
    }
  }
  // Get the set of neighbours along a given edge.
  neighboursWithEdgeValue(from3, edgeValue) {
    return from3.edges.get(edgeValue);
  }
  // Find the first neighbour along the given edge.
  findNeighbour(from3, edgeValue) {
    return from3.edges.get(edgeValue)?.[0];
  }
  // Find the value of the first neighbour along the given edge.
  findNeighbourValue(from3, edgeValue) {
    const neighbour = this.findNeighbour(from3, edgeValue);
    if (!neighbour)
      return;
    return this.getVertexValue(neighbour);
  }
  // Find the first neighbour with a given value, optionally along a given edge.
  findNeighbourWithValue(from3, value, edgeValue) {
    const neighbours = edgeValue == null ? this.neighbours(from3) : this.neighboursWithEdgeValue(from3, edgeValue);
    if (!neighbours)
      return;
    for (const neighbour of neighbours) {
      if (this.getVertexValue(neighbour) === value) {
        return neighbour;
      }
    }
  }
  // Find a vertex by iterating an array of vertex values along a given edge.
  findVertexAlongEdge(from3, findValues, edgeValue) {
    if (edgeValue === this.cachedNeighboursEdge) {
      let found2;
      for (const value of findValues) {
        found2 = (found2 ?? from3).readCachedNeighbours()?.get(value);
        if (!found2)
          return;
      }
      return found2;
    }
    if (findValues.length === 0)
      return;
    let found = from3;
    for (const value of findValues) {
      const neighbours = found ? this.neighboursWithEdgeValue(found, edgeValue) : void 0;
      if (!neighbours)
        return;
      found = neighbours.find((n) => n.value === value);
    }
    return found;
  }
  adjacent(from3, to) {
    for (const [, adjacentVertices] of from3.edges) {
      if (adjacentVertices.includes(to))
        return true;
    }
    return false;
  }
};
var Vertex = class {
  constructor(value) {
    this.value = value;
    this.edges = /* @__PURE__ */ new Map();
  }
  readCachedNeighbours() {
    return this._cachedNeighbours;
  }
  updateCachedNeighbours() {
    this._cachedNeighbours ?? (this._cachedNeighbours = /* @__PURE__ */ new Map());
    return this._cachedNeighbours;
  }
  clear() {
    this.edges.clear();
    this._cachedNeighbours?.clear();
  }
};

// packages/ag-charts-core/src/structures/listeners.ts
var Listeners = class {
  constructor() {
    this.registeredListeners = /* @__PURE__ */ new Map();
  }
  addListener(eventType, handler) {
    const record2 = { symbol: Symbol(eventType), handler };
    if (this.registeredListeners.has(eventType)) {
      this.registeredListeners.get(eventType).push(record2);
    } else {
      this.registeredListeners.set(eventType, [record2]);
    }
    return () => this.removeListener(record2.symbol);
  }
  removeListener(eventSymbol) {
    for (const [type, listeners] of this.registeredListeners.entries()) {
      const matchIndex = listeners.findIndex((listener) => listener.symbol === eventSymbol);
      if (matchIndex >= 0) {
        listeners.splice(matchIndex, 1);
        if (listeners.length === 0) {
          this.registeredListeners.delete(type);
        }
        break;
      }
    }
  }
  dispatch(eventType, ...params) {
    for (const listener of this.getListenersByType(eventType)) {
      try {
        listener.handler(...params);
      } catch (e) {
        errorOnce(e);
      }
    }
  }
  getListenersByType(eventType) {
    return this.registeredListeners.get(eventType) ?? [];
  }
  destroy() {
    this.registeredListeners.clear();
  }
};

// packages/ag-charts-core/src/structures/lruCache.ts
var LRUCache = class {
  constructor(maxCacheSize) {
    this.maxCacheSize = maxCacheSize;
    this.store = /* @__PURE__ */ new Map();
    if (maxCacheSize <= 0) {
      throw new Error("LRUCache size must be greater than 0");
    }
  }
  get(key) {
    if (!this.store.has(key))
      return;
    const value = this.store.get(key);
    this.store.delete(key);
    this.store.set(key, value);
    return value;
  }
  has(key) {
    return this.store.has(key);
  }
  set(key, value) {
    this.store.set(key, value);
    if (this.store.size > this.maxCacheSize) {
      const oldest = this.store.keys().next();
      if (!oldest.done) {
        this.store.delete(oldest.value);
      }
    }
    return value;
  }
  clear() {
    this.store.clear();
  }
};

// packages/ag-charts-core/src/structures/pool.ts
var CLEANUP_TIMEOUT_MS = 1e3;
var _Pool = /*#__PURE__*/ (() => { var _c$0 = class _Pool {
  constructor(name, buildItem, releaseItem, destroyItem, maxPoolSize, cleanupTimeMs = CLEANUP_TIMEOUT_MS) {
    this.name = name;
    this.buildItem = buildItem;
    this.releaseItem = releaseItem;
    this.destroyItem = destroyItem;
    this.maxPoolSize = maxPoolSize;
    this.cleanupTimeMs = cleanupTimeMs;
    this.freePool = [];
    this.busyPool = /* @__PURE__ */ new Set();
  }
  static getPool(name, buildItem, releaseItem, destroyItem, maxPoolSize) {
    if (!this.pools.has(name)) {
      this.pools.set(name, new _Pool(name, buildItem, releaseItem, destroyItem, maxPoolSize));
    }
    return this.pools.get(name);
  }
  isFull() {
    return this.freePool.length + this.busyPool.size >= this.maxPoolSize;
  }
  hasFree() {
    return this.freePool.length > 0;
  }
  obtain(params) {
    if (!this.hasFree() && this.isFull()) {
      throw new Error("AG Charts - pool exhausted");
    }
    let nextFree = this.freePool.pop();
    if (nextFree == null) {
      nextFree = this.buildItem(params);
      _Pool.debug(() => [
        `Pool[name=${this.name}]: Created instance (${this.freePool.length} / ${this.busyPool.size + 1} / ${this.maxPoolSize})`,
        nextFree
      ]);
    } else {
      _Pool.debug(() => [
        `Pool[name=${this.name}]: Re-used instance (${this.freePool.length} / ${this.busyPool.size + 1} / ${this.maxPoolSize})`,
        nextFree
      ]);
    }
    this.busyPool.add(nextFree);
    return { item: nextFree, release: () => this.release(nextFree) };
  }
  obtainFree() {
    const nextFree = this.freePool.pop();
    if (nextFree == null) {
      throw new Error("AG Charts - pool has no free instances");
    }
    _Pool.debug(() => [
      `Pool[name=${this.name}]: Re-used instance (${this.freePool.length} / ${this.busyPool.size + 1} / ${this.maxPoolSize})`,
      nextFree
    ]);
    this.busyPool.add(nextFree);
    return { item: nextFree, release: () => this.release(nextFree) };
  }
  release(item) {
    if (!this.busyPool.has(item)) {
      throw new Error("AG Charts - cannot free item from pool which is not tracked as busy.");
    }
    _Pool.debug(() => [
      `Pool[name=${this.name}]: Releasing instance (${this.freePool.length} / ${this.busyPool.size} / ${this.maxPoolSize})`,
      item
    ]);
    this.releaseItem(item);
    this.busyPool.delete(item);
    this.freePool.push(item);
    _Pool.debug(() => [
      `Pool[name=${this.name}]: Returned instance to free pool (${this.freePool.length} / ${this.busyPool.size} / ${this.maxPoolSize})`,
      item
    ]);
    const now = Date.now();
    const earliestClean = now + this.cleanupTimeMs * 0.5;
    if (this.cleanPoolTimer && (this.cleanPoolDue ?? Infinity) < earliestClean) {
      clearTimeout(this.cleanPoolTimer);
      this.cleanPoolTimer = void 0;
    }
    if (!this.cleanPoolTimer) {
      this.cleanPoolDue = now + this.cleanupTimeMs;
      this.cleanPoolTimer = setTimeout(this.cleanPool.bind(this), this.cleanupTimeMs);
    }
  }
  cleanPool() {
    const itemsToFree = this.freePool.splice(0);
    for (const item of itemsToFree) {
      this.destroyItem(item);
    }
    _Pool.debug(() => [
      `Pool[name=${this.name}]: Cleaned pool of ${itemsToFree.length} items (${this.freePool.length} / ${this.busyPool.size} / ${this.maxPoolSize})`
    ]);
  }
  destroy() {
    this.cleanPool();
    for (const item of this.busyPool.values()) {
      this.destroyItem(item);
    }
    this.busyPool.clear();
  }
}; _c$0.pools = /* @__PURE__ */ new Map(); _c$0.debug = create(true, "pool"); return _c$0; })()
var Pool = _Pool;

// packages/ag-charts-core/src/structures/stateTracker.ts
var StateTracker = class extends Map {
  constructor(defaultValue, defaultState) {
    super();
    this.defaultValue = defaultValue;
    this.defaultState = defaultState;
  }
  set(key, value) {
    this.delete(key);
    if (value !== void 0) {
      super.set(key, value);
    }
    delete this.cachedState;
    delete this.cachedValue;
    return this;
  }
  delete(key) {
    delete this.cachedState;
    delete this.cachedValue;
    return super.delete(key);
  }
  /**
   * Pins `value` as the reported state until {@link unlock}, so a caller owning an ongoing
   * interaction is not overridden by others. Their updates are still recorded, so releasing the
   * lock resumes whichever state is current by then.
   */
  lock(key, value) {
    this.locked = { key, value };
    delete this.cachedState;
    delete this.cachedValue;
  }
  /** Releases a lock; a no-op unless `key` is the lock holder, so one owner cannot release another's. */
  unlock(key) {
    if (this.locked?.key !== key)
      return;
    this.locked = void 0;
    delete this.cachedState;
    delete this.cachedValue;
  }
  isLocked() {
    return this.locked !== void 0;
  }
  stateId() {
    if (this.locked)
      return this.locked.key;
    this.cachedState ?? (this.cachedState = Array.from(this.keys()).pop() ?? this.defaultState);
    return this.cachedState;
  }
  stateValue() {
    if (this.locked)
      return this.locked.value;
    this.cachedValue ?? (this.cachedValue = Array.from(this.values()).pop() ?? this.defaultValue);
    return this.cachedValue;
  }
};
var NonNullableStateTracker = class extends StateTracker {
  constructor(defaultValue, defaultState) {
    super(defaultValue, defaultState);
    this.defaultValue = defaultValue;
    this.defaultState = defaultState;
  }
  stateId() {
    return super.stateId() ?? this.defaultState;
  }
  stateValue() {
    return super.stateValue() ?? this.defaultValue;
  }
};

// packages/ag-charts-core/src/state/caching.ts
var SimpleCache = class {
  constructor(getter) {
    this.getter = getter;
  }
  get() {
    this.result ?? (this.result = this.getter());
    return this.result;
  }
  clear() {
    this.result = void 0;
  }
};
var WeakCache = class {
  constructor(getter) {
    this.getter = getter;
  }
  get() {
    let result = this.result?.deref();
    if (result)
      return result;
    result = this.getter();
    this.result = new WeakRef(result);
    return result;
  }
  clear() {
    this.result = void 0;
  }
};

// packages/ag-charts-core/src/state/callbackCache.ts
function needsContext(caller, _params) {
  return "context" in caller;
}
function maybeSetContext(caller, params) {
  if (caller != null && needsContext(caller, params)) {
    if (params != null && typeof params === "object" && params.context === void 0) {
      params.context = caller.context;
      return true;
    }
  }
  return false;
}
function callWithContext(callers, fn, params) {
  if (Array.isArray(callers)) {
    for (const caller of callers) {
      if (maybeSetContext(caller, params)) {
        break;
      }
    }
  } else {
    maybeSetContext(callers, params);
  }
  return fn(params);
}
var CallbackCache = class {
  constructor(logger) {
    this.logger = logger;
    this.cache = /* @__PURE__ */ new WeakMap();
  }
  call(callers, fn, params, cacheKey) {
    let serialisedParams;
    let paramCache = this.cache.get(fn);
    try {
      serialisedParams = cacheKey ?? JSON.stringify(params);
    } catch {
      return this.invoke(callers, fn, paramCache, void 0, params);
    }
    if (paramCache == null) {
      paramCache = /* @__PURE__ */ new Map();
      this.cache.set(fn, paramCache);
    }
    if (!paramCache.has(serialisedParams)) {
      return this.invoke(callers, fn, paramCache, serialisedParams, params);
    }
    return paramCache.get(serialisedParams);
  }
  invoke(callers, fn, paramCache, serialisedParams, params) {
    try {
      const result = callWithContext(callers, fn, params);
      if (paramCache && serialisedParams != null) {
        paramCache.set(serialisedParams, result);
      }
      return result;
    } catch (e) {
      this.logger.warnOnce(`User callback errored, ignoring`, e);
      return;
    }
  }
  invalidateCache() {
    this.cache = /* @__PURE__ */ new WeakMap();
  }
  destroy() {
    this.invalidateCache();
  }
};

// packages/ag-charts-core/src/state/cleanupRegistry.ts
var CleanupRegistry = class {
  constructor() {
    this.callbacks = /* @__PURE__ */ new Set();
  }
  flush() {
    for (const cb of this.callbacks) {
      cb();
    }
    this.callbacks.clear();
  }
  merge(registry) {
    for (const cb of registry.callbacks) {
      this.callbacks.add(cb);
    }
  }
  register(...callbacks) {
    for (const cb of callbacks) {
      if (cb == null || cb === false)
        continue;
      this.callbacks.add(cb);
    }
  }
};

// packages/ag-charts-core/src/dom/domUtil.ts
var styleDeclaration;
var PARSE_COLOR_CACHE_LIMIT = 4e3;
var parseColorCache = /* @__PURE__ */ /*#__PURE__*/ new Map();
function parseColor(color2) {
  if (parseColorCache.has(color2)) {
    return parseColorCache.get(color2) ?? null;
  }
  if (styleDeclaration == null) {
    const OptionConstructor = getWindow("Option");
    styleDeclaration = new OptionConstructor().style;
  }
  styleDeclaration.color = color2;
  const result = styleDeclaration.color === "" ? null : styleDeclaration.color;
  styleDeclaration.color = "";
  if (parseColorCache.size < PARSE_COLOR_CACHE_LIMIT) {
    parseColorCache.set(color2, result);
  }
  return result;
}
function isDirectionRtl(element2) {
  return element2?.ownerDocument.defaultView?.getComputedStyle(element2).direction === "rtl";
}
function setElementBBox(element2, bbox) {
  if (!element2)
    return;
  const { x, y, width: width2, height: height2 } = normalizeBounds(bbox);
  setPixelValue(element2.style, "width", width2);
  setPixelValue(element2.style, "height", height2);
  setPixelValue(element2.style, "left", x);
  setPixelValue(element2.style, "top", y);
}
function getElementBBox(element2) {
  const styleWidth = Number.parseFloat(element2.style.width);
  const styleHeight = Number.parseFloat(element2.style.height);
  const styleX = Number.parseFloat(element2.style.left);
  const styleY = Number.parseFloat(element2.style.top);
  const width2 = Number.isFinite(styleWidth) ? styleWidth : element2.offsetWidth;
  const height2 = Number.isFinite(styleHeight) ? styleHeight : element2.offsetHeight;
  const x = Number.isFinite(styleX) ? styleX : element2.offsetLeft;
  const y = Number.isFinite(styleY) ? styleY : element2.offsetTop;
  return { x, y, width: width2, height: height2 };
}
function focusCursorAtEnd(element2) {
  element2.focus({ preventScroll: true });
  if (element2.lastChild?.textContent == null)
    return;
  const { ownerDocument } = element2;
  const range2 = ownerDocument.createRange();
  range2.setStart(element2.lastChild, element2.lastChild.textContent.length);
  range2.setEnd(element2.lastChild, element2.lastChild.textContent.length);
  const selection = ownerDocument.defaultView?.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range2);
}
function isInputPending() {
  const navigator = getWindow("navigator");
  if ("scheduling" in navigator) {
    const scheduling = navigator.scheduling;
    if ("isInputPending" in scheduling) {
      return scheduling.isInputPending({ includeContinuous: true });
    }
  }
  return false;
}
function getIconClassNames(icon) {
  return `ag-charts-icon ag-charts-icon-${icon}`;
}
function normalizeBounds(bbox) {
  let { x, y, width: width2, height: height2 } = bbox;
  if ((width2 == null || width2 > 0) && (height2 == null || height2 > 0)) {
    return bbox;
  }
  if (x != null && width2 != null && width2 < 0) {
    width2 = -width2;
    x = x - width2;
  }
  if (y != null && height2 != null && height2 < 0) {
    height2 = -height2;
    y = y - height2;
  }
  return { x, y, width: width2, height: height2 };
}
function setPixelValue(style, key, value) {
  if (value == null) {
    style.removeProperty(key);
  } else {
    style.setProperty(key, `${value}px`);
  }
}

// packages/ag-charts-core/src/data/numbers.ts
function clamp(min, value, max) {
  return Math.min(max, Math.max(min, value));
}
function toNumber(value) {
  if (typeof value === "number")
    return value;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    warnOnce(`the value ${value} exceeds the representable Number range and cannot be rendered.`);
  }
  return n;
}
function narrowToNumber(value) {
  return typeof value === "bigint" ? toNumber(value) : Number(value);
}
function toNumberOrUndefined(value) {
  return value == null ? void 0 : Number(value);
}
function bothIntegral(a, b) {
  return (typeof a === "bigint" || Number.isInteger(a)) && (typeof b === "bigint" || Number.isInteger(b));
}
function addValues(a, b) {
  if (typeof a === "bigint" || typeof b === "bigint") {
    return bothIntegral(a, b) ? BigInt(a) + BigInt(b) : Number(a) + Number(b);
  }
  return a + b;
}
function subtractValues(a, b) {
  if (typeof a === "bigint" || typeof b === "bigint") {
    return bothIntegral(a, b) ? BigInt(a) - BigInt(b) : Number(a) - Number(b);
  }
  return a - b;
}
function minValue(a, b) {
  if (typeof a === "number" && typeof b === "number")
    return Math.min(a, b);
  if (typeof a === "number" && Number.isNaN(a))
    return a;
  if (typeof b === "number" && Number.isNaN(b))
    return b;
  return a < b ? a : b;
}
function maxValue(a, b) {
  if (typeof a === "number" && typeof b === "number")
    return Math.max(a, b);
  if (typeof a === "number" && Number.isNaN(a))
    return a;
  if (typeof b === "number" && Number.isNaN(b))
    return b;
  return a > b ? a : b;
}
function absValue(value) {
  if (typeof value === "bigint")
    return value < 0n ? -value : value;
  return Math.abs(value);
}
function zeroLike(value) {
  return typeof value === "bigint" ? 0n : 0;
}
function inRange(value, range2, epsilon = 1e-10) {
  return value >= range2[0] - epsilon && value <= range2[1] + epsilon;
}
function isNumberEqual(a, b, epsilon = 1e-10) {
  return a === b || Math.abs(a - b) < epsilon;
}
function isNegative(value) {
  if (typeof value === "bigint")
    return value < 0n;
  return Math.sign(value) === -1 || Object.is(value, -0);
}
function isInteger(value) {
  return value % 1 === 0;
}
function roundTo(value, decimals = 2) {
  const base = 10 ** decimals;
  return Math.round(value * base) / base;
}
function ceilTo(value, decimals = 2) {
  const base = 10 ** decimals;
  return Math.ceil(value * base) / base;
}
function modulus(n, m) {
  return Math.floor(n % m + (n < 0 ? Math.abs(m) : 0));
}
function countFractionDigits(value) {
  if (Math.floor(value) === value) {
    return 0;
  }
  let valueString = String(value);
  let exponent = 0;
  if (value < 1e-6 || value >= 1e21) {
    let exponentString;
    [valueString, exponentString] = valueString.split("e");
    if (exponentString != null) {
      exponent = Number(exponentString);
    }
  }
  const decimalPlaces2 = valueString.split(".")[1]?.length ?? 0;
  return Math.max(decimalPlaces2 - exponent, 0);
}

// packages/ag-charts-core/src/format/color.ts
var lerp = (x, y, t) => x * (1 - t) + y * t;
var unsupportedColorFormat = /^\s*(oklab|lab|lch|color)\(/i;
function isUnsupportedColorFormat(value) {
  return unsupportedColorFormat.test(value);
}
var srgbToLinear = (value) => {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  if (abs <= 0.04045)
    return value / 12.92;
  return sign * ((abs + 0.055) / 1.055) ** 2.4;
};
var srgbFromLinear = (value) => {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  if (abs > 31308e-7) {
    return sign * (1.055 * abs ** (1 / 2.4) - 0.055);
  }
  return 12.92 * value;
};
var _Color = /*#__PURE__*/ (() => { var _c$1 = class _Color {
  /**
   * Every color component should be in the [0, 1] range.
   * Some easing functions (such as elastic easing) can overshoot the target value by some amount.
   * So, when animating colors, if the source or target color components are already near
   * or at the edge of the allowed [0, 1] range, it is possible for the intermediate color
   * component value to end up outside of that range mid-animation. For this reason the constructor
   * performs range checking/constraining.
   * @param r Red component.
   * @param g Green component.
   * @param b Blue component.
   * @param a Alpha (opacity) component.
   */
  constructor(r, g, b, a = 1) {
    this.r = clamp(0, Number.isNaN(r) ? 0 : r, 1);
    this.g = clamp(0, Number.isNaN(g) ? 0 : g, 1);
    this.b = clamp(0, Number.isNaN(b) ? 0 : b, 1);
    this.a = clamp(0, Number.isNaN(a) ? 0 : a, 1);
  }
  /**
   * A color string can be in one of the following formats to be valid:
   * - #rgb
   * - #rgba
   * - #rrggbb
   * - #rrggbbaa
   * - rgb(r, g, b) / rgb(r g b)
   * - rgba(r, g, b, a) / rgb(r g b / a)
   * - hsl(h, s%, l%)
   * - hsla(h, s%, l%, a)
   * - oklch(l c h)
   * - oklch(l c h / a)
   * - CSS color name such as 'white', 'orange', 'cyan', etc.
   *
   * Not supported: `oklab()`, `lab()`, `lch()` and `color()`.
   */
  static validColorString(str) {
    if (str.includes("#")) {
      return !!_Color.parseHex(str);
    }
    const token = str.toLowerCase();
    if (token.includes("hsl")) {
      return !!_Color.stringToHsla(str);
    }
    if (token.includes("oklch")) {
      return !!_Color.stringToOklcha(str);
    }
    if (token.includes("rgb")) {
      const rgba = _Color.stringToRgba(str);
      return rgba != null && (rgba.length === 3 || rgba.length === 4);
    }
    return _Color.nameToHex.has(token);
  }
  /**
   * The given string can be in one of the following formats:
   * - #rgb
   * - #rgba
   * - #rrggbb
   * - #rrggbbaa
   * - rgb(r, g, b) / rgb(r g b)
   * - rgba(r, g, b, a) / rgb(r g b / a)
   * - hsl(h, s%, l%)
   * - hsla(h, s%, l%, a)
   * - oklch(l c h)
   * - oklch(l c h / a)
   * - CSS color name such as 'white', 'orange', 'cyan', etc.
   *
   * Not supported: `oklab()`, `lab()`, `lch()` and `color()`.
   * @param str
   */
  static fromString(str) {
    if (str.includes("#")) {
      return _Color.fromHexString(str);
    }
    const token = str.toLowerCase();
    const hex = _Color.nameToHex.get(token);
    if (hex != null) {
      return _Color.fromHexString(hex);
    }
    if (token.includes("hsl")) {
      return _Color.fromHSLString(str);
    }
    if (token.includes("oklch")) {
      return _Color.fromOKLCHString(str);
    }
    if (token.includes("rgb")) {
      return _Color.fromRgbaString(str);
    }
    throw new Error(`Invalid color string: '${str}'`);
  }
  // See https://drafts.csswg.org/css-color/#hex-notation
  static parseHex(input) {
    input = input.replaceAll(" ", "").slice(1);
    let parts;
    switch (input.length) {
      case 6:
      case 8:
        parts = [];
        for (let i = 0; i < input.length; i += 2) {
          parts.push(Number.parseInt(`${input[i]}${input[i + 1]}`, 16));
        }
        break;
      case 3:
      case 4:
        parts = input.split("").map((p) => Number.parseInt(p, 16)).map((p) => p + p * 16);
        break;
    }
    if (parts?.length >= 3 && parts.every((p) => p >= 0)) {
      if (parts.length === 3) {
        parts.push(255);
      }
      return parts;
    }
  }
  static fromHexString(str) {
    const values = _Color.parseHex(str);
    if (values) {
      const [r, g, b, a] = values;
      return new _Color(r / 255, g / 255, b / 255, a / 255);
    }
    throw new Error(`Malformed hexadecimal color string: '${str}'`);
  }
  static stringToRgba(str) {
    const po = str.indexOf("(");
    const pc = str.indexOf(")");
    if (po === -1 || pc === -1 || pc < po)
      return;
    const contents = str.substring(po + 1, pc);
    const slash = contents.indexOf("/");
    const head = slash === -1 ? contents : contents.substring(0, slash);
    const parts = head.trim().split(/[\s,]+/);
    if (slash !== -1) {
      parts.push(contents.substring(slash + 1).trim());
    }
    const rgba = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let value = Number.parseFloat(part);
      if (!Number.isFinite(value)) {
        return;
      }
      if (part.includes("%")) {
        value = clamp(0, value, 100);
        value /= 100;
      } else if (i === 3) {
        value = clamp(0, value, 1);
      } else {
        value = clamp(0, value, 255);
        value /= 255;
      }
      rgba.push(value);
    }
    return rgba;
  }
  static fromRgbaString(str) {
    const rgba = _Color.stringToRgba(str);
    if (rgba) {
      if (rgba.length === 3) {
        return new _Color(rgba[0], rgba[1], rgba[2]);
      } else if (rgba.length === 4) {
        return new _Color(rgba[0], rgba[1], rgba[2], rgba[3]);
      }
    }
    throw new Error(`Malformed rgb/rgba color string: '${str}'`);
  }
  static parseHueDegrees(part) {
    const value = Number.parseFloat(part);
    if (!Number.isFinite(value)) {
      return;
    }
    if (part.includes("turn")) {
      return value * 360;
    }
    if (part.includes("grad")) {
      return value * 0.9;
    }
    if (part.includes("rad")) {
      return value * 180 / Math.PI;
    }
    return value;
  }
  // Saturation and lightness: a bare number shares the same range as the
  // percentage form (`50` ≡ `50%`), so both divide by 100 — clamped to [0, 1].
  static parsePercentage(part) {
    const value = Number.parseFloat(part);
    if (!Number.isFinite(value)) {
      return;
    }
    return clamp(0, value / 100, 1);
  }
  // A value in [0, 1] (alpha, or OKLCH lightness): a bare number is already in range; a percentage divides by 100.
  static parseUnitInterval(part) {
    const value = Number.parseFloat(part);
    if (!Number.isFinite(value)) {
      return;
    }
    return clamp(0, part.includes("%") ? value / 100 : value, 1);
  }
  // OKLCH chroma is an unbounded non-negative value; per CSS Color 4 a percentage maps 100% to 0.4.
  static parseOklchChroma(part) {
    const value = Number.parseFloat(part);
    if (!Number.isFinite(value)) {
      return;
    }
    return Math.max(0, part.includes("%") ? value / 100 * 0.4 : value);
  }
  static stringToHsla(str) {
    const po = str.indexOf("(");
    const pc = str.indexOf(")");
    if (po === -1 || pc === -1 || pc < po)
      return;
    const contents = str.substring(po + 1, pc);
    const slash = contents.indexOf("/");
    const head = slash === -1 ? contents : contents.substring(0, slash);
    const parts = head.trim().split(/[\s,]+/);
    if (slash !== -1) {
      parts.push(contents.substring(slash + 1).trim());
    }
    if (parts.length < 3 || parts.length > 4)
      return;
    const h = _Color.parseHueDegrees(parts[0]);
    const s = _Color.parsePercentage(parts[1]);
    const l = _Color.parsePercentage(parts[2]);
    if (h === void 0 || s === void 0 || l === void 0)
      return;
    const hsla = [h, s, l];
    if (parts.length === 4) {
      const a = _Color.parseUnitInterval(parts[3]);
      if (a === void 0)
        return;
      hsla.push(a);
    }
    return hsla;
  }
  static fromHSLString(str) {
    const hsla = _Color.stringToHsla(str);
    if (hsla) {
      const [h, s, l, a] = hsla;
      return _Color.fromHSL(h, s, l, a ?? 1);
    }
    throw new Error(`Malformed hsl/hsla color string: '${str}'`);
  }
  static stringToOklcha(str) {
    const po = str.indexOf("(");
    const pc = str.indexOf(")");
    if (po === -1 || pc === -1 || pc < po)
      return;
    const contents = str.substring(po + 1, pc);
    const slash = contents.indexOf("/");
    const head = slash === -1 ? contents : contents.substring(0, slash);
    const parts = head.trim().split(/[\s,]+/);
    if (slash !== -1) {
      parts.push(contents.substring(slash + 1).trim());
    }
    if (parts.length < 3 || parts.length > 4)
      return;
    const l = _Color.parseUnitInterval(parts[0]);
    const c = _Color.parseOklchChroma(parts[1]);
    const h = _Color.parseHueDegrees(parts[2]);
    if (l === void 0 || c === void 0 || h === void 0)
      return;
    const oklcha = [l, c, h];
    if (parts.length === 4) {
      const a = _Color.parseUnitInterval(parts[3]);
      if (a === void 0)
        return;
      oklcha.push(a);
    }
    return oklcha;
  }
  static fromOKLCHString(str) {
    const oklcha = _Color.stringToOklcha(str);
    if (oklcha) {
      const [l, c, h, a] = oklcha;
      return _Color.fromOKLCH(l, c, h, a ?? 1);
    }
    throw new Error(`Malformed oklch color string: '${str}'`);
  }
  static fromArray(arr) {
    if (arr.length === 4) {
      return new _Color(arr[0], arr[1], arr[2], arr[3]);
    }
    if (arr.length === 3) {
      return new _Color(arr[0], arr[1], arr[2]);
    }
    throw new Error("The given array should contain 3 or 4 color components (numbers).");
  }
  static fromHSB(h, s, b, alpha = 1) {
    const rgb = _Color.HSBtoRGB(h, s, b);
    return new _Color(rgb[0], rgb[1], rgb[2], alpha);
  }
  static fromHSL(h, s, l, alpha = 1) {
    const rgb = _Color.HSLtoRGB(h, s, l);
    return new _Color(rgb[0], rgb[1], rgb[2], alpha);
  }
  static fromOKLCH(l, c, h, alpha = 1) {
    const rgb = _Color.OKLCHtoRGB(l, c, h);
    return new _Color(rgb[0], rgb[1], rgb[2], alpha);
  }
  static padHex(str) {
    return str.length === 1 ? "0" + str : str;
  }
  toHexString() {
    let hex = "#" + _Color.padHex(Math.round(this.r * 255).toString(16)) + _Color.padHex(Math.round(this.g * 255).toString(16)) + _Color.padHex(Math.round(this.b * 255).toString(16));
    if (this.a < 1) {
      hex += _Color.padHex(Math.round(this.a * 255).toString(16));
    }
    return hex;
  }
  toRgbaString(fractionDigits = 3) {
    const components = [Math.round(this.r * 255), Math.round(this.g * 255), Math.round(this.b * 255)];
    const k = Math.pow(10, fractionDigits);
    if (this.a !== 1) {
      components.push(Math.round(this.a * k) / k);
      return `rgba(${components.join(", ")})`;
    }
    return `rgb(${components.join(", ")})`;
  }
  toString() {
    if (this.a === 1) {
      return this.toHexString();
    }
    return this.toRgbaString();
  }
  toHSB() {
    return _Color.RGBtoHSB(this.r, this.g, this.b);
  }
  static RGBtoOKLCH(r, g, b) {
    const LSRGB0 = srgbToLinear(r);
    const LSRGB1 = srgbToLinear(g);
    const LSRGB2 = srgbToLinear(b);
    const LMS0 = Math.cbrt(0.4122214708 * LSRGB0 + 0.5363325363 * LSRGB1 + 0.0514459929 * LSRGB2);
    const LMS1 = Math.cbrt(0.2119034982 * LSRGB0 + 0.6806995451 * LSRGB1 + 0.1073969566 * LSRGB2);
    const LMS2 = Math.cbrt(0.0883024619 * LSRGB0 + 0.2817188376 * LSRGB1 + 0.6299787005 * LSRGB2);
    const OKLAB0 = 0.2104542553 * LMS0 + 0.793617785 * LMS1 - 0.0040720468 * LMS2;
    const OKLAB1 = 1.9779984951 * LMS0 - 2.428592205 * LMS1 + 0.4505937099 * LMS2;
    const OKLAB2 = 0.0259040371 * LMS0 + 0.7827717662 * LMS1 - 0.808675766 * LMS2;
    const hue = Math.atan2(OKLAB2, OKLAB1) * 180 / Math.PI;
    const OKLCH0 = OKLAB0;
    const OKLCH1 = Math.hypot(OKLAB1, OKLAB2);
    const OKLCH2 = hue >= 0 ? hue : hue + 360;
    return [OKLCH0, OKLCH1, OKLCH2];
  }
  static OKLCHtoRGB(l, c, h) {
    const OKLAB0 = l;
    const OKLAB1 = c * Math.cos(h * Math.PI / 180);
    const OKLAB2 = c * Math.sin(h * Math.PI / 180);
    const LMS0 = (OKLAB0 + 0.3963377774 * OKLAB1 + 0.2158037573 * OKLAB2) ** 3;
    const LMS1 = (OKLAB0 - 0.1055613458 * OKLAB1 - 0.0638541728 * OKLAB2) ** 3;
    const LMS2 = (OKLAB0 - 0.0894841775 * OKLAB1 - 1.291485548 * OKLAB2) ** 3;
    const LSRGB0 = 4.0767416621 * LMS0 - 3.3077115913 * LMS1 + 0.2309699292 * LMS2;
    const LSRGB1 = -1.2684380046 * LMS0 + 2.6097574011 * LMS1 - 0.3413193965 * LMS2;
    const LSRGB2 = -0.0041960863 * LMS0 - 0.7034186147 * LMS1 + 1.707614701 * LMS2;
    const SRGB0 = srgbFromLinear(LSRGB0);
    const SRGB1 = srgbFromLinear(LSRGB1);
    const SRGB2 = srgbFromLinear(LSRGB2);
    return [SRGB0, SRGB1, SRGB2];
  }
  static RGBtoHSL(r, g, b) {
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const l = (max + min) / 2;
    let h;
    let s;
    if (max === min) {
      h = 0;
      s = 0;
    } else {
      const delta3 = max - min;
      s = l > 0.5 ? delta3 / (2 - max - min) : delta3 / (max + min);
      if (max === r) {
        h = (g - b) / delta3 + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / delta3 + 2;
      } else {
        h = (r - g) / delta3 + 4;
      }
      h *= 360 / 6;
    }
    return [h, s, l];
  }
  static HSLtoRGB(h, s, l) {
    h = (h % 360 + 360) % 360;
    if (s === 0) {
      return [l, l, l];
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    function hueToRgb(t) {
      if (t < 0)
        t += 1;
      if (t > 1)
        t -= 1;
      if (t < 1 / 6)
        return p + (q - p) * 6 * t;
      if (t < 1 / 2)
        return q;
      if (t < 2 / 3)
        return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    const r = hueToRgb(h / 360 + 1 / 3);
    const g = hueToRgb(h / 360);
    const b = hueToRgb(h / 360 - 1 / 3);
    return [r, g, b];
  }
  /**
   * Converts the given RGB triple to an array of HSB (HSV) components.
   */
  static RGBtoHSB(r, g, b) {
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const S = max === 0 ? 0 : (max - min) / max;
    let H = 0;
    if (min !== max) {
      const delta3 = max - min;
      const rc = (max - r) / delta3;
      const gc = (max - g) / delta3;
      const bc = (max - b) / delta3;
      if (r === max) {
        H = bc - gc;
      } else if (g === max) {
        H = 2 + rc - bc;
      } else {
        H = 4 + gc - rc;
      }
      H /= 6;
      if (H < 0) {
        H = H + 1;
      }
    }
    return [H * 360, S, max];
  }
  /**
   * Converts the given HSB (HSV) triple to an array of RGB components.
   */
  static HSBtoRGB(H, S, B) {
    H = (H % 360 + 360) % 360 / 360;
    let r = 0;
    let g = 0;
    let b = 0;
    if (S === 0) {
      r = g = b = B;
    } else {
      const h = (H - Math.floor(H)) * 6;
      const f = h - Math.floor(h);
      const p = B * (1 - S);
      const q = B * (1 - S * f);
      const t = B * (1 - S * (1 - f));
      switch (Math.trunc(h)) {
        case 0:
          r = B;
          g = t;
          b = p;
          break;
        case 1:
          r = q;
          g = B;
          b = p;
          break;
        case 2:
          r = p;
          g = B;
          b = t;
          break;
        case 3:
          r = p;
          g = q;
          b = B;
          break;
        case 4:
          r = t;
          g = p;
          b = B;
          break;
        case 5:
          r = B;
          g = p;
          b = q;
          break;
      }
    }
    return [r, g, b];
  }
  static mix(c0, c1, t) {
    return new _Color(lerp(c0.r, c1.r, t), lerp(c0.g, c1.g, t), lerp(c0.b, c1.b, t), lerp(c0.a, c1.a, t));
  }
  static lighten(c, t) {
    const oklch = _Color.RGBtoOKLCH(c.r, c.g, c.b);
    return _Color.fromOKLCH(clamp(0, oklch[0] + t, 1), oklch[1], oklch[2]);
  }
  static darken(c, t) {
    const oklch = _Color.RGBtoOKLCH(c.r, c.g, c.b);
    return _Color.fromOKLCH(clamp(0, oklch[0] - t, 1), oklch[1], oklch[2]);
  }
  static interpolate(colors, count) {
    const step = 1 / (colors.length - 1);
    const oklchColors = colors.map((c) => _Color.RGBtoOKLCH(c.r, c.g, c.b));
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      const index = colors.length <= 2 ? 0 : Math.min(Math.floor(t * (colors.length - 1)), colors.length - 2);
      const q = (t - index * step) / step;
      const c0 = oklchColors[index];
      const c1 = oklchColors[index + 1];
      return _Color.fromOKLCH(lerp(c0[0], c1[0], q), lerp(c0[1], c1[1], q), lerp(c0[2], c1[2], q));
    });
  }
}; _c$1.nameToHex = /* @__PURE__ */ new Map([
  ["aliceblue", "#F0F8FF"],
  ["antiquewhite", "#FAEBD7"],
  ["aqua", "#00FFFF"],
  ["aquamarine", "#7FFFD4"],
  ["azure", "#F0FFFF"],
  ["beige", "#F5F5DC"],
  ["bisque", "#FFE4C4"],
  ["black", "#000000"],
  ["blanchedalmond", "#FFEBCD"],
  ["blue", "#0000FF"],
  ["blueviolet", "#8A2BE2"],
  ["brown", "#A52A2A"],
  ["burlywood", "#DEB887"],
  ["cadetblue", "#5F9EA0"],
  ["chartreuse", "#7FFF00"],
  ["chocolate", "#D2691E"],
  ["coral", "#FF7F50"],
  ["cornflowerblue", "#6495ED"],
  ["cornsilk", "#FFF8DC"],
  ["crimson", "#DC143C"],
  ["cyan", "#00FFFF"],
  ["darkblue", "#00008B"],
  ["darkcyan", "#008B8B"],
  ["darkgoldenrod", "#B8860B"],
  ["darkgray", "#A9A9A9"],
  ["darkgreen", "#006400"],
  ["darkgrey", "#A9A9A9"],
  ["darkkhaki", "#BDB76B"],
  ["darkmagenta", "#8B008B"],
  ["darkolivegreen", "#556B2F"],
  ["darkorange", "#FF8C00"],
  ["darkorchid", "#9932CC"],
  ["darkred", "#8B0000"],
  ["darksalmon", "#E9967A"],
  ["darkseagreen", "#8FBC8F"],
  ["darkslateblue", "#483D8B"],
  ["darkslategray", "#2F4F4F"],
  ["darkslategrey", "#2F4F4F"],
  ["darkturquoise", "#00CED1"],
  ["darkviolet", "#9400D3"],
  ["deeppink", "#FF1493"],
  ["deepskyblue", "#00BFFF"],
  ["dimgray", "#696969"],
  ["dimgrey", "#696969"],
  ["dodgerblue", "#1E90FF"],
  ["firebrick", "#B22222"],
  ["floralwhite", "#FFFAF0"],
  ["forestgreen", "#228B22"],
  ["fuchsia", "#FF00FF"],
  ["gainsboro", "#DCDCDC"],
  ["ghostwhite", "#F8F8FF"],
  ["gold", "#FFD700"],
  ["goldenrod", "#DAA520"],
  ["gray", "#808080"],
  ["green", "#008000"],
  ["greenyellow", "#ADFF2F"],
  ["grey", "#808080"],
  ["honeydew", "#F0FFF0"],
  ["hotpink", "#FF69B4"],
  ["indianred", "#CD5C5C"],
  ["indigo", "#4B0082"],
  ["ivory", "#FFFFF0"],
  ["khaki", "#F0E68C"],
  ["lavender", "#E6E6FA"],
  ["lavenderblush", "#FFF0F5"],
  ["lawngreen", "#7CFC00"],
  ["lemonchiffon", "#FFFACD"],
  ["lightblue", "#ADD8E6"],
  ["lightcoral", "#F08080"],
  ["lightcyan", "#E0FFFF"],
  ["lightgoldenrodyellow", "#FAFAD2"],
  ["lightgray", "#D3D3D3"],
  ["lightgreen", "#90EE90"],
  ["lightgrey", "#D3D3D3"],
  ["lightpink", "#FFB6C1"],
  ["lightsalmon", "#FFA07A"],
  ["lightseagreen", "#20B2AA"],
  ["lightskyblue", "#87CEFA"],
  ["lightslategray", "#778899"],
  ["lightslategrey", "#778899"],
  ["lightsteelblue", "#B0C4DE"],
  ["lightyellow", "#FFFFE0"],
  ["lime", "#00FF00"],
  ["limegreen", "#32CD32"],
  ["linen", "#FAF0E6"],
  ["magenta", "#FF00FF"],
  ["maroon", "#800000"],
  ["mediumaquamarine", "#66CDAA"],
  ["mediumblue", "#0000CD"],
  ["mediumorchid", "#BA55D3"],
  ["mediumpurple", "#9370DB"],
  ["mediumseagreen", "#3CB371"],
  ["mediumslateblue", "#7B68EE"],
  ["mediumspringgreen", "#00FA9A"],
  ["mediumturquoise", "#48D1CC"],
  ["mediumvioletred", "#C71585"],
  ["midnightblue", "#191970"],
  ["mintcream", "#F5FFFA"],
  ["mistyrose", "#FFE4E1"],
  ["moccasin", "#FFE4B5"],
  ["navajowhite", "#FFDEAD"],
  ["navy", "#000080"],
  ["oldlace", "#FDF5E6"],
  ["olive", "#808000"],
  ["olivedrab", "#6B8E23"],
  ["orange", "#FFA500"],
  ["orangered", "#FF4500"],
  ["orchid", "#DA70D6"],
  ["palegoldenrod", "#EEE8AA"],
  ["palegreen", "#98FB98"],
  ["paleturquoise", "#AFEEEE"],
  ["palevioletred", "#DB7093"],
  ["papayawhip", "#FFEFD5"],
  ["peachpuff", "#FFDAB9"],
  ["peru", "#CD853F"],
  ["pink", "#FFC0CB"],
  ["plum", "#DDA0DD"],
  ["powderblue", "#B0E0E6"],
  ["purple", "#800080"],
  ["rebeccapurple", "#663399"],
  ["red", "#FF0000"],
  ["rosybrown", "#BC8F8F"],
  ["royalblue", "#4169E1"],
  ["saddlebrown", "#8B4513"],
  ["salmon", "#FA8072"],
  ["sandybrown", "#F4A460"],
  ["seagreen", "#2E8B57"],
  ["seashell", "#FFF5EE"],
  ["sienna", "#A0522D"],
  ["silver", "#C0C0C0"],
  ["skyblue", "#87CEEB"],
  ["slateblue", "#6A5ACD"],
  ["slategray", "#708090"],
  ["slategrey", "#708090"],
  ["snow", "#FFFAFA"],
  ["springgreen", "#00FF7F"],
  ["steelblue", "#4682B4"],
  ["tan", "#D2B48C"],
  ["teal", "#008080"],
  ["thistle", "#D8BFD8"],
  ["tomato", "#FF6347"],
  ["transparent", "#00000000"],
  ["turquoise", "#40E0D0"],
  ["violet", "#EE82EE"],
  ["wheat", "#F5DEB3"],
  ["white", "#FFFFFF"],
  ["whitesmoke", "#F5F5F5"],
  ["yellow", "#FFFF00"],
  ["yellowgreen", "#9ACD32"]
]); return _c$1; })()
var Color = _Color;

// packages/ag-charts-core/src/data/typeGuards.ts
function isDefined(val) {
  return val != null;
}
function isArray(value) {
  return Array.isArray(value);
}
function isBoolean(value) {
  return typeof value === "boolean";
}
function isDate(value) {
  return value instanceof Date;
}
function isValidDate(value) {
  return isDate(value) && !Number.isNaN(Number(value));
}
function isRegExp(value) {
  return value instanceof RegExp;
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return typeof value === "object" && value !== null && !isArray(value);
}
function isObjectLike(value) {
  return isArray(value) || isPlainObject(value);
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && value.constructor?.name === "Object";
}
function isEmptyObject(value) {
  if (typeof value !== "object" || value === null)
    return false;
  for (const _ in value) {
    return false;
  }
  return true;
}
function isString(value) {
  return typeof value === "string";
}
function isNumber(value) {
  return typeof value === "number";
}
function isFiniteNumber(value) {
  return Number.isFinite(value);
}
function isBigInt(value) {
  return typeof value === "bigint";
}
function isNumericValue(value) {
  return typeof value === "number" || typeof value === "bigint";
}
function isFiniteNumericValue(value) {
  return typeof value === "bigint" || Number.isFinite(value);
}
function isHtmlElement(value) {
  return value != null && value.nodeType === 1 && "style" in value;
}
function isEnumKey(enumObject, enumKey) {
  return isString(enumKey) && Object.keys(enumObject).includes(enumKey);
}
function isEnumValue(enumObject, enumValue) {
  return Object.values(enumObject).includes(enumValue);
}
function isSymbol(value) {
  return typeof value === "symbol";
}
function isColor(value) {
  return isString(value) && (value === "none" || !isUnsupportedColorFormat(value) && parseColor(value) != null);
}
function isKeyOf(value, container) {
  return value in container;
}

// packages/ag-charts-core/src/state/memento.ts
var MementoCaretaker = class _MementoCaretaker {
  constructor(version) {
    this.version = version.split("-")[0];
  }
  save(...originators) {
    const packet = { version: this.version };
    for (const originator of Object.values(originators)) {
      packet[originator.mementoOriginatorKey] = this.encode(originator, originator.createMemento());
    }
    return packet;
  }
  restore(logger, blob, ...originators) {
    if (!isObject(blob)) {
      const blobType = blob === null ? "null" : typeof blob;
      logger.warnOnce(`Could not restore data of type [${blobType}], expecting an object, ignoring.`);
      return;
    }
    if (!("version" in blob) || typeof blob.version !== "string") {
      logger.warnOnce(`Could not restore data, missing [version] string in object, ignoring.`);
      return;
    }
    for (const originator of originators) {
      const memento = this.decode(originator, blob[originator.mementoOriginatorKey]);
      const messages = [];
      if (!originator.guardMemento(memento, messages)) {
        let messagesString = `Could not restore [${originator.mementoOriginatorKey}] data, value was invalid, ignoring.`;
        if (messages.length > 0) {
          messagesString += `

${messages.join("\n\n")}

`;
        }
        logger.warnOnce(messagesString, memento);
        return;
      }
      originator.restoreMemento(this.version, blob.version, memento);
    }
  }
  /**
   * Encode a memento as a serializable object, encoding any non-serializble types.
   */
  encode(originator, memento) {
    try {
      return JSON.parse(JSON.stringify(memento, _MementoCaretaker.encodeTypes));
    } catch (error2) {
      throw new Error(`Failed to encode [${originator.mementoOriginatorKey}] value [${error2}].`, {
        cause: error2
      });
    }
  }
  /**
   * Decode an encoded memento, decoding any non-serializable types.
   */
  decode(originator, encoded) {
    if (encoded == null)
      return encoded;
    try {
      return JSON.parse(JSON.stringify(encoded), _MementoCaretaker.decodeTypes);
    } catch (error2) {
      throw new Error(`Failed to decode [${originator.mementoOriginatorKey}] value [${error2}].`, {
        cause: error2
      });
    }
  }
  static encodeTypes(key, value) {
    if (isDate(this[key])) {
      return { __type: "date", value: this[key].toISOString() };
    }
    if (typeof this[key] === "bigint") {
      return { __type: "bigint", value: this[key].toString() };
    }
    return value;
  }
  static decodeTypes(key, value) {
    if (isObject(this[key]) && "__type" in this[key]) {
      if (this[key].__type === "date") {
        return new Date(this[key].value);
      }
      if (this[key].__type === "bigint") {
        const bigintValue = this[key].value;
        if (typeof bigintValue === "string" && /^-?\d+$/.test(bigintValue)) {
          return BigInt(bigintValue);
        }
      }
    }
    return value;
  }
};

// packages/ag-charts-core/src/state/memo.ts
var memorizedFns = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
function memo(params, fnGenerator) {
  const serialisedParams = JSON.stringify(params, null, 0);
  if (!memorizedFns.has(fnGenerator)) {
    memorizedFns.set(fnGenerator, /* @__PURE__ */ new Map());
  }
  if (!memorizedFns.get(fnGenerator)?.has(serialisedParams)) {
    memorizedFns.get(fnGenerator)?.set(serialisedParams, fnGenerator(params));
  }
  return memorizedFns.get(fnGenerator)?.get(serialisedParams);
}
var MemoizeNode = class {
  constructor() {
    this.weak = /* @__PURE__ */ new WeakMap();
    this.strong = /* @__PURE__ */ new Map();
    this.set = false;
    this.value = void 0;
  }
};
function simpleMemorize2(fn, cacheCallback) {
  let root = new MemoizeNode();
  const memoised = (...p) => {
    let current = root;
    for (const param of p) {
      const target = typeof param === "object" || typeof param === "symbol" ? current.weak : current.strong;
      let next = target.get(param);
      if (next == null) {
        next = new MemoizeNode();
        target.set(param, next);
      }
      current = next;
    }
    if (current.set) {
      cacheCallback?.("hit", fn, p);
      return current.value;
    } else {
      const out = fn(...p);
      current.set = true;
      current.value = out;
      cacheCallback?.("miss", fn, p);
      return out;
    }
  };
  memoised.reset = () => {
    root = new MemoizeNode();
  };
  return memoised;
}
function simpleMemorize(fn, cacheCallback) {
  const primitiveCache = /* @__PURE__ */ new Map();
  const paramsToKeys = (...params) => {
    return params.map((v) => {
      if (typeof v === "object")
        return v;
      if (typeof v === "symbol")
        return v;
      if (!primitiveCache.has(v)) {
        primitiveCache.set(v, { v });
      }
      return primitiveCache.get(v);
    });
  };
  const empty = {};
  const cache = /* @__PURE__ */ new WeakMap();
  return (...p) => {
    const keys = p.length === 0 ? [empty] : paramsToKeys(...p);
    let currentCache = cache;
    for (const key of keys.slice(0, -1)) {
      if (!currentCache.has(key)) {
        currentCache.set(key, /* @__PURE__ */ new WeakMap());
      }
      currentCache = currentCache.get(key);
    }
    const finalKey = keys.at(-1);
    let cachedValue = currentCache.get(finalKey);
    if (cachedValue) {
      cacheCallback?.("hit", fn, p);
    } else {
      cachedValue = fn(...p);
      currentCache.set(finalKey, cachedValue);
      cacheCallback?.("miss", fn, p);
    }
    return cachedValue;
  };
}

// packages/ag-charts-core/src/state/reactiveState.ts
function getNestedValue(value, subPath) {
  let current = value;
  for (const key of subPath) {
    if (current == null || typeof current !== "object")
      return;
    current = current[key];
  }
  return current;
}
var ReactiveState = class {
  constructor() {
    this.dirtyKeys = /* @__PURE__ */ new Set();
    this.stateMap = /* @__PURE__ */ new Map();
    this.isFlushing = false;
  }
  getState(key) {
    let keyState = this.stateMap.get(key);
    if (!keyState) {
      keyState = { value: void 0, flushedValue: void 0, observers: /* @__PURE__ */ new Map() };
      this.stateMap.set(key, keyState);
    }
    return keyState;
  }
  /**
   * Registers an observer notified when any of its accessed state keys change.
   *
   * Dependencies are captured once during the initial synchronous call to `callback` and are
   * not re-tracked thereafter. The observer will only be notified for keys accessed during
   * that first invocation. To change the set of tracked keys, unsubscribe and re-observe.
   *
   * When a nested path is accessed via `get(key, subPath)`, the observer is only notified
   * if the value at that specific nested path is changed by reference.
   *
   * @param callback The observer function that receives a `valueGetter` to read state.
   * @returns A function to unsubscribe the observer.
   */
  observe(callback2) {
    const observeKeys = /* @__PURE__ */ new Map();
    const getter = (key, path = "") => {
      let paths = observeKeys.get(key);
      if (paths == null) {
        paths = /* @__PURE__ */ new Set();
        observeKeys.set(key, paths);
      }
      paths.add(path);
      return path.length === 0 ? this.getValue(key) : getNestedValue(this.stateMap.get(key)?.value, path.split("."));
    };
    callback2(getter);
    for (const [key, paths] of observeKeys) {
      this.getState(key).observers.set(callback2, paths);
    }
    return () => {
      for (const key of observeKeys.keys()) {
        this.stateMap.get(key)?.observers.delete(callback2);
      }
    };
  }
  getValue(key, subPath = "") {
    const value = this.stateMap.get(key)?.value;
    return subPath.length === 0 ? value : getNestedValue(value, subPath.split("."));
  }
  setValue(key, value) {
    this.getState(key).value = value;
    this.dirtyKeys.add(key);
  }
  flushChanges(key) {
    if (this.isFlushing)
      return;
    this.isFlushing = true;
    try {
      const valueGetter = this.getValue.bind(this);
      let snapshotKeys;
      if (key == null) {
        snapshotKeys = new Set(this.dirtyKeys);
        this.dirtyKeys.clear();
      } else {
        snapshotKeys = new Set(this.dirtyKeys.has(key) ? [key] : []);
        this.dirtyKeys.delete(key);
      }
      for (const observer of this.collectObservers(snapshotKeys)) {
        observer(valueGetter);
      }
    } finally {
      this.isFlushing = false;
    }
  }
  destroy() {
    for (const { observers } of this.stateMap.values()) {
      observers.clear();
    }
    this.dirtyKeys.clear();
    this.stateMap.clear();
  }
  collectObservers(snapshotKeys) {
    const stateObservers = /* @__PURE__ */ new Set();
    for (const key of snapshotKeys) {
      const keyState = this.getState(key);
      const { flushedValue: oldValue, value: newValue } = keyState;
      if (oldValue === newValue)
        continue;
      keyState.flushedValue = newValue;
      for (const [observer, subPaths] of keyState.observers) {
        if (subPaths.size === 0 || subPaths.has("")) {
          stateObservers.add(observer);
          continue;
        }
        for (const subPath of subPaths) {
          const subPathParts = subPath.split(".");
          if (getNestedValue(oldValue, subPathParts) !== getNestedValue(newValue, subPathParts)) {
            stateObservers.add(observer);
            break;
          }
        }
      }
    }
    return stateObservers;
  }
};

// packages/ag-charts-core/src/state/stateMachine.ts
var debugColor = "color: green";
var debugQuietColor = "color: grey";
function applyProperties(parentState, childState) {
  const parentProperties = parentState.inheritedProperties();
  for (const property of childState.inheritedProperties()) {
    if (parentProperties.includes(property)) {
      childState[property] = parentState[property] ?? null;
    }
  }
}
var AbstractStateMachine = class {
  /** Fields copied from the parent before each transition is forwarded to a child; an override replaces the list. */
  inheritedProperties() {
    return [];
  }
  transitionRoot(event, data) {
    if (this.parent) {
      this.parent.transitionRoot(event, data);
    } else {
      this.transition(event, data);
    }
  }
};
var _StateMachine = /*#__PURE__*/ (() => { var _c$2 = class _StateMachine extends AbstractStateMachine {
  constructor(defaultState, states, enterEach) {
    super();
    this.defaultState = defaultState;
    this.states = states;
    this.enterEach = enterEach;
    this.debug = create(true, "animation");
    this.state = defaultState;
    this.debug(`%c${this.constructor.name} | init -> ${defaultState}`, debugColor);
  }
  // TODO: handle events which do not require data without requiring `undefined` to be passed as as parameter, while
  // also still requiring data to be passed to those events which do require it.
  transition(event, data) {
    const shouldTransitionSelf = this.transitionChild(event, data);
    if (!shouldTransitionSelf || this.state === _StateMachine.child || this.state === _StateMachine.parent) {
      return;
    }
    const currentState = this.state;
    const currentStateConfig = this.states[this.state];
    let destination = currentStateConfig[event];
    const debugPrefix = `%c${this.constructor.name} | ${this.state} -> ${event} ->`;
    if (Array.isArray(destination)) {
      destination = destination.find((transition) => {
        if (!transition.guard)
          return true;
        const valid = transition.guard(data);
        if (!valid) {
          this.debug(`${debugPrefix} (guarded)`, transition.target, debugQuietColor);
        }
        return valid;
      });
    } else if (typeof destination === "object" && !(destination instanceof _StateMachine) && destination.guard && !destination.guard(data)) {
      this.debug(`${debugPrefix} (guarded)`, destination.target, debugQuietColor);
      return;
    }
    if (destination == null) {
      this.debug(`${debugPrefix} ${this.state}`, debugQuietColor);
      return;
    }
    const destinationState = this.getDestinationState(destination);
    const exitFn = destinationState === this.state ? void 0 : currentStateConfig.onExit;
    this.debug(`${debugPrefix} ${destinationState}`, debugColor);
    this.state = destinationState;
    if (typeof destination === "function") {
      destination(data);
    } else if (typeof destination === "object" && !(destination instanceof _StateMachine)) {
      destination.action?.(data);
    }
    exitFn?.();
    this.enterEach?.(currentState, destinationState);
    if (destinationState !== currentState && destinationState !== _StateMachine.child && destinationState !== _StateMachine.parent) {
      this.states[destinationState].onEnter?.(currentState, data);
    }
  }
  transitionAsync(event, data) {
    setTimeout(() => {
      this.transition(event, data);
    }, 0);
  }
  is(value) {
    if (this.state === _StateMachine.child && this.childState) {
      return this.childState.is(value);
    }
    return this.state === value;
  }
  resetHierarchy() {
    this.debug(
      `%c${this.constructor.name} | ${this.state} -> [resetHierarchy] -> ${this.defaultState}`,
      "color: green"
    );
    this.state = this.defaultState;
  }
  transitionChild(event, data) {
    if (this.state !== _StateMachine.child || !this.childState)
      return true;
    applyProperties(this, this.childState);
    this.childState.transition(event, data);
    if (!this.childState.is(_StateMachine.parent))
      return true;
    this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${this.defaultState}`, debugColor);
    this.state = this.defaultState;
    this.states[this.state].onEnter?.();
    this.childState.resetHierarchy();
    return false;
  }
  getDestinationState(destination) {
    let state2 = this.state;
    if (typeof destination === "string") {
      state2 = destination;
    } else if (destination instanceof _StateMachine) {
      this.childState = destination;
      this.childState.parent = this;
      state2 = _StateMachine.child;
    } else if (typeof destination === "object") {
      if (destination.target instanceof _StateMachine) {
        this.childState = destination.target;
        this.childState.parent = this;
        state2 = _StateMachine.child;
      } else if (destination.target != null) {
        state2 = destination.target;
      }
    }
    return state2;
  }
}; _c$2.child = "__child"; _c$2.parent = "__parent"; return _c$2; })()
var StateMachine = _StateMachine;
var ParallelStateMachine = class extends AbstractStateMachine {
  constructor(...stateMachines) {
    super();
    this.stateMachines = stateMachines;
    for (const stateMachine of stateMachines) {
      stateMachine.parent = this;
    }
  }
  transition(event, data) {
    for (const stateMachine of this.stateMachines) {
      applyProperties(this, stateMachine);
      stateMachine.transition(event, data);
    }
  }
  transitionAsync(event, data) {
    for (const stateMachine of this.stateMachines) {
      applyProperties(this, stateMachine);
      stateMachine.transitionAsync(event, data);
    }
  }
};

// packages/ag-charts-core/src/async/async.ts
var AsyncAwaitQueue = class {
  constructor() {
    this.queue = [];
  }
  /** Await another async process to call notify(). */
  waitForCompletion(timeout = 50) {
    const queue = this.queue;
    function createCompletionPromise(resolve) {
      function successFn() {
        clearTimeout(timeoutHandle);
        resolve(true);
      }
      function timeoutFn() {
        const queueIndex = queue.indexOf(successFn);
        if (queueIndex < 0)
          return;
        queue.splice(queueIndex, 1);
        resolve(false);
      }
      const timeoutHandle = setTimeout(timeoutFn, timeout);
      queue.push(successFn);
    }
    return new Promise(createCompletionPromise);
  }
  /** Trigger any await()ing async processes to continue. */
  notify() {
    for (const cb of this.queue.splice(0)) {
      cb();
    }
  }
};
function pause(delayMilliseconds = 0) {
  function resolveAfterDelay(resolve) {
    setTimeout(resolve, delayMilliseconds);
  }
  return new Promise(resolveAfterDelay);
}
async function withTimeout(promise, timeoutMs, errorMessage = `Timeout after ${timeoutMs}ms`) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

// packages/ag-charts-core/src/async/deferredExecutor.ts
var DeferredExecutor = class {
  constructor(options) {
    this.minimumDelay = options?.minimumDelay ?? 50;
    this.timeout = options?.timeout ?? 100;
  }
  /**
   * Schedule a computation for deferred execution.
   * If something is already pending, it will be cancelled first.
   */
  schedule(computation, onComplete) {
    this.cancel();
    this.pending = { computation, onComplete };
    if (this.minimumDelay > 0) {
      this.delayTimeoutId = setTimeout(() => {
        this.delayTimeoutId = void 0;
        this.scheduleIdleCallback();
      }, this.minimumDelay);
    } else {
      this.scheduleIdleCallback();
    }
  }
  /**
   * Force immediate execution if pending.
   * @returns The computation result, or undefined if nothing was pending.
   */
  demand() {
    if (!this.pending) {
      return void 0;
    }
    this.cancelScheduled();
    return this.execute();
  }
  /**
   * Cancel any pending execution without running it.
   */
  cancel() {
    this.cancelScheduled();
    this.pending = void 0;
  }
  /**
   * Check if there's pending work.
   */
  isPending() {
    return this.pending != null;
  }
  scheduleIdleCallback() {
    const remainingTimeout = Math.max(0, this.timeout - this.minimumDelay);
    if (typeof requestIdleCallback === "function") {
      this.idleCallbackId = requestIdleCallback(this.execute.bind(this), { timeout: remainingTimeout });
    } else {
      this.idleCallbackId = setTimeout(() => this.execute(), remainingTimeout);
    }
  }
  cancelScheduled() {
    if (this.delayTimeoutId != null) {
      clearTimeout(this.delayTimeoutId);
      this.delayTimeoutId = void 0;
    }
    if (this.idleCallbackId == null)
      return;
    if (typeof cancelIdleCallback === "function") {
      cancelIdleCallback(this.idleCallbackId);
    } else {
      clearTimeout(this.idleCallbackId);
    }
    this.idleCallbackId = void 0;
  }
  execute() {
    const { pending } = this;
    if (!pending)
      return;
    this.pending = void 0;
    this.delayTimeoutId = void 0;
    this.idleCallbackId = void 0;
    const result = pending.computation();
    pending.onComplete(result);
    return result;
  }
};

// packages/ag-charts-core/src/async/functions.ts
function debounce(callback2, waitMs = 0, options) {
  const { leading = false, trailing = true, maxWait = Infinity } = options ?? {};
  let timerId;
  let startTime;
  if (maxWait < waitMs) {
    throw new Error("Value of maxWait cannot be lower than waitMs.");
  }
  function debounceCallback(...args) {
    if (leading && startTime == null) {
      startTime = Date.now();
      timerId = setTimeout(() => startTime = null, waitMs);
      callback2(...args);
      return;
    }
    let adjustedWaitMs = waitMs;
    if (maxWait !== Infinity && startTime != null) {
      const elapsedTime = Date.now() - startTime;
      if (waitMs > maxWait - elapsedTime) {
        adjustedWaitMs = maxWait - elapsedTime;
      }
    }
    clearTimeout(timerId);
    startTime ?? (startTime = Date.now());
    timerId = setTimeout(() => {
      startTime = null;
      if (trailing) {
        callback2(...args);
      }
    }, adjustedWaitMs);
  }
  return Object.assign(debounceCallback, {
    cancel() {
      clearTimeout(timerId);
      startTime = null;
    }
  });
}
function throttle(callback2, waitMs, options) {
  const { leading = true, trailing = true } = options ?? {};
  let timerId;
  let lastArgs;
  let shouldWait = false;
  function timeoutHandler() {
    if (trailing && lastArgs) {
      timerId = setTimeout(timeoutHandler, waitMs);
      callback2(...lastArgs);
    } else {
      shouldWait = false;
    }
    lastArgs = null;
  }
  function throttleCallback(...args) {
    if (shouldWait) {
      lastArgs = args;
    } else {
      shouldWait = true;
      timerId = setTimeout(timeoutHandler, waitMs);
      if (leading) {
        callback2(...args);
      } else {
        lastArgs = args;
      }
    }
  }
  return Object.assign(throttleCallback, {
    cancel() {
      clearTimeout(timerId);
      shouldWait = false;
      lastArgs = null;
    }
  });
}
function safeCall(callback2, args, logger, errorPath = "") {
  try {
    return callback2(...args);
  } catch (error2) {
    const postfix = errorPath === "" ? "" : ` \`${errorPath}\``;
    logger?.warnOnce(`Uncaught exception in user callback${postfix}`, error2);
  }
}

// packages/ag-charts-core/src/async/mutex.ts
var Mutex = class {
  constructor() {
    this.available = true;
    this.acquireQueue = [];
  }
  acquire(cb) {
    return new Promise((resolve, reject) => {
      this.acquireQueue.push([cb, resolve, reject]);
      if (this.available) {
        this.dispatchNext().catch(reject);
      }
    });
  }
  async acquireImmediately(cb) {
    if (!this.available) {
      return false;
    }
    await this.acquire(cb);
    return true;
  }
  async waitForClearAcquireQueue() {
    return this.acquire(() => Promise.resolve(void 0));
  }
  async dispatchNext() {
    this.available = false;
    let [next, done, reject] = this.acquireQueue.shift() ?? [];
    while (next) {
      try {
        await next();
        done?.();
      } catch (error2) {
        reject?.(error2);
      }
      [next, done, reject] = this.acquireQueue.shift() ?? [];
    }
    this.available = true;
  }
};

// packages/ag-charts-core/src/modules/baseManager.ts
var BaseManager = class {
  constructor() {
    this.cleanup = new CleanupRegistry();
    this.destroyed = false;
  }
  destroy() {
    this.cleanup.flush();
    this.destroyed = true;
  }
};

// packages/ag-charts-core/src/modules/dynamicContext.ts
function asDynamicContext(impl) {
  return impl;
}
var state = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
function internal(impl) {
  const s = state.get(impl);
  if (!s)
    throw new Error("AG Charts - DynamicContext: missing internal state.");
  return s;
}
var DynamicContextImpl = class _DynamicContextImpl {
  constructor(parent) {
    const s = {
      cleanup: new CleanupRegistry(),
      self: asDynamicContext(this),
      resolving: /* @__PURE__ */ new Set(),
      children: /* @__PURE__ */ new Set(),
      refs: /* @__PURE__ */ new Set(),
      parent,
      destroyed: false
    };
    state.set(this, s);
    if (parent) {
      internal(parent).children.add(this);
    }
  }
  get cleanup() {
    return internal(this).cleanup;
  }
  constant(name, value) {
    this.assertNotDestroyed();
    Object.defineProperty(this, name, { value, configurable: true, enumerable: true });
    return internal(this).self;
  }
  ref(name, value) {
    this.assertNotDestroyed();
    const s = internal(this);
    s.refs.add(name);
    Object.defineProperty(this, name, { value, configurable: true, enumerable: true });
    return s.self;
  }
  service(name, fn) {
    this.assertNotDestroyed();
    Object.defineProperty(this, name, {
      configurable: true,
      enumerable: true,
      get: () => {
        const value = this.resolve(name, fn);
        Object.defineProperty(this, name, { value, configurable: true, enumerable: true });
        return value;
      }
    });
    return internal(this).self;
  }
  factory(name, fn) {
    this.assertNotDestroyed();
    Object.defineProperty(this, name, {
      configurable: true,
      enumerable: true,
      get: () => this.resolve(name, fn)
    });
    return internal(this).self;
  }
  has(name) {
    return name in this;
  }
  child() {
    const c = new _DynamicContextImpl(this);
    Object.setPrototypeOf(c, this);
    return asDynamicContext(c);
  }
  destroy() {
    const s = internal(this);
    if (s.destroyed)
      return;
    s.destroyed = true;
    for (const c of s.children) {
      c.destroy();
    }
    s.children.clear();
    const keys = Object.keys(this);
    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i];
      if (s.refs.has(key))
        continue;
      const descriptor = Object.getOwnPropertyDescriptor(this, key);
      if (descriptor?.value != null && typeof descriptor.value === "object") {
        descriptor.value.destroy?.();
      }
    }
    s.cleanup.flush();
    if (s.parent) {
      internal(s.parent).children.delete(this);
    }
  }
  resolve(name, fn) {
    const s = internal(this);
    if (s.destroyed) {
      throw new Error(`AG Charts - DynamicContext: cannot resolve '${name}' on a destroyed context.`);
    }
    if (s.resolving.has(name)) {
      throw new Error(`AG Charts - DynamicContext: circular dependency detected while resolving '${name}'.`);
    }
    s.resolving.add(name);
    try {
      return fn(s.self);
    } finally {
      s.resolving.delete(name);
    }
  }
  assertNotDestroyed() {
    if (internal(this).destroyed) {
      throw new Error("AG Charts - DynamicContext: cannot register on a destroyed context.");
    }
  }
};
function createDynamicContext() {
  return asDynamicContext(new DynamicContextImpl());
}

// packages/ag-charts-core/src/modules/enterpriseRegistry.ts
var enterpriseRegistry = {};

// packages/ag-charts-core/src/modules/moduleDefinition.ts
var ModuleType = /* @__PURE__ */ /*#__PURE__*/ ((ModuleType2) => {
  ModuleType2["Chart"] = "chart";
  ModuleType2["Axis"] = "axis";
  ModuleType2["Series"] = "series";
  ModuleType2["Plugin"] = "plugin";
  ModuleType2["AxisPlugin"] = "axis:plugin";
  ModuleType2["SeriesPlugin"] = "series:plugin";
  ModuleType2["Preset"] = "preset";
  return ModuleType2;
})(ModuleType || {});

// packages/ag-charts-core/src/modules/moduleInstance.ts
var AbstractModuleInstance = class {
  constructor() {
    this.cleanup = new CleanupRegistry();
  }
  destroy() {
    this.cleanup.flush();
  }
};

// packages/ag-charts-core/src/modules/moduleRegistry.ts
var moduleRegistry_exports = {};
__export(moduleRegistry_exports, {
  ModuleScope: () => ModuleScope,
  RegistryMode: () => RegistryMode,
  clearRegistryModes: () => clearRegistryModes,
  getAxisModule: () => getAxisModule,
  getChartModule: () => getChartModule,
  getModuleScopeKey: () => getModuleScopeKey,
  getPresetModule: () => getPresetModule,
  getSeriesModule: () => getSeriesModule,
  hasModule: () => hasModule,
  ifRegistryChanged: () => ifRegistryChanged,
  isEnterprise: () => isEnterprise,
  isGlobalScope: () => isGlobalScope,
  isIntegrated: () => isIntegrated,
  isModuleType: () => isModuleType,
  isUmd: () => isUmd,
  listModules: () => listModules,
  listModulesByType: () => listModulesByType,
  register: () => register,
  registerModules: () => registerModules,
  reset: () => reset2,
  resolveModuleScope: () => resolveModuleScope,
  setRegistryMode: () => setRegistryMode
});

// packages/ag-charts-core/src/text/textUtil.ts
var CSS_GENERIC_FAMILIES = /* @__PURE__ */ /*#__PURE__*/ new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong"
]);
var quotedFontFamilyCache = /* @__PURE__ */ /*#__PURE__*/ new Map();
var MAX_QUOTED_FONT_FAMILY_ENTRIES = 256;
function quoteFontFamily(fontFamily) {
  if (fontFamily == null || fontFamily === "")
    return "";
  const cached = quotedFontFamilyCache.get(fontFamily);
  if (cached !== void 0)
    return cached;
  const quoted = fontFamily.split(",").map((part) => {
    const trimmed = part.trim();
    if (trimmed === "")
      return trimmed;
    if (trimmed.startsWith('"') || trimmed.startsWith("'"))
      return trimmed;
    if (CSS_GENERIC_FAMILIES.has(trimmed))
      return trimmed;
    if (/\s/.test(trimmed))
      return `"${trimmed}"`;
    return trimmed;
  }).join(", ");
  if (quotedFontFamilyCache.size >= MAX_QUOTED_FONT_FAMILY_ENTRIES)
    quotedFontFamilyCache.clear();
  quotedFontFamilyCache.set(fontFamily, quoted);
  return quoted;
}
function toFontString({ fontSize, fontStyle, fontWeight: fontWeight2, fontFamily }) {
  let fontString = "";
  if (fontStyle != null && fontStyle !== "normal") {
    fontString += `${fontStyle} `;
  }
  if (fontWeight2 != null && fontWeight2 !== "normal" && fontWeight2 !== 400) {
    fontString += `${fontWeight2 === 700 ? "bold" : fontWeight2} `;
  }
  fontString += `${fontSize}px`;
  fontString += ` ${quoteFontFamily(fontFamily)}`;
  return fontString;
}
function toTextString(value) {
  return String(value ?? "");
}
function coerceTextValue(value) {
  if (isNumber(value) || isDate(value))
    return toTextString(value);
  return value;
}
function appendEllipsis(text) {
  return preserveArabicJoining(text.replace(TrimCharsRegex, "")) + EllipsisChar;
}
var RIGHT_JOIN_ONLY = /* @__PURE__ */ /*#__PURE__*/ new Set([
  1575,
  // Alef ا
  1577,
  // Teh Marbuta ة
  1583,
  // Dal د
  1584,
  // Thal ذ
  1585,
  // Ra ر
  1586,
  // Zain ز
  1608
  // Waw و
]);
function isDualJoiningArabic(code) {
  return code >= 1568 && code <= 1610 && !RIGHT_JOIN_ONLY.has(code);
}
function preserveArabicJoining(text) {
  if (text === "")
    return text;
  const lastCode = text.codePointAt(text.length - 1);
  if (isDualJoiningArabic(lastCode)) {
    return text + "\u200D";
  }
  return text;
}
var StrongRtlRegex = /[\u0590-\u065F\u066D-\u06EF\u06FA-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u200F\u202B\u202E\u2067]/u;
var StrongLtrRegex = /[\p{L}\u200E\u202A\u202D\u2066]/u;
function isDirectionNeutral(text) {
  return !StrongRtlRegex.test(text) && !StrongLtrRegex.test(text);
}
var DigitRegex = /\p{Nd}/u;
var NumberSign = /[+\-\u2212]\s?/u;
var NumberPrefix = /\p{Sc}\s?/u;
var NumberBody = /\p{Nd}+(?:[.,:'\u2019/\u066B\u066C\u00A0\u202F]\p{Nd}+)*(?:[eE][+\-\u2212]?\p{Nd}+)?/u;
var NumberSuffix = /[%\u066A\u2030\u00B0]|\p{Sc}/u;
var NumberUnit = /[A-Za-z\u00B5\u03BC]+/u;
var NumberRange = /\s?[-\u2012-\u2015\u2212]\s?/u;
var NumberValue = `(?:${NumberPrefix.source})?${NumberBody.source}(?:${NumberSuffix.source})?(?:${NumberUnit.source})?`;
var NumberRunRegex = /*#__PURE__*/ new RegExp(
  `(?:${NumberSign.source})?${NumberValue}(?:${NumberRange.source}${NumberValue})*`,
  "gu"
);
function followsLtrText(text, offset) {
  for (let i = offset - 1; i >= 0; i -= 1) {
    const char = text[i];
    if (StrongRtlRegex.test(char)) {
      return false;
    }
    if (StrongLtrRegex.test(char)) {
      return true;
    }
  }
  return false;
}
function forceLtrNumbers(text) {
  if (!DigitRegex.test(text))
    return text;
  return text.replace(
    NumberRunRegex,
    (run, offset) => followsLtrText(text, offset) ? run : LtrEmbedding + run + PopDirectionalFormatting
  );
}
function forceLtrNumbersIn(text, paragraphIsRtl) {
  return paragraphIsRtl || StrongRtlRegex.test(text) ? forceLtrNumbers(text) : text;
}
function guardTextEdges(str) {
  return TrimEdgeGuard + str + TrimEdgeGuard;
}
function unguardTextEdges(str) {
  return str.replaceAll(TrimEdgeGuard, "");
}
function isTruncated(value) {
  return isArray(value) ? isSegmentTruncated(value.at(-1)) : isTextTruncated(toTextString(value));
}
function isTextTruncated(str) {
  return str.endsWith(EllipsisChar);
}
function isSegmentTruncated(segment) {
  if (!segment || segment.type === "image")
    return false;
  return toTextString(segment.text).endsWith(EllipsisChar);
}
var graphemeSegmenter = /*#__PURE__*/ (() => (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function" ? new Intl.Segmenter(void 0, { granularity: "grapheme" }) : void 0))();
function isPrintableAscii(text) {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 32 || code > 126)
      return false;
  }
  return true;
}
function graphemeSegments(text) {
  if (isPrintableAscii(text))
    return text.split("");
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}
function resolveTextAlign(textAlign2, isRtl) {
  switch (textAlign2) {
    case "start":
      return isRtl ? "right" : "left";
    case "end":
      return isRtl ? "left" : "right";
    default:
      return textAlign2;
  }
}

// packages/ag-charts-core/src/data/strings.ts
function joinFormatted(values, conjunction = "and", format = String, maxItems = Infinity) {
  if (values.length === 0) {
    return "";
  } else if (values.length === 1) {
    return format(values[0]);
  }
  values = values.map(format);
  const lastValue = values.pop();
  if (values.length >= maxItems) {
    const remainingCount = values.length - (maxItems - 1);
    return `${values.slice(0, maxItems - 1).join(", ")}, and ${remainingCount} more ${conjunction} ${lastValue}`;
  }
  return `${values.join(", ")} ${conjunction} ${lastValue}`;
}
function stringifyValue(value, maxLength = Infinity) {
  if (typeof value === "number") {
    if (Number.isNaN(value)) {
      return "NaN";
    } else if (value === Infinity) {
      return "Infinity";
    } else if (value === -Infinity) {
      return "-Infinity";
    }
  } else if (typeof value === "bigint") {
    return `${value}`;
  }
  const strValue = JSON.stringify(value) ?? typeof value;
  if (strValue.length > maxLength) {
    return `${strValue.slice(0, maxLength)}... (+${strValue.length - maxLength} characters)`;
  }
  return strValue;
}
function countLines(text) {
  let count = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.codePointAt(i) === 10) {
      count++;
    }
  }
  return count;
}
function levenshteinDistance(a, b) {
  if (a === b)
    return 0;
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  const m = shorter.length;
  const n = longer.length;
  let prevRow = new Array(m + 1).fill(0).map((_, i) => i);
  let currRow = new Array(m + 1);
  for (let i = 1; i <= n; i++) {
    currRow[0] = i;
    for (let j = 1; j <= m; j++) {
      const cost = longer[i - 1] === shorter[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,
        // Deletion
        currRow[j - 1] + 1,
        // Insertion
        prevRow[j - 1] + cost
        // Substitution
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[m];
}
function kebabCase(a) {
  return a.replaceAll(KEBAB_CASE_REGEX, (match, offset) => (offset > 0 ? "-" : "") + match.toLowerCase());
}
var KEBAB_CASE_REGEX = /[A-Z]+(?![a-z])|[A-Z]/g;
function toPlainText(text, fallback = "") {
  if (text == null) {
    return fallback;
  } else if (isArray(text)) {
    return text.map((segment) => segment.type === "image" ? segment.alt ?? "" : toTextString(segment.text)).join("");
  } else if (isString(text)) {
    return text;
  } else {
    return String(text);
  }
}

// packages/ag-charts-core/src/modules/registryMode.ts
var RegistryMode = /* @__PURE__ */ /*#__PURE__*/ ((RegistryMode2) => {
  RegistryMode2["Enterprise"] = "enterprise";
  RegistryMode2["Integrated"] = "integrated";
  RegistryMode2["UMD"] = "umd";
  return RegistryMode2;
})(RegistryMode || {});
var registeredModes = /* @__PURE__ */ /*#__PURE__*/ new Set();
function setRegistryMode(registryFlag) {
  registeredModes.add(registryFlag);
}
function clearRegistryModes() {
  registeredModes.clear();
}
function isEnterprise() {
  return registeredModes.has("enterprise" /* Enterprise */);
}
function isIntegrated() {
  return registeredModes.has("integrated" /* Integrated */);
}
function isUmd() {
  return registeredModes.has("umd" /* UMD */);
}

// packages/ag-charts-core/src/options/validation.ts
var descriptionSymbol = /*#__PURE__*/ Symbol("description");
var requiredSymbol = /*#__PURE__*/ Symbol("required");
var markedSymbol = /*#__PURE__*/ Symbol("marked");
var undocumentedSymbol = /*#__PURE__*/ Symbol("undocumented");
var deprecatedSymbol = /*#__PURE__*/ Symbol("deprecated");
var enterpriseSymbol = /*#__PURE__*/ Symbol("enterprise");
var deprecatedValueSymbol = /*#__PURE__*/ Symbol("deprecatedValue");
var unionSymbol = /*#__PURE__*/ Symbol("union");
var isDeprecatedValue = (value) => isObject(value) && deprecatedValueSymbol in value;
var schemaKeyCache = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
var similarOptionsMap = /*#__PURE__*/ [
  ["placement", "position"],
  ["padding", "spacing", "gap"],
  ["color", "fill", "stroke"],
  ["whisker", "wick"],
  ["src", "url"],
  ["width", "thickness"],
  ["show", "visible", "enabled"],
  ["value", "range"]
].reduce((map, words) => {
  for (const word of words) {
    map.set(word.toLowerCase(), new Set(words.filter((w) => w !== word)));
  }
  return map;
}, /* @__PURE__ */ new Map());
var ErrorType = /* @__PURE__ */ /*#__PURE__*/ ((ErrorType2) => {
  ErrorType2["Enterprise"] = "enterprise";
  ErrorType2["Invalid"] = "invalid";
  ErrorType2["Required"] = "required";
  ErrorType2["Unknown"] = "unknown";
  return ErrorType2;
})(ErrorType || {});
function extendPath(path, key) {
  if (isFiniteNumber(key)) {
    return `${path}[${key}]`;
  }
  return path === "" ? key : `${path}.${key}`;
}
var ValidationError = class {
  constructor(type, description, value, path, key) {
    this.type = type;
    this.description = description;
    this.value = value;
    this.path = path;
    this.key = key;
  }
  setUnionType(unionType, path) {
    if (this.path.startsWith(path)) {
      const suffix = this.path.slice(path.length);
      this.altPath = `${path}[type=${unionType}]${suffix}`;
    }
  }
  getPrefix() {
    const { altPath: path = this.path, key } = this;
    if (path === "" && (key == null || key === ""))
      return "Value";
    return `Option \`${key == null || key === "" ? path : extendPath(path, key)}\``;
  }
  toString() {
    const { description = "unknown", type, value } = this;
    if (type === "required" /* Required */ && value == null) {
      return `${this.getPrefix()} is required and has not been provided; expecting ${description}, ignoring.`;
    }
    if (type === "enterprise" /* Enterprise */) {
      return `${this.getPrefix()} is an AG Charts Enterprise feature; ignoring.`;
    }
    return `${this.getPrefix()} cannot be set to \`${stringifyValue(value, 50)}\`; expecting ${description}, ignoring.`;
  }
};
var UnknownError = class extends ValidationError {
  constructor(suggestions, value, path, key) {
    super("unknown" /* Unknown */, void 0, value, path, key);
    this.suggestions = suggestions;
    this.key = key;
  }
  getPrefix() {
    return `Unknown option \`${extendPath(this.altPath ?? this.path, this.key)}\``;
  }
  getPostfix() {
    const suggestions = joinFormatted(findSuggestions(this.key, this.suggestions), "or", (val) => `\`${val}\``);
    return suggestions === "" ? ", ignoring." : `; Did you mean ${suggestions}? Ignoring.`;
  }
  toString() {
    return `${this.getPrefix()}${this.getPostfix()}`;
  }
};
function isThemeOperator(value) {
  if (!isObject(value))
    return false;
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0].startsWith("$");
}
function validate(options, optionsDefs2, path, params) {
  if (!isObject(options)) {
    return { cleared: null, invalid: [new ValidationError("required" /* Required */, "an object", options, path)] };
  }
  const cleared = {};
  const invalid = [];
  const optionsKeys = new Set(Object.keys(options));
  const unusedKeys = [];
  const optionsDisabled = params.skipDisabledNodeValidation === true && options.enabled === false;
  let schemaKeys = schemaKeyCache.get(optionsDefs2);
  if (schemaKeys === void 0) {
    schemaKeys = Object.keys(optionsDefs2);
    schemaKeyCache.set(optionsDefs2, schemaKeys);
  }
  const defsAny = optionsDefs2;
  if (unionSymbol in optionsDefs2) {
    const validTypes = schemaKeys;
    const defaultType = optionsDefs2[unionSymbol];
    if (options.type != null && validTypes.includes(options.type) || options.type == null && defaultType != null) {
      const { type = defaultType, ...rest } = options;
      const nestedResult = validate(rest, defsAny[type], path, params);
      Object.assign(cleared, { type }, nestedResult.cleared);
      for (const error2 of nestedResult.invalid) {
        error2.setUnionType(type, path);
      }
      invalid.push(...nestedResult.invalid);
    } else if (optionsDisabled) {
      Object.assign(cleared, { enabled: false });
    } else {
      const keywords = joinFormatted(validTypes, "or", (val) => `'${val}'`);
      invalid.push(
        new ValidationError("required" /* Required */, `a keyword such as ${keywords}`, options.type, path, "type")
      );
    }
    return { cleared, invalid };
  }
  for (const key of schemaKeys) {
    const validatorOrDefs = optionsDefs2[key];
    const required3 = validatorOrDefs[requiredSymbol];
    const value = options[key];
    optionsKeys.delete(key);
    if (value === void 0) {
      if (!validatorOrDefs[undocumentedSymbol]) {
        unusedKeys.push(key);
      }
      if (!required3 || optionsDisabled)
        continue;
    }
    if (params.themeOperators && isThemeOperator(value)) {
      cleared[key] = value;
      continue;
    }
    const keyPath = extendPath(path, key);
    if (isFunction(validatorOrDefs)) {
      const context = { options, path: keyPath, params };
      const validatorResult = validatorOrDefs(value, context);
      const objectResult = typeof validatorResult === "object";
      if (objectResult) {
        invalid.push(...validatorResult.invalid);
        if (validatorResult.valid) {
          cleared[key] = validatorResult.cleared;
          continue;
        } else if (hasRequiredInPath(validatorResult.invalid, keyPath)) {
          continue;
        }
      } else if (validatorResult) {
        cleared[key] = value;
        continue;
      }
      invalid.push(
        new ValidationError(
          required3 ? "required" /* Required */ : "invalid" /* Invalid */,
          validatorOrDefs[descriptionSymbol],
          value,
          path,
          key
        )
      );
    } else {
      const nestedResult = validate(value, validatorOrDefs, keyPath, params);
      if (nestedResult.cleared != null) {
        cleared[key] = nestedResult.cleared;
      }
      invalid.push(...nestedResult.invalid);
    }
  }
  for (const key of optionsKeys) {
    const value = options[key];
    if (value === void 0)
      continue;
    invalid.push(new UnknownError(unusedKeys, value, path, key));
  }
  return { cleared, invalid };
}
function findSuggestions(value, suggestions, maxDistance = 2) {
  const lowerCaseValue = value.toLowerCase();
  const similarValues = similarOptionsMap.get(lowerCaseValue);
  return suggestions.filter((key) => {
    const lowerCaseKey = key.toLowerCase();
    return similarValues?.has(key) === true || lowerCaseKey.includes(lowerCaseValue) || levenshteinDistance(lowerCaseValue, lowerCaseKey) <= maxDistance;
  });
}
function describeValidator(validatorOrDefs) {
  return validatorOrDefs[descriptionSymbol];
}
function attachDescription(validatorOrDefs, description) {
  if (isFunction(validatorOrDefs)) {
    let clonedValidator2 = function(value, context) {
      return validatorOrDefs(value, context);
    };
    var clonedValidator = clonedValidator2;
    clonedValidator2[descriptionSymbol] = description;
    return clonedValidator2;
  } else {
    return { ...validatorOrDefs, [descriptionSymbol]: description };
  }
}
function required(validatorOrDefs) {
  if (validatorOrDefs[enterpriseSymbol]) {
    throw new Error(
      "`required()` cannot wrap an `enterprise()` validator; enterprise options must remain optional."
    );
  }
  return Object.assign(
    isFunction(validatorOrDefs) ? (value, context) => validatorOrDefs(value, context) : optionsDefs(validatorOrDefs),
    { [requiredSymbol]: true, [descriptionSymbol]: validatorOrDefs[descriptionSymbol] }
  );
}
function undocumented(validatorOrDefs) {
  return Object.assign(
    isFunction(validatorOrDefs) ? (value, context) => validatorOrDefs(value, context) : optionsDefs(validatorOrDefs),
    { [undocumentedSymbol]: true, [descriptionSymbol]: validatorOrDefs[descriptionSymbol] }
  );
}
function undocumentedDefs(defs) {
  const result = {};
  for (const key of Object.keys(defs)) {
    result[key] = undocumented(defs[key]);
  }
  return result;
}
function partial(defs) {
  const result = { ...defs };
  for (const key of Object.keys(defs)) {
    const def = defs[key];
    if (!def[requiredSymbol])
      continue;
    result[key] = Object.assign((value, context) => def(value, context), {
      [descriptionSymbol]: def[descriptionSymbol],
      [undocumentedSymbol]: def[undocumentedSymbol]
    });
  }
  return result;
}
function enterprise(validatorOrDefs) {
  if (validatorOrDefs[requiredSymbol]) {
    throw new Error(
      "`enterprise()` cannot wrap a `required()` validator; enterprise options must remain optional."
    );
  }
  const inner = isFunction(validatorOrDefs) ? validatorOrDefs : optionsDefs(validatorOrDefs);
  const description = validatorOrDefs[descriptionSymbol];
  const gated = (value, context) => {
    if (value !== void 0 && !isEnterprise()) {
      context.params.logger.warnOnce(
        new ValidationError("enterprise" /* Enterprise */, description, value, context.path).toString()
      );
      return { valid: true, cleared: null, invalid: [] };
    }
    return inner(value, context);
  };
  return Object.assign(gated, {
    [enterpriseSymbol]: true,
    [descriptionSymbol]: description
  });
}
function deprecated(validatorOrDefs, message) {
  const inner = isFunction(validatorOrDefs) ? validatorOrDefs : optionsDefs(validatorOrDefs);
  const description = validatorOrDefs[descriptionSymbol];
  const gated = (value, context) => {
    if (value !== void 0 && !context.params?.silentAdvisories) {
      const notice = `Option \`${context.path}\` is deprecated. ${message}`;
      context.params.logger.deprecationOnce(notice);
    }
    return inner(value, context);
  };
  return Object.assign(gated, {
    [deprecatedSymbol]: message,
    [descriptionSymbol]: description
  });
}
function deprecatedValue(value, message) {
  return { [deprecatedValueSymbol]: message, value };
}
var optionsDefs = (defs, description = "an object", failAll = false) => attachDescription((value, context) => {
  const result = validate(value, defs, context.path, context.params);
  const valid = !hasRequiredInPath(result.invalid, context.path);
  return { valid, cleared: valid || !failAll ? result.cleared : null, invalid: result.invalid };
}, description);
var typeUnion = (defs, description, defaultType) => ({
  ...defs,
  [descriptionSymbol]: description,
  [unionSymbol]: defaultType
});
var and = (...validators) => attachDescription(
  (value, context) => {
    const invalid = [];
    for (const validator of validators) {
      const result = validator(value, context);
      if (typeof result === "object") {
        invalid.push(...result.invalid);
        if (!result.valid) {
          return { valid: false, cleared: value, invalid };
        }
        value = result.cleared;
      } else if (!result) {
        return false;
      }
    }
    return { valid: true, cleared: value, invalid };
  },
  joinFormatted(
    validators.filter((v) => !v[undocumentedSymbol]).map((v) => v[descriptionSymbol]).filter(isDefined),
    "and"
  )
);
var or = (...validators) => attachDescription(
  (value, context) => {
    for (const validator of validators) {
      const result = validator(value, context);
      if (typeof result === "object" ? result.valid : result) {
        return result;
      }
    }
    return false;
  },
  joinFormatted(
    validators.filter((v) => !v[undocumentedSymbol]).map((v) => v[descriptionSymbol]).filter(isDefined),
    "or"
  )
);
var isComparable = (value) => isFiniteNumericValue(value) || isValidDate(value);
var isValidDateValue = (value) => isDate(value) || (isFiniteNumber(value) || isString(value)) && isValidDate(new Date(value));
var array = /*#__PURE__*/ attachDescription(isArray, "an array");
var boolean = /*#__PURE__*/ attachDescription(isBoolean, "a boolean");
var callback = /*#__PURE__*/ attachDescription(isFunction, "a function");
var color = /*#__PURE__*/ attachDescription(
  isColor,
  "a supported color string (hex, rgb(), hsl(), oklch() or a CSS color name)"
);
var date = /*#__PURE__*/ attachDescription(isValidDateValue, "a date");
var defined = /*#__PURE__*/ attachDescription(isDefined, "a defined value");
var number = /*#__PURE__*/ attachDescription(isFiniteNumber, "a number");
var numericValue = /*#__PURE__*/ attachDescription(isFiniteNumericValue, "a number or bigint");
var object = /*#__PURE__*/ attachDescription(isObject, "an object");
var string = /*#__PURE__*/ attachDescription(isString, "a string");
var htmlElement = /*#__PURE__*/ attachDescription(isHtmlElement, "an html element");
var arrayLength = (minLength, maxLength = Infinity) => {
  let message;
  if (maxLength === Infinity) {
    message = `an array of at least ${minLength} items`;
  } else if (minLength === maxLength) {
    message = `an array of exactly ${minLength} items`;
  } else if (minLength === 0) {
    message = `an array of no more than ${maxLength} items`;
  } else {
    message = `an array of at least ${minLength} and no more than ${maxLength} items`;
  }
  return attachDescription(
    (value) => isArray(value) && value.length >= minLength && value.length <= maxLength,
    message
  );
};
var stringLength = (minLength, maxLength = Infinity) => {
  let message;
  if (maxLength === Infinity) {
    message = `a string of at least ${minLength} characters`;
  } else if (minLength === maxLength) {
    message = `an string of exactly ${minLength} characters`;
  } else if (minLength === 0) {
    message = `an string of no more than ${maxLength} characters`;
  } else {
    message = `an string of at least ${minLength} and no more than ${maxLength} characters`;
  }
  return attachDescription(
    (value) => isString(value) && value.length >= minLength && value.length <= maxLength,
    message
  );
};
var numberMin = (min, inclusive = true) => attachDescription(
  (value) => isFiniteNumber(value) && (value > min || inclusive && value === min),
  `a number greater than ${inclusive ? "or equal to " : ""}${min}`
);
var numberRange = (min, max) => attachDescription(
  (value) => isFiniteNumber(value) && value >= min && value <= max,
  `a number between ${min} and ${max} inclusive`
);
var positiveNumber = /*#__PURE__*/ numberMin(0);
var positiveNumberNonZero = /*#__PURE__*/ numberMin(0, false);
var nonNegativeInteger = /*#__PURE__*/ attachDescription(
  (value) => isFiniteNumber(value) && Number.isInteger(value) && value >= 0,
  "a non-negative integer"
);
var positiveNumericValue = /*#__PURE__*/ attachDescription(
  (value) => isFiniteNumericValue(value) && value >= 0,
  "a number or bigint greater than or equal to 0"
);
var positiveNumericValueNonZero = /*#__PURE__*/ attachDescription(
  (value) => isFiniteNumericValue(value) && value > 0,
  "a number or bigint greater than 0"
);
var ratio = /*#__PURE__*/ numberRange(0, 1);
var lessThan = (otherField) => attachDescription(
  (value, { options }) => !isComparable(value) || !isComparable(options[otherField]) || value < options[otherField],
  `the value to be less than \`${otherField}\``
);
var lessThanOrEqual = (otherField) => attachDescription(
  (value, { options }) => !isComparable(value) || !isComparable(options[otherField]) || value <= options[otherField],
  `the value to be less than or equal to \`${otherField}\``
);
var greaterThan = (otherField) => attachDescription(
  (value, { options }) => !isComparable(value) || !isComparable(options[otherField]) || value > options[otherField],
  `the value to be greater than \`${otherField}\``
);
function union(...allowed) {
  if (isObject(allowed[0]) && !isDeprecatedValue(allowed[0])) {
    allowed = Object.values(allowed[0]);
  }
  const deprecations = /* @__PURE__ */ new Map();
  const values = allowed.map((entry) => {
    if (!isDeprecatedValue(entry))
      return entry;
    deprecations.set(entry.value, entry[deprecatedValueSymbol]);
    return entry.value;
  });
  const keywords = joinFormatted(
    values.filter((value) => !deprecations.has(value)),
    "or",
    (value) => `'${value}'`
  );
  if (deprecations.size === 0) {
    return attachDescription((value) => values.includes(value), `a keyword such as ${keywords}`);
  }
  return attachDescription((value, context) => {
    if (!values.includes(value))
      return false;
    const message = deprecations.get(value);
    if (message != null && !context.params?.silentAdvisories) {
      const notice = `Value \`${stringifyValue(value)}\` of option \`${context.path}\` is deprecated. ${message}`;
      context.params.logger.deprecationOnce(notice);
    }
    return true;
  }, `a keyword such as ${keywords}`);
}
function unionOrArray(...allowed) {
  const validator = union(...allowed);
  return or(
    validator,
    attachDescription(and(arrayOf(validator), arrayLength(1)), "a non-empty array containing these keywords")
  );
}
function strictUnion() {
  return union;
}
var constant = (allowed) => attachDescription((value) => allowed === value, `the value ${JSON.stringify(allowed)}`);
var instanceOf = (instanceType, description) => attachDescription((value) => value instanceof instanceType, description ?? `an instance of ${instanceType.name}`);
var arrayOf = (validator, description, strict = true) => attachDescription(
  (value, context) => {
    if (!isArray(value))
      return false;
    let valid = strict;
    const cleared = [];
    const invalid = [];
    const updateValidity = (result) => {
      valid = strict ? valid && result : valid || result;
    };
    if (value.length === 0) {
      return { valid: true, cleared, invalid };
    }
    for (let i = 0; i < value.length; i++) {
      const options = value[i];
      const result = validator(options, { options, path: `${context.path}[${i}]`, params: context.params });
      if (typeof result === "object") {
        updateValidity(result.valid);
        invalid.push(...result.invalid);
        if (result.cleared != null) {
          cleared.push(result.cleared);
        }
      } else {
        updateValidity(result);
        if (result) {
          cleared.push(options);
        }
      }
    }
    return { valid, cleared: valid || !strict ? cleared : null, invalid };
  },
  description ?? `${validator[descriptionSymbol]} array`
);
var arrayOfDefs = (defs, description = "an object array") => attachDescription((value, context) => {
  if (!isArray(value))
    return false;
  const cleared = [];
  const invalid = [];
  for (let i = 0; i < value.length; i++) {
    const indexPath = `${context.path}[${i}]`;
    const result = validate(value[i], defs, indexPath, context.params);
    if (!hasRequiredInPath(result.invalid, indexPath)) {
      cleared.push(result.cleared);
    }
    invalid.push(...result.invalid);
  }
  return { valid: true, cleared, invalid };
}, description);
var withThemeOperators = (defs) => attachDescription((value, context) => {
  if (!isObject(value))
    return false;
  const { cleared, invalid } = validate(value, defs, context.path, { ...context.params, themeOperators: true });
  return { valid: true, cleared, invalid };
}, "an object");
var callbackOf = (validator, description) => attachDescription((value, context) => {
  if (!isFunction(value))
    return false;
  if (markedSymbol in value)
    return true;
  const validatorDescription = description ?? validator[descriptionSymbol];
  const cbWithValidation = Object.assign(
    (...args) => {
      const result = safeCall(value, args, context.params.logger, context.path);
      if (result == null)
        return;
      const validatorResult = validator(result, { options: result, path: "", params: context.params });
      if (typeof validatorResult === "object") {
        warnCallbackErrors(validatorResult, context, validatorDescription);
        if (validatorResult.valid) {
          return validatorResult.cleared;
        }
      } else if (validatorResult) {
        return result;
      } else {
        context.params.logger.warnOnce(
          `Callback \`${context.path}\` returned an invalid value \`${stringifyValue(result, 50)}\`; expecting ${validatorDescription}, ignoring.`
        );
      }
    },
    { [markedSymbol]: true }
  );
  return { valid: true, cleared: cbWithValidation, invalid: [] };
}, "a function");
var callbackDefs = (defs, description = "an object") => attachDescription((value, context) => {
  if (!isFunction(value))
    return false;
  if (markedSymbol in value)
    return true;
  const validatorDescription = description;
  const cbWithValidation = Object.assign(
    (...args) => {
      const result = safeCall(value, args, context.params.logger, context.path);
      if (result == null)
        return;
      const validatorResult = validate(result, defs, context.path, context.params);
      warnCallbackErrors(validatorResult, context, validatorDescription);
      return validatorResult.cleared;
    },
    { [markedSymbol]: true }
  );
  return { valid: true, cleared: cbWithValidation, invalid: [] };
}, "a function");
function hasRequiredInPath(errors, rootPath) {
  return errors.some((error2) => error2.type === "required" /* Required */ && error2.path === rootPath);
}
function warnCallbackErrors(validatorResult, context, description) {
  if (validatorResult.invalid.length === 0)
    return;
  for (const error2 of validatorResult.invalid) {
    if (error2 instanceof UnknownError) {
      return context.params.logger.warnOnce(
        `Callback \`${context.path}\` returned an unknown property \`${extendPath(error2.path, error2.key)}\`${error2.getPostfix()}`
      );
    }
    const errorValue = stringifyValue(error2.value, 50);
    context.params.logger.warnOnce(
      error2.key == null || error2.key === "" ? `Callback \`${context.path}\` returned an invalid value \`${errorValue}\`; expecting ${description ?? error2.description}, ignoring.` : `Callback \`${context.path}\` returned an invalid property \`${extendPath(error2.path, error2.key)}\`: \`${errorValue}\`; expecting ${error2.description}, ignoring.`
    );
  }
}

// packages/ag-charts-core/src/modules/optionsContribution.ts
var pathCache = /* @__PURE__ */ /*#__PURE__*/ new Map();
function parseOptionsPath(path) {
  let parsed = pathCache.get(path);
  if (parsed != null)
    return parsed;
  if (path.length === 0) {
    throw new Error("AG Charts - an options contribution path cannot be empty");
  }
  const segments = path.split(".").map((segment) => {
    const each = segment.endsWith("[]");
    const key = each ? segment.slice(0, -2) : segment;
    if (key.length === 0 || key.includes("[") || key.includes("]")) {
      throw new Error(`AG Charts - invalid options contribution path '${path}'`);
    }
    return { key, each };
  });
  if (segments.at(-1)?.each) {
    throw new Error(`AG Charts - an options contribution path cannot end in '[]': '${path}'`);
  }
  parsed = { source: path, segments };
  pathCache.set(path, parsed);
  return parsed;
}
function contributionHost(path) {
  const [first2] = path.segments;
  if (first2.each && (first2.key === "axes" || first2.key === "series")) {
    const relative = path.segments.slice(1).map(({ key, each }) => each ? `${key}[]` : key).join(".");
    return { host: first2.key === "axes" ? "axis" : "series", relative: parseOptionsPath(relative) };
  }
  return { host: "chart", relative: path };
}
function contributionsOf(definition) {
  const { name, chartTypes, options, themeOptions, themeTemplate } = definition;
  if (definition.contributes != null) {
    if (chartTypes == null)
      return definition.contributes;
    return definition.contributes.map(
      (contribution) => contribution.chartTypes == null ? { ...contribution, chartTypes } : contribution
    );
  }
  if (options == null && themeTemplate == null)
    return [];
  switch (definition.type) {
    case "plugin":
      return [{ path: name, options, themeOptions, themeTemplate, chartTypes }];
    case "axis:plugin":
      return [
        {
          path: `axes[].${definition.optionsKey ?? name}`,
          options,
          themeOptions,
          themeTemplate,
          chartTypes,
          axisTypes: definition.axisTypes
        }
      ];
    case "series:plugin":
      return [
        {
          path: `series[].${name}`,
          options,
          themeOptions,
          themeTemplate,
          chartTypes,
          seriesTypes: definition.seriesTypes,
          requested: "present"
        }
      ];
    default:
      return [];
  }
}
function contributionMatchesChartType(contribution, chartType) {
  return matchesChartType(contribution.chartTypes, chartType);
}
function moduleMatchesChartType(definition, chartType) {
  if (definition.chartType != null)
    return chartType == null || definition.chartType === chartType;
  return matchesChartType(definition.chartTypes, chartType);
}
function matchesChartType(chartTypes, chartType) {
  return chartType == null || chartTypes == null || chartTypes.includes(chartType);
}
function contributionMatchesAxisType(contribution, axisType) {
  return contribution.axisTypes == null || contribution.axisTypes.includes(axisType);
}
function contributionMatchesSeriesType(contribution, seriesType) {
  return contribution.seriesTypes == null || contribution.seriesTypes.includes(seriesType);
}
function resolveContributions(definitions) {
  const resolved = [];
  for (const definition of definitions) {
    for (const contribution of contributionsOf(definition)) {
      const path = parseOptionsPath(contribution.path);
      resolved.push({ definition, contribution, path, ...contributionHost(path) });
    }
  }
  return resolved;
}
function nestAtOptionsPath(path, value) {
  let nested = value;
  for (let i = path.segments.length - 1; i >= 0; i--) {
    nested = { [path.segments[i].key]: nested };
  }
  return nested;
}
function visitOptionsPath(options, path, visit) {
  visitSegments(options, path.segments, 0, "", visit);
}
function visitSegments(host, segments, index, location, visit) {
  if (!isObject(host))
    return;
  const { key, each } = segments[index];
  const keyLocation = location === "" ? key : `${location}.${key}`;
  if (index === segments.length - 1) {
    visit(host, key, keyLocation);
    return;
  }
  const next = host[key];
  if (!each) {
    visitSegments(next, segments, index + 1, keyLocation, visit);
    return;
  }
  if (Array.isArray(next)) {
    for (let i = 0; i < next.length; i++) {
      visitSegments(next[i], segments, index + 1, `${keyLocation}[${i}]`, visit);
    }
  } else if (isObject(next)) {
    for (const childKey of Object.keys(next)) {
      visitSegments(next[childKey], segments, index + 1, `${keyLocation}.${childKey}`, visit);
    }
  }
}
function readContributedValue(contributions, host, hostOptions) {
  let found;
  for (const contribution of contributions) {
    if (contribution.host !== host)
      continue;
    visitOptionsPath(hostOptions, contribution.relative, (target, key) => {
      found ?? (found = target[key]);
    });
    if (found != null)
      break;
  }
  return found;
}
function contributedKeysUnder(contributions, parent) {
  const { segments } = parseOptionsPath(parent);
  const keys = [];
  for (const { host, path } of contributions) {
    if (host !== "chart" || path.segments.length !== segments.length + 1)
      continue;
    if (segments.every((segment, i) => segment.key === path.segments[i].key)) {
      keys.push(path.segments.at(-1).key);
    }
  }
  return keys;
}
function isContributionRequested(contribution, value) {
  if (value == null)
    return false;
  if (contribution.requested === "present")
    return true;
  return !isObject(value) || value.enabled !== false;
}
function composeContributedDefs(defs, contributions) {
  let composed;
  for (const { contribution, path, host } of contributions) {
    if (host !== "chart")
      continue;
    composed ?? (composed = { ...defs });
    let target = composed;
    const { segments } = path;
    for (let i = 0; i < segments.length - 1; i++) {
      const { key } = segments[i];
      const existing = target[key];
      const next = isObject(existing) && !isFunction(existing) ? { ...existing } : {};
      target[key] = next;
      target = next;
    }
    const leaf = segments.at(-1).key;
    target[leaf] = contribution.options ?? target[leaf] ?? object;
  }
  return composed ?? defs;
}

// packages/ag-charts-core/src/modules/moduleScope.ts
function isModuleType(moduleType, definition) {
  return definition?.type === moduleType;
}
var ModuleScope = class {
  constructor(parent) {
    this.parent = parent;
    this.modules = /* @__PURE__ */ new Map();
    this.revision = 0;
  }
  get(moduleName) {
    return this.modules.get(moduleName) ?? this.parent?.get(moduleName);
  }
  registerModuleDefinition(def) {
    this.modules.set(def.name, def);
    this.revision++;
    if (def.dependencies) {
      for (const dependency of def.dependencies) {
        this.register(dependency);
      }
    }
  }
  register(def) {
    const existingDefinition = this.get(def.name);
    if (!existingDefinition) {
      this.registerModuleDefinition(def);
      return;
    }
    if (existingDefinition.version === def.version) {
      if (!existingDefinition.enterprise && def.enterprise) {
        this.registerModuleDefinition(def);
      }
      return;
    }
    throw new Error(
      [
        `AG Charts - Module '${def.name}' already registered with different version:`,
        `${existingDefinition.version} vs ${def.version}`,
        ``,
        `Check your package.json for conflicting dependencies - depending on your package manager`,
        `one of these commands may help:`,
        `- npm ls ag-charts-community`,
        `- yarn why ag-charts-community`
      ].join("\n")
    );
  }
  registerModules(definitions) {
    for (const definition of definitions.flat()) {
      this.register(definition);
    }
  }
  reset() {
    this.modules.clear();
    this.revision++;
  }
  /**
   * Invokes `callback` if the registry has changed since the caller's `lastSeen` revision.
   * Returns the current revision so the caller can store it for the next call.
   *
   * Allows downstream caches that derive state from the registry contents (e.g. `ChartTheme`
   * defaults built from `listModulesByType`) to invalidate without subscribing to events or
   * re-scanning the module map on every read.
   */
  ifRegistryChanged(lastSeen, callback2) {
    const current = this.currentRevision();
    if (current !== lastSeen) {
      callback2();
    }
    return current;
  }
  currentRevision() {
    if (this.parent == null)
      return this.revision;
    return `${this.parent.currentRevision()}:${this.revision}`;
  }
  /** Whether this scope holds any definition of its own rather than only those of its parent. */
  get hasOwnModules() {
    return this.modules.size > 0;
  }
  hasModule(moduleName) {
    return this.modules.has(moduleName) || (this.parent?.hasModule(moduleName) ?? false);
  }
  *listModules() {
    yield* this.modules.values();
    if (this.parent == null)
      return;
    for (const definition of this.parent.listModules()) {
      if (!this.modules.has(definition.name)) {
        yield definition;
      }
    }
  }
  *listModulesByType(moduleType) {
    for (const definition of this.listModules()) {
      if (isModuleType(moduleType, definition)) {
        yield definition;
      }
    }
  }
  /**
   * Every option location owned by a module visible from this scope, rebuilt when the scope or any
   * ancestor changes. A child scope's definitions shadow same-named parent ones, as `listModules` does.
   */
  optionsContributions() {
    return this.resolvedContributions().table;
  }
  /** The option locations owned by the named module, as visible from this scope. */
  moduleContributions(moduleName) {
    return this.resolvedContributions().byModule.get(moduleName) ?? [];
  }
  resolvedContributions() {
    const revision = this.currentRevision();
    if (this.contributions?.revision !== revision) {
      const table2 = resolveContributions(this.listModules());
      const byModule = /* @__PURE__ */ new Map();
      for (const entry of table2) {
        let entries2 = byModule.get(entry.definition.name);
        if (entries2 == null) {
          entries2 = [];
          byModule.set(entry.definition.name, entries2);
        }
        entries2.push(entry);
      }
      this.contributions = { table: table2, byModule, revision };
    }
    return this.contributions;
  }
  getAxisModule(moduleName) {
    const definition = this.get(moduleName);
    if (isModuleType("axis" /* Axis */, definition)) {
      return definition;
    }
  }
  getChartModule(moduleName) {
    const definition = this.get(moduleName);
    if (isModuleType("chart" /* Chart */, definition)) {
      return definition;
    }
    throw new Error(
      `AG Charts - Unknown chart type; Check options are correctly structured and series types are specified`
    );
  }
  getPresetModule(moduleName) {
    const definition = this.get(moduleName);
    if (isModuleType("preset" /* Preset */, definition)) {
      return definition;
    }
  }
  getSeriesModule(moduleName) {
    const definition = this.get(moduleName);
    if (isModuleType("series" /* Series */, definition)) {
      return definition;
    }
  }
};
function createModuleScope(parent) {
  return new ModuleScope(parent);
}
function createScopedCache(create2, empty) {
  let caches = /* @__PURE__ */ new WeakMap();
  return {
    for(scope) {
      let entry = caches.get(scope);
      if (entry == null) {
        entry = { cache: create2(), revision: -1 };
        caches.set(scope, entry);
      }
      const { cache } = entry;
      entry.revision = scope.ifRegistryChanged(entry.revision, () => empty(cache));
      return cache;
    },
    clear() {
      caches = /* @__PURE__ */ new WeakMap();
    }
  };
}

// packages/ag-charts-core/src/modules/moduleRegistry.ts
var globalScope = /*#__PURE__*/ createModuleScope();
var instanceScopes = /*#__PURE__*/ new LRUCache(32);
var instanceScopeKeys = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
function instanceScopeKey(definitions) {
  return definitions.map((def) => `${def.name}@${def.version}${def.enterprise ? ":enterprise" : ""}`).sort((a, b) => a.localeCompare(b)).join(",");
}
function resolveModuleScope(modules) {
  const definitions = modules?.flat() ?? [];
  if (definitions.length === 0)
    return globalScope;
  const key = instanceScopeKey(definitions);
  let scope = instanceScopes.get(key);
  if (scope == null) {
    const child = createModuleScope(globalScope);
    child.registerModules(definitions);
    scope = child.hasOwnModules ? child : globalScope;
    instanceScopes.set(key, scope);
    if (scope !== globalScope) {
      instanceScopeKeys.set(scope, key);
    }
  }
  return scope;
}
function isGlobalScope(scope) {
  return scope === globalScope;
}
function getModuleScopeKey(scope) {
  return instanceScopeKeys.get(scope) ?? "";
}
function ifRegistryChanged(lastSeen, callback2) {
  return globalScope.ifRegistryChanged(lastSeen, callback2);
}
function register(def) {
  globalScope.register(def);
}
function registerModules(definitions) {
  globalScope.registerModules(definitions);
}
function reset2() {
  clearRegistryModes();
  globalScope.reset();
  instanceScopes.clear();
}
function hasModule(moduleName) {
  return globalScope.hasModule(moduleName);
}
function listModules() {
  return globalScope.listModules();
}
function listModulesByType(moduleType) {
  return globalScope.listModulesByType(moduleType);
}
function getAxisModule(moduleName) {
  return globalScope.getAxisModule(moduleName);
}
function getChartModule(moduleName) {
  return globalScope.getChartModule(moduleName);
}
function getPresetModule(moduleName) {
  return globalScope.getPresetModule(moduleName);
}
function getSeriesModule(moduleName) {
  return globalScope.getSeriesModule(moduleName);
}

// packages/ag-charts-core/src/data/iterators.ts
function* iterate(...items) {
  for (const item of items) {
    if (item == null)
      continue;
    if (item[Symbol.iterator]) {
      yield* item;
    } else {
      yield item;
    }
  }
}
function toIterable(value) {
  return value != null && typeof value === "object" && Symbol.iterator in value ? value : [value];
}
function first(iterable) {
  for (const value of iterable) {
    return value;
  }
  throw new Error("AG Charts - no first() value found");
}
function* entries(obj) {
  const resultTuple = [void 0, void 0];
  for (const key of Object.keys(obj)) {
    resultTuple[0] = key;
    resultTuple[1] = obj[key];
    yield resultTuple;
  }
}

// packages/ag-charts-core/src/data/object.ts
function strictObjectKeys(o) {
  return Object.keys(o);
}
function objectsEqual(a, b) {
  if (Array.isArray(a)) {
    if (!Array.isArray(b))
      return false;
    if (a.length !== b.length)
      return false;
    return a.every((av, i) => objectsEqual(av, b[i]));
  } else if (isPlainObject(a)) {
    if (!isPlainObject(b))
      return false;
    return objectsEqualWith(a, b, objectsEqual);
  }
  return a === b;
}
function objectsEqualWith(a, b, cmp2) {
  if (Object.is(a, b))
    return true;
  for (const key of Object.keys(b)) {
    if (!(key in a))
      return false;
  }
  for (const key of Object.keys(a)) {
    if (!(key in b))
      return false;
    if (!cmp2(a[key], b[key]))
      return false;
  }
  return true;
}
function mergeDefaults(...sources) {
  return mergeSources(sources);
}
function mergeDefaultsShallowOperations(...sources) {
  return mergeSources(sources, "$");
}
function hasKeyWithPrefix(value, prefix) {
  return Object.keys(value)[0]?.startsWith(prefix) === true;
}
function mergeSources(sources, opaquePrefix) {
  const target = {};
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (!isObject(source))
      continue;
    const keys = Object.keys(source);
    for (const key of keys) {
      const targetValue = target[key];
      const sourceValue = source[key];
      if (isPlainObject(targetValue) && isPlainObject(sourceValue) && (opaquePrefix == null || !hasKeyWithPrefix(targetValue, opaquePrefix) && !hasKeyWithPrefix(sourceValue, opaquePrefix))) {
        target[key] = mergeSources([targetValue, sourceValue], opaquePrefix);
      } else {
        target[key] ?? (target[key] = sourceValue);
      }
    }
  }
  return target;
}
function merge(...sources) {
  const target = {};
  for (const source of sources) {
    if (!isObject(source))
      continue;
    const keys = Object.keys(source);
    for (const key of keys) {
      if (isPlainObject(target[key]) && isPlainObject(source[key])) {
        target[key] = merge(target[key], source[key]);
      } else if (!(key in target)) {
        target[key] ?? (target[key] = source[key]);
      }
    }
  }
  return target;
}
function mergeArrayDefaults(dataArray, ...itemDefaults) {
  if (itemDefaults != null && isArray(dataArray)) {
    return dataArray.map((item) => mergeDefaults(item, ...itemDefaults));
  }
  return dataArray;
}
function mapValues(object2, mapper) {
  const result = {};
  for (const [key, value] of entries(object2)) {
    result[key] = mapper(value, key, object2);
  }
  return result;
}
function without(object2, keys) {
  const clone2 = { ...object2 };
  for (const key of keys) {
    delete clone2[key];
  }
  return clone2;
}
function pick(object2, keys) {
  if (object2 == null)
    return;
  const picked = {};
  for (const key of keys) {
    if (Object.hasOwn(object2, key)) {
      picked[key] = object2[key];
    }
  }
  return picked;
}
function every(object2, fn) {
  if (object2 == null)
    return true;
  for (const [key, value] of entries(object2)) {
    if (!fn(key, value))
      return false;
  }
  return true;
}
function fromPairs(pairs) {
  const object2 = {};
  if (pairs == null)
    return object2;
  for (const [key, value] of pairs) {
    object2[key] = value;
  }
  return object2;
}
function getPath(object2, path) {
  const pathArray = isArray(path) ? path : path.split(".");
  return pathArray.reduce((value, pathKey) => value?.[pathKey], object2);
}
var SKIP_JS_BUILTINS = /* @__PURE__ */ /*#__PURE__*/ new Set(["__proto__", "constructor", "prototype"]);
function setPath(object2, path, newValue) {
  const pathArray = isArray(path) ? path.slice() : path.split(".");
  const lastKey = pathArray.pop();
  if (pathArray.some((p) => SKIP_JS_BUILTINS.has(p)))
    return;
  const lastObject = pathArray.reduce((value, pathKey) => value[pathKey], object2);
  lastObject[lastKey] = newValue;
  return lastObject[lastKey];
}
function partialAssign(keysToCopy, target, source) {
  if (source === void 0) {
    return target;
  }
  for (const key of keysToCopy) {
    const value = source[key];
    if (value !== void 0) {
      target[key] = value;
    }
  }
  return target;
}
function assignIfNotStrictlyEqual(target, source, keys) {
  const sourceKeys = keys ?? Object.keys(source);
  for (let i = 0, len = sourceKeys.length; i < len; i++) {
    const key = sourceKeys[i];
    const newValue = source[key];
    if (target[key] !== newValue) {
      target[key] = newValue;
    }
  }
  return target;
}
function deepFreeze(obj) {
  if (obj == null || typeof obj !== "object" || !isPlainObject(obj)) {
    return obj;
  }
  Object.freeze(obj);
  for (const prop of Object.getOwnPropertyNames(obj)) {
    const value = obj[prop];
    if (value !== null && (typeof value === "object" || typeof value === "function") && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}
function isObjectWithProperty(obj, key) {
  return isPlainObject(obj) && key in obj;
}
function isObjectWithStringProperty(obj, key) {
  return isObjectWithProperty(obj, key) && typeof obj[key] === "string";
}

// packages/ag-charts-types/src/chart/navigatorOptions.ts
var __MINI_CHART_SERIES_OPTIONS = void 0;
var __VERIFY_MINI_CHART_SERIES_OPTIONS = void 0;
/*#__PURE__*/ (() => { __VERIFY_MINI_CHART_SERIES_OPTIONS = __MINI_CHART_SERIES_OPTIONS; })();

// packages/ag-charts-types/src/chart/themeOptions.ts
var __THEME_OVERRIDES = void 0;
var __VERIFY_THEME_OVERRIDES = void 0;
/*#__PURE__*/ (() => { __VERIFY_THEME_OVERRIDES = __THEME_OVERRIDES; })();

// packages/ag-charts-types/src/presets/gauge/commonOptions.ts
var __THEMEABLE_OPTIONS = void 0;
var __VERIFY_THEMEABLE_OPTIONS = void 0;
/*#__PURE__*/ (() => { __VERIFY_THEMEABLE_OPTIONS = __THEMEABLE_OPTIONS; })();
var __AXIS_LABEL_OPTIONS = void 0;
var __VERIFY_AXIS_LABEL_OPTIONS = void 0;
/*#__PURE__*/ (() => { __VERIFY_AXIS_LABEL_OPTIONS = __AXIS_LABEL_OPTIONS; })();

// packages/ag-charts-core/src/format/numberFormat.ts
var formatRegEx = /^(?:(.)?([<>=^]))?([+\-( ])?([$€£¥₣₹#])?(0)?(\d+)?(,)?(?:\.(\d+))?(~)?([%a-z])?$/i;
var surroundedRegEx = /^((?:[^#]|#[^{])*)#{([^}]+)}(.*)$/;
function isValidNumberFormat(value) {
  if (!isString(value))
    return false;
  const match = surroundedRegEx.exec(value);
  return formatRegEx.test(match ? match[2] : value);
}
function parseNumberFormat(format) {
  let prefix;
  let suffix;
  const surrounded = surroundedRegEx.exec(format);
  if (surrounded) {
    [, prefix, format, suffix] = surrounded;
  }
  const match = formatRegEx.exec(format);
  if (!match) {
    warnOnce(`The number formatter is invalid: ${format}`);
    return;
  }
  const [, fill, align2, sign, symbol, zero, width2, comma, precision, trim, type] = match;
  return {
    fill,
    align: align2,
    sign,
    symbol,
    zero,
    width: Number.parseInt(width2),
    comma,
    precision: Number.parseInt(precision),
    trim: Boolean(trim),
    type,
    prefix,
    suffix
  };
}
function createNumberFormatter(format) {
  const options = typeof format === "string" ? parseNumberFormat(format) : format;
  if (options == null)
    return;
  const { fill, align: align2, sign = "-", symbol, zero, width: width2, comma, type, prefix = "", suffix = "", precision } = options;
  let { trim } = options;
  const precisionIsNaN = precision == null || Number.isNaN(precision);
  let formatBody;
  if (type == null) {
    formatBody = decimalTypes["g"];
    trim = true;
  } else if (type in decimalTypes && type in integerTypes) {
    formatBody = precisionIsNaN ? integerTypes[type] : decimalTypes[type];
  } else if (type in decimalTypes) {
    formatBody = decimalTypes[type];
  } else if (type in integerTypes) {
    formatBody = integerTypes[type];
  } else {
    throw new Error(`The number formatter type is invalid: ${type}`);
  }
  const defaultFormatterPrecision = type == null ? 12 : 6;
  let formatterPrecision;
  if (!precisionIsNaN) {
    formatterPrecision = precision;
  }
  let padAlign = align2;
  let padFill = fill;
  if (zero != null) {
    padFill ?? (padFill = "0");
    padAlign ?? (padAlign = "=");
  }
  return (n, fractionDigits) => {
    if (typeof n === "bigint") {
      return `${prefix}${n.toLocaleString("en-US")}${suffix}`;
    }
    let effectivePrecision;
    if (formatterPrecision != null) {
      effectivePrecision = formatterPrecision;
    } else if (type == null || type === "f" || type === "%") {
      effectivePrecision = fractionDigits ?? defaultFormatterPrecision;
    } else {
      effectivePrecision = defaultFormatterPrecision;
    }
    let result = formatBody(n, effectivePrecision);
    if (trim) {
      result = removeTrailingZeros(result);
    }
    if (comma != null) {
      result = insertSeparator(result, comma);
    }
    const symbolPrefix = getSymbolPrefix(symbol, type);
    const symbolPrefixLength = symbolPrefix?.length ?? 0;
    if (symbolPrefix !== "") {
      result = `${symbolPrefix}${result}`;
    }
    if (type === "s") {
      result = `${result}${getSIPrefix(n)}`;
    }
    if (type === "%" || type === "p") {
      result = `${result}%`;
    }
    const { value: signedResult, prefixLength: signPrefixLength } = addSign(n, result, sign);
    const totalPrefixLength = signPrefixLength + symbolPrefixLength;
    let output = signedResult;
    if (width2 != null && !Number.isNaN(width2)) {
      output = addPadding(output, width2, padFill ?? " ", padAlign, totalPrefixLength);
    }
    output = `${prefix}${output}${suffix}`;
    return output;
  };
}
var integerTypes = {
  b: (n) => absFloor(n).toString(2),
  c: (n) => String.fromCodePoint(n),
  d: (n) => Math.round(Math.abs(n)).toFixed(0),
  o: (n) => absFloor(n).toString(8),
  x: (n) => absFloor(n).toString(16),
  X: (n) => integerTypes.x(n).toUpperCase(),
  n: (n) => integerTypes.d(n),
  "%": (n) => `${absFloor(n * 100).toFixed(0)}`
};
var decimalTypes = {
  e: (n, f) => Math.abs(n).toExponential(f),
  E: (n, f) => decimalTypes.e(n, f).toUpperCase(),
  f: (n, f) => Math.abs(n).toFixed(f),
  F: (n, f) => decimalTypes.f(n, f).toUpperCase(),
  g: (n, f) => {
    if (n === 0) {
      return "0";
    }
    const a = Math.abs(n);
    const p = Math.floor(Math.log10(a));
    if (p >= -4 && p < f) {
      return a.toFixed(f - 1 - p);
    }
    return a.toExponential(f - 1);
  },
  G: (n, f) => decimalTypes.g(n, f).toUpperCase(),
  n: (n, f) => decimalTypes.g(n, f),
  p: (n, f) => decimalTypes.r(n * 100, f),
  r: (n, f) => {
    if (n === 0) {
      return "0";
    }
    const a = Math.abs(n);
    const p = Math.floor(Math.log10(a));
    const q = p - (f - 1);
    if (q <= 0) {
      return a.toFixed(-q);
    }
    const x = 10 ** q;
    return (Math.round(a / x) * x).toFixed();
  },
  s: (n, f) => {
    const p = getSIPrefixPower(n);
    return decimalTypes.r(n / 10 ** p, f);
  },
  "%": (n, f) => decimalTypes.f(n * 100, f)
};
var minSIPrefix = -24;
var maxSIPrefix = 24;
var siPrefixes = {
  [minSIPrefix]: "y",
  [-21]: "z",
  [-18]: "a",
  [-15]: "f",
  [-12]: "p",
  [-9]: "n",
  [-6]: "\xB5",
  [-3]: "m",
  [0]: "",
  [3]: "k",
  [6]: "M",
  [9]: "G",
  [12]: "T",
  [15]: "P",
  [18]: "E",
  [21]: "Z",
  [maxSIPrefix]: "Y"
};
var minusSign = "\u2212";
function absFloor(n) {
  return Math.floor(Math.abs(n));
}
function removeTrailingZeros(numString) {
  if (!numString.endsWith("0") || !numString.includes("."))
    return numString;
  let endIndex = numString.length - 1;
  while (endIndex > 0) {
    if (numString[endIndex] == "0") {
      endIndex -= 1;
    } else if (numString[endIndex] == ".") {
      endIndex -= 1;
      break;
    } else {
      break;
    }
  }
  return numString.substring(0, endIndex + 1);
}
function insertSeparator(numString, separator) {
  let dotIndex = numString.indexOf(".");
  if (dotIndex < 0) {
    dotIndex = numString.length;
  }
  const integerChars = numString.substring(0, dotIndex).split("");
  const fractionalPart = numString.substring(dotIndex);
  for (let i = integerChars.length - 3; i > 0; i -= 3) {
    integerChars.splice(i, 0, separator);
  }
  return `${integerChars.join("")}${fractionalPart}`;
}
function getSIPrefix(n) {
  return siPrefixes[getSIPrefixPower(n)];
}
function getSIPrefixPower(n) {
  const power = n === 0 || Number.isNaN(n) ? 0 : Math.floor(Math.log10(Math.abs(n)) / 3) * 3;
  return clamp(minSIPrefix, power, maxSIPrefix);
}
function addSign(num, numString, signType = "") {
  if (signType === "(") {
    if (num >= 0) {
      return { value: numString, prefixLength: 0 };
    }
    return { value: `(${numString})`, prefixLength: 1 };
  }
  let signPrefix = "";
  if (num < 0) {
    signPrefix = minusSign;
  } else if (signType === "+") {
    signPrefix = "+";
  } else if (signType === " ") {
    signPrefix = " ";
  }
  return { value: `${signPrefix}${numString}`, prefixLength: signPrefix.length };
}
function addPadding(numString, width2, fill = " ", align2 = ">", prefixLength = 0) {
  const padSize = width2 - numString.length;
  if (padSize <= 0) {
    return numString;
  }
  const padding2 = fill.repeat(padSize);
  if (align2 === "=") {
    const clampedPrefix = Math.min(Math.max(prefixLength, 0), numString.length);
    const start2 = numString.slice(0, clampedPrefix);
    const rest = numString.slice(clampedPrefix);
    return `${start2}${padding2}${rest}`;
  }
  if (align2 === ">" || align2 === "") {
    return padding2 + numString;
  } else if (align2 === "<") {
    return `${numString}${padding2}`;
  } else if (align2 === "^") {
    const padLeft = Math.ceil(padSize / 2);
    const padRight = Math.floor(padSize / 2);
    return `${fill.repeat(padLeft)}${numString}${fill.repeat(padRight)}`;
  }
  return padding2 + numString;
}
function getSymbolPrefix(symbol, type) {
  if (symbol === "#") {
    switch (type) {
      case "b":
        return "0b";
      case "o":
        return "0o";
      case "x":
        return "0x";
      case "X":
        return "0X";
      default:
        return "";
    }
  }
  return symbol ?? "";
}

// packages/ag-charts-core/src/options/optionsDefaults.ts
var themeOperator = isThemeOperator;
var themeParams = [
  "accentColor",
  "axisLineColor",
  "backgroundColor",
  "bandHighlightColor",
  "borderColor",
  "borderRadius",
  "cardShadow",
  "chartBackgroundColor",
  "chartPadding",
  "focusShadow",
  "foregroundColor",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "gridLineColor",
  "popupShadow",
  "subtleTextColor",
  "textColor",
  "chromeBackgroundColor",
  "chromeFontFamily",
  "chromeFontSize",
  "chromeFontWeight",
  "chromeTextColor",
  "chromeSubtleTextColor",
  "dragHandleColor",
  "axisLabelColor",
  "axisLabelFontFamily",
  "axisLabelFontSize",
  "axisLabelFontWeight",
  "axisTitleColor",
  "axisTitleFontFamily",
  "axisTitleFontSize",
  "axisTitleFontWeight",
  "buttonBackgroundColor",
  "buttonBorder",
  "buttonFontWeight",
  "buttonTextColor",
  "buttonHoverBackgroundColor",
  "buttonHoverBorder",
  "buttonHoverTextColor",
  "buttonActiveBackgroundColor",
  "buttonActiveBorder",
  "buttonActiveTextColor",
  "buttonDisabledBackgroundColor",
  "buttonDisabledBorder",
  "buttonDisabledTextColor",
  "inputBackgroundColor",
  "inputBorder",
  "inputPlaceholderTextColor",
  "inputTextColor",
  "menuBackgroundColor",
  "menuBorder",
  "menuSeparatorColor",
  "menuTextColor",
  "panelBackgroundColor",
  "panelSubtleTextColor",
  "tooltipBackgroundColor",
  "tooltipBorder",
  "tooltipTextColor",
  "tooltipSubtleTextColor",
  "crosshairLabelBackgroundColor",
  "crosshairLabelTextColor",
  "titleFontSize",
  "titleFontWeight",
  "titleFontFamily",
  "titleColor",
  "subtitleFontSize",
  "subtitleFontWeight",
  "subtitleFontFamily",
  "subtitleColor",
  "footnoteFontSize",
  "footnoteFontWeight",
  "footnoteFontFamily",
  "footnoteColor",
  "groupedCategoryLineColor",
  "legendBorder",
  "legendBorderRadius",
  "legendItemHorizontalPadding",
  "legendItemVerticalPadding",
  "legendLabelColor",
  "legendLabelFontFamily",
  "legendLabelFontSize",
  "legendLabelFontWeight",
  "legendMarkerSize",
  "legendPadding",
  "navigatorTrackBackgroundColor",
  "navigatorTrackBorder",
  "navigatorThumbBackgroundColor",
  "navigatorHandleBackgroundColor",
  "navigatorHandleBorder",
  "scrollbarTrackBackgroundColor",
  "scrollbarTrackBorder",
  "scrollbarThumbBackgroundColor",
  "scrollbarThumbBorder",
  "scrollbarThumbHoverBackgroundColor",
  "scrollbarThumbHoverBorder",
  "seriesLabelBorder",
  "seriesLabelFontFamily",
  "seriesLabelFontSize",
  "seriesLabelFontWeight",
  "seriesLabelInsideBackgroundColor",
  "seriesLabelInsideTextColor",
  "seriesLabelOutsideBackgroundColor",
  "seriesLabelOutsideTextColor"
];
var themeParamsValidator = /*#__PURE__*/ union(...themeParams);
function isColorVar(value) {
  if (!value.startsWith("var(--") || !value.endsWith(")"))
    return false;
  let depth = 0;
  for (let i = 3; i < value.length; i++) {
    if (value[i] === "(")
      depth++;
    else if (value[i] === ")" && --depth === 0)
      return i === value.length - 1;
  }
  return false;
}
var ontoColorValidator = /*#__PURE__*/ attachDescription(
  (value) => typeof value === "string" && (isColorVar(value) || Color.validColorString(value)),
  "a literal color or var()"
);
var colorRefDef = /*#__PURE__*/ attachDescription(
  optionsDefs({
    ref: themeParamsValidator,
    mix: positiveNumber,
    // mix is silently clamped to 0-1 ratio to match Grid
    onto: themeParamsValidator,
    ontoColor: ontoColorValidator
  }),
  "a color ref"
);
var colorRefMixOnto = /*#__PURE__*/ attachDescription((value) => {
  return !isObject(value) || !("onto" in value || "ontoColor" in value) || "mix" in value;
}, "where a color ref with [onto] or [ontoColor] must also have [mix]");
var colorRef = /*#__PURE__*/ and(colorRefDef, colorRefMixOnto);
var colorOrRef = /*#__PURE__*/ or(color, themeOperator, colorRef);
var colorStop = /*#__PURE__*/ optionsDefs({ color: colorOrRef, stop: ratio }, "");
var colorStopsOrderValidator = /*#__PURE__*/ attachDescription((value) => {
  let lastStop = -Infinity;
  for (const item of value) {
    if (item?.stop != null) {
      if (item.stop < lastStop) {
        return false;
      }
      lastStop = item.stop;
    }
  }
  return true;
}, "colour stops to be defined in ascending order");
var gradientColorStops = /*#__PURE__*/ and(arrayLength(2), arrayOf(colorStop), colorStopsOrderValidator);
var colorScaleColorStop = /*#__PURE__*/ optionsDefs(
  { color: required(colorOrRef), stop: numericValue, name: string },
  "a color scale color stop"
);
var colorScaleOptionsDef = /*#__PURE__*/ optionsDefs(
  {
    fills: and(arrayLength(2), arrayOf(colorScaleColorStop), colorStopsOrderValidator),
    domain: and(
      arrayLength(2),
      arrayOf(numericValue),
      attachDescription(
        // Mixed bigint/number comparison is safe — only arithmetic mixing throws.
        (value) => value[0] <= value[1],
        "domain to be in ascending order"
      )
    ),
    mode: union("continuous", "discrete"),
    missingDataFill: colorOrRef
  },
  "a colour scale configuration"
);
var gradientBounds = /*#__PURE__*/ union("axis", "item", "series");
var gradientStrictDefs = /*#__PURE__*/ (() => ({
  type: required(constant("gradient")),
  colorStops: required(gradientColorStops),
  rotation: number,
  // @ts-expect-error undocumented option
  gradient: undocumented(union("linear", "radial", "conic")),
  bounds: undocumented(gradientBounds),
  reverse: undocumented(boolean),
  colorSpace: undocumented(union("rgb", "oklch"))
}))();
var gradientStrict = /*#__PURE__*/ optionsDefs(
  gradientStrictDefs,
  "a gradient object with colour stops"
);
var strokeOptionsDef = {
  stroke: colorOrRef,
  strokeWidth: positiveNumber,
  strokeOpacity: ratio
};
var fillGradientDefaults = /*#__PURE__*/ optionsDefs({
  type: required(constant("gradient")),
  gradient: required(union("linear", "radial", "conic")),
  bounds: required(gradientBounds),
  colorStops: required(or(gradientColorStops, and(arrayLength(2), arrayOf(colorOrRef)))),
  rotation: required(number),
  reverse: required(boolean),
  colorSpace: required(union("rgb", "oklch"))
});
var fillPatternDefaults = /*#__PURE__*/ optionsDefs({
  type: required(constant("pattern")),
  pattern: required(
    union(
      "vertical-lines",
      "horizontal-lines",
      "forward-slanted-lines",
      "backward-slanted-lines",
      "circles",
      "squares",
      "triangles",
      "diamonds",
      "stars",
      "hearts",
      "crosses"
    )
  ),
  path: stringLength(2),
  width: required(positiveNumber),
  height: required(positiveNumber),
  fill: required(colorOrRef),
  fillOpacity: required(ratio),
  backgroundFill: required(colorOrRef),
  backgroundFillOpacity: required(ratio),
  padding: required(positiveNumber),
  rotation: required(number),
  scale: required(positiveNumber),
  stroke: required(colorOrRef),
  strokeWidth: required(positiveNumber),
  strokeOpacity: required(ratio)
});
var fillImageDefaults = /*#__PURE__*/ optionsDefs({
  type: required(constant("image")),
  url: string,
  width: positiveNumber,
  height: positiveNumber,
  rotation: required(number),
  backgroundFill: required(colorOrRef),
  backgroundFillOpacity: ratio,
  fit: required(union("stretch", "contain", "cover")),
  repeat: required(union("repeat", "repeat-x", "repeat-y", "no-repeat"))
});
var colorObjectDefs = /*#__PURE__*/ (() => ({
  // @ts-expect-error undocumented option
  gradient: {
    colorStops: gradientColorStops,
    rotation: number,
    gradient: undocumented(union("linear", "radial", "conic")),
    bounds: undocumented(gradientBounds),
    reverse: undocumented(boolean),
    colorSpace: undocumented(union("rgb", "oklch"))
  },
  pattern: {
    pattern: union(
      "vertical-lines",
      "horizontal-lines",
      "forward-slanted-lines",
      "backward-slanted-lines",
      "circles",
      "squares",
      "triangles",
      "diamonds",
      "stars",
      "hearts",
      "crosses"
    ),
    path: stringLength(2),
    width: positiveNumber,
    height: positiveNumber,
    rotation: number,
    scale: positiveNumber,
    fill: colorOrRef,
    fillOpacity: ratio,
    backgroundFill: colorOrRef,
    backgroundFillOpacity: ratio,
    ...strokeOptionsDef,
    padding: undocumented(positiveNumber)
  },
  image: {
    url: required(string),
    backgroundFill: colorOrRef,
    backgroundFillOpacity: ratio,
    width: positiveNumber,
    height: positiveNumber,
    fit: union("stretch", "contain", "cover", "none"),
    repeat: union("repeat", "repeat-x", "repeat-y", "no-repeat"),
    rotation: number
  }
}))();
var colorObject = /*#__PURE__*/ typeUnion(colorObjectDefs, "a color object");
var colorUnion = /*#__PURE__*/ or(color, optionsDefs(colorObject, "a color object"), themeOperator, colorRef);
var simpleColorUnion = /*#__PURE__*/ or(color, optionsDefs(colorObject, "a color object"));
var fillOptionsDef = /*#__PURE__*/ (() => ({
  fill: colorUnion,
  fillOpacity: ratio,
  ...undocumentedDefs({
    fillGradientDefaults,
    fillPatternDefaults,
    fillImageDefaults
  })
}))();
var fillCssOptionsDef = {
  fill: colorOrRef,
  fillOpacity: ratio
};
var lineDashOptionsDef = /*#__PURE__*/ (() => ({
  lineDash: arrayOf(positiveNumber),
  lineDashOffset: number
}))();
var barHighlightOptionsDef = {
  ...fillOptionsDef,
  ...strokeOptionsDef,
  ...lineDashOptionsDef,
  opacity: ratio,
  cornerRadius: positiveNumber
};
var lineHighlightOptionsDef = {
  ...strokeOptionsDef,
  ...lineDashOptionsDef,
  opacity: ratio
};
var shapeHighlightOptionsDef = {
  ...fillOptionsDef,
  ...strokeOptionsDef,
  ...lineDashOptionsDef,
  opacity: ratio
};
var shapeSelectionOptionsDef = shapeHighlightOptionsDef;
var selectionContainmentValidator = /*#__PURE__*/ strictUnion()("any", "all");
function highlightOptionsDef(itemHighlightOptionsDef) {
  return {
    enabled: boolean,
    range: union("tooltip", "node"),
    highlightedItem: itemHighlightOptionsDef,
    unhighlightedItem: itemHighlightOptionsDef
  };
}
function selectionOptionsDef(itemSelectionOptionsDef) {
  return {
    enabled: boolean,
    containment: selectionContainmentValidator,
    selectedItem: itemSelectionOptionsDef,
    unselectedItem: itemSelectionOptionsDef,
    unselectedSeries: itemSelectionOptionsDef
  };
}
function multiSeriesHighlightOptionsDef(itemHighlightOptionsDef, seriesHighlightOptionsDef) {
  return {
    enabled: boolean,
    range: union("tooltip", "node"),
    highlightedItem: itemHighlightOptionsDef,
    unhighlightedItem: itemHighlightOptionsDef,
    highlightedSeries: seriesHighlightOptionsDef,
    unhighlightedSeries: seriesHighlightOptionsDef,
    bringToFront: boolean
  };
}
var shapeSegmentOptions = {
  start: defined,
  stop: defined,
  ...strokeOptionsDef,
  ...fillOptionsDef,
  ...lineDashOptionsDef
};
var lineSegmentOptions = {
  start: defined,
  stop: defined,
  ...strokeOptionsDef,
  ...lineDashOptionsDef
};
var shapeSegmentation = /*#__PURE__*/ optionsDefs(
  {
    enabled: boolean,
    key: required(union("x", "y")),
    segments: arrayOfDefs(shapeSegmentOptions, "path segments array")
  },
  "a segmentation object",
  true
);
var lineSegmentation = /*#__PURE__*/ optionsDefs(
  {
    enabled: boolean,
    key: required(union("x", "y")),
    segments: arrayOfDefs(lineSegmentOptions, "path segments array")
  },
  "a segmentation object",
  true
);
var googleFont = /*#__PURE__*/ optionsDefs({ googleFont: string }, "google font");
var fontFamilyFull = /*#__PURE__*/ or(string, themeOperator, googleFont, arrayOf(or(string, googleFont)));
var fontWeight = /*#__PURE__*/ or(positiveNumber, union("normal", "bold", "bolder", "lighter"));
var fontOptionsDef = /*#__PURE__*/ (() => ({
  color: colorOrRef,
  fontFamily: fontFamilyFull,
  fontSize: positiveNumber,
  fontStyle: union("normal", "italic", "oblique"),
  fontWeight
}))();
var textWrap = /*#__PURE__*/ union("never", "always", "hyphenate", "on-space");
var textAlign = /*#__PURE__*/ union("left", "center", "right", "start", "end");
var verticalAlign = /*#__PURE__*/ union("top", "middle", "bottom");
var overflowStrategy = /*#__PURE__*/ union("ellipsis", "hide");
var paddingOptions = /*#__PURE__*/ optionsDefs(
  { top: positiveNumber, right: positiveNumber, bottom: positiveNumber, left: positiveNumber },
  "padding object"
);
var padding = /*#__PURE__*/ or(positiveNumber, paddingOptions);
var signedPaddingOptions = /*#__PURE__*/ optionsDefs(
  { top: number, right: number, bottom: number, left: number },
  "padding object"
);
var signedPadding = /*#__PURE__*/ or(number, signedPaddingOptions);
var borderOptionsDef = {
  enabled: boolean,
  stroke: colorOrRef,
  strokeWidth: positiveNumber,
  strokeOpacity: ratio
};
var labelBoxOptionsDef = {
  border: borderOptionsDef,
  cornerRadius: number,
  padding,
  ...fillOptionsDef
};

// packages/ag-charts-core/src/options/chartDefaults.ts
var legendPlacementLiterals = [
  "top",
  "top-right",
  "top-left",
  "bottom",
  "bottom-right",
  "bottom-left",
  "right",
  "right-top",
  "right-bottom",
  "left",
  "left-top",
  "left-bottom"
];
var legendPositionOptionsDef = /*#__PURE__*/ (() => ({
  floating: boolean,
  placement: union(...legendPlacementLiterals),
  xOffset: number,
  yOffset: number
}))();
var legendPositionValidator = /*#__PURE__*/ attachDescription(
  (value, context) => {
    let result;
    if (typeof value === "string") {
      const allowedValues = legendPlacementLiterals;
      if (allowedValues.includes(value)) {
        result = true;
      } else {
        result = { valid: false, invalid: [], cleared: null };
        result.invalid.push(
          new ValidationError(
            "invalid" /* Invalid */,
            `a legend placement string: ["${legendPlacementLiterals.join('", "')}"]`,
            value,
            context.path
          )
        );
      }
    } else {
      const { cleared, invalid } = validate(value, legendPositionOptionsDef, context.path, context.params);
      result = { valid: invalid.length === 0, cleared, invalid };
    }
    return result;
  },
  `a legend position object or placement string`
);
var shapeValidator = /*#__PURE__*/ or(
  union("circle", "cross", "diamond", "heart", "plus", "pin", "square", "star", "triangle"),
  callback
);
var tooltipPlacementDef = /*#__PURE__*/ unionOrArray(
  "top",
  "right",
  "bottom",
  "left",
  "top-right",
  "bottom-right",
  "bottom-left",
  "top-left",
  "center"
);
var rangeValidator = /*#__PURE__*/ or(positiveNumber, union("exact", "nearest", "area"));
var seriesTooltipRangeValidator = /*#__PURE__*/ or(positiveNumber, union("exact", "nearest"));
var verticalAlignValidator = /*#__PURE__*/ union("baseline", "top", "middle", "bottom");
var textSegmentValidator = /*#__PURE__*/ optionsDefs({
  type: constant("text"),
  text: required(string),
  verticalAlign: verticalAlignValidator,
  lineHeight: positiveNumber,
  minimumFontSize: and(positiveNumberNonZero, lessThanOrEqual("fontSize")),
  ...fontOptionsDef
});
var imageSegmentValidator = /*#__PURE__*/ optionsDefs({
  type: required(constant("image")),
  url: required(string),
  width: required(positiveNumber),
  height: required(positiveNumber),
  alt: string,
  verticalAlign: verticalAlignValidator,
  overflowStrategy: union("keep", "hide"),
  padding,
  cornerRadius: positiveNumber,
  backgroundFill: color,
  block: boolean
});
var segmentValidator = /*#__PURE__*/ or(textSegmentValidator, imageSegmentValidator);
var textOrSegments = /*#__PURE__*/ or(
  string,
  // A label/formatter may return an out-of-safe-range bigint, which stringifies for display like any number.
  numericValue,
  date,
  arrayOf(segmentValidator, "text or image segments array", false)
);
var chartCaptionOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  text: textOrSegments,
  textAlign,
  wrapping: textWrap,
  spacing: positiveNumber,
  maxWidth: positiveNumber,
  maxHeight: positiveNumber,
  minimumFontSize: and(positiveNumberNonZero, lessThanOrEqual("fontSize")),
  ...fontOptionsDef,
  ...labelBoxOptionsDef,
  tooltip: {
    visible: union("auto", "always", "never"),
    text: string,
    renderer: callbackOf(or(string, number, date))
  },
  listeners: {
    click: callback,
    doubleClick: callback
  },
  ...undocumentedDefs({
    truncate: boolean,
    layoutStyle: union("block", "overlay")
  })
}))();
var chartOverlayOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  text: textOrSegments,
  renderer: callbackOf(or(string, number, date, htmlElement))
}))();
var contextMenuItemLiterals = [
  "defaults",
  "download",
  "zoom-to-cursor",
  "pan-to-cursor",
  "reset-zoom",
  "toggle-series-visibility",
  "toggle-other-series",
  "separator"
];
var contextMenuItemObjectDef = /*#__PURE__*/ (() => ({
  type: strictUnion()("action", "separator"),
  showOn: strictUnion()(
    "always",
    "axis",
    "caption",
    "cross-line",
    "series-area",
    "series-node",
    "legend-item"
  ),
  label: required(string),
  enabled: boolean,
  action: callback,
  items: (value, context) => contextMenuItemsArray(value, context),
  ...undocumentedDefs({
    iconUrl: string
  })
}))();
var contextMenuItemObjectValidator = /*#__PURE__*/ optionsDefs(contextMenuItemObjectDef);
var contextMenuItemValidator = /*#__PURE__*/ attachDescription(
  (value, context) => {
    let result;
    if (typeof value === "string") {
      const allowedValues = contextMenuItemLiterals;
      if (allowedValues.includes(value)) {
        result = true;
      } else {
        result = { valid: false, invalid: [], cleared: null };
        result.invalid.push(
          new ValidationError(
            "invalid" /* Invalid */,
            `a context menu item string alias: ["${contextMenuItemLiterals.join('", "')}"]`,
            value,
            context.path
          )
        );
      }
    } else {
      result = contextMenuItemObjectValidator(value, context);
    }
    return result;
  },
  `a context menu item object or string alias: [${contextMenuItemLiterals.join(", ")}]`
);
var contextMenuItemsArray = /*#__PURE__*/ arrayOf(contextMenuItemValidator, "a menu items array", false);
var toolbarButtonOptionsDefs = /*#__PURE__*/ (() => ({
  label: string,
  ariaLabel: string,
  tooltip: string,
  iconPosition: union("before", "after"),
  icon: union(
    "align-center",
    "align-left",
    "align-right",
    "arrow-drawing",
    "arrow-down-drawing",
    "arrow-up-drawing",
    "callout-annotation",
    "candlestick-series",
    "chevron-filled-down",
    "chevron-right",
    "close",
    "comment-annotation",
    "date-range-drawing",
    "date-price-range-drawing",
    "delete",
    "disjoint-channel-drawing",
    "drag-handle",
    "fill-color",
    "line-style-solid",
    "line-style-dashed",
    "line-style-dotted",
    "high-low-series",
    "hlc-series",
    "hollow-candlestick-series",
    "horizontal-line-drawing",
    "line-color",
    "line-series",
    "line-with-markers-series",
    "locked",
    "measurer-drawing",
    "note-annotation",
    "ohlc-series",
    "pan-end",
    "pan-left",
    "pan-right",
    "pan-start",
    "parallel-channel-drawing",
    "position-bottom",
    "position-center",
    "position-top",
    "price-label-annotation",
    "price-range-drawing",
    "reset",
    "settings",
    "step-line-series",
    "text-annotation",
    "trend-line-drawing",
    "fibonacci-retracement-drawing",
    "fibonacci-retracement-trend-based-drawing",
    "unlocked",
    "vertical-line-drawing",
    "zoom-in",
    "zoom-out"
  )
}))();
var formatter = /*#__PURE__*/ or(string, callbackOf(textOrSegments));
var formatObjectValidator = /*#__PURE__*/ optionsDefs({
  x: formatter,
  y: formatter,
  angle: formatter,
  radius: formatter,
  size: formatter,
  color: formatter,
  label: formatter,
  secondaryLabel: formatter,
  sectorLabel: formatter,
  calloutLabel: formatter,
  legendItem: formatter
});
var numberFormatValidator = /*#__PURE__*/ attachDescription(isValidNumberFormat, "a valid number format string");
var timeIntervalUnit = /*#__PURE__*/ union("millisecond", "second", "minute", "hour", "day", "month", "year");
var timeIntervalDefs = /*#__PURE__*/ (() => ({
  unit: required(timeIntervalUnit),
  step: positiveNumberNonZero,
  epoch: date,
  utc: boolean,
  // Required for interop.
  ...undocumentedDefs({ every: callback })
}))();
var timeInterval = /*#__PURE__*/ optionsDefs(timeIntervalDefs, "a time interval object");
var legendOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  position: legendPositionValidator,
  orientation: union("horizontal", "vertical"),
  maxWidth: positiveNumber,
  maxHeight: positiveNumber,
  spacing: positiveNumber,
  border: borderOptionsDef,
  cornerRadius: number,
  padding,
  fill: colorUnion,
  fillOpacity: ratio,
  preventHidingAll: boolean,
  reverseOrder: boolean,
  toggleSeries: boolean,
  item: {
    marker: {
      size: positiveNumber,
      shape: shapeValidator,
      padding,
      strokeWidth: positiveNumber,
      disabledStyle: {
        opacity: ratio,
        ...fillOptionsDef,
        ...strokeOptionsDef
      }
    },
    line: {
      length: positiveNumber,
      strokeWidth: positiveNumber,
      disabledStyle: {
        opacity: ratio,
        stroke: colorOrRef,
        strokeOpacity: ratio,
        ...lineDashOptionsDef
      }
    },
    label: {
      maxLength: positiveNumber,
      formatter: callback,
      ...fontOptionsDef,
      disabledStyle: {
        opacity: ratio,
        color: colorOrRef
      }
    },
    tooltip: {
      visible: union("auto", "always", "never"),
      text: string,
      renderer: callback
    },
    maxWidth: positiveNumber,
    padding,
    showSeriesStroke: boolean
  },
  pagination: {
    marker: {
      size: positiveNumber,
      shape: shapeValidator,
      padding
    },
    activeStyle: {
      ...fillOptionsDef,
      ...strokeOptionsDef
    },
    inactiveStyle: {
      ...fillOptionsDef,
      ...strokeOptionsDef
    },
    highlightStyle: {
      ...fillOptionsDef,
      ...strokeOptionsDef
    },
    label: fontOptionsDef
  },
  listeners: {
    legendItemClick: callback,
    legendItemDoubleClick: callback
  }
}))();
var gradientLegendOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  position: legendPositionValidator,
  spacing: positiveNumber,
  reverseOrder: boolean,
  border: borderOptionsDef,
  cornerRadius: number,
  padding,
  fill: colorUnion,
  fillOpacity: ratio,
  gradient: {
    preferredLength: positiveNumber,
    thickness: positiveNumber
  },
  scale: {
    label: {
      ...fontOptionsDef,
      minSpacing: positiveNumber,
      format: numberFormatValidator,
      formatter: callback
    },
    padding: positiveNumber,
    interval: {
      step: number,
      values: array,
      minSpacing: and(positiveNumber, lessThan("maxSpacing")),
      maxSpacing: and(positiveNumber, greaterThan("minSpacing"))
    }
  }
}))();
var commonChartOptionsDefs = /*#__PURE__*/ (() => ({
  width: positiveNumber,
  height: positiveNumber,
  minWidth: positiveNumber,
  minHeight: positiveNumber,
  suppressFieldDotNotation: boolean,
  title: chartCaptionOptionsDefs,
  subtitle: chartCaptionOptionsDefs,
  footnote: chartCaptionOptionsDefs,
  padding: or(themeOperator, padding),
  seriesArea: {
    border: borderOptionsDef,
    clip: boolean,
    cornerRadius: number,
    padding: or(themeOperator, padding)
  },
  listeners: {
    seriesNodeClick: callback,
    seriesNodeDoubleClick: callback,
    axisClick: callback,
    axisDoubleClick: callback,
    captionClick: callback,
    captionDoubleClick: callback,
    seriesVisibilityChange: callback,
    activeChange: callback,
    selectionChange: callback,
    collapsedChange: callback,
    click: callback,
    doubleClick: callback,
    crossLineClick: callback,
    crossLineDoubleClick: callback,
    annotations: callback,
    zoom: callback
  },
  loadGoogleFonts: boolean,
  highlight: {
    enabled: boolean,
    drawingMode: union("overlay", "cutout"),
    range: union("tooltip", "node"),
    mode: union("single", "shared")
  },
  overlays: {
    loading: chartOverlayOptionsDefs,
    noData: chartOverlayOptionsDefs,
    noVisibleSeries: chartOverlayOptionsDefs,
    unsupportedBrowser: chartOverlayOptionsDefs
  },
  tooltip: {
    enabled: boolean,
    showArrow: boolean,
    pagination: boolean,
    delay: positiveNumber,
    range: rangeValidator,
    wrapping: textWrap,
    mode: union("single", "shared", "compact"),
    position: {
      anchorTo: union("pointer", "node", "chart"),
      placement: tooltipPlacementDef,
      xOffset: number,
      yOffset: number,
      offset: positiveNumber
    }
  },
  context: () => true,
  keyboard: {
    enabled: boolean,
    tabIndex: number,
    initialFocus: strictUnion()("data-start", "data-end", "viewport-start", "viewport-end")
  },
  touch: {
    dragAction: union("none", "drag", "hover")
  },
  background: {
    visible: boolean,
    fill: colorOrRef,
    // enterprise
    image: {
      url: required(string),
      top: number,
      right: number,
      bottom: number,
      left: number,
      width: positiveNumber,
      height: positiveNumber,
      opacity: ratio
    }
  },
  styleNonce: string,
  formatter: or(callbackOf(textOrSegments), formatObjectValidator),
  enableRtl: boolean,
  ...undocumentedDefs({
    statusBar: defined,
    foreground: {
      visible: boolean,
      text: string,
      image: {
        url: string,
        top: number,
        right: number,
        bottom: number,
        left: number,
        width: positiveNumber,
        height: positiveNumber,
        opacity: ratio
      },
      ...fillOptionsDef
    },
    overrideDevicePixelRatio: number,
    displayNullData: boolean,
    mode: union("integrated", "standalone")
  })
}))();
var commonSeriesThemeableOptionsDefs = /*#__PURE__*/ (() => ({
  cursor: string,
  context: () => true,
  showInLegend: boolean,
  nodeClickRange: rangeValidator,
  listeners: {
    seriesNodeClick: callback,
    seriesNodeDoubleClick: callback
  },
  highlight: highlightOptionsDef(shapeHighlightOptionsDef),
  selection: selectionOptionsDef(shapeSelectionOptionsDef),
  ...undocumentedDefs({
    allowNullKeys: boolean
  })
}))();
var commonSeriesOptionsDefs = /*#__PURE__*/ (() => ({
  ...commonSeriesThemeableOptionsDefs,
  id: string,
  visible: boolean,
  context: () => true,
  data: array,
  ...undocumentedDefs({
    seriesGrouping: defined
  })
}))();
var shadowOptionsDefs = {
  enabled: boolean,
  xOffset: number,
  yOffset: number,
  blur: positiveNumber,
  spread: positiveNumber,
  color: colorOrRef
};
function shadowHighlightOptionsDef(itemHighlightOptionsDef) {
  return {
    ...highlightOptionsDef(itemHighlightOptionsDef),
    highlightedItem: { ...itemHighlightOptionsDef, shadow: shadowOptionsDefs }
  };
}
function multiSeriesShadowHighlightOptionsDef(itemHighlightOptionsDef, seriesHighlightOptionsDef) {
  return {
    ...multiSeriesHighlightOptionsDef(itemHighlightOptionsDef, seriesHighlightOptionsDef),
    highlightedItem: { ...itemHighlightOptionsDef, shadow: shadowOptionsDefs }
  };
}
var markerStyleOptionsDefs = {
  shape: shapeValidator,
  size: positiveNumber,
  ...fillOptionsDef,
  ...strokeOptionsDef,
  ...lineDashOptionsDef
};
var markerOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  shadow: shadowOptionsDefs,
  itemStyler: callbackDefs({
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    shape: shapeValidator,
    size: positiveNumber
  }),
  ...markerStyleOptionsDefs
}))();
var labelCollisionPlacementDef = /*#__PURE__*/ unionOrArray(
  "inside",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right"
);
var labelOrientationDef = /*#__PURE__*/ unionOrArray("horizontal", "vertical", "vertical-reversed");
var collisionOptionsDef = /*#__PURE__*/ (() => ({
  threshold: number,
  alwaysShow: boolean,
  ...undocumentedDefs({
    collideWith: {
      markers: boolean,
      labels: boolean,
      seriesItems: boolean,
      seriesArea: boolean,
      axisLabels: boolean
    }
  })
}))();
var seriesLabelOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  formatter: callbackOf(textOrSegments),
  format: numberFormatValidator,
  itemStyler: callbackDefs({
    enabled: boolean,
    ...labelBoxOptionsDef,
    ...fontOptionsDef
  }),
  ...labelBoxOptionsDef,
  ...fontOptionsDef
}))();
var labelFitOptionsDefs = {
  maxWidth: positiveNumber,
  maxHeight: positiveNumber,
  wrapping: textWrap,
  truncate: boolean
};
var undocumentedLabelFitOptionsDefs = /*#__PURE__*/ (() => ({
  maxWidth: undocumented(positiveNumber),
  maxHeight: undocumented(positiveNumber),
  wrapping: undocumented(textWrap),
  truncate: undocumented(boolean)
}))();
var labelAutoFontSizeOptionsDefs = /*#__PURE__*/ (() => ({
  minimumFontSize: and(positiveNumberNonZero, lessThanOrEqual("fontSize"))
}))();
var labelCollisionFitOptionsDefs = {
  ...labelFitOptionsDefs,
  collision: collisionOptionsDef
};
var labelPlacementStyleOptionsDef = {
  color: colorOrRef,
  ...labelBoxOptionsDef
};
var labelPlacementStyleDefs = {
  insideStyle: labelPlacementStyleOptionsDef,
  outsideStyle: labelPlacementStyleOptionsDef
};
var placedSeriesLabelOptionsDefs = {
  ...seriesLabelOptionsDefs,
  ...labelCollisionFitOptionsDefs,
  ...labelAutoFontSizeOptionsDefs,
  ...labelPlacementStyleDefs,
  placement: labelCollisionPlacementDef,
  spacing: positiveNumber
};
var autoSizedLabelOptionsDefs = /*#__PURE__*/ (() => ({
  ...seriesLabelOptionsDefs,
  lineHeight: positiveNumber,
  minimumFontSize: and(positiveNumber, lessThanOrEqual("fontSize")),
  wrapping: textWrap,
  truncate: boolean,
  collision: collisionOptionsDef,
  overflowStrategy: deprecated(overflowStrategy, "Use `truncate` instead.")
}))();
var errorBarThemeableOptionsDefs = {
  visible: boolean,
  cap: {
    visible: boolean,
    length: positiveNumber,
    lengthRatio: ratio,
    ...strokeOptionsDef,
    ...lineDashOptionsDef
  },
  ...strokeOptionsDef,
  ...lineDashOptionsDef
};
var errorBarOptionsDefs = /*#__PURE__*/ (() => ({
  ...errorBarThemeableOptionsDefs,
  xLowerKey: string,
  xUpperKey: string,
  yLowerKey: string,
  yUpperKey: string,
  xLowerName: string,
  xUpperName: string,
  yLowerName: string,
  yUpperName: string,
  itemStyler: callbackDefs({
    visible: boolean,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cap: {
      visible: boolean,
      length: positiveNumber,
      lengthRatio: ratio,
      ...strokeOptionsDef,
      ...lineDashOptionsDef
    }
  })
}))();
var tooltipOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  showArrow: boolean,
  range: seriesTooltipRangeValidator,
  renderer: callbackOf(
    or(
      string,
      number,
      date,
      optionsDefs(
        {
          heading: string,
          title: string,
          symbol: {
            marker: {
              enabled: boolean,
              shape: shapeValidator,
              ...fillOptionsDef,
              stroke: colorOrRef,
              strokeOpacity: ratio,
              strokeWidth: positiveNumber,
              ...lineDashOptionsDef
            },
            line: {
              enabled: boolean,
              stroke: colorOrRef,
              strokeWidth: positiveNumber,
              strokeOpacity: ratio,
              ...lineDashOptionsDef
            }
          },
          data: arrayOfDefs({
            label: required(string),
            value: required(or(string, number, date))
          })
        },
        "tooltip renderer result object"
      )
    )
  ),
  position: {
    anchorTo: union("node", "pointer", "chart"),
    placement: tooltipPlacementDef,
    xOffset: number,
    yOffset: number,
    offset: positiveNumber
  },
  interaction: {
    enabled: boolean
  }
}))();
var tooltipOptionsDefsWithArea = {
  ...tooltipOptionsDefs,
  range: rangeValidator
};
var interpolationOptionsDefs = /*#__PURE__*/ typeUnion(
  {
    linear: {},
    smooth: {
      tension: ratio
    },
    step: {
      position: union("start", "middle", "end")
    }
  },
  "interpolation line options"
);

// packages/ag-charts-core/src/options/axesOptionsDefs.ts
var commonCrossLineLabelOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  text: string,
  // Signed: label padding positions the label relative to the line, so negative values are meaningful.
  padding: signedPadding,
  border: borderOptionsDef,
  cornerRadius: number,
  ...fontOptionsDef,
  ...fillOptionsDef,
  ...undocumentedDefs({ overflow: union("pad-chart", "realign-text", "clip-text") })
}))();
var crossLineCommonStyleOptionsDefs = {
  enabled: boolean,
  ...strokeOptionsDef,
  ...lineDashOptionsDef
};
var crossLineListenersOptionsDefs = {
  click: callback,
  doubleClick: callback
};
var crossLineStyleOptionsDefs = {
  ...crossLineCommonStyleOptionsDefs,
  fill: colorOrRef,
  fillOpacity: ratio
};
var radiusCrossLineLabelOptionsDefs = {
  ...commonCrossLineLabelOptionsDefs,
  positionAngle: number
};
function crossLineOptionsDefs(value, labelDefs) {
  const commonStyle = {
    id: string,
    listeners: crossLineListenersOptionsDefs,
    ...crossLineCommonStyleOptionsDefs,
    label: labelDefs
  };
  return typeUnion(
    {
      line: { value: required(value), ...commonStyle },
      range: {
        range: required(and(arrayOf(value), arrayLength(2, 2))),
        fill: colorOrRef,
        fillOpacity: ratio,
        ...commonStyle
      }
    },
    "cross-line options"
  );
}
var crossLineLabelPlacements = {
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
  start: "start",
  end: "end",
  "top-left": "top-left",
  "top-right": "top-right",
  "top-start": "top-start",
  "top-end": "top-end",
  "bottom-left": "bottom-left",
  "bottom-right": "bottom-right",
  "bottom-start": "bottom-start",
  "bottom-end": "bottom-end",
  "left-top": "left-top",
  "left-bottom": "left-bottom",
  "right-top": "right-top",
  "right-bottom": "right-bottom",
  "start-top": "start-top",
  "start-bottom": "start-bottom",
  "end-top": "end-top",
  "end-bottom": "end-bottom",
  inside: "inside",
  "inside-top": "inside-top",
  "inside-bottom": "inside-bottom",
  "inside-left": "inside-left",
  "inside-right": "inside-right",
  "inside-start": "inside-start",
  "inside-end": "inside-end",
  "inside-top-left": "inside-top-left",
  "inside-top-right": "inside-top-right",
  "inside-top-start": "inside-top-start",
  "inside-top-end": "inside-top-end",
  "inside-bottom-left": "inside-bottom-left",
  "inside-bottom-right": "inside-bottom-right",
  "inside-bottom-start": "inside-bottom-start",
  "inside-bottom-end": "inside-bottom-end"
};
var cartesianCrossLineLabelOptionsDefs = /*#__PURE__*/ (() => ({
  ...commonCrossLineLabelOptionsDefs,
  position: deprecated(
    union(
      "top",
      "left",
      "right",
      "bottom",
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
      "inside",
      "inside-left",
      "inside-right",
      "inside-top",
      "inside-bottom",
      "inside-top-left",
      "inside-bottom-left",
      "inside-top-right",
      "inside-bottom-right"
    ),
    "Use `placement` instead."
  ),
  // Which values apply depends on the cross line's type and axis, so they are checked when it is laid out.
  placement: unionOrArray(crossLineLabelPlacements),
  rotation: number,
  collision: collisionOptionsDef,
  ...labelFitOptionsDefs,
  ...labelAutoFontSizeOptionsDefs,
  ...undocumentedDefs({
    reserveSpace: boolean
  })
}))();
var cartesianCrossLineOptionsDefs = /*#__PURE__*/ crossLineOptionsDefs(defined, cartesianCrossLineLabelOptionsDefs);
var commonAxisLabelOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  rotation: number,
  textAlign,
  verticalAlign,
  avoidCollisions: boolean,
  minSpacing: positiveNumber,
  spacing: positiveNumber,
  formatter: callbackOf(textOrSegments),
  itemStyler: callbackDefs({
    ...fontOptionsDef,
    ...labelBoxOptionsDef,
    spacing: number
  }),
  ...fontOptionsDef,
  ...labelBoxOptionsDef
}))();
var cartesianAxisLabelOptionsDefs = {
  autoRotate: boolean,
  autoRotateAngle: number,
  wrapping: textWrap,
  truncate: boolean,
  ...commonAxisLabelOptionsDefs
};
var cartesianNumericAxisLabel = {
  format: numberFormatValidator,
  ...cartesianAxisLabelOptionsDefs
};
var cartesianTimeAxisLabel = /*#__PURE__*/ (() => ({
  format: or(string, object),
  ...cartesianAxisLabelOptionsDefs
}))();
var cartesianAxisTick = {
  enabled: boolean,
  width: positiveNumber,
  size: positiveNumber,
  stroke: colorOrRef
};
var cartesianTimeAxisParentLevel = {
  enabled: boolean,
  label: cartesianTimeAxisLabel,
  tick: cartesianAxisTick
};
var commonAxisIntervalOptionsDefs = /*#__PURE__*/ (() => ({
  values: arrayOf(defined),
  minSpacing: positiveNumber
}))();
var commonAxisOptionsDefs = /*#__PURE__*/ (() => ({
  reverse: boolean,
  ariaLabel: string,
  gridLine: {
    enabled: boolean,
    width: positiveNumber,
    style: arrayOfDefs(
      {
        fill: colorOrRef,
        fillOpacity: positiveNumber,
        stroke: or(colorOrRef, themeOperator),
        // TODO: is `themeOperator` still needed?
        strokeWidth: positiveNumber,
        lineDash: arrayOf(positiveNumber)
      },
      "a grid-line style object array"
    )
  },
  interval: commonAxisIntervalOptionsDefs,
  label: commonAxisLabelOptionsDefs,
  line: {
    enabled: boolean,
    width: deprecated(positiveNumber, "Use `strokeWidth` instead."),
    stroke: colorOrRef,
    strokeWidth: positiveNumber,
    strokeOpacity: ratio,
    lineDash: arrayOf(positiveNumber)
  },
  tick: cartesianAxisTick,
  context: () => true,
  ...undocumentedDefs({
    layoutConstraints: {
      stacked: required(boolean),
      align: required(union("start", "end")),
      unit: required(union("percent", "px")),
      width: required(positiveNumber)
    },
    ignoreZoom: boolean,
    linkZoom: string
  })
}))();
var commonAxisCaptionOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
  text: textOrSegments,
  spacing: positiveNumber,
  maxWidth: positiveNumber,
  maxHeight: positiveNumber,
  wrapping: union("never", "always", "hyphenate", "on-space"),
  truncate: boolean,
  formatter: callbackOf(textOrSegments),
  ...fontOptionsDef
}))();
var cartesianAxisCaptionOptionsDefs = /*#__PURE__*/ (() => ({
  ...commonAxisCaptionOptionsDefs,
  orientation: union("horizontal", "vertical", "vertical-reversed"),
  ...undocumentedDefs({ _enabledFromTheme: boolean })
}))();
var cartesianAxisOptionsDefs = /*#__PURE__*/ (() => ({
  ...commonAxisOptionsDefs,
  title: cartesianAxisCaptionOptionsDefs,
  crossAt: {
    value: required(or(numericValue, date, string, arrayOf(string))),
    sticky: boolean,
    titlePlacement: union("crossing", "edge"),
    labelPlacement: union("crossing", "edge"),
    crosshairLabelPlacement: union("crossing", "edge")
  },
  crossLines: arrayOfDefs(cartesianCrossLineOptionsDefs, "a cross-line options array"),
  position: union("top", "right", "bottom", "left"),
  thickness: positiveNumber,
  maxThicknessRatio: ratio,
  listeners: {
    click: callback,
    doubleClick: callback,
    crossLineClick: callback,
    crossLineDoubleClick: callback
  }
}))();
var cartesianAxisBandHighlightOptions = {
  enabled: boolean,
  ...fillOptionsDef,
  ...strokeOptionsDef,
  ...lineDashOptionsDef
};
function cartesianAxisCrosshairOptions(canFormat, timeFormat) {
  const baseCrosshairLabel = {
    enabled: boolean,
    xOffset: number,
    yOffset: number,
    formatter: callbackOf(string),
    renderer: callbackOf(
      or(
        string,
        number,
        date,
        optionsDefs(
          {
            text: string,
            color: colorOrRef,
            backgroundColor: colorOrRef,
            opacity: ratio
          },
          "crosshair label renderer result object"
        )
      )
    )
  };
  let crosshairLabel;
  if (canFormat) {
    crosshairLabel = {
      ...baseCrosshairLabel,
      format: timeFormat ? or(
        string,
        optionsDefs({
          millisecond: string,
          second: string,
          hour: string,
          day: string,
          month: string,
          year: string
        })
      ) : string
    };
  }
  return {
    enabled: boolean,
    snap: boolean,
    label: crosshairLabel ?? baseCrosshairLabel,
    ...strokeOptionsDef,
    ...lineDashOptionsDef
  };
}
function continuousAxisOptions(validDatum, supportTimeInterval) {
  return {
    min: and(validDatum, lessThan("max")),
    max: and(validDatum, greaterThan("min")),
    preferredMin: and(validDatum, lessThan("preferredMax"), lessThan("max")),
    preferredMax: and(validDatum, greaterThan("preferredMin"), greaterThan("min")),
    nice: boolean,
    interval: {
      step: supportTimeInterval ? or(positiveNumberNonZero, timeIntervalUnit, timeInterval) : positiveNumericValueNonZero,
      values: arrayOf(validDatum),
      minSpacing: and(positiveNumber, lessThan("maxSpacing")),
      maxSpacing: and(positiveNumber, greaterThan("minSpacing"))
    }
  };
}
var discreteTimeAxisIntervalOptionsDefs = /*#__PURE__*/ (() => ({
  step: or(positiveNumberNonZero, timeIntervalUnit, timeInterval),
  values: arrayOf(or(number, date)),
  minSpacing: and(positiveNumber, lessThan("maxSpacing")),
  maxSpacing: and(positiveNumber, greaterThan("minSpacing")),
  placement: union("on", "between")
}))();
var categoryAxisOptionsDefs = /*#__PURE__*/ (() => ({
  ...cartesianAxisOptionsDefs,
  type: constant("category"),
  label: cartesianAxisLabelOptionsDefs,
  paddingInner: ratio,
  paddingOuter: ratio,
  groupPaddingInner: ratio,
  crosshair: cartesianAxisCrosshairOptions(),
  bandAlignment: union("justify", "start", "center", "end"),
  bandHighlight: cartesianAxisBandHighlightOptions,
  interval: {
    ...commonAxisIntervalOptionsDefs,
    placement: union("on", "between")
  },
  skipNullBars: boolean,
  // Set by the Volume Profile presets for the enterprise `axisInsetValue` plugin, which draws a column of
  // per-category values between the axis and the series area.
  ...undocumentedDefs({
    axisInsetValue: {
      enabled: boolean,
      position: union("left", "right", "top", "bottom"),
      width: positiveNumber,
      minWidth: positiveNumber,
      fill: colorOrRef,
      fillOpacity: ratio,
      categoryKey: string,
      valueKey: string,
      label: {
        enabled: boolean,
        ...fontOptionsDef,
        padding: positiveNumber,
        formatter: callback
      }
    }
  })
}))();
var groupedCategoryAxisOptionsDefs = /*#__PURE__*/ (() => ({
  ...cartesianAxisOptionsDefs,
  type: constant("grouped-category"),
  label: cartesianAxisLabelOptionsDefs,
  crosshair: cartesianAxisCrosshairOptions(),
  bandHighlight: cartesianAxisBandHighlightOptions,
  paddingInner: ratio,
  groupPaddingInner: ratio,
  depthOptions: arrayOfDefs(
    {
      label: {
        enabled: boolean,
        avoidCollisions: boolean,
        wrapping: union("never", "always", "hyphenate", "on-space"),
        truncate: boolean,
        rotation: number,
        spacing: number,
        ...fontOptionsDef,
        ...labelBoxOptionsDef
      },
      tick: {
        enabled: boolean,
        stroke: colorOrRef,
        width: positiveNumber
      }
    },
    "depth options objects array"
  )
}))();
var numberAxisOptionsDefs = /*#__PURE__*/ (() => ({
  ...cartesianAxisOptionsDefs,
  ...continuousAxisOptions(numericValue),
  type: constant("number"),
  label: cartesianNumericAxisLabel,
  crosshair: cartesianAxisCrosshairOptions(true),
  crossLines: arrayOfDefs(
    crossLineOptionsDefs(numericValue, cartesianCrossLineLabelOptionsDefs),
    "a cross-line options array"
  )
}))();
var logAxisOptionsDefs = /*#__PURE__*/ (() => ({
  ...cartesianAxisOptionsDefs,
  ...continuousAxisOptions(numericValue),
  type: constant("log"),
  base: and(
    positiveNumberNonZero,
    attachDescription((value) => value !== 1, "not equal to 1")
  ),
  label: cartesianNumericAxisLabel,
  crosshair: cartesianAxisCrosshairOptions(true),
  crossLines: arrayOfDefs(
    crossLineOptionsDefs(numericValue, cartesianCrossLineLabelOptionsDefs),
    "a cross-line options array"
  )
}))();
var timeAxisOptionsDefs = /*#__PURE__*/ (() => ({
  ...cartesianAxisOptionsDefs,
  ...continuousAxisOptions(or(number, date), true),
  type: constant("time"),
  label: cartesianTimeAxisLabel,
  parentLevel: cartesianTimeAxisParentLevel,
  crosshair: cartesianAxisCrosshairOptions(true, true),
  crossLines: arrayOfDefs(
    crossLineOptionsDefs(or(numericValue, date), cartesianCrossLineLabelOptionsDefs),
    "a cross-line options array"
  )
}))();
var unitTimeAxisOptionsDefs = /*#__PURE__*/ (() => ({
  ...cartesianAxisOptionsDefs,
  type: constant("unit-time"),
  unit: or(timeInterval, timeIntervalUnit),
  label: cartesianTimeAxisLabel,
  parentLevel: cartesianTimeAxisParentLevel,
  paddingInner: ratio,
  paddingOuter: ratio,
  groupPaddingInner: ratio,
  crosshair: cartesianAxisCrosshairOptions(true, true),
  bandAlignment: union("justify", "start", "center", "end"),
  bandHighlight: cartesianAxisBandHighlightOptions,
  skipNullBars: boolean,
  min: and(or(number, date), lessThan("max")),
  max: and(or(number, date), greaterThan("min")),
  preferredMin: and(or(number, date), lessThan("preferredMax"), lessThan("max")),
  preferredMax: and(or(number, date), greaterThan("preferredMin"), greaterThan("min")),
  interval: discreteTimeAxisIntervalOptionsDefs,
  crossLines: arrayOfDefs(
    crossLineOptionsDefs(or(numericValue, date), cartesianCrossLineLabelOptionsDefs),
    "a cross-line options array"
  )
}))();
function crossLineThemeOptionsDefs(label) {
  const range2 = { ...crossLineStyleOptionsDefs, label };
  return { ...range2, line: { ...crossLineCommonStyleOptionsDefs, label }, range: range2 };
}
function cartesianAxisThemeOptionsDefs(axisDefs) {
  const positioned = without(axisDefs, ["type", "crossLines", "position", "ariaLabel"]);
  return {
    ...without(axisDefs, ["type", "crossLines", "ariaLabel"]),
    top: positioned,
    right: positioned,
    bottom: positioned,
    left: positioned,
    crossLines: crossLineThemeOptionsDefs(cartesianCrossLineLabelOptionsDefs)
  };
}
function polarAxisThemeOptionsDefs(axisDefs, crossLineLabel) {
  return {
    ...without(axisDefs, ["type", "crossLines", "ariaLabel"]),
    crossLines: crossLineThemeOptionsDefs(crossLineLabel)
  };
}

// packages/ag-charts-core/src/options/axisThemeTemplate.ts
var titleAxisThemeTemplate = {
  title: {
    enabled: false,
    text: "Axis Title",
    spacing: 25,
    fontWeight: { $ref: "axisTitleFontWeight" },
    fontSize: { $ref: "axisTitleFontSize" },
    fontFamily: { $ref: "axisTitleFontFamily" },
    color: { $ref: "axisTitleColor" },
    wrapping: "always",
    truncate: true
  }
};
var parentLevelAxisThemeTemplate = {
  parentLevel: {
    enabled: false,
    label: {
      // TODO: { $merge: [{ $path: '../../label' }, { fontWeight: 'bold' }]}
      enabled: { $path: "../../label/enabled" },
      border: {
        enabled: {
          $or: [{ $isUserOption: "../border" }, { $path: "../../../label/border/enabled" }]
        },
        strokeWidth: { $path: "../../../label/border/strokeWidth" },
        stroke: { $path: "../../../label/border/stroke" }
      },
      fill: { $path: "../../label/fill" },
      fontSize: { $path: "../../label/fontSize" },
      fontFamily: { $path: "../../label/fontFamily" },
      fontWeight: "bold",
      spacing: { $path: "../../label/spacing" },
      color: { $path: "../../label/color" },
      cornerRadius: { $path: "../../label/cornerRadius" },
      padding: { $path: "../../label/padding" },
      avoidCollisions: { $path: "../../label/avoidCollisions" }
    },
    tick: {
      enabled: { $path: "../../tick/enabled" },
      width: { $path: "../../tick/width" },
      size: { $path: "../../tick/size" },
      stroke: { $path: "../../tick/stroke" }
    }
  }
};
var commonAxisThemeTemplate = {
  reverse: false,
  label: {
    enabled: true,
    fontSize: { $ref: "axisLabelFontSize" },
    fontFamily: { $ref: "axisLabelFontFamily" },
    fontWeight: { $ref: "axisLabelFontWeight" },
    spacing: 11,
    color: { $ref: "axisLabelColor" },
    avoidCollisions: true,
    cornerRadius: 4,
    border: {
      enabled: false,
      strokeWidth: 1,
      stroke: { $foregroundOpacity: 0.08 }
    },
    padding: {
      $if: [{ $path: "./border/enabled" }, { left: 12, right: 12, top: 8, bottom: 8 }, 5]
    }
  },
  line: {
    enabled: true,
    // `width` is the deprecated name for `strokeWidth`. Keeping it in the template and
    // deriving `strokeWidth` from it means the old name keeps working through every route
    // that can set it — a direct user option, a type-level theme override and a positional
    // one — while a user-set `strokeWidth` still wins on edge priority. Mirrors the
    // `gridLine.style[].strokeWidth: { $path: '../../width' }` derivation below.
    // Move the `axisLineWidth` ref to `strokeWidth` when `width` is removed.
    width: { $ref: "axisLineWidth" },
    strokeWidth: { $path: "./width" },
    strokeOpacity: 1,
    lineDash: [],
    stroke: { $ref: "axisLineColor" }
  },
  tick: {
    enabled: false,
    size: 6,
    width: 1,
    stroke: { $ref: "axisLineColor" }
  },
  gridLine: {
    enabled: true,
    width: { $ref: "gridLineWidth" },
    style: {
      $apply: [
        {
          fillOpacity: 1,
          stroke: { $ref: "gridLineColor" },
          strokeWidth: { $path: "../../width" },
          lineDash: []
        },
        [
          {
            fillOpacity: 1,
            stroke: { $ref: "gridLineColor" },
            strokeWidth: { $path: "../../width" },
            lineDash: []
          }
        ]
      ]
    }
  }
};

// packages/ag-charts-core/src/options/geoJsonValidator.ts
function isValidCoordinate(value) {
  return Array.isArray(value) && value.length >= 2 && value.every(isFiniteNumber);
}
function isValidCoordinates(value) {
  return Array.isArray(value) && value.length >= 2 && value.every(isValidCoordinate);
}
function hasSameStartEndPoint(c) {
  const start2 = c[0];
  const end3 = c.at(-1);
  if (end3 === void 0)
    return false;
  return isNumberEqual(start2[0], end3[0], 1e-3) && isNumberEqual(start2[1], end3[1], 1e-3);
}
function isValidPolygon(value) {
  return Array.isArray(value) && value.every(isValidCoordinates) && value.every(hasSameStartEndPoint);
}
function isValidGeometry(value) {
  if (value === null)
    return true;
  if (!isObject(value) || value.type == null)
    return false;
  const { type, coordinates } = value;
  switch (type) {
    case "GeometryCollection":
      return Array.isArray(value.geometries) && value.geometries.every(isValidGeometry);
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
    default:
      return false;
  }
}
function isValidFeature(value) {
  return isObject(value) && value.type === "Feature" && isValidGeometry(value.geometry);
}
function isValidFeatureCollection(value) {
  return isObject(value) && value.type === "FeatureCollection" && Array.isArray(value.features) && value.features.every(isValidFeature);
}
var geoJson = /*#__PURE__*/ attachDescription(isValidFeatureCollection, "a GeoJSON object");

// packages/ag-charts-core/src/options/chartOptionsDefs.ts
var initialStatePickedOptionsDef = /*#__PURE__*/ (() => ({
  activeItem: {
    type: required(strictUnion()("series-node", "legend")),
    seriesId: string,
    itemId: required(or(string, positiveNumber))
  },
  frozen: boolean
}))();
var validationSeverities = /*#__PURE__*/ arrayOf(
  strictUnion()("error", "warning", "deprecation"),
  "an array of validation severities ('error', 'warning' or 'deprecation')"
);
var validationsOptionsDef = {
  showOverlayOn: validationSeverities,
  consoleOn: validationSeverities,
  throwOn: validationSeverities,
  issueRaised: callback
};
var initialStateLegendOptionsDef = /*#__PURE__*/ arrayOfDefs(
  {
    visible: boolean,
    seriesId: string,
    itemId: string,
    legendItemName: string
  },
  "legend state array"
);
var commonChartOptions = /*#__PURE__*/ (() => ({
  withinStudio: undocumented(boolean),
  loading: boolean,
  validations: validationsOptionsDef,
  container: htmlElement,
  context: () => true,
  theme: defined,
  series: array,
  initialState: {
    active: initialStatePickedOptionsDef,
    chartType: string,
    collapsed: arrayOf(or(string, number)),
    annotations: defined,
    legend: initialStateLegendOptionsDef,
    legendPagination: nonNegativeInteger,
    zoom: defined
  }
}))();
var cartesianChartOptionsDefs = /*#__PURE__*/ (() => ({
  ...commonChartOptionsDefs,
  ...commonChartOptions,
  axes: object,
  data: array,
  dataIdKey: string,
  seriesArea: {
    border: borderOptionsDef,
    clip: boolean,
    cornerRadius: number,
    padding: or(themeOperator, padding)
  }
}))();
var polarChartOptionsDefs = {
  ...commonChartOptionsDefs,
  ...commonChartOptions,
  axes: object,
  data: array,
  dataIdKey: string
};
var topologyChartOptionsDefs = {
  ...commonChartOptionsDefs,
  ...commonChartOptions,
  data: array,
  dataIdKey: string,
  topology: geoJson
};
var standaloneChartOptionsDefs = {
  ...commonChartOptionsDefs,
  ...commonChartOptions,
  data: array,
  dataIdKey: string
};
var serializableDate = /*#__PURE__*/ optionsDefs(
  {
    __type: required(constant("date")),
    value: or(string, number)
  },
  "a serializable date object"
);
var zoomRangeDef = /*#__PURE__*/ (() => ({ start: or(number, serializableDate), end: or(number, serializableDate) }))();
var zoomRatioDef = { start: ratio, end: ratio };
var cartesianChartThemeOptionsDefs = /*#__PURE__*/ (() => ({
  ...commonChartOptionsDefs,
  ...undocumentedDefs({
    paired: boolean
  })
}))();
var commonThemeOverridesOptionsDefs = /*#__PURE__*/ (() => ({
  ...commonChartOptionsDefs,
  initialState: {
    legend: initialStateLegendOptionsDef,
    zoom: {
      rangeX: zoomRangeDef,
      rangeY: zoomRangeDef,
      ratioX: zoomRatioDef,
      ratioY: zoomRatioDef,
      autoScaledAxes: arrayOf(constant("y"))
    }
  },
  validations: validationsOptionsDef
}))();

// packages/ag-charts-core/src/options/chartThemeTemplate.ts
var CAPTION_BOX_THEME_DEFAULTS = {
  cornerRadius: 4,
  border: { enabled: false, strokeWidth: 1, stroke: { $foregroundOpacity: 0.08 } },
  padding: {
    $if: [
      { $path: "./border/enabled" },
      { left: 12, right: 12, top: 8, bottom: 8 },
      { $isUserOption: ["./fill", { left: 12, right: 12, top: 8, bottom: 8 }, 0] }
    ]
  }
};
function hasUserOptionLessThan1(key) {
  return {
    $some: [
      {
        $and: [
          {
            $or: [
              { $isSeriesType: "line" },
              { $isSeriesType: "scatter" },
              { $isSeriesType: "area" },
              { $isSeriesType: "radar" },
              { $isSeriesType: "rangeArea" },
              { $isSeriesType: "hlc" }
            ]
          },
          {
            $isUserOption: [
              `/series/$index/${key}`,
              { $lessThan: [{ $path: `/series/$index/${key}` }, 1] },
              false
            ]
          }
        ]
      },
      { $path: "/series" }
    ]
  };
}
var commonChartThemeTemplate = /*#__PURE__*/ (() => ({
  mode: "standalone",
  suppressFieldDotNotation: false,
  keyboard: { enabled: true, initialFocus: "data-start" },
  touch: { dragAction: "drag" },
  minHeight: 300,
  minWidth: 300,
  background: { visible: true, fill: { $ref: "chartBackgroundColor" } },
  padding: { $applyPadding: { $ref: "chartPadding" } },
  seriesArea: {
    border: {
      enabled: false,
      stroke: { $ref: "foregroundColor" },
      strokeOpacity: 1,
      strokeWidth: 1
    },
    cornerRadius: 4,
    padding: { $applyPadding: { $if: [{ $path: "./border/enabled" }, 5, 0] } }
  },
  title: {
    enabled: false,
    text: "Title",
    spacing: { $if: [{ $path: "../subtitle/enabled" }, 10, 20] },
    fontWeight: { $ref: "titleFontWeight" },
    fontSize: { $ref: "titleFontSize" },
    fontFamily: { $ref: "titleFontFamily" },
    color: { $ref: "titleColor" },
    wrapping: "hyphenate",
    layoutStyle: { $ref: "captionLayoutStyle" },
    textAlign: { $ref: "captionAlignment" },
    ...CAPTION_BOX_THEME_DEFAULTS
  },
  subtitle: {
    enabled: false,
    text: "Subtitle",
    spacing: 20,
    fontWeight: { $ref: "subtitleFontWeight" },
    fontSize: { $ref: "subtitleFontSize" },
    fontFamily: { $ref: "subtitleFontFamily" },
    color: { $ref: "subtitleColor" },
    wrapping: "hyphenate",
    layoutStyle: { $ref: "captionLayoutStyle" },
    textAlign: { $ref: "captionAlignment" },
    ...CAPTION_BOX_THEME_DEFAULTS
  },
  footnote: {
    enabled: false,
    text: "Footnote",
    spacing: 20,
    fontSize: { $ref: "footnoteFontSize" },
    fontFamily: { $ref: "footnoteFontFamily" },
    fontWeight: { $ref: "footnoteFontWeight" },
    color: { $ref: "footnoteColor" },
    wrapping: "hyphenate",
    layoutStyle: { $ref: "captionLayoutStyle" },
    textAlign: { $ref: "captionAlignment" },
    ...CAPTION_BOX_THEME_DEFAULTS
  },
  highlight: {
    enabled: true,
    drawingMode: {
      $if: [
        {
          $or: [
            hasUserOptionLessThan1("highlight/highlightedItem/opacity"),
            hasUserOptionLessThan1("highlight/unhighlightedItem/opacity"),
            hasUserOptionLessThan1("highlight/highlightedSeries/opacity"),
            hasUserOptionLessThan1("highlight/unhighlightedSeries/opacity"),
            hasUserOptionLessThan1("fillOpacity"),
            hasUserOptionLessThan1("marker/fillOpacity")
          ]
        },
        "overlap",
        "cutout"
      ]
    }
  },
  tooltip: {
    enabled: true,
    delay: 0,
    pagination: false,
    mode: {
      $if: [
        {
          $or: [
            {
              $and: [
                { $isChartType: "cartesian" },
                { $not: { $hasSeriesType: "bubble" } },
                { $not: { $hasSeriesType: "scatter" } },
                { $greaterThan: [{ $size: { $path: "/series" } }, 1] },
                { $lessThan: [{ $size: { $path: "/series" } }, 4] }
              ]
            },
            {
              $and: [
                { $isChartType: "polar" },
                { $greaterThan: [{ $size: { $path: "/series" } }, 1] },
                { $lessThan: [{ $size: { $path: "/series" } }, 4] }
              ]
            }
          ]
        },
        "shared",
        "single"
      ]
    }
  },
  listeners: {}
}))();

// packages/ag-charts-core/src/options/themeUtil.ts
function undocumentedThemeOptions(options) {
  return options;
}
var DIRECTION_SWAP_AXES = {
  x: {
    position: "bottom" /* BOTTOM */,
    type: {
      $if: [
        { $eq: [{ $path: ["/series/0/direction", void 0] }, "horizontal"] },
        "number" /* NUMBER */,
        "category" /* CATEGORY */
      ]
    }
  },
  y: {
    position: "left" /* LEFT */,
    type: {
      $if: [
        { $eq: [{ $path: ["/series/0/direction", void 0] }, "horizontal"] },
        "category" /* CATEGORY */,
        "number" /* NUMBER */
      ]
    }
  }
};
var SAFE_FILL_OPERATION = {
  $if: [
    {
      $or: [
        { $isGradient: { $palette: "fill" } },
        { $isPattern: { $palette: "fill" } },
        { $isImage: { $value: "$1" } }
      ]
    },
    { $palette: "fillFallback" },
    { $palette: "fill" }
  ]
};
var SAFE_FILLS_OPERATION = {
  $if: [
    {
      $or: [
        { $isGradient: { $palette: "fill" } },
        { $isPattern: { $palette: "fill" } },
        { $isImage: { $value: "$1" } }
      ]
    },
    { $palette: "fillsFallback" },
    { $palette: "fills" }
  ]
};
var SAFE_STROKE_FILL_OPERATION = {
  $if: [
    { $isGradient: { $palette: "fill" } },
    { $palette: "fillFallback" },
    {
      $if: [
        { $isPattern: { $palette: "fill" } },
        { $path: ["/stroke", { $palette: "fillFallback" }, { $palette: "fill" }] },
        { $palette: "fill" }
      ]
    }
  ]
};
var SAFE_RANGE2_OPERATION = {
  $if: [
    {
      $or: [
        { $isGradient: { $palette: "fill" } },
        { $isPattern: { $palette: "fill" } },
        { $isImage: { $value: "$1" } }
      ]
    },
    [{ $palette: "fillFallback" }, { $palette: "fillFallback" }],
    { $palette: "range2" }
  ]
};
var FILL_GRADIENT_BLANK_DEFAULTS = {
  type: "gradient",
  gradient: "linear",
  bounds: "item",
  colorStops: [{ color: "black" }],
  rotation: 0,
  reverse: false,
  colorSpace: "rgb"
};
var FILL_GRADIENT_LINEAR_DEFAULTS = {
  type: "gradient",
  gradient: "linear",
  bounds: "item",
  colorStops: { $shallow: { $map: [{ color: { $value: "$1" } }, { $palette: "gradient" }] } },
  rotation: 0,
  reverse: false,
  colorSpace: "rgb"
};
var FILL_GRADIENT_LINEAR_HIERARCHY_DEFAULTS = {
  ...FILL_GRADIENT_LINEAR_DEFAULTS,
  colorStops: {
    $shallow: [
      {
        color: {
          $mix: [{ $path: ["/1", { $palette: "fill" }, { $palette: "hierarchyColors" }] }, "black", 0.15]
        }
      },
      {
        color: {
          $mix: [{ $path: ["/1", { $palette: "fill" }, { $palette: "hierarchyColors" }] }, "white", 0.15]
        }
      }
    ]
  }
};
var FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS = {
  ...FILL_GRADIENT_LINEAR_DEFAULTS,
  colorStops: {
    $map: [{ color: { $value: "$1" } }, { $path: ["/0", void 0, { $palette: "gradients" }] }]
  }
};
var FILL_GRADIENT_LINEAR_KEYED_DEFAULTS = (key) => ({
  ...FILL_GRADIENT_LINEAR_DEFAULTS,
  colorStops: {
    $shallow: {
      $if: [
        {
          $or: [
            { $isGradient: { $palette: `${key}.fill` } },
            { $isPattern: { $palette: `${key}.fill` } },
            { $isImage: { $palette: `${key}.fill` } }
          ]
        },
        { $path: ["/colorStops", void 0, { $palette: `${key}.fill` }] },
        [
          { color: { $mix: [{ $palette: `${key}.fill` }, "black", 0.15] } },
          { color: { $mix: [{ $palette: `${key}.fill` }, "white", 0.15] } }
        ]
      ]
    }
  }
});
var FILL_GRADIENT_RADIAL_DEFAULTS = {
  type: "gradient",
  gradient: "radial",
  bounds: "item",
  colorStops: { $shallow: { $map: [{ color: { $value: "$1" } }, { $palette: "gradient" }] } },
  rotation: 0,
  reverse: false,
  colorSpace: "rgb"
};
var FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS = {
  ...FILL_GRADIENT_RADIAL_DEFAULTS,
  reverse: true
};
var FILL_GRADIENT_RADIAL_SERIES_DEFAULTS = {
  ...FILL_GRADIENT_RADIAL_DEFAULTS,
  bounds: "series"
};
var FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS = {
  ...FILL_GRADIENT_RADIAL_DEFAULTS,
  bounds: "series",
  reverse: true
};
var FILL_GRADIENT_CONIC_SERIES_DEFAULTS = {
  type: "gradient",
  gradient: "conic",
  bounds: "series",
  colorStops: { $map: [{ color: { $value: "$1" } }, { $palette: "gradient" }] },
  rotation: 0,
  reverse: false,
  colorSpace: "rgb"
};
var FILL_PATTERN_DEFAULTS = {
  type: "pattern",
  pattern: "forward-slanted-lines",
  width: { $isUserOption: ["./height", { $path: "./height" }, 10] },
  height: { $isUserOption: ["./width", { $path: "./width" }, 10] },
  padding: 2,
  fill: {
    $if: [
      {
        $or: [{ $isGradient: { $palette: "fill" } }, { $isImage: { $palette: "fill" } }]
      },
      { $palette: "fillFallback" },
      {
        $if: [
          { $isPattern: { $palette: "fill" } },
          { $path: ["/fill", { $palette: "fillFallback" }, { $palette: "fill" }] },
          { $palette: "fill" }
        ]
      }
    ]
  },
  fillOpacity: 1,
  stroke: SAFE_STROKE_FILL_OPERATION,
  strokeOpacity: 1,
  strokeWidth: {
    $switch: [
      { $path: "./pattern" },
      0,
      [["backward-slanted-lines", "forward-slanted-lines", "horizontal-lines", "vertical-lines"], 4]
    ]
  },
  backgroundFill: "none",
  backgroundFillOpacity: 1,
  rotation: 0,
  scale: 1
};
var FILL_PATTERN_SINGLE_DEFAULTS = {
  ...FILL_PATTERN_DEFAULTS,
  stroke: {
    $if: [
      { $isGradient: { $palette: "fill" } },
      { $path: ["/0", void 0, { $palette: "fillsFallback" }] },
      {
        $if: [
          { $isPattern: { $palette: "fill" } },
          {
            $path: [
              "/stroke",
              { $path: ["/0", void 0, { $palette: "fillsFallback" }] },
              { $path: ["/0", void 0, { $palette: "fills" }] }
            ]
          },
          { $path: ["/0", void 0, { $palette: "fills" }] }
        ]
      }
    ]
  },
  fill: {
    $if: [
      {
        $or: [{ $isGradient: { $palette: "fill" } }, { $isImage: { $palette: "fill" } }]
      },
      { $path: ["/0", void 0, { $palette: "fillsFallback" }] },
      {
        $if: [
          { $isPattern: { $palette: "fill" } },
          {
            $path: [
              "/fill",
              { $path: ["/0", void 0, { $palette: "fillsFallback" }] },
              { $path: ["/0", void 0, { $palette: "fills" }] }
            ]
          },
          { $path: ["/0", void 0, { $palette: "fills" }] }
        ]
      }
    ]
  }
};
var FILL_PATTERN_BLANK_DEFAULTS = {
  type: "pattern",
  pattern: "forward-slanted-lines",
  width: 8,
  height: 8,
  padding: 1,
  fill: "black",
  fillOpacity: 1,
  backgroundFill: "white",
  backgroundFillOpacity: 1,
  stroke: "black",
  strokeOpacity: 1,
  strokeWidth: 1,
  rotation: 0,
  scale: 1
};
var FILL_PATTERN_HIERARCHY_DEFAULTS = {
  ...FILL_PATTERN_DEFAULTS,
  fill: { $path: ["/1", { $palette: "fill" }, { $palette: "hierarchyColors" }] },
  stroke: { $path: ["/1", { $palette: "fill" }, { $palette: "hierarchyColors" }] }
};
var FILL_PATTERN_KEYED_DEFAULTS = (key) => ({
  ...FILL_PATTERN_DEFAULTS,
  stroke: {
    $if: [
      { $isGradient: { $palette: `${key}.fill` } },
      { $palette: "fillFallback" },
      {
        $if: [
          { $isPattern: { $palette: `${key}.fill` } },
          { $path: ["/stroke", { $palette: "fillFallback" }, { $palette: `${key}.fill` }] },
          { $palette: `${key}.fill` }
        ]
      }
    ]
  }
});
var FILL_IMAGE_DEFAULTS = {
  type: "image",
  backgroundFill: { $palette: "fillFallback" },
  backgroundFillOpacity: 1,
  repeat: "no-repeat",
  fit: "contain",
  rotation: 0
};
var FILL_IMAGE_BLANK_DEFAULTS = {
  type: "image",
  backgroundFill: "black",
  backgroundFillOpacity: 1,
  rotation: 0,
  repeat: "no-repeat",
  fit: "contain",
  width: 8,
  height: 8
};
function getSequentialColors(colors) {
  return mapValues(colors, (value) => {
    const color2 = Color.fromString(value);
    return [Color.darken(color2, 0.15).toString(), value, Color.lighten(color2, 0.15).toString()];
  });
}
var SERIES_LABEL_PLACEMENT_PARAMS = {
  inside: { color: "seriesLabelInsideTextColor", background: "seriesLabelInsideBackgroundColor" },
  outside: { color: "seriesLabelOutsideTextColor", background: "seriesLabelOutsideBackgroundColor" }
};
var seriesLabelBackground = (placement) => {
  const param = SERIES_LABEL_PLACEMENT_PARAMS[placement].background;
  return { $if: [{ $isTransparent: { $ref: param } }, void 0, { $ref: param }] };
};
var labelBoxingFillDefaults = (placement) => ({
  fill: {
    $if: [
      {
        $and: [
          { $eq: [{ $path: "./fill/type" }, "image"] },
          { $isUserOption: ["./fill/backgroundFill", false, true] }
        ]
      },
      { backgroundFill: "transparent" },
      placement == null ? void 0 : seriesLabelBackground(placement)
    ]
  }
});
function themeBorderMember(param, member, { on, off, unset }) {
  const memberRef = { $ref: `${param}.${member}` };
  return {
    $isType: [
      { $ref: param },
      "boolean",
      { $if: [{ $ref: param }, on, off] },
      unset === void 0 ? memberRef : { $isType: [memberRef, "nullish", unset, memberRef] }
    ]
  };
}
function themeBorderColor(param, options = {}) {
  const { on = { $ref: "borderColor" }, off = on, unset } = options;
  return themeBorderMember(param, "color", { on, off, unset });
}
function themeBorderWidth(param, options = {}) {
  const { on = { $ref: "borderWidth" }, off = 0, unset } = options;
  return themeBorderMember(param, "width", { on, off, unset });
}
var LABEL_BOXING_BORDER_DEFAULTS = /*#__PURE__*/ (() => ({
  border: {
    enabled: {
      $or: [{ $isUserOption: "../border" }, { $not: { $eq: [{ $ref: "seriesLabelBorder" }, false] } }]
    },
    // `false` keeps the subtle border shown when a series enables `label.border`; `true` and objects follow borderColor/borderWidth.
    strokeWidth: themeBorderWidth("seriesLabelBorder", { off: 1, unset: { $ref: "borderWidth" } }),
    stroke: themeBorderColor("seriesLabelBorder", {
      off: { $foregroundOpacity: 0.08 },
      unset: { $ref: "borderColor" }
    })
  }
}))();
var LABEL_BOXING_DEFAULTS = /*#__PURE__*/ (() => ({
  ...labelBoxingFillDefaults(),
  ...LABEL_BOXING_BORDER_DEFAULTS,
  padding: 8,
  cornerRadius: { $ref: "seriesLabelBorderRadius" }
}))();
var seriesLabelFontWeightOr = (fallback) => ({
  $if: [
    { $eq: [{ $ref: "seriesLabelFontWeight" }, { $ref: "fontWeight" }] },
    fallback,
    { $ref: "seriesLabelFontWeight" }
  ]
});
var PLACED_LABEL_BOXING_DEFAULTS = (placement) => ({
  ...LABEL_BOXING_DEFAULTS,
  ...labelBoxingFillDefaults(placement)
});
var LABEL_BOXING_TOP_LEVEL_DEFAULTS = /*#__PURE__*/ (() => ({
  ...labelBoxingFillDefaults(),
  ...LABEL_BOXING_BORDER_DEFAULTS,
  cornerRadius: { $ref: "seriesLabelBorderRadius" }
}))();
var LABEL_PLACEMENT_BORDER_DEFAULTS = {
  border: { enabled: { $path: "../../border/enabled" } }
};
var LABEL_PLACEMENT_STYLE_DEFAULTS = (placement, colorRef2 = SERIES_LABEL_PLACEMENT_PARAMS[placement].color) => ({
  ...LABEL_PLACEMENT_BORDER_DEFAULTS,
  color: { $isUserOption: ["../color", { $path: "../color" }, { $ref: colorRef2 }] },
  fill: { $if: [{ $isUserOption: "../fill" }, void 0, seriesLabelBackground(placement)] }
});
var LABEL_OVERFLOW_DEFAULTS = {
  wrapping: {
    $if: [
      {
        $or: [
          { $isUserOption: [["./maxWidth", "./maxHeight", "./truncate", "./minimumFontSize"]] },
          { $isType: [{ $path: "./placement" }, "array"] },
          { $isType: [{ $path: "./orientation" }, "array"] }
        ]
      },
      "on-space",
      void 0
    ]
  },
  truncate: {
    $if: [
      {
        $or: [
          { $isUserOption: [["./maxWidth", "./maxHeight", "./wrapping", "./minimumFontSize"]] },
          { $isType: [{ $path: "./placement" }, "array"] },
          { $isType: [{ $path: "./orientation" }, "array"] }
        ]
      },
      true,
      void 0
    ]
  }
};
var AUTO_SIZED_LABEL_TRUNCATE = {
  $isUserOption: ["./overflowStrategy", { $eq: [{ $path: "./overflowStrategy" }, "ellipsis"] }, true]
};
var LABEL_OVERFLOW_ALWAYS_SHOW = {
  $if: [
    {
      $or: [
        {
          $isUserOption: [
            ["../maxWidth", "../maxHeight", "../wrapping", "../truncate", "../minimumFontSize"]
          ]
        },
        { $isType: [{ $path: "../placement" }, "array"] },
        { $isType: [{ $path: "../orientation" }, "array"] }
      ]
    },
    false,
    true
  ]
};
var BAR_LABEL_COLLISION_THEME = /*#__PURE__*/ (() => ({
  threshold: 4,
  alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW,
  ...undocumentedThemeOptions({ collideWith: { seriesItems: true } })
}))();
var MULTI_SERIES_HIGHLIGHT_STYLE = {
  enabled: { $circular: { $path: "/highlight/enabled" } },
  unhighlightedItem: {
    opacity: 0.6
  },
  unhighlightedSeries: {
    opacity: 0.2
  }
};
var MARKER_SERIES_HIGHLIGHT_STYLE = {
  enabled: { $circular: { $path: "/highlight/enabled" } },
  unhighlightedSeries: {
    opacity: 0.2
  }
};
var PART_WHOLE_HIGHLIGHT_STYLE = {
  enabled: { $circular: { $path: "/highlight/enabled" } },
  unhighlightedItem: {
    opacity: 0.2
  },
  unhighlightedSeries: {
    opacity: 0.2
  }
};
var SINGLE_SERIES_HIGHLIGHT_STYLE = {
  enabled: { $circular: { $path: "/highlight/enabled" } },
  unhighlightedItem: {
    opacity: 0.2
  }
};
var SERIES_INTERACTION_THEME_DEFAULTS = { cursor: "default", nodeClickRange: "exact" };
var STROKE_STYLE_THEME_DEFAULTS = { strokeOpacity: 1, lineDash: [0], lineDashOffset: 0 };
var FONT_THEME_DEFAULTS = {
  fontSize: { $ref: "fontSize" },
  fontFamily: { $ref: "fontFamily" },
  fontWeight: { $ref: "fontWeight" }
};
var SHADOW_THEME_DEFAULTS = { enabled: false, color: "#00000080", xOffset: 3, yOffset: 3, blur: 5 };
var SERIES_TOOLTIP_THEME = {
  range: {
    $if: [
      { $eq: [{ $path: ["/tooltip/range", "exact"] }, "area"] },
      "exact",
      { $path: ["/tooltip/range", "exact"] }
    ]
  },
  position: {
    anchorTo: { $path: ["/tooltip/position/anchorTo", "pointer"] },
    placement: { $path: ["/tooltip/position/placement", void 0] },
    xOffset: { $path: ["/tooltip/position/xOffset", 0] },
    yOffset: { $path: ["/tooltip/position/yOffset", 0] },
    // Chart-anchored tooltips sit flush; pointer/node use a 12px gap.
    offset: {
      $path: ["/tooltip/position/offset", { $if: [{ $eq: [{ $path: "./anchorTo" }, "chart"] }, 0, 12] }]
    }
  },
  interaction: { enabled: false }
};
var NEAREST_TOOLTIP_THEME = {
  ...SERIES_TOOLTIP_THEME,
  range: { $path: ["/tooltip/range", "nearest"] }
};
var NEAREST_NODE_TOOLTIP_THEME = {
  ...SERIES_TOOLTIP_THEME,
  range: {
    $if: [
      { $eq: [{ $path: ["/tooltip/range", "nearest"] }, "area"] },
      "nearest",
      { $path: ["/tooltip/range", "nearest"] }
    ]
  },
  position: {
    ...SERIES_TOOLTIP_THEME.position,
    anchorTo: { $path: ["/tooltip/position/anchorTo", "node"] }
  }
};
function fillThemeTemplate(gradient2, defaultFill = { $palette: "fill" }) {
  return {
    $applySwitch: [
      { $path: "type" },
      defaultFill,
      ["gradient", gradient2],
      ["image", FILL_IMAGE_DEFAULTS],
      ["pattern", FILL_PATTERN_DEFAULTS]
    ]
  };
}
function cycledFillThemeTemplate(gradient2, pattern = FILL_PATTERN_DEFAULTS) {
  return {
    $applySwitch: [
      { $path: ["/type", void 0, { $value: "$1" }] },
      { $value: "$1" },
      ["gradient", gradient2],
      ["pattern", pattern],
      ["image", FILL_IMAGE_DEFAULTS]
    ]
  };
}
var COMMON_SERIES_THEME_DEFAULTS = { ...SERIES_INTERACTION_THEME_DEFAULTS, showInLegend: true };
function interpolationThemeTemplate(defaultType = "linear") {
  return {
    $applySwitch: [
      { $path: ["type", defaultType] },
      {},
      ["linear", { type: "linear" }],
      ["smooth", { type: "smooth", tension: 1 }],
      ["step", { type: "step", position: "end" }]
    ]
  };
}
var SERIES_SELECTION_THEME = {
  enabled: { $path: ["/selection/enabled", false] },
  containment: { $path: ["/selection/containment", "any"] },
  selectedItem: {
    strokeWidth: 2
  },
  unselectedItem: {
    opacity: 0.6
  },
  unselectedSeries: {
    opacity: 0.2
  }
};
var LEGEND_CONTAINER_THEME = /*#__PURE__*/ (() => ({
  border: {
    enabled: { $isType: [{ $ref: "legendBorder" }, "boolean", { $ref: "legendBorder" }, true] },
    // `legendBorder: false` keeps the legend's own stroke for a border enabled through the legend options.
    stroke: themeBorderColor("legendBorder", {
      off: { $foregroundBackgroundMix: 0.25 },
      unset: { $ref: "borderColor" }
    }),
    strokeOpacity: 1,
    strokeWidth: themeBorderWidth("legendBorder", { off: 1, unset: { $ref: "borderWidth" } })
  },
  cornerRadius: { $ref: "legendBorderRadius" },
  fillOpacity: 1,
  padding: {
    $if: [
      {
        $or: [{ $eq: [{ $path: "./border/enabled" }, true] }, { $isUserOption: ["./fill", true, false] }]
      },
      { $ref: "legendPadding" },
      0
    ]
  }
}))();
var SEGMENTATION_DEFAULTS = /*#__PURE__*/ (() => ({
  enabled: false,
  key: "x",
  segments: {
    $apply: {
      fill: fillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS, { $path: "../../../fill" }),
      stroke: { $path: "../../../stroke" },
      fillOpacity: { $path: "../../../fillOpacity" },
      strokeWidth: {
        $isUserOption: [
          "./stroke",
          {
            $isUserOption: [
              "../../../strokeWidth",
              { $path: "../../../strokeWidth" },
              {
                $if: [
                  { $greaterThan: [{ $path: "../../../strokeWidth" }, 0] },
                  { $path: "../../../strokeWidth" },
                  2
                ]
              }
            ]
          },
          { $path: "../../../strokeWidth" }
        ]
      },
      strokeOpacity: { $path: "../../../strokeOpacity" },
      lineDash: { $path: "../../../lineDash" },
      lineDashOffset: { $path: "../../../lineDashOffset" }
    }
  }
}))();

// packages/ag-charts-core/src/data/binarySearch.ts
function findMaxIndex(min, max, iteratee) {
  if (min > max)
    return;
  let found;
  while (max >= min) {
    const index = Math.floor((max + min) / 2);
    const value = iteratee(index);
    if (value) {
      found = index;
      min = index + 1;
    } else {
      max = index - 1;
    }
  }
  return found;
}
function findMinIndex(min, max, iteratee) {
  if (min > max)
    return;
  let found;
  while (max >= min) {
    const index = Math.floor((max + min) / 2);
    const value = iteratee(index);
    if (value) {
      found = index;
      max = index - 1;
    } else {
      min = index + 1;
    }
  }
  return found;
}
function findMaxValue(min, max, iteratee) {
  if (min > max)
    return;
  let found;
  while (max >= min) {
    const index = Math.floor((max + min) / 2);
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
function findMinValue(min, max, iteratee) {
  if (min > max)
    return;
  let found;
  while (max >= min) {
    const index = Math.floor((max + min) / 2);
    const value = iteratee(index);
    if (value == null) {
      min = index + 1;
    } else {
      found = value;
      max = index - 1;
    }
  }
  return found;
}

// packages/ag-charts-core/src/data/diff.ts
function diffArrays(previous, current) {
  const size = Math.max(previous.length, current.length);
  const added = /* @__PURE__ */ new Set();
  const removed = /* @__PURE__ */ new Set();
  for (let i = 0; i < size; i++) {
    const prev = previous[i];
    const curr = current[i];
    if (prev === curr)
      continue;
    if (removed.has(curr)) {
      removed.delete(curr);
    } else if (curr) {
      added.add(curr);
    }
    if (added.has(prev)) {
      added.delete(prev);
    } else if (prev) {
      removed.add(prev);
    }
  }
  return { changed: added.size > 0 || removed.size > 0, added, removed };
}

// packages/ag-charts-core/src/data/numberArray.ts
function clampArray(value, array2) {
  const [min, max] = findMinMax(array2);
  return clamp(min, value, max);
}
function findMinMax(array2) {
  if (array2.length === 0)
    return [];
  let min = Infinity;
  let max = -Infinity;
  for (const val of array2) {
    if (val < min)
      min = val;
    if (val > max)
      max = val;
  }
  return [min, max];
}
function findRangeExtent(array2) {
  const [min, max] = findMinMax(array2);
  return max - min;
}
function nextPowerOf2(value) {
  value = Math.trunc(value);
  if (value <= 0)
    return 1;
  if (value === 1)
    return 2;
  return 1 << 32 - Math.clz32(value - 1);
}
function previousPowerOf2(value) {
  value = Math.trunc(value);
  if (value <= 0)
    return 0;
  if (value === 1)
    return 1;
  return 1 << 31 - Math.clz32(value);
}

// packages/ag-charts-core/src/time/duration.ts
var durationSecond = 1e3;
var durationMinute = durationSecond * 60;
var durationHour = durationMinute * 60;
var durationDay = durationHour * 24;
var durationWeek = durationDay * 7;
var durationMonth = durationDay * 30;
var durationYear = durationDay * 365;

// packages/ag-charts-core/src/time/encoding.ts
var tzOffset = /*#__PURE__*/ (() => ((/* @__PURE__ */ new Date()).getTimezoneOffset() * durationMinute))();
var unitEncoding = {
  millisecond: {
    milliseconds: 1,
    hierarchy: "day",
    encode(date2) {
      return date2.getTime();
    },
    decode(encoded) {
      return new Date(encoded);
    }
  },
  second: {
    milliseconds: durationSecond,
    hierarchy: "day",
    encode(date2, utc) {
      const offset = utc ? 0 : tzOffset;
      return Math.floor((date2.getTime() - offset) / durationSecond);
    },
    decode(encoded, utc) {
      const offset = utc ? 0 : tzOffset;
      return new Date(offset + encoded * durationSecond);
    }
  },
  minute: {
    milliseconds: durationMinute,
    hierarchy: "day",
    encode(date2, utc) {
      const offset = utc ? 0 : tzOffset;
      return Math.floor((date2.getTime() - offset) / durationMinute);
    },
    decode(encoded, utc) {
      const offset = utc ? 0 : tzOffset;
      return new Date(offset + encoded * durationMinute);
    }
  },
  hour: {
    milliseconds: durationHour,
    hierarchy: "day",
    encode(date2, utc) {
      const offset = utc ? 0 : tzOffset;
      return Math.floor((date2.getTime() - offset) / durationHour);
    },
    decode(encoded, utc) {
      const offset = utc ? 0 : tzOffset;
      return new Date(offset + encoded * durationHour);
    }
  },
  day: {
    milliseconds: durationDay,
    hierarchy: "month",
    encode(date2, utc) {
      const tzOffsetMs2 = utc ? 0 : date2.getTimezoneOffset() * durationMinute;
      return Math.floor((date2.getTime() - tzOffsetMs2) / durationDay);
    },
    decode(encoded, utc) {
      let d;
      if (utc) {
        d = /* @__PURE__ */ new Date(0);
        d.setUTCDate(d.getUTCDate() + encoded);
        d.setUTCHours(0, 0, 0, 0);
      } else {
        d = new Date(1970, 0, 1);
        d.setDate(d.getDate() + encoded);
      }
      return d;
    }
  },
  month: {
    milliseconds: durationMonth,
    hierarchy: "year",
    encode(date2, utc) {
      if (utc) {
        return date2.getUTCFullYear() * 12 + date2.getUTCMonth();
      } else {
        return date2.getFullYear() * 12 + date2.getMonth();
      }
    },
    decode(encoded, utc) {
      if (utc) {
        const year = Math.floor(encoded / 12);
        const m = encoded - year * 12;
        return new Date(Date.UTC(year, m, 1));
      } else {
        const y = Math.floor(encoded / 12);
        const month = encoded - y * 12;
        return new Date(y, month, 1);
      }
    }
  },
  year: {
    milliseconds: durationYear,
    hierarchy: void 0,
    encode(date2, utc) {
      if (utc) {
        return date2.getUTCFullYear();
      } else {
        return date2.getFullYear();
      }
    },
    decode(encoded, utc) {
      let d;
      if (utc) {
        d = /* @__PURE__ */ new Date();
        d.setUTCFullYear(encoded);
        d.setUTCMonth(0, 1);
        d.setUTCHours(0, 0, 0, 0);
      } else {
        d = new Date(encoded, 0, 1, 0, 0, 0, 0);
      }
      return d;
    }
  }
};

// packages/ag-charts-core/src/time/range.ts
function timeInterval2(interval) {
  return typeof interval === "string" ? { unit: interval, step: 1, epoch: void 0, utc: false } : {
    unit: interval.unit,
    step: interval.step ?? 1,
    epoch: interval.epoch,
    utc: interval.utc ?? false
  };
}
function getOffset(unit, step, epoch, utc) {
  if (epoch == null)
    return 0;
  const encoding = unitEncoding[unit];
  return Math.floor(encoding.encode(new Date(epoch), utc)) % step;
}
function encode(d, unit, step, utc, offset) {
  const encoding = unitEncoding[unit];
  return Math.floor((encoding.encode(new Date(d), utc) - offset) / step);
}
function decode(encoded, unit, step, utc, offset) {
  const encoding = unitEncoding[unit];
  return encoding.decode(encoded * step + offset, utc);
}
function encodingFloor(date2, unit, step, utc, offset) {
  const d = new Date(date2);
  const e = encode(d, unit, step, utc, offset);
  return decode(e, unit, step, utc, offset);
}
function encodingCeil(date2, unit, step, utc, offset) {
  const d = new Date(Number(date2) - 1);
  const e = encode(d, unit, step, utc, offset);
  return decode(e + 1, unit, step, utc, offset);
}
function intervalFloor(interval, date2) {
  const { unit, step, epoch, utc } = timeInterval2(interval);
  const offset = getOffset(unit, step, epoch, utc);
  return encodingFloor(date2, unit, step, utc, offset);
}
function intervalCeil(interval, date2) {
  const { unit, step, epoch, utc } = timeInterval2(interval);
  const offset = getOffset(unit, step, epoch, utc);
  return encodingCeil(date2, unit, step, utc, offset);
}
function intervalPrevious(interval, date2) {
  const { unit, step, epoch, utc } = timeInterval2(interval);
  const offset = getOffset(unit, step, epoch, utc);
  return decode(
    encode(encodingCeil(date2, unit, step, utc, offset), unit, step, utc, offset) - 1,
    unit,
    step,
    utc,
    offset
  );
}
function intervalNext(interval, date2) {
  const { unit, step, epoch, utc } = timeInterval2(interval);
  const offset = getOffset(unit, step, epoch, utc);
  return decode(
    encode(encodingFloor(date2, unit, step, utc, offset), unit, step, utc, offset) + 1,
    unit,
    step,
    utc,
    offset
  );
}
function intervalExtent(start2, stop, visibleRange) {
  if (start2.valueOf() > stop.valueOf()) {
    [start2, stop] = [stop, start2];
    if (visibleRange != null) {
      visibleRange = [1 - visibleRange[1], 1 - visibleRange[0]];
    }
  }
  if (visibleRange != null) {
    const delta3 = stop.valueOf() - start2.valueOf();
    const t0 = start2.valueOf();
    start2 = new Date(t0 + visibleRange[0] * delta3);
    stop = new Date(t0 + visibleRange[1] * delta3);
  }
  return [new Date(start2), new Date(stop)];
}
function rangeData(interval, start2, stop, { extend = false, visibleRange = [0, 1], limit, defaultAlignment = "start" } = {}) {
  const params = timeInterval2(interval);
  const { unit, step, utc } = params;
  let epoch;
  if (params.epoch != null) {
    epoch = params.epoch;
  } else if (defaultAlignment === "interval") {
    epoch = void 0;
  } else if (start2.valueOf() > stop.valueOf()) {
    epoch = stop;
  } else {
    epoch = start2;
  }
  const offset = getOffset(params.unit, params.step, epoch, params.utc);
  let [d0, d1] = intervalExtent(start2, stop, visibleRange);
  d0 = extend ? encodingFloor(d0, unit, step, utc, offset) : encodingCeil(d0, unit, step, utc, offset);
  d1 = extend ? encodingCeil(d1, unit, step, utc, offset) : encodingFloor(d1, unit, step, utc, offset);
  const e0 = encode(d0, unit, step, utc, offset);
  let e1 = encode(d1, unit, step, utc, offset);
  if (limit != null && e1 - e0 > limit) {
    e1 = e0 + limit;
  }
  return {
    range: [e0, e1],
    unit,
    step,
    utc,
    offset
  };
}
function intervalRangeCount(interval, start2, stop, params) {
  const {
    range: [e0, e1]
  } = rangeData(interval, start2, stop, params);
  return Math.abs(e1 - e0);
}
function intervalRange(interval, start2, stop, params) {
  const {
    range: [e0, e1],
    unit,
    step,
    utc,
    offset
  } = rangeData(interval, start2, stop, params);
  const values = [];
  for (let e = e0; e <= e1; e += 1) {
    const d = decode(e, unit, step, utc, offset);
    values.push(d);
  }
  return values;
}
function intervalRangeNumeric(interval, start2, stop, params) {
  const {
    range: [e0, e1],
    unit,
    step,
    utc,
    offset
  } = rangeData(interval, start2, stop, params);
  const count = Math.max(0, e1 - e0 + 1);
  const encodedValues = new Array(count);
  for (let i = 0; i < count; i++) {
    encodedValues[i] = e0 + i;
  }
  return {
    encodedValues,
    encodingParams: { unit, step, utc, offset }
  };
}
function decodeIntervalValue(encoded, encodingParams) {
  return decode(encoded, encodingParams.unit, encodingParams.step, encodingParams.utc, encodingParams.offset);
}
var tzOffsetMs = /*#__PURE__*/ (() => ((/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4))();
var DURATION_SECOND = 1e3;
var DURATION_MINUTE = 6e4;
var DURATION_HOUR = 36e5;
function encodedToTimestamp(encoded, encodingParams) {
  const { unit, step, utc, offset } = encodingParams;
  const rawEncoded = encoded * step + offset;
  switch (unit) {
    case "millisecond":
      return rawEncoded;
    case "second": {
      const tzOffset2 = utc ? 0 : tzOffsetMs;
      return tzOffset2 + rawEncoded * DURATION_SECOND;
    }
    case "minute": {
      const tzOffset2 = utc ? 0 : tzOffsetMs;
      return tzOffset2 + rawEncoded * DURATION_MINUTE;
    }
    case "hour": {
      const tzOffset2 = utc ? 0 : tzOffsetMs;
      return tzOffset2 + rawEncoded * DURATION_HOUR;
    }
    default: {
      const encoding = unitEncoding[unit];
      return encoding.decode(rawEncoded, utc).valueOf();
    }
  }
}
function intervalRangeStartIndex(interval, start2, stop, { extend, visibleRange, limit, defaultAlignment } = {}) {
  const {
    range: [s]
  } = rangeData(interval, start2, stop, { extend, visibleRange, limit, defaultAlignment });
  const {
    range: [s0]
  } = rangeData(interval, start2, stop, { extend, limit, defaultAlignment });
  return s - s0;
}
var unitRanger = {
  millisecond: {
    adjust(date2, step, _utc) {
      const adjusted = /* @__PURE__ */ new Date();
      adjusted.setTime(date2.getTime() + step);
      return adjusted;
    }
  },
  second: {
    adjust(date2, step, utc) {
      const adjusted = new Date(date2);
      if (utc) {
        adjusted.setUTCSeconds(date2.getUTCSeconds() + step);
      } else {
        adjusted.setSeconds(date2.getSeconds() + step);
      }
      return adjusted;
    }
  },
  minute: {
    adjust(date2, step, utc) {
      const adjusted = new Date(date2);
      if (utc) {
        adjusted.setUTCMinutes(date2.getUTCMinutes() + step);
      } else {
        adjusted.setMinutes(date2.getMinutes() + step);
      }
      return adjusted;
    }
  },
  hour: {
    adjust(date2, step, utc) {
      const adjusted = new Date(date2);
      if (utc) {
        adjusted.setUTCHours(date2.getUTCHours() + step);
      } else {
        adjusted.setHours(date2.getHours() + step);
      }
      return adjusted;
    }
  },
  day: {
    adjust(date2, step, utc) {
      const adjusted = new Date(date2);
      if (utc) {
        adjusted.setUTCDate(date2.getUTCDate() + step);
      } else {
        adjusted.setDate(date2.getDate() + step);
      }
      return adjusted;
    }
  },
  month: {
    adjust(date2, step, utc) {
      const adjusted = new Date(date2);
      if (utc) {
        adjusted.setUTCMonth(date2.getUTCMonth() + step);
        if (step !== 0) {
          while (adjusted.getUTCMonth() === date2.getUTCMonth()) {
            adjusted.setUTCDate(adjusted.getUTCDate() + (step > 0 ? 1 : -1));
          }
        }
      } else {
        adjusted.setMonth(date2.getMonth() + step);
        if (step !== 0) {
          while (adjusted.getMonth() === date2.getMonth()) {
            adjusted.setDate(adjusted.getDate() + (step > 0 ? 1 : -1));
          }
        }
      }
      return adjusted;
    }
  },
  year: {
    adjust(date2, step, utc) {
      const adjusted = new Date(date2);
      if (utc) {
        adjusted.setUTCFullYear(date2.getUTCFullYear() + step);
      } else {
        adjusted.setFullYear(date2.getFullYear() + step);
      }
      return adjusted;
    }
  }
};
function intervalAgo(interval, date2) {
  const { unit, step, utc } = timeInterval2(interval);
  const ranger = unitRanger[unit];
  return ranger.adjust(date2, -step, utc);
}

// packages/ag-charts-core/src/time/timeInterval.ts
function intervalUnit(interval) {
  return typeof interval === "string" ? interval : interval.unit;
}
function intervalStep(interval) {
  return typeof interval === "string" ? 1 : interval.step ?? 1;
}
function intervalEpoch(interval) {
  return typeof interval === "string" ? void 0 : interval.epoch;
}
function intervalHierarchy(interval) {
  return unitEncoding[intervalUnit(interval)].hierarchy;
}
function intervalMilliseconds(interval) {
  const step = intervalStep(interval);
  return step * unitEncoding[intervalUnit(interval)].milliseconds;
}
function toTimeInterval(interval) {
  return typeof interval === "string" ? { unit: interval } : interval;
}
var intervals = ["millisecond", "second", "minute", "hour", "day", "month", "year"];
function isTimeInterval(value) {
  if (!isPlainObject(value))
    return false;
  return "unit" in value && intervals.includes(value.unit);
}
function isTimeIntervalUnit(value) {
  return isString(value) && intervals.includes(value);
}

// packages/ag-charts-core/src/time/timeFormatDefaults.ts
function dateToNumber(value) {
  return value instanceof Date ? value.getTime() : value;
}
var MAX_TIME_MS = 864e13;
function epochInRange(epoch) {
  return Math.abs(epoch) > MAX_TIME_MS ? Number.NaN : epoch;
}
function timeValueToNumber(value) {
  if (typeof value === "number")
    return epochInRange(value);
  if (typeof value === "bigint")
    return epochInRange(Number(value));
  if (typeof value === "string")
    return Date.parse(value);
  if (value instanceof Date)
    return value.getTime();
  return value;
}
function lowestGranularityForInterval(interval) {
  if (interval < durationSecond) {
    return "millisecond";
  } else if (interval < durationMinute) {
    return "second";
  } else if (interval < durationHour) {
    return "minute";
  } else if (interval < durationHour * 23) {
    return "hour";
  } else if (interval < 28 * durationDay) {
    return "day";
  } else if (interval < durationYear) {
    return "month";
  } else {
    return "year";
  }
}
function lowestGranularityUnitForTicks(ticks) {
  if (ticks.length === 0) {
    return "millisecond";
  } else if (ticks.length === 1) {
    return lowestGranularityUnitForValue(ticks[0]);
  }
  let minInterval = Infinity;
  for (let i = 1; i < ticks.length; i++) {
    minInterval = Math.min(minInterval, Math.abs(ticks[i].valueOf() - ticks[i - 1].valueOf()));
  }
  return lowestGranularityForInterval(minInterval);
}
function lowestGranularityUnitForValue(value) {
  if (intervalFloor("second", value) < value) {
    return "millisecond";
  } else if (intervalFloor("minute", value) < value) {
    return "second";
  } else if (intervalFloor("hour", value) < value) {
    return "minute";
  } else if (intervalFloor("day", value) < value) {
    return "hour";
  } else if (intervalFloor("month", value) < value) {
    return "day";
  } else if (intervalFloor("year", value) < value) {
    return "month";
  }
  return "year";
}
function dateTruncationForDomain(domain) {
  const [d0, d1] = domain.length === 0 ? [0, 0] : findMinMax([domain[0].valueOf(), domain.at(-1).valueOf()]);
  const startYear = new Date(d0).getFullYear();
  const stopYear = new Date(d1).getFullYear();
  if (startYear !== stopYear)
    return;
  const startMonth = new Date(d0).getMonth();
  const stopMonth = new Date(d1).getMonth();
  if (startMonth !== stopMonth)
    return "year";
  const startDate = new Date(d0).getDate();
  const stopDate = new Date(d1).getDate();
  if (startDate !== stopDate)
    return "month";
  return "day";
}

// packages/ag-charts-core/src/data/epochColumns.ts
var epochColumnCache = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
function parseEpochValue(value) {
  return typeof value === "string" ? timeValueToNumber(value) : value;
}
function ensureEpochColumn(values) {
  const cached = epochColumnCache.get(values);
  if (cached !== void 0)
    return cached;
  const hasStrings = values.some((v) => typeof v === "string");
  const converted = hasStrings ? values.map(parseEpochValue) : values;
  epochColumnCache.set(values, converted);
  return converted;
}
function seedEpochColumnIdentity(values) {
  if (!epochColumnCache.has(values)) {
    epochColumnCache.set(values, values);
  }
}
function getEpochColumn(values) {
  return epochColumnCache.get(values);
}
function invalidateEpochColumn(values) {
  epochColumnCache.delete(values);
}

// packages/ag-charts-core/src/data/extent.ts
function extent(values, sortOrder) {
  if (values.length === 0) {
    return null;
  }
  if (sortOrder !== void 0) {
    const first2 = values.at(0);
    const last = values.at(-1);
    const v0 = first2 instanceof Date ? first2.getTime() : first2;
    const v1 = last instanceof Date ? last.getTime() : last;
    if (isNumericValue(v0) && isNumericValue(v1)) {
      return sortOrder === 1 ? [v0, v1] : [v1, v0];
    }
  }
  let min = Infinity;
  let max = -Infinity;
  for (const n of values) {
    const v = n instanceof Date ? n.getTime() : n;
    if (!isNumericValue(v))
      continue;
    if (v < min) {
      min = v;
    }
    if (v > max) {
      max = v;
    }
  }
  return isFiniteNumericValue(min) && isFiniteNumericValue(max) ? [min, max] : null;
}
function normalisedExtentWithMetadata(d, min, max, preferredMin, preferredMax, toValue, sortOrder) {
  let clipped = false;
  const domainExtentNumbers = extent(d, sortOrder);
  const domainExtent = domainExtentNumbers && toValue ? [toValue(Number(domainExtentNumbers[0])), toValue(Number(domainExtentNumbers[1]))] : domainExtentNumbers;
  if (domainExtent == null) {
    let nullExtent;
    if (min != null && max != null && min <= max) {
      nullExtent = [min, max];
    } else if (preferredMin != null && preferredMax != null && preferredMin <= preferredMax) {
      nullExtent = [preferredMin, preferredMax];
    }
    return { extent: nullExtent ?? [], clipped: false };
  }
  let [d0, d1] = domainExtent;
  if (min != null) {
    clipped || (clipped = min > d0);
    d0 = min;
  } else if (preferredMin != null && preferredMin < d0) {
    d0 = preferredMin;
  }
  if (max != null) {
    clipped || (clipped = max < d1);
    d1 = max;
  } else if (preferredMax != null && preferredMax > d1) {
    d1 = preferredMax;
  }
  if (d0 > d1) {
    return { extent: [], clipped: false };
  }
  return { extent: [d0, d1], clipped };
}
function normalisedTimeExtentWithMetadata(input, min, max, preferredMin, preferredMax) {
  const { extent: e, clipped } = normalisedExtentWithMetadata(
    input.domain,
    isNumber(min) ? new Date(min) : min,
    isNumber(max) ? new Date(max) : max,
    isNumber(preferredMin) ? new Date(preferredMin) : preferredMin,
    isNumber(preferredMax) ? new Date(preferredMax) : preferredMax,
    (x) => new Date(x),
    input.sortMetadata?.sortOrder
  );
  return { extent: e.map((x) => new Date(x)), clipped };
}

// packages/ag-charts-core/src/data/json.ts
function jsonDiff(source, target, shallow, removed) {
  if (isArray(target)) {
    if (!isArray(source) || source.length !== target.length || target.some((v, i) => jsonDiff(source[i], v, shallow, removed) != null)) {
      return target;
    }
  } else if (isPlainObject(target)) {
    if (!isPlainObject(source)) {
      return target;
    }
    const result = {};
    const allKeys = /* @__PURE__ */ new Set([
      ...Object.keys(source),
      ...Object.keys(target)
    ]);
    for (const key of allKeys) {
      if (source[key] === target[key]) {
        continue;
      } else if (removed !== void 0 && !(key in target) && source[key] !== void 0) {
        result[key] = removed;
      } else if (shallow?.has(key)) {
        result[key] = target[key];
      } else if (typeof source[key] === typeof target[key]) {
        const diff = jsonDiff(source[key], target[key], shallow, removed);
        if (diff !== null) {
          result[key] = diff;
        }
      } else {
        result[key] = target[key];
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } else if (source !== target) {
    return target;
  }
  return null;
}
function jsonPropertyCompare(source, target) {
  for (const key of Object.keys(source)) {
    if (source[key] === target?.[key])
      continue;
    return false;
  }
  return true;
}
function deepClone(source, opts) {
  if (isArray(source)) {
    return cloneArray(source, opts);
  }
  if (isPlainObject(source)) {
    return clonePlainObject(source, opts);
  }
  if (source instanceof Map) {
    return new Map(deepClone(Array.from(source)));
  }
  return shallowClone(source);
}
function cloneArray(source, opts) {
  const result = [];
  const seen = opts?.seen;
  for (const item of source) {
    if (typeof item === "object" && seen?.includes(item)) {
      warn("cycle detected in array", item);
      continue;
    }
    seen?.push(item);
    result.push(deepClone(item, opts));
    seen?.pop();
  }
  return result;
}
function clonePlainObject(source, opts) {
  const target = {};
  for (const key of Object.keys(source)) {
    if (opts?.assign?.has(key)) {
      target[key] = source[key];
    } else if (opts?.shallow?.has(key)) {
      target[key] = shallowClone(source[key]);
    } else {
      target[key] = deepClone(source[key], opts);
    }
  }
  return target;
}
function shallowClone(source) {
  if (isArray(source)) {
    return source.slice(0);
  }
  if (isPlainObject(source)) {
    return { ...source };
  }
  if (isDate(source)) {
    return new Date(source);
  }
  if (isRegExp(source)) {
    return new RegExp(source.source, source.flags);
  }
  return source;
}
function jsonWalk(json, visit, skip, parallelJson, ctx, acc) {
  if (isArray(json)) {
    acc = visit(json, parallelJson, ctx, acc);
    let index = 0;
    for (const node of json) {
      acc = jsonWalk(node, visit, skip, parallelJson?.[index], ctx, acc);
      index++;
    }
  } else if (isPlainObject(json)) {
    acc = visit(json, parallelJson, ctx, acc);
    for (const key of Object.keys(json)) {
      if (skip?.has(key)) {
        continue;
      }
      const value = json[key];
      acc = jsonWalk(value, visit, skip, parallelJson?.[key], ctx, acc);
    }
  }
  return acc;
}

// packages/ag-charts-core/src/data/linkedList.ts
function insertListItemsSorted(list, items, cmp2) {
  let head = list;
  let current = head;
  for (const value of items) {
    if (head == null || cmp2(head.value, value) > 0) {
      head = { value, next: head };
      current = head;
    } else {
      current = current;
      while (current.next != null && cmp2(current.next.value, value) <= 0) {
        current = current.next;
      }
      current.next = { value, next: current.next };
    }
  }
  return head;
}

// packages/ag-charts-core/src/data/nearest.ts
function nearestSquared(x, y, objects, maxDistanceSquared = Infinity) {
  const result = { nearest: void 0, distanceSquared: maxDistanceSquared };
  for (const obj of objects) {
    const thisDistance = obj.distanceSquared(x, y);
    if (thisDistance === 0) {
      return { nearest: obj, distanceSquared: 0 };
    } else if (thisDistance < result.distanceSquared) {
      result.nearest = obj;
      result.distanceSquared = thisDistance;
    }
  }
  return result;
}
function nearestSquaredInContainer(x, y, container, maxDistanceSquared = Infinity) {
  const { x: tx = x, y: ty = y } = container.transformPoint?.(x, y) ?? {};
  const result = { nearest: void 0, distanceSquared: maxDistanceSquared };
  for (const child of container.children) {
    const { nearest, distanceSquared: distanceSquared2 } = child.nearestSquared(tx, ty, result.distanceSquared);
    if (distanceSquared2 === 0) {
      return { nearest, distanceSquared: distanceSquared2 };
    } else if (distanceSquared2 < result.distanceSquared) {
      result.nearest = nearest;
      result.distanceSquared = distanceSquared2;
    }
  }
  return result;
}

// packages/ag-charts-core/src/data/value.ts
function isStringObject(value) {
  return value != null && Object.hasOwn(value, "toString") && isString(value.toString());
}
function isNumberObject(value) {
  return value != null && Object.hasOwn(value, "valueOf") && isFiniteNumber(value.valueOf());
}
function isContinuous(value) {
  return isFiniteNumber(value) || typeof value === "bigint" || isValidDate(value) || isNumberObject(value);
}
function checkDatum(value, isContinuousScale) {
  return value != null && (!isContinuousScale || isContinuous(value));
}
function transformIntegratedCategoryValue(value) {
  if (isStringObject(value) && Object.hasOwn(value, "id")) {
    return value.id;
  }
  return value;
}
function readIntegratedWrappedValue(value) {
  if (isStringObject(value) && Object.hasOwn(value, "value")) {
    return value.value;
  }
  return value;
}

// packages/ag-charts-core/src/data/visibleRange.ts
function rescaleVisibleRange(visibleRange, [s0, s1], [d0, d1]) {
  const dr = d1 - d0;
  const vr = s1 - s0;
  const vd0 = s0 + vr * visibleRange[0];
  const vd1 = s0 + vr * visibleRange[1];
  return [(vd0 - d0) / dr, (vd1 - d0) / dr];
}

// packages/ag-charts-core/src/geometry/angle.ts
var twoPi = Math.PI * 2;
var halfPi = Math.PI / 2;
function normalizeAngle360(radians) {
  radians %= twoPi;
  radians += twoPi;
  radians %= twoPi;
  return radians;
}
function normalizeAngle360Inclusive(radians) {
  radians %= twoPi;
  radians += twoPi;
  if (radians !== twoPi) {
    radians %= twoPi;
  }
  return radians;
}
function normalizeAngle180(radians) {
  radians %= twoPi;
  if (radians < -Math.PI) {
    radians += twoPi;
  } else if (radians >= Math.PI) {
    radians -= twoPi;
  }
  return radians;
}
function isBetweenAngles(targetAngle, startAngle, endAngle) {
  const t = normalizeAngle360(targetAngle);
  const a0 = normalizeAngle360(startAngle);
  const a1 = normalizeAngle360(endAngle);
  if (a0 < a1) {
    return a0 <= t && t <= a1;
  } else if (a0 > a1) {
    return a0 <= t || t <= a1;
  } else {
    return startAngle !== endAngle;
  }
}
function toRadians(degrees) {
  return degrees / 180 * Math.PI;
}
function toDegrees(radians) {
  return radians / Math.PI * 180;
}
function angleBetween(angle0, angle1) {
  angle0 = normalizeAngle360(angle0);
  angle1 = normalizeAngle360(angle1);
  return angle1 - angle0 + (angle0 > angle1 ? twoPi : 0);
}
function getAngleRatioRadians(angle2) {
  const normalizedAngle = normalizeAngle360(angle2);
  if (normalizedAngle <= halfPi) {
    return normalizedAngle / halfPi;
  } else if (normalizedAngle <= Math.PI) {
    return (Math.PI - normalizedAngle) / halfPi;
  } else if (normalizedAngle <= 1.5 * Math.PI) {
    return (normalizedAngle - Math.PI) / halfPi;
  } else {
    return (twoPi - normalizedAngle) / halfPi;
  }
}
function angularPadding(hPadding, vPadding, angle2) {
  const angleRatio = getAngleRatioRadians(angle2);
  return hPadding * angleRatio + vPadding * Math.abs(1 - angleRatio);
}
function normalizeAngle360FromDegrees(degrees) {
  return degrees == null ? 0 : normalizeAngle360(toRadians(degrees));
}

// packages/ag-charts-core/src/geometry/boxBounds.ts
function boxCollides(b, x, y, w, h) {
  return x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y;
}
function boxContains(b, x, y, w = 0, h = 0) {
  return x >= b.x && x + w <= b.x + b.width && y >= b.y && y + h <= b.y + b.height;
}
function insetBox(b, inset) {
  return { x: b.x + inset, y: b.y + inset, width: b.width - 2 * inset, height: b.height - 2 * inset };
}
function insetBoxXY(b, insetX, insetY) {
  return { x: b.x + insetX, y: b.y + insetY, width: b.width - 2 * insetX, height: b.height - 2 * insetY };
}
function boxEmpty(b) {
  return b == null || b.height === 0 || b.width === 0 || Number.isNaN(b.height) || Number.isNaN(b.width);
}
function boxesEqual(a, b) {
  if (a === b)
    return true;
  if (a == null || b == null)
    return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
function toCurrentPoint(canvasPoint, currentBounds) {
  const { x: offsetX = 0, y: offsetY = 0 } = currentBounds ?? {};
  return {
    currentX: canvasPoint.canvasX - offsetX,
    currentY: canvasPoint.canvasY - offsetY
  };
}
function toClippedCanvasPoint(currentPoint, canvasBounds) {
  let { currentX: canvasX, currentY: canvasY } = currentPoint;
  if (!canvasBounds) {
    return { canvasX, canvasY };
  }
  canvasX += canvasBounds.x;
  canvasY += canvasBounds.y;
  canvasX = clamp(canvasBounds.x, canvasX, canvasBounds.x + canvasBounds.width);
  canvasY = clamp(canvasBounds.y, canvasY, canvasBounds.y + canvasBounds.height);
  return { canvasX, canvasY };
}

// packages/ag-charts-core/src/geometry/axisLabelCollision.ts
var DEFAULT_TICK_LABEL_SPACING = 10;
function tickLabelSpacing(minSpacing, rotated) {
  return minSpacing ?? (rotated ? 0 : DEFAULT_TICK_LABEL_SPACING);
}
function axisLabelsOverlap(boxes, spacing = 0) {
  const result = [];
  for (const box of boxes) {
    const { x, y, width: width2, height: height2 } = box;
    if (result.some((l) => boxCollides(l, x, y, width2 + spacing, height2 + spacing))) {
      return true;
    }
    result.push(box);
  }
  return false;
}
function thinTickLabels(next, overlaps, avoidCollisions, autoRotateAngle) {
  let candidate;
  let autoRotation = 0;
  let overlap = true;
  while (overlap) {
    const step = next();
    if (step == null)
      break;
    candidate = step.candidate;
    autoRotation = autoRotateAngle != null && overlaps(candidate, 0) ? autoRotateAngle : 0;
    if (step.pinned)
      break;
    overlap = avoidCollisions && overlaps(candidate, autoRotation);
  }
  return { candidate, autoRotation };
}
function resolveEdgeLabelOverflow({ firstStart, lastEnd, start: start2, end: end3, pairEnds }) {
  let hideLast = lastEnd != null && lastEnd > end3;
  let hideFirst = hideLast && pairEnds;
  if (!hideFirst && firstStart != null && firstStart < start2) {
    hideFirst = true;
    hideLast || (hideLast = pairEnds);
  }
  return { hideFirst, hideLast };
}
function labelExceedsBand(labelSize, bandSize) {
  return labelSize > bandSize;
}
function radialLabelsCollide(prev, next, minSpacing) {
  if (prev.hidden || next.hidden)
    return false;
  const a = prev.box;
  const b = next.box;
  const grow = minSpacing == null ? 0 : minSpacing / 2;
  return boxCollides(
    { x: a.x - grow, y: a.y - grow, width: a.width + grow * 2, height: a.height + grow * 2 },
    b.x - grow,
    b.y - grow,
    b.width + grow * 2,
    b.height + grow * 2
  );
}
function hideRadialLabel(label) {
  label.hidden = true;
  label.box = void 0;
}
function coincident(a, b) {
  return isNumberEqual(a.x, b.x) && isNumberEqual(a.y, b.y);
}
function hideCollidingRadialCategoryLabels(labels, minSpacing) {
  if (labels.length < 3)
    return;
  const collide = (prev, next) => radialLabelsCollide(prev, next, minSpacing);
  const firstLabel = labels[0];
  const visibleLabels = /* @__PURE__ */ new Set([firstLabel]);
  const walked = coincident(firstLabel, labels.at(-1)) ? labels.slice(0, -1) : labels;
  const maxStep = Math.floor(labels.length / 2);
  for (let step = 1; step <= maxStep; step++) {
    if (!walkPairsOutward(walked, step, collide)) {
      walkPairsOutward(walked, step, (_, next) => {
        visibleLabels.add(next);
      });
      break;
    }
  }
  for (const label of labels) {
    if (!visibleLabels.has(label)) {
      hideRadialLabel(label);
    }
  }
}
function hideCollidingRadialNumberLabels(labels, minSpacing) {
  const firstLabel = labels[0];
  const lastLabel = labels.at(-1);
  if (firstLabel !== lastLabel && coincident(firstLabel, lastLabel)) {
    lastLabel.hidden = true;
  }
  for (let step = 1; step < labels.length; step *= 2) {
    let collisionDetected = false;
    for (let i = step; i < labels.length; i += step) {
      if (radialLabelsCollide(labels[i - step], labels[i], minSpacing)) {
        collisionDetected = true;
        break;
      }
    }
    if (!collisionDetected) {
      for (const [i, label] of labels.entries()) {
        if (i % step > 0)
          hideRadialLabel(label);
      }
      return;
    }
  }
  for (const [i, label] of labels.entries()) {
    if (i > 0)
      hideRadialLabel(label);
  }
}
function walkPairsOutward(items, step, visitPair) {
  const middleIndex = Math.floor(items.length / 2);
  return walkPairsByStep(items, step, middleIndex, step, visitPair) || walkPairsByStep(items, items.length - step, middleIndex, -step, visitPair);
}
function walkPairsByStep(items, startIndex, endIndex, step, visitPair) {
  let previous = items[0];
  for (let i = startIndex; step > 0 ? i <= endIndex : i > endIndex; i += step) {
    const current = items[i];
    if (visitPair(previous, current)) {
      return true;
    }
    previous = current;
  }
  return false;
}

// packages/ag-charts-core/src/geometry/trapezoid.ts
var toBox = (t, spanLo, spanHi, crossExtent) => {
  const crossLo = t.crossCentre - crossExtent / 2;
  return t.vertical ? { x: crossLo, y: spanLo, width: crossExtent, height: spanHi - spanLo } : { x: spanLo, y: crossLo, width: spanHi - spanLo, height: crossExtent };
};
var widthAt = (t, span) => t.extentLo + (t.extentHi - t.extentLo) * (span - t.spanLo) / (t.spanHi - t.spanLo);
function trapezoidBox(t) {
  return toBox(t, t.spanLo, t.spanHi, Math.max(t.extentLo, t.extentHi));
}
function trapezoidExtentAcross(t, bandLo, bandHi) {
  if (t.spanHi <= t.spanLo)
    return Math.max(t.extentLo, t.extentHi);
  const lo = Math.max(t.spanLo, Math.min(bandLo, bandHi));
  const hi = Math.min(t.spanHi, Math.max(bandLo, bandHi));
  if (lo > hi)
    return 0;
  return Math.max(0, Math.min(widthAt(t, lo), widthAt(t, hi)));
}
function trapezoidBandRect(t, bandLo, bandHi) {
  return toBox(t, t.spanLo, t.spanHi, trapezoidExtentAcross(t, bandLo, bandHi));
}
function trapezoidOverlapsBox(t, box) {
  const boxSpanLo = t.vertical ? box.y : box.x;
  const boxSpanHi = boxSpanLo + (t.vertical ? box.height : box.width);
  const s0 = Math.max(t.spanLo, boxSpanLo);
  const s1 = Math.min(t.spanHi, boxSpanHi);
  if (s0 >= s1)
    return false;
  const crossExtent = t.spanHi > t.spanLo ? Math.max(widthAt(t, s0), widthAt(t, s1)) : Math.max(t.extentLo, t.extentHi);
  if (crossExtent <= 0)
    return false;
  const boxCrossLo = t.vertical ? box.x : box.y;
  const boxCrossHi = boxCrossLo + (t.vertical ? box.width : box.height);
  return boxCrossLo < t.crossCentre + crossExtent / 2 && boxCrossHi > t.crossCentre - crossExtent / 2;
}

// packages/ag-charts-core/src/geometry/fitRegion.ts
function regionWidthAt(region, top, bottom, offsetX = 0) {
  const [left, right] = region.spanAt(top, bottom);
  return Math.max(0, 2 * Math.min(offsetX - left, right - offsetX));
}
function regionTextCapacity(region, lineHeight) {
  const lines = Math.floor((region.extentAbove + region.extentBelow) / lineHeight);
  if (lines < 1) {
    return 0;
  }
  const widths = [];
  for (let top = -region.extentAbove; top + lineHeight <= region.extentBelow; top += lineHeight / 2) {
    widths.push(regionWidthAt(region, top, top + lineHeight));
  }
  return widths.toSorted((a, b) => b - a).slice(0, lines).reduce((total, width2) => total + width2, 0);
}
function trapezoidFitRegion(trapezoid, anchorSpan) {
  return {
    // Every cross-section of a trapezoid shares a centre, and the label is anchored on it.
    spanAt: (top, bottom) => {
      const half = trapezoidExtentAcross(trapezoid, anchorSpan + top, anchorSpan + bottom) / 2;
      return [-half, half];
    },
    extentAbove: anchorSpan - trapezoid.spanLo,
    extentBelow: trapezoid.spanHi - anchorSpan
  };
}
function probedFitRegion(anchor, contains, limit, steps = 20, rows = 5, probes = 16) {
  const reach = (top, bottom, direction) => {
    const sampled = Math.max(2, rows);
    const step = (bottom - top) / (sampled - 1);
    const insideBand = (t) => {
      const x = anchor.x + direction * t;
      for (let i = 0; i < sampled; i += 1) {
        if (!contains(x, anchor.y + top + step * i))
          return false;
      }
      return true;
    };
    return firstOutside(insideBand, limit, probes, steps);
  };
  const vertical = (direction) => firstOutside((t) => contains(anchor.x, anchor.y + direction * t), limit, probes, steps);
  return {
    // Wrapping asks for the same band once per candidate word, and each ask is a pair of outward
    // scans over a containment test, so the answer is memoised for the label's own short-lived region.
    spanAt: memoiseByBand((top, bottom) => [-reach(top, bottom, -1), reach(top, bottom, 1)]),
    extentAbove: vertical(-1),
    extentBelow: vertical(1)
  };
}
function firstOutside(inside, limit, probes, steps) {
  const count = Math.max(1, probes);
  const step = limit / count;
  let lo = 0;
  let hi = limit;
  for (let i = 1; i <= count; i += 1) {
    const t = Math.min(i * step, limit);
    if (!inside(t)) {
      hi = t;
      break;
    }
    lo = t;
  }
  if (lo >= limit)
    return limit;
  for (let i = 0; i < steps; i += 1) {
    const t = (lo + hi) / 2;
    if (inside(t)) {
      lo = t;
    } else {
      hi = t;
    }
  }
  return lo;
}
function memoiseByBand(spanAt) {
  const cache = /* @__PURE__ */ new Map();
  return (top, bottom) => {
    const key = `${top},${bottom}`;
    let span = cache.get(key);
    if (span == null) {
      span = spanAt(top, bottom);
      cache.set(key, span);
    }
    return span;
  };
}
function insetFitRegion(region, dx, dy) {
  return {
    spanAt: (top, bottom) => {
      const [left, right] = region.spanAt(top - dy, bottom + dy);
      const mid = (left + right) / 2;
      return [Math.min(left + dx, mid), Math.max(right - dx, mid)];
    },
    extentAbove: Math.max(0, region.extentAbove - dy),
    extentBelow: Math.max(0, region.extentBelow - dy)
  };
}
var EMPTY_SPAN = [0, 0];
function maskFitRegion(mask, scale, anchor) {
  const rows = mask.rows;
  const rowTop = mask.top * scale;
  const rowHeight = mask.rowHeight * scale;
  const { x: anchorX, y: anchorY } = anchor;
  const rowIndex = (offset) => (anchorY + offset - rowTop) / rowHeight;
  return {
    spanAt: (top, bottom) => {
      const first2 = Math.max(0, Math.floor(rowIndex(top) - 0.5));
      const last = Math.min(rows.length - 1, Math.ceil(rowIndex(bottom) + 0.5) - 1);
      if (first2 > last)
        return EMPTY_SPAN;
      let lo = -Infinity;
      let hi = Infinity;
      for (let i = first2; i <= last; i += 1) {
        const span = rows[i];
        if (span == null)
          return EMPTY_SPAN;
        lo = Math.max(lo, span[0] * scale);
        hi = Math.min(hi, span[1] * scale);
      }
      return lo <= hi ? [lo - anchorX, hi - anchorX] : EMPTY_SPAN;
    },
    extentAbove: anchorY - rowTop,
    extentBelow: rowTop + rows.length * rowHeight - anchorY
  };
}

// packages/ag-charts-core/src/rendering/canvasUtil.ts
var FONT_PROBE = "16px system-ui, -apple-system, sans-serif";
var FONT_PROBE_TEXT = "Hamburgefonstiv 0123456789";
var textOffscreenSupported;
function canRenderTextOffscreen() {
  textOffscreenSupported ?? (textOffscreenSupported = probeOffscreenFont());
  return textOffscreenSupported;
}
function probeOffscreenFont() {
  const documentContext = createDocumentContext(0, 0);
  if (documentContext == null)
    return true;
  if (typeof getOffscreenCanvas() !== "function")
    return false;
  const offscreenContext = createOffscreenContext(0, 0);
  documentContext.font = FONT_PROBE;
  offscreenContext.font = FONT_PROBE;
  return documentContext.measureText(FONT_PROBE_TEXT).width === offscreenContext.measureText(FONT_PROBE_TEXT).width;
}
function createCanvasContext(width2 = 0, height2 = 0) {
  const documentContext = canRenderTextOffscreen() ? null : createDocumentContext(width2, height2);
  return documentContext ?? createOffscreenContext(width2, height2);
}
function createDocumentContext(width2, height2) {
  const canvasElement = getDocument()?.createElement("canvas");
  if (canvasElement == null)
    return null;
  canvasElement.width = width2;
  canvasElement.height = height2;
  return canvasElement.getContext("2d");
}
function createOffscreenContext(width2, height2) {
  const OffscreenCanvasCtor = getOffscreenCanvas();
  return new OffscreenCanvasCtor(width2, height2).getContext("2d");
}
function clearContext({
  context,
  pixelRatio,
  width: width2,
  height: height2
}) {
  context.save();
  try {
    context.resetTransform();
    context.clearRect(0, 0, Math.ceil(width2 * pixelRatio), Math.ceil(height2 * pixelRatio));
  } finally {
    context.restore();
  }
}
function debugContext(ctx) {
  if (check("canvas")) {
    const save = ctx.save.bind(ctx);
    const restore = ctx.restore.bind(ctx);
    let depth = 0;
    Object.assign(ctx, {
      save() {
        save();
        depth++;
      },
      restore() {
        if (depth === 0) {
          throw new Error("AG Charts - Unable to restore() past depth 0");
        }
        restore();
        depth--;
      },
      verifyDepthZero() {
        if (depth !== 0) {
          throw new Error(`AG Charts - Save/restore depth is non-zero: ${depth}`);
        }
      }
    });
  }
}

// packages/ag-charts-core/src/rendering/textMeasurer.ts
var TextMeasurer = class {
  constructor(ctx, measureTextCached) {
    this.ctx = ctx;
    this.measureTextCached = measureTextCached;
    this.baselineMap = /* @__PURE__ */ new Map();
    this.charMap = /* @__PURE__ */ new Map();
    this.lineHeightCache = null;
  }
  baselineDistance(textBaseline) {
    if (textBaseline === "alphabetic")
      return 0;
    if (this.baselineMap.has(textBaseline)) {
      return this.baselineMap.get(textBaseline);
    }
    this.ctx.textBaseline = textBaseline;
    const { alphabeticBaseline } = this.ctx.measureText("");
    this.baselineMap.set(textBaseline, alphabeticBaseline);
    this.ctx.textBaseline = "alphabetic";
    return alphabeticBaseline;
  }
  lineHeight() {
    this.lineHeightCache ?? (this.lineHeightCache = this.measureText("").height);
    return this.lineHeightCache;
  }
  measureText(text) {
    const m = this.measureTextCached?.(text) ?? this.ctx.measureText(text);
    const {
      width: width2,
      // Apply fallbacks for environments like `node-canvas` where some metrics may be missing.
      fontBoundingBoxAscent: ascent = m.emHeightAscent,
      fontBoundingBoxDescent: descent = m.emHeightDescent
    } = m;
    const height2 = ascent + descent;
    return { width: width2, height: height2, ascent, descent };
  }
  measureLines(text) {
    const lines = typeof text === "string" ? text.split(LineSplitter) : text;
    let width2 = 0;
    let height2 = 0;
    const lineMetrics = lines.map((line) => {
      const b = this.measureText(line);
      if (width2 < b.width) {
        width2 = b.width;
      }
      height2 += b.height;
      return { text: line, ...b };
    });
    return { width: width2, height: height2, lineMetrics };
  }
  textWidth(text, estimate) {
    if (estimate) {
      let estimatedWidth = 0;
      for (let i = 0; i < text.length; i++) {
        estimatedWidth += this.textWidth(text.charAt(i));
      }
      return estimatedWidth;
    }
    if (text.length > 1) {
      return this.ctx.measureText(text).width;
    }
    return this.charMap.get(text) ?? this.charWidth(text);
  }
  charWidth(char) {
    const { width: width2 } = this.ctx.measureText(char);
    this.charMap.set(char, width2);
    return width2;
  }
};
var instanceMap = /*#__PURE__*/ new LRUCache(50);
function cachedTextMeasurer(font) {
  if (typeof font === "object") {
    font = toFontString(font);
  }
  let cachedMeasurer = instanceMap.get(font);
  if (cachedMeasurer)
    return cachedMeasurer;
  const cachedTextMetrics = new LRUCache(1e4);
  const ctx = createCanvasContext();
  ctx.font = font;
  cachedMeasurer = new TextMeasurer(ctx, (text) => {
    let textMetrics = cachedTextMetrics.get(text);
    if (textMetrics)
      return textMetrics;
    textMetrics = ctx.measureText(text);
    cachedTextMetrics.set(text, textMetrics);
    return textMetrics;
  });
  instanceMap.set(font, cachedMeasurer);
  return cachedMeasurer;
}
cachedTextMeasurer.clear = () => instanceMap.clear();
function resolvePadding(padding2) {
  if (padding2 == null)
    return { top: 0, right: 0, bottom: 0, left: 0 };
  if (typeof padding2 === "number")
    return { top: padding2, right: padding2, bottom: padding2, left: padding2 };
  return {
    top: padding2.top ?? 0,
    right: padding2.right ?? 0,
    bottom: padding2.bottom ?? 0,
    left: padding2.left ?? 0
  };
}
function imageSegmentBox(segment) {
  const pad2 = resolvePadding(segment.padding);
  const width2 = segment.width + pad2.left + pad2.right;
  const height2 = segment.height + pad2.top + pad2.bottom;
  return { width: width2, height: height2, ascent: height2, descent: 0 };
}
function toCanvasTextBaseline(verticalAlign2) {
  return verticalAlign2 === "baseline" ? "alphabetic" : verticalAlign2;
}
function imageBoxAroundBaseline(verticalAlign2, boxHeight, textAscent, textDescent) {
  switch (verticalAlign2) {
    case "top":
    case "hanging": {
      return { above: textAscent, below: boxHeight - textAscent };
    }
    case "bottom":
    case "ideographic": {
      return { above: boxHeight - textDescent, below: textDescent };
    }
    case "middle": {
      const above = (textAscent - textDescent) / 2 + boxHeight / 2;
      return { above, below: boxHeight - above };
    }
    case "alphabetic":
    default: {
      return { above: boxHeight, below: 0 };
    }
  }
}
var BLOCK_IMAGE_SPACING = 4;
function blockStripWidth(images) {
  if (images.length === 0)
    return 0;
  let total = 0;
  for (let i = 0; i < images.length; i++) {
    total += images[i].textMetrics.width;
    if (i > 0)
      total += BLOCK_IMAGE_SPACING;
  }
  return total;
}
function blockStripHeight(images) {
  let max = 0;
  for (const img of images)
    max = Math.max(max, img.textMetrics.height);
  return max;
}
function isBlockBoundary(segments, i) {
  const seg = segments[i];
  if (seg?.type !== "image" || seg.block !== true)
    return false;
  let j = i;
  while (j > 0) {
    const prev = segments[j - 1];
    if (prev.type !== "image") {
      return toTextString(prev.text).endsWith("\n");
    }
    if (prev.block !== true)
      return false;
    j--;
  }
  return true;
}
function emptyLine() {
  return { segments: [], width: 0, height: 0, ascent: 0, descent: 0, textAscent: 0, textDescent: 0 };
}
function measureTextSegments(textSegments, defaultFont) {
  let currentLine = emptyLine();
  const lineMetrics = [currentLine];
  let currentLineUncommitted = false;
  let blockStartIndex = null;
  function finalizeBlock() {
    if (blockStartIndex === null)
      return;
    let endIndex = lineMetrics.length;
    if (currentLineUncommitted && endIndex > blockStartIndex + 1) {
      endIndex -= 1;
    }
    lineMetrics[blockStartIndex].blockRowSpan = endIndex - blockStartIndex;
    blockStartIndex = null;
  }
  function openNewLine() {
    currentLine = emptyLine();
    lineMetrics.push(currentLine);
    currentLineUncommitted = true;
  }
  for (let i = 0; i < textSegments.length; i++) {
    const segment = textSegments[i];
    if (isBlockBoundary(textSegments, i)) {
      const extendsStrip = i > 0 && textSegments[i - 1].type === "image" && textSegments[i - 1].block === true;
      if (!extendsStrip) {
        finalizeBlock();
        if (currentLine.segments.length > 0 || currentLine.blockImages) {
          openNewLine();
        }
      }
      const blockMetrics = imageSegmentBox(segment);
      const measured = { ...segment, textMetrics: blockMetrics };
      currentLine.blockImages ?? (currentLine.blockImages = []);
      currentLine.blockImages.push(measured);
      if (!extendsStrip) {
        blockStartIndex = lineMetrics.length - 1;
      }
      currentLineUncommitted = false;
      continue;
    }
    if (segment.type === "image") {
      const textMetrics = imageSegmentBox(segment);
      currentLine.width += textMetrics.width;
      currentLine.segments.push({ ...segment, textMetrics });
      currentLineUncommitted = false;
      continue;
    }
    const {
      text,
      fontSize = defaultFont.fontSize,
      fontStyle = defaultFont.fontStyle,
      fontWeight: fontWeight2 = defaultFont.fontWeight,
      fontFamily = defaultFont.fontFamily,
      lineHeight,
      // Consumed by the auto-size search before measuring; a measured segment is spread onto a scene
      // node, which would take it as a property of its own.
      minimumFontSize: _minimumFontSize,
      ...rest
    } = segment;
    const font = { fontSize, fontStyle, fontWeight: fontWeight2, fontFamily };
    const measurer = cachedTextMeasurer(font);
    const textLines = toTextString(text).split(LineSplitter);
    for (let j = 0; j < textLines.length; j++) {
      const textLine = textLines[j];
      const textMetrics = measurer.measureText(textLine);
      if (j > 0) {
        openNewLine();
      }
      if (textLine !== "") {
        currentLine.width += textMetrics.width;
        currentLine.ascent = Math.max(currentLine.ascent, textMetrics.ascent);
        currentLine.descent = Math.max(currentLine.descent, textMetrics.descent);
        currentLine.height = Math.max(currentLine.height, currentLine.ascent + currentLine.descent);
        if (typeof lineHeight === "number" && lineHeight > currentLine.height) {
          currentLine.descent = lineHeight - currentLine.ascent;
          currentLine.height = lineHeight;
        }
        currentLine.segments.push({ ...font, ...rest, text: textLine, textMetrics });
        currentLineUncommitted = false;
      }
    }
  }
  finalizeBlock();
  for (const line of lineMetrics) {
    line.textAscent = line.ascent;
    line.textDescent = line.descent;
    for (const seg of line.segments) {
      if (seg.type !== "image")
        continue;
      const { above, below } = imageBoxAroundBaseline(
        toCanvasTextBaseline(seg.verticalAlign),
        seg.textMetrics.height,
        line.textAscent,
        line.textDescent
      );
      line.ascent = Math.max(line.ascent, above);
      line.descent = Math.max(line.descent, below);
    }
    line.height = Math.max(line.height, line.ascent + line.descent);
  }
  let maxWidth = 0;
  let totalHeight = 0;
  for (let i = 0; i < lineMetrics.length; ) {
    const line = lineMetrics[i];
    if (line.blockImages != null && line.blockImages.length > 0) {
      const span = line.blockRowSpan ?? 1;
      const stripWidth = blockStripWidth(line.blockImages);
      const stripHeight = blockStripHeight(line.blockImages);
      let innerColWidth = 0;
      let innerColHeight = 0;
      for (let k = 0; k < span; k++) {
        const inner = lineMetrics[i + k];
        innerColWidth = Math.max(innerColWidth, inner.width);
        innerColHeight += inner.height;
      }
      const rowWidth = stripWidth + (innerColWidth > 0 ? BLOCK_IMAGE_SPACING + innerColWidth : 0);
      const rowHeight = Math.max(stripHeight, innerColHeight);
      maxWidth = Math.max(maxWidth, rowWidth);
      totalHeight += rowHeight;
      i += span;
    } else {
      maxWidth = Math.max(maxWidth, line.width);
      totalHeight += line.height;
      i += 1;
    }
  }
  return { width: maxWidth, height: totalHeight, lineMetrics };
}

// packages/ag-charts-core/src/text/textWrapper.ts
function lineMaxWidth(options, top, bottom) {
  if (options.maxWidthAt == null)
    return options.maxWidth;
  return Math.min(options.maxWidth, options.maxWidthAt(top, bottom));
}
function shouldHideOverflow(clippedResult, options, source) {
  if (options.overflow !== "hide")
    return false;
  if (clippedResult.some(isTextTruncated))
    return true;
  return keptCharacterCount(clippedResult.join("")) < keptCharacterCount(source);
}
function keptCharacterCount(text) {
  return survivingCharacters(unguardTextEdges(text));
}
function preservesText(options) {
  return options.overflow === "preserve";
}
function wrapTextOrSegments(input, options) {
  return isArray(input) ? wrapTextSegments(input, options) : wrapLines(toTextString(input), options).join("\n");
}
function wrapText(text, options) {
  return wrapLines(text, options).join("\n");
}
function fitLabelText(text, fit, font) {
  if (fit == null)
    return text;
  const { maxWidth, maxHeight, wrapping, overflowStrategy: overflowStrategy2, region, lineHeight } = fit;
  if (maxWidth == null && maxHeight == null && region == null)
    return text;
  const overflow = overflowStrategy2 ?? "preserve";
  const options = {
    font,
    maxWidth: maxWidth ?? Infinity,
    // A height bound can only be honoured by dropping lines, which 'preserve' forbids.
    maxHeight: overflow === "preserve" ? void 0 : maxHeight,
    lineHeight,
    textWrap: wrapping,
    overflow
  };
  return region == null ? wrapTextOrSegments(text, options) : wrapTextToRegion(text, options, region, fit.regionAlign ?? "center", true, fit.boxed).text;
}
function fitLabelTextToRegion(text, fit, font, anchored = false) {
  if (fit?.region == null)
    return { text: fitLabelText(text, fit, font), offsetX: 0, offsetY: 0 };
  const overflow = fit.overflowStrategy ?? "preserve";
  return wrapTextToRegion(
    text,
    {
      font,
      maxWidth: fit.maxWidth ?? Infinity,
      maxHeight: overflow === "preserve" ? void 0 : fit.maxHeight,
      lineHeight: fit.lineHeight,
      textWrap: fit.wrapping,
      overflow
    },
    fit.region,
    fit.regionAlign ?? "center",
    anchored,
    fit.boxed
  );
}
var MAX_REGION_REFINEMENTS = 12;
function measureText(text, font) {
  return isArray(text) ? measureTextSegments(text, font) : cachedTextMeasurer(font).measureLines(toTextString(text));
}
function survivingCharacters(text) {
  return text.replaceAll(EllipsisChar, "").replace(/\s/g, "").length;
}
function blockTopFor(align2, height2, region) {
  if (height2 >= region.extentAbove + region.extentBelow)
    return -region.extentAbove;
  let top = -height2 / 2;
  if (align2 === "start") {
    top = 0;
  } else if (align2 === "end") {
    top = -height2;
  }
  return Math.min(Math.max(top, -region.extentAbove), region.extentBelow - height2);
}
function blockOffsetX(region, bands) {
  const spans = bands.map(([top, bottom]) => region.spanAt(top, bottom));
  const candidates = [0];
  for (const [left, right] of spans) {
    if (left < right)
      candidates.push((left + right) / 2);
  }
  let best = 0;
  let bestTotal = -1;
  for (const offset of candidates) {
    let total = 0;
    for (const [left, right] of spans) {
      total += Math.max(0, 2 * Math.min(offset - left, right - offset));
    }
    if (total > bestTotal) {
      bestTotal = total;
      best = offset;
    }
  }
  return best;
}
function wrapBlockToRegion(text, options, region, align2, limit, lineHeight, lines, anchored, boxed) {
  const height2 = Math.min(lines * lineHeight, limit);
  const blockTop = blockTopFor(align2, height2, region);
  const bands = [];
  if (boxed) {
    bands.push([blockTop, blockTop + height2]);
  } else {
    for (let i = 0; i < lines; i += 1) {
      bands.push([blockTop + i * lineHeight, blockTop + (i + 1) * lineHeight]);
    }
  }
  const offsetX = anchored ? 0 : blockOffsetX(region, bands);
  const widthAt2 = boxed ? () => regionWidthAt(region, blockTop, blockTop + height2, offsetX) : (top, bottom) => regionWidthAt(region, blockTop + top, blockTop + bottom, offsetX);
  const wrapped = wrapTextOrSegments(text, {
    ...options,
    // The band a line occupies must be the one it will be drawn in, so the width the shape offers is
    // asked for the same rows the renderer will fill; the font's own line height is shorter.
    lineHeight,
    // The shape's own room bounds the block, so a caller need not restate it as maxHeight.
    maxHeight: height2,
    maxWidthAt: widthAt2
  });
  const marked = markLostText(String(wrapped), text, options, widthAt2, lineHeight);
  const drawnLines = marked.split("\n").length;
  const shorter = !anchored && marked !== "" && drawnLines < lines;
  const drawnHeight = shorter ? drawnLines * lineHeight : height2;
  return {
    text: marked,
    offsetX,
    offsetY: blockTop + drawnHeight / 2,
    consistent: shorter || drawnLines === lines
  };
}
function markLostText(wrapped, source, options, widthAt2, lineHeight) {
  if (wrapped === "" || options.overflow !== "ellipsis" || isTextTruncated(wrapped))
    return wrapped;
  if (survivingCharacters(wrapped) >= survivingCharacters(source))
    return wrapped;
  const lines = wrapped.split("\n");
  const last = lines.length - 1;
  const width2 = widthAt2(last * lineHeight, (last + 1) * lineHeight);
  lines[last] = truncateLine(lines[last], cachedTextMeasurer(options.font), width2, true);
  return lines.join("\n");
}
function wrapTextToRegion(text, options, region, align2, anchored = false, boxed = false) {
  const limit = Math.min(options.maxHeight ?? Infinity, region.extentAbove + region.extentBelow);
  if (isArray(text)) {
    return refineSegmentsToRegion(text, options, region, align2, limit, boxed);
  }
  const lineHeight = options.lineHeight ?? cachedTextMeasurer(options.font).lineHeight();
  const source = toTextString(text);
  const wanted = survivingCharacters(source);
  const roomForLines = Math.floor(limit / Math.max(1, lineHeight));
  const maxLines = Math.max(1, Math.min(roomForLines, source.length));
  let best;
  let bestKept = 0;
  for (let lines = 1; lines <= maxLines; lines += 1) {
    const candidate = wrapBlockToRegion(source, options, region, align2, limit, lineHeight, lines, anchored, boxed);
    const kept = survivingCharacters(candidate.text);
    if (isBetterCandidate(candidate.consistent, kept, best?.consistent, bestKept)) {
      bestKept = kept;
      best = candidate;
    }
    if (bestKept >= wanted && best?.consistent === true)
      break;
  }
  if (best == null)
    return { text, offsetX: 0, offsetY: 0 };
  return { text: best.text, offsetX: best.offsetX, offsetY: best.offsetY };
}
function isBetterCandidate(consistent, kept, bestConsistent, bestKept) {
  if (bestConsistent == null)
    return true;
  if (consistent !== bestConsistent)
    return consistent;
  return kept > bestKept;
}
function refineSegmentsToRegion(text, options, region, align2, limit, boxed) {
  let height2 = measureText(text, options.font).height;
  let lines = 1;
  let result = text;
  let blockTop = 0;
  for (let i = 0; i < MAX_REGION_REFINEMENTS; i += 1) {
    const blockHeight = Math.min(height2, limit);
    blockTop = blockTopFor(align2, blockHeight, region);
    result = wrapTextOrSegments(text, {
      ...options,
      lineHeight: height2 / lines,
      maxHeight: limit,
      maxWidthAt: boxed ? () => regionWidthAt(region, blockTop, blockTop + blockHeight) : (top, bottom) => regionWidthAt(region, blockTop + top, blockTop + bottom)
    });
    const next = measureText(result, options.font).height;
    lines = Math.max(1, Math.round(next / (height2 / lines)));
    if (next === height2)
      break;
    height2 = next;
  }
  return { text: result, offsetX: 0, offsetY: blockTop + Math.min(height2, limit) / 2 };
}
function withFitRegion(fit, region) {
  if (fit == null || region == null)
    return fit;
  return { ...fit, region };
}
function isErased(text) {
  return isArray(text) ? text.length === 0 : String(text).length === 0;
}
function keptCharacters(text) {
  if (!isArray(text))
    return survivingCharacters(toTextString(text));
  let kept = 0;
  for (const segment of text) {
    if (segment.type !== "image")
      kept += survivingCharacters(toTextString(segment.text));
  }
  return kept;
}
function hasRealChars(text) {
  if (!isArray(text))
    return survivingCharacters(toTextString(text)) > 0;
  for (const segment of text) {
    if (segment.type !== "image" && survivingCharacters(toTextString(segment.text)) > 0)
      return true;
  }
  return false;
}
function fitLabelTextOrOverflow(text, fit, fitOverflow, font) {
  const fitted = fitLabelText(text, fit, font);
  if (fitOverflow == null || !isErased(fitted) || isErased(text))
    return fitted;
  return fitLabelText(text, fitOverflow, font);
}
function fontWithSize(font, fontSize) {
  if (fontSize == null || fontSize === font.fontSize)
    return font;
  return { fontSize, fontStyle: font.fontStyle, fontWeight: font.fontWeight, fontFamily: font.fontFamily };
}
function resolveMinimumFontSize(minimumFontSize, fontSize) {
  return minimumFontSize == null ? fontSize : Math.min(minimumFontSize, fontSize);
}
function findLargestFittingStep(steps, probe) {
  const top = steps - 1;
  if (top < 0)
    return void 0;
  return probe(top) ?? findMaxValue(0, top - 1, probe);
}
function fontSizeLadder(minimumFontSize, fontSize) {
  const lowest = Math.floor(minimumFontSize) === minimumFontSize ? minimumFontSize + 1 : Math.ceil(minimumFontSize);
  const highest = Math.ceil(fontSize) === fontSize ? fontSize - 1 : Math.floor(fontSize);
  const steps = 2 + Math.max(0, highest - lowest + 1);
  const sizeAt = (index) => {
    if (index === 0)
      return minimumFontSize;
    return index === steps - 1 ? fontSize : lowest + index - 1;
  };
  return { steps, sizeAt };
}
function findLargestFittingFontSize(minimumFontSize, fontSize, probe) {
  if (minimumFontSize >= fontSize)
    return probe(fontSize, true);
  const { steps, sizeAt } = fontSizeLadder(minimumFontSize, fontSize);
  return findLargestFittingStep(steps, (index) => probe(sizeAt(index), index === 0));
}
function findLargestFontSizeDescending(minimumFontSize, fontSize, probe) {
  if (minimumFontSize >= fontSize)
    return probe(fontSize, true);
  const { steps, sizeAt } = fontSizeLadder(minimumFontSize, fontSize);
  for (let index = steps - 1; index >= 0; index--) {
    const found = probe(sizeAt(index), index === 0);
    if (found !== void 0)
      return found;
  }
  return void 0;
}
function fontSizeRange(fontSize, minimumFontSize) {
  return { min: resolveMinimumFontSize(minimumFontSize, fontSize), max: fontSize };
}
function sizeAtRatio(range2, ratio2) {
  return ratio2 === 1 ? range2.max : range2.min + (range2.max - range2.min) * ratio2;
}
function segmentFontSizeRange(segment, minimumFontSize, font) {
  return fontSizeRange(segment.fontSize ?? font.fontSize, segment.minimumFontSize ?? minimumFontSize);
}
function hasOwnMinimumFontSize(segment) {
  return segment.type !== "image" && segment.minimumFontSize != null;
}
function autoSizeDriver(text, fit, font) {
  const { minimumFontSize, maxWidth, maxHeight, region } = fit;
  if (maxWidth == null && maxHeight == null && region == null)
    return void 0;
  if (minimumFontSize == null && !(isArray(text) && text.some(hasOwnMinimumFontSize)))
    return void 0;
  let driver = fontSizeRange(font.fontSize, minimumFontSize);
  if (isArray(text)) {
    for (const segment of text) {
      if (segment.type === "image")
        continue;
      const range2 = segmentFontSizeRange(segment, minimumFontSize, font);
      if (range2.max - range2.min > driver.max - driver.min)
        driver = range2;
    }
  }
  return driver.max > driver.min ? driver : void 0;
}
function labelTextAtShrinkRatio(text, minimumFontSize, font, ratio2) {
  const fontSize = sizeAtRatio(fontSizeRange(font.fontSize, minimumFontSize), ratio2);
  if (!isArray(text))
    return { text, fontSize };
  const sized = text.map((segment) => {
    if (segment.type === "image" || segment.fontSize == null && segment.minimumFontSize == null) {
      return segment;
    }
    const range2 = segmentFontSizeRange(segment, minimumFontSize, font);
    const segmentSize = sizeAtRatio(range2, ratio2);
    return {
      ...segment,
      fontSize: segmentSize,
      lineHeight: segment.lineHeight == null ? void 0 : segment.lineHeight * segmentSize / range2.max
    };
  });
  return { text: sized, fontSize };
}
function fitLabelTextAutoSize(text, fit, font) {
  const { text: fitted, fontSize } = fitLabelTextToRegionAutoSize(text, fit, font, true);
  return { text: fitted, fontSize };
}
function fitLabelTextToRegionAutoSize(text, fit, font, anchored = false) {
  const driver = fit == null ? void 0 : autoSizeDriver(text, fit, font);
  if (fit == null || driver == null)
    return fitLabelTextToRegion(text, fit, font, anchored);
  const { minimumFontSize } = fit;
  const wholeTextFit = { ...fit, overflowStrategy: "hide" };
  const found = findLargestFittingFontSize(driver.min, driver.max, (driverSize, atFloor) => {
    const ratio2 = (driverSize - driver.min) / (driver.max - driver.min);
    const sized = labelTextAtShrinkRatio(text, minimumFontSize, font, ratio2);
    const fitted = fitLabelTextToRegion(
      sized.text,
      atFloor ? fit : wholeTextFit,
      fontWithSize(font, sized.fontSize),
      anchored
    );
    if (isErased(fitted.text))
      return void 0;
    return { ...fitted, fontSize: sized.fontSize === font.fontSize ? void 0 : sized.fontSize };
  });
  if (found)
    return found;
  const floor = labelTextAtShrinkRatio(text, minimumFontSize, font, 0);
  return fitLabelTextToRegion(floor.text, fit, fontWithSize(font, floor.fontSize), anchored);
}
function fitLabelTextOrOverflowAutoSize(text, fit, fitOverflow, font) {
  const fitted = fitLabelTextAutoSize(text, fit, font);
  if (fitOverflow == null || !isErased(fitted.text) || isErased(text))
    return fitted;
  return fitLabelTextAutoSize(text, fitOverflow, font);
}
function wrapLines(text, options) {
  return textWrap2(text, options);
}
function truncateLine(text, measurer, maxWidth, ellipsisForce) {
  const ellipsisWidth = measurer.textWidth(EllipsisChar);
  const graphemes = graphemeSegments(text);
  let estimatedWidth = 0;
  let charOffset = 0;
  for (const grapheme of graphemes) {
    const charWidth = measurer.textWidth(grapheme);
    if (estimatedWidth + charWidth > maxWidth)
      break;
    estimatedWidth += charWidth;
    charOffset += grapheme.length;
  }
  if (charOffset === text.length && (!ellipsisForce || estimatedWidth + ellipsisWidth <= maxWidth)) {
    return ellipsisForce ? appendEllipsis(text) : text;
  }
  text = text.slice(0, charOffset).trimEnd();
  const g = graphemeSegments(text);
  while (g.length > 0 && measurer.textWidth(text) + ellipsisWidth > maxWidth) {
    g.pop();
    while (g.length > 0 && g.at(-1).trim() === "") {
      g.pop();
    }
    text = g.join("");
  }
  return appendEllipsis(text);
}
function textWrap2(text, options, widthOffset = 0, blockTop = 0) {
  const lines = text.split(LineSplitter);
  const measurer = cachedTextMeasurer(options.font);
  const result = [];
  const preserveText = preservesText(options);
  const lineHeight = options.maxWidthAt == null ? 0 : options.lineHeight ?? measurer.lineHeight();
  const maxWidth = () => {
    const top = blockTop + result.length * lineHeight;
    return lineMaxWidth(options, top, top + lineHeight);
  };
  if (options.textWrap === "never") {
    if (preserveText) {
      return lines.map((line) => line.trimEnd());
    }
    for (const line of lines) {
      const truncatedLine = truncateLine(line.trimEnd(), measurer, Math.max(0, maxWidth() - widthOffset));
      if (truncatedLine === "")
        break;
      result.push(truncatedLine);
      widthOffset = 0;
    }
    return shouldHideOverflow(result, options, text) ? [] : result;
  }
  const wrapHyphenate = options.textWrap === "hyphenate";
  const wrapOnSpace = options.textWrap == null || options.textWrap === "on-space";
  for (const untrimmedLine of lines) {
    let line = untrimmedLine.trimEnd();
    if (line === "") {
      result.push(line);
      continue;
    }
    let graphemes = graphemeSegments(line);
    let i = 0;
    let charOffset = 0;
    let estimatedWidth = 0;
    let lastSpaceIndex = 0;
    const resumeAfterBreak = (breakIndex) => {
      line = line.slice(breakIndex).trimStart();
      graphemes = graphemeSegments(line);
      i = 0;
      charOffset = 0;
      estimatedWidth = 0;
      lastSpaceIndex = 0;
    };
    if (result.length === 0) {
      estimatedWidth = widthOffset;
    }
    while (i < graphemes.length) {
      const char = graphemes[i];
      if (char === " ") {
        lastSpaceIndex = charOffset;
      }
      estimatedWidth += measurer.textWidth(char);
      if (estimatedWidth > maxWidth()) {
        if (i === 0) {
          if (!preserveText) {
            line = "";
          }
          break;
        }
        let actualWidth = measurer.textWidth(line.slice(0, charOffset + char.length));
        if (result.length === 0) {
          actualWidth += widthOffset;
        }
        if (actualWidth <= maxWidth()) {
          estimatedWidth = actualWidth;
          charOffset += char.length;
          i++;
          continue;
        }
        if (preserveText && wrapOnSpace) {
          const breakIndex = lastSpaceIndex === 0 ? line.indexOf(" ", 1) : lastSpaceIndex;
          if (breakIndex < 1)
            break;
          result.push(line.slice(0, breakIndex).trimEnd());
          resumeAfterBreak(breakIndex);
          continue;
        }
        if (lastSpaceIndex !== 0) {
          const nextWord = getWordAt(line, lastSpaceIndex + 1);
          const textWidth = measurer.textWidth(nextWord);
          if (textWidth <= maxWidth()) {
            result.push(line.slice(0, lastSpaceIndex).trimEnd());
            resumeAfterBreak(lastSpaceIndex);
            continue;
          } else if (wrapOnSpace) {
            const remainder = line.slice(lastSpaceIndex).trimStart();
            result.push(line.slice(0, lastSpaceIndex).trimEnd());
            const remainderWidth = maxWidth();
            result.push(
              measurer.textWidth(remainder) <= remainderWidth ? remainder : truncateLine(remainder, measurer, remainderWidth, true)
            );
          }
        } else if (wrapOnSpace) {
          const newLine2 = truncateLine(line, measurer, maxWidth(), true);
          if (newLine2 !== "") {
            result.push(newLine2);
          }
        }
        if (wrapOnSpace) {
          line = "";
          break;
        }
        const postfix = wrapHyphenate ? "-" : "";
        let newLine = line.slice(0, charOffset).trim();
        const g = graphemeSegments(newLine);
        while (g.length > 0 && measurer.textWidth(newLine + postfix) > maxWidth()) {
          g.pop();
          while (g.length > 0 && g.at(-1).trim() === "") {
            g.pop();
          }
          newLine = g.join("");
        }
        if (newLine !== "" && newLine !== TrimEdgeGuard) {
          result.push(preserveArabicJoining(newLine) + postfix);
        } else {
          if (!preserveText) {
            line = "";
          }
          break;
        }
        resumeAfterBreak(newLine.length);
        continue;
      }
      charOffset += char.length;
      i++;
    }
    if (line !== "") {
      result.push(line);
    }
  }
  avoidOrphans(result, measurer, options);
  const clippedResult = clipLines(result, measurer, options);
  return shouldHideOverflow(clippedResult, options, text) ? [] : clippedResult;
}
function getWordAt(text, position) {
  const nextSpaceIndex = text.indexOf(" ", position);
  return nextSpaceIndex === -1 ? text.slice(position) : text.slice(position, nextSpaceIndex);
}
function clipLines(lines, measurer, options) {
  if (!isFiniteNumber(options.maxHeight)) {
    return lines;
  }
  const { height: height2, lineMetrics } = measurer.measureLines(lines);
  const totalHeight = options.lineHeight == null ? height2 : lines.length * options.lineHeight;
  if (totalHeight <= options.maxHeight) {
    return lines;
  }
  const lineHeightAt = (i) => options.lineHeight ?? lineMetrics[i].height;
  for (let i = 0, cumulativeHeight = 0; i < lineMetrics.length; i++) {
    const lineTop = cumulativeHeight;
    cumulativeHeight += lineHeightAt(i);
    if (cumulativeHeight > options.maxHeight) {
      if (options.overflow === "hide" || i === 0)
        return [];
      const clippedResults = lines.slice(0, i);
      const lastLine = clippedResults.pop();
      const maxWidth = lineMaxWidth(options, lineTop - lineHeightAt(i - 1), lineTop);
      return clippedResults.concat(
        isTextTruncated(lastLine) ? lastLine : truncateLine(lastLine, measurer, maxWidth, true)
      );
    }
  }
  return lines;
}
function lastLineMaxWidth(lines, measurer, options) {
  const { lineMetrics } = measurer.measureLines(lines);
  let top = 0;
  for (let i = 0; i < lineMetrics.length - 1; i += 1) {
    top += lineMetrics[i].height;
  }
  return lineMaxWidth(options, top, top + lineMetrics.at(-1).height);
}
function avoidOrphans(lines, measurer, options) {
  if (options.avoidOrphans === false || lines.length < 2)
    return;
  const { length: length2 } = lines;
  const lastLine = lines[length2 - 1];
  const beforeLast = lines[length2 - 2];
  if (graphemeSegments(beforeLast).length < graphemeSegments(lastLine).length)
    return;
  const lastSpaceIndex = beforeLast.lastIndexOf(" ");
  if (lastSpaceIndex === -1 || lastSpaceIndex === beforeLast.indexOf(" ") || lastLine.includes(" "))
    return;
  const lastWord = beforeLast.slice(lastSpaceIndex + 1);
  const maxWidth = options.maxWidthAt == null ? options.maxWidth : lastLineMaxWidth(lines, measurer, options);
  const joined = lastWord + " " + lastLine;
  if (measurer.textWidth(joined) <= maxWidth) {
    lines[length2 - 2] = beforeLast.slice(0, lastSpaceIndex);
    lines[length2 - 1] = joined;
  }
}
function splitIntoBlockGroups(textSegments) {
  const groups = [];
  let current = null;
  for (let i = 0; i < textSegments.length; i++) {
    const seg = textSegments[i];
    if (isBlockBoundary(textSegments, i)) {
      const extendsStrip = i > 0 && textSegments[i - 1].type === "image" && textSegments[i - 1].block === true;
      if (extendsStrip && current) {
        current.blockImages.push(seg);
      } else {
        if (current)
          groups.push(current);
        current = { blockImages: [seg], segments: [] };
      }
    } else {
      current ?? (current = { blockImages: [], segments: [] });
      current.segments.push(seg);
    }
  }
  if (current)
    groups.push(current);
  return groups;
}
function wrapTextSegments(textSegments, options) {
  const groups = splitIntoBlockGroups(textSegments);
  if (groups.length === 0)
    return [];
  if (groups.length === 1 && groups[0].blockImages.length === 0 && !groups[0].segments.some((s) => s.type === "image")) {
    const fitted = fitMeasuredSegments(groups[0].segments, options);
    return hidesOverflow(groups[0].segments, fitted, options) ? [] : fitted;
  }
  let remainingMaxHeight = options.maxHeight ?? Infinity;
  const result = [];
  for (const group of groups) {
    if (remainingMaxHeight <= 0)
      break;
    const groupOptions = Number.isFinite(remainingMaxHeight) ? { ...options, maxHeight: remainingMaxHeight } : options;
    const groupResult = wrapGroup(group, groupOptions);
    if (groupResult.length === 0)
      continue;
    result.push(...groupResult);
    if (Number.isFinite(remainingMaxHeight)) {
      remainingMaxHeight -= measureTextSegments(groupResult, options.font).height;
    }
  }
  return hidesOverflow(textSegments, result, options) ? [] : result;
}
function hidesOverflow(input, output, options) {
  if (options.overflow !== "hide")
    return false;
  if (hasTruncatedText(output))
    return true;
  if (rawLength(output) >= rawLength(input))
    return false;
  return contentLength(output) < contentLength(input);
}
function rawLength(segments) {
  return segments.reduce((n, s) => s.type === "image" ? n : n + toTextString(s.text).length, 0);
}
function contentLength(segments) {
  return segments.reduce((n, s) => s.type === "image" ? n : n + survivingCharacters(toTextString(s.text)), 0);
}
function wrapGroup(group, options) {
  if (group.blockImages.length === 0) {
    return wrapInlineSegments(group.segments, options);
  }
  return wrapBlockGroup(group.blockImages, group.segments, options);
}
function wrapInlineSegments(segments, options) {
  if (segments.length === 0)
    return [];
  if (!segments.some((s) => s.type === "image")) {
    return fitMeasuredSegments(segments, options);
  }
  return wrapInlineSegmentsWithOverflow(segments, options);
}
function wrapInlineSegmentsWithOverflow(segments, options) {
  const maxHeight = options.maxHeight ?? Infinity;
  const working = [];
  for (const s of segments) {
    if (s.type === "image") {
      const box = imageSegmentBox(s);
      if (box.width > options.maxWidth || box.height > maxHeight)
        continue;
    }
    working.push(s);
  }
  let result = fitMeasuredSegments(working, options);
  result = dropUntilFits(working, options, result, () => dropLastMatching(working, isImageWithStrategy("hide")));
  result = dropUntilFits(working, options, result, () => {
    return hasImageWithStrategy(working, "keep") && dropLastMatching(working, isText);
  });
  result = dropUntilFits(working, options, result, () => dropLastMatching(working, isImageWithStrategy("keep")));
  return result;
}
function dropUntilFits(working, options, result, drop) {
  while (!resultFitsAllSegments(working, result) && drop()) {
    result = fitMeasuredSegments(working, options);
  }
  return result;
}
function wrapBlockGroup(blockImages, segments, options) {
  const maxHeight = options.maxHeight ?? Infinity;
  const strip = buildBlockStrip(blockImages, options);
  if (strip.length === 0) {
    return wrapInlineSegments(segments, options);
  }
  const allKeep = strip.every((img) => (img.overflowStrategy ?? "hide") === "keep");
  const stripWidth = blockStripWidth(strip);
  if (segments.length === 0) {
    return strip;
  }
  const innerMaxWidth = options.maxWidth - stripWidth - BLOCK_IMAGE_SPACING;
  if (innerMaxWidth <= 0) {
    return allKeep ? strip : wrapInlineSegments(segments, options);
  }
  const innerOptions = { ...options, maxWidth: innerMaxWidth, maxHeight: Math.max(0, maxHeight) };
  const innerResult = wrapBlockTextColumn(segments, innerOptions, allKeep);
  if (!preservesText(options) && innerResult.length > 0 && measureTextSegments(innerResult, options.font).width > innerMaxWidth) {
    return strip;
  }
  return [...strip, ...innerResult];
}
function buildBlockStrip(blockImages, options) {
  const maxHeight = options.maxHeight ?? Infinity;
  const strip = [];
  for (const img of blockImages) {
    const textMetrics = imageSegmentBox(img);
    if (textMetrics.width > options.maxWidth || textMetrics.height > maxHeight)
      continue;
    strip.push({ ...img, textMetrics });
  }
  const stripFitsWidth = () => blockStripWidth(strip) <= options.maxWidth;
  while (!stripFitsWidth() && dropLastMatching(strip, isImageWithStrategy("hide"))) {
  }
  while (!stripFitsWidth() && dropLastMatching(strip, isImageWithStrategy("keep"))) {
  }
  return strip;
}
function wrapBlockTextColumn(segments, innerOptions, allKeep) {
  if (!allKeep) {
    return wrapInlineSegments(segments, innerOptions);
  }
  const working = segments.slice();
  let result = wrapInlineSegments(working, innerOptions);
  while ((hasTruncatedText(result) || lostTextSegments(working, result)) && dropLastMatching(working, isText)) {
    result = wrapInlineSegments(working, innerOptions);
  }
  return result;
}
function dropLastMatching(arr, predicate) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      arr.splice(i, 1);
      return true;
    }
  }
  return false;
}
var isText = (s) => s.type !== "image";
function isImageWithStrategy(strategy) {
  return (s) => s.type === "image" && (s.overflowStrategy ?? "hide") === strategy;
}
function resultFitsAllSegments(input, output) {
  if (hasTruncatedText(output))
    return false;
  const inputImageCount = input.reduce((n, s) => n + (s.type === "image" ? 1 : 0), 0);
  const outputImageCount = output.reduce((n, s) => n + (s.type === "image" ? 1 : 0), 0);
  return outputImageCount >= inputImageCount;
}
function hasTruncatedText(output) {
  return output.some((s) => s.type !== "image" && isTextTruncated(s.text));
}
function lostTextSegments(input, output) {
  const inputText = input.reduce((n, s) => s.type === "image" ? n : n + 1, 0);
  const outputText = output.reduce((n, s) => s.type === "image" ? n : n + 1, 0);
  return outputText < inputText;
}
function hasImageWithStrategy(segments, strategy) {
  return segments.some(isImageWithStrategy(strategy));
}
function fitMeasuredSegments(textSegments, options) {
  const { maxHeight = Infinity } = options;
  const preserveText = preservesText(options);
  const result = [];
  let lineWidth = 0;
  let totalHeight = 0;
  const maxWidth = (height2 = 0) => lineMaxWidth(options, totalHeight, totalHeight + height2);
  function truncateLastSegment() {
    const lastSegment = result.pop();
    if (!lastSegment)
      return;
    if (lastSegment.type === "image")
      return;
    const measurer = cachedTextMeasurer(lastSegment);
    const truncatedText = truncateLine(lastSegment.text, measurer, maxWidth(), true);
    const textMetrics = measurer.measureText(truncatedText);
    result.push({ ...lastSegment, text: truncatedText, textMetrics });
  }
  function wrapOverflowingTextSegment(segment) {
    const measurer = cachedTextMeasurer(segment);
    const guardedText = guardTextEdges(segment.text);
    const wrapOptions = { ...options, font: segment, maxHeight: maxHeight - totalHeight };
    let wrappedLines = textWrap2(guardedText, { ...wrapOptions, overflow: "hide" }, lineWidth, totalHeight);
    if (wrappedLines.length === 0) {
      if (options.textWrap === "never") {
        wrappedLines = textWrap2(guardedText, wrapOptions, lineWidth, totalHeight);
      } else {
        wrappedLines = textWrap2(guardedText, wrapOptions, 0, totalHeight);
        const lastSegment = result.at(-1);
        if (lastSegment && lastSegment.type !== "image") {
          lastSegment.text += "\n";
          lineWidth = 0;
        }
      }
    }
    if (wrappedLines.length === 0) {
      truncateLastSegment();
      return true;
    }
    const truncationIndex = preserveText ? -1 : wrappedLines.findIndex(isTextTruncated);
    if (truncationIndex !== -1) {
      wrappedLines = wrappedLines.slice(0, truncationIndex + 1);
    }
    const leadingWs = segment.text.slice(0, segment.text.length - segment.text.trimStart().length);
    const trailingWs = segment.text.slice(segment.text.trimEnd().length);
    const cleanLines = wrappedLines.map(unguardTextEdges);
    const firstContentIndex = cleanLines.findIndex((line) => line.trim() !== "");
    const lastContentIndex = cleanLines.findLastIndex((line) => line.trim() !== "");
    const lastIndex = cleanLines.length - 1;
    for (let i = 0; i < cleanLines.length; i++) {
      let cleanLine = cleanLines[i];
      if (leadingWs !== "" && i === firstContentIndex) {
        cleanLine = leadingWs + cleanLine.trimStart();
      }
      if (trailingWs !== "" && i === lastContentIndex) {
        cleanLine = cleanLine.trimEnd() + trailingWs;
      }
      const textMetrics = measurer.measureText(cleanLine);
      const subSegment = { ...segment, text: cleanLine, textMetrics };
      if (i === lastIndex) {
        lineWidth += textMetrics.width;
      } else {
        subSegment.text += "\n";
        lineWidth = 0;
      }
      totalHeight += textMetrics.height;
      result.push(subSegment);
    }
    return truncationIndex !== -1;
  }
  let isFirstLine = true;
  for (const { width: width2, height: height2, segments } of measureTextSegments(textSegments, options.font).lineMetrics) {
    if (!isFirstLine) {
      appendLineBreak(result, options.font);
      lineWidth = 0;
    }
    isFirstLine = false;
    if (totalHeight + height2 > maxHeight) {
      if (result.length > 0) {
        truncateLastSegment();
      }
      break;
    }
    if (lineWidth + width2 <= maxWidth(height2)) {
      lineWidth += width2;
      totalHeight += height2;
      result.push(...segments);
      continue;
    }
    let lineHeight = 0;
    for (const segment of segments) {
      if (lineWidth + segment.textMetrics.width <= maxWidth(segment.textMetrics.height)) {
        lineWidth += segment.textMetrics.width;
        lineHeight = Math.max(lineHeight, segment.textMetrics.height);
        result.push(segment);
        continue;
      }
      if (segment.type === "image") {
        const imageWidth = segment.textMetrics.width;
        const imageHeight = segment.textMetrics.height;
        if (options.textWrap !== "never" && lineWidth > 0 && imageWidth <= maxWidth(imageHeight) && totalHeight + lineHeight + imageHeight <= maxHeight) {
          appendLineBreak(result, options.font);
          lineWidth = imageWidth;
          totalHeight += lineHeight + imageHeight;
          lineHeight = 0;
          result.push(segment);
          continue;
        }
        if (preserveText) {
          lineWidth += imageWidth;
          lineHeight = Math.max(lineHeight, imageHeight);
          result.push(segment);
          continue;
        }
        truncateLastSegment();
        return result;
      }
      if (wrapOverflowingTextSegment(segment))
        break;
      lineHeight = 0;
    }
  }
  return result;
}
function appendLineBreak(result, font) {
  const last = result.at(-1);
  if (last && last.type !== "image") {
    last.text += "\n";
  } else if (last) {
    const measurer = cachedTextMeasurer(font);
    result.push({ ...font, text: "\n", textMetrics: measurer.measureText("") });
  }
}

// packages/ag-charts-core/src/geometry/shapeUtil.ts
function getMaxInnerRectSize(rotationDeg, containerWidth, containerHeight = Infinity) {
  const W = containerWidth;
  const H = containerHeight;
  const angle2 = rotationDeg % 180 * (Math.PI / 180);
  const sin = Math.abs(Math.sin(angle2));
  const cos = Math.abs(Math.cos(angle2));
  if (sin === 0)
    return { width: W, height: H };
  if (cos === 0)
    return { width: H, height: W };
  if (!Number.isFinite(H)) {
    const r = cos / sin;
    const width2 = W / (cos + r * sin);
    return { width: width2, height: r * width2 };
  }
  const denominator = cos * cos - sin * sin;
  if (denominator === 0) {
    const side = Math.min(W, H) / Math.SQRT2;
    return { width: side, height: side };
  }
  return {
    width: Math.abs((W * cos - H * sin) / denominator),
    height: Math.abs((H * cos - W * sin) / denominator)
  };
}
function getMinOuterRectSize(rotationDeg, innerWidth, innerHeight = Infinity) {
  const w = innerWidth;
  const h = innerHeight;
  const angle2 = rotationDeg % 180 * (Math.PI / 180);
  const sin = Math.abs(Math.sin(angle2));
  const cos = Math.abs(Math.cos(angle2));
  if (sin === 0)
    return { width: w, height: h };
  if (cos === 0)
    return { width: h, height: w };
  return {
    width: w * cos + h * sin,
    height: w * sin + h * cos
  };
}
function rotatePoint(x, y, angle2, originX = 0, originY = 0) {
  const cos = Math.cos(angle2);
  const sin = Math.sin(angle2);
  const dx = x - originX;
  const dy = y - originY;
  return {
    x: originX + dx * cos - dy * sin,
    y: originY + dx * sin + dy * cos
  };
}

// packages/ag-charts-core/src/geometry/spatialIndex.ts
var SpatialIndex = class {
  constructor() {
    this.invCellSize = 1;
    this.cols = 0;
    this.rows = 0;
    this.originX = 0;
    this.originY = 0;
    this.cellCount = 0;
    this.cells = [];
  }
  reset(bounds, cellSize) {
    let clampedCellSize = Math.max(cellSize, 1);
    const MAX_CELLS = 1 << 14;
    const area = Math.max(0, bounds.width) * Math.max(0, bounds.height);
    if (area > MAX_CELLS * clampedCellSize * clampedCellSize) {
      clampedCellSize = Math.sqrt(area / MAX_CELLS);
    }
    this.invCellSize = 1 / clampedCellSize;
    this.originX = bounds.x;
    this.originY = bounds.y;
    this.cols = Math.max(1, Math.ceil(bounds.width / clampedCellSize));
    this.rows = Math.max(1, Math.ceil(bounds.height / clampedCellSize));
    const count = this.cols * this.rows;
    const clearTo = Math.max(this.cellCount, count);
    for (let i = 0; i < clearTo; i++) {
      if (this.cells[i] == null) {
        this.cells[i] = [];
      } else {
        this.cells[i].length = 0;
      }
    }
    this.cellCount = count;
  }
  insert(box, ref) {
    const { cols, cells } = this;
    const minCx = this.clampCol(box.x);
    const maxCx = this.clampCol(box.x + box.width);
    const minCy = this.clampRow(box.y);
    const maxCy = this.clampRow(box.y + box.height);
    for (let cy = minCy; cy <= maxCy; cy++) {
      const rowOffset = cy * cols;
      for (let cx = minCx; cx <= maxCx; cx++) {
        cells[rowOffset + cx].push(ref);
      }
    }
  }
  query(box, visitor) {
    const { cols, cells } = this;
    const minCx = this.clampCol(box.x);
    const maxCx = this.clampCol(box.x + box.width);
    const minCy = this.clampRow(box.y);
    const maxCy = this.clampRow(box.y + box.height);
    for (let cy = minCy; cy <= maxCy; cy++) {
      const rowOffset = cy * cols;
      for (let cx = minCx; cx <= maxCx; cx++) {
        const cell = cells[rowOffset + cx];
        for (let i = 0, ln = cell.length; i < ln; i++) {
          if (visitor(cell[i]) === true)
            return true;
        }
      }
    }
    return false;
  }
  clampCol(x) {
    return Math.min(this.cols - 1, Math.max(0, Math.floor((x - this.originX) * this.invCellSize)));
  }
  clampRow(y) {
    return Math.min(this.rows - 1, Math.max(0, Math.floor((y - this.originY) * this.invCellSize)));
  }
};
function gridCellSize(extentSum, extentCount) {
  return extentCount > 0 ? Math.max(1, extentSum / extentCount) : 1;
}
var overlapIndex = /*#__PURE__*/ new SpatialIndex();
function anyOverlap(queryBoxes, obstacles, exact) {
  if (queryBoxes.length === 0 || obstacles.length === 0) {
    return false;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let extentSum = 0;
  let extentCount = 0;
  const extend = (b) => {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
    extentSum += b.width + b.height;
    extentCount += 2;
  };
  for (const box of queryBoxes) {
    extend(box);
  }
  for (const obstacle of obstacles) {
    extend(obstacle.box);
  }
  const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  const index = overlapIndex;
  index.reset(bounds, gridCellSize(extentSum, extentCount));
  for (const obstacle of obstacles) {
    index.insert(obstacle.box, obstacle.ref);
  }
  let queryBox2 = null;
  const visit = (ref) => queryBox2 != null && exact(queryBox2, ref);
  for (const box of queryBoxes) {
    queryBox2 = box;
    if (index.query(box, visit)) {
      return true;
    }
  }
  return false;
}

// packages/ag-charts-core/src/geometry/labelPlacement.ts
function resolveLabelFit(fit, hideOnOverflow = false, defaultToTruncate = false) {
  const { maxWidth, maxHeight, wrapping, truncate, minimumFontSize } = fit;
  let overflowStrategy2;
  if (truncate || defaultToTruncate) {
    overflowStrategy2 = "ellipsis";
  } else if (hideOnOverflow) {
    overflowStrategy2 = "hide";
  }
  if (overflowStrategy2 == null && wrapping == null && minimumFontSize == null)
    return void 0;
  return { maxWidth, maxHeight, wrapping, overflowStrategy: overflowStrategy2, minimumFontSize };
}
function resolveLabelFitDescriptors(fit, boxPadding, hideOnOverflow) {
  const policy = resolveLabelFit(fit, hideOnOverflow);
  return (text) => policy == null ? void 0 : { text, policy, font: fit, boxPadding, boundByRegion: true };
}
function labelsAvoidAxisLabels(labelData) {
  for (const { datums, defaults } of labelData.values()) {
    let tested;
    for (const d of datums) {
      const collideWith = d.collideWith ?? defaults?.collideWith;
      if (collideWith === tested)
        continue;
      if (collideWith?.axisLabel === true)
        return true;
      tested = collideWith;
    }
  }
  return false;
}
function resolveCollideWith(collision) {
  const { markers, labels, seriesItems, seriesArea, axisLabels } = collision.collideWith ?? {};
  return {
    marker: markers ?? true,
    label: labels ?? true,
    seriesItem: seriesItems ?? false,
    seriesArea: seriesArea ?? true,
    axisLabel: axisLabels ?? false
  };
}
function resolveSeriesLabelDefaults(src, placements, spacing) {
  return {
    alwaysShow: src.alwaysShow,
    spacing,
    threshold: src.threshold,
    collideWith: resolveCollideWith(src),
    placements
  };
}
var DEFAULT_MARKERLESS_LABEL_GAP = 2;
function circleOverlapsBox(cx, cy, r, x, y, w, h) {
  if (r <= 0) {
    return false;
  }
  let edgeX = cx;
  if (cx < x) {
    edgeX = x;
  } else if (cx > x + w) {
    edgeX = x + w;
  }
  let edgeY = cy;
  if (cy < y) {
    edgeY = y;
  } else if (cy > y + h) {
    edgeY = y + h;
  }
  const dx = cx - edgeX;
  const dy = cy - edgeY;
  return dx * dx + dy * dy < r * r;
}
function isPointLabelDatum(x) {
  return x != null && typeof x.point === "object" && typeof x.label === "object";
}
function markerSizeOf(d) {
  return d.markerSize ?? d.point.size;
}
function applyStyledMarkerSize(datum, styledSize) {
  datum.markerSize = styledSize;
}
function labelGapOf(d) {
  if (d.markerSize == null)
    return d.gap ?? d.point.size / 2;
  return d.markerSize > 0 ? d.markerSize / 2 : DEFAULT_MARKERLESS_LABEL_GAP;
}
var orientationAngles = {
  horizontal: 0,
  vertical: -90,
  "vertical-reversed": 90
};
function labelGlyphCentre(anchor, width2, height2) {
  let { x, y } = anchor;
  if (anchor.textAlign === "left" || anchor.textAlign === "start") {
    x += width2 / 2;
  } else if (anchor.textAlign === "right" || anchor.textAlign === "end") {
    x -= width2 / 2;
  }
  if (anchor.textBaseline === "top") {
    y += height2 / 2;
  } else if (anchor.textBaseline === "bottom") {
    y -= height2 / 2;
  }
  return { x, y };
}
function writeLabelBoxCentre(out, anchor, boxWidth, boxHeight, padding2) {
  const { x, y } = labelGlyphCentre(anchor, boxWidth, boxHeight);
  out.x = x;
  out.y = y;
  if (anchor.textAlign === "right" || anchor.textAlign === "end") {
    out.x += padding2.right;
  } else if (anchor.textAlign === "left" || anchor.textAlign === "start") {
    out.x -= padding2.left;
  }
  if (anchor.textBaseline === "bottom") {
    out.y += padding2.bottom;
  } else if (anchor.textBaseline === "top") {
    out.y -= padding2.top;
  }
  return out;
}
function measureLabelText(text, font) {
  return isArray(text) ? measureTextSegments(text, font) : cachedTextMeasurer(font).measureLines(String(text));
}
var labelPlacements = {
  inside: { x: 0, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  "top-left": { x: -1, y: -1 },
  "top-right": { x: 1, y: -1 },
  "bottom-left": { x: -1, y: 1 },
  "bottom-right": { x: 1, y: 1 }
};
var obstacleIndex = /*#__PURE__*/ new SpatialIndex();
var markerPool = [];
var labelObstaclePool = [];
var candidateBox = { x: 0, y: 0, width: 0, height: 0 };
var queryBox = { x: 0, y: 0, width: 0, height: 0 };
var insideRegionBox = { x: 0, y: 0, width: 0, height: 0 };
var inflatedBox = { x: 0, y: 0, width: 0, height: 0 };
var deflatedRegionBox = { x: 0, y: 0, width: 0, height: 0 };
var deflatedInsideRegionBox = { x: 0, y: 0, width: 0, height: 0 };
var fitRegionBox = { x: 0, y: 0, width: 0, height: 0 };
var candidateCollideWith;
var candidateThreshold = 0;
var candidatePlacement;
var candidateOwnMarkerCx = 0;
var candidateOwnMarkerCy = 0;
var candidateOwnMarkerR = -1;
var candidateOwnBox;
var candidateOwnBoxLabelsCollide = false;
var fittedLabel = {
  text: "",
  width: 0,
  height: 0,
  dropped: 0,
  shrink: 0,
  fontSize: void 0,
  maxWidth: Infinity,
  maxHeight: Infinity
};
var boundedFit = {};
var candidateFontSize;
var candidateTrialFontSize;
var trialFont = { fontSize: 0 };
function candidateFontAt(font) {
  if (candidateTrialFontSize == null || candidateTrialFontSize >= font.fontSize)
    return font;
  trialFont.fontSize = candidateTrialFontSize;
  trialFont.fontStyle = font.fontStyle;
  trialFont.fontWeight = font.fontWeight;
  trialFont.fontFamily = font.fontFamily;
  return trialFont;
}
var cascadeDatum;
var cascadeIndex = 0;
var cascadePlacements;
var cascadeOrientations;
var cascadeSingleOrientation;
var cascadeStyle;
var cascadeFitSource;
var cascadeMeasurer;
var cascadeMinRefitWidth;
var cascadeGap = 0;
var cascadeSpacing = 0;
var cascadeInflate = 0;
var cascadeThreshold = 0;
var cascadeContainThreshold = 0;
var cascadeRawRegion;
var cascadeRegion;
var cascadeFitRegion;
var cascadeFlushToRegion = false;
var cascadeKeepBest = false;
var candidateContainer = { width: 0, height: 0 };
var styledSource = { width: 0, height: 0 };
var styledSourceFont = "";
var boxCentre = { x: 0, y: 0 };
var rotatedSize = { width: 0, height: 0 };
function rotatedSizeInto(rotationDeg, w, h) {
  if (rotationDeg === 0) {
    rotatedSize.width = w;
    rotatedSize.height = h;
    return;
  }
  const angle2 = rotationDeg % 180 * (Math.PI / 180);
  const sin = Math.abs(Math.sin(angle2));
  const cos = Math.abs(Math.cos(angle2));
  rotatedSize.width = w * cos + h * sin;
  rotatedSize.height = w * sin + h * cos;
}
function inflateBoxInto(dest, src, inflate) {
  dest.x = src.x - inflate;
  dest.y = src.y - inflate;
  dest.width = src.width + 2 * inflate;
  dest.height = src.height + 2 * inflate;
}
function containmentThreshold(threshold) {
  return Math.min(threshold, 0);
}
function deflateRegion(dest, src, threshold) {
  if (threshold === 0)
    return src;
  dest.x = src.x + threshold;
  dest.y = src.y + threshold;
  dest.width = Math.max(0, src.width - 2 * threshold);
  dest.height = Math.max(0, src.height - 2 * threshold);
  return dest;
}
function deflateContainer(container, threshold) {
  if (container == null || threshold === 0)
    return container;
  candidateContainer.width = Math.max(0, container.width - 2 * threshold);
  candidateContainer.height = Math.max(0, container.height - 2 * threshold);
  return candidateContainer;
}
var candidateWorstOverlap = 0;
function worstObstacleOverlap(o) {
  if (!obstacleOverlapsCandidate(o))
    return;
  const { x, y, width: width2, height: height2 } = candidateBox;
  const overlapWidth = Math.min(x + width2, o.box.x + o.box.width) - Math.max(x, o.box.x);
  const overlapHeight = Math.min(y + height2, o.box.y + o.box.height) - Math.max(y, o.box.y);
  if (overlapWidth > 0 && overlapHeight > 0) {
    candidateWorstOverlap = Math.max(candidateWorstOverlap, overlapWidth * overlapHeight);
  }
}
function obstacleExcluded(o) {
  const category = o.category ?? "seriesItem";
  if (candidatePlacement === "inside" && category === "marker" && o.kind === "circle" && o.cx === candidateOwnMarkerCx && o.cy === candidateOwnMarkerCy && o.r === candidateOwnMarkerR) {
    return true;
  }
  if (candidateOwnBox != null && !(candidateOwnBoxLabelsCollide && category === "label") && boxCollides(o.box, candidateOwnBox.x, candidateOwnBox.y, candidateOwnBox.width, candidateOwnBox.height)) {
    return true;
  }
  const enabled = candidateCollideWith?.[category];
  return category === "axisLabel" ? enabled !== true : enabled === false;
}
function candidateTestBox() {
  if (candidateThreshold === 0)
    return candidateBox;
  inflateBoxInto(inflatedBox, candidateBox, candidateThreshold);
  if (inflatedBox.width <= 0 || inflatedBox.height <= 0)
    return void 0;
  return inflatedBox;
}
function obstacleOverlapsBox(o, testBox) {
  const { x, y, width: width2, height: height2 } = testBox;
  switch (o.kind) {
    case "circle":
      return circleOverlapsBox(o.cx, o.cy, o.r, x, y, width2, height2);
    case "rect":
      return boxCollides(o.box, x, y, width2, height2);
    case "custom":
      return o.overlaps(testBox);
  }
}
function obstacleOverlapsCandidate(o) {
  if (obstacleExcluded(o))
    return false;
  const testBox = candidateTestBox();
  return testBox != null && obstacleOverlapsBox(o, testBox);
}
var shrinkIntrusion = { left: 0, right: 0, top: 0, bottom: 0 };
var shrinkReduction = { width: 0, height: 0 };
var shrinkWidthCap = Infinity;
var shrinkHeightCap = Infinity;
var shrinkSlide = { x: 0, y: 0 };
var shrinkPinX = 0;
var shrinkPinY = 0;
var shrinkFloorX = 0;
var shrinkFloorY = 0;
var obstacleSpan = { min: 0, max: 0 };
var sideRetreat = { left: Infinity, right: Infinity, top: Infinity, bottom: Infinity };
var RETREAT_SIDES = ["left", "right", "top", "bottom"];
function sideRetreats(pin, isMinEdge) {
  return pin === 0 || pin > 0 !== isMinEdge;
}
function writeObstacleSpanX(o, top, bottom) {
  if (o.kind !== "circle") {
    obstacleSpan.min = o.box.x;
    obstacleSpan.max = o.box.x + o.box.width;
    return;
  }
  const dy = Math.max(0, o.cy - bottom, top - o.cy);
  const half = Math.sqrt(Math.max(0, o.r * o.r - dy * dy));
  obstacleSpan.min = o.cx - half;
  obstacleSpan.max = o.cx + half;
}
function writeObstacleSpanY(o, left, right) {
  if (o.kind !== "circle") {
    obstacleSpan.min = o.box.y;
    obstacleSpan.max = o.box.y + o.box.height;
    return;
  }
  const dx = Math.max(0, o.cx - right, left - o.cx);
  const half = Math.sqrt(Math.max(0, o.r * o.r - dx * dx));
  obstacleSpan.min = o.cy - half;
  obstacleSpan.max = o.cy + half;
}
function affordableRetreat(retreat, extent2, allowed, floor) {
  return allowed && retreat >= floor && retreat > 0 && retreat < extent2 ? retreat : Infinity;
}
function accumulateObstacleReduction(o) {
  if (obstacleExcluded(o))
    return;
  const testBox = candidateTestBox();
  if (testBox == null || !obstacleOverlapsBox(o, testBox))
    return;
  const { x, y, width: width2, height: height2 } = testBox;
  writeObstacleSpanX(o, y, y + height2);
  sideRetreat.left = affordableRetreat(obstacleSpan.max - x, width2, sideRetreats(shrinkPinX, true), shrinkFloorX);
  sideRetreat.right = affordableRetreat(
    x + width2 - obstacleSpan.min,
    width2,
    sideRetreats(shrinkPinX, false),
    shrinkFloorX
  );
  writeObstacleSpanY(o, x, x + width2);
  sideRetreat.top = affordableRetreat(obstacleSpan.max - y, height2, sideRetreats(shrinkPinY, true), shrinkFloorY);
  sideRetreat.bottom = affordableRetreat(
    y + height2 - obstacleSpan.min,
    height2,
    sideRetreats(shrinkPinY, false),
    shrinkFloorY
  );
  let best;
  let bestCost = Infinity;
  for (const side of RETREAT_SIDES) {
    const cost = sideRetreat[side] / (side === "left" || side === "right" ? width2 : height2);
    if (cost < bestCost) {
      bestCost = cost;
      best = side;
    }
  }
  if (best == null)
    return;
  shrinkIntrusion[best] = Math.max(shrinkIntrusion[best], sideRetreat[best]);
  return shrinkExceedsCap();
}
function shrinkExceedsCap() {
  return shrinkIntrusion.left + shrinkIntrusion.right > shrinkWidthCap || shrinkIntrusion.top + shrinkIntrusion.bottom > shrinkHeightCap;
}
function spendableRetreat(retreat, floor) {
  return retreat >= floor ? retreat : 0;
}
function accumulateRegionIntrusion(region) {
  const { x, y, width: width2, height: height2 } = candidateBox;
  const left = Math.max(0, region.x - x);
  const right = Math.max(0, x + width2 - (region.x + region.width));
  const top = Math.max(0, region.y - y);
  const bottom = Math.max(0, y + height2 - (region.y + region.height));
  if (shrinkPinX === 0) {
    shrinkIntrusion.left = shrinkIntrusion.right = spendableRetreat(Math.max(left, right), shrinkFloorX);
  } else {
    shrinkIntrusion.left = sideRetreats(shrinkPinX, true) ? spendableRetreat(left, shrinkFloorX) : 0;
    shrinkIntrusion.right = sideRetreats(shrinkPinX, false) ? spendableRetreat(right, shrinkFloorX) : 0;
  }
  if (shrinkPinY === 0) {
    shrinkIntrusion.top = shrinkIntrusion.bottom = spendableRetreat(Math.max(top, bottom), shrinkFloorY);
  } else {
    shrinkIntrusion.top = sideRetreats(shrinkPinY, true) ? spendableRetreat(top, shrinkFloorY) : 0;
    shrinkIntrusion.bottom = sideRetreats(shrinkPinY, false) ? spendableRetreat(bottom, shrinkFloorY) : 0;
  }
}
function measureShrinkReduction(pinX, pinY, inflate, floorX, floorY, widthCap, heightCap, region) {
  shrinkWidthCap = widthCap;
  shrinkHeightCap = heightCap;
  shrinkIntrusion.left = 0;
  shrinkIntrusion.right = 0;
  shrinkIntrusion.top = 0;
  shrinkIntrusion.bottom = 0;
  shrinkPinX = pinX;
  shrinkPinY = pinY;
  shrinkFloorX = floorX;
  shrinkFloorY = floorY;
  if (region != null) {
    accumulateRegionIntrusion(region);
  }
  inflateBoxInto(queryBox, candidateBox, inflate);
  if (obstacleIndex.query(queryBox, accumulateObstacleReduction) || shrinkExceedsCap())
    return false;
  shrinkReduction.width = shrinkIntrusion.left + shrinkIntrusion.right;
  shrinkReduction.height = shrinkIntrusion.top + shrinkIntrusion.bottom;
  shrinkSlide.x = pinX === 0 ? (shrinkIntrusion.left - shrinkIntrusion.right) / 2 : 0;
  shrinkSlide.y = pinY === 0 ? (shrinkIntrusion.top - shrinkIntrusion.bottom) / 2 : 0;
  return shrinkReduction.width > 0 || shrinkReduction.height > 0;
}
function obstacleGridCellSize(data, obstacles) {
  let extentSum = 0;
  let extentCount = 0;
  for (const { datums } of data.values()) {
    for (const d of datums) {
      extentSum += d.label.width + d.label.height;
      extentCount += 2;
      const markerSize = markerSizeOf(d);
      if (markerSize > 0) {
        extentSum += markerSize;
        extentCount += 1;
      }
    }
  }
  for (const o of obstacles) {
    extentSum += o.box.width + o.box.height;
    extentCount += 2;
  }
  return gridCellSize(extentSum, extentCount);
}
var markerCentre = { cx: 0, cy: 0 };
function markerCentreOf(d) {
  const { x, y } = d.point;
  const size = markerSizeOf(d);
  markerCentre.cx = x;
  markerCentre.cy = y;
  if (d.anchor != null) {
    markerCentre.cx -= (d.anchor.x - 0.5) * size;
    markerCentre.cy -= (d.anchor.y - 0.5) * size;
  }
}
function insertMarkerObstacles(data) {
  let markerCount = 0;
  for (const { datums } of data.values()) {
    for (const d of datums) {
      const size = markerSizeOf(d);
      if (size <= 0)
        continue;
      markerCentreOf(d);
      const { cx, cy } = markerCentre;
      const r = size / 2;
      let obstacle = markerPool[markerCount];
      if (obstacle == null) {
        obstacle = {
          kind: "circle",
          box: { x: 0, y: 0, width: 0, height: 0 },
          cx: 0,
          cy: 0,
          r: 0,
          category: "marker"
        };
        markerPool.push(obstacle);
      }
      markerCount++;
      obstacle.cx = cx;
      obstacle.cy = cy;
      obstacle.r = r;
      obstacle.box.x = cx - r;
      obstacle.box.y = cy - r;
      obstacle.box.width = size;
      obstacle.box.height = size;
      obstacleIndex.insert(obstacle.box, obstacle);
    }
  }
}
function hasAnyLabels(data) {
  for (const entry of data.values()) {
    if (entry.datums[0]?.label != null)
      return true;
  }
  return false;
}
function seriesHides(entry) {
  if (entry.defaults?.alwaysShow === false)
    return true;
  return entry.datums.some((d) => d.alwaysShow === false);
}
function orderKeepFirst(data) {
  const keep = [];
  const drop = [];
  for (const entry of data.entries()) {
    (seriesHides(entry[1]) ? drop : keep).push(entry);
  }
  return keep.concat(drop);
}
function isSoleCandidateKeep(d, defaults, resolvesCandidates) {
  if (d.positionedCandidates != null)
    return isSolePositionedKeep(d, resolvesCandidates);
  const alwaysShow = d.alwaysShow ?? defaults?.alwaysShow ?? true;
  if (!alwaysShow || d.neverDrop === true || d.fit != null)
    return false;
  const placements = d.placements ?? defaults?.placements;
  return (placements?.length ?? 1) <= 1 && (orientationsOf(d)?.length ?? 1) <= 1;
}
function isSolePositionedKeep(d, resolvesCandidates) {
  const candidates = d.positionedCandidates;
  if (candidates.length !== 1 || d.neverDrop !== true || d.fit != null || resolvesCandidates)
    return false;
  const [candidate] = candidates;
  return candidate.region == null && candidate.hidden !== true;
}
function noLabelQueriesIndex(data) {
  for (const { datums, defaults, resolveCandidate } of data.values()) {
    const resolvesCandidates = resolveCandidate != null;
    for (const d of datums) {
      if (d.label.text === "")
        continue;
      if (!isSoleCandidateKeep(d, defaults, resolvesCandidates))
        return false;
    }
  }
  return true;
}
function buildObstacleIndex(data, obstacleSource, bounds) {
  const obstacles = typeof obstacleSource === "function" ? obstacleSource() : obstacleSource;
  obstacleIndex.reset(bounds, obstacleGridCellSize(data, obstacles));
  for (const o of obstacles) {
    obstacleIndex.insert(o.box, o);
  }
  insertMarkerObstacles(data);
}
function placeLabels(data, bounds, padding2 = 5, obstacles = []) {
  const result = /* @__PURE__ */ new Map();
  if (!hasAnyLabels(data))
    return result;
  const placementData = new Map(
    Array.from(data.entries(), ([k, entry]) => [
      k,
      {
        datums: entry.datums.toSorted((a, b) => markerSizeOf(b) - markerSizeOf(a)),
        defaults: entry.defaults,
        resolveCandidateStyle: entry.resolveCandidateStyle,
        resolveCandidate: entry.resolveCandidate
      }
    ])
  );
  const useIndex = !noLabelQueriesIndex(placementData);
  if (useIndex) {
    buildObstacleIndex(placementData, obstacles, bounds);
  }
  let labelObstacleCount = 0;
  for (const [seriesId, { datums, defaults, resolveCandidateStyle, resolveCandidate }] of orderKeepFirst(
    placementData
  )) {
    const labels = [];
    if (datums[0]?.label == null)
      continue;
    for (let index = 0, ln = datums.length; index < ln; index++) {
      const d = datums[index];
      if (d.label.text === "")
        continue;
      const placed = tryPlaceLabel(d, defaults, index, padding2, bounds, resolveCandidateStyle, resolveCandidate);
      if (placed != null) {
        labels.push(placed);
        if (useIndex && d.obstacle !== false) {
          labelObstacleCount = insertLabelObstacle(placed, labelObstacleCount);
        }
      }
    }
    result.set(seriesId, labels);
  }
  return result;
}
function labelObstacleBox(placed) {
  if (placed.rotation == null)
    return placed;
  const { width: width2, height: height2 } = getMinOuterRectSize(placed.rotation, placed.width, placed.height);
  return { x: placed.x, y: placed.y, width: width2, height: height2 };
}
function insertLabelObstacle(placed, count) {
  const box = labelObstacleBox(placed);
  let obstacle = labelObstaclePool[count];
  if (obstacle == null) {
    obstacle = { kind: "rect", box, category: "label" };
    labelObstaclePool.push(obstacle);
  } else {
    obstacle.box = box;
  }
  obstacleIndex.insert(box, obstacle);
  return count + 1;
}
function positionLabelBox(out, d, width2, height2, gap, spacing, placement) {
  const { point, anchor } = d;
  let dx = 0;
  let dy = 0;
  if (gap > 0 && placement != null) {
    const vec = labelPlacements[placement];
    dx = (width2 / 2 + gap + spacing) * vec.x;
    dy = (height2 / 2 + gap + spacing) * vec.y;
  }
  let x = point.x - width2 / 2 + dx;
  let y = point.y - height2 / 2 + dy;
  const markerSize = markerSizeOf(d);
  if (anchor) {
    x -= (anchor.x - 0.5) * markerSize;
    y -= (anchor.y - 0.5) * markerSize;
  }
  if (placement === "inside" && d.insideOffset) {
    x += d.insideOffset.x * markerSize;
    y += d.insideOffset.y * markerSize;
  }
  out.x = x;
  out.y = y;
}
function textLength(text) {
  if (!isArray(text))
    return toTextString(text).length;
  let length2 = 0;
  for (const segment of text) {
    if (segment.type !== "image")
      length2 += toTextString(segment.text).length;
  }
  return length2;
}
function fitLabelToCandidate(fit, font, source, container, fontSearch, candidateRegion, candidateRegionAlign) {
  const { text, policy } = fit;
  const maxWidth = Math.min(policy.maxWidth ?? Infinity, container?.width ?? Infinity);
  const maxHeight = Math.min(policy.maxHeight ?? Infinity, container?.height ?? Infinity);
  const full = source ?? measureLabelText(text, font);
  fittedLabel.maxWidth = maxWidth;
  fittedLabel.maxHeight = maxHeight;
  const region = candidateRegion ?? policy.region;
  const regionAlign = candidateRegionAlign ?? policy.regionAlign;
  if (region == null && full.width <= maxWidth && full.height <= maxHeight) {
    fittedLabel.text = text;
    fittedLabel.width = full.width;
    fittedLabel.height = full.height;
    fittedLabel.dropped = 0;
    fittedLabel.shrink = 0;
    fittedLabel.fontSize = void 0;
    return true;
  }
  boundedFit.maxWidth = maxWidth === Infinity ? void 0 : maxWidth;
  boundedFit.maxHeight = maxHeight === Infinity ? void 0 : maxHeight;
  boundedFit.wrapping = policy.wrapping;
  boundedFit.overflowStrategy = policy.overflowStrategy;
  boundedFit.minimumFontSize = fontSearch ? policy.minimumFontSize : void 0;
  boundedFit.region = region;
  boundedFit.regionAlign = regionAlign;
  const { text: fitted, fontSize } = fitLabelTextOrOverflowAutoSize(text, boundedFit, fit.fitOverflow, font);
  if (isErased(fitted))
    return false;
  const size = measureLabelText(fitted, fontWithSize(font, fontSize));
  fittedLabel.text = fitted;
  fittedLabel.width = size.width;
  fittedLabel.height = size.height;
  fittedLabel.dropped = Math.max(0, textLength(text) - textLength(fitted));
  fittedLabel.shrink = shrinkRatio(size, full);
  fittedLabel.fontSize = fontSize;
  return true;
}
function shrinkRatio(fitted, full) {
  const fullArea = full.width * full.height;
  if (fullArea <= 0)
    return 0;
  const ratio2 = 1 - fitted.width * fitted.height / fullArea;
  return ratio2 <= 0 ? 0 : Math.min(ratio2, MAX_SHRINK_SCORE);
}
function compassCandidateContainer(region, pad2, rotation) {
  if (region == null)
    return void 0;
  const upright = rotation % 180 === 0;
  const width2 = upright ? region.width : region.height;
  const height2 = upright ? region.height : region.width;
  candidateContainer.width = Math.max(0, width2 - (pad2 == null ? 0 : pad2.left + pad2.right));
  candidateContainer.height = Math.max(0, height2 - (pad2 == null ? 0 : pad2.top + pad2.bottom));
  return candidateContainer;
}
function insideMarkerCandidateContainer(d, placement, pad2, rotation, threshold) {
  if (placement !== "inside" || d.insideSize == null)
    return void 0;
  const markerSize = markerSizeOf(d);
  const upright = rotation % 180 === 0;
  const width2 = (upright ? d.insideSize.width : d.insideSize.height) * markerSize;
  const height2 = (upright ? d.insideSize.height : d.insideSize.width) * markerSize;
  const inset = 2 * containmentThreshold(threshold);
  candidateContainer.width = Math.max(0, width2 - boxWidthOf(pad2) - inset);
  candidateContainer.height = Math.max(0, height2 - boxHeightOf(pad2) - inset);
  return candidateContainer;
}
function styledFitSource(fit, font) {
  const key = toFontString(font);
  if (key !== styledSourceFont) {
    const { width: width2, height: height2 } = measureLabelText(fit.text, font);
    styledSource.width = width2;
    styledSource.height = height2;
    styledSourceFont = key;
  }
  return styledSource;
}
var candidateLabel = {
  text: "",
  width: 0,
  height: 0,
  dropped: 0,
  shrink: 0,
  glyphWidth: 0,
  glyphHeight: 0,
  maxWidth: Infinity,
  maxHeight: Infinity
};
function sizeCandidateLabel(d, style, placement, rotation, threshold, fitRegion, fitSource) {
  const { fit } = d;
  candidateFontSize = void 0;
  if (fit == null) {
    candidateLabel.text = d.label.text;
    candidateLabel.width = d.label.width;
    candidateLabel.height = d.label.height;
    candidateLabel.glyphWidth = d.label.width;
    candidateLabel.glyphHeight = d.label.height;
    candidateLabel.dropped = 0;
    candidateLabel.shrink = 0;
    candidateLabel.maxWidth = Infinity;
    candidateLabel.maxHeight = Infinity;
    return true;
  }
  const font = candidateFontAt(style?.font ?? fit.font);
  const boxPadding = style?.boxPadding ?? fit.boxPadding;
  const container = insideMarkerCandidateContainer(d, placement, boxPadding, rotation, threshold) ?? (fit.boundByRegion ? compassCandidateContainer(fitRegion, boxPadding, rotation) : void 0);
  const source = style == null && candidateTrialFontSize == null ? fitSource : styledFitSource(fit, font);
  if (!fitLabelToCandidate(fit, font, source, container, candidateTrialFontSize == null))
    return false;
  writeCandidateLabel(boxPadding, font);
  return true;
}
function writeCandidateLabel(boxPadding, font) {
  candidateLabel.text = fittedLabel.text;
  candidateLabel.glyphWidth = fittedLabel.width;
  candidateLabel.glyphHeight = fittedLabel.height;
  candidateLabel.width = fittedLabel.width + boxWidthOf(boxPadding);
  candidateLabel.height = fittedLabel.height + boxHeightOf(boxPadding);
  candidateLabel.dropped = fittedLabel.dropped;
  candidateLabel.shrink = fittedLabel.shrink;
  candidateLabel.maxWidth = fittedLabel.maxWidth;
  candidateLabel.maxHeight = fittedLabel.maxHeight;
  candidateFontSize = fittedLabel.fontSize ?? (candidateTrialFontSize == null ? void 0 : font.fontSize);
}
var shrunkContainer = { width: 0, height: 0 };
var shrunkOffset = { x: 0, y: 0 };
function reduceAxis(budget, extent2, reduce) {
  return reduce > 0 ? Math.max(0, Math.min(budget, extent2 - reduce)) : budget;
}
function refitCandidateShrunk(fit, font, source, boxPadding, reduceWidth, reduceHeight) {
  shrunkContainer.width = reduceAxis(candidateLabel.maxWidth, candidateLabel.glyphWidth, reduceWidth);
  shrunkContainer.height = reduceAxis(candidateLabel.maxHeight, candidateLabel.glyphHeight, reduceHeight);
  if (!fitLabelToCandidate(fit, font, source, shrunkContainer, false))
    return false;
  if (!hasRealChars(fittedLabel.text))
    return false;
  writeCandidateLabel(boxPadding, font);
  return true;
}
function slideShrunkCandidate(rawRegion, flush2) {
  const { x, y, width: width2, height: height2 } = candidateBox;
  candidateBox.x = x + shrinkSlide.x;
  candidateBox.y = y + shrinkSlide.y;
  if (flush2) {
    candidateBox.x = clampAxis(candidateBox.x, width2, rawRegion.x, rawRegion.width);
    candidateBox.y = clampAxis(candidateBox.y, height2, rawRegion.y, rawRegion.height);
  }
  shrunkOffset.x = candidateBox.x - x;
  shrunkOffset.y = candidateBox.y - y;
}
var flushOffset = { x: 0, y: 0 };
function flushCandidateBox(rawRegion, flush2) {
  flushOffset.x = 0;
  flushOffset.y = 0;
  if (!flush2)
    return;
  const { x, y, width: width2, height: height2 } = candidateBox;
  candidateBox.x = clampAxis(x, width2, rawRegion.x, rawRegion.width);
  candidateBox.y = clampAxis(y, height2, rawRegion.y, rawRegion.height);
  flushOffset.x = candidateBox.x - x;
  flushOffset.y = candidateBox.y - y;
}
function shrunkCandidateIsClear(region, inflate) {
  const { x, y, width: width2, height: height2 } = candidateBox;
  if (!boxContains(region, x, y, width2, height2))
    return false;
  inflateBoxInto(queryBox, candidateBox, inflate);
  return !obstacleIndex.query(queryBox, obstacleOverlapsCandidate);
}
function minRefitWidth(fit) {
  if (cascadeMinRefitWidth != null)
    return cascadeMinRefitWidth;
  const { policy, text } = fit;
  const { wrapping, overflowStrategy: overflowStrategy2 } = policy;
  const hide = overflowStrategy2 === "hide";
  let floor = Infinity;
  if ((hide || overflowStrategy2 === "ellipsis") && fit.fitOverflow == null && policy.region == null && !isArray(text) && (wrapping == null || wrapping === "on-space" || wrapping === "never")) {
    const lines = toTextString(text).split(LineSplitter);
    floor = hide ? widestWordWidth(lines, wrapping) : narrowestLeadWidth(lines, wrapping);
  }
  cascadeMinRefitWidth = floor;
  return floor;
}
function widestWordWidth(lines, wrapping) {
  const measurer = cascadeMeasurer;
  let widest = 0;
  for (const line of lines) {
    for (const unit of wrapping === "never" ? [line.trimEnd()] : line.split(" ")) {
      if (unit !== "") {
        widest = Math.max(widest, wordWidth(measurer, unit));
      }
    }
  }
  return widest;
}
function narrowestLeadWidth(lines, wrapping) {
  const measurer = cascadeMeasurer;
  const ellipsisWidth = measurer.textWidth(EllipsisChar);
  let narrowest = Infinity;
  for (const line of lines) {
    const lead = (wrapping === "never" ? [line.trimEnd()] : line.split(" ")).find((unit) => unit !== "");
    if (lead == null)
      continue;
    const first2 = measurer.textWidth(graphemeSegments(lead)[0]) + ellipsisWidth;
    narrowest = Math.min(narrowest, wordWidth(measurer, lead), first2);
  }
  return narrowest;
}
function wordWidth(measurer, word) {
  let estimate = 0;
  for (const grapheme of graphemeSegments(word)) {
    estimate += measurer.textWidth(grapheme);
  }
  return Math.min(estimate, measurer.textWidth(word));
}
function erasesOnLostLine(fit) {
  const { policy, text } = fit;
  return policy.overflowStrategy === "hide" && fit.fitOverflow == null && policy.region == null && !isArray(text);
}
function shrinkCompassCandidate(d, style, placement, rotation) {
  const fit = d.fit;
  if (fit == null)
    return false;
  const vec = cascadeGap > 0 && placement != null ? labelPlacements[placement] : void 0;
  const upright = rotation % 180 === 0;
  const font = candidateFontAt(style?.font ?? fit.font);
  const unstyled = style == null && candidateTrialFontSize == null;
  const lineHeight = (unstyled ? cascadeMeasurer : cachedTextMeasurer(font)).lineHeight();
  const floorX = upright ? 0 : lineHeight;
  const floorY = upright ? lineHeight : 0;
  const floor = unstyled ? minRefitWidth(fit) : Infinity;
  const affordableWidth = floor === Infinity ? Infinity : candidateLabel.glyphWidth - floor;
  const affordableHeight = unstyled && erasesOnLostLine(fit) ? 0 : Infinity;
  const widthCap = upright ? affordableWidth : affordableHeight;
  const heightCap = upright ? affordableHeight : affordableWidth;
  if (widthCap <= 0 && heightCap <= 0)
    return false;
  if (!measureShrinkReduction(vec?.x ?? 0, vec?.y ?? 0, cascadeInflate, floorX, floorY, widthCap, heightCap)) {
    return false;
  }
  const source = unstyled ? cascadeFitSource : styledFitSource(fit, font);
  const reduceWidth = upright ? shrinkReduction.width : shrinkReduction.height;
  const reduceHeight = upright ? shrinkReduction.height : shrinkReduction.width;
  if (!refitCandidateShrunk(fit, font, source, style?.boxPadding ?? fit.boxPadding, reduceWidth, reduceHeight)) {
    return false;
  }
  positionCandidate(d, placement, rotation, candidateLabel.width, candidateLabel.height, cascadeGap, cascadeSpacing);
  slideShrunkCandidate(cascadeRawRegion, cascadeFlushToRegion);
  const { x, y, width: width2, height: height2 } = candidateBox;
  const insideRegion = insideRegionFor(d, placement, x, y, width2, height2);
  const containRegion = insideRegion == null ? cascadeRegion : deflateRegion(deflatedInsideRegionBox, insideRegion, cascadeContainThreshold);
  return shrunkCandidateIsClear(containRegion, cascadeInflate);
}
function anchorPinX(anchor) {
  if (anchor.textAlign === "left" || anchor.textAlign === "start")
    return 1;
  if (anchor.textAlign === "right" || anchor.textAlign === "end")
    return -1;
  return 0;
}
function anchorPinY(anchor) {
  if (anchor.textBaseline === "top")
    return 1;
  if (anchor.textBaseline === "bottom")
    return -1;
  return 0;
}
function shrinkPositionedCandidate(d, c, fitSource, rawRegion, region, inflate) {
  const fit = d.fit;
  const fitTo = c.fitTo;
  if (fit == null || fitTo == null || (c.rotation ?? 0) % 360 !== 0)
    return false;
  const lineHeight = cachedTextMeasurer(fitTo.font ?? fit.font).lineHeight();
  if (!measureShrinkReduction(
    anchorPinX(fitTo.anchor),
    anchorPinY(fitTo.anchor),
    inflate,
    0,
    lineHeight,
    Infinity,
    Infinity,
    region
  )) {
    return false;
  }
  const styledFont = fitTo.font;
  const source = styledFont == null ? fitSource : styledFitSource(fit, styledFont);
  const { width: width2, height: height2 } = shrinkReduction;
  if (!refitCandidateShrunk(fit, styledFont ?? fit.font, source, fitTo.padding, width2, height2))
    return false;
  resizeCandidateBox(c, candidateLabel.width, candidateLabel.height);
  slideShrunkCandidate(rawRegion, c.region != null && c.flushToRegion !== false);
  return shrunkCandidateIsClear(region, inflate);
}
function tryPlaceLabel(d, defaults, index, padding2, bounds, resolveCandidateStyle, resolveCandidate) {
  const alwaysShow = d.alwaysShow ?? defaults?.alwaysShow ?? true;
  const placements = d.placements ?? defaults?.placements;
  const collideWith = d.collideWith ?? defaults?.collideWith;
  const gap = labelGapOf(d);
  const spacing = d.spacing ?? defaults?.spacing ?? padding2;
  const threshold = d.threshold ?? defaults?.threshold ?? 0;
  if (isSoleCandidateKeep(d, defaults, resolveCandidate != null)) {
    if (d.positionedCandidates != null)
      return placeSolePositioned(d, index);
    const placement = candidateAt(placements, d.placement, 0);
    const orientation = candidateAt(orientationsOf(d), singleOrientationOf(d), 0);
    const rotation = orientation == null ? 0 : orientationAngles[orientation];
    styledSourceFont = "";
    const style = resolveCandidateStyle?.(d, placement, orientation);
    if (style?.hidden === true)
      return void 0;
    if (!sizeCandidateLabel(d, style, placement, rotation, threshold, d.region, void 0))
      return void 0;
    const { text, width: width2, height: height2 } = candidateLabel;
    positionCandidate(d, placement, rotation, width2, height2, gap, spacing);
    const { x, y } = candidateBox;
    return {
      index,
      text,
      x,
      y,
      width: width2,
      height: height2,
      datum: d,
      placement,
      rotation: rotation === 0 ? void 0 : rotation,
      fontSize: candidateFontSize
    };
  }
  return placeAvoidingLabel(
    d,
    placements,
    collideWith,
    alwaysShow,
    index,
    bounds,
    gap,
    spacing,
    threshold,
    resolveCandidateStyle,
    resolveCandidate
  );
}
function placeSolePositioned(d, index) {
  const candidate = d.positionedCandidates[0];
  const { width: width2, height: height2 } = candidate.size ?? d.label;
  return {
    index,
    text: d.label.text,
    x: candidate.box.x,
    y: candidate.box.y,
    width: width2,
    height: height2,
    datum: d,
    placement: void 0,
    rotation: candidate.rotation,
    offsetX: 0,
    offsetY: 0,
    candidate
  };
}
function boxWidthOf(pad2) {
  return pad2 == null ? 0 : pad2.left + pad2.right;
}
function boxHeightOf(pad2) {
  return pad2 == null ? 0 : pad2.top + pad2.bottom;
}
var TIER_FIT = 0;
var TIER_COLLIDING = 1;
var TIER_OVERFLOWING = 2;
var MAX_SHRINK_SCORE = 0.999;
var bestChoice = {
  tier: Infinity,
  score: Infinity,
  text: "",
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  placement: void 0,
  candidate: void 0,
  fontSize: void 0
};
function recordBestChoice(tier, score, text, width2, height2, rotation, offsetX, offsetY, placement, candidate) {
  if (tier > bestChoice.tier || tier === bestChoice.tier && score >= bestChoice.score)
    return;
  bestChoice.tier = tier;
  bestChoice.score = score;
  bestChoice.text = text;
  bestChoice.x = candidateBox.x;
  bestChoice.y = candidateBox.y;
  bestChoice.width = width2;
  bestChoice.height = height2;
  bestChoice.rotation = rotation;
  bestChoice.offsetX = offsetX;
  bestChoice.offsetY = offsetY;
  bestChoice.placement = placement;
  bestChoice.candidate = candidate;
  bestChoice.fontSize = candidateFontSize;
}
function placeBestChoice(index, d) {
  if (bestChoice.tier === Infinity)
    return void 0;
  return {
    index,
    text: bestChoice.text,
    x: bestChoice.x,
    y: bestChoice.y,
    width: bestChoice.width,
    height: bestChoice.height,
    datum: d,
    placement: bestChoice.placement,
    rotation: bestChoice.rotation === 0 ? void 0 : bestChoice.rotation,
    offsetX: bestChoice.offsetX,
    offsetY: bestChoice.offsetY,
    candidate: bestChoice.candidate,
    fontSize: bestChoice.fontSize
  };
}
function cascadeCandidates() {
  const d = cascadeDatum;
  const candidateCount = cascadePlacements?.length ?? 1;
  const orientationCount = cascadeOrientations?.length ?? 1;
  const recordBest = candidateTrialFontSize == null;
  for (let pi = 0; pi < candidateCount; pi++) {
    const placement = candidateAt(cascadePlacements, d.placement, pi);
    for (let oi = 0; oi < orientationCount; oi++) {
      const orientation = candidateAt(cascadeOrientations, cascadeSingleOrientation, oi);
      const rotation = orientation == null ? 0 : orientationAngles[orientation];
      const style = cascadeStyle?.(d, placement, orientation);
      if (style?.hidden === true)
        continue;
      if (!sizeCandidateLabel(d, style, placement, rotation, cascadeThreshold, cascadeFitRegion, cascadeFitSource)) {
        continue;
      }
      const { text, width: width2, height: height2, dropped, shrink } = candidateLabel;
      positionCandidate(d, placement, rotation, width2, height2, cascadeGap, cascadeSpacing);
      flushCandidateBox(cascadeRawRegion, cascadeFlushToRegion);
      const { x, y, width: cw, height: ch } = candidateBox;
      const { x: offsetX, y: offsetY } = flushOffset;
      candidatePlacement = placement;
      const insideRegion = insideRegionFor(d, placement, x, y, cw, ch);
      const containRegion = insideRegion == null ? cascadeRegion : deflateRegion(deflatedInsideRegionBox, insideRegion, cascadeContainThreshold);
      inflateBoxInto(queryBox, candidateBox, cascadeInflate);
      const contained = boxContains(containRegion, x, y, cw, ch);
      if (contained && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
        if (dropped === 0) {
          return {
            index: cascadeIndex,
            text,
            x,
            y,
            width: width2,
            height: height2,
            datum: d,
            placement,
            rotation: rotation === 0 ? void 0 : rotation,
            offsetX,
            offsetY,
            fontSize: candidateFontSize
          };
        }
        if (recordBest) {
          recordBestChoice(
            TIER_FIT,
            dropped + shrink,
            text,
            width2,
            height2,
            rotation,
            offsetX,
            offsetY,
            placement,
            void 0
          );
        }
        continue;
      }
      if (cascadeKeepBest && recordBest) {
        const overflow = regionOverflow(containRegion, x, y, cw, ch);
        let tier = TIER_OVERFLOWING;
        let score = overflow;
        if (overflow === 0) {
          candidateWorstOverlap = 0;
          obstacleIndex.query(queryBox, worstObstacleOverlap);
          tier = TIER_COLLIDING;
          score = candidateWorstOverlap;
        }
        recordBestChoice(tier, score, text, width2, height2, rotation, offsetX, offsetY, placement, void 0);
      }
      if (contained && recordBest && shrinkCompassCandidate(d, style, placement, rotation)) {
        recordShrunkChoice(rotation, placement, void 0);
      }
    }
  }
  return void 0;
}
function recordShrunkChoice(rotation, placement, candidate) {
  recordBestChoice(
    TIER_FIT,
    candidateLabel.dropped + candidateLabel.shrink,
    candidateLabel.text,
    candidateLabel.width,
    candidateLabel.height,
    rotation,
    shrunkOffset.x,
    shrunkOffset.y,
    placement,
    candidate
  );
}
function shrinkToClear() {
  const { fit } = cascadeDatum;
  const minimumFontSize = fit?.policy.minimumFontSize;
  if (fit == null || minimumFontSize == null)
    return void 0;
  const { fontSize } = fit.font;
  const floor = resolveMinimumFontSize(minimumFontSize, fontSize);
  if (floor >= fontSize)
    return void 0;
  try {
    return findLargestFontSizeDescending(floor, fontSize, function trialFontSize(size) {
      candidateTrialFontSize = size;
      return cascadeCandidates();
    });
  } finally {
    candidateTrialFontSize = void 0;
  }
}
function placeAvoidingLabel(d, placements, collideWith, alwaysShow, index, bounds, gap, spacing, threshold, resolveCandidateStyle, resolveCandidate) {
  bestChoice.tier = Infinity;
  bestChoice.score = Infinity;
  if (d.positionedCandidates != null) {
    return placeFromPositionedCandidates(d, collideWith, threshold, index, bounds, resolveCandidate);
  }
  const { fit } = d;
  const styled = resolveCandidateStyle != null;
  cascadeFitSource = fit == null || styled ? void 0 : measureLabelText(fit.text, fit.font);
  styledSourceFont = "";
  cascadeMinRefitWidth = void 0;
  cascadeMeasurer = fit == null ? void 0 : cachedTextMeasurer(fit.font);
  cascadeDatum = d;
  cascadeIndex = index;
  cascadePlacements = placements;
  cascadeOrientations = orientationsOf(d);
  cascadeSingleOrientation = singleOrientationOf(d);
  cascadeStyle = resolveCandidateStyle;
  cascadeGap = gap;
  cascadeSpacing = spacing;
  cascadeInflate = Math.max(threshold, 0);
  cascadeThreshold = threshold;
  candidateCollideWith = collideWith;
  candidateThreshold = threshold;
  markerCentreOf(d);
  candidateOwnMarkerCx = markerCentre.cx;
  candidateOwnMarkerCy = markerCentre.cy;
  candidateOwnMarkerR = markerSizeOf(d) / 2;
  candidateOwnBox = d.ownBox;
  candidateOwnBoxLabelsCollide = d.ownBoxLabelsCollide ?? false;
  cascadeRawRegion = d.region ?? bounds;
  cascadeContainThreshold = containmentThreshold(threshold);
  cascadeRegion = deflateRegion(deflatedRegionBox, cascadeRawRegion, cascadeContainThreshold);
  cascadeFitRegion = d.region == null ? void 0 : deflateRegion(fitRegionBox, d.region, threshold);
  cascadeFlushToRegion = d.region != null && d.neverDrop === true;
  cascadeKeepBest = d.neverDrop === true || alwaysShow;
  const placed = cascadeCandidates();
  if (placed != null)
    return placed;
  const shrunk = shrinkToClear();
  if (shrunk != null)
    return shrunk;
  return placeBestChoice(index, d);
}
function placeFromPositionedCandidates(d, collideWith, threshold, index, bounds, resolveCandidate) {
  const candidates = d.positionedCandidates;
  const inflate = Math.max(threshold, 0);
  candidateCollideWith = collideWith;
  candidateThreshold = threshold;
  candidatePlacement = void 0;
  candidateOwnMarkerCx = Number.NaN;
  candidateOwnMarkerCy = Number.NaN;
  candidateOwnMarkerR = -1;
  candidateOwnBox = d.ownBox;
  candidateOwnBoxLabelsCollide = d.ownBoxLabelsCollide ?? false;
  const { fit } = d;
  const fitSource = fit == null ? void 0 : measureLabelText(fit.text, fit.font);
  styledSourceFont = "";
  const containThreshold = containmentThreshold(threshold);
  for (let ci = 0, ln = candidates.length; ci < ln; ci++) {
    const c = resolveCandidate == null ? candidates[ci] : resolveCandidate(d, candidates[ci]);
    if (c.hidden === true)
      continue;
    const rawRegion = c.region ?? bounds;
    const region = deflateRegion(deflatedRegionBox, rawRegion, containThreshold);
    let { text } = d.label;
    let { width: width2, height: height2 } = c.size ?? d.label;
    let dropped = 0;
    let shrink = 0;
    candidateFontSize = void 0;
    candidateBox.x = c.box.x;
    candidateBox.y = c.box.y;
    candidateBox.width = c.box.width;
    candidateBox.height = c.box.height;
    if (fit != null && c.fitTo != null) {
      const styledFont = c.fitTo.font;
      const source = styledFont == null ? fitSource : styledFitSource(fit, styledFont);
      const container = deflateContainer(c.fitTo.container, threshold);
      if (!fitLabelToCandidate(
        fit,
        styledFont ?? fit.font,
        source,
        container,
        candidateTrialFontSize == null,
        c.fitTo.shape,
        c.fitTo.shapeAlign
      )) {
        continue;
      }
      if (container !== c.fitTo.container && !hasRealChars(fittedLabel.text) && !fitLabelToCandidate(
        fit,
        styledFont ?? fit.font,
        source,
        c.fitTo.container,
        candidateTrialFontSize == null,
        c.fitTo.shape,
        c.fitTo.shapeAlign
      )) {
        continue;
      }
      ({ text, dropped, shrink } = fittedLabel);
      writeCandidateLabel(c.fitTo.padding, styledFont ?? fit.font);
      ({ width: width2, height: height2 } = candidateLabel);
      resizeCandidateBox(c, width2, height2);
    }
    flushCandidateBox(rawRegion, c.region != null && c.flushToRegion !== false);
    const { x, y, width: cw, height: ch } = candidateBox;
    const { x: offsetX, y: offsetY } = flushOffset;
    inflateBoxInto(queryBox, candidateBox, inflate);
    const rotation = c.rotation ?? 0;
    const contained = boxContains(region, x, y, cw, ch);
    if (contained && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
      if (dropped === 0) {
        return {
          index,
          text,
          x,
          y,
          width: width2,
          height: height2,
          datum: d,
          placement: void 0,
          rotation: c.rotation,
          offsetX,
          offsetY,
          candidate: c,
          fontSize: candidateFontSize
        };
      }
      recordBestChoice(TIER_FIT, dropped + shrink, text, width2, height2, rotation, offsetX, offsetY, void 0, c);
      continue;
    }
    if (d.neverDrop === true) {
      const overflow = regionOverflow(region, x, y, cw, ch);
      let tier = TIER_OVERFLOWING;
      let score = overflow;
      if (overflow === 0 && ln > 1) {
        candidateWorstOverlap = 0;
        obstacleIndex.query(queryBox, worstObstacleOverlap);
        tier = TIER_COLLIDING;
        score = candidateWorstOverlap;
      }
      recordBestChoice(tier, score, text, width2, height2, rotation, offsetX, offsetY, void 0, c);
    }
    if (shrinkPositionedCandidate(d, c, fitSource, rawRegion, region, inflate)) {
      recordShrunkChoice(rotation, void 0, c);
    }
  }
  return placeBestChoice(index, d);
}
function resizeCandidateBox(c, boxWidth, boxHeight) {
  const { anchor, padding: padding2 } = c.fitTo;
  writeLabelBoxCentre(boxCentre, anchor, boxWidth, boxHeight, padding2);
  rotatedSizeInto(c.rotation ?? 0, boxWidth, boxHeight);
  candidateBox.x = boxCentre.x - rotatedSize.width / 2;
  candidateBox.y = boxCentre.y - rotatedSize.height / 2;
  candidateBox.width = rotatedSize.width;
  candidateBox.height = rotatedSize.height;
}
function orientationsOf(d) {
  return Array.isArray(d.orientation) ? d.orientation : void 0;
}
function singleOrientationOf(d) {
  return Array.isArray(d.orientation) ? void 0 : d.orientation;
}
function clampAxis(pos, size, min, extent2) {
  if (size > extent2)
    return pos;
  return Math.min(Math.max(pos, min), min + extent2 - size);
}
function regionOverflow(region, x, y, w, h) {
  return Math.max(0, region.x - x) + Math.max(0, x + w - (region.x + region.width)) + Math.max(0, region.y - y) + Math.max(0, y + h - (region.y + region.height));
}
function candidateAt(list, single, i) {
  return list ? list[i] : single;
}
function insideRegionFor(d, placement, x, y, boxWidth, boxHeight) {
  if (placement !== "inside" || d.insideSize == null)
    return void 0;
  const markerSize = markerSizeOf(d);
  const rw = d.insideSize.width * markerSize;
  const rh = d.insideSize.height * markerSize;
  insideRegionBox.x = x + boxWidth / 2 - rw / 2;
  insideRegionBox.y = y + boxHeight / 2 - rh / 2;
  insideRegionBox.width = rw;
  insideRegionBox.height = rh;
  return insideRegionBox;
}
function positionCandidate(d, placement, rotation, width2, height2, gap, spacing) {
  rotatedSizeInto(rotation, width2, height2);
  positionLabelBox(candidateBox, d, rotatedSize.width, rotatedSize.height, gap, spacing, placement);
  candidateBox.width = rotatedSize.width;
  candidateBox.height = rotatedSize.height;
}

// packages/ag-charts-core/src/geometry/barLabelGeometry.ts
function barLabelRotation(orientation) {
  return orientation == null ? 0 : toRadians(orientationAngles[orientation]);
}
function barLabelOrientation(rotation) {
  if (rotation < 0)
    return "vertical";
  if (rotation > 0)
    return "vertical-reversed";
  return "horizontal";
}
function insideBarValueInsets(anchor, isUpward, isVertical, spacing) {
  if (anchor === "center")
    return { min: 0, max: 0 };
  const startAtMin = isVertical ? !isUpward : isUpward;
  const anchoredAtMin = anchor === "start" ? startAtMin : !startAtMin;
  return anchoredAtMin ? { min: spacing, max: 0 } : { min: 0, max: spacing };
}
function insideBarRegion(rect2, valueMinInset, valueMaxInset, isVertical) {
  return isVertical ? {
    x: rect2.x,
    y: rect2.y + valueMinInset,
    width: rect2.width,
    height: rect2.height - valueMinInset - valueMaxInset
  } : {
    x: rect2.x + valueMinInset,
    y: rect2.y,
    width: rect2.width - valueMinInset - valueMaxInset,
    height: rect2.height
  };
}
function insideBarContainer(region, box) {
  return {
    width: Math.max(0, region.width - box.left - box.right),
    height: Math.max(0, region.height - box.top - box.bottom)
  };
}
function sectorLabelContainer(anchor, sector, lineHeight) {
  const { startAngle, endAngle, innerRadius, outerRadius } = sector;
  const px = Math.abs(anchor.x);
  const py = Math.abs(anchor.y);
  const radius = Math.hypot(px, py);
  if (radius < 1e-6)
    return { width: 0, height: 0 };
  const cosMid = px / radius;
  const sinMid = py / radius;
  const halfSpan = Math.min(Math.abs(endAngle - startAngle) / 2, Math.PI / 2);
  const edgeDistance = radius * Math.sin(halfSpan);
  const edges = [startAngle, endAngle].map((angle2) => ({
    sin: Math.abs(Math.sin(angle2)),
    cos: Math.abs(Math.cos(angle2))
  }));
  const halfWidthGiven = (b) => {
    const outer = Math.sqrt(Math.max(0, outerRadius ** 2 - (py + b) ** 2)) - px;
    const edgeLimits = edges.map((e) => e.sin > 1e-6 ? (edgeDistance - b * e.cos) / e.sin : Infinity);
    const inner = innerRadius > 0 && cosMid > 1e-6 ? (radius - innerRadius - b * sinMid) / cosMid : Infinity;
    return Math.max(0, Math.min(outer, inner, ...edgeLimits));
  };
  const halfHeightGiven = (a) => {
    const outer = Math.sqrt(Math.max(0, outerRadius ** 2 - (px + a) ** 2)) - py;
    const edgeLimits = edges.map((e) => e.cos > 1e-6 ? (edgeDistance - a * e.sin) / e.cos : Infinity);
    const inner = innerRadius > 0 && sinMid > 1e-6 ? (radius - innerRadius - a * cosMid) / sinMid : Infinity;
    return Math.max(0, Math.min(outer, inner, ...edgeLimits));
  };
  const halfHeightSeed = lineHeight / 2;
  const halfWidth = halfWidthGiven(halfHeightSeed);
  const halfHeight = Math.max(halfHeightSeed, halfHeightGiven(halfWidth));
  return { width: 2 * halfWidth, height: 2 * halfHeight };
}
var oppositeSide = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};
function rotatedLabelInset(facing, rotation, labelWidth, labelHeight, padding2) {
  const vertical = facing === "top" || facing === "bottom";
  if (rotation === 0)
    return padding2[facing];
  const boxWidth = labelWidth + padding2.left + padding2.right;
  const boxHeight = labelHeight + padding2.top + padding2.bottom;
  const sin = Math.abs(Math.sin(rotation));
  const cos = Math.abs(Math.cos(rotation));
  const halfExtent = vertical ? boxWidth / 2 * sin + boxHeight / 2 * cos : boxWidth / 2 * cos + boxHeight / 2 * sin;
  const glyphHalf = vertical ? labelHeight / 2 : labelWidth / 2;
  return halfExtent - glyphHalf + (padding2[facing] - padding2[oppositeSide[facing]]) / 2;
}
function rotatedGlyphDrift(rotation, padding2) {
  const sx = (padding2.right - padding2.left) / 2;
  const sy = (padding2.bottom - padding2.top) / 2;
  const sin = Math.sin(rotation);
  const cos = Math.cos(rotation);
  return { x: sx * (1 - cos) + sy * sin, y: sy * (1 - cos) - sx * sin };
}
function barLabelResolvesOrientation(orientation) {
  return Array.isArray(orientation) && orientation.length > 1;
}
function labelFootprintBox(anchor, glyphWidth, glyphHeight, padding2, rotationRad) {
  const boxWidth = glyphWidth + padding2.left + padding2.right;
  const boxHeight = glyphHeight + padding2.top + padding2.bottom;
  const glyph = labelGlyphCentre(anchor, glyphWidth, glyphHeight);
  const cx = glyph.x + (padding2.right - padding2.left) / 2;
  const cy = glyph.y + (padding2.bottom - padding2.top) / 2;
  const { width: width2, height: height2 } = getMinOuterRectSize(toDegrees(rotationRad), boxWidth, boxHeight);
  return { x: cx - width2 / 2, y: cy - height2 / 2, width: width2, height: height2 };
}
function buildBarLabelDatum(anchor, text, width2, height2, orientations, region, collideWith, threshold, target, fit) {
  const { x, y } = labelGlyphCentre(anchor, width2, height2);
  return {
    point: { x, y, size: 0 },
    label: { text, width: width2, height: height2 },
    fit,
    anchor: void 0,
    placement: void 0,
    orientation: orientations,
    gap: 0,
    neverDrop: true,
    collideWith,
    threshold,
    region,
    ownBox: region,
    target
  };
}
function buildBarPositionedLabelDatum(text, width2, height2, candidates, target, ownBox, alwaysShow, collideWith, threshold, ownBoxLabelsCollide = false, fit, styleDatum) {
  return {
    point: { x: 0, y: 0, size: 0 },
    label: { text, width: width2, height: height2 },
    fit,
    anchor: void 0,
    placement: void 0,
    gap: 0,
    // When labels are hideable (`alwaysShow: false`) a no-fit candidate is dropped so the caller
    // can hide it; otherwise the engine keeps the least-overflowing candidate.
    neverDrop: alwaysShow,
    collideWith,
    threshold,
    positionedCandidates: candidates,
    ownBox,
    ownBoxLabelsCollide,
    target,
    styleDatum
  };
}
function applyBarLabelOrientation(placed) {
  for (const { datum, rotation, offsetX, offsetY, candidate, text, fontSize } of placed) {
    const { target, fit } = datum;
    target.rotation = toRadians(rotation ?? 0);
    target.offsetX = offsetX ?? 0;
    target.offsetY = offsetY ?? 0;
    target.fittedText = fit == null ? void 0 : text;
    target.fittedFontSize = fit == null ? void 0 : fontSize;
    if (candidate != null) {
      const { anchor, placement } = candidate;
      target.x = anchor.x;
      target.y = anchor.y;
      target.textAlign = anchor.textAlign;
      target.textBaseline = anchor.textBaseline;
      target.placement = placement;
    }
  }
}
function applyPlacedBarLabelVisibility(elements, placed, resolveTarget) {
  const kept = /* @__PURE__ */ new Set();
  for (const { datum } of placed) {
    kept.add(datum.target);
  }
  for (const element2 of elements ?? []) {
    const target = resolveTarget(element2);
    if (target?.candidates != null)
      target.hidden = !kept.has(target);
  }
}
function barLabelResolvesPlacement(placement) {
  return Array.isArray(placement) && placement.length > 1;
}
function barLabelUsesPositionedCandidates(orientation, placement, alwaysShow, fit) {
  return barLabelResolvesPlacement(placement) || !alwaysShow || fit != null && !barLabelResolvesOrientation(orientation);
}
function barLabelRoutesThroughEngine(orientation, placement, alwaysShow, fit) {
  return barLabelResolvesOrientation(orientation) || barLabelResolvesPlacement(placement) || !alwaysShow || fit != null;
}
function barLabelPropsRouteThroughEngine(label) {
  const alwaysShow = label.collision.alwaysShow;
  return barLabelRoutesThroughEngine(
    label.orientation,
    label.placement,
    alwaysShow,
    resolveLabelFit(label, !alwaysShow)
  );
}
function barLabelPropsUsePositionedCandidates(label) {
  const alwaysShow = label.collision.alwaysShow;
  return barLabelUsesPositionedCandidates(
    label.orientation,
    label.placement,
    alwaysShow,
    resolveLabelFit(label, !alwaysShow)
  );
}
function buildBarLabelData(elements, resolve) {
  const data = [];
  for (const element2 of elements ?? []) {
    const source = resolve(element2);
    if (source?.label == null || source.label.text === "")
      continue;
    const { label, config } = source;
    const orientations = toArray(config.orientation);
    if (orientations.length <= 1)
      continue;
    const { width: width2, height: height2 } = source.size ?? measureLabelText(label.text, config);
    data.push(
      buildBarLabelDatum(
        label,
        label.text,
        width2,
        height2,
        orientations,
        label.region,
        source.collideWith,
        source.threshold,
        label,
        source.fit
      )
    );
  }
  return data;
}
function rectLabelObstacles(nodeData) {
  if (nodeData == null || nodeData.length === 0)
    return void 0;
  const obstacles = [];
  for (const { x, y, width: width2, height: height2, phantom } of nodeData) {
    if (phantom === true || width2 <= 0 || height2 <= 0)
      continue;
    obstacles.push({ kind: "rect", box: { x, y, width: width2, height: height2 }, category: "seriesItem" });
  }
  return obstacles.length > 0 ? obstacles : void 0;
}
function bakedLabelObstacles(elements, resolve) {
  const obstacles = [];
  for (const element2 of elements ?? []) {
    const source = resolve(element2);
    const label = source?.label;
    if (source == null || label == null || label.text === "" || label.hidden === true)
      continue;
    const { width: width2, height: height2 } = measureLabelText(label.text, source.config);
    const box = labelFootprintBox(label, width2, height2, source.box, label.rotation);
    obstacles.push({ kind: "rect", box, category: "label" });
  }
  return obstacles.length > 0 ? obstacles : void 0;
}
function barLabelObstacles(nodeData, labelData, bakeLabels, resolveBaked) {
  const rects = rectLabelObstacles(nodeData);
  if (!bakeLabels)
    return rects;
  const labels = bakedLabelObstacles(labelData, resolveBaked);
  if (labels == null)
    return rects;
  return rects == null ? labels : rects.concat(labels);
}

// packages/ag-charts-core/src/geometry/bezier.ts
function evaluateBezier(p0, p1, p2, p3, t) {
  return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
}
function solveBezier(p0, p1, p2, p3, value) {
  if (value <= Math.min(p0, p3)) {
    return p0 < p3 ? 0 : 1;
  } else if (value >= Math.max(p0, p3)) {
    return p0 < p3 ? 1 : 0;
  }
  let t0 = 0;
  let t1 = 1;
  let t = Number.NaN;
  for (let i = 0; i < 12; i += 1) {
    t = (t0 + t1) / 2;
    const curveValue = evaluateBezier(p0, p1, p2, p3, t);
    if (curveValue < value) {
      t0 = t;
    } else {
      t1 = t;
    }
  }
  return t;
}
function splitBezier2D(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t) {
  const x01 = (1 - t) * p0x + t * p1x;
  const y01 = (1 - t) * p0y + t * p1y;
  const x12 = (1 - t) * p1x + t * p2x;
  const y12 = (1 - t) * p1y + t * p2y;
  const x23 = (1 - t) * p2x + t * p3x;
  const y23 = (1 - t) * p2y + t * p3y;
  const x012 = (1 - t) * x01 + t * x12;
  const y012 = (1 - t) * y01 + t * y12;
  const x123 = (1 - t) * x12 + t * x23;
  const y123 = (1 - t) * y12 + t * y23;
  const x0123 = (1 - t) * x012 + t * x123;
  const y0123 = (1 - t) * y012 + t * y123;
  return [
    [
      { x: p0x, y: p0y },
      { x: x01, y: y01 },
      { x: x012, y: y012 },
      { x: x0123, y: y0123 }
    ],
    [
      { x: x0123, y: y0123 },
      { x: x123, y: y123 },
      { x: x23, y: y23 },
      { x: p3x, y: p3y }
    ]
  ];
}
function calculateDerivativeExtrema(p0, p1, p2, p3) {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = -p0 + p1;
  if (a === 0) {
    if (b !== 0) {
      const t = -c / b;
      if (t > 0 && t < 1) {
        return [t];
      }
    }
    return [];
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant >= 0) {
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b + sqrtDiscriminant) / (2 * a);
    const t2 = (-b - sqrtDiscriminant) / (2 * a);
    return [t1, t2].filter((t) => t > 0 && t < 1);
  }
  return [];
}
function bezier2DExtrema(cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cp3x, cp3y) {
  const tx = calculateDerivativeExtrema(cp0x, cp1x, cp2x, cp3x);
  const ty = calculateDerivativeExtrema(cp0y, cp1y, cp2y, cp3y);
  return [...tx, ...ty];
}
function bezierCandidate(points, x, y) {
  const midX = evaluateBezier(points[0].x, points[1].x, points[2].x, points[3].x, 0.5);
  const midY = evaluateBezier(points[0].y, points[1].y, points[2].y, points[3].y, 0.5);
  const distance2 = Math.hypot(midX - x, midY - y);
  const minDistance = Math.min(
    Math.hypot(points[0].x - x, points[0].y - y),
    Math.hypot(points[1].x - x, points[1].y - y),
    Math.hypot(points[2].x - x, points[2].y - y),
    Math.hypot(points[3].x - x, points[3].y - y)
  );
  return { points, distance: distance2, minDistance };
}
function bezier2DDistance(cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cp3x, cp3y, x, y, precision = 1) {
  const points0 = [
    { x: cp0x, y: cp0y },
    { x: cp1x, y: cp1y },
    { x: cp2x, y: cp2y },
    { x: cp3x, y: cp3y }
  ];
  let queue = {
    value: bezierCandidate(points0, x, y),
    next: null
  };
  let bestResult;
  while (queue != null) {
    const { points, distance: distance2, minDistance } = queue.value;
    queue = queue.next;
    if (bestResult == null || distance2 < bestResult.distance) {
      bestResult = { distance: distance2, minDistance };
    }
    if (bestResult != null && bestResult.distance - minDistance <= precision) {
      continue;
    }
    const [leftPoints, rightPoints] = splitBezier2D(
      points[0].x,
      points[0].y,
      points[1].x,
      points[1].y,
      points[2].x,
      points[2].y,
      points[3].x,
      points[3].y,
      0.5
    );
    const newCandidates = [bezierCandidate(leftPoints, x, y), bezierCandidate(rightPoints, x, y)].sort(
      bezierCandidateCmp
    );
    queue = insertListItemsSorted(queue, newCandidates, bezierCandidateCmp);
  }
  return bestResult?.distance ?? Infinity;
}
var bezierCandidateCmp = (a, b) => b.minDistance - a.minDistance;

// packages/ag-charts-core/src/geometry/crossLineLabelTranslation.ts
var horizontalCrosslineTranslationDirections = {
  top: { xTranslationDirection: 0, yTranslationDirection: -1 },
  bottom: { xTranslationDirection: 0, yTranslationDirection: 1 },
  left: { xTranslationDirection: -1, yTranslationDirection: 0 },
  right: { xTranslationDirection: 1, yTranslationDirection: 0 },
  "top-left": { xTranslationDirection: 1, yTranslationDirection: -1 },
  "top-right": { xTranslationDirection: -1, yTranslationDirection: -1 },
  "bottom-left": { xTranslationDirection: 1, yTranslationDirection: 1 },
  "bottom-right": { xTranslationDirection: -1, yTranslationDirection: 1 },
  inside: { xTranslationDirection: 0, yTranslationDirection: 0 },
  "inside-left": { xTranslationDirection: 1, yTranslationDirection: 0 },
  "inside-right": { xTranslationDirection: -1, yTranslationDirection: 0 },
  "inside-top": { xTranslationDirection: 0, yTranslationDirection: 1 },
  "inside-bottom": { xTranslationDirection: 0, yTranslationDirection: -1 },
  "inside-top-left": { xTranslationDirection: 1, yTranslationDirection: 1 },
  "inside-bottom-left": { xTranslationDirection: 1, yTranslationDirection: -1 },
  "inside-top-right": { xTranslationDirection: -1, yTranslationDirection: 1 },
  "inside-bottom-right": { xTranslationDirection: -1, yTranslationDirection: -1 }
};
var verticalCrossLineTranslationDirections = {
  top: { xTranslationDirection: 1, yTranslationDirection: 0 },
  bottom: { xTranslationDirection: -1, yTranslationDirection: 0 },
  left: { xTranslationDirection: 0, yTranslationDirection: -1 },
  right: { xTranslationDirection: 0, yTranslationDirection: 1 },
  "top-left": { xTranslationDirection: -1, yTranslationDirection: -1 },
  "top-right": { xTranslationDirection: -1, yTranslationDirection: 1 },
  "bottom-left": { xTranslationDirection: 1, yTranslationDirection: -1 },
  "bottom-right": { xTranslationDirection: 1, yTranslationDirection: 1 },
  inside: { xTranslationDirection: 0, yTranslationDirection: 0 },
  "inside-left": { xTranslationDirection: 0, yTranslationDirection: 1 },
  "inside-right": { xTranslationDirection: 0, yTranslationDirection: -1 },
  "inside-top": { xTranslationDirection: -1, yTranslationDirection: 0 },
  "inside-bottom": { xTranslationDirection: 1, yTranslationDirection: 0 },
  "inside-top-left": { xTranslationDirection: -1, yTranslationDirection: 1 },
  "inside-bottom-left": { xTranslationDirection: 1, yTranslationDirection: 1 },
  "inside-top-right": { xTranslationDirection: -1, yTranslationDirection: -1 },
  "inside-bottom-right": { xTranslationDirection: 1, yTranslationDirection: -1 }
};
function calculateLabelTranslation({
  yDirection,
  padding: padding2 = 0,
  position = "top",
  bbox
}) {
  const crossLineTranslationDirections = yDirection ? horizontalCrosslineTranslationDirections : verticalCrossLineTranslationDirections;
  const { xTranslationDirection, yTranslationDirection } = crossLineTranslationDirections[position];
  const xTranslation = xTranslationDirection * (padding2 + bbox.width / 2);
  const yTranslation = yTranslationDirection * (padding2 + bbox.height / 2);
  return {
    xTranslation,
    yTranslation
  };
}

// packages/ag-charts-core/src/geometry/distance.ts
function pointsDistanceSquared(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}
function lineDistanceSquared(x, y, x1, y1, x2, y2, best) {
  if (x1 === x2 && y1 === y2) {
    return Math.min(best, pointsDistanceSquared(x, y, x1, y1));
  }
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const ix = x1 + t * dx;
  const iy = y1 + t * dy;
  return Math.min(best, pointsDistanceSquared(x, y, ix, iy));
}
function arcDistanceSquared(x, y, cx, cy, radius, startAngle, endAngle, counterClockwise, best) {
  if (counterClockwise) {
    [endAngle, startAngle] = [startAngle, endAngle];
  }
  const angle2 = Math.atan2(y - cy, x - cx);
  if (!isBetweenAngles(angle2, startAngle, endAngle)) {
    const startX = cx + Math.cos(startAngle) * radius;
    const startY = cy + Math.sin(startAngle) * radius;
    const endX = cx + Math.cos(startAngle) * radius;
    const endY = cy + Math.sin(startAngle) * radius;
    return Math.min(best, pointsDistanceSquared(x, y, startX, startY), pointsDistanceSquared(x, y, endX, endY));
  }
  const distToArc = radius - Math.sqrt(pointsDistanceSquared(x, y, cx, cy));
  return Math.min(best, distToArc * distToArc);
}

// packages/ag-charts-core/src/geometry/fill.ts
function isGradientFill(fill) {
  return isObject(fill) && fill.type == "gradient";
}
function isGradientFillArray(fills) {
  return isArray(fills) && fills.every(isGradientFill);
}
function isStringFillArray(fills) {
  return isArray(fills) && fills.every((fill) => typeof fill === "string");
}
function isPatternFill(fill) {
  return fill !== null && isObject(fill) && fill.type == "pattern";
}
function isImageFill(fill) {
  return fill !== null && isObject(fill) && fill.type == "image";
}
function isGradientOrPatternFill(fill) {
  return isGradientFill(fill) || isPatternFill(fill);
}

// packages/ag-charts-core/src/geometry/lineInterpolation.ts
function spanRange(span) {
  switch (span.type) {
    case "linear":
    case "step":
    case "multi-line":
      return [
        { x: span.x0, y: span.y0 },
        { x: span.x1, y: span.y1 }
      ];
    case "cubic":
      return [
        { x: span.cp0x, y: span.cp0y },
        { x: span.cp3x, y: span.cp3y }
      ];
  }
}
function spanRangeNormalized(span) {
  const range2 = spanRange(span);
  if (range2[0].x > range2[1].x) {
    range2.reverse();
  }
  return range2;
}
function collapseSpanToPoint(span, point) {
  const { x, y } = point;
  switch (span.type) {
    case "linear":
      return {
        type: "linear",
        moveTo: span.moveTo,
        x0: x,
        y0: y,
        x1: x,
        y1: y
      };
    case "step":
      return {
        type: "step",
        moveTo: span.moveTo,
        x0: x,
        y0: y,
        x1: x,
        y1: y,
        stepX: x
      };
    case "cubic":
      return {
        type: "cubic",
        moveTo: span.moveTo,
        cp0x: x,
        cp0y: y,
        cp1x: x,
        cp1y: y,
        cp2x: x,
        cp2y: y,
        cp3x: x,
        cp3y: y
      };
    case "multi-line":
      return {
        type: "multi-line",
        moveTo: span.moveTo,
        x0: x,
        y0: y,
        x1: x,
        y1: y,
        midPoints: span.midPoints.map(() => ({ x, y }))
      };
  }
}
function rescaleSpan(span, nextStart, nextEnd) {
  const [prevStart, prevEnd] = spanRange(span);
  const widthScale = prevEnd.x === prevStart.x ? 0 : (nextEnd.x - nextStart.x) / (prevEnd.x - prevStart.x);
  const heightScale = prevEnd.y === prevStart.y ? 0 : (nextEnd.y - nextStart.y) / (prevEnd.y - prevStart.y);
  switch (span.type) {
    case "linear":
      return {
        type: "linear",
        moveTo: span.moveTo,
        x0: nextStart.x,
        y0: nextStart.y,
        x1: nextEnd.x,
        y1: nextEnd.y
      };
    case "cubic":
      return {
        type: "cubic",
        moveTo: span.moveTo,
        cp0x: nextStart.x,
        cp0y: nextStart.y,
        cp1x: nextEnd.x - (span.cp2x - prevStart.x) * widthScale,
        cp1y: nextEnd.y - (span.cp2y - prevStart.y) * heightScale,
        cp2x: nextEnd.x - (span.cp1x - prevStart.x) * widthScale,
        cp2y: nextEnd.y - (span.cp1y - prevStart.y) * heightScale,
        cp3x: nextEnd.x,
        cp3y: nextEnd.y
      };
    case "step":
      return {
        type: "step",
        moveTo: span.moveTo,
        x0: nextStart.x,
        y0: nextStart.y,
        x1: nextEnd.x,
        y1: nextEnd.y,
        stepX: nextEnd.x - (span.stepX - prevStart.x) * widthScale
      };
    case "multi-line":
      return {
        type: "multi-line",
        moveTo: span.moveTo,
        x0: nextStart.x,
        y0: nextStart.y,
        x1: nextEnd.x,
        y1: nextEnd.y,
        midPoints: span.midPoints.map((midPoint) => ({
          x: nextStart.x + (midPoint.x - prevStart.x) * widthScale,
          y: nextStart.y + (midPoint.y - prevStart.y) * heightScale
        }))
      };
  }
}
function clipSpanX(span, x0, x1) {
  const { moveTo } = span;
  const [start2, end3] = spanRangeNormalized(span);
  const { x: spanX0, y: spanY0 } = start2;
  const { x: spanX1, y: spanY1 } = end3;
  if (x1 < spanX0) {
    return rescaleSpan(span, start2, start2);
  } else if (x0 > spanX1) {
    return rescaleSpan(span, end3, end3);
  }
  switch (span.type) {
    case "linear": {
      const m = spanY0 === spanY1 ? void 0 : (spanY1 - spanY0) / (spanX1 - spanX0);
      const y0 = m == null ? spanY0 : m * (x0 - spanX0) + spanY0;
      const y1 = m == null ? spanY0 : m * (x1 - spanX0) + spanY0;
      return { type: "linear", moveTo, x0, y0, x1, y1 };
    }
    case "step":
      if (x1 <= span.stepX) {
        const y = span.y0;
        return { type: "step", moveTo, x0, y0: y, x1, y1: y, stepX: x1 };
      } else if (x0 >= span.stepX) {
        const y = span.y1;
        return { type: "step", moveTo, x0, y0: y, x1, y1: y, stepX: x0 };
      } else {
        const { y0, y1, stepX } = span;
        return { type: "step", moveTo, x0, y0, x1, y1, stepX };
      }
    case "cubic": {
      const t0 = solveBezier(span.cp0x, span.cp1x, span.cp2x, span.cp3x, x0);
      let [_unused, bezier] = splitBezier2D(
        span.cp0x,
        span.cp0y,
        span.cp1x,
        span.cp1y,
        span.cp2x,
        span.cp2y,
        span.cp3x,
        span.cp3y,
        t0
      );
      const t1 = solveBezier(bezier[0].x, bezier[1].x, bezier[2].x, bezier[3].x, x1);
      [bezier, _unused] = splitBezier2D(
        bezier[0].x,
        bezier[0].y,
        bezier[1].x,
        bezier[1].y,
        bezier[2].x,
        bezier[2].y,
        bezier[3].x,
        bezier[3].y,
        t1
      );
      return {
        type: "cubic",
        moveTo,
        cp0x: bezier[0].x,
        cp0y: bezier[0].y,
        cp1x: bezier[1].x,
        cp1y: bezier[1].y,
        cp2x: bezier[2].x,
        cp2y: bezier[2].y,
        cp3x: bezier[3].x,
        cp3y: bezier[3].y
      };
    }
    case "multi-line": {
      const { midPoints } = span;
      const midPointStartIndex = midPoints.findLastIndex((midPoint) => midPoint.x <= x0);
      let midPointEndIndex = midPoints.findIndex((midPoint) => midPoint.x >= x1);
      if (midPointEndIndex === -1)
        midPointEndIndex = midPoints.length;
      const startPoint = midPointStartIndex >= 0 ? midPoints[midPointStartIndex] : void 0;
      const startX = startPoint?.x ?? spanX0;
      const startY = startPoint?.y ?? spanY0;
      const endPoint = midPointEndIndex < midPoints.length ? midPoints[midPointEndIndex] : void 0;
      const endX = endPoint?.x ?? spanX1;
      const endY = endPoint?.y ?? spanY1;
      const m = startY === endY ? void 0 : (endY - startY) / (endX - startX);
      const y0 = m == null ? startY : m * (startX - spanX0) + startY;
      const y1 = m == null ? startY : m * (endX - spanX0) + startY;
      return {
        type: "multi-line",
        moveTo,
        x0,
        y0,
        x1,
        y1,
        midPoints: midPoints.slice(Math.max(midPointStartIndex, 0), midPointEndIndex)
      };
    }
  }
}
var SpanJoin = /* @__PURE__ */ /*#__PURE__*/ ((SpanJoin2) => {
  SpanJoin2[SpanJoin2["MoveTo"] = 0] = "MoveTo";
  SpanJoin2[SpanJoin2["LineTo"] = 1] = "LineTo";
  SpanJoin2[SpanJoin2["Skip"] = 2] = "Skip";
  return SpanJoin2;
})(SpanJoin || {});
function linearPoints(points) {
  const spans = [];
  let i = 0;
  let x0 = Number.NaN;
  let y0 = Number.NaN;
  for (const { x: x1, y: y1 } of points) {
    if (i > 0) {
      const moveTo = i === 1;
      spans.push({ type: "linear", moveTo, x0, y0, x1, y1 });
    }
    i += 1;
    x0 = x1;
    y0 = y1;
  }
  return spans;
}
var lineSteps = {
  start: 0,
  middle: 0.5,
  end: 1
};
function stepPoints(points, position) {
  const spans = [];
  let i = 0;
  let x0 = Number.NaN;
  let y0 = Number.NaN;
  const p0 = typeof position === "number" ? position : lineSteps[position];
  for (const { x: x1, y: y1 } of points) {
    if (i > 0) {
      const moveTo = i === 1;
      const stepX = x0 + (x1 - x0) * p0;
      spans.push({ type: "step", moveTo, x0, y0, x1, y1, stepX });
    }
    i += 1;
    x0 = x1;
    y0 = y1;
  }
  return spans;
}
function smoothPoints(iPoints, tension) {
  const points = Array.isArray(iPoints) ? iPoints : Array.from(iPoints);
  if (points.length <= 1)
    return [];
  const flatnessRatio = 0.05;
  const gradients = points.map((c, i) => {
    const p = i === 0 ? c : points[i - 1];
    const n = i === points.length - 1 ? c : points[i + 1];
    const isTerminalPoint = i === 0 || i === points.length - 1;
    if (Math.sign(p.y - c.y) === Math.sign(n.y - c.y)) {
      return 0;
    }
    if (!isTerminalPoint) {
      const range2 = Math.abs(p.y - n.y);
      const prevRatio = Math.abs(c.y - p.y) / range2;
      const nextRatio = Math.abs(c.y - n.y) / range2;
      if (prevRatio <= flatnessRatio || 1 - prevRatio <= flatnessRatio || nextRatio <= flatnessRatio || 1 - nextRatio <= flatnessRatio) {
        return 0;
      }
    }
    return (n.y - p.y) / (n.x - p.x);
  });
  if (gradients[1] === 0) {
    gradients[0] *= 2;
  }
  if (gradients.at(-2) === 0) {
    gradients[gradients.length - 1] *= 2;
  }
  const spans = [];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const prevM = gradients[i - 1];
    const cur = points[i];
    const curM = gradients[i];
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    let dcp1x = dx * tension / 3;
    let dcp1y = dx * prevM * tension / 3;
    let dcp2x = dx * tension / 3;
    let dcp2y = dx * curM * tension / 3;
    if (curM === 0 && Math.abs(dcp1y) > Math.abs(dy)) {
      dcp1x *= Math.abs(dy / dcp1y);
      dcp1y = Math.sign(dcp1y) * Math.abs(dy);
    }
    if (prevM === 0 && Math.abs(dcp2y) > Math.abs(dy)) {
      dcp2x *= Math.abs(dy / dcp2y);
      dcp2y = Math.sign(dcp2y) * Math.abs(dy);
    }
    spans.push({
      type: "cubic",
      moveTo: i === 1,
      cp0x: prev.x,
      cp0y: prev.y,
      cp1x: prev.x + dcp1x,
      cp1y: prev.y + dcp1y,
      cp2x: cur.x - dcp2x,
      cp2y: cur.y - dcp2y,
      cp3x: cur.x,
      cp3y: cur.y
    });
  }
  return spans;
}

// packages/ag-charts-core/src/geometry/vector4.ts
var vector4_exports = {};
__export(vector4_exports, {
  bottomCenter: () => bottomCenter,
  center: () => center,
  clone: () => clone,
  collides: () => collides,
  end: () => end,
  from: () => from,
  height: () => height,
  normalise: () => normalise,
  origin: () => origin,
  round: () => round,
  start: () => start,
  topCenter: () => topCenter,
  width: () => width
});
function start(a) {
  return { x: a.x1, y: a.y1 };
}
function end(a) {
  return { x: a.x2, y: a.y2 };
}
function topCenter(a) {
  return { x: (a.x1 + a.x2) / 2, y: Math.min(a.y1, a.y2) };
}
function center(a) {
  return { x: (a.x1 + a.x2) / 2, y: (a.y1 + a.y2) / 2 };
}
function bottomCenter(a) {
  return { x: (a.x1 + a.x2) / 2, y: Math.max(a.y1, a.y2) };
}
function width(a) {
  return Math.abs(a.x2 - a.x1);
}
function height(a) {
  return Math.abs(a.y2 - a.y1);
}
function round(a) {
  return { x1: Math.round(a.x1), y1: Math.round(a.y1), x2: Math.round(a.x2), y2: Math.round(a.y2) };
}
function clone(a) {
  return { x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2 };
}
function collides(a, b) {
  const an = normalise(a);
  const bn = normalise(b);
  return an.x1 <= bn.x2 && an.x2 >= bn.x1 && an.y1 <= bn.y2 && an.y2 >= bn.y1;
}
function normalise(a) {
  return {
    x1: Math.min(a.x1, a.x2),
    x2: Math.max(a.x1, a.x2),
    y1: Math.min(a.y1, a.y2),
    y2: Math.max(a.y1, a.y2)
  };
}
function from(a, b, c, d) {
  if (typeof a === "number") {
    return { x1: a, y1: b, x2: c, y2: d };
  }
  if ("width" in a) {
    return normalise({
      x1: a.x,
      y1: a.y,
      x2: a.x + a.width,
      y2: a.y + a.height
    });
  }
  throw new Error(`Values can not be converted into a vector4: [${JSON.stringify(a)}] [${b}] [${c}] [${d}]`);
}
function origin() {
  return { x1: 0, y1: 0, x2: 0, y2: 0 };
}

// packages/ag-charts-core/src/geometry/panToBBox.ts
var PanToBBoxScalingModeEnum = /* @__PURE__ */ /*#__PURE__*/ ((PanToBBoxScalingModeEnum2) => {
  PanToBBoxScalingModeEnum2[PanToBBoxScalingModeEnum2["None"] = 0] = "None";
  PanToBBoxScalingModeEnum2[PanToBBoxScalingModeEnum2["WhenViewportTooSmallScaleXYProportionally"] = 1] = "WhenViewportTooSmallScaleXYProportionally";
  PanToBBoxScalingModeEnum2[PanToBBoxScalingModeEnum2["WhenViewportTooSmallScaleXYDisproportionally"] = 2] = "WhenViewportTooSmallScaleXYDisproportionally";
  return PanToBBoxScalingModeEnum2;
})(PanToBBoxScalingModeEnum || {});
function normalize(screenMin, min, screenMax, max, target) {
  return min + (max - min) * ((target - screenMin) / (screenMax - screenMin));
}
function unnormalize(screenMin, min, screenMax, max, ratio2) {
  return screenMin + (ratio2 - min) * ((screenMax - screenMin) / (max - min));
}
function calcWorldAxis(viewportMin, viewportMax, ratio2) {
  return [
    unnormalize(viewportMin, ratio2.min, viewportMax, ratio2.max, 0),
    unnormalize(viewportMin, ratio2.min, viewportMax, ratio2.max, 1)
  ];
}
function calcWorldVec4(viewport, ratioX, ratioY) {
  const [x1, x2] = calcWorldAxis(viewport.x1, viewport.x2, ratioX);
  const [y1, y2] = calcWorldAxis(viewport.y1, viewport.y2, ratioY);
  return { x1, x2, y1, y2 };
}
function calcNeedsScaling(viewportBBox, targetBBox) {
  const x = targetBBox.width > viewportBBox.width;
  const y = targetBBox.height > viewportBBox.height;
  return { x, y };
}
function panAxisUnnormalized(worldMin, worldMax, viewportMin, viewportMax, targetMin, targetMax) {
  if (viewportMin <= targetMin && targetMax <= viewportMax)
    return viewportMin;
  const minDiff = targetMin - viewportMin;
  const maxDiff = targetMax - viewportMax;
  const diff = Math.abs(minDiff) < Math.abs(maxDiff) ? minDiff : maxDiff;
  return clamp(worldMin, viewportMin + diff, worldMax);
}
function panAxesUnnormalized(viewport, target, ratioX, ratioY) {
  const world = calcWorldVec4(viewport, ratioX, ratioY);
  return {
    x: panAxisUnnormalized(world.x1, world.x2, viewport.x1, viewport.x2, target.x1, target.x2),
    y: panAxisUnnormalized(world.y1, world.y2, viewport.y1, viewport.y2, target.y1, target.y2)
  };
}
function flipTargetY(viewportBBox, targetBBox) {
  return {
    x: targetBBox.x,
    y: 2 * viewportBBox.y + viewportBBox.height - targetBBox.y - targetBBox.height,
    width: targetBBox.width,
    height: targetBBox.height
  };
}
function calcPanToBBoxRatios(scalingMode, viewportBBox, ratios, screenTargetBBox) {
  const targetBBox = flipTargetY(viewportBBox, screenTargetBBox);
  switch (scalingMode) {
    case 0 /* None */:
      return calcPanToBBoxRatiosNoScale(viewportBBox, ratios, targetBBox);
    case 1 /* WhenViewportTooSmallScaleXYProportionally */:
      return calcPanToBBoxRatiosScaleProportionally(viewportBBox, ratios, targetBBox);
    case 2 /* WhenViewportTooSmallScaleXYDisproportionally */:
      return calcPanToBBoxRatiosScaleDisproportionally(viewportBBox, ratios, targetBBox);
    default:
      return scalingMode;
  }
}
function calcPanToBBoxRatiosWithScaling(assignToViewport, viewportBBox, ratios, targetBBox) {
  const { x: ratioX = { min: 0, max: 1 }, y: ratioY = { min: 0, max: 1 } } = ratios;
  const target = from(targetBBox);
  const viewport = from(viewportBBox);
  const pan = panAxesUnnormalized(viewport, target, ratioX, ratioY);
  const result = {
    x: assignToViewport.x ? {
      min: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, viewport.x1),
      max: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, viewport.x2)
    } : {
      min: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, pan.x),
      max: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, pan.x + viewportBBox.width)
    },
    y: assignToViewport.y ? {
      min: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, viewport.y1),
      max: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, viewport.y2)
    } : {
      min: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, pan.y),
      max: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, pan.y + viewportBBox.height)
    }
  };
  const diffX = result.x.max - result.x.min;
  const diffY = result.y.max - result.y.min;
  result.x.min = clamp(0, result.x.min, 1 - diffX);
  result.x.max = result.x.min + diffX;
  result.y.min = clamp(0, result.y.min, 1 - diffY);
  result.y.max = result.y.min + diffY;
  return result;
}
function calcPanToBBoxRatiosNoScale(viewportBBox, ratios, targetBBox) {
  return calcPanToBBoxRatiosWithScaling({ x: false, y: false }, viewportBBox, ratios, targetBBox);
}
function calcPanToBBoxRatiosScaleDisproportionally(viewportBBox, ratios, targetBBox) {
  const scaling = calcNeedsScaling(viewportBBox, targetBBox);
  return calcPanToBBoxRatiosWithScaling(scaling, viewportBBox, ratios, targetBBox);
}
function calcPanToBBoxRatiosScaleProportionally(viewportBBox, ratios, targetBBox) {
  const scaleRequirements = calcNeedsScaling(viewportBBox, targetBBox);
  if (!scaleRequirements.x && !scaleRequirements.y) {
    return calcPanToBBoxRatiosWithScaling(scaleRequirements, viewportBBox, ratios, targetBBox);
  }
  const scaleX = targetBBox.width / viewportBBox.width;
  const scaleY = targetBBox.height / viewportBBox.height;
  const scale = Math.max(scaleX, scaleY);
  const target = from(targetBBox);
  const cx = (target.x1 + target.x2) / 2;
  const cy = (target.y1 + target.y2) / 2;
  const newWidth = viewportBBox.width * scale;
  const newHeight = viewportBBox.height * scale;
  const scaledViewportBBox = {
    x: cx - newWidth / 2,
    y: cy - newHeight / 2,
    width: newWidth,
    height: newHeight
  };
  return calcPanToBBoxRatiosWithScaling({ x: false, y: false }, scaledViewportBBox, ratios, targetBBox);
}

// packages/ag-charts-core/src/geometry/placement.ts
function calculatePlacement(naturalWidth, naturalHeight, container, bounds) {
  let { top, right, bottom, left, width: width2, height: height2 } = bounds;
  if (left != null) {
    if (width2 != null) {
      right = container.width - left + width2;
    } else if (right != null) {
      width2 = container.width - left - right;
    }
  } else if (right != null && width2 != null) {
    left = container.width - right - width2;
  }
  if (top != null) {
    if (height2 != null) {
      bottom = container.height - top - height2;
    } else if (bottom != null) {
      height2 = container.height - bottom - top;
    }
  } else if (bottom != null && height2 != null) {
    top = container.height - bottom - height2;
  }
  if (width2 == null) {
    if (height2 == null) {
      height2 = naturalHeight;
      width2 = naturalWidth;
    } else {
      width2 = Math.ceil(naturalWidth * height2 / naturalHeight);
    }
  } else {
    height2 ?? (height2 = Math.ceil(naturalHeight * width2 / naturalWidth));
  }
  if (left == null) {
    if (right == null) {
      left = Math.floor((container.width - width2) / 2);
    } else {
      left = container.width - right - width2;
    }
  }
  if (top == null) {
    if (bottom == null) {
      top = Math.floor((container.height - height2) / 2);
    } else {
      top = container.height - height2 - bottom;
    }
  }
  return { x: left, y: top, width: width2, height: height2 };
}

// packages/ag-charts-core/src/geometry/scaling.ts
function isContinuousScaling(scaling) {
  return scaling.type === "continuous" || scaling.type === "log";
}
function isCategoryScaling(scaling) {
  return scaling.type === "category";
}
function isUnitTimeCategoryScaling(scaling) {
  return "variant" in scaling && scaling.variant === "unit-time";
}
function isStandardCategoryScaling(scaling) {
  return !("variant" in scaling);
}
function areScalingEqual(a, b) {
  if (a === void 0 || b === void 0) {
    return a !== void 0 || b !== void 0;
  }
  if (isContinuousScaling(a) && isContinuousScaling(b)) {
    return a.type === b.type && arraysEqual(a.domain, b.domain) && arraysEqual(a.range, b.range);
  }
  if (isCategoryScaling(a) && isCategoryScaling(b)) {
    if (isUnitTimeCategoryScaling(a) && isUnitTimeCategoryScaling(b)) {
      return a.firstBandTime === b.firstBandTime && a.lastBandTime === b.lastBandTime && a.bandCount === b.bandCount && a.intervalMs === b.intervalMs && a.inset === b.inset && a.step === b.step;
    }
    if (isStandardCategoryScaling(a) && isStandardCategoryScaling(b)) {
      return a.inset === b.inset && a.step === b.step && arraysEqual(a.domain, b.domain);
    }
    return false;
  }
  return false;
}
function isScaleValid(scale) {
  if (scale == null)
    return false;
  if (scale.type === "category") {
    if (isUnitTimeCategoryScaling(scale)) {
      return Number.isFinite(scale.firstBandTime) && Number.isFinite(scale.lastBandTime) && Number.isFinite(scale.bandCount) && scale.bandCount > 0;
    }
    return scale.domain.every((v) => v != null);
  }
  return scale.domain.every((v) => Number.isFinite(v) || v instanceof Date) && scale.range.every((v) => Number.isFinite(v));
}

// packages/ag-charts-core/src/geometry/vector.ts
var vector_exports = {};
__export(vector_exports, {
  add: () => add,
  angle: () => angle,
  apply: () => apply,
  distance: () => distance,
  distanceSquared: () => distanceSquared,
  equal: () => equal,
  from: () => from2,
  gradient: () => gradient,
  intercept: () => intercept,
  intersectAtX: () => intersectAtX,
  intersectAtY: () => intersectAtY,
  length: () => length,
  lengthSquared: () => lengthSquared,
  multiply: () => multiply,
  normalized: () => normalized,
  origin: () => origin2,
  required: () => required2,
  rotate: () => rotate,
  round: () => round2,
  sub: () => sub
});
function add(a, b) {
  if (typeof b === "number") {
    return { x: a.x + b, y: a.y + b };
  }
  return { x: a.x + b.x, y: a.y + b.y };
}
function sub(a, b) {
  if (typeof b === "number") {
    return { x: a.x - b, y: a.y - b };
  }
  return { x: a.x - b.x, y: a.y - b.y };
}
function multiply(a, b) {
  if (typeof b === "number") {
    return { x: a.x * b, y: a.y * b };
  }
  return { x: a.x * b.x, y: a.y * b.y };
}
function length(a) {
  return Math.hypot(a.x, a.y);
}
function lengthSquared(a) {
  return a.x * a.x + a.y * a.y;
}
function distance(a, b) {
  return length(sub(a, b));
}
function distanceSquared(a, b) {
  return lengthSquared(sub(a, b));
}
function normalized(a) {
  const l = length(a);
  return { x: a.x / l, y: a.y / l };
}
function angle(a, b) {
  if (b == null)
    return Math.atan2(a.y, a.x);
  return Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x);
}
function rotate(a, theta, b = origin2()) {
  const l = length(a);
  return { x: b.x + l * Math.cos(theta), y: b.y + l * Math.sin(theta) };
}
function gradient(a, b, reflection) {
  const dx = b.x - a.x;
  const dy = reflection == null ? b.y - a.y : reflection - b.y - (reflection - a.y);
  return dy / dx;
}
function intercept(a, gradient2, reflection) {
  const y = reflection == null ? a.y : reflection - a.y;
  return y - gradient2 * a.x;
}
function intersectAtY(gradient2, coefficient, y = 0, reflection) {
  return {
    x: gradient2 === Infinity ? Infinity : (y - coefficient) / gradient2,
    y: reflection == null ? y : reflection - y
  };
}
function intersectAtX(gradient2, coefficient, x = 0, reflection) {
  const y = gradient2 === Infinity ? Infinity : gradient2 * x + coefficient;
  return { x, y: reflection == null ? y : reflection - y };
}
function round2(a, decimals = 2) {
  return { x: roundTo(a.x, decimals), y: roundTo(a.y, decimals) };
}
function equal(a, b) {
  return a.x === b.x && a.y === b.y;
}
function from2(a, b) {
  if (typeof a === "number") {
    return { x: a, y: b };
  }
  if ("currentX" in a) {
    return { x: a.currentX, y: a.currentY };
  }
  if ("offsetWidth" in a) {
    return { x: a.offsetWidth, y: a.offsetHeight };
  }
  if ("width" in a) {
    return [
      { x: a.x, y: a.y },
      { x: a.x + a.width, y: a.y + a.height }
    ];
  }
  if ("x1" in a) {
    return [
      { x: a.x1, y: a.y1 },
      { x: a.x2, y: a.y2 }
    ];
  }
  throw new Error(`Values can not be converted into a vector: [${JSON.stringify(a)}] [${b}]`);
}
function apply(a, b) {
  a.x = b.x;
  a.y = b.y;
  return a;
}
function required2(a) {
  return { x: a?.x ?? 0, y: a?.y ?? 0 };
}
function origin2() {
  return { x: 0, y: 0 };
}

// packages/ag-charts-core/src/text/labelMeasure.ts
function placedLabelFit(labelText, font, ctx, policy = ctx.labelFit) {
  if (labelText == null || !ctx.labelStyled && policy == null)
    return void 0;
  return {
    text: labelText,
    policy: policy ?? {},
    font,
    boxPadding: ctx.labelPadding,
    fitOverflow: ctx.labelFitOverflow,
    // A point label's region is the plotting area, which contains it rather than truncating it: the
    // descriptor is here to re-measure under the styled font, not to introduce a new bound.
    boundByRegion: false
  };
}
function measurePlacedLabel(labelText, font, ctx, policy = ctx.labelFit) {
  if (labelText == null) {
    return { text: "", width: 0, height: 0 };
  }
  const { text, fontSize } = fitLabelTextOrOverflowAutoSize(labelText, policy, ctx.labelFitOverflow, font);
  let { width: width2, height: height2 } = fontSize == null && !isArray(text) ? ctx.labelTextMeasurer.measureLines(String(text)) : measureLabelText(text, fontWithSize(font, fontSize));
  width2 += ctx.labelPadding.left + ctx.labelPadding.right;
  height2 += ctx.labelPadding.top + ctx.labelPadding.bottom;
  return { text, width: width2, height: height2, fontSize };
}

// packages/ag-charts-core/src/time/date.ts
function compareDates(a, b) {
  return a.valueOf() - b.valueOf();
}
function deduplicateSortedArray(values) {
  let v0 = Number.NaN;
  const out = [];
  for (const v of values) {
    const v1 = v.valueOf();
    if (v0 !== v1)
      out.push(v);
    v0 = v1;
  }
  return out;
}
function sortAndUniqueDates(values) {
  const sortedValues = values.slice().sort(compareDates);
  return datesSortOrder(sortedValues) == null ? deduplicateSortedArray(sortedValues) : sortedValues;
}
function datesSortOrder(d) {
  if (d.length === 0)
    return 1;
  const sign = Number(d.at(-1)) > Number(d[0]) ? 1 : -1;
  let v0 = -Infinity * sign;
  for (const v of d) {
    const v1 = v.valueOf();
    if (Math.sign(v1 - v0) !== sign)
      return;
    v0 = v1;
  }
  return sign;
}

// packages/ag-charts-core/src/time/iso8601.ts
var ISO_8601 = /^\d{4}-\d{2}-\d{2}(T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?)?$/;
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function readUint(value, start2, length2) {
  let n = 0;
  for (let i = 0; i < length2; i++) {
    n = n * 10 + (value.charCodeAt(start2 + i) - 48);
  }
  return n;
}
function isISO8601(value) {
  if (typeof value !== "string" || !ISO_8601.test(value))
    return false;
  const month = readUint(value, 5, 2);
  if (month < 1 || month > 12)
    return false;
  const year = readUint(value, 0, 4);
  const day = readUint(value, 8, 2);
  const isLeapYear = year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  const maxDay = month === 2 && isLeapYear ? 29 : DAYS_IN_MONTH[month - 1];
  return day >= 1 && day <= maxDay;
}
function coerceIso8601Date(value) {
  return isISO8601(value) ? new Date(value) : value;
}

// packages/ag-charts-core/src/time/ticks.ts
var tInterval = (timeInterval3, step) => ({
  duration: intervalMilliseconds(timeInterval3) * step,
  timeInterval: timeInterval3,
  step
});
var TickIntervals = /*#__PURE__*/ (() => ([
  tInterval({ unit: "second" }, 1),
  tInterval({ unit: "second" }, 5),
  tInterval({ unit: "second" }, 15),
  tInterval({ unit: "second" }, 30),
  tInterval({ unit: "minute" }, 1),
  tInterval({ unit: "minute" }, 5),
  tInterval({ unit: "minute" }, 15),
  tInterval({ unit: "minute" }, 30),
  tInterval({ unit: "hour" }, 1),
  tInterval({ unit: "hour" }, 3),
  tInterval({ unit: "hour" }, 6),
  tInterval({ unit: "hour" }, 12),
  tInterval({ unit: "day" }, 1),
  tInterval({ unit: "day" }, 2),
  tInterval({ unit: "day", step: 7 }, 1),
  tInterval({ unit: "day", step: 7 }, 2),
  tInterval({ unit: "day", step: 7 }, 3),
  tInterval({ unit: "month" }, 1),
  tInterval({ unit: "month" }, 2),
  tInterval({ unit: "month" }, 3),
  tInterval({ unit: "month" }, 4),
  tInterval({ unit: "month" }, 6),
  tInterval({ unit: "year" }, 1)
]))();
var TickMultipliers = [1, 2, 5, 10];
function isCloseToInteger(n, delta3) {
  return Math.abs(Math.round(n) - n) < delta3;
}
function countTicks(d0, d1, step) {
  const extent2 = Math.abs(d1 - d0);
  return extent2 >= step ? Math.abs(d1 - d0) / step + 1 : 1;
}
function createTicks(start2, stop, count, minCount, maxCount, visibleRange) {
  if (start2 === stop)
    return { ticks: [start2], count: 1, firstTickIndex: 0 };
  if (count < 2)
    return { ticks: [start2, stop], count: 2, firstTickIndex: 0 };
  const step = tickStep(start2, stop, count, minCount, maxCount);
  if (!Number.isFinite(step))
    return { ticks: [], count: 0, firstTickIndex: void 0 };
  let d0 = start2;
  let d1 = stop;
  if (!isCloseToInteger(d0 / step, 1e-12)) {
    d0 = Math.ceil(d0 / step) * step;
  }
  if (!isCloseToInteger(d1 / step, 1e-12)) {
    d1 = Math.floor(d1 / step) * step;
  }
  if (visibleRange != null) {
    visibleRange = rescaleVisibleRange(visibleRange, [start2, stop], [d0, d1]);
  }
  const { ticks } = range(d0, d1, step, visibleRange);
  const firstTick = ticks.at(0);
  return {
    ticks,
    count: countTicks(d0, d1, step),
    firstTickIndex: firstTick == null ? void 0 : Math.round((firstTick - d0) / step)
  };
}
var minPrimaryTickRatio = /*#__PURE__*/ (() => (Math.floor(2 * durationWeek / durationMonth * 10) / 10))();
function isPrimaryTickInterval({ timeInterval: timeInterval3, step }) {
  const milliseconds = intervalMilliseconds(timeInterval3) * step;
  const hierarchy = intervalHierarchy(timeInterval3);
  const hierarchyMilliseconds = hierarchy == null ? void 0 : intervalMilliseconds(hierarchy);
  return milliseconds <= (hierarchyMilliseconds ?? Infinity) * minPrimaryTickRatio;
}
function defaultEpoch(timeInterval3, { weekStart }) {
  if (timeInterval3.unit === "day" && timeInterval3.step === 7) {
    return weekStart;
  }
}
function getTickTimeInterval(start2, stop, count, minCount, maxCount, {
  weekStart,
  primaryOnly = false,
  targetInterval
}) {
  if (count <= 0)
    return;
  const target = targetInterval ?? Math.abs(stop - start2) / Math.max(count, 1);
  const i0 = TickIntervals.findLast((t) => (!primaryOnly || isPrimaryTickInterval(t)) && target > t.duration);
  const i1 = TickIntervals.find((t) => (!primaryOnly || isPrimaryTickInterval(t)) && target <= t.duration);
  if (i0 == null) {
    const step2 = Math.max(tickStep(start2, stop, count, minCount, maxCount), 1);
    return { unit: "millisecond", step: step2 };
  } else if (i1 == null) {
    const step2 = targetInterval == null ? tickStep(start2 / durationYear, stop / durationYear, count, minCount, maxCount) : 1;
    return { unit: "year", step: step2 };
  }
  const { timeInterval: timeInterval3, step } = target - i0.duration < i1.duration - target ? i0 : i1;
  return {
    unit: timeInterval3.unit,
    step: intervalStep(timeInterval3) * step,
    epoch: defaultEpoch(timeInterval3, { weekStart })
  };
}
function tickStep(start2, end3, count, minCount = 0, maxCount = Infinity) {
  if (start2 === end3) {
    return clamp(1, minCount, maxCount);
  } else if (count < 1) {
    return Number.NaN;
  }
  const extent2 = Math.abs(end3 - start2);
  const step = 10 ** Math.floor(Math.log10(extent2 / count));
  let m = Number.NaN, minDiff = Infinity, isInBounds = false;
  for (const multiplier of TickMultipliers) {
    const c = Math.ceil(extent2 / (multiplier * step));
    const validBounds = c >= minCount && c <= maxCount;
    if (isInBounds && !validBounds)
      continue;
    const diffCount = Math.abs(c - count);
    if (minDiff > diffCount || isInBounds !== validBounds) {
      isInBounds || (isInBounds = validBounds);
      minDiff = diffCount;
      m = multiplier;
    }
  }
  return m * step;
}
function decimalPlaces(decimal) {
  for (let i = decimal.length - 1; i >= 0; i -= 1) {
    if (decimal[i] !== "0") {
      return i + 1;
    }
  }
  return 0;
}
function tickFormat(ticks, format) {
  const options = parseNumberFormat(format ?? ",f");
  if (options == null)
    return;
  if (options.precision == null || Number.isNaN(options.precision)) {
    if (options.type == null || "eEFgGnprs".includes(options.type)) {
      options.precision = Math.max(
        ...ticks.map((x) => {
          if (!Number.isFinite(x))
            return 0;
          const [integer, decimal] = x.toExponential((options.type == null ? 12 : 6) - 1).split(/[.e]/g);
          return (integer !== "1" && integer !== "-1" ? 1 : 0) + decimalPlaces(decimal) + 1;
        })
      );
    } else if ("f%".includes(options.type)) {
      options.precision = Math.max(
        ...ticks.map((x) => {
          if (!Number.isFinite(x) || x === 0)
            return 0;
          const l = Math.floor(Math.log10(Math.abs(x)));
          const digits = options.type == null ? 12 : 6;
          const decimal = x.toExponential(digits - 1).split(/[.e]/g)[1];
          const decimalLength = decimalPlaces(decimal);
          return Math.max(0, decimalLength - l);
        })
      );
    }
  }
  const formatter2 = createNumberFormatter(options);
  return (n) => formatter2(typeof n === "bigint" ? n : Number(n));
}
function bigIntTickStep(extent2, count) {
  if (extent2.toString(2).length < 4) {
    return BigInt(Math.max(1, Math.round(tickStep(0, Number(extent2), count))));
  }
  const target = extent2 / BigInt(Math.max(1, Math.round(count)));
  let pow10 = 1n;
  while (pow10 * 10n <= target) {
    pow10 *= 10n;
  }
  let best = pow10;
  let bestDiff = Infinity;
  for (const multiplier of TickMultipliers) {
    const step = BigInt(multiplier) * pow10;
    const ticks = Number(extent2 / step) + 1;
    const diff = Math.abs(ticks - count);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = step;
    }
  }
  return best;
}
function ceilToStep(value, step) {
  const remainder = value % step;
  if (remainder === 0n)
    return value;
  return value > 0n ? value - remainder + step : value - remainder;
}
function floorToStep(value, step) {
  const remainder = value % step;
  if (remainder === 0n)
    return value;
  return value < 0n ? value - remainder - step : value - remainder;
}
function createBigIntTicks(start2, stop, count) {
  if (start2 === stop)
    return [start2];
  if (count < 2)
    return [start2, stop];
  const ascending = start2 < stop;
  const lo = ascending ? start2 : stop;
  const hi = ascending ? stop : start2;
  const step = bigIntTickStep(hi - lo, count);
  if (step <= 0n)
    return [start2, stop];
  const first2 = ceilToStep(lo, step);
  const last = floorToStep(hi, step);
  const ticks = [];
  for (let tick = first2; tick <= last; tick += step) {
    ticks.push(tick);
  }
  return ascending ? ticks : ticks.reverse();
}
function createBigIntBins(start2, stop, count) {
  const lo = start2 < stop ? start2 : stop;
  const hi = start2 < stop ? stop : start2;
  if (lo === hi)
    return [[lo, hi]];
  const segments = BigInt(Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1);
  const span = hi - lo;
  const bins = [];
  for (let i = 0n; i < segments; i += 1n) {
    const a = lo + i * span / segments;
    const b = i === segments - 1n ? hi : lo + (i + 1n) * span / segments;
    bins.push([a, b]);
  }
  return bins;
}
function createBigIntTickBins(start2, stop, count) {
  const lo = start2 < stop ? start2 : stop;
  const hi = start2 < stop ? stop : start2;
  const step = lo === hi ? 0n : bigIntTickStep(hi - lo, count);
  if (step <= 0n)
    return [[lo, hi]];
  const first2 = ceilToStep(lo, step);
  const last = floorToStep(hi, step);
  const bins = [[first2 - step, first2]];
  for (let edge = first2; edge <= last; edge += step) {
    bins.push([edge, edge + step]);
  }
  return bins;
}
function niceBigIntDomain(start2, stop, count) {
  if (start2 === stop)
    return [start2, stop];
  const ascending = start2 < stop;
  const lo = ascending ? start2 : stop;
  const hi = ascending ? stop : start2;
  const step = bigIntTickStep(hi - lo, count);
  if (step <= 0n)
    return [start2, stop];
  const niceLo = floorToStep(lo, step);
  const niceHi = ceilToStep(hi, step);
  return ascending ? [niceLo, niceHi] : [niceHi, niceLo];
}
function range(start2, end3, step, visibleRange) {
  if (!Number.isFinite(step) || step <= 0) {
    return { ticks: [], count: 0, firstTickIndex: void 0 };
  } else if (start2 === end3) {
    return { ticks: [start2], count: 1, firstTickIndex: 0 };
  }
  const f = 10 ** countFractionDigits(step);
  const d0 = Math.min(start2, end3);
  const d1 = Math.max(start2, end3);
  let vd0;
  let vd1;
  if (visibleRange != null && (visibleRange[0] !== 0 || visibleRange[1] !== 1)) {
    const rangeExtent = end3 - start2;
    const adjustedStart = start2 + rangeExtent * visibleRange[0];
    const adjustedEnd = end3 - rangeExtent * (1 - visibleRange[1]);
    vd0 = Math.min(adjustedStart, adjustedEnd);
    vd1 = Math.max(adjustedStart, adjustedEnd);
  } else {
    vd0 = d0;
    vd1 = d1;
  }
  vd0 = Math.floor(vd0 * f) / f;
  vd1 = Math.ceil(vd1 * f) / f;
  const ticks = [];
  for (let i = 0; ; i += 1) {
    const p = Math.round((d0 + step * i) * f) / f;
    if (p > d1)
      break;
    if (p >= vd0 && p <= vd1) {
      ticks.push(p);
    }
  }
  const firstTick = ticks.at(0);
  return {
    ticks,
    count: countTicks(d0, d1, step),
    firstTickIndex: firstTick == null ? void 0 : Math.round((firstTick - d0) / step)
  };
}
function isDenseInterval(count, availableRange, logger) {
  if (count >= availableRange) {
    logger?.warnOnce(
      `the configured interval results in more than 1 item per pixel, ignoring. Supply a larger interval or omit this configuration`
    );
    return true;
  }
  return false;
}
function niceTicksDomain(start2, end3) {
  const extent2 = Math.abs(end3 - start2);
  const step = 10 ** Math.floor(Math.log10(extent2));
  let minError = Infinity, ticks = [start2, end3];
  for (const multiplier of TickMultipliers) {
    const m = multiplier * step;
    const d0 = Math.floor(start2 / m) * m;
    const d1 = Math.ceil(end3 / m) * m;
    const error2 = 1 - extent2 / Math.abs(d1 - d0);
    if (minError > error2) {
      minError = error2;
      ticks = [d0, d1];
    }
  }
  return ticks;
}
function estimateTickCount(rangeExtent, zoomExtent, minSpacing, maxSpacing, defaultTickCount, defaultMinSpacing) {
  if (rangeExtent <= 0) {
    return { minTickCount: 0, maxTickCount: 0, tickCount: 0 };
  }
  defaultMinSpacing = Math.max(defaultMinSpacing, rangeExtent / (defaultTickCount + 1));
  minSpacing ?? (minSpacing = defaultMinSpacing);
  maxSpacing ?? (maxSpacing = rangeExtent);
  if (minSpacing > maxSpacing) {
    if (minSpacing === defaultMinSpacing) {
      minSpacing = maxSpacing;
    } else {
      maxSpacing = minSpacing;
    }
  }
  minSpacing = Math.max(minSpacing, 1);
  const maxTickCount = Math.max(1, Math.floor(rangeExtent / (zoomExtent * minSpacing)));
  const minTickCount = Math.min(maxTickCount, Math.ceil(rangeExtent / (zoomExtent * maxSpacing)));
  const tickCount = clamp(minTickCount, Math.floor(defaultTickCount / zoomExtent), maxTickCount);
  return { minTickCount, maxTickCount, tickCount };
}

// packages/ag-charts-core/src/time/timeFormat.ts
var CONSTANTS = {
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: [
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
  ],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
};
function dayOfYear(date2, startOfYear = new Date(date2.getFullYear(), 0, 1)) {
  const startOffset = date2.getTimezoneOffset() - startOfYear.getTimezoneOffset();
  const timeDiff = date2.getTime() - startOfYear.getTime() + startOffset * 6e4;
  const timeOneDay = 36e5 * 24;
  return Math.floor(timeDiff / timeOneDay);
}
function weekOfYear(date2, startDay) {
  const startOfYear = new Date(date2.getFullYear(), 0, 1);
  const startOfYearDay = startOfYear.getDay();
  const firstWeekStartOffset = (startDay - startOfYearDay + 7) % 7;
  const startOffset = new Date(date2.getFullYear(), 0, firstWeekStartOffset + 1);
  if (startOffset <= date2) {
    return Math.floor(dayOfYear(date2, startOffset) / 7) + 1;
  }
  return 0;
}
var SUNDAY = 0;
var MONDAY = 1;
var THURSDAY = 4;
function isoWeekOfYear(date2, year = date2.getFullYear()) {
  const firstOfYear = new Date(year, 0, 1);
  const firstOfYearDay = firstOfYear.getDay();
  const firstThursdayOffset = (THURSDAY - firstOfYearDay + 7) % 7;
  const startOffset = new Date(year, 0, firstThursdayOffset - (THURSDAY - MONDAY) + 1);
  if (startOffset <= date2) {
    return Math.floor(dayOfYear(date2, startOffset) / 7) + 1;
  }
  return isoWeekOfYear(date2, year - 1);
}
function timezone(date2) {
  const offset = date2.getTimezoneOffset();
  const unsignedOffset = Math.abs(offset);
  const sign = offset > 0 ? "-" : "+";
  return `${sign}${pad(Math.floor(unsignedOffset / 60), 2, "0")}${pad(Math.floor(unsignedOffset % 60), 2, "0")}`;
}
var FORMATTERS = {
  a: (d) => CONSTANTS.shortDays[d.getDay()],
  A: (d) => CONSTANTS.days[d.getDay()],
  b: (d) => CONSTANTS.shortMonths[d.getMonth()],
  B: (d) => CONSTANTS.months[d.getMonth()],
  c: "%x, %X",
  d: (d, p) => pad(d.getDate(), 2, p ?? "0"),
  e: "%_d",
  f: (d, p) => pad(d.getMilliseconds() * 1e3, 6, p ?? "0"),
  H: (d, p) => pad(d.getHours(), 2, p ?? "0"),
  I: (d, p) => {
    const hours = d.getHours() % 12;
    return hours === 0 ? "12" : pad(hours, 2, p ?? "0");
  },
  j: (d, p) => pad(dayOfYear(d) + 1, 3, p ?? "0"),
  m: (d, p) => pad(d.getMonth() + 1, 2, p ?? "0"),
  M: (d, p) => pad(d.getMinutes(), 2, p ?? "0"),
  L: (d, p) => pad(d.getMilliseconds(), 3, p ?? "0"),
  p: (d) => d.getHours() < 12 ? "AM" : "PM",
  Q: (d) => String(d.getTime()),
  s: (d) => String(Math.floor(d.getTime() / 1e3)),
  S: (d, p) => pad(d.getSeconds(), 2, p ?? "0"),
  u: (d) => {
    let day = d.getDay();
    if (day < 1)
      day += 7;
    return String(day % 7);
  },
  U: (d, p) => pad(weekOfYear(d, SUNDAY), 2, p ?? "0"),
  V: (d, p) => pad(isoWeekOfYear(d), 2, p ?? "0"),
  w: (d, p) => pad(d.getDay(), 2, p ?? "0"),
  W: (d, p) => pad(weekOfYear(d, MONDAY), 2, p ?? "0"),
  x: "%-m/%-d/%Y",
  X: "%-I:%M:%S %p",
  y: (d, p) => pad(d.getFullYear() % 100, 2, p ?? "0"),
  Y: (d, p) => pad(d.getFullYear(), 4, p ?? "0"),
  Z: (d) => timezone(d),
  "%": () => "%"
};
var PADS = {
  _: " ",
  "0": "0",
  "-": ""
};
function pad(value, size, padChar) {
  const output = String(Math.floor(value));
  if (output.length >= size) {
    return output;
  }
  return `${padChar.repeat(size - output.length)}${output}`;
}
function buildDateFormatter(formatString) {
  const formatParts = [];
  while (formatString.length > 0) {
    let nextEscapeIdx = formatString.indexOf("%");
    if (nextEscapeIdx !== 0) {
      const literalPart = nextEscapeIdx > 0 ? formatString.substring(0, nextEscapeIdx) : formatString;
      formatParts.push(literalPart);
    }
    if (nextEscapeIdx < 0)
      break;
    const maybePadSpecifier = formatString[nextEscapeIdx + 1];
    const maybePad = PADS[maybePadSpecifier];
    if (maybePad != null) {
      nextEscapeIdx++;
    }
    const maybeFormatterSpecifier = formatString[nextEscapeIdx + 1];
    const maybeFormatter = FORMATTERS[maybeFormatterSpecifier];
    if (typeof maybeFormatter === "function") {
      formatParts.push([maybeFormatter, maybePad]);
    } else if (typeof maybeFormatter === "string") {
      const formatter2 = buildDateFormatter(maybeFormatter);
      formatParts.push([formatter2, maybePad]);
    } else {
      formatParts.push(`${maybePad ?? ""}${maybeFormatterSpecifier}`);
    }
    formatString = formatString.substring(nextEscapeIdx + 2);
  }
  return (dateTime) => {
    const dateTimeAsDate = typeof dateTime === "number" ? new Date(dateTime) : dateTime;
    return formatParts.map((c) => typeof c === "string" ? c : c[0](dateTimeAsDate, c[1])).join("");
  };
}

// packages/ag-charts-core/src/time/timeFormatUtil.ts
var defaultTimeFormats = {
  millisecond: "%H:%M:%S.%L",
  second: "%H:%M:%S",
  minute: "%H:%M",
  hour: "%H:%M",
  day: "%e",
  month: "%b",
  year: "%Y"
};
var hardCodedTimeFormats = {
  millisecond: "%Y %b %e %H:%M:%S.%L",
  second: "%Y %b %e %H:%M:%S",
  minute: "%Y %b %e %H:%M",
  hour: "%Y %b %e %H:%M",
  day: "%Y %b %e",
  month: "%Y %b",
  year: "%Y"
};
var FORMAT_ORDERS = {
  year: 0,
  month: 1,
  day: 2,
  hour: 3,
  minute: 4,
  second: 5,
  millisecond: 6
};
var MILLISECOND_FORMAT = /%[-_0]?L/;
var SECOND_FORMAT = /%[-_0]?S/;
var MINUTE_FORMAT = /%[-_0]?M/;
var HOUR_FORMAT = /%[-_0]?[HI]/;
var DAY_FORMAT = /^%[-_0]?[de]$/;
var MONTH_FORMAT = /^%[-_0]?[Bbm]$/;
var YEAR_FORMAT = /^%[-_0]?[Yy]$/;
function deriveTimeSpecifier(format, unit, truncateDate) {
  if (typeof format === "string")
    return format;
  format ?? (format = defaultTimeFormats);
  const {
    millisecond = defaultTimeFormats.millisecond,
    second = defaultTimeFormats.second,
    minute = defaultTimeFormats.minute,
    hour = defaultTimeFormats.hour,
    day = defaultTimeFormats.day,
    month = defaultTimeFormats.month,
    year = defaultTimeFormats.year
  } = format;
  const formatOrder = FORMAT_ORDERS[unit];
  const hardcodedTimeFormat = hardCodedTimeFormats[unit];
  const truncationOrder = truncateDate == null ? -1 : FORMAT_ORDERS[truncateDate];
  if (truncationOrder < FORMAT_ORDERS.year && formatOrder >= FORMAT_ORDERS.year && !YEAR_FORMAT.test(year) || truncationOrder < FORMAT_ORDERS.month && formatOrder >= FORMAT_ORDERS.month && !MONTH_FORMAT.test(month) || truncationOrder < FORMAT_ORDERS.day && formatOrder >= FORMAT_ORDERS.day && !DAY_FORMAT.test(day)) {
    return hardcodedTimeFormat;
  }
  let timeFormat;
  switch (unit) {
    case "year":
      return year;
    case "month":
      return truncationOrder < FORMAT_ORDERS.year ? `${month} ${year}` : month;
    case "day":
      return truncationOrder < FORMAT_ORDERS.year ? `${month} ${day} ${year}` : `${month} ${day}`;
    case "hour":
      timeFormat = hour;
      break;
    case "minute":
      timeFormat = minute;
      break;
    case "second":
      timeFormat = second;
      break;
    case "millisecond":
      timeFormat = millisecond;
      break;
    default:
      return hardcodedTimeFormat;
  }
  if (formatOrder >= FORMAT_ORDERS.hour && !HOUR_FORMAT.test(timeFormat) || formatOrder >= FORMAT_ORDERS.minute && !MINUTE_FORMAT.test(timeFormat) || formatOrder >= FORMAT_ORDERS.second && !SECOND_FORMAT.test(timeFormat) || formatOrder >= FORMAT_ORDERS.millisecond && !MILLISECOND_FORMAT.test(timeFormat)) {
    return hardcodedTimeFormat;
  }
  let dateFormat;
  if (truncationOrder < FORMAT_ORDERS.year) {
    dateFormat = `${month} ${day} ${year}`;
  } else if (truncationOrder < FORMAT_ORDERS.month) {
    dateFormat = `${month} ${day}`;
  }
  return dateFormat == null || dateFormat === "" ? timeFormat : `${timeFormat} ${dateFormat}`;
}

// packages/ag-charts-core/src/time/timeInterop.ts
function createTimeInterval(unit, step, epoch, utc) {
  return {
    unit,
    step,
    epoch,
    utc,
    every(count) {
      return createTimeInterval(this.unit, (this.step ?? 1) * count, this.epoch, this.utc);
    }
  };
}
var cachedInstances = {};
function getTimeInterval(unit, step = 1, epoch, utc = false) {
  warnOnce("time import is deprecated, use object notation instead");
  const key = `${unit}:${step}:${epoch?.getTime() ?? 0}:${utc}`;
  let instance = cachedInstances[key];
  if (instance == null) {
    instance = createTimeInterval(unit, step, epoch, utc);
    cachedInstances[key] = instance;
  }
  return instance;
}
var time = {
  get millisecond() {
    return getTimeInterval("millisecond");
  },
  get second() {
    return getTimeInterval("second");
  },
  get minute() {
    return getTimeInterval("minute");
  },
  get hour() {
    return getTimeInterval("hour");
  },
  get day() {
    return getTimeInterval("day");
  },
  get monday() {
    return getTimeInterval("day", 7, new Date(1970, 0, 5));
  },
  get tuesday() {
    return getTimeInterval("day", 7, new Date(1970, 0, 6));
  },
  get wednesday() {
    return getTimeInterval("day", 7, new Date(1970, 0, 7));
  },
  get thursday() {
    return getTimeInterval("day", 7, new Date(1970, 0, 1));
  },
  get friday() {
    return getTimeInterval("day", 7, new Date(1970, 0, 2));
  },
  get saturday() {
    return getTimeInterval("day", 7, new Date(1970, 0, 3));
  },
  get sunday() {
    return getTimeInterval("day", 7, new Date(1970, 0, 4));
  },
  get month() {
    return getTimeInterval("month");
  },
  get year() {
    return getTimeInterval("year");
  },
  get utcMillisecond() {
    return getTimeInterval("millisecond", 1, void 0, true);
  },
  get utcSecond() {
    return getTimeInterval("second", 1, void 0, true);
  },
  get utcMinute() {
    return getTimeInterval("minute", 1, void 0, true);
  },
  get utcHour() {
    return getTimeInterval("hour", 1, void 0, true);
  },
  get utcDay() {
    return getTimeInterval("day", 1, void 0, true);
  },
  get utcMonth() {
    return getTimeInterval("month", 1, void 0, true);
  },
  get utcYear() {
    return getTimeInterval("year", 1, void 0, true);
  }
};

// packages/ag-charts-core/src/format/formatUtil.ts
var percentFormatter = /*#__PURE__*/ new Intl.NumberFormat("en-US", { style: "percent" });
function formatValue(value, maximumFractionDigits = 2) {
  if (typeof value === "number") {
    return formatNumber(value, maximumFractionDigits);
  }
  if (typeof value === "bigint") {
    return value.toLocaleString("en-US");
  }
  return typeof value === "string" ? value : String(value ?? "");
}
function formatPercent(value) {
  return percentFormatter.format(value);
}
var numberFormatters = /*#__PURE__*/ (/* @__PURE__ */ new Map()).set(
  2,
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, useGrouping: false })
);
function formatNumber(value, maximumFractionDigits) {
  let formatter2 = numberFormatters.get(maximumFractionDigits);
  if (!formatter2) {
    formatter2 = new Intl.NumberFormat("en-US", { maximumFractionDigits, useGrouping: false });
    numberFormatters.set(maximumFractionDigits, formatter2);
  }
  return formatter2.format(value);
}

// packages/ag-charts-core/src/dom/agDocument.ts
var AgDocument = class {
  constructor(fallbackDocument, fallbackWindow = fallbackDocument.defaultView) {
    this.fallbackDocument = fallbackDocument;
    this.fallbackWindow = fallbackWindow;
    this.windowEvents = /* @__PURE__ */ new Map();
  }
  destroy() {
    this.removeWindowEvents();
    this.container = void 0;
    this.cachedDocument = void 0;
    this.cachedWindow = void 0;
    this.windowEvents.clear();
  }
  get document() {
    return this.cachedDocument ?? this.fallbackDocument;
  }
  get window() {
    return this.cachedWindow ?? this.fallbackWindow;
  }
  getContainer() {
    return this.container;
  }
  setContainer(container) {
    this.container = container;
    if (container == null)
      return;
    const newDoc = container.ownerDocument;
    const newWin = newDoc.defaultView ?? void 0;
    const hasChanged = newDoc !== this.document;
    if (hasChanged) {
      this.removeWindowEvents();
    }
    this.cachedDocument = newDoc;
    this.cachedWindow = newWin;
    if (hasChanged) {
      this.reattachWindowEvents();
    }
  }
  removeWindowEvents() {
    for (const [type, listeners] of this.windowEvents) {
      for (const { listener, options } of listeners) {
        this.window.removeEventListener(type, listener, options);
      }
    }
  }
  reattachWindowEvents() {
    for (const [type, listeners] of this.windowEvents) {
      for (const { listener, options } of listeners) {
        this.window.addEventListener(type, listener, options);
      }
    }
  }
  get devicePixelRatio() {
    return this.window.devicePixelRatio;
  }
  get innerWidth() {
    return this.window.innerWidth;
  }
  get innerHeight() {
    return this.window.innerHeight;
  }
  get navigator() {
    return this.window.navigator;
  }
  getComputedStyle(el, pseudoElt) {
    return this.window.getComputedStyle(el, pseudoElt);
  }
  matchMedia(query) {
    return this.window.matchMedia?.(query);
  }
  getSelection() {
    return this.window.getSelection();
  }
  requestAnimationFrame(callback2) {
    return this.window.requestAnimationFrame(callback2);
  }
  cancelAnimationFrame(handle) {
    this.window.cancelAnimationFrame(handle);
  }
  shimIdleCallback(callback2, options) {
    return setTimeout(() => callback2(null), options?.timeout);
  }
  requestIdleCallback(callback2, options) {
    return typeof this.window.requestIdleCallback === "function" ? this.window.requestIdleCallback(callback2, options) : this.shimIdleCallback(callback2, options);
  }
  cancelIdleCallback(handle) {
    return typeof this.window.cancelIdleCallback === "function" ? this.window.cancelIdleCallback(handle) : clearTimeout(handle);
  }
  attachListener(type, listener, options) {
    let typeListeners = this.windowEvents.get(type);
    if (typeListeners == null) {
      typeListeners = /* @__PURE__ */ new Set();
      this.windowEvents.set(type, typeListeners);
    }
    const cleanup = () => {
      typeListeners?.delete(registration);
      if (typeListeners?.size === 0) {
        this.windowEvents.delete(type);
      }
    };
    const activeListener = isObject(options) && options.once ? (event) => {
      cleanup();
      listener(event);
    } : listener;
    const registration = { listener: activeListener, options };
    typeListeners.add(registration);
    this.window.addEventListener(type, activeListener, options);
    return () => {
      cleanup();
      this.window.removeEventListener(type, activeListener, options);
    };
  }
  get body() {
    return this.document.body;
  }
  get head() {
    return this.document.head;
  }
  isReady() {
    return this.document.readyState === "complete";
  }
  createElement(tagName, className, style) {
    const element2 = this.document.createElement(tagName);
    if (typeof className === "object") {
      style = className;
      className = void 0;
    }
    if (className != null && className !== "") {
      for (const name of className.split(" ")) {
        element2.classList.add(name);
      }
    }
    if (style) {
      Object.assign(element2.style, style);
    }
    return element2;
  }
  createSvgElement(elementName) {
    return this.document.createElementNS("http://www.w3.org/2000/svg", elementName);
  }
  createResizeObserver(callback2) {
    const Ctor = this.window.ResizeObserver;
    if (Ctor == null)
      return;
    return new Ctor(callback2);
  }
  createIntersectionObserver(callback2, options) {
    const Ctor = this.window.IntersectionObserver;
    if (Ctor == null)
      return;
    return new Ctor(callback2, options);
  }
  createMutationObserver(callback2) {
    const Ctor = this.window.MutationObserver;
    if (Ctor == null)
      return;
    return new Ctor(callback2);
  }
};

// packages/ag-charts-core/src/dom/attributeUtil.ts
function booleanParser(value) {
  return value === "true";
}
function numberParser(value) {
  return Number(value);
}
function stringParser(value) {
  return value;
}
var AttributeTypeParsers = {
  role: stringParser,
  "aria-checked": booleanParser,
  "aria-controls": stringParser,
  "aria-describedby": stringParser,
  "aria-disabled": booleanParser,
  "aria-expanded": booleanParser,
  "aria-haspopup": stringParser,
  "aria-hidden": booleanParser,
  "aria-label": stringParser,
  "aria-labelledby": stringParser,
  "aria-live": stringParser,
  "aria-orientation": stringParser,
  "aria-selected": booleanParser,
  "data-focus-override": booleanParser,
  "data-focus-visible-override": booleanParser,
  "data-preventdefault": booleanParser,
  class: stringParser,
  for: stringParser,
  id: stringParser,
  tabindex: numberParser,
  title: stringParser,
  placeholder: stringParser
};
function setAttribute(e, qualifiedName, value) {
  if (value == null || value === "" || value === "") {
    e?.removeAttribute(qualifiedName);
  } else {
    e?.setAttribute(qualifiedName, value.toString());
  }
}
function setAttributes(e, attrs) {
  if (attrs == null)
    return;
  for (const [key, value] of entries(attrs)) {
    if (key === "class")
      continue;
    setAttribute(e, key, value);
  }
}
function getAttribute(e, qualifiedName, defaultValue) {
  if (!isHTMLElement(e))
    return void 0;
  const value = e.getAttribute(qualifiedName);
  if (value === null)
    return defaultValue;
  return AttributeTypeParsers[qualifiedName]?.(value) ?? void 0;
}
function setElementStyle(e, property, value) {
  if (e == null)
    return;
  if (value == null) {
    e.style.removeProperty(property);
  } else {
    e.style.setProperty(property, value.toString());
  }
}
function setElementStyles(e, styles) {
  for (const [key, value] of entries(styles)) {
    setElementStyle(e, key, value);
  }
}

// packages/ag-charts-core/src/dom/browser.ts
var isSafariRegexp = /^((?!chrome|android).)*safari/i;
var safariVersionRegexp = /Version\/(\d+(\.\d+)?)/;
var isChromeRegexp = /Chrome/;
var chromeVersionRegexp = /Chrome\/(\d+)/;
var isEdge = /Edg/;
var isOpera = /OPR/;
function isUnsupportedBrowser() {
  const { userAgent } = getWindow("navigator");
  if (isSafariRegexp.test(userAgent)) {
    const versionExec = safariVersionRegexp.exec(userAgent);
    if (versionExec == null)
      return false;
    const version = Number.parseFloat(versionExec[1]);
    const supported = Math.floor(version) > 16;
    if (!supported) {
      warnOnce(`Unsupported Safari version: ${version}; ${userAgent}`);
    }
    return !supported;
  } else if (isChromeRegexp.test(userAgent) && !isEdge.test(userAgent) && !isOpera.test(userAgent)) {
    const versionExec = chromeVersionRegexp.exec(userAgent);
    if (versionExec == null)
      return false;
    const version = Number.parseInt(versionExec[1], 10);
    const supported = version > 126;
    if (!supported) {
      warnOnce(`Unsupported Chrome version: ${version}; ${userAgent}`);
    }
    return !supported;
  }
  return false;
}

// packages/ag-charts-core/src/dom/domEvents.ts
function attachListener(element2, eventName, handler, options) {
  element2.addEventListener(eventName, handler, options);
  return () => element2.removeEventListener(eventName, handler, options);
}

// packages/ag-charts-core/src/dom/keynavUtil.ts
function addEscapeEventListener(elem, onEscape, keyCodesGetter) {
  return attachListener(elem, "keydown", (event) => {
    const keyCodes = keyCodesGetter?.() ?? ["Escape"];
    if (matchesKey(event, ...keyCodes)) {
      onEscape(event);
    }
  });
}
function addMouseCloseListener(menu, hideCallback) {
  const elWin = menu.ownerDocument.defaultView;
  const removeEvent = attachListener(elWin, "mousedown", (event) => {
    if ([0, 2].includes(event.button) && !containsEvent(menu, event)) {
      hideCallback();
      removeEvent();
    }
  });
  return removeEvent;
}
function addTouchCloseListener(menu, hideCallback) {
  const elWin = menu.ownerDocument.defaultView;
  const removeEvent = attachListener(elWin, "touchstart", (event) => {
    const touches = Array.from(event.targetTouches);
    if (touches.some((touch) => !containsEvent(menu, touch))) {
      hideCallback();
      removeEvent();
    }
  });
  return removeEvent;
}
function containsEvent(container, event) {
  if (isElement(event.target) && event.target.shadowRoot != null) {
    return true;
  }
  return isNode(event.target) && container.contains(event.target);
}
function addOverrideFocusVisibleEventListener(menu, buttons, overrideFocusVisible) {
  const setFocusVisible = (value) => {
    for (const btn of buttons) {
      setAttribute(btn, "data-focus-visible-override", value);
    }
  };
  setFocusVisible(overrideFocusVisible);
  return attachListener(menu, "keydown", () => setFocusVisible(true), { once: true });
}
function hasNoModifiers(event) {
  return !(event.shiftKey || event.altKey || event.ctrlKey || event.metaKey);
}
function matchesKey(event, ...keys) {
  return hasNoModifiers(event) && keys.includes(event.key);
}
function linkTwoButtons(src, dst, key) {
  return attachListener(src, "keydown", (event) => {
    if (matchesKey(event, key)) {
      dst.focus();
    }
  });
}
var PREV_NEXT_KEYS = {
  horizontal: { nextKey: "ArrowRight", prevKey: "ArrowLeft" },
  vertical: { nextKey: "ArrowDown", prevKey: "ArrowUp" }
};
var RTL_PREV_NEXT_HORIZONTAL_KEYS = { nextKey: "ArrowLeft", prevKey: "ArrowRight" };
function getPrevNextKeys(orientation, isRtl) {
  return isRtl && orientation === "horizontal" ? RTL_PREV_NEXT_HORIZONTAL_KEYS : PREV_NEXT_KEYS[orientation];
}
function initRovingTabIndex(opts) {
  const { orientation, buttons, wrapAround = false, onEscape, onFocus, onBlur } = opts;
  const { nextKey, prevKey } = getPrevNextKeys(orientation, isDirectionRtl(buttons[0]));
  const setTabIndices = (event) => {
    if (event.target && "tabIndex" in event.target) {
      for (const b of buttons) {
        b.tabIndex = -1;
      }
      event.target.tabIndex = 0;
    }
  };
  const [c, m] = wrapAround ? [buttons.length, buttons.length] : [0, Infinity];
  const cleanup = new CleanupRegistry();
  for (let i = 0; i < buttons.length; i++) {
    const prev = buttons[(c + i - 1) % m];
    const curr = buttons[i];
    const next = buttons[(c + i + 1) % m];
    cleanup.register(
      attachListener(curr, "focus", setTabIndices),
      onFocus && attachListener(curr, "focus", onFocus),
      onBlur && attachListener(curr, "blur", onBlur),
      onEscape && addEscapeEventListener(curr, onEscape),
      prev != null && linkTwoButtons(curr, prev, prevKey),
      next != null && linkTwoButtons(curr, next, nextKey),
      attachListener(curr, "keydown", (event) => {
        if (matchesKey(event, nextKey, prevKey)) {
          event.preventDefault();
        }
      })
    );
    curr.tabIndex = i === 0 ? 0 : -1;
  }
  return cleanup;
}
function makeAccessibleClickListener(element2, onclick) {
  return (event) => {
    if (element2.ariaDisabled === "true") {
      return event.preventDefault();
    }
    onclick(event);
  };
}
function isButtonClickEvent(event) {
  if ("button" in event) {
    return event.button === 0;
  }
  return hasNoModifiers(event) && (event.code === "Space" || event.key === "Enter");
}
function getLastFocus(sourceEvent) {
  const target = sourceEvent?.target;
  if (isElement(target) && "tabindex" in target.attributes) {
    return target;
  }
  return void 0;
}
function stopPageScrolling(element2) {
  return attachListener(element2, "keydown", (event) => {
    if (event.defaultPrevented)
      return;
    const shouldPrevent = getAttribute(event.target, "data-preventdefault", true);
    if (shouldPrevent && matchesKey(event, "ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp")) {
      event.preventDefault();
    }
  });
}

// packages/ag-charts-core/src/dom/domElements.ts
function createElement(tagName, className, style) {
  const element2 = getDocument().createElement(tagName);
  if (typeof className === "object") {
    style = className;
    className = void 0;
  }
  if (className != null && className !== "") {
    for (const name of className.split(" ")) {
      element2.classList.add(name);
    }
  }
  if (style) {
    Object.assign(element2.style, style);
  }
  return element2;
}
function createStyleElement(styleNonce, agDocument) {
  const element2 = agDocument ? agDocument.createElement("style") : createElement("style");
  if (styleNonce != null) {
    element2.nonce = styleNonce;
  }
  return element2;
}
function createSvgElement(elementName) {
  return getDocument().createElementNS("http://www.w3.org/2000/svg", elementName);
}
function createButton(options, attrs) {
  const button = createElement("button", getClassName("ag-charts-input ag-charts-button", attrs));
  if (options.label === void 0) {
    button.append(createIcon(options.icon));
    button.ariaLabel = options.altText;
  } else {
    button.append(options.label);
  }
  button.addEventListener("click", options.onPress);
  setAttributes(button, attrs);
  return button;
}
function createCheckbox(options, attrs) {
  const checkbox = createElement("input", getClassName("ag-charts-input ag-charts-checkbox", attrs));
  checkbox.type = "checkbox";
  checkbox.checked = options.checked;
  checkbox.addEventListener("change", (event) => options.onChange(checkbox.checked, event));
  checkbox.addEventListener("keydown", (event) => {
    if (isButtonClickEvent(event)) {
      event.preventDefault();
      checkbox.click();
    }
  });
  setAttributes(checkbox, attrs);
  return checkbox;
}
function createSelect(options, attrs) {
  const select = createElement("select", getClassName("ag-charts-input ag-charts-select", attrs));
  select.append(
    ...options.options.map((option) => {
      const optionEl = createElement("option");
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      return optionEl;
    })
  );
  setAttribute(select, "data-preventdefault", false);
  select.value = options.value;
  select.addEventListener("change", (event) => options.onChange(select.value, event));
  setAttributes(select, attrs);
  return select;
}
function createTextArea(options, attrs) {
  const textArea = createElement("textarea", getClassName("ag-charts-input ag-charts-textarea", attrs));
  textArea.value = options.value;
  textArea.addEventListener("input", (event) => options.onChange(textArea.value, event));
  setAttributes(textArea, attrs);
  setAttribute(textArea, "data-preventdefault", false);
  return textArea;
}
function createIcon(icon) {
  const el = createElement("span", `ag-charts-icon ag-charts-icon-${icon}`);
  setAttribute(el, "aria-hidden", true);
  return el;
}
function getClassName(baseClass, attrs) {
  if (attrs == null)
    return baseClass;
  return `${baseClass} ${attrs.class}`;
}

// packages/ag-charts-core/src/dom/domDownload.ts
function downloadUrl(dataUrl, fileName) {
  const body = getDocument("body");
  const element2 = createElement("a", { display: "none" });
  element2.href = dataUrl;
  element2.download = fileName;
  body.appendChild(element2);
  element2.click();
  setTimeout(() => element2.remove());
}

// packages/ag-charts-core/src/dom/guardedElement.ts
var GuardedElement = class _GuardedElement {
  constructor(element2, topTabGuard, bottomTabGuard) {
    this.element = element2;
    this.topTabGuard = topTabGuard;
    this.bottomTabGuard = bottomTabGuard;
    this.cleanup = new CleanupRegistry();
    this.guardTabIndex = 0;
    this.hasFocus = false;
    this.initTabGuard(this.topTabGuard, false);
    this.initTabGuard(this.bottomTabGuard, true);
    this.element.addEventListener("focus", () => this.onFocus(), { capture: true });
    this.element.addEventListener("blur", (ev) => this.onBlur(ev), { capture: true });
  }
  set tabIndex(index) {
    this.guardTabIndex = index;
    if (this.guardTabIndex === 0) {
      this.setGuardIndices(void 0);
    } else if (!this.hasFocus) {
      this.setGuardIndices(this.guardTabIndex);
    }
  }
  destroy() {
    this.cleanup.flush();
  }
  initTabGuard(guard, reverse) {
    this.cleanup.register(attachListener(guard, "focus", () => this.onTab(guard, reverse)));
  }
  setGuardIndices(index) {
    const tabindex = index;
    setAttribute(this.topTabGuard, "tabindex", tabindex);
    setAttribute(this.bottomTabGuard, "tabindex", tabindex);
  }
  onFocus() {
    this.hasFocus = true;
    if (this.guardTabIndex !== 0) {
      this.setGuardIndices(0);
    }
  }
  onBlur({ relatedTarget }) {
    const { topTabGuard: top, bottomTabGuard: bot } = this;
    this.hasFocus = false;
    if (this.guardTabIndex !== 0 && relatedTarget !== top && relatedTarget !== bot) {
      this.setGuardIndices(this.guardTabIndex);
    }
  }
  onTab(guard, reverse) {
    if (this.guardTabIndex !== 0) {
      let focusTarget;
      if (guard.tabIndex === 0) {
        focusTarget = this.findExitTarget(!reverse);
        this.setGuardIndices(this.guardTabIndex);
      } else {
        focusTarget = this.findEnterTarget(reverse);
      }
      focusTarget?.focus();
    }
  }
  static queryFocusable(element2, selectors) {
    const elWin = element2.ownerDocument.defaultView;
    return Array.from(element2.querySelectorAll(selectors)).filter((e) => {
      if (isHTMLElement(e)) {
        const style = elWin.getComputedStyle(e);
        return style.display !== "none" && style.visibility !== "none";
      }
      return false;
    });
  }
  findEnterTarget(reverse) {
    const focusables = _GuardedElement.queryFocusable(this.element, '[tabindex="0"]');
    const index = reverse ? focusables.length - 1 : 0;
    return focusables[index];
  }
  findExitTarget(reverse) {
    const focusables = _GuardedElement.queryFocusable(this.element.ownerDocument.body, "[tabindex]").filter((e) => e.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
    const { before, after } = _GuardedElement.findBeforeAndAfter(focusables, this.guardTabIndex);
    return reverse ? before : after;
  }
  static findBeforeAndAfter(elements, targetTabIndex) {
    let left = 0;
    let right = elements.length - 1;
    let before = void 0;
    let after = void 0;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const currentTabIndex = elements[mid].tabIndex;
      if (currentTabIndex === targetTabIndex) {
        before = mid > 0 ? elements[mid - 1] : void 0;
        after = mid + 1 < elements.length ? elements[mid + 1] : void 0;
        break;
      } else if (currentTabIndex < targetTabIndex) {
        before = elements[mid];
        left = mid + 1;
      } else {
        after = elements[mid];
        right = mid - 1;
      }
    }
    return { before, after };
  }
};

// packages/ag-charts-core/src/dom/perWindowRegistry.ts
var registryDebug = /*#__PURE__*/ create(true, "perf", "opts");
function createPerWindowRegistry(onFirstSubscribe, onLastUnsubscribe, name = "PerWindowRegistry") {
  const entries2 = /* @__PURE__ */ new Map();
  return {
    subscribe(window, subscriber) {
      let entry = entries2.get(window);
      if (entry == null) {
        entry = onFirstSubscribe(window);
        entries2.set(window, entry);
        registryDebug(`[REGISTRY] ${name}`, "first-subscribe");
      } else {
        registryDebug(`[REGISTRY] ${name}`, "shared-subscribe");
      }
      entry.subscribers.add(subscriber);
      return () => {
        const e = entries2.get(window);
        if (e == null)
          return;
        e.subscribers.delete(subscriber);
        if (e.subscribers.size === 0) {
          entries2.delete(window);
          onLastUnsubscribe(e);
          registryDebug(`[REGISTRY] ${name}`, "last-unsubscribe");
        }
      };
    },
    snapshot(entry) {
      return [...entry.subscribers];
    },
    get(window) {
      return entries2.get(window);
    }
  };
}

// packages/ag-charts-core/src/dom/pixelRatioObserver.ts
function attachMediaQuery(entry) {
  const mediaQuery = entry.window.matchMedia?.(`(resolution: ${entry.pixelRatio}dppx)`);
  entry.mediaQuery = mediaQuery;
  mediaQuery?.addEventListener("change", entry.mediaQueryListener);
}
function detachMediaQuery(entry) {
  entry.mediaQuery?.removeEventListener("change", entry.mediaQueryListener);
  entry.mediaQuery = void 0;
}
var sharedRegistry = /*#__PURE__*/ createPerWindowRegistry(
  (window) => {
    const entry = {
      window,
      pixelRatio: window.devicePixelRatio,
      mediaQuery: void 0,
      subscribers: /* @__PURE__ */ new Set(),
      // Named function so the listener is identifiable in flame graphs.
      mediaQueryListener: function onPixelRatioChange(e) {
        if (e.matches)
          return;
        entry.pixelRatio = window.devicePixelRatio;
        detachMediaQuery(entry);
        attachMediaQuery(entry);
        for (const cb of sharedRegistry.snapshot(entry)) {
          cb(entry.pixelRatio);
        }
      }
    };
    attachMediaQuery(entry);
    return entry;
  },
  detachMediaQuery,
  "PixelRatioObserver.shared"
);
function sharedSubscribe(window, currentRatio, cb) {
  const existing = sharedRegistry.get(window);
  if (existing != null && existing.pixelRatio !== currentRatio) {
    existing.pixelRatio = currentRatio;
    detachMediaQuery(existing);
    attachMediaQuery(existing);
  }
  return sharedRegistry.subscribe(window, cb);
}
var PixelRatioObserver = class {
  constructor(agDocument, callback2, shared = false) {
    this.agDocument = agDocument;
    this.callback = callback2;
    this.shared = shared;
    this.devicePixelRatioMediaQuery = void 0;
    this.sharedUnsubscribe = void 0;
    this.devicePixelRatioListener = (e) => {
      if (e.matches)
        return;
      this.devicePixelRatio = this.agDocument.devicePixelRatio;
      this.unregisterDevicePixelRatioListener();
      this.registerDevicePixelRatioListener();
      this.callback(this.pixelRatio);
    };
    this.devicePixelRatio = agDocument.devicePixelRatio;
  }
  get pixelRatio() {
    return this.devicePixelRatio;
  }
  observe() {
    if (this.shared) {
      this.observeShared();
    } else {
      this.registerDevicePixelRatioListener();
    }
  }
  disconnect() {
    if (this.shared) {
      this.sharedUnsubscribe?.();
      this.sharedUnsubscribe = void 0;
    } else {
      this.unregisterDevicePixelRatioListener();
    }
  }
  observeShared() {
    if (this.sharedUnsubscribe != null)
      return;
    const { window } = this.agDocument;
    this.sharedUnsubscribe = sharedSubscribe(window, this.devicePixelRatio, (ratio2) => {
      this.devicePixelRatio = ratio2;
      this.callback(ratio2);
    });
  }
  unregisterDevicePixelRatioListener() {
    this.devicePixelRatioMediaQuery?.removeEventListener("change", this.devicePixelRatioListener);
    this.devicePixelRatioMediaQuery = void 0;
  }
  registerDevicePixelRatioListener() {
    const devicePixelRatioMediaQuery = this.agDocument.matchMedia(`(resolution: ${this.pixelRatio}dppx)`);
    devicePixelRatioMediaQuery?.addEventListener("change", this.devicePixelRatioListener);
    this.devicePixelRatioMediaQuery = devicePixelRatioMediaQuery;
  }
};

// packages/ag-charts-core/src/dom/sanitize.ts
var element = null;
function sanitizeHtml(text) {
  const plainText = toPlainText(text);
  if (plainText === "")
    return "";
  element ?? (element = createElement("div"));
  element.textContent = plainText;
  return element.innerHTML.replaceAll("\n", "<br>");
}

// packages/ag-charts-core/src/dom/sizeMonitor.ts
var SizeMonitor = class {
  constructor(agDocument, mode = "normal") {
    this.elements = /* @__PURE__ */ new Map();
    this.documentReady = false;
    this.queuedObserveRequests = [];
    this.onLoad = () => {
      this.documentReady = true;
      for (const [el, cb, opts] of this.queuedObserveRequests) {
        this.observe(el, cb, opts);
      }
      this.queuedObserveRequests = [];
      this.observeWindow();
    };
    this.resizeObserver = agDocument.createResizeObserver((entries2) => {
      for (const {
        target,
        contentRect: { width: width2, height: height2 }
      } of entries2) {
        const entry = this.elements.get(target);
        this.checkSize(entry, target, width2, height2);
      }
    });
    let animationFrame;
    this.pixelRatioObserver = new PixelRatioObserver(
      agDocument,
      () => {
        clearTimeout(animationFrame);
        animationFrame = setTimeout(() => this.checkPixelRatio(), 0);
      },
      mode === "minimal"
    );
    this.documentReady = agDocument.isReady();
    if (this.documentReady) {
      this.observeWindow();
    } else {
      this.removeLoadListener = agDocument.attachListener("load", this.onLoad);
    }
  }
  destroy() {
    this.removeLoadListener?.();
    this.removeLoadListener = void 0;
    this.resizeObserver?.disconnect();
    this.resizeObserver = void 0;
    this.pixelRatioObserver?.disconnect();
    this.pixelRatioObserver = void 0;
  }
  observeWindow() {
    this.pixelRatioObserver?.observe();
  }
  checkPixelRatio() {
    const pixelRatio = this.pixelRatioObserver?.pixelRatio ?? 1;
    for (const [element2, entry] of this.elements) {
      if (entry.size != null && entry.size.pixelRatio !== pixelRatio) {
        const { width: width2, height: height2 } = entry.size;
        entry.size = { width: width2, height: height2, pixelRatio };
        entry.cb(entry.size, element2);
      }
    }
  }
  checkSize(entry, element2, width2, height2) {
    if (!entry)
      return;
    const prior = entry.size;
    if (prior === void 0 || Math.round(width2) !== Math.round(prior.width) || Math.round(height2) !== Math.round(prior.height)) {
      const pixelRatio = this.pixelRatioObserver?.pixelRatio ?? 1;
      entry.size = { width: width2, height: height2, pixelRatio };
      entry.cb(entry.size, element2);
    }
  }
  // Only a single callback is supported.
  observe(element2, cb, opts) {
    if (!this.documentReady) {
      this.queuedObserveRequests.push([element2, cb, opts]);
      return;
    }
    if (this.elements.has(element2)) {
      this.removeFromQueue(element2);
    } else {
      this.resizeObserver?.observe(element2);
    }
    const entry = { cb };
    this.elements.set(element2, entry);
    if (!opts?.skipInitialRead) {
      this.readSize(entry, element2);
    }
  }
  // Covers cases the ResizeObserver misses: a cross-window observer defers its first callback until
  // the window gains focus, and a detached element gets none until attached.
  readSize(entry, element2) {
    const style = element2.ownerDocument.defaultView?.getComputedStyle(element2);
    const width2 = element2.clientWidth - (Number.parseFloat(style?.paddingLeft ?? "0") + Number.parseFloat(style?.paddingRight ?? "0"));
    const height2 = element2.clientHeight - (Number.parseFloat(style?.paddingTop ?? "0") + Number.parseFloat(style?.paddingBottom ?? "0"));
    if (width2 > 0 || height2 > 0) {
      this.checkSize(entry, element2, width2, height2);
    }
  }
  // Re-read an already-observed element's size, e.g. after it transitions from detached to
  // attached and gains a laid-out size the initial read could not see.
  refresh(element2) {
    const entry = this.elements.get(element2);
    if (entry) {
      this.readSize(entry, element2);
    }
  }
  unobserve(element2) {
    this.resizeObserver?.unobserve(element2);
    this.elements.delete(element2);
    this.removeFromQueue(element2);
    if (this.elements.size === 0) {
      this.destroy();
    }
  }
  removeFromQueue(element2) {
    this.queuedObserveRequests = this.queuedObserveRequests.filter(([el]) => el !== element2);
  }
};

// packages/ag-charts-core/src/widget/collapseMode.ts
var CollapseMode = /* @__PURE__ */ /*#__PURE__*/ ((CollapseMode2) => {
  CollapseMode2["CLOSE"] = "0";
  CollapseMode2["ABORT"] = "1";
  CollapseMode2["DESTROY"] = "2";
  CollapseMode2["PARENT_CLOSED"] = "3";
  CollapseMode2["SIDLING_OPENED"] = "4";
  return CollapseMode2;
})(CollapseMode || {});

// packages/ag-charts-core/src/widget/expansionControllerImpl.ts
var ExpansionControllerImpl = class {
  constructor(controller, getDispatcher) {
    this.getDispatcher = getDispatcher;
    this.onExpanded = () => {
      this.controller.setAriaExpanded(true);
      const dispatcher = this.getDispatcher();
      if (dispatcher && this.controls) {
        const event = {
          type: "expand-controlled-widget",
          controlled: this.controls
        };
        dispatcher.dispatch("expand-controlled-widget", this.controller, event);
      }
    };
    this.onCollapsed = (e) => {
      this.controller.setAriaExpanded(false);
      if (e.mode === "0" /* CLOSE */) {
        this.controller.focus();
      }
    };
    controller.setAriaExpanded(false);
    this.controller = controller;
  }
  destroy() {
    this.controls?.collapse({ mode: "2" /* DESTROY */ });
    this.setControlled(void 0);
  }
  setControlled(controls) {
    if (this.controls) {
      this.controls.removeListener("expand-widget", this.onExpanded);
      this.controls.removeListener("collapse-widget", this.onCollapsed);
    }
    this.controls = controls;
    if (this.controls) {
      this.controller.setAriaControls(this.controls.id);
      this.controls.addListener("expand-widget", this.onExpanded);
      this.controls.addListener("collapse-widget", this.onCollapsed);
    }
  }
  getControlled() {
    return this.controls;
  }
  expandControlled(opts) {
    if (!this.controller.isDisabled()) {
      this.controls?.expand({
        controller: this.controller,
        sourceEvent: void 0,
        overrideFocusVisible: opts?.overrideFocusVisible
      });
    }
  }
};

// packages/ag-charts-core/src/widget/widgetEvents.ts
function allocMouseEvent(type, sourceEvent, current) {
  const { offsetX, offsetY, clientX, clientY } = sourceEvent;
  const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current, sourceEvent);
  return { type, device: "mouse", offsetX, offsetY, clientX, clientY, currentX, currentY, sourceEvent };
}
function allocTouchEvent(type, sourceEvent, _current) {
  return { type, sourceEvent };
}
function declareInternalEntry() {
  return void 0;
}
var WIDGET_META = /*#__PURE__*/ (() => ({
  // Event
  change: {
    isNative: true,
    allocator(sourceEvent, _current) {
      return { type: "change", sourceEvent };
    }
  },
  // FocusEvent
  blur: {
    isNative: true,
    allocator(sourceEvent, _current) {
      return { type: "blur", sourceEvent };
    }
  },
  focus: {
    isNative: true,
    allocator(sourceEvent, _current) {
      return { type: "focus", sourceEvent };
    }
  },
  // KeyboardEvent
  keydown: {
    isNative: true,
    allocator(sourceEvent) {
      return { type: "keydown", sourceEvent };
    }
  },
  keyup: {
    isNative: true,
    allocator(sourceEvent) {
      return { type: "keyup", sourceEvent };
    }
  },
  // MouseEvent
  contextmenu: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocMouseEvent("contextmenu", sourceEvent, current);
    }
  },
  click: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocMouseEvent("click", sourceEvent, current);
    },
    sythetics: void 0
  },
  dblclick: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocMouseEvent("dblclick", sourceEvent, current);
    },
    sythetics: void 0
  },
  mouseenter: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocMouseEvent("mouseenter", sourceEvent, current);
    }
  },
  mousemove: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocMouseEvent("mousemove", sourceEvent, current);
    }
  },
  mouseleave: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocMouseEvent("mouseleave", sourceEvent, current);
    }
  },
  // WheelEvent
  wheel: {
    isNative: true,
    allocator(sourceEvent, current) {
      const { offsetX, offsetY, clientX, clientY } = sourceEvent;
      const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current, sourceEvent);
      const factor = sourceEvent.deltaMode === 0 ? 0.01 : 1;
      let deltaX = sourceEvent.deltaX * factor;
      let deltaY = sourceEvent.deltaY * factor;
      const swapXY = Math.abs(sourceEvent.deltaX) === 0 && sourceEvent.shiftKey;
      if (swapXY) {
        [deltaX, deltaY] = [deltaY, deltaX];
      }
      return {
        type: "wheel",
        offsetX,
        offsetY,
        clientX,
        clientY,
        currentX,
        currentY,
        deltaX,
        deltaY,
        sourceEvent
      };
    }
  },
  // TouchEvent
  touchstart: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocTouchEvent("touchstart", sourceEvent, current);
    }
  },
  touchmove: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocTouchEvent("touchmove", sourceEvent, current);
    }
  },
  touchend: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocTouchEvent("touchend", sourceEvent, current);
    }
  },
  touchcancel: {
    isNative: true,
    allocator(sourceEvent, current) {
      return allocTouchEvent("touchcancel", sourceEvent, current);
    }
  },
  // Internal events (DragWidgetEvent, CollapseWidgetEvent, ExpandWidgetEvent, ExpandControlledWidgetEvent)
  "drag-start": declareInternalEntry(),
  "drag-move": declareInternalEntry(),
  "drag-end": declareInternalEntry(),
  "collapse-widget": declareInternalEntry(),
  "expand-widget": declareInternalEntry(),
  "expand-controlled-widget": declareInternalEntry()
}))();
var WidgetEventUtil = class {
  static alloc(type, sourceEvent, current) {
    const unsafeAllocator = WIDGET_META[type].allocator;
    return unsafeAllocator(sourceEvent, current);
  }
  static isHTMLEvent(type) {
    const meta = WIDGET_META;
    return meta[type]?.isNative === true;
  }
  static calcCurrentXY(current, event) {
    const currentRect = current.getBoundingClientRect();
    const clientWidth = current.clientWidth;
    const clientHeight = current.clientHeight;
    const scaleX = currentRect.width > 0 && clientWidth > 0 ? clientWidth / currentRect.width : 1;
    const scaleY = currentRect.height > 0 && clientHeight > 0 ? clientHeight / currentRect.height : 1;
    return {
      currentX: (event.clientX - currentRect.x) * scaleX,
      currentY: (event.clientY - currentRect.y) * scaleY
    };
  }
};

// packages/ag-charts-core/src/widget/widgetListenerHTML.ts
var WidgetListenerHTML = class {
  constructor() {
    this.widgetListeners = {};
    this.sourceListeners = {};
  }
  initSourceHandler(type, handler) {
    this.sourceListeners ?? (this.sourceListeners = {});
    this.sourceListeners[type] = handler;
  }
  lazyGetWidgetListeners(type, target) {
    var _a;
    if (!(type in (this.sourceListeners ?? {}))) {
      const sourceHandler = (sourceEvent) => {
        const widgetEvent = WidgetEventUtil.alloc(type, sourceEvent, target.getElement());
        this.dispatch(type, target, widgetEvent);
      };
      const opts = {};
      if (type.startsWith("touch") || type === "wheel") {
        opts.passive = false;
      }
      this.initSourceHandler(type, sourceHandler);
      target.getElement().addEventListener(type, sourceHandler, opts);
    }
    this.widgetListeners ?? (this.widgetListeners = {});
    (_a = this.widgetListeners)[type] ?? (_a[type] = []);
    return this.widgetListeners[type];
  }
  add(type, target, handler) {
    const listeners = this.lazyGetWidgetListeners(type, target);
    listeners.push(handler);
  }
  remove(type, target, handler) {
    const listeners = this.lazyGetWidgetListeners(type, target);
    const index = listeners.indexOf(handler);
    if (index > -1)
      listeners.splice(index, 1);
  }
  destroy(target) {
    this.widgetListeners = void 0;
    if (this.sourceListeners) {
      for (const [key, sourceHandler] of entries(this.sourceListeners)) {
        target.getElement().removeEventListener(key, sourceHandler);
      }
      this.sourceListeners = void 0;
    }
  }
  dispatch(type, target, event) {
    for (const widgetListener of this.widgetListeners?.[type] ?? []) {
      widgetListener(event, target);
    }
  }
};

// packages/ag-charts-core/src/widget/widgetListenerInternal.ts
function makeDrag(type, origin3, sourceEvent) {
  const originDeltaX = sourceEvent.pageX - origin3.pageX;
  const originDeltaY = sourceEvent.pageY - origin3.pageY;
  const currentX = origin3.currentX + originDeltaX;
  const currentY = origin3.currentY + originDeltaY;
  return {
    type,
    device: sourceEvent.pointerType,
    offsetX: origin3.offsetX + originDeltaX,
    offsetY: origin3.offsetY + originDeltaY,
    clientX: sourceEvent.clientX,
    clientY: sourceEvent.clientY,
    currentX,
    currentY,
    originDeltaX,
    originDeltaY,
    sourceEvent
  };
}
var WidgetListenerInternal = class {
  constructor(dispatchCallback) {
    this.dispatchCallback = dispatchCallback;
    this.dragTouchEnabled = true;
  }
  destroy() {
    this.dragTriggerRemover?.();
    this.dragTriggerRemover = void 0;
    this.listeners?.clear();
  }
  getListenerSet(type) {
    this.listeners ?? (this.listeners = /* @__PURE__ */ new Map());
    let result = this.listeners.get(type);
    if (result === void 0) {
      result = /* @__PURE__ */ new Set();
      this.listeners.set(type, result);
    }
    return result;
  }
  add(type, target, handler) {
    this.getListenerSet(type).add(handler);
    switch (type) {
      case "drag-start":
      case "drag-move":
      case "drag-end": {
        this.registerDragTrigger(target);
        break;
      }
    }
  }
  remove(type, _target, handler) {
    this.getListenerSet(type).delete(handler);
  }
  registerDragTrigger(target) {
    if (this.dragTriggerRemover == null) {
      const element2 = target.getElement();
      this.dragTriggerRemover = attachListener(
        element2,
        "pointerdown",
        (event) => this.onPointerDown(target, event)
      );
    }
  }
  onPointerDown(current, downEvent) {
    if (downEvent.button === 0 || downEvent.pointerType !== "mouse") {
      this.startPointerDrag(current, downEvent);
    }
  }
  startPointerDrag(current, downEvent) {
    const elem = current.getElement();
    const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current.getElement(), downEvent);
    const origin3 = {
      pageX: Number.NaN,
      pageY: Number.NaN,
      offsetX: Number.NaN,
      offsetY: Number.NaN,
      currentX,
      currentY
    };
    partialAssign(["pageX", "pageY", "offsetX", "offsetY"], origin3, downEvent);
    elem.setPointerCapture(downEvent.pointerId);
    const onPointerMove = (moveEvent) => {
      if (moveEvent.pointerId !== downEvent.pointerId)
        return;
      if (downEvent.pointerType === "touch" && !this.dragTouchEnabled)
        return;
      const dragMoveEvent = makeDrag("drag-move", origin3, moveEvent);
      this.dispatch("drag-move", current, dragMoveEvent);
    };
    const onPointerUp = (upEvent) => {
      if (upEvent.pointerId !== downEvent.pointerId)
        return;
      if (downEvent.pointerType === "mouse" && downEvent.button !== 0)
        return;
      elem.removeEventListener("pointermove", onPointerMove);
      elem.removeEventListener("pointerup", onPointerUp);
      elem.removeEventListener("lostpointercapture", onPointerUp);
      const dragEndEvent = makeDrag("drag-end", origin3, upEvent);
      this.dispatch("drag-end", current, dragEndEvent);
      elem.releasePointerCapture(upEvent.pointerId);
    };
    elem.addEventListener("pointermove", onPointerMove);
    elem.addEventListener("pointerup", onPointerUp);
    elem.addEventListener("lostpointercapture", onPointerUp);
    const dragStartEvent = makeDrag("drag-start", origin3, downEvent);
    this.dispatch("drag-start", current, dragStartEvent);
  }
  dispatch(type, current, event) {
    for (const handler of this.getListenerSet(type)) {
      handler(event, current);
    }
    this.dispatchCallback(type, event);
  }
};

// packages/ag-charts-core/src/widget/widget.ts
var WidgetBounds = class {
  constructor(elem) {
    this.elem = elem;
  }
  setBounds(bounds) {
    setElementBBox(this.elemContainer ?? this.elem, bounds);
  }
  getBounds() {
    return getElementBBox(this.elemContainer ?? this.elem);
  }
  static setElementContainer(widget, elemContainer) {
    const currentBounds = widget.getBounds();
    setElementBBox(elemContainer, currentBounds);
    setElementStyles(widget.elem, { width: "100%", height: "100%" });
    widget.elem.remove();
    widget.elemContainer = elemContainer;
    widget.elemContainer.replaceChildren(widget.elem);
  }
};
var Widget = class extends WidgetBounds {
  constructor() {
    super(...arguments);
    this.index = Number.NaN;
    this.children = [];
  }
  set id(elementId) {
    setAttribute(this.elem, "id", elementId);
  }
  get id() {
    return getAttribute(this.elem, "id");
  }
  getElement() {
    return this.elem;
  }
  getBoundingClientRect() {
    return this.elem.getBoundingClientRect();
  }
  get clientWidth() {
    return this.elem.clientWidth;
  }
  get clientHeight() {
    return this.elem.clientHeight;
  }
  destroy() {
    this.destroyListener?.();
    this.destroyListener = void 0;
    this.remove();
    for (const child of this.children) {
      child.parent = void 0;
      child.destroy();
    }
    this.children.length = 0;
    this.destructor();
    this.internalListener?.destroy();
    this.htmlListener?.destroy(this);
  }
  remove() {
    this.elem.remove();
    this.elemContainer?.remove();
    this.parent?.removeChildWidget(this);
  }
  setHidden(hidden) {
    setElementStyle(this.elem, "display", hidden ? "none" : void 0);
  }
  isHidden() {
    const { defaultView } = this.elem.ownerDocument;
    return defaultView?.getComputedStyle(this.elem).display === "none";
  }
  setCursor(cursor) {
    setElementStyle(this.elem, "cursor", cursor);
  }
  setTextContent(textContent) {
    this.elem.textContent = textContent ?? null;
  }
  setAriaDescribedBy(ariaDescribedBy) {
    setAttribute(this.elem, "aria-describedby", ariaDescribedBy);
  }
  setAriaHidden(ariaHidden) {
    setAttribute(this.elem, "aria-hidden", ariaHidden);
  }
  setAriaLabel(ariaLabel) {
    setAttribute(this.elem, "aria-label", ariaLabel);
  }
  setAriaExpanded(ariaExpanded) {
    setAttribute(this.elem, "aria-expanded", ariaExpanded);
  }
  setAriaControls(ariaControls) {
    setAttribute(this.elem, "aria-controls", ariaControls);
  }
  setAriaHasPopup(ariaHasPopup) {
    setAttribute(this.elem, "aria-haspopup", ariaHasPopup);
  }
  setInnerHTML(html) {
    this.elem.innerHTML = html;
  }
  setPointerEvents(pointerEvents) {
    setElementStyle(this.elem, "pointer-events", pointerEvents);
  }
  setTouchAction(touchAction) {
    if (touchAction == null) {
      this.elem.style.touchAction = "";
    } else {
      this.elem.style.touchAction = touchAction;
    }
  }
  setCSSVariable(key, value) {
    this.elem.style.setProperty(key, value);
  }
  isDisabled() {
    return getAttribute(this.elem, "aria-disabled", false);
  }
  containsTarget(event) {
    return isNode(event.sourceEvent.target) && this.elem.contains(event.sourceEvent.target);
  }
  hasPopup() {
    const ariaHasPopup = getAttribute(this.elem, "aria-haspopup");
    return ariaHasPopup !== void 0 && ariaHasPopup !== "false";
  }
  parseFloat(s) {
    return s === "" ? 0 : Number.parseFloat(s);
  }
  cssLeft() {
    return this.parseFloat(this.elem.style.left);
  }
  cssTop() {
    return this.parseFloat(this.elem.style.top);
  }
  cssWidth() {
    return this.parseFloat(this.elem.style.width);
  }
  cssHeight() {
    return this.parseFloat(this.elem.style.height);
  }
  focus(opts) {
    this.elem.focus(opts);
  }
  setFocusOverride(focus) {
    setAttribute(this.elem, "data-focus-override", focus);
  }
  setPreventsDefault(preventDefault) {
    setAttribute(this.elem, "data-preventdefault", preventDefault);
  }
  setTabIndex(tabIndex) {
    setAttribute(this.elem, "tabindex", tabIndex);
  }
  addChild(child) {
    this.addChildToDOM(child, this.getBefore(child));
    this.children.push(child);
    child.index = this.children.length - 1;
    child.parent = this;
    this.onChildAdded(child);
  }
  removeChildWidget(child) {
    const i = this.children.indexOf(child);
    this.children.splice(i, 1);
    this.removeChildFromDOM(child);
    this.onChildRemoved(child);
  }
  moveChild(child, domIndex) {
    if (child.domIndex === domIndex)
      return;
    child.domIndex = domIndex;
    this.removeChildFromDOM(child);
    this.addChildToDOM(child, this.getBefore(child));
  }
  addClass(...tokens) {
    this.elem.classList.add(...tokens);
  }
  removeClass(...tokens) {
    this.elem.classList.remove(...tokens);
  }
  toggleClass(token, force) {
    this.elem.classList.toggle(token, force);
  }
  appendOrInsert(child, before) {
    if (before) {
      before.getElement().insertAdjacentElement("beforebegin", child);
    } else {
      this.elem.appendChild(child);
    }
  }
  addChildToDOM(child, before) {
    this.appendOrInsert(child.getElement(), before);
  }
  removeChildFromDOM(child) {
    child.getElement().remove();
  }
  onChildAdded(_child) {
  }
  onChildRemoved(_child) {
  }
  getBefore({ domIndex }) {
    if (domIndex === void 0)
      return void 0;
    return this.children.filter((child) => child.domIndex !== void 0 && child.domIndex > domIndex).reduce((prev, curr) => !prev || curr.domIndex < prev.domIndex ? curr : prev, void 0);
  }
  addListener(type, listener) {
    if (WidgetEventUtil.isHTMLEvent(type)) {
      this.htmlListener ?? (this.htmlListener = new WidgetListenerHTML());
      this.htmlListener.add(type, this, listener);
    } else {
      this.internalListener ?? (this.internalListener = new WidgetListenerInternal(this.onDispatch.bind(this)));
      this.internalListener.add(type, this, listener);
    }
    return () => this.removeListener(type, listener);
  }
  removeListener(type, listener) {
    if (WidgetEventUtil.isHTMLEvent(type)) {
      this.htmlListener?.remove(type, this, listener);
    } else if (this.htmlListener != null) {
      this.internalListener?.remove(type, this, listener);
    }
  }
  setDragTouchEnabled(dragTouchEnabled) {
    this.internalListener ?? (this.internalListener = new WidgetListenerInternal(this.onDispatch.bind(this)));
    this.internalListener.dragTouchEnabled = dragTouchEnabled;
  }
  onDispatch(type, event) {
    if (!event.sourceEvent?.bubbles)
      return;
    let { parent } = this;
    while (parent != null) {
      const { internalListener } = parent;
      if (internalListener != null) {
        const parentEvent = { ...event, ...WidgetEventUtil.calcCurrentXY(parent.getElement(), event) };
        internalListener.dispatch(type, parent, parentEvent);
      }
      parent = parent.parent;
    }
  }
};

// packages/ag-charts-core/src/widget/abstractButtonWidget.ts
function isButtonClickEventPredicate(widgetEvent) {
  return isButtonClickEvent(widgetEvent.sourceEvent);
}
var AbstractButtonWidget = class extends Widget {
  constructor(element2, role) {
    super(element2);
    setAttribute(this.elem, "role", role);
    this.setEnabled(true);
    this.addKeyboardClickBinding(isButtonClickEventPredicate);
  }
  lazyControllerImpl() {
    this.controllerImpl ?? (this.controllerImpl = new ExpansionControllerImpl(this, () => this.internalListener));
    return this.controllerImpl;
  }
  destructor() {
    this.controllerImpl?.destroy();
  }
  addKeyboardClickBinding(predicate) {
    this.addListener("keydown", (widgetEvent) => {
      const { sourceEvent } = widgetEvent;
      if (predicate(widgetEvent)) {
        sourceEvent.preventDefault();
        this.htmlListener?.dispatch("click", this, { type: "click", device: "keyboard", sourceEvent });
      }
    });
  }
  setEnabled(enabled) {
    setAttribute(this.elem, "aria-disabled", !enabled);
  }
  setControlled(controls) {
    return this.lazyControllerImpl().setControlled(controls);
  }
  getControlled() {
    return this.lazyControllerImpl().getControlled();
  }
  expandControlled(opts) {
    return this.lazyControllerImpl().expandControlled(opts);
  }
  addListener(type, listener) {
    return super.addListener(type, (ev, current) => {
      if ((type === "click" || type === "dblclick") && this.isDisabled())
        return;
      listener(ev, current);
    });
  }
};

// packages/ag-charts-core/src/widget/nativeWidget.ts
var NativeWidget = class extends Widget {
  constructor(elem) {
    super(elem);
  }
  destructor() {
  }
};

// packages/ag-charts-core/src/widget/axisWidget.ts
var AxisWidget = class extends NativeWidget {
  constructor() {
    super(createElement("div"));
  }
};

// packages/ag-charts-core/src/widget/boundedTextWidget.ts
var BoundedTextWidget = class extends Widget {
  constructor() {
    super(createElement("div"));
    this.textElement = createSvgElement("text");
    this.textElement.role = "presentation";
    this.svgElement = createSvgElement("svg");
    this.svgElement.appendChild(this.textElement);
    this.svgElement.style.width = "100%";
    this.svgElement.style.opacity = "0";
    this.svgElement.role = "presentation";
    this.elem.appendChild(this.svgElement);
    this.elem.role = "presentation";
  }
  set textContent(text) {
    this.textElement.textContent = text;
    const bboxCalculator = this.textElement;
    const bbox = bboxCalculator.getBBox?.();
    if (bbox) {
      this.svgElement.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    }
  }
  get textContent() {
    return this.textElement.textContent;
  }
  destructor() {
  }
};

// packages/ag-charts-core/src/widget/buttonWidget.ts
var ButtonWidget = class extends AbstractButtonWidget {
  constructor() {
    super(createElement("button"));
  }
};

// packages/ag-charts-core/src/widget/groupWidget.ts
var GroupWidget = class extends Widget {
  constructor() {
    super(createElement("div"));
    setAttribute(this.elem, "role", "group");
  }
  destructor() {
  }
};

// packages/ag-charts-core/src/widget/rovingTabContainerWidget.ts
var RovingTabContainerWidget = class extends Widget {
  constructor(initialOrientation, role) {
    super(createElement("div"));
    this.focusedChildIndex = 0;
    this.onChildFocus = (_event, child) => {
      const oldFocus = this.children[this.focusedChildIndex];
      this.focusedChildIndex = child.index;
      oldFocus?.setTabIndex(-1);
      child.setTabIndex(0);
    };
    this.onChildKeyDown = (event, child) => {
      const rovingOrientation = this.orientation;
      const isRtl = isDirectionRtl(this.elem);
      let primaryKeys;
      let secondaryKeys;
      if (rovingOrientation === "both") {
        primaryKeys = getPrevNextKeys("horizontal", isRtl);
        secondaryKeys = getPrevNextKeys("vertical");
      } else {
        primaryKeys = getPrevNextKeys(rovingOrientation, isRtl);
        secondaryKeys = void 0;
      }
      let targetIndex = -1;
      if (hasNoModifiers(event.sourceEvent)) {
        const key = event.sourceEvent.key;
        if (key === primaryKeys.nextKey || key === secondaryKeys?.nextKey) {
          targetIndex = child.index + 1;
        } else if (key === primaryKeys.prevKey || key === secondaryKeys?.prevKey) {
          targetIndex = child.index - 1;
        }
      }
      this.children[targetIndex]?.focus();
    };
    setAttribute(this.elem, "role", role);
    this.orientation = initialOrientation;
  }
  get orientation() {
    return getAttribute(this.elem, "aria-orientation") ?? "both";
  }
  set orientation(orientation) {
    setAttribute(this.elem, "aria-orientation", orientation === "both" ? void 0 : orientation);
  }
  focus() {
    this.children[this.focusedChildIndex]?.focus();
  }
  clear() {
    this.focusedChildIndex = 0;
    for (const child of this.children) {
      this.removeChildListeners(child);
      child.parent = void 0;
    }
    this.elem.textContent = "";
    this.children.length = 0;
  }
  addChildListeners(child) {
    child.addListener("focus", this.onChildFocus);
    child.addListener("keydown", this.onChildKeyDown);
  }
  removeChildListeners(child) {
    child.removeListener("focus", this.onChildFocus);
    child.removeListener("keydown", this.onChildKeyDown);
  }
  onChildAdded(child) {
    this.addChildListeners(child);
    child.setTabIndex(this.children.length === 1 ? 0 : -1);
  }
  onChildRemoved(removedChild) {
    this.removeChildListeners(removedChild);
    const { focusedChildIndex, children } = this;
    const removedFocusedChild = focusedChildIndex === removedChild.index;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.index === focusedChildIndex) {
        this.focusedChildIndex = i;
      }
      child.index = i;
    }
    if (removedFocusedChild) {
      const newFocusChild = children[focusedChildIndex] ?? children[focusedChildIndex - 1];
      if (newFocusChild == null) {
        this.focusedChildIndex = 0;
      } else {
        this.focusedChildIndex = newFocusChild.index;
        newFocusChild.setTabIndex(0);
      }
    }
  }
};

// packages/ag-charts-core/src/widget/listWidget.ts
function removeFromDOM(child) {
  const elem = child.getElement();
  if (elem.parentElement) {
    elem.parentElement.remove();
  } else {
    elem.remove();
  }
}
var ListWidget = class extends RovingTabContainerWidget {
  constructor() {
    super("both", "list");
    this.setHidden(true);
  }
  destructor() {
    for (const child of this.children) {
      removeFromDOM(child);
    }
  }
  addChildToDOM(child, before) {
    const listItem = createElement("div");
    setAttribute(listItem, "role", "listitem");
    setElementStyle(listItem, "position", "absolute");
    Widget.setElementContainer(child, listItem);
    this.appendOrInsert(listItem, before);
    this.setHidden(false);
  }
  removeChildFromDOM(child) {
    removeFromDOM(child);
    this.setHidden(this.children.length === 0);
  }
  setHidden(hidden) {
    if (this.children.length === 0) {
      hidden = true;
    }
    super.setHidden(hidden);
  }
};

// packages/ag-charts-core/src/widget/menuItemWidget.ts
var MenuItemWidget = class extends AbstractButtonWidget {
  constructor() {
    super(createElement("div"), "menuitem");
  }
};
var MenuItemRadioWidget = class extends AbstractButtonWidget {
  constructor() {
    super(createElement("div"), "menuitemradio");
  }
  setChecked(checked) {
    setAttribute(this.elem, "aria-checked", checked);
  }
};

// packages/ag-charts-core/src/widget/menuWidget.ts
var MenuWidget = class _MenuWidget extends RovingTabContainerWidget {
  constructor(orientation = "vertical") {
    super(orientation, "menu");
    this.handleMouseEnter = (ev, current) => {
      if (!current.hasPopup()) {
        this.expandSubMenu(ev, void 0);
      }
    };
    this.handleMouseMove = (_ev, current) => {
      current.focus({ preventScroll: true });
    };
  }
  destructor() {
    this.collapse({ mode: "2" /* DESTROY */ });
  }
  addSeparator() {
    const sep = this.elem.ownerDocument.createElement("div");
    setAttribute(sep, "role", "separator");
    this.elem.appendChild(sep);
    return sep;
  }
  toggleChildEnabledByIndex(index, enabled) {
    this.children.at(index)?.setEnabled(enabled);
  }
  onChildAdded(child) {
    super.onChildAdded(child);
    child.addListener("mouseenter", this.handleMouseEnter);
    child.addListener("mousemove", this.handleMouseMove);
  }
  onChildRemoved(child) {
    super.onChildRemoved(child);
    child.removeListener("mouseenter", this.handleMouseEnter);
    child.removeListener("mousemove", this.handleMouseMove);
  }
  addSubMenu() {
    const subMenuButton = new MenuItemWidget();
    const subMenu = new _MenuWidget(this.orientation);
    subMenu.id = createElementId();
    const expand = () => {
      this.collapseExpandedSubMenu(subMenu);
      subMenuButton.expandControlled();
    };
    const arrowOpener = (ev) => {
      const openKey = isDirectionRtl(this.elem) ? "ArrowLeft" : "ArrowRight";
      if (hasNoModifiers(ev.sourceEvent) && ev.sourceEvent.code === openKey) {
        this.collapseExpandedSubMenu(subMenu);
        subMenuButton.expandControlled();
      }
    };
    subMenuButton.setControlled(subMenu);
    subMenuButton.setAriaHasPopup("menu");
    subMenuButton.addListener("click", expand);
    subMenuButton.addListener("mouseenter", expand);
    subMenuButton.addListener("keydown", arrowOpener);
    this.addChild(subMenuButton);
    return { subMenuButton, subMenu };
  }
  expandSubMenu(ev, subMenu) {
    const { expansionScope } = this;
    if (!expansionScope)
      return;
    this.collapseExpandedSubMenu(subMenu);
    subMenu?.expand(ev);
  }
  collapseExpandedSubMenu(newSubMenu) {
    const { expansionScope } = this;
    if (!expansionScope)
      return;
    expansionScope.expandedSubMenu?.collapse({ mode: "4" /* SIDLING_OPENED */ });
    expansionScope.expandedSubMenu = newSubMenu;
  }
  getCloseKeys() {
    return isDirectionRtl(this.elem) ? ["Escape", "ArrowRight"] : ["Escape", "ArrowLeft"];
  }
  expand(opts) {
    if (this.expansionScope != null)
      return;
    this.expansionScope = {
      lastFocus: getLastFocus(opts.sourceEvent),
      expandedSubMenu: void 0,
      abort: () => this.collapse({ mode: "1" /* ABORT */ }),
      close: () => this.collapse({ mode: "0" /* CLOSE */ }),
      removers: new CleanupRegistry()
    };
    const scope = this.expansionScope;
    const buttons = this.children.map((value) => value.getElement());
    setAttribute(scope.lastFocus, "aria-expanded", true);
    scope.removers.register(
      addMouseCloseListener(this.elem, scope.abort),
      addTouchCloseListener(this.elem, scope.abort),
      ...this.children.map(
        (child) => addEscapeEventListener(child.getElement(), scope.close, () => this.getCloseKeys())
      ),
      opts?.overrideFocusVisible && addOverrideFocusVisibleEventListener(this.elem, buttons, opts.overrideFocusVisible)
    );
    this.internalListener?.dispatch("expand-widget", this, { type: "expand-widget" });
    this.children[0]?.focus({ preventScroll: true });
  }
  collapse(opts) {
    const { mode = "0" /* CLOSE */ } = opts ?? {};
    if (this.expansionScope === void 0)
      return;
    const { lastFocus, removers, expandedSubMenu } = this.expansionScope;
    this.expansionScope = void 0;
    expandedSubMenu?.collapse({ mode: "3" /* PARENT_CLOSED */ });
    setAttribute(lastFocus, "aria-expanded", false);
    if (mode === "0" /* CLOSE */) {
      lastFocus?.focus({ preventScroll: true });
    }
    removers.flush();
    this.internalListener?.dispatch("collapse-widget", this, { type: "collapse-widget", mode });
  }
};

// packages/ag-charts-core/src/widget/sliderWidget.ts
var _SliderWidget = /*#__PURE__*/ (() => { var _c$3 = class _SliderWidget extends Widget {
  constructor() {
    super(createElement("input"));
    this._step = _SliderWidget.STEP_ONE;
    this.orientation = "both";
  }
  get step() {
    return this._step;
  }
  set step(step) {
    this._step = step;
    this.getElement().step = step.attributeValue;
  }
  get keyboardStep() {
    return this._keyboardStep?.step ?? this._step;
  }
  set keyboardStep(step) {
    if (step === this._keyboardStep?.step)
      return;
    if (this._keyboardStep !== void 0) {
      this.removeListener("keydown", this._keyboardStep.onKeyDown);
      this.removeListener("keyup", this._keyboardStep.onKeyUp);
      this.removeListener("blur", this._keyboardStep.onBlur);
      this._keyboardStep = void 0;
    }
    if (step !== void 0) {
      const onKeyDown = () => this.getElement().step = step.attributeValue;
      const resetStep = () => this.getElement().step = this._step.attributeValue;
      this._keyboardStep = { step, onKeyDown, onKeyUp: resetStep, onBlur: resetStep };
      this.addListener("keydown", this._keyboardStep.onKeyDown);
      this.addListener("keyup", this._keyboardStep.onKeyUp);
      this.addListener("blur", this._keyboardStep.onBlur);
    }
  }
  get orientation() {
    return getAttribute(this.elem, "aria-orientation") ?? "both";
  }
  set orientation(orientation) {
    setAttribute(this.elem, "aria-orientation", orientation === "both" ? void 0 : orientation);
    _SliderWidget.registerDefaultPreventers(this, orientation);
  }
  destructor() {
  }
  clampValueRatio(clampMin, clampMax) {
    const ratio2 = this.getValueRatio();
    const clampedRatio = clamp(clampMin, ratio2, clampMax);
    if (clampedRatio !== ratio2) {
      this.setValueRatio(clampedRatio);
    }
    return clampedRatio;
  }
  setValueRatio(ratio2, opts) {
    const { divider } = this.step;
    const value = Math.round(ratio2 * 1e4) / divider;
    const { ariaValueText = formatPercent(value / divider) } = opts ?? {};
    const elem = this.getElement();
    elem.value = `${value}`;
    elem.ariaValueText = ariaValueText;
    elem.ariaValueNow = `${value}`;
  }
  getValueRatio() {
    return this.getElement().valueAsNumber / this.step.divider;
  }
  static registerDefaultPreventers(target, orientation) {
    if (orientation === "both") {
      target.removeListener("keydown", _SliderWidget.onKeyDown);
    } else {
      target.addListener("keydown", _SliderWidget.onKeyDown);
    }
  }
  static onKeyDown(ev, current) {
    let ignoredKeys = [];
    const { orientation } = current;
    if (orientation === "horizontal") {
      ignoredKeys = ["ArrowUp", "ArrowDown"];
    } else if (orientation === "vertical") {
      ignoredKeys = ["ArrowLeft", "ArrowRight"];
    }
    if (ignoredKeys.includes(ev.sourceEvent.code)) {
      ev.sourceEvent.preventDefault();
    }
  }
}; _c$3.STEP_ONE = { attributeValue: "1", divider: 1 }; _c$3.STEP_HUNDRETH = { attributeValue: "0.01", divider: 100 }; return _c$3; })()
var SliderWidget = _SliderWidget;

// packages/ag-charts-core/src/widget/switchWidget.ts
var SwitchWidget = class extends ButtonWidget {
  constructor() {
    super();
    setAttribute(this.elem, "role", "switch");
    this.setChecked(false);
  }
  setChecked(checked) {
    setAttribute(this.elem, "aria-checked", checked);
  }
};

// packages/ag-charts-core/src/widget/toolbarWidget.ts
var ToolbarWidget = class extends RovingTabContainerWidget {
  constructor(orientation = "horizontal") {
    super(orientation, "toolbar");
  }
  destructor() {
  }
};

// packages/ag-charts-core/src/rendering/interpolating.ts
var interpolate = /*#__PURE__*/ Symbol("interpolate");
var isInterpolating = (x) => x[interpolate] != null;

// packages/ag-charts-core/src/scene/bbox.ts
var _BBox = /*#__PURE__*/ (() => { var _c$4 = class _BBox {
  constructor(x, y, width2, height2) {
    this.x = x;
    this.y = y;
    this.width = width2;
    this.height = height2;
  }
  static fromObject({ x, y, width: width2, height: height2 }) {
    return new _BBox(x, y, width2, height2);
  }
  static fromSizedPoint({ x, y, size }) {
    const radius = size / 2;
    return new _BBox(x - radius, y - radius, size, size);
  }
  static merge(boxes) {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const box of boxes) {
      if (box.x < left) {
        left = box.x;
      }
      if (box.y < top) {
        top = box.y;
      }
      if (end2(box.x, box.width) > right) {
        right = end2(box.x, box.width);
      }
      if (end2(box.y, box.height) > bottom) {
        bottom = end2(box.y, box.height);
      }
    }
    return new _BBox(left, top, right - left, bottom - top);
  }
  static nearestBox(x, y, boxes) {
    return nearestSquared(x, y, boxes);
  }
  toDOMRect() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.y,
      left: this.x,
      right: end2(this.x, this.width),
      bottom: end2(this.y, this.height),
      toJSON() {
        return {};
      }
    };
  }
  clone() {
    const { x, y, width: width2, height: height2 } = this;
    return new _BBox(x, y, width2, height2);
  }
  equals(other) {
    return boxesEqual(this, other);
  }
  containsPoint(x, y) {
    return boxContains(this, x, y);
  }
  intersectsWith(other) {
    return !(this.x + this.width <= other.x || other.x + other.width <= this.x || this.y + this.height <= other.y || other.y + other.height <= this.y);
  }
  intersection(other) {
    const x0 = Math.max(this.x, other.x);
    const y0 = Math.max(this.y, other.y);
    const x1 = Math.min(end2(this.x, this.width), end2(other.x, other.width));
    const y1 = Math.min(end2(this.y, this.height), end2(other.y, other.height));
    if (x0 > x1 || y0 > y1)
      return;
    return new _BBox(x0, y0, x1 - x0, y1 - y0);
  }
  collidesBBox(other) {
    return this.x < end2(other.x, other.width) && end2(this.x, this.width) > other.x && this.y < end2(other.y, other.height) && end2(this.y, this.height) > other.y;
  }
  computeCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }
  isFinite() {
    return Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(this.width) && Number.isFinite(this.height);
  }
  distanceSquared(x, y) {
    if (this.containsPoint(x, y)) {
      return 0;
    }
    const dx = x - clamp(this.x, x, end2(this.x, this.width));
    const dy = y - clamp(this.y, y, end2(this.y, this.height));
    return dx * dx + dy * dy;
  }
  shrink(amount, position) {
    if (typeof amount === "number") {
      this.applyMargin(amount, position);
    } else {
      for (const key of Object.keys(amount)) {
        const value = amount[key];
        if (typeof value === "number") {
          this.applyMargin(value, key);
        }
      }
    }
    if (this.width < 0) {
      this.width = 0;
    }
    if (this.height < 0) {
      this.height = 0;
    }
    return this;
  }
  grow(amount, position) {
    if (typeof amount === "number") {
      this.applyMargin(-amount, position);
    } else {
      for (const key of Object.keys(amount)) {
        const value = amount[key];
        if (typeof value === "number") {
          this.applyMargin(-value, key);
        }
      }
    }
    return this;
  }
  clip(clipBounds) {
    const a = from(this);
    const b = from(clipBounds ?? this);
    this.x = Math.max(a.x1, b.x1);
    this.y = Math.max(a.y1, b.y1);
    this.width = Math.min(a.x2, b.x2) - this.x;
    this.height = Math.min(a.y2, b.y2) - this.y;
    return this;
  }
  applyMargin(value, position) {
    switch (position) {
      case "top":
        this.y += value;
      case "bottom":
        this.height -= value;
        break;
      case "left":
        this.x += value;
      case "right":
        this.width -= value;
        break;
      case "vertical":
        this.y += value;
        this.height -= value * 2;
        break;
      case "horizontal":
        this.x += value;
        this.width -= value * 2;
        break;
      case void 0:
        this.x += value;
        this.y += value;
        this.width -= value * 2;
        this.height -= value * 2;
        break;
    }
  }
  translate(x, y) {
    this.x += x;
    this.y += y;
    return this;
  }
  [interpolate](other, d) {
    return new _BBox(
      this.x * (1 - d) + other.x * d,
      this.y * (1 - d) + other.y * d,
      this.width * (1 - d) + other.width * d,
      this.height * (1 - d) + other.height * d
    );
  }
}; _c$4.zero = Object.freeze(new _c$4(0, 0, 0, 0)); _c$4.NaN = Object.freeze(new _c$4(Number.NaN, Number.NaN, Number.NaN, Number.NaN)); return _c$4; })()
var BBox = _BBox;
function end2(x, width2) {
  if (x === -Infinity && width2 === Infinity)
    return Infinity;
  return x + width2;
}

// packages/ag-charts-core/src/rendering/pixel.ts
var HALF_PIXEL_EPSILON = 1e-8;
function deviceDimension(pixelRatio, value) {
  const scaled = value * pixelRatio;
  const fractional = scaled - Math.floor(scaled);
  const stable = Math.abs(fractional - 0.5) < HALF_PIXEL_EPSILON ? scaled + HALF_PIXEL_EPSILON : scaled;
  return Math.round(stable);
}
function roundToDevicePixel(pixelRatio, value) {
  return deviceDimension(pixelRatio, value) / pixelRatio;
}
function snapDeviceCentre(centreDev, deviceExtent) {
  return deviceExtent % 2 === 0 ? deviceDimension(1, centreDev) : deviceDimension(1, centreDev - 0.5) + 0.5;
}
function align(pixelRatio, start2, length2) {
  const alignedStart = roundToDevicePixel(pixelRatio, start2);
  if (length2 == null) {
    return alignedStart;
  } else if (length2 === 0) {
    return 0;
  } else if (length2 < 1) {
    return alignAfter(pixelRatio, length2);
  }
  return roundToDevicePixel(pixelRatio, length2 + start2) - alignedStart;
}
function centreSnapApplies(pixelRatio, length2) {
  return deviceDimension(pixelRatio, length2) > 1;
}
function alignCentre(pixelRatio, start2, length2, out = { start: 0, length: 0 }) {
  const lengthDev = deviceDimension(pixelRatio, length2);
  if (lengthDev <= 1) {
    out.start = align(pixelRatio, start2);
    out.length = align(pixelRatio, start2, length2);
    return out;
  }
  const centreDev = (start2 + length2 / 2) * pixelRatio;
  const centreSnapDev = snapDeviceCentre(centreDev, lengthDev);
  const startDev = centreSnapDev - lengthDev / 2;
  out.start = startDev / pixelRatio;
  out.length = lengthDev / pixelRatio;
  return out;
}
function alignBefore(pixelRatio, value) {
  return Math.floor(value * pixelRatio) / pixelRatio;
}
function alignAfter(pixelRatio, value) {
  return Math.ceil(value * pixelRatio) / pixelRatio;
}

// packages/ag-charts-core/src/scene/canvas/spreadCanvas.ts
var MIN_DIMENSION = 64;
var spreadCanvases = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
function bucket(dimension, max) {
  return Math.min(Math.max(MIN_DIMENSION, 2 ** Math.ceil(Math.log2(dimension))), Math.max(max, dimension));
}
function getSpreadCanvas(ctx, width2, height2, maxWidth, maxHeight) {
  let sizes = spreadCanvases.get(ctx);
  if (sizes == null) {
    sizes = /* @__PURE__ */ new Map();
    spreadCanvases.set(ctx, sizes);
  }
  const canvasWidth = bucket(width2, maxWidth);
  const canvasHeight = bucket(height2, maxHeight);
  const key = canvasWidth * 65536 + canvasHeight;
  let spreadCanvas = sizes.get(key);
  if (spreadCanvas == null) {
    const OffscreenCanvasCtor = getOffscreenCanvas();
    const canvas = new OffscreenCanvasCtor(canvasWidth, canvasHeight);
    spreadCanvas = { canvas, context: canvas.getContext("2d") };
    sizes.set(key, spreadCanvas);
  }
  return spreadCanvas;
}
function releaseSpreadCanvas(ctx) {
  const sizes = spreadCanvases.get(ctx);
  if (sizes == null)
    return;
  for (const { canvas } of sizes.values()) {
    canvas.width = 0;
    canvas.height = 0;
  }
  spreadCanvases.delete(ctx);
}

// packages/ag-charts-core/src/scene/canvas/hdpiCanvas.ts
var HdpiCanvas = class {
  constructor(options) {
    this.width = 600;
    this.height = 300;
    this.direction = "ltr";
    const { width: width2, height: height2, willReadFrequently = false } = options;
    this.element = options.canvasElement;
    this.pixelRatio = options.pixelRatio;
    this.element.style.display = "block";
    this.element.style.width = (width2 ?? this.width) + "px";
    this.element.style.height = (height2 ?? this.height) + "px";
    this.element.width = deviceDimension(this.pixelRatio, width2 ?? this.width);
    this.element.height = deviceDimension(this.pixelRatio, height2 ?? this.height);
    this.context = this.element.getContext("2d", { willReadFrequently });
    this.context.direction = this.direction;
    this.resize(width2 ?? this.width, height2 ?? this.height, this.pixelRatio);
    debugContext(this.context);
  }
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- OffscreenCanvasRenderingContext2D is intentionally `any` for Angular 13+ compatibility (AG-6969)
  drawImage(context, dx = 0, dy = 0) {
    return context.drawImage(this.context.canvas, dx, dy);
  }
  toDataURL(type) {
    return this.element.toDataURL(type);
  }
  resize(width2, height2, pixelRatio) {
    if (!(width2 > 0 && height2 > 0))
      return;
    const { element: element2, context } = this;
    if (width2 !== this.width || height2 !== this.height || pixelRatio !== this.pixelRatio) {
      releaseSpreadCanvas(context);
    }
    element2.width = deviceDimension(pixelRatio, width2);
    element2.height = deviceDimension(pixelRatio, height2);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    element2.style.width = width2 + "px";
    element2.style.height = height2 + "px";
    this.width = width2;
    this.height = height2;
    this.pixelRatio = pixelRatio;
  }
  setDirection(isRtl) {
    this.direction = isRtl ? "rtl" : "ltr";
    this.element.dir = this.direction;
    this.context.direction = this.direction;
  }
  clear() {
    clearContext(this);
  }
  destroy() {
    this.element.remove();
    releaseSpreadCanvas(this.context);
    this.element.width = 0;
    this.element.height = 0;
    this.context.clearRect(0, 0, 0, 0);
    Object.freeze(this);
  }
  reset() {
    this.context.reset();
    this.context.verifyDepthZero?.();
    this.context.direction = this.direction;
  }
};

// packages/ag-charts-core/src/scene/canvas/hdpiOffscreenCanvas.ts
function canvasDimensions(width2, height2, pixelRatio) {
  return [deviceDimension(pixelRatio, width2), deviceDimension(pixelRatio, height2)];
}
var fallbackCanvas;
function getFallbackCanvas() {
  const OffscreenCanvasCtor = getOffscreenCanvas();
  fallbackCanvas ?? (fallbackCanvas = new OffscreenCanvasCtor(1, 1));
  return fallbackCanvas;
}
var HdpiOffscreenCanvas = class {
  constructor(options) {
    const { width: width2, height: height2, pixelRatio, willReadFrequently = false } = options;
    this.width = width2;
    this.height = height2;
    this.pixelRatio = pixelRatio;
    const [canvasWidth, canvasHeight] = canvasDimensions(width2, height2, pixelRatio);
    const OffscreenCanvasCtor = getOffscreenCanvas();
    this.canvas = new OffscreenCanvasCtor(canvasWidth, canvasHeight);
    this.context = this.canvas.getContext("2d", { willReadFrequently });
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    debugContext(this.context);
  }
  drawImage(context, dx = 0, dy = 0) {
    return context.drawImage(this.canvas, dx, dy);
  }
  transferToImageBitmap() {
    if (this.canvas.width < 1 || this.canvas.height < 1) {
      return getFallbackCanvas().transferToImageBitmap();
    }
    return this.canvas.transferToImageBitmap();
  }
  resize(width2, height2, pixelRatio) {
    if (!(width2 > 0 && height2 > 0))
      return;
    const { canvas, context } = this;
    if (width2 !== this.width || height2 !== this.height || pixelRatio !== this.pixelRatio) {
      releaseSpreadCanvas(context);
      const [canvasWidth, canvasHeight] = canvasDimensions(width2, height2, pixelRatio);
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.width = width2;
    this.height = height2;
    this.pixelRatio = pixelRatio;
  }
  clear() {
    clearContext(this);
  }
  destroy() {
    releaseSpreadCanvas(this.context);
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.context.clearRect(0, 0, 0, 0);
    this.canvas = null;
    this.context = null;
    Object.freeze(this);
  }
};

// packages/ag-charts-core/src/rendering/svg.ts
var commandEx = /^[\t\n\f\r ]*([achlmqstvz])[\t\n\f\r ]*/i;
var coordinateEx = /^[+-]?((\d*\.\d+)|(\d+\.)|(\d+))(e[+-]?\d+)?/i;
var commaEx = /[\t\n\f\r ]*,?[\t\n\f\r ]*/;
var flagEx = /^[01]/;
var pathParams = {
  z: [],
  h: [coordinateEx],
  v: [coordinateEx],
  m: [coordinateEx, coordinateEx],
  l: [coordinateEx, coordinateEx],
  t: [coordinateEx, coordinateEx],
  s: [coordinateEx, coordinateEx, coordinateEx, coordinateEx],
  q: [coordinateEx, coordinateEx, coordinateEx, coordinateEx],
  c: [coordinateEx, coordinateEx, coordinateEx, coordinateEx, coordinateEx, coordinateEx],
  a: [coordinateEx, coordinateEx, coordinateEx, flagEx, flagEx, coordinateEx, coordinateEx]
};
function parseSvg(d) {
  if (d == null || d === "")
    return;
  const segments = [];
  let i = 0;
  let currentCommand;
  while (i < d.length) {
    const commandMatch = commandEx.exec(d.slice(i));
    let command;
    if (commandMatch == null) {
      if (currentCommand == null) {
        warnOnce(`Invalid SVG path, error at index ${i}: Missing command.`);
        return;
      }
      command = currentCommand;
    } else {
      command = commandMatch[1];
      i += commandMatch[0].length;
    }
    const segment = parseSegment(command, d, i);
    if (!segment)
      return;
    i = segment[0];
    currentCommand = command;
    segments.push(segment[1]);
  }
  return segments;
}
function parseSegment(command, d, index) {
  const params = pathParams[command.toLocaleLowerCase()];
  const pathSeg = { command, params: [] };
  for (const regex of params) {
    const segment = d.slice(index);
    const match = regex.exec(segment);
    if (match != null) {
      pathSeg.params.push(Number.parseFloat(match[0]));
      index += match[0].length;
      const next = commaEx.exec(segment.slice(match[0].length));
      if (next != null) {
        index += next[0].length;
      }
    } else if (pathSeg.params.length === 1) {
      return [index, pathSeg];
    } else {
      warnOnce(
        `Invalid SVG path, error at index ${index}: No path segment parameters for command [${command}]`
      );
      return;
    }
  }
  return [index, pathSeg];
}

// packages/ag-charts-core/src/scene/extendedPath2D.ts
var ExtendedPath2D = class {
  constructor() {
    this.previousCommands = [];
    this.previousParams = [];
    this.previousClosedPath = false;
    this.commands = [];
    this.params = [];
    this.commandsLength = 0;
    this.paramsLength = 0;
    this.cx = Number.NaN;
    this.cy = Number.NaN;
    this.sx = Number.NaN;
    this.sy = Number.NaN;
    this.openedPath = false;
    this.closedPath = false;
    const Path2DCtor = getPath2D();
    this.path2d = new Path2DCtor();
  }
  isEmpty() {
    return this.commandsLength === 0;
  }
  isDirty() {
    return this.closedPath !== this.previousClosedPath || this.previousCommands.length !== this.commandsLength || this.previousParams.length !== this.paramsLength || this.previousCommands.toString() !== this.commands.slice(0, this.commandsLength).toString() || this.previousParams.toString() !== this.params.slice(0, this.paramsLength).toString();
  }
  getPath2D() {
    return this.path2d;
  }
  moveTo(x, y) {
    this.openedPath = true;
    this.sx = x;
    this.sy = y;
    this.cx = x;
    this.cy = y;
    this.path2d.moveTo(x, y);
    this.commands[this.commandsLength++] = 0 /* Move */;
    this.params[this.paramsLength++] = x;
    this.params[this.paramsLength++] = y;
  }
  lineTo(x, y) {
    if (this.openedPath) {
      this.cx = x;
      this.cy = y;
      this.path2d.lineTo(x, y);
      this.commands[this.commandsLength++] = 1 /* Line */;
      this.params[this.paramsLength++] = x;
      this.params[this.paramsLength++] = y;
    } else {
      this.moveTo(x, y);
    }
  }
  cubicCurveTo(cx1, cy1, cx2, cy2, x, y) {
    if (!this.openedPath) {
      this.moveTo(cx1, cy1);
    }
    this.path2d.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
    this.commands[this.commandsLength++] = 2 /* Curve */;
    this.params[this.paramsLength++] = cx1;
    this.params[this.paramsLength++] = cy1;
    this.params[this.paramsLength++] = cx2;
    this.params[this.paramsLength++] = cy2;
    this.params[this.paramsLength++] = x;
    this.params[this.paramsLength++] = y;
  }
  closePath() {
    if (this.openedPath) {
      this.cx = this.sx;
      this.cy = this.sy;
      this.sx = Number.NaN;
      this.sy = Number.NaN;
      this.path2d.closePath();
      this.commands[this.commandsLength++] = 3 /* ClosePath */;
      this.openedPath = false;
      this.closedPath = true;
    }
  }
  rect(x, y, width2, height2) {
    this.moveTo(x, y);
    this.lineTo(x + width2, y);
    this.lineTo(x + width2, y + height2);
    this.lineTo(x, y + height2);
    this.closePath();
  }
  roundRect(x, y, width2, height2, radii) {
    radii = Math.min(radii, width2 / 2, height2 / 2);
    this.moveTo(x, y + radii);
    this.arc(x + radii, y + radii, radii, Math.PI, 1.5 * Math.PI);
    this.lineTo(x + radii, y);
    this.lineTo(x + width2 - radii, y);
    this.arc(x + width2 - radii, y + radii, radii, 1.5 * Math.PI, 2 * Math.PI);
    this.lineTo(x + width2, y + radii);
    this.lineTo(x + width2, y + height2 - radii);
    this.arc(x + width2 - radii, y + height2 - radii, radii, 0, Math.PI / 2);
    this.lineTo(x + width2 - radii, y + height2);
    this.lineTo(x + radii, y + height2);
    this.arc(x + +radii, y + height2 - radii, radii, Math.PI / 2, Math.PI);
    this.lineTo(x, y + height2 - radii);
    this.closePath();
  }
  ellipse(cx, cy, rx, ry, rotation, sAngle, eAngle, counterClockwise = false) {
    const r = rx;
    const scaleY = ry / rx;
    const mxx = Math.cos(rotation);
    const myx = Math.sin(rotation);
    const mxy = -scaleY * myx;
    const myy = scaleY * mxx;
    const x0 = r * Math.cos(sAngle);
    const y0 = r * Math.sin(sAngle);
    const sx = cx + mxx * x0 + mxy * y0;
    const sy = cy + myx * x0 + myy * y0;
    const distanceSquared2 = (sx - this.cx) ** 2 + (sy - this.cy) ** 2;
    if (!this.openedPath) {
      this.moveTo(sx, sy);
    } else if (distanceSquared2 > 1e-6) {
      this.lineTo(sx, sy);
    }
    let sweep = counterClockwise ? -normalizeAngle360(sAngle - eAngle) : normalizeAngle360(eAngle - sAngle);
    if (Math.abs(Math.abs(eAngle - sAngle) - 2 * Math.PI) < 1e-6 && sweep < 2 * Math.PI) {
      sweep += 2 * Math.PI * (counterClockwise ? -1 : 1);
    }
    const arcSections = Math.max(Math.ceil(Math.abs(sweep) / (Math.PI / 2)), 1);
    const step = sweep / arcSections;
    const h = 4 / 3 * Math.tan(step / 4);
    for (let i = 0; i < arcSections; i += 1) {
      const a0 = sAngle + step * (i + 0);
      const a1 = sAngle + step * (i + 1);
      const rSinStart = r * Math.sin(a0);
      const rCosStart = r * Math.cos(a0);
      const rSinEnd = r * Math.sin(a1);
      const rCosEnd = r * Math.cos(a1);
      const cp1x = rCosStart - h * rSinStart;
      const cp1y = rSinStart + h * rCosStart;
      const cp2x = rCosEnd + h * rSinEnd;
      const cp2y = rSinEnd - h * rCosEnd;
      const cp3x = rCosEnd;
      const cp3y = rSinEnd;
      this.cubicCurveTo(
        cx + mxx * cp1x + mxy * cp1y,
        cy + myx * cp1x + myy * cp1y,
        cx + mxx * cp2x + mxy * cp2y,
        cy + myx * cp2x + myy * cp2y,
        cx + mxx * cp3x + mxy * cp3y,
        cy + myx * cp3x + myy * cp3y
      );
    }
  }
  arc(x, y, r, sAngle, eAngle, counterClockwise) {
    this.ellipse(x, y, r, r, 0, sAngle, eAngle, counterClockwise);
  }
  appendSvg(svg) {
    const parts = parseSvg(svg);
    if (parts == null)
      return false;
    let sx = 0;
    let sy = 0;
    let cx;
    let cy;
    let cpx = 0;
    let cpy = 0;
    for (const { command, params } of parts) {
      cx ?? (cx = params[0]);
      cy ?? (cy = params[1]);
      const relative = command === command.toLowerCase();
      const dx = relative ? cx : 0;
      const dy = relative ? cy : 0;
      switch (command.toLowerCase()) {
        case "m":
          this.moveTo(dx + params[0], dy + params[1]);
          cx = dx + params[0];
          cy = dy + params[1];
          sx = cx;
          sy = cy;
          break;
        case "c":
          this.cubicCurveTo(
            dx + params[0],
            dy + params[1],
            dx + params[2],
            dy + params[3],
            dx + params[4],
            dy + params[5]
          );
          cpx = dx + params[2];
          cpy = dy + params[3];
          cx = dx + params[4];
          cy = dy + params[5];
          break;
        case "s":
          this.cubicCurveTo(
            cx + cx - cpx,
            cy + cy - cpy,
            dx + params[0],
            dy + params[1],
            dx + params[2],
            dy + params[3]
          );
          cpx = dx + params[0];
          cpy = dy + params[1];
          cx = dx + params[2];
          cy = dy + params[3];
          break;
        case "q":
          this.cubicCurveTo(
            (dx + 2 * params[0]) / 3,
            (dy + 2 * params[1]) / 3,
            (2 * params[0] + params[2]) / 3,
            (2 * params[1] + params[3]) / 3,
            params[2],
            params[3]
          );
          cpx = params[0];
          cpy = params[1];
          cx = params[2];
          cy = params[3];
          break;
        case "t":
          this.cubicCurveTo(
            (cx + 2 * (cx + cx - cpx)) / 3,
            (cy + 2 * (cy + cy - cpy)) / 3,
            (2 * (cx + cx - cpx) + params[0]) / 3,
            (2 * (cy + cy - cpy) + params[1]) / 3,
            params[0],
            params[1]
          );
          cpx = cx + cx - cpx;
          cpy = cy + cy - cpy;
          cx = params[0];
          cy = params[1];
          break;
        case "a":
          this.svgEllipse(
            cx,
            cy,
            params[0],
            params[1],
            params[2] * Math.PI / 180,
            params[3],
            params[4],
            dx + params[5],
            dy + params[6]
          );
          cx = dx + params[5];
          cy = dy + params[6];
          break;
        case "h":
          this.lineTo(dx + params[0], cy);
          cx = dx + params[0];
          break;
        case "l":
          this.lineTo(dx + params[0], dy + params[1]);
          cx = dx + params[0];
          cy = dy + params[1];
          break;
        case "v":
          this.lineTo(cx, dy + params[0]);
          cy = dy + params[0];
          break;
        case "z":
          this.closePath();
          cx = sx;
          cy = sy;
          break;
        default:
          throw new Error(`Could not translate command '${command}' with '${params.join(" ")}'`);
      }
    }
    return true;
  }
  svgEllipse(x1, y1, rx, ry, rotation, fA, fS, x2, y2) {
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const sin = Math.sin(rotation);
    const cos = Math.cos(rotation);
    const rotX = cos * dx + sin * dy;
    const rotY = -sin * dx + cos * dy;
    const normX = rotX / rx;
    const normY = rotY / ry;
    let scale = normX * normX + normY * normY;
    let cx = (x1 + x2) / 2;
    let cy = (y1 + y2) / 2;
    let cpx = 0;
    let cpy = 0;
    if (scale >= 1) {
      scale = Math.sqrt(scale);
      rx *= scale;
      ry *= scale;
    } else {
      scale = Math.sqrt(1 / scale - 1);
      if (fA === fS)
        scale = -scale;
      cpx = scale * rx * normY;
      cpy = -scale * ry * normX;
      cx += cos * cpx - sin * cpy;
      cy += sin * cpx + cos * cpy;
    }
    const sAngle = Math.atan2((rotY - cpy) / ry, (rotX - cpx) / rx);
    const deltaTheta = Math.atan2((-rotY - cpy) / ry, (-rotX - cpx) / rx) - sAngle;
    const eAngle = sAngle + deltaTheta;
    const counterClockwise = fS === 0;
    this.ellipse(cx, cy, rx, ry, rotation, sAngle, eAngle, counterClockwise);
  }
  clear(trackChanges) {
    if (trackChanges) {
      this.previousCommands = this.commands.slice(0, this.commandsLength);
      this.previousParams = this.params.slice(0, this.paramsLength);
      this.previousClosedPath = this.closedPath;
      this.commands = [];
      this.params = [];
      this.commandsLength = 0;
      this.paramsLength = 0;
    } else {
      this.commandsLength = 0;
      this.paramsLength = 0;
    }
    const Path2DCtor = getPath2D();
    this.path2d = new Path2DCtor();
    this.openedPath = false;
    this.closedPath = false;
  }
  isPointInPath(x, y) {
    const commands = this.commands;
    const params = this.params;
    const cn = this.commandsLength;
    let sx = Number.NaN;
    let sy = Number.NaN;
    let px = 0;
    let py = 0;
    let crossings = 0;
    for (let ci = 0, pi = 0; ci < cn; ci++) {
      switch (commands[ci]) {
        case 0 /* Move */:
          crossings += rayCrossesLine(px, py, sx, sy, x, y);
          px = params[pi++];
          sx = px;
          py = params[pi++];
          sy = py;
          break;
        case 1 /* Line */:
          crossings += rayCrossesLine(px, py, params[pi++], params[pi++], x, y);
          px = params[pi - 2];
          py = params[pi - 1];
          break;
        case 2 /* Curve */:
          crossings += rayCrossesCubic(
            px,
            py,
            params[pi++],
            params[pi++],
            params[pi++],
            params[pi++],
            params[pi++],
            params[pi++],
            x,
            y
          );
          px = params[pi - 2];
          py = params[pi - 1];
          break;
        case 3 /* ClosePath */:
          crossings += rayCrossesLine(px, py, sx, sy, x, y);
          px = sx;
          py = sy;
          break;
      }
    }
    return crossings % 2 === 1;
  }
  distanceSquared(x, y) {
    let best = Infinity;
    const commands = this.commands;
    const params = this.params;
    const cn = this.commandsLength;
    let sx = Number.NaN;
    let sy = Number.NaN;
    let cx = 0;
    let cy = 0;
    for (let ci = 0, pi = 0; ci < cn; ci++) {
      switch (commands[ci]) {
        case 0 /* Move */:
          cx = sx = params[pi++];
          cy = sy = params[pi++];
          break;
        case 1 /* Line */: {
          const x0 = cx;
          const y0 = cy;
          cx = params[pi++];
          cy = params[pi++];
          best = lineDistanceSquared(x, y, x0, y0, cx, cy, best);
          break;
        }
        case 2 /* Curve */: {
          const cp0x = cx;
          const cp0y = cy;
          const cp1x = params[pi++];
          const cp1y = params[pi++];
          const cp2x = params[pi++];
          const cp2y = params[pi++];
          cx = params[pi++];
          cy = params[pi++];
          best = Math.min(best, bezier2DDistance(cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cx, cy, x, y) ** 2);
          break;
        }
        case 3 /* ClosePath */:
          best = lineDistanceSquared(x, y, cx, cy, sx, sy, best);
          break;
      }
    }
    return best;
  }
  // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
  toSVG(transform = (x, y) => ({ x, y })) {
    const buffer = [];
    const { commands, params } = this;
    const addCommand = (command, count) => {
      buffer.push(command);
      for (let i = 0; i < count; i += 2) {
        const { x, y } = transform(params[pi++], params[pi++]);
        buffer.push(x, y);
      }
    };
    let pi = 0;
    for (let ci = 0; ci < this.commandsLength; ci++) {
      const command = commands[ci];
      switch (command) {
        case 0 /* Move */:
          addCommand("M", 2);
          break;
        case 1 /* Line */:
          addCommand("L", 2);
          break;
        case 2 /* Curve */:
          addCommand("C", 6);
          break;
        case 3 /* ClosePath */:
          addCommand("Z", 0);
          break;
      }
    }
    return buffer.join(" ");
  }
  computeBBox() {
    const { commands, params } = this;
    let [top, left, right, bot] = [Infinity, Infinity, -Infinity, -Infinity];
    let [cx, cy] = [Number.NaN, Number.NaN];
    let [sx, sy] = [Number.NaN, Number.NaN];
    const joinPoint = (x, y) => {
      top = Math.min(y, top);
      left = Math.min(x, left);
      right = Math.max(x, right);
      bot = Math.max(y, bot);
      cx = x;
      cy = y;
    };
    let pi = 0;
    for (let ci = 0; ci < this.commandsLength; ci++) {
      const command = commands[ci];
      switch (command) {
        case 0 /* Move */:
          joinPoint(params[pi++], params[pi++]);
          sx = cx;
          sy = cy;
          break;
        case 1 /* Line */:
          joinPoint(params[pi++], params[pi++]);
          break;
        case 2 /* Curve */: {
          const cp0x = cx;
          const cp0y = cy;
          const cp1x = params[pi++];
          const cp1y = params[pi++];
          const cp2x = params[pi++];
          const cp2y = params[pi++];
          const cp3x = params[pi++];
          const cp3y = params[pi++];
          const ts = bezier2DExtrema(cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
          for (const t of ts) {
            const px = evaluateBezier(cp0x, cp1x, cp2x, cp3x, t);
            const py = evaluateBezier(cp0y, cp1y, cp2y, cp3y, t);
            joinPoint(px, py);
          }
          joinPoint(cp3x, cp3y);
          break;
        }
        case 3 /* ClosePath */:
          joinPoint(sx, sy);
          sx = Number.NaN;
          sy = Number.NaN;
          break;
      }
    }
    return new BBox(left, top, right - left, bot - top);
  }
  /**
   * Approximates the path as one polygon (array of points) per subpath, sampling each cubic into
   * `curveSamples` segments. Pure geometry — no canvas — for containment/area analysis.
   */
  flatten(curveSamples = 16) {
    const { commands, params } = this;
    const polygons = [];
    let current = [];
    let cx = Number.NaN;
    let cy = Number.NaN;
    let sx = Number.NaN;
    let sy = Number.NaN;
    const push = (x, y) => {
      current.push({ x, y });
      cx = x;
      cy = y;
    };
    let pi = 0;
    for (let ci = 0; ci < this.commandsLength; ci++) {
      switch (commands[ci]) {
        case 0 /* Move */:
          if (current.length > 0)
            polygons.push(current);
          current = [];
          push(params[pi++], params[pi++]);
          sx = cx;
          sy = cy;
          break;
        case 1 /* Line */:
          push(params[pi++], params[pi++]);
          break;
        case 2 /* Curve */: {
          const [c0x, c0y] = [cx, cy];
          const c1x = params[pi++];
          const c1y = params[pi++];
          const c2x = params[pi++];
          const c2y = params[pi++];
          const c3x = params[pi++];
          const c3y = params[pi++];
          for (let i = 1; i <= curveSamples; i++) {
            const t = i / curveSamples;
            push(evaluateBezier(c0x, c1x, c2x, c3x, t), evaluateBezier(c0y, c1y, c2y, c3y, t));
          }
          break;
        }
        case 3 /* ClosePath */:
          if (!Number.isNaN(sx))
            push(sx, sy);
          break;
      }
    }
    if (current.length > 0)
      polygons.push(current);
    return polygons;
  }
};
function rayCrossesLine(x0, y0, x1, y1, x, y) {
  if (y0 > y === y1 > y) {
    return 0;
  }
  return x0 + (y - y0) / (y1 - y0) * (x1 - x0) < x ? 1 : 0;
}
function rayCrossesCubic(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, x, y) {
  const a = 3 * (-p0y + 3 * p1y - 3 * p2y + p3y);
  const b = 6 * (p0y - 2 * p1y + p2y);
  const c = 3 * (p1y - p0y);
  let split0 = 1;
  let split1 = 1;
  if (a === 0) {
    if (b !== 0) {
      split0 = -c / b;
    }
  } else {
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant);
      split0 = (-b - root) / (2 * a);
      split1 = (-b + root) / (2 * a);
    }
  }
  if (split0 > split1) {
    [split0, split1] = [split1, split0];
  }
  let crossings = 0;
  let ta = 0;
  let ya = p0y;
  for (let piece = 0; piece < 3; piece++) {
    let tb = 1;
    if (piece === 0) {
      tb = split0;
    } else if (piece === 1) {
      tb = split1;
    }
    if (!(tb > ta && tb <= 1)) {
      continue;
    }
    const yb = tb === 1 ? p3y : evaluateBezier(p0y, p1y, p2y, p3y, tb);
    if (ya > y !== yb > y) {
      const rising = yb > ya;
      let lo = ta;
      let hi = tb;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (evaluateBezier(p0y, p1y, p2y, p3y, mid) < y === rising) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      if (evaluateBezier(p0x, p1x, p2x, p3x, (lo + hi) / 2) < x) {
        crossings++;
      }
    }
    ta = tb;
    ya = yb;
  }
  return crossings;
}

// packages/ag-charts-core/src/chart/scale/colorScaleUtil.ts
function findNextDefinedStop(fills, from3) {
  for (let j = from3 + 1; j < fills.length; j++) {
    if (fills[j]?.stop != null)
      return j;
  }
  return fills.length - 1;
}
function resolveStopPositions(fills, d0, d1, isDiscrete) {
  const stops = new Array(fills.length);
  let previousDefinedStopIndex = 0;
  let nextDefinedStopIndex = -1;
  for (let i = 0; i < fills.length; i++) {
    if (i >= nextDefinedStopIndex) {
      nextDefinedStopIndex = findNextDefinedStop(fills, i);
    }
    const stop = toNumberOrUndefined(fills[i]?.stop);
    if (stop == null) {
      const stop0 = toNumberOrUndefined(fills[previousDefinedStopIndex]?.stop);
      const stop1 = toNumberOrUndefined(fills[nextDefinedStopIndex]?.stop);
      const value0 = stop0 ?? d0;
      const value1 = stop1 ?? d1;
      const offset = isDiscrete && stop0 == null ? 1 : 0;
      stops[i] = value0 + (value1 - value0) * (i - previousDefinedStopIndex + offset) / (nextDefinedStopIndex - previousDefinedStopIndex + offset);
    } else {
      stops[i] = stop;
      previousDefinedStopIndex = i;
    }
  }
  return stops;
}
function formatColorScaleBinLabel(bin, index, bins, formatValueFn) {
  if (bin.name != null) {
    return bin.name;
  }
  const isLast = index === bins.length - 1;
  if (Number.isInteger(bin.start) && Number.isInteger(bin.end) && !isLast && bin.end - bin.start >= 1) {
    return `${formatValueFn(bin.start, 0)}\u2013${formatValueFn(bin.end - 1, 0)}`;
  }
  return `${formatValueFn(bin.start)}\u2013${formatValueFn(bin.end)}`;
}
function computeColorBins(fills, domain, mode) {
  if (fills.length === 0) {
    return { domain: [], range: [], bins: [] };
  }
  const d0 = toNumber(domain[0]);
  const d1 = toNumber(domain[1]);
  const isDiscrete = mode === "discrete";
  const resolvedStops = resolveStopPositions(fills, d0, d1, isDiscrete);
  const resolvedColors = fills.map((fill) => fill.color);
  if (isDiscrete) {
    return buildDiscreteBins(resolvedStops, resolvedColors, fills, d0, d1);
  }
  return { domain: resolvedStops, range: resolvedColors, bins: [] };
}
function buildDiscreteBins(stops, colors, fills, d0, d1) {
  const domain = [];
  const range2 = [];
  const bins = [];
  for (let i = 0; i < fills.length; i++) {
    const binStart = i === 0 ? d0 : stops[i - 1];
    const binEnd = stops[i];
    const clampedStart = clamp(d0, binStart, d1);
    const clampedEnd = Math.max(clampedStart, clamp(d0, binEnd, d1));
    domain.push(clampedStart);
    range2.push(colors[i]);
    bins.push({
      start: clampedStart,
      end: clampedEnd,
      color: colors[i],
      name: fills[i].name
    });
  }
  domain.push(bins.at(-1).end);
  return { domain, range: range2, bins };
}
function deriveNormalizedStops(colorScale) {
  const { domain, range: range2, mode, displayDomain } = colorScale;
  if (range2.length === 0)
    return [];
  const [d0, d1] = displayDomain ? [toNumber(displayDomain[0]), toNumber(displayDomain[1])] : [domain[0], domain.at(-1)];
  const span = d1 - d0;
  const extent2 = span === 0 || Number.isNaN(span) ? 1 : span;
  if (mode === "discrete") {
    const stops = [];
    for (let i = 0; i < range2.length; i++) {
      const start2 = clamp(0, (domain[i] - d0) / extent2, 1);
      const end3 = clamp(0, (domain[i + 1] - d0) / extent2, 1);
      if (end3 < start2)
        continue;
      stops.push({ stop: start2, color: range2[i] });
      if (end3 > start2)
        stops.push({ stop: end3, color: range2[i] });
    }
    return stops;
  }
  if (domain.length < range2.length) {
    const count = Math.max(range2.length - 1, 1);
    return range2.map((color2, i) => ({ stop: i / count, color: color2 }));
  }
  return domain.map((v, i) => ({ stop: (v - d0) / extent2, color: range2[i] }));
}
function formatColorBinLabel(start2, end3, index, count, formatValue2) {
  const bin = { start: start2, end: end3, color: "" };
  return formatColorScaleBinLabel(bin, index, { length: count }, formatValue2);
}
function findDiscreteColorBinLabel(colorScale, fills, value, formatValueFn) {
  const { domain, range: range2, mode } = colorScale;
  if (mode !== "discrete" || range2.length === 0)
    return void 0;
  let i = 0;
  while (i < range2.length - 1 && value >= domain[i + 1])
    i++;
  return fills[i]?.name ?? formatColorBinLabel(domain[i], domain[i + 1], i, range2.length, formatValueFn);
}
function discreteColorStops(colorStops) {
  return colorStops.flatMap((colorStop2, i) => {
    const { stop } = colorStop2;
    const nextColor = colorStops.at(i + 1)?.color;
    return nextColor == null ? [colorStop2] : [colorStop2, { stop, color: nextColor }];
  });
}

// packages/ag-charts-core/src/chart/scale/abstractScale.ts
var AbstractScale = class {
  constructor() {
    this.logger = ambientLogger;
  }
  invertWithPercentage(value) {
    return this.invert(value, true);
  }
  snapshotDomain() {
    return this.domain;
  }
  restoreDomain(snapshot) {
    this.domain = snapshot;
  }
  get domainMin() {
    return this.getDomainMinMax()[0];
  }
  get domainMax() {
    return this.getDomainMinMax()[1];
  }
  ticks(_ticks, _domain, _visibleRange) {
    return void 0;
  }
  niceDomain(_ticks, domain = this.domain) {
    return domain;
  }
  get bandwidth() {
    return void 0;
  }
  get step() {
    return void 0;
  }
  get inset() {
    return void 0;
  }
};

// packages/ag-charts-core/src/chart/scale/scaleUtil.ts
function visibleTickRange(ticks, reversed, visibleRange) {
  if (visibleRange == null || visibleRange[0] === 0 && visibleRange[1] === 1)
    return;
  const vt0 = clamp(0, Math.floor(visibleRange[0] * ticks.length), ticks.length);
  const vt1 = clamp(0, Math.ceil(visibleRange[1] * ticks.length), ticks.length);
  const t0 = reversed ? ticks.length - vt1 : vt0;
  const t1 = reversed ? ticks.length - vt0 : vt1;
  return [t0, t1];
}
function visibleTickSliceIndices(ticks, reversed, visibleRange) {
  return visibleTickRange(ticks, reversed, visibleRange) ?? [0, ticks.length];
}
function filterVisibleTicks(ticks, reversed, visibleRange) {
  const tickRange = visibleTickRange(ticks, reversed, visibleRange);
  if (tickRange == null)
    return { ticks, count: ticks.length, firstTickIndex: 0 };
  const [t0, t1] = tickRange;
  return {
    ticks: ticks.slice(t0, t1),
    count: ticks.length,
    firstTickIndex: t0
  };
}
function unpackDomainMinMax(domain) {
  const min = readIntegratedWrappedValue(domain.at(0));
  const max = readIntegratedWrappedValue(domain.at(-1));
  return min != void 0 && max != void 0 ? [min, max] : [void 0, void 0];
}
function extractDomain(value) {
  return value.domain;
}

// packages/ag-charts-core/src/chart/scale/colorScale.ts
var convertColorStringToOklcha = (v) => {
  const color2 = Color.fromString(v);
  const [l, c, h] = Color.RGBtoOKLCH(color2.r, color2.g, color2.b);
  return { l, c, h, a: color2.a };
};
var delta = 1e-6;
var MAX_CONVERT_CACHE_SIZE = 4096;
var isAchromatic = (x) => x.c < delta || x.l < delta || x.l > 1 - delta;
var interpolateOklch = (x, y, d) => {
  d = clamp(0, d, 1);
  let h;
  if (isAchromatic(x)) {
    h = y.h;
  } else if (isAchromatic(y)) {
    h = x.h;
  } else {
    const xH = x.h;
    let yH = y.h;
    const deltaH = y.h - x.h;
    if (deltaH > 180) {
      yH -= 360;
    } else if (deltaH < -180) {
      yH += 360;
    }
    h = xH * (1 - d) + yH * d;
  }
  const c = x.c * (1 - d) + y.c * d;
  const l = x.l * (1 - d) + y.l * d;
  const a = x.a * (1 - d) + y.a * d;
  return Color.fromOKLCH(l, c, h, a);
};
var ColorScale = class extends AbstractScale {
  constructor() {
    super(...arguments);
    this.type = "color";
    this.defaultTickCount = 0;
    this.invalid = true;
    this._domain = [0, 1];
    this._range = ["red", "blue"];
    this._mode = "continuous";
    this.parsedRange = this.range.map(convertColorStringToOklcha);
    // OPTIMIZATION: OKLCH interpolation and RGBA-string allocation dominate heat-map redraws, where
    // the same value recurs across cells and frames. Cleared in update() on any domain/range/mode
    // change. At the cap we stop inserting rather than clearing, which would thrash mid-redraw.
    this.convertCache = /* @__PURE__ */ new Map();
  }
  get domain() {
    return this._domain;
  }
  set domain(value) {
    if (value === this._domain)
      return;
    this._domain = value;
    this.invalid = true;
  }
  get range() {
    return this._range;
  }
  set range(value) {
    if (value === this._range)
      return;
    this._range = value;
    this.invalid = true;
  }
  get mode() {
    return this._mode;
  }
  set mode(value) {
    if (value === this._mode)
      return;
    this._mode = value;
    this.invalid = true;
  }
  update() {
    this.convertCache.clear();
    const { domain, range: range2 } = this;
    if (domain.length < 2) {
      this.logger.warnOnce("`colorDomain` should have at least 2 values.");
      if (domain.length === 0) {
        domain.push(0, 1);
      } else if (domain.length === 1) {
        domain.push(domain[0] + 1);
      }
    }
    for (let i = 1; i < domain.length; i++) {
      const a = domain[i - 1];
      const b = domain[i];
      if (a > b) {
        this.logger.warnOnce("`colorDomain` values should be supplied in ascending order.");
        domain.sort((a2, b2) => a2 - b2);
        break;
      }
    }
    const expectedLength = this.mode === "discrete" ? domain.length - 1 : domain.length;
    if (range2.length < expectedLength) {
      for (let i = range2.length; i < expectedLength; i++) {
        range2.push(range2.length > 0 ? range2[0] : "black");
      }
    }
    this.parsedRange = this.range.map(convertColorStringToOklcha);
  }
  normalizeDomains(...domains) {
    return { domain: domains.flatMap((d) => d.domain), animatable: true };
  }
  toDomain() {
    return;
  }
  convert(x) {
    this.refresh();
    const xn = toNumber(x);
    const cached = this.convertCache.get(xn);
    if (cached !== void 0) {
      return cached;
    }
    const result = this.computeColor(xn);
    if (this.convertCache.size < MAX_CONVERT_CACHE_SIZE) {
      this.convertCache.set(xn, result);
    }
    return result;
  }
  computeColor(xn) {
    const { domain, range: range2, parsedRange } = this;
    const d0 = domain[0];
    const d1 = domain.at(-1);
    const r0 = range2[0];
    const r1 = range2.at(-1);
    if (xn <= d0) {
      return r0;
    }
    if (xn >= d1) {
      return r1;
    }
    let index;
    let q;
    if (domain.length === 2) {
      const t = (xn - d0) / (d1 - d0);
      const step = 1 / (range2.length - 1);
      index = range2.length <= 2 ? 0 : Math.min(Math.floor(t * (range2.length - 1)), range2.length - 2);
      q = (t - index * step) / step;
    } else {
      for (index = 0; index < domain.length - 2; index++) {
        if (xn < domain[index + 1]) {
          break;
        }
      }
      const a = domain[index];
      const b = domain[index + 1];
      q = (xn - a) / (b - a);
    }
    if (this.mode === "discrete") {
      return range2[index];
    }
    const c0 = parsedRange[index];
    const c1 = parsedRange[index + 1];
    return interpolateOklch(c0, c1, q).toRgbaString();
  }
  invert() {
    return;
  }
  getDomainMinMax() {
    return unpackDomainMinMax(this.domain);
  }
  refresh() {
    if (!this.invalid)
      return;
    this.invalid = false;
    this.update();
    if (this.invalid) {
      this.logger.warnOnce("Expected update to not invalidate scale");
    }
  }
};

// packages/ag-charts-core/src/scene/gradient/gradient.ts
var Gradient = class {
  constructor(colorSpace, stops = [], bbox) {
    this.colorSpace = colorSpace;
    this.stops = stops;
    this.bbox = bbox;
    this._cache = void 0;
  }
  createGradient(ctx, shapeBbox, params) {
    const bbox = this.bbox ?? shapeBbox;
    if (!bbox.isFinite()) {
      return;
    }
    if (this._cache?.ctx === ctx && this._cache.bbox.equals(bbox)) {
      return this._cache.gradient;
    }
    const { stops, colorSpace } = this;
    if (stops.length === 0)
      return;
    if (stops.length === 1)
      return stops[0].color;
    let gradient2 = this.createCanvasGradient(ctx, bbox, params);
    if (gradient2 == null)
      return;
    const isOkLch = colorSpace === "oklch";
    const step = 0.05;
    let c0 = stops[0];
    gradient2.addColorStop(c0.stop, c0.color);
    for (let i = 1; i < stops.length; i += 1) {
      const c1 = stops[i];
      if (isOkLch) {
        const scale = new ColorScale();
        scale.domain = [c0.stop, c1.stop];
        scale.range = [c0.color, c1.color];
        for (let stop = c0.stop + step; stop < c1.stop; stop += step) {
          gradient2.addColorStop(stop, scale.convert(stop) ?? "transparent");
        }
      }
      gradient2.addColorStop(c1.stop, c1.color);
      c0 = c1;
    }
    if ("createPattern" in gradient2) {
      gradient2 = gradient2.createPattern();
    }
    this._cache = { ctx, bbox, gradient: gradient2 };
    return gradient2;
  }
  toSvg(shapeBbox) {
    const bbox = this.bbox ?? shapeBbox;
    const gradient2 = this.createSvgGradient(bbox);
    for (const { stop: offset, color: color2 } of this.stops) {
      const stop = createSvgElement("stop");
      stop.setAttribute("offset", `${offset}`);
      stop.setAttribute("stop-color", `${color2}`);
      gradient2.appendChild(stop);
    }
    return gradient2;
  }
};

// packages/ag-charts-core/src/scene/gradient/conicGradient.ts
var ConicGradient = class extends Gradient {
  constructor(colorSpace, stops, angle2 = 0, bbox) {
    super(colorSpace, stops, bbox);
    this.angle = angle2;
  }
  createCanvasGradient(ctx, bbox, params) {
    const angleOffset = -90;
    const { angle: angle2 } = this;
    const radians = normalizeAngle360FromDegrees(angle2 + angleOffset);
    const cx = params?.centerX ?? bbox.x + bbox.width * 0.5;
    const cy = params?.centerY ?? bbox.y + bbox.height * 0.5;
    return ctx.createConicGradient(radians, cx, cy);
  }
  createSvgGradient(_bbox) {
    return createSvgElement("linearGradient");
  }
};

// packages/ag-charts-core/src/scene/gradient/linearGradient.ts
var LinearGradient = class extends Gradient {
  constructor(colorSpace, stops, angle2 = 0, bbox) {
    super(colorSpace, stops, bbox);
    this.angle = angle2;
  }
  getGradientPoints(bbox) {
    const angleOffset = 90;
    const { angle: angle2 } = this;
    const radians = normalizeAngle360FromDegrees(angle2 + angleOffset);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const w = bbox.width;
    const h = bbox.height;
    const cx = bbox.x + w * 0.5;
    const cy = bbox.y + h * 0.5;
    const diagonal = Math.hypot(h, w) / 2;
    const diagonalAngle = Math.atan2(h, w);
    let quarteredAngle;
    if (radians < Math.PI / 2) {
      quarteredAngle = radians;
    } else if (radians < Math.PI) {
      quarteredAngle = Math.PI - radians;
    } else if (radians < 1.5 * Math.PI) {
      quarteredAngle = radians - Math.PI;
    } else {
      quarteredAngle = 2 * Math.PI - radians;
    }
    const l = diagonal * Math.abs(Math.cos(quarteredAngle - diagonalAngle));
    return { x0: cx + cos * l, y0: cy + sin * l, x1: cx - cos * l, y1: cy - sin * l };
  }
  createCanvasGradient(ctx, bbox) {
    const { x0, y0, x1, y1 } = this.getGradientPoints(bbox);
    if (Number.isNaN(x0) || Number.isNaN(y0) || Number.isNaN(x1) || Number.isNaN(y1)) {
      return void 0;
    }
    return ctx.createLinearGradient(x0, y0, x1, y1);
  }
  createSvgGradient(bbox) {
    const { x0, y0, x1, y1 } = this.getGradientPoints(bbox);
    const gradient2 = createSvgElement("linearGradient");
    gradient2.setAttribute("x1", String(x0));
    gradient2.setAttribute("y1", String(y0));
    gradient2.setAttribute("x2", String(x1));
    gradient2.setAttribute("y2", String(y1));
    gradient2.setAttribute("gradientUnits", "userSpaceOnUse");
    return gradient2;
  }
};

// packages/ag-charts-core/src/scene/gradient/radialGradient.ts
var RadialGradient = class extends Gradient {
  constructor(colorSpace, stops, bbox) {
    super(colorSpace, stops, bbox);
  }
  createCanvasGradient(ctx, bbox, params) {
    const cx = params?.centerX ?? bbox.x + bbox.width * 0.5;
    const cy = params?.centerY ?? bbox.y + bbox.height * 0.5;
    const innerRadius = params?.innerRadius ?? 0;
    const outerRadius = params?.outerRadius ?? Math.hypot(bbox.width * 0.5, bbox.height * 0.5) / Math.SQRT2;
    return ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
  }
  createSvgGradient(bbox) {
    const cx = bbox.x + bbox.width * 0.5;
    const cy = bbox.y + bbox.height * 0.5;
    const gradient2 = createSvgElement("radialGradient");
    gradient2.setAttribute("cx", String(cx));
    gradient2.setAttribute("cy", String(cy));
    gradient2.setAttribute("r", String(Math.hypot(bbox.width * 0.5, bbox.height * 0.5) / Math.SQRT2));
    gradient2.setAttribute("gradientUnits", "userSpaceOnUse");
    return gradient2;
  }
};

// packages/ag-charts-core/src/scene/gradient/stops.ts
function getDefaultColorStops(defaultColorStops, fillMode) {
  const stopOffset = fillMode === "discrete" ? 1 : 0;
  const colorStops = defaultColorStops.map((color2, index, { length: length2 }) => ({
    stop: (index + stopOffset) / (length2 - 1 + stopOffset),
    color: color2
  }));
  return fillMode === "discrete" ? discreteColorStops(colorStops) : colorStops;
}
function getColorStops(baseFills, defaultColorStops, domain, fillMode = "continuous") {
  const fills = baseFills.map(
    (fill) => typeof fill === "string" ? { color: fill } : fill
  );
  if (fills.length === 0) {
    return getDefaultColorStops(defaultColorStops, fillMode);
  }
  const d0 = Math.min(...domain);
  const d1 = Math.max(...domain);
  const isDiscrete = fillMode === "discrete";
  const stops = resolveStopPositions(fills, d0, d1, isDiscrete);
  let lastDefinedColor = fills.find((c) => c.color != null)?.color;
  let colorScale;
  const colorStops = fills.map((fill, i) => {
    let color2 = fill?.color;
    const stop = Math.max(0, Math.min(1, (stops[i] - d0) / (d1 - d0)));
    if (color2 != null) {
      lastDefinedColor = color2;
    } else if (lastDefinedColor == null) {
      if (colorScale == null) {
        colorScale = new ColorScale();
        colorScale.domain = [0, 1];
        colorScale.range = defaultColorStops;
      }
      color2 = colorScale.convert(stop);
    } else {
      color2 = lastDefinedColor;
    }
    return { stop, color: color2 };
  });
  return fillMode === "discrete" ? discreteColorStops(colorStops) : colorStops;
}

// packages/ag-charts-core/src/rendering/changeDetectable.ts
var TRIPLE_EQ = (lhs, rhs) => lhs === rhs;
function SceneChangeDetection(opts) {
  return function(target, key) {
    const privateKey = `__${key}`;
    if (target[key])
      return;
    prepareGetSet(target, key, privateKey, opts);
  };
}
function SceneRefChangeDetection(opts) {
  return SceneChangeDetection(opts);
}
function SceneObjectChangeDetection(opts) {
  return SceneChangeDetection(opts);
}
function SceneArrayChangeDetection(opts) {
  const baseOpts = opts ?? {};
  baseOpts.equals = arraysEqual;
  return SceneChangeDetection(opts);
}
function DeclaredSceneChangeDetection(opts) {
  return function(target, key) {
    const privateKey = `__${key}`;
    if (target[key])
      return;
    prepareGetSet(target, key, privateKey, opts);
  };
}
function DeclaredSceneObjectChangeDetection(opts) {
  return function(target, key) {
    const privateKey = `__${key}`;
    if (target[key])
      return;
    prepareGetSet(target, key, privateKey, opts);
  };
}
function prepareGetSet(target, key, privateKey, opts) {
  const { changeCb, convertor, checkDirtyOnAssignment = false } = opts ?? {};
  const requiredOpts = { changeCb, checkDirtyOnAssignment, convertor };
  const setter = buildCheckDirtyChain(
    privateKey,
    buildChangeCallbackChain(
      buildConvertorChain(buildSetter(privateKey, requiredOpts), requiredOpts),
      requiredOpts
    ),
    requiredOpts
  );
  function propertyGetter() {
    return this[privateKey];
  }
  Object.defineProperty(target, key, {
    set: setter,
    get: propertyGetter,
    enumerable: true,
    configurable: true
  });
}
function buildConvertorChain(setterFn, opts) {
  const { convertor } = opts;
  if (convertor) {
    let convertValueAndSet2 = function(value) {
      setterFn.call(this, convertValue(value));
    };
    var convertValueAndSet = convertValueAndSet2;
    const convertValue = convertor;
    return convertValueAndSet2;
  }
  return setterFn;
}
var NO_CHANGE = /*#__PURE__*/ Symbol("no-change");
function buildChangeCallbackChain(setterFn, opts) {
  const { changeCb } = opts;
  if (changeCb) {
    let invokeChangeCallback2 = function(value) {
      const change = setterFn.call(this, value);
      if (change !== NO_CHANGE) {
        changeCallback.call(this, this);
      }
      return change;
    };
    var invokeChangeCallback = invokeChangeCallback2;
    const changeCallback = changeCb;
    return invokeChangeCallback2;
  }
  return setterFn;
}
function buildCheckDirtyChain(privateKey, setterFn, opts) {
  const { checkDirtyOnAssignment } = opts;
  if (checkDirtyOnAssignment) {
    let checkDirtyOnAssignmentFn2 = function(value) {
      const change = setterFn.call(this, value);
      if (value?._dirty === true) {
        this.markDirty(privateKey);
      }
      return change;
    };
    var checkDirtyOnAssignmentFn = checkDirtyOnAssignmentFn2;
    return checkDirtyOnAssignmentFn2;
  }
  return setterFn;
}
function buildSetter(privateKey, opts) {
  const { equals = TRIPLE_EQ } = opts;
  function setWithChangeDetection(value) {
    const oldValue = this[privateKey];
    if (!equals(value, oldValue)) {
      this[privateKey] = value;
      this.onChangeDetection(privateKey);
      return value;
    }
    return NO_CHANGE;
  }
  return setWithChangeDetection;
}

// packages/ag-charts-core/src/scene/zIndex.ts
var cmp = (a, b) => Math.sign(a - b);
function compareZIndex(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return cmp(a, b);
  }
  const aArray = typeof a === "number" ? [a] : a;
  const bArray = typeof b === "number" ? [b] : b;
  const length2 = Math.min(aArray.length, bArray.length);
  for (let i = 0; i < length2; i += 1) {
    const diff = cmp(aArray[i], bArray[i]);
    if (diff !== 0)
      return diff;
  }
  return cmp(aArray.length, bArray.length);
}

// packages/ag-charts-core/src/scene/node.ts
var PointerEvents = /* @__PURE__ */ /*#__PURE__*/ ((PointerEvents2) => {
  PointerEvents2[PointerEvents2["All"] = 0] = "All";
  PointerEvents2[PointerEvents2["None"] = 1] = "None";
  return PointerEvents2;
})(PointerEvents || {});
var MAX_ERROR_COUNT = 5;
var _Node = /*#__PURE__*/ (() => { var _c$5 = class _Node {
  constructor(options) {
    /** Unique number to allow creation order to be easily determined. */
    this.serialNumber = _Node._nextSerialNumber++;
    this.childNodeCounts = { groups: 0, nonGroups: 0, thisComplexity: 0, complexity: 0 };
    /** Unique node ID in the form `ClassName-NaturalNumber`. */
    this.id = createId(this);
    this.name = void 0;
    this.transitionOut = void 0;
    this.pointerEvents = 0 /* All */;
    this._datum = void 0;
    this._previousDatum = void 0;
    this.scene = void 0;
    this._debugDirtyProperties = void 0;
    this.parentNode = void 0;
    this.cachedBBox = void 0;
    /**
     * To simplify the type system (especially in Selections) we don't have the `Parent` node
     * (one that has children). Instead, we mimic HTML DOM, where any node can have children.
     * But we still need to distinguish regular leaf nodes from container leafs somehow.
     */
    this.isContainerNode = false;
    this.visible = true;
    this.zIndex = 0;
    this.batchLevel = 0;
    this.batchDirty = false;
    this.name = options?.name;
    this.tag = options?.tag ?? Number.NaN;
    this.zIndex = options?.zIndex ?? 0;
    this.scene = options?.scene;
    if (options?.debugDirty ?? _Node._debugEnabled) {
      this._debugDirtyProperties = /* @__PURE__ */ new Map([["__first__", []]]);
    }
  }
  static toSVG(node, width2, height2) {
    const svg = node?.toSVG();
    if (svg == null || svg.elements.length === 0 && (svg.defs?.length ?? 0) === 0)
      return;
    const root = createSvgElement("svg");
    root.setAttribute("width", String(width2));
    root.setAttribute("height", String(height2));
    root.setAttribute("viewBox", `0 0 ${width2} ${height2}`);
    root.setAttribute("overflow", "visible");
    if (svg.defs != null && svg.defs.length > 0) {
      const defs = createSvgElement("defs");
      defs.append(...svg.defs);
      root.append(defs);
    }
    root.append(...svg.elements);
    return root.outerHTML;
  }
  static *extractBBoxes(nodes, skipInvisible) {
    for (const n of nodes) {
      if (!skipInvisible || n.visible && !n.transitionOut) {
        const bbox = n.getBBox();
        if (bbox != null)
          yield bbox;
      }
    }
  }
  /**
   * Some arbitrary data bound to the node.
   */
  get datum() {
    return this._datum;
  }
  set datum(datum) {
    if (this._datum !== datum) {
      this._previousDatum = this._datum;
      this._datum = datum;
    }
  }
  get previousDatum() {
    return this._previousDatum;
  }
  /** @deprecated do not use unsafe non-null assertion (`datum!`), used typed `datum` */
  get unsafeNonNullDatum() {
    return this.datum;
  }
  /** @deprecated do not use `any`, used typed `datum` */
  get unsafeDatum() {
    return this.datum;
  }
  /** @deprecated do not use `any`, used typed `datum` */
  set unsafeDatum(datum) {
    this.datum = datum;
  }
  /** @deprecated do not use `any`, used typed `previousDatum` */
  get unsafePreviousDatum() {
    return this.previousDatum;
  }
  get layerManager() {
    return this.scene?.layersManager;
  }
  get imageLoader() {
    return this.scene?.imageLoader;
  }
  closestDatum() {
    for (const { datum } of this.traverseUp(true)) {
      if (datum != null) {
        return datum;
      }
    }
  }
  /** @deprecated do not use `any` */
  unsafeClosestDatum() {
    return this.closestDatum();
  }
  /** Perform any pre-rendering initialization. */
  preRender(_renderCtx, thisComplexity = 1) {
    this.childNodeCounts.groups = 0;
    this.childNodeCounts.nonGroups = 1;
    this.childNodeCounts.complexity = thisComplexity;
    this.childNodeCounts.thisComplexity = thisComplexity;
    if (this.batchLevel > 0 || this.batchDirty) {
      throw new Error("AG Charts - illegal rendering state; batched update in progress");
    }
    return this.childNodeCounts;
  }
  /** Guaranteed isolated render - if there is any failure, the Canvas2D context is returned to its prior state. */
  isolatedRender(renderCtx) {
    const savedFont = renderCtx.currentFont;
    renderCtx.ctx.save();
    try {
      this.render(renderCtx);
    } catch (e) {
      const errorCount = e.errorCount ?? 1;
      if (errorCount >= MAX_ERROR_COUNT) {
        e.errorCount = errorCount;
        throw e;
      }
      renderCtx.logger.warnOnce("Error during rendering", e, e.stack);
    } finally {
      renderCtx.ctx.restore();
      renderCtx.currentFont = savedFont;
    }
  }
  render(renderCtx) {
    const { stats } = renderCtx;
    this.debugDirtyProperties(renderCtx.logger);
    if (renderCtx.debugNodeSearch) {
      const idOrName = this.name ?? this.id;
      if (renderCtx.debugNodeSearch.some((v) => typeof v === "string" ? v === idOrName : v.test(idOrName))) {
        renderCtx.debugNodes[this.name ?? this.id] = this;
      }
    }
    if (stats) {
      stats.nodesRendered++;
      stats.opsPerformed += this.childNodeCounts.thisComplexity;
    }
  }
  setScene(scene) {
    this.scene = scene;
  }
  *traverseUp(includeSelf) {
    if (includeSelf) {
      yield this;
    }
    let node = this.parentNode;
    while (node) {
      yield node;
      node = node.parentNode;
    }
  }
  /**
   * Checks if the node is the root (has no parent).
   */
  isRoot() {
    return !this.parentNode;
  }
  removeChild(node) {
    throw new Error(
      `AG Charts - internal error, unknown child node ${node.name ?? node.id} in $${this.name ?? this.id}`
    );
  }
  remove() {
    this.parentNode?.removeChild(this);
  }
  destroy() {
    if (this.parentNode) {
      this.remove();
    }
  }
  batchedUpdate(fn) {
    this.batchLevel++;
    try {
      fn();
    } finally {
      this.batchLevel--;
      if (this.batchLevel === 0 && this.batchDirty) {
        this.markDirty();
        this.batchDirty = false;
      }
    }
  }
  setProperties(styles) {
    this.batchLevel++;
    try {
      const target = this;
      const source = styles;
      const keys = Object.keys(source);
      for (let i = 0, n = keys.length; i < n; i++) {
        const key = keys[i];
        target[key] = source[key];
      }
    } finally {
      this.batchLevel--;
      if (this.batchLevel === 0 && this.batchDirty) {
        this.markDirty();
        this.batchDirty = false;
      }
    }
    return this;
  }
  setPropertiesWithKeys(styles, keys) {
    this.batchLevel++;
    try {
      const target = this;
      const source = styles;
      for (let i = 0, n = keys.length; i < n; i++) {
        const key = keys[i];
        target[key] = source[key];
      }
    } finally {
      this.batchLevel--;
      if (this.batchLevel === 0 && this.batchDirty) {
        this.markDirty();
        this.batchDirty = false;
      }
    }
    return this;
  }
  containsPoint(_x, _y) {
    return false;
  }
  distanceSquared(_x, _y) {
    return Infinity;
  }
  pickNode(x, y) {
    if (!this.visible || this.pointerEvents === 1 /* None */) {
      return;
    }
    if (this.containsPoint(x, y)) {
      return this;
    }
  }
  pickNodes(x, y, into = []) {
    if (!this.visible || this.pointerEvents === 1 /* None */) {
      return into;
    }
    if (this.containsPoint(x, y)) {
      into.push(this);
    }
    return into;
  }
  getBBox() {
    this.cachedBBox ?? (this.cachedBBox = Object.freeze(this.computeBBox()));
    return this.cachedBBox;
  }
  /**
   * Serialise this node's rendered state to plain data, so consumers (tests, debug tooling) can
   * inspect scene state without reaching into shape internals. Each subclass returns its own
   * {@link SerializedNodeState} variant, accumulating inherited property contributions (including
   * the transform mixins') via {@link serializeProps}.
   */
  serialize() {
    return { type: "node", props: this.serializeProps() };
  }
  serializeProps() {
    return { visible: this.visible };
  }
  computeBBox() {
    return;
  }
  onChangeDetection(property) {
    this.markDirty(property);
  }
  markDirtyChildrenOrder() {
    this.cachedBBox = void 0;
  }
  markDirty(property) {
    if (this.batchLevel > 0) {
      this.batchDirty = true;
      return;
    }
    if (property != null && this._debugDirtyProperties) {
      this.markDebugProperties(property);
    }
    this.cachedBBox = void 0;
    this.parentNode?.markDirty();
  }
  markDebugProperties(property) {
    const sources = this._debugDirtyProperties?.get(property) ?? [];
    const caller = new Error("Stack trace for property change tracking").stack?.split("\n").filter((line) => {
      return line !== "Error" && !line.includes(".markDebugProperties") && !line.includes(".markDirty") && !line.includes("Object.assign ") && !line.includes(`${this.constructor.name}.`);
    }) ?? "unknown";
    sources.push(caller[0].replace(" at ", "").trim());
    this._debugDirtyProperties?.set(property, sources);
  }
  debugDirtyProperties(logger) {
    if (this._debugDirtyProperties == null)
      return;
    if (!this._debugDirtyProperties.has("__first__")) {
      for (const [property, sources] of this._debugDirtyProperties.entries()) {
        if (sources.length > 1) {
          logger.logGroup(
            `Property changed multiple times before render: ${this.constructor.name}.${property} (${sources.length}x)`,
            () => {
              for (const source of sources) {
                logger.log(source);
              }
            }
          );
        }
      }
    }
    this._debugDirtyProperties.clear();
  }
  static handleNodeZIndexChange(target) {
    target.onZIndexChange();
  }
  onZIndexChange() {
    this.parentNode?.markDirtyChildrenOrder();
  }
  /** Override in subclasses that carry a font (Text) or contain font-bearing children (Group). */
  resolveFont() {
    return void 0;
  }
  toSVG() {
    return;
  }
}; _c$5.className = "AbstractNode"; _c$5._nextSerialNumber = 0; _c$5._debugEnabled = false; __decorateClass([
  DeclaredSceneChangeDetection()
], _c$5.prototype, "visible", 2); __decorateClass([
  DeclaredSceneChangeDetection({
    equals: objectsEqual,
    changeCb: _c$5.handleNodeZIndexChange
  })
], _c$5.prototype, "zIndex", 2); return _c$5; })()
var Node = _Node;

// packages/ag-charts-core/src/scene/shadowPass.ts
var shadowPass = { state: "none" };

// packages/ag-charts-core/src/rendering/svgUtil.ts
function setSvgFontAttributes(element2, options) {
  const { fontStyle, fontWeight: fontWeight2, fontSize, fontFamily } = options;
  if (fontStyle != null)
    element2.setAttribute("font-style", fontStyle);
  if (fontWeight2 != null && fontWeight2 !== 0)
    element2.setAttribute("font-weight", String(fontWeight2));
  if (fontSize != null)
    element2.setAttribute("font-size", String(fontSize));
  if (fontFamily != null && fontFamily !== "")
    element2.setAttribute("font-family", fontFamily);
}
function setSvgStrokeAttributes(element2, options) {
  const { stroke, strokeWidth, strokeOpacity } = options;
  if (stroke != null && stroke !== "")
    element2.setAttribute("stroke", stroke);
  if (strokeWidth != null)
    element2.setAttribute("stroke-width", String(strokeWidth));
  if (strokeOpacity != null)
    element2.setAttribute("stroke-opacity", String(strokeOpacity));
}
function setSvgLineDashAttributes(element2, options) {
  const { lineDash, lineDashOffset } = options;
  if (lineDash?.some((d) => d !== 0)) {
    const lineDashArray = lineDash.length % 2 === 1 ? [...lineDash, ...lineDash] : lineDash;
    element2.setAttribute("stroke-dasharray", lineDashArray.join(" "));
    if (lineDashOffset != null)
      element2.setAttribute("stroke-dashoffset", String(lineDashOffset));
  }
}

// packages/ag-charts-core/src/scene/image/image.ts
var Image = class {
  constructor(imageLoader, imageOptions) {
    this.imageLoader = imageLoader;
    this._cache = void 0;
    this.url = imageOptions.url;
    this.backgroundFill = imageOptions.backgroundFill ?? "black";
    this.backgroundFillOpacity = imageOptions.backgroundFillOpacity ?? 1;
    this.repeat = imageOptions.repeat ?? "no-repeat";
    this.width = imageOptions.width;
    this.height = imageOptions.height;
    this.fit = imageOptions.fit ?? "stretch";
    this.rotation = imageOptions.rotation ?? 0;
  }
  createCanvasImage(ctx, image, width2, height2, logger) {
    if (!image)
      return null;
    const [renderedWidth, renderedHeight] = this.getSize(image.width, image.height, width2, height2);
    if (renderedWidth < 1 || renderedHeight < 1) {
      logger.warnOnce("Image fill is too small to render, ignoring.");
      return null;
    }
    return ctx.createPattern(image, this.repeat);
  }
  getSize(imageWidth, imageHeight, width2, height2) {
    const { fit } = this;
    let dw = imageWidth;
    let dh = imageHeight;
    let scale = 1;
    const shapeAspectRatio = width2 / height2;
    const imageAspectRatio = imageWidth / imageHeight;
    if (fit === "stretch" || imageWidth === 0 || imageHeight === 0) {
      dw = width2;
      dh = height2;
    } else if (fit === "contain") {
      scale = imageAspectRatio > shapeAspectRatio ? width2 / imageWidth : height2 / imageHeight;
    } else if (fit === "cover") {
      scale = imageAspectRatio > shapeAspectRatio ? height2 / imageHeight : width2 / imageWidth;
    }
    return [Math.max(1, dw * scale), Math.max(1, dh * scale)];
  }
  setImageTransform(pattern, bbox) {
    if (typeof pattern === "string")
      return;
    const { url, rotation, width: width2, height: height2 } = this;
    const image = this.imageLoader?.loadImage(url);
    if (!image) {
      return;
    }
    const angle2 = normalizeAngle360FromDegrees(rotation);
    const cos = Math.cos(angle2);
    const sin = Math.sin(angle2);
    const [renderedWidth, renderedHeight] = this.getSize(
      image.width,
      image.height,
      width2 ?? bbox.width,
      height2 ?? bbox.height
    );
    const widthScale = renderedWidth / image.width;
    const heightScale = renderedHeight / image.height;
    const bboxCenterX = bbox.x + bbox.width / 2;
    const bboxCenterY = bbox.y + bbox.height / 2;
    const rotatedW = cos * renderedWidth - sin * renderedHeight;
    const rotatedH = sin * renderedWidth + cos * renderedHeight;
    const shapeCenterX = rotatedW / 2;
    const shapeCenterY = rotatedH / 2;
    const DOMMatrixCtor = getDOMMatrix();
    pattern?.setTransform(
      new DOMMatrixCtor([
        cos * widthScale,
        sin * heightScale,
        -sin * widthScale,
        cos * heightScale,
        bboxCenterX - shapeCenterX,
        bboxCenterY - shapeCenterY
      ])
    );
  }
  createPattern(ctx, shapeWidth, shapeHeight, node, logger) {
    const width2 = this.width ?? shapeWidth;
    const height2 = this.height ?? shapeHeight;
    const cache = this._cache;
    if (cache?.ctx === ctx && cache.width === width2 && cache.height === height2) {
      return cache.pattern;
    }
    const image = this.imageLoader?.loadImage(this.url, node);
    const pattern = this.createCanvasImage(ctx, image, width2, height2, logger);
    if (pattern == null)
      return;
    this._cache = { ctx, pattern, width: width2, height: height2 };
    return pattern;
  }
  toSvg(bbox, pixelRatio) {
    const { url, rotation, backgroundFill, backgroundFillOpacity } = this;
    const { x, y, width: width2, height: height2 } = bbox;
    const pattern = createSvgElement("pattern");
    pattern.setAttribute("viewBox", `0 0 ${width2} ${height2}`);
    pattern.setAttribute("x", String(x));
    pattern.setAttribute("y", String(y));
    pattern.setAttribute("width", String(width2));
    pattern.setAttribute("height", String(height2));
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    const rect2 = createSvgElement("rect");
    rect2.setAttribute("x", "0");
    rect2.setAttribute("y", "0");
    rect2.setAttribute("width", String(width2));
    rect2.setAttribute("height", String(height2));
    rect2.setAttribute("fill", backgroundFill);
    rect2.setAttribute("fill-opacity", String(backgroundFillOpacity));
    pattern.appendChild(rect2);
    const image = createSvgElement("image");
    image.setAttribute("href", url);
    image.setAttribute("x", "0");
    image.setAttribute("y", "0");
    image.setAttribute("width", String(width2));
    image.setAttribute("height", String(height2));
    image.setAttribute("preserveAspectRatio", "none");
    image.setAttribute("transform", `scale(${1 / pixelRatio}) rotate(${rotation}, ${width2 / 2}, ${height2 / 2})`);
    pattern.appendChild(image);
    return pattern;
  }
};

// packages/ag-charts-core/src/scene/pattern/patterns.ts
function drawPatternUnitPolygon(path, params, moves) {
  const { width: width2, height: height2, padding: padding2, strokeWidth } = params;
  const x0 = width2 / 2;
  const y0 = height2 / 2;
  const w = Math.max(1, width2 - padding2 - strokeWidth / 2);
  const h = Math.max(1, height2 - padding2 - strokeWidth / 2);
  let didMove = false;
  for (const [dx, dy] of moves) {
    const x = x0 + (dx - 0.5) * w;
    const y = y0 + (dy - 0.5) * h;
    if (didMove) {
      path.lineTo(x, y);
    } else {
      path.moveTo(x, y);
    }
    didMove = true;
  }
  path.closePath();
}
var PATTERNS = {
  circles(path, { width: width2, strokeWidth, padding: padding2 }) {
    const c = width2 / 2;
    const r = Math.max(1, c - padding2 - strokeWidth / 2);
    path.arc(c, c, r, 0, Math.PI * 2);
  },
  squares(path, { width: width2, height: height2, pixelRatio, padding: padding2, strokeWidth }) {
    const offset = padding2 + strokeWidth / 2;
    path.moveTo(align(pixelRatio, offset), align(pixelRatio, offset));
    path.lineTo(align(pixelRatio, width2 - offset), align(pixelRatio, offset));
    path.lineTo(align(pixelRatio, width2 - offset), align(pixelRatio, height2 - offset));
    path.lineTo(align(pixelRatio, offset), align(pixelRatio, height2 - offset));
    path.closePath();
  },
  triangles(path, params) {
    drawPatternUnitPolygon(path, params, [
      [0.5, 0],
      [1, 1],
      [0, 1]
    ]);
  },
  diamonds(path, params) {
    drawPatternUnitPolygon(path, params, [
      [0.5, 0],
      [1, 0.5],
      [0.5, 1],
      [0, 0.5]
    ]);
  },
  stars(path, { width: width2, height: height2, padding: padding2 }) {
    const spikes = 5;
    const outerRadius = Math.max(1, (width2 - padding2) / 2);
    const innerRadius = outerRadius / 2;
    const rotation = Math.PI / 2;
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle2 = i * Math.PI / spikes - rotation;
      const xCoordinate = width2 / 2 + Math.cos(angle2) * radius;
      const yCoordinate = height2 / 2 + Math.sin(angle2) * radius;
      path.lineTo(xCoordinate, yCoordinate);
    }
    path.closePath();
  },
  hearts(path, { width: width2, height: height2, padding: padding2 }) {
    const r = Math.max(1, width2 / 4 - padding2 / 2);
    const x = width2 / 2;
    const y = height2 / 2 + r / 2;
    path.arc(x - r, y - r, r, toRadians(130), toRadians(330));
    path.arc(x + r, y - r, r, toRadians(220), toRadians(50));
    path.lineTo(x, y + r);
    path.closePath();
  },
  crosses(path, params) {
    drawPatternUnitPolygon(path, params, [
      [0.25, 0],
      [0.5, 0.25],
      [0.75, 0],
      [1, 0.25],
      [0.75, 0.5],
      [1, 0.75],
      [0.75, 1],
      [0.5, 0.75],
      [0.25, 1],
      [0, 0.75],
      [0.25, 0.5],
      [0, 0.25]
    ]);
  },
  "vertical-lines"(path, { width: width2, height: height2, pixelRatio, strokeWidth }) {
    const x = align(pixelRatio, width2 / 2) - strokeWidth % 2 / 2;
    path.moveTo(x, 0);
    path.lineTo(x, height2);
  },
  "horizontal-lines"(path, { width: width2, height: height2, pixelRatio, strokeWidth }) {
    const y = align(pixelRatio, height2 / 2) - strokeWidth % 2 / 2;
    path.moveTo(0, y);
    path.lineTo(width2, y);
  },
  "forward-slanted-lines"(path, { width: width2, height: height2, strokeWidth }) {
    const angle2 = Math.atan2(height2, width2);
    const insetX = strokeWidth * Math.cos(angle2);
    const insetY = strokeWidth * Math.sin(angle2);
    path.moveTo(-insetX, insetY);
    path.lineTo(insetX, -insetY);
    path.moveTo(-insetX, height2 + insetY);
    path.lineTo(width2 + insetX, -insetY);
    path.moveTo(width2 - insetX, height2 + insetY);
    path.lineTo(width2 + insetX, height2 - insetY);
  },
  "backward-slanted-lines"(path, { width: width2, height: height2, strokeWidth }) {
    const angle2 = Math.atan2(height2, width2);
    const insetX = strokeWidth * Math.cos(angle2);
    const insetY = strokeWidth * Math.sin(angle2);
    path.moveTo(width2 - insetX, -insetY);
    path.lineTo(width2 + insetX, insetY);
    path.moveTo(-insetX, -insetY);
    path.lineTo(width2 + insetX, height2 + insetY);
    path.moveTo(-insetX, height2 - insetY);
    path.lineTo(insetX, height2 + insetY);
  }
};

// packages/ag-charts-core/src/scene/pattern/pattern.ts
var Pattern = class {
  constructor(patternOptions) {
    this._cache = void 0;
    this.width = Math.max(patternOptions?.width ?? 10, 1);
    this.height = Math.max(patternOptions?.height ?? 10, 1);
    this.fill = patternOptions.fill ?? "none";
    this.fillOpacity = patternOptions.fillOpacity ?? 1;
    this.backgroundFill = patternOptions.backgroundFill ?? "none";
    this.backgroundFillOpacity = patternOptions.backgroundFillOpacity ?? 1;
    this.stroke = patternOptions.stroke ?? "black";
    this.strokeOpacity = patternOptions.strokeOpacity ?? 1;
    this.strokeWidth = patternOptions.strokeWidth ?? 1;
    this.padding = patternOptions.padding ?? 1;
    this.pattern = patternOptions.pattern ?? "forward-slanted-lines";
    this.rotation = patternOptions.rotation ?? 0;
    this.scale = patternOptions.scale ?? 1;
    this.path = patternOptions.path;
  }
  getPath(pixelRatio) {
    const { pattern, width: width2, height: height2, padding: padding2, strokeWidth, path: svgPath } = this;
    const path = new ExtendedPath2D();
    let renderPattern = PATTERNS[pattern] != null;
    if (svgPath != null && svgPath !== "") {
      renderPattern && (renderPattern = !path.appendSvg(svgPath));
    }
    if (renderPattern) {
      PATTERNS[pattern](path, { width: width2, height: height2, pixelRatio, strokeWidth, padding: padding2 });
    }
    return path;
  }
  renderStroke(path2d, ctx) {
    const { stroke, strokeWidth, strokeOpacity } = this;
    if (strokeWidth === 0 || Number.isNaN(strokeWidth))
      return;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.globalAlpha = strokeOpacity;
    ctx.stroke(path2d);
  }
  renderFill(path2d, ctx) {
    const { fill, fillOpacity } = this;
    if (fill === "none") {
      return;
    }
    ctx.fillStyle = fill;
    ctx.globalAlpha = fillOpacity;
    ctx.fill(path2d);
  }
  createCanvasPattern(ctx, pixelRatio, logger) {
    const { width: width2, height: height2, scale, backgroundFill, backgroundFillOpacity } = this;
    if (width2 * scale < 1 || height2 * scale < 1) {
      logger.warnOnce("Pattern fill is too small to render, ignoring.");
      return null;
    }
    const offscreenPattern = new HdpiOffscreenCanvas({ width: width2, height: height2, pixelRatio: pixelRatio * scale });
    const offscreenPatternCtx = offscreenPattern.context;
    if (backgroundFill !== "none") {
      offscreenPatternCtx.fillStyle = backgroundFill;
      offscreenPatternCtx.globalAlpha = backgroundFillOpacity;
      offscreenPatternCtx.fillRect(0, 0, width2, height2);
    }
    const path2d = this.getPath(pixelRatio).getPath2D();
    this.renderFill(path2d, offscreenPatternCtx);
    this.renderStroke(path2d, offscreenPatternCtx);
    const pattern = ctx.createPattern(offscreenPattern.canvas, "repeat");
    this.setPatternTransform(pattern, pixelRatio);
    offscreenPattern.destroy();
    return pattern;
  }
  setPatternTransform(pattern, pixelRatio, tx = 0, ty = 0) {
    if (pattern == null)
      return;
    const angle2 = normalizeAngle360FromDegrees(this.rotation);
    const scale = 1 / pixelRatio;
    const cos = Math.cos(angle2) * scale;
    const sin = Math.sin(angle2) * scale;
    const DOMMatrixCtor = getDOMMatrix();
    pattern.setTransform(new DOMMatrixCtor([cos, sin, -sin, cos, tx, ty]));
  }
  createPattern(ctx, pixelRatio, logger) {
    if (this._cache?.ctx === ctx && this._cache.pixelRatio === pixelRatio) {
      return this._cache.pattern;
    }
    const pattern = this.createCanvasPattern(ctx, pixelRatio, logger);
    if (pattern == null)
      return;
    this._cache = { ctx, pattern, pixelRatio };
    return pattern;
  }
  toSvg() {
    const {
      width: width2,
      height: height2,
      fill,
      fillOpacity,
      backgroundFill,
      backgroundFillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity,
      rotation,
      scale
    } = this;
    const pattern = createSvgElement("pattern");
    pattern.setAttribute("viewBox", `0 0 ${width2} ${height2}`);
    pattern.setAttribute("width", String(width2));
    pattern.setAttribute("height", String(height2));
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    const rect2 = createSvgElement("rect");
    rect2.setAttribute("x", "0");
    rect2.setAttribute("y", "0");
    rect2.setAttribute("width", String(width2));
    rect2.setAttribute("height", String(height2));
    rect2.setAttribute("fill", backgroundFill);
    rect2.setAttribute("fill-opacity", String(backgroundFillOpacity));
    pattern.appendChild(rect2);
    const path = createSvgElement("path");
    path.setAttribute("fill", fill);
    path.setAttribute("fill-opacity", String(fillOpacity));
    path.setAttribute("stroke-opacity", String(strokeOpacity));
    path.setAttribute("stroke", stroke);
    path.setAttribute("stroke-width", String(strokeWidth));
    path.setAttribute("transform", `rotate(${rotation}) scale(${scale})`);
    path.setAttribute("d", this.getPath(1).toSVG());
    pattern.appendChild(path);
    return pattern;
  }
};

// packages/ag-charts-core/src/scene/shape/shape.ts
var DILATION_MITER_LIMIT = 2;
function colourAlpha(colour) {
  if (!isString(colour))
    return 1;
  if (colour === "none" || colour === "")
    return 0;
  try {
    return Color.fromString(colour).a;
  } catch {
    return 1;
  }
}
function paintAlpha(colour, opacity) {
  return colourAlpha(colour) * opacity;
}
function gradientAlpha(gradient2) {
  const { stops } = gradient2;
  return stops.length === 0 ? 1 : Math.max(...stops.map((stop) => colourAlpha(stop.color)));
}
function patternAlpha(pattern) {
  const { fill, fillOpacity, backgroundFill, backgroundFillOpacity, stroke, strokeOpacity, strokeWidth } = pattern;
  const parts = [
    backgroundFill === "none" ? 0 : paintAlpha(backgroundFill, backgroundFillOpacity),
    fill === "none" ? 0 : paintAlpha(fill, fillOpacity),
    strokeWidth === 0 || Number.isNaN(strokeWidth) ? 0 : paintAlpha(stroke, strokeOpacity)
  ];
  return 1 - parts.reduce((clear, alpha) => clear * (1 - alpha), 1);
}
var silhouetteBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
var spreadBounds = {
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
  canvasWidth: void 0,
  canvasHeight: void 0,
  shadowX: 0,
  shadowY: 0,
  blur: 0
};
var spreadRegion = { x: 0, y: 0, width: 0, height: 0, maxWidth: 0, maxHeight: 0 };
function setSpreadRegion() {
  const { minX, minY, maxX, maxY, canvasWidth, canvasHeight, shadowX, shadowY, blur } = spreadBounds;
  const blurReach = Math.ceil(blur * 1.5);
  const left = Math.floor(canvasWidth == null ? minX : Math.max(minX, -shadowX - blurReach));
  const top = Math.floor(canvasHeight == null ? minY : Math.max(minY, -shadowY - blurReach));
  const right = Math.ceil(canvasWidth == null ? maxX : Math.min(maxX, canvasWidth - shadowX + blurReach));
  const bottom = Math.ceil(canvasHeight == null ? maxY : Math.min(maxY, canvasHeight - shadowY + blurReach));
  const width2 = right - left;
  const height2 = bottom - top;
  if (!(isFiniteNumber(width2) && isFiniteNumber(height2) && width2 > 0 && height2 > 0))
    return false;
  spreadRegion.x = left;
  spreadRegion.y = top;
  spreadRegion.width = width2;
  spreadRegion.height = height2;
  spreadRegion.maxWidth = canvasWidth == null ? width2 : canvasWidth + 2 * blurReach;
  spreadRegion.maxHeight = canvasHeight == null ? height2 : canvasHeight + 2 * blurReach;
  return true;
}
function hasCanvas(ctx) {
  return "canvas" in ctx;
}
function hasLocalTransform(node) {
  return "computeBBoxWithoutTransforms" in node;
}
var _Shape = /*#__PURE__*/ (() => { var _c$6 = class _Shape extends Node {
  constructor() {
    super(...arguments);
    this.drawingMode = "overlay";
    this.fillOpacity = 1;
    this.strokeOpacity = 1;
    this.fill = "black";
    this._fillAlpha = 1;
    this._paintAlpha = 1;
    this._strokeAlpha = 1;
    this.strokeWidth = 0;
    this.lineDashOffset = 0;
    this.opacity = 1;
    this.shadowMode = "fill";
    // optimised field accessor
    /** How much wider than the shape the spread shadow's stroke is drawn. Zero except while that stroke is drawn. */
    this.shadowStrokeGrowth = 0;
  }
  // optimised field accessor
  getGradient(fill) {
    if (isGradientFill(fill))
      return this.createGradient(fill);
  }
  createGradient(fill) {
    const { colorSpace = "rgb", gradient: gradient2 = "linear", colorStops, rotation = 0, reverse = false } = fill;
    if (colorStops == null)
      return;
    let stops = getColorStops(colorStops, ["black"], [0, 1]);
    if (reverse) {
      stops = stops.map((s) => ({ color: s.color, stop: 1 - s.stop })).reverse();
    }
    switch (gradient2) {
      case "linear":
        return new LinearGradient(colorSpace, stops, rotation);
      case "radial":
        return new RadialGradient(colorSpace, stops);
      case "conic":
        return new ConicGradient(colorSpace, stops, rotation);
    }
  }
  getPattern(fill) {
    if (isPatternFill(fill))
      return this.createPattern(fill);
  }
  createPattern(fill) {
    return new Pattern(fill);
  }
  getImage(fill) {
    if (isImageFill(fill))
      return this.createImage(fill);
  }
  createImage(fill) {
    return new Image(this.imageLoader, fill);
  }
  getFillAlpha(fill) {
    if (fill !== this._alphaFill) {
      this._alphaFill = fill;
      this._fillAlpha = colourAlpha(fill);
    }
    return this._fillAlpha;
  }
  /**
   * The most that a fill can contribute to a shadow mask: the alpha of a colour, of the strongest resolved stop of a
   * gradient, or of what a pattern composites to. Anything else (e.g. an image) counts as opaque, because it can't be told
   * without drawing. A plain colour's alpha, and that of a gradient or pattern, is cached.
   */
  getMaxFillAlpha(fill) {
    if (typeof fill === "string")
      return this.getFillAlpha(fill);
    const paint = this.fillGradient ?? this.fillPattern;
    if (paint == null)
      return 1;
    if (paint !== this._paintAlphaSource) {
      this._paintAlphaSource = paint;
      this._paintAlpha = paint instanceof Pattern ? patternAlpha(paint) : gradientAlpha(paint);
    }
    return this._paintAlpha;
  }
  getStrokeAlpha(stroke) {
    if (stroke !== this._alphaStroke) {
      this._alphaStroke = stroke;
      this._strokeAlpha = colourAlpha(stroke);
    }
    return this._strokeAlpha;
  }
  onFillChange() {
    if (typeof this.fill === "object") {
      if (objectsEqual(this._cachedFill ?? {}, this.fill)) {
        return;
      }
    }
    this.fillGradient = this.getGradient(this.fill);
    this.fillPattern = this.getPattern(this.fill);
    this.fillImage = this.getImage(this.fill);
    this._cachedFill = this.fill;
  }
  // optimised field accessor
  onStrokeChange() {
    this.strokeGradient = this.getGradient(this.stroke);
  }
  // optimised field accessor
  /**
   * Returns a device-pixel aligned coordinate (or length if length is supplied).
   *
   * NOTE: Not suitable for strokes, since the stroke needs to be offset to the middle
   * of a device pixel.
   */
  align(start2, length2) {
    return align(this.layerManager?.canvas?.pixelRatio ?? 1, start2, length2);
  }
  /**
   * Device-pixel aligns an edge-pair while preserving its centre. See {@link alignCentre}.
   */
  alignCentre(start2, length2, out) {
    return alignCentre(this.layerManager?.canvas?.pixelRatio ?? 1, start2, length2, out);
  }
  /** Whether {@link alignCentre} centre-snaps a bar of this length rather than edge-snapping it. */
  centreSnapApplies(length2) {
    return centreSnapApplies(this.layerManager?.canvas?.pixelRatio ?? 1, length2);
  }
  serializeProps() {
    return {
      ...super.serializeProps(),
      opacity: this.opacity,
      drawingMode: this.drawingMode,
      hasFill: this.fill != null,
      hasStroke: this.stroke != null
    };
  }
  /** Lets a shape that can't honour every {@link ShapeShadowMode} fall back to a supported one. */
  onShadowModeChange() {
  }
  markDirty(property) {
    super.markDirty(property);
    this.cachedDefaultGradientFillBBox = void 0;
  }
  fillStroke(ctx, logger, path, bboxOverride, fillBBoxOverride) {
    if (shadowPass.state === "mask") {
      this.renderShadowMask(ctx, logger, path, bboxOverride, fillBBoxOverride);
      return;
    }
    if (this.__drawingMode === "cutout") {
      ctx.globalCompositeOperation = "destination-out";
      this.executeFill(ctx, path);
      ctx.globalCompositeOperation = "source-over";
    }
    if (path != null && this.castsShadowFromPrePass()) {
      this.renderShadowPrePass(ctx, logger, path, bboxOverride, fillBBoxOverride);
    }
    this.renderFill(ctx, logger, path, bboxOverride, fillBBoxOverride);
    this.renderStroke(ctx, path, bboxOverride);
  }
  /**
   * Whether the shadow is cast by the off-canvas pre-pass rather than inline with the fill or stroke. That is the
   * `silhouette` mode, and any mode with a `spread`, which has to dilate a copy of the shape. Without a Path2D
   * (e.g. Line) the pre-pass can't be moved by the transform, so the stroke casts the shadow inline instead.
   */
  castsShadowFromPrePass() {
    const shadow = this.__fillShadow;
    if (!this.castsOwnShadow() || shadow == null)
      return false;
    return this.__shadowMode === "silhouette" || (shadow.spread ?? 0) > 0;
  }
  /** False while a layer shadow batch casts the shadow for this shape, instead of the shape itself. */
  castsOwnShadow() {
    return shadowPass.state === "none" && this.__fillShadow?.enabled === true;
  }
  /** True while the shape is drawing into a layer shadow batch's mask, where {@link renderSilhouetteExtras} is drawn. */
  isDrawingShadowMask() {
    return shadowPass.state === "mask";
  }
  /**
   * Draws the silhouette that casts this shape's shadow into the scratch canvas of a layer shadow batch, which blurs
   * the silhouettes of the whole batch once. The silhouette is drawn with the shape's real paint, so a fully
   * transparent gradient, pattern or stroke casts nothing, and a translucent one casts a weaker shadow. Strokes cast
   * only in the `stroke` and `silhouette` modes. With a `spread` see {@link renderSpreadMask}.
   */
  renderShadowMask(ctx, logger, path, bboxOverride, fillBBoxOverride) {
    const shadow = this.__fillShadow;
    if (shadow?.enabled !== true)
      return;
    const spread = shadow.spread ?? 0;
    const { __fill: fill, __fillOpacity: fillOpacity = 1, __shadowMode: mode } = this;
    const drawsFill = mode !== "stroke" && fill != null && fill !== "none" && fillOpacity > 0 && this.getMaxFillAlpha(fill) > 0;
    const drawsStroke = mode !== "fill" && this.hasVisibleStroke() && this.getStrokeAlpha(this.__stroke) > 0;
    const hasExtras = mode !== "fill" && this.getSilhouetteExtrasOpacity() > 0;
    if (spread > 0 && path != null) {
      this.renderSpreadMask(ctx, path, spread, drawsFill, drawsStroke, hasExtras, bboxOverride);
      return;
    }
    if (drawsFill) {
      this.renderFill(ctx, logger, path, bboxOverride, fillBBoxOverride);
    }
    if (drawsStroke) {
      if (spread > 0) {
        const globalAlpha = ctx.globalAlpha;
        this.applyStrokeAndAlpha(ctx, bboxOverride);
        this.setDilationStyle(ctx, spread, true);
        this.shadowStrokeGrowth = spread * 2;
        try {
          this.executeStroke(ctx, path);
        } finally {
          this.shadowStrokeGrowth = 0;
        }
        ctx.globalAlpha = globalAlpha;
      } else {
        this.renderStroke(ctx, path, bboxOverride);
      }
    }
    if (hasExtras) {
      this.renderSilhouetteExtras(ctx);
    }
  }
  /**
   * Draws the silhouette that casts a shape's shadow into a shadow batch's mask when it has a `spread`: what
   * {@link castSpreadShadow} blits for the shape without the blur. That is the fill, the dilated stroke and the dilated
   * extras, drawn solid at a single strength. Only that strength follows the paint: the fill's strongest alpha, else the
   * stroke's, else the extras'. An opaque shape is drawn straight into the mask, where its parts can only cover each
   * other fully. A translucent one is drawn opaque off to the side and added once at its strength, so that where its
   * parts overlap they don't darken the shadow.
   */
  renderSpreadMask(ctx, path, spread, drawsFill, drawsStroke, hasExtras, bboxOverride) {
    const { __opacity: opacity = 1, __fillOpacity: fillOpacity = 1, __strokeOpacity: strokeOpacity = 1 } = this;
    let strength;
    if (drawsFill) {
      strength = this.getMaxFillAlpha(this.__fill) * fillOpacity * opacity;
    } else if (drawsStroke) {
      strength = this.getStrokeAlpha(this.__stroke) * strokeOpacity * opacity;
    } else if (hasExtras) {
      strength = this.getSilhouetteExtrasOpacity() * opacity;
    } else {
      return;
    }
    strength *= ctx.globalAlpha * this.getPaintOpacityScale();
    if (strength <= 0 || !isFiniteNumber(strength))
      return;
    if (strength >= 1) {
      ctx.save();
      try {
        this.drawSpreadSilhouette(ctx, path, spread, drawsFill, drawsStroke);
      } finally {
        ctx.restore();
      }
      return;
    }
    const matrix = ctx.getTransform();
    const canvas = hasCanvas(ctx) ? ctx.canvas : void 0;
    if (!this.measureSilhouette(matrix, spread, bboxOverride))
      return;
    const left = Math.max(0, Math.floor(silhouetteBounds.minX));
    const top = Math.max(0, Math.floor(silhouetteBounds.minY));
    const right = Math.min(canvas?.width ?? Infinity, Math.ceil(silhouetteBounds.maxX));
    const bottom = Math.min(canvas?.height ?? Infinity, Math.ceil(silhouetteBounds.maxY));
    const width2 = right - left;
    const height2 = bottom - top;
    if (!(isFiniteNumber(width2) && isFiniteNumber(height2) && width2 > 0 && height2 > 0))
      return;
    const { canvas: spreadCanvas, context: scratch } = getSpreadCanvas(
      ctx,
      width2,
      height2,
      canvas?.width ?? width2,
      canvas?.height ?? height2
    );
    scratch.setTransform(1, 0, 0, 1, 0, 0);
    scratch.clearRect(0, 0, width2, height2);
    scratch.save();
    scratch.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e - left, matrix.f - top);
    this.drawSpreadSilhouette(scratch, path, spread, drawsFill, drawsStroke);
    scratch.restore();
    ctx.save();
    try {
      ctx.resetTransform();
      ctx.globalAlpha = strength;
      ctx.drawImage(spreadCanvas, 0, 0, width2, height2, left, top, width2, height2);
    } finally {
      ctx.restore();
    }
  }
  /**
   * Measures, into {@link silhouetteBounds}, the device-space bounds of what the shape casts a shadow from, through
   * `matrix`. Returns false when the shape has no bounds to measure.
   */
  measureSilhouette(matrix, spread, bboxOverride) {
    const localBBox = bboxOverride ?? (hasLocalTransform(this) ? this.computeBBoxWithoutTransforms() : this.getBBox());
    if (localBBox == null)
      return false;
    const { a, b, c, d, e, f } = matrix;
    const strokeReach = this.getShadowStrokeReach(spread);
    const halfWidth = localBBox.width / 2 + strokeReach;
    const halfHeight = localBBox.height / 2 + strokeReach;
    const centreX = localBBox.x + localBBox.width / 2;
    const centreY = localBBox.y + localBBox.height / 2;
    const deviceCentreX = a * centreX + c * centreY + e;
    const deviceCentreY = b * centreX + d * centreY + f;
    const crispPad = this.isCrisp() ? 1 : 0;
    const reachX = Math.abs(a) * halfWidth + Math.abs(c) * halfHeight + crispPad;
    const reachY = Math.abs(b) * halfWidth + Math.abs(d) * halfHeight + crispPad;
    silhouetteBounds.minX = deviceCentreX - reachX;
    silhouetteBounds.maxX = deviceCentreX + reachX;
    silhouetteBounds.minY = deviceCentreY - reachY;
    silhouetteBounds.maxY = deviceCentreY + reachY;
    return true;
  }
  /** Sets how the stroke that dilates the shape by a `spread` is drawn: solid, and capped so that open ends spread too. */
  setDilationStyle(ctx, spread, drawsStroke) {
    const lineCap = this.__lineCap;
    let dilationCap = lineCap == null || lineCap === "butt" ? "square" : lineCap;
    if (this.__shadowMode === "fill")
      dilationCap = "round";
    ctx.lineCap = dilationCap;
    ctx.lineJoin = drawsStroke ? this.__lineJoin ?? "miter" : "miter";
    ctx.miterLimit = drawsStroke ? this.__miterLimit ?? 10 : DILATION_MITER_LIMIT;
    ctx.lineWidth = (drawsStroke ? this.__strokeWidth : 0) + spread * 2;
  }
  /**
   * Draws the shape, dilated by `spread`, opaque and in one solid colour: its fill, its stroke widened by the spread (or
   * the fill's outline stroked by it) and its extras. Where those overlap they only cover each other.
   */
  drawSpreadSilhouette(ctx, path, spread, drawsFill, drawsStroke) {
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#000";
    this.setDilationStyle(ctx, spread, drawsStroke);
    if (drawsFill) {
      this.executeFill(ctx, path);
    }
    if (drawsStroke) {
      this.shadowStrokeGrowth = spread * 2;
      try {
        this.executeStroke(ctx, path);
      } finally {
        this.shadowStrokeGrowth = 0;
      }
    } else if (drawsFill) {
      this.dilateFill(ctx, path);
    }
    if (this.__shadowMode !== "fill") {
      this.dilateSilhouetteExtras(ctx, spread * 2);
    }
  }
  /** True when the shape paints a stroke, which {@link renderStroke} skips otherwise. */
  hasVisibleStroke() {
    const { __stroke: stroke, __strokeWidth: strokeWidth = 0, __strokeOpacity: strokeOpacity = 1 } = this;
    return stroke != null && stroke !== "none" && strokeWidth > 0 && strokeOpacity > 0;
  }
  /** How far the pre-pass's strokes reach past the shape's bounds, in the shape's own units. */
  getShadowStrokeReach(spread) {
    const fillOnly = this.__shadowMode === "fill";
    const halfStroke = (fillOnly ? 0 : this.getSilhouetteStrokeWidth() / 2) + spread;
    const miterLimit = fillOnly ? DILATION_MITER_LIMIT : this.__miterLimit ?? 10;
    const joinReach = fillOnly || (this.__lineJoin ?? "miter") === "miter" ? halfStroke * miterLimit : halfStroke;
    const squareCap = spread > 0 || !fillOnly && this.__lineCap === "square";
    return squareCap ? Math.max(joinReach, halfStroke * Math.SQRT2) : joinReach;
  }
  /** Draws the shape off-canvas and shifts only its shadow back, so the stroke's shadow never lands on the fill. */
  renderShadowPrePass(ctx, logger, path, bboxOverride, fillBBoxOverride) {
    const { __fillShadow: shadow, __fill: fill, __fillOpacity: fillOpacity = 1 } = this;
    if (shadow?.enabled !== true)
      return;
    const layerCanvas = this.layerManager?.canvas;
    const pixelRatio = layerCanvas?.pixelRatio ?? 1;
    let canvasWidth;
    let canvasHeight;
    if (layerCanvas != null) {
      canvasWidth = deviceDimension(pixelRatio, layerCanvas.width);
      canvasHeight = deviceDimension(pixelRatio, layerCanvas.height);
    } else if (hasCanvas(ctx)) {
      canvasWidth = ctx.canvas.width;
      canvasHeight = ctx.canvas.height;
    }
    const reach = shadow.blur * pixelRatio;
    const shadowX = shadow.xOffset * pixelRatio;
    const shadowY = shadow.yOffset * pixelRatio;
    const spread = shadow.spread ?? 0;
    const matrix = ctx.getTransform();
    const { a, b, c, d, e, f } = matrix;
    let minX = 0;
    let minY = 0;
    let maxX = (canvasWidth ?? 0) + spread * pixelRatio;
    let maxY = canvasHeight ?? 0;
    if (this.measureSilhouette(matrix, spread, bboxOverride)) {
      ({ minX, minY, maxX, maxY } = silhouetteBounds);
      if (canvasWidth != null && canvasHeight != null) {
        const blurReach = reach * 1.5;
        const offCanvas = maxX + shadowX + blurReach < 0 || minX + shadowX - blurReach > canvasWidth || maxY + shadowY + blurReach < 0 || minY + shadowY - blurReach > canvasHeight;
        if (offCanvas)
          return;
      }
    }
    const distance2 = Math.max(0, Math.ceil(maxX + reach));
    if (!isFiniteNumber(reach) || !isFiniteNumber(distance2) || !isFiniteNumber(shadowX) || !isFiniteNumber(shadowY)) {
      return;
    }
    if (spread > 0) {
      spreadBounds.minX = minX;
      spreadBounds.minY = minY;
      spreadBounds.maxX = maxX;
      spreadBounds.maxY = maxY;
      spreadBounds.canvasWidth = canvasWidth;
      spreadBounds.canvasHeight = canvasHeight;
      spreadBounds.shadowX = shadowX;
      spreadBounds.shadowY = shadowY;
      spreadBounds.blur = reach;
      if (setSpreadRegion()) {
        this.castSpreadShadow(ctx, logger, path, matrix, spread, distance2, bboxOverride, fillBBoxOverride);
      }
      return;
    }
    ctx.save();
    ctx.setTransform(a, b, c, d, e - distance2, f);
    this.applyShadow(ctx);
    ctx.shadowOffsetX += distance2;
    if (fill != null && fill !== "none" && fillOpacity > 0) {
      const globalAlpha = ctx.globalAlpha;
      this.applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride);
      this.executeFill(ctx, path);
      ctx.globalAlpha = globalAlpha;
    }
    this.renderStroke(ctx, path, bboxOverride);
    this.renderSilhouetteExtras(ctx);
    ctx.restore();
  }
  /**
   * Draws the shape, dilated by `spread`, opaque into the layer's scratch canvas, then blits that off-canvas so that
   * a single draw casts the shadow. Two draws (fill, then a stroke) would stack their shadows where they overlap.
   */
  castSpreadShadow(ctx, logger, path, matrix, spread, distance2, bboxOverride, fillBBoxOverride) {
    const { __fill: fill, __fillOpacity: fillOpacity = 1, __shadowMode: mode } = this;
    const { x, y, width: width2, height: height2, maxWidth, maxHeight } = spreadRegion;
    const fillAlpha = mode === "stroke" || fill == null || fill === "none" || fillOpacity <= 0 ? 0 : this.getMaxFillAlpha(fill);
    const drawsFill = fillAlpha > 0;
    const strokeAlpha = mode !== "fill" && this.hasVisibleStroke() ? this.getStrokeAlpha(this.__stroke) : 0;
    const drawsStroke = strokeAlpha > 0;
    const extrasOpacity = mode === "fill" ? 0 : this.getSilhouetteExtrasOpacity();
    if (!drawsFill && !drawsStroke && extrasOpacity <= 0)
      return;
    const globalAlpha = ctx.globalAlpha;
    let strength = 1;
    if (drawsFill) {
      this.applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride);
      strength = fillAlpha;
    } else if (drawsStroke) {
      this.applyStrokeAndAlpha(ctx, bboxOverride);
      strength = strokeAlpha;
    } else {
      strength = extrasOpacity * (this.__opacity ?? 1);
    }
    strength *= ctx.globalAlpha;
    ctx.globalAlpha = globalAlpha;
    if (strength <= 0)
      return;
    const { canvas, context: scratch } = getSpreadCanvas(ctx, width2, height2, maxWidth, maxHeight);
    scratch.setTransform(1, 0, 0, 1, 0, 0);
    scratch.clearRect(0, 0, width2, height2);
    scratch.save();
    scratch.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e - x, matrix.f - y);
    this.drawSpreadSilhouette(scratch, path, spread, drawsFill, drawsStroke);
    scratch.restore();
    ctx.save();
    ctx.resetTransform();
    this.applyShadow(ctx);
    ctx.shadowOffsetX += distance2;
    ctx.globalAlpha = strength;
    ctx.drawImage(canvas, 0, 0, width2, height2, x - distance2, y, width2, height2);
    ctx.restore();
  }
  /** Strokes the filled geometry as a solid line, to dilate it. Open subpaths the fill does not paint are skipped. */
  dilateFill(ctx, path) {
    ctx.stroke(path);
  }
  /** Draws strokes the shape paints apart from its main path, so the silhouette pre-pass casts them too. */
  renderSilhouetteExtras(_ctx) {
  }
  /** Strokes the paths the shape paints apart from its main one as a solid line `growth` wider, to dilate the shadow. */
  dilateSilhouetteExtras(_ctx, _growth) {
  }
  /** What the shape's own {@link applyFillAndAlpha} and {@link applyStrokeAndAlpha} scale the opacity by, beyond its opacities. */
  getPaintOpacityScale() {
    return 1;
  }
  /** The alpha of a colour, for a shape to tell whether the paint of its extra paths casts a shadow. */
  getColourAlpha(colour) {
    return colourAlpha(colour);
  }
  /** The opacity the shape strokes its extra paths with, or 0 when it paints none, so they cast no shadow. */
  getSilhouetteExtrasOpacity() {
    return 0;
  }
  /** Whether the shape snaps its geometry to the device pixel grid, which can move it up to a pixel past its bounds. */
  isCrisp() {
    return false;
  }
  /** The widest stroke cast into the silhouette shadow, which the shape's off-canvas pre-pass has to clear. */
  getSilhouetteStrokeWidth() {
    return this.__strokeWidth;
  }
  renderFill(ctx, logger, path, bboxOverride, fillBBoxOverride) {
    const { __fill: fill, __fillOpacity: fillOpacity = 1, fillImage } = this;
    if (fill != null && fill !== "none" && fillOpacity > 0) {
      const globalAlpha = ctx.globalAlpha;
      if (fillImage) {
        ctx.globalAlpha = fillImage.backgroundFillOpacity;
        ctx.fillStyle = fillImage.backgroundFill;
        this.executeFill(ctx, path);
        ctx.globalAlpha = globalAlpha;
      }
      this.applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride);
      const shadowed = this.__shadowMode === "fill" && this.castsOwnShadow() && (path == null || !this.castsShadowFromPrePass());
      if (shadowed) {
        this.applyShadow(ctx);
      }
      this.executeFill(ctx, path);
      ctx.globalAlpha = globalAlpha;
      if (shadowed) {
        ctx.shadowColor = "rgba(0, 0, 0, 0)";
      }
    }
  }
  executeFill(ctx, path) {
    if (path) {
      ctx.fill(path);
    } else {
      ctx.fill();
    }
  }
  applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride) {
    const {
      __fill: fill,
      fillGradient,
      fillPattern,
      fillImage,
      __fillOpacity: fillOpacity = 1,
      __opacity: opacity = 1
    } = this;
    const combinedOpacity = opacity * fillOpacity;
    if (combinedOpacity !== 1) {
      ctx.globalAlpha *= combinedOpacity;
    }
    if (fillGradient) {
      const fillBBox = fillBBoxOverride ?? this.fillBBox ?? this.getDefaultGradientFillBBox() ?? bboxOverride ?? this.getBBox();
      const { fillParams } = this;
      ctx.fillStyle = fillGradient.createGradient(ctx, fillBBox, fillParams) ?? "black";
    } else if (fillPattern) {
      const { x, y } = bboxOverride ?? this.getBBox();
      const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
      const pattern = fillPattern.createPattern(ctx, pixelRatio, logger);
      fillPattern.setPatternTransform(pattern, pixelRatio, x, y);
      if (pattern) {
        ctx.fillStyle = pattern;
      } else {
        ctx.fillStyle = fillPattern.fill;
        ctx.globalAlpha *= fillPattern.fillOpacity;
      }
    } else if (fillImage) {
      const bbox = bboxOverride ?? this.getBBox();
      const image = fillImage.createPattern(ctx, bbox.width, bbox.height, this, logger);
      fillImage.setImageTransform(image, bbox);
      ctx.fillStyle = image ?? "transparent";
    } else {
      ctx.fillStyle = typeof fill === "string" ? fill : "black";
    }
  }
  applyStrokeAndAlpha(ctx, bboxOverride) {
    const { __stroke: stroke, __strokeOpacity: strokeOpacity = 1, strokeGradient, __opacity: opacity = 1 } = this;
    ctx.strokeStyle = strokeGradient?.createGradient(ctx, bboxOverride ?? this.getBBox()) ?? (typeof stroke === "string" ? stroke : void 0) ?? "black";
    const combinedOpacity = opacity * strokeOpacity;
    if (combinedOpacity !== 1) {
      ctx.globalAlpha *= combinedOpacity;
    }
  }
  applyShadow(ctx) {
    const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
    const { __fillShadow: fillShadow } = this;
    if (fillShadow?.enabled) {
      ctx.shadowColor = fillShadow.color;
      ctx.shadowOffsetX = fillShadow.xOffset * pixelRatio;
      ctx.shadowOffsetY = fillShadow.yOffset * pixelRatio;
      ctx.shadowBlur = fillShadow.blur * pixelRatio;
    }
  }
  renderStroke(ctx, path, bboxOverride) {
    const {
      __stroke: stroke,
      __strokeWidth: strokeWidth = 0,
      __strokeOpacity: strokeOpacity = 1,
      __lineDash: lineDash,
      __lineDashOffset: lineDashOffset,
      __lineCap: lineCap,
      __lineJoin: lineJoin,
      __miterLimit: miterLimit
    } = this;
    if (stroke != null && stroke !== "none" && strokeWidth > 0 && strokeOpacity > 0) {
      const { globalAlpha } = ctx;
      this.applyStrokeAndAlpha(ctx, bboxOverride);
      ctx.lineWidth = strokeWidth;
      if (lineDash) {
        ctx.setLineDash(lineDash);
      }
      if (lineDashOffset !== 0) {
        ctx.lineDashOffset = lineDashOffset;
      }
      if (lineCap != null) {
        ctx.lineCap = lineCap;
      }
      if (lineJoin != null) {
        ctx.lineJoin = lineJoin;
      }
      if (miterLimit != null) {
        ctx.miterLimit = miterLimit;
      }
      const shadowed = this.__shadowMode !== "fill" && this.castsOwnShadow() && (path == null || !this.castsShadowFromPrePass());
      if (shadowed) {
        this.applyShadow(ctx);
      }
      this.executeStroke(ctx, path);
      ctx.globalAlpha = globalAlpha;
      if (shadowed) {
        ctx.shadowColor = "rgba(0, 0, 0, 0)";
      }
    }
  }
  executeStroke(ctx, path) {
    if (path) {
      ctx.stroke(path);
    } else {
      ctx.stroke();
    }
  }
  getDefaultGradientFillBBox() {
    this.cachedDefaultGradientFillBBox ?? (this.cachedDefaultGradientFillBBox = Object.freeze(this.computeDefaultGradientFillBBox()));
    return this.cachedDefaultGradientFillBBox;
  }
  computeDefaultGradientFillBBox() {
    return;
  }
  containsPoint(x, y) {
    return this.isPointInPath(x, y);
  }
  applySvgFillAttributes(element2, defs) {
    const { fill, fillOpacity } = this;
    if (typeof fill === "string") {
      element2.setAttribute("fill", fill);
    } else if (isGradientFill(fill) && this.fillGradient) {
      defs ?? (defs = []);
      const gradient2 = this.fillGradient.toSvg(this.fillBBox ?? this.getBBox());
      const id = generateUUID();
      gradient2.setAttribute("id", id);
      defs.push(gradient2);
      element2.setAttribute("fill", `url(#${id})`);
    } else if (isPatternFill(fill) && this.fillPattern) {
      defs ?? (defs = []);
      const pattern = this.fillPattern.toSvg();
      const id = generateUUID();
      pattern.setAttribute("id", id);
      defs.push(pattern);
      element2.setAttribute("fill", `url(#${id})`);
    } else if (isImageFill(fill) && this.fillImage) {
      defs ?? (defs = []);
      const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
      const pattern = this.fillImage.toSvg(this.getBBox(), pixelRatio);
      const id = generateUUID();
      pattern.setAttribute("id", id);
      defs.push(pattern);
      element2.setAttribute("fill", `url(#${id})`);
    } else {
      element2.setAttribute("fill", "none");
    }
    element2.setAttribute("fill-opacity", String(fillOpacity));
    return defs;
  }
  applySvgStrokeAttributes(element2) {
    const { stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = this;
    setSvgStrokeAttributes(element2, { stroke: isString(stroke) ? stroke : void 0, strokeOpacity, strokeWidth });
    setSvgLineDashAttributes(element2, { lineDash, lineDashOffset });
  }
  static handleFillChange(shape) {
    shape.onFillChange();
  }
  static handleStrokeChange(shape) {
    shape.onStrokeChange();
  }
  /**
   * Sets style properties on the shape, optimizing by writing directly to __ prefix fields
   * where possible to avoid setter overhead.
   */
  setStyleProperties(style, fillBBox, fillParams) {
    const opacity = style?.opacity ?? 1;
    const fill = style?.fill;
    const computedFillOpacity = (style?.fillOpacity ?? 1) * opacity;
    const computedStrokeOpacity = (style?.strokeOpacity ?? 1) * opacity;
    const computedStrokeWidth = style?.strokeWidth ?? 0;
    const computedLineDashOffset = style?.lineDashOffset ?? 0;
    let hasDirectChanges = false;
    if (this.__fillOpacity !== computedFillOpacity) {
      this.__fillOpacity = computedFillOpacity;
      hasDirectChanges = true;
    }
    if (this.__strokeOpacity !== computedStrokeOpacity) {
      this.__strokeOpacity = computedStrokeOpacity;
      hasDirectChanges = true;
    }
    if (this.__strokeWidth !== computedStrokeWidth) {
      this.__strokeWidth = computedStrokeWidth;
      hasDirectChanges = true;
    }
    if (this.__lineDashOffset !== computedLineDashOffset) {
      this.__lineDashOffset = computedLineDashOffset;
      hasDirectChanges = true;
    }
    if (this.__lineDash !== style?.lineDash) {
      this.__lineDash = style?.lineDash;
      hasDirectChanges = true;
    }
    this.setFillProperties(fill, fillBBox, fillParams);
    if (fill !== this.fill) {
      this.fill = fill;
    }
    if (style?.stroke !== this.stroke) {
      this.stroke = style?.stroke;
    }
    if (hasDirectChanges) {
      this.markDirty();
    }
  }
  /**
   * Sets fill-related properties (fillBBox and fillParams) on the shape.
   * Used for gradient fills that need bounding box information.
   */
  setFillProperties(fill, fillBBox, fillParams) {
    const computedFillBBox = fillBBox == null || !isGradientFill(fill) || fill.bounds == null || fill.bounds === "item" ? void 0 : fillBBox[fill.bounds];
    let hasDirectChanges = false;
    if (this.__fillBBox !== computedFillBBox) {
      this.__fillBBox = computedFillBBox;
      hasDirectChanges = true;
    }
    if (this.__fillParams !== fillParams) {
      this.__fillParams = fillParams;
      hasDirectChanges = true;
    }
    if (hasDirectChanges) {
      this.onFillChange();
      this.markDirty();
    }
  }
}; __decorateClass([
  DeclaredSceneChangeDetection()
], _c$6.prototype, "drawingMode", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$6.prototype, "fillOpacity", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$6.prototype, "strokeOpacity", 2); __decorateClass([
  DeclaredSceneObjectChangeDetection({
    equals: objectsEqual,
    changeCb: _c$6.handleFillChange
  })
], _c$6.prototype, "fill", 2); __decorateClass([
  SceneObjectChangeDetection({ equals: objectsEqual, changeCb: _c$6.handleStrokeChange })
], _c$6.prototype, "stroke", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$6.prototype, "strokeWidth", 2); __decorateClass([
  SceneArrayChangeDetection()
], _c$6.prototype, "lineDash", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$6.prototype, "lineDashOffset", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$6.prototype, "lineCap", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$6.prototype, "lineJoin", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$6.prototype, "miterLimit", 2); __decorateClass([
  DeclaredSceneChangeDetection({ convertor: (v) => clamp(0, v ?? 1, 1) })
], _c$6.prototype, "opacity", 2); __decorateClass([
  SceneObjectChangeDetection({ equals: TRIPLE_EQ })
], _c$6.prototype, "fillShadow", 2); __decorateClass([
  DeclaredSceneChangeDetection({ changeCb: (s) => s.onShadowModeChange() })
], _c$6.prototype, "shadowMode", 2); __decorateClass([
  DeclaredSceneObjectChangeDetection({ equals: boxesEqual, changeCb: (s) => s.onFillChange() })
], _c$6.prototype, "fillBBox", 2); __decorateClass([
  DeclaredSceneObjectChangeDetection({ equals: objectsEqual, changeCb: (s) => s.onFillChange() })
], _c$6.prototype, "fillParams", 2); return _c$6; })()
var Shape = _Shape;

// packages/ag-charts-core/src/scene/shape/path.ts
var Path = /*#__PURE__*/ (() => { var _c$7 = class extends Shape {
  constructor() {
    super(...arguments);
    this._clipX = Number.NaN;
    this._clipY = Number.NaN;
    this.clip = false;
    /**
     * The path only has to be updated when certain attributes change.
     * For example, if transform attributes (such as `translationX`)
     * are changed, we don't have to update the path. The `dirtyPath` flag
     * is how we keep track if the path has to be updated or not.
     */
    this._dirtyPath = true;
    this.lastPixelRatio = Number.NaN;
  }
  get path() {
    this._path ?? (this._path = new ExtendedPath2D());
    return this._path;
  }
  set path(value) {
    this._path = value;
  }
  set clipX(value) {
    this._clipX = value;
    this.dirtyPath = true;
  }
  set clipY(value) {
    this._clipY = value;
    this.dirtyPath = true;
  }
  /** Serialised-state discriminator for subclasses (e.g. `Marker`) that share the path property set. */
  get serializedType() {
    return "path";
  }
  serialize() {
    return { type: this.serializedType, props: this.serializeProps(), svgPath: this.serializeSvgPath() };
  }
  serializeProps() {
    const bbox = this.getBBox();
    return {
      ...super.serializeProps(),
      x: bbox?.x ?? Number.NaN,
      y: bbox?.y ?? Number.NaN,
      width: bbox?.width ?? Number.NaN,
      height: bbox?.height ?? Number.NaN,
      clip: this.clip,
      clipX: this._clipX,
      clipY: this._clipY
    };
  }
  /**
   * The drawn path in SVG form, read from `_path` directly: serialisation must reflect the path as
   * last drawn, without forcing lazy allocation (Marker) or a premature updatePath.
   */
  serializeSvgPath() {
    return this._path?.toSVG();
  }
  set dirtyPath(value) {
    if (this._dirtyPath !== value) {
      this._dirtyPath = value;
      if (value) {
        this.markDirty("path");
      }
    }
  }
  get dirtyPath() {
    return this._dirtyPath;
  }
  checkPathDirty() {
    if (this._dirtyPath) {
      return;
    }
    this.dirtyPath = this.path.isDirty() || (this._clipPath?.isDirty() ?? false);
  }
  resetPathDirty() {
    this.path.clear(true);
    this._dirtyPath = false;
  }
  isPathDirty() {
    return this.path.isDirty();
  }
  onChangeDetection(property) {
    this._dirtyPath = true;
    super.onChangeDetection(property);
  }
  computeBBox() {
    this.updatePathIfDirty();
    return this.path.computeBBox();
  }
  isPointInPath(x, y) {
    this.updatePathIfDirty();
    return this.path.closedPath && this.path.isPointInPath(x, y);
  }
  distanceSquared(x, y) {
    return this.distanceSquaredTransformedPoint(x, y);
  }
  svgPathData(transform) {
    this.updatePathIfDirty();
    return this.path.toSVG(transform);
  }
  distanceSquaredTransformedPoint(x, y) {
    this.updatePathIfDirty();
    if (this.path.closedPath && this.path.isPointInPath(x, y)) {
      return 0;
    }
    return this.path.distanceSquared(x, y);
  }
  isDirtyPath() {
    return false;
  }
  updatePath() {
  }
  updatePathIfDirty() {
    if (this.dirtyPath || this.isDirtyPath()) {
      this.updatePath();
      this.dirtyPath = false;
    }
  }
  preRender(renderCtx) {
    if (renderCtx.devicePixelRatio !== this.lastPixelRatio) {
      this.dirtyPath = true;
    }
    this.lastPixelRatio = renderCtx.devicePixelRatio;
    this.updatePathIfDirty();
    return super.preRender(renderCtx, this.pathComplexity());
  }
  /**
   * Per-render complexity hint for {@link preRender}. Subclasses with externally-managed path
   * geometry (e.g. `Marker`, which uses a shared origin-centred path from a cache) override
   * this to avoid forcing `this.path` to lazy-allocate on every render.
   */
  pathComplexity() {
    return this.path.commands.length;
  }
  render(renderCtx) {
    const { ctx } = renderCtx;
    if (this.clip && !Number.isNaN(this._clipX) && !Number.isNaN(this._clipY)) {
      ctx.save();
      try {
        if (shadowPass.state !== "mask") {
          const margin = this.strokeWidth / 2;
          this._clipPath ?? (this._clipPath = new ExtendedPath2D());
          this._clipPath.clear();
          this._clipPath.rect(-margin, -margin, this._clipX + margin, this._clipY + margin + margin);
          ctx.clip(this._clipPath?.getPath2D());
        }
        if (this._clipX > 0 && this._clipY > 0) {
          this.drawPath(ctx, renderCtx.logger);
        }
      } finally {
        ctx.restore();
      }
    } else {
      this._clipPath = void 0;
      this.drawPath(ctx, renderCtx.logger);
    }
    super.render(renderCtx);
  }
  /** The rectangle, in the path's own coordinates, that {@link render} clips to, or undefined if it does not clip. */
  getShadowClip() {
    if (!this.clip || Number.isNaN(this._clipX) || Number.isNaN(this._clipY))
      return;
    const margin = this.strokeWidth / 2;
    return { x: -margin, y: -margin, width: this._clipX + margin, height: this._clipY + margin + margin };
  }
  drawPath(ctx, logger) {
    this.fillStroke(ctx, logger, this.path.getPath2D());
  }
  toSVG() {
    if (!this.visible)
      return;
    const element2 = createSvgElement("path");
    element2.setAttribute("d", this.svgPathData());
    const defs = this.applySvgFillAttributes(element2, []);
    this.applySvgStrokeAttributes(element2);
    return {
      elements: [element2],
      defs
    };
  }
}; _c$7.className = "Path"; __decorateClass([
  SceneChangeDetection()
], _c$7.prototype, "clip", 2); __decorateClass([
  SceneChangeDetection()
], _c$7.prototype, "clipX", 1); __decorateClass([
  SceneChangeDetection()
], _c$7.prototype, "clipY", 1); return _c$7; })()

// packages/ag-charts-core/src/scene/shadowCompositor.ts
var SHADOW_BLUR_REACH = 1.5;
var MAX_MASK_PAD = 4096;
var MAX_MASK_AREA = 4096 * 4096;
function getBatchedShadow(node) {
  if (!(node instanceof Shape))
    return;
  const shadow = node.__fillShadow;
  return shadow?.enabled === true && node.__drawingMode !== "cutout" ? shadow : void 0;
}
function getShadowClip(node) {
  if (!(node instanceof Path))
    return;
  const rect2 = node.getShadowClip();
  if (rect2 == null)
    return;
  const toParent = node.toParentPoint;
  const { x, y, width: width2, height: height2 } = rect2;
  const corners = [];
  for (const [cx, cy] of [
    [x, y],
    [x + width2, y],
    [x + width2, y + height2],
    [x, y + height2]
  ]) {
    const point = toParent == null ? { x: cx, y: cy } : toParent.call(node, cx, cy);
    corners.push(point.x, point.y);
  }
  return corners;
}
function sameClip(a, b) {
  if (a === b)
    return true;
  if (a == null || b == null)
    return false;
  return a.every((value, i) => value === b[i]);
}
function sameShadow(a, b) {
  return a === b || a.color === b.color && a.xOffset === b.xOffset && a.yOffset === b.yOffset && a.blur === b.blur && (a.spread ?? 0) === (b.spread ?? 0);
}
function fitPadding(width2, height2, padX, padY) {
  for (let scale = 1; scale >= 1 / 16; scale /= 2) {
    if ((width2 + padX * scale) * (height2 + padY * scale) <= MAX_MASK_AREA)
      return scale;
  }
  return width2 * height2 <= MAX_MASK_AREA ? 0 : void 0;
}
var pools = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
var DETACHED = {};
function getPool(scene) {
  const key = scene ?? DETACHED;
  let pool = pools.get(key);
  if (pool == null) {
    pool = { users: /* @__PURE__ */ new Set(), scratch: void 0 };
    pools.set(key, pool);
  }
  return pool;
}
function freeScratch(pool) {
  const { scratch } = pool;
  if (scratch == null)
    return;
  releaseSpreadCanvas(scratch.context);
  scratch.canvas.width = 0;
  scratch.canvas.height = 0;
  pool.scratch = void 0;
}
function acquireShadowScratch(scene, user, width2, height2) {
  const pool = getPool(scene);
  pool.users.add(user);
  let { scratch } = pool;
  if (scratch == null || scratch.canvas.width < width2 || scratch.canvas.height < height2) {
    const largestWidth = scratch?.canvas.width ?? 0;
    const largestHeight = scratch?.canvas.height ?? 0;
    freeScratch(pool);
    let canvasWidth = Math.max(width2, largestWidth);
    let canvasHeight = Math.max(height2, largestHeight);
    if (canvasWidth * canvasHeight > MAX_MASK_AREA) {
      canvasWidth = width2;
      canvasHeight = height2;
    }
    const OffscreenCanvasCtor = getOffscreenCanvas();
    const canvas = new OffscreenCanvasCtor(canvasWidth, canvasHeight);
    const context = canvas.getContext("2d");
    if (context == null) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }
    scratch = { canvas, context };
    pool.scratch = scratch;
  }
  return scratch;
}
function releaseShadowScratch(scene, user) {
  const pool = pools.get(scene ?? DETACHED);
  if (pool == null || !pool.users.delete(user) || pool.users.size > 0)
    return;
  freeScratch(pool);
}
function destroyShadowScratch(scene) {
  const pool = pools.get(scene);
  if (pool == null)
    return;
  pool.users.clear();
  freeScratch(pool);
}
function renderPass(children, renderCtx, state2) {
  const previous = shadowPass.state;
  shadowPass.state = state2;
  try {
    for (const child of children) {
      child.isolatedRender(renderCtx);
    }
  } finally {
    shadowPass.state = previous;
  }
}
function renderBatch(scene, user, casters, shadow, clip, renderCtx) {
  const { ctx, devicePixelRatio } = renderCtx;
  const width2 = Math.ceil(ctx.canvas.width);
  const height2 = Math.ceil(ctx.canvas.height);
  const blur = shadow.blur * devicePixelRatio;
  const offsetX = shadow.xOffset * devicePixelRatio;
  const offsetY = shadow.yOffset * devicePixelRatio;
  if (!(width2 > 0 && height2 > 0 && isFiniteNumber(blur) && isFiniteNumber(offsetX) && isFiniteNumber(offsetY))) {
    return false;
  }
  const reach = Math.ceil(blur * SHADOW_BLUR_REACH + Math.max(0, shadow.spread ?? 0) * devicePixelRatio);
  const padLeft = Math.min(Math.ceil(Math.max(0, offsetX)) + reach, MAX_MASK_PAD);
  const padRight = Math.min(Math.ceil(Math.max(0, -offsetX)) + reach, MAX_MASK_PAD);
  const padTop = Math.min(Math.ceil(Math.max(0, offsetY)) + reach, MAX_MASK_PAD);
  const padBottom = Math.min(Math.ceil(Math.max(0, -offsetY)) + reach, MAX_MASK_PAD);
  const padScale = fitPadding(width2, height2, padLeft + padRight, padTop + padBottom);
  if (padScale == null)
    return false;
  const padL = Math.floor(padLeft * padScale);
  const padT = Math.floor(padTop * padScale);
  const maskWidth = width2 + padL + Math.floor(padRight * padScale);
  const maskHeight = height2 + padT + Math.floor(padBottom * padScale);
  const acquired = acquireShadowScratch(scene, user, maskWidth, maskHeight);
  if (acquired == null)
    return false;
  const { canvas, context: scratch } = acquired;
  scratch.save();
  try {
    scratch.setTransform(1, 0, 0, 1, 0, 0);
    scratch.clearRect(0, 0, maskWidth, maskHeight);
    const { a, b, c, d, e, f } = ctx.getTransform();
    scratch.setTransform(a, b, c, d, e + padL, f + padT);
    scratch.globalAlpha = ctx.globalAlpha;
    scratch.direction = ctx.direction;
    renderPass(
      casters,
      { ...renderCtx, ctx: scratch, stats: void 0, debugNodeSearch: void 0, currentFont: void 0 },
      "mask"
    );
  } finally {
    scratch.restore();
  }
  const distance2 = maskWidth;
  ctx.save();
  try {
    if (clip != null) {
      ctx.beginPath();
      ctx.moveTo(clip[0], clip[1]);
      for (let i = 2; i < clip.length; i += 2)
        ctx.lineTo(clip[i], clip[i + 1]);
      ctx.closePath();
      ctx.clip();
    }
    ctx.resetTransform();
    ctx.globalAlpha = 1;
    ctx.shadowColor = shadow.color;
    ctx.shadowOffsetX = offsetX + distance2;
    ctx.shadowOffsetY = offsetY;
    ctx.shadowBlur = blur;
    ctx.drawImage(canvas, 0, 0, maskWidth, maskHeight, -padL - distance2, -padT, maskWidth, maskHeight);
  } finally {
    ctx.restore();
  }
  renderPass(casters, renderCtx, "suppress");
  return true;
}
function renderChildrenWithShadowBatches(children, scene, user, renderCtx) {
  const { stats } = renderCtx;
  let run = [];
  let runShadow;
  let runClip;
  const flush2 = () => {
    if (run.length === 0)
      return;
    if (runShadow == null || !renderBatch(scene, user, run, runShadow, runClip, renderCtx)) {
      for (const caster of run)
        caster.isolatedRender(renderCtx);
    }
    run = [];
    runShadow = void 0;
    runClip = void 0;
  };
  for (const child of children) {
    if (!child.visible) {
      if (stats) {
        stats.nodesSkipped += child.childNodeCounts.nonGroups + child.childNodeCounts.groups;
        stats.opsSkipped += child.childNodeCounts.complexity;
      }
      continue;
    }
    const shadow = getBatchedShadow(child);
    const clip = shadow == null ? void 0 : getShadowClip(child);
    if (shadow == null || runShadow != null && !(sameShadow(runShadow, shadow) && sameClip(runClip, clip))) {
      flush2();
    }
    if (shadow == null) {
      child.isolatedRender(renderCtx);
      continue;
    }
    if (runShadow == null) {
      runShadow = shadow;
      runClip = clip;
    }
    run.push(child);
  }
  flush2();
}

// packages/ag-charts-core/src/scene/matrix.ts
var IDENTITY_MATRIX_ELEMENTS = [1, 0, 0, 1, 0, 0];
var Matrix = class _Matrix {
  get e() {
    return [...this.elements];
  }
  constructor(elements = IDENTITY_MATRIX_ELEMENTS) {
    this.elements = [...elements];
  }
  setElements(elements) {
    const e = this.elements;
    e[0] = elements[0];
    e[1] = elements[1];
    e[2] = elements[2];
    e[3] = elements[3];
    e[4] = elements[4];
    e[5] = elements[5];
    return this;
  }
  get identity() {
    const e = this.elements;
    return isNumberEqual(e[0], 1) && isNumberEqual(e[1], 0) && isNumberEqual(e[2], 0) && isNumberEqual(e[3], 1) && isNumberEqual(e[4], 0) && isNumberEqual(e[5], 0);
  }
  /**
   * Performs the AxB matrix multiplication and saves the result
   * to `C`, if given, or to `A` otherwise.
   */
  AxB(A, B, C) {
    const a = A[0] * B[0] + A[2] * B[1], b = A[1] * B[0] + A[3] * B[1], c = A[0] * B[2] + A[2] * B[3], d = A[1] * B[2] + A[3] * B[3], e = A[0] * B[4] + A[2] * B[5] + A[4], f = A[1] * B[4] + A[3] * B[5] + A[5];
    C = C ?? A;
    C[0] = a;
    C[1] = b;
    C[2] = c;
    C[3] = d;
    C[4] = e;
    C[5] = f;
  }
  /**
   * The `other` matrix gets post-multiplied to the current matrix.
   * Returns the current matrix.
   * @param other
   */
  multiplySelf(other) {
    this.AxB(this.elements, other.elements);
    return this;
  }
  /**
   * The `other` matrix gets post-multiplied to the current matrix.
   * Returns a new matrix.
   * @param other
   */
  multiply(other) {
    const elements = [Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN];
    if (other instanceof _Matrix) {
      this.AxB(this.elements, other.elements, elements);
    } else {
      this.AxB(this.elements, [other.a, other.b, other.c, other.d, other.e, other.f], elements);
    }
    return new _Matrix(elements);
  }
  preMultiplySelf(other) {
    this.AxB(other.elements, this.elements, this.elements);
    return this;
  }
  /**
   * Returns the inverse of this matrix as a new matrix.
   */
  inverse() {
    const el = this.elements;
    let a = el[0], b = el[1], c = el[2], d = el[3];
    const e = el[4], f = el[5];
    const rD = 1 / (a * d - b * c);
    a *= rD;
    b *= rD;
    c *= rD;
    d *= rD;
    return new _Matrix([d, -b, -c, a, c * f - d * e, b * e - a * f]);
  }
  invertSelf() {
    const el = this.elements;
    let a = el[0], b = el[1], c = el[2], d = el[3];
    const e = el[4], f = el[5];
    const rD = 1 / (a * d - b * c);
    a *= rD;
    b *= rD;
    c *= rD;
    d *= rD;
    el[0] = d;
    el[1] = -b;
    el[2] = -c;
    el[3] = a;
    el[4] = c * f - d * e;
    el[5] = b * e - a * f;
    return this;
  }
  transformPoint(x, y) {
    const e = this.elements;
    return {
      x: x * e[0] + y * e[2] + e[4],
      y: x * e[1] + y * e[3] + e[5]
    };
  }
  transformBBox(bbox, target) {
    const el = this.elements;
    const xx = el[0];
    const xy = el[1];
    const yx = el[2];
    const yy = el[3];
    const h_w = bbox.width * 0.5;
    const h_h = bbox.height * 0.5;
    const cx = bbox.x + h_w;
    const cy = bbox.y + h_h;
    const w = Math.abs(h_w * xx) + Math.abs(h_h * yx);
    const h = Math.abs(h_w * xy) + Math.abs(h_h * yy);
    target ?? (target = new BBox(0, 0, 0, 0));
    target.x = cx * xx + cy * yx + el[4] - w;
    target.y = cx * xy + cy * yy + el[5] - h;
    target.width = w + w;
    target.height = h + h;
    return target;
  }
  toContext(ctx) {
    if (this.identity) {
      return;
    }
    const e = this.elements;
    ctx.transform(e[0], e[1], e[2], e[3], e[4], e[5]);
  }
  static updateTransformMatrix(matrix, scalingX, scalingY, rotation, translationX, translationY, opts) {
    const sx = scalingX;
    const sy = scalingY;
    let scx;
    let scy;
    if (sx === 1 && sy === 1) {
      scx = 0;
      scy = 0;
    } else {
      scx = opts?.scalingCenterX ?? 0;
      scy = opts?.scalingCenterY ?? 0;
    }
    const r = rotation;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    let rcx;
    let rcy;
    if (r === 0) {
      rcx = 0;
      rcy = 0;
    } else {
      rcx = opts?.rotationCenterX ?? 0;
      rcy = opts?.rotationCenterY ?? 0;
    }
    const tx = translationX;
    const ty = translationY;
    const tx4 = scx * (1 - sx) - rcx;
    const ty4 = scy * (1 - sy) - rcy;
    matrix.setElements([
      cos * sx,
      sin * sx,
      -sin * sy,
      cos * sy,
      cos * tx4 - sin * ty4 + rcx + tx,
      sin * tx4 + cos * ty4 + rcy + ty
    ]);
    return matrix;
  }
};

// packages/ag-charts-core/src/scene/transformable.ts
function isMatrixTransform(node) {
  return isMatrixTransformType(node.constructor);
}
var MATRIX_TRANSFORM_TYPE = /*#__PURE__*/ Symbol("isMatrixTransform");
function isMatrixTransformType(cstr) {
  return cstr[MATRIX_TRANSFORM_TYPE] === true;
}
function MatrixTransform(Parent) {
  var _a, _b;
  const ParentNode = Parent;
  if (isMatrixTransformType(Parent)) {
    return Parent;
  }
  const TRANSFORM_MATRIX = Symbol("matrix_combined_transform");
  class MatrixTransformInternal extends ParentNode {
    constructor() {
      super(...arguments);
      this[_b] = new Matrix();
      this._dirtyTransform = true;
    }
    onChangeDetection(property) {
      super.onChangeDetection(property);
      this._dirtyTransform = true;
      if (this.batchLevel > 0) {
        return;
      }
      this.markDirty("transform");
    }
    updateMatrix(_matrix) {
    }
    computeTransformMatrix() {
      if (!this._dirtyTransform)
        return;
      this[TRANSFORM_MATRIX].setElements(IDENTITY_MATRIX_ELEMENTS);
      this.updateMatrix(this[TRANSFORM_MATRIX]);
      this._dirtyTransform = false;
    }
    toParent(bbox) {
      this.computeTransformMatrix();
      if (this[TRANSFORM_MATRIX].identity)
        return bbox.clone();
      return this[TRANSFORM_MATRIX].transformBBox(bbox);
    }
    toParentPoint(x, y) {
      this.computeTransformMatrix();
      if (this[TRANSFORM_MATRIX].identity)
        return { x, y };
      return this[TRANSFORM_MATRIX].transformPoint(x, y);
    }
    fromParent(bbox) {
      this.computeTransformMatrix();
      if (this[TRANSFORM_MATRIX].identity)
        return bbox.clone();
      return this[TRANSFORM_MATRIX].inverse().transformBBox(bbox);
    }
    fromParentPoint(x, y) {
      this.computeTransformMatrix();
      if (this[TRANSFORM_MATRIX].identity)
        return { x, y };
      return this[TRANSFORM_MATRIX].inverse().transformPoint(x, y);
    }
    computeBBox() {
      const bbox = super.computeBBox();
      if (!bbox)
        return bbox;
      return this.toParent(bbox);
    }
    computeBBoxWithoutTransforms() {
      return super.computeBBox();
    }
    pickNode(x, y) {
      ({ x, y } = this.fromParentPoint(x, y));
      return super.pickNode(x, y);
    }
    pickNodes(x, y, into) {
      ({ x, y } = this.fromParentPoint(x, y));
      return super.pickNodes(x, y, into);
    }
    distanceSquared(x, y) {
      ({ x, y } = this.fromParentPoint(x, y));
      return super.distanceSquared(x, y);
    }
    render(renderCtx) {
      this.computeTransformMatrix();
      const { ctx } = renderCtx;
      const matrix = this[TRANSFORM_MATRIX];
      let performRestore = false;
      try {
        if (!matrix.identity) {
          ctx.save();
          performRestore = true;
          matrix.toContext(ctx);
        }
        super.render(renderCtx);
      } finally {
        if (performRestore) {
          ctx.restore();
        }
      }
    }
    toSVG() {
      this.computeTransformMatrix();
      const svg = super.toSVG();
      const matrix = this[TRANSFORM_MATRIX];
      if (matrix.identity || svg == null)
        return svg;
      const g = createSvgElement("g");
      g.append(...svg.elements);
      const [a, b, c, d, e, f] = matrix.e;
      g.setAttribute("transform", `matrix(${a} ${b} ${c} ${d} ${e} ${f})`);
      return {
        elements: [g],
        defs: svg.defs
      };
    }
  }
  _a = MATRIX_TRANSFORM_TYPE, _b = TRANSFORM_MATRIX;
  MatrixTransformInternal[_a] = true;
  return MatrixTransformInternal;
}
function isRotatable(node) {
  return "rotation" in node && "rotationCenterX" in node && "rotationCenterY" in node;
}
function Rotatable(Parent) {
  var _a;
  const ParentNode = Parent;
  const ROTATABLE_MATRIX = Symbol("matrix_rotation");
  class RotatableInternal extends MatrixTransform(ParentNode) {
    constructor() {
      super(...arguments);
      this[_a] = new Matrix();
      this.rotationCenterX = 0;
      this.rotationCenterY = 0;
      this.rotation = 0;
    }
    serialize() {
      const state2 = super.serialize();
      state2.props.rotation = this.rotation;
      return state2;
    }
    updateMatrix(matrix) {
      super.updateMatrix(matrix);
      const { rotation, rotationCenterX, rotationCenterY } = this;
      if (rotation === 0)
        return;
      Matrix.updateTransformMatrix(this[ROTATABLE_MATRIX], 1, 1, rotation, 0, 0, {
        rotationCenterX,
        rotationCenterY
      });
      matrix.multiplySelf(this[ROTATABLE_MATRIX]);
    }
  }
  _a = ROTATABLE_MATRIX;
  __decorateClass([
    SceneChangeDetection()
  ], RotatableInternal.prototype, "rotationCenterX", 2);
  __decorateClass([
    SceneChangeDetection()
  ], RotatableInternal.prototype, "rotationCenterY", 2);
  __decorateClass([
    SceneChangeDetection()
  ], RotatableInternal.prototype, "rotation", 2);
  return RotatableInternal;
}
function isScalable(node) {
  return "scalingX" in node && "scalingY" in node && "scalingCenterX" in node && "scalingCenterY" in node;
}
function Scalable(Parent) {
  var _a;
  const ParentNode = Parent;
  const SCALABLE_MATRIX = Symbol("matrix_scale");
  class ScalableInternal extends MatrixTransform(ParentNode) {
    constructor() {
      super(...arguments);
      this[_a] = new Matrix();
      this.scalingX = 1;
      this.scalingY = 1;
      this.scalingCenterX = 0;
      this.scalingCenterY = 0;
    }
    // optimised field accessor
    serialize() {
      const state2 = super.serialize();
      state2.props.scalingX = this.scalingX;
      state2.props.scalingY = this.scalingY;
      return state2;
    }
    updateMatrix(matrix) {
      super.updateMatrix(matrix);
      const { scalingX, scalingY, scalingCenterX, scalingCenterY } = this;
      if (scalingX === 1 && scalingY === 1)
        return;
      Matrix.updateTransformMatrix(this[SCALABLE_MATRIX], scalingX, scalingY, 0, 0, 0, {
        scalingCenterX,
        scalingCenterY
      });
      matrix.multiplySelf(this[SCALABLE_MATRIX]);
    }
    /**
     * Optimised reset for animation hot paths.
     * Bypasses SceneChangeDetection decorators by writing directly to backing fields.
     */
    resetScalingProperties(scalingX, scalingY, scalingCenterX, scalingCenterY) {
      this.__scalingX = scalingX;
      this.__scalingY = scalingY;
      this.__scalingCenterX = scalingCenterX;
      this.__scalingCenterY = scalingCenterY;
      this.onChangeDetection("scaling");
    }
  }
  _a = SCALABLE_MATRIX;
  __decorateClass([
    SceneChangeDetection()
  ], ScalableInternal.prototype, "scalingX", 2);
  __decorateClass([
    SceneChangeDetection()
  ], ScalableInternal.prototype, "scalingY", 2);
  __decorateClass([
    SceneChangeDetection()
  ], ScalableInternal.prototype, "scalingCenterX", 2);
  __decorateClass([
    SceneChangeDetection()
  ], ScalableInternal.prototype, "scalingCenterY", 2);
  return ScalableInternal;
}
function Translatable(Parent) {
  var _a;
  const ParentNode = Parent;
  const TRANSLATABLE_MATRIX = Symbol("matrix_translation");
  class TranslatableInternal extends MatrixTransform(ParentNode) {
    constructor() {
      super(...arguments);
      this[_a] = new Matrix();
      this.translationX = 0;
      this.translationY = 0;
    }
    serialize() {
      const state2 = super.serialize();
      state2.props.translationX = this.translationX;
      state2.props.translationY = this.translationY;
      return state2;
    }
    updateMatrix(matrix) {
      super.updateMatrix(matrix);
      const { translationX, translationY } = this;
      if (translationX === 0 && translationY === 0)
        return;
      Matrix.updateTransformMatrix(this[TRANSLATABLE_MATRIX], 1, 1, 0, translationX, translationY);
      matrix.multiplySelf(this[TRANSLATABLE_MATRIX]);
    }
  }
  _a = TRANSLATABLE_MATRIX;
  __decorateClass([
    SceneChangeDetection()
  ], TranslatableInternal.prototype, "translationX", 2);
  __decorateClass([
    SceneChangeDetection()
  ], TranslatableInternal.prototype, "translationY", 2);
  return TranslatableInternal;
}
var Transformable = class {
  /**
   * Converts a BBox from canvas coordinate space into the coordinate space of the given Node.
   */
  static fromCanvas(node, bbox) {
    const parents = [];
    for (const parent of node.traverseUp()) {
      if (isMatrixTransform(parent)) {
        parents.unshift(parent);
      }
    }
    for (const parent of parents) {
      bbox = parent.fromParent(bbox);
    }
    if (isMatrixTransform(node)) {
      bbox = node.fromParent(bbox);
    }
    return bbox;
  }
  /**
   * Converts a Nodes BBox (or an arbitrary BBox if supplied) from local Node coordinate space
   * into the Canvas coordinate space.
   */
  static toCanvas(node, bbox) {
    if (bbox == null) {
      bbox = node.getBBox();
    } else if (isMatrixTransform(node)) {
      bbox = node.toParent(bbox);
    }
    for (const parent of node.traverseUp()) {
      if (isMatrixTransform(parent)) {
        bbox = parent.toParent(bbox);
      }
    }
    return bbox;
  }
  /**
   * Converts a point from canvas coordinate space into the coordinate space of the given Node.
   */
  static fromCanvasPoint(node, canvasPoint) {
    let { canvasX: x, canvasY: y } = canvasPoint;
    const parents = [];
    for (const parent of node.traverseUp()) {
      if (isMatrixTransform(parent)) {
        parents.unshift(parent);
      }
    }
    for (const parent of parents) {
      ({ x, y } = parent.fromParentPoint(x, y));
    }
    if (isMatrixTransform(node)) {
      ({ x, y } = node.fromParentPoint(x, y));
    }
    return { x, y };
  }
  /**
   * Converts a point from a Nodes local coordinate space into the Canvas coordinate space.
   */
  static toCanvasPoint(node, x, y) {
    if (isMatrixTransform(node)) {
      ({ x, y } = node.toParentPoint(x, y));
    }
    for (const parent of node.traverseUp()) {
      if (isMatrixTransform(parent)) {
        ({ x, y } = parent.toParentPoint(x, y));
      }
    }
    return { canvasX: x, canvasY: y };
  }
};

// packages/ag-charts-core/src/scene/group.ts
var sharedOffscreenCanvas;
var _Group = /*#__PURE__*/ (() => { var _c$8 = class _Group extends Node {
  constructor(opts) {
    super(opts);
    this.childNodes = /* @__PURE__ */ new Set();
    this.dirty = false;
    this.dirtyZIndex = false;
    this.clipRect = void 0;
    this.opacity = 1;
    this.batchShadows = false;
    /** The children that cast a batched shadow, counted by {@link preRender}, or -1 until then. */
    this.shadowCasterCount = -1;
    this._childFontDirty = true;
    // Used when renderToOffscreenCanvas: true
    this.layer = void 0;
    // optimizeForInfrequentRedraws: false
    this.image = void 0;
    this._lastWidth = Number.NaN;
    this._lastHeight = Number.NaN;
    this._lastDevicePixelRatio = Number.NaN;
    this.isContainerNode = true;
    this.renderToOffscreenCanvas = opts?.renderToOffscreenCanvas === true;
    this.optimizeForInfrequentRedraws = opts?.optimizeForInfrequentRedraws === true;
  }
  static is(value) {
    return value instanceof _Group;
  }
  static computeChildrenBBox(nodes, skipInvisible = true) {
    return BBox.merge(Node.extractBBoxes(nodes, skipInvisible));
  }
  static compareChildren(a, b) {
    const zIndexOrder = compareZIndex(a.__zIndex, b.__zIndex);
    return zIndexOrder === 0 ? a.serialNumber - b.serialNumber : zIndexOrder;
  }
  serialize() {
    return { type: "group", props: this.serializeProps() };
  }
  serializeProps() {
    return { ...super.serializeProps(), opacity: this.opacity };
  }
  // optimizeForInfrequentRedraws: true
  // Consistency with the rest of the scene outweighs the compositing optimisation.
  get useOffscreenCanvas() {
    return this.renderToOffscreenCanvas && canRenderTextOffscreen();
  }
  // We consider a group to be boundless, thus any point belongs to it.
  containsPoint(_x, _y) {
    return true;
  }
  computeBBox() {
    return _Group.computeChildrenBBox(this.children());
  }
  computeSafeClippingBBox(pixelRatio) {
    const bbox = this.computeBBox();
    if (bbox?.isFinite() !== true)
      return;
    let strokeWidth = 0;
    const strokeMiterAmount = 4;
    for (const child of this.descendants()) {
      if (child instanceof Shape) {
        strokeWidth = Math.max(strokeWidth, child.strokeWidth);
      }
    }
    const padding2 = Math.max(
      // Account for anti-aliasing artefacts
      1,
      // Account for strokes (incl. miters) - this may not be the best place to include this
      strokeWidth / 2 * strokeMiterAmount
    );
    const { canvasX: originX, canvasY: originY } = Transformable.toCanvasPoint(this, 0, 0);
    const x = alignBefore(pixelRatio, originX + bbox.x - padding2) - originX;
    const y = alignBefore(pixelRatio, originY + bbox.y - padding2) - originY;
    const width2 = Math.ceil(bbox.x + bbox.width - x + padding2);
    const height2 = Math.ceil(bbox.y + bbox.height - y + padding2);
    return new BBox(x, y, width2, height2);
  }
  prepareSharedCanvas(width2, height2, pixelRatio) {
    if (sharedOffscreenCanvas?.pixelRatio === pixelRatio) {
      sharedOffscreenCanvas.resize(width2, height2, pixelRatio);
    } else {
      sharedOffscreenCanvas = new HdpiOffscreenCanvas({ width: width2, height: height2, pixelRatio });
    }
    return sharedOffscreenCanvas;
  }
  setScene(scene) {
    const previousScene = this.scene;
    super.setScene(scene);
    if (previousScene !== scene) {
      releaseShadowScratch(previousScene, this);
    }
    if (this.layer && previousScene && previousScene !== scene) {
      previousScene.layersManager.removeLayer(this.layer);
      this.layer = void 0;
    }
    for (const child of this.children()) {
      child.setScene(scene);
    }
  }
  resolveFont() {
    if (this.useOffscreenCanvas)
      return void 0;
    return this.resolveChildFont();
  }
  resolveChildFont() {
    if (this._childFontDirty) {
      this._cachedChildFont = void 0;
      for (const child of this.children()) {
        const font = child.resolveFont();
        if (font != null) {
          this._cachedChildFont = font;
          break;
        }
      }
      this._childFontDirty = false;
    }
    return this._cachedChildFont;
  }
  markDirty(property) {
    this.dirty = true;
    this._childFontDirty = true;
    this.shadowCasterCount = -1;
    super.markDirty(property);
  }
  markDirtyChildrenOrder() {
    super.markDirtyChildrenOrder();
    this.dirtyZIndex = true;
    this.markDirty();
  }
  /**
   * Appends one or more new node instances to this parent.
   * If one needs to:
   * - move a child to the end of the list of children
   * - move a child from one parent to another (including parents in other scenes)
   * one should use the {@link insertBefore} method instead.
   * @param nodes A node or nodes to append.
   */
  append(nodes) {
    for (const node of toIterable(nodes)) {
      node.remove();
      this.childNodes.add(node);
      node.parentNode = this;
      node.setScene(this.scene);
    }
    this.markDirtyChildrenOrder();
    this.markDirty();
  }
  appendChild(node) {
    this.append(node);
    return node;
  }
  removeChild(node) {
    if (!this.childNodes?.delete(node)) {
      throw new Error(
        `AG Charts - internal error, unknown child node ${node.name ?? node.id} in $${this.name ?? this.id}`
      );
    }
    node.parentNode = void 0;
    node.setScene();
    this.markDirtyChildrenOrder();
    this.markDirty();
  }
  clear() {
    for (const child of this.children()) {
      delete child.parentNode;
      child.setScene();
    }
    this.childNodes?.clear();
    this.markDirty();
  }
  /**
   * Hit testing method.
   * Recursively checks if the given point is inside this node or any of its children.
   * Returns the first matching node or `undefined`.
   * Nodes that render later (show on top) are hit tested first.
   */
  pickNode(x, y) {
    if (!this.visible || this.pointerEvents === 1 /* None */ || !this.containsPoint(x, y)) {
      return;
    }
    if (this.childNodes != null && this.childNodes.size !== 0) {
      const children = [...this.children()];
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        const hit = child.pickNode(x, y);
        if (hit != null) {
          return hit;
        }
      }
    } else if (!this.isContainerNode) {
      return this;
    }
  }
  pickNodes(x, y, into = []) {
    if (!this.visible || this.pointerEvents === 1 /* None */ || !this.containsPoint(x, y)) {
      return into;
    }
    if (!this.isContainerNode) {
      into.push(this);
    }
    for (const child of this.children()) {
      child.pickNodes(x, y, into);
    }
    return into;
  }
  isDirty(renderCtx) {
    const { width: width2, height: height2, devicePixelRatio } = renderCtx;
    const { dirty, layer } = this;
    const layerResized = layer != null && (this._lastWidth !== width2 || this._lastHeight !== height2);
    const pixelRatioChanged = this._lastDevicePixelRatio !== devicePixelRatio;
    this._lastWidth = width2;
    this._lastHeight = height2;
    this._lastDevicePixelRatio = devicePixelRatio;
    return dirty || layerResized || pixelRatioChanged;
  }
  preRender(renderCtx) {
    let counts;
    if (this.dirty) {
      counts = super.preRender(renderCtx, 0);
      const countCasters = this.batchShadows;
      let casters = 0;
      for (const child of this.children()) {
        const childCounts = child.preRender(renderCtx);
        counts.groups += childCounts.groups;
        counts.nonGroups += childCounts.nonGroups;
        counts.complexity += childCounts.complexity;
        if (countCasters && getBatchedShadow(child) != null)
          casters++;
      }
      this.shadowCasterCount = casters;
      if (casters === 0) {
        releaseShadowScratch(this.scene, this);
      }
      counts.groups += 1;
      counts.nonGroups -= 1;
    } else {
      counts = this.childNodeCounts;
    }
    if (this.useOffscreenCanvas && !this.optimizeForInfrequentRedraws && counts.nonGroups > 0 && this.getVisibility()) {
      if (this.layer == null) {
        this.layer = this.layerManager?.addLayer({ name: this.name });
        this.dirty || (this.dirty = this.layer != null);
      }
    } else if (this.layer != null) {
      this.layerManager?.removeLayer(this.layer);
      this.layer = void 0;
    }
    return counts;
  }
  render(renderCtx) {
    const { layer, useOffscreenCanvas } = this;
    const childRenderCtx = { ...renderCtx };
    const dirty = this.isDirty(renderCtx);
    this.dirty = false;
    if (!useOffscreenCanvas) {
      this.renderInContext(childRenderCtx);
      super.render(childRenderCtx);
      return;
    }
    const { ctx, stats, devicePixelRatio: pixelRatio } = renderCtx;
    let { image } = this;
    if (dirty) {
      image?.bitmap.close();
      image = void 0;
      const bbox = layer ? void 0 : this.computeSafeClippingBBox(pixelRatio);
      const renderOffscreen = (offscreenCanvas, ...transform) => {
        const offscreenCtx = offscreenCanvas.context;
        offscreenCtx.direction = childRenderCtx.direction;
        childRenderCtx.ctx = offscreenCtx;
        childRenderCtx.currentFont = void 0;
        offscreenCanvas.clear();
        offscreenCtx.save();
        try {
          offscreenCtx.setTransform(...transform);
          offscreenCtx.globalAlpha = 1;
          this.renderInContext(childRenderCtx);
        } finally {
          offscreenCtx.restore();
          offscreenCtx.verifyDepthZero?.();
        }
      };
      if (layer) {
        renderOffscreen(layer, ctx.getTransform());
      } else if (bbox) {
        const { x, y, width: width2, height: height2 } = bbox;
        const scaledWidth = Math.floor(width2 * pixelRatio);
        const scaledHeight = Math.floor(height2 * pixelRatio);
        if (scaledWidth > 0 && scaledHeight > 0) {
          const canvas = this.prepareSharedCanvas(width2, height2, pixelRatio);
          renderOffscreen(canvas, pixelRatio, 0, 0, pixelRatio, -x * pixelRatio, -y * pixelRatio);
          image = { bitmap: canvas.transferToImageBitmap(), x, y, width: width2, height: height2 };
        }
      }
      this.image = image;
      if (stats)
        stats.layersRendered++;
    } else if (stats) {
      stats.layersSkipped++;
    }
    const { globalAlpha } = ctx;
    ctx.globalAlpha = globalAlpha * this.opacity;
    if (layer) {
      ctx.save();
      try {
        ctx.resetTransform();
        layer.drawImage(ctx);
      } finally {
        ctx.restore();
      }
    } else if (image) {
      const { bitmap, x, y, width: width2, height: height2 } = image;
      ctx.drawImage(bitmap, 0, 0, width2 * pixelRatio, height2 * pixelRatio, x, y, width2, height2);
    }
    ctx.globalAlpha = globalAlpha;
    super.render(childRenderCtx);
  }
  applyClip(ctx, clipRect) {
    const { x, y, width: width2, height: height2 } = clipRect;
    ctx.beginPath();
    ctx.rect(x, y, width2, height2);
    ctx.clip();
  }
  renderInContext(childRenderCtx) {
    const { ctx, stats } = childRenderCtx;
    if (this.dirtyZIndex) {
      this.sortChildren(_Group.compareChildren);
      this.dirtyZIndex = false;
    }
    ctx.save();
    try {
      ctx.globalAlpha *= this.opacity;
      const childFont = this.resolveChildFont();
      if (childFont != null && childRenderCtx.currentFont !== childFont) {
        ctx.font = childFont;
        childRenderCtx.currentFont = childFont;
      }
      if (this.clipRect != null) {
        this.applyClip(ctx, this.clipRect);
        childRenderCtx.clipBBox = Transformable.toCanvas(this, this.clipRect);
      }
      if (this.batchShadows && this.countShadowCasters() > 0) {
        renderChildrenWithShadowBatches(this.children(), this.scene, this, childRenderCtx);
        return;
      }
      for (const child of this.children()) {
        if (!child.visible) {
          if (stats) {
            stats.nodesSkipped += child.childNodeCounts.nonGroups + child.childNodeCounts.groups;
            stats.opsSkipped += child.childNodeCounts.complexity;
          }
          continue;
        }
        child.isolatedRender(childRenderCtx);
      }
    } finally {
      ctx.restore();
    }
  }
  /** The number of children that cast a batched shadow, which is cached until the group is next marked dirty. */
  countShadowCasters() {
    if (this.shadowCasterCount < 0) {
      let casters = 0;
      for (const child of this.children()) {
        if (getBatchedShadow(child) != null)
          casters++;
      }
      this.shadowCasterCount = casters;
    }
    return this.shadowCasterCount;
  }
  sortChildren(compareFn) {
    const sortedChildren = [...this.childNodes].sort(compareFn);
    this.childNodes.clear();
    for (const child of sortedChildren) {
      this.childNodes.add(child);
    }
  }
  *children() {
    yield* this.childNodes;
  }
  *excludeChildren(exclude) {
    for (const child of this.children()) {
      if (exclude.instance && !(child instanceof exclude.instance) || exclude.name != null && exclude.name !== "" && child.name !== exclude.name) {
        yield child;
      }
    }
  }
  *descendants() {
    for (const child of this.children()) {
      yield child;
      if (child instanceof _Group) {
        yield* child.descendants();
      }
    }
  }
  /**
   * Transforms bbox given in the canvas coordinate space to bbox in this group's coordinate space and
   * sets this group's clipRect to the transformed bbox.
   * @param bbox clipRect bbox in the canvas coordinate space.
   */
  setClipRect(bbox) {
    this.clipRect = bbox ? Transformable.fromCanvas(this, bbox) : void 0;
  }
  /**
   * Set the clip rect within the canvas coordinate space.
   * @param bbox clipRect bbox in the canvas coordinate space.
   */
  setClipRectCanvasSpace(bbox) {
    this.clipRect = bbox;
  }
  getVisibility() {
    for (const node of this.traverseUp(true)) {
      if (!node.visible) {
        return false;
      }
    }
    return true;
  }
  toSVG() {
    if (!this.visible)
      return;
    const defs = [];
    const elements = [];
    for (const child of this.children()) {
      const svg = child.toSVG();
      if (svg != null) {
        elements.push(...svg.elements);
        if (svg.defs != null) {
          defs.push(...svg.defs);
        }
      }
    }
    return { elements, defs };
  }
}; _c$8.className = "Group"; __decorateClass([
  SceneChangeDetection({ convertor: (v) => clamp(0, v, 1) })
], _c$8.prototype, "opacity", 2); __decorateClass([
  SceneChangeDetection()
], _c$8.prototype, "batchShadows", 2); return _c$8; })()
var Group = _Group;
var ScalableGroup = /*#__PURE__*/ Scalable(Group);
var RotatableGroup = /*#__PURE__*/ Rotatable(Group);
var TranslatableGroup = /*#__PURE__*/ Translatable(Group);
var TransformableGroup = /*#__PURE__*/ Rotatable(
  Translatable(Group)
);

// packages/ag-charts-core/src/scene/image.ts
var Image2 = /*#__PURE__*/ (() => { var _c$9 = class extends Node {
  constructor(sourceImage) {
    super();
    this.sourceImage = sourceImage;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.opacity = 1;
  }
  render(renderCtx) {
    const { ctx } = renderCtx;
    const image = this.sourceImage;
    if (image) {
      ctx.globalAlpha = this.opacity;
      ctx.drawImage(image, 0, 0, image.width, image.height, this.x, this.y, this.width, this.height);
    }
    super.render(renderCtx);
  }
}; __decorateClass([
  SceneChangeDetection()
], _c$9.prototype, "x", 2); __decorateClass([
  SceneChangeDetection()
], _c$9.prototype, "y", 2); __decorateClass([
  SceneChangeDetection()
], _c$9.prototype, "width", 2); __decorateClass([
  SceneChangeDetection()
], _c$9.prototype, "height", 2); __decorateClass([
  SceneChangeDetection()
], _c$9.prototype, "opacity", 2); return _c$9; })()

// packages/ag-charts-core/src/scene/image/imageLoader.ts
var ImageLoader = class extends EventEmitter {
  constructor() {
    super(...arguments);
    this.cache = /* @__PURE__ */ new Map();
    this.imageLoadingCount = 0;
    this.destroyed = false;
  }
  loadImage(uri, affectedNode, sizeHint) {
    const cacheKey = computeCacheKey(uri, sizeHint);
    const entry = this.cache.get(cacheKey);
    if (entry?.image) {
      return entry.image;
    } else if (entry != null && affectedNode) {
      entry.nodes.add(affectedNode);
      return;
    }
    if (!affectedNode) {
      return;
    }
    const nextEntry = { image: void 0, nodes: /* @__PURE__ */ new Set([affectedNode]), blobUrl: void 0 };
    this.cache.set(cacheKey, nextEntry);
    this.imageLoadingCount++;
    const revokeBlob = () => {
      if (nextEntry.blobUrl != null) {
        URL.revokeObjectURL(nextEntry.blobUrl);
        nextEntry.blobUrl = void 0;
      }
    };
    const onSuccess = (image) => {
      if (this.destroyed) {
        revokeBlob();
        return;
      }
      nextEntry.image = image;
      for (const node of nextEntry.nodes) {
        node.markDirty();
      }
      nextEntry.nodes.clear();
      this.imageLoadingCount--;
      revokeBlob();
      this.emit("image-loaded", { uri });
    };
    const onFail = () => {
      if (this.destroyed) {
        revokeBlob();
        return;
      }
      this.imageLoadingCount--;
      nextEntry.nodes.clear();
      revokeBlob();
      this.cache.delete(cacheKey);
      this.emit("image-error", { uri });
    };
    this.resolveSource(uri, sizeHint).then((resolved) => {
      if (this.destroyed) {
        if (resolved.blobUrl != null)
          URL.revokeObjectURL(resolved.blobUrl);
        return;
      }
      if (resolved.blobUrl != null) {
        nextEntry.blobUrl = resolved.blobUrl;
      }
      const ImageCtor = getImage();
      const image = new ImageCtor();
      image.onload = () => onSuccess(image);
      image.onerror = onFail;
      image.src = resolved.src;
    }).catch(onFail);
    return void 0;
  }
  unregisterNode(node) {
    for (const entry of this.cache.values()) {
      entry.nodes.delete(node);
    }
  }
  async resolveSource(uri, sizeHint) {
    if (!sizeHint || typeof fetch !== "function" || typeof Blob === "undefined")
      return { src: uri };
    const pathSaysSvg = uriPathnameEndsWith(uri, ".svg");
    const dataUriSaysSvg = uri.startsWith("data:image/svg");
    if (!pathSaysSvg && !dataUriSaysSvg)
      return { src: uri };
    try {
      const res = await fetch(uri, { mode: "cors" });
      const contentType = res.headers.get("content-type") ?? "";
      const contentTypeKnown = contentType.startsWith("image/") || contentType.startsWith("application/");
      const contentTypeSaysSvg = contentType.includes("svg");
      if (contentTypeKnown && !contentTypeSaysSvg)
        return { src: uri };
      const text = await res.text();
      if (!contentTypeSaysSvg && !looksLikeSvgMarkup(text))
        return { src: uri };
      const sized = injectSvgSize(text, sizeHint.width, sizeHint.height);
      if (sized == null || sized === "")
        return { src: uri };
      const blob = new Blob([sized], { type: "image/svg+xml" });
      const blobUrl = URL.createObjectURL(blob);
      return { src: blobUrl, blobUrl };
    } catch {
      return { src: uri };
    }
  }
  waitingToLoad() {
    return this.imageLoadingCount > 0;
  }
  destroy() {
    this.destroyed = true;
    for (const entry of this.cache.values()) {
      entry.nodes.clear();
      if (entry.blobUrl != null) {
        URL.revokeObjectURL(entry.blobUrl);
        entry.blobUrl = void 0;
      }
    }
    this.cache.clear();
  }
};
function computeCacheKey(uri, sizeHint) {
  return sizeHint ? `${uri}@${sizeHint.width}x${sizeHint.height}` : uri;
}
function uriPathnameEndsWith(uri, suffix) {
  const queryStart = uri.search(/[?#]/);
  const path = queryStart >= 0 ? uri.slice(0, queryStart) : uri;
  return path.toLowerCase().endsWith(suffix);
}
var SVG_MARKUP_PREFIX = /^\uFEFF?\s{0,32}(?:<\?xml[^>]{0,256}\?>\s{0,32})?(?:<!DOCTYPE[^>]{0,256}>\s{0,32})?<svg[\s>]/i;
function looksLikeSvgMarkup(text) {
  return SVG_MARKUP_PREFIX.test(text);
}
var ABSOLUTE_SIZE = /^\s{0,8}\+?(\d{1,6}(?:\.\d{1,6})?(?:e[+-]?\d{1,3})?)\s{0,8}(?:px|pt|cm|mm|in|pc|q)?\s{0,8}$/i;
function hasAbsoluteSize(root, attr) {
  const raw = root.getAttribute(attr);
  if (raw == null)
    return false;
  const match = ABSOLUTE_SIZE.exec(raw);
  if (!match)
    return false;
  return Number.parseFloat(match[1]) > 0;
}
function injectSvgSize(svgText, width2, height2) {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined")
    return void 0;
  try {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const root = doc.documentElement;
    if (root?.tagName.toLowerCase() !== "svg")
      return void 0;
    const hasWidth = hasAbsoluteSize(root, "width");
    const hasHeight = hasAbsoluteSize(root, "height");
    if (hasWidth && hasHeight)
      return void 0;
    if (!hasWidth)
      root.setAttribute("width", String(width2));
    if (!hasHeight)
      root.setAttribute("height", String(height2));
    return new XMLSerializer().serializeToString(root);
  } catch {
    return void 0;
  }
}

// packages/ag-charts-core/src/scene/intersection.ts
function segmentIntersection(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  const d = (ax2 - ax1) * (by2 - by1) - (ay2 - ay1) * (bx2 - bx1);
  if (d === 0) {
    return 0;
  }
  const ua = ((bx2 - bx1) * (ay1 - by1) - (ax1 - bx1) * (by2 - by1)) / d;
  const ub = ((ax2 - ax1) * (ay1 - by1) - (ay2 - ay1) * (ax1 - bx1)) / d;
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return 1;
  }
  return 0;
}
function boxCrossesSegment(box, x1, y1, x2, y2) {
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  return segmentIntersection(x1, y1, x2, y2, box.x, box.y, right, box.y) === 1 || segmentIntersection(x1, y1, x2, y2, right, box.y, right, bottom) === 1 || segmentIntersection(x1, y1, x2, y2, right, bottom, box.x, bottom) === 1 || segmentIntersection(x1, y1, x2, y2, box.x, bottom, box.x, box.y) === 1;
}

// packages/ag-charts-core/src/scene/layersManager.ts
var LayersManager = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.debug = create(true, "scene");
    this.layersMap = /* @__PURE__ */ new Map();
    this.nextLayerId = 0;
  }
  get size() {
    return this.layersMap.size;
  }
  resize(width2, height2, pixelRatio) {
    this.canvas.resize(width2, height2, pixelRatio);
    for (const { canvas } of this.layersMap.values()) {
      canvas.resize(width2, height2, pixelRatio);
    }
  }
  addLayer(opts) {
    const { width: width2, height: height2, pixelRatio } = this.canvas;
    const { name } = opts;
    const canvas = new HdpiOffscreenCanvas({ width: width2, height: height2, pixelRatio });
    this.layersMap.set(canvas, {
      id: this.nextLayerId++,
      name,
      canvas
    });
    this.debug("Scene.addLayer() - layers", this.layersMap);
    return canvas;
  }
  removeLayer(canvas) {
    if (this.layersMap.has(canvas)) {
      this.layersMap.delete(canvas);
      canvas.destroy();
      this.debug("Scene.removeLayer() -  layers", this.layersMap);
    }
  }
  clear() {
    for (const layer of this.layersMap.values()) {
      layer.canvas.destroy();
    }
    this.layersMap.clear();
  }
};

// packages/ag-charts-core/src/scene/sceneDebug.ts
var DebugSelectors = /* @__PURE__ */ /*#__PURE__*/ ((DebugSelectors2) => {
  DebugSelectors2["SCENE"] = "scene";
  DebugSelectors2["SCENE_STATS"] = "scene:stats";
  DebugSelectors2["SCENE_STATS_VERBOSE"] = "scene:stats:verbose";
  DebugSelectors2["SCENE_DIRTY_TREE"] = "scene:dirtyTree";
  DebugSelectors2["SCENE_TEXT"] = "scene:text";
  return DebugSelectors2;
})(DebugSelectors || {});
var StatsAccumulator = class {
  // Log every 10 seconds
  constructor() {
    this.stats = /* @__PURE__ */ new Map();
    this.lastLogTime = Date.now();
    this.LOG_INTERVAL_MS = 1e4;
    this.startPeriodicLogging();
  }
  startPeriodicLogging() {
    if (!check("scene:stats" /* SCENE_STATS */, "scene:stats:verbose" /* SCENE_STATS_VERBOSE */)) {
      return;
    }
    this.stopPeriodicLogging();
    this.intervalId = setInterval(() => {
      this.logAccumulatedStats();
    }, this.LOG_INTERVAL_MS);
  }
  stopPeriodicLogging() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = void 0;
    }
  }
  recordTiming(category, duration) {
    const existing = this.stats.get(category);
    if (existing) {
      existing.min = Math.min(existing.min, duration);
      existing.max = Math.max(existing.max, duration);
      existing.sum += duration;
      existing.count += 1;
    } else {
      this.stats.set(category, {
        min: duration,
        max: duration,
        sum: duration,
        count: 1
      });
    }
  }
  recordTimings(durations) {
    for (const [category, duration] of Object.entries(durations)) {
      if (category !== "start" && typeof duration === "number") {
        this.recordTiming(category, duration);
      }
    }
  }
  logAccumulatedStats() {
    if (this.stats.size === 0)
      return;
    const timeSinceLastLog = (Date.now() - this.lastLogTime) / 1e3;
    const categories = Array.from(this.stats.keys()).sort((a, b) => {
      if (a === "\u23F1\uFE0F")
        return -1;
      if (b === "\u23F1\uFE0F")
        return 1;
      return a.localeCompare(b);
    });
    const parts = [];
    for (const category of categories) {
      const stats = this.stats.get(category);
      const avg = stats.sum / stats.count;
      parts.push(`${category}[${stats.min.toFixed(1)}/${avg.toFixed(1)}/${stats.max.toFixed(1)}]ms`);
    }
    const totalStats = this.stats.get("\u23F1\uFE0F");
    const count = totalStats?.count ?? 0;
    log(`\u{1F4CA} Stats (${timeSinceLastLog.toFixed(0)}s, ${count} renders): ${parts.join(" ")}`);
    this.stats.clear();
    this.lastLogTime = Date.now();
  }
  destroy() {
    this.stopPeriodicLogging();
    this.stats.clear();
  }
};
var globalStatsAccumulator;
var statsAccumulatorConsumers = 0;
function getStatsAccumulator() {
  globalStatsAccumulator ?? (globalStatsAccumulator = new StatsAccumulator());
  return globalStatsAccumulator;
}
function registerDebugStatsConsumer() {
  statsAccumulatorConsumers++;
  let released = false;
  return () => {
    if (released || statsAccumulatorConsumers === 0)
      return;
    released = true;
    statsAccumulatorConsumers--;
    if (statsAccumulatorConsumers === 0) {
      cleanupDebugStats();
    }
  };
}
function formatBytes(value) {
  for (const unit of ["B", "KB", "MB", "GB"]) {
    if (value < 1536) {
      return `${value.toFixed(1)}${unit}`;
    }
    value /= 1024;
  }
  return `${value.toFixed(1)}TB}`;
}
function memoryUsage() {
  if (!("memory" in performance))
    return;
  const { totalJSHeapSize, usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
  const result = [];
  for (const amount of [usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit]) {
    if (typeof amount !== "number")
      continue;
    result.push(formatBytes(amount));
  }
  return `Heap ${result.join(" / ")}`;
}
function debugStats(layersManager, debugSplitTimes, ctx, renderCtxStats, extraDebugStats = {}, seriesRect = BBox.zero, colors) {
  if (!check("scene:stats" /* SCENE_STATS */, "scene:stats:verbose" /* SCENE_STATS_VERBOSE */))
    return;
  const {
    layersRendered = 0,
    layersSkipped = 0,
    nodesRendered = 0,
    nodesSkipped = 0,
    opsPerformed = 0,
    opsSkipped = 0
  } = renderCtxStats ?? {};
  const end3 = performance.now();
  const { start: start2, ...durations } = debugSplitTimes;
  const totalTime = end3 - start2;
  const statsAccumulator = getStatsAccumulator();
  statsAccumulator.recordTimings(durations);
  statsAccumulator.recordTiming("\u23F1\uFE0F", totalTime);
  const splits = Object.entries(durations).map(([n, t]) => time2(n, t)).filter((v) => v != null).join(" + ");
  const extras = Object.entries(extraDebugStats).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" ; ");
  const detailedStats = check("scene:stats:verbose" /* SCENE_STATS_VERBOSE */);
  const memUsage = detailedStats ? memoryUsage() : null;
  const metrics2 = detailedStats ? flush() : {};
  const metricsEntries = Object.entries(metrics2);
  const aggregationMetrics = [];
  const nodeDataMetrics = [];
  for (const [k, v] of metricsEntries) {
    if (k.endsWith(":aggregation") && Array.isArray(v)) {
      aggregationMetrics.push(`${k.replace(":aggregation", "")}(${v.join(",")})`);
    } else if (k.endsWith(":nodeData") && typeof v === "number") {
      nodeDataMetrics.push(`${k.replace(":nodeData", "")}(${v})`);
    }
  }
  const aggregationText = aggregationMetrics.length > 0 ? `Aggregation: ${aggregationMetrics.join(", ")}` : null;
  const nodeDataText = nodeDataMetrics.length > 0 ? `NodeData: ${nodeDataMetrics.join(", ")}` : null;
  const stats = [
    `${time2("\u23F1\uFE0F", start2, end3)} (${splits})`,
    `${extras}`,
    aggregationText,
    nodeDataText,
    `Layers: ${detailedStats ? pct(layersRendered, layersSkipped) : layersManager.size}`,
    detailedStats ? `Nodes: ${pct(nodesRendered, nodesSkipped)}` : null,
    detailedStats ? `Ops: ${pct(opsPerformed, opsSkipped)}` : null,
    memUsage
  ].filter(isString);
  const measurer = new TextMeasurer(ctx);
  const statsSize = new Map(stats.map((t) => [t, measurer.measureText(t)]));
  const width2 = Math.max(...Array.from(statsSize.values(), (s) => s.width));
  const height2 = accumulate(statsSize.values(), (s) => s.height);
  const x = 2 + seriesRect.x;
  ctx.save();
  try {
    ctx.fillStyle = colors?.background ?? "white";
    ctx.fillRect(x, 0, width2, height2);
    ctx.fillStyle = colors?.foreground ?? "black";
    let y = 0;
    for (const [stat, size] of statsSize.entries()) {
      y += size.height;
      ctx.fillText(stat, x, y);
    }
  } catch (e) {
    warnOnce("Error during debug stats rendering", e);
  } finally {
    ctx.restore();
  }
}
function prepareSceneNodeHighlight(ctx) {
  const config = toArray(getWindow("agChartsSceneDebug"));
  const result = [];
  for (const name of config) {
    if (name === "layout") {
      result.push("seriesRoot", "legend", "root", /Axis-\d+-axis/);
    } else {
      result.push(name);
    }
  }
  ctx.debugNodeSearch = result;
}
function debugSceneNodeHighlight(ctx, debugNodes) {
  ctx.save();
  try {
    for (const [name, node] of Object.entries(debugNodes)) {
      const bbox = Transformable.toCanvas(node);
      if (bbox == null) {
        log(`Scene.render() - no bbox for debugged node [${name}].`);
        continue;
      }
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
      ctx.fillStyle = "red";
      ctx.strokeStyle = "white";
      ctx.font = "16px sans-serif";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.lineWidth = 2;
      ctx.strokeText(name, bbox.x, bbox.y, bbox.width);
      ctx.fillText(name, bbox.x, bbox.y, bbox.width);
    }
  } catch (e) {
    warnOnce("Error during debug rendering", e);
  } finally {
    ctx.restore();
  }
}
function buildTree(node, mode) {
  if (!check(true, "scene" /* SCENE */)) {
    return {};
  }
  let order = 0;
  return {
    node: mode === "json" ? node.serialize() : node,
    name: node.name ?? node.id,
    dirty: node instanceof Group ? node.dirty : void 0,
    ...Array.from(node instanceof Group ? node.children() : [], (child) => ({
      child,
      tree: buildTree(child, mode)
    })).reduce((result, { child, tree }) => {
      let { name: treeNodeName } = tree;
      const { props } = child.serialize();
      const { visible, translationX, translationY, rotation, scalingX, scalingY } = props;
      const opacity = "opacity" in props ? props.opacity : 1;
      if (!visible || opacity <= 0) {
        treeNodeName = `(${treeNodeName})`;
      }
      if (Group.is(child) && child.renderToOffscreenCanvas) {
        treeNodeName = `*${treeNodeName}*`;
      }
      const { zIndex } = child;
      const zIndexString = Array.isArray(zIndex) ? `(${zIndex.join(", ")})` : zIndex;
      const key = [
        `${(order++).toString().padStart(3, "0")}|`,
        `${treeNodeName ?? "<unknown>"}`,
        `z: ${zIndexString}`,
        translationX != null && translationX !== 0 && `x: ${translationX}`,
        translationY != null && translationY !== 0 && `y: ${translationY}`,
        rotation != null && rotation !== 0 && `r: ${rotation}`,
        scalingX != null && scalingX !== 1 && `sx: ${scalingX}`,
        scalingY != null && scalingY !== 1 && `sy: ${scalingY}`
      ].filter((v) => v !== false).join(" ");
      let selectedKey = key;
      let index = 1;
      while (result[selectedKey] != null && index < 100) {
        selectedKey = `${key} (${index++})`;
      }
      result[selectedKey] = tree;
      return result;
    }, {})
  };
}
function buildDirtyTree(node) {
  const nodeDirty = node instanceof Group ? node.dirty : void 0;
  if (!nodeDirty) {
    return { dirtyTree: {}, paths: [] };
  }
  const childrenDirtyTree = Array.from(node instanceof Group ? node.children() : [], (c) => buildDirtyTree(c)).filter(
    (c) => c.paths.length > 0
  );
  const name = Group.is(node) ? node.name ?? node.id : node.id;
  const paths = childrenDirtyTree.length > 0 ? childrenDirtyTree.flatMap((c) => c.paths).map((p) => `${name}.${p}`) : [name];
  return {
    dirtyTree: {
      name,
      node,
      dirty: nodeDirty,
      ...childrenDirtyTree.map((c) => c.dirtyTree).filter((t) => t.dirty != null).reduce((result, childTree) => {
        result[childTree.name ?? "<unknown>"] = childTree;
        return result;
      }, {})
    },
    paths
  };
}
function pct(rendered, skipped) {
  const total = rendered + skipped;
  return `${rendered} / ${total} (${Math.round(100 * rendered / total)}%)`;
}
function time2(name, start2, end3) {
  const duration = end3 == null ? start2 : end3 - start2;
  return `${name}: ${Math.round(duration * 100) / 100}ms`;
}
function accumulate(iterator, mapper) {
  let sum = 0;
  for (const item of iterator) {
    sum += mapper(item);
  }
  return sum;
}
function cleanupDebugStats(force = false) {
  if (!globalStatsAccumulator) {
    if (force) {
      statsAccumulatorConsumers = 0;
    }
    return;
  }
  if (!force && statsAccumulatorConsumers > 0) {
    return;
  }
  globalStatsAccumulator.destroy();
  globalStatsAccumulator = void 0;
  if (force) {
    statsAccumulatorConsumers = 0;
  }
}
function getDebugStatsStateForTesting() {
  return {
    active: globalStatsAccumulator != null,
    consumers: statsAccumulatorConsumers
  };
}

// packages/ag-charts-core/src/scene/scene.ts
var Scene = /*#__PURE__*/ (() => { var _c$10 = class extends EventEmitter {
  constructor(canvasOptions, logger = ambientLogger) {
    super();
    this.logger = logger;
    this.debug = create(true, "scene" /* SCENE */);
    this.id = createId(this);
    this.imageLoader = new ImageLoader();
    this.root = null;
    this.pendingSize = null;
    this.isDirty = false;
    this.direction = "ltr";
    this.cleanup = new CleanupRegistry();
    this.updateDebugFlags();
    this.canvas = new HdpiCanvas(canvasOptions);
    this.layersManager = new LayersManager(this.canvas);
    this.cleanup.register(
      this.imageLoader.on("image-loaded", () => {
        this.emit("scene-changed", {});
      }),
      this.imageLoader.on("image-error", ({ uri }) => {
        this.logger.warnOnce(`Unable to load image ${uri}`);
      })
    );
  }
  setLogger(logger) {
    this.logger = logger;
  }
  waitingForUpdate() {
    return this.imageLoader?.waitingToLoad() ?? false;
  }
  get width() {
    return this.pendingSize?.[0] ?? this.canvas.width;
  }
  get height() {
    return this.pendingSize?.[1] ?? this.canvas.height;
  }
  get pixelRatio() {
    return this.pendingSize?.[2] ?? this.canvas.pixelRatio;
  }
  get isRtl() {
    return this.direction === "rtl";
  }
  /**
   * @deprecated v10.2.0 Only used by AG Grid Sparklines + Mini Charts
   *
   * DO NOT REMOVE WITHOUT FIXING THE GRID DEPENDENCIES.
   */
  setContainer(value) {
    const { element: element2 } = this.canvas;
    element2.remove();
    value.appendChild(element2);
    return this;
  }
  setRoot(node) {
    if (this.root === node) {
      return this;
    }
    this.isDirty = true;
    this.root?.setScene();
    this.root = node;
    if (node) {
      node.visible = true;
      node.setScene(this);
    }
    return this;
  }
  updateDebugFlags() {
    inDevelopmentMode(() => Node._debugEnabled = true);
  }
  clearCanvas() {
    this.canvas.clear();
  }
  attachNode(node) {
    this.appendChild(node);
    return () => node.remove();
  }
  appendChild(node) {
    this.root?.appendChild(node);
    return this;
  }
  removeChild(node) {
    node.remove();
    return this;
  }
  download(fileName, fileFormat) {
    downloadUrl(this.canvas.toDataURL(fileFormat), fileName?.trim() ?? "image");
  }
  /** NOTE: Integrated Charts undocumented image download method. */
  getDataURL(fileFormat) {
    return this.canvas.toDataURL(fileFormat);
  }
  resize(width2, height2, pixelRatio) {
    width2 = Math.round(width2);
    height2 = Math.round(height2);
    pixelRatio ?? (pixelRatio = this.pixelRatio);
    if (width2 > 0 && height2 > 0 && (width2 !== this.width || height2 !== this.height || pixelRatio !== this.pixelRatio)) {
      this.pendingSize = [width2, height2, pixelRatio];
      this.isDirty = true;
      return true;
    }
    return false;
  }
  setDirection(isRtl) {
    this.direction = isRtl ? "rtl" : "ltr";
    this.canvas.setDirection(isRtl);
  }
  updateBaseFont() {
    const baseFont = this.root?.resolveFont();
    if (baseFont == null || baseFont === this._contextFont)
      return;
    this._baseFont = baseFont;
    if (this.pendingSize)
      return;
    this.canvas.context.font = baseFont;
    this._contextFont = baseFont;
  }
  applyPendingResize() {
    if (this.pendingSize) {
      this.layersManager.resize(...this.pendingSize);
      this.pendingSize = null;
      this._contextFont = void 0;
      if (this._baseFont != null) {
        this.canvas.context.font = this._baseFont;
        this._contextFont = this._baseFont;
      }
      return true;
    }
    return false;
  }
  render(opts) {
    const { debugSplitTimes = { start: performance.now() }, extraDebugStats, seriesRect, debugColors } = opts ?? {};
    const { canvas, canvas: { context: ctx } = {}, root, width: width2, height: height2, pixelRatio: devicePixelRatio } = this;
    if (!ctx) {
      return;
    }
    const statsEnabled = check("scene:stats" /* SCENE_STATS */, "scene:stats:verbose" /* SCENE_STATS_VERBOSE */);
    if (statsEnabled) {
      this.ensureDebugStatsRegistration();
    }
    const renderStartTime = performance.now();
    const resized = this.applyPendingResize();
    if (root && !root.visible) {
      this.isDirty = false;
      return;
    }
    let rootDirty;
    if (root instanceof Group) {
      rootDirty = root.dirty;
    }
    if (root != null && rootDirty === false && !this.isDirty) {
      if (this.debug.check()) {
        this.debug("Scene.render() - no-op", {
          tree: buildTree(root, "console")
        });
      }
      if (statsEnabled) {
        debugStats(
          this.layersManager,
          debugSplitTimes,
          ctx,
          void 0,
          extraDebugStats,
          seriesRect,
          debugColors
        );
      }
      return;
    }
    const renderCtx = {
      ctx,
      direction: this.direction,
      width: width2,
      height: height2,
      devicePixelRatio,
      logger: this.logger,
      debugNodes: {},
      currentFont: this._contextFont
    };
    if (check("scene:stats:verbose" /* SCENE_STATS_VERBOSE */)) {
      renderCtx.stats = {
        layersRendered: 0,
        layersSkipped: 0,
        nodesRendered: 0,
        nodesSkipped: 0,
        opsPerformed: 0,
        opsSkipped: 0
      };
    }
    prepareSceneNodeHighlight(renderCtx);
    let canvasCleared = false;
    if (rootDirty !== false || resized) {
      canvasCleared = true;
      canvas.clear();
    }
    if (root && check("scene:dirtyTree" /* SCENE_DIRTY_TREE */)) {
      const { dirtyTree, paths } = buildDirtyTree(root);
      create("scene:dirtyTree" /* SCENE_DIRTY_TREE */)("Scene.render() - dirtyTree", { dirtyTree, paths });
    }
    if (root && canvasCleared) {
      if (root.visible) {
        root.preRender(renderCtx);
      }
      if (this.debug.check()) {
        const tree = buildTree(root, "console");
        this.debug("Scene.render() - before", {
          canvasCleared,
          tree
        });
      }
      if (root.visible) {
        try {
          ctx.save();
          root.render(renderCtx);
          ctx.restore();
        } catch (e) {
          this.canvas.reset();
          throw e;
        }
      }
    }
    debugSplitTimes["\u270D\uFE0F"] = performance.now() - renderStartTime;
    ctx.verifyDepthZero?.();
    this.isDirty = false;
    if (statsEnabled) {
      debugStats(
        this.layersManager,
        debugSplitTimes,
        ctx,
        renderCtx.stats,
        extraDebugStats,
        seriesRect,
        debugColors
      );
    }
    debugSceneNodeHighlight(ctx, renderCtx.debugNodes);
    if (root && this.debug.check()) {
      this.debug("Scene.render() - after", {
        tree: buildTree(root, "console"),
        canvasCleared
      });
    }
  }
  ensureDebugStatsRegistration() {
    if (this.releaseDebugStats)
      return;
    const release = registerDebugStatsConsumer();
    const cleanup = () => {
      release();
      this.releaseDebugStats = void 0;
    };
    this.releaseDebugStats = cleanup;
    this.cleanup.register(cleanup);
  }
  toSVG() {
    const { root, width: width2, height: height2 } = this;
    if (root == null)
      return;
    return Node.toSVG(root, width2, height2);
  }
  /** Alternative to destroy() that preserves re-usable resources. */
  strip() {
    const { context, pixelRatio } = this.canvas;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.layersManager.clear();
    destroyShadowScratch(this);
    this.setRoot(null);
    this.isDirty = false;
    this.clear();
  }
  destroy() {
    if (this.canvas == null)
      return;
    this.strip();
    this.canvas.destroy();
    this.imageLoader.destroy();
    this.cleanup.flush();
    cleanupDebugStats();
    Object.assign(this, { canvas: void 0 });
  }
}; _c$10.className = "Scene"; return _c$10; })()

// packages/ag-charts-core/src/scene/sectorBox.ts
var SectorBox = class _SectorBox {
  constructor(startAngle, endAngle, innerRadius, outerRadius) {
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
  }
  clone() {
    const { startAngle, endAngle, innerRadius, outerRadius } = this;
    return new _SectorBox(startAngle, endAngle, innerRadius, outerRadius);
  }
  equals(other) {
    return this.startAngle === other.startAngle && this.endAngle === other.endAngle && this.innerRadius === other.innerRadius && this.outerRadius === other.outerRadius;
  }
  [interpolate](other, d) {
    return new _SectorBox(
      this.startAngle * (1 - d) + other.startAngle * d,
      this.endAngle * (1 - d) + other.endAngle * d,
      this.innerRadius * (1 - d) + other.innerRadius * d,
      this.outerRadius * (1 - d) + other.outerRadius * d
    );
  }
};

// packages/ag-charts-core/src/scene/shape/segmentedPath.ts
var SegmentedPath = /*#__PURE__*/ (() => { var _c$11 = class extends Path {
  constructor() {
    super(...arguments);
    this.segmentPath = new Path();
  }
  drawPath(ctx, logger) {
    if (!this.segments || this.segments.length === 0) {
      super.drawPath(ctx, logger);
      return;
    }
    ctx.save();
    const Path2DCtor = getPath2D();
    const inverse = new Path2DCtor();
    const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
    const canvasWidth = ctx.canvas.width / pixelRatio;
    const canvasHeight = ctx.canvas.height / pixelRatio;
    rect(inverse, { x0: 0, y0: 0, x1: canvasWidth, y1: canvasHeight }, false);
    for (const s of this.segments) {
      rect(inverse, s.clipRect);
    }
    ctx.clip(inverse);
    super.drawPath(ctx, logger);
    ctx.restore();
    const { segmentPath } = this;
    segmentPath.setProperties({
      opacity: this.opacity,
      visible: this.visible,
      lineCap: this.lineCap,
      lineJoin: this.lineJoin,
      pointerEvents: this.pointerEvents
    });
    for (const { clipRect, fill, stroke, ...styles } of this.segments) {
      ctx.save();
      segmentPath.path = this.path;
      segmentPath.setProperties(styles);
      segmentPath.fill = this.fill == null ? "none" : fill;
      segmentPath.stroke = this.stroke == null ? "none" : stroke;
      const clipPath = new Path2DCtor();
      rect(clipPath, clipRect);
      ctx.clip(clipPath);
      segmentPath.drawPath(ctx, logger);
      ctx.restore();
    }
  }
}; __decorateClass([
  SceneRefChangeDetection()
], _c$11.prototype, "segments", 2); return _c$11; })()
function rect(path, { x0, y0, x1, y1 }, clockwise = true) {
  const minX = Math.min(x0, x1);
  const minY = Math.min(y0, y1);
  const maxX = Math.max(x0, x1);
  const maxY = Math.max(y0, y1);
  path.moveTo(minX, minY);
  if (clockwise) {
    path.lineTo(maxX, minY);
    path.lineTo(maxX, maxY);
    path.lineTo(minX, maxY);
  } else {
    path.lineTo(minX, maxY);
    path.lineTo(maxX, maxY);
    path.lineTo(maxX, minY);
  }
  path.closePath();
}

// packages/ag-charts-core/src/scene/segmentedGroup.ts
var SegmentedGroup = /*#__PURE__*/ (() => { var _c$12 = class extends TranslatableGroup {
  constructor() {
    super(...arguments);
    this.segments = [];
    this.scalablePath = new (Scalable(Path))();
  }
  renderInContext(childRenderCtx) {
    if (!this.visible)
      return;
    const { ctx } = childRenderCtx;
    if (!this.segments || this.segments?.length === 0) {
      return super.renderInContext(childRenderCtx);
    }
    ctx.save();
    const Path2DCtor = getPath2D();
    const inverse = new Path2DCtor();
    rect(inverse, { x0: 0, y0: 0, x1: ctx.canvas.width, y1: ctx.canvas.height }, false);
    for (const s of this.segments) {
      rect(inverse, s.clipRect);
    }
    ctx.clip(inverse);
    for (const child of this.children()) {
      if (!child.visible)
        continue;
      child.render(childRenderCtx);
    }
    ctx.restore();
    const { scalablePath } = this;
    for (const { clipRect, ...styles } of this.segments) {
      ctx.save();
      const clipPath = new Path2DCtor();
      rect(clipPath, clipRect);
      ctx.clip(clipPath);
      scalablePath.setProperties(styles);
      for (const child of this.children()) {
        if (!child.visible || !(child instanceof Path))
          continue;
        scalablePath.path = child.path;
        scalablePath.setProperties({
          opacity: child.opacity,
          lineCap: child.lineCap,
          lineJoin: child.lineJoin,
          ...isScalable(child) && {
            scalingX: child.scalingX,
            scalingY: child.scalingY,
            scalingCenterX: child.scalingCenterX,
            scalingCenterY: child.scalingCenterY
          }
        });
        scalablePath.render(childRenderCtx);
      }
      ctx.restore();
    }
  }
}; __decorateClass([
  SceneRefChangeDetection()
], _c$12.prototype, "segments", 2); return _c$12; })()

// packages/ag-charts-core/src/scene/selection.ts
var Selection = class _Selection {
  constructor(parentNode, classOrFactory, autoCleanup = true) {
    this.parentNode = parentNode;
    this.autoCleanup = autoCleanup;
    this.garbageBin = /* @__PURE__ */ new Set();
    this._nodesMap = /* @__PURE__ */ new Map();
    this._nodes = [];
    this.data = [];
    this.debug = create(true, "scene", "scene:selections");
    this.nodeFactory = Object.prototype.isPrototypeOf.call(Node, classOrFactory) ? () => new classOrFactory() : classOrFactory;
  }
  static select(parent, classOrFactory, garbageCollection = true) {
    return new _Selection(parent, classOrFactory, garbageCollection);
  }
  static selectNoInference(parent, classOrFactory, garbageCollection = true) {
    return new _Selection(parent, classOrFactory, garbageCollection);
  }
  static selectAll(parent, predicate) {
    const results = [];
    const traverse = (node) => {
      if (predicate(node)) {
        results.push(node);
      }
      if (node instanceof Group) {
        for (const child of node.children()) {
          traverse(child);
        }
      }
    };
    traverse(parent);
    return results;
  }
  static selectByClass(node, ...Classes) {
    return _Selection.selectAll(node, (n) => Classes.some((C) => n instanceof C));
  }
  static selectByTag(node, tag) {
    return _Selection.selectAll(node, (n) => n.tag === tag);
  }
  createNode(datum, initializer, idx) {
    const node = this.nodeFactory(datum);
    node.datum = datum;
    initializer?.(node);
    if (idx == null) {
      this._nodes.push(node);
    } else {
      this._nodes.splice(idx, 0, node);
    }
    this.parentNode.appendChild(node);
    return node;
  }
  /**
   * Update the data in a selection. If an `getDatumId()` function is provided, maintain a list of ids related to
   * the nodes. Otherwise, take the more efficient route of simply creating and destroying nodes at the end
   * of the array.
   */
  update(data, initializer, getDatumId) {
    if (this.garbageBin.size > 0) {
      this.debug(`Selection - update() called with pending garbage`, data);
    }
    if (getDatumId && this._nodesMap.size === 0 && this._nodes.length > 0) {
      for (const node of this._nodes) {
        this.garbageBin.add(node);
      }
    }
    if (!getDatumId && this._nodesMap.size > 0) {
      this._nodesMap.clear();
    }
    if (getDatumId) {
      const dataMap = /* @__PURE__ */ new Map();
      const duplicateMap = /* @__PURE__ */ new Map();
      for (let idx = 0; idx < data.length; idx++) {
        const datum = data[idx];
        let id = getDatumId(datum);
        if (dataMap.has(id)) {
          const index = (duplicateMap.get(id) ?? 0) + 1;
          duplicateMap.set(id, index);
          id = `${id}:${index}`;
        }
        dataMap.set(id, idx);
      }
      for (const [node, datumId] of this._nodesMap.entries()) {
        const idx = dataMap.get(datumId);
        if (idx == null) {
          this.garbageBin.add(node);
        } else {
          node.datum = data[idx];
          this.garbageBin.delete(node);
          dataMap.delete(datumId);
        }
      }
      for (const [datumId, idx] of dataMap.entries()) {
        const datum = data[idx];
        this._nodesMap.set(this.createNode(datum, initializer, idx), datumId);
      }
    } else {
      const maxLength = Math.max(data.length, this.data.length);
      for (let i = 0; i < maxLength; i++) {
        if (i >= data.length) {
          this.garbageBin.add(this._nodes[i]);
        } else if (i >= this._nodes.length) {
          this.createNode(data[i], initializer);
        } else {
          this._nodes[i].datum = data[i];
          this.garbageBin.delete(this._nodes[i]);
        }
      }
    }
    this.data = data.slice();
    if (this.autoCleanup) {
      this.cleanup();
    }
    return this;
  }
  cleanup() {
    if (this.garbageBin.size === 0) {
      return this;
    }
    const selection = this;
    function removeGarbage(node) {
      if (selection.garbageBin.has(node)) {
        selection._nodesMap.delete(node);
        selection.garbageBin.delete(node);
        node.destroy();
        return false;
      }
      return true;
    }
    this._nodes = this._nodes.filter(removeGarbage);
    return this;
  }
  clear() {
    this.update([]);
    for (const node of this._nodesMap.keys()) {
      this.garbageBin.add(node);
    }
    this._nodesMap.clear();
    return this;
  }
  isGarbage(node) {
    return this.garbageBin.has(node);
  }
  each(iterate2) {
    const nodes = this._nodes;
    this.parentNode.batchedUpdate(function selectionEach() {
      for (const entry of nodes.entries()) {
        iterate2(entry[1], entry[1].unsafeNonNullDatum, entry[0]);
      }
    });
    return this;
  }
  *[Symbol.iterator]() {
    for (let index = 0; index < this._nodes.length; index++) {
      const node = this._nodes[index];
      yield { node, datum: node.unsafeNonNullDatum, index };
    }
  }
  select(predicate) {
    return _Selection.selectAll(this.parentNode, predicate);
  }
  selectByClass(Class) {
    return _Selection.selectByClass(this.parentNode, Class);
  }
  selectByTag(tag) {
    return _Selection.selectByTag(this.parentNode, tag);
  }
  nodes() {
    return this._nodes;
  }
  at(index) {
    return this._nodes.at(index);
  }
  get length() {
    return this._nodes.length;
  }
  batchedUpdate(fn) {
    this.parentNode.batchedUpdate(fn);
  }
};

// packages/ag-charts-core/src/scene/shape/arc.ts
var Arc = /*#__PURE__*/ (() => { var _c$13 = class extends Path {
  constructor() {
    super(...arguments);
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 10;
    this.startAngle = 0;
    this.endAngle = Math.PI * 2;
    this.counterClockwise = false;
    this.type = 0 /* Open */;
  }
  get fullPie() {
    return isNumberEqual(normalizeAngle360(this.startAngle), normalizeAngle360(this.endAngle));
  }
  updatePath() {
    const path = this.path;
    path.clear();
    path.arc(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle, this.counterClockwise);
    if (this.type === 1 /* Chord */) {
      path.closePath();
    } else if (this.type === 2 /* Round */ && !this.fullPie) {
      path.lineTo(this.centerX, this.centerY);
      path.closePath();
    }
  }
  computeBBox() {
    return new BBox(this.centerX - this.radius, this.centerY - this.radius, this.radius * 2, this.radius * 2);
  }
  isPointInPath(x, y) {
    const bbox = this.getBBox();
    return this.type !== 0 /* Open */ && bbox.containsPoint(x, y) && this.path.isPointInPath(x, y);
  }
}; _c$13.className = "Arc"; __decorateClass([
  SceneChangeDetection()
], _c$13.prototype, "centerX", 2); __decorateClass([
  SceneChangeDetection()
], _c$13.prototype, "centerY", 2); __decorateClass([
  SceneChangeDetection()
], _c$13.prototype, "radius", 2); __decorateClass([
  SceneChangeDetection()
], _c$13.prototype, "startAngle", 2); __decorateClass([
  SceneChangeDetection()
], _c$13.prototype, "endAngle", 2); __decorateClass([
  SceneChangeDetection()
], _c$13.prototype, "counterClockwise", 2); __decorateClass([
  SceneChangeDetection()
], _c$13.prototype, "type", 2); return _c$13; })()

// packages/ag-charts-core/src/scene/util/corner.ts
var drawCorner = (path, { x0, y0, x1, y1, cx, cy }, cornerRadius, move) => {
  if (move) {
    path.moveTo(x0, y0);
  }
  if (x0 !== x1 || y0 !== y1) {
    const r0 = Math.atan2(y0 - cy, x0 - cx);
    const r1 = Math.atan2(y1 - cy, x1 - cx);
    path.arc(cx, cy, cornerRadius, r0, r1);
  } else {
    path.lineTo(x0, y0);
  }
};

// packages/ag-charts-core/src/scene/shape/rect.ts
function cornerEdges(leadingEdge, trailingEdge, leadingInset, trailingInset, cornerRadius) {
  let leadingClipped = false;
  let trailingClipped = false;
  let leading0 = trailingInset - Math.sqrt(Math.max(cornerRadius ** 2 - leadingInset ** 2, 0));
  let leading1 = 0;
  let trailing0 = 0;
  let trailing1 = leadingInset - Math.sqrt(Math.max(cornerRadius ** 2 - trailingInset ** 2, 0));
  if (leading0 > leadingEdge) {
    leadingClipped = true;
    leading0 = leadingEdge;
    leading1 = leadingInset - Math.sqrt(Math.max(cornerRadius ** 2 - (trailingInset - leadingEdge) ** 2));
  } else if (isNumberEqual(leading0, 0)) {
    leading0 = 0;
  }
  if (trailing1 > trailingEdge) {
    trailingClipped = true;
    trailing0 = trailingInset - Math.sqrt(Math.max(cornerRadius ** 2 - (leadingInset - trailingEdge) ** 2));
    trailing1 = trailingEdge;
  } else if (isNumberEqual(trailing1, 0)) {
    trailing1 = 0;
  }
  return { leading0, leading1, trailing0, trailing1, leadingClipped, trailingClipped };
}
function clippedRoundRect(path, x, y, width2, height2, cornerRadii, clipBBox) {
  let {
    topLeft: topLeftCornerRadius,
    topRight: topRightCornerRadius,
    bottomRight: bottomRightCornerRadius,
    bottomLeft: bottomLeftCornerRadius
  } = cornerRadii;
  const maxVerticalCornerRadius = Math.max(
    topLeftCornerRadius + bottomLeftCornerRadius,
    topRightCornerRadius + bottomRightCornerRadius
  );
  const maxHorizontalCornerRadius = Math.max(
    topLeftCornerRadius + topRightCornerRadius,
    bottomLeftCornerRadius + bottomRightCornerRadius
  );
  if (maxVerticalCornerRadius <= 0 && maxHorizontalCornerRadius <= 0) {
    if (clipBBox == null) {
      path.rect(x, y, width2, height2);
    } else {
      const x0 = Math.max(x, clipBBox.x);
      const x1 = Math.min(x + width2, clipBBox.x + clipBBox.width);
      const y0 = Math.max(y, clipBBox.y);
      const y1 = Math.min(y + height2, clipBBox.y + clipBBox.height);
      path.rect(x0, y0, x1 - x0, y1 - y0);
    }
    return;
  } else if (clipBBox == null && topLeftCornerRadius === topRightCornerRadius && topLeftCornerRadius === bottomRightCornerRadius && topLeftCornerRadius === bottomLeftCornerRadius) {
    path.roundRect(x, y, width2, height2, topLeftCornerRadius);
    return;
  }
  if (width2 < 0) {
    x += width2;
    width2 = Math.abs(width2);
  }
  if (height2 < 0) {
    y += height2;
    height2 = Math.abs(height2);
  }
  if (width2 <= 0 || height2 <= 0)
    return;
  if (clipBBox == null) {
    clipBBox = new BBox(x, y, width2, height2);
  } else {
    const x0 = Math.max(x, clipBBox.x);
    const x1 = Math.min(x + width2, clipBBox.x + clipBBox.width);
    const y0 = Math.max(y, clipBBox.y);
    const y1 = Math.min(y + height2, clipBBox.y + clipBBox.height);
    clipBBox = new BBox(x0, y0, x1 - x0, y1 - y0);
  }
  const borderScale = Math.max(maxVerticalCornerRadius / height2, maxHorizontalCornerRadius / width2, 1);
  if (borderScale > 1) {
    topLeftCornerRadius /= borderScale;
    topRightCornerRadius /= borderScale;
    bottomRightCornerRadius /= borderScale;
    bottomLeftCornerRadius /= borderScale;
  }
  let drawTopLeftCorner = true;
  let drawTopRightCorner = true;
  let drawBottomRightCorner = true;
  let drawBottomLeftCorner = true;
  let topLeftCorner;
  let topRightCorner;
  let bottomRightCorner;
  let bottomLeftCorner;
  if (drawTopLeftCorner) {
    const nodes = cornerEdges(
      clipBBox.height,
      clipBBox.width,
      Math.max(x + topLeftCornerRadius - clipBBox.x, 0),
      Math.max(y + topLeftCornerRadius - clipBBox.y, 0),
      topLeftCornerRadius
    );
    if (nodes.leadingClipped)
      drawBottomLeftCorner = false;
    if (nodes.trailingClipped)
      drawTopRightCorner = false;
    const x0 = Math.max(clipBBox.x + nodes.leading1, clipBBox.x);
    const y0 = Math.max(clipBBox.y + nodes.leading0, clipBBox.y);
    const x1 = Math.max(clipBBox.x + nodes.trailing1, clipBBox.x);
    const y1 = Math.max(clipBBox.y + nodes.trailing0, clipBBox.y);
    const cx = x + topLeftCornerRadius;
    const cy = y + topLeftCornerRadius;
    topLeftCorner = { x0, y0, x1, y1, cx, cy };
  }
  if (drawTopRightCorner) {
    const nodes = cornerEdges(
      clipBBox.width,
      clipBBox.height,
      Math.max(y + topRightCornerRadius - clipBBox.y, 0),
      Math.max(clipBBox.x + clipBBox.width - (x + width2 - topRightCornerRadius), 0),
      topRightCornerRadius
    );
    if (nodes.leadingClipped)
      drawTopLeftCorner = false;
    if (nodes.trailingClipped)
      drawBottomRightCorner = false;
    const x0 = Math.min(clipBBox.x + clipBBox.width - nodes.leading0, clipBBox.x + clipBBox.width);
    const y0 = Math.max(clipBBox.y + nodes.leading1, clipBBox.y);
    const x1 = Math.min(clipBBox.x + clipBBox.width - nodes.trailing0, clipBBox.x + clipBBox.width);
    const y1 = Math.max(clipBBox.y + nodes.trailing1, clipBBox.y);
    const cx = x + width2 - topRightCornerRadius;
    const cy = y + topRightCornerRadius;
    topRightCorner = { x0, y0, x1, y1, cx, cy };
  }
  if (drawBottomRightCorner) {
    const nodes = cornerEdges(
      clipBBox.height,
      clipBBox.width,
      Math.max(clipBBox.x + clipBBox.width - (x + width2 - bottomRightCornerRadius), 0),
      Math.max(clipBBox.y + clipBBox.height - (y + height2 - bottomRightCornerRadius), 0),
      bottomRightCornerRadius
    );
    if (nodes.leadingClipped)
      drawTopRightCorner = false;
    if (nodes.trailingClipped)
      drawBottomLeftCorner = false;
    const x0 = Math.min(clipBBox.x + clipBBox.width - nodes.leading1, clipBBox.x + clipBBox.width);
    const y0 = Math.min(clipBBox.y + clipBBox.height - nodes.leading0, clipBBox.y + clipBBox.height);
    const x1 = Math.min(clipBBox.x + clipBBox.width - nodes.trailing1, clipBBox.x + clipBBox.width);
    const y1 = Math.min(clipBBox.y + clipBBox.height - nodes.trailing0, clipBBox.y + clipBBox.height);
    const cx = x + width2 - bottomRightCornerRadius;
    const cy = y + height2 - bottomRightCornerRadius;
    bottomRightCorner = { x0, y0, x1, y1, cx, cy };
  }
  if (drawBottomLeftCorner) {
    const nodes = cornerEdges(
      clipBBox.width,
      clipBBox.height,
      Math.max(clipBBox.y + clipBBox.height - (y + height2 - bottomLeftCornerRadius), 0),
      Math.max(x + bottomLeftCornerRadius - clipBBox.x, 0),
      bottomLeftCornerRadius
    );
    if (nodes.leadingClipped)
      drawBottomRightCorner = false;
    if (nodes.trailingClipped)
      drawTopLeftCorner = false;
    const x0 = Math.max(clipBBox.x + nodes.leading0, clipBBox.x);
    const y0 = Math.min(clipBBox.y + clipBBox.height - nodes.leading1, clipBBox.y + clipBBox.height);
    const x1 = Math.max(clipBBox.x + nodes.trailing0, clipBBox.x);
    const y1 = Math.min(clipBBox.y + clipBBox.height - nodes.trailing1, clipBBox.y + clipBBox.height);
    const cx = x + bottomLeftCornerRadius;
    const cy = y + height2 - bottomLeftCornerRadius;
    bottomLeftCorner = { x0, y0, x1, y1, cx, cy };
  }
  let didMove = false;
  if (drawTopLeftCorner && topLeftCorner != null) {
    drawCorner(path, topLeftCorner, topLeftCornerRadius, !didMove);
    didMove || (didMove = true);
  }
  if (drawTopRightCorner && topRightCorner != null) {
    drawCorner(path, topRightCorner, topRightCornerRadius, !didMove);
    didMove || (didMove = true);
  }
  if (drawBottomRightCorner && bottomRightCorner != null) {
    drawCorner(path, bottomRightCorner, bottomRightCornerRadius, !didMove);
    didMove || (didMove = true);
  }
  if (drawBottomLeftCorner && bottomLeftCorner != null) {
    drawCorner(path, bottomLeftCorner, bottomLeftCornerRadius, !didMove);
  }
  path.closePath();
}
var Rect = /*#__PURE__*/ (() => { var _c$14 = class extends Path {
  constructor() {
    super(...arguments);
    this.borderPath = new ExtendedPath2D();
    this.x = 0;
    this.y = 0;
    this.width = 10;
    this.height = 10;
    this.topLeftCornerRadius = 0;
    this.topRightCornerRadius = 0;
    this.bottomRightCornerRadius = 0;
    this.bottomLeftCornerRadius = 0;
    this.clipBBox = void 0;
    this.crisp = false;
    this.crispCentreDirection = void 0;
    // optimised field accessor
    this.crispCentreScratch = { start: 0, length: 0 };
    this.lastUpdatePathStrokeWidth = this.__strokeWidth;
    this.effectiveStrokeWidth = this.__strokeWidth;
    this.hittester = super.isPointInPath.bind(this);
    this.distanceCalculator = super.distanceSquaredTransformedPoint.bind(this);
    /**
     * When the rectangle's width or height is less than a pixel
     * and crisp mode is on, the rectangle will still fit into the pixel,
     * but will be less opaque to make an effect of holding less space.
     */
    this.microPixelEffectOpacity = 1;
  }
  // optimised field accessor
  serialize() {
    return { type: "rect", props: this.serializeProps(), svgPath: this.serializeSvgPath() };
  }
  serializeProps() {
    const { x, y, width: width2, height: height2, clipBBox } = this;
    const props = { ...super.serializeProps(), x, y, width: width2, height: height2 };
    if (clipBBox != null) {
      props.clipX0 = clipBBox.x;
      props.clipY0 = clipBBox.y;
      props.clipX1 = clipBBox.x + clipBBox.width;
      props.clipY1 = clipBBox.y + clipBBox.height;
    }
    return props;
  }
  set cornerRadius(cornerRadius) {
    this.topLeftCornerRadius = cornerRadius;
    this.topRightCornerRadius = cornerRadius;
    this.bottomRightCornerRadius = cornerRadius;
    this.bottomLeftCornerRadius = cornerRadius;
  }
  isDirtyPath() {
    return this.lastUpdatePathStrokeWidth !== this.__strokeWidth || Boolean(this.path.isDirty() || this.borderPath.isDirty());
  }
  updatePath() {
    const {
      path,
      borderPath,
      __crisp: crisp,
      __topLeftCornerRadius: topLeft,
      __topRightCornerRadius: topRight,
      __bottomRightCornerRadius: bottomRight,
      __bottomLeftCornerRadius: bottomLeft
    } = this;
    let { __x: x, __y: y, __width: w, __height: h, __strokeWidth: strokeWidth, __clipBBox: clipBBox } = this;
    const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
    const pixelSize = 1 / pixelRatio;
    let microPixelEffectOpacity = 1;
    path.clear();
    borderPath.clear();
    if (w === 0 || h === 0) {
      this.effectiveStrokeWidth = 0;
      this.lastUpdatePathStrokeWidth = 0;
      this.microPixelEffectOpacity = 0;
      return;
    }
    if (crisp) {
      if (w <= pixelSize) {
        microPixelEffectOpacity *= w / pixelSize;
      }
      if (h <= pixelSize) {
        microPixelEffectOpacity *= h / pixelSize;
      }
      const centreDirection = this.__crispCentreDirection;
      if (centreDirection === "x") {
        ({ start: x, length: w } = this.alignCentre(x, w, this.crispCentreScratch));
      } else {
        w = this.align(x, w);
        x = this.align(x);
      }
      if (centreDirection === "y") {
        ({ start: y, length: h } = this.alignCentre(y, h, this.crispCentreScratch));
      } else {
        h = this.align(y, h);
        y = this.align(y);
      }
      if (clipBBox == null) {
        clipBBox = void 0;
      } else if (centreDirection === "x") {
        const { start: cx, length: cw } = this.alignCentre(clipBBox.x, clipBBox.width, this.crispCentreScratch);
        clipBBox = new BBox(cx, this.align(clipBBox.y), cw, this.align(clipBBox.y, clipBBox.height));
      } else if (centreDirection === "y") {
        const { start: cy, length: ch } = this.alignCentre(
          clipBBox.y,
          clipBBox.height,
          this.crispCentreScratch
        );
        clipBBox = new BBox(this.align(clipBBox.x), cy, this.align(clipBBox.x, clipBBox.width), ch);
      } else {
        clipBBox = new BBox(
          this.align(clipBBox.x),
          this.align(clipBBox.y),
          this.align(clipBBox.x, clipBBox.width),
          this.align(clipBBox.y, clipBBox.height)
        );
      }
    }
    if (strokeWidth > 0) {
      if (w < pixelSize) {
        const lx = x + pixelSize / 2;
        borderPath.moveTo(lx, y);
        borderPath.lineTo(lx, y + h);
        strokeWidth = pixelSize;
        this.borderClipPath = void 0;
      } else if (h < pixelSize) {
        const ly = y + pixelSize / 2;
        borderPath.moveTo(x, ly);
        borderPath.lineTo(x + w, ly);
        strokeWidth = pixelSize;
        this.borderClipPath = void 0;
      } else if (strokeWidth < w && strokeWidth < h) {
        const halfStrokeWidth = strokeWidth / 2;
        x += halfStrokeWidth;
        y += halfStrokeWidth;
        w -= strokeWidth;
        h -= strokeWidth;
        const adjustedClipBBox = clipBBox?.clone().shrink(halfStrokeWidth);
        const cornerRadii = {
          topLeft: topLeft > 0 ? topLeft - strokeWidth : 0,
          topRight: topRight > 0 ? topRight - strokeWidth : 0,
          bottomRight: bottomRight > 0 ? bottomRight - strokeWidth : 0,
          bottomLeft: bottomLeft > 0 ? bottomLeft - strokeWidth : 0
        };
        this.borderClipPath = void 0;
        if (w > 0 && h > 0 && (adjustedClipBBox == null || adjustedClipBBox?.width > 0 && adjustedClipBBox?.height > 0)) {
          clippedRoundRect(path, x, y, w, h, cornerRadii, adjustedClipBBox);
          clippedRoundRect(borderPath, x, y, w, h, cornerRadii, adjustedClipBBox);
        }
      } else {
        this.borderClipPath = this.borderClipPath ?? new ExtendedPath2D();
        this.borderClipPath.clear();
        this.borderClipPath.rect(x, y, w, h);
        borderPath.rect(x, y, w, h);
      }
    } else {
      const cornerRadii = { topLeft, topRight, bottomRight, bottomLeft };
      this.borderClipPath = void 0;
      clippedRoundRect(path, x, y, w, h, cornerRadii, clipBBox);
    }
    if ([topLeft, topRight, bottomRight, bottomLeft].every(areCornersZero)) {
      let distanceSquaredFromRect2 = function(hitX, hitY) {
        return rectInstance.getBBox().distanceSquared(hitX, hitY);
      };
      var distanceSquaredFromRect = distanceSquaredFromRect2;
      const bbox = this.getBBox();
      this.hittester = bbox.containsPoint.bind(bbox);
      const rectInstance = this;
      this.distanceSquared = distanceSquaredFromRect2;
    } else {
      this.hittester = super.isPointInPath;
      this.distanceCalculator = super.distanceSquaredTransformedPoint;
    }
    this.effectiveStrokeWidth = strokeWidth;
    this.lastUpdatePathStrokeWidth = strokeWidth;
    this.microPixelEffectOpacity = microPixelEffectOpacity;
  }
  computeBBox() {
    const { __x: x, __y: y, __width: width2, __height: height2, __clipBBox: clipBBox } = this;
    return clipBBox?.clone() ?? new BBox(x, y, width2, height2);
  }
  isPointInPath(x, y) {
    return this.hittester(x, y);
  }
  get midPoint() {
    return { x: this.__x + this.__width / 2, y: this.__y + this.__height / 2 };
  }
  /**
   * High-performance static property setter that bypasses the decorator system entirely.
   * Writes directly to backing fields (__propertyName) to avoid:
   * - Decorator setter chains and equality checks
   * - Multiple onChangeDetection calls per property
   * - Object.keys() iteration in assignIfNotStrictlyEqual
   * - Object allocation overhead
   *
   * A single markDirty() call at the end ensures the scene graph is properly invalidated.
   * WARNING: Only use for hot paths where performance is critical and properties don't need
   * individual change detection (e.g., when updating many nodes in a loop).
   */
  setStaticProperties(drawingMode, topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius, visible, crisp, fillShadow) {
    this.__drawingMode = drawingMode;
    this.__topLeftCornerRadius = topLeftCornerRadius;
    this.__topRightCornerRadius = topRightCornerRadius;
    this.__bottomRightCornerRadius = bottomRightCornerRadius;
    this.__bottomLeftCornerRadius = bottomLeftCornerRadius;
    this.__visible = visible;
    this.__crisp = crisp;
    this.__fillShadow = fillShadow;
    this.dirtyPath = true;
    this.markDirty();
  }
  /**
   * High-performance animation reset that bypasses the decorator system entirely.
   * Writes directly to backing fields (__x, __y, etc.) to avoid:
   * - Decorator setter chains and equality checks
   * - Multiple onChangeDetection calls
   * - Object.keys() iteration
   *
   * A single markDirty() call at the end ensures the scene graph is properly invalidated.
   * WARNING: Only use for animation hot paths where performance is critical.
   */
  resetAnimationProperties(x, y, width2, height2, opacity, clipBBox) {
    this.__x = x;
    this.__y = y;
    this.__width = width2;
    this.__height = height2;
    this.__opacity = opacity;
    this.__clipBBox = clipBBox;
    this.dirtyPath = true;
    this.markDirty();
  }
  distanceSquared(x, y) {
    return this.distanceCalculator(x, y);
  }
  applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride) {
    super.applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride);
    ctx.globalAlpha *= this.microPixelEffectOpacity;
  }
  getPaintOpacityScale() {
    return this.microPixelEffectOpacity;
  }
  /** `Rect` has its own stroke pass, so only the `fill` shadow mode works. */
  onShadowModeChange() {
    this.__shadowMode = "fill";
  }
  applyStrokeAndAlpha(ctx) {
    super.applyStrokeAndAlpha(ctx);
    ctx.globalAlpha *= this.microPixelEffectOpacity;
  }
  renderStroke(ctx) {
    const { stroke, effectiveStrokeWidth } = this;
    if (stroke != null && stroke !== "" && effectiveStrokeWidth > 0) {
      const { globalAlpha } = ctx;
      const { lineDash, lineDashOffset, lineCap, lineJoin, borderPath, borderClipPath } = this;
      if (borderClipPath) {
        ctx.clip(borderClipPath.getPath2D());
      }
      this.applyStrokeAndAlpha(ctx);
      ctx.lineWidth = effectiveStrokeWidth;
      if (lineDash) {
        ctx.setLineDash(lineDash);
      }
      if (lineDashOffset !== 0) {
        ctx.lineDashOffset = lineDashOffset;
      }
      if (lineCap != null) {
        ctx.lineCap = lineCap;
      }
      if (lineJoin != null) {
        ctx.lineJoin = lineJoin;
      }
      ctx.stroke(borderPath.getPath2D());
      ctx.globalAlpha = globalAlpha;
    }
  }
}; _c$14.className = "Rect"; __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "x", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "y", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "width", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "height", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "topLeftCornerRadius", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "topRightCornerRadius", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "bottomRightCornerRadius", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "bottomLeftCornerRadius", 2); __decorateClass([
  DeclaredSceneChangeDetection({ equals: boxesEqual })
], _c$14.prototype, "clipBBox", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "crisp", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$14.prototype, "crispCentreDirection", 2); return _c$14; })()
function areCornersZero(cornerRadius) {
  return cornerRadius === 0;
}

// packages/ag-charts-core/src/scene/shape/barShape.ts
var FEATHERED_THRESHOLD = 1e-3;
var BarShape = /*#__PURE__*/ (() => { var _c$15 = class extends Rect {
  constructor() {
    super(...arguments);
    this.direction = "x";
    this.featherRatio = 0;
  }
  // optimised field accessor
  /**
   * High-performance static property setter that bypasses the decorator system entirely.
   * Writes directly to backing fields (__propertyName) to avoid:
   * - Decorator setter chains and equality checks
   * - Multiple onChangeDetection calls per property
   * - Object.keys() iteration in assignIfNotStrictlyEqual
   * - Object allocation overhead
   *
   * A single markDirty() call at the end ensures the scene graph is properly invalidated.
   * WARNING: Only use for hot paths where performance is critical and properties don't need
   * individual change detection (e.g., when updating many nodes in a loop).
   */
  setStaticProperties(drawingMode, topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius, visible, crisp, fillShadow, direction, featherRatio, crispCentreDirection) {
    this.__direction = direction ?? "x";
    this.__featherRatio = featherRatio ?? 0;
    this.__crispCentreDirection = crispCentreDirection;
    super.setStaticProperties(
      drawingMode,
      topLeftCornerRadius,
      topRightCornerRadius,
      bottomRightCornerRadius,
      bottomLeftCornerRadius,
      visible,
      crisp,
      fillShadow
    );
  }
  get feathered() {
    return Math.abs(this.featherRatio) > FEATHERED_THRESHOLD;
  }
  isPointInPath(x, y) {
    if (!this.feathered) {
      return super.isPointInPath(x, y);
    }
    const bbox = this.getBBox();
    return bbox.containsPoint(x, y);
  }
  updatePath() {
    if (!this.feathered) {
      super.updatePath();
      return;
    }
    const {
      path,
      borderPath,
      __direction: direction,
      __featherRatio: featherRatio,
      __x: x,
      __y: y,
      __width: width2,
      __height: height2
    } = this;
    path.clear();
    borderPath.clear();
    if (direction === "x") {
      const featherInsetX = Math.abs(featherRatio) * width2;
      if (featherRatio > 0) {
        path.moveTo(x, y);
        path.lineTo(x + width2 - featherInsetX, y);
        path.lineTo(x + width2, y + height2 / 2);
        path.lineTo(x + width2 - featherInsetX, y + height2);
        path.lineTo(x, y + height2);
        path.closePath();
      } else {
        path.moveTo(x + featherInsetX, y);
        path.lineTo(x + width2, y);
        path.lineTo(x + width2, y + height2);
        path.lineTo(x + featherInsetX, y + height2);
        path.lineTo(x, y + height2 / 2);
        path.closePath();
      }
    } else {
      const featherInsetY = Math.abs(featherRatio) * height2;
      if (featherRatio > 0) {
        path.moveTo(x, y + featherInsetY);
        path.lineTo(x + width2 / 2, y);
        path.lineTo(x + width2, y + featherInsetY);
        path.lineTo(x + width2, y + height2);
        path.lineTo(x, y + height2);
        path.closePath();
      } else {
        path.moveTo(x, y);
        path.lineTo(x + width2, y);
        path.lineTo(x + width2, y + height2 - featherInsetY);
        path.lineTo(x + width2 / 2, y + height2);
        path.lineTo(x, y + height2 - featherInsetY);
        path.closePath();
      }
    }
  }
  renderStroke(ctx) {
    if (!this.feathered) {
      super.renderStroke(ctx);
      return;
    }
    const {
      __stroke: stroke,
      __strokeWidth: strokeWidth,
      __lineDash: lineDash,
      __lineDashOffset: lineDashOffset,
      __lineCap: lineCap,
      __lineJoin: lineJoin,
      path
    } = this;
    if (stroke != null && stroke !== "" && strokeWidth > 0) {
      const { globalAlpha } = ctx;
      this.applyStrokeAndAlpha(ctx);
      ctx.lineWidth = strokeWidth;
      if (lineDash) {
        ctx.setLineDash(lineDash);
      }
      if (lineDashOffset !== 0) {
        ctx.lineDashOffset = lineDashOffset;
      }
      if (lineCap != null) {
        ctx.lineCap = lineCap;
      }
      if (lineJoin != null) {
        ctx.lineJoin = lineJoin;
      }
      ctx.stroke(path.getPath2D());
      ctx.globalAlpha = globalAlpha;
    }
  }
}; __decorateClass([
  DeclaredSceneChangeDetection()
], _c$15.prototype, "direction", 2); __decorateClass([
  DeclaredSceneChangeDetection()
], _c$15.prototype, "featherRatio", 2); return _c$15; })()

// packages/ag-charts-core/src/scene/shape/imageSegmentNode.ts
var ImageSegmentNode = /*#__PURE__*/ (() => { var _c$16 = class extends Node {
  constructor() {
    super(...arguments);
    this.x = 0;
    this.y = 0;
    this.boxWidth = 0;
    this.boxHeight = 0;
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.paddingTop = 0;
    this.paddingRight = 0;
    this.paddingBottom = 0;
    this.paddingLeft = 0;
    this.cornerRadius = 0;
    this.opacity = 1;
    this.url = "";
  }
  setScene(scene) {
    if (scene == null && this.registeredLoader) {
      this.registeredLoader.unregisterNode(this);
      this.registeredLoader = void 0;
    }
    super.setScene(scene);
  }
  destroy() {
    if (this.registeredLoader) {
      this.registeredLoader.unregisterNode(this);
      this.registeredLoader = void 0;
    }
    super.destroy();
  }
  render(renderCtx) {
    const { ctx } = renderCtx;
    const { x, y, boxWidth, boxHeight, cornerRadius, opacity } = this;
    if (boxWidth <= 0 || boxHeight <= 0) {
      super.render(renderCtx);
      return;
    }
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = previousAlpha * opacity;
    if (this.backgroundFill != null && this.backgroundFill !== "") {
      this.tracePath(ctx, x, y, boxWidth, boxHeight, cornerRadius);
      ctx.fillStyle = this.backgroundFill;
      ctx.fill();
    }
    const hasUrl = this.url !== "";
    if (hasUrl) {
      const loader = this.imageLoader;
      if (loader !== this.registeredLoader) {
        this.registeredLoader?.unregisterNode(this);
        this.registeredLoader = loader;
      }
      const image = loader?.loadImage(this.url, this, {
        width: this.imageWidth,
        height: this.imageHeight
      });
      if (image) {
        const imgX = x + this.paddingLeft;
        const imgY = y + this.paddingTop;
        const clipToCorners = cornerRadius > 0;
        if (clipToCorners) {
          ctx.save();
          this.tracePath(ctx, x, y, boxWidth, boxHeight, cornerRadius);
          ctx.clip();
        }
        ctx.drawImage(image, imgX, imgY, this.imageWidth, this.imageHeight);
        if (clipToCorners) {
          ctx.restore();
        }
      }
    } else {
      renderCtx.logger.warnOnce(
        `Image segment has an empty url; rendering background only (${boxWidth}x${boxHeight} box).`
      );
    }
    ctx.globalAlpha = previousAlpha;
    super.render(renderCtx);
  }
  tracePath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    if (radius === 0) {
      ctx.rect(x, y, w, h);
      return;
    }
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
  computeBBox() {
    return new BBox(this.x, this.y, this.boxWidth, this.boxHeight);
  }
}; __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "x", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "y", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "boxWidth", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "boxHeight", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "imageWidth", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "imageHeight", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "paddingTop", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "paddingRight", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "paddingBottom", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "paddingLeft", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "cornerRadius", 2); __decorateClass([
  SceneChangeDetection()
], _c$16.prototype, "opacity", 2); return _c$16; })()

// packages/ag-charts-core/src/scene/shape/line.ts
var Line = /*#__PURE__*/ (() => { var _c$17 = class extends Shape {
  constructor(opts = {}) {
    super(opts);
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.fill = void 0;
    this.strokeWidth = 1;
  }
  set x(value) {
    this.x1 = value;
    this.x2 = value;
  }
  set y(value) {
    this.y1 = value;
    this.y2 = value;
  }
  serialize() {
    return { type: "line", props: this.serializeProps() };
  }
  serializeProps() {
    return { ...super.serializeProps(), x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2 };
  }
  get midPoint() {
    return { x: (this.x1 + this.x2) / 2, y: (this.y1 + this.y2) / 2 };
  }
  computeBBox() {
    return new BBox(
      Math.min(this.x1, this.x2),
      Math.min(this.y1, this.y2),
      Math.abs(this.x2 - this.x1),
      Math.abs(this.y2 - this.y1)
    );
  }
  isPointInPath(x, y) {
    if (this.x1 === this.x2 || this.y1 === this.y2) {
      return this.getBBox().clone().grow(this.strokeWidth / 2).containsPoint(x, y);
    }
    return false;
  }
  distanceSquared(px, py) {
    const { x1, y1, x2, y2 } = this;
    return lineDistanceSquared(px, py, x1, y1, x2, y2, Infinity);
  }
  render(renderCtx) {
    const { ctx, devicePixelRatio } = renderCtx;
    let { x1, y1, x2, y2 } = this;
    if (x1 === x2) {
      const strokeDev = Math.trunc(this.strokeWidth * devicePixelRatio);
      const x = snapDeviceCentre(x1 * devicePixelRatio, strokeDev) / devicePixelRatio;
      x1 = x;
      x2 = x;
    } else if (y1 === y2) {
      const strokeDev = Math.trunc(this.strokeWidth * devicePixelRatio);
      const y = snapDeviceCentre(y1 * devicePixelRatio, strokeDev) / devicePixelRatio;
      y1 = y;
      y2 = y;
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    this.fillStroke(ctx, renderCtx.logger);
    super.render(renderCtx);
  }
  toSVG() {
    if (!this.visible)
      return;
    const element2 = createSvgElement("line");
    element2.setAttribute("x1", String(this.x1));
    element2.setAttribute("y1", String(this.y1));
    element2.setAttribute("x2", String(this.x2));
    element2.setAttribute("y2", String(this.y2));
    this.applySvgStrokeAttributes(element2);
    return {
      elements: [element2]
    };
  }
}; _c$17.className = "Line"; __decorateClass([
  SceneChangeDetection()
], _c$17.prototype, "x1", 2); __decorateClass([
  SceneChangeDetection()
], _c$17.prototype, "y1", 2); __decorateClass([
  SceneChangeDetection()
], _c$17.prototype, "x2", 2); __decorateClass([
  SceneChangeDetection()
], _c$17.prototype, "y2", 2); return _c$17; })()

// packages/ag-charts-core/src/scene/shape/radialColumnShape.ts
function rotatePoint2(x, y, rotation) {
  const radius = Math.hypot(x, y);
  const angle2 = Math.atan2(y, x);
  const rotated = angle2 + rotation;
  return {
    x: Math.cos(rotated) * radius,
    y: Math.sin(rotated) * radius
  };
}
var RadialColumnShape = /*#__PURE__*/ (() => { var _c$18 = class extends Path {
  constructor() {
    super(...arguments);
    this.isBeveled = true;
    this.columnWidth = 0;
    this.startAngle = 0;
    this.endAngle = 0;
    this.outerRadius = 0;
    this.innerRadius = 0;
    this.axisInnerRadius = 0;
    this.axisOuterRadius = 0;
  }
  set cornerRadius(_value) {
  }
  computeBBox() {
    const { columnWidth } = this;
    const [innerRadius, outerRadius] = this.normalizeRadii(this.innerRadius, this.outerRadius);
    const rotation = this.getRotation();
    const left = -columnWidth / 2;
    const right = columnWidth / 2;
    const top = -outerRadius;
    const bottom = -innerRadius;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < 4; i += 1) {
      const { x, y } = rotatePoint2(i % 2 === 0 ? left : right, i < 2 ? top : bottom, rotation);
      x0 = Math.min(x, x0);
      y0 = Math.min(y, y0);
      x1 = Math.max(x, x1);
      y1 = Math.max(y, y1);
    }
    return new BBox(x0, y0, x1 - x0, y1 - y0);
  }
  getRotation() {
    const { startAngle, endAngle } = this;
    const midAngle = angleBetween(startAngle, endAngle);
    return normalizeAngle360(startAngle + midAngle / 2 + Math.PI / 2);
  }
  normalizeRadii(innerRadius, outerRadius) {
    if (innerRadius > outerRadius) {
      return [outerRadius, innerRadius];
    }
    return [innerRadius, outerRadius];
  }
  updatePath() {
    const { isBeveled } = this;
    if (isBeveled) {
      this.updateBeveledPath();
    } else {
      this.updateRectangularPath();
    }
    this.checkPathDirty();
  }
  updateRectangularPath() {
    const { columnWidth, path } = this;
    const [innerRadius, outerRadius] = this.normalizeRadii(this.innerRadius, this.outerRadius);
    const left = -columnWidth / 2;
    const right = columnWidth / 2;
    const top = -outerRadius;
    const bottom = -innerRadius;
    const rotation = this.getRotation();
    const points = [
      [left, bottom],
      [left, top],
      [right, top],
      [right, bottom]
    ].map(([x, y]) => rotatePoint2(x, y, rotation));
    path.clear(true);
    path.moveTo(points[0].x, points[0].y);
    path.lineTo(points[1].x, points[1].y);
    path.lineTo(points[2].x, points[2].y);
    path.lineTo(points[3].x, points[3].y);
    path.closePath();
  }
  calculateCircleIntersection(x, radiusSquared) {
    const xSquared = x * x;
    if (radiusSquared < xSquared) {
      return null;
    }
    const y = -Math.sqrt(radiusSquared - xSquared);
    const angle2 = Math.atan2(y, x);
    return { y, angle: angle2 };
  }
  calculateBothIntersections(left, right, radius) {
    const radiusSquared = radius * radius;
    const leftInt = this.calculateCircleIntersection(left, radiusSquared);
    const rightInt = this.calculateCircleIntersection(right, radiusSquared);
    if (!leftInt || !rightInt) {
      return null;
    }
    return { left: leftInt, right: rightInt };
  }
  calculateAxisOuterIntersections(left, right, axisOuterRadius) {
    const axisOuterRadiusSquared = axisOuterRadius * axisOuterRadius;
    const axisOuterLeft = this.calculateCircleIntersection(left, axisOuterRadiusSquared);
    const axisOuterRight = this.calculateCircleIntersection(right, axisOuterRadiusSquared);
    if (!axisOuterLeft || !axisOuterRight) {
      return null;
    }
    return {
      left: axisOuterLeft,
      right: axisOuterRight,
      radiusSquared: axisOuterRadiusSquared
    };
  }
  moveToRotated(x, y, rotation) {
    const point = rotatePoint2(x, y, rotation);
    this.path.moveTo(point.x, point.y);
  }
  lineToRotated(x, y, rotation) {
    const point = rotatePoint2(x, y, rotation);
    this.path.lineTo(point.x, point.y);
  }
  renderTopWithCornerClipping(axisOuterRadius, axisOuter, geometry) {
    const { path } = this;
    const { right, top, rotation } = geometry;
    const topSquared = top * top;
    const topIntersectionSquared = axisOuter.radiusSquared - topSquared;
    if (topIntersectionSquared <= 0) {
      this.lineToRotated(right, axisOuter.right.y, rotation);
      path.arc(0, 0, axisOuterRadius, rotation + axisOuter.right.angle, rotation + axisOuter.left.angle, true);
    } else {
      const topIntersectionX = Math.sqrt(topIntersectionSquared);
      const topRightAngle = Math.atan2(top, topIntersectionX);
      const topLeftAngle = Math.atan2(top, -topIntersectionX);
      this.lineToRotated(right, axisOuter.right.y, rotation);
      path.arc(0, 0, axisOuterRadius, rotation + axisOuter.right.angle, rotation + topRightAngle, true);
      this.lineToRotated(-topIntersectionX, top, rotation);
      path.arc(0, 0, axisOuterRadius, rotation + topLeftAngle, rotation + axisOuter.left.angle, true);
    }
  }
  updateBeveledPath() {
    const { columnWidth, path, axisInnerRadius, axisOuterRadius } = this;
    const [innerRadius, outerRadius] = this.normalizeRadii(this.innerRadius, this.outerRadius);
    const left = -columnWidth / 2;
    const right = columnWidth / 2;
    const top = -outerRadius;
    const bottom = -innerRadius;
    const rotation = this.getRotation();
    const isTouchingInner = isNumberEqual(innerRadius, axisInnerRadius);
    const isTouchingOuter = isNumberEqual(outerRadius, axisOuterRadius);
    const topCornersBreach = Math.hypot(left, top) > axisOuterRadius || Math.hypot(right, top) > axisOuterRadius;
    if (!isTouchingInner && !isTouchingOuter && !topCornersBreach) {
      this.updateRectangularPath();
      return;
    }
    const inner = isTouchingInner ? this.calculateBothIntersections(left, right, innerRadius) : null;
    const outer = isTouchingOuter ? this.calculateBothIntersections(left, right, outerRadius) : null;
    const axisOuter = topCornersBreach ? this.calculateAxisOuterIntersections(left, right, axisOuterRadius) : null;
    if (isTouchingInner && !inner || isTouchingOuter && !outer || topCornersBreach && !axisOuter) {
      this.updateRectangularPath();
      return;
    }
    path.clear(true);
    const geometry = { left, right, top, bottom, rotation };
    if (inner) {
      this.moveToRotated(left, inner.left.y, rotation);
    } else {
      this.moveToRotated(left, bottom, rotation);
    }
    if (inner) {
      path.arc(0, 0, innerRadius, rotation + inner.left.angle, rotation + inner.right.angle, false);
    } else {
      this.lineToRotated(right, bottom, rotation);
    }
    if (outer) {
      this.lineToRotated(right, outer.right.y, rotation);
      path.arc(0, 0, outerRadius, rotation + outer.right.angle, rotation + outer.left.angle, true);
    } else if (axisOuter) {
      this.renderTopWithCornerClipping(axisOuterRadius, axisOuter, geometry);
    } else {
      this.lineToRotated(right, top, rotation);
      this.lineToRotated(left, top, rotation);
    }
    path.closePath();
  }
}; _c$18.className = "RadialColumnShape"; __decorateClass([
  SceneChangeDetection()
], _c$18.prototype, "isBeveled", 2); __decorateClass([
  SceneChangeDetection()
], _c$18.prototype, "columnWidth", 2); __decorateClass([
  SceneChangeDetection()
], _c$18.prototype, "startAngle", 2); __decorateClass([
  SceneChangeDetection()
], _c$18.prototype, "endAngle", 2); __decorateClass([
  SceneChangeDetection()
], _c$18.prototype, "outerRadius", 2); __decorateClass([
  SceneChangeDetection()
], _c$18.prototype, "innerRadius", 2); __decorateClass([
  SceneChangeDetection()
], _c$18.prototype, "axisInnerRadius", 2); __decorateClass([
  SceneChangeDetection()
], _c$18.prototype, "axisOuterRadius", 2); return _c$18; })()
function getRadialColumnWidth(startAngle, endAngle, axisOuterRadius, columnWidthRatio, maxColumnWidthRatio) {
  const rotation = angleBetween(startAngle, endAngle);
  const pad2 = rotation * (1 - columnWidthRatio) / 2;
  startAngle += pad2;
  endAngle -= pad2;
  if (rotation < 1e-3) {
    return 2 * axisOuterRadius * maxColumnWidthRatio;
  }
  if (rotation >= 2 * Math.PI) {
    const midAngle = startAngle + rotation / 2;
    startAngle = midAngle - Math.PI;
    endAngle = midAngle + Math.PI;
  }
  const startX = axisOuterRadius * Math.cos(startAngle);
  const startY = axisOuterRadius * Math.sin(startAngle);
  const endX = axisOuterRadius * Math.cos(endAngle);
  const endY = axisOuterRadius * Math.sin(endAngle);
  const colWidth = Math.floor(Math.hypot(startX - endX, startY - endY));
  const maxWidth = 2 * axisOuterRadius * maxColumnWidthRatio;
  return Math.max(1, Math.min(maxWidth, colWidth));
}

// packages/ag-charts-core/src/scene/shape/range.ts
var Range = /*#__PURE__*/ (() => { var _c$19 = class extends Shape {
  constructor(opts = {}) {
    super(opts);
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.startLine = false;
    this.endLine = false;
    this.horizontal = false;
    this.strokeWidth = 1;
  }
  serialize() {
    return { type: "range", props: this.serializeProps() };
  }
  serializeProps() {
    return { ...super.serializeProps(), x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2 };
  }
  computeBBox() {
    return new BBox(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
  }
  isPointInPath(_x, _y) {
    return false;
  }
  render(renderCtx) {
    const { ctx } = renderCtx;
    let { x1, y1, x2, y2 } = this;
    x1 = this.align(x1);
    y1 = this.align(y1);
    x2 = this.align(x2);
    y2 = this.align(y2);
    const { fill, horizontal } = this;
    const { globalAlpha } = ctx;
    if (fill != null) {
      this.applyFillAndAlpha(ctx, renderCtx.logger);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x1, y2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = globalAlpha;
    }
    const { stroke, strokeWidth, startLine, endLine } = this;
    const strokeActive = (startLine || endLine) && stroke != null && stroke !== "" && strokeWidth > 0;
    if (strokeActive) {
      const { lineDash, lineDashOffset, lineCap, lineJoin } = this;
      this.applyStrokeAndAlpha(ctx);
      ctx.lineWidth = strokeWidth;
      if (lineDash) {
        ctx.setLineDash([...lineDash]);
      }
      if (lineDashOffset !== 0) {
        ctx.lineDashOffset = lineDashOffset;
      }
      if (lineCap != null) {
        ctx.lineCap = lineCap;
      }
      if (lineJoin != null) {
        ctx.lineJoin = lineJoin;
      }
      ctx.beginPath();
      if (startLine) {
        ctx.moveTo(x1, y1);
        if (horizontal) {
          ctx.lineTo(x1, y2);
        } else {
          ctx.lineTo(x2, y1);
        }
      }
      if (endLine) {
        ctx.moveTo(x2, y2);
        if (horizontal) {
          ctx.lineTo(x2, y1);
        } else {
          ctx.lineTo(x1, y2);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = globalAlpha;
    }
    super.render(renderCtx);
  }
}; _c$19.className = "Range"; __decorateClass([
  SceneChangeDetection()
], _c$19.prototype, "x1", 2); __decorateClass([
  SceneChangeDetection()
], _c$19.prototype, "y1", 2); __decorateClass([
  SceneChangeDetection()
], _c$19.prototype, "x2", 2); __decorateClass([
  SceneChangeDetection()
], _c$19.prototype, "y2", 2); __decorateClass([
  SceneChangeDetection()
], _c$19.prototype, "startLine", 2); __decorateClass([
  SceneChangeDetection()
], _c$19.prototype, "endLine", 2); __decorateClass([
  SceneChangeDetection()
], _c$19.prototype, "horizontal", 2); return _c$19; })()

// packages/ag-charts-core/src/scene/util/sector.ts
function sectorBox({ startAngle, endAngle, innerRadius, outerRadius }) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const addPoint = (x, y) => {
    x0 = Math.min(x, x0);
    y0 = Math.min(y, y0);
    x1 = Math.max(x, x1);
    y1 = Math.max(y, y1);
  };
  addPoint(innerRadius * Math.cos(startAngle), innerRadius * Math.sin(startAngle));
  addPoint(innerRadius * Math.cos(endAngle), innerRadius * Math.sin(endAngle));
  addPoint(outerRadius * Math.cos(startAngle), outerRadius * Math.sin(startAngle));
  addPoint(outerRadius * Math.cos(endAngle), outerRadius * Math.sin(endAngle));
  if (isBetweenAngles(0, startAngle, endAngle)) {
    addPoint(outerRadius, 0);
  }
  if (isBetweenAngles(Math.PI * 0.5, startAngle, endAngle)) {
    addPoint(0, outerRadius);
  }
  if (isBetweenAngles(Math.PI, startAngle, endAngle)) {
    addPoint(-outerRadius, 0);
  }
  if (isBetweenAngles(Math.PI * 1.5, startAngle, endAngle)) {
    addPoint(0, -outerRadius);
  }
  return new BBox(x0, y0, x1 - x0, y1 - y0);
}
function isBoxInSector(box, sector) {
  const x1 = box.x + box.width;
  const y1 = box.y + box.height;
  if (!isPointInSector(box.x, box.y, sector) || !isPointInSector(x1, box.y, sector) || !isPointInSector(x1, y1, sector) || !isPointInSector(box.x, y1, sector)) {
    return false;
  }
  const nearestX = Math.min(Math.max(0, box.x), x1);
  const nearestY = Math.min(Math.max(0, box.y), y1);
  const innerRadius = Math.min(sector.innerRadius, sector.outerRadius);
  if (nearestX ** 2 + nearestY ** 2 < innerRadius ** 2)
    return false;
  if (angleBetween(sector.startAngle, sector.endAngle) <= Math.PI)
    return true;
  const radius = Math.max(sector.innerRadius, sector.outerRadius);
  return !edgeCrossesBox(box, sector.startAngle, radius) && !edgeCrossesBox(box, sector.endAngle, radius);
}
function edgeCrossesBox(box, angle2, radius) {
  return boxCrossesSegment(box, 0, 0, radius * Math.cos(angle2), radius * Math.sin(angle2));
}
function isPointInSector(x, y, sector) {
  const radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  const { innerRadius, outerRadius } = sector;
  if (sector.startAngle === sector.endAngle || radius < Math.min(innerRadius, outerRadius) || radius > Math.max(innerRadius, outerRadius)) {
    return false;
  }
  const startAngle = normalizeAngle180(sector.startAngle);
  const endAngle = normalizeAngle180(sector.endAngle);
  const angle2 = Math.atan2(y, x);
  return startAngle < endAngle ? angle2 <= endAngle && angle2 >= startAngle : angle2 <= endAngle && angle2 >= -Math.PI || angle2 >= startAngle && angle2 <= Math.PI;
}
function arcIntersections(cx, cy, r, startAngle, endAngle, counterClockwise, x1, y1, x2, y2) {
  if (Number.isNaN(cx) || Number.isNaN(cy)) {
    return 0;
  }
  if (counterClockwise) {
    [endAngle, startAngle] = [startAngle, endAngle];
  }
  const points = [];
  if (x1 === x2) {
    const dd = Math.pow(r, 2) - Math.pow(x1 - cx, 2);
    if (dd < 0) {
      return 0;
    }
    const root = Math.sqrt(dd);
    points.push({ x: x1, y: cy + root }, { x: x1, y: cy - root });
  } else {
    const k = (y2 - y1) / (x2 - x1);
    const y0 = y1 - k * x1;
    const a = Math.pow(k, 2) + 1;
    const b = 2 * (k * (y0 - cy) - cx);
    const c = Math.pow(cx, 2) + Math.pow(y0 - cy, 2) - Math.pow(r, 2);
    const d = Math.pow(b, 2) - 4 * a * c;
    if (d < 0) {
      return 0;
    }
    const i1x = (-b + Math.sqrt(d)) / 2 / a;
    const i2x = (-b - Math.sqrt(d)) / 2 / a;
    points.push({ x: i1x, y: k * i1x + y0 }, { x: i2x, y: k * i2x + y0 });
  }
  let intersections = 0;
  for (const { x, y } of points) {
    const isInsideLine = x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(y1, y2) && y <= Math.max(y1, y2);
    if (!isInsideLine) {
      continue;
    }
    const angle2 = Math.atan2(y - cy, x - cx);
    if (isBetweenAngles(angle2, startAngle, endAngle)) {
      intersections++;
    }
  }
  return intersections;
}
function sectorEdges({ startAngle, endAngle, innerRadius, outerRadius }) {
  const sinStartAngle = Math.sin(startAngle);
  const cosStartAngle = Math.cos(startAngle);
  const sinEndAngle = Math.sin(endAngle);
  const cosEndAngle = Math.cos(endAngle);
  return {
    startX0: innerRadius * cosStartAngle,
    startY0: innerRadius * sinStartAngle,
    startX1: outerRadius * cosStartAngle,
    startY1: outerRadius * sinStartAngle,
    endX0: innerRadius * cosEndAngle,
    endY0: innerRadius * sinEndAngle,
    endX1: outerRadius * cosEndAngle,
    endY1: outerRadius * sinEndAngle
  };
}
function boxOverlapsSector(box, sector, edges = sectorEdges(sector)) {
  const { startAngle, endAngle, outerRadius, innerRadius } = sector;
  const { startX0, startY0, startX1, startY1, endX0, endY0, endX1, endY1 } = edges;
  const top = box.y;
  const bottom = box.y + box.height;
  const left = box.x;
  const right = box.x + box.width;
  const pointInBox = (x, y) => x >= left && x <= right && y >= top && y <= bottom;
  if (pointInBox(startX0, startY0) || pointInBox(startX1, startY1) || pointInBox(endX0, endY0) || pointInBox(endX1, endY1)) {
    return true;
  }
  if (isPointInSector(left, top, sector) || isPointInSector(right, top, sector) || isPointInSector(left, bottom, sector) || isPointInSector(right, bottom, sector)) {
    return true;
  }
  if (segmentIntersection(left, top, right, top, startX0, startY0, startX1, startY1) > 0 || segmentIntersection(left, top, right, top, endX0, endY0, endX1, endY1) > 0 || segmentIntersection(left, bottom, right, bottom, startX0, startY0, startX1, startY1) > 0 || segmentIntersection(left, bottom, right, bottom, endX0, endY0, endX1, endY1) > 0 || segmentIntersection(left, top, left, bottom, startX0, startY0, startX1, startY1) > 0 || segmentIntersection(left, top, left, bottom, endX0, endY0, endX1, endY1) > 0 || segmentIntersection(right, top, right, bottom, startX0, startY0, startX1, startY1) > 0 || segmentIntersection(right, top, right, bottom, endX0, endY0, endX1, endY1) > 0) {
    return true;
  }
  if (arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, left, top, right, top) > 0 || arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, left, bottom, right, bottom) > 0 || arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, left, top, left, bottom) > 0 || arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, right, top, right, bottom) > 0) {
    return true;
  }
  if (innerRadius > 0) {
    if (arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, left, top, right, top) > 0 || arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, left, bottom, right, bottom) > 0 || arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, left, top, left, bottom) > 0 || arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, right, top, right, bottom) > 0) {
      return true;
    }
  }
  return false;
}
function radiiScalingFactor(r, sweep, a, b) {
  if (a === 0 && b === 0)
    return 0;
  const fs1 = Math.asin(Math.abs(1 * a) / (r + 1 * a)) + Math.asin(Math.abs(1 * b) / (r + 1 * b)) - sweep;
  if (fs1 < 0)
    return 1;
  let start2 = 0;
  let end3 = 1;
  for (let i = 0; i < 8; i += 1) {
    const s = (start2 + end3) / 2;
    const fs = Math.asin(Math.abs(s * a) / (r + s * a)) + Math.asin(Math.abs(s * b) / (r + s * b)) - sweep;
    if (fs < 0) {
      start2 = s;
    } else {
      end3 = s;
    }
  }
  return start2;
}
var delta2 = 1e-6;
function clockwiseAngle(angle2, relativeToStartAngle) {
  if (angleBetween(angle2, relativeToStartAngle) < delta2) {
    return relativeToStartAngle;
  } else {
    return normalizeAngle360(angle2 - relativeToStartAngle) + relativeToStartAngle;
  }
}
function clockwiseAngles(startAngle, endAngle, relativeToStartAngle = 0) {
  const fullPie = Math.abs(endAngle - startAngle) >= 2 * Math.PI - delta2;
  const sweepAngle = fullPie ? 2 * Math.PI : normalizeAngle360(endAngle - startAngle);
  startAngle = clockwiseAngle(startAngle, relativeToStartAngle);
  endAngle = startAngle + sweepAngle;
  return { startAngle, endAngle };
}
function arcRadialLineIntersectionAngle(cx, cy, r, startAngle, endAngle, clipAngle) {
  const sinA = Math.sin(clipAngle);
  const cosA = Math.cos(clipAngle);
  const c = cx ** 2 + cy ** 2 - r ** 2;
  let p0x;
  let p0y;
  let p1x;
  let p1y;
  if (cosA > 0.5) {
    const tanA = sinA / cosA;
    const a = 1 + tanA ** 2;
    const b = -2 * (cx + cy * tanA);
    const d = b ** 2 - 4 * a * c;
    if (d < 0)
      return;
    const x0 = (-b + Math.sqrt(d)) / (2 * a);
    const x1 = (-b - Math.sqrt(d)) / (2 * a);
    p0x = x0;
    p0y = x0 * tanA;
    p1x = x1;
    p1y = x1 * tanA;
  } else {
    const cotA = cosA / sinA;
    const a = 1 + cotA ** 2;
    const b = -2 * (cy + cx * cotA);
    const d = b ** 2 - 4 * a * c;
    if (d < 0)
      return;
    const y0 = (-b + Math.sqrt(d)) / (2 * a);
    const y1 = (-b - Math.sqrt(d)) / (2 * a);
    p0x = y0 * cotA;
    p0y = y0;
    p1x = y1 * cotA;
    p1y = y1;
  }
  const normalisedX = cosA;
  const normalisedY = sinA;
  const p0DotNormalized = p0x * normalisedX + p0y * normalisedY;
  const p1DotNormalized = p1x * normalisedX + p1y * normalisedY;
  const a0 = p0DotNormalized > 0 ? clockwiseAngle(Math.atan2(p0y - cy, p0x - cx), startAngle) : Number.NaN;
  const a1 = p1DotNormalized > 0 ? clockwiseAngle(Math.atan2(p1y - cy, p1x - cx), startAngle) : Number.NaN;
  if (a0 >= startAngle && a0 <= endAngle) {
    return a0;
  } else if (a1 >= startAngle && a1 <= endAngle) {
    return a1;
  }
}
function arcCircleIntersectionAngle(cx, cy, r, startAngle, endAngle, circleR) {
  const d = Math.hypot(cx, cy);
  const d1 = (d ** 2 - r ** 2 + circleR ** 2) / (2 * d);
  const d2 = d - d1;
  const theta = Math.atan2(cy, cx);
  const deltaTheta = Math.acos(-d2 / r);
  const a0 = clockwiseAngle(theta + deltaTheta, startAngle);
  const a1 = clockwiseAngle(theta - deltaTheta, startAngle);
  if (a0 >= startAngle && a0 <= endAngle) {
    return a0;
  } else if (a1 >= startAngle && a1 <= endAngle) {
    return a1;
  }
}

// packages/ag-charts-core/src/scene/shape/sector.ts
var Arc2 = class {
  constructor(cx, cy, r, a0, a1) {
    this.cx = cx;
    this.cy = cy;
    this.r = r;
    this.a0 = a0;
    this.a1 = a1;
    if (this.a0 >= this.a1) {
      this.a0 = Number.NaN;
      this.a1 = Number.NaN;
    }
  }
  isValid() {
    return Number.isFinite(this.a0) && Number.isFinite(this.a1);
  }
  pointAt(a) {
    return {
      x: this.cx + this.r * Math.cos(a),
      y: this.cy + this.r * Math.sin(a)
    };
  }
  clipStart(a) {
    if (a == null || !this.isValid() || a < this.a0)
      return;
    this.a0 = a;
    if (Number.isNaN(a) || this.a0 >= this.a1) {
      this.a0 = Number.NaN;
      this.a1 = Number.NaN;
    }
  }
  clipEnd(a) {
    if (a == null || !this.isValid() || a > this.a1)
      return;
    this.a1 = a;
    if (Number.isNaN(a) || this.a0 >= this.a1) {
      this.a0 = Number.NaN;
      this.a1 = Number.NaN;
    }
  }
};
var Sector = /*#__PURE__*/ (() => { var _c$20 = class extends Path {
  constructor() {
    super(...arguments);
    this.centerX = 0;
    this.centerY = 0;
    this.innerRadius = 10;
    this.outerRadius = 20;
    this.startAngle = 0;
    this.endAngle = Math.PI * 2;
    this.clipSector = void 0;
    this.concentricEdgeInset = 0;
    this.radialEdgeInset = 0;
    this.startOuterCornerRadius = 0;
    this.endOuterCornerRadius = 0;
    this.startInnerCornerRadius = 0;
    this.endInnerCornerRadius = 0;
  }
  serialize() {
    return { type: "sector", props: this.serializeProps(), svgPath: this.serializeSvgPath() };
  }
  serializeProps() {
    return {
      ...super.serializeProps(),
      startAngle: this.startAngle,
      endAngle: this.endAngle,
      innerRadius: this.innerRadius,
      outerRadius: this.outerRadius
    };
  }
  set inset(value) {
    this.concentricEdgeInset = value;
    this.radialEdgeInset = value;
  }
  set cornerRadius(value) {
    this.startOuterCornerRadius = value;
    this.endOuterCornerRadius = value;
    this.startInnerCornerRadius = value;
    this.endInnerCornerRadius = value;
  }
  computeBBox() {
    return sectorBox(this).translate(this.centerX, this.centerY);
  }
  normalizedRadii() {
    const { concentricEdgeInset } = this;
    let { innerRadius, outerRadius } = this;
    innerRadius = innerRadius > 0 ? innerRadius + concentricEdgeInset : 0;
    outerRadius = Math.max(outerRadius - concentricEdgeInset, 0);
    return { innerRadius, outerRadius };
  }
  normalizedClipSector() {
    const { clipSector } = this;
    if (clipSector == null)
      return;
    const { startAngle, endAngle } = clockwiseAngles(this.startAngle, this.endAngle);
    const { innerRadius, outerRadius } = this.normalizedRadii();
    const clipAngles = clockwiseAngles(clipSector.startAngle, clipSector.endAngle, startAngle);
    return new SectorBox(
      Math.max(startAngle, clipAngles.startAngle),
      Math.min(endAngle, clipAngles.endAngle),
      Math.max(innerRadius, clipSector.innerRadius),
      Math.min(outerRadius, clipSector.outerRadius)
    );
  }
  getAngleOffset(radius) {
    return radius > 0 ? this.radialEdgeInset / radius : 0;
  }
  arc(r, angleSweep, a0, a1, outerArc, innerArc, start2, inner) {
    if (r <= 0)
      return;
    const { startAngle, endAngle } = clockwiseAngles(this.startAngle, this.endAngle);
    const { innerRadius, outerRadius } = this.normalizedRadii();
    const clipSector = this.normalizedClipSector();
    if (inner && innerRadius <= 0)
      return;
    const angleOffset = inner ? this.getAngleOffset(innerRadius + r) : this.getAngleOffset(outerRadius - r);
    const angle2 = start2 ? startAngle + angleOffset + angleSweep : endAngle - angleOffset - angleSweep;
    const radius = inner ? innerRadius + r : outerRadius - r;
    const cx = radius * Math.cos(angle2);
    const cy = radius * Math.sin(angle2);
    if (clipSector != null) {
      const delta3 = 1e-6;
      if (!start2 && !(angle2 >= startAngle - delta3 && angle2 <= clipSector.endAngle - delta3))
        return;
      if (start2 && !(angle2 >= clipSector.startAngle + delta3 && angle2 <= endAngle - delta3))
        return;
      if (inner && radius < clipSector.innerRadius - delta3)
        return;
      if (!inner && radius > clipSector.outerRadius + delta3)
        return;
    }
    const arc = new Arc2(cx, cy, r, a0, a1);
    if (clipSector != null) {
      if (inner) {
        arc.clipStart(arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.endAngle));
        arc.clipEnd(arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.startAngle));
      } else {
        arc.clipStart(arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.startAngle));
        arc.clipEnd(arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.endAngle));
      }
      let circleClipStart;
      let circleClipEnd;
      if (start2) {
        circleClipStart = arcCircleIntersectionAngle(cx, cy, r, a0, a1, clipSector.innerRadius);
        circleClipEnd = arcCircleIntersectionAngle(cx, cy, r, a0, a1, clipSector.outerRadius);
      } else {
        circleClipStart = arcCircleIntersectionAngle(cx, cy, r, a0, a1, clipSector.outerRadius);
        circleClipEnd = arcCircleIntersectionAngle(cx, cy, r, a0, a1, clipSector.innerRadius);
      }
      arc.clipStart(circleClipStart);
      arc.clipEnd(circleClipEnd);
      if (circleClipStart != null) {
        const { x: x2, y: y2 } = arc.pointAt(circleClipStart);
        const theta2 = clockwiseAngle(Math.atan2(y2, x2), startAngle);
        if (start2) {
          innerArc?.clipStart(theta2);
        } else {
          outerArc.clipEnd(theta2);
        }
      }
      if (circleClipEnd != null) {
        const { x: x2, y: y2 } = arc.pointAt(circleClipEnd);
        const theta2 = clockwiseAngle(Math.atan2(y2, x2), startAngle);
        if (start2) {
          outerArc.clipStart(theta2);
        } else {
          innerArc?.clipEnd(theta2);
        }
      }
    }
    if (clipSector != null) {
      const { x: x2, y: y2 } = arc.pointAt((arc.a0 + arc.a1) / 2);
      if (!isPointInSector(x2, y2, clipSector))
        return;
    }
    const { x, y } = arc.pointAt(start2 === inner ? arc.a0 : arc.a1);
    const theta = clockwiseAngle(Math.atan2(y, x), startAngle);
    const radialArc = inner ? innerArc : outerArc;
    if (start2) {
      radialArc?.clipStart(theta);
    } else {
      radialArc?.clipEnd(theta);
    }
    return arc;
  }
  updatePath() {
    const delta3 = 1e-6;
    const { path, centerX, centerY, concentricEdgeInset, radialEdgeInset } = this;
    let { startOuterCornerRadius, endOuterCornerRadius, startInnerCornerRadius, endInnerCornerRadius } = this;
    const { startAngle, endAngle } = clockwiseAngles(this.startAngle, this.endAngle);
    const { innerRadius, outerRadius } = this.normalizedRadii();
    const clipSector = this.normalizedClipSector();
    const sweepAngle = endAngle - startAngle;
    const fullPie = sweepAngle >= 2 * Math.PI - delta3;
    path.clear();
    const innerAngleOffset = this.getAngleOffset(innerRadius);
    const adjustedSweep = sweepAngle - 2 * innerAngleOffset;
    const radialLength = outerRadius - innerRadius;
    const innerCornerDistance = innerRadius > 0 && adjustedSweep > 0 ? 2 * innerRadius * Math.sin(adjustedSweep / 2) : 0;
    const outerCornerDistance = outerRadius > 0 && adjustedSweep > 0 ? 2 * outerRadius * Math.sin(adjustedSweep / 2) : 0;
    startOuterCornerRadius = Math.floor(
      Math.max(0, Math.min(startOuterCornerRadius, outerCornerDistance / 2, radialLength / 2))
    );
    endOuterCornerRadius = Math.floor(
      Math.max(0, Math.min(endOuterCornerRadius, outerCornerDistance / 2, radialLength / 2))
    );
    startInnerCornerRadius = Math.floor(
      Math.max(0, Math.min(startInnerCornerRadius, innerCornerDistance / 2, radialLength / 2))
    );
    endInnerCornerRadius = Math.floor(
      Math.max(0, Math.min(endInnerCornerRadius, innerCornerDistance / 2, radialLength / 2))
    );
    const isInvalid = innerRadius === 0 && outerRadius === 0 || innerRadius > outerRadius || innerCornerDistance < 0 || outerCornerDistance <= 0;
    if (isInvalid) {
      return;
    } else if ((clipSector?.startAngle ?? startAngle) === (clipSector?.endAngle ?? endAngle)) {
      return;
    } else if (fullPie && this.clipSector == null && startOuterCornerRadius === 0 && endOuterCornerRadius === 0 && startInnerCornerRadius === 0 && endInnerCornerRadius === 0) {
      path.moveTo(centerX + outerRadius * Math.cos(startAngle), centerY + outerRadius * Math.sin(startAngle));
      path.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      if (innerRadius > concentricEdgeInset) {
        path.moveTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
        path.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      }
      path.closePath();
      return;
    } else if (this.clipSector == null && Math.abs(innerRadius - outerRadius) < 1e-6) {
      path.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
      path.arc(centerX, centerY, outerRadius, endAngle, startAngle, true);
      path.closePath();
      return;
    }
    const outerAngleOffset = this.getAngleOffset(outerRadius);
    const outerAngleExceeded = sweepAngle < 2 * outerAngleOffset;
    if (outerAngleExceeded)
      return;
    const hasInnerSweep = (clipSector?.innerRadius ?? innerRadius) > concentricEdgeInset;
    const innerAngleExceeded = innerRadius < concentricEdgeInset || sweepAngle < 2 * innerAngleOffset;
    const maxRadialLength = Math.max(
      startOuterCornerRadius,
      startInnerCornerRadius,
      endOuterCornerRadius,
      endInnerCornerRadius
    );
    const initialScalingFactor = maxRadialLength > 0 ? Math.min(radialLength / maxRadialLength, 1) : 1;
    startOuterCornerRadius *= initialScalingFactor;
    endOuterCornerRadius *= initialScalingFactor;
    startInnerCornerRadius *= initialScalingFactor;
    endInnerCornerRadius *= initialScalingFactor;
    const outerScalingFactor = radiiScalingFactor(
      outerRadius,
      sweepAngle - 2 * outerAngleOffset,
      -startOuterCornerRadius,
      -endOuterCornerRadius
    );
    startOuterCornerRadius *= outerScalingFactor;
    endOuterCornerRadius *= outerScalingFactor;
    if (!innerAngleExceeded && hasInnerSweep) {
      const innerScalingFactor = radiiScalingFactor(
        innerRadius,
        sweepAngle - 2 * innerAngleOffset,
        startInnerCornerRadius,
        endInnerCornerRadius
      );
      startInnerCornerRadius *= innerScalingFactor;
      endInnerCornerRadius *= innerScalingFactor;
    } else {
      startInnerCornerRadius = 0;
      endInnerCornerRadius = 0;
    }
    const maxCombinedRadialLength = Math.max(
      startOuterCornerRadius + startInnerCornerRadius,
      endOuterCornerRadius + endInnerCornerRadius
    );
    const edgesScalingFactor = maxCombinedRadialLength > 0 ? Math.min(radialLength / maxCombinedRadialLength, 1) : 1;
    startOuterCornerRadius *= edgesScalingFactor;
    endOuterCornerRadius *= edgesScalingFactor;
    startInnerCornerRadius *= edgesScalingFactor;
    endInnerCornerRadius *= edgesScalingFactor;
    let startOuterCornerRadiusAngleSweep = 0;
    let endOuterCornerRadiusAngleSweep = 0;
    const startOuterCornerRadiusSweep = startOuterCornerRadius / (outerRadius - startOuterCornerRadius);
    const endOuterCornerRadiusSweep = endOuterCornerRadius / (outerRadius - endOuterCornerRadius);
    if (startOuterCornerRadiusSweep >= 0 && startOuterCornerRadiusSweep < 1 - delta3) {
      startOuterCornerRadiusAngleSweep = Math.asin(startOuterCornerRadiusSweep);
    } else {
      startOuterCornerRadiusAngleSweep = sweepAngle / 2;
      const maxStartOuterCornerRadius = outerRadius / (1 / Math.sin(startOuterCornerRadiusAngleSweep) + 1);
      startOuterCornerRadius = Math.min(maxStartOuterCornerRadius, startOuterCornerRadius);
    }
    if (endOuterCornerRadiusSweep >= 0 && endOuterCornerRadiusSweep < 1 - delta3) {
      endOuterCornerRadiusAngleSweep = Math.asin(endOuterCornerRadiusSweep);
    } else {
      endOuterCornerRadiusAngleSweep = sweepAngle / 2;
      const maxEndOuterCornerRadius = outerRadius / (1 / Math.sin(endOuterCornerRadiusAngleSweep) + 1);
      endOuterCornerRadius = Math.min(maxEndOuterCornerRadius, endOuterCornerRadius);
    }
    const startInnerCornerRadiusAngleSweep = Math.asin(
      startInnerCornerRadius / (innerRadius + startInnerCornerRadius)
    );
    const endInnerCornerRadiusAngleSweep = Math.asin(endInnerCornerRadius / (innerRadius + endInnerCornerRadius));
    const outerArcRadius = clipSector?.outerRadius ?? outerRadius;
    const outerArcRadiusOffset = this.getAngleOffset(outerArcRadius);
    const outerArc = new Arc2(
      0,
      0,
      outerArcRadius,
      startAngle + outerArcRadiusOffset,
      endAngle - outerArcRadiusOffset
    );
    const innerArcRadius = clipSector?.innerRadius ?? innerRadius;
    const innerArcRadiusOffset = this.getAngleOffset(innerArcRadius);
    const innerArc = hasInnerSweep ? new Arc2(0, 0, innerArcRadius, startAngle + innerArcRadiusOffset, endAngle - innerArcRadiusOffset) : void 0;
    if (clipSector != null) {
      outerArc.clipStart(clipSector.startAngle);
      outerArc.clipEnd(clipSector.endAngle);
      innerArc?.clipStart(clipSector.startAngle);
      innerArc?.clipEnd(clipSector.endAngle);
    }
    const startOuterArc = this.arc(
      startOuterCornerRadius,
      startOuterCornerRadiusAngleSweep,
      startAngle - Math.PI * 0.5,
      startAngle + startOuterCornerRadiusAngleSweep,
      outerArc,
      innerArc,
      true,
      false
    );
    const endOuterArc = this.arc(
      endOuterCornerRadius,
      endOuterCornerRadiusAngleSweep,
      endAngle - endOuterCornerRadiusAngleSweep,
      endAngle + Math.PI * 0.5,
      outerArc,
      innerArc,
      false,
      false
    );
    const endInnerArc = this.arc(
      endInnerCornerRadius,
      endInnerCornerRadiusAngleSweep,
      endAngle + Math.PI * 0.5,
      endAngle + Math.PI - endInnerCornerRadiusAngleSweep,
      outerArc,
      innerArc,
      false,
      true
    );
    const startInnerArc = this.arc(
      startInnerCornerRadius,
      startInnerCornerRadiusAngleSweep,
      startAngle + Math.PI + startInnerCornerRadiusAngleSweep,
      startAngle + Math.PI * 1.5,
      outerArc,
      innerArc,
      true,
      true
    );
    if (innerAngleExceeded && hasInnerSweep) {
    } else if (innerAngleExceeded) {
      const x = sweepAngle < Math.PI * 0.5 ? radialEdgeInset * (1 + Math.cos(sweepAngle)) / Math.sin(sweepAngle) : Number.NaN;
      let r;
      if (x > 0 && x < outerRadius) {
        r = Math.max(Math.hypot(radialEdgeInset, x), innerRadius);
      } else {
        r = radialEdgeInset;
      }
      r = Math.max(r, innerRadius);
      const midAngle = startAngle + sweepAngle * 0.5;
      path.moveTo(centerX + r * Math.cos(midAngle), centerY + r * Math.sin(midAngle));
    } else if (startInnerArc?.isValid() === true || innerArc?.isValid() === true) {
    } else {
      const midAngle = startAngle + sweepAngle / 2;
      const cx = innerRadius * Math.cos(midAngle);
      const cy = innerRadius * Math.sin(midAngle);
      path.moveTo(centerX + cx, centerY + cy);
    }
    if (startOuterArc?.isValid() === true) {
      const { cx, cy, r, a0, a1 } = startOuterArc;
      path.arc(centerX + cx, centerY + cy, r, a0, a1);
    }
    if (outerArc.isValid()) {
      const { r, a0, a1 } = outerArc;
      path.arc(centerX, centerY, r, a0, a1);
    }
    if (endOuterArc?.isValid() === true) {
      const { cx, cy, r, a0, a1 } = endOuterArc;
      path.arc(centerX + cx, centerY + cy, r, a0, a1);
    }
    if (!innerAngleExceeded) {
      if (endInnerArc?.isValid() === true) {
        const { cx, cy, r, a0, a1 } = endInnerArc;
        path.arc(centerX + cx, centerY + cy, r, a0, a1);
      }
      if (innerArc?.isValid() === true) {
        const { r, a0, a1 } = innerArc;
        path.arc(centerX, centerY, r, a1, a0, true);
      }
      if (startInnerArc?.isValid() === true) {
        const { cx, cy, r, a0, a1 } = startInnerArc;
        path.arc(centerX + cx, centerY + cy, r, a0, a1);
      }
    }
    path.closePath();
  }
  isPointInPath(x, y) {
    const { startAngle, endAngle, innerRadius, outerRadius } = this.clipSector ?? this;
    return isPointInSector(x - this.centerX, y - this.centerY, {
      startAngle,
      endAngle,
      innerRadius: Math.min(innerRadius, outerRadius),
      outerRadius: Math.max(innerRadius, outerRadius)
    });
  }
}; _c$20.className = "Sector"; __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "centerX", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "centerY", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "innerRadius", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "outerRadius", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "startAngle", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "endAngle", 2); __decorateClass([
  SceneObjectChangeDetection({ equals: (lhs, rhs) => lhs.equals(rhs) })
], _c$20.prototype, "clipSector", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "concentricEdgeInset", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "radialEdgeInset", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "startOuterCornerRadius", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "endOuterCornerRadius", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "startInnerCornerRadius", 2); __decorateClass([
  SceneChangeDetection()
], _c$20.prototype, "endInnerCornerRadius", 2); return _c$20; })()

// packages/ag-charts-core/src/scene/shape/text.ts
var _Text = /*#__PURE__*/ (() => { var _c$21 = class _Text extends Shape {
  constructor(options) {
    super(options);
    this.generatingTextMap = false;
    this.suppressedDirtyDuringGenerate = false;
    this.x = 0;
    this.y = 0;
    this.lines = [];
    this.text = void 0;
    this.fontCache = void 0;
    this.fontSize = _Text.defaultFontSize;
    this.fontFamily = "sans-serif";
    this.textAlign = "start";
    this.textBaseline = "alphabetic";
    this.boxPadding = 0;
    this.trimText = options?.trimText ?? true;
  }
  serialize() {
    return { type: "text", props: this.serializeProps() };
  }
  serializeProps() {
    return {
      ...super.serializeProps(),
      x: this.x,
      y: this.y,
      text: this.text == null ? void 0 : String(this.text)
    };
  }
  onTextChange() {
    this.richText?.clear();
    this.textMap?.clear();
    this.segmentMetrics = void 0;
    this.directed = void 0;
    if (isArray(this.text)) {
      this.lines = [];
      this.richText ?? (this.richText = new Group());
      this.richText.parentNode = this;
      this.richText.setScene(this.scene);
      const children = [];
      for (const segment of this.text) {
        if (segment.type === "image") {
          children.push(new ImageSegmentNode());
        } else {
          for (const line of toTextString(segment.text).split(LineSplitter)) {
            if (line !== "")
              children.push(new _Text({ trimText: false }));
          }
        }
      }
      this.richText.append(children);
    } else {
      if (this.richText) {
        this.richText.parentNode = void 0;
        this.richText.setScene();
        this.richText = void 0;
      }
      const lines = toTextString(this.text).split(LineSplitter);
      this.lines = this.trimText ? lines.map((line) => line.trim()) : lines;
    }
  }
  get font() {
    this.fontCache ?? (this.fontCache = toFontString(this));
    return this.fontCache;
  }
  resolveFont() {
    if (!this.hasRenderableText())
      return void 0;
    return this.font;
  }
  static measureBBox(text, x, y, options) {
    if (isArray(text)) {
      const { font, lineHeight, textAlign: textAlign2, textBaseline } = options;
      const { width: width2, height: height2, lineMetrics } = measureTextSegments(text, font);
      const totalHeight = lineHeight == null || lineHeight === 0 || Number.isNaN(lineHeight) ? height2 : lineHeight * lineMetrics.length;
      const offsetTop = _Text.calcTopOffset(totalHeight, lineMetrics[0], textBaseline);
      const offsetLeft = _Text.calcLeftOffset(width2, textAlign2);
      return new BBox(x - offsetLeft, y - offsetTop, width2, totalHeight);
    } else {
      return _Text.computeBBox(toTextString(text).split(LineSplitter), x, y, options);
    }
  }
  static computeBBox(lines, x, y, opts) {
    const { font, lineHeight, textAlign: textAlign2, textBaseline, isRtl } = opts;
    const { width: width2, height: height2, lineMetrics } = cachedTextMeasurer(font).measureLines(lines);
    const totalHeight = lineHeight == null || lineHeight === 0 || Number.isNaN(lineHeight) ? height2 : lineHeight * lineMetrics.length;
    const offsetTop = _Text.calcTopOffset(totalHeight, lineMetrics[0], textBaseline);
    const offsetLeft = _Text.calcLeftOffset(width2, textAlign2, isRtl);
    return new BBox(x - offsetLeft, y - offsetTop, width2, totalHeight);
  }
  static calcTopOffset(height2, textMetrics, textBaseline) {
    switch (textBaseline) {
      case "alphabetic":
        return textMetrics?.ascent ?? 0;
      case "middle":
        return height2 / 2;
      case "bottom":
        return height2;
      default:
        return 0;
    }
  }
  static calcSegmentedTopOffset(height2, lineMetrics, textBaseline) {
    switch (textBaseline) {
      case "alphabetic":
        return lineMetrics[0]?.ascent ?? 0;
      case "middle": {
        const line = lineMetrics[0];
        const isPureTextLine = lineMetrics.length === 1 && line.segments.length > 0 && (line.blockImages?.length ?? 0) === 0 && line.segments.every((s) => s.type !== "image");
        if (isPureTextLine) {
          return line.ascent + line.segments.reduce(
            (offsetY, segment) => segment.type === "image" ? offsetY : Math.min(offsetY, cachedTextMeasurer(segment).baselineDistance("middle")),
            0
          );
        }
        return height2 / 2;
      }
      case "bottom":
        return height2;
      default:
        return 0;
    }
  }
  static calcLeftOffset(width2, textAlign2, isRtl) {
    switch (textAlign2 == null ? void 0 : resolveTextAlign(textAlign2, isRtl)) {
      case "center":
        return width2 * 0.5;
      case "right":
        return width2;
      default:
        return 0;
    }
  }
  computeBBox() {
    return this.computeTextBBox();
  }
  // Untransformed glyph box; must bypass the computeBBox override so getTextMeasureBBox never folds
  // in the node's own rotation/translation.
  computeTextBBox() {
    if (!this.hasRenderableText()) {
      return new BBox(this.x, this.y, 0, 0);
    }
    this.generateTextMap();
    if (this.textMap != null && this.textMap.size > 0 && isArray(this.text)) {
      const bbox = BBox.merge(this.textMap.values());
      const { height: height2, lineMetrics } = this.getSegmentMetrics(this.text);
      bbox.x = this.x - _Text.calcLeftOffset(bbox.width, this.textAlign, this.scene?.isRtl);
      bbox.y = this.y - _Text.calcSegmentedTopOffset(height2, lineMetrics, this.textBaseline);
      if (this.boxing != null)
        bbox.grow(this.boxPadding);
      return bbox;
    }
    const isRtl = this.scene?.isRtl;
    const { x, y, lines, textBaseline, textAlign: textAlign2 } = this;
    const measuredTextBounds = _Text.computeBBox(lines, x, y, { font: this, textBaseline, textAlign: textAlign2, isRtl });
    if (this.boxing != null)
      measuredTextBounds.grow(this.boxPadding);
    return measuredTextBounds;
  }
  getTextMeasureBBox() {
    return this.computeTextBBox();
  }
  /**
   * One box per rendered line, together covering {@link getBBox}. A label fitted to a shape rather than
   * to a rectangle overhangs its own bounding box by construction, so containment has to be judged line
   * by line — the block box answers a question the text never asked.
   */
  getLineBoxes() {
    const bbox = this.getBBox();
    const { lineMetrics } = isArray(this.text) ? this.getSegmentMetrics(this.text) : cachedTextMeasurer(this).measureLines(this.lines);
    if (lineMetrics.length <= 1)
      return [bbox];
    const padding2 = this.boxing == null ? void 0 : resolvePadding(this.boxPadding);
    const isRtl = this.scene?.isRtl;
    const last = lineMetrics.length - 1;
    let top = bbox.y + (padding2?.top ?? 0);
    return lineMetrics.map((line, index) => {
      const box = new BBox(
        this.x - _Text.calcLeftOffset(line.width, this.textAlign, isRtl),
        top,
        line.width,
        line.height
      );
      top += line.height;
      if (padding2 != null) {
        box.grow({
          left: padding2.left,
          right: padding2.right,
          top: index === 0 ? padding2.top : 0,
          bottom: index === last ? padding2.bottom : 0
        });
      }
      return box;
    });
  }
  getPlainText() {
    return toPlainText(this.text);
  }
  isPointInPath(x, y) {
    return this.getBBox()?.containsPoint(x, y) ?? false;
  }
  setScene(scene) {
    this.richText?.setScene(scene);
    super.setScene(scene);
  }
  generateTextMap() {
    if (!isArray(this.text) || (this.textMap?.size ?? 0) > 0)
      return;
    this.textMap ?? (this.textMap = /* @__PURE__ */ new Map());
    this.generatingTextMap = true;
    this.suppressedDirtyDuringGenerate = false;
    try {
      this.buildTextMap(this.text);
    } finally {
      this.generatingTextMap = false;
      if (this.suppressedDirtyDuringGenerate) {
        this.suppressedDirtyDuringGenerate = false;
        super.markDirty();
      }
    }
  }
  getSegmentMetrics(text) {
    this.segmentMetrics ?? (this.segmentMetrics = measureTextSegments(text, this));
    return this.segmentMetrics;
  }
  buildTextMap(text) {
    const childNodes = this.richText.children();
    const { width: totalWidth, lineMetrics } = this.getSegmentMetrics(text);
    const labelLeft = this.x - totalWidth / 2;
    let offsetY = 0;
    for (let lineIndex = 0; lineIndex < lineMetrics.length; ) {
      const line = lineMetrics[lineIndex];
      if ((line.blockImages?.length ?? 0) > 0) {
        const span = line.blockRowSpan ?? 1;
        const nextOffsetY = this.layoutBlockRow(lineMetrics, lineIndex, span, offsetY, labelLeft, childNodes);
        if (nextOffsetY == null)
          return;
        offsetY = nextOffsetY;
        lineIndex += span;
        continue;
      }
      offsetY = this.renderLine(line, this.x - line.width / 2, offsetY, childNodes);
      lineIndex += 1;
    }
  }
  // Lays out a block-image row: image strip at `labelLeft`, text column to its right. Returns null
  // if the child-node supply diverged from the line metrics, so the caller abandons the map.
  layoutBlockRow(lineMetrics, lineIndex, span, offsetY, labelLeft, childNodes) {
    const strip = lineMetrics[lineIndex].blockImages;
    const stripWidth = blockStripWidth(strip);
    const stripHeight = blockStripHeight(strip);
    let innerColHeight = 0;
    for (let k = 0; k < span; k++) {
      innerColHeight += lineMetrics[lineIndex + k].height;
    }
    const rowHeight = Math.max(stripHeight, innerColHeight);
    let stripX = labelLeft;
    for (let s = 0; s < strip.length; s++) {
      const blockSeg = strip[s];
      const blockBox = blockSeg.textMetrics;
      const imageAlign = toCanvasTextBaseline(blockSeg.verticalAlign) ?? "middle";
      const imageOffset = _Text.calcAnchoredOffset(imageAlign, rowHeight, blockBox.height);
      const imageChild = childNodes.next().value;
      if (!imageChild) {
        this.abandonTextMap();
        return null;
      }
      _Text.applyImageSegment(imageChild, blockSeg, stripX, offsetY + imageOffset);
      this.textMap.set(imageChild, imageChild.getBBox());
      stripX += blockBox.width + (s < strip.length - 1 ? BLOCK_IMAGE_SPACING : 0);
    }
    const firstTextSegment = _Text.findFirstTextSegment(lineMetrics, lineIndex, span);
    const columnLeft = labelLeft + stripWidth + BLOCK_IMAGE_SPACING;
    let innerOffsetY = offsetY + _Text.calcAnchoredOffset(
      toCanvasTextBaseline(firstTextSegment?.verticalAlign) ?? "alphabetic",
      rowHeight,
      innerColHeight
    );
    for (let k = 0; k < span; k++) {
      innerOffsetY = this.renderLine(lineMetrics[lineIndex + k], columnLeft, innerOffsetY, childNodes);
    }
    return offsetY + rowHeight;
  }
  static findFirstTextSegment(lineMetrics, startIndex, span) {
    for (let k = 0; k < span; k++) {
      const seg = lineMetrics[startIndex + k].segments.find((s) => s.type !== "image");
      if (seg)
        return seg;
    }
    return void 0;
  }
  renderLine(line, lineLeft, offsetY, childNodes) {
    const { height: height2, ascent, textAscent, textDescent, segments } = line;
    const baseline = offsetY + ascent;
    let offsetX = 0;
    for (const measured of segments) {
      const node = childNodes.next().value;
      if (!node) {
        this.abandonTextMap();
        return offsetY + height2;
      }
      if (measured.type === "image") {
        const boxWidth = measured.textMetrics.width;
        const boxHeight = measured.textMetrics.height;
        const { above } = imageBoxAroundBaseline(
          toCanvasTextBaseline(measured.verticalAlign),
          boxHeight,
          textAscent,
          textDescent
        );
        const imageNode = node;
        _Text.applyImageSegment(imageNode, measured, lineLeft + offsetX, baseline - above);
        this.textMap.set(imageNode, imageNode.getBBox());
        offsetX += boxWidth;
        continue;
      }
      const { color: color2, textMetrics, verticalAlign: verticalAlign2, ...segment } = measured;
      const textNode = node;
      const segmentBaseline = toCanvasTextBaseline(verticalAlign2) ?? "alphabetic";
      textNode.x = lineLeft + offsetX;
      textNode.y = _Text.calcSegmentY(segmentBaseline, offsetY, ascent, height2);
      textNode.setProperties({ ...segment, textBaseline: segmentBaseline, fill: color2 ?? this.fill });
      const textBBox = textNode.getBBox();
      this.textMap.set(textNode, textBBox);
      offsetX += textMetrics.width;
    }
    return offsetY + height2;
  }
  abandonTextMap() {
    this.textMap?.clear();
    this.segmentMetrics = void 0;
  }
  // Anchor a child of `childHeight` inside a container of `totalHeight` according to verticalAlign.
  static calcAnchoredOffset(verticalAlign2, totalHeight, childHeight) {
    const slack = Math.max(0, totalHeight - childHeight);
    switch (verticalAlign2) {
      case "middle":
        return slack / 2;
      case "bottom":
      case "ideographic":
      case "alphabetic":
        return slack;
      case "top":
      case "hanging":
      default:
        return 0;
    }
  }
  static applyImageSegment(node, segment, x, y) {
    const { top, right, bottom, left } = resolvePadding(segment.padding);
    node.x = x;
    node.y = y;
    node.boxWidth = segment.textMetrics.width;
    node.boxHeight = segment.textMetrics.height;
    node.imageWidth = segment.width;
    node.imageHeight = segment.height;
    node.paddingTop = top;
    node.paddingRight = right;
    node.paddingBottom = bottom;
    node.paddingLeft = left;
    node.cornerRadius = segment.cornerRadius ?? 0;
    node.backgroundFill = segment.backgroundFill;
    node.url = segment.url;
  }
  static calcSegmentY(verticalAlign2, lineTop, ascent, height2) {
    switch (verticalAlign2) {
      case "top":
      case "hanging":
        return lineTop;
      case "middle":
        return lineTop + height2 / 2;
      case "bottom":
      case "ideographic":
        return lineTop + height2;
      case "alphabetic":
      default:
        return lineTop + ascent;
    }
  }
  render(renderCtx) {
    const { ctx, stats } = renderCtx;
    if (!this.layerManager || !this.hasRenderableText()) {
      if (stats)
        stats.nodesSkipped += 1;
      return;
    }
    if (isArray(this.text) && this.richText) {
      this.generateTextMap();
      const richTextBBox = this.richText.getBBox();
      const { width: width2, height: height2, lineMetrics } = this.getSegmentMetrics(this.text);
      let translateX = 0;
      switch (resolveTextAlign(this.textAlign, renderCtx.direction === "rtl")) {
        case "left":
          translateX = width2 / 2;
          break;
        case "right":
          translateX = width2 / -2;
      }
      const translateY = this.y - _Text.calcSegmentedTopOffset(height2, lineMetrics, this.textBaseline);
      this.renderBoxing(renderCtx, richTextBBox.clone().translate(translateX, translateY));
      ctx.save();
      ctx.translate(translateX, translateY);
      this.richText.opacity = this.opacity;
      this.richText.render(renderCtx);
      ctx.restore();
    } else {
      this.renderText(renderCtx);
    }
    if (_Text.debug.check()) {
      const bbox = this.getBBox();
      ctx.lineWidth = (this.textMap?.size ?? 0) > 0 ? 2 : 1;
      ctx.strokeStyle = (this.textMap?.size ?? 0) > 0 ? "blue" : "red";
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
    }
    super.render(renderCtx);
  }
  markDirty(property) {
    if (this.generatingTextMap) {
      this.suppressedDirtyDuringGenerate = true;
      return;
    }
    this.textMap?.clear();
    this.segmentMetrics = void 0;
    return super.markDirty(property);
  }
  // A number beside RTL text reorders to `5-` whatever the paragraph direction, since the sign is
  // neutral and binds to the RTL run. `direction` is the line's own reading order, not the scene's.
  resolveDirected() {
    this.directed ?? (this.directed = this.lines.every(isDirectionNeutral) ? { direction: "ltr", lines: this.lines } : { direction: "rtl", lines: this.lines.map(forceLtrNumbers) });
    return this.directed;
  }
  renderText(renderCtx) {
    const { fill, stroke, strokeWidth, font, textAlign: textAlign2 } = this;
    const hasFill = fill != null && fill !== "";
    const hasStroke = stroke != null && stroke !== "" && strokeWidth > 0;
    if (!hasFill && !hasStroke || !this.layerManager) {
      return super.render(renderCtx);
    }
    const { ctx } = renderCtx;
    if (renderCtx.currentFont !== font) {
      ctx.font = font;
      renderCtx.currentFont = font;
    }
    const isRtl = renderCtx.direction === "rtl";
    const direction = isRtl ? this.resolveDirected().direction : "ltr";
    if (ctx.direction !== direction) {
      ctx.direction = direction;
    }
    ctx.textAlign = resolveTextAlign(textAlign2, isRtl);
    this.renderBoxing(renderCtx);
    this.fillStroke(ctx, renderCtx.logger);
  }
  renderBoxing(renderCtx, bbox) {
    if (!this.boxing)
      return;
    const textBBox = bbox ?? _Text.computeBBox(this.lines, this.x, this.y, {
      font: this,
      lineHeight: this.lineHeight,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
      isRtl: renderCtx.direction === "rtl"
    });
    if (textBBox.width === 0 || textBBox.height === 0)
      return;
    const { x, y, width: width2, height: height2 } = textBBox.grow(this.boxPadding);
    this.boxing.opacity = this.opacity;
    this.boxing.x = x;
    this.boxing.y = y;
    this.boxing.width = width2;
    this.boxing.height = height2;
    this.boxing.preRender(renderCtx);
    this.boxing.render(renderCtx);
  }
  executeFill(ctx) {
    this.renderLines((line, x, y) => ctx.fillText(line, x, y));
  }
  executeStroke(ctx) {
    this.renderLines((line, x, y) => ctx.strokeText(line, x, y));
  }
  renderLines(renderCallback) {
    const { x, y, lines } = this;
    if (!Number.isFinite(x) || !Number.isFinite(y))
      return;
    const measurer = cachedTextMeasurer(this);
    const { lineMetrics } = measurer.measureLines(lines);
    const { textBaseline, lineHeight = measurer.lineHeight() } = this;
    let offsetY = 0;
    if (textBaseline === "top") {
      offsetY = lineMetrics[0].ascent;
    } else if (textBaseline === "middle" || textBaseline === "bottom") {
      offsetY = lineHeight * (1 - lines.length);
      if (textBaseline === "middle") {
        offsetY /= 2;
        offsetY -= measurer.baselineDistance(textBaseline);
      } else {
        offsetY -= lineMetrics[0].descent;
      }
    }
    const directedLines = this.resolveDirected().lines;
    for (let i = 0; i < lineMetrics.length; i += 1) {
      renderCallback(directedLines?.[i] ?? lineMetrics[i].text, x, y + offsetY);
      offsetY += lineHeight;
    }
  }
  setFont(props) {
    this.fontFamily = props.fontFamily;
    this.fontSize = props.fontSize;
    this.fontStyle = props.fontStyle;
    this.fontWeight = props.fontWeight;
  }
  setAlign(props) {
    this.textAlign = props.textAlign;
    this.textBaseline = props.textBaseline;
  }
  setBoxing(props) {
    const stroke = props.border?.enabled ? props.border?.stroke : void 0;
    if (props.fill != null || stroke != null) {
      this.boxing ?? (this.boxing = new Rect({ scene: this.scene }));
      this.boxing.fill = props.fill;
      this.boxing.fillOpacity = props.fillOpacity ?? 1;
      this.boxing.cornerRadius = props.cornerRadius ?? 0;
      this.boxing.stroke = stroke;
      this.boxing.strokeWidth = props.border?.strokeWidth ?? 0;
      this.boxing.strokeOpacity = props.border?.strokeOpacity ?? 1;
      this.boxPadding = props.padding ?? 0;
    } else if (this.boxing) {
      this.boxing.destroy();
      this.boxing = void 0;
    }
  }
  hasBoxing() {
    return this.boxing != null;
  }
  getBoxingProperties() {
    const { fill, fillOpacity, cornerRadius, stroke, strokeWidth, strokeOpacity } = this.boxing ?? {};
    return {
      border: { enabled: stroke != null, stroke, strokeWidth, strokeOpacity },
      cornerRadius,
      fill,
      fillOpacity,
      padding: this.boxPadding
    };
  }
  toSVG() {
    if (!this.visible || !this.hasRenderableText())
      return;
    const text = this.text;
    if (text == null)
      return;
    const element2 = createSvgElement("text");
    if (isArray(text)) {
      for (const segment of text) {
        if (segment.type === "image") {
          warnOnce("SVG export drops inline image segments; text content is preserved.");
          continue;
        }
        const segmentElement = createSvgElement("tspan");
        setSvgFontAttributes(segmentElement, {
          fontSize: segment.fontSize ?? this.fontSize,
          fontFamily: segment.fontFamily ?? this.fontFamily,
          fontWeight: segment.fontWeight ?? this.fontWeight,
          fontStyle: segment.fontStyle ?? this.fontStyle
        });
        this.applySvgFillAttributes(segmentElement);
        segmentElement.textContent = toTextString(segment.text);
        element2.append(segmentElement);
      }
    } else {
      this.applySvgFillAttributes(element2);
      setSvgFontAttributes(element2, this);
      element2.setAttribute(
        "text-anchor",
        {
          center: "middle",
          left: "start",
          right: "end",
          start: "start",
          end: "end"
        }[this.textAlign ?? "start"]
      );
      element2.setAttribute("alignment-baseline", this.textBaseline);
      element2.setAttribute("x", String(this.x));
      element2.setAttribute("y", String(this.y));
      element2.textContent = toTextString(text);
    }
    return { elements: [element2] };
  }
  hasRenderableText() {
    const { text } = this;
    if (text == null) {
      return false;
    }
    return isArray(text) ? text.length > 0 : toTextString(text) !== "";
  }
}; _c$21.className = "Text"; _c$21.debug = create(true, "scene:text" /* SCENE_TEXT */); _c$21.defaultFontSize = 10; __decorateClass([
  SceneChangeDetection()
], _c$21.prototype, "x", 2); __decorateClass([
  SceneChangeDetection()
], _c$21.prototype, "y", 2); __decorateClass([
  SceneRefChangeDetection({
    changeCb: (o) => o.onTextChange()
  })
], _c$21.prototype, "text", 2); __decorateClass([
  SceneChangeDetection({
    changeCb: (o) => {
      o.fontCache = void 0;
    }
  })
], _c$21.prototype, "fontStyle", 2); __decorateClass([
  SceneChangeDetection({
    changeCb: (o) => {
      o.fontCache = void 0;
    }
  })
], _c$21.prototype, "fontWeight", 2); __decorateClass([
  SceneChangeDetection({
    changeCb: (o) => {
      o.fontCache = void 0;
    }
  })
], _c$21.prototype, "fontSize", 2); __decorateClass([
  SceneChangeDetection({
    changeCb: (o) => {
      o.fontCache = void 0;
    }
  })
], _c$21.prototype, "fontFamily", 2); __decorateClass([
  SceneChangeDetection()
], _c$21.prototype, "textAlign", 2); __decorateClass([
  SceneChangeDetection()
], _c$21.prototype, "textBaseline", 2); __decorateClass([
  SceneChangeDetection()
], _c$21.prototype, "lineHeight", 2); return _c$21; })()
var Text = _Text;
var RotatableText = /*#__PURE__*/ Rotatable(Text);
var TransformableText = /*#__PURE__*/ Rotatable(Translatable(Text));

// packages/ag-charts-core/src/scene/util/quadtree.ts
var QuadtreeNearest = class {
  constructor(capacity, maxdepth, boundary) {
    this.root = new QuadtreeNodeNearest(capacity, maxdepth, boundary);
  }
  clear(boundary) {
    this.root.clear(boundary);
  }
  addValue(hitTester, value) {
    const elem = {
      hitTester,
      value,
      distanceSquared: (x, y) => {
        return hitTester.distanceSquared(x, y);
      }
    };
    this.root.addElem(elem);
  }
  find(x, y) {
    const arg = { best: { nearest: void 0, distanceSquared: Infinity } };
    this.root.find(x, y, arg);
    return arg.best;
  }
};
var QuadtreeSubdivisions = class {
  constructor(nw, ne, sw, se) {
    this.nw = nw;
    this.ne = ne;
    this.sw = sw;
    this.se = se;
  }
  addElem(elem) {
    this.nw.addElem(elem);
    this.ne.addElem(elem);
    this.sw.addElem(elem);
    this.se.addElem(elem);
  }
  find(x, y, arg) {
    this.nw.find(x, y, arg);
    this.ne.find(x, y, arg);
    this.sw.find(x, y, arg);
    this.se.find(x, y, arg);
  }
};
var QuadtreeNode = class {
  constructor(capacity, maxdepth, boundary) {
    this.capacity = capacity;
    this.maxdepth = maxdepth;
    this.boundary = boundary ?? BBox.NaN;
    this.elems = [];
    this.subdivisions = void 0;
  }
  clear(boundary) {
    this.elems.length = 0;
    this.boundary = boundary;
    this.subdivisions = void 0;
  }
  addElem(e) {
    if (this.addCondition(e)) {
      if (this.subdivisions === void 0) {
        if (this.maxdepth === 0 || this.elems.length < this.capacity) {
          this.elems.push(e);
        } else {
          this.subdivide(e);
        }
      } else {
        this.subdivisions.addElem(e);
      }
    }
  }
  find(x, y, arg) {
    if (this.findCondition(x, y, arg)) {
      if (this.subdivisions === void 0) {
        this.findAction(x, y, arg);
      } else {
        this.subdivisions.find(x, y, arg);
      }
    }
  }
  subdivide(newElem) {
    this.subdivisions = this.makeSubdivisions();
    for (const e of this.elems) {
      this.subdivisions.addElem(e);
    }
    this.subdivisions.addElem(newElem);
    this.elems.length = 0;
  }
  makeSubdivisions() {
    const { x, y, width: width2, height: height2 } = this.boundary;
    const { capacity } = this;
    const depth = this.maxdepth - 1;
    const halfWidth = width2 / 2;
    const halfHeight = height2 / 2;
    const nwBoundary = new BBox(x, y, halfWidth, halfHeight);
    const neBoundary = new BBox(x + halfWidth, y, halfWidth, halfHeight);
    const swBoundary = new BBox(x, y + halfHeight, halfWidth, halfHeight);
    const seBoundary = new BBox(x + halfWidth, y + halfHeight, halfWidth, halfHeight);
    return new QuadtreeSubdivisions(
      this.child(capacity, depth, nwBoundary),
      this.child(capacity, depth, neBoundary),
      this.child(capacity, depth, swBoundary),
      this.child(capacity, depth, seBoundary)
    );
  }
};
var QuadtreeNodeNearest = class _QuadtreeNodeNearest extends QuadtreeNode {
  addCondition(e) {
    const { x, y } = e.hitTester.midPoint;
    return this.boundary.containsPoint(x, y);
  }
  findCondition(x, y, arg) {
    const { best } = arg;
    return best.distanceSquared !== 0 && this.boundary.distanceSquared(x, y) < best.distanceSquared;
  }
  findAction(x, y, arg) {
    const other = nearestSquared(x, y, this.elems, arg.best.distanceSquared);
    if (other.nearest !== void 0 && other.distanceSquared < arg.best.distanceSquared) {
      arg.best = other;
    }
  }
  child(capacity, depth, boundary) {
    return new _QuadtreeNodeNearest(capacity, depth, boundary);
  }
};

// packages/ag-charts-core/src/rendering/configuredCanvasMixin.ts
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;
var CANVAS_TO_BUFFER_DEFAULTS = { quality: 1 };
function ConfiguredCanvasMixin(Base) {
  const ConfiguredCanvasClass = class ConfiguredCanvas extends Base {
    constructor(...args) {
      super(...args);
      this.gpu = false;
    }
    toBuffer(format, options) {
      return super.toBuffer(format, { ...options, msaa: false });
    }
    transferToImageBitmap() {
      const { width: width2, height: height2 } = this;
      const bitmap = new ConfiguredCanvasClass(Math.max(1, width2), Math.max(1, height2));
      if (width2 > 0 && height2 > 0) {
        bitmap.getContext("2d").drawCanvas(this, 0, 0, width2, height2);
      }
      Object.defineProperty(bitmap, "close", {
        value: () => {
        }
      });
      return bitmap;
    }
  };
  return ConfiguredCanvasClass;
}
var patchesApplied = false;
function applySkiaPatches(CanvasRenderingContext2D, DOMMatrix) {
  if (patchesApplied)
    return;
  patchesApplied = true;
  Object.defineProperty(CanvasRenderingContext2D.prototype, "fillText", {
    value: function(text, x, y) {
      let path2d = this.outlineText(text);
      path2d = path2d.transform(new DOMMatrix([1, 0, 0, 1, x, y]));
      this.fill(path2d);
    },
    writable: true,
    configurable: true
  });
}

// packages/ag-charts-core/src/rendering/easing.ts
var linear = (n) => n;
var easeIn = (n) => 1 - Math.cos(n * Math.PI / 2);
var easeOut = (n) => Math.sin(n * Math.PI / 2);
var easeInOut = (n) => -(Math.cos(n * Math.PI) - 1) / 2;
var easeInQuad = (n) => n * n;
var easeOutQuad = (n) => 1 - (1 - n) ** 2;
var easeInOutQuad = (n) => n < 0.5 ? 2 * n * n : 1 - (-2 * n + 2) ** 2 / 2;
var inverseEaseOut = (x) => 2 * Math.asin(x) / Math.PI;

// packages/ag-charts-core/src/rendering/interpolate.ts
function interpolateNumber(a, b) {
  return (d) => Number(a) * (1 - d) + Number(b) * d;
}
function interpolateColor(a, b) {
  if (typeof a === "string") {
    try {
      a = Color.fromString(a);
    } catch {
      a = Color.fromArray([0, 0, 0]);
    }
  }
  if (typeof b === "string") {
    try {
      b = Color.fromString(b);
    } catch {
      b = Color.fromArray([0, 0, 0]);
    }
  }
  return (d) => Color.mix(a, b, d).toRgbaString();
}

// packages/ag-charts-core/src/rendering/render.ts
function debouncedAnimationFrame(agDocument, cb) {
  function scheduleWithAnimationFrame(innerCb, _delayMs) {
    return agDocument.requestAnimationFrame(innerCb);
  }
  function cancelWithAnimationFrame(id) {
    agDocument.cancelAnimationFrame(id);
  }
  return buildScheduler(scheduleWithAnimationFrame, cb, cancelWithAnimationFrame);
}
function scheduleWithDelay(innerCb, delayMs = 0) {
  if (delayMs === 0) {
    queueMicrotask(innerCb);
    return void 0;
  }
  return setTimeout(innerCb, delayMs);
}
function cancelWithTimeout(id) {
  clearTimeout(id);
}
function debouncedCallback(cb) {
  return buildScheduler(scheduleWithDelay, cb, cancelWithTimeout);
}
function buildScheduler(scheduleFn, cb, cancelFn) {
  let scheduleCount = 0;
  let promiseRunning = false;
  let awaitingPromise;
  let awaitingDone;
  let scheduledId;
  function busy() {
    return promiseRunning;
  }
  function done() {
    promiseRunning = false;
    scheduledId = void 0;
    awaitingDone?.();
    awaitingDone = void 0;
    awaitingPromise = void 0;
    if (scheduleCount > 0) {
      scheduledId = scheduleFn(scheduleCallback);
    }
  }
  function scheduleCallback() {
    const count = scheduleCount;
    scheduleCount = 0;
    promiseRunning = true;
    const maybePromise = cb({ count });
    if (!maybePromise) {
      done();
      return;
    }
    maybePromise.then(done, done);
  }
  function schedule(delayMs) {
    if (scheduleCount === 0 && !busy()) {
      scheduledId = scheduleFn(scheduleCallback, delayMs);
    }
    scheduleCount++;
  }
  function cancel() {
    if (scheduledId != null && cancelFn) {
      cancelFn(scheduledId);
      scheduledId = void 0;
      scheduleCount = 0;
    }
  }
  async function waitForCompletion() {
    if (!busy()) {
      return;
    }
    awaitingPromise ?? (awaitingPromise = new Promise(resolveAwaitingPromise));
    while (busy()) {
      await awaitingPromise;
    }
  }
  function resolveAwaitingPromise(resolve) {
    awaitingDone = resolve;
  }
  return {
    schedule,
    cancel,
    waitForCompletion
  };
}

// packages/ag-charts-core/src/chart/aggregation.ts
var AGGREGATION_INDEX_X_MIN = 0;
var AGGREGATION_INDEX_X_MAX = 1;
var AGGREGATION_INDEX_Y_MIN = 2;
var AGGREGATION_INDEX_Y_MAX = 3;
var AGGREGATION_INDEX_SELECTED = 4;
var AGGREGATION_SPAN = 5;
var AGGREGATION_THRESHOLD = 1e3;
var AGGREGATION_MAX_POINTS = 10;
var AGGREGATION_MIN_RANGE = 64;
var AGGREGATION_INDEX_UNSET = 4294967295;
var SMALLEST_INTERVAL_MIN_RECURSE = 3;
var SMALLEST_INTERVAL_RECURSE_LIMIT = 20;
var SMALLEST_INTERVAL_MAX_INDEX_ADJUSTMENTS = 100;
var TIME_SCALE_TYPES = /* @__PURE__ */ /*#__PURE__*/ new Set(["time", "unit-time", "ordinal-time"]);
function epochColumnForTimeScale(scale, xValues, xNeedsValueOf) {
  const values = xNeedsValueOf || !TIME_SCALE_TYPES.has(scale) ? xValues : ensureEpochColumn(xValues);
  return { values, needsValueOf: values === xValues ? xNeedsValueOf : false };
}
var numericColumnCache = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
function narrowBigIntColumn(values) {
  const cached = numericColumnCache.get(values);
  if (cached !== void 0)
    return cached;
  let hasBigInt = false;
  for (let i = 0; i < values.length; i++) {
    if (typeof values[i] === "bigint") {
      hasBigInt = true;
      break;
    }
  }
  const converted = hasBigInt ? values.map((v) => typeof v === "bigint" ? Number(v) : v) : values;
  numericColumnCache.set(values, converted);
  return converted;
}
var relativeNumericColumnCache = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
function narrowBigIntColumnRelative(values) {
  const cached = relativeNumericColumnCache.get(values);
  if (cached !== void 0)
    return cached;
  let minBig;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (typeof v === "bigint" && (minBig === void 0 || v < minBig)) {
      minBig = v;
    }
  }
  let converted;
  if (minBig === void 0) {
    converted = values;
  } else {
    const offsetBig = minBig;
    const offsetNum = Number(offsetBig);
    converted = values.map((v) => {
      if (typeof v === "bigint")
        return Number(v - offsetBig);
      if (typeof v === "number")
        return v - offsetNum;
      return v;
    });
  }
  relativeNumericColumnCache.set(values, converted);
  return converted;
}
function seedNumericColumnIdentity(values) {
  if (!numericColumnCache.has(values)) {
    numericColumnCache.set(values, values);
  }
  if (!relativeNumericColumnCache.has(values)) {
    relativeNumericColumnCache.set(values, values);
  }
}
var offsetNumericColumnCache = /* @__PURE__ */ /*#__PURE__*/ new WeakMap();
function narrowBigIntColumnByOffset(values, offset) {
  const cached = offsetNumericColumnCache.get(values);
  if (cached?.offset === offset)
    return cached.result;
  const offsetNum = Number(offset);
  const result = values.map((v) => {
    if (typeof v === "bigint")
      return Number(v - offset);
    if (typeof v === "number")
      return v - offsetNum;
    return v;
  });
  offsetNumericColumnCache.set(values, { offset, result });
  return result;
}
function bigIntAggregationExtent(scale, domainInput) {
  if (scale !== "number")
    return void 0;
  const { domain, sortMetadata } = domainInput;
  if (domain.length === 0)
    return void 0;
  const first2 = domain[0];
  const last = domain.at(-1);
  if (sortMetadata?.sortOrder === 1) {
    return typeof first2 === "bigint" && typeof last === "bigint" ? { min: first2, max: last } : void 0;
  }
  if (sortMetadata?.sortOrder === -1) {
    return typeof first2 === "bigint" && typeof last === "bigint" ? { min: last, max: first2 } : void 0;
  }
  let min;
  let max;
  for (const d of domain) {
    if (typeof d !== "bigint")
      return void 0;
    if (min === void 0 || d < min)
      min = d;
    if (max === void 0 || d > max)
      max = d;
  }
  if (min === void 0 || max === void 0)
    return void 0;
  return { min, max };
}
function narrowAggregationX(scale, epochXValues, domainInput) {
  const extent2 = bigIntAggregationExtent(scale, domainInput);
  if (extent2 !== void 0) {
    return {
      xValues: narrowBigIntColumnByOffset(epochXValues, extent2.min),
      domain: [0, Number(extent2.max - extent2.min)]
    };
  }
  return { xValues: narrowBigIntColumn(epochXValues), domain: aggregationDomain(scale, domainInput) };
}
function estimateSmallestPixelIntervalIter(xValues, d0, d1, startDatumIndex, endDatumIndex, currentSmallestInterval, depth, xNeedsValueOf) {
  let indexAdjustments = 0;
  while (indexAdjustments < SMALLEST_INTERVAL_MAX_INDEX_ADJUSTMENTS && xValues[startDatumIndex] == null && startDatumIndex < endDatumIndex) {
    startDatumIndex += 1;
    indexAdjustments += 1;
  }
  while (indexAdjustments < SMALLEST_INTERVAL_MAX_INDEX_ADJUSTMENTS && xValues[endDatumIndex] == null && endDatumIndex > startDatumIndex) {
    endDatumIndex -= 1;
    indexAdjustments += 1;
  }
  if (indexAdjustments >= SMALLEST_INTERVAL_MAX_INDEX_ADJUSTMENTS || startDatumIndex >= endDatumIndex) {
    return currentSmallestInterval;
  }
  const ratio2 = Number.isFinite(d0) ? aggregationXRatioForXValue(xValues[endDatumIndex], d0, d1, xNeedsValueOf) - aggregationXRatioForXValue(xValues[startDatumIndex], d0, d1, xNeedsValueOf) : aggregationXRatioForDatumIndex(endDatumIndex, xValues.length) - aggregationXRatioForDatumIndex(startDatumIndex, xValues.length);
  if (ratio2 === 0 || !Number.isFinite(ratio2))
    return currentSmallestInterval;
  const currentInterval = Math.abs(ratio2) / (endDatumIndex - startDatumIndex);
  let recurse;
  if (depth < SMALLEST_INTERVAL_MIN_RECURSE) {
    recurse = true;
  } else if (depth > SMALLEST_INTERVAL_RECURSE_LIMIT) {
    recurse = false;
  } else {
    recurse = currentInterval <= currentSmallestInterval;
  }
  currentSmallestInterval = Math.min(currentSmallestInterval, currentInterval);
  if (!recurse)
    return currentSmallestInterval;
  const midIndex = Math.floor((startDatumIndex + endDatumIndex) / 2);
  const leadingInterval = estimateSmallestPixelIntervalIter(
    xValues,
    d0,
    d1,
    startDatumIndex,
    midIndex,
    currentSmallestInterval,
    depth + 1,
    xNeedsValueOf
  );
  const trailingInterval = estimateSmallestPixelIntervalIter(
    xValues,
    d0,
    d1,
    midIndex + 1,
    endDatumIndex,
    currentSmallestInterval,
    depth + 1,
    xNeedsValueOf
  );
  return Math.min(leadingInterval, trailingInterval, currentSmallestInterval);
}
function estimateSmallestPixelInterval(xValues, d0, d1, xNeedsValueOf) {
  return estimateSmallestPixelIntervalIter(
    xValues,
    d0,
    d1,
    0,
    xValues.length - 1,
    1 / (xValues.length - 1),
    0,
    xNeedsValueOf
  );
}
function aggregationRangeFittingPoints(xValues, d0, d1, opts) {
  if (Number.isFinite(d0)) {
    const smallestKeyInterval = opts?.smallestKeyInterval;
    const xNeedsValueOf = opts?.xNeedsValueOf ?? true;
    const smallestPixelInterval = smallestKeyInterval == null ? estimateSmallestPixelInterval(xValues, d0, d1, xNeedsValueOf) : Number(smallestKeyInterval) / (d1 - d0);
    return Math.min(nextPowerOf2(Math.trunc(1 / smallestPixelInterval)) >> 3, nextPowerOf2(xValues.length));
  } else {
    let power = Math.ceil(Math.log2(xValues.length)) - 1;
    power = Math.min(Math.max(power, 0), 24);
    return Math.trunc(2 ** power);
  }
}
function aggregationDomain(scale, domainInput) {
  const { domain, sortMetadata } = domainInput;
  switch (scale) {
    case "category":
      return [Number.NaN, Number.NaN];
    case "number":
    case "time":
    case "ordinal-time":
    case "unit-time": {
      if (domain.length === 0)
        return [Infinity, -Infinity];
      if (sortMetadata?.sortOrder === 1) {
        return [Number(domain[0]), Number(domain.at(-1))];
      }
      if (sortMetadata?.sortOrder === -1) {
        return [Number(domain.at(-1)), Number(domain[0])];
      }
      let min = Infinity;
      let max = -Infinity;
      for (const d of domain) {
        const value = Number(d);
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
      return [min, max];
    }
    case "color":
    case "log":
    case "mercator":
      return [0, 0];
  }
}
function aggregationXRatioForDatumIndex(datumIndex, domainCount) {
  return datumIndex / domainCount;
}
function aggregationXRatioForXValue(xValue, d0, d1, xNeedsValueOf) {
  if (xNeedsValueOf) {
    return (xValue.valueOf() - d0) / (d1 - d0);
  }
  return (xValue - d0) / (d1 - d0);
}
function aggregationIndexForXRatio(xRatio, maxRange) {
  return Math.trunc(Math.min(Math.floor(xRatio * maxRange), maxRange - 1) * AGGREGATION_SPAN);
}
function aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, { xNeedsValueOf = true, xValuesLength } = {}) {
  const xValue = xValues[datumIndex];
  if (xValue == null)
    return -1;
  const length2 = xValuesLength ?? xValues.length;
  const xRatio = Number.isFinite(d0) ? aggregationXRatioForXValue(xValue, d0, d1, xNeedsValueOf) : aggregationXRatioForDatumIndex(datumIndex, length2);
  return aggregationIndexForXRatio(xRatio, maxRange);
}
function aggregationDatumMatchesIndex(indexData, aggIndex, datumIndex, offsets) {
  for (const offset of offsets) {
    if (datumIndex === indexData[aggIndex + offset]) {
      return true;
    }
  }
  return false;
}
function createAggregationIndices(xValues, yMaxValues, yMinValues, d0, d1, maxRange, {
  positive,
  split = false,
  xNeedsValueOf = true,
  yNeedsValueOf = true,
  // Optional pre-allocated arrays to reuse (must be correct size: maxRange * AGGREGATION_SPAN)
  reuseIndexData,
  reuseValueData,
  reuseNegativeIndexData,
  reuseNegativeValueData
} = {}) {
  const nan = Number.NaN;
  const requiredSize = maxRange * AGGREGATION_SPAN;
  const indexData = reuseIndexData?.length === requiredSize ? reuseIndexData : new Uint32Array(requiredSize);
  const valueData = reuseValueData?.length === requiredSize ? reuseValueData : new Float64Array(requiredSize);
  let negativeIndexData;
  let negativeValueData;
  if (split) {
    if (reuseNegativeIndexData?.length === requiredSize) {
      negativeIndexData = reuseNegativeIndexData;
    } else {
      negativeIndexData = new Uint32Array(requiredSize);
    }
    if (reuseNegativeValueData?.length === requiredSize) {
      negativeValueData = reuseNegativeValueData;
    } else {
      negativeValueData = new Float64Array(requiredSize);
    }
  }
  const continuous = Number.isFinite(d0) && Number.isFinite(d1);
  const domainCount = xValues.length;
  if (continuous) {
    valueData.fill(nan);
    indexData.fill(AGGREGATION_INDEX_UNSET);
    if (split) {
      negativeValueData.fill(nan);
      negativeIndexData.fill(AGGREGATION_INDEX_UNSET);
    }
  }
  const scaleFactor = continuous ? maxRange / (d1 - d0) : maxRange * (1 / domainCount);
  let lastAggIndex = -1;
  let cachedXMinIndex = -1;
  let cachedXMinValue = nan;
  let cachedXMaxIndex = -1;
  let cachedXMaxValue = nan;
  let cachedYMinIndex = -1;
  let cachedYMinValue = nan;
  let cachedYMaxIndex = -1;
  let cachedYMaxValue = nan;
  let negLastAggIndex = -1;
  let negCachedXMinIndex = -1;
  let negCachedXMinValue = nan;
  let negCachedXMaxIndex = -1;
  let negCachedXMaxValue = nan;
  let negCachedYMinIndex = -1;
  let negCachedYMinValue = nan;
  let negCachedYMaxIndex = -1;
  let negCachedYMaxValue = nan;
  const xValuesLength = xValues.length;
  const yArraysSame = yMaxValues === yMinValues;
  for (let datumIndex = 0; datumIndex < xValuesLength; datumIndex++) {
    const xValue = xValues[datumIndex];
    if (xValue == null)
      continue;
    const yMaxValue = yMaxValues[datumIndex];
    const yMinValue = yArraysSame ? yMaxValue : yMinValues[datumIndex];
    let yMax;
    let yMin;
    if (yNeedsValueOf) {
      yMax = yMaxValue == null ? nan : yMaxValue.valueOf();
      yMin = yMinValue == null ? nan : yMinValue.valueOf();
    } else {
      yMax = yMaxValue ?? nan;
      yMin = yMinValue ?? nan;
    }
    let isPositiveDatum = true;
    if (split) {
      isPositiveDatum = yMax >= 0;
    } else if (positive != null && yMax >= 0 !== positive) {
      continue;
    }
    let scaledX;
    if (continuous) {
      if (xNeedsValueOf) {
        scaledX = (xValue.valueOf() - d0) * scaleFactor;
      } else {
        scaledX = (xValue - d0) * scaleFactor;
      }
    } else {
      scaledX = datumIndex * scaleFactor;
    }
    const bucketIndex = Math.floor(scaledX);
    const aggIndex = (bucketIndex < maxRange ? bucketIndex : maxRange - 1) * AGGREGATION_SPAN;
    if (isPositiveDatum) {
      if (aggIndex !== lastAggIndex) {
        if (lastAggIndex !== -1) {
          indexData[lastAggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinIndex;
          indexData[lastAggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxIndex;
          indexData[lastAggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinIndex;
          indexData[lastAggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxIndex;
          indexData[lastAggIndex + AGGREGATION_INDEX_SELECTED] = 0;
          valueData[lastAggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinValue;
          valueData[lastAggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxValue;
          valueData[lastAggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinValue;
          valueData[lastAggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxValue;
        }
        lastAggIndex = aggIndex;
        cachedXMinIndex = -1;
        cachedXMinValue = nan;
        cachedXMaxIndex = -1;
        cachedXMaxValue = nan;
        cachedYMinIndex = -1;
        cachedYMinValue = nan;
        cachedYMaxIndex = -1;
        cachedYMaxValue = nan;
      }
      const yMinValid = yMin === yMin;
      const yMaxValid = yMax === yMax;
      if (cachedXMinIndex === -1) {
        cachedXMinIndex = datumIndex;
        cachedXMinValue = scaledX;
        cachedXMaxIndex = datumIndex;
        cachedXMaxValue = scaledX;
        if (yMinValid) {
          cachedYMinIndex = datumIndex;
          cachedYMinValue = yMin;
        }
        if (yMaxValid) {
          cachedYMaxIndex = datumIndex;
          cachedYMaxValue = yMax;
        }
      } else {
        if (scaledX < cachedXMinValue) {
          cachedXMinIndex = datumIndex;
          cachedXMinValue = scaledX;
        }
        if (scaledX > cachedXMaxValue) {
          cachedXMaxIndex = datumIndex;
          cachedXMaxValue = scaledX;
        }
        if (yMinValid && yMin < cachedYMinValue) {
          cachedYMinIndex = datumIndex;
          cachedYMinValue = yMin;
        }
        if (yMaxValid && yMax > cachedYMaxValue) {
          cachedYMaxIndex = datumIndex;
          cachedYMaxValue = yMax;
        }
      }
    } else {
      if (aggIndex !== negLastAggIndex) {
        if (negLastAggIndex !== -1) {
          negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_X_MIN] = negCachedXMinIndex;
          negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_X_MAX] = negCachedXMaxIndex;
          negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_Y_MIN] = negCachedYMinIndex;
          negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_Y_MAX] = negCachedYMaxIndex;
          negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_SELECTED] = 0;
          negativeValueData[negLastAggIndex + AGGREGATION_INDEX_X_MIN] = negCachedXMinValue;
          negativeValueData[negLastAggIndex + AGGREGATION_INDEX_X_MAX] = negCachedXMaxValue;
          negativeValueData[negLastAggIndex + AGGREGATION_INDEX_Y_MIN] = negCachedYMinValue;
          negativeValueData[negLastAggIndex + AGGREGATION_INDEX_Y_MAX] = negCachedYMaxValue;
        }
        negLastAggIndex = aggIndex;
        negCachedXMinIndex = -1;
        negCachedXMinValue = nan;
        negCachedXMaxIndex = -1;
        negCachedXMaxValue = nan;
        negCachedYMinIndex = -1;
        negCachedYMinValue = nan;
        negCachedYMaxIndex = -1;
        negCachedYMaxValue = nan;
      }
      const yMinValid = yMin === yMin;
      const yMaxValid = yMax === yMax;
      if (negCachedXMinIndex === -1) {
        negCachedXMinIndex = datumIndex;
        negCachedXMinValue = scaledX;
        negCachedXMaxIndex = datumIndex;
        negCachedXMaxValue = scaledX;
        if (yMinValid) {
          negCachedYMinIndex = datumIndex;
          negCachedYMinValue = yMin;
        }
        if (yMaxValid) {
          negCachedYMaxIndex = datumIndex;
          negCachedYMaxValue = yMax;
        }
      } else {
        if (scaledX < negCachedXMinValue) {
          negCachedXMinIndex = datumIndex;
          negCachedXMinValue = scaledX;
        }
        if (scaledX > negCachedXMaxValue) {
          negCachedXMaxIndex = datumIndex;
          negCachedXMaxValue = scaledX;
        }
        if (yMinValid && yMin < negCachedYMinValue) {
          negCachedYMinIndex = datumIndex;
          negCachedYMinValue = yMin;
        }
        if (yMaxValid && yMax > negCachedYMaxValue) {
          negCachedYMaxIndex = datumIndex;
          negCachedYMaxValue = yMax;
        }
      }
    }
  }
  if (lastAggIndex !== -1) {
    indexData[lastAggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinIndex;
    indexData[lastAggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxIndex;
    indexData[lastAggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinIndex;
    indexData[lastAggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxIndex;
    indexData[lastAggIndex + AGGREGATION_INDEX_SELECTED] = 0;
    valueData[lastAggIndex + AGGREGATION_INDEX_X_MIN] = cachedXMinValue;
    valueData[lastAggIndex + AGGREGATION_INDEX_X_MAX] = cachedXMaxValue;
    valueData[lastAggIndex + AGGREGATION_INDEX_Y_MIN] = cachedYMinValue;
    valueData[lastAggIndex + AGGREGATION_INDEX_Y_MAX] = cachedYMaxValue;
  }
  if (split && negLastAggIndex !== -1) {
    negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_X_MIN] = negCachedXMinIndex;
    negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_X_MAX] = negCachedXMaxIndex;
    negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_Y_MIN] = negCachedYMinIndex;
    negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_Y_MAX] = negCachedYMaxIndex;
    negativeIndexData[negLastAggIndex + AGGREGATION_INDEX_SELECTED] = 0;
    negativeValueData[negLastAggIndex + AGGREGATION_INDEX_X_MIN] = negCachedXMinValue;
    negativeValueData[negLastAggIndex + AGGREGATION_INDEX_X_MAX] = negCachedXMaxValue;
    negativeValueData[negLastAggIndex + AGGREGATION_INDEX_Y_MIN] = negCachedYMinValue;
    negativeValueData[negLastAggIndex + AGGREGATION_INDEX_Y_MAX] = negCachedYMaxValue;
  }
  return { indexData, valueData, negativeIndexData, negativeValueData };
}
function compactAggregationIndices(indexData, valueData, maxRange, {
  inPlace = false,
  midpointData,
  reuseIndexData,
  reuseValueData
} = {}) {
  const nextMaxRange = Math.trunc(maxRange / 2);
  const requiredSize = nextMaxRange * AGGREGATION_SPAN;
  let nextIndexData;
  if (inPlace) {
    nextIndexData = indexData;
  } else if (reuseIndexData?.length === requiredSize) {
    nextIndexData = reuseIndexData;
  } else {
    nextIndexData = new Uint32Array(requiredSize);
  }
  let nextValueData;
  if (inPlace) {
    nextValueData = valueData;
  } else if (reuseValueData?.length === requiredSize) {
    nextValueData = reuseValueData;
  } else {
    nextValueData = new Float64Array(requiredSize);
  }
  const nextMidpointData = midpointData ?? new Uint32Array(nextMaxRange);
  for (let i = 0; i < nextMaxRange; i += 1) {
    const aggIndex = Math.trunc(i * AGGREGATION_SPAN);
    const index0 = Math.trunc(aggIndex * 2);
    const index1 = Math.trunc(index0 + AGGREGATION_SPAN);
    const index1Unset = indexData[index1 + AGGREGATION_INDEX_X_MIN] === AGGREGATION_INDEX_UNSET;
    const xMinAggIndex = index1Unset || valueData[index0 + AGGREGATION_INDEX_X_MIN] < valueData[index1 + AGGREGATION_INDEX_X_MIN] ? index0 : index1;
    const xMinIndex = indexData[xMinAggIndex + AGGREGATION_INDEX_X_MIN];
    nextIndexData[aggIndex + AGGREGATION_INDEX_X_MIN] = xMinIndex;
    nextValueData[aggIndex + AGGREGATION_INDEX_X_MIN] = valueData[xMinAggIndex + AGGREGATION_INDEX_X_MIN];
    const xMaxAggIndex = index1Unset || valueData[index0 + AGGREGATION_INDEX_X_MAX] > valueData[index1 + AGGREGATION_INDEX_X_MAX] ? index0 : index1;
    const xMaxIndex = indexData[xMaxAggIndex + AGGREGATION_INDEX_X_MAX];
    nextIndexData[aggIndex + AGGREGATION_INDEX_X_MAX] = xMaxIndex;
    nextValueData[aggIndex + AGGREGATION_INDEX_X_MAX] = valueData[xMaxAggIndex + AGGREGATION_INDEX_X_MAX];
    nextMidpointData[i] = xMinIndex + xMaxIndex >> 1;
    const yMinAggIndex = index1Unset || valueData[index0 + AGGREGATION_INDEX_Y_MIN] < valueData[index1 + AGGREGATION_INDEX_Y_MIN] ? index0 : index1;
    nextIndexData[aggIndex + AGGREGATION_INDEX_Y_MIN] = indexData[yMinAggIndex + AGGREGATION_INDEX_Y_MIN];
    nextValueData[aggIndex + AGGREGATION_INDEX_Y_MIN] = valueData[yMinAggIndex + AGGREGATION_INDEX_Y_MIN];
    const yMaxAggIndex = index1Unset || valueData[index0 + AGGREGATION_INDEX_Y_MAX] > valueData[index1 + AGGREGATION_INDEX_Y_MAX] ? index0 : index1;
    nextIndexData[aggIndex + AGGREGATION_INDEX_Y_MAX] = indexData[yMaxAggIndex + AGGREGATION_INDEX_Y_MAX];
    nextValueData[aggIndex + AGGREGATION_INDEX_Y_MAX] = valueData[yMaxAggIndex + AGGREGATION_INDEX_Y_MAX];
    nextIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] = indexData[index0 + AGGREGATION_INDEX_SELECTED] | indexData[index1 + AGGREGATION_INDEX_SELECTED];
  }
  return {
    maxRange: nextMaxRange,
    indexData: nextIndexData,
    valueData: nextValueData,
    midpointData: nextMidpointData
  };
}
function collectSparseSelection(selection) {
  let count = 0;
  for (let i = 0; i < selection.length; i++) {
    if (selection[i] === 1)
      count++;
  }
  const indices = new Uint32Array(count);
  let pos = 0;
  for (let i = 0; i < selection.length; i++) {
    if (selection[i] === 1)
      indices[pos++] = i;
  }
  return indices;
}
function populateBucketSelectedFromSparse(sparseSelection, indexData, bucketCount, xValues, d0, d1, xNeedsValueOf) {
  for (let i = 0; i < bucketCount; i++) {
    indexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_SELECTED] = 0;
  }
  if (sparseSelection.length === 0)
    return;
  const continuous = Number.isFinite(d0) && Number.isFinite(d1);
  const xValuesLength = xValues.length;
  const scaleFactor = continuous ? bucketCount / (d1 - d0) : bucketCount * (1 / xValuesLength);
  for (let i = 0; i < sparseSelection.length; i++) {
    const datumIndex = sparseSelection[i];
    if (datumIndex >= xValuesLength)
      continue;
    const xValue = xValues[datumIndex];
    if (xValue == null)
      continue;
    let scaledX;
    if (continuous) {
      scaledX = xNeedsValueOf ? (xValue.valueOf() - d0) * scaleFactor : (xValue - d0) * scaleFactor;
    } else {
      scaledX = datumIndex * scaleFactor;
    }
    const bucketIndex = Math.floor(scaledX);
    const aggIndex = (bucketIndex < bucketCount ? bucketIndex : bucketCount - 1) * AGGREGATION_SPAN;
    indexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 1;
  }
}
function populateBucketSelectedFromSparseSplit(sparseSelection, positiveIndexData, negativeIndexData, bucketCount, xValues, yEndValues, d0, d1, xNeedsValueOf, yNeedsValueOf) {
  for (let i = 0; i < bucketCount; i++) {
    const aggIndex = i * AGGREGATION_SPAN;
    positiveIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 0;
    negativeIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 0;
  }
  if (sparseSelection.length === 0)
    return;
  const continuous = Number.isFinite(d0) && Number.isFinite(d1);
  const xValuesLength = xValues.length;
  const scaleFactor = continuous ? bucketCount / (d1 - d0) : bucketCount * (1 / xValuesLength);
  for (let i = 0; i < sparseSelection.length; i++) {
    const datumIndex = sparseSelection[i];
    if (datumIndex >= xValuesLength)
      continue;
    const xValue = xValues[datumIndex];
    if (xValue == null)
      continue;
    const yEnd = yEndValues[datumIndex];
    if (yEnd == null)
      continue;
    const yMax = yNeedsValueOf ? yEnd.valueOf() : yEnd;
    if (yMax !== yMax)
      continue;
    let scaledX;
    if (continuous) {
      scaledX = xNeedsValueOf ? (xValue.valueOf() - d0) * scaleFactor : (xValue - d0) * scaleFactor;
    } else {
      scaledX = datumIndex * scaleFactor;
    }
    const bucketIndex = Math.floor(scaledX);
    const aggIndex = (bucketIndex < bucketCount ? bucketIndex : bucketCount - 1) * AGGREGATION_SPAN;
    if (yMax >= 0) {
      positiveIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 1;
    } else {
      negativeIndexData[aggIndex + AGGREGATION_INDEX_SELECTED] = 1;
    }
  }
}
function getMidpointsForIndices(maxRange, indexData, reuseMidpointData, xMinOffset = AGGREGATION_INDEX_X_MIN, xMaxOffset = AGGREGATION_INDEX_X_MAX, invalidSentinel = -1) {
  const midpoints = reuseMidpointData?.length === maxRange ? reuseMidpointData : new Uint32Array(maxRange);
  for (let i = 0, offset = 0; i < maxRange; i += 1, offset += AGGREGATION_SPAN) {
    const xMin = indexData[offset + xMinOffset];
    const xMax = indexData[offset + xMaxOffset];
    midpoints[i] = xMin === invalidSentinel ? invalidSentinel : xMin + xMax >> 1;
  }
  return midpoints;
}
function collectAggregationLevels(state2, {
  collectLevel,
  shouldContinue,
  minRange = AGGREGATION_MIN_RANGE,
  compactInPlace = false
}) {
  let aggregationState = state2;
  let level = collectLevel(aggregationState);
  const levels = [level];
  while (aggregationState.maxRange > minRange && shouldContinue(level, aggregationState)) {
    const compacted = compactAggregationIndices(
      aggregationState.indexData,
      aggregationState.valueData,
      aggregationState.maxRange,
      { inPlace: compactInPlace }
    );
    aggregationState = {
      maxRange: compacted.maxRange,
      indexData: compacted.indexData,
      valueData: compacted.valueData,
      midpointData: compacted.midpointData
    };
    level = collectLevel(aggregationState);
    levels.push(level);
  }
  levels.reverse();
  return levels;
}
function computeExtremesAggregation(domain, xValues, highValues, lowValues, options) {
  if (xValues.length < AGGREGATION_THRESHOLD)
    return;
  const [d0, d1] = domain;
  const { smallestKeyInterval, xNeedsValueOf, yNeedsValueOf, existingFilters } = options;
  let maxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval, xNeedsValueOf });
  const existingFilter = existingFilters?.find((f) => f.maxRange === maxRange);
  let { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange, {
    xNeedsValueOf,
    yNeedsValueOf,
    reuseIndexData: existingFilter?.indexData,
    reuseValueData: existingFilter?.valueData
  });
  let midpointIndices = getMidpointsForIndices(maxRange, indexData, existingFilter?.midpointIndices);
  const filters = [
    {
      maxRange,
      indexData,
      valueData,
      midpointIndices
    }
  ];
  while (maxRange > AGGREGATION_MIN_RANGE) {
    const currentMaxRange = maxRange;
    const nextMaxRange = Math.trunc(currentMaxRange / 2);
    const nextExistingFilter = existingFilters?.find((f) => f.maxRange === nextMaxRange);
    const compacted = compactAggregationIndices(indexData, valueData, currentMaxRange, {
      reuseIndexData: nextExistingFilter?.indexData,
      reuseValueData: nextExistingFilter?.valueData
    });
    maxRange = compacted.maxRange;
    indexData = compacted.indexData;
    valueData = compacted.valueData;
    midpointIndices = compacted.midpointData ?? getMidpointsForIndices(maxRange, indexData, nextExistingFilter?.midpointIndices);
    filters.push({
      maxRange,
      indexData,
      valueData,
      midpointIndices
    });
  }
  filters.reverse();
  return filters;
}
function computeExtremesAggregationPartial(domain, xValues, highValues, lowValues, options) {
  if (xValues.length < AGGREGATION_THRESHOLD)
    return;
  const [d0, d1] = domain;
  const { smallestKeyInterval, targetRange, xNeedsValueOf, yNeedsValueOf, existingFilters } = options;
  const finestMaxRange = aggregationRangeFittingPoints(xValues, d0, d1, { smallestKeyInterval, xNeedsValueOf });
  const targetMaxRange = Math.min(finestMaxRange, nextPowerOf2(Math.max(targetRange, AGGREGATION_MIN_RANGE)));
  const existingFilter = existingFilters?.find((f) => f.maxRange === targetMaxRange);
  const { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, targetMaxRange, {
    xNeedsValueOf,
    yNeedsValueOf,
    reuseIndexData: existingFilter?.indexData,
    reuseValueData: existingFilter?.valueData
  });
  const midpointIndices = getMidpointsForIndices(targetMaxRange, indexData, existingFilter?.midpointIndices);
  const immediateLevel = {
    maxRange: targetMaxRange,
    indexData,
    valueData,
    midpointIndices
  };
  function computeRemaining() {
    const allLevels = computeExtremesAggregation([d0, d1], xValues, highValues, lowValues, {
      smallestKeyInterval,
      xNeedsValueOf,
      yNeedsValueOf,
      existingFilters
    });
    return allLevels?.filter((level) => level.maxRange !== targetMaxRange) ?? [];
  }
  return { immediate: [immediateLevel], computeRemaining };
}

// packages/ag-charts-core/src/chart/cartesianSeriesUtil.ts
function upsertNodeDatum(ctx, params, createNode, updateNode) {
  const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;
  let node;
  if (canReuseNode) {
    node = ctx.nodes[ctx.nodeIndex];
    updateNode(ctx, node, params);
  } else {
    node = createNode(ctx, params);
    if (node != null) {
      ctx.nodes.push(node);
    }
  }
  ctx.nodeIndex++;
  return node;
}

// packages/ag-charts-core/src/chart/legendUtil.ts
function expandLegendPosition(position) {
  const {
    placement = "bottom",
    floating = false,
    xOffset = 0,
    yOffset = 0
  } = typeof position === "string" ? { placement: position, floating: false } : position;
  return { placement, floating, xOffset, yOffset };
}

// packages/ag-charts-core/src/chart/markerShapes.ts
function drawMarkerUnitPolygon(params, moves) {
  const { path, size } = params;
  const { x: x0, y: y0 } = params;
  path.clear();
  let didMove = false;
  for (const [dx, dy] of moves) {
    const x = x0 + (dx - 0.5) * size;
    const y = y0 + (dy - 0.5) * size;
    if (didMove) {
      path.lineTo(x, y);
    } else {
      path.moveTo(x, y);
    }
    didMove = true;
  }
  path.closePath();
}
var MARKER_SHAPES = {
  circle({ path, x, y, size }) {
    const r = size / 2;
    path.arc(x, y, r, 0, Math.PI * 2);
    path.closePath();
  },
  cross(params) {
    drawMarkerUnitPolygon(params, [
      [0.25, 0],
      [0.5, 0.25],
      [0.75, 0],
      [1, 0.25],
      [0.75, 0.5],
      [1, 0.75],
      [0.75, 1],
      [0.5, 0.75],
      [0.25, 1],
      [0, 0.75],
      [0.25, 0.5],
      [0, 0.25]
    ]);
  },
  diamond(params) {
    drawMarkerUnitPolygon(params, [
      [0.5, 0],
      [1, 0.5],
      [0.5, 1],
      [0, 0.5]
    ]);
  },
  heart({ path, x, y, size }) {
    const r = size / 4;
    y = y + r / 2;
    path.arc(x - r, y - r, r, toRadians(130), toRadians(330));
    path.arc(x + r, y - r, r, toRadians(220), toRadians(50));
    path.lineTo(x, y + r);
    path.closePath();
  },
  pin({ path, x, y, size: s }) {
    const cx = 0.5;
    const cy = 0.5;
    path.moveTo(x + (0.891 - cx) * s, y + (0.391 - cy) * s);
    path.cubicCurveTo(
      x + (0.891 - cx) * s,
      y + (0.606 - cy) * s,
      x + (0.5 - cx) * s,
      y + (1 - cy) * s,
      x + (0.5 - cx) * s,
      y + (1 - cy) * s
    );
    path.cubicCurveTo(
      x + (0.5 - cx) * s,
      y + (1 - cy) * s,
      x + (0.109 - cx) * s,
      y + (0.606 - cy) * s,
      x + (0.109 - cx) * s,
      y + (0.391 - cy) * s
    );
    path.cubicCurveTo(
      x + (0.109 - cx) * s,
      y + (0.175 - cy) * s,
      x + (0.284 - cx) * s,
      y + (0 - cy) * s,
      x + (0.5 - cx) * s,
      y + (0 - cy) * s
    );
    path.cubicCurveTo(
      x + (0.716 - cx) * s,
      y + (0 - cy) * s,
      x + (0.891 - cx) * s,
      y + (0.175 - cy) * s,
      x + (0.891 - cx) * s,
      y + (0.391 - cy) * s
    );
    path.closePath();
  },
  plus(params) {
    drawMarkerUnitPolygon(params, [
      [1 / 3, 0],
      [2 / 3, 0],
      [2 / 3, 1 / 3],
      [1, 1 / 3],
      [1, 2 / 3],
      [2 / 3, 2 / 3],
      [2 / 3, 1],
      [1 / 3, 1],
      [1 / 3, 2 / 3],
      [0, 2 / 3],
      [0, 1 / 3],
      [1 / 3, 1 / 3]
    ]);
  },
  square({ path, x, y, size }) {
    const hs = size / 2;
    path.moveTo(x - hs, y - hs);
    path.lineTo(x + hs, y - hs);
    path.lineTo(x + hs, y + hs);
    path.lineTo(x - hs, y + hs);
    path.closePath();
  },
  star({ path, x, y, size }) {
    const spikes = 5;
    const outerRadius = size / 2;
    const innerRadius = outerRadius / 2;
    const rotation = Math.PI / 2;
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle2 = i * Math.PI / spikes - rotation;
      const xCoordinate = x + Math.cos(angle2) * radius;
      const yCoordinate = y + Math.sin(angle2) * radius;
      path.lineTo(xCoordinate, yCoordinate);
    }
    path.closePath();
  },
  triangle(params) {
    drawMarkerUnitPolygon(params, [
      [0.5, 0],
      [1, 0.87],
      [0, 0.87]
    ]);
  }
};

// packages/ag-charts-core/src/chart/markerUtil.ts
var MARKER_SUPPORTED_SHAPES = /* @__PURE__ */ /*#__PURE__*/ new Set([
  "circle",
  "cross",
  "diamond",
  "heart",
  "pin",
  "plus",
  "square",
  "star",
  "triangle"
]);
function isSupportedMarkerShape(shape) {
  return typeof shape === "string" && MARKER_SUPPORTED_SHAPES.has(shape);
}
function areaSizeAtRatio(t, min, max) {
  if (t <= 0 || max <= min)
    return min;
  if (t >= 1)
    return max;
  return Math.sqrt(min * min + t * (max * max - min * min));
}
function applySizeMode(linearSize, min, max, sizeMode) {
  if (sizeMode !== "area" || max <= min)
    return linearSize;
  return areaSizeAtRatio((linearSize - min) / (max - min), min, max);
}

// packages/ag-charts-core/src/chart/scale/bandScale.ts
var BandScale = class _BandScale extends AbstractScale {
  constructor() {
    super(...arguments);
    this.invalid = true;
    this._range = [0, 1];
    this._round = false;
    this._bandwidth = 1;
    this._step = 1;
    this._inset = 1;
    this._rawBandwidth = 1;
    /**
     * The ratio of the range that is reserved for space between bands.
     */
    this._paddingInner = 0;
    /**
     * The ratio of the range that is reserved for space before the first
     * and after the last band.
     */
    this._paddingOuter = 0;
  }
  static is(value) {
    return value instanceof _BandScale;
  }
  get range() {
    return this._range;
  }
  set range(value) {
    if (value === this._range)
      return;
    this._range = value;
    this.invalid = true;
  }
  get round() {
    return this._round;
  }
  set round(value) {
    if (value === this._round)
      return;
    this._round = value;
    this.invalid = true;
  }
  get bandwidth() {
    this.refresh();
    return this._bandwidth;
  }
  get step() {
    this.refresh();
    return this._step;
  }
  get inset() {
    this.refresh();
    return this._inset;
  }
  get rawBandwidth() {
    this.refresh();
    return this._rawBandwidth;
  }
  set padding(value) {
    value = clamp(0, value, 1);
    this._paddingInner = value;
    this._paddingOuter = value;
  }
  get padding() {
    return this._paddingInner;
  }
  set paddingInner(value) {
    this.invalid = true;
    this._paddingInner = clamp(0, value, 1);
  }
  get paddingInner() {
    return this._paddingInner;
  }
  set paddingOuter(value) {
    this.invalid = true;
    this._paddingOuter = clamp(0, value, 1);
  }
  get paddingOuter() {
    return this._paddingOuter;
  }
  /** Override in subclass to provide band count without triggering full band materialization */
  getBandCountForUpdate() {
    return this.bands.length;
  }
  refresh() {
    if (!this.invalid)
      return;
    this.invalid = false;
    this.update();
    if (this.invalid) {
      this.logger.warnOnce("Expected update to not invalidate scale");
    }
  }
  convert(d, options) {
    this.refresh();
    const i = this.findIndex(d, options?.alignment, options?.alignmentExclusive);
    if (i == null || i < 0 || i >= this.getBandCountForUpdate()) {
      return Number.NaN;
    }
    return this.ordinalRange(i);
  }
  getDomainMinMax() {
    return unpackDomainMinMax(this.domain);
  }
  invertNearestIndex(position, alignment = "center") {
    this.refresh();
    const bandCount = this.getBandCountForUpdate();
    if (bandCount === 0)
      return -1;
    let low = 0;
    let high = bandCount - 1;
    let closestDistance = Infinity;
    let closestIndex = 0;
    while (low <= high) {
      const mid = Math.trunc((high + low) / 2);
      const p = this.ordinalRange(mid);
      const distance2 = p - position;
      if (distance2 === 0)
        return mid;
      if ((alignment === "center" || distance2 < 0) && Math.abs(distance2) < closestDistance) {
        closestDistance = Math.abs(distance2);
        closestIndex = mid;
      }
      if (p < position) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return closestIndex;
  }
  update() {
    const [r0, r1] = this.range;
    let { _paddingInner: paddingInner } = this;
    const { _paddingOuter: paddingOuter } = this;
    const bandCount = this.getBandCountForUpdate();
    if (bandCount === 0)
      return;
    const rangeDistance = r1 - r0;
    let rawStep;
    if (bandCount === 1) {
      paddingInner = 0;
      rawStep = rangeDistance * (1 - paddingOuter * 2);
    } else {
      rawStep = rangeDistance / Math.max(1, bandCount - paddingInner + paddingOuter * 2);
    }
    const round3 = this.round && Math.floor(rawStep) > 0;
    const step = round3 ? Math.floor(rawStep) : rawStep;
    const inset = r0 + (rangeDistance - step * (bandCount - paddingInner)) / 2;
    let bandwidth = step * (1 - paddingInner);
    if (round3) {
      bandwidth = Math.round(bandwidth);
    }
    this._step = step;
    this._inset = inset;
    this._bandwidth = bandwidth;
    this._rawBandwidth = rawStep * (1 - paddingInner);
  }
  ordinalRange(i) {
    const { _inset: inset, _step: step, range: range2 } = this;
    const min = Math.min(range2[0], range2[1]);
    const max = Math.max(range2[0], range2[1]);
    return clamp(min, inset + step * i, max);
  }
};

// packages/ag-charts-core/src/chart/scale/categoryScale.ts
var CategoryScale = class _CategoryScale extends BandScale {
  constructor() {
    super(...arguments);
    this.type = "category";
    this.defaultTickCount = 0;
    /**
     * Maps datum to its index in the {@link domain} array.
     * Used to check for duplicate data (not allowed).
     */
    this.index = /* @__PURE__ */ new Map();
    this.indexInitialized = false;
    /**
     * Contains unique data only.
     */
    this._domain = [];
  }
  static is(value) {
    return value instanceof _CategoryScale;
  }
  set domain(values) {
    if (this._domain === values)
      return;
    this.invalid = true;
    this._domain = values;
    this.index.clear();
    this.indexInitialized = false;
  }
  get domain() {
    return this._domain;
  }
  get bands() {
    return this._domain;
  }
  normalizeDomains(...domains) {
    let normalizedDomain = void 0;
    const seenDomains = /* @__PURE__ */ new Set();
    let animatable = true;
    for (const input of domains) {
      const domain = input.domain;
      if (seenDomains.has(domain))
        continue;
      seenDomains.add(domain);
      if (normalizedDomain == null) {
        normalizedDomain = deduplicateCategories(domain);
      } else {
        animatable && (animatable = domainOrderedToNormalizedDomain(domain, normalizedDomain));
        normalizedDomain = deduplicateCategories([...normalizedDomain, ...domain]);
      }
    }
    normalizedDomain ?? (normalizedDomain = []);
    return { domain: normalizedDomain, animatable };
  }
  toDomain(_value) {
    return void 0;
  }
  invert(position, nearest = false) {
    this.refresh();
    const offset = nearest ? this.bandwidth / 2 : 0;
    const index = this.invertNearestIndex(Math.max(0, position - offset));
    const matches = nearest || position === this.ordinalRange(index);
    return matches ? this.domain[index] : void 0;
  }
  invertWithPercentage(position) {
    this.refresh();
    const index = this.invertNearestIndex(position, "left");
    const value = this.domain[index];
    if (value == null)
      return void 0;
    const width2 = this.bandwidth === 0 ? this.step : this.bandwidth;
    const bandStart = this.convert(value);
    const groupPercentage = width2 === 0 ? 0 : (position - bandStart) / width2;
    return { value, groupPercentage };
  }
  ticks(params, domain = this.domain, visibleRange) {
    const { bands } = this;
    let { tickCount } = params;
    if (tickCount === 0) {
      const firstTickIndex2 = bands.length > 1 ? 1 : 0;
      const ticks2 = bands[firstTickIndex2] ? [bands[firstTickIndex2]] : [];
      return { ticks: ticks2, count: void 0, firstTickIndex: firstTickIndex2 };
    }
    let step = tickCount != null && tickCount !== 0 ? Math.trunc(bands.length / tickCount) : 1;
    step = previousPowerOf2(step);
    if (step <= 1) {
      return filterVisibleTicks(domain, false, visibleRange);
    }
    tickCount = Math.trunc(bands.length / step);
    const span = step * tickCount;
    const inset = previousPowerOf2(Math.trunc((bands.length - span) / 2));
    const vt0 = clamp(0, Math.floor((visibleRange?.[0] ?? 0) * bands.length), bands.length);
    const vt1 = clamp(0, Math.ceil((visibleRange?.[1] ?? 1) * bands.length), bands.length);
    const i0 = Math.floor((vt0 - inset) / step) * step + inset;
    const i1 = Math.ceil((vt1 - inset) / step) * step + inset;
    const ticks = [];
    for (let i = i0; i < i1; i += step) {
      if (i >= 0 && i < bands.length) {
        ticks.push(bands[i]);
      }
    }
    let firstTickIndex = ticks.length > 0 ? this.findIndex(ticks[0]) : void 0;
    if (firstTickIndex != null) {
      firstTickIndex = Math.floor((firstTickIndex - inset) / step);
    }
    return { ticks, count: void 0, firstTickIndex };
  }
  findIndex(value) {
    const { index, indexInitialized } = this;
    if (!indexInitialized) {
      const { domain } = this;
      for (let i = 0; i < domain.length; i++) {
        index.set(dateToNumber(domain[i]), i);
      }
      this.indexInitialized = true;
    }
    return index.get(dateToNumber(value));
  }
};
function deduplicateCategories(d) {
  let domain;
  const uniqueValues = /* @__PURE__ */ new Set();
  for (const value of d) {
    const key = dateToNumber(value);
    const lastSize = uniqueValues.size;
    uniqueValues.add(key);
    const isUniqueValue = uniqueValues.size !== lastSize;
    if (isUniqueValue) {
      domain?.push(value);
    } else {
      domain ?? (domain = d.slice(0, uniqueValues.size));
    }
  }
  return domain ?? d;
}
function domainOrderedToNormalizedDomain(domain, normalizedDomain) {
  let normalizedIndex = -1;
  for (const value of domain) {
    const normalizedNextIndex = normalizedDomain.indexOf(value);
    if (normalizedNextIndex === -1) {
      normalizedIndex = Infinity;
    } else if (normalizedNextIndex <= normalizedIndex) {
      return false;
    } else {
      normalizedIndex = normalizedNextIndex;
    }
  }
  return true;
}

// packages/ag-charts-core/src/chart/scale/configureColorScale.ts
function configureColorScale(colorScale, colorScaleProps, dataDomain, logger) {
  colorScale.logger = logger;
  if (dataDomain.length < 2)
    return;
  if (colorScaleProps.fills.length === 0)
    return;
  const domainTuple = [dataDomain[0], dataDomain.at(-1)];
  const displayDomain = colorScaleProps.domain ?? domainTuple;
  const { domain, range: range2 } = computeColorBins(colorScaleProps.fills, displayDomain, colorScaleProps.mode);
  colorScale.mode = colorScaleProps.mode;
  colorScale.domain = domain;
  colorScale.range = range2;
  colorScale.displayDomain = displayDomain;
  colorScale.update();
}

// packages/ag-charts-core/src/chart/scale/continuousScale.ts
var _ContinuousScale = /*#__PURE__*/ (() => { var _c$22 = class _ContinuousScale extends AbstractScale {
  constructor(domain = [], range2 = []) {
    super();
    this.range = range2;
    this.defaultTickCount = _ContinuousScale.defaultTickCount;
    this.defaultClamp = false;
    // Domain caching to avoid repeated valueOf() calls in hot paths
    this._domain = [];
    this.domainNeedsValueOf = true;
    // Safe default
    this.d0Cache = Number.NaN;
    this.d1Cache = Number.NaN;
    // Exact bigint domain endpoints, retained for the full-precision convert() ratio (see convertBigInt).
    this.d0Big = void 0;
    this.d1Big = void 0;
    this.domain = domain;
  }
  static is(value) {
    return value instanceof _ContinuousScale;
  }
  get domain() {
    return this._domain;
  }
  set domain(values) {
    if (values == null || values.length < 2) {
      this._domain = narrowStoredDomain(values);
      this.d0Big = this.d1Big = void 0;
      this.d0Cache = Number.NaN;
      this.d1Cache = Number.NaN;
      return;
    }
    const d0 = values[0];
    const d1 = values[1];
    if (typeof d0 === "bigint" || typeof d1 === "bigint") {
      this.d0Big = typeof d0 === "bigint" ? d0 : void 0;
      this.d1Big = typeof d1 === "bigint" ? d1 : void 0;
      this.domainNeedsValueOf = false;
      this.d0Cache = Number(d0);
      this.d1Cache = Number(d1);
      this._domain = narrowStoredDomain(values);
      return;
    }
    this.d0Big = this.d1Big = void 0;
    this._domain = narrowStoredDomain(values);
    this.domainNeedsValueOf = d0 != null && typeof d0 === "object";
    if (this.domainNeedsValueOf) {
      this.d0Cache = d0.valueOf();
      this.d1Cache = d1.valueOf();
    } else {
      this.d0Cache = Number(d0);
      this.d1Cache = Number(d1);
    }
  }
  normalizeDomains(...domains) {
    return normalizeContinuousDomains(...domains);
  }
  calcBandwidth(smallestInterval = 1, minWidth = 1) {
    const { domain } = this;
    const rangeDistance = this.getPixelRange();
    if (domain.length === 0)
      return rangeDistance;
    const intervals2 = Math.abs(this.d1Cache - this.d0Cache) / Number(smallestInterval) + 1;
    let bands = intervals2;
    if (minWidth !== 0) {
      const maxBands = Math.floor(rangeDistance);
      bands = Math.min(bands, maxBands);
    }
    return rangeDistance / Math.max(1, bands);
  }
  convert(value, options) {
    const { domain } = this;
    if (domain == null || domain.length < 2 || value == null) {
      return Number.NaN;
    }
    const { range: range2 } = this;
    const clamp2 = options?.clamp ?? this.defaultClamp;
    if (this.d0Big != null && this.d1Big != null && this.transform == null) {
      if (typeof value === "bigint" || typeof value === "number" && Number.isFinite(value)) {
        return convertBigInt(value, this.d0Big, this.d1Big, range2, clamp2);
      }
    }
    let d0 = this.d0Cache;
    let d1 = this.d1Cache;
    let x;
    if (typeof value === "number") {
      x = value;
    } else if (typeof value === "bigint") {
      x = Number(value);
    } else {
      x = value.valueOf();
    }
    if (this.transform) {
      d0 = this.transform(d0);
      d1 = this.transform(d1);
      x = this.transform(x);
    }
    if (clamp2) {
      const [start2, stop] = findMinMax([d0, d1]);
      if (x < start2) {
        return range2[0];
      } else if (x > stop) {
        return range2[1];
      }
    }
    if (d0 === d1) {
      return (range2[0] + range2[1]) / 2;
    } else if (x === d0) {
      return range2[0];
    } else if (x === d1) {
      return range2[1];
    }
    const r0 = range2[0];
    return r0 + (x - d0) / (d1 - d0) * (range2[1] - r0);
  }
  /**
   * Converts `value` after clamping it into the domain extent. Unlike `convert(value, { clamp: true })`,
   * which clamps the output by sorted range order, clamping the input keeps reversed domains oriented so
   * out-of-domain values map to the correct endpoint.
   */
  convertClamped(value) {
    const { d0Big, d1Big } = this;
    if (typeof value === "bigint" && d0Big != null && d1Big != null) {
      const lo2 = minValue(d0Big, d1Big);
      const hi2 = maxValue(d0Big, d1Big);
      return this.convert(minValue(hi2, maxValue(lo2, value)));
    }
    const { d0Cache, d1Cache } = this;
    const lo = Math.min(d0Cache, d1Cache);
    const hi = Math.max(d0Cache, d1Cache);
    return this.convert(Math.min(hi, Math.max(lo, toNumber(value))));
  }
  invert(x, _nearest) {
    const { domain } = this;
    if (domain.length < 2)
      return;
    let d0 = this.d0Cache;
    let d1 = this.d1Cache;
    if (this.transform) {
      d0 = this.transform(d0);
      d1 = this.transform(d1);
    }
    const { range: range2 } = this;
    const [r0, r1] = range2;
    let d;
    if (r0 === r1) {
      d = this.toDomain((d0 + d1) / 2);
    } else {
      d = this.toDomain(d0 + (x - r0) / (r1 - r0) * (d1 - d0));
    }
    return this.transformInvert ? this.transformInvert(d) : d;
  }
  getDomainMinMax() {
    return unpackDomainMinMax(this.domain);
  }
  snapshotDomain() {
    const snapshot = this._domain.slice();
    if (this.d0Big != null)
      snapshot[0] = this.d0Big;
    if (this.d1Big != null)
      snapshot[1] = this.d1Big;
    return snapshot;
  }
  // Returns the exact (possibly bigint) endpoint stored at the given index, preferring the retained
  // bigint over its Number-narrowed copy.
  exactEndpoint(index) {
    return (index === 0 ? this.d0Big : this.d1Big) ?? this._domain[index];
  }
  // True when endpoint 0 is the minimum. Compares exact values so two bigints that narrow to the same
  // Number (differ below one ULP) are still ordered correctly, whatever the stored order.
  startIsMin() {
    return this.exactEndpoint(0) <= this.exactEndpoint(1);
  }
  get domainMin() {
    if (this._domain.length < 2)
      return this._domain.at(0);
    return this.exactEndpoint(this.startIsMin() ? 0 : 1);
  }
  get domainMax() {
    if (this._domain.length < 2)
      return this._domain.at(0);
    return this.exactEndpoint(this.startIsMin() ? 1 : 0);
  }
  getPixelRange() {
    const [a, b] = this.range;
    return Math.abs(b - a);
  }
}; _c$22.defaultTickCount = 5; return _c$22; })()
var ContinuousScale = _ContinuousScale;
function narrowStoredDomain(values) {
  return values.map((v) => typeof v === "bigint" ? Number(v) : v);
}
var BIGINT_RATIO_SCALE = 10n ** 12n;
function convertBigInt(value, d0, d1, range2, clamp2) {
  const r0 = range2[0];
  const r1 = range2[1];
  if (clamp2) {
    const lo = d0 < d1 ? d0 : d1;
    const hi = d0 < d1 ? d1 : d0;
    if (value < lo)
      return r0;
    if (value > hi)
      return r1;
  }
  if (d0 === d1) {
    return (r0 + r1) / 2;
  }
  let whole;
  let fraction = 0;
  if (typeof value === "number") {
    const truncated = Math.trunc(value);
    whole = BigInt(truncated);
    fraction = value - truncated;
  } else {
    whole = value;
  }
  if (fraction === 0) {
    if (whole === d0)
      return r0;
    if (whole === d1)
      return r1;
  }
  const span = d1 - d0;
  const ratioBig = (whole - d0) * BIGINT_RATIO_SCALE / span;
  const ratio2 = Number(ratioBig) / Number(BIGINT_RATIO_SCALE) + fraction / Number(span);
  return r0 + ratio2 * (r1 - r0);
}
function normalizeContinuousDomains(...domains) {
  let min;
  let max;
  for (const input of domains) {
    for (const d of input.domain) {
      if (min === void 0 || d < min) {
        min = d;
      }
      if (max === void 0 || d > max) {
        max = d;
      }
    }
  }
  if (min != null && max != null) {
    return { domain: [min, max], animatable: true };
  } else {
    return { domain: [], animatable: false };
  }
}

// packages/ag-charts-core/src/chart/scale/discreteTimeScale.ts
var APPROXIMATE_THRESHOLD = 1e3;
var SAMPLE_POINTS = 20;
function checkUniformityBySampling(bands, startIdx = 0, endIdx = bands.length - 1) {
  const n = endIdx - startIdx + 1;
  if (!Number.isFinite(n) || n < 2)
    return { isUniform: false };
  if (startIdx < 0 || endIdx >= bands.length)
    return { isUniform: false };
  const indices = Array.from(
    { length: SAMPLE_POINTS },
    (_, i) => startIdx + Math.floor(i * (n - 1) / (SAMPLE_POINTS - 1))
  );
  const samples = indices.map((i) => bands[i].valueOf());
  const expectedInterval = (samples.at(-1) - samples[0]) / (n - 1);
  if (!Number.isFinite(expectedInterval) || expectedInterval === 0) {
    return { isUniform: false };
  }
  const tolerance = Math.abs(expectedInterval * 0.01);
  for (let i = 1; i < samples.length; i++) {
    const indexGap = indices[i] - indices[i - 1];
    const actualInterval = (samples[i] - samples[i - 1]) / indexGap;
    if (Math.abs(actualInterval - expectedInterval) > tolerance) {
      return { isUniform: false };
    }
  }
  return { isUniform: true, interval: expectedInterval };
}
var DiscreteTimeScale = class _DiscreteTimeScale extends BandScale {
  static is(value) {
    return value instanceof _DiscreteTimeScale;
  }
  toDomain(value) {
    return new Date(timeValueToNumber(value));
  }
  get reversed() {
    const { domain } = this;
    return domain.length > 0 && domain[0].valueOf() > domain.at(-1).valueOf();
  }
  /** Cached numeric band values for efficient binary search. Subclasses should override with a cached version. */
  get numericBands() {
    return this.bands.map((d) => d.valueOf());
  }
  /** Exclusive end of the last band; subclasses with a known band width override this. */
  get lastBandEnd() {
    return this.numericBands.at(-1);
  }
  convert(value, options) {
    this.refresh();
    if (!(value instanceof Date))
      value = new Date(timeValueToNumber(value));
    const { domain, reversed } = this;
    const numericBands = this.numericBands;
    const bandCount = numericBands.length;
    if (domain.length <= 0)
      return Number.NaN;
    const r0 = this.ordinalRange(0);
    const r1 = this.ordinalRange(bandCount - 1);
    if (bandCount === 0)
      return r0;
    const alignment = options?.alignment ?? 0 /* Leading */;
    if (options?.clamp === true) {
      const { range: range2 } = this;
      const v2 = value.valueOf();
      const lastBand = numericBands.at(-1);
      if (v2 < numericBands[0])
        return range2[0];
      if (v2 > lastBand && (alignment !== 0 /* Leading */ || v2 >= this.lastBandEnd))
        return range2[1];
    }
    if (alignment !== 2 /* Interpolate */) {
      const r2 = super.convert(value, options);
      return reversed ? r1 - (r2 - r0) : r2;
    }
    const v = value.valueOf();
    let bandIndex = this.findIndex(value) ?? 0;
    let dIndex;
    if (reversed) {
      bandIndex = Math.min(Math.max(bandIndex, 1), bandCount - 1);
      dIndex = -1;
    } else {
      bandIndex = Math.min(Math.max(bandIndex, 0), bandCount - 2);
      dIndex = 1;
    }
    const v0 = numericBands[bandIndex];
    const v1 = numericBands[bandIndex + dIndex];
    const vr0 = this.ordinalRange(bandIndex);
    const vr1 = this.ordinalRange(bandIndex + dIndex);
    const ratio2 = (v - v0) / (v1 - v0);
    const r = ratio2 * (vr1 - vr0) + vr0;
    return reversed ? r1 - (r - r0) : r;
  }
  invert(position, nearest = false) {
    this.refresh();
    const { domain } = this;
    if (domain.length <= 0)
      return;
    const bands = this.bands;
    const bandCount = this.getBandCountForUpdate();
    const reversed = domain[0].valueOf() > domain.at(-1).valueOf();
    let index;
    if (nearest) {
      index = this.invertNearestIndex(position - this.bandwidth / 2);
    } else {
      const closestIndex = findMinIndex(0, bandCount - 1, (i) => {
        const p = this.ordinalRange(i);
        return p >= position;
      });
      index = closestIndex ?? bandCount - 1;
    }
    return bands[reversed ? bandCount - 1 - index : index];
  }
  /** Override in subclass to provide cached uniformity check result */
  getUniformityCache(_visibleRange) {
    return void 0;
  }
  findIndex(value, alignment = 0 /* Leading */, alignmentExclusive = false) {
    if (value == null)
      return void 0;
    const numericBands = this.numericBands;
    const n = numericBands.length;
    if (n === 0)
      return void 0;
    if (n === 1)
      return 0;
    const target = value.valueOf();
    const isTrailing = alignment === 1 /* Trailing */;
    if (isTrailing !== alignmentExclusive) {
      return findMinIndex(0, n - 1, (index) => numericBands[index] >= target);
    }
    return findMaxIndex(0, n - 1, (index) => numericBands[index] <= target);
  }
};

// packages/ag-charts-core/src/chart/scale/groupedCategoryScale.ts
var MAX_ANIMATABLE_NODES = 1e3;
var GroupedCategoryScale = class _GroupedCategoryScale extends CategoryScale {
  constructor() {
    super(...arguments);
    this.previousDomainJson = void 0;
    /** Whether the current domain update is animatable (initial load or no domain change). */
    this.animatable = true;
  }
  static is(value) {
    return value instanceof _GroupedCategoryScale;
  }
  set domain(values) {
    if (values.length <= MAX_ANIMATABLE_NODES) {
      const currentDomainJson = JSON.stringify(values);
      this.animatable = this.previousDomainJson === void 0 || this.previousDomainJson === currentDomainJson;
      this.previousDomainJson = currentDomainJson;
    } else {
      this.animatable = this.previousDomainJson === void 0;
      this.previousDomainJson = "";
    }
    super.domain = values;
  }
  get domain() {
    return super.domain;
  }
  normalizeDomains(...domains) {
    const { domain } = super.normalizeDomains(...domains);
    return { domain, animatable: false };
  }
  findIndex(value) {
    return super.findIndex(value) ?? this.getMatchIndex(value);
  }
  getMatchIndex(value) {
    const key = JSON.stringify(value);
    const match = this._domain.find((d) => JSON.stringify(d) === key);
    if (match != null) {
      return super.findIndex(match);
    }
  }
};

// packages/ag-charts-core/src/chart/scale/irregularBandScale.ts
var IrregularBandScale = class extends BandScale {
  constructor() {
    super(...arguments);
    this.type = "category";
    // TODO: 'irregular-band'?
    this.defaultTickCount = 0;
    this._hasFixedWidth = false;
    this._paddingInnerWidth = 0;
    this._domain = [];
    this._bandRanges = /* @__PURE__ */ new Map();
  }
  set domain(values) {
    if (this._domain === values)
      return;
    if (values.length === 0) {
      this._bandRanges.clear();
      this._hasFixedWidth = false;
    }
    this.invalid = true;
    this._domain = values;
  }
  get domain() {
    return this._domain;
  }
  get bands() {
    return this.domain;
  }
  get paddingInnerWidth() {
    if (this._hasFixedWidth)
      return this._paddingInnerWidth;
    return this.paddingInner * this._bandwidth;
  }
  addBand(groupIndex, stackIndex, value) {
    this._domain.push(this.getDomainValue(groupIndex, stackIndex));
    if (!this._bandRanges.has(groupIndex)) {
      this._bandRanges.set(groupIndex, /* @__PURE__ */ new Map());
    }
    this._bandRanges.get(groupIndex).set(stackIndex, value);
    this._hasFixedWidth || (this._hasFixedWidth = value != null);
    this.invalid = true;
  }
  getDomainValue(groupIndex, stackIndex) {
    return `${groupIndex}-${stackIndex}`;
  }
  findIndex(value) {
    let index = 0;
    for (const key of this._bandRanges.keys()) {
      if (key === value)
        return index;
      index++;
    }
  }
  convert(domainValue) {
    const { _bandwidth, _bandRanges, _inset, _paddingInnerWidth } = this;
    let value = _inset;
    const valueDs = domainValue.split("-");
    const valueGroupIndex = Number(valueDs[0]);
    if (!this._hasFixedWidth) {
      return super.convert(valueGroupIndex);
    }
    for (let i = 0; i < valueGroupIndex; i++) {
      const stacks = _bandRanges.get(i);
      if (!stacks) {
        value += _paddingInnerWidth;
        continue;
      }
      let maxStackWidth = 0;
      for (const width2 of stacks.values()) {
        maxStackWidth = Math.max(maxStackWidth, width2 == null ? _bandwidth : width2);
      }
      value += maxStackWidth + _paddingInnerWidth;
    }
    return value;
  }
  invert(_value, _nearest) {
    return;
  }
  getBandCountForUpdate() {
    return this._bandRanges.size;
  }
  update() {
    if (!this._hasFixedWidth) {
      return super.update();
    }
    const [r0, r1] = this.range;
    let { paddingInner } = this;
    const bandCount = this.getBandCountForUpdate();
    if (bandCount === 0)
      return;
    let totalBandRange = 0;
    let bandCountWithUnfixedWidths = bandCount;
    let bandCountWithOnlyFixedWidths = bandCount;
    for (const stacks of this._bandRanges.values()) {
      let maxStackWidth = 0;
      let hasUnfixed = false;
      for (const width2 of stacks.values()) {
        if (width2 == null) {
          hasUnfixed = true;
          continue;
        }
        maxStackWidth = Math.max(maxStackWidth, width2);
      }
      if (hasUnfixed) {
        bandCountWithOnlyFixedWidths -= 1;
      } else {
        bandCountWithUnfixedWidths -= 1;
        totalBandRange += maxStackWidth;
      }
    }
    if (bandCount === 1) {
      paddingInner = 0;
    }
    const targetRangeDistance = r1 - r0;
    const paddingInnerWidth = targetRangeDistance / bandCount * paddingInner;
    const actualRangeDistance = totalBandRange + paddingInnerWidth * (bandCount - 1);
    const rangeDiff = targetRangeDistance - actualRangeDistance;
    let inset = r0;
    let rawBandwidth = bandCountWithUnfixedWidths > 0 && rangeDiff >= 0 ? rangeDiff / bandCountWithUnfixedWidths : targetRangeDistance / bandCount;
    let bandwidth = rawBandwidth;
    if (bandCountWithOnlyFixedWidths === bandCount && rangeDiff > 0) {
      inset += rangeDiff / 2;
    }
    const round3 = this.round && Math.floor(bandwidth) > 0;
    if (round3) {
      bandwidth = Math.round(bandwidth);
    }
    if (rangeDiff < 0) {
      rawBandwidth = 0;
      bandwidth = 0;
    }
    this._inset = inset;
    this._bandwidth = bandwidth;
    this._rawBandwidth = rawBandwidth;
    this._paddingInnerWidth = paddingInnerWidth;
  }
  normalizeDomains(..._domains) {
    return { domain: [], animatable: false };
  }
  toDomain(_value) {
    return void 0;
  }
};

// packages/ag-charts-core/src/chart/scale/linearScale.ts
var LinearScale = class _LinearScale extends ContinuousScale {
  constructor() {
    super([0, 1], [0, 1]);
    this.type = "number";
  }
  static is(value) {
    return value instanceof _LinearScale;
  }
  static getTickStep(start2, stop, ticks) {
    const { interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount } = ticks;
    return interval == null ? tickStep(start2, stop, tickCount, minTickCount, maxTickCount) : Number(interval);
  }
  toDomain(d) {
    if (isBigInt(this.domainMin) && isBigInt(this.domainMax) && (isBigInt(d) || Number.isInteger(d))) {
      return BigInt(d);
    }
    return d;
  }
  ticks({ interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount }, domain = this.domain, visibleRange) {
    if (domain == null || domain.length < 2 || tickCount < 1) {
      return { ticks: [], count: 0, firstTickIndex: 0 };
    }
    const [b0, b1] = domain;
    const isBigIntDomain = typeof b0 === "bigint" && typeof b1 === "bigint";
    const fullRange = visibleRange == null || visibleRange[0] === 0 && visibleRange[1] === 1;
    if (isBigIntDomain && interval == null && fullRange) {
      const ticks = createBigIntTicks(b0, b1, tickCount);
      return { ticks, count: ticks.length, firstTickIndex: 0 };
    }
    const numericDomain = domain.map(Number);
    if (!numericDomain.every(Number.isFinite)) {
      return { ticks: [], count: 0, firstTickIndex: 0 };
    }
    const [d0, d1] = numericDomain;
    let intervalIgnored;
    if (interval != null && interval !== 0 && !Number.isNaN(interval)) {
      const step = Math.abs(Number(interval));
      if (!isDenseInterval((d1 - d0) / step, this.getPixelRange(), this.logger)) {
        return range(d0, d1, step, visibleRange);
      }
      intervalIgnored = true;
    }
    const result = createTicks(
      d0,
      d1,
      tickCount,
      minTickCount,
      maxTickCount,
      visibleRange
    );
    if (intervalIgnored)
      result.intervalIgnored = true;
    return result;
  }
  niceDomain(ticks, domain = this.domain) {
    if (domain.length < 2)
      return [];
    const { tickCount = ContinuousScale.defaultTickCount } = ticks;
    const [b0, b1] = domain;
    const isBigIntDomain = typeof b0 === "bigint" && typeof b1 === "bigint";
    if (isBigIntDomain && ticks.interval == null) {
      const [n0, n1] = niceBigIntDomain(b0, b1, tickCount);
      return [ticks.nice[0] ? n0 : b0, ticks.nice[1] ? n1 : b1];
    }
    const numericDomain = domain.map(Number);
    let [start2, stop] = numericDomain;
    if (tickCount === 1 && ticks.interval == null) {
      [start2, stop] = niceTicksDomain(start2, stop);
    } else if (tickCount >= 1) {
      const roundStart = start2 > stop ? Math.ceil : Math.floor;
      const roundStop = start2 > stop ? Math.floor : Math.ceil;
      const maxAttempts = 4;
      for (let i = 0; i < maxAttempts; i++) {
        const prev0 = start2;
        const prev1 = stop;
        const step = _LinearScale.getTickStep(start2, stop, ticks);
        const [d0, d1] = numericDomain;
        start2 = roundStart(d0 / step) * step;
        stop = roundStop(d1 / step) * step;
        if (start2 === prev0 && stop === prev1)
          break;
      }
    }
    return [ticks.nice[0] ? start2 : numericDomain[0], ticks.nice[1] ? stop : numericDomain[1]];
  }
};

// packages/ag-charts-core/src/chart/scale/logScale.ts
var logFunctions = {
  2: (_base, x) => Math.log2(x),
  [Math.E]: (_base, x) => Math.log(x),
  10: (_base, x) => Math.log10(x)
};
var DEFAULT_LOG = (base, x) => Math.log(x) / Math.log(base);
function log2(base, domain, x) {
  const start2 = Math.min(...domain);
  const fn = logFunctions[base] ?? DEFAULT_LOG;
  return start2 >= 0 ? fn(base, x) : -fn(base, -x);
}
var powFunctions = {
  [Math.E]: (_base, x) => Math.exp(x),
  10: (_base, x) => x >= 0 ? 10 ** x : 1 / 10 ** -x
};
var DEFAULT_POW = (base, x) => base ** x;
function pow(base, domain, x) {
  const start2 = Math.min(...domain);
  const fn = powFunctions[base] ?? DEFAULT_POW;
  return start2 >= 0 ? fn(base, x) : -fn(base, -x);
}
var LogScale = class _LogScale extends ContinuousScale {
  constructor(d = [1, 10], r = [0, 1]) {
    super(d, r);
    this.type = "log";
    // Handling <1 and crossing 0 cases is tricky, easiest solution is to default to clamping.
    this.defaultClamp = true;
    this.base = 10;
    this.log = (x) => log2(this.base, this.domain, x);
    this.pow = (x) => pow(this.base, this.domain, x);
  }
  static is(value) {
    return value instanceof _LogScale;
  }
  transform(x) {
    const [min, max] = findMinMax(this.domain);
    if (min >= 0 !== max >= 0)
      return Number.NaN;
    return min >= 0 ? Math.log(x) : -Math.log(-x);
  }
  transformInvert(x) {
    const [min, max] = findMinMax(this.domain);
    if (min >= 0 !== max >= 0)
      return Number.NaN;
    return min >= 0 ? Math.exp(x) : -Math.exp(-x);
  }
  toDomain(d) {
    return d;
  }
  niceDomain(ticks, domain = this.domain) {
    if (domain.length < 2)
      return [];
    domain = domain.map(Number);
    const { base } = this;
    const [d0, d1] = domain;
    const roundStart = d0 > d1 ? Math.ceil : Math.floor;
    const roundStop = d0 > d1 ? Math.floor : Math.ceil;
    const n0 = pow(base, domain, roundStart(log2(base, domain, d0)));
    const n1 = pow(base, domain, roundStop(log2(base, domain, d1)));
    return [ticks.nice[0] ? n0 : domain[0], ticks.nice[1] ? n1 : domain[1]];
  }
  ticks({ interval, tickCount = ContinuousScale.defaultTickCount }, domain = this.domain, visibleRange) {
    if (domain == null || domain.length < 2 || tickCount < 1) {
      return;
    }
    domain = domain.map(Number);
    const base = this.base;
    const [d0, d1] = domain;
    const start2 = Math.min(d0, d1);
    const stop = Math.max(d0, d1);
    let p0 = this.log(start2);
    let p1 = this.log(stop);
    let intervalIgnored;
    if (interval != null && interval !== 0 && !Number.isNaN(interval)) {
      const inBounds = (tick) => tick >= start2 && tick <= stop;
      const step = Math.min(Math.abs(interval), Math.abs(p1 - p0));
      const { ticks: rangeTicks, count, firstTickIndex } = range(p0, p1, step, visibleRange);
      const ticks2 = rangeTicks.map(this.pow).filter(inBounds);
      if (!isDenseInterval(ticks2.length, this.getPixelRange(), this.logger)) {
        return { ticks: ticks2, count, firstTickIndex };
      }
      intervalIgnored = true;
    }
    if (!isInteger(base) || p1 - p0 >= tickCount) {
      const step = Math.min(p1 - p0, tickCount);
      const { ticks: ticks2, count, firstTickIndex } = createTicks(p0, p1, step, void 0, void 0, visibleRange);
      const result2 = { ticks: ticks2.map(this.pow), count, firstTickIndex };
      if (intervalIgnored)
        result2.intervalIgnored = true;
      return result2;
    }
    const ticks = [];
    const isPositive = start2 > 0;
    p0 = Math.floor(p0) - 1;
    p1 = Math.round(p1) + 1;
    const availableSpacing = findRangeExtent(this.range) / tickCount;
    let lastTickPosition = Infinity;
    for (let p = p0; p <= p1; p++) {
      const nextMagnitudeTickPosition = this.convert(this.pow(p + 1));
      for (let k = 1; k < base; k++) {
        const q = isPositive ? k : base - k + 1;
        const t = this.pow(p) * q;
        const tickPosition = this.convert(t);
        const prevSpacing = Math.abs(lastTickPosition - tickPosition);
        const nextSpacing = Math.abs(tickPosition - nextMagnitudeTickPosition);
        const fits = prevSpacing >= availableSpacing && nextSpacing >= availableSpacing;
        if (t >= start2 && t <= stop && (k === 1 || fits || ticks.length === 0)) {
          ticks.push(t);
          lastTickPosition = tickPosition;
        }
      }
    }
    const result = filterVisibleTicks(ticks, isPositive, visibleRange);
    if (intervalIgnored)
      result.intervalIgnored = true;
    return result;
  }
};

// packages/ag-charts-core/src/chart/scale/timeScale.ts
var sunday = /*#__PURE__*/ new Date(1970, 0, 4);
var TimeScale = class _TimeScale extends ContinuousScale {
  constructor() {
    super([], [0, 1]);
    this.type = "time";
  }
  static is(value) {
    return value instanceof _TimeScale;
  }
  toDomain(d) {
    return new Date(d);
  }
  convert(value, options) {
    return super.convert(value == null ? Number.NaN : timeValueToNumber(value), options);
  }
  invert(value) {
    return new Date(super.invert(value));
  }
  niceDomain(ticks, domain = this.domain) {
    if (domain.length < 2)
      return [];
    let [d0, d1] = domain;
    const maxAttempts = 4;
    const availableRange = this.getPixelRange();
    for (let i = 0; i < maxAttempts; i++) {
      const [n0, n1] = updateNiceDomainIteration(d0, d1, ticks, availableRange, this.logger);
      if (dateToNumber(d0) === dateToNumber(n0) && dateToNumber(d1) === dateToNumber(n1)) {
        break;
      }
      d0 = n0;
      d1 = n1;
    }
    return [d0, d1];
  }
  /**
   * Returns uniformly-spaced dates that represent the scale's domain.
   */
  ticks(params, domain = this.domain, visibleRange = [0, 1], { extend = false } = {}) {
    const { nice, interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount } = params;
    if (domain.length < 2)
      return;
    const timestamps = domain.map(dateToNumber);
    const start2 = timestamps[0];
    const stop = timestamps.at(-1);
    if (interval != null) {
      const availableRange = this.getPixelRange();
      const intervalTicks = getDateTicksForInterval({
        start: start2,
        stop,
        interval,
        availableRange,
        visibleRange,
        extend,
        logger: this.logger
      });
      const intervalIgnored = intervalTicks == null;
      const result = {
        ticks: intervalTicks ?? getDefaultDateTicks({ start: start2, stop, tickCount, minTickCount, maxTickCount, visibleRange, extend }),
        count: void 0
      };
      if (intervalIgnored)
        result.intervalIgnored = true;
      return result;
    } else if (nice.every(Boolean) && tickCount === 2) {
      return { ticks: domain, count: void 0 };
    } else if (nice.every(Boolean) && tickCount === 1) {
      return { ticks: domain.slice(0, 1), count: void 0 };
    }
    const timeInterval3 = getTickTimeInterval(start2, stop, tickCount, minTickCount, maxTickCount, {
      weekStart: sunday
    });
    if (timeInterval3 == null)
      return;
    const ticks = intervalRange(timeInterval3, new Date(start2), new Date(stop), { visibleRange, extend });
    const firstTickIndex = intervalRangeStartIndex(timeInterval3, new Date(start2), new Date(stop), {
      visibleRange,
      extend
    });
    return {
      ticks,
      count: void 0,
      firstTickIndex,
      timeInterval: timeInterval3
    };
  }
};
function getDefaultDateTicks({
  start: start2,
  stop,
  tickCount,
  minTickCount,
  maxTickCount,
  visibleRange,
  extend
}) {
  const t = getTickTimeInterval(start2, stop, tickCount, minTickCount, maxTickCount, { weekStart: sunday });
  return t ? intervalRange(t, new Date(start2), new Date(stop), { visibleRange, extend }) : [];
}
function getDateTicksForInterval({
  start: start2,
  stop,
  interval,
  availableRange,
  visibleRange,
  extend,
  logger
}) {
  if (interval == null) {
    return [];
  }
  if (typeof interval !== "number") {
    const ticks2 = intervalRange(interval, new Date(start2), new Date(stop), { visibleRange, extend });
    if (isDenseInterval(ticks2.length, availableRange, logger)) {
      return;
    }
    return ticks2;
  }
  const absInterval = Math.abs(interval);
  if (isDenseInterval(Math.abs(stop - start2) / absInterval, availableRange, logger))
    return;
  const tickInterval = TickIntervals.findLast((t) => absInterval % t.duration === 0);
  if (tickInterval) {
    const { timeInterval: timeInterval3, step, duration } = tickInterval;
    const alignedInterval = {
      ...timeInterval3,
      step: step * intervalStep(timeInterval3) * Math.round(absInterval / duration),
      epoch: defaultEpoch(timeInterval3, { weekStart: sunday })
    };
    return intervalRange(alignedInterval, new Date(start2), new Date(stop), { visibleRange, extend });
  }
  let date2 = new Date(Math.min(start2, stop));
  const stopDate = new Date(Math.max(start2, stop));
  const ticks = [];
  while (date2 <= stopDate) {
    ticks.push(date2);
    date2 = new Date(date2);
    date2.setMilliseconds(date2.getMilliseconds() + absInterval);
  }
  return ticks;
}
function updateNiceDomainIteration(d0, d1, ticks, availableRange, logger) {
  const { interval } = ticks;
  const start2 = Math.min(dateToNumber(d0), dateToNumber(d1));
  const stop = Math.max(dateToNumber(d0), dateToNumber(d1));
  let i;
  if (interval != null && typeof interval !== "number") {
    i = interval;
  } else {
    let tickCount;
    if (typeof interval === "number") {
      tickCount = (stop - start2) / Math.max(interval, 1);
      if (isDenseInterval(tickCount, availableRange, logger)) {
        tickCount = void 0;
      }
    }
    tickCount ?? (tickCount = ticks.tickCount ?? ContinuousScale.defaultTickCount);
    i = getTickTimeInterval(start2, stop, tickCount, ticks.minTickCount, ticks.maxTickCount, { weekStart: sunday });
  }
  if (i == null)
    return [d0, d1];
  const domain = intervalRange(i, new Date(start2), new Date(stop), { extend: true });
  if (domain == null || domain.length < 2)
    return [d0, d1];
  const r0 = domain[0];
  const r1 = domain.at(-1);
  return d0 <= d1 ? [r0, r1] : [r1, r0];
}

// packages/ag-charts-core/src/chart/scale/ordinalTimeScale.ts
var APPROXIMATE_THRESHOLD2 = 1e3;
var OrdinalTimeScale = class _OrdinalTimeScale extends DiscreteTimeScale {
  constructor() {
    super(...arguments);
    this.type = "ordinal-time";
    this.defaultTickCount = ContinuousScale.defaultTickCount;
    this._domain = [];
    this.isReversed = false;
  }
  static is(value) {
    return value instanceof _OrdinalTimeScale;
  }
  set domain(domain) {
    if (domain === this._domain)
      return;
    this.invalid = true;
    this._domain = domain;
    this._bands = void 0;
    this._numericBands = void 0;
    this._uniformityCache = void 0;
    this._uniformityCacheVisibleStart = void 0;
    this._uniformityCacheVisibleEnd = void 0;
    this._uniformityCacheVisible = void 0;
    this.isReversed = domainReversed(domain);
  }
  get domain() {
    return this._domain;
  }
  get bands() {
    this._bands ?? (this._bands = this.isReversed ? this.domain.slice().reverse() : this.domain);
    return this._bands;
  }
  get numericBands() {
    this._numericBands ?? (this._numericBands = this.bands.map((d) => d.valueOf()));
    return this._numericBands;
  }
  getUniformityCache(visibleRange) {
    const { bands } = this;
    const n = bands.length;
    if (!visibleRange || visibleRange[0] === 0 && visibleRange[1] === 1) {
      if (n > APPROXIMATE_THRESHOLD2 && this._uniformityCache === void 0) {
        this._uniformityCache = checkUniformityBySampling(bands);
      }
      return this._uniformityCache;
    }
    const startIdx = Math.floor(visibleRange[0] * n);
    const endIdx = Math.min(Math.ceil(visibleRange[1] * n), n - 1);
    if (this._uniformityCacheVisible !== void 0 && this._uniformityCacheVisibleStart === startIdx && this._uniformityCacheVisibleEnd === endIdx) {
      return this._uniformityCacheVisible;
    }
    const result = checkUniformityBySampling(bands, startIdx, endIdx);
    this._uniformityCacheVisibleStart = startIdx;
    this._uniformityCacheVisibleEnd = endIdx;
    this._uniformityCacheVisible = result;
    return result;
  }
  normalizeDomains(...domains) {
    const nonEmptyDomains = domains.filter((d) => d.domain.length > 0);
    if (nonEmptyDomains.length === 0) {
      return { domain: [], animatable: false };
    }
    const firstDomain = nonEmptyDomains[0].domain;
    const allSame = nonEmptyDomains.every((d) => d.domain === firstDomain);
    if (nonEmptyDomains.length === 1 || allSame) {
      const input = nonEmptyDomains[0];
      let domain = input.domain;
      let sortOrder;
      let isUnique = false;
      if (input.sortMetadata?.sortOrder === void 0) {
        sortOrder = datesSortOrder(domain);
      } else {
        sortOrder = input.sortMetadata.sortOrder;
        isUnique = input.sortMetadata.isUnique ?? false;
      }
      if (sortOrder === -1) {
        domain = domain.slice().reverse();
      } else if (sortOrder == null) {
        domain = isUnique ? domain.slice().sort((a, b) => a.valueOf() - b.valueOf()) : sortAndUniqueDates(domain.slice());
      }
      return { domain, animatable: true };
    }
    return {
      domain: sortAndUniqueDates(nonEmptyDomains.flatMap((d) => d.domain)),
      animatable: true
    };
  }
  ticks(params, domain, visibleRange = [0, 1], { extend = false, dropInitial = false } = {}) {
    const { interval, maxTickCount, tickCount = maxTickCount } = params;
    const { bands, reversed } = this;
    if (bands.length === 0)
      return;
    if (reversed) {
      visibleRange = [1 - visibleRange[1], 1 - visibleRange[0]];
    }
    this.refresh();
    if (interval == null) {
      const { ticks: ticks2, tickOffset, tickEvery } = this.getDefaultTicks(domain, tickCount, visibleRange, extend);
      let firstTickIndex = ticks2.length > 0 ? this.findIndex(ticks2[0]) : void 0;
      firstTickIndex = firstTickIndex == null ? void 0 : Math.floor((firstTickIndex - tickOffset) / tickEvery);
      return { ticks: ticks2, count: void 0, firstTickIndex };
    }
    let start2;
    let stop;
    if (domain && domain.length >= 2) {
      start2 = domain[0].valueOf();
      stop = domain.at(-1).valueOf();
    } else {
      start2 = bands[0].valueOf();
      stop = bands.at(-1).valueOf();
    }
    const [r0, r1] = this.range;
    const availableRange = Math.abs(r1 - r0);
    const intervalTicks = getDateTicksForInterval({
      start: start2,
      stop,
      interval,
      availableRange,
      visibleRange,
      extend,
      logger: this.logger
    });
    const intervalIgnored = intervalTicks == null;
    const dateTicks = intervalTicks ?? this.getDefaultTicks(domain, tickCount, visibleRange, extend).ticks;
    const ticks = [];
    let lastIndex = -1;
    for (const dateTick of dateTicks) {
      const index = this.findIndex(dateTick, 1 /* Trailing */) ?? -1;
      const duplicated = index === lastIndex;
      lastIndex = index;
      if (!(dropInitial && index === 0) && index !== -1 && !duplicated) {
        ticks.push(bands[index]);
      }
    }
    const result = { ticks, count: void 0, firstTickIndex: void 0 };
    if (intervalIgnored)
      result.intervalIgnored = true;
    return result;
  }
  stepTicks(bandStep, domain, visibleRange = [0, 1], dropLast = true) {
    const bandIndices = domain ? this.bandDomainIndices(domain) : void 0;
    const ticks = this.ticksEvery(bandIndices, visibleRange, bandStep, 0, false);
    const lastTick = ticks.at(-1);
    const lastBandIndex = dropLast && bandStep > 1 ? bandIndices?.[1] : void 0;
    const lastTickIndex = lastBandIndex != null && lastTick != null ? this.findIndex(lastTick) : void 0;
    if (lastTickIndex != null && lastBandIndex != null && lastBandIndex - lastTickIndex < bandStep) {
      ticks.pop();
    }
    return ticks;
  }
  bandCount(visibleRange = [0, 1]) {
    const { domain } = this;
    const startIndex = Math.floor(visibleRange[0] * domain.length);
    const endIndex = Math.ceil(visibleRange[1] * domain.length);
    return endIndex - startIndex;
  }
  getDefaultTicks(domain, maxTickCount, visibleRange, extend) {
    const { bands } = this;
    const tickEvery = Math.ceil(bands.length / maxTickCount);
    const tickOffset = Math.floor(tickEvery / 2);
    const bandIndices = domain ? this.bandDomainIndices(domain) : void 0;
    return {
      ticks: this.ticksEvery(bandIndices, visibleRange, tickEvery, tickOffset, extend),
      tickOffset,
      tickEvery
    };
  }
  bandDomainIndices(domain) {
    const isReversed = domainReversed(domain);
    const i0 = this.findIndex(domain[isReversed ? domain.length - 1 : 0], 1 /* Trailing */) ?? 0;
    const i1 = this.findIndex(domain[isReversed ? 0 : domain.length - 1], 1 /* Trailing */) ?? this.bands.length - 1;
    return [i0, i1];
  }
  ticksEvery([i0, i1] = [0, this.bands.length], visibleRange, tickEvery, tickOffset, extend) {
    const { bands } = this;
    const offset = i0;
    const span = i1 - i0 + 1;
    let startIndex = offset + Math.floor(visibleRange[0] * span);
    let endIndex = offset + Math.ceil(visibleRange[1] * span);
    if (extend) {
      startIndex -= tickEvery;
      endIndex += tickEvery;
    }
    startIndex = Math.max(startIndex, 0);
    endIndex = Math.min(endIndex, bands.length);
    let ticks;
    if (tickEvery <= 1) {
      ticks = bands.slice(startIndex, endIndex);
    } else {
      ticks = [];
      for (let index = startIndex; index < endIndex; index += 1) {
        if ((index - offset + tickOffset) % tickEvery === 0) {
          ticks.push(bands[index]);
        }
      }
    }
    return ticks;
  }
};
function domainReversed(domain) {
  return domain.length > 0 && domain[0] > domain.at(-1);
}

// packages/ag-charts-core/src/chart/scale/unitTimeScale.ts
var APPROXIMATE_THRESHOLD3 = 1e3;
var MAX_BANDS = 5e7;
var UnitTimeScale = class _UnitTimeScale extends DiscreteTimeScale {
  constructor() {
    super(...arguments);
    this.type = "unit-time";
    this.defaultTickCount = Infinity;
    this._domain = [];
    this._bands = void 0;
  }
  static is(value) {
    return value instanceof _UnitTimeScale;
  }
  static supportsInterval(domain, interval) {
    return supportsInterval(domain, interval);
  }
  set domain(domain) {
    if (domain === this._domain)
      return;
    const skipCacheInvalidation = domain.length === this._domain.length && domain.length >= 2 && domain[0].valueOf() === this._domain[0].valueOf() && domain[1].valueOf() === this._domain[1].valueOf();
    this._domain = domain;
    if (!skipCacheInvalidation) {
      this.invalidateCaches();
    }
  }
  get domain() {
    return this._domain;
  }
  get interval() {
    return this._interval;
  }
  set interval(interval) {
    const normalized2 = interval == null ? void 0 : toTimeInterval(interval);
    if (this._interval?.unit === normalized2?.unit && this._interval?.step === normalized2?.step)
      return;
    this._interval = normalized2;
    this.invalidateCaches();
  }
  invalidateCaches() {
    this._bands = void 0;
    this._numericBands = void 0;
    this._uniformityCache = void 0;
    this._domainBoundaries = void 0;
    this._bandRangeCache = void 0;
    this._encodedBands = void 0;
    this._encodingParams = void 0;
    this._linearParams = void 0;
  }
  get bands() {
    if (this._bands === void 0) {
      this.ensureEncodedBands();
      if (this._encodedBands != null && this._encodingParams != null) {
        const params = this._encodingParams;
        this._bands = this._encodedBands.map((e) => decodeIntervalValue(e, params));
      } else {
        this._bands = [];
      }
    }
    return this._bands;
  }
  get numericBands() {
    if (this._numericBands === void 0) {
      this.ensureEncodedBands();
      if (this._encodedBands != null && this._encodingParams != null) {
        const params = this._encodingParams;
        this._numericBands = this._encodedBands.map((e) => encodedToTimestamp(e, params));
      } else {
        this._numericBands = [];
      }
    }
    return this._numericBands;
  }
  /**
   * Ensure encoded bands are computed. This is the numeric-first optimization:
   * we compute just the encoded values (cheap numbers) and defer Date creation.
   */
  ensureEncodedBands() {
    if (this._encodedBands !== void 0)
      return;
    const { domain, interval } = this;
    if (domain.length < 2 || interval == null) {
      this._encodedBands = [];
      return;
    }
    const bandRange = this.getCachedBandRange();
    if (bandRange == null) {
      this._encodedBands = [];
      return;
    }
    const [start2, stop] = bandRange;
    const rangeParams = { visibleRange: [0, 1], extend: false };
    if (intervalRangeCount(interval, start2, stop, rangeParams) > MAX_BANDS) {
      this.logger.warnOnce(`the configured unit results in too many bands, ignoring. Supply a larger unit.`);
      this._encodedBands = [];
      return;
    }
    const { encodedValues, encodingParams } = intervalRangeNumeric(interval, start2, stop, rangeParams);
    this._encodedBands = encodedValues;
    this._encodingParams = encodingParams;
  }
  /** Override to return band count without triggering Date materialization */
  getBandCountForUpdate() {
    this.ensureEncodedBands();
    return this._encodedBands?.length ?? 0;
  }
  getUniformityCache(visibleRange) {
    const n = this.getBandCountForUpdate();
    if (!visibleRange || visibleRange[0] === 0 && visibleRange[1] === 1) {
      if (n > APPROXIMATE_THRESHOLD3 && this._uniformityCache === void 0) {
        this.ensureEncodedBands();
        if (this._encodingParams != null && this._encodedBands != null && this._encodedBands.length >= 2) {
          const t0 = encodedToTimestamp(this._encodedBands[0], this._encodingParams);
          const t1 = encodedToTimestamp(this._encodedBands[1], this._encodingParams);
          this._uniformityCache = { isUniform: true, interval: t1 - t0 };
        } else {
          this._uniformityCache = { isUniform: false };
        }
      }
      return this._uniformityCache;
    }
    this.ensureEncodedBands();
    if (this._encodingParams != null && this._encodedBands != null && this._encodedBands.length >= 2) {
      const t0 = encodedToTimestamp(this._encodedBands[0], this._encodingParams);
      const t1 = encodedToTimestamp(this._encodedBands[1], this._encodingParams);
      return { isUniform: true, interval: t1 - t0 };
    }
    return { isUniform: false };
  }
  normalizeDomains(...domains) {
    return normalizeContinuousDomains(...domains);
  }
  getCachedBandRange() {
    const { domain, interval } = this;
    if (domain.length < 2 || interval == null)
      return void 0;
    this._bandRangeCache ?? (this._bandRangeCache = {
      start: intervalFloor(interval, domain[0]),
      stop: intervalFloor(interval, domain[1])
    });
    return [this._bandRangeCache.start, this._bandRangeCache.stop];
  }
  getDomainBoundaries() {
    const { interval } = this;
    if (interval == null)
      return void 0;
    if (this._domainBoundaries === void 0) {
      const bandRange = this.getCachedBandRange();
      if (bandRange == null)
        return void 0;
      const [start2, stop] = bandRange;
      const d0 = Math.min(start2.valueOf(), stop.valueOf());
      const d1 = Math.max(start2.valueOf(), stop.valueOf());
      const dNext = intervalNext(interval, new Date(d1)).valueOf();
      this._domainBoundaries = { d0, dNext };
    }
    return this._domainBoundaries;
  }
  get lastBandEnd() {
    return this.getDomainBoundaries()?.dNext ?? super.lastBandEnd;
  }
  /** Get linear params for O(1) index calculation and scaling metadata */
  getLinearParams() {
    if (this._linearParams === void 0) {
      this.ensureEncodedBands();
      if (this._encodedBands != null && this._encodingParams != null && this._encodedBands.length >= 2) {
        const firstBandTime = encodedToTimestamp(this._encodedBands[0], this._encodingParams);
        const secondBandTime = encodedToTimestamp(this._encodedBands[1], this._encodingParams);
        this._linearParams = {
          firstBandTime,
          intervalMs: secondBandTime - firstBandTime
        };
      }
    }
    return this._linearParams;
  }
  /** Check if current encoding uses a linear unit (exact arithmetic, no DST issues) */
  isLinearUnit() {
    const unit = this._encodingParams?.unit;
    return unit === "millisecond" || unit === "second" || unit === "minute" || unit === "hour";
  }
  /**
   * O(1) findIndex for uniform bands.
   * For linear units (ms/sec/min/hour), uses pure arithmetic without verification.
   * For non-linear units (day/month/year), verifies against actual band values.
   */
  findIndex(value, alignment = 0 /* Leading */) {
    if (value == null)
      return void 0;
    const n = this.getBandCountForUpdate();
    if (n === 0)
      return void 0;
    if (n === 1)
      return 0;
    const linearParams = this.getLinearParams();
    if (linearParams == null || linearParams.intervalMs === 0) {
      return super.findIndex(value, alignment);
    }
    const { firstBandTime, intervalMs } = linearParams;
    const target = value.valueOf();
    const rawIndex = (target - firstBandTime) / intervalMs;
    let index = alignment === 1 /* Trailing */ ? Math.ceil(rawIndex) : Math.floor(rawIndex);
    index = Math.max(0, Math.min(index, n - 1));
    if (this.isLinearUnit()) {
      if (alignment === 1 /* Trailing */) {
        const bandTime = firstBandTime + index * intervalMs;
        if (bandTime < target && index === n - 1)
          return void 0;
      } else {
        const bandTime = firstBandTime + index * intervalMs;
        if (bandTime > target && index === 0)
          return void 0;
      }
      return index;
    }
    const numericBands = this.numericBands;
    if (alignment === 1 /* Trailing */) {
      while (index > 0 && numericBands[index - 1] >= target)
        index--;
      while (index < n - 1 && numericBands[index] < target)
        index++;
      if (numericBands[index] < target)
        return void 0;
    } else {
      while (index < n - 1 && numericBands[index + 1] <= target)
        index++;
      while (index > 0 && numericBands[index] > target)
        index--;
      if (numericBands[index] > target)
        return void 0;
    }
    return index;
  }
  /**
   * Optimized convert for UnitTimeScale with O(1) boundary checks.
   * Uses linear params for fast bounds checking while delegating actual
   * conversion to parent for accuracy in edge cases.
   */
  convert(value, options) {
    this.refresh();
    if (!(value instanceof Date))
      value = new Date(timeValueToNumber(value));
    const { domain, interval } = this;
    if (domain.length < 2)
      return Number.NaN;
    if (options?.clamp !== true && interval != null) {
      const boundaries = this.getDomainBoundaries();
      if (boundaries != null) {
        const t = value.valueOf();
        if (t < boundaries.d0 || t >= boundaries.dNext) {
          return super.convert(value, { ...options, alignment: 2 /* Interpolate */ });
        }
      }
    }
    return super.convert(value, options);
  }
  ticks({ interval }, domain = this.domain, visibleRange = [0, 1]) {
    const numBands = this.numericBands;
    if (numBands.length === 0 || domain.length < 2)
      return;
    const d0 = Math.min(domain[0].valueOf(), domain[1].valueOf());
    const d1 = Math.max(domain[0].valueOf(), domain[1].valueOf());
    const [iStart, iEnd] = this.visibleBandRange(d0, d1, visibleRange);
    if (interval == null) {
      return {
        ticks: numBands.slice(iStart, iEnd).map((t) => new Date(t)),
        count: void 0,
        firstTickIndex: iStart
      };
    }
    const candidates = this.intervalCandidates(interval, domain, visibleRange);
    const ticks = this.snapCandidatesToBands(candidates, numBands, iStart, iEnd);
    return {
      ticks: ticks.map((t) => new Date(t)),
      count: ticks.length,
      firstTickIndex: iStart
    };
  }
  /** Compute band slice indices for a domain range + visible range. */
  visibleBandRange(d0, d1, visibleRange) {
    const numBands = this.numericBands;
    const n = numBands.length;
    if (n === 0)
      return [0, 0];
    const span = d1 - d0;
    const windowStart = d0 + visibleRange[0] * span;
    const windowEnd = d0 + visibleRange[1] * span;
    const iStart = findMaxIndex(0, n - 1, (i) => numBands[i] <= windowStart) ?? 0;
    const iEnd = (findMinIndex(0, n - 1, (i) => numBands[i] >= windowEnd) ?? n - 1) + 1;
    return [iStart, iEnd];
  }
  /** Generate interval-aligned candidate timestamps. */
  intervalCandidates(interval, domain, visibleRange) {
    if (typeof interval !== "number") {
      return intervalRange(interval, domain[0], domain[1], { extend: true, visibleRange }).map(
        (d) => d.valueOf()
      );
    }
    return this.numericBands;
  }
  /** Snap candidate timestamps to the nearest band, deduplicating. */
  snapCandidatesToBands(candidates, numBands, iStart, iEnd) {
    const milliseconds = this.interval ? intervalMilliseconds(this.interval) : Infinity;
    const ticks = [];
    let lastBandIndex = -1;
    for (const candidate of candidates) {
      if (candidate < numBands[iStart] || candidate > numBands[iEnd - 1] + milliseconds)
        continue;
      const bandIndex = findMaxIndex(iStart, iEnd - 1, (i) => numBands[i] <= candidate);
      if (bandIndex != null && bandIndex !== lastBandIndex && candidate - numBands[bandIndex] <= milliseconds) {
        ticks.push(numBands[bandIndex]);
        lastBandIndex = bandIndex;
      }
    }
    return ticks;
  }
};
function supportsInterval(domain, interval, rangeParams) {
  const start2 = intervalFloor(interval, domain[0]);
  const stop = intervalFloor(interval, domain[1]);
  return intervalRangeCount(interval, start2, stop, rangeParams) <= MAX_BANDS;
}

// packages/ag-charts-core/src/chart/secondaryAxisTicks.ts
function calculateNiceSecondaryAxis(scale, domain, primaryTickCount, reverse, visibleRange) {
  let [d0, d1] = findMinMax(domain.map(Number));
  const unzoomedTickCount = Math.floor(primaryTickCount.unzoomed);
  if (unzoomedTickCount <= 1) {
    const [start3, stop2] = domainWithOddTickCount(d0, d1);
    const tickCount2 = 5 * Math.pow(2, -Math.ceil(Math.log2(visibleRange[1] - visibleRange[0])));
    const { ticks: ticks2 } = createTicks(start3, stop2, tickCount2, void 0, void 0, visibleRange);
    const d2 = [scale.toDomain(start3), scale.toDomain(stop2)];
    if (reverse)
      d2.reverse();
    return { domain: d2, ticks: ticks2 };
  }
  if (d0 === d1) {
    const order = Math.floor(Math.log10(d0));
    const magnitude = Math.pow(10, order);
    const rangeOffsetStep = Math.min(magnitude, 1);
    const rangeOffset = unzoomedTickCount - 1;
    d0 -= rangeOffsetStep * Math.floor(rangeOffset / 2);
    d1 = d0 + rangeOffsetStep * rangeOffset;
  }
  let start2 = d0;
  let stop = d1;
  start2 = calculateNiceStart(start2, stop, unzoomedTickCount);
  const baseStep = getTickStep(start2, stop, unzoomedTickCount);
  const segments = unzoomedTickCount - 1;
  stop = start2 + segments * baseStep;
  const stepAlignedStart = Math.floor(start2 / baseStep) * baseStep;
  const stepAlignedStop = Math.floor(stop / baseStep) * baseStep;
  if (stepAlignedStart <= d0 && stepAlignedStop >= d1) {
    start2 = stepAlignedStart;
    stop = stepAlignedStop;
  }
  const d = [scale.toDomain(start2), scale.toDomain(stop)];
  if (reverse)
    d.reverse();
  const zoomedSegments = Math.max(1, Math.floor(primaryTickCount.zoomed) - 1);
  const subdivision = niceSubdivisionFactor(zoomedSegments / segments);
  const step = baseStep / subdivision;
  const tickCount = Math.min(segments * subdivision + 1, Math.floor(primaryTickCount.zoomed));
  const ticks = getTicks(start2, step, tickCount);
  return { domain: d, ticks };
}
function niceSubdivisionFactor(rawFactor) {
  if (rawFactor <= 1)
    return 1;
  const order = Math.floor(Math.log10(rawFactor));
  const magnitude = Math.pow(10, order);
  const m = rawFactor / magnitude;
  if (m >= 5)
    return 5 * magnitude;
  if (m >= 2)
    return 2 * magnitude;
  return magnitude;
}
function domainWithOddTickCount(d0, d1) {
  let start2 = d0;
  let stop = d1;
  let iterations = 0;
  do {
    [start2, stop] = niceTicksDomain(start2, stop);
    const { ticks } = createTicks(start2, stop, 5);
    if (ticks.length % 2 === 1)
      return [start2, stop];
    start2 -= 1;
    stop += 1;
  } while (iterations++ < 10);
  return [d0, d1];
}
function calculateNiceStart(a, b, count) {
  a = Math.floor(a);
  const rawStep = Math.abs(b - a) / (count - 1);
  const order = Math.floor(Math.log10(rawStep));
  const magnitude = Math.pow(10, order);
  return Math.floor(a / magnitude) * magnitude;
}
function getTicks(start2, step, count) {
  const fractionDigits = countFractionDigits(step);
  const f = Math.pow(10, fractionDigits);
  const ticks = [];
  for (let i = 0; i < count; i++) {
    const tick = start2 + step * i;
    ticks.push(Math.round(tick * f) / f);
  }
  return ticks;
}
function getTickStep(start2, stop, count) {
  const segments = count - 1;
  const rawStep = (stop - start2) / segments;
  return calculateNextNiceStep(rawStep);
}
function calculateNextNiceStep(rawStep) {
  const order = Math.floor(Math.log10(rawStep));
  const magnitude = Math.pow(10, order);
  const step = rawStep / magnitude;
  if (step > 0 && step <= 1)
    return magnitude;
  if (step > 1 && step <= 2)
    return 2 * magnitude;
  if (step > 2 && step <= 5)
    return 5 * magnitude;
  if (step > 5 && step <= 10)
    return 10 * magnitude;
  return rawStep;
}

// packages/ag-charts-core/src/chart/seriesMarkerDiff.ts
var MARKER_RESTYLE_KEYS = /* @__PURE__ */ /*#__PURE__*/ new Set(["lineDash", "lineDashOffset"]);
function markerRebuildNeeded(markerDiff) {
  return markerDiff != null && Object.keys(markerDiff).some((key) => !MARKER_RESTYLE_KEYS.has(key));
}

// packages/ag-charts-core/src/chart/zoomUtil.ts
var UNIT_MIN = 0;
var UNIT_MAX = 1;
function definedZoomState(zoom) {
  return {
    x: { min: zoom?.x?.min ?? UNIT_MIN, max: zoom?.x?.max ?? UNIT_MAX },
    y: { min: zoom?.y?.min ?? UNIT_MIN, max: zoom?.y?.max ?? UNIT_MAX }
  };
}
function pickDirectionZoom(zoom, direction) {
  if (direction === "x" /* X */)
    return zoom?.x;
  if (direction === "y" /* Y */)
    return zoom?.y;
  return void 0;
}
function toZoomState(coreZoom) {
  let x;
  let y;
  for (const id of Object.keys(coreZoom)) {
    const entry = coreZoom[id];
    if (!entry)
      continue;
    if (entry.direction === "x") {
      x ?? (x = { min: entry.min, max: entry.max });
    } else if (entry.direction === "y") {
      y ?? (y = { min: entry.min, max: entry.max });
    }
  }
  if (x || y) {
    return { x, y };
  }
}
export {
  AGGREGATION_INDEX_SELECTED,
  AGGREGATION_INDEX_UNSET,
  AGGREGATION_INDEX_X_MAX,
  AGGREGATION_INDEX_X_MIN,
  AGGREGATION_INDEX_Y_MAX,
  AGGREGATION_INDEX_Y_MIN,
  AGGREGATION_MAX_POINTS,
  AGGREGATION_MIN_RANGE,
  AGGREGATION_SPAN,
  AGGREGATION_THRESHOLD,
  APPROXIMATE_THRESHOLD,
  AUTO_SIZED_LABEL_TRUNCATE,
  AbstractButtonWidget,
  AbstractModuleInstance,
  AbstractScale,
  AgDocument,
  Arc,
  AsyncAwaitQueue,
  AxisWidget,
  BAR_LABEL_COLLISION_THEME,
  BASE_FONT_SIZE,
  BBox,
  BLOCK_IMAGE_SPACING,
  BandScale,
  BandedStructure,
  BarShape,
  BaseManager,
  Bitfield,
  BoundedTextWidget,
  ButtonWidget,
  CANVAS_HEIGHT,
  CANVAS_TO_BUFFER_DEFAULTS,
  CANVAS_WIDTH,
  CARTESIAN_AXIS_TYPE,
  CARTESIAN_POSITION,
  COMMON_SERIES_THEME_DEFAULTS,
  CSS_GENERIC_FAMILIES,
  CallbackCache,
  CategoryScale,
  ChartAxisDirection,
  ChartUpdateType,
  CleanupRegistry,
  CollapseMode,
  Color,
  ColorScale,
  ConfiguredCanvasMixin,
  ConicGradient,
  ContinuousScale,
  DEFAULT_MARKERLESS_LABEL_GAP,
  DIRECTION_SWAP_AXES,
  debugLogger_exports as Debug,
  debugMetrics_exports as DebugMetrics,
  DebugSelectors,
  DeclaredSceneChangeDetection,
  DeclaredSceneObjectChangeDetection,
  DeferredExecutor,
  DiscreteTimeScale,
  EllipsisChar,
  ErrorType,
  EventEmitter,
  ExpansionControllerImpl,
  ExtendedPath2D,
  FEATHERED_THRESHOLD,
  FILL_GRADIENT_BLANK_DEFAULTS,
  FILL_GRADIENT_CONIC_SERIES_DEFAULTS,
  FILL_GRADIENT_LINEAR_DEFAULTS,
  FILL_GRADIENT_LINEAR_HIERARCHY_DEFAULTS,
  FILL_GRADIENT_LINEAR_KEYED_DEFAULTS,
  FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS,
  FILL_GRADIENT_RADIAL_DEFAULTS,
  FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
  FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS,
  FILL_GRADIENT_RADIAL_SERIES_DEFAULTS,
  FILL_IMAGE_BLANK_DEFAULTS,
  FILL_IMAGE_DEFAULTS,
  FILL_PATTERN_BLANK_DEFAULTS,
  FILL_PATTERN_DEFAULTS,
  FILL_PATTERN_HIERARCHY_DEFAULTS,
  FILL_PATTERN_KEYED_DEFAULTS,
  FILL_PATTERN_SINGLE_DEFAULTS,
  FONT_SIZE,
  FONT_SIZE_RATIO,
  FONT_THEME_DEFAULTS,
  Gradient,
  Graph,
  Group,
  GroupWidget,
  GroupedCategoryScale,
  GuardedElement,
  HdpiCanvas,
  HdpiOffscreenCanvas,
  IDENTITY_MATRIX_ELEMENTS,
  Image2 as Image,
  ImageLoader,
  ImageSegmentNode,
  IrregularBandScale,
  LABEL_BOXING_DEFAULTS,
  LABEL_BOXING_TOP_LEVEL_DEFAULTS,
  LABEL_OVERFLOW_ALWAYS_SHOW,
  LABEL_OVERFLOW_DEFAULTS,
  LABEL_PLACEMENT_STYLE_DEFAULTS,
  LEGEND_CONTAINER_THEME,
  LRUCache,
  LayersManager,
  Line,
  LineSplitter,
  LinearGradient,
  LinearScale,
  ListWidget,
  Listeners,
  LogScale,
  Logger,
  LtrEmbedding,
  MARKER_SERIES_HIGHLIGHT_STYLE,
  MARKER_SHAPES,
  MULTI_SERIES_HIGHLIGHT_STYLE,
  Matrix,
  MementoCaretaker,
  MenuItemRadioWidget,
  MenuItemWidget,
  MenuWidget,
  moduleRegistry_exports as ModuleRegistry,
  ModuleScope,
  ModuleType,
  Mutex,
  NEAREST_NODE_TOOLTIP_THEME,
  NEAREST_TOOLTIP_THEME,
  NativeWidget,
  Node,
  NonNullableStateTracker,
  OrdinalTimeScale,
  PART_WHOLE_HIGHLIGHT_STYLE,
  PATTERNS,
  PLACED_LABEL_BOXING_DEFAULTS,
  POLAR_AXIS_SHAPE,
  POLAR_AXIS_TYPE,
  PanToBBoxScalingModeEnum,
  ParallelStateMachine,
  Path,
  Pattern,
  PixelRatioObserver,
  PointerEvents,
  PolarZIndexMap,
  Pool,
  PopDirectionalFormatting,
  QuadtreeNearest,
  RadialColumnShape,
  RadialGradient,
  Range,
  ReactiveState,
  Rect,
  Rotatable,
  RotatableGroup,
  RotatableText,
  RovingTabContainerWidget,
  SAFE_FILLS_OPERATION,
  SAFE_FILL_OPERATION,
  SAFE_RANGE2_OPERATION,
  SAFE_STROKE_FILL_OPERATION,
  SEGMENTATION_DEFAULTS,
  SERIES_INTERACTION_THEME_DEFAULTS,
  SERIES_SELECTION_THEME,
  SERIES_TOOLTIP_THEME,
  SHADOW_THEME_DEFAULTS,
  SINGLE_SERIES_HIGHLIGHT_STYLE,
  SKIP_JS_BUILTINS,
  STROKE_STYLE_THEME_DEFAULTS,
  Scalable,
  ScalableGroup,
  ScaleAlignment,
  Scene,
  SceneArrayChangeDetection,
  SceneChangeDetection,
  SceneObjectChangeDetection,
  SceneRefChangeDetection,
  Sector,
  SectorBox,
  SegmentedGroup,
  SegmentedPath,
  Selection,
  SeriesContentZIndexMap,
  SeriesZIndexMap,
  Shape,
  SimpleCache,
  SizeMonitor,
  SliderWidget,
  SpanJoin,
  SpatialIndex,
  StateMachine,
  StateTracker,
  SwitchWidget,
  TRIPLE_EQ,
  Text,
  TextMeasurer,
  TickIntervals,
  TimeScale,
  ToolbarWidget,
  Transformable,
  TransformableGroup,
  TransformableText,
  Translatable,
  TranslatableGroup,
  TrimCharsRegex,
  TrimEdgeGuard,
  UNIT_MAX,
  UNIT_MIN,
  UnitTimeScale,
  UnknownError,
  ValidationError,
  vector_exports as Vec2,
  vector4_exports as Vec4,
  Vertex,
  WeakCache,
  Widget,
  WidgetEventUtil,
  WidgetListenerHTML,
  WidgetListenerInternal,
  ZIndexMap,
  absValue,
  addEscapeEventListener,
  addMouseCloseListener,
  addOverrideFocusVisibleEventListener,
  addTouchCloseListener,
  addValues,
  adjustBandForInsertion,
  adjustBandForRemoval,
  aggregationBucketForDatum,
  aggregationDatumMatchesIndex,
  aggregationDomain,
  aggregationIndexForXRatio,
  aggregationRangeFittingPoints,
  aggregationXRatioForDatumIndex,
  aggregationXRatioForXValue,
  align,
  alignAfter,
  alignBefore,
  alignCentre,
  ambientLog_exports as ambientLog,
  ambientLogger,
  and,
  angleBetween,
  angularPadding,
  anyOverlap,
  appendEllipsis,
  applyBarLabelOrientation,
  applyIndexMapToBandHandler,
  applyPlacedBarLabelVisibility,
  applySizeMode,
  applySkiaPatches,
  applySpliceOperations,
  applyStyledMarkerSize,
  arcCircleIntersectionAngle,
  arcDistanceSquared,
  arcRadialLineIntersectionAngle,
  areScalingEqual,
  areaSizeAtRatio,
  array,
  arrayLength,
  arrayOf,
  arrayOfDefs,
  arraysEqual,
  assignIfNotStrictlyEqual,
  attachDescription,
  attachListener,
  autoSizedLabelOptionsDefs,
  axisLabelsOverlap,
  bakedLabelObstacles,
  barHighlightOptionsDef,
  barLabelObstacles,
  barLabelOrientation,
  barLabelPropsRouteThroughEngine,
  barLabelPropsUsePositionedCandidates,
  barLabelResolvesOrientation,
  barLabelResolvesPlacement,
  barLabelRotation,
  barLabelRoutesThroughEngine,
  barLabelUsesPositionedCandidates,
  bezier2DDistance,
  bezier2DExtrema,
  bigIntAggregationExtent,
  blockStripHeight,
  blockStripWidth,
  boolean,
  borderOptionsDef,
  boxCollides,
  boxContains,
  boxCrossesSegment,
  boxEmpty,
  boxOverlapsSector,
  boxesEqual,
  buildBarLabelData,
  buildBarLabelDatum,
  buildBarPositionedLabelDatum,
  buildDateFormatter,
  buildDirtyTree,
  buildTree,
  cachedTextMeasurer,
  calcPanToBBoxRatios,
  calculateIdealBandSize,
  calculateLabelTranslation,
  calculateNiceSecondaryAxis,
  calculatePlacement,
  calculateTargetBandCount,
  callWithContext,
  callback,
  callbackDefs,
  callbackOf,
  canRenderTextOffscreen,
  cartesianAxisBandHighlightOptions,
  cartesianAxisCaptionOptionsDefs,
  cartesianAxisCrosshairOptions,
  cartesianAxisLabelOptionsDefs,
  cartesianAxisOptionsDefs,
  cartesianAxisThemeOptionsDefs,
  cartesianChartOptionsDefs,
  cartesianChartThemeOptionsDefs,
  cartesianCrossLineLabelOptionsDefs,
  cartesianCrossLineOptionsDefs,
  cartesianNumericAxisLabel,
  cartesianTimeAxisLabel,
  cartesianTimeAxisParentLevel,
  categoryAxisOptionsDefs,
  ceilTo,
  centreSnapApplies,
  checkDatum,
  checkUniformityBySampling,
  circularSliceArray,
  clamp,
  clampArray,
  cleanupDebugStats,
  clearContext,
  clipLines,
  clipSpanX,
  clippedRoundRect,
  clockwiseAngle,
  clockwiseAngles,
  coerceIso8601Date,
  coerceTextValue,
  collapseSpanToPoint,
  collectAggregationLevels,
  collectSparseSelection,
  collisionOptionsDef,
  color,
  colorOrRef,
  colorScaleOptionsDef,
  colorStopsOrderValidator,
  colorUnion,
  commonAxisCaptionOptionsDefs,
  commonAxisIntervalOptionsDefs,
  commonAxisLabelOptionsDefs,
  commonAxisOptionsDefs,
  commonAxisThemeTemplate,
  commonChartOptions,
  commonChartOptionsDefs,
  commonChartThemeTemplate,
  commonCrossLineLabelOptionsDefs,
  commonSeriesOptionsDefs,
  commonSeriesThemeableOptionsDefs,
  commonThemeOverridesOptionsDefs,
  compactAggregationIndices,
  compareDates,
  compareZIndex,
  composeContributedDefs,
  computeColorBins,
  computeExtremesAggregation,
  computeExtremesAggregationPartial,
  configureColorScale,
  constant,
  contextMenuItemsArray,
  continuousAxisOptions,
  contributedKeysUnder,
  contributionHost,
  contributionMatchesAxisType,
  contributionMatchesChartType,
  contributionMatchesSeriesType,
  contributionsOf,
  countFractionDigits,
  countLines,
  createAggregationIndices,
  createBigIntBins,
  createBigIntTickBins,
  createBigIntTicks,
  createButton,
  createCanvasContext,
  createCheckbox,
  createDynamicContext,
  createElement,
  createElementId,
  createIcon,
  createId,
  createIdsGenerator,
  createNumberFormatter,
  createPerWindowRegistry,
  createScopedCache,
  createSelect,
  createStyleElement,
  createSvgElement,
  createTextArea,
  createTicks,
  crossLineCommonStyleOptionsDefs,
  crossLineOptionsDefs,
  crossLineStyleOptionsDefs,
  cycledFillThemeTemplate,
  date,
  dateToNumber,
  dateTruncationForDomain,
  datesSortOrder,
  debounce,
  debouncedAnimationFrame,
  debouncedCallback,
  debugContext,
  debugSceneNodeHighlight,
  debugStats,
  decodeIntervalValue,
  deepClone,
  deepFreeze,
  defaultEpoch,
  defaultTimeFormats,
  defined,
  definedZoomState,
  deprecated,
  deprecatedValue,
  deriveNormalizedStops,
  deriveTimeSpecifier,
  describeValidator,
  destroyShadowScratch,
  deviceDimension,
  diffArrays,
  discreteColorStops,
  discreteTimeAxisIntervalOptionsDefs,
  distribute,
  downloadUrl,
  drawCorner,
  drawMarkerUnitPolygon,
  dropFirstWhile,
  dropLastWhile,
  durationDay,
  durationHour,
  durationMinute,
  durationMonth,
  durationSecond,
  durationWeek,
  durationYear,
  easeIn,
  easeInOut,
  easeInOutQuad,
  easeInQuad,
  easeOut,
  easeOutQuad,
  encodedToTimestamp,
  ensureEpochColumn,
  enterprise,
  enterpriseRegistry,
  entries,
  epochColumnForTimeScale,
  errorBarOptionsDefs,
  errorBarThemeableOptionsDefs,
  estimateTickCount,
  evaluateBezier,
  every,
  expandLegendPosition,
  extent,
  extractDomain,
  fillCssOptionsDef,
  fillGradientDefaults,
  fillImageDefaults,
  fillOptionsDef,
  fillPatternDefaults,
  fillThemeTemplate,
  filterEmptyBands,
  filterVisibleTicks,
  findDiscreteColorBinLabel,
  findLargestFittingFontSize,
  findLargestFittingStep,
  findLargestFontSizeDescending,
  findMaxIndex,
  findMaxValue,
  findMinIndex,
  findMinMax,
  findMinValue,
  findRangeExtent,
  first,
  firstCandidate,
  fitLabelText,
  fitLabelTextAutoSize,
  fitLabelTextOrOverflow,
  fitLabelTextOrOverflowAutoSize,
  fitLabelTextToRegion,
  fitLabelTextToRegionAutoSize,
  focusCursorAtEnd,
  fontFamilyFull,
  fontOptionsDef,
  fontWeight,
  fontWithSize,
  forceLtrNumbers,
  forceLtrNumbersIn,
  formatColorBinLabel,
  formatColorScaleBinLabel,
  formatNumber,
  formatObjectValidator,
  formatPercent,
  formatValue,
  fromPairs,
  generateUUID,
  geoJson,
  getAngleRatioRadians,
  getAttribute,
  getBatchedShadow,
  getColorStops,
  getDOMMatrix,
  getDateTicksForInterval,
  getDebugStatsStateForTesting,
  getDocument,
  getElementBBox,
  getEpochColumn,
  getIconClassNames,
  getImage,
  getLastFocus,
  getMaxInnerRectSize,
  getMidpointsForIndices,
  getMinOuterRectSize,
  getOffscreenCanvas,
  getPath,
  getPath2D,
  getPrevNextKeys,
  getRadialColumnWidth,
  getResizeObserver,
  getSequentialColors,
  getSpreadCanvas,
  getTickTimeInterval,
  getWindow,
  googleFont,
  gradientColorStops,
  gradientLegendOptionsDefs,
  gradientStrict,
  graphemeSegments,
  greaterThan,
  gridCellSize,
  groupBy,
  groupedCategoryAxisOptionsDefs,
  guardTextEdges,
  hasNoModifiers,
  hasRealChars,
  hasRequiredInPath,
  hideCollidingRadialCategoryLabels,
  hideCollidingRadialNumberLabels,
  highlightOptionsDef,
  htmlElement,
  imageBoxAroundBaseline,
  imageSegmentBox,
  inRange,
  initRovingTabIndex,
  initialStatePickedOptionsDef,
  initializeBandArray,
  insertListItemsSorted,
  insetBox,
  insetBoxXY,
  insetFitRegion,
  insideBarContainer,
  insideBarRegion,
  insideBarValueInsets,
  instanceOf,
  interpolate,
  interpolateColor,
  interpolateNumber,
  interpolationOptionsDefs,
  interpolationThemeTemplate,
  intervalAgo,
  intervalCeil,
  intervalEpoch,
  intervalExtent,
  intervalFloor,
  intervalHierarchy,
  intervalMilliseconds,
  intervalNext,
  intervalPrevious,
  intervalRange,
  intervalRangeCount,
  intervalRangeNumeric,
  intervalRangeStartIndex,
  intervalStep,
  intervalUnit,
  invalidateEpochColumn,
  inverseEaseOut,
  isArray,
  isBetweenAngles,
  isBigInt,
  isBlockBoundary,
  isBoolean,
  isBoxInSector,
  isButtonClickEvent,
  isColor,
  isContinuous,
  isContributionRequested,
  isDate,
  isDefined,
  isDenseInterval,
  isDirectionNeutral,
  isDirectionRtl,
  isDocumentFragment,
  isElement,
  isEmptyObject,
  isEnumKey,
  isEnumValue,
  isErased,
  isFiniteNumber,
  isFiniteNumericValue,
  isFunction,
  isGradientFill,
  isGradientFillArray,
  isGradientOrPatternFill,
  isHTMLElement,
  isHtmlElement,
  isISO8601,
  isImageFill,
  isInputPending,
  isInteger,
  isInterpolating,
  isKeyOf,
  isLogLevel,
  isNegative,
  isNode,
  isNumber,
  isNumberEqual,
  isNumberObject,
  isNumericValue,
  isObject,
  isObjectLike,
  isObjectWithProperty,
  isObjectWithStringProperty,
  isPatternFill,
  isPlainObject,
  isPointInSector,
  isPointLabelDatum,
  isRegExp,
  isRotatable,
  isScalable,
  isScaleValid,
  isSegmentTruncated,
  isString,
  isStringFillArray,
  isStringObject,
  isSupportedMarkerShape,
  isSymbol,
  isTextTruncated,
  isThemeOperator,
  isTimeInterval,
  isTimeIntervalUnit,
  isTruncated,
  isUnitTimeCategoryScaling,
  isUnsupportedBrowser,
  isUnsupportedColorFormat,
  isValidDate,
  isValidNumberFormat,
  iterate,
  joinFormatted,
  jsonDiff,
  jsonPropertyCompare,
  jsonWalk,
  kebabCase,
  keptCharacters,
  labelAutoFontSizeOptionsDefs,
  labelBoxOptionsDef,
  labelCollisionFitOptionsDefs,
  labelCollisionPlacementDef,
  labelExceedsBand,
  labelFitOptionsDefs,
  labelFootprintBox,
  labelGlyphCentre,
  labelOrientationDef,
  labelPlacementStyleDefs,
  labelPlacementStyleOptionsDef,
  labelTextAtShrinkRatio,
  labelsAvoidAxisLabels,
  legendOptionsDefs,
  legendPositionValidator,
  lessThan,
  lessThanOrEqual,
  levenshteinDistance,
  lineDashOptionsDef,
  lineDistanceSquared,
  lineHighlightOptionsDef,
  lineSegmentOptions,
  lineSegmentation,
  linear,
  linearPoints,
  logAxisOptionsDefs,
  lowestGranularityForInterval,
  lowestGranularityUnitForTicks,
  lowestGranularityUnitForValue,
  makeAccessibleClickListener,
  mapValues,
  markBandDirtyAtIndex,
  markUpdatedIndices,
  markerOptionsDefs,
  markerRebuildNeeded,
  markerStyleOptionsDefs,
  maskFitRegion,
  maxValue,
  measureLabelText,
  measurePlacedLabel,
  measureTextSegments,
  memo,
  memoiseByBand,
  merge,
  mergeArrayDefaults,
  mergeDefaults,
  mergeDefaultsShallowOperations,
  minValue,
  moduleMatchesChartType,
  modulus,
  multiSeriesHighlightOptionsDef,
  multiSeriesShadowHighlightOptionsDef,
  narrowAggregationX,
  narrowBigIntColumn,
  narrowBigIntColumnByOffset,
  narrowBigIntColumnRelative,
  narrowToNumber,
  nearestSquared,
  nearestSquaredInContainer,
  nestAtOptionsPath,
  nextPowerOf2,
  niceBigIntDomain,
  niceTicksDomain,
  nonNegativeInteger,
  normalisedExtentWithMetadata,
  normalisedTimeExtentWithMetadata,
  normalizeAngle180,
  normalizeAngle360,
  normalizeAngle360FromDegrees,
  normalizeAngle360Inclusive,
  normalizeContinuousDomains,
  number,
  numberAxisOptionsDefs,
  numberFormatValidator,
  numberMin,
  numberRange,
  numericValue,
  object,
  objectsEqual,
  objectsEqualWith,
  optionsDefs,
  or,
  orientationAngles,
  overflowStrategy,
  padding,
  paddingOptions,
  parentLevelAxisThemeTemplate,
  parseColor,
  parseNumberFormat,
  parseOptionsPath,
  parseSegment,
  parseSvg,
  partial,
  partialAssign,
  pause,
  pick,
  pickDirectionZoom,
  placeLabels,
  placedLabelFit,
  placedSeriesLabelOptionsDefs,
  polarAxisThemeOptionsDefs,
  polarChartOptionsDefs,
  populateBucketSelectedFromSparse,
  populateBucketSelectedFromSparseSplit,
  positiveNumber,
  positiveNumberNonZero,
  positiveNumericValue,
  positiveNumericValueNonZero,
  prepareSceneNodeHighlight,
  preserveArabicJoining,
  previousPowerOf2,
  probedFitRegion,
  radiiScalingFactor,
  radiusCrossLineLabelOptionsDefs,
  range,
  rangeValidator,
  ratio,
  readContributedValue,
  readIntegratedWrappedValue,
  rect,
  rectLabelObstacles,
  regionTextCapacity,
  regionWidthAt,
  registerDebugStatsConsumer,
  releaseShadowScratch,
  releaseSpreadCanvas,
  renderChildrenWithShadowBatches,
  required,
  rescaleSpan,
  rescaleVisibleRange,
  resetIds,
  resolveCollideWith,
  resolveContributions,
  resolveEdgeLabelOverflow,
  resolveLabelFit,
  resolveLabelFitDescriptors,
  resolveMinimumFontSize,
  resolvePadding,
  resolveSeriesLabelDefaults,
  resolveStopPositions,
  resolveTextAlign,
  reversePush,
  rotatePoint,
  rotatedGlyphDrift,
  rotatedLabelInset,
  roundTo,
  safeCall,
  sanitizeHtml,
  sectorBox,
  sectorEdges,
  sectorLabelContainer,
  seedEpochColumnIdentity,
  seedNumericColumnIdentity,
  segmentIntersection,
  selectionContainmentValidator,
  selectionOptionsDef,
  seriesLabelFontWeightOr,
  seriesLabelOptionsDefs,
  seriesTooltipRangeValidator,
  setAttribute,
  setAttributes,
  setDocument,
  setElementBBox,
  setElementStyle,
  setElementStyles,
  setPath,
  setSvgFontAttributes,
  setSvgLineDashAttributes,
  setSvgStrokeAttributes,
  setWindow,
  shadowHighlightOptionsDef,
  shadowOptionsDefs,
  shadowPass,
  shallowClone,
  shapeHighlightOptionsDef,
  shapeSegmentOptions,
  shapeSegmentation,
  shapeSelectionOptionsDef,
  shapeValidator,
  signedPadding,
  signedPaddingOptions,
  simpleColorUnion,
  simpleMemorize,
  simpleMemorize2,
  smoothPoints,
  snapDeviceCentre,
  solveBezier,
  sortAndUniqueDates,
  sortBasedOnArray,
  spanRange,
  splitBezier2D,
  standaloneChartOptionsDefs,
  stepPoints,
  stopPageScrolling,
  strictObjectKeys,
  strictUnion,
  string,
  stringLength,
  stringifyValue,
  strokeOptionsDef,
  subtractValues,
  textAlign,
  textOrSegments,
  textWrap,
  themeBorderColor,
  themeBorderWidth,
  themeOperator,
  thinTickLabels,
  throttle,
  tickFormat,
  tickLabelSpacing,
  tickStep,
  time,
  timeAxisOptionsDefs,
  timeInterval,
  timeIntervalUnit,
  timeValueToNumber,
  titleAxisThemeTemplate,
  toArray,
  toCanvasTextBaseline,
  toClippedCanvasPoint,
  toCurrentPoint,
  toDegrees,
  toFontString,
  toIterable,
  toNumber,
  toNumberOrUndefined,
  toPlainText,
  toRadians,
  toTextString,
  toTimeInterval,
  toZoomState,
  toolbarButtonOptionsDefs,
  tooltipOptionsDefs,
  tooltipOptionsDefsWithArea,
  topologyChartOptionsDefs,
  transformIntegratedCategoryValue,
  trapezoidBandRect,
  trapezoidBox,
  trapezoidExtentAcross,
  trapezoidFitRegion,
  trapezoidOverlapsBox,
  truncateLine,
  typeUnion,
  undocumented,
  undocumentedDefs,
  undocumentedLabelFitOptionsDefs,
  undocumentedThemeOptions,
  unguardTextEdges,
  union,
  unionOrArray,
  unionSymbol,
  unique,
  unitTimeAxisOptionsDefs,
  unpackDomainMinMax,
  upsertNodeDatum,
  validate,
  validationsOptionsDef,
  verticalAlign,
  visibleTickSliceIndices,
  visitOptionsPath,
  walkPairsOutward,
  withFitRegion,
  withThemeOperators,
  withTimeout,
  without,
  wrapLines,
  wrapText,
  wrapTextOrSegments,
  wrapTextSegments,
  writeLabelBoxCentre,
  zeroLike
};
//# sourceMappingURL=main.esm.mjs.map
