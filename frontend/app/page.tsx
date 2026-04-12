import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function Dashboard() {
  const { data: impressoras, error } = await supabase
    .from('tabelaImpressoras')
    .select(`
      id,
      nome_maquina,
      modelo_impressora,
      endereco_ip,
      tabelaToner ( cor_toner, qtd_toner, id ),
      tabelaContador ( qtd_contador, id )
    `);

  if (error) {
    return <div className="p-10 text-red-500">Erro ao carregar dados: {error.message}</div>;
  }

  // --- PROCESSAMENTO E FILTRAGEM DOS DADOS ---
  const impressorasProcessadas = impressoras.map(imp => {
    // 1. Pegar apenas o contador mais recente
    const ultimoContador = imp.tabelaContador?.length > 0 
      ? Math.max(...imp.tabelaContador.map((c: any) => c.qtd_contador)) 
      : 0;
    
    // 2. Pegar apenas a ÚLTIMA leitura de toner (evita repetir o histórico no card)
    // Agrupamos por cor para garantir que, se for colorida, pega o mais recente de cada cor.
    const tonersPorCor: Record<string, any> = {};
    (imp.tabelaToner || []).forEach((t: any) => {
      const cor = t.cor_toner || 'Preto';
      // Guarda apenas se for o primeiro que achou ou se o ID for maior (mais recente)
      if (!tonersPorCor[cor] || t.id > tonersPorCor[cor].id) {
        tonersPorCor[cor] = t;
      }
    });
    const tonersRecentes = Object.values(tonersPorCor);

    return { ...imp, ultimoContador, tonersRecentes };
  });

  // Ranking de Uso (Top 5)
  const rankingUso = [...impressorasProcessadas]
    .sort((a, b) => b.ultimoContador - a.ultimoContador)
    .slice(0, 5);

  // Alertas de Toner (Apenas para o valor MAIS RECENTE de impressoras que não são da Gráfica)
  const alertasToner = impressorasProcessadas.flatMap(imp => {
    const eDaGrafica = imp.nome_maquina?.toLowerCase().includes('gráfica') || 
                       imp.modelo_impressora?.toLowerCase().includes('gráfica');
    
    if (eDaGrafica) return [];

    return imp.tonersRecentes
      .filter((t: any) => t.qtd_toner <= 15)
      .map((t: any) => ({
        unidade: imp.nome_maquina,
        nivel: t.qtd_toner,
        cor: t.cor_toner
      }));
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* CABEÇALHO DO SISTEMA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Monitoramento SME</h1>
            <p className="text-slate-500 font-medium">Gestão centralizada de ativos de impressão</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200">
              Sistema Online
            </span>
          </div>
        </div>

        {/* --- DASHBOARD SUPERIOR --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Ranking de Unidades */}
          <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-4 bg-blue-600 rounded-full"></span>
              Mais Utilizadas (Top 5)
            </h2>
            <div className="space-y-4 flex-1">
              {rankingUso.map((imp, index) => (
                <div key={imp.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-300">#{index + 1}</span>
                    <span className="font-bold text-slate-700 truncate max-w-[150px]">{imp.nome_maquina}</span>
                  </div>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                    {imp.ultimoContador.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Painel de Alertas Críticos */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-4 bg-rose-500 rounded-full"></span>
              Alertas de Suprimento (Crítico)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-2">
              {alertasToner.length > 0 ? (
                alertasToner.map((alerta, i) => (
                  <div key={i} className="flex items-center gap-4 bg-rose-50 p-4 rounded-2xl border border-rose-100 h-fit">
                    <div className="bg-rose-500 text-white w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center font-black text-sm shadow-md animate-pulse">
                      {alerta.nivel}%
                    </div>
                    <div>
                      <p className="text-sm font-black text-rose-900 leading-tight">{alerta.unidade}</p>
                      <p className="text-xs font-bold text-rose-600 uppercase mt-1">Toner {alerta.cor || 'Padrão'} baixo</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex items-center justify-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">Nenhum alerta crítico no momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- GRID DE IMPRESSORAS --- */}
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Todos os Equipamentos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {impressorasProcessadas.map((imp) => (
            <Link href={`/impressora/${imp.id}`} key={imp.id}>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all group cursor-pointer h-full flex flex-col">
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{imp.nome_maquina}</h3>
                    <p className="text-sm text-slate-400 font-medium">{imp.modelo_impressora}</p>
                  </div>
                  <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">IP</p>
                    <p className="text-xs font-mono font-bold text-slate-600">{imp.endereco_ip}</p>
                  </div>
                </div>

                {/* Status do Toner (Apenas o mais recente) */}
                <div className="space-y-4 mb-8">
                  {imp.tonersRecentes.length > 0 ? (
                    imp.tonersRecentes.map((t: any) => (
                      <div key={t.id}>
                        <div className="flex justify-between text-xs font-black uppercase tracking-tighter mb-2 text-slate-500">
                          <span>Toner {t.cor_toner || 'Padrão'}</span>
                          <span className={t.qtd_toner <= 15 ? 'text-rose-600' : 'text-slate-700'}>{t.qtd_toner}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              t.qtd_toner >= 50 ? 'bg-emerald-500' : t.qtd_toner >= 15 ? 'bg-amber-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${t.qtd_toner}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sem dados de toner no momento.</p>
                  )}
                </div>

                {/* Contador em destaque no Card */}
                <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contador Atual</span>
                  <span className="text-xl font-black text-blue-700 bg-blue-50 px-4 py-1 rounded-xl">
                    {imp.ultimoContador.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}