import {utils} from '../utils/utils.js';

import { h, Component, render, createRef, Fragment } from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';
import { Link } from '../lib/preact-router.js';
import {route} from '../lib/preact-router.js';


import {gqlApi} from '/js/api/twitch/graphql.js';
import {favourites} from './favs.js';


const html = htm.bind(h);


class Searcher extends Component{
    constructor(props){
        super(props);
        this.state = {
            suggestions: [],
            suggestionsOpen: false,
            selectedIdx: -1,
        }
        this.inputRef = createRef();
        this.wrapperRef = createRef();
    }

    closeSuggestion(){
        this.inputRef.current.blur();
        this.setState({
            suggestionsOpen: false,
            selectedIdx: -1,
        });
    }

    componentDidMount(){
        document.addEventListener('mousedown', this.handleClickOutside);
        document.addEventListener('keydown', this.handleSelectChange);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
        document.removeEventListener('keydown', this.handleSelectChange);
    }

    searchCurrentInputValue() {
        const val = this.inputRef.current.value.trim();
        if(!val) return;
        route(`/search/${encodeURIComponent(val)}`);
        this.closeSuggestion();
    }

    handledKeys = new Set(["ArrowDown", "ArrowUp", "Enter", "Escape"]);
    handleSelectChange = e=>{
        if(document.activeElement != this.inputRef.current) return;
        if (!this.handledKeys.has(e.key)) return;
        e.preventDefault();
        if(e.key == "ArrowDown" || e.key == "ArrowUp"){
            let sign = 1;
            if (e.key == "ArrowUp") sign = -1;

            this.setState((state, props)=>{
                let idx = state.selectedIdx + sign;
                if(idx >= state.suggestions.length){
                    idx = -1;
                }
                else if (idx < -1){
                    idx = state.suggestions.length-1;
                }
                return {
                    "selectedIdx": idx,
                }
            });
        }
        else if(e.key == "Enter"){
            let elem = this.wrapperRef.current.querySelector(".suggestion--selected");
            if(elem){
                this.choseSuggestion(this.state.selectedIdx);
                elem.querySelector("a").click();
            }
            else{
                this.searchCurrentInputValue();
            }
        }
        else if (e.key == "Escape"){
            this.closeSuggestion();
        }
    }

    handleSearchClick = e=>{
        this.searchCurrentInputValue();
    }

    handleInput = e=>{
        const query = this.inputRef.current.value.trim();
        if(query.length<3) return;
        clearTimeout(this.suggestionTimeout);
        this.suggestionTimeout = setTimeout(()=>{
            gqlApi.searchSuggestions(query).then(results=>{
                let result;
                this.setState({
                    selectedIdx: -1,
                    suggestions: results,
                    suggestionsOpen: Boolean(results.length)
                });
            });
        }, 300);
    }

    choseSuggestion(i){
        this.inputRef.current.value = this.state.suggestions[i].text;
        this.closeSuggestion();
    }

    gainedFocus = e=>{
        e.target.select();
        if(this.state.suggestions.length){
            this.setState({
                suggestionsOpen: true,
                selectedIdx: -1,
            });
        }
    }

    handleClickOutside = e=>{
        if (this.wrapperRef && !this.wrapperRef.current.contains(e.target)) {
            this.setState({
                suggestionsOpen: false
            });
        }
    }

    handleMouseEnter = e=>{
        const idx = Array.from(
            this.wrapperRef.current.querySelector(".searcher-suggestions").
            children).indexOf(e.target);
        this.setState({selectedIdx:idx});
    }

    render(props, state){
        return html`
            <div style="position:relative" ref=${this.wrapperRef}>
            <div class="searcher">
                <input ref=${this.inputRef} onInput=${this.handleInput} class="searcher-input" onFocus=${this.gainedFocus} type="text" />
                <span onClick=${this.handleSearchClick} class="searcher-submit">
                    Search
                </span>
            </div>
            <div class="searcher-suggestions${state.suggestionsOpen ? " searcher-suggestions--open":""}">
                ${state.suggestions.map((s,i)=>{
                    let h = ``;
                    if(s.type == "searchTerm"){
                        h = html`
                            <a onClick="${e=>this.choseSuggestion(i)}" class="suggestion-link" href="#/search/${encodeURIComponent(s.text)}">
                                <img class="suggestion-thumb" src="/resources/icons/search.png" />
                                <div class="suggestion-text">${s.text}</div>
                            </a>
                        `;
                    }
                    else if(s.type == "SearchSuggestionChannel"){
                        h = html`
                            <a onClick="${e=>this.choseSuggestion(i)}" class="suggestion-link" target="_blank" href="/player.html?channel=${encodeURIComponent(s.login)}&channelD=${s.id}">
                                <img class="suggestion-thumb" src="${s.thumb}" />
                                <div class="suggestion-text">${s.text}</div>
                            </a>
                        `;
                    }
                    else if(s.type == "SearchSuggestionCategory"){
                        h = html`
                            <a onClick="${e=>this.choseSuggestion(i)}" class="suggestion-link" href="#/live/${s.id}">
                                <img class="suggestion-thumb" src="${s.thumb}" />
                                <div class="suggestion-text">${s.text}</div>
                            </a>
                        `;

                    }
                    return html`
                        <div onMouseEnter=${this.handleMouseEnter} class="suggestion ${state.selectedIdx == i ? " suggestion--selected": ""}">
                            ${h}
                        </div>
                    `;
                })}
            </div>
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
