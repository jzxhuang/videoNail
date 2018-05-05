let VN_enabled = true;

window.onload = function () {
  chrome.storage.local.get('VN_state', function (state) {
    if (state && state.VN_state) {
      VN_enabled = state.VN_state.enabled;
    }
    else {
      chrome.storage.local.set({
        VN_state: {
          enabled: VN_enabled
        }
      });
    }
    document.getElementById('VN_switch').checked = VN_enabled;
    if (VN_enabled) checkIfWatchPage();
    else document.getElementById("searchButton").disabled = true;
  });

  document.getElementById('VN_switch').addEventListener('click', function () {
    toggleVN();
  });

  document.getElementById("searchButton").addEventListener('click', function () {
    openLink();
  });

  document.getElementById('searchLink').addEventListener('input', function () {
    let searchBar = document.getElementById('searchLink');
    let searchUrl = searchBar.value;
    validateUrl(searchUrl)
      .then(_ => {
        document.getElementById('searchLink').classList.remove("error");
      })
      .catch(err => {
        document.getElementById('searchLink').classList.add('error');
      })
  });
}

function toggleVN() {
  VN_enabled = !VN_enabled;
  let state = {
    VN_state: {
      enabled: VN_enabled
    }
  }
  chrome.storage.local.set(state);
  document.getElementById("searchButton").disabled = !VN_enabled;

  // Delete VideoNails in all tabs when disabled
  if (!VN_enabled) {
    chrome.tabs.query({}, function (tabs) {
      let message = { type: "VN-DISABLE" };
      for (let i = 0; i < tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, message);
      }
    });
  }
}

function openLink() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    let tab = tabs[0];
    let searchUrl = document.getElementById('searchLink').value;
    validateUrl(searchUrl)
      .then(_ => {
        document.getElementById("errorMessage").style.display = "none";
        chrome.tabs.sendMessage(tab.id, { type: "MANUAL-START", url: searchUrl });
      })
      .catch(err => {
        document.getElementById("errorMessage").style.display = "inline";
        console.log(err);
      });
  });
}

// Disable opening VideoNails on /watch pages
function checkIfWatchPage() {
  // chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  //   let tab = tabs[0];
  //   if (tab.url.includes("youtube.com/watch")) {
  //     document.getElementById("searchButton").disabled = true;
  //   }
  //   else {
  //     document.getElementById("searchButton").disabled = false;
  //   }
  // });
}

// Validate url
function validateUrl(url) {
  return new Promise((resolve, reject) => {
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) resolve()
    else reject('Invalid url');
  });
}