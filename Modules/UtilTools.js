class UtilTools {
    constructor() {


    }

    updateListener(bot) {
        this.bot = bot;
        var self = this;    //解决回调this问题
        bot.on("newMsg", newMsgHandle);

        function newMsgHandle(message) {
            if (!message.text) return;
            var arr = message.text.split(self.bot.Me.result.username);
            var params = message.text.split(" ");
            switch (params[0]) {
                case "/ping":
                case "/ping@" + self.bot.Me.result.username:
                    self.bot.apiMethod("sendMessage", { chat_id: message.chat.id, text: "pong" });
                    break;
                default:
                    break;
            }
        }
    }
}
module.exports = UtilTools;