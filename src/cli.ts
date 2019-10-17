#!/usr/bin/env node
import chalk from 'chalk'
import yargs from 'yargs'
import { pick } from 'lodash'
import { strictify } from './ts-strictify'

const run = async (): Promise<void> => {
  const argv = yargs
    .options({
      noImplicitAny: { type: 'boolean', default: true },
      noImplicitThis: { type: 'boolean', default: true },
      alwaysStrict: { type: 'boolean', default: true },
      strictBindCallApply: { type: 'boolean', default: true },
      strictNullChecks: { type: 'boolean', default: true },
      strictFunctionTypes: { type: 'boolean', default: true },
      strictPropertyInitialization: { type: 'boolean', default: true },
      noEmit: { type: 'boolean', default: true },
      targetBranch: { type: 'string', default: 'master' },
      commited: { type: 'boolean', default: true },
      staged: {
        type: 'boolean',
        default: true,
        description: 'will check files in the "staged" area',
      },
      modified: { type: 'boolean', default: true },
      untracked: {
        type: 'boolean',
        default: true,
        description: 'will check files that are not tracked',
      },
    })
    .parserConfiguration({
      'strip-dashed': true,
    }).argv

  const typeScriptOptions = pick(argv, [
    'noImplicitAny',
    'noImplicitThis',
    'alwaysStrict',
    'strictBindCallApply',
    'strictNullChecks',
    'strictFunctionTypes',
    'strictPropertyInitialization',
    'noEmit',
  ])

  const gitOptions = pick(argv, ['commited', 'staged', 'modified', 'untracked', 'targetBranch'])

  const result = await strictify({
    gitOptions,
    typeScriptOptions,
    onFoundSinceRevision: (revision) => {
      revision
        ? console.log(
            `🔍  Finding changed files since ${chalk.bold('git')} revision ${chalk.bold(revision)}`,
          )
        : console.log(
            `⚠️  Can not find commit at which the current branch was forked from ${chalk.bold(
              gitOptions.targetBranch,
            )}. Does target branch ${chalk.bold(gitOptions.targetBranch)} exists?`,
          )
    },
    onFoundChangedFiles: (changedFiles) => {
      console.log(
        `🎯  Found ${chalk.bold(String(changedFiles.length))} changed ${
          changedFiles.length === 1 ? 'file' : 'files'
        }`,
      )
    },
    onExamineFile: (file) => {
      console.log(`🔍  Checking ${chalk.bold(file)} ...`)
    },
    onCheckFile: (file, hasError) =>
      hasError
        ? console.log(`❌  ${chalk.bold(file)} failed`)
        : console.log(`✅  ${chalk.bold(file)} passed`),
  })

  if (result.errors) {
    process.exit(1)
  } else {
    console.log(`🎉  ${chalk.green('All files passed')}`)
  }
}
run()
