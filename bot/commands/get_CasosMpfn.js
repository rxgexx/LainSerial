//SE REQUIRE LAS APIS
const { apiMPFN } = require("../api/api_Variados.js");

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
  bot.onText(/[\/.$?!]fxmpfn (.+)/, async (msg, match) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    // //BOT ANTI - BUG
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fxmpfn\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fxmpfn 27427864\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`CASOS MPFN\` del *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      const response = await apiMPFN(dni);

      if (
        response.mensaje === "No se encontraron datos para los valores dados."
      ) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        bot.sendMessage(
          chatId,
          `*[ ✖️ ] No se encontraron* casos para el *DNI* \`${dni}\`.`,
          messageOptions
        );
      } else {
        const casos = response.casos;
        const audiencias = response.libre;

        let res = `*[#LAIN-DOX 🌐] ➤ #CASOSMPFN*\n\n`;
        res += `*[ ☑️ ] CASOS:*\n\n`;

        casos.forEach((dato, index) => {
          const numero = index + 1;
          const caso = dato.caso;
          const distrito = dato.distrito;
          const sede = dato.sede;
          const nroExp = dato.nroExp;
          const año = dato.año;
          const defensor = dato.defensor;

          res += `*➜ CASO ${numero}*\n`;
          res += `  \`⌞\` *EXPEDIENTE:* \`${caso}\`\n`;
          res += `  \`⌞\` *DISTRITO:* \`${distrito}\`\n`;
          res += `  \`⌞\` *SEDE:* \`${sede}\`\n`;
          res += `  \`⌞\` *N° EXP.:* \`${nroExp}\`\n`;
          res += `  \`⌞\` *AÑO:* \`${año}\`\n`;
          res += `  \`⌞\` *ABOGADO:* \`${defensor}\`\n\n`;
        });

        if (audiencias.length === 0) {
          res += `_No se encontraron audiencias_\n\n`;

          res += `*➤ CONSULTADO POR:*\n`;
          res += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          res += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          res += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await bot
            .deleteMessage(chatId, consultandoMessage.message_id)
            .then(() => {
              bot.sendMessage(chatId, res, messageOptions);

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
          res += `*[ ☑️ ] AUDIENCIAS:*\n\n`;

          if (audiencias.length <= 5) {
            audiencias.forEach((dato, index) => {
              const numero = index + 1;
              const distrito = dato.distrito;
              const sede = dato.sede;
              const fecha = dato.fecha;
              const tipo = dato.tipo;
              const diligencia = dato.diligencia;
              const defensor = dato.defensor;

              res += `*➜ AUDIENCIA ${numero}*\n`;
              res += `  \`⌞\` *DISTRITO:* \`${distrito}\`\n`;
              res += `  \`⌞\` *SEDE:* \`${sede}\`\n`;
              res += `  \`⌞\` *FECHA:* \`${fecha}\`\n`;
              res += `  \`⌞\` *TIPO:* \`${tipo}\`\n`;
              res += `  \`⌞\` *DILIGENCIA:* \`${diligencia}\`\n`;
              res += `  \`⌞\` *ABOGADO:* \`${defensor}\`\n\n`;
            });

            res += `*➤ CONSULTADO POR:*\n`;
            res += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
            res += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
            res += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

            await bot
              .deleteMessage(chatId, consultandoMessage.message_id)
              .then(() => {
                bot.sendMessage(chatId, res, messageOptions);

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
            const maxResultsToShow = 5;
            //RESULTADOS QUE SE VAN A MOSTRAR CON EL TXT
            const resultadosParaMostrar = audiencias.slice(0, maxResultsToShow);
            const resultadosRestantes = audiencias.slice(maxResultsToShow);

            resultadosParaMostrar.forEach((dato, index) => {
              const numero = index + 1;
              const distrito = dato.distrito;
              const sede = dato.sede;
              const fecha = dato.fecha;
              const tipo = dato.tipo;
              const diligencia = dato.diligencia;
              const defensor = dato.defensor;

              res += `*➜ AUDIENCIA ${numero}*\n`;
              res += `  \`⌞\` *DISTRITO:* \`${distrito}\`\n`;
              res += `  \`⌞\` *SEDE:* \`${sede}\`\n`;
              res += `  \`⌞\` *FECHA:* \`${fecha}\`\n`;
              res += `  \`⌞\` *TIPO:* \`${tipo}\`\n`;
              res += `  \`⌞\` *DILIGENCIA:* \`${diligencia}\`\n`;
              res += `  \`⌞\` *ABOGADO:* \`${defensor}\`\n\n`;
            });

            res += `*➤ CONSULTADO POR:*\n`;
            res += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
            res += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
            res += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;
            await bot
              .deleteMessage(chatId, consultandoMessage.message_id)
              .then(() => {
                bot.sendMessage(chatId, res, messageOptions);
              });

            //SE INICIA CON EL TXT
            const telxFile = `AUDIENCIAS_MPFN_${dni}.txt`;

            //TOP TXT
            let topTxt = `[#LAIN-DOX 🌐]\n\n`;
            topTxt += `[ ☑️ ] CASOS DE - ${dni} -\n\n`;
            topTxt += `➤ AUDIENCIAS:\n\n`;

            fs.writeFileSync(telxFile, topTxt);

            let replyToTxt;
            resultadosRestantes.forEach((dato, index) => {
              const numero = index + 1;
              const distrito = dato.distrito;
              const sede = dato.sede;
              const fecha = dato.fecha;
              const tipo = dato.tipo;
              const diligencia = dato.diligencia;
              const defensor = dato.defensor;

              replyToTxt = `➜ AUDIENCIA ${numero}\n`;
              replyToTxt += `  ⌞ DISTRITO: ${distrito}\n`;
              replyToTxt += `  ⌞ SEDE: ${sede}\n`;
              replyToTxt += `  ⌞ FECHA: ${fecha}\n`;
              replyToTxt += `  ⌞ TIPO: ${tipo}\n`;
              replyToTxt += `  ⌞ DILIGENCIA: ${diligencia}\n`;
              replyToTxt += `  ⌞ ABOGADO: ${defensor}\n\n`;

              fs.appendFileSync(telxFile, replyToTxt);
            });

            replyToTxt += `➤ CONSULTADO POR:\n`;
            replyToTxt += `  ⌞ *USUARIO:* ${userId}\n`;
            replyToTxt += `  ⌞ *NOMBRE:* ${firstName}\n\n`;
            replyToTxt += `MENSAJE: La consulta se hizo de manera exitosa ♻.\n\n`;

            fs.appendFileSync(telxFile, replyToTxt);

            let replyTxt = `*[#LAIN-DOX 🌐]*\n\n`;
            replyTxt += `Se han *encontrado* más registros de audiencias para el \`${dni}\`. En total, han sido _${resultadosRestantes.length} audiencias_ restantes.\n\n`;
            replyTxt += `*Para una mejor búsqueda,* la lista se ha guardado en este archivo de texto.`;

            setTimeout(() => {
              bot
                .sendDocument(chatId, telxFile, {
                  caption: replyTxt,
                  reply_to_message_id: msg.message_id,
                  parse_mode: "Markdown",
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
