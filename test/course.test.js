const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../backend/app')
const mongoose = require('mongoose')
const Instructor = require('../backend/models/instructor')
const Course = require('../backend/models/course')
const mg = require('../backend/manager')

describe("Test Course Routes:" , () => {
    afterAll(async () =>  await  mongoose.disconnect())
    const instructorOneId = new mongoose.Types.ObjectId()
    const courseOneId = new mongoose.Types.ObjectId()

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

    beforeEach( async () => {
        await Instructor.deleteMany()
        await new Instructor(instructorOne).save()

        await Course.deleteMany()
        await new Course(courseOne).save()
    })

    test('GET /course/id/:courseId : valid CourseId', async () =>{
        await request(app)
            .get(`/course/id/${courseOneId}`)
            .expect(200)
            .then(res => {
                expect(res.body.course.title).toBe(courseOne.title)
            })
    })

    test('GET /course/id/:courseId :invalid CoursId', async () =>{
        await request(app)
            .get(`/course/id/${new mongoose.Types.ObjectId()}`)
            .expect(404)
    })

    test('GET /course/:courseId/studentList', async () =>{
        await request(app)
            .get(`/course/${courseOneId}/studentList?sortBy=createdAt:desc`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .expect(200)
            .then(res => {
                expect(res.body.total).toBe(0)
            })
    })

    test('POST /course/', async () =>{

        const courseTwo = {
            title: "JS2 for everyone",
            description: "testing course routes"
        }
        await request(app)
            .post(`/course/`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send(courseTwo)
            .expect(201)
            .then(res => {
                expect(res.body.course.title).toBe(courseTwo.title)
            })
    })

    test('PATCH /course/:courseId', async () =>{
        const newDescription = "new Description"
        await request(app)
            .patch(`/course/${courseOneId}`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send({
                description : newDescription
            })
            .expect(200)
            .then(res => {
                expect(res.body.course.description).toBe(newDescription)
            })
    })

    test('PATCH /course/:courseId :error if course not found', async () =>{
        const newDescription = "new Description 2"
        await request(app)
            .patch(`/course/${new mongoose.Types.ObjectId()}`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send({
                newDescription
            })
            .expect(404)
    })


    test('DELETE /course/:courseId', async () =>{

        await request(app)
            .delete(`/course/${courseOneId}`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .expect(200)
        
        await request(app)
            .get(`/course/id/${courseOneId}`)
            .expect(404)
    })

    test('GET /course/search ', async () =>{
        await request(app)
            .get(`/course/search?search=${courseOne.title}&sortBy=createdAt:desc`)
            .expect(200)
            .then(res => {
                expect(res.body.courses[0].title).toBe(courseOne.title)
            })
    })
    
    test('GET /course/id/:courseId/poster', async () =>{
        await request(app)
            .get(`/course/id/${courseOneId}/poster`)
            .expect(200)            
    })
    
    test('PATCH /course/:courseId/poster', async () =>{
        await request(app)
            .patch(`/course/${courseOneId}/poster`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .attach("poster", mg.defaults.poster)
            .expect(200)            

    })

    test('DELETE /course/:courseId/poster', async () =>{
        await request(app)
            .delete(`/course/${courseOneId}/poster`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .expect(200)
            .then(res => {
                expect(res.body.course.poster).toBe(undefined)
            })
    })
})

