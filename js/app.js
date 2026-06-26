/// ============================================================
// TECNOLOGIS — app.js
// Programación Web IEI-054 · Instituto Profesional Santo Tomás
// ============================================================
// Este archivo maneja TODAS las páginas del sitio:
//   - productos.html : carga JSON, muestra grilla, filtra
//   - compra.html    : rellena select, resumen, validaciones, boleta
//   - contacto.html  : validaciones del formulario de contacto
//   - todas          : menú hamburguesa
// ============================================================

var todosLosProductos = [];
var categoriaActual   = "Todos";

(function menuHamburguesa() {
  var btn = document.getElementById("btnMenu");
  var nav = document.getElementById("nav-principal");
  if (!btn || !nav) return;
  btn.addEventListener("click", function() { nav.classList.toggle("abierto"); });
  nav.querySelectorAll("a").forEach(function(enlace) {
    enlace.addEventListener("click", function() { nav.classList.remove("abierto"); });
  });
})();

(function paginaProductos() {
  var contenedor = document.getElementById("contenedor-productos");
  if (!contenedor) return;

  fetch("data/productos.json")
    .then(function(respuesta) {
      if (!respuesta.ok) throw new Error("No se pudo leer productos.json");
      return respuesta.json();
    })
    .then(function(datos) {
      todosLosProductos = datos;
      mostrarProductos(datos);
    })
    .catch(function(error) {
      console.error("Error al cargar productos.json:", error);
      contenedor.innerHTML = '<p class="sin-resultados" style="color:#dc2626;">⚠ Error al cargar los productos.</p>';
    });

  var botones = document.querySelectorAll(".btn-filtro");
  for (var i = 0; i < botones.length; i++) {
    botones[i].addEventListener("click", function() {
      for (var j = 0; j < botones.length; j++) { botones[j].classList.remove("activo"); }
      this.classList.add("activo");
      categoriaActual = this.getAttribute("data-categoria");
      if (categoriaActual === "Todos") {
        mostrarProductos(todosLosProductos);
      } else {
        var filtrados = todosLosProductos.filter(function(p) { return p.categoria === categoriaActual; });
        mostrarProductos(filtrados);
      }
    });
  }
})();

function mostrarProductos(lista) {
  var contenedor = document.getElementById("contenedor-productos");
  var conteoEl   = document.getElementById("conteoResultados");
  if (!contenedor) return;

  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="sin-resultados">No hay productos en esta categoría.</p>';
    if (conteoEl) conteoEl.textContent = "0 productos encontrados";
    return;
  }

  if (conteoEl) {
    conteoEl.textContent = lista.length === 1 ? "1 producto encontrado" : lista.length + " productos encontrados";
  }

  var html = "";
  for (var i = 0; i < lista.length; i++) {
    var p = lista[i];
    var badgeClase, badgeTexto;
    if (p.stock === 0)       { badgeClase = "stock-agotado"; badgeTexto = "Sin stock"; }
    else if (p.stock <= 3)   { badgeClase = "stock-poco";    badgeTexto = "¡Solo " + p.stock + " disponibles!"; }
    else                     { badgeClase = "stock-ok";      badgeTexto = p.stock + " en stock"; }

    var precio = "$" + p.precio.toLocaleString("es-CL");
    var icono  = obtenerIcono(p.categoria);
    var imgHtml = "";

    if (p.imagen && p.imagen !== "") {
      imgHtml =
        '<img src="' + p.imagen + '" alt="' + p.nombre + '" class="producto-img" ' +
        'onerror="this.style.display=\'none\';document.getElementById(\'fb-' + p.id + '\').style.display=\'flex\'">' +
        '<div id="fb-' + p.id + '" class="img-fallback">' + icono + '</div>';
    } else {
      imgHtml = '<div class="img-fallback" style="display:flex">' + icono + '</div>';
    }

    html +=
      '<article class="producto">' +
        '<div class="producto-imagen">' + imgHtml + '<span class="badge-cat">' + p.categoria + '</span></div>' +
        '<div class="producto-body">' +
          '<p class="producto-nombre">' + p.nombre + '</p>' +
          '<p class="producto-desc">'   + p.descripcion + '</p>' +
          '<p class="producto-precio">' + precio + '</p>' +
          '<span class="badge-stock ' + badgeClase + '">' + badgeTexto + '</span>' +
        '</div>' +
      '</article>';
  }
  contenedor.innerHTML = html;
}

function obtenerIcono(categoria) {
  if (categoria === "Audio")          return "🎧";
  if (categoria === "Periféricos")    return "🖱️";
  if (categoria === "Energía")        return "⚡";
  if (categoria === "Wearables")      return "⌚";
  if (categoria === "Monitores")      return "🖥️";
  if (categoria === "Almacenamiento") return "💾";
  if (categoria === "Accesorios")     return "🔧";
  return "📦";
}

(function paginaCompra() {
  var formCompra = document.getElementById("formCompra");
  if (!formCompra) return;

  fetch("data/productos.json")
    .then(function(r) { return r.json(); })
    .then(function(datos) { todosLosProductos = datos; rellenarSelect(datos); })
    .catch(function(err) { console.error("Error cargando JSON en compra.html:", err); });

  var selectEl   = document.getElementById("productoSelect");
  var cantidadEl = document.getElementById("cantidadInput");
  if (selectEl)   selectEl.addEventListener("change", actualizarResumen);
  if (cantidadEl) cantidadEl.addEventListener("input",  actualizarResumen);

  formCompra.addEventListener("submit", function(ev) {
    ev.preventDefault();
    if (validarFormCompra()) { actualizarResumen(); this.submit(); }
  });
})();

function rellenarSelect(lista) {
  var select = document.getElementById("productoSelect");
  if (!select) return;
  for (var i = 0; i < lista.length; i++) {
    var p  = lista[i];
    var op = document.createElement("option");
    op.value       = p.nombre;
    op.textContent = p.nombre + " — $" + p.precio.toLocaleString("es-CL");
    if (p.stock === 0) { op.disabled = true; op.textContent += " (sin stock)"; }
    select.appendChild(op);
  }
}

function actualizarResumen() {
  var select    = document.getElementById("productoSelect");
  var cantInput = document.getElementById("cantidadInput");
  var divBox    = document.getElementById("resumenCompra");
  var divConten = document.getElementById("resumenContenido");
  if (!select || !cantInput || !divBox || !divConten) return;

  var nombreElegido = select.value;
  var cantidad      = parseInt(cantInput.value);

  if (!nombreElegido || isNaN(cantidad) || cantidad <= 0) { divBox.style.display = "none"; return; }

  var prod = null;
  for (var i = 0; i < todosLosProductos.length; i++) {
    if (todosLosProductos[i].nombre === nombreElegido) { prod = todosLosProductos[i]; break; }
  }
  if (!prod) { divBox.style.display = "none"; return; }

  var subtotal = prod.precio * cantidad;
  var fecha    = new Date().toLocaleDateString("es-CL", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });

  divConten.innerHTML =
    '<div class="resumen-linea"><span>Producto</span><span>'         + prod.nombre + '</span></div>' +
    '<div class="resumen-linea"><span>Precio unitario</span><span>$' + prod.precio.toLocaleString("es-CL") + '</span></div>' +
    '<div class="resumen-linea"><span>Cantidad</span><span>'         + cantidad + '</span></div>' +
    '<div class="resumen-linea"><span>Fecha</span><span>'            + fecha + '</span></div>' +
    '<div class="resumen-total"><span>TOTAL A PAGAR</span><span>$'   + subtotal.toLocaleString("es-CL") + '</span></div>';

  divBox.style.display = "block";

  var campoDetalle  = document.getElementById("campo-detalle");
  var campoSubtotal = document.getElementById("campo-subtotal");
  var campoTotal    = document.getElementById("campo-total");
  var campoFecha    = document.getElementById("campo-fecha");

  if (campoDetalle)  campoDetalle.value  = prod.nombre + " x" + cantidad + " = $" + subtotal.toLocaleString("es-CL");
  if (campoSubtotal) campoSubtotal.value = "$" + subtotal.toLocaleString("es-CL");
  if (campoTotal)    campoTotal.value    = "$" + subtotal.toLocaleString("es-CL");
  if (campoFecha)    campoFecha.value    = fecha;
}

function validarFormCompra() {
  var hayError = false;
  limpiarErrores(["err-nombre","err-correo","err-telefono","err-direccion","err-producto","err-cantidad","err-general"]);
  quitarMarcas(["nombreCliente","correoCliente","telefonoCliente","direccionCliente","productoSelect","cantidadInput"]);

  var nombre    = document.getElementById("nombreCliente").value.trim();
  var correo    = document.getElementById("correoCliente").value.trim();
  var telefono  = document.getElementById("telefonoCliente").value.trim();
  var direccion = document.getElementById("direccionCliente").value.trim();
  var idProd    = document.getElementById("productoSelect").value;
  var cantidad  = parseInt(document.getElementById("cantidadInput").value);

  if (nombre === "")           { ponerError("err-nombre",    "El nombre completo es obligatorio.");          marcarError("nombreCliente");    hayError = true; } else { marcarOk("nombreCliente"); }
  if (correo === "")           { ponerError("err-correo",    "El correo electrónico es obligatorio.");       marcarError("correoCliente");    hayError = true; }
  else if (!esCorreoValido(correo)) { ponerError("err-correo", "Formato inválido. Ejemplo: nombre@dominio.cl"); marcarError("correoCliente"); hayError = true; }
  else { marcarOk("correoCliente"); }

  if (telefono !== "" && !esTelefonoValido(telefono)) {
    ponerError("err-telefono", "El teléfono solo debe contener números (7 a 15 dígitos).");
    marcarError("telefonoCliente"); hayError = true;
  } else if (telefono !== "") { marcarOk("telefonoCliente"); }

  if (direccion === "")        { ponerError("err-direccion", "La dirección de despacho es obligatoria.");    marcarError("direccionCliente"); hayError = true; } else { marcarOk("direccionCliente"); }
  if (idProd === "")           { ponerError("err-producto",  "Debes seleccionar al menos un producto.");     marcarError("productoSelect");   hayError = true; } else { marcarOk("productoSelect"); }

  if (isNaN(cantidad) || cantidad <= 0) {
    ponerError("err-cantidad", "La cantidad debe ser un número mayor a 0.");
    marcarError("cantidadInput"); hayError = true;
  } else if (idProd !== "") {
    var prodElegido = null;
    for (var i = 0; i < todosLosProductos.length; i++) {
      if (todosLosProductos[i].nombre === idProd) { prodElegido = todosLosProductos[i]; break; }
    }
    if (prodElegido && cantidad > prodElegido.stock) {
      ponerError("err-cantidad", "Stock insuficiente. Solo hay " + prodElegido.stock + " unidades.");
      marcarError("cantidadInput"); hayError = true;
    } else { marcarOk("cantidadInput"); }
  }

  if (hayError) ponerError("err-general", "Por favor corrige los campos marcados en rojo antes de continuar.");
  return !hayError;
}

(function paginaContacto() {
  var formContacto = document.getElementById("formContacto");
  if (!formContacto) return;

  var txtMensaje   = document.getElementById("cMensaje");
  var spanContador = document.getElementById("contadorChars");

  if (txtMensaje && spanContador) {
    txtMensaje.addEventListener("input", function() {
      var largo = this.value.trim().length;
      spanContador.textContent = "(" + largo + " / mínimo 20 caracteres)";
      if (largo >= 20) spanContador.classList.add("ok");
      else             spanContador.classList.remove("ok");
      limpiarErrores(["cerr-mensaje"]);
      quitarMarcas(["cMensaje"]);
    });
  }

  formContacto.addEventListener("submit", function(ev) {
    ev.preventDefault();
    if (validarFormContacto()) this.submit();
  });
})();

function validarFormContacto() {
  var hayError = false;
  limpiarErrores(["cerr-nombre","cerr-correo","cerr-asunto","cerr-mensaje"]);
  quitarMarcas(["cNombre","cCorreo","cAsunto","cMensaje"]);

  var nombre  = document.getElementById("cNombre").value.trim();
  var correo  = document.getElementById("cCorreo").value.trim();
  var asunto  = document.getElementById("cAsunto").value.trim();
  var mensaje = document.getElementById("cMensaje").value.trim();

  if (nombre === "")           { ponerError("cerr-nombre",  "El nombre es obligatorio.");                                      marcarError("cNombre");  hayError = true; } else { marcarOk("cNombre"); }
  if (correo === "")           { ponerError("cerr-correo",  "El correo electrónico es obligatorio.");                          marcarError("cCorreo");  hayError = true; }
  else if (!esCorreoValido(correo)) { ponerError("cerr-correo", "Formato inválido. Ejemplo: nombre@dominio.cl");               marcarError("cCorreo");  hayError = true; }
  else { marcarOk("cCorreo"); }
  if (asunto === "")           { ponerError("cerr-asunto",  "El asunto es obligatorio.");                                      marcarError("cAsunto");  hayError = true; } else { marcarOk("cAsunto"); }
  if (mensaje.length < 20)     { ponerError("cerr-mensaje", "El mensaje debe tener mínimo 20 caracteres. Tiene " + mensaje.length + "."); marcarError("cMensaje"); hayError = true; } else { marcarOk("cMensaje"); }

  return !hayError;
}

function esCorreoValido(correo) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo); }
function esTelefonoValido(tel)  { return /^[0-9+\s\-]{7,15}$/.test(tel); }

function ponerError(idSpan, mensaje) { var el = document.getElementById(idSpan); if (el) el.textContent = mensaje; }
function limpiarErrores(lista) { for (var i = 0; i < lista.length; i++) { var el = document.getElementById(lista[i]); if (el) el.textContent = ""; } }
function marcarError(id) { var el = document.getElementById(id); if (el) { el.classList.add("campo-error"); el.classList.remove("campo-ok"); } }
function marcarOk(id)    { var el = document.getElementById(id); if (el) { el.classList.remove("campo-error"); el.classList.add("campo-ok"); } }
function quitarMarcas(lista) { for (var i = 0; i < lista.length; i++) { var el = document.getElementById(lista[i]); if (el) { el.classList.remove("campo-error"); el.classList.remove("campo-ok"); } } }