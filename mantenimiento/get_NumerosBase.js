//SE REQUIRE LAS APIS
const { registrarConsulta } = require("../sql/consultas.js");
const { datosNum } = require("../bot/api/apis.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../bot/config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//FS
const fs = require("fs");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]telx (.+)/, async (msg, match) => {
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
          "Error al obtener la información del Bot en el comando datosNum: ",
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/telx\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/telx 44444444\`*]*\n\n`;

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
      const responseTitular = await datosNum(dni);

      if (responseTitular.numbers.length === 0) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        const yx = `*[ ✖️ ] No pude hallar registros de números* del DNI \`${dni}\`.`;

        bot.sendMessage(chatId, yx, messageOptions);
      } else {
        //RESPONSE TITULAR
        const dataNumeros = responseTitular.numbers;
        // const titular = responseTitular.datos.surname + responseTitular.datos.name;

        //CONSTRUCCIÓN DEL MENSAJE
        let telRes = `*[#LAIN-DOX 🌐]*\n\n`;
        telRes += `*[ ☑️ ] NUMEROS DE* - \`${dni}\` -\n\n`;
        telRes += `*➤ INF. PERSONA:*\n`;
        // telRes += `  \`⌞\` *DNI:* \`${dni}\`\n`;
        // telRes += `  \`⌞\` *TITULAR:* \`${titular}\`\n\n`;

        telRes += `*➤ BASE DE DATOS:*\n\n`;

        //SI LOS NÚMEROS SON MENOR O IGUAL A 10 RESULTADOS
        if (dataNumeros.length <= 6) {
          //POR CADA DATO
          dataNumeros.forEach((dato) => {
            const number = dato.number;
            const operator = dato.operator;
            const type = dato.type;
            const plan = dato.plan;

            telRes += `  \`⌞\` *NÚMERO:* \`${number}\`\n`;
            telRes += `  \`⌞\` *OPERADOR:* \`${operator}\`\n`;
            telRes += `  \`⌞\` *TIPO:* \`${type}\`\n`;
            telRes += `  \`⌞\` *PLAN:* \`${plan}\`\n\n`;
          });

          telRes += `*➤ CONSULTADO POR:*\n`;
          telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot.sendMessage(chatId, telRes, messageOptions).then(() => {
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
          const resultadosParaMostrar = dataNumeros.slice(0, maxResultsToShow);
          const resultadosRestantes = dataNumeros.slice(maxResultsToShow);

          resultadosParaMostrar.forEach((dato) => {
            const number = dato.number;
            const operator = dato.operator;
            const type = dato.type;
            const plan = dato.plan;

            telRes += `  \`⌞\` *NÚMERO:* \`${number}\`\n`;
            telRes += `  \`⌞\` *OPERADOR:* \`${operator}\`\n`;
            telRes += `  \`⌞\` *TIPO:* \`${type}\`\n`;
            telRes += `  \`⌞\` *PLAN:* \`${plan}\`\n\n`;
          });

          telRes += `*➤ CONSULTADO POR:*\n`;
          telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot.sendMessage(chatId, telRes, messageOptions);

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
            const operator = dato.operator;
            const type = dato.type;
            const plan = dato.plan;

            replyToTxt = `  ⌞ NÚMERO: ${number}\n`;
            replyToTxt += `  ⌞ OPERADOR: ${operator}\n`;
            replyToTxt += `  ⌞ TIPO: ${type}\n`;
            replyToTxt += `  ⌞ PLAN: ${plan}\n\n`;

            fs.appendFileSync(telxFile, replyToTxt);
          });

          replyToTxt += `➤ CONSULTADO POR:\n`;
          replyToTxt += `  ⌞ *USUARIO:* ${userId}\n`;
          replyToTxt += `  ⌞ *NOMBRE:* ${firstName}\n\n`;
          replyToTxt += `MENSAJE: La consulta se hizo de manera exitosa ♻.\n\n`;

          fs.appendFileSync(telxFile, replyToTxt);

          let replyTxt = `*[#LAIN-DOX 🌐]*\n\n`;
          replyTxt += `Se han *encontrado* más registros de números para el \`${dni}\`. En total, han sido _${resultadosRestantes.length} números_ restantes.\n\n`;
          replyTxt += `*Para una mejor búsqueda,* la lista de números se ha guardado en este archivo de texto.`;

          setTimeout(() => {
            bot
              .sendDocument(chatId, telxFile, {
                caption: replyTxt,
                reply_to_message_id: msg.message_id,
                parse_mode: "Markdown",
              })
              .then(async() => {
                await registrarConsulta(userId, firstName, "telx", dni, true);
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
