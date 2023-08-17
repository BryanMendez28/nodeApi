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
      fechaInicio = '0000-00-00',
      fechaFin = '0000-00-00',
      horaInicio = '00:00:00',
      horaFin= '00:00:00',
      cliente_id = '',
    } = req.query;
  
    req.getConnection((err, conn) => {
      if (err) return res.send(err);
  
      const query = `
        SELECT 
          A.ProductCodeInMap,
          COUNT(*) AS TotalRegistros,
          SUM(CASE WHEN A.PaymentMethodId = 1 THEN 1 ELSE 0 END) AS TotalRegistrosTarjetaCredito,
          SUM(CASE WHEN A.PaymentMethodId = 3 THEN 1 ELSE 0 END) AS TotalRegistrosEfectivo,
          SUM(CASE WHEN A.PaymentMethodId = 1 THEN SeValue ELSE 0 END) AS TotalGastadoTarjetaCredito,
          SUM(CASE WHEN A.PaymentMethodId = 3 THEN SeValue ELSE 0 END) AS TotalGastadoEfectivo,
          SUM(SeValue) AS TotalCosto
        FROM nayax_transacciones A 
        JOIN nayax_temp B ON B.id= A.cliente_id
        WHERE A.MachineSeTimeDateOnly BETWEEN ? AND ?
          AND A.MachineSeTimeTimeOnly BETWEEN ? AND ? 
          AND B.nombre = ? 
        GROUP BY A.ProductCodeInMap;
      `;
  
      conn.query(query, [fechaInicio, fechaFin, horaInicio, horaFin, cliente_id], (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      });
    });
  };
  