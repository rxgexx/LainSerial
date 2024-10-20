const { promisePool } = require("./connection"); // Importamos el pool de conexiones

// Función para verificar si el usuario es vendedor
async function isVendedor(telegramUserId) {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM vendedores WHERE telegram_userid = ?",
      [telegramUserId]
    );

    // Si el resultado tiene al menos una fila, el usuario es un vendedor
    return rows.length > 0;
  } catch (err) {
    console.error("Error al verificar vendedor:", err);
    return false; // En caso de error, se retorna false
  }
}

// Función para agregar un vendedor
async function addVendedor(telegramUserId) {
  try {
    // Verificar si el vendedor ya existe
    const [rows] = await promisePool.query(
      "SELECT * FROM vendedores WHERE telegram_userid = ?",
      [telegramUserId]
    );

    if (rows.length > 0) {
      return { success: false, message: "Este vendedor ya está agregado." };
    }

    // Insertar nuevo vendedor en la base de datos
    await promisePool.query(
      "INSERT INTO vendedores (telegram_userid) VALUES (?)",
      [telegramUserId]
    );

    return { success: true, message: "Vendedor agregado exitosamente." };
  } catch (err) {
    console.error("Error al agregar vendedor:", err);
    return { success: false, message: "Error al agregar vendedor." };
  }
}

// Función para eliminar un vendedor
async function deleteVendedor(telegramUserId) {
  try {
      // Verificar si el vendedor existe
      const [rows] = await promisePool.query(
          "SELECT * FROM vendedores WHERE telegram_userid = ?",
          [telegramUserId]
      );

      // Si no se encuentra el vendedor, retornar un mensaje
      if (rows.length === 0) {
          return { success: false, message: "Este vendedor no existe." };
      }

      // Eliminar vendedor de la base de datos
      await promisePool.query(
          "DELETE FROM vendedores WHERE telegram_userid = ?",
          [telegramUserId]
      );

      return { success: true, message: "Vendedor eliminado exitosamente." };
  } catch (err) {
      console.error("Error al eliminar vendedor:", err);
      return { success: false, message: "Error al eliminar vendedor." };
  }
}

module.exports = { addVendedor, deleteVendedor, isVendedor };
