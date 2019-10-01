import { SetupReg } from "../../utils/setup";
import { readFileSync } from "fs";
import { resolve } from "path";

const __main: SetupReg = async ({ app, firebase, logger }) => {
  logger("Start setup rude db apps");

  logger("loading... rude files");
  const defaultTH = readFileSync(resolve("src/app/rudeword/db/th.txt"), { encoding: "utf8" }).split("\n");
  const defaultEN = readFileSync(resolve("src/app/rudeword/db/en.txt"), { encoding: "utf8" }).split("\n");

  const database = {
    th: defaultTH,
    en: defaultEN,
  };

  logger("fetching... data from firestore");
  const db = await firebase
    .firestore()
    .collection("database")
    .doc("rudes")
    .get();

  if (db.exists) {
    logger("merging... data source");
    const obj = db.data() as { en: string[]; th: string[] };

    database.th = defaultTH;
    if (obj.th.length > 0) database.th.push(...obj.th);

    database.en = defaultEN;
    if (obj.en.length > 0) database.en.push(...obj.en);
  } else {
    logger.extend("error")("data source is not found");
  }

  logger(`Thai database size is ${database.th.length}`);
  logger(`English database size is ${database.en.length}`);

  app.message(new RegExp(`(${database.th.join("|")})`), ({ say, message }) => {
    say({ text: "ทำไมหยาบคายแบบนี้ :anger:", thread_ts: message.ts });
  });

  app.message(new RegExp(`(${database.en.join("|")})`, "i"), ({ say, message }) => {
    say({ text: "Why you so rude !! :anger:", thread_ts: message.ts });
  });

  firebase
    .firestore()
    .collection("database")
    .doc("words")
    .onSnapshot(_ => {
      logger("receive new data from firestore; you must refresh server to apply changes");
    });
};

export default __main;
