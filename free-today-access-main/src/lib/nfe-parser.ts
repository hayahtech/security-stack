// NF-e XML Parser utility
// Parses standard Brazilian NF-e XML format

export interface NFeData {
  number: string;
  series: string;
  key: string;
  date: string;
  supplier: {
    cnpj: string;
    name: string;
    fantasyName?: string;
  };
  items: NFeItem[];
  totalValue: number;
  paymentMethod?: string;
}

export interface NFeItem {
  code: string;
  name: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  taxes: {
    icms?: number;
    pis?: number;
    cofins?: number;
    ipi?: number;
  };
}

function getTagText(parent: Element, tag: string): string {
  // Try with namespace
  let el = parent.getElementsByTagName(tag)[0];
  if (!el) {
    // Try without namespace prefix
    const allElements = parent.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      if (allElements[i].localName === tag) {
        el = allElements[i];
        break;
      }
    }
  }
  return el?.textContent?.trim() || '';
}

function getElements(parent: Element, tag: string): Element[] {
  const results: Element[] = [];
  const allElements = parent.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    if (allElements[i].localName === tag) {
      results.push(allElements[i]);
    }
  }
  return results;
}

export function parseNFeXML(xmlString: string): NFeData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Arquivo XML inválido. Verifique se é um XML de NF-e válido.');
  }

  // Find the NFe/infNFe element
  const infNFe = getElements(doc.documentElement, 'infNFe')[0];
  if (!infNFe) {
    throw new Error('XML não contém dados de NF-e válidos (infNFe não encontrado).');
  }

  // Extract key from Id attribute
  const key = (infNFe.getAttribute('Id') || '').replace('NFe', '');

  // Header - ide
  const ide = getElements(infNFe, 'ide')[0];
  const number = ide ? getTagText(ide, 'nNF') : '';
  const series = ide ? getTagText(ide, 'serie') : '';
  const dateStr = ide ? getTagText(ide, 'dhEmi') || getTagText(ide, 'dEmi') : '';
  const date = dateStr ? dateStr.substring(0, 10) : '';

  // Supplier - emit
  const emit = getElements(infNFe, 'emit')[0];
  const cnpj = emit ? getTagText(emit, 'CNPJ') : '';
  const name = emit ? getTagText(emit, 'xNome') : '';
  const fantasyName = emit ? getTagText(emit, 'xFant') : '';

  // Items - det
  const detElements = getElements(infNFe, 'det');
  const items: NFeItem[] = detElements.map(det => {
    const prod = getElements(det, 'prod')[0];
    const imposto = getElements(det, 'imposto')[0];

    let icms = 0, pis = 0, cofins = 0, ipi = 0;

    if (imposto) {
      // ICMS
      const icmsGroup = getElements(imposto, 'ICMS')[0];
      if (icmsGroup) {
        icms = parseFloat(getTagText(icmsGroup, 'vICMS')) || 0;
      }
      // PIS
      const pisGroup = getElements(imposto, 'PIS')[0];
      if (pisGroup) {
        pis = parseFloat(getTagText(pisGroup, 'vPIS')) || 0;
      }
      // COFINS
      const cofinsGroup = getElements(imposto, 'COFINS')[0];
      if (cofinsGroup) {
        cofins = parseFloat(getTagText(cofinsGroup, 'vCOFINS')) || 0;
      }
      // IPI
      const ipiGroup = getElements(imposto, 'IPI')[0];
      if (ipiGroup) {
        ipi = parseFloat(getTagText(ipiGroup, 'vIPI')) || 0;
      }
    }

    return {
      code: prod ? getTagText(prod, 'cProd') : '',
      name: prod ? getTagText(prod, 'xProd') : '',
      ncm: prod ? getTagText(prod, 'NCM') : '',
      cfop: prod ? getTagText(prod, 'CFOP') : '',
      unit: prod ? getTagText(prod, 'uCom') : '',
      quantity: prod ? parseFloat(getTagText(prod, 'qCom')) || 0 : 0,
      unitPrice: prod ? parseFloat(getTagText(prod, 'vUnCom')) || 0 : 0,
      totalPrice: prod ? parseFloat(getTagText(prod, 'vProd')) || 0 : 0,
      discount: prod ? parseFloat(getTagText(prod, 'vDesc')) || 0 : 0,
      taxes: { icms, pis, cofins, ipi },
    };
  });

  // Total
  const total = getElements(infNFe, 'total')[0];
  const icmsTot = total ? getElements(total, 'ICMSTot')[0] : null;
  const totalValue = icmsTot ? parseFloat(getTagText(icmsTot, 'vNF')) || 0 : items.reduce((s, i) => s + i.totalPrice, 0);

  // Payment
  const pag = getElements(infNFe, 'pag')[0];
  const detPag = pag ? getElements(pag, 'detPag')[0] : null;
  const paymentMethod = detPag ? getTagText(detPag, 'tPag') : undefined;

  return {
    number,
    series,
    key,
    date,
    supplier: { cnpj, name, fantasyName },
    items,
    totalValue,
    paymentMethod,
  };
}
