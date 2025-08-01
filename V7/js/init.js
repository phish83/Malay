// =============================================================================
// INITIALIZE APPLICATION
// =============================================================================
let app;

window.onload = () => {
  app = new SolfeggioApp();
  console.log('Modular Solfeggio Generator initialized!');
  console.log('Available modules:', Object.keys(app));
};