// login elements
const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

// chat elements
const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatMessages = chat.querySelector(".chat__messages")
const giphyApiKey = 'YOUR_GIPHY_API_KEY';
const giphyInput = document.getElementById('giphyInput');
const giphySearchButton = document.getElementById('giphySearchButton');
const giphyResults = document.getElementById('giphyResults');




const notifyUserStatus = (type) => {
    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: `${user.name} ${type} no chat`,
        status: true // flag para mensagens de status
    };
    websocket.send(JSON.stringify(message));

    
};
const notifyUserExit = () => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        const message = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: `${user.name} saiu do chat.`,
            status: true // flag para mensagens de status
        };
        websocket.send(JSON.stringify(message));
        websocket.close(); // Fecha a conexão WebSocket
    }
};

window.addEventListener("beforeunload", (event) => {
    notifyUserExit();
    event.preventDefault(); // Evitar a mensagem de confirmação em alguns navegadores
});
let typingTimeout;

// Função para notificar que o usuário está digitando
const notifyTyping = () => {
    if (chatInput.value.trim() !== "") { // Apenas notifica se houver texto
        const typingMessage = {
            userId: user.id,
            userName: user.name,
            typing: true
        };
        websocket.send(JSON.stringify(typingMessage));

        // Limpa o timeout anterior para que o estado "digitando" não seja enviado várias vezes
        clearTimeout(typingTimeout);

        // Define um timeout para remover o status de "digitando" após 2 segundos
        typingTimeout = setTimeout(() => {
            const typingMessage = {
                userId: user.id,
                userName: user.name,
                typing: false
            };
            websocket.send(JSON.stringify(typingMessage));
        }, 2000);
    }
};

// Enviar evento "digitando" enquanto o usuário está digitando
chatInput.addEventListener("input", notifyTyping);


const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
]

const user = { id: "", name: "", color: "" }

let websocket

const createMessageSelfElement = (content) => {
    const div = document.createElement("div")

    div.classList.add("message--self")
    div.innerHTML = content

    return div
}

const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div")
    const span = document.createElement("span")

    div.classList.add("message--other")

    span.classList.add("message--sender")
    span.style.color = senderColor

    div.appendChild(span)

    span.innerHTML = sender
    div.innerHTML += content

    return div
}

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content, typing, status } = JSON.parse(data);

    // Exibe mensagem de status (entrada/saída)
    if (status) {
        const statusMessage = document.createElement("div");
        statusMessage.classList.add("message--status");
        statusMessage.innerHTML = content;
        chatMessages.appendChild(statusMessage);
        scrollScreen();
        return;
    }

    // Exibe ou remove o indicador de "digitando"
    if (typing !== undefined) {
        let typingIndicator = document.querySelector(`.typing-indicator[data-user="${userId}"]`);

        if (typing && userId !== user.id) {
            if (!typingIndicator) {
                typingIndicator = document.createElement("div");
                typingIndicator.classList.add("typing-indicator");
                typingIndicator.dataset.user = userId;
                typingIndicator.innerText = `${userName} está digitando...`;
                chatMessages.appendChild(typingIndicator);
                scrollScreen();
            }
        } else if (typingIndicator) {
            typingIndicator.remove(); // Remove o indicador quando o usuário para de digitar
        }
        return;
    }

    // Exibe as mensagens normais
    const message =
        userId == user.id
            ? createMessageSelfElement(content)
            : createMessageOtherElement(content, userName, userColor);
    chatMessages.appendChild(message);
    scrollScreen();
};




const handleLogin = (event) => {
    event.preventDefault()

    user.id = crypto.randomUUID()
    user.name = loginInput.value
    user.color = getRandomColor()

    login.style.display = "none"
    chat.style.display = "flex"

    websocket = new WebSocket("wss://chat-backend-zpus.onrender.com")
    websocket.onmessage = processMessage

    websocket.onopen = () => notifyUserStatus("Entrou"); // Notifica entrada do usuário
    websocket.onclose = () => notifyUserStatus("Saiu"); // Notifica saída do usuário

}

const sendMessage = (event) => {
    event.preventDefault()

    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: chatInput.value
    }

    websocket.send(JSON.stringify(message))

    chatInput.value = ""
}

loginForm.addEventListener("submit", handleLogin)
chatForm.addEventListener("submit", sendMessage)