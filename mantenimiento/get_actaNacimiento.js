//SE REQUIERE fs
const fs = require("fs");

//SE REQUIERE "pdfkit"
const PDFDocument = require("pdfkit");

//APIS
const { getActaNacimiento } = require("../api/apis.js");

//SE REQUIERE "path"
const path = require("path");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]actanaci (.+)/, async (msg, match) => {
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

    const { checkIsBuyer } = require("../../sql/checkbuyer");
    //Rango Comprador
    const isBuyer = await checkIsBuyer(userId);

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

    if (!botIsAdmin && typeChat === "group") {
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
              noGrupo += `*-🔗:* ${inviteLink}\n`;

              return bot.sendMessage(5478452007, noGrupo, {
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
        //Se elimina el mensaje de "consultando"
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/actnaci\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/actanaci 07768359\`*]*\n\n`;

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
      `*[ ⌛ ] Buscando* el \`acta de nacimiento\` del *➜ DNI* \`${dni}\``,
      {
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
      }
    );

    usuariosEnConsulta[userId] = true;

    try {
      const consultaStartTime = Date.now(); // Guardamos el tiempo de inicio de la consulta

      // Usar Promise.race para ver si la API responde antes del tiempo de espera
      const res = await getActaNacimiento(dni);

      if (res.length === 0) {
        const y = `*[ ✖️ ] No se encontró* el acta de nacimiento del *DNI* \`${dni}\`.`;

        await bot
          .deleteMessage(chatId, consultandoMessage.message_id)
          .then(() => {
            bot.sendMessage(chatId, y, messageOptions);
          });
      } else {
        const {
          coTipo,
          nuActa,
          apePaterno,
          apeMaterno,
          preNombres,
          coLocal,
          deProceso,
          deEstado,
          feEvento,
          daActa: {
            nacido: {
              nombre: nombreNacido,
              apaterno: apaternoNacido,
              amaterno: amaternoNacido,
            },
            papa: {
              nombre: nombrePapa,
              apaterno: apaternoPapa,
              amaterno: amaternoPapa,
              nacionalidad: nacionalidadPapa,
              documento: documentoPapa,
            },
            mama: {
              nombre: nombreMama,
              apaterno: apaternoMama,
              amaterno: amaternoMama,
              nacionalidad: nacionalidadMama,
              documento: documentoMama,
            },
            tipo,
            numero,
            estado,
            cui,
            cnv,
            fevento,
            uevento,
            levento,
            sexo,
            imgAnverso,
            imgReverso,
          },
        } = res[0];
        //Construimos el mensaje adicional que irá con el acta
        let reply = `*[#LAIN-DOX 🌐] ➤ #ACTANACIMEINTO*\n\n`;
        reply += `*[ ☑️ ] ACTA ENCONTRADA - ${dni} - 🗂*\n\n`;
        reply += `*➤ INF. PERSONA:*\n`;
        reply += `  \`⌞\` *N° DE ACTA:* \`${nuActa}\`\n`;
        reply += `  \`⌞\` *DES. PROCESO:* \`${deProceso}\`\n`;
        reply += `  \`⌞\` *ESTADO DE ACTA:* \`${deEstado}\`\n`;
        reply += `  \`⌞\` *DIFUNTO. NOMBRES:* \`${nombreNacido}\`\n`;
        reply += `  \`⌞\` *DIFUNTO. APELLIDOS:* \`${apaternoNacido} ${amaternoNacido}\`\n`;
        reply += `  \`⌞\` *FECHA DE DEFUNCIÓN:* \`${feEvento}\`\n\n`;

        reply += `*➤ INF. EVENTO:*\n`;
        reply += `  \`⌞\` *MOMENTO. EVENTO:* \`${fevento}\`\n`;
        reply += `  \`⌞\` *UBICACION. EVENTO:* \`${uevento}\`\n`;
        reply += `  \`⌞\` *LUGAR. EVENTO:* \`${levento}\`\n\n`;

        reply += `*➤ CONSULTADO POR:*\n`;
        reply += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
        reply += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
        reply += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

        //Se inicia transformando la imagen en b64 a una imagen...
        const caraActa = imgAnverso;
        const selloActa = imgReverso;

        //Declaramos la ruta donde se guardarán las actas en PDF
        const pdfsFolder = path.join(__dirname, "../docs"); // Ruta a la carpeta "docs"
        const pdfPath = path.join(pdfsFolder, `${dni}_acta_Nacimiento.pdf`); // Ruta al archivo PDF
        console.log(pdfPath);

        //Si no encuentra esa carpta, la crea
        if (!fs.existsSync(pdfsFolder)) {
          fs.mkdirSync(pdfsFolder);

          console.log("carpeta actas creada: ", pdfsFolder);
        }

        const pdfDoc = new PDFDocument({
          autoFirstPage: false,
        });

        // Array para almacenar dimensiones de imágenes
        const imageDimensions = [];

        // Función para agregar una imagen al documento PDF
        // Cambia el nombre de la función para evitar conflictos
        const agregarImagenAPDF = (imageBuffer, dimensions) => {
          const image = pdfDoc.openImage(imageBuffer);

          // Almacena dimensiones de la imagen
          dimensions.push({
            width: image.width,
            height: image.height,
          });

          pdfDoc.addPage({
            size: [image.width, image.height], // Establece el tamaño de la página según la imagen
          });

          pdfDoc.image(image, 0, 0, {
            width: image.width,
            height: image.height,
          });
        };

        new Promise((resolve, reject) => {
          // Agrega las dos imágenes al documento PDF
          if (caraActa) {
            const fotoData = caraActa.replace(/^data:image\/jpeg;base64,/, "");
            const fotoBuffer = Buffer.from(fotoData, "base64");
            agregarImagenAPDF(fotoBuffer, imageDimensions);
          }

          if (selloActa) {
            const foto2Data = selloActa.replace(
              /^data:image\/jpeg;base64,/,
              ""
            );
            const foto2Buffer = Buffer.from(foto2Data, "base64");
            agregarImagenAPDF(foto2Buffer, imageDimensions);
          }

          // Guarda el PDF en el sistema de archivos
          const writeStream = fs.createWriteStream(pdfPath);
          pdfDoc.pipe(writeStream);
          pdfDoc.end();

          writeStream.on("finish", async function () {
            //Se manda el documento
            await bot.deleteMessage(chatId, consultandoMessage.message_id);
            bot
              .sendDocument(chatId, pdfPath, {
                caption: reply,
                parse_mode: "Markdown",
                reply_to_message_id: msg.message_id,
                thumb: path.resolve(__dirname, "../img/min_pdf.jpg"), // Ruta absoluta a la miniatura
              })
              .then(() => {
                // Elimina el archivo después de enviarlo
                fs.unlinkSync(pdfPath);
                resolve();
              })
              .catch((error) => {
                console.log(error);
                reject(error);
              });
          });
        }).catch((error) => {
          console.error(error);
        });
        //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 1000 segundos
        if (!isDev && !isAdmin && !isBuyer) {
          antiSpam[userId] = Math.floor(Date.now() / 1000) + 500;
        }
        //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
        else if (isBuyer) {
          antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
        }
      }
    } catch (error) {
      console.log(error);

      if (error.response && error.response.status === 500) {
        let xerror = `*[ 💤 ] Los servidores de actas* andan apagados, no se ha *completado* la _búsqueda._`;

        await bot
          .deleteMessage(chatId, consultandoMessage.message_id)
          .then(() => {
            bot.sendMessage(chatId, xerror, messageOptions);
          });
      } else if (error.response && error.response.status === 524) {
        let yerror = `*[ ✖️ ] La búsqueda ha tardado mucho,* probablemente haya un _error interno del servidor,_ *intente más tarde*.`;

        await bot
          .deleteMessage(chatId, consultandoMessage.message_id)
          .then(() => {
            bot.sendMessage(chatId, yerror, messageOptions);
          });
      } else {
        let yerror = `*[ 🚨 ] Error en el servidor:* No se pudo obtener el *acta de nacimiento* debido a un problema ,\`- no reconocido -\`, *interno del servidor.*`;

        await bot
          .deleteMessage(chatId, consultandoMessage.message_id)
          .then(() => {
            bot.sendDocument(chatId, yerror, messageOptions);
            bot.sendMessage(
              5478452007,
              `*Error DESCONOCIDO* al intentar obtener el acta de nacimiento para el DNI ${dni}: ${error.message} | *Usuario que consultó:* ${userId}`,
              messageOptions
            );
          });
      }
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};

/*const { getActaNacimiento } = require("../api/apis");

const fs = require('fs');
const PDFDocument = require('pdfkit');

module.exports = (bot) => {
  bot.onText(/\/x (.+)/, async (msg, match) => {
    const dni = match[1];
    const chatId = msg.chat.id;

    try {
      const res = await getActaNacimiento(dni);

      const data1 = res.data1;

      const datos = data1.datos[0];

      const foto64 = datos.Foto

      console.log("foto: ", foto64);

      // console.log(res.data1.datos.foto);
      //console.log(res.data1.datos.Foto_reverso);
    } catch (error) {}
  });
};
*/
