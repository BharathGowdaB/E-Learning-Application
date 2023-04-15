
angular.module("Navbar",[])
    .controller('Navbar',function($scope, $rootScope, $location, $http, $window, config){

        $scope.logoutActive = false

        $scope.redirect = function(e, href){
            $location.url(href)
        }

        $scope.clickPic = function () {
            $scope.logoutActive = !$scope.logoutActive
        }

        $scope.logout = async function(){
            try{
                $rootScope.logger.loading()

                const token = $window.localStorage.getItem(config.tokenStorageName)
                await $http.post(`/${$rootScope.type}/logout`,{} , {headers: {Authorization: `Bearer ${token}`}})

                $rootScope.logger.alert('Redirecting to Login Page..', () => $location.url('/'))
            } catch(err){
                $rootScope.logger.error(err, () => $location.url('/'))
            } finally{
                $scope.$apply()
            }   
        }

        $scope.logoutAll = async function(){
            $rootScope.logger.confirm('Logout form every device?', async () => {
                try{
                    const token = $window.localStorage.getItem(config.tokenStorageName)
                    await $http.post(`/${$rootScope.type}/logoutAll`,{} , {headers: {Authorization: `Bearer ${token}`}})

                    $rootScope.logger.close()
                    $location.url('/login')
                } catch(err){
                    $rootScope.logger.error(err, () => $location.url('/'))
                } finally{
                    $scope.$apply()
                }     
            }, {btnName: 'Logout'})      
        }

        $scope.saveProfile = async function(event){
            try{
                event.preventDefault()
                
                $rootScope.logger.loading()
                
                const token = $window.localStorage.getItem(config.tokenStorageName)
                const response = await $http.patch(`/${$rootScope.type}`, {
                    firstname: $rootScope.user.firstname,
                    lastname: $rootScope.user.lastname,
                    phone: $rootScope.user.phone,
                    university: $rootScope.user.university,
                }, { 
                    headers:{ 
                        Authorization: `Bearer ${token}` 
                    }
                })
                
                $rootScope.logger.alert('Profile Updated')
            } catch(err){
                $rootScope.logger.error(err)
            } finally{
                $scope.$apply()
            }
        }

        $scope.resetPassword = async function(event){
            if($scope.user.newPassword !== $scope.user.rePassword) {
                return $rootScope.logger.alert('Confirm Password not Matching!')
            }
            
            try{
                
                event.preventDefault()
                
                $rootScope.logger.loading()
                
                const token = $window.localStorage.getItem(config.tokenStorageName)
                const response = await $http.patch(`/${$rootScope.type}/password`, {
                    oldPassword: $scope.user.oldPassword,
                    newPassword : $scope.user.newPassword,
                }, { 
                    headers:{ 
                        Authorization: `Bearer ${token}` 
                    }
                })
                
                $rootScope.logger.alert("Password Updated!", () => $location.url('/login'))
                $scope.$apply()

            } catch(err){
                $rootScope.logger.error(err)
                $scope.$apply()
            }
        }



        $scope.uploadAvatar = async function(){
            try{
                $rootScope.logger.loading()
                
                avatar = new FormData()
                avatar.append('avatar', $window.document.querySelector('#new-profile-pic').files[0])
    
                const token = $window.localStorage.getItem(config.tokenStorageName)
                await $http.patch(`/${$rootScope.type}/me/avatar`, avatar, { headers:{
                        'Content-Type' : undefined,
                        Authorization: `Bearer ${token}`
                }})
                
                $rootScope.avatar = $rootScope.avatar.split('?')[0] + '?' + new Date().getTime()
                
                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err)
            } finally{
                $scope.$apply()
            }
        }

        $scope.deleteAvatar = async function(){
            $rootScope.logger.confirm('Do you want to delete your profile-pic?', async () => {
                try{
                    const token = $window.localStorage.getItem(config.tokenStorageName)
                    await $http.delete(`/${$rootScope.type}/me/avatar`, { headers:{ Authorization: `Bearer ${token}` }})
    
                    $rootScope.avatar = $rootScope.avatar.split('?')[0] + '?' + new Date().getTime()
                    
                    $rootScope.logger.close()
                } catch(err){
                    $rootScope.logger.error(err)
                } finally{
                    $scope.$apply()
                }
            })
        }
        
        $scope.init = function() {
            if($rootScope.type == 'instructor')
                $scope.links=[
                    {name:'Home',href:'/instructor/home',  class: 'selected', alt: 'home', src :'/static/images/icons/home.svg'},
                    {name:'Course',href:'/instructor/course', alt : 'course', src :'/static/images/icons/course.svg'},
                    {name:'Students',href:'/instructor/students', alt : 'student', src :'/static/images/icons/student.svg'}];
            else{
                $scope.links=[
                    {name:'Home',href:'/student/home',  class: 'selected',alt: 'home', src :'/static/images/icons/home.svg'},
                    {name:'Course',href:'/student/course',alt : 'course', src :'/static/images/icons/course.svg'}];
            }
            $scope.count=0
        }

        $scope.init()
})
