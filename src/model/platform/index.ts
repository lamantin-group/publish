import { PublishOptions } from '../../cli/PublishOptions'
import { Version } from '../../utils/increment'
import AndroidPlatformActions from './android'
import IOSPlatformActions from './ios'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const platformTypes = <const>['ios', 'android']
export type Platform = typeof platformTypes[number]

export interface PlatformActions {
  setVersion(newVersion: string): Promise<Version[]>
  incrementBuildNumber(): Promise<number[]>
  getBuildNumber(): Promise<number>
  build(): Promise<void>
  publish(): Promise<void>
}

/**
 * Map Platform to PlatformActions
 */
export function providePlatformActions(platforms: Platform[], options: PublishOptions): PlatformActions[] {
  const actions: PlatformActions[] = platforms.map(platform => {
    if (platform === 'ios') {
      return new IOSPlatformActions(options)
    } else if (platform == 'android') {
      // TODO: think about path, it can be incorrect
      return new AndroidPlatformActions(options)
    }
  })
  return actions
}
