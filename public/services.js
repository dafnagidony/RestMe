restmeApp.service('searchDetailsService', function() {	

});

restmeApp.service('signModals', function() {	
	var query = window.location.href.split('?')[1];
	if (query != undefined) {
		if (query.indexOf('login_fail=true') != -1) {
	    $('#sighinModal').modal('show');
	    $('#signin_message').show();
	    $('#signin_message').html('login error');
	  }
	  else {
	  	$('#signin_message').hide();
	  }
	  if (query.indexOf('signup_fail=true') != -1) {
	   $('#sighupModal').modal('show');
	   $('#signup_message').show();
	   $('#signup_message').html('sign up error');
	  }
	  else {
	  	$('#signup_message').hide();
	  }
	  
	 
		}
		else {
			$('#signin_message').hide();
			$('#signup_message').hide();
		}
   

});

restmeApp.service('listService', function() {	
	this.getNumber = function(num) {
    return new Array(num);   
	}
	this.onHover =function(index) {	
		var params = { i:index};
		var str = "http://www.google.com/mapfiles/marker.png?"+ jQuery.param( params );
		$('img[src="'+str+'"]').attr('src', "http://maps.google.com/mapfiles/marker_black.png?i="+index);
		return true;
	}
	this.onLeave =function(index) {		
		var params = { i:index};
		var str = "http://maps.google.com/mapfiles/marker_black.png?"+ jQuery.param( params );
		$('img[src="'+str+'"]').attr('src', 'http://www.google.com/mapfiles/marker.png?i='+index);
		return false;
	}
});


restmeApp.service('MapService', function($rootScope) {
	this.markerClick = function(event,index, $rootScope,marker) {
		var content = '<div class="info-window">'+
		'<div class="info">'+
		'<div class="info-title">'+$rootScope.businesses[index].name+'</div>'+
		'<div class="info-neighborhood">'+$rootScope.businesses[index].neighborhood+'</div>'+
		'<div class="info-address">'+$rootScope.businesses[index].address+' '+$rootScope.businesses[index].city+", " +$rootScope.businesses[index].state +'</div>'+
		'<div class="info-phone">'+$rootScope.businesses[index].display_phone+'</div>'+	
		'</div>'+
		'<img  src="'+$rootScope.businesses[index].image_url+'" alt="" />'+
		'</div>';

		var infowindow = new google.maps.InfoWindow({
    	content: content
  	});
		infowindow.open($rootScope.map, marker);
	}
	this.markerhover = function(event,index) {
		var params = { i:index};
		var str = "http://www.google.com/mapfiles/marker.png?"+ jQuery.param( params );
		$('img[src="'+str+'"]').attr('src', "http://maps.google.com/mapfiles/marker_black.png?i="+index);
		$('#item-'+index).attr('class','item ng-scope hover');
	}
	this.markerleave = function(event,index) {
		var params = { i:index};
		var str = "http://maps.google.com/mapfiles/marker_black.png?"+ jQuery.param( params );
		$('img[src="'+str+'"]').attr('src', 'http://www.google.com/mapfiles/marker.png?i='+index);
		$('#item-'+index).attr('class','item ng-scope');
	} 
});

restmeApp.service('urlSave', function($http) {
	this.send_url = function($scope) {
	
		$http.get('/modalUrl', {params: {url: $scope.url }});
	}
});


restmeApp.service('PreloadedData', function($http) {
	this.get_user = function($scope) {
		$http.get('/get_user').success(function(response) {
			$scope.display_profile = response.display_profile;
	  	$scope.user_name = response.user_name; 
	  	$scope.user_image = response.user_image;
	  	$scope.message_sighup = response.message_sighup;
	  	$scope.message_login = response.message_login;

		}); 
	}
});
