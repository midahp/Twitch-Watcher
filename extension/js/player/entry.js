import {settings} from '../settings.js';
import {utils} from '../utils/utils.js';
import { Controller } from './controller.js';
import {makeElements} from './elements.js';


function load(){
    makeElements();
    utils.ready.then(()=>{
        const c = new Controller();
    });
}



document.addEventListener('DOMContentLoaded', event => {
    load();
});

