import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { sendQuery } from '../api';

marked.setOptions({ breaks: true, gfm: true });

const SESSION_ID = 'Student_' + Math.floor(Math.random() * 90000 + 10000);

const WELCOME = {
  id: 0,
  role: 'bot',
  html: marked.parse(
    "👋 **Hello! I'm NitinChatBot** — your AI-powered learning assistant.\n\n" +
    "Ask me **anything** — coding questions, math problems, system design, or which courses match your career goals!\n\n" +
    "*Type your question below and hit Enter!*"
  ),
};

export default function Chatbot() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendQuery(q, SESSION_ID);
      const html = marked.parse(data.answer || '_No response received._');
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', html }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          html: marked.parse(`⚠️ **Notice:** ${err.message}\n\nPlease try again in a moment.`),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) handleSend(e);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>🤖 AI Learning Assistant</h1>
          <p>Powered by Gemini — real-time coding assistance, explanations & study advice</p>
        </div>
      </div>

      <div className="card chat-wrap">
        {/* Messages */}
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`msg ${msg.role}`}>
              {msg.role === 'bot'
                ? <div dangerouslySetInnerHTML={{ __html: msg.html }} />
                : msg.text
              }
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="msg bot">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <form className="chat-input-bar" onSubmit={handleSend}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… (e.g., 'Explain binary search trees' or 'How do React hooks work?')"
            disabled={loading}
            aria-label="Chat input"
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            {loading
              ? <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
            }
          </button>
        </form>
      </div>
    </>
  );
}
