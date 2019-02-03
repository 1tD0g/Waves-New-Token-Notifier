process.env["NTBA_FIX_319"] = 1;
require("dotenv").config()
const api = require("./api");
const fs = require("fs");
const jsonFile = require("jsonfile");
const log = console.log;
console.log = function(txt){ log(`[${new Date().toLocaleString()}] >>> ${txt}`) };
console.clear()
//******************************//
if(!fs.existsSync(process.env.path)){
    console.timeLog(`${process.env.path} NOT found, creating new one`)
    fs.writeFileSync(process.env.path, JSON.stringify({block: 0}),{
        flag: "w+"
    })
    console.log(`${process.env.path} Created.`)
}
let data = jsonFile.readFileSync(process.env.path);
check()
setInterval(check, 1000 * 5)
//******************************//
if(process.env.token != null && process.env.token != ""){
    const telegram = new (require("node-telegram-bot-api"))(process.env.token, {
        polling: true
    });

    function send(chatid, txt, replyID){
        var params = {parse_mode: "HTML"}
        if(replyID != null) params.reply_to_message_id = replyID;
        return telegram.sendMessage(chatid, txt, params);
    }

    telegram.onText(/\/start/, msg => {
        if(data.owner == null){
            data.owner = msg.from.id
            updateData()
            send(msg.chat.id, `You are now <b>Owner</b>`, msg.message_id)
        }else{
            send(msg.chat.id, `<b>Bot Occupied</b>.`, msg.message_id)
        }
    })

    telegram.on("polling_error", err => {
        console.error("Error: ", err)
    })    
}
//******************************//
function updateData(){
    jsonFile.writeFileSync(process.env.path, data, {
        spaces: 2
    })
}
//******************************//
async function check(){
    try{
        var {height, transactions} = await api.getBlock();
        if(data.block == height) return;
        console.log("Current Block Height: " + height);
        data.block = height;
        updateData()
        transactions.forEach(val => {
            if(val.type == 3){
                if(process.env.nonreissuableonly == 1 && val.reissuable){
                    console.log("Found Asset Issue, but is reissuable asset. Not notifying, Transaction ID: " + val.id);
                }else{
                    const {id, sender, assetId, name, reissuable, description, decimals, quantity} = val;
                    const txt = `!! <b>New Asset Detected</b> !!\nTransaction ID: <code>${id}</code>\nSender: <code>${sender}</code>\nAsset ID: <code>${assetId}</code>\n==<b>Asset Info</b>==\nName: <b>${name}</b>\nQuantity: <b>${quantity}</b>\nDeciamsl: <b>${decimals}</b>\nReissuable: <b>${reissuable}</b>\nDescription: <pre>${description}</pre>\n<a href="https://wavesexplorer.com/blocks/${data.block}">Click to View the Block on Explorer</a>\n\n<a href="https://wavesexplorer.com/tx/${id}">Click to View the Transaction on Explorer</a>`
                    console.log(txt);
                    if(process.env.token != null && process.env.token != "" && data.owner != null){
                        send(data.owner, txt);
                    }
                }
            }
        })
    }catch(e){
        console.error(e);
    }
}
