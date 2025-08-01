// THEMEMANAGER.js

class ThemeManager {
  constructor(app) {
    this.app = app;
    this.themes = {
      'light': 'theme-light',
      'warm': 'theme-warm', 
      'dark': 'theme-dark',
      'neural': 'theme-neural'
    };
  }
  
  init() {
    this.updateTheme();
  }
  
  updateTheme() {
    const select = document.getElementById('themeSelect');
    if (!select) return;
    
    const value = select.value.toLowerCase();
    
    // Remove all theme classes
    Object.values(this.themes).forEach(themeClass => {
      document.body.classList.remove(themeClass);
    });
    
    // Apply the selected theme
    let themeToApply = 'theme-neural'; // Default
    
    if (value.includes('light')) {
      themeToApply = 'theme-light';
    } else if (value.includes('warm')) {
      themeToApply = 'theme-warm';
    } else if (value.includes('dark')) {
      themeToApply = 'theme-dark';
    } else if (value.includes('neural')) {
      themeToApply = 'theme-neural';
    }
    
    document.body.classList.add(themeToApply);
    
    // Store the theme preference
    localStorage.setItem('binaural-theme', themeToApply);
  }
  
  loadSavedTheme() {
    const savedTheme = localStorage.getItem('binaural-theme');
    if (savedTheme && Object.values(this.themes).includes(savedTheme)) {
      document.body.classList.add(savedTheme);
      
      // Update the select element to match
      const select = document.getElementById('themeSelect');
      if (select) {
        const themeNames = {
          'theme-light': '🌞 Light',
          'theme-warm': '🌅 Warm',
          'theme-dark': '🌙 Dark',
          'theme-neural': '🧠 Neural'
        };
        select.value = themeNames[savedTheme] || '🧠 Neural';
      }
    }
  }
}