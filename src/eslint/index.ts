import { existsSync } from 'node:fs'

import { node } from './configs/node.js'
import { jsonc } from './configs/jsonc.js'
import { jsdoc } from './configs/jsdoc.js'
import { ignores } from './configs/ignores.js'
import { imports } from './configs/imports.js'
import { prettier } from './configs/prettier.js'
import { adonisjs } from './configs/adonisjs.js'
import { combine, interopDefault } from './utils.js'
import { javascript } from './configs/javascript.js'
import { typescript } from './configs/typescript.js'
import { hasAdonisjs, hasTypeScript } from './env.js'
import { perfectionist } from './configs/perfectionist.js'
import { sortPackageJson, sortTsconfig } from './configs/sort.js'
import type { Awaitable, ConfigItem, NasOptions, UserConfigItem } from './types.js'

export * from './configs/index.js'
export { combine, interopDefault } from './utils.js'

export async function nas(
  options: NasOptions = {},
  ...userConfigs: Awaitable<UserConfigItem | UserConfigItem[]>[]
) {
  const {
    enableGitIgnore = true,
    typescript: enableTypescript = hasTypeScript,

    jsonc: enableJsonc = true,
    prettier: enablePrettier = true,
    adonisjs: enableAdonisJs = hasAdonisjs,
  } = options

  const configs: Awaitable<ConfigItem[]>[] = []

  if (enableGitIgnore) {
    const plugin = await interopDefault(import('eslint-config-flat-gitignore'))

    if (typeof enableGitIgnore !== 'boolean') {
      // @ts-expect-error - ignore
      configs.push(plugin(enableGitIgnore))
    } else if (existsSync('.gitignore')) {
      // @ts-expect-error - ignore
      configs.push(plugin())
    }
  }

  configs.push(ignores(), javascript(), perfectionist(), imports(), jsdoc(), node())

  if (enableTypescript) {
    configs.push(
      typescript({
        ...(typeof enableTypescript !== 'boolean' ? enableTypescript : {}),
      }),
    )
  }

  if (enableJsonc) {
    configs.push(jsonc(), sortPackageJson(), sortTsconfig())
  }

  if (enableAdonisJs) {
    configs.push(adonisjs())
  }

  if (enablePrettier) {
    configs.push(prettier())
  }

  const resolved = await Promise.all(configs)
  return combine(...resolved, ...userConfigs)
}
