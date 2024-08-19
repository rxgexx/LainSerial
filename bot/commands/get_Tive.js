//SE REQUIRE LAS APIS
const { api_tive } = require("../api/api_Variados.js");

const path = require("path");
const fs = require("fs");

const { Readable } = require("stream");
//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//MOMENTO
const moment = require("moment");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]tive (.+)/, async (msg, match) => {
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

    //Rango Comprador
    const isBuyer =
      rangosFilePath.BUYER && rangosFilePath.BUYER.includes(userId);

    const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");
    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando titularMov: ",
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
    if (placa.length !== 6) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/tive\`*]* seguido de un número de *PLACA* de \`6 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/tive AHU537\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Obteniendo el* \`TIVE\` de la *➜ PLACA* \`${placa}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //SE LLAMAN A LAS APIS
      const res_pdf = await api_tive(placa);

      //MENSAJE DEL BOT

      const datos = res_pdf.datos;

      let mssg = `*[#LAIN-DOX 🌐] ➤ #TIVE*\n\n`;
      mssg += `*➜ INF. TIVE:*\n`;
      mssg += `  \`⌞\` *OFICINA:* \`${datos.oficina}\`\n`;
      mssg += `  \`⌞\` *NUM. PARTIDA:* \`${datos.numPart}\`\n`;
      mssg += `  \`⌞\` *TIVE:* \`${datos.tiv}\`\n\n`;

      mssg += `*➤ CONSULTADO POR:*\n`;
      mssg += `\`⌞\` *USUARIO:* \`${userId}\`\n`;
      mssg += `\`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      mssg += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      //PDF

      const pdf = res_pdf.dataPdf;
      // Convertir base64 a buffer
      const pdfBuffer = Buffer.from(pdf, "base64");

      const save = path.join(__dirname, "../../fichasDocuments");

      // Crear un archivo temporal para guardar el PDF
      const tempFilePath = path.join(save, `${placa}_tive.pdf`);

      fs.writeFile(tempFilePath, pdfBuffer, async (err) => {
        if (err) {
          console.error("Error al guardar el archivo temporal:", err);
          return;
        }

        // Enviar el archivo PDF a través de Telegram
        await bot.deleteMessage(chatId, consultandoMessage.message_id);

        bot
          .sendDocument(chatId, tempFilePath, {
            caption: mssg,
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
          })
          .then(() => {
            //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
            if (!isDev && !isAdmin && !isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 120;
            }
            //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
            else if (isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 80;
            }

            console.log("PDF enviado exitosamente");
            // Eliminar el archivo temporal después de enviarlo
            fs.unlink(tempFilePath, (err) => {
              if (err) {
                console.error("Error al eliminar el archivo temporal:", err);
              } else {
                console.log("Archivo temporal eliminado");
              }
            });
          })
          .catch((err) => {
            console.error("Error al enviar el PDF:", err);
          });
      });
    } catch (error) {
      let xerror = `*[ ✖️ ] No se ha *encontrado u obtenido la ficha informativa para la Placa consultada.*`;
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
