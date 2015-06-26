angular.module('OnGolf-Web.controllers', [])

.controller('NavCtrl', function($scope, $rootScope, $state, $firebaseAuth) {
    //database connection
    var ref = new Firebase("https://ongolf.firebaseio.com");
    $scope.authObj = $firebaseAuth(ref);

    $scope.logout=function()
    {
      $scope.authObj.$unauth();
      $state.go('login');//switch to home tab
    }
})

.controller('LoginCtrl', function($scope, $state, $rootScope, $firebaseAuth, usSpinnerService, CRM) {


  $scope.data = {}; 
  $scope.data.useDemoData = false; 
  $scope.loginData = CRM.getConfig(); //load login info  

  $scope.loginData = CRM.getConfig(); 
 
  // Login & go to initial state - NEED TO REPLACE WITH REAL LOGIN
 $scope.doLogin = function() {
    //Get UserInfo from CRM
usSpinnerService.spin('spinner-2');

    CRM.setConfig($scope.loginData);  //update based on any changes 
    //determine which config to load prod or demo
    $scope.loginData.CRMConfig = "https://sa4-apps-config.firebaseio.com/OnGolf-" + ($scope.data.useDemoData ? "Demo" : "Prod"); 
    CRM.setConfig($scope.loginData);  //update with changes 


    CRM.setCurrentCRM($scope.loginData.CRMConfig)
    .then(function(currentCRM){

      $scope.loginData = CRM.getConfig(); //get any changes to config 

      currentCRM.getItem(currentCRM.entities.userInfo,$scope.loginData.userName)
      .then(function(results){
        //update login data and save back to config 
        $scope.loginData.fullName = results.UserInfo.UserName; 
        $scope.loginData.email = results.UserInfo.Email; 
        $scope.loginData.phone = results.UserInfo.Mobile; 
        currentCRM.setConfig($scope.loginData);
        $rootScope.$broadcast('authorized');  

        usSpinnerService.stop('spinner-2');
       
        $state.go('app.dashboard');
      },
      function(error){
         alert("Login failed - " + error.statusText); 
      })
    })
  };
})

.controller('AppCtrl', function($scope, currentCRM){
  $scope.data = {};
  
  $scope.data.configData = currentCRM.getConfig(); 

})


.controller('DashboardCtrl', function($scope, usSpinnerService, currentCRM) {

  $scope.data = {}; 
  $scope.data.AccountCounts = {}; 
  $scope.data.ContactCounts = {}; 


  $scope.doRefresh = function() {
    usSpinnerService.spin('spinner-2');
    currentCRM.getList(currentCRM.entities.AccountStatusSummary)
    .then(function(results){
      $scope.data.AccountStatus = results;
    })
    currentCRM.getList(currentCRM.entities.ContactStatusSummary)
    .then(function(results){
      $scope.data.ContactStatus = results; 
      $scope.data.ContactCounts.Targets = _.result(_.find(results,'Status','Target'),'StatusCount'); 
      $scope.data.ContactCounts.Qualified = _.result(_.find(results,'Status','Qualify'),'StatusCount'); 
      $scope.data.ContactCounts.Prospects = _.result(_.find(results,'Status','Prospect'),'StatusCount'); 

    })
    currentCRM.getList(currentCRM.entities.OpportunityStageSummary)
    .then(function(results){
      $scope.data.OpportunityStage = results; 
      $scope.data.Pipeline = {}; 
      $scope.data.Pipeline.series = ['Pipeline'];
      $scope.data.Pipeline.labels = _.pluck(results,'Stage'); 
      $scope.data.Pipeline.values = []; 
      $scope.data.Pipeline.values[0]  = _.pluck(results,'StageCount');
      $scope.data.Pipeline.TotalCount = _.sum($scope.data.Pipeline.values[0]);
    })
    currentCRM.getList(currentCRM.entities.HistoryTypeSummary)
    .then(function(results){
      $scope.data.HistoryType = results; 
      $scope.data.History = {}; 
      $scope.data.History.series = ['Completed Activities'];
      $scope.data.History.labels = _.pluck(results,'Activity');   
      $scope.data.History.values = []; 
      $scope.data.History.values[0] =  _.pluck(results,'ActivityCount');
    })
    currentCRM.getList(currentCRM.entities.AccountSubTypeSummary)
    .then(function(results){
      $scope.data.AccountSubType = results; 
      $scope.data.CourseType = {}; 
      $scope.data.CourseType.series = ['CourseType'];
      $scope.data.CourseType.labels = _.pluck(results,'Subtype');   
      $scope.data.CourseType.values =  _.pluck(results,'Subtypecount');
    })
    currentCRM.getList(currentCRM.entities.OpportunityStatusSummary)
    .then(function(results){
      $scope.data.OpportunityStatus = results; 
      $scope.data.OppStatus = {}; 
      $scope.data.OppStatus.series = ['OppStatus'];
      $scope.data.OppStatus.labels = _.pluck(results,'Status');   
      $scope.data.OppStatus.values =  _.pluck(results,'Statuscount');
      $scope.data.CustomerCount = _.result(_.find(results,'Status','Closed - Won'),'Statuscount');
    })
     currentCRM.getList(currentCRM.entities.CampaignSummary)
    .then(function(results){
      $scope.data.CampaignSummary = results; 
      $scope.data.TotalResponses = _.sum(_.pluck(results,'Responses'));
    })
    .finally(function(){
      //Stop the refresher from spinning
      usSpinnerService.stop('spinner-2');
    })
  };

  
  $scope.pieOptions = {     
    onAnimationComplete: function()
    {
      this.showTooltip(this.segments, true);
    },
    tooltipEvents: [],
    showTooltips: true
  };


  $scope.doRefresh(); 


  // $scope.d4labels = ["To-Do's", "Follow Ups", "Demo"];
  // $scope.d4data = [40, 80, 120];
  // $scope.d4series = ['Acitivity'];

})

// Activity Controller
.controller('ActivityCtrl', function($scope, $filter, $q, $modal, $log, $timeout, usSpinnerService, ngTableParams, currentCRM) {
  $scope.data = {}; 

  $scope.doRefresh = function() {
    usSpinnerService.spin('spinner-2');
    currentCRM.getList(currentCRM.entities.history)
    .then(function(results){
      $scope.data.history = results; 
       //add date selector to each history item

       angular.forEach($scope.data.history, function(item) {
        item.dateSelect = moment(item.CompletedDate).startOf('Day').toISOString();  
      })  


      $scope.data.newHistory = _.chain($scope.data.history)
      .groupBy('dateSelect')
      .pairs()
      .sortBy(function(currentItem){
        return currentItem[0];
      })
      .value()
      .reverse(); 

    })
    .finally(function(){
      //Stop the refresher from spinning
      usSpinnerService.stop('spinner-2');
    })
  };

  $scope.doRefresh(); 

})

// Contacts Controller

.controller('ContactsCtrl', function($scope, $filter, $q, $modal, $log, $timeout, usSpinnerService, ngTableParams, currentCRM) {

  $scope.data = {};
  $scope.data.contacts = [];
  $scope.alerts = [];

  $scope.doRefresh = function() {
    usSpinnerService.spin('spinner-2');
    currentCRM.getList(currentCRM.entities.contacts)
    .then(function(results){
      $scope.data.contacts = results; 
      $scope.tableParams.reload(); 
    })

    //Get PickLists for Style 
    currentCRM.getList(currentCRM.entities.pickListItems,'Contact OnGolf Style')
    .then(function(results){
      $scope.data.picklistStyle = results; 
    })
     //Get PickLists for Profile 
    currentCRM.getList(currentCRM.entities.pickListItems,'Contact OnGolf Profile')
    .then(function(results){
      $scope.data.picklistProfile = results; 
    })
     //Get PickLists for Innovator 
    currentCRM.getList(currentCRM.entities.pickListItems,'Contact OnGolf Innovator')
    .then(function(results){
      $scope.data.picklistInnovator = results; 
    })
     currentCRM.getList(currentCRM.entities.accountManager)
    .then(function(results){
      $scope.data.picklistAccountManager = results; 
    })
    .finally(function(){
      //Stop the refresher from spinning
      usSpinnerService.stop('spinner-2');
    })
  };

  $scope.enableInlineEdit = function(contact){ 
    //Grab AccountManger so it can be changed via drop down 
    $scope.data.AccountManager = contact.AccountManager; 
    contact.$edit = true; 
  }; 


  $scope.saveContact = function(contact){ 
    //update AccountManager in case it changed 
    contact.AccountManager = $scope.data.AccountManager; 
    currentCRM.updateItem(currentCRM.entities.contact,contact.$key, contact)
    .then(function(results){
      $scope.data.savedContact = results;
      //Put back new Account Manager 
      contact.AccountManager.UserInfo = {}; 
      contact.AccountManager.UserInfo.NameLF = $scope.data.AccountManager.NameLF;    //This is a workaround
      $scope.data.AccountManager = {}; 
    });
    contact.$edit = false; 
  }



  //Refresh on first entry
  $scope.doRefresh();

  $scope.getTableLength = function(){
    return $scope.data.contacts.length; 
  };

  $scope.addAlert = function() {
    $scope.alerts.push({msg: 'Another alert!'});
  };


$scope.delegateToggle = 0;
$scope.searchtoggle = 0;

$scope.newValue = function(value) {
  console.log(value);
    if (value == 1) {
      $scope.tableParams.sorting({"owner":"asc"});
    }
    else {
      $scope.tableParams.sorting({});
    }
}


$scope.radio = {model :  undefined};


$scope.assignContacts = function(user,items) {
  $scope.delegatedUser = user;
  $scope.delegatedItems = items;

  console.log($scope.delegatedUser);
  console.log($scope.delegatedItems);

  $scope.checkboxes.items = {};

  $scope.alerts.push({

    msg: 'Contacts Successfully Assigned to ' + $scope.delegatedUser + '!',
    type: 'success'
  });

  $timeout( function() {
      $scope.alerts = [];
    
    }, 5000);

  $scope.radio = {model :  undefined};

}

 $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

   $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10,          // count per page
        sorting: {
            name: 'asc'     // initial sorting
        }
    }, 
    {
      total: 0, // length of data
      getData: function($defer, params) {
        params.total($scope.data.contacts.length);
        var filteredData = $scope.data.contacts;
        var orderedData = params.sorting() ?
            $filter('orderBy')(filteredData, params.orderBy()) : filteredData;

          $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
    });


    var inArray = Array.prototype.indexOf ?
            function (val, arr) {
                return arr.indexOf(val)
            } :
            function (val, arr) {
                var i = arr.length;
                while (i--) {
                    if (arr[i] === val) return i;
                }
                return -1
            };
    $scope.names = function(column) {
        var def = $q.defer(),
            arr = [],
            names = [];
        angular.forEach(data, function(item){
            if (inArray(item.name, arr) === -1) {
                arr.push(item.name);
                names.push({
                    'id': item.name,
                    'title': item.name
                });
            }
        });
        def.resolve(names);
        return def;
    };

    $scope.checkboxes = { 'checked': false, items: {} };

    // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function(value) {
        angular.forEach($scope.users, function(item) {
            if (angular.isDefined(item.id)) {
                $scope.checkboxes.items[item.id] = value;
            }
        });
    });

    // watch for data checkboxes
    $scope.$watch('checkboxes.items', function(values) {
        if (!$scope.users) {
            return;
        }
        var checked = 0, unchecked = 0,
            total = $scope.users.length;
        angular.forEach($scope.users, function(item) {
            checked   +=  ($scope.checkboxes.items[item.id]) || 0;
            unchecked += (!$scope.checkboxes.items[item.id]) || 0;
        });
        if ((unchecked == 0) || (checked == 0)) {
            $scope.checkboxes.checked = (checked == total);
        }
        // grayed checkbox
        angular.element(document.getElementById("select_all")).prop("indeterminate", (checked != 0 && unchecked != 0));
    }, true);


// New contact modal
  $scope.open = function () {


    var modalInstance = $modal.open({
      templateUrl: 'templates/new-contact.html',
      controller: 'ModalInstanceCtrl',
      size: 'lg'
    });

    modalInstance.result.then(function () {
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };


})

// .controller('ContactDetailCtrl', function($scope, $stateParams, $modalInstance, contact) {

//   $scope.contact = contact;

//    $scope.ok = function () {
//     $modalInstance.close();
//   };

//   $scope.cancel = function () {
//     $modalInstance.dismiss('cancel');
//   };

// })


.controller('CoursesCtrl', function($scope, $filter, $q, $modal, $log, $timeout, usSpinnerService, ngTableParams, currentCRM) {

  $scope.data = {};
  $scope.data.courses = [];
  $scope.alerts = [];

  $scope.doRefresh = function() {
    usSpinnerService.spin('spinner-2');
    currentCRM.getList(currentCRM.entities.courses)
    .then(function(results){
      $scope.data.courses = results;
      $scope.tableParams.reload(); 
    })
    .finally(function(){
      //Stop the refresher from spinning
      usSpinnerService.stop('spinner-2');
    })
  };

  //Filter used to filter arrays by Type 
$scope.firstMatch = function (items, field, value, returnField) {
  returnItem = null;
  for(var i = 0; len = items.length; i < len, i++) {
    if(items[i][field] == value) {
      returnItem = items[i][returnField]; 
      break; 
    }
  }
  return returnItem; 
};

var numbers = [0, 1, 2, 3, 4, 5];

for (var i = 0, len = numbers.length; i < len; i++) {
  if (numbers[i] === 1) {
    console.log('Loop is going to break.'); 
    break;
  }
  console.log('Loop will continue.');
}


  //Refresh on first entry
  $scope.doRefresh();

   $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10,          // count per page
        sorting: {
            name: 'asc'     // initial sorting
        }
    }, 
    {
      total: 0, // length of data
      getData: function($defer, params) {
        params.total($scope.data.courses.length);
        var filteredData = $scope.data.courses;
        var orderedData = params.sorting() ?
            $filter('orderBy')(filteredData, params.orderBy()) : filteredData;

          $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
    });

   // New contact modal
  $scope.open = function () {


    var modalInstance = $modal.open({
      templateUrl: 'templates/new-course.html',
      controller: 'CourseModalInstanceCtrl',
      size: 'lg'
    });

    modalInstance.result.then(function () {
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };
})

.controller('OppsCtrl', function($scope, $filter, $q, $modal, $log, $timeout, usSpinnerService, ngTableParams, currentCRM) {

  $scope.data = {};
  $scope.data.opps = [];
  $scope.alerts = [];

  $scope.doRefresh = function() {
    usSpinnerService.spin('spinner-2');
    currentCRM.getList(currentCRM.entities.opps)
    .then(function(results){
      $scope.data.opps = results;
      $scope.tableParams.reload(); 
    })
    .finally(function(){
      //Stop the refresher from spinning
      usSpinnerService.stop('spinner-2');
    })
  };

  //Filter used to filter arrays by Type 
$scope.firstMatch = function (items, field, value, returnField) {
  returnItem = null;
  for(var i = 0; len = items.length; i < len, i++) {
    if(items[i][field] == value) {
      returnItem = items[i][returnField]; 
      break; 
    }
  }
  return returnItem; 
};

var numbers = [0, 1, 2, 3, 4, 5];

for (var i = 0, len = numbers.length; i < len; i++) {
  if (numbers[i] === 1) {
    console.log('Loop is going to break.'); 
    break;
  }
  console.log('Loop will continue.');
}


  //Refresh on first entry
  $scope.doRefresh();

   $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10,          // count per page
        sorting: {
            name: 'asc'     // initial sorting
        }
    }, 
    {
      total: 0, // length of data
      getData: function($defer, params) {
        params.total($scope.data.opps.length);
        var filteredData = $scope.data.opps;
        var orderedData = params.sorting() ?
            $filter('orderBy')(filteredData, params.orderBy()) : filteredData;

          $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
    });

   // New contact modal
  $scope.open = function () {


    var modalInstance = $modal.open({
      templateUrl: 'templates/new-opp.html',
      controller: 'OppModalInstanceCtrl',
      size: 'lg'
    });

    modalInstance.result.then(function () {
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };









})

.controller('CampaignsCtrl', function($scope, $filter, $q, $modal, $log, $timeout, usSpinnerService, ngTableParams, currentCRM) {
  $scope.data = {};
  $scope.data.campaigns = [];
  $scope.alerts = [];

  $scope.doRefresh = function() {
    usSpinnerService.spin('spinner-2');
    currentCRM.getList(currentCRM.entities.campaignSummaries)
    .then(function(results){
      $scope.data.campaignSummaries = results;

      //Get results from MailChimp for each linked campaign 
      angular.forEach($scope.data.campaignSummaries, function(campaignSummary) {
       //Need to refactor this format to avoid having to pass mashups back in to get config 
       if(campaignSummary.Campaign.CampaignCode) {
        currentCRM.getMashup(currentCRM.mashups.config, currentCRM.mashups.campaignSummary, campaignSummary.Campaign.CampaignCode)
          .then(function(results){
            campaignSummary.Responses = results.data.report_summary.opens || 0;
            campaignSummary.Clicks = results.data.report_summary.subscriber_clicks || 0; 
            //Need to add unsubscribes 
          })
       }
      })



    })
    .finally(function(){
      //Stop the refresher from spinning
      usSpinnerService.stop('spinner-2');
    })
  };



  $scope.doRefresh(); 
})

.controller('CampaignDetailCtrl', function($scope, $filter, $q, $modal, $log, $timeout, usSpinnerService, ngTableParams, currentCRM) {
})

.controller('SettingsCtrl', function($scope) {

  
})


// Modal Controllers

.controller('ModalInstanceCtrl', function($scope, $modalInstance) {


  $scope.ok = function () {

    //CREATE USER HERE

    $modalInstance.close($scope.user);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})

.controller('CourseModalInstanceCtrl', function ($scope, $modalInstance) {

  $scope.ok = function () {

    //CREATE USER HERE

    $modalInstance.close($scope.user);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})


.controller('OppModalInstanceCtrl', function ($scope, $modalInstance) {

  $scope.ok = function () {

    //CREATE USER HERE

    $modalInstance.close($scope.user);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})


