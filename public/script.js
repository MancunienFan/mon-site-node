document.getElementById('myButton').addEventListener('click', () => {
  alert('Tu as cliqué sur le bouton ! après push');
});

document.getElementById('sendPhotoBtn').addEventListener('click', async () => {
  const clientId = document.getElementById('clientId').value;
  if (!clientId) {
    alert("Veuillez entrer un ID client");
    return;
  }

  const canvas = document.getElementById('canvas');
  const dataURL = canvas.toDataURL('image/jpeg');

  const response = await fetch('/upload-photo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: clientId,
      image: dataURL
    })
  });

  const result = await response.text();
  alert(result);
});

