// Toutes les photos envoyées sont des JPEG dont les pixels portent l’orientation.
const PhotoPreparation = (() => {
  function makeCanvas() { return document.createElement('canvas'); }

  function copyImage(image, canvasFactory = makeCanvas) {
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error('Image vide ou illisible.');
    const result = canvasFactory();
    result.width = width;
    result.height = height;
    const context = result.getContext('2d');
    if (!context) throw new Error('Le navigateur ne peut pas préparer cette photo.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return result;
  }

  function loadImageElement(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Impossible de lire cette image.'));
      image.src = url;
    });
  }

  async function fromFile(file) {
    if (typeof createImageBitmap === 'function') {
      let bitmap;
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return copyImage(bitmap);
      } catch (error) {
        // Repli pour les formats ou navigateurs qui ne proposent pas ce décodage.
      } finally {
        if (bitmap && typeof bitmap.close === 'function') bitmap.close();
      }
    }
    const url = URL.createObjectURL(file);
    try {
      return copyImage(await loadImageElement(url));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function fromDataUrl(url) {
    if (!/^data:image\//i.test(url)) throw new Error('Aucune photo enregistrée à reprendre.');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Impossible de charger la photo enregistrée.');
    return fromFile(await response.blob());
  }

  function toJpeg(source, degrees = 0, canvasFactory = makeCanvas) {
    const rotation = ((degrees % 360) + 360) % 360;
    if (rotation % 90 !== 0) throw new Error('La rotation doit être un multiple de 90 degrés.');
    const width = source.width;
    const height = source.height;
    if (!width || !height) throw new Error('Aucune photo prête à envoyer.');
    const swapDimensions = rotation === 90 || rotation === 270;
    const output = canvasFactory();
    output.width = swapDimensions ? height : width;
    output.height = swapDimensions ? width : height;
    const context = output.getContext('2d');
    if (!context) throw new Error('Le navigateur ne peut pas préparer cette photo.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, output.width, output.height);
    context.translate(output.width / 2, output.height / 2);
    context.rotate(rotation * Math.PI / 180);
    context.drawImage(source, -width / 2, -height / 2, width, height);
    return { canvas: output, dataUrl: output.toDataURL('image/jpeg', 0.92) };
  }

  return { copyImage, fromFile, fromDataUrl, toJpeg };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PhotoPreparation;

if (typeof document !== 'undefined') (() => {
  const outputWidthInput = document.getElementById('outputWidth');
  const outputHeightInput = document.getElementById('outputHeight');
  const widthValue = document.getElementById('widthValue');
  const heightValue = document.getElementById('heightValue');
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const photo = document.getElementById('photo');
  if (!video || !canvas || !photo) return;

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
  const searchButton = document.getElementById('btnRecherche');
  const infoPhoto = document.getElementById('infoPhoto');
  const infoDate = document.getElementById('infoDate');
  const photoInfo = document.getElementById('photo-info');
  const editExistingButton = document.getElementById('editExistingPhoto');
  const rotateLeftButton = document.getElementById('rotateLeft');
  const rotateRightButton = document.getElementById('rotateRight');
  const rotationControls = document.getElementById('photoRotationControls');
  const photoStatus = document.getElementById('photoStatus');

  let photoSource = null;
  let photoRotation = 0;
  let preparedDataUrl = '';
  let preparing = false;
  let sending = false;
  let loadSequence = 0;
  let existingPhotoUrl = '';
  let existingClientId = '';

  function status(message) {
    if (!photoStatus) return;
    photoStatus.textContent = message;
    photoStatus.hidden = !message;
  }

  function updateControls() {
    const ready = Boolean(photoSource && preparedDataUrl) && !preparing && !sending;
    sendButton.disabled = !ready;
    if (rotateLeftButton) rotateLeftButton.disabled = !ready;
    if (rotateRightButton) rotateRightButton.disabled = !ready;
    if (rotationControls) rotationControls.hidden = !photoSource;
    if (editExistingButton) {
      editExistingButton.disabled = preparing || sending || !existingPhotoUrl || existingClientId !== clientIdInput.value;
    }
  }

  function renderPreparedPhoto() {
    const result = PhotoPreparation.toJpeg(photoSource, photoRotation);
    preparedDataUrl = result.dataUrl;
    photo.src = preparedDataUrl;
    photo.style.display = 'block';
    photo.style.objectFit = 'contain';
    video.style.display = 'none';
    captureButton.style.display = 'none';
    restartButton.style.display = 'inline-block';
    updateControls();
    return result;
  }

  function clearPreparedPhoto() {
    photoSource = null;
    preparedDataUrl = '';
    photoRotation = 0;
    photo.removeAttribute('src');
    photo.style.display = 'none';
    video.style.display = 'block';
    captureButton.style.display = 'inline-block';
    restartButton.style.display = 'none';
    updateControls();
  }

  async function loadPreparedPhoto(loader) {
    if (sending) return;
    const sequence = ++loadSequence;
    preparing = true;
    clearPreparedPhoto();
    status('Préparation de la photo…');
    try {
      const source = await loader();
      if (sequence !== loadSequence) return;
      photoSource = source;
      photoRotation = 0;
      renderPreparedPhoto();
      status('Vérifiez l’orientation. Utilisez les boutons de rotation si nécessaire avant l’envoi.');
    } catch (error) {
      if (sequence !== loadSequence) return;
      clearPreparedPhoto();
      status('Impossible de préparer cette photo. Essayez un fichier JPEG ou PNG valide.');
      console.error('Préparation de la photo :', error.message);
    } finally {
      if (sequence === loadSequence) {
        preparing = false;
        updateControls();
      }
    }
  }

  clientIdInput.addEventListener('input', () => {
    searchButton.disabled = !clientIdInput.value;
    updateControls();
  });
  clientIdInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchButton.click();
    }
  });

  function formatDateSimple(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  searchButton.addEventListener('click', async () => {
    const clientId = clientIdInput.value;
    if (!clientId || sending) return;
    try {
      const response = await fetch(`/clients/${encodeURIComponent(clientId)}`);
      if (!response.ok) throw new Error('Client non trouvé.');
      const data = await response.json();
      clientNomInput.value = data.nom || '';
      clientPrenomInput.value = data.prenom || '';
      captureButton.disabled = !(data.nom && data.prenom);
      importInput.disabled = !(data.nom && data.prenom);
      existingPhotoUrl = data.photo ? `data:image/jpeg;base64,${data.photo}` : '';
      existingClientId = clientId;
      infoDate.textContent = formatDateSimple(data.date);
      infoPhoto.src = existingPhotoUrl;
      photoInfo.style.display = data.photo ? 'block' : 'none';
      updateControls();
    } catch (error) {
      clientNomInput.value = '';
      clientPrenomInput.value = '';
      captureButton.disabled = true;
      importInput.disabled = true;
      existingPhotoUrl = '';
      existingClientId = '';
      photoInfo.style.display = 'none';
      updateControls();
      alert('Client non trouvé. Veuillez vérifier l’ID saisi.');
    }
  });

  let currentBrightness = brightnessSlider.value;
  let currentContrast = contrastSlider.value;
  let currentExposure = exposureSlider.value;
  let currentZoom = zoomSlider.value;

  function updateVideoSize() {
    const width = outputWidthInput.value + 'px';
    const height = outputHeightInput.value + 'px';
    video.style.width = photo.style.width = width;
    video.style.height = photo.style.height = height;
  }

  function updateVideoEffects() {
    video.style.filter = `brightness(${Number(currentBrightness) + Number(currentExposure)}%) contrast(${Number(currentContrast) + 100}%)`;
    video.style.transform = `scale(${currentZoom})`;
  }

  [brightnessSlider, contrastSlider, exposureSlider, zoomSlider].forEach(slider => {
    slider.oninput = () => {
      currentBrightness = brightnessSlider.value;
      currentContrast = contrastSlider.value;
      currentExposure = exposureSlider.value;
      currentZoom = zoomSlider.value;
      updateVideoEffects();
    };
  });
  outputWidthInput.oninput = () => { widthValue.textContent = outputWidthInput.value; updateVideoSize(); };
  outputHeightInput.oninput = () => { heightValue.textContent = outputHeightInput.value; updateVideoSize(); };
  updateVideoSize();
  updateControls();

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { video.srcObject = stream; })
      .catch(error => console.error('Erreur caméra :', error.message));
  }

  captureButton.onclick = () => {
    if (sending) return;
    if (!video.videoWidth || !video.videoHeight) {
      alert('La caméra n’est pas encore prête. Vous pouvez aussi importer une photo.');
      return;
    }
    ++loadSequence;
    preparing = false;
    canvas.width = parseInt(outputWidthInput.value, 10);
    canvas.height = parseInt(outputHeightInput.value, 10);
    const context = canvas.getContext('2d');
    const zoom = parseFloat(currentZoom);
    const sourceWidth = video.videoWidth / zoom;
    const sourceHeight = video.videoHeight / zoom;
    context.filter = `brightness(${Number(currentBrightness) + Number(currentExposure)}%) contrast(${Number(currentContrast) + 100}%)`;
    context.drawImage(video, (video.videoWidth - sourceWidth) / 2, (video.videoHeight - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    photoSource = PhotoPreparation.copyImage(canvas);
    photoRotation = 0;
    renderPreparedPhoto();
    status('Vérifiez l’orientation avant l’envoi.');
  };

  restartButton.onclick = () => {
    if (sending) return;
    ++loadSequence;
    preparing = false;
    clearPreparedPhoto();
    importInput.value = '';
    status('');
  };

  function rotatePhoto(delta) {
    if (!photoSource || preparing || sending) return;
    photoRotation = (photoRotation + delta + 360) % 360;
    renderPreparedPhoto();
    status('Orientation appliquée à la photo qui sera envoyée. Vérifiez l’aperçu avant de confirmer.');
  }
  if (rotateLeftButton) rotateLeftButton.onclick = () => rotatePhoto(-90);
  if (rotateRightButton) rotateRightButton.onclick = () => rotatePhoto(90);

  importInput.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file || sending) return;
    if (!file.type.startsWith('image/')) {
      alert('Veuillez importer un fichier image.');
      return;
    }
    await loadPreparedPhoto(() => PhotoPreparation.fromFile(file));
  };

  if (editExistingButton) editExistingButton.onclick = async () => {
    if (!existingPhotoUrl || existingClientId !== clientIdInput.value || sending) return;
    await loadPreparedPhoto(() => PhotoPreparation.fromDataUrl(existingPhotoUrl));
  };

  sendButton.onclick = async () => {
    const id = clientIdInput.value;
    if (preparing || sending) return;
    if (!id || !photoSource || !preparedDataUrl) {
      alert('ID ou photo manquants. Préparez d’abord une photo.');
      return;
    }
    // Régénérer les octets depuis la source et la rotation courantes, jamais depuis le fichier importé brut.
    const dataUrl = renderPreparedPhoto().dataUrl;
    if (!confirm('Vérifiez que la photo est dans le bon sens. Confirmez-vous son envoi vers Oracle ?')) return;
    sending = true;
    updateControls();
    status('Envoi de la photo…');
    try {
      const response = await fetch('/envoyer-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, image: dataUrl, userName: document.body.dataset.username, lang: 'FR' })
      });
      const result = await response.text();
      if (response.ok) {
        existingPhotoUrl = dataUrl;
        existingClientId = id;
        infoPhoto.src = dataUrl;
        infoDate.textContent = formatDateSimple(new Date().toISOString());
        photoInfo.style.display = 'block';
        status('Photo envoyée avec l’orientation affichée dans l’aperçu.');
      } else {
        status('Envoi refusé. L’enregistrement de cette photo n’a pas été confirmé.');
      }
      alert(result);
    } catch (error) {
      status('Envoi non confirmé. Vérifiez la connexion avant de réessayer.');
      alert('L’envoi n’a pas pu être confirmé. Vérifiez la connexion avant de réessayer.');
    } finally {
      sending = false;
      updateControls();
    }
  };
})();
