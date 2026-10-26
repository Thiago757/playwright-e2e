import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type TestInfo } from '@playwright/test';
import type {
  FullConfig,
  Suite,
  TestCase,
  TestResult
} from '@playwright/test/reporter';
import SonarReporter from '../support/reporters/SonarReporter';

function createReporter(info: TestInfo, tests: TestCase[]) {
  const root = info.outputPath('reporter-fixture');
  const reporter = new SonarReporter();
  reporter.onBegin(
    { configFile: resolve(root, 'playwright.config.ts') } as FullConfig,
    { allTests: () => tests } as Suite
  );
  return {
    reporter,
    report: resolve(root, 'artifacts/sonar-test-execution.xml')
  };
}

function sample(
  results: Partial<TestResult>[],
  name = 'Teste de exemplo',
  file = 'src/scenarios/example.spec.ts'
): TestCase {
  return {
    location: { file: resolve(file) },
    titlePath: () => [name],
    results
  } as unknown as TestCase;
}

test.describe('Infraestrutura | Reporter Sonar (sem acesso a sites)', () => {
  const statuses: TestResult['status'][] = [
    'passed',
    'failed',
    'timedOut',
    'skipped',
    'interrupted'
  ];

  for (const status of statuses) {
    test(`exporta corretamente o estado ${status}`, ({}, info) => {
      const { reporter, report } = createReporter(info, [
        sample([
          { status, duration: 12.4, errors: [{ message: 'Falha de exemplo' }] }
        ])
      ]);
      reporter.onEnd();
      const content = readFileSync(report, 'utf8');
      expect(content).toContain('<testExecutions version="1">');
      expect(content).toContain('duration="12"');
      if (status === 'passed') {
        expect(content).not.toMatch(/<(failure|error|skipped)\b/);
      } else if (status === 'skipped') {
        expect(content).toContain('<skipped message="Teste não executado"/>');
      } else if (status === 'interrupted') {
        expect(content).toContain('<error message="Execução interrompida"/>');
      } else {
        expect(content).toContain(
          `<failure message="${status}">Falha de exemplo</failure>`
        );
      }
    });
  }

  test('reporta teste sem resultado como não executado', ({}, info) => {
    const { reporter, report } = createReporter(info, [sample([])]);
    reporter.onEnd();
    expect(readFileSync(report, 'utf8')).toContain(
      'duration="0"><skipped message="Teste não executado"/>'
    );
  });

  test('escapa XML, remove controles, agrupa arquivos e soma tentativas', ({}, info) => {
    const { reporter, report } = createReporter(info, [
      sample(
        [
          { status: 'failed', duration: 2, errors: [] },
          {
            status: 'failed',
            duration: 3,
            errors: [
              { stack: 'stack<&>"\'\t\n\r\u0001' },
              { message: 'mensagem' },
              {}
            ]
          }
        ],
        'Teste "A" & <B> \'C\'\u0001'
      ),
      sample([{ status: 'passed', duration: 1, errors: [] }]),
      sample(
        [{ status: 'passed', duration: 1, errors: [] }],
        'Outro arquivo',
        'src/scenarios/other.spec.ts'
      )
    ]);
    reporter.onEnd();
    const content = readFileSync(report, 'utf8');
    expect(content).toContain(
      'Teste &quot;A&quot; &amp; &lt;B&gt; &apos;C&apos;'
    );
    expect(content).toContain('duration="5"');
    expect(content).toContain('stack&lt;&amp;&gt;&quot;&apos;');
    expect(content).toContain('mensagem\nFalha sem detalhes');
    expect(content).not.toContain('\u0001');
    expect(content.match(/<file path=/g)).toHaveLength(2);
    expect(content.match(/<testCase /g)).toHaveLength(3);
  });

  test('aceita suíte vazia e configuração sem caminho de arquivo', ({}, info) => {
    const { reporter, report } = createReporter(info, []);
    reporter.onEnd();
    expect(readFileSync(report, 'utf8')).toContain(
      '<testExecutions version="1"></testExecutions>'
    );
    reporter.onBegin(
      {} as FullConfig,
      { allTests: () => [] } as unknown as Suite
    );
    expect(reporter.printsToStdio()).toBe(false);
  });
});
