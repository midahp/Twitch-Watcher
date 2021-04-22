export const settings = {
    DEBUG: true,
    clientId: "kimne78kx3ncx6brgo4mv6wki5h1ko",
    "2ndParty": "5xdruy8ydcweacjb297s2xxihfvix0",
    "access_token": "ef7nzf06ttbfb1bhfn7h3ey6hgyngy", // expires on 2021-05-19
    mode: "video",
    hlsConfig: {
        "autoStartLoad": false,
        "maxBufferLength": 60,  // seconds
        "maxMaxBufferLength": 600, // seconds
        "maxBufferSize": 1e+6 * 70, // bytes
        "liveSyncDuration": 2, // seconds
        "lowLatencyMode": false,
        "progressive": false,
    },
};

/*
how hls.js buffer settings work:
- ALWAYS buffer at least 'maxBufferLength'
- buffer more if 'maxBufferSize' is not reached
- but NEVER buffer more than 'maxMaxBufferLength'
*/
