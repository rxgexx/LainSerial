const { promisePool } = require("./connection"); // Asegúrate de que 'db.js' es el archivo con la configuración de la conexión

async function obtenerBuyers() {
  try {
    const [rows] = await promisePool.query(
      "SELECT telegram_userid FROM compradores"
    );
    return rows.map((row) => row.telegram_userid); // Devuelve una lista de IDs de Telegram
  } catch (error) {
    console.error("Error al obtener los buyers:", error);
    return [];
  }
}

async function obtenerStarts() {
  try {
    const [rows] = await promisePool.query(
      "SELECT telegram_id FROM usuarios"
    );  
    return rows.map((row) => row.telegram_userid); // Devuelve una lista de IDs de Telegram
  } catch (error) {
    console.error("Error al obtener los buyers:", error);
    return [];
  }
}

module.exports = { obtenerBuyers, obtenerStarts };
