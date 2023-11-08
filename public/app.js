const socket = io()
const messages_list = document.getElementById('messages')
const submit = document.getElementById('send_button')
const message_box = document.getElementById('message_box')

submit.addEventListener('click', (event) => {
    event.preventDefault()

    socket.emit('CreateNewMessage', message_box.value)

    let newMessage = document.createElement('li')
    newMessage.innerHTML = message_box.value
    messages_list.appendChild(newMessage)
    message_box.value = ''

})

console.log(sessionStorage.getItem('user'))
