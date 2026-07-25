/**
 * **** Please refer to the following TYPES when committing: ****
 */
const types = [
  'build', // Changes which affect CI configuration files and scripts
  'chore', // Changes which aren't user-facing
  'enh', // Changes which improve a feature
  'docs', // Changes which affect documentation
  'feat', // Changes which introduce a new feature
  'fix', // Changes which patch a bug
  'perf', // Changes which improve performance
  'refactor', // Changes which neither fix a bug nor add a feature
  'revert', // Changes which revert a previous commit
  'style', // Changes which don't affect code logic (whitespace, formatting)
  'test', // Changes which add missing tests or correct existing tests
]

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-empty': [2, 'never'],
    'subject-case': [2, 'always', ['lower-case']],
    'header-max-length': [2, 'always', 72],
    'type-enum': [2, 'always', types],
  },
}
