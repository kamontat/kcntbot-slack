import debug from "debug";

export const namespace_1 = "kcnt";
export const namespace_2 = "bot";

export class Logger {
  private static INSTANCE: Logger;
  public static get(enable = true): Logger {
    if (!Logger.INSTANCE) Logger.INSTANCE = new Logger(enable);
    return Logger.INSTANCE;
  }

  private log: debug.Debugger;

  constructor(enable: boolean) {
    const namespace = `${namespace_1}:${namespace_2}`;

    this.log = debug(namespace);
    this.log.log = console.log.bind(console);

    if (enable) debug.enable(`${namespace_1}:*`);
  }

  onApp(appName: string) {
    return this.log.extend(appName);
  }
}
