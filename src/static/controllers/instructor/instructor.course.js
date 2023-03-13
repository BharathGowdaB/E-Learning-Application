angular.module("InstructorCourse", ["Navbar", 'ngAnimate'])
    .controller("InstructorCourse" , function($rootScope, $scope, $http, $window, $location, config){

        $scope.loadStudents = function(){
            if(!$scope.list.courseId) return
            $location.url('/instructor/students?courseId=' + $scope.list.courseId)
        }
        
        $scope.loadCourse = async function(){
            try{
                $rootScope.logger.loading()
                
                if(!$scope.list.courseId) return $scope.newCourse()

                $scope.course = await $rootScope.loadCourseById($scope.list.courseId)

                $scope.flags.isCourseCard = true

                $rootScope.logger.close()
                $scope.$apply()
            } catch(err){
                $rootScope.logger.error(err)
                $scope.$apply()
            }    
        }

        $scope.newCourse = function(){
            $scope.list.courseId = null
            $scope.list.moduleId = null
            $scope.flags.isCourseCard = true

            $scope.course._id = null
            $scope.course.title = ''
            $scope.course.description = ""
            $scope.course.modules = []
            $scope.course.enrolled = $rootScope.numToString(0)
            $scope.course.poster = config.constants.defaultPosterPath

            $window.document.querySelector('#new-course-poster').value = ''
            
            $rootScope.logger.close()
        }


        $scope.loadModule = async function(){
            try{
                $rootScope.logger.loading()

                if(!$scope.list.moduleId) return $scope.newModule()

                $scope.module = await $rootScope.loadModuleById($scope.list.moduleId)
     
                $scope.tinymce.activeEditor.setContent($scope.module.content)
                $scope.flags.isCourseCard = false

                $rootScope.logger.close()
                $scope.$apply()
            } catch(err){
                $rootScope.logger.error(err)
                $scope.$apply()
            }    
        }

        $scope.newModule = function(){
            $scope.list.moduleId = undefined
            $scope.flags.isCourseCard = false
            $scope.module.chapter = ''
            $scope.module.content = ''
            $scope.module.index = ($scope.course.modules['length'] || 0)+ 1

            $scope.tinymce.activeEditor.setContent($scope.module.content)

            $rootScope.logger.close()
        }

        $scope.removeModule = async function(){
            
                if(!$scope.list.moduleId) return

                $rootScope.logger.confirm('Do you want to delete module:' + $scope.course.modules.find(m => m._id == $scope.list.moduleId).chapter , async () => {
                    try{
                        const token = $window.localStorage.getItem(config.tokenStorageName)
                        await $http.delete(`/course/${$scope.list.courseId}/module/${$scope.list.moduleId}`,{
                            headers: { Authorization: `Bearer ${token}`}
                        })

                        $scope.course.modules = $scope.course.modules.filter(module => module._id != $scope.list.moduleId)
                        $scope.list.moduleId = undefined

                        $scope.newModule()

                        $rootScope.logger.close()
                    } catch(err){
                        $rootScope.logger.error(err)
                    } finally{
                        $scope.$apply()
                    }    
                })
                
        }


        $scope.saveModule = async function(event){
            try{
                event.preventDefault()
                $rootScope.logger.loading()
                
                if(!$scope.list.courseId) {
                    await $scope.saveCourse(event)
                }

                $scope.module.content = $scope.tinymce.activeEditor.getContent()
                let response

                const token = $window.localStorage.getItem(config.tokenStorageName)
                if(!$scope.list.moduleId) {
                   
                    response = await $http.post(`/course/${$scope.list.courseId}/module`,$scope.module ,{
                        headers: { Authorization: `Bearer ${token}`}
                    })

                    $scope.course.modules.push(response.data.module)
                    $scope.list.moduleId =  response.data.module._id
                    
                } else{
                    response = await $http.patch(`/course/${$scope.list.courseId}/module/${$scope.list.moduleId}`,$scope.module ,{
                        headers: { Authorization: `Bearer ${token}`}
                    })
                } 

                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err)
            } finally{
                $scope.$apply()
            }    
        }

        $scope.updateModuleOrder = async function(event, _id){
            try{
                console.log(event, _id)
                $rootScope.logger.loading()
                
                response = await $http.patch(`/course/${$scope.list.courseId}/module/${_id}`,{index: event.target.value} ,{
                    headers: { Authorization: `Bearer ${token}`}
                })
                
                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err)
            } finally{
                $scope.$apply()
            } 

            $scope.loadCourse()
        }

        $scope.saveCourse = async function(event){
            try{
                event.preventDefault()

                $rootScope.logger.loading()
                
                let response

                const token = $window.localStorage.getItem(config.tokenStorageName)
                if(!$scope.list.courseId) {
                    const newCourse = {...$scope.course}
                    delete newCourse.poster

                    response = await $http.post('/course/',newCourse ,{
                        headers: { Authorization: `Bearer ${token}`}
                    })

                    $scope.courseList.unshift({ 
                        _id: response.data.course._id,
                        title: response.data.course.title,
                    })

                    $scope.list.courseId =  response.data.course._id

                    if($window.document.querySelector('#new-course-poster').files[0]) {
                        const poster = new FormData()
                        poster.append('poster', $window.document.querySelector('#new-course-poster').files[0])
                    
                        await $http.patch(`/course/${$scope.list.courseId}/poster`, poster ,{ headers:{
                            'Content-Type' : undefined,
                            Authorization: `Bearer ${token}`
                        }})

                        $scope.course.poster = `/course/id/${$scope.list.courseId}/poster?` + new Date().getTime()
                    }
                    
                } else{
                    response = await $http.patch(`/course/${$scope.list.courseId}`,$scope.course ,{
                        headers: { Authorization: `Bearer ${token}`}
                    })
                } 

                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err)
            } finally{
                $scope.$apply()
            }    
        }

        $scope.removeCourse = async function(){
            if(!$scope.list.courseId) return

            $rootScope.logger.confirm('Do you want to delete course: ' + $scope.course.title , async () => {
                
                try{
                    const token = $window.localStorage.getItem(config.tokenStorageName)
                    await $http.delete(`/course/${$scope.list.courseId}`,{
                        headers: { Authorization: `Bearer ${token}`}
                    })

                    await $rootScope.loadCourseList()
                    $scope.list.courseId = undefined
                    $scope.loadCourse()
    
                    $rootScope.logger.close()
                } catch(err){
                    $rootScope.logger.error(err)
                } finally{
                    $scope.$apply()
                }   
            })  
            
        }


        $scope.uploadPoster = async function(){
            try{
                $rootScope.logger.loading()

                if(!$scope.list.courseId){
                    if (FileReader && $window.document.querySelector('#new-course-poster').files[0]) {
                        var fr = new FileReader();
                        fr.onload = function () {
                            $scope.course.poster = fr.result;
                            $scope.$apply()
                        }
                        fr.readAsDataURL($window.document.querySelector('#new-course-poster').files[0]);
                    }

                    return $rootScope.logger.close()
                }
                const poster = new FormData()

                poster.append('poster', $window.document.querySelector('#new-course-poster').files[0])
                
                const token = $window.localStorage.getItem(config.tokenStorageName)
                const response = await $http.patch(`/course/${$scope.list.courseId}/poster`, poster ,{ headers:{
                    'Content-Type' : undefined,
                    Authorization: `Bearer ${token}`
                }})

                $scope.course.poster = `/course/id/${$scope.list.courseId}/poster?` + new Date().getTime()
                
                $rootScope.logger.close()
                $scope.$apply()
            } catch(err){
                $rootScope.logger.error(err)
                $scope.$apply()
            }  
        }

        $scope.deletePoster = function(){
            $rootScope.logger.confirm('Do you want to delete course poster?', async () => {
                try{
                    if($scope.list.courseId){
    
                        const token = $window.localStorage.getItem(config.tokenStorageName)
                        $http.delete(`/course/${$scope.list.courseId}/poster` , { 
                            headers : {Authorization: `Bearer ${token}`}
                        })
    
                    }
    
                    $scope.course.poster = config.defaultPosterPath

                    $rootScope.logger.close()
                } catch(err){
                    $rootScope.logger.error(err)
                }  
            })
        }


        $scope.loadEditor = async function(){
            if(tinymce.activeEditor) tinymce.activeEditor.remove()
            $scope.tinymce = tinymce
            return await $scope.tinymce.init({
                    selector: '#editor',
                    skin: 'oxide',
                    min_height: 440,
                    plugins: 'anchor fullscreen autolink autoresize charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount ',
                    toolbar: ' undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                    tinycomments_mode: 'embedded',  
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
        

        $scope.init = async function() {
            try{
                $rootScope.logger.loading()

                $scope.course = {}
                $scope.module = {}

                $scope.list = {
                    courseId: null,
                    moduleId: null,
                }

                $scope.flags = {
                    isCourseCard: true,
                    hideCourseList: false,
                    hideModuleList: false,
                }

                if(!$rootScope.user)  await $rootScope.loadUser('instructor')
                
                await $scope.loadCourseList()

                if($location.search().courseId){
                    $scope.list.courseId = $location.search().courseId
                    $location.search('courseId' , null)
                    $location.replace()
                }

                await $scope.loadCourse()
                await $scope.loadEditor()

                $rootScope.logger.close()
            } catch(err){
                $rootScope.logger.error(err, () => $location.url('/'))
            } finally{
                $scope.$apply()
            }     
        }

        $scope.init();

    })