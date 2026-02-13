# Guía de Despliegue con GitHub Actions en Servidor Privado (VPN/Firewall)

Esta guía documenta cómo configurar el despliegue automático (CD) para **MultiPepGen** cuando el servidor de destino (`168.176.97.132`) se encuentra detrás de una VPN o Firewall institucional que bloquea conexiones SSH entrantes desde Internet (como las de los servidores de GitHub).

## Solución: GitHub Self-Hosted Runner

En lugar de que GitHub intente "entrar" al servidor (push), instalaremos un pequeño agente de GitHub **dentro** del servidor que "escucha" por nuevos trabajos (pull). Esto evita tener que abrir puertos o configurar VPNs complejas en GitHub.

### Paso 1: Crear el Runner en GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/Anorpe/multipepgen-ui` (o la URL correcta).
2. Navega a **Settings** > **Actions** > **Runners**.
3. Haz clic en el botón verde **New self-hosted runner**.
4. Selecciona la imagen del sistema operativo de tu servidor (probablemente **Linux**).

### Paso 2: Instalar el Agente en el Servidor

Deberás conectarte a tu servidor (vía VPN o estando en la red de la universidad) y ejecutar los comandos que GitHub te mostró en el paso anterior. Serán similares a estos:

```bash
# 1. Crear carpeta
mkdir actions-runner && cd actions-runner

# 2. Descargar el runner (el enlace específico te lo da GitHub)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# 3. Extraer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# 4. Configurar (necesitarás el token que te da GitHub en la página)
./config.sh --url https://github.com/TuUsuario/multipepgen-ui --token TU_TOKEN_AQUI
```

Durante la configuración (`./config.sh`), presiona Enter para aceptar los valores por defecto.
- **Name of runner group**: Default
- **Name of runner**: (puedes dejar el nombre del servidor o poner `multipepgen-runner`)
- **Work folder**: `_work`

### Paso 3: Ejecutar como Servicio (Segundo Plano)

Para que el runner siga funcionando aunque cierres la terminal, instálalo como servicio:

```bash
# Instalar el servicio
sudo ./svc.sh install

# Iniciar el servicio
sudo ./svc.sh start

# Verificar estado
sudo ./svc.sh status
```

### Paso 4: Actualizar el Workflow

Una vez instalado el runner, debes actualizar el archivo `.github/workflows/deploy.yml` para que use tu servidor en lugar de los de GitHub.

**Cambio clave:**
Cambiar `runs-on: ubuntu-latest` por `runs-on: self-hosted`.

**Ejemplo del archivo final (`deploy.yml`):**

```yaml
name: Deploy to Production (Self-Hosted)

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: self-hosted  # <--- ESTO ES LO IMPORTANTE
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy Application
        run: |
          # Como ya estamos DENTRO del servidor, no necesitamos SSH
          # Navegamos a la carpeta del proyecto (ajusta la ruta real)
          cd /home/laboratorio/multipepgen-ui
          
          # Actualizamos el código source
          git pull origin main
          
          # Reconstruimos los contenedores
          docker-compose -f docker-compose.prod.yml up -d --build
```

### Notas Importantes

1. **Rutas Absolutas:** Asegúrate de que el comando `cd` en el paso de deploy apunte a la carpeta real donde está tu proyecto en el servidor.
2. **Permisos Docker:** El usuario que ejecuta el runner (probablemente `laboratorio` o `root`) debe tener permisos para ejecutar comandos de `docker`.
3. **Mantenimiento:** Este runner se actualizará automáticamente, pero si el servidor se reinicia, asegúrate de que el servicio arranque (el script `install` suele configurar esto automáticamente con systemd).
