"use client";

import { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export default function GraficoGeralUso({ impressoras }: { impressoras: any[] }) {
  
  const dadosProcessados = useMemo(() => {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth(); // 0 a 11

    const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const totalPorMes: Record<number, number> = {};

    // Inicializar os meses a zero
    mesesLabels.forEach((_, i) => totalPorMes[i] = 0);

    impressoras.forEach(imp => {
      // Ordenar todo o histórico cronologicamente
      const todasLeituras = (imp.tabelaContador || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const leiturasAnteriores = todasLeituras.filter((c: any) => new Date(c.created_at).getFullYear() < anoAtual);
      const contadoresAno = todasLeituras.filter((c: any) => new Date(c.created_at).getFullYear() === anoAtual);

      if (contadoresAno.length > 0) {
        // A base zero ideal é a última leitura do ano anterior. 
        // Se não existir, usa-se a primeira leitura deste ano.
        const baseZero = leiturasAnteriores.length > 0 
          ? leiturasAnteriores[leiturasAnteriores.length - 1].qtd_contador 
          : contadoresAno[0].qtd_contador;
        
        // Agrupar o maior valor atingido em cada mês para a impressora
        const maiorDoMes: Record<number, number> = {};
        contadoresAno.forEach((c: any) => {
          const mes = new Date(c.created_at).getMonth();
          const usoAteEntao = c.qtd_contador - baseZero;
          if (maiorDoMes[mes] === undefined || usoAteEntao > maiorDoMes[mes]) {
            maiorDoMes[mes] = usoAteEntao;
          }
        });

        // Adicionar ao bolo geral da SME (repetindo o último valor nos meses sem leitura)
        let ultimoUsoConhecido = 0;
        for (let i = 0; i <= mesAtual; i++) {
          if (maiorDoMes[i] !== undefined) {
            ultimoUsoConhecido = maiorDoMes[i];
          }
          totalPorMes[i] += ultimoUsoConhecido;
        }
      }
    });

    // Formatar para o gráfico do Recharts
    return mesesLabels.map((mes, i) => ({
      mes,
      total: totalPorMes[i],
      exibir: i <= mesAtual // Não exibe os meses do futuro no gráfico
    })).filter(d => d.exibir);

  }, [impressoras]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dadosProcessados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
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
          <YAxis hide />
          <Tooltip 
            cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: any) => [`+${Number(value).toLocaleString('pt-BR')} páginas`, 'Uso Acumulado SME']}
            labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            fill="url(#colorTotal)" 
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}