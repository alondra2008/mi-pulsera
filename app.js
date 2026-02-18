import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGfmmdSDsYrpgYz5nt2ebvfbHiXRTKXzU",  
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