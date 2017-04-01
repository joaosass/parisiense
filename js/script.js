var header = document.getElementById("header");
var menu = document.getElementById("menu");
var li = document.querySelectorAll("header li");

onscroll = function(){
    scroller();
}

function scroller(){
    if(scrollY > 150){
        header.classList.add("mostra");
    }
    else{
        header.classList.remove("mostra");
    }
}

var latlng = new google.maps.LatLng(-22.020375, -47.890664);

var options = {
    zoom: 15,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    scrollwheel: false
};

var map = new google.maps.Map(document.getElementById("mapa"), options);

smoothScroll.init();

menu.onclick = function(){
    header.classList.toggle("show");
}

for(var i = 0; i < li.length; i++){
    li[i].onclick = function(){
        header.classList.remove("show");
    }
}
