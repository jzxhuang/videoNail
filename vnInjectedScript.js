let videoData, player, myInterval;

// Listens for messages posted from the extension 
window.addEventListener("message", event => {
	if (event.data.type) {
		if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-INIT" && event.source == window)
			videoData = event.data.videoData;
		else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-DELETE") {
			clearInterval(myInterval)
			myInterval = null;
			player.destroy();
		} else if (event.data.type === "VIDEONAIL-CONTENT-SCRIPT-START-NEW") {
			player = new YT.Player('videonail-iframe', {
				events: {
					'onReady': onYTPReady,
					'onError': onYTPError
				}
			});
		}
	}
}, false);

// Create the player object
function onYouTubeIframeAPIReady() {
	player = new YT.Player('videonail-iframe', {
		events: {
			'onReady': onYTPReady,
			'onError': onYTPError
		}
	});
}

function onYTPReady() {
	// Start the interval
	myInterval = setInterval(postYTPStatus, 250);
}

function onYTPError(err) {
	console.log(err);
}

// Update video metadata through window message in an interval
function postYTPStatus() {
	videoData.metadata.isPlaying =
		(player.getPlayerState() == 1 || player.getPlayerState() == 3) ? true : false;
	videoData.metadata.timestamp = player.getCurrentTime();
	videoData.metadata.id = player.getVideoUrl().split("v=")[1].split("&")[0];
	window.postMessage({
		type: "VIDEONAIL-BROWSER-SCRIPT-YTP-STATUS",
		vidMetadata: videoData.metadata
	}, "*");
}