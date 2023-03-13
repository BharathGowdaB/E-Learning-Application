
angular.module("Login",[])
    .controller("Login", function($scope,$rootScope ,  $http, $location, $window, config) {

        $scope.submit = async function(){
            try{
                const url = config.domain + '/' + $scope.user.type + '/login'
                const response = await $http.post( url, $scope.user)

                $window.localStorage.setItem(config.tokenStorageName, response.data.token)

                $location.url('/' + $scope.user.type + '/home')
                
            } catch(err){
                if(err.status == 401) $scope.loginError = '!username or password not matching'
                else   $scope.loginError = '! server error: please try later'
            }finally{
                $scope.$apply()
            }
            
        }

        $scope.register = function(e){
            $location.url('/signup')
        }

        $scope.init = function(){
            $scope.user = {
                type: "student"
            }

            delete $rootScope.user
        }

        $scope.init()
    })