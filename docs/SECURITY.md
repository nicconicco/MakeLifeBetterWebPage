# Seguranca

## Regras do Firestore
- Trate `ADMIN_EMAILS` apenas como conveniencia de UI; nao e controle de acesso real.
- Prefira regras baseadas em custom claims (ex: `request.auth.token.admin == true`).
- Regra minima sugerida: usuario so pode ler/escrever o proprio documento em `users`.

## Storage
- Restrinja uploads a usuarios autenticados.
- Valide tamanho e tipo de arquivo (imagens) nas regras.

## Segredos e chaves
- Tokens (PagBank/Rede) ficam apenas em `functions/` via variaveis de ambiente.
- Nunca exponha tokens privados no front-end.

## CORS e origem
- Ajuste `ALLOWED_ORIGINS` ou `STORE_BASE_URL` nas Functions para limitar origens permitidas.
- Em producao, use apenas o dominio oficial.

## Webhooks
- Mantenha a validacao do `x-authenticity-token` ativa.
- Registre log de payloads suspeitos e erros de validacao.

## Rotacao e incidentes
- Rotacione tokens periodicamente.
- Se houver vazamento, revogue e gere novas credenciais imediatamente.
