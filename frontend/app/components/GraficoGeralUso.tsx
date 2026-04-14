"use client";

import { useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, ComposedChart, Line
} from 'recharts';

export default function GraficoGeralUso({ impressoras }: { impressoras: any[] }) {
  
  const anoAtualParaTitulo = new Date().getFullYear();

  // Definindo a meta fixa com base no levantamento do ano anterior
  const META_ANUAL = 600000; 

  const { dadosProcessados, mediaMensal, projecaoAnual } = useMemo(() => {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth(); // 0 a 11

    const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const totalPorMesAtual: Record<number, number> = {};
    
    mesesLabels.forEach((_, i) => totalPorMesAtual[i] = 0);

    // ========================================================
    // 1. CÁLCULO DO USO REALIZADO (ANO ATUAL)
    // ========================================================
    impressoras.forEach(imp => {
      const todasLeituras = [...(imp.tabelaContador || [])].sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const contadoresAnoAtual = todasLeituras.filter((c: any) => new Date(c.created_at).getFullYear() === anoAtual);
      const leiturasAnterioresAtual = todasLeituras.filter((c: any) => new Date(c.created_at).getFullYear() < anoAtual);

      if (contadoresAnoAtual.length > 0) {
        let valorAnteriorAtual = leiturasAnterioresAtual.length > 0 
          ? Number(leiturasAnterioresAtual[leiturasAnterioresAtual.length - 1].qtd_contador) 
          : Number(contadoresAnoAtual[0].qtd_contador);
        
        let maiorContadorConhecidoAtual = valorAnteriorAtual;
        let usoAcumuladoAtual = 0;
        const usoMesAMesAtual: Record<number, number> = {};

        contadoresAnoAtual.forEach((c: any) => {
          const mes = new Date(c.created_at).getMonth();
          const contadorAtual = Number(c.qtd_contador);
          
          if (contadorAtual >= valorAnteriorAtual) {
            if (valorAnteriorAtual < maiorContadorConhecidoAtual && contadorAtual > maiorContadorConhecidoAtual) {
              usoAcumuladoAtual += (contadorAtual - maiorContadorConhecidoAtual);
            } else {
              usoAcumuladoAtual += (contadorAtual - valorAnteriorAtual);
            }
          }

          valorAnteriorAtual = contadorAtual;
          if (contadorAtual > maiorContadorConhecidoAtual) maiorContadorConhecidoAtual = contadorAtual;

          if (usoMesAMesAtual[mes] === undefined || usoAcumuladoAtual > usoMesAMesAtual[mes]) {
            usoMesAMesAtual[mes] = usoAcumuladoAtual;
          }
        });

        let ultimoUsoConhecido = 0;
        for (let i = 0; i <= mesAtual; i++) {
          if (usoMesAMesAtual[i] !== undefined) {
            ultimoUsoConhecido = usoMesAMesAtual[i];
          }
          totalPorMesAtual[i] += ultimoUsoConhecido;
        }
      }
    });

    // ========================================================
    // 2. ESTRUTURAÇÃO DAS CURVAS DE PREVISÃO E META
    // ========================================================
    const totalAteAgora = totalPorMesAtual[mesAtual] || 0;
    const mesesPassados = mesAtual + 1; 
    
    // Média de crescimento do ano atual (Dita a Projeção)
    const mediaMensalCrescimento = mesesPassados > 0 ? Math.round(totalAteAgora / mesesPassados) : 0;
    
    // Meta mensal distribuída linearmente ao longo do ano
    const mediaMensalMeta = Math.round(META_ANUAL / 12);

    const chartData = mesesLabels.map((mes, index) => {
      let valorRealizado = null;
      let valorPrevisao = null;
      const valorMeta = mediaMensalMeta * (index + 1);

      // Distribuição da Realidade vs Projeção
      if (index <= mesAtual) {
        valorRealizado = totalPorMesAtual[index];
        if (index === mesAtual) valorPrevisao = valorRealizado; // Conecta a previsão ao último ponto real
      } else {
        const diferencaMeses = index - mesAtual;
        valorPrevisao = totalAteAgora + (mediaMensalCrescimento * diferencaMeses);
      }

      return {
        mes,
        Realizado: valorRealizado,
        Previsao: valorPrevisao,
        MetaAnual: valorMeta
      };
    });

    return {
      dadosProcessados: chartData,
      mediaMensal: mediaMensalCrescimento,
      projecaoAnual: chartData[11].Previsao || chartData[11].Realizado || 0
    };

  }, [impressoras]);

  return (
    <div className="w-full">
      {/* ================= CARDS ANALÍTICOS ================= */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card: Média Atual */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Média Mensal de Uso</p>
          <p className="text-xl font-black text-blue-700">
            +{mediaMensal.toLocaleString('pt-BR')} <span className="text-sm font-bold text-blue-400">págs/mês</span>
          </p>
        </div>

        {/* Card: Projeção Atual (Baseada no uso atual) */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Projeção p/ Dezembro</p>
          <p className="text-xl font-black text-emerald-700">
            {projecaoAnual.toLocaleString('pt-BR')} <span className="text-sm font-bold text-emerald-400">págs</span>
          </p>
        </div>

        {/* Card: Meta Fixa */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex flex-col justify-center">
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Expectativa de Consumo ({anoAtualParaTitulo})
          </p>
          <p className="text-lg font-black text-amber-700">
            {META_ANUAL.toLocaleString('pt-BR')} <span className="text-sm font-bold text-amber-500">págs</span>
          </p>
        </div>

      </div>

      {/* ================= GRÁFICO PRINCIPAL ================= */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dadosProcessados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
            <YAxis hide domain={['dataMin', 'dataMax + 1000']} />
            
            <Tooltip 
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px 16px' }}
              formatter={(value: any, name: any) => {
                let displayName = 'Uso Real (Acumulado)';
                if (name === 'Previsao') displayName = 'Projeção (Ritmo Atual)';
                if (name === 'MetaAnual') displayName = `Meta Idealizada (Acumulada)`;
                return [`+${Number(value).toLocaleString('pt-BR')} págs`, displayName];
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
            />

            {/* A) Área de Uso Real do Ano Atual */}
            <Area 
              type="monotone" 
              dataKey="Realizado" 
              stroke="#3b82f6" 
              strokeWidth={4} 
              fill="url(#colorRealizado)" 
              dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 0 }}
            />

            {/* B) Linha de Previsão baseada no ritmo deste ano */}
            <Line 
              type="monotone" 
              dataKey="Previsao" 
              stroke="#10b981" 
              strokeWidth={3} 
              strokeDasharray="6 6" 
              dot={false} 
              activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
            />

            {/* C) Linha de Meta Fixa de 600k */}
            <Line 
              type="monotone" 
              dataKey="MetaAnual" 
              stroke="#f59e0b" /* Laranja (Amber) */
              strokeWidth={3} 
              strokeDasharray="3 3" 
              dot={false} 
              activeDot={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}