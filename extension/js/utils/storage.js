import {browser} from '../api/webextension.js';


class Storage{
    constructor(){

    }

    getAllData(){
        let msg = {
            "op": "getAllData",
        }
        return this.sendToBg(msg, true).then(data=>{
            return data;
        });
    }

    setAllData(data){
        let msg = {
            "op": "setAllData",
            "data": data,
        }
        this.sendToBg(msg, false);
    }

    
    sendToBg(msg, expectResponse=true){
        msg.event = "storage";
        let response = "notReady";

        let p = new Promise(resolve=>{
            let fn = response=>{
                if (response == "notReady"){
                    setTimeout(()=>{
                        browser.runtime.sendMessage(msg, fn);
                    }, 100);
                }
                else{
                    resolve(response)
                }
            }
            browser.runtime.sendMessage(msg, fn);
            //     resolve(response);
            // });
        });
        if (expectResponse){
            return p;
        }
        // else{
        //     delete p;
        // }
    }

    setItem(key, val){
        let msg = {
            "op": "set",
            "key": key,
            "val": val,
        }
        this.sendToBg(msg, false);
    }

    getItem(key){
        let msg = {
            "op": "get",
            "key": key,
        }
        return this.sendToBg(msg, true);
    }

    getMultiple(keys){
        let msg = {
            "op": "getMultiple",
            "keys": keys,
        }
        return this.sendToBg(msg, true);
    }

    setMultiple(obj){
        let msg = {
            "op": "setMultiple",
            "obj": obj,
        }
        return this.sendToBg(msg, false);
    }

    getNested(dottedPath){
        let msg = {
            "op": "getNested",
            "dottedPath": dottedPath,
        }
        return this.sendToBg(msg, true);
    }

    setNested(dottedPath, value){
        let msg = {
            "op": "setNested",
            "dottedPath": dottedPath,
            "value": value,
        }
        this.sendToBg(msg, false);
    }

    setFav(ident, type){
        let msg = {
            "op": "setFav",
            "ident": ident,
            "type": type,
        }
        this.sendToBg(msg, false);
    }

    setFavs(identArr, type){
        let msg = {
            "op": "setFavs",
            "identArr": identArr,
            "type": type,
        }
        this.sendToBg(msg, false);
    }


    unsetFav(ident, type){
        let msg = {
            "op": "unsetFav",
            "ident": ident,
            "type": type,
        }
        this.sendToBg(msg, false);
    }

    isFaved(ident, type){
        let msg = {
            "op": "isFaved",
            "ident": ident,
            "type": type,
        }
        return this.sendToBg(msg, true);
    }


    getResumePoint(vid){
        let msg = {
            "op": "getResumePoint",
            "vid": vid,
        }
        return this.sendToBg(msg, true);
    }

    setResumePoint(vid, secs){
        let msg = {
            "op": "setResumePoint",
            "vid": vid,
            "secs": secs,
        }
        this.sendToBg(msg, false);
    }
    getUser(id){
        let msg = {
            "op": "getUser",
            "id": id,
        }
        return this.sendToBg(msg, true);
    }
    setUser(id, user){
        let msg = {
            "op": "setUser",
            "id": id,
            "user": user,
        }
        this.sendToBg(msg, false);
    }
    getGames(){
        let msg = {
            "op": "getGames",
        }
        return this.sendToBg(msg, true);
    }
    getGame(id){
        let msg = {
            "op": "getGame",
            "id": id,
        }
        return this.sendToBg(msg, true);
    }
    setGame(id, game){
        let msg = {
            "op": "setGame",
            "game": game,
            "id": id,
        }
        this.sendToBg(msg, false);
    }
    addHiddenGame(id){
        let msg = {
            "op": "addHiddenGame",
            "id": id,
        }
        this.sendToBg(msg, false);
    }
    removeHiddenGame(id){
        let msg = {
            "op": "removeHiddenGame",
            "id": id,
        }
        this.sendToBg(msg, false);
    }

    addHiddenStream(id){
        let msg = {
            "op": "addHiddenStream",
            "id": id,
        }
        this.sendToBg(msg, false);
    }
    removeHiddenStream(id){
        let msg = {
            "op": "removeHiddenStream",
            "id": id,
        }
        this.sendToBg(msg, false);
    }


    getApiCache(id){
        let msg = {
            "op": "getApiCache",
            "id": id,
        }
        return this.sendToBg(msg, true);
    }
    setApiCache(id, item){
        let msg = {
            "op": "setApiCache",
            "id": id,
            "item": item,
        }
        this.sendToBg(msg, false);
    }
}

const storage = new Storage();
export {storage};
