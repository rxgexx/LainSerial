const cron = require("node-cron");
const { obtenerBuyers } = require("../../sql/obtenerbuyers.js");
const { obtenerStarts } = require("../../sql/obtenerbuyers.js");

module.exports = async (bot) => {
  const mensajeHTML = `🚨 <b>¡Atención! NUEVO BOT</b> 🚨

SE HA ESTRENADO NUEVO BOT: @LainData_Bot 👈👈👈👈
POR FAVOR, INICIA Y REGÍSTRATE EN EL NUEVO BOT: @LainData_Bot 👈👈👈👈


QUE TIENE EL NUEVO BOT❓ 👉 SE HAN AGREGADO Y MEJORADO COMANDOS. MAYOR COMPATIBILIDAD Y ESTABILIDAD MEJORADA.

📩 Contacta a la <b>única dueña oficial</b> 👉 <a href="tg://user?id=8016686263">VALERIA</a>.

👉👉👉👉👉ESTE BOT SERÁ APAGADO OFICIALMENTE EL DÍA VIERNES 14, PIDE TU MIGRACIÓN DE TU CUENTA CON TUS VENDEDORES. 
👉👉👉👉👉YA SE ESTÁ EMPEZANDO A MIGRAR CUENTAS`;

  const enviarMensajeABuyers = async () => {
    try {
      const buyers = await obtenerBuyers();
      for (const usuarioId of buyers) {
        try {
          await bot.sendMessage(usuarioId, mensajeHTML, { parse_mode: "HTML" });
        } catch (err) {
          console.error(`Error al enviar mensaje a ${usuarioId}:`, err.message);
        }
      }
    } catch (err) {
      console.error("Error al obtener la lista de buyers:", err.message);
    }
  };

    const enviarMensajeStart = async () => {
    try {
      const buyers = await obtenerStarts();
      for (const usuarioId of buyers) {
        try {
          await bot.sendMessage(usuarioId, mensajeHTML, { parse_mode: "HTML" });
        } catch (err) {
          console.error(`Error al enviar mensaje a ${usuarioId}:`, err.message);
        }
      }
    } catch (err) {
      console.error("Error al obtener la lista de buyers:", err.message);
    }
  };

  // Programar tareas a las 12:00 PM y 6:00 PM hora Perú (GMT-5)
  cron.schedule("0 12,18 * * *", async () => {
    await enviarMensajeABuyers();
    await enviarMensajeStart();
  }, {
    timezone: "America/Lima"
  });
};
