angular.module('StudentHome',["Navbar"])
    .controller('StudentHome', function($rootScope, $scope, $http, $window ,$location, config){
        
        $scope.readCourse = function(courseId){
            $location.url('/student/course?courseId='+courseId)
        }

        $scope.enrollCourse = async function(courseId, title){
            try{
                $rootScope.logger.alert('Loading Course: '+ title , () => $location.url('/student/course/' + courseId)) 

            } catch(err){
                $rootScope.logger.error(err)
            } finally {
                $scope.$apply()
            }
        }

        $scope.searchCourse = async function({page = 0, skip, limit, sortBy = 'createdAt:desc' , search} = {}){

            if(!skip) skip = page * limit
        
            let query = `sortBy=${sortBy}&limit=${limit}&skip=${skip}`
            if(search && search.length > 0) query += `&search=${search}`
            
        
            const token = $window.localStorage.getItem(config.tokenStorageName)
            const response = await $http.get(`/course/search?${query}`,{
              headers: { 'Authorization': `Bearer ${token}`}
            })

            
            response.data.courses.forEach(course => {
                course.isEnrolled = $rootScope.courseList.find(sc => sc.course == course._id) != undefined
            })
            
            return response.data.courses
          }

        $scope.loadMore = async function(){
            try{
                $rootScope.logger.loading()
                
                const list = await $scope.searchCourse({skip: $scope.courses.length,sortBy : $scope.list.sortBy, limit: $scope.list.limit, search : $scope.list.search})

                if(list.length <= 0) $scope.flags.hasMore = false
                $scope.courses = $scope.courses.concat(list)
                
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
                
                $scope.courses = [].concat(await $scope.searchCourse({ skip: 0, sortBy : $scope.list.sortBy ,limit: $scope.list.limit, search : $scope.list.search}))
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
                $scope.courses = []

                $scope.list = {
                    sortBy: 'createdAt:desc',
                    search: undefined,
                    limit : 6,
                }

                $scope.flags = {
                    hideOptionList: false,
                    hasMore: true,
                }
                
                if(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) < 720){
                    $scope.flags.hideOptionList = true
                }

                if(!$rootScope.user)  await $rootScope.loadUser('student')
                
                await $rootScope.loadCourseList()
                await $scope.loadCourses()

                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err, () => $location.url('/'))

            } finally{
                $scope.$apply()
            }         
        }

        $scope.init()
    })