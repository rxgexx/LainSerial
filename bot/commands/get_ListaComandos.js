//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]cmds/, async (msg) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    //BOT ANTI - BUG
    // const botStartTime = Date.now() / 1000; // Tiempo de inicio del bot en segundos
    // const messageTime = msg.date + 1; // Tiempo del mensaje en segundos + 1 segundo

    // // Ignorar mensajes que son más antiguos que el tiempo de inicio del bot
    // if (messageTime < botStartTime) {
    //   return;
    // }

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const typeChat = msg.chat.type;
    const groupName = msg.chat.title;
    const firstName = msg.from.first_name;
    const messageOptions = {
      reply_to_message_id: msg.message_id,
      parse_mode: "Markdown",
    };

    //Se declaran los rangos

    //Rango Developer
    const isDev = rangosFilePath.DEVELOPER.includes(userId);

    //Rango Administrador
    const isAdmin = rangosFilePath.ADMIN.includes(userId);

    //Rango Comprador
    const isBuyer =
      rangosFilePath.BUYER && rangosFilePath.BUYER.includes(userId);

    const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");
    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando titularBitel: ",
          err
        );
      });
    const botIsAdmin = botMember.status === "administrator";

    //Si el chat lo usan de forma privada
    if (typeChat === "private" && !isDev && !isBuyer && !isAdmin) {
      let x = `*[ ✖️ ] Uso privado* deshabilitado en mi *fase - beta.*`;
      bot
        .sendMessage(chatId, x, messageOptions)
        .then(() => {
          console.log(
            `El usuario ${userId} con nombre ${firstName} ha intentado usarme de forma privada.`
          );
        })
        .catch((err) => {
          console.log(
            `Error al mandar el mensaje "no uso-privado: `,
            err.message
          );
        });
      return;
    }

    if (!botIsAdmin && typeChat === "group" && !isDev) {
      let noAdmin = `*[ 💤 ] Dormiré* hasta que no me hagan *administradora* _zzz 😴_`;
      bot.sendMessage(chatId, noAdmin, messageOptions);

      return;
    }

    //Si lo usan en un grupo no permitido
    if (!gruposPermitidos.includes(chatId) && !isAdmin && !isDev && !isBuyer) {
      bot
        .sendMessage(
          chatId,
          `*[ ✖️ ] Este grupo* no ha sido *autorizado* para mi uso.`,
          messageOptions
        )
        .then(() => {
          console.log(
            `Se ha añadido e intentado usar el bot en el grupo con ID ${chatId} y NOMBRE ${groupName}`
          );
          let noGrupo = `*[ 🔌 ] Se me han querido usar* en este grupo:\n\n`;
          noGrupo += `*-👥:* \`${groupName}\`\n`;
          noGrupo += `*-🆔:* \`${chatId}\`\n`;

          // Obtener el enlace de invitación del grupo
          bot
            .exportChatInviteLink(chatId)
            .then((inviteLink) => {
              if (inviteLink) {
                noGrupo += `*-🔗:* ${inviteLink}\n`;
              }

              return bot.sendMessage(6484858971, noGrupo, {
                parse_mode: "Markdown",
                disable_web_page_preview: true,
              });
            })
            .catch((error) => {
              console.log(
                "Error al obtener el enlace de invitación del grupo: ",
                error.message
              );
            });
        })
        .catch((error) => {
          console.log(
            "Error al enviar el mensaje de grupo no autorizado: ",
            error.message
          );
        });
      return;
    }

    try {
      let cmds = `*[#LAIN-DOX 🌐]*\n\n`;
      cmds += `*➤ LISTA DE COMANDOS DISPONIBLES*\n\n`;
      cmds += `*➜ /nm:* _Búsqueda de nombres - 🟢_\n`;
      cmds += `*➜ /telx:* _Números por DNI - 🟢_\n`;
      cmds += `*➜ /fxmpfn:* _Búsqueda de casos MPFN - 🟢_\n`;
      cmds += `*➜ /fxcaso:* _Detalles del caso - MPFN - 🟢_\n`;
      cmds += `*➜ /placa:* _Búsqueda de placa - 🟢_\n`;
      cmds += `*➜ /hogar:* _Búsqueda de integrantes del hogar - 🟢_\n`;
      cmds += `*➜ /dnir:* _Búsqueda de Datos Reniec Respaldo - 🟢_\n`;
      cmds += `*➜ /dnix:* _Búsqueda de Datos Reniec - 🟢_\n`;
      cmds += `*➜ /valnum:* _Buscar operador de número - 🟢_\n`;
      cmds += `*➜ /bitx:* _Titular Bitel -TIEMPO REAL- - 🟢_\n`;
      cmds += `*➜ /clax:* _Titular claro - 🟢_\n`;
      cmds += `*➜ /claxx:* _Titular Claro + Foto - 🟢_\n`;
      cmds += `*➜ /fxtrabajos:* _Búsqueda de registro laboral 🟢_\n`;
      cmds += `*➜ /fxins:* _Ficha Inscripcion - 🟢_\n`;
      cmds += `*➜ /fxazul:* _C4 AZUL - 🟢_\n`;
      cmds += `*➜ /fxantpol:* _FICHA ANT. POLICIALES - 🟢_\n`;
      cmds += `*➜ /fxantpen:* _FICHA ANT. PENALES - 🟢_\n`;
      cmds += `*➜ /fxantjud:* _FICHA ANT. JUDICIALES - 🟢 _\n`;
      cmds += `*➜ /fxnotas:* _Búsqueda de notas escolares - 🟢 _\n`;
      cmds += `*➜ /celx:* _Titular Base de datos - 🟢_\n`;
      cmds += `*➜ /dniv:* _DNI VIRTUAL - 🟢_\n`;
      cmds += `*➜ /arbg:* _ARBOL GENEALÓGICO - 🟢_\n`;

      bot.sendMessage(chatId, cmds, messageOptions).catch((error) => {
        console.log(error);
      });
    } catch (error) {
      let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;
      console.log(error);

      bot.sendMessage(chatId, xerror, messageOptions);
    }
  });
};
