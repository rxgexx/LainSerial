//SE REQUIRE LAS APIS
const { validarOp, titularMov } = require("../api/api_Telefonia.js");

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
  bot.onText(/[\/.$?!]movx (.+)/, async (msg, match) => {
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
    const tel = match[1];
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
    if (tel.length !== 9) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/movx\`*]* seguido de un número de *CELULAR* de \`9 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/movx 957908908\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    const validarOperador = await validarOp(tel);

    if (validarOperador.data === "Error en la conexion con la fuente.") {
      let yxx = `*[ ✖️ ] Error al válidar el operdaor,* intente más tarde.`;
      return bot.sendMessage(chatId, yxx, messageOptions);
    }

    const datosNum = validarOperador.datos;

    if (datosNum.operador !== "Movistar Peru") {
      let yxx = `*[ ✖️ ] EL NÚMERO* no es *MOVISTAR*.`;

      return bot.sendMessage(chatId, yxx, messageOptions);
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando el* \`TITULAR MOVISTAR\` del *➜ NÚMERO* \`${tel}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //RESPONSE MOVISTAR
      const responseMov = await titularMov(tel);
      console.log(responseMov);
      
      if (responseMov.error === "No se encontro datos.") {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        let yx = `*[ ✖️ ] No pude hallar el titular* del número \`${tel}\`, de seguro el *número* no es Movistar.\n\n`;
        yx += `✅ Si *crees* que se trata de un error. Intenta de nuevo o *comunícate* con la \`developer\`.\n\n`;

        bot.sendMessage(chatId, yx, messageOptions).then(() => {
          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 80 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 15;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 10;
          }
        });
        return;
      } else {
        //RESPONSE MOVISTAR
        const dataMovistar = responseMov[0];
        
        
        //DATOS MOVISTAR
        const tipoProducto = dataMovistar.tipoProducto;
        const modo = dataMovistar.desProducto;
        const plan = dataMovistar.nomProducto;
        const tipoDoc = dataMovistar.tipDocumento;
        const imei = dataMovistar.celInfo.numImei;
        const titular = dataMovistar.nomTitular;
        const tecnologia = dataMovistar.desTecnologia;
        const tipProducto = dataMovistar.tipProducto;
        const feCompra = dataMovistar.celInfo.feCompra;
        const documento = dataMovistar.numDocumento;
        const fechaActivacion = dataMovistar.feActivacion;
        //PONER FORMATO CORRECTO LA FECHA
        const fecha = moment(fechaActivacion);
        const fechaPeru = fecha.utcOffset(-5).format("YYYY-MM-DD HH:mm:ss");
        //MENSAJE DEL BOT
        let telRes = `*[#LAIN-DOX 🌐] ➤ #MOVISTAR*\n\n`;
        telRes += `*[ ☑️ ] TITULAR DE* - \`${tel}\` -\n\n`;
        telRes += `*➤ MOVISTAR EN TIEMPO REAL*\n`;
        telRes += `  \`⌞\` *TIPO. DOC:* \`${tipoDoc}\`\n`;  
        telRes += `  \`⌞\` *DOCUMENTO:* \`${documento}\`\n`;
        telRes += `  \`⌞\` *TITULAR:* \`${titular}\`\n`;
        telRes += `  \`⌞\` *IMEI:* \`${imei}\`\n`;
        telRes += `  \`⌞\` *TECONOLOGÍA:* \`${tecnologia}\`\n`;
        telRes += `  \`⌞\` *TIPO:* \`${tipProducto.toUpperCase()}\`\n`;
        telRes += `  \`⌞\` *PLAN. LÍNEA:* \`${plan.toUpperCase()}\`\n`;
        telRes += `  \`⌞\` *MODO. LÍNEA:* \`${modo.toUpperCase()}\`\n`;
        telRes += `  \`⌞\` *FECHA. ACTIVACIÓN:* \`${fechaPeru}\`\n`;
        telRes += `  \`⌞\` *FECHA. COMPRA:* \`${feCompra}\`\n`;
        telRes += `  \`⌞\` *TIPO. PRODUCTO:* \`${tipProducto.toUpperCase()}\`\n\n`;
        telRes += `*➤ CONSULTADO POR:*\n`;
        telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
        telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
        telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        bot
          .sendMessage(chatId, telRes, messageOptions)
          .then(() => {
            //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 80 segundos
            if (!isDev && !isAdmin && !isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
            }
            //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
            else if (isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
            }
          }).catch((error) => {
            console.log(
              "Error al enviar el mensaje en la API TITULAR MOVISTAR: " + error
            );
          });
      }
    } catch (error) {
      // let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;
      let xerror = `*[ ✖️ ] Titular MOVISTAR no encontrado,* es posible que la *línea* no sea Movistar.`;
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
