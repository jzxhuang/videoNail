// If "video-nail" div does exist, remove it
if (document.getElementById("video-nail")) {
    var videoPlaceholder = document.getElementById("video-nail");
    videoPlaceholder.parentNode.removeChild(videoPlaceholder);
}