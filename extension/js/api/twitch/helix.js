import {AbstractApi} from './core.js';
import {utils} from '../../utils/utils.js';


class HelixApi extends AbstractApi{
    constructor(){
        super();
        this.use2ndPartyClientId = true;
        this.params = {
            "method": "GET",
            "accept": "",
            "credentials": "omit",
            "mode": "cors",
            "includeClientId": true,
        };
        this.includeApiHeader = false;
    }

    getStartEndQuery(startDate, endDate){
        if(!startDate || !endDate) return "";
        return `&started_at=${startDate.toISOString()}&ended_at=${endDate.toISOString()}`;
    }

    arrToHelixStr(paramName, arr, first=false){
        if (!arr){
            return "";
        }
        let parts = arr.map(e=>`&${paramName}=${e}`);
        let s = parts.join("");
        if (first){
            return s.substr(1);
        } 
        else{
            return s;
        }
    }

    cursorStr(direction, cursor){
        let cursorParam = "";
        if(cursor){
            cursorParam = `&${direction}=${cursor}`;
        }
        return cursorParam;
    }

    games(game_ids){
        let gamesParam = this.arrToHelixStr("id", game_ids, true);
        let url = `https://api.twitch.tv/helix/games?${gamesParam}`;
        return this.call(url);
    }

    topGames({first=100}={}, direction, cursor){
        let cursorParam = this.cursorStr(direction, cursor);
        let url = `https://api.twitch.tv/helix/games/top?first=${first}${cursorParam}`;
        return this.call(url);
    }


    videos({vIds}={}){
        let idsParam = this.arrToHelixStr("id", vIds).substr(1);;
        let url = `https://api.twitch.tv/helix/videos?${idsParam}`;
        return this.call(url);
    }
    clips({ids=false, broadcaster_id=false, game_id=false, first=100, startDate=false, endDate=false}={}, direction="after", cursor=false){
        let cursorParam = this.cursorStr(direction, cursor);
        let identQuery;
        if (broadcaster_id) identQuery = `&broadcaster_id=${broadcaster_id}`;
        else if (game_id) identQuery = `&game_id=${game_id}`;
        else if (ids && ids.length) identQuery = this.arrToHelixStr("id", ids);

        let startEndQuery = this.getStartEndQuery(startDate, endDate);

        let url = `https://api.twitch.tv/helix/clips?first=${first}${identQuery}${cursorParam}${startEndQuery}`;
        return this.call(url);
    }

    userVideos({uid, first=100, type="archive", sort="time"}={}, direction="after", cursor=false){
        let cursorParam = this.cursorStr(direction, cursor);
        let url = `https://api.twitch.tv/helix/videos?user_id=${uid}&first=${first}&type=${type}${cursorParam}&sort=${sort}`;
        return this.call(url);
    }

    gameVideos({gid, first=100, type="archive", sort="views", period="month"}={}, direction="after", cursor=false){
        let cursorParam = this.cursorStr(direction, cursor);
        let url = `https://api.twitch.tv/helix/videos?game_id=${gid}&first=${first}&type=${type}${cursorParam}&sort=${sort}&language=en&period=${period}`;
        return this.call(url);
    }

    streams({first=100, languages=false, game_ids=false} = {}, direction="after", cursor=false){
        let gamesParam = this.arrToHelixStr("game_id", game_ids);
        let languagesParam = this.arrToHelixStr("language", languages);
        let cursorParam = this.cursorStr(direction, cursor);
        let url = `https://api.twitch.tv/helix/streams?first=${first}${cursorParam}${languagesParam}${gamesParam}`;
        return this.call(url);
    }

    userStreams({logins=[], ids=[], first=100}={}, direction="after", cursor=false){
        let loginsParam = "";
        let idsParam = "";
        if (logins.length){
            loginsParam = this.arrToHelixStr("user_login", logins);
        }
        if (ids.length){
            idsParam = this.arrToHelixStr("user_id", ids);
        }
        let cursorParam = this.cursorStr(direction, cursor);
        let url = `https://api.twitch.tv/helix/streams?first=${first}${cursorParam}${loginsParam}${idsParam}`;
        return this.call(url);
    }

    follows({from_id, to_id}={}){
        let param;
        if (from_id){
            param = `from_id=${from_id}`;
        }
        else if (to_id){
            param = `to_id=${to_id}`;
        }
        else{
            // raise here?
            return;
        }
        let url = `https://api.twitch.tv/helix/users/follows?first=100&${param}`;
        return this.call(url);
    }

    users({logins=[], ids=[]}={}){
        const usernamesParam = this.arrToHelixStr("login", logins, true);
        const userIdsParam = this.arrToHelixStr("id", ids);
        let url = `https://api.twitch.tv/helix/users?${usernamesParam}${userIdsParam}`;
        return this.call(url);
    }

    async getUsers(ids){
        if (!ids.length) return {};
        // function addThumb(user){
        //     user.thumb = `https://static-cdn.jtvnw.net/jtv_user_pictures/${user.login}-profile_image-${user.thumbId}-300x300.png`;
        // }
        let id_set = new Set(ids);
        let users = await utils.storage.getItem("users");
        let result = {};
        let user, id;
        if (users){
            for (id of ids){
                user = users[id];
                if (!user) continue;
                id_set.delete(id);
                result[id] = user;
            }
        }
        if (id_set.size > 0){
            let json = await this.users({ids:Array.from(id_set)});
            if(json && json.data && json.data.length){
                for(user of json.data){
                    user = {
                        "thumb": user.profile_image_url,
                        "login": user.login,
                        "id": user.id,
                        "displayName": user.display_name,
                    };
                    utils.storage.setUser(user.id, user);
                    result[user.id] = user;
                }
            }
        }
        // Object.values(result).map(r=>addThumb(r));
        return result;
    }

    async getGames(ids){
        if (!ids.length) return {};
        function addThumb(game){
            game.thumb = `https://static-cdn.jtvnw.net/ttv-boxart/${encodeURIComponent(game.name)}-{width}x{height}.jpg`;
        }
        let id_set = new Set(ids);
        let games = await utils.storage.getGames();
        let result = {};
        let game, id;
        if (games){
            for (id of ids){
                game = games[id];
                if (!game) continue;
                id_set.delete(id);
                // addThumb(game);
                result[id] = game;
            }
        }
        if(id_set.size > 0){
            let json = await this.games(Array.from(id_set));
            if(json && json.data && json.data.length){
                for(game of json.data){
                    delete game["box_art_url"];
                    utils.storage.setGame(game.id, game);
                    result[game.id] = game;
                }
            }
        }
        Object.values(result).map(r=>addThumb(r));
        return result;
    }
}


const helixApi = new HelixApi();


class HelixEndpoint{
    constructor(endpoint){
        this.endpoint = endpoint;
        this.lastCursor = null;
    }
    _call(params, direction, cursor){
        if (params){
            this.lastParams = params;
        }
        else{
            params = this.lastParams;
        }

        let p = helixApi[this.endpoint](params, direction, cursor);
        return p.then(r=>{
            this.lastCursor = r.pagination && r.pagination.cursor;
            this.lastData = r.data;
            return r.data;
        });
    }

    call(params){
        return this._call(params)
    }

    next(){
        return new Promise((resolve, reject)=>{
            if(this.lastCursor){
                this._call(null, "after", this.lastCursor).then(data=>{
                    resolve(data);
                });
            }
            else{
                reject();
            }
        });
    }

    previous(){
        return new Promise((resolve, reject)=>{
            if(this.lastCursor){
                this._call(null, "before", this.lastCursor).then(data=>{
                    resolve(data);
                });
            }
            else{
                reject();
            }
        });
    }

}

export {helixApi, HelixEndpoint};
