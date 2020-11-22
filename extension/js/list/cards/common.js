import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';

import {utils} from '../../utils/utils.js';

const html = htm.bind(h);


class Card extends Component{
    dataFilterKeys = [        
    ]

    constructor(props) {
        super(props);
        this.rootRef = createRef();
        this.state = {
            data: this.props.data,
            loadThumbnail: false,
            filteredOut: this.testFilteredOut(this.props.filterQuery),
        };
    }

    imgLoader = ()=>{
        if (this.state.loadThumbnail) return;
        if (utils.isElementInViewport(this.rootRef.current)){
            this.setState({
               loadThumbnail: true 
            });
        }
    }

    componentDidMount(){
        window.addEventListener("scroll", this.imgLoader);
        this.imgLoader();
    }

    componentDidUpdate(prevProps) {
        if (this.props.data !== prevProps.data) {
            this.setState({
                "data": this.props.data,
            });
        }
        if (this.props.filterQuery !== prevProps.filterQuery) {
            const filteredOut = this.testFilteredOut(this.props.filterQuery);
            this.setState({
                "filteredOut": filteredOut,
                "loadThumbnail": true,
            });
        }
    }

    testFilteredOut(query){
        if(!query) return false;
        const d = this.state.data;
        if(!Object.keys(d).length) return false;

        let filterKey, string;
        for(filterKey of this.dataFilterKeys){
            string = utils.traverseObj(filterKey, d);
            if (!string) continue;
            string = string.toLowerCase();
            if(string.indexOf(query)>=0){
                return false;
            }
            else{
                continue
            }
        }
        return true;
    }

}

export {
    Card,
}
