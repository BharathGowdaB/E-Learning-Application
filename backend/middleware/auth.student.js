const mg = require('../manager')
const jwt = require('jsonwebtoken')
const Student = require('../models/student')

const auth = async (req, res, next) => {
    try{
        if(!req.header('Authorization')) throw new Error(req.header('Authorization'))
        
        const token = req.header('Authorization').replace('Bearer ','')
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const student = await Student.findOne({_id: decoded._id, "tokens.token": token})
        
        if(!student) throw new Error()
        
        req.student = student
        req.token = token
        next()
        
    } catch(err) {
        console.log(err)
        res.status(401).send({error: mg.error.authenticate})
    }
}

module.exports = auth