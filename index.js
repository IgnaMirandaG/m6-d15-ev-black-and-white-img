import express from 'express';
import jimp from 'jimp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
})

//MIDDLEWARES:
//dejar publica la carpeta public
app.use(express.static("public"));
//procesar datos json y disponerlos en req.body
app.use(express.json());

//RUTA VISTA PRINCIPAL HTML:
app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "./public/index.html"));
});

//RUTA POST PARA RECIBIR Y PROCESAR IMAGEN
app.post("/procesar-imagen", async (req, res) => { 
    try {
    //captar URL ingresada en el body
    let { imagen: imagenUrl } = req.body;
    // validación para verificar URL de imagen
    if (!imagenUrl) {
        return res.status(400).json({
            message: "Error: debe enviar una ruta válida para la imagen."
        })
    }

    //variable para procesar la imagen de forma asíncrona
    let respuesta = await new Promise((resolve, reject) => {
        jimp.read(imagenUrl, (error, procesarImagen) => {
            if (error) {
                reject("Error al leer la imagen.");
            }

            //generación de un ID único para el nombre de la imagen
            const nombreId = uuidv4().slice(30);

            // let nuevoNombre = `${nombreId}.jpg`;

            //obtener la extensión de la imagen
            // let extension = imagenUrl._originalMime.split("/")[1];
            let extension = procesarImagen.getExtension();

            //construir la ruta para guardar la imagen procesada
            let storageImagen = path.resolve(__dirname, `./public/storage/${nombreId}.${extension}`);

            //método para procesar y guardar la imagen
            //redimensionar a 350px, calidad 100%, cambiar a escala de grises
            procesarImagen.resize(350, jimp.AUTO).quality(100).greyscale().write(storageImagen, (err) => {
                if (err) {
                    reject("Error al guardar la imagen.");
                } else {
                    //Resolver la promesa con el nombre del archivo guardado
                    resolve(`${nombreId}.${extension}`);
                }
            });
        });
    });

    // Redirigir al usuario a la página de visualización de la imagen
    res.redirect(`/api/image/${respuesta}`);


        //mmanejar cualquier error del proceso    
    } catch (error) {
        res.status(500).send("Error en proceso de guardar la imagen")
    }
});

// RUTA PARA MOSTRAR UNA IMAGEN PROCESADA
app.get("/api/image/:nombre", (req, res) => {
    res.sendFile(path.resolve(__dirname, "./public/image.html"));
});

// RUTA DEFAULT PARA URLS NO EXISTENTES
app.get("*", (req, res) => {
    res.send("Esta página no existe...")
});
