const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

const dataStorage = {};

// Rutas y datos
const { bienes } = require("../api/api_Variados.js");
const rangosFilePath = require("../config/rangos/rangos.json");

// Manejo anti-spam
const usuariosEnConsulta = {};
const antiSpam = {};

// ALMACENAR LOS MENSAJES ID
const comandoInvocado = {};
let messageId;

let buttonId;

// Se define dirBase fuera del módulo para que sea accesible globalmente
let dirBase = "";
let dni;

module.exports = (bot) => {
  bot.onText(/[\/.$?!]bienes (.+)/, async (msg, match) => {
    // Manejo de errores de polling
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    // Ayudas rápidas
    dni = match[1];
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
    const isBuyer =
      rangosFilePath.BUYER && rangosFilePath.BUYER.includes(userId);

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

    if (dni.length !== 8) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/bienes\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/bienes 07768359\`*]*\n\n`;
      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`REGISTROS\` en *SUNARP del* *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    usuariosEnConsulta[userId] = true;

    try {
      const datos = await bienes(dni);

      if (datos.status === false) {
        let yxx = `*[ 💬 ] No se encontraron registros* en *SUNARP.*`;
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        return bot.sendMessage(chatId, yxx, messageOptions);
      }

      // Datos obtenidos
      const data = datos.datos[0];
      const nroDocumento = data.nroDocumento;
      const titular = data.titular;
      const partida = data.partida;
      const zona = data.zona;
      const oficina = data.oficina;
      const refNumPart = data.refNumPart;

      // Definir dirBase aquí para que esté disponible globalmente
      dirBase = path.join(
        __dirname,
        `../../fichasDocuments/bienes/data_${dni}`
      );

      if (!fs.existsSync(dirBase)) {
        fs.mkdirSync(dirBase, { recursive: true });
      }

      let botones = [];

      let mensaje = `*[#LAIN-DOX 🌐] ➤ #BIENESSUNARP*\n\n`;
      mensaje += `_• Estos datos han sido_ *obtenidos* del *sitema SUNARP* en *tiempo real.*\n\n`;
      mensaje += `*➜ REGISTRO DE BIENES DE ${dni} - 📜 -*\n\n`;
      mensaje += `  \`⌞\` *ZONA:* \`${zona}\`\n`;
      mensaje += `  \`⌞\` *TITULAR:* \`${titular}\`\n`;
      mensaje += `  \`⌞\` *PARTIDA:* \`${partida}\`\n`;
      mensaje += `  \`⌞\` *OFICINA:* \`${oficina}\`\n`;
      mensaje += `  \`⌞\` *DOCUMENTO:* \`${nroDocumento}\`\n`;
      mensaje += `  \`⌞\` *REFERENCIA. PARTIDA:* \`${refNumPart}\`\n\n`;

      mensaje += `*⮞ REGISTROS INDEXADOS - 🗃️ -*\n\n`;

      data.leyendas.forEach((item, index) => {
        if (item.BasePdf) {
          const pdfPath = path.join(dirBase, `sunarp_${dni}_${index + 1}.pdf`);

          if (!fs.existsSync(pdfPath)) {
            const pdfBuffer = Buffer.from(item.pdfData, "base64");
            fs.writeFileSync(pdfPath, pdfBuffer);
            console.log(`PDF guardado en: ${pdfPath}`);
          }

          buttonId = `${index + 1}`; // Identificador único
          dataStorage[buttonId] = {
            nombreRubro: item.nombreRubro,
            descActo: item.descActo,
            numPartida: item.numPartida,
            refNumPart: item.refNumPart,
            fechaInscripcion: item.fechaInscripcion,
            // Otros datos necesarios
          };

          botones.push([
            {
              text: `⬇️ ${item.descActo.replace(/\s*\(.*\)/, "")} - ${
                index + 1
              }`,
              callback_data: buttonId,
            },
          ]);

          mensaje += `  \`⌞\` *N° INDEXADO:* \`${index + 1}\`\n`;
          mensaje += `  \`⌞\` *N° PARTIDA:* \`${item.numPartida}\`\n`;
          mensaje += `  \`⌞\` *N° TITULAR:* \`${item.numTitu}\`\n`;
          mensaje += `  \`⌞\` *NOMBRE. ACTO:* \`${item.descActo}\`\n`;
          mensaje += `  \`⌞\` *NOMBRE. RUBRO:* \`${item.nombreRubro}\`\n`;
          mensaje += `  \`⌞\` *FECHA. INSCRIPCIÓN:* \`${item.fechaInscripcion}\`\n`;
          mensaje += `  \`⌞\` *REFERENCIA. N° PARTIDA:* \`${item.refNumPart}\`\n\n`;
        }
      });

      mensaje += `*➤ CONSULTADO POR:*\n`;
      mensaje += `\`⌞\` *USUARIO:* \`${userId}\`\n`;
      mensaje += `\`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      mensaje += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      // Configurar la eliminación de la carpeta después de 15 minutos
      setTimeout(() => {
        fs.rm(dirBase, { recursive: true, force: true }, (err) => {
          if (err) {
            console.error(`Error al eliminar la carpeta ${dirBase}:`, err);
          } else {
            console.log(`Carpeta ${dirBase} eliminada después de 15 minutos.`);
          }
        });
      }, 15 * 60 * 1000); // 15 minutos en milisegundos

      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: botones,
        },
      };

      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      bot.sendMessage(chatId, mensaje, {
        ...messageOptions,
        ...inlineKeyboard,
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

  bot.on("callback_query", async (query) => {
    const buttonId = query.data;
    const userId = query.from.id;
    const query_messageId = query.message.message_id;
    const query_id = query.id;

    const data = dataStorage[buttonId];

    const pdfPath = path.join(dirBase, `sunarp_${dni}_${buttonId}.pdf`);

    let yxx = `\`⌞\` *N° INDEXADO:* \`${buttonId}\`\n`;
    yxx += `\`⌞\` *ACTO:* \`${data.descActo}\`\n`;
    yxx += `\`⌞\` *RUBRO:* \`${data.nombreRubro}\`\n`;
    yxx += `\`⌞\` *N° PARTIDA:* \`${data.numPartida}\`\n`;
    yxx += `\`⌞\` *REF. N° PARTIDA:* \`${data.refNumPart}\`\n`;
    yxx += `\`⌞\` *FE. INSCRIPCION:* \`${data.fechaInscripcion}\`\n\n`;

    yxx += `_• Estos datos han sido_ *obtenidos* del *sitema SUNARP* en *tiempo real.*\n\n`;

    if (fs.existsSync(pdfPath)) {
      bot
        .sendDocument(query.message.chat.id, pdfPath, {
          caption: `${yxx}`,
          reply_to_message_id: query.message.reply_to_message.message_id,
          parse_mode: "Markdown",
        })
        .catch((err) => {
          console.log("Error al enviar el documento:", err.message);
        });
    } else {
      bot.sendMessage(
        query.message.chat.id,
        "El archivo PDF no está disponible."
      );
    }
  });
};
