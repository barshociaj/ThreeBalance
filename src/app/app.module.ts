import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { HTTP } from '@ionic-native/http';

import { AboutPage } from '../pages/about/about';
import { SettingsPage } from '../pages/settings/settings' ;
import { HomePage } from '../pages/home/home';
import { DetailPage } from '../pages/detail/detail';
import { LoginModal } from '../pages/home/login.modal';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { SettingsProvider } from '../providers/settings/settings';
import { LocalstorageProvider } from '../providers/localstorage/localstorage';
import { PhonesProvider } from '../providers/phones/phones';
import { ThreewsProvider } from '../providers/threews/threews';
import { SessionProvider } from '../providers/session/session';
import { NlsProvider } from '../providers/nls/nls';

@NgModule({
  declarations: [
    MyApp,
    AboutPage,
    SettingsPage,
    HomePage,
    DetailPage,
    LoginModal,
    TabsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    SettingsPage,
    HomePage,
    DetailPage,
    LoginModal,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    SettingsProvider,
    LocalstorageProvider,
    PhonesProvider,
    ThreewsProvider,
    SessionProvider,
    NlsProvider,
    HTTP
  ]
})
export class AppModule {}
