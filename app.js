import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";
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
        
        const protegidoRef = ref(database, 'protegidos/' + codigo);
        const protegidoSnapshot = await get(protegidoRef);
        
        if (protegidoSnapshot.exists()) {
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
    
    const nombre = document.getElementById("nombre").value.trim() || "Anónimo";
    const alergias = document.getElementById("alergias").value.trim();
    
    // Contactos obligatorios (1,2,3)
    const tel1 = document.getElementById("contacto1_tel").value.trim();
    const rel1 = document.getElementById("contacto1_rel").value.trim();
    const tel2 = document.getElementById("contacto2_tel").value.trim();
    const rel2 = document.getElementById("contacto2_rel").value.trim();
    const tel3 = document.getElementById("contacto3_tel").value.trim();
    const rel3 = document.getElementById("contacto3_rel").value.trim();
    
    // Contacto opcional (4)
    const tel4 = document.getElementById("contacto4_tel").value.trim();
    const rel4 = document.getElementById("contacto4_rel").value.trim();
    
    // Validaciones
    if (!alergias) {
        alert("❌ Las alergias son obligatorias");
        return;
    }
    
    if (!tel1 || !rel1 || !tel2 || !rel2 || !tel3 || !rel3) {
        alert("❌ Los 3 primeros contactos con teléfono y relación son obligatorios");
        return;
    }
    
    // Construir array de contactos
    const contactos = [
        { telefono: tel1, relacion: rel1 },
        { telefono: tel2, relacion: rel2 },
        { telefono: tel3, relacion: rel3 }
    ];
    
    // Agregar contacto 4 solo si tiene teléfono
    if (tel4 && rel4) {
        contactos.push({ telefono: tel4, relacion: rel4 });
    }
    
    try {
        await set(ref(database, 'protegidos/' + codigo), {
            nombre: nombre,
            alergias: alergias,
            contactos: contactos,
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
        const protegidoRef = ref(database, 'protegidos/' + id);
        const snapshot = await get(protegidoRef);
        
        if (snapshot.exists()) {
            const datos = snapshot.val();
            
            let contactosHTML = '<div style="margin:15px 0;">';
            if (datos.contactos && datos.contactos.length > 0) {
                datos.contactos.forEach((contacto, index) => {
                    contactosHTML += `
                        <div style="background:#f5f5f5; padding:12px; margin:10px 0; border-radius:8px; border-left:4px solid #4A8FE4;">
                            <strong>Contacto ${index + 1}</strong><br>
                            📞 ${contacto.telefono} (${contacto.relacion})<br>
                            <button onclick="window.location.href='tel:${contacto.telefono}'" 
                                    style="background:#4A8FE4; color:white; border:none; padding:6px 18px; border-radius:5px; margin-top:8px; cursor:pointer; font-size:14px;">
                                📱 Llamar ahora
                            </button>
                        </div>
                    `;
                });
            }
            contactosHTML += '</div>';
            
            infoDiv.innerHTML = `
                <h2 style="color:#0A2647;">👤 ${datos.nombre}</h2>
                <div style="background:#f0f4f8; padding:15px; border-radius:10px; margin:15px 0;">
                    <p><strong>⚠️ Alergias:</strong> ${datos.alergias}</p>
                </div>
                <h3>📞 Contactos de emergencia</h3>
                ${contactosHTML}
            `;
        } else {
            infoDiv.innerHTML = `<div style="background:#FED7D7; padding:15px; border-radius:8px; color:#822727;">No se encontró información para esta pulsera</div>`;
        }
    } catch (error) {
        console.error("Error:", error);
        infoDiv.innerHTML = `<div style="background:#FED7D7; padding:15px; border-radius:8px; color:#822727;">Error al cargar datos</div>`;
    }
}

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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await set(ref(database, 'padres/' + user.uid), {
            email: email,
            pulseras: [],
            fecha_registro: new Date().toString()
        });
        
        mensaje.innerHTML = "✅ Cuenta creada. Redirigiendo...";
        mensaje.className = "alerta alerta-exito";
        mensaje.style.display = "block";
        
        setTimeout(() => {
            window.location.href = "panel.html";
        }, 1500);
        
    } catch (error) {
        console.error("Error:", error);
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
