import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  verifySchoolLessons,
  collectSchoolWarnings,
  extractTechnicalIdentifier,
} from './verify-lesson-blocks.mjs';

import {
  isIslandChrome,
  assertIslandBlocksSupported,
  assertConsistentPreviewRuntimes,
  repairUntilValid,
  generate,
  createGenerationSessionId,
} from './generate.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultSchoolDir = process.env.ISLANDS_DEPS_SCHOOL || resolve(root, 'schools/astro-zero-to-one');

function checkDeps(schoolDir = defaultSchoolDir) {
  try {
    const req = createRequire(resolve(schoolDir, 'package.json'));
    req.resolve('pyodide');
    req.resolve('sucrase');
    req.resolve('preact');
    req.resolve('react');
    req.resolve('react-dom');
    return true;
  } catch {
    return false;
  }
}
const hasIslandDeps = checkDeps();
const depsSkipReason = '缺少依赖，请在 schools/astro-zero-to-one 执行 npm ci';

describe('verifySchoolLessons', () => {
  it('verifies all lessons in a directory and aggregates summary and errors with filenames', (t) => {
    if (!hasIslandDeps) {
      t.skip(depsSkipReason);
      return;
    }

    const tempDir = mkdtempSync(join(tmpdir(), 'verify-school-lessons-'));
    try {
      const goodContent = `---
title: Good Lesson
order: 1
---

\`\`\`python run
print("hello from good lesson")
\`\`\`
`;
      const badContent = `---
title: Bad Lesson
order: 2
---

\`\`\`python run
a = 1 / 0
print(a)
\`\`\`
`;
      writeFileSync(join(tempDir, '01-good.md'), goodContent, 'utf8');
      writeFileSync(join(tempDir, '02-bad.md'), badContent, 'utf8');

      const res = verifySchoolLessons(tempDir, defaultSchoolDir);

      assert.equal(res.ok, false);
      assert.equal(res.blocks.length, 2);
      assert.equal(res.summary.totalBlocks, 2);
      assert.equal(res.summary.passedBlocks, 1);
      assert.equal(res.summary.failedBlocks, 1);
      assert.equal(res.summary.passRate, 0.5);
      assert.deepEqual(res.summary.perLesson['01-good.md'], {
        total: 1,
        predict: 0,
        numberline: 0,
        run: 1,
        preview: 0,
      });
      assert.deepEqual(res.summary.perLesson['02-bad.md'], {
        total: 1,
        predict: 0,
        numberline: 0,
        run: 1,
        preview: 0,
      });
      assert.deepEqual(res.summary.byType, {
        predict: 0,
        numberline: 0,
        run: 2,
        preview: 0,
      });

      // Verify block files
      const goodBlock = res.blocks.find(b => b.file === '01-good.md');
      const badBlock = res.blocks.find(b => b.file === '02-bad.md');
      assert.ok(goodBlock, 'goodBlock should exist');
      assert.equal(goodBlock.ok, true);
      assert.ok(goodBlock.stdout.includes('hello from good lesson'));

      assert.ok(badBlock, 'badBlock should exist');
      assert.equal(badBlock.ok, false);
      assert.match(badBlock.error, /ZeroDivisionError/);

      // Verify formatted error contains file name
      assert.ok(res.error.includes('02-bad.md'), 'Error message must contain failing file name');
      assert.match(res.error, /ZeroDivisionError/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
      rmSync(join(root, 'evidence/generation', `${basename(tempDir)}.jsonl`), { force: true });
    }
  });

  it('aggregates all interactive block types in perLesson and byType', (t) => {
    if (!hasIslandDeps) {
      t.skip(depsSkipReason);
      return;
    }

    const tempDir = mkdtempSync(join(tmpdir(), 'verify-all-block-types-'));
    try {
      const content = `---
title: Mixed Lesson
order: 1
---

\`\`\`predict
question: What is 1 + 1?
choices: 1 | 2 | 3
answer: 2
explain: Math
\`\`\`

\`\`\`numberline
range: 0 .. 10
points: A=3 | B=7
show: distance
\`\`\`

\`\`\`python run
print("hello")
\`\`\`

\`\`\`html preview
<div>preview</div>
\`\`\`
`;
      writeFileSync(join(tempDir, '01-mixed.md'), content, 'utf8');

      const res = verifySchoolLessons(tempDir, defaultSchoolDir);
      assert.equal(res.ok, true);
      assert.equal(res.blocks.length, 2);
      assert.deepEqual(res.summary.perLesson['01-mixed.md'], {
        total: 4,
        predict: 1,
        numberline: 1,
        run: 1,
        preview: 1,
      });
      assert.deepEqual(res.summary.byType, {
        predict: 1,
        numberline: 1,
        run: 1,
        preview: 1,
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
      rmSync(join(root, 'evidence/generation', `${basename(tempDir)}.jsonl`), { force: true });
    }
  });
});

describe('Course-level rules', () => {
  it('detects isIslandChrome correctly from school config', () => {
    assert.equal(isIslandChrome('chrome: "island",'), true);
    assert.equal(isIslandChrome("chrome: 'island'"), true);
    assert.equal(isIslandChrome('// chrome: "island"'), false);
    assert.equal(isIslandChrome('/* chrome: "island" */'), false);
    assert.equal(isIslandChrome('name: "math-grade7",'), false);
  });

  it('rejects interactive blocks in non-island schools', () => {
    const predictLesson = [{
      name: '01-math.md',
      text: '---\ntitle: T\n---\n```predict\nquestion: Q\nanswer: A\nexplain: E\n```',
    }];
    assert.throws(
      () => assertIslandBlocksSupported(false, predictLesson),
      /predict 交互块，但当前学校不是 island chrome 皮肤/
    );

    const runLesson = [{
      name: '02-py.md',
      text: '---\ntitle: T\n---\n```python run\nprint(1)\n```',
    }];
    assert.throws(
      () => assertIslandBlocksSupported(false, runLesson),
      /run\/preview 交互块，但当前学校不是 island chrome 皮肤/
    );

    const previewLesson = [{
      name: '03-preview.md',
      text: '---\ntitle: T\n---\n```html preview\n<div>hi</div>\n```',
    }];
    assert.throws(
      () => assertIslandBlocksSupported(false, previewLesson),
      /run\/preview 交互块，但当前学校不是 island chrome 皮肤/
    );

    const numberlineLesson = [{
      name: '04-line.md',
      text: '---\ntitle: T\n---\n```numberline\nrange: 0 .. 10\n```',
    }];
    assert.throws(
      () => assertIslandBlocksSupported(false, numberlineLesson),
      /numberline 交互块，但当前学校不是 island chrome 皮肤/
    );

    // Island school allows all of them
    assert.doesNotThrow(() => assertIslandBlocksSupported(true, predictLesson));
    assert.doesNotThrow(() => assertIslandBlocksSupported(true, runLesson));
    assert.doesNotThrow(() => assertIslandBlocksSupported(true, previewLesson));
    assert.doesNotThrow(() => assertIslandBlocksSupported(true, numberlineLesson));

    // Non-island school allows normal code fences without interactive keywords
    const normalLesson = [{
      name: '05-normal.md',
      text: '---\ntitle: T\n---\n```python\nprint(1)\n```',
    }];
    assert.doesNotThrow(() => assertIslandBlocksSupported(false, normalLesson));
  });

  it('rejects mixing React and Preact in jsx/tsx preview blocks and identifies file and line', () => {
    const reactLesson = {
      name: '01-react.md',
      text: `---
title: React Lesson
---

\`\`\`jsx preview
import React, { useState } from 'react';
export default function App() { return <div>Hi</div>; }
\`\`\`
`,
    };

    const preactDefaultLesson = {
      name: '02-preact-default.md',
      text: `---
title: Preact Lesson
---

# Section

\`\`\`jsx preview
export default function App() { return <div>No Import</div>; }
\`\`\`
`,
    };

    // Mixing React and defaulted Preact should throw and cite the Preact file and line
    assert.throws(
      () => assertConsistentPreviewRuntimes([reactLesson, preactDefaultLesson]),
      (err) => {
        assert.match(err.message, /一门课中不能混用 React 和 Preact/);
        assert.match(err.message, /02-preact-default\.md/);
        assert.match(err.message, /第 7 行/);
        return true;
      }
    );

    // All React should not throw
    const reactLesson2 = {
      name: '02-react-second.md',
      text: `---
title: React Second
---

\`\`\`tsx preview
import React from 'react';
export default function App() { return <div>Second</div>; }
\`\`\`
`,
    };
    assert.doesNotThrow(() => assertConsistentPreviewRuntimes([reactLesson, reactLesson2]));

    // All Preact should not throw
    const preactLesson = {
      name: '01-preact.md',
      text: `---
title: Preact First
---

\`\`\`jsx preview
export default function App() { return <div>Preact</div>; }
\`\`\`
`,
    };
    assert.doesNotThrow(() => assertConsistentPreviewRuntimes([preactLesson, preactDefaultLesson]));
  });
});

describe('repairUntilValid', () => {
  it('returns validate result immediately on first round pass without calling repair', async () => {
    let validateCalls = 0;
    let repairCalls = 0;
    const res = await repairUntilValid({
      validate: async () => {
        validateCalls++;
        return 42;
      },
      repair: async () => {
        repairCalls++;
      },
      maxRounds: 2,
    });
    assert.equal(res, 42);
    assert.equal(validateCalls, 1);
    assert.equal(repairCalls, 0);
  });

  it('calls repair once and passes on second round', async () => {
    let validateCalls = 0;
    let repairCalls = 0;
    const startRounds = [];
    const resultRounds = [];

    const res = await repairUntilValid({
      validate: async () => {
        validateCalls++;
        if (validateCalls === 1) {
          throw new Error('first attempt failed');
        }
        return 'success';
      },
      repair: async (lastError, round) => {
        repairCalls++;
        assert.equal(lastError.message, 'first attempt failed');
        assert.equal(round, 1);
        return 'fixed';
      },
      maxRounds: 2,
      onRoundStart: (r) => startRounds.push(r),
      onRoundResult: (r, res) => resultRounds.push({ r, res }),
    });

    assert.equal(res, 'success');
    assert.equal(validateCalls, 2);
    assert.equal(repairCalls, 1);
    assert.deepEqual(startRounds, [1]);
    assert.deepEqual(resultRounds, [{ r: 1, res: 'fixed' }]);
  });

  it('fails after two repair rounds and throws the last error', async () => {
    let validateCalls = 0;
    let repairCalls = 0;
    const failureRounds = [];

    const err1 = new Error('attempt 1 error');
    const err2 = new Error('attempt 2 error');
    const err3 = new Error('attempt 3 error');

    await assert.rejects(
      () =>
        repairUntilValid({
          validate: async () => {
            validateCalls++;
            if (validateCalls === 1) throw err1;
            if (validateCalls === 2) throw err2;
            throw err3;
          },
          repair: async (lastError, round) => {
            repairCalls++;
            if (round === 1) assert.equal(lastError, err1);
            if (round === 2) assert.equal(lastError, err2);
            return `repair ${round}`;
          },
          maxRounds: 2,
          onRoundFailure: (r, err) => failureRounds.push({ r, err }),
        }),
      (err) => {
        assert.equal(err, err3);
        return true;
      }
    );

    assert.equal(validateCalls, 3);
    assert.equal(repairCalls, 2);
    assert.equal(failureRounds.length, 2);
    assert.equal(failureRounds[0].r, 1);
    assert.equal(failureRounds[0].err, err2);
    assert.equal(failureRounds[1].r, 2);
    assert.equal(failureRounds[1].err, err3);
  });
});

describe('Session ID consistency across generate and repair rounds', () => {
  it('passes the exact same sessionId to both initial generation and repair rounds', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'generate-session-test-'));
    const tempSchoolDir = join(tempDir, 'school');
    writeFileSync(join(tempDir, 'school.config.ts'), 'export default {}', 'utf8');
    const inputPath = join(tempDir, 'input.json');
    writeFileSync(inputPath, JSON.stringify({ output: relative(root, tempDir) }), 'utf8');

    const recordedSessionIds = [];
    const recordedAppendLogs = [];
    const fakePiPrint = async (prompt, opts) => {
      recordedSessionIds.push(opts.sessionId);
      recordedAppendLogs.push(opts.appendLog);
      return 'fake summary';
    };

    let validateCalls = 0;
    const fakeValidate = async () => {
      validateCalls++;
      if (validateCalls === 1) throw new Error('validation failed round 1');
      return 1;
    };

    try {
      await generate(inputPath, {
        piPrint: fakePiPrint,
        validate: fakeValidate,
      });

      assert.equal(recordedSessionIds.length, 2);
      assert.ok(recordedSessionIds[0], 'First round should have a sessionId');
      assert.match(recordedSessionIds[0], new RegExp(`^${basename(tempDir)}-`));
      assert.equal(recordedSessionIds[0], recordedSessionIds[1], 'Repair round must receive the exact same sessionId');
      assert.equal(recordedAppendLogs[0], undefined);
      assert.equal(recordedAppendLogs[1], true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
      rmSync(join(root, 'evidence/generation', `${basename(tempDir)}.jsonl`), { force: true });
    }
  });
});

describe('Generation warnings vs errors', () => {
  it('collects warning when html preview references external http(s) resources without throwing', () => {
    const lessons = [
      {
        name: '01-preview.md',
        text: `---\ntitle: Preview\n---\n\`\`\`html preview\n<script src="https://cdn.example.com/app.js"></script>\n\`\`\``,
      },
    ];
    const warnings = collectSchoolWarnings(lessons);
    const ext = warnings.filter((w) => w.code === 'preview-external-resource');
    assert.equal(ext.length, 1);
    assert.equal(ext[0].level, 'warning');
    assert.equal(ext[0].file, '01-preview.md');
    assert.match(ext[0].message, /引用了外部 http:\/\/ 或 https:\/\/ 资源/);
  });

  it('warns when a single lesson has more than 3 interactive blocks', () => {
    const lessonWith4Blocks = [
      {
        name: '01-heavy.md',
        text: `---
title: Heavy
---
\`\`\`predict
question: Q1?
answer: A1
explain: E1
\`\`\`

\`\`\`predict
question: Q2?
answer: A2
explain: E2
\`\`\`

\`\`\`python run
print("one")
\`\`\`

\`\`\`python run
print("two")
\`\`\`
`,
      },
    ];
    const warnings = collectSchoolWarnings(lessonWith4Blocks);
    const tooMany = warnings.filter((w) => w.code === 'too-many-interactive-blocks');
    assert.equal(tooMany.length, 1);
    assert.equal(tooMany[0].level, 'warning');
    assert.equal(tooMany[0].file, '01-heavy.md');
    assert.match(tooMany[0].message, /超过了建议的上限/);
  });

  it('warns when programming course has 0 interactive blocks, but does not warn for non-programming course with 0 blocks', () => {
    const codingCourse0Blocks = [
      {
        name: '01-py.md',
        text: `---
title: Python Lesson
---
Here is some code:
\`\`\`python
def greet():
    print("hi")
\`\`\`
`,
      },
    ];
    const codingWarnings = collectSchoolWarnings(codingCourse0Blocks);
    const codingNoBlocks = codingWarnings.filter((w) => w.code === 'no-interactive-blocks-in-coding-course');
    assert.equal(codingNoBlocks.length, 1);
    assert.equal(codingNoBlocks[0].level, 'warning');

    const nonCodingCourse0Blocks = [
      {
        name: '01-history.md',
        text: `---
title: History Lesson
---
In 1911, the revolution took place.
Here is a quote:
> Historical text
`,
      },
    ];
    const nonCodingWarnings = collectSchoolWarnings(nonCodingCourse0Blocks);
    const nonCodingNoBlocks = nonCodingWarnings.filter((w) => w.code === 'no-interactive-blocks-in-coding-course');
    assert.equal(nonCodingNoBlocks.length, 0);
  });

  it('warns with line number when non-programming course uses html preview demo', () => {
    const nonCodingWithPreview = [
      {
        name: '01-history.md',
        text: `---
title: Ancient History
---

# Timeline

\`\`\`html preview
<div id="timeline">Ancient Timeline</div>
\`\`\`
`,
      },
    ];
    const warnings = collectSchoolWarnings(nonCodingWithPreview);
    const previewWarnings = warnings.filter((w) => w.code === 'preview-in-non-programming-course');
    assert.equal(previewWarnings.length, 1);
    assert.equal(previewWarnings[0].level, 'warning');
    assert.equal(previewWarnings[0].file, '01-history.md');
    assert.equal(previewWarnings[0].line, 7);
    assert.match(previewWarnings[0].message, /请人工核对演示是否正确/);
  });

  it('returns two info warnings when COURSE.md has two wanted interaction lines', () => {
    const courseMd = `# Course Goal

## Wanted interactions
- 01-algebra: drag-and-drop equation balancer for two-sided operations
- 02-geometry: compass-and-straightedge canvas demo

## Architecture
`;
    const warnings = collectSchoolWarnings([], { courseMdText: courseMd });
    const wanted = warnings.filter((w) => w.code === 'wanted-interaction');
    assert.equal(wanted.length, 2);
    assert.equal(wanted[0].level, 'info');
    assert.equal(wanted[1].level, 'info');
    assert.equal(wanted[0].file, 'COURSE.md');
    assert.equal(wanted[1].file, 'COURSE.md');
    assert.match(wanted[0].message, /drag-and-drop equation balancer/);
    assert.match(wanted[1].message, /compass-and-straightedge canvas demo/);
  });

  it('does not trigger repair when validation produces only warnings without errors', async () => {
    let validateCalls = 0;
    let repairCalls = 0;

    const fakeValidateWithWarnings = async () => {
      validateCalls++;
      return 5;
    };

    const res = await repairUntilValid({
      validate: fakeValidateWithWarnings,
      repair: async () => {
        repairCalls++;
      },
      maxRounds: 2,
    });

    assert.equal(res, 5);
    assert.equal(validateCalls, 1);
    assert.equal(repairCalls, 0);
  });

  it('warns about unsourced technical identifiers with source comparison rules', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'unsourced-id-'));
    try {
      const sourcesDir = join(tempDir, 'public/sources');
      mkdirSync(join(sourcesDir, 'material-1'), { recursive: true });
      writeFileSync(
        join(sourcesDir, 'material-1/doc.txt'),
        'Here is the document describing --sandbox options.',
        'utf8'
      );

      // sources contains --sandbox but not workspace-write -> only reports workspace-write
      const lessonWithBoth = [
        {
          file: '01.md',
          text: `---
title: Lesson 1
sources:
  - material-1/doc.txt
---
Here is \`--sandbox\` and \`workspace-write\`.
`,
        },
      ];
      const w1 = collectSchoolWarnings(lessonWithBoth, { sourcesDir });
      const u1 = w1.filter((w) => w.code === 'unsourced-identifier');
      assert.equal(u1.length, 1);
      assert.equal(u1[0].level, 'warning');
      assert.deepEqual(u1[0].identifiers, ['workspace-write']);
      assert.ok(u1[0].message.includes('workspace-write'));
      assert.ok(!u1[0].message.includes('--sandbox'));

      // all identifiers in sources -> no warning
      const lessonAllInSources = [
        {
          file: '02.md',
          text: `---
title: Lesson 2
sources:
  - material-1/doc.txt
---
Here is \`--sandbox\` only.
`,
        },
      ];
      const w2 = collectSchoolWarnings(lessonAllInSources, { sourcesDir });
      const u2 = w2.filter((w) => w.code === 'unsourced-identifier');
      assert.equal(u2.length, 0);

      // no sources -> no warning
      const lessonNoSources = [
        {
          file: '03.md',
          text: `---
title: Lesson 3
---
Here is \`workspace-write\` without sources.
`,
        },
      ];
      const w3 = collectSchoolWarnings(lessonNoSources, { sourcesDir });
      const u3 = w3.filter((w) => w.code === 'unsourced-identifier');
      assert.equal(u3.length, 0);

      // snippet containing spaces is split into words
      const lessonWithSpaces = [
        {
          file: '04.md',
          text: `---
title: Lesson 4
sources:
  - material-1/doc.txt
---
Command: \`codex --sandbox workspace-write\`.
`,
        },
      ];
      const w4 = collectSchoolWarnings(lessonWithSpaces, { sourcesDir });
      const u4 = w4.filter((w) => w.code === 'unsourced-identifier');
      assert.equal(u4.length, 1);
      assert.deepEqual(u4[0].identifiers, ['workspace-write']);

      // .html prioritizes companion .txt
      writeFileSync(
        join(sourcesDir, 'material-1/page.html'),
        '<html><body>workspace-write is here</body></html>',
        'utf8'
      );
      writeFileSync(
        join(sourcesDir, 'material-1/page.html.txt'),
        'extracted text only has --sandbox',
        'utf8'
      );
      const lessonHtml = [
        {
          file: '05.md',
          text: `---
title: Lesson 5
sources:
  - material-1/page.html
---
Check \`--sandbox\` and \`workspace-write\`.
`,
        },
      ];
      const w5 = collectSchoolWarnings(lessonHtml, { sourcesDir });
      const u5 = w5.filter((w) => w.code === 'unsourced-identifier');
      assert.equal(u5.length, 1);
      assert.deepEqual(u5[0].identifiers, ['workspace-write']);

      // tightened identifier assertions: paths/keys ignored, flags/home-paths/kebab-snake recognized
      assert.equal(extractTechnicalIdentifier('src/pages/about.astro'), null);
      assert.equal(extractTechnicalIdentifier('post-2.md'), null);
      assert.equal(extractTechnicalIdentifier('./run.sh'), null);
      assert.equal(extractTechnicalIdentifier('Ctrl-D'), null);

      assert.equal(extractTechnicalIdentifier('--sandbox'), '--sandbox');
      assert.equal(extractTechnicalIdentifier('~/.codex/AGENTS.md'), '~/.codex/AGENTS.md');
      assert.equal(extractTechnicalIdentifier('workspace-write'), 'workspace-write');
      assert.equal(extractTechnicalIdentifier('on_request'), 'on_request');

      const lessonTightened = [
        {
          file: '06.md',
          text: `---
title: Lesson 6
sources:
  - material-1/doc.txt
---
Here are \`src/pages/about.astro\`, \`post-2.md\`, \`./run.sh\`, \`Ctrl-D\`, \`~/.codex/AGENTS.md\`, and \`on_request\`.
`,
        },
      ];
      const w6 = collectSchoolWarnings(lessonTightened, { sourcesDir });
      const u6 = w6.filter((w) => w.code === 'unsourced-identifier');
      assert.equal(u6.length, 1);
      assert.deepEqual(u6[0].identifiers, ['~/.codex/AGENTS.md', 'on_request']);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('warns about echo-only run blocks when the language is not taught', () => {
    const jsEchoCode = 'const a=["甲","乙"]; console.log("清单："+a.join("、"))';
    const jsEchoLesson = [
      {
        file: '01.md',
        text: `---
title: CLI Lesson
---
\`\`\`javascript run
${jsEchoCode}
\`\`\`
`,
      },
    ];

    // JS run block with join, no other js fence -> warn
    const blocks1 = [
      {
        file: '01.md',
        line: 5,
        lang: 'javascript',
        mode: 'run',
        code: jsEchoCode,
        stdout: '清单：甲、乙\n',
        ok: true,
      },
    ];
    const w1 = collectSchoolWarnings(jsEchoLesson, { blocks: blocks1 });
    const echo1 = w1.filter((w) => w.code === 'echo-only-run-block');
    assert.equal(echo1.length, 1);
    assert.equal(echo1[0].level, 'warning');
    assert.equal(echo1[0].file, '01.md');
    assert.equal(echo1[0].line, 5);
    assert.match(echo1[0].message, /只打印写死的文字/);

    // Same block, but course has other js normal code fence -> no warning
    const jsTaughtLesson = [
      {
        file: '01.md',
        text: `---
title: JS Lesson
---
\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`javascript run
${jsEchoCode}
\`\`\`
`,
      },
    ];
    const w2 = collectSchoolWarnings(jsTaughtLesson, { blocks: blocks1 });
    const echo2 = w2.filter((w) => w.code === 'echo-only-run-block');
    assert.equal(echo2.length, 0);

    // console.log(1+2) -> 3 is not in literals -> no warning
    const mathCode = 'console.log(1+2)';
    const mathLesson = [
      {
        file: '02.md',
        text: `---
title: Math Lesson
---
\`\`\`javascript run
${mathCode}
\`\`\`
`,
      },
    ];
    const blocksMath = [
      {
        file: '02.md',
        line: 5,
        lang: 'javascript',
        mode: 'run',
        code: mathCode,
        stdout: '3\n',
        ok: true,
      },
    ];
    const w3 = collectSchoolWarnings(mathLesson, { blocks: blocksMath });
    const echo3 = w3.filter((w) => w.code === 'echo-only-run-block');
    assert.equal(echo3.length, 0);

    // Python lesson print("Hello, world") + has other python fence -> no warning
    const pyCode = 'print("Hello, world")';
    const pyLesson = [
      {
        file: '03.md',
        text: `---
title: Python Lesson
---
\`\`\`python
def greet(): pass
\`\`\`

\`\`\`python run
${pyCode}
\`\`\`
`,
      },
    ];
    const blocksPy = [
      {
        file: '03.md',
        line: 9,
        lang: 'python',
        mode: 'run',
        code: pyCode,
        stdout: 'Hello, world\n',
        ok: true,
      },
    ];
    const w4 = collectSchoolWarnings(pyLesson, { blocks: blocksPy });
    const echo4 = w4.filter((w) => w.code === 'echo-only-run-block');
    assert.equal(echo4.length, 0);
  });

  it('repairUntilValid does not trigger repair on unsourced-identifier or echo-only-run-block warnings', async () => {
    let validateCalls = 0;
    let repairCalls = 0;

    const fakeValidate = async () => {
      validateCalls++;
      // Return successfully even when warnings exist
      return 6;
    };

    const res = await repairUntilValid({
      validate: fakeValidate,
      repair: async () => {
        repairCalls++;
      },
      maxRounds: 2,
    });

    assert.equal(res, 6);
    assert.equal(validateCalls, 1);
    assert.equal(repairCalls, 0);
  });
});
