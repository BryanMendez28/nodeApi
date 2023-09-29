const axios = require('axios'); 



/*Proyecto Nayax Transacciones */

exports.getTabla = async (req, res) => {
    let {
      fechaInicio ,
      fechaFin ,
     
      cliente_id ,
    } = req.query;
  
    try {
      // Realiza la solicitud a la API externa
      await axios.get(
        `http://masven.com.mx/admin7_1/desarrollos/bryanNayax-Masven/backend.php?cliente=${encodeURIComponent(cliente_id)}`
      );

    req.getConnection((err, conn) => {
      if (err) return res.send(err);
  
      
      const query = `
      SELECT A.ProductCodeInMap + 10 AS Carril , 
      B.capacidad,
  COUNT(*) AS TotalRegistros,
  B.producto,
  B.precio,
  (SELECT 
    (CASE 
        WHEN ExtraCharge IS NOT NULL 
        THEN 
            CAST(SeValue AS DECIMAL(10, 2)) - 
            CAST(CONCAT(SUBSTRING_INDEX(ExtraCharge, '.', 1), '.', LEFT(SUBSTRING_INDEX(ExtraCharge, '.', -1), 2)) AS DECIMAL(10, 2))
        ELSE
            CAST(SeValue AS DECIMAL(10, 2))
    END) AS SeValue 
FROM nayax_transacciones 
WHERE cliente_id = A.cliente_id 
    AND ProductCodeInMap = A.ProductCodeInMap 
    AND CONCAT(MachineSeTimeDateOnly, ' ', MachineSeTimeTimeOnly) 
    BETWEEN ? AND now()
ORDER BY MachineSeTimeDateOnly DESC  , MachineSeTimeTimeOnly desc 
LIMIT 1) AS valorActual
FROM nayax_transacciones A 
LEFT JOIN nayax_transacciones_masven AS B ON A.cliente_id = B.cliente_id AND A.ProductCodeInMap + 10 = B.posicion
WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
        BETWEEN ? AND ?
        AND SUBSTRING_INDEX(B.punto_venta, ' ', 1) = ?
GROUP BY A.ProductCodeInMap;
      `;
  
      
      conn.query(query, [fechaInicio,  fechaInicio, fechaFin,  cliente_id], (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      });
    });
  } catch (error) {
    console.error('Error al consultar la API externa:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

  
exports.getTotal = async (req, res) => {
    // Intenta imprimir los parámetros que estás recibiendo para asegurarte de que son correctos
    console.log(req.query);
  
    let{
      fechaInicio,
      fechaFin, 
      nombreMaquinaFiltro,
      codeProductFiltro
    } = req.query;
  
    try {
      // Realiza la solicitud a la API externa
      await axios.get(
        `http://masven.com.mx/admin7_1/desarrollos/bryanNayax-Masven/backend.php?cliente=${encodeURIComponent(nombreMaquinaFiltro)}`
      );

    req.getConnection((err, conn) => {
      if (err) {
        console.error('Error connecting to database:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      const queryTotalGastadoTarjetaCredito = `
      SELECT SUM(CAST(SUBSTRING(CAST(A.SeValue AS CHAR), 1, LENGTH(CAST(A.SeValue AS CHAR)) - 2) AS DECIMAL(10, 2))) AS TotalGastadoTarjetaCredito
      FROM nayax_transacciones A
     LEFT JOIN nayax_transacciones_masven AS B ON A.cliente_id = B.cliente_id AND A.ProductCodeInMap + 10 = B.posicion
      WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
        BETWEEN ? AND ?
        AND SUBSTRING_INDEX(B.punto_venta, ' ', 1) = ?
AND (A.ProductCodeInMap + 10) LIKE ?
        AND A.PaymentMethodId = 1;
      `;
  
      const queryTotalGastadoEfectivo = `
      SELECT SUM(CAST(SUBSTRING(CAST(A.SeValue AS CHAR), 1, LENGTH(CAST(A.SeValue AS CHAR)) - 2) AS DECIMAL(10, 2)) ) AS TotalGastadoEfectivo
      FROM nayax_transacciones A
       LEFT JOIN nayax_transacciones_masven AS B ON A.cliente_id = B.cliente_id AND A.ProductCodeInMap + 10 = B.posicion
      WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
        BETWEEN ? AND ?
        AND SUBSTRING_INDEX(B.punto_venta, ' ', 1) = ?
AND (A.ProductCodeInMap + 10) LIKE ?
        AND A.PaymentMethodId = 3;
      `;
  
      const queryTotalPiezasVendidas = `
      SELECT COUNT(*) AS TotalPiezasVendidas
      FROM nayax_transacciones A
      LEFT JOIN nayax_transacciones_masven AS B ON A.cliente_id = B.cliente_id AND A.ProductCodeInMap + 10 = B.posicion
      WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
      BETWEEN ? AND ?
      AND SUBSTRING_INDEX(B.punto_venta, ' ', 1) = ?
AND (A.ProductCodeInMap + 10) LIKE ?;
      `;
  
      const queryTarjetaCredito = `
      SELECT COUNT(*) AS TotalTarjetaCredito
      FROM nayax_transacciones A
      LEFT JOIN nayax_transacciones_masven AS B ON A.cliente_id = B.cliente_id AND A.ProductCodeInMap + 10 = B.posicion
      WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
      BETWEEN ? AND ?
      AND SUBSTRING_INDEX(B.punto_venta, ' ', 1) = ?
AND (A.ProductCodeInMap + 10) LIKE ?
        AND PaymentMethodId = 1;
      `;
  
      const queryEfectivo = `
      SELECT COUNT(*) AS TotalEfectivo
      FROM nayax_transacciones A
      LEFT JOIN nayax_transacciones_masven AS B ON A.cliente_id = B.cliente_id AND A.ProductCodeInMap + 10 = B.posicion
      WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
      BETWEEN ? AND ?
      AND SUBSTRING_INDEX(B.punto_venta, ' ', 1) = ?
AND (A.ProductCodeInMap + 10) LIKE ?
        AND PaymentMethodId = 3;
      `;
  
      const queryTotalGastado = `
      SELECT SUM(CAST(SUBSTRING(CAST(A.SeValue AS CHAR), 1, LENGTH(CAST(A.SeValue AS CHAR)) - 2) AS DECIMAL(10, 2))) AS TotalGastado
      FROM nayax_transacciones A
        LEFT JOIN nayax_transacciones_masven AS B ON A.cliente_id = B.cliente_id AND A.ProductCodeInMap + 10 = B.posicion
      WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
        BETWEEN ? AND ?
        AND SUBSTRING_INDEX(B.punto_venta, ' ', 1) = ?
AND (A.ProductCodeInMap + 10) LIKE ?;
      `;

      const queryPrecioUnitario = `
      SELECT(CASE 
        WHEN ExtraCharge IS NOT NULL 
        THEN 
            CAST(SeValue AS DECIMAL(10, 2)) - 
            CAST(CONCAT(SUBSTRING_INDEX(ExtraCharge, '.', 1), '.', LEFT(SUBSTRING_INDEX(ExtraCharge, '.', -1), 2)) AS DECIMAL(10, 2))
        ELSE
            CAST(SeValue AS DECIMAL(10, 2))
    END) AS PrecioUnitario
        FROM nayax_transacciones A
         LEFT JOIN nayax_transacciones_masven AS B ON A.cliente_id = B.cliente_id AND A.ProductCodeInMap + 10 = B.posicion
        WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
          BETWEEN ? AND NOW()
          AND SUBSTRING_INDEX(B.punto_venta, ' ', 1) = ?
  AND B.posicion LIKE ?
  ORDER BY A.MachineSeTimeDateOnly DESC  , A.MachineSeTimeTimeOnly desc
  LIMIT 1;
      `;
  
      conn.query(
        queryTotalGastadoTarjetaCredito,
        [fechaInicio, fechaFin,  nombreMaquinaFiltro, `%${codeProductFiltro}%`],
        (errTotalGastadoTarjetaCredito, rowsTotalGastadoTarjetaCredito) => {
          if (errTotalGastadoTarjetaCredito) {
            console.error('Error executing query Total Gastado Tarjeta Crédito:', errTotalGastadoTarjetaCredito);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
  
          conn.query(
            queryTotalGastadoEfectivo,
            [fechaInicio, fechaFin,nombreMaquinaFiltro, `%${codeProductFiltro}%`],
            (errTotalGastadoEfectivo, rowsTotalGastadoEfectivo) => {
              if (errTotalGastadoEfectivo) {
                console.error('Error executing query Total Gastado Efectivo:', errTotalGastadoEfectivo);
                return res.status(500).json({ error: 'Internal Server Error' });
              }
  
              conn.query(
                queryTotalPiezasVendidas,
                [fechaInicio, fechaFin,  nombreMaquinaFiltro, `%${codeProductFiltro}%`],
                (errTotalPiezasVendidas, rowsTotalPiezasVendidas) => {
                  if (errTotalPiezasVendidas) {
                    console.error('Error executing query Total Piezas Vendidas:', errTotalPiezasVendidas);
                    return res.status(500).json({ error: 'Internal Server Error' });
                  }
  
                  conn.query(
                    queryTarjetaCredito,
                    [fechaInicio, fechaFin,  nombreMaquinaFiltro, `%${codeProductFiltro}%`],
                    (errTarjetaCredito, rowsTarjetaCredito) => {
                      if (errTarjetaCredito) {
                        console.error('Error executing query Tarjeta Crédito:', errTarjetaCredito);
                        return res.status(500).json({ error: 'Internal Server Error' });
                      }
  
                      conn.query(
                        queryEfectivo,
                        [fechaInicio, fechaFin, nombreMaquinaFiltro, `%${codeProductFiltro}%`],
                        (errEfectivo, rowsEfectivo) => {
                          if (errEfectivo) {
                            console.error('Error executing query Efectivo:', errEfectivo);
                            return res.status(500).json({ error: 'Internal Server Error' });
                          }
  
                          conn.query(
                            queryTotalGastado,
                            [fechaInicio, fechaFin, nombreMaquinaFiltro, `%${codeProductFiltro}%`],
                            (errTotalGastado, rowsTotalGastado) => {
                              if (errTotalGastado) {
                                console.error('Error executing query Total Gastado:', errTotalGastado);
                                return res.status(500).json({ error: 'Internal Server Error' });
                              }

                              conn.query(
                                queryPrecioUnitario,
                                [fechaInicio,  nombreMaquinaFiltro, `%${codeProductFiltro}%`],
                                (errPrecioUnitario, rowsPrecioUnitario) => {
                                  if (errPrecioUnitario) {
                                    console.error('Error executing query Total Gastado:', errPrecioUnitario);
                                    return res.status(500).json({ error: 'Internal Server Error' });
                                  }
  
                              // Procesa los resultados y crea el objeto de respuesta final
                              const totalGastadoTarjetaCredito = rowsTotalGastadoTarjetaCredito[0].TotalGastadoTarjetaCredito;
                              const totalGastadoEfectivo = rowsTotalGastadoEfectivo[0].TotalGastadoEfectivo;
                              const totalPiezasVendidas = rowsTotalPiezasVendidas[0].TotalPiezasVendidas;
                              const totalTarjetaCredito = rowsTarjetaCredito[0].TotalTarjetaCredito;
                              const totalEfectivo = rowsEfectivo[0].TotalEfectivo;
                              const totalGastado = rowsTotalGastado[0].TotalGastado;
                              const totalUnitario = rowsPrecioUnitario[0].PrecioUnitario;
  

                              const resultadoFinal = {
                                TotalTarjetaCredito: totalTarjetaCredito,
                                TotalEfectivo: totalEfectivo,
                                TotalPiezasVendidas: totalPiezasVendidas,
                                TotalGastado: totalGastado,
                                TotalGastadoTarjetaCredito: totalGastadoTarjetaCredito,
                                TotalGastadoEfectivo: totalGastadoEfectivo,
                                PrecioUnitario: totalUnitario
                              };
  
                              res.json(resultadoFinal);
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  },)}
 catch (error) {
  console.error('Error al consultar la API externa:', error);
  return res.status(500).json({ error: 'Internal Server Error' });
}
;
}


/*Proyecto Trafico Piezas Por Reponer*/

exports.getReponer = async (req, res) => {
  let { maquina } = req.query;

  try {
    // Realiza la solicitud a la API externa
    await axios.get(
      `http://masven.com.mx/admin7_1/desarrollos/bryanNayax-Masven/backend.php?cliente=${encodeURIComponent(maquina)}`
    );

    // Luego, puedes ejecutar tu consulta SQL sin utilizar los datos de la API externa
    req.getConnection((err, conn) => {
      if (err) return res.send(err);

      const query = `
      SELECT 
  A.ProductCodeInMap + 10 AS Carril, 
  B.capacidad,
  COUNT(*) AS TotalRegistros,
  B.producto,
  (
      CASE 
          WHEN ExtraCharge IS NOT NULL 
          THEN 
              CAST(SeValue AS DECIMAL(10, 2)) - 
              CAST(CONCAT(SUBSTRING_INDEX(ExtraCharge, '.', 1), '.', LEFT(SUBSTRING_INDEX(ExtraCharge, '.', -1), 2)) AS DECIMAL(10, 2))
          ELSE
              CAST(SeValue AS DECIMAL(10, 2))
      END
  ) AS SeValue 
FROM nayax_transacciones AS A
LEFT JOIN nayax_transacciones_masven AS B ON A.cliente_id = B.cliente_id AND A.ProductCodeInMap + 10 = B.posicion
LEFT JOIN (
  SELECT 
      MAX(V.fecha) AS max_fecha,
      MAX(V.hora) AS max_hora,
      V.cliente_id
  FROM nayax_visita AS V
  LEFT JOIN nayax_transacciones AS VT ON V.cliente_id = VT.cliente_id
  LEFT JOIN nayax_transacciones_masven AS C ON V.cliente_id = C.cliente_id AND VT.ProductCodeInMap + 10 = C.posicion
  WHERE SUBSTRING_INDEX(C.punto_venta, ' ', 1) = ?
  GROUP BY V.cliente_id
) AS MaxFechaHora ON A.cliente_id = MaxFechaHora.cliente_id
WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) BETWEEN CONCAT(MaxFechaHora.max_fecha, ' ', MaxFechaHora.max_hora) AND NOW()
AND SUBSTRING_INDEX(B.punto_venta, ' ', 1) = ?
GROUP BY A.ProductCodeInMap;
      `;

      conn.query(query, [maquina, maquina, ], (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      });
    });
  } catch (error) {
    console.error('Error al consultar la API externa:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
