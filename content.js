// This script removes existing scripts from the previous run
// and re-inserts all scripts back to the YouTube page again
// TODO: come up with potential ways to reduce running time

// Remove "script-container" if exists
if (document.getElementById("script-container")) {
    var scriptContainer = document.getElementById("script-container");
    scriptContainer.parentNode.removeChild(scriptContainer);
}


// Insert "script-container"
var scriptContainer = document.createElement("div");
scriptContainer.id = "script-container";
document.body.appendChild(scriptContainer);


// If "iframe-setup" does exist, remove it
if (document.getElementById("iframe-setup")) {
    var iframeSetup = document.getElementById("iframe-setup");
    iframeSetup.parentNode.removeChild(iframeSetup);
}


// Insert YouTube API
var iframeSetup = document.createElement('script');
iframeSetup.async = false;
iframeSetup.id = "iframe-setup";
iframeSetup.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(iframeSetup, firstScriptTag);


// If "video-nail" div does exist, remove it
if (document.getElementById("video-nail")) {
    var videoPlaceholder = document.getElementById("video-nail");
    videoPlaceholder.parentNode.removeChild(videoPlaceholder);
}


// Insert "video-nail" div underneath YouTube logo
var videoPlaceholder = document.createElement('div');
videoPlaceholder.id = "video-nail";
document.getElementsByClassName("yt-masthead-logo-container").item(0).appendChild(videoPlaceholder);


// Remove "iframe-script" if exists
if (document.getElementById("iframe-script")) {
    var iframeScript = document.getElementById("iframe-script");
    iframeScript.parentNode.removeChild(iframeScript);
}


// Insert "iframe-script"
var iframeScript = document.createElement('script');
iframeScript.type = "text/javascript";
iframeScript.id = "iframe-script";
iframeScript.src = chrome.extension.getURL("iframe.js"); 
document.getElementById("script-container").appendChild(iframeScript);

