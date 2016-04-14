angular.module('starter.services', [])

.factory('$localstorage', ['$window', function($window) {

  //BEGIN convert old data store
  var _getOld = function(id) {
    var item = $window.localStorage.getItem(id), object = null;
    var _dojoparse = function(str){return eval('(' + str + ')');};
    try {
      object = _dojoparse(item);
      object["id"] = id;
      if (object["accounts"] !== null) {
        return undefined;
      }
      delete object["accounts"];
      return object;
    } catch (e) {
      return undefined;
    }
  }
  var _convertOld = function() {
    var phones = [], i = 0, id = null, key = 0; item = null, length = $window.localStorage.length;
    for (i = 0; i < length; i += 1) {
      id = $window.localStorage.key(key);
      id = (/^-?\d+(\.\d+)?$/.test(id)) ? id * 1 : id;
      item = _getOld(id);
      if (item) {
        phones.push(item);
        $window.localStorage.removeItem(id);
      } else key+=1
    }
    if (phones.length > 0) $window.localStorage['accounts'] = angular.toJson(phones);
  }

  //convert old Dojo store if exists
  if (!$window.localStorage.getItem('accounts')) _convertOld();
  //END convert old data store

  return {
    set: function(key, value) {
      $window.localStorage.setItem(key, value);
    },
    get: function(key, defaultValue) {
      return $window.localStorage.getItem(key) || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage.setItem(key, angular.toJson(value));
    },
    getObject: function(key) {
      return angular.fromJson($window.localStorage.getItem(key) || '{}');
    }
  }
}])

.factory('Phones', function($localstorage) {
  var phones = $localstorage.getObject('accounts');
  if (!angular.isArray(phones)) phones = [];

  return {
    isEmpty: function() {
      return (phones.length == 0);
    },
    all: function() {
      return phones;
    },
    put: function(phoneId, newObject) {
      //search both ID and user values
      for(var i=0; i<phones.length; i++){
        if (phones[i].id == phoneId || phones[i].user == phoneId) {
          phones[i] = newObject;
          $localstorage.setObject('accounts', phones);
          return;
        }
      }
    },
    get: function(phoneId) {
      //search both ID and user values
      for(var i=0; i<phones.length; i++){
        if (phones[i].id == phoneId || phones[i].user == phoneId) return phones[i];
      }
      return null;
    },
    remove: function(phoneId) {
      //search both ID and user values
      for(var i=0; i<phones.length; i++){
        if (phones[i].id == phoneId || phones[i].user == phoneId) {
          phones.splice(i,1);
          $localstorage.setObject('accounts', phones);
          return true;
        }
      }
      return false;
    },
    add: function(credentials){
      var newPhone = {
        "id": (Math.round(Math.random()*1000000)).toString(),
        "user": credentials.username,
        "pw": credentials.password,
        "seamless": credentials.seamless || false,
        "status": "",
        "lastupdated": "",
        "values": {
          "credit": {
            "label": "",
            "headings": [],
            "rows": [],
            "total": ""
          }
        }
      };
      phones.push(newPhone);
      $localstorage.setObject('accounts', phones);
      return newPhone.id;
    }
  }
})

.factory('ThreeWS', function ($http, $q, Session, $sce, $sanitize, Cookies) {

  var _clean = function(text) {
    return text.replace(/<\/?[^>]+(>|$)/g, "").replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," ").replace(/^\s+|\s+$/g, '');
  }

  var _readBalance = function(data, from, json){

    var label = "", type;

    var start = data.indexOf('class="balance"', from);
    if (start < 0) return;
    var end = data.indexOf('</table>', start);
    if (end < 0) return;
    var tablehtml = data.substring(start, end);

    var html = '<table>' + tablehtml.substring(tablehtml.indexOf('>')+1).replace(/\n/g,"") + '</table>';

    var doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = $sanitize(html);

    [].forEach.call(doc.querySelectorAll('thead tr th:first-of-type'), function(el) {
      label = _clean(el.innerHTML);
    });

    if (label.indexOf('nternet') > 0) type = "mb";
    if (label.indexOf('essages') > 0) type = "texts";
    if (label.indexOf('inutes') > 0) type = "mins";
    if (label.indexOf('redit') > 0) type = "credit";

    json[type] = {"label": label, "headings":[], "rows":[], "total":""};

    var index=0;
    [].forEach.call(doc.querySelectorAll('tbody tr th'), function(el) {
      json[type].headings[index] = _clean(el.innerHTML);
      index++;
    });
    [].forEach.call(doc.querySelectorAll('tbody tr'), function(row) {
      var values = [];
      var index=0;
      [].forEach.call(row.querySelectorAll('td'), function(el) {
        values[index] = _clean(el.innerHTML);
        index++;
      });
      if (values && values[0]) {
        if (values[0].indexOf('otal') > 0) json[type].total = values[2];
        else json[type].rows.push(values);
      }
    });

    _readBalance(data, end+1, json);
  }

  var _readBalanceSeamless = function(data, from, json, previousType){
    var label = "", type = false, total = "";

    var start = data.indexOf('<table', from);
    if (start < 0) return;
    var end = data.indexOf('</table>', start);
    if (end < 0) return;
    var tablehtml = data.substring(start, end);

    var html = '<table>' + tablehtml.substring(tablehtml.indexOf('>')+1).replace(/\n/g,"") + '</table>';
    var doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = $sanitize(html);

    var values = [];
    var index = 0;
    [].forEach.call(doc.querySelectorAll('tr:first-of-type td'), function(el) {
      values[index] = _clean(el.innerHTML);
      index++;
    });

    label = values[0];
    if (label.indexOf('nternet') > 0) type = "mb";
    if (label.indexOf('essages') > 0) type = "texts";
    if (label.indexOf('inutes') > 0) type = "mins";
    if (label.indexOf('redit') > 0) type = "credit";

    total = values[1];
    json[type] = {"label": label, "headings":[], "rows":[values], "total":total};

    if (previousType && total && total.indexOf('View breakdown') > 0) {
      var urlMatch = total.match(/href="([^"]*)"/);
      if (urlMatch[1]) json[previousType].unresolvedBreakdownURL =
        'http://mobile.three.co.uk' + decodeURIComponent(urlMatch[1]);
    }

    _readBalanceSeamless(data, end+1, json, type || previousType);
  }

  return {
    login: function(credentials) {
      var loginPromise = $q.defer();

      if (!credentials.password && credentials.seamless) {
        var url = "http://mobile.three.co.uk/sce/portal/my3/myDetails/contactDetails/";
        //var url = "3seamless.html";
        $http.get(url)
        .then(function(response) {
          var data = response.data;
          if (data && data.indexOf('name="usr_name"') > 0 ) {
            var userMatch = data.match(/name="usr_name" type="hidden" value="..([^"]*)"/);
            var user = '0'+ userMatch[1];
            //Session.create(token, user);
            loginPromise.resolve({username: user, seamless: true});
          } else {
            loginPromise.reject('notseamless');
          }
        }, function(response) {
          // something went wrong
          loginPromise.reject('nonetwork');
        });
      } else
      //clear session first
      Cookies.clear(function(browser) {

        var url = "https://sso.three.co.uk/mylogin/?dontTestForDongleUser=true"
        + "&username=" + credentials.username
        + "&password=" + credentials.password;

        console.log('1. get login ticket', url)
        return $http.get(url)
          .then(function(response) {
            var data = response.data;
            if (data && data.indexOf('name="lt" value="') > 0 ) {
              var lt = data.match(/name="lt" value="([^"]*)"/);
              var token = lt[1];

              url = "https://sso.three.co.uk/mylogin/?dontTestForDongleUser=true&lt=" + lt[1]
                + "&username=" + credentials.username
                + "&password=" + credentials.password;

              console.log('2. log in with the login ticket', url)
              return $http.get(url)
                .then(function(response) {
                  var data = response.data;
                  if (data && (data.indexOf('Login successful.') > 0 || data.indexOf('You have been logged in successfully') > 0)) {
                    Session.create(token, credentials.username);
                    loginPromise.resolve(credentials);
                  } else {
                    //console.log(data);
                    //loginPromise.reject(credentials.password + credentials.username + credentials.seamless + url + data);
                    loginPromise.reject('badlogin');
                  }
                }, function(response) {
                  // something went wrong
                  loginPromise.reject('nonetwork');
              });

            } else if (data && data.indexOf("You have been logged in successfully.") > 0) {
              loginPromise.reject('restart'); //maybe wrong session
            } else {
              loginPromise.reject('nonetwork');
            }
          }, function(response) {
            // something went wrong
            loginPromise.reject('nonetwork');
        });
      });
      return loginPromise.promise;
    },
    isAuthenticated: function () {
      return !!Session.userId;
    },
    getBalance: function(seamless){

      //Seamless
      if (seamless) {
        var url="http://mobile.three.co.uk/account/my3/accountp";
        //var url="3detailsseamless.html";
        return $http.get(url)
        .then(function(response) {
          var data = response.data, json = {};
          _readBalanceSeamless(data, 0, json, false)
          if (json.credit && json.credit.total && json.credit.total != "") {
            return json;
          } else {
            return $q.reject('retrievefailure');
          }
        }, function(response) {
          // something went wrong
          $q.reject('nonetwork');
        });
      }

      //Password based
      var url = "https://www.three.co.uk/New_My3/Account_balance?id=My3_CheckYourBalanceLink";

      console.log('3. get SSO ticket', url)
      return $http.get(url)
      .then(function(response) {

        var data = response.data;
        if (data && data.indexOf('&ticket=') > 0  ) {
          var lt = data.match(/&ticket=([^"']*)["']/);
          var token = lt[1];

          var url = "https://www.three.co.uk/New_My3/Account_balance?id=My3_CheckYourBalanceLink&ticket=" + token;

          console.log('4. get balance with SSO ticket', url)
          return $http.get(url)
          .then(function(response) {
            var data = response.data, json = {};
            _readBalance(data, 0, json)
            if (json.credit && json.credit.total && json.credit.total != "") {
              return json;
            } else {
              return $q.reject('retrievefailure');
            }
          }, function(response) {
            // something went wrong
            return $q.reject('nonetwork');
          });
        } else {
          return $q.reject('nossoticket');
        }
      }, function(response) {
        // something went wrong
        return $q.reject('nonetwork');
      });
    }
  };
})


.service('Session', function () {
  this.create = function (sessionId, userId) {
    this.id = sessionId;
    this.userId = userId;
  };
  this.destroy = function () {
    this.id = null;
    this.userId = null;
  }
  return this;
})

.factory('Settings', function($localstorage) {
  var settings = $localstorage.getObject('settings');
  if (!settings || !settings.timeToRefresh) settings = {
    "timeToRefresh": '5',
    "experimental": false
  };

  return {
    all: function() {
      return settings;
    },
    put: function(settingId, newObject) {
      settings[settingId] = newObject;
      $localstorage.setObject('settings', settings);
    },
    get: function(settingId) {
      return settings[settingId];
    }
  }
})

.factory("ionicPlatform", function( $q ){
  var ready = $q.defer();
  var isReady = false;

  ionic.Platform.ready(function( device ){
    ready.resolve( device );
    isReady = true;
  });

  return {
    ready: ready.promise,
    isReady: isReady
  }
})

.factory('CallLog', function( ionicPlatform, $q ) {

  var listPromise = function () {
    var list = $q.defer();
    //BEGIN: Browser test
    if (!window.plugins) {
      console.log('CallLog plugin missing, running in a browser? (calls)');
      //send test data
      list.resolve(enhanceAndFilterList({"rows":[
        {"new":0,"duration":122,"number":"02392152343","type":2,"date":1414689331075,"cachedNumberLabel":0,"cachedNumberType":0}
        ,{"new":0,"duration":0,"number":"+447763105236","type":2,"date":1414689259467,"cachedNumberLabel":0,"cachedNumberType":0}
        ,{"new":0,"duration":12,"number":"0845135236","type":2,"date":1414689259567,"cachedNumberLabel":0,"cachedNumberType":0}
        ,{"new":0,"duration":19,"number":"07763105236","type":2,"date":1414689259467,"cachedNumberLabel":0,"cachedNumberType":0}
        ,{"new":0,"duration":319,"number":"0845135236","type":2,"date":1414689259567,"cachedNumberLabel":0,"cachedNumberType":0}
      ]}
      ))
      return list.promise;
    }
    //END: Browser test
    var CallLogPlugin = window.plugins.calllog;
    CallLogPlugin.list(null, function(result){
      list.resolve( enhanceAndFilterList(result) );
      console.log('Result came:' + result)
    });
    return list.promise;
  }

  var listSmsPromise = function () {
    var listSms = $q.defer();
    //BEGIN: Browser test
    if (!window.plugins) {
      console.log('CallLog plugin missing, running in a browser? (sms)');
      //send test data
      listSms.resolve(enhanceAndFilterListSms({"rows":[
        {"new":0,"duration":122,"number":"02392152343","type":2,"date":1414689331075,"cachedNumberLabel":0,"cachedNumberType":0}
        ,{"new":0,"duration":0,"number":"+447763105236","type":2,"date":1414689259467,"cachedNumberLabel":0,"cachedNumberType":0}
        ,{"new":0,"duration":12,"number":"0845135236","type":2,"date":1414689259567,"cachedNumberLabel":0,"cachedNumberType":0}
        ,{"new":0,"duration":19,"number":"00447763105236","type":2,"date":1414689259467,"cachedNumberLabel":0,"cachedNumberType":0}
        ,{"new":0,"duration":319,"number":"0845135236","type":2,"date":1414689259567,"cachedNumberLabel":0,"cachedNumberType":0}
      ]}
      ))
      return listSms.promise;
    }
    //END: Browser test
    var CallLogPlugin = window.plugins.calllog;
    CallLogPlugin.listSms(null, function(result){
      console.log("SMS RESULT **********************");
      console.log(result.rows[0]);

      listSms.resolve( enhanceAndFilterListSms(result) );
      console.log('Sms result came:' + result)
    });
    return listSms.promise;
  }

  var listDataPromise = function () {
    var listData = $q.defer();
    //BEGIN: Browser test
    if (!window.plugins) {
      console.log('CallLog plugin missing, running in a browser? (data)');
      //send test data
      listData.resolve(enhanceAndFilterUsageData({
        "received": 3423234,
        "transmitted": 3423234,
        "elapsedRealtime": 123,
        "uptimeMillis": 12314124
      }
      ))
      return listData.promise;
    }
    //END: Browser test
    var CallLogPlugin = window.plugins.calllog;
    CallLogPlugin.dataUsage(null, function(result){
      listData.resolve( enhanceAndFilterUsageData(result) );
      console.log('Data usage result came:' + result)
    });
    return listData.promise;
  }

  var numberPromise = function () {
    var number = $q.defer();
    //BEGIN: Browser test
    if (!window.plugins) {
      number.reject(null)
      return number.promise;
    }
    //END: Browser test
    var CallLogPlugin = window.plugins.calllog;
    CallLogPlugin.myNumber(null, function(result){
      number.resolve( result );
      console.log('My number:' + result)
    }, function(err){
      number.reject(err);
      console.log('Phone number not available:' + err)
    });
    return number.promise;
  }

  var enhanceAndFilterList = function(calllog) {
    var rows = calllog.rows;
    var outgoing = [],n,cost;
    /* TODO: fix & improve
     *
     * Picture or Video msg - 19.8p;
     * Text abroad: 25.2p
     * UK to Australia, Hong Kong, Indonesia, Israel, Macau, Norway, Sri Lanka, Switzerland and USA: 56.2p
     * UK to Austria, Denmark, Finland, France, Italy, Republic of Ireland and Sweden: 46p
     * 0800/0500/0808 numbers that are not on the Telephone
     *         H elpline Associa*tion list
     *         05 corporate numbers and IP Phones, 082
     *         10.2p to 15.3p per
     *         minute
     *         0845 / 0870 35p per minute
     *         0843 / 0844 / 0871 / 0872 Up to 35p per call
     *         + 35p per minute
     */
    var cost = function(n,d){
      var free = ["b","333","444","555","999","112","111","116000","116006","116111","116117","116123","e"];
      var tar1 = ["b","0500","e"];
      var tar2 = ["b","0845","0870","e"];
      var tar3 = ["b","0843","0844","0871","0872","e"];
      var tar4 = ["b","05","e"];
      var tar5 = ["b","082","e"];
      var tar6 = ["b","01","02","07","e"];
      var tar7 = ["b","070","076","090","091","098","e"];
      var tar8 = ["b","084","e"];
      var tar9 = ["b","087","e"];
      var tar10 = ["b","0800","0808","e"];
      if (free.join(',').indexOf(","+n+",") > 0) return 0;
      if (tar1.join(',').indexOf(","+n.substring(0,4)+",") > 0) return Math.ceil(d/60)*15.3;
      if (tar2.join(',').indexOf(","+n.substring(0,4)+",") > 0) return Math.ceil(d/60)*35;
      if (tar3.join(',').indexOf(","+n.substring(0,4)+",") > 0) return Math.ceil(d/60)*35;
      if (tar4.join(',').indexOf(","+n.substring(0,2)+",") > 0) return Math.ceil(d/60)*15.3;
      if (tar5.join(',').indexOf(","+n.substring(0,3)+",") > 0) return Math.ceil(d/60)*15.3;
      if (tar6.join(',').indexOf(","+n.substring(0,2)+",") > 0) return Math.ceil(d/60)*3;
      if (tar7.join(',').indexOf(","+n.substring(0,3)+",") > 0) return Math.ceil(d/60)*236; //worst case scenario
      if (tar8.join(',').indexOf(","+n.substring(0,3)+",") > 0) return 45 + Math.ceil(d/60)*7; //worst case scenario
      if (tar9.join(',').indexOf(","+n.substring(0,3)+",") > 0) return 45 + Math.ceil(d/60)*13; //worst case scenario
      if (tar10.join(',').indexOf(","+n.substring(0,4)+",") > 0) return 0;
      if (n == "101") return 15;
      if (n.substring(0,1) == "+" || n.substring(0,2) == "00") return Math.ceil(d/60)*46; //international call most probable scenario
      return false;
    }

    angular.forEach(rows, function(row, key) {
      if (row.type == "2") {
        n = row.number;
        n = n.replace(/^\+44/,"0").replace(/^0044/,"0");
        row.number = n;

        row.cost = cost(n,row.duration);

        if (row.cost === false) row.cost = "";
        else row.cost = "£" + (row.cost/100).toFixed(2);
        outgoing.push(row);
      }
    });
    return {"rows":outgoing};
  }

  var enhanceAndFilterListSms = function(smslog) {
    var rows = smslog.rows;
    var outgoing = [],n,cost;
    /* TODO: fix & improve
     *
     * Picture or Video msg - 19.8p;
     * Text abroad: 25.2p
     */

    var cost = function(n){
      if (n.substring(0,1) == "+" || n.substring(0,2) == "00") return 25.2; //international sms most probable scenario
      return 2;
    }

    angular.forEach(rows, function(row, key) {
      n = row.address;
      n = n.replace(/^\+44/,"0").replace(/^0044/,"0");
      row.address = n;

      row.cost = cost(n);

      if (row.cost === false) row.cost = "";
      else row.cost = "£" + (row.cost/100).toFixed(2);
      outgoing.push(row);
    });
    return {"rows":outgoing};
  }

  var enhanceAndFilterUsageData = function(datalog) {

    datalog.mb = Math.round((datalog.received + datalog.transmitted) / 1024 / 1024);
    datalog.cost = datalog.mb;

    if (datalog.cost === false) datalog.cost = "";
    else datalog.cost = "£" + (datalog.cost/100).toFixed(2);

    return datalog;
  }

  return {
    list: ionicPlatform.isReady ? listPromise() : ionicPlatform.ready.then(function(){return listPromise()}),
    listSms: ionicPlatform.isReady ? listSmsPromise() : ionicPlatform.ready.then(function(){return listSmsPromise()}),
    listData: ionicPlatform.isReady ? listDataPromise() : ionicPlatform.ready.then(function(){return listDataPromise()}),
    myNumber: ionicPlatform.isReady ? numberPromise() : ionicPlatform.ready.then(function(){return numberPromise()})
  }
})

.factory('Cookies', function( ionicPlatform, $q ) {

  var clearSession = function (fc) {
    //BEGIN: Browser test
    if (!window.cookies) {
      console.log('Cookies plugin missing, running in a browser?');
      fc(true);
      return;
    }
    //END: Browser test
    window.cookies.clearSession(function(){
      //console.log('CLEARED');
      fc();
    }, function(err){
      console.log('Problem clearing cookie session' + err);
      fc();
    });
  }

  return {
    clear: function(fc) {
      ionicPlatform.isReady ? clearSession(fc) : ionicPlatform.ready.then(function(){clearSession(fc)})
    }
  }
});
