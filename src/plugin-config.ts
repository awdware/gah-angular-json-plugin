import { GahPluginConfig, TsConfig } from '@gah/shared';
import { CompilerOptions } from 'typescript';
import { AngularJson } from './angular.schema';

export class PluginConfig extends GahPluginConfig {
  /**
   * This parameter should contain partial parameters from an angular.json file that then partially overwrites the generated angular json file
   */
  public ngJson: Partial<AngularJson>;
  public tsConfigJson: Partial<CompilerOptions>;
}
