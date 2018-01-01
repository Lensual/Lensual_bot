const TgBot = require("./TgBot");
const fs = require("fs");
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

    //接收消息事件 //TO Delete
    bot.on("newUpdate", function (update) {
        //复读机模式
        //bot.apiMethod("sendMessage", { chat_id: update.message.chat.id, text: update.message.text });
    });
    //加载模块
    var modsPath = "./Modules/";
    var mods = fs.readdirSync(modsPath);
    for (var i = 0; i < mods.length; i++) {
        bot.LoadModule(require(modsPath + mods[i]));
    }
    //开始工作
    bot.Start(config.updateMethod);
    console.log("Bot Working");
}

//阻止退出
alwaysSleep(1000);
function alwaysSleep(timeout) {
    setTimeout(alwaysSleep, timeout, timeout);
}