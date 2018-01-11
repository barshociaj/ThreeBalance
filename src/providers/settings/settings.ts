import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { LocalstorageProvider } from '../localstorage/localstorage';

/*
  Generated class for the SettingsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SettingsProvider {
  settings: any;

  constructor(public localstorage: LocalstorageProvider) {
    this.settings = localstorage.getObject('settings');
    if (!this.settings || !this.settings.timeToRefresh) this.settings = {
      "timeToRefresh": '5',
      "experimental": false,
      "debug": false
    };
  }

  all() {
    return this.settings;
  }

  put(settingId, newObject) {
    this.settings[settingId] = newObject;
    this.localstorage.setObject('settings', this.settings);
  }

  get(settingId) {
    return this.settings[settingId];
  }

}
