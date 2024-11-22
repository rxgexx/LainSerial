const path = require("path");
const img = path.join(__dirname, "../img/anuncioSidpol.jpg");

// FUNCION OBTENER BUYERS
const { obtenerBuyers } = require("../../sql/obtenerbuyers.js");

module.exports = (bot) => {
  bot.onText(/\/anuncio/, async (msg) => {
    try {
      // Obtener lista de compradores (buyers) y grupos permitidos
      const buyers = await obtenerBuyers();
      const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");

      let anuncio = `*- 🌐 𝐋𝐀𝐈𝐍 𝐃𝐎𝐗* ➤ #UPDATE *-:*\n\n`;
      anuncio += `*Se agregaron respaldos.*\n\n`;
      anuncio += `Queridos usuarios, *ante mano* disculpas por las constantes fallas que ha tenido el Bot estas semanas, se está mejorando lo más posible el rendimento y la estabilidad de este. *Para eso* se ha agregado 2 nuevos comandos - respaldo:\n\n`;
      anuncio += `  \`⌞\` */nm2:* Consulta de Nombres - Respaldo\n`;
      anuncio += `  \`⌞\` */arbg2:* Árbol genealógico - Respaldo\n`;
      anuncio += `\`-\` Gracias por pertenecer a este proyecto. *Atte: Valeria - @SinFlowxr - Programadora y desarrolladora del Bot.*\n\n`;

      for (const usuarioId of buyers) {
        try {
          const chatInfo = await bot.getChat(usuarioId);

          const sentMessage = await bot.sendPhoto(usuarioId, img, {
            caption: anuncio,
            parse_mode: "Markdown",
          });
          await bot.pinChatMessage(usuarioId, sentMessage.message_id); // Fija el mensaje en el chat
        } catch (error) {
          console.error(
            `No se pudo enviar mensaje a usuario ${usuarioId}:`,
            error
          );
        }
      }

      for (const grupoId of gruposPermitidos) {
        try {
          const chatInfo = await bot.getChat(grupoId);

          const sentMessage = await bot.sendPhoto(grupoId, img, {
            caption: anuncio,
            parse_mode: "Markdown",
          });
          await bot.pinChatMessage(grupoId, sentMessage.message_id); // Fija el mensaje en el grupo
        } catch (error) {
          console.error(`No se pudo enviar mensaje a grupo ${grupoId}:`, error);
        }
      }

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
