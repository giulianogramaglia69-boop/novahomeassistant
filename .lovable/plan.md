

## NOVA — Home Assistant

Rebuild the provided NOVA Home Assistant HTML prototype as a fully functional React application with the following structure:

### Pages & Layout
- **Single-page app shell** with fixed header, horizontal tab navigation, and swappable content panels
- **5 tabs**: Chat (💬), Casa/Home (🏠), Meteo (🌤), Note/Reminders (📋), Settings (⚙️)

### Header
- Animated gradient orb with pulse animation + "NOVA" logo text (Syne font)
- Status chips: "AI ON" indicator, microphone status chip

### Chat Panel
- AI chat interface with message bubbles (AI left, user right), typing indicator animation
- Text input with send button and microphone button (with recording state animation)
- AI responses powered by **Lovable AI gateway** (via Supabase edge function) instead of Groq
- Markdown rendering for AI responses
- Conversation history maintained in state

### Smart Home Panel (Casa)
- 2-column device card grid with toggle switches (lights, AC, plug, fan)
- Each card has glow effects when active, type-specific color overlays
- Quick scene buttons (Sera, Film, Mattino, Esco)
- Live "devices on" counter and estimated wattage display
- Brightness/intensity sliders on applicable devices

### Weather Panel (Meteo)
- Main weather card with large temperature display, city, description, icon
- Stats row: humidity, wind, perceived temperature
- Horizontal scrollable forecast cards
- News section with numbered article cards
- Uses a free weather API (Open-Meteo, no key required) with geolocation

### Reminders Panel (Note)
- Add reminder input with "+" button
- Reminder list items with checkbox (done/undone), text, timestamp, delete button
- Persisted in localStorage

### Settings Panel
- Change AI configuration row
- Voice availability check
- Clear chat history button
- Location detection button
- Footer with app version info

### Design System
- Dark sci-fi theme: backgrounds #080C14, #0E1525, #131D30
- Accent colors: electric blue #3B8FFF, neon cyan #00E5C3, soft crimson #FF6B6B
- Fonts: **Syne** (headings/display), **DM Mono** (body/UI)
- Glassmorphism headers, translucent borders, radial gradient ambient backgrounds
- Smooth slide-in animations, breathing pulse effects on orb and mic

### Backend
- Lovable Cloud edge function for AI chat (streaming via Lovable AI gateway)
- Open-Meteo API for weather data (free, no key needed)
- All other data (devices, reminders) stored client-side in localStorage

