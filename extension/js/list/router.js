import { h, Component, render, createRef } from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';
import Router from '../lib/preact-router.js';
import {route} from '../lib/preact-router.js';
import { createHashHistory } from '../lib/history.js';

import {LiveHelix, HiddenUsers} from './pages/streams.js';
import {FavouritesPage} from './pages/favourites.js';
import {Channel} from './pages/channel.js';
import {Games, HiddenGames} from './pages/games.js';
import {WatchLaterPage} from './pages/watchlater.js';
import {SearchResults} from './pages/searchresults.js';

const html = htm.bind(h);


// const history = [];
const DEFAULT_ROUTE = "/live";
class DefaultHandler extends Component{
    constructor(props){
        super(props);
        route(DEFAULT_ROUTE);
    }

    render(props, state){
        return html``;
    }
}

function ChannelRedirect(props){
    route(props.url+"/archive", true);
}


const handleRouteChange = e=>{
    // const event = new CustomEvent("routeChange", {
    //     "detail": e.url,
    // });
    // window.dispatchEvent(event);
    // let url = e.url;
    // if(!url){
    //     route(historyStack.pop());
    // }
    // debugger;
    // historyStack.push(e.url);
};

export const RouterComponent = () => html`
    <${Router} history=${createHashHistory()}>
        <${LiveHelix} path="/live/:gameIds?" />
        <${FavouritesPage} path="/favourites" />
        <${ChannelRedirect} path="/channel/:userId" />
        <${Channel} path="/channel/:userId/:videoType/:clipBackDays?" />
        <${Games} path="/games" />
        <${HiddenGames} path="/hidden-games" />
        <${HiddenUsers} path="/hidden-users" />
        <${WatchLaterPage} path="/watch-later" />
        <${SearchResults} path="/search/:query" />
        <${DefaultHandler} default />
    <//>
`;
