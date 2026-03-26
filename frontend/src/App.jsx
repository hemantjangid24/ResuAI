import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Send, PhoneCall, ShieldAlert, ChevronRight, MessageSquare, X, Activity, Navigation, ShieldCheck } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Leaflet Icon Fix
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 14); }, [center, map]);
  return null;
}

function App() {
  const [messages, setMessages] = useState([{ text: "ResuAI Pro Active. Waiting for command...", isBot: true }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: 26.9124, lng: 75.7873 });
  const [emergencyData, setEmergencyData] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, null, { enableHighAccuracy: true });
  }, []);

  const handleSend = async (manualInput = null) => {
    const msg = manualInput || input;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { text: msg, isBot: false }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('https://resuai-api.vercel.app/predict', {
        user_input: msg, lat: location.lat, lng: location.lng
      });
      setEmergencyData(res.data);
      setMessages(prev => [...prev, { text: res.data.instruction, isBot: true }]);
    } catch (e) {
      setMessages(prev => [...prev, { text: "Connection Error! Check Backend.", isBot: true }]);
    }
    setLoading(false);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-row overflow-hidden font-sans relative">
      
      {/* 1. LEFT CHAT PANEL */}
      <div className={`
        ${isChatOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'} 
        md:translate-y-0 md:opacity-100 md:pointer-events-auto
        fixed md:relative bottom-20 md:bottom-0 left-4 right-4 md:left-0 md:right-0 
        md:w-[420px] h-[65vh] md:h-screen 
        bg-white transition-all duration-500 ease-in-out
        rounded-3xl md:rounded-none shadow-2xl md:shadow-none z-[2000] flex flex-col border-r border-slate-200
      `}>
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white rounded-t-3xl md:rounded-none flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg shadow-lg shadow-red-900/20">
                <ShieldAlert size={20}/>
            </div>
            <div>
                <h1 className="text-sm font-black tracking-widest uppercase">ResuAI Command</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">B.Tech Special Ops</p>
            </div>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="md:hidden p-2 hover:bg-slate-800 rounded-full">
            <X size={24}/>
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm max-w-[85%] ${m.isBot ? 'bg-white border-l-4 border-red-600 text-slate-800 font-medium' : 'bg-red-600 text-white font-semibold shadow-lg shadow-red-200'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-red-600 animate-pulse uppercase">
              <Activity size={12}/> AI analyzing incident...
            </div>
          )}
        </div>

        {/* Quick Help Grid */}
        <div className="p-3 bg-white border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-2">One-Tap Reporting:</p>
          <div className="grid grid-cols-2 gap-2">
            {["Fire Emergency", "Medical Help", "Vehicle Accident", "Crime Alert"].map(tag => (
              <button key={tag} onClick={() => handleSend(tag)} className="px-3 py-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 shadow-sm uppercase tracking-tight">
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-5 bg-white border-t border-slate-100 md:rounded-none rounded-b-3xl">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 focus-within:border-red-500 transition-colors">
            <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type incident details..." 
                className="flex-1 p-3 bg-transparent outline-none text-[13px] text-slate-800" 
            />
            <button onClick={() => handleSend()} className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg">
                <Send size={20}/>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN MAP AREA (Right Side) */}
      <div className="flex-1 h-full relative z-0">
        <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ChangeView center={[location.lat, location.lng]} />
          <Marker position={[location.lat, location.lng]}><Popup>User Hub</Popup></Marker>
          {emergencyData?.nearby_services?.map((s, idx) => (
            <React.Fragment key={idx}>
              <Marker position={[s.lat, s.lng]}><Popup>{s.name}</Popup></Marker>
              <Polyline positions={[[location.lat, location.lng], [s.lat, s.lng]]} color="#ef4444" weight={4} dashArray="10, 10" />
            </React.Fragment>
          ))}
        </MapContainer>

        {/* DUAL EMERGENCY BUTTONS (Top Floating) */}
        <div className="absolute top-6 left-6 right-6 pointer-events-none z-[1000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           
           {/* System Status Label (Desktop Only) */}
           <div className="hidden md:flex bg-slate-900/95 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl items-center gap-4 pointer-events-auto">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Navigation size={20} className="text-emerald-500 animate-pulse"/>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Node: Jaipur</p>
                    <h2 className="text-white text-xs font-black tracking-tighter uppercase">Signal: High Precision</h2>
                </div>
           </div>

           {/* SOS Button Group */}
           <div className="flex gap-3 pointer-events-auto w-full md:w-auto">
              {/* POLICE BUTTON (New) */}
              <a href="tel:112" className="flex-1 md:flex-none bg-blue-700 hover:bg-blue-800 px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 text-white no-underline transition-all active:scale-95 border-b-4 border-blue-900">
                <ShieldCheck size={20} /> 
                <span className="font-black text-[12px] uppercase tracking-wider">Police 112</span>
              </a>

              {/* MEDICAL BUTTON */}
              <a href="tel:108" className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 text-white no-underline transition-all active:scale-95 border-b-4 border-red-900">
                <PhoneCall size={20} className="animate-pulse"/> 
                <span className="font-black text-[12px] uppercase tracking-wider">Medical 108</span>
              </a>
           </div>
        </div>
      </div>

      {/* 3. MOBILE FLOATING CHAT BUTTON */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`
          md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl
          flex items-center justify-center transition-all duration-500 z-[3000]
          ${isChatOpen ? 'bg-slate-900 rotate-90' : 'bg-red-600 animate-bounce'}
          text-white border-4 border-white
        `}
      >
        {isChatOpen ? <X size={28}/> : <MessageSquare size={28}/>}
      </button>

    </div>
  );
}

export default App;