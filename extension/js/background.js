function getFirstPartyClientId(){
    let urlThatIncludesCoreScript = "https://www.twitch.tv/directory/all";
    let coreScriptUrlRegex = /<script src="(https:\/\/static\.twitchcdn\.net\/assets\/core-[^"]+)"/;
    let clientIdRegex = /\.allAuthSettings.*?Www]={clientID:"([^"]+)",cookieName:"twilight-user"/;

    return fetch(urlThatIncludesCoreScript).then(response=>{
        return response.text();
    }).then(text=>{
        let scriptUrl = text.match(coreScriptUrlRegex)[1];
        return fetch(scriptUrl);
    }).then(response=>{
        return response.text();
    }).then(text=>{
        let clientId = text.match(clientIdRegex)[1];
        return clientId;
    });
}

function openList(){
    console.log("test");
    let newUrl = chrome.runtime.getURL("../list.html");
    chrome.tabs.create({ url: newUrl });
}
function openPlayer(queryStr){
    let newUrl = chrome.runtime.getURL("../player.html") + queryStr;
    chrome.tabs.create({ url: newUrl });
}
const twitchRegex = /twitch.tv\/([^\/]*)\/?(\d*)\??.*?(t=)?(\d*)?h?(\d*)?m?(\d*)?s?/
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.getSelected(tab=>{
        if(tab.url){
            let match = twitchRegex.exec(tab.url);
            if(match){
                if(match[1] === "videos"){
                    let vid = match[2] && parseInt(match[2]);
                    if(vid){
                        let queryStr = `?vid=${vid}`;
                        if (match[3] == "t="){
                            let hours = match[6] && match[4] || 0;
                            let mins = hours && match[5] || 0;
                            let secs = hours && match[6] || mins && match[5] || match[4] || 0;
                            secs = parseInt(secs) + parseInt(mins)*60 + parseInt(hours)*3600;
                            queryStr += `&time=${secs}`;
                        }
                        openPlayer(queryStr);
                        return;
                    }
                }
                else{
                    let channel = match[1];
                    if(tab.url.endsWith("videos"))
                    if(channel){
                        openPlayer(`?channel=${channel}`);
                        return;
                    }
                }
            }
        }
        openList();
    });
});
chrome.runtime.onInstalled.addListener(function (object) {
    if(chrome.runtime.OnInstalledReason.INSTALL === object.reason){
        openList();   
    }
});

let ready = false;
class Storage{
    constructor(){
        this.maxResumePositions = 3000;
        this.maxFavourites = 200;
        this.data = {
            "userIds": {},
            "resumePositions": {},
            "lastChatPos": {left:0,top:0},
            "lastChatDim": {width: "300px", height: "500px"},
            "lastSetQuality": "Auto",
            "watchlater": [],
            "favourites": [],
        }
        chrome.storage.local.get(null, storedData=>{
            Object.assign(this.data, storedData);
            this.cleanResumePositions();
            ready = true;
        });
    }


    cleanResumePositions(){
        let positions = this.data["resumePositions"];
        let positionsArr = Object.keys(positions).sort((p1,p2)=>{
            return parseInt(p1)-parseInt(p2);
        });
        if(positionsArr.length >= this.maxResumePositions){
            let toDelete = positionsArr.slice(0, this.maxResumePositions);
            for(let id of toDelete){
                delete positions[id];
            }
        }
    }

    setFav(channel){
        let favs = this.data["favourites"];
        let index = favs.indexOf(channel);
        if(index<0){
            favs.unshift(channel);
            if(favs.length > this.maxFavourites){
                favs.pop();
            }
        }
        else{
            console.error("tried to set already existing favourite");
        }
    }

    unsetFav(channel){
        let favs = this.data["favourites"];
        let index = favs.indexOf(channel);
        if(index>=0){
            favs.splice(index, 1);
        }
        else{
            console.error("tried to remove non existing favourite");
        }
    }
}
const storage = new Storage();

chrome.runtime.onSuspend.addListener(function() {
    chrome.storage.local.set(storage.data);
});

updateStorageInterval = setInterval(()=>{
    chrome.storage.local.set(storage.data);
}, 60*1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.event === "storage"){
        if (request.op === "get"){
            sendResponse(storage.data[request.key]);
        }
        else if (request.op === "set"){
            storage.data[request.key] = request.val;
        }
        else if (request.op === "getResumePoint"){
            sendResponse(storage.data["resumePositions"][request.vid]);
        }
        else if (request.op === "setResumePoint"){
            storage.data["resumePositions"][request.vid] = request.secs;
        }
        else if (request.op === "setFav"){
            storage.setFav(request.channel);
        }
        else if (request.op === "unsetFav"){
            storage.unsetFav(request.channel);
        }
        else if (request.op === "getUserId"){
            sendResponse(storage.data["userIds"][request.username]);
        }
        else if (request.op === "setUserId"){
            storage.data["userIds"][request.username] = request.id;
        }
        else if (request.op === "setAllData"){
            storage.data = request.data;
        }
        else if (request.op === "getAllData"){
            sendResponse(storage.data);
        }
           
    }
    else if (request.event === "readyCheck"){
        sendResponse(ready);
    }
});
