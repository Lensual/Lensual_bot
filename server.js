const TgBot = require("./TgBot");
const fs = require("fs");
var config = require("./config");

var bot = new TgBot(config.token);
bot.proxy = config.proxy;

main();
async function main() {
    //��֤token
    if (!await bot.LoginSync()) {
        console.log("Login Error");
        process.exit(1);
    }
    console.log("Login OK");
    console.log(bot.Me);

    //������Ϣ�¼� //TO Delete
    bot.on("newUpdate", function (update) {
        //������ģʽ
        //bot.apiMethod("sendMessage", { chat_id: update.message.chat.id, text: update.message.text });
    });
    //����ģ��
    var modsPath = "./Modules/";
    var mods = fs.readdirSync(modsPath);
    for (var i = 0; i < mods.length; i++) {
        bot.LoadModule(require(modsPath + mods[i]));
    }
    //��ʼ����
    bot.Start(config.updateMethod);
    console.log("Bot Working");
}

//��ֹ�˳�
alwaysSleep(1000);
function alwaysSleep(timeout) {
    setTimeout(alwaysSleep, timeout, timeout);
}