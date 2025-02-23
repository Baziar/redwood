import path from 'path'

import execa from 'execa'

import { getPaths } from '@redwoodjs/internal'

export const command = 'storybook'
export const aliases = ['sb']
export const description =
  'Launch Storybook: An isolated component development environment'

export const builder = (yargs) => {
  yargs
    .option('open', {
      describe: 'Open storybooks in your browser on start',
      type: 'boolean',
      default: true,
    })
    .option('build', {
      describe: 'Build Storybook',
      type: 'boolean',
      default: false,
    })
    .option('port', {
      describe: 'Which port to run storybooks on',
      type: 'integer',
      default: 7910,
    })
    .option('build-directory', {
      describe: 'Directory in web/ to store static files',
      type: 'string',
      default: 'public/storybook',
    })
    .option('manager-cache', {
      describe:
        "Cache the manager UI. Disable this when you're making changes to `storybook.manager.js`.",
      type: 'boolean',
      default: true,
    })
    .option('smoke-test', {
      describe:
        "CI mode plus Smoke-test (skip prompts, don't open browser, exit after successful start)",
      type: 'boolean',
      default: false,
    })
    .check((argv) => {
      if (argv.build && argv.smokeTest) {
        throw new Error('Can not provide both "--build" and "--smoke-test"')
      }
      if (argv.build && argv.open) {
        throw new Error('Can not provide both "--build" or "--open"')
      }
      return true
    })
}

export const handler = ({
  open,
  port,
  build,
  buildDirectory,
  managerCache,
  smokeTest,
}) => {
  const cwd = getPaths().web.base

  const staticAssetsFolder = path.join(getPaths().web.base, 'public')
  // Create the `MockServiceWorker.js` file
  // https://mswjs.io/docs/cli/init
  execa(`yarn msw init "${staticAssetsFolder}" --no-save`, undefined, {
    stdio: 'inherit',
    shell: true,
    cwd,
  })

  const storybookConfig = path.dirname(
    require.resolve('@redwoodjs/testing/config/storybook/main.js')
  )

  execa(
    `yarn ${build ? 'build' : 'start'}-storybook`,
    [
      `--config-dir "${storybookConfig}"`,
      !build && `--port ${port}`,
      !build && '--no-version-updates',
      !managerCache && '--no-manager-cache',
      build && `--output-dir "${buildDirectory}"`,
      !open && !smokeTest && `--ci`,
      smokeTest && `--ci --smoke-test`,
    ].filter(Boolean),
    {
      stdio: 'inherit',
      shell: true,
      cwd,
    }
  )
}
