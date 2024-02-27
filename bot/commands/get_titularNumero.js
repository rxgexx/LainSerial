//APIS
const { getApiTel } = require("../api/apis");

//SE REQUIERE "path"
const path = require("path");

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
  bot.onText(/[\/.$?!]celx (.+)/, async (msg, match) => {
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
    const cel = match[1];
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
          "Error al obtener la información del Bot en el comando Acta Nacimiento: ",
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
          `*[ ⏳ ] ${firstName},* debes esperar \`${tiempoRestante} segundos\` para volver a utilizar este comando.`,
          messageOptions
        );
        delete usuariosEnConsulta[userId];
        return;
      }
    }

    if (cel.length !== 9) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/celx\`*]* seguido de un número de *CELULAR* de \`9 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/celx 957908908\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    //Si todo se cumple, se iniciará con la consulta...
    const consultandoMessage = await bot.sendMessage(
      chatId,
      `*[ ⚙️ ] Buscando* el \`TITULAR\` del *➜ NÚMERO* \`${cel}\``,
      {
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
      }
    );

    usuariosEnConsulta[userId] = true;

    try {
      const responseApiTel = await getApiTel(cel).catch((error) => {
        console.log("Error al obtener la data desde la API-TEL");
      });
      const statusTel = responseApiTel.status;

      //SI NO ENCUENTRA DATOS
      if (statusTel === false) {
        let noDatos = `*[ ✖️ ] No pude hallar el titular* del número \`${cel}\`.`;

        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        bot.sendMessage(chatId, noDatos, messageOptions);
        //
      } else {
        //SI ENCUENTRA Y ES BITEL...
        if (responseApiTel.servicio === "Bitel") {
          console.log("me detengo en bitel");
          //RESPONSE BITEL
          const dataBitel = await responseApiTel.data.data;
          console.log(dataBitel);
          //DATOS BITEL
          const hora = dataBitel.hora;
          const modo = dataBitel.modo;
          const plan = dataBitel.plan;
          const titular = dataBitel.titular;
          const documento = dataBitel.documento;
          const feActivacion = dataBitel.fecActivacion;
          //MENSAJE DEL BOT
          let telRes = `*[#LAIN-DOX 🌐]*\n\n`;
          telRes += `*[ ☑️ ] TITULAR DE* - \`${cel}\` -\n\n`;
          telRes += `*➤ BITEL EN TIEMPO REAL*\n`;
          telRes += `  \`⌞\` *DOCUMENTO:* \`${documento}\`\n`;
          telRes += `  \`⌞\` *TITULAR:* \`${titular}\`\n`;
          telRes += `  \`⌞\` *PLAN. LÍNEA:* \`${plan}\`\n`;
          telRes += `  \`⌞\` *FECHA. ACTIVACIÓN:* \`${feActivacion}\`\n`;
          telRes += `  \`⌞\` *HORA. ACTIVACIÓN:* \`${hora}\`\n`;
          telRes += `  \`⌞\` *MODO. LÍNEA:* \`${modo}\`\n\n`;
          telRes += `*➤ CONSULTADO POR:*\n`;
          telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot
            .sendMessage(chatId, telRes, messageOptions)
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
                "Error al enviar el mensaje en la sección BITEL: " + error
              );
            });
          return;
        } else if (responseApiTel.servicio === "Claro") {
          //RESPONSE CLARO
          const dataClaro = responseApiTel.data.result;
          console.log(dataClaro);
          //DATOS CLARO
          const apellidos = dataClaro.apellidos;
          const correo = dataClaro.correo;
          const documento = dataClaro.documento;
          const modo = dataClaro.modo;
          const nombres = dataClaro.nombres;
          const plan = dataClaro.plan;
          const razon_social = dataClaro.razon_social;
          //MENSAJE DEL BOT
          let telRes = `*[#LAIN-DOX 🌐]*\n\n`;
          telRes += `*[ ☑️ ] TITULAR DE* - \`${cel}\` -\n\n`;
          telRes += `*➤ CLARO EN TIEMPO REAL*\n`;
          telRes += `  \`⌞\` *DOCUMENTO:* \`${documento}\`\n`;
          telRes += `  \`⌞\` *TITULAR:* \`${nombres} ${apellidos}\`\n`;
          if (correo !== "-" || correo.length === 0) {
            telRes += `  \`⌞\` *CORREO:* \`${correo}\`\n`;
          }
          if (razon_social !== "-") {
            telRes += `  \`⌞\` *RAZÓN SOCIAL:* \`${razon_social}\`\n`;
          }
          telRes += `  \`⌞\` *MODO. LÍNEA:* \`${modo}\`\n`;
          telRes += `  \`⌞\` *PLAN. LÍNEA:* \`${plan}\`\n\n`;
          telRes += `*➤ CONSULTADO POR:*\n`;
          telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot
            .sendMessage(chatId, telRes, messageOptions)
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
                "Error al enviar el mensaje en la sección CLARO: " + error
              );
            });
        } else if (responseApiTel.servicio === "Movistar") {
          //RESPONSE BITEL
          const dataMovistar = responseApiTel.data;
          //DATOS MOVISTAR
          const tipoProducto = dataMovistar.tipoProducto;
          console.log(tipoProducto);
          const modo = dataMovistar.modo;
          const plan = dataMovistar.plan;
          const tipoDoc = dataMovistar.tipoDoc;
          const titular = dataMovistar.titular;
          const documento = dataMovistar.documento;
          const fechaActivacion = dataMovistar.fechaActivacion;
          //PONER FORMATO CORRECTO LA FECHA
          const fecha = moment(fechaActivacion);
          const fechaPeru = fecha.utcOffset(-5).format("YYYY-MM-DD HH:mm:ss");

          //MENSAJE DEL BOT
          let telRes = `*[#LAIN-DOX 🌐]*\n\n`;
          telRes += `*[ ☑️ ] TITULAR DE* - \`${cel}\` -\n\n`;
          telRes += `*➤ MOVISTAR EN TIEMPO REAL*\n`;
          telRes += `  \`⌞\` *TIPO. DOC:* \`${tipoDoc}\`\n`;
          telRes += `  \`⌞\` *DOCUMENTO:* \`${documento}\`\n`;
          telRes += `  \`⌞\` *TITULAR:* \`${titular}\`\n`;
          telRes += `  \`⌞\` *PLAN. LÍNEA:* \`${plan.toUpperCase()}\`\n`;
          telRes += `  \`⌞\` *MODO. LÍNEA:* \`${modo.toUpperCase()}\`\n`;
          telRes += `  \`⌞\` *FECHA. ACTIVACIÓN:* \`${fechaPeru}\`\n`;
          telRes += `  \`⌞\` *TIPO. PRODUCTO:* \`${tipoProducto.toUpperCase()}\`\n\n`;
          telRes += `*➤ CONSULTADO POR:*\n`;
          telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot
            .sendMessage(chatId, telRes, messageOptions)
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
                "Error al enviar el mensaje en la sección MOVISTAR: " + error
              );
            });
          return;
        } else if (responseApiTel.servicio === "Base de datos") {
          const dataBase = responseApiTel.data;

          const documento = dataBase.dni;
          const titular = dataBase.name + dataBase.surname;

          let telRes = `*[#LAIN-DOX 🌐]*\n\n`;
          telRes += `*[ ☑️ ] TITULAR DE* - \`${cel}\` -\n\n`;
          telRes += `*➤ BASE DE DATOS*\n`;
          telRes += `  \`⌞\` *DOCUMENTO:* \`${documento}\`\n`;
          telRes += `  \`⌞\` *TITULAR:* \`${titular}\`\n\n`;

          telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;
          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot
            .sendMessage(chatId, telRes, messageOptions)
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
                "Error al enviar el mensaje en la sección BASE DE DATOS: " +
                  error
              );
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
