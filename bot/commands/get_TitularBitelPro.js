//SE REQUIRE LAS APIS
const { getReniec, titularBitel, apiValidar } = require("../api/apis.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]bitxx (.+)/, async (msg, match) => {
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

    //Rango Comprador
    const isBuyer =
      rangosFilePath.BUYER && rangosFilePath.BUYER.includes(userId);

    const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");
    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando titularBitel: ",
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/bitxx\`*]* seguido de un número de *CELULAR* de \`9 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/bitxx 957908908\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    const validarOp = await apiValidar(tel);
    const datosNum = validarOp.datos.Operador;

    if (datosNum !== "Bitel") {
      let yxx = `*[ ✖️ ] EL NÚMERO* no es *Bitel*.`;

      return bot.sendMessage(chatId, yxx, messageOptions);
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando el* \`TITULAR BITEL\` del *➜ NÚMERO* \`${tel}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //RESPONSE BITEL
      const responseBitel = await titularBitel(tel);

      if (
        responseBitel.datos ===
        "No se encontraron resultados que satisfagan las condiciones"
      ) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        const yx = `*[ ✖️ ] No pude hallar el titular* del número \`${tel}\`, de seguro el *número* no es Bitel.`;

        bot.sendMessage(chatId, yx, messageOptions);
      } else {
        //RESPONSE BITEL
        const dataBitel = await responseBitel.data;
        console.log(dataBitel);
        //DATOS BITEL
        const hora = dataBitel.hora;
        const modo = dataBitel.modo;
        const plan = dataBitel.plan;
        const titular = dataBitel.titular;
        const documento = dataBitel.documento;
        const feActivacion = dataBitel.fecActivacion;

        //ACÁ SE INCLUYE RENIEC
        if (documento.length === 8) {
          const dataReniec = await getReniec(documento);

          const fotoReniec = dataReniec.foto;
          const listaAni = dataReniec.listaAni[0];

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

          //MENSAJE DEL BOT
          let telRes = `*[#LAIN-DOX 🌐]*\n\n`;
          telRes += `*[ ☑️ ] TITULAR DE* - \`${tel}\` -\n\n`;
          telRes += `*➤ BITEL EN TIEMPO REAL:*\n`;
          telRes += `  \`⌞\` *DOCUMENTO:* \`${documento}\`\n`;
          telRes += `  \`⌞\` *TITULAR:* \`${titular}\`\n`;
          telRes += `  \`⌞\` *PLAN. LÍNEA:* \`${plan}\`\n`;
          telRes += `  \`⌞\` *FECHA. ACTIVACIÓN:* \`${feActivacion}\`\n`;
          telRes += `  \`⌞\` *HORA. ACTIVACIÓN:* \`${hora}\`\n`;
          telRes += `  \`⌞\` *MODO. LÍNEA:* \`${modo}\`\n\n`;
          telRes += `*➤ INF. TITULAR:*\n`;
          telRes += `  \`⌞\` *DNI:* \`${nuDni}\` - \`${coDocEmi}\`\n`;
          telRes += `  \`⌞\` *ESTADO CIVIL:* \`${estadoCivil}\`\n`;
          telRes += `  \`⌞\` *F. EMISIÓN:* \`${feEmision}\`\n`;
          telRes += `  \`⌞\` *F. NACIMIENTO:* \`${feNacimiento}\`\n`;
          telRes += `  \`⌞\` *F. INSCRIPCIÓN:* \`${feInscripcion}\`\n`;
          telRes += `  \`⌞\` *DIRECCIÓN RENIEC:* \`${desDireccion}\`\n\n`;
          telRes += `*➤ CONSULTADO POR:*\n`;
          telRes += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
          telRes += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          if (fotoReniec) {
            const fotoDni = fotoReniec.replace(/^data:image\/jpeg;base64,/, "");
            const fotoBuffer = Buffer.from(fotoDni, "base64");

            await bot.deleteMessage(chatId, consultandoMessage.message_id);
            bot
              .sendPhoto(chatId, fotoBuffer, {
                caption: telRes,
                reply_to_message_id: msg.message_id,
                parse_mode: "Markdown",
              })
              .then(() => {
                //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 80 segundos
                if (!isDev && !isAdmin && !isBuyer) {
                  antiSpam[userId] = Math.floor(Date.now() / 1000) + 100;
                }
                //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
                else if (isBuyer) {
                  antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
                }
              })
              .catch((error) => {
                console.log(
                  "Error al enviar el mensaje en la API TITULAR BITEL: " + error
                );
              });
          } else {
            await bot.deleteMessage(chatId, consultandoMessage.message_id);
            bot
              .sendMessage(chatId, telRes, messageOptions)
              .then(() => {
                //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 80 segundos
                if (!isDev && !isAdmin && !isBuyer) {
                  antiSpam[userId] = Math.floor(Date.now() / 1000) + 80;
                }
                //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
                else if (isBuyer) {
                  antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
                }
              })
              .catch((error) => {
                console.log(
                  "Error al enviar el mensaje en la API TITULAR BITEL: " + error
                );
              });
          }
        } else {
          //MENSAJE DEL BOT
          let telRes = `*[#LAIN-DOX 🌐]*\n\n`;
          telRes += `*[ ☑️ ] TITULAR DE* - \`${tel}\` -\n\n`;
          telRes += `*➤ BITEL EN TIEMPO REAL:*\n`;
          telRes += `  \`⌞\` *DOCUMENTO:* \`${documento}\`\n`;
          telRes += `  \`⌞\` *TITULAR:* \`${titular}\`\n`;
          telRes += `  \`⌞\` *PLAN. LÍNEA:* \`${plan}\`\n`;
          telRes += `  \`⌞\` *FECHA. ACTIVACIÓN:* \`${feActivacion}\`\n`;
          telRes += `  \`⌞\` *HORA. ACTIVACIÓN:* \`${hora}\`\n`;
          telRes += `  \`⌞\` *MODO. LÍNEA:* \`${modo}\`\n\n`;
          telRes += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          await bot.deleteMessage(chatId, consultandoMessage.message_id);
          bot
            .sendMessage(chatId, telRes, messageOptions)
            .then(() => {
              //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 80 segundos
              if (!isDev && !isAdmin && !isBuyer) {
                antiSpam[userId] = Math.floor(Date.now() / 1000) + 80;
              }
              //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
              else if (isBuyer) {
                antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
              }
            })
            .catch((error) => {
              console.log(
                "Error al enviar el mensaje en la API TITULAR BITEL: " + error
              );
            });
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};
