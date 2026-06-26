// ====================================================
// NovaTech — app.js
// Programación Web IEI-054
// Instituto Profesional Santo Tomás
// ====================================================
// Este archivo hace lo siguiente:
// 1. Carga todos los productos desde data/productos.json
// 2. Muestra los productos en una grilla con JavaScript
// 3. Filtra productos por categoría
// 4. Rellena el select del formulario de compra
// 5. Calcula el resumen/boleta en tiempo real
// 6. Valida el formulario de compra (errores junto a cada campo)
// 7. Valida el formulario de contacto (errores junto a cada campo)
// 8. Controla el menú hamburguesa en móvil
// ====================================================

// Variable global con todos los productos cargados del JSON
var todosLosProductos = [];

// Categoría actualmente seleccionada en los filtros
var categoriaActual = "Todos";

// ====================================================
// 1. CARGAR PRODUCTOS DESDE JSON
// ====================================================

fetch("data/productos.json")
  .then(function(respuesta) {
    if (!respuesta.ok) {
      throw new Error("No se pudo leer productos.json");
    }
    return respuesta.json();
  })
  .then(function(datos) {
    // Guardar en variable global para usar en filtros y validaciones
    todosLosProductos = datos;

    // Mostrar todos los productos en la grilla
    mostrarProductos(datos);

    // Rellenar el select del formulario de compra
    rellenarSelect(datos);
  })
  .catch(function(error) {
    console.error("Error al cargar productos.json:", error);
    document.getElementById("contenedor-productos").innerHTML =
      '<p class="msg-sin-resultados" style="color:#dc2626;">⚠ Error al cargar productos. Verifica que el archivo data/productos.json exista.</p>';
  });

// ====================================================
// 2. MOSTRAR PRODUCTOS EN LA GRILLA DEL DOM
// ====================================================

function mostrarProductos(lista) {
  var contenedor = document.getElementById("contenedor-productos");

  // Si la lista viene vacía, mostrar mensaje
  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="msg-sin-resultados">No hay productos en esta categoría.</p>';
    return;
  }

  // Construir el HTML de cada tarjeta
  var html = "";

  for (var i = 0; i < lista.length; i++) {
    var p = lista[i];

    // Definir el badge de stock
    var badgeClase = "";
    var badgeTexto = "";

    if (p.stock === 0) {
      badgeClase = "stock-agotado";
      badgeTexto = "Sin stock";
    } else if (p.stock <= 3) {
      badgeClase = "stock-poco";
      badgeTexto = "¡Solo " + p.stock + " disponibles!";
    } else {
      badgeClase = "stock-ok";
      badgeTexto = p.stock + " disponibles";
    }

    // Imagen del producto desde el JSON (con fallback a emoji si no carga)
    var imgSrc = p.imagen || "";
    var imgHtml = "";
    if (imgSrc !== "") {
      imgHtml = '<img src="' + imgSrc + '" alt="' + p.nombre + '" class="producto-img" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">';
      imgHtml += '<div class="producto-icono-fallback" style="display:none">' + obtenerIcono(p.categoria) + '</div>';
    } else {
      imgHtml = '<div class="producto-icono">' + obtenerIcono(p.categoria) + '</div>';
    }

    // Construir la tarjeta
    html += '<div class="producto">';
    html += '  <div class="producto-imagen">' + imgHtml + '</div>';
    html += '  <p class="producto-categoria">' + p.categoria + '</p>';
    html += '  <h3>' + p.nombre + '</h3>';
    html += '  <p>' + p.descripcion + '</p>';
    html += '  <p class="producto-precio">$' + p.precio.toLocaleString("es-CL") + '</p>';
    html += '  <span class="badge-stock ' + badgeClase + '">' + badgeTexto + '</span>';
    html += '</div>';
  }

  contenedor.innerHTML = html;
}

// Devuelve un emoji según la categoría
function obtenerIcono(categoria) {
  if (categoria === "Audio")       return "🎧";
  if (categoria === "Periféricos") return "🖱️";
  if (categoria === "Energía")     return "⚡";
  if (categoria === "Wearables")   return "⌚";
  if (categoria === "Accesorios")  return "🔧";
  return "📦";
}

// ====================================================
// 3. FILTROS POR CATEGORÍA
// ====================================================

var botonesFiltro = document.querySelectorAll(".btn-filtro");

for (var i = 0; i < botonesFiltro.length; i++) {
  botonesFiltro[i].addEventListener("click", function() {

    // Quitar la clase "activo" de todos los botones
    for (var j = 0; j < botonesFiltro.length; j++) {
      botonesFiltro[j].classList.remove("activo");
    }
    // Poner "activo" solo en el botón clickeado
    this.classList.add("activo");

    // Guardar la categoría seleccionada
    categoriaActual = this.getAttribute("data-categoria");

    // Filtrar la lista y renderizarla
    if (categoriaActual === "Todos") {
      mostrarProductos(todosLosProductos);
    } else {
      var filtrados = todosLosProductos.filter(function(p) {
        return p.categoria === categoriaActual;
      });
      mostrarProductos(filtrados);
    }
  });
}

// ====================================================
// 4. RELLENAR EL SELECT CON LOS PRODUCTOS DEL JSON
// ====================================================

function rellenarSelect(lista) {
  var select = document.getElementById("productoSelect");

  for (var i = 0; i < lista.length; i++) {
    var p = lista[i];
    var opcion = document.createElement("option");
    opcion.value = p.id;
    opcion.textContent = p.nombre + " — $" + p.precio.toLocaleString("es-CL");

    // Desactivar la opción si el producto no tiene stock
    if (p.stock === 0) {
      opcion.disabled = true;
      opcion.textContent += " (sin stock)";
    }

    select.appendChild(opcion);
  }
}

// ====================================================
// 5. RESUMEN DE COMPRA EN TIEMPO REAL
// ====================================================

function actualizarResumen() {
  var select    = document.getElementById("productoSelect");
  var cantidad  = parseInt(document.getElementById("cantidad").value);
  var divResumen = document.getElementById("resumenCompra");
  var pTexto    = document.getElementById("resumenTexto");

  var idElegido = parseInt(select.value);

  // Si no hay producto o cantidad inválida, ocultar resumen
  if (!idElegido || isNaN(cantidad) || cantidad <= 0) {
    divResumen.style.display = "none";
    return;
  }

  // Buscar el producto en la lista global
  var productoElegido = null;
  for (var i = 0; i < todosLosProductos.length; i++) {
    if (todosLosProductos[i].id === idElegido) {
      productoElegido = todosLosProductos[i];
      break;
    }
  }

  if (!productoElegido) {
    divResumen.style.display = "none";
    return;
  }

  var subtotal = productoElegido.precio * cantidad;

  // Fecha y hora actual
  var fecha = new Date().toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  // Texto del resumen
  var texto = "";
  texto += "Producto: " + productoElegido.nombre + "\n";
  texto += "Precio unitario: $" + productoElegido.precio.toLocaleString("es-CL") + "\n";
  texto += "Cantidad: " + cantidad + "\n";
  texto += "─────────────────────────\n";
  texto += "TOTAL: $" + subtotal.toLocaleString("es-CL") + "\n";
  texto += "Fecha: " + fecha;

  pTexto.textContent = texto;
  divResumen.style.display = "block";

  // Guardar en campos ocultos para que lleguen al correo
  document.getElementById("detalleProducto").value =
    "Producto: " + productoElegido.nombre +
    " | Cantidad: " + cantidad +
    " | Precio unitario: $" + productoElegido.precio.toLocaleString("es-CL") +
    " | TOTAL: $" + subtotal.toLocaleString("es-CL");

  document.getElementById("totalCompra").value = "$" + subtotal.toLocaleString("es-CL");
  document.getElementById("fechaCompra").value = fecha;
}

// Actualizar resumen al cambiar producto o cantidad
document.getElementById("productoSelect").addEventListener("change", actualizarResumen);
document.getElementById("cantidad").addEventListener("input", actualizarResumen);

// ====================================================
// 6. VALIDAR FORMULARIO DE COMPRA
// ====================================================

document.getElementById("formCompra").addEventListener("submit", function(evento) {
  evento.preventDefault();

  var hayError = false;

  // Limpiar errores y marcas anteriores
  limpiarErrores(["error-nombre","error-correo","error-telefono","error-producto","error-cantidad","error-general"]);
  quitarMarcas(["nombreCompra","correoCompra","telefonoCompra","productoSelect","cantidad"]);

  // Leer valores
  var nombre    = document.getElementById("nombreCompra").value.trim();
  var correo    = document.getElementById("correoCompra").value.trim();
  var telefono  = document.getElementById("telefonoCompra").value.trim();
  var idProd    = document.getElementById("productoSelect").value;
  var cantidad  = parseInt(document.getElementById("cantidad").value);

  // Validar nombre (obligatorio)
  if (nombre === "") {
    mostrarError("error-nombre", "El nombre es obligatorio.");
    marcarError("nombreCompra");
    hayError = true;
  } else {
    marcarOk("nombreCompra");
  }

  // Validar correo (obligatorio + formato con regex)
  if (correo === "") {
    mostrarError("error-correo", "El correo electrónico es obligatorio.");
    marcarError("correoCompra");
    hayError = true;
  } else if (!esCorreoValido(correo)) {
    mostrarError("error-correo", "Ingresa un correo válido. Ejemplo: nombre@dominio.cl");
    marcarError("correoCompra");
    hayError = true;
  } else {
    marcarOk("correoCompra");
  }

  // Validar teléfono (opcional, pero si se llena solo puede tener números)
  if (telefono !== "") {
    if (!esTelefonoValido(telefono)) {
      mostrarError("error-telefono", "El teléfono solo debe tener números (7 a 15 dígitos).");
      marcarError("telefonoCompra");
      hayError = true;
    } else {
      marcarOk("telefonoCompra");
    }
  }

  // Validar que haya seleccionado un producto
  if (idProd === "") {
    mostrarError("error-producto", "Debes seleccionar un producto.");
    marcarError("productoSelect");
    hayError = true;
  } else {
    marcarOk("productoSelect");
  }

  // Validar cantidad (mayor a 0 y que no supere el stock disponible)
  if (isNaN(cantidad) || cantidad <= 0) {
    mostrarError("error-cantidad", "La cantidad debe ser un número mayor a 0.");
    marcarError("cantidad");
    hayError = true;
  } else if (idProd !== "") {
    // Buscar el producto y verificar el stock
    var productoElegido = null;
    for (var i = 0; i < todosLosProductos.length; i++) {
      if (todosLosProductos[i].id === parseInt(idProd)) {
        productoElegido = todosLosProductos[i];
        break;
      }
    }
    if (productoElegido !== null && cantidad > productoElegido.stock) {
      mostrarError("error-cantidad",
        "La cantidad supera el stock disponible. Solo hay " + productoElegido.stock + " unidades.");
      marcarError("cantidad");
      hayError = true;
    } else {
      marcarOk("cantidad");
    }
  }

  // Si hay errores, no enviar el formulario
  if (hayError) {
    mostrarError("error-general", "Corrige los errores marcados antes de enviar.");
    return;
  }

  // Sin errores: actualizar resumen y enviar
  actualizarResumen();
  this.submit();
});

// ====================================================
// 7. VALIDAR FORMULARIO DE CONTACTO
// ====================================================

// Contador de caracteres en tiempo real
var txtMensaje = document.getElementById("mensaje");
var spanContador = document.getElementById("contadorChars");

txtMensaje.addEventListener("input", function() {
  var largo = this.value.trim().length;
  spanContador.textContent = "(" + largo + " / mínimo 20 caracteres)";

  if (largo >= 20) {
    spanContador.classList.add("ok");
  } else {
    spanContador.classList.remove("ok");
  }
});

document.getElementById("formContacto").addEventListener("submit", function(evento) {
  evento.preventDefault();

  var hayError = false;

  // Limpiar errores anteriores
  limpiarErrores(["error-cnombre","error-ccorreo","error-asunto","error-mensaje"]);
  quitarMarcas(["nombreContacto","correoContacto","asunto","mensaje"]);

  // Leer valores
  var nombre  = document.getElementById("nombreContacto").value.trim();
  var correo  = document.getElementById("correoContacto").value.trim();
  var asunto  = document.getElementById("asunto").value.trim();
  var mensaje = document.getElementById("mensaje").value.trim();

  // Validar nombre
  if (nombre === "") {
    mostrarError("error-cnombre", "El nombre es obligatorio.");
    marcarError("nombreContacto");
    hayError = true;
  } else {
    marcarOk("nombreContacto");
  }

  // Validar correo
  if (correo === "") {
    mostrarError("error-ccorreo", "El correo electrónico es obligatorio.");
    marcarError("correoContacto");
    hayError = true;
  } else if (!esCorreoValido(correo)) {
    mostrarError("error-ccorreo", "Ingresa un correo válido. Ejemplo: nombre@dominio.cl");
    marcarError("correoContacto");
    hayError = true;
  } else {
    marcarOk("correoContacto");
  }

  // Validar asunto
  if (asunto === "") {
    mostrarError("error-asunto", "El asunto es obligatorio.");
    marcarError("asunto");
    hayError = true;
  } else {
    marcarOk("asunto");
  }

  // Validar mensaje (mínimo 20 caracteres)
  if (mensaje.length < 20) {
    mostrarError("error-mensaje",
      "El mensaje debe tener al menos 20 caracteres. Tiene " + mensaje.length + " actualmente.");
    marcarError("mensaje");
    hayError = true;
  } else {
    marcarOk("mensaje");
  }

  if (hayError) return;

  this.submit();
});

// ====================================================
// 8. FUNCIONES AUXILIARES
// ====================================================

// Valida el formato de un correo electrónico con expresión regular
function esCorreoValido(correo) {
  var regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regex.test(correo);
}

// Valida que el teléfono solo contenga números y caracteres permitidos
function esTelefonoValido(tel) {
  var regex = /^[0-9+\s\-]{7,15}$/;
  return regex.test(tel);
}

// Escribe un mensaje de error en el span indicado
function mostrarError(idSpan, mensaje) {
  var span = document.getElementById(idSpan);
  if (span) span.textContent = mensaje;
}

// Borra el texto de error de una lista de spans
function limpiarErrores(listaIds) {
  for (var i = 0; i < listaIds.length; i++) {
    var span = document.getElementById(listaIds[i]);
    if (span) span.textContent = "";
  }
}

// Pone borde rojo en el campo indicado
function marcarError(idCampo) {
  var campo = document.getElementById(idCampo);
  if (campo) {
    campo.classList.add("campo-error");
    campo.classList.remove("campo-ok");
  }
}

// Pone borde verde en el campo indicado
function marcarOk(idCampo) {
  var campo = document.getElementById(idCampo);
  if (campo) {
    campo.classList.remove("campo-error");
    campo.classList.add("campo-ok");
  }
}

// Quita ambas clases de validación de una lista de campos
function quitarMarcas(listaIds) {
  for (var i = 0; i < listaIds.length; i++) {
    var campo = document.getElementById(listaIds[i]);
    if (campo) {
      campo.classList.remove("campo-error");
      campo.classList.remove("campo-ok");
    }
  }
}

// ====================================================
// 9. MENÚ HAMBURGUESA (móvil)
// ====================================================

var btnMenu = document.getElementById("btnMenu");
var navMenu = document.getElementById("nav-menu");

if (btnMenu && navMenu) {
  btnMenu.addEventListener("click", function() {
    navMenu.classList.toggle("abierto");
  });

  // Cerrar menú al hacer clic en cualquier enlace
  var enlaces = navMenu.querySelectorAll("a");
  for (var i = 0; i < enlaces.length; i++) {
    enlaces[i].addEventListener("click", function() {
      navMenu.classList.remove("abierto");
    });
  }
}
