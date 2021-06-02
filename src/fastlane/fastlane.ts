import child_process from 'child_process'
import shell from 'shelljs'
import jetpack = require('fs-jetpack')
import { FastlaneError } from './FastlaneError'

export function fastlane(platformDirectory: string, task: string) {
  const fastfilePath = platformDirectory + '/fastlane/Fastfile'

  const contextFilePath = jetpack
    .cwd(__dirname)
    .cwd('../../assets')
    .path('Context.rb')
  // const ruby = jetpack.read(rubyPath)
  const fastfileOriginal = jetpack
    .read(fastfilePath)
    .split('\n')
    .filter(it => !it.includes('Context.rb'))
    .join('\n')

  const importLine = `import '${contextFilePath}'`
  const fastfileModifyed = `${importLine}\n${fastfileOriginal}`
  jetpack.write(fastfilePath, fastfileModifyed)

  function revertChanges() {
    jetpack.write(fastfilePath, fastfileOriginal)
  }

  process.on('exit', revertChanges)
  process.on('disconnect', revertChanges)
  process.on('uncaughtException', revertChanges)
  process.on('unhandledRejection', revertChanges)

  // shell.exec(`bundle install`)

  // TODO: validate user input for security policy

  // shelljs not supported interactive input/output so we should use child_process
  // child_process.execSync('cd ' + jetpack.cwd())
  const cwd = shell.pwd().stdout
  try {
    const command = `bundle exec fastlane ${task}`.trim()
    console.log('Execute fastlane in directory:', cwd, `with command: ${command}`)
    child_process.execSync(`${command}`.trim(), { stdio: 'pipe', cwd: platformDirectory })
    revertChanges()
  } catch (e) {
    revertChanges()
    throw new FastlaneError(e.message, e.status)
  }
}
