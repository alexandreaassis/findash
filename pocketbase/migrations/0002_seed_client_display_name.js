migrate(
  (app) => {
    try {
      const appConfig = app.findCollectionByNameOrId('app_config')

      // Verificar se o registro já existe para não duplicar
      try {
        app.findFirstRecordByData('app_config', 'config_key', 'client_display_name')
      } catch (_) {
        const record = new Record(appConfig)
        record.set('config_key', 'client_display_name')
        record.set('config_value', 'Cliente - 3MR Catuaí')
        record.set('description', 'Nome da empresa cliente exibido nos cabeçalhos e relatórios')
        app.save(record)
      }
    } catch (err) {
      console.log('Erro ao criar client_display_name em app_config:', err)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('app_config', 'config_key', 'client_display_name')
      app.delete(record)
    } catch (_) {}
  },
)
