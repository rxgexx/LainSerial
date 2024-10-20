//APIS
const { getNombres } = require("../api/apis");

//FS
const fs = require("fs");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]nm (.+)/, async (msg, match) => {
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

    if (match && match[1]) {
      const input = match[1].trim();
      // Verificar si la entrada contiene el carácter "|"
      if (!input.includes("|")) {
        let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, asegúrate de usar el siguiente formato: \`/nm\` *nombre*|*apellido1*|*apellido2*\n\n`;
        replyToUsoIncorrecto += `*➜ EJEMPLO:* \`/nm Pedro|Castillo|Terrones\``;
        bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
        return;
      }
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    const consultandoMessage = await bot.sendMessage(
      chatId,
      `*[ 💬 ] Consultando* los \`NOMBRES\` dados *➜ DE* \`${match[1]
        .replace(/\|/g, " ")
        .toUpperCase()}\``,
      {
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
      }
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      const commandArgs = match[1].split("|").map((arg) => arg.trim());

      const nombre = commandArgs[0];
      const apellidoPaterno = commandArgs[1];
      const apellidoMaterno = commandArgs[2];

      // Verificar que al menos haya un apellido (paterno o materno)
      if (!apellidoPaterno && !apellidoMaterno) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        bot.sendMessage(
          chatId,
          `*[ ✖️ ] Debes proporcionar al menos un* apellido (paterno o materno).`,
          messageOptions
        );
        return;
      }
      // Realizar la consulta a la API con los parámetros obtenidos
      const responseNombres = await getNombres(
        nombre,
        apellidoPaterno,
        apellidoMaterno
      );

      if (
        responseNombres.message ===
        "No se encontró ningún resultado con los datos ingresados."
      ) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        let x = `*[ ✖️ ] No se han* encontrado personas para los _nombres dados._`;
        bot.sendMessage(chatId, x, messageOptions);
        return;
      } else {
        const nombresData = responseNombres.Resultados;

        //SI LOS RESULTADOS SON MENOS DE 10
        if (nombresData.length <= 10) {
          //CONSTRUCCIÓN DEL MENSAJE
          let replyDni = `*[#LAIN-V.1-BETA ⚡]*\n\n`;
          replyDni += `*[ ☑️ ] BÚSQUEDAS PERSONAS*\n\n`;
          replyDni += `*➤ TOTAL RESULTADOS:* ${nombresData.length}\n\n`;

          nombresData.forEach((dato, index) => {
            const nuPersona = index + 1;
            const nuDni = dato.nuDni;
            // const digitoVerificacion = dato.digitoVerificacion;
            const apePaterno = dato.apePaterno;
            const apeMaterno = dato.apeMaterno;
            const preNombres = dato.preNombres;
            const nuEdad = dato.nuEdad;

            replyDni += `  \`⌞\` *PERSONA:* \`${nuPersona}\`\n`;
            replyDni += `  \`⌞\` *N° DNI:* \`${nuDni}\`\n`;
            // replyDni += `  \`⌞\` *N° DNI:* \`${nuDni}\` - \`${digitoVerificacion}\`\n`;
            replyDni += `  \`⌞\` *NOMBRES:* \`${preNombres}\`\n`;
            replyDni += `  \`⌞\` *APELLIDOS:* \`${apePaterno} ${apeMaterno}\`\n`;
            replyDni += `  \`⌞\` *EDAD:* \`${nuEdad}\`\n\n`;
          });

          replyDni += `\n`;

          replyDni += `*➤ CONSULTADO POR:*\n`;
          replyDni += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          replyDni += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          replyDni += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot
            .sendMessage(chatId, replyDni, messageOptions)
            .then(() => {
              //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
              if (!isDev && !isAdmin && !isBuyer) {
                antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
              }
              //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
              else if (isBuyer) {
                antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
              }
            })
            .catch((error) => {
              console.log("Error al envíar mensaje en nombres: ", error);
            });
        } else {
          //SI LOS RESULTADOS EXECDEN A 10
          let topTxt = `[#LAIN-V.1-BETA ⚡]\n\n`;
          topTxt += `[ ☑️ ] BÚSQUEDAS PERSONAS\n\n`;
          topTxt += `➤ TOTAL RESULTADOS: ${nombresData.length}\n\n`;

          //NOMBRE DEL ARCHIVO
          const fileName = `Resultados para ${nombre.toUpperCase()}.txt`;

          fs.writeFileSync(fileName, topTxt);

          let replyToTxt;

          nombresData.forEach((dato, index) => {
            const nuPersona = index + 1;
            const nuDni = dato.nuDni;
            const digitoVerificacion = dato.digitoVerificacion;
            const apePaterno = dato.apePaterno;
            const apeMaterno = dato.apeMaterno;
            const preNombres = dato.preNombres;
            const nuEdad = dato.nuEdad;

            replyToTxt = `  ⌞ PERSONA: ${nuPersona}\n`;
            replyToTxt += `  ⌞ N° DNI: ${nuDni}\n`;
            // replyToTxt += `  ⌞ N° DNI: ${nuDni} - ${digitoVerificacion}\n`;
            replyToTxt += `  ⌞ NOMBRES: ${preNombres}\n`;
            replyToTxt += `  ⌞ APELLIDOS: ${apePaterno} ${apeMaterno}\n`;
            replyToTxt += `  ⌞ EDAD: ${nuEdad}\n\n`;

            fs.appendFileSync(fileName, replyToTxt);
          });

          replyToTxt += `\n`;

          replyToTxt += `➤ CONSULTADO POR:\n`;
          replyToTxt += `  ⌞ USUARIO: ${userId}\n`;
          replyToTxt += `  ⌞ NOMBRE: ${firstName}\n\n`;
          replyToTxt += `MENSAJE: La consulta se hizo de manera exitosa ♻.\n\n`;

          fs.appendFileSync(fileName, replyToTxt);

          let replyTxt = `*[#LAIN-V.1-BETA ⚡]*\n\n`;
          replyTxt += `*Queridx ${firstName},* se han encontrado un total de _${nombresData.length} personas_ para los \`NOMBRES\` que solicitaste.\n\n`;
          replyTxt += `Para una *mejor búsqueda,* los resultados _se han guardado_ en este archivo de texto.\n\n`;
          replyTxt += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot
            .sendDocument(chatId, fileName, {
              caption: replyTxt,
              reply_to_message_id: msg.message_id,
              parse_mode: "Markdown",
            })
            .then(() => {
              fs.unlink(fileName, (err) => {
                if (err) {
                  console.error("Error al borrar el archivo:", err);
                  return;
                }

                //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
                if (!isDev && !isAdmin && !isBuyer) {
                  antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
                }
                //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
                else if (isBuyer) {
                  antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
                }
              });
            })
            .catch((err) => {
              console.log("Error al borrar el archivo de texto: ", err);
            });
        }
      }
    } catch (error) {
      console.log("Error en el comando nombres: ", error);
      let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;
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
