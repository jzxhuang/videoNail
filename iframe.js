var loaded = false;
var scrollDistance = 430;
var playerIsVisible = false;
var currTime = 0;
var videoId = window.location.search.substring(3, 14);
var mainPlayer;
var player;


// This is a mandatory function. Don't refactor.
// After loading "iframe-setup", it will call this function
function onYouTubeIframeAPIReady() {
    player = new YT.Player('video-nail', { 
        height: '0', 
        width: '0', 
        videoId: videoId
    });
    mainPlayer = document.getElementById('movie_player');
    loaded = true;
}


window.onscroll = function(e) {
    if (!loaded) {
        onYouTubeIframeAPIReady();
        return;
    }
    // When user scrolls down, shows player
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

    // When user scrolls up, hides player
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
};