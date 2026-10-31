const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function formatArg(val) {
  if (typeof val === "string") return val;
  if (val === undefined) return "undefined";
  if (val === null) return "null";
  if (typeof val === "number" || typeof val === "boolean" || typeof val === "symbol") return String(val);
  if (typeof val === "bigint") return `${val}n`;
  if (typeof val === "function") return `[Function: ${val.name || "anonymous"}]`;
  if (val instanceof Error) return `${val.name}: ${val.message}`;
  if (val instanceof Map) {
    const entries = Array.from(val.entries()).map(([k, v]) => `${formatArg(k)} => ${formatArg(v)}`);
    return `Map(${val.size}) { ${entries.join(", ")} }`;
  }
  if (val instanceof Set) {
    const items = Array.from(val.values()).map((v) => formatArg(v));
    return `Set(${val.size}) { ${items.join(", ")} }`;
  }
  if (typeof val === "object") {
    const ancestors = [];
    try {
      return JSON.stringify(
        val,
        function (key, value) {
          if (typeof value === "bigint") return `${value}n`;
          if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
          if (value === undefined) return "undefined";
          if (value instanceof Map) return `Map(${value.size})`;
          if (value instanceof Set) return `Set(${value.size})`;
          if (typeof value === "object" && value !== null) {
            while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
              ancestors.pop();
            }
            if (ancestors.includes(value)) {
              return "[Circular]";
            }
            ancestors.push(value);
          }
          return value;
        },
        2,
      );
    } catch {
      return String(val);
    }
  }
  return String(val);
}

self.onmessage = async (event) => {
  const { id, type, code } = event.data;
  if (type === "run") {
    self.postMessage({ id, type: "started" });
    const stdoutBuf = [];
    const stderrBuf = [];
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      stdoutBuf.push(args.map((a) => formatArg(a)).join(" "));
    };
    console.info = (...args) => {
      stdoutBuf.push(args.map((a) => formatArg(a)).join(" "));
    };
    console.warn = (...args) => {
      stderrBuf.push(args.map((a) => formatArg(a)).join(" "));
    };
    console.error = (...args) => {
      stderrBuf.push(args.map((a) => formatArg(a)).join(" "));
    };

    let error = null;
    try {
      const fn = new AsyncFunction(code);
      await fn();
    } catch (err) {
      error =
        err && err.name && err.message
          ? `${err.name}: ${err.message}`
          : String(err);
    } finally {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    }

    let finalStderr = stderrBuf.length > 0 ? stderrBuf.join("\n") + "\n" : "";
    if (error) {
      finalStderr = finalStderr ? finalStderr + error : error;
    }

    self.postMessage({
      id,
      type: "result",
      stdout: stdoutBuf.length > 0 ? stdoutBuf.join("\n") + "\n" : "",
      stderr: finalStderr,
      ok: !error,
    });
  }
};
