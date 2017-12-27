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
    this.event = new EventEmitter();      //todo 继承
    this.event.bot = this;

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
                var offset = 0;
                var lastUpdate = await thisBot.apiMethod("getUpdates", { offset: -1, timeout: 0 });
                if (lastUpdate.result.length) offset = lastUpdate.result[0].update_id + 1;
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

    //加载模块
    this.LoadModule = async function (module) {
        var m = new module();
        m.updateListener(thisBot.event);
    }

    /****************
    Helper
    *****************/

    //消息更新轮询
    async function updatePolling(offset, timeout) {
        var updates = await thisBot.apiMethod("getUpdates", { offset: offset, timeout: timeout });
        if (updates.ok && thisBot.Status === "UP") {
            //newUpdates事件
            thisBot.event.emit("newUpdates", updates);
            //newUpdate事件
            for (var i = 0; i < updates.result.length; i++) {
                thisBot.event.emit("newUpdate", updates.result[i]);
                if (updates.result[i].message) {
                    //newMsg Event
                    thisBot.event.emit("newMsg", updates.result[i].message);
                } else if (updates.result[i].edited_message) {
                    //newEditedMsg Event
                    thisBot.event.emit("newEditedMsg", updates.result[i].edited_message);
                } else if (updates.result[i].channel_post) {
                    //newChnPost Event
                    thisBot.event.emit("newChnPost", updates.result[i].channel_post);
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
        if (thisBot.Status === "UP") setImmediate(updatePolling, offset, timeout);
    }

    //http Helper
    function httpPost(method, callback, apiParams = {}, inputFiles) {
        var opts = url.parse(apiUrl + token + "/" + method);
        //proxy TODO:http https
        if (thisBot.proxy) {
            opts.agent = new SocksProxyAgent(thisBot.proxy, true);
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
                console.log(rawData);
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
    this.apiMethod = function (method, args, inputFiles) {
        return new Promise(function (resolve, reject) {
            httpPost(method, function (json) {
                resolve(json);
            }, args, inputFiles);
        });
    }
}
module.exports = TgBot;