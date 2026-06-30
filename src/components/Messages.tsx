import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Mail, CheckCheck } from 'lucide-react';
import { useAppContext, User, Conversation, Message, useRealTime } from '../context/AppContext';
import { formatDistanceToNow } from 'date-fns';

export default function Messages({ initialChatUserId, onClose }: { initialChatUserId?: string | null, onClose?: () => void }) {
  const { fetchInbox, fetchMessages, sendMessage, users, currentUser } = useAppContext();
  useRealTime();
  const [inbox, setInbox] = useState<Conversation[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(initialChatUserId || null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Polling intervals
  useEffect(() => {
    let interval: any;
    if (activeChatUserId) {
      // Poll chat
      const loadChat = async () => {
        const msgs = await fetchMessages(activeChatUserId);
        setChatHistory(msgs);
        setLoading(false);
      };
      loadChat();
      interval = setInterval(loadChat, 3000); // poll every 3s
    } else {
      // Poll inbox
      const loadInbox = async () => {
        const data = await fetchInbox();
        setInbox(data);
        setLoading(false);
      };
      loadInbox();
      interval = setInterval(loadInbox, 5000); // poll every 5s
    }
    return () => clearInterval(interval);
  }, [activeChatUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChatUserId) return;
    const tempText = text;
    setText('');
    
    // Optimistic update
    const tempMsg: Message = {
      id: Math.random().toString(),
      senderId: currentUser!.id,
      receiverId: activeChatUserId,
      text: tempText,
      timestamp: new Date(),
      read: false
    };
    setChatHistory(prev => [...prev, tempMsg]);
    
    await sendMessage(activeChatUserId, tempText);
    const msgs = await fetchMessages(activeChatUserId);
    setChatHistory(msgs);
  };

  const getOtherUser = (id: string) => users.find(u => u.id === id);

  if (activeChatUserId) {
    const otherUser = getOtherUser(activeChatUserId);
    if (!otherUser) return null;

    return (
      <div className="w-full h-full flex flex-col bg-civic-surface">
        <div className="p-4 border-b border-civic-border flex items-center gap-3 bg-white sticky top-0 z-10">
          <button onClick={() => { setActiveChatUserId(null); if (onClose) onClose(); }} className="text-civic-ink hover:text-civic-accent transition-colors">
            <ArrowLeft size={20} />
          </button>
          <img src={otherUser.avatar} alt={otherUser.name} className="w-9 h-9 rounded-full object-cover border border-civic-border" />
          <div>
            <h2 className="font-sans font-bold text-sm text-civic-ink leading-tight">{otherUser.name}</h2>
            <p className="font-mono text-[0.65rem] text-civic-muted">{otherUser.handle}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-slate-50/50">
          {loading && chatHistory.length === 0 ? (
            <div className="text-center text-civic-muted font-sans text-xs mt-10">Loading messages...</div>
          ) : chatHistory.length === 0 ? (
            <div className="text-center text-civic-muted font-sans text-xs mt-10 flex flex-col items-center gap-2">
              <Mail size={24} className="opacity-30" />
              Say hi to {otherUser.name.split(' ')[0]}!
            </div>
          ) : (
            chatHistory.map((msg, i) => {
              const isMe = msg.senderId === currentUser?.id;
              const showAvatar = !isMe && (i === chatHistory.length - 1 || chatHistory[i+1].senderId !== msg.senderId);
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
                  {!isMe && (
                    <div className="w-6 shrink-0">
                      {showAvatar && <img src={otherUser.avatar} alt={otherUser.name} className="w-6 h-6 rounded-full object-cover" />}
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                    isMe ? 'bg-civic-accent text-white rounded-br-sm' : 'bg-white border border-civic-border text-civic-ink rounded-bl-sm'
                  }`}>
                    <p className="font-sans text-[0.9rem] leading-snug break-words">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-white/70' : 'text-civic-muted'}`}>
                      <span className="text-[0.55rem] font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && msg.read && <CheckCheck size={10} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-civic-border bg-white">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-civic-bg border border-civic-border rounded-full px-4 py-2 text-sm font-sans outline-none focus:border-civic-accent"
            />
            <button type="submit" disabled={!text.trim()} className="w-10 h-10 shrink-0 rounded-full bg-civic-ink text-white flex items-center justify-center hover:bg-civic-accent disabled:opacity-50 transition-colors">
              <Send size={16} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Inbox View
  return (
    <div className="w-full max-w-2xl mx-auto h-full flex flex-col border-x border-civic-border bg-civic-surface">
      <div className="p-5 border-b border-civic-border sticky top-0 bg-civic-surface/95 backdrop-blur z-10 flex items-center gap-3">
        {onClose && (
           <button onClick={onClose} className="text-civic-ink hover:text-civic-accent transition-colors md:hidden">
             <ArrowLeft size={20} />
           </button>
        )}
        <div>
          <h2 className="font-serif text-[1.6rem] font-bold text-civic-ink leading-none">Messages</h2>
          <p className="font-mono text-[0.6rem] uppercase tracking-widest text-civic-muted mt-1">Direct Messages</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && inbox.length === 0 ? (
          <div className="text-center text-civic-muted font-sans text-xs mt-10">Loading inbox...</div>
        ) : inbox.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-civic-muted gap-3">
            <Mail size={32} strokeWidth={1.5} className="opacity-30" />
            <p className="font-sans text-sm">No messages yet.</p>
          </div>
        ) : (
          inbox.map(convo => {
            const otherUser = getOtherUser(convo.otherUserId);
            if (!otherUser) return null;
            const isUnread = convo.unreadCount > 0;
            const msg = convo.lastMessage;
            const isMe = msg.senderId === currentUser?.id;

            return (
              <div 
                key={convo.otherUserId} 
                onClick={() => setActiveChatUserId(convo.otherUserId)}
                className={`p-4 flex gap-3 border-b border-civic-border cursor-pointer hover:bg-civic-bg transition-colors ${isUnread ? 'bg-blue-50/30' : ''}`}
              >
                <img src={otherUser.avatar} alt={otherUser.name} className="w-12 h-12 rounded-full object-cover border border-civic-border shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={`font-sans text-[0.95rem] ${isUnread ? 'font-bold text-civic-ink' : 'font-semibold text-civic-ink'}`}>{otherUser.name}</span>
                    <span className={`font-mono text-[0.65rem] ${isUnread ? 'text-civic-accent font-bold' : 'text-civic-muted'}`}>
                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: false })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className={`font-sans text-sm truncate ${isUnread ? 'font-semibold text-civic-ink' : 'text-civic-muted'}`}>
                      {isMe ? 'You: ' : ''}{msg.text}
                    </p>
                    {isUnread && (
                      <div className="w-5 h-5 rounded-full bg-civic-accent text-white flex items-center justify-center font-mono text-[0.55rem] font-bold shrink-0">
                        {convo.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
