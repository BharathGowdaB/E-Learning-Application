const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')


const mg = require('./backend/manager')
const app = require(process.env.APP_MODULE || './backend/app')

const port = process.env.PORT

/*
const privateKey  = fs.readFileSync(path.join(mg.cert, 'key.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(mg.cert, 'cert.pem'), 'utf8');
const credentials = {key: privateKey, cert: certificate};

const httpServer = http.createServer(app)
const httpsServer = https.createServer(credentials, app)

httpServer.listen(port,'', () => console.log('listening at :  '+ port));  
httpsServer.listen(443,'', () => console.log('listening at :  '+ 443)); 
*/

app.listen(port,'', () => console.log('listening at :  '+ port));