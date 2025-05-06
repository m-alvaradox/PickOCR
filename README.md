# 🧾 PickOCR
https://m-alvaradox.github.io/PickOCR/

**PickOCR** es una herramienta web que permite escanear productos desde imágenes o fotos y extraer automáticamente su código y precio mediante tecnología OCR. Está diseñada para facilitar el registro dinámico de productos y generar reportes fácilmente exportables.

## 📲 ¿Qué hace PickOCR?

- 📷 Escanea imágenes o fotos de etiquetas
- 🔍 Extrae automáticamente el **código del producto** y su **precio**
- 📝 Registra los datos en una **tabla dinámica**
- 📤 Permite **descargar los datos en Excel** o **subirlos a Google Drive**
- 🧹 Incluye funcionalidades para limpiar los datos o subir nuevas imágenes

## 🛠️ Tecnologías utilizadas

### Frontend
- **HTML5**
- **CSS3**
- **JavaScript**

### OCR
- **Google Cloud Vision API**

### Backend / Integraciones
- **Google Drive API** (para subida directa del archivo)
- **SheetJS (xlsx.js)** para generación del archivo Excel

## ⚙️ Funcionalidades

- Escaneo OCR de imagen base64
- Extracción y procesamiento del texto para identificar:
  - Código del producto
  - Precio (USD)
- Tabla editable con opción para eliminar registros
- Botones:
  - 🧹 Limpiar datos
  - 📥 Descargar archivo Excel
  - ☁️ Subir archivo a Google Drive


1. Página Principal PickOCR
   
![image](https://github.com/user-attachments/assets/f780ef73-de40-441a-ae1d-7e4429d6c5a3)

2. Confirmar registro
   
![image](https://github.com/user-attachments/assets/f42fa8e4-7dba-4d49-8c68-a12b7deaa359)

3. Productos registrados

![image](https://github.com/user-attachments/assets/3c4be5a0-ee50-4225-bd8c-3d3f48a29397)

4. Exportación a archivo Excel

![image](https://github.com/user-attachments/assets/39d687e6-369a-4510-a2ef-30ae4cc17765)
