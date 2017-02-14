if (!document.getElementById("iframe-setup")) {
    var tag = document.createElement('script');
    tag.async = false;
    tag.id = "iframe-setup";
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    console.log("Youtube API setup");
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
// Append placeholder for player
var video_div = document.createElement('div');
video_div.id = "videoNail"
document.getElementsByClassName("yt-masthead-logo-container").item(0).appendChild(video_div);

var scrollDistance = 450;
var playerIsVisible = false;
var video_id = "";
var curr_time = 0;

video_id = window.location.search.substring(3);
console.log(video_id);

if (typeof loaded == undefined) {
    var loaded = false;
}

// Set up player definition
// Hooking up to placeholder above
var main_player = document.getElementById('movie_player');
var player; 
function onYouTubeIframeAPIReady() {  
    player = new YT.Player('videoNail', { 
        height: '0', 
        width: '0', 
        videoId: video_id
    }); 
    loaded = true;
    console.log("My player with this id: " + video_id);
}

if (loaded) {
    onYouTubeIframeAPIReady();
}

window.onscroll = function(e) {
    if (!loaded) {
        return;
    }
    // When user scrolls down
    if(window.pageYOffset > scrollDistance && !playerIsVisible){
        // TODO: don't start videoNail when video already ended
        curr_time = main_player.getCurrentTime();
        player.setSize(320, 180);
        //player.seekTo(curr_time, true);
        player.setVolume(main_player.getVolume());
        if (main_player.getPlayerState() == YT.PlayerState.PAUSED) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
        main_player.mute();
        player.unMute();
        playerIsVisible = true;
    }

    // When user scrolls up
    if (window.pageYOffset < scrollDistance && playerIsVisible) {
        curr_time = player.getCurrentTime();
        player.setSize(0, 0);
        //main_player.seekTo(curr_time, true);
        main_player.setVolume(player.getVolume());
        if (player.getPlayerState() == YT.PlayerState.PAUSED) {
            main_player.pauseVideo();
        } else {
            main_player.playVideo();
        }
        player.mute();
        main_player.unMute();
        playerIsVisible = false;
    }
};`
document.getElementById("script-container").appendChild(iframe_script);
