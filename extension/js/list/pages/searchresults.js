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
            "channels": [],
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
        this.endpoint = gqlApi.searchResultsIter(query);
        let {value, done} = await this.endpoint.next();
        if(!value) return;
        const data = dataFormater.gqlSearchResults(value);
        this.setState({
            "channels": data.channels,
            "games": data.games,
            "videos": data.videos,
        });
    }

    async loadMore(type){
        document.body.classList.add("loading");
        let {value, done} = await this.endpoint.next(type);
        if(!value || done){
            document.body.classList.remove("loading");
            return;
        }
        const data = dataFormater.gqlSearchResults(value);
        this.setState((state, props)=>{
            let s = {
                ...state,
            };
            s[type] = s[type].concat(data[type]);
            return s;
        });
        document.body.classList.remove("loading");
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
                    state.channels.length ?
                    html`
                    <div class="result-list-header result-list-header--h2">
                        Channels
                    </div>
                    <div class="card-list card-list--users">
                        ${state.channels.map((e,i)=>{
                            return html`
                                <${UserCard} key=${i} data=${e} filterQuery=${this.state.filterQuery} />
                            `;
                        })}
                    </div>
                    <div class="load-more-button" onClick=${e=>this.loadMore("channels")}>Load More</div>` : ''
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
                    </div>
                    <div class="load-more-button" onClick=${e=>this.loadMore("games")}>Load More</div>` : ''
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
                    </div>
                    <div class="load-more-button" onClick=${e=>this.loadMore("videos")}>Load More</div>` : ''
                }
            </div>
        `;
    }
}

export {
    SearchResults,
}
