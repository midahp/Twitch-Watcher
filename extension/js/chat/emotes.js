import {settings} from '../settings.js';
import {utils} from '../utils/utils.js';


const bttvGlobalJson = "https://api.betterttv.net/3/cached/emotes/global";
const bttvChannelJson = "https://api.betterttv.net/3/cached/users/twitch/";


class Emotes{
    constructor(){
        this.urls = {
            twitch: "https://static-cdn.jtvnw.net/emoticons/v1/",
            bttv: "https://cdn.betterttv.net/emote/",
            ffz: "https://api.frankerfacez.com/v1/room/"
        };
        this.emotes = {
            "ffz": new Map(),
            "bttv": new Map()
        };
        this.scale = 1;
    }

    getScaleStr(type){
        if(type === "bttv"){
            return this.scale + "x";
        }
        else if(type === "twitch"){
            return this.scale + ".0";
        }
    }

    getFFZscaleUrl(urls){
        let scales = [4,3,2,1].sort((a,b)=>{
            return Math.abs(a-this.scale) < Math.abs(b-this.scale) ? -1 : 1;
        });
        let i, url;
        for(i of scales){
            url = urls[i];
            if(url){
                url = "https://" + url.substring(2);
                return url;
            }
        }
    }

    getSrcUrl(id, type="twitch"){
        let scale = this.getScaleStr(type);
        return this.urls[type] + id + "/" + scale;
    }

    getEmoteUrl(name){
        let type, id, url;
        for(type in this.emotes){
            id = this.emotes[type].get(name);
            if(id === undefined){continue;}
            if(type === "ffz"){
                url = this.getFFZscaleUrl(id);
            }
            else{
                url = this.getSrcUrl(id, type);
            }
            return url;
        }
    }

    getEmoteStr(url, emoteName){
        let src = url;
        let size = this.pxSize + "px";
        return `<img class="chat-emote" title="${emoteName}" src="${src}" />`;
    }

    replaceWithEmotes(fragments){
        let parts = [];
        let fragment, text, emoticon, url;
        for(fragment of fragments){
            text = fragment.text;
            emoticon = fragment.emoticon;
            if(emoticon){
                url = this.getSrcUrl(emoticon.emoticon_id);
                parts.push(this.getEmoteStr(url, fragment.text));
            }
            else{
                parts.push(this.replaceNonNativeEmotes(utils.escape(text)));
            }
        }
        return parts.join(" ");
    }

    removeEmotes(fragments){
        let parts = [];
        let fragment;
        for(fragment of fragments){
            if(fragment.emoticon){
                continue;
            }
            let fragmentWords = fragment.text.split(" ");
            let fragmentWord;
            for(fragmentWord of fragmentWords){
                if (!this.getEmoteUrl(part)) parts.push(fragmentWord);
            }
        }
        return parts.join(" ");
    }

    replaceNonNativeEmotes(msg){
        let parts = msg.split(" ");
        let index, part, url, emote;
        for(index in parts){
            part = utils.escape(parts[index]);
            url = this.getEmoteUrl(part);
            if(url){
                emote = this.getEmoteStr(url, part);
                parts[index] = emote;
            }
            else if (part.startsWith("https://")){
                parts[index] = `<a target="_blank" href="${part}">${part}</a>`;
            }
        }
        let newMsg = parts.join(" ");
        return newMsg;
    }

    convertBttvEmotes(emotes){
        if(!emotes){return;}
        let emote;
        for(emote of emotes){
            this.emotes["bttv"].set(emote["code"], emote["id"]);
        }
    }

    convertChannelBttvEmotes(json){
        if(!json)return;
        const sharedEmotes = json.sharedEmotes;
        const channelEmotes = json.channelEmotes;
        this.convertBttvEmotes(sharedEmotes);
        this.convertBttvEmotes(channelEmotes);
    }

    loadEmoteData(channel, channelId){
        let url = this.urls.ffz;
        if(channelId){
            url = url+"id/"+channelId;
        } 
        else{
            url = this.urls.ffz + channel;
        }
        let ffzChannelPromise = utils.fetch(url).then(json=>{
            if(!json){return;}
            let sets = json.sets;
            let set, emotes, emote;
            for(set in sets){
                emotes = sets[set]["emoticons"];
                for(emote of emotes){
                    this.emotes["ffz"].set(emote["name"], emote.urls);
                }
            }                
        });

        let bttvGlobalPromise = utils.fetch(bttvGlobalJson).then(json=>{
            this.convertBttvEmotes(json);
        });
        let bttvChannelPromise = utils.fetch(bttvChannelJson + channelId).then(json=>{
            this.convertChannelBttvEmotes(json);
        });

        return Promise.all([ffzChannelPromise, bttvChannelPromise, bttvGlobalPromise]);
    }
}

export {Emotes};
