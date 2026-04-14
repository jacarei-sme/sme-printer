import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import GraficoGeralUso from './components/GraficoGeralUso';

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
      tabelaContador ( qtd_contador, id, created_at )
    `);

  if (error) {
    return <div className="p-10 text-rose-600 font-bold bg-rose-50 text-center">Erro ao carregar dados: {error.message}</div>;
  }

  const anoAtual = new Date().getFullYear();

  // --- PROCESSAMENTO INTELIGENTE DE DADOS ---
  const impressorasProcessadas = impressoras.map(imp => {
    
    const todasLeituras = (imp.tabelaContador || []).sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const ultimoContadorGlobal = todasLeituras.length > 0 
      ? Number(todasLeituras[todasLeituras.length - 1].qtd_contador) 
      : 0;

    const contadoresAno = todasLeituras.filter((c: any) => new Date(c.created_at).getFullYear() === anoAtual);
    const leiturasAnteriores = todasLeituras.filter((c: any) => new Date(c.created_at).getFullYear() < anoAtual);

    let valorAnterior = leiturasAnteriores.length > 0 
      ? Number(leiturasAnteriores[leiturasAnteriores.length - 1].qtd_contador) 
      : (contadoresAno.length > 0 ? Number(contadoresAno[0].qtd_contador) : 0);

    // Variável para proteger contra pulos fantasmas de leitura (Glitch Bounce-back)
    let maiorContadorConhecido = valorAnterior;
    let usoNoAno = 0;

    contadoresAno.forEach((c: any) => {
      const contadorAtual = Number(c.qtd_contador);

      if (contadorAtual >= valorAnterior) {
        // Se houve uma queda antes e agora o contador saltou de volta ao patamar antigo
        if (valorAnterior < maiorContadorConhecido && contadorAtual > maiorContadorConhecido) {
          usoNoAno += (contadorAtual - maiorContadorConhecido);
        } else {
          usoNoAno += (contadorAtual - valorAnterior);
        }
      } 
      // Se contadorAtual < valorAnterior (Queda/Troca detectada): 
      // Não somamos NADA para evitar injetar o odômetro absoluto no uso.

      valorAnterior = contadorAtual;
      if (contadorAtual > maiorContadorConhecido) {
        maiorContadorConhecido = contadorAtual;
      }
    });

    const tonersPorCor: Record<string, any> = {};
    (imp.tabelaToner || []).forEach((t: any) => {
      const cor = t.cor_toner || 'Preto';
      if (!tonersPorCor[cor] || t.id > tonersPorCor[cor].id) {
        tonersPorCor[cor] = t;
      }
    });
    const tonersRecentes = Object.values(tonersPorCor);

    return { ...imp, ultimoContadorGlobal, usoNoAno, tonersRecentes };
  });

  const rankingUso = [...impressorasProcessadas]
    .sort((a, b) => b.usoNoAno - a.usoNoAno)
    .slice(0, 5);

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

  const totalVolumeSME = impressorasProcessadas.reduce((acc, imp) => acc + imp.usoNoAno, 0);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Monitoramento SME</h1>
            <p className="text-slate-500 font-medium mt-1">Análise de desempenho e suprimentos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-4 bg-blue-600 rounded-full"></span>
              Mais Utilizadas ({anoAtual})
            </h2>
            <div className="space-y-4">
              {rankingUso.map((imp, index) => (
                <div key={imp.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-200">#{index + 1}</span>
                    <span className="font-bold text-slate-700 truncate max-w-[150px]">{imp.nome_maquina}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-blue-600">+{imp.usoNoAno.toLocaleString('pt-BR')}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">páginas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-4 bg-rose-500 rounded-full"></span>
              Alertas de Suprimento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[240px] overflow-y-auto pr-2">
              {alertasToner.length > 0 ? (
                alertasToner.map((alerta, i) => (
                  <div key={i} className="flex items-center gap-4 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <div className="bg-rose-500 text-white w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center font-black text-sm animate-pulse shadow-md">
                      {alerta.nivel}%
                    </div>
                    <div>
                      <p className="text-sm font-black text-rose-900 leading-tight">{alerta.unidade}</p>
                      <p className="text-[10px] font-bold text-rose-600 uppercase mt-1">Toner {alerta.cor || 'Padrão'} Crítico</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <span className="text-2xl mb-2">✅</span>
                  <p className="text-slate-400 font-medium text-sm">Todos os níveis de suprimento normais.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Volume de Impressão Global</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">Uso acumulado de todas as unidades da SME em {anoAtual}</p>
            </div>
            <div className="bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 shadow-inner">
              <span className="text-[10px] font-black text-blue-500 uppercase block leading-none mb-1">Total Acumulado ({anoAtual})</span>
              <span className="text-2xl font-black text-blue-700">
                {totalVolumeSME.toLocaleString('pt-BR')} <span className="text-sm font-bold text-blue-400">págs</span>
              </span>
            </div>
          </div>
          <GraficoGeralUso impressoras={impressorasProcessadas} />
        </div>

        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Lista de Equipamentos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {impressorasProcessadas.map((imp) => (
            <Link href={`/impressora/${imp.id}`} key={imp.id}>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{imp.nome_maquina}</h3>
                    <p className="text-sm text-slate-400 font-medium">{imp.modelo_impressora}</p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  {imp.tonersRecentes.length > 0 ? (
                    imp.tonersRecentes.map((t: any) => (
                      <div key={t.id}>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-2 text-slate-500">
                          <span>Toner {t.cor_toner || 'Padrão'}</span>
                          <span className={t.qtd_toner <= 15 ? 'text-rose-600' : 'text-slate-700'}>{t.qtd_toner}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-700 ease-out ${
                              t.qtd_toner >= 50 ? 'bg-emerald-500' : t.qtd_toner >= 15 ? 'bg-amber-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${t.qtd_toner}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                      <p className="text-xs text-amber-600 font-bold">Sem dados de suprimento.</p>
                    </div>
                  )}
                </div>
                <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Uso no Ano</p>
                    <p className="text-xl font-black text-blue-600">+{imp.usoNoAno.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Odometer</p>
                    <p className="text-sm font-bold text-slate-700">{imp.ultimoContadorGlobal.toLocaleString('pt-BR')}</p>
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