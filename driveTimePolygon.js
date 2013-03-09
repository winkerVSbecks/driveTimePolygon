/***************************************************************
*									
*				DRIVE TIME POLYGON GENERATOR
*				works with GOOGLE MAPS API VERSION 3
*				Based on: http://maps.forum.nu/gm_driving_radius.html
*					which was built for ver 2 of the maps API
*				author: Varun Vachhar (http://winkerVSbecks.com)
*
****************************************************************/
$(document).ready(function() {

	var centerPoint = new google.maps.LatLng(43.653226,-79.383184);
	var directionsService = new google.maps.DirectionsService();
	var directionsDisplay;
	var driveTimeOverlaysArray = [];
	var driveTimePolygonArray = [];
	var drivePolygonCenterMarker;
	var drivePolygonCenter;
	var drivePolyPoints = Array();
	var searchPolygon,drivePolygon;
	var queryLimitDelay = 5000;
	var timeToDrive = 30; // in minutes
	var angResolution = 45; // in degrees
	var carSpeed = 60; // in km/hr (to get a rough circle)
	var map = new google.maps.Map(document.getElementById('mapDiv'), {
	 zoom: 10,
	 center: centerPoint,
	 mapTypeId: google.maps.MapTypeId.ROADMAP
	});
	google.maps.event.addListener(map, "click", mapClick);


	function mapClick(e) {
		drivePolygonCenter = e.latLng;
		clearOverlays(driveTimeOverlaysArray);
		drivePolygonCenterMarker = new google.maps.Marker({
		  position: e.latLng,
		  map: map
		});
		driveTimeOverlaysArray.push(drivePolygonCenterMarker);
		searchPoints = getCirclePoints(drivePolygonCenter, carSpeed*timeToDrive/60);
		drivePolyPoints = Array();
		getDirections();
	}


	function getCirclePoints(center, radius){
		var bounds = new google.maps.LatLngBounds();
		var circlePoints = Array();
		var searchPoints = Array();

		with (Math) {
			var rLat = (radius/6378.135) * (180/PI); //3963.189 for miles 
			var rLng = rLat/cos(center.lat() * (PI/180));

			for (var a = 0 ; a < 361 ; a++ ) {
				var aRad = a*(PI/180);
				var x = center.lng() + (rLng * cos(aRad));
				var y = center.lat() + (rLat * sin(aRad));
				var point = new google.maps.LatLng(parseFloat(y),parseFloat(x),true);
				circlePoints.push(point);
				bounds.extend(point); 
				if (a % angResolution == 0) {
					searchPoints.push(point);
				}
			}
		}

		searchPolygon = new google.maps.Polygon({
	    paths: circlePoints,
	    strokeColor: "#0000ff",
	    strokeOpacity: 0.8,
	    strokeWeight: 2,
	    fillColor: "#0000ff",
	    fillOpacity: 0.2
	  });
		searchPolygon.setMap(map);
		driveTimeOverlaysArray.push(searchPolygon);
		
		map.fitBounds(bounds); 
		return searchPoints;
	}


	function getDirections() {
		if (!searchPoints.length) {
			return;
		}

		directionsDisplay = new google.maps.DirectionsRenderer({
			preserveViewport: true,
			suppressMarkers: true,
			suppressPolylines: true
		});

		var from = drivePolygonCenterMarker.getPosition().lat() + ' ' + drivePolygonCenterMarker.getPosition().lng();
		var to = searchPoints[0].lat() + ' ' + searchPoints[0].lng();
	  var request = {
	    origin: from,
	    destination: to,
	    travelMode: google.maps.TravelMode.DRIVING
	  };
	  searchPoints.shift();

	  directionsRequest(request);

	  if(searchPoints.length <= 1) {
	  	clearOverlays(driveTimeOverlaysArray);
	  }
	}


	// In order to account for the query limit issue
	function directionsRequest(request) {
	  directionsService.route(request, function(result, status) {
	    if (status == google.maps.DirectionsStatus.OK) {
	      onDirectionsLoad(result);
	    } else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) { 
	    	console.log(status+": retrying in 1 sec");   
	      setTimeout(function() {
	          directionsRequest(request);
	      }, queryLimitDelay);
	    } else {
	    	console.log(status);
	    }
	  });
	}


	function onDirectionsLoad(result) {
		directionsDisplay.setDirections(result);

		var polyline = new google.maps.Polyline({
			path: [],
			strokeColor: '#0000FF',
			strokeWeight: 5
		});
		
		var legs = result.routes[0].legs;
		shortenBasedOnTimeAndShow(legs);
		getDirections();
	}


	function shortenBasedOnTimeAndShow(legs) {
		var time = 0;
		var copyPoints = Array();

		for (i=0;i<legs.length;i++) {
			var steps = legs[i].steps;
			for (j=0;j<steps.length;j++) {
				var nextSegment = steps[j].path;
				var stepTime = steps[j].duration.value/60;
				time += stepTime
				if (time < timeToDrive) {
					if (j>0) {
						copyPoints.push(steps[j-1].path[steps[j-1].path.length-1]);
					} else {
						copyPoints.push(steps[j].path[steps[j].path.length-1]);
					}
				}
			}
		}
		
		var lastPoint = copyPoints[copyPoints.length-1];
		
		drivePolyPoints.push(lastPoint);
		if (drivePolyPoints.length > 3) {
			if (drivePolygon) {
				drivePolygon.setMap(null);
			}	
			drivePolygon = new google.maps.Polygon({
		    paths: drivePolyPoints,
		    strokeColor: "#00ff00",
		    strokeOpacity: 1,
		    strokeWeight: 1,
		    fillColor: "#00ff00",
		    fillOpacity: 0.4
		  });
			drivePolygon.setMap(map);
			driveTimePolygonArray.push(drivePolygon);
		}
	}


	/*************************************
		HELPER FUNCTIONS
	*************************************/
	// Removes the overlays from the map, but keeps them in the array
	function clearOverlays(_driveTimeOverlaysArray) {
	  if (_driveTimeOverlaysArray) {
	    for (i in _driveTimeOverlaysArray) {
	      _driveTimeOverlaysArray[i].setMap(null);
	    }
	  }
	}

});
