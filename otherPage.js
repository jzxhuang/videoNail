if (document.getElementById("video-nail")) {
    // Remove script-container (which includes iframe.js)
    if (document.getElementById("script-container")) {
        var scriptContainer = document.getElementById("script-container");
        scriptContainer.parentNode.removeChild(scriptContainer);
        console.log("Remove script-container.");
    }

    if (document.getElementById("iframe-setup")) {
        var iframeSetup = document.getElementById("iframe-setup");
        iframeSetup.parentNode.removeChild(iframeSetup);
    }

    var videoPlaceholder = document.getElementById("video-nail");
    videoPlaceholder.parentNode.removeChild(videoPlaceholder);

    window.onscroll = (e) => {
        return;
    }
}