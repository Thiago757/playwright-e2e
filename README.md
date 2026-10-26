# Playwright E2E

## GitHub Actions + SonarCloud

[![Build and Tests](https://github.com/Thiago757/playwright-e2e/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/Thiago757/playwright-e2e/actions/workflows/node.js.yml)

</br>

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Thiago757_playwright-e2e&metric=alert_status)](https://sonarcloud.io/project/overview?id=Thiago757_playwright-e2e)

## Getting Started

In order to execute this project you must follow the steps below:

1. Install [Node JS](https://nodejs.org/) (version >= 22.x)
1. Run `npm ci` to install the dependencies from the lockfile
1. Run `npx playwright install chromium` to install the browser used by Playwright
1. Run `npm test` to execute the entire test suite
1. Run `npm run show-report` to visualize the reports

All execution artifacts can be found in `./artifacts`, if you want to remove these files run `npm run clean`.

### Local setup

Chromium is the default browser. To use Microsoft Edge instead, install it first
and run `PLAYWRIGHT_CHANNEL=msedge npm test`. Installing Edge via
`npx playwright install msedge` on macOS requires an administrator password.

The suite contains five E2E tests: two for delivery registration, two for Globo.com,
and one for Sauce Demo. They require access to those external websites.
There are also eight unit tests for the Sonar reporter, without access to sites.
Use `npm run scenario` to run only Sauce Demo, `npm run ui` for the interactive
test runner, and `npx tsc --noEmit` to check TypeScript.

`npm run ci` cleans generated artifacts, checks formatting and TypeScript, then
runs all 13 tests with one worker and collects coverage. It does not rewrite source files.
TLS certificate validation remains enabled during tests.

## SonarCloud configuration

- Repository: `Thiago757/playwright-e2e`.
- Sonar organization: `thiago757-2`.
- Sonar project: `Thiago757_playwright-e2e`.
- Authentication: GitHub Actions repository secret `SONAR_TOKEN`, never committed.

The workflow has two dependent jobs: `Run E2E Tests` and `Run SonarCloud`, both
on Ubuntu 24.04 to avoid unexpected changes in the `ubuntu-latest` image.
The first uses Google Chrome already installed on the official GitHub runner,
validates the project and generates the HTML report,
traces and `artifacts/sonar-test-execution.xml`. The second downloads these
artifacts, imports the execution report and LCOV coverage, publishes the analysis
and waits for the Quality Gate. Missing tokens,
failed tests and failed Quality Gates are not ignored.

The existing daily schedule is preserved, and manual execution is available
through Actions > Build and Tests > Run workflow. Only this project's analysis
method is configured for GitHub Actions; other Sonar projects are unchanged.

Sonar analyzes Page Objects, element mappings, the reporter and Playwright
configuration as source code; `src/scenarios` is classified as tests. The custom
[Playwright reporter](https://playwright.dev/docs/api/class-reporter) exports the
real outcomes, durations and failures using Sonar's
[generic execution format](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/generic-test-data).

The c8 tool measures the real Node.js execution of Page Objects, element mappings,
the reporter and configuration, and generates `artifacts/coverage/lcov.info`.
Its `all: true` setting includes files not exercised by the suite, without hiding
unused helpers. The reporter unit tests verify passed/failed/skipped/interrupted
states, XML escaping, grouping and duration calculations.

This is coverage of this repository's automation, not of Globo, Buger Eats or
Sauce Demo application code: those external applications are not in this repository.
No external application coverage or artificial overall 100% result is generated.
Static analysis findings and insufficient coverage on new code remain capable of
failing the Quality Gate; the threshold has not been lowered.

Artifacts are retained for seven days in the workflow run. The npm audit alerts
in the inherited dependencies require a separate dependency review; configuring
Sonar does not automatically resolve them.

## Using ZeroStep AI
</br>

To use the AI ​​feature with ZeroStep, you must create the `zerostep.config.json` file in the root of the project and add your ZeroStep token.

## Project Structure
</br>
<ul>
    <li>Scenarios: Test scenario mapping</li>
    <li>Support: Project structure files
        <ul>
            <li>Elements: Mapping the elements of each screen</li>
            <li>Fixtures: Data configuration files</li>
            <li>Pages: Logic used to perform actions in tests</li>
        </ul>
    </li>
</ul>

Based on the original [ugioni/playwright-e2e](https://github.com/ugioni/playwright-e2e)
teaching project, maintained here in Thiago757's repository.
