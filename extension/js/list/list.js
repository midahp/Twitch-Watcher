import { h, Component, render, createRef } from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';

import {utils} from '../utils/utils.js';

import {RouterComponent} from './router.js';
import {Interface} from './interface.js';


const html = htm.bind(h);

function LoadingOverlay(){
    return html`
        <div class="loading-overlay">
            <div class="spinner">
                  <div class="spinner-bounce" id="bounce1"></div>
                  <div class="spinner-bounce" id="bounce2"></div>
                  <div class="spinner-bounce" id="bounce3"></div>
            </div>
        </div>
        <div class="overlay-dimmer"></div>
    `;
}

class App extends Component{
    render(props, state){
        return html`
            <${Interface} />
            <${RouterComponent} />
            <${LoadingOverlay} />
        `;
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    utils.ready.then(()=>{
        render(html`<${App} page="" />`, document.body);
    });
});

