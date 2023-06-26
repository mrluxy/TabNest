//Liste des listeners

//onStartup
//Chargement des workspaces
chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.create({url: 'https://example.com'}); // Remplacez 'https://example.com' par l'URL de votre choix
});

//onActivated
//Chargement du workspace sélectionné
chrome.tabs.onActivated.addListener(function(activeInfo) {
  // Obtenir des informations sur l'onglet actif
  chrome.tabs.get(activeInfo.tabId, function(tab) {
      // Vérifier si l'onglet est épinglé
      if (tab.pinned) {
          // Extraire le paramètre 'workspace' de l'URL de l'onglet
          let urlParams = new URL(tab.url).searchParams;
          let workspaceTitle = urlParams.get('workspace');

          // Si le paramètre 'workspace' existe, exécuter 'loadCurrentWorkspace' avec ce paramètre
          if (workspaceTitle) {
              loadCurrentWorkspace(workspaceTitle);
          }
      }
  });
});

function displayWorkspaces() {
  // Récupérer le tableau 'workspaces' du localStorage
  let workspaces = JSON.parse(localStorage.getItem('workspaces')) || [];

  // Obtenir l'ID de l'extension
  let extensionId = chrome.runtime.id;

  // Pour chaque workspace, créer un nouvel onglet épinglé
  workspaces.forEach(workspace => {
      let url = `chrome-extension://${extensionId}?workspace=${encodeURIComponent(workspace.title)}`;
      chrome.tabs.create({url: url, pinned: true});
  });
}

function createWorkspace(nom) {
  // Récupérer le tableau 'workspaces' du localStorage
  let workspaces = JSON.parse(localStorage.getItem('workspaces'));

  // Si 'workspaces' n'existe pas, initialiser un tableau vide
  if (!workspaces) {
      workspaces = [];
  }

  // Fonction pour générer une couleur aléatoire en hexadécimal
  function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
  }

  // Créer un nouvel objet workspace avec une couleur aléatoire
  let newWorkspace = {
      title: nom,
      tabs: [],
      color: getRandomColor()
  };

  // Ajouter le nouvel objet workspace au tableau
  workspaces.push(newWorkspace);

  // Enregistrer le tableau mis à jour dans le localStorage
  localStorage.setItem('workspaces', JSON.stringify(workspaces));
}

function loadCurrentWorkspace(title) {
  // Récupérer le tableau 'workspaces' du localStorage
  let workspaces = JSON.parse(localStorage.getItem('workspaces')) || [];
  let workspace = workspaces.find(ws => ws.title === title);

  // Récupérer ou créer le tableau 'window_workspaces' dans le localStorage
  let windowWorkspaces = JSON.parse(localStorage.getItem('window_workspaces')) || [];

  // Obtenir l'ID de la fenêtre actuelle
  chrome.windows.getCurrent({populate: true}, function(currentWindow) {
      // Vérifier si un objet avec l'ID de la fenêtre actuelle existe déjà
      let windowWorkspace = windowWorkspaces.find(ww => ww.window === currentWindow.id);

      if (windowWorkspace) {
          // Mettre à jour le titre du workspace
          windowWorkspace.title = title;
      } else {
          // Ajouter un nouvel objet avec l'ID de la fenêtre actuelle et le titre du workspace
          windowWorkspaces.push({window: currentWindow.id, title: title});
      }

      // Enregistrer le tableau mis à jour dans le localStorage
      localStorage.setItem('window_workspaces', JSON.stringify(windowWorkspaces));

      // Supprimer tous les onglets non épinglés de la fenêtre actuelle
      chrome.tabs.query({windowId: currentWindow.id, pinned: false}, function(tabs) {
          let tabIds = tabs.map(tab => tab.id);
          chrome.tabs.remove(tabIds, function() {
              // Charger les onglets du workspace dans la fenêtre actuelle
              if (workspace && workspace.tabs) {
                  workspace.tabs.forEach((tabInfo, index) => {
                      // Définir l'onglet actif uniquement pour le premier onglet
                      let isActive = index === 0;
                      chrome.tabs.create({windowId: currentWindow.id, url: tabInfo.url, active: isActive});
                  });
              }
          });
      });
  });
}


function updateWorkspace() {
  // Récupérer le tableau 'window_workspaces' du localStorage
  let windowWorkspaces = JSON.parse(localStorage.getItem('window_workspaces')) || [];

  // Obtenir l'ID de la fenêtre actuelle
  chrome.windows.getCurrent({populate: true}, function(currentWindow) {
      // Trouver le workspace actuellement ouvert dans cette fenêtre
      let windowWorkspace = windowWorkspaces.find(ww => ww.window === currentWindow.id);

      if (windowWorkspace) {
          // Récupérer tous les onglets non épinglés de la fenêtre actuelle
          chrome.tabs.query({windowId: currentWindow.id, pinned: false}, function(tabs) {
              // Mettre à jour la propriété 'tabs' du workspace avec les onglets récupérés
              windowWorkspace.tabs = tabs.map(tab => ({url: tab.url, title: tab.title}));

              // Enregistrer le tableau 'window_workspaces' mis à jour dans le localStorage
              localStorage.setItem('window_workspaces', JSON.stringify(windowWorkspaces));
          });
      }
  });
}