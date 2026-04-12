import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function Dashboard() {
  // Buscamos os dados incluindo a data de criação para o cálculo do ano
  const { data: impressoras, error } = await supabase
    .from('tabelaImpressoras')
    .select(`
      id,
      nome_maquina,
      modelo_impressora,
      endereco_ip,
      tabelaToner ( cor_toner, qtd_toner, id ),
      tabelaContador ( qtd_contador, id, created_at )
    `);

  if (error) {
    return <div className="p-10 text-red-500">Erro ao carregar dados: {error.message}</div>;
  }

  const anoAtual = new Date().getFullYear();

  // --- PROCESSAMENTO INTELIGENTE DE DADOS ---
  const impressorasProcessadas = impressoras.map(imp => {
    
    // 1. CÁLCULO DE USO NO ANO (O SEU NOVO RANKING)
    const contadoresAno = (imp.tabelaContador || [])
      .filter((c: any) => new Date(c.created_at).getFullYear() === anoAtual)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const ultimoContador = contadoresAno.length > 0 
      ? contadoresAno[contadoresAno.length - 1].qtd_contador 
      : 0;
    
    const valorInicialAno = contadoresAno.length > 0
      ? contadoresAno[0].qtd_contador
      : ultimoContador;

    // Este é o valor que define quem "trabalha mais"
    const usoNoAno = ultimoContador - valorInicialAno;
    
    // 2. FILTRAR TONER (Apenas o mais recente de cada cor)
    const tonersPorCor: Record<string, any> = {};
    (imp.tabelaToner || []).forEach((t: any) => {
      const cor = t.cor_toner || 'Preto';
      if (!tonersPorCor[cor] || t.id > tonersPorCor[cor].id) {
        tonersPorCor[cor] = t;
      }
    });
    const tonersRecentes = Object.values(tonersPorCor);

    return { ...imp, ultimoContador, usoNoAno, tonersRecentes };
  });

  // Ranking baseado no Uso Real (Uso no Ano)
  const rankingUso = [...impressorasProcessadas]
    .sort((a, b) => b.usoNoAno - a.usoNoAno)
    .slice(0, 5);

  // Alertas de Toner (Apenas recentes e ignorando Gráfica)
  const alertasToner = impressorasProcessadas.flatMap(imp => {
    const nomeBaixo = imp.nome_maquina?.toLowerCase() || "";
    const modeloBaixo = imp.modelo_impressora?.toLowerCase() || "";
    
    if (nomeBaixo.includes('gráfica') || modeloBaixo.includes('gráfica')) return [];

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
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Monitoramento SME</h1>
            <p className="text-slate-500 font-medium">Análise de desempenho e suprimentos</p>
          </div>
        </div>

        {/* Dashboard Superior */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Unidades Mais Ativas (Baseado no Uso do Ano) */}
          <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-4 bg-blue-600 rounded-full"></span>
              Mais Utilizadas no Ano
            </h2>
            <div className="space-y-4">
              {rankingUso.map((imp, index) => (
                <div key={imp.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-200">#{index + 1}</span>
                    <span className="font-bold text-slate-700 truncate max-w-[150px]">{imp.nome_maquina}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-blue-600">+{imp.usoNoAno.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">páginas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas Críticos */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-4 bg-rose-500 rounded-full"></span>
              Alertas de Suprimento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-2">
              {alertasToner.length > 0 ? (
                alertasToner.map((alerta, i) => (
                  <div key={i} className="flex items-center gap-4 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <div className="bg-rose-500 text-white w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center font-black text-sm animate-pulse">
                      {alerta.nivel}%
                    </div>
                    <div>
                      <p className="text-sm font-black text-rose-900">{alerta.unidade}</p>
                      <p className="text-[10px] font-bold text-rose-600 uppercase">Toner {alerta.cor || 'Padrão'} Crítico</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic py-10 text-center col-span-2">Nenhum alerta de suprimento.</p>
              )}
            </div>
          </div>
        </div>

        {/* Lista Completa */}
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Equipamentos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {impressorasProcessadas.map((imp) => (
            <Link href={`/impressora/${imp.id}`} key={imp.id}>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all group flex flex-col h-full">
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600">{imp.nome_maquina}</h3>
                    <p className="text-sm text-slate-400 font-medium">{imp.modelo_impressora}</p>
                  </div>
                </div>

                {/* Toners Recentes */}
                <div className="space-y-4 mb-8">
                  {imp.tonersRecentes.map((t: any) => (
                    <div key={t.id}>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1 text-slate-500">
                        <span>Toner {t.cor_toner}</span>
                        <span>{t.qtd_toner}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${t.qtd_toner <= 15 ? 'bg-rose-500' : 'bg-blue-500'}`}
                          style={{ width: `${t.qtd_toner}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Info de Uso no Rodapé */}
                <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Uso no Ano</p>
                    <p className="text-lg font-black text-blue-600">+{imp.usoNoAno.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Total Geral</p>
                    <p className="text-sm font-bold text-slate-700">{imp.ultimoContador.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}