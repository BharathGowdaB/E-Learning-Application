const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../backend/app')
const mongoose = require('mongoose')
const Instructor = require('../backend/models/instructor')
const Course = require('../backend/models/course')
const Module = require('../backend/models/module')

describe("Test Course Routes:" , () => {
    afterAll(async () =>  await  mongoose.disconnect())
    const instructorOneId = new mongoose.Types.ObjectId()
    const courseOneId = new mongoose.Types.ObjectId()
    const moduleOneId = new mongoose.Types.ObjectId()

    const instructorOne = {
        _id : instructorOneId, 
        firstname: 'Bharath',
        email: 'bharath@gmail.com',
        password: '231020',
        tokens: [{
            token : jwt.sign({_id: instructorOneId}, process.env.JWT_SECRET)
        }]
    }

    const courseOne = {
        _id : courseOneId,
        instructor : instructorOneId,
        title: "JS for everyone",
        description: "testing course routes"
    }

    const moduleOne = {
        _id: moduleOneId,
        index: 0,
        chapter: "Intro",
        course: courseOneId,
        content : "Some content"
    }

    beforeEach( async () => {
        await Instructor.deleteMany()
        await new Instructor(instructorOne).save()

        await Course.deleteMany()
        await new Course(courseOne).save()

        await Module.deleteMany()
        await new Module(moduleOne).save()
    })

    test('GET /course/module/id/:moduleId : valid ModuleId', async () =>{
        await request(app)
            .get(`/course/module/id/${moduleOneId}`)
            .expect(200)
            .then(res => {
                expect(res.body.module.chapter).toBe(moduleOne.chapter)
            })
    })

    test('POST /course/:courseId/module', async () =>{

        const moduleTwo = {
            index: 2,
            chapter: "Intro2",
            course: courseOneId,
            content : "Some content 2"
        }
        await request(app)
            .post(`/course/${courseOneId}/module`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send(moduleTwo)
            .expect(201)
            .then(res => {
                expect(res.body.module.chapter).toBe(moduleTwo.chapter)
            })
    })

    test('PATCH /course/:courseId/module/:moduleId', async () =>{
        const newChapter = "new chapter"
        await request(app)
            .patch(`/course/${courseOneId}/module/${moduleOneId}`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send({
                chapter : newChapter
            })
            .expect(200)
            .then(res => {
                expect(res.body.module.chapter).toBe(newChapter)
            })
    })

    test('PATCH /course/:courseId/module/:moduleId : Module Not Found', async () =>{
        const newChapter = "new chapter"
        await request(app)
            .patch(`/course/${courseOneId}/module/${new mongoose.Types.ObjectId()}`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send({
                chapter : newChapter
            })
            .expect(400)

    })

    test('DELETE /course/:courseId/module/:moduleId', async () =>{
        await request(app)
            .delete(`/course/${courseOneId}/module/${moduleOneId}`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .expect(200)
        
        await request(app)
            .get(`/course/module/id/${moduleOneId}`)
            .expect(404)
    })

    test('DELETE /course/:courseId/module/:moduleId : Module Not Found', async () =>{
        await request(app)
            .delete(`/course/${courseOneId}/module/${new mongoose.Types.ObjectId()}`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .expect(400)
        
    })
})