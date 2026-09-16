const path = require("node:path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const { leerJson } = require("./archivos");

const PORT = 3000;
const rutaDatos = path.join(__dirname, "..", "datos", "mascotas.json");

async function main() {
  const mascotas = await leerJson(rutaDatos);
  const app = express();

  // Configuración de motor de vistas y middlewares
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));
  app.use(expressLayouts);
  app.set("layout", "layouts/main");
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(express.urlencoded({ extended: false }));

  // Portada
  app.get("/", (req, res) => {
    res.render("inicio", { titulo: "Inicio" });
  });

  // Catálogo general
  app.get("/mascotas", (req, res) => {
    res.render("mascotas/lista", {
      titulo: "Mascotas en adopción",
      mascotas,
    });
  });

  // Formulario de alta (obligatorio antes de :id)
  app.get("/mascotas/nueva", (req, res) => {
    res.render("mascotas/nueva", {
      titulo: "Dar en adopción",
      error: null,
      valores: {},
    });
  });

  // Ficha de detalle
  app.get("/mascotas/:id", (req, res) => {
    const id = Number(req.params.id);
    const mascota = mascotas.find((elemento) => elemento.id === id);

    if (!mascota) {
      return res.status(404).render("no-encontrado", {
        titulo: "Mascota no encontrada",
        mensaje: "No existe una mascota con ese identificador.",
      });
    }

    res.render("mascotas/detalle", {
      titulo: `Ficha de ${mascota.nombre}`,
      mascota,
    });
  });

  // Procesamiento del formulario
  app.post("/mascotas", (req, res) => {
    const { nombre, especie, edad, estado, descripcion } = req.body;

    const nombreLimpio = String(nombre ?? "").trim();
    const especieLimpia = String(especie ?? "").trim();
    const estadoLimpio = String(estado ?? "").trim();
    const descripcionLimpia = String(descripcion ?? "").trim();
    const edadNumero = Number(edad);

    if (
      !nombreLimpio ||
      !especieLimpia ||
      !estadoLimpio ||
      !descripcionLimpia ||
      Number.isNaN(edadNumero) ||
      edadNumero < 0
    ) {
      return res.status(400).render("mascotas/nueva", {
        titulo: "Dar en adopción",
        error: "Completá todos los campos con valores válidos (edad debe ser 0 o mayor).",
        valores: req.body,
      });
    }

    const ultimoId = mascotas.reduce(
      (mayorId, m) => Math.max(mayorId, m.id),
      0
    );

    mascotas.push({
      id: ultimoId + 1,
      nombre: nombreLimpio,
      especie: especieLimpia,
      edad: edadNumero,
      estado: estadoLimpio,
      descripcion: descripcionLimpia,
      imagen: "/img/mascota.svg",
    });

    res.redirect("/mascotas");
  });

  // Manejo de 404 para cualquier otra ruta
  app.use((req, res) => {
    res.status(404).render("no-encontrado", {
      titulo: "Página no encontrada",
      mensaje: "La página que buscás no existe o fue movida.",
    });
  });

  app.listen(PORT, () => {
    console.log(`Aplicación disponible en http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error("No se pudo iniciar la aplicación:", error.message);
  process.exitCode = 1;
});