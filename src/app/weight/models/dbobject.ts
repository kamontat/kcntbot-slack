export interface DBObjectValue {
  value: number;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface DBObject {
  list: Array<DBObjectValue>;
}
