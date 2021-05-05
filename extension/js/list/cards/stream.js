
import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';

import {utils} from '../../utils/utils.js';
import {Card} from './common.js';
import {HiddenElem} from '../hidden.js';


const html = htm.bind(h);


class StreamCard extends Card{
    dataFilterKeys = [
        "title",
        "channel",
        "game.name",
    ]

    render(props, state){
        let stream = state.data;

        return html`
            <div ref=${this.rootRef} class="card card--stream${this.state.hidden ? ' card--hidden': ''}${state.filteredOut ? ' card--filtered-out': ''}">
                <a class="ext-player-link" href="${stream.playerUrl}" target="_blank">
                  <div class="thumb-container">
                    <div class="img-container">
                      <img class="card-thumb" src="${state.loadThumbnail ? stream.thumb : ''}" />
                    </div>
                  </div>
                  <${HiddenElem} type="user" id=${stream.userId} component=${this} />
                  <div class="card__overlay video-viewers">${stream.viewers} viewers</div>
                  <div class="card__overlay video-length">${stream.uptime}</div>
                </a>
                <div class="card__logo">
                    <a href="#/live/${stream.game.id || ''}">
                        <img src="${stream.game.thumb || ''}" alt="" />
                    </a>
                </div>
                <div title="${stream.title || 'Untitled Broadcast'}" class="card__title">
                    ${stream.title || 'Untitled Broadcast'} 
                </div>
                <div class="card__name">
                    <a href="#/channel/${stream.userId}">${stream.channel}</a>
                </div>
                <div class="card__game">
                  <a href="#/live/${stream.game.id || ''}">
                    ${stream.game.name}
                  </a>
                </div>
            </div>
        `;
    }
}

export {
    StreamCard,
}
