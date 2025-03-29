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

    const { checkIsBuyer } = require("../../sql/checkbuyer");
    //Rango Comprador
    const isBuyer = await checkIsBuyer(userId);

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
      cmds += `*➜ /nm2:* _Búsqueda de nombres RESPALDO - 🟢_\n`;
      cmds += `*➜ /correos:* _Correos registrados - 🟢_\n`;
      cmds += `*➜ /telx:* _Números por DNI - 🟢_\n`;
      cmds += `*➜ /telx2:* _Números por DNI en una 2da base de datos - 🟢_\n`;
      cmds += `*➜ /fonos:* _Números por DNI en una 3da base de datos - 🟢_\n`;
      cmds += `*➜ /osiptel:* _Números por DNI en tiempo real - 🟢_\n`;
      cmds += `*➜ /fiscalia:* _Búsqueda de casos FISCALES x DNI - 🟢_\n`;
      cmds += `*➜ /fispdf:* _Búsqueda de casos FISCALES x DNI PDF- 🟢_\n`;
      // cmds += `*➜ /mpfn:* _Búsqueda de casos MPFN + PDF - 🟢_\n`;
      // cmds += `*➜ /fxcaso:* _Detalles del caso - MPFN - 🟢_\n`;
      cmds += `*➜ /placa:* _Búsqueda de placa - 🟢_\n`;
      cmds += `*➜ /tive:* _TIVE en tiempo real - 🟢_\n`;
      cmds += `*➜ /hogar:* _Búsqueda de integrantes del hogar - 🟢_\n`;
      cmds += `*➜ /dnix:* _Búsqueda de Datos Reniec - 🟢_\n`;
      // cmds += `*➜ /actanaci:* _Búsqueda de ACTA DE NACIMIENTO - 🟢_\n`;
      // cmds += `*➜ /actadefu:* _Búsqueda de ACTA DE DEFUNCIÓN - 🟢_\n`;
      // cmds += `*➜ /actamatri:* _Búsqueda de ACTA DE MATRIMONIO - 🟢_\n`;
      cmds += `*➜ /valnum:* _Buscar operador de número - 🟢_\n`;
      cmds += `*➜ /bitx:* _Titular Bitel -TIEMPO REAL- - 🟢_\n`;
      cmds += `*➜ /movx:* _Titular Movistar -TIEMPO REAL- - 🟢_\n`;
      cmds += `*➜ /clax:* _Titular claro - 🟢_\n`;
      cmds += `*➜ /claxx:* _Titular Claro + Foto - 🟢_\n`;
      // cmds += `*➜ /movdni:* _Números Movistar x DNI -TIEMPO REAL- - 🟢_\n`;
      cmds += `*➜ /cladni:* _Números Claro x DNI -TIEMPO REAL- - 🟢_\n`;
      // cmds += `*➜ /entel:* _Titular Entel en tiempo real - 🟢_\n`;
      cmds += `*➜ /trabajos:* _Búsqueda de registro laboral 2DA FUENTE🟢_\n`;
      cmds += `*➜ /fxtrabajos:* _Búsqueda de registro laboral 🟢_\n`;
      cmds += `*➜ /fxins:* _Ficha Inscripcion - 🟢_\n`;
      cmds += `*➜ /c4b:* _C4 BLANCO - 🟢_\n`;
      cmds += `*➜ /fxazul:* _C4 AZUL - 🟢_\n`;
      cmds += `*➜ /fxantpol:* _FICHA ANT. POLICIALES - 🟢_\n`;
      cmds += `*➜ /fxantpen:* _FICHA ANT. PENALES - 🟢_\n`;
      cmds += `*➜ /fxantjud:* _FICHA ANT. JUDICIALES - 🟢 _\n`;
      // cmds += `*➜ /rq:* _Consulta RQ de una persona - 🟢 _\n`;
      // cmds += `*➜ /rqpla:* _Consulta RQ de un vehículo - 🟢 _\n`;
      // cmds += `*➜ /anteper:* _Consulta Antecdentes de una persona - 🟢 _\n`;
      cmds += `*➜ /celx:* _Titular Base de datos - 🟢_\n`;
      cmds += `*➜ /celx2:* _Titular en segunda Base de datos - 🟢_\n`;
      cmds += `*➜ /dniv:* _DNI VIRTUAL - 🟢_\n`;
      cmds += `*➜ /dnie:* _DNI VIRTUAL ELECTRÓNICO- 🟢_\n`;
      cmds += `*➜ /bienes:* _Bienes SUNARP por DNI - 🟢_\n`;
      cmds += `*➜ /insve:* _Ficha Inscripcion Vehicular - 🟢_\n`;
      cmds += `*➜ /bolinf:* _Boleta Informativa Vehicular - 🟢_\n`;
      cmds += `*➜ /sbs:* _Reporte SBS- 🟢_\n`;
      // cmds += `*➜ /migra:* _Reporte migratorio textual- 🟢_\n`;
      // cmds += `*➜ /migrapdf:* _Reporte migratorio en PDF- 🟢_\n`;
      cmds += `*➜ /seeker:* _Búsqueda de datos generales en tiempo real por SEEKER en PDF - 🟢_\n`;
      cmds += `*➜ /arbg:* _ARBOL GENEALÓGICO - 🟢_\n`;
      // cmds += `*➜ /arbg2:* _ARBOL GENEALÓGICO RESPALDO- 🟢_\n`;
      cmds += `*➜ /arbgv:* _ARBOL GENEALÓGICO VISUAL- 🟢_\n`;
      cmds += `*➜ /ruc:* _DATOS RUC- 🟢_\n`;
      cmds += `*➜ /reve:* _Estado RECORD de Brevete- 🟢_\n`;
      cmds += `*➜ /pap:* _PAPELETAS por el SAT- 🟢_\n`;
      cmds += `*➜ /revitec:* _Detallado de revisiones ténicas con placa.- 🟢_\n`;
      cmds += `*➜ /fxnotas:* _Búsqueda de notas escolares_ - 🟢 `;

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
