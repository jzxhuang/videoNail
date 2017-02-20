// Check if "videoNail" div exists, if it doesn't exist, create it
// as a place holder for iframe output
if (!document.getElementById("videoNail")) {
    var videoPlaceholder = document.createElement('div');
    videoPlaceholder.id = "videoNail"
    document.getElementsByClassName("yt-masthead-logo-container").item(0).appendChild(videoPlaceholder);
}


var scrollDistance = 450;
var playerIsVisible = false;
var videoId = window.location.search.substring(3);
var currTime = 0;
// Get current player on the page
var mainPlayer;
var player;


function onYouTubeIframeAPIReady() {  
    player = new YT.Player('videoNail', { 
        height: '0', 
        width: '0', 
        videoId: videoId
    });
    mainPlayer = document.getElementById('movie_player');
}


window.onscroll = function(e) {
    if(mainPlayer) {
        // When user scrolls down
        if(window.pageYOffset > scrollDistance && !playerIsVisible) {
            // If mainPlayer has already stopped, don't show player
            if (mainPlayer.getPlayerState() == YT.PlayerState.ENDED) {
                return;
            }
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
    }
};