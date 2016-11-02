'use strict';

$(function () {
  var circle = void 0;
  var circles = [];
  var infoWindow = void 0;
  var checkBoxesChecked = void 0;
  var $sidebar = $('.sidebar');
  var $container = $('#container');
  var $mapDiv = $('#map');
  var map = new google.maps.Map($mapDiv[0], {
    center: { lat: 42.77509, lng: 13.01239 },
    zoom: 4,
    styles: [{ "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "saturation": 36 }, { "color": "#333333" }, { "lightness": 40 }] }, { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "on" }, { "color": "#ffffff" }, { "lightness": 16 }] }, { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#fefefe" }, { "lightness": 20 }] }, { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#fefefe" }, { "lightness": 17 }, { "weight": 1.2 }] }, { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "weight": "0.94" }, { "visibility": "on" }] }, { "featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{ "visibility": "on" }] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }, { "lightness": 20 }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }, { "lightness": 21 }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#dedede" }, { "lightness": 21 }] }, { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }, { "lightness": 17 }] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#ffffff" }, { "lightness": 29 }, { "weight": 0.2 }] }, { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }, { "lightness": 18 }] }, { "featureType": "road.local", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }, { "lightness": 16 }] }, { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#f2f2f2" }, { "lightness": 19 }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }, { "lightness": 17 }] }]
  });

  //CURRENT POSITION
  var currentPosition = navigator.geolocation.getCurrentPosition(function (position) {
    var latLng = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    map.panTo(latLng);

    var maker = new google.maps.Marker({
      position: latLng,
      animation: google.maps.Animation.DROP,
      draggable: true,
      map: map
    });
  });

  //GO BACK
  $mapDiv.on('click', '#goBack', goBack);
  function goBack() {
    resetMap();
    showFilterForm();
  }

  //RESET MAP
  function resetMap() {
    smoothZoomOut(map, 1, map.getZoom());
    populateMap();
    infoWindow.close();
    infoWindow = undefined;
  }

  //POPULATE MAP
  function populateMap() {
    var getEvents = $.get('http://eonet.sci.gsfc.nasa.gov/api/v2/events').done(function (data) {
      data.events.forEach(function (disaster) {
        if (disaster.geometries[0].coordinates[0] instanceof Array) {
          (function () {
            var bounds = new google.maps.LatLngBounds();
            disaster.geometries[0].coordinates.forEach(function (coords) {
              bounds.extend(new google.maps.LatLng(coords[1], coords[0]));
            });
            circle = new google.maps.Circle({
              center: bounds.getCenter(),
              map: map,
              radius: 500000,
              fillColor: '#ff00ff',
              strokeWeight: 1,
              strokeColor: '#ff00ff',
              category: disaster.categories[0].title
            });
            circles.push(circle);
            addInfoWindowForDisaster(disaster, circle);
          })();
        } else {
          circle = new google.maps.Circle({
            center: new google.maps.LatLng(disaster.geometries[0].coordinates[1], disaster.geometries[0].coordinates[0]),
            map: map,
            radius: 500000,
            fillColor: '#0000ff',
            strokeWeight: 1,
            strokeColor: '#0000ff',
            category: disaster.categories[0].title
          });
          circles.push(circle);
          addInfoWindowForDisaster(disaster, circle);
        }
      });
    });
  }

  //CREATE LOGIN FORM
  function isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  if (isLoggedIn()) {
    showFilterForm();
    populateMap();
  } else {
    showLoginForm();
  }

  function showLoginForm() {
    if (event) event.preventDefault();
    $sidebar.html('\n      <div class="formDiv">\n      <div id="logInForm">\n      <form class="login" action="api/login" method="post">\n      <label for="email"></label>\n      <input type="text" name="email" placeholder="email" value="">\n      <label for="password"></label>\n      <input type="password" name="password" placeholder="password" value=""><br>\n      <input type="submit" name="Log in" value="Log in" class=\'button\'><br>\n      </form>\n      </div>\n\n      <div id="registerForm">\n      <form class="register" action="api/register" method="post">\n      <label for="username"></label>\n      <input type="text" name="username" placeholder="username" value="">\n      <label for="email"></label>\n      <input type="text" name="email" placeholder="email" value="">\n      <label for="password"></label>\n      <input type="password" name="password" placeholder="password" value="">\n      <label for="passwordConfirmation"></label>\n      <input type="password" name="passwordConfirmation" placeholder="password confirmation" value=""><br>\n      <input type="submit" name="register" value="Register" class=\'button\'><br>\n      </form>\n      </div>\n      </div>\n      ');
  }

  //HANDLE-FORM
  $container.on('submit', 'form', handleForm);
  function handleForm() {
    if (event) event.preventDefault();
    var token = localStorage.getItem('token');
    var $form = $(this);

    var url = $form.attr('action');
    var method = $form.attr('method');
    var data = $form.serialize();

    //LOGGING IN & REGISTRATION
    $.ajax({
      url: url,
      method: method,
      data: data,
      beforeSend: function beforeSend(jqXHR) {
        if (token) return jqXHR.setRequestHeader('Authorization', 'Bearer ' + token);
      }
    }).done(function (data) {
      if (data.token) localStorage.setItem("token", data.token);
      console.log('hello');
      showFilterForm();
      populateMap();
    });
  }

  //LOGOUT
  $container.on('click', '#logOut', logout);
  function logout() {
    if (event) event.preventDefault();
    localStorage.removeItem('token');
    showLoginForm();
    circles.forEach(function (circle) {
      circle.setMap(null);
    });
    circles = [];
  }

  //CREATE FILTER FORM
  function showFilterForm() {
    if (event) event.preventDefault();
    $sidebar.html('\n        <ul class="checkbox-grid">\n          <form class="filter" action="#" method="get">\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox button" name="drought" value="Drought" checked="true">Drought</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="dustAndHaze" value="Dust and Haze" checked="true">Dust and Haze</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="wildfires" value="Wildfires" checked="true">Wildfires</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="floods" value="Floods" checked="true">Floods</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="severeStorms" value="Severe Storms" checked="true">Severe Storms</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="volcanoes" value="Volcanoes" checked="true">Volcanoes</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="waterColor" value="Water Color" checked="true">Water Color</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="landslides" value="Landslides" checked="true">Landslides</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="seaLakeIce" value="Sea Lake Ice" checked="true">Sea Lake Ice</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="earthquakes" value="Earthquakes" checked="true">Earthquakes</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="snow" value="Snow" checked="true">Snow</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="temperatureExtreme" value="Temperature Extremes" checked="true">Temperature Extreme</label></li>\n          <li><label class="labelStyle clicked"><input type="checkbox" class="checkBox" name="manMade" value="Manmade" checked="true">Manmade</label></li>\n          </form>\n        </ul>\n        <button id="logOut">Log Out</button>\n        ');
    $("input").on("click", function () {
      $(this).parent().toggleClass('clicked');
      var inputValue = this.value;
      console.log(inputValue);
      getCheckedBoxes();
    });
  }

  //TWITTER FUNCTIONALITY
  function showTwitterForm() {
    if (event) event.preventDefault();
    $sidebar.html('\n\n          <div class="tweetStream">Tweets Div\n          <ul class="tweetItems">\n          </ul>\n          </div>\n          ');
  }

  var $tweetStream = $('.tweetStream');

  function getTweets(title) {
    title = title.split(",")[0];
    console.log(title);
    var tweets = $.get('http://localhost:8000/api/tweets?q=' + title).done(function (data) {
      console.log(data);
      var $tweetItems = $('.tweetItems');
      data.statuses.forEach(function (tweet) {
        console.log(tweet.text);
        var itemHtml = '<li class="stream-item">' + '<div class="tweet">' + '<div id="image">' + '<img src="' + tweet.user.profile_image_url + '" alt="User image goes here.">' + '</div>' + '<div class="content">' + '<strong class="fullname">' + tweet.user.name + '</strong>' + '<span>&rlm;</span>' + '<span>@</span><b>' + tweet.user.screen_name + '</b>' + '&nbsp;&middot;&nbsp;' + '<small>' + tweet.created_at + '</small>' + '<p>' + tweet.text + '</p>' + '</div>' + '</div>' + '</li>';
        $tweetItems.append(itemHtml);

        // '<li>'+tweet.text+'</li>');
      });
    });
  }

  //ADD INFO WINDOW
  function addInfoWindowForDisaster(disaster, circle) {
    google.maps.event.addListener(circle, "click", function () {
      getTweets(disaster.title);
      console.log(circle.category);
      console.log(disaster);
      var date = new Date(disaster.geometries[0].date).toLocaleDateString("en-GB");
      infoWindow = new google.maps.InfoWindow({
        content: '\n              <div class="infoWindow">\n              <h2>' + disaster.title + '</h2>\n              <h5>' + date + '</h5>\n              <a class="button" href="' + disaster.sources[0].url + '" target="_blank">More Information</a>\n              <button id="goBack">Go Back</button>\n              </div>\n              ',
        position: circle.center
      });
      map.setCenter(circle.center);
      map.panTo(circle.center);
      smoothZoomIn(map, 8, map.getZoom());
      circles.forEach(function (circle) {
        circle.setMap(null);
      });
      circles = [];
      setTimeout(function () {
        infoWindow.open(map, circle);
      }, 1500);
      showTwitterForm();
    });
  }

  //FILTERING FUNCTIONALITY
  function getCheckedBoxes() {
    console.log("change");
    var checkBoxes = $(".checkBox");
    checkBoxesChecked = [];
    for (var i = 0; i < checkBoxes.length; i++) {
      if (checkBoxes[i].checked) {
        checkBoxesChecked.push(checkBoxes[i].defaultValue);
      }
    }
    console.log(checkBoxesChecked);
    filterCategories();
  }

  function filterCategories() {
    for (var i = 0; i < circles.length; i++) {
      if (checkBoxesChecked.indexOf(circles[i].category) > -1) {
        circles[i].setVisible(true);
      } else {
        circles[i].setVisible(false);
      }
    }
  }

  //ZOOM-FUNCTIONS
  //http://stackoverflow.com/questions/4752340/how-to-zoom-in-smoothly-on-a-marker-in-google-maps
  function smoothZoomIn(map, max, cnt) {
    if (cnt >= max) {
      return;
    } else {
      (function () {
        var z = google.maps.event.addListener(map, 'zoom_changed', function (event) {
          google.maps.event.removeListener(z);
          smoothZoomIn(map, max, cnt + 1);
        });
        setTimeout(function () {
          map.setZoom(cnt);
        }, 150);
      })();
    }
  }

  function smoothZoomOut(map, min, cnt) {
    if (cnt <= min) {
      return;
    } else {
      (function () {
        var z = google.maps.event.addListener(map, 'zoom_changed', function (event) {
          google.maps.event.removeListener(z);
          smoothZoomOut(map, min, cnt - 1);
        });
        setTimeout(function () {
          map.setZoom(cnt);
        }, 150);
      })();
    }
  }
  // }
});