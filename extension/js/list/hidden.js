import { h, Component, render, createRef } from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';

import {utils} from '../utils/utils.js';
import {helixApi} from '../api/twitch/helix.js';

const html = htm.bind(h);


class HiddenGames{
    constructor(){
        this.ready = this.populate();
        this.hiddenSet = new Set();
        // TODO: listen to route change and repopulate then
    }

    async populate(){
        let hidden = await utils.storage.getItem("hiddenGames");

        this.hiddenSet = new Set(Object.keys(hidden));
    }

    isHidden(id){
        return this.hiddenSet.has(id);
    }

    add(id){
        this.hiddenSet.add(id);
        utils.storage.addHiddenGame(id);
    }

    remove(id){
        this.hiddenSet.delete(id);
        utils.storage.removeHiddenGame(id);
    }
}

const hiddenGames = new HiddenGames();


class HiddenList extends Component{
    constructor(props){
        super(props);
        this.state = {
            "channels": hiddenGames.hiddenSet
        }
    }

    handleRemove = e=>{

    }

    render(props, state){
        return html`
            <div onClick=${this.handleFav} class="channel-title__fav${state.faved ? ' channel-title__fav--faved': ''}">
                <svg class="" width="28px" height="28px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M13.535 3C11.998 3 10.767 4.046 10 4.937 9.232 4.046 8.002 3 6.465 3 3.535 3 2 5.347 2 7.665c0 3.683 4.762 7.488 6.808 8.954a2.047 2.047 0 0 0 2.383 0c2.048-1.466 6.81-5.271 6.81-8.954C18 5.347 16.466 3 13.534 3" fill-rule="evenodd"></path></svg>
            </div>
        `;
    }
}


class HiddenElem extends Component{
    constructor(props){
        super(props);
        this.state = {
            "id": this.props.id,
            "gameComp": this.props.gameComponent,
            "hidden": false,
        };
    }

    componentDidMount(){
        const id = this.state.id;        
        if (!id) return;
        if(hiddenGames.isHidden(id)){
            this.setState({
                "hidden": true,
            });
            this.state.gameComp.setState({"gameHidden": true});
        }
    }

    handleElemClick = e=>{
        const id = this.state.id;        
        const hidden = this.state.hidden;
        if (!id) return;
        if (hidden){
            hiddenGames.remove(id);
        }
        else{
            hiddenGames.add(id);
        }
        this.setState({
            "hidden": !hidden
        });
        this.state.gameComp.setState({"gameHidden": !hidden});

    }

    render(props, state){
        let hiddenText = state.hidden ? 'Stop hidding this game' : 'Hide this game';

        return html`
            <span onClick=${this.handleElemClick} >
                ${hiddenText}
            </span>
        `;
    }
}


export {HiddenElem, HiddenList,hiddenGames};
