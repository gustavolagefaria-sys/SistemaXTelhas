@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ============================================================
::   INSTALADOR — Sistema X-Telhas
::   Next.js + PostgreSQL + PM2 (Serviço Windows)
::   Execute como ADMINISTRADOR
:: ============================================================

title Instalador — Sistema X-Telhas

color 0A
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║           INSTALADOR — SISTEMA X-TELHAS                 ║
echo  ║     Relatório Financeiro   ^|   Versão 1.0.0             ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ── Verificar se está rodando como Administrador ─────────────
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo  [ERRO] Este instalador precisa ser executado como ADMINISTRADOR.
    echo.
    echo  Clique com o botão direito no arquivo e escolha:
    echo  "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo  [OK] Permissões de administrador confirmadas.
echo.

:: ── Pasta de instalação ───────────────────────────────────────
set "INSTALL_DIR=C:\Sistemas\SistemaXTelhas"
set "REPO_URL=https://github.com/gustavolagefaria-sys/SistemaXTelhas"
set "SERVICE_NAME=SistemaXTelhas"
set "APP_PORT=3000"

echo  Diretório de instalação: %INSTALL_DIR%
echo  Porta da aplicação:      %APP_PORT%
echo.
echo  Pressione qualquer tecla para iniciar ou feche para cancelar...
pause >nul

:: ══════════════════════════════════════════════════════════════
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  ETAPA 1 — Verificando pré-requisitos                   │
echo  └─────────────────────────────────────────────────────────┘
echo.

:: ── Verificar Node.js ─────────────────────────────────────────
echo  Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] Node.js não encontrado!
    echo.
    echo  Por favor, instale o Node.js LTS antes de continuar:
    echo  https://nodejs.org/en/download
    echo.
    echo  Após instalar, execute este script novamente.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% encontrado.

:: ── Verificar npm ─────────────────────────────────────────────
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo  [ERRO] npm não encontrado. Reinstale o Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo  [OK] npm %NPM_VER% encontrado.

:: ── Verificar Git ─────────────────────────────────────────────
echo  Verificando Git...
git --version >nul 2>&1
if %errorLevel% neq 0 (
    color 0E
    echo  [AVISO] Git nao encontrado. O projeto sera baixado via ZIP.
    set "USE_GIT=0"
) else (
    for /f "tokens=*" %%v in ('git --version') do set GIT_VER=%%v
    echo  [OK] %GIT_VER% encontrado.
    set "USE_GIT=1"
)

:: ── Verificar PostgreSQL ──────────────────────────────────────
echo  Verificando PostgreSQL...
psql --version >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] PostgreSQL nao encontrado no PATH!
    echo.
    echo  Por favor, instale o PostgreSQL antes de continuar:
    echo  https://www.postgresql.org/download/windows/
    echo.
    echo  Durante a instalação, anote a senha do usuario "postgres".
    echo  Após instalar, execute este script novamente.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('psql --version') do set PG_VER=%%v
echo  [OK] %PG_VER% encontrado.

:: ══════════════════════════════════════════════════════════════
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  ETAPA 2 — Senha do PostgreSQL                          │
echo  └─────────────────────────────────────────────────────────┘
echo.
echo  Digite a senha do usuario "postgres" do PostgreSQL
echo  (a senha que voce definiu durante a instalacao do PostgreSQL):
echo.
set /p "PG_PASSWORD=  Senha: "

if "!PG_PASSWORD!"=="" (
    color 0C
    echo.
    echo  [ERRO] A senha nao pode ser vazia.
    pause
    exit /b 1
)

:: ── Testar conexão com o banco ────────────────────────────────
echo.
echo  Testando conexao com o banco de dados...
set PGPASSWORD=!PG_PASSWORD!
psql -U postgres -c "SELECT 1;" >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] Nao foi possivel conectar ao PostgreSQL.
    echo  Verifique se:
    echo    - O servico PostgreSQL esta rodando
    echo    - A senha digitada esta correta
    echo    - O PostgreSQL esta instalado corretamente
    pause
    exit /b 1
)
echo  [OK] Conexao com PostgreSQL estabelecida com sucesso.

:: ── Criar banco de dados xtelhas ─────────────────────────────
echo  Criando banco de dados "xtelhas" (se nao existir)...
psql -U postgres -c "CREATE DATABASE xtelhas;" >nul 2>&1
echo  [OK] Banco de dados pronto.

:: ══════════════════════════════════════════════════════════════
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  ETAPA 3 — Download do projeto                          │
echo  └─────────────────────────────────────────────────────────┘
echo.

:: ── Criar diretório de instalação ────────────────────────────
if not exist "C:\Sistemas" mkdir "C:\Sistemas"

if exist "%INSTALL_DIR%" (
    echo  [AVISO] Pasta %INSTALL_DIR% ja existe.
    echo  Deseja substituir a instalacao existente? (S/N)
    set /p "OVERWRITE=  Resposta: "
    if /i "!OVERWRITE!"=="S" (
        echo  Removendo instalacao anterior...
        :: Parar serviço se existir
        pm2 stop %SERVICE_NAME% >nul 2>&1
        pm2 delete %SERVICE_NAME% >nul 2>&1
        rmdir /s /q "%INSTALL_DIR%"
        echo  [OK] Instalacao anterior removida.
    ) else (
        echo  Instalacao cancelada pelo usuario.
        pause
        exit /b 0
    )
)

:: ── Baixar o projeto ─────────────────────────────────────────
if "!USE_GIT!"=="1" (
    echo  Clonando repositorio via Git...
    git clone %REPO_URL%.git "%INSTALL_DIR%"
    if %errorLevel% neq 0 (
        color 0C
        echo  [ERRO] Falha ao clonar o repositorio.
        echo  Verifique sua conexao com a internet.
        pause
        exit /b 1
    )
) else (
    echo  Baixando projeto via ZIP...
    powershell -Command "Invoke-WebRequest -Uri '%REPO_URL%/archive/refs/heads/main.zip' -OutFile 'C:\Sistemas\SistemaXTelhas.zip'"
    if %errorLevel% neq 0 (
        color 0C
        echo  [ERRO] Falha ao baixar o projeto.
        echo  Verifique sua conexao com a internet.
        pause
        exit /b 1
    )
    echo  Extraindo ZIP...
    powershell -Command "Expand-Archive -Path 'C:\Sistemas\SistemaXTelhas.zip' -DestinationPath 'C:\Sistemas\' -Force"
    rename "C:\Sistemas\SistemaXTelhas-main" "SistemaXTelhas"
    del "C:\Sistemas\SistemaXTelhas.zip"
)

echo  [OK] Projeto baixado em %INSTALL_DIR%

:: ══════════════════════════════════════════════════════════════
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  ETAPA 4 — Configurando variaveis de ambiente (.env)    │
echo  └─────────────────────────────────────────────────────────┘
echo.

:: ── Gerar NEXTAUTH_SECRET aleatório ──────────────────────────
for /f "tokens=*" %%s in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set "SECRET=%%s"

:: ── Criar arquivo .env ───────────────────────────────────────
(
    echo DATABASE_URL="postgresql://postgres:!PG_PASSWORD!@localhost:5432/xtelhas"
    echo NEXTAUTH_SECRET="!SECRET!"
    echo NEXTAUTH_URL="http://localhost:%APP_PORT%"
    echo NODE_ENV="production"
) > "%INSTALL_DIR%\.env"

echo  [OK] Arquivo .env criado com sucesso.

:: ══════════════════════════════════════════════════════════════
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  ETAPA 5 — Instalando dependencias npm                  │
echo  └─────────────────────────────────────────────────────────┘
echo.

cd /d "%INSTALL_DIR%"
echo  Isso pode demorar alguns minutos...
echo.
npm install
if %errorLevel% neq 0 (
    color 0C
    echo  [ERRO] Falha ao instalar dependencias npm.
    pause
    exit /b 1
)
echo.
echo  [OK] Dependencias instaladas.

:: ══════════════════════════════════════════════════════════════
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  ETAPA 6 — Configurando banco de dados (Prisma)         │
echo  └─────────────────────────────────────────════════════════┘
echo.

echo  Criando tabelas no banco...
npm run db:push
if %errorLevel% neq 0 (
    color 0C
    echo  [ERRO] Falha ao criar tabelas no banco.
    echo  Verifique as configuracoes do PostgreSQL e do arquivo .env
    pause
    exit /b 1
)
echo  [OK] Tabelas criadas.

echo.
echo  Populando banco com dados iniciais...
npm run db:seed
if %errorLevel% neq 0 (
    color 0E
    echo  [AVISO] Falha ao popular o banco (pode ja ter dados). Continuando...
) else (
    echo  [OK] Dados iniciais inseridos.
)

:: ══════════════════════════════════════════════════════════════
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  ETAPA 7 — Build da aplicacao Next.js                   │
echo  └─────────────────────────────────────────────────────────┘
echo.

echo  Compilando aplicacao (pode demorar alguns minutos)...
echo.
npm run build
if %errorLevel% neq 0 (
    color 0C
    echo  [ERRO] Falha no build da aplicacao.
    pause
    exit /b 1
)
echo.
echo  [OK] Build concluido.

:: ══════════════════════════════════════════════════════════════
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  ETAPA 8 — Instalando PM2 (servico Windows)             │
echo  └─────────────────────────────────────────────────────────┘
echo.

:: ── Instalar PM2 ─────────────────────────────────────────────
echo  Instalando PM2 globalmente...
npm install -g pm2 >nul 2>&1
echo  [OK] PM2 instalado.

echo  Instalando pm2-installer...
npm install -g pm2-installer >nul 2>&1

echo  Configurando PM2 como servico do Windows...
pm2-installer install >nul 2>&1
echo  [OK] Servico PM2 configurado.

:: ── Registrar aplicação no PM2 ───────────────────────────────
echo  Registrando aplicacao no PM2...
pm2 stop %SERVICE_NAME% >nul 2>&1
pm2 delete %SERVICE_NAME% >nul 2>&1
pm2 start npm --name "%SERVICE_NAME%" -- start
if %errorLevel% neq 0 (
    color 0C
    echo  [ERRO] Falha ao iniciar a aplicacao no PM2.
    pause
    exit /b 1
)

pm2 save
echo  [OK] Aplicacao registrada e salva no PM2.

:: ══════════════════════════════════════════════════════════════
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  ETAPA 9 — Firewall do Windows                          │
echo  └─────────────────────────────────────────────────────────┘
echo.

echo  Liberando porta %APP_PORT% no Firewall do Windows...
netsh advfirewall firewall delete rule name="SistemaXTelhas" >nul 2>&1
netsh advfirewall firewall add rule name="SistemaXTelhas" dir=in action=allow protocol=TCP localport=%APP_PORT%
if %errorLevel% neq 0 (
    color 0E
    echo  [AVISO] Nao foi possivel configurar o Firewall automaticamente.
    echo  Configure manualmente: Painel de Controle → Firewall → Porta %APP_PORT%
) else (
    echo  [OK] Porta %APP_PORT% liberada no Firewall.
)

:: ══════════════════════════════════════════════════════════════
echo.
echo  Aguardando aplicacao inicializar...
timeout /t 5 /nobreak >nul

:: ── Verificar se está rodando ────────────────────────────────
pm2 status %SERVICE_NAME% | findstr "online" >nul 2>&1
if %errorLevel% neq 0 (
    color 0E
    echo  [AVISO] A aplicacao pode ainda estar iniciando.
    echo  Verifique com: pm2 status
) else (
    echo  [OK] Aplicacao rodando com sucesso!
)

:: ── Descobrir IP local ───────────────────────────────────────
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    set "LOCAL_IP=%%i"
    goto :found_ip
)
:found_ip
set "LOCAL_IP=!LOCAL_IP: =!"

:: ══════════════════════════════════════════════════════════════
color 0A
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║         INSTALAÇÃO CONCLUÍDA COM SUCESSO!               ║
echo  ╠══════════════════════════════════════════════════════════╣
echo  ║                                                          ║
echo  ║  Acesso local:                                           ║
echo  ║    http://localhost:%APP_PORT%                                  ║
echo  ║                                                          ║
echo  ║  Acesso pela rede:                                       ║
echo  ║    http://!LOCAL_IP!:%APP_PORT%                          ║
echo  ║                                                          ║
echo  ║  Login inicial:                                          ║
echo  ║    E-mail : admin@xtelhas.com                            ║
echo  ║    Senha  : admin123                                     ║
echo  ║    ⚠  Troque a senha apos o primeiro acesso!            ║
echo  ║                                                          ║
echo  ║  Instalado em: %INSTALL_DIR%      ║
echo  ║                                                          ║
echo  ╠══════════════════════════════════════════════════════════╣
echo  ║  COMANDOS UTEIS (abrir novo terminal como admin):        ║
echo  ║    pm2 status              → ver status                  ║
echo  ║    pm2 logs SistemaXTelhas → ver logs                    ║
echo  ║    pm2 restart SistemaXTelhas → reiniciar                ║
echo  ║    pm2 stop SistemaXTelhas    → parar                    ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ── Criar atalho no Desktop para abrir no navegador ──────────
echo  Criando atalho na area de trabalho...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Sistema XTelhas.lnk'); $s.TargetPath = 'http://localhost:%APP_PORT%'; $s.Save()"
echo  [OK] Atalho criado na area de trabalho.

echo.
echo  Pressione qualquer tecla para abrir o sistema no navegador...
pause >nul
start http://localhost:%APP_PORT%

endlocal
exit /b 0
