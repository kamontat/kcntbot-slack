import { App } from "@slack/bolt";
import { Debugger } from "debug";

import * as firebase from "firebase/app";

export type SetupReg = (opts: { app: App; firebase: firebase.app.App; logger: Debugger }) => void;

export class Setup {
  constructor(private app: App, private firebase: firebase.app.App) {}

  register(logger: Debugger, setup: SetupReg) {
    setup({ app: this.app, firebase: this.firebase, logger });
  }
}
