import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';

import {watchLater,WatchLaterIcon} from '../watchlater.js';
import {utils} from '../../utils/utils.js';
import {Card} from './common.js';


const html = htm.bind(h);



class WatchLaterCard extends Card{
    dataFilterKeys = [
        "title",
    ]

    constructor(props) {
        super(props);
        this.removeHandler = this.props.removeHandler;
        this.parentIdx = this.props.idx;
    }

    handleRemoveThis = e => {
        watchLater.remove(this.state.data.id);
        this.removeHandler(this.parentIdx);
    }

    render(props, state){
        let video = state.data;
        const wlTitel = "Remove from Watch Later list";
        const wlIcon = "added-icon.png";


        return html`
            <div ref=${this.rootRef} class="card card--video${state.filteredOut ? ' card--filtered-out': ''}">
                <a class="ext-player-link" href="player.html?vid=${video.id}" target="_blank">
                  <div class="thumb-container">
                    <div class="img-container">
                      <img class="card-thumb" src="${state.loadThumbnail ? video.thumb : ''}" />
                    </div>
                    <div class="resume-bar" style="width:${video.resumeBarWidth}%"></div>
                  </div>
                  <div class="card__overlay video-viewers">${video.views} views</div>
                  <div class="card__overlay video-length">${video.length}</div>
                </a>
                <div title="${video.title}" class="card__title">${video.title}</div>
                <div class="card__name">
                    <a href="#/channel/${video.user.id}">${video.user.displayName}</a>
                </div>
                <div class="card__game">
                  <a href="#/live/${encodeURIComponent(video.game)}">
                    ${video.game}
                  </a>
                </div>
                <div class="card__date">${video.when}</div>
                <${WatchLaterIcon} id=${video.id} removeHandler=${this.handleRemoveThis} />
            </div>
        `;
    }
}

export {
    WatchLaterCard,
}
