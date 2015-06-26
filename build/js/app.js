// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('OnGolf-Web', [ 
  'ui.router', 
  'ngSanitize', 
  'ngResource', 
  'ngAnimate', 
  'ui.bootstrap', 
  'firebase',
  'naif.base64',
  'ngTable',
  'ngTableExport',
  'chart.js',
  'angularSpinner',
  'angularMoment',
  'OnGolf-Web.controllers', 
  'SA4.CRM'])

.constant("CRMConfig", "OnGolf-Web.json")

.config(function($stateProvider, $urlRouterProvider, CRMConfig) {
   

   $stateProvider
    .state('login', {
      url: "/login",
      templateUrl: "templates/login.html",
       controller: 'LoginCtrl'
    })

   $stateProvider
    .state('forgot', {
      url: "/forgottenPassword",
      templateUrl: "templates/forgot.html",
       controller: 'LoginCtrl'
    })

 $stateProvider
    .state('app', {
      url: "",
      abstract: true,
      templateUrl: "templates/home.html",
      controller: 'AppCtrl',
      resolve: {
        CRMData: function(CRM, $firebaseObject) {
          var currentCRM = CRM.getConfig(); 
          var ref = new Firebase(currentCRM.CRMConfig); 
          return $firebaseObject(ref).$loaded(); 

        },
        CRM: 'CRM',
          currentCRM: function(CRM,CRMData){
            CRM.overrideCRMData(CRMData);
            return CRM.getCRM(CRMData.config.CRM);
        }
      }
    })

  $stateProvider
    .state('app.apps', {
      url: "/apps",
      templateUrl: "templates/apps.html",
      controller: 'AppCtrl'
    })

  $stateProvider
    .state('app.appDetail', {
      url: "apps/details/:appId",
      templateUrl: "templates/appDetail.html",
      controller: 'AppDetailCtrl'
    })

  $stateProvider
    .state('app.dashboard', {
      url: "/dashboard",
      templateUrl: "templates/dashboard.html",
      controller: 'DashboardCtrl'
    })

    $stateProvider
    .state('app.activity', {
      url: "/activity",
      templateUrl: "templates/activity.html",
      controller: 'ActivityCtrl'
    })

  $stateProvider
    .state('app.contacts', {
      url: "/contacts",
      templateUrl: "templates/contacts.html",
      controller: 'ContactsCtrl'
    })

  $stateProvider
    .state('app.contact-detail', {
      url: "/contacts/:contactId",
      templateUrl: "templates/contact-detail.html",
      controller: 'ContactDetailCtrl'
    })

  $stateProvider
    .state('app.courses', {
      url: "/courses",
      templateUrl: "templates/courses.html",
      controller: 'CoursesCtrl'
    })

    $stateProvider
    .state('app.opps', {
      url: "/opps",
      templateUrl: "templates/opps.html",
      controller: 'OppsCtrl'
    })

   $stateProvider
    .state('app.campaigns', {
      url: "/camapaigns",
      templateUrl: "templates/campaigns.html",
      controller: 'CampaignsCtrl'
    })


   $stateProvider
    .state('app.campaign-detail', {
      url: "/campaigns/:campaignId",
      templateUrl: "templates/campaign-detail.html",
      controller: 'CampaignDetailCtrl'
    })

  $stateProvider
    .state('app.settings', {
      url: "/settings",
      templateUrl: "templates/settings.html",
      controller: 'SettingsCtrl'
    })

  $urlRouterProvider.otherwise("/login");
  //
    
});