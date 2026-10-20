migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('dre_entries')

    // Limpar dados anteriores de exemplo/amostra do banco
    try {
      app.truncateCollection(col)
    } catch (err) {
      console.log('Aviso ao limpar dre_entries:', err)
    }

    // Adiciona novos campos opcionais para suporte avançado de fechamento
    if (!col.fields.getByName('has_closing')) {
      col.fields.add(new BoolField({ name: 'has_closing' }))
    }
    if (!col.fields.getByName('accumulated_result')) {
      col.fields.add(new NumberField({ name: 'accumulated_result' }))
    }
    if (!col.fields.getByName('annual_total')) {
      col.fields.add(new NumberField({ name: 'annual_total' }))
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('dre_entries')
      if (col.fields.getByName('has_closing')) {
        col.fields.removeByName('has_closing')
      }
      if (col.fields.getByName('accumulated_result')) {
        col.fields.removeByName('accumulated_result')
      }
      if (col.fields.getByName('annual_total')) {
        col.fields.removeByName('annual_total')
      }
      app.save(col)
    } catch (_) {}
  },
)
