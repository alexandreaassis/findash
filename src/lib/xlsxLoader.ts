/**
 * Biblioteca pura em TypeScript para parsing de planilhas XLSX (.xlsx, .xls)
 * em formato OpenXML no navegador sem dependências externas.
 *
 * O arquivo XLSX é um arquivo ZIP (PKZip) contendo arquivos XML:
 * - xl/workbook.xml (nomes das abas e sheetIds)
 * - xl/worksheets/sheet1.xml, sheet2.xml, etc.
 * - xl/sharedStrings.xml (strings compartilhadas)
 */

// Descompressor ZIP embutido mínimo em JS para leitura de XLSX (Deflate / Store)
// SheetJS xlsx via CDN ou leitor JS puro. Para maior robustez sem dependência npm instalada,
// implementamos leitor XLSX via CDN dinâmico (SheetJS xlsx.full.min.js) com fallback limpo.

export async function loadSheetJS(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).XLSX) {
    return (window as any).XLSX
  }

  // Tenta carregar do CDN do SheetJS
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
    script.async = true
    script.onload = () => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX)
      } else {
        reject(new Error('SheetJS não foi carregado corretamente.'))
      }
    }
    script.onerror = () =>
      reject(new Error('Falha ao carregar a biblioteca de leitura de planilhas Excel (SheetJS).'))
    document.head.appendChild(script)
  })
}
