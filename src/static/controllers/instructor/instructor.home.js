angular.module('InstructorHome',["Navbar"])
    .controller('InstructorHome', function($rootScope, $scope, $http, $window ,$location, config){
        
        $scope.editCourse = function(courseId){
            $location.url('/instructor/course?courseId='+courseId)
        }

        $scope.loadMore = async function(){
            try{
                $rootScope.logger.loading()
                await $rootScope.loadCourseList({limit: 6, skip: $scope.courses.length,sortBy : $scope.list.sortBy, search : $scope.list.search})

                if($rootScope.courseList.length <= 0) $scope.flags.hasMore = false
            
                $scope.courses = $scope.courses.concat($rootScope.courseList)
            
                $rootScope.logger.close()

            } catch(err){
                $rootScope.logger.error(err)
            } finally {
                $scope.$apply()
            }
        }


        $scope.loadCourses = async function(){
            try{
                $rootScope.logger.loading()

                if($scope.searchTitle.length <= 0) $scope.list.search = undefined
                else    $scope.list.search = $scope.searchTitle

                await $rootScope.loadCourseList({ skip: 0, limit: 6, sortBy : $scope.list.sortBy , search : $scope.list.search})

                $scope.courses = [].concat($rootScope.courseList)
                $scope.flags.hasMore = true

                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err)
            } finally {
                $scope.$apply()
            }
        }

        $scope.init = async function(){
            try{
                $rootScope.logger.loading()

                $scope.optionList = [
                    {
                        name: "Ascending",
                        value: 'title:asc'
                      },
                      {
                        name: "Descending",
                        value: 'title:desc'
                      },
                      
                      {
                        name: "Popular",
                        value: 'enrolled:desc'
                      },
                      
                      {
                        name: 'Recent',
                        value: 'createdAt:desc'
                      },
                ]

                $scope.searchTitle = ''
                $scope.list = {
                    sortBy: 'createdAt:desc',
                    search: undefined
                }

                $scope.flags = {
                    hideOptionList: false,
                    hasMore: true
                }
    
                if(!$rootScope.user)  await $rootScope.loadUser('instructor')
                
                await $scope.loadCourses()

                $rootScope.logger.close()

                if($scope.courses.length <= 0) $rootScope.logger.alert('Lets create your first course! \u{1F600}', () => $location.url('/instructor/course'))
            } catch(err){
                $rootScope.logger.error(err, () => $location.url('/'))
            } finally{
                $scope.$apply()
            }         
        }

        $scope.init()
    })