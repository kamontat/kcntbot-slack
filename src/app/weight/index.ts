import { SetupReg } from "../../utils/setup";
import { DBObject } from "./models/dbobject";

import * as fb from "firebase";

// import ms from "ms";
import moment from "moment";

import "firebase/firestore";
moment.locale("th");

const asBlock = <T>(s: string, custom: T) => {
  const data = {
    text: s,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: s,
        },
      },
    ],
    mrkdwn: true,
  };

  return Object.assign(data, custom);
};

const formatWeight = (data: DBObject) => {
  const first = data.list[0];

  const current = data.list[data.list.length - 1 < 0 ? 0 : data.list.length - 1];
  const previous = data.list[data.list.length - 2 < 0 ? 0 : data.list.length - 2];

  let result = `จากข้อมูลที่มี... พบว่า ปัจจุบัน น้ำหนักอยู่ที่ ${current.value} กก. ซึ่งอัพเดตเมื่อ ${moment
    .unix(current.timestamp.seconds)
    .fromNow()}\n`;

  if (data.list.length > 1) {
    const percent = ((current.value - previous.value) / previous.value) * 100;
    result += `ซึ่ง \`${percent < 0 ? "ผอมลง" : "อ้วนขึ้น"}\` _${percent.toFixed(2)}%_ จากครั้งที่แล้วที่น้ำหนัก *${
      previous.value
    }* กก. และอัพเดตเมื่อ ${moment.unix(previous.timestamp.seconds).fromNow()}\n`;
  }

  if (data.list.length > 2) {
    const percent = ((current.value - first.value) / first.value) * 100;
    result += `และ \`${percent < 0 ? "ผอมลง" : "อ้วนขึ้น"}\` _${percent.toFixed(2)}%_ จากน้ำหนักเริ่มต้น *${
      first.value
    }* กก. เมื่อ ${moment.unix(first.timestamp.seconds).fromNow()}`;
  }

  return result;
};

const __main: SetupReg = ({ app, firebase, logger }) => {
  logger("Start setup weight apps");

  app.message(/(น้ำหนัก|หนัก|weight)/i, async ({ say, message }) => {
    say(
      asBlock("คุยเรื่องน้ำหนักหรออ.. ถ้าอยากรู้น้ำหนักลอง tag คนนั้นดูสิ :) แต่ฉันหนักเป็นตันเลยนะ", {
        thread_ts: message.ts,
      }),
    );
  });

  // get weight from database
  app.message(/<@(.*)> (น้ำหนัก|หนัก|weight).*/i, async ({ say, message, context }) => {
    logger("search user weight");

    const userID = context.matches[1];
    try {
      const response = await app.client.users.info({ token: context.botToken, user: userID });

      if (response.ok) {
        const user = (response.user as any).name;

        const weight = await firebase
          .firestore()
          .collection("weights")
          .doc(user)
          .get();

        if (weight.exists) {
          const data = weight.data() as DBObject;
          const msg = formatWeight(data);
          say(asBlock(msg, { thread_ts: message.ts }));

          logger("found weight, sent the request back");
        } else {
          const msg = `cannot found any weight for user ${user}`;
          logger.extend("error")(msg);
        }
      } else {
        const msg = `cannot get username of ${message.user} because ${response.error}`;
        logger.extend("error")(msg);
      }
    } catch (err) {
      logger.extend("error")("%O", err);
    }
  });

  // set weight to database
  app.message(/(\d*\.?\d*) ?(น้ำหนัก|หนัก|weight) ?(\d*\.?\d*)/i, async ({ say, message, context }) => {
    // logger("the regex return %O", context.matches);

    const numbers = (context.matches as Array<string | undefined>).reduce(
      (p, c) => {
        if (c) {
          const i = parseFloat(c);
          if (!isNaN(i)) p.push(i);
        }
        return p;
      },
      [] as number[],
    );

    if (numbers.length > 1) {
      logger.extend("error")("too many number in context");
      return say(asBlock("ใส่ตัวเลขบ่อยไปละ ไม่รู้จะเอาค่าไหนดีเลยย", { thread_ts: message.ts }));
    } else if (numbers.length < 1) {
      logger.extend("error")("cannot parse weight number from context");
      return say({ text: "อย่าลืมใส่น้ำหนักสิ", thread_ts: message.ts });
    }

    const weightNumber = numbers.pop()!;

    try {
      const response = await app.client.users.info({ token: context.botToken, user: message.user });

      if (response.ok) {
        const user = (response.user as any).name;

        await firebase
          .firestore()
          .collection("weights")
          .doc(user)
          .update({
            list: fb.firestore.FieldValue.arrayUnion({
              value: weightNumber,
              timestamp: fb.firestore.Timestamp.fromDate(new Date()),
            }),
          });

        say({ text: "ได้ข้อมูลแล้วจ้าาา~", thread_ts: message.ts });
      } else {
        const msg = `cannot get username of ${message.user} because ${response.error}`;
        logger.extend("error")(msg);
      }
    } catch (err) {
      logger.extend("error")("%O", err);
    }
  });
};

export default __main;
