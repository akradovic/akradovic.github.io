chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      if (request.type === 'auth_complete' && request.token) {
        chrome.storage.local.set({ 'access_token': request.token });
      }
    }
  );