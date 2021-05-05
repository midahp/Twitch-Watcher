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

class HiddenStreams{
    constructor(){
        this.ready = this.populate();
        this.hiddenSet = new Set();
        // TODO: listen to route change and repopulate then
    }

    async populate(){
        let hidden = await utils.storage.getItem("hiddenStreams");
        this.hiddenList = Object.keys(hidden);
        this.hiddenSet = new Set(this.hiddenList);
    }

    isHidden(id){
        return this.hiddenSet.has(id);
    }

    add(id){
        this.hiddenSet.add(id);
        utils.storage.addHiddenStream(id);
    }

    remove(id){
        this.hiddenSet.delete(id);
        utils.storage.removeHiddenStream(id);
    }
}

const hiddenStreams = new HiddenStreams();


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

        if (this.props.type == "game"){
            this.hiddenManager = hiddenGames;
        }
        else {
            this.hiddenManager = hiddenStreams;
        }
        this.type = this.props.type
        this.state = {
            "id": this.props.id,
            "component": this.props.component,
            "hidden": false,
        };
    }

    componentDidMount(){
        const id = this.state.id;        
        if (!id) return;
        if(this.hiddenManager.isHidden(id)){
            this.setState({
                "hidden": true,
            });
            this.state.component.setState({"hidden": true});
        }
    }

    handleElemClick = e=>{
        e.preventDefault();
        const id = this.state.id;        
        const hidden = this.state.hidden;
        if (!id) return;
        if (hidden){
            this.hiddenManager.remove(id);
        }
        else{
            this.hiddenManager.add(id);
        }
        this.setState({
            "hidden": !hidden
        });
        this.state.component.setState({"hidden": !hidden});

    }

    render(props, state){
        let componentName = this.props.type;
        let hiddenText = state.hidden ? ('Stop hiding this '+componentName) : ('Hide this '+componentName);

        return html`
        <span onClick=${this.handleElemClick} class="card-action card-hide">
            <span>
                ${hiddenText}
            </span>
        </span>
        `;
    }
}


export {HiddenElem, HiddenList, hiddenGames, hiddenStreams};
