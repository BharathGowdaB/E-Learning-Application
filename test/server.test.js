const request = require('supertest')
const app = require('../backend/app')
const mongoose = require('mongoose')

afterAll(async () =>  await  mongoose.disconnect())

test ('Is server running', async () => {
    await request(app).get('/').send().expect(200)
})

test ('Is Database Connected', async () => {
    await mongoose.connection.asPromise()
    expect(mongoose.connection.readyState).toBe(1)
})
