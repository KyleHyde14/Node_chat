const socket = io('ws://localhost:8000')
const list = document.getElementById('all-msg')
const msgButton = document.getElementById('submit-btn')
const input = document.getElementById('msg-input')
let currentUser;
let isConnected = false;

function userSet(user){
    return user
}

function printMsg(message){
    const elem = document.createElement('li')
    const span = document.createElement('span')
    if(message.user == currentUser){
        elem.classList.add('right')
        span.textContent = `${message.text}`
    }
    else{
        span.textContent = `${message.user}: \n ${message.text}`
    }
    elem.appendChild(span)
    list.appendChild(elem)
}

socket.on('getOldMessages', (data) => {
    if(isConnected != true){
        for(let msg of data){
            printMsg(msg)
        }
        list.scrollTop = list.scrollHeight;
        socket.emit('alreadyConnected')
    }
})

socket.on('stayConnected', () => {
    isConnected = true
})

socket.on('createdMessage', message => {
    printMsg(message)
    list.scrollTop = list.scrollHeight;
})

socket.on('currentUser', username => {
    if(typeof(currentUser) === 'undefined'){
        currentUser = userSet(username)
    }
    currentUser = currentUser
    console.log(currentUser)
})

msgButton.addEventListener('click', () => {
    const message = input.value;
    if (message) {
        socket.emit('newMessage', {message, currentUser});
        input.value = '';
    }
})

document.addEventListener('keydown', (event) => {
    if(event.key == 'Enter'){
        event.preventDefault()
        msgButton.click()
    }
})

window.addEventListener('unload', (event) => {
    event.preventDefault()
    
    window.location.href = ''
})

  