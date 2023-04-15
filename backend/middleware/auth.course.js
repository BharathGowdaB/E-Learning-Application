const mg = require('../manager')
const jwt = require('jsonwebtoken')

const auth = require('./auth.instructor')
const Course = require('../models/course')

const authCourse = async (req , res, next) => {
    auth( req, res, async () => {
        const instructor = req.instructor

        const course = await Course.findOne({_id: req.params.courseId, instructor: instructor._id})

        if(!course) return res.status(404).send({error: mg.error.noCourse})

        req.course = course
        next()  
    })
}

module.exports = authCourse