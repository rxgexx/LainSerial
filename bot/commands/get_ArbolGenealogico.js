//SE REQUIRE LAS APIS
const { arbolGen } = require("../api/apis.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//FS
const fs = require("fs");

const { registrarConsulta } = require("../../sql/consultas.js");


//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]arbg (.+)/, async (msg, match) => {
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

    const { checkIsBuyer } = require("../../sql/checkbuyer.js");
    //Rango Comprador
    const isBuyer = await checkIsBuyer(userId);
    
    const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");
    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando titularBitel: ",
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/arbg\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/arbg 44443333\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando el* \`ÁRBOL GENEALÓGICO\` del *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //ARBOL RESPONSE
      const dataArbol = await arbolGen(dni);

      // const responseArbol = resApi;
      // console.log(responseArbol);

      // responseArbol.forEach((dato)=>{
      //   const nuDni = dato.VERIFICACION.replace(/\n<b>Dev:<\/b> @g4t1ll3r0/g, '');
      //   console.log(nuDni);
      // })
      // return
      // console.log(responseArbol.error);

      //SI NO ENCUENTRA RESULTADOS...
      if (!dataArbol.data.data_arbol) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        return bot.sendMessage(
          chatId,
          `<b>[ ✖️ ] No se encontraron FAMILIARES para este DNI.</b>`,
          messageOptions
        );
      }else {
        //CONSTRUCCIÓN DEL MENSAJE
        let dniRes = `*[#LAIN-DOX 🌐]*\n\n`;
        dniRes += `*[ ☑️ ] ÁRBOL GENEALÓGICO DE* - \`${dni}\` -\n\n`;
        dniRes += `*➤ RESULTADOS:*\n\n`;
        
        const responseArbol = dataArbol.data.data_arbol.lista_registros 

        //SI LOS RESULTADOS SON MENOS O IGUAL A 8
        if (responseArbol.length <= 5) {
          responseArbol.forEach((dato) => {
            const nuDni = dato.DNI;
            const apellidos = dato.APELLIDOS;
            const preNombres = dato.NOMBRES;
            const sexo = dato.GENERO;
            const nuEdad = dato.EDAD;
            const tipo = dato.TIPO;
            const verificacion = dato.VERIFICACION;

            dniRes += `  \`⌞\` *DNI:* \`${nuDni}\`\n`;
            dniRes += `  \`⌞\` *SEXO:* \`${sexo}\`\n`;
            dniRes += `  \`⌞\` *NOMBRES:* \`${preNombres}\`\n`;
            dniRes += `  \`⌞\` *APELLIDOS:* \`${apellidos}\`\n`;
            dniRes += `  \`⌞\` *EDAD:* \`${nuEdad}\`\n`;
            dniRes += `  \`⌞\` *VÍNCULO:* \`${tipo}\`\n`;
            dniRes += `  \`⌞\` *VERIFICACIÓN:* \`${verificacion}\`\n\n`;
          });

          dniRes += `*➤ CONSULTADO POR:*\n`;
          dniRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          dniRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          dniRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot.sendMessage(chatId, dniRes, messageOptions);
        } else {
          //TXT
          const maxResultsToShow = 5;
          //RESULTADOS QUE SE VAN A MOSTRAR CON EL TXT
          const resultadosParaMostrar = responseArbol.slice(
            0,
            maxResultsToShow
          );
          const resultadosRestantes = responseArbol.slice(maxResultsToShow);

          resultadosParaMostrar.forEach((dato) => {
            const nuDni = dato.DNI;
            const apellidos = dato.APELLIDOS;
            const preNombres = dato.NOMBRES;
            const sexo = dato.GENERO;
            const nuEdad = dato.EDAD;
            const tipo = dato.TIPO;
            const verificacion = dato.VERIFICACION;

            dniRes += `  \`⌞\` *DNI:* \`${nuDni}\`\n`;
            dniRes += `  \`⌞\` *SEXO:* \`${sexo}\`\n`;
            dniRes += `  \`⌞\` *NOMBRES:* \`${preNombres}\`\n`;
            dniRes += `  \`⌞\` *APELLIDOS:* \`${apellidos}\`\n`;
            dniRes += `  \`⌞\` *EDAD:* \`${nuEdad}\`\n`;
            dniRes += `  \`⌞\` *VÍNCULO:* \`${tipo}\`\n`;
            dniRes += `  \`⌞\` *VERIFICACIÓN:* \`${verificacion}\`\n\n`;
          });

          dniRes += `*➤ CONSULTADO POR:*\n`;
          dniRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          dniRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          dniRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          bot.sendMessage(chatId, dniRes, messageOptions);

          let topTxt = `[#LAIN-DOX 🌐]\n\n`;
          topTxt += `[ ☑️ ] ÁRBOL GENEALÓGICO DE - ${dni} -\n\n`;
          topTxt += `➤ RESULTADOS:\n\n`;

          //TXT NOMBRE
          const arbgFile = `FAMILIARES_${dni}.txt`;

          fs.writeFileSync(arbgFile, topTxt);

          let replyToTxt;
          resultadosRestantes.forEach((dato) => {
            const nuDni = dato.DNI;
            const apellidos = dato.APELLIDOS;
            const preNombres = dato.NOMBRES;
            const sexo = dato.GENERO;
            const nuEdad = dato.EDAD;
            const tipo = dato.TIPO;
            const verificacion = dato.VERIFICACION;
            
            replyToTxt = `  ⌞ DNI: ${nuDni}\n`;
            replyToTxt += `  ⌞ SEXO: ${sexo}\n`;
            replyToTxt += `  ⌞ NOMBRES: ${preNombres}\n`;
            replyToTxt += `  ⌞ APELLIDOS: ${apellidos}\n`;
            replyToTxt += `  ⌞ EDAD: ${nuEdad}\n`;
            replyToTxt += `  ⌞ VÍNCULO: ${tipo}\n`;
            replyToTxt += `  ⌞ VERIFICACIÓN: ${verificacion}\n\n`;

            fs.appendFileSync(arbgFile, replyToTxt);
          });

          replyToTxt += `➤ CONSULTADO POR:\n`;
          replyToTxt += `  ⌞ USUARIO: ${userId}\n`;
          replyToTxt += `  ⌞ NOMBRE: ${firstName}\n\n`;
          replyToTxt += `MENSAJE: La consulta se hizo de manera exitosa ♻.\n\n`;

          fs.appendFileSync(arbgFile, replyToTxt);

          let replyTxt = `*[#LAIN-DOX 🌐]*\n\n`;
          replyTxt += `Se han *encontrado* más registros de familaires para el \`${dni}\`. En total, han sido _${resultadosRestantes.length} familiares_ restantes.\n\n`;
          replyTxt += `*Para una mejor búsqueda,* la lista de familiares se ha guardado en este archivo de texto.`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);

          setTimeout(() => {
            bot
              .sendDocument(chatId, arbgFile, {
                caption: replyTxt,
                reply_to_message_id: msg.message_id,
                parse_mode: "Markdown",
              })
              .then(() => {
                fs.unlink(arbgFile, (err) => {
                  if (err) {
                    console.error("Error al borrar el archivo:", err);
                    return;
                  }
                  //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
                  if (!isDev && !isAdmin && !isBuyer) {
                    antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
                  }
                  //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
                  else if (isBuyer) {
                    antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
                  }
                });
              })
              .catch((error) => {
                console.log("Error al envíar el archivo: " + error);
              });
          }, 1000);
        }
      }

      registrarConsulta(userId, firstName, "ARBOL GENEALOGICO", dni, true)

    } catch (error) {
      const yx = `*[ ✖️ ] No pude hallar registros de familiares* del DNI \`${dni}\`.`;
      console.log(error);
      await bot
        .deleteMessage(chatId, consultandoMessage.message_id)
        .then(() => {
          bot.sendMessage(chatId, yx, messageOptions);
        });
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
