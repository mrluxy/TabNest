document.title = new URLSearchParams(window.location.search).get('title');
const tabTitle = document.title; // Obtenir le titre de l'onglet actuel
setCustomFavicon(tabTitle);

// Liste des fonctions :

function setCustomFavicon(tabTitle) {
  // Extraire le premier caractère complet du titre
  const firstCharacter = tabTitle.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\s\S]/g)[0];
  
  // Générer une couleur aléatoire au format hexadécimal
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);

  // Créer une icône de favicon personnalisée en utilisant un canvas
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext('2d');
  context.fillStyle = '#' + randomColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = '12px Arial';
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(firstCharacter, canvas.width / 2, canvas.height / 2);

  // Convertir le canvas en une URL de données (data URL)
  const dataURL = canvas.toDataURL('image/png');

  // Définir l'URL de données comme favicon de l'onglet
  const link = document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = dataURL;
  document.head.appendChild(link);
}
