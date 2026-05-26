const roles = [
  { id: 1, description: 'Membro - Contabilidade', code: 'VG-0002', region: 'GO' },
  { id: 2, description: 'Membro - TI', code: 'VG-0001', region: 'GO' },
  { id: 3, description: 'Líder - Vendas', code: 'VG-0003', region: 'MT' }
];

const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const testFilter = (roleSearch) => {
  return roles.filter(r => {
    const searchTokens = removeAccents(roleSearch).split(/\s+/).filter(t => t);
    if (searchTokens.length === 0) return true;

    return searchTokens.every(token => {
      const desc = removeAccents(r.description || '');
      const code = removeAccents(r.code || '');
      const region = removeAccents(r.region || '');
      
      const isGoias = (token.includes('goias') || token === 'go') && r.region === 'GO';
      const isMatoGrosso = (token.includes('mato') || token.includes('grosso') || token === 'mt') && r.region === 'MT';
      const isTocantins = (token.includes('tocantins') || token === 'to') && r.region === 'TO';
      
      return desc.includes(token) || code.includes(token) || region.includes(token) || isGoias || isMatoGrosso || isTocantins;
    });
  });
};

console.log('Test "goias":', testFilter('goias').map(r => r.description));
console.log('Test "membro goias":', testFilter('membro goias').map(r => r.description));
console.log('Test "lider mato":', testFilter('lider mato').map(r => r.description));
console.log('Test "vendas mt":', testFilter('vendas mt').map(r => r.description));
