const socket = io()
const messages_list = document.getElementById('messages')
const submit = document.getElementById('send_button')
const message_box = document.getElementById('message_box')

socket.on('messageCreated', () => {
    console.log('Message created in database')
})

let currentUser = sessionStorage.getItem('user')

submit.addEventListener('click', (event) => {
    event.preventDefault()

    let data = {
        text: message_box.value,
        user: currentUser
    }

    socket.emit('CreateNewMessage', data)
    

    let newMessage = document.createElement('li')
    newMessage.innerHTML = currentUser + ': ' + message_box.value
    messages_list.appendChild(newMessage)
    message_box.value = ''

})

