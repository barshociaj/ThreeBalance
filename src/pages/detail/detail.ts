import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { SettingsProvider } from '../../providers/settings/settings' ;
import { PhonesProvider } from '../../providers/phones/phones';
import { ThreewsProvider } from '../../providers/threews/threews';
import { CalllogProvider } from '../../providers/calllog/calllog';
import { NlsProvider } from '../../providers/nls/nls';
import { Events } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { LoginModal } from '../home/login.modal';
/**
 * Generated class for the DetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-detail',
  templateUrl: 'detail.html',
})
export class DetailPage {
  phone: any;
  settings: any
  message: String;
  debugMessage: String;
  messageSignIn: String;
  NLS: any;
  logs: Object;
  logsSms: Object;
  logData: Object;
  myNumber: Object;
  groups: ['credit', 'mins', 'texts', 'mb', 'calls', 'messages', 'data'];
  shownGroup: String;
  loginModal: any;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public settingsprovider: SettingsProvider, public phonesprovider: PhonesProvider,
    public threews: ThreewsProvider, public calllog: CalllogProvider,
    public events: Events, public loadingCtrl: LoadingController,
    public nlsprovider: NlsProvider, public modalCtrl: ModalController) {

    this.phone = this.phonesprovider.get(this.navParams.get('phoneId'));
    this.settings = this.settingsprovider.all();
    this.message = "";
    this.debugMessage = "";
    this.messageSignIn = "";
    this.NLS = this.nlsprovider.en;
    this.logs = [];
    this.logsSms = [];
    this.logData = {};
    this.myNumber = null;

  }

  signInClicked (){
    this.loginModal = this.modalCtrl.create(LoginModal,
      { userId: this.phone.user, allowCancel: true, addingUser: false }
    );
    this.loginModal.onDidDismiss(data => {
      if (data.success) {
        this.phone = this.phonesprovider.getIdOnSuccessfulLogin(data.user)
      }
    });
    this.loginModal.present();
  }

  doRefresh (refresher) {
    if (refresher) refresher.complete();
    var self = this;
    this.message = '';
    this.debugMessage = '';
    this.messageSignIn = '';
    const loading = this.loadingCtrl.create({content: 'Refreshing...'});
    loading.present();

    this.threews.login({username: this.phone.user, password: this.phone.pw, seamless:this.phone.seamless})
      .then(function(credentials) {
        self.events.publish('event:auth-loginConfirmed', self.phone.user);
        //this.setCurrentUser($scope.phone.user);
        //if (!Phones.get(user.username)) Phones.add(user);
        console.log('Logged in, retrieving balance');
        self.threews.getBalance(self.phone.seamless)
        .then(function(json) {
          console.log('Data received');
<<<<<<< HEAD
          self.saveBalance(json, self);
=======
          self.saveBalance(json);
>>>>>>> origin/master
          self.events.publish('scroll.refreshComplete', self.phone.user);
          loading.dismiss();
        }, function(error) {
          self.message = 'Data not received, please try again later.';
          self.debugMessage = error.full;
          self.events.publish('scroll.refreshComplete', self.phone.user);
          loading.dismiss();
        });

      }, function(error) {
        console.log('Detail doRefresh: login error' + error)
        self.events.publish('event:auth-login-failed', self.phone.user);
        // promise rejected, could log the error with: console.log('error', error);
        if (error.type == "notseamless") {
          self.message = "Login failed, please check whether you are on 3 network or";
          self.messageSignIn = "with your password.";
        } else {
          self.message = "Login failed, please try again later or";
          self.messageSignIn = "again if you changed your password recently.";
        }
        self.debugMessage = error.full;
        self.events.publish('scroll.refreshComplete', self.phone.user);
        loading.dismiss();
      });

      this.calllog.list().then(function(list){
        self.logs = list;
      })
      this.calllog.listSms().then(function(list){
        self.logsSms = list;
      })
      this.calllog.myNumber().then(function(myNumber){
        self.myNumber = myNumber;
      })
      this.calllog.listData().then(function(logData){
        self.logData = logData;
      })

  }

<<<<<<< HEAD
  saveBalance (json, self) {
    self.phone.values = json;
    self.phone.lastupdated = new Date().getTime();
    self.phonesprovider.put(self.phone.user, self.phone);
=======
  saveBalance (json) {
    this.phone.values = json;
    this.phone.lastupdated = new Date().getTime();
    this.phonesprovider.put(this.phone.user, this.phone);
>>>>>>> origin/master
  }

  remove () {
    this.phonesprovider.remove(this.phone.user);
    this.navCtrl.popToRoot();
  }

  //Accordion (groups)

  toggleGroup (group) {
    if (this.isGroupShown(group)) {
      this.shownGroup = null;
    } else {
      this.shownGroup = group;
    }
  }

  isGroupShown (group) {
    return this.shownGroup === group;
  }

  //Pretty date
  prettyDate (time){
    if (!time || time == "") return "never";

    var date = new Date(time);

    var diff = (((new Date()).getTime() - date.getTime()) / 1000),
    day_diff = Math.floor(diff / 86400);

    if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) {
      return "";
    }
    return day_diff == 0 && (
      diff < 60 && "a short while ago" ||
      diff < 120 && "1 minute ago" ||
      diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
      diff < 7200 && "1 hour ago" ||
      diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
      day_diff == 1 && "Yesterday" ||
      day_diff < 7 && day_diff + " days ago" ||
      day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
  }

  prettyUpTime (ms){
    var time = new Date().getTime() - ms;
    return this.prettyDate(time);
  }

  timeToRefresh (time){
    if (this.phone.lastupdated == "") return true;
    var date = new Date(this.phone.lastupdated);
    var diff = (((new Date()).getTime() - date.getTime()) / 1000);
    if (diff < this.settingsprovider.get('timeToRefresh').value*60) return true;
    return false
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DetailPage');

    if (this.phone && this.phone.id && this.timeToRefresh) {
      this.doRefresh(null);
    }
  }

}
