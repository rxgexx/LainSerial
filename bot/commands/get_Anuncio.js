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

      let anuncio = `*Estimado Usuario, únete ya al nuevo bot y atento a las nuevas noticias @LainData_Bot 🚀!, este bot será el principal en unos días, no te pierdas de nada.* (SI TIENES UN PLAN ACTIVO NO TE PREOCUPES, TU PLAN SEGUIRÁ EN EL NUEVO BOT)\n\n`;

      for (const usuarioId of buyers) {
        try {
          const chatInfo = await bot.getChat(usuarioId);

          const sentMessage = await bot.sendMessage(usuarioId, anuncio, {
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

      // for (const grupoId of gruposPermitidos) {
      //   try {
      //     const chatInfo = await bot.getChat(grupoId);

      //     const sentMessage = await bot.sendPhoto(grupoId, img, {
      //       caption: anuncio,
      //       parse_mode: "Markdown",
      //     });
      //     await bot.pinChatMessage(grupoId, sentMessage.message_id); // Fija el mensaje en el grupo
      //   } catch (error) {
      //     console.error(`No se pudo enviar mensaje a grupo ${grupoId}:`, error);
      //   }
      // }

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
