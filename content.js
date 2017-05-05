// TODO: come up with potential ways to reduce running time

// If "script-container" does exist, remove it, then re-add 
// the new "script-container"
if (document.getElementById("script-container")) {
    var scriptContainer = document.getElementById("script-container");
    scriptContainer.parentNode.removeChild(scriptContainer);
}

var scriptContainer = document.createElement("div");
scriptContainer.id = "script-container";
document.body.appendChild(scriptContainer);


// If "iframe-setup" does exist, remove it, then re-add 
// the new "iframe-setup"
if (document.getElementById("iframe-setup")) {
    var iframeSetup = document.getElementById("iframe-setup");
    iframeSetup.parentNode.removeChild(iframeSetup);
}

var iframeSetup = document.createElement('script');
iframeSetup.async = false;
iframeSetup.id = "iframe-setup";
iframeSetup.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(iframeSetup, firstScriptTag);


// If "video-nail" does exist, remove it, then re-add 
// the new "video-nail"
if (document.getElementById("video-nail")) {
    var videoPlaceholder = document.getElementById("video-nail");
    videoPlaceholder.parentNode.removeChild(videoPlaceholder);
}

var videoPlaceholder = document.createElement('div');
videoPlaceholder.id = "video-nail";
document.getElementsByClassName("yt-masthead-logo-container").item(0).appendChild(videoPlaceholder);


// If "iframe-script" does exist, remove it, then re-add 
// the new "iframe-script"
if (document.getElementById("iframe-script")) {
    var iframeScript = document.getElementById("iframe-script");
    iframeScript.parentNode.removeChild(iframeScript);
}

var iframeScript = document.createElement('script');
iframeScript.type = "text/javascript";
iframeScript.id = "iframe-script";
iframeScript.src = chrome.extension.getURL("iframe.js");
document.getElementById("script-container").appendChild(iframeScript);
