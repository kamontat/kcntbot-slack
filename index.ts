import { App, LogLevel, Logger as SlackLogger } from "@slack/bolt";
import { Setup } from "./src/utils/setup";
import { Logger } from "./src/utils/logger";
import weightApp from "./src/app/weight";
import twoWKMoneyApp from "./src/app/2wkmoney";
import rudeApp from "./src/app/rudeword";
import discountApp from "./src/app/discount";

import * as firebase from "firebase/app";
// import "firebase/performance";

// setup environment
require("dotenv").config();

const isProd = process.env.NODE_ENV === "production";
const logger = Logger.get(!isProd);

// Initialize Firebase
const firebaseApp = firebase.initializeApp({
  apiKey: process.env.FIREBASE_APIKEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
});

// Initialize slack application
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.DEBUG,
  logger: new (class Logger implements SlackLogger {
    private level: LogLevel;
    private core = logger.onApp("core");

    constructor() {
      this.level = LogLevel.DEBUG;
    }

    debug(...msg: any[]) {
      if (
        this.level === LogLevel.ERROR ||
        this.level === LogLevel.WARN ||
        this.level === LogLevel.INFO ||
        this.level === LogLevel.DEBUG
      )
        this.core.extend(LogLevel.DEBUG)(msg);
    }
    info(...msg: any[]) {
      if (this.level === LogLevel.ERROR || this.level === LogLevel.WARN || this.level === LogLevel.INFO)
        this.core.extend(LogLevel.INFO)(msg);
    }
    warn(...msg: any[]) {
      if (this.level === LogLevel.ERROR || this.level === LogLevel.WARN) this.core.extend(LogLevel.WARN)(msg);
    }
    error(...msg: any[]) {
      if (this.level === LogLevel.ERROR) this.core.extend(LogLevel.ERROR)(msg);
    }
    setName(name: string) {
      this.core = this.core.extend(name);
    }
    setLevel(level: LogLevel) {
      this.level = level;
    }
    getLevel() {
      return this.level;
    }
  })(),
});

// firebase.performance();

// Setup application features
const setup = new Setup(app, firebaseApp);
setup.register(logger.onApp("weight"), weightApp);
setup.register(logger.onApp("2wk_money"), twoWKMoneyApp);
setup.register(logger.onApp("rude"), rudeApp);
setup.register(logger.onApp("discount"), discountApp);

// Start server
(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  logger.onApp("core")("⚡️ Bolt app is running!");
})();
