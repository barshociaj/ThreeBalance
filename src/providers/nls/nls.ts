import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

/*
  Generated class for the NlsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class NlsProvider {
  en:Object;

  constructor() {
    this.en = {
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
    }

  }

}
