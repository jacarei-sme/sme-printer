"use client";

import { useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, Line, ComposedChart
} from 'recharts';

export default function GraficoContador({ dadosHistoricos }: { dadosHistoricos: any[] }) {
  
  const { dadosProcessados, valorReferencia, mediaMensal, projecaoAnual } = useMemo(() => {
    if (!dadosHistoricos || dadosHistoricos.length === 0) {
      return { dadosProcessados: [], valorReferencia: 0, mediaMensal: 0, projecaoAnual: 0 };
    }

    const anoAtual = new Date().getFullYear();
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const todasLeituras = [...dadosHistoricos].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const dadosAno = todasLeituras.filter(item => new Date(item.created_at).getFullYear() === anoAtual);
    const leiturasAnteriores = todasLeituras.filter(item => new Date(item.created_at).getFullYear() < anoAtual);

    if (dadosAno.length === 0) {
      return { dadosProcessados: [], valorReferencia: 0, mediaMensal: 0, projecaoAnual: 0 };
    }

    let valorAnterior = leiturasAnteriores.length > 0 
      ? Number(leiturasAnteriores[leiturasAnteriores.length - 1].qtd_contador) 
      : Number(dadosAno[0].qtd_contador);
    
    const valorReferenciaDisplay = valorAnterior; 
    let maiorContadorConhecido = valorAnterior;
    
    let usoAcumulado = 0;
    const agrupado: Record<number, number> = {};

    dadosAno.forEach((item) => {
      const mesIndex = new Date(item.created_at).getMonth();
      const contadorAtual = Number(item.qtd_contador);
      
      if (contadorAtual >= valorAnterior) {
        if (valorAnterior < maiorContadorConhecido && contadorAtual > maiorContadorConhecido) {
          usoAcumulado += (contadorAtual - maiorContadorConhecido);
        } else {
          usoAcumulado += (contadorAtual - valorAnterior);
        }
      }

      valorAnterior = contadorAtual;
      if (contadorAtual > maiorContadorConhecido) {
        maiorContadorConhecido = contadorAtual;
      }

      if (agrupado[mesIndex] === undefined || usoAcumulado > agrupado[mesIndex]) {
        agrupado[mesIndex] = usoAcumulado;
      }
    });

    const mesesComDado = Object.keys(agrupado).map(Number).sort((a, b) => a - b);
    const mesInicial = mesesComDado[0];
    const mesAtual = mesesComDado[mesesComDado.length - 1];
    const mesesAtivos = (mesAtual - mesInicial) + 1;
    
    const paginasTotaisAteAgora = agrupado[mesAtual] || 0;
    const media = mesesAtivos > 0 ? Math.round(paginasTotaisAteAgora / mesesAtivos) : 0;

    const chartData = meses.map((nomeMes, index) => {
      const dataPoint: any = { mes: nomeMes };

      if (index <= mesAtual && agrupado[index] !== undefined) {
        let valorReal = agrupado[index];
        if (valorReal === undefined) {
          let lastKnown = 0;
          for(let i = index; i >= 0; i--) {
            if(agrupado[i] !== undefined) { lastKnown = agrupado[i]; break; }
          }
          valorReal = lastKnown;
        }
        dataPoint.Realizado = valorReal;
        if (index === mesAtual) dataPoint.Previsao = valorReal;
      } else if (index > mesAtual) {
        const mesesFuturos = index - mesAtual;
        dataPoint.Previsao = paginasTotaisAteAgora + (media * mesesFuturos);
      }
      return dataPoint;
    });

    const previsaoFinal = chartData[11].Previsao || chartData[11].Realizado || 0;

    return {
      dadosProcessados: chartData,
      valorReferencia: valorReferenciaDisplay,
      mediaMensal: media,
      projecaoAnual: previsaoFinal
    };
  }, [dadosHistoricos]);

  if (dadosProcessados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p className="text-slate-400 font-medium">Sem dados de impressão para {new Date().getFullYear()}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Base do Gráfico</p>
          <p className="text-lg font-black text-slate-700">{valorReferencia.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500">págs</span></p>
        </div>
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Média Mensal</p>
          <p className="text-lg font-black text-blue-700">+{mediaMensal.toLocaleString('pt-BR')} <span className="text-xs font-normal text-blue-500">págs/mês</span></p>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 relative overflow-hidden">
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Projeção p/ Dezembro</p>
          <p className="text-lg font-black text-emerald-700">{projecaoAnual.toLocaleString('pt-BR')} <span className="text-xs font-normal text-emerald-500">págs acumuladas</span></p>
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dadosProcessados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => value === 0 ? '0' : `+${value.toLocaleString('pt-BR')}`} />
            <Tooltip 
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px 16px' }}
              formatter={(value: any, name: any) => [`+${Number(value).toLocaleString('pt-BR')} páginas`, name === 'Realizado' ? 'Uso Real (Acumulado)' : 'Previsão Estimada']}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
            />            
            <Area type="monotone" dataKey="Realizado" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRealizado)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="Previsao" stroke="#10b981" strokeWidth={3} strokeDasharray="6 6" dot={false} activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}