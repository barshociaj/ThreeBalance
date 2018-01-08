import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { LocalstorageProvider } from '../localstorage/localstorage';

/*
  Generated class for the PhonesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class PhonesProvider {
  phones: any;

  constructor(public localstorage: LocalstorageProvider) {
    this.phones = localstorage.getObject('accounts');
    if(!(this.phones instanceof Array)) this.phones = [];
  }

  isEmpty() {
    return (this.phones.length == 0);
  }

  all() {
    return this.phones;
  }

  put(phoneId, newObject) {
    //search both ID and user values
    for(var i=0; i<this.phones.length; i++){
      if (this.phones[i].id == phoneId || this.phones[i].user == phoneId) {
        this.phones[i] = newObject;
        this.localstorage.setObject('accounts', this.phones);
        return;
      }
    }
  }

  get(phoneId) {
    //search both ID and user values
    for(var i=0; i<this.phones.length; i++){
      if (this.phones[i].id == phoneId || this.phones[i].user == phoneId) {
        return this.normalizeValues(this.phones[i]);
      }
    }
    return null;
  }

  getFirst() {
    return this.phones.length > 0 ? this.phones[0].id : null;
  }

  remove(phoneId) {
    //search both ID and user values
    for(var i=0; i<this.phones.length; i++){
      if (this.phones[i].id == phoneId || this.phones[i].user == phoneId) {
        this.phones.splice(i,1);
        this.localstorage.setObject('accounts', this.phones);
        return true;
      }
    }
    return false;
  }

  normalizeValues(phone) {
    var values = ['credit', 'mins', 'texts', 'mb'];
    for (var i = 0; i < values.length; i++) {
      if (!phone.values[values[i]]) {
        phone.values[values[i]] = {
          "label": "",
          "headings": [],
          "rows": [],
          "total": ""
        }
      }
    }
    return phone;
  }

  add(credentials){
    var newPhone = {
      "id": (Math.round(Math.random()*1000000)).toString(),
      "user": credentials.username,
      "pw": credentials.password,
      "seamless": credentials.seamless || false,
      "status": "",
      "lastupdated": "",
      "values": {}
    }
    newPhone = this.normalizeValues(newPhone);
    this.phones.push(newPhone);
    this.localstorage.setObject('accounts', this.phones);
    return newPhone.id;
  }

  getIdOnSuccessfulLogin(credentials) {
    var phone = this.get(credentials.username);
    if (phone) {
      if (phone.seamless && credentials.password) {
        //convert seamless user to password based
        phone.seamless = false;
      }
      if (!phone.seamless) phone.pw = credentials.password;
      this.put(phone.id, phone)
    }
    var id = phone ? phone.id : this.add(credentials);
    return id;
  }

}
