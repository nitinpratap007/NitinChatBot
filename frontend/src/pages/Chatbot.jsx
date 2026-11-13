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
    "Ask me **anything** — coding questions, math explanations, engineering concepts, or course recommendations!\n\n" +
    "💡 *Tip: Click '🔑 Set Gemini API Key' in the top right to use your personal Google Gemini API key directly!*"
  ),
};

export default function Chatbot() {
  const [messages,    setMessages]    = useState([WELCOME]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState(false);
  const [customKey,   setCustomKey]   = useState(() => localStorage.getItem('ncb_gemini_key') || '');
  const [keyInput,    setKeyInput]    = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function saveApiKey(e) {
    e.preventDefault();
    const key = keyInput.trim();
    if (key) {
      localStorage.setItem('ncb_gemini_key', key);
      setCustomKey(key);
      setApiKeyModal(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          role: 'bot',
          html: marked.parse('✅ **Gemini API Key saved successfully!** All your queries will now be answered directly by Google Gemini AI.'),
        }
      ]);
    }
  }

  function removeApiKey() {
    localStorage.removeItem('ncb_gemini_key');
    setCustomKey('');
    setKeyInput('');
    setApiKeyModal(false);
  }

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
          html: marked.parse(`⚠️ **Error:** ${err.message}\n\nPlease try again in a moment.`),
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
          <p>Powered by Google Gemini — instant answers, code generation & recommendations</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setKeyInput(customKey); setApiKeyModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: customKey ? '1px solid #10b981' : '1px solid var(--card-border)' }}
        >
          {customKey ? '🔑 Gemini Key Active' : '🔑 Set Gemini API Key'}
        </button>
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
            placeholder="Ask anything… (e.g. 'Write a Python function for sorting' or 'Recommend a course')"
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

      {/* ── Gemini API Key Modal ── */}
      {apiKeyModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setApiKeyModal(false); }}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>🔑 Google Gemini API Key</h2>
              <button className="modal-close" onClick={() => setApiKeyModal(false)}>×</button>
            </div>

            <form onSubmit={saveApiKey}>
              <div className="modal-body">
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Paste your personal Gemini API key here. It is stored securely in your browser's local storage and used directly to generate AI responses.
                </p>

                <div className="form-group">
                  <label>Gemini API Key</label>
                  <input
                    type="password"
                    className="form-control"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                    Don't have a key? Get one free at{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                      Google AI Studio ↗
                    </a>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                {customKey ? (
                  <button type="button" className="btn btn-danger btn-sm" onClick={removeApiKey}>
                    Remove Key
                  </button>
                ) : <div />}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setApiKeyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save Key
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
