//SE REQUIRE LAS APIS
const iconv = require("iconv-lite");
const { mpfnCaso } = require("../api/api_Legales.js");

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
  bot.onText(/[\/.$?!]fxcaso (.+)/, async (msg, match) => {
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
    const caso = match[1];
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
    // if (dni.length !== 8) {
    //   let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fxmpfn\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
    //   replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fxmpfn 27427864\`*]*\n\n`;

    //   bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
    //   return;
    // }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`DETALLES\` del *➜ CASO* \`${caso}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //CORREGIR RESPONSE
      // Función para normalizar la cadena JSON

      const response = await mpfnCaso(caso);

      if (
        response.respuesta.infPersona === "No hay datos" &&
        response.respuesta.inpeDatos === "No hay datos." &&
        response.respuesta.mpDatos === "No hay datos" &&
        response.respuesta.pjDatos === "No hay datos." &&
        response.respuesta.pnpDatos === "No hay datos."
      ) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        bot.sendMessage(
          chatId,
          `*[ ✖️ ] No se encontraron* detalles para el *CASO* \`${caso}\`.`,
          messageOptions
        );
      } else {
        const correctRes = decodeURIComponent(JSON.stringify(response));
        const jsonResponse = JSON.parse(correctRes);
        // const casos = correctRes;

        // console.log(casos);

        let res = `*[#LAIN-DOX 🌐] ➤ #CASOSMPFN*\n\n`;
        res += `*[ ☑️ ] DETALLES DEL CASO ${caso}:*\n\n`;

        const detalles = jsonResponse.respuesta;
        //infPersona
        const infPersona = detalles.infPersona;

        const nombres =
          infPersona.apPaterno + " " + infPersona.apMaterno + " " + " " + infPersona.preNombres;
        const pais = infPersona.pais;
        const departamento = infPersona.departamento;
        const provincia = infPersona.provincia;
        const distrito = infPersona.distrito;
        const observacion = infPersona.observacion;

        //inpeDatos
        const inpeDatos = detalles.inpeDatos;
        const autoridadJudicial = inpeDatos.autoridadJudicial;
        const delito_inpe = inpeDatos.delito;
        const establePeninteciario = inpeDatos.establePeninteciario;
        const fecIngresoPeninteciario = inpeDatos.fecIngresoPeninteciario;
        const numExpediente_inpe = inpeDatos.numExpediente;

        //mpDatos
        const mpDatos = detalles.mpDatos;
        const accionTomado = mpDatos.accionTomado;
        const distritoJudicial = mpDatos.distritoJudicial;
        const fiscalResponsable = mpDatos.fiscalResponsable;
        const nomFiscalia = mpDatos.nomFiscalia;

        //pjDatos
        const pjDatos = detalles.pjDatos;
        const accionTomada = pjDatos.accionTomada;
        const fecAccion = pjDatos.fecAccion;
        const nomJuzgado = pjDatos.nomJuzgado;
        const numExpediente_pj = pjDatos.numExpediente;
        const situacionJuridica = pjDatos.situacionJuridica;

        //pnpDatos
        const pnpDatos = detalles.pnpDatos;
        const delito_pnp = pnpDatos.delito;
        const dependencia = pnpDatos.dependencia;
        const modalidad = pnpDatos.modalidad;
        const motivoDetencion = pnpDatos.motivoDetencion;
        const situacion = pnpDatos.situacion;

        res += `*➜ INF. PERSONA:*\n`;
        res += `  \`⌞\` *NOMBRES:* \`${nombres}\`\n`;
        res += `  \`⌞\` *PAÍS:* \`${pais}\`\n`;
        res += `  \`⌞\` *DEPARTAMENTO:* \`${departamento}\`\n`;
        res += `  \`⌞\` *PROVINCIA:* \`${provincia}\`\n`;
        res += `  \`⌞\` *DISTRITO:* \`${distrito}\`\n`;
        res += `  \`⌞\` *OBSERVACIÓN:* \`${observacion}\`\n\n`;

        res += `*➜ INPE:*\n`;
        res += `  \`⌞\` *DELITO:* \`${delito_inpe}\`\n`;
        res += `  \`⌞\` *AUT. JUDICIAL:* \`${autoridadJudicial}\`\n`;
        res += `  \`⌞\` *EST. PENITENCIARIO:* \`${establePeninteciario}\`\n`;
        res += `  \`⌞\` *FE. INGRESO:* \`${fecIngresoPeninteciario}\`\n`;
        res += `  \`⌞\` *N° EXPEDIENTE:* \`${numExpediente_inpe}\`\n\n`;

        res += `*➜ MIN. PÚBLICO:*\n`;
        res += `  \`⌞\` *ACCIÓN TOMADA:* \`${accionTomado}\`\n`;
        res += `  \`⌞\` *DIST. JUDICIAL:* \`${distritoJudicial}\`\n`;
        res += `  \`⌞\` *FISCAL RESPONSABLE:* \`${fiscalResponsable}\`\n`;
        res += `  \`⌞\` *NOM. FISCALÍA:* \`${nomFiscalia}\`\n\n`;

        res += `*➜ PODER JUDICIAL:*\n`;
        res += `  \`⌞\` *ACCIÓN TOMADA:* \`${accionTomada}\`\n`;
        res += `  \`⌞\` *FE. ACCIÓN:* \`${fecAccion}\`\n`;
        res += `  \`⌞\` *NOMBRE. JUZGADO:* \`${nomJuzgado}\`\n`;
        res += `  \`⌞\` *SIT. JURÍDICA:* \`${situacionJuridica}\`\n`;
        res += `  \`⌞\` *N° EXPEDIENTE:* \`${numExpediente_pj}\`\n\n`;

        res += `*➜ PNP:*\n`;
        res += `  \`⌞\` *DELITO:* \`${delito_pnp}\`\n`;
        res += `  \`⌞\` *DEPENDENCIA:* \`${dependencia}\`\n`;
        res += `  \`⌞\` *MODALIDAD:* \`${modalidad}\`\n`;
        res += `  \`⌞\` *MOTIVO. DETENCIÓN:* \`${motivoDetencion}\`\n`;
        res += `  \`⌞\` *SITUACIÓN:* \`${situacion}\`\n\n`;

        res += `*➤ CONSULTADO POR:*\n`;
        res += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
        res += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
        res += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;        await bot
          .deleteMessage(chatId, consultandoMessage.message_id)
          .then(() => {
            //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 1000 segundos
            if (!isDev && !isAdmin && !isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 1000;
            }
            //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
            else if (isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
            }

            bot.sendMessage(chatId, res, messageOptions);
          });
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
