const mongoose = require('mongoose');

const uri = process.env.MONGODB_URL
const databaseName = process.env.DATABASE_NAME


mongoose.connect(uri, { 
   useNewUrlParser: true, 
   useUnifiedTopology: true,
   dbName: databaseName 
},(err) => {
   if(err){
      new Error('Unable to connect to Database')
   }
});


module.exports = mongoose

