import { h, Component, render, createRef } from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';

import {utils} from '../utils/utils.js';


const html = htm.bind(h);


class ChatOption extends Component{
    constructor(props){
        super(props);
        this.chat = props.chat;
        this.storageName = "chatOption" + utils.capitalize(this.name);
        this.init();
    }

    async init(){
        let val = await this.getInitial();
        val = this.clean(val);
        this.handleChange(val);
        this.setState({
            "value": val,
        });
    }

    async getInitial(){
        if(this.dontStore){
            return this.default;
        }
        let val = await utils.storage.getItem(this.storageName);
        if (val === undefined || val === null){
            val = this.default;
        }
        return val;
    }

    handleChange = e=>{
        val = this.clean(e.target.value);
        this.applyToChat(val);
        this.setState({
            "value": val,
        });
        if(!this.dontStore){
            utils.storage.setItem(this.storageName, val);
        }
    }

    limit(val){
        if (val < this.min) return this.min;
        if (val > this.max) return this.max;
        return val;
    }

}

class FontSizeOption extends ChatOption{
    name = "fontSize"
    label = "Font Size"

    min = 12
    max = 32
    default = 17

    clean(val){
        val = parseInt(val);
        return this.limit(val);
    }

    applyToChat(val){
        this.chat.elem.querySelector(".chat-container").style.fontSize = val+"px";
    }

    render(props, state){
        return html`
            <div class="chat-option">
                <label>${this.label}: ${state.value}</label>
                <input onChange=${this.handleChange} type="range" min="${this.min}" max="${this.min}" />
            </div>    
        `;
    }
}


class BgVisibilityOption extends ChatOption{
    name = "bgVisibility"
    label = "Background Visibility"

    min = 0
    max = 100
    default = 65

    clean(val){
        val = parseInt(val);
        return this.limit(val);
    }

    applyToChat(val){
        let opacity = val / 100
        let color = `rgba(41,41,41, ${opacity})`;
        this.chat.elem.querySelector(".chat-container").style.backgroundColor = color;
    }

    render(props, state){
        return html`
            <div class="chat-option">
                <label>${this.label}: ${state.value}</label>
                <input onChange=${this.handleChange} type="range" min="${this.min}" max="${this.min}" />
            </div>    
        `;
    }
}

class SyncTimeOption extends ChatOption{
    name = "syncTime"
    label = "Sync Time"
    mode = "video"
    dontStore = true

    min = -99
    max = 999
    default = 0

    clean(val){
        val = parseInt(val);
        return this.limit(val);
    }

    applyToChat(val){
        this.chat.syncTime = val;
    }

    render(props, state){
        return html`
            <div class="chat-option">
                <label>${this.label}</label>
                <input onChange=${this.handleChange} type="number" min="${this.min}" max="${this.min}" />
            </div>    
        `;
    }
}


class ChatOptions extends Component{
    constructor(props){
        super(props);
        this.state = {
            "visible": false,
        }
    }

    render(props, state){
        return html`
            <div class="chat-options${state.visible?'':' chat-options--hidden'}">
                <${FontSizeOption} chat=${props.chat} />
                <${BgVisibilityOption} chat=${props.chat} />
                <${SyncTimeOption} chat=${props.chat} />
            </div>
        `;
    }
}


export {ChatOptions};
