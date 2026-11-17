
  const outputWidthInput = document.getElementById('outputWidth');
  const outputHeightInput = document.getElementById('outputHeight');
  const widthValue = document.getElementById('widthValue');
  const heightValue = document.getElementById('heightValue');

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const photo = document.getElementById('photo');
  const captureButton = document.getElementById('capture');
  const restartButton = document.getElementById('restart');
  const sendButton = document.getElementById('send');
  const brightnessSlider = document.getElementById('brightness');
  const contrastSlider = document.getElementById('contrast');
  const exposureSlider = document.getElementById('exposure');
  const zoomSlider = document.getElementById('zoom');
  const importInput = document.getElementById('importPhoto');

  const clientIdInput = document.getElementById('clientId');
  const clientNomInput = document.getElementById('clientNom');
  const clientPrenomInput = document.getElementById('clientPrenom');
  const btnRecherche = document.getElementById('btnRecherche');

  clientIdInput.addEventListener('input', () => {
    btnRecherche.disabled = !clientIdInput.value;
    
  });
  clientIdInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // évite un éventuel comportement par défaut (formulaire)
    btnRecherche.click(); // simule le clic sur le bouton
  }
});

  btnRecherche.addEventListener('click', async () => {
    const clientId = clientIdInput.value;
    if (!clientId) return;
    try {
      const response = await fetch(`/clients/${clientId}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      clientNomInput.value = data.nom || '';
      clientPrenomInput.value = data.prenom || '';
      captureButton.disabled = !(data.nom && data.prenom);
      importInput.disabled = !(data.nom && data.prenom);
      document.getElementById('infoDate').textContent = formatDateSimple(data.date) || '';
    document.getElementById('infoPhoto').src = data.photo ? `data:image/jpeg;base64,${data.photo}` : '';
    if (data.date && data.photo) {
      document.getElementById('photo-info').style.display = 'block';
    } else {
      document.getElementById('photo-info').style.display = 'none';
    }
    
    } catch (error) {
      clientNomInput.value = '';
      clientPrenomInput.value = '';
      captureButton.disabled = true;
      alert("Client non trouvé. Veuillez vérifier l'ID saisi.");
    }
  });

  function formatDateSimple(isoString) {
    const date = new Date(isoString);
    const jour = String(date.getDate()).padStart(2, '0');
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const annee = date.getFullYear();
    return `${jour}/${mois}/${annee}`;
  }
  

  let currentBrightness = brightnessSlider.value;
  let currentContrast = contrastSlider.value;
  let currentExposure = exposureSlider.value;
  let currentZoom = zoomSlider.value;

  const updateVideoSize = () => {
    const width = outputWidthInput.value + 'px';
    const height = outputHeightInput.value + 'px';
    video.style.width = width;
    video.style.height = height;
    photo.style.width = width;
    photo.style.height = height;
  };

  const updateVideoEffects = () => {
    const contrastValue = Number(currentContrast) + 100;
    const exposureValue = Number(currentExposure);
    const totalBrightness = Number(currentBrightness) + exposureValue;

    video.style.filter = `brightness(${totalBrightness}%) contrast(${contrastValue}%)`;
    video.style.transform = `scale(${currentZoom})`;
  };

  [brightnessSlider, contrastSlider, exposureSlider, zoomSlider].forEach(slider => {
    slider.oninput = () => {
      currentBrightness = brightnessSlider.value;
      currentContrast = contrastSlider.value;
      currentExposure = exposureSlider.value;
      currentZoom = zoomSlider.value;
      updateVideoEffects();
    };
  });

  outputWidthInput.oninput = () => {
    widthValue.textContent = outputWidthInput.value;
    updateVideoSize();
  };
  outputHeightInput.oninput = () => {
    heightValue.textContent = outputHeightInput.value;
    updateVideoSize();
  };
  updateVideoSize();

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error('Erreur caméra:', err));

  captureButton.onclick = () => {
    const context = canvas.getContext('2d');
    const width = parseInt(outputWidthInput.value);
    const height = parseInt(outputHeightInput.value);
    canvas.width = width;
    canvas.height = height;

    const contrastValue = Number(currentContrast) + 100;
    const exposureValue = Number(currentExposure);
    const totalBrightness = Number(currentBrightness) + exposureValue;
    const zoom = parseFloat(currentZoom);

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const scaledWidth = videoWidth / zoom;
    const scaledHeight = videoHeight / zoom;
    const sx = (videoWidth - scaledWidth) / 2;
    const sy = (videoHeight - scaledHeight) / 2;

    context.filter = `brightness(${totalBrightness}%) contrast(${contrastValue}%)`;
    context.drawImage(video, sx, sy, scaledWidth, scaledHeight, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    photo.src = dataUrl;
    photo.style.display = 'block';
    video.style.display = 'none';
    captureButton.style.display = 'none';
    restartButton.style.display = 'inline-block';
  };

  restartButton.onclick = () => {
    photo.style.display = 'none';
    video.style.display = 'block';
    captureButton.style.display = 'inline-block';
    restartButton.style.display = 'none';
  };

  sendButton.onclick = async () => {
    const id = clientIdInput.value;
    const dataUrl = photo.src;
    const userName = document.body.dataset.username;
    


    if (!id || !dataUrl) {
      alert("ID ou image manquants.");
      return;
    }

    const confirmed = confirm("Êtes-vous sûr de vouloir envoyer cette photo vers Oracle ?");
    if (!confirmed) return;

    const response = await fetch('/envoyer-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, image: dataUrl,userName , lang: 'FR' })
    });

    const result = await response.text();
    alert(result);
  };

  importInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      alert("Veuillez importer un fichier image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      video.style.display = 'none';
      captureButton.style.display = 'none';
      restartButton.style.display = 'inline-block';

      photo.src = e.target.result;
      photo.style.display = 'block';
      updateVideoSize();
    };
    reader.readAsDataURL(file);
  };

  //pour l'affichage de la photo prise avec date de prise
  async function chargerInfosClient(id) {
    const response = await fetch(`/clients/${id}`);
    if (!response.ok) return alert("Aucune donnée trouvée.");
  
    const data = await response.json();
   
    document.getElementById('infoDate').textContent = data.date || '';
    document.getElementById('infoPhoto').src = data.photo ? `data:image/jpeg;base64,${data.photo}` : '';
    document.getElementById('client-info').style.display = 'block';
  }
  