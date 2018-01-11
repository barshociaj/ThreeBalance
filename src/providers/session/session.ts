import { Injectable } from '@angular/core';

/*
  Generated class for the SessionProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SessionProvider {
  id: String;
  userId: String;

  constructor() {
  }

  create (sessionId, userId) {
    this.id = sessionId;
    this.userId = userId;
  }

  destroy () {
    this.id = null;
    this.userId = null;
  }

}
