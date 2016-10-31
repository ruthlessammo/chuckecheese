$(() => {
  let $mapDiv = $('#map');

  let map = new google.maps.Map($mapDiv[0], {
    center: { lat: 42.77509, lng: 13.01239 },
    zoom: 3
  });

  console.log(map);

// //CURRENT POSITION
//   navigator.geolocation.getCurrentPosition((position) => {
//     let latLng = {
//       lat: position.coords.latitude,
//       lng:position.coords.longitude
//     };
//     map.panTo(latLng);
//     //map.setZoom(5);
//
//     let maker = new google.maps.Marker({
//       position: latLng,
//       animation: google.maps.Animation.DROP,
//       draggable: true,
//       map
//     });
//   });

//POPULATE MAP
  let getEvents = $.get('http://eonet.sci.gsfc.nasa.gov/api/v2/events')
  .done(function(data) {
    data.events.forEach((disaster) => {
      if(disaster.geometries[0].coordinates[0] instanceof Array) {
        let bounds = new google.maps.LatLngBounds();
        disaster.geometries[0].coordinates.forEach((coords) => {
          bounds.extend(new google.maps.LatLng(coords[1], coords[0]));
        });
        let circle = new google.maps.Circle({
          center: bounds.getCenter(),
          map: map,
          radius: 500000,
          fillColor: '#ff00ff'
        });
        addInfoWindowForDisaster(disaster, circle);
      } else {
        let circle = new google.maps.Circle({
          center: new google.maps.LatLng(disaster.geometries[0].coordinates[1], disaster.geometries[0].coordinates[0]),
          map: map,
          radius: 500000,
          fillColor: '#ff00ff'
        });
        addInfoWindowForDisaster(disaster, circle);
      }
    });
});

//ADD INFO WINDOW
function addInfoWindowForDisaster(disaster, circle) {
  google.maps.event.addListener(circle, "click", () => {
    // console.log(circle);
    // console.log(disaster);
    let infoWindow = new google.maps.InfoWindow({
      content: `
      <h2>${disaster.title}</h2>`,
      position: circle.center
    });
    infoWindow.open(map, circle);
    map.setCenter(circle.center);
    map.panTo(circle.center);
    smoothZoom(map, 8, map.getZoom());
  });
}

//http://stackoverflow.com/questions/4752340/how-to-zoom-in-smoothly-on-a-marker-in-google-maps
function smoothZoom (map, max, cnt) {
    if (cnt >= max) {
        return;
    }
    else {
      let z = google.maps.event.addListener(map, 'zoom_changed', function(event){
              google.maps.event.removeListener(z);
              smoothZoom(map, max, cnt + 1);
      });
      setTimeout(function(){ map.setZoom(cnt); }, 200);
    }
}

});
