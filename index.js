document.addEventListener("DOMContentLoaded", () => {
    const qrContainer = document.getElementById("qrcode");
    const downloadBtn = document.getElementById("download-btn");
    const downloadVcfBtn = document.getElementById("download-vcf-btn");
    const listaTelefonos = document.getElementById("lista-telefonos");
    const btnAddTel = document.getElementById("btn-add-tel");

    // Campos simples (uno por cada input fijo)
    const campos = {
        nombre: document.getElementById("campo-nombre"),
        titulo: document.getElementById("campo-titulo"),
        email: document.getElementById("campo-email"),
        whatsapp: document.getElementById("campo-whatsapp"),
        telegram: document.getElementById("campo-telegram"),
        url: document.getElementById("campo-url"),
        ubicacion: document.getElementById("campo-ubicacion"),
        cumple: document.getElementById("campo-cumple"),
        nota: document.getElementById("campo-nota"),
        estilo: document.getElementById("campo-estilo"),
        color: document.getElementById("campo-color"),
        fondo: document.getElementById("campo-fondo"),
    };

    // Instancia del QR
    const qrCode = new QRCodeStyling({
        width: 280,
        height: 280,
        type: "svg",
        data: " ",
        dotsOptions: { color: "#6d4aff", type: "rounded" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "extra-rounded", color: "#6d4aff" },
        cornersDotOptions: { type: "dot", color: "#6d4aff" },
    });

    qrCode.append(qrContainer);

    // ---------------------------------------------------------
    // TELÉFONOS DINÁMICOS
    // ---------------------------------------------------------

    /**
     * Crea un bloque de input de teléfono con su selector de tipo y botón de borrar.
     * Lo inserta al final de la lista.
     */
    function agregarTelefono() {
        const fila = document.createElement("div");
        fila.className = "fila-telefono";

        // Selector de tipo
        const selectTipo = document.createElement("select");
        selectTipo.className = "tel-tipo";
        ["CELL", "HOME", "WORK"].forEach((tipo) => {
            const opt = document.createElement("option");
            opt.value = tipo;
            opt.textContent =
                tipo === "CELL"
                    ? "Celular"
                    : tipo === "HOME"
                      ? "Casa"
                      : "Trabajo";
            selectTipo.appendChild(opt);
        });

        // Input del número
        const inputNum = document.createElement("input");
        inputNum.type = "tel";
        inputNum.className = "tel-numero";
        inputNum.placeholder = "+52 55 1234 5678";

        // Botón de borrar
        const btnBorrar = document.createElement("button");
        btnBorrar.type = "button";
        btnBorrar.className = "btn-borrar-tel";
        btnBorrar.textContent = "✕";
        btnBorrar.addEventListener("click", () => {
            fila.remove(); // quitamos la fila del DOM
            actualizarQR(); // regeneramos el QR sin ese número
        });

        // Cuando el usuario escribe o cambia el tipo, actualizamos el QR
        inputNum.addEventListener("input", actualizarQR);
        selectTipo.addEventListener("change", actualizarQR);

        fila.appendChild(selectTipo);
        fila.appendChild(inputNum);
        fila.appendChild(btnBorrar);
        listaTelefonos.appendChild(fila);

        // Enfocamos el input recién creado (detalle de UX)
        inputNum.focus();

        // Actualizamos por si acaso (aunque esté vacío, no pasa nada)
        actualizarQR();
    }

    btnAddTel.addEventListener("click", agregarTelefono);

    // ---------------------------------------------------------
    // CONSTRUCCIÓN DE LA VCARD
    // ---------------------------------------------------------

    function construirVCard() {
        const lineas = ["BEGIN:VCARD", "VERSION:3.0"];

        const nombre = campos.nombre.value.trim() || "Sin nombre";
        lineas.push(`FN:${nombre}`);

        if (campos.titulo.value.trim())
            lineas.push(`TITLE:${campos.titulo.value.trim()}`);
        if (campos.email.value.trim())
            lineas.push(`EMAIL:${campos.email.value.trim()}`);
        if (campos.url.value.trim())
            lineas.push(`URL:${campos.url.value.trim()}`);

        // Teléfonos: recorremos todas las filas activas
        const filas = listaTelefonos.querySelectorAll(".fila-telefono");
        filas.forEach((fila) => {
            const tipo = fila.querySelector(".tel-tipo").value;
            const numero = fila.querySelector(".tel-numero").value.trim();
            if (numero) {
                lineas.push(`TEL;TYPE=${tipo}:${numero}`);
            }
        });

        // Ubicación (ADR). Formato: ADR:;;calle;ciudad;estado;cp;pais
        if (campos.ubicacion.value.trim()) {
            lineas.push(`ADR;TYPE=WORK:;;${campos.ubicacion.value.trim()};;;;`);
        }

        // Cumpleaños (BDAY). El input date ya da YYYY-MM-DD
        if (campos.cumple.value) {
            lineas.push(`BDAY:${campos.cumple.value}`);
        }

        // WhatsApp, Telegram y nota libre van dentro de NOTE
        const extras = [];
        if (campos.whatsapp.value.trim())
            extras.push(`WhatsApp: ${campos.whatsapp.value.trim()}`);
        if (campos.telegram.value.trim())
            extras.push(`Telegram: ${campos.telegram.value.trim()}`);
        if (campos.nota.value.trim()) extras.push(campos.nota.value.trim());
        if (extras.length > 0) lineas.push(`NOTE:${extras.join(" | ")}`);

        lineas.push("END:VCARD");
        return lineas.join("\n");
    }

    // ---------------------------------------------------------
    // ACTUALIZACIÓN DEL QR
    // ---------------------------------------------------------

    function actualizarQR() {
        const color = campos.color.value;
        const estilo = campos.estilo.value;

        qrCode.update({
            data: construirVCard(),
            dotsOptions: { color: color, type: estilo },
            backgroundOptions: { color: campos.fondo.value },
            cornersSquareOptions: { type: "extra-rounded", color: color },
            cornersDotOptions: { type: "dot", color: color },
        });
    }

    // Listeners para los campos fijos
    Object.values(campos).forEach((campo) => {
        campo.addEventListener("input", actualizarQR);
        campo.addEventListener("change", actualizarQR);
    });

    // Arrancamos con un teléfono ya listo
    agregarTelefono();
    actualizarQR();

    // ---------------------------------------------------------
    // DESCARGAS
    // ---------------------------------------------------------

    // Descargar el QR como PNG
    downloadBtn.addEventListener("click", () => {
    qrCode.download({ name: "mi-tarjeta-qr", extension: "png" });
    });

    // Descargar la vCard como archivo .vcf
    downloadVcfBtn.addEventListener("click", () => {
        const contenido = construirVCard();
        const blob = new Blob([contenido], { type: "text/vcard" });
        descargarBlob(blob, "mi-contacto.vcf");
    });

    /**
     * Función auxiliar: toma un Blob y fuerza su descarga.
     * La reutilizamos para el PNG y el VCF.
     */
    function descargarBlob(blob, nombreArchivo) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
});
