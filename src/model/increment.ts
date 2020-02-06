import jetpack from 'fs-jetpack'
import { IncrementType } from '../options'
import { progress, question, read, error } from '../ui'

export async function incrementVersion(type: IncrementType) {
  const loader = progress('Search version in package.json')
  const version = await readVersionFrom('package.json')
  loader.stop()
  const currentVersion = await assertVersion(version)
  return increment(currentVersion, type)
}

export function tryMigrateVersion(from: string) {
  if (!from) return null

  let parts = from.split('.')

  // check that contains only numbers
  for (let index = 0; index < parts.length; index++) {
    const element = parts[index]
    const parsed = parseInt(element)
    if (!Number.isInteger(parsed)) {
      return null
    }
  }

  if (parts.length >= 3) {
    parts = parts.slice(0, 3)
  } else if (parts.length >= 2) {
    parts = parts.slice(0, 2)
    parts.push('0')
  } else if (parts.length >= 1) {
    parts = parts.slice(0, 1)
    parts.push('0')
    parts.push('0')
  }

  return parts.join('.')
}

/**
 * Read version from file
 * @param file input
 */
async function readVersionFrom(file: string) {
  const raw = await jetpack.readAsync(file)
  const fileJson = JSON.parse(raw)
  const version = fileJson['version'] as string
  return version.trim()
}

/**
 * Increment version or return null if can`t do it
 * @param from semver string like "0.0.0"
 * @param type patch, minor, major
 */
export function increment(from: string, type: IncrementType) {
  if (!from) return null
  console.log(from)

  let parts = from.split('.').map(int => parseInt(int))
  if (parts.length < 3) return null

  function reset(array: number[], from: number) {
    return array.map((value, index) => {
      if (index > from) {
        return 0
      } else {
        return value
      }
    })
  }

  let index = null
  if (type === 'patch') {
    index = 2
  } else if (type === 'minor') {
    index = 1
  } else if (type === 'major') {
    index = 0
  }

  if (index != null) {
    parts[index]++
    parts = reset(parts, index)
  }

  return parts.join('.')
}

export async function assertVersion(version: string) {
  if (version) {
    const parts = version.split('.')
    if (parts.length === 3) {
      return true
    }
  }

  const migration = tryMigrateVersion(version)

  if (migration) {
    const shouldApplyMigration = await question(
      `Your version is [${version}], but expected semver 3 digits value, like [1.0.0]. Should we change it to [${migration}]?`,
    )
    if (shouldApplyMigration) {
      return migration
    }
  }

  error(`Your version is ${version}, but supported only 3 digits value like 1.0.0`)
  const newVersion = await read(`Enter version manualy and change from (${version}) ->`)
  return await assertVersion(newVersion)
}