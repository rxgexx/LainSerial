const { promisePool } = require("./connection"); // Asegúrate de que 'db.js' es el archivo con la configuración de la conexión

// ID de Telegram de la programadora (solo ella puede banear y desbanear)
const PROGRAMADORA_ID = "6484858971";

// Función para agregar un comprador
async function addBuyer(telegramUserId, vendedorId) {
  try {
    // Verificar si el usuario está baneado
    const [rows] = await promisePool.query(
      "SELECT isBan FROM compradores WHERE telegram_userid = ?",
      [telegramUserId]
    );

    if (rows.length > 0 && rows[0].isBan) {
      return {
        success: false,
        message: "Este usuario está baneado y no puede ser agregado.",
        status: "ban", // Cambiado a string
      };
    }

    // Fechas de inicio y fin
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + 30); // 30 días de suscripción

    // Insertar comprador
    await promisePool.query(
      "INSERT INTO compradores (telegram_userid, fecha_inicio, fecha_fin, isBan, vendedor) VALUES (?, ?, ?, ?, ?)",
      [telegramUserId, fechaInicio, fechaFin, false, vendedorId] // Eliminados los valores extras
    );

    return { success: true, message: "Comprador agregado exitosamente." };
  } catch (err) {
    console.error("Error al agregar comprador:", err);
    return { success: false, message: "Error al agregar comprador." };
  }
}


// Función para eliminar un comprador
async function delBuyer(telegramUserId) {
  try {
    const [result] = await promisePool.query(
      "DELETE FROM compradores WHERE telegram_userid = ?",
      [telegramUserId]
    );

    if (result.affectedRows > 0) {
      return { success: true, message: "Comprador eliminado exitosamente." };
    } else {
      return { success: false, message: "No se encontró al comprador." };
    }
  } catch (err) {
    console.error("Error al eliminar comprador:", err);
    return { success: false, message: "Error al eliminar comprador." };
  }
}

// Función para banear un usuario (solo programadora)
async function banUser(telegramUserId, userRequestId) {
  if (userRequestId !== PROGRAMADORA_ID) {
    return {
      success: false,
      message: "No tienes permiso para banear usuarios.",
    };
  }

  try {
    const [result] = await promisePool.query(
      "UPDATE compradores SET isBan = TRUE WHERE telegram_userid = ?",
      [telegramUserId]
    );

    if (result.affectedRows > 0) {
      return { success: true, message: "Usuario baneado exitosamente." };
    } else {
      return { success: false, message: "No se encontró al usuario." };
    }
  } catch (err) {
    console.error("Error al banear usuario:", err);
    return { success: false, message: "Error al banear usuario." };
  }
}

// Función para desbanear un usuario (solo programadora)
async function desbanUser(telegramUserId, userRequestId) {
  if (userRequestId !== PROGRAMADORA_ID) {
    return {
      success: false,
      message: "No tienes permiso para desbanear usuarios.",
    };
  }

  try {
    const [result] = await promisePool.query(
      "UPDATE compradores SET isBan = FALSE WHERE telegram_userid = ?",
      [telegramUserId]
    );

    if (result.affectedRows > 0) {
      return { success: true, message: "Usuario desbaneado exitosamente." };
    } else {
      return { success: false, message: "No se encontró al usuario." };
    }
  } catch (err) {
    console.error("Error al desbanear usuario:", err);
    return { success: false, message: "Error al desbanear usuario." };
  }
}

module.exports = { addBuyer, delBuyer, banUser, desbanUser };
