const express = require('express')
const res = require('express/lib/response')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const sharp = require('sharp')
const mg = require('../manager')

const auth = require('../middleware/auth.student')

const Student = require('../models/student')
const StudentCourse = require('../models/student-course')

const router = new express.Router()

router.get('/id/:id/avatar', async (req, res) => {
    try{
        const student = await Student.findById(req.params.id)
        if(!student || !student.avatar) throw new Error("No Avatar")

        res.set('Content-Type', 'image/png')
        res.send( student.avatar)
    } catch(err){
        res.sendFile(mg.defaults.avatar)
    }
})


router.get('/me', auth, async (req, res) => {
    try{
        res.send({student : req.student})
    } catch(err){
        res.status(500).send(err)
    }
})

router.get('/enrolled/:courseId', auth , async(req, res) => {
    try{
        const sc = await StudentCourse.findOne({student: req.student._id , course: req.params.courseId})
    
        if(!sc) throw new Error()

        res.send(sc)
    } catch(err){
        res.status(404).send(err)
    }
})

// GET /student/me/courseList?limit=2&skip=0&sortBy=createdAt:desc
router.get('/me/courseList', auth, async (req, res) => {
    try{
        const sort = {}

        if(req.query.sortBy) {
            const sortByArray = req.query.sortBy.split(';')
            sortByArray.forEach(option => {
                const parts = option.split(':')
                sort[parts[0]] = (parts[1] == 'desc' ? -1 : 1)
            })
        }

        let match

        if(req.query.search){
            match = {
                title : new RegExp(req.query.search, 'i')
            }
        }

        const limit = req.query.limit && parseInt(req.query.limit) <=  mg.constants.maxLimit ? parseInt(req.query.limit) : mg.constants.maxLimit
        const skip = parseInt(req.query.skip) || 0

        await req.student.populate({path: 'courses', select: '_id course title createdAt', match, options:{
            limit,
            skip,
            sort, 
        }})
        
        const total = await StudentCourse.countDocuments({student: req.student._id})
        res.send({courses: req.student.courses, skip, total})

    } catch(err){
        res.status(400).send(err)
    }
})

router.post('/' , async (req, res) => {
    try{
        const student = new Student(req.body)
        await student.save()

        const token = await student.generateAuthToken()
        res.status(201).send({student, token})

    } catch(err){
        res.status(400).send(err)
    }
})

router.post('/login', async (req, res) => {
    try{
        // console.log("login")
        const student = await Student.findByCredientials(req.body.email.toLowerCase(), req.body.password)
        const token = await student.generateAuthToken()

        res.send({student, token})

    } catch(err) {
        res.status(401).send(err)
    }
})

router.post('/logout', auth, async (req, res) => {
    try{
        const student = req.student
        student.tokens = student.tokens.filter(ele => ele.token != req.token)
        await student.save()

        res.send({student})
    } catch(err){
        res.status(400).send(err)
    }
})

router.post('/logoutAll', auth, async (req, res) => {
    try{
        const student = req.student
        student.tokens = []
        await student.save()

        res.send({student})
    } catch(err){
        res.status(400).send(err)
    }
})

router.patch('/', auth, async (req, res) => {
    try{
        const updates = {}
        const allowedUpdates = ['firstname', 'lastname', 'password', 'phone', 'university']
        allowedUpdates.forEach(field => {
            if(req.body[field]) updates[field] = req.body[field]
        })

        const student = await Student.findByIdAndUpdate(req.student._id, updates, {new: true, runValidators: true, lean:true})
        res.send({student})

    } catch(err){
        res.status(400).send(err)
    }
})

router.patch('/password', auth, async (req, res) => {
    try{
        if(!req.body.newPassword) throw {error : mg.error.update}
    
        const isMatch = await bcrypt.compare(req.body.oldPassword, req.student.password)

        if(!isMatch) throw {error : mg.error.update}

        req.student.password = req.body.newPassword
        await req.student.save()
        res.send({student : req.student})

    } catch(err){
        res.status(400).send(err)
    }
})


const upload = multer({
    limits: {
        fileSize: 1000000,    
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/)) return cb(new Error(mg.error.fileTypeNotSupported))
        cb(null, true)
    }
})

router.patch('/me/avatar' , auth, upload.single('avatar') , async(req, res) => {
    
    try{
        if(!req.file) throw {error: 'No file uploaded'}
        const buffer = await sharp(req.file.buffer).resize({height: mg.constants.avatarSize, width: mg.constants.avatarSize}).png().toBuffer()

        req.student.avatar = buffer
        await req.student.save()

        res.send({student: req.student})
    } catch(err){
        res.status(400).send(err)
    }
})

router.patch('/addCourse/:courseId', auth, async (req, res) => {
    try{
        const sc = new StudentCourse({
            student: req.student._id, course: req.params.courseId})
        await sc.save()

        res.send({studentCourse:sc})

    } catch (err){
        console.log(err)
        res.status(400).send(err)
    }
})

router.delete('/removeCourse/:courseId', auth, async (req, res) => {
    try{
        const sc = await StudentCourse.findOneAndDelete({
                student: req.student._id, course: req.params.courseId})
        
        res.send({sc})
    } catch (err){
        res.status(400).send(err)
    }
})

router.delete('/me/avatar', auth, async(req, res) => {
    try{
        req.student.avatar = undefined
        await req.student.save()
        res.send({student: req.student})
    } catch(err){
        res.status(400).send(err)
    }
})

module.exports = router