"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
function getCallerInfo() {
    var _a;
    const originalFunc = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const err = new Error();
    const stack = err.stack;
    Error.prepareStackTrace = originalFunc;
    // Skip the first two stack frames to get the caller of the logger
    const caller = stack[2];
    const fullPath = caller === null || caller === void 0 ? void 0 : caller.getFileName();
    const lineNumber = caller === null || caller === void 0 ? void 0 : caller.getLineNumber();
    if (!fullPath)
        return __filename;
    // Get the path relative to the main module (the entry point)
    const relativePath = path_1.default.relative(path_1.default.dirname(((_a = require.main) === null || _a === void 0 ? void 0 : _a.filename) || ""), fullPath);
    return `${relativePath || __filename}:${lineNumber}`;
}
exports.default = {
    log(...rest) {
        console.log.apply(this, [
            new Date(),
            "📜",
            ...rest,
            ">>>",
            getCallerInfo(),
        ]);
    },
    info(...rest) {
        console.log.apply(this, [
            new Date(),
            "🔔",
            ...rest,
            ">>>",
            getCallerInfo(),
        ]);
    },
    success(...rest) {
        console.log.apply(this, [
            new Date(),
            "✅",
            ...rest,
            ">>>",
            getCallerInfo(),
        ]);
    },
    warning(...rest) {
        console.warn.apply(this, [
            new Date(),
            "⚠️",
            ...rest,
            ">>>",
            getCallerInfo(),
        ]);
    },
    error(...rest) {
        console.error.apply(this, [
            new Date(),
            "⛔",
            ...rest,
            ">>>",
            getCallerInfo(),
        ]);
    },
};
