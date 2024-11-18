const CLIENT_ID = '144892577505-asqcuvotno6npuf54318hvjich4dkvgk.apps.googleusercontent.com';
const REDIRECT_URI = chrome.identity && chrome.identity.getRedirectURL ? 
  chrome.identity.getRedirectURL() : 
  'https://akradovic.github.io/oauth2callback.html';
const SCOPE = 'https://www.googleapis.com/auth/chrome.sync.history';

document.addEventListener('DOMContentLoaded', function() {
  const loginButton = document.getElementById('login');
  const historyContainer = document.getElementById('history-container');
  
  loginButton.addEventListener('click', initiateAuth);
  
  // Check for stored token
  chrome.storage.local.get(['access_token'], function(result) {
    if (result.access_token) {
      fetchHistory(result.access_token);
    }
  });
});

function initiateAuth() {
  if (chrome.identity && chrome.identity.launchWebAuthFlow) {
    // Use chrome.identity if available
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPE)}`;

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, function(redirectUrl) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      
      if (redirectUrl) {
        const url = new URL(redirectUrl);
        const params = new URLSearchParams(url.hash.substr(1));
        const token = params.get('access_token');
        if (token) {
          chrome.storage.local.set({ 'access_token': token }, function() {
            fetchHistory(token);
          });
        }
      }
    });
  } else {
    // Fallback to window.open method
    const state = Math.random().toString(36).substring(2);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=https://akradovic.github.io/oauth2callback.html` +
      `&response_type=token` +
      `&state=${state}` +
      `&scope=${encodeURIComponent(SCOPE)}`;

    chrome.storage.local.set({ 'auth_state': state });
    window.open(authUrl, 'oauth_window', 'width=600,height=600');
  }
}

// Listen for the auth callback message
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://akradovic.github.io') return;
  
  if (event.data.type === 'auth_complete' && event.data.token) {
    chrome.storage.local.get(['auth_state'], function(result) {
      if (result.auth_state === event.data.state) {
        chrome.storage.local.set({ 'access_token': event.data.token }, function() {
          chrome.storage.local.remove('auth_state');
          fetchHistory(event.data.token);
        });
      }
    });
  }
});