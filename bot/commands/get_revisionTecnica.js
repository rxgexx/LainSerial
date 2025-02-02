//SE REQUIRE LAS APIS

const { reviTec } = require("../api/api_Variados.js");

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
  bot.onText(/[\/.$?!]revitec (.+)/, async (msg, match) => {
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
    const pla = match[1];
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
    if (pla.length !== 6) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/revitec\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/revitec B1P691\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`REVICIÓNN TÉCNICA\` de la *➜ PLACA* \`${pla}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //RESPONSE TITULAR
      const responseTitular = await reviTec(pla);
      
      if (
        responseTitular.msg === "Mensaje: No se encontraron resultados." &&
        responseTitular.status === false
      ) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        const yx = `*[ ✖️ ] No se encontró registros de REVISIONES TÉCNICAS* de la *PLACA* \`${pla}\`.`;

        bot.sendMessage(chatId, yx, messageOptions);
      } else {
        const data = responseTitular.data;
        console.log(data);
        


        //CONSTRUCCIÓN DEL MENSAJE
        let telRes = `*[#LAIN-DOX 🌐] ➤ #REVI. TECNICA*\n\n`;
        telRes += `*[ ☑️ ] REVISIÓN TECNICA DE* - \`${pla}\` 🚗-\n\n`;

        telRes += `*➤ REGISTROS PUBLICADOS 📂:*\n\n`;

        //SI LOS NÚMEROS SON MENOR O IGUAL A 10 RESULTADOS
        if (data) {
          //POR CADA DATO
          data.forEach((dato) => {
            const ambito = dato.ambito;
            const certificado = dato.certificado;
            const direccion = dato.direccion;
            const entidad = dato.entidad;
            const estado = dato.estado;
            const fecinsp = dato.fecinsp;
            const fecvcto = dato.fecvcto;
            const obs = dato.obs;
            const resultado = dato.resultado;
            const servicio = dato.servicio;

            telRes += `  \`⌞\` *AMBITO:* \`${ambito}\`\n`;
            telRes += `  \`⌞\` *ESTADO:* \`${estado}\`\n`;
            telRes += `  \`⌞\` *ENTIDAD:* \`${entidad}\`\n`;
            telRes += `  \`⌞\` *RESULTADO:* \`${resultado}\`\n`;
            telRes += `  \`⌞\` *CERTIFICADO:* \`${certificado}\`\n`;
            telRes += `  \`⌞\` *OBSERVACIONES:* \`${obs}\`\n`;
            telRes += `  \`⌞\` *FE. INSCRITO:* \`${fecinsp}\`\n`;
            telRes += `  \`⌞\` *FE. VENCIMIENTO:* \`${fecvcto}\`\n`;
            telRes += `  \`⌞\` *TIPO. SERVICIO:* \`${servicio}\`\n`;
            telRes += `  \`⌞\` *DIRECCIÓN:* \`${direccion}\`\n\n`;
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
