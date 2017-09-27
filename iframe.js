var scrollDistance = 200;
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
// After loading "iframe-setup" script in the DOM, 
// it will call this function
function onYouTubeIframeAPIReady() {
    player = new YT.Player('video-nail', {
        height: "0",
        width: "0",
        videoId: videoId,
        events: {
            "onReady": (e) => {
                e.target.mute();
                e.target.playVideo();
                e.target.pauseVideo();
            }
        }
    });
    mainPlayer = document.getElementById('movie_player');
}

onYouTubeIframeAPIReady();

if (!videoId) {
    window.onscroll = (e) => { console.log("videoId is null"); }
} else {
    window.onscroll = (e) => {
        // When user scrolls down, shows player
        if (window.pageYOffset > scrollDistance && !playerIsVisible) {
            playerIsVisible = true;
            if (mainPlayer.getPlayerState() == YT.PlayerState.ENDED ||
                mainPlayer.getPlayerState() == YT.PlayerState.CUED) {
                player.setSize(0, 0);
                playerIsVisible = false;
                if (player.getPlayerState() != YT.PlayerState.ENDED) {
                    player.stopVideo();
                }
                return;
            }
            currTime = mainPlayer.getCurrentTime();
            currSpeed = mainPlayer.getPlaybackRate();
            var width = (window.innerWidth || document.body.clientWidth) / 2.5;
            var height = (9 * width) / 16; // 16:9 ratio
            player.setSize(width, height);
            player.seekTo(currTime, true);
            player.setPlaybackRate(currSpeed);
            player.playVideo();

            if (mainPlayer.getPlayerState() == YT.PlayerState.PAUSED) {
                player.pauseVideo();
                return;
            }

            if (mainPlayer.isMuted()) {
                player.mute();
                return;
            }

            player.unMute();
            player.setVolume(mainPlayer.getVolume());
            mainPlayer.mute();
        }

        // When user scrolls up, hides player
        if (window.pageYOffset < scrollDistance && playerIsVisible) {
            playerIsVisible = false;
            if (player.getPlayerState() == YT.PlayerState.ENDED ||
                player.getPlayerState() == YT.PlayerState.CUED) {
                player.setSize(0, 0);
                if (mainPlayer.getPlayerState() != YT.PlayerState.ENDED) {
                    mainPlayer.stopVideo();
                }
                return;
            }
            currTime = player.getCurrentTime();
            currSpeed = player.getPlaybackRate();
            player.setSize(0, 0);
            mainPlayer.seekTo(currTime, true);
            mainPlayer.setPlaybackRate(currSpeed);
            mainPlayer.playVideo();

            if (player.getPlayerState() == YT.PlayerState.PAUSED) {
                mainPlayer.pauseVideo();
                return;
            }

            mainPlayer.unMute();
            mainPlayer.setVolume(player.getVolume());
            player.mute();
        }
    };
}

