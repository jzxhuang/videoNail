// TODO: come up with potential ways to optimize loading time
console.log("loading content.js")
var loaded = false;
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



// This forces the videoPlaceholder to update with new video
// on the current tab instead of previous video
if (document.getElementById("video-nail")) {
    let oldPlaceholder = document.getElementById("video-nail");
    oldPlaceholder.parentNode.removeChild(oldPlaceholder);
}

var videoPlaceholder = document.createElement('div');
videoPlaceholder.id = "video-nail";

window.onscroll = (e) => {
    if (loaded) return;
    loaded = true;
    console.log("haha");
    document.getElementById("content").appendChild(videoPlaceholder);
    
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
}
