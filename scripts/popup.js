const CLIENT_ID = '144892577505-asqcuvotno6npuf54318hvjich4dkvgk.apps.googleusercontent.com';
const REDIRECT_URI = 'https://akradovic.github.io/oauth2callback.html';
const SCOPE = 'https://www.googleapis.com/auth/chrome.sync.history';


function initiateAuth() {
  // Generate a random state value for security
  const state = Math.random().toString(36).substring(2);
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=token` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(SCOPE)}`;

  // Store the state value
  chrome.storage.local.set({ 'auth_state': state });
  
  // Open in new tab
  window.open(authUrl, '_blank');
}
// Add this to your existing popup.js
window.addEventListener('message', function(event) {
  // Verify message origin
  if (event.origin !== 'https://akradovic.github.io') return;
  
  if (event.data.type === 'auth_complete') {
    // Verify state to prevent CSRF attacks
    chrome.storage.local.get(['auth_state'], function(result) {
      if (result.auth_state === event.data.state) {
        // Store the token
        chrome.storage.local.set({ 'access_token': event.data.token }, function() {
          // Remove the state
          chrome.storage.local.remove('auth_state');
          // Fetch history with the new token
          fetchHistory(event.data.token);
        });
      }
    });
  }
});