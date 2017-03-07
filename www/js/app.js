// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngSanitize'])

.run(function($ionicPlatform) {

  //BEGIN: simulate old localStorage
  //localStorage.setItem(37523, '{"id":"37523","user":"07777666733","pw":false,"seamless":true,"status":"","lastupdated":1415053584704,"values":{},"accounts":null}');
  //localStorage.setItem(977078, '{"id":"977078","user":"08777687733","pw":false,"seamless":true,"status":"","lastupdated":1415053492414,"values":{},"accounts":null}');
  //END: simulate old localStorage


  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.withCredentials = true;
}])

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  $ionicConfigProvider.tabs.position('bottom');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'templates/tabs.html'
    })

    // Each tab has its own nav history stack:
    .state('tab.phones', {
      url: '/phones',
      views: {
        'tab-phones': {
          templateUrl: 'templates/tab-phones.html',
          controller: 'PhonesCtrl'
        }
      }
    })
    .state('tab.phone-detail', {
      url: '/phone/:phoneId',
      views: {
        'tab-phones': {
          templateUrl: 'templates/phone-detail.html',
          controller: 'PhoneDetailCtrl'
        }
      }
    })
    .state('tab.setting', {
      url: '/setting',
      views: {
        'tab-setting': {
          templateUrl: 'templates/tab-setting.html',
          controller: 'SettingCtrl'
        }
      }
    })
    .state('tab.privacy', {
      url: '/privacy',
      views: {
        'tab-privacy': {
          templateUrl: 'templates/tab-privacy.html',
          controller: 'PrivacyCtrl'
        }
      }
    })
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/phones');

})

.constant('NLS', {
  callLogNote: "Call cost is approximate and does not cover special numbers or scenarios including add-ons, roaming, etc.. Please refer to the Three pricing guide for details.",
  smsLogNote: "SMS cost is approximate and does not cover special numbers or scenarios including add-ons, roaming, etc.. Please refer to the Three pricing guide for details.",
  dataLogNote: "Data cost is approximate and does not cover scenarios including add-ons, roaming, etc.. Please refer to the Three pricing guide for details.",
  pullingText: "Pull to refresh...",
  phone: "Phone number",
  user: "Phone number:",
  pw: "Password",
  mins: "MINS",
  texts: "TEXTS",
  mb: "MB",
  credit: "CREDIT",
  forget: "Forget",
  refresh: "Refresh",
  renewal: "RENEWAL",
  lastupdated: "Last updated",
  add: "Add",
  back: "List",
  login: "LOGIN",
  cancel: "Cancel",
  retry: "Try again",
  retryseamless: "Try auto-login again",
  missingentry: "Please fill in all fields",
  signingin: "Signing in...",
  signinginseamless: "Signing in (trying password-less)...",
  signinsuccess: "Login successful",
  retrieving: "Retrieving balance...",
  retrievingseamless: "Retrieving balance from 3 auto-login service...",
  retrievesuccess: "Balance successfully retrieved",
  retrievefailure: "Balance response not successful",
  retrievalError: "Error reading balance, please try again. If not successful, the Three web service might have changed. Please report and wait for your app to update.",
  retrieveuserError: "Error retrieving phone number",
  badlogin: "LOGIN not successful, please try again.",
  nonetwork: "No internet connection?",
  cancelled: "Cancelled",
  nonetworkseamless: "No response from 3 connection, retry or use account password."
})
