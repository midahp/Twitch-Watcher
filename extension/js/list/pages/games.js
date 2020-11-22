import {APP_NAME} from '../../constants.js';
import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';
import {route} from '../../lib/preact-router.js';

import {utils} from '../../utils/utils.js';

import {dataFormater} from '../format.js';

import {v5Api, clipsEndpoint} from '../../api/twitch/v5.js';
import {HelixEndpoint, helixApi} from '../../api/twitch/helix.js';
import {GqlEndpoint} from '../../api/twitch/graphql.js';

import {FavouriteIcon} from '../favs.js';

import {CardsPage, ReloadButton, ResultsFilter} from './common.js';
import {GameCard} from '../cards/game.js';


const html = htm.bind(h);



class Games extends CardsPage{
    endpoint = new HelixEndpoint("topGames");

    async prepareData(data){
        return await dataFormater.topGamesHelix(data);
    }

    render(props, state){
        document.title = `Top Games - ${APP_NAME}`;
        let renderedEntities = 0;
        return html`
            <div class="result-list">
                <div class="result-top-bar">
                    <div class="result-list-header result-list-header--h1">
                        Top Games
                    </div>
                    <div class="result-actions result-actions--right">
                        <${ReloadButton} handleReload=${this.handleReload} />
                        <${ResultsFilter} parent=${this} />
                    </div>
                </div>
                <div class="card-list card-list--games">
                ${state.entities.map((e,i)=>{
                    return html`
                        <${GameCard} key=${i} data=${e} filterQuery=${this.state.filterQuery} />
                    `;
                })}
                </div>
            </div>
        `;
    }}

class HiddenGames extends Component{
    constructor(props){
        super(props);
        this.state = {
            "games": []
        }
    }

    componentDidMount(){
        const catchHiddenGames = async ()=>{
            let hiddenGames = await utils.storage.getItem("hiddenGames");
            hiddenGames = Object.keys(hiddenGames);
            let games = await helixApi.getGames(hiddenGames);
            games = await dataFormater.hiddenGames(Object.values(games));

            this.setState({
                "games": games,
            });
        }
        catchHiddenGames();        
    }

    render(props, state){
        document.title = `Hidden Games - ${APP_NAME}`;
        return html`
            <div class="result-list">
                <div class="result-top-bar">
                    <div class="result-list-header result-list-header--h1">
                        Hidden Games
                    </div>
                </div>
                <div class="card-list card-list--games">
                    ${state.games.map((g,i)=>{
                        return html`
                            <${GameCard} key=${i} data=${g} />
                        `;
                    })}
                </div>
            </div>
        `;
    }
}


export {
    Games,
    HiddenGames,
}
