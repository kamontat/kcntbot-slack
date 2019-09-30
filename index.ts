import { App } from "@slack/bolt";
import { Setup } from "./src/utils/setup";
import { Logger } from "./src/utils/logger";
import weightApp from "./src/app/weight";
import twoWKMoneyApp from "./src/app/2wkmoney";

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
});

// firebase.performance();

// Setup application features
const setup = new Setup(app, firebaseApp);
setup.register(logger.onApp("weight"), weightApp);
setup.register(logger.onApp("2wk_money"), twoWKMoneyApp);

// Start server
(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
