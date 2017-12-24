const { QQ } = require('qq-bot-rebown');
class qqModule {
    constructor() {
        this.Accounts = [];
    }
    newAccount(callback) {
        var qq = new QQ({});    //todo options
        qq.on('msg', (msg) => {
            console.log(JSON.stringify(msg));
        });
        qq.on('buddy', (msg) => {
            qq.sendBuddyMsg(msg.id, `Hello, ${msg.name}`);
        });
        qq.run();
        this.Accounts.push(qq);
    }
    updateListener(event) {
        event.on("newUpdate", this.newUpdateHandle);
    }
    newUpdateHandle(update) {
        var params = update.message.text.split(" ");
        if (params[0] === "/qq") {
            switch (params[1]) {
                case "add":
                    
                    break;
                default:
                    break;
            }
        }
    }
}
module.exports = qqModule;