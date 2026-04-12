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
  AreaChart,
  Area
} from 'recharts';

export default function GraficoContador({ dadosHistoricos }: { dadosHistoricos: any[] }) {
  
  const { dadosProcessados, valorReferencia } = useMemo(() => {
    if (!dadosHistoricos || dadosHistoricos.length === 0) return { dadosProcessados: [], valorReferencia: 0 };

    const anoAtual = new Date().getFullYear();
    
    // 1. Filtrar apenas dados do ano atual e ordenar por data
    const dadosAno = dadosHistoricos
      .filter(item => new Date(item.created_at).getFullYear() === anoAtual)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (dadosAno.length === 0) return { dadosProcessados: [], valorReferencia: 0 };

    // 2. Definir o valor de referência (o "zero" do gráfico)
    // Pegamos o menor valor do contador no ano atual
    const valorBase = dadosAno[0].qtd_contador;

    const agrupado: Record<string, any> = {};

    dadosAno.forEach((item) => {
      const data = new Date(item.created_at);
      const mesAno = data.toLocaleDateString('pt-BR', { month: 'short' });

      // Pegamos a maior leitura do mês para o acumulado
      if (!agrupado[mesAno] || agrupado[mesAno].valorAbsoluto < item.qtd_contador) {
        agrupado[mesAno] = {
          mes: mesAno,
          valorAbsoluto: item.qtd_contador,
          // O valor que vai para o gráfico é a diferença (Delta)
          PaginasNoAno: item.qtd_contador - valorBase, 
          timestamp: data.getTime(),
        };
      }
    });

    return {
      dadosProcessados: Object.values(agrupado).sort((a, b) => a.timestamp - b.timestamp),
      valorReferencia: valorBase
    };
  }, [dadosHistoricos]);

  if (dadosProcessados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p className="text-slate-400 font-medium">Sem dados para o ano de {new Date().getFullYear()}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Legenda explicativa da base */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
          Base: {valorReferencia.toLocaleString('pt-BR')}
        </span>
        <p className="text-xs text-slate-400 font-medium">
          Valores representam o uso acumulado desde 1º de Janeiro.
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {/* Mudei para AreaChart para dar uma sensação de "preenchimento" de volume */}
          <AreaChart data={dadosProcessados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPaginas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
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
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => `+${value.toLocaleString('pt-BR')}`}
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
            <Area 
              type="monotone" 
              dataKey="PaginasNoAno" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorPaginas)" 
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}