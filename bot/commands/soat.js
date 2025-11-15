//SE REQUIERE fs
const fs = require("fs");

//SE REQUIERE "pdfkit"
const PDFDocument = require("pdfkit");

//APIS
const { soat_pdf } = require("../api/api_Variados.js");

//SE REQUIERE "path"
const path = require("path");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");
const { registrarConsulta } = require("../../sql/consultas.js");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]soat (.+)/, async (msg, match) => {
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
    const placa = match[1];
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

    const { checkIsBuyer } = require("../../sql/checkbuyer.js");
    //Rango Comprador
    const isBuyer = await checkIsBuyer(userId);

    const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");
    const gruposBloqueados = require("../config/gruposManager/gruposBloqueados.js");

    const grupoBloqueado = gruposBloqueados.includes(chatId);

    if (grupoBloqueado) {
      try {
        if (isDev) {
          let messageAdmin = `*[ ☑️ ] La prueba ha sido exitosa* querida administradora.`;

          bot.sendMessage(chatId, messageAdmin, messageOptions).then(() => {
            console.log("Test Positivo");
          });

          return;
        } else {
          let grupoBloqueado = `*[ ✖️ ] Grupo bloqueado*`;

          bot.sendMessage(chatId, grupoBloqueado, messageOptions).then(() => {
            console.log("Grupo bloqueado");
          });

          return;
        }
      } catch (error) {
        console.log("Error en la detección de grupo bloqueado: ", error);
      }
    }

    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando Ficha Azul: ",
          err
        );
      });
    const botIsAdmin = botMember.status === "administrator";

    //Si el chat lo usan de forma privada
    if (typeChat === "private" && !isDev && !isBuyer) {
      let x = `*[ ✖️ ] PORFAVOR, VE AL NUEVO BOT @LainData_Bot, ESTE BOT HA SIDO DEJADO EN DESUSO. SI SIGUES TENIENDO UN PLAN ACTIVO CON NOSOTROS, VE AL BOT NUEVO Y COMÚNICATE CON LA DUEÑA O ADMINS*`;

      const opts = {
        ...messageOptions,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔗 Grupo PÚBLICO 🛡️",
                url: "https://t.me/+-nHDtyXT-V45Yjlh",
              },
            ],
          ],
        },
      };

      bot
        .sendMessage(chatId, x, opts)
        .then(() => {
          console.log(
            `El usuario ${userId} con nombre ${firstName} ha intentado usarme de forma privada.`
          );
        })
        .catch((err) => {
          console.log(
            `Error al mandar el mensaje "no uso-privado": `,
            err.message
          );
        });

      return;
    }

    if (!botIsAdmin && typeChat === "group" && !isDev) {
      let noAdmin = `*[ ✖️ ] Dormiré* hasta que no me hagan *administradora* _zzz 😴_`;
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
          if (botIsAdmin) {
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
          } else {
            return bot.sendMessage(6484858971, noGrupo, {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            });
          }
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
          `*[ ⏳ ] ${firstName},* debes esperar \`${tiempoRestante} segundos\` para volver a utilizar este comando.`,
          messageOptions
        );
        delete usuariosEnConsulta[userId];
        return;
      }
    }

    if (placa.length !== 6) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/soat\`*]* seguido de un número de *PLACA* de \`6 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/soat CPX104\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    const y = `*[ ⚙️ ] Obteniendo* \`SOAT\` del *➜ PLACA* \`${placa}\``;

    //Si todo se cumple, se iniciará con la consulta...
    const consultandoMessage = await bot.sendMessage(chatId, y, messageOptions);

    usuariosEnConsulta[userId] = true;

    try {
      const res = await soat_pdf(placa);
      const data_soat = res.data.data_soat;

      const soat_datos = data_soat.data_soat;

      const {
        codigoSBSAseguradora,
        codigoUnicoPoliza,
        estado,
        fechaControlPolicial,
        fechaCreacion,
        fechaFin,
        fechaInicio,
        nombreClaseVehiculo,
        nombreCompania,
        nombreUsoVehiculo,
        numeroAseguradora,
        tipoCertificado,
      } = soat_datos;

      let mensaje = `<b>[#LAIN-DOX 🌐] ➤ #SOAT_PDF</b>\n\n`;
      mensaje += `<b>[ ☑️ ] SOAT DE - </b><code>${placa}</code> - <b>🚗</b>\n\n`;
      mensaje += `<b>➤ INFORMACIÓN 📂:</b>\n\n`;

      mensaje += `  <code>⌞</code> <b>ESTADO:</b> <code>${estado}</code>\n`;
      mensaje += `  <code>⌞</code> <b>TIPO SOAT:</b> <code>${tipoCertificado}</code>\n`;
      mensaje += `  <code>⌞</code> <b>FE. POL:</b> <code>${fechaControlPolicial}</code>\n`;
      mensaje += `  <code>⌞</code> <b>FE. CREACION:</b> <code>${fechaCreacion}</code>\n`;
      mensaje += `  <code>⌞</code> <b>FE. INICIO:</b> <code>${fechaInicio}</code>\n`;
      mensaje += `  <code>⌞</code> <b>FE. FIN:</b> <code>${fechaFin}</code>\n`;
      mensaje += `  <code>⌞</code> <b>CLASE. VEHICULO:</b> <code>${nombreClaseVehiculo}</code>\n`;
      mensaje += `  <code>⌞</code> <b>NOMBRE COMPAÑÍA:</b> <code>${nombreCompania}</code>\n`;
      mensaje += `  <code>⌞</code> <b>NUMERO ASEGURADORA:</b> <code>${numeroAseguradora}</code>\n\n`;

      mensaje += `<b>➤ CONSULTADO POR:</b>\n`;
      mensaje += `  <code>⌞</code> <b>USUARIO:</b> <code>${userId}</code>\n`;
      mensaje += `  <code>⌞</code> <b>NOMBRE:</b> <code>${firstName}</code>\n\n`;
      mensaje += `<b>MENSAJE:</b> <i>La consulta se hizo de manera exitosa ♻.</i>\n\n`;

      const pdf = data_soat.pdf;
      const pdfbuffer = Buffer.from(pdf, "base64");
      // await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot
        .sendDocument(chatId, pdfbuffer, {
          caption: mensaje,
          parse_mode: "HTML",
          reply_to_message_id: msg.message_id,
        })
        .then(async () => {
          await registrarConsulta(userId, firstName, `soat_pdf`, placa, true);
          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 200;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 70;
          }
        });
    } catch (error) {
      console.log("🚀 ~ bot.onText ~ error:", error)
      let xerror = `*[ ✖️ ] NO SE ENCONTRÓ SOAT.*`;

      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      bot.sendMessage(chatId, xerror, messageOptions);
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
