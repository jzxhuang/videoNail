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


// Remove "mini-iframe-player" if exists
if (document.getElementById("mini-iframe-player")) {
    var miniPlayer = document.getElementById("mini-iframe-player");
    miniPlayer.parentNode.removeChild(miniPlayer);
}


var iframe_script = document.createElement('script');
iframe_script.type = "text/javascript";
iframe_script.id = "mini-iframe-player";
iframe_script.src = chrome.extension.getURL("iframe.js"); 
document.getElementById("script-container").appendChild(iframe_script);

