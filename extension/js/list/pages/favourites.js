import {APP_NAME} from '../../constants.js';
import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';

import {utils} from '../../utils/utils.js';

import {dataFormater} from '../format.js';

import {HelixEndpoint, helixApi} from '../../api/twitch/helix.js';
import {GqlEndpoint} from '../../api/twitch/graphql.js';

import {FavouriteIcon} from '../favs.js';
import {ReloadButton, ResultsFilter} from './common.js';

import {UserCard} from '../cards/user.js';
import {StreamCard} from '../cards/stream.js';
import {GameCard} from '../cards/game.js';



const html = htm.bind(h);

const liveUsersEndpoint = new HelixEndpoint("userStreams");

class FavouritesPage extends Component{

    constructor(props){
        super(props);
        this.state = {
            "users": [],
            "games": [],
            "liveFavs": [],
        }
    }

    componentDidMount(){
        this.getFavs();
    }

    handleReload = e=>{
        this.getFavs();
    }

    async getFavs(){
        let favourites = await utils.storage.getItem("favourites");

        let liveFavs = [];
        let users = Object.keys(favourites.users).sort();
        if (users.length){
            users.splice(100); // max 100 favs for now to only make one api call for livestreams
            liveFavs = await liveUsersEndpoint.call({
                "ids": users,
            });
            liveFavs = await dataFormater.helixStreams(liveFavs);
            users = await helixApi.getUsers(users);

            users = Object.values(users);
        }


        let games = Object.keys(favourites.games).sort();
        if(games.length){
            games = await helixApi.getGames(games);
            games = await dataFormater.favGames(
                Object.values(
                    games
                )
            );
        }
        this.setState({
            "liveFavs": liveFavs,
            "users": users,
            "games": games,
        });
    }

    render(props, state){
        document.title = `Favourites - ${APP_NAME}`;

        return html`
            <div class="result-list">
                <div class="result-top-bar">
                    <div class="result-list-header result-list-header--h1">
                        Favourites
                    </div>
                    <div class="result-actions result-actions--right">
                        <${ReloadButton} handleReload=${this.handleReload} />
                        <${ResultsFilter} parent=${this} />
                    </div>
                </div>
                ${  
                    state.liveFavs.length ?
                    html`
                    <div class="result-list-header result-list-header--h2">
                        Livestreams
                    </div>
                    <div class="card-list card-list--streams">
                        ${state.liveFavs.map((e,i)=>{
                            return html`
                                <${StreamCard} key=${i} data=${e} filterQuery=${this.state.filterQuery} />
                            `;
                        })}
                    </div>` : ''
                }
                ${  
                    state.users.length ?
                    html`
                    <div class="result-list-header result-list-header--h2">
                        Channels
                    </div>
                    <div class="card-list card-list--users">
                        ${state.users.map((e,i)=>{
                            return html`
                                <${UserCard} key=${i} data=${e} filterQuery=${this.state.filterQuery} />
                            `;
                        })}
                    </div>` : ''
                }
                ${  
                    state.games.length ?
                    html`
                    <div class="result-list-header result-list-header--h2">
                        <a href="#/live/${state.games.slice(0,100).map(g=>g.id).join("|")}">Games</a>
                    </div>
                    <div class="card-list card-list--games">
                    ${state.games.map((e,i)=>{
                        return html`
                            <${GameCard} key=${i} data=${e} filterQuery=${this.state.filterQuery} />
                        `;
                    })}
                    </div>` : ''
                }
            </div>
        `;
    }
}

export {
    FavouritesPage,
}
