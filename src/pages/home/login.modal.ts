import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, LoadingController } from 'ionic-angular';
import { PhonesProvider } from '../../providers/phones/phones';
import { ThreewsProvider } from '../../providers/threews/threews';
import { SettingsProvider } from '../../providers/settings/settings' ;

@Component({
  selector: 'modal-login',
  templateUrl: 'login.modal.html'
})
export class LoginModal {
  message: String;
  debugMessage: String;
  user: any;
  loading: any;
  username: String;
  password: String;
  allowCancel: Boolean;
  addingUser: Boolean;
  settings: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public phonesprovider: PhonesProvider,
    public threews: ThreewsProvider, public loadingCtrl: LoadingController,
    public viewCtrl: ViewController, public settingsprovider: SettingsProvider) {
    this.message = "";
    this.debugMessage = '';
    this.settings = this.settingsprovider.all();
    this.user = navParams.get('user') || {username:'', password: ''};
    this.allowCancel = navParams.get('allowCancel');
    this.addingUser = navParams.get('addingUser');
  }

  dismiss(success) {
    let data = { user: this.user, success: success, debugMessage: this.debugMessage };
    this.viewCtrl.dismiss(data);
  }

  loginClicked() {
    var self = this;
    this.loading = this.loadingCtrl.create({content: 'Signing in...'});
    this.loading.present();

    this.threews.login(this.user)
    .then(function(user) {
      self.user = user;
      self.loading.dismiss();
      self.debugMessage = "Login was successful."
      self.dismiss(true);
    }, function(err) {
      self.message = err.full.indexOf('403') > 0 ? "Login was blocked by 3 (error 403)" : "Login failed.";
      self.debugMessage = err.full;
      self.loading.dismiss();
    });
  }

}
