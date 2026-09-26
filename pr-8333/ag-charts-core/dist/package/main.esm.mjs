var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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

// packages/ag-charts-core/src/types/scales.ts
function extractDomain(value) {
  return value.domain;
}
var ScaleAlignment = /* @__PURE__ */ /*#__PURE__*/ ((ScaleAlignment2) => {
  ScaleAlignment2[ScaleAlignment2["Leading"] = 0] = "Leading";
  ScaleAlignment2[ScaleAlignment2["Trailing"] = 1] = "Trailing";
  ScaleAlignment2[ScaleAlignment2["Interpolate"] = 2] = "Interpolate";
  return ScaleAlignment2;
})(ScaleAlignment || {});

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

// packages/ag-charts-core/src/logging/debugLogger.ts
var debugLogger_exports = {};
__export(debugLogger_exports, {
  Time: () => Time,
  check: () => check,
  create: () => create,
  inDevelopmentMode: () => inDevelopmentMode
});

// packages/ag-charts-core/src/utils/data/arrays.ts
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

// packages/ag-charts-core/src/utils/dom/globalsProxy.ts
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

// packages/ag-charts-core/src/modules/enterpriseRegistry.ts
var enterpriseRegistry = {};

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

// packages/ag-charts-core/src/types/text.ts
var EllipsisChar = "\u2026";
var LineSplitter = /\r?\n/g;
var TrimEdgeGuard = "\u200B";
var TrimCharsRegex = /[\s.,;:-]{1,5}$/;
var LtrEmbedding = "\u202A";
var PopDirectionalFormatting = "\u202C";

// packages/ag-charts-core/src/utils/dom/domUtil.ts
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
function isDirectionRtl(element) {
  return element?.ownerDocument.defaultView?.getComputedStyle(element).direction === "rtl";
}
function setElementBBox(element, bbox) {
  if (!element)
    return;
  const { x, y, width: width2, height: height2 } = normalizeBounds(bbox);
  setPixelValue(element.style, "width", width2);
  setPixelValue(element.style, "height", height2);
  setPixelValue(element.style, "left", x);
  setPixelValue(element.style, "top", y);
}
function getElementBBox(element) {
  const styleWidth = Number.parseFloat(element.style.width);
  const styleHeight = Number.parseFloat(element.style.height);
  const styleX = Number.parseFloat(element.style.left);
  const styleY = Number.parseFloat(element.style.top);
  const width2 = Number.isFinite(styleWidth) ? styleWidth : element.offsetWidth;
  const height2 = Number.isFinite(styleHeight) ? styleHeight : element.offsetHeight;
  const x = Number.isFinite(styleX) ? styleX : element.offsetLeft;
  const y = Number.isFinite(styleY) ? styleY : element.offsetTop;
  return { x, y, width: width2, height: height2 };
}
function focusCursorAtEnd(element) {
  element.focus({ preventScroll: true });
  if (element.lastChild?.textContent == null)
    return;
  const { ownerDocument } = element;
  const range2 = ownerDocument.createRange();
  range2.setStart(element.lastChild, element.lastChild.textContent.length);
  range2.setEnd(element.lastChild, element.lastChild.textContent.length);
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

// packages/ag-charts-core/src/utils/data/numbers.ts
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

// packages/ag-charts-core/src/utils/format/color.ts
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
var _Color = /*#__PURE__*/ (() => { var _c$0 = class _Color {
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
      const delta = max - min;
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      if (max === r) {
        h = (g - b) / delta + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / delta + 2;
      } else {
        h = (r - g) / delta + 4;
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
      const delta = max - min;
      const rc = (max - r) / delta;
      const gc = (max - g) / delta;
      const bc = (max - b) / delta;
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
}; _c$0.nameToHex = /* @__PURE__ */ new Map([
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
]); return _c$0; })()
var Color = _Color;

// packages/ag-charts-core/src/utils/types/typeGuards.ts
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

// packages/ag-charts-core/src/utils/text/textUtils.ts
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
function calcLineHeight(fontSize, lineHeightRatio = 1.15) {
  return Math.round(fontSize * lineHeightRatio);
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

// packages/ag-charts-core/src/utils/data/strings.ts
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

// packages/ag-charts-core/src/utils/functions.ts
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

// packages/ag-charts-core/src/state/validation.ts
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
  const { name, chartTypes, options, themeTemplate } = definition;
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
      return [{ path: name, options, themeTemplate, chartTypes }];
    case "axis:plugin":
      return [
        {
          path: `axes[].${definition.optionsKey ?? name}`,
          options,
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

// packages/ag-charts-core/src/modules/moduleInstance.ts
var AbstractModuleInstance = class {
  constructor() {
    this.cleanup = new CleanupRegistry();
  }
  destroy() {
    this.cleanup.flush();
  }
};

// packages/ag-charts-core/src/module/dynamicContext.ts
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

// packages/ag-charts-core/src/scale/colorScaleUtil.ts
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
      const end2 = clamp(0, (domain[i + 1] - d0) / extent2, 1);
      if (end2 < start2)
        continue;
      stops.push({ stop: start2, color: range2[i] });
      if (end2 > start2)
        stops.push({ stop: end2, color: range2[i] });
    }
    return stops;
  }
  if (domain.length < range2.length) {
    const count = Math.max(range2.length - 1, 1);
    return range2.map((color2, i) => ({ stop: i / count, color: color2 }));
  }
  return domain.map((v, i) => ({ stop: (v - d0) / extent2, color: range2[i] }));
}
function formatColorBinLabel(start2, end2, index, count, formatValue2) {
  const bin = { start: start2, end: end2, color: "" };
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

// packages/ag-charts-core/src/utils/format/numberFormat.ts
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
  const [, fill, align, sign, symbol, zero, width2, comma, precision, trim, type] = match;
  return {
    fill,
    align,
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
  const { fill, align, sign = "-", symbol, zero, width: width2, comma, type, prefix = "", suffix = "", precision } = options;
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
  let padAlign = align;
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
function addPadding(numString, width2, fill = " ", align = ">", prefixLength = 0) {
  const padSize = width2 - numString.length;
  if (padSize <= 0) {
    return numString;
  }
  const padding2 = fill.repeat(padSize);
  if (align === "=") {
    const clampedPrefix = Math.min(Math.max(prefixLength, 0), numString.length);
    const start2 = numString.slice(0, clampedPrefix);
    const rest = numString.slice(clampedPrefix);
    return `${start2}${padding2}${rest}`;
  }
  if (align === ">" || align === "") {
    return padding2 + numString;
  } else if (align === "<") {
    return `${numString}${padding2}`;
  } else if (align === "^") {
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

// packages/ag-charts-core/src/config/optionsDefaults.ts
var themeOperator = (value) => {
  if (!isObject(value))
    return false;
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0].startsWith("$");
};
var themeParams = [
  "accentColor",
  "axisLineColor",
  "backgroundColor",
  "borderColor",
  "borderRadius",
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
  "buttonBackgroundColor",
  "buttonBorder",
  "buttonFontWeight",
  "buttonTextColor",
  "inputBackgroundColor",
  "inputBorder",
  "inputTextColor",
  "menuBackgroundColor",
  "menuBorder",
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
  "groupedCategoryLineColor"
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
var fillOptionsDef = {
  fill: colorUnion,
  fillOpacity: ratio
};
fillOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
fillOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
fillOptionsDef.fillImageDefaults = undocumented(fillImageDefaults);
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

// packages/ag-charts-core/src/config/chartDefaults.ts
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
  }
}))();
chartCaptionOptionsDefs.truncate = undocumented(boolean);
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
  items: (value, context) => contextMenuItemsArray(value, context)
}))();
contextMenuItemObjectDef.iconUrl = undocumented(string);
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
  utc: boolean
}))();
timeIntervalDefs.every = callback;
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
  legend: legendOptionsDefs,
  gradientLegend: gradientLegendOptionsDefs,
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
  animation: object,
  flashOnUpdate: object,
  contextMenu: object,
  context: () => true,
  dataSource: {
    getData: callback
  },
  keyboard: {
    enabled: boolean,
    tabIndex: number,
    initialFocus: strictUnion()("data-start", "data-end", "viewport-start", "viewport-end")
  },
  touch: {
    dragAction: union("none", "drag", "hover")
  },
  selection: object,
  ranges: {
    enabled: boolean,
    enableOutOfRange: boolean,
    position: union("top-left", "top", "top-right", "bottom-left", "bottom", "bottom-right"),
    spacing: positiveNumber,
    button: {
      ...fillCssOptionsDef,
      ...strokeOptionsDef,
      textColor: colorOrRef,
      ...fontOptionsDef,
      cornerRadius: positiveNumber,
      padding,
      active: {
        ...fillCssOptionsDef,
        stroke: strokeOptionsDef.stroke,
        textColor: colorOrRef
      },
      disabled: {
        ...fillCssOptionsDef,
        stroke: strokeOptionsDef.stroke,
        textColor: colorOrRef
      },
      hover: {
        ...fillCssOptionsDef,
        stroke: strokeOptionsDef.stroke,
        textColor: colorOrRef
      }
    },
    dropdown: {
      visible: union("auto", "always", "never"),
      ...fillCssOptionsDef,
      ...strokeOptionsDef,
      textColor: colorOrRef,
      ...fontOptionsDef,
      cornerRadius: positiveNumber,
      padding,
      active: {
        ...fillCssOptionsDef,
        stroke: strokeOptionsDef.stroke,
        textColor: colorOrRef
      },
      disabled: {
        ...fillCssOptionsDef,
        stroke: strokeOptionsDef.stroke,
        textColor: colorOrRef
      },
      hover: {
        ...fillCssOptionsDef,
        stroke: strokeOptionsDef.stroke,
        textColor: colorOrRef
      }
    },
    gap: positiveNumber,
    ...fillCssOptionsDef,
    ...strokeOptionsDef,
    textColor: colorOrRef,
    ...fontOptionsDef,
    cornerRadius: positiveNumber,
    padding,
    active: {
      ...fillCssOptionsDef,
      stroke: strokeOptionsDef.stroke,
      textColor: colorOrRef
    },
    disabled: {
      ...fillCssOptionsDef,
      stroke: strokeOptionsDef.stroke,
      textColor: colorOrRef
    },
    hover: {
      ...fillCssOptionsDef,
      stroke: strokeOptionsDef.stroke,
      textColor: colorOrRef
    },
    buttons: arrayOfDefs(
      {
        ...toolbarButtonOptionsDefs,
        enabled: boolean,
        value: or(
          number,
          and(arrayOf(or(number, date)), arrayLength(2, 2)),
          timeInterval,
          timeIntervalUnit,
          callback
        )
      },
      "range button options array"
    )
  },
  // modules
  locale: {
    localeText: object,
    getLocaleText: callbackOf(string)
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
  sync: object,
  zoom: object,
  scrollbar: object,
  formatter: or(callbackOf(textOrSegments), formatObjectValidator),
  enableRtl: boolean
}))();
commonChartOptionsDefs.dataSource.requestThrottle = undocumented(positiveNumber);
commonChartOptionsDefs.dataSource.updateThrottle = undocumented(positiveNumber);
commonChartOptionsDefs.dataSource.updateDuringInteraction = undocumented(boolean);
commonChartOptionsDefs.statusBar = undocumented(defined);
commonChartOptionsDefs.ranges.minSize = undocumented(positiveNumber);
commonChartOptionsDefs.foreground = undocumented({
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
});
commonChartOptionsDefs.overrideDevicePixelRatio = undocumented(number);
commonChartOptionsDefs.displayNullData = undocumented(boolean);
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
  selection: selectionOptionsDef(shapeSelectionOptionsDef)
}))();
commonSeriesThemeableOptionsDefs.allowNullKeys = undocumented(boolean);
var commonSeriesOptionsDefs = {
  ...commonSeriesThemeableOptionsDefs,
  id: string,
  visible: boolean,
  context: () => true,
  data: array
};
commonSeriesOptionsDefs.seriesGrouping = undocumented(defined);
var markerStyleOptionsDefs = {
  shape: shapeValidator,
  size: positiveNumber,
  ...fillOptionsDef,
  ...strokeOptionsDef,
  ...lineDashOptionsDef
};
var markerOptionsDefs = /*#__PURE__*/ (() => ({
  enabled: boolean,
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
var collisionOptionsDef = {
  threshold: number,
  alwaysShow: boolean
};
collisionOptionsDef.collideWith = undocumented({
  markers: boolean,
  labels: boolean,
  seriesItems: boolean,
  seriesArea: boolean
});
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
  overflowStrategy
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
var shadowOptionsDefs = {
  enabled: boolean,
  xOffset: number,
  yOffset: number,
  blur: positiveNumber,
  color: colorOrRef
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

// packages/ag-charts-core/src/utils/types/decorator.ts
var BREAK_TRANSFORM_CHAIN = /*#__PURE__*/ Symbol("BREAK");
var CONFIG_KEY = "__decorator_config";
var ACCESSORS_KEY = "__decorator_accessors";
function addFakeTransformToInstanceProperty(target, propertyKeyOrSymbol) {
  initialiseConfig(target, propertyKeyOrSymbol).optional = true;
}
function initialiseConfig(target, propertyKeyOrSymbol) {
  if (Object.getOwnPropertyDescriptor(target, CONFIG_KEY) == null) {
    Object.defineProperty(target, CONFIG_KEY, { value: {} });
  }
  if (Object.getOwnPropertyDescriptor(target, ACCESSORS_KEY) == null) {
    const parentAccessors = Object.getPrototypeOf(target)?.[ACCESSORS_KEY];
    const accessors = parentAccessors?.slice() ?? [];
    Object.defineProperty(target, ACCESSORS_KEY, { value: accessors });
  }
  const config = target[CONFIG_KEY];
  const propertyKey = propertyKeyOrSymbol.toString();
  if (config[propertyKey] != null) {
    return config[propertyKey];
  }
  config[propertyKey] = { setters: [], getters: [], observers: [] };
  const descriptor = Object.getOwnPropertyDescriptor(target, propertyKeyOrSymbol);
  let prevGet = descriptor?.get;
  let prevSet = descriptor?.set;
  if (prevGet == null || prevSet == null) {
    const accessors = target[ACCESSORS_KEY];
    let index = accessors.indexOf(propertyKeyOrSymbol);
    if (index === -1) {
      index = accessors.push(propertyKeyOrSymbol) - 1;
    }
    prevGet ?? (prevGet = function() {
      let accessorValues = this.__accessors;
      if (accessorValues == null) {
        accessorValues = accessors.slice().fill(void 0);
        Object.defineProperty(this, "__accessors", { value: accessorValues });
      }
      return accessorValues[index];
    });
    prevSet ?? (prevSet = function(value) {
      let accessorValues = this.__accessors;
      if (accessorValues == null) {
        accessorValues = accessors.slice().fill(void 0);
        Object.defineProperty(this, "__accessors", { value: accessorValues });
      }
      accessorValues[index] = value;
    });
  }
  const propertyConfig = config[propertyKey];
  const getter = function() {
    const baseValue = prevGet.call(this);
    const getters = propertyConfig.getters;
    if (getters.length === 0) {
      return baseValue;
    }
    let value = baseValue;
    for (let i = 0, n = getters.length; i < n; i++) {
      value = getters[i](this, propertyKeyOrSymbol, value);
      if (value === BREAK_TRANSFORM_CHAIN) {
        return;
      }
    }
    return value;
  };
  const setter = function(value) {
    const setters = propertyConfig.setters;
    const observers = propertyConfig.observers;
    let oldValue;
    for (let i = 0, n = setters.length; i < n; i++) {
      if (setters[i].length > 2) {
        oldValue = prevGet.call(this);
        break;
      }
    }
    for (let i = 0, n = setters.length; i < n; i++) {
      value = setters[i](this, propertyKeyOrSymbol, value, oldValue);
      if (value === BREAK_TRANSFORM_CHAIN) {
        return;
      }
    }
    prevSet.call(this, value);
    for (let i = 0, n = observers.length; i < n; i++) {
      observers[i](this, value, oldValue);
    }
  };
  Object.defineProperty(target, propertyKeyOrSymbol, {
    set: setter,
    get: getter,
    enumerable: true,
    configurable: false
  });
  return config[propertyKey];
}
function addTransformToInstanceProperty(setTransform, getTransform, configMetadata) {
  return (target, propertyKeyOrSymbol) => {
    const config = initialiseConfig(target, propertyKeyOrSymbol);
    config.setters.push(setTransform);
    if (getTransform) {
      config.getters.unshift(getTransform);
    }
    if (configMetadata) {
      Object.assign(config, configMetadata);
    }
  };
}
function addObserverToInstanceProperty(setObserver) {
  return (target, propertyKeyOrSymbol) => {
    initialiseConfig(target, propertyKeyOrSymbol).observers.push(setObserver);
  };
}
function isDecoratedObject(target) {
  return target !== void 0 && CONFIG_KEY in target;
}
function listDecoratedProperties(target) {
  const targets = /* @__PURE__ */ new Set();
  while (isDecoratedObject(target)) {
    targets.add(target?.[CONFIG_KEY]);
    target = Object.getPrototypeOf(target);
  }
  return Array.from(targets).flatMap((configMap) => Object.keys(configMap));
}
function extractDecoratedProperties(target) {
  return listDecoratedProperties(target).reduce((result, key) => {
    result[String(key)] = target[key] ?? null;
    return result;
  }, {});
}

// packages/ag-charts-core/src/utils/data/iterators.ts
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

// packages/ag-charts-core/src/utils/data/object.ts
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
function objectsEqualWith(a, b, cmp) {
  if (Object.is(a, b))
    return true;
  for (const key of Object.keys(b)) {
    if (!(key in a))
      return false;
  }
  for (const key of Object.keys(a)) {
    if (!(key in b))
      return false;
    if (!cmp(a[key], b[key]))
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
    const keys = isDecoratedObject(source) ? listDecoratedProperties(source) : Object.keys(source);
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
    const keys = isDecoratedObject(source) ? listDecoratedProperties(source) : Object.keys(source);
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

// packages/ag-charts-core/src/config/gaugePreset.ts
var fillsOptionsDef = /*#__PURE__*/ (() => ({
  fills: and(
    arrayLength(2),
    arrayOf(optionsDefs({ color: colorOrRef, stop: numericValue }, "")),
    colorStopsOrderValidator
  ),
  fillMode: union("continuous", "discrete")
}))();
var linearGaugeTargetOptionsDef = /*#__PURE__*/ (() => ({
  value: required(numericValue),
  text: string,
  shape: or(
    union("circle", "cross", "diamond", "heart", "plus", "pin", "square", "star", "triangle", "line"),
    callback
  ),
  placement: union("before", "after", "middle"),
  spacing: positiveNumber,
  size: positiveNumber,
  rotation: number,
  ...fillOptionsDef,
  ...strokeOptionsDef,
  ...lineDashOptionsDef
}))();
var radialGaugeTargetOptionsDef = /*#__PURE__*/ (() => ({
  value: required(numericValue),
  text: string,
  shape: or(
    union("circle", "cross", "diamond", "heart", "plus", "pin", "square", "star", "triangle", "line"),
    callback
  ),
  placement: union("inside", "outside", "middle"),
  spacing: positiveNumber,
  size: positiveNumber,
  rotation: number,
  label: {
    ...seriesLabelOptionsDefs,
    spacing: positiveNumber
  },
  ...fillOptionsDef,
  ...strokeOptionsDef,
  ...lineDashOptionsDef
}))();
var linearGaugeSeriesThemeableOptionsDef = /*#__PURE__*/ (() => ({
  ...without(commonSeriesThemeableOptionsDefs, ["listeners"]),
  direction: union("horizontal", "vertical"),
  cornerMode: union("container", "item"),
  cornerRadius: positiveNumber,
  thickness: positiveNumber,
  scale: {
    min: and(numericValue, lessThan("max")),
    max: and(numericValue, greaterThan("min")),
    label: {
      enabled: boolean,
      formatter: callback,
      rotation: number,
      spacing: positiveNumber,
      minSpacing: positiveNumber,
      placement: union("before", "after"),
      avoidCollisions: boolean,
      format: numberFormatValidator,
      ...fontOptionsDef
    },
    interval: {
      values: arrayOf(numericValue),
      step: numericValue
    },
    ...fillsOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef
  },
  segmentation: {
    enabled: boolean,
    spacing: positiveNumber,
    interval: {
      values: arrayOf(numericValue),
      step: numericValue,
      count: number
    }
  },
  bar: {
    enabled: boolean,
    thickness: positiveNumber,
    thicknessRatio: ratio,
    ...fillsOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef
  },
  label: {
    ...autoSizedLabelOptionsDefs,
    text: string,
    spacing: positiveNumber,
    avoidCollisions: boolean,
    placement: union(
      "inside-start",
      "outside-start",
      "inside-end",
      "outside-end",
      "inside-center",
      "bar-inside",
      "bar-inside-end",
      "bar-outside-end",
      "bar-end"
    )
  },
  tooltip: tooltipOptionsDefs
}))();
var linearGaugeSeriesOptionsDef = /*#__PURE__*/ (() => ({
  ...without(commonSeriesOptionsDefs, ["listeners"]),
  ...linearGaugeSeriesThemeableOptionsDef,
  type: required(constant("linear-gauge")),
  value: required(numericValue),
  targets: arrayOfDefs(linearGaugeTargetOptionsDef, "target options array")
}))();
linearGaugeSeriesOptionsDef.margin = undocumented(number);
linearGaugeSeriesOptionsDef.defaultColorRange = undocumented(arrayOf(color));
linearGaugeSeriesOptionsDef.defaultTarget = undocumented({
  ...linearGaugeTargetOptionsDef,
  value: number,
  label: {
    ...seriesLabelOptionsDefs,
    spacing: number
  }
});
linearGaugeSeriesOptionsDef.defaultScale = undocumented(linearGaugeSeriesOptionsDef.scale);
linearGaugeSeriesOptionsDef.scale.defaultFill = undocumented(color);
var radialGaugeSeriesThemeableOptionsDef = /*#__PURE__*/ (() => ({
  ...without(commonSeriesThemeableOptionsDefs, ["listeners"]),
  outerRadius: positiveNumber,
  innerRadius: positiveNumber,
  outerRadiusRatio: ratio,
  innerRadiusRatio: ratio,
  startAngle: number,
  endAngle: number,
  spacing: positiveNumber,
  cornerMode: union("container", "item"),
  cornerRadius: positiveNumber,
  scale: {
    min: and(numericValue, lessThan("max")),
    max: and(numericValue, greaterThan("min")),
    label: {
      enabled: boolean,
      formatter: callback,
      rotation: number,
      spacing: positiveNumber,
      minSpacing: positiveNumber,
      avoidCollisions: boolean,
      format: numberFormatValidator,
      ...fontOptionsDef
    },
    interval: {
      values: arrayOf(numericValue),
      step: numericValue
    },
    ...fillsOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef
  },
  segmentation: {
    enabled: boolean,
    spacing: positiveNumber,
    interval: {
      values: arrayOf(numericValue),
      step: numericValue,
      count: number
    }
  },
  bar: {
    enabled: boolean,
    ...fillsOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef
  },
  needle: {
    enabled: boolean,
    spacing: positiveNumber,
    radiusRatio: ratio,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef
  },
  label: {
    text: string,
    spacing: positiveNumber,
    ...autoSizedLabelOptionsDefs
  },
  secondaryLabel: {
    text: string,
    ...autoSizedLabelOptionsDefs
  },
  tooltip: tooltipOptionsDefs
}))();
var radialGaugeSeriesOptionsDef = /*#__PURE__*/ (() => ({
  ...without(commonSeriesOptionsDefs, ["listeners"]),
  ...radialGaugeSeriesThemeableOptionsDef,
  type: required(constant("radial-gauge")),
  value: required(numericValue),
  targets: arrayOfDefs(radialGaugeTargetOptionsDef, "target options array")
}))();
radialGaugeSeriesOptionsDef.defaultColorRange = undocumented(arrayOf(color));
radialGaugeSeriesOptionsDef.defaultTarget = undocumented({
  ...radialGaugeTargetOptionsDef,
  value: number,
  label: {
    ...seriesLabelOptionsDefs,
    spacing: number
  }
});
radialGaugeSeriesOptionsDef.scale.defaultFill = undocumented(color);
radialGaugeSeriesOptionsDef.scale.interval.minSpacing = undocumented(positiveNumber);
radialGaugeSeriesOptionsDef.scale.interval.maxSpacing = undocumented(positiveNumber);

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

// packages/ag-charts-core/src/config/themeUtil.ts
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
var LABEL_BOXING_FILL_DEFAULTS = {
  fill: {
    $if: [
      {
        $and: [
          { $eq: [{ $path: "./fill/type" }, "image"] },
          { $isUserOption: ["./fill/backgroundFill", false, true] }
        ]
      },
      { backgroundFill: "transparent" },
      void 0
    ]
  }
};
var LABEL_BOXING_DEFAULTS = {
  ...LABEL_BOXING_FILL_DEFAULTS,
  padding: 8,
  cornerRadius: 4,
  border: {
    enabled: { $isUserOption: "../border" },
    strokeWidth: 1,
    stroke: { $foregroundOpacity: 0.08 }
  }
};
var LABEL_BOXING_TOP_LEVEL_DEFAULTS = {
  ...LABEL_BOXING_FILL_DEFAULTS,
  cornerRadius: 4,
  border: {
    enabled: { $isUserOption: "../border" },
    strokeWidth: 1,
    stroke: { $foregroundOpacity: 0.08 }
  }
};
var LABEL_PLACEMENT_BORDER_DEFAULTS = {
  border: { enabled: { $path: "../../border/enabled" } }
};
var LABEL_PLACEMENT_STYLE_DEFAULTS = (colorRef2) => ({
  ...LABEL_PLACEMENT_BORDER_DEFAULTS,
  color: { $isUserOption: ["../color", { $path: "../color" }, { $ref: colorRef2 }] }
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
var LEGEND_CONTAINER_THEME = {
  border: {
    enabled: false,
    stroke: { $foregroundBackgroundMix: 0.25 },
    strokeOpacity: 1,
    strokeWidth: 1
  },
  cornerRadius: 4,
  fillOpacity: 1,
  padding: {
    $if: [{ $eq: [{ $path: "./border/enabled" }, true] }, 5, { $isUserOption: ["./fill", 5, 0] }]
  }
};
var SEGMENTATION_DEFAULTS = {
  enabled: false,
  key: "x",
  segments: {
    $apply: {
      fill: {
        $applySwitch: [
          { $path: "type" },
          { $path: "../../../fill" },
          ["gradient", FILL_GRADIENT_LINEAR_DEFAULTS],
          ["image", FILL_IMAGE_DEFAULTS],
          ["pattern", FILL_PATTERN_DEFAULTS]
        ]
      },
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
};

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

// packages/ag-charts-core/src/types/axisDirection.ts
var ChartAxisDirection = /* @__PURE__ */ /*#__PURE__*/ ((ChartAxisDirection2) => {
  ChartAxisDirection2["X"] = "x";
  ChartAxisDirection2["Y"] = "y";
  ChartAxisDirection2["Angle"] = "angle";
  ChartAxisDirection2["Radius"] = "radius";
  return ChartAxisDirection2;
})(ChartAxisDirection || {});

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

// packages/ag-charts-core/src/utils/data/numberArray.ts
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

// packages/ag-charts-core/src/utils/time/time/duration.ts
var durationSecond = 1e3;
var durationMinute = durationSecond * 60;
var durationHour = durationMinute * 60;
var durationDay = durationHour * 24;
var durationWeek = durationDay * 7;
var durationMonth = durationDay * 30;
var durationYear = durationDay * 365;

// packages/ag-charts-core/src/utils/time/time/encoding.ts
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

// packages/ag-charts-core/src/utils/time/time/range.ts
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
    const delta = stop.valueOf() - start2.valueOf();
    const t0 = start2.valueOf();
    start2 = new Date(t0 + visibleRange[0] * delta);
    stop = new Date(t0 + visibleRange[1] * delta);
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

// packages/ag-charts-core/src/utils/time/time/index.ts
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

// packages/ag-charts-core/src/utils/time/timeFormatDefaults.ts
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

// packages/ag-charts-core/src/utils/data/epochColumns.ts
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

// packages/ag-charts-core/src/utils/aggregation.ts
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

// packages/ag-charts-core/src/types/themeSymbols.ts
var IS_DARK_THEME = /*#__PURE__*/ Symbol("is-dark-theme");
var DEFAULT_SHADOW_COLOUR = /*#__PURE__*/ Symbol("default-shadow-colour");
var DEFAULT_CAPTION_LAYOUT_STYLE = /*#__PURE__*/ Symbol("default-caption-layout-style");
var DEFAULT_CAPTION_ALIGNMENT = /*#__PURE__*/ Symbol("default-caption-alignment");
var PALETTE_UP_STROKE = /*#__PURE__*/ Symbol("palette-up-stroke");
var PALETTE_DOWN_STROKE = /*#__PURE__*/ Symbol("palette-down-stroke");
var PALETTE_UP_FILL = /*#__PURE__*/ Symbol("palette-up-fill");
var PALETTE_DOWN_FILL = /*#__PURE__*/ Symbol("palette-down-fill");
var PALETTE_NEUTRAL_STROKE = /*#__PURE__*/ Symbol("palette-neutral-stroke");
var PALETTE_NEUTRAL_FILL = /*#__PURE__*/ Symbol("palette-neutral-fill");
var PALETTE_ALT_UP_STROKE = /*#__PURE__*/ Symbol("palette-alt-up-stroke");
var PALETTE_ALT_DOWN_STROKE = /*#__PURE__*/ Symbol("palette-alt-down-stroke");
var PALETTE_ALT_UP_FILL = /*#__PURE__*/ Symbol("palette-alt-up-fill");
var PALETTE_ALT_DOWN_FILL = /*#__PURE__*/ Symbol("palette-alt-down-fill");
var PALETTE_ALT_NEUTRAL_FILL = /*#__PURE__*/ Symbol("palette-gray-fill");
var PALETTE_ALT_NEUTRAL_STROKE = /*#__PURE__*/ Symbol("palette-gray-stroke");
var DEFAULT_POLAR_SERIES_STROKE = /*#__PURE__*/ Symbol("default-polar-series-stroke");
var DEFAULT_SPARKLINE_CROSSHAIR_STROKE = /*#__PURE__*/ Symbol("default-sparkline-crosshair-stroke");
var DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR = /*#__PURE__*/ Symbol(
  "default-financial-charts-annotation-stroke"
);
var DEFAULT_FIBONACCI_STROKES = /*#__PURE__*/ Symbol("default-hierarchy-strokes");
var DEFAULT_TEXT_ANNOTATION_COLOR = /*#__PURE__*/ Symbol("default-text-annotation-color");
var DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL = /*#__PURE__*/ Symbol(
  "default-financial-charts-annotation-background-fill"
);
var DEFAULT_ANNOTATION_HANDLE_FILL = /*#__PURE__*/ Symbol("default-annotation-handle-fill");
var DEFAULT_ANNOTATION_STATISTICS_FILL = /*#__PURE__*/ Symbol("default-annotation-statistics-fill");
var DEFAULT_ANNOTATION_STATISTICS_STROKE = /*#__PURE__*/ Symbol("default-annotation-statistics-stroke");
var DEFAULT_ANNOTATION_STATISTICS_COLOR = /*#__PURE__*/ Symbol("default-annotation-statistics-color");
var DEFAULT_ANNOTATION_STATISTICS_DIVIDER_STROKE = /*#__PURE__*/ Symbol(
  "default-annotation-statistics-divider-stroke"
);
var DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL = /*#__PURE__*/ Symbol(
  "default-annotation-statistics-fill"
);
var DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE = /*#__PURE__*/ Symbol(
  "default-annotation-statistics-stroke"
);
var DEFAULT_TEXTBOX_FILL = /*#__PURE__*/ Symbol("default-textbox-fill");
var DEFAULT_TEXTBOX_STROKE = /*#__PURE__*/ Symbol("default-textbox-stroke");
var DEFAULT_TEXTBOX_COLOR = /*#__PURE__*/ Symbol("default-textbox-color");
var DEFAULT_TOOLBAR_POSITION = /*#__PURE__*/ Symbol("default-toolbar-position");

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

// packages/ag-charts-core/src/utils/dom/agDocument.ts
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
    const element = this.document.createElement(tagName);
    if (typeof className === "object") {
      style = className;
      className = void 0;
    }
    if (className != null && className !== "") {
      for (const name of className.split(" ")) {
        element.classList.add(name);
      }
    }
    if (style) {
      Object.assign(element.style, style);
    }
    return element;
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

// packages/ag-charts-core/src/utils/geometry/math/shapeUtils.ts
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

// packages/ag-charts-core/src/utils/geometry/angle.ts
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

// packages/ag-charts-core/src/utils/async.ts
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

// packages/ag-charts-core/src/utils/dom/attributeUtil.ts
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

// packages/ag-charts-core/src/utils/geometry/boxBounds.ts
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

// packages/ag-charts-core/src/utils/data/binarySearch.ts
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

// packages/ag-charts-core/src/utils/canvas.ts
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

// packages/ag-charts-core/src/utils/configuredCanvasMixin.ts
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

// packages/ag-charts-core/src/utils/time/date.ts
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

// packages/ag-charts-core/src/utils/data/diff.ts
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

// packages/ag-charts-core/src/utils/geometry/distance.ts
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

// packages/ag-charts-core/src/utils/data/extent.ts
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

// packages/ag-charts-core/src/utils/format/format.util.ts
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

// packages/ag-charts-core/src/utils/seriesMarkerDiff.ts
var MARKER_RESTYLE_KEYS = /* @__PURE__ */ /*#__PURE__*/ new Set(["lineDash", "lineDashOffset"]);
function markerRebuildNeeded(markerDiff) {
  return markerDiff != null && Object.keys(markerDiff).some((key) => !MARKER_RESTYLE_KEYS.has(key));
}

// packages/ag-charts-core/src/utils/geojson.ts
function isValidCoordinate(value) {
  return Array.isArray(value) && value.length >= 2 && value.every(isFiniteNumber);
}
function isValidCoordinates(value) {
  return Array.isArray(value) && value.length >= 2 && value.every(isValidCoordinate);
}
function hasSameStartEndPoint(c) {
  const start2 = c[0];
  const end2 = c.at(-1);
  if (end2 === void 0)
    return false;
  return isNumberEqual(start2[0], end2[0], 1e-3) && isNumberEqual(start2[1], end2[1], 1e-3);
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

// packages/ag-charts-core/src/utils/data/json.ts
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

// packages/ag-charts-core/src/utils/dom/domEvents.ts
function attachListener(element, eventName, handler, options) {
  element.addEventListener(eventName, handler, options);
  return () => element.removeEventListener(eventName, handler, options);
}

// packages/ag-charts-core/src/utils/dom/keynavUtil.ts
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
function makeAccessibleClickListener(element, onclick) {
  return (event) => {
    if (element.ariaDisabled === "true") {
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
function stopPageScrolling(element) {
  return attachListener(element, "keydown", (event) => {
    if (event.defaultPrevented)
      return;
    const shouldPrevent = getAttribute(event.target, "data-preventdefault", true);
    if (shouldPrevent && matchesKey(event, "ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp")) {
      event.preventDefault();
    }
  });
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

// packages/ag-charts-core/src/utils/data/iso8601.ts
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

// packages/ag-charts-core/src/utils/data/linkedList.ts
function insertListItemsSorted(list, items, cmp) {
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
}

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

// packages/ag-charts-core/src/utils/data/nearest.ts
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

// packages/ag-charts-core/src/utils/geometry/placement.ts
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

// packages/ag-charts-core/src/state/properties.ts
var BaseProperties = class {
  handleUnknownProperties(_unknownKeys, _properties) {
  }
  set(properties) {
    const { className = this.constructor.name } = this.constructor;
    if (properties == null) {
      this.clear();
      return this;
    }
    if (typeof properties !== "object") {
      warn(`unable to set ${className} - expecting a properties object`);
      return this;
    }
    const keys = new Set(Object.keys(properties));
    for (const propertyKey of listDecoratedProperties(this)) {
      if (keys.has(propertyKey)) {
        const value = properties[propertyKey];
        const self = this;
        if (isProperties(self[propertyKey])) {
          if (self[propertyKey] instanceof PropertiesArray) {
            if (value == null) {
              self[propertyKey].clear();
            } else {
              const array2 = self[propertyKey].reset(value);
              if (array2 == null) {
                warn(
                  `unable to set [${String(propertyKey)}] - expecting a properties array`
                );
              } else {
                self[propertyKey] = array2;
              }
            }
          } else {
            self[propertyKey].set(value);
          }
        } else if (isPlainObject(value)) {
          self[propertyKey] = merge(value, self[propertyKey] ?? {});
        } else {
          self[propertyKey] = value;
        }
        keys.delete(propertyKey);
      }
    }
    this.handleUnknownProperties(keys, properties);
    for (const unknownKey of keys) {
      warn(`unable to set [${String(unknownKey)}] in ${className} - property is unknown`);
    }
    return this;
  }
  clear() {
    for (const propertyKey of listDecoratedProperties(this)) {
      const currentValue = this[propertyKey];
      if (isProperties(currentValue)) {
        currentValue.clear();
      } else {
        this[propertyKey] = void 0;
      }
    }
    return this;
  }
  toJson() {
    return listDecoratedProperties(this).reduce((object2, propertyKey) => {
      const propertyValue = this[propertyKey];
      object2[String(propertyKey)] = isProperties(propertyValue) ? propertyValue.toJson() : propertyValue;
      return object2;
    }, {});
  }
};
var PropertiesArray = class _PropertiesArray extends Array {
  constructor(itemFactory, ...properties) {
    super(properties.length);
    const isConstructor = (value2) => Boolean(value2?.prototype?.constructor?.name);
    const value = isConstructor(itemFactory) ? (params) => new itemFactory().set(params) : itemFactory;
    Object.defineProperty(this, "itemFactory", { value, enumerable: false, configurable: false });
    this.set(properties);
  }
  set(properties) {
    if (isArray(properties)) {
      this.length = properties.length;
      for (let i = 0; i < properties.length; i++) {
        this[i] = this.itemFactory(properties[i]);
      }
    }
    return this;
  }
  reset(properties) {
    if (Array.isArray(properties)) {
      return new _PropertiesArray(this.itemFactory, ...properties);
    }
  }
  // `BaseProperties.clear()` recurses into every `isProperties()` field, which includes this one,
  // so the override is required for a parent to be clearable.
  clear() {
    this.length = 0;
    return this;
  }
  toJson() {
    return this.map((value) => value?.toJson?.() ?? value);
  }
};
function isProperties(value) {
  return value instanceof BaseProperties || value instanceof PropertiesArray;
}

// packages/ag-charts-core/src/state/proxy.ts
function ProxyProperty(proxyPath, configMetadata) {
  const pathArray = Array.isArray(proxyPath) ? proxyPath : proxyPath.split(".");
  if (pathArray.length === 1) {
    const [property] = pathArray;
    return addTransformToInstanceProperty(
      (target, _, value) => target[property] = value,
      (target) => target[property],
      configMetadata
    );
  }
  return addTransformToInstanceProperty(
    (target, _, value) => setPath(target, pathArray, value),
    (target) => getPath(target, pathArray),
    configMetadata
  );
}
function ProxyOnWrite(proxyProperty) {
  return addTransformToInstanceProperty((target, _, value) => target[proxyProperty] = value);
}
function ProxyPropertyOnWrite(childName, childProperty) {
  return addTransformToInstanceProperty((target, key, value) => target[childName][childProperty ?? key] = value);
}
function ActionOnSet(opts) {
  const { newValue: newValueFn, oldValue: oldValueFn, changeValue: changeValueFn } = opts;
  return addTransformToInstanceProperty((target, _, newValue, oldValue) => {
    if (newValue !== oldValue) {
      if (oldValue !== void 0) {
        oldValueFn?.call(target, oldValue);
      }
      if (newValue !== void 0) {
        newValueFn?.call(target, newValue);
      }
      changeValueFn?.call(target, newValue, oldValue);
    }
    return newValue;
  });
}
function ObserveChanges(observerFn) {
  return addObserverToInstanceProperty(observerFn);
}

// packages/ag-charts-core/src/state/stateMachine.ts
var debugColor = "color: green";
var debugQuietColor = "color: grey";
function StateMachineProperty() {
  return addObserverToInstanceProperty(() => {
  });
}
function applyProperties(parentState, childState) {
  const childProperties = listDecoratedProperties(childState);
  if (childProperties.length === 0)
    return;
  const properties = extractDecoratedProperties(parentState);
  for (const property of childProperties) {
    if (property in properties) {
      childState[property] = properties[property];
    }
  }
}
var AbstractStateMachine = class {
  transitionRoot(event, data) {
    if (this.parent) {
      this.parent.transitionRoot(event, data);
    } else {
      this.transition(event, data);
    }
  }
};
var _StateMachine = /*#__PURE__*/ (() => { var _c$1 = class _StateMachine extends AbstractStateMachine {
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
}; _c$1.child = "__child"; _c$1.parent = "__parent"; return _c$1; })()
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

// packages/ag-charts-core/src/utils/dom/domElements.ts
function createElement(tagName, className, style) {
  const element = getDocument().createElement(tagName);
  if (typeof className === "object") {
    style = className;
    className = void 0;
  }
  if (className != null && className !== "") {
    for (const name of className.split(" ")) {
      element.classList.add(name);
    }
  }
  if (style) {
    Object.assign(element.style, style);
  }
  return element;
}
function createStyleElement(styleNonce, agDocument) {
  const element = agDocument ? agDocument.createElement("style") : createElement("style");
  if (styleNonce != null) {
    element.nonce = styleNonce;
  }
  return element;
}
function createSvgElement(elementName) {
  return getDocument().createElementNS("http://www.w3.org/2000/svg", elementName);
}

// packages/ag-charts-core/src/utils/dom/domDownload.ts
function downloadUrl(dataUrl, fileName) {
  const body = getDocument("body");
  const element = createElement("a", { display: "none" });
  element.href = dataUrl;
  element.download = fileName;
  body.appendChild(element);
  element.click();
  setTimeout(() => element.remove());
}

// packages/ag-charts-core/src/utils/geometry/trapezoid.ts
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

// packages/ag-charts-core/src/utils/geometry/fitRegion.ts
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

// packages/ag-charts-core/src/utils/text/textWrapper.ts
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
function blockTopFor(align, height2, region, limit) {
  if (height2 >= limit)
    return -region.extentAbove;
  let top = -height2 / 2;
  if (align === "start") {
    top = 0;
  } else if (align === "end") {
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
function wrapBlockToRegion(text, options, region, align, limit, lineHeight, lines, anchored, boxed) {
  const height2 = Math.min(lines * lineHeight, limit);
  const blockTop = blockTopFor(align, height2, region, limit);
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
function wrapTextToRegion(text, options, region, align, anchored = false, boxed = false) {
  const limit = Math.min(options.maxHeight ?? Infinity, region.extentAbove + region.extentBelow);
  if (isArray(text)) {
    return refineSegmentsToRegion(text, options, region, align, limit, boxed);
  }
  const lineHeight = options.lineHeight ?? cachedTextMeasurer(options.font).lineHeight();
  const source = toTextString(text);
  const wanted = survivingCharacters(source);
  const roomForLines = Math.floor(limit / Math.max(1, lineHeight));
  const maxLines = Math.max(1, Math.min(roomForLines, source.length));
  let best;
  let bestKept = 0;
  for (let lines = 1; lines <= maxLines; lines += 1) {
    const candidate = wrapBlockToRegion(source, options, region, align, limit, lineHeight, lines, anchored, boxed);
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
function refineSegmentsToRegion(text, options, region, align, limit, boxed) {
  let height2 = measureText(text, options.font).height;
  let lines = 1;
  let result = text;
  let blockTop = 0;
  for (let i = 0; i < MAX_REGION_REFINEMENTS; i += 1) {
    const blockHeight = Math.min(height2, limit);
    blockTop = blockTopFor(align, blockHeight, region, limit);
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
  if (height2 <= options.maxHeight) {
    return lines;
  }
  for (let i = 0, cumulativeHeight = 0; i < lineMetrics.length; i++) {
    const lineTop = cumulativeHeight;
    cumulativeHeight += lineMetrics[i].height;
    if (cumulativeHeight > options.maxHeight) {
      if (options.overflow === "hide" || i === 0)
        return [];
      const clippedResults = lines.slice(0, i);
      const lastLine = clippedResults.pop();
      const last = lineMetrics[i - 1];
      const maxWidth = lineMaxWidth(options, lineTop - last.height, lineTop);
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

// packages/ag-charts-core/src/utils/geometry/spatialIndex.ts
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

// packages/ag-charts-core/src/utils/geometry/labelPlacement.ts
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
function resolveCollideWith(collision) {
  const { markers, labels, seriesItems, seriesArea } = collision.collideWith ?? {};
  return {
    marker: markers ?? true,
    label: labels ?? true,
    seriesItem: seriesItems ?? false,
    seriesArea: seriesArea ?? true
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
  return candidateCollideWith?.[category] === false;
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
function isSoleCandidateKeep(d, defaults) {
  const alwaysShow = d.alwaysShow ?? defaults?.alwaysShow ?? true;
  if (!alwaysShow || d.positionedCandidates != null || d.neverDrop === true || d.fit != null)
    return false;
  const placements = d.placements ?? defaults?.placements;
  return (placements?.length ?? 1) <= 1 && (orientationsOf(d)?.length ?? 1) <= 1;
}
function noLabelQueriesIndex(data) {
  for (const { datums, defaults } of data.values()) {
    for (const d of datums) {
      if (d.label.text === "")
        continue;
      if (!isSoleCandidateKeep(d, defaults))
        return false;
    }
  }
  return true;
}
function buildObstacleIndex(data, obstacles, bounds) {
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
        if (useIndex) {
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
  if (isSoleCandidateKeep(d, defaults)) {
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
      recordBestChoice(TIER_OVERFLOWING, overflow, text, width2, height2, rotation, offsetX, offsetY, void 0, c);
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

// packages/ag-charts-core/src/utils/text/labelMeasure.ts
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

// packages/ag-charts-core/src/utils/data/visibleRange.ts
function rescaleVisibleRange(visibleRange, [s0, s1], [d0, d1]) {
  const dr = d1 - d0;
  const vr = s1 - s0;
  const vd0 = s0 + vr * visibleRange[0];
  const vd1 = s0 + vr * visibleRange[1];
  return [(vd0 - d0) / dr, (vd1 - d0) / dr];
}

// packages/ag-charts-core/src/utils/time/ticks.ts
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
function isCloseToInteger(n, delta) {
  return Math.abs(Math.round(n) - n) < delta;
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
function tickStep(start2, end2, count, minCount = 0, maxCount = Infinity) {
  if (start2 === end2) {
    return clamp(1, minCount, maxCount);
  } else if (count < 1) {
    return Number.NaN;
  }
  const extent2 = Math.abs(end2 - start2);
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
function range(start2, end2, step, visibleRange) {
  if (!Number.isFinite(step) || step <= 0) {
    return { ticks: [], count: 0, firstTickIndex: void 0 };
  } else if (start2 === end2) {
    return { ticks: [start2], count: 1, firstTickIndex: 0 };
  }
  const f = 10 ** countFractionDigits(step);
  const d0 = Math.min(start2, end2);
  const d1 = Math.max(start2, end2);
  let vd0;
  let vd1;
  if (visibleRange != null && (visibleRange[0] !== 0 || visibleRange[1] !== 1)) {
    const rangeExtent = end2 - start2;
    const adjustedStart = start2 + rangeExtent * visibleRange[0];
    const adjustedEnd = end2 - rangeExtent * (1 - visibleRange[1]);
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
function niceTicksDomain(start2, end2) {
  const extent2 = Math.abs(end2 - start2);
  const step = 10 ** Math.floor(Math.log10(extent2));
  let minError = Infinity, ticks = [start2, end2];
  for (const multiplier of TickMultipliers) {
    const m = multiplier * step;
    const d0 = Math.floor(start2 / m) * m;
    const d1 = Math.ceil(end2 / m) * m;
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

// packages/ag-charts-core/src/utils/data/value.ts
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

// packages/ag-charts-core/src/utils/geometry/vector.ts
var vector_exports = {};
__export(vector_exports, {
  add: () => add,
  angle: () => angle,
  apply: () => apply,
  distance: () => distance,
  distanceSquared: () => distanceSquared,
  equal: () => equal,
  from: () => from,
  gradient: () => gradient,
  intercept: () => intercept,
  intersectAtX: () => intersectAtX,
  intersectAtY: () => intersectAtY,
  length: () => length,
  lengthSquared: () => lengthSquared,
  multiply: () => multiply,
  normalized: () => normalized,
  origin: () => origin,
  required: () => required2,
  rotate: () => rotate,
  round: () => round,
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
function rotate(a, theta, b = origin()) {
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
function round(a, decimals = 2) {
  return { x: roundTo(a.x, decimals), y: roundTo(a.y, decimals) };
}
function equal(a, b) {
  return a.x === b.x && a.y === b.y;
}
function from(a, b) {
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
function origin() {
  return { x: 0, y: 0 };
}

// packages/ag-charts-core/src/utils/geometry/vector4.ts
var vector4_exports = {};
__export(vector4_exports, {
  bottomCenter: () => bottomCenter,
  center: () => center,
  clone: () => clone,
  collides: () => collides,
  end: () => end,
  from: () => from2,
  height: () => height,
  normalise: () => normalise,
  origin: () => origin2,
  round: () => round2,
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
function round2(a) {
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
function from2(a, b, c, d) {
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
function origin2() {
  return { x1: 0, y1: 0, x2: 0, y2: 0 };
}

// packages/ag-charts-core/src/utils/geometry/fill.ts
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

// packages/ag-charts-core/src/utils/geometry/bezier.ts
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

// packages/ag-charts-core/src/utils/geometry/barLabelGeometry.ts
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
function insideBarRegion(rect, valueMinInset, valueMaxInset, isVertical) {
  return isVertical ? {
    x: rect.x,
    y: rect.y + valueMinInset,
    width: rect.width,
    height: rect.height - valueMinInset - valueMaxInset
  } : {
    x: rect.x + valueMinInset,
    y: rect.y,
    width: rect.width - valueMinInset - valueMaxInset,
    height: rect.height
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
  for (const element of elements ?? []) {
    const target = resolveTarget(element);
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
  for (const element of elements ?? []) {
    const source = resolve(element);
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
  for (const element of elements ?? []) {
    const source = resolve(element);
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

// packages/ag-charts-core/src/utils/geometry/scaling.ts
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

// packages/ag-charts-core/src/utils/geometry/lineInterpolation.ts
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
  const [start2, end2] = spanRangeNormalized(span);
  const { x: spanX0, y: spanY0 } = start2;
  const { x: spanX1, y: spanY1 } = end2;
  if (x1 < spanX0) {
    return rescaleSpan(span, start2, start2);
  } else if (x0 > spanX1) {
    return rescaleSpan(span, end2, end2);
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

// packages/ag-charts-core/src/utils/zoomUtils.ts
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

// packages/ag-charts-core/src/utils/format/timeFormat.ts
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

// packages/ag-charts-core/src/rendering/domElements.ts
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

// packages/ag-charts-core/src/rendering/easing.ts
var linear = (n) => n;
var easeIn = (n) => 1 - Math.cos(n * Math.PI / 2);
var easeOut = (n) => Math.sin(n * Math.PI / 2);
var easeInOut = (n) => -(Math.cos(n * Math.PI) - 1) / 2;
var easeInQuad = (n) => n * n;
var easeOutQuad = (n) => 1 - (1 - n) ** 2;
var easeInOutQuad = (n) => n < 0.5 ? 2 * n * n : 1 - (-2 * n + 2) ** 2 / 2;
var inverseEaseOut = (x) => 2 * Math.asin(x) / Math.PI;

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
  AbstractModuleInstance,
  ActionOnSet,
  AgDocument,
  AsyncAwaitQueue,
  BASE_FONT_SIZE,
  BLOCK_IMAGE_SPACING,
  BREAK_TRANSFORM_CHAIN,
  BaseProperties,
  Bitfield,
  CANVAS_HEIGHT,
  CANVAS_TO_BUFFER_DEFAULTS,
  CANVAS_WIDTH,
  CARTESIAN_AXIS_TYPE,
  CARTESIAN_POSITION,
  COMMON_SERIES_THEME_DEFAULTS,
  CSS_GENERIC_FAMILIES,
  CallbackCache,
  ChartAxisDirection,
  ChartUpdateType,
  CleanupRegistry,
  Color,
  ConfiguredCanvasMixin,
  DEFAULT_ANNOTATION_HANDLE_FILL,
  DEFAULT_ANNOTATION_STATISTICS_COLOR,
  DEFAULT_ANNOTATION_STATISTICS_DIVIDER_STROKE,
  DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL,
  DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE,
  DEFAULT_ANNOTATION_STATISTICS_FILL,
  DEFAULT_ANNOTATION_STATISTICS_STROKE,
  DEFAULT_CAPTION_ALIGNMENT,
  DEFAULT_CAPTION_LAYOUT_STYLE,
  DEFAULT_FIBONACCI_STROKES,
  DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
  DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
  DEFAULT_MARKERLESS_LABEL_GAP,
  DEFAULT_POLAR_SERIES_STROKE,
  DEFAULT_SHADOW_COLOUR,
  DEFAULT_SPARKLINE_CROSSHAIR_STROKE,
  DEFAULT_TEXTBOX_COLOR,
  DEFAULT_TEXTBOX_FILL,
  DEFAULT_TEXTBOX_STROKE,
  DEFAULT_TEXT_ANNOTATION_COLOR,
  DEFAULT_TOOLBAR_POSITION,
  DIRECTION_SWAP_AXES,
  debugLogger_exports as Debug,
  debugMetrics_exports as DebugMetrics,
  DeclaredSceneChangeDetection,
  DeclaredSceneObjectChangeDetection,
  EllipsisChar,
  ErrorType,
  EventEmitter,
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
  Graph,
  IS_DARK_THEME,
  LABEL_BOXING_DEFAULTS,
  LABEL_BOXING_TOP_LEVEL_DEFAULTS,
  LABEL_OVERFLOW_ALWAYS_SHOW,
  LABEL_OVERFLOW_DEFAULTS,
  LABEL_PLACEMENT_STYLE_DEFAULTS,
  LEGEND_CONTAINER_THEME,
  LRUCache,
  LineSplitter,
  Logger,
  LtrEmbedding,
  MARKER_SERIES_HIGHLIGHT_STYLE,
  MULTI_SERIES_HIGHLIGHT_STYLE,
  MementoCaretaker,
  moduleRegistry_exports as ModuleRegistry,
  ModuleScope,
  ModuleType,
  ObserveChanges,
  PALETTE_ALT_DOWN_FILL,
  PALETTE_ALT_DOWN_STROKE,
  PALETTE_ALT_NEUTRAL_FILL,
  PALETTE_ALT_NEUTRAL_STROKE,
  PALETTE_ALT_UP_FILL,
  PALETTE_ALT_UP_STROKE,
  PALETTE_DOWN_FILL,
  PALETTE_DOWN_STROKE,
  PALETTE_NEUTRAL_FILL,
  PALETTE_NEUTRAL_STROKE,
  PALETTE_UP_FILL,
  PALETTE_UP_STROKE,
  PART_WHOLE_HIGHLIGHT_STYLE,
  POLAR_AXIS_SHAPE,
  POLAR_AXIS_TYPE,
  ParallelStateMachine,
  PolarZIndexMap,
  PopDirectionalFormatting,
  PropertiesArray,
  addFakeTransformToInstanceProperty as Property,
  ProxyOnWrite,
  ProxyProperty,
  ProxyPropertyOnWrite,
  ReactiveState,
  SAFE_FILLS_OPERATION,
  SAFE_FILL_OPERATION,
  SAFE_RANGE2_OPERATION,
  SAFE_STROKE_FILL_OPERATION,
  SEGMENTATION_DEFAULTS,
  SERIES_INTERACTION_THEME_DEFAULTS,
  SERIES_SELECTION_THEME,
  SINGLE_SERIES_HIGHLIGHT_STYLE,
  SKIP_JS_BUILTINS,
  STROKE_STYLE_THEME_DEFAULTS,
  ScaleAlignment,
  SceneArrayChangeDetection,
  SceneChangeDetection,
  SceneObjectChangeDetection,
  SceneRefChangeDetection,
  SeriesContentZIndexMap,
  SeriesZIndexMap,
  SimpleCache,
  SpanJoin,
  SpatialIndex,
  StateMachine,
  StateMachineProperty,
  TRIPLE_EQ,
  TextMeasurer,
  TickIntervals,
  TrimCharsRegex,
  TrimEdgeGuard,
  UNIT_MAX,
  UNIT_MIN,
  UnknownError,
  ValidationError,
  vector_exports as Vec2,
  vector4_exports as Vec4,
  Vertex,
  WeakCache,
  ZIndexMap,
  absValue,
  addEscapeEventListener,
  addFakeTransformToInstanceProperty,
  addMouseCloseListener,
  addObserverToInstanceProperty,
  addOverrideFocusVisibleEventListener,
  addTouchCloseListener,
  addTransformToInstanceProperty,
  addValues,
  aggregationBucketForDatum,
  aggregationDatumMatchesIndex,
  aggregationDomain,
  aggregationIndexForXRatio,
  aggregationRangeFittingPoints,
  aggregationXRatioForDatumIndex,
  aggregationXRatioForXValue,
  ambientLog_exports as ambientLog,
  ambientLogger,
  and,
  angleBetween,
  angularPadding,
  anyOverlap,
  appendEllipsis,
  applyBarLabelOrientation,
  applyPlacedBarLabelVisibility,
  applySkiaPatches,
  applyStyledMarkerSize,
  arcDistanceSquared,
  areScalingEqual,
  array,
  arrayLength,
  arrayOf,
  arrayOfDefs,
  arraysEqual,
  assignIfNotStrictlyEqual,
  attachDescription,
  attachListener,
  autoSizedLabelOptionsDefs,
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
  boxEmpty,
  boxesEqual,
  buildBarLabelData,
  buildBarLabelDatum,
  buildBarPositionedLabelDatum,
  buildDateFormatter,
  cachedTextMeasurer,
  calcLineHeight,
  calculatePlacement,
  callWithContext,
  callback,
  callbackDefs,
  callbackOf,
  canRenderTextOffscreen,
  ceilTo,
  checkDatum,
  circularSliceArray,
  clamp,
  clampArray,
  clipLines,
  clipSpanX,
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
  commonChartOptionsDefs,
  commonSeriesOptionsDefs,
  commonSeriesThemeableOptionsDefs,
  compactAggregationIndices,
  compareDates,
  composeContributedDefs,
  computeColorBins,
  computeExtremesAggregation,
  computeExtremesAggregationPartial,
  constant,
  contextMenuItemsArray,
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
  createScopedCache,
  createSelect,
  createStyleElement,
  createSvgElement,
  createTextArea,
  createTicks,
  date,
  dateToNumber,
  dateTruncationForDomain,
  datesSortOrder,
  debounce,
  decodeIntervalValue,
  deepClone,
  deepFreeze,
  defaultEpoch,
  defined,
  definedZoomState,
  deprecated,
  deprecatedValue,
  deriveNormalizedStops,
  describeValidator,
  diffArrays,
  discreteColorStops,
  distribute,
  downloadUrl,
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
  extractDecoratedProperties,
  extractDomain,
  fillCssOptionsDef,
  fillGradientDefaults,
  fillImageDefaults,
  fillOptionsDef,
  fillPatternDefaults,
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
  flush,
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
  getDOMMatrix,
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
  getResizeObserver,
  getSequentialColors,
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
  guardTextEdges,
  hasNoModifiers,
  hasRealChars,
  hasRequiredInPath,
  highlightOptionsDef,
  htmlElement,
  imageBoxAroundBaseline,
  imageSegmentBox,
  inRange,
  initRovingTabIndex,
  insertListItemsSorted,
  insetBox,
  insetBoxXY,
  insetFitRegion,
  insideBarContainer,
  insideBarRegion,
  insideBarValueInsets,
  instanceOf,
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
  isButtonClickEvent,
  isColor,
  isContinuous,
  isContributionRequested,
  isDate,
  isDecoratedObject,
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
  isPointLabelDatum,
  isProperties,
  isRegExp,
  isScaleValid,
  isSegmentTruncated,
  isString,
  isStringFillArray,
  isStringObject,
  isSymbol,
  isTextTruncated,
  isTimeInterval,
  isTimeIntervalUnit,
  isTruncated,
  isUnitTimeCategoryScaling,
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
  labelFitOptionsDefs,
  labelFootprintBox,
  labelGlyphCentre,
  labelOrientationDef,
  labelPlacementStyleDefs,
  labelPlacementStyleOptionsDef,
  labelTextAtShrinkRatio,
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
  linearGaugeSeriesOptionsDef,
  linearGaugeSeriesThemeableOptionsDef,
  linearGaugeTargetOptionsDef,
  linearPoints,
  listDecoratedProperties,
  lowestGranularityForInterval,
  lowestGranularityUnitForTicks,
  lowestGranularityUnitForValue,
  makeAccessibleClickListener,
  mapValues,
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
  number,
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
  parseColor,
  parseNumberFormat,
  parseOptionsPath,
  partial,
  partialAssign,
  pause,
  pick,
  pickDirectionZoom,
  placeLabels,
  placedLabelFit,
  placedSeriesLabelOptionsDefs,
  populateBucketSelectedFromSparse,
  populateBucketSelectedFromSparseSplit,
  positiveNumber,
  positiveNumberNonZero,
  positiveNumericValue,
  positiveNumericValueNonZero,
  preserveArabicJoining,
  previousPowerOf2,
  probedFitRegion,
  radialGaugeSeriesOptionsDef,
  radialGaugeSeriesThemeableOptionsDef,
  radialGaugeTargetOptionsDef,
  range,
  rangeValidator,
  ratio,
  readContributedValue,
  readIntegratedWrappedValue,
  record,
  rectLabelObstacles,
  regionTextCapacity,
  regionWidthAt,
  required,
  rescaleSpan,
  rescaleVisibleRange,
  resetIds,
  resolveCollideWith,
  resolveContributions,
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
  sectorLabelContainer,
  seedEpochColumnIdentity,
  seedNumericColumnIdentity,
  selectionContainmentValidator,
  selectionOptionsDef,
  seriesLabelOptionsDefs,
  seriesTooltipRangeValidator,
  setAttribute,
  setAttributes,
  setDocument,
  setElementBBox,
  setElementStyle,
  setElementStyles,
  setPath,
  setWindow,
  shadowOptionsDefs,
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
  solveBezier,
  sortAndUniqueDates,
  sortBasedOnArray,
  spanRange,
  splitBezier2D,
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
  themeOperator,
  throttle,
  tickFormat,
  tickStep,
  timeInterval,
  timeIntervalUnit,
  timeValueToNumber,
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
  transformIntegratedCategoryValue,
  trapezoidBandRect,
  trapezoidBox,
  trapezoidExtentAcross,
  trapezoidFitRegion,
  trapezoidOverlapsBox,
  truncateLine,
  typeUnion,
  undocumented,
  undocumentedLabelFitOptionsDefs,
  undocumentedThemeOptions,
  unguardTextEdges,
  union,
  unionOrArray,
  unionSymbol,
  unique,
  validate,
  verticalAlign,
  visitOptionsPath,
  withFitRegion,
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
