var VN_enabled = true;

window.onload = function() {
    // chrome.management.getSelf(function(extensionInfo) {
    //     VN_enabled = extensionInfo.enabled;
    // });
    chrome.storage.local.get('VN_state', function(state) {
        VN_enabled = state.VN_state.enabled;
        console.log(state.VN_state.enabled);
        document.getElementById('VN_switch').checked = VN_enabled;
    });

    document.getElementById('VN_switch').addEventListener('click', function() {
        toggleVN();
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
    // chrome.management.getSelf(function(extensionInfo) {
    //     chrome.management.setEnabled(extensionInfo.id, VN_enabled);
    // });
}