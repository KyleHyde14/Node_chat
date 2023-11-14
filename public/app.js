const socket = io()
const messages_list = document.getElementById('messages')
const submit = document.getElementById('send_button')
const message_box = document.getElementById('message_box')
const logout_button = document.getElementById('logout_button')
const my_messages = document.getElementById('my_messages')

let currentUser = sessionStorage.getItem('user')

if(!currentUser){
    window.location.href = '/'
}

socket.emit('getOldMessages')

socket.on('messagesReady', messages => {
    messages.forEach(elem =>  {
        if (elem.user == currentUser){
            let newMessage = document.createElement('li')
            newMessage.className += 'right'
            newMessage.innerHTML = elem.text
            messages_list.appendChild(newMessage)
        } else {
            let newMessage = document.createElement('li')
            newMessage.className += 'left'
            newMessage.innerHTML = elem.user + ': ' + elem.text
            messages_list.appendChild(newMessage)
        }
    })
})

socket.on('messageCreated', recent_message => {

        if (recent_message.user == currentUser){
            let newMessage = document.createElement('li')
            newMessage.className += 'right'
            newMessage.innerHTML = recent_message.text
            messages_list.appendChild(newMessage)
        } else {
            let newMessage = document.createElement('li')
            newMessage.className += 'left'
            newMessage.innerHTML = recent_message.user + ': ' + recent_message.text
            messages_list.appendChild(newMessage)
        }

        messages_list.scrollTop = messages_list.scrollHeight
})

submit.addEventListener('click', (event) => {
    event.preventDefault()

    if(message_box.value.trim().length >= 1){
        let data = {
            text: message_box.value,
            user: currentUser
        }
    
        socket.emit('CreateNewMessage', data)
        message_box.value = ''
    }
})

logout_button.addEventListener('click', (event) => {
    event.preventDefault()

    sessionStorage.removeItem('user')

    window.location.href = '/logout'
})

my_messages.addEventListener('click', (event) => {
    event.preventDefault()

    socket.emit('checkUser', currentUser)

    window.location.href = `/my_messages/${currentUser}`
})