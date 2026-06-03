@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
}

/* Warning border blink animation */
@keyframes border-blink {
  0%, 100% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
  50% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 2px rgba(239, 68, 68, 0.1); }
}

@keyframes title-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}

/* FIX: Thêm class warning-active dùng trong JSX */
.warning-active {
  animation: border-blink 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.warning-border-blink {
  animation: border-blink 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.warning-pulse {
  animation: title-pulse 1.5s ease-in-out infinite;
}

/* Scrollbar mỏng */
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: #0f172a; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
