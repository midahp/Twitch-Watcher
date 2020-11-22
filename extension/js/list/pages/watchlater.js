import {APP_NAME} from '../../constants.js';
import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';
import {route} from '../../lib/preact-router.js';

import {utils} from '../../utils/utils.js';

import {dataFormater} from '../format.js';

import {HelixEndpoint, helixApi} from '../../api/twitch/helix.js';
import {GqlEndpoint} from '../../api/twitch/graphql.js';

import {watchLater} from '../watchlater.js';

import {CardsPage, ResultsFilter} from './common.js';
import {WatchLaterCard} from '../cards/watchlater.js';


const html = htm.bind(h);


class WatchLaterPage extends CardsPage{
    endpoint = new HelixEndpoint("videos");

    async prepareData(data){
        return await dataFormater.helixVideos(data);
    }

    async getParams(){
        await watchLater.ready;
        let vIds = watchLater.videos;
        if (!vIds.length) return false;
        return {
            "vIds": vIds,
        };
    }

    removeHandler = key=>{
        const entities = this.state.entities;
        this.setState({
            "entities": entities.slice(0,key).concat(entities.slice(key+1))
        });
    }

    render(props, state){
        document.title = `Watch Later - ${APP_NAME}`;
        return html`
            <div class="result-list">
                <div class="result-top-bar">
                    <div class="result-list-header result-list-header--h1">
                        Watch Later
                    </div>
                    <div class="result-actions result-actions--right">
                        <${ResultsFilter} parent=${this} />
                    </div>
                </div>
                <div class="card-list card-list--video">
                ${state.entities.map((e,i)=>{
                    return html`
                        <${WatchLaterCard} key=${i} data=${e} idx=${i} removeHandler=${this.removeHandler} filterQuery=${this.state.filterQuery} />
                    `;
                })}
                </div>
            </div>
        `;
    }
}

export{
    WatchLaterPage,
}
