import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

/*
  Generated class for the LocalstorageProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LocalstorageProvider {

  constructor() {
  }

  set (key, value) {
    window.localStorage.setItem(key, value);
  }

  get(key, defaultValue) {
    return window.localStorage.getItem(key) || defaultValue;
  }

  setObject(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  getObject(key) {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  }

}
