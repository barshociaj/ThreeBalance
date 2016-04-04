//TODO: list of texts & cost
//TODO: list of picture msgs & cost

angular.module('starter.controllers', [])

.controller('ApplicationCtrl', function ($rootScope, $scope, $state, ThreeWS, $ionicModal) {
  $scope.currentUser = null;
  $scope.isAuthenticated = ThreeWS.isAuthenticated;

  $scope.setCurrentUser = function (user) {
    $scope.currentUser = user;
  };

  $ionicModal.fromTemplateUrl('templates/login.html', function(modal) {
      $scope.loginModal = modal;
    },
    {
      scope: $scope,
      animation: 'slide-in-up',
      focusFirstInput: true
    }
  ).then(function(){
    $rootScope.loginModalReady = true;
    $rootScope.$broadcast('event:loginModal-ready');
  });

  //Be sure to cleanup the modal by removing it from the DOM
  $scope.$on('$destroy', function() {
    $scope.loginModal.remove();
  });

  $scope.goHome = function(tab) {
    //console.log(tab);
    //$state.go('tab.phones', {}, {reload: true, inherit: false});
    setTimeout(function() {
      $state.go('tab.phones', {}, {reload: true, inherit: false});
    },20);
  };

})

.controller('PhonesCtrl', function($rootScope, $scope, $state, NLS, Phones, ionicPlatform, $window) {
  $scope.phones = Phones.all();
  /*
  var i = 0, id = null, key = 0; item = null, length = $window.localStorage.length, msg='';
  for (i = 0; i < length; i += 1) {
    id = $window.localStorage.key(key);
    //id = (/^-?\d+(\.\d+)?$/.test(id)) ? id * 1 : id;
    msg = msg + ' # ' + id + ' : ' + $window.localStorage.getItem(id);
  }
  $scope.message = msg;
  */

  $scope.add = function() {
    $rootScope.$broadcast('event:auth-adduser');
  }

  $scope.onLoad = function() {
    if ($rootScope.initialized) return;
    $rootScope.initialized = true;
    if (Phones.isEmpty()) {
      $rootScope.$broadcast('event:auth-loginRequired');
    } else {
      //force switching to the first phone and refreshing balance upon opening
      $state.go("tab.phone-detail", {phoneId: $scope.phones[0].id});
    }
  }

  //show login modal if no phone numbers are stored
  if ($rootScope.loginModalReady) $scope.onLoad();
  else {
    $scope.$on('event:loginModal-ready', function(e) {
      $scope.onLoad()
    });
  }
})

.controller('PhoneDetailCtrl', function($rootScope, $scope, $state, $stateParams, ThreeWS, NLS, Phones, Settings, $q, $ionicLoading, CallLog) {
  $scope.phone = Phones.get($stateParams.phoneId);
  $scope.settings = Settings.all();
  $scope.message = "";
  $scope.messageSignIn = false;
  $scope.NLS = NLS;
  $scope.logs = null;
  $scope.logsSms = null;
  $scope.logData = null;
  $scope.myNumber = null;
  CallLog.list.then(function(list){
    $scope.logs = list.rows;
  })
  CallLog.listSms.then(function(list){
    $scope.logsSms = list.rows;
  })
  CallLog.myNumber.then(function(myNumber){
    $scope.myNumber = myNumber;
  })
  CallLog.listData.then(function(logData){
    $scope.logData = logData;
  })

  $scope.showLoginModal = function(){
    $scope.setCurrentUser($scope.phone.user);
    $rootScope.$broadcast('event:auth-changeCredentials');
  }

  $scope.doRefresh = function() {
    $scope.message = '';
    $scope.messageSignIn = false;
    $ionicLoading.show({template: 'Refreshing...'});

    /*
    ThreeWS.getBalance($scope.phone.seamless)
    .then(function(json) {
      $scope.saveBalance(json);
      $scope.$broadcast('scroll.refreshComplete');
      $ionicLoading.hide();
    }, function(error) {
      //try again, now with login
    */

    ThreeWS.login({username: $scope.phone.user, password: $scope.phone.pw, seamless:$scope.phone.seamless})
      .then(function(phone) {
        $rootScope.$broadcast('event:auth-loginConfirmed');
        $scope.setCurrentUser($scope.phone.user);
        //if (!Phones.get(user.username)) Phones.add(user);
        console.log('Logged in, retrieving balance');
        ThreeWS.getBalance($scope.phone.seamless)
        .then(function(json) {
          console.log('Data received');
          $scope.saveBalance(json);
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        }, function(error) {
          $scope.message = 'Data not received, please try again later.';
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        });

      }, function(error) {
        $rootScope.$broadcast('event:auth-login-failed');
        // promise rejected, could log the error with: console.log('error', error);
        if (error == "notseamless") {
          $scope.message = "Login failed, please check whether you are on 3 network or";
          $scope.messageSignIn = "with your password.";
        } else {
          $scope.message = "Login failed, please try again later or";
          $scope.messageSignIn = "again if you changed your password recently.";
        }
        $scope.$broadcast('scroll.refreshComplete');
        $ionicLoading.hide();
      });

  /*
    });
  */

  };

  $scope.saveBalance = function(json) {
    $scope.phone.values = json;
    $scope.phone.lastupdated = new Date().getTime();
    Phones.put($scope.phone.user, $scope.phone);
  }

  $scope.remove = function() {
    Phones.remove($scope.phone.user);
    $scope.goHome();
  }

  //Accordion (groups)
  $scope.groups = ['credit', 'mins', 'texts', 'mb', 'calls', 'messages', 'data'];
  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

  //Pretty date
  $scope.prettyDate = function (time){
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

  $scope.prettyUpTime = function (ms){
    var time = new Date().getTime() - ms;
    return $scope.prettyDate(time);
  }

  $scope.timeToRefresh = function (time){
    if ($scope.phone.lastupdated == "") return true;
    var date = new Date($scope.phone.lastupdated);
    var diff = (((new Date()).getTime() - date.getTime()) / 1000);
    if (diff < Settings.get('timeToRefresh').value*60) return true;
    return false
  }

  if ($scope.phone && $scope.phone.id && $scope.timeToRefresh) {
    $scope.doRefresh();
  }


})

.controller('SettingCtrl', function($scope, Settings, NLS) {
  $scope.settings = Settings.all();
  $scope.experimentalChange = function() {
    Settings.put('experimental',$scope.settings.experimental ? true : false);
  }
})

.controller('LoginCtrl', function($rootScope, $scope, $state, $ionicLoading, Phones, ThreeWS) {
  $scope.message = "";
  $scope.user = {
    username: '',
    password: ''
  };

  $scope.loginSuccess = function(user) {
    $rootScope.$broadcast('event:auth-loginConfirmed');
    $scope.setCurrentUser(user.username);
    var phone = Phones.get(user.username);
    if (phone) {
      if (phone.seamless && user.password) {
        //convert seamless user to password based
        phone.seamless = false;
      }
      if (!phone.seamless) phone.pw = user.password;
      Phones.put(phone.id, phone)
    }
    var id = phone ? phone.id : Phones.add(user);
    $state.go("tab.phone-detail", {phoneId: id});
    $ionicLoading.hide();
  }

  $scope.login = function(user) {
    $ionicLoading.show({template: 'Signing in...'});
    ThreeWS.login(user)
    .then(function(user) {
      $scope.loginSuccess(user);
    }, function(error) {
      //$scope.message = error;
      $rootScope.$broadcast('event:auth-login-failed');
      // console.log('LoginCtrl error', error);
      $ionicLoading.hide();
    });

  }

  $scope.$on('event:auth-adduser', function(e, rejection) {
    $scope.allowCancel = true;
    $scope.addingUser = true;
    $scope.message = '';
    $scope.user = {
      username: '',
      password: ''
    };
    $scope.loginModal.show();
  });

  $scope.$on('event:auth-changeCredentials', function(e, rejection) {
    $scope.allowCancel = true;
    $scope.addingUser = false;
    $scope.message = '';
    var phone = Phones.get($scope.currentUser);
    $scope.user = {
      username: $scope.currentUser,
      password: phone ? phone.pw : '',
      seamless: false
    };
    $scope.loginModal.show();
  });

  $scope.$on('event:auth-loginRequired', function(e, rejection) {
    $scope.message = "";
    $scope.allowCancel = false;
    $scope.addingUser = false;

    if (Phones.isEmpty()) {
      //try Seamless first
      $ionicLoading.show({template: 'Checking if on 3 network...'});
      ThreeWS.login({seamless: true})
      .then(function(user) {
        $scope.loginSuccess(user);
      }, function(error) {
        $ionicLoading.hide();
        $scope.loginModal.show();
      });
    } else {
      $scope.loginModal.show();
    }
  });

  $scope.$on('event:auth-loginCancelled', function() {
    $scope.username = null;
    $scope.password = null;
    $scope.loginModal.hide();
  });

  $scope.$on('event:auth-loginConfirmed', function() {
    $scope.username = null;
    $scope.password = null;
    $scope.loginModal.hide();
  });

  $scope.$on('event:auth-login-failed', function(e, status) {
    var error = "Login failed.";
    if (status == 401) {
      error = "Invalid Username or Password.";
    }
    $scope.message = error;
  });

  $scope.cancelLogin = function() {
    $rootScope.$broadcast('event:auth-loginCancelled');
  }

})
