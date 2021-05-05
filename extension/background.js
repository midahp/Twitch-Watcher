
const PLAYER_URL = chrome.runtime.getURL("player.html");
const LIST_URL = chrome.runtime.getURL("list.html");

class Actions{
    openList(index){
        chrome.tabs.create({ index: index, url: LIST_URL });
    }
    openPlayer(queryStr, index){
        let newUrl = PLAYER_URL + queryStr;
        chrome.tabs.create({ index: index, url: newUrl });
    }
}


const actions = new Actions();


const defaultData = {
    "lastSetLangCode": "",
    "settings.video.noLiveAds": false,  // restricts the quality to max 480p but doesn't show "ads" (purple screen)
    "users": {},
    "games": {},
    "resumePositions": {},
    "hiddenGames": {},
    "hiddenStreams": {},
    "lastChatPos": {left:0,top:0},
    "lastChatDim": {width: "300px", height: "500px"},
    "lastSetBitrate": "Auto",
    "lastSetQuality": "",
    "watchlater": [],
    "favourites": {
        "games": {}, //these are objects because set cant be serialized; only the keys will be used
        "users": {},
    },
};

class Storage{
    constructor(){
        this.ready = false;
        this.maxResumePositions = 10000;
        this.needsSaving = new Set();
        this.data = defaultData;
        chrome.storage.local.get(null, storedData=>{
            Object.assign(this.data, storedData);
            this.cleanStorage();
            this.ready = true;
        });
        this.events();
    }

    clearStorage(){
        this.data = defaultData;
        chrome.storage.local.set(this.data);
    }

    saveStorage(obj){
        // console.log(`saving: ${Object.keys(obj)}`);
        chrome.storage.local.set(obj);
    }
    save(key, val){
        this.data[key] = val;
        this.saveStorage({key: storage.data[key]});
    }

    saveQueued(){
        if (!this.needsSaving.size) return;
        let name;
        const storeObj = {};
        for(name of this.needsSaving){
            storeObj[name] = this.data[name];
        }
        this.needsSaving.clear();
        this.saveStorage(storeObj);
    }

    events(){
        const updateStorageInterval = setInterval(()=>{
            this.saveQueued();
        }, 30*1000);
    }

    cleanStorage(){
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

    setFav({ident, type="users"}={}){
        let favs = this.data["favourites"];
        favs[type][ident] = true;
        this.saveStorage({"favourites": favs});
    }

    setFavs({identArr, type="users"}={}){
        let favs = this.data["favourites"];
        let ident;
        for(ident of identArr){
            favs[type][ident] = true;
        }
        this.saveStorage({"favourites": favs});
    }

    unsetFav({ident, type="users"}={}){
        let favs = this.data["favourites"];
        delete favs[type][ident]
        this.saveStorage({"favourites": favs});
    }
}
const storage = new Storage();
chrome.runtime.onSuspend.addListener(function() {
    storage.saveQueued();
});

const CACHE_TIMEOUT = 1000 * 60 * 1;
class ApiCache{
    constructor(){
        this.cache = {};
        this.timeouts = {};
    }

    getItem(id){
        return this.cache[id];
    }

    setItem(id, item){
        clearTimeout(this.timeouts[id]);
        delete this.timeouts[id];

        this.cache[id] = item;
        this.timeouts[id] = setTimeout(()=>{
            delete this.timeouts[id];
            delete this.cache[id];
        }, CACHE_TIMEOUT);
    }
}

const apiCache = new ApiCache();

const storageMessageHandler = (request, sender, sendResponse) => {

    switch(request.op){
        case "get":
            sendResponse(storage.data[request.key]);
            break;
        case "set":
            storage.data[request.key] = request.val;
            storage.needsSaving.add(request.key);
            sendResponse("success");
            break;
        case "getMultiple":
            let key;
            const obj = {};
            for(key of request.keys){
                obj[key] = storage.data[key];
            }
            sendResponse(obj);
            break;
        case "setNested":
            const arr = request.dottedPath.split(".");
            obj = storage.data;
            let i;
            let l = arr.length;
            for(i in arr){
                key = arr[i];
                if(i == l-1){
                    obj[key] = request.value;
                    break;
                }
                obj = obj[key];
            }
            sendResponse("success");
            break;

        case "getResumePoint":
            sendResponse(storage.data["resumePositions"][request.vid]);
            break;
        case "setResumePoint":
            storage.data.resumePositions[request.vid] = request.secs;
            storage.needsSaving.add("resumePositions");
            sendResponse("success");
            break;
        case "setFav":
            storage.setFav(request);
            sendResponse("success");
            break;
        case "setFavs":
            storage.setFavs(request);
            sendResponse("success");
            break;
        case "unsetFav":
            storage.unsetFav(request);
            sendResponse("success");
            break;
        case "isFaved":
            sendResponse(storage.data["favourites"][request.type][request.ident]);
            break;
        case "getUser":
            sendResponse(storage.data["users"][request.id]);
            break;
        case "setUser":
            storage.data["users"][request.id] = request.user;
            sendResponse("success");
            // storage.needsSaving.add("users");
            break;
        case "getApiCache":
            sendResponse(apiCache.getItem(request.id));
            break;
        case "setApiCache":
            apiCache.setItem(request.id, request.item);
            sendResponse("success");
            break;
        case "addHiddenGame":
            storage.data["hiddenGames"][request.id] = true;
            storage.saveStorage({"hiddenGames": storage.data.hiddenGames});
            sendResponse("success");
            break;
        case "removeHiddenGame":
            delete storage.data["hiddenGames"][request.id];
            storage.saveStorage({"hiddenGames": storage.data.hiddenGames});
            sendResponse("success");
            break;
        case "addHiddenStream":
            storage.data["hiddenStreams"][request.id] = true;
            storage.saveStorage({"hiddenStreams": storage.data.hiddenStreams});
            sendResponse("success");
            break;
        case "removeHiddenStream":
            delete storage.data["hiddenStreams"][request.id];
            storage.saveStorage({"hiddenStreams": storage.data.hiddenStreams});
            sendResponse("success");
            break;
        case "getGames":
            sendResponse(storage.data["games"]);
            break;
        case "getGame":
            sendResponse(storage.data["games"][request.id]);
            break;
        case "setGame":
            storage.data["games"][request.id] = request.game;
            storage.needsSaving.add("games");
            sendResponse("success");
            break;
        case "setAllData":
            storage.data = request.data;
            storage.saveStorage({
                ...storage.data,
                "users": {},
            });
            storage.needsSaving.clear();
            sendResponse("success");

            break;
        case "getAllData":
            sendResponse(storage.data);
            break;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.event === "storage"){
        if (!storage.ready){
            sendResponse("notReady");
        }
        else{
            storageMessageHandler(request, sender, sendResponse);
        }
    }
    else if (request.event === "readyCheck"){
        sendResponse(storage.ready);
    }
    else if (request.event === "openPlayer"){
        actions.openPlayer(request.queryStr, sender.tab.index+1);
    }
});

chrome.runtime.onInstalled.addListener(function (object) {
    if(chrome.runtime.OnInstalledReason.INSTALL === object.reason){
        actions.openList();   
    }
});

chrome.action.onClicked.addListener(function(tab) {
    chrome.tabs.query({"active": true, "currentWindow": true}, tabs=>{
        actions.openList(tabs[0].index+1);
    });
});

