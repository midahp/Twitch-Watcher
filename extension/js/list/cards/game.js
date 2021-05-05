
import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';

import {utils} from '../../utils/utils.js';
import {Card} from './common.js';
import {FavouriteIcon} from '../favs.js';
import {HiddenElem} from '../hidden.js';


const html = htm.bind(h);


class GameCard extends Card{

    dataFilterKeys = [
        "name",
    ]

    render(props, state){
        let game = state.data;

        return html`
            <div ref=${this.rootRef} class="card card--game${this.state.hidden ? ' card--hidden': ''}${state.filteredOut ? ' card--filtered-out': ''}">
                <a class="" href="#/live/${game.id}">
                  <div class="thumb-container">
                    <div class="img-container">
                      <img class="card-thumb" src="${state.loadThumbnail ? game.thumb : ''}" />
                    </div>
                  </div>
                </a>
                <${HiddenElem} type="game" id=${game.id} component=${this} />
                <span class="card-action card-fav">
                    <${FavouriteIcon} ident=${game.id} type="games" />
                </span>
                <div title="${game.name || 'Unlisted'}" class="card__title">
                    ${game.name || 'Unlisted'} 
                </div>
            </div>
        `;
    }
}

export {
    GameCard,
}
