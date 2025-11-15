//SE REQUIRE LAS APIS
const { registrarConsulta } = require("../../sql/consultas.js");
const { fiscalia } = require("../api/api_Legales");

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
  bot.onText(/[\/.$?!]fiscalia (.+)/, async (msg, match) => {
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
    if (dni.length !== 8) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fiscalia\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fiscalia 07534794\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`CASOS FISCALES\` del *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //RESPONSE TITULAR
      const responseTitular = await fiscalia(dni);
      const mensajeStatus = responseTitular.message;

      if (mensajeStatus === "No se encontraron resultados.") {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        const yx = `*[ ✖️ ] No se encontró registros* del *DNI* \`${dni}\`.`;

        bot.sendMessage(chatId, yx, messageOptions);
      } else {
        const resultados = responseTitular.results;

        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        resultados.forEach((dato) => {
          const apMatPart = dato.apMatPart;
          const apPatPart = dato.apPatPart;
          const deDepeMpub = dato.deDepeMpub;
          const deDistJudi = dato.deDistJudi;
          const deEdad = dato.deEdad;
          const deEsp = dato.deEsp;
          const deEstado = dato.deEstado;
          const deTipoParte = dato.deTipoParte;
          const feDenuncia = dato.feDenuncia;
          const idAno = dato.idAno;
          const idUnico = dato.idUnico;
          const noPart = dato.noPart;

          let mensaje = `<b>[#LAIN-DOX 🌐] ➤ #FISCALIA</b>\n\n`;
          mensaje += `<b>[ ☑️ ] CASOS FISCALES DE - </b><code>${dni}</code> - <b>⚖️</b>\n\n`;
          mensaje += `<b>➤ REGISTROS ENCONTRADOS 📂:</b>\n\n`;

          mensaje += `  <code>⌞</code> <b>AÑO:</b> <code>${idAno}</code>\n`;
          mensaje += `  <code>⌞</code> <b>EDAD:</b> <code>${deEdad}</code>\n`;
          mensaje += `  <code>⌞</code> <b>NOMBRE:</b> <code>${noPart}</code>\n`;
          mensaje += `  <code>⌞</code> <b>AP. PATERNO:</b> <code>${apPatPart}</code>\n`;
          mensaje += `  <code>⌞</code> <b>AP. MATERNO:</b> <code>${apMatPart}</code>\n`;
          mensaje += `  <code>⌞</code> <b>FECHA. DENUNCIA:</b> <code>${feDenuncia}</code>\n`;
          mensaje += `  <code>⌞</code> <b>DEPENDENCIA. MP:</b> <code>${deDepeMpub}</code>\n`;
          mensaje += `  <code>⌞</code> <b>ESTADO. CASO:</b> <code>${deEstado}</code>\n`;
          mensaje += `  <code>⌞</code> <b>DISRITO JURÍDICO:</b> <code>${deDistJudi}</code>\n`;
          mensaje += `  <code>⌞</code> <b>ESPECIALIDAD CASO:</b> <code>${deEsp}</code>\n`;
          mensaje += `  <code>⌞</code> <b>ID ÚNICO DEL CASO:</b> <code>${idUnico}</code>\n`;
          mensaje += `  <code>⌞</code> <b>ROL DEL CONSULTADO:</b> <code>${deTipoParte}</code>\n\n`;

          mensaje += `<b>➤ LISTA DELITOS ASOCIADOS 👨‍✈️:</b>\n\n`;

          const listaMateriaDelito = dato.delitos;

          listaMateriaDelito.forEach((dato) => {
            const espDeMatDeli = dato.espDeMatDeli;
            const espIdMatDeli = dato.espIdMatDeli;
            const genDeMatDeli = dato.genDeMatDeli;
            const genIdMatDeli = dato.genIdMatDeli;
            const subDeMatDeli = dato.subDeMatDeli;
            const subIdMatDeli = dato.subIdMatDeli;

            mensaje += `  <code>⌞</code> <b>CU. ESPECIFICACIÓN:</b> <code>${espIdMatDeli}</code>\n`;
            mensaje += `  <code>⌞</code> <b>ESPECIFICACIÓN. DELITO:</b> <code>${espDeMatDeli}</code>\n`;
            mensaje += `  <code>⌞</code> <b>CU. CLASIFICACIÓN:</b> <code>${genIdMatDeli}</code>\n`;
            mensaje += `  <code>⌞</code> <b>CLASIFICACIÓN. DELITO:</b> <code>${genDeMatDeli}</code>\n`;
            mensaje += `  <code>⌞</code> <b>CU. SUB-CATEGORÍA:</b> <code>${subIdMatDeli}</code>\n`;
            mensaje += `  <code>⌞</code> <b>SUB-CATEGORÍA. DELITO:</b> <code>${subDeMatDeli}</code>\n`;
          });
          mensaje += `\n`;
          mensaje += `<b>➤ CONSULTADO POR:</b>\n`;
          mensaje += `  <code>⌞</code> <b>USUARIO:</b> <code>${userId}</code>\n`;
          mensaje += `  <code>⌞</code> <b>NOMBRE:</b> <code>${firstName}</code>\n\n`;
          mensaje += `<b>MENSAJE:</b> <i>La consulta se hizo de manera exitosa ♻.</i>\n\n`;

          bot
            .sendMessage(chatId, mensaje, {
              parse_mode: "HTML",
              reply_to_message_id: msg.message_id,
            })
            .then(async() => {
              await registrarConsulta(userId, firstName, `fiscalia`, dni, true);
              //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
              if (!isDev && !isAdmin && !isBuyer) {
                antiSpam[userId] = Math.floor(Date.now() / 1000) + 120;
              }
              //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
              else if (isBuyer) {
                antiSpam[userId] = Math.floor(Date.now() / 1000) + 70;
              }
            });
        });
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
