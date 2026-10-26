import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import type {
  FullConfig,
  Reporter,
  Suite,
  TestCase
} from '@playwright/test/reporter';

function xml(value: string): string {
  return Array.from(value)
    .filter(character => {
      const code = character.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join('')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Formato genérico de execução do Sonar, não JUnit nem cobertura de código.
export default class SonarReporter implements Reporter {
  private root = process.cwd();
  private tests: TestCase[] = [];

  onBegin(config: FullConfig, suite: Suite): void {
    this.root = config.configFile ? dirname(config.configFile) : process.cwd();
    this.tests = suite.allTests();
  }

  onEnd(): void {
    const files = new Map<string, string[]>();
    for (const test of this.tests) {
      const path = relative(this.root, test.location.file)
        .split('\\')
        .join('/');
      const result = test.results[test.results.length - 1];
      const duration = Math.max(
        0,
        Math.round(
          test.results.reduce((sum, attempt) => sum + attempt.duration, 0)
        )
      );
      const name = xml(test.titlePath().filter(Boolean).join(' > '));
      let status = '';
      if (!result || result.status === 'skipped') {
        status = '<skipped message="Teste não executado"/>';
      } else if (result.status === 'interrupted') {
        status = '<error message="Execução interrompida"/>';
      } else if (result.status !== 'passed') {
        const details = result.errors
          .map(error => error.stack || error.message || 'Falha sem detalhes')
          .join('\n');
        status = `<failure message="${xml(result.status)}">${xml(details)}</failure>`;
      }
      const cases = files.get(path) || [];
      cases.push(
        `<testCase name="${name}" duration="${duration}">${status}</testCase>`
      );
      files.set(path, cases);
    }
    const directory = resolve(this.root, 'artifacts');
    mkdirSync(directory, { recursive: true });
    const entries = Array.from(
      files,
      ([path, cases]) => `<file path="${xml(path)}">${cases.join('')}</file>`
    );
    writeFileSync(
      resolve(directory, 'sonar-test-execution.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n<testExecutions version="1">${entries.join('')}</testExecutions>\n`
    );
  }

  printsToStdio(): boolean {
    return false;
  }
}
