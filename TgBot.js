function TgBot(token) {
    const https = require("https");
    const querystring = require('querystring');
    const EventEmitter = require('events');
    const url = require("url");
    const SocksProxyAgent = require("socks-proxy-agent");

    const apiUrl = "https://api.telegram.org/bot";

    /****************
    属性变量
    *****************/

    thisBot = this;
    this.token = token;
    this.proxy = "";
    this.Me = {};
    this.Status = "Down";
    this.event = new EventEmitter();

    /****************
    高级方法
    *****************/

    //Login
    this.LoginSync = async function () {
        var json = await thisBot.apiMethod("getMe");
        if (json && json.ok) {
            thisBot.Me = json;
            return json;
        }
        console.log(json);
        return false;
    }

    //启用Bot
    this.Start = async function (updateMethod) {
        if (thisBot.Status === "UP") return;
        switch (updateMethod.method) {
            case "polling":
                //获取最后update_id
                var lastUpdate = await thisBot.apiMethod("getUpdates", { offset: -1, timeout: 0 });
                if (lastUpdate.result.length) var offset = lastUpdate.result[0].update_id + 1;
                //开始工作
                thisBot.Status = "UP";
                updatePolling(offset, updateMethod.timeout);
                break;
            case "webhook":
                break;
            default:
                break;
        }
    }

    //禁用Bot
    this.Stop = function () {
        thisBot.Status = "Down";
    }

    /****************
    Helper
    *****************/

    //消息更新轮询
    async function updatePolling(offset, timeout) {
        var updates = await thisBot.apiMethod("getUpdates", { offset: offset, timeout: timeout });
        if (updates.ok && thisBot.Status === "UP") {
            //触发事件
            for (var i = 0; i < updates.result.length; i++) {
                thisBot.event.emit("newUpdate", updates.result[i]);
            }
            //更新offset
            if (updates.result.length > 0) {
                for (var i = 0; i < updates.result.length; i++) {
                    if (updates.result[i].update_id > offset) offset = updates.result[i].update_id;
                }
                offset++;
            }
        }
        if (thisBot.Status === "UP") setImmediate(updatePolling, offset, timeout);
    }

    //http Helper
    function httpPost(method, callback, apiParams = {}) {
        var opts = url.parse(apiUrl + token + "/" + method);
        var postData = querystring.stringify(apiParams);
        //proxy TODO:http https
        if (thisBot.proxy) {
            opts.agent = new SocksProxyAgent(thisBot.proxy, true);
        }
        opts.method = "POST";
        opts.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        };
        var req = https.request(opts, function (res) {
            //if (res.statusCode !== 200) throw new Error();
            var rawData = "";
            res.on("data", function (chunk) { rawData += chunk; });
            res.on("end", function () {
                callback(JSON.parse(rawData));
            });
        });
        req.on('error', (e) => {
            console.error(`请求遇到问题: ${e.message}`);
        });
        req.write(postData);
        req.end();
    }

    //API方法
    this.apiMethod = function (method, args) {
        return new Promise(function (resolve, reject) {
            httpPost(method, function (json) {
                resolve(json);
            },args);
        });
    }
}
module.exports = TgBot;