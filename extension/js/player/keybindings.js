import {elements} from './elements.js';
import { utils } from '../utils/utils.js';


const BLOCKING_TAG_NAMES = new Set([
    "TEXTAREA",
    "INPUT"
]);
class KeyBindings{
    constructor(player){
        this.player = player;
        this.seekingMultiplier = 0;
        this.plusMinusSeek = 30;
        this.arrowKeysSeek = 5;
    }

    seekVideo(seconds){
        let newTime = this.player.currentTime + seconds;
        if(newTime<0){newTime=0;}
        const maxPos = this.player.duration - 1;
        if(newTime>maxPos){newTime=maxPos;}
        this.player.seek(newTime);
    }

    getSeekStr(seconds){
        if (seconds === 0){
            return " 00:00 ";
        }
        let sign = seconds < 0 ? "-" : "+";
        seconds = Math.abs(seconds);
        let mins = Math.floor(seconds / 60);
        seconds = seconds % 60
        return sign + utils.padDigits(mins, 2) + ":" + utils.padDigits(seconds, 2);
    }

    handlers(){
        window.addEventListener("settings.video.arrowKeysSeek", e=>{
            this.arrowKeysSeek = e.detail.value;
        });
        window.addEventListener("settings.video.plusMinusSeek", e=>{
            this.plusMinusSeek = e.detail.value;
        });


        document.addEventListener("keyup", (e) => {
            if (e.key === "Alt"){
                elements.seekingOverlay.style.display = "none";
                elements.previewAndTime.style.display = "none";
                if (this.seekingMultiplier !== 0){
                    this.seekVideo(this.plusMinusSeek * this.seekingMultiplier);
                    this.seekingMultiplier = 0;
                }
                this.player.components.playerControls.showFn();
            }
        });

        document.addEventListener("keydown", (e) => {
            if(document.activeElement && BLOCKING_TAG_NAMES.has(document.activeElement.tagName)) return;
            if(e.shiftKey || e.ctrlKey){
                return;
            }
            else if(e.altKey){
                switch(e.key){
                    case "+":
                        this.updateSeekingOverlay(1);
                        break;
                    case "-":
                        this.updateSeekingOverlay(-1);
                        break;
                    default:
                        return;
                }
            }
            else{
                let volume;
                switch(e.key){
                    case "ArrowRight":
                        this.seekVideo(this.arrowKeysSeek);
                        break;
                    case "ArrowLeft":
                        this.seekVideo(-this.arrowKeysSeek);
                        break;
                    case "+":
                        this.seekVideo(this.plusMinusSeek);
                        break;
                    case "-":
                        this.seekVideo(-this.plusMinusSeek);
                        break;
                    case "ArrowUp":
                        volume = this.player.volume + 0.025;
                        if(volume>1){volume = 1;}
                        this.player.volume = volume;
                        break;
                    case "ArrowDown":
                        volume = this.player.volume - 0.025;
                        if(volume<0){volume = 0;}
                        this.player.volume = volume;
                        break;
                    case " ":
                        if(this.player.paused){
                            this.player.play();
                        }
                        else{
                            this.player.pause();
                        }
                        break;
                    case "m":
                        this.player.components.playerButtons.toggleMute();
                        break;
                    case "f":
                        this.player.components.playerControls.toggleFullscreen();
                        break;
                    case "s":
                        elements.userSettingsContainer.classList.toggle("user-settings-container--hidden");
                        break;
                    default:
                        return;
                }
            }
            this.player.components.playerControls.initiateShow();
        });
    }

    updateSeekingOverlay(sign){
        this.seekingMultiplier += sign;
        let seekValue = this.seekingMultiplier * this.plusMinusSeek;
        let text = this.getSeekStr(seekValue);
        elements.seekingOverlay.querySelector("span").textContent = text;
        elements.seekingOverlay.style.display = "block";
        this.player.components.slider.showPreviewAndTime(null, this.player.currentTime + seekValue);
    }
}

export {KeyBindings};
