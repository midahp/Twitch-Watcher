import {settings} from '../settings.js';
import {utils} from '../utils/utils.js';

import {Video, Live, Clip, Stream} from '../media/media.js';
import { ReChatInterface, LiveChatInterface } from '../chat/ui.js';
import { elements } from './elements.js';
import * as components from './components/components.js';

import {helixApi} from '../api/twitch/helix.js';
import {undocApi} from '../api/twitch/undoc.js';
import {gqlApi} from '../api/twitch/graphql.js';
import { MODES } from './constants.js';


class DummyPlayer{
    constructor(){
        this.cachedTime = 0;
        this.paused = true;
    }

    async start(vId){
        this.video = new Video(vId);
        await this.video.loaded;
        const secs = utils.storage.getResumePoint(vId);
        this.seek(secs);
        this.play();
    }

    play(){
        this.dateResumed = new Date();
        this.paused = false;
        this.onplay && this.onplay();
    }

    timePassed(){
        return (new Date() - this.dateResumed) / 1000;
    }

    pause(){
        this.cachedTime = this.getCurrentTime();
        this.paused = true;
        this.onpause && this.onpause();
    }

    getCurrentTime(){
        if(this.paused){
            return this.cachedTime;
        }
        else{
            return this.cachedTime + this.timePassed();
        }
    }

    getDuration(){
        return this.video.lengthInSecs;
    }

    seek(secs){
        let dur = this.getDuration();
        if(secs > dur){
            secs = dur;
        }
        else if(secs < 0){
            secs = 0;
        }
        this.timeBeforeSeek = this.getCurrentTime();
        this.cachedTime = secs;
        if(!this.paused){
            this.dateResumed  = new Date();
        }
        this.onseeking && this.onseeking();
    }
}

class Player{
    constructor(videoElem, chatElem){
        this.videoElem = videoElem;
        this.chatElem = chatElem;

        this.timeBeforeSeek = 0;
    }

    addVideoListeners(obj){
        let event, handler;
        for([event, handler] of Object.entries(obj)){
            this.videoElem.addEventListener(event, handler);
        }
    }

    get muted(){
        return this.videoElem.muted;
    }

    set muted(b){
        this.videoElem.muted = b;
    }

    get duration(){
        return this.videoElem.duration;
    }

    get paused(){
        return this.videoElem.paused;
    }

    get currentTime(){
        return this.videoElem.currentTime;
    }

    set currentTime(time){
        this.videoElem.currentTime = time;
    }

    get volume(){
        return this.videoElem.volume;
    }

    set volume(val){
        this.videoElem.volume = val;
    }

    setDocumentTitle(){
        document.title = `Simple Twitch UI`;
    }

    seek(secs){
        this.timeBeforeSeek = this.currentTime;
        this.currentTime = secs;
    };

    afterSeeking(secs){
        this.components.slider.updateFromSecs(secs);
    }

    setTotalTime(timeStr){
        elements.totalTime.textContent = timeStr;
    }

    setCurrentTotalTime(){
        this.setTotalTime(utils.secsToHMS(this.duration));
    }

    updateCurrentTime(secs){
        elements.currentTime.textContent = utils.secsToHMS(secs);
        this.components.slider.updateFromSecs(secs);
    }

    updateAll(secs){
        this.updateCurrentTime(secs);
    }
    handlersAfterLoad(){

    }
    handlersBeforeLoad(){
        this.videoElem.onseeking = e=>{
            this.afterSeeking(this.currentTime);
        }
        this.videoElem.ondurationchange = (e)=>{
            this.setCurrentTotalTime();
        };

        let component;
        for(component in this.components){
            utils.log("loading: ", component);
            this.components[component].handlers();
        }

        const canPlayHandler = ()=>{
            this.videoElem.removeEventListener("canplay", canPlayHandler);
            this.videoElem.play();
            this.updateAllInterval = setInterval(()=>{
                this.updateAll(this.currentTime);   
            }, 500);
        };
        this.videoElem.addEventListener("canplay", canPlayHandler);

    }

    loadComponents(){
        this.components = {
            "slider": new components.Slider(this, this.MODE),
            "qualityOptions": new components.QualityOptions(this, this.MODE),
            "playerButtons": new components.PlayerButtons(this, this.MODE),
            "playerControls": new components.PlayerControls(this, this.MODE)
        }
    }

    async loadMedia(){


    }

    async load(info){
        this.info = info;
        this.loadComponents();
        this.handlersBeforeLoad();
        await this.loadMedia();
        this.handlersAfterLoad();
    }

    async start(){

    }

    togglePlay(){
        if(this.paused) this.play();
        else this.pause();
    }
    pause(){
        this.videoElem.pause();
    }

    play(){
        this.videoElem.play();
    }

}

class HlsPlayer extends Player{

    async start(){
        this.chat.start(this.media.startPosition);
        this.stream.loadHls(this.videoElem, ()=>{
            this.volume = this.media.config.volume;
            this.updateComponents();
        });
    }

    // updateAll(secs){
    //     super.updateAll(secs);
    //     this.chat.iterate(secs);
    // }

    updateComponents(){
        const qualityOptions = this.stream.hls.levels.map(l=>{
            return{
                "name":l.attrs.VIDEO,
                "bitrate": l.bitrate,
            }
        });
        this.components.qualityOptions.loadQualityOptions(qualityOptions);
        this.components.qualityOptions.initOnLevelChange(this.stream.onlevelchange);
        this.components.slider.initOnBufferAppended(this.stream.onbufferappended);
    }

    qualitySelected(qualityOption, idx){
        this.stream.hls.nextLevel = idx;
        utils.storage.setItem("lastSetBitrate", qualityOption.bitrate);
    }
}

class VodPlayer extends HlsPlayer{
    MODE = MODES.VOD

    constructor(videoElem, chatElem){
        super(videoElem, chatElem);

        this.lastResumePoint = 0;
    }

    updateCurrentTime(secs){
        this.updateResumePoint(secs);
        super.updateCurrentTime(secs);
    }

    afterSeeking(secs){
        super.afterSeeking(secs);
        this.updateResumePoint(secs);
    }

    updateResumePoint(secs){
        if(Math.abs(secs - this.lastResumePoint) > 7){
            this.lastResumePoint = secs;
            utils.storage.setResumePoint(this.info.videoId, parseInt(secs));
        }
    }

    setDocumentTitle(){
        document.title = `${this.media.channelDisplay} - ${utils.onlyAscii(this.media.videoTitle)} - Simple Twitch UI`;
    }

    async loadMedia(){
        this.media = new Video(this.info.videoId);
        await this.media.loadData();
        this.chat = new ReChatInterface({
            "videoId": this.info.videoId,
            "channel": this.media.channel,
            "channelId": this.media.channelId,
            "chatElem": this.chatElem,
            "timeGiver": ()=>this.currentTime,
        });
        this.components.slider.prepareHoverThumbs(this.media.hoverThumbs);

        await this.media.makeConfig();

        const manifestUrl = await gqlApi.getVideoManifestUrl(this.info.videoId);
        this.stream = new Stream(manifestUrl, this.media.config);


        let onplayermetaloaded = ()=>{
            this.components.slider.drawMutedSegments();
            this.videoElem.removeEventListener("loadedmetadata", onplayermetaloaded);
        }
        this.videoElem.addEventListener("loadedmetadata", onplayermetaloaded);
    }

    handlersAfterLoad(){
        // reload the playlist as long as the vod duration is changing. For vods of currently ongoing live streams
        if(this.media.videoStatus === "recorded") return;
        const videoRecordingAppendInterval = setInterval(()=>{
            this.stream.hls.levelController.loadLevel();
        }, 5*60*1000);
        let stillRecordingCount = 3;
        let durationThen = this.duration;
        let onLL = (e, data)=>{
            let durationNow = this.duration;
            if(durationThen === durationNow){
                if(!(--stillRecordingCount)){
                    this.stream.hls.off(Hls.Events.LEVEL_LOADED, onLL);
                    clearInterval(videoRecordingAppendInterval);
                }
            }
            else if (durationNow){
                stillRecordingCount = 3;
                durationThen = durationNow;
            }
        };
        this.stream.hls.on(Hls.Events.LEVEL_LOADED, onLL);
    }
}

class LivePlayer extends HlsPlayer{
    MODE = MODES.LIVE


    async loadMedia(){
        this.media = new Live(this.info.channel, this.info.channelId);
        await this.media.loadData();

        let asciiChannel = this.media.channel;
        if(this.media.channelID){
            let user = await helixApi.getUsers([this.media.channelID]);
            user = user[this.media.channelID];
            asciiChannel = user.login;
        }
        this.chat = new LiveChatInterface({
            "channel": this.info.channel.toLowerCase(),
            "channelId": this.info.channelId,
            "chatElem": this.chatElem,
        });

        await this.media.makeConfig();

        // const manifestUrl = await undocApi.getStreamManifestUrl(encodeURIComponent(asciiChannel));
        const manifestUrl = await gqlApi.getStreamManifestUrl(asciiChannel);
        this.stream = new Stream(manifestUrl, this.media.config);

    }

    // setCurrentTotalTime(){
    // }

    setDocumentTitle(){
        document.title = `${this.info.channel} - Live - Simple Twitch UI`;
    }

    seek(secs){
        this.videoElem.currentTime = secs + this.stream.hls.streamController.mediaBuffer.buffered.start(0);

    }
    get duration(){
        return this.videoElem.duration - this.stream.hls.streamController.mediaBuffer.buffered.start(0);
        // return this.videoElem.duration;
    }
    set currentTime(time){
        this.videoElem.currentTime = time;
    }
    get currentTime(){
        // return this.videoElem.currentTime;
        return this.videoElem.currentTime - this.stream.hls.streamController.mediaBuffer.buffered.start(0);
    }
    setCurrentTotalTime(){
    }
    updateCurrentTime(secs){
        this.components.slider.updateFromSecs(secs);
    }

}


class ClipPlayer extends Player{
    MODE = MODES.CLIP

    async loadMedia(){
        this.media = new Clip(this.info.clipId);
        await this.media.loadData();
        await this.media.makeConfig();

    }

    setDocumentTitle(){
        document.title = `${this.media.title} - Simple Twitch UI`;
    }

    updateComponents(){
        this.components.qualityOptions.loadQualityOptions(this.media.qualityOptions, false);
    }

    qualitySelected(q, idx){
        this.videoElem.src = q.sourceURL;
        this.videoElem.play();
        utils.storage.setItem("lastSetQuality", q.name);
    }

    async start(){
        this.videoElem.src = this.media.config.quality.sourceURL;
        this.updateComponents();
        this.components.qualityOptions.updateCurrentQuality(this.media.config.qualityIdx);
        this.volume = this.media.config.volume;
    }
}

function getPlayer(videoElem, chatElem, mode){
    switch(mode){
        case MODES.VOD:
            return new VodPlayer(videoElem, chatElem);
            break;
        case MODES.LIVE:
            return new LivePlayer(videoElem, chatElem);
            break;
        case MODES.CLIP:
            return new ClipPlayer(videoElem, chatElem);
            break;
        default:
            return new Player(videoElem, chatElem);
    }
}

export {getPlayer, DummyPlayer};


