//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const path = require("path");
const rangosFilePath = require("../config/rangos/rangos.json");

const chatIdsToForward = rangosFilePath.DEVELOPER; // Reemplaza con los IDs de los chats deseados

module.exports = (bot) => {
  bot.onText(/\/enviaranuncio/, (msg) => {
    const chatId = msg.chat.id;
    const message = "¡Este es un anuncio importante!"; // Mensaje a enviar
    const imagePath = path.join(__dirname, "../img/min_pdf.jpg"); // Ruta a la imagen a enviar

    // Envía el mensaje y la imagen a cada chat
    chatIdsToForward.forEach((id) => {
      bot.sendPhoto(id, imagePath, { caption: message });
    });

    // Confirmación al usuario
    bot.sendMessage(chatId, "Anuncio enviado a todos los chats configurados.");
  });

};
