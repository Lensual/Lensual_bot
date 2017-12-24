const TgBot = require("./TgBot");
var config = require("./config");

var bot = new TgBot(config.token);
bot.proxy = config.proxy;

main();
async function main() {
    //验证token
    if (!await bot.LoginSync()) {
        console.log("Login Error");
        process.exit(1);
    }
    console.log("Login OK");
    console.log(bot.Me);

    //接收消息事件
    bot.event.on("newUpdate", function (update) {
        console.log(update);
    });
    bot.Start(config.updateMethod);
    console.log("Bot Working");
}

//阻止退出
alwaysSleep(1000);
function alwaysSleep(timeout) {
    setTimeout(alwaysSleep, timeout, timeout);
}