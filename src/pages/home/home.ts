import { Component } from '@angular/core';
import { ModalController, NavController, LoadingController } from 'ionic-angular';
import { DetailPage } from '../detail/detail';
import { LoginModal } from '../home/login.modal';
import { PhonesProvider } from '../../providers/phones/phones';
import { ThreewsProvider } from '../../providers/threews/threews';
import { SettingsProvider } from '../../providers/settings/settings' ;
import { Platform } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  user: any;
  loading: any;
  loginModal: any;
  settings: any;
  debugMessage: String;

  constructor(platform: Platform, public navCtrl: NavController, public modalCtrl: ModalController,
    public phonesprovider: PhonesProvider, public loadingCtrl: LoadingController,
    public threews: ThreewsProvider, public settingsprovider: SettingsProvider) {

    this.settings = this.settingsprovider.all();

    platform.ready().then(() => {
      console.log('ready')
      this.load();
    });
  }

  viewPhone(index){
    console.log('Viewing: ' + index);

    this.navCtrl.push(DetailPage, {phoneId: index});
  }

  presentLoginModal(allowCancel, addingUser) {
    this.loginModal = this.modalCtrl.create(LoginModal,
      { userId: this.user, allowCancel: allowCancel, addingUser: addingUser }
    );
    this.loginModal.onDidDismiss(data => {
      if (!data) {
        //if cancelled by native UI methods, force login modal again
        if (!allowCancel) this.presentLoginModal(allowCancel, addingUser);
        return;
      }
      this.user = data.user;
      this.debugMessage = data.debugMessage;
      if (data.success) {
        var id = this.phonesprovider.getIdOnSuccessfulLogin(this.user)
        this.viewPhone(id);
      }
    });
    this.loginModal.present();
  }

  addUser() {
    this.user = {
      username: '',
      password: ''
    };
    this.presentLoginModal(true, true);
  }

  changeCredentials(){
    var phone = this.phonesprovider.get(this.user);
    this.user= {
      username: this.user.username,
      password: phone ? phone.pw : '',
      seamless: false
    };
    this.presentLoginModal(true, false);
  }

  load() {
    var self = this;
    if (this.phonesprovider.isEmpty()) {
      //try Seamless first
      this.loading = this.loadingCtrl.create({content: 'Checking if on 3 network...'});
      this.loading.present();
      this.threews.login({seamless: true})
      .then(function(user) {
        self.user = user;
        self.loading.dismiss();
        var id = self.phonesprovider.getIdOnSuccessfulLogin(self.user)
        console.log('2ID: ' + id);
        self.viewPhone(id);
      }, function(error) {
        self.loading.dismiss();
        self.presentLoginModal(false, false);
      });
    } else {
      //this.presentLoginModal(false, false);
      this.viewPhone(self.phonesprovider.getFirst());
    }
  }


}
