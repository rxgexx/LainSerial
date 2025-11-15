// PATH
const path = require("node:path");

// IMAGEN
const imageStart = path.join(__dirname, "../img/startImg.png");

// MENSAJES
const { messages } = require("../config/messages.js");

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    // POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    // Datos del mensaje
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const typeChat = msg.chat.type;
    const groupName = msg.chat.title;
    const firstName = msg.from.first_name;
    const messageOptions = {
      reply_to_message_id: msg.message_id,
      parse_mode: "Markdown",
    };

    try {
      // // Insertar o actualizar en MySQL
      // await promisePool.query(
      //   `INSERT INTO usuarios (telegram_id, first_name)
      //    VALUES (?, ?)
      //    ON DUPLICATE KEY UPDATE
      //    first_name = VALUES(first_name)`,
      //   [userId, firstName]
      // );

      const textoStart = messages.startMessages();

      // Enviar mensaje con imagen
      await bot.sendPhoto(chatId, imageStart, {
        caption: textoStart,
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error en el comando start:", error.message);
    }
  });
};
