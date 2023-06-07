chrome.runtime.onStartup.addListener(function() {
  // Envoyer un message à la fenêtre contextuelle
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    console.log("Startup")
    chrome.tabs.sendMessage(tabs[0].id, { action: "startExtension" });
  });
});

// Enregistrement d'un workspace
function saveWorkspace(name, callback) {
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    let urls = tabs.filter(tab => !tab.pinned && tab.url && !tab.pendingUrl).map(tab => tab.url);
    let workspace = {name: name, urls: urls};
    chrome.storage.local.get('workspaces', function(result) {
      let workspaces = result.workspaces || [];
      let index = workspaces.findIndex(ws => ws.name === name);
      if (index !== -1) {
        workspaces[index] = workspace; // Update existing workspace
      } else {
        workspaces.push(workspace); // Add new workspace
      }
      chrome.storage.local.set({workspaces: workspaces}, function() {
        callback();
      });
    });
  });
}

let isLoadingWorkspace = false;

// Chargement d'un workspace
function loadWorkspace(name, callback) {
  chrome.storage.local.get('workspaces', function(result) {
    let workspaces = result.workspaces || [];
    let workspace = workspaces.find(ws => ws.name === name);
    if (workspace) {
      console.log(workspace)
      let urls = workspace.urls;
      // Fermer tous les onglets non épinglés
      chrome.tabs.query({currentWindow: true}, function(tabs) {
        let nonPinnedTabs = tabs.filter(tab => !tab.pinned);
        let nonPinnedTabIds = nonPinnedTabs.map(tab => tab.id);
        isLoadingWorkspace = true;  // Ajout du drapeau
        chrome.tabs.remove(nonPinnedTabIds, function() {
          console.log(["Suppression d'onglet en cours"])
          
          // Ouvrir les onglets du workspace en arrière-plan
          let indexCurrTab = 0;
          setTimeout(function() {
            for (let url of urls) {
              let isActive = (indexCurrTab === 0) ? true : false;
              console.log(["Chargement d'onglet en cours", url, isActive])
              if (isActive) {
                // Ajouter un délai avant de créer le premier onglet
                  chrome.tabs.create({url: url, active: isActive});
              } else {
                chrome.tabs.create({url: url, active: isActive});
              }
              indexCurrTab++;
            }
            isLoadingWorkspace = false;  // Retrait du drapeau
          }, 100);
          callback();
        });
      });
    }
  });
}

// Écoute des messages pour enregistrer ou charger des workspaces
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == 'saveWorkspace') {
    saveWorkspace(request.name, function() {
      sendResponse({status: 'Workspace enregistré'});
    });
  } else if (request.action == 'loadWorkspace') {
    loadWorkspace(request.name, function() {
      sendResponse({status: 'Workspace chargé'});
      chrome.storage.local.set({currentWorkspace: request.name});
    });
  }
  return true;  // Pour garder le canal de réponse ouvert pour sendResponse
});

// Écoute des mises à jour des onglets
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    // Vérifier si l'onglet existe et est épinglé
    if (tab && tab.pinned) {
      let name = tab.title;
      // Vérifier si le workspace à charger est le même que le workspace actuel
      chrome.storage.local.get('currentWorkspace', function(result) {
        let currentWorkspace = result.currentWorkspace;
        if (name !== currentWorkspace) {
          // Stocker le nom du workspace actuellement ouvert
          chrome.storage.local.set({currentWorkspace: name}, function() {
            loadWorkspace(name, function() {
              // console.log('Workspace chargé : ' + name);
            });
          });
        }
      });
    } else {
      // console.log('L\'onglet n\'est pas épinglé ou n\'existe pas.');
    }
  });
});

function saveCurrentWorkspace() {
    chrome.storage.local.get('currentWorkspace', function(result) {
        let name = result.currentWorkspace;
        if (name) {
            saveWorkspace(name, function() {
                // console.log('Workspace sauvegardé : ' + name);
            });
        }
    });
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Si l'URL de l'onglet a changé, que l'onglet n'est pas en cours de fermeture,
  // et que nous ne sommes pas en train de charger un workspace, sauvegarder le workspace
  if ('url' in changeInfo && tab && !tab.pendingUrl && !isLoadingWorkspace) {
    console.log("Onglet mis à jour, update du workspace.")
      saveCurrentWorkspace();
  }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    // Lorsqu'un onglet est supprimé, sauvegarder le workspace
    // Notez que vous ne pouvez pas vérifier si l'onglet est valide dans cet écouteur,
    // car l'onglet a déjà été supprimé à ce stade.
    if(!isLoadingWorkspace) {
      console.log("Onglet fermé, update du workspace.")
      saveCurrentWorkspace();
    }
    
});
