angular.module('OnGolf-Web.services', [])

//Filter used to filter arrays by Type 
.filter('firstMatch', function () {
  return function (items, field, value, returnField) {
    angular.forEach(items, function(item) {
      if(item[field] == value) {
        return item[returnField]
      }
    });
    return null;
  };
})

.factory("Auth", ["$firebaseAuth", "$rootScope",
         function ($firebaseAuth, $rootScope) {
            var ref = new Firebase("https://ongolf.firebaseio.com/");
            return $firebaseAuth(ref);
        }])



.factory("Apps", function($firebaseArray) {
   
      // create a reference to the Firebase where we will store our data

      var ref = new Firebase("https://ongolf.firebaseio.com/apps");
      var apps = $firebaseArray(ref); 

      // return it as a synchronized array
      return {
        all: function () {
            return apps;
        }
      }
    })


