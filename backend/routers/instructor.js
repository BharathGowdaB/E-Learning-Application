const express = require('express')
const res = require('express/lib/response')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const sharp = require('sharp')
const mg = require('../manager')


const auth = require('../middleware/auth.instructor')
const Instructor = require('../models/instructor')
const Course = require('../models/course')

const router = new express.Router()

router.get('/id/:id', async (req, res) => {
    try{
        const _id = req.params.id 
        const instructor = await Instructor.findById(_id)

        if(!instructor) return res.status(404).send(mg.error.noInstructor)

        res.send({ instructor })

    } catch(err){
        res.status(500).send(err)
    }
})

router.get('/id/:id/avatar', async (req, res) => {
    try{
        const instructor = await Instructor.findById(req.params.id)
        if(!instructor || !instructor.avatar) return res.sendFile(mg.defaults.avatar) //res.status(404).send()

        res.set('Content-Type', 'image/png')
        res.send( instructor.avatar)
    } catch(err){
        res.sendFile(mg.defaults.Poster)
    }
})

// GET /instructor/:id/courseList?limit=2&skip=0&sortBy=createdAt:desc
router.get('/id/:id/courseList', async (req, res) => {
    try{
        const instructor = await Instructor.findById(req.params.id)

        if(!instructor) return res.status(404).send(mg.error.noInstructor)

        const sort = {}

        if(req.query.sortBy) {
            const sortByArray = req.query.sortBy.split(';')
            sortByArray.forEach(option => {
                const parts = option.split(':')
                sort[parts[0]] = (parts[1] == 'desc' ? -1 : 1)
            })
        }

        await instructor.populate({path: 'courses', select: '_id title createdAt', options:{
            limit: (parseInt(req.query.limit) > mg.constants.maxLimit ? mg.constants.maxLimit : parseInt(req.query.limit)) || mg.constants.maxLimit,
            skip: parseInt(req.query.skip),
            sort
        }})

        res.send(instructor.courses)


    } catch(err){
        res.status(400).send(err)
    }
})

router.get('/me', auth, async (req, res) => {
    try{
        res.send({instructor: req.instructor})
    } catch(err){
        res.status(400).send(err)
    }
})

// GET /instructor/me/courseList?limit=2&skip=0&sortBy=createdAt:desc&search=
router.get('/me/courseList', auth, async(req, res) => {
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

        await req.instructor.populate({path: 'courses', select: '_id title description instructor poster createdAt', match, options:{
            limit,
            skip,
            sort, 
        }})
        
        const total = await Course.countDocuments({instructor: req.instructor._id})
        res.send({courses: req.instructor.courses, skip, total})

    } catch(err){
        res.status(400).send(err)
    }
})

router.post('/' , async (req, res) => {
    try{
        const instructor = new Instructor(req.body)
        await instructor.save()

        const token = await instructor.generateAuthToken()
        res.status(201).send({instructor, token})

    } catch(err){
        res.status(400).send(err)
    }
})

router.post('/login', async (req, res) => {
    try{
        const instructor = await Instructor.findByCredientials(req.body.email.toLowerCase(), req.body.password)
        const token = await instructor.generateAuthToken()
        res.send({instructor, token})

    } catch(err) {
        res.status(401).send(err)
    }
})

router.post('/logout', auth, async (req, res) => {
    try{
        const instructor = req.instructor
        instructor.tokens = instructor.tokens.filter(ele => ele.token != req.token)
        await instructor.save()

        res.send({instructor})
    } catch(err){
        res.status(400).send(err)
    }
})

router.post('/logoutAll', auth, async (req, res) => {
    try{
        const instructor = req.instructor
        instructor.tokens = []
        await instructor.save()

        res.send({instructor})
    } catch(err){
        res.status(400).send(err)
    }
})

router.patch('/', auth, async (req, res) => {
    try{
        const updates = {}
        const allowedUpdates = ['firstname', 'lastname', 'phone', 'university']

        allowedUpdates.forEach(field => {
            if(req.body[field]) updates[field] = req.body[field]
        })

        const instructor = await Instructor.findByIdAndUpdate(req.instructor._id, updates, {new: true, runValidators: true})
        res.send({instructor})

    } catch(err){
        
        res.status(400).send(err)
    }
})

router.patch('/password', auth, async (req, res) => {
    try{
        if(!req.body.newPassword) throw {error : mg.error.update}
    
        const isMatch = await bcrypt.compare(req.body.oldPassword, req.instructor.password)

        if(!isMatch) throw {error : mg.error.update}

        req.instructor.password = req.body.newPassword
        req.instructor.save()
        res.send({instructor : req.instructor})

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
    if(!req.file) return res.status(400).send()
    try{
        const buffer = await sharp(req.file.buffer).resize({height: mg.constants.avatarSize, width: mg.constants.avatarSize}).png().toBuffer()

        req.instructor.avatar = buffer
        await req.instructor.save()

        res.send({instructor: req.instructor})
    } catch(err){
        res.send(400).send()
    }
})

router.delete('/me/avatar', auth, async(req, res) => {
    try{
        req.instructor.avatar = undefined
        await req.instructor.save()
        res.send({instructor: req.instructor})
    } catch(err){
        res.status(400).send(err)
    }
})


module.exports = router