import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';

import {utils} from '../../utils/utils.js';
import {Card} from './common.js';

import {FavouriteIcon} from '../favs.js';
import {HiddenElem} from '../hidden.js';

const html = htm.bind(h);


class UserCard extends Card{
    dataFilterKeys = [
        "displayName",
    ]

    render(props, state){
        let user = state.data;

        return html`
            <div ref=${this.rootRef} class="card card--user${this.state.hidden ? ' card--hidden': ''}${state.filteredOut ? ' card--filtered-out': ''}">
                <a class="" href="#/channel/${user.id}">
                  <div class="thumb-container">
                    <div class="img-container">
                      <img class="card-thumb" src="${state.loadThumbnail ? user.thumb : ''}" />
                    </div>
                  </div>
                  <${HiddenElem} type="user" id=${user.id} component=${this} />
                  ${user.followers ? html`<div class="card__overlay video-viewers">${user.followers} Followers</div>` : ''}
                </a>
                <span class="card-action card-fav">
                    <${FavouriteIcon} ident=${user.id} type="users" />
                </span>
                <div title="${user.displayName}" class="card__title">
                    ${user.displayName} 
                </div>
            </div>
        `;
    }
}

export {
    UserCard,
}
