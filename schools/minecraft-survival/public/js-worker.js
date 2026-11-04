const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export function formatArg(val) {
  if (typeof val === "string") return val;
  if (val === undefined) return "undefined";
  if (val === null) return "null";
  if (typeof val === "number" || typeof val === "boolean" || typeof val === "symbol") return String(val);
  if (typeof val === "bigint") return `${val}n`;
  if (typeof val === "function") return `[Function: ${val.name || "anonymous"}]`;
  if (val instanceof Error || (typeof val === "object" && val !== null && Object.prototype.toString.call(val) === "[object Error]")) return `${val.name}: ${val.message}`;
  if (val instanceof Map || (typeof val === "object" && val !== null && Object.prototype.toString.call(val) === "[object Map]")) {
    const entries = Array.from(val.entries()).map(([k, v]) => `${formatArg(k)} => ${formatArg(v)}`);
    return `Map(${val.size}) { ${entries.join(", ")} }`;
  }
  if (val instanceof Set || (typeof val === "object" && val !== null && Object.prototype.toString.call(val) === "[object Set]")) {
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
          if (value instanceof Map || (typeof value === "object" && value !== null && Object.prototype.toString.call(value) === "[object Map]")) return `Map(${value.size})`;
          if (value instanceof Set || (typeof value === "object" && value !== null && Object.prototype.toString.call(value) === "[object Set]")) return `Set(${value.size})`;
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

export async function runJsCode(code, options = {}) {
  const stdoutBuf = [];
  const stderrBuf = [];
  const customConsole = {
    log: (...args) => {
      stdoutBuf.push(args.map((a) => formatArg(a)).join(" "));
    },
    info: (...args) => {
      stdoutBuf.push(args.map((a) => formatArg(a)).join(" "));
    },
    warn: (...args) => {
      stderrBuf.push(args.map((a) => formatArg(a)).join(" "));
    },
    error: (...args) => {
      stderrBuf.push(args.map((a) => formatArg(a)).join(" "));
    },
  };

  let error = null;
  if (options && options.vm) {
    const vm = options.vm;
    const context = vm.createContext({
      console: customConsole,
      ...(options.context || {}),
    });
    try {
      const script = new vm.Script(`(async () => {\n${code}\n})()`);
      const promise = script.runInContext(context, {
        timeout: options.timeout,
      });
      await promise;
    } catch (err) {
      error =
        err && err.name && err.message
          ? `${err.name}: ${err.message}`
          : String(err);
    }
  } else {
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = customConsole.log;
    console.info = customConsole.info;
    console.warn = customConsole.warn;
    console.error = customConsole.error;

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
  }

  let finalStderr = stderrBuf.length > 0 ? stderrBuf.join("\n") + "\n" : "";
  if (error) {
    finalStderr = finalStderr ? finalStderr + error : error;
  }

  return {
    stdout: stdoutBuf.length > 0 ? stdoutBuf.join("\n") + "\n" : "",
    stderr: finalStderr,
    error,
  };
}

if (typeof self !== "undefined" && typeof self.postMessage === "function") {
  self.onmessage = async (event) => {
    const { id, type, code } = event.data;
    if (type === "run") {
      self.postMessage({ id, type: "started" });
      const { stdout, stderr, error } = await runJsCode(code);
      self.postMessage({
        id,
        type: "result",
        stdout,
        stderr,
        ok: !error,
      });
    }
  };
}
