# Hook PreToolUse: bloqueia edição de arquivos sensíveis (.env*, chaves, certificados).
# Exit 2 bloqueia a ferramenta e envia a mensagem de stderr ao Claude.

$entrada = [Console]::In.ReadToEnd() | ConvertFrom-Json
$caminho = $entrada.tool_input.file_path
if (-not $caminho) { exit 0 }

$nome = [System.IO.Path]::GetFileName($caminho)
$protegidos = @('^\.env', '\.pem$', '\.key$', '\.pfx$', '\.p12$')

foreach ($padrao in $protegidos) {
    if ($nome -match $padrao) {
        [Console]::Error.WriteLine("Arquivo protegido: '$nome'. Edicao bloqueada pelo hook proteger-arquivos. Peca ao usuario para alterar manualmente.")
        exit 2
    }
}
exit 0
