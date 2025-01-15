const path = require("path");
const img = path.join(__dirname, "../img/anuncioSidpol.jpg");

// FUNCION OBTENER BUYERS
const { obtenerBuyers } = require("../../sql/obtenerbuyers.js");

module.exports = (bot) => {
  bot.onText(/\/aaaddxx1/, async (msg) => {
    try {
      // Obtener lista de compradores (buyers) y grupos permitidos
      const buyers = await obtenerBuyers();
      const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");

      // let anuncio = `*- 🌐 𝐋𝐀𝐈𝐍 𝐃𝐎𝐗* ➤ #UPDATE *-:*\n\n`;
      // anuncio += `*Se agregaron comandos.*\n\n`;
      // anuncio += `Queridos usuarios, *se les comunica que se ha agregado* los nuevos comando movdni y cladni:\n\n`;
      // anuncio += `  \`⌞\` */movdni:* Consulta de números Movistar por DNI - Tiempo Real\n`;
      // anuncio += `  \`⌞\` */cladni:* Consulta de números Claro por DNI - Tiempo Real\n`;
      // // anuncio += `  \`⌞\` */arbg2:* Árbol genealógico - Respaldo\n`;
      // anuncio += `\`-\` Gracias por pertenecer a este proyecto. *Atte: Valeria - @SinFlowxr - Programadora y desarrolladora del Bot.*\n\n`;


      let anuncio = `*ATENCION CLIENTES OFICIALES!!*\n\n`
      anuncio = `SI TU COMPRASTE ACCESO AL BOT LAIN A ALGUNO QUE NO SEA LA PROGRAMADORA - @sinflowxr - o algún vendedor oficial ([véase la lista de vendedores oficiales acá](https://t.me/LainDox_Info/434)) ESTÁS A TIEMPO DE REPORTAR A LA PERSONA * QUE TE REEVENDIO LA CUENTA*, YA QUE ESTÁ TAJANTEMENTE PROHIBIDO HACERLO. SI REPORTAS TE LLEVARÁS UN DESCUENTO AL COMPRAR EL BOT CONMIGO, @sinflowxr - programadora y unica developer del bot -. SI TU ERES UN REEVENDEDOR, NO IMPORTA SI TIENES 1 DIA EL BOT SE TE QUITARA EL ACCESO SIN DERECHO A RECLAMO. SI TU ERES UN PUENTERO TAMBIEN SE QUITARA EL ACCESO.\n\n`
      anuncio = `RECUERDA QUE SI COMPRASTE ACCESO A UN VENDEDOR NO OFICIAL, Y LO REPORTAS, TE LLEVARÁS DESCUENTO CONMIGO @sinflowxr.\n\n`
      anuncio = `SI VES ESTO Y PERTENECES A ALGÚN GRUPO AUTORIZADO DEL BOT, QUEDATE TRANQUILO PORQUE CONTIGO NO ES, SOLO CON LOS REEVENDORES DE ACCESO PRIVADO. E IGUAL SI ALGUIEN TE QUISO VENDER ACCESO PRIVADO Y NO ES VENDEDOR OFICIAL IGUALMENTE ME LO REPORTAS @sinflowxr`

      for (const usuarioId of buyers) {
        try {
          const chatInfo = await bot.getChat(usuarioId);

          const sentMessage = await bot.sendPhoto(usuarioId, img, {
            caption: anuncio,
            parse_mode: "Markdown",
          });
          await bot.pinChatMessage(usuarioId, sentMessage.message_id); // Fija el mensaje en el chat
        } catch (error) {
          console.error(
            `No se pudo enviar mensaje a usuario ${usuarioId}:`,
            error
          );
        }
      }

      // for (const grupoId of gruposPermitidos) {
      //   try {
      //     const chatInfo = await bot.getChat(grupoId);

      //     const sentMessage = await bot.sendPhoto(grupoId, img, {
      //       caption: anuncio,
      //       parse_mode: "Markdown",
      //     });
      //     await bot.pinChatMessage(grupoId, sentMessage.message_id); // Fija el mensaje en el grupo
      //   } catch (error) {
      //     console.error(`No se pudo enviar mensaje a grupo ${grupoId}:`, error);
      //   }
      // }

      bot.sendMessage(
        msg.chat.id,
        "Mensaje con foto enviado a todos los usuarios 'BUYER' y grupos permitidos."
      );
    } catch (error) {
      console.error("Error al enviar mensaje con foto:", error);
      // Manejar el error según sea necesario
    }
  });
};
