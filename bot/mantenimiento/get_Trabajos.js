// API TRABAJOS
const { api_trabajos } = require("../api/api_Variados.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

module.exports = (bot) => {
  bot.onText(/\/fxtrabajos (.+)/, async (msg, match) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    //Ayudas rápidas como declarar nombres, opciones de mensajes, chatId, etc
    const dni = match[1];
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
    if (dni.length !== 8) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fxtrabajos\`*]* seguido de una serie de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fxtrabajos 44443333\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando data* \`LABORAL\` *del DNI ➜* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      const data = await api_trabajos(dni);
      const laboral = data.laboral;

      if (laboral.lista.length === 0) {
        let yx = `*[ ✖️ ] No se encontró registros laborales* para el *DNI* \`${dni}\`*.*\n\n`;

        await bot.deleteMessage(chatId, consultandoMessage.message_id);

        return bot.sendMessage(chatId, yx, messageOptions);
      }
      await bot
        .deleteMessage(chatId, consultandoMessage.message_id)
        .then(() => {
          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 80 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 80;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
          }
        });

      send_ResultadosSeparados(chatId, laboral.lista);
    } catch (error) {
      bot.sendMessage(chatId, "Hubo un error al obtener los datos.");
      console.error(error);
    }

    function formatDate(date) {
      const year = date.substring(0, 4);
      const month = date.substring(4, 6);
      return `${month}/${year}`;
    }

    function send_ResultadosSeparados(chatId, data) {
      // Ordenar el array por devengue como número
      data.sort((a, b) => a.devengue.localeCompare(b.devengue));

      const pageSize = 5;
      const totalPages = Math.ceil(data.length / pageSize);

      for (let i = 0; i < totalPages; i++) {
        const start = i * pageSize;
        const end = start + pageSize;
        const paginatedData = data.slice(start, end);

        let message = `*[#LAIN-DOX 🌐] ➤ #TRABAJOS*\n\n`;
        message += `*[ 💼 ] REGISTROS LABORALES DE* \`- ${dni} -\`\n\n`;
        message += `*• 𝙼𝚘𝚜𝚝𝚛𝚊𝚗𝚍𝚘 𝚛𝚎𝚐𝚒𝚜𝚝𝚛𝚘𝚜* \`${start + 1}\` *𝚊* \`${
          end > data.length ? data.length : end
        }\` *𝚍𝚎* \`${data.length}\` *𝚛𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘𝚜 ...*\n\n`;

        paginatedData.forEach((item, index) => {
          const formattedDate = formatDate(item.devengue);
          message += `*➤ RESULTADO* \`${start + index + 1}\`\n`;
          message += `  \`⌞\` *REGISTRO:* \`${formattedDate}\`\n`;
          message += `  \`⌞\` *NUM. RUC:* \`${item.ruc}\`\n`;
          message += `  \`⌞\` *EMPRESA:* \`${item.empresa}\`\n\n`;
        });

        message += `*➤ CONSULTADO POR:*\n`;
        message += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
        message += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
        message += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

        bot.sendMessage(chatId, message, {
          reply_to_message_id: msg.message_id,
          parse_mode: "Markdown",
        });
      }
    }
  });
};
