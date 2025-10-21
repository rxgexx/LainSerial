const {
  addBuyer,
  delBuyer,
  banUser,
  desbanUser,
} = require("../../sql/mnguser"); // Asegúrate de que la ruta sea correcta

const {
  addVendedor,
  deleteVendedor,
  isVendedor,
} = require("../../sql/mngvendedor");

module.exports = (bot) => {
  // Manejo del comando /adduser
  bot.onText(/\/addbuyer (\d+)/, async (msg, match) => {
    const comprador_ID = match[1]; // User ID de Telegram
    const vendedor_ID = msg.from.id;

    const userId = msg.from.id;

    const vendedor = await isVendedor(vendedor_ID);
    console.log(vendedor);

    try {
      // const responseMessage = await addBuyer();
      if (!vendedor) {
        return bot.sendMessage(msg.chat.id, "Comando no permitido");
      }
      await addBuyer(comprador_ID, vendedor_ID);

      bot.sendMessage(
        msg.chat.id,
        `cliente ${comprador_ID} añadido exitosamente :)`
      );
      bot.sendMessage(
        8194230892,
        `VENDEDOR ${msg.from.first_name} | ${msg.from.id} | ${msg.from.username} a añadido al cliente ${comprador_ID}`
      );
      console.log(msg);
    } catch (error) {
      console.log(error);

      bot.sendMessage(msg.chat.id, `error al añadir`);
    }
  });

  // Manejo del comando /adduser
  bot.onText(/\/delbuyer (\d+) (.+)/, async (msg, match) => {
    const comprador_ID = match[1]; // User ID de Telegram
    const razon = match[2]; // User ID de Telegram
    const vendedor_ID = msg.from.id;

    const userId = msg.from.id;

    const vendedor = await isVendedor(vendedor_ID);
    console.log(vendedor);

    try {
      // const responseMessage = await addBuyer();
      if (!vendedor) {
        return bot.sendMessage(msg.chat.id, "Comando no permitido");
      }
      await delBuyer(comprador_ID, vendedor_ID);

      bot.sendMessage(
        msg.chat.id,
        `cliente ${comprador_ID} eliminado exitosamente :)`
      );
      bot.sendMessage(
        8194230892,
        `VENDEDOR ${msg.from.first_name} | ${msg.from.id} | ${msg.from.username} a eliminado al cliente ${comprador_ID}|| RAZON: ${razon}`
      );
      console.log(msg);
    } catch (error) {
      console.log(error);

      bot.sendMessage(msg.chat.id, `error al añadir`);
    }
  });
  // Manejo de errores de polling
  bot.on("polling_error", (error) => {
    console.error("Error en el bot de Telegram:", error);
  });
};
