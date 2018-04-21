let videoNailData, videoNailPlayer, videoNailInterval;

// Listens for messages posted from the extension 
window.addEventListener("message", event => {
	if (event.data.type) {
		if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-INIT" && event.source == window)
			videoNailData = event.data.videoData;
		else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-DELETE") {
			clearInterval(videoNailInterval)
			videoNailInterval = null;
			videoNailPlayer.destroy();
		} else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-START-NEW") {
			videoNailPlayer = new YT.Player('videonail-iframe', {
				events: {
					'onReady': onYTPReady,
					'onError': onYTPError
				}
			});
		} else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-MANUAL-NEW") {
			videoData = event.data.videoData;
			var player = document.getElementById('videonail-iframe');
			player.src = `https://www.youtube.com/embed/${videoData.metadata.id}?enablejsapi=1&modestbranding=1`;
			videoNailPlayer.loadVideoById({
				videoId: videoData.metadata.id
			});
		}
	}
}, false);

// Create the player object
function onYouTubeIframeAPIReady() {
	videoNailPlayer = new YT.Player('videonail-iframe', {
		events: {
			'onReady': onYTPReady,
			'onError': onYTPError
		}
	});
}

function onYTPReady() {
	// Start the interval
	videoNailInterval = setInterval(postYTPStatus, 250);
}

function onYTPError(err) {
	console.log(err);
}

// Update video metadata through window message in an interval
function postYTPStatus() {
	videoNailData.metadata.isPlaying =
		(videoNailPlayer.getPlayerState() == 1 || videoNailPlayer.getPlayerState() == 3) ? true : false;
	videoNailData.metadata.timestamp = videoNailPlayer.getCurrentTime();
	videoNailData.metadata.id = videoNailPlayer.getVideoUrl().split("v=")[1].split("&")[0];
	window.postMessage({
		type: "VIDEONAIL-BROWSER-SCRIPT-YTP-STATUS",
		vidMetadata: videoNailData.metadata
	}, "*");
}