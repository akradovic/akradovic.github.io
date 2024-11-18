const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const REDIRECT_URI = chrome.runtime.getURL('popup.html');
const SCOPE = 'https://www.googleapis.com/auth/chrome.sync.history';

document.addEventListener('DOMContentLoaded', function() {
  const loginButton = document.getElementById('login');
  const historyContainer = document.getElementById('history-container');
  
  loginButton.addEventListener('click', initiateAuth);
  
  // Check for authentication response
  const params = new URLSearchParams(window.location.hash.substr(1));
  const accessToken = params.get('access_token');
  
  if (accessToken) {
    chrome.storage.local.set({ 'access_token': accessToken }, function() {
      fetchHistory(accessToken);
    });
  } else {
    chrome.storage.local.get(['access_token'], function(result) {
      if (result.access_token) {
        fetchHistory(result.access_token);
      }
    });
  }
});

function initiateAuth() {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(SCOPE)}`;

  // Open auth window
  window.open(authUrl, 'googleAuth', 
    'width=600,height=600,menubar=no,toolbar=no,location=no,status=no');
}

function fetchHistory(token) {
  const historyContainer = document.getElementById('history-container');
  document.getElementById('login-container').style.display = 'none';
  
  fetch('https://www.googleapis.com/chrome/sync/v1/history/visits', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        chrome.storage.local.remove(['access_token']);
        throw new Error('Authentication expired. Please sign in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const title = document.createElement('div');
        title.textContent = item.title || item.url;
        
        const url = document.createElement('a');
        url.href = item.url;
        url.textContent = item.url;
        url.target = '_blank';
        
        const time = document.createElement('div');
        time.textContent = new Date(item.visitTime).toLocaleString();
        
        historyItem.appendChild(title);
        historyItem.appendChild(url);
        historyItem.appendChild(time);
        
        historyContainer.appendChild(historyItem);
      });
    } else {
      historyContainer.textContent = 'No history items found';
    }
  })
  .catch(error => {
    console.error('Error fetching history:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = error.message;
    historyContainer.prepend(errorDiv);
    document.getElementById('login-container').style.display = 'block';
  });
}