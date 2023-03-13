const mongoose = require('mongoose')
const mg = require('../manager')
const Course = require('../models/course')

const studentCouresSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: mg.modelNames.Student,
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: mg.modelNames.Course,
        required: true,
    },
    title: {
        type: String
    }
},{
    timestamps: true
})

studentCouresSchema.index({student: 1, course: 1} , {unique: true})

studentCouresSchema.pre('save', async function(next) {
    const sc = this

    const course = await Course.findByIdAndUpdate(sc.course, {$inc: {enrolled: 1}},{new: true, lean: true})
    sc.title = course.title

    next()
})

studentCouresSchema.pre('findOneAndDelete', async function(next){
    await Course.findByIdAndUpdate(this._conditions.course, {$inc: {enrolled: -1}}, {lean: true})
    next()
})

const StudentCourse = mongoose.model(mg.modelNames.StudentCourse, studentCouresSchema)

module.exports = StudentCourse