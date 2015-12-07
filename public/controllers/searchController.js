restmeApp.controller('SearchCtrl', ['$scope','$http','$uibModal','$routeParams', '$resource', 'MapService', 'listService','searchDetailsService','NgMap','urlSave','PreloadedData','signModals', function($scope,$http,$uibModal,$routeParams, $resource, MapService, listService,searchDetailsService, NgMap, urlSave,PreloadedData,signModals) {
	var marker;
	//.split(",").slice(0,3).join(",")
	$scope.find = searchDetailsService.find || $routeParams.find;  
	$scope.address= searchDetailsService.address || $routeParams.address;
	PreloadedData.get_user($scope);
	$scope.func ={};
	$scope.maxSize = 5; 
  
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
		$scope.url = window.location.href.split('?')[0]+"?find="+$scope.find+"&address="+$scope.address+"&pageNum="+$scope.currentPage;
		return urlSave.send_url($scope);
	}
	NgMap.getMap().then(function(map) {
		$scope.currentPage = $routeParams.pageNum || 1 ;
		$scope.url = window.location.href.split('?')[0]+"?find="+$scope.find+"&address="+$scope.address+"&pageNum="+$scope.currentPage;
    get_yelp_data($scope.currentPage,map);
  });
	

  function get_yelp_data(page_num,map) {
		$http.get('/yelp_search',{params: {page_num: page_num, find: $scope.find, address: $scope.address}}).success(function(response) {
			var latitude = response.region.center.latitude;
			var longitude = response.region.center.longitude;
			var latLngList = [];
			if (response.businesses.length == 0) {
				$scope.display_from = response.total;
				$scope.display_to = response.total;
			}
			else {
				$scope.display_from = ($scope.currentPage -1)*5 + 1;
				$scope.display_to = $scope.display_from + response.businesses.length -1;
			}
			$scope.positions = [];
			$scope.businesses = [];
			$scope.total = response.total;
			$scope.totalItems = $scope.total;
			if ($scope.total == 0) {
				$scope.error_msg = "Sorry, no Yelp results";
			}

			map.setCenter(new google.maps.LatLng(latitude, longitude));
			for (var i=0; i< response.businesses.length; i++) {	
				var business_name = response.businesses[i].name;
					if(business_name.length > 25) {
    				business_name = business_name.substring(0,25)+"...";
					}
				var neighborhood = response.businesses[i].location.neighborhoods;
				if (neighborhood == undefined) {
					neighborhood = "";
				}
				else {
					neighborhood = neighborhood[0];
				}
					var business = {
						name: business_name,
						categories:"",
						image_url: response.businesses[i].image_url,
						review_count: response.businesses[i].review_count,
						city: response.businesses[i].location.city,
						address: response.businesses[i].location.address[0],
						state: response.businesses[i].location.state_code,
						display_phone: response.businesses[i].display_phone,
						neighborhood: neighborhood, 
						id: response.businesses[i].id,
						url: response.businesses[i].url,
						yelp_rating_full: new Array(Math.floor(response.businesses[i].rating)),
						yelp_rating_part: (response.businesses[i].rating - Math.floor(response.businesses[i].rating)>0) ? new Array(1) : [] 
					}		
					var pos = {
	    			lat: response.businesses[i].location.coordinate.latitude,
	    			lng: response.businesses[i].location.coordinate.longitude,
	    			id: i,
	    			animation: google.maps.Animation.DROP
	  			};
	  			for (j=0; j< response.businesses[i].categories.length;j++) {
	  				business.categories += ", " + response.businesses[i].categories[j][0];
	  			}
	  			business.categories = business.categories.substr(2,business.categories.length - 2);
	  			$scope.positions.push(pos);
	  			$scope.businesses.push(business);
	  			latLngList.push(new google.maps.LatLng (pos.lat,pos.lng));
			}	
			var bounds = new google.maps.LatLngBounds ();
			for (var i = 0; i < latLngList.length; i++) {
  			bounds.extend (latLngList[i]);
			}
			map.fitBounds (bounds);
		}); 
	}
	$scope.func.next = function() {
		NgMap.getMap().then(function(map) {
			$scope.url = window.location.href.split('?')[0]+"?find="+$scope.find+"&address="+$scope.address+"&pageNum="+$scope.currentPage;
    	get_yelp_data($scope.currentPage,map);
  	});	
  }
   $scope.setPage = function (pageNo) {
    $scope.currentPage = pageNo;

  };

  $scope.pageChanged = function() {
    $log.log('Page changed to: ' + $scope.currentPage);
  };
 

  $scope.func.like = function(business) {
  	$http.post('/save_business', {id: business.id, categories: business.categories, note: "this is great"});
  }

  $scope.func.modalOpen = function (selectedBusinessId) {
    	var modalInstance = $uibModal.open({
      	templateUrl: '../views/business_modal.html',
      	controller: function ($scope, $uibModalInstance,user,businesses) {	
      		$scope.user = user;
      		for (var business in businesses) {
      			if (businesses[business].id == selectedBusinessId) {
      				$scope.business = businesses[business];
      			}
      		}
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
      	size: 'sm',
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
  	
}]);