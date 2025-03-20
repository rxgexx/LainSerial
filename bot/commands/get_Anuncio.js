const path = require("path");
const img = path.join(__dirname, "../img/anuncio10.jpg");

// FUNCION OBTENER BUYERS
const { obtenerBuyers } = require("../../sql/obtenerbuyers.js");

module.exports = (bot) => {
  bot.onText(/\/aaaddxx1/, async (msg) => {
    try {
      // Obtener lista de compradores (buyers) y grupos permitidos
      const buyers = await obtenerBuyers();
      const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");

      let anuncio = `*Estimado Usuario, se han agregado nuevos comandos 🚀!*\n\n`
      anuncio += `*Como medida de actualización para este año,* se está cumpliendo con agregar nuevos comandos al +sistema.+\n\n`
      anuncio += `  \`➜\` */fispdf:* Obtén los casos y detallado fiscales de un *DNI en PDF*\n\n`
      anuncio += `  \`➜\` */c4b:* c4 blanco\n\n`
      anuncio += `*Cualquier duda, contáctame: @SinFlowxr - Programadora y creadora del Bot.*`

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
