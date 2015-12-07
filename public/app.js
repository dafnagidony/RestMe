// MODULE
window.restmeApp = angular.module('restmeApp', ['ngRoute', 'ngResource','ngMap','ui.bootstrap']);

// ROUTES
restmeApp.config(function ($routeProvider,$locationProvider) {
   
  $routeProvider
    
  .when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  })   
  .when('/search', {
  	templateUrl: 'views/search.html',
    controller: 'SearchCtrl'
  }) 
  .when('/users/:guru_name', {
  	templateUrl: 'views/guru.html',
  	controller: 'GurusCtrl'
  })
});




