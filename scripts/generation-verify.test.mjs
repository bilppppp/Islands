import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  verifySchoolLessons,
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
