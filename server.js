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
let newUser;

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
app.use(bodyParser.urlencoded({ extended: false }));
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

function obtainMgs(){
    const oneDayAgo = (Date.now() - (24 * 60 * 60 * 1000))
    const dateArray = Message.find({
        date: {$gte: oneDayAgo}
    }).exec()
    return dateArray
}

function encodePassword(password) {
    let encodedPassword = '';
  
    for (let i = 0; i < password.length; i++) {
      let char = password[i];
  
      // Verifica si el carácter está en el rango de letras mayúsculas o minúsculas o números
      if (/[A-Za-z0-9]/.test(char)) {
        let charCode = password.charCodeAt(i);
        let offset;
  
        if (/[A-Za-z]/.test(char)) {
          offset = char <= 'Z' ? 65 : 97;
        } else {
          offset = 48;
        }
  
        let encodedCharCode = (charCode - offset + 13) % 26 + offset;
        char = String.fromCharCode(encodedCharCode);
      }
  
      encodedPassword += char;
    }
  
    return encodedPassword;
  }
  

io.on('connection', (socket) => {
    console.log('usuario conectado')
    
    if(newUser){
        io.emit('currentUser', newUser.name)
        obtainMgs().then( arr => {
            if(arr.length >= 0){
                io.emit('getOldMessages', arr)
            }
        }).catch(err => {console.log(err)})
    }

    socket.on('alreadyConnected', () => {
        io.emit('stayConnected')
    })

    socket.on('newMessage', (data) => {
        const newMessage = new Message({
            text: data.message,
            user: data.currentUser
        })
        newMessage.save().then(() => {
            io.emit('createdMessage', newMessage)
        }).catch(err => {
            console.log(err)
        })
    })

    socket.on('disconnect', () => {
        console.log(`usuario desconectado`)
    })
})

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'))
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.post('/new_user', (req, res) => {
    const username = req.body.username.toLowerCase()
    const password = req.body.password
    User.findOne({name: username}).exec().then(found => {
        if(found != null){
            if(found.pass === encodePassword(password)){
                newUser = found
            } else{ res.send('Thats not the password. Try again.')}
        }else{
            newUser = new User({
                name: username,
                pass: encodePassword(password)
            })
            newUser.save().then(() => {
            })
        }
        res.redirect('/chat')
    }).catch(err => {console.log(err)})
})

http.listen(8000, () => {
    console.log('listening at: http://localhost:8000')
})