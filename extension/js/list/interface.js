import {utils} from '../utils/utils.js';

import { h, Component, render, createRef, Fragment } from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';
import { Link } from '../lib/preact-router.js';
import {route} from '../lib/preact-router.js';
import {favourites} from './favs.js';


const html = htm.bind(h);


class Searcher extends Component{
    constructor(props){
        super(props);
        this.inputRef = createRef();
    }
    handleKeyPress = e => {
        const val = e.target.value.trim();
        if(!val) return;
        if(e.key === "Enter"){
            route(`/search/${val}`);
        }
    }

    handleSearchClick = e=>{
        const val = this.inputRef.current.value.trim();
        if(!val) return;
        route(`/search/${val}`);
    }

    render(props, state){
        return html`
            <div class="searcher">
                <input ref=${this.inputRef} class="searcher-input" onKeyPress=${this.handleKeyPress} onFocus=${e=>e.target.select()} type="text" />
                <span onClick=${this.handleSearchClick} class="searcher-submit">
                    Search
                </span>
            </div>
        `;
    }
}

class ImportExport extends Component{
    handleImportSettings = e=>{
        utils.import();
    }

    handleExportSettings = e=>{
        utils.export();
    }

    handleImportFollows = e=>{
        favourites.importUserFollows();
    }

    render(props, state){
        return html`
            <span onClick=${this.handleImportFollows} class="top-link import-follows-button">Import Follows</span>
            <span onClick=${this.handleImportSettings} class="top-link import-button">Import Settings</span>
            <span onClick=${this.handleExportSettings} class="top-link export-button">Export Settings</span>
        `;
    }
}


class Interface extends Component {

    constructor() {
        super();
        this.state = {};
    }

    // Lifecycle: Called whenever our component is created
    componentDidMount() {
    }

    // Lifecycle: Called just before our component will be destroyed
    componentWillUnmount() {
    // stop when not renderable
    }

    loadEvent(type){

    }

    render() {
        return html`
            <section class="interface">
                <div class="top-links">
                    <div class="top-links-left">
                        <a class="top-link" href="#/live/0">Unlisted Streams</a>
                        <a class="top-link" href="#/hidden-games">Hidden Games</a>
                    </div>
                    <div class="top-links-right">
                        <${ImportExport} />
                    </div>
                </div>

                <${Searcher} />

                
                <nav class="pages-nav">
                    <a class="pages-nav_page" href="#/live">Live</a>
                    <a class="pages-nav_page" href="#/games">Games</a>
                    <a class="pages-nav_page" href="#/favourites">Favourites</a>
                    <a class="pages-nav_page" href="#/watch-later">Watch Later</a>
                </nav>


            </section>
        `;
    }
}


export {Interface};
