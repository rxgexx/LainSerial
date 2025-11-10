const { obtenerBuyers } = require("../../sql/obtenerbuyers.js");
const { promisePool } = require("../../sql/connection.js");
const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");

async function obtenerIniciados() {
  try {
    const [rows] = await promisePool.query("SELECT telegram_id FROM usuarios");
    return rows.map((row) => row.telegram_id);
  } catch (error) {
    console.error("Error al obtener iniciados:", error);
    return [];
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function eliminarUsuario(tabla, telegram_id) {
  const columna = tabla === "compradores" ? "telegram_userid" : "telegram_id";
  try {
    await promisePool.query(`DELETE FROM ${tabla} WHERE ${columna} = ?`, [
      telegram_id,
    ]);
    console.log(`🗑️ Usuario ${telegram_id} eliminado de tabla '${tabla}'`);
  } catch (error) {
    console.error(
      `❌ Error al eliminar usuario ${telegram_id} de ${tabla}:`,
      error.message
    );
  }
}

module.exports = (bot) => {
  bot.onText(/\/aaaddxx1/, async (msg) => {
    try {
      const buyers = await obtenerBuyers();
      const iniciados = await obtenerIniciados();

      console.log(
        "📦 Buyers:",
        buyers.length,
        "Usuarios iniciados:",
        iniciados.length
      );

      const idDueña = 8362630963; // ID de la nueva cuenta oficial
      const enlaceCanal = "https://t.me/+3wg61KTkS-9iMjU5"; // Enlace real del canal

      const anuncio = `
<b>[ ☁️ LAIN_DATA ]</b>  
<b>¡Hola!</b> 👋  

🛰️ <b>Nuevo bot disponible:</b> <a href="https://t.me/LainData_Bot">@LainData_Bot</a>  
🔥 <b>Regístrate y disfruta las nuevas funciones:</b>  
➤ Mayor compatibilidad  
➤ Más estabilidad  
➤ Comandos mejorados  

📢 POR FAVOR, INICIA Y REGÍSTRATE EN EL NUEVO BOT, SI ERES CLIENTE SERÁ DE MUCHA IMPORTANCIA PARA TRASLADAR TU MEMBRESÍA. CONTACTA A TU VENDEDOR, EN ESTOS DÍAS SE ESTARÁ DANDO INFORMANDO CUANDO INICIA EL NUEVO BOT.

💬 <b>Opciones de contacto:</b>  
• <b>Contactar con la dueña</b> (compras, soporte).  
• <b>Unirte al canal oficial</b> (novedades, precios y actualizaciones).
`;

      const opciones = {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💬 Contactar con la dueña",
                url: `tg://user?id=${idDueña}`,
              },
            ],
            [{ text: "📣 Unirse al canal oficial", url: enlaceCanal }],
          ],
        },
      };

      let enviadosExito = 0;
      let eliminadosBuyers = 0;
      let eliminadosIniciados = 0;

      // --- ENVIAR A BUYERS ---
      for (const usuarioId of buyers) {
        try {
          await bot.sendMessage(usuarioId, anuncio, opciones);
          enviadosExito++;
          await delay(400);
        } catch (error) {
          console.error(`⚠️ Buyer ${usuarioId} error: ${error.message}`);
          if (
            error.message.includes("bot was blocked by the user") ||
            error.message.includes("user is deactivated") ||
            error.message.includes("chat not found")
          ) {
            await eliminarUsuario("compradores", usuarioId);
            eliminadosBuyers++;
          }
        }
      }

      // --- ENVIAR A INICIADOS ---
      for (const usuarioId of iniciados) {
        try {
          await bot.sendMessage(usuarioId, anuncio, opciones);
          enviadosExito++;
          await delay(400);
        } catch (error) {
          console.error(`⚠️ Iniciado ${usuarioId} error: ${error.message}`);
          if (
            error.message.includes("bot was blocked by the user") ||
            error.message.includes("user is deactivated") ||
            error.message.includes("chat not found")
          ) {
            await eliminarUsuario("usuarios", usuarioId);
            eliminadosIniciados++;
          }
        }
      }

      // --- ENVIAR A GRUPOS ---
      for (const grupoId of gruposPermitidos) {
        try {
          const sentMessage = await bot.sendMessage(grupoId, anuncio, opciones);
          // comentar si el bot no tiene permiso para fijar
          // await bot.pinChatMessage(grupoId, sentMessage.message_id);
          enviadosExito++;
          await delay(800);
        } catch (error) {
          console.error(`⚠️ Grupo ${grupoId} error: ${error.message}`);
        }
      }

      // --- REPORTE FINAL ---
      const totalEliminados = eliminadosBuyers + eliminadosIniciados;
      const reporte = `
📊 <b>Reporte de envío:</b>

✅ Enviados con éxito: <b>${enviadosExito}</b>  
🗑️ Eliminados de buyers: <b>${eliminadosBuyers}</b>  
🗑️ Eliminados de usuarios: <b>${eliminadosIniciados}</b>  
📉 Total eliminados: <b>${totalEliminados}</b>  

<b>Proceso finalizado correctamente.</b>`;

      console.log(reporte);
      bot.sendMessage(msg.chat.id, reporte, { parse_mode: "HTML" });
    } catch (error) {
      console.error("Error general al enviar mensaje:", error);
      bot.sendMessage(msg.chat.id, `❌ Error general: ${error.message}`);
    }
  });
};
