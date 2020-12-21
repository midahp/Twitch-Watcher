const browser = window.browser || window.chrome; 









// (function(){
// const fetchParams = {
//     "headers": {
//         "accept": "application/vnd.twitchtv.v5+json",
//         "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko"
//     },
//     "mode": "cors",
//     "credentials": "omit",
//     "method": "GET",
// }
// function getClip(slug){
//     let url = `https://api.twitch.tv/kraken/clips/${slug}`;
//     return fetch(url, fetchParams).then(r=>r.json());
// }
// function getClipVod(slug){
//     return getClip(slug).then(clip=>{
//         let vod = clip.vod;
//         // if(vod && vod.url && vod.id){
//         return vod;
//         // }
//     });
// }



// function init(){
//     setTimeout(()=>{
//     for (let a of document.querySelectorAll("a[href^='https://clips.twitch.tv/']")){
//         let slug = a.href.split("/")[3];
//         a.addEventListener("click", e=>{
//             e.preventDefault();
//             getClipVod(slug).then(vod=>{
//                 if(vod && vod.id){
//                     let queryStr = `?vid=${vod.id}&time=${vod.offset}`;
//                     // let newa = a.cloneNode(true);
//                     // newa.href = chrome.runtime.getURL("/player.html") + queryStr;
//                     // newa.textContent = slug;
//                     // a.after(newa);
//                     // a.style.display = "none";
//                     browser.runtime.sendMessage({
//                         "event": "openPlayer",
//                         "queryStr": queryStr
//                     });
//                 }
//                 else{
//                     window.open(a.href, '_blank');
//                 }
//             });
//         });
//     }
//     }, 1000);


// }

const playerURL = browser.runtime.getURL("/player.html");

function addLink(link){
    const slug = link.href.split("/")[3];
    const playerURL = browser.runtime.getURL(`/player.html?cid=${slug}`);
    const newLink = document.createElement("a");

    newLink.href = "#";
    newLink.textContent = `Open Clip in Twitch Watcher`;
    link.parentElement.append(newLink);
    newLink.addEventListener("click", e=>{
        e.preventDefault();
        browser.runtime.sendMessage({
            "event": "openPlayer",
            "queryStr": `?cid=${slug}`
        });
    });
    // link.parentElement.nextSibling.remove;
}

console.log("loaded contentScript");
function init(){
    console.log("loaded init");
    let link;
    const links = document.querySelectorAll("a[href^='https://clips.twitch.tv/']")
    for (link of links){
        addLink(link);
    }
}
setTimeout(init, 2000);



