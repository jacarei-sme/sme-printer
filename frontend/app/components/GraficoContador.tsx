"use client";

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function GraficoContador({ dadosHistoricos }: { dadosHistoricos: any[] }) {
  // Processa os dados brutos para agrupar por mês
  const dadosProcessados = useMemo(() => {
    if (!dadosHistoricos || dadosHistoricos.length === 0) return [];

    const agrupado: Record<string, any> = {};

    dadosHistoricos.forEach((item) => {
      // ATENÇÃO: Confirme se o nome da sua coluna de data no Supabase é 'created_at'.
      // Se for outro (ex: 'data_medicao'), altere abaixo.
      if (!item.created_at || !item.qtd_contador) return;

      const data = new Date(item.created_at);
      const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      // Guarda sempre o maior valor do contador (última leitura) para aquele mês
      if (!agrupado[mesAno] || agrupado[mesAno].Páginas < item.qtd_contador) {
        agrupado[mesAno] = {
          mes: mesAno,
          Páginas: item.qtd_contador,
          timestamp: data.getTime(), // Usado para ordenar depois
        };
      }
    });

    // Converte o objeto em array e ordena do mais antigo para o mais novo
    return Object.values(agrupado).sort((a, b) => a.timestamp - b.timestamp);
  }, [dadosHistoricos]);

  if (dadosProcessados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-slate-400 font-medium italic">Dados insuficientes para gerar o gráfico.</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dadosProcessados} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="mes" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            tickFormatter={(value) => value.toLocaleString('pt-BR')}
            dx={-10}
          />
         <Tooltip
           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
           labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
           formatter={(value) => {
               if (value == null) {
               return ['', 'Páginas Impressas'];
               }
               
               const formattedValue =
               typeof value === 'number'
                   ? value.toLocaleString('pt-BR')
                   : String(value);
               return [formattedValue, 'Páginas Impressas'] as [string, string];
            }}
            />
          <Line 
            type="monotone" 
            dataKey="Páginas" 
            stroke="#2563eb" 
            strokeWidth={4} 
            dot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 8, fill: '#1d4ed8', stroke: '#eff6ff', strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}