import { GahModuleData, GahPlugin, GahPluginConfig } from '@gah/shared';

import { PluginConfig } from './plugin-config';

const MERGE_REPLACEINSTEADOFMERGE = '__replaceInsteadOfMerge';

export class JsonConfigPlugin extends GahPlugin {
  constructor() {
    super('JsonConfigPlugin');
  }

  public async onInstall(existingCfg: PluginConfig): Promise<GahPluginConfig> {
    const newCfg = existingCfg ?? new PluginConfig();

    if (!existingCfg) {
      this.loggerService.warn('The JsonConfigPlugin plugin has to be configured manually');
    }

    return newCfg;
  }

  public onInit() {
    // Register a handler that gets called synchronously if the corresponding event occured. Some events can be called multiple times!
    this.registerEventListener('HOST_COPIED', (event) => {

      const hostData = event.gahFile?.modules.find(x => x.isHost)!;

      this.reconfigure(hostData, 'angular.json', this.cfg.ngJson);
      this.reconfigure(hostData, 'tsconfig.base.json', this.cfg.tfConfigJson)
        || this.reconfigure(hostData, 'tsconfig.json', this.cfg.tfConfigJson);
    });
  }

  private reconfigure<T>(moduleData: GahModuleData, relativeFilePath: string, config: T): boolean {
    if (!config) {
      this.loggerService.debug(`No configuration provided for file: ${relativeFilePath}`);
      return false;
    }

    const fullPath = this.fileSystemService.join(moduleData.basePath, relativeFilePath);

    const exists = this.fileSystemService.fileExists(fullPath);
    if (!exists) {
      this.loggerService.debug(`Could not find configuration file: ${fullPath}`);
      return false;
    }
    this.loggerService.debug(`Found config json: ${fullPath}`);

    const jsonConfig = this.fileSystemService.parseFile<T>(fullPath);

    const newNgJson = this.merge(jsonConfig, config);

    this.fileSystemService.saveObjectToFile(fullPath, newNgJson);
    this.loggerService.success(`JsonConfigPlugin: ${relativeFilePath} adjusted`);
    return true;
  }

  private merge(target: any, source: any) {
    // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
    const replaceInsteadOfMerge = source[MERGE_REPLACEINSTEADOFMERGE] as Array<string>;
    for (const key of Object.keys(source)) {
      if (key !== MERGE_REPLACEINSTEADOFMERGE) {
        if (source[key] instanceof Object) {
          if (!replaceInsteadOfMerge || replaceInsteadOfMerge.indexOf(key) < 0) {
            if (target[key] && Array.isArray(target[key]) && Array.isArray(source[key])) {
              target[key].push(...source[key]);
            } else if (target[key]) {
              Object.assign(source[key], this.merge(target[key], source[key]));
            } else {
              target[key] = source[key];
            }
          } else {
            target[key] = source[key];
          }
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }



  /**
   * For convenience the correctly casted configuration
   */
  private get cfg() {
    return this.config as PluginConfig;
  }
}
