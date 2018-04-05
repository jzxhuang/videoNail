
// TODO: Fetch time, speed, width, height, id from storage
var time = 0;
var speed = 0;
var id = "AHX6tHdQGiQ";
var player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player-container', {
    // TODO: Set width, height of the player
    height: "450",
    width: "800",
    videoId: id,
    events: {
      'onReady': onPlayerReady
    }
  });
  // player.setSize(width, height);
  // player.seekTo(time, true);
  // player.setPlaybackRate(speed);
  // player.playVideo();
}

function onPlayerReady(event) {
  // TODO: Set all metadata (curr time, speed) to the video (event.target)
  event.target.playVideo();
}
