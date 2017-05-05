var loaded = false;
var scrollDistance = 430;
var playerIsVisible = false;
var currTime = 0;
var currSpeed = 0;
var videoId;
if (window.location.search.search("v=") == -1) {
    videoId = null;
} else {
    var firstIndex = window.location.search.search("v=") + 2;
    var lastIndex = firstIndex + 11;
    videoId = window.location.search.substring(firstIndex, lastIndex);
}
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
        if (window.pageYOffset > scrollDistance && !playerIsVisible) {
            playerIsVisible = true;
            currTime = mainPlayer.getCurrentTime();
            currSpeed = mainPlayer.getPlaybackRate();
            player.setSize(320, 180);

            if (mainPlayer.getPlayerState() == YT.PlayerState.ENDED) {
                return;
            }

            if (mainPlayer.getPlayerState() == YT.PlayerState.PAUSED) {
                player.pauseVideo();
                return;
            }

            player.seekTo(currTime, true);
            player.setPlaybackRate(currSpeed);
            player.playVideo();

            if (mainPlayer.isMuted()) {
                player.mute();
            } else {
                player.unMute();
                player.setVolume(mainPlayer.getVolume());
            }

            mainPlayer.mute();
        }

        // When user scrolls up, hides player
        if (window.pageYOffset < scrollDistance && playerIsVisible) {
            playerIsVisible = false;
            currTime = player.getCurrentTime();
            currSpeed = player.getPlaybackRate();
            player.setSize(0, 0);

            if (player.getPlayerState() == YT.PlayerState.ENDED) {
                return;
            }

            if (player.getPlayerState() == YT.PlayerState.PAUSED) {
                mainPlayer.pauseVideo();
                return;
            }

            mainPlayer.seekTo(currTime, true);
            mainPlayer.setPlaybackRate(currSpeed);
            mainPlayer.playVideo();

            if (player.isMuted()) {
                mainPlayer.mute();
            } else {
                mainPlayer.unMute();
                mainPlayer.setVolume(player.getVolume());
            }

            player.mute();
        }
    };
}

