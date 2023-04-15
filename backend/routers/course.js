
const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const sharp = require('sharp')
const mg = require('../manager')

const authCourse = require('../middleware/auth.course')
const auth = require('../middleware/auth.instructor')

const Course = require('../models/course')
const Module = require('../models/module')
const StudentCourse = require('../models/student-course')

const router = new express.Router()

router.get('/id/:courseId', async (req, res) => {
    try{
        const course = await Course.findById(req.params.courseId)
                            .populate({path : 'modules' , populate:{ path: '_id'}, select : '_id index chapter course updateaAt', options:{
                                sort:{
                                    index: 1,
                                    updatedAt: -1
                                }
                            }}) 
                            
        if(!course) return res.status(404).send({error: mg.error.noCourse})
        res.send({course})
        
    } catch(err){
        res.status(500).send(err)
    }
})

router.get('/id/:courseId/poster', async (req, res) => {
    try{
        const course = await Course.findById(req.params.courseId)
        if(!course || !course.poster) return res.sendFile(mg.defaults.poster) //res.status(404).send()

        res.set('Content-Type', 'image/png')
        res.send( course.poster)
        
    } catch(err){
        res.sendFile(mg.defaults.poster)
    }
})

// GET: course/search?search=regexp &skip=&sortBy
router.get('/search' , async (req, res) =>{
    try{
        const sort = {}

        if(req.query.sortBy) {
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = (parts[1] == 'desc' ? -1 : 1)
        }

        const skip = parseInt(req.query.skip) || 0
        const limit = req.query.limit && parseInt(req.query.limit) <=  mg.constants.maxLimit ? parseInt(req.query.limit) : mg.constants.maxLimit

        let match = {}

        if(req.query.search){
            match = {
                title : new RegExp(req.query.search, 'i')
            }
        }

        const courses = await Course.find(match ,'',{
            lean: true,
            skip,
            sort,
            limit
        })

        res.send({courses, skip})
    } catch(err){
        res.status(400).send(err)
    }
})

// GET /course/:courseId/studentList?limit=10&skip=0
router.get('/:courseId/studentList', authCourse, async (req, res) => {
    try{
        const sort = {}

        if(req.query.sortBy) {
            const parts = req.query.sortBy.split(':')

            sort[parts[0]] = (parts[1]) == 'desc' ? -1 : 1
        }


        const limit = req.query.limit && parseInt(req.query.limit) <=  mg.constants.maxLimit ? parseInt(req.query.limit) : mg.constants.maxLimit
        const skip = parseInt(req.query.skip)

        const scList = await StudentCourse.find({course: req.course._id}, 'student createdAt', {
            limit,
            skip,
            sort
        }).populate({path: 'student' , select: '_id firstname lastname email phone university'})

        const total = await StudentCourse.countDocuments({course: req.course._id})

        res.send({students: scList, total , skip})

    } catch(err){
        res.status(400).send(err)
    }
})

router.post('/', auth, async (req, res) => {
    try{
        delete req.body._id
        const course = new Course(req.body)
     
        course.instructor = req.instructor._id
        course.enrolled = 0

        await course.save()
 
        res.status(201).send({course})
    } catch(err){
        res.status(400).send(err)
    } 
})

router.patch('/:courseId', authCourse, async (req, res) => {
    try{
        const updates = {}
        const allowedUpdates = ['description']

        allowedUpdates.forEach(field => {
            if(req.body[field]) updates[field] = req.body[field]
        })

        const course = await Course.findByIdAndUpdate(req.params.courseId, updates, {new: true, runValidators: true, lean: true})
        
        res.send({course})
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

router.patch('/:courseId/poster' , authCourse, upload.single('poster') , async(req, res) => {
    if(!req.file) return res.status(400).send()
    try{
        const buffer = await sharp(req.file.buffer).resize({height: mg.constants.posterHeight, width: mg.constants.posterWidth}).png().toBuffer()

        req.course.poster = buffer
        await req.course.save()

        res.send({course: req.course})
    } catch(err){
        res.status(400).send()
    }
})


router.delete('/:courseId/poster', authCourse, async(req, res) => {
    try{
        req.course.poster = undefined

        await req.course.save()
        res.send({course: req.course})
    } catch(err){
        res.status(400).send(err)
    }
})


router.delete('/:courseId', authCourse, async (req, res) => {
    try{
        await StudentCourse.deleteMany({course: req.course._id})
        await req.course.remove()
        res.send({course: req.course})

    } catch(err){
        res.status(400).send(err)
    }
})


//  Module Routers //
router.get('/module/id/:moduleId', async (req, res) => {
    try{
        const module = await Module.findById(req.params.moduleId, '_id chapter content course')
                            .populate({path: 'course', select: '_id title instructor'})

        if(!module) return res.status(404).send({error: mg.error.noModule})
        res.send({module})

    } catch (err) {
        res.status(500).send(err)
    }
})

router.post('/:courseId/module', authCourse, async (req, res) => { 
    try{
        const course = req.course
        const module = await course.createModule(req.body)

        res.status(201).send({module})

    } catch (err) {
        res.status(400).send(err)
    }
})

router.patch('/:courseId/module/:moduleId', authCourse, async (req, res) => {
    try{
        const updates = {}
        const allowedUpdates = ['index', 'chapter', 'content']
        allowedUpdates.forEach(field => {
            if(req.body[field]) updates[field] = req.body[field]
        })

        const course = req.course

        const module = await course.updateModule(req.params.moduleId, updates)

        res.send({module})

    } catch(err){
        res.status(400).send(err)
    }
})

router.delete('/:courseId/module/:moduleId', authCourse, async (req, res) => {
    try{
        const course = req.course

        const module = await course.deleteModule(req.params.moduleId)

        res.send({module})
    } catch(err){
        res.status(400).send(err)
    }
})


module.exports = router