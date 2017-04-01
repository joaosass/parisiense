var header = document.getElementById("header");

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
