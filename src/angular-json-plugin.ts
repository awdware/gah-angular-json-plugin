import { GahPlugin, GahPluginConfig } from '@awdware/gah-shared';

import { AngularJsonConfig } from './angular-json-config';
import { AngularJson } from './angular.schema';

export class AngularJsonPlugin extends GahPlugin {
  constructor() {
    super('AngularJsonPlugin');
  }

  public async onInstall(existingCfg: AngularJsonConfig): Promise<GahPluginConfig> {
    const newCfg = existingCfg ?? new AngularJsonConfig();

    if (!existingCfg) {
      this.loggerService.warn('The AngularJsonPlugin plugin has to be configured manually');
    }

    return newCfg;
  }

  public onInit() {
    // Register a handler that gets called synchronously if the corresponding event occured. Some events can be called multiple times!
    this.registerEventListener('HOST_COPIED', (event) => {

      const basePath = event.gahFile?.modules.find(x => x.isHost)?.basePath!;
      this.loggerService.debug(`Found angular json: ${basePath}`);
      const ngJsonPath = this.fileSystemService.join(basePath, 'angular.json');

      const partialNgJson = this.cfg.ngJson;
      if (!partialNgJson) {
        this.loggerService.warn('No angular config provided');
        return;
      }
      const ngJson = this.fileSystemService.parseFile<AngularJson>(ngJsonPath);

      const newNgJson = this.merge(ngJson, partialNgJson);

      this.fileSystemService.saveObjectToFile(ngJsonPath, newNgJson);
      this.loggerService.success('angular.json adjusted');
    });
  }

  private merge(target: any, source: any) {
    // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object) {
        if (target[key] && Array.isArray(target[key]) && Array.isArray(source[key])) {
          target[key].push(...source[key]);
        } else if (target[key]) {
          Object.assign(source[key], this.merge(target[key], source[key]));
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
    return this.config as AngularJsonConfig;
  }
}
