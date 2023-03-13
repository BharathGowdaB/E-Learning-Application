const express = require('express');
const mg = require('./manager')
const cors = require('cors')
const mongoose = require('./mongodb')

const app = new express();

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(mg.src))
app.use(cors())

const instructor = require('./routers/instructor')
const course = require('./routers/course')
const student = require('./routers/student')

app.use('/student' , student)
app.use('/instructor', instructor)
app.use('/course' , course)


module.exports = app