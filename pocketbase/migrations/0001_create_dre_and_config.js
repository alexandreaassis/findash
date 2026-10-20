migrate(
  (app) => {
    // 1. app_config collection: armazena a senha de acesso da cliente e metadados da empresa/planilha
    const appConfig = new Collection({
      name: 'app_config',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'config_key', type: 'text', required: true },
        { name: 'config_value', type: 'text' },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_app_config_key ON app_config (config_key)'],
    })
    app.save(appConfig)

    // 2. dre_entries collection: registros do DRE por ano, mês ou acumulado
    const dreEntries = new Collection({
      name: 'dre_entries',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'year', type: 'number', required: true },
        {
          name: 'period_type',
          type: 'select',
          required: true,
          values: ['monthly', 'ytd', 'summary'],
          maxSelect: 1,
        },
        { name: 'month', type: 'number', min: 1, max: 12 },
        { name: 'month_name', type: 'text' },
        // Receitas
        { name: 'gross_revenue', type: 'number' },
        // Deduções detalhadas
        { name: 'deductions_taxes', type: 'number' },
        { name: 'deductions_costs', type: 'number' },
        { name: 'deductions_returns', type: 'number' },
        { name: 'deductions_commissions', type: 'number' },
        { name: 'deductions_royalties', type: 'number' },
        { name: 'deductions_marketing', type: 'number' },
        { name: 'deductions_freight', type: 'number' },
        { name: 'total_deductions', type: 'number' },
        // Margem de contribuição
        { name: 'contribution_margin', type: 'number' },
        { name: 'contribution_margin_pct', type: 'number' },
        // Despesas operacionais detalhadas
        { name: 'expenses_admin', type: 'number' },
        { name: 'expenses_commercial', type: 'number' },
        { name: 'expenses_financial', type: 'number' },
        { name: 'expenses_personnel', type: 'number' },
        { name: 'total_expenses', type: 'number' },
        // Resultado operacional
        { name: 'operating_result', type: 'number' },
        { name: 'operating_result_pct', type: 'number' },
        // Campos livres para anotações ou dados adicionais em JSON
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_dre_year_month ON dre_entries (year, month)',
        'CREATE INDEX idx_dre_period_type ON dre_entries (year, period_type)',
      ],
    })
    app.save(dreEntries)

    // 3. dre_notes collection: notas explicativas sobre períodos, fontes e regras de leitura dos dados
    const dreNotes = new Collection({
      name: 'dre_notes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['period', 'source', 'methodology', 'general'],
          maxSelect: 1,
        },
        { name: 'content', type: 'text', required: true },
        { name: 'order_num', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(dreNotes)

    // 4. Inserir senha padrão inicial em app_config (ex: "cliente2026")
    const configRecord = new Record(appConfig)
    configRecord.set('config_key', 'client_access_password')
    configRecord.set('config_value', 'cliente2026')
    configRecord.set(
      'description',
      'Senha única para visualização privada da página financeira da cliente',
    )
    app.save(configRecord)

    // Inserir notas explicativas padrão
    const note1 = new Record(dreNotes)
    note1.set('title', 'Período de Análise e Recorte Jan–Set')
    note1.set('category', 'period')
    note1.set('order_num', 1)
    note1.set(
      'content',
      'Os dados comparativos entre 2025 e 2026 contemplam rigorosamente o período de Janeiro a Setembro (Jan–Set), garantindo perfeita simetria e comparabilidade entre os exercícios sem distorções de sazonalidade do último trimestre.',
    )
    app.save(note1)

    const note2 = new Record(dreNotes)
    note2.set('title', 'Fonte dos Dados e Conciliação')
    note2.set('category', 'source')
    note2.set('order_num', 2)
    note2.set(
      'content',
      'Informações extraídas diretamente da planilha DRE consolidada da empresa. Todas as deduções, custos variáveis e despesas fixas foram validadas e classificadas segundo o regime de competência contábil.',
    )
    app.save(note2)

    const note3 = new Record(dreNotes)
    note3.set('title', 'Margem de Contribuição e Fretes em 2026')
    note3.set('category', 'methodology')
    note3.set('order_num', 3)
    note3.set(
      'content',
      'A Margem de Contribuição representa a Receita Bruta deduzida de impostos, custos mercantis, devoluções, comissões, royalties e investimentos em propaganda. No exercício de 2026, foi adicionada a rubrica de fretes às deduções variáveis, refletindo o modelo de entrega expandido.',
    )
    app.save(note3)

    const note4 = new Record(dreNotes)
    note4.set('title', 'Classificação das Despesas Operacionais')
    note4.set('category', 'methodology')
    note4.set('order_num', 4)
    note4.set(
      'content',
      'As despesas operacionais estão divididas em 4 pilares: Administrativo (estrutura corporativa, licenças, contabilidade), Comercial (equipe comercial externa e marketing institucional), Financeiro (tarifas, juros e taxas de meios de pagamento) e Funcionários (folha salarial, encargos e benefícios).',
    )
    app.save(note4)
  },
  (app) => {
    try {
      const dreNotes = app.findCollectionByNameOrId('dre_notes')
      app.delete(dreNotes)
    } catch (_) {}
    try {
      const dreEntries = app.findCollectionByNameOrId('dre_entries')
      app.delete(dreEntries)
    } catch (_) {}
    try {
      const appConfig = app.findCollectionByNameOrId('app_config')
      app.delete(appConfig)
    } catch (_) {}
  },
)
