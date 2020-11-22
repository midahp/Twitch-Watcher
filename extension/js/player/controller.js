import { getPlayer, DummyPlayer } from './player.js';
import {helixApi} from '../api/twitch/helix.js';
import { ReChatInterface, LiveChatInterface } from '../chat/ui.js';
import { elements } from './elements.js';
import * as components from './components/components.js';
import {KeyBindings} from './keybindings.js'
import { utils } from '../utils/utils.js';
import { settings } from '../settings.js';
import { renderUserSettingsInto } from './player-settings.js';
import { MODES } from './constants.js';


class Controller{
    constructor(){
        let vid = utils.findGetParameter("vid");
        let cid = utils.findGetParameter("cid");
        let chatonly = utils.findGetParameter("chatonly");
        let channel = utils.findGetParameter("channel");
        let channelID = utils.findGetParameter("channelID");

        const info = {};
        if(vid){
            info.mode = MODES.VOD;
            info.videoId = vid;
        }
        else if(cid){
            info.mode = MODES.CLIP;
            info.clipId = cid;
        }
        else if(channel){
            info.mode = MODES.LIVE;
            info.channel = channel;
            info.channelId = channelID;
            elements.app.classList.add("live");
        }

        if(settings.DEBUG){
            window.appInterface = this;
        }
        this.start(info);
    }

    async start(info){
        this.player = getPlayer(elements.video, elements.chat, info.mode);
        await this.player.load(info);
        await this.player.start();
        const keyBindings = new KeyBindings(this.player);
        keyBindings.handlers();
        this.handlers();
        this.player.setDocumentTitle();
    }

    handlers(){
        elements.userSettingsButton.addEventListener("click",e=>{
            elements.userSettingsContainer.classList.toggle("user-settings-container--hidden");
        });
        renderUserSettingsInto(elements.userSettingsContainer);
    }

    loadClip(cid){
        this.player.start(cid).then(()=>{
            if(!this.uiInitialized){
                this.init();
                this.uiInitialized = true;
            }
            this.player.play();
        });
    }
}

export {Controller};
