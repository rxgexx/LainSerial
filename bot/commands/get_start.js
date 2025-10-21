/*//PATH
const path = require("node:path");

//IMAGEN
const imageStart = path.join(__dirname, "../img/startImg.png");

//MENSAJES
const { messages } = require("../config/messages.js");

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    //BOT ANTI - BUG
    // const botStartTime = Date.now() / 1000; // Tiempo de inicio del bot en segundos
    // const messageTime = msg.date + 1; // Tiempo del mensaje en segundos + 1 segundo

    // // Ignorar mensajes que son más antiguos que el tiempo de inicio del bot
    // if (messageTime < botStartTime) {
    //   return;
    // }

    //Ayudas rápidas como declarar nombres, opciones de mensajes, chatId, etc
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
      const textoStart = messages.startMessages(firstName);

      // //BOTÓN
      // const firstKeyBoards = {
      //   inline_keyboard: [
      //     [
      //       {
      //         text: "𝘾𝙊𝙈𝙋𝙍𝘼 𝙏𝙐 𝘼𝘾𝘾𝙀𝙎𝙊 🛒",
      //         url: "https://t.me/SinFlowxr",
      //       },
      //     ],
      //   ],
      // };

      bot
        .sendPhoto(chatId, imageStart, {
          caption: textoStart,
          reply_to_message_id: msg.message_id,
          parse_mode: "Markdown",
        })
        .catch((error) => {
          console.log("Error al envíar el mensaje de bienvenida: ", error);
        });
    } catch (error) {
      console.log("Error en el comando start: ", error.message);
    }
  });
};
*/
// PATH
// PATH
const path = require("node:path");
const {promisePool} = require("../../sql/connection.js"); // tu conexión MySQL

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
      // Insertar o actualizar en MySQL
      await promisePool.query(
        `INSERT INTO usuarios (telegram_id, first_name) 
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE 
         first_name = VALUES(first_name)`,
        [userId, firstName]
      );

      const textoStart = messages.startMessages(firstName);

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

