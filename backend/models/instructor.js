const mongoose = require("mongoose")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const mg = require('../manager')

const Schema = mongoose.Schema

const instructorSchema = new Schema({
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
    avatar:     { type: Buffer }
},{
    toObject:{
        virtuals: true
    },
    toJSON:{
        virtuals: true
    },
    id: false,
})

instructorSchema.pre('save', async function(next) {
    const instructor = this

    if(instructor.isModified('password')) instructor.password = await bcrypt.hash(instructor.password, 8)

    next()
})

instructorSchema.virtual('courses',  {
    ref: mg.modelNames.Course,
    localField: '_id',
    foreignField: 'instructor'
})

instructorSchema.methods.toJSON = function(){
    const instructor = this
    const instructorObject = instructor.toObject()

    delete instructorObject.password
    delete instructorObject.tokens
    delete instructorObject.avatar

    return instructorObject
}

instructorSchema.statics.findByCredientials = async function(email, password){
    const instructor = await Instructor.findOne({email})
    
    if(!instructor) throw {error: mg.error.login}
    
    const isMatch = await bcrypt.compare(password, instructor.password)

    if(!isMatch) throw {error: mg.error.login}
    return instructor
}

instructorSchema.methods.generateAuthToken = async function(){
    const instructor = this

    const token = jwt.sign({_id : instructor._id},  process.env.JWT_SECRET, {expiresIn : mg.tokenMaxAge})
    instructor.tokens = instructor.tokens.concat({token})

    await instructor.save()
    return token
}


const Instructor = mongoose.model(mg.modelNames.Instructor, instructorSchema);

module.exports = Instructor