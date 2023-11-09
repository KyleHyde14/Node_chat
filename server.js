const express = require('express')
require('dotenv').config()
const session = require('express-session')
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
      console.log('Connected to database successfully');
    })
    .catch((error) => {
      console.error('Error connecting to database:', error);
    });

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env['SESSION_KEY'],
    resave: false,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    pass: {
        type: String,
        require: true
    }
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
    console.log('User joined the chat');

    socket.on('disconnect', () => {
        console.log(`A user disconected from chat`)
    })

    socket.on('CreateNewMessage', (data) => {

        const newMessage = new Message({
            text: data.text,
            date: new Date().getTime(),
            user: data.user
        })

        newMessage.save().then(() => {
            socket.emit('messageCreated')
        }).catch(err => {
            console.log(err)
        })
    })
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'))
})

app.get('/chat', (req, res) => {
    if (req.session.authenticated){
        res.sendFile(path.join(__dirname, 'public', 'chat.html'))
    } else{
        res.send('You must login to enter the chat')
    }
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
                req.session.authenticated = true
                console.log(`${newUser.name} registered as a new user`)
                res.redirect('/chat')
            }).catch((err) => {
                console.log(err)
                res.redirect('/register')
            })
        }
    })        
})

app.post('/login_user', (req, res) => {

    User.findOne({name:req.body.username}).then(user => {
        if (!user){
            res.send('You have to register first to use this site!')
        } else{
            if (req.body.password === user.pass){
                req.session.authenticated = true
                res.redirect('/chat')
            } else{
                res.send('Wrong password buddy')
            }
        }
    })
})

http.listen(8000, () => {
    console.log('listening at: http://localhost:8000')
})