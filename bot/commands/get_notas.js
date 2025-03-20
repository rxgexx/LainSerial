//SE REQUIERE fs
const fs = require("fs");

//SE REQUIERE "pdfkit"
const PDFDocument = require("pdfkit");

//APIS
const { apiNotas } = require("../api/api_Variados.js");

//SE REQUIERE "path"
const path = require("path");
const img = path.join(__dirname, "../img/siagie.png");
//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");
const { registrarConsulta } = require("../../sql/consultas.js");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]fxnotas (.+)/, async (msg, match) => {
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
    const gruposBloqueados = require("../config/gruposManager/gruposBloqueados.js");

    const grupoBloqueado = gruposBloqueados.includes(chatId);

    if (grupoBloqueado) {
      try {
        if (isDev) {
          let messageAdmin = `*[ ☑️ ] La prueba ha sido exitosa* querida administradora.`;

          bot.sendMessage(chatId, messageAdmin, messageOptions).then(() => {
            console.log("Test Positivo");
          });

          return;
        } else {
          let grupoBloqueado = `*[ ✖️ ] Grupo bloqueado*`;

          bot.sendMessage(chatId, grupoBloqueado, messageOptions).then(() => {
            console.log("Grupo bloqueado");
          });

          return;
        }
      } catch (error) {
        console.log("Error en la detección de grupo bloqueado: ", error);
      }
    }

    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando Ficha Azul: ",
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
          if (botIsAdmin) {
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
          } else {
            return bot.sendMessage(6484858971, noGrupo, {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            });
          }
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

    if (dni.length !== 8) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fxnotas\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fxnotas 07768359\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    usuariosEnConsulta[userId] = true;

    try {
      const responseNotas = await apiNotas(dni);
      const valorNotas = responseNotas;

      if (
        valorNotas.deRespuesta[0] ===
          "No se encontró información con los filtros ingresados." ||
        valorNotas.deRespuesta.includes(
          "Los datos ingresados NO corresponden a una persona de 16 años a más, deberá solicitar la constancia mediante la opción “Apoderado”."
        ) ||
        valorNotas.deRespuesta[0] ===
          "Cannot read properties of undefined (reading '0')" ||
        valorNotas.deRespuesta.includes("Padre no encontrado") ||
        valorNotas.deRespuesta.includes("Madre no encontrado") ||
        valorNotas.deRespuesta[0] === "Ubigeo no encontrado" ||
        valorNotas.deRespuesta[0] ===
          "Los datos ingresados no coinciden con los registrados en el RENIEC. Por favor, verifique que hayan sido ingresados correctamente."
      ) {
        let y = `*[ ✖️ ] No se han* encontrado datos para el *DNI* ingresado.`;

        bot.sendMessage(chatId, y, messageOptions);
      } else {
        
        if(responseNotas.coRespuesta === "9999"){
          return bot.sendPhoto(chatId, img, {
            caption: `*[ ✖️ ] SIAGIE* no ha validado al estudiante, *puede ser que sea menor de 16 años o no esté registrado.*\``,
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id,
          });
        }

        const infNotasArray = valorNotas.daSource; // Array de objetos

        // Función para guardar un PDF y enviar un mensaje
        async function guardarPDFyEnviarMensaje(pdf, infNotas, chatId, reply) {
          if (pdf) {
            // Decodifica el PDF base64
            const pdfBuffer = Buffer.from(pdf, "base64");
            const nombreArchivo = `${dni}_nivel_${infNotas.nivelColegio}.pdf`;

            try {
              // Escribir el PDF en disco
              await fs.promises.writeFile(nombreArchivo, pdfBuffer);

              console.log(`PDF GUARDADO CON ÉXITO: ${nombreArchivo}`);

              // Envía el documento a través de Telegram
              await bot.sendDocument(chatId, nombreArchivo, {
                caption: reply,
                parse_mode: "Markdown",
                reply_to_message_id: msg.message_id,
                thumb: path.resolve(__dirname, "../img/min_pdf.jpg"), // Ruta absoluta a la miniatura
              });

              console.log(`Documento enviado correctamente: ${nombreArchivo}`);
              fs.unlinkSync(nombreArchivo);
            } catch (error) {
              console.error(`Error al procesar PDF: ${error}`);
            }
          }
        }

        // Itera sobre cada elemento en infNotasArray
        for (let i = 0; i < infNotasArray.length; i++) {
          const infNotas = infNotasArray[i];
          const pdf = infNotas.pdf64;

          //   CONSTRUCCIÓN DEL MENSAJE
          let reply = `*[#LAIN-DOX 🌐]➤ #MINEDU*\n\n`;
          reply += `*[ ☑️ ] NOTAS ESCOLARES*\n\n`;
          reply += `*➜ REGISTRO* ${i + 1}*:*\n`;
          reply += `  \`⌞\` *AÑO:* \`${infNotas.idAnio}\`\n`;
          reply += `  \`⌞\` *JERARQUÍA:* \`${infNotas.nivelColegio}\`\n`;
          reply += `  \`⌞\` *CÓDIGO MODULAR:* \`${infNotas.codigoModular}\`\n`;
          reply += `  \`⌞\` *COLEGIO:* \`${infNotas.nombreIE}\`\n`;
          reply += `  \`⌞\` *GRADO. REGISTRO:* \`${infNotas.descripcionGrado} GRADO\`\n\n`;
          reply += `*➤ CONSULTADO POR:*\n`;
          reply += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          reply += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          reply += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await guardarPDFyEnviarMensaje(pdf, infNotas, chatId, reply);
        }

        //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
        if (!isDev && !isAdmin && !isBuyer) {
          antiSpam[userId] = Math.floor(Date.now() / 1000) + 80;
        }
        //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
        else if (isBuyer) {
          antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
        }

        await registrarConsulta(userId, firstName, `fxnotas`, dni, true);  

        // for (let i = 0; i < infNotasArray.length; i++) {
        //   const infNotas = infNotasArray[i];
        //   const pdf = infNotas.pdf64;

        //   //CONSTRUCCIÓN DEL MENSAJE
        //   let msg = `*[#LAIN-DOX 🌐]➤ #MINEDU*\n\n`;
        //   msg += `*[ ☑️ ] NOTAS ESCOLARES*\n\n`;
        //   msg += `*➜ REGISTRO* \`${i + 1}\`*:*\n`;
        //   msg += `  \`⌞\` *AÑO:* \`${infNotas.idAnio}\`\n`;
        //   msg += `  \`⌞\` *JERARQUÍA:* \`${infNotas.nivelColegio}\`\n`;
        //   msg += `  \`⌞\` *CÓDIGO MODULAR:* \`${infNotas.codigoModular}\`\n`;
        //   msg += `  \`⌞\` *COLEGIO:* \`${infNotas.nombreIE}\`\n`;
        //   msg += `  \`⌞\` *GRADO. REGISTRO:* \`${infNotas.descripcionGrado} GRADO\`\n\n`;

        //   await bot.deleteMessage(chatId, consultandoMessage.message_id);

        //   if (pdf) {
        //     // Decodifica el PDF base64
        //     const pdfBuffer = Buffer.from(pdf, "base64");
        //     const nombreArchivo = `${dni}_nivel_${infNotas.nivelColegio}.pdf`;

        //     fs.writeFileSync(nombreArchivo, pdfBuffer);

        //     console.log(`PDF ${i + 1} GUARDADO CON ÉXITO: ${nombreArchivo}`);

        //     bot.sendDocument(chatId, nombreArchivo, {
        //       caption: msg,
        //       parse_mode: "Markdown",
        //       reply_to_message_id: msg.message_id,
        //       thumb: path.resolve(__dirname, "../img/min_pdf.jpg"), // Ruta absoluta a la miniatura
        //     });
        //   }
        // }
      }
    } catch (error) {
      console.log(error);

      let y = `*[ ✖️ ] Error en la consulta,* recuerda que el _comando está en fase de prueba,_ el problema ha sido \`notificado a la developer :)\``;
      bot.sendMessage(chatId, y, messageOptions);
      let q = `*[ ✖️ ] Error en el comando /fxnotas,* con el DNI ${dni}.`;

      bot.sendMessage(6484858971, q, { parse_mode: "Markdown" });
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
