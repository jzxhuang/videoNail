var meta_list = document.getElementById("watch7-content").getElementsByTagName("meta");
var video_id = "";

for (var i = 0; i < meta_list.length; i++) { 
    if (meta_list[i].getAttribute("itemprop") == "videoId") { 
        video_id = meta_list[i].getAttribute("content");
        break; 
    }
} 

var node = document.createElement("embed");
node.src = "https://www.youtube.com/v/" + video_id + "?autoplay=1&t=2000";
node.width = "320";
node.height = "240";

var threshold = 300;
var video_appended = false;

$(window).on('scroll', function(){
    // When user scrolls down
    if($(window).scrollTop() > threshold){
        document.getElementsByClassName("yt-masthead-logo-container").
        item(0).appendChild(node);
        video_appended = true; 
    }

    // When user scrolls up, the condition below 
    // ensures that there exists a video node when we call removeChild
    if (($(window).scrollTop() < threshold) && video_appended) {
        document.getElementsByClassName("yt-masthead-logo-container").
        item(0).removeChild(node);
        video_appended = false;
    }
});


