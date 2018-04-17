var VN_enabled = true;

window.onload = function() {
    chrome.management.getSelf(function(extensionInfo) {
        VN_enabled = extensionInfo.enabled;
    });
    document.getElementById('VN_switch').checked = VN_enabled;

    document.getElementById('VN_switch').addEventListener('click', function() {
        toggleVN();
    });
}

function toggleVN() {
    VN_enabled = !VN_enabled;
    chrome.management.getSelf(function(extensionInfo) {
        chrome.management.setEnabled(extensionInfo.id, VN_enabled);
    });
}