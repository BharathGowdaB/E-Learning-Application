const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../backend/app')
const mongoose = require('mongoose')
const Instructor = require('../backend/models/instructor')

afterAll(async () =>  await  mongoose.disconnect())
const instructorOneId = new mongoose.Types.ObjectId()
const instructorOne = {
    _id : instructorOneId, 
    firstname: 'Bharath',
    email: 'bharath@gmail.com',
    password: '231020',
    tokens: [{
        token : jwt.sign({_id: instructorOneId}, process.env.JWT_SECRET)
    }]
}

beforeEach( async () => {
    await Instructor.deleteMany()
    await new Instructor(instructorOne).save()
})

test ('POST /instructor :Create new Instructor', async () =>{
    const instructor = {
        firstname: 'Bharath',
        email: 'bharath2@gmail.com',
        password: '231020'
    }

    await request(app)
        .post('/instructor/')
        .send(instructor)
        .expect(201)
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

test ('POST /instructor/login :Check for login using wrong credentials', async() => {
    instructorOne.password = '4334wrong'
    await request(app)
        .post('/instructor/login')
        .send(instructorOne)
        .expect(401)
})


test('GET /instructor/me :Get instructor details if authorized', async() => {
   await request(app)
        .get('/instructor/me')
        .set('Authorization', `Bearer ${instructorOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('GET /instructor/me :Donot get details if not authorized', async() => {
    await request(app)
         .get('/instructor/me')
         .send()
         .expect(401)
 })