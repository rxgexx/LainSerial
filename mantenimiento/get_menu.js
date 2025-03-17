//SE REQUIERE fs
const fs = require("fs");

//SE REQUIERE "path"
const path = require("path");

//IMAGEN BUSCANDO
const imagenCommands = path.join(__dirname, "../img/commandList.jpg");



//MENSAJES
const { messages } = require("../bot/config/messages.js");
const { registrarConsulta } = require("../sql/consultas.js");

//KEYBOARD
let firstKeyBoards;

//cxmmnds

//USERS COMMANDS
const userCommand = {};

module.exports = (bot) => {
  bot.onText(/[\/.$?!]menu/, (msg) => {
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const typeChat = msg.chat.type;
    const groupName = msg.chat.title;
    const firstName = msg.from.first_name;
    const messageOptions = {
      reply_to_message_id: msg.message_id,
      parse_mode: "Markdown",
    };

    const botStartTime = Date.now() / 1000;
    const messageTime = msg.date + 1;

    if (messageTime < botStartTime) {
      return;
    }

    // Marcamos al usuario como que ha invocado el comando
    userCommand[userId] = true;

    try {
      firstKeyBoards = {
        inline_keyboard: [
          [{ text: "𝐑𝐞𝐧𝐢𝐞𝐜.👤", callback_data: "reniecBotton" }],
          [
            { text: "𝐆𝐞𝐧𝐞𝐫𝐚𝐝𝐨𝐫𝐞𝐬.⚙️", callback_data: "generadoresBotton" },
            { text: "𝐓𝐞𝐥𝐞𝐟𝐨𝐧𝐢𝐚.☎️", callback_data: "telefoniaBotton" },
          ],
        ],
      };

      bot.sendPhoto(chatId, imagenCommands, {
        reply_markup: JSON.stringify(firstKeyBoards),
        caption: `${messages.inicioCommands(firstName)}`,
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  });

  bot.on("callback_query", (callbackQuery) => {
    const action = callbackQuery.data;
    const userId = callbackQuery.from.id;
    const firstName = callbackQuery.from.first_name;

    const botonesReniec_1 = {
      inline_keyboard: [
        [
          { text: "🏠", callback_data: "inicionBoton_Reniec" },
          { text: "→→→", callback_data: "adelanteBoton_Reniec_1" },
        ],
      ],
    };
    const botonesReniec_2 = {
      inline_keyboard: [
        [
          { text: "←←←", callback_data: "atrasBoton_Reniec_2" },
          { text: "🏠", callback_data: "inicionBoton_Reniec" },
          { text: "→→→", callback_data: "adelanteBoton_Reniec_2" },
        ],
      ],
    };
    const botonesReniec_3 = {
      inline_keyboard: [
        [
          { text: "←←←", callback_data: "atrasBoton_Reniec_3" },
          { text: "🏠", callback_data: "inicionBoton_Reniec" },
        ],
      ],
    };

    // Verificar si el usuario tiene permisos para realizar la acción
    if (!userId) {
      bot.answerCallbackQuery(
        callbackQuery.id,
        "Lo siento, no tienes permisos para realizar esta acción."
      );
      return;
    } else {
      if (userCommand[userId]) {
        switch (action) {
          case "reniecBotton":
            const messageId = callbackQuery.message.message_id;
            bot.editMessageCaption(`${messages.botonesReniec_1()}`, {
              reply_markup: JSON.stringify(botonesReniec_1), //<- SE USA BOTONESRENIEC_1 PORQUE ES LA PRIMERA PÁGINA QUE SE DEBE USAR
              chat_id: callbackQuery.message.chat.id,
              message_id: messageId,
              parse_mode: "Markdown",
            });

            break;

          default:
            break;
        }

        //RENIEC COMANDOS <-
        switch (action) {
          case "adelanteBoton_Reniec_1":
            const messageId_1 = callbackQuery.message.message_id;
            bot.editMessageCaption(`${messages.botonesReniec_2()}`, {
              reply_markup: JSON.stringify(botonesReniec_3), //SE PONE 3 PORQUE ES LA ULTIMA PÁGINA, Y HA 2
              chat_id: callbackQuery.message.chat.id,
              message_id: messageId_1,
              parse_mode: "Markdown",
            });
        }
        switch (action) {
          case "atrasBoton_Reniec_3":
            const messageId_1 = callbackQuery.message.message_id;
            bot.editMessageCaption(`${messages.botonesReniec_1()}`, {
              reply_markup: JSON.stringify(botonesReniec_1), //SE PONE 3 PORQUE ES LA ULTIMA PÁGINA, Y HA 2
              chat_id: callbackQuery.message.chat.id,
              message_id: messageId_1,
              parse_mode: "Markdown",
            });
        }

        if (userCommand[userId]) {
          switch (action) {
            case "inicionBoton_Reniec":
              const messageId_1 = callbackQuery.message.message_id;
              bot.editMessageCaption(`${messages.inicioCommands(firstName)}`, {
                reply_markup: JSON.stringify(firstKeyBoards), //SE PONE 3 PORQUE ES LA ULTIMA PÁGINA, Y HA 2
                chat_id: callbackQuery.message.chat.id,
                message_id: messageId_1,
                parse_mode: "Markdown",
              });
          }
        }
      }
    }
  });
};
