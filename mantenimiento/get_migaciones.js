//SE REQUIRE LAS APIS
const { migraciones } = require("../bot/api/api_Variados.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../bot/config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//MOMENTO
const moment = require("moment");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]migra (.+)/, async (msg, match) => {
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

    const { checkIsBuyer } = require("../sql/checkbuyer.js");
    //Rango Comprador
    const isBuyer = await checkIsBuyer(userId);


    const gruposPermitidos = require("../bot/config/gruposManager/gruposPermitidos.js");
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/migra\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/migra 44443333\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando registro* \`MIGRATORIO\` del DNI *➜* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;
    try {
      function valRegistros(migraciones) {
        // Verifica si listaAni existe y tiene más de 1 elemento
        if (!migraciones.listaAni || migraciones.listaAni.length <= 1) {
          return false; // No hay suficientes registros migratorios
        }

        // Excluye el primer elemento (datos personales) y revisa solo los movimientos
        for (let registro of migraciones.listaAni.slice(1)) {
          // Verifica si todos los campos relacionados al movimiento están vacíos
          if (
            !registro.fecmovimiento &&
            !registro.numdocumento &&
            !registro.procedenciadestino &&
            !registro.tipdocumento &&
            !registro.tipmovimiento
          ) {
            return false; // Si encuentra un movimiento sin información válida
          }
        }
        return true; // Si todos los movimientos tienen información válida
      }

      const responseMigra = await migraciones(dni);
      const datosMigra = responseMigra.Migraciones;

      // Validación de los registros migratorios
      const validacion = valRegistros(datosMigra);

      if (!validacion) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        let yyx = `*[ ✖️ ] EL DNI consultado* no cuenta con movimiento migratorio`;
        return bot.sendMessage(chatId, yyx, messageOptions);
      }

      const movimientos = datosMigra.listaAni.slice(1); // .slice(1) excluye el primer elemento

      const dataPerson = datosMigra.listaAni[0];


      let mensaje = `*[#LAIN-DOX 🌐] ➤ #MIGRACIONES*\n\n`;
      mensaje += `*[ ☑️ ] REGISTRO MIGRATORIO -* \`${dni}\` *- ✈️*\n\n`;
      mensaje += `*➤ PROPIETARIO:*\n`;
      mensaje += `  \`⌞\` *NOMBRE:* \`${dataPerson.nombres}\`\n`;
      mensaje += `  \`⌞\` *AP. PATERNO:* \`${dataPerson.apepaterno}\`\n`;
      mensaje += `  \`⌞\` *AP. MATERNO:* \`${dataPerson.apematerno}\`\n`;
      mensaje += `  \`⌞\` *NACIONALIDAD:* \`${dataPerson.painacionalidad}\`\n`;
      mensaje += `  \`⌞\` *FECHA. NACIMIENTO:* \`${dataPerson.fecnacimiento}\`\n\n`;

      mensaje += `*➤ MOVMIENTOS MIGRATORIOS:*\n\n`;

      movimientos.forEach((i, index) => {
        const fecmovimiento = i.fecmovimiento;
        const numdocumento = i.numdocumento;
        const procedenciadestino = i.procedenciadestino;
        const tipdocumento = i.tipdocumento;
        const tipmovimiento = i.tipmovimiento;

        mensaje += `  \`⌞\` *FE. MOVIMIENTO:* \`${fecmovimiento}\`\n`;
        mensaje += `  \`⌞\` *NUM. DOCUMENTO:* \`${numdocumento}\`\n`;
        mensaje += `  \`⌞\` *TIPO DOCUMENTO:* \`${tipdocumento}\`\n`;
        mensaje += `  \`⌞\` *TIPO MOVIMIENTO:* \`${tipmovimiento}\`\n`;
        mensaje += `  \`⌞\` *PROCEDENCIA. DESTINO:* \`${procedenciadestino}\`\n\n`;
      });

      mensaje += `*➤ CONSULTADO POR:*\n`;
      mensaje += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
      mensaje += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      mensaje += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot.sendMessage(chatId, mensaje, messageOptions);
      //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
      if (!isDev && !isAdmin && !isBuyer) {
        antiSpam[userId] = Math.floor(Date.now() / 1000) + 150;
      }
      //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
      else if (isBuyer) {
        antiSpam[userId] = Math.floor(Date.now() / 1000) + 100;
      }
    } catch (error) {
      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;
      console.log(error);

      bot.sendMessage(chatId, xerror, messageOptions);
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
