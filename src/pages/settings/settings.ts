import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { SettingsProvider } from '../../providers/settings/settings' ;

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  settings: any;

  constructor(public navCtrl: NavController, public settingsprovider: SettingsProvider) {
    this.settings = settingsprovider.all();
  }

  experimentalChange() {
    this.settingsprovider.put('experimental',this.settings.experimental ? true : false);
  }

  debugChange() {
    this.settingsprovider.put('debug',this.settings.debug ? true : false);
  }

}
