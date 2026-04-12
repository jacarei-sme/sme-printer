import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function Dashboard() {
  // Agora pedimos o toner E o contador
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
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-xl shadow-lg border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-600 mb-2">Erro de Conexão</h2>
          <p className="text-gray-700">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">🖨️ Monitoramento de Impressoras</h1>
            <p className="text-gray-500 mt-1">Visão geral do parque de impressão e níveis de suprimento</p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold border border-blue-100">
            Total Ativas: {impressoras?.length || 0}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {impressoras?.map((imp) => {
            
            // LÓGICA PARA PEGAR O ÚLTIMO CONTADOR
            // Como o Python insere vários, pegamos o último do array (mais recente)
            const ultimoContador = imp.tabelaContador && imp.tabelaContador.length > 0 
              ? imp.tabelaContador[imp.tabelaContador.length - 1].qtd_contador 
              : null;

            // LÓGICA PARA EVITAR TONERS DUPLICADOS
            // Filtra o array para manter apenas os dados da última leitura de cada cor
            const tonersRecentes = imp.tabelaToner ? Object.values(
              imp.tabelaToner.reduce((acc: any, toner: any) => {
                acc[toner.cor_toner] = toner; // Sobrescreve a cor, mantendo só o último registro
                return acc;
              }, {})
            ) : [];

            return (
              <div key={imp.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100 relative overflow-hidden flex flex-col justify-between">
                
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>

                <div>
                  <h2 className="text-xl font-bold text-gray-800 truncate" title={imp.nome_maquina || "Sem Nome"}>
                    {imp.nome_maquina || "Sem Nome"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 mb-5 text-sm text-gray-500 font-medium">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{imp.modelo_impressora}</span>
                    <span>•</span>
                    <span>IP: {imp.endereco_ip}</span>
                  </div>
                  
                  {/* Bloco de Toners */}
                  <div className="space-y-4 mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">
                      Níveis de Toner
                    </h3>
                    
                    {tonersRecentes.length > 0 ? (
                      tonersRecentes.map((toner: any, index: number) => (
                        <div key={index} className="flex items-center justify-between group">
                          <span className="text-sm font-semibold text-gray-600 w-20">{toner.cor_toner}</span>
                          
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-full bg-gray-100 rounded-full h-3 shadow-inner overflow-hidden">
                              <div 
                                className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                                  toner.qtd_toner <= 15 ? 'bg-red-500' : 
                                  toner.qtd_toner <= 30 ? 'bg-yellow-400' : 'bg-green-500'
                                }`} 
                                style={{ width: `${toner.qtd_toner}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-bold w-10 text-right ${toner.qtd_toner <= 15 ? 'text-red-600' : 'text-gray-700'}`}>
                              {toner.qtd_toner}%
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <span>⚠️</span>
                        <span className="font-medium italic">Sem dados de suprimento.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloco do Contador */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Total de Páginas
                  </span>
                  <span className="text-lg font-black text-blue-700">
                    {ultimoContador ? ultimoContador.toLocaleString('pt-BR') : '---'}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
