/* Configuracion de logging en Firebase
// Configuración de Firebase
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const email = user.email.toLowerCase();
  const doc = await firebase.firestore().collection("usuarios_permitidos").doc(email).get();
  if (!doc.exists) {
    await firebase.auth().signOut();
    window.location.href = "index.html";
  }
});

*/

const productosEscaneados = new Set();
let valorTotal = 0;

function mostrarMensaje(texto, tipo = 'info') {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = texto;
  mensaje.className = '';

  if (tipo === 'exito') mensaje.classList.add('mensaje-exito');
  else if (tipo === 'error') mensaje.classList.add('mensaje-error');
  else if (tipo === 'cargando') mensaje.classList.add('mensaje-cargando');

  mensaje.style.display = "block";
  if (tipo !== 'cargando') setTimeout(() => { mensaje.style.display = "none"; }, 4000);
}

function actualizarvalorTotal() {
  document.getElementById("valorTotal").innerHTML = `Valor total: <span>${valorTotal.toFixed(2)} USD</span>`;
}

function addToTable(data) {
  const idUnico = `${data.codigo}-${data.valor}`;
  if (productosEscaneados.has(idUnico)) {
    mostrarMensaje("Este producto ya ha sido registrado.");
    return;
  }
  productosEscaneados.add(idUnico);

  const valorNumerico = parseFloat(data.valor);
  if (!isNaN(valorNumerico)) valorTotal += valorNumerico;
  actualizarvalorTotal();

  const tbody = document.querySelector("#tablaProductos tbody");
  const row = document.createElement("tr");
  row.setAttribute("data-id", idUnico);
  row.setAttribute("data-valor", valorNumerico);
  row.innerHTML = `
    <td>${data.codigo}</td>
    <td>${data.valor}</td>
    <td>${new Date().toLocaleString()}</td>
    <td><button class="btn-borrar" onclick="borrarRegistro('${idUnico}')">Borrar</button></td>
  `;
  tbody.appendChild(row);
}

function borrarRegistro(id) {
  const row = document.querySelector(`tr[data-id='${id}']`);
  if (row) {
    const valor = parseFloat(row.getAttribute("data-valor"));
    if (!isNaN(valor)) valorTotal -= valor;
    row.remove();
    actualizarvalorTotal();
    productosEscaneados.delete(id);
  }
}

async function procesarImagen(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const imageData = e.target.result;
      //mostrarImagenEnCanvas(imageData);   // para seleccionar
      procesarOCR(imageData)
    };
    reader.readAsDataURL(file);
  }
}

/*

function mostrarImagenEnCanvas(imageData) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.onload = () => {
    const maxAncho = window.innerWidth * 0.95;
    const escala = maxAncho / img.width;
    canvas.width = maxAncho;
    canvas.height = img.height * escala;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.originalImage = img;
    canvas.style.display = "block";
};
  img.src = imageData;
} 
  */


async function procesarOCR(imageData) {
  mostrarMensaje("⏳ Procesando imagen...", 'cargando');

  const base64Image = imageData;

  const result = await Tesseract.recognize(base64Image, 'eng', {
    logger: m => console.log(m)
  });

  const textoOriginal = result.data.text || '';
  const texto = textoOriginal.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim().toLowerCase();
  console.log('Texto procesado:', texto);

  const palabras = texto.split(' ');
  let codigo = null, valor = null;

  for (let i = 0; i < palabras.length; i++) {
    const palabra = palabras[i];

    if ((palabra.includes('codigo') && !codigo))
      codigo = extraerNumeroCercano(palabras, i);

    if ((palabra.includes('precio') || palabra.includes('USD')) && !valor)
      valor = extraerNumeroCercano(palabras, i);

  }

  if (codigo && valor) {
    const confirmar = confirm(`¿Registrar producto con estos datos?\n\ncodigo: ${codigo}\nvalor: ${valor}`);
    if (confirmar) {
      addToTable({ codigo, valor });
      mostrarMensaje("✅ Producto registrado correctamente.", 'exito');
      canvas.style.display = "none";
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      document.getElementById("inputImagen").value = "";
    } else {
      mostrarMensaje("❌ Registro cancelado por el usuario.", 'error');
    }
  } else {
    mostrarMensaje("⚠️ No se pudieron detectar todos los datos.", 'error');
  }
}

function extraerNumeroCercano(lista, indice) {
  for (let j = 1; j <= 3; j++) {
    const candidato = lista[indice + j];
    if (!candidato) continue;
    const numero = candidato.match(/(\d+[.,]?\d*)/);
    if (numero) return numero[1].replace(',', '.');
  }
  return null;
}

function limpiarTabla() {
  const confirmar = confirm("¿Estás seguro de que quieres eliminar todos los registros?");
  if (!confirmar) return;

  canvas.style.display = "none";
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("inputImagen").value = "";

  const tbody = document.querySelector("#tablaProductos tbody");
  tbody.innerHTML = "";
  productosEscaneados.clear();
  valorTotal = 0;
  actualizarvalorTotal();
  mostrarMensaje("✅ Todos los registros han sido eliminados.", "exito");
}

function exportarExcel() {
  const nombreArchivo = prompt("Ingresa el nombre del archivo Excel:", "productos_escaneados");
  if (!nombreArchivo) {
    mostrarMensaje("❌ Exportación cancelada.", "error");
    return;
  }
  
  const tabla = document.querySelectorAll("#tablaProductos tbody tr");
  const datos = [];
  let valorTotal = 0;

  tabla.forEach(row => {
    const celdas = row.querySelectorAll("td");
    const codigo = celdas[0].textContent.trim();
    const valor = parseFloat(celdas[1].textContent.trim());
    if (!isNaN(valor)) valorTotal += valor;
    datos.push([codigo, valor]);
  });

  const ws_data = [["codigo", "valor (USD)"]];
  datos.forEach(item => ws_data.push(item));
  ws_data.push(["TOTAL", valorTotal.toFixed(2)]);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  
  const nombreFinal = `${nombreArchivo.toUpperCase()} ${new Date().toLocaleString()}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  // Subir a Drive
  subirADrive(blob, nombreFinal);
  
}


function exportarExcel_local() {
  const nombreArchivo = prompt("Ingresa el nombre del archivo Excel:", "productos_escaneados");
  if (!nombreArchivo) {
    mostrarMensaje("❌ Exportación cancelada.", "error");
    return;
  }
  
  const tabla = document.querySelectorAll("#tablaProductos tbody tr");
  const datos = [];
  let valorTotal = 0;

  tabla.forEach(row => {
    const celdas = row.querySelectorAll("td");
    const codigo = celdas[0].textContent.trim();
    const valor = parseFloat(celdas[1].textContent.trim());
    if (!isNaN(valor)) valorTotal += valor;
    datos.push([codigo, valor]);
  });

  const ws_data = [["codigo", "valor (USD)"]];
  datos.forEach(item => ws_data.push(item));
  ws_data.push(["TOTAL", valorTotal.toFixed(2)]);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  
  const nombreFinal = `${nombreArchivo.toUpperCase()} ${new Date().toLocaleString()}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  
  // Guardar local
  XLSX.writeFile(wb, nombreFinal);
  
}


async function subirADrive(blob, nombreArchivo) {
  const token = localStorage.getItem('driveToken');
  if (!token) {
    //alert("No se encontró token de Drive. Debes volver a iniciar sesión.");
    alert("Función subir a Drive deshabilitada. Esta app se encuentra en versión DEMO.");
    return;
  }

  // Paso 1: Buscar carpeta "PrePicker"
  let folderId = null;
  const searchRes = await fetch("https://www.googleapis.com/drive/v3/files?q=name='PickOCR_exports'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    folderId = searchData.files[0].id;
  } else {
    // Paso 2: Crear carpeta si no existe
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "PickOCR_exports",
        mimeType: "application/vnd.google-apps.folder"
      })
    });

    const createData = await createRes.json();
    folderId = createData.id;
  }

  // Paso 3: Subir archivo al interior de la carpeta
  const metadata = {
    name: nombreArchivo,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    parents: [folderId]
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);

  const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: new Headers({ Authorization: "Bearer " + token }),
    body: form
  });

  if (uploadRes.ok) {
    const file = await uploadRes.json();
    mostrarMensaje("✅ Archivo subido a Drive en carpeta PickOCR", "exito");
    console.log("Archivo en Drive:", file);
  } else {
    mostrarMensaje("❌ Error al subir a Drive", "error");
    console.error(await uploadRes.text());
  }
}


/*
// Eventos para selección en canvas
let startX, startY, endX, endY;
let isDrawing = false;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.onmousedown = (e) => {
  startX = e.offsetX;
  startY = e.offsetY;
  isDrawing = true;
};

canvas.onmousemove = (e) => {
  if (!isDrawing) return;
  const width = e.offsetX - startX;
  const height = e.offsetY - startY;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(canvas.originalImage, 0, 0);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, width, height);
};

canvas.onmouseup = async (e) => {
  isDrawing = false;
  endX = e.offsetX;
  endY = e.offsetY;
  const width = endX - startX;
  const height = endY - startY;
  const imageData = ctx.getImageData(startX, startY, width, height);
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCanvas.getContext("2d").putImageData(imageData, 0, 0);
  const croppedImageData = tempCanvas.toDataURL("image/png");
  mostrarMensaje("⏳ Procesando sección seleccionada...", "cargando");
  await procesarOCR(croppedImageData);
};

// Eventos táctiles corregidos para pantallas móviles
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  startX = e.touches[0].clientX - rect.left;
  startY = e.touches[0].clientY - rect.top;
  isDrawing = true;
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const moveX = e.touches[0].clientX - rect.left;
  const moveY = e.touches[0].clientY - rect.top;
  const width = moveX - startX;
  const height = moveY - startY;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(canvas.originalImage, 0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, width, height);
  endX = moveX;
  endY = moveY;
});

canvas.addEventListener("touchend", async (e) => {
  e.preventDefault();
  isDrawing = false;
  const width = endX - startX;
  const height = endY - startY;
  if (width <= 0 || height <= 0) {
    mostrarMensaje("⚠️ Selección inválida.", "error");
    return;
  }
  const imageData = ctx.getImageData(startX, startY, width, height);
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCanvas.getContext("2d").putImageData(imageData, 0, 0);
  const croppedImageData = tempCanvas.toDataURL("image/png");
  mostrarMensaje("⏳ Procesando sección seleccionada...", "cargando");
  await procesarOCR(croppedImageData);
});
*/

window.procesarImagen = procesarImagen;