//SE REQUIRE LAS APIS
const { registrarConsulta } = require("../../sql/consultas.js");
const { claroDni } = require("../api/api_Telefonia.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//MOMENTO
const moment = require("moment");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]cladni (.+)/, async (msg, match) => {
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

    // //Rango Comprador
    // const isBuyer =
    //   rangosFilePath.BUYER && rangosFilePath.BUYER.includes(userId);

    const { checkIsBuyer } = require("../../sql/checkbuyer");
    //Rango Comprador
    const isBuyer = await checkIsBuyer(userId);

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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/cladni\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/cladni 45393644\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    // if (validarOp.data === "Error en la conexion con la fuente.") {
    //   let yxx = `*[ ✖️ ] Error al válidar el operador,* intente más tarde.`;
    //   return bot.sendMessage(chatId, yxx, messageOptions);
    // }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Buscando* \`NÚMEROS CLARO\` del *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      const responseClaro = await claroDni(dni);
      
      if (
        responseClaro.status === "False" &&
        responseClaro.mensaje === "No se encontro datos."
      ) {
        let yx = `*[ ✖️ ] No pude hallar números* del DNI \`${dni}\`.\n\n`;
        await bot.deleteMessage(chatId, consultandoMessage.message_id);

        return bot.sendMessage(chatId, yx, messageOptions);
      }

      const data = responseClaro.ListNum;

      let telRes = `*[#LAIN-DOX 🌐] ➤ #CLAROPORDNI*\n\n`;
      telRes += `*[ ☑️ ] NÚMEROS DE* - \`${dni}\` -\n\n`;
      telRes += `*➤ DATA. PERSONA*\n\n`;
      telRes += `  \`⌞\` *DNI:* \`${responseClaro.nuDni}\`\n`;
      telRes += `  \`⌞\` *EMAIL:* \`${responseClaro.email}\`\n`;
      telRes += `  \`⌞\` *TITULAR:* \`${responseClaro.nombre}\`\n`;
      telRes += `  \`⌞\` *PRIMER REGISTRO:* \`${responseClaro.fechaCreacion}\`\n\n`;
      telRes += `*➤ NÚMEROS CLARO EN TIEMPO REAL*\n\n`;
      //   telRes += `  \`⌞\` *DOCUMENTO:* \`${documento}\`\n`;
      //   telRes += `  \`⌞\` *NACIONALIDAD:* \`${nacionalidad}\`\n`;
      //   telRes += `  \`⌞\` *HORA. ACTIVACIÓN:* \`${Hora_Activacion}\`\n`;
      //   telRes += `  \`⌞\` *FECHA. ACTIVACIÓN:* \`${Fecha_Activacion}\`\n`;
      //   telRes += `  \`⌞\` *TIPO. PLAN:* \`${Tipo_Plan}\`\n\n`;
      //   telRes += `*➤ CONSULTADO POR:*\n`;
      //   telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
      //   telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      //   telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      data.forEach((data, index) => {
        const numero = data.nuCel;
        const señalTegnologia = data["señalTegnologia"];
        const modo = data.modo;
        const tipoLinea = data.tipoLinea;
        const indice = index + 1;

        telRes += `  \`⌞\` *REGISTRO:* \`${indice}\`\n`;
        telRes += `  \`⌞\` *NUMERO:* \`${numero}\`\n`;
        telRes += `  \`⌞\` *MODO:* \`${modo.toUpperCase()}\`\n`;
        telRes += `  \`⌞\` *TIPO. LÍNEA:* \`${tipoLinea.toUpperCase()}\`\n`;
        telRes += `  \`⌞\` *TIPO. SEÑAL:* \`${señalTegnologia}\`\n\n`;
      });

      telRes += `*➤ CONSULTADO POR:*\n`;
      telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
      telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      await bot
        .deleteMessage(chatId, consultandoMessage.message_id)
        .then(async () => {
          
          await registrarConsulta(userId, firstName, `CLARO POR DNI`, dni, true);
          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 80 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 80;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
          }

          bot.sendMessage(chatId, telRes, messageOptions);
        });
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
