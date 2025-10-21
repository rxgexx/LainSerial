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
    await promisePool.query(`DELETE FROM ${tabla} WHERE ${columna} = ?`, [telegram_id]);
    console.log(`🗑️ Usuario ${telegram_id} eliminado de tabla '${tabla}'`);
  } catch (error) {
    console.error(`❌ Error al eliminar usuario ${telegram_id} de ${tabla}:`, error.message);
  }
}

module.exports = (bot) => {
  bot.onText(/\/aaaddxx1/, async (msg) => {
    try {
      const buyers = await obtenerBuyers();
      const iniciados = await obtenerIniciados();

      console.log("📦 Buyers:", buyers.length, "Usuarios iniciados:", iniciados.length);

      const idDueña = 8194230892; // ID de la nueva cuenta oficial
      const enlaceCanal = "https://t.me/+3wg61KTkS-9iMjU5"; // Enlace real del canal

      const anuncio = `
<b>📢 COMUNICADO IMPORTANTE — CUENTA OFICIAL</b>

👋 Hola, soy la <b>programadora y vendedora oficial del bot</b>.  
Por motivos de seguridad y ataques recientes, mi cuenta principal ha cambiado.

💬 <b>Nueva cuenta oficial:</b> <a href="tg://user?id=${idDueña}">Contactar con la dueña</a>  
📣 <b>Canal oficial:</b> <a href="${enlaceCanal}">Unirse al canal</a>

Si quieres obtener la forma de contacto directa conmigo también puedes usar el comando <code>/contacto</code>.

⚠️ <b>Por favor:</b>
- No respondas a otras cuentas que digan ser del equipo.  
- Las cuentas antiguas ya no están activas.  
- Cualquier compra, renovación o duda, <b>solo se atiende desde la nueva cuenta</b>.

Si en caso no contesto y necesitan ayuda o soporte, contacten con <b>@Morty_Ma</b>

Gracias por tu confianza 💙  
<b>— La programadora del bot</b>
`;

      const opciones = {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💬 Contactar con la dueña", url: `tg://user?id=${idDueña}` }],
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
