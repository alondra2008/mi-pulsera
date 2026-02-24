import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGfmmdSDsYrpgYz5nt2ebvfBhIXRTKXzu",
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
    
    // Datos generales (opcionales)
    const nombre = document.getElementById("nombre").value.trim() || "Anónimo";
    const edad = document.getElementById("edad").value.trim() || "";
    const condicion = document.getElementById("condicion").value.trim() || "";
    const alergias = document.getElementById("alergias").value.trim();
    const tipoSangre = document.getElementById("tipoSangre").value.trim() || "";
    const notas = document.getElementById("notas").value.trim() || "";
    
    // Contactos (obligatorios)
    const contacto1_tel = document.getElementById("contacto1_tel").value.trim();
    const contacto1_rel = document.getElementById("contacto1_rel").value.trim();
    const contacto2_tel = document.getElementById("contacto2_tel").value.trim();
    const contacto2_rel = document.getElementById("contacto2_rel").value.trim();
    const contacto3_tel = document.getElementById("contacto3_tel").value.trim();
    const contacto3_rel = document.getElementById("contacto3_rel").value.trim();
    
    // Validar alergias y teléfonos
    if (!alergias) {
        alert("❌ Las alergias son obligatorias");
        return;
    }
    
    if (!contacto1_tel || !contacto1_rel || !contacto2_tel || !contacto2_rel || !contacto3_tel || !contacto3_rel) {
        alert("❌ Los 3 contactos de emergencia con teléfono y relación son obligatorios");
        return;
    }
    
    // Construir objeto de contactos
    const contactos = [
        {
            nombre: document.getElementById("contacto1_nombre").value.trim() || "",
            telefono: contacto1_tel,
            relacion: contacto1_rel
        },
        {
            nombre: document.getElementById("contacto2_nombre").value.trim() || "",
            telefono: contacto2_tel,
            relacion: contacto2_rel
        },
        {
            nombre: document.getElementById("contacto3_nombre").value.trim() || "",
            telefono: contacto3_tel,
            relacion: contacto3_rel
        }
    ];
    
    try {
        await set(ref(database, 'menores/' + codigo), {
            nombre: nombre,
            edad: edad,
            condicion: condicion,
            alergias: alergias,
            tipoSangre: tipoSangre,
            contactos: contactos,
            notas: notas,
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
        const menorRef = ref(database, 'menores/' + id);
        const snapshot = await get(menorRef);
        
        if (snapshot.exists()) {
            const datos = snapshot.val();
            
            // Construir HTML de contactos
            let contactosHTML = '';
            if (datos.contactos && Array.isArray(datos.contactos)) {
                datos.contactos.forEach((contacto, index) => {
                    const nombreContacto = contacto.nombre || `Contacto ${index+1}`;
                    contactosHTML += `
                        <div class="contacto-item">
                            <strong>${nombreContacto}</strong> (${contacto.relacion || '?'})<br>
                            📞 ${contacto.telefono}
                            <button class="btn-llamar" onclick="window.location.href='tel:${contacto.telefono}'">
                                Llamar
                            </button>
                        </div>
                    `;
                });
            }
            
            // Información médica
            let infoMedica = '';
            if (datos.tipoSangre) infoMedica += `• Tipo de sangre: ${datos.tipoSangre}<br>`;
            if (datos.edad) infoMedica += `• Edad: ${datos.edad}<br>`;
            if (datos.condicion) infoMedica += `• ${datos.condicion}<br>`;
            
            infoDiv.innerHTML = `
                <h2>👤 ${datos.nombre}</h2>
                
                <div class="card">
                    ${infoMedica ? `<p>${infoMedica}</p>` : ''}
                    <p><strong>⚠️ Alergias:</strong> ${datos.alergias}</p>
                </div>
                
                <h3>📞 Contactos de emergencia</h3>
                ${contactosHTML || '<p>No hay contactos registrados</p>'}
                
                ${datos.notas ? `
                    <div class="card">
                        <p><strong>💬 Notas:</strong> ${datos.notas}</p>
                    </div>
                ` : ''}
            `;
        } else {
            infoDiv.innerHTML = `<div class="alerta alerta-peligro">No se encontró información</div>`;
        }
    } catch (error) {
        console.error("Error:", error);
        infoDiv.innerHTML = `<div class="alerta alerta-peligro">Error al cargar datos: ${error.message}</div>`;
    }
}

// ============================================
// FUNCIONES PARA LOGIN (login.html) - IGUAL
// ============================================
// (Se mantienen igual que en tu código anterior)

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
