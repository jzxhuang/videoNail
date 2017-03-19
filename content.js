// TODO: come up with potential ways to reduce running time

// If "script-container" doesn't exist, add it
if (!document.getElementById("script-container")) {
    var scriptContainer = document.createElement("div");
    scriptContainer.id = "script-container";
    document.body.appendChild(scriptContainer);
}


// If "iframe-setup" doesn't exist, add it
if (!document.getElementById("iframe-setup")) {
    var iframeSetup = document.createElement('script');
    iframeSetup.async = false;
    iframeSetup.id = "iframe-setup";
    iframeSetup.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(iframeSetup, firstScriptTag);
}


// If "video-nail" div doesn't exist, add it
if (!document.getElementById("video-nail")) {
    var videoPlaceholder = document.createElement('div');
    videoPlaceholder.id = "video-nail";
    document.getElementsByClassName("yt-masthead-logo-container").item(0).appendChild(videoPlaceholder);
}


// If "iframe-script" doesn't exist, add it
if (!document.getElementById("iframe-script")) {
    var iframeScript = document.createElement('script');
    iframeScript.type = "text/javascript";
    iframeScript.id = "iframe-script";
    iframeScript.src = chrome.extension.getURL("iframe.js");
    document.getElementById("script-container").appendChild(iframeScript);
}