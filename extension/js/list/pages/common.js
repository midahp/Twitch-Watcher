import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';

import {utils} from '../../utils/utils.js';


const html = htm.bind(h);

const reloadDelayInSecs = 30;
class ReloadButton extends Component{
    constructor(props){
        super(props);
        this.reloadFn = props.handleReload;
        this.state = {
            "cooldown": false, 
        }
    }

    handleReload = e=>{
        if (this.state.cooldown) return;
        this.setState({
            "cooldown": true,
        });
        setTimeout(()=>{
            this.setState({
                "cooldown": false,
            });
        }, 1000*reloadDelayInSecs);
        this.reloadFn(e);
    }

    render(props, state){
        return html`
            <div onClick=${this.handleReload} class="results-reload result-action${state.cooldown ? ' on-cooldown' : ''}">
                <svg version="1.1" xml:space="preserve" enable-background="new 0 0 65 65" y="0px" x="0px" viewBox="0 0 65 65">
                    <g id="Layer_3_copy_2">
                        <g fill="#313131">
                            <path d="m32.5 4.999c-5.405 0-10.444 1.577-14.699 4.282l-5.75-5.75v16.11h16.11l-6.395-6.395c3.18-1.787 6.834-2.82 10.734-2.82 12.171 0 22.073 9.902 22.073 22.074 0 2.899-0.577 5.664-1.599 8.202l4.738 2.762c1.47-3.363 2.288-7.068 2.288-10.964 0-15.164-12.337-27.501-27.5-27.501z"/>
                            <path d="m43.227 51.746c-3.179 1.786-6.826 2.827-10.726 2.827-12.171 0-22.073-9.902-22.073-22.073 0-2.739 0.524-5.35 1.439-7.771l-4.731-2.851c-1.375 3.271-2.136 6.858-2.136 10.622 0 15.164 12.336 27.5 27.5 27.5 5.406 0 10.434-1.584 14.691-4.289l5.758 5.759v-16.112h-16.111l6.389 6.388z"/>
                        </g>
                    </g>
                </svg>
            </div>
        `;
    }
}

class ResultsFilter extends Component{  
    filter(query){
        query = query.trim().toLowerCase();
        window.scrollTo(0,0);
        this.props.parent.setState({"filterQuery": query});
    }

    handleFilterEnter = e=>{
        if(e.key === "Enter"){
            this.filter(e.target.value);
        }
    }

    handleFilterInput = e=>{
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(()=>{
            this.filter(e.target.value);
        }, 200);
    }

    render(props, state){
        return html`
            <div class="card-search-filter result-action">
                <input onInput=${this.handleFilterInput} type="text" placeholder="Filter Results" />
            </div>
        `;
    }
}

class CardsPage extends Component{
    constructor(props){
        super(props);
        this.state = {
            "entities": [],
        };
        this.init();
    }

    init(){
        this.load();
    }

    loadCallback = ()=>{
        this.load();
    }

    onScroll = e=>{
        if(this.loading)return;
        if(utils.percentageScrolled()>85){
            this.loadMore();
        }
    }

    onKeyDown = e=>{
        if(document.activeElement && document.activeElement.tagName=="INPUT") return;

        const headerHeight = 170;
        const y = window.scrollY;
        const afterHeaderY = y - headerHeight;
        const totalCardHeight = this.totalCardHeight || 299;
        let sign;
        switch (e.key){
            case "ArrowUp":
                sign = -1;
                break;
            case "ArrowDown":
                sign = 1;
                break;
            default:
                return;
        }
        e.preventDefault()
        let newYPos;
        if (y<headerHeight){
            if (sign == 1){
                newYPos = headerHeight;
            }
            else{
                newYPos = 0;
            }
        }
        else if (y == headerHeight && sign == -1){
            newYPos = 0;
        }
        else{
            const mul = parseInt(afterHeaderY / totalCardHeight) + sign;
            newYPos = headerHeight + mul * totalCardHeight;
        }
        scroll({
            top: newYPos,
            // behavior: "smooth",
        });
    }

    componentDidMount(){
        window.addEventListener("scroll", this.onScroll);

        window.addEventListener("keydown", this.onKeyDown);
    }

    componentWillUnmount(){
        window.removeEventListener("scroll", this.onScroll);
        
        window.removeEventListener("keydown", this.onKeyDown);
    }

    componentDidUpdate(prevProps) {
        const obj = {};
        let change = false;
        let key, val;
        for (key in prevProps){
            val = this.props[key];
            if (prevProps[key] != val){
                obj[key] = val;
                change = true;
            }
        }
        if (change) {
            this.load();
        }

        // let key, val;
        // for (key in prevProps){
        //     val = this.props[key];
        //     if (prevProps[key] != val){
        //         this.load();
        //         return;
        //     }
        // }
    }

    handleReload = e=>{
        this.load();
    }

    async getParams(){
        return {};
    }

    async prepareData(data){
        return data;
    }

    startedLoading(){
        this.loading = true;
        document.body.classList.add("loading");
    }

    finishedLoading(){
        document.body.classList.remove("loading");
        this.loading = false
    }

    async load(){
        this.startedLoading();
        this.setState({
            "entities": []
        });
        window.scrollTo(0,0);
        let params = await this.getParams();
        let data;
        if(params === false){
            data = [];
        }
        else{
            try{
                data = await this.endpoint.call(params);
                data = await this.prepareData(data);
                this.setState({
                    "entities": data
                });
            }
            catch (err){
                console.error(err);
            }
        } 
        this.finishedLoading();
    }

    async loadMore(){
        this.startedLoading();
        try{
            let data = await this.endpoint.next();
            if(data && data.length){
                data = await this.prepareData(data);
                let entities = this.state.entities;
                entities = entities.concat(data);
                this.setState({
                    "entities": entities
                });
            } 
        }
        catch(err){
            // console.error(err);
        }
        this.finishedLoading();
    }
}

export {
    CardsPage,
    ReloadButton,
    ResultsFilter,
}
