//SE REQUIRE LAS APIS
const { registrarConsulta } = require("../../sql/consultas.js");
const { davidapi_dni } = require("../api/api_Telefonia.js");

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
  bot.onText(/[\/.$?!]fonos (.+)/, async (msg, match) => {
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
    if (dni.length !== 8) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fonos\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fonos 44444444\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`NÚMEROS\` del *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //RESPONSE TITULAR
      const responseTitular = await davidapi_dni(dni);

      if (responseTitular.data.status_data === false) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        const yx = `*[ ✖️ ] No se encontró registros de números en la segunda base* del DNI \`${dni}\`.`;

        bot.sendMessage(chatId, yx, messageOptions);
      } else {
        const data = responseTitular.data.data_telefonia.lista_registros;
        //CONSTRUCCIÓN DEL MENSAJE
        let telRes = `<b>[#LAIN-DOX 🌐] ➤ #TELEFONOSv3</b>\n\n`;
        telRes += `<b>➤ BASE DE DATOS 2:</b>\n\n`;

        data.forEach((dato) => {
          const number = dato.number;
          const name = dato.name;
          const lastname = dato.surname;
          const operator = dato.operator;

          telRes += `<b>NUMERO:</b> <code>${number}</code>\n`;
          telRes += `<b>OPERADOR:</b> <code>${operator}</code>\n`;
          telRes += `<b>NOMBRES:</b> <code>${name}</code>\n`;
          telRes += `<b>APELLIDOS:</b> <code>${lastname}</code>\n\n`;
        });

        //SI LOS NÚMEROS SON MENOR O IGUAL A 10 RESULTADOS
        if (data.length <= 6) {
          //POR CADA DATO
          data.forEach((dato) => {
            const number = dato.number;
            const name = dato.name;
            const lastname = dato.surname;
            const operator = dato.operator;

            telRes += `<b>NUMERO:</b> <code>${number}</code>\n`;
            telRes += `<b>OPERADOR:</b> <code>${operator}</code>\n`;
            telRes += `<b>NOMBRES:</b> <code>${name}</code>\n`;
            telRes += `<b>APELLIDOS:</b> <code>${lastname}</code>\n\n`;
          });

          telRes += `<b>➤ CONSULTADO POR:</b>\n`;
          telRes += `  <code>⌞</code> <b>USUARIO:</b> <code>${userId}</code>\n`;
          telRes += `  <code>⌞</code> <b>NOMBRE:</b> <code>${firstName}</code>\n\n`;
          telRes += `<b>MENSAJE:</b> <i>La consulta se hizo de manera exitosa ♻.</i>\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot
            .sendMessage(chatId, telRes, {
              reply_to_message_id: msg.message_id,
              parse_mode: "HTML",
            })
            .then(async () => {
              await registrarConsulta(userId, firstName, `TELX 2`, dni, true);

              //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
              if (!isDev && !isAdmin && !isBuyer) {
                antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
              }
              //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
              else if (isBuyer) {
                antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
              }
            });
        } else {
          //TXT
          const maxResultsToShow = 6;
          //RESULTADOS QUE SE VAN A MOSTRAR CON EL TXT
          const resultadosParaMostrar = data.slice(0, maxResultsToShow);
          const resultadosRestantes = data.slice(maxResultsToShow);

          resultadosParaMostrar.forEach((dato) => {
            const number = dato.number;
            const name = dato.name;
            const lastname = dato.surname;
            const operator = dato.operator;

            telRes += `<b>NUMERO:</b> <code>${number}</code>\n`;
            telRes += `<b>OPERADOR:</b> <code>${operator}</code>\n`;
            telRes += `<b>NOMBRES:</b> <code>${name}</code>\n`;
            telRes += `<b>APELLIDOS:</b> <code>${lastname}</code>\n\n`;
          });

          telRes += `<b>➤ CONSULTADO POR:</b>\n`;
          telRes += `  <code>⌞</code> <b>USUARIO:</b> <code>${userId}</code>\n`;
          telRes += `  <code>⌞</code> <b>NOMBRE:</b> <code>${firstName}</code>\n\n`;
          telRes += `<b>MENSAJE:</b> <i>La consulta se hizo de manera exitosa ♻.</i>\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot.sendMessage(chatId, telRes, {
            reply_to_message_id: msg.message_id,
            parse_mode: "HTML",
          });

          //SE INICIA CON EL TXT
          const telxFile = `NÚMEROS_TELF_${dni}.txt`;

          //TOP TXT
          let topTxt = `[#LAIN-DOX 🌐]\n\n`;
          topTxt += `[ ☑️ ] NUMEROS DE - ${dni} -\n\n`;
          topTxt += `➤ BASE DE DATOS:\n\n`;

          fs.writeFileSync(telxFile, topTxt);

          let replyToTxt;
          resultadosRestantes.forEach((dato) => {
            const number = dato.number;
            const name = dato.name;
            const lastname = dato.surname;
            const operator = dato.operator;

            replyToTxt += `NUMERO: ${number}\n`;
            replyToTxt += `OPERADOR: ${operator}\n`;
            replyToTxt += `NOMBRES: ${name}\n`;
            replyToTxt += `APELLIDOS: ${lastname}\n\n`;

            fs.appendFileSync(telxFile, replyToTxt);
          });

          replyToTxt += `➤ CONSULTADO POR:\n`;
          replyToTxt += `  ⌞ USUARIO: ${userId}\n`;
          replyToTxt += `  ⌞ NOMBRE: ${firstName}\n\n`;
          replyToTxt += `MENSAJE: La consulta se hizo de manera exitosa ♻.\n\n`;

          fs.appendFileSync(telxFile, replyToTxt);

          let replyTxt = `<b>[#LAIN-DOX 🌐]</b>\n\n`;
          replyTxt += `Se han <b>encontrado</b> más registros de números para el <code>${dni}</code>. En total, han sido <i>${resultadosRestantes.length} números</i> restantes.\n\n`;
          replyTxt += `<b>Para una mejor búsqueda,</b> la lista de números se ha guardado en este archivo de texto.`;

          setTimeout(async () => {
            await registrarConsulta(userId, firstName, `TELX 3`, dni, true);
            bot
              .sendDocument(chatId, telxFile, {
                caption: replyTxt,
                reply_to_message_id: msg.message_id,
              })
              .then(() => {
                fs.unlink(telxFile, (err) => {
                  if (err) {
                    console.error("Error al borrar el archivo:", err);
                    return;
                  }
                  console.log("Archivo borrado exitosamente.");
                })
                  .then(() => {
                    //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
                    if (!isDev && !isAdmin && !isBuyer) {
                      antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
                    }
                    //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
                    else if (isBuyer) {
                      antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
                    }
                  })
                  .catch((error) => {
                    console.log(
                      "Error al enviar al borrar el archivo: " + error
                    );
                  });
              })
              .catch((error) => {
                console.log("Error al envíar el archivo: " + error);
              });
          }, 1000);
        }
      }
    } catch (error) {
      let xerror = `*[ ✖️ ] Ningún registro encontrado en las bases de números*`;
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
