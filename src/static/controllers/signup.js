
angular.module('Signup',[]).
    controller('Signup', function($scope,$rootScope , $http, $location, $window, config){
        $scope.create = async function(e){
            try{
                if(!($scope.signupform.$valid && $scope.user.repassword === $scope.user.password)) throw new Error('passwords not matching')
                
                const url = config.domain + '/' + ($scope.user.type || 'student')

                const response = await $http.post(url, $scope.user)
                $window.localStorage.setItem(config.tokenStorageName, response.data.token)

                $location.url('/' + $scope.user.type + '/home')
    
            } catch(err){
                if(err.status == 400) $scope.signupError = '! Email already in use please Login'
                else   $scope.signupError = '! server error: please try later'

            } finally{
                $scope.$apply()
            }
        }

        $scope.login = function(){
            $location.url('/login')
        }

        $scope.init = function(){
            $scope.user = {
                type: 'student'
            }

            delete $rootScope.user
            
        }
        $scope.init()
    })