# Nova Home Hub

<!DOCTYPE html>

<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>NOVA — Home Assistant</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #080c14;
    --surface: #0e1525;
    --surface2: #131d30;
    --border: rgba(99,180,255,0.12);
    --accent: #3b8fff;
    --accent2: #00e5c3;
    --accent3: #ff6b6b;
    --text: #e8f0ff;
    --text-dim: #6b82a8;
    --glow: rgba(59,143,255,0.15);
  }

- { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }

body {
font-family: ‘DM Mono’, monospace;
background: var(–bg);
color: var(–text);
min-height: 100dvh;
display: flex;
flex-direction: column;
overflow: hidden;
position: relative;
}

/* Ambient background */
body::before {
content:’’;
position:fixed; inset:0; z-index:0;
background:
radial-gradient(ellipse 60% 40% at 20% 10%, rgba(59,143,255,0.08) 0%, transparent 60%),
radial-gradient(ellipse 40% 30% at 80% 80%, rgba(0,229,195,0.06) 0%, transparent 60%);
pointer-events:none;
}

/* ── HEADER ── */
header {
position: relative; z-index:10;
display: flex; align-items: center; justify-content: space-between;
padding: 18px 20px 14px;
border-bottom: 1px solid var(–border);
background: rgba(8,12,20,0.8);
backdrop-filter: blur(20px);
flex-shrink: 0;
}

.logo {
display: flex; align-items: center; gap: 10px;
}

.logo-orb {
width: 34px; height: 34px; border-radius: 50%;
background: linear-gradient(135deg, var(–accent), var(–accent2));
display: flex; align-items:center; justify-content:center;
box-shadow: 0 0 20px rgba(59,143,255,0.4);
animation: pulse-orb 3s ease-in-out infinite;
flex-shrink:0;
}

@keyframes pulse-orb {
0%,100% { box-shadow: 0 0 20px rgba(59,143,255,0.4); }
50% { box-shadow: 0 0 35px rgba(59,143,255,0.7), 0 0 60px rgba(0,229,195,0.2); }
}

.logo-orb svg { width:16px; height:16px; fill:white; }

.logo-text {
font-family: ‘Syne’, sans-serif;
font-weight: 800;
font-size: 1.2rem;
letter-spacing: 0.12em;
background: linear-gradient(90deg, #fff 0%, var(–accent2) 100%);
-webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

.logo-sub {
font-size: 0.58rem;
color: var(–text-dim);
letter-spacing: 0.1em;
margin-top: -4px;
}

/* Status chips */
.status-bar {
display: flex; gap: 8px; align-items: center;
}

.chip {
display: flex; align-items: center; gap: 5px;
padding: 4px 10px; border-radius: 20px;
font-size: 0.6rem; letter-spacing: 0.08em;
border: 1px solid var(–border);
background: var(–surface);
color: var(–text-dim);
cursor: pointer;
transition: all 0.2s;
}

.chip.active { border-color: var(–accent2); color: var(–accent2); background: rgba(0,229,195,0.08); }
.chip.danger { border-color: var(–accent3); color: var(–accent3); background: rgba(255,107,107,0.08); }

.chip-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: blink 1.5s infinite; }

@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

/* ── TABS ── */
.tabs {
position: relative; z-index:10;
display: flex;
padding: 0 16px;
border-bottom: 1px solid var(–border);
background: rgba(8,12,20,0.6);
backdrop-filter: blur(10px);
flex-shrink: 0;
overflow-x: auto;
scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display:none; }

.tab {
flex-shrink: 0;
padding: 12px 14px;
font-family: ‘Syne’, sans-serif;
font-size: 0.68rem;
font-weight: 600;
letter-spacing: 0.1em;
color: var(–text-dim);
cursor: pointer;
border-bottom: 2px solid transparent;
transition: all 0.2s;
display: flex; align-items: center; gap: 6px;
}

.tab:hover { color: var(–text); }
.tab.active { color: var(–accent); border-color: var(–accent); }

/* ── MAIN ── */
main {
flex: 1; overflow: hidden;
position: relative; z-index: 5;
display: flex; flex-direction: column;
}

.panel { display: none; flex-direction: column; height: 100%; }
.panel.active { display: flex; }

/* ── CHAT PANEL ── */
#panel-chat { flex-direction: column; }

.chat-messages {
flex: 1;
overflow-y: auto;
padding: 16px;
display: flex;
flex-direction: column;
gap: 14px;
scrollbar-width: thin;
scrollbar-color: var(–border) transparent;
}

.msg {
display: flex;
gap: 10px;
animation: msg-in 0.3s ease;
}

@keyframes msg-in {
from { opacity:0; transform:translateY(10px); }
to { opacity:1; transform:translateY(0); }
}

.msg.user { flex-direction: row-reverse; }

.msg-avatar {
width: 30px; height: 30px; border-radius: 50%;
display: flex; align-items: center; justify-content:center;
flex-shrink:0; font-size: 0.75rem;
}

.msg.ai .msg-avatar { background: linear-gradient(135deg, var(–accent), var(–accent2)); }
.msg.user .msg-avatar { background: var(–surface2); border: 1px solid var(–border); }

.msg-bubble {
max-width: 78%;
padding: 10px 14px;
border-radius: 14px;
font-size: 0.8rem;
line-height: 1.6;
white-space: pre-wrap;
word-break: break-word;
}

.msg.ai .msg-bubble {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 4px 14px 14px 14px;
}

.msg.user .msg-bubble {
background: linear-gradient(135deg, rgba(59,143,255,0.2), rgba(0,229,195,0.1));
border: 1px solid rgba(59,143,255,0.25);
border-radius: 14px 4px 14px 14px;
text-align: right;
}

.msg-time {
font-size: 0.55rem;
color: var(–text-dim);
margin-top: 4px;
padding: 0 4px;
}
.msg.user .msg-time { text-align: right; }

/* Typing indicator */
.typing-indicator {
display: flex; gap: 5px; padding: 12px 14px;
background: var(–surface); border: 1px solid var(–border);
border-radius: 4px 14px 14px 14px;
width: fit-content;
}

.typing-dot {
width: 7px; height: 7px; border-radius: 50%;
background: var(–accent);
animation: typing 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
0%,60%,100% { transform: translateY(0); opacity:0.4; }
30% { transform: translateY(-6px); opacity:1; }
}

/* Chat input */
.chat-input-area {
padding: 12px 16px;
border-top: 1px solid var(–border);
background: rgba(8,12,20,0.85);
backdrop-filter: blur(20px);
display: flex; gap: 10px; align-items: flex-end;
flex-shrink: 0;
}

.chat-input {
flex: 1;
background: var(–surface);
border: 1px solid var(–border);
border-radius: 14px;
padding: 10px 14px;
color: var(–text);
font-family: ‘DM Mono’, monospace;
font-size: 0.78rem;
resize: none;
max-height: 120px;
line-height: 1.5;
outline: none;
transition: border-color 0.2s;
}

.chat-input:focus { border-color: rgba(59,143,255,0.4); }
.chat-input::placeholder { color: var(–text-dim); }

.btn-icon {
width: 42px; height: 42px; border-radius: 50%;
border: none; cursor: pointer;
display: flex; align-items: center; justify-content:center;
flex-shrink:0; transition: all 0.2s;
}

.btn-send {
background: linear-gradient(135deg, var(–accent), var(–accent2));
box-shadow: 0 0 15px rgba(59,143,255,0.3);
}

.btn-send:hover { transform: scale(1.05); box-shadow: 0 0 25px rgba(59,143,255,0.5); }
.btn-send:active { transform: scale(0.95); }
.btn-send svg { fill:white; width:18px; height:18px; }

.btn-mic {
background: var(–surface);
border: 1px solid var(–border);
color: var(–text-dim);
transition: all 0.2s;
}

.btn-mic.listening {
background: rgba(255,107,107,0.15);
border-color: var(–accent3);
color: var(–accent3);
box-shadow: 0 0 20px rgba(255,107,107,0.3);
animation: mic-pulse 1s ease-in-out infinite;
}

@keyframes mic-pulse {
0%,100% { box-shadow: 0 0 20px rgba(255,107,107,0.3); }
50% { box-shadow: 0 0 35px rgba(255,107,107,0.6); }
}

.btn-mic svg { width:18px; height:18px; fill:currentColor; }

/* ── SMART HOME PANEL ── */
#panel-home { overflow-y: auto; padding: 16px; gap: 14px; }

.section-title {
font-family: ‘Syne’, sans-serif;
font-size: 0.65rem;
font-weight: 700;
letter-spacing: 0.2em;
color: var(–text-dim);
text-transform: uppercase;
margin-bottom: 10px;
}

.devices-grid {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 10px;
margin-bottom: 16px;
}

.device-card {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 14px;
padding: 14px;
cursor: pointer;
transition: all 0.25s;
position: relative;
overflow: hidden;
}

.device-card::before {
content:’’;
position: absolute; inset:0;
opacity:0;
transition: opacity 0.3s;
border-radius: 14px;
}

.device-card.on::before { opacity:1; }
.device-card.on { border-color: rgba(59,143,255,0.35); }

.device-card[data-type=“light”].on::before { background: radial-gradient(ellipse at 50% 0%, rgba(255,210,80,0.12), transparent 70%); }
.device-card[data-type=“ac”].on::before { background: radial-gradient(ellipse at 50% 0%, rgba(0,229,195,0.12), transparent 70%); }
.device-card[data-type=“plug”].on::before { background: radial-gradient(ellipse at 50% 0%, rgba(59,143,255,0.12), transparent 70%); }
.device-card[data-type=“fan”].on::before { background: radial-gradient(ellipse at 50% 0%, rgba(160,100,255,0.12), transparent 70%); }

.device-icon {
width: 36px; height: 36px; border-radius: 10px;
display: flex; align-items:center; justify-content:center;
font-size: 1.1rem; margin-bottom: 10px;
background: var(–surface2);
transition: all 0.25s;
}

.device-card.on .device-icon { background: rgba(59,143,255,0.2); }

.device-name {
font-family: ‘Syne’, sans-serif;
font-size: 0.75rem;
font-weight: 600;
margin-bottom: 2px;
}

.device-room { font-size: 0.6rem; color: var(–text-dim); }

.device-toggle {
position: absolute;
top: 12px; right: 12px;
width: 30px; height: 16px;
background: var(–surface2);
border-radius: 8px;
border: 1px solid var(–border);
cursor: pointer;
transition: all 0.2s;
position: relative;
}

.toggle-wrap {
position: absolute; top:10px; right:12px;
width:32px; height:18px;
}

.toggle-track {
width:32px; height:18px;
border-radius:9px;
background: var(–surface2);
border: 1px solid var(–border);
transition: all 0.25s;
position: relative;
cursor: pointer;
}

.device-card.on .toggle-track {
background: var(–accent);
border-color: var(–accent);
box-shadow: 0 0 10px rgba(59,143,255,0.4);
}

.toggle-thumb {
position: absolute;
top: 2px; left: 2px;
width: 12px; height: 12px;
border-radius: 50%;
background: white;
transition: transform 0.25s;
pointer-events: none;
}

.device-card.on .toggle-thumb { transform: translateX(14px); }

/* Slider */
.device-slider-wrap { margin-top: 10px; }
.device-slider {
width:100%;
-webkit-appearance:none;
height:3px;
border-radius:2px;
background: var(–surface2);
outline:none;
}
.device-slider::-webkit-slider-thumb {
-webkit-appearance:none;
width:14px; height:14px;
border-radius:50%;
background: var(–accent);
cursor:pointer;
box-shadow: 0 0 8px rgba(59,143,255,0.5);
}

/* ── METEO ── */
#panel-meteo {
overflow-y: auto;
padding: 16px;
gap: 12px;
}

.weather-main {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 18px;
padding: 20px;
position: relative;
overflow: hidden;
margin-bottom: 12px;
}

.weather-main::before {
content:’’;
position:absolute; inset:0;
background: radial-gradient(ellipse at 80% 20%, rgba(255,180,50,0.08), transparent 60%);
}

.weather-city {
font-family:‘Syne’,sans-serif;
font-size:0.65rem; font-weight:700;
letter-spacing:0.2em;
color:var(–text-dim);
text-transform:uppercase;
}

.weather-temp {
font-family:‘Syne’,sans-serif;
font-size: 3.5rem;
font-weight: 800;
line-height:1;
margin: 8px 0 4px;
background: linear-gradient(135deg, #fff 0%, rgba(255,200,80,0.8) 100%);
-webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

.weather-desc { font-size:0.8rem; color:var(–text-dim); }
.weather-icon { position:absolute; top:16px; right:20px; font-size:3rem; opacity:0.9; }

.weather-stats {
display: grid; grid-template-columns: repeat(3,1fr);
gap: 8px; margin-top: 14px;
}

.w-stat {
background: var(–surface2);
border-radius: 10px;
padding: 10px;
text-align:center;
}

.w-stat-val {
font-family:‘Syne’,sans-serif;
font-size:0.85rem; font-weight:700;
color: var(–accent2);
}

.w-stat-label { font-size:0.55rem; color:var(–text-dim); margin-top:2px; letter-spacing:0.08em; }

.forecast-scroll {
display: flex; gap: 10px;
overflow-x: auto; padding-bottom: 4px;
scrollbar-width: none;
}
.forecast-scroll::-webkit-scrollbar { display:none; }

.forecast-card {
flex-shrink:0;
background: var(–surface);
border: 1px solid var(–border);
border-radius: 12px;
padding: 12px 16px;
text-align:center;
min-width: 70px;
}

.forecast-day { font-size:0.58rem; color:var(–text-dim); letter-spacing:0.1em; }
.forecast-ico { font-size:1.4rem; margin:6px 0; }
.forecast-temp { font-family:‘Syne’,sans-serif; font-size:0.8rem; font-weight:700; }

/* News */
.news-card {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 12px;
padding: 14px;
display:flex; gap:12px; align-items:flex-start;
cursor: pointer;
transition: border-color 0.2s;
}
.news-card:hover { border-color: rgba(59,143,255,0.3); }
.news-num { font-family:‘Syne’,sans-serif; font-size:1.2rem; font-weight:800; color:var(–border); flex-shrink:0; line-height:1; }
.news-title { font-size:0.75rem; line-height:1.5; margin-bottom:4px; }
.news-meta { font-size:0.58rem; color:var(–text-dim); }

/* ── PROMEMORIA ── */
#panel-reminder { overflow-y:auto; padding:16px; gap:12px; }

.reminder-input-row {
display:flex; gap:8px; margin-bottom:14px;
}

.reminder-input {
flex:1;
background: var(–surface);
border: 1px solid var(–border);
border-radius: 12px;
padding: 10px 14px;
color: var(–text);
font-family: ‘DM Mono’, monospace;
font-size: 0.78rem;
outline: none;
transition: border-color 0.2s;
}

.reminder-input:focus { border-color: rgba(59,143,255,0.4); }
.reminder-input::placeholder { color: var(–text-dim); }

.btn-add {
width:42px; height:42px; border-radius:12px;
background: linear-gradient(135deg, var(–accent), var(–accent2));
border:none; cursor:pointer; color:white; font-size:1.2rem;
display:flex; align-items:center; justify-content:center;
flex-shrink:0;
transition: transform 0.15s;
}
.btn-add:active { transform:scale(0.92); }

.reminder-item {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 12px;
padding: 12px 14px;
display:flex; align-items:center; gap:12px;
animation: msg-in 0.3s ease;
transition: all 0.2s;
}

.reminder-item.done { opacity:0.45; }

.reminder-check {
width:20px; height:20px; border-radius:6px;
border: 1px solid var(–border);
background: var(–surface2);
cursor:pointer; flex-shrink:0;
display:flex; align-items:center; justify-content:center;
transition: all 0.2s;
font-size:0.65rem;
}

.reminder-item.done .reminder-check {
background: var(–accent2);
border-color: var(–accent2);
color: #000;
}

.reminder-text { flex:1; font-size:0.78rem; line-height:1.4; }
.reminder-item.done .reminder-text { text-decoration:line-through; color:var(–text-dim); }

.reminder-time { font-size:0.58rem; color:var(–text-dim); }

.reminder-del {
width:24px; height:24px;
background:none; border:none; color:var(–text-dim);
cursor:pointer; font-size:0.85rem;
display:flex; align-items:center; justify-content:center;
border-radius:6px; transition:all 0.2s;
}
.reminder-del:hover { color:var(–accent3); background:rgba(255,107,107,0.1); }

/* API key modal */
.modal-overlay {
position:fixed; inset:0; z-index:100;
background: rgba(0,0,0,0.85);
backdrop-filter: blur(10px);
display:flex; align-items:center; justify-content:center;
padding:20px;
}

.modal {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 20px;
padding: 28px 24px;
width:100%; max-width:360px;
animation: modal-in 0.3s ease;
}

@keyframes modal-in {
from { opacity:0; transform:scale(0.92) translateY(20px); }
to { opacity:1; transform:scale(1) translateY(0); }
}

.modal h2 {
font-family:‘Syne’,sans-serif;
font-size:1.1rem; font-weight:800;
margin-bottom:6px;
background: linear-gradient(90deg, #fff, var(–accent2));
-webkit-background-clip:text; -webkit-text-fill-color:transparent;
}

.modal p { font-size:0.73rem; color:var(–text-dim); line-height:1.6; margin-bottom:20px; }

.modal input {
width:100%;
background: var(–bg);
border: 1px solid var(–border);
border-radius: 12px;
padding: 12px 14px;
color: var(–text);
font-family: ‘DM Mono’, monospace;
font-size: 0.75rem;
outline:none;
margin-bottom:14px;
transition: border-color 0.2s;
}

.modal input:focus { border-color:rgba(59,143,255,0.5); }

.btn-primary {
width:100%; padding:12px;
background: linear-gradient(135deg, var(–accent), var(–accent2));
border:none; border-radius:12px;
color:white;
font-family:‘Syne’,sans-serif;
font-weight:700; font-size:0.8rem;
letter-spacing:0.1em;
cursor:pointer;
transition: opacity 0.2s, transform 0.15s;
}

.btn-primary:hover { opacity:0.9; }
.btn-primary:active { transform:scale(0.97); }

.modal-note {
font-size:0.58rem;
color:var(–text-dim);
text-align:center;
margin-top:10px;
line-height:1.5;
}

/* Settings panel (API key change) */
.settings-row {
display:flex; align-items:center; justify-content:space-between;
background: var(–surface);
border: 1px solid var(–border);
border-radius:12px;
padding:12px 14px;
margin-bottom:10px;
}

.settings-label { font-size:0.75rem; }
.settings-sub { font-size:0.6rem; color:var(–text-dim); margin-top:2px; }

.btn-small {
padding:6px 12px;
border:1px solid var(–border);
border-radius:8px;
background:var(–surface2);
color:var(–text);
font-family:‘DM Mono’,monospace;
font-size:0.65rem;
cursor:pointer;
white-space:nowrap;
transition:all 0.2s;
}

.btn-small:hover { border-color:var(–accent); color:var(–accent); }

/* Scrollbar */
::-webkit-scrollbar { width:4px; height:4px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(–border); border-radius:2px; }

/* Empty state */
.empty-state {
text-align:center; padding:40px 20px;
color:var(–text-dim);
font-size:0.75rem;
line-height:1.8;
}

.empty-icon { font-size:2.5rem; margin-bottom:12px; opacity:0.5; }










    

🔑


    

Benvenuto in NOVA


    

Per usare l'assistente AI hai bisogno di una API key di Groq (gratuita).
La chiave viene salvata solo nel browser, non viene inviata da nessuna parte.


    
    Inizia →
    

Ottieni la tua API key su console.groq.com








    


      
    


    


      

NOVA


      

HOME ASSISTANT


    


    

AI ON


    

🎤 MIC







💬 CHAT

🏠 CASA

🌤 METEO

📋 NOTE

⚙️







  

  


    


      


        

🤖


        


          

Ciao! Sono NOVA, il tuo assistente di casa. Posso aiutarti con domande generali, controllare i dispositivi smart home, darti info sul meteo o gestire i tuoi promemoria.

Come posso aiutarti oggi?

adesso



  



  

  


    

Soggiorno


    


    

Scena rapida


    


      🌙 Sera
      🎬 Film
      ☀️ Mattino
      🚪 Esco
    


    

Consumi stimati


    


      

Dispositivi accesi

0 di 6


      

0W


    



  

  


    


      

Milano, IT


      

22°


      

Parzialmente nuvoloso


      

⛅


      


        

65%

UMIDITÀ


        

12km/h

VENTO


        

19°

PERCEPITA


      


    


    

Previsioni


    


    

Notizie del giorno


    



  

  


    


      
      +
    


    



  

  


    

Impostazioni


    


      

API Key Groq

Cambia la chiave AI


      Cambia
    


    


      

Voce

Verifico disponibilità...


      

—


    


    


      

Svuota chat

Cancella la cronologia


      Svuota
    


    


      

Posizione

Clic per rilevare


      Rileva
    


    


      NOVA v1.0 · Powered by Groq AI (LLaMA 3.3 70B)

      La tua API key è salvata solo in localStorage

      Nessun dato inviato a server terzi

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://novahomeassistant.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f258890c-6f1b-4d03-b9ae-df0ee6d89241).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
