const path = require('path')

const src = path.resolve(path.join(__dirname,'..','src'))
const cert = path.resolve(path.join(__dirname,'..','cert'))

/* Linux System */
//const src = '/home/bharathvishnubharath/E-Learning-MEAN/src';
//const cert = '/home/bharathvishnubharath//E-Learning-MEAN/cert'

module.exports = {
    // Https requires files---
    src, cert,

    // JWt-------------------
    tokenMaxAge : '7 days',
 
    // mongoose models--------
    modelNames :{ 
        Student : 'Student',
        Instructor : 'Instructor',
        Course : 'Course',
        Module : 'Module',
        StudentCourse: 'StudentCourse'
    },

    // error list--------------------
    error : {
        emailPattern : 'Email invalid',
        passwordPattern : 'Password invalid',

        login : 'Unable to login',
        authenticate : 'Authenticate Failed',
        update : 'Invalid Update Fields',
        delete : 'Permission Required',

        noInstructor : 'NO INSTRUCTOR FOUND',
        noCourse : 'NO COURSE FOUND',
        noModule : 'NO MODULE FOUND',

        fileTypeNotSupported: 'File type not supported',
    },

    defaults : {
        avatar :  path.resolve(path.join(src,'static','images','icons','user.png')),
        poster : path.resolve(path.join(src,'static','images','defaultPoster.png')),

    },
    
    constants : {
        maxLimit : 100,
        avatarSize: 250,
        posterWidth : 720,
        posterHeight: 405,
    },
    
    pattern: {
        email : /^.*@.*\..*$/,
        password : /^[0-9a-zA-Z_@#$]{6,}$/,
    },
}