"use client";

import { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line
} from 'recharts';

export default function GraficoGeralUso({ impressoras }: { impressoras: any[] }) {
  
  const dadosProcessados = useMemo(() => {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth(); // 0 a 11

    const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const totalPorMes: Record<number, number> = {};

    // 1. Inicializar os meses a zero
    mesesLabels.forEach((_, i) => totalPorMes[i] = 0);

    // 2. Somar o uso de todas as impressoras (Com proteção contra Reset de Contador e conversão para Number)
    impressoras.forEach(imp => {
      const todasLeituras = [...(imp.tabelaContador || [])].sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const contadoresAno = todasLeituras.filter((c: any) => new Date(c.created_at).getFullYear() === anoAtual);
      const leiturasAnteriores = todasLeituras.filter((c: any) => new Date(c.created_at).getFullYear() < anoAtual);

      if (contadoresAno.length > 0) {
        // Garantir que a base é um Número
        let valorAnterior = leiturasAnteriores.length > 0 
          ? Number(leiturasAnteriores[leiturasAnteriores.length - 1].qtd_contador) 
          : Number(contadoresAno[0].qtd_contador);
        
        let usoAcumulado = 0;
        const usoMesAMes: Record<number, number> = {};

        contadoresAno.forEach((c: any) => {
          const mes = new Date(c.created_at).getMonth();
          const contadorAtual = Number(c.qtd_contador);
          
          // Lógica anti-negativo estrita com Number: Se o contador caiu, foi resetado/trocado.
          if (contadorAtual >= valorAnterior) {
            usoAcumulado += (contadorAtual - valorAnterior);
          } else {
            usoAcumulado += contadorAtual; 
          }
          valorAnterior = contadorAtual; // Atualiza para a próxima volta

          // Guarda sempre o maior valor acumulado alcançado no mês
          if (usoMesAMes[mes] === undefined || usoAcumulado > usoMesAMes[mes]) {
            usoMesAMes[mes] = usoAcumulado;
          }
        });

        // Adiciona ao bolo da SME
        let ultimoUsoConhecido = 0;
        for (let i = 0; i <= mesAtual; i++) {
          if (usoMesAMes[i] !== undefined) {
            ultimoUsoConhecido = usoMesAMes[i];
          }
          totalPorMes[i] += ultimoUsoConhecido;
        }
      }
    });

    // 3. CÁLCULO DE PREVISÃO CORRIGIDO
    const totalAteAgora = totalPorMes[mesAtual] || 0;
    const mesesPassados = mesAtual + 1; 
    const mediaMensalCrescimento = mesesPassados > 0 ? Math.round(totalAteAgora / mesesPassados) : 0;

    // 4. Montar os dados para o Recharts
    return mesesLabels.map((mes, index) => {
      if (index <= mesAtual) {
        return {
          mes,
          Realizado: totalPorMes[index],
          Previsao: index === mesAtual ? totalPorMes[index] : null 
        };
      } else {
        const diferencaMeses = index - mesAtual;
        return {
          mes,
          Realizado: null,
          Previsao: totalAteAgora + (mediaMensalCrescimento * diferencaMeses)
        };
      }
    });

  }, [impressoras]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dadosProcessados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="mes" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
            dy={10}
          />
          <YAxis hide domain={['dataMin', 'dataMax + 1000']} />
          
          <Tooltip 
            cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px 16px' }}
            formatter={(value: any, name: any) => [
              `+${Number(value).toLocaleString('pt-BR')} páginas`, 
              name === 'Realizado' ? 'Uso Real (Acumulado)' : 'Previsão Estimada'
            ]}
            labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
          />

          <Area 
            type="monotone" 
            dataKey="Realizado" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            fill="url(#colorRealizado)" 
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />

          <Line 
            type="monotone" 
            dataKey="Previsao" 
            stroke="#94a3b8" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={false}
            activeDot={{ r: 5, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}