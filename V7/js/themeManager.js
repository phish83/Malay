// =============================================================================
// THEME MANAGER MODULE (Class-Based Version)
// =============================================================================
class ThemeManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    this.updateTheme();
  }

  updateTheme() {
    const theme = document.getElementById('themeSelect').value.toLowerCase();

    // Remove all existing theme classes
    document.body.classList.remove('theme-light', 'theme-warm', 'theme-dark', 'theme-sacred');

    // Add the appropriate theme class
    if (theme.includes('light')) {
      document.body.classList.add('theme-light');
    } else if (theme.includes('warm')) {
      document.body.classList.add('theme-warm');
    } else if (theme.includes('sacred')) {
      document.body.classList.add('theme-sacred');
    } else {
      document.body.classList.add('theme-dark'); // fallback default
    }
  }
}