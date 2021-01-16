import { GahPlugin, GahPluginConfig } from '@gah/shared';

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

    this.registerEventListener('BEFORE_ADJUST_ANGULAR_JSON', (event) => {
      this.reconfigure(event.ngJson, this.cfg.ngJson);
    });
    this.registerEventListener('BEFORE_ADJUST_TS_CONFIG', (event) => {
      this.reconfigure(event.tsConfig, this.cfg.tsConfigJson);
    });
  }

  private reconfigure<T>(existingConfig: any, config?: T): boolean {
    if (!config || !existingConfig) {
      return true;
    }
    this.merge(existingConfig, config);
    this.loggerService.success('JsonConfigPlugin: adjusted');
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
