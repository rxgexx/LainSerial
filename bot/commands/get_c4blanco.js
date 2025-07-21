//SE REQUIERE fs
const fs = require("fs");

//SE REQUIERE "pdfkit"
const PDFDocument = require("pdfkit");

//APIS
const { c4blanco } = require("../api/apis.js");

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
  bot.onText(/[\/.$?!]c4b (.+)/, async (msg, match) => {
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fxazul\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fxazul 07768359\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    const y = `*[ ⚙️ ] Construyendo* la \`FICHA BLANCA\` del *➜ DNI* \`${dni}\``;

    //Si todo se cumple, se iniciará con la consulta...
    const consultandoMessage = await bot.sendMessage(chatId, y, messageOptions);

    usuariosEnConsulta[userId] = true;

    try {
      const res = await c4blanco(dni);
      const response = res.data.data_c4;

      if (
        response.error ===
        `El DNI ${dni} no cuenta con datos disponibles para la construcción de la ficha`
      ) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);

        let yx = `*[✖️] El DNI ${dni}* no cuenta con datos suficientes para la construcción *de la ficha*.`;

        return bot.sendMessage(chatId, yx, messageOptions);
      }

      const listaAni = response.listaAni[0];

      const {
        apeMaterno, // Apellido materno
        apePaterno, // Apellido paterno
        coDocEmi, // Código del documento de emisión
        deRestriccion, // Descripción de restricción
        depaDireccion, // Departamento de la dirección
        departamento, // Departamento
        desDireccion, // Descripción de la dirección
        digitoVerificacion, // Dígito de verificación
        distDireccion, // Distrito de la dirección
        distrito, // Distrito
        donaOrganos, // Donación de órganos
        estadoCivil, // Estado civil
        estatura, // Estatura
        feCaducidad, // Fecha de caducidad del documento
        feEmision, // Fecha de emisión del documento
        feFallecimiento, // Fecha de fallecimiento
        feInscripcion, // Fecha de inscripción
        feNacimiento, // Fecha de nacimiento
        gradoInstruccion, // Grado de instrucción
        inCel, // Indicador de celular
        inGrupoRestri, // Indicador de grupo de restricción
        nomDeclarante, // Nombre del declarante
        nomMadre, // Nombre de la madre
        nomPadre, // Nombre del padre
        nuDni, // Número de DNI
        nuDocDeclarante, // Número de documento del declarante
        nuDocMadre, // Número de documento de la madre
        nuDocPadre, // Número de documento del padre
        nuEdad, // Edad
        nuImagen, // Número de imagen
        preNombres, // Nombres
        provDireccion, // Provincia de la dirección
        provincia, // Provincia
        sexo, // Sexo
        tipoFicha, // Tipo de ficha
        tipoFichaImag, // Tipo de ficha de imagen
        vinculoDeclarante, // Vínculo del declarante
        cancelacion,
      } = listaAni;

      let reply = `*[#LAIN-V.1-BETA ⚡]*\n\n`;
      reply += `*[ ☑️ ] DOCUMENTO C4 BLANCO*\n\n`;
      reply += `*➤ INF. PERSONA:*\n`;
      reply += `  \`⌞\` *DNI:* \`${nuDni}\` - \`${digitoVerificacion}\`\n`;
      reply += `  \`⌞\` *EDAD:* \`${nuEdad}\`\n`;
      reply += `  \`⌞\` *NOMBRES:* \`${preNombres}\`\n`;
      reply += `  \`⌞\` *APELLIDOS:* \`${apePaterno} ${apeMaterno}\`\n`;
      reply += `  \`⌞\` *FECHA. EMISIÓN:* \`${feEmision}\`\n`;
      reply += `  \`⌞\` *FECHA. NACIMIENTO:* \`${feNacimiento}\`\n`;
      reply += `  \`⌞\` *FECHA. INSCRIPCIÓN:* \`${feInscripcion}\`\n\n`;
      reply += `*➤ CONSULTADO POR:*\n`;
      reply += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
      reply += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      reply += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      const pdf = response.pdf;
      const pdfbuffer = Buffer.from(pdf, "base64");
      await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot
        .sendDocument(chatId, pdfbuffer, {
          caption: reply,
          parse_mode: "Markdown",
          reply_to_message_id: msg.message_id,
        })
        .then(async () => {
          await registrarConsulta(userId, firstName, `c4b`, dni, true);
          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 120;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 70;
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
        let xerror = `*[ ✖️ ] El DNI no ha sido encontrado en ninguna fuente Reniec*`;

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
