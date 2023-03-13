const mongoose = require("mongoose")
const mg = require('../manager')

var moduleSchema = new mongoose.Schema({
    index:     { type : Number, default: 1},
    chapter:   { type : String, required : true, trim: true, minLength: 2 },
    course:    { type :mongoose.Schema.Types.ObjectId, ref : mg.modelNames.Course, required : true },
    content:   { type : String, }
}, {
    timestamps: true,
})

const Module = mongoose.model(mg.modelNames.Module , moduleSchema)

module.exports = Module