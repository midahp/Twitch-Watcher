import {AbstractApi} from './core.js';
import knownTags from './tags.js';
import {utils} from '../../utils/utils.js';
import {settings} from '../../settings.js';


const url = "https://gql.twitch.tv/gql";
const headers = {
    "accept": "*/*",
    "accept-language": "en-US",
    "client-id": settings.clientId,
    "content-type": "text/plain;charset=UTF-8",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "x-device-id": "28669fc35c2ae279"
};



class GraphqlApi{

    constructor(){
    }

    async fetch(body){
        body = JSON.stringify(body);
        let response = await fetch(url, {
          "headers": headers,
          "referrer": "https://player.twitch.tv",
          "referrerPolicy": "no-referrer-when-downgrade",
          "body": body,
          "method": "POST",
          "mode": "cors",
          "credentials": "omit"
        });
        return await response.json();
    }

    async makeQuery(query){
        let body = {"query": query};
        try{
            return await this.fetch(body);
        }
        catch(err){
            utils.error(err);
        }

    }

    // async persistedQuery(body){
    //     return await this.fetch(body);
    // }

    async *game({limit=30, name, tagNames=["english"]}={}){
        const tags = tagNames.map(n=>knownTags[n]);
        const body = [{
            'operationName':'DirectoryPage_Game',
            'variables':{
                'name':name,
                'options':{
                    'sort':'VIEWER_COUNT',
                    'recommendationsContext':{'platform':'web'},
                    'requestID':'JIRA-VXP-2397',
                    'tags': tags,
                },
                'sortTypeIsRecency':false,
                'limit': limit
            },
            'extensions':{'persistedQuery':{'version':1,'sha256Hash':'5feb6766dc5d70b33ae9a37cda21e1cd7674187cb74f84b4dd3eb69086d9489c'}}
        }];

        let json, edges, hasNextPage;
        while (true){
            try{
                json = await this.fetch(body);
                edges = json[0].data.game.streams.edges;
                yield edges;
                hasNextPage = json[0].data.game.streams.pageInfo.hasNextPage;
                if (hasNextPage){
                    body[0].variables.cursor = edges[edges.length-1].cursor;
                }
                else{
                    break;
                }
            }
            catch(err){
                console.log(err);
                break;
            }
        }


    }

    async accessToken(type, id){
        const vars = {
            "login": "",
            "vodID": "",
            "isLive": false,
            "isVod": false,
            "playerType": "site",
        };
        let login, vodID, isLive, isVod, playerType;
        if(type == "live"){
            vars.login = id;
            vars.playerType = "embed";
            vars.isLive = true;
        }
        else if(type == "vod"){
            vars.vodID = id;
            vars.isVod = true;
        }
        const body = [{
            "operationName":"PlaybackAccessToken",
            "variables": vars,
            "extensions":
            {
                "persistedQuery":{
                    "version":1,
                    "sha256Hash":"0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712"
                }
            }
        }];

        const json = await this.fetch(body);
        const data = type=="live" ? json[0].data.streamPlaybackAccessToken : json[0].data.videoPlaybackAccessToken;
        return {
            "sig": data.signature,
            "token": data.value,
        }
    }

    async getVideoManifestUrl(vId){
        const authP = await this.accessToken("vod", vId);
        const url = utils.buildUrl(`https://usher.ttvnw.net/vod/${vId}.m3u8`, {
            "p": parseInt(Math.random() * 999999),
            "player_backend": "mediaplayer",
            "cdm": "wv",
            "player_version": "1.2.0",
            // "play_session_id": "72217a1beb625beb3d69246e574a1403"
            "fast_bread": true,
            "allow_source": true,
            "sig": authP.sig,
            "token": authP.token,
        });
        return url;
    }

    async getStreamManifestUrl(sId){
        const authP = await this.accessToken("live", sId);
        const url = utils.buildUrl(`https://usher.ttvnw.net/api/channel/hls/${sId.toLowerCase()}.m3u8`, {
            "p": parseInt(Math.random() * 999999),
            "player_backend": "mediaplayer",
            "cdm": "wv",
            "player_version": "1.2.0",
            // "play_session_id": "72217a1beb625beb3d69246e574a1403"
            "fast_bread": true,
            "allow_source": true,
            "sig": authP.sig,
            "token": authP.token,
        });
        return url;
    }


    async *directory({limit=100, tagNames=["english"]} = {}){
        const tags = tagNames.map(n=>knownTags[n]);
        const body = [{
            'operationName': 'BrowsePage_Popular',
            'variables':{
                'limit': limit,
                'platformType':'all',
                'options':{
                    'sort':'VIEWER_COUNT',
                    'tags': tags,
                    'recommendationsContext':{'platform':'web'},
                    'requestID':'JIRA-VXP-2397'
                },
                'sortTypeIsRecency':false
            },
            'extensions':{'persistedQuery':{'version':1,'sha256Hash':'c3322a9df3121f437182beb5a75c2a8db9a1e27fa57701ffcae70e681f502557'}}
        }];

        let json, edges, hasNextPage;
        while (true){
            try{
                json = await this.fetch(body);
                edges = json[0].data.streams.edges;
                yield edges;
                hasNextPage = json[0].data.streams.pageInfo.hasNextPage;
                if (hasNextPage){
                    body[0].variables.cursor = edges[edges.length-1].cursor;
                }
                else{
                    break;
                }
            }
            catch(err){
                console.log(err);
                break;
            }
        }
    }

    async searchSuggestions(queryFragment){
        const body = [{
            'operationName': 'SearchTray_SearchSuggestions',
            'variables':{
                'queryFragment': queryFragment,
                'platformType':'all',
                'requestID':'59a1675e-8af9-46d5-bbf6-a95682a3d225',
            },
            'extensions':{'persistedQuery':{'version':1,'sha256Hash':'2a747ed872b1c3f56ed500d097096f0cf8d365d2d5131cbdc170ae502f9b406a'}}
        }];
    }

    async *searchResultsIter(query){
        const target = {
                'index': "",
                'cursor': "",
        }
        const options = {
            'targets': [target]
        }
        const body = [{
            'operationName': 'SearchResultsPage_SearchResults',
            'variables':{
                'query': query,
                'options': null,
            },
            'extensions':{'persistedQuery':{'version':1,'sha256Hash':'f53adcad1609913933a232e2782d9d667c2417806c081b653d61b1e601c4c8e2'}}
        }];

        const typeToIndex = {
            "channels": "CHANNEL",
            "videos": "VOD",
            "games": "GAME",
        }


        let json = await this.fetch(body);
        let results = json[0].data.searchFor;
        const cursors = {
            "channels": results.channels.cursor,
            "videos": results.videos.cursor,
            "games": results.games.cursor,
        }

        const total = {
            "channels": results.channels.totalMatches,
            "videos": results.videos.totalMatches,
            "games": results.games.totalMatches,
        }

        body[0].variables.options = options;
        let type;
        while (true){
            try{
                type = yield results;
                if (!type) continue;
                target.index = typeToIndex[type];
                target.cursor = cursors[type];
                if(!target.cursor){
                    results = false;
                    continue;
                }
                json = await this.fetch(body);
                results = json[0].data.searchFor;

                cursors[type] = results[type].cursor;
                total[type] = results[type].totalMatches;
            }
            catch(err){
                console.log(err);
                break;
            }
        }
    }

    async searchResults(query){
        const body = [{
            'operationName': 'SearchResultsPage_SearchResults',
            'variables':{
                'query': query,
                'options':null,
            },
            'extensions':{'persistedQuery':{'version':1,'sha256Hash':'f53adcad1609913933a232e2782d9d667c2417806c081b653d61b1e601c4c8e2'}}
        }];

        const json = await this.fetch(body);
        const results = json[0].data.searchFor;
        return results
    }

    async badges(channel){
        const body = [{
            "operationName":"ChatList_Badges",
            "variables":{
                "channelLogin":channel
            },
            "extensions":{"persistedQuery":{"version":1,"sha256Hash":"86f43113c04606e6476e39dcd432dee47c994d77a83e54b732e11d4935f0cd08"}}
        }];
        const json = await this.fetch(body);

        try{
            return json[0].data.user.broadcastBadges[0];
        }
        catch(err){
            return undefined;
        }
    }


    clipQuery(slug){
        return `{
            clip(slug: "${slug}") {
                broadcaster {
                    displayName
                }
                title
                durationSeconds
                videoQualities {
                    quality
                    sourceURL
                }
            }
        }`;
    }

    userQuery(name){
        return `
            user(login: "${name}") {
                id
                displayName
                description
                createdAt
                roles {
                  isPartner
                }
                stream {
                  id
                  title
                  type
                  viewersCount
                  createdAt
                  game {
                    name            
                  }
                }
            }
        `;
    }

    streamsQuery(first=30){
        return `
          streams(first: ${first}) {
            edges {
              node {
                id
                title
                viewersCount
                broadcaster {
                  displayName
                }
                game {
                  name
                }
              }
            }       
          }
        `;
    }

    clipsQuery(period="LAST_MONTH"){
        return `
            clips(criteria: { period: ${period} }) {
                edges {
                    node {
                        id
                        title
                        viewCount
                        createdAt
                        durationSeconds
                        curator {
                            login
                        }
                        broadcaster {
                            login
                        }
                    }
                }
            }
        `;
    }

    videosQuery(sortBy="VIEWS"){
        return `
            videos(sort: ${sortBy}) {
                edges {
                    node {
                        id
                        creator {
                            login
                        }
                        title
                        viewCount
                        createdAt
                        lengthSeconds
                        broadcastType
                    }
                }
            }
        `;
    }

    gameQuery(game, queries){
        queries = queries || [];
        return `
            game(name: ${game}) {
                name
                viewersCount
                ${queries.join("\n")}
            }            
        `;
    }
}

const gqlApi = new GraphqlApi();

class GqlEndpoint{
    constructor(endpoint){
        this.endpoint = endpoint;
    }

    async call(params){
        this.iter = gqlApi[this.endpoint](params);
        let {value, done} = await this.iter.next();
        // console.log("value, done:", value, done);
        this.done = done;
        return value;
    }

    async next(){
        if (this.done) return;
        let {value, done} = await this.iter.next();
        // console.log("value, done:", value, done);
        this.done = done;
        return value;
    }
}


class GqlQueryEndpoint{
   constructor(endpoint){
       this.endpoint = endpoint;
   }

   async call(params, x){
       this.iter = gqlApi[this.endpoint](params);
       let {value, done} = await this.iter.next(x);
       this.done = done;
       return value;
   }

   async next(x){
       if (this.done) return;
       let {value, done} = await this.iter.next(x);
       // console.log("value, done:", value, done);
       this.done = done;
       return value;
   } 
}
export {GqlEndpoint, gqlApi};
