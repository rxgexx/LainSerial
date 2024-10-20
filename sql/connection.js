const mysql = require("mysql2");

// Configuración del pool de conexiones
const pool = mysql.createPool({
  host: "161.132.48.228",
  user: "root",
  password: "andy2003",
  database: "lainserial_mensual",
  connectionLimit: 10 // Ajusta según tus necesidades
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
