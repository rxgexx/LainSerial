//SE REQUIRE LAS APIS
const { api_infoburo } = require("../api/api_Variados.js");

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
  bot.onText(/[\/.$?!]fxtrabajos (.+)/, async (msg, match) => {
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fxtrabajos\`*]* seguido de un número de *CELULAR* de \`9 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fxtrabajos 44443333\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`TRABAJOS\` del *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      bot.sendMessage(
        chatId,
        `*[ 🏗️ ] Comando en mantenimiento,* disculpe las molestias.`,
        messageOptions
      );

      // const responseTrabajos = await api_infoburo(dni);

      // const trabajos_Key = responseTrabajos.infoburo[0].trabajos;

      // function trabajos_vacios(trabajos) {
      //   for (const key in trabajos) {
      //     if (trabajos[key].length > 0) {
      //       return { estado: "false" };
      //     }
      //   }
      //   return { estado: "true" };
      // }

      // const validar = trabajos_vacios(trabajos_Key);

      // if (validar.estado === "true") {
      //   let yxx = `*[ ✖️ ] NO se encontró* ningún \`registro laboral\` para el *DNI* \`${dni}\`*.*`;
      //   await bot
      //     .deleteMessage(chatId, consultandoMessage.message_id)
      //     .then(() => {
      //       //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 80 segundos
      //       if (!isDev && !isAdmin && !isBuyer) {
      //         antiSpam[userId] = Math.floor(Date.now() / 1000) + 20;
      //       }
      //       //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
      //       else if (isBuyer) {
      //         antiSpam[userId] = Math.floor(Date.now() / 1000) + 10;
      //       }

      //       bot.sendMessage(chatId, yxx, messageOptions);
      //     });
      //   return;
      // }

      // //MENSAJE
      // let res = `*[#LAIN-DOX 🌐] ➤ #TRABAJOS*\n\n`;
      // res += `*[ ☑️ ] TRABAJOS DE* - \`${dni}\` -\n\n`;
      // res += `*➤ REGISTROS ACTUALIZADOS*\n\n`;

      // function get_trabajos(trabajos) {
      //   let registros = [];
      //   // Obtener claves de meses, ordenar numéricamente basándonos en el número del mes
      //   const clavesOrdenadas = Object.keys(trabajos).sort((a, b) => {
      //     return (
      //       parseInt(a.replace("mes", "")) - parseInt(b.replace("mes", ""))
      //     );
      //   });

      //   // Iterar sobre cada mes en orden
      //   clavesOrdenadas.forEach((mes) => {
      //     trabajos[mes].forEach((trabajo) => {
      //       let registro = {
      //         mes: parseInt(mes.replace("mes", "")),
      //         ...trabajo,
      //       };
      //       registros.push(registro);
      //     });
      //   });

      //   return registros;
      // }
      // function formatearFecha(fecha) {
      //   // Asegura que la entrada es una cadena
      //   let fechaStr = String(fecha);
      //   // Extrae el año (primeros cuatro caracteres) y el mes (últimos dos caracteres)
      //   let ano = fechaStr.substring(0, 4);
      //   let mes = fechaStr.substring(4, 6);
      //   // Combina el año y el mes con el formato deseado
      //   return `${ano} - ${mes}`;
      // }
      // const registros = get_trabajos(trabajos_Key);

      // registros.forEach((registros, index) => {
      //   const registro = index + 1;
      //   const mes = registros.mes;
      //   const ruc = registros.ruc;
      //   const fecha = formatearFecha(registros.fecha);
      //   const distrito = registros.distrito;
      //   const provincia = registros.provincia;
      //   const departamento = registros.departamento;
      //   const direccion = registros.direccion;
      //   const nombre_empresa = registros.nombre_empresa;

      //   res += `*➜ N°. REGISTRO:* \`${registro}\`\n`;
      //   res += `*➜ N°. RUC:* \`${ruc}\`\n`;
      //   res += `*➜ FECHA. REGISTRO:* \`${fecha}\`\n`;
      //   res += `*➜ NOMBRE. EMPRESA:* \`${nombre_empresa}\`\n`;
      //   res += `*➜ DISTRITO:* \`${distrito}\`\n`;
      //   res += `*➜ PROVINCIA:* \`${provincia}\`\n`;
      //   res += `*➜ DEPARTAMENTO:* \`${departamento}\`\n`;
      //   res += `*➜ DIRECCIÓN:* \`${direccion}\`\n\n`;
      // });

      // res += `*➤ CONSULTADO POR:*\n`;
      // res += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
      // res += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      // res += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      // await bot.deleteMessage(chatId, consultandoMessage.message_id);
      // bot
      //   .sendMessage(chatId, res, messageOptions)
      //   .then(() => {
      //     //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 80 segundos
      //     if (!isDev && !isAdmin && !isBuyer) {
      //       antiSpam[userId] = Math.floor(Date.now() / 1000) + 80;
      //     }
      //     //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
      //     else if (isBuyer) {
      //       antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
      //     }
      //   })
      //   .catch((error) => {
      //     console.log(
      //       "Error al enviar el mensaje en la API TITULAR CLARO: " + error
      //     );
      //   });
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
