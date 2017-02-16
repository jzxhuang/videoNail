// If "iframe-setup" doesn't exist, add it
if (!document.getElementById("iframe-setup")) {
    var tag = document.createElement('script');
    tag.async = false;
    tag.id = "iframe-setup";
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}


// If "script-container" doesn't exists, add it
if (!document.getElementById("script-container")) {
    var container = document.createElement("div");
    container.id = "script-container";
    document.body.appendChild(container);
}


var iframe_script = document.createElement('script');
iframe_script.type = "text/javascript";
iframe_script.src = chrome.extension.getURL("iframe.js"); 
document.getElementById("script-container").appendChild(iframe_script);
