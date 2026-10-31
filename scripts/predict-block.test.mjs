import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePredictBlock,
  collectPredictBlocks,
  assertPredictBlocks,
  parseNumberlineBlock,
  collectNumberlineBlocks,
  assertNumberlineBlocks,
} from '../school-kit/overlay/src/lib/predict-block.mjs';
import { assertLessonCodeBlocks } from '../school-kit/overlay/src/lib/run-block.mjs';

function lesson(body) {
  return `---\ntitle: Example\norder: 1\n---\n\n${body}\n`;
}

describe('predict blocks', () => {
  it('parses normal block with choices', () => {
    const source = `question: 下面这行会输出什么？ print(7 // 2)
choices: 3 | 3.5 | 4
answer: 3
explain: \`//\` 是向下取整除法，7 除以 2 得 3.5，向下取整为 3。`;

    const parsed = parsePredictBlock(source);
    assert.deepEqual(parsed, {
      question: '下面这行会输出什么？ print(7 // 2)',
      choices: ['3', '3.5', '4'],
      answer: '3',
      explain: '`//` 是向下取整除法，7 除以 2 得 3.5，向下取整为 3。',
    });

    const doc = lesson('```predict\n' + source + '\n```');
    const result = assertPredictBlocks(doc, 'test.md');
    assert.equal(result.length, 1);
    assert.equal(result[0].question, '下面这行会输出什么？ print(7 // 2)');
    assert.deepEqual(result[0].choices, ['3', '3.5', '4']);
    assert.equal(result[0].answer, '3');
  });

  it('parses normal block without choices', () => {
    const source = `question: 运行 6 * 7 得到的结果是多少？
answer: 42
explain: 在 Python 中 * 执行乘法，6 乘以 7 等于 42。`;

    const parsed = parsePredictBlock(source);
    assert.deepEqual(parsed, {
      question: '运行 6 * 7 得到的结果是多少？',
      choices: null,
      answer: '42',
      explain: '在 Python 中 * 执行乘法，6 乘以 7 等于 42。',
    });

    const doc = lesson('```predict\n' + source + '\n```');
    const result = assertPredictBlocks(doc, 'test.md');
    assert.equal(result.length, 1);
    assert.equal(result[0].choices, null);
    assert.equal(result[0].answer, '42');
  });

  it('rejects answer not in choices', () => {
    const source = `question: 1 + 1 等于几？
choices: 3 | 4 | 5
answer: 2
explain: 1 + 1 等于 2。`;

    const parsed = parsePredictBlock(source);
    assert.ok('error' in parsed);
    assert.match(parsed.error, /answer "2" is not in choices/);

    const doc = lesson('```predict\n' + source + '\n```');
    assert.throws(() => assertPredictBlocks(doc, 'invalid-choice.md'), /answer "2" is not in choices/);
  });

  it('rejects missing explain', () => {
    const source = `question: 下面这行会输出什么？
choices: 1 | 2
answer: 1`;

    const parsed = parsePredictBlock(source);
    assert.ok('error' in parsed);
    assert.match(parsed.error, /missing explain/);

    const doc = lesson('```predict\n' + source + '\n```');
    assert.throws(() => assertPredictBlocks(doc, 'missing-explain.md'), /missing explain/);
  });

  it('supports multi-line explain', () => {
    const source = `question: 解释切片 word[1:4]
choices: yth | th | Pyth
answer: yth
explain: 切片 [start:stop] 属于左闭右开区间。
包含下标 1、2、3 的字符。
因此截取结果为 'yth'。`;

    const parsed = parsePredictBlock(source);
    assert.equal(
      parsed.explain,
      "切片 [start:stop] 属于左闭右开区间。\n包含下标 1、2、3 的字符。\n因此截取结果为 'yth'。",
    );

    const doc = lesson('```predict\n' + source + '\n```');
    const result = assertPredictBlocks(doc, 'multiline.md');
    assert.equal(result[0].explain, parsed.explain);
  });

  it('rejects missing question or missing answer', () => {
    assert.match(parsePredictBlock('answer: 1\nexplain: ok').error, /missing or empty question/);
    assert.match(parsePredictBlock('question: q\nexplain: ok').error, /missing or empty answer/);
  });

  it('rejects choices with less than 2 or more than 5 options', () => {
    assert.match(
      parsePredictBlock('question: q\nchoices: 1\nanswer: 1\nexplain: e').error,
      /between 2 and 5 options/,
    );
    assert.match(
      parsePredictBlock('question: q\nchoices: 1 | 2 | 3 | 4 | 5 | 6\nanswer: 1\nexplain: e').error,
      /between 2 and 5 options/,
    );
  });

  it('ignores predict block nested inside another code block', () => {
    const text = lesson(`
\`\`\`markdown
\`\`\`predict
question: 伪装的问题
answer: 伪装
explain: 伪装
\`\`\`
\`\`\`

正文中没有可运行的 predict 块。
`);
    assert.deepEqual(collectPredictBlocks(text), []);
    assert.deepEqual(assertPredictBlocks(text), []);
  });

  it('supports escaped pipe \\| in choices and answer', () => {
    const source = `question: 位运算表达式的结果是什么？
choices: a \\| b | a & b
answer: a \\| b
explain: \`|\` 是按位或，\`&\` 是按位与。`;

    const parsed = parsePredictBlock(source);
    assert.deepEqual(parsed, {
      question: '位运算表达式的结果是什么？',
      choices: ['a | b', 'a & b'],
      answer: 'a | b',
      explain: '`|` 是按位或，`&` 是按位与。',
    });

    const doc = lesson('```predict\n' + source + '\n```');
    const result = assertPredictBlocks(doc, 'escaped-pipe.md');
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].choices, ['a | b', 'a & b']);
    assert.equal(result[0].answer, 'a | b');
  });
});

describe('numberline blocks', () => {
  it('parses normal block with all fields', () => {
    const source = `range: -6 .. 6
points: A=-3 | B=2
step: 1
show: opposite | abs
caption: 拖动 A，看它的相反数和绝对值怎样变化。`;

    const parsed = parseNumberlineBlock(source);
    assert.deepEqual(parsed, {
      range: [-6, 6],
      points: [
        { label: 'A', value: -3 },
        { label: 'B', value: 2 },
      ],
      step: 1,
      show: ['opposite', 'abs'],
      caption: '拖动 A，看它的相反数和绝对值怎样变化。',
    });

    const doc = lesson('```numberline\n' + source + '\n```');
    const result = assertNumberlineBlocks(doc, 'test-nl.md');
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].range, [-6, 6]);
    assert.equal(result[0].points.length, 2);

    // Test unified assertLessonCodeBlocks
    assert.doesNotThrow(() => assertLessonCodeBlocks(doc, 'test-nl.md'));
  });

  it('parses normal block with distance and step 0.5', () => {
    const source = `range: -5 .. 5
points: A=-1.5 | B=2.5
step: 0.5
show: distance`;

    const parsed = parseNumberlineBlock(source);
    assert.deepEqual(parsed, {
      range: [-5, 5],
      points: [
        { label: 'A', value: -1.5 },
        { label: 'B', value: 2.5 },
      ],
      step: 0.5,
      show: ['distance'],
      caption: '',
    });
  });

  it('rejects reversed range or identical endpoints', () => {
    const sourceReversed = `range: 6 .. -6
points: A=0`;
    const parsedReversed = parseNumberlineBlock(sourceReversed);
    assert.ok('error' in parsedReversed);
    assert.match(parsedReversed.error, /range left endpoint \(6\) must be less than right endpoint \(-6\)/);

    const doc = lesson('```numberline\n' + sourceReversed + '\n```');
    assert.throws(() => assertNumberlineBlocks(doc, 'reversed.md'), /range left endpoint/);

    const sourceSame = `range: 5 .. 5
points: A=5`;
    const parsedSame = parseNumberlineBlock(sourceSame);
    assert.ok('error' in parsedSame);
    assert.match(parsedSame.error, /range left endpoint \(5\) must be less than right endpoint \(5\)/);
  });

  it('rejects points out of range', () => {
    const source = `range: -6 .. 6
points: A=-7 | B=2`;
    const parsed = parseNumberlineBlock(source);
    assert.ok('error' in parsed);
    assert.match(parsed.error, /point "A" value -7 is outside range \[-6, 6\]/);

    const doc = lesson('```numberline\n' + source + '\n```');
    assert.throws(() => assertNumberlineBlocks(doc, 'out-of-range.md'), /outside range/);
  });

  it('rejects point not on step tick', () => {
    const sourceStep1 = `range: -6 .. 6
points: A=1.5
step: 1`;
    const parsedStep1 = parseNumberlineBlock(sourceStep1);
    assert.ok('error' in parsedStep1);
    assert.match(parsedStep1.error, /point "A" value 1.5 does not land on step 1 tick/);

    const sourceStep05 = `range: -6 .. 6
points: A=1.2
step: 0.5`;
    const parsedStep05 = parseNumberlineBlock(sourceStep05);
    assert.ok('error' in parsedStep05);
    assert.match(parsedStep05.error, /point "A" value 1.2 does not land on step 0.5 tick/);

    const doc = lesson('```numberline\n' + sourceStep1 + '\n```');
    assert.throws(() => assertNumberlineBlocks(doc, 'not-on-step.md'), /does not land on step 1 tick/);
  });

  it('rejects distance with non-2 points', () => {
    const sourceOnePoint = `range: -6 .. 6
points: A=2
show: distance`;
    const parsedOne = parseNumberlineBlock(sourceOnePoint);
    assert.ok('error' in parsedOne);
    assert.match(parsedOne.error, /show option "distance" requires exactly 2 points, got 1/);

    const sourceThreePoints = `range: -6 .. 6
points: A=-2 | B=0 | C=3
show: distance`;
    const parsedThree = parseNumberlineBlock(sourceThreePoints);
    assert.ok('error' in parsedThree);
    assert.match(parsedThree.error, /show option "distance" requires exactly 2 points, got 3/);

    const doc = lesson('```numberline\n' + sourceOnePoint + '\n```');
    assert.throws(() => assertNumberlineBlocks(doc, 'distance-non-2.md'), /requires exactly 2 points/);
  });

  it('rejects more than 3 points', () => {
    const source = `range: -6 .. 6
points: A=-3 | B=-1 | C=1 | D=3`;
    const parsed = parseNumberlineBlock(source);
    assert.ok('error' in parsed);
    assert.match(parsed.error, /points must contain between 1 and 3 points, got 4/);

    const doc = lesson('```numberline\n' + source + '\n```');
    assert.throws(() => assertNumberlineBlocks(doc, 'too-many-points.md'), /between 1 and 3 points/);
  });

  it('rejects step not in allowed values', () => {
    const sourceStep2 = `range: -6 .. 6
points: A=2
step: 2`;
    const parsedStep2 = parseNumberlineBlock(sourceStep2);
    assert.ok('error' in parsedStep2);
    assert.match(parsedStep2.error, /invalid step "2", only 1, 0.5, or 0.1 are allowed/);

    const sourceStep02 = `range: -6 .. 6
points: A=2
step: 0.2`;
    const parsedStep02 = parseNumberlineBlock(sourceStep02);
    assert.ok('error' in parsedStep02);
    assert.match(parsedStep02.error, /invalid step "0.2", only 1, 0.5, or 0.1 are allowed/);

    const doc = lesson('```numberline\n' + sourceStep2 + '\n```');
    assert.throws(() => assertNumberlineBlocks(doc, 'invalid-step.md'), /only 1, 0.5, or 0.1 are allowed/);
  });

  it('assertLessonCodeBlocks validates mixed predict, run, and numberline blocks in one pass', () => {
    const doc = lesson(`
\`\`\`predict
question: 问题 1
answer: 答案 1
explain: 解析 1
\`\`\`

\`\`\`python run
print("hello")
\`\`\`

\`\`\`numberline
range: -6 .. 6
points: A=-3
step: 1
show: opposite
\`\`\`
`);
    assert.doesNotThrow(() => assertLessonCodeBlocks(doc, 'mixed.md'));

    const docWithBadNl = lesson(`
\`\`\`predict
question: 问题 1
answer: 答案 1
explain: 解析 1
\`\`\`

\`\`\`numberline
range: -6 .. 6
points: A=99
\`\`\`
`);
    assert.throws(() => assertLessonCodeBlocks(docWithBadNl, 'bad-nl.md'), /Numberline block in bad-nl\.md: point "A" value 99 is outside range/);
  });
});
