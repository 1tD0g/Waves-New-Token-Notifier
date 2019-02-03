process.env["NTBA_FIX_319"] = 1;
require("dotenv").config()
const api = require("./api");
const fs = require("fs");
const jsonFile = require("jsonfile");
const log = console.log;
console.log = function(txt){ log(`[${new Date().toLocaleString()}] >>> ${txt}`) };

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
setInterval(check, 1000 * 20)
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
        console.log("Current Block Height: " + height);
        if(data.block == height) return;
        data.block = height;
        updateData()
        transactions.forEach(val => {
            if(val.type == 3){
                console.log(val)
            }
        })
    }catch(e){
        console.error(e);
    }
}
