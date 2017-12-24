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
        event.on("newUpdate", newUpdateHandle);
    }
    newUpdateHandle(update) {

    }
}
module.exports = qqModule;