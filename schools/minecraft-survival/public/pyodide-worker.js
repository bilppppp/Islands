let pyodide = null;
let pyodideReadyPromise = null;

export const PYTHON_BOOTSTRAP = `
import sys, io, traceback

class _StdinMock:
    def __init__(self, lines):
        self.lines = list(lines)
        self.index = 0
    def readline(self):
        if self.index < len(self.lines):
            line = self.lines[self.index]
            self.index += 1
            return line + "\\n"
        raise EOFError("程序请求了输入 (input())，但未提供足够的输入行。请在「程序输入」框中按行提供输入。")

def _clean_traceback(exc):
    tb = exc.__traceback__
    filtered = []
    curr = tb
    while curr:
        if curr.tb_frame.f_code.co_filename == "<stdin>":
            filtered.append(curr)
        curr = curr.tb_next
    if filtered:
        lines = ["Traceback (most recent call last):\\n"]
        for f in filtered:
            lines.extend(traceback.format_tb(f, limit=1))
        lines.extend(traceback.format_exception_only(type(exc), exc))
        return "".join(lines)
    return "".join(traceback.format_exception_only(type(exc), exc))

def _run_snippet(code, stdin_text=""):
    stdin_lines = stdin_text.replace("\\r\\n", "\\n").split("\\n") if stdin_text else []
    old_stdout, old_stderr, old_stdin = sys.stdout, sys.stderr, sys.stdin
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    sys.stdout, sys.stderr = stdout_buf, stderr_buf
    sys.stdin = _StdinMock(stdin_lines)
    error = None
    try:
        ns = {
            "__name__": "__main__",
            "__doc__": None,
            "__annotations__": {},
            "__builtins__": __builtins__,
        }
        compiled = compile(code, "<stdin>", "exec")
        exec(compiled, ns)
    except SystemExit:
        pass
    except Exception as e:
        error = _clean_traceback(e)
    finally:
        sys.stdout, sys.stderr, sys.stdin = old_stdout, old_stderr, old_stdin
    return stdout_buf.getvalue(), stderr_buf.getvalue(), error
`;

async function getPyodide(indexURL) {
  if (pyodide) return pyodide;
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = (async () => {
      const url = indexURL.endsWith("/") ? indexURL : indexURL + "/";
      const { loadPyodide } = await import(url + "pyodide.mjs");
      const instance = await loadPyodide({
        indexURL: url,
      });
      instance.runPython(PYTHON_BOOTSTRAP);
      pyodide = instance;
      return instance;
    })();
  }
  return pyodideReadyPromise;
}

export function runPythonSnippet(py, code, stdin = "") {
  const runner = py.globals.get("_run_snippet");
  const tuple = runner(code, stdin);
  const [stdout, stderr, error] = tuple.toJs();
  tuple.destroy();

  let finalStderr = stderr || "";
  if (error) {
    finalStderr = finalStderr ? finalStderr + "\n" + error : error;
  }

  return {
    stdout: stdout || "",
    stderr: finalStderr || "",
    error: error || null,
  };
}

if (typeof self !== "undefined" && typeof self.postMessage === "function") {
  self.onmessage = async (event) => {
    const { id, type, code, stdin = "", indexURL = "/vendor/pyodide/" } = event.data;
    if (type === "run") {
      try {
        if (!pyodide) {
          self.postMessage({ id, type: "status", text: "正在准备 Python（首次约需几秒）" });
        }
        const py = await getPyodide(indexURL);
        self.postMessage({ id, type: "started" });

        const { stdout, stderr, error } = runPythonSnippet(py, code, stdin);

        self.postMessage({
          id,
          type: "result",
          stdout,
          stderr,
          ok: !error,
        });
      } catch (err) {
        self.postMessage({
          id,
          type: "result",
          stdout: "",
          stderr: String(err?.message || err),
          ok: false,
        });
      }
    }
  };
}
