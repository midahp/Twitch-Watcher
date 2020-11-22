import { h, Component, render, createRef } from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';


import {settings} from '../settings.js';
import {Pagination} from '../utils/pagination.js';
import {utils} from '../utils/utils.js';

const html = htm.bind(h);


class WatchLater{
    constructor(){
        this.ready = this.get();
    }

    async get(){
        this.videos = await utils.storage.getItem("watchlater");
        return this.videos;
    }

    set(){
        utils.storage.setItem("watchlater", this.videos);
    }

    contains(id){
        return this.videos.indexOf(id)>=0;
    }

    add(id){
        this.get().then(wl=>{
            if(this.videos.indexOf(id)<0){
                this.videos.unshift(id);
                this.set();
            }
        });
    }

    remove(id){
        this.get().then(wl=>{
            let index = this.videos.indexOf(id);
            if(index >= 0){
                this.videos.splice(index, 1);
                this.set();
            }
        });
    }
}

const watchLater = new WatchLater();


class WatchLaterIcon extends Component{
    constructor(props){
        super(props);
        this.state = {
            "id": this.props.id,
            "added": false,
        };
        this.removeHandler = props.removeHandler;
    }

    componentDidMount(){
        this.getAdded();
    }

    async getAdded(){
        await watchLater.ready;
        const id = this.state.id;        
        if (!id) return;
        if(watchLater.contains(id)){
            this.setState({
                "added": true,
            });
        }
    }

    handleElemClick = e=>{
        if(this.removeHandler) {
            this.removeHandler();
            return;
        }
        const id = this.state.id;        
        const added = this.state.added;
        if (!id) return;
        if (added){
            watchLater.remove(id);
        }
        else{
            watchLater.add(id);
        }
        this.setState({
            "added": !added
        });
    }

    render(props, state){
        let wlTitel, wlIcon;
        if(state.added){
            wlTitel = "Remove from Watch Later list";
            wlIcon = "remove-icon.png";
        }
        else{
            wlTitel = "Add to Watch Later list";
            wlIcon = "add-icon.png";
        }

        return html`
            <div onClick=${this.handleElemClick} title="${wlTitel}" class="card__overlay video-wl">
                <img src="/resources/icons/${wlIcon}" />
            </div>
        `;
    }
}

export {watchLater, WatchLaterIcon};
