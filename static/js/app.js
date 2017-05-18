var map;
var infoWindow;
var placeList = ko.observableArray([]);
var mylocation;
var markers = [];
var userdestination = ko.observable();
var userSearch = ko.observable();
var googleMapRequestTimeout = setTimeout(function () {
    alert('Google map is not loaded, your request to google map may be rejected. Please refresh again, or check out your Internet connection restriction.');
}, 10000);

function initMap() {
    if (google.maps) {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: 40.7000108,
                lng: -74.0151016
            },
            zoom: 15,
            // change the postion of the mapTypeControl button
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_CENTER
            },
        });
        // if google.maps is on service,clear the time out
        clearTimeout(googleMapRequestTimeout);
        infoWindow = new google.maps.InfoWindow({
            map: map
        });
        infoWindow.close();
        if (navigator.geolocation) {
            // if geolocation service is available, mark my location
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                mylocation = pos;
                infoWindow.close();
                markMylocation();
                markAllPlaces(mylocation);
            }, function () {
                handleLocationError(true, infoWindow, map.getCenter());
            });
            // clearTimeout(googleMapRequestTimeout);
        } else {
            // if geolocation service is not available,
            // mark my location as a default one
            mylocation = center;
            markMylocation();
            // Browser doesn't support Geolocation
            handleLocationError(false, infoWindow, map.getCenter());
        }
        // directionsService and directionsDisplay for route
        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer;
        directionsDisplay.setMap(map);
        var onChangeHandler = function () {
            calculateAndDisplayRoute(directionsService, directionsDisplay);
        };
        document.getElementById('go').addEventListener('click', onChangeHandler);
    } else {
        // if an error occur, alert 'Google Map API Error'
        alert('Google Map API Error');
    };
}

function markMylocation() {
    var mylocationmarker = new google.maps.Marker({
        map: map,
        position: mylocation,
        draggable: true,
        icon: 'http://maps.google.com/mapfiles/kml/paddle/purple-circle.png'
    });
    // user can drag the mylocation mark if the location is not right
    google.maps.event.addListener(mylocationmarker, 'dragend', function () {
        mylocation = {
            lat: mylocationmarker.getPosition().lat(),
            lng: mylocationmarker.getPosition().lng()
        };
        deleteMarkers();
        placeList.removeAll();
        markAllPlaces(mylocation);
        map.setCenter(mylocationmarker.getPosition());
    });
    map.setCenter(mylocationmarker.getPosition());
}


function markAllPlaces(mylocation) {
    // search nearby location with foursquare api  all subtype with type Outdoors & Recreation
    // just change the categoryId to whatever you want
    // more info about categoryId : "https://developer.foursquare.com/categorytree"
    // if an error occur, alert 'Foursquare API Error'
    var foursquareAPI = "https://api.foursquare.com/v2/venues/search?";
    $.getJSON(
            foursquareAPI, {
                ll: mylocation.lat + "," + mylocation.lng,
                client_id: "TT32PMNK41YRE4AZXGRSUZCYRRUPGAK3SDKBZENFRIRZQ0IL",
                client_secret: "R1WZWEBWMVYSFWC0NAHCZEDRR0CQEYXXVSBXACY3XO31UMIP",
                categoryId: "4d4b7105d754a06377d81259,",
                radius: "2000",
                v: '20170505'
            },
            function (data) {
                $.each(data.response.venues, function (index, element) {
                    createMarker(element);
                });
            })
        .fail(function () {
            alert('Foursquare API Error');
        })
};


function createMarker(place) {
    // mark the result and add them into the placelist
    var placeLoc = {
        lat: place.location.lat,
        lng: place.location.lng
    };
    var marker = new google.maps.Marker({
        map: map,
        position: placeLoc,
        animation: google.maps.Animation.DROP
    });
    // the mark will bounce and show some info when click
    // the userdestination will be set to this mark
    google.maps.event.addListener(marker, 'click', function () {
        userdestination(marker.position)
        document.getElementById('go').disabled = false;
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null);
        }, 2000);
        infoWindow.setContent(place.name);
        infoWindow.open(map, this);
    });
    markers.push(marker);

    placeList.push({
        "name": place.name,
        "categories": place.categories[0].name
    });
}

function deleteMarkers() {
    // delete all markers
    // when user drag the user location mark
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    // handle the service error
    mylocation = {
            lat: 40.7000108,
            lng: -74.0151016
        },
        markMylocation();
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed. \n But you can drag the blue mark to an approximate location' :
        'Error: Your browser doesn\'t support geolocation.');
}


function clickOnList(placename) {
    // when user click the place list,
    // animate the related marker
    // set the user destination there
    // enable the button to get the route
    choosenmarker = markers[placeList.indexOf(placename)]
    userdestination(choosenmarker.position)
    google.maps.event.trigger(choosenmarker, 'click');
    document.getElementById('go').disabled = false;
}

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    // This funtion calculate and display route
    directionsService.route({
        origin: mylocation,
        destination: userdestination(),
        travelMode: 'WALKING'
    }, function (response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

// This funtion slide to hide or show options-box
$(document).ready(function () {
    $('#pollSlider-button').click(function () {
        if ($(this).css("margin-left") == "290px") {
            $('.options-box').animate({
                "margin-left": '-=340'
            });
            $('#pollSlider-button').animate({
                "margin-left": '-=290'
            });
        } else {
            $('.options-box').animate({
                "margin-left": '+=340'
            });
            $('#pollSlider-button').animate({
                "margin-left": '+=290'
            });
        }
    });
});

function View() {
    this.filterKeyword = ko.observable();
    this.filter = ko.computed(() => {
        if (!this.filterKeyword()) {
            // No input found, return all
            return placeList();
        } else {
            // input found, match keyword to filter
            return ko.utils.arrayFilter(placeList(), (item) => {
                $("#test").text(item.categories);
                var nameStr = item.name.toLowerCase().indexOf(this.filterKeyword().toLowerCase()) !== -1;
                var categoriesStr = item.categories.toLowerCase().indexOf(this.filterKeyword().toLowerCase()) !== -1;
                return nameStr || categoriesStr;
            });
        }
    });
}
ko.applyBindings(new View());