import { Produto } from '../model/produto';

export interface ResultadoBusca {
  exatos: Produto[];
  semelhantes: Produto[];
}

/** Minúsculas, sem acentos e sem pontuação (ex.: "Homem-Aranha!" -> "homem aranha"). */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(texto: string): string[] {
  const n = normalizar(texto);
  return n ? n.split(' ') : [];
}

function distancia(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Pontua um termo da busca contra um campo (lista de palavras). 0 = sem correspondência. */
function pontuarTermo(termo: string, palavras: string[], pesoBase: number): number {
  let melhor = 0;
  const tolerancia = termo.length <= 3 ? 0 : termo.length <= 6 ? 1 : 2;
  for (const p of palavras) {
    let pts = 0;
    if (p === termo) pts = pesoBase;
    else if (p.startsWith(termo)) pts = pesoBase * 0.8;
    else if (termo.length >= 3 && p.includes(termo)) pts = pesoBase * 0.5;
    else if (tolerancia > 0 && Math.abs(p.length - termo.length) <= tolerancia) {
      // tolera erros de digitação (ex.: "spidermen", "capitao amerca")
      const d = Math.min(distancia(termo, p), distancia(termo, p.slice(0, termo.length)));
      if (d <= tolerancia) pts = pesoBase * 0.4;
    }
    if (pts > melhor) melhor = pts;
  }
  return melhor;
}

const GENERICAS = new Set(['marvel', 'acessorio', 'pop', 'de', 'do', 'da']);

export function buscarProdutos(lista: Produto[], consulta: string): ResultadoBusca {
  const termos = tokens(consulta);
  if (termos.length === 0) return { exatos: [], semelhantes: [] };

  const pontuados = lista.map((produto) => {
    const nome = tokens(produto.nome);
    const chaves = tokens(produto.keywords);
    const desc = tokens(produto.descritivo);
    let total = 0;
    let casados = 0;
    for (const t of termos) {
      const pts = Math.max(
        pontuarTermo(t, nome, 10),
        pontuarTermo(t, chaves, 7),
        pontuarTermo(t, desc, 3),
      );
      if (pts > 0) casados++;
      total += pts;
    }
    return { produto, total, todos: casados === termos.length, algum: casados > 0 };
  });

  const exatos = pontuados
    .filter((p) => p.todos)
    .sort((a, b) => b.total - a.total || a.produto.nome.localeCompare(b.produto.nome));

  // Semelhantes: casam parte dos termos, ou compartilham palavras-chave com os melhores resultados.
  const chavesTopo = new Set(
    exatos.slice(0, 3).flatMap((p) => tokens(p.produto.keywords)).filter((k) => !GENERICAS.has(k)),
  );
  const idsExatos = new Set(exatos.map((p) => p.produto.codigo));
  const semelhantes = pontuados
    .filter((p) => !idsExatos.has(p.produto.codigo))
    .map((p) => {
      const parecido = tokens(p.produto.keywords).filter((k) => chavesTopo.has(k)).length;
      return { ...p, rank: (p.algum ? p.total : 0) + parecido * 2 };
    })
    .filter((p) => p.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.produto.nome.localeCompare(b.produto.nome));

  return {
    exatos: exatos.map((p) => p.produto),
    semelhantes: semelhantes.slice(0, 8).map((p) => p.produto),
  };
}
