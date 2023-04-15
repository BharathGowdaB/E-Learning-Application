const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../backend/app')
const mongoose = require('mongoose')
const Student = require('../backend/models/student')
const mg = require('../backend/manager')

describe("Test Student Routes", () => {
    afterAll(async () =>  await  mongoose.disconnect())

    const studentOneId = new mongoose.Types.ObjectId()
    const studentOne = {
        _id : studentOneId, 
        firstname: 'Bharath',
        email: 'bharath@gmail.com',
        password: '231020',
        tokens: [{
            token : jwt.sign({_id: studentOneId}, process.env.JWT_SECRET)
        },{
            token : jwt.sign({_id: studentOneId + '1'}, process.env.JWT_SECRET)
        }]
    }

    beforeEach( async () => {
        await Student.deleteMany()
        await new Student(studentOne).save()
    })

    test ('POST /student :Create new Student', async () =>{
        const student = {
            firstname: 'Created New User',
            email: 'bharath2@gmail.com',
            password: '231020'
        }

        await request(app)
            .post('/student/')
            .send(student)
            .expect(201)
            
        const [details] = await Student.find({email: student.email})
        expect(details.firstname).toBe(student.firstname)
        expect(details.email).toBe(student.email)
    })

    test ('POST /student :Check for duplicate email', async () =>{
        const student = {
            firstname: 'Bharath',
            email: 'bharath@gmail.com',
            password: '231020'
        }

        await request(app)
            .post('/student/')
            .send(student)
            .expect(400)
    })

    test ('POST /student :Check for invalid email', async () =>{
        const student = {
            firstname: 'Bharath',
            email: 'invalid-gmail.com',
            password: '231020'
        }

        await request(app)
            .post('/student/')
            .send(student)
            .expect(400)
    })

    test ('POST /student :Check for Password Validation', async () =>{
        const student = {
            firstname: 'Bharath',
            email: 'bharath2@gmail.com',
            password: '2310'
        }

        await request(app)
            .post('/student/')
            .send(student)
            .expect(400)
    })

    test ('POST /student/login :Check for login', async() => {
        await request(app)
            .post('/student/login')
            .send(studentOne)
            .expect(200)
    })

    test ('POST /student/login :Check for login using wrong credentials, password', async() => {
        const tempStudent = {
            ...studentOne
        }
        tempStudent.password = "wrong password"
        await request(app)
            .post('/student/login')
            .send(tempStudent)
            .expect(401)
    })

    test ('POST /student/login :Check for login using wrong credentials , email', async() => {
        const tempStudent = {
            ...studentOne
        }
        tempStudent.email = "wrong email"
        await request(app)
            .post('/student/login')
            .send(tempStudent)
            .expect(401)
    })


    test('GET /student/me :Get student details if authorized', async() => {
    await request(app)
            .get('/student/me')
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .send()
            .expect(200)
    })

    test('GET /student/me :Donot get details if not authorized', async() => {
        await request(app)
            .get('/student/me')
            .send()
            .expect(401)
    })

    test('GET /student/me :Donot get details if not authorized : Student Not Found', async() => {
        await Student.deleteMany()
        await request(app)
            .get('/student/me')
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .send()
            .expect(401)
    })


    test('Patch /student :Update Student Details', async() => {
        await request(app)
            .patch('/student/')
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .send({
                firstname: "Yashu"
            })
            .expect(200)

        const student = await Student.findById(studentOneId)
        expect(student.firstname).toBe("Yashu")
    })

    test('Patch /student/password :Update Student Password', async() => {
        const newPassword = "newPassword";
        const [oldDetails] = await Student.find({email: studentOne.email})
        await request(app)
            .patch('/student/password')
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .send({
                newPassword,
                oldPassword: studentOne.password
            })
            .expect(200)
        
        const [newDetails] = await Student.find({email: studentOne.email})

        expect(newDetails.password).not.toBe(oldDetails.password)
    })

    test('Post /student/logout :Logout from a devices', async() => {
        await request(app)
            .post('/student/logout')
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .send()
            .expect(200)
        
        const student = await Student.findById(studentOneId)
        expect(student.tokens.length).toBe(1)
    });


    test('Post /student/logoutAll :Logout from all devices', async() => {
        await request(app)
            .post('/student/logoutAll')
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .send()
            .expect(200)
        
        const student = await Student.findById(studentOneId)
        expect(student.tokens.length).toBe(0)
    });


    test("Get /student/me/courseList : get student enrolled courses", async() => {
        await request(app)
            .get('/student/me/courseList')
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .send()
            .expect(200)
            .then(res => {
                expect(res.body.courses.length).toBe(0)
            })

    })

    test("GET /student/id/:id/avatar ", async() => {
        await request(app)
            .get(`/student/id/${studentOneId}/avatar`)
            .expect(200)
    })

    test('PATCH /student/me/avatar', async () =>{
        await request(app)
            .patch(`/student/me/avatar`)
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .attach("avatar", mg.defaults.avatar)
            .expect(200)            

    })

    test('DELETE /student/me/avatar', async () =>{
        await request(app)
            .delete(`/student/me/avatar`)
            .set('Authorization', `Bearer ${studentOne.tokens[0].token}`)
            .expect(200)
            .then(res => {
                expect(res.body.student.avatar).toBe(undefined)
            })
    })


})