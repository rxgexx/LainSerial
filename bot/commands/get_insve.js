const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

const dataStorage = {};



// Rutas y datos
const { api_insVehiculo } = require("../api/api_Variados.js");
const rangosFilePath = require("../config/rangos/rangos.json");
const { registrarConsulta } = require("../../sql/consultas.js");

// Manejo anti-spam
const usuariosEnConsulta = {};
const antiSpam = {};

// ALMACENAR LOS MENSAJES ID
const comandoInvocado = {};
let messageId;

let buttonId;

// Se define dirBase fuera del módulo para que sea accesible globalmente
let dirBase = "";
let placa;

module.exports = (bot) => {
  bot.onText(/[\/.$?!]insve (.+)/, async (msg, match) => {
    // Manejo de errores de polling
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    // Ayudas rápidas
    placa = match[1];
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const typeChat = msg.chat.type;
    const groupName = msg.chat.title;
    const firstName = msg.from.first_name;
    const messageOptions = {
      reply_to_message_id: msg.message_id,
      parse_mode: "Markdown",
    };

    // BOTON - CFG
    messageId = msg.message_id; // PRIMER MSG - ID
    // console.log("PRIMER ID DE MENSAJE...", messageId);

    comandoInvocado[userId] = messageId + 1;

    // Verificación de rangos
    const isDev = rangosFilePath.DEVELOPER.includes(userId);
    const isAdmin = rangosFilePath.ADMIN.includes(userId);
    const { checkIsBuyer } = require("../../sql/checkbuyer");
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
      let noAdmin = `*[ 💤 ] Dormiré* hasta que no me hagan *administradora* _zzz 😴_`;
      bot.sendMessage(chatId, noAdmin, messageOptions);
      return;
    }

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

    if (!isDev && !isAdmin) {
      const tiempoEspera = antiSpam[userId] || 0;
      const tiempoRestante = Math.max(
        0,
        tiempoEspera - Math.floor(Date.now() / 1000)
      );
      if (tiempoRestante > 0) {
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/insve\`*]* seguido de un número de *PLACA* de \`6 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/insve F5U597\`*]*\n\n`;
      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Buscando* \`FICHA INFORMATIVA VEHÍCULAR\` en *SUNARP de la* *➜ PLACA* \`${placa}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    usuariosEnConsulta[userId] = true;

    try {
      const datos = await api_insVehiculo(placa);

      if (datos.status === false) {
        let yxx = `*[ 💬 ] No se encontró* la \`INSCRIPCIÓN VEHICULAR\` de la *placa ${placa}*.`;
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        return bot.sendMessage(chatId, yxx, messageOptions);
      }

      // Datos obtenidos
      const pdf = datos.dataPdf;
      const pdfdata = pdf.replace(/^data:image\/jpeg;base64,/, "");
      const pdfbuffer = Buffer.from(pdfdata, "base64");

      // Datos placa

      let caption = `*[#LAIN-DOX 🌐] ➤ #FICHAVEHICULAR*\n\n`;

      caption += `*Ficha de Inscripción Vehícular de la placa ${placa}*\n\n `;

      caption += `*➤ CONSULTADO POR:*\n`;
      caption += `\`⌞\` *USUARIO:* \`${userId}\`\n`;
      caption += `\`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      caption += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;


      await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot.sendDocument(chatId, pdfbuffer, {
        caption: caption,
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
      }).then(async()=>{
        await registrarConsulta(userId, firstName, "insve", placa, true);
      });
    } catch (error) {
      console.log(error);

      let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;
      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      bot.sendMessage(chatId, xerror, messageOptions);
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
