function addScriptContainer() {
  return new Promise((resolve, reject) => {
    if (document.querySelector("#script-container")) {
      let scriptContainer = document.querySelector("#script-container");
      scriptContainer.parentNode.removeChild(scriptContainer);
    }

    var scriptContainer = document.createElement("div");
    scriptContainer.id = "script-container";
    document.body.appendChild(scriptContainer);
    resolve();
  })
}

function setVideoEventHandlers() {
  return new Promise((resolve, reject) => {
    if (document.getElementById("vidEventHandlers")) {
      let oldHandlerScript = document.getElementById("vidEventHandlers");
      oldHandlerScript.parentNode.removeChild(vidHandlerScript);
    }
    var vidHandlerScript = document.createElement('script');
    vidHandlerScript.type = "text/javascript";
    vidHandlerScript.id = "vidEventHandlers";
    vidHandlerScript.src = chrome.extension.getURL("vidEventHandlers.js");
    document.getElementById("script-container").appendChild(vidHandlerScript);
    vidHandlerScript.onload = resolve;
  })
}

function addIframeAPI() {
  return new Promise((resolve, reject) => {
    if (document.querySelector("#iframe-API")) {
      let iframeAPI = document.querySelector("#iframe-API");
      iframeAPI.parentNode.removeChild(iframeAPI);
    }
    var iframeAPI = document.createElement('script');
    iframeAPI.id = "iframe-API";
    iframeAPI.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(iframeAPI, firstScriptTag);
  }) 
}

function addVideonailContainer() {
  if (document.getElementById("videonail-container")) {
    let oldContainer = document.getElementById("videonail-container");
    oldContainer.parentNode.removeChild(oldContainer);
  }

  // Create #videonail div and insert it inside #videonail-container div
  var videoNailContainer = document.createElement('div');
  videoNailContainer.id = "videonail-container";
  var videoNail = document.createElement('div');
  videoNail.id = "videonail";
  videoNailContainer.appendChild(videoNail);
  document.getElementById("content").appendChild(videoNailContainer);
}

addScriptContainer()
  .then(_ => {
    return setVideoEventHandlers();
  })
  .then(_ => {
    return addIframeAPI();
  })
  .catch(err => {
    console.log(err);
  });

addVideonailContainer();
