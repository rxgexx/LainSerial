const { promisePool } = require("./connection"); // Asegúrate de importar el pool de conexiones

// Función para verificar si el usuario es comprador
async function checkIsBuyer(telegramUserId) {
  try {
    // Consulta para verificar si el usuario es comprador
    const [rows] = await promisePool.query(
      "SELECT * FROM compradores WHERE telegram_userid = ?",
      [telegramUserId]
    );

    if (rows.length === 0) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error al verificar si es comprador:", err);
    return { success: false, message: "Error al verificar comprador." };
  }
}

module.exports = { checkIsBuyer };
