exports.get = (req,res)=>{
    req.getConnection((err,conn)=>{
        if (err) return res.send(err);


        conn.query(`SELECT COUNT(*) AS TotalRegistros
        FROM nayax_transacciones`, (err,result)=>{
            if (err) return res.send(err);
            res.send(result);

        })
    }
  
    )
}

exports.getTabla = async (req, res) => {
    let {
      fechaInicio ,
      fechaFin ,
     
      cliente_id ,
    } = req.query;
  
    req.getConnection((err, conn) => {
      if (err) return res.send(err);
  
      const query = `
      SELECT 
      A.ProductCodeInMap, 
      CAST(SeValue AS UNSIGNED) AS SeValue,
      COUNT(*) AS TotalRegistros
  FROM nayax_transacciones A 
  JOIN nayax_temp B ON B.id = A.cliente_id
  WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
          BETWEEN ? AND ?
  AND B.nombre LIKE ?
  GROUP BY A.ProductCodeInMap;
      `;
  
      conn.query(query, [fechaInicio, fechaFin,  `${cliente_id}%`], (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      });
    });
  };
  


exports.getTablaTotal = async (req, res) => {
  let {
    fechaInicio ,
    fechaFin ,
    
    cliente_id ,
  } = req.query;

  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    const query = `
   
  SELECT
  SUM(TotalRegistros) AS SumaTotalRegistros

FROM (
  SELECT 
      A.ProductCodeInMap, 
      CAST(SeValue AS UNSIGNED) AS SeValue,
      COUNT(*) AS TotalRegistros
  FROM nayax_transacciones A 
  JOIN nayax_temp B ON B.id = A.cliente_id
  WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
          BETWEEN ? AND ?
  AND B.nombre LIKE ?
  GROUP BY A.ProductCodeInMap
) AS Subconsulta;
    `;

    conn.query(query, [fechaInicio, fechaFin,  `${cliente_id}%`], (err, result) => {
      if (err) return res.send(err);
      res.send(result);
    });
  });
};

exports.getTotal = async (req, res) => {
    // Intenta imprimir los parámetros que estás recibiendo para asegurarte de que son correctos
    console.log(req.query);
  
    const {
      fechaInicio,
      fechaFin, 
      
      nombreMaquinaFiltro,
      codeProductFiltro
    } = req.query;
  
    req.getConnection((err, conn) => {
      if (err) {
        console.error('Error connecting to database:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      const queryTotalGastadoTarjetaCredito = `
        SELECT SUM(A.SeValue) AS TotalGastadoTarjetaCredito
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
          BETWEEN ? AND ?
  AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
          AND A.PaymentMethodId = 1
      `;
  
      const queryTotalGastadoEfectivo = `
        SELECT SUM(A.SeValue) AS TotalGastadoEfectivo
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
          BETWEEN ? AND ?
  AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
          AND A.PaymentMethodId = 3
      `;
  
      const queryTotalPiezasVendidas = `
        SELECT COUNT(*) AS TotalPiezasVendidas
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
        BETWEEN ? AND ?
AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
      `;
  
      const queryTarjetaCredito = `
        SELECT COUNT(*) AS TotalTarjetaCredito
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
        BETWEEN ? AND ?
AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
          AND PaymentMethodId = 1
      `;
  
      const queryEfectivo = `
        SELECT COUNT(*) AS TotalEfectivo
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
        BETWEEN ? AND ?
AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
          AND PaymentMethodId = 3
      `;
  
      const queryTotalGastado = `
        SELECT SUM(A.SeValue) AS TotalGastado
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE CONCAT(A.MachineSeTimeDateOnly, ' ', A.MachineSeTimeTimeOnly) 
          BETWEEN ? AND ?
  AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
      `;
  
      conn.query(
        queryTotalGastadoTarjetaCredito,
        [fechaInicio, fechaFin,  `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
        (errTotalGastadoTarjetaCredito, rowsTotalGastadoTarjetaCredito) => {
          if (errTotalGastadoTarjetaCredito) {
            console.error('Error executing query Total Gastado Tarjeta Crédito:', errTotalGastadoTarjetaCredito);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
  
          conn.query(
            queryTotalGastadoEfectivo,
            [fechaInicio, fechaFin,`%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
            (errTotalGastadoEfectivo, rowsTotalGastadoEfectivo) => {
              if (errTotalGastadoEfectivo) {
                console.error('Error executing query Total Gastado Efectivo:', errTotalGastadoEfectivo);
                return res.status(500).json({ error: 'Internal Server Error' });
              }
  
              conn.query(
                queryTotalPiezasVendidas,
                [fechaInicio, fechaFin,  `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
                (errTotalPiezasVendidas, rowsTotalPiezasVendidas) => {
                  if (errTotalPiezasVendidas) {
                    console.error('Error executing query Total Piezas Vendidas:', errTotalPiezasVendidas);
                    return res.status(500).json({ error: 'Internal Server Error' });
                  }
  
                  conn.query(
                    queryTarjetaCredito,
                    [fechaInicio, fechaFin,  `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
                    (errTarjetaCredito, rowsTarjetaCredito) => {
                      if (errTarjetaCredito) {
                        console.error('Error executing query Tarjeta Crédito:', errTarjetaCredito);
                        return res.status(500).json({ error: 'Internal Server Error' });
                      }
  
                      conn.query(
                        queryEfectivo,
                        [fechaInicio, fechaFin, `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
                        (errEfectivo, rowsEfectivo) => {
                          if (errEfectivo) {
                            console.error('Error executing query Efectivo:', errEfectivo);
                            return res.status(500).json({ error: 'Internal Server Error' });
                          }
  
                          conn.query(
                            queryTotalGastado,
                            [fechaInicio, fechaFin, `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
                            (errTotalGastado, rowsTotalGastado) => {
                              if (errTotalGastado) {
                                console.error('Error executing query Total Gastado:', errTotalGastado);
                                return res.status(500).json({ error: 'Internal Server Error' });
                              }
  
                              // Procesa los resultados y crea el objeto de respuesta final
                              const totalGastadoTarjetaCredito = rowsTotalGastadoTarjetaCredito[0].TotalGastadoTarjetaCredito;
                              const totalGastadoEfectivo = rowsTotalGastadoEfectivo[0].TotalGastadoEfectivo;
                              const totalPiezasVendidas = rowsTotalPiezasVendidas[0].TotalPiezasVendidas;
                              const totalTarjetaCredito = rowsTarjetaCredito[0].TotalTarjetaCredito;
                              const totalEfectivo = rowsEfectivo[0].TotalEfectivo;
                              const totalGastado = rowsTotalGastado[0].TotalGastado;
  
                              const resultadoFinal = {
                                TotalTarjetaCredito: totalTarjetaCredito,
                                TotalEfectivo: totalEfectivo,
                                TotalPiezasVendidas: totalPiezasVendidas,
                                TotalGastado: totalGastado,
                                TotalGastadoTarjetaCredito: totalGastadoTarjetaCredito,
                                TotalGastadoEfectivo: totalGastadoEfectivo
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
  };