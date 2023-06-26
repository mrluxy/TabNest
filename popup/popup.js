document.getElementById('saveButton').addEventListener('click', function() {
  let name = document.getElementById('workspaceName').value;
  if (name) {
    chrome.runtime.sendMessage({action: 'saveWorkspace', name: name}, function(response) {
      // alert(response.status);
      loadWorkspaces();
    });
  } else {
    alert('You need to enter a name to create Workspace');
  }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "startExtension") {
    loadWorkspaces();
  }
});

function loadWorkspaces() {
  chrome.storage.local.get(['workspaces', 'currentWorkspace'], function(result) {
    let workspaces = result.workspaces || [];
    let currentWorkspace = result.currentWorkspace;
    let workspaceList = document.getElementById('workspaceList');
    let workspaceCount = document.getElementById('workspaceCount');
    workspaceList.innerHTML = '';
    workspaceCount.textContent = workspaces.length;
    for (let workspace of workspaces) {
      let li = document.createElement('li');
      li.textContent = workspace.name + ' (' + workspace.urls.length + ' tabs)';
      if (workspace.name === currentWorkspace) {
        li.classList.add('selected');
      }
      let deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', function() {
        let updatedWorkspaces = workspaces.filter(ws => ws.name !== workspace.name);
        chrome.storage.local.set({workspaces: updatedWorkspaces}, function() {
          loadWorkspaces();
        });
      });
      li.appendChild(deleteButton);
      workspaceList.appendChild(li);
    }

    // Supprimer tous les onglets épinglés
    chrome.tabs.query({pinned: true}, function(tabs) {
      let pinnedTabIds = tabs.map(tab => tab.id);
      chrome.tabs.remove(pinnedTabIds, function() {
        // Créer un nouvel onglet épinglé pour chaque workspace
        for (let workspace of workspaces) {
          chrome.tabs.create({url: 'tab.html?title=' + encodeURIComponent(workspace.name), pinned: true, active: false});
        }
      });
    });
  });
}


loadWorkspaces();
