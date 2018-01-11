import { Injectable } from '@angular/core';

/*
  Generated class for the CalllogProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.

  Also check: https://github.com/atul2889/call-log-call-history-for-Ionic---v2
*/
@Injectable()
export class CalllogProvider {

  constructor() {
  }

  private callCost(n,d){
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

  private enhanceAndFilterList (calllog) {
    var rows = calllog.rows;
    var outgoing = [],n;
    //rows = [{date:new Date(), number:'08784932764', duration: 123, type: '2'}];

    if (rows) {
      rows.forEach((row, key) => {
        if (row.type == "2") {
          n = row.number;
          n = n.replace(/^\+44/,"0").replace(/^0044/,"0");
          row.number = n;

          row.cost = this.callCost(n,row.duration);

          if (row.cost === false) row.cost = "";
          else row.cost = "£" + (row.cost/100).toFixed(2);
          outgoing.push(row);
        }
      });
    }
    return outgoing;
  }

  private smsCost(n){
    /* TODO: fix & improve
     *
     * Picture or Video msg - 19.8p;
     * Text abroad: 25.2p
     */
    if (n.substring(0,1) == "+" || n.substring(0,2) == "00") return 25.2; //international sms most probable scenario
    return 2;
  }

  private enhanceAndFilterListSms (smslog) {
    var rows = smslog.rows;
    var outgoing = [],n;
    //rows = [{date:new Date(), address:'08784932764'}];

    if (rows) {
      rows.forEach((row, key) => {
        n = row.address;
        n = n.replace(/^\+44/,"0").replace(/^0044/,"0");
        row.address = n;

        row.cost = this.smsCost(n);

        if (row.cost === false) row.cost = "";
        else row.cost = "£" + (row.cost/100).toFixed(2);
        outgoing.push(row);
      });
    }
    return outgoing;
  }

  private enhanceAndFilterUsageData (datalog) {
    if (!datalog || !datalog.received) return {cost:""};

    datalog.mb = Math.round((datalog.received + datalog.transmitted) / 1024 / 1024);
    datalog.cost = datalog.mb;

    if (datalog.cost === false) datalog.cost = "";
    else datalog.cost = "£" + (datalog.cost/100).toFixed(2);

    return datalog;
  }


  list () {
    var self = this;
    return new Promise(function(resolve, reject) {

      //BEGIN: Browser test
      if (!(window as any).plugins) {
        console.log('CallLog plugin missing, running in a browser? (calls)');
        //send test data
        resolve(self.enhanceAndFilterList({"rows":[
          {"new":0,"duration":122,"number":"02392152343","type":2,"date":1414689331075,"cachedNumberLabel":0,"cachedNumberType":0}
          ,{"new":0,"duration":0,"number":"+447763105236","type":2,"date":1414689259467,"cachedNumberLabel":0,"cachedNumberType":0}
          ,{"new":0,"duration":12,"number":"0845135236","type":2,"date":1414689259567,"cachedNumberLabel":0,"cachedNumberType":0}
          ,{"new":0,"duration":19,"number":"07763105236","type":2,"date":1414689259467,"cachedNumberLabel":0,"cachedNumberType":0}
          ,{"new":0,"duration":319,"number":"0845135236","type":2,"date":1414689259567,"cachedNumberLabel":0,"cachedNumberType":0}
        ]}
        ))
      }
      //END: Browser test
      var CallLogPlugin = (window as any).plugins.calllog;
      CallLogPlugin.list(null, function(result){
        resolve( self.enhanceAndFilterList(result) );
        console.log('Call list result came:' + JSON.stringify(result))
      });

    });
  }

  listSms () {
    var self = this;
    return new Promise(function(resolve, reject) {

      if (!(window as any).plugins) {
        console.log('CallLog plugin missing, running in a browser? (sms)');
        //send test data
        resolve(self.enhanceAndFilterListSms({"rows":[
          {"new":0,"duration":122,"number":"02392152343","type":2,"date":1414689331075,"cachedNumberLabel":0,"cachedNumberType":0}
          ,{"new":0,"duration":0,"number":"+447763105236","type":2,"date":1414689259467,"cachedNumberLabel":0,"cachedNumberType":0}
          ,{"new":0,"duration":12,"number":"0845135236","type":2,"date":1414689259567,"cachedNumberLabel":0,"cachedNumberType":0}
          ,{"new":0,"duration":19,"number":"00447763105236","type":2,"date":1414689259467,"cachedNumberLabel":0,"cachedNumberType":0}
          ,{"new":0,"duration":319,"number":"0845135236","type":2,"date":1414689259567,"cachedNumberLabel":0,"cachedNumberType":0}
        ]}
        ))
      }
      //END: Browser test
      var CallLogPlugin = (window as any).plugins.calllog;
      CallLogPlugin.listSms(null, function(result){
        //console.log(result.rows[0]);
        resolve( self.enhanceAndFilterListSms(result) );
        console.log('Sms result came:' + JSON.stringify(result));
      });

    });
  }

  listData () {
    var self = this;
    return new Promise(function(resolve, reject) {

      //BEGIN: Browser test
      if (!(window as any).plugins) {
        console.log('CallLog plugin missing, running in a browser? (data)');
        //send test data
        resolve(self.enhanceAndFilterUsageData({
          "received": 3423234,
          "transmitted": 3423234,
          "elapsedRealtime": 123,
          "uptimeMillis": 12314124
        }
        ))
      }
      //END: Browser test
      var CallLogPlugin = (window as any).plugins.calllog;
      CallLogPlugin.dataUsage(null, function(result){
        resolve( self.enhanceAndFilterUsageData(result) );
        console.log('Data usage result came:' + JSON.stringify(result))
      });

    });
  }

  myNumber () {
    return new Promise(function(resolve, reject) {

      //BEGIN: Browser test
      if (!(window as any).plugins) {
        reject(null)
      }
      //END: Browser test
      var CallLogPlugin = (window as any).plugins.calllog;
      CallLogPlugin.myNumber(null, function(result){
        resolve( result );
        console.log('My number:' + result)
      }, function(err){
        reject(err);
        console.log('Phone number not available:' + err)
      });


    });
  }


}
