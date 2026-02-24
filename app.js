import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUUyNjYPxRNIVawhnUrhNN30wsLiGMbyY",  
  authDomain: "pulsera-b82ce.firebaseapp.com",
  projectId: "pulsera-b82ce",
  storageBucket: "pulsera-b82ce.firebasestorage.app",
  messagingSenderId: "582942179738",
  appId: "1:582942179738:web:6de2e3d5df26deeff03a23"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

console.log("🔥 Realtime Database conectada");
console.log("🔐 Auth inicializado");

// ============================================
// FUNCIONES PARA PÁGINA PRINCIPAL (index.html)
// ============================================

window.buscarPulsera = async function() {
    const codigo = document.getElementById("codigoPulsera").value.trim();
    
    if (!codigo) {
        alert("❌ Ingresa un código");
        return;
    }
    
    const mensaje = document.getElementById("mensaje");
    mensaje.innerHTML = "🔍 Buscando...";
    mensaje.className = "alerta";
    mensaje.style.display = "block";
    
    try {
        const codigoRef = ref(database, 'codigos_autorizados/' + codigo);
        const codigoSnapshot = await get(codigoRef);
        
        if (!codigoSnapshot.exists()) {
            mensaje.innerHTML = "❌ Código no válido. Esta pulsera no existe.";
            mensaje.className = "alerta alerta-peligro";
            return;
        }
        
        const menorRef = ref(database, 'menores/' + codigo);
        const menorSnapshot = await get(menorRef);
        
        if (menorSnapshot.exists()) {
            window.location.href = `consulta.html?id=${codigo}`;
            return;
        }
        
        document.getElementById("codigoMostrar").textContent = codigo;
        document.getElementById("paso1").style.display = "none";
        document.getElementById("paso2").classList.remove("oculto");
        mensaje.style.display = "none";
        
    } catch (error) {
        console.error("Error:", error);
        mensaje.innerHTML = "❌ Error al buscar: " + error.message;
        mensaje.className = "alerta alerta-peligro";
    }
};

window.registrar = async function() {
    const codigo = document.getElementById("codigoMostrar").textContent;
    const nombre = document.getElementById("nombre").value.trim();
    const alergia = document.getElementById("alergia").value.trim() || "Ninguna";
    const contacto = document.getElementById("contacto").value.trim();
    
    if (!nombre || !contacto) {
        alert("❌ Nombre y teléfono son obligatorios");
        return;
    }
    
    try {
        await set(ref(database, 'menores/' + codigo), {
            nombre: nombre,
            alergia: alergia,
            contacto: contacto,
            fecha: new Date().toString()
        });
        
        alert("✅ ¡Registro exitoso! Pulsera " + codigo + " activada");
        window.location.href = `consulta.html?id=${codigo}`;
        
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al guardar: " + error.message);
    }
};

window.volver = function() {
    document.getElementById("paso1").style.display = "block";
    document.getElementById("paso2").classList.add("oculto");
    document.getElementById("mensaje").innerHTML = "";
    document.getElementById("codigoPulsera").value = "";
};

// ============================================
// FUNCIONES PARA LOGIN (login.html)
// ============================================

window.mostrarRegistro = function() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registroForm").style.display = "block";
};

window.mostrarLogin = function() {
    document.getElementById("registroForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
};

window.registrarse = async function() {
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const mensaje = document.getElementById("mensaje");
    
    if (!email || !password) {
        mensaje.innerHTML = "❌ Completa todos los campos";
        mensaje.className = "alerta alerta-peligro";
        mensaje.style.display = "block";
        return;
    }
    
    try {
        console.log("📝 Intentando registrar:", email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ Usuario creado en Auth. UID:", user.uid);
        
        console.log("📝 Guardando en base de datos...");
        await set(ref(database, 'padres/' + user.uid), {
            email: email,
            pulseras: [],
            fecha_registro: new Date().toString()
        });
        console.log("✅ Datos guardados en DB");
        
        mensaje.innerHTML = "✅ Cuenta creada. Redirigiendo...";
        mensaje.className = "alerta alerta-exito";
        mensaje.style.display = "block";
        
        setTimeout(() => {
            window.location.href = "panel.html";
        }, 1500);
        
    } catch (error) {
        console.error("❌ Error completo:", error);
        mensaje.innerHTML = "❌ Error: " + error.message;
        mensaje.className = "alerta alerta-peligro";
        mensaje.style.display = "block";
    }
};

window.iniciarSesion = async function() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const mensaje = document.getElementById("mensaje");
    
    if (!email || !password) {
        mensaje.innerHTML = "❌ Completa todos los campos";
        mensaje.className = "alerta alerta-peligro";
        mensaje.style.display = "block";
        return;
    }
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "panel.html";
    } catch (error) {
        console.error("Error:", error);
        mensaje.innerHTML = "❌ Error: " + error.message;
        mensaje.className = "alerta alerta-peligro";
        mensaje.style.display = "block";
    }
};

window.cerrarSesion = function() {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Error:", error);
    });
};

// ============================================
// FUNCIONES PARA PANEL (panel.html)
// ============================================

if (window.location.pathname.includes("panel.html")) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("✅ Usuario autenticado:", user.uid);
            cargarPulseras(user.uid);
        } else {
            window.location.href = "login.html";
        }
    });
}

async function cargarPulseras(uid) {
    const contenedor = document.getElementById("listaPulseras");
    if (!contenedor) return;
    
    try {
        const padreRef = ref(database, 'padres/' + uid);
        const snapshot = await get(padreRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            const pulseras = data.pulseras || [];
            mostrarPulseras(pulseras);
            
            // Si hay pulseras, monitorear la primera (para batería)
            if (pulseras.length > 0) {
                monitorearBateria(pulseras[0]);
            }
        } else {
            console.log("❌ No existe en DB. Creando ahora...");
            await set(ref(database, 'padres/' + uid), {
                email: auth.currentUser.email,
                pulseras: [],
                fecha_registro: new Date().toString()
            });
            mostrarPulseras([]);
        }
    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="alerta alerta-peligro">Error al cargar pulseras</div>`;
    }
}

function mostrarPulseras(pulseras) {
    const contenedor = document.getElementById("listaPulseras");
    
    if (pulseras.length === 0) {
        contenedor.innerHTML = `
            <div class="card">
                <p style="text-align: center; color: var(--gris-texto);">
                    No tienes pulseras registradas aún.<br>
                    Agrega una usando el campo de arriba.
                </p>
            </div>
        `;
        return;
    }
    
    let html = "";
    
    const promesas = pulseras.map(async (codigo) => {
        const menorRef = ref(database, 'menores/' + codigo);
        const snapshot = await get(menorRef);
        const datos = snapshot.exists() ? snapshot.val() : null;
        
        return `
            <div class="card" onclick="verDetalle('${codigo}')">
                <div class="card-header">
                    <span class="card-titulo">Pulsera ${codigo}</span>
                    <span class="card-badge">${datos ? 'Activa' : 'Sin registrar'}</span>
                </div>
                <div class="card-contenido">
                    ${datos ? `
                        <p><strong>👶</strong> ${datos.nombre}</p>
                        <p><strong>⚠️</strong> ${datos.alergia}</p>
                    ` : `
                        <p>Pulsera sin registrar</p>
                    `}
                    <p><strong>📍</strong> Ubicación: --</p>
                    <p><strong>🔋</strong> Batería: --%</p>
                </div>
            </div>
        `;
    });
    
    Promise.all(promesas).then(resultados => {
        contenedor.innerHTML = resultados.join('');
    });
}

window.agregarPulsera = async function() {
    const codigo = document.getElementById("nuevoCodigo").value.trim();
    const user = auth.currentUser;
    
    if (!codigo) {
        alert("❌ Ingresa un código");
        return;
    }
    
    try {
        const codigoRef = ref(database, 'codigos_autorizados/' + codigo);
        const snapshot = await get(codigoRef);
        
        if (!snapshot.exists()) {
            alert("❌ Este código no es válido");
            return;
        }
        
        const padreRef = ref(database, 'padres/' + user.uid + '/pulseras');
        const padreSnap = await get(padreRef);
        let pulseras = padreSnap.val() || [];
        
        if (pulseras.includes(codigo)) {
            alert("❌ Esta pulsera ya está en tu lista");
            return;
        }
        
        pulseras.push(codigo);
        await set(ref(database, 'padres/' + user.uid + '/pulseras'), pulseras);
        
        alert("✅ Pulsera " + codigo + " agregada");
        document.getElementById("nuevoCodigo").value = "";
        cargarPulseras(user.uid);
        
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error: " + error.message);
    }
};

window.verDetalle = function(codigo) {
    sessionStorage.setItem('pulseraActual', codigo);
    window.location.href = 'historial.html';
};

// Monitorear batería en tiempo real
function monitorearBateria(codigo) {
    const bateriaRef = ref(database, `menores/${codigo}/bateria`);
    
    onValue(bateriaRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const indicador = document.getElementById("indicadorBateria");
            const nivelSpan = document.getElementById("nivelBateria");
            const cargaSpan = document.getElementById("estadoCarga");
            const alertaDiv = document.getElementById("alertaBateria");
            
            if (indicador) {
                indicador.style.display = "flex";
                nivelSpan.textContent = data.nivel;
                
                if (data.estado === "cargando") {
                    cargaSpan.innerHTML = "⚡ Cargando...";
                    indicador.className = "bateria bateria-media";
                } else if (data.nivel <= 15) {
                    cargaSpan.innerHTML = "⚠️ Batería baja";
                    indicador.className = "bateria bateria-baja";
                    
                    if (alertaDiv) {
                        alertaDiv.style.display = "block";
                        alertaDiv.innerHTML = `⚠️ La pulsera ${codigo} tiene batería baja (${data.nivel}%). Conecta el cargador magnético.`;
                    }
                } else {
                    cargaSpan.innerHTML = "✅ Normal";
                    indicador.className = "bateria bateria-alta";
                    
                    if (alertaDiv) {
                        alertaDiv.style.display = "none";
                    }
                }
            }
        }
    });
}

// ============================================
// FUNCIONES DE SIMULACIÓN (para pruebas sin GPS)
// ============================================

function obtenerCodigoActual() {
    return sessionStorage.getItem('pulseraActual');
}

// Simular ubicación de prueba
window.simularUbicacionPrueba = async function() {
    const codigo = obtenerCodigoActual();
    
    if (!codigo) {
        alert("❌ No hay pulsera seleccionada");
        return;
    }
    
    const lat = 19.4326 + (Math.random() - 0.5) * 0.01;
    const lng = -99.1332 + (Math.random() - 0.5) * 0.01;
    const fecha = new Date();
    const fechaStr = fecha.toISOString().split('T')[0];
    const horaStr = fecha.toTimeString().split(' ')[0];
    
    const lugares = ["Casa", "Escuela", "Parque", "Supermercado", "Casa de abuela", "Centro comercial"];
    const lugar = lugares[Math.floor(Math.random() * lugares.length)];
    
    try {
        const ubicacionRef = ref(database, `menores/${codigo}/historial/${fechaStr}/${horaStr}`);
        await set(ubicacionRef, {
            lat: lat,
            lng: lng,
            lugar: lugar,
            bateria: Math.floor(Math.random() * 30) + 70
        });
        
        alert(`✅ Ubicación simulada guardada: ${lugar}`);
        
        if (document.getElementById("historial")) {
            cargarHistorialReciente();
        }
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al simular ubicación: " + error.message);
    }
};

// Simular batería baja
window.simularBateriaBaja = async function() {
    const codigo = obtenerCodigoActual();
    
    if (!codigo) {
        alert("❌ No hay pulsera seleccionada");
        return;
    }
    
    try {
        const bateriaRef = ref(database, `menores/${codigo}/bateria`);
        await set(bateriaRef, {
            nivel: 15,
            estado: "baja",
            ultima_actualizacion: new Date().toString()
        });
        
        alert("⚠️ Simulación de batería baja activada (15%)");
        
        if (Notification.permission === "granted") {
            new Notification("🔋 Kizuna - Batería baja", {
                body: `La pulsera ${codigo} tiene 15% de batería. Conecta el cargador magnético.`,
                icon: "/icono-bateria.png"
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al simular batería baja: " + error.message);
    }
};

// Simular conexión de carga
window.simularCarga = async function() {
    const codigo = obtenerCodigoActual();
    
    if (!codigo) {
        alert("❌ No hay pulsera seleccionada");
        return;
    }
    
    try {
        const bateriaRef = ref(database, `menores/${codigo}/bateria`);
        await set(bateriaRef, {
            nivel: 85,
            estado: "cargando",
            ultima_actualizacion: new Date().toString()
        });
        
        alert("⚡ Pulsera conectada a carga magnética. Batería al 85%");
        
        // Simular carga completa después de 3 segundos
        setTimeout(async () => {
            await set(bateriaRef, {
                nivel: 100,
                estado: "completa",
                ultima_actualizacion: new Date().toString()
            });
            
            if (Notification.permission === "granted") {
                new Notification("✅ Kizuna - Carga completa", {
                    body: `La pulsera ${codigo} ya está completamente cargada.`,
                    icon: "/icono-bateria.png"
                });
            }
        }, 3000);
        
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al simular carga: " + error.message);
    }
};

// Solicitar permiso para notificaciones
if (window.location.pathname.includes("panel.html") || window.location.pathname.includes("historial.html")) {
    if (Notification && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// ============================================
// FUNCIONES PARA CONSULTA (consulta.html)
// ============================================

if (window.location.pathname.includes("consulta.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
        cargarDatosConsulta(id);
    }
}

async function cargarDatosConsulta(id) {
    const infoDiv = document.getElementById("info");
    
    try {
        const menorRef = ref(database, 'menores/' + id);
        const snapshot = await get(menorRef);
        
        if (snapshot.exists()) {
            const datos = snapshot.val();
            infoDiv.innerHTML = `
                <h2>👶 ${datos.nombre}</h2>
                <div class="card">
                    <p><strong>⚠️ Alergias:</strong> ${datos.alergia}</p>
                    <p><strong>📞 Contacto:</strong> ${datos.contacto}</p>
                    <button class="btn btn-primario" onclick="window.location.href='tel:${datos.contacto}'">
                        📱 Llamar ahora
                    </button>
                </div>
            `;
        } else {
            infoDiv.innerHTML = `<div class="alerta alerta-peligro">No se encontró información</div>`;
        }
    } catch (error) {
        console.error("Error:", error);
        infoDiv.innerHTML = `<div class="alerta alerta-peligro">Error al cargar datos</div>`;
    }
}

// ============================================
// FUNCIONES PARA HISTORIAL (historial.html)
// ============================================

// Cargar historial reciente
window.cargarHistorialReciente = async function() {
    const codigo = obtenerCodigoActual();
    const contenedor = document.getElementById("historial");
    const mapaContainer = document.getElementById("mapaContainer");
    
    if (!codigo) {
        contenedor.innerHTML = "<p class='alerta alerta-peligro'>No hay pulsera seleccionada</p>";
        return;
    }
    
    contenedor.innerHTML = "<p class='alerta'>Cargando historial...</p>";
    if (mapaContainer) mapaContainer.style.display = "none";
    
    try {
        const historialRef = ref(database, `menores/${codigo}/historial`);
        const snapshot = await get(historialRef);
        
        if (snapshot.exists()) {
            const datos = snapshot.val();
            mostrarHistorialCompleto(datos);
        } else {
            contenedor.innerHTML = `
                <div class="alerta alerta-info">
                    <p>No hay historial disponible para esta pulsera.</p>
                    <p style="font-size: 12px; margin-top: 10px;">Usa el botón "Simular nueva ubicación" para probar.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = `<p class="alerta alerta-peligro">Error al cargar historial: ${error.message}</p>`;
    }
};

// Cargar historial por fecha
window.cargarHistorialPorFecha = async function() {
    const codigo = obtenerCodigoActual();
    const fecha = document.getElementById("fechaFiltro").value;
    const contenedor = document.getElementById("historial");
    const mapaContainer = document.getElementById("mapaContainer");
    
    if (!codigo) {
        contenedor.innerHTML = "<p class='alerta alerta-peligro'>No hay pulsera seleccionada</p>";
        return;
    }
    
    if (!fecha) {
        alert("❌ Selecciona una fecha");
        return;
    }
    
    contenedor.innerHTML = "<p class='alerta'>Cargando historial...</p>";
    if (mapaContainer) mapaContainer.style.display = "none";
    
    try {
        const historialRef = ref(database, `menores/${codigo}/historial/${fecha}`);
        const snapshot = await get(historialRef);
        
        if (snapshot.exists()) {
            const datos = snapshot.val();
            mostrarHistorialPorFecha(fecha, datos);
        } else {
            contenedor.innerHTML = `<p class='alerta alerta-info'>No hay ubicaciones para la fecha ${fecha}</p>`;
        }
    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = `<p class="alerta alerta-peligro">Error al cargar historial: ${error.message}</p>`;
    }
};

function mostrarHistorialCompleto(datos) {
    const contenedor = document.getElementById("historial");
    let html = '<h3>📋 Todas las ubicaciones guardadas</h3>';
    
    const fechas = Object.keys(datos).sort().reverse();
    
    fechas.forEach(fecha => {
        html += `<h4 style="margin-top: 20px; color: var(--azul-medio);">📅 ${fecha}</h4>`;
        
        const horas = Object.keys(datos[fecha]).sort().reverse();
        
        horas.slice(0, 5).forEach(hora => {
            const entrada = datos[fecha][hora];
            html += `
                <div class="item-historial" onclick="verEnMapa('${entrada.lat}', '${entrada.lng}')">
                    <div class="fecha">🕒 ${hora}</div>
                    <div>📍 ${entrada.lugar || 'Ubicación desconocida'}</div>
                    <div class="coordenadas">${entrada.lat}, ${entrada.lng}</div>
                    ${entrada.bateria ? `<div>🔋 Batería: ${entrada.bateria}%</div>` : ''}
                </div>
            `;
        });
        
        if (Object.keys(datos[fecha]).length > 5) {
            html += `<p style="text-align: right; font-size: 12px;">... y ${Object.keys(datos[fecha]).length - 5} más</p>`;
        }
    });
    
    contenedor.innerHTML = html;
}

function mostrarHistorialPorFecha(fecha, datos) {
    const contenedor = document.getElementById("historial");
    let html = `<h3>📍 Ubicaciones del ${fecha}</h3>`;
    
    const horas = Object.keys(datos).sort().reverse();
    
    horas.forEach(hora => {
        const entrada = datos[hora];
        html += `
            <div class="item-historial" onclick="verEnMapa('${entrada.lat}', '${entrada.lng}')">
                <div class="fecha">🕒 ${hora}</div>
                <div>📍 ${entrada.lugar || 'Ubicación desconocida'}</div>
                <div class="coordenadas">${entrada.lat}, ${entrada.lng}</div>
                ${entrada.bateria ? `<div>🔋 Batería: ${entrada.bateria}%</div>` : ''}
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

window.verEnMapa = function(lat, lng) {
    const mapaContainer = document.getElementById("mapaContainer");
    const mapaDiv = document.getElementById("mapa");
    
    if (mapaContainer) {
        mapaContainer.style.display = "block";
        mapaDiv.innerHTML = `
            <iframe 
                width="100%" 
                height="300" 
                frameborder="0" 
                src="https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}">
            </iframe>
        `;
        
        mapaContainer.scrollIntoView({ behavior: 'smooth' });
    }
};

// Verificar pulsera seleccionada en historial
if (window.location.pathname.includes("historial.html")) {
    const codigo = obtenerCodigoActual();
    if (!codigo) {
        const contenedor = document.getElementById("historial");
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="alerta alerta-peligro">
                    <p>No hay pulsera seleccionada.</p>
                    <p>Por favor, selecciona una pulsera desde el panel.</p>
                    <button class="btn btn-primario" onclick="window.location.href='panel.html'" style="margin-top: 10px;">
                        Ir al panel
                    </button>
                </div>
            `;
        }
    }

}
