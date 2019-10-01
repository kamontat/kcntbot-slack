import * as fb from "firebase";

export interface DBOjectValueUsed {
  value: number;
  timestamp: fb.firestore.Timestamp;
}

export interface DBOjectValue {
  start: number;
  used: DBOjectValueUsed[];
}

export interface DBObject {
  [month: number]: DBOjectValue;
}
