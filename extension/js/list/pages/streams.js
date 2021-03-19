import { h, Component, render, createRef } from '../../lib/preact.module.js';
import {route} from '../../lib/preact-router.js';
import htm from '../../lib/htm.module.js';

import {LANG_CODES, APP_NAME} from '../../constants.js';

import {utils} from '../../utils/utils.js';

import {dataFormater} from '../format.js';

import {HelixEndpoint, helixApi} from '../../api/twitch/helix.js';
import {GqlEndpoint} from '../../api/twitch/graphql.js';

import {FavouriteIcon} from '../favs.js';

import {CardsPage, ReloadButton, ResultsFilter} from './common.js';
import {StreamCard} from '../cards/stream.js';


const html = htm.bind(h);


class LiveHelix extends CardsPage{
    totalCardHeight = 299;

    endpoint = new HelixEndpoint("streams")

    async init(){
        this.games = {};


        const changes = {};
        const lang = await utils.storage.getItem("lastSetLangCode") || "";
        changes.language = lang;

       

        this.setState(changes, this.loadCallback);
    }

    handleLangChange = e=>{
        const lang = e.target.value;
        this.setState({
            "language": lang,
        }, this.loadCallback);
        utils.storage.setItem("lastSetLangCode", lang);
    }

    async getParams(){
        const params = {};
        let gameIds = this.props.gameIds;
        if(gameIds){
            gameIds = gameIds.split("|");
            params.game_ids = gameIds;
            const games = await helixApi.getGames(gameIds);
            this.games = games;
        }
        else{
            params.game_ids = [];
            this.games = [];
        }
        if(this.state.language){
            params.languages = [this.state.language];
        }
        return params;
    }

    async prepareData(data){
        return await dataFormater.helixStreams(data, Boolean(this.props.gameIds)); 
    }

    removeGame(id){
        let gameIds = this.props.gameIds.split("|");
        const idx = gameIds.indexOf(id);
        if(idx>=0){
            gameIds = gameIds.slice(0,idx).concat(gameIds.slice(idx+1));
            delete this.games[id];
            const path = gameIds.join("|");
            route(`/live${path?"/"+path:''}`);
        }
    }

    render(props, state){
        let title = "Live Channels";
        let gamesHeader = "";
        const games = Object.values(this.games);
        if (games && games.length){
            title = `${games.length == 1 ? games[0].name : games.length + " Games"} - ${title}`;
            gamesHeader = html`
            <div class="result-list-header result-list-header--h2">
                ${games.map(g=>{
                    return html`<span class="game-header-entry">
                        <${FavouriteIcon} size="21" ident=${g.id} type="games" />
                        <span class="game-header-name">${g.name}</span><span title="remove this game from the filter" onclick=${e=>this.removeGame(g.id)} class="game-header-remove">⨯</span>
                    </span>`;
                })}
            </div>
            `;
        }
        document.title = `${title} - ${APP_NAME}`;
        return html`
            <div class="result-list">
                <div class="result-top-bar">
                    <div class="result-list-header result-list-header--h1">
                        Live Channels
                    </div>
                    <div class="result-actions result-actions--left">
                        <div class="stream-lang-selector result-action">
                            <select onChange=${this.handleLangChange} value=${state.language}>
                                <option value="">All Languages</option>
                                ${LANG_CODES.map(langObj=>{
                                    let [value, text] = [langObj.code,langObj.name];
                                    return html`<option value=${value}>${text}</option>`;

                                })}
                            </select>
                        </div>
                    </div>
                    <div class="result-actions result-actions--right">
                        <${ReloadButton} handleReload=${this.handleReload} />
                        <${ResultsFilter} parent=${this} />
                    </div>
                </div>
                ${gamesHeader}
                <div class="card-list card-list--live">
                    ${state.entities.map((e,i)=>{
                        return html`
                            <${StreamCard} key=${i} data=${e} filterQuery=${this.state.filterQuery} />
                        `;
                    })}
                </div>
            </div>
        `;
    }
}
// class LiveHelix extends Live{

//     async prepareData(data){
//         return await dataFormater.helixStreams(data); 
//     }
// }

// class LiveHelixGames extends LiveHelix{

//     constructor(props){
//         super(props);
//         this.state["gameIds"] = this.props.gameIds;
//         this.state["games"] = [];
//     }

//     async prepareData(data){
//         return await dataFormater.helixStreams(data, true); 
//     }

//     async getParams(){
//         const params = await super.getParams(); 
//         let gameIds;
//         if (this.state.gameIds){
//             gameIds = this.state.gameIds.split("|");
//             helixApi.getGames(gameIds).then(games=>{
//                 this.setState({
//                     "games": Object.values(games).map(g=>g.name)
//                 });
//             });
//         }
//         else{
//             gameIds = [];
//         }
//         params.game_ids = gameIds;
//         return params;
//     }
// }

// class LiveGql extends Live{
//     endpoint = new GqlEndpoint("directory")

//     constructor(props){
//         super(props);
//         this.state["game"] = this.props.game
//         this.state["games"] = [this.props.game]
//     }

//     async prepareData(data){
//         return await dataFormater.gqlStreams(data); 
//     }

//     async getParams(){
//         if(this.state.game){
//             return {
//                 "name": this.state.game
//             }
//         }
//         return;
//     }
// }

// class GameGql extends Live{
//     endpoint = new GqlEndpoint("game")

//     constructor(props){
//         super(props);
//         this.state["game"] = this.props.game
//     }

//     async prepareData(data){
//         return await dataFormater.gqlStreams(data); 
//     }

//     async getParams(){
//         return {
//             "name": this.state.game
//         }
//     }
// }

export {
    // LiveGql,
    LiveHelix,
    // GameGql,
    // LiveHelixGames,
}
