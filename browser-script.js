let videoNailData, videoNailPlayer, videoNailInterval, videoNailActiveTab;

// Listens for messages posted from the extension 
window.addEventListener("message", event => {
	if (event.data.type) {
		if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-INIT" && event.source == window){
			videoNailData = event.data.videoData;
			videoNailActiveTab = event.data.isActiveTab;
		}
		else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-DELETE") {
			clearInterval(videoNailInterval)
			videoNailInterval = null;
			videoNailPlayer.destroy();
		} else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-START-NEW") {
			videoNailData = event.data.videoData;
			videoNailActiveTab = event.data.isActiveTab;
			videoNailPlayer = new YT.Player('videonail-iframe', {
				events: {
					'onReady': onYTPReady,
					'onError': onYTPError
				}
			});
		} else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-MANUAL-NEW") {
			videoNailData = event.data.videoData;
			videoNailActiveTab = event.data.isActiveTab;
		} else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-ACTIVE-TAB") {
			videoNailData = event.data.videoData;
			videoNailActiveTab = true;
			videoNailPlayer.seekTo(videoNailData.metadata.timestamp, true);
			videoNailData.metadata.isPlaying ? videoNailPlayer.playVideo() : videoNailPlayer.pauseVideo();
			videoNailActiveTab = false;
			videoNailInterval = setInterval(postYTPStatus, 50);
		} else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-BACKGROUND-TAB") {
			clearInterval(videoNailInterval)
			videoNailInterval = null;
			videoNailPlayer.pauseVideo();
			videoNailActiveTab = false;
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
	if (videoNailActiveTab) videoNailInterval = setInterval(postYTPStatus, 50);
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