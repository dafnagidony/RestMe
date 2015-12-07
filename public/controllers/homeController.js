restmeApp.controller('HomeCtrl', ['$scope' ,'$window', '$http','PreloadedData','searchDetailsService','urlSave','signModals', function($scope, $window, $http, PreloadedData, searchDetailsService,urlSave, signModals) {
	$http.get('/userslist').success(function(response) {
		$scope.users = response;	
	}); 
	PreloadedData.get_user($scope);
	$scope.url = window.location.href.split('?')[0];

	$scope.find = searchDetailsService.find;
	$scope.$watch('find', function() {
       searchDetailsService.find = $scope.find; 
  });
	$scope.$watch('address', function() {
       searchDetailsService.address = $scope.address; 
    });
	
	$scope.send_url = function() {
		return urlSave.send_url($scope);
	}

}]);