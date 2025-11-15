//APIS
const { yape_fake } = require("../api/api_Variados.js");

//FS
const fs = require("fs");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");
const { registrarConsulta } = require("../../sql/consultas.js");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]yape (.+)/, async (msg, match) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    //Ayudas rápidas como declarar nombres, opciones de mensajes, chatId, etc
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
          "Error al obtener la información del Bot en el comando Nombres: ",
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

    if (match && match[1]) {
      const input = match[1].trim();
      if (!input.includes("|")) {
        let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, asegúrate de usar el siguiente formato: \`/yape\` *nombre*|*numero*|*precio*|*destino*\n\n`;
        replyToUsoIncorrecto += `*➜ EJEMPLO:* \`/yape Pedro Castillo T.|942235645|15.10|Yape\``;
        bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
        return;
      }
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      const commandArgs = match[1].split("|").map((arg) => arg.trim());

      const nombre = commandArgs[0];
      const numero = commandArgs[1];
      const precio = commandArgs[2];
      const destino = commandArgs[3];

      // Verificar que al menos haya un apellido (paterno o materno)
      if (
        (!nombre && !numero && !precio && destino) ||
        nombre.trim() === "" ||
        numero.trim() === "" ||
        precio.trim() === "" ||
        destino.trim() === ""
      ) {
        let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, asegúrate de usar el siguiente formato: \`/yape\` *nombre*|*numero*|*precio*|*destino*\n\n`;
        replyToUsoIncorrecto += `*➜ EJEMPLO:* \`/yape Pedro Castillo T.|942235645|15.10|Yape\``;

        bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
        return;
      }
      // Realizar la consulta a la API con los parámetros obtenidos
      const res = await yape_fake(nombre, numero, precio, destino);

      if (res.data.status_data === true) {
        const img_yape = res.data.data_voucher.img;
        const valores = res.data.data_voucher.valores_yape;

        const fotoData = img_yape.replace(/^data:image\/png;base64,/, "");
        const fotoBuffer = Buffer.from(fotoData, "base64");

        let mensaje = `<b>[#LAIN-DOX 🌐] ➤ #YAPE_FAKE</b>\n\n`;
        mensaje += `<b>[ ☑️ ] VOUCHER YAPE:</b> <code>${numero}</code>\n\n`;
        mensaje += `<b>➤ VALORES YAPE:</b>\n\n`;

        mensaje += `⌞ <b>HORA:</b> <code>${valores.hora}</code>\n`;
        mensaje += `⌞ <b>FECHA:</b> <code>${valores.fecha}</code>\n`;
        mensaje += `⌞ <b>NUMERO:</b> <code>${numero}</code>\n`;
        mensaje += `⌞ <b>DESTINO:</b> <code>${destino}</code>\n`;
        mensaje += `⌞ <b>DESTINATARIO:</b> <code>${valores.titular.toUpperCase()}</code>\n\n`;

        mensaje += `<b>➤ GENERADO POR:</b>\n`;
        mensaje += `⌞ <b>USUARIO:</b> <code>${userId}</code>\n`;
        mensaje += `⌞ <b>NOMBRE:</b> <code>${firstName}</code>\n\n`;

        mensaje += `<b>MENSAJE:</b> <i>La consulta se hizo de manera exitosa ♻.</i>\n\n`;

        bot.sendPhoto(chatId, fotoBuffer, {
          caption: mensaje,
          parse_mode: "HTML",
          reply_to_message_id: msg.message_id,
        });
      }
    } catch (error) {
      console.log("🚀 ~ bot.onText ~ error:", error);
      let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;

      bot.sendMessage(chatId, xerror, messageOptions);
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
