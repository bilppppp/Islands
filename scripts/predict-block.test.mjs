import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePredictBlock,
  collectPredictBlocks,
  assertPredictBlocks,
} from '../school-kit/overlay/src/lib/predict-block.mjs';

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
