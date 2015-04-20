var app = angular.module("travelApp", ['ngRoute']);

app.controller("travelController",
		function ($scope, $http, $rootScope, $location) {

    /* ----------------- Login, Register, Logout, SignUp Module Starts here ------------------- */
		    
		    $scope.login = function (user) {
		        console.log(user);
		        $http.post("/login", user)
                .success(function (response) {
                    console.log(response);
                    $rootScope.currentUser = response;

                    if ($rootScope.currentUser) {
                        $http.get("/fetchfavplaces/" + $rootScope.currentUser._id)
                    .success(function (response) {
                        $rootScope.bookmarks = response[0].favplaces;
                    });
                        $http.get("/fetchweatherplaces/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $rootScope.weatherbookmarks = response[0].favweather;
                        });
                    }

                    $location.url("/profile");
                });
		    }

		    $scope.fetchRouteDetailFromProfile = function (a) {
		        //have to write this function
		    }

		    $scope.register = function (user) {
		        console.log(user);
		        if ((user.password != user.reenterpassword) ||
                    (user.firstname == undefined || user.lastname == undefined || user.email == undefined || user.password == undefined || user.username == undefined) ||
                    (user.firstname == "" || user.lastname == "" || user.email == "" || user.password == "" || user.username == "")) {
		            alert("Please fill the form correctly");
		        }
		        else {
		            $http.post("/register", user)
                .success(function (response) {
                    console.log(response);
                    $rootScope.currentUser = response;
                    $location.url("/profile");
                });
		        }
		    }

		    $scope.logout = function () {
		        $http.post("/logout")
                .success(function (response) {
                    $rootScope.currentUser = null;
                    $location.url("/views/home");
                });
		    }

		    /* ----------------- Route Find Module Starts here ------------------- */

		    var places = [];
		    var routes = [];
		    var actualResponse = [];
		    var detail = [];

		    $scope.searchRoutes = function () {

		        var oCity = angular.uppercase($scope.oCity);
		        var dCity = angular.uppercase($scope.dCity);

		        if (oCity == dCity) {
		            $scope.cantBeSame = 1;
		            $scope.oCity = "";
		            $scope.dCity = "";
		            alert("Source and Detination cannot be same.");
		        } else {
		            $http.get("http://free.rome2rio.com/api/1.2/json/Search?key=eU7G6lzt&oName=" + oCity + "&dName=" + dCity)
                    .success(function (response) {
                        $scope.places = response.places;
                        $scope.routes = response.routes;
                        $scope.actualResponse = response;
                        $scope.showCheck = 1;

                        /* Google Map Coordinates */

                        var mapOptions = {
                            zoom: 3,
                            center: new google.maps.LatLng($scope.places[0].pos.split(",")[0], $scope.places[0].pos.split(",")[1]),
                            mapTypeId: google.maps.MapTypeId.TERRAIN
                        };

                        var map = new google.maps.Map(document.getElementById('mapCanvas'), mapOptions);

                        var routeCord = [];

                        $.each($scope.places, function (i, val) {
                            var position = val.pos;
                            var pos = position.split(",");
                            routeCord.push(new google.maps.LatLng(pos[0], pos[1]));
                        });

                        var flightPath = new google.maps.Polyline({
                            path: routeCord,
                            geodesic: true,
                            strokeColor: '#FF0000',
                            strokeOpacity: 1.0,
                            strokeWeight: 2
                        });

                        flightPath.setMap(map);
                    })
		        }
		    }
            
		    $scope.bookmarkPlace = function () {
		        if ($scope.oCity == undefined || $scope.oCity == "") {
		            alert("enter Source City for details");
		        } else {
		            var data = {
		                favplaces: $scope.places[0].name + "," + $scope.places[1].name,
		                _id: $scope.currentUser._id
		            }
		            
		            $http.put("/favplaces", data)
		            .success(function (response) {
		                console.log(response);
		            })

		            $http.get("/fetchfavplaces/" + $scope.currentUser._id)
                        .success(function (response) {
                            $scope.bookmarks = response[0].favplaces;
                        });
		        }
		    }

		    $scope.deleteBookmark = function (bm) {

		        console.log(bm._id);
		        console.log($scope.currentUser._id);

		        var data = {
		            favplaces: bm._id,
		            _id: $scope.currentUser._id
		        }
		        console.log(data);

		        $http.delete("/deletebookmark/" + bm._id + "/" + $scope.currentUser._id)
                .success(function (response) {
                    console.log(response);
                });

		        $http.get("/fetchfavplaces/" + $scope.currentUser._id)
                        .success(function (response) {
                            $scope.bookmarks = response[0].favplaces;
                        });
		    }

		    $scope.fetchPlaceDetails = function (bm) {

		        var index = bm.bookmark.split(",");
		        console.log(index[0] + "----" + index[1]);
		        $scope.oCity = index[0];
		        $scope.dCity = index[1];

		        $http.get("http://free.rome2rio.com/api/1.2/json/Search?key=eU7G6lzt&oName=" + index[0] + "&dName=" + index[1])
                    .success(function (response) {
                        $scope.places = response.places;
                        $scope.routes = response.routes;
                        $scope.actualResponse = response;
                        $scope.showCheck = 1;

                        $http.get("/fetchfavplaces/" + $scope.currentUser._id)
                        .success(function (response) {
                            $scope.bookmarks = response[0].favplaces;
                        });

                        /* Google Map Coordinates */

                        var mapOptions = {
                            zoom: 3,
                            center: new google.maps.LatLng($scope.places[0].pos.split(",")[0], $scope.places[0].pos.split(",")[1]),
                            mapTypeId: google.maps.MapTypeId.TERRAIN
                        };

                        var map = new google.maps.Map(document.getElementById('mapCanvas'), mapOptions);

                        var routeCord = [];

                        $.each($scope.places, function (i, val) {
                            var position = val.pos;
                            var pos = position.split(",");
                            routeCord.push(new google.maps.LatLng(pos[0], pos[1]));
                        });

                        var flightPath = new google.maps.Polyline({
                            path: routeCord,
                            geodesic: true,
                            strokeColor: '#FF0000',
                            strokeOpacity: 1.0,
                            strokeWeight: 2
                        });

                        flightPath.setMap(map);
                    })
		    }

		    /* ------------------ Weather Module Starts here ----------------------- */

		    $scope.hourlyWeather = [];

		    $scope.fetchHourly = function (fW) {
		        var index = $scope.data.weather.indexOf(fW);
		        console.log(index);
		        $scope.hourlyWeather = $scope.data.weather[index].hourly;
		        $scope.showHourlyCheck = 1;
		    }

		    $scope.weathers = [];
		    $scope.futureWeather = [];
		    $scope.data = [];

		    $scope.searchWeather = function () {
		        var weatherCity = $scope.weatherCity;

		        $http.get("http://api.worldweatheronline.com/free/v2/weather.ashx?key=c3520deb638c23ce285718aeffaee&q=" + weatherCity + "&num_of_days=10&tp=3&format=json")
		        .success(function (response) {
		            console.log(response);
		            $scope.weathers = response.data.current_condition;
		            console.log("You have requested details for the " + response.data.request[0].query);
		            $scope.weatherCity = response.data.request[0].query;
		            $scope.searchCity = $scope.weatherCity;
		            console.log("Input field values changed to " + $scope.weatherCity);
		            $scope.futureWeather = response.data.weather;
		            $scope.data = response.data;
		            $scope.showWeatherCheck = 1;

		            $http.get("/fetchweatherplaces/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $scope.weatherbookmarks = response[0].favweather;
                        });		        
		        });
		    }

		    $scope.favWeather = function () {
		        if ($scope.weatherCity == undefined || $scope.weatherCity == "") {
		            alert("Enter City for details");
		        } else {
		            console.log($scope.weatherCity);

		           var weatherdata = {
		                favweather: $scope.weatherCity,
		                _id: $scope.currentUser._id
		            }
		            
		            $http.put("/weatherplaces", weatherdata)
		            .success(function (response) {
		                console.log(response);
		            })

		            $http.get("/fetchweatherplaces/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $scope.weatherbookmarks = response[0].favweather;
                        });
		        }
		    }


		    $scope.deleteWeatherBookmark = function (bm) {

		        console.log(bm._id);
		        console.log($scope.currentUser._id);

		        var data = {
		            favplaces: bm._id,
		            _id: $scope.currentUser._id
		        }
		        console.log(data);

		        $http.delete("/deleteweatherbookmark/" + bm._id + "/" + $scope.currentUser._id)
                .success(function (response) {
                    console.log(response);                    
                })
		        $http.get("/fetchweatherplaces/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $scope.weatherbookmarks = response[0].favweather;
                        });
		    }

		    $scope.fetchWeatherPlaceDetails = function (bm) {
		        $rootScope.weatherCity = bm.bookmark;
		        console.log($rootScope.weatherCity);

		        $http.get("http://api.worldweatheronline.com/free/v2/weather.ashx?key=c3520deb638c23ce285718aeffaee&q=" + $rootScope.weatherCity + "&num_of_days=10&tp=3&format=json")
		        .success(function (response) {
		            console.log(response);
		            $scope.weathers = response.data.current_condition;
		            
		            $rootScope.weatherCity = response.data.request[0].query;
		            $scope.searchCity = $rootScope.weatherCity;
		           
		            $scope.futureWeather = response.data.weather;
		            $scope.data = response.data;
		            $scope.showWeatherCheck = 1;

		            $http.get("/fetchweatherplaces/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $scope.weatherbookmarks = response[0].favweather;
                        });
		        });
		    }


		});

app.config(['$routeProvider',
            function ($routeProvider) {
                $routeProvider.
                when('/home', {
                    templateUrl: 'views/home/home.html'
                }).
                when('/contact', {
                    templateUrl: 'views/contact/contact.html'
                }).
                when('/route', {
                    templateUrl: 'services/route/route.html',
                    controller: 'travelController'
                }).
                when('/profile', {
                    templateUrl: 'views/profile/profile.html',
                    resolve: {
                        loggedin: checkLoggedIn
                    },
                    controller: 'travelController'
                }).
                when('/login', {
                    templateUrl: 'views/login/login.html',
                    controller: 'travelController'
                }).
                when('/register', {
                    templateUrl: 'views/register/register.html',
                    controller: 'travelController'
                }).
                when('/weather', {
                    templateUrl: 'services/weather/weather.html',
                    controller: 'travelController'
                }).
                otherwise({
                    redirectTo: 'home'
                });
            }]);


var checkLoggedIn = function ($q, $timeout, $http, $location, $rootScope) {
    var deferred = $q.defer();

    $http.get('/loggedin').success(function (user) {
        $rootScope.errorMessage = null;
        // User is Authenticated
        if (user !== '0') {
            $rootScope.currentUser = user;
            deferred.resolve();
        }
            // User is Not Authenticated
        else {
            $rootScope.errorMessage = 'You need to log in.';
            deferred.reject();
            $location.url('/login');
        }
    });

    return deferred.promise;
};
