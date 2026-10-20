migrate(
  (app) => {
    try {
      const appConfig = app.findCollectionByNameOrId('app_config')

      // Senha inicial de administração A3ONE: "a3one2026"
      // Armazenamos o hash SHA-256 no banco
      const initialAdminPassword = 'a3one2026'
      const hashed = $security.sha256(initialAdminPassword)

      try {
        const record = app.findFirstRecordByData('app_config', 'config_key', 'admin_password')
        // Se já existe mas está sem valor ou diferente, mantemos ou atualizamos
        if (!record.getString('config_value')) {
          record.set('config_value', hashed)
          app.save(record)
        }
      } catch (_) {
        const record = new Record(appConfig)
        record.set('config_key', 'admin_password')
        record.set('config_value', hashed)
        record.set(
          'description',
          'Hash SHA-256 da senha de administração exclusiva da A3ONE para alterar configurações',
        )
        app.save(record)
      }
    } catch (err) {
      console.log('Erro ao configurar admin_password em app_config:', err)
      throw err
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('app_config', 'config_key', 'admin_password')
      app.delete(record)
    } catch (_) {}
  },
)
