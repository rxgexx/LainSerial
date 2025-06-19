//SE REQUIERE fs
const fs = require("fs");

//SE REQUIERE "pdfkit"
const PDFDocument = require("pdfkit");

//APIS
const { brevete_pdf } = require("../api/api_Variados.js");

//SE REQUIERE "path"
const path = require("path");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");
const { registrarConsulta } = require("../../sql/consultas.js");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//IMAGEN BUSCANDO
const imagenBuscando = path.join(__dirname, "../img/buscandoImg.jpg");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]licencia (.+)/, async (msg, match) => {
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/licencia\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/licencia 07768359\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    const y = `*[ ⚙️ ] Obteniendo* la \`LICENCIA ONLINE\` del *➜ DNI* \`${dni}\``;

    //Si todo se cumple, se iniciará con la consulta...
    const consultandoMessage = await bot.sendMessage(chatId, y, messageOptions);

    usuariosEnConsulta[userId] = true;

    try {
      const res = await brevete_pdf(dni);
      const response = res.data;

      if (response.data === null) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);

        let yx = `*[✖️] El DNI* \`${dni}\` *no cuenta con licencia.*`;

        return bot.sendMessage(chatId, yx, messageOptions);
      }
      console.log(response.data_brevete.data_brevete.data);

      const data_person =
        response.data_brevete.data_brevete.data.datosAdministrado
          .Administrados[0];
      const ApellidoMaterno = data_person.ApellidoMaterno;
      const ApellidoPaterno = data_person.ApellidoPaterno;
      const Restricciones1 = data_person.Restricciones1;
      const Nombre = data_person.Nombre;
      const FechaHoraRegistro = data_person.FechaHoraRegistro;

      const data_licencia =
        response.data_brevete.data_brevete.data.datosAdministrado.LicenciaA;
      const CentroEmision = data_licencia.CentroEmision;
      const Categoria = data_licencia.Categoria;
      const FechaEmision = data_licencia.FechaEmision;

      let reply = `*[#LAIN-DOX 🌐] ➤ #LICENCIA_PDF*\n\n`;
      reply += `*[ ☑️ ] LICENCIA PDF ONLINE -* \`${dni}\` *-*\n\n`;
      reply += `*➤ INF. PERSONA:*\n`;
      reply += `  \`⌞\` *CATEGORÍA:* \`${Categoria}\`\n`;
      reply += `  \`⌞\` *NOMBRES:* \`${Nombre}\`\n`;
      reply += `  \`⌞\` *APELLIDOS:* \`${ApellidoPaterno} ${ApellidoMaterno}\`\n`;
      reply += `  \`⌞\` *F. EMI. LICENCIA:* \`${FechaEmision}\`\n`;
      reply += `  \`⌞\` *F. REG. LICENCIA:* \`${FechaHoraRegistro}\`\n`;
      reply += `  \`⌞\` *RESTRICCIONES:* \`${Restricciones1}\`\n`;
      reply += `  \`⌞\` *CENTRO EMISOR:* \`${CentroEmision}\`\n\n`;
      reply += `*➤ CONSULTADO POR:*\n`;
      reply += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
      reply += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      reply += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      const pdf = response.data_brevete.pdf;
      const pdfbuffer = Buffer.from(pdf, "base64");
      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      bot
        .sendDocument(chatId, pdfbuffer, {
          caption: reply,
          parse_mode: "Markdown",
          reply_to_message_id: msg.message_id,
        })
        .then(async () => {
          await registrarConsulta(userId, firstName, `LICENCIA`, dni, true);
          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 350;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 150;
          }
        });
    } catch (error) {
      console.log(error);

      if (error.response && error.response.status === 524) {
        let yerror = `*[ ✖️ ] La búsqueda ha tardado mucho,* probablemente haya un _error interno del servidor,_ *intente más tarde*.`;

        await bot
          .deleteMessage(chatId, consultandoMessage.message_id)
          .then(() => {
            bot.sendMessage(chatId, yerror, messageOptions);
          });
      } else if (error.response && error.response.status === 404) {
        let zerror = `*[ ✖️ ] Ocurrió un error interno,* probablemente haya un _error interno del servidor,_ *intente más tarde*.`;

        await bot
          .deleteMessage(chatId, consultandoMessage.message_id)
          .then(() => {
            bot.sendMessage(chatId, zerror, messageOptions);
          });
      } else {
        let xerror = `*[✖️] El DNI* \`${dni}\` *no cuenta con licencia.*`;

        await bot
          .deleteMessage(chatId, consultandoMessage.message_id)
          .then(() => {
            bot.sendMessage(chatId, xerror, messageOptions);
          });
      }
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
