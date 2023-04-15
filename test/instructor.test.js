const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../backend/app')
const mongoose = require('mongoose')
const Instructor = require('../backend/models/instructor')
const Course = require('../backend/models/course')
const mg = require('../backend/manager')

describe("Test Instructor Routes:", () => {
    afterAll(async () =>  await  mongoose.disconnect())
    const instructorOneId = new mongoose.Types.ObjectId()
    const instructorOne = {
        _id : instructorOneId, 
        firstname: 'Bharath',
        email: 'bharath@gmail.com',
        password: '231020',
        tokens: [{
            token : jwt.sign({_id: instructorOneId}, process.env.JWT_SECRET)
        },{
            token : jwt.sign({_id: instructorOneId + '1'}, process.env.JWT_SECRET)
        }]
    }

    beforeEach( async () => {
        await Instructor.deleteMany()
        await new Instructor(instructorOne).save()
    })

    test('POST /instructor :Create new Instructor', async () =>{
        const instructor = {
            firstname: 'Created New User',
            email: 'bharath2@gmail.com',
            password: '231020'
        }

        await request(app)
            .post('/instructor/')
            .send(instructor)
            .expect(201)
            
        const [details] = await Instructor.find({email: instructor.email})
        expect(details.firstname).toBe(instructor.firstname)
    })

    test ('POST /instructor :Check for duplicate email', async () =>{
        const instructor = {
            firstname: 'Bharath',
            email: 'bharath@gmail.com',
            password: '231020'
        }

        await request(app)
            .post('/instructor/')
            .send(instructor)
            .expect(400)
    })

    test ('POST /instructor :Check for invalid email', async () =>{
        const instructor = {
            firstname: 'Bharath',
            email: 'invalid-gmail.com',
            password: '231020'
        }
    
        await request(app)
            .post('/instructor/')
            .send(instructor)
            .expect(400)
    })

    test ('POST /instructor :Check for Password Validation', async () =>{
        const instructor = {
            firstname: 'Bharath',
            email: 'bharath2@gmail.com',
            password: '2310'
        }

        await request(app)
            .post('/instructor/')
            .send(instructor)
            .expect(400)
    })

    test ('POST /instructor/login :Check for login', async() => {
        await request(app)
            .post('/instructor/login')
            .send(instructorOne)
            .expect(200)
    })

    test ('POST /instructor/login :Check for login using wrong credentials , password', async() => {
        const tempInstructor = {
            ...instructorOne
        }
        tempInstructor.password = "wrong password"
        await request(app)
            .post('/instructor/login')
            .send(tempInstructor)
            .expect(401)
    })

    test ('POST /instructor/login :Check for login using wrong credentials , email', async() => {
        const tempInstructor = {
            ...instructorOne
        }
        tempInstructor.email = "wrong email"
        await request(app)
            .post('/instructor/login')
            .send(tempInstructor)
            .expect(401)
    })


    test('GET /instructor/me :Get instructor details if authorized', async() => {
    await request(app)
            .get('/instructor/me')
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send()
            .expect(200)
    })

    test('GET /instructor/me :Donot get details if not authorized : Instructor Not Found', async() => {
        await Instructor.deleteMany()
        await request(app)
            .get('/instructor/me')
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send()
            .expect(401)
    })

    test('GET /instructor/me :Donot get details if not authorized : invalid token', async() => {
        await request(app)
            .get('/instructor/me')
            .send()
            .expect(401)
    })

    test("GET /instructor/me/courseList ", async() => {
        await Course({
            _id: new mongoose.Types.ObjectId(),
            title: 'get coures test',
            description: "get course test",
            instructor: instructorOneId
        }).save()

        await request(app)
            .get(`/instructor/me/courseList?sortBy=createdAt:desc`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .expect(200)
            .then(res => {
                expect(res.body.total).toBe(1)
            })
        await Course.deleteMany()
    })

    test('Patch /instructor :Update Instructor Details', async() => {
        await request(app)
            .patch('/instructor/')
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send({
                firstname: "Yashu"
            })
            .expect(200)

        const instructor = await Instructor.findById(instructorOneId)
        expect(instructor.firstname).toBe("Yashu")
    })

    test('Patch /instructor/password :Update Instructor Password', async() => {
        const newPassword = "newPassword";
        const [oldDetails] = await Instructor.find({email: instructorOne.email})

        await request(app)
            .patch('/instructor/password')
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send({
                newPassword,
                oldPassword: instructorOne.password
            })
            .expect(200)
        
        const [newDetails] = await Instructor.find({email: instructorOne.email})
        expect(newDetails.password).not.toBe(oldDetails.password)
    })

    test('Post /insturctor/logout :Logout from a devices', async() => {
        await request(app)
            .post('/instructor/logout')
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .expect(200)
        
        const instructor = await Instructor.findById(instructorOneId)
        expect(instructor.tokens.length).toBe(1)
    });

    test('Post /insturctor/logoutAll :Logout from all devices', async() => {
        await request(app)
            .post('/instructor/logoutAll')
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .send()
            .expect(200)
        
        const instructor = await Instructor.findById(instructorOneId)
        expect(instructor.tokens.length).toBe(0)
    });
   

    test("GET /instructor/id/:id", async() => {
        await request(app)
            .get(`/instructor/id/${instructorOneId}`)
            .expect(200)
            .then(res => {
                expect(res.body.instructor.firstname).toBe(instructorOne.firstname)
            })
    })

    test("GET /instructor/id/:id : Instructor Not Found", async() => {
        await request(app)
            .get(`/instructor/id/${new mongoose.Types.ObjectId()}`)
            .expect(404)
    })

    test("GET /instructor/id/:id/avatar ", async() => {
        await request(app)
            .get(`/instructor/id/${instructorOneId}/avatar`)
            .expect(200)
    })

    test("GET /instructor/id/:id/courseList ", async() => {
        await Course({
            _id: new mongoose.Types.ObjectId(),
            title: 'get coures test',
            description: "get course test",
            instructor: instructorOneId
        }).save()
        await request(app)
            .get(`/instructor/id/${instructorOneId}/courseList?sortBy=createdAt:desc`)
            .expect(200)
            .then(res => {
                expect(res.body.total).toBe(1)
            })
        await Course.deleteMany()
    })

    test('PATCH /instructor/me/avatar', async () =>{
        await request(app)
            .patch(`/instructor/me/avatar`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .attach("avatar", mg.defaults.avatar)
            .expect(200)            

    })

    test('DELETE /instructor/me/avatar', async () =>{
        await request(app)
            .delete(`/instructor/me/avatar`)
            .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
            .expect(200)
            .then(res => {
                expect(res.body.instructor.avatar).toBe(undefined)
            })
    })
})

