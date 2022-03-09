require('dotenv').config();
const { default: axios } = require('axios');
const telegram_bot = require('node-telegram-bot-api');
const token = {YOUR_DISCORD_BOT_TOKEN);
const LTA = {YOUR_LTA_API_TOKEN};
async function getBusStop(url,config){
    let res = await axios.get(url,config);
    let data = res.data;
    return data;
}
const bot = new telegram_bot(token, {polling:true});
async function get_response(bus_stop,config){
    let url = `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${bus_stop}`;
    var bus_data = await getBusStop(url,config);
    var data_list = [];
    bus_data.Services.forEach(element => {

        var seat_color_list = ["🟢","🟠","🔴"];
        var seat_crowding_list = ["SEA","SDA","LSD"];
        var next_bus_timing = element.NextBus.EstimatedArrival.slice(0,-6).split("T").join(" ");
        var next_bus_seating = element.NextBus.Load;
        var subsequent_bus_seating = element.NextBus2.Load;
        for(let i=0;i<seat_crowding_list.length;i++){
            if(seat_crowding_list[i] == next_bus_seating){
                next_bus_seating = seat_color_list[i];
            }
            if(seat_crowding_list[i] == subsequent_bus_seating){
                subsequent_bus_seating = seat_color_list[i]
            }
        }
        var diff1 = Math.abs(new Date() - new Date(next_bus_timing.replace(/-/g,'/'))); //milliseconds
        diff1 = Math.floor((diff1/1000)/60); //convert to minute
        subsequent_bus_timing = element.NextBus2.EstimatedArrival.slice(0,-6).split("T").join(" ");
        var diff2 = Math.abs(new Date() - new Date(subsequent_bus_timing.replace(/-/g,'/'))); //milliseconds
        diff2 = Math.floor((diff2/1000)/60); //convert to minute
        
        if(isNaN(diff1)){
            data_list.push(`🚍 ${element.ServiceNo} is not available`)
        }
        else{
            if(isNaN(diff2)){
                if(diff1 != 0){
                    data_list.push(`🚍 *${element.ServiceNo}*: \t ${diff1}min ${next_bus_seating} \t 2nd 🚍 unavailable`)
                }
                else{
                    data_list.push(`🚍 *${element.ServiceNo}*: \t now ${next_bus_seating} \t 2nd 🚍 unavailable`)
                }
            }
            else{
                if(diff1!=0){
                    data_list.push(`🚍 *${element.ServiceNo}*: \t ${diff1}min ${next_bus_seating} \t ${diff2}min ${subsequent_bus_seating}`)
                }
                else{
                    data_list.push(`🚍 *${element.ServiceNo}*: \t now ${next_bus_seating} \t ${diff2}min ${subsequent_bus_seating}`)
                }
            }
        }
    });
    return data_list;
}
var user_chat_id;
var text_content;
const config= {
    headers:{
        accept: "application/json",
        AccountKey: LTA
    }
}
var dict = {}
bot.on('message', async (msg)=>{
    const chat_id = msg.chat.id;
    user_chat_id = msg.chat.id;
    text_content = msg.text;
    dict[user_chat_id]=text_content;
    if(msg.text == "/start"){
        bot.sendMessage(chat_id,"Welcome! Im a bus stop bot🤖. Type in bus stop number🚌 to start!\n 🟢= LOW crowd,🟠= MODERATE crowd,🔴= HIGH crowd");
    }

    var bus_stop = msg.text;
    var counter = 0;
    data_list = await get_response(bus_stop,config);
    if(msg.text!= "/start"){
        if(data_list.length==0){
            bot.sendMessage(chat_id, "Invalid bus stop entered. Try again")
        }
        else{
        counter ++;
        bot.sendMessage(chat_id,data_list.join('\n'),{
            reply_markup:{
                inline_keyboard : [[
                    {text:"Update bus stop",
                    callback_data: msg.text}
                ]]
            },
            parse_mode: 'Markdown'
        })
        };
    }
})
bot.on('callback_query',async (call_back_query)=>{
    var user_chat_id = call_back_query.from.id;
    var bus_stop_no = dict[user_chat_id.toString()];
    var new_data_list = await get_response(bus_stop_no,config);
    bot.sendMessage(user_chat_id,new_data_list.join('\n'),{
        reply_markup:{
            inline_keyboard : [[
                {text:"Update bus stop",
                callback_data: text_content}
            ]]
        }
    })
})
