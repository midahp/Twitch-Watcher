import {settings} from '../settings.js';
import { h, Component, render, createRef } from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';

import {utils} from '../utils/utils.js';


const html = htm.bind(h);


class SettingsEntry extends Component{

    constructor(props){
        super(props);
        setTimeout(()=>{
            this.init();
        }, 200);
    }

    async init(){
        this.settingsKey = `settings.${this.category}.${this.name}`;
        let val = await this.getInitial();
        this.dispatchEvent(val);
        this.setState({
            "value": val,
        });
    }

    async getInitial(){
        let val = await utils.storage.getItem(this.settingsKey);
        if (val === undefined || val === null){
            val = this.default;
        }
        return val;
    }

    dispatchEvent(val){
        const event = new CustomEvent(this.settingsKey,{
            "detail": {
                "value": val,
            },
            "bubbles": false,
        });
        window.dispatchEvent(event);
    }

    handleChange = e=>{
        if(this.dontStore) return;
        utils.storage.setItem(this.settingsKey, this.state.value);
    }

    handleInput = e=>{
        if(["submit", "checkbox", "range"].includes(e.target.type)) e.target.blur();
        const val = this.clean(e);
        this.dispatchEvent(val);
        this.setState({
            "value": val,
        });
    }

    limit(val){
        if (val < this.min) return this.min;
        if (val > this.max) return this.max;
        return val;
    }
}

class ChatSettinsgEntry extends SettingsEntry{
    category = "chat"
}

class FontSizeSetting extends ChatSettinsgEntry{
    name = "fontSize"
    label = "Font Size"

    min = 12
    max = 32
    default = 17

    clean(e){
        let val = parseInt(e.target.value);
        return this.limit(val);
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label">${this.label}</label>
                <div class="user-settings-input-cont">
                    <input class="input" value=${state.value} onChange=${this.handleChange} onInput=${this.handleInput} type="range" min="${this.min}" max="${this.max}" />
                    <span class="value">${state.value}px</span>
                </div>
            </div>    
        `;
    }
}


class BgVisibilitySetting extends ChatSettinsgEntry{
    name = "bgVisibility"
    label = "Background Visibility"

    min = 0
    max = 100
    default = 65

    clean(e){
        let val = parseInt(e.target.value);
        return this.limit(val);
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label">${this.label}</label>
                <div class="user-settings-input-cont">
                    <input class="input" value=${state.value} onInput=${this.handleInput} onChange=${this.handleChange} type="range" min="${this.min}" max="${this.max}" />
                    <span class="value">${state.value}%</span>
                </div>
            </div>    
        `;
    }
}

class SyncTimeSetting extends ChatSettinsgEntry{
    name = "syncTime"
    label = "Advance Chat by"
    dontStore = true

    min = -99
    max = 999
    default = 0

    clean(e){
        let val = parseInt(e.target.value);
        return this.limit(val);
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label">${this.label}</label>
                <div class="user-settings-input-cont">
                    <input value=${state.value} class="input" onChange=${this.handleChange} onInput=${this.handleInput} type="number" min="${this.min}" max="${this.max}" />
                    <span class="value">Secs</span>
                </div>
            </div>    
        `;
    }
}


const FILTER_TYPES = [
    ["user", "User"],
    ["phrase", "Phrase"],
    ["regex", "Regex"],
]
class ChatFilters extends ChatSettinsgEntry{
    name = "filters"
    label = "Filters"
    dontStore = false

    default = []

    constructor(props){
        super(props);
        this.state = {
            "currentAddType": FILTER_TYPES[0][0],
            "currentAddValue": "",
        };
    }

    toggleList = e=>{
        e.target.blur();
        this.setState((state, props)=>{
            if(state.open) return {"open": false};
            return {"open": true};
        });
    }

    handleAddFilter = e=>{
        this.setState((state, props)=>{
            const type = state.currentAddType;
            let value = state.currentAddValue;
            if(type == "user") value = value.trim().toLowerCase();
            return {
                value: [
                    ...state.value,
                    {
                        "type": type,
                        "value": value,
                    }
                ],
                "currentAddValue": "",
            }
        }, ()=>{
            this.dispatchEvent(this.state.value);
            this.handleChange();
        });
    }

    handleRemoveFilter = i=>{
        this.setState((state, props)=>{
            return {
                value: state.value.slice(0,i).concat(state.value.slice(i+1))
            }
        }, ()=>{
            this.dispatchEvent(this.state.value);
            this.handleChange();
        });
    }

    handleAddValueChange = e=>{
        this.setState({currentAddValue: e.target.value});
    }

    handleAddTypeChange = e=>{
        this.setState({currentAddType: e.target.value});
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label">
                    <span>${this.label}</span>
                    <button class="user-setting-show-button" onClick=${this.toggleList}>${state.open?'Close':'Open'}</button>
                </label>
                <div class="user-settings-input-cont">
                    <div class="chat-filter-list${state.open?'':' hidden'}">
                        ${state.value ? state.value.map((e,i)=>{
                            return html`
                                <div class="chat-filter-entry">
                                    <div class="chat-filter-type chat-filter-type--${e.type}">
                                        ${e.type}:
                                    </div>
                                    <div class="chat-filter-value">
                                        ${e.value}
                                    </div>
                                    <div onClick=${e=>this.handleRemoveFilter(i)} class="chat-filter-remove">
                                        -
                                    </div>
                                </div>
                            `;
                        }) : ""}
                        <div class="chat-filter-entry chat-filter-new">
                            <div class="chat-filter-type">
                                <select class="input" onChange=${this.handleAddTypeChange} value=${state.currentAddType}>
                                ${FILTER_TYPES.map(([val, text], i)=>{
                                    return html`<option value=${val}>${text}</option>`;
                                })}
                                </select>
                            </div>
                            <div class="chat-filter-value">
                                <input class="input" type="text" onChange=${this.handleAddValueChange} value=${state.currentAddValue} />
                            </div>
                            <div onClick=${this.handleAddFilter} class="chat-filter-add">
                                +
                            </div>
                        </div>
                    </div>
                </div>
            </div>    
        `;
    }
}

class CompressRepeatingPhrases extends ChatSettinsgEntry{
    name = "compressRepeatingPhrases"
    label = "Group Repeating Phrases"

    default = false

    clean(e){
        return e.target.checked;
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label" for="settings_compressRepeatingPhrases">
                    <span>${this.label}</span>
                    <input type="checkbox" id="settings_compressRepeatingPhrases" checked=${state.value} onInput=${this.handleInput} onChange=${this.handleChange} />
                </label>
            </div>    
        `;
    }
}

class TrimLongMessages extends ChatSettinsgEntry{
    name = "trimLongMessages"
    label = "Trim Long Messages"

    default = false

    clean(e){
        return e.target.checked;
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label" for="settings_trimLongMessages">
                    ${this.label}
                    <input type="checkbox" id="settings_trimLongMessages" checked=${state.value} onInput=${this.handleInput} onChange=${this.handleChange} />
                </label>
            </div>    
        `;
    }
}


class VideoSettinsgEntry extends SettingsEntry{
    category = "video"
}

class PlaybackSpeedEntry extends VideoSettinsgEntry{
    name = "playbackSpeed"
    label = "Playback speed"
    dontStore = true

    min = .20
    max = 3
    step = .2
    default = 1

    clean(e){
        let val = parseFloat(e.target.value);
        return this.limit(val);
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label">${this.label}</label>
                <div class="user-settings-input-cont">
                    <input class="input" value="${state.value}" step="${this.step}" onInput=${this.handleInput} onChange=${this.handleChange} type="range" min="${this.min}" max="${this.max}" />
                    <span class="value">${state.value}x</span>
                </div>
            </div>    
        `;
    }
}

class PauseOnClick extends VideoSettinsgEntry{
    name = "pauseOnClick"
    label = "Pause On Click"

    default = false

    clean(e){
        return e.target.checked;
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label" for="settings_pauseOnClick">
                    ${this.label}
                    <input type="checkbox" id="settings_pauseOnClick" checked=${state.value} onInput=${this.handleInput} onChange=${this.handleChange} />
                </label>
            </div>    
        `;
    }
}

class ArrowKeysSeek extends VideoSettinsgEntry{
    name = "arrowKeysSeek"
    label = "Seek amount with ← →"

    min = 1
    max = 999
    default = 5

    clean(e){
        let val = parseInt(e.target.value);
        return this.limit(val);
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label">${this.label}</label>
                <div class="user-settings-input-cont">
                    <input value=${state.value} class="input" onChange=${this.handleChange} onInput=${this.handleInput} type="number" min="${this.min}" max="${this.max}" />
                    <span class="value">Secs</span>
                </div>
            </div>    
        `;
    }
}

class PlusMinusSeek extends VideoSettinsgEntry{
    name = "plusMinusSeek"
    label = "Seek amount with - +"

    min = 0
    max = 999
    default = 30

    clean(e){
        let val = parseInt(e.target.value);
        return this.limit(val);
    }

    render(props, state){
        return html`
            <div class="user-settings-entry">
                <label class="label">${this.label}</label>
                <div class="user-settings-input-cont">
                    <input value=${state.value} class="input" onChange=${this.handleChange} onInput=${this.handleInput} type="number" min="${this.min}" max="${this.max}" />
                    <span class="value">Secs</span>
                </div>
            </div>    
        `;
    }
}



class UserSettings extends Component{
    constructor(props){
        super(props);
        // this.state = {
        //     "visible": false,
        // }
    }

    render(props, state){
        return html`
            <div class="user-settings">
                <div class="user-settings-category">
                    <div class="category-label">Chat</div>
                    <${FontSizeSetting} />
                    <${BgVisibilitySetting} />
                    <${SyncTimeSetting} />
                    <${ChatFilters} />
                    <${TrimLongMessages} />
                    <${CompressRepeatingPhrases} />
                </div>
                <div class="user-settings-category">
                    <div class="category-label">Video</div>
                    <${PlaybackSpeedEntry} />
                    <${PauseOnClick} />
                    <${ArrowKeysSeek} />
                    <${PlusMinusSeek} />
                </div>
            </div>
        `;
    }
}

function renderUserSettingsInto(elem){
    render(html`<${UserSettings} />`, elem);
}


export {renderUserSettingsInto};
