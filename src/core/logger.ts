import path from "path";

function getCallerInfo() {
  const originalFunc = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const err = new Error();
  const stack = err.stack as unknown as NodeJS.CallSite[];
  Error.prepareStackTrace = originalFunc;

  const caller = stack[2];
  const fullPath = caller?.getFileName();
  const lineNumber = caller?.getLineNumber();

  if (!fullPath) return __filename;

  const relativePath = path.relative(
    path.dirname(require.main?.filename || ""),
    fullPath
  );

  return `${relativePath || __filename}:${lineNumber}`;
}

export default {
  log(...rest: unknown[]) {
    console.log.apply(this, [
      new Date(),
      "📜",
      ...rest,
      ">>>",
      getCallerInfo(),
    ]);
  },
  info(...rest: unknown[]) {
    console.log.apply(this, [
      new Date(),
      "🔔",
      ...rest,
      ">>>",
      getCallerInfo(),
    ]);
  },
  success(...rest: unknown[]) {
    console.log.apply(this, [
      new Date(),
      "✅",
      ...rest,
      ">>>",
      getCallerInfo(),
    ]);
  },
  warning(...rest: unknown[]) {
    console.warn.apply(this, [
      new Date(),
      "⚠️",
      ...rest,
      ">>>",
      getCallerInfo(),
    ]);
  },
  error(...rest: unknown[]) {
    console.error.apply(this, [
      new Date(),
      "⛔",
      ...rest,
      ">>>",
      getCallerInfo(),
    ]);
  },
};
