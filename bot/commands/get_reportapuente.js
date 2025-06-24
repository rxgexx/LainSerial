const { obtenerBuyers } = require("../../sql/obtenerbuyers.js");

module.exports = async (bot) => {
  const buyers = await obtenerBuyers();

  const mensajeHTML = `🚨 <b>¡Atención! Reporta a tu revendedor</b> 🚨

Si estás usando este bot a través de un <b>revendedor no oficial</b> (alguien que te dio un número y un código para acceder, pero no es la dueña oficial), <b>¡puedes reportarlo!</b>

📩 Contacta a la <b>única dueña oficial</b> 👉 <a href="https://t.me/SinFlowxr">@SinFlowxr</a> y envía pruebas del caso.

🎁 <b>¿Qué ganas al reportar?</b>
• Recuperas los <b>días restantes</b> de tu compra.  
• Al vencer tu acceso, podrás <b>renovar al mismo precio</b> que pagaste originalmente.

📢 Además, únete al canal <a href="https://t.me/CazandoPuentes">@CazandoPuentes</a> donde publicamos a los <b>revendedores cazados</b> y te mantenemos informado.

🙏 ¡Gracias por apoyar el uso legal y justo del bot!`;

  const enviarMensajeABuyers = async () => {
    for (const usuarioId of buyers) {
      try {
        await bot.sendMessage(usuarioId, mensajeHTML, { parse_mode: "HTML" });
      } catch (err) {
        console.error(`Error al enviar mensaje a ${usuarioId}:`, err.message);
      }
    }
  };

  // Enviar mensaje inmediatamente al iniciar
  await enviarMensajeABuyers();

  // Repetir cada 30 minutos
  setInterval(() => {
    enviarMensajeABuyers();
  }, 12 * 60 * 60 * 1000); // 12 horas en milisegundos
};
