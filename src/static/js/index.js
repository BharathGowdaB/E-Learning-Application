
var app = angular.module("myApp", ['ngAnimate','StudentCourse','StudentHome','InstructorStudent','InstructorCourse', 'InstructorHome' , 'Navbar', 'Login', 'Signup', "ngRoute"]);

class paginationManager {
    constructor({maxPageLinks=6, limit=8 , sortByOptions = []} = {}){
      this.maxPageLinks = maxPageLinks
      this.limit = limit
      this.skip = 0,
      this.total = 0,
      this.currentPage = 0,
      this.pageStart = 0
      this.sortByOptions = sortByOptions,
      this.sortBy = "createdAt:desc"
    }
    
    decPage(){
        this.pageStart -= 1

        if(this.pageStart < 0) this.pageStart = 0
    }

    incPage(){
        this.pageStart += 1
        const nPage = Math.ceil(parseFloat(this.total / this.limit, 10))

        if(this.pageStart > nPage - this.maxPageLinks) this.pageStart = nPage - this.maxPageLinks

        if(this.pageStart < 0) this.pageStart = 0
    }

}

class Logger {
  constructor(){
    this.type = 'Loading',
    this.message = 'Ready to Log'
    this.logging = false,
    this.close = () => { 
      this.logging = false
      this.type = 'Loading'
    }
    this.callback = this.close
  }


  loading(){
    this.type = 'Loading'
    this.logging = true
  }

  alert(message , callback = this.close){
    this.message = message
    this.type = 'Alert'
    this.logging = true
    this.callback = callback
  } 

  error(message, callback = this.close){
    this.message = message.data || message
    this.type = 'Error'
    this.logging = true
    this.callback = callback
  } 

  confirm(message,  callback ,{btnName= 'Delete' , bgColor= 'red'} = {}){
    this.message = message
    this.type = 'Confirm'
    this.logging = true
    this.config = {btnName , bgColor}
    this.callback = () => { this.loading(); callback()}
  }

}

app.controller('my-App', function($rootScope, $http, $window, config) {

  $rootScope.moduleList = []
  $rootScope.courseList = []

  $rootScope.logger = new Logger()

  $rootScope.rootSortManager = {
      courseList : new paginationManager({sortByOptions : [
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
      ]}),
  }

  $rootScope.loadUser =  async function(type='student'){
      $rootScope.user = {}
      $rootScope.type = type

      const token = $window.localStorage.getItem(config.tokenStorageName)

      const response = await $http.get(`/${$rootScope.type}/me`,{headers: { Authorization: `Bearer ${token}`}})
      
      if(!response.status == 200) throw new Error({error: 'Something went wrong'})
        
      $rootScope.user = response.data[type]
      
      // $rootScope.user.courses = {}

      $rootScope.avatar = `/${type}/id/${$rootScope.user._id}/avatar`
     
  }

  $rootScope.loadCourseById = async function(courseId){  
    const response = await $http.get(`/course/id/${courseId}`)

    const course = response.data.course
    course.enrolled = $rootScope.numToString(course.enrolled || 0)
    course.description = course.description || ''
    course.poster = `/course/id/${course._id}/poster`

    return course  
  }

  $rootScope.loadModuleById = async function(moduleId){  
    const response = await $http.get(`/course/module/id/${moduleId}`)
    const module = response.data.module

    return module  
  }

  $rootScope.loadCourseList =  async function({limit= $rootScope.rootSortManager.courseList.limit, page = $rootScope.rootSortManager.courseList.currentPage, skip, sortBy = $rootScope.rootSortManager.courseList.sortBy , search} = {}){

    if(!skip) skip = page * limit

    let query = `sortBy=${sortBy}&limit=${limit}&skip=${skip}`
    if(search && search.length > 0) query += `&search=${search}`
    

    const token = $window.localStorage.getItem(config.tokenStorageName)
    const response = await $http.get(`/${$rootScope.type}/me/courseList?${query}`,{
      headers: { 'Authorization': `Bearer ${token}`}
    })
    
    $rootScope.rootSortManager.courseList.total = response.data.total
    $rootScope.rootSortManager.courseList.skip = response.data.skip
    $rootScope.rootSortManager.courseList.currentPage = page

    $rootScope.courseList =  response.data.courses

  }


  $rootScope.numToMonth = ['','Jan','Feb','Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov' , 'Dec']
  
  $rootScope.createdAtToString= function(time){
    const arr = time.split('-')
    return `${arr[2].substr(0,2)} ${$rootScope.numToMonth[parseInt(arr[1])]} ${arr[0]}`
  },

  $rootScope.numToString = function(x){
    if(x < 9999) return x
    else {
      return Math.round(x/1000) + 'k'
    }
  }
})
/* Constant variables */
app.constant('config',{
  domain: '',
  tokenStorageName: 'e-learning-jwt-token',
  constants : {
    defaultPosterPath : '/course/id/null/poster'
  },
  
  
})


//-------------------------------
app.config(function($routeProvider) {
  $routeProvider
  .when("/signup", {
    templateUrl : "static/views/signup.html",
    controller : "Signup"
  })
  .when("/login", {
    templateUrl : "static/views/login.html",
    controller : "Login"
  })
  .when("/student/home", {
    templateUrl : "static/views/student/student.home.html",
    controller : "StudentHome"
  })
  .when("/student/course", {
    templateUrl : "static/views/student/student.course.html",
    controller : "StudentCourse",
    reloadOnSearch: false
  })
  .when("/instructor/home", {
    templateUrl : "static/views/instructor/instructor.home.html",
    controller: 'InstructorHome',
  })
  .when("/instructor/course", {
    templateUrl : "static/views/instructor/instructor.course.html",
    controller : "InstructorCourse",
    reloadOnSearch: false
  })
  .when("/instructor/students", {
    templateUrl : "static/views/instructor/instructor.student.html",
    controller : "InstructorStudent",
    reloadOnSearch: false
  })
  .otherwise( {
    redirectTo : '/login',
    templateUrl : "static/views/login.html",
    controller : "Login"
  });
});

app.filter('range', function() {
    return function(list, total ) {
      total = parseInt(total, 10)

      for (var i = 0; i < total; i++) {
        list.push(i);
      }
      return list;
    };
  });


app.filter('pageRange', function() {
    return function(list, {total, skip, limit, pageStart , maxPageLinks} = {}) {
      
      const nPage = Math.ceil(parseFloat(total / limit, 10))

      const end =  nPage > (pageStart + maxPageLinks) ? (pageStart + maxPageLinks) : nPage

      list = []
      
      for (var i = pageStart;  i < end; i++) {
        list.push(i);
      }

      if(nPage > end) {
        list.pop()
        list.push(nPage - 1)
      }
      
      return list;
    };
});


//-------------------DIRECTIVES------------------------------------

app.directive("messageLogger", function(){
  return {
    restrict: 'E',
      transclude: true,
      scope: {
        logger: '='
     },
    template : 
    `<div class="message-log-screen" ng-show="logger.logging">
      <div class="message-log-container">
        <div ng-show="logger.type == 'Error'" class='message-log'>
            <h3>Error :</h3>
            <div class="description error">{{logger.message}}</div>
            <div class="buttons">
                <button class="positive" ng-click="logger.callback()">Ok</button>
            </div>
        </div>
        <div ng-show="logger.type == 'Confirm'" class='message-log'>
            <h3>Confirm :</h3>
            <div  class="description">{{logger.message}}</div>
            <div class="buttons">
                <button  class="negative" style="background-color: {{logger.config.bgColor}};" ng-click="logger.callback()">{{logger.config.btnName}}</button>
                <button  class="positive" ng-click="logger.close()">Cancel</button>
            </div>
        </div>
        <div ng-show="logger.type == 'Alert'" class='message-log'>
            <h3>Alert :</h3>
            <div class="description">{{logger.message}}</div>
            <div class="buttons">
                <button class="positive" ng-click="logger.callback()">Ok</button>
            </div>
        </div>
    </div>

    <img class="loading-icon" src="static/images/icons/loading.svg">
    
</div>`
  }
})

app.directive("pagination", function(){
  return {
      restrict: 'E',
      transclude: true,
      scope: {
        paginationManager : '=',
        loadPageFunction : '=',
        id: '@',
     },
     template:`<div class="pagination"  ng-show="paginationManager.total > paginationManager.limit">
                  <div class="motor ">
                      <img src="static/images/icons/double-right-arrow.svg" class="rot-180 small-icon" ng-click="paginationManager.decPage()">
                  </div>
                  <div class="page-container" ng-repeat="i in [] | pageRange: (paginationManager)">
                      <input type="radio" ng-model="paginationManager.currentPage" value="{{i}}" id="{{id}}-page-{{i}}">
                      <label class="page-number" for="{{id}}-page-{{i}}"  ng-click="loadPageFunction({page: i })">
                          {{i+1}}
                      </label>
                  </div>
                  <div class="motor">
                      <img src="static/images/icons/double-right-arrow.svg" class="small-icon" ng-click="paginationManager.incPage()">
                  </div>
              </div>`,
     
     replace: true
  };
})

app.directive("coursetable", function(){
  return {
      restrict: 'E',
      transclude: true,
      scope: {
        list : '=',
        flags : '=',
        paginationManager: '=',
        loadPageFunction: '=',
        courseList: '=',
        loadLabelFunction: '=',
        newLabelFunction: '=',
        courseId: '@',
        newCourse: '@'
     },
     template:`
        <div class="course-table" ng-show="!flags.hideCourseList">
            <div class="list-title">
                <div>Course List</div>
                <div class="options">
                    <div class="sort"> 
                        <input type="checkbox" id="sort-by-options-show">
                        <label for="sort-by-options-show">
                            <img class="small-icon" src="static/images/icons/sort.svg"/>
                        </label>
                        <div class="sort-by">
                            <div class="sort-option" ng-repeat="opt in paginationManager.sortByOptions">
                                <input type="radio" ng-change="loadPageFunction({page: 0 })" ng-model="paginationManager.sortBy" id="sort-by-option-{{opt.name}}" value="{{opt.value}}">
                                <label for="sort-by-option-{{opt.name}}" >{{opt.name}}</label>
                            </div>
                        </div>
                    </div>
                    <input id="hide-course-list" ng-model="flags.hideCourseList" type="checkbox"> 
                    <label class='double-arrow-hide rot-180' title="hide course list" for="hide-course-list"><img  src='/static/images/icons/double-right-arrow.png'></label>
                </div>
            </div>
            <ul class="course-list">
                <li  class="course-label new-course" ng-show="newCourse != 'hide'">
                    <input type="radio"  ng-model="list.courseId" name="course-list" ng-click="newLabelFunction()" id='radio-new-course' value="{{undefined}}">
                    <label for="radio-new-course" ng-click="list.isCourseCard = true">
                        <span>Create New Course</span>
                        <div class="arrow" ><img src='static/images/icons/right-arrow.png'></div>
                    </label>
                </li>
                <li class="course-label" ng-repeat="x in courseList">
                    <input type="radio" ng-model="list.courseId"  ng-click="loadLabelFunction()" name="course-list" id="{{x._id}}" value="{{x[courseId]}}" >
                    <label  for="{{x._id}}" ng-click="list.isCourseCard = true" >
                        <span>{{x.title}}</span>
                        <div class="arrow" ><img src='static/images/icons/right-arrow.png'></div>
                    </label>
                </li> 
            </ul>
            <pagination pagination-manager="paginationManager" load-page-function="loadPageFunction" id="course"></pagination>
        </div>`,
        
     replace: true
  };
})

app.directive("moduletable", function(){
  return {
      restrict: 'E',
      transclude: true,
      scope: {
        list : '=',
        flags : '=',
        moduleList: '=',
        loadLabelFunction: '=',
        newLabelFunction: '=',
        newModule : '@'
     },
     template:
  `<div class="module-table" ng-show="!flags.hideModuleList">
        
     <div class="list-title">
         <span>Modules</span>
         <input id="hide-module-list" ng-model="flags.hideModuleList" type="checkbox"> 
         <label class='double-arrow-hide' title="show module list" ng-show="!flags.hideModuleList" for="hide-module-list"><img  src='/static/images/icons/double-right-arrow.png'></label>
     </div>
     <ul class="module-list" >  
         <li class="module-label" ng-show="!(newModule == 'hide')">
             <input type="radio" ng-model="list.moduleId"  ng-click="newLabelFunction()" name="course-module" id="radio-new-module" value="{{undefined}}" >
             <label for="radio-new-module"><span>Create New Module</span></label> 
         </li>
         <li class="module-label" ng-repeat="k in moduleList">
             <input type="radio" ng-model="list.moduleId"  ng-click="loadLabelFunction()" name="course-module" id="{{k._id}}" value="{{k._id}}" >
             <label  for="{{k._id}}"><span>{{k.chapter}}</span></label> 
         </li>       
     </ul>
 </div>`,
        
     replace: true
  };
})

//--------------------------------------------------------------