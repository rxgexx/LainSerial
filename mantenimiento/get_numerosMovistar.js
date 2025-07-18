//SE REQUIRE LAS APIS
const { apiMovDni } = require("../bot/api/api_Telefonia.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../bot/config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//FS
const fs = require("fs");

function convertirFechaLocal(fechaISO) {
  // Convertir la fecha ISO a objeto Date
  const fecha = new Date(fechaISO);

  // Convertir la fecha a la zona horaria de Lima, Perú
  fecha.toLocaleString("es-PE", { timeZone: "America/Lima" });

  // Formatear la fecha y hora en el formato deseado (dd/mm/aa - hh:mm:ss)
  const dia = fecha.getDate().toString().padStart(2, "0");
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const anio = fecha.getFullYear().toString().slice(2);
  const hora = fecha.getHours().toString().padStart(2, "0");
  const minutos = fecha.getMinutes().toString().padStart(2, "0");
  const segundos = fecha.getSeconds().toString().padStart(2, "0");

  return `${dia}/${mes}/${anio} - ${hora}:${minutos}:${segundos}`;
}

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]movdni (.+)/, async (msg, match) => {
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
          "Error al obtener la información del Bot en el comando apiMovDni: ",
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/movdni\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/movdni 44444444\`*]*\n\n`;

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
      const responseTitular = await apiMovDni(dni);

      if (responseTitular.error === "Sin datos encontrados.") {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        const yx = `*[ ✖️ ] El cliente* \`${dni}\` *no es* \`MOVISTAR\` o no tiene líneas a su nombre.`;

        bot.sendMessage(chatId, yx, messageOptions);
      } else {
        //RESPONSE TITULAR
        const baseNumeros = responseTitular;

        //CONSTRUCCIÓN DEL MENSAJE
        let telRes = `*[#LAIN-DOX 🌐] ➤ #MOVISTARONLINE*\n\n`;
        telRes += `*[ ☑️ ] NUMEROS MOVISTAR DE* - \`${dni}\` -\n\n`;
        telRes += `*➤ NÚMEROS MOV. EN TIEMPO REAL:*\n\n`;
        // telRes += `  \`⌞\` *TITULAR:* \`${responseTitular.titular}\`\n\n`;

        baseNumeros.forEach((dato, index) => {
          const lista = index + 1;
          const numero = dato.numProducto;
          const imei = dato.celInfo.numImei;
          const productoTipo = dato.tipProducto;
          const titular = dato.nomTitular;

          telRes += `  \`⌞\` *REGISTRO:* \`${lista}\`\n`;
          telRes += `  \`⌞\` *NÚMERO:* \`${numero}\`\n`;
          telRes += `  \`⌞\` *TITULAR:* \`${titular.toUpperCase()}\`\n`;
          telRes += `  \`⌞\` *TIPO. EQUIPO:* \`${productoTipo.toUpperCase()}\`\n`;
          telRes += `  \`⌞\` *IMEI:* \`${imei}\`\n`;

          if (dato.feActivacion) {
            const feActivacion = dato.feActivacion;
            telRes += `  \`⌞\` *FECHA. ACTIVACIÓN:* \`${convertirFechaLocal(
              feActivacion
            )}\`\n`;
          }

          if (dato.desTecnologia !== null) {
            const tecnologia = dato.desTecnologia;
            telRes += `  \`⌞\` *TECNOLOGÍA:* \`${tecnologia}\`\n`;
          }
          if (dato.celInfo !== null) {
            const feCompra = dato.celInfo.feCompra;

            telRes += `  \`⌞\` *FECHA. COMPRA:* \`${feCompra}\`\n`;
          }
          const status = dato.estProducto;
          telRes += `  \`⌞\` *ESTADO:* \`${status.toUpperCase()}\`\n\n`;
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

        //CONSTRUCCIÓN DEL MENSAJE

        // //SI LOS NÚMEROS SON MENOR O IGUAL A 10 RESULTADOS
        // if (dataNumeros.length <= 6) {
        //   //POR CADA DATO
        //   dataNumeros.forEach((dato) => {
        //     const number = dato.number;
        //     const operator = dato.operator;
        //     const type = dato.type;
        //     const plan = dato.plan;
        //     telRes += `*➜ :*\n\n`;
        //     telRes += `  \`⌞\` *NÚMERO:* \`${number}\`\n`;
        //     telRes += `  \`⌞\` *OPERADOR:* \`${operator}\`\n`;
        //     telRes += `  \`⌞\` *TIPO:* \`${type}\`\n`;
        //     telRes += `  \`⌞\` *PLAN:* \`${plan}\`\n\n`;
        //   });

        //   telRes += `*➤ CONSULTADO POR:*\n`;
        //   telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
        //   telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
        //   telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

        //   await bot.deleteMessage(chatId, consultandoMessage.message_id);
        //   bot.sendMessage(chatId, telRes, messageOptions).then(() => {
        //     //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
        //     if (!isDev && !isAdmin && !isBuyer) {
        //       antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
        //     }
        //     //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
        //     else if (isBuyer) {
        //       antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
        //     }
        //   });
        // } else {
        //   //TXT
        //   const maxResultsToShow = 6;
        //   //RESULTADOS QUE SE VAN A MOSTRAR CON EL TXT
        //   const resultadosParaMostrar = dataNumeros.slice(0, maxResultsToShow);
        //   const resultadosRestantes = dataNumeros.slice(maxResultsToShow);

        //   resultadosParaMostrar.forEach((dato) => {
        //     const number = dato.number;
        //     const operator = dato.operator;
        //     const type = dato.type;
        //     const plan = dato.plan;

        //     telRes += `  \`⌞\` *NÚMERO:* \`${number}\`\n`;
        //     telRes += `  \`⌞\` *OPERADOR:* \`${operator}\`\n`;
        //     telRes += `  \`⌞\` *TIPO:* \`${type}\`\n`;
        //     telRes += `  \`⌞\` *PLAN:* \`${plan}\`\n\n`;
        //   });

        //   telRes += `*➤ CONSULTADO POR:*\n`;
        //   telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
        //   telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
        //   telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

        //   await bot.deleteMessage(chatId, consultandoMessage.message_id);
        //   bot.sendMessage(chatId, telRes, messageOptions);

        //   //SE INICIA CON EL TXT
        //   const movdniFile = `NÚMEROS_TELF_${dni}.txt`;

        //   //TOP TXT
        //   let topTxt = `[#LAIN-DOX 🌐]\n\n`;
        //   topTxt += `[ ☑️ ] NUMEROS DE - ${dni} -\n\n`;
        //   topTxt += `➤ BASE DE DATOS:\n\n`;

        //   fs.writeFileSync(movdniFile, topTxt);

        //   let replyToTxt;
        //   resultadosRestantes.forEach((dato) => {
        //     const number = dato.number;
        //     const operator = dato.operator;
        //     const type = dato.type;
        //     const plan = dato.plan;

        //     replyToTxt = `  ⌞ NÚMERO: ${number}\n`;
        //     replyToTxt += `  ⌞ OPERADOR: ${operator}\n`;
        //     replyToTxt += `  ⌞ TIPO: ${type}\n`;
        //     replyToTxt += `  ⌞ PLAN: ${plan}\n\n`;

        //     fs.appendFileSync(movdniFile, replyToTxt);
        //   });

        //   replyToTxt += `➤ CONSULTADO POR:\n`;
        //   replyToTxt += `  ⌞ *USUARIO:* ${userId}\n`;
        //   replyToTxt += `  ⌞ *NOMBRE:* ${firstName}\n\n`;
        //   replyToTxt += `MENSAJE: La consulta se hizo de manera exitosa ♻.\n\n`;

        //   fs.appendFileSync(movdniFile, replyToTxt);

        //   let replyTxt = `*[#LAIN-DOX 🌐]*\n\n`;
        //   replyTxt += `Se han *encontrado* más registros de números para el \`${dni}\`. En total, han sido _${resultadosRestantes.length} números_ restantes.\n\n`;
        //   replyTxt += `*Para una mejor búsqueda,* la lista de números se ha guardado en este archivo de texto.`;

        //   setTimeout(() => {
        //     bot
        //       .sendDocument(chatId, movdniFile, {
        //         caption: replyTxt,
        //         reply_to_message_id: msg.message_id,
        //         parse_mode: "Markdown",
        //       })
        //       .then(() => {
        //         fs.unlink(movdniFile, (err) => {
        //           if (err) {
        //             console.error("Error al borrar el archivo:", err);
        //             return;
        //           }
        //           console.log("Archivo borrado exitosamente.");
        //         })
        //           .then(() => {
        //             //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
        //             if (!isDev && !isAdmin && !isBuyer) {
        //               antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
        //             }
        //             //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
        //             else if (isBuyer) {
        //               antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
        //             }
        //           })
        //           .catch((error) => {
        //             console.log(
        //               "Error al enviar al borrar el archivo: " + error
        //             );
        //           });
        //       })
        //       .catch((error) => {
        //         console.log("Error al envíar el archivo: " + error);
        //       });
        //   }, 1000);
        // }
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
