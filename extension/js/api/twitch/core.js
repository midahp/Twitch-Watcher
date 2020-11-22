import {settings} from '../../settings.js';
import {utils} from '../../utils/utils.js';



class AbstractApi{
    constructor(){
        this.format = "json";
        this.includeApiHeader = true;
        this.includeClientID = true;
    }

    // only cache by url for now; this can lead to issues
    async call(url, includeClientID=true, includeApiHeader=this.includeApiHeader, format=this.format, postBody=false){
        let result = await utils.storage.getApiCache(url);
        if (result){
            // console.log("got result from api cache!");
            return result;
        }
        let headers = {};
        if(includeClientID){
            if(this.use2ndPartyClientId){
                headers["Client-ID"] = settings["2ndParty"];
                headers["Authorization"] = "Bearer " + settings["access_token"];
            }
            else{
                headers["Client-ID"] = settings.clientId;
            }
        }
        if(includeApiHeader){
            headers["Accept"] = this.params["accept"];
        }
        let params = {
            "headers": headers,
            "mode": this.params.mode,
            "credentials": this.params.credentials || "include",
            "method": this.params["method"],
        }
        if(params.method === "POST" && postBody){
            params.body = postBody;
        }
        result = await utils.fetch(url, this.format, params);
        utils.storage.setApiCache(url, result);
        return result;
    }
}



export {AbstractApi};
