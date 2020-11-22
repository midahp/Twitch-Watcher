const browser = window.browser || window.chrome; 


const fetchParams = {
    "headers": {
        "accept": "application/vnd.twitchtv.v5+json",
        "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko"
    },
    "mode": "cors",
    "credentials": "omit",
    "method": "GET",
}
function getClip(slug){
    let url = `https://api.twitch.tv/kraken/clips/${slug}`;
    return fetch(url, fetchParams).then(r=>r.json());
}
function getClipVod(slug){
    return getClip(slug).then(clip=>{
        let vod = clip.vod;
        if(vod && vod.url && vod.id){
            return vod;
        }
    });
}




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


function openList(index){
    let newUrl = browser.runtime.getURL("../list.html#/live");
    browser.tabs.create({ index: index, url: newUrl });
}
function openPlayer(queryStr){
    let newUrl = browser.runtime.getURL("../player.html") + queryStr;
    browser.tabs.create({ url: newUrl });
}

const twitchRegex = /twitch.tv\/([^\/]*)\/?(\d*)\??.*?(t=)?(\d*)?h?(\d*)?m?(\d*)?s?/;
function vodUrlToPlayerQueryString(vodUrl){
    let match = twitchRegex.exec(vodUrl);
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
                return queryStr;
            }
        }
        else{
            let channel = match[1];
            if(vodUrl.endsWith("videos"))
            if(channel){
                return `?channel=${channel}`;
            }
        }
    }
}

browser.browserAction.onClicked.addListener(function(tab) {
    browser.tabs.getSelected(tab=>{
        if(tab.url){
            if (tab.url.startsWith("https://clips.twitch.tv")){
                let slug = tab.url.split("/")[3];
                getClipVod(slug).then(vod=>{
                    let queryStr = vodUrlToPlayerQueryString(vod.url);
                    if(queryStr){
                        openPlayer(queryStr);
                    }
                });
                return;
            }
            let queryStr = vodUrlToPlayerQueryString(tab.url);
            if(queryStr){
                openPlayer(queryStr);
                return;
            }
        }
        openList(tab.index+1);
    });
});
browser.runtime.onInstalled.addListener(function (object) {
    if(browser.runtime.OnInstalledReason.INSTALL === object.reason){
        openList();   
    }
});


const defaultData = {
    "lastSetLangCode": "",
    "users": {},
    "games": {},
    "resumePositions": {},
    "hiddenGames": {},
    "lastChatPos": {left:0,top:0},
    "lastChatDim": {width: "300px", height: "500px"},
    "lastSetQuality": "Auto",
    "watchlater": [],
    "favourites": {
        "games": {}, //these are objects because set cant be serialized; only the keys will be used
        "users": {},
    },
};

let ready = false;
class Storage{
    constructor(){
        this.maxResumePositions = 10000;
        this.needsSaving = new Set();
        this.data = defaultData;
        browser.storage.local.get(null, storedData=>{
            Object.assign(this.data, storedData);
            this.cleanStorage();
            ready = true;
        });
        // this.clearStorage()
        this.events();
    }

    clearStorage(){
        this.data = defaultData;
        browser.storage.local.set(this.data);
    }

    saveStorage(obj){
        // console.log(`saving: ${Object.keys(obj)}`);
        browser.storage.local.set(obj);
    }
    save(key, val){
        this.data[key] = val;
        saveStorage({key: storage.data[key]});
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

browser.runtime.onSuspend.addListener(function() {
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
        this.cache[id] = item;
        this.timeouts[id] = setTimeout(()=>{
            delete this.cache[id];
        }, CACHE_TIMEOUT);
    }
}

const apiCache = new ApiCache();


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.event === "storage"){
        switch(request.op){
            case "get":
                sendResponse(storage.data[request.key]);
                break;
            case "set":
                storage.data[request.key] = request.val;
                storage.needsSaving.add(request.key);
                break;
            case "getMultiple":
                let key;
                const obj = {};
                for(key of request.keys){
                    obj[key] = storage.data[key];
                }
                sendResponse(obj);
                break;
            case "getResumePoint":
                sendResponse(storage.data["resumePositions"][request.vid]);
                break;
            case "setResumePoint":
                storage.data.resumePositions[request.vid] = request.secs;
                storage.needsSaving.add("resumePositions");
                break;
            case "setFav":
                storage.setFav(request);
                break;
            case "setFavs":
                storage.setFavs(request);
                break;
            case "unsetFav":
                storage.unsetFav(request);
                break;
            case "isFaved":
                sendResponse(storage.data["favourites"][request.type][request.ident]);
                break;
            case "getUser":
                sendResponse(storage.data["users"][request.id]);
                break;
            case "setUser":
                storage.data["users"][request.id] = request.user;
                storage.needsSaving.add("users");
                break;
            case "getApiCache":
                sendResponse(apiCache.getItem(request.id));
                break;
            case "setApiCache":
                apiCache.setItem(request.id, request.item);
                break;
            case "addHiddenGame":
                storage.data["hiddenGames"][request.id] = true;
                storage.saveStorage({"hiddenGames": storage.data.hiddenGames});
                break;
            case "removeHiddenGame":
                delete storage.data["hiddenGames"][request.id];
                storage.saveStorage({"hiddenGames": storage.data.hiddenGames});
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
                break;
            case "setAllData":
                storage.save(request.data);
                storage.needsSaving.clear();
                break;
            case "getAllData":
                sendResponse(storage.data);
                break;
        }
    }
    else if (request.event === "readyCheck"){
        sendResponse(ready);
    }
    else if (request.event === "openPlayer"){
        openPlayer(request.queryStr);
    }
});
