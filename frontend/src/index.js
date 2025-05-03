import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Get theme preference or use system preference when set to "system"
function getThemePreference() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  if (savedTheme === 'system') {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  
  return savedTheme;
}

// Apply theme settings on page load
document.documentElement.setAttribute('data-theme', getThemePreference());

// Listen for system theme changes when using system preference
if (localStorage.getItem('theme') === 'system') {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleSystemThemeChange = (e) => {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  prefersDarkScheme.addEventListener('change', handleSystemThemeChange);
}

// Add event listener for theme changes
document.addEventListener('DOMContentLoaded', () => {
  // This can be used for any additional initialization that needs to happen after DOM is loaded
  console.log('DOM fully loaded and parsed');
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
