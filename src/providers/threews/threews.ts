import { Injectable, SecurityContext } from '@angular/core';
import { HTTP } from '@ionic-native/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { SessionProvider } from '../../providers/session/session';
import { DomSanitizer } from '@angular/platform-browser';

/*
  Generated class for the ThreewsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ThreewsProvider {
  headers: Object;

  constructor(public http: HTTP, public session: SessionProvider, public sanitizer: DomSanitizer) {
    console.log(this._clean('Hello ThreewsProvider Provider'));
    this.headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'};
  }

  private _clean (text) {
    return text.replace(/<\/?[^>]+(>|$)/g, "").replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," ").replace(/^\s+|\s+$/g, '');
  }

  private _readBalance(data, from, json, self){
    var label = "", type;

    var start = data.indexOf('class="balance"', from);
    if (start < 0) return;
    var end = data.indexOf('</table>', start);
    if (end < 0) return;
    var tablehtml = data.substring(start, end);

    var html = '<table>' + tablehtml.substring(tablehtml.indexOf('>')+1).replace(/\n/g,"") + '</table>';
    var doc = document.implementation.createHTMLDocument("");
    //doc.body.innerHTML = this.sanitizer.bypassSecurityTrustHtml(html);
    doc.body.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, html).toString();
    [].forEach.call(doc.querySelectorAll('thead tr th:first-of-type'), function(el) {
      label = self._clean(el.innerHTML);
    });

    if (label.indexOf('nternet') > 0) type = "mb";
    if (label.indexOf('essages') > 0) type = "texts";
    if (label.indexOf('inutes') > 0) type = "mins";
    if (label.indexOf('redit') > 0) type = "credit";

    json[type] = {"label": label, "headings":[], "rows":[], "total":""};

    var index=0;
    [].forEach.call(doc.querySelectorAll('tbody tr th'), function(el) {
      json[type].headings[index] = self._clean(el.innerHTML);
      index++;
    });
    [].forEach.call(doc.querySelectorAll('tbody tr'), function(row) {
      var values = [];
      var index=0;
      [].forEach.call(row.querySelectorAll('td'), function(el) {
        values[index] = self._clean(el.innerHTML);
        index++;
      });
      if (values && values[0]) {
        if (values[0].indexOf('otal') > 0) json[type].total = values[2];
        else json[type].rows.push(values);
      }
    });

    self._readBalance(data, end+1, json, self);
  }

  private _readBalanceSeamless(data, from, json, previousType, self){
    var label = "", type, total = "";

    var start = data.indexOf('<table', from);
    if (start < 0) return;
    var end = data.indexOf('</table>', start);
    if (end < 0) return;
    var tablehtml = data.substring(start, end);

    var html = '<table>' + tablehtml.substring(tablehtml.indexOf('>')+1).replace(/\n/g,"") + '</table>';
    var doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = this.sanitizer.bypassSecurityTrustHtml(html).toString(); //TODO - check

    var values = [];
    var index = 0;
    [].forEach.call(doc.querySelectorAll('tr:first-of-type td'), function(el) {
      values[index] = self._clean(el.innerHTML);
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

    self._readBalanceSeamless(data, end+1, json, type || previousType, self);
  }


  login(credentials) {
    var self = this, url;
    return new Promise(function(resolve, reject) {

      if (!credentials.password && credentials.seamless) {
        url = "http://mobile.three.co.uk/sce/portal/my3/myDetails/contactDetails/";
        //var url = "3seamless.html";
        console.log('Seamless - getting ' + url)
        self.http.get(url, {}, self.headers)
          .then(response => {
              console.log('Seamless  - got response: ' + response)
              var data = response.data;
              if (data && data.indexOf('name="usr_name"') > 0 ) {
                var userMatch = data.match(/name="usr_name" type="hidden" value="..([^"]*)"/);
                var user = '0'+ userMatch[1];
                //Session.create(token, user);
                resolve({username: user, seamless: true});
              } else {
                reject({type:'notseamless', full: 'Seamless output does not contain name="usr_name"'});
              }
            })
          .catch(err => {
              console.log('Seamless error: ' + err)
              reject({type:'nonetwork', full: err});
          });

      } else {
        //clear session first
        self.http.clearCookies();

        url = "https://sso.three.co.uk/mylogin/?dontTestForDongleUser=true"
        + "&username=" + credentials.username
        + "&password=" + credentials.password;

        //url = "https://blog.alex-miller.co/angular/2017/05/13/default-headers-in-angular.html";


        console.log('1. get login ticket');
        self.http.get(url, {}, self.headers)
          .then(
            response => {
              var data = response.data;
              if (data && data.indexOf('name="lt" value="') > 0 ) {
                var lt = data.match(/name="lt" value="([^"]*)"/);
                var token = lt[1];

                url = "https://sso.three.co.uk/mylogin/?dontTestForDongleUser=true&lt=" + lt[1]
                  + "&username=" + credentials.username
                  + "&password=" + credentials.password;

                console.log('2. log in with the login ticket')
                self.http.get(url, {}, self.headers)
                  .then(response => {
                      var data = response.data;
                      if (data && (data.indexOf('Login successful.') > 0 || data.indexOf('You have been logged in successfully') > 0)) {
                        console.log('Login successful.')
                        self.session.create(token, credentials.username);
                        resolve(credentials);
                      } else {
                        reject({type:'badlogin', full: "Response from 3 does not contain 'Login successful.'"});
                      }
                    })
                  .catch(err => {
                      // something went wrong
                      console.log('2. error: ' + err)
                      reject({type:'nonetwork', full: 'Log in to 3 site with the login ticket failed'});
                  });
              } else if (data && data.indexOf("You have been logged in successfully.") > 0) {
                reject({type:'restart', full:'3 response contains "You have been logged in successfully." - restarting.'}); //maybe wrong session
              } else {
                reject({type:'nonetwork', full:'Login ticket in the response from 3 is not available as name="lt" value='});
              }
            })
            .catch( err => {
              // something went wrong
              console.log('1. error: ' + err)
              reject({type:'nonetwork', full:'Getting login ticket from 3 failed: ' + err});
            });
      }
    });
  }

  isAuthenticated () {
    return !!this.session.userId;
  }

  getBalance(seamless){
    var self=this;
    return new Promise(function(resolve, reject) {
      var url = "";

      //Seamless
      if (seamless) {
        url="http://mobile.three.co.uk/account/my3/accountp";
        //var url="3detailsseamless.html";
        return self.http.get(url, {}, self.headers)
          .then(response => {
            var data = response.data, json = {'credit':{"label": "", "headings": [], "rows": [], "total": ""}, 'texts': {"label": "", "headings": [], "rows": [], "total": ""}, 'mb': {"label": "", "headings": [], "rows": [], "total": ""}, 'mins': {"label": "", "headings": [], "rows": [], "total": ""}};
            self._readBalanceSeamless(data, 0, json, false, self)
            if (json.credit && json.credit.total && json.credit.total != "") {
              resolve(json);
            } else {
              reject({type:'retrievefailure', full: 'Seamless response does not contain expected format'});
            }
          })
          .catch( err => {
            // something went wrong
            reject({type:'nonetwork', full: 'Could not connect to http://mobile.three.co.uk/account/my3/accountp'});
          });
      }

      //Password based
      url = "https://www.three.co.uk/New_My3/Account_balance?id=My3_CheckYourBalanceLink";

      console.log('3. get SSO ticket', url)
      self.http.get(url, {}, self.headers)
        .then(response => {
          var data = response.data;
          //console.log(JSON.stringify(data));
/*
          ""\r\n\r\n<html>\r\n    <head>\r\n        <title>3 Single Sign On Service</title>\r\n        <script type=\"text/javascript\">\r\n            var test = (function(cookieName) {\r\n                var cookies = document.cookie.split(';');\r\n                for (var i = 0; i < cookies.length; i++) {\r\n                    var c = cookies[i];\r\n                    var idx = c.indexOf('=');\r\n                    var x = c.substr(0, idx);\r\n                    var y = c.substr(idx + 1);\r\n                    x = x.replace(/^\\s+|\\s+$/g, '');\r\n                    if (x == cookieName) {\r\n                        return unescape(y);\r\n                    }\r\n                }\r\n                return null;\r\n            })('JSESSIONID');\r\n            if (test == null) {\r\n                self.parent.location.href = 'http://www.three.co.uk/Three_Co_uk/Cookie';\r\n            } else {\r\n                self.parent.location.href = 'https://www.three.co.uk/New_My3/Account_balance?id=My3_CheckYourBalanceLink&ticket=ST-814275-M7M60mhBWtdV5AxsoAGv';\r\n            }\r\n        </script>\r\n        \t<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />\r\n  \t<meta http-equiv=\"Content-Script-Type\" content=\"text/javascript; charset=utf-8\" />\r\n  \t<meta http-equiv=\"Content-Style-Type\" content=\"text/css; charset=utf-8\" />\r\n  \t<meta name=\"description\" content=\"My 3 account gives you all the convenience and control of your account you could ever need - both here and on your handset.\" />\r\n\r\n\r\n\t<link rel=\"stylesheet\" media=\"all\" href=\"https://www.three.co.uk/static/css/three.css\" />\r\n\t<link rel=\"stylesheet\" media=\"all\" href=\"https://www.three.co.uk/static/css/my3/my3.css\" />\r\n    <!--[if IE 8]><link rel=\"stylesheet\" media=\"all\" href=\"https://www.three.co.uk/static/css/my3/ie8HackSheet.css\" /><![endif]-->\r\n\t<!--[if IE 7]><link rel=\"stylesheet\" media=\"all\" href=\"https://www.three.co.uk/static/css/my3/ie7HackSheet.css\" /><![endif]-->\r\n\t<!--[if IE 6]><link rel=\"stylesheet\" media=\"all\" href=\"https://www.three.co.uk/static/css/my3/ie6HackSheet.css\" /><![endif]-->\r\n\r\n\r\n    <script type=\"text/javascript\" src=\"https://www.three.co.uk/static/script/my3/my3.jquery.min.js\"></script>\r\n    <script type=\"text/javascript\" src=\"https://www.three.co.uk/static/script/my3/jquery-ui-1.7.2.custom.min.js\"></script>\r\n    <script type=\"text/javascript\" src=\"https://www.three.co.uk/static/script/my3/my3-lib.js\"></script> \r\n    <script type=\"text/javascript\" src=\"js/common.js\"></script> \r\n\t<script>\r\n\tvar staticFilesAddress=\"https://www.three.co.uk/static\";\r\n\t</script>\r\n\r\n\r\n\r\n\r\n    </head>\r\n    <body class=\"P00_id\">\r\n        <div class=\"threePortlet P00_id P00_SsoGoService\">\r\n            <noscript>\r\n                <p>Login successful.</p>\r\n                <p>Click <a href=\"https://www.three.co.uk/New_My3/Account_balance?id=My3_CheckYourBalanceLink&ticket=ST-814275-M7M60mhBWtdV5AxsoAGv\" target=\"_parent\" >here</a> to access the service you requested.</p>\r\n            </noscript>\r\n        </div>\r\n        \r\n            <script type=\"text/javascript\">\r\n    window.onload = function() {\r\n        window.parent.postMessage (document.body.scrollHeight,\"*\");\r\n    };\r\n\t</script>\r\n    </body>\r\n</html>""
*/

          if (data && data.indexOf('&ticket=') > 0  ) {
            var lt = data.match(/&ticket=([^"']*)["']/);
            var token = lt[1];

            var url = "https://www.three.co.uk/New_My3/Account_balance?id=My3_CheckYourBalanceLink&ticket=" + token;

            console.log('4. get balance with SSO ticket', url)
            self.http.get(url, {}, self.headers)
              .then(res => {
                var data = res.data, json = {'credit':{"label": "", "headings": [], "rows": [], "total": ""}, 'texts': {"label": "", "headings": [], "rows": [], "total": ""}, 'mb': {"label": "", "headings": [], "rows": [], "total": ""}, 'mins': {"label": "", "headings": [], "rows": [], "total": ""}};
                self._readBalance(data, 0, json, self)
                if (json.credit && json.credit.total && json.credit.total != "") {
                  resolve(json);
                } else {
                  reject({type:'retrievefailure', full:'Balance not in expected format (using SSO ticket)'});
                }
              })
              .catch( err => {
                // something went wrong
                console.log('4. error: ' + err)
                reject({type:'nonetwork', full: 'Could not get balance with SSO ticket'});
              });
          } else {
            //console.log(data);
            console.log('3. error: no SSO ticket')
            reject({type:'nossoticket', full:'SSO ticket response does not contain &ticket='});
          }
        })
        .catch( err => {
          // something went wrong
          console.log('3. error: ' + err)
          reject({type:'nonetwork', full:'Could not get SSO ticket'});
        });

    });
  }

}
