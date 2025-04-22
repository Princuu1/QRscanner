// DOM refs
const scanBtn      = document.getElementById('scanBtn');
const uploadBtn    = document.getElementById('uploadBtn');
const fileInput    = document.getElementById('fileInput');
const scanSection  = document.getElementById('scanSection');
const video        = document.getElementById('video');
const canvas       = document.createElement('canvas');
const resultBox    = document.getElementById('result');
const resultHolder = document.getElementById('resultContainer');

// Audio
const voiceStart = document.getElementById('voiceStart');
const beepSound  = document.getElementById('beepSound');
const errorSound = document.getElementById('errorSound');

let stream = null;

// Show/hide scanner
function showScanner() {
  scanSection.classList.add('active');
  resultHolder.classList.remove('visible');
}
function hideScanner() {
  scanSection.classList.remove('active');
}

// Display result
function showResult(data) {
  hideScanner();
  resultHolder.classList.add('visible');
  resultBox.innerHTML = '';

  if (!data) {
    errorSound.play().catch(() => {});
    resultBox.innerHTML = `<p>No QR code found.</p>`;
    return;
  }

  beepSound.play().catch(() => {});
  let urlText = data, linkBtn = '';
  try {
    const url = new URL(data);
    urlText = url.href;
    linkBtn = `<a class="visit" href="${url.href}" target="_blank">Go to Website</a>`;
  } catch {}

  resultBox.innerHTML = `
    <p><strong>Detected:</strong></p>
    <a>${urlText}</a>
    ${linkBtn}
  `;
}

// Start/stop camera + scan
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(ms => {
      stream = ms;
      video.srcObject = ms;
      video.setAttribute('playsinline', true);
      video.play();
      voiceStart.play().catch(() => {});
      requestAnimationFrame(scanLoop);
    })
    .catch(() => {
      errorSound.play().catch(() => {});
      alert('Camera access denied.');
    });
}
function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach(t => t.stop());
  stream = null;
}

// QR scan loop
function scanLoop() {
  if (!stream) return;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, canvas.width, canvas.height);
    if (code && code.data) {
      stopCamera();
      showResult(code.data);
      return;
    }
  }
  requestAnimationFrame(scanLoop);
}

// Handlers
scanBtn.addEventListener('click', () => {
  showScanner();
  startCamera();
});
uploadBtn.addEventListener('click', () => {
  hideScanner();
  stopCamera();
  fileInput.click();
});
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const code = jsQR(imgData.data, img.width, img.height);
      showResult(code ? code.data : null);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
