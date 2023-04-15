const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../backend/app')
const mongoose = require('mongoose')
const Instructor = require('../backend/models/instructor')
const Course = require('../backend/models/course')
const Student = require('../backend/models/student')
const StudentCourse = require('../backend/models/student-course')

describe("Test Course Routes:" , () => {
    afterAll(async () =>  await  mongoose.disconnect())
    
    const instructorOneId = new mongoose.Types.ObjectId()
    const courseOneId = new mongoose.Types.ObjectId()
    const studentOneId = new mongoose.Types.ObjectId()
    const studentCourseOneId = new mongoose.Types.ObjectId()

    const instructorOne = {
        _id : instructorOneId, 
        firstname: 'Bharath',
        email: 'bharath@gmail.com',
        password: '231020',
        tokens: [{
            token : jwt.sign({_id: instructorOneId}, process.env.JWT_SECRET)
        }]
    }

    const studentOne = {
        _id : studentOneId, 
        firstname: 'Bharath',
        email: 'bharath2@gmail.com',
        password: '231020',
        tokens: [{
            token : jwt.sign({_id: studentOneId}, process.env.JWT_SECRET)
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

        await Student.deleteMany()
        await new Student(studentOne).save()

        await StudentCourse.deleteMany()
        await new StudentCourse({
            _id: studentCourseOneId,
            student: studentOneId,
            course: courseOneId,
            title: courseOne.title
        }).save()
    })

    test("PATCH /student/addCourse/:courseId", async () => {
        await StudentCourse.deleteMany()
        await request(app)
            .patch(`/student/addCourse/${courseOneId}`)
            .set("Authorization", `Bearer ${studentOne.tokens[0].token}`)
            .expect(200)
            .then(res => {
                expect(res.body.studentCourse.student).toBe(studentOneId.toString())
                expect(res.body.studentCourse.course).toBe(courseOneId.toString())
            })
    })

    test("DELETE /student/removeCourse/:courseId", async () => {
        await request(app)
            .delete(`/student/removeCourse/${courseOneId}`)
            .set("Authorization", `Bearer ${studentOne.tokens[0].token}`)
            .expect(200)
        
        const sc = await StudentCourse.findById(studentCourseOneId)

        expect(sc).toBe(null)
    })

    test('GET /student/enrolled/:courseId', async() => {
        await request(app)
            .get(`/student/enrolled/${courseOneId}`)
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .expect(200)
            .then(res => {
                expect(res.body.student).toBe(studentOneId.toString())
            })
    })
})