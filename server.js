const express = require('express')
require('dotenv').config()
const app = express()
const path = require('path')
const http = require('http').createServer(app)
const mongoose = require('mongoose')
const URI = process.env['MONGO_URI']
const bodyParser = require('body-parser')
const io = require('socket.io')(http, {
    cors: {
        origin:'*'
    }
})

mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      console.log('Conexión exitosa a la base de datos');
    })
    .catch((error) => {
      console.error('Error al conectar a la base de datos:', error);
    });

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const userSchema = new mongoose.Schema({
    name: {type: String},
    pass: {type: String}
})

const msgSchema = new mongoose.Schema({
    text: {type: String},
    date: {
        type: Date,
        default: new Date().getTime()
    },
    user: {type: String}
})

const User = mongoose.model('User', userSchema)
const Message = mongoose.model('Message', msgSchema)
  

io.on('connection', (socket) => {
    console.log('usuario conectado')

    socket.on('disconnect', () => {
        console.log(`usuario desconectado`)
    })
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'))
})

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'))
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'))
})

app.post('/register_user', (req, res) => {
    const password = req.body.password1
    const username = req.body.username

    User.findOne({name:username}).then(found => {
        if (found){
            console.log(found)
            res.status(409).send('Username already in use')
        } else {
            const newUser = new User({
                name: username, 
                pass: password
            })
            
            newUser.save().then(() => {
                console.log(`${newUser.name} registered as a new user`)
                res.redirect('/chat')
            }).catch((err) => {
                console.log(err)
                res.redirect('/register')
            })
        }
    })        
})

http.listen(8000, () => {
    console.log('listening at: http://localhost:8000')
})