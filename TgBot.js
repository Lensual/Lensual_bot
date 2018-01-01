const https = require("https");
const querystring = require('querystring');
const EventEmitter = require('events');
const url = require("url");
const SocksProxyAgent = require("socks-proxy-agent");

const apiUrl = "https://api.telegram.org/bot";

class TgBot extends EventEmitter {
    constructor(token) {

        /****************
        属性变量
        *****************/

        super();
        this.token = token;
        this.proxy = "";
        this.Me = {};
        this.Status = "Down";
    }

    /****************
    高级方法
    *****************/

    //Login
    async LoginSync() {
        var json = await this.apiMethod("getMe");
        if (json && json.ok) {
            this.Me = json;
            return json;
        }
        return false;
    }

    //启用Bot
    async Start(updateMethod) {
        if (this.Status === "UP") return;
        switch (updateMethod.method) {
            case "polling":
                //获取最后update_id
                var offset = 0;
                var lastUpdate = await this.apiMethod("getUpdates", { offset: -1, timeout: 0 });
                if (lastUpdate.result.length) offset = lastUpdate.result[0].update_id + 1;
                //开始工作
                this.Status = "UP";
                TgBot.updatePolling(this, offset, updateMethod.timeout);
                break;
            case "webhook":
                break;
            default:
                //err
                break;
        }
    }

    //禁用Bot
    Stop() {
        this.Status = "Down";
    }

    //加载模块
    LoadModule(module) {
        var m = new module();
        m.updateListener(this);
    }


    /****************
    Helper
    *****************/

    //消息更新轮询
    static async updatePolling(bot, offset, timeout) {
        var updates = await bot.apiMethod("getUpdates", { offset: offset, timeout: timeout });
        if (updates.ok && bot.Status === "UP") {
            //newUpdates事件
            bot.emit("newUpdates", updates);
            //newUpdate事件
            for (var i = 0; i < updates.result.length; i++) {
                bot.emit("newUpdate", updates.result[i]);
                if (updates.result[i].message) {
                    //newMsg Event
                    bot.emit("newMsg", updates.result[i].message);
                } else if (updates.result[i].edited_message) {
                    //newEditedMsg Event
                    bot.emit("newEditedMsg", updates.result[i].edited_message);
                } else if (updates.result[i].channel_post) {
                    //newChnPost Event
                    bot.emit("newChnPost", updates.result[i].channel_post);
                }
            }
            //更新offset
            if (updates.result.length > 0) {
                for (var i = 0; i < updates.result.length; i++) {
                    if (updates.result[i].update_id > offset) offset = updates.result[i].update_id;
                }
                offset++;
            }
        }
        if (bot.Status === "UP") setImmediate(TgBot.updatePolling, bot, offset, timeout);
    }

    //http Helper
    httpPost(method, callback, apiParams = {}, inputFiles) {
        var opts = url.parse(apiUrl + this.token + "/" + method);
        //proxy TODO:http https
        if (this.proxy) {
            opts.agent = new SocksProxyAgent(this.proxy, true);
        }
        opts.method = "POST";
        if (inputFiles) {
            opts.headers = { 'Content-Type': 'multipart/form-data; boundary="----boundary"' };
            opts.path += "?" + querystring.stringify(apiParams);
        } else {
            var postData = querystring.stringify(apiParams);
            opts.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            };
        }
        var req = https.request(opts, function (res) {
            var rawData = "";
            res.on("data", function (chunk) { rawData += chunk; });
            res.on("end", function () {
                callback(JSON.parse(rawData));
            });
        });
        req.on('error', (e) => {
            console.error(`请求遇到问题: ${e.message}`);
        });
        //发送数据
        if (inputFiles) {
            for (var i = 0; i < inputFiles.length; i++) {
                req.write("------boundary\r\n");
                req.write(`Content-Disposition: form-data; name="photo"; filename="file${i}"\r\n`);
                req.write("Content-Type: application/octet-stream\r\n");
                req.write("Content-Transfer-Encoding: binary\r\n\r\n");
                req.write(inputFiles[i]);
                req.write("\r\n------boundary--");
            }
        } else {
            req.write(postData);
        }
        req.end();
    }

    //API方法
    async apiMethod(method, args, inputFiles) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.httpPost(method, function (json) {
                resolve(json);
            }, args, inputFiles);
        });
    }

}

module.exports = TgBot;