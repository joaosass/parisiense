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

var latlng = new google.maps.LatLng(-48.1800401, -21.7878522);

var options = {
    zoom: 15,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    scrollwheel: false
};

var map = new google.maps.Map(document.getElementById("mapa"), options);
