import {APP_NAME} from '../../constants.js';
import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';
import {route} from '../../lib/preact-router.js';

import {utils} from '../../utils/utils.js';

import {dataFormater} from '../format.js';

import {HelixEndpoint, helixApi} from '../../api/twitch/helix.js';
import {GqlEndpoint} from '../../api/twitch/graphql.js';

import {FavouriteIcon} from '../favs.js';

import {CardsPage, ReloadButton, ResultsFilter} from './common.js';
import {VideoCard} from '../cards/video.js';


const html = htm.bind(h);


const typeNames = {
    "archive": "Past Broadcasts",
    "highlight": "Highlights",
    "clips": "Clips",
}

const clipBackDays = {
    "1": "24h", 
    "7": "7d",
    "30": "30d",
    "0": "All",
}
const defaultClipBackDays = "7";

class Channel extends CardsPage{
    videosEndpoint = new HelixEndpoint("userVideos");
    clipsEndpoint = new HelixEndpoint("clips");

    async init(){
        let users = await helixApi.getUsers([this.props.userId]);
        if (users) this.setState({"user": users[this.props.userId]}, this.loadCallback);
    }

    readableType = ()=>{
        return typeNames[this.props.videoType];
    }

    async prepareData(data){
        if (this.props.videoType === "clips"){
            return await dataFormater.helixClips(data);
        }
        else{
            return await dataFormater.helixVideos(data);
        }
    }

    async getParams(){
        if (this.props.videoType === "clips"){
            this.endpoint = this.clipsEndpoint;

            const params = {
                "broadcaster_id": this.props.userId,
            };
            let backDays = parseInt(this.props.clipBackDays || defaultClipBackDays);
            if (backDays > 0){
                let startDate = new Date();
                startDate.setDate(startDate.getDate() - backDays);
                params["startDate"] = startDate;
                params["endDate"] = new Date();
            }
            return params;
        }
        else{
            this.endpoint = this.videosEndpoint;
            return {
                "type": this.props.videoType,
                "uid": this.props.userId,
            };
        }
    }

    handleTypeChange = e=>{
        const val = e.target.value;
        let clipsPath = "";
        if(val=="clips"){
            clipsPath = "/"+defaultClipBackDays;
        }
        route(`/channel/${this.props.userId}/${e.target.value}${clipsPath}`);
    }

    handleClipBackDaysChange = e=>{
        route(`/channel/${this.props.userId}/clips/${e.target.value}`);
    }

    render(props, state){
        const user = state.user || {};
        document.title = `${user.displayName} - ${this.readableType()} - ${APP_NAME}`;
        return html`
            <div class="result-list">
                <div class="result-top-bar">
                    <div class="result-list-header result-list-header--h1">
                        <a class="channel-title__name" target="_blank" href="/player.html?channel=${user.login}&channelID=${user.id}">${user.displayName}</a>
                        <${FavouriteIcon} ident=${props.userId} type="users" />
                    </div>
                    <div class="result-actions result-actions--left">
                        <div class="channel-type-selector result-action">
                            <select onChange=${this.handleTypeChange} value=${props.videoType}>
                                ${Object.entries(typeNames).map(([value, text])=>{
                                    return html`<option value=${value}>${text}</option>`
                                })}
                            </select>
                            <select class="${this.props.videoType!='clips'?'hidden':''}" onChange=${this.handleClipBackDaysChange} value=${props.clipBackDays}>
                                ${Object.entries(clipBackDays).map(([value, text])=>{
                                    return html`<option value=${value}>${text}</option>`
                                })}
                            </select>
                        </div>
                    </div>
                    <div class="result-actions result-actions--right">
                        <${ResultsFilter} parent=${this} />
                    </div>
                </div>
                <div class="card-list card-list--video">
                ${state.entities.map((e,i)=>{
                    return html`
                        <${VideoCard} key=${i} data=${e} filterQuery=${this.state.filterQuery} />
                    `;
                })}
                </div>
            </div>
        `;
    }
};

export {
    Channel,
}
