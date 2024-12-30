// src/public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatLog = document.getElementById('chat-log');
  
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const query = userInput.value.trim();
      if (!query) return;
  
      appendMessage('user', query);
      userInput.value = '';
      userInput.disabled = true;
  
      try {
        const response = await fetch('/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          appendMessage('bot', `Error: ${errorData.error}`);
        } else {
          const data = await response.json();
          appendMessage('bot', data.response);
        }
      } catch (error) {
        appendMessage('bot', 'An error occurred. Please try again.');
        console.error('Error:', error);
      }
  
      userInput.disabled = false;
      userInput.focus();
      scrollToBottom();
    });
    
  
    function appendMessage(sender, message) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', sender);
  
      const messageText = document.createElement('div');
      messageText.classList.add('message-text');
      messageText.textContent = message;
  
      messageDiv.appendChild(messageText);
      chatLog.appendChild(messageDiv);
    }
  
    function scrollToBottom() {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  });
  