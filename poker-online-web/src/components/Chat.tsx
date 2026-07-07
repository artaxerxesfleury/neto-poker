import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import './Chat.css';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat_message', handleNewMessage);
    return () => {
      socket.off('chat_message', handleNewMessage);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('chat_message', { text: input });
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message">
            <span className="chat-sender">{msg.sender}: </span>
            <span className="chat-text">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-emojis">
        {['🤬', '🤑', '😎', '😴', '🍀', '🦈'].map(emoji => (
          <button key={emoji} type="button" onClick={() => setInput(prev => prev + emoji)}>{emoji}</button>
        ))}
      </div>
      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem..."
          maxLength={100}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};
