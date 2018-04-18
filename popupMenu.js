var VN_enabled = true;

window.onload = function() {
  chrome.storage.local.get('VN_state', function(state) {
    VN_enabled = state.VN_state.enabled;
    console.log(state.VN_state.enabled);
    document.getElementById('VN_switch').checked = VN_enabled;
  });

  document.getElementById('VN_switch').addEventListener('click', function() {
    toggleVN();
  });

  document.getElementById("searchButton").addEventListener('click', function() {
    openLink();
  });
}

function toggleVN() {
  VN_enabled = !VN_enabled;
  var state = {
    VN_state: {
        enabled: VN_enabled
    }
  }
  chrome.storage.local.set(state);
}

function openLink() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    var tab = tabs[0];
    if (tab.url.includes("youtube.com/watch?v=")) return;
    else {
      var searchUrl = document.getElementById('searchLink').value;
      chrome.tabs.sendMessage(tab.id, {type: "MANUAL-START", url: searchUrl});  
    }
  });
}