//FUNCIONES
const { addBuyer, delBuyer } = require("../config/fx/mng_Buyer");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

module.exports = (bot) => {
  bot.onText(/\/addbuyer (.+)/, (msg, match) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    //BOT ANTI - BUG
    const botStartTime = Date.now() / 1000; // Tiempo de inicio del bot en segundos
    const messageTime = msg.date + 1; // Tiempo del mensaje en segundos + 1 segundo

    // Ignorar mensajes que son más antiguos que el tiempo de inicio del bot
    if (messageTime < botStartTime) {
      return;
    }
    //POLLING ERROR
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
    //Se declaran los rangos

    //Rango Developer
    const isDev = rangosFilePath.DEVELOPER.includes(userId);

    //Usuario a agregar
    const userToAdd = match[1];

    if (isDev) {
      try {
        addBuyer(userToAdd);

        let x = `*[ 🚀 ] Querida administradora,* la compra se ha realizó con éxito, el usuario \`${userToAdd}\` ha sido agregado al rango _BUYER_ de manera satisfactoria.`;

        bot.sendMessage(chatId, x, messageOptions).catch((error) => {
          console.log(
            "Error al envíar el mensaje de - compra con éxito - : ",
            error
          );
        });

        let y = `*[ 🚀 ] Gracias por comprar* tu acceso!`;
        bot.sendMessage(userToAdd, y, { parse_mode: "Markdown" });
      } catch (error) {
        console.log(error);
      }
    }
  });

  // Comando para eliminar usuario del rango BUYER
  bot.onText(/\/delbuyer (.+)/, (msg, match) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    //BOT ANTI - BUG
    const botStartTime = Date.now() / 1000; // Tiempo de inicio del bot en segundos
    const messageTime = msg.date + 1; // Tiempo del mensaje en segundos + 1 segundo

    // Ignorar mensajes que son más antiguos que el tiempo de inicio del bot
    if (messageTime < botStartTime) {
      return;
    }

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

    const isDev = rangos.DEVELOPER.includes(userId);

    const delUser = match[1];

    const userEliminado = delBuyer(delUser);

    let y = `*[ ✖️ ] Usuario eliminado* correctamente.`;

    if (isDev) {
      try {
        if (userEliminado.mensaje === "El usuario no está en el rango BUYER.") {
          bot.sendMessage(
            chatId,
            `*[ ✖️ ] El usuario no está en el rango BUYER.*`,
            messageOptions
          );
        } else {
          bot.sendMessage(chatId, y, messageOptions).catch((error) => {
            console.log(
              "Error al envíar el mensaje de - eliminado correctamente - : ",
              error
            );
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  });
};
