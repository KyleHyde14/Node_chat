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
    text: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        default: new Date().getTime()
    },
    user: {
        type: String,
        require: true
    }
})

const User = mongoose.model('User', userSchema)
const Message = mongoose.model('Message', msgSchema)

function encodePass(text) {
    let hash = 0;
  
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
    }
  
    return hash.toString();
  }
  

io.on('connection', (socket) => {
    console.log('User joined the chat');

    socket.on('disconnect', () => {
        console.log(`A user disconected from chat`)
    })

    socket.on('CreateNewMessage', (data) => {

        if (!data.user){
            socket.disconnect(true)
        } else {
            const newMessage = new Message({
                text: data.text,
                date: new Date().getTime(),
                user: data.user
            })
    
            newMessage.save().then(() => {
                io.emit('messageCreated', newMessage)
            }).catch(err => {
                console.log(err)
            })
        }
    })
    
    socket.on('getOldMessages', () => {
        const limit = new Date(Date.now() - 24 * 60 * 60 * 1000)
        Message.find({date: {$gte: limit}}).then(messages => {
            socket.emit('messagesReady', messages)
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
                pass: encodePass(password)
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
            if (encodePass(req.body.password) === user.pass){
                req.session.authenticated = true
                res.redirect('/chat')
            } else{
                res.send('Wrong password buddy')
            }
        }
    })
})

app.get('/logout', (req, res) => {
    if(req.session.authenticated){
        req.session.authenticated = false
        res.sendFile(path.join(__dirname, 'public', 'logout.html'))
    } else{
        res.redirect('/')
    }
})

app.get('/my_messages/:user', (req,res) => {
    let check = req.params['user']
    if(req.session.authenticated){
        if(check == 'all'){
            Message.find().select('-_id -__v').then(found => {
                res.json(found)
            }).catch(err => {
                console.log(err)
            })
        } else if(check != 'all'){
            Message.find({'user': check}).select('-_id -__v').then(found => {
                res.json(found)
            }).catch(err => {
                console.log(err)
            })
        }
    } else {
        req.session.authenticated = false
        res.redirect('/')
    }
})

http.listen(8000, () => {
    console.log('listening at: http://localhost:8000')
})