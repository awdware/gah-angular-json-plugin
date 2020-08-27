import { GahPluginConfig } from '@awdware/gah-shared';
import { AngularJson } from './angular.schema';

export class AngularJsonConfig extends GahPluginConfig {
  /**
   * This parameter should contain partial parameters from an angular.json file that then partially overwrites the generated angular json file
   */
  public ngJson: Partial<AngularJson>;
}
