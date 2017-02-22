var players;
var player;
players = document.getElementsByTagName("iframe");
var scrollDistance = 430;

for (i = 0; i < players.length; i++) {
    if (players[i].id == "video-nail") {
        player = players[i];
    }
}

if(window.pageYOffset > scrollDistance 
&& document.readyState === "complete"){
    if (player) {
        if (player.width > 0 && player.height > 0) {
            player.width = 0;
            player.height = 0;
        } else {
            player.width = 320;
            player.height = 180;
        }
    }
}


