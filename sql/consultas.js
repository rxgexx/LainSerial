const { promisePool } = require("./connection");

async function registrarConsulta(id_telegram, name_telegram, consulta, valor_consulta, exitoso) {
    try {
        const sql = `
            INSERT INTO consultas (id_telegram, name_telegram, consulta, valor_consulta, fecha_hora, exitoso)
            VALUES (?, ?, ?, ?, NOW(), ?)
        `;
        const [result] = await promisePool.execute(sql, [id_telegram, name_telegram, consulta, valor_consulta, exitoso]);
        return result.insertId; // Devuelve el ID de la consulta insertada
    } catch (error) {
        console.error("Error al registrar consulta:", error);
        throw error;
    }
}

module.exports = { registrarConsulta };
