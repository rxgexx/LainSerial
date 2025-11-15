//SE REQUIRE LAS APIS
const { registrarConsulta } = require("../../sql/consultas.js");
const { getReniec } = require("../api/apis.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE REQUIERE "path"
const path = require("path");

//IMAGEN NO FOTO
const noFoto = path.join(__dirname, "../img/noFoto.jpg");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]dnix (.+)/, async (msg, match) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

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
    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando Datos Reniec: ",
          err
        );
      });
    const botIsAdmin = botMember.status === "administrator";

    //Si el chat lo usan de forma privada
    if (typeChat === "private" && !isDev && !isBuyer) {
      let x = `*[ ✖️ ] PORFAVOR, VE AL NUEVO BOT @LainData_Bot, ESTE BOT HA SIDO DEJADO EN DESUSO. SI SIGUES TENIENDO UN PLAN ACTIVO CON NOSOTROS, VE AL BOT NUEVO Y COMÚNICATE CON LA DUEÑA O ADMINS*`;

      const opts = {
        ...messageOptions,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔗 Grupo PÚBLICO 🛡️",
                url: "https://t.me/+-nHDtyXT-V45Yjlh",
              },
            ],
          ],
        },
      };

      bot
        .sendMessage(chatId, x, opts)
        .then(() => {
          console.log(
            `El usuario ${userId} con nombre ${firstName} ha intentado usarme de forma privada.`
          );
        })
        .catch((err) => {
          console.log(
            `Error al mandar el mensaje "no uso-privado": `,
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/dnix\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/dnix 48159191\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando los* \`DATOS RENIEC\` del *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      const response = await getReniec(dni);
      const datosReniec = response.data.data_reniec;
      if (
        datosReniec.message_data ===
        "Consulta exitosa, pero no se encontraron datos."
      ) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);

        let y = `*[ 💬 ] El DNI no existe o ha sido eliminado* de Reniec.`;

        return bot.sendMessage(chatId, y, messageOptions);
      }

      const listaAni = datosReniec.listaAni[0];

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

      let resDni = `*[#LAIN-DOX 🌐] ➤ #RENIECONLINE*\n\n`;

      if (sexo === "FEMENINO") {
        resDni += `*➜ 👩 PERSONA*\n\n`;
      } else {
        resDni += `*➜ 👨 PERSONA*\n\n`;
      }
      resDni += `\`⌞\` *DNI:* \`${dni}\` - \`${digitoVerificacion}\`\n`;
      resDni += `\`⌞\` *EDAD:* \`${nuEdad}\`\n`;
      resDni += `\`⌞\` *SEXO:* \`${sexo}\`\n`;
      resDni += `\`⌞\` *NOMBRES:* \`${preNombres}\`\n`;
      resDni += `\`⌞\` *APELLIDOS:* \`${apePaterno} ${apeMaterno}\`\n\n`;

      resDni += `*➜ 📝 INFORMACIÓN*\n\n`;

      resDni += `\`⌞\` *ESTATURA:* \`${estatura}\`\n`;
      resDni += `\`⌞\` *RESTRICCIÓN:* \`${deRestriccion}\`\n`;
      resDni += `\`⌞\` *ESTADO CIVIL:* \`${estadoCivil}\`\n`;
      resDni += `\`⌞\` *FECHA DE EMISIÓN:* \`${feEmision}\`\n`;
      resDni += `\`⌞\` *FECHA DE CADUCIDAD:* \`${feCaducidad}\`\n`;
      resDni += `\`⌞\` *FECHA DE NACIMIENTO:* \`${feNacimiento}\`\n`;
      resDni += `\`⌞\` *FECHA DE INSCRIPCIÓN:* \`${feInscripcion}\`\n`;
      resDni += `\`⌞\` *GRADO DE INSTRUCCIÓN:* \`${gradoInstruccion}\`\n\n`;

      resDni += `*➜ 🏘️ DIRECCIONES*\n\n`;

      resDni += `\`⌞\` *DEPARTAMENTO:* \`${departamento}\`\n`;
      resDni += `\`⌞\` *PROVINCIA:* \`${provincia}\`\n`;
      resDni += `\`⌞\` *DISTRITO:* \`${distrito}\`\n`;
      resDni += `\`⌞\` *DIRECCIÓN:* \`${desDireccion}\`\n\n`;

      resDni += `*➜ 📧 EXTRAS*\n\n`;

      resDni += `\`⌞\` *PADRE:*  \`${nomPadre}\` - \`${nuDocPadre}\`\n`;
      resDni += `\`⌞\` *MADRE:* \`${nomMadre}\` - \`${nuDocMadre}\`\n`;
      if (nomDeclarante === undefined) {
        resDni += `\n`;
      } else {
        resDni += `\`⌞\` *DECLARANTE:* \`${nomDeclarante}\`\n`;
        resDni += `\`⌞\` *DATOS DECLARANTE:* \`${nuDocDeclarante}\`\n\n`;
      }

      resDni += `*➜ ⛔ RESTRICCIONES*\n\n`;

      resDni += `\`⌞\` *RESTRINCCIÓN:* \`${deRestriccion}\`\n\n`;

      resDni += `*➤ CONSULTADO POR:*\n`;
      resDni += `\`⌞\` *USUARIO:* \`${userId}\`\n`;
      resDni += `\`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      resDni += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      const foto = datosReniec.foto;
      const firma = datosReniec.firma;
      const hderecha = datosReniec.hderecha;
      const hizquierda = datosReniec.hizquierda;

      const mediaGroup = [];

      if (!foto) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);

        bot
          .sendPhoto(chatId, noFoto, {
            caption: resDni,
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
          })
          .then(async () => {
            await registrarConsulta(userId, firstName, `DNIX`, dni, true);
            //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
            if (!isDev && !isAdmin && !isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
            }
            //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
            else if (isBuyer) {
              antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
            }
          });

        return;
      } else {
        if (foto) {
          const fotoData = foto.replace(/^data:image\/jpeg;base64,/, "");
          const fotoBuffer = Buffer.from(fotoData, "base64");
          mediaGroup.push({ type: "photo", media: fotoBuffer });
        }
        if (firma) {
          const foto2Data = firma.replace(/^data:image\/jpeg;base64,/, "");
          const foto2Buffer = Buffer.from(foto2Data, "base64");
          mediaGroup.push({ type: "photo", media: foto2Buffer });
        }
        if (hderecha) {
          const foto2Data = hderecha.replace(/^data:image\/jpeg;base64,/, "");
          const foto2Buffer = Buffer.from(foto2Data, "base64");
          mediaGroup.push({ type: "photo", media: foto2Buffer });
        }
        if (hizquierda) {
          const foto4Data = hizquierda.replace(/^data:image\/jpeg;base64,/, "");
          const foto4Buffer = Buffer.from(foto4Data, "base64");
          mediaGroup.push({
            type: "photo",
            media: foto4Buffer,
            caption: resDni,
            parse_mode: "Markdown",
          });
        }

        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        bot
          .sendMediaGroup(chatId, mediaGroup, messageOptions)
          .then(async () => {
            await registrarConsulta(userId, firstName, `DNIX`, dni, true);

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
    } catch (error) {
      console.log("Error : " + error);

        let xerror = `*[ ✖️ ] El DNI no ha sido encontrado en ninguna fuente Reniec*`;

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
