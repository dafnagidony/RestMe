// DIRECTIVES
restmeApp.directive("navBar", function() {
  return {
    restrict: 'E',
    templateUrl: 'directives/navBar.html',
    replace: true
  }
});

restmeApp.directive("businessesList", function() {
  return {
    restrict: 'E',
    templateUrl: 'directives/businesses_list.html',
    replace: true
   }
});

restmeApp.directive("signModals", function() {
  return {
    restrict: 'E',
    scope: false,
    templateUrl: 'directives/sign_modals.html',
    replace: true
   }
});
restmeApp.directive("mapDir", function() {
  return {
    restrict: 'E',
    templateUrl: 'directives/map_dir.html',
    replace: true
   }
});

restmeApp.directive('googleplace', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, model) { 
      var options = {
          types: [],
          componentRestrictions: {}
      };
      scope.gPlace = new google.maps.places.Autocomplete(element[0], options);
      google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
        scope.$apply(function() {
          model.$setViewValue(element.val());   
        });
      });
    }
  };
});

restmeApp.directive('scrolly', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
        	angular.element($window).on('scroll', scrollFunc);
          
          scope.$on('$destroy', function() {
    			 	angular.element($window).off('scroll', scrollFunc);   
					});
        }
    };
});


function scrollFunc() {
  if (this.pageYOffset >= 20) {
    angular.element('.nav_bar')[0].style.opacity = 1*((100-(this.pageYOffset-20))/100);
    angular.element('.title')[0].style.opacity = 0.9*((100-(this.pageYOffset-20))/100);
    angular.element('.search_form')[0].style.opacity = 1*((100-(this.pageYOffset-20))/100);
    $(".arrow_icon" ).hide();
		if ($(".circle-users").offset().top > 420) {       
			$(".circle-users").css('top', $(".circle-users").offset().top -(this.pageYOffset-30));
		}
  }
  else {
    angular.element('.nav_bar')[0].style.opacity = 1;
    angular.element('.title')[0].style.opacity = 0.9;
    angular.element('.search_form')[0].style.opacity = 1;
   	$(".arrow_icon" ).show();
   	$(".circle-users").css('top', 650);
	}		
}

