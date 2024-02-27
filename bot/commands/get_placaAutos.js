//APIS
const { titularPlaca } = require("../api/apis");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]fxplaca (.+)/, async (msg, match) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    //BOT ANTI - BUG
    const botStartTime = Date.now() / 1000; // Tiempo de inicio del bot en segundos
    const messageTime = msg.date + 1; // Tiempo del mensaje en segundos + 1 segundo

    // Ignorar mensajes que son más antiguos que el tiempo de inicio del bot
    if (messageTime < botStartTime) {
      return;
    }

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
          "Error al obtener la información del Bot en el comando Placas: ",
          err
        );
      });
    const botIsAdmin = botMember.status === "administrator";

    //Si el chat lo usan de forma privada
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
          `*[ ⏳ ] ${firstName},* debes esperar \`${tiempoRestante} segundos\` para volver a utilizar este comando.`,
          messageOptions
        );
        delete usuariosEnConsulta[userId];
        return;
      }
    }

    if (placa.length !== 6) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fxplaca\`*]* seguido de un número de *placa* de \`6 dígitos\`.\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fxplaca F5U597\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    //Si todo se cumple, se iniciará con la consulta...
    const consultandoMessage = await bot.sendMessage(
      chatId,
      `*[ ⚙️ ] Consultando* \`DATOS\` de la *➜ PLACA* \`${placa}\``,
      {
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
      }
    );

    usuariosEnConsulta[userId] = true;

    try {
      const responseData = await titularPlaca(placa); // Response
      const datosApi_1 = responseData.api1;
      const datosApi_2 = responseData.api2;
      const datosResponse = responseData.api2.payload; // Parte Payload

      //DATOS API 1
      const datosApi1 = responseData.api1.base;

      const img = datosApi1.img64;

      //DATOS API 2
      const payload = datosApi_2.payload;

      const placa1 = payload.placa;
      const numMotor = payload.numMotor;
      const numSerie = payload.numSerie;
      const clase_codigo = payload.clase.codigo;
      const clase_descripcion = payload.clase.descripcion;
      const tipo_codigo = payload.tipo.codigo;
      const tipo_descripcion = payload.tipo.descripcion;
      const modelo_codigo = payload.modelo.codigo;
      const modelo_descripcion = payload.modelo.descripcion;
      const marca_codigo = payload.marca.codigo;
      const marca_descripcion = payload.marca.descripcion;
      const anhoFab = payload.anhoFab;
      const numAsientos = payload.numAsientos;

      let reply = `*[#LAIN-V.1-BETA ⚡]*\n\n`;
      reply += `*[ ☑️ ] INFORMACIÓN VEHICULAR*\n\n`;
      reply += `*➤ INF. DE PLACA:*\n`;
      reply += `  \`⌞\` *NUM° MOTOR:* \`${numMotor}\`\n`;
      reply += `  \`⌞\` *NUM° SERIE:* \`${numSerie}\`\n`;
      reply += `  \`⌞\` *NUM° ASIENTOS:* \`${numAsientos}\`\n`;
      reply += `  \`⌞\` *AÑO. FABRICACIÓN:* \`${anhoFab}\`\n\n`;
      reply += `*➤ INF. MODEO VEHICULAR:*\n`;
      reply += `  \`⌞\` *TIPO. VEHÍCULO:* \`${tipo_descripcion}\`\n`;
      reply += `  \`⌞\` *MARCA:* \`${marca_descripcion}\`\n`;
      reply += `  \`⌞\` *DESCRIPCIÓN:* \`${modelo_descripcion}\`\n\n`;
      reply += `*➤ CONSULTADO POR:*\n`;
      reply += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
      reply += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      reply += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      const imgPlaca = img.replace(/^data:image\/jpeg;base64,/, "");
      const fotoBuffer = Buffer.from(imgPlaca, "base64");

      await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot
        .sendPhoto(chatId, fotoBuffer, {
          caption: reply,
          parse_mode: "Markdown",
          reply_to_message_id: msg.message_id,
        })
        .then(() => {
          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 100 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 100;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
          }
        }).catch((err)=>{
          console.log("Error al enviar el mensaje de la respuesta en el comando PlACAS: ", err);
        });

      //   await bot.deleteMessage(chatId, consultandoMessage.message_id);
      //   bot
      //     .sendMessage(chatId, datosArgentinos, messageOptions)
      //     .then(() => {
      //       //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 1000 segundos
      //       if (!isDev && !isAdmin && !isBuyer) {
      //         antiSpam[userId] = Math.floor(Date.now() / 1000) + 1000;
      //       }
      //       //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
      //       else if (isBuyer) {
      //         antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
      //       }
      //     })
      //     .catch((error) => {
      //       console.log("Error al enviar el mensaje: " + error);
      //     });
    } catch (error) {
      console.log("Error al consultar: " + error);
    }
  });
};
