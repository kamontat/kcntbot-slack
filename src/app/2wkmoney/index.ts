import { SetupReg } from "../../utils/setup";
import moment from "moment";
import { DBOjectValue } from "./models/dbobject";
import * as fb from "firebase";

const __main: SetupReg = ({ app, logger, firebase }) => {
  logger("Start setup 2wk apps");

  // 2wk-money left - show how much money left
  // ยังไม่ถึงเวลานะ.. อีก xx วัน
  // เหลือเงินอยู่อีก xx บาท
  // 2wk-money start (\d) - มีทั้งหมดกี่บาท
  // 2wk-money used (\d) .* - ใช้ไปแล้ว xx บาท กับ ...
  app.command("/2wk-money", async ({ ack, say, command }) => {
    const now = moment();

    const total = now.daysInMonth();
    const month = now.month();
    const current = now.day();
    const waitday = total - current;

    logger(`date information: month=${month}, day=${current}; current month has ${total} days`);
    logger("%O", command);

    const texts = command.text.split(" ");
    const subcommand = texts.shift();
    if (!subcommand) return ack("ทำไมไม่ใช้ subcommand ห้ะ");

    logger(`subcommand is ${subcommand}`);
    try {
      switch (subcommand) {
        case "left":
          ack("เช็คอยู่ อย่าเร่ง");
          const value = await firebase
            .firestore()
            .collection("2wk-money")
            .doc(month.toString())
            .get(); // previous month

          if (value.exists) {
            const data = value.data() as DBOjectValue;
            const left = data.used.reduce((p, c) => p - c.value, data.start);
            if (left <= 0) return say(`ตอนนี้ไม่มีเงินแล้วว รอไปอีกราวๆ ${waitday} วัน`);

            const leftMsg = left.toFixed(2);

            logger(`month=${month} has ${data.start} baht; now has ${leftMsg} left`);
            return say(`ตอนนี้เงินเหลืออีก ${leftMsg} บาท`);
          } else {
            return say(`หาข้อมูลไม่เจองะ.. อาจจะเป็นเพราะลืมใส่ ไม่ก็ยังไม่ถึงเวลา ปล เหลืออีก ${waitday} วัน`);
          }
        case "start":
          ack("เก็บข้อมูลอยู่ อย่าเร่ง");
          const money = parseFloat(texts.shift() || "-");
          if (isNaN(money)) return ack("หาตัวเลขไม่เจอ ใส่ใหม่ เอาดีๆนะ จุ๊บๆ");

          const data: any = {};
          data[month.toString()] = {
            start: money,
            used: [],
          };

          await firebase
            .firestore()
            .collection("2wk-money")
            .add(data);

          return say(`ใส่ข้อมูลเรียบร้อย เดือนนี้เหลือเงิน ${money} บาท`);
        case "used":
          ack("เก็บข้อมูลอยู่ อย่าเร่ง");
          const money2 = parseFloat(texts.shift() || "-");
          if (isNaN(money2)) return ack("หาตัวเลขไม่เจอ ใส่ใหม่ เอาดีๆนะ จุ๊บๆ");

          await firebase
            .firestore()
            .collection("2wk-money")
            .doc(month.toString())
            .update({
              used: fb.firestore.FieldValue.arrayUnion({
                value: money2,
                timestamp: fb.firestore.Timestamp.fromDate(new Date()),
              }),
            });

          return say(`ใส่ข้อมูลเรียบร้อย ใช้ไป ${money2} บาท`);
        default:
          return ack(`ใส่ข้อมูลไม่ตรงกับที่ต้องการโว้ยยย เอาใหม่ ฉันไม่ต้องการ ${subcommand}`);
      }
    } catch (err) {
      logger.extend("error")("exception: %O", err);
      return ack(`พังหมดแล้ววว ใช่ไหมม.. รักที่เคยหวาน; ${err}`);
    }
  });
};

export default __main;
