const mongoose = require("mongoose")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const mg = require('../manager')

const Schema = mongoose.Schema

const studentSchema = new Schema({
	firstname: 	{ type : String, required : true , trim: true, minLength : 2},
	lastname: 	{ type : String, trim: true },
	email:		{ type : String, trim: true, lowercase: true, unique: true, index: true,
                    validate(value) {
                        if(!validator.isEmail(value)) throw new Error(mg.error.emailPattern)
                    }
                },
    password:   { type: String, minLength: 6},
	phone: 		{ type : Number },
	university: { type : String },
    tokens :    [{
        token : { type : String }
    }],
    avatar:     { type: Buffer}
},{
    toObject:{
        virtuals: true
    },
    toJSON:{
        virtuals: true
    },
    id: false,
})

studentSchema.pre('save', async function(next) {
    const student = this

    if(student.isModified('password')) student.password = await bcrypt.hash(student.password, 8)

    next()
})

studentSchema.virtual('courses', {
    ref: mg.modelNames.StudentCourse,
    localField: '_id',
    foreignField: 'student'
})

studentSchema.methods.toJSON = function(){
    const student = this
    const studentObject = student.toObject()

    delete studentObject.password
    delete studentObject.tokens
    delete studentObject.avatar

    return studentObject
}

studentSchema.statics.findByCredientials = async function(email, password){
    const student = await Student.findOne({email})
    
    if(!student) throw new Error(mg.error.login)
  
    const isMatch = await bcrypt.compare(password, student.password)
    if(!isMatch) throw new Error(mg.error.login)
    return student
}

studentSchema.methods.generateAuthToken = async function(){
    const student = this

    const token = jwt.sign({_id : student._id},  process.env.JWT_SECRET, {expiresIn : mg.tokenMaxAge})
    student.tokens = student.tokens.concat({token})

    await student.save()
    return token
}


const Student = mongoose.model(mg.modelNames.Student, studentSchema)

module.exports = Student