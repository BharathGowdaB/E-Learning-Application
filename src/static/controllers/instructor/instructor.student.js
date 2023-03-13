angular.module("InstructorStudent",["Navbar"])
    .controller("InstructorStudent" , function($location, $rootScope, $scope,$http,$window,config){
       
        $scope.newCourse = function(){
            $location.url('/instructor/course')
        }

        $scope.loadStudents = async function({page = 0} = {}){
            try{
                $rootScope.logger.loading()
                
                const limit = $scope.sortManager.studentList.limit
                const skip = page * limit

                const query = '?'+ ($scope.flags.createdAtDesc ? 'sortBy=createdAt:desc&' : '' ) + `skip=${skip}&` + `limit=${limit}`
                
                const token = $window.localStorage.getItem(config.tokenStorageName)
                const response = await $http.get(`/course/${$scope.list.courseId}/studentList${query}` , {
                     headers : {Authorization: `Bearer ${token}`}
                    })

                $scope.studentList = response.data.students

                $scope.sortManager.studentList.skip = response.data.skip
                $scope.sortManager.studentList.total = response.data.total
                
                $scope.student = $scope.studentList[0]

                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err)
            } finally{
                $scope.$apply()
            }
            
        }

        $scope.loadStudentDetails = function(index){
            $scope.student = $scope.studentList[index].student
            $scope.flags.hideStudentDetails = false
        }

        $scope.changeCourse = function(){
            if($scope.list.courseId){
                
            }
            else if($rootScope.courseList.length > 0){
                $scope.list.courseId = $rootScope.courseList[0]._id
            }
            else{
                console.log('returning')
                return $rootScope.logger.alert('Please create course first!', () => $location.url('/instructor/course'))
            }
            
            $scope.loadStudents()
        }

        $scope.loadCourseList = async function(options){
            try{
                $rootScope.logger.loading()

                await $rootScope.loadCourseList(options)

                if($rootScope.courseList.length == 0) $scope.flags.hideNewCourse = false
                else $scope.flags.hideNewCourse = true
                
                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err)
            } finally{
                $scope.$apply()
            }
        }
        

        $scope.init = async function() {
            try{
                $rootScope.logger.loading()

                $scope.list = {
                    courseId: 'tempId',
                }

                $scope.flags = {
                    hideCourseList: false,
                    hideStudentDetails: true,
                    createdAtDesc: true,
                }
                
                $scope.sortManager ={ 
                    studentList: new paginationManager({limit: 20})
                }

                if(!$rootScope.user)  await $rootScope.loadUser('instructor')
                
                await $scope.loadCourseList()

                if($location.search().courseId){
                    $scope.list.courseId = $location.search().courseId
                    $location.search('courseId' , null)
                    $location.replace()
                }
                else  {
                    $scope.list.courseId = undefined
                }

                $rootScope.logger.close()
                $scope.changeCourse()
            } catch(err){
                $rootScope.logger.error(err, () => $location.url('/'))
            } finally{
                $scope.$apply()
            }         
        }

        $scope.init()
    })