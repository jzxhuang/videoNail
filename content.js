var node = document.createElement("embed");
node.src = "https://www.youtube.com/v/uLPGC3gFFso?autoplay=1";
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

    // When user scrolls up
    // The condition below ensures that there exists a video node 
    // when we call removeChild
    if (($(window).scrollTop() < threshold) && video_appended) {
        document.getElementsByClassName("yt-masthead-logo-container").
        item(0).removeChild(node);
        video_appended = false;
    }
});


