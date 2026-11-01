import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addSourceMaterials, prepareMaterials } from './materials.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const schoolCli = join(repoRoot, 'scripts/school.mjs');
const tempDirs = [];

after(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function createTempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function runCli(args) {
  try {
    return {
      status: 0,
      stdout: execFileSync('node', [schoolCli, ...args], { encoding: 'utf8', cwd: repoRoot }),
      stderr: '',
    };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: String(error.stdout || ''),
      stderr: String(error.stderr || error.message),
    };
  }
}

describe('supplement --source', () => {
  it('现有 material-1、material-2 时，--source 两个 URL → 生成 material-3、material-4，记录字段齐全，原目录不变', async () => {
    const dir = createTempDir('supp-test-');
    const m1Dir = join(dir, 'material-1');
    const m2Dir = join(dir, 'material-2');
    mkdirSync(m1Dir, { recursive: true });
    mkdirSync(m2Dir, { recursive: true });
    writeFileSync(join(m1Dir, 'original.html'), '<html><body>First material</body></html>');
    writeFileSync(join(m2Dir, 'original.html'), '<html><body>Second material</body></html>');

    const records = [
      {
        path: 'material-1/original.html',
        url: 'https://example.com/one',
        fetchedURL: 'https://example.com/one',
        retrieved: '2026-10-01',
      },
      {
        path: 'material-2/original.html',
        url: 'https://example.com/two',
        fetchedURL: 'https://example.com/two',
        retrieved: '2026-10-01',
      },
    ];

    const fakeRun = async (executable, args) => {
      if (executable === 'curl') {
        const outIdx = args.indexOf('-o');
        const downloadPath = args[outIdx + 1];
        const url = args[args.length - 1];
        writeFileSync(downloadPath, `content of ${url}`);
        return `text/plain\n${url}`;
      }
      throw new Error(`Unexpected command: ${executable}`);
    };

    const result = await addSourceMaterials(
      records,
      dir,
      ['https://example.com/three', 'https://example.com/four'],
      { run: fakeRun },
    );

    assert.equal(result.addedRecords.length, 2);
    assert.equal(result.materials.length, 4);

    const m3 = result.addedRecords[0];
    const m4 = result.addedRecords[1];

    assert.equal(m3.path, 'material-3/original.txt');
    assert.equal(m3.url, 'https://example.com/three');
    assert.equal(m3.fetchedURL, 'https://example.com/three');
    assert.ok(m3.retrieved);

    assert.equal(m4.path, 'material-4/original.txt');
    assert.equal(m4.url, 'https://example.com/four');
    assert.equal(m4.fetchedURL, 'https://example.com/four');
    assert.ok(m4.retrieved);

    // Verify existing materials are untouched
    assert.equal(readFileSync(join(m1Dir, 'original.html'), 'utf8'), '<html><body>First material</body></html>');
    assert.equal(readFileSync(join(m2Dir, 'original.html'), 'utf8'), '<html><body>Second material</body></html>');

    // Verify new materials exist
    assert.equal(readFileSync(join(dir, 'material-3/original.txt'), 'utf8'), 'content of https://example.com/three');
    assert.equal(readFileSync(join(dir, 'material-4/original.txt'), 'utf8'), 'content of https://example.com/four');
  });

  it('重复 URL 被跳过', async () => {
    const dir = createTempDir('supp-dup-');
    const records = [
      {
        path: 'material-1/original.html',
        url: 'https://example.com/existing',
        fetchedURL: 'https://example.com/existing',
        retrieved: '2026-10-01',
      },
    ];
    mkdirSync(join(dir, 'material-1'), { recursive: true });
    writeFileSync(join(dir, 'material-1/original.html'), 'existing');

    let curlCallCount = 0;
    const fakeRun = async (executable, args) => {
      if (executable === 'curl') {
        curlCallCount++;
        const outIdx = args.indexOf('-o');
        const downloadPath = args[outIdx + 1];
        const url = args[args.length - 1];
        writeFileSync(downloadPath, `content of ${url}`);
        return `text/plain\n${url}`;
      }
      throw new Error(`Unexpected command: ${executable}`);
    };

    // Pass one duplicate of existing record, plus two identical new URLs
    const result = await addSourceMaterials(
      records,
      dir,
      ['https://example.com/existing', 'https://example.com/new', 'https://example.com/new'],
      { run: fakeRun },
    );

    assert.equal(result.addedRecords.length, 1);
    assert.equal(result.skippedSources.length, 2);
    assert.deepEqual(result.skippedSources, ['https://example.com/existing', 'https://example.com/new']);
    assert.equal(result.materials.length, 2);
    assert.equal(result.addedRecords[0].path, 'material-2/original.txt');
    assert.equal(curlCallCount, 1);
    assert.equal(existsSync(join(dir, 'material-3')), false);
  });

  it('一个成功一个失败 → 成功的登记、失败的不留目录、非零退出', async () => {
    const dir = createTempDir('supp-fail-');
    const records = [
      {
        path: 'material-1/original.html',
        url: 'https://example.com/base',
        fetchedURL: 'https://example.com/base',
        retrieved: '2026-10-01',
      },
    ];
    mkdirSync(join(dir, 'material-1'), { recursive: true });
    writeFileSync(join(dir, 'material-1/original.html'), 'base');

    const fakeRun = async (executable, args) => {
      if (executable === 'curl') {
        const url = args[args.length - 1];
        if (url === 'https://example.com/bad') {
          const outIdx = args.indexOf('-o');
          writeFileSync(args[outIdx + 1], 'error page');
          throw new Error('curl failed (22): 404 Not Found');
        }
        const outIdx = args.indexOf('-o');
        writeFileSync(args[outIdx + 1], 'good page');
        return `text/plain\n${url}`;
      }
      throw new Error(`Unexpected command: ${executable}`);
    };

    const result = await addSourceMaterials(
      records,
      dir,
      ['https://example.com/good', 'https://example.com/bad'],
      { run: fakeRun },
    );

    // Good source is registered
    assert.equal(result.addedRecords.length, 1);
    assert.equal(result.addedRecords[0].path, 'material-2/original.txt');
    assert.equal(result.materials.length, 2);
    assert.equal(existsSync(join(dir, 'material-2/original.txt')), true);

    // Bad source is recorded in failedSources, and no leftover directory
    assert.equal(result.failedSources.length, 1);
    assert.equal(result.failedSources[0].source, 'https://example.com/bad');
    assert.equal(existsSync(join(dir, 'material-3')), false);
  });

  it('text/markdown 无扩展名 → original.md', async () => {
    const dir = createTempDir('supp-md-');
    const fakeRun = async (executable, args) => {
      if (executable === 'curl') {
        const outIdx = args.indexOf('-o');
        writeFileSync(args[outIdx + 1], '# Markdown Title\n\nSome markdown text');
        return 'text/markdown; charset=utf-8\nhttps://example.com/api/readme';
      }
      throw new Error(`Unexpected command: ${executable}`);
    };

    const records = await prepareMaterials(
      ['https://example.com/api/readme'],
      dir,
      { crawl: 'off', run: fakeRun },
    );

    assert.equal(records.length, 1);
    assert.equal(records[0].path, 'material-1/original.md');
    assert.equal(records[0].readableText, undefined);
    assert.equal(existsSync(join(dir, 'material-1/original.md')), true);
    assert.equal(readFileSync(join(dir, 'material-1/original.md'), 'utf8'), '# Markdown Title\n\nSome markdown text');
  });

  it('text/x-markdown 无扩展名 → original.md', async () => {
    const dir = createTempDir('supp-xmd-');
    const fakeRun = async (executable, args) => {
      if (executable === 'curl') {
        const outIdx = args.indexOf('-o');
        writeFileSync(args[outIdx + 1], '# X-Markdown Title');
        return 'text/x-markdown\nhttps://example.com/api/doc';
      }
      throw new Error(`Unexpected command: ${executable}`);
    };

    const records = await prepareMaterials(
      ['https://example.com/api/doc'],
      dir,
      { crawl: 'off', run: fakeRun },
    );

    assert.equal(records.length, 1);
    assert.equal(records[0].path, 'material-1/original.md');
    assert.equal(existsSync(join(dir, 'material-1/original.md')), true);
  });

  it('--source 与 --crawl-prefix 同用 → 报错', () => {
    const res = runCli(['supplement', 'math-grade7', '--source', 'https://example.com/page', '--crawl-prefix', '/docs']);
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /--source 只保存指定页面/);
  });

  it('--source 与 --max-pages 同用 → 报错', () => {
    const res = runCli(['supplement', 'math-grade7', '--source', 'https://example.com/page', '--max-pages', '10']);
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /--source 只保存指定页面/);
  });

  it('--source 与 --crawl 同用 → 报错', () => {
    const res = runCli(['supplement', 'math-grade7', '--source', 'https://example.com/page', '--crawl']);
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /--source 只保存指定页面/);
  });

  it('--source 与 --no-crawl 同用 → 报错', () => {
    const res = runCli(['supplement', 'math-grade7', '--source', 'https://example.com/page', '--no-crawl']);
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /--source 只保存指定页面/);
  });

  it('--source 与 --crawl-workers 同用 → 报错', () => {
    const res = runCli(['supplement', 'math-grade7', '--source', 'https://example.com/page', '--crawl-workers', '4']);
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /--source 只保存指定页面/);
  });

  it('CLI 端到端：一个成功一个失败时，成功登记、失败不留目录、非零退出、刷新 GENERATION.md', () => {
    const testSchoolName = `temp-cli-test-${Date.now()}`;
    const schoolDir = join(repoRoot, 'schools', testSchoolName);
    const inputPath = join(repoRoot, 'inputs', `${testSchoolName}.json`);
    const goodFile = join(createTempDir('good-source-'), 'good.txt');
    writeFileSync(goodFile, 'Good content for supplement source test');
    const badFile = join(repoRoot, 'non-existent-source-file-12345.txt');

    try {
      mkdirSync(join(schoolDir, 'materials', 'material-1'), { recursive: true });
      writeFileSync(join(schoolDir, 'materials', 'material-1', 'base.txt'), 'base');
      writeFileSync(join(schoolDir, 'school.config.ts'), 'export default {};\n');

      const initialSpec = {
        name: testSchoolName,
        goal: 'Test supplement CLI',
        depth: 'systematic',
        sources: ['https://example.com/base'],
        output: `schools/${testSchoolName}`,
        sourceRoot: `schools/${testSchoolName}/materials`,
        materials: [
          {
            path: 'material-1/base.txt',
            url: 'https://example.com/base',
            retrieved: '2026-10-01',
          },
        ],
      };
      writeFileSync(join(schoolDir, 'school.settings.json'), JSON.stringify(initialSpec, null, 2) + '\n');
      mkdirSync(dirname(inputPath), { recursive: true });
      writeFileSync(inputPath, JSON.stringify(initialSpec, null, 2) + '\n');
      writeFileSync(join(schoolDir, 'GENERATION.md'), 'Initial generation prompt');

      const res = runCli(['supplement', testSchoolName, '--source', goodFile, '--source', badFile]);

      // Command should exit with non-zero
      assert.equal(res.status, 1);

      // Successfully saved source is recorded
      const updatedSettings = JSON.parse(readFileSync(join(schoolDir, 'school.settings.json'), 'utf8'));
      assert.equal(updatedSettings.materials.length, 2);
      assert.equal(updatedSettings.materials[1].path, 'material-2/good.txt');
      assert.ok(updatedSettings.sources.includes(goodFile));

      const updatedInput = JSON.parse(readFileSync(inputPath, 'utf8'));
      assert.equal(updatedInput.materials.length, 2);
      assert.equal(updatedInput.materials[1].path, 'material-2/good.txt');
      assert.ok(updatedInput.sources.includes(goodFile));

      // Failed source does NOT leave directory
      assert.equal(existsSync(join(schoolDir, 'materials', 'material-2')), true);
      assert.equal(existsSync(join(schoolDir, 'materials', 'material-3')), false);

      // GENERATION.md is refreshed and includes the new material
      const genMd = readFileSync(join(schoolDir, 'GENERATION.md'), 'utf8');
      assert.match(genMd, /material-2\/good\.txt/);
    } finally {
      rmSync(schoolDir, { recursive: true, force: true });
      rmSync(inputPath, { force: true });
    }
  });
});
