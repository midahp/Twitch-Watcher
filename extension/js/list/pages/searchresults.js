import {APP_NAME} from '../../constants.js';
import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';

import {utils} from '../../utils/utils.js';


import {v5Api, clipsEndpoint} from '../../api/twitch/v5.js';
import {HelixEndpoint, helixApi} from '../../api/twitch/helix.js';
import {GqlEndpoint, gqlApi} from '../../api/twitch/graphql.js';

import {dataFormater} from '../format.js';
import {FavouriteIcon} from '../favs.js';

import {CardsPage} from './common.js';

import {UserCard} from '../cards/user.js';
import {GameCard} from '../cards/game.js';
import {VideoCard} from '../cards/video.js';


const html = htm.bind(h);


class SearchResults extends Component{
    constructor(props){
        super(props);
        this.state = {
            "users": [],
            "games": [],
            "videos": [],
        };
    }

    componentDidMount(){
        this.getData();

    }

    componentDidUpdate(prevProps) {
        if (this.props.query !== prevProps.query) {
            this.getData();
        }
    }

    async getData(){
        const query = this.props.query;
        if (!query) return;
        const results = await gqlApi.searchResults(query);
        const data = dataFormater.gqlSearchResults(results);
        this.setState({
            "users": data.users,
            "games": data.games,
            "videos": data.videos,
        });
    }

    render(props, state){
        document.title = `${props.query} - Search Results - ${APP_NAME}`;

        return html`
            <div class="result-list">
                <div class="result-top-bar">
                    <div class="result-list-header result-list-header--h1">
                        Search Results for '${props.query}'
                    </div>
                </div>

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
                        Games
                    </div>
                    <div class="card-list card-list--games">
                        ${state.games.map((e,i)=>{
                            return html`
                                <${GameCard} key=${i} data=${e} filterQuery=${this.state.filterQuery} />
                            `;
                        })}
                    </div>` : ''
                }

                ${  
                    state.videos.length ?
                    html`
                    <div class="result-list-header result-list-header--h2">
                        Videos
                    </div>
                    <div class="card-list card-list--videos">
                        ${state.videos.map((e,i)=>{
                            return html`
                                <${VideoCard} key=${i} data=${e} filterQuery=${this.state.filterQuery} />
                            `;
                        })}
                    </div>` : ''
                }
            </div>
        `;
    }
}

export {
    SearchResults,
}
