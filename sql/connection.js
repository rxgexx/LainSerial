const mysql = require("mysql2");

// Configuración del pool de conexiones
const pool = mysql.createPool({
  host: "161.132.68.46",
  user: "valeria",
  password: "Valeria2005@@",
  database: "lainserial_mensual",
  connectionLimit: 100 // Ajusta según tus necesidades
});

// Verificar la conexión
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
  } else {
    console.log("Conexión exitosa a la base de datos");
    connection.release(); // Liberar la conexión después de usarla
  }
});

// Promisify para usar async/await
const promisePool = pool.promise();

module.exports = { promisePool };
