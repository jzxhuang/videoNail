var loaded = false;
var scrollDistance = 430;
var playerIsVisible = false;
var currTime = 0;
var videoId;
if (window.location.search.search("v=") == -1) {
    videoId = null;
} else {
    var firstIndex = window.location.search.search("v=") + 2;
    var lastIndex = firstIndex + 11;
    videoId = window.location.search.substring(firstIndex, lastIndex);
}
console.log(videoId);
var mainPlayer;
var player;
var firstTime = true;


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

if (!videoId) {
    window.onscroll = (e) => { console.log("videoId is null"); }
} else {
    window.onscroll = (e) => {
        if (!loaded) {
            onYouTubeIframeAPIReady();
            return;
        }
        // When user scrolls down, shows player
        if(window.pageYOffset > scrollDistance && !playerIsVisible) {
            currTime = mainPlayer.getCurrentTime();
            player.setSize(320, 180);
            
            if (mainPlayer.getPlayerState() == YT.PlayerState.ENDED) {
                return;
            } else if (mainPlayer.getPlayerState() == YT.PlayerState.PAUSED) {
                player.pauseVideo();
            } else {
                player.seekTo(currTime, true);
                player.playVideo();
            }
            
            mainPlayer.mute();
            player.unMute();
            player.setVolume(mainPlayer.getVolume());
            playerIsVisible = true;
        }

        // When user scrolls up, hides player
        if (window.pageYOffset < scrollDistance && playerIsVisible) {
            currTime = player.getCurrentTime();
            player.setSize(0, 0);
            
            if (player.getPlayerState() == YT.PlayerState.ENDED) {
                return;
            } else if (player.getPlayerState() == YT.PlayerState.PAUSED) {
                mainPlayer.pauseVideo();                
            } else {
                mainPlayer.seekTo(currTime, true);
                mainPlayer.playVideo();
            }

            player.mute();
            mainPlayer.unMute();
            mainPlayer.setVolume(player.getVolume());
            playerIsVisible = false;
        }
    };
}

