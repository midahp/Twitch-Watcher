import { h, Component, render, createRef } from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';

import {utils} from '../utils/utils.js';
import {helixApi} from '../api/twitch/helix.js';

const html = htm.bind(h);


class Favourites{
    constructor(){
        this.ready = this.populate();
    }

    async importUserFollows(){
        let username = await utils.dialog.prompt("Please enter your username");
        let follows;
        if(username && username.length){
            follows = await this.getUserFollows(username);
        }
        else{
            return false;
        }
        
        let returnMsg;
        if(follows){
            returnMsg = "successfully imported follows";
        }
        else{
            returnMsg = "could not import follows";
        }
        setTimeout(e=>{
            utils.dialog.alert(returnMsg);
        }, 100);
        return follows;
    }

    async getUserFollows(username, limit=25){
        let json = await helixApi.users({
            "logins": [username],
        });
        if(!json) return false;
        let users = json.data;
        if(!users || !users.length) return false;

        json = await helixApi.follows({"from_id": users[0].id});
        if(json && json.data && json.data.length){
            let followIds = json.data.map(u=>u.to_id);
            utils.storage.setFavs(followIds, "users");
            return true;
        }
        else{
            return false;
        }
    }


    async populate(){
        let favs = await utils.storage.getItem("favourites");
        // const users = Object.keys(favs.users).sort();
        // const games = Object.keys(favs.games).sort();

        this.favs = {
            "users": favs.users,
            "games": favs.games,
        }
    }

    isFaved(ident, type="users"){
        return Boolean(this.favs[type][ident]);
    }

    add(ident, type){
        this.favs[type][ident] = true;
        utils.storage.setFav(ident, type);
    }

    remove(ident, type="users"){
        delete this.favs[type][ident];
        utils.storage.unsetFav(ident, type);
    }
}

const favourites = new Favourites();



class FavouriteIcon extends Component{
    constructor(props){
        super(props);
        this.state = {
            "ident": this.props.ident,
            "faved": false,
            "type": this.props.type,
        };
    }

    componentDidMount(){
        this.setInitial();
    }

    async setInitial(){
        const type = this.state.type;
        const ident = this.state.ident;        
        if (!ident) return;
        await favourites.ready;
        if(favourites.isFaved(ident,type)){
            this.setState({
                "faved": true,
            });
        }
    }

    handleFavClick = e=>{
        const ident = this.state.ident;        
        const faved = this.state.faved;
        const type = this.state.type;
        if (!ident) return;
        if (faved){
            favourites.remove(ident,type);
        }
        else{
            favourites.add(ident,type);
        }
        this.setState({
            "faved": !faved
        });
    }

    render(props, state){
        let title;
        if(state.faved){
            title = "Remove this from your favourites";
        }
        else{
            title = "Add this to your favourites";
        }
        return html`
            <span title="${title}" onClick=${this.handleFavClick} class="channel-title__fav${state.faved ? ' channel-title__fav--faved': ''}">
                <svg class="" width="28px" height="28px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M13.535 3C11.998 3 10.767 4.046 10 4.937 9.232 4.046 8.002 3 6.465 3 3.535 3 2 5.347 2 7.665c0 3.683 4.762 7.488 6.808 8.954a2.047 2.047 0 0 0 2.383 0c2.048-1.466 6.81-5.271 6.81-8.954C18 5.347 16.466 3 13.534 3" fill-rule="evenodd"></path></svg>
            </span>
        `;
    }
}


export {FavouriteIcon,favourites};
