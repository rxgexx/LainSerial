const { registrarConsulta } = require("../../sql/consultas.js");
const { infRUC } = require("../api/api_Variados");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");


//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//FS
const fs = require("fs");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]ruc (.+)/, async (msg, match) => {
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

    //Ayudas rápidas como declarar nombres, opciones de mensajes, chatId, etc
    const ruc = match[1];
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
          "Error al obtener la información del Bot en el comando datosNum: ",
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

    //Se verifica si el usuario tiene un anti - spam agregado
    if (!isDev && !isAdmin) {
      const tiempoEspera = antiSpam[userId] || 0;
      const tiempoRestante = Math.max(
        0,
        tiempoEspera - Math.floor(Date.now() / 1000)
      );
      if (tiempoRestante > 0) {
        //Se envía el mensaje indicado cuanto tiempo tiene
        bot.sendMessage(
          chatId,
          `*[ ✖️ ] ${firstName},* debes esperar \`${tiempoRestante} segundos\` para volver a utilizar este comando.`,
          messageOptions
        );
        delete usuariosEnConsulta[userId];
        return;
      }
    }
    if (ruc.length !== 11) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/ruc\`*]* seguido de un número de *DNI* de \`11 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/ruc 20139538561\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`DATOS\` del *➜ RUC* \`${ruc}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //RESPONSE TITULAR
      const responseTitular = await infRUC(ruc);
      const dataRuc = responseTitular.data;

      if (dataRuc === null && responseTitular.status === false) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        const yx = `*[ ✖️ ] No se encontró datos para el RUC* \`${ruc}\`.`;

        bot.sendMessage(chatId, yx, messageOptions);
      } else {
        const datosRuc = dataRuc.datosRuc;

        const nombreComercial = datosRuc["Nombre Comercial"];
        const fechaInscripcion = datosRuc["Fecha de Inscripción"];
        const estadoContribuyente = datosRuc["Estado del Contribuyente"];
        const condicionContribuyente = datosRuc["Condición del Contribuyente"];
        const domicilioFiscal = datosRuc["Domicilio Fiscal"];
        const comprobanteElectronico = datosRuc["Comprobantes Electrónicos"];
        const tipoContribuyente = datosRuc["Tipo Contribuyente"];
        const Padrones = datosRuc["Padrones"];
        // Normalizar a array
        const actividades = Array.isArray(
          datosRuc["Actividad(es) Económica(s)"]
        )
          ? datosRuc["Actividad(es) Económica(s)"]
          : [datosRuc["Actividad(es) Económica(s)"]];

        let representantes =
          dataRuc.represetantes &&
          Array.isArray(dataRuc.represetantes) &&
          dataRuc.represetantes.length > 0
            ? dataRuc.represetantes[0]
            : null;

        let cargo = representantes?.cargo || null;
        let fechaDesde = representantes?.fechaDesde || null;
        let nombre = representantes?.nombre || null;
        let numDocumento = representantes?.numDocumento || null;
        let tipDocumento = representantes?.tipDocumento || null;

        // CONSTRUCCION DEL MENSAJE

        let mensaje = `<b>[#LAIN-DOX 🌐] ➤ #DATOS_RUC</b>\n\n`;
        mensaje += `<b>[ ☑️ ] DATOS RUC DE - </b><code>${ruc}</code> - <b>🚗</b>\n\n`;
        mensaje += `<b>➤ DATOS PUBLICADO 📂:</b>\n\n`;

        mensaje += `  <code>⌞</code> <b>NOM. COMERCIAL:</b> <code>${nombreComercial}</code>\n`;
        mensaje += `  <code>⌞</code> <b>FEC. INSCRIPCIÓN:</b> <code>${fechaInscripcion}</code>\n`;
        mensaje += `  <code>⌞</code> <b>PADRONES:</b> <code>${Padrones}</code>\n`;
        mensaje += `  <code>⌞</code> <b>COMPROBATE ELECTRÓNICO:</b> <code>${comprobanteElectronico}</code>\n`;
        mensaje += `  <code>⌞</code> <b>TIPO.CONTRIBUYENTE:</b> <code>${tipoContribuyente}</code>\n`;
        mensaje += `  <code>⌞</code> <b>ESTADO. CONTRIBUYENTE:</b> <code>${estadoContribuyente}</code>\n`;
        mensaje += `  <code>⌞</code> <b>CONDICIÓN CONTRIBUYENTE:</b> <code>${condicionContribuyente}</code>\n`;
        mensaje += `  <code>⌞</code> <b>DOMICILIO FISCAL:</b> <code>${domicilioFiscal}</code>\n\n`;

        mensaje += `<b>➤ REPRESENTANTE LEGAL 👨‍⚖️:</b>\n\n`;

        if (!representantes) {
          mensaje += `  <code>⌞</code> <b>No se encontró REPRENSENTANTE LEGAL</b>\n\n`;
        } else {
          mensaje += `  <code>⌞</code> <b>CARGO:</b> <code>${cargo}</code>\n`;
          mensaje += `  <code>⌞</code> <b>DESDE:</b> <code>${fechaDesde}</code>\n`;
          mensaje += `  <code>⌞</code> <b>NOMBRE:</b> <code>${nombre}</code>\n`;
          mensaje += `  <code>⌞</code> <b>NUM. DOC:</b> <code>${numDocumento}</code>\n`;
          mensaje += `  <code>⌞</code> <b>TIP. DOC:</b> <code>${tipDocumento}</code>\n\n`;
        }

        mensaje += `<b>➤ CONSULTADO POR:</b>\n`;
        mensaje += `  <code>⌞</code> <b>USUARIO:</b> <code>${userId}</code>\n`;
        mensaje += `  <code>⌞</code> <b>NOMBRE:</b> <code>${firstName}</code>\n\n`;
        mensaje += `<b>MENSAJE:</b> <i>La consulta se hizo de manera exitosa ♻.</i>\n\n`;

        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        bot
          .sendMessage(chatId, mensaje, {
            reply_to_message_id: msg.message_id,
            parse_mode: "HTML",
          })
          .then(async() => {
            await registrarConsulta(userId, firstName, `RUC`, ruc, true);
            //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
            if (!isDev && !isAdmin && !isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
            }
            //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
            else if (isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
            }
          });

        let mensaje2 = `<b>[#LAIN-DOX 🌐] ➤ #DATOS_RUC</b>\n\n`;
        mensaje2 += `<b>[ ☑️ ] DATOS RUC DE - </b><code>${ruc}</code> - <b>🚗</b>\n\n`;
        mensaje2 += `<b>➤ ACTIVIDADES ECONÓMICAS 📊:</b>\n\n`;

        if (actividades) {
          // Iterar sobre el array
          actividades.forEach((actividad, index) => {
            const numero = index + 1;
            mensaje2 += `  <code>⌞</code> <b>ACTIVIDAD ${numero}:</b> <code>${actividad}</code>\n`;
          });

          mensaje2 += `\n\n`;

          mensaje2 += `<b>➤ CONSULTADO POR:</b>\n`;
          mensaje2 += `  <code>⌞</code> <b>USUARIO:</b> <code>${userId}</code>\n`;
          mensaje2 += `  <code>⌞</code> <b>NOMBRE:</b> <code>${firstName}</code>\n\n`;
          mensaje2 += `<b>MENSAJE:</b> <i>La consulta se hizo de manera exitosa ♻.</i>\n\n`;

          bot.sendMessage(chatId, mensaje2, {
            reply_to_message_id: msg.message_id,
            parse_mode: "HTML",
          });
        }
      }
    } catch (error) {
      let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;
      console.log(error);
      await bot
        .deleteMessage(chatId, consultandoMessage.message_id)
        .then(() => {
          bot.sendMessage(chatId, xerror, messageOptions);
        });
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
