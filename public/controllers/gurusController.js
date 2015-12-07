restmeApp.controller('GurusCtrl', ['$scope','$uibModal','$routeParams','$http','PreloadedData', '$resource', 'MapService', 'listService','NgMap','urlSave','signModals', function($scope,$uibModal,$routeParams, $http, PreloadedData, $resource, MapService, listService, NgMap,urlSave,signModals) {
	var marker, map;
	$scope.func ={};
	$scope.guru_name = $routeParams.guru_name;
	PreloadedData.get_user($scope);
	$scope.url = window.location.href.split('?')[0];
	$scope.func ={};
	$scope.markerClick = function(event,index) {
		return MapService.markerClick(event,index,$scope, this);
	}
	$scope.markerhover = function(event,index) {
		return MapService.markerhover(event,index);
	}
	$scope.markerleave = function(event,index) {
		return MapService.markerleave(event,index);
	}
	$scope.getNumber = function(num) {
    return listService.getNumber(num);   
	}
	$scope.func.onHover =function(index) {	
		return listService.onHover(index);  
	}
	$scope.func.onLeave =function(index) {		
		return listService.onLeave(index); 
	}
 $scope.send_url = function() {
		return urlSave.send_url($scope);
	}
 NgMap.getMap().then(function(map) {
     map.setZoom(13);    
		map.setCenter(new google.maps.LatLng(40.746737, -73.984662));
  });
	
	$http.get('/users/'+$scope.guru_name+'/yelp').success(function(response) {
		$scope.user = response;	
		$scope.positions = [];
		$scope.businesses = [];
		$scope.markers = [];
		$scope.total = response.yelp_arr.length;
		$scope.display_from = 1;
		$scope.display_to = response.yelp_arr.length;
		var user_review;
		for (var i=0; i< response.yelp_arr.length; i++) {			
			for(var j=0; j< response.ref.length;j++) {
				if (response.ref[j].name == response.yelp_arr[i].businesses[0].name) {
					user_review = response.ref[j].review;
				}
			}
			var business = {
				name: response.yelp_arr[i].businesses[0].name,
				categories:"",
				image_url: response.yelp_arr[i].businesses[0].image_url,
				review_count: response.yelp_arr[i].businesses[0].review_count,
				user_review: user_review,
				city: response.yelp_arr[i].businesses[0].location.city,
				address: response.yelp_arr[i].businesses[0].location.address[0],
				state: response.yelp_arr[i].businesses[0].location.state_code,
				display_phone: response.yelp_arr[i].businesses[0].display_phone,
				neighborhood: response.yelp_arr[i].businesses[0].location.neighborhoods[0], 
				id:i,
				yelp_rating_full: new Array(Math.floor(response.yelp_arr[i].businesses[0].rating)),
				yelp_rating_part: (response.yelp_arr[i].businesses[0].rating - Math.floor(response.yelp_arr[i].businesses[0].rating)>0) ? new Array(1) : [] 
			};
			var pos = {
    		lat: response.yelp_arr[i].region.center.latitude,
    		lng: response.yelp_arr[i].region.center.longitude,
    		id: i,
    		animation: google.maps.Animation.DROP
  			};
  		for (j=0; j< response.yelp_arr[i].businesses[0].categories.length;j++) {
  			business.categories += ", " + response.yelp_arr[i].businesses[0].categories[j][0];
  		}
  		business.categories = business.categories.substr(2,business.categories.length - 2);
  		$scope.positions.push(pos);
  		$scope.businesses.push(business);

		}
		 $scope.func.modalOpen = function (selectedBusinessId) {
    	var modalInstance = $uibModal.open({
      	templateUrl: '../views/reviews_modal.html',
      	controller: function ($scope, $uibModalInstance,user,businesses) {	
      		$scope.user = user;
      		$scope.business = businesses[selectedBusinessId];
      		$scope.max_businesses_id = businesses.length-1;
      		$scope.cancel = function () {
    				$uibModalInstance.dismiss('cancel');
  				};
  				$scope.next = function () {
  					if (selectedBusinessId < (businesses.length-1)) {
  						selectedBusinessId += 1;
    				$scope.business = businesses[selectedBusinessId];
  					}
  				};
  				$scope.prev = function () {
  					if (selectedBusinessId > 0) {
  						selectedBusinessId -= 1;
    					$scope.business = businesses[selectedBusinessId];
  					}
  				};
      	},
      	size: 'lg',
      	resolve: {
      		user: function () {
        		return $scope.user;
    			},
    			businesses: function () {	
        		return $scope.businesses;
    			}
      	}
  		});
  	}
	});
	
}]);
