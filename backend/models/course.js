const mongoose = require("mongoose")
const mg = require('../manager')
const Module = require("./module")
// const StudentCourse = require('./student-course')

var courseSchema = new mongoose.Schema({
    title:      { type : String, required : true, unique : true, index: true },
    description:{ type : String, required: true},
    poster:     { type : Buffer },
    instructor: { type : mongoose.Schema.Types.ObjectId, ref : mg.modelNames.Instructor, required : true },
    enrolled:   { type: Number, default: 0 }
},{
    toObject:{
        virtuals: true
    },
    toJSON:{
        virtuals: true
    },
    id: false,
    timestamps: true
})

courseSchema.pre('remove', async function(next) {
    const course = this
    await Module.deleteMany({course: course._id})
    next()
})

courseSchema.methods.toJSON = function() {
    const course = this
    const courseObject = course.toObject()

    delete courseObject.poster
    return courseObject
}

courseSchema.virtual('modules', {
    ref: mg.modelNames.Module,
    localField: '_id',
    foreignField: 'course'
})

courseSchema.virtual('students', {
    ref: mg.modelNames.StudentCourse,
    localField: '_id',
    foreignField: 'course'
})

courseSchema.methods.createModule = async function(data){
    const course = this
    data.course = course._id
    data.index = (await Module.countDocuments({course: course._id}) + 1)

    const module = new Module(data)
    
    await module.save()
    return module 
}

courseSchema.methods.updateModule = async function(moduleId, data){
    const course = this
    const module = await Module.findOneAndUpdate({_id: moduleId, course: course._id }, data, {new: true, runValidators: true ,lean:true})

    if(!module) throw {error: mg.error.noModule}

    return module
}

courseSchema.methods.deleteModule = async function(moduleId) {
    const course = this
    const module = await Module.findOneAndDelete({_id : moduleId, course: course._id},{new: true, lean: true})

    if(!module) throw {error: mg.error.noModule}
    return module
}


const Course = mongoose.model(mg.modelNames.Course, courseSchema)

module.exports = Course