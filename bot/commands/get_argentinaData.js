//APIS
const { argentinaData } = require("../api/apis");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]argdat (.+)/, async (msg, match) => {
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
    const cuit = match[1];
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
          "Error al obtener la información del Bot en el comando Acta Nacimiento: ",
          err
        );
      });
    const botIsAdmin = botMember.status === "administrator";

    //Si el chat lo usan de forma privada
    if (typeChat === "private" && !isDev) {
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

    if (cuit.length !== 11) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/argdat\`*]* seguido de un número de *CUIT* de \`11 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/argdat 20454545452\`*]*\n\n`;

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
      `*[ 💬 ] Consultando* los datos \`ARGENTINOS\` del *➜ CUIT* \`${cuit}\``,
      {
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
      }
    );

    usuariosEnConsulta[userId] = true;

    try {
      const consultaStartTime = Date.now(); // Guardamos el tiempo de inicio de la consulta

      const responseData = await argentinaData(cuit); // Response
      const datosResponse = responseData.datos; // Parte Datos
      const datosPrincipales = datosResponse.identidad; // Parte Identidad

      let datosArgentinos = `*[#LAIN-V.1-BETA ⚡]*\n\n`;
      datosArgentinos += `*[🇦🇷 ARGENTINA DATA-BETA]*\n\n`;

      datosArgentinos += `*- 👤 - INF. PERSONA:*\n\n`;

      datosArgentinos += `\`>\` *DNI:* \`${datosPrincipales.numero_documento}\`\n`;
      datosArgentinos += `\`>\` *TIPO DNI:* \`${datosPrincipales.tipo_documento}\`\n`;
      datosArgentinos += `\`>\` *EDAD:* \`${datosPrincipales.anios}\`\n`;
      datosArgentinos += `\`>\` *NOMBRE:* \`${datosPrincipales.nombre_completo}\`\n`;
      datosArgentinos += `\`>\` *SEXO:* \`${datosPrincipales.sexo}\`\n`;
      datosArgentinos += `\`>\` *AÑOS INSCRITO:* \`${datosPrincipales.anios}\`\n`;
      datosArgentinos += `\`>\` *FECHA. NACIMIENTO:* \`${datosPrincipales.fecha_nacimiento}\`\n`;
      datosArgentinos += `\`>\` *FECHA. INSCRIPCIÓN:* \`${datosPrincipales.fecha_inscripcion}\`\n\n`;

      datosArgentinos += `*- 🏕️ - INF. DIRECCIONES:*\n\n`;

      datosArgentinos += `\`>\` *LOCALIDADES:*\n`;

      const localidadesArray = datosPrincipales.localidad_array;
      localidadesArray.forEach((dato, index) => {
        const yx = index + 1; // Sumar 1 para obtener el número de la localidad
        datosArgentinos += `*    ↳ LOCALIDAD ${yx}:* \`${dato}\`\n`;
      });

      datosArgentinos += `\n`;

      datosArgentinos += `\`>\` *DOMICILIOS:*\n\n`;

      const domiciliosData = datosResponse.domicilios;
      domiciliosData.forEach((domicilio, index) => {
        const yx = index + 1; // Sumar 1 para obtener el número del domicilio

        datosArgentinos += `*    ↳ DOMICILIO ${yx}*\n`;
        datosArgentinos += `*    ↳ ALTURA:* \`${domicilio.altura}\`\n`;
        datosArgentinos += `*    ↳ BARRIO:* \`${domicilio.barrio}\`\n`;
        datosArgentinos += `*    ↳ CALLE:* \`${domicilio.calle}\`\n`;
        datosArgentinos += `*    ↳ COD. POSTAL:* \`${domicilio.cp}\`\n`;
        datosArgentinos += `*    ↳ FE. REGISTRO:* \`${domicilio.fecha}\`\n`;
        datosArgentinos += `*    ↳ LOCALIDAD:* \`${domicilio.localidad}\`\n`;
        datosArgentinos += `*    ↳ PROVINCIA:* \`${domicilio.provincia}\`\n`;
        datosArgentinos += `*    ↳ TIPO:* \`${domicilio.tipo}\`\n\n`;
      });

      datosArgentinos += `\n`;

      datosArgentinos += `*- 💬 - TEST CONSULTA:*\n\n`;
      datosArgentinos += `\`>\`** \`${firstName}\`\n`;
      datosArgentinos += `\`>\`** \`${userId}\`\n`;

      const consultaEndTime = Date.now(); // Guardamos el tiempo de finalización de la consulta
      const consultaDuration = (consultaEndTime - consultaStartTime) / 1000; // Calculamos la duración en segundos

      datosArgentinos += `\`>\`** \`${consultaDuration.toFixed(
        2
      )} segundos\`\n\n`; // Añadimos la duración al mensaje de respuesta
      datosArgentinos += `*- 👩‍💻 - DEVELOPER:* [𝑽𝒂𝒍𝒆𝒓𝒊𝒂](https://t.me/SinFlowxr) \`\`\n\n`; // Añadimos la duración al mensaje de respuesta
      await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot
        .sendMessage(chatId, datosArgentinos, messageOptions)
        .then(() => {
          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 1000 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 1000;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
          }
        })
        .catch((error) => {
          console.log("Error al enviar el mensaje: " + error);
        });
    } catch (error) {
      console.log("Error al consultar: " + error);
    }
  });
};
