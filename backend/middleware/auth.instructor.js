const mg = require('../manager')
const jwt = require('jsonwebtoken')
const Instructor = require('../models/instructor')

const auth = async (req, res, next) => {
    try{
        if(!req.header('Authorization')) throw new Error()
        
        const token = req.header('Authorization').replace('Bearer ','')
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const instructor = await Instructor.findOne({_id: decoded._id, "tokens.token": token})
        
        if(!instructor) throw new Error()

        req.instructor = instructor
        req.token = token
        next()
        
    } catch(err) {
        //console.log(err)
        res.status(401).send({error: mg.error.authenticate})
    }
}

module.exports = auth