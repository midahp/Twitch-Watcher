import {utils} from '../utils/utils.js';
import {HelixEndpoint, helixApi} from '../api/twitch/helix.js';
import {favourites} from './favs.js';
import {hiddenGames, hiddenStreams} from './hidden.js';

class FormatHelper{
    getThumb(video){
        let thumb = video.thumbnail_url;
        thumb = thumb.replace("%{width}", "320");
        thumb = thumb.replace("%{height}", "180");
        if(!thumb){
            thumb = "https://vod-secure.twitch.tv/_404/404_processing_320x180.png";
        }
        return thumb;
    }

    getThumbTimeParam(){
        let d = new Date();
        return "" + d.getYear() + d.getMonth() + d.getDate() + d.getHours() + (Math.floor(d.getMinutes() / 5));
    }

    setImgSize(img, width, height){
        if (!img) return "";
        return img.replace("{width}x{height}", `${width}x${height}`);
    }
}

const formatHelper = new FormatHelper();

class DataFormater{

    gqlSearchResults(data){
        return {
            "channels": this.gqlUsers(data.channels.items),
            "games": this.gqlGames(data.games.items),
            "videos": this.gqlVideos(data.videos.items),
        };
    }

    gqlUsers(data){
        let user, formatedUser;
        let results = [];
        for(user of data){

            formatedUser = {
                "id": user.id,
                "login": user.login,
                "displayName": user.displayName,
                "thumb": user.profileImageURL.replace("150x150", "300x300"),
                "followers": utils.readableNumber(user.followers.totalCount),
            };
            results.push(formatedUser);
        }
        return results;
    }

    gqlGames(data){
        let game, formatedGame;
        let results = [];
        for(game of data){
            formatedGame = {
                "id": game.id,
                "name": game.name,
                "displayName": game.displayName,
                "thumb": game.boxArtURL.replace("90x120", "285x380"),
            };
            results.push(formatedGame);
        }
        return results;
    }

    gqlVideos(data){
        let video, formatedVideo, thumb, game, user;
        let results = [];
        for(video of data){
            thumb = video.previewThumbnailURL.replace("214x120", "320x180");
            if(!thumb){
                thumb = "https://vod-secure.twitch.tv/_404/404_processing_320x180.png";
            }
            user = {
                "displayName": video.owner.displayName, 
                "id": video.owner.id,
                "login": video.owner.login,
            };
            game = {
                "name": video.game && video.game.displayName || "",
                "id": video.game && video.game.id || "",
            } 
            formatedVideo = {
                "id": video.id,
                "thumb": thumb,
                "views": utils.readableNumber(video.viewCount),
                "length": utils.secsToReadable(video.lengthSeconds),
                "title": video.title,
                "when": utils.twTimeStrToReadable(video.createdAt),
                "game": game,
                "user": user,
            };
            results.push(formatedVideo);
        }
        return results;
    }

    async helixVideos(data){
        let resumePositions = await utils.storage.getItem("resumePositions");

        let video, state, game, user;
        const formated = [];
        for (video of data){
            game = {};
            user = {
                "displayName": video.user_name,
                "login": video.user_name,
                "id": video.user_id
            };
            state = {
                "game": game,
                "user": user,
            }
            let length = video.duration;
            state.length = length;
            let secs = utils.HMSToSecs(length);
            if(video.game){
                game = video.game;
            }

            state.title = video.title;
            let date = video.created_at;
            state.when = utils.twTimeStrToReadable(date);
            let id = video["id"];
            state.id = id;
            let resumePos = resumePositions[id] || 0;
            state.resumeBarWidth = (resumePos / secs) * 100;
            let views = video.view_count.toString();
            views = utils.readableNumber(views);
            state.views = views;
            state.thumb = formatHelper.getThumb(video);

            formated.push(state);
        }
        return formated;
    }

    async helixClips(data){

        let video, state, game, user;
        const formated = [];
        for (video of data){
            game = {};
            user = {
                "displayName": video.broadcaster_name,
                "login": video.broadcaster_name,
                "id": video.broadcaster_id
            };
            state = {
                "game": game,
                "user": user,
            }

            state.title = video.title;
            let date = video.created_at;
            state.when = utils.twTimeStrToReadable(date);
            state.cid = video.url.split("/")[3];
            let views = video.view_count.toString();
            views = utils.readableNumber(views);
            state.views = views;
            state.thumb = formatHelper.getThumb(video);

            formated.push(state);
        }
        return formated;
    }


    async helixStreams(data, gameSpecific=false){
        let stream, game;
        let hidden = 0;
        let game_ids = new Set();
        for(stream of data){
            stream.game_id && game_ids.add(stream.game_id);
        }

        let games = await helixApi.getGames(Array.from(game_ids));
        let hiddenGames;
        if (!gameSpecific){
            hiddenGames = await utils.storage.getItem("hiddenGames");
        }

        const timeParam = formatHelper.getThumbTimeParam();

        const formated = [];
        for (stream of data){
            if(hiddenStreams.isHidden(stream.user_id)){
                hidden++;
                continue;
            }
            let state = {};
            state.uptime = utils.twTimeStrToTimePassed(stream.started_at);
            let game = games[stream.game_id];
            state.game = {};
            if (game){
                if(!gameSpecific && hiddenGames[game.id]){
                    hidden++;
                    continue
                }
                state.game.id = game.id;
                state.game.name = game.name;
                state.game.thumb = formatHelper.setImgSize(game.thumb, 50, 60);
            }

            let thumb = stream.thumbnail_url;
            thumb = thumb.replace("{width}", "320");
            thumb = thumb.replace("{height}", "180");
            thumb = `${thumb}?time=${timeParam}`;
            state.thumb = thumb;

            state.title = stream["title"];
            // state.title = utils.escape(stream["title"]);
            let viewers = stream["viewer_count"].toString();
            viewers = utils.readableNumber(viewers);

            state.viewers = viewers;

            let channel = stream["user_name"];
            state.channel = channel;
            state.userId = stream.user_id;

            state.playerUrl = `player.html?channel=${encodeURIComponent(channel)}&channelID=${stream["user_id"]}`;

            formated.push(state);
        }
        return formated;
    }

    gqlStreams(data){
        const timeParam = formatHelper.getThumbTimeParam();
        const formated = [];
        let stream;
        for (stream of data){
            stream = stream.node;
            let state = {};
            if (stream.type != "live") continue;
            // state.type = stream.type;
            // state.uptime = utils.twTimeStrToTimePassed(stream.started_at);
            state.game = {};
            if (stream.game){
                state.game.id = stream.game.id;
                state.game.name = stream.game.displayName;
                state.game.thumb = stream.game.boxArtURL;
            }

            let thumb = stream.previewImageURL;
            thumb = thumb.slice(0,thumb.length-11) + "320x180.jpg";
            thumb = `${thumb}?time=${timeParam}`;
            state.thumb = thumb;

            state.title = stream.title;
            // if (state.type != "live") console.log(state.type);
            let viewers = stream.viewersCount.toString();
            viewers = utils.readableNumber(viewers);
            state.viewers = viewers;

            let channel = stream.broadcaster.login;
            state.login = channel;
            state.channel = stream.broadcaster.displayName;
            state.userId = stream.broadcaster.id;
            state.channelProfileImg = stream.broadcaster.profileImageURL;

            state.playerUrl = `player.html?channel=${channel}&channelID=${stream.broadcaster.id}`;

            formated.push(state);
        }
        return formated;

    }

    async topGamesHelix(data){
        const {hiddenGames, favourites} = await utils.storage.getMultiple(["hiddenGames", "favourites"]);

        let game;
        for (game of data){
            let thumb = game.box_art_url;
            thumb = thumb.replace("{width}", "285");
            thumb = thumb.replace("{height}", "380");
            game.thumb = thumb;
            game.hidden = hiddenGames[game.id] && true || false;
            game.faved = favourites.games[game.id] && true || false;
        }
        return data;
    }

    hiddenGames(data){
        let game, thumb;
        for (game of data){
            thumb = game.thumb.replace("{width}", "285");
            thumb = thumb.replace("{height}", "380");
            game.thumb = thumb;
            game.hidden = true;
        }
        return data;
    }

    async favGames(data){
        const hiddenGames = await utils.storage.getItem("hiddenGames");

        let game;
        for (game of data){
            game.thumb = game.thumb.replace("{width}", "285").replace("{height}", "380");
            game.hidden = hiddenGames[game.id] && true || false;
            game.faved = true;
        }
        return data;
    }
}

const dataFormater = new DataFormater();

export {dataFormater, formatHelper};
