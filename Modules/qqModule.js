const { QQ } = require('qq-bot-rebown');
class qqModule {
    constructor() {
        this.Accounts = [];
    }
    //添加新的用户
    async newAccount(message, callback) {
        var qq = new QQ({
            qrcodePath: "\\\\.\\NUL",
            cookiePath: "\\\\.\\NUL"
        });
        qq.on("qr", async (path, qrcode) => {
            var r = await this.bot.apiMethod("sendPhoto", {
                chat_id: message.chat.id,
                //photo: qrcode,
                reply_to_message_id: message.message_id
            }, [qrcode]);
        });
        qq.on("msg", (msg) => {
            console.log(JSON.stringify(msg));
        });
        qq.on("buddy", (msg) => {
            qq.sendBuddyMsg(msg.id, `Hello, ${msg.name}`);
        });
        qq.run();
        this.Accounts.push(qq);
        callback(qq);
    }
    //注册tg消息监听器
    updateListener(bot) {
        this.bot = bot;
        var self = this;    //解决回调this问题
        bot.on("newMsg", newMsgHandle);

        //新消息句柄
        function newMsgHandle(message) {
            if (!message.text) return;
            var params = message.text.split(" ");
            if (params[0] === "/qq") {
                switch (params[1]) {
                    case "add":
                        //qrcode
                        self.newAccount(message, function (qq) {
                            qq.Master = message.from.id;
                            console.log(qq.Master);
                        });
                        break;
                    default:
                        break;
                }
            }
        }
    }
}
module.exports = qqModule;