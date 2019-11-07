import { SetupReg } from "../../utils/setup";

const findArrayIndex = (logger: debug.Debugger, name: string, arr: RegExpMatchArray | null, index: number) => {
  if (!arr || arr.length < 1) {
    logger.extend("warn")(`cannot get ${name} from slack message`);
    return "undefined";
  }

  const value = arr[index];
  if (value) return value;

  logger.extend("warn")(`${name} value is '${value}' which is not matches`);
  return "undefined";
};

// {download, discount, originalPrice, platform, currentPrice}
const only = (data: {platform: string, download: number, discount: number, originalPrice: number, currentPrice: number}) => {
  if (data.download < 1000) return `download value is only ${data.download}`;

  return undefined;
}

const __main: SetupReg = ({ app, logger }) => {
  logger("Start setup discount apps");

  app.message(/(\d)% off/i, ({ context, message }) => {
    const generalChannelID = "CNXBMJQ72";

    const text = message.text!;
    const appName = findArrayIndex(logger, "app name", text.match(/\] ([^\[\]–]+) /), 1);
    const platform = findArrayIndex(logger, "platform", text.match(/\((\w+)\)/), 1);
    const category = findArrayIndex(logger, "category", text.match(/Category: <https.*\|(\w+)>/), 1);

    const __id = findArrayIndex(logger, "appagg id", text.match(/https.*-(\d+)\.html/), 1);
    const link = `https://appagg.com/go/${__id}`;

    const appAggLink = findArrayIndex(logger, "AppAgg link", text.match(/https.*html/), 0);

    const __priceRegex = /Price\: \$?(\w+.?\w+) \$?(\w+.?\w+)/;

    const originalPrice = parseFloat(findArrayIndex(logger, "original price", text.match(__priceRegex), 2));
    const originalPriceMsg = originalPrice.toFixed(2);

    const __currentPrice = findArrayIndex(logger, "discounted price", text.match(__priceRegex), 1);
    const currentPrice = __currentPrice === "Free" ? 0 : parseFloat(__currentPrice);
    const currentPriceMsg = __currentPrice === "Free" ? "FREE" : currentPrice.toFixed(2);

    const discount = parseFloat(findArrayIndex(logger, "discount percent", text.match(/\[(\d+)%/), 1)); // discount percent
    const discountMsg = discount.toFixed(2);

    const rating = parseInt(findArrayIndex(logger, "rating", text.match(/Rating: (\d+)/), 1));

    // [1] -> download counter from appAgg website
    // [2] -> rating counter from app store / play store
    const download = parseInt(findArrayIndex(logger, "download", text.match(/Downloads: (\d+) \+ (\d+)/), 2));
    
    const errorMsg = only({download, discount, originalPrice, platform, currentPrice});
    if (!errorMsg) {
      app.client.chat.postMessage({
        text: ``,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<!here> <${link}|${appName}> (${platform}) is discounted \`${discountMsg}%\`.\n`,
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Price*: \n  ${originalPriceMsg} => ${currentPriceMsg}`,
              },
              {
                type: "mrkdwn",
                text: `*Category*: \n  ${category}`,
              },
              {
                type: "mrkdwn",
                text: `*Rating*: \n  ${rating}`,
              },
              {
                type: "mrkdwn",
                text: `*Download*: \n  ${download}`,
              },
              {
                type: "mrkdwn",
                text: `*AppAgg*: \n  <${appAggLink}|link>`,
              },
            ],
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `I received ${platform} application discounted from #news-app channel`,
              },
            ],
          },
        ],
        token: context.botToken,
        channel: generalChannelID,
        mrkdwn: true,
      });
    } else {
      logger(`Ignore ${appName} because ${errorMsg}`);
    }
  });
};

export default __main;
