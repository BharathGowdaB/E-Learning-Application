angular.module("StudentCourse", ["Navbar", 'ngAnimate'])
    .controller("StudentCourse" , function($rootScope, $scope, $http, $window, $location, config){

        $scope.loadInstructor = async function(){
            try{
                $rootScope.logger.loading()
            
                const response = await $http.get(`/instructor/id/${$scope.course.instructor}`)
 
                $scope.instructor = response.data.instructor
                $scope.instructor.avatar = '/instructor/id/' +$scope.course.instructor + '/avatar'

                $rootScope.logger.close()
            } catch(err){
                
                $rootScope.logger.error(45 + err)
            } finally{
                $scope.$apply()
            }
        }

        $scope.loadCourse = async function(){
            try{
                $rootScope.logger.loading()
                if(!$scope.list.courseId){
                    if($rootScope.courseList.length < 0) {
                        return $rootScope.logger.alert('Please Enroll to a course first!', () => $location.url('/student/home'))
                    }
                    $scope.list.courseId = $rootScope.courseList[0].course
                }
                
                $scope.flags.isEnrolled = true

                $scope.course = await $rootScope.loadCourseById($scope.list.courseId)
                $scope.flags.isCourseCard = true

                $rootScope.logger.close()
                $scope.$apply()
            } catch(err){
                $rootScope.logger.error(err)
                $scope.$apply()
            }    

            $scope.loadInstructor();
        }

        $scope.loadModule = async function(){
            try{
                $rootScope.logger.loading()

                $scope.module = await $rootScope.loadModuleById($scope.list.moduleId)
 
                $scope.tinymce.activeEditor.setContent($scope.module.content)
                //$window.document.querySelector('#editor').innerHTML = $scope.module.content
                $scope.flags.isCourseCard = false

                $window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "smooth"
                })
                $rootScope.logger.close()

            } catch(err){
                $rootScope.logger.error(err)
            }   finally{
                $scope.$apply()
            }
        }

        $scope.loadEditor = async function(){
            if(tinymce.activeEditor) tinymce.activeEditor.remove()
            tinymce.editorMode = 
            $scope.tinymce = tinymce
            return await $scope.tinymce.init({
                    selector: '#editor',
                    readonly: true,
                    menubar: '',
                    object_resizing: false,
                    skin: 'oxide',
                    min_height: 440,
                    plugins: 'anchor fullscreen autolink autoresize charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount ',
                    toolbar : ''  
            })

        }

        $scope.loadCourseList = async function(options){
            try{
                $rootScope.logger.loading()

                await $rootScope.loadCourseList(options)
                
                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err)
            } finally{
                $scope.$apply()
            }  
        }

        $scope.isEnrolled = async function(){
            try{
                const token = $window.localStorage.getItem(config.tokenStorageName)
                const response = await $http.get('/student/enrolled/' + $scope.list.courseId, {
                    headers: { 'Authorization': `Bearer ${token}`}
                })
                $scope.flags.isEnrolled = true
            } catch(err){
                $scope.flags.isEnrolled = false
            }
        }
        
        $scope.addCourse = async function(){
            try{
                if(!$scope.list.courseId) return

                const token = $window.localStorage.getItem(config.tokenStorageName)
    
                const response = await $http.patch('/student/addCourse/' + $scope.list.courseId,{}, {
                    headers: { 'Authorization': `Bearer ${token}`}
                })

                $rootScope.logger.alert('Enrolled to Course.')
                $scope.flags.isEnrolled = true

                $scope.$apply()
            } catch(err){
                $rootScope.logger.error(err)
                $scope.$apply()
            }  
        }

        $scope.removeCourse = function(){
            
                if(!$scope.list.courseId) return

                $rootScope.logger.confirm('Do you want to Unenroll course: ' + $scope.course.title, async () => {
                    try{
                        const token = $window.localStorage.getItem(config.tokenStorageName)
    
                        const response = await $http.delete('/student/removeCourse/' + $scope.list.courseId, {
                            headers: { 'Authorization': `Bearer ${token}`}
                        })

                        $scope.list.courseId = undefined
                        await $scope.loadCourseList({skip: 0})
                        await $scope.loadCourse()

                        $rootScope.logger.close()
                        $scope.$apply()
                    } catch(err){
                        $rootScope.logger.error(err)
                        $scope.$apply()
                    } 
                }, {
                    btnName: 'Unenroll',
                })
                 
        }


        $scope.init = async function() {
            try{
                $rootScope.logger.loading()

                $scope.course = {}
                $scope.module = {}
                $scope.instructor = {}

                $scope.list = {
                    courseId: null,
                    moduleId: null,
                }

                $scope.flags = {
                    isCourseCard: true,
                    hideCourseList: false,
                    hideModuleList: false,
                    isEnrolled: true,
                }

                if(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) < 720){
                    $scope.flags.hideCourseList = true
                    $scope.flags.hideModuleList = true
                }

                if(!$rootScope.user)  await $rootScope.loadUser('student')
                
        
                if($location.search().courseId){
                    $scope.list.courseId = $location.search().courseId
                    //$location.search('courseId' , null)
                    //$location.replace()    
                }

                await $scope.loadCourseList()
                await $scope.loadEditor()
                
                $rootScope.logger.close()
                
                await $scope.loadCourse()
                await $scope.isEnrolled()
                   
            } catch(err){
                $rootScope.logger.error(err, () => $location.url('/'))
            } finally{
                $scope.$apply()
            }     
        }

        $scope.init();

    })