// const { promisePool } = require("./connection"); // Importamos el pool de conexiones
// const moment = require("moment-timezone");

// // Función para resetear las consultas diarias si es un nuevo día
// const resetearConsultasDiarias = async (telegramId) => {
//   try {
//     const fechaActual = moment().tz("America/Lima").format("YYYY-MM-DD");

//     // Obtener el último registro del usuario
//     const [rows] = await promisePool.query(
//       `SELECT fecha_creacion FROM compradores WHERE telegram_id = ?`,
//       [telegramId]
//     );

//     if (rows.length > 0) {
//       const fechaCreacion = moment(rows[0].fecha_creacion)
//         .tz("America/Lima")
//         .format("YYYY-MM-DD");

//       // Si la fecha de creación es diferente a la actual, reseteamos consultas diarias
//       if (fechaActual !== fechaCreacion) {
//         await promisePool.query(
//           `UPDATE compradores SET consultas_diarias = 0, fecha_creacion = NOW() WHERE telegram_id = ?`,
//           [telegramId]
//         );
//         console.log(`Consultas diarias reseteadas para ${telegramId}`);
//       }
//     }
//   } catch (err) {
//     console.error("Error al resetear consultas diarias:", err);
//   }
// };

// // Función para rastrear consultas
// const rastrearConsulta = async (telegramId) => {
//   try {
//     await resetearConsultasDiarias(telegramId);

//     // Actualizar las consultas totales y diarias
//     await promisePool.query(
//       `UPDATE compradores 
//        SET consultas_totales = consultas_totales + 1, 
//            consultas_diarias = consultas_diarias + 1 
//        WHERE telegram_id = ?`,
//       [telegramId]
//     );

//     console.log(`Consultas actualizadas para ${telegramId}`);
//   } catch (err) {
//     console.error("Error al rastrear consulta:", err);
//   }
// };

// module.exports = { rastrearConsulta };
