var app = angular.module("travelApp", ['ngRoute']);

app.controller("travelController",
		function ($scope, $http, $rootScope, $location) {

		    $http.get("/getallcomments")
                        .success(function (response) {
                            $rootScope.allcomments = response;
                            $rootScope.showcomments = 1;
                        })

		    // LOGIN, REGISTER, PROFILE

		    $scope.login = function (user) {
		        $http.post("/login", user)
                    .success(function (response) {
                        console.log(response);
                        $rootScope.currentUser = response;
                        $rootScope.wronglogindetails = null;

                        $http.get("/fetchalluserinfo/" + $rootScope.currentUser._id)
                          .success(function (response) {
                              $rootScope.bookmarks = response.favplaces;
                              $rootScope.weatherbookmarks = response.favweather;

                              //LikeUserDetailToBeDisplayed
                              $rootScope.likedUserToBeDisplayed = [];
                              for (var i = 0; i < $rootScope.currentUser.favuser.length; i++) {
                                  $http.get("/fetchalluserinfo/" + $rootScope.currentUser.favuser[i])
                                      .success(function (response) {
                                          $rootScope.likedUserToBeDisplayed.push(response);
                                      });
                              }

                          });

                        $location.url("/profile");
                    })
		        .error(function (response) {
		            //console.log("Error");
		            $rootScope.wronglogindetails = 1;
		        });
		    }

		    $scope.register = function (user) {
		        $scope.duplicateusername = null;
		        $rootScope.wrongregistercredentials = null;
		        if ((user.password != user.reenterpassword) ||
                    (user.firstname == undefined || user.lastname == undefined || user.email == undefined || user.password == undefined || user.username == undefined) ||
                    (user.firstname == "" || user.lastname == "" || user.email == "" || user.password == "" || user.username == "")) {
		            $rootScope.wrongregistercredentials = 1;
		            $scope.duplicateusername = null;
		        }
		        else {
		            $http.post("/register", user)
                    .success(function (response) {
                        if (response != null) {
                            //console.log(response);
                            $rootScope.currentUser = response;
                            $rootScope.bookmarks = null;
                            $rootScope.weatherbookmarks = null;
                            $rootScope.wrongregistercredentials = null;
                            $scope.duplicateusername = null;
                            $rootScope.likedUserToBeDisplayed = [];
                            $location.url("/profile");
                        }
                        else {
                            $scope.duplicateusername = 1;
                        }
                    });
		        }
		    }
		    $scope.logout = function () {
		        $http.post("/logout")
                .success(function (response) {
                    $rootScope.currentUser = null;
                    $rootScope.bookmarks = response.favplaces;
                    $rootScope.weatherbookmarks = response.favweather;
                    $rootScope.wronglogindetails = null;
                    $location.url("/views/home");
                });
		    }
		    $scope.selected = function () {
		        $scope.editable = 1;
		    }
		    $scope.profileSave = function (currentUser) {
		        $http.put("/updateuser", currentUser)
                .success(function (response) {
                    //console.log("Log from update user app js");
                    //console.log(response);
                    $rootScope.currentUser = response;
                });
		        $scope.editable = null;
		    }

		    // ROUTE MOUDLE FUNCTIONS

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
                        $scope.oCity = response.places[0].name;
                        $scope.dCity = response.places[1].name;

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

                        var infowindow = new google.maps.InfoWindow();
                        var marker, i;

                        for (var i = 0; i < routeCord.length; i++) {
                            var marker = new google.maps.Marker({
                                position: new google.maps.LatLng(routeCord[i].k, routeCord[i].D)
                            });

                            google.maps.event.addListener(marker, 'click', (function (marker, i) {
                                return function () {
                                    infowindow.setContent(response.places[i].name);
                                    infowindow.open(map, marker);
                                }
                            })(marker, i));

                            marker.setMap(map);
                        }
                    })
		        }
		    }
		    $scope.bookmarkPlace = function () {
		        if ($scope.oCity == undefined || $scope.oCity == "") {
		            alert("enter Source City for details");
		        } else {
		            var data = {
		                favplaces: angular.uppercase($scope.oCity) + "  to  " + angular.uppercase($scope.dCity),
		                _id: $scope.currentUser._id
		            }

		            $http.put("/favplaces", data)
		            .success(function (response) {
		                $http.get("/fetchalluserinfo/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $rootScope.bookmarks = response.favplaces;
                        });
		            })
		        }
		    }
		    $scope.deleteBookmark = function (bm) {
		        var data = {
		            favplaces: bm._id,
		            _id: $scope.currentUser._id
		        }
		        $http.delete("/deletebookmark/" + bm._id + "/" + $scope.currentUser._id)
                .success(function (response) {
                });
		        $http.get("/fetchalluserinfo/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $rootScope.bookmarks = response.favplaces;
                        });
		    }
		    $scope.fetchPlaceDetails = function (bm) {

		        var index = bm.bookmark.split("to");
		        //console.log(index[0] + "----" + index[1]);
		        $scope.oCity = index[0];
		        $scope.dCity = index[1];

		        $http.get("http://free.rome2rio.com/api/1.2/json/Search?key=eU7G6lzt&oName=" + index[0] + "&dName=" + index[1])
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

                        var infowindow = new google.maps.InfoWindow();
                        var marker, i;

                        for (var i = 0; i < routeCord.length; i++) {
                            var marker = new google.maps.Marker({
                                position: new google.maps.LatLng(routeCord[i].k, routeCord[i].D)
                            });

                            google.maps.event.addListener(marker, 'click', (function (marker, i) {
                                return function () {
                                    infowindow.setContent(response.places[i].name);
                                    infowindow.open(map, marker);
                                }
                            })(marker, i));

                            marker.setMap(map);
                        }
                    })
		    }

		    // WEATHER MODULE FUNCTIONS

		    $scope.hourlyWeather = [];
		    $scope.weathers = [];
		    $scope.futureWeather = [];
		    $scope.data = [];

		    $scope.fetchHourly = function (fW) {
		        var index = $scope.data.weather.indexOf(fW);
		        //console.log(index);
		        $scope.hourlydate = fW.date;
		        $scope.hourlyWeather = $scope.data.weather[index].hourly;
		        $scope.showHourlyCheck = 1;
		    }
		    $scope.searchWeather = function () {
		        var weatherCity = $scope.weatherCity;

		        $http.get("http://api.worldweatheronline.com/free/v2/weather.ashx?key=c3520deb638c23ce285718aeffaee&q=" + weatherCity + "&num_of_days=10&tp=3&format=json")
		        .success(function (response) {
		            $scope.weathers = response.data.current_condition;
		            $scope.weatherCity = response.data.request[0].query;
		            $scope.imageCity = response.data.request[0].query;
		            $scope.searchCity = $scope.weatherCity;
		            $scope.futureWeather = response.data.weather;
		            $scope.data = response.data;
		            $scope.showWeatherCheck = 1;
		        });
		    }
		    $scope.favWeather = function () {
		        if ($scope.weatherCity == undefined || $scope.weatherCity == "") {
		            alert("Enter City for details");
		        } else {
		            var weatherdata = {
		                favweather: angular.uppercase($scope.weatherCity),
		                _id: $scope.currentUser._id
		            }
		            $http.put("/weatherplaces", weatherdata)
		            .success(function (response) {
		                $http.get("/fetchalluserinfo/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $rootScope.weatherbookmarks = response.favweather;
                        });
		            })
		        }
		    }
		    $scope.deleteWeatherBookmark = function (bm) {
		        //var data = {
		        //    favplaces: bm._id,
		        //    _id: $scope.currentUser._id
		        //}

		        $http.delete("/deleteweatherbookmark/" + bm._id + "/" + $scope.currentUser._id)
                .success(function (response) {
                })
		        $http.get("/fetchalluserinfo/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $rootScope.weatherbookmarks = response.favweather;
                        });
		    }
		    $scope.fetchWeatherPlaceDetails = function (bm) {
		        $rootScope.weatherCity = bm.bookmark;
		        //console.log(bm.bookmark);

		        $http.get("http://api.worldweatheronline.com/free/v2/weather.ashx?key=c3520deb638c23ce285718aeffaee&q=" + $rootScope.weatherCity + "&num_of_days=10&tp=3&format=json")
		        .success(function (response) {
		            //console.log(response);
		            $scope.weathers = response.data.current_condition;

		            $rootScope.weatherCity = response.data.request[0].query;
		            $scope.searchCity = $rootScope.weatherCity;
		            $scope.imageCity = response.data.request[0].query;
		            $scope.futureWeather = response.data.weather;
		            $scope.data = response.data;
		            $scope.showWeatherCheck = 1;

		            $http.get("/fetchweatherplaces/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $scope.weatherbookmarks = response[0].favweather;
                        });
		        });
		    }

		    // SEARCH

		    $scope.searchButtonClicked = null;
		    $scope.searchUser = function () {
		        $scope.searchedUserIsNotNull = null;
		        $scope.isSearchedUserNull = null;
		        $scope.searchButtonClicked = 1;
		        $http.get("/searchuser/" + $scope.searchquery)
                .success(function (response) {

                    if (response.length == 0) {
                        $scope.isSearchedUserNull = 1;
                    } else {
                        $rootScope.searchedUser = response;
                        $scope.searchedUserIsNotNull = 1;
                        $scope.isSearchedUserNull = null;
                        $scope.doNotShowFavPlaces = null;
                        $scope.doNotShowFavWeather = null;

                        if ($rootScope.currentUser != null) {
                            $http.get("/fetchalluserinfo/" + $rootScope.currentUser._id)
                            .success(function (response) {
                                $rootScope.currentUser = response;

                                //LikeUserDetailToBeDisplayed
                                $rootScope.likedUserToBeDisplayed = [];
                                for (var i = 0; i < $rootScope.currentUser.favuser.length; i++) {
                                    $http.get("/fetchalluserinfo/" + $rootScope.currentUser.favuser[i])
                                        .success(function (response) {
                                            $rootScope.likedUserToBeDisplayed.push(response);
                                        });
                                }
                            });
                        }
                    }
                });
		    }
		    $scope.goToUserProfile = function (index) {
		        $rootScope.selectedUserDetail = $rootScope.searchedUser[index];
		        if ($rootScope.currentUser != null && ($rootScope.selectedUserDetail._id == $rootScope.currentUser._id)) {
		            $location.url("/profile");
		        } else {
		            $location.url("/userprofile");
		        }
		    }
		    $scope.userLiked = function (index) {
		        $rootScope.likedUserDetail = $rootScope.searchedUser[index];

		        var likeduserdata = {
		            favuser: $rootScope.likedUserDetail._id,
		            _id: $rootScope.currentUser._id
		        }
		        $http.put("/likeduser", likeduserdata)
                .success(function (response) {
                    $http.get("/fetchalluserinfo/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $rootScope.currentUser = response;

                            //LikeUserDetailToBeDisplayed
                            $rootScope.likedUserToBeDisplayed = [];
                            for (var i = 0; i < $rootScope.currentUser.favuser.length; i++) {
                                $http.get("/fetchalluserinfo/" + $rootScope.currentUser.favuser[i])
                                    .success(function (response) {
                                        $rootScope.likedUserToBeDisplayed.push(response);
                                    });
                            }
                        });
                })
		    }
		    $scope.goToUserProfileFromSavedUser = function (index) {
		        $rootScope.selectedUserDetail = $rootScope.likedUserToBeDisplayed[index];
		        if ($rootScope.selectedUserDetail._id == $rootScope.currentUser._id) {
		            $location.url("/profile");
		        } else {
		            $location.url("/userprofile");
		        }
		    }
		    $scope.unLikedUser = function (index) {
		        $rootScope.unlikedUserDetail = $rootScope.searchedUser[index];
		        $http.delete("/unlikeuser/" + $rootScope.unlikedUserDetail._id + "/" + $scope.currentUser._id)
                .success(function (response) {
                    //console.log(response);
                    $rootScope.currentUser = response[0];

                    //LikeUserDetailToBeDisplayed
                    $rootScope.likedUserToBeDisplayed = [];
                    for (var i = 0; i < $rootScope.currentUser.favuser.length; i++) {
                        $http.get("/fetchalluserinfo/" + $rootScope.currentUser.favuser[i])
                            .success(function (response) {
                                $rootScope.likedUserToBeDisplayed.push(response);
                            });
                    }
                })
		    }
		    $scope.userProfileUnLike = function () {
		        console.log($rootScope.selectedUserDetail._id);
		        console.log($rootScope.currentUser._id);

		        $http.delete("/unlikeuser/" + $rootScope.selectedUserDetail._id + "/" + $rootScope.currentUser._id)
                .success(function (response) {
                    console.log(response);
                    $rootScope.currentUser = response[0];
                    //LikeUserDetailToBeDisplayed
                    $rootScope.likedUserToBeDisplayed = [];
                    for (var i = 0; i < $rootScope.currentUser.favuser.length; i++) {
                        $http.get("/fetchalluserinfo/" + $rootScope.currentUser.favuser[i])
                            .success(function (response) {
                                $rootScope.likedUserToBeDisplayed.push(response);
                            });
                    }
                })
		    }

		    $scope.userProfileLike = function () {
		        console.log($rootScope.selectedUserDetail._id);

		        var likeduserdata = {
		            favuser: $rootScope.selectedUserDetail._id,
		            _id: $rootScope.currentUser._id
		        }
		        $http.put("/likeduser", likeduserdata)
                .success(function (response) {
                    $http.get("/fetchalluserinfo/" + $rootScope.currentUser._id)
                        .success(function (response) {
                            $rootScope.currentUser = response;

                            //LikeUserDetailToBeDisplayed
                            $rootScope.likedUserToBeDisplayed = [];
                            for (var i = 0; i < $rootScope.currentUser.favuser.length; i++) {
                                $http.get("/fetchalluserinfo/" + $rootScope.currentUser.favuser[i])
                                    .success(function (response) {
                                        $rootScope.likedUserToBeDisplayed.push(response);
                                    });
                            }
                        });
                })
		    }

		    $scope.unfollowUser = function (index) {
		        $rootScope.unlikedUserDetail = $rootScope.likedUserToBeDisplayed[index];
		        $http.delete("/unlikeuser/" + $rootScope.unlikedUserDetail._id + "/" + $rootScope.currentUser._id)
                .success(function (response) {
                    //console.log(response);
                    $rootScope.currentUser = response[0];

                    //LikeUserDetailToBeDisplayed
                    $rootScope.likedUserToBeDisplayed = [];
                    for (var i = 0; i < $rootScope.currentUser.favuser.length; i++) {
                        $http.get("/fetchalluserinfo/" + $rootScope.currentUser.favuser[i])
                            .success(function (response) {
                                $rootScope.likedUserToBeDisplayed.push(response);
                            });
                    }
                })
		    }


		    // ADD COMMENT
		    $scope.addComment = function () {
		        console.log($scope.leavecomment);
		        if ($scope.leavecomment != null && $scope.leavecomment != "" && $scope.leavecomment != undefined) {
		            if ($rootScope.currentUser != null) {
		                var data = {
		                    firstname: $rootScope.currentUser.firstname,
		                    comment: $scope.leavecomment
		                }
		            } else {
		                var data = {
		                    firstname: "Anonymous",
		                    comment: $scope.leavecomment
		                }
		            }
		            $http.post("/addcomment", data)
                    .success(function (response) {
                        $rootScope.allcomments = response;
                        $rootScope.showcomments = 1;
                        $scope.leavecomment = "";
                    });
		        }
		        else {
		            alert("Enter Comment")
		        }
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
                when('/search', {
                    templateUrl: 'services/search/search.html',
                    controller: 'travelController'
                }).
                when('/comment', {
                    templateUrl: 'services/comment/comment.html',
                    controller: 'travelController'
                }).
                when('/weather', {
                    templateUrl: 'services/weather/weather.html',
                    controller: 'travelController'
                }).
                when('/userprofile', {
                    templateUrl: 'views/userProfile/userProfile.html',
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
            //console.log(user);
            $http.get("/fetchalluserinfo/" + user._id)
            .success(function (response) {
                $rootScope.currentUser = response;
                $rootScope.bookmarks = response.favplaces;
                $rootScope.weatherbookmarks = response.favweather;
            });
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
