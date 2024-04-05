const fs = require("fs");
const path = require("path");
const img = path.join(__dirname, "../img/anuncio_3.jpg");

module.exports = (bot) => {
  bot.onText(/\/anuncio/, async (msg) => {
    try {
      // Leer el archivo JSON que contiene los IDs de usuarios y grupos permitidos
      const usuarios = require("../config/rangos/rangos.json");
      const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");

      // Filtrar solo los IDs de usuarios que están en la categoría "BUYER"
      const buyers = usuarios.BUYER;

      let anuncio = `*¡NUEVOS COMANDO DISPONIBLE! 📢*\n\n`;
      anuncio += `*Se han agregado comando ACTAS OFICIALES* 💥✨\n\n`;
      anuncio += `*Utiliza: /actnaci para ACTA DE NACIMIENTO, /actdefu para ACTA DE DEFUNCIÓN, /actmatri para ACTA DE MATRIMONIO.*\n\n`;
      anuncio += `*También se agregó el comando /movdni para buscar línea de teléfonos de un CLIENTE MOVISTAR.*\n\n`;

      // Iterar sobre los usuarios "BUYER"
      for (const usuarioId of buyers) {
        try {
          // Verificar si el usuario es accesible para el bot
          const chatInfo = await bot.getChat(usuarioId);
          // Si el usuario es accesible, enviar el mensaje con la foto
          await bot.sendPhoto(usuarioId, img, {
            caption: anuncio,
            parse_mode: "Markdown",
          });
        } catch (error) {
          console.error(`No se pudo enviar mensaje a usuario ${usuarioId}:`, error);
        }
      }

      // Iterar sobre los grupos permitidos
      for (const grupoId of gruposPermitidos) {
        try {
          // Verificar si el grupo es accesible para el bot
          const chatInfo = await bot.getChat(grupoId);
          // Si el grupo es accesible, enviar el mensaje con la foto
          await bot.sendPhoto(grupoId, img, {
            caption: anuncio,
            parse_mode: "Markdown",
          });
        } catch (error) {
          console.error(`No se pudo enviar mensaje a grupo ${grupoId}:`, error);
        }
      }

      // Enviar un mensaje de confirmación al usuario que inició el comando
      bot.sendMessage(
        msg.chat.id,
        "Mensaje con foto enviado a todos los usuarios 'BUYER' y grupos permitidos."
      );
    } catch (error) {
      console.error("Error al enviar mensaje con foto:", error);
      // Manejar el error según sea necesario
    }
  });
};
