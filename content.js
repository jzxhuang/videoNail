if (!document.getElementById("iframe-setup")) {
    var tag = document.createElement('script');
    tag.async = false;
    tag.id = "iframe-setup";
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}


if (document.getElementById("script-container")) {
    element = document.getElementById("script-container");
    document.getElementById("script-container").parentNode.removeChild(element);
}
var container = document.createElement("div");
container.id = "script-container";
document.body.appendChild(container);

var iframe_script = document.createElement('script');
iframe_script.type = "text/javascript";
iframe_script.innerHTML = 
`
// Check if "videoNail" div exists, if it doesn't exist, create it
// as a place holder for iframe output
if (!document.getElementById("videoNail")) {
    var videoPlaceholder = document.createElement('div');
    videoPlaceholder.id = "videoNail"
    document.getElementsByClassName("yt-masthead-logo-container").item(0).appendChild(videoPlaceholder);
}


// Check if iframe_api has already loaded
if (typeof apiLoaded == undefined) {
    var apiLoaded = false;
}


var scrollDistance = 450;
var playerIsVisible = false;
var videoId = window.location.search.substring(3);
var currTime = 0;
var mainPlayer = document.getElementById('movie_player');
var player; 


function onYouTubeIframeAPIReady() {  
    player = new YT.Player('videoNail', { 
        height: '0', 
        width: '0', 
        videoId: videoId
    }); 
    apiLoaded = true;    
}


if (apiLoaded) {
    onYouTubeIframeAPIReady();
}


window.onscroll = function(e) {
    // When user scrolls down
    if(window.pageYOffset > scrollDistance && !playerIsVisible){
        // TODO: don't start videoNail when video already ended
        currTime = mainPlayer.getCurrentTime();
        player.setSize(320, 180);
        player.seekTo(currTime, true);
        player.setVolume(mainPlayer.getVolume());
        if (mainPlayer.getPlayerState() == YT.PlayerState.PAUSED) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
        mainPlayer.mute();
        player.unMute();
        playerIsVisible = true;
    }

    // When user scrolls up
    if (window.pageYOffset < scrollDistance && playerIsVisible) {
        currTime = player.getCurrentTime();
        player.setSize(0, 0);
        mainPlayer.seekTo(currTime, true);
        mainPlayer.setVolume(player.getVolume());
        if (player.getPlayerState() == YT.PlayerState.PAUSED) {
            mainPlayer.pauseVideo();
        } else {
            mainPlayer.playVideo();
        }
        player.mute();
        mainPlayer.unMute();
        playerIsVisible = false;
    }
};`
document.getElementById("script-container").appendChild(iframe_script);
