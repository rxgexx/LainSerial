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
  bot.onText(/\/addvendedor (\d+)/, async (msg, match) => {
    const vendedorToAdd = match[1]; // User ID de Telegram
    const programmerId = msg.from.id;
    const chatid = msg.chat.id;
    console.log(programmerId);

    if (programmerId !== 6484858971) {
      console.log("no admin");

      return;
    }

    try {
      const vendedor = await addVendedor(vendedorToAdd);

      bot.sendMessage(chatid, `vendedor ${vendedorToAdd} añadido`);
      console.log(vendedor);
    } catch (error) {
      console.log(error);

      bot.sendMessage(msg.chat.id, "error al añadir");
    }
  });

  // Manejo del comando /adduser
  bot.onText(/\/delvendedor (\d+)/, async (msg, match) => {
    const vendedorToDelete = match[1]; // User ID de Telegram
    const programmerId = msg.from.id;
    const chatid = msg.chat.id;
    console.log(programmerId);

    if (programmerId !== 6484858971) {
      console.log("no admin");

      return;
    }

    try {
      const vendedor = await deleteVendedor(vendedorToDelete);

      bot.sendMessage(chatid, `vendedor ${vendedorToDelete} eliminado`);
      console.log(vendedor);
    } catch (error) {
      console.log(error);

      bot.sendMessage(msg.chat.id, "error al eliminar");
    }
  });

  // Manejo de errores de polling
  bot.on("polling_error", (error) => {
    console.error("Error en el bot de Telegram:", error);
  });
};
